import { type Card, COLUMN_COUNT, DECK_SIZE, ENGLISH_DISTRIBUTION, type Letter } from './types';

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
  const cards: Card[] = [];
  for (const [letter, count] of Object.entries(ENGLISH_DISTRIBUTION) as [Letter, number][]) {
    for (let i = 0; i < count; i++) cards.push({ id: cards.length, letter });
  }
  if (cards.length !== DECK_SIZE)
    throw new Error(`deck has ${cards.length} cards, expected ${DECK_SIZE}`);
  return cards;
}

/** Fisher–Yates shuffle driven by the seeded PRNG. */
export function shuffle(cards: readonly Card[], seed: number): Card[] {
  const rng = mulberry32(seed);
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deal the shuffled deck round-robin into 8 columns, FreeCell style.
 * Columns 1–4 receive 7 cards, columns 5–8 receive 6. Index 0 of each column is the top
 * (covered) card; the last index is the exposed bottom card.
 */
export function deal(seed: number): Card[][] {
  const deck = shuffle(buildDeck(), seed);
  const columns: Card[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  for (const [i, card] of deck.entries()) columns[i % COLUMN_COUNT].push(card);
  return columns;
}
