import { describe, expect, it } from 'vitest';
import historyThreeRecords from '../../fixtures/history-three-records.json' with { type: 'json' };
import { accrue, type Command } from './commands';
import { dealIds } from './deal';
import { EngineError } from './errors';
import {
  type GameRecord,
  gameRecord,
  HISTORY_VERSION,
  isRecorded,
  reconcileHistory,
  type ScoreHistory,
  statistics,
} from './history';
import { EN } from './lang/en';
import { letterCount, spelling } from './lang/lang-data';
import { createSession, type Session } from './session';
import { deepFreeze, drop, play } from './test-helpers';
import { view } from './view';
import { winSeed } from './win-seed';

// --- helpers (shared ones in test-helpers.ts; tests never import another test file) ------------

const LANG = deepFreeze(EN);

const frozenAccrue = (session: Session, ms: number): Session =>
  deepFreeze(accrue(session, ms, LANG));

/** `gameRecord` that must be non-null. */
function recordOf(session: Session): GameRecord {
  const record = gameRecord(session, LANG);
  if (record === null) throw new Error('expected a finished Session');
  return deepFreeze(record);
}

const reconcile = (records: readonly GameRecord[], before: Session, after: Session) =>
  reconcileHistory(deepFreeze(records), before, after, LANG);
const recorded = (records: readonly GameRecord[], session: Session) =>
  isRecorded(deepFreeze(records), session, LANG);

const VALIDATE: Command = { type: 'validate' };
const CONFIRM: Command = { type: 'confirm' };
const UNDO: Command = { type: 'undo' };
const REDO: Command = { type: 'redo' };
const GIVE_UP: Command = { type: 'giveUp' };

const QU_CARD = EN.letters.indexOf('QU');
/** The 1-based column of `dealIds(seed)` holding the QU card. */
const quColumn = (seed: number): number =>
  dealIds(seed).findIndex((column) => column.includes(QU_CARD)) + 1;

// --- sessions (seed 1 columns: 1 L D X O M I W | 2 T N P D V I M | 3 L QU E J A T A |
// 4 E K G H H I O | 5 T S C F S Z | 6 O P N A E N | 7 Y E U R H F | 8 S B R R C U) ------------

const FRESH = deepFreeze(createSession(1));
/** Column 5 committed (T S C F S Z): Idle at index 1, one word. */
const COL5_DONE = play(FRESH, [drop(5, 6, 5), VALIDATE, CONFIRM], ['tscfsz']);
/** Given up at the start: no word, every letter left. */
const GAVE_UP0 = play(FRESH, [GIVE_UP]);
/** Given up after one committed word. */
const GAVE_UP1 = play(COL5_DONE, [GIVE_UP]);
const WON1 = deepFreeze(winSeed(1));
/** WON1 undone once: Place at index 7, playing; redo re-finishes. */
const WON1_BEFORE = play(WON1, [UNDO]);
const WON2 = deepFreeze(winSeed(2));

describe('HISTORY_VERSION', () => {
  it('AD-7 HISTORY_VERSION is 1', () => {
    expect(HISTORY_VERSION).toBe(1);
  });
});

describe('gameRecord', () => {
  it('R-84 gameRecord is null while playing', () => {
    for (const session of [FRESH, COL5_DONE, WON1_BEFORE, play(GAVE_UP1, [UNDO])])
      expect(gameRecord(session, LANG)).toBeNull();
  });

  it('AD-6 record keys are in AD-6 order, longestWord absent (not undefined) with no word', () => {
    const won = recordOf(WON1);
    expect(Object.keys(won)).toEqual([
      'version',
      'seed',
      'outcome',
      'finalScore',
      'longestWord',
      'activeMs',
    ]);
    expect(won).toStrictEqual({
      version: 1,
      seed: 1,
      outcome: 'won',
      finalScore: view(WON1, LANG).finalScore,
      longestWord: { spelling: 'lquejata', letterCount: 8 },
      activeMs: 0,
    });
    const gaveUp = recordOf(GAVE_UP0);
    expect(Object.keys(gaveUp)).toEqual(['version', 'seed', 'outcome', 'finalScore', 'activeMs']);
    expect(Object.hasOwn(gaveUp, 'longestWord')).toBe(false);
    expect(gaveUp).toStrictEqual({
      version: HISTORY_VERSION,
      seed: 1,
      outcome: 'gaveUp',
      finalScore: view(GAVE_UP0, LANG).finalScore,
      activeMs: 0,
    });
  });

  it('R-84 a gaveUp record carries the R-81 final score, negative allowed, and no longestWord', () => {
    const record = recordOf(GAVE_UP0);
    expect(record.finalScore).toBeLessThan(0);
    expect(record.finalScore).toBe(view(GAVE_UP0, LANG).finalScore);
    expect(Object.hasOwn(record, 'longestWord')).toBe(false);
    const oneWord = recordOf(GAVE_UP1);
    expect(oneWord.finalScore).toBe(view(GAVE_UP1, LANG).finalScore);
    expect(oneWord.longestWord).toStrictEqual({ spelling: 'tscfsz', letterCount: 6 });
  });

  it('R-84 won QU record: spelling lowercase with QU as "qu", finalScore and longestWord equal view', () => {
    expect(quColumn(1)).toBe(3);
    expect(dealIds(1)[2]).toHaveLength(7);
    const record = recordOf(WON1);
    const gameView = view(WON1, LANG);
    expect(record.longestWord).toStrictEqual({ spelling: 'lquejata', letterCount: 8 });
    expect(record.longestWord?.spelling).toMatch(/^[a-z]+$/);
    expect(record.finalScore).toBe(gameView.finalScore);
    expect(record.longestWord).toStrictEqual(gameView.longestWord);
  });

  it('R-84 won tie record: equal letter counts keep the earliest committed word (column 1)', () => {
    expect(quColumn(2)).toBe(8);
    const columns = dealIds(2);
    const letters = (column: readonly number[]) =>
      column.reduce((sum, card) => sum + letterCount(card, EN), 0);
    for (const column of columns.slice(0, 4)) expect(letters(column)).toBe(7);
    expect(columns[7]).toHaveLength(6);
    expect(letters(columns[7])).toBe(7);
    const record = recordOf(WON2);
    const gameView = view(WON2, LANG);
    expect(record.longestWord).toStrictEqual({
      spelling: columns[0].map((card) => spelling(card, EN)).join(''),
      letterCount: 7,
    });
    expect(record.finalScore).toBe(gameView.finalScore);
    expect(record.longestWord).toStrictEqual(gameView.longestWord);
  });

  it('R-84 two equal-length committed words keep the earliest', () => {
    const twoSix = play(
      COL5_DONE,
      [drop(6, 6, 6), VALIDATE, { type: 'setTarget', cell: 3 }, CONFIRM, GIVE_UP],
      ['opnaen'],
    );
    expect(recordOf(twoSix).longestWord).toStrictEqual({ spelling: 'tscfsz', letterCount: 6 });
  });

  it('R-84 a pending draft at reached = committed is not counted', () => {
    const confirmed = play(COL5_DONE, [drop(1, 7, 1), VALIDATE, CONFIRM], ['ldxomiw']);
    const pending = play(confirmed, [UNDO, UNDO, UNDO]);
    expect(pending.cursor).toStrictEqual({ index: 1, phase: 'idle' });
    expect(pending.moves[1].reached).toBe('committed');
    const gaveUp = play(pending, [GIVE_UP]);
    const record = recordOf(gaveUp);
    const gameView = view(gaveUp, LANG);
    expect(record.longestWord).toStrictEqual({ spelling: 'tscfsz', letterCount: 6 });
    expect(record.finalScore).toBe(gameView.finalScore);
    expect(record.longestWord).toStrictEqual(gameView.longestWord);
    const straight = recordOf(play(confirmed, [GIVE_UP]));
    expect(straight.longestWord).toStrictEqual({ spelling: 'ldxomiw', letterCount: 7 });
    expect(record.finalScore).not.toBe(straight.finalScore);
    expect(record.longestWord).not.toStrictEqual(straight.longestWord);
  });

  it('AD-15 a replay-invalid Session throws replay’s EngineError', () => {
    const invalid = deepFreeze({ ...FRESH, cursor: { index: 1, phase: 'idle' as const } });
    let thrown: unknown;
    try {
      gameRecord(invalid, LANG);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(EngineError);
    expect((thrown as EngineError).check).toBe('ad7-cursor-index');
  });

  it('R-76 won record copies activeMs 0', () => {
    expect(WON1.activeMs).toBe(0);
    expect(recordOf(WON1).activeMs).toBe(0);
  });

  it('R-76 won record copies a non-zero activeMs', () => {
    const won = play(frozenAccrue(WON1_BEFORE, 4321), [REDO]);
    expect(won.activeMs).toBe(4321);
    expect(recordOf(won)).toMatchObject({ outcome: 'won', activeMs: 4321 });
  });

  it('R-76 gaveUp record copies activeMs 0', () => {
    expect(recordOf(GAVE_UP0)).toMatchObject({ outcome: 'gaveUp', activeMs: 0 });
  });

  it('R-76 gaveUp record copies a non-zero activeMs', () => {
    const gaveUp = play(frozenAccrue(FRESH, 1234), [GIVE_UP]);
    expect(recordOf(gaveUp)).toMatchObject({ outcome: 'gaveUp', activeMs: 1234 });
  });
});

// --- reconcileHistory ---------------------------------------------------------------------------

/** A non-empty earlier history: a seed-7 win and a seed-9 give-up (hand-built literals). */
const EARLIER: readonly GameRecord[] = deepFreeze([
  { version: 1, seed: 7, outcome: 'won', finalScore: 300, activeMs: 10 },
  { version: 1, seed: 9, outcome: 'gaveUp', finalScore: -40, activeMs: 20 },
]);

describe('reconcileHistory', () => {
  it('R-84 a finish appends gameRecord(after) to the history', () => {
    expect(reconcile(EARLIER, WON1_BEFORE, WON1)).toStrictEqual([...EARLIER, recordOf(WON1)]);
    expect(reconcile(EARLIER, COL5_DONE, GAVE_UP1)).toStrictEqual([...EARLIER, recordOf(GAVE_UP1)]);
    expect(reconcile([], FRESH, GAVE_UP0)).toStrictEqual([recordOf(GAVE_UP0)]);
  });

  it('R-84 a finish appends even when the last record already equals gameRecord(after) (no dedupe)', () => {
    const records = deepFreeze([recordOf(WON1)]);
    expect(reconcile(records, WON1_BEFORE, WON1)).toStrictEqual([recordOf(WON1), recordOf(WON1)]);
  });

  it('AD-2 an append returns a new array and leaves the frozen input and its records unchanged', () => {
    const snapshot = structuredClone(EARLIER);
    const next = reconcile(EARLIER, WON1_BEFORE, WON1);
    expect(next).not.toBe(EARLIER);
    expect(EARLIER).toStrictEqual(snapshot);
    expect(next[0]).toBe(EARLIER[0]);
    expect(next[1]).toBe(EARLIER[1]);
  });

  it('AD-2 a removal returns a new array and leaves the frozen input unchanged', () => {
    const records = deepFreeze([...EARLIER, recordOf(WON1)]);
    const snapshot = structuredClone(records);
    const next = reconcile(records, WON1, WON1_BEFORE);
    expect(next).not.toBe(records);
    expect(records).toStrictEqual(snapshot);
  });

  it('R-84 a won finish un-finished by undo (R-70) removes the last record', () => {
    const records = deepFreeze([...EARLIER, recordOf(WON1)]);
    const undone = play(WON1, [UNDO]);
    expect(view(undone, LANG).status).toBe('playing');
    expect(reconcile(records, WON1, undone)).toStrictEqual(EARLIER);
  });

  it('R-84 a gaveUp finish un-finished by undo (R-75) removes the last record', () => {
    const records = deepFreeze([...EARLIER, recordOf(GAVE_UP1)]);
    const undone = play(GAVE_UP1, [UNDO]);
    expect(undone.gaveUp).toBe(false);
    expect(undone.cursor).toStrictEqual(GAVE_UP1.cursor);
    expect(reconcile(records, GAVE_UP1, undone)).toStrictEqual(EARLIER);
  });

  it('R-76 R-84 accrue between a finish and its un-finish keeps the reference and the un-finish still removes the record (AD-4 order)', () => {
    const start = deepFreeze((historyThreeRecords as unknown as ScoreHistory).records);
    for (const [before, after] of [
      [WON1_BEFORE, WON1],
      [COL5_DONE, GAVE_UP1],
    ] as const) {
      const finished = reconcile(start, before, after);
      expect(finished).toStrictEqual([...start, recordOf(after)]);
      const accrued = accrue(after, 500, LANG);
      expect(accrued).toBe(after);
      const undone = play(accrued, [UNDO]);
      expect(view(undone, LANG).status).toBe('playing');
      expect(reconcile(finished, accrued, undone)).toStrictEqual(start);
    }
  });

  it('R-84 a give-up at index 0 un-finished by undo (R-75, R-70) removes the last record', () => {
    const records = deepFreeze([...EARLIER, recordOf(GAVE_UP0)]);
    const undone = play(GAVE_UP0, [UNDO]);
    expect(undone.cursor).toStrictEqual({ index: 0, phase: 'idle' });
    expect(reconcile(records, GAVE_UP0, undone)).toStrictEqual(EARLIER);
  });

  it('R-84 playing → playing returns the same reference', () => {
    expect(reconcile(EARLIER, FRESH, COL5_DONE)).toBe(EARLIER);
    expect(reconcile(EARLIER, WON1_BEFORE, play(WON1_BEFORE, [UNDO]))).toBe(EARLIER);
  });

  it('R-84 finished → finished (the same finished Session) returns the same reference', () => {
    const records = deepFreeze([...EARLIER, recordOf(WON1)]);
    expect(reconcile(records, WON1, WON1)).toBe(records);
    const gaveUp = deepFreeze([recordOf(GAVE_UP1)]);
    expect(reconcile(gaveUp, GAVE_UP1, GAVE_UP1)).toBe(gaveUp);
  });

  it('R-84 an un-finish on an empty history returns the same reference', () => {
    const empty: readonly GameRecord[] = deepFreeze([]);
    expect(reconcile(empty, WON1, WON1_BEFORE)).toBe(empty);
  });

  it('R-84 an un-finish keeps the history when only seed differs (Q-43)', () => {
    const records = deepFreeze([...EARLIER, { ...recordOf(WON1), seed: 2 }]);
    expect(reconcile(records, WON1, WON1_BEFORE)).toBe(records);
  });

  it('R-84 an un-finish keeps the history when only outcome differs (Q-43)', () => {
    const records = deepFreeze([...EARLIER, { ...recordOf(WON1), outcome: 'gaveUp' as const }]);
    expect(reconcile(records, WON1, WON1_BEFORE)).toBe(records);
  });

  it('R-84 an un-finish keeps the history when only activeMs differs (Q-43)', () => {
    const records = deepFreeze([...EARLIER, { ...recordOf(WON1), activeMs: 1 }]);
    expect(reconcile(records, WON1, WON1_BEFORE)).toBe(records);
  });

  it('R-84 an un-finish looks only at the last record: an earlier match is kept (Q-43)', () => {
    const records = deepFreeze([recordOf(WON1), ...EARLIER]);
    expect(reconcile(records, WON1, WON1_BEFORE)).toBe(records);
  });

  it('R-84 a last record differing only in finalScore and longestWord still matches (Q-43)', () => {
    const stale = {
      ...recordOf(WON1),
      finalScore: 1,
      longestWord: { spelling: 'ab', letterCount: 2 },
    };
    const records = deepFreeze([...EARLIER, stale]);
    expect(reconcile(records, WON1, WON1_BEFORE)).toStrictEqual(EARLIER);
    expect(recorded(records, WON1)).toBe(true);
  });

  it('R-84 finish → un-finish → finish records a won game once', () => {
    let records: readonly GameRecord[] = deepFreeze([]);
    records = reconcile(records, WON1_BEFORE, WON1);
    records = reconcile(records, WON1, WON1_BEFORE);
    records = reconcile(records, WON1_BEFORE, play(WON1_BEFORE, [REDO]));
    expect(records).toStrictEqual([recordOf(WON1)]);
  });

  it('R-84 finish → un-finish → finish records a gaveUp game once', () => {
    const undone = play(GAVE_UP1, [UNDO]);
    let records: readonly GameRecord[] = deepFreeze([]);
    records = reconcile(records, COL5_DONE, GAVE_UP1);
    records = reconcile(records, GAVE_UP1, undone);
    records = reconcile(records, undone, play(undone, [GIVE_UP]));
    expect(records).toStrictEqual([recordOf(GAVE_UP1)]);
  });

  it('R-74 two finishes of the same seed both append; un-finishing the second removes only it', () => {
    const first = recordOf(GAVE_UP0);
    const second = recordOf(GAVE_UP1);
    expect([second.version, second.seed, second.outcome, second.activeMs]).toStrictEqual([
      first.version,
      first.seed,
      first.outcome,
      first.activeMs,
    ]);
    expect(second.finalScore).not.toBe(first.finalScore);
    const one = reconcile([], FRESH, GAVE_UP0);
    const two = reconcile(one, COL5_DONE, GAVE_UP1);
    expect(two).toStrictEqual([first, second]);
    const back = reconcile(two, GAVE_UP1, play(GAVE_UP1, [UNDO]));
    expect(back).toHaveLength(1);
    expect(back[0]).toStrictEqual(one[0]);
  });

  it('R-74 a gaveUp then a won finish of the same seed both append; un-finishing the win removes only it', () => {
    const first = recordOf(GAVE_UP0);
    const second = recordOf(WON1);
    expect(second.seed).toBe(first.seed);
    const one = reconcile([], FRESH, GAVE_UP0);
    const two = reconcile(one, WON1_BEFORE, WON1);
    expect(two).toStrictEqual([first, second]);
    expect(reconcile(two, WON1, WON1_BEFORE)).toStrictEqual([first]);
  });
});

// --- isRecorded ---------------------------------------------------------------------------------

describe('isRecorded', () => {
  it('R-84 isRecorded is true when the last record matches (Q-43)', () => {
    expect(recorded([...EARLIER, recordOf(WON1)], WON1)).toBe(true);
    expect(recorded([recordOf(GAVE_UP0)], GAVE_UP0)).toBe(true);
  });

  it('R-84 isRecorded is false while playing', () => {
    expect(recorded([...EARLIER, recordOf(WON1)], WON1_BEFORE)).toBe(false);
  });

  it('R-84 isRecorded is false on an empty history', () => {
    expect(recorded([], WON1)).toBe(false);
  });

  it('R-84 isRecorded is false when only seed differs (Q-43)', () => {
    expect(recorded([{ ...recordOf(WON1), seed: 2 }], WON1)).toBe(false);
  });

  it('R-84 isRecorded is false when only outcome differs (Q-43)', () => {
    expect(recorded([{ ...recordOf(WON1), outcome: 'gaveUp' }], WON1)).toBe(false);
  });

  it('R-84 isRecorded is false when only activeMs differs (Q-43)', () => {
    expect(recorded([{ ...recordOf(WON1), activeMs: 1 }], WON1)).toBe(false);
  });

  it('R-84 isRecorded is false when only a non-last record matches (Q-43)', () => {
    expect(recorded([recordOf(WON1), ...EARLIER], WON1)).toBe(false);
  });
});

// --- statistics ---------------------------------------------------------------------------------

const rec = (
  outcome: 'won' | 'gaveUp',
  finalScore: number,
  longestWord?: { spelling: string; letterCount: number },
): GameRecord =>
  deepFreeze({
    version: 1,
    seed: 1,
    outcome,
    finalScore,
    ...(longestWord === undefined ? {} : { longestWord }),
    activeMs: 0,
  });

const stats = (records: readonly GameRecord[]) => statistics(deepFreeze(records));

describe('statistics', () => {
  it('R-84 statistics take only records and return stored values unchanged (A-E3)', () => {
    const word = { spelling: 'quiz', letterCount: 4 };
    expect(statistics.length).toBe(1);
    expect(stats([rec('won', 123, word)])).toEqual({
      gamesPlayed: 1,
      gamesWon: 1,
      gamesGivenUp: 0,
      bestScore: 123,
      averageScore: 123,
      longestWord: word,
    });
  });

  it('R-84 statistics returns a copy of the longest word, not the record’s own object', () => {
    const record = rec('won', 123, { spelling: 'quiz', letterCount: 4 });
    const { longestWord } = stats([record]);
    expect(longestWord).not.toBe(record.longestWord);
    expect(longestWord).toStrictEqual(record.longestWord);
  });

  it('R-84 empty history: counts 0, best, average and longest word absent (A-E3)', () => {
    expect(stats([])).toStrictEqual({ gamesPlayed: 0, gamesWon: 0, gamesGivenUp: 0 });
  });

  it('R-84 a mixed history gives all six values (A-E3 average)', () => {
    expect(
      stats([
        rec('won', 200, { spelling: 'jataw', letterCount: 5 }),
        rec('won', 400, { spelling: 'lquejata', letterCount: 8 }),
        rec('gaveUp', -50),
      ]),
    ).toStrictEqual({
      gamesPlayed: 3,
      gamesWon: 2,
      gamesGivenUp: 1,
      bestScore: 400,
      averageScore: 300,
      longestWord: { spelling: 'lquejata', letterCount: 8 },
    });
  });

  it('R-84 best score may come from a gaveUp record (A-E3)', () => {
    expect(stats([rec('won', 100), rec('gaveUp', 150), rec('won', 90)]).bestScore).toBe(150);
  });

  it('R-84 a negative gaveUp record is excluded from best and average, counted elsewhere (Q-44)', () => {
    expect(
      stats([
        rec('won', 100, { spelling: 'jataw', letterCount: 5 }),
        rec('gaveUp', -50, { spelling: 'lquejata', letterCount: 8 }),
      ]),
    ).toStrictEqual({
      gamesPlayed: 2,
      gamesWon: 1,
      gamesGivenUp: 1,
      bestScore: 100,
      averageScore: 100,
      longestWord: { spelling: 'lquejata', letterCount: 8 },
    });
  });

  it('R-84 a gaveUp record scoring 0 counts in best and average (Q-44)', () => {
    expect(stats([rec('won', 10), rec('gaveUp', 0)]).averageScore).toBe(5);
    expect(stats([rec('gaveUp', 0)])).toStrictEqual({
      gamesPlayed: 1,
      gamesWon: 0,
      gamesGivenUp: 1,
      bestScore: 0,
      averageScore: 0,
    });
  });

  it('R-84 only negative gaveUp records: best and average absent (Q-44)', () => {
    expect(stats([rec('gaveUp', -100), rec('gaveUp', -20), rec('gaveUp', -60)])).toStrictEqual({
      gamesPlayed: 3,
      gamesWon: 0,
      gamesGivenUp: 3,
    });
  });

  it('R-84 a negative won record still counts (Q-44)', () => {
    expect(stats([rec('won', -100), rec('gaveUp', -50)])).toMatchObject({
      bestScore: -100,
      averageScore: -100,
    });
  });

  // Negative `won` records below are synthetic (unreachable from `gameRecord`, R-80); they only
  // exercise A-E3 rounding, since negative gaveUp records no longer reach the average (Q-44).
  it('R-84 A-E3 average rounds half toward +∞: 5, 10 → 8', () => {
    expect(stats([rec('won', 5), rec('won', 10)]).averageScore).toBe(8);
  });

  it('R-84 A-E3 average rounds half toward +∞: −5, −10 → −7', () => {
    expect(stats([rec('won', -5), rec('won', -10)]).averageScore).toBe(-7);
  });

  it('R-84 A-E3 average rounds to nearest, not up: −7, −8, −8 → −8', () => {
    expect(stats([rec('won', -7), rec('won', -8), rec('won', -8)]).averageScore).toBe(-8);
  });

  it('R-84 A-E3 average of 1 and −2 is 0, not −0', () => {
    expect(stats([rec('won', 1), rec('won', -2)]).averageScore).toBe(0);
  });

  it('R-84 a later record with a strictly longer word replaces an earlier shorter one (A-E3)', () => {
    expect(
      stats([
        rec('won', 1, { spelling: 'abc', letterCount: 3 }),
        rec('won', 1, { spelling: 'abcd', letterCount: 4 }),
      ]).longestWord,
    ).toEqual({ spelling: 'abcd', letterCount: 4 });
  });

  it('R-84 a cross-record longest-word tie keeps the lowest index (A-E3)', () => {
    expect(
      stats([
        rec('won', 1),
        rec('won', 1, { spelling: 'quids', letterCount: 5 }),
        rec('won', 1, { spelling: 'bread', letterCount: 5 }),
      ]).longestWord,
    ).toEqual({ spelling: 'quids', letterCount: 5 });
  });

  it('R-84 longestWord is absent when no record has one (A-E3)', () => {
    const result = stats([rec('won', 10), rec('gaveUp', -10)]);
    expect(Object.hasOwn(result, 'longestWord')).toBe(false);
    expect(result).toStrictEqual({
      gamesPlayed: 2,
      gamesWon: 1,
      gamesGivenUp: 1,
      bestScore: 10,
      averageScore: 10,
    });
  });
});
