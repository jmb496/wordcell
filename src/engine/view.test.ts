import { describe, expect, it } from 'vitest';
import { type ApplyContext, apply, applyFrom, type Command } from './commands';
import { EngineError } from './errors';
import { EN } from './lang/en';
import { replay, type Start } from './replay';
import { destinationRemainder, word } from './rules';
import { band, finalScore, lettersLeft, liveScore, penalty } from './scoring';
import { createSession, type Move, type Session } from './session';
import { type CardId, WORD_CELL_NUMBERS, type WordCellNumber } from './types';
import { type GameView, longestWord, view, viewFrom } from './view';
import { winSeed } from './win-seed';

// --- helpers (copied from commands.test.ts; tests never import another test file) -------------

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
    const object = value as object;
    if (seen.has(object)) return value;
    seen.add(object);
    for (const key of Reflect.ownKeys(object))
      deepFreeze((object as Record<PropertyKey, unknown>)[key], seen);
    Object.freeze(object);
  }
  return value;
}

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

type Eight<T> = [T, T, T, T, T, T, T, T];

/**
 * A D2 Start from letter strings: columns top → bottom (column 1 first), cells bottom → top.
 * Each letter takes the lowest free CardId for it; `'Q'` is the QU card.
 */
function startOf(
  columns: readonly string[],
  cells: Partial<Record<WordCellNumber, string>> = {},
): Start {
  const used = new Set<CardId>();
  const take = (ch: string): CardId => {
    const letter = ch === 'Q' ? 'QU' : ch;
    const id = EN.letters.findIndex((l, i) => l === letter && !used.has(i));
    if (id < 0) throw new Error(`no free card for ${letter}`);
    used.add(id);
    return id;
  };
  const cols = Array.from({ length: 8 }, (_, i) => [...(columns[i] ?? '')].map(take));
  const cellStacks = Array.from({ length: 8 }, (_, i) =>
    [...(cells[(i + 3) as WordCellNumber] ?? '')].map(take),
  );
  return deepFreeze({
    columns: cols as Eight<CardId[]>,
    cells: cellStacks as Eight<CardId[]>,
  });
}

const LANG = deepFreeze(EN);
const CTX: ApplyContext = deepFreeze({ lang: LANG });
const DICT = (...words: string[]): ApplyContext =>
  deepFreeze({ lang: LANG, dictionary: new Set(words) });

/** Public `apply` of each command in turn, every input and result deep-frozen. */
function play(session: Session, commands: readonly Command[], words: string[] = []): Session {
  const ctx = DICT(...words);
  let current = deepFreeze(session);
  for (const command of commands)
    current = deepFreeze(apply(current, deepFreeze(command), ctx).session);
  return current;
}

/** The D2 seam: `applyFrom` over `start` from a fresh seed-1 Session, inputs deep-frozen. */
function seam(start: Start, commands: readonly Command[], words: string[] = []): Session {
  const ctx = DICT(...words);
  let current = deepFreeze(createSession(1));
  for (const command of commands)
    current = deepFreeze(applyFrom(start, current, deepFreeze(command), ctx).session);
  return current;
}

/** True when `apply` neither throws `EngineError` nor returns the input reference (CAP-7). */
function changes(session: Session, command: Command, ctx: ApplyContext = CTX): boolean {
  try {
    return apply(session, command, ctx).session !== session;
  } catch (e) {
    if (e instanceof EngineError) return false;
    throw e;
  }
}

const v = (session: Session): GameView => view(session, LANG);
const draftOf = (session: Session): Move => session.moves[session.cursor.index];
const columnOf = (gameView: GameView, column: number) => gameView.columns[column - 1];
const cellOf = (gameView: GameView, cell: WordCellNumber) => gameView.cells[cell - 3];

const drop = (sourceColumn: number, sourceCount: number, destinationColumn: number): Command => ({
  type: 'drop',
  sourceColumn,
  sourceCount,
  destinationColumn,
});
const setK = (k: number): Command => ({ type: 'setDestinationCount', k });
const tap = (card: CardId): Command => ({ type: 'tapDestinationCard', card });
const addFree = (cell: WordCellNumber): Command => ({ type: 'addFreeLetter', cell });
const setTarget = (cell: WordCellNumber): Command => ({ type: 'setTarget', cell });
const FLIP: Command = { type: 'flip' };
const VALIDATE: Command = { type: 'validate' };
const CONFIRM: Command = { type: 'confirm' };
const UNDO: Command = { type: 'undo' };
const REDO: Command = { type: 'redo' };
const GIVE_UP: Command = { type: 'giveUp' };

// --- seed-1 states (seed 1 columns: 1 L D X O M I W | 2 T N P D V I M | 3 L QU E J A T A |
// 4 E K G H H I O | 5 T S C F S Z | 6 O P N A E N | 7 Y E U R H F | 8 S B R R C U) ------------

const FRESH = deepFreeze(createSession(1));
/** W onto column 3 (n = 7), k = 1. */
const K1 = play(FRESH, [drop(1, 1, 3)]);
const MIDDLE = play(K1, [setK(4)]);
const KN = play(K1, [setK(7)]);
const MIDDLE_RIGHT = play(MIDDLE, [FLIP]);
/** Idle at index 0 with a pending (Composing-reached) draft. */
const PENDING0 = play(K1, [UNDO]);
/** Column 5 committed onto cell 6 (T S C F S Z, Z on top): Idle at index 1, column 5 empty. */
const COL5_DONE = play(FRESH, [drop(5, 6, 5), VALIDATE, CONFIRM], ['tscfsz']);
/** Plus column 6 onto cell 3 (O P N A E N, N on top): Idle at index 2. */
const TWO_CELLS = play(COL5_DONE, [drop(6, 6, 6), VALIDATE, setTarget(3), CONFIRM], ['opnaen']);
/** Self-drop leaving L alone in column 1: n = 1. */
const N1 = play(FRESH, [drop(1, 6, 1)]);
const N1_RIGHT = play(N1, [FLIP]);
/** Whole-column self-drop (k = 0). */
const K0_SELF = play(FRESH, [drop(1, 7, 1)]);
/** Drop onto the empty column 5 (k = 0). */
const K0_EMPTY = play(COL5_DONE, [drop(1, 1, 5)]);
/** Partial self-drop: I W onto column 1, remainder L D X O M, k = 1. */
const PARTIAL_SELF = play(FRESH, [drop(1, 2, 1)]);
const PARTIAL_SELF_RIGHT = play(PARTIAL_SELF, [FLIP]);
/** W onto column 2 (D = M): the 2-letter word "mw" (R-36). */
const SHORT = play(TWO_CELLS, [drop(1, 1, 2)]);
/** "mwn": free letter N from cell 3 (used), cell 6 non-empty unused, the rest empty. */
const FREE = play(SHORT, [addFree(3)]);
/** Place, L = 3, default target 3 = the free letter's cell (R-41, R-42). */
const PLACE_R41 = play(FREE, [VALIDATE], ['mwn']);
/** Composing reached by undo from Place (reached = place). */
const COMPOSING_FROM_PLACE = play(PLACE_R41, [UNDO]);
/** Straight after confirm: Idle at index 3. */
const COMMITTED = play(PLACE_R41, [CONFIRM]);
/** Place reached by undo from Idle (reached = committed). */
const PLACE_FROM_IDLE = play(COMMITTED, [UNDO]);
/** k = n − 1 on column 3 (n = 7). */
const K_N_MINUS_1 = play(K1, [setK(6)]);
/** Place, L = 10, default target 10: every other cell a legal non-current target. */
const PLACE_L10 = play(FRESH, [drop(1, 7, 2), setK(3), VALIDATE], ['vimldxomiw']);
const WON = deepFreeze(winSeed(1));
const GAVE_UP0 = play(PENDING0, [GIVE_UP]);
const GAVE_UP1 = play(COL5_DONE, [GIVE_UP]);

/** The ticket's flag agreement states. */
const STATES: readonly (readonly [string, Session])[] = [
  ['fresh Idle', FRESH],
  ['Idle with a pending draft', PENDING0],
  ['Idle with an empty column after a committed move', COL5_DONE],
  ['Idle with two used WordCells', TWO_CELLS],
  ['Composing k = 1', K1],
  ['Composing middle k', MIDDLE],
  ['Composing middle k, right side', MIDDLE_RIGHT],
  ['Composing k = n', KN],
  ['Composing k = n − 1', K_N_MINUS_1],
  ['Composing n = 1', N1],
  ['Composing n = 1, right side', N1_RIGHT],
  ['Composing k = 0, whole-column self-drop', K0_SELF],
  ['Composing k = 0, empty destination', K0_EMPTY],
  ['Composing partial self-drop', PARTIAL_SELF],
  ['Composing too short', SHORT],
  ['Composing with a used free letter', FREE],
  ['Composing reached by undo from Place', COMPOSING_FROM_PLACE],
  ['Place with a used free letter (R-41)', PLACE_R41],
  ['Place reached by undo from Idle', PLACE_FROM_IDLE],
  ['Place with L = 10', PLACE_L10],
  ['Idle straight after confirm', COMMITTED],
  ['won', WON],
  ['gaveUp at index 0 with a pending draft', GAVE_UP0],
  ['gaveUp at index > 0', GAVE_UP1],
];

const COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8];
const ALL_CARDS = Array.from({ length: 52 }, (_, card) => card);

/** R-31 destination remainder of a Composing session, derived from replay and the Move. */
const remainderOf = (session: Session): readonly CardId[] =>
  destinationRemainder(replay(session, LANG), draftOf(session));

// --- faces, position, status -------------------------------------------------------------------

describe('GameView fields', () => {
  it('AD-3 faces are indexed by CardId with the LangData glyph and letter count (QU 2)', () => {
    const { faces } = v(FRESH);
    expect(faces).toHaveLength(52);
    for (const [card, face] of faces.entries())
      expect(face).toStrictEqual({ letter: LANG.letters[card], letterCount: card === 35 ? 2 : 1 });
    expect(faces[35]).toStrictEqual({ letter: 'QU', letterCount: 2 });
  });

  it('AD-3 columns and WordCells are the committed-prefix position in every phase', () => {
    for (const [, session] of STATES) {
      const position = replay(session, LANG);
      const gameView = v(session);
      expect(gameView.columns.map((c) => c.column)).toStrictEqual(COLUMNS);
      expect(gameView.columns.map((c) => c.cards)).toStrictEqual(position.columns);
      expect(gameView.cells.map((c) => c.cell)).toStrictEqual(WORD_CELL_NUMBERS);
      expect(gameView.cells.map((c) => c.cards)).toStrictEqual(position.cells);
    }
    // S stays in its source column during Composing; Place leaves the cells uncommitted.
    expect(columnOf(v(K1), 1).cards).toStrictEqual([24, 6, 49, 30, 25, 20, 48]);
    expect(cellOf(v(PLACE_R41), 3).cards).toStrictEqual([31, 34, 27, 1, 9, 28]);
  });

  it('R-12 WordCell entries carry no pick-up flag; only column entries do', () => {
    for (const [, session] of STATES) {
      const gameView = v(session);
      for (const cell of gameView.cells) expect(Object.hasOwn(cell, 'canPickUp')).toBe(false);
      for (const column of gameView.columns) expect(Object.hasOwn(column, 'canPickUp')).toBe(true);
    }
  });

  it('§2 status is playing, won or gaveUp and phase is the cursor phase', () => {
    expect(v(FRESH).status).toBe('playing');
    expect(v(WON).status).toBe('won');
    expect(v(GAVE_UP0).status).toBe('gaveUp');
    expect(v(GAVE_UP1).status).toBe('gaveUp');
    for (const [, session] of STATES) expect(v(session).phase).toBe(session.cursor.phase);
  });

  it('§2 inProgress: playing with at least one move', () => {
    expect(v(FRESH).inProgress).toBe(false);
    expect(v(K1).inProgress).toBe(true);
    expect(v(PENDING0).inProgress).toBe(true);
    expect(v(play(GAVE_UP1, [UNDO])).inProgress).toBe(true);
    expect(v(play(FRESH, [GIVE_UP])).inProgress).toBe(false);
    expect(v(play(FRESH, [GIVE_UP, UNDO])).inProgress).toBe(false);
    expect(v(WON).inProgress).toBe(false);
    expect(v(GAVE_UP0).inProgress).toBe(false);
    expect(v(GAVE_UP1).inProgress).toBe(false);
  });

  it('AD-3 draft is present iff phase ≠ Idle and Place data iff phase = Place', () => {
    for (const [, session] of STATES) {
      const gameView = v(session);
      const { phase } = session.cursor;
      expect(Object.hasOwn(gameView, 'draft')).toBe(phase !== 'idle');
      expect(Object.hasOwn(gameView, 'place')).toBe(phase === 'place');
    }
  });

  it('AD-3 draft data: S, D, k, side, arrangement, free letters, word, letter count', () => {
    expect(v(K1).draft).toStrictEqual({
      sourceColumn: 1,
      source: [48],
      destinationColumn: 3,
      destination: [0],
      k: 1,
      side: 'left',
      arrangement: [48],
      freeLetters: [],
      word: 'aw',
      letterCount: 2,
      structural: { ok: false, reason: 'too-short' },
    });
    expect(v(FREE).draft).toStrictEqual({
      sourceColumn: 1,
      source: [48],
      destinationColumn: 2,
      destination: [26],
      k: 1,
      side: 'left',
      arrangement: [48, 28],
      freeLetters: [3],
      word: 'mwn',
      letterCount: 3,
      structural: { ok: true },
    });
    expect(v(K0_SELF).draft?.destination).toStrictEqual([]);
    expect(v(PARTIAL_SELF).draft?.source).toStrictEqual([20, 48]);
  });

  it('R-30 draft word on both sides; a right-side D holding QU spells "qu"', () => {
    const left = play(K1, [setK(6)]);
    expect(v(left).draft?.word).toBe('quejataw');
    expect(v(play(left, [FLIP])).draft?.word).toBe('watajequ');
    expect(v(MIDDLE).draft?.word).toBe('jataw');
    expect(v(MIDDLE_RIGHT).draft?.word).toBe('wataj');
  });

  it('AD-3 every word string is lowercase with QU as "qu"', () => {
    const quWon = v(WON);
    expect(quWon.longestWord).toStrictEqual({ spelling: 'lquejata', letterCount: 8 });
    for (const [, session] of STATES) {
      const gameView = v(session);
      for (const text of [
        gameView.draft?.word,
        gameView.pendingDraftWord,
        gameView.longestWord?.spelling,
      ])
        if (text !== undefined) expect(text).toMatch(/^[a-z]+$/);
    }
  });

  it('R-36 structural too-short: QU passes at 2 cards and 3 letters, 2 letters fail', () => {
    const quStart = startOf(['Q', 'I']);
    const qui = viewFrom(quStart, seam(quStart, [drop(2, 1, 1)]), LANG);
    expect(qui.draft).toMatchObject({ word: 'qui', letterCount: 3, structural: { ok: true } });
    expect([...(qui.draft?.destination ?? []), ...(qui.draft?.arrangement ?? [])]).toHaveLength(2);
    expect(qui.canValidate).toBe(true);
    const atStart = startOf(['A', 'T']);
    const at = viewFrom(atStart, seam(atStart, [drop(2, 1, 1)]), LANG);
    expect(at.draft).toMatchObject({
      word: 'at',
      letterCount: 2,
      structural: { ok: false, reason: 'too-short' },
    });
    expect(at.canValidate).toBe(false);
    expect(v(SHORT).draft?.structural).toStrictEqual({ ok: false, reason: 'too-short' });
    expect(v(SHORT).canValidate).toBe(false);
  });
});

// --- scores and end values ---------------------------------------------------------------------

/** WON undone to Idle at index 7 (column 8 back), then given up. */
const GAVE_UP_LATE = play(WON, [UNDO, UNDO, UNDO, GIVE_UP]);

/** Column 3's E J A T A onto its own QU (k = 1), QU placed last so it tops cell 7. */
const QU_TOP = play(
  FRESH,
  [drop(3, 5, 3), VALIDATE, { type: 'setPlacementOrder', order: [8, 21, 2, 42, 0, 35] }, CONFIRM],
  ['quejata'],
);

describe('GameView scores', () => {
  it('R-80 liveScore is scoring.liveScore over the committed WordCells', () => {
    expect(v(FRESH).liveScore).toBe(0);
    expect(v(COL5_DONE).liveScore).toBe(36);
    expect(v(TWO_CELLS).liveScore).toBe(54);
    expect(v(PLACE_R41).liveScore).toBe(54);
    for (const [, session] of STATES)
      expect(v(session).liveScore).toBe(liveScore(replay(session, LANG).cells, LANG));
  });

  it('R-81 displayScore is liveScore while playing, else the final score', () => {
    for (const [, session] of STATES) {
      const gameView = v(session);
      if (gameView.status === 'playing') expect(gameView.displayScore).toBe(gameView.liveScore);
      else expect(gameView.displayScore).toBe(gameView.finalScore);
    }
    // 46 cards left, QU among them: 47 letters (R-81).
    expect(v(GAVE_UP1).displayScore).toBe(36 - 10 * 47);
  });

  it('R-81 finalScore, penalty and lettersLeft are absent while playing and scoring values otherwise', () => {
    for (const session of [FRESH, K1, PLACE_R41, COMMITTED, play(WON, [UNDO])]) {
      const gameView = v(session);
      for (const key of ['finalScore', 'penalty', 'lettersLeft', 'band'])
        expect(Object.hasOwn(gameView, key)).toBe(false);
    }
    for (const session of [WON, GAVE_UP0, GAVE_UP1, GAVE_UP_LATE]) {
      const position = replay(session, LANG);
      const gameView = v(session);
      const gaveUp = gameView.status === 'gaveUp';
      expect(gameView.finalScore).toBe(finalScore(position, gaveUp, LANG));
      expect(gameView.penalty).toBe(penalty(position.columns, LANG));
      expect(gameView.lettersLeft).toBe(lettersLeft(position.columns, LANG));
    }
    const won = v(WON);
    expect(won).toMatchObject({ penalty: 0, lettersLeft: 0 });
    expect(won.displayScore).toBe(won.finalScore);
    expect(v(GAVE_UP_LATE)).toMatchObject({ lettersLeft: 6, penalty: 60 });
  });

  it('R-83 band derives from the final score, not liveScore', () => {
    const late = v(GAVE_UP_LATE);
    expect(late.finalScore).toBe(late.liveScore - 60);
    expect(band(late.liveScore, LANG)).not.toBe(band(late.finalScore as number, LANG));
    expect(late.band).toBe(band(late.finalScore as number, LANG));
    for (const session of [WON, GAVE_UP0, GAVE_UP1]) {
      const gameView = v(session);
      expect(gameView.band).toBe(band(gameView.finalScore as number, LANG));
    }
  });

  it('R-83 longest word is absent with no word', () => {
    for (const session of [FRESH, K1, PENDING0, GAVE_UP0, play(COL5_DONE, [UNDO])])
      expect(Object.hasOwn(v(session), 'longestWord')).toBe(false);
  });

  it('AD-3 wordCount and longestWord read the committed prefix', () => {
    expect(v(COL5_DONE)).toMatchObject({
      wordCount: 1,
      longestWord: { spelling: 'tscfsz', letterCount: 6 },
    });
    expect(v(COMMITTED).wordCount).toBe(3);
    expect(v(WON)).toMatchObject({
      wordCount: 8,
      longestWord: { spelling: 'lquejata', letterCount: 8 },
    });
  });

  it('AD-3 a redo tail, committed or Q-41 uncommitted, is excluded from wordCount and longestWord', () => {
    const long = play(COL5_DONE, [drop(1, 7, 2), setK(3), VALIDATE, CONFIRM], ['vimldxomiw']);
    expect(v(long)).toMatchObject({
      wordCount: 2,
      longestWord: { spelling: 'vimldxomiw', letterCount: 10 },
    });
    // Committed tail: undo to Place, then to an Idle pending committed draft.
    for (const session of [play(long, [UNDO]), play(long, [UNDO, UNDO, UNDO])])
      expect(v(session)).toMatchObject({
        wordCount: 1,
        longestWord: { spelling: 'tscfsz', letterCount: 6 },
      });
    // Committed tail after the draft: WON undone four times is Place at index 6.
    expect(v(play(WON, [UNDO, UNDO, UNDO, UNDO])).wordCount).toBe(6);
    // Q-41: the uncommitted (Place-reached) pending draft is the redo tail.
    const uncommitted = play(
      COL5_DONE,
      [drop(1, 7, 2), setK(3), VALIDATE, UNDO, UNDO],
      ['vimldxomiw'],
    );
    expect(draftOf(uncommitted).reached).toBe('place');
    expect(v(uncommitted)).toMatchObject({
      wordCount: 1,
      longestWord: { spelling: 'tscfsz', letterCount: 6 },
      pendingDraftWord: 'vimldxomiw',
    });
  });

  it('AD-3 a committed word spells R-37 tray order, not its placementOrder', () => {
    expect(draftOf(play(QU_TOP, [UNDO])).placementOrder).toStrictEqual([8, 21, 2, 42, 0, 35]);
    expect(v(QU_TOP).longestWord).toStrictEqual({ spelling: 'quejata', letterCount: 7 });
  });

  it('AD-3 longestWord ties to the earliest (internal longestWord)', () => {
    expect(longestWord([])).toBeUndefined();
    expect(
      longestWord([
        { spelling: 'abc', letterCount: 3 },
        { spelling: 'qui', letterCount: 3 },
        { spelling: 'ab', letterCount: 2 },
      ]),
    ).toStrictEqual({ spelling: 'abc', letterCount: 3 });
  });

  it('AD-3 viewFrom longest word over a D2 start ties a QU word and a plain word to the earliest', () => {
    const start = startOf(['QI', 'ABC', 'DEFG']);
    const quFirst = seam(
      start,
      [drop(1, 2, 1), VALIDATE, CONFIRM, drop(2, 3, 2), VALIDATE, CONFIRM],
      ['qui', 'abc'],
    );
    expect(viewFrom(start, quFirst, LANG)).toMatchObject({
      wordCount: 2,
      longestWord: { spelling: 'qui', letterCount: 3 },
    });
    const plainFirst = seam(
      start,
      [drop(2, 3, 2), VALIDATE, CONFIRM, drop(1, 2, 1), VALIDATE, CONFIRM],
      ['qui', 'abc'],
    );
    expect(viewFrom(start, plainFirst, LANG).longestWord).toStrictEqual({
      spelling: 'abc',
      letterCount: 3,
    });
    const longer = seam(start, [drop(3, 4, 3), VALIDATE, CONFIRM], ['defg']);
    expect(viewFrom(start, longer, LANG).longestWord).toStrictEqual({
      spelling: 'defg',
      letterCount: 4,
    });
  });

  it('AD-3 pendingDraftWord only while playing and Idle with moves[cursor.index]', () => {
    const undoneFree = play(FREE, [UNDO]);
    const undoneCommitted = play(COMMITTED, [UNDO, UNDO, UNDO]);
    expect(draftOf(undoneCommitted).reached).toBe('committed');
    for (const session of [undoneFree, undoneCommitted]) {
      const gameView = v(session);
      expect(gameView.pendingDraftWord).toBe('mwn');
      for (const cell of gameView.cells) expect(cell.used).toBe(false);
    }
    expect(v(PENDING0).pendingDraftWord).toBe('aw');
    for (const session of [FRESH, COMMITTED, GAVE_UP0, K1, PLACE_R41, WON])
      expect(Object.hasOwn(v(session), 'pendingDraftWord')).toBe(false);
  });
});

// --- Place ---------------------------------------------------------------------------------------

describe('GameView Place data', () => {
  it('AD-3 Place data: legal targets, target, placement order', () => {
    expect(v(PLACE_R41).place).toStrictEqual({
      legalTargets: [3],
      target: 3,
      placementOrder: [26, 48, 28],
      scoreDelta: 6,
    });
  });

  it('AD-3 legal targets: L = 3 from a 2-card QU word gives cell 3; L = 10 gives 3–10', () => {
    const start = startOf(['Q', 'I']);
    const qu = viewFrom(start, seam(start, [drop(2, 1, 1), VALIDATE], ['qui']), LANG);
    expect(qu.place?.legalTargets).toStrictEqual([3]);
    const ten = v(play(FRESH, [drop(1, 7, 2), setK(3), VALIDATE], ['vimldxomiw']));
    expect(ten.draft?.letterCount).toBe(10);
    expect(ten.place?.legalTargets).toStrictEqual(WORD_CELL_NUMBERS);
    expect(ten.cells.map((c) => c.isLegalTarget)).toStrictEqual(WORD_CELL_NUMBERS.map(() => true));
    // L = 11: ten cards with QU; the validate default target is 10 (R-42), scoreDelta per D6.
    const elevenStart = startOf(['QABCDEFGH', 'I']);
    const eleven = viewFrom(
      elevenStart,
      seam(elevenStart, [drop(2, 1, 1), setK(9), VALIDATE], ['quabcdefghi']),
      LANG,
    );
    expect(eleven.draft).toMatchObject({ word: 'quabcdefghi', letterCount: 11 });
    expect(eleven.place).toMatchObject({
      legalTargets: WORD_CELL_NUMBERS,
      target: 10,
      scoreDelta: 11 * 10,
    });
  });

  it('AD-3 D6 scoreDelta equals the live-score change of the commit (QU free letter, R-41, ≤ 0)', () => {
    expect(cellOf(v(QU_TOP), 7).cards.at(-1)).toBe(35);
    const quFree = play(QU_TOP, [drop(1, 1, 2), addFree(7), VALIDATE], ['mwqu']);
    expect(v(quFree).draft?.word).toBe('mwqu');
    const lowTarget = play(quFree, [setTarget(3)]);
    const cases: readonly (readonly [Session, number])[] = [
      [quFree, 4 * 4 - 2 * 7],
      [lowTarget, 4 * 3 - 2 * 7],
      [PLACE_R41, 3 * 3 - 1 * 3],
      [PLACE_FROM_IDLE, 3 * 3 - 1 * 3],
    ];
    for (const [session, delta] of cases) {
      const before = v(session);
      expect(before.place?.scoreDelta).toBe(delta);
      const after = v(play(session, [CONFIRM]));
      expect(after.liveScore - before.liveScore).toBe(delta);
    }
    expect(v(lowTarget).place?.scoreDelta).toBeLessThanOrEqual(0);
  });

  it('AD-3 D6 A-E14: BALKED with cell 6’s L onto cell 6 previews +30, the commit’s live-score change', () => {
    // §8 worked example start (commands.test.ts): F E D K A | X O R I N | L M F B, cell 6 = L.
    const start = startOf(['FEDKA', 'XORIN', 'LMFB'], { 6: 'L' });
    const [, e, d, k, a] = start.columns[0];
    const [l] = start.cells[3];
    const arrange: Command = { type: 'arrange', arrangement: [a, l, k, e, d] };
    const balked = seam(start, [drop(1, 4, 3), addFree(6), arrange, VALIDATE], ['balked']);
    const before = viewFrom(start, balked, LANG);
    expect(before.draft?.word).toBe('balked');
    expect(before.place).toMatchObject({ target: 6, scoreDelta: 30 });
    const after = viewFrom(
      start,
      seam(start, [drop(1, 4, 3), addFree(6), arrange, VALIDATE, CONFIRM], ['balked']),
      LANG,
    );
    expect(after.liveScore - before.liveScore).toBe(30);
  });

  it('AD-3 isLegalTarget and used in all three phases', () => {
    const idle = v(play(FREE, [UNDO]));
    for (const cell of idle.cells)
      expect([cell.used, cell.isLegalTarget]).toStrictEqual([false, false]);
    const composing = v(FREE);
    for (const cell of composing.cells) {
      expect(cell.used).toBe(cell.cell === 3);
      expect(cell.isLegalTarget).toBe(false);
    }
    const place = v(PLACE_R41);
    for (const cell of place.cells) {
      expect(cell.used).toBe(cell.cell === 3);
      expect(cell.isLegalTarget).toBe(place.place?.legalTargets.includes(cell.cell));
    }
  });

  it('AD-3 R-41 Place: target on the free letter cell; cells above L are not legal', () => {
    const place = v(PLACE_R41);
    expect(place.draft?.letterCount).toBe(3);
    expect(place.place?.target).toBe(3);
    expect(cellOf(place, 3)).toMatchObject({
      used: true,
      isLegalTarget: true,
      canSetTarget: false,
    });
    for (const cell of place.cells.filter((c) => c.cell > 3))
      expect([cell.isLegalTarget, cell.canSetTarget]).toStrictEqual([false, false]);
  });
});

// --- R-31, R-33 --------------------------------------------------------------------------------

const TAP_STATES: readonly Session[] = [
  K1,
  play(K1, [FLIP]),
  MIDDLE,
  MIDDLE_RIGHT,
  KN,
  play(KN, [FLIP]),
  N1,
  N1_RIGHT,
  PARTIAL_SELF,
  PARTIAL_SELF_RIGHT,
  FREE,
  play(FREE, [FLIP]),
];

describe('GameView R-31 and R-33', () => {
  it('R-31 canDecK and canIncK at the bounds of 1…n', () => {
    expect([v(K1).canDecK, v(K1).canIncK]).toStrictEqual([false, true]);
    expect([v(MIDDLE).canDecK, v(MIDDLE).canIncK]).toStrictEqual([true, true]);
    expect([v(KN).canDecK, v(KN).canIncK]).toStrictEqual([true, false]);
    const n1 = v(N1);
    expect([n1.canDecK, n1.canIncK, n1.canFlip]).toStrictEqual([false, false, true]);
    expect(columnOf(n1, 1).canTapForK).toBe(false);
    expect(columnOf(n1, 1).kIfTapped).toStrictEqual(new Map([[24, null]]));
  });

  it('R-31 empty destination (k = 0): no k or side control, kIfTapped empty', () => {
    for (const [session, destination] of [
      [K0_SELF, 1],
      [K0_EMPTY, 5],
    ] as const) {
      const gameView = v(session);
      expect(gameView.draft?.k).toBe(0);
      expect([gameView.canDecK, gameView.canIncK, gameView.canFlip]).toStrictEqual([
        false,
        false,
        false,
      ]);
      expect(columnOf(gameView, destination).canTapForK).toBe(false);
      const kIfTapped = columnOf(gameView, destination).kIfTapped;
      expect(kIfTapped).toBeInstanceOf(Map);
      expect(kIfTapped?.size).toBe(0);
    }
  });

  it('R-31 kIfTapped matches apply(tapDestinationCard) for every CardId, both sides', () => {
    for (const session of TAP_STATES) {
      const gameView = v(session);
      const { destinationColumn } = draftOf(session);
      const kIfTapped = columnOf(gameView, destinationColumn).kIfTapped;
      expect([...(kIfTapped?.keys() ?? [])]).toStrictEqual(remainderOf(session));
      for (const card of ALL_CARDS) {
        if (kIfTapped?.has(card)) {
          const result = apply(session, tap(card), CTX).session;
          expect(kIfTapped.get(card)).toBe(
            result === session ? null : draftOf(result).destinationCount,
          );
        } else {
          expectEngineError(() => apply(session, tap(card), CTX), 'r31-tap-not-in-destination');
        }
      }
      for (const column of gameView.columns)
        if (column.column !== destinationColumn)
          expect(Object.hasOwn(column, 'kIfTapped')).toBe(false);
    }
  });

  it('R-31 kIfTapped exists only on the destination column in Composing', () => {
    for (const [, session] of STATES) {
      const gameView = v(session);
      const destination =
        session.cursor.phase === 'composing' ? draftOf(session).destinationColumn : 0;
      for (const column of gameView.columns)
        expect(Object.hasOwn(column, 'kIfTapped')).toBe(column.column === destination);
    }
  });

  it('R-31 a self-drop leaves the S cards out of kIfTapped', () => {
    const kIfTapped = columnOf(v(PARTIAL_SELF), 1).kIfTapped;
    expect([...(kIfTapped?.keys() ?? [])]).toStrictEqual([24, 6, 49, 30, 25]);
    expect(kIfTapped?.has(20)).toBe(false);
    expect(kIfTapped?.has(48)).toBe(false);
  });

  it('R-33 canAddFreeLetter is false on a used or empty WordCell', () => {
    const gameView = v(FREE);
    expect(cellOf(gameView, 3)).toMatchObject({ used: true, canAddFreeLetter: false });
    expect(cellOf(gameView, 6)).toMatchObject({ used: false, canAddFreeLetter: true });
    for (const cell of [4, 5, 7, 8, 9, 10] as const)
      expect(cellOf(gameView, cell)).toMatchObject({ cards: [], canAddFreeLetter: false });
  });
});

// --- flag agreement (build-notes CAP-7), one test per flag --------------------------------------

describe('GameView flags agree with apply', () => {
  it.each(STATES)('AD-3 canPickUp agrees with drop sourceCount 1: %s', (_, session) => {
    const gameView = v(session);
    for (const c of COLUMNS)
      expect(columnOf(gameView, c).canPickUp).toBe(
        COLUMNS.some((d) => changes(session, drop(c, 1, d))),
      );
  });

  it.each(STATES)('AD-3 canDropOn agrees with drop from some source: %s', (_, session) => {
    const gameView = v(session);
    const sizes = replay(session, LANG).columns.map((column) => Math.max(1, column.length));
    for (const c of COLUMNS)
      expect(columnOf(gameView, c).canDropOn).toBe(
        COLUMNS.some((s) =>
          Array.from({ length: sizes[s - 1] }, (_, i) => i + 1).some((count) =>
            changes(session, drop(s, count, c)),
          ),
        ),
      );
  });

  it.each(STATES)('AD-3 canTapForK agrees with tapDestinationCard: %s', (_, session) => {
    const gameView = v(session);
    const position = replay(session, LANG);
    for (const c of COLUMNS)
      expect(columnOf(gameView, c).canTapForK).toBe(
        ALL_CARDS.some(
          (card) => position.columns[c - 1].includes(card) && changes(session, tap(card)),
        ),
      );
    // A card outside every column never changes k.
    for (const card of ALL_CARDS.filter((x) => !position.columns.flat().includes(x)))
      expect(changes(session, tap(card))).toBe(false);
  });

  const kOf = (session: Session): number =>
    session.cursor.phase === 'idle' ? 1 : draftOf(session).destinationCount;

  it.each(STATES)('AD-3 canDecK agrees with setDestinationCount k − 1: %s', (_, session) => {
    expect(v(session).canDecK).toBe(changes(session, setK(kOf(session) - 1)));
  });

  it.each(STATES)('AD-3 canIncK agrees with setDestinationCount k + 1: %s', (_, session) => {
    expect(v(session).canIncK).toBe(changes(session, setK(kOf(session) + 1)));
  });

  it.each(STATES)('AD-3 canFlip agrees with flip: %s', (_, session) => {
    expect(v(session).canFlip).toBe(changes(session, FLIP));
  });

  it.each(STATES)('AD-3 canAddFreeLetter agrees with addFreeLetter: %s', (_, session) => {
    const gameView = v(session);
    for (const cell of WORD_CELL_NUMBERS)
      expect(cellOf(gameView, cell).canAddFreeLetter).toBe(changes(session, addFree(cell)));
  });

  it.each(STATES)('AD-3 canSetTarget agrees with setTarget: %s', (_, session) => {
    const gameView = v(session);
    for (const cell of WORD_CELL_NUMBERS)
      expect(cellOf(gameView, cell).canSetTarget).toBe(changes(session, setTarget(cell)));
  });

  it.each(STATES)('AD-3 canConfirm agrees with confirm: %s', (_, session) => {
    expect(v(session).canConfirm).toBe(changes(session, CONFIRM));
  });

  it.each(STATES)('AD-3 canUndo agrees with undo: %s', (_, session) => {
    expect(v(session).canUndo).toBe(changes(session, UNDO));
  });

  it.each(STATES)('AD-3 canRedo agrees with redo: %s', (_, session) => {
    expect(v(session).canRedo).toBe(changes(session, REDO));
  });

  it.each(STATES)('AD-3 canGiveUp agrees with giveUp: %s', (_, session) => {
    expect(v(session).canGiveUp).toBe(changes(session, GIVE_UP));
  });

  it.each(STATES)('AD-3 canValidate agrees with validate: %s', (_, session) => {
    const words =
      session.cursor.phase === 'idle'
        ? []
        : [word(replay(session, LANG), draftOf(session), LANG).spelling];
    expect(v(session).canValidate).toBe(changes(session, VALIDATE, DICT(...words)));
  });

  it('AD-3 in each canValidate false state validate throws the expected check', () => {
    const checkOf = (session: Session): string => {
      const gameView = v(session);
      if (gameView.status !== 'playing') return 'command-status';
      if (gameView.phase !== 'composing') return 'command-phase';
      return 'r36-letter-count';
    };
    for (const [, session] of STATES) {
      if (v(session).canValidate) continue;
      const words =
        session.cursor.phase === 'idle'
          ? []
          : [word(replay(session, LANG), draftOf(session), LANG).spelling];
      expectEngineError(() => apply(session, VALIDATE, DICT(...words)), checkOf(session));
    }
    expect(STATES.filter(([, s]) => !v(s).canValidate).map(([, s]) => checkOf(s))).toEqual(
      expect.arrayContaining(['command-status', 'command-phase', 'r36-letter-count']),
    );
  });
});

// --- plain data, rejection -----------------------------------------------------------------------

describe('GameView contract', () => {
  it('AD-3 view is plain data and survives structuredClone, arguments unmutated', () => {
    for (const [, session] of STATES) {
      const gameView = v(session);
      expect(v(structuredClone(session))).toStrictEqual(gameView);
      expect(structuredClone(gameView)).toStrictEqual(gameView);
      for (const part of [gameView, gameView.draft ?? {}, gameView.place ?? {}])
        expect(Object.values(part)).not.toContain(undefined);
      expect(Object.isFrozen(session) && Object.isFrozen(LANG)).toBe(true);
    }
  });

  it('AD-3 view throws the replay check for an r31-destination-count draft or redo-tail move', () => {
    const badDraft = deepFreeze({
      ...K1,
      moves: [{ ...draftOf(K1), destinationCount: 8 }],
    });
    expectEngineError(() => replay(badDraft, LANG), 'r31-destination-count');
    expectEngineError(() => v(badDraft), 'r31-destination-count');
    const withTail = play(WON, [UNDO, UNDO, UNDO, UNDO]);
    expect(withTail.cursor).toStrictEqual({ index: 6, phase: 'place' });
    const badTail = deepFreeze({
      ...withTail,
      moves: withTail.moves.map((m, i) => (i === 7 ? { ...m, destinationCount: 1 } : m)),
    });
    expectEngineError(() => replay(badTail, LANG), 'r31-destination-count');
    expectEngineError(() => v(badTail), 'r31-destination-count');
  });
});
