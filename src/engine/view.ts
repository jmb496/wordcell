import { giveUpAvailable, redoAvailable, undoAvailable } from './commands';
import { type LangData, letterCount } from './lang/lang-data';
import {
  type CommittedWord,
  dealtStart,
  replayWords,
  type Start,
  type Status,
  status as statusOf,
} from './replay';
import {
  cellHasTop,
  destinationCountAllowed,
  destinationRemainder,
  flippedSide,
  freeCards,
  hasFreeLetter,
  letterCountAllowed,
  type Position,
  placed,
  sourceCards,
  sourceCountAllowed,
  tapDestinationCount,
  targetCellAllowed,
  word,
  wordLetterCount,
} from './rules';
import { band, finalScore, lettersLeft, liveScore, penalty } from './scoring';
import type { DestinationSide, Move, Phase, Session } from './session';
import { type CardId, COLUMN_COUNT, WORD_CELL_NUMBERS, type WordCellNumber } from './types';

/** AD-3 face of a card (index = CardId): the `LangData` glyph unchanged and its letter count. */
export interface Face {
  readonly letter: string;
  readonly letterCount: number;
}

/** AD-3 column entry; `cards` top → bottom. */
export interface ColumnView {
  readonly column: number;
  readonly cards: readonly CardId[];
  readonly canPickUp: boolean;
  readonly canDropOn: boolean;
  readonly canTapForK: boolean;
  /** Destination column in Composing only: R-31 tap result per card, `null` = the no-op. */
  readonly kIfTapped?: ReadonlyMap<CardId, number | null>;
}

/** AD-3 WordCell entry; `cards` bottom → top. */
export interface CellView {
  readonly cell: WordCellNumber;
  readonly cards: readonly CardId[];
  readonly used: boolean;
  readonly canAddFreeLetter: boolean;
  readonly canSetTarget: boolean;
  readonly isLegalTarget: boolean;
}

/** D7 structural check result. */
export type StructuralCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'too-short' };

/** AD-3 draft data (present iff phase ≠ Idle). */
export interface DraftView {
  readonly sourceColumn: number;
  /** S, top → bottom. */
  readonly source: readonly CardId[];
  readonly destinationColumn: number;
  /** D, top → bottom; empty at k = 0. */
  readonly destination: readonly CardId[];
  readonly k: number;
  readonly side: DestinationSide;
  readonly arrangement: readonly CardId[];
  /** Move order (D8). */
  readonly freeLetters: readonly WordCellNumber[];
  /** R-30 word, R-37 lowercase spelling. */
  readonly word: string;
  readonly letterCount: number;
  readonly structural: StructuralCheck;
}

/** AD-3 Place data (present iff phase = Place). */
export interface PlaceView {
  /** Ascending. */
  readonly legalTargets: readonly WordCellNumber[];
  readonly target: WordCellNumber;
  /** Bottom → top, as the Move. */
  readonly placementOrder: readonly CardId[];
  /** D6: L × target − Σ over free letters of (letterCount × its source cell). */
  readonly scoreDelta: number;
}

/** AD-6 longest-word shape. */
export type LongestWord = CommittedWord;

/** AD-3: the only derived game state; plain data, absent optional fields omitted. */
export interface GameView {
  readonly status: Status;
  readonly phase: Phase;
  readonly faces: readonly Face[];
  readonly columns: readonly ColumnView[];
  readonly cells: readonly CellView[];
  readonly draft?: DraftView;
  readonly place?: PlaceView;
  readonly liveScore: number;
  readonly displayScore: number;
  readonly finalScore?: number;
  readonly penalty?: number;
  readonly lettersLeft?: number;
  /** D3: 0–5. */
  readonly band?: number;
  readonly longestWord?: LongestWord;
  readonly wordCount: number;
  /** R-37 lowercase. */
  readonly pendingDraftWord?: string;
  readonly inProgress: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly canGiveUp: boolean;
  readonly canValidate: boolean;
  readonly canConfirm: boolean;
  readonly canFlip: boolean;
  readonly canDecK: boolean;
  readonly canIncK: boolean;
}

/** AD-6 longest word: the maximum letter count, ties to the earliest; absent with no word. Internal. */
export function longestWord(words: readonly CommittedWord[]): LongestWord | undefined {
  let best: CommittedWord | undefined;
  for (const w of words) if (best === undefined || w.letterCount > best.letterCount) best = w;
  return best === undefined
    ? undefined
    : { spelling: best.spelling, letterCount: best.letterCount };
}

const COLUMNS = Array.from({ length: COLUMN_COUNT }, (_, i) => i + 1);

/** The draft's derived data: S, D, R-21 remainder, the R-30 word and its letter count L. */
function draftData(position: Position, draft: Move, lang: LangData) {
  const remainder = destinationRemainder(position, draft);
  const destination = remainder.slice(remainder.length - draft.destinationCount);
  const { cards, spelling } = word(position, draft, lang);
  return {
    remainder,
    source: sourceCards(position, draft),
    destination,
    spelling,
    count: wordLetterCount(cards, lang),
  };
}

/**
 * `view` over a D2 start (internal seam): one `replayWords` pass, every flag from the predicates
 * `apply` shares (AD-3). Throws replay's `EngineError` for a replay-invalid Session.
 */
export function viewFrom(start: Start, session: Session, lang: LangData): GameView {
  const { position, words } = replayWords(start, session, lang);
  const { moves, cursor } = session;
  const { phase } = cursor;
  const current = statusOf(session, position);
  const playing = current === 'playing';
  const idle = playing && phase === 'idle';
  const move: Move | undefined = moves[cursor.index];
  const draft = phase !== 'idle' ? move : undefined;
  const data = draft === undefined ? undefined : draftData(position, draft, lang);
  // Composing and Place imply playing: won and gaveUp need Idle (§2 status, AD-7 ad7-gave-up-idle).
  const composing = phase === 'composing' && draft !== undefined && data !== undefined;
  const k = draft?.destinationCount ?? 0;
  const target = phase === 'place' && draft !== undefined ? placed(draft).targetCell : undefined;
  const count = data?.count ?? 0;

  const anySource = COLUMNS.some((c) =>
    sourceCountAllowed(position, { sourceColumn: c, sourceCount: 1 }),
  );
  const columns = position.columns.map((cards, i): ColumnView => {
    const column = i + 1;
    const entry = {
      column,
      cards: [...cards],
      canPickUp: idle && sourceCountAllowed(position, { sourceColumn: column, sourceCount: 1 }),
      canDropOn: idle && anySource,
    };
    if (!composing || draft.destinationColumn !== column) return { ...entry, canTapForK: false };
    const kIfTapped = new Map<CardId, number | null>();
    for (const card of data.remainder) {
      const result = tapDestinationCount(data.remainder, card, k);
      kIfTapped.set(card, result === k ? null : result);
    }
    const canTapForK = [...kIfTapped.values()].some((value) => value !== null);
    return { ...entry, canTapForK, kIfTapped };
  });

  const cells = position.cells.map((cards, i): CellView => {
    const cell = WORD_CELL_NUMBERS[i];
    const legal = target !== undefined && targetCellAllowed(cell, count);
    return {
      cell,
      cards: [...cards],
      used: draft !== undefined && hasFreeLetter(draft, cell),
      canAddFreeLetter: composing && !hasFreeLetter(draft, cell) && cellHasTop(position, cell),
      canSetTarget: legal && cell !== target,
      isLegalTarget: legal,
    };
  });

  const live = liveScore(position.cells, lang);
  const view: {
    -readonly [K in keyof GameView]: GameView[K];
  } = {
    status: current,
    phase,
    faces: lang.letters.map((letter, card) => ({ letter, letterCount: letterCount(card, lang) })),
    columns,
    cells,
    liveScore: live,
    displayScore: live,
    wordCount: words.length,
    inProgress: playing && moves.length > 0,
    canUndo: undoAvailable(session),
    canRedo: playing && redoAvailable(session),
    canGiveUp: giveUpAvailable(session, current),
    canValidate: composing && letterCountAllowed(count),
    canConfirm: target !== undefined,
    canFlip: composing && flippedSide(draft) !== draft.destinationSide,
    canDecK: composing && destinationCountAllowed(data.remainder.length, k - 1),
    canIncK: composing && destinationCountAllowed(data.remainder.length, k + 1),
  };

  if (draft !== undefined && data !== undefined) {
    view.draft = {
      sourceColumn: draft.sourceColumn,
      source: data.source,
      destinationColumn: draft.destinationColumn,
      destination: data.destination,
      k,
      side: draft.destinationSide,
      arrangement: [...draft.arrangement],
      freeLetters: [...draft.freeLetters],
      word: data.spelling,
      letterCount: count,
      structural: letterCountAllowed(count) ? { ok: true } : { ok: false, reason: 'too-short' },
    };
  }
  if (draft !== undefined && target !== undefined) {
    const free = freeCards(position, draft.freeLetters);
    const freeScore = draft.freeLetters.reduce(
      (sum, cell, i) => sum + letterCount(free[i], lang) * cell,
      0,
    );
    view.place = {
      legalTargets: WORD_CELL_NUMBERS.filter((cell) => targetCellAllowed(cell, count)),
      target,
      placementOrder: [...placed(draft).placementOrder],
      scoreDelta: count * target - freeScore,
    };
  }
  if (!playing) {
    const final = finalScore(position, current === 'gaveUp', lang);
    view.displayScore = final;
    view.finalScore = final;
    view.penalty = penalty(position.columns, lang);
    view.lettersLeft = lettersLeft(position.columns, lang);
    view.band = band(final, lang);
  }
  const longest = longestWord(words);
  if (longest !== undefined) view.longestWord = longest;
  if (idle && move !== undefined) view.pendingDraftWord = word(position, move, lang).spelling;
  return view;
}

/** AD-3: the `GameView` of `session` over the dealt start. */
export function view(session: Session, lang: LangData): GameView {
  return viewFrom(dealtStart(session.seed), session, lang);
}
