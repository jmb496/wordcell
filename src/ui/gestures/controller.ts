// AD-12 pointer controller (epic 4 SPEC CAP-4, epic 4 build-notes CAP-4): the press machine, one
// active press per root, fed to the pure `classify`. A button-0 pointerdown with no active press,
// not on an enabled button (epic 4 SPEC F25), enters the gate and resolves a `PressTarget` and a
// `Hit` (intent.ts) from `elementFromPoint` at the press point, never `event.target` (epic 4 SPEC
// F13): a card by `data-place` (a tray/strip card as a `tile` hit with its CardId, epic 5 SPEC F2),
// a tray-band mirror as a `block` hit, a WordCell part by
// `[data-wordcell]`, a non-card column part by `[data-column]`/`[data-foot]` (uncaptured with
// nothing selected, so a pan cancels it; with a tail selected captured on its `[data-foot]` or
// `[data-column]`), anything else uncaptured. Every other pointerId is untouched (no
// preventDefault or stopPropagation). A same-id pointerdown, of any button (epic 4 SPEC CAP-4),
// ends the lost press before the button check. One `end` path for pointerup, pointercancel,
// lostpointercapture (captured element only), cancel(), a same-id pointerdown and detach: timer
// cleared, press cleared before capture is released, a peek closed
// (cancel/pointercancel/lostpointercapture, AD-13), then one `gate.leave()`. `contextmenu` is
// preventDefaulted for a press it captured (epic 4 SPEC CAP-4, rule-coverage AD-11) and, after
// cancel()/lostpointercapture of one, until that pointerId's pointerup/pointercancel, the next
// captured press or detach.
// Taps (epic 4 SPEC CAP-6, epic 4 SPEC F25, epic 4 SPEC F26, epic 4 SPEC F31): only `classify`'s
// final `tap` acts, after `end()`: select, deselect, or deselect then one `drop`. A `click` acts
// only for non-pointer activation (`detail === 0`) resolving outside, or on a tile or block hit,
// mapped to outside (epic 4 SPEC F25, epic 5 SPEC F2), never touching the tile selection. Tile
// selection (epic 5 SPEC CAP-4, F1, F13, F18): every released tap first applies tile.ts `tileTap`
// (select, deselect, swap or remove, else keep or clear), clearing before any dispatch; a swap
// dispatches one `arrange`/`setPlacementOrder` and a removal one `removeFreeLetter`; only non-tile,
// non-block taps then go on to `tapAction`. A non-tile, non-block press that crossed the threshold
// with no pick-up drag and ends in pointerup applies `tileTap`'s keep or clear the same way (before
// R-39's drag-as-tap dispatch); a live tile press clears the tile selection at its threshold
// crossing and becomes a tile drag (below); a block press or drag keeps it and moves nothing. Every
// other end (pointercancel, lostpointercapture, a same-id pointerdown, cancel()) and a long-press
// peek keep it; cancel() never clears it (AD-9 hide flush). Mouse hover (`pointerType === 'mouse'`)
// toggles `wc-hover-tail` (+ `--wc-hover-from`), `wc-grab`, `wc-drop` and `wc-drop-self` on at most
// one `[data-column]`, recomputed at the last point by `pointerover` and `refreshHover()` (App's
// reaction to the selection and the GameView).
// Drag (epic 4 SPEC CAP-7, AD-12, epic 4 SPEC F12, epic 4 SPEC F13, epic 4 SPEC F26): a column-card
// press whose column `canPickUp` turns into a drag at the threshold-crossing move (the first drag
// move): the tail (pressed card to the bottom, R-10) gets `wc-drag-ghost` on its slot wrappers and
// `wc-drag-layer` on its faces; each drag move writes `translate(pointer − press point)` (epic 4
// SPEC F32: minus a selected face's lift) on the faces, measures the grabbed face against every
// registered drop target (`drop-target.ts`), each clipped to the visible band (visible-band.ts,
// epic 4 SPEC F34), with `pickTarget` and moves `wc-drag-target` to the highlighted column's target
// element, all by DOM only (no Svelte state, store call or dispatch before release). Release drops
// on the last highlight (deselect first), else flies back (fly-back.ts); pointercancel,
// lostpointercapture and cancel({ byBack: true }) fly back from the last transform; any other end
// snaps back at once. Hover classes are cleared during a drag or fly-back and recomputed after.
// Replacing drag (epic 4 SPEC CAP-4, epic 4 SPEC CAP-7, epic 4 SPEC F12, epic 4 SPEC F13, epic 4
// SPEC F24, epic 4 SPEC F28; AD-9, AD-13): a pick-up drag that starts with a selection open is
// *replacing*: at its threshold crossing `wc-selection-suppressed` goes on the attach root (CSS
// hides the old selection's lift, outline, `Here` and foot states; the overlays store is untouched
// mid-drag). Every end removes it at `end()`: a restoring fly-back (pointercancel,
// lostpointercapture, cancel({ byBack: true })) at its start under both motion settings (epic 4
// SPEC F32, epic 4 SPEC F33), keeping the selection with no nav call (back's `closedByBack` clears
// it); a release with no highlight and a plain cancel() (before-hide, act(), detach) deselect once,
// a drop deselects in `pointerup` before its dispatch, and a same-id pointerdown restores. A
// button-0 pointerdown with no active press during a fly-back (or a FLIP glide, epic 5 SPEC F6)
// enters the gate, finishes the flight and every glide, then resolves (epic 4 SPEC F13); the
// settle's refreshHover() may repaint the mouse hover before the press resolves, and a drag that
// then starts clears it again.
// Lift (epic 4 SPEC F32, epic 4 SPEC F33; AD-12): a dragged stack inside the selection (its top
// wrapper is `lifted`) keeps the selection lift in the drag transform, `translate(pointer − press
// point − lift)`; any other stack has lift 0. Every fly-back but a release with no highlight (which
// deselects) and a back that closes the tail selection is restoring, so no face jumps at the
// threshold or snaps at settle.
// Composing (epic 4 SPEC CAP-8, R-31, R-39, epic 4 SPEC CAP-4): a destination-column card whose
// `kIfTapped` is a number dispatches `tapDestinationCard` on a tap (`perform`, after the tile
// selection clears) and, as a drag-as-tap, at the pointerup of a press that crossed the threshold
// (the card never moves: no pick-up), reading `game.view` at pointerup wherever released;
// pointercancel, lostpointercapture and cancel() dispatch nothing. A column press that crosses the
// threshold without a pick-up drag clears the hover at the crossing; `refreshHover` skips while any
// crossed press is held and repaints at every end of one. The desktop k preview (`hoverAction` kind
// `k`) is `wc-hover-tail` with `--wc-hover-from` and `--wc-hover-len` (the remainder length, so the
// outline never covers S ghosts); no `wc-grab`.
// Peek and view (epic 4 SPEC CAP-9, R-65, Q-21, epic 4 SPEC F14, epic 4 SPEC F24; AD-12, AD-13): a
// non-empty WordCell press whose long-press fires opens the peek (`overlays.openPeek`, no entry);
// its `pointerup` reads the rendered `[data-view-scroll]` under the root and keeps it as the sticky
// view (`peekToSticky()`, one entry) iff it overflows, else `closePeek()`; every other end closes
// it. A non-empty WordCell tap with nothing selected opens the sticky view in Idle and Game over
// (`openView`, intent.ts). In Place (epic 5 SPEC CAP-7, F13; R-39, R-40, R-41) a tap (or an empty
// cell's long-press released by `pointerup`, classify.ts) on a `canSetTarget` cell clears the tile
// selection, then dispatches one `setTarget { cell }`; every other Place WordCell tap, drag and
// cancelled long-press dispatches nothing. The view's scrim and sheet resolve before `data-place`,
// uncaptured (the sheet pans): a tap closes the view (`close('wordcellView')`, never a deselect)
// and arms the trailing-click swallower (click-swallow.ts) on the root; a drag does nothing. Every
// pointerdown and detach disarm the swallower.
// Hover peek (epic 4 SPEC CAP-9, epic 4 SPEC F19; AD-12, AD-13): the timer and its suppression slot
// live in hover-peek-timer.ts, fed by `pointerover`/`pointerout`. Every pointerdown (any type or
// button) first clears the timer. A threshold crossing that starts a pick-up drag hides the hover
// peek (DOM only) and `end()` closes it before the fly-back or the drop; any other crossing closes
// it there. Every mouse press end, fly-back settle and cancel() set the suppression slot to the
// cell under the last mouse point. cancel() (idle too), detach and `refreshHover()` with
// `hoverFine` false clear the timer and close the hover peek; while attached,
// `deps.watchHoverFine` runs `refreshHover()` at every hoverFine change.
// Tile drag (epic 5 SPEC CAP-5, F2, F4, F5, F18, F25; AD-10, AD-11, AD-12): a live tray or strip
// tile press turns into a drag at its threshold-crossing move, before the F18 clear: the face's
// lift (resting slot top − face top, 4 when selected) is measured, the run (tile.ts `tileRun`),
// its resting slots and gap rects come from layout/tray.ts with `origin` measured once (tray
// position 0's wrapper + 2 px x) and `w`/`trayInnerWidth` from deps; hover clears, the hover peek
// hides, `.tiles` takes `wc-drag-tiles` and the face `wc-drag-layer`. Each move writes
// `translate(pointer − press point − lift)` on the face alone (wrappers never move), accepts the
// tray band (`trayTarget()`, clipped to the visible band) as the sole `pickTarget` candidate at
// ≥ 25 %, and picks `insertionIndex`; on an acceptance or gap change the other run faces part to
// `partingOffsets` (or rest) over `duration('parting')`, written at once under reduced motion;
// D-block mirrors never move, nothing is drawn at the gap. A pointerup whose last move had an
// accepted gap that changes the order by card finishes the parting, clears the drag and parting
// transforms (one `clearDrag`), leaves the gate, then dispatches one `arrange`/`setPlacementOrder`
// and repaints hover (no landing glide); any other pointerup, pointercancel, lostpointercapture and
// cancel({ byBack: true }) fly the face back unlifted (fly-back.ts) while the parted faces return
// over `duration('flyBack')` (the fade under reduced motion), hover repainting at the fly-back's
// settle; cancel() and a same-id pointerdown settle at once. The parting set holds one gate count
// while any parting or return animation runs; a superseded face animation is read for its current
// offset (its rendered transform), cancelled unsettled and replaced; a new press and cancel() finish
// every return with the flight; any other cancel of one throws (rule 6).
// Free letter (epic 5 SPEC CAP-6, F5, F16, F18; R-33, Q-31; AD-10, AD-12, AD-14): in Composing a tap
// on a WordCell with `canAddFreeLetter` clears the tile selection (`tileTap`), then dispatches one
// `addFreeLetter { cell }` (appended, intent.ts); a used or empty cell's tap and drag, and every
// WordCell drag outside Composing, move nothing. An available cell's press crossing the threshold
// before the long-press (which wins once it fires) drags its top card's live face (tile.ts
// `freeLetterRun`): the F18 clear runs at the crossing, the cell takes `wc-drag-ghost` (badge
// unchanged, cards beneath hidden), `.tiles` `wc-drag-tiles`, the face `wc-drag-layer`. The
// resting slots (one more than the tile count when the layout has room) and the gap rects over M
// come from layout/tray.ts as for the tile drag; each move writes `translate(pointer − press
// point)`, accepts the clipped tray band at ≥ 25 % and picks `insertionIndex`. On an acceptance or
// gap change: a gap that moves a tile while the layout has room parts every tray position from it
// on, D-block mirrors included (the AD-14 exception), to `partingOffsets` over
// `duration('parting')` (at once under reduced motion), each mirror marked `wc-parted` with
// `wc-part-start`/`wc-part-end` from `segmentEnds` over the parted slots; a full layout (tile count
// + 1 > perRow × the rendered rows) or a gap moving no tile (M's end with the block on the left or
// k = 0) shows the caret (`wc-caret-shown`, transformed in `.tiles` coordinates onto the winning
// gap rect) with every face back at rest; unaccepted, nothing shows. A pointerup whose last move
// was accepted finishes the parting, clears the drag (ghost, layer, caret, parted classes, every
// transform), leaves the gate, then dispatches one `addFreeLetter { cell, index }` (the gap in M)
// and repaints hover (no landing glide); any other pointerup, pointercancel, lostpointercapture and
// cancel({ byBack: true }) hide the caret and parted classes at once and fly the face back to the
// cell while the tray faces return (a mirror's shift cleared at once, never faded, under reduced
// motion), the ghost clearing at the settle; cancel(), a same-id pointerdown and detach settle at
// once.
// Wheel during a mouse drag (ticket 6.14, F3): a page scroll under a held mouse drag moves no
// `pointermove`, so a mouse press adds a passive `window` `scroll` listener, removed in `end()`. The
// drag reads `scrollY` once at its start (`drag.scroll.base`, so a scroll between the press and the
// threshold crossing is absorbed there); every move and every scroll event writes `translate(pointer
// delta + the live scrollY − base)` on the faces (the stored `dx`/`dy` carry it for the fly-back and
// the parting) and re-runs targeting from the last pointer point against the live rects; a
// pointerup re-reads the live offset first, so a release before the scroll event still drops on the
// recomputed target. Touch and pen presses add no listener; `gate.ts` is neither read nor changed.
// Key activation (epic 6 CAP-10, 6.11): `activate(hit)` runs the released-tap path for a key press on
// a focused card, tile or WordCell: `cancel()` (a held drag ends), the sticky view closes first (its
// pop precedes any push, AD-13), then `applyTile(tileAction(hit))` and, for a non-tray hit,
// `perform(hit)`. It never calls `clearTile()` itself, so a select, swap or return keeps the tile
// selection it needs; a long-press or hover peek closes only when the tap swaps or returns a tile,
// edits the word (drop, k, free letter, target) or opens the view.
// Seams (epic 5 SPEC CAP-3, epic 5 SPEC F14): the visible band, the fly-back and the hover-peek
// timer are factories built here from this controller's deps plus getters for its state; lookups
// throw through lookup.ts and the DOM class names come from classes.ts. The tile drag, the
// free-letter drag, the parting set, press resolution and the shared state types live in
// tile-drag.ts, free-letter-drag.ts, parting.ts, resolve.ts and drag-types.ts (epic 5 retro A1).
// Win celebration (AD-13): a press begun while `celebration` is open is marked; it arms no
// long-press timer, its moves start no drag and its `pointerup` only ends it, whatever the top by
// then (the run may have ended and the end sheet opened), so it performs no action and never throws.
import { flushSync } from 'svelte';
import type { Command } from '../../engine/index';
import { type DispatchResult, game } from '../../shell/game.svelte';
import { dispatchAnnounced } from '../announce';
import { SELECTION_LIFT_PX } from '../layout/geometry';
import { overlays } from '../overlays.svelte';
import {
  DRAG_GHOST,
  DRAG_LAYER,
  DRAG_TARGET,
  DRAG_TILES,
  DROP,
  DROP_SELF,
  GRAB,
  HOVER_CLASSES,
  HOVER_FROM,
  HOVER_LEN,
  HOVER_TAIL,
  SUPPRESSED,
} from './classes';
import { classify, LONG_PRESS_MS, longPressTimed, start } from './classify';
import { createClickSwallower } from './click-swallow';
import type { ColumnDrag, Drag, EndReason, FreeLetterDrag, Press, TileDrag } from './drag-types';
import { columnTargets } from './drop-target';
import { createFlyBack, translate } from './fly-back';
import { createFreeLetterDrag } from './free-letter-drag';
import type { Gate } from './gate';
import { createHoverPeekTimer } from './hover-peek-timer';
import {
  destinationTap,
  type Hit,
  type HoverAction,
  hoverAction,
  type TapAction,
  tapAction,
} from './intent';
import { cellIn, columnIn, faceIn, found } from './lookup';
import { createParting } from './parting';
import { OUTSIDE, resolve } from './resolve';
import { pickTarget, type Rect } from './targeting';
import { type TileAction, tileTap } from './tile';
import { createTileDrag } from './tile-drag';
import { clip, createVisibleBand } from './visible-band';

export type ControllerDeps<H> = {
  elementFromPoint(x: number, y: number): Element | null;
  setTimer(callback: () => void, ms: number): H;
  clearTimer(handle: H): void;
  /** Epic 4 SPEC F19: live `(hover: hover) and (pointer: fine)` (layout.hoverFine). */
  hoverFine(): boolean;
  /**
   * Epic 4 SPEC F19: calls `callback` at every hoverFine change (layout.watchHoverFine); returns
   * the unwatch.
   */
  watchHoverFine(callback: () => void): () => void;
  /** Epic 5 SPEC CAP-5: the card width (layout.w), read once at a tile drag's start. */
  w(): number;
  /**
   * Epic 5 SPEC CAP-5: the tray's inner width (layout.trayInnerWidth), read once at a tile drag's
   * start.
   */
  trayInnerWidth(): number;
  /**
   * Epic 5 SPEC F6, AD-14: completes every running FLIP glide (flip.ts `finishAll`); each settles
   * synchronously.
   */
  finishGlides(): void;
  /** Epic 5 SPEC F6, AD-14: true while a FLIP glide is unsettled (flip.ts `running`). */
  glidesRunning(): boolean;
  /** Epic 5 SPEC CAP-8, F7: flip.ts `capture`, called right before a dispatch. */
  capture(): void;
  /** Epic 5 SPEC CAP-8, F7: flip.ts `play`, called right after a non-throwing dispatch. */
  play(command: Command, result: DispatchResult): void;
};

export type CancelOptions = { readonly byBack?: boolean };

export type Controller = {
  /** AD-12/F13: ends any press at once with no command; a no-op when detached or idle. */
  cancel(options?: CancelOptions): void;
  /** F8: attaches the listeners to the active-branch root; returns the detach. */
  attach(root: HTMLElement): () => void;
  /**
   * Recomputes the mouse hover classes at the last pointer point (App's reaction, epic 4 SPEC
   * CAP-6).
   */
  refreshHover(): void;
  /**
   * Epic 6 CAP-10 (6.11): the key-activation entry. A key on a focused card, tile or WordCell is a
   * released pointer tap on `hit`: `cancel()` first, never `clearTile()`, an open sticky view
   * closed, then `tileTap` and `tapAction` (the tap path of `pointerup`). Peeks close only when the
   * tap changes the phase or the word data. The caller gates it on the `GameView` flags, so every
   * call acts.
   */
  activate(hit: Hit): void;
};

const LISTENED = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'lostpointercapture',
  'contextmenu',
  'click',
  'pointerover',
  'pointerout',
] as const;

export function createController<H>(gate: Gate, deps: ControllerDeps<H>): Controller {
  let root: HTMLElement | null = null;
  let press: Press<H> | null = null;
  /** The pointerId whose contextmenu stays suppressed after its captured press was cancelled. */
  let menuSlot: number | null = null;
  /** The last mouse point inside the root (hover), null once it left. */
  let lastPoint: { readonly x: number; readonly y: number } | null = null;
  /** The `[data-column]` element carrying the hover classes. */
  let hovered: HTMLElement | null = null;
  /** R-65: swallows the trailing click of a tap that closed the sticky view. */
  const swallower = createClickSwallower(deps);
  /**
   * Epic 4 SPEC F13: the fly-back; its settle suppresses and repaints the hover (`hover` resolved
   * lazily).
   */
  const flight = createFlyBack({
    gate,
    clearDrag,
    onSettle: () => {
      hover.suppress();
      refreshHover();
    },
  });
  /** Epic 4 SPEC F19: the desktop hover-peek timer and its suppression slot. */
  const hover = createHoverPeekTimer(deps, {
    root: () => root,
    lastPoint: () => lastPoint,
    pressHeld: () => press !== null,
    flying: flight.running,
  });
  /** Epic 4 SPEC F34: the visible band between the sticky bars. */
  const band = createVisibleBand(() => root);
  /** Epic 5 SPEC CAP-5: the tile drag's parting and return animations. */
  const parting = createParting(gate);
  const tileDrag = createTileDrag({
    w: deps.w,
    trayInnerWidth: deps.trayInnerWidth,
    parting,
    band,
    clearHover,
  });
  const freeLetterDrag = createFreeLetterDrag({
    w: deps.w,
    trayInnerWidth: deps.trayInnerWidth,
    parting,
    band,
    clearHover,
  });

  function stopTimer(p: Press<H>): void {
    if (p.timer === null) return;
    deps.clearTimer(p.timer.handle);
    p.timer = null;
  }

  // CAP-8, F7, F17: the command a drag release captured for (null unless `end()` called
  // `deps.capture()`); `pointerup` dispatches it and plays.
  function end(reason: EndReason): Command | null {
    const p = press;
    if (p === null) throw new Error('AD-12 end() with no active press');
    stopTimer(p);
    press = null;
    if (p.captured?.hasPointerCapture(p.pointerId) === true) {
      p.captured.releasePointerCapture(p.pointerId);
    }
    // F3: the scroll listener goes with the press.
    if (p.mouse) window.removeEventListener('scroll', rescroll);
    // Epic 4 SPEC F19: any mouse press end suppresses the cell under the last mouse point.
    if (p.mouse) hover.suppress();
    const kind = reason.kind;
    // Q-21 (AD-12 peek on end): only a pointerup may turn the peek sticky (pointerup).
    if (kind !== 'up' && overlays.peek !== null) overlays.closePeek();
    if ((kind === 'cancel' || kind === 'lostCapture') && p.captured !== null) {
      menuSlot = p.pointerId;
    }
    const drag = p.drag;
    let flies = false;
    let captured: Command | null = null;
    if (drag !== null) {
      // Epic 4 SPEC F19: a pick-up drag closes the hover peek at release, before the fly-back or
      // drop.
      overlays.closeHoverPeek();
    }
    if (drag?.kind === 'tile' || drag?.kind === 'freeLetter') {
      // Epic 5 SPEC CAP-5, CAP-6, F5: an edit release and every non-flying end settle at once; the
      // fly-back lands unlifted, the parted faces return beside it (a free letter's caret and
      // parted classes go at once).
      // CAP-8: the "will dispatch" predicate, computed once on 'up' for `flies` and the capture.
      const release = kind === 'up' ? releaseCommand(drag) : null;
      flies =
        kind === 'up'
          ? release === null
          : kind === 'pointercancel' ||
            kind === 'lostCapture' ||
            (reason.kind === 'cancel' && reason.byBack);
      if (flies && drag.kind === 'freeLetter') {
        freeLetterDrag.hideCaret(drag);
        freeLetterDrag.unpart(drag);
        flight.flyBack(drag, false);
        freeLetterDrag.returnTray(drag);
      } else if (flies && drag.kind === 'tile') {
        flight.flyBack(drag, false);
        tileDrag.returnRun(drag);
      } else {
        // CAP-8, F17: capture the released rects before the transforms clear.
        if (release !== null) {
          captured = release;
          deps.capture();
        }
        parting.finishAll();
        clearDrag(drag);
      }
    } else if (drag !== null) {
      drag.target?.classList.remove(DRAG_TARGET);
      drag.target = null;
      flies =
        kind === 'up'
          ? drag.highlighted === null
          : kind === 'pointercancel' ||
            kind === 'lostCapture' ||
            (reason.kind === 'cancel' && reason.byBack);
      // F32: a back that closes the tail selection (its top entry) deselects, so it lands unlifted.
      // A mid-drag Forward popstate (not reachable on Android) lands unlifted and snaps at settle, accepted.
      const closesSelection =
        reason.kind === 'cancel' && reason.byBack && overlays.top === 'tailSelection';
      // CAP-8, F17: a drop deselects, then captures the released rects before `clearDrag`.
      if (kind === 'up' && drag.highlighted !== null) {
        if (overlays.selection !== null) overlays.deselect();
        captured = {
          type: 'drop',
          sourceColumn: drag.source,
          sourceCount: drag.count,
          destinationColumn: drag.highlighted,
        };
        deps.capture();
      }
      // The fly-back enters the gate before the press leaves it (F13).
      if (flies) flight.flyBack(drag, kind !== 'up' && !closesSelection);
      else clearDrag(drag);
      // Epic 4 SPEC F24, epic 4 SPEC F28, epic 4 SPEC F33: every end removes the class here, a
      // restoring fly-back at its start; a release with no highlight and a plain cancel() deselect.
      if (drag.replacing) {
        unsuppress();
        if (
          (kind === 'up' && drag.highlighted === null) ||
          (reason.kind === 'cancel' && !reason.byBack)
        ) {
          overlays.deselect();
        }
      }
    }
    gate.leave();
    // A drop, a tile edit, a drag-as-tap and a crossed block press refresh at pointerup (a release
    // that flies back, at the settle); epic 4 SPEC CAP-8: a crossed press with no drag repaints at
    // every other end.
    if (kind !== 'up' && (drag !== null ? !flies : p.state.kind === 'drag')) refreshHover();
    return captured;
  }

  // CAP-8, F7: a tap-site dispatch bracketed by capture and play (a throw skips play, AD-15).
  function moveDispatch(command: Command): void {
    deps.capture();
    deps.play(command, dispatchAnnounced(command));
  }

  function unsuppress(): void {
    if (root === null) throw new Error('AD-12 selection suppression without a root');
    root.classList.remove(SUPPRESSED);
  }

  // Removes every drag class and the inline transform from the tail; for a tile drag, from the
  // dragged face, `.tiles` and every parted face; for a free-letter drag also the cell's ghost, the
  // caret and the parted classes.
  function clearDrag(drag: Drag): void {
    if (drag.kind === 'freeLetter') {
      for (const face of drag.trayFaces) face.style.transform = '';
      const face = drag.faces[0];
      face.style.transform = '';
      face.classList.remove(DRAG_LAYER);
      drag.cellEl.classList.remove(DRAG_GHOST);
      drag.tiles.classList.remove(DRAG_TILES);
      freeLetterDrag.hideCaret(drag);
      freeLetterDrag.unpart(drag);
      return;
    }
    if (drag.kind === 'tile') {
      for (const face of drag.runFaces) face.style.transform = '';
      drag.faces[0].classList.remove(DRAG_LAYER);
      drag.tiles.classList.remove(DRAG_TILES);
      return;
    }
    for (const face of drag.faces) {
      face.style.transform = '';
      face.classList.remove(DRAG_LAYER);
    }
    for (const wrapper of drag.wrappers) wrapper.classList.remove(DRAG_GHOST);
  }

  function cardIn(columnEl: Element, id: number): HTMLElement {
    const el = columnEl.querySelector(`[data-card-id="${id}"]`);
    if (el === null) throw new Error(`AD-12 card ${id} not rendered in its column`);
    return el as HTMLElement;
  }

  function placeholderIn(columnEl: Element): Element {
    const el = columnEl.querySelector('[data-placeholder]');
    if (el === null) throw new Error('AD-12 column without [data-placeholder]');
    return el;
  }

  function viewColumn(column: number) {
    const view = game.view;
    if (view === undefined) throw new Error('AD-12 drag without a GameView');
    return columnIn(view.columns, column, `AD-12 column ${column} is not in the GameView`);
  }

  // SPEC CAP-7: the threshold-crossing move of a column-card press; null when the press is not a
  // pick-up (another kind of press, or the column cannot be picked up: the drag is inert).
  function startDrag(p: Press<H>): Drag | null {
    const hit = p.hit;
    if (hit.kind === 'tile') return tileDrag.start(p, hit.card);
    if (hit.kind === 'wordcell') {
      // Epic 5 SPEC CAP-6: only an available Composing cell drags; any other WordCell drag is inert.
      const view = game.view;
      if (view === undefined) throw new Error('AD-12 WordCell drag without a GameView');
      if (view.status !== 'playing' || view.phase !== 'composing') return null;
      const cell = cellIn(
        view.cells,
        hit.cell,
        `AD-12 WordCell ${hit.cell} is not in the GameView`,
      );
      return cell.canAddFreeLetter ? freeLetterDrag.start(p, view, hit.cell) : null;
    }
    if (hit.kind !== 'card' || p.captured === null) return null;
    const entry = viewColumn(hit.column);
    if (!entry.canPickUp) return null;
    const start = entry.cards.indexOf(hit.card);
    if (start < 0) throw new Error(`AD-12 card ${hit.card} is not in column ${hit.column}`);
    const sourceEl = found(
      p.captured.closest('[data-column]'),
      'AD-12 column card outside [data-column]',
    );
    flight.finishFlight();
    clearHover();
    const replacing = overlays.selection !== null;
    if (replacing) {
      if (root === null) throw new Error('AD-12 drag without a root');
      root.classList.add(SUPPRESSED);
    }
    const wrappers = entry.cards.slice(start).map((id) => cardIn(sourceEl, id));
    const faces = wrappers.map(faceIn);
    // F33: lifted only when the stack lies inside the selection, i.e. its top card is lifted.
    const lift = wrappers[0]?.classList.contains('lifted') === true ? SELECTION_LIFT_PX : 0;
    for (const wrapper of wrappers) wrapper.classList.add(DRAG_GHOST);
    for (const face of faces) face.classList.add(DRAG_LAYER);
    return {
      kind: 'column',
      source: hit.column,
      sourceEl,
      count: wrappers.length,
      remainderTop: start === 0 ? null : (entry.cards[start - 1] as number),
      wrappers,
      faces,
      x: p.state.x,
      y: p.state.y,
      lift,
      dx: 0,
      dy: 0,
      scroll: null,
      hasLeftSource: false,
      highlighted: null,
      target: null,
      replacing,
    };
  }

  // DESIGN.md Card states, drop target: another column's bottom card or placeholder; on the source,
  // the card above a partial tail (R-21) or the placeholder under a whole column's ghosts.
  function targetElement(drag: ColumnDrag, column: number, columnEl: Element): Element {
    if (column === drag.source) {
      return drag.remainderTop === null
        ? placeholderIn(drag.sourceEl)
        : cardIn(drag.sourceEl, drag.remainderTop);
    }
    const last = viewColumn(column).cards.at(-1);
    return last === undefined ? placeholderIn(columnEl) : cardIn(columnEl, last);
  }

  // F37: the targeting rule (≥ 25 % overlap) against the source column's unclipped hit rect.
  function overSource(
    drag: ColumnDrag,
    dragged: Rect,
    rects: readonly { readonly id: number; readonly whole: Rect }[],
  ): boolean {
    const source = found(
      rects.find(({ id }) => id === drag.source),
      `AD-12 column ${drag.source} not registered`,
    );
    return (
      pickTarget(dragged, [{ id: drag.source, rect: source.whole }], drag.source, true).raw !== null
    );
  }

  // Epic 5 SPEC CAP-5, CAP-6: a tile or free-letter drag's command at release, from the last move's
  // acceptance and gap.
  function releaseCommand(drag: TileDrag | FreeLetterDrag): Command | null {
    return drag.accepted && drag.gap !== null ? drag.run.release(drag.gap) : null;
  }

  // AD-12 one drag move: transform, measure, pick, highlight (DOM only, F12).
  function dragMove(drag: Drag, x: number, y: number): void {
    // F3: a mouse drag follows the page scroll since its start.
    let scrolled = 0;
    if (drag.scroll !== null) {
      scrolled = window.scrollY - drag.scroll.base;
      drag.scroll.delta = scrolled;
    }
    if (drag.kind === 'tile') {
      tileDrag.move(drag, x, y, scrolled);
      return;
    }
    if (drag.kind === 'freeLetter') {
      freeLetterDrag.move(drag, x, y, scrolled);
      return;
    }
    drag.dx = x - drag.x;
    drag.dy = y - drag.y + scrolled;
    for (const face of drag.faces) face.style.transform = translate(drag.dx, drag.dy - drag.lift);
    const grabbed = drag.faces[0];
    if (grabbed === undefined) throw new Error('AD-12 drag without a face');
    const targets = columnTargets();
    const visible = band.visibleBand();
    const dragged = grabbed.getBoundingClientRect();
    const rects = targets.map(({ id, el }) => ({ id, whole: el.getBoundingClientRect() }));
    const { raw, highlighted } = pickTarget(
      dragged,
      rects.map(({ id, whole }) => ({ id, rect: clip(whole, visible) })),
      drag.source,
      drag.hasLeftSource,
    );
    // Q-34, F37: the drag leaves its source when `raw` is another column, or nothing while the
    // face also misses the source's unclipped hit rect: over the source but under a sticky bar
    // (F34 `raw` null) is not leaving it.
    if (raw !== drag.source && (raw !== null || !overSource(drag, dragged, rects))) {
      drag.hasLeftSource = true;
    }
    if (highlighted === drag.highlighted) return;
    drag.target?.classList.remove(DRAG_TARGET);
    drag.highlighted = highlighted;
    drag.target = null;
    if (highlighted === null) return;
    const columnEl = found(
      targets.find((t) => t.id === highlighted)?.el,
      `AD-12 column ${highlighted} not registered`,
    );
    drag.target = targetElement(drag, highlighted, columnEl);
    drag.target.classList.add(DRAG_TARGET);
  }

  // F3: re-runs the drag move at the last pointer point when the live offset differs from the one
  // last applied (a scroll event, or the release reading it first); a no-op without a mouse drag.
  function rescroll(): void {
    if (press === null || press.drag === null) return;
    const { drag, lastX, lastY } = press;
    const scroll = drag.scroll;
    if (scroll === null || window.scrollY - scroll.base === scroll.delta) return;
    dragMove(drag, lastX, lastY);
  }

  function onTimer(p: Press<H>): void {
    if (press !== p) return;
    p.timer = null;
    const next = classify(p.state, { type: 'timer' });
    if (typeof next === 'string') throw new Error(`AD-12 timer classified as ${next}`);
    p.state = next;
    // Q-21: a non-empty WordCell's long-press opens the peek, in every phase.
    if (next.kind === 'longPress' && next.target === 'wordcell') {
      if (p.hit.kind !== 'wordcell') throw new Error(`AD-12 long-press on a ${p.hit.kind} hit`);
      overlays.openPeek(p.hit.cell);
    }
  }

  // F14: at a long-press release the peek stays as the sticky view iff the rendered sheet's scroll
  // area overflows.
  function releasePeek(): void {
    if (root === null) throw new Error('AD-12 peek release without a root');
    const area = root.querySelector('[data-view-scroll]');
    if (area === null) throw new Error('AD-12 peek release without a rendered [data-view-scroll]');
    if (area.scrollHeight > area.clientHeight) overlays.peekToSticky();
    else overlays.closePeek();
  }

  function own(event: PointerEvent): boolean {
    return press !== null && event.pointerId === press.pointerId;
  }

  function pointerdown(event: PointerEvent): void {
    // Epic 4 SPEC F19: any pointerdown, of any type or button, cancels a pending hover-peek timer.
    hover.stopHoverTimer();
    // R-65: a new press means the closing tap's trailing click is not coming.
    swallower.disarm();
    // A same-id pointerdown: that pointer was released, so its slot is spent.
    if (event.pointerId === menuSlot) menuSlot = null;
    if (root === null) return;
    // A same-id pointerdown, of any button (epic 4 SPEC CAP-4): the old press's end was lost.
    if (press !== null && event.pointerId === press.pointerId) {
      const peeked = overlays.peek !== null;
      end({ kind: 'sameId' });
      // That end closed the peek; flush so its scrim and sheet leave the DOM before
      // elementFromPoint, else this press resolves against the stale view.
      if (peeked) flushSync();
    }
    // Only the active press's own pointer acts on it; another pointer is untouched (CAP-4).
    if (event.button !== 0 || press !== null) return;
    // F13: a press during a fly-back (or a tile drag's returns, epic 5 SPEC CAP-5, or a FLIP
    // glide, epic 5 SPEC F6, AD-14) acts on, and measures, the settled layout; the gate never idles
    // between.
    const inFlight = flight.running() || parting.running() || deps.glidesRunning();
    if (inFlight) {
      gate.enter();
      flight.finishFlight();
      parting.finishAll();
      deps.finishGlides();
    }
    const resolved = resolve(
      root,
      deps.elementFromPoint(event.clientX, event.clientY),
      overlays.selection !== null,
    );
    if (resolved === null) {
      if (inFlight) gate.leave();
      return;
    }
    if (!inFlight) gate.enter();
    const p: Press<H> = {
      pointerId: event.pointerId,
      captured: resolved.capture,
      hit: resolved.hit,
      state: start(resolved.target, event.clientX, event.clientY),
      timer: null,
      drag: null,
      mouse: event.pointerType === 'mouse',
      lastX: event.clientX,
      lastY: event.clientY,
      celebrating: overlays.isOpen('celebration'),
    };
    press = p;
    if (p.mouse) window.addEventListener('scroll', rescroll, { passive: true });
    if (p.captured !== null) {
      menuSlot = null;
      p.captured.setPointerCapture(p.pointerId);
    }
    if (!p.celebrating && longPressTimed(resolved.target)) {
      p.timer = { handle: deps.setTimer(() => onTimer(p), LONG_PRESS_MS) };
    }
  }

  function pointermove(event: PointerEvent): void {
    const p = press;
    if (p === null || !own(event) || p.celebrating) return;
    const next = classify(p.state, { type: 'move', x: event.clientX, y: event.clientY });
    if (typeof next === 'string') throw new Error(`AD-12 move classified as ${next}`);
    const crossing = next.kind === 'drag' && p.state.kind !== 'drag';
    if (crossing) stopTimer(p);
    p.state = next;
    p.lastX = event.clientX;
    p.lastY = event.clientY;
    // The threshold-crossing move is the first drag move (epic 4 SPEC CAP-7); epic 4 SPEC CAP-8:
    // any column press clears the hover there, picked up or not.
    if (crossing) {
      if (p.hit.kind === 'card' || p.hit.kind === 'space') clearHover();
      // Epic 5 SPEC CAP-5: a live tile press starts its drag (lift measured) before the F18 clear.
      p.drag = startDrag(p);
      if (p.drag !== null && p.mouse) p.drag.scroll = { base: window.scrollY, delta: 0 };
      // Epic 5 SPEC F18: a live tile press and a free-letter drag clear the tile selection at the
      // threshold.
      if (p.hit.kind === 'tile' || p.drag?.kind === 'freeLetter') overlays.clearTile();
      // Epic 4 SPEC F19: a pick-up hides the hover peek (DOM only, AD-12); any other drag closes
      // it.
      if (p.drag !== null) hover.hideHoverPeek();
      else overlays.closeHoverPeek();
    }
    if (p.drag !== null) dragMove(p.drag, event.clientX, event.clientY);
  }

  // Epic 5 SPEC CAP-4: the tile selection's part of a released tap or drag-as-tap, from the
  // GameView at release (AD-3); clears before any dispatch (F1).
  function tileAction(hit: Hit): TileAction {
    const view = game.view;
    if (view === undefined) throw new Error('AD-12 tile tap without a GameView');
    return tileTap(hit, view, overlays.tileSelection);
  }

  function applyTile(action: TileAction): void {
    switch (action.kind) {
      case 'select':
        overlays.selectTile(action.card);
        return;
      case 'deselect':
      case 'clear':
        overlays.clearTile();
        return;
      case 'swap':
        overlays.clearTile();
        moveDispatch(action.command);
        return;
      case 'remove':
        overlays.clearTile();
        moveDispatch({ type: 'removeFreeLetter', cell: action.cell });
        return;
      case 'keep':
        return;
    }
  }

  // A drag-as-tap only keeps or clears (a select, swap or removal needs a tile hit, never one
  // here).
  function applyTileDrag(hit: Hit): void {
    const action = tileAction(hit);
    if (action.kind !== 'keep' && action.kind !== 'clear') {
      throw new Error(`AD-12 drag-as-tap gave tile action ${action.kind}`);
    }
    applyTile(action);
  }

  // SPEC CAP-6: the tap's action, at tap time from the GameView (AD-3) and the selection.
  function perform(hit: Hit): void {
    const view = game.view;
    if (view === undefined) throw new Error('AD-12 tap without a GameView');
    const action = tapAction(hit, view, overlays.selection, overlays.top);
    switch (action.kind) {
      case 'select':
        overlays.select(action.column, action.count);
        return;
      case 'deselect':
        overlays.deselect();
        return;
      case 'drop':
        overlays.deselect();
        moveDispatch({
          type: 'drop',
          sourceColumn: action.sourceColumn,
          sourceCount: action.sourceCount,
          destinationColumn: action.destinationColumn,
        });
        return;
      case 'tapDestinationCard':
        moveDispatch({ type: 'tapDestinationCard', card: action.card });
        return;
      case 'openView':
        overlays.openView(action.cell);
        return;
      case 'addFreeLetter':
        moveDispatch({ type: 'addFreeLetter', cell: action.cell });
        return;
      case 'setTarget':
        moveDispatch({ type: 'setTarget', cell: action.cell });
        return;
      case 'none':
        return;
    }
  }

  // 6.11: the tap kinds that change the phase or the word data, or open the view (peeks close).
  function changesData(tile: TileAction, tap: TapAction | null): boolean {
    if (tile.kind === 'swap' || tile.kind === 'remove') return true;
    return tap !== null && tap.kind !== 'select' && tap.kind !== 'deselect' && tap.kind !== 'none';
  }

  function activate(hit: Hit): void {
    if (root === null) throw new Error('AD-12 activate() while detached');
    settle(true, {});
    const view = game.view;
    if (view === undefined) throw new Error('AD-12 key activation without a GameView');
    if (overlays.viewCell !== null) overlays.close('wordcellView');
    const tray = hit.kind === 'tile' || hit.kind === 'block';
    const tile = tileAction(hit);
    const tap = tray ? null : tapAction(hit, view, overlays.selection, overlays.top);
    if (changesData(tile, tap)) {
      if (overlays.peek !== null) overlays.closePeek();
      overlays.closeHoverPeek();
    }
    applyTile(tile);
    if (!tray) perform(hit);
  }

  function pointerup(event: PointerEvent): void {
    if (event.pointerId === menuSlot) menuSlot = null;
    const p = press;
    if (p === null || !own(event)) return;
    // AD-13: a press begun under the celebration only ends (no tap, drag-as-tap or peek).
    if (p.celebrating) {
      end({ kind: 'up' });
      return;
    }
    // F3: the live scroll offset decides the release target, scroll event or not.
    rescroll();
    const outcome = classify(p.state, { type: 'up' });
    const drag = p.drag;
    const captured = end({ kind: 'up' });
    if (outcome === 'longPress') {
      releasePeek();
      return;
    }
    // R-65: a sheet or scrim tap only closes the view (never a deselect); a drag does nothing.
    if (p.hit.kind === 'sheet' || p.hit.kind === 'scrim') {
      if (outcome !== 'tap') return;
      if (root === null) throw new Error('AD-12 view tap without a root');
      overlays.close('wordcellView');
      swallower.arm(root);
      return;
    }
    const tray = p.hit.kind === 'tile' || p.hit.kind === 'block';
    if (outcome === 'tap') {
      applyTile(tileAction(p.hit));
      if (!tray) perform(p.hit);
    }
    if (drag === null) {
      // Epic 5 SPEC F2: a block press that crossed the threshold does nothing here but repaint the
      // hover (epic 4 SPEC CAP-8); a crossed tile press is a tile drag.
      if (tray) {
        if (outcome === 'drag') refreshHover();
        return;
      }
      if (outcome !== 'drag') return;
      applyTileDrag(p.hit);
      // R-39: a drag-as-tap reads the GameView now (AD-3), wherever released.
      const view = game.view;
      if (view === undefined) throw new Error('AD-12 drag-as-tap without a GameView');
      const card = destinationTap(p.hit, view);
      if (card !== null) moveDispatch({ type: 'tapDestinationCard', card });
      refreshHover();
      return;
    }
    if (drag.kind === 'tile' || drag.kind === 'freeLetter') {
      // Epic 5 SPEC CAP-5, CAP-6: the one command of a tile or free-letter drag, on the last
      // move's acceptance and gap; a release with none flew back (hover repaints at its settle).
      if (captured === null) return;
      // A throwing dispatch halts the game (rule 6, AD-15): play is skipped, the capture stays pending.
      deps.play(captured, dispatchAnnounced(captured));
      refreshHover();
      return;
    }
    // AD-12: the one command of a drag, on the last-shown highlight (EXPERIENCE.md step 6),
    // built and captured in `end()`.
    if (captured === null) return;
    deps.play(captured, dispatchAnnounced(captured));
    refreshHover();
  }

  function pointercancel(event: PointerEvent): void {
    if (event.pointerId === menuSlot) menuSlot = null;
    if (own(event)) {
      end({ kind: 'pointercancel' });
      return;
    }
  }

  function lostpointercapture(event: PointerEvent): void {
    const p = press;
    if (p === null || !own(event) || p.captured === null || event.target !== p.captured) return;
    end({ kind: 'lostCapture' });
  }

  function contextmenu(event: MouseEvent): void {
    if ((press !== null && press.captured !== null) || menuSlot !== null) event.preventDefault();
  }

  // F25: a `click` counts only for non-pointer activation; a pointer tap's trailing click
  // (detail ≥ 1) was already classified by pointerup.
  function click(event: MouseEvent): void {
    if (event.detail !== 0 || root === null) return;
    const resolved = resolve(root, event.target as Element | null, overlays.selection !== null);
    if (resolved === null) return;
    // Epic 4 SPEC F25, epic 5 SPEC F2: a tile or block counts as outside; never `tileTap`.
    const kind = resolved.hit.kind;
    if (kind !== 'outside' && kind !== 'tile' && kind !== 'block') return;
    perform(OUTSIDE);
  }

  function clearHover(): void {
    if (hovered === null) return;
    hovered.classList.remove(...HOVER_CLASSES);
    hovered.style.removeProperty(HOVER_FROM);
    hovered.style.removeProperty(HOVER_LEN);
    hovered = null;
  }

  function showHover(columnEl: HTMLElement, action: HoverAction): void {
    hovered = columnEl;
    switch (action.kind) {
      case 'tail':
        columnEl.classList.add(HOVER_TAIL);
        columnEl.style.setProperty(HOVER_FROM, String(action.from));
        if (action.grab) columnEl.classList.add(GRAB);
        return;
      case 'drop':
        columnEl.classList.add(DROP);
        return;
      case 'dropSelf':
        columnEl.classList.add(DROP_SELF);
        return;
      case 'k':
        columnEl.classList.add(HOVER_TAIL);
        columnEl.style.setProperty(HOVER_FROM, String(action.from));
        columnEl.style.setProperty(HOVER_LEN, String(action.length));
        return;
    }
  }

  // DESIGN.md Card states, hover: at most one `[data-column]` carries the classes (old cleared).
  function refreshHover(): void {
    // Epic 4 SPEC F19: a hoverFine change to false closes the hover peek (never reads
    // overlays.hoverPeek, so App's reaction does not track it).
    if (!deps.hoverFine()) hover.closeHover();
    clearHover();
    // Epic 4 SPEC CAP-7: no hover during a drag or a fly-back; epic 4 SPEC CAP-8: nor while any
    // crossed press is held.
    if (flight.running() || (press !== null && press.state.kind === 'drag')) return;
    const view = game.view;
    if (root === null || lastPoint === null || view === undefined) return;
    const el = deps.elementFromPoint(lastPoint.x, lastPoint.y);
    const resolved = resolve(root, el, false);
    if (el === null || resolved === null) return;
    const action = hoverAction(resolved.hit, view, overlays.selection);
    if (action === null) return;
    const columnEl = found(
      el.closest('[data-column]') as HTMLElement | null,
      'AD-12 hover column outside [data-column]',
    );
    showHover(columnEl, action);
  }

  function track(event: PointerEvent): boolean {
    if (event.pointerType !== 'mouse') return false;
    lastPoint = { x: event.clientX, y: event.clientY };
    return true;
  }

  function pointerover(event: PointerEvent): void {
    if (!track(event)) return;
    refreshHover();
    hover.hoverEnter(event);
  }

  function pointerout(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || root === null) return;
    hover.hoverLeave(event);
    const to = event.relatedTarget as Node | null;
    if (to !== null && root.contains(to)) return;
    lastPoint = null;
    clearHover();
  }

  const handlers: Record<(typeof LISTENED)[number], (event: never) => void> = {
    pointerdown,
    pointermove: (event: PointerEvent) => {
      track(event);
      pointermove(event);
    },
    pointerup,
    pointercancel,
    lostpointercapture,
    contextmenu,
    click,
    pointerover,
    pointerout,
  };

  // `keepHover`: the key activation keeps an open hover peek (a select, re-select or deselect
  // leaves peeks open, 6.11); `activate` closes it itself when the tap changes the word data.
  function settle(keepHover: boolean, options: CancelOptions): void {
    if (root === null) return;
    // Epic 4 SPEC F19: the settle suppresses; idle or not, the hover peek closes and the cell under
    // the last mouse point is suppressed. Epic 5 SPEC CAP-5, CAP-6: a tile or free-letter drag's
    // returns finish too; an active one's parting is end()'s (finished, or by back returned from
    // its current offset). Epic 5 SPEC F6: every FLIP glide finishes too (act(), the hide flush,
    // back).
    flight.finishFlight();
    deps.finishGlides();
    const kind = press?.drag?.kind;
    if (kind !== 'tile' && kind !== 'freeLetter') parting.finishAll();
    if (!keepHover) {
      hover.closeHover();
      hover.suppress();
    }
    if (press === null) return;
    end({ kind: 'cancel', byBack: options.byBack === true });
  }

  function cancel(options: CancelOptions = {}): void {
    settle(false, options);
  }

  function attach(next: HTMLElement): () => void {
    if (root !== null) throw new Error('AD-12 attach() while attached');
    root = next;
    for (const type of LISTENED) {
      next.addEventListener(type, handlers[type] as EventListener, { passive: false });
    }
    const unwatch = deps.watchHoverFine(refreshHover);
    let attached = true;
    return () => {
      if (!attached) throw new Error('AD-12 detach() called twice');
      attached = false;
      unwatch();
      cancel();
      swallower.disarm();
      for (const type of LISTENED) {
        next.removeEventListener(type, handlers[type] as EventListener);
      }
      menuSlot = null;
      lastPoint = null;
      hover.reset();
      clearHover();
      root = null;
    };
  }

  return { cancel, attach, refreshHover, activate };
}
