import type { SceneStageInputs } from '../layout/geometry';
import { COLUMNS, fillerCount, liftedBy, TRAY_ROWS } from './geometry';
import type { Carry, Frame, SceneFixtureData } from './types';

/** A static card's face from a scene letter (QU counts two letters, R-36). */
export const face = (letter: string) => ({ letter, letterCount: letter === 'QU' ? 2 : 1 });

// Epic 8 ticket 6 (HP-1, HP-6): the filler cards of the shared stage. A column shows at least
// `MIN_COLUMN_CARDS` cards: its scripted cards sit under filler added at the far (top) end, so the
// tail and the bottom cards keep their order. Filler needs no CardId and is in no fixture (the HP-5
// engine replay is unchanged). The letters come from this fixed sequence, no randomness: column 1's
// filler first, then column 2's, and so on, each filler card taking the next letter in turn. The order
// is chosen so that no row of any scene's board reads a blocklisted word, plain or as the 20 px strip
// clips it (E looks like F, G like C; owner decision D1, 2026-10-22; stage.test.ts).
export const FILLER_LETTERS = 'RSTLNAEIODUCMPHGBYFWK';

/**
 * The filler letters of each of the stage's eight columns, far end first, for columns that start
 * with `lengths[i]` scripted cards (a column the scene does not list has none).
 */
export function fillerColumns(lengths: readonly number[]): string[][] {
  let next = 0;
  return Array.from({ length: COLUMNS }, (_, column) =>
    Array.from({ length: fillerCount(lengths[column] ?? 0) }, () => {
      const letter = FILLER_LETTERS[next % FILLER_LETTERS.length];
      next++;
      return letter;
    }),
  );
}

/**
 * The inline base style of card `j` of a growing stack of `cards` (epic 8 ticket 9, HP-1): every
 * card but the top is hidden, and the top card sits collapsed at the stack's top. It equals the
 * first keyframe of the card's grow effect (effects.ts), so cancelling the animations restores it.
 */
export const growBase = (cards: number, j: number): { opacity?: 0; transform?: string } =>
  j < cards - 1 ? { opacity: 0 } : { transform: liftedBy(cards - 1) };

/**
 * The columns a scene draws (scripted cards only, far end first): the fixture start, but the
 * source column without the lifted tail and the destination column without its D block (R-21 for a
 * drop on the source column). A scene without a carry draws none.
 */
export function drawnColumns(
  fixture: SceneFixtureData,
  carry: Carry | undefined,
): readonly (readonly string[])[] {
  if (carry === undefined) return [];
  const all = fixture.start.columns;
  const source = all[carry.sourceColumn - 1];
  const left = source.slice(0, source.length - carry.count);
  const destCards = destinationCards(fixture, carry);
  const destFrom = destCards.length - carry.destinationCount;
  return all.map((cards, i) => {
    if (i + 1 === carry.sourceColumn && carry.sourceColumn !== carry.destinationColumn) return left;
    if (i + 1 === carry.destinationColumn) return destCards.slice(0, destFrom);
    return cards;
  });
}

/**
 * The destination column's cards as the drop finds them (far end first): the fixture start column,
 * or, for a drop on the source column (R-21), what the lift left behind.
 */
export function destinationCards(fixture: SceneFixtureData, carry: Carry): readonly string[] {
  const all = fixture.start.columns;
  const source = all[carry.sourceColumn - 1];
  return carry.sourceColumn === carry.destinationColumn
    ? source.slice(0, source.length - carry.count)
    : all[carry.destinationColumn - 1];
}

/**
 * Owner decision D10 (2026-10-22; R-31): the destination column's cards that join the D block when
 * a frame's k exceeds the drop's count. `depth` counts up from the column's last card (0); the card
 * at depth d is in the D block, so not drawn in its column, in a frame whose k exceeds d
 * (`joinHidden`). `index` is its place in its drawn column (`drawnColumns`); its element is
 * `join-<depth>`. Absent for a scene that draws no column move.
 */
export function joinCards(
  fixture: SceneFixtureData,
  carry: Carry | undefined,
  frames: readonly Frame[],
): { readonly column: number; readonly cards: readonly { index: number; depth: number }[] } {
  if (carry === undefined) return { column: 0, cards: [] };
  const deepest = Math.max(carry.destinationCount, ...frames.map((f) => f.k ?? 0));
  const length = destinationCards(fixture, carry).length;
  return {
    column: carry.destinationColumn,
    cards: Array.from({ length: deepest - carry.destinationCount }, (_, i) => {
      const depth = carry.destinationCount + i;
      return { index: length - 1 - depth, depth };
    }),
  };
}

/** Whether the destination card at `depth` is in frame `frame`'s D block, not in its column (D10). */
export const joinHidden = (frame: Frame, depth: number): boolean => (frame.k ?? 0) > depth;

/** The scene's stage inputs, from its own data: the tallest column and WordCell stack it draws. */
export function sceneStageInputs(
  fixture: SceneFixtureData,
  carry: Carry | undefined,
  frames: readonly Frame[],
): SceneStageInputs {
  const lengths = carry === undefined ? [] : fixture.start.columns.map((c) => c.length);
  const drawn = drawnColumns(fixture, carry);
  const heights = Array.from(
    { length: COLUMNS },
    (_, i) => fillerCount(lengths[i] ?? 0) + (drawn[i]?.length ?? 0),
  );
  if (carry !== undefined && carry.landed !== true) {
    // The lifted tail stays over its source column; it lands on the destination column's end.
    const filler = (column: number) => fillerCount(lengths[column - 1]);
    const source = filler(carry.sourceColumn) + lengths[carry.sourceColumn - 1];
    const same = carry.sourceColumn === carry.destinationColumn;
    heights.push(
      source,
      same
        ? source
        : filler(carry.destinationColumn) + lengths[carry.destinationColumn - 1] + carry.count,
    );
  }
  // A last frame that draws WordCells as one top card (R-52) shows no stated stack.
  const stated = frames.at(-1)?.cellTop === true ? [] : (fixture.cells ?? []).map((e) => e.cards);
  const starts = Object.values(fixture.start.cells ?? {});
  return {
    columnCards: Math.max(...heights),
    trayRows: TRAY_ROWS,
    cellCards: Math.max(1, ...stated.map((c) => c.length), ...starts.map((c) => c.length)),
  };
}
