import { describe, expect, it } from 'vitest';
import { SWALLOW_MS } from '../gestures/click-swallow';
import { createSkip, type SkipEnv } from './skip';

// AD-19 Skip (epic 10 entry 6) in node: a recording fake `document` and `window` whose `fire`
// sends a plain event to a snapshot of one type's listeners (as a DOM dispatch: every same-node
// listener runs even after `stopPropagation`, and one added during the dispatch is not called for
// it), and fake timers. The fake `document`'s `elementFromPoint` answers the element under a
// press point (`barAt` puts a point in a bar or the banner; any other point is on the board). The
// fake `end` detaches the run listeners, as the controller's internal stop does. An event is
// "untouched" when it is neither stopped nor default-prevented.

type Listener = (event: unknown) => void;
type Entry = { at: string; type: string; fn: Listener; capture: boolean };

function setup() {
  const listeners: Entry[] = [];
  const capture = (options: unknown) =>
    (options as { capture?: boolean } | undefined)?.capture === true;
  const recorder = (at: string) => ({
    addEventListener: (type: string, fn: Listener, options?: unknown) => {
      listeners.push({ at, type, fn, capture: capture(options) });
    },
    removeEventListener: (type: string, fn: Listener, options?: unknown) => {
      const i = listeners.findIndex(
        (l) => l.at === at && l.type === type && l.fn === fn && l.capture === capture(options),
      );
      if (i >= 0) listeners.splice(i, 1);
    },
  });
  const timers = new Map<number, { fn: () => void; ms: number }>();
  let nextHandle = 1;
  const order: string[] = [];
  const state = { halted: false };
  /** The bar or banner under each `x,y` press point set by `barAt`. */
  const bars = new Map<string, string>();
  const skip = createSkip({
    end: () => {
      order.push('end');
      skip.detach();
    },
    cancelGesture: () => order.push('cancelGesture'),
    halted: () => state.halted,
  });
  /** An element under `band` (a bar or the banner), or on the board when `band` is undefined. */
  const target = (band?: string) => ({
    closest: (selector: string) =>
      band !== undefined && selector.split(',').includes(`[data-band="${band}"]`) ? {} : null,
  });
  const env = {
    doc: {
      ...recorder('document'),
      elementFromPoint: (x: number, y: number) => target(bars.get(`${x},${y}`)),
    } as unknown as SkipEnv['doc'],
    win: recorder('window') as unknown as EventTarget,
    setTimer: (fn: () => void, ms: number) => {
      const handle = nextHandle++;
      timers.set(handle, { fn, ms });
      return handle;
    },
    clearTimer: (handle: unknown) => {
      timers.delete(handle as number);
    },
  };
  type Fired = { stopped: boolean; prevented: boolean };
  const fire = (type: string, init: Record<string, unknown> = {}, at = 'document'): Fired => {
    const event = {
      type,
      stopped: false,
      prevented: false,
      defaultPrevented: false,
      stopPropagation() {
        event.stopped = true;
      },
      preventDefault() {
        event.prevented = true;
      },
      ...init,
    };
    for (const l of listeners.filter((entry) => entry.at === at && entry.type === type)) {
      expect(l.capture).toBe(at === 'document');
      l.fn(event);
    }
    return { stopped: event.stopped, prevented: event.prevented };
  };
  const barAt = (point: { clientX: number; clientY: number }, band: string) => {
    bars.set(`${point.clientX},${point.clientY}`, band);
  };
  const down = (init: Record<string, unknown> = {}) =>
    fire('pointerdown', {
      button: 0,
      pointerId: 1,
      pointerType: 'touch',
      clientX: 100,
      clientY: 300,
      target: target(),
      ...init,
    });
  const up = (pointerId = 1) => fire('pointerup', { pointerId, button: 0 });
  const key = (k: string, init: Record<string, unknown> = {}, type = 'keydown') =>
    fire(type, {
      key: k,
      repeat: false,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      target: target(),
      ...init,
    });
  /** The live listeners as `<at> <type>`, sorted. */
  const live = () => listeners.map((l) => `${l.at} ${l.type}`).sort();
  const elapse = (ms: number) => {
    for (const [handle, timer] of [...timers]) {
      if (timer.ms <= ms) {
        timers.delete(handle);
        timer.fn();
      }
    }
  };
  /** Fires one timer by its handle (to expire one of several same-length timers). */
  const expire = (handle: number) => {
    const timer = timers.get(handle);
    if (timer === undefined) throw new Error(`no timer ${handle}`);
    timers.delete(handle);
    timer.fn();
  };
  return {
    skip,
    env,
    fire,
    down,
    up,
    key,
    live,
    order,
    state,
    timers,
    elapse,
    expire,
    target,
    barAt,
  };
}

const RUN = ['document keydown', 'document pointerdown'];
const PRESS_TAIL = ['document pointercancel', 'document pointerdown', 'document pointerup'];
const SPACE_TAIL = ['document keydown', 'document keyup', 'window blur'];
const UNTOUCHED = { stopped: false, prevented: false };
const CONSUMED = { stopped: true, prevented: true };
const PREVENTED = { stopped: false, prevented: true };
/** A press point in a bar (`barAt`), away from `down`'s default board point. */
const BAR_POINT = { clientX: 100, clientY: 20 };

describe('AD-19 Skip run listeners', () => {
  it('AD-19 attach() adds only the document capture pointerdown and keydown; detach() removes them; misuse throws', () => {
    const t = setup();
    expect(t.live()).toEqual([]);
    t.skip.attach(t.env);
    expect(t.live()).toEqual(RUN);
    expect(() => t.skip.attach(t.env)).toThrow(/^AD-19 skip: attach\(\) while attached/);
    t.skip.detach();
    expect(t.live()).toEqual([]);
    expect(() => t.skip.detach()).toThrow(/^AD-19 skip: detach\(\) while detached/);
  });

  for (const pointerType of ['touch', 'mouse', 'pen']) {
    it(`AD-19 a primary ${pointerType} press outside the bars is consumed and calls cancelGesture() then end() once; only its press tail is left`, () => {
      const t = setup();
      t.skip.attach(t.env);
      expect(t.down({ pointerType })).toEqual(CONSUMED);
      expect(t.order).toEqual(['cancelGesture', 'end']);
      expect(t.live()).toEqual(PRESS_TAIL);
      // The run listeners are gone: a second press is not the run's (the tail ignores other ids).
      expect(t.down({ pointerId: 2 })).toEqual(UNTOUCHED);
      expect(t.order).toEqual(['cancelGesture', 'end']);
    });
  }

  it('AD-19 the skipping pointerdown is stopped and prevented, so the bubble-phase controller never opens a press for it', () => {
    const t = setup();
    t.skip.attach(t.env);
    const fired = t.down();
    expect(fired.stopped).toBe(true);
    expect(fired.prevented).toBe(true);
  });

  it('AD-19 a press already default-prevented by the tracker still skips (defaultPrevented is not read)', () => {
    const t = setup();
    t.skip.attach(t.env);
    expect(t.down({ defaultPrevented: true })).toEqual(CONSUMED);
    expect(t.order).toEqual(['cancelGesture', 'end']);
  });

  for (const band of ['topBar', 'actionBar', 'banner']) {
    it(`AD-19 a press on a ${band} target passes through untouched and does not end the run`, () => {
      const t = setup();
      t.skip.attach(t.env);
      t.barAt(BAR_POINT, band);
      // The press point decides, not `event.target` (here on the board).
      expect(t.down({ ...BAR_POINT, target: t.target() })).toEqual(UNTOUCHED);
      expect(t.order).toEqual([]);
      expect(t.live()).toEqual(RUN);
    });

    it(`AD-19 a press whose point is beside the ${band} but whose target is retargeted onto it (touch adjustment) skips: consumed, cancelGesture() then end()`, () => {
      const t = setup();
      t.skip.attach(t.env);
      expect(t.down({ target: t.target(band) })).toEqual(CONSUMED);
      expect(t.order).toEqual(['cancelGesture', 'end']);
    });
  }

  for (const button of [1, 2]) {
    it(`AD-19 a non-primary press (button ${button}) passes through untouched`, () => {
      const t = setup();
      t.skip.attach(t.env);
      expect(t.down({ button })).toEqual(UNTOUCHED);
      expect(t.order).toEqual([]);
      expect(t.live()).toEqual(RUN);
    });
  }

  it('AD-19 a press after the start skips, one before it does not: a pre-start pointer’s release passes while a new pointerId’s pointerdown skips', () => {
    const t = setup();
    // Pointer 7 went down before the start: the run never saw its pointerdown.
    t.down({ pointerId: 7 });
    expect(t.order).toEqual([]);
    t.skip.attach(t.env);
    expect(t.up(7)).toEqual(UNTOUCHED);
    expect(t.fire('click', { detail: 1 })).toEqual(UNTOUCHED);
    expect(t.order).toEqual([]);
    expect(t.down({ pointerId: 8 })).toEqual(CONSUMED);
    expect(t.order).toEqual(['cancelGesture', 'end']);
    // The pre-start pointer's later events are not the tail's either.
    expect(t.up(7)).toEqual(UNTOUCHED);
    expect(t.live()).toEqual(PRESS_TAIL);
  });

  for (const [name, init] of [
    ['Space', {}],
    ['Esc', {}],
    ['Shift+Esc', { shiftKey: true }],
  ] as const) {
    it(`AD-19 ${name} skips: consumed, cancelGesture() then end()`, () => {
      const t = setup();
      t.skip.attach(t.env);
      expect(t.key(name.endsWith('Esc') ? 'Escape' : ' ', init)).toEqual(CONSUMED);
      expect(t.order).toEqual(['cancelGesture', 'end']);
    });
  }

  for (const band of ['topBar', 'actionBar', 'banner']) {
    it(`AD-19 Space and Esc skip with a focused ${band} control (no focus is read; SPEC F17)`, () => {
      for (const k of [' ', 'Escape']) {
        const t = setup();
        t.skip.attach(t.env);
        expect(t.key(k, { target: t.target(band) })).toEqual(CONSUMED);
        expect(t.order).toEqual(['cancelGesture', 'end']);
      }
    });
  }

  it('AD-19 after a key skip and after a press skip the controller holds no press: cancelGesture() before end() (the press also stopped)', () => {
    const a = setup();
    a.skip.attach(a.env);
    a.key(' ');
    expect(a.order).toEqual(['cancelGesture', 'end']);
    const b = setup();
    b.skip.attach(b.env);
    expect(b.down().stopped).toBe(true);
    expect(b.order).toEqual(['cancelGesture', 'end']);
  });

  for (const [name, k, init] of [
    ['a repeat Esc', 'Escape', { repeat: true }],
    ['Ctrl+Esc', 'Escape', { ctrlKey: true }],
    ['Meta+Esc', 'Escape', { metaKey: true }],
    ['Alt+Esc', 'Escape', { altKey: true }],
    ['Enter', 'Enter', {}],
    ['z', 'z', {}],
  ] as const) {
    it(`AD-19 ${name} passes through untouched and does not end the run`, () => {
      const t = setup();
      t.skip.attach(t.env);
      expect(t.key(k, init)).toEqual(UNTOUCHED);
      expect(t.order).toEqual([]);
      expect(t.live()).toEqual(RUN);
    });
  }

  for (const [name, init] of [
    ['Shift+Space', { shiftKey: true }],
    ['Ctrl+Space', { ctrlKey: true }],
    ['Meta+Space', { metaKey: true }],
    ['Alt+Space', { altKey: true }],
    ['a repeat Space', { repeat: true }],
  ] as const) {
    it(`AD-19 ${name} does not end the run and is only default-prevented, not stopped, so it never activates a focused button (SPEC F17)`, () => {
      const t = setup();
      t.skip.attach(t.env);
      expect(t.key(' ', init)).toEqual(PREVENTED);
      expect(t.order).toEqual([]);
      expect(t.live()).toEqual(RUN);
    });
  }

  it('AD-19 a held Shift+Space whose Shift is released before the repeats: every keydown only default-prevented, the run not ended (SPEC F17)', () => {
    const t = setup();
    t.skip.attach(t.env);
    expect(t.key(' ', { shiftKey: true })).toEqual(PREVENTED);
    expect(t.key(' ', { shiftKey: true, repeat: true })).toEqual(PREVENTED);
    expect(t.key('Shift', {}, 'keyup')).toEqual(UNTOUCHED);
    expect(t.key(' ', { repeat: true })).toEqual(PREVENTED);
    expect(t.key(' ', { repeat: true })).toEqual(PREVENTED);
    expect(t.order).toEqual([]);
    expect(t.live()).toEqual(RUN);
  });

  it('AD-19 an Esc skip leaves no tail', () => {
    const t = setup();
    t.skip.attach(t.env);
    t.key('Escape');
    expect(t.live()).toEqual([]);
    expect(t.key('Escape', {}, 'keyup')).toEqual(UNTOUCHED);
  });

  it('AD-19 halted (AD-15): a press and the skip keys pass through untouched and do not end the run', () => {
    const t = setup();
    t.skip.attach(t.env);
    t.state.halted = true;
    expect(t.down()).toEqual(UNTOUCHED);
    expect(t.key(' ')).toEqual(UNTOUCHED);
    expect(t.key('Escape')).toEqual(UNTOUCHED);
    expect(t.order).toEqual([]);
    expect(t.live()).toEqual(RUN);
  });

  it('AD-19 detach() removes every run listener; the tails survive it', () => {
    const t = setup();
    t.skip.attach(t.env);
    t.down();
    t.skip.attach(t.env);
    t.key(' ');
    expect(t.live()).toEqual([...PRESS_TAIL, ...SPACE_TAIL].sort());
    t.skip.attach(t.env);
    t.skip.detach();
    expect(t.live()).toEqual([...PRESS_TAIL, ...SPACE_TAIL].sort());
  });
});

describe('AD-19 Skip press tail', () => {
  function skipped() {
    const t = setup();
    t.skip.attach(t.env);
    t.down();
    return t;
  }

  it('AD-19 the tail consumes its pointerup and arms a 300 ms swallower and the 300 ms guard from the release; its click is consumed, the tail gone at the guard’s expiry', () => {
    const t = skipped();
    expect(t.timers.size).toBe(0);
    expect(t.up()).toEqual(CONSUMED);
    expect([...t.timers.values()].map((timer) => timer.ms)).toEqual([SWALLOW_MS, SWALLOW_MS]);
    expect(t.live()).toEqual([...PRESS_TAIL, 'document click'].sort());
    expect(t.fire('click', { detail: 1 })).toEqual(CONSUMED);
    expect(t.live()).toEqual(PRESS_TAIL);
    expect(t.fire('click', { detail: 1 })).toEqual(UNTOUCHED);
    expect(t.up()).toEqual(UNTOUCHED);
    t.elapse(SWALLOW_MS);
    expect(t.live()).toEqual([]);
    expect(t.timers.size).toBe(0);
  });

  it('AD-19 a press held over 300 ms before its release still swallows its click', () => {
    const t = skipped();
    t.elapse(10_000);
    expect(t.live()).toEqual(PRESS_TAIL);
    expect(t.up()).toEqual(CONSUMED);
    t.elapse(SWALLOW_MS - 1);
    expect(t.fire('click', { detail: 1 })).toEqual(CONSUMED);
    t.elapse(SWALLOW_MS);
    expect(t.live()).toEqual([]);
  });

  it('AD-19 before the release other pointer ids are ignored', () => {
    const t = skipped();
    expect(t.up(2)).toEqual(UNTOUCHED);
    expect(t.fire('pointercancel', { pointerId: 2 })).toEqual(UNTOUCHED);
    expect(t.fire('pointerdown', { pointerId: 2, button: 0 })).toEqual(UNTOUCHED);
    expect(t.live()).toEqual(PRESS_TAIL);
    expect(t.up()).toEqual(CONSUMED);
  });

  for (const type of ['pointercancel', 'pointerdown']) {
    it(`AD-19 a same-id ${type} before the release is a lost release: untouched, the tail gone`, () => {
      const t = skipped();
      expect(t.fire(type, { pointerId: 1, button: 0 })).toEqual(UNTOUCHED);
      expect(t.live()).toEqual([]);
      expect(t.up()).toEqual(UNTOUCHED);
      expect(t.fire('click', { detail: 1 })).toEqual(UNTOUCHED);
    });
  }

  it('AD-19 after the release a keyboard click (detail 0) passes and keeps the swallower armed', () => {
    const t = skipped();
    t.up();
    expect(t.fire('click', { detail: 0 })).toEqual(UNTOUCHED);
    expect(t.fire('click', { detail: 1 })).toEqual(CONSUMED);
  });

  it('AD-19 after the release the swallower’s expiry ends the tail', () => {
    const t = skipped();
    t.up();
    t.elapse(SWALLOW_MS);
    expect(t.live()).toEqual([]);
    expect(t.fire('click', { detail: 1 })).toEqual(UNTOUCHED);
  });

  for (const pointerId of [1, 2]) {
    it(`AD-19 a new press (id ${pointerId}) within 300 ms after the release is consumed: its pointerdown, pointerup and click (SPEC F18)`, () => {
      const t = skipped();
      t.up();
      expect(t.fire('click', { detail: 1 })).toEqual(CONSUMED);
      t.elapse(SWALLOW_MS - 1);
      expect(t.down({ pointerId })).toEqual(CONSUMED);
      expect(t.up(pointerId)).toEqual(CONSUMED);
      expect(t.fire('click', { detail: 1 })).toEqual(CONSUMED);
      expect(t.order).toEqual(['cancelGesture', 'end']);
      t.elapse(SWALLOW_MS);
      expect(t.live()).toEqual([]);
      expect(t.timers.size).toBe(0);
    });
  }

  it('AD-19 a new press within 300 ms after a release whose click was lost is consumed, its click too (SPEC F18)', () => {
    const t = skipped();
    t.up();
    expect(t.down({ pointerId: 2 })).toEqual(CONSUMED);
    expect(t.up(2)).toEqual(CONSUMED);
    expect(t.fire('click', { detail: 1 })).toEqual(CONSUMED);
    expect(t.fire('click', { detail: 1 })).toEqual(UNTOUCHED);
  });

  it('AD-19 a press at or after 300 ms from the release passes through untouched: pointerdown, pointerup and click (SPEC F18)', () => {
    const t = skipped();
    t.up();
    t.fire('click', { detail: 1 });
    t.elapse(SWALLOW_MS);
    expect(t.live()).toEqual([]);
    expect(t.down()).toEqual(UNTOUCHED);
    expect(t.up()).toEqual(UNTOUCHED);
    expect(t.fire('click', { detail: 1 })).toEqual(UNTOUCHED);
  });

  it('AD-19 a second finger pressed during the window, while a first new finger is still down, is consumed too; both releases consumed (SPEC F18)', () => {
    const t = skipped();
    t.up();
    expect(t.down({ pointerId: 2 })).toEqual(CONSUMED);
    expect(t.down({ pointerId: 3, clientX: 200 })).toEqual(CONSUMED);
    expect(t.up(3)).toEqual(CONSUMED);
    expect(t.up(2)).toEqual(CONSUMED);
    expect(t.fire('click', { detail: 1 })).toEqual(CONSUMED);
  });

  it('AD-19 a press consumed by the window but released after it: its pointerup and click still consumed; a press after the window passes and disarms (SPEC F18)', () => {
    const t = skipped();
    t.up();
    expect(t.down({ pointerId: 2 })).toEqual(CONSUMED);
    t.elapse(SWALLOW_MS);
    expect(t.timers.size).toBe(0);
    expect(t.live()).toEqual(PRESS_TAIL);
    // Pointer 2 still held; a new press now passes.
    expect(t.down({ pointerId: 3 })).toEqual(UNTOUCHED);
    expect(t.up(3)).toEqual(UNTOUCHED);
    expect(t.up(2)).toEqual(CONSUMED);
    expect(t.fire('click', { detail: 1 })).toEqual(CONSUMED);
    expect(t.live()).toEqual([]);
    // A window press released inside the window re-arms the swallower; once the window is over a
    // new pointerdown passes and disarms it.
    const u = skipped();
    u.up();
    // The guard is the first timer set at the release.
    const [guard] = [...u.timers.keys()];
    u.down({ pointerId: 2 });
    u.up(2);
    u.expire(guard as number);
    expect(u.live()).toEqual([...PRESS_TAIL, 'document click'].sort());
    expect(u.down({ pointerId: 4 })).toEqual(UNTOUCHED);
    expect(u.live()).toEqual([]);
    expect(u.timers.size).toBe(0);
    expect(u.fire('click', { detail: 1 })).toEqual(UNTOUCHED);
  });

  it('AD-19 a same-id pointercancel of a window press is a lost release: untouched, its release no longer consumed (SPEC F18)', () => {
    const t = skipped();
    t.up();
    t.down({ pointerId: 2 });
    expect(t.fire('pointercancel', { pointerId: 2 })).toEqual(UNTOUCHED);
    t.elapse(SWALLOW_MS);
    expect(t.live()).toEqual([]);
    expect(t.up(2)).toEqual(UNTOUCHED);
  });

  it('AD-19 halted (AD-15): a new press within the window passes through untouched (SPEC F18)', () => {
    const t = skipped();
    t.up();
    t.state.halted = true;
    expect(t.down({ pointerId: 2 })).toEqual(UNTOUCHED);
    expect(t.up(2)).toEqual(UNTOUCHED);
  });

  it('AD-19 halted (AD-15): the tail passes its pointerup and its click', () => {
    const t = skipped();
    t.state.halted = true;
    expect(t.up()).toEqual(UNTOUCHED);
    t.state.halted = false;
    t.up();
    t.state.halted = true;
    expect(t.fire('click', { detail: 1 })).toEqual(UNTOUCHED);
  });
});

describe('AD-19 Skip Space tail', () => {
  function skipped() {
    const t = setup();
    t.skip.attach(t.env);
    t.key(' ');
    return t;
  }

  it('AD-19 the tail consumes the skipping Space’s repeats and its keyup, then is gone; it sets no timer', () => {
    const t = skipped();
    expect(t.live()).toEqual(SPACE_TAIL);
    expect(t.timers.size).toBe(0);
    expect(t.key(' ', { repeat: true })).toEqual(CONSUMED);
    expect(t.key(' ', { repeat: true })).toEqual(CONSUMED);
    expect(t.key(' ', {}, 'keyup')).toEqual(CONSUMED);
    expect(t.live()).toEqual([]);
    expect(t.key(' ', { repeat: true })).toEqual(UNTOUCHED);
    expect(t.key(' ', {}, 'keyup')).toEqual(UNTOUCHED);
  });

  it('AD-19 other keys pass the tail untouched', () => {
    const t = skipped();
    expect(t.key('Enter')).toEqual(UNTOUCHED);
    expect(t.key('Enter', {}, 'keyup')).toEqual(UNTOUCHED);
    expect(t.live()).toEqual(SPACE_TAIL);
  });

  it('AD-19 a fresh Space keydown (a lost keyup) clears the tail and passes untouched', () => {
    const t = skipped();
    expect(t.key(' ')).toEqual(UNTOUCHED);
    expect(t.live()).toEqual([]);
    expect(t.key(' ', {}, 'keyup')).toEqual(UNTOUCHED);
  });

  it('AD-19 a window blur clears the tail', () => {
    const t = skipped();
    t.fire('blur', {}, 'window');
    expect(t.live()).toEqual([]);
    expect(t.key(' ', {}, 'keyup')).toEqual(UNTOUCHED);
  });

  it('AD-19 the tail has no expiry', () => {
    const t = skipped();
    t.elapse(60_000);
    expect(t.key(' ', { repeat: true })).toEqual(CONSUMED);
    expect(t.key(' ', {}, 'keyup')).toEqual(CONSUMED);
  });

  it('AD-19 halted (AD-15): the tail passes the repeats and the keyup', () => {
    const t = skipped();
    t.state.halted = true;
    expect(t.key(' ', { repeat: true })).toEqual(UNTOUCHED);
    expect(t.key(' ', {}, 'keyup')).toEqual(UNTOUCHED);
  });

  it('AD-19 a later skip replaces a live tail of the same kind', () => {
    const t = skipped();
    t.skip.attach(t.env);
    t.key(' ', { repeat: false });
    expect(t.live()).toEqual(SPACE_TAIL);
    expect(t.order).toEqual(['cancelGesture', 'end', 'cancelGesture', 'end']);
  });
});
