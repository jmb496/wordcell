// Free-letter origin tags (epic 5 SPEC CAP-1; DESIGN.md Tile; epic 5 build-notes CAP-1 Tags): the
// card a free letter took from WordCell `cell` is the top (`cards.at(-1)`, AD-3 `CellView.cards`
// bottom → top) of the `cells` entry whose `cell` field matches, looked up by that field, never by
// index. A missing or empty entry is a bug and throws one message through lookup.ts `found`
// (rule 6, epic 5 SPEC CAP-3).
import type { CardId, CellView, WordCellNumber } from '../../engine/index';
import { found } from '../gestures/lookup';

/** The top card of WordCell `cell` in `cells`; throws when the entry is missing or empty. */
export function originCard(cells: readonly CellView[], cell: WordCellNumber): CardId {
  return found(
    cells.find((entry) => entry.cell === cell)?.cards.at(-1),
    `origin tag: no top card in WordCell ${cell}`,
  );
}
