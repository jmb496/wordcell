import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  duration,
  guardInstalled,
  hideClear,
  install,
  type MotionKind,
  notifySettled,
  setHoverClear,
  stagger,
  startTracker,
} from './motion';

const mocked = vi.hoisted(() => ({ motion: { baseMs: 180, reduced: false } }));

vi.mock('../shell/prefs.svelte', () => ({
  prefs: {
    get motion() {
      return mocked.motion;
    },
  },
}));

const FACTORS: [MotionKind, number][] = [
  ['snap', 1],
  ['flyBack', 1],
  ['parting', 0.5],
  ['undoRedo', 1],
  ['flyToCell', 2],
  ['overlay', 1],
];

beforeEach(() => {
  mocked.motion = { baseMs: 180, reduced: false };
});

describe('motion', () => {
  for (const baseMs of [90, 180, 320]) {
    it(`AD-10 motion durations at baseMs ${baseMs}: each kind is its factor × baseMs`, () => {
      mocked.motion = { baseMs, reduced: false };
      for (const [kind, factor] of FACTORS) expect(duration(kind), kind).toBe(baseMs * factor);
    });
  }

  for (const baseMs of [90, 180, 320]) {
    it(`AD-10 motion durations under reduced motion at baseMs ${baseMs}: 120 ms fade, parting 0`, () => {
      mocked.motion = { baseMs, reduced: true };
      for (const [kind] of FACTORS) {
        expect(duration(kind), kind).toBe(kind === 'parting' ? 0 : 120);
      }
    });
  }

  it('AD-10 motion durations follow a live change of prefs.motion', () => {
    expect(duration('flyToCell')).toBe(360);
    mocked.motion = { baseMs: 90, reduced: false };
    expect(duration('flyToCell')).toBe(180);
    mocked.motion = { baseMs: 90, reduced: true };
    expect(duration('flyToCell')).toBe(120);
  });

  it('AD-10 stagger() is 30 ms, 0 under reduced motion', () => {
    for (const baseMs of [90, 180, 320]) {
      mocked.motion = { baseMs, reduced: false };
      expect(stagger()).toBe(30);
      mocked.motion = { baseMs, reduced: true };
      expect(stagger()).toBe(0);
    }
  });
});

// AD-14 winning guard (SPEC F8, F23): fake EventTargets, plain-object events, fake timers.
type Listener = (event: Event) => void;
class FakeTarget {
  readonly listeners = new Map<string, Listener[]>();
  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  removeEventListener(type: string, listener: Listener): void {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((l) => l !== listener),
    );
  }
  count(): number {
    let n = 0;
    for (const list of this.listeners.values()) n += list.length;
    return n;
  }
  fire(type: string): void {
    for (const l of this.listeners.get(type) ?? []) l({ type } as Event);
  }
}

type Fake = {
  type: string;
  pointerId?: number;
  code?: string;
  repeat?: boolean;
  target: { closest(selector: string): unknown };
  prevented: number;
  stopped: number;
  preventDefault(): void;
  stopPropagation(): void;
};

const PLAIN = { closest: () => null };
const UNDO_TARGET = { closest: (selector: string) => (selector.includes('undo') ? {} : null) };

function make(type: string, extra: Partial<Fake> = {}, undo = false): Fake {
  const e: Fake = {
    type,
    target: undo ? UNDO_TARGET : PLAIN,
    prevented: 0,
    stopped: 0,
    preventDefault() {
      e.prevented++;
    },
    stopPropagation() {
      e.stopped++;
    },
    ...extra,
  };
  return e;
}

describe('AD-14 winning guard', () => {
  let doc: FakeTarget;
  let win: FakeTarget;
  let stop: () => void;
  let complete: () => void;
  let hover: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    doc = new FakeTarget();
    win = new FakeTarget();
    stop = startTracker(doc, win, () => Date.now(), {
      setTimer: (cb, ms) => setTimeout(cb, ms),
      clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    });
    complete = vi.fn();
    hover = vi.fn();
    setHoverClear(hover);
  });
  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  function send(e: Fake): Fake {
    for (const l of doc.listeners.get(e.type) ?? []) l(e as unknown as Event);
    return e;
  }
  const consumed = (e: Fake) => e.prevented === 1 && e.stopped === 1;
  const passed = (e: Fake) => e.prevented === 0 && e.stopped === 0;
  const down = (id: number, undo = false) => send(make('pointerdown', { pointerId: id }, undo));
  const up = (id: number, undo = false) => send(make('pointerup', { pointerId: id }, undo));
  const key = (code: string, repeat = false, undo = false) =>
    send(make('keydown', { code, repeat }, undo));
  const keyup = (code: string) => send(make('keyup', { code }));
  const click = (undo = false) => send(make('click', {}, undo));
  const win1 = () => install(true, complete);

  it('AD-14 startTracker adds six document and one window listener, stop removes them all, a second start throws', () => {
    expect(doc.count()).toBe(6);
    expect(win.count()).toBe(1);
    stop();
    expect(doc.count()).toBe(0);
    expect(win.count()).toBe(0);
    stop = startTracker(doc, win, () => Date.now(), {
      setTimer: (cb, ms) => setTimeout(cb, ms),
      clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    });
    expect(() =>
      startTracker(doc, win, () => 0, { setTimer: () => 0, clearTimer: () => undefined }),
    ).toThrow('twice');
  });

  it('AD-14 install clears a pending hover timer, install while installed changes nothing', () => {
    win1();
    expect(hover).toHaveBeenCalledTimes(1);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(100);
    install(true, vi.fn());
    expect(hover).toHaveBeenCalledTimes(1);
    expect(down(1).prevented).toBe(1);
    expect(complete).toHaveBeenCalledTimes(1);
    install(false, vi.fn());
    expect(guardInstalled()).toBe(true);
  });

  it('AD-14 a pointerdown before settle completes once and is consumed, its gesture to its end', () => {
    win1();
    expect(consumed(down(1))).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(consumed(up(1))).toBe(true);
    expect(consumed(click())).toBe(true);
    expect(consumed(down(2))).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('AD-14 a gesture at 299 ms is consumed, at 300 ms (settled) it is not and uninstalls', () => {
    win1();
    notifySettled();
    vi.advanceTimersByTime(299);
    expect(guardInstalled()).toBe(true);
    expect(consumed(down(1))).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    up(1);
    click();
    stop();
    stop = startTracker(doc, win, () => Date.now(), {
      setTimer: (cb, ms) => setTimeout(cb, ms),
      clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    });
    setHoverClear(hover);
    vi.setSystemTime(1000);
    win1();
    notifySettled();
    vi.advanceTimersByTime(300);
    expect(guardInstalled()).toBe(false);
    expect(passed(down(1))).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('AD-14 natural settle before 300 ms waits for 300 ms, after 300 ms uninstalls at settle', () => {
    win1();
    vi.advanceTimersByTime(100);
    notifySettled();
    vi.advanceTimersByTime(199);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(guardInstalled()).toBe(false);
    stop();
    stop = startTracker(doc, win, () => Date.now(), {
      setTimer: (cb, ms) => setTimeout(cb, ms),
      clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    });
    win1();
    vi.advanceTimersByTime(1000);
    expect(guardInstalled()).toBe(true);
    notifySettled();
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 a keydown after settle and 300 ms in the backstop window passes through and uninstalls', () => {
    win1();
    notifySettled();
    vi.advanceTimersByTime(300);
    expect(guardInstalled()).toBe(false);
    stop();
    stop = startTracker(doc, win, () => Date.now(), {
      setTimer: () => 0,
      clearTimer: () => undefined,
    });
    win1();
    notifySettled();
    vi.advanceTimersByTime(299);
    // Timers are inert here: the lazy check on the event uninstalls at 300 ms.
    vi.setSystemTime(Date.now() + 1);
    expect(passed(key('KeyA'))).toBe(true);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 the backstop runs duration(snap) after the last consumed end, 120 ms under reduced motion', () => {
    for (const reduced of [false, true]) {
      mocked.motion = { baseMs: 180, reduced };
      const snap = reduced ? 120 : 180;
      vi.setSystemTime(10_000);
      win1();
      down(1);
      vi.advanceTimersByTime(500);
      notifySettled();
      expect(guardInstalled()).toBe(true);
      up(1);
      vi.advanceTimersByTime(snap - 1);
      expect(guardInstalled()).toBe(true);
      vi.advanceTimersByTime(1);
      expect(guardInstalled()).toBe(false);
    }
  });

  it('AD-14 a consumed pointercancel ends the gesture with no owed click', () => {
    win1();
    down(1);
    expect(consumed(send(make('pointercancel', { pointerId: 1 })))).toBe(true);
    notifySettled();
    vi.advanceTimersByTime(300);
    expect(guardInstalled()).toBe(false);
    expect(passed(click())).toBe(true);
  });

  it('AD-14 a key held at install: repeats and keyup consumed, never complete', () => {
    key('Enter');
    win1();
    expect(consumed(key('Enter', true))).toBe(true);
    expect(consumed(keyup('Enter'))).toBe(true);
    expect(complete).not.toHaveBeenCalled();
    expect(consumed(click())).toBe(true);
  });

  it('AD-14 a start while a consumed gesture is open is consumed with no uninstall, the backstop counts from the last end', () => {
    win1();
    down(1);
    key('Enter');
    notifySettled();
    vi.advanceTimersByTime(1000);
    expect(guardInstalled()).toBe(true);
    // A pointerdown/keydown while a consumed gesture is open: consumed, no uninstall.
    expect(consumed(down(2))).toBe(true);
    vi.advanceTimersByTime(100);
    expect(consumed(key('KeyA'))).toBe(true);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(100);
    up(1);
    up(2);
    keyup('Enter');
    keyup('KeyA');
    vi.advanceTimersByTime(180);
    expect(guardInstalled()).toBe(false);
    // Owed click after uninstall: consumed once.
    expect(consumed(click())).toBe(true);
    expect(passed(click())).toBe(true);
  });

  it('AD-14 two overlapping pointers keep the guard until the last consumed end plus the backstop', () => {
    win1();
    down(1);
    notifySettled();
    vi.advanceTimersByTime(400);
    down(2);
    up(1);
    vi.advanceTimersByTime(500);
    expect(guardInstalled()).toBe(true);
    up(2);
    vi.advanceTimersByTime(179);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 a duplicate pointerdown of a tracked pointerId is the same gesture', () => {
    win1();
    down(1);
    notifySettled();
    vi.advanceTimersByTime(400);
    const dup = down(1);
    expect(consumed(dup)).toBe(true);
    up(1);
    vi.advanceTimersByTime(180);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 a stray keyup/pointerup is not consumed and does not extend the backstop', () => {
    win1();
    notifySettled();
    vi.advanceTimersByTime(250);
    expect(passed(up(9))).toBe(true);
    expect(passed(keyup('KeyZ'))).toBe(true);
    vi.advanceTimersByTime(50);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 a click with no tracked gesture is consumed while installed, inside Undo it is not', () => {
    win1();
    expect(consumed(click())).toBe(true);
    const u = click(true);
    expect(passed(u)).toBe(true);
    expect(guardInstalled()).toBe(false);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('AD-14 Undo pointerdown completes, uninstalls and passes through, its up and click too', () => {
    win1();
    vi.advanceTimersByTime(50);
    expect(passed(down(1, true))).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(guardInstalled()).toBe(false);
    expect(passed(up(1, true))).toBe(true);
    expect(passed(click(true))).toBe(true);
  });

  it('AD-14 Undo while a consumed pointer is open still undoes; the pointer stays consumed with one owed click', () => {
    win1();
    down(1);
    expect(passed(down(2, true))).toBe(true);
    expect(guardInstalled()).toBe(false);
    expect(passed(up(2, true))).toBe(true);
    expect(passed(click(true))).toBe(true);
    expect(consumed(up(1))).toBe(true);
    expect(consumed(click())).toBe(true);
    expect(passed(click())).toBe(true);
  });

  it('AD-14 consumed pointerup, Undo down/up/click, then the pointer click: owed neither consumed nor cleared by Undo', () => {
    win1();
    down(1);
    up(1);
    expect(passed(down(2, true))).toBe(true);
    expect(passed(up(2, true))).toBe(true);
    expect(passed(click(true))).toBe(true);
    expect(consumed(click())).toBe(true);
    expect(passed(click())).toBe(true);
  });

  it('AD-14 the next pointerdown or keydown clears the owed click', () => {
    for (const next of [() => down(5), () => key('KeyA')]) {
      win1();
      down(1);
      up(1);
      notifySettled();
      vi.advanceTimersByTime(300);
      expect(guardInstalled()).toBe(false);
      next();
      expect(passed(click())).toBe(true);
      send(make('pointerup', { pointerId: 5 }));
      keyup('KeyA');
    }
  });

  it('AD-14 hide clears every gesture, counts as settle and the last end, a held repeat after it is consumed', () => {
    key('Enter');
    win1();
    vi.advanceTimersByTime(250);
    hideClear();
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(consumed(key('Enter', true))).toBe(true);
    expect(guardInstalled()).toBe(true);
    // The deadline stays the hide time + duration(snap) (430 ms), not the repeat + duration(snap).
    vi.advanceTimersByTime(79);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(guardInstalled()).toBe(false);
    expect(passed(key('Enter', true))).toBe(true);
  });

  it('AD-14 a key held through blur before the win cannot strand the guard (backstop after the clear)', () => {
    key('Tab');
    win1();
    notifySettled();
    vi.advanceTimersByTime(1000);
    expect(guardInstalled()).toBe(true);
    win.fire('blur');
    vi.advanceTimersByTime(100);
    expect(consumed(key('Tab', true))).toBe(true);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(79);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 a gesture held through hide after install: cleared, guard ends after the backstop', () => {
    win1();
    down(1);
    key('KeyA');
    vi.advanceTimersByTime(50);
    hideClear();
    vi.advanceTimersByTime(300);
    expect(guardInstalled()).toBe(false);
    expect(passed(down(2))).toBe(true);
  });

  it('AD-14 an unconsumed gesture is cleared by hide and does not affect the next guard', () => {
    down(1);
    hideClear();
    win1();
    expect(passed(up(1))).toBe(true);
    expect(guardInstalled()).toBe(true);
  });

  it('AD-14 win, Undo, Redo win in sequence installs again', () => {
    win1();
    down(1, true);
    up(1, true);
    expect(guardInstalled()).toBe(false);
    const again = vi.fn();
    install(true, again);
    expect(guardInstalled()).toBe(true);
    expect(consumed(down(3))).toBe(true);
    expect(again).toHaveBeenCalledTimes(1);
  });

  it('AD-14 a first gesture 300 ms or more after install, before settle: complete settles inside it, the guard stays to its end plus the backstop', () => {
    install(
      true,
      vi.fn(() => notifySettled()),
    );
    vi.advanceTimersByTime(400);
    expect(consumed(down(1))).toBe(true);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(guardInstalled()).toBe(true);
    expect(consumed(up(1))).toBe(true);
    vi.advanceTimersByTime(179);
    expect(guardInstalled()).toBe(true);
    expect(consumed(click())).toBe(true);
    vi.advanceTimersByTime(1);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 a keydown inside Undo while installed passes through, completes once and uninstalls', () => {
    win1();
    expect(passed(key('KeyU', false, true))).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 a keydown inside Undo for a key code already consumed is still consumed', () => {
    key('Enter');
    win1();
    expect(consumed(key('Enter', false, true))).toBe(true);
    expect(guardInstalled()).toBe(true);
    expect(complete).not.toHaveBeenCalled();
  });

  it('AD-14 blur after install clears the open gestures: their ends pass, the backstop counts from the blur', () => {
    win1();
    down(1);
    key('Tab');
    vi.advanceTimersByTime(200);
    win.fire('blur');
    notifySettled();
    expect(passed(up(1))).toBe(true);
    expect(passed(keyup('Tab'))).toBe(true);
    vi.advanceTimersByTime(179);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 hide while not installed clears the open key, a later held repeat is consumed without moving the deadline', () => {
    key('Enter');
    hideClear();
    win1();
    vi.advanceTimersByTime(250);
    expect(consumed(key('Enter', true))).toBe(true);
    expect(guardInstalled()).toBe(true);
    notifySettled();
    vi.advanceTimersByTime(49);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 Undo uninstalls while a consumed key is open: its repeat and keyup are still consumed', () => {
    win1();
    expect(consumed(key('Enter'))).toBe(true);
    expect(passed(down(2, true))).toBe(true);
    expect(guardInstalled()).toBe(false);
    expect(consumed(key('Enter', true))).toBe(true);
    expect(consumed(keyup('Enter'))).toBe(true);
  });

  it('AD-14 blur clears a held pointer, then its pointerup over Undo does not uninstall', () => {
    win1();
    down(1);
    win.fire('blur');
    expect(passed(up(1, true))).toBe(true);
    expect(guardInstalled()).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('AD-14 a start in the backstop window after a consumed pointer end passes and uninstalls', () => {
    win1();
    down(1);
    notifySettled();
    vi.advanceTimersByTime(400);
    up(1);
    vi.advanceTimersByTime(50);
    expect(guardInstalled()).toBe(true);
    expect(passed(down(2))).toBe(true);
    expect(guardInstalled()).toBe(false);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('AD-14 a keydown in the backstop window after a consumed key end passes and uninstalls', () => {
    win1();
    key('Enter');
    notifySettled();
    vi.advanceTimersByTime(400);
    keyup('Enter');
    vi.advanceTimersByTime(50);
    expect(guardInstalled()).toBe(true);
    expect(passed(key('KeyA'))).toBe(true);
    expect(guardInstalled()).toBe(false);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('AD-14 a consumed pointer held well past settle and 300 ms keeps the guard until its pointerup plus the backstop', () => {
    win1();
    down(1);
    notifySettled();
    vi.advanceTimersByTime(5000);
    expect(guardInstalled()).toBe(true);
    up(1);
    vi.advanceTimersByTime(179);
    expect(guardInstalled()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(guardInstalled()).toBe(false);
  });

  it('AD-14 a click following a consumed Space or Enter keyup is consumed', () => {
    for (const code of ['Space', 'Enter']) {
      win1();
      key(code);
      notifySettled();
      vi.advanceTimersByTime(400);
      expect(consumed(keyup(code))).toBe(true);
      expect(consumed(click())).toBe(true);
      vi.advanceTimersByTime(180);
      expect(guardInstalled()).toBe(false);
    }
  });

  it('AD-14 the minimum holds at Fast (baseMs 90) and under reduced motion', () => {
    for (const motion of [
      { baseMs: 90, reduced: false },
      { baseMs: 90, reduced: true },
    ]) {
      mocked.motion = motion;
      const again = vi.fn();
      install(true, again);
      notifySettled();
      vi.advanceTimersByTime(299);
      expect(guardInstalled()).toBe(true);
      expect(consumed(down(7))).toBe(true);
      expect(again).toHaveBeenCalledTimes(1);
      up(7);
      click();
      vi.advanceTimersByTime(duration('snap'));
      expect(guardInstalled()).toBe(false);
    }
  });
});
