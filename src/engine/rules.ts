import { EngineError } from './errors';
import { type LangData, letterCount, spelling } from './lang/lang-data';
import type { DestinationSide, Move, Reached } from './session';
import { type CardId, MIN_WORD_LENGTH, WORD_CELL_NUMBERS, type WordCellNumber } from './types';

/**
 * A tableau position (§2). `columns[0]` is column 1, each top → bottom;
 * `cells[0]` is WordCell 3 … `cells[7]` WordCell 10, each bottom → top.
 */
export interface Position {
  readonly columns: readonly (readonly CardId[])[];
  readonly cells: readonly (readonly CardId[])[];
}

/** A move whose Place fields are present (`reached` ≥ place, guaranteed by `checkSession`). */
export type PlacedMove = Move & {
  readonly targetCell: WordCellNumber;
  readonly placementOrder: readonly CardId[];
};

const RANK: Readonly<Record<Reached, number>> = { composing: 1, place: 2, committed: 3 };

/** True when `reached` is at least `phase` in the order composing < place < committed. */
export function reachedAtLeast(reached: Reached, phase: Reached): boolean {
  return RANK[reached] >= RANK[phase];
}

/** Narrows a move `checkSession` has shown to carry its Place fields. */
export function placed(move: Move): PlacedMove {
  return move as PlacedMove;
}

const cellIndex = (cell: WordCellNumber): number => cell - WORD_CELL_NUMBERS[0];

function fail(check: string, index: number, rule: string, detail: string): never {
  throw new EngineError(check, `move ${index}: ${rule} ${detail}`);
}

function isPermutation(a: readonly CardId[], b: readonly CardId[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort((p, q) => p - q);
  const y = [...b].sort((p, q) => p - q);
  return x.every((card, i) => card === y[i]);
}

/** R-10: S, the bottom `sourceCount` cards of the source column, unchecked (R-13). */
export function sourceCards(position: Position, move: Move): readonly CardId[] {
  const column = position.columns[move.sourceColumn - 1];
  return column.slice(column.length - move.sourceCount);
}

/** R-10, R-13 predicate: `sourceCount` lies in 1…the source column's size. */
export function sourceCountAllowed(
  position: Position,
  move: Pick<Move, 'sourceColumn' | 'sourceCount'>,
): boolean {
  const column = position.columns[move.sourceColumn - 1];
  return move.sourceCount >= 1 && move.sourceCount <= column.length;
}

/** R-10, R-13: S is the bottom 1…column-size cards of the source column. */
export function checkSourceCount(position: Position, move: Move, index: number): readonly CardId[] {
  const column = position.columns[move.sourceColumn - 1];
  if (!sourceCountAllowed(position, move))
    fail(
      'r13-source-count',
      index,
      'R-13',
      `sourceCount ${move.sourceCount} outside 1…${column.length}`,
    );
  return sourceCards(position, move);
}

/** The destination column after R-21 (S removed when it is the source column). */
export function destinationRemainder(position: Position, move: Move): readonly CardId[] {
  const column = position.columns[move.destinationColumn - 1];
  return move.destinationColumn === move.sourceColumn
    ? column.slice(0, column.length - move.sourceCount)
    : column;
}

/** R-31 predicate over the remainder size n: k = 0 iff n = 0, else k in 1…n. */
export function destinationCountAllowed(n: number, k: number): boolean {
  return n === 0 ? k === 0 : k >= 1 && k <= n;
}

/**
 * R-31 tap mapping: tapping `card` of the destination remainder (top → bottom) makes it the
 * top of D; tapping the current top gives k − 1, min 1. `card` must be in `remainder`.
 */
export function tapDestinationCount(remainder: readonly CardId[], card: CardId, k: number): number {
  const tapped = remainder.length - remainder.indexOf(card);
  return tapped === k ? Math.max(1, k - 1) : tapped;
}

/** R-30, R-31 flip: the side toggles; at k = 0 it stays left (the flip no-op). */
export function flippedSide(move: Move): DestinationSide {
  return move.destinationCount === 0 || move.destinationSide === 'right' ? 'left' : 'right';
}

/** R-31 (R-21, R-22): k = 0 iff the destination is empty after R-21, else 1…n. */
export function checkDestinationCount(
  position: Position,
  move: Move,
  index: number,
): readonly CardId[] {
  const remainder = destinationRemainder(position, move);
  const n = remainder.length;
  const k = move.destinationCount;
  if (!destinationCountAllowed(n, k))
    fail(
      'r31-destination-count',
      index,
      'R-31',
      `destinationCount ${k} outside ${n === 0 ? '0…0' : `1…${n}`}`,
    );
  return remainder.slice(n - k);
}

/** R-33: no WordCell listed twice. */
export function checkFreeLetterDuplicate(move: Move, index: number): void {
  if (new Set(move.freeLetters).size !== move.freeLetters.length)
    fail(
      'r33-free-letter-duplicate',
      index,
      'R-33',
      `freeLetters ${move.freeLetters} repeat a cell`,
    );
}

/** R-33 predicate: WordCell `cell` has a top card. */
export function cellHasTop(position: Position, cell: WordCellNumber): boolean {
  return position.cells[cellIndex(cell)].length > 0;
}

/** R-33: every listed WordCell has a top card. */
export function checkFreeLetterEmpty(position: Position, move: Move, index: number): void {
  for (const cell of move.freeLetters)
    if (!cellHasTop(position, cell))
      fail('r33-free-letter-empty', index, 'R-33', `free-letter WordCell ${cell} is empty`);
}

/** The top cards of the listed WordCells, in list order (the free letters F, R-33). */
export function freeCards(
  position: Position,
  freeLetters: readonly WordCellNumber[],
): readonly CardId[] {
  return freeLetters.map((cell) => {
    const stack = position.cells[cellIndex(cell)];
    return stack[stack.length - 1];
  });
}

/** §2: the listed cells' top cards equal, as a set, the `arrangement` cards not in S. */
function checkFreeLettersSet(
  position: Position,
  move: Move,
  source: readonly CardId[],
  index: number,
): readonly CardId[] {
  const free = freeCards(position, move.freeLetters);
  const freeSet = new Set(free);
  const others = new Set(move.arrangement.filter((card) => !source.includes(card)));
  if (others.size !== freeSet.size || [...others].some((card) => !freeSet.has(card)))
    fail(
      's2-free-letters-set',
      index,
      '§2',
      'freeLetters tops differ from the arrangement cards not in S',
    );
  return free;
}

/** R-35 (R-34): `arrangement` is a permutation of S ∪ F. */
export function checkArrangement(
  move: Move,
  source: readonly CardId[],
  free: readonly CardId[],
  index: number,
): void {
  if (!isPermutation(move.arrangement, [...source, ...free]))
    fail('r35-arrangement', index, 'R-35', 'arrangement is not a permutation of S ∪ F');
}

/** R-85: the letter count of `cards` (`QU` 2); L of R-40 for a word's cards. */
export function wordLetterCount(cards: readonly CardId[], lang: LangData): number {
  return cards.reduce((sum, card) => sum + letterCount(card, lang), 0);
}

/** R-36 predicate: a letter count of at least `MIN_WORD_LENGTH`. */
export function letterCountAllowed(count: number): boolean {
  return count >= MIN_WORD_LENGTH;
}

/** R-36: the word's letter count is at least `MIN_WORD_LENGTH`; returns it (L of R-40). */
export function checkLetterCount(word: readonly CardId[], lang: LangData, index: number): number {
  const count = wordLetterCount(word, lang);
  if (!letterCountAllowed(count))
    fail('r36-letter-count', index, 'R-36', `letter count ${count} below ${MIN_WORD_LENGTH}`);
  return count;
}

/** R-40 (R-41) predicate: `cell` ≤ the word's letter count L. */
export function targetCellAllowed(cell: WordCellNumber, count: number): boolean {
  return cell <= count;
}

/** R-40 (R-41): `targetCell` ≤ the word's letter count. */
export function checkTargetCell(move: PlacedMove, count: number, index: number): void {
  if (!targetCellAllowed(move.targetCell, count))
    fail(
      'r40-target-cell',
      index,
      'R-40',
      `targetCell ${move.targetCell} above letter count ${count}`,
    );
}

/** R-50: `placementOrder` is a permutation of S ∪ F ∪ D. */
export function checkPlacementOrder(
  move: PlacedMove,
  word: readonly CardId[],
  index: number,
): void {
  if (!isPermutation(move.placementOrder, word))
    fail('r50-placement-order', index, 'R-50', 'placementOrder is not a permutation of S ∪ F ∪ D');
}

/** R-31: `card` is in the destination column after R-21. */
export function inDestination(position: Position, move: Move, card: CardId): boolean {
  return destinationRemainder(position, move).includes(card);
}

/** R-33 (Q-31): an insertion index into M lies in 0…|M|, |M| = `arrangement.length`. */
export function freeLetterIndexInRange(move: Move, index: number): boolean {
  return index >= 0 && index <= move.arrangement.length;
}

/** R-33: `cell` is one of the draft's free-letter WordCells. */
export function hasFreeLetter(move: Move, cell: WordCellNumber): boolean {
  return move.freeLetters.includes(cell);
}

function sameCards(a: readonly number[] | undefined, b: readonly number[] | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return a.length === b.length && a.every((card, i) => card === b[i]);
}

/** AD-2 no-op by value: the §2 data fields equal element by element (`reached` excluded). */
export function sameDraftData(a: Move, b: Move): boolean {
  return (
    a.sourceColumn === b.sourceColumn &&
    a.sourceCount === b.sourceCount &&
    a.destinationColumn === b.destinationColumn &&
    a.destinationCount === b.destinationCount &&
    a.destinationSide === b.destinationSide &&
    sameCards(a.freeLetters, b.freeLetters) &&
    sameCards(a.arrangement, b.arrangement) &&
    a.targetCell === b.targetCell &&
    sameCards(a.placementOrder, b.placementOrder)
  );
}

/**
 * R-30: the word of a replay-valid move from `position` (the committed prefix): D top → bottom
 * then M when `destinationSide` is left; M then D reversed by card when right. The string is
 * R-37's lowercase spelling.
 */
export function word(
  position: Position,
  move: Move,
  lang: LangData,
): { readonly cards: readonly CardId[]; readonly spelling: string } {
  const remainder = destinationRemainder(position, move);
  const destination = remainder.slice(remainder.length - move.destinationCount);
  const cards =
    move.destinationSide === 'left'
      ? [...destination, ...move.arrangement]
      : [...move.arrangement, ...[...destination].reverse()];
  return { cards, spelling: cards.map((card) => spelling(card, lang)).join('') };
}

/**
 * Checks `move` (at `moves[index]`) from `position` against the rules of its `reached` state
 * (§2), in the errors.ts per-move order; the first violation throws. Inputs are schema-valid
 * (engine-produced, or passed by `parseSession`'s §2 schema stage); replay adds no type or
 * domain check.
 */
export function checkMove(position: Position, move: Move, index: number, lang: LangData): void {
  const source = checkSourceCount(position, move, index);
  const destination = checkDestinationCount(position, move, index);
  checkFreeLetterDuplicate(move, index);
  checkFreeLetterEmpty(position, move, index);
  const free = checkFreeLettersSet(position, move, source, index);
  checkArrangement(move, source, free, index);
  if (!reachedAtLeast(move.reached, 'place')) return;
  const word = [...source, ...free, ...destination];
  const count = checkLetterCount(word, lang, index);
  checkTargetCell(placed(move), count, index);
  checkPlacementOrder(placed(move), word, index);
}

/**
 * The commit's position effect (R-60, R-61, R-52): remove S, then D from the remainder, then
 * each used free letter's top, then push `placementOrder` onto the target. Returns new arrays.
 */
export function commitMove(position: Position, move: PlacedMove): Position {
  const columns = position.columns.map((column) => [...column]);
  const cells = position.cells.map((cell) => [...cell]);
  const source = columns[move.sourceColumn - 1];
  source.splice(source.length - move.sourceCount);
  const destination = columns[move.destinationColumn - 1];
  destination.splice(destination.length - move.destinationCount);
  for (const cell of move.freeLetters) cells[cellIndex(cell)].pop();
  cells[cellIndex(move.targetCell)].push(...move.placementOrder);
  return { columns, cells };
}
