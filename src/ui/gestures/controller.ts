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
// button-0 pointerdown with no active press during a fly-back enters the gate, finishes the flight,
// then resolves (epic 4 SPEC F13); the settle's refreshHover() may repaint the mouse hover before
// the press resolves, and a drag that then starts clears it again.
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
// (`openView`, intent.ts). The view's scrim and sheet resolve before `data-place`, uncaptured (the
// sheet pans): a tap closes the view (`close('wordcellView')`, never a deselect) and arms the
// trailing-click swallower (click-swallow.ts) on the root; a drag does nothing. Every pointerdown
// and detach disarm the swallower.
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
// offset (face rect − slot), cancelled unsettled and replaced; a new press and cancel() finish
// every return with the flight; any other cancel of one throws (rule 6).
// Seams (epic 5 SPEC CAP-3, epic 5 SPEC F14): the visible band, the fly-back and the hover-peek
// timer are factories built here from this controller's deps plus getters for its state; lookups
// throw through lookup.ts and the DOM class names come from classes.ts.
import { flushSync } from 'svelte';
import type { CardId, Command } from '../../engine/index';
import { game } from '../../shell/game.svelte';
import { prefs } from '../../shell/prefs.svelte';
import { SELECTION_LIFT_PX } from '../layout/geometry';
import { gapRects, partingOffsets, slotRects, trayLayout } from '../layout/tray';
import { duration } from '../motion';
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
import {
  classify,
  LONG_PRESS_MS,
  longPressTimed,
  type PressState,
  type PressTarget,
  start,
} from './classify';
import { createClickSwallower } from './click-swallow';
import { columnTargets, trayTarget } from './drop-target';
import { createFlyBack, translate } from './fly-back';
import type { Gate } from './gate';
import { createHoverPeekTimer } from './hover-peek-timer';
import { destinationTap, type Hit, type HoverAction, hoverAction, tapAction } from './intent';
import { attribute, cellIn, columnIn, found } from './lookup';
import { type GapRect, insertionIndex, pickTarget, type Rect } from './targeting';
import { type TileAction, tileRun, tileTap } from './tile';
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
};

type EndReason =
  | { readonly kind: 'up' | 'pointercancel' | 'lostCapture' | 'sameId' }
  // `byBack`: a drag flies back (F13) instead of snapping.
  | { readonly kind: 'cancel'; readonly byBack: boolean };

/**
 * Epic 4 SPEC CAP-7: a press that crossed the threshold on a column card whose column
 * `canPickUp`.
 */
type ColumnDrag = {
  readonly kind: 'column';
  readonly source: number;
  /** The source `[data-column]` element. */
  readonly sourceEl: Element;
  readonly count: number;
  /** The source column's card above the tail (the partial self-drop target, R-21). */
  readonly remainderTop: number | null;
  readonly wrappers: readonly HTMLElement[];
  /** The tail's faces; `faces[0]` is the grabbed card's (the dragged rect, AD-12). */
  readonly faces: readonly HTMLElement[];
  /** The pointerdown point. */
  readonly x: number;
  readonly y: number;
  /** F32/F33: the faces' selection lift in px (0 unless the stack lies inside the selection). */
  readonly lift: number;
  /** The last pointer offset from the press point written on the faces. */
  dx: number;
  dy: number;
  hasLeftSource: boolean;
  highlighted: number | null;
  /** The element carrying `wc-drag-target`. */
  target: Element | null;
  /**
   * Epic 4 SPEC F24, epic 4 SPEC F28: started with a selection open; the root carries `SUPPRESSED`
   * until its end.
   */
  readonly replacing: boolean;
};

/** Epic 5 SPEC CAP-5: a live tray or strip tile press that crossed the threshold. */
type TileDrag = {
  readonly kind: 'tile';
  /** The dragged tile's wrapper (never moved) and face (the fly-back's fields). */
  readonly wrappers: readonly [HTMLElement];
  readonly faces: readonly [HTMLElement];
  /** The pointerdown point. */
  readonly x: number;
  readonly y: number;
  /** F2: the face's lift at the start (resting slot top − face top: 4 when selected, else 0). */
  readonly lift: number;
  /** The last pointer offset from the press point written on the face. */
  dx: number;
  dy: number;
  /** The `.tiles` element carrying `DRAG_TILES`. */
  readonly tiles: HTMLElement;
  readonly run: ReturnType<typeof tileRun>;
  /** The run's faces in run order (`runFaces[run.from]` is the dragged one). */
  readonly runFaces: readonly HTMLElement[];
  /** The resting slot rects of every tray position. */
  readonly slots: readonly Rect[];
  readonly gaps: readonly GapRect[];
  /** The last move's tray acceptance (≥ 25 % of the clipped band) and gap (null unaccepted). */
  accepted: boolean;
  gap: number | null;
};

type Drag = ColumnDrag | TileDrag;

type Offset = { readonly dx: number; readonly dy: number };

const REST: Offset = { dx: 0, dy: 0 };

// Sub-pixel layout rounding is not an offset.
function near(a: Offset, b: Offset): boolean {
  return Math.abs(a.dx - b.dx) < 0.5 && Math.abs(a.dy - b.dy) < 0.5;
}

// Epic 5 SPEC CAP-5 the parting set (AD-10, AD-11, F6, F24): every running parting or return
// animation by face with its target offset, under one gate count from the first start until the
// last finish or `finishAll()` (synchronous, as `finishFlight`). A face already heading to the new
// target keeps its animation; otherwise its current offset is its rect (a running animation's
// effect included) minus its resting slot, and a superseded animation is read, cancelled unsettled
// (its handlers cleared first) and replaced; the end transform is written inline (`''` at rest).
// Any other cancel throws (rule 6).
function createParting(gate: Gate) {
  const running = new Map<HTMLElement, { animation: Animation; target: Offset }>();
  let counted = false;

  function settle(): void {
    if (!counted || running.size > 0) return;
    counted = false;
    gate.leave();
  }

  function track(face: HTMLElement, animation: Animation, target: Offset): void {
    if (!counted) {
      counted = true;
      gate.enter();
    }
    running.set(face, { animation, target });
    animation.onfinish = () => {
      if (running.get(face)?.animation !== animation) return;
      running.delete(face);
      settle();
    };
    animation.oncancel = () => {
      throw new Error('AD-12 parting animation cancelled');
    };
  }

  // A running animation of `face` already ends on `target`.
  function heading(face: HTMLElement, target: Offset): boolean {
    const entry = running.get(face);
    return entry !== undefined && near(entry.target, target);
  }

  // The face's current offset from `slot`; a running animation is then cancelled unsettled.
  function take(face: HTMLElement, slot: Rect): Offset {
    const r = face.getBoundingClientRect();
    const current = { dx: r.left - slot.left, dy: r.top - slot.top };
    const animation = running.get(face)?.animation;
    if (animation !== undefined) {
      running.delete(face);
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
    }
    return current;
  }

  /** Moves `face` from its current offset to `target` over `ms` (0: written at once). */
  function part(face: HTMLElement, slot: Rect, target: Offset, ms: number): void {
    if (heading(face, target)) return;
    const animating = running.has(face);
    const current = take(face, slot);
    if (!animating && near(current, target)) return;
    const end = near(target, REST) ? '' : translate(target.dx, target.dy);
    face.style.transform = end;
    if (ms > 0) {
      const to = end === '' ? translate(0, 0) : end;
      track(
        face,
        face.animate([{ transform: translate(current.dx, current.dy) }, { transform: to }], {
          duration: ms,
          easing: 'ease-out',
        }),
        target,
      );
    }
    settle();
  }

  /**
   * A face off rest returns over `ms`; under reduced motion its transform clears and it fades in
   * (fly-back.ts).
   */
  function home(face: HTMLElement, slot: Rect, ms: number, reduced: boolean): void {
    if (heading(face, REST)) return;
    const animating = running.has(face);
    const current = take(face, slot);
    if (!animating && near(current, REST)) return;
    face.style.transform = '';
    track(
      face,
      reduced
        ? face.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms })
        : face.animate(
            [{ transform: translate(current.dx, current.dy) }, { transform: translate(0, 0) }],
            { duration: ms, easing: 'ease-out' },
          ),
      REST,
    );
  }

  /** Completes every running animation at once; the gate count leaves synchronously. */
  function finishAll(): void {
    for (const { animation } of running.values()) {
      animation.onfinish = null;
      animation.finish();
    }
    running.clear();
    settle();
  }

  return { part, home, finishAll, running: (): boolean => running.size > 0 };
}

/** Epic 5 SPEC CAP-5: the tray band's id as `pickTarget`'s sole candidate. */
const TRAY = 0;

type Press<H> = {
  readonly pointerId: number;
  /** The element holding this press's capture; null for an uncaptured press. */
  readonly captured: Element | null;
  readonly hit: Hit;
  state: PressState;
  timer: { readonly handle: H } | null;
  drag: Drag | null;
  /** Epic 4 SPEC F19: `pointerType === 'mouse'` (a mouse press end sets the suppression). */
  readonly mouse: boolean;
};

type Resolved = {
  readonly target: PressTarget;
  readonly capture: Element | null;
  readonly hit: Hit;
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

const OUTSIDE: Hit = { kind: 'outside' };

// AD-3: WordCell emptiness comes from the GameView at pointerdown, never the DOM.
function wordcellPress(cellEl: Element, capture: Element): Resolved {
  const view = game.view;
  if (view === undefined) throw new Error('AD-12 WordCell press without a GameView');
  const n = attribute(cellEl, 'data-wordcell');
  const cell = cellIn(view.cells, n, `AD-12 WordCell press on unknown cell ${n}`);
  return {
    target: cell.cards.length === 0 ? 'emptyWordcell' : 'wordcell',
    capture,
    hit: { kind: 'wordcell', cell: n },
  };
}

// The column number of the `[data-column]` an element sits in.
function columnOf(el: Element): number {
  const columnEl = found(el.closest('[data-column]'), 'AD-12 column part outside [data-column]');
  return attribute(columnEl, 'data-column');
}

// F23 press resolution, build-notes CAP-4. `null` = an enabled button: not a press at all (F25).
// `selected`: with a tail selected, non-card column presses are captured (epic 4 SPEC CAP-6).
function resolve(root: HTMLElement, hit: Element | null, selected: boolean): Resolved | null {
  if (hit === null || !root.contains(hit)) return { target: 'other', capture: null, hit: OUTSIDE };
  if (hit.closest('button:enabled') !== null) return null;
  // R-65: the view's scrim and sheet (mirrors included), uncaptured so the sheet pans.
  if (hit.closest('[data-view-scrim]') !== null) {
    return { target: 'other', capture: null, hit: { kind: 'scrim' } };
  }
  if (hit.closest('[data-view-sheet]') !== null) {
    return { target: 'other', capture: null, hit: { kind: 'sheet' } };
  }
  const card = hit.closest('[data-place]');
  if (card !== null) {
    const place = card.getAttribute('data-place');
    if (place === 'column') {
      return {
        target: 'column',
        capture: card,
        hit: { kind: 'card', column: columnOf(card), card: attribute(card, 'data-card-id') },
      };
    }
    if (place === 'cell') {
      const cellEl = found(
        card.closest('[data-wordcell]'),
        'AD-12 cell card outside [data-wordcell]',
      );
      return wordcellPress(cellEl, card);
    }
    if (place === 'tray' || place === 'strip') {
      return {
        target: 'other',
        capture: card,
        hit: { kind: 'tile', card: attribute(card, 'data-card-id') },
      };
    }
    throw new Error(`AD-12 unknown data-place ${place}`);
  }
  const mirror = hit.closest('[data-mirror-of]');
  if (mirror !== null && hit.closest('[data-band="tray"]') !== null) {
    return { target: 'other', capture: mirror, hit: { kind: 'block' } };
  }
  const cellEl = hit.closest('[data-wordcell]');
  if (cellEl !== null) {
    return wordcellPress(cellEl, cellEl);
  }
  const foot = hit.closest('[data-foot]');
  const columnEl = foot ?? hit.closest('[data-column]');
  if (columnEl !== null) {
    return {
      target: 'column',
      capture: selected ? columnEl : null,
      hit: { kind: 'space', column: columnOf(columnEl), foot: foot !== null },
    };
  }
  return { target: 'other', capture: null, hit: OUTSIDE };
}

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

  function stopTimer(p: Press<H>): void {
    if (p.timer === null) return;
    deps.clearTimer(p.timer.handle);
    p.timer = null;
  }

  function end(reason: EndReason): void {
    const p = press;
    if (p === null) throw new Error('AD-12 end() with no active press');
    stopTimer(p);
    press = null;
    if (p.captured?.hasPointerCapture(p.pointerId) === true) {
      p.captured.releasePointerCapture(p.pointerId);
    }
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
    if (drag !== null) {
      // Epic 4 SPEC F19: a pick-up drag closes the hover peek at release, before the fly-back or
      // drop.
      overlays.closeHoverPeek();
    }
    if (drag?.kind === 'tile') {
      // Epic 5 SPEC CAP-5, F5: an edit release and every non-flying end settle at once; the
      // fly-back lands unlifted, the parted faces return beside it.
      flies =
        kind === 'up'
          ? tileCommand(drag) === null
          : kind === 'pointercancel' ||
            kind === 'lostCapture' ||
            (reason.kind === 'cancel' && reason.byBack);
      if (flies) {
        flight.flyBack(drag, false);
        returnRun(drag);
      } else {
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
  }

  function unsuppress(): void {
    if (root === null) throw new Error('AD-12 selection suppression without a root');
    root.classList.remove(SUPPRESSED);
  }

  // Removes every drag class and the inline transform from the tail; for a tile drag, from the
  // dragged face, `.tiles` and every parted face.
  function clearDrag(drag: Drag): void {
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

  function faceIn(wrapper: Element): HTMLElement {
    const face = wrapper.querySelector('.face');
    if (face === null) throw new Error('AD-12 card without a .face');
    return face as HTMLElement;
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

  // Epic 5 SPEC CAP-5: the threshold-crossing move of a live tile press, run before the F18 clear
  // so a selected face's lift is measured.
  function startTileDrag(p: Press<H>, card: CardId): TileDrag {
    const wrapper = found(p.captured, 'AD-12 tile press without a capture') as HTMLElement;
    const view = game.view;
    if (view === undefined) throw new Error('AD-12 tile drag without a GameView');
    const run = tileRun(view, card);
    const tiles = found(
      trayTarget().querySelector('.tiles') as HTMLElement | null,
      'AD-12 tray band without .tiles',
    );
    // `slotRects`' origin: tray position 0's wrapper top-left + 2 px x, measured once.
    const head = found(tiles.children[0], 'AD-12 .tiles without a tile').getBoundingClientRect();
    const sizing = trayLayout(run.tileCount, deps.w(), deps.trayInnerWidth());
    const slots = slotRects(sizing, { x: head.left + 2, y: head.top }, run.tileCount);
    const gaps = gapRects(slots, sizing.perRow, run.tileCount, run.first, run.count);
    const runFaces = run.order.map((id) =>
      faceIn(
        found(tiles.querySelector(`[data-card-id="${id}"]`), `AD-12 tile ${id} not in .tiles`),
      ),
    );
    const face = faceIn(wrapper);
    if (runFaces[run.from] !== face) throw new Error(`AD-12 tile ${card} pressed outside .tiles`);
    const slot = slots[run.first + run.from] as Rect;
    const lift = slot.top - face.getBoundingClientRect().top;
    clearHover();
    tiles.classList.add(DRAG_TILES);
    face.classList.add(DRAG_LAYER);
    return {
      kind: 'tile',
      wrappers: [wrapper],
      faces: [face],
      x: p.state.x,
      y: p.state.y,
      lift,
      dx: 0,
      dy: 0,
      tiles,
      run,
      runFaces,
      slots,
      gaps,
      accepted: false,
      gap: null,
    };
  }

  // SPEC CAP-7: the threshold-crossing move of a column-card press; null when the press is not a
  // pick-up (another kind of press, or the column cannot be picked up: the drag is inert).
  function startDrag(p: Press<H>): Drag | null {
    const hit = p.hit;
    if (hit.kind === 'tile') return startTileDrag(p, hit.card);
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

  // Epic 5 SPEC CAP-5: the tile drag's command at release, from the last move's acceptance and gap.
  function tileCommand(drag: TileDrag): Command | null {
    return drag.accepted && drag.gap !== null ? drag.run.release(drag.gap) : null;
  }

  // Epic 5 SPEC CAP-5: the other run faces part to the gap (rest when unaccepted).
  function partRun(drag: TileDrag): void {
    const { run, slots, gap } = drag;
    const offsets =
      gap === null
        ? null
        : partingOffsets(slots, run.tileCount, run.first, run.count, gap, run.from);
    const ms = duration('parting');
    for (const [r, face] of drag.runFaces.entries()) {
      if (r === run.from) continue;
      const p = run.first + r;
      const o = offsets === null ? REST : (offsets[p] as Offset);
      parting.part(face, slots[p] as Rect, { dx: o.dx, dy: o.dy }, ms);
    }
  }

  // Epic 5 SPEC CAP-5: every parted face returns to rest beside the fly-back.
  function returnRun(drag: TileDrag): void {
    const ms = duration('flyBack');
    const reduced = prefs.motion.reduced;
    for (const [r, face] of drag.runFaces.entries()) {
      if (r === drag.run.from) continue;
      parting.home(face, drag.slots[drag.run.first + r] as Rect, ms, reduced);
    }
  }

  // Epic 5 SPEC CAP-5 one tile drag move: transform, accept the clipped tray band, pick the gap,
  // part on a change (DOM only).
  function tileMove(drag: TileDrag, x: number, y: number): void {
    drag.dx = x - drag.x;
    drag.dy = y - drag.y;
    const face = drag.faces[0];
    face.style.transform = translate(drag.dx, drag.dy - drag.lift);
    const dragged = face.getBoundingClientRect();
    const trayRect = clip(trayTarget().getBoundingClientRect(), band.visibleBand());
    const accepted = pickTarget(dragged, [{ id: TRAY, rect: trayRect }], TRAY, true).raw !== null;
    const gap = accepted ? insertionIndex(dragged, drag.gaps).index : null;
    if (accepted === drag.accepted && gap === drag.gap) return;
    drag.accepted = accepted;
    drag.gap = gap;
    partRun(drag);
  }

  // AD-12 one drag move: transform, measure, pick, highlight (DOM only, F12).
  function dragMove(drag: Drag, x: number, y: number): void {
    if (drag.kind === 'tile') {
      tileMove(drag, x, y);
      return;
    }
    drag.dx = x - drag.x;
    drag.dy = y - drag.y;
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
    // F13: a press during a fly-back (or a tile drag's returns, epic 5 SPEC CAP-5) acts on the
    // settled layout; the gate never idles between.
    const inFlight = flight.running() || parting.running();
    if (inFlight) {
      gate.enter();
      flight.finishFlight();
      parting.finishAll();
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
    };
    press = p;
    if (p.captured !== null) {
      menuSlot = null;
      p.captured.setPointerCapture(p.pointerId);
    }
    if (longPressTimed(resolved.target)) {
      p.timer = { handle: deps.setTimer(() => onTimer(p), LONG_PRESS_MS) };
    }
  }

  function pointermove(event: PointerEvent): void {
    const p = press;
    if (p === null || !own(event)) return;
    const next = classify(p.state, { type: 'move', x: event.clientX, y: event.clientY });
    if (typeof next === 'string') throw new Error(`AD-12 move classified as ${next}`);
    const crossing = next.kind === 'drag' && p.state.kind !== 'drag';
    if (crossing) stopTimer(p);
    p.state = next;
    // The threshold-crossing move is the first drag move (epic 4 SPEC CAP-7); epic 4 SPEC CAP-8:
    // any column press clears the hover there, picked up or not.
    if (crossing) {
      if (p.hit.kind === 'card' || p.hit.kind === 'space') clearHover();
      // Epic 5 SPEC CAP-5: a live tile press starts its drag (lift measured) before the F18 clear.
      p.drag = startDrag(p);
      // Epic 5 SPEC F18: a live tile press clears the tile selection at the threshold.
      if (p.hit.kind === 'tile') overlays.clearTile();
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
        game.dispatch(action.command);
        return;
      case 'remove':
        overlays.clearTile();
        game.dispatch({ type: 'removeFreeLetter', cell: action.cell });
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
        game.dispatch({
          type: 'drop',
          sourceColumn: action.sourceColumn,
          sourceCount: action.sourceCount,
          destinationColumn: action.destinationColumn,
        });
        return;
      case 'tapDestinationCard':
        game.dispatch({ type: 'tapDestinationCard', card: action.card });
        return;
      case 'openView':
        overlays.openView(action.cell);
        return;
      case 'none':
        return;
    }
  }

  function pointerup(event: PointerEvent): void {
    if (event.pointerId === menuSlot) menuSlot = null;
    const p = press;
    if (p === null || !own(event)) return;
    const outcome = classify(p.state, { type: 'up' });
    const drag = p.drag;
    end({ kind: 'up' });
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
      if (card !== null) game.dispatch({ type: 'tapDestinationCard', card });
      refreshHover();
      return;
    }
    if (drag.kind === 'tile') {
      // Epic 5 SPEC CAP-5: the one command of a tile drag, on the last move's acceptance and gap;
      // a release with none flew back (hover repaints at its settle).
      const command = tileCommand(drag);
      if (command === null) return;
      game.dispatch(command);
      refreshHover();
      return;
    }
    if (drag.highlighted === null) return;
    // AD-12: the one command of a drag, on the last-shown highlight (EXPERIENCE.md step 6).
    if (overlays.selection !== null) overlays.deselect();
    game.dispatch({
      type: 'drop',
      sourceColumn: drag.source,
      sourceCount: drag.count,
      destinationColumn: drag.highlighted,
    });
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

  function cancel(options: CancelOptions = {}): void {
    if (root === null) return;
    // Epic 4 SPEC F19: the settle suppresses; idle or not, the hover peek closes and the cell under
    // the last mouse point is suppressed. Epic 5 SPEC CAP-5: a tile drag's returns finish too; an
    // active tile drag's parting is end()'s (finished, or by back returned from its current offset).
    flight.finishFlight();
    if (press?.drag?.kind !== 'tile') parting.finishAll();
    hover.closeHover();
    hover.suppress();
    if (press === null) return;
    end({ kind: 'cancel', byBack: options.byBack === true });
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

  return { cancel, attach, refreshHover };
}
