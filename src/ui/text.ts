// Every EXPERIENCE.md message-catalogue string lives here (AGENTS.md Conventions); later entries
// add theirs. Words are uppercased at render, `QU` stays `QU`, the minus sign is U+2212.
export const text = Object.freeze({
  validate: 'Validate',
  needLetters: 'Need 3+ letters',
  // AD-8 dictionary states: Validate reason labels, the dictionary-failed banner line.
  loadingWords: 'Loading words\u2026',
  wordListUnavailable: 'Word list unavailable',
  wordListFailed: "Word list didn't load.",
  // R-38 invalid word: takes the engine spelling (lowercase, `qu` for QU) and uppercases it.
  invalidWord: (word: string) => `${word.toUpperCase()} isn't in the word list.`,
  confirm: 'Confirm',
  newGame: 'New game',
  undo: 'Undo',
  redo: 'Redo',
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
} as const);
