/**
 * Expect-free helpers shared by the `src/engine/*.test.ts` files (byte-identical copies moved here;
 * copies that differ stay local). Imported only by engine tests; exercised by its importers.
 */
import { type ApplyContext, apply, type Command } from './commands';
import { EN } from './lang/en';
import type { Start } from './replay';
import type { Move, Session } from './session';
import type { CardId, WordCellNumber } from './types';

export function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
    const object = value as object;
    if (seen.has(object)) return value;
    seen.add(object);
    for (const key of Reflect.ownKeys(object))
      deepFreeze((object as Record<PropertyKey, unknown>)[key], seen);
    Object.freeze(object);
  }
  return value;
}

export type Eight<T> = [T, T, T, T, T, T, T, T];

/**
 * A D2 Start from letter strings: columns top → bottom (column 1 first), cells bottom → top.
 * Each letter takes the lowest free CardId for it; `'Q'` is the QU card.
 */
export function startOf(
  columns: readonly string[],
  cells: Partial<Record<WordCellNumber, string>> = {},
): Start {
  const used = new Set<CardId>();
  const take = (ch: string): CardId => {
    const letter = ch === 'Q' ? 'QU' : ch;
    const id = EN.letters.findIndex((l, i) => l === letter && !used.has(i));
    if (id < 0) throw new Error(`no free card for ${letter}`);
    used.add(id);
    return id;
  };
  const cols = Array.from({ length: 8 }, (_, i) => [...(columns[i] ?? '')].map(take));
  const cellStacks = Array.from({ length: 8 }, (_, i) =>
    [...(cells[(i + 3) as WordCellNumber] ?? '')].map(take),
  );
  return deepFreeze({
    columns: cols as Eight<CardId[]>,
    cells: cellStacks as Eight<CardId[]>,
  });
}

/** A frozen ctx with an inline dictionary (build-notes CAP-4). */
export const DICT = (...words: string[]): ApplyContext =>
  deepFreeze({ lang: EN, dictionary: new Set(words) });

/** Public `apply` of each command in turn, every input and result deep-frozen. */
export function play(
  session: Session,
  commands: readonly Command[],
  words: string[] = [],
): Session {
  const ctx = DICT(...words);
  let current = deepFreeze(session);
  for (const command of commands)
    current = deepFreeze(apply(current, deepFreeze(command), ctx).session);
  return current;
}

export const drop = (
  sourceColumn: number,
  sourceCount: number,
  destinationColumn: number,
): Command => ({
  type: 'drop',
  sourceColumn,
  sourceCount,
  destinationColumn,
});

/** The draft of a Composing Session. */
export const draftOf = (session: Session): Move => session.moves[session.cursor.index];
