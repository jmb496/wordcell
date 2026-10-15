// Epic 6 CAP-1 (6.1, SPEC F5, F7): the reactive wrapper of `presence.ts` for Sheet, Panel, Dialog
// and WordCellView. `attach` goes on the element that holds the transitions (it forces one layout
// read, so the hidden start state is painted before `shown` is set); `onend` on its
// `transitionend` and `oncancel` on its `transitioncancel` (an interrupted open reverses and cancels
// the running transition; only a cancel with no replacement running unmounts). Focus: the opener at open is remembered; at close (stack
// removal, not at exit end) it gets focus back after the `tick()` flush that lets `main`'s `inert`
// clear, unless focus has moved somewhere outside this surface meanwhile (the next surface's start).
import { tick, untrack } from 'svelte';
import {
  onMounted,
  onOpenChange,
  onSettled,
  onTransitionEnd,
  ownsAnimation,
  ownsTransition,
  type PresenceState,
} from './presence';

export interface Presence {
  readonly present: boolean;
  readonly shown: boolean;
  attach(element: HTMLElement): () => void;
  onend(event: TransitionEvent): void;
  oncancel(event: TransitionEvent): void;
}

export function createPresence(isOpen: () => boolean): Presence {
  let state = $state.raw<PresenceState>({ present: isOpen(), shown: false });
  let node: HTMLElement | undefined;
  let opener: Element | null = null;
  let wasOpen = false;

  function opacityRunning(): boolean {
    return (
      node
        ?.getAnimations({ subtree: true })
        .some(
          (a) =>
            a instanceof CSSTransition &&
            ownsAnimation(a, node) &&
            a.transitionProperty === 'opacity' &&
            a.playState !== 'finished',
        ) ?? false
    );
  }

  // After a close is rendered: no opacity transition started (closed in the frame it opened, or the
  // transition is instant), so no event will come.
  function settleAfterClose(): void {
    void tick().then(() => {
      if (node === undefined) return;
      state = onSettled(state, isOpen(), opacityRunning());
    });
  }

  function restoreFocus(): void {
    const target = opener;
    void tick().then(() => {
      if (isOpen()) return; // reopened during the exit: keep the opener
      opener = null;
      if (!(target instanceof HTMLElement) || target === document.body || !target.isConnected) {
        return;
      }
      const active = document.activeElement;
      if (active !== null && active !== document.body && !node?.contains(active)) return;
      target.focus();
    });
  }

  $effect.pre(() => {
    const open = isOpen();
    untrack(() => {
      const wasPresent = state.present;
      state = onOpenChange(state, open, node !== undefined);
      if (open && !wasOpen && !wasPresent) opener = document.activeElement;
      if (!open && wasOpen) {
        settleAfterClose();
        restoreFocus();
      }
      wasOpen = open;
    });
  });

  return {
    get present() {
      return state.present;
    },
    get shown() {
      return state.shown;
    },
    attach(element) {
      return untrack(() => {
        node = element;
        element.getBoundingClientRect();
        state = onMounted(isOpen());
        return () => {
          node = undefined;
        };
      });
    },
    onend(event) {
      if (event.propertyName !== 'opacity' || !ownsTransition(event.target, node)) return;
      state = onTransitionEnd(state, isOpen());
    },
    oncancel(event) {
      if (event.propertyName !== 'opacity' || !ownsTransition(event.target, node)) return;
      state = onSettled(state, isOpen(), opacityRunning());
    },
  };
}
