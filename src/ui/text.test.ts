import { describe, expect, it } from 'vitest';
import { bandNames, text } from './text';

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

describe('AD-13 shared history sentence and statistics text', () => {
  it('AD-13 historySentence maps each reason to its own sentence', () => {
    expect(text.historySentence({ reason: 'version-unknown', version: 7 })).toBe(
      text.historyVersionUnknown(7),
    );
    expect(text.historySentence({ reason: 'version-unreadable' })).toBe(
      text.historyVersionUnreadable,
    );
    expect(text.historySentence({ reason: 'contents-unreadable', version: 1 })).toBe(
      text.historyContentsUnreadable(1),
    );
  });

  it('AD-13 endNotAdded is the unrecorded-game line', () => {
    expect(text.endNotAdded).toBe("This game wasn't added to your statistics.");
  });

  it('AD-3 statLetters reads 1 letter and 8 letters; statNumber uses U+2212', () => {
    expect(text.statLetters(1)).toBe('1 letter');
    expect(text.statLetters(8)).toBe('8 letters');
    expect(text.statNumber(-5)).toBe('\u22125');
    expect(text.statNumber(0)).toBe('0');
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

describe('AD-10 timer text', () => {
  const table: [number, string][] = [
    [0, '0:00'],
    [999, '0:00'],
    [59_999, '0:59'],
    [60_000, '1:00'],
    [3_599_999, '59:59'],
    [3_600_000, '1:00:00'],
    [43_384_000, '12:03:04'],
  ];
  for (const [ms, expected] of table) {
    it(`AD-10 timer(${ms}) reads ${expected}`, () => {
      expect(text.timer(ms)).toBe(expected);
    });
  }

  it('AD-10 timer throws on negative and non-finite input', () => {
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => text.timer(bad)).toThrow();
    }
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

describe('AD-3 Place meta text', () => {
  it('AD-3 placeMeta(6, 6, 30) reads 6 letters → cell 6 · +30', () => {
    expect(text.placeMeta(6, 6, 30)).toBe('6 letters → cell 6 · +30');
  });

  it('AD-3 placeMeta(4, 3, 0) reads ±0', () => {
    expect(text.placeMeta(4, 3, 0)).toBe('4 letters → cell 3 · ±0');
  });

  it('AD-3 placeMeta(4, 3, -1) reads −1 with U+2212', () => {
    expect(text.placeMeta(4, 3, -1)).toBe('4 letters → cell 3 · −1');
  });

  it('AD-3 placeMeta(1, 3, 1) reads 1 letter and +1', () => {
    expect(text.placeMeta(1, 3, 1)).toBe('1 letter → cell 3 · +1');
  });
});

describe('AD-3 D-block control text', () => {
  it('AD-3 minus is U+2212, plus is +, the Flip glyph is U+21C4', () => {
    expect(text.minus).toBe('\u2212');
    expect(text.plus).toBe('+');
    expect(text.flipGlyph).toBe('\u21c4');
    expect(text.flip).toBe('Flip');
  });

  it('AD-3 the k = 0 caption reads Empty column: no cards join the word', () => {
    expect(text.emptyColumn).toBe('Empty column: no cards join the word');
  });
});

// EXPERIENCE.md message catalogue rows 97, 98: all six confirm strings, and New game's action
// reuses the New game row label.
describe('AD-13 confirm dialog text', () => {
  it('AD-13 the six confirm strings equal their catalogue rows', () => {
    expect(text.newGameConfirmTitle).toBe('Start a new game?');
    expect(text.newGameConfirmBody).toBe("This game won't count in your statistics.");
    expect(text.replayConfirmTitle).toBe('Replay this deal?');
    expect(text.replayConfirmBody).toBe(
      "You'll start this deal again from the beginning. This game won't count in your statistics.",
    );
    expect(text.replayConfirmAction).toBe('Replay');
    expect(text.keepPlaying).toBe('Keep playing');
  });

  it('AD-13 the New game confirm action reuses text.newGame', () => {
    expect(text.newGame).toBe('New game');
  });
});

describe('AD-10 Preferences panel text', () => {
  it('AD-10 the panel strings are the DESIGN.md Panels wording', () => {
    expect(text.preferences).toBe('Preferences');
    expect(text.closePreferences).toBe('Close preferences');
    expect(text.animationSpeed).toBe('Animation speed');
    expect(text.speedFast).toBe('Fast');
    expect(text.speedNormal).toBe('Normal');
    expect(text.speedSlow).toBe('Slow');
    expect(text.showTimer).toBe('Show timer');
  });
});

// Ticket 6.6 end sheet text (EXPERIENCE.md catalogue rows 106, 109, Rating bands).
describe('AD-3 end sheet text', () => {
  it('AD-3 endPenalty reads plural and singular with U+2212 (QU counting 2 is the lettersLeft of the view, R-81)', () => {
    expect(text.endPenalty(12, 120)).toBe('12 letters left: −120');
    expect(text.endPenalty(1, 10)).toBe('1 letter left: −10');
    expect(text.endPenalty(2, 20)).toBe('2 letters left: −20');
  });

  it('AD-3 each band 0–5 maps to its own name and message', () => {
    const names = [0, 1, 2, 3, 4, 5].map((b) => text.bandName(b));
    expect(names).toEqual([
      'Alphabet Soup',
      'Warming Up',
      'Word Nerd',
      'Wordsmith',
      'Lexicon Legend',
      'Perfect Deck',
    ]);
    expect([0, 1, 2, 3, 4, 5].map((b) => text.bandMessage(b))).toEqual([
      'Plenty of letters, not much broth. The deck forgives you.',
      'The cells are waking up.',
      'Halfway to glory, and it shows.',
      'Long words, high cells. Nicely forged.',
      'The dictionary is a little afraid of you.',
      'Fifty-two cards, one cell. Nothing left to prove.',
    ]);
    expect(() => text.bandName(6)).toThrow();
  });

  it('AD-3 endBar names the score (U+2212 when negative) and the band', () => {
    expect(text.endBar(172, 'Warming Up')).toBe('Show result: 172, Warming Up');
    expect(text.endBar(-40, 'Alphabet Soup')).toBe('Show result: −40, Alphabet Soup');
  });

  it('AD-3 pendingDraft returns prefix, uppercased word and suffix', () => {
    expect(text.pendingDraft('quake')).toEqual({
      prefix: 'Undone: ',
      word: 'QUAKE',
      suffix: ' \u00b7 Redo brings it back',
    });
    const { prefix, word, suffix } = text.pendingDraft('quake');
    expect(`${prefix}${word}${suffix}`).toBe('Undone: QUAKE \u00b7 Redo brings it back');
    expect(text.pendingDraft('tan').word).toBe('TAN');
    expect(text.pendingDraft('vimldxomiw').word).toBe('VIMLDXOMIW');
    expect(text.pendingDraft('qu').word).toBe('QU');
  });
});

// Ticket 6.9 How to play text (EXPERIENCE.md Rating bands, Keyboard).
describe('AD-3 How to play text', () => {
  it('AD-3 the goal heading reads The goal', () => {
    expect(text.howTo.headings.goal).toBe('The goal');
  });

  it('AD-3 bandNames returns the six EXPERIENCE.md Rating bands names in band order', () => {
    const table = [
      'Alphabet Soup',
      'Warming Up',
      'Word Nerd',
      'Wordsmith',
      'Lexicon Legend',
      'Perfect Deck',
    ];
    expect(bandNames()).toEqual(table);
    expect([0, 1, 2, 3, 4, 5].map((b) => text.bandName(b))).toEqual(table);
  });

  // The engine thresholds are pinned in scoring.test.ts (R-83); this pins the English strings only.
  it('AD-3 bandScore strings carry the R-83 arithmetic ceil(t * 530 / 520)', () => {
    const needed = [156, 260, 370, 460, 520].map((t) => Math.ceil((t * 530) / 520));
    expect(needed).toEqual([159, 265, 378, 469, 530]);
    expect(text.bandScore(0)).toBe(`below ${needed[0]}`);
    for (const band of [1, 2, 3, 4]) {
      expect(text.bandScore(band)).toBe(`${needed[band - 1]} or more`);
    }
    expect(text.bandScore(5)).toBe('530 (every card placed)');
    expect(() => text.bandScore(6)).toThrow();
  });

  it('AD-3 the example captions read WORD, n letters', () => {
    expect(text.howTo.exampleWords.map(text.howTo.exampleCaption)).toEqual([
      'BAKED, 5 letters',
      'BALKED, 6 letters',
      'FAKED, 5 letters',
      'FLAKED, 6 letters',
    ]);
  });
});

describe('AD-3 tooltip text', () => {
  it('AD-3 each keyed command reads Label (Key) from key-labels.ts', () => {
    expect(text.tooltip('undo')).toBe('Undo (Z)');
    expect(text.tooltip('redo')).toBe('Redo (Y)');
    expect(text.tooltip('validate')).toBe('Validate (Enter)');
    expect(text.tooltip('confirm')).toBe('Confirm (Enter)');
    expect(text.tooltip('k-')).toBe('− (-)');
    expect(text.tooltip('k+')).toBe('+ (+)');
    expect(text.tooltip('flip')).toBe('Flip (F)');
    expect(text.tooltip('menu')).toBe('Menu (M)');
    expect(text.tooltip('newGame')).toBe('New game (N)');
    expect(text.tooltip('howToPlay')).toBe('How to play (?)');
  });
});
