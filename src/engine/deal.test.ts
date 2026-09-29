import { describe, expect, it } from 'vitest';
import { buildDeck, deal, shuffle } from './deal';
import { EN } from './lang/en';
import { DECK_SIZE } from './types';

// AD-5 golden literals, generated once from HEAD's deal.ts; never edit, only repoint the calls.
const GOLDEN_COLUMNS_SEED_1 = [
  [24, 6, 49, 30, 25, 20, 48],
  [44, 29, 33, 7, 47, 19, 26],
  [23, 35, 8, 21, 2, 42, 0],
  [10, 22, 14, 16, 17, 18, 32],
  [43, 40, 4, 12, 39, 51],
  [31, 34, 27, 1, 9, 28],
  [50, 11, 45, 36, 15, 13],
  [41, 3, 38, 37, 5, 46],
];
const GOLDEN_COLUMNS_SEED_MAX = [
  [33, 48, 30, 6, 12, 7, 51],
  [1, 22, 41, 39, 4, 36, 35],
  [45, 15, 8, 2, 3, 42, 9],
  [14, 19, 44, 34, 32, 5, 46],
  [16, 17, 43, 24, 27, 21],
  [49, 26, 10, 23, 18, 31],
  [20, 50, 0, 38, 28, 25],
  [11, 37, 47, 29, 13, 40],
];
const GOLDEN_LETTERS = [
  'A',
  'A',
  'A',
  'B',
  'C',
  'C',
  'D',
  'D',
  'E',
  'E',
  'E',
  'E',
  'F',
  'F',
  'G',
  'H',
  'H',
  'H',
  'I',
  'I',
  'I',
  'J',
  'K',
  'L',
  'L',
  'M',
  'M',
  'N',
  'N',
  'N',
  'O',
  'O',
  'O',
  'P',
  'P',
  'QU',
  'R',
  'R',
  'R',
  'S',
  'S',
  'S',
  'T',
  'T',
  'T',
  'U',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

describe('deck', () => {
  it('R-01 deck has 52 cards matching the English distribution', () => {
    const deck = buildDeck();
    expect(deck).toHaveLength(DECK_SIZE);
    const counts = new Map<string, number>();
    for (const c of deck) counts.set(c.letter, (counts.get(c.letter) ?? 0) + 1);
    for (const { letter, count } of EN.distribution) expect(counts.get(letter)).toBe(count);
    expect(buildDeck().map((c) => c.letter)).toEqual(EN.letters);
    const goldenCounts = new Map<string, number>();
    for (const letter of GOLDEN_LETTERS)
      goldenCounts.set(letter, (goldenCounts.get(letter) ?? 0) + 1);
    expect(counts).toEqual(goldenCounts);
  });

  it('R-02 same seed, same shuffle; different seeds differ', () => {
    const a = shuffle(buildDeck(), 12345).map((c) => c.id);
    const b = shuffle(buildDeck(), 12345).map((c) => c.id);
    const c = shuffle(buildDeck(), 54321).map((c) => c.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('deal', () => {
  it('R-03 columns 1–4 hold 7 cards, columns 5–8 hold 6', () => {
    const columns = deal(1);
    expect(columns.map((c) => c.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6]);
  });

  it('R-03 every card dealt once', () => {
    const ids = deal(99)
      .flat()
      .map((c) => c.id)
      .sort((x, y) => x - y);
    expect(ids).toEqual(Array.from({ length: DECK_SIZE }, (_, i) => i));
  });

  it('R-02 golden deal: seeds 1 and 4294967295', () => {
    const seed1 = deal(1).map((col) => col.map((c) => c.id));
    const seedMax = deal(4294967295).map((col) => col.map((c) => c.id));
    const letters = EN.letters;
    expect({ seed1, seedMax, letters }).toEqual({
      seed1: GOLDEN_COLUMNS_SEED_1,
      seedMax: GOLDEN_COLUMNS_SEED_MAX,
      letters: GOLDEN_LETTERS,
    });
  });

  it('R-03 deals round-robin, first dealt is the column top', () => {
    for (const seed of [1, 4294967295]) {
      const columns = deal(seed);
      const shuffled = shuffle(buildDeck(), seed);
      for (let i = 0; i < DECK_SIZE; i++)
        expect(columns[i % 8][Math.floor(i / 8)].id).toBe(shuffled[i].id);
    }
  });
});
