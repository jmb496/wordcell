import { describe, expect, it } from 'vitest';
import { text } from './text';

// AD-13 History notice catalogue (EXPERIENCE.md message catalogue rows 102, 104).
describe('AD-13 history notice text', () => {
  it('AD-13 the unknown-version sentence given 7 names version 7', () => {
    expect(text.historyVersionUnknown(7)).toBe(
      "It uses format version 7, which this version can't read.",
    );
  });

  it('AD-13 the contents-unreadable sentence given 7 names version 7', () => {
    expect(text.historyContentsUnreadable(7)).toBe(
      "It uses format version 7 but its contents can't be read.",
    );
  });
});

describe('AD-8 dictionary text', () => {
  it('AD-8 invalidWord uppercases the engine spelling', () => {
    expect(text.invalidWord('tan')).toBe("TAN isn't in the word list.");
    expect(text.invalidWord('quit')).toBe("QUIT isn't in the word list.");
  });

  it('AD-8 the loading label ends in U+2026', () => {
    expect(text.loadingWords).toBe('Loading words\u2026');
  });
});

describe('AD-3 score text', () => {
  it('AD-3 score(0) reads Score 0', () => {
    expect(text.score(0)).toBe('Score 0');
  });

  it('AD-3 score(355) reads Score 355', () => {
    expect(text.score(355)).toBe('Score 355');
  });

  it('AD-3 score(-530) reads Score \u2212530 with U+2212', () => {
    expect(text.score(-530)).toBe('Score \u2212530');
  });
});

describe('AD-13 F27 WordCell view text', () => {
  it('AD-13 F27 view title at 7 cards', () => {
    expect(text.viewTitle(6, 7)).toBe('WordCell 6 \u00b7 7 cards');
  });

  it('AD-13 F27 view title at 1 card', () => {
    expect(text.viewTitle(6, 1)).toBe('WordCell 6 \u00b7 1 card');
  });

  it('AD-13 F27 viewTop reads top', () => {
    expect(text.viewTop).toBe('top');
  });

  it('AD-13 F27 olderCards(1) reads +1 older card', () => {
    expect(text.olderCards(1)).toBe('+1 older card');
  });

  it('AD-13 F27 olderCards(10) reads +10 older cards', () => {
    expect(text.olderCards(10)).toBe('+10 older cards');
  });
});

describe('AD-3 tray text', () => {
  it('AD-3 letters(1) reads 1 letter', () => {
    expect(text.letters(1)).toBe('1 letter');
  });

  it('AD-3 letters(5) reads 5 letters', () => {
    expect(text.letters(5)).toBe('5 letters');
  });

  it('AD-3 the invalid-word split rejoins with one space to invalidWord', () => {
    expect(text.invalidWordSuffix).toBe("isn't in the word list.");
    for (const word of ['tan', 'quit']) {
      const [upper, suffix] = text.invalidWordParts(word);
      expect(upper).toBe(word.toUpperCase());
      expect(suffix).toBe(text.invalidWordSuffix);
      expect(`${upper} ${suffix}`).toBe(text.invalidWord(word));
    }
  });
});
