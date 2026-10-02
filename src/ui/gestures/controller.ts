// AD-12 pointer controller core (SPEC CAP-4, build-notes CAP-4): one active press per root, fed to
// the pure `classify`. A button-0 pointerdown with no active press, not on an enabled button (F25),
// enters the gate and resolves from `elementFromPoint` at the press point, never `event.target`
// (F13): a card by `data-place` (F23), a tray-band mirror as a tile, a WordCell part by
// `[data-wordcell]`, a non-card column part by `[data-column]`/`[data-foot]` (uncaptured, so a pan
// cancels it), anything else uncaptured. Every other pointerId is untouched (no preventDefault or
// stopPropagation). One `end` path for pointerup, pointercancel, lostpointercapture (captured
// element only), cancel(), a same-id pointerdown and detach: timer cleared, press cleared before
// capture is released, a peek closed (cancel/pointercancel/lostpointercapture, AD-13), then one
// `gate.leave()`. `contextmenu` is preventDefaulted for a press it captured (SPEC CAP-4,
// rule-coverage AD-11) and, after cancel()/lostpointercapture of one, until that pointerId's
// pointerup/pointercancel, the next captured press or detach. Entries 7–12 add the handlers;
// here every gesture ends with no command and no selection change.
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
};

type EndReason =
  | { readonly kind: 'up' | 'pointercancel' | 'lostCapture' | 'sameId' }
  // `byBack` is recorded for entries 8–9 (fly-back, F13, F24); no behavioural difference yet.
  | { readonly kind: 'cancel'; readonly byBack: boolean };

type Press<H> = {
  readonly pointerId: number;
  /** The element holding this press's capture; null for an uncaptured press. */
  readonly captured: Element | null;
  state: PressState;
  timer: { readonly handle: H } | null;
};

type Resolved = { readonly target: PressTarget; readonly capture: Element | null };

const LISTENED = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'lostpointercapture',
  'contextmenu',
] as const;

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

// F23 press resolution, build-notes CAP-4. `null` = an enabled button: not a press at all (F25).
function resolve(root: HTMLElement, hit: Element | null): Resolved | null {
  if (hit === null || !root.contains(hit)) return { target: 'other', capture: null };
  if (hit.closest('button:enabled') !== null) return null;
  const card = hit.closest('[data-place]');
  if (card !== null) {
    const place = card.getAttribute('data-place');
    if (place === 'column') return { target: 'column', capture: card };
    if (place === 'cell') {
      const cellEl = card.closest('[data-wordcell]');
      if (cellEl === null) throw new Error('AD-12 cell card outside [data-wordcell]');
      return { target: wordcellTarget(cellEl), capture: card };
    }
    if (place === 'tray' || place === 'strip') return { target: 'other', capture: card };
    throw new Error(`AD-12 unknown data-place ${place}`);
  }
  const mirror = hit.closest('[data-mirror-of]');
  if (mirror !== null && hit.closest('[data-band="tray"]') !== null) {
    return { target: 'other', capture: mirror };
  }
  const cellEl = hit.closest('[data-wordcell]');
  if (cellEl !== null) return { target: wordcellTarget(cellEl), capture: cellEl };
  if (hit.closest('[data-column]') !== null || hit.closest('[data-foot]') !== null) {
    return { target: 'column', capture: null };
  }
  return { target: 'other', capture: null };
}

export function createController<H>(gate: Gate, deps: ControllerDeps<H>): Controller {
  let root: HTMLElement | null = null;
  let press: Press<H> | null = null;
  /** The pointerId whose contextmenu stays suppressed after its captured press was cancelled. */
  let menuSlot: number | null = null;

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
    if (event.button !== 0 || root === null) return;
    if (press !== null) {
      if (event.pointerId !== press.pointerId) return;
      // A same-id pointerdown: the old press's end was lost.
      end({ kind: 'sameId' });
    }
    const resolved = resolve(root, deps.elementFromPoint(event.clientX, event.clientY));
    if (resolved === null) return;
    gate.enter();
    const p: Press<H> = {
      pointerId: event.pointerId,
      captured: resolved.capture,
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

  function pointerup(event: PointerEvent): void {
    if (own(event)) {
      end({ kind: 'up' });
      return;
    }
    if (event.pointerId === menuSlot) menuSlot = null;
  }

  function pointercancel(event: PointerEvent): void {
    if (own(event)) {
      end({ kind: 'pointercancel' });
      return;
    }
    if (event.pointerId === menuSlot) menuSlot = null;
  }

  function lostpointercapture(event: PointerEvent): void {
    const p = press;
    if (p === null || !own(event) || p.captured === null || event.target !== p.captured) return;
    end({ kind: 'lostCapture' });
  }

  function contextmenu(event: MouseEvent): void {
    if ((press !== null && press.captured !== null) || menuSlot !== null) event.preventDefault();
  }

  const handlers: Record<(typeof LISTENED)[number], (event: never) => void> = {
    pointerdown,
    pointermove,
    pointerup,
    pointercancel,
    lostpointercapture,
    contextmenu,
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
      root = null;
    };
  }

  return { cancel, attach };
}
