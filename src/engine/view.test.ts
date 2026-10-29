import { describe, expect, it } from 'vitest';
import placeFixture from '../../fixtures/session-place.json' with { type: 'json' };
import placeCompact from '../../fixtures/session-place-compact.json' with { type: 'json' };
import placeFreeLetterRedoTail from '../../fixtures/session-place-free-letter-redo-tail.json' with {
  type: 'json',
};
import placeFreeLetterTwoCards from '../../fixtures/session-place-free-letter-two-cards.json' with {
  type: 'json',
};
import placeLong from '../../fixtures/session-place-long.json' with { type: 'json' };
import placeOntoCommitted from '../../fixtures/session-place-onto-committed.json' with {
  type: 'json',
};
import placeUsedCells from '../../fixtures/session-place-used-cells.json' with { type: 'json' };
import { type ApplyContext, apply, applyFrom, type Command } from './commands';
import { EngineError } from './errors';
import { gameRecord } from './history';
import { EN } from './lang/en';
import { replay, type Start } from './replay';
import { destinationRemainder, word } from './rules';
import { band, finalScore, lettersLeft, liveScore, penalty } from './scoring';
import { parseSession } from './serialize';
import { createSession, type Session } from './session';
import { DICT, deepFreeze, draftOf, drop, play, startOf } from './test-helpers';
import { type CardId, WORD_CELL_NUMBERS, type WordCellNumber } from './types';
import { type GameView, longestWord, view, viewFrom } from './view';
import { winSeed } from './win-seed';

// --- helpers (shared ones in test-helpers.ts; tests never import another test file) ------------

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

const LANG = deepFreeze(EN);
const CTX: ApplyContext = deepFreeze({ lang: LANG });

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
const columnOf = (gameView: GameView, column: number) => gameView.columns[column - 1];
const cellOf = (gameView: GameView, cell: WordCellNumber) => gameView.cells[cell - 3];

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
/** WON undone six times: Idle at index 6, committed pending moves[6], redo tail moves[7]. */
const PENDING_TAIL = play(WON, [UNDO, UNDO, UNDO, UNDO, UNDO, UNDO]);
/** COMMITTED undone three times: Idle at index 2, committed pending moves[2], no redo tail. */
const PENDING_COMMITTED = play(COMMITTED, [UNDO, UNDO, UNDO]);

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
  ['Idle with a committed pending draft and a redo tail', PENDING_TAIL],
  ['Idle with a committed pending draft, no redo tail', PENDING_COMMITTED],
  ['won', WON],
  ['gaveUp at index 0 with a pending draft', GAVE_UP0],
  ['gaveUp at index > 0', GAVE_UP1],
];

/** Per-fixture status of the STATES that are not playing (§2), independent of the view. */
const OVER: ReadonlyMap<Session, 'won' | 'gaveUp'> = new Map([
  [WON, 'won'],
  [GAVE_UP0, 'gaveUp'],
  [GAVE_UP1, 'gaveUp'],
]);

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
      wordCards: [0, 48],
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
      wordCards: [26, 48, 28],
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

  it('R-30 R-36 R-37 wordCards: D then M on the left, M then D reversed on the right; QU is one card of 2 letters spelt qu', () => {
    const left = v(play(K1, [setK(6)])).draft;
    expect(left?.wordCards).toStrictEqual([35, 8, 21, 2, 42, 0, 48]);
    expect(left?.word).toBe('quejataw');
    expect(left?.letterCount).toBe(8);
    expect(left?.wordCards.map((card) => LANG.letters[card]).join('')).toBe('QUEJATAW');
    const right = v(play(K1, [setK(6), FLIP])).draft;
    expect(right?.wordCards).toStrictEqual([48, 0, 42, 2, 21, 8, 35]);
    expect(right?.word).toBe('watajequ');
    expect(right?.letterCount).toBe(8);
    expect(v(MIDDLE_RIGHT).draft?.wordCards).toStrictEqual([48, 0, 42, 2, 21]);
  });

  it('R-30 wordCards at k = 0 is the arrangement', () => {
    for (const session of [K0_SELF, K0_EMPTY]) {
      const draft = v(session).draft;
      expect(draft?.k).toBe(0);
      expect(draft?.wordCards).toStrictEqual(draft?.arrangement);
    }
  });

  it('R-30 Place keeps wordCards in word order after setPlacementOrder to a non-word order', () => {
    const place = play(FRESH, [drop(3, 5, 3), VALIDATE], ['quejata']);
    const wordOrder = [35, 8, 21, 2, 42, 0];
    expect(v(place).draft?.wordCards).toStrictEqual(wordOrder);
    const order = [8, 21, 2, 42, 0, 35];
    const reordered = v(play(place, [{ type: 'setPlacementOrder', order }]));
    expect(reordered.place?.placementOrder).toStrictEqual(order);
    expect(reordered.draft?.wordCards).toStrictEqual(wordOrder);
    expect(reordered.draft?.word).toBe('quejata');
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
      expect(cell.isLegalTarget).toBe(cell.cell === 3);
    }
    for (const session of [PLACE_R41, PLACE_FROM_IDLE, PLACE_L10])
      for (const cell of v(session).cells) {
        let legal = true;
        try {
          apply(session, setTarget(cell.cell), CTX);
        } catch (e) {
          if (!(e instanceof EngineError && e.check === 'r40-target-cell')) throw e;
          legal = false;
        }
        expect(cell.isLegalTarget).toBe(legal);
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

// --- Q-49 place preview --------------------------------------------------------------------------

describe('GameView Q-49 place preview', () => {
  /** A fixture parsed through §2 (fixtures are imported loosely typed), asserted ok. */
  const parsed = (fixture: unknown): Session => {
    const result = parseSession(JSON.stringify(fixture), EN);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(`fixture does not parse: ${result.reason}`);
    return deepFreeze(result.session);
  };
  const setOrder = (order: readonly CardId[]): Command => ({ type: 'setPlacementOrder', order });
  const hasPreview = (gameView: GameView, cell: WordCellNumber) =>
    Object.hasOwn(cellOf(gameView, cell), 'preview');

  /**
   * Design Notes only-card position: D and E single-card cells, a whole-column self-drop (k = 0)
   * of A B C, both used as free letters; Place with default target 5 (L = 5).
   */
  const ONLY = startOf(['ABC'], { 3: 'D', 4: 'E' });
  const ONLY_DRAFT: readonly Command[] = [drop(1, 3, 1), addFree(3), addFree(4)];
  const onlyView = (extra: readonly Command[] = []): GameView => {
    const spelling = viewFrom(ONLY, seam(ONLY, ONLY_DRAFT), LANG).draft?.word;
    expect(spelling).toBe('abcde');
    if (spelling === undefined) throw new Error('no draft');
    return viewFrom(ONLY, seam(ONLY, [...ONLY_DRAFT, VALIDATE, ...extra], [spelling]), LANG);
  };

  it('Q-49 AD-3 an unused target previews its cards plus the placement order, used false', () => {
    const onto = v(parsed(placeOntoCommitted));
    expect(onto.place?.target).toBe(3);
    expect(cellOf(onto, 3)).toMatchObject({ cards: [42, 0, 28], used: false });
    expect(cellOf(onto, 3).preview).toStrictEqual({ top: 26, count: 6 });
    const fresh = v(parsed(placeFixture));
    expect(fresh.place?.target).toBe(3);
    expect(cellOf(fresh, 3)).toMatchObject({ cards: [], used: false });
    expect(cellOf(fresh, 3).preview).toStrictEqual({ top: 28, count: 3 });
  });

  it('Q-49 AD-3 R-41 a used target with cards beneath previews them minus its top plus the placement order', () => {
    const redoTail = v(parsed(placeFreeLetterRedoTail));
    expect(redoTail.place).toMatchObject({ target: 3, placementOrder: [9, 32, 28] });
    expect(cellOf(redoTail, 3)).toMatchObject({ cards: [42, 0, 28], used: true });
    expect(cellOf(redoTail, 3).preview).toStrictEqual({ top: 28, count: 5 });
    const r41 = v(PLACE_R41);
    expect(r41.place).toMatchObject({ target: 3, placementOrder: [26, 48, 28] });
    expect(cellOf(r41, 3)).toMatchObject({ cards: [31, 34, 27, 1, 9, 28], used: true });
    expect(cellOf(r41, 3).preview).toStrictEqual({ top: 28, count: 8 });
  });

  it('Q-49 AD-3 R-41 a used target holding only its used card previews count = placement order length', () => {
    const gameView = onlyView([setTarget(3)]);
    expect(gameView.place).toMatchObject({ target: 3, placementOrder: [0, 3, 4, 6, 8] });
    expect(cellOf(gameView, 3)).toMatchObject({ cards: [6], used: true });
    expect(cellOf(gameView, 3).preview).toStrictEqual({ top: 8, count: 5 });
    expect(cellOf(gameView, 4)).toMatchObject({ cards: [8], used: true });
    expect(cellOf(gameView, 4).preview).toStrictEqual({ top: null, count: 0 });
  });

  it('Q-49 AD-3 a used non-target with cards beneath previews the card beneath', () => {
    const twoCards = v(parsed(placeFreeLetterTwoCards));
    expect(twoCards.place?.target).toBe(5);
    expect(cellOf(twoCards, 4)).toMatchObject({ cards: [20, 28], used: true });
    expect(cellOf(twoCards, 4).preview).toStrictEqual({ top: 20, count: 1 });
    const compact = v(parsed(placeCompact));
    expect(compact.place?.target).toBe(9);
    expect(cellOf(compact, 4)).toMatchObject({ cards: [20, 28, 35], used: true });
    expect(cellOf(compact, 4).preview).toStrictEqual({ top: 28, count: 2 });
    const long = v(parsed(placeLong));
    expect(long.place?.target).toBe(10);
    expect(cellOf(long, 3)).toMatchObject({ cards: [42, 0, 28], used: true });
    expect(cellOf(long, 3).preview).toStrictEqual({ top: 0, count: 2 });
  });

  it('Q-49 AD-3 two used single-card cells, neither the target, each preview an empty cell', () => {
    const gameView = onlyView();
    expect(gameView.place).toMatchObject({ target: 5, placementOrder: [0, 3, 4, 6, 8] });
    expect(cellOf(gameView, 3)).toMatchObject({ cards: [6], used: true });
    expect(cellOf(gameView, 3).preview).toStrictEqual({ top: null, count: 0 });
    expect(cellOf(gameView, 4)).toMatchObject({ cards: [8], used: true });
    expect(cellOf(gameView, 4).preview).toStrictEqual({ top: null, count: 0 });
    expect(cellOf(gameView, 5)).toMatchObject({ cards: [], used: false });
    expect(cellOf(gameView, 5).preview).toStrictEqual({ top: 8, count: 5 });
  });

  it('Q-49 AD-3 count is the card count, not the R-85 letter count (-compact, QU 35)', () => {
    const compact = v(parsed(placeCompact));
    expect(compact.place).toMatchObject({
      target: 9,
      placementOrder: [35, 1, 38, 44, 11, 36, 9, 7],
    });
    expect(compact.draft?.letterCount).toBe(9);
    expect(cellOf(compact, 9)).toMatchObject({ cards: [], used: false });
    expect(cellOf(compact, 9).preview).toStrictEqual({ top: 7, count: 8 });
  });

  it('Q-49 AD-3 setTarget from an unused target: it loses preview, the new target previews', () => {
    const base = parsed(placeFreeLetterTwoCards);
    const moved = v(play(base, [setTarget(3)]));
    expect(moved.place).toMatchObject({ target: 3, placementOrder: [26, 32, 45, 28, 42] });
    expect(hasPreview(moved, 5)).toBe(false);
    expect(cellOf(moved, 3)).toMatchObject({ cards: [], used: false });
    expect(cellOf(moved, 3).preview).toStrictEqual({ top: 42, count: 5 });
    expect(cellOf(moved, 4).preview).toStrictEqual({ top: 20, count: 1 });
  });

  it('Q-49 AD-3 setTarget from a used target with cards beneath gives it the card beneath', () => {
    // -free-letter-redo-tail has L = 3, so 3 is its only legal target; -compact (L = 9) has used
    // cell 4 with cards beneath.
    const asTarget = play(parsed(placeCompact), [setTarget(4)]);
    expect(cellOf(v(asTarget), 4).preview).toStrictEqual({ top: 7, count: 10 });
    const away = v(play(asTarget, [setTarget(5)]));
    expect(away.place?.target).toBe(5);
    expect(cellOf(away, 4)).toMatchObject({ cards: [20, 28, 35], used: true });
    expect(cellOf(away, 4).preview).toStrictEqual({ top: 28, count: 2 });
    expect(cellOf(away, 5).preview).toStrictEqual({ top: 7, count: 8 });
  });

  it('Q-49 AD-3 setTarget from a used target holding only its used card gives it top null', () => {
    const away = onlyView([setTarget(3), setTarget(5)]);
    expect(away.place?.target).toBe(5);
    expect(cellOf(away, 3)).toMatchObject({ cards: [6], used: true });
    expect(cellOf(away, 3).preview).toStrictEqual({ top: null, count: 0 });
    expect(cellOf(away, 5).preview).toStrictEqual({ top: 8, count: 5 });
  });

  it('Q-49 AD-3 a reversed setPlacementOrder changes only the target top', () => {
    const states = [
      ...[
        placeFixture,
        placeCompact,
        placeLong,
        placeOntoCommitted,
        placeFreeLetterTwoCards,
        placeFreeLetterRedoTail,
        placeUsedCells,
      ].map(parsed),
      PLACE_R41,
      PLACE_FROM_IDLE,
      PLACE_L10,
    ];
    for (const session of states) {
      const before = v(session);
      const place = before.place;
      if (place === undefined) throw new Error('not Place');
      const after = v(play(session, [setOrder([...place.placementOrder].reverse())]));
      for (const cell of WORD_CELL_NUMBERS) {
        const preview = cellOf(before, cell).preview;
        if (cell === place.target)
          expect(cellOf(after, cell).preview).toStrictEqual({
            top: place.placementOrder[0],
            count: preview?.count,
          });
        else expect(cellOf(after, cell).preview).toStrictEqual(preview);
      }
    }
  });

  it('Q-49 AD-3 preview is absent on unchanged cells in Place and outside Place', () => {
    const twoCards = v(parsed(placeFreeLetterTwoCards));
    for (const cell of [3, 6, 7, 8, 9, 10] as const) expect(hasPreview(twoCards, cell)).toBe(false);
    // Cell 9 is non-empty and unchanged by the commit: a non-empty cell alone carries no preview.
    expect(cellOf(twoCards, 9).cards).toHaveLength(8);
    for (const session of [FREE, COMPOSING_FROM_PLACE]) {
      const gameView = v(session);
      expect(gameView.phase).toBe('composing');
      expect(cellOf(gameView, 3).used).toBe(true);
      expect(hasPreview(gameView, 3)).toBe(false);
    }
    const idleFromPlace = play(PLACE_R41, [UNDO, UNDO]);
    expect(idleFromPlace.cursor.phase).toBe('idle');
    expect(draftOf(idleFromPlace).reached).toBe('place');
    for (const session of [PENDING_COMMITTED, PENDING_TAIL])
      expect(draftOf(session).reached).toBe('committed');
    for (const session of [
      FRESH,
      FREE,
      COMPOSING_FROM_PLACE,
      idleFromPlace,
      PENDING_COMMITTED,
      PENDING_TAIL,
      WON,
      GAVE_UP0,
      GAVE_UP1,
    ])
      for (const cell of v(session).cells) expect(Object.hasOwn(cell, 'preview')).toBe(false);
  });

  it('Q-49 AD-3 preview is present iff the cell changes on confirm, with its top and count after', () => {
    const bases = [
      ...[
        placeFixture,
        placeCompact,
        placeLong,
        placeOntoCommitted,
        placeFreeLetterTwoCards,
        placeFreeLetterRedoTail,
        placeUsedCells,
      ].map(parsed),
      PLACE_R41,
      PLACE_FROM_IDLE,
      PLACE_L10,
      play(COMPOSING_FROM_PLACE, [REDO]),
    ];
    let checked = 0;
    for (const base of bases) {
      const place = v(base).place;
      if (place === undefined) throw new Error('not Place');
      const variants = [
        base,
        ...place.legalTargets
          .filter((t) => t !== place.target)
          .map((t) => play(base, [setTarget(t)])),
        play(base, [setOrder([...place.placementOrder].reverse())]),
      ];
      for (const session of variants) {
        const before = v(session);
        const after = v(play(session, [CONFIRM]));
        for (const cell of WORD_CELL_NUMBERS) {
          const was = cellOf(before, cell);
          const now = cellOf(after, cell).cards;
          const changed = JSON.stringify(was.cards) !== JSON.stringify(now);
          expect(Object.hasOwn(was, 'preview')).toBe(changed);
          if (changed)
            expect(was.preview).toStrictEqual({ top: now.at(-1) ?? null, count: now.length });
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
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
  K0_SELF,
  K0_EMPTY,
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
      if (OVER.has(session)) return 'command-status';
      if (session.cursor.phase !== 'composing') return 'command-phase';
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

// --- STATES labels (build-notes CAP-7) ----------------------------------------------------------

/** Each STATES label's named property, read from the Session, replay and the view. */
const LABELLED: Readonly<Record<string, (session: Session, gameView: GameView) => void>> = {
  'fresh Idle': (s) => {
    expect(s.moves).toStrictEqual([]);
    expect(s.cursor).toStrictEqual({ index: 0, phase: 'idle' });
  },
  'Idle with a pending draft': (s) => {
    expect(s.cursor.phase).toBe('idle');
    expect(draftOf(s)).toBeDefined();
    expect(draftOf(s).reached).toBe('composing');
  },
  'Idle with an empty column after a committed move': (s) => {
    expect(s.cursor).toStrictEqual({ index: 1, phase: 'idle' });
    expect(replay(s, LANG).columns.some((column) => column.length === 0)).toBe(true);
  },
  'Idle with two used WordCells': (s) => {
    expect(s.cursor.phase).toBe('idle');
    expect(replay(s, LANG).cells.filter((cell) => cell.length > 0)).toHaveLength(2);
  },
  'Composing k = 1': (s) => {
    expect(s.cursor.phase).toBe('composing');
    expect(draftOf(s).destinationCount).toBe(1);
    expect(remainderOf(s).length).toBeGreaterThan(1);
  },
  'Composing middle k': (s) => {
    expect(s.cursor.phase).toBe('composing');
    const k = draftOf(s).destinationCount;
    expect(k > 1 && k < remainderOf(s).length).toBe(true);
    expect(draftOf(s).destinationSide).toBe('left');
  },
  'Composing middle k, right side': (s) => {
    expect(s.cursor.phase).toBe('composing');
    const k = draftOf(s).destinationCount;
    expect(k > 1 && k < remainderOf(s).length).toBe(true);
    expect(draftOf(s).destinationSide).toBe('right');
  },
  'Composing k = n': (s) => {
    expect(s.cursor.phase).toBe('composing');
    expect(draftOf(s).destinationCount).toBe(remainderOf(s).length);
    expect(remainderOf(s).length).toBeGreaterThan(1);
  },
  'Composing k = n − 1': (s) => {
    expect(s.cursor.phase).toBe('composing');
    expect(draftOf(s).destinationCount).toBe(remainderOf(s).length - 1);
    expect(draftOf(s).destinationCount).toBeGreaterThan(0);
  },
  'Composing n = 1': (s) => {
    expect(s.cursor.phase).toBe('composing');
    expect(remainderOf(s)).toHaveLength(1);
    expect(draftOf(s).destinationSide).toBe('left');
  },
  'Composing n = 1, right side': (s) => {
    expect(s.cursor.phase).toBe('composing');
    expect(remainderOf(s)).toHaveLength(1);
    expect(draftOf(s).destinationSide).toBe('right');
  },
  'Composing k = 0, whole-column self-drop': (s) => {
    expect(s.cursor.phase).toBe('composing');
    const draft = draftOf(s);
    expect(draft.destinationCount).toBe(0);
    expect(draft.destinationColumn).toBe(draft.sourceColumn);
    expect(draft.sourceCount).toBe(replay(s, LANG).columns[draft.sourceColumn - 1].length);
  },
  'Composing k = 0, empty destination': (s) => {
    expect(s.cursor.phase).toBe('composing');
    const draft = draftOf(s);
    expect(draft.destinationCount).toBe(0);
    expect(draft.destinationColumn).not.toBe(draft.sourceColumn);
    expect(replay(s, LANG).columns[draft.destinationColumn - 1]).toStrictEqual([]);
  },
  'Composing partial self-drop': (s) => {
    expect(s.cursor.phase).toBe('composing');
    expect(draftOf(s).destinationColumn).toBe(draftOf(s).sourceColumn);
    expect(draftOf(s).sourceCount).toBeLessThan(
      replay(s, LANG).columns[draftOf(s).sourceColumn - 1].length,
    );
    expect(remainderOf(s).length).toBeGreaterThan(0);
  },
  'Composing too short': (s, gv) => {
    expect(s.cursor.phase).toBe('composing');
    expect(gv.draft?.letterCount).toBeLessThan(3);
  },
  'Composing with a used free letter': (s) => {
    expect(s.cursor.phase).toBe('composing');
    expect(draftOf(s).freeLetters.length).toBeGreaterThan(0);
  },
  'Composing reached by undo from Place': (s, gv) => {
    expect(s.cursor.phase).toBe('composing');
    expect(draftOf(s).reached).toBe('place');
    expect(gv.canRedo).toBe(true);
  },
  'Place with a used free letter (R-41)': (s) => {
    const draft = draftOf(s);
    expect(s.cursor.phase).toBe('place');
    expect(draft.freeLetters).toContain(draft.targetCell);
  },
  'Place reached by undo from Idle': (s, gv) => {
    expect(s.cursor.phase).toBe('place');
    expect(draftOf(s).reached).toBe('committed');
    expect(gv.canRedo).toBe(true);
  },
  'Place with L = 10': (s, gv) => {
    expect(s.cursor.phase).toBe('place');
    expect(gv.draft?.letterCount).toBe(10);
  },
  'Idle straight after confirm': (s) => {
    expect(s.cursor.phase).toBe('idle');
    expect(s.moves).toHaveLength(s.cursor.index);
    expect(s.moves.at(-1)?.reached).toBe('committed');
  },
  'Idle with a committed pending draft and a redo tail': (s, gv) => {
    expect(s.cursor.phase).toBe('idle');
    expect(draftOf(s).reached).toBe('committed');
    expect(s.moves.length).toBeGreaterThan(s.cursor.index + 1);
    expect(gv.canRedo).toBe(true);
  },
  'Idle with a committed pending draft, no redo tail': (s, gv) => {
    expect(s.cursor.phase).toBe('idle');
    expect(draftOf(s).reached).toBe('committed');
    expect(s.moves).toHaveLength(s.cursor.index + 1);
    expect(gv.canRedo).toBe(true);
  },
  won: (s) => {
    expect(OVER.get(s)).toBe('won');
    expect(s.gaveUp).toBe(false);
    expect(replay(s, LANG).columns.every((column) => column.length === 0)).toBe(true);
  },
  'gaveUp at index 0 with a pending draft': (s) => {
    expect(OVER.get(s)).toBe('gaveUp');
    expect(s.gaveUp).toBe(true);
    expect(s.cursor.index).toBe(0);
    expect(draftOf(s)).toBeDefined();
  },
  'gaveUp at index > 0': (s) => {
    expect(OVER.get(s)).toBe('gaveUp');
    expect(s.gaveUp).toBe(true);
    expect(s.cursor.index).toBeGreaterThan(0);
  },
};

/** GameView's top-level boolean flags. */
const FLAGS = [
  'inProgress',
  'canUndo',
  'canRedo',
  'canGiveUp',
  'canValidate',
  'canConfirm',
  'canFlip',
  'canDecK',
  'canIncK',
] as const satisfies readonly (keyof GameView)[];

describe('GameView STATES', () => {
  it('AD-3 every STATES label has a labelled property and OVER lists every non-playing state', () => {
    expect(STATES.map(([label]) => label)).toStrictEqual(Object.keys(LABELLED));
    for (const [, session] of STATES)
      expect(v(session).status).toBe(OVER.get(session) ?? 'playing');
  });

  it.each(STATES)('AD-3 STATES %s has its labelled property', (label, session) => {
    LABELLED[label](session, v(session));
  });

  it('AD-3 FLAGS are exactly the top-level boolean GameView keys', () => {
    const booleans = Object.entries(v(FRESH))
      .filter(([, value]) => typeof value === 'boolean')
      .map(([key]) => key);
    expect(booleans.sort()).toStrictEqual([...FLAGS].sort());
  });

  it.each(FLAGS)('AD-3 %s is true in at least one STATES entry and false in another', (flag) => {
    const values = STATES.map(([, session]) => v(session)[flag]);
    expect(values).toContain(true);
    expect(values).toContain(false);
  });
});

// --- plain data, rejection -----------------------------------------------------------------------

describe('GameView contract', () => {
  it('AD-3 view is plain data and survives structuredClone, arguments unmutated', () => {
    for (const [, session] of STATES) {
      const gameView = v(session);
      expect(v(structuredClone(session))).toStrictEqual(gameView);
      expect(structuredClone(gameView)).toStrictEqual(gameView);
      for (const part of [
        gameView,
        gameView.draft ?? {},
        gameView.place ?? {},
        ...gameView.cells,
        ...gameView.cells.map((cell) => cell.preview ?? {}),
      ])
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

// --- R-86 word list -----------------------------------------------------------------------------

describe('R-86 word list', () => {
  const GIVE_UP: Command = { type: 'giveUp' };
  /** Whole-column word on its own column: drop, Validate, Confirm (R-11, R-22, R-42). */
  const whole = (column: number, count: number, target?: WordCellNumber): Command[] => [
    drop(column, count, column),
    VALIDATE,
    ...(target === undefined ? [] : [setTarget(target)]),
    CONFIRM,
  ];
  const WORDS = ['tan', 'ones', 'baked', 'ant', 'one', 'quit'];
  const listOf = (start: Start, commands: readonly Command[]) =>
    viewFrom(start, seam(start, commands, WORDS), LANG).wordList;
  const brief = (list: readonly { spelling: string; letterCount: number }[] | undefined) =>
    list?.map((w) => `${w.spelling}:${w.letterCount}`);

  it('R-86 orders by letter count descending, then spelling', () => {
    const start = startOf(['TAN', 'ONES', 'BAKED']);
    const list = listOf(start, [...whole(1, 3), ...whole(2, 4), ...whole(3, 5)]);
    expect(brief(list)).toStrictEqual(['baked:5', 'ones:4', 'tan:3']);
    expect(list?.map((w) => w.cell)).toStrictEqual([5, 4, 3]);
    expect(list?.[0].cards).toStrictEqual(start.columns[2]);
  });

  it('R-86 a letter-count tie is alphabetical, not move order', () => {
    const start = startOf(['TAN', 'ANT']);
    expect(brief(listOf(start, [...whole(1, 3), ...whole(2, 3)]))).toStrictEqual([
      'ant:3',
      'tan:3',
    ]);
  });

  it('R-86 a duplicate word gives equal entries in move order with different cards and cell', () => {
    // Move order (columns 2, 1, 3 on cells 4, 3, 4) differs from cell order either way and from
    // card-id order (startOf takes lower ids for earlier columns).
    const start = startOf(['ONES', 'ONES', 'ONES', 'BAKED']);
    const list = listOf(start, [...whole(2, 4), ...whole(1, 4, 3), ...whole(3, 4), ...whole(4, 5)]);
    expect(list).toStrictEqual([
      { spelling: 'baked', letterCount: 5, cards: start.columns[3], cell: 5 },
      { spelling: 'ones', letterCount: 4, cards: start.columns[1], cell: 4 },
      { spelling: 'ones', letterCount: 4, cards: start.columns[0], cell: 3 },
      { spelling: 'ones', letterCount: 4, cards: start.columns[2], cell: 4 },
    ]);
    expect(start.columns[0]).not.toStrictEqual(start.columns[2]);
  });

  it('R-86 a gaveUp list orders as a won one: letter count descending, a tie alphabetical, a duplicate in move order', () => {
    // Move order tea, ores, ant, tea; the fifth column stays, so the game ends by Give up.
    const start = startOf(['TEA', 'ORES', 'ANT', 'TEA', 'XYZ']);
    const session = seam(
      start,
      [...whole(1, 3), ...whole(2, 4), ...whole(3, 3), ...whole(4, 3), GIVE_UP],
      ['tea', 'ores', 'ant'],
    );
    const gameView = viewFrom(start, session, LANG);
    expect(gameView.status).toBe('gaveUp');
    expect(gameView.wordList).toStrictEqual([
      { spelling: 'ores', letterCount: 4, cards: start.columns[1], cell: 4 },
      { spelling: 'ant', letterCount: 3, cards: start.columns[2], cell: 3 },
      { spelling: 'tea', letterCount: 3, cards: start.columns[0], cell: 3 },
      { spelling: 'tea', letterCount: 3, cards: start.columns[3], cell: 3 },
    ]);
  });

  it('R-86 QU is lowercase qu, counts 2 and one card fewer than letterCount', () => {
    const start = startOf(['QIT']);
    const list = listOf(start, whole(1, 3));
    expect(list).toStrictEqual([
      { spelling: 'quit', letterCount: 4, cards: start.columns[0], cell: 4 },
    ]);
    expect(list?.[0].cards.length).toBe((list?.[0].letterCount ?? 0) - 1);
  });

  it('R-86 a QU word sorts by letterCount, not by cards.length', () => {
    const start = startOf(['QIT', 'ANT']);
    const list = listOf(start, [...whole(1, 3), ...whole(2, 3)]);
    expect(list?.map((w) => w.cards.length)).toStrictEqual([3, 3]);
    expect(brief(list)).toStrictEqual(['quit:4', 'ant:3']);
  });

  it('R-86 a flipped word lists its cards in the committed order', () => {
    const start = startOf(['TAN', 'ONES']);
    const draft = viewFrom(start, seam(start, [drop(1, 3, 2), FLIP], WORDS), LANG).draft;
    expect(draft?.side).toBe('right');
    const session = seam(
      start,
      [drop(1, 3, 2), FLIP, VALIDATE, CONFIRM, GIVE_UP],
      ['tans', ...WORDS],
    );
    const entry = viewFrom(start, session, LANG).wordList?.[0];
    expect(entry?.spelling).toBe('tans');
    expect(entry?.cards).toStrictEqual(draft?.wordCards);
  });

  it('R-86 cards stay in R-30 word order after a non-word setPlacementOrder before Confirm', () => {
    // QU_TOP: placementOrder [8, 21, 2, 42, 0, 35] (QU last) confirmed onto cell 7.
    const wordOrder = [35, 8, 21, 2, 42, 0];
    const gameView = v(play(QU_TOP, [GIVE_UP]));
    const entry = gameView.wordList?.[0];
    expect(gameView.wordList).toHaveLength(1);
    expect(entry?.cards).toStrictEqual(wordOrder);
    expect(entry?.cards).not.toStrictEqual([8, 21, 2, 42, 0, 35]);
    const spelled = entry?.cards.map((card) => gameView.faces[card]?.letter.toLowerCase()).join('');
    expect(spelled).toBe(entry?.spelling);
    expect(entry?.spelling).toBe('quejata');
  });

  it('R-86 gaveUp with no committed word gives an empty list', () => {
    const start = startOf(['TAN']);
    const gaveUp = viewFrom(start, seam(start, [GIVE_UP]), LANG);
    expect(gaveUp.status).toBe('gaveUp');
    expect(gaveUp.wordList).toStrictEqual([]);
  });

  it('R-86 a WordCell top reused as a free letter appears in two entries', () => {
    const start = startOf(['TAN', 'ONE']);
    const session = seam(
      start,
      [...whole(1, 3), drop(2, 3, 2), addFree(3), VALIDATE, CONFIRM],
      ['tan', 'onen'],
    );
    const list = viewFrom(start, session, LANG).wordList;
    const top = start.columns[0][2];
    expect(list?.map((w) => w.cards.includes(top))).toStrictEqual([true, true]);
    expect(list?.map((w) => w.cell)).toStrictEqual([4, 3]);
  });

  it('R-86 the pending draft and the redo tail are excluded, also when gaveUp', () => {
    const start = startOf(['TAN', 'ONE', 'ANT']);
    const draft = seam(
      start,
      [...whole(1, 3), drop(2, 3, 2), VALIDATE, UNDO, UNDO, GIVE_UP],
      WORDS,
    );
    expect(draft.moves).toHaveLength(2);
    expect(draft.cursor).toStrictEqual({ index: 1, phase: 'idle' });
    expect(brief(viewFrom(start, draft, LANG).wordList)).toStrictEqual(['tan:3']);
    // Three Undos take back the last word's Confirm, Validate and drop: two words stay committed
    // and the third is the redo tail.
    const longer = startOf(['TAN', 'ONES', 'BAKED']);
    const tail = seam(
      longer,
      [...whole(1, 3), ...whole(2, 4), ...whole(3, 5), UNDO, UNDO, UNDO, GIVE_UP],
      WORDS,
    );
    expect(tail.moves).toHaveLength(3);
    expect(tail.gaveUp).toBe(true);
    expect(tail.cursor).toStrictEqual({ index: 2, phase: 'idle' });
    expect(brief(viewFrom(longer, tail, LANG).wordList)).toStrictEqual(['ones:4', 'tan:3']);
  });

  it('R-86 Undo of the finish leaves playing without the key; Confirm restores the list', () => {
    const start = startOf(['TAN', 'ONE']);
    const won = seam(start, [...whole(1, 3), ...whole(2, 3)], WORDS);
    const list = viewFrom(start, won, LANG).wordList;
    expect(list).toHaveLength(2);
    const undone = seam(start, [...whole(1, 3), ...whole(2, 3), UNDO], WORDS);
    const playing = viewFrom(start, undone, LANG);
    expect(playing.status).toBe('playing');
    expect('wordList' in playing).toBe(false);
    const again = seam(start, [...whole(1, 3), ...whole(2, 3), UNDO, CONFIRM], WORDS);
    expect(viewFrom(start, again, LANG).wordList).toStrictEqual(list);
  });

  it('R-86 the key is absent while playing and present for won and gaveUp', () => {
    expect('wordList' in v(createSession(1))).toBe(false);
    expect('wordList' in v(PENDING_TAIL)).toBe(false);
    expect(v(WON).wordList).toHaveLength(8);
    expect(v(play(createSession(1), [{ type: 'giveUp' }])).wordList).toStrictEqual([]);
  });

  it('R-86 each call returns a fresh array with fresh entries', () => {
    const a = v(WON).wordList;
    const b = v(WON).wordList;
    expect(a).toStrictEqual(b);
    expect(a).not.toBe(b);
    expect(a?.[0]).not.toBe(b?.[0]);
    expect(a?.[0].cards).not.toBe(b?.[0].cards);
  });

  it('R-86 gameRecord keys and longestWord shape are unchanged by the widened replay', () => {
    const record = gameRecord(WON, LANG);
    expect(Object.keys(record ?? {}).sort()).toStrictEqual(
      ['activeMs', 'finalScore', 'longestWord', 'outcome', 'seed', 'version'].sort(),
    );
    const longest = v(WON).longestWord;
    expect(Object.keys(longest ?? {}).sort()).toStrictEqual(['letterCount', 'spelling']);
    expect(record?.longestWord).toStrictEqual(longest);
    const word = { spelling: 'tan', letterCount: 3, cards: [1], cell: 3 as WordCellNumber };
    expect(longestWord([word])).toStrictEqual({ spelling: 'tan', letterCount: 3 });
  });
});
