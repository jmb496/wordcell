import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../../engine/index';
import { celebrationCapMs } from '../motion';

// AD-19 wiring (entry 4, AD-13 celebration bullet): the exported singleton attached to the real
// overlays store with nav stubbed (one call-order log shared with the stub `done` and `onEnd`).
// The attachment is module-wide, so every test re-imports `overlays` and the controller after
// `vi.resetModules()`. A run starts on the manual clock (no rAF) over a fake document; the stub
// `done` stands in for entry 5's sheet open (`openDeferred` with a token issued before the start).
// Entry 6 (AD-19 Skip): the fake document and window record their listeners, and `fire` sends a
// plain event to a snapshot of one type's listeners (as a DOM dispatch: a listener added during it
// is not called for it).
const log: string[] = [];
const store = vi.hoisted(() => ({
  game: { state: { kind: 'active' }, view: {} as unknown },
  settled: true,
  /** `whenSettled` callbacks queued while `settled` is false (as nav.ts). */
  waiters: [] as (() => void)[],
}));

vi.mock('../../shell/nav', () => ({
  nav: {
    push: () => log.push('push'),
    pop: () => log.push('pop'),
    settled: () => store.settled,
    whenSettled: (fn: () => void) => (store.settled ? fn() : store.waiters.push(fn)),
  },
}));

type Listener = (event: unknown) => void;
type Entry = { at: string; type: string; fn: Listener; capture: boolean };
let listeners: Entry[] = [];
const capture = (options: unknown) =>
  (options as { capture?: boolean } | undefined)?.capture === true;
const recorder = (at: string) => ({
  addEventListener: (type: string, fn: Listener, options: unknown) =>
    listeners.push({ at, type, fn, capture: capture(options) }),
  removeEventListener: (type: string, fn: Listener, options: unknown) => {
    const i = listeners.findIndex(
      (l) => l.at === at && l.type === type && l.fn === fn && l.capture === capture(options),
    );
    if (i >= 0) listeners.splice(i, 1);
  },
});
/** The live listeners as `<at> <type>`, sorted. */
const live = () => listeners.map((l) => `${l.at} ${l.type}`).sort();
type Fired = { stopped: boolean; prevented: boolean };
function fire(type: string, init: Record<string, unknown>): Fired {
  const event = {
    type,
    stopped: false,
    prevented: false,
    stopPropagation() {
      event.stopped = true;
    },
    preventDefault() {
      event.prevented = true;
    },
    ...init,
  };
  for (const l of listeners.filter((entry) => entry.at === 'document' && entry.type === type)) {
    l.fn(event);
  }
  return { stopped: event.stopped, prevented: event.prevented };
}
/** A plain keydown with no modifiers on the board. */
const keydown = (key: string) =>
  fire('keydown', {
    key,
    repeat: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    target: { closest: () => null },
  });
/** A primary press on the band (no bar ancestor). */
const press = (pointerId = 1) =>
  fire('pointerdown', {
    button: 0,
    pointerId,
    pointerType: 'touch',
    target: { closest: () => null },
  });
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
  listeners = [];
  store.settled = true;
  store.waiters = [];
  store.game.state = { kind: 'active' };
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
    // AD-19 Skip: every press point is on the board (no bar ancestor).
    elementFromPoint: () => ({ closest: () => null }),
    ...recorder('document'),
  });
  vi.stubGlobal('window', recorder('window'));
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
  // A recording controller behind act.ts (`cancelGesture` → `cancel`, as `act()`).
  const act = await import('../act');
  act.setController({
    cancel: () => log.push('cancel'),
    attach: () => () => {},
    refreshHover: () => {},
    activate: () => {},
  } as unknown as Parameters<typeof act.setController>[0]);
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
    createCelebration: module.createCelebration,
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

  it('AD-19 after attachOverlays() an unattached createCelebration() instance keeps the synchronous done, and start() needs no entry', async () => {
    const t = await load();
    t.attachOverlays();
    let dones = 0;
    expect(() =>
      t.createCelebration().start(EMPTY, () => {
        dones += 1;
      }),
    ).not.toThrow();
    expect(dones).toBe(1);
    expect(log).toEqual([]);
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

  it('AD-19 a run driven past the cap on the manual clock: onEnd, one pop; done not called synchronously, once after a microtask', async () => {
    const t = await load();
    t.begin();
    log.length = 0;
    t.celebration.advance(celebrationCapMs());
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

  it('AD-13 pressEscape with the entry on top does nothing: not prevented, no act(), the run and the entry stay', async () => {
    const t = await load();
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
    expect(prevented).toBe(false);
    expect(log).toEqual([]);
    expect(t.celebration.running()).toBe(true);
    expect(t.overlays.depth).toBe(1);
    expect(t.overlays.top).toBe('celebration');
    await Promise.resolve();
    expect(t.dones()).toBe(0);
  });
});

describe('AD-19 Skip on the attached run', () => {
  const RUN = ['document keydown', 'document pointerdown'];

  it('AD-19 a skip press: consumed, the controller cancel, onEnd and one pop, done once after a microtask; a second press adds nothing', async () => {
    const t = await load();
    t.begin();
    expect(live()).toEqual(RUN);
    log.length = 0;
    expect(press()).toEqual({ stopped: true, prevented: true });
    expect(t.celebration.running()).toBe(false);
    expect(log).toEqual(['cancel', 'onEnd', 'pop']);
    expect(t.dones()).toBe(0);
    await Promise.resolve();
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['cancel', 'onEnd', 'pop', 'done', 'push']);
    expect(t.overlays.top).toBe('endSheet');
    // Only the press tail is left (its pointerup, pointercancel and pointerdown).
    expect(live()).toEqual([
      'document pointercancel',
      'document pointerdown',
      'document pointerup',
    ]);
    expect(press(2)).toEqual({ stopped: false, prevented: false });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['cancel', 'onEnd', 'pop', 'done', 'push']);
  });

  it('AD-19 a skip press before the push settles still ends at once and waits on no nav settle (nav orders the pop)', async () => {
    const t = await load();
    store.settled = false;
    t.begin();
    log.length = 0;
    press();
    expect(t.celebration.running()).toBe(false);
    expect(log).toEqual(['cancel', 'onEnd', 'pop']);
    expect(store.waiters).toEqual([]);
    await Promise.resolve();
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['cancel', 'onEnd', 'pop', 'done', 'push']);
    expect(store.waiters).toEqual([]);
  });

  const skips: [string, () => { stopped: boolean; prevented: boolean }][] = [
    ['an Esc keydown', () => keydown('Escape')],
    ['a Space keydown', () => keydown(' ')],
    ['a band press', () => press()],
  ];
  for (const [name, skip] of skips) {
    it(`AD-19 ${name} skips through the controller: consumed, its cancel() before onEnd and the pop`, async () => {
      const t = await load();
      t.begin();
      log.length = 0;
      expect(skip()).toEqual({ stopped: true, prevented: true });
      expect(t.celebration.running()).toBe(false);
      expect(log).toEqual(['cancel', 'onEnd', 'pop']);
      await Promise.resolve();
      expect(t.dones()).toBe(1);
    });
  }

  it('AD-19 halted (AD-15, the store’s state): a band press, Space and Esc pass untouched and the run stays live', async () => {
    const t = await load();
    t.begin();
    log.length = 0;
    store.game.state = { kind: 'halted' };
    try {
      for (const [, skip] of skips) expect(skip()).toEqual({ stopped: false, prevented: false });
      expect(t.celebration.running()).toBe(true);
      expect(log).toEqual([]);
      expect(live()).toEqual(RUN);
    } finally {
      store.game.state = { kind: 'active' };
    }
  });

  it('AD-19 no listeners before start() or after the empty-list start()', async () => {
    const t = await load();
    t.attachOverlays();
    expect(live()).toEqual([]);
    t.begin(EMPTY);
    expect(live()).toEqual([]);
    await Promise.resolve();
    expect(live()).toEqual([]);
  });

  it('AD-19 the run listeners are gone after the rAF-driven end', async () => {
    const t = await load();
    const frames: ((time: number) => void)[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    t.celebration.setManual(false);
    t.begin();
    expect(live()).toEqual(RUN);
    let time = 0;
    for (let i = 0; i < 1000 && frames.length > 0; i++) {
      time += 50;
      (frames.shift() as (time: number) => void)(time);
    }
    expect(t.celebration.running()).toBe(false);
    expect(live()).toEqual([]);
  });

  const ends: [string, (t: Awaited<ReturnType<typeof load>>) => void][] = [
    ['the cap', (t) => t.celebration.advance(celebrationCapMs())],
    ['end()', (t) => t.celebration.end()],
    ['back (closedByBack)', (t) => t.overlays.closedByBack(0)],
    ['an Undo cancel (onUnfinished)', (t) => t.overlays.onUnfinished()],
  ];
  for (const [name, stop] of ends) {
    it(`AD-19 the run listeners are gone after ${name}, and nothing was consumed`, async () => {
      const t = await load();
      t.begin();
      expect(live()).toEqual(RUN);
      stop(t);
      expect(t.celebration.running()).toBe(false);
      expect(live()).toEqual([]);
      await Promise.resolve();
      expect(live()).toEqual([]);
    });
  }
});

// Ticket 10.7 (AD-19 Hide, Resize; SPEC F13): `installInterruptions` over the attached singleton
// with a fake `win` (its listeners by type), a fake `registerBeforeHide` (the collected callbacks)
// and `halted` from a variable; `end` is the singleton's real `end()`. `openMenu()` over the real
// overlays, open-surface and act() (the recording controller logs `cancel`).
describe('AD-19 interruptions and the menu end', () => {
  async function install() {
    const t = await load();
    const { installInterruptions } = await import('./interruptions');
    const on: Record<string, (() => void)[]> = {};
    const hides: (() => void)[] = [];
    let isHalted = false;
    installInterruptions({
      win: {
        addEventListener: (type: string, fn: EventListenerOrEventListenerObject | null) => {
          on[type] = [...(on[type] ?? []), fn as () => void];
        },
      },
      registerBeforeHide: (fn) => hides.push(fn),
      halted: () => isHalted,
      end: t.celebration.end,
    });
    const emit = (type: string) => {
      for (const fn of on[type] ?? []) fn();
    };
    return {
      ...t,
      on,
      hides,
      hide: () => {
        for (const fn of hides) fn();
      },
      emit,
      halt: (value: boolean) => {
        isHalted = value;
      },
      installInterruptions,
    };
  }

  it('AD-19 installInterruptions registers one hide callback and one resize and one orientationchange listener', async () => {
    const t = await install();
    expect(t.hides).toHaveLength(1);
    expect(Object.keys(t.on).sort()).toEqual(['orientationchange', 'resize']);
    expect(t.on.resize).toHaveLength(1);
    expect(t.on.orientationchange).toHaveLength(1);
  });

  it('AD-19 the hide callback twice gives one pop and one done (after a microtask); the second is a no-op', async () => {
    const t = await install();
    t.begin();
    log.length = 0;
    t.hide();
    expect(t.celebration.running()).toBe(false);
    expect(log).toEqual(['onEnd', 'pop']);
    expect(t.dones()).toBe(0);
    t.hide();
    expect(log).toEqual(['onEnd', 'pop']);
    await Promise.resolve();
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['onEnd', 'pop', 'done', 'push']);
    t.hide();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['onEnd', 'pop', 'done', 'push']);
  });

  it('AD-19 with no run the hide callback, resize and orientationchange are no-ops', async () => {
    const t = await install();
    t.attachOverlays();
    t.hide();
    t.emit('resize');
    t.emit('orientationchange');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(log).toEqual([]);
    expect(t.dones()).toBe(0);
    expect(t.overlays.depth).toBe(0);
  });

  for (const type of ['resize', 'orientationchange']) {
    it(`AD-19 ${type} ends a live run once; a second event adds nothing`, async () => {
      const t = await install();
      t.begin();
      log.length = 0;
      t.emit(type);
      expect(t.celebration.running()).toBe(false);
      expect(log).toEqual(['onEnd', 'pop']);
      t.emit(type);
      await Promise.resolve();
      expect(t.dones()).toBe(1);
      expect(t.overlays.top).toBe('endSheet');
      t.emit(type);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      expect(t.dones()).toBe(1);
      expect(log).toEqual(['onEnd', 'pop', 'done', 'push']);
    });
  }

  it('AD-19 while halted the hide callback, resize and orientationchange leave a live run running (no pop, no done)', async () => {
    const t = await install();
    t.begin();
    log.length = 0;
    t.halt(true);
    t.hide();
    t.emit('resize');
    t.emit('orientationchange');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(t.celebration.running()).toBe(true);
    expect(log).toEqual([]);
    expect(t.dones()).toBe(0);
    expect(t.overlays.top).toBe('celebration');
  });

  it('AD-19 installInterruptions() twice throws', async () => {
    const t = await install();
    expect(() =>
      t.installInterruptions({
        win: { addEventListener: () => {} },
        registerBeforeHide: () => {},
        halted: () => false,
        end: () => {},
      }),
    ).toThrow(/^AD-19 installInterruptions\(\) called twice/);
  });

  it('AD-19 openMenu() mid-run: end first (onEnd, pop), done after a microtask pushes endSheet, the menu opens only at the settle, inside act()', async () => {
    const t = await load();
    const { openMenu } = await import('../open-menu');
    t.begin();
    log.length = 0;
    store.settled = false;
    openMenu();
    expect(t.celebration.running()).toBe(false);
    expect(log).toEqual(['onEnd', 'pop']);
    expect(store.waiters).toHaveLength(1);
    await Promise.resolve();
    expect(t.dones()).toBe(1);
    expect(log).toEqual(['onEnd', 'pop', 'done', 'push']);
    expect(t.overlays.top).toBe('endSheet');
    expect(t.overlays.isOpen('menu')).toBe(false);
    store.settled = true;
    for (const waiter of store.waiters.splice(0)) waiter();
    expect(log).toEqual(['onEnd', 'pop', 'done', 'push', 'cancel', 'push']);
    expect(t.overlays.top).toBe('menu');
    expect(t.overlays.depth).toBe(2);
  });

  it('AD-19 openMenu() drops the deferred open when the top is not endSheet at the settle', async () => {
    const t = await load();
    const { openMenu } = await import('../open-menu');
    t.begin();
    log.length = 0;
    store.settled = false;
    openMenu();
    await Promise.resolve();
    expect(t.overlays.top).toBe('endSheet');
    // A second press before the settle opens the menu directly over endSheet.
    openMenu();
    expect(t.overlays.top).toBe('menu');
    store.settled = true;
    expect(() => {
      for (const waiter of store.waiters.splice(0)) waiter();
    }).not.toThrow();
    expect(log.filter((entry) => entry === 'push')).toHaveLength(2);
    expect(log).toEqual(['onEnd', 'pop', 'done', 'push', 'push', 'cancel']);
    expect(t.overlays.depth).toBe(2);
    expect(t.overlays.top).toBe('menu');
  });

  it('AD-19 openMenu() with no celebration opens the menu at once', async () => {
    const t = await load();
    const { openMenu } = await import('../open-menu');
    t.attachOverlays();
    openMenu();
    expect(log).toEqual(['push']);
    expect(t.overlays.top).toBe('menu');
    expect(t.overlays.depth).toBe(1);
    expect(t.dones()).toBe(0);
  });
});
