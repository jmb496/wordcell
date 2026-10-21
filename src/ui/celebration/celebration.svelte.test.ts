import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../../engine/index';
import { createCelebration } from './celebration.svelte';
import { launch, step } from './step';

// AD-19 (R-87): the run controller over a fake document and rAF (the unit environment is `node`).
const mocked = vi.hoisted(() => ({ motion: { baseMs: 180, reduced: false } }));
vi.mock('../../shell/prefs.svelte', () => ({
  BASE_MS: { fast: 90, normal: 180, slow: 320 },
  prefs: {
    get motion() {
      return mocked.motion;
    },
  },
}));

type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};
const rect = (left: number, top: number, width: number, height: number): Rect => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});

let present: Set<string>;
let frames: Map<number, (t: number) => void>;
let nextFrame: number;
let cancelled: number[];

function el(r: Rect, extra: object = {}) {
  return { getBoundingClientRect: () => r, ...extra };
}

beforeEach(() => {
  mocked.motion = { baseMs: 180, reduced: false };
  present = new Set(['topBar', 'actionBar', 'board', ...[3, 4, 5, 6].map((n) => `cell${n}`)]);
  frames = new Map();
  nextFrame = 1;
  cancelled = [];
  vi.stubGlobal('document', {
    documentElement: { clientWidth: 360 },
    querySelector(selector: string) {
      const cell =
        /wordcell-(\d+)/.exec(selector)?.[1] ?? /data-wordcell-label="(\d+)"/.exec(selector)?.[1];
      if (selector.includes('topBar'))
        return present.has('topBar') ? el(rect(0, 0, 360, 56)) : null;
      if (selector.includes('actionBar'))
        return present.has('actionBar') ? el(rect(0, 556, 360, 56)) : null;
      if (selector === '.board-root') return present.has('board') ? el(rect(0, 0, 360, 600)) : null;
      if (cell !== undefined) {
        if (!present.has(`cell${cell}`)) return null;
        return el(rect(20 + Number(cell) * 40, 480, 20, 16));
      }
      return null;
    },
  });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '40px' }));
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
    frames.set(nextFrame, cb);
    return nextFrame++;
  });
  vi.stubGlobal('cancelAnimationFrame', (h: number) => {
    cancelled.push(h);
    frames.delete(h);
  });
});
afterEach(() => vi.unstubAllGlobals());

const faces = Array.from({ length: 52 }, (_, i) => ({
  letter: String.fromCharCode(65 + (i % 26)),
  letterCount: 1,
}));
const viewOf = (cells: readonly number[], letters = 3): GameView =>
  ({
    faces,
    wordList: cells.map((cell, i) => ({
      spelling: 'abc',
      letterCount: letters,
      cards: Array.from({ length: letters }, (_, k) => i * 5 + k),
      cell,
    })),
  }) as unknown as GameView;
const empty = { faces } as unknown as GameView;

type FakeEl = { style: { transform: string; opacity: string } };
const fakeEls = (n: number): FakeEl[] =>
  Array.from({ length: n }, () => ({ style: { transform: '', opacity: '' } }));
const asEls = (e: FakeEl[]) => e as unknown as HTMLElement[];
const tick = (t: number) => {
  const [h, cb] = [...frames.entries()][0] as [number, (t: number) => void];
  frames.delete(h);
  cb(t);
};

describe('AD-19 celebration controller', () => {
  it('AD-19 an empty or absent list ends at once: onEnd then done once, no rAF; start after and inside done is legal', () => {
    const c = createCelebration();
    const order: string[] = [];
    c.onEnd(() => order.push('onEnd'));
    c.start(empty, () => order.push('done'));
    expect(order).toEqual(['onEnd', 'done']);
    expect(frames.size).toBe(0);
    expect(c.running()).toBe(false);
    c.start({ ...empty, wordList: [] } as unknown as GameView, () => {
      order.push('done2');
      c.start(viewOf([3]), () => undefined);
    });
    expect(order).toEqual(['onEnd', 'done', 'onEnd', 'done2']);
    expect(c.running()).toBe(true);
    c.cancel();
    c.start(viewOf([3]), () => undefined);
    expect(c.running()).toBe(true);
  });

  it('AD-19 start throws with no wordcell element, and leaves no run active', () => {
    const c = createCelebration();
    present.delete('cell4');
    expect(() => c.start(viewOf([3, 4]), () => undefined)).toThrow(/wordcell-4/);
    expect(c.running()).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('AD-19 start throws while a run is active (checked first), as does setManual', () => {
    const c = createCelebration();
    c.start(viewOf([3]), () => undefined);
    present.clear();
    expect(() => c.start(empty, () => undefined)).toThrow(/active/);
    expect(() => c.setManual(true)).toThrow(/active/);
    c.cancel();
  });

  it('AD-19 rAF drives the run: first frame dt 0, then the difference clamped to [0, 50]', () => {
    const c = createCelebration();
    c.start(viewOf([3]), () => undefined);
    const els = fakeEls(1);
    c.register(asEls(els));
    const at = () => els[0]?.style.transform;
    tick(1000);
    const t0 = at(); // dt 0: the group sits at its origin
    tick(1000);
    expect(at()).toBe(t0);
    tick(1020);
    const t20 = at();
    expect(t20).not.toBe(t0);
    tick(1020 + 400); // clamped to 50 ms
    const t50 = at();
    tick(1020 + 400 - 30); // negative difference: clamped to 0
    expect(at()).toBe(t50);
    c.cancel();
    expect(t0).toMatch(/^translate\(/);
  });

  it('AD-19 frames before registration step without writes', () => {
    const c = createCelebration();
    c.start(viewOf([3]), () => undefined);
    tick(0);
    tick(16);
    const els = fakeEls(1);
    c.register(asEls(els));
    expect(els[0]?.style.transform).toBe('');
    tick(32);
    expect(els[0]?.style.transform).not.toBe('');
  });

  it('AD-19 a stubbed-rAF run ends at the cap with no frame pending, calling onEnd then done once', () => {
    const c = createCelebration();
    const order: string[] = [];
    c.onEnd(() => order.push('onEnd'));
    c.start(viewOf([3, 4, 5]), () => order.push('done'));
    c.register(asEls(fakeEls(3)));
    let t = 0;
    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      t += 50;
      tick(t);
    }
    expect(order).toEqual(['onEnd', 'done']);
    expect(frames.size).toBe(0);
    expect(c.running()).toBe(false);
  });

  it('AD-19 end() calls done once, is idempotent, cancels the frame and clears the run', () => {
    const c = createCelebration();
    const done = vi.fn();
    const onEnd = vi.fn();
    c.end();
    c.cancel();
    c.onEnd(onEnd);
    c.start(viewOf([3]), done);
    expect(frames.size).toBe(1);
    c.end();
    c.end();
    c.cancel();
    expect(done).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(c.running()).toBe(false);
    expect(frames.size).toBe(0);
    expect(cancelled).toHaveLength(1);
  });

  it('AD-19 cancel() mid-run: running() false, no frame pending, neither callback called, a later start works', () => {
    const c = createCelebration();
    const done = vi.fn();
    const onEnd = vi.fn();
    c.onEnd(onEnd);
    c.start(viewOf([3]), done);
    c.cancel();
    c.end();
    expect(c.running()).toBe(false);
    expect(frames.size).toBe(0);
    expect(done).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
    c.start(viewOf([3]), done);
    expect(c.running()).toBe(true);
    expect(frames.size).toBe(1);
    c.cancel();
  });

  it('AD-19 onEnd is one handler, replaced by a later call and kept across runs', () => {
    const c = createCelebration();
    const a = vi.fn();
    const b = vi.fn();
    c.onEnd(a);
    c.onEnd(b);
    for (let i = 0; i < 2; i++) {
      c.start(viewOf([3]), () => undefined);
      c.end();
    }
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(2);
  });

  describe('manual clock', () => {
    it('AD-19 no rAF is scheduled while manual; setManual is read at start and later start picks up a change', () => {
      const c = createCelebration();
      c.setManual(true);
      c.start(viewOf([3]), () => undefined);
      expect(frames.size).toBe(0);
      expect(() => c.setManual(false)).toThrow();
      // The run keeps its driver: advance still works after the failed toggle.
      const els = fakeEls(1);
      c.register(asEls(els));
      c.advance(32);
      expect(els[0]?.style.opacity).toBe('1');
      c.cancel();
      c.setManual(false);
      c.start(viewOf([3]), () => undefined);
      expect(frames.size).toBe(1);
      c.advance(100);
      expect(frames.size).toBe(1);
      c.cancel();
    });

    it('AD-19 advance does nothing when idle, not manual or ms <= 0 (no step, no render, remainder untouched)', () => {
      const c = createCelebration();
      const els = fakeEls(1);
      c.register(asEls(els));
      c.advance(100);
      c.start(viewOf([3]), () => undefined);
      c.advance(100);
      expect(els[0]?.style.transform).toBe('');
      c.cancel();
      c.setManual(true);
      c.start(viewOf([3]), () => undefined);
      c.advance(0);
      c.advance(-5);
      expect(els[0]?.style.transform).toBe('');
      // Remainder untouched: 10 + 10 ms makes one 16 ms step (two renders, one step).
      c.advance(10);
      expect(els[0]?.style.transform).toBe('');
      c.advance(10);
      expect(els[0]?.style.transform).not.toBe('');
      c.cancel();
    });

    it('AD-19 advance runs 16 ms sub-steps, carries the remainder, and clears it at start', () => {
      const c = createCelebration();
      c.setManual(true);
      const els = fakeEls(1);
      c.register(asEls(els));
      c.start(viewOf([3]), () => undefined);
      c.advance(10); // zero steps, one render
      const before = els[0]?.style.transform;
      expect(before).toBe('');
      c.advance(10); // carried 10 + 10: one step
      const one = els[0]?.style.transform;
      expect(one).not.toBe('');
      c.cancel();
      // A fresh run: the carried 4 ms is gone, so 12 ms is still zero steps.
      c.start(viewOf([3]), () => undefined);
      const fresh = fakeEls(1);
      c.register(asEls(fresh));
      c.advance(12);
      expect(fresh[0]?.style.transform).toBe('');
      c.advance(4);
      expect(fresh[0]?.style.transform).not.toBe('');
      c.cancel();
    });

    it('AD-19 advance past the cap ends the run once, then does nothing', () => {
      const c = createCelebration();
      c.setManual(true);
      const done = vi.fn();
      const onEnd = vi.fn();
      c.onEnd(onEnd);
      c.start(viewOf([3, 4]), done);
      c.advance(60000);
      expect(done).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
      expect(c.running()).toBe(false);
      c.advance(1000);
      expect(done).toHaveBeenCalledTimes(1);
      expect(frames.size).toBe(0);
    });

    it('AD-19 nothing happens after end(): advance is idle', () => {
      const c = createCelebration();
      c.setManual(true);
      const els = fakeEls(1);
      c.register(asEls(els));
      c.start(viewOf([3]), () => undefined);
      c.end();
      c.advance(500);
      expect(els[0]?.style.transform).toBe('');
    });
  });

  it('AD-19 frames write the transform and opacity step derives from the stubbed rects', () => {
    const c = createCelebration();
    c.setManual(true);
    const els = fakeEls(1);
    c.register(asEls(els));
    c.start(viewOf([3]), () => undefined);
    c.advance(32);
    // Cell 3's label rect is (140, 480, 20 x 16) and the band top 56: origin (150, 432).
    let state = launch({
      groups: [{ x: 150, y: 432, letters: 3 }],
      cardW: 40,
      cardH: 53,
      floor: 500,
      ceiling: 0,
      walls: { left: 0, right: 360 },
      capMs: 6000,
      baseMs: 180,
    });
    state = step(step(state, 16), 16);
    const g = state.groups[0];
    expect(g?.opacity).toBe(1);
    expect(els[0]?.style.transform).toBe(
      `translate(${(g?.x ?? 0) - (g?.w ?? 0) / 2}px, ${(g?.y ?? 0) - (g?.h ?? 0) / 2}px) scale(${g?.scale})`,
    );
    expect(els[0]?.style.opacity).toBe('1');
    c.cancel();
  });

  it('AD-19 at Slow (baseMs 320) the run is not finished at 6000 ms and finishes by about 10667 ms', () => {
    mocked.motion = { baseMs: 320, reduced: false };
    const c = createCelebration();
    c.setManual(true);
    const done = vi.fn();
    c.start(viewOf(Array.from({ length: 30 }, (_, i) => 3 + (i % 4))), done);
    c.advance(6000);
    expect(done).not.toHaveBeenCalled();
    expect(c.running()).toBe(true);
    c.advance(4700);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('AD-19 registering the wrong number of elements throws on the next render', () => {
    const c = createCelebration();
    c.setManual(true);
    c.register(asEls(fakeEls(2)));
    c.start(viewOf([3]), () => undefined);
    expect(() => c.advance(16)).toThrow(/2 elements for 1 groups/);
    c.cancel();
  });

  it('AD-19 an exited or capped group is hidden with opacity 0 and then no longer written', () => {
    const c = createCelebration();
    c.setManual(true);
    const els = fakeEls(2);
    const writes: string[] = [];
    for (const [i, e] of els.entries()) {
      let opacity = '';
      Object.defineProperty(e.style, 'opacity', {
        get: () => opacity,
        set: (v: string) => {
          writes.push(`${i}:${v}`);
          opacity = v;
        },
      });
    }
    c.register(asEls(els));
    // Cell 3 drifts left, cell 6 right; both exit well before the cap.
    c.start(viewOf([3, 6]), () => undefined);
    for (let t = 0; t < 5000 && c.running(); t += 16) c.advance(16);
    expect(c.running()).toBe(false);
    expect(els[0]?.style.opacity).toBe('0');
    expect(els[1]?.style.opacity).toBe('0');
    // Hidden once per hide: never two '0' writes in a row for one element.
    for (const n of [0, 1]) {
      const own = writes.filter((w) => w.startsWith(`${n}:`));
      expect(own.at(-1)).toBe(`${n}:0`);
      own.forEach((w, k) => {
        if (k > 0 && w === `${n}:0`) expect(own[k - 1]).not.toBe(`${n}:0`);
      });
    }
  });

  it('AD-19 the run props carry card-id-free faces by entry cards, the band and the card width', () => {
    const c = createCelebration();
    c.start(viewOf([3, 4]), () => undefined);
    const props = c.props();
    expect(props?.groups).toEqual([faces.slice(0, 3), faces.slice(5, 8)]);
    expect(props?.band).toEqual({ left: 0, top: 56, width: 360, height: 500 });
    expect(props?.cardW).toBe(40);
    c.cancel();
    expect(c.props()).toBeNull();
  });
});
