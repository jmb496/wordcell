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
// drag move writes `translate(pointer − press point)` on the faces, measures the grabbed face
// against every registered drop target (`drop-target.ts`) with `pickTarget` and moves
// `wc-drag-target` to the highlighted column's target element, all by DOM only (no Svelte state,
// store call or dispatch before release). Release drops on the last highlight (deselect first),
// else flies back; pointercancel, lostpointercapture and cancel({ byBack: true }) fly back from the
// last transform; any other end snaps back at once. The fly-back (WAAPI over
// `duration('flyBack')`, a fade under reduced motion) is gate-counted and settles on its faces'
// `onfinish`, or at once from cancel() or a new drag. Hover classes are cleared during a drag or
// fly-back and recomputed after.
import { game } from '../../shell/game.svelte';
import { prefs } from '../../shell/prefs.svelte';
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
import { columnTargets } from './drop-target';
import type { Gate } from './gate';
import { type Hit, type HoverAction, hoverAction, tapAction } from './intent';
import { pickTarget } from './targeting';

export type ControllerDeps<H> = {
  elementFromPoint(x: number, y: number): Element | null;
  setTimer(callback: () => void, ms: number): H;
  clearTimer(handle: H): void;
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
  /** The last transform written on the faces. */
  transform: string;
  hasLeftSource: boolean;
  highlighted: number | null;
  /** The element carrying `wc-drag-target`. */
  target: Element | null;
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
const DRAG_GHOST = 'wc-drag-ghost';
const DRAG_LAYER = 'wc-drag-layer';
const DRAG_TARGET = 'wc-drag-target';
const OUTSIDE: Hit = { kind: 'outside' };

function attribute(el: Element, name: string): number {
  const value = Number(el.getAttribute(name));
  if (!Number.isInteger(value)) throw new Error(`AD-12 ${name} is not an integer`);
  return value;
}

// AD-3: WordCell emptiness comes from the GameView at pointerdown, never the DOM.
function wordcellTarget(cellEl: Element): PressTarget {
  const view = game.view;
  if (view === undefined) throw new Error('AD-12 WordCell press without a GameView');
  const n = attribute(cellEl, 'data-wordcell');
  const cell = view.cells.find((c) => c.cell === n);
  if (cell === undefined) throw new Error(`AD-12 WordCell press on unknown cell ${n}`);
  return cell.cards.length === 0 ? 'emptyWordcell' : 'wordcell';
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
      return { target: wordcellTarget(cellEl), capture: card, hit: { kind: 'wordcell' } };
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
    return { target: wordcellTarget(cellEl), capture: cellEl, hit: { kind: 'wordcell' } };
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
    const kind = reason.kind;
    if (
      (kind === 'cancel' || kind === 'pointercancel' || kind === 'lostCapture') &&
      overlays.peek !== null
    ) {
      overlays.closePeek();
    }
    if ((kind === 'cancel' || kind === 'lostCapture') && p.captured !== null) {
      menuSlot = p.pointerId;
    }
    const drag = p.drag;
    let flies = false;
    if (drag !== null) {
      drag.target?.classList.remove(DRAG_TARGET);
      drag.target = null;
      flies =
        kind === 'up'
          ? drag.highlighted === null
          : kind === 'pointercancel' ||
            kind === 'lostCapture' ||
            (reason.kind === 'cancel' && reason.byBack);
      // The fly-back enters the gate before the press leaves it (F13).
      if (flies) flyBack(drag);
      else clearDrag(drag);
    }
    gate.leave();
    // A drop refreshes after its dispatch (pointerup).
    if (drag !== null && !flies && kind !== 'up') refreshHover();
  }

  // Removes every drag class and the inline transform from the tail.
  function clearDrag(drag: Drag): void {
    for (const face of drag.faces) {
      face.style.transform = '';
      face.classList.remove(DRAG_LAYER);
    }
    for (const wrapper of drag.wrappers) wrapper.classList.remove(DRAG_GHOST);
  }

  // F13: WAAPI on the faces from the last written transform back to the slot; under reduced motion
  // the transform clears at once and the faces fade in. Gate-counted until settled.
  function flyBack(drag: Drag): void {
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
    for (const face of drag.faces) {
      let animation: Animation;
      if (reduced) {
        face.style.transform = '';
        animation = face.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms });
      } else {
        animation = face.animate(
          [{ transform: drag.transform }, { transform: 'translate(0px, 0px)' }],
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
    const wrappers = entry.cards.slice(start).map((id) => cardIn(sourceEl, id));
    const faces = wrappers.map((wrapper) => {
      const face = wrapper.querySelector('.face');
      if (face === null) throw new Error('AD-12 card without a .face');
      return face as HTMLElement;
    });
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
      transform: '',
      hasLeftSource: false,
      highlighted: null,
      target: null,
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

  // AD-12 one drag move: transform, measure, pick, highlight (DOM only, F12).
  function dragMove(drag: Drag, x: number, y: number): void {
    const transform = `translate(${x - drag.x}px, ${y - drag.y}px)`;
    drag.transform = transform;
    for (const face of drag.faces) face.style.transform = transform;
    const grabbed = drag.faces[0];
    if (grabbed === undefined) throw new Error('AD-12 drag without a face');
    const targets = columnTargets();
    const { raw, highlighted } = pickTarget(
      grabbed.getBoundingClientRect(),
      targets.map(({ id, el }) => ({ id, rect: el.getBoundingClientRect() })),
      drag.source,
      drag.hasLeftSource,
    );
    if (raw !== drag.source) drag.hasLeftSource = true;
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
  }

  function own(event: PointerEvent): boolean {
    return press !== null && event.pointerId === press.pointerId;
  }

  function pointerdown(event: PointerEvent): void {
    // A same-id pointerdown: that pointer was released, so its slot is spent.
    if (event.pointerId === menuSlot) menuSlot = null;
    if (event.button !== 0 || root === null) return;
    if (press !== null) {
      if (event.pointerId !== press.pointerId) return;
      // A same-id pointerdown: the old press's end was lost.
      end({ kind: 'sameId' });
    }
    const resolved = resolve(
      root,
      deps.elementFromPoint(event.clientX, event.clientY),
      overlays.selection !== null,
    );
    if (resolved === null) return;
    gate.enter();
    const p: Press<H> = {
      pointerId: event.pointerId,
      captured: resolved.capture,
      hit: resolved.hit,
      state: start(resolved.target, event.clientX, event.clientY),
      timer: null,
      drag: null,
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
    // The threshold-crossing move is the first drag move (SPEC CAP-7).
    if (crossing) p.drag = startDrag(p);
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
    if (outcome === 'tap') perform(p.hit);
    if (drag === null || drag.highlighted === null) return;
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
    if (resolved === null || resolved.hit.kind !== 'outside') return;
    perform(resolved.hit);
  }

  function clearHover(): void {
    if (hovered === null) return;
    hovered.classList.remove(...HOVER_CLASSES);
    hovered.style.removeProperty(HOVER_FROM);
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
    }
  }

  // DESIGN.md Card states, hover: at most one `[data-column]` carries the classes (old cleared).
  function refreshHover(): void {
    clearHover();
    // Entry 8: no hover during a drag or a fly-back.
    if (flying !== null || (press !== null && press.drag !== null)) return;
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

  function pointerover(event: PointerEvent): void {
    if (track(event)) refreshHover();
  }

  function pointerout(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || root === null) return;
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
    finishFlight();
    if (press === null) return;
    end({ kind: 'cancel', byBack: options.byBack === true });
  }

  function attach(next: HTMLElement): () => void {
    if (root !== null) throw new Error('AD-12 attach() while attached');
    root = next;
    for (const type of LISTENED) {
      next.addEventListener(type, handlers[type] as EventListener, { passive: false });
    }
    let attached = true;
    return () => {
      if (!attached) throw new Error('AD-12 detach() called twice');
      attached = false;
      cancel();
      for (const type of LISTENED) {
        next.removeEventListener(type, handlers[type] as EventListener);
      }
      menuSlot = null;
      lastPoint = null;
      clearHover();
      root = null;
    };
  }

  return { cancel, attach, refreshHover };
}
