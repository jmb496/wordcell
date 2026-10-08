// Every EXPERIENCE.md message-catalogue string lives here (AGENTS.md Conventions); later entries
// add theirs. Words are uppercased at render, `QU` stays `QU`, the minus sign is U+2212.
const INVALID_WORD_SUFFIX = "isn't in the word list.";
const letters = (n: number): string => (n === 1 ? '1 letter' : `${n} letters`);

export const text = Object.freeze({
  validate: 'Validate',
  needLetters: 'Need 3+ letters',
  // AD-8 dictionary states: Validate reason labels, the dictionary-failed banner line.
  loadingWords: 'Loading words\u2026',
  wordListUnavailable: 'Word list unavailable',
  wordListFailed: "Word list didn't load.",
  // R-38 invalid word: takes the engine spelling (lowercase, `qu` for QU) and uppercases it. The
  // tray draws it as word + one space + suffix so only the word ellipsizes (DESIGN.md
  // Invalid-word message); `invalidWord` is that one literal.
  invalidWordSuffix: INVALID_WORD_SUFFIX,
  invalidWordParts: (word: string) => [word.toUpperCase(), INVALID_WORD_SUFFIX] as const,
  invalidWord: (word: string) => `${word.toUpperCase()} ${INVALID_WORD_SUFFIX}`,
  // DESIGN.md Tray band: the Composing letter count (R-36 letters, `QU` = 2).
  letters,
  // DESIGN.md Placement strip: the Place meta (R-80), the letter count (R-36), the target cell
  // (U+2192) and the net score change (U+00B7; `+n`, `±0`, U+2212 `−n`).
  placeMeta: (n: number, cell: number, delta: number) =>
    `${letters(n)} \u2192 cell ${cell} \u00b7 ${
      delta > 0 ? `+${delta}` : delta === 0 ? '\u00b10' : `\u2212${-delta}`
    }`,
  // DESIGN.md Placement strip position marks (R-50, R-52): the first tile's `bottom` tag (compact:
  // `▼`), the last tile's `top` tag and orange star; DESIGN.md Tile: the free-letter return glyph.
  stripBottom: 'bottom',
  stripTop: 'top',
  stripBottomMark: '\u25bc',
  star: '\u2605',
  returnGlyph: '\u21a9',
  confirm: 'Confirm',
  newGame: 'New game',
  undo: 'Undo',
  // DESIGN.md Column slot: the source foot pad while a tail is selected (EXPERIENCE.md Foot pad).
  here: 'Here',
  redo: 'Redo',
  // R-82 top-bar score; negatives with U+2212 (DESIGN.md Typography).
  score: (n: number) => `Score ${n < 0 ? `\u2212${-n}` : n}`,
  // Q-06 the QU card's badge (DESIGN.md Components, QU card).
  quBadge: '\u00d72',
  // §2 Session rejected: one title, one body per reason.
  rejectedTitle: "This saved game can't be opened.",
  rejectedVersionUnknown: (version: number) =>
    `It was saved in format version ${version}, which this version of WordCell can't read. It stays saved until you start a new game.`,
  rejectedVersionUnreadable:
    "It was saved in a format this version of WordCell can't read. It stays saved until you start a new game.",
  rejectedReplayFailed: (version: number) =>
    `It (format version ${version}) failed a rules check while loading. It stays saved until you start a new game.`,
  // Q-37 unexpected failure, Q-38 open in another window.
  fatalTitle: 'Something went wrong.',
  anotherWindow: 'WordCell is open in another window.',
  reload: 'Reload',
  // §2/Q-33 History notice (catalogue row 102): title, then the variant sentence plus the hint.
  // The variant sentences interpolate the stored version (the catalogue's 2 is a sample); the end
  // sheet (row 103) reuses them.
  historyTitle: "Your score history can't be read.",
  historyVersionUnknown: (version: number) =>
    `It uses format version ${version}, which this version can't read.`,
  historyVersionUnreadable: "Its format version can't be read.",
  historyContentsUnreadable: (version: number) =>
    `It uses format version ${version} but its contents can't be read.`,
  historyResetHint: 'Statistics are off until you reset it. Resetting deletes the old history.',
  notNow: 'Not now',
  resetHistory: 'Reset history',
  // Reset history confirm (catalogue row 104).
  resetConfirmTitle: 'Delete the score history?',
  resetConfirmBody: "This can't be undone.",
  keepIt: 'Keep it',
  deleteHistory: 'Delete history',
  // F27 WordCell view and peek (DESIGN.md WordCell view): the sheet title (U+00B7, `cards.length`)
  // and the top card's tag.
  viewTitle: (cell: number, count: number) =>
    count === 1 ? `WordCell ${cell} \u00b7 1 card` : `WordCell ${cell} \u00b7 ${count} cards`,
  viewTop: 'top',
  // F27 desktop hover peek (catalogue row 107): the older-cards line above the top 14.
  olderCards: (n: number) => (n === 1 ? '+1 older card' : `+${n} older cards`),
} as const);
