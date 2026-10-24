// AD-19 Skip (R-87; epic 10 entry 6): the win celebration's skips. While a run is live,
// run-scoped capture-phase `pointerdown` and `keydown` listeners on `document` (attached at the
// run's `start()`, removed at its internal stop) end it: a primary-button press of any pointer type
// whose target is outside the top bar, the action bar and the dictionary banner, and a non-repeat
// `Space` (no Shift) or `Esc` (Shift allowed) with no Ctrl/Meta/Alt, whatever holds focus (SPEC
// F17). A skip is `stopPropagation()` + `preventDefault()`, then `cancelGesture()` (a press held
// from before the start, the controller's hover-peek upkeep) and `end()`, so the bubble-phase
// pointer controller never opens a press for it and keys.ts sees a prevented key. Only the skipping input is consumed: a pointer held from before the
// start never is (its `pointerup` is not the run's), and a finish or the cap consumes nothing.
// Each skip leaves a one-shot post-run tail (AD-19 Skip refinement, see the ticket plan):
// - press tail, for the skipping `pointerId`: before release it consumes that pointer's
//   `pointerup` and arms its own `createClickSwallower` there (300 ms from the release); a same-id
//   `pointercancel` or `pointerdown` is a lost release (tail gone, nothing consumed). After release
//   any `pointerdown` disarms the swallower (as the controller's `disarm()`); its click or expiry
//   ends the tail too.
// - Space tail: consumes the skipping `Space`'s repeats and its `keyup`, gone on that keyup; a fresh
//   `Space` keydown (a lost keyup, as motion.ts) or a window `blur` clears it, no expiry.
// Every listener sits behind motion.ts's boot-time tracker on the same node and never reads
// `defaultPrevented` (the tracker may consume first; its `stopPropagation` does not stop
// same-node listeners). While halted (AD-15) the run listeners and both tails pass everything.
import { createClickSwallower } from '../gestures/click-swallow';

type ListenTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/** The environment a run attaches to (the real `document`, `window` and timers in the app). */
export type SkipEnv = {
  readonly doc: ListenTarget;
  readonly win: ListenTarget;
  setTimer(callback: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
};

export type SkipDeps = {
  /** The run's end (the controller's `end()`). */
  end(): void;
  /** act.ts `cancelGesture` (the key skip only). */
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

function inBars(event: Event): boolean {
  return ((event.target as Element | null)?.closest(BARS) ?? null) !== null;
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
    // The swallower's click listener, gated on the halt; its removal (click, expiry or `disarm()`)
    // ends the tail.
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
        if (pressTail === tail) pressTail = null;
        doc.removeEventListener('pointerdown', onLaterDown, CAPTURE);
      },
    } as unknown as EventTarget;

    function removeHeld(): void {
      doc.removeEventListener('pointerup', onHeld, CAPTURE);
      doc.removeEventListener('pointercancel', onHeld, CAPTURE);
      doc.removeEventListener('pointerdown', onHeld, CAPTURE);
    }

    function onHeld(event: Event): void {
      if (deps.halted() || (event as PointerEvent).pointerId !== pointerId) return;
      removeHeld();
      if (event.type !== 'pointerup') {
        // A lost release: nothing consumed.
        if (pressTail === tail) pressTail = null;
        return;
      }
      consume(event);
      doc.addEventListener('pointerdown', onLaterDown, CAPTURE);
      swallower.arm(target);
    }

    function onLaterDown(): void {
      swallower.disarm();
    }

    const tail: Tail = {
      clear() {
        removeHeld();
        swallower.disarm();
        doc.removeEventListener('pointerdown', onLaterDown, CAPTURE);
        if (pressTail === tail) pressTail = null;
      },
    };
    pressTail = tail;
    doc.addEventListener('pointerup', onHeld, CAPTURE);
    doc.addEventListener('pointercancel', onHeld, CAPTURE);
    doc.addEventListener('pointerdown', onHeld, CAPTURE);
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
      if (deps.halted() || e.button !== 0 || inBars(event)) return;
      consume(event);
      armPressTail(env, e.pointerId);
      deps.cancelGesture();
      deps.end();
    };
    const onKey = (event: Event): void => {
      const e = event as KeyboardEvent;
      if (deps.halted() || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const space = e.key === ' ' && !e.shiftKey;
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
