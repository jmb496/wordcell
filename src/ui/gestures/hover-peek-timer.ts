// AD-12 desktop hover-peek timer (epic 4 SPEC CAP-9, epic 4 SPEC F19; AD-12, AD-13): a mouse
// `pointerover` entering a `[data-wordcell]` (relatedTarget outside it or null) arms one
// LONG_PRESS_MS timer (a single slot keyed by cell number, so a replaced cell node's pointerout
// still stops it) while
// `hoverFine()`, with no press held, no fly-back, `buttons` 0, the cell not suppressed, its hover
// peek not open and the cell non-empty in the GameView (AD-3); any real cell entry stops a pending
// timer before its no-arm returns, and an entry into another cell closes an open hover peek first
// (a removed node sends no pointerout). At fire it re-checks `hoverFine` and emptiness and calls
// `overlays.openHoverPeek` (the store gates peek, view and modal tops). A mouse `pointerout`
// leaving the cell clears its timer, closes the hover peek and lifts its suppression. Suppression
// is one `[data-wordcell]` slot: the cell whose rect, half-open (a shared edge goes right or
// lower), holds the last mouse point, set by the controller at every mouse press end, fly-back
// settle and cancel(), so boundary pointerovers into it never arm until a pointerout leaves it;
// `reset()` empties it at detach. `hideHoverPeek()` hides `[data-hover-peek]` with
// `wc-hover-peek-hidden` (DOM only) when a pick-up drag starts. The controller's state is read
// through getters; timers come from its injected `setTimer`/`clearTimer`.
import { game } from '../../shell/game.svelte';
import { overlays } from '../overlays.svelte';
import { HOVER_PEEK_HIDDEN } from './classes';
import { LONG_PRESS_MS } from './classify';
import type { ControllerDeps } from './controller';
import { attribute, cellIn } from './lookup';

export type HoverPeekTimerHooks = {
  /** The controller's attach root, null when detached. */
  root(): HTMLElement | null;
  /** The last mouse point inside the root, null once it left. */
  lastPoint(): { readonly x: number; readonly y: number } | null;
  /** Any press is held. */
  pressHeld(): boolean;
  /** A fly-back runs. */
  flying(): boolean;
};

export type HoverPeekTimer = {
  hoverEnter(event: PointerEvent): void;
  hoverLeave(event: PointerEvent): void;
  stopHoverTimer(): void;
  /** Clears the timer and closes the hover peek. */
  closeHover(): void;
  hideHoverPeek(): void;
  /** The suppression slot becomes the cell under the last mouse point, else null. */
  suppress(): void;
  /** Empties the suppression slot (detach). */
  reset(): void;
};

export function createHoverPeekTimer<H>(
  deps: Pick<ControllerDeps<H>, 'setTimer' | 'clearTimer' | 'hoverFine'>,
  hooks: HoverPeekTimerHooks,
): HoverPeekTimer {
  /** Epic 4 SPEC F19: the one pending hover-peek timer and the cell number it was armed for. */
  let hoverTimer: { readonly handle: H; readonly cell: number } | null = null;
  /**
   * Epic 4 SPEC F19: the `[data-wordcell]` whose pointerovers never arm until a pointerout leaves
   * it.
   */
  let suppressed: Element | null = null;

  function stopHoverTimer(): void {
    if (hoverTimer === null) return;
    deps.clearTimer(hoverTimer.handle);
    hoverTimer = null;
  }

  // Epic 4 SPEC F19: clears the timer and closes the hover peek.
  function closeHover(): void {
    stopHoverTimer();
    overlays.closeHoverPeek();
  }

  function hideHoverPeek(): void {
    const root = hooks.root();
    if (root === null) throw new Error('AD-12 hover peek hide without a root');
    root.querySelector('[data-hover-peek]')?.classList.add(HOVER_PEEK_HIDDEN);
  }

  // Epic 4 SPEC F19: the suppression slot becomes the `[data-wordcell]` whose rect holds the last
  // mouse point (geometric: a scrim may still cover it), else null.
  function suppress(): void {
    suppressed = null;
    const root = hooks.root();
    const pt = hooks.lastPoint();
    if (root === null || pt === null) return;
    for (const el of root.querySelectorAll('[data-wordcell]')) {
      const r = el.getBoundingClientRect();
      // Half-open, so a shared edge belongs to the right or lower cell.
      if (pt.x >= r.left && pt.x < r.right && pt.y >= r.top && pt.y < r.bottom) {
        suppressed = el;
        return;
      }
    }
  }

  function reset(): void {
    suppressed = null;
  }

  // The `[data-wordcell]` a boundary event's target lies in, if any.
  function cellOf(target: EventTarget | null): Element | null {
    return target === null ? null : (target as Element).closest('[data-wordcell]');
  }

  // True when `to` lies outside `cellEl` (null: the pointer came from or went to nothing).
  function outside(cellEl: Element, to: EventTarget | null): boolean {
    return to === null || !cellEl.contains(to as Node);
  }

  function hoverEnter(event: PointerEvent): void {
    const cellEl = cellOf(event.target);
    if (cellEl === null || !outside(cellEl, event.relatedTarget)) return;
    const n = attribute(cellEl, 'data-wordcell');
    // A cell entry stops any pending timer before the no-arm returns.
    stopHoverTimer();
    // Entering another cell closes its hover peek even with no pointerout from it.
    if (overlays.hoverPeek !== null && overlays.hoverPeek !== n) overlays.closeHoverPeek();
    if (!deps.hoverFine() || hooks.pressHeld() || hooks.flying() || event.buttons !== 0) return;
    if (cellEl === suppressed) return;
    if (overlays.hoverPeek === n || cellCards(n) === 0) return;
    hoverTimer = { handle: deps.setTimer(() => onHoverTimer(n), LONG_PRESS_MS), cell: n };
  }

  function onHoverTimer(n: number): void {
    hoverTimer = null;
    if (!deps.hoverFine() || cellCards(n) === 0) return;
    overlays.openHoverPeek(n);
  }

  // AD-3: a WordCell's card count from the GameView.
  function cellCards(n: number): number {
    const view = game.view;
    if (view === undefined) throw new Error('AD-12 hover peek without a GameView');
    return cellIn(view.cells, n, `AD-12 hover peek on unknown cell ${n}`).cards.length;
  }

  function hoverLeave(event: PointerEvent): void {
    const cellEl = cellOf(event.target);
    if (cellEl === null || !outside(cellEl, event.relatedTarget)) return;
    if (hoverTimer?.cell === attribute(cellEl, 'data-wordcell')) stopHoverTimer();
    overlays.closeHoverPeek();
    if (suppressed === cellEl) suppressed = null;
  }

  return { hoverEnter, hoverLeave, stopHoverTimer, closeHover, hideHoverPeek, suppress, reset };
}
