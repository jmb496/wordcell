import { describe, expect, it } from 'vitest';
import { EngineError } from '../errors';
import { EN } from './en';
import { letterCount, makeLangData, spelling } from './lang-data';

const QU = EN.letters.indexOf('QU');
const OUT_OF_DOMAIN = [-1, 52, 1.5, Number.NaN];

function expectEngineError(fn: () => unknown, check: string): void {
  let thrown: unknown;
  try {
    fn();
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(EngineError);
  expect((thrown as EngineError).check).toBe(check);
}

function withEntry(letter: string, change: { count?: number; value?: number }) {
  return EN.distribution.map((e) => (e.letter === letter ? { ...e, ...change } : { ...e }));
}

describe('LangData', () => {
  it('R-85 letterCount is 2 for QU, 1 otherwise', () => {
    expect(letterCount(QU, EN)).toBe(2);
    expect(letterCount(0, EN)).toBe(1);
    expect(letterCount(51, EN)).toBe(1);
  });

  it('R-85 letterCount throws outside CardId 0–51', () => {
    for (const card of OUT_OF_DOMAIN)
      expectEngineError(() => letterCount(card, EN), 'card-id-domain');
  });

  it('R-85 Σ letterCount over the deck is 53', () => {
    const total = EN.letters.reduce((sum, _, card) => sum + letterCount(card, EN), 0);
    expect(total).toBe(53);
  });

  it('R-80 EN.maxScore is 530', () => {
    expect(EN.maxScore).toBe(530);
  });

  it('R-85 constructor throws unless counts sum to 52', () => {
    expectEngineError(() => makeLangData('bad', withEntry('A', { count: 2 })), 'lang-deck-size');
    expectEngineError(() => makeLangData('bad', withEntry('A', { count: 4 })), 'lang-deck-size');
    const synthetic = makeLangData('synthetic', withEntry('Z', { value: 2 }));
    expect(synthetic.maxScore).toBe(540);
    expect(letterCount(51, synthetic)).toBe(2);
    expect(
      [synthetic, synthetic.letters, synthetic.distribution, ...synthetic.distribution].every(
        Object.isFrozen,
      ),
    ).toBe(true);
  });

  it('R-85 letterValue throws for a letter not in the language', () => {
    expectEngineError(() => EN.letterValue('Ä'), 'lang-unknown-letter');
  });

  it('R-85 EN, its letters, distribution and entries are frozen', () => {
    expect([EN, EN.letters, EN.distribution, ...EN.distribution].every(Object.isFrozen)).toBe(true);
  });

  it('R-37 spelling lowercases, QU as qu', () => {
    expect(spelling(QU, EN)).toBe('qu');
    expect(spelling(0, EN)).toBe('a');
    for (const card of OUT_OF_DOMAIN) expectEngineError(() => spelling(card, EN), 'card-id-domain');
  });
});
