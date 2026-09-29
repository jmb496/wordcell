import { EngineError } from '../errors';
import { type CardId, DECK_SIZE, WORD_CELL_NUMBERS } from '../types';

/** One letter of a language: its card count in the deck and its letter value (R-85). */
export interface LangEntry {
  readonly letter: string;
  readonly count: number;
  readonly value: number;
}

/** Language data (R-85): deck letters per CardId, distribution, letter values, max score. */
export interface LangData {
  readonly id: string;
  /** Letter per CardId, 52 entries, expanded from `distribution` in entry order. */
  readonly letters: readonly string[];
  readonly distribution: readonly LangEntry[];
  /** Takes an uppercase glyph as in `letters` (e.g. `'QU'`); throws `lang-unknown-letter` otherwise. */
  readonly letterValue: (letter: string) => number;
  /** R-80 maximum score, derived: Σ count × value × the highest WordCell number. */
  readonly maxScore: number;
}

/** Internal constructor; throws `lang-deck-size` unless the counts sum to `DECK_SIZE`. */
export function makeLangData(id: string, entries: readonly LangEntry[]): LangData {
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  if (total !== DECK_SIZE)
    throw new EngineError(
      'lang-deck-size',
      `language ${id} has ${total} cards, expected ${DECK_SIZE}`,
    );
  const distribution = Object.freeze(entries.map((e) => Object.freeze({ ...e })));
  const letters = Object.freeze(
    distribution.flatMap((e) => Array.from({ length: e.count }, () => e.letter)),
  );
  const values = new Map(distribution.map((e) => [e.letter, e.value]));
  const letterValue = (letter: string): number => {
    const value = values.get(letter);
    if (value === undefined)
      throw new EngineError('lang-unknown-letter', `letter ${letter} is not in language ${id}`);
    return value;
  };
  const topCell = Math.max(...WORD_CELL_NUMBERS);
  const maxScore = distribution.reduce((sum, e) => sum + e.count * e.value * topCell, 0);
  return Object.freeze({ id, letters, distribution, letterValue, maxScore });
}

function assertCardId(card: CardId): void {
  if (!(Number.isInteger(card) && card >= 0 && card <= DECK_SIZE - 1))
    throw new EngineError('card-id-domain', `card ${card} is not a CardId 0–${DECK_SIZE - 1}`);
}

/** R-85 letters a card contributes (`QU` 2). */
export function letterCount(card: CardId, lang: LangData): number {
  assertCardId(card);
  return lang.letterValue(lang.letters[card]);
}

/** R-37 the card's lowercase string (`QU` → `qu`). */
export function spelling(card: CardId, lang: LangData): string {
  assertCardId(card);
  return lang.letters[card].toLowerCase();
}
