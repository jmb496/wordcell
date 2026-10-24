// AD-19 Skip (R-87; epic 10 entry 6): the win celebration's skips. While a run is live,
// run-scoped capture-phase `pointerdown` and `keydown` listeners on `document` (attached at the
// run's `start()`, removed at its internal stop) end it: a primary-button press of any pointer type
// whose press point (`elementFromPoint(clientX, clientY)`, never `event.target`, which Chromium's
// touch adjustment moves onto a bar control for a touch just beside a bar; as the controller, epic
// 4 SPEC F13) is outside the top bar, the action bar and the dictionary banner, and a non-repeat
// `Space` (no Shift) or `Esc` (Shift allowed) with no Ctrl/Meta/Alt, whatever holds focus (SPEC
// F17). A skip is `stopPropagation()` + `preventDefault()`, then `cancelGesture()` (a press held
// from before the start, the controller's hover-peek upkeep) and `end()`, so the bubble-phase
// pointer controller never opens a press for it and keys.ts sees a prevented key. Only the skipping
// input is consumed: a pointer held from before the start never is (its `pointerup` is not the
// run's), and a finish or the cap consumes nothing. Every other `Space` keydown of the run, a
// chorded one (Shift, Ctrl, Meta or Alt) or a repeat (a chord held past the repeat delay, or one
// whose modifier was released), does not skip, but is `preventDefault()`ed only, so it never
// activates a focused button (SPEC F17; preventing the keydowns is enough in Chromium, the keyup
// then clicks nothing).
// Each skip leaves a one-shot post-run tail (AD-19 Skip refinement, see the ticket plan):
// - press tail, for the skipping `pointerId`: before release it consumes that pointer's
//   `pointerup` and arms its own `createClickSwallower` there (300 ms from the release); a same-id
//   `pointercancel` or `pointerdown` is a lost release (tail gone, nothing consumed), other ids pass.
//   The release opens the `SWALLOW_MS` guard (SPEC F18): until it expires every new `pointerdown`,
//   any id, is consumed and held like the skipping press (its `pointerup` consumed, the swallower
//   re-armed from that release for its click), so a double-tap's second tap never reaches the end
//   sheet. After the guard any `pointerdown` disarms the swallower (as the controller's `disarm()`)
//   and is a lost release for its id. The tail ends once the guard has expired, no held press is
//   left and the swallower is disarmed (its click, expiry or `disarm()`).
// - Space tail: consumes the skipping `Space`'s repeats and its `keyup`, gone on that keyup; a
//   fresh `Space` keydown (a lost keyup, as motion.ts) or a window `blur` clears it, no expiry.
// Every listener sits behind motion.ts's boot-time tracker on the same node and never reads
// `defaultPrevented` (the tracker may consume first; its `stopPropagation` does not stop
// same-node listeners). While halted (AD-15) the run listeners and both tails pass everything.
import { createClickSwallower, SWALLOW_MS } from '../gestures/click-swallow';

type ListenTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/** The environment a run attaches to (the real `document`, `window` and timers in the app). */
export type SkipEnv = {
  readonly doc: ListenTarget & Pick<Document, 'elementFromPoint'>;
  readonly win: ListenTarget;
  setTimer(callback: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
};

export type SkipDeps = {
  /** The run's end (the controller's `end()`). */
  end(): void;
  /** act.ts `cancelGesture`, called by every skip (press and key) before `end()`. */
  cancelGesture(): void;
  /** Whether the store is halted (AD-15). */
  halted(): boolean;
};

export type Skip = {
  /** Adds the run listeners (a run's `start()`). */
  attach(env: SkipEnv): void;
  /** Removes the run listeners (the run's internal stop); the tails stay. */
  detach(): void;
};

const BARS = '[data-band="topBar"],[data-band="actionBar"],[data-band="banner"]';
const CAPTURE = { capture: true } as const;

function consume(event: Event): void {
  event.stopPropagation();
  event.preventDefault();
}

function inBars(doc: SkipEnv['doc'], event: PointerEvent): boolean {
  return (doc.elementFromPoint(event.clientX, event.clientY)?.closest(BARS) ?? null) !== null;
}

type Tail = { clear(): void };

export function createSkip(deps: SkipDeps): Skip {
  /** The live run's listener removal. */
  let run: (() => void) | null = null;
  let pressTail: Tail | null = null;
  let spaceTail: Tail | null = null;

  function armPressTail(env: SkipEnv, pointerId: number): void {
    pressTail?.clear();
    const { doc } = env;
    const swallower = createClickSwallower<unknown>({
      setTimer: env.setTimer,
      clearTimer: env.clearTimer,
    });
    /** The consumed presses not yet released: the skipping one, then the guard's (SPEC F18). */
    const held = new Set([pointerId]);
    let released = false;
    /** The guard's expiry timer, live from the skipping release for `SWALLOW_MS`. */
    let guard: unknown = null;
    let ended = false;
    // The swallower's click listener, gated on the halt; its removal (click, expiry or `disarm()`)
    // may end the tail.
    let gated: EventListener | null = null;
    const target = {
      addEventListener(type: string, listener: EventListener, options: AddEventListenerOptions) {
        gated = (event) => {
          if (!deps.halted()) listener(event);
        };
        doc.addEventListener(type, gated, options);
      },
      removeEventListener(type: string, _listener: EventListener, options: EventListenerOptions) {
        if (gated !== null) doc.removeEventListener(type, gated, options);
        gated = null;
        settle();
      },
    } as unknown as EventTarget;

    function settle(): void {
      if (guard === null && held.size === 0 && gated === null) tail.clear();
    }

    function onGuardEnd(): void {
      guard = null;
      settle();
    }

    function onPointer(event: Event): void {
      if (deps.halted()) return;
      const id = (event as PointerEvent).pointerId;
      if (event.type === 'pointerdown') {
        if (guard !== null) {
          consume(event);
          held.add(id);
          return;
        }
        held.delete(id);
        swallower.disarm();
        settle();
        return;
      }
      if (!held.has(id)) return;
      if (event.type === 'pointercancel') {
        // A lost release: nothing consumed.
        held.delete(id);
        settle();
        return;
      }
      consume(event);
      if (!released) {
        released = true;
        guard = env.setTimer(onGuardEnd, SWALLOW_MS);
      }
      // Armed before the id leaves `held`, so the re-arm's own removal never ends the tail.
      swallower.arm(target);
      held.delete(id);
    }

    const tail: Tail = {
      clear() {
        if (ended) return;
        ended = true;
        doc.removeEventListener('pointerdown', onPointer, CAPTURE);
        doc.removeEventListener('pointerup', onPointer, CAPTURE);
        doc.removeEventListener('pointercancel', onPointer, CAPTURE);
        if (guard !== null) env.clearTimer(guard);
        guard = null;
        held.clear();
        swallower.disarm();
        if (pressTail === tail) pressTail = null;
      },
    };
    pressTail = tail;
    doc.addEventListener('pointerdown', onPointer, CAPTURE);
    doc.addEventListener('pointerup', onPointer, CAPTURE);
    doc.addEventListener('pointercancel', onPointer, CAPTURE);
  }

  function armSpaceTail(env: SkipEnv): void {
    spaceTail?.clear();
    const { doc, win } = env;

    function onKey(event: Event): void {
      const key = event as KeyboardEvent;
      if (deps.halted() || key.key !== ' ') return;
      if (event.type === 'keydown' && !key.repeat) {
        // A lost keyup: the fresh keydown passes untouched.
        tail.clear();
        return;
      }
      consume(event);
      if (event.type === 'keyup') tail.clear();
    }

    function onBlur(): void {
      tail.clear();
    }

    const tail: Tail = {
      clear() {
        doc.removeEventListener('keydown', onKey, CAPTURE);
        doc.removeEventListener('keyup', onKey, CAPTURE);
        win.removeEventListener('blur', onBlur);
        if (spaceTail === tail) spaceTail = null;
      },
    };
    spaceTail = tail;
    doc.addEventListener('keydown', onKey, CAPTURE);
    doc.addEventListener('keyup', onKey, CAPTURE);
    win.addEventListener('blur', onBlur);
  }

  function attach(env: SkipEnv): void {
    if (run !== null) throw new Error('AD-19 skip: attach() while attached');
    const onDown = (event: Event): void => {
      const e = event as PointerEvent;
      if (deps.halted() || e.button !== 0 || inBars(env.doc, e)) return;
      consume(event);
      armPressTail(env, e.pointerId);
      deps.cancelGesture();
      deps.end();
    };
    const onKey = (event: Event): void => {
      const e = event as KeyboardEvent;
      if (deps.halted()) return;
      const chord = e.ctrlKey || e.metaKey || e.altKey;
      const space = e.key === ' ';
      if (space && (e.repeat || chord || e.shiftKey)) {
        event.preventDefault();
        return;
      }
      if (e.repeat || chord) return;
      if (!space && e.key !== 'Escape') return;
      consume(event);
      if (space) armSpaceTail(env);
      deps.cancelGesture();
      deps.end();
    };
    env.doc.addEventListener('pointerdown', onDown, CAPTURE);
    env.doc.addEventListener('keydown', onKey, CAPTURE);
    run = () => {
      env.doc.removeEventListener('pointerdown', onDown, CAPTURE);
      env.doc.removeEventListener('keydown', onKey, CAPTURE);
    };
  }

  function detach(): void {
    const remove = run;
    if (remove === null) throw new Error('AD-19 skip: detach() while detached');
    run = null;
    remove();
  }

  return { attach, detach };
}
