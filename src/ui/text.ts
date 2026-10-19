// Every EXPERIENCE.md message-catalogue string lives here (AGENTS.md Conventions); later entries
// add theirs. Words are uppercased at render, `QU` stays `QU`, the minus sign is U+2212.
import { KEY_LABELS, type TooltipCommand } from './key-labels';

const INVALID_WORD_SUFFIX = "isn't in the word list.";

// Structurally the shell's `HistoryRejectReason`; not imported, because e2e specs import this file
// and the shell store module needs the Svelte compiler.
type HistoryRejectReason =
  | { readonly reason: 'version-unknown'; readonly version: number }
  | { readonly reason: 'version-unreadable' }
  | { readonly reason: 'contents-unreadable'; readonly version: number };

const letters = (n: number): string => (n === 1 ? '1 letter' : `${n} letters`);

const historyVersionUnknown = (version: number): string =>
  `It uses format version ${version}, which this version can't read.`;
const historyVersionUnreadable = "Its format version can't be read.";
const historyContentsUnreadable = (version: number): string =>
  `It uses format version ${version} but its contents can't be read.`;

function historySentence(reason: HistoryRejectReason): string {
  switch (reason.reason) {
    case 'version-unknown':
      return historyVersionUnknown(reason.version);
    case 'version-unreadable':
      return historyVersionUnreadable;
    case 'contents-unreadable':
      return historyContentsUnreadable(reason.version);
  }
}

// Epic 6 CAP-11 (6.13) screen-reader names and announcements (EXPERIENCE.md Accessibility Floor,
// A-E9; the wording beyond the SPEC examples is flagged for the owner). `QU` is read as two
// letters on a name; a word string spells it `QU`. A number in a name or announcement is never
// signed with U+2212: a negative reads `minus N`.
const QU_NAME = 'Q U, counts as two letters';
const letterName = (letter: string): string => (letter === 'QU' ? QU_NAME : letter);
const cards = (n: number): string => (n === 1 ? '1 card' : `${n} cards`);
const joinState = (selected: boolean, destination: boolean): string =>
  `${selected ? ', selected' : ''}${destination ? ', destination' : ''}`;
const deltaWords = (n: number): string =>
  n > 0 ? `plus ${n}` : n < 0 ? `minus ${-n}` : 'no change';
const phaseIdle = 'Idle.';
const phaseComposing = (word: string, n: number): string =>
  `Composing. ${word.toUpperCase()}, ${letters(n)}.`;
const phasePlace = (word: string, n: number): string =>
  `Place. ${word.toUpperCase()}, ${letters(n)}.`;

// EXPERIENCE.md Rating bands (A-E2), keyed by the view's `band` 0–9 (no threshold logic here).
const BANDS = [
  {
    name: 'Just Getting Started',
    message: 'Every word has to start somewhere. Lovely first steps!',
  },
  { name: 'Warming Up', message: 'The cells are waking up.' },
  { name: 'Word Explorer', message: "You're finding your way around the deck." },
  { name: 'Word Nerd', message: 'The words are flowing now.' },
  { name: 'Wordsmith', message: 'Long words, high cells. Nicely forged.' },
  { name: 'Word Wizard', message: 'That is some real word magic.' },
  { name: 'Lexicon Pro', message: 'Impressive: the dictionary is taking notes.' },
  { name: 'Lexicon Legend', message: 'The dictionary is a little afraid of you.' },
  { name: 'Nearly Impossible', message: 'Scores like this are almost unheard of. Astonishing!' },
  {
    name: 'You Cheated',
    message: 'Every single card placed. We have no idea how, but we are very impressed.',
  },
] as const;

function bandOf(band: number): (typeof BANDS)[number] {
  const entry = BANDS[band];
  if (entry === undefined || !Number.isInteger(band))
    throw new Error(`AD-3 band ${band} out of range`);
  return entry;
}

/** The ten band names in band 0–9 order (How to play, ticket 6.9; no copy of the table). */
export function bandNames(): readonly string[] {
  return BANDS.map((b) => b.name);
}

// EXPERIENCE.md Rating bands "English score" column (R-83: thresholds in steps of 50 of the English
// maximum 530; the engine `band` is not exported, AD-2). Static strings, no threshold logic.
const BAND_SCORES = [
  'below 50',
  '50 or more',
  '100 or more',
  '150 or more',
  '200 or more',
  '250 or more',
  '300 or more',
  '350 or more',
  '400 to 529',
  '530 (perfect)',
] as const;

// How to play panel (ticket 6.9, CAP-8; EXPERIENCE.md How to play panel; spec §3–§6, §8, §9). The
// owner reads this text at ticket review. Each section body is a list of paragraphs.
const howTo = {
  goal: [
    'Empty all eight columns by placing words in the WordCells. Bigger words in high-numbered WordCells score more.',
  ],
  scoring: [
    'Your score is the sum, over the WordCells, of the letters in the cell times the cell\u2019s number. A QU card counts as two letters.',
    'If you give up, every letter left in the columns costs 10 points (a QU costs 20), and the score can go below zero. Giving up can be undone.',
    'The rating at the end depends on your score. For this deck:',
  ],
} as const;

// Epic 6 CAP-10 (6.11): the tooltip label of each command that carries a key (the control's visible
// label; `−` and `+` are the glyphs). Give up has none.
const TOOLTIP_LABELS: Readonly<Record<TooltipCommand, string>> = {
  undo: 'Undo',
  redo: 'Redo',
  validate: 'Validate',
  confirm: 'Confirm',
  'k-': '\u2212',
  'k+': '+',
  flip: 'Flip',
  menu: 'Menu',
  newGame: 'New game',
  howToPlay: 'How to play',
};

export const text = Object.freeze({
  // Epic 6 CAP-10 (6.11): the desktop tooltip `Label (Key)`, the key from key-labels.ts.
  tooltip: (command: TooltipCommand): string =>
    `${TOOLTIP_LABELS[command]} (${KEY_LABELS[command]})`,
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
  // EXPERIENCE.md State Patterns (A-E13): the Idle pending-draft line; the word is the engine
  // spelling uppercased, the suffix keeps its leading space (U+00B7) so only the word ellipsizes.
  pendingDraft: (word: string) =>
    ({
      prefix: 'Undone: ',
      word: word.toUpperCase(),
      suffix: ' \u00b7 Redo brings it back',
    }) as const,
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
  // DESIGN.md D-block controls (R-30, R-31; F9, F11): `−` (U+2212) and `+` around k, `⇄ Flip` (the
  // glyph aria-hidden), and the k = 0 caption that replaces them.
  minus: '\u2212',
  plus: '+',
  flipGlyph: '\u21c4',
  flip: 'Flip',
  emptyColumn: 'Empty column: no cards join the word',
  confirm: 'Confirm',
  newGame: 'New game',
  undo: 'Undo',
  // Epic 6 CAP-2 Menu sheet (DESIGN.md Menu sheet; the EXPERIENCE.md catalogue lists no menu
  // strings, so these take that wording, flagged for the owner): the ☰ name, the sheet title and
  // close label, the row labels (`newGame` above is the New game row).
  menu: 'Menu',
  closeMenu: 'Close menu',
  replayDeal: 'Replay this deal',
  // Epic 6 CAP-3 (EXPERIENCE.md catalogue rows 97, 98): the New game and Replay confirms; New game's
  // action reuses `newGame` above.
  newGameConfirmTitle: 'Start a new game?',
  newGameConfirmBody: "This game won't count in your statistics.",
  replayConfirmTitle: 'Replay this deal?',
  replayConfirmBody:
    "You'll start this deal again from the beginning. This game won't count in your statistics.",
  replayConfirmAction: 'Replay',
  keepPlaying: 'Keep playing',
  giveUp: 'Give up',
  // DESIGN.md Column slot: the source foot pad while a tail is selected (EXPERIENCE.md Foot pad).
  here: 'Here',
  redo: 'Redo',
  // R-82 top-bar score; negatives with U+2212 (DESIGN.md Typography).
  score: (n: number) => `Score ${n < 0 ? `\u2212${-n}` : n}`,
  // R-76 top-bar timer: floors to seconds, `m:ss` below one hour, `h:mm:ss` from it (hours
  // unpadded, no cap). Throws on negative or non-finite input (rule 6).
  timer: (ms: number): string => {
    if (!Number.isFinite(ms) || ms < 0) throw new Error(`AD-10 timer(${ms})`);
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  },
  // Epic 6 CAP-7 (ticket 6.4) Preferences panel (DESIGN.md Panels; the catalogue lists no panel
  // strings, so these take that wording, flagged for the owner).
  preferences: 'Preferences',
  closePreferences: 'Close preferences',
  animationSpeed: 'Animation speed',
  speedFast: 'Fast',
  speedNormal: 'Normal',
  speedSlow: 'Slow',
  showTimer: 'Show timer',
  // Themes ticket 4 (Q-45): the Theme radiogroup and its option labels.
  theme: 'Theme',
  themeDefault: 'Charcoal',
  themePaper: 'Daylight Paper',
  themeGarden: 'Garden',
  // Epic 6 CAP-6 (ticket 6.5, R-84, Q-44, Q-35) Statistics panel (DESIGN.md Panels; the catalogue
  // lists only the empty line, so the other strings take that wording, flagged for the owner).
  // `statNone` stands for a value that does not exist; negatives use U+2212.
  statistics: 'Statistics',
  closeStatistics: 'Close statistics',
  statGamesPlayed: 'Games played',
  statGamesWon: 'Games won',
  statGamesGivenUp: 'Games given up',
  statBestScore: 'Best score',
  statAverageScore: 'Average score',
  statLongestWord: 'Longest word',
  statNone: '\u2014',
  statNumber: (n: number) => (n < 0 ? `\u2212${-n}` : String(n)),
  statLetters: letters,
  statisticsEmpty: 'Finish or give up a game to see statistics here.',
  // Epic 6 CAP-4 (ticket 6.6, R-62, R-81, R-83, R-84) End sheet (EXPERIENCE.md catalogue rows 106,
  // 109, Rating bands; DESIGN.md End screen). `n` and `p` come from the view (`lettersLeft`,
  // `penalty`, QU already counts 2); the minus sign is U+2212. The labels and the handle and bar
  // names are not in the catalogue and take this wording, flagged for the owner.
  endWinTitle: 'Every column cleared.',
  endGaveUpTitle: 'Game given up.',
  endPenalty: (n: number, p: number) => `${letters(n)} left: \u2212${p}`,
  endLongestWord: 'Longest word',
  endWordsPlaced: 'Words placed',
  endNone: '\u2014',
  endCollapse: 'Collapse result',
  endBar: (score: number, band: string) =>
    `Show result: ${score < 0 ? `\u2212${-score}` : score}, ${band}`,
  bandName: (band: number) => bandOf(band).name,
  bandScore: (band: number) => {
    bandOf(band);
    return BAND_SCORES[band];
  },
  bandMessage: (band: number) => bandOf(band).message,
  // Epic 6 CAP-11 (6.13) names: column card, tray tile, WordCell top card, WordCell, empty
  // WordCell, column foot and the source foot (`i` of `n` counts from the first entry).
  nameColumnCard: (
    letter: string,
    column: number,
    i: number,
    n: number,
    selected: boolean,
    destination: boolean,
  ) =>
    `${letterName(letter)}, column ${column}, card ${i} of ${n}${joinState(selected, destination)}`,
  nameTrayTile: (letter: string, i: number, n: number, selected: boolean) =>
    `${letterName(letter)}, tray, tile ${i} of ${n}${selected ? ', selected' : ''}`,
  nameCellTop: (letter: string, cell: number) => `${letterName(letter)}, WordCell ${cell}, top`,
  nameCell: (cell: number, letter: string, count: number, used: boolean) =>
    `WordCell ${cell}, top ${letterName(letter)}, ${cards(count)}${used ? ', used' : ''}`,
  nameCellEmpty: (cell: number) => `WordCell ${cell}, empty`,
  nameFoot: (column: number) => `Column ${column} foot`,
  nameFootSource: (column: number) => `Column ${column}, here`,
  // Epic 6 CAP-11 announcements: delta wording, phase strings, triggers, the outcome sentence.
  delta: deltaWords,
  phaseIdle,
  phaseComposing,
  phasePlace,
  announceCommit: (word: string, cell: number, delta: number) =>
    `${word.toUpperCase()} placed on cell ${cell}, ${deltaWords(delta)}`,
  announceUndo: (phase: string) => `Undo. ${phase}`,
  announceRedo: (phase: string) => `Redo. ${phase}`,
  announceNewGame: 'New game',
  announceReplay: 'Replay',
  srOutcome: (title: string, score: number, band: string) =>
    `${title} Score ${score < 0 ? `minus ${-score}` : score}, ${band}.`,
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
  historyVersionUnknown,
  historyVersionUnreadable,
  historyContentsUnreadable,
  historyResetHint: 'Statistics are off until you reset it. Resetting deletes the old history.',
  // The one reason-to-sentence mapping the History notice and the Statistics panel share.
  historySentence,
  // Epic 6 CAP-4 (6.7): the end-sheet block's second line and the line that replaces the block
  // after Reset history (catalogue row 103).
  endNotAdded: "This game wasn't added to your statistics.",
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
  // Epic 6 CAP-8 (ticket 6.9) How to play panel and its menu row; flagged for the owner's text review.
  howToPlay: 'How to play',
  closeHowToPlay: 'Close how to play',
  howTo: {
    headings: {
      goal: 'The goal',
      scoring: 'Scoring, giving up and bands',
      controls: 'Controls',
    },
    ...howTo,
    controlCaptions: { touch: 'Touch', mouse: 'Mouse', keyboard: 'Keyboard' },
    // Epic 8 ticket 1 (HP-6): scene captions (the figure's visible description, its name) and the
    // scene control names; the owner reads the captions at the epic's text review.
    scenes: {
      // Epic 8 ticket 7: the owner-reviewed drafts, kept verbatim (the owner reads them at done).
      moveCompose:
        "To form a word, drag one or more cards and drop onto the bottom of a column. The cards in the destination column stay in order and can't be shuffled, but the initial dragged group can. \u2212/+ adds more letters from the destination column; Flip makes the word read upward instead.",
      freeLetter:
        'Tap a WordCell to borrow its top card. The top card of each WordCell can be used as a free letter added to the word. Then Validate.',
      place:
        "Letters from the formed word are placed in a WordCell of value equal to or less than the length of the word. Order the cards: the last one becomes that cell's free letter. Then Confirm.",
      scoring:
        'Each WordCell scores its letters times its number. QU counts as two letters. Bigger words lead to higher scores.',
      // Epic 8 ticket 10 (HP-4): the one Tricky rule, the owner's wording of 2026-10-17.
      sourceDrop:
        'Dropping back on the column you lifted from is allowed. You must use at least 1 letter from the destination column, unless you drag to an empty column.',
    },
    // Epic 8 ticket 3 (HP-3e): a scoring scene's per-WordCell figure, letters times the cell number.
    scoreFigure: (letters: number, cell: number, score: number): string =>
      `${letters} \u00d7 ${cell} = ${score}`,
    // Epic 8 ticket 6 (HP-6): the scene carousel's controls. "Next scene" and `sceneControls.next`
    // ("Next", the reduced-motion frame control) collide under substring locators: match exactly.
    carousel: {
      label: 'Scenes',
      previous: 'Previous scene',
      next: 'Next scene',
      dot: (n: number, total: number): string => `Scene ${n} of ${total}`,
    },
    sceneControls: {
      pause: 'Pause animation',
      restart: 'Restart animation',
      next: 'Next',
      replay: 'Replay',
    },
    // [gesture, effect] rows from EXPERIENCE.md's interaction text.
    touch: [
      ['Drag a card', 'Lifts it and the cards below it; drop on a column to start a word'],
      ['Tap a card, then a column', 'Picks up the tail, then drops it on that column'],
      ['Tap Here', 'Drops the tail on its own column'],
      ['Tap a card in the destination column', 'Sets how many destination cards join'],
      [
        'Tap a WordCell\u2019s top card',
        'Adds it as a free letter; tap its tile twice to remove it',
      ],
      ['Drag a tile, or tap two tiles', 'Rearranges the word'],
      ['Tap a WordCell', 'Opens its cards in a view'],
      ['Long-press a WordCell', 'Peeks at its cards until you let go'],
    ],
    mouse: [
      ['Drag and click', 'The same as touch'],
      ['Hover a column card', 'Outlines the tail a click would pick up'],
      ['Hover a WordCell', 'Peeks at its cards after a short pause'],
    ],
    // [key, effect] rows: the complete EXPERIENCE.md Keyboard table.
    keyboard: [
      ['1\u20138', 'Select the bottom card of a column, or drop the selected tail on it'],
      ['\u2191 / \u2193', 'Make the selected tail longer / shorter'],
      [
        '3\u20139, 0 (= 10)',
        'Add that WordCell\u2019s top card as a free letter, or set it as the target',
      ],
      ['\u2190 / \u2192', 'Move focus along the tiles or the strip'],
      ['Shift + \u2190 / \u2192', 'Move the focused tile or card one place'],
      ['Space', 'Tap the focused card, tile or WordCell; on a WordCell, open its view'],
      ['+ or = / -', 'More / fewer destination cards'],
      ['F', 'Flip the destination block'],
      ['Enter', 'Tap the focused item; otherwise Validate or Confirm'],
      ['Z, Ctrl/Cmd + Z', 'Undo'],
      ['Y, Ctrl/Cmd + Y, Ctrl/Cmd + Shift + Z', 'Redo'],
      ['Esc', 'Close the topmost panel, or clear the selection'],
      ['M', 'Open the menu'],
      ['N', 'Start a new game'],
      ['?', 'Open this page'],
    ],
  },
} as const);
