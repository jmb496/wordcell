// Epic 6 CAP-10 (6.11, EXPERIENCE.md Focus): the roving-focus memory. Each non-empty column and
// the tray/strip is one Tab stop; its `tabindex` 0 sits on the last-focused live item, else on the
// region's fallback (a column's bottom card, the first tile). The only state is the last-focused
// card per region, set by a card's `focus` event (a key tail selection sets the tail's top card by
// focusing it). Never a game state (AD-3): the components validate it against the live items.
import type { CardId } from '../engine/index';

let columns = $state.raw<Readonly<Record<number, CardId>>>({});
let tile = $state.raw<CardId | null>(null);

export const roving = {
  /** The last-focused card of column `n`, if any. */
  column(n: number): CardId | undefined {
    return columns[n];
  },
  /** The last-focused tray or strip tile, if any. */
  get tile(): CardId | null {
    return tile;
  },
  focusedColumn(n: number, card: CardId): void {
    if (columns[n] !== card) columns = { ...columns, [n]: card };
  },
  focusedTile(card: CardId): void {
    tile = card;
  },
  reset(): void {
    columns = {};
    tile = null;
  },
};
