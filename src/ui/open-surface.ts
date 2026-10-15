// Epic 6 CAP-1 (6.1, SPEC F8, AD-13): the one way a menu item, button or key opens a surface. It
// clears a tail or tile selection (a tail selection pops its entry), closes a sticky view and any
// peek or hover peek, then opens `id`. Synchronous: the wait for a pop is nav's op queue (a pop
// settles before the next push, nav.ts), so there is no second wait here. Over a modal notice
// (historyNotice or resetConfirm on top) it throws the store's `AD-13 open(...)` before clearing
// anything, except for resetConfirm itself, which may stack on the History notice; every other
// illegal open is left to the store's pair guard.
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

export function openSurface(id: SurfaceId): void {
  const top = overlays.top;
  if (id !== 'resetConfirm' && (top === 'historyNotice' || top === 'resetConfirm')) {
    throw new Error(`AD-13 open(${id}) while ${top} is the top entry`);
  }
  if (overlays.isOpen(id)) {
    overlays.open(id);
    return;
  }
  overlays.clearTile();
  overlays.deselect();
  if (overlays.viewCell !== null) overlays.close('wordcellView');
  if (overlays.peek !== null) overlays.closePeek();
  overlays.closeHoverPeek();
  overlays.open(id);
}
