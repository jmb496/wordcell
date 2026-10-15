// Epic 6 CAP-1 (6.1, SPEC F7): the presence state of a surface that opens and closes with a CSS
// transition (never WAAPI). `present` is "rendered", `shown` is the end-state class that the
// transition runs towards: open mounts the element hidden and sets `shown` once it is attached; close
// clears `shown` and keeps the element (non-interactive) until the opacity transition ends or is
// cancelled. Every function returns the state of the latest `open`, so an interrupted open or close,
// and a close then reopen of the same id during the exit, end in the state of the latest stack.
export interface PresenceState {
  readonly present: boolean;
  readonly shown: boolean;
}

/** `open` changed. `mounted`: the element is attached (it can transition). */
export function onOpenChange(state: PresenceState, open: boolean, mounted: boolean): PresenceState {
  if (open) return { present: true, shown: mounted ? true : state.shown };
  return state.shown ? { present: true, shown: false } : { present: false, shown: false };
}

/** The element attached; `open` is the latest value. */
export function onMounted(open: boolean): PresenceState {
  return { present: open, shown: open };
}

/** `transitionend` or `transitioncancel` of the opacity property. */
export function onTransitionEnd(state: PresenceState, open: boolean): PresenceState {
  if (open || state.shown || !state.present) return state;
  return { present: false, shown: false };
}

/**
 * A multi-click guard shared by the surface components: no part of a surface acts on the second or
 * later click of a multi-click (a double tap on the opener lands its second click on the freshly
 * mounted surface). Keyboard activation has detail 0.
 */
export function firstClick(handler: (() => void) | undefined): (event: MouseEvent) => void {
  return (event) => {
    if (event.detail > 1) return;
    handler?.();
  };
}
