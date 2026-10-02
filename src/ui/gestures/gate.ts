// AD-11 deferral gate (build-notes CAP-3): layout work waits until no gesture, animation or page
// scroll is in progress, then runs in the next `requestAnimationFrame` in which the gate is idle.
// The pointer controller and fly-backs count through `enter`/`leave`; page scroll is busy from the
// first `scroll` until `scrollend`, the 150 ms quiet timer (A-A9) or `scrollReset` (the AD-9 hide
// flush). Frames and timers are injected so Vitest drives them.

export type GateDeps<H> = {
  raf(callback: () => void): void;
  setTimer(callback: () => void, ms: number): H;
  clearTimer(handle: H): void;
};

export type Gate = {
  enter(): void;
  leave(): void;
  readonly busy: boolean;
  whenIdle(fn: () => void): void;
  scroll(): void;
  scrollEnd(): void;
  ignoreNextScroll(): void;
  scrollReset(): void;
};

/** A-A9: page scroll counts as ended 150 ms after the last `scroll` event. */
export const SCROLL_QUIET_MS = 150;

export function createGate<H>({ raf, setTimer, clearTimer }: GateDeps<H>): Gate {
  let count = 0;
  let scrollBusy = false;
  let timer: { handle: H } | undefined;
  let ignore = false;
  let frameRequested = false;
  let queue: (() => void)[] = [];

  const busy = (): boolean => count > 0 || scrollBusy;

  function requestFrame(): void {
    if (frameRequested) return;
    frameRequested = true;
    raf(frame);
  }

  // Every transition to idle releases queued work in the next frame.
  function settled(): void {
    if (!busy() && queue.length > 0) requestFrame();
  }

  function stopTimer(): void {
    if (timer === undefined) return;
    clearTimer(timer.handle);
    timer = undefined;
  }

  function quiet(): void {
    timer = undefined;
    scrollBusy = false;
    settled();
  }

  // The own-write flag clears in every frame, scroll or not; a busy frame runs nothing. Work runs
  // as a FIFO snapshot, re-checking `busy` before each fn; work queued meanwhile waits a frame.
  function frame(): void {
    frameRequested = false;
    ignore = false;
    if (busy()) return;
    const snapshot = queue;
    queue = [];
    for (let i = 0; i < snapshot.length; i++) {
      if (busy()) {
        queue = [...snapshot.slice(i), ...queue];
        return;
      }
      (snapshot[i] as () => void)();
    }
  }

  return {
    enter(): void {
      count++;
    },
    leave(): void {
      if (count === 0) throw new Error('AD-11 gate leave() at count 0');
      count--;
      settled();
    },
    get busy(): boolean {
      return busy();
    },
    whenIdle(fn: () => void): void {
      queue.push(fn);
      requestFrame();
    },
    scroll(): void {
      if (ignore) return;
      scrollBusy = true;
      stopTimer();
      timer = { handle: setTimer(quiet, SCROLL_QUIET_MS) };
    },
    scrollEnd(): void {
      stopTimer();
      scrollBusy = false;
      settled();
    },
    ignoreNextScroll(): void {
      ignore = true;
      requestFrame();
    },
    scrollReset(): void {
      stopTimer();
      scrollBusy = false;
      ignore = false;
      settled();
    },
  };
}
