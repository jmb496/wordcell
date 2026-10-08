// AD-12 pointer controller core (SPEC CAP-4, build-notes CAP-4): one active press per root, fed to
// the pure `classify`. A button-0 pointerdown with no active press, not on an enabled button (F25),
// enters the gate and resolves from `elementFromPoint` at the press point, never `event.target`
// (F13): a card by `data-place` (F23), a tray-band mirror as a tile, a WordCell part by
// `[data-wordcell]`, a non-card column part by `[data-column]`/`[data-foot]` (uncaptured with
// nothing selected, so a pan cancels it), anything else uncaptured. Every other pointerId is
// untouched (no preventDefault or stopPropagation). One `end` path for pointerup, pointercancel,
// lostpointercapture (captured element only), cancel(), a same-id pointerdown and detach: timer
// cleared, press cleared before capture is released, a peek closed
// (cancel/pointercancel/lostpointercapture, AD-13), then one `gate.leave()`. `contextmenu` is
// preventDefaulted for a press it captured (SPEC CAP-4, rule-coverage AD-11) and, after
// cancel()/lostpointercapture of one, until that pointerId's pointerup/pointercancel, the next
// captured press or detach.
// Entry 7 (SPEC CAP-6, F25, F26, F31): the pointerdown also resolves a `Hit` (intent.ts); with a
// tail selected a non-card column press is captured on its `[data-foot]` or `[data-column]`. Only
// `classify`'s final `tap` acts, after `end()`: select, deselect, or deselect then one `drop`. A
// `click` acts only for non-pointer activation (`detail === 0`) resolving outside (F25). Mouse
// hover (`pointerType === 'mouse'`) toggles `wc-hover-tail` (+ `--wc-hover-from`), `wc-grab`,
// `wc-drop` and `wc-drop-self` on at most one `[data-column]`, recomputed at the last point by
// `pointerover` and `refreshHover()` (App's reaction to the selection and the GameView).
// Entry 8 (SPEC CAP-7, AD-12, F12, F13, F26): a column-card press whose column `canPickUp` turns
// into a drag at the threshold-crossing move (the first drag move): the tail (pressed card to the
// bottom, R-10) gets `wc-drag-ghost` on its slot wrappers and `wc-drag-layer` on its faces; each
// drag move writes `translate(pointer − press point)` (F32: minus a selected face's lift) on the
// faces, measures the grabbed face against every registered drop target (`drop-target.ts`) with
// `pickTarget` and moves
// `wc-drag-target` to the highlighted column's target element, all by DOM only (no Svelte state,
// store call or dispatch before release). Release drops on the last highlight (deselect first),
// else flies back; pointercancel, lostpointercapture and cancel({ byBack: true }) fly back from the
// last transform; any other end snaps back at once. The fly-back (WAAPI over
// `duration('flyBack')`, a fade under reduced motion) is gate-counted and settles on its faces'
// `onfinish`, or at once from cancel(), a new press or a new drag. Hover classes are cleared during
// a drag or fly-back and recomputed after.
// Entry 9 (SPEC CAP-4, CAP-7, F12, F13, F24, F28; AD-9, AD-13): a pick-up drag that starts with a
// selection open is *replacing*: at its threshold crossing `wc-selection-suppressed` goes on the
// attach root (CSS hides the old selection's lift, outline, `Here` and foot states; the overlays
// store is untouched mid-drag). Every end removes it at `end()`: a restoring fly-back
// (pointercancel, lostpointercapture, cancel({ byBack: true })) at its start under both motion
// settings (F32, F33), keeping the selection with no nav call (back's `closedByBack` clears it);
// a release with no highlight and a plain cancel() (before-hide, act(), detach) deselect once, a
// drop deselects in `pointerup` before its dispatch, and a same-id pointerdown restores. A
// button-0 pointerdown with no active press during a fly-back enters the gate, finishes the
// flight, then resolves (F13); the settle's refreshHover() may repaint the mouse hover before the
// press resolves, and a drag that then starts clears it again.
// F32 (AD-12): a dragged stack inside the selection (its top wrapper is `lifted`, F33) keeps the
// selection lift in the drag transform, `translate(pointer − press point − lift)`; any other stack
// has lift 0. A restoring fly-back (every fly-back but a release with no highlight, which
// deselects, and a back that closes the tail selection) lands each face on its resting slot
// (lifted if its wrapper is `lifted`, else unlifted), so no face jumps at the threshold or snaps at
// settle; the others land on `translate(0px, 0px)`.
// Entry 10 (SPEC CAP-8, R-31, R-39, CAP-4): in Composing a destination-column card whose
// `kIfTapped` is a number dispatches `tapDestinationCard` on a tap (`perform`) and, as a drag-as-tap,
// at the pointerup of a press that crossed the threshold (the card never moves: no pick-up), reading
// `game.view` at pointerup wherever released; pointercancel, lostpointercapture and cancel() dispatch
// nothing. A column press that crosses the threshold without a pick-up drag clears the hover at the
// crossing; `refreshHover` skips while any crossed press is held and repaints at every end of one.
// The desktop k preview (`hoverAction` kind `k`) is `wc-hover-tail` with `--wc-hover-from` and
// `--wc-hover-len` (the remainder length, so the outline never covers S ghosts); no `wc-grab`.
// Entry 11 (SPEC CAP-9, R-65, Q-21, F14, F24; AD-12, AD-13): a non-empty WordCell press whose
// long-press fires opens the peek (`overlays.openPeek`, no entry); its `pointerup` reads the
// rendered `[data-view-scroll]` under the root and keeps it as the sticky view
// (`peekToSticky()`, one entry) iff it overflows, else `closePeek()`; every other end closes it.
// A non-empty WordCell tap with nothing selected opens the sticky view in Idle and Game over
// (`openView`, intent.ts). The view's scrim and sheet resolve before `data-place`, uncaptured (the
// sheet pans): a tap closes the view (`close('wordcellView')`, never a deselect) and arms the
// trailing-click swallower (click-swallow.ts) on the root; a drag does nothing. Every pointerdown
// and detach disarm the swallower.
// Entry 12 (SPEC CAP-9, F19; AD-12, AD-13): the desktop hover peek. A mouse `pointerover` entering
// a `[data-wordcell]` (relatedTarget outside it or null) arms one LONG_PRESS_MS timer (a single
// slot) while `deps.hoverFine()`, with no press held, no fly-back, `buttons` 0, the cell not
// suppressed, its hover peek not open and the cell non-empty in the GameView (AD-3); at fire it
// re-checks `hoverFine` and emptiness and calls `overlays.openHoverPeek` (the store gates peek,
// view and modal tops). A mouse `pointerout` leaving the cell clears its timer, closes the hover
// peek and lifts its suppression. Every pointerdown (any type or button) first clears the timer. A
// threshold crossing that starts a pick-up drag hides `[data-hover-peek]` with
// `wc-hover-peek-hidden` (DOM only) and `end()` closes it before the fly-back or the drop; any other
// crossing closes it there. Suppression is one `[data-wordcell]` slot: the cell whose rect holds
// the last mouse point, set at every mouse press end, fly-back settle and cancel(), so boundary
// pointerovers into it never arm until a pointerout leaves it. cancel() (idle too), detach and
// `refreshHover()` with `hoverFine` false clear the timer and close the hover peek; while attached,
// `deps.watchHoverFine` runs `refreshHover()` at every hoverFine change. An entry into another cell
// closes an open hover peek first (a removed node sends no pointerout).
// Entry 13 (ticket 4.13): drop targeting measures each registered column rect clipped vertically
// to the visible band (SPEC F34, AD-12): from the lower of the top bar's and a shown banner's
// bottom to the action bar's top, read once per drag move; a column wholly under a bar is a
// zero-area candidate, so a tail held over a bar lights nothing and its release flies back. A
// same-id pointerdown ends the lost press before the button check (any button, CAP-4). The F25
// non-pointer `click` treats a tray tile like outside. The hover-peek timer is keyed by cell
// number (a replaced cell node's pointerout still stops it) and any real cell entry stops it
// before its no-arm returns; the suppression slot uses half-open rects (a shared edge goes right).
import { flushSync } from 'svelte';
import { game } from '../../shell/game.svelte';
import { prefs } from '../../shell/prefs.svelte';
import { SELECTION_LIFT_PX } from '../layout/geometry';
import { duration } from '../motion';
import { overlays } from '../overlays.svelte';
import {
  classify,
  LONG_PRESS_MS,
  longPressTimed,
  type PressState,
  type PressTarget,
  start,
} from './classify';
import { createClickSwallower } from './click-swallow';
import { columnTargets } from './drop-target';
import type { Gate } from './gate';
import { destinationTap, type Hit, type HoverAction, hoverAction, tapAction } from './intent';
import { pickTarget, type Rect } from './targeting';

export type ControllerDeps<H> = {
  elementFromPoint(x: number, y: number): Element | null;
  setTimer(callback: () => void, ms: number): H;
  clearTimer(handle: H): void;
  /** Entry 12: live `(hover: hover) and (pointer: fine)` (layout.hoverFine). */
  hoverFine(): boolean;
  /** Entry 12: calls `callback` at every hoverFine change (layout.watchHoverFine); returns the unwatch. */
  watchHoverFine(callback: () => void): () => void;
};

export type CancelOptions = { readonly byBack?: boolean };

export type Controller = {
  /** AD-12/F13: ends any press at once with no command; a no-op when detached or idle. */
  cancel(options?: CancelOptions): void;
  /** F8: attaches the listeners to the active-branch root; returns the detach. */
  attach(root: HTMLElement): () => void;
  /** Recomputes the mouse hover classes at the last pointer point (App's reaction, entry 7). */
  refreshHover(): void;
};

type EndReason =
  | { readonly kind: 'up' | 'pointercancel' | 'lostCapture' | 'sameId' }
  // `byBack`: a drag flies back (F13) instead of snapping.
  | { readonly kind: 'cancel'; readonly byBack: boolean };

/** Entry 8: a press that crossed the threshold on a column card whose column `canPickUp`. */
type Drag = {
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
  /** Entry 9: started with a selection open; the root carries `SUPPRESSED` until its end. */
  readonly replacing: boolean;
};

/** A running fly-back (F13). */
type Flight = { readonly drag: Drag; readonly animations: Animation[]; settled: boolean };

type Press<H> = {
  readonly pointerId: number;
  /** The element holding this press's capture; null for an uncaptured press. */
  readonly captured: Element | null;
  readonly hit: Hit;
  state: PressState;
  timer: { readonly handle: H } | null;
  drag: Drag | null;
  /** Entry 12: `pointerType === 'mouse'` (a mouse press end sets the suppression). */
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

const HOVER_CLASSES = ['wc-hover-tail', 'wc-grab', 'wc-drop', 'wc-drop-self'] as const;
const HOVER_FROM = '--wc-hover-from';
const HOVER_LEN = '--wc-hover-len';
const DRAG_GHOST = 'wc-drag-ghost';
const DRAG_LAYER = 'wc-drag-layer';
const DRAG_TARGET = 'wc-drag-target';
const SUPPRESSED = 'wc-selection-suppressed';
const HOVER_PEEK_HIDDEN = 'wc-hover-peek-hidden';
const OUTSIDE: Hit = { kind: 'outside' };

// Entry 13 (F34): a column rect clipped vertically to the visible band; an empty clip is zero-area.
function clip(r: Rect, band: { readonly top: number; readonly bottom: number }): Rect {
  const top = Math.max(r.top, band.top);
  const bottom = Math.max(top, Math.min(r.bottom, band.bottom));
  return { left: r.left, top, right: r.right, bottom };
}

function translate(dx: number, dy: number): string {
  return `translate(${dx}px, ${dy}px)`;
}

function attribute(el: Element, name: string): number {
  const value = Number(el.getAttribute(name));
  if (!Number.isInteger(value)) throw new Error(`AD-12 ${name} is not an integer`);
  return value;
}

// AD-3: WordCell emptiness comes from the GameView at pointerdown, never the DOM.
function wordcellPress(cellEl: Element, capture: Element): Resolved {
  const view = game.view;
  if (view === undefined) throw new Error('AD-12 WordCell press without a GameView');
  const n = attribute(cellEl, 'data-wordcell');
  const cell = view.cells.find((c) => c.cell === n);
  if (cell === undefined) throw new Error(`AD-12 WordCell press on unknown cell ${n}`);
  return {
    target: cell.cards.length === 0 ? 'emptyWordcell' : 'wordcell',
    capture,
    hit: { kind: 'wordcell', cell: n },
  };
}

// The column number of the `[data-column]` an element sits in.
function columnOf(el: Element): number {
  const columnEl = el.closest('[data-column]');
  if (columnEl === null) throw new Error('AD-12 column part outside [data-column]');
  return attribute(columnEl, 'data-column');
}

// F23 press resolution, build-notes CAP-4. `null` = an enabled button: not a press at all (F25).
// `selected`: with a tail selected, non-card column presses are captured (entry 7).
function resolve(root: HTMLElement, hit: Element | null, selected: boolean): Resolved | null {
  if (hit === null || !root.contains(hit)) return { target: 'other', capture: null, hit: OUTSIDE };
  if (hit.closest('button:enabled') !== null) return null;
  // Entry 11: the view's scrim and sheet (mirrors included), uncaptured so the sheet pans.
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
      const cellEl = card.closest('[data-wordcell]');
      if (cellEl === null) throw new Error('AD-12 cell card outside [data-wordcell]');
      return wordcellPress(cellEl, card);
    }
    if (place === 'tray' || place === 'strip') {
      return { target: 'other', capture: card, hit: { kind: 'tile' } };
    }
    throw new Error(`AD-12 unknown data-place ${place}`);
  }
  const mirror = hit.closest('[data-mirror-of]');
  if (mirror !== null && hit.closest('[data-band="tray"]') !== null) {
    return { target: 'other', capture: mirror, hit: { kind: 'tile' } };
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
  /** The running fly-back, if any. */
  let flying: Flight | null = null;
  /** Entry 11: swallows the trailing click of a tap that closed the sticky view. */
  const swallower = createClickSwallower(deps);
  /** Entry 12: the one pending hover-peek timer and the cell number it was armed for (entry 13). */
  let hoverTimer: { readonly handle: H; readonly cell: number } | null = null;
  /** Entry 12: the `[data-wordcell]` whose pointerovers never arm until a pointerout leaves it. */
  let suppressed: Element | null = null;

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
    // Entry 12: any mouse press end suppresses the cell under the last mouse point.
    if (p.mouse) suppress();
    const kind = reason.kind;
    // Entry 11 (AD-12 peek on end): only a pointerup may turn the peek sticky (pointerup).
    if (kind !== 'up' && overlays.peek !== null) overlays.closePeek();
    if ((kind === 'cancel' || kind === 'lostCapture') && p.captured !== null) {
      menuSlot = p.pointerId;
    }
    const drag = p.drag;
    let flies = false;
    if (drag !== null) {
      // Entry 12: a pick-up drag closes the hover peek at release, before the fly-back or drop.
      overlays.closeHoverPeek();
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
      if (flies) flyBack(drag, kind !== 'up' && !closesSelection);
      else clearDrag(drag);
      // Entry 9 (F24/F28, F33): every end removes the class here, a restoring fly-back at its start;
      // a release with no highlight and a plain cancel() deselect.
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
    // A drop and a drag-as-tap refresh after their dispatch (pointerup); entry 10: a crossed press
    // with no pick-up drag repaints at every other end.
    if (kind !== 'up' && (drag !== null ? !flies : p.state.kind === 'drag')) refreshHover();
  }

  function unsuppress(): void {
    if (root === null) throw new Error('AD-12 selection suppression without a root');
    root.classList.remove(SUPPRESSED);
  }

  // Removes every drag class and the inline transform from the tail.
  function clearDrag(drag: Drag): void {
    for (const face of drag.faces) {
      face.style.transform = '';
      face.classList.remove(DRAG_LAYER);
    }
    for (const wrapper of drag.wrappers) wrapper.classList.remove(DRAG_GHOST);
  }

  // F13: WAAPI on the faces from the last written transform back to the slot (F32/F33: when
  // `restoring`, each face's resting slot, lifted if its wrapper is `lifted`); under reduced motion
  // the transform clears at once (Card's `.lifted .face` rests a kept selection's faces lifted) and
  // the faces fade in. Gate-counted until settled.
  function flyBack(drag: Drag, restoring: boolean): void {
    if (flying !== null) throw new Error('AD-12 fly-back while one is running');
    gate.enter();
    const ms = duration('flyBack');
    const reduced = prefs.motion.reduced;
    const flight: Flight = { drag, animations: [], settled: false };
    flying = flight;
    let remaining = drag.faces.length;
    const done = (): void => {
      remaining -= 1;
      if (remaining === 0) settle(flight);
    };
    for (const [i, face] of drag.faces.entries()) {
      let animation: Animation;
      if (reduced) {
        face.style.transform = '';
        animation = face.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms });
      } else {
        const rest =
          restoring && drag.wrappers[i]?.classList.contains('lifted') === true
            ? -SELECTION_LIFT_PX
            : 0;
        animation = face.animate(
          [
            { transform: translate(drag.dx, drag.dy - drag.lift) },
            { transform: translate(0, rest) },
          ],
          { duration: ms, easing: 'ease-out' },
        );
        face.style.transform = '';
      }
      animation.onfinish = done;
      // Rule 6: a cancelled fly-back would never settle (gate held, drag classes on); finishFlight's
      // finish() never cancels.
      animation.oncancel = () => {
        throw new Error('AD-12 fly-back animation cancelled');
      };
      flight.animations.push(animation);
    }
  }

  // Idempotent: the last face's onfinish, or finishFlight().
  function settle(flight: Flight): void {
    if (flight.settled) return;
    flight.settled = true;
    if (flying === flight) flying = null;
    clearDrag(flight.drag);
    gate.leave();
    suppress();
    refreshHover();
  }

  // F13: completes a running fly-back at once; its settle runs synchronously.
  function finishFlight(): void {
    const flight = flying;
    if (flight === null) return;
    for (const animation of flight.animations) animation.finish();
    settle(flight);
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
    const entry = view.columns[column - 1];
    if (entry === undefined || entry.column !== column) {
      throw new Error(`AD-12 column ${column} is not in the GameView`);
    }
    return entry;
  }

  // SPEC CAP-7: the threshold-crossing move of a column-card press; null when the press is not a
  // pick-up (another kind of press, or the column cannot be picked up: the drag is inert).
  function startDrag(p: Press<H>): Drag | null {
    const hit = p.hit;
    if (hit.kind !== 'card' || p.captured === null) return null;
    const entry = viewColumn(hit.column);
    if (!entry.canPickUp) return null;
    const start = entry.cards.indexOf(hit.card);
    if (start < 0) throw new Error(`AD-12 card ${hit.card} is not in column ${hit.column}`);
    const sourceEl = p.captured.closest('[data-column]');
    if (sourceEl === null) throw new Error('AD-12 column card outside [data-column]');
    finishFlight();
    clearHover();
    const replacing = overlays.selection !== null;
    if (replacing) {
      if (root === null) throw new Error('AD-12 drag without a root');
      root.classList.add(SUPPRESSED);
    }
    const wrappers = entry.cards.slice(start).map((id) => cardIn(sourceEl, id));
    const faces = wrappers.map((wrapper) => {
      const face = wrapper.querySelector('.face');
      if (face === null) throw new Error('AD-12 card without a .face');
      return face as HTMLElement;
    });
    // F33: lifted only when the stack lies inside the selection, i.e. its top card is lifted.
    const lift = wrappers[0]?.classList.contains('lifted') === true ? SELECTION_LIFT_PX : 0;
    for (const wrapper of wrappers) wrapper.classList.add(DRAG_GHOST);
    for (const face of faces) face.classList.add(DRAG_LAYER);
    return {
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
  function targetElement(drag: Drag, column: number, columnEl: Element): Element {
    if (column === drag.source) {
      return drag.remainderTop === null
        ? placeholderIn(drag.sourceEl)
        : cardIn(drag.sourceEl, drag.remainderTop);
    }
    const last = viewColumn(column).cards.at(-1);
    return last === undefined ? placeholderIn(columnEl) : cardIn(columnEl, last);
  }

  function barRect(band: 'topBar' | 'banner' | 'actionBar'): Rect {
    if (root === null) throw new Error('AD-12 drag without a root');
    const el = root.querySelector(`[data-band="${band}"]`);
    if (el === null) throw new Error(`AD-12 drag without [data-band="${band}"]`);
    return el.getBoundingClientRect();
  }

  // Entry 13 (F34): the visible band between the sticky bars; the banner wrapper is always
  // rendered and counts only while it has height (shown).
  function visibleBand(): { readonly top: number; readonly bottom: number } {
    const topBar = barRect('topBar');
    const banner = barRect('banner');
    const top = banner.bottom > banner.top ? Math.max(topBar.bottom, banner.bottom) : topBar.bottom;
    return { top, bottom: barRect('actionBar').top };
  }

  // F37: the targeting rule (≥ 25 % overlap) against the source column's unclipped hit rect.
  function overSource(
    drag: Drag,
    dragged: Rect,
    rects: readonly { readonly id: number; readonly whole: Rect }[],
  ): boolean {
    const source = rects.find(({ id }) => id === drag.source);
    if (source === undefined) throw new Error(`AD-12 column ${drag.source} not registered`);
    return (
      pickTarget(dragged, [{ id: drag.source, rect: source.whole }], drag.source, true).raw !== null
    );
  }

  // AD-12 one drag move: transform, measure, pick, highlight (DOM only, F12).
  function dragMove(drag: Drag, x: number, y: number): void {
    drag.dx = x - drag.x;
    drag.dy = y - drag.y;
    for (const face of drag.faces) face.style.transform = translate(drag.dx, drag.dy - drag.lift);
    const grabbed = drag.faces[0];
    if (grabbed === undefined) throw new Error('AD-12 drag without a face');
    const targets = columnTargets();
    const band = visibleBand();
    const dragged = grabbed.getBoundingClientRect();
    const rects = targets.map(({ id, el }) => ({ id, whole: el.getBoundingClientRect() }));
    const { raw, highlighted } = pickTarget(
      dragged,
      rects.map(({ id, whole }) => ({ id, rect: clip(whole, band) })),
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
    const columnEl = targets.find((t) => t.id === highlighted)?.el;
    if (columnEl === undefined) throw new Error(`AD-12 column ${highlighted} not registered`);
    drag.target = targetElement(drag, highlighted, columnEl);
    drag.target.classList.add(DRAG_TARGET);
  }

  function onTimer(p: Press<H>): void {
    if (press !== p) return;
    p.timer = null;
    const next = classify(p.state, { type: 'timer' });
    if (typeof next === 'string') throw new Error(`AD-12 timer classified as ${next}`);
    p.state = next;
    // Entry 11 (Q-21): a non-empty WordCell's long-press opens the peek, in every phase.
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
    // Entry 12: any pointerdown, of any type or button, cancels a pending hover-peek timer.
    stopHoverTimer();
    // Entry 11: a new press means the closing tap's trailing click is not coming.
    swallower.disarm();
    // A same-id pointerdown: that pointer was released, so its slot is spent.
    if (event.pointerId === menuSlot) menuSlot = null;
    if (root === null) return;
    // A same-id pointerdown, of any button (entry 13, CAP-4): the old press's end was lost.
    if (press !== null && event.pointerId === press.pointerId) {
      const peeked = overlays.peek !== null;
      end({ kind: 'sameId' });
      // That end closed the peek; flush so its scrim and sheet leave the DOM before
      // elementFromPoint, else this press resolves against the stale view.
      if (peeked) flushSync();
    }
    // Only the active press's own pointer acts on it; another pointer is untouched (CAP-4).
    if (event.button !== 0 || press !== null) return;
    // F13: a press during a fly-back acts on the settled layout; the gate never idles between.
    const inFlight = flying !== null;
    if (inFlight) {
      gate.enter();
      finishFlight();
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
    // The threshold-crossing move is the first drag move (SPEC CAP-7); entry 10: any column press
    // clears the hover there, picked up or not.
    if (crossing) {
      if (p.hit.kind === 'card' || p.hit.kind === 'space') clearHover();
      p.drag = startDrag(p);
      // Entry 12: a pick-up hides the hover peek (DOM only, AD-12); any other drag closes it.
      if (p.drag !== null) hideHoverPeek();
      else overlays.closeHoverPeek();
    }
    if (p.drag !== null) dragMove(p.drag, event.clientX, event.clientY);
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
    // Entry 11: a sheet or scrim tap only closes the view (never a deselect); a drag does nothing.
    if (p.hit.kind === 'sheet' || p.hit.kind === 'scrim') {
      if (outcome !== 'tap') return;
      if (root === null) throw new Error('AD-12 view tap without a root');
      overlays.close('wordcellView');
      swallower.arm(root);
      return;
    }
    if (outcome === 'tap') perform(p.hit);
    if (drag === null) {
      if (outcome !== 'drag') return;
      // Entry 10 (R-39): a drag-as-tap reads the GameView now (AD-3), wherever released.
      const view = game.view;
      if (view === undefined) throw new Error('AD-12 drag-as-tap without a GameView');
      const card = destinationTap(p.hit, view);
      if (card !== null) game.dispatch({ type: 'tapDestinationCard', card });
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
    // Entry 13: a tray tile counts as outside, as `tapAction` treats it.
    if (resolved === null || (resolved.hit.kind !== 'outside' && resolved.hit.kind !== 'tile')) {
      return;
    }
    perform(resolved.hit);
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
        columnEl.classList.add('wc-hover-tail');
        columnEl.style.setProperty(HOVER_FROM, String(action.from));
        if (action.grab) columnEl.classList.add('wc-grab');
        return;
      case 'drop':
        columnEl.classList.add('wc-drop');
        return;
      case 'dropSelf':
        columnEl.classList.add('wc-drop-self');
        return;
      case 'k':
        columnEl.classList.add('wc-hover-tail');
        columnEl.style.setProperty(HOVER_FROM, String(action.from));
        columnEl.style.setProperty(HOVER_LEN, String(action.length));
        return;
    }
  }

  // DESIGN.md Card states, hover: at most one `[data-column]` carries the classes (old cleared).
  function refreshHover(): void {
    // Entry 12: a hoverFine change to false closes the hover peek (never reads overlays.hoverPeek,
    // so App's reaction does not track it).
    if (!deps.hoverFine()) closeHover();
    clearHover();
    // Entry 8: no hover during a drag or a fly-back; entry 10: nor while any crossed press is held.
    if (flying !== null || (press !== null && press.state.kind === 'drag')) return;
    const view = game.view;
    if (root === null || lastPoint === null || view === undefined) return;
    const el = deps.elementFromPoint(lastPoint.x, lastPoint.y);
    const resolved = resolve(root, el, false);
    if (el === null || resolved === null) return;
    const action = hoverAction(resolved.hit, view, overlays.selection);
    if (action === null) return;
    const columnEl = el.closest('[data-column]') as HTMLElement | null;
    if (columnEl === null) throw new Error('AD-12 hover column outside [data-column]');
    showHover(columnEl, action);
  }

  function track(event: PointerEvent): boolean {
    if (event.pointerType !== 'mouse') return false;
    lastPoint = { x: event.clientX, y: event.clientY };
    return true;
  }

  function stopHoverTimer(): void {
    if (hoverTimer === null) return;
    deps.clearTimer(hoverTimer.handle);
    hoverTimer = null;
  }

  // Entry 12: clears the timer and closes the hover peek.
  function closeHover(): void {
    stopHoverTimer();
    overlays.closeHoverPeek();
  }

  function hideHoverPeek(): void {
    if (root === null) throw new Error('AD-12 hover peek hide without a root');
    root.querySelector('[data-hover-peek]')?.classList.add(HOVER_PEEK_HIDDEN);
  }

  // Entry 12: the suppression slot becomes the `[data-wordcell]` whose rect holds the last mouse
  // point (geometric: a scrim may still cover it), else null.
  function suppress(): void {
    suppressed = null;
    const pt = lastPoint;
    if (root === null || pt === null) return;
    for (const el of root.querySelectorAll('[data-wordcell]')) {
      const r = el.getBoundingClientRect();
      // Entry 13: half-open, so a shared edge belongs to the right or lower cell.
      if (pt.x >= r.left && pt.x < r.right && pt.y >= r.top && pt.y < r.bottom) {
        suppressed = el;
        return;
      }
    }
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
    // Entry 13: a cell entry stops any pending timer before the no-arm returns.
    stopHoverTimer();
    // Entering another cell closes its hover peek even with no pointerout from it.
    if (overlays.hoverPeek !== null && overlays.hoverPeek !== n) overlays.closeHoverPeek();
    if (!deps.hoverFine() || press !== null || flying !== null || event.buttons !== 0) return;
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
    const cell = view.cells.find((c) => c.cell === n);
    if (cell === undefined) throw new Error(`AD-12 hover peek on unknown cell ${n}`);
    return cell.cards.length;
  }

  function hoverLeave(event: PointerEvent): void {
    const cellEl = cellOf(event.target);
    if (cellEl === null || !outside(cellEl, event.relatedTarget)) return;
    if (hoverTimer?.cell === attribute(cellEl, 'data-wordcell')) stopHoverTimer();
    overlays.closeHoverPeek();
    if (suppressed === cellEl) suppressed = null;
  }

  function pointerover(event: PointerEvent): void {
    if (!track(event)) return;
    refreshHover();
    hoverEnter(event);
  }

  function pointerout(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || root === null) return;
    hoverLeave(event);
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
    // Entry 12: the settle suppresses; idle or not, the hover peek closes and the cell under the
    // last mouse point is suppressed.
    finishFlight();
    closeHover();
    suppress();
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
      suppressed = null;
      clearHover();
      root = null;
    };
  }

  return { cancel, attach, refreshHover };
}
