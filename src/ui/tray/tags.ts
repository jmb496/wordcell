// Epic 5 entry 1 free-letter origin tags (DESIGN.md Tile; build-notes CAP-1 Tags): the card a free
// letter took from WordCell `cell` is the top (`cards.at(-1)`, AD-3 `CellView.cards` bottom → top)
// of the `cells` entry whose `cell` field matches, looked up by that field, never by index. A miss
// is a bug and throws (rule 6). Entry 4 folds this into the shared lookup helper.
import type { CardId, CellView, WordCellNumber } from '../../engine/index';

/** The top card of WordCell `cell` in `cells`; throws when the entry is missing or empty. */
export function originCard(cells: readonly CellView[], cell: WordCellNumber): CardId {
  const top = cells.find((entry) => entry.cell === cell)?.cards.at(-1);
  if (top === undefined) throw new Error(`origin tag: no top card in WordCell ${cell}`);
  return top;
}
