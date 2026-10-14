// AD-12 press resolution (F23, epic 4 build-notes CAP-4), split from controller.ts (epic 5
// retrospective A1): the element under the press point to a `PressTarget`, a capture element and a
// `Hit`.
import { game } from '../../shell/game.svelte';
import type { Resolved } from './drag-types';
import type { Hit } from './intent';
import { attribute, cellIn, found } from './lookup';

export const OUTSIDE: Hit = { kind: 'outside' };

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
export function resolve(
  root: HTMLElement,
  hit: Element | null,
  selected: boolean,
): Resolved | null {
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
