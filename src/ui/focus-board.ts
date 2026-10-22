// EXPERIENCE.md Focus (epic 6 CAP-10, 6.11): the single focus resolver. "The board" is the bottom
// card of the lowest-numbered non-empty column, or the focusable board container (`main`) when
// every column is empty, as after a win. Cards are Tab stops under the roving model (Card.svelte,
// roving.svelte.ts), so no card is made focusable here. Programmatic focus never scrolls: the
// layout anchors its own scroll (AD-11).
import type { CardId, GameView } from '../engine/index';
import { text } from './text';

const FOCUS = { preventScroll: true } as const;

export function focusBoard(): void {
  for (const column of document.querySelectorAll<HTMLElement>('[data-column]')) {
    const cards = column.querySelectorAll<HTMLElement>('[data-card-id][data-place="column"]');
    const bottom = cards.item(cards.length - 1);
    if (bottom === null) continue;
    bottom.focus(FOCUS);
    return;
  }
  document.querySelector<HTMLElement>('main')?.focus(FOCUS);
}

/**
 * Focus return to the ☰ button after a surface a Menu row opened closes (its opener row left with
 * the menu; open-surface.ts `takeMenuOrigin`). The button always exists on the active board, so its
 * absence is a bug (rule 6).
 */
export function focusMenuButton(): void {
  const button = document.querySelector<HTMLElement>(`button[aria-label="${text.menu}"]`);
  if (button === null) throw new Error('AD-13 focusMenuButton with no menu button');
  button.focus();
}

/** Focuses the live element of card `id` (a column card, tray tile or strip card). */
export function focusCard(id: CardId): boolean {
  const el = document.querySelector<HTMLElement>(`[data-card-id="${id}"]`);
  if (el === null || el.dataset.place === 'cell') return false;
  el.focus(FOCUS);
  return true;
}

/** Composing: the first movable tile (D-block mirrors carry no `data-place`); else the board. */
export function focusFirstTile(): void {
  const first = document.querySelector<HTMLElement>('[data-card-id][data-place="tray"]');
  if (first === null) focusBoard();
  else first.focus(FOCUS);
}

/** Place: the first strip card. */
export function focusFirstStrip(): void {
  const first = document.querySelector<HTMLElement>('[data-card-id][data-place="strip"]');
  if (first === null) focusBoard();
  else first.focus(FOCUS);
}

/**
 * EXPERIENCE.md Focus, the phase's focus target: Composing -> the first movable tile, Place -> the
 * first strip card, otherwise (Idle, a Game over) the board. Shared by focus-follow.ts, the end
 * sheet's Undo path (end-sheet.ts) and the History notice's close (App.svelte).
 */
export function focusByPhase(view: GameView): void {
  if (view.phase === 'composing') focusFirstTile();
  else if (view.phase === 'place') focusFirstStrip();
  else focusBoard();
}

/**
 * Key removal (EXPERIENCE.md Keyboard): the tile list before and after, the removed tile's index in
 * the first. The next tile (now at that index), the previous one if it was last, `null` (the board)
 * when none is left. `after` includes the tile itself when nothing was removed.
 */
export function afterRemoval(
  card: CardId,
  before: readonly CardId[],
  after: readonly CardId[],
): CardId | null {
  if (after.includes(card)) return card;
  const at = before.indexOf(card);
  if (at < 0) throw new Error(`AD-14 afterRemoval: card ${card} is not in the tile list`);
  return after[Math.min(at, after.length - 1)] ?? null;
}

/**
 * Focus loss without a phase change (Undo/Redo inside a phase, a pointer edit, `+`/`-`, Flip): the
 * next sibling of the lost item in its region, else the region's first item, else null (the
 * board). `order` is the region's item ids when the item last held focus, `now` its items now.
 */
export function afterLoss(
  lost: CardId,
  order: readonly CardId[],
  now: readonly CardId[],
): CardId | null {
  const at = order.indexOf(lost);
  for (const id of order.slice(at + 1)) if (now.includes(id)) return id;
  return now[0] ?? null;
}
