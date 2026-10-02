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
import { game } from '../../shell/game.svelte';
import { overlays } from '../overlays.svelte';
import {
  classify,
  LONG_PRESS_MS,
  longPressTimed,
  type PressState,
  type PressTarget,
  start,
} from './classify';
import type { Gate } from './gate';
import { type Hit, type HoverAction, hoverAction, tapAction } from './intent';

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
  // `byBack` is recorded for entries 8–9 (fly-back, F13, F24); no behavioural difference yet.
  | { readonly kind: 'cancel'; readonly byBack: boolean };

type Press<H> = {
  readonly pointerId: number;
  /** The element holding this press's capture; null for an uncaptured press. */
  readonly captured: Element | null;
  readonly hit: Hit;
  state: PressState;
  timer: { readonly handle: H } | null;
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
    gate.leave();
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
    if (next.kind === 'drag' && p.state.kind !== 'drag') stopTimer(p);
    p.state = next;
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
    end({ kind: 'up' });
    if (outcome === 'tap') perform(p.hit);
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
    if (root === null || press === null) return;
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
