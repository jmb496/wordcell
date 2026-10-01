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
  });

  it('AD-8 the loading label ends in U+2026', () => {
    expect(text.loadingWords).toBe('Loading words\u2026');
  });
});
