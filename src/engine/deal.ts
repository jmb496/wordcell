import { EN } from './lang/en';
import { type Card, type CardId, COLUMN_COUNT, DECK_SIZE } from './types';

/**
 * Deterministic 32-bit PRNG (mulberry32). Same seed → same deal on every device, which is
 * what makes event-sourced undo, persistence and test fixtures possible.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The unshuffled deck in a fixed canonical order (ids 0..51). */
export function buildDeck(): Card[] {
  return Array.from({ length: DECK_SIZE }, (_, id) => ({ id, letter: EN.letters[id] }));
}

/** Fisher–Yates shuffle driven by the seeded PRNG. */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deal the shuffled CardIds 0–51 round-robin into 8 columns, FreeCell style (R-03).
 * Columns 1–4 receive 7 cards, columns 5–8 receive 6. Index 0 of each column is the top
 * (covered) card; the last index is the exposed bottom card. Internal (D2, CAP-3).
 */
export function dealIds(seed: number): CardId[][] {
  const deck = shuffle(
    buildDeck().map((card) => card.id),
    seed,
  );
  const columns: CardId[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  for (const [i, id] of deck.entries()) columns[i % COLUMN_COUNT].push(id);
  return columns;
}

/** Test helper: `dealIds` with EN letters (R-03 tests). */
export function deal(seed: number): Card[][] {
  return dealIds(seed).map((col) => col.map((id) => ({ id, letter: EN.letters[id] })));
}
