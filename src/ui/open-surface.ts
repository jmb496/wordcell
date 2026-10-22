// Epic 6 CAP-1 (6.1, SPEC F8, AD-13): the one way a menu item, button or key opens a surface. It
// clears a tile selection, closes a sticky view and any peek or hover peek, then clears a tail
// selection (`closeTransient`; a tail selection pops its entry), then opens `id`. Synchronous: the wait for a pop is nav's op queue (a pop
// settles before the next push, nav.ts), so there is no second wait here. Over a modal notice
// (historyNotice or resetConfirm on top) it throws the store's `AD-13 open(...)` before clearing
// anything, except for resetConfirm itself, which stacks on the History notice as it is (whatever
// sits beneath the notice stays, and clearing it would close a non-top entry); every other illegal
// open is left to the store's pair guard.
// Origin (build-notes Per-surface behaviour: focus returns to the opener): `{ from: 'menu' }` from a
// Menu row records that its opener left with the menu, so the surface returns focus to the ☰
// button (focus-board.ts `focusMenuButton`). One record per id, rewritten by every open of that id
// and taken once by the surface's close effect, which runs on every close path (close, back,
// `resetForNewSession`).
import { type OverlayId, overlays } from './overlays.svelte';

export type SurfaceId = Extract<
  OverlayId,
  | 'menu'
  | 'statistics'
  | 'preferences'
  | 'howToPlay'
  | 'newGameConfirm'
  | 'replayConfirm'
  | 'resetConfirm'
>;

const fromMenu = new Set<SurfaceId>();

export function openSurface(id: SurfaceId, { from }: { from?: 'menu' } = {}): void {
  const top = overlays.top;
  if (id !== 'resetConfirm' && (top === 'historyNotice' || top === 'resetConfirm')) {
    throw new Error(`AD-13 open(${id}) while ${top} is the top entry`);
  }
  if (!overlays.isOpen(id) && !(id === 'resetConfirm' && top === 'historyNotice')) {
    overlays.clearTile();
    closeTransient();
  }
  overlays.open(id);
  if (from === 'menu') fromMenu.add(id);
  else fromMenu.delete(id);
}

/** At the close of `id`: whether a Menu row opened it; clears the record (taken once). */
export function takeMenuOrigin(id: SurfaceId): boolean {
  return fromMenu.delete(id);
}

/**
 * F39 (AD-13): closes the sticky WordCell view and any peek or hover peek, then pops a tail
 * selection's entry (`overlays.deselect()`, which throws only with a modal on top). The view goes
 * first: a peek promoted to sticky over a tail selection leaves [tailSelection, wordcellView].
 * Shared by openSurface and src/ui/commands.ts so the order cannot drift.
 */
export function closeTransient(): void {
  if (overlays.viewCell !== null) overlays.close('wordcellView');
  if (overlays.peek !== null) overlays.closePeek();
  overlays.closeHoverPeek();
  overlays.deselect();
}
