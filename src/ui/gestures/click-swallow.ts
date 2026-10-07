// AD-12 sticky-view trailing-click swallower (build-notes CAP-9, R-65 "the tap that closes it is
// consumed"): after a sheet or scrim tap closes the view, a one-shot capture-phase `click` listener
// on the controller's attach root stops that gesture's trailing pointer click (`detail ≥ 1`) from
// reaching whatever lies under the closed scrim (`stopPropagation()` + `preventDefault()`). It
// disarms on the swallowed click, on `disarm()` (the controller's next pointerdown and detach) or
// at the 300 ms expiry armed at pointerup, whichever comes first. A keyboard click (`detail 0`)
// passes and keeps it armed. Timers come from the controller's injected `setTimer`/`clearTimer`.

export const SWALLOW_MS = 300;

export type ClickSwallowerDeps<H> = {
  setTimer(callback: () => void, ms: number): H;
  clearTimer(handle: H): void;
};

export type ClickSwallower = {
  /** Arms on `target` (re-arms when already armed). */
  arm(target: EventTarget): void;
  /** Removes the listener and the expiry timer; a no-op when disarmed. */
  disarm(): void;
};

const CAPTURE = { capture: true } as const;

export function createClickSwallower<H>(deps: ClickSwallowerDeps<H>): ClickSwallower {
  let armed: { readonly target: EventTarget; readonly timer: H } | null = null;

  function swallow(event: Event): void {
    if ((event as MouseEvent).detail === 0) return;
    event.stopPropagation();
    event.preventDefault();
    disarm();
  }

  function disarm(): void {
    const current = armed;
    if (current === null) return;
    armed = null;
    current.target.removeEventListener('click', swallow, CAPTURE);
    deps.clearTimer(current.timer);
  }

  function arm(target: EventTarget): void {
    disarm();
    target.addEventListener('click', swallow, CAPTURE);
    armed = { target, timer: deps.setTimer(disarm, SWALLOW_MS) };
  }

  return { arm, disarm };
}
