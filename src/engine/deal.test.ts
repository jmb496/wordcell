import { describe, expect, it } from 'vitest';
import { buildDeck, deal, shuffle } from './deal';
import { DECK_SIZE, ENGLISH_DISTRIBUTION } from './types';

describe('deck', () => {
  it('has 52 cards matching the English distribution', () => {
    const deck = buildDeck();
    expect(deck).toHaveLength(DECK_SIZE);
    const counts = new Map<string, number>();
    for (const c of deck) counts.set(c.letter, (counts.get(c.letter) ?? 0) + 1);
    for (const [letter, n] of Object.entries(ENGLISH_DISTRIBUTION))
      expect(counts.get(letter)).toBe(n);
  });

  it('shuffles deterministically for a given seed', () => {
    const a = shuffle(buildDeck(), 12345).map((c) => c.id);
    const b = shuffle(buildDeck(), 12345).map((c) => c.id);
    const c = shuffle(buildDeck(), 54321).map((c) => c.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('deal', () => {
  it('gives columns 1–4 seven cards and columns 5–8 six cards', () => {
    const columns = deal(1);
    expect(columns.map((c) => c.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6]);
  });

  it('uses every card exactly once', () => {
    const ids = deal(99)
      .flat()
      .map((c) => c.id)
      .sort((x, y) => x - y);
    expect(ids).toEqual(Array.from({ length: DECK_SIZE }, (_, i) => i));
  });
});
