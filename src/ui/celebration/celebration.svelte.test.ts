import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../../engine/index';
import { createCelebration } from './celebration.svelte.ts';
import source from './celebration.svelte.ts?raw';
import { launch, rowScale, rowWidth, step } from './step';

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

// AD-15: `skip.ts` reads the halt; the real store registers window listeners at import.
vi.mock('../../shell/game.svelte', () => ({ game: { state: { kind: 'active' } } }));

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
/** The dictionary banner wrapper (AD-12): always rendered, zero height unless shown. */
let banner: Rect;
let frames: Map<number, (t: number) => void>;
let nextFrame: number;
let cancelled: number[];
/** The fake document's and window's live listeners (`type`, capture flag), recorded (AD-19 Skip). */
let listening: Map<unknown, string>;

function recorder(name: string) {
  const key = (type: string, options: unknown) =>
    `${name} ${type}${(options as { capture?: boolean } | undefined)?.capture === true ? ' capture' : ''}`;
  return {
    addEventListener: (type: string, fn: unknown, options: unknown) =>
      listening.set(fn, key(type, options)),
    removeEventListener: (type: string, fn: unknown, options: unknown) => {
      if (listening.get(fn) === key(type, options)) listening.delete(fn);
    },
  };
}

function el(r: Rect, extra: object = {}) {
  return { getBoundingClientRect: () => r, ...extra };
}

beforeEach(() => {
  mocked.motion = { baseMs: 180, reduced: false };
  present = new Set(['topBar', 'actionBar', 'board', ...[3, 4, 5, 6].map((n) => `cell${n}`)]);
  banner = rect(0, 56, 360, 0);
  frames = new Map();
  nextFrame = 1;
  cancelled = [];
  listening = new Map();
  const querySelector = (selector: string) => {
    const box = /wordcell-(\d+)/.exec(selector)?.[1];
    const cell = box ?? /data-wordcell-label="(\d+)"/.exec(selector)?.[1];
    if (selector.includes('topBar')) return present.has('topBar') ? el(rect(0, 0, 360, 56)) : null;
    if (selector.includes('banner')) return el(banner);
    if (selector.includes('actionBar'))
      return present.has('actionBar') ? el(rect(0, 556, 360, 56)) : null;
    if (selector === '.board-root') return present.has('board') ? el(rect(0, 0, 360, 600)) : null;
    if (cell !== undefined) {
      if (!present.has(`cell${cell}`)) return null;
      // The WordCell box (below its label) differs from the label: origins come from the label.
      if (box !== undefined) return el(rect(Number(cell) * 40, 500, 40, 53));
      return el(rect(20 + Number(cell) * 40, 480, 20, 16));
    }
    return null;
  };
  vi.stubGlobal('document', {
    documentElement: { clientWidth: 360 },
    body: { querySelector },
    querySelector,
    ...recorder('document'),
  });
  vi.stubGlobal('window', recorder('window'));
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

// The pure `step.ts` result for cell 3's origin (150, 432), applying `dts` in order.
const pureTransform = (dts: readonly number[]): string => {
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
  for (const dt of dts) state = step(state, dt);
  const g = state.groups[0];
  return `translate(${(g?.x ?? 0) - (g?.w ?? 0) / 2}px, ${(g?.y ?? 0) - (g?.h ?? 0) / 2}px) scale(${g?.scale})`;
};

describe('AD-19 celebration controller', () => {
  it('AD-19 an empty list ends at once: onEnd then done once, no rAF; start after and inside done is legal; an absent list throws', () => {
    const c = createCelebration();
    const order: string[] = [];
    c.onEnd(() => order.push('onEnd'));
    // AD-3: wordList is absent only while playing; start takes the finished GameView (rule 6).
    expect(() => c.start(empty, () => order.push('done'))).toThrow(/AD-19.*AD-3/);
    expect(order).toEqual([]);
    expect(frames.size).toBe(0);
    expect(c.running()).toBe(false);
    c.start({ ...empty, wordList: [] } as unknown as GameView, () => order.push('done'));
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
    expect(t50).toBe(pureTransform([0, 0, 20, 50]));
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
    expect(els[0]?.style.transform).toBe(pureTransform([0, 16, 16]));
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

  it('AD-19 Skip: a run attaches the document capture pointerdown and keydown listeners; end(), cancel() and the cap remove them; an empty list attaches none', () => {
    const c = createCelebration();
    const run = ['document keydown capture', 'document pointerdown capture'];
    const live = () => [...listening.values()].sort();
    c.start({ ...empty, wordList: [] } as unknown as GameView, () => {});
    expect(live()).toEqual([]);
    c.start(viewOf([3]), () => {});
    expect(live()).toEqual(run);
    c.end();
    expect(live()).toEqual([]);
    c.start(viewOf([3]), () => {});
    expect(live()).toEqual(run);
    c.cancel();
    expect(live()).toEqual([]);
    c.start(viewOf([3]), () => {});
    let t = 0;
    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      t += 50;
      tick(t);
    }
    expect(c.running()).toBe(false);
    expect(live()).toEqual([]);
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
      expect(els[0]?.style.opacity).toBe('');
      c.cancel();
      c.setManual(true);
      c.start(viewOf([3]), () => undefined);
      c.advance(0);
      c.advance(-5);
      expect(els[0]?.style.opacity).toBe('');
      // Remainder untouched: 10 + 10 ms makes one 16 ms step (two renders, one step).
      c.advance(10);
      expect(els[0]?.style.opacity).toBe('0'); // rendered once, zero steps
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
      expect(els[0]?.style.opacity).toBe('');
      c.advance(10); // zero steps, one render
      expect(els[0]?.style.opacity).toBe('0');
      expect(els[0]?.style.transform).toBe('');
      c.advance(10); // carried 10 + 10: one step
      const one = els[0]?.style.transform;
      expect(one).not.toBe('');
      c.cancel();
      // A fresh run: the carried 4 ms is gone, so 12 ms is still zero steps.
      c.start(viewOf([3]), () => undefined);
      const fresh = fakeEls(1);
      c.register(asEls(fresh));
      c.advance(12);
      expect(fresh[0]?.style.opacity).toBe('0');
      expect(fresh[0]?.style.transform).toBe('');
      c.advance(4);
      expect(fresh[0]?.style.transform).not.toBe('');
      c.cancel();
    });

    it('AD-19 advance carries the remainder after a call that stepped: 20 then 12 ms is two 16 ms steps', () => {
      const c = createCelebration();
      c.setManual(true);
      const els = fakeEls(1);
      c.register(asEls(els));
      c.start(viewOf([3]), () => undefined);
      c.advance(20); // one step, 4 ms carried
      expect(els[0]?.style.transform).toBe(pureTransform([16]));
      c.advance(12); // 4 + 12: a second step
      expect(els[0]?.style.transform).toBe(pureTransform([16, 16]));
      expect(els[0]?.style.transform).not.toBe(pureTransform([16]));
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

    it('AD-19 advance throws on a non-finite ms', () => {
      const c = createCelebration();
      c.setManual(true);
      c.start(viewOf([3]), () => undefined);
      expect(() => c.advance(Number.NaN)).toThrow(/not finite/);
      expect(() => c.advance(Number.POSITIVE_INFINITY)).toThrow(/not finite/);
      c.cancel();
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

  // The pure state for the stubbed geometry (band 360 x 500 below a 56 px top bar, card 40 x 53).
  const pureState = (
    groups: readonly { x: number; y: number; letters: number }[],
    steps: number,
    capMs = 6000,
    baseMs = 180,
  ) => {
    let state = launch({
      groups,
      cardW: 40,
      cardH: 53,
      floor: 500,
      ceiling: 0,
      walls: { left: 0, right: 360 },
      capMs,
      baseMs,
    });
    for (let i = 0; i < steps; i++) state = step(state, 16);
    return state;
  };
  const transformOf = (g: { x: number; y: number; w: number; h: number; scale: number }) =>
    `translate(${g.x - g.w / 2}px, ${g.y - g.h / 2}px) scale(${g.scale})`;
  /** Label n's rect is (20 + 40n, 480, 20 x 16): its centre in band coordinates. */
  const labelOrigin = (cell: number, letters: number) => ({
    x: 20 + cell * 40 + 10,
    y: 480 + 8 - 56,
    letters,
  });

  it('AD-19 a 23-letter row is drawn scaled to fit the 360 px band, its box centred on the step position', () => {
    const c = createCelebration();
    c.setManual(true);
    const els = fakeEls(1);
    c.register(asEls(els));
    c.start(viewOf([3], 23), () => undefined);
    c.advance(32);
    const scale = rowScale(23, 40, 360);
    expect(scale).toBeLessThan(1);
    const g = pureState([labelOrigin(3, 23)], 2).groups[0];
    if (g === undefined) throw new Error('no group');
    expect(g.scale).toBe(scale);
    expect(g.w).toBeCloseTo(rowWidth(23, 40) * scale, 9);
    expect(g.h).toBeCloseTo(53 * scale, 9);
    const transform = els[0]?.style.transform ?? '';
    expect(transform.endsWith(`scale(${scale})`)).toBe(true);
    expect(transform).toBe(transformOf(g));
    c.cancel();
  });

  it('AD-19 each group launches from its own WordCell label (SPEC F8): group i follows entry i', () => {
    const c = createCelebration();
    c.setManual(true);
    const els = fakeEls(3);
    c.register(asEls(els));
    // The first entry is not the leftmost cell; the WordCell boxes differ from their labels.
    const cells = [6, 3, 5];
    c.start(viewOf(cells), () => undefined);
    c.advance(400); // past the third launch (320 ms at Normal)
    const state = pureState(
      cells.map((cell) => labelOrigin(cell, 3)),
      25,
    );
    expect(state.groups.every((g) => g.opacity === 1)).toBe(true);
    expect(els.map((e) => e.style.transform)).toEqual(state.groups.map(transformOf));
    c.cancel();
  });

  it('AD-19 at Slow the closing fade lasts 320 ms: opacity 1 before the last 320 ms, between 0 and 1 within them', () => {
    mocked.motion = { baseMs: 320, reduced: false };
    const c = createCelebration();
    c.setManual(true);
    // 31 entries: the last launches at half the cap (wave 10, slot 0) and is still moving at the cap.
    const cells = Array.from({ length: 31 }, (_, i) => 3 + (i % 4));
    const els = fakeEls(31);
    c.register(asEls(els));
    c.start(viewOf(cells), () => undefined);
    const capMs = (6000 * 320) / 180;
    const last = () => els[30]?.style.opacity;
    c.advance(10336); // cap − 330.67 ms
    expect(last()).toBe('1');
    c.advance(80); // cap − 250.67 ms: within the last 320 ms, before the last 180
    const opacity = Number(last());
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
    expect(opacity).toBeCloseTo((capMs - 10416) / 320, 9);
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
    // Cell 3 (left of centre) drifts right, cell 6 left; both exit well before the cap.
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

  it('AD-19 a shown dictionary banner tops the band: the ceiling is the banner bottom (AD-12)', () => {
    banner = rect(0, 56, 360, 40);
    const c = createCelebration();
    c.start(viewOf([3]), () => undefined);
    expect(c.props()?.band).toEqual({ left: 0, top: 96, width: 360, height: 460 });
    c.cancel();
  });

  it('AD-19 a zero-height banner does not count: the band starts at the top bar bottom (AD-12)', () => {
    banner = rect(0, 120, 360, 0);
    const c = createCelebration();
    c.start(viewOf([3]), () => undefined);
    expect(c.props()?.band).toEqual({ left: 0, top: 56, width: 360, height: 500 });
    c.cancel();
  });

  it('AD-19 props() and running() are reactive: both getters read the $state.raw active binding; their values follow start, end and cancel', () => {
    const c = createCelebration();
    // Under Vitest this module compiles for the server, where runes are plain values and a
    // $derived re-derives on every read (AGENTS.md pitfall): this sequence checks values only.
    const band = $derived(c.props()?.band.top ?? null);
    const isRunning = $derived(c.running());
    const seen: unknown[] = [[band, isRunning]];
    c.start(viewOf([3]), () => undefined);
    seen.push([band, isRunning]);
    c.end();
    seen.push([band, isRunning]);
    c.start(viewOf([3, 4]), () => undefined);
    seen.push([band, isRunning]);
    c.cancel();
    seen.push([band, isRunning]);
    expect(seen).toEqual([
      [null, false],
      [56, true],
      [null, false],
      [56, true],
      [null, false],
    ]);
    // The reactivity itself, from the source structure (TypeScript compiler API): `active` is a
    // `let` initialised with `$state.raw(...)` (or `$state(...)`), and the bodies of `props()` and
    // `running()` read `active`, never the plain `run`.
    const file = ts.createSourceFile('celebration.svelte.ts', source, ts.ScriptTarget.Latest, true);
    const found: { init?: string; isLet?: boolean; reads: Map<string, Set<string>> } = {
      reads: new Map(),
    };
    const identifiers = (node: ts.Node, into: Set<string>): void => {
      if (ts.isIdentifier(node)) into.add(node.text);
      ts.forEachChild(node, (child) => identifiers(child, into));
    };
    const visit = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'active'
      ) {
        const init = node.initializer;
        found.init =
          init !== undefined && ts.isCallExpression(init) ? init.expression.getText(file) : '';
        found.isLet = (node.parent.flags & ts.NodeFlags.Let) !== 0;
      }
      if (
        ts.isMethodDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        (node.name.text === 'props' || node.name.text === 'running') &&
        node.body !== undefined
      ) {
        const into = new Set<string>();
        identifiers(node.body, into);
        found.reads.set(node.name.text, into);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
    expect(found.isLet).toBe(true);
    expect(['$state.raw', '$state']).toContain(found.init);
    for (const name of ['props', 'running']) {
      const reads = found.reads.get(name);
      expect([name, reads?.has('active'), reads?.has('run')]).toEqual([name, true, false]);
    }
  });
});

// AD-17 Celebration seam (epic 10 entry 5): the enabled flag, on a fresh module.
describe('AD-17 celebration enabled flag', () => {
  it('AD-17 the flag defaults on and setCelebrationEnabled toggles it', async () => {
    vi.resetModules();
    const module = await import('./celebration.svelte.ts');
    expect(module.celebrationEnabled()).toBe(true);
    module.setCelebrationEnabled(false);
    expect(module.celebrationEnabled()).toBe(false);
    module.setCelebrationEnabled(true);
    expect(module.celebrationEnabled()).toBe(true);
  });
});
