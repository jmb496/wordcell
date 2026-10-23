import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../../engine/index';

// AD-19 wiring (entry 4, AD-13 celebration bullet): the exported singleton attached to the real
// overlays store with nav stubbed (one call-order log shared with the stub `done` and `onEnd`).
// The attachment is module-wide, so every test re-imports `overlays` and the controller after
// `vi.resetModules()`. A run starts on the manual clock (no rAF) over a fake document; the stub
// `done` stands in for entry 5's sheet open (`openDeferred` with a token issued before the start).
const log: string[] = [];
const store = vi.hoisted(() => ({ game: { state: { kind: 'active' }, view: {} as unknown } }));

vi.mock('../../shell/nav', () => ({
  nav: {
    push: () => log.push('push'),
    pop: () => log.push('pop'),
    settled: () => true,
    whenSettled: (fn: () => void) => fn(),
  },
}));
vi.mock('../../shell/prefs.svelte', () => ({
  BASE_MS: { fast: 90, normal: 180, slow: 320 },
  prefs: { motion: { baseMs: 180, reduced: false } },
}));
vi.mock('../../shell/game.svelte', () => ({ game: store.game }));
vi.mock('../../shell/dictionary.svelte', () => ({ dictionary: { state: 'ready' } }));

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

beforeEach(() => {
  const querySelector = (selector: string) => {
    const box = (r: Rect) => ({ getBoundingClientRect: () => r });
    if (selector.includes('topBar')) return box(rect(0, 0, 360, 56));
    if (selector.includes('banner')) return box(rect(0, 56, 360, 0));
    if (selector.includes('actionBar')) return box(rect(0, 556, 360, 56));
    if (selector === '.board-root') return box(rect(0, 0, 360, 600));
    if (/wordcell/.test(selector)) return box(rect(120, 480, 40, 16));
    return null;
  };
  vi.stubGlobal('document', {
    documentElement: { clientWidth: 360 },
    body: { querySelector },
    querySelector,
  });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '40px' }));
});
afterEach(() => vi.unstubAllGlobals());

const faces = Array.from({ length: 52 }, () => ({ letter: 'A', letterCount: 1 }));
const WON = {
  status: 'won',
  faces,
  wordList: [{ spelling: 'abc', letterCount: 3, cards: [0, 1, 2], cell: 3 }],
} as unknown as GameView;
const EMPTY = { status: 'won', faces, wordList: [] } as unknown as GameView;

async function load() {
  vi.resetModules();
  log.length = 0;
  const { overlays } = await import('../overlays.svelte');
  const module = await import('./celebration.svelte.ts');
  const { celebration } = module;
  celebration.setManual(true);
  celebration.onEnd(() => log.push('onEnd'));
  let dones = 0;
  // Entry 5's `done`: the deferred sheet open, with a token issued before the start.
  let token = 0;
  const done = () => {
    dones += 1;
    log.push('done');
    overlays.openDeferred(token);
  };
  /** Attaches, issues the token, pushes the entry and starts a run on `view`. */
  const begin = (view: GameView = WON) => {
    module.attachOverlays();
    token = overlays.deferEndSheetOpen();
    overlays.startCelebration();
    celebration.start(view, done);
  };
  return {
    overlays,
    celebration,
    attachOverlays: module.attachOverlays,
    begin,
    done,
    dones: () => dones,
    token: () => token,
  };
}

describe('AD-19 celebration attached to overlays', () => {
  it('AD-19 attached start() without celebration on top throws before any change', async () => {
    const t = await load();
    t.attachOverlays();
    expect(() => t.celebration.start(WON, t.done)).toThrow(/^AD-19 celebration: start\(\) while/);
    t.overlays.open('historyNotice');
    expect(() => t.celebration.start(WON, t.done)).toThrow(/^AD-19 celebration: start\(\) while/);
    expect(t.celebration.running()).toBe(false);
    expect(log).toEqual(['push']);
  });

  it('AD-19 an unattached singleton keeps the synchronous done, and start() needs no entry', async () => {
    const t = await load();
    t.celebration.start(EMPTY, t.done);
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['onEnd', 'done']);
  });

  it('AD-19 attached cancel() with the entry open throws; the run stays live', async () => {
    const t = await load();
    t.begin();
    expect(() => t.celebration.cancel()).toThrow(/^AD-19 celebration: cancel\(\) while/);
    expect(t.celebration.running()).toBe(true);
    expect(t.overlays.top).toBe('celebration');
  });

  it('AD-19 end(): onEnd, one pop; done not called synchronously, once after a microtask, its push after the pop', async () => {
    const t = await load();
    t.begin();
    expect(log).toEqual(['push']);
    log.length = 0;
    t.celebration.end();
    expect(t.celebration.running()).toBe(false);
    expect(t.overlays.depth).toBe(0);
    expect(t.dones()).toBe(0);
    expect(log).toEqual(['onEnd', 'pop']);
    await Promise.resolve();
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['onEnd', 'pop', 'done', 'push']);
    expect(t.overlays.top).toBe('endSheet');
  });

  it('AD-19 attached empty-list start() after startCelebration(): one pop, done once after a microtask', async () => {
    const t = await load();
    t.begin(EMPTY);
    expect(log).toEqual(['push', 'onEnd', 'pop']);
    expect(t.dones()).toBe(0);
    await Promise.resolve();
    expect(t.dones()).toBe(1);
    expect(t.overlays.top).toBe('endSheet');
  });

  it('AD-19 back (closedByBack): no pop, run stopped without onEnd, done once after the removal loop opens the sheet', async () => {
    const t = await load();
    t.begin();
    log.length = 0;
    t.overlays.closedByBack(0);
    expect(log).toEqual([]);
    expect(t.celebration.running()).toBe(false);
    expect(t.dones()).toBe(0);
    await Promise.resolve();
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['done', 'push']);
    expect(t.overlays.top).toBe('endSheet');
  });

  it('AD-19 end() then a back, or a repeated end(): no second done', async () => {
    const t = await load();
    t.begin();
    t.celebration.end();
    t.celebration.end();
    t.overlays.closedByBack(0);
    await Promise.resolve();
    t.celebration.end();
    t.overlays.closedByBack(0);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(t.dones()).toBe(1);
    expect(log.filter((entry) => entry === 'onEnd')).toHaveLength(1);
  });

  for (const path of ['onUnfinished', 'resetForNewSession'] as const) {
    it(`AD-19 ${path}() with the entry open: one pop, run stopped, token dead, no onEnd and no done even after a flush`, async () => {
      const t = await load();
      t.begin();
      log.length = 0;
      t.overlays[path]();
      expect(log).toEqual(['pop']);
      expect(t.overlays.depth).toBe(0);
      expect(t.celebration.running()).toBe(false);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      expect(t.dones()).toBe(0);
      expect(t.overlays.openDeferred(t.token())).toBe(false);
      expect(t.overlays.endSheet).toBe('hidden');
      expect(log).toEqual(['pop']);
      // Detached from the entry, cancel() is legal again (entry 3's semantics).
      expect(() => t.celebration.cancel()).not.toThrow();
    });
  }

  it('AD-19 an ended removal with no pending or live done throws (startCelebration with no run, then back)', async () => {
    const t = await load();
    t.attachOverlays();
    t.overlays.startCelebration();
    expect(() => t.overlays.closedByBack(0)).toThrow(
      /^AD-19 celebration: ended removal with no done/,
    );
    t.overlays.startCelebration();
    expect(() => t.overlays.close('celebration')).toThrow(/^AD-19 celebration: ended removal/);
  });

  it('AD-19 a cancelled removal with no run is silent', async () => {
    const t = await load();
    t.attachOverlays();
    t.overlays.startCelebration();
    expect(() => t.overlays.resetForNewSession()).not.toThrow();
    expect(t.overlays.depth).toBe(0);
  });

  it('AD-13 pressEscape with the entry on top: one pop, the callback gets ended, done once after a microtask', async () => {
    const t = await load();
    const act = await import('../act');
    act.setController({
      cancel: () => log.push('cancel'),
      attach: () => () => {},
      refreshHover: () => {},
      activate: () => {},
    } as unknown as Parameters<typeof act.setController>[0]);
    const keys = await import('../keys');
    t.begin();
    log.length = 0;
    let prevented = false;
    keys.onKeyDown({
      key: 'Escape',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      repeat: false,
      defaultPrevented: false,
      preventDefault: () => {
        prevented = true;
      },
    } as KeyboardEvent);
    expect(prevented).toBe(true);
    expect(log).toEqual(['cancel', 'pop']);
    expect(t.celebration.running()).toBe(false);
    expect(t.dones()).toBe(0);
    await Promise.resolve();
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['cancel', 'pop', 'done', 'push']);
    expect(t.overlays.top).toBe('endSheet');
  });
});
