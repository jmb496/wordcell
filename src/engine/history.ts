import type { LangData } from './lang/lang-data';
import { dealtStart, replayWords, status } from './replay';
import { finalScore } from './scoring';
import type { Session } from './session';
import { type LongestWord, longestWord } from './view';

/** AD-6/AD-7 record-shape version (SPEC D5); bumps only when the record shape changes (Q-43). */
export const HISTORY_VERSION = 1;

/** AD-6 score-history record (R-84, Q-35); keys in AD-6 order, `longestWord` omitted with no word. */
export interface GameRecord {
  readonly version: number;
  readonly seed: number;
  readonly outcome: 'won' | 'gaveUp';
  readonly finalScore: number;
  readonly longestWord?: LongestWord;
  readonly activeMs: number;
}

/** AD-6/AD-7 `wordcell:history` value: the container `parseHistory` returns (CAP-9). */
export type ScoreHistory = { readonly version: number; readonly records: readonly GameRecord[] };

/** R-84 statistics; the optional keys are absent on a history without a value for them. */
export interface Statistics {
  readonly gamesPlayed: number;
  readonly gamesWon: number;
  readonly gamesGivenUp: number;
  readonly bestScore?: number;
  /** A-E3: `Math.round(sum / n)`, −0 normalised to 0. */
  readonly averageScore?: number;
  readonly longestWord?: LongestWord;
}

/**
 * AD-6: the record of a finished `session`, `null` while status = playing. One `replayWords`
 * pass with scoring's `finalScore` (R-81) and view's `longestWord`, so it agrees with `view`;
 * `activeMs` copied from the Session (R-76). Replay errors propagate.
 */
export function gameRecord(session: Session, lang: LangData): GameRecord | null {
  const { position, words } = replayWords(dealtStart(session.seed), session, lang);
  const outcome = status(session, position);
  if (outcome === 'playing') return null;
  const longest = longestWord(words);
  return {
    version: HISTORY_VERSION,
    seed: session.seed,
    outcome,
    finalScore: finalScore(position, outcome === 'gaveUp', lang),
    ...(longest === undefined ? {} : { longestWord: longest }),
    activeMs: session.activeMs,
  };
}

/** AD-6 / Q-43 match: `seed`, `outcome` and `activeMs` only; never the score or longest word. */
function matches(record: GameRecord | undefined, target: GameRecord): boolean {
  return (
    record !== undefined &&
    record.seed === target.seed &&
    record.outcome === target.outcome &&
    record.activeMs === target.activeMs
  );
}

/**
 * AD-6, R-84: appends `gameRecord(after)` on a finish (`before` playing, `after` not); on an
 * un-finish removes the last record iff it matches `gameRecord(before)` (Q-43); otherwise returns
 * `records` (same reference). Assumes `after` derives from `before` by one apply (AD-4).
 */
export function reconcileHistory(
  records: readonly GameRecord[],
  before: Session,
  after: Session,
  lang: LangData,
): readonly GameRecord[] {
  const beforeRecord = gameRecord(before, lang);
  const afterRecord = gameRecord(after, lang);
  if (beforeRecord === null && afterRecord !== null) return [...records, afterRecord];
  if (beforeRecord !== null && afterRecord === null && matches(records.at(-1), beforeRecord))
    return records.slice(0, -1);
  return records;
}

/** AD-6: true iff `session` is finished and the last record matches its record (Q-43). */
export function isRecorded(
  records: readonly GameRecord[],
  session: Session,
  lang: LangData,
): boolean {
  const record = gameRecord(session, lang);
  return record !== null && matches(records.at(-1), record);
}

/**
 * R-84 statistics: counts and longest word over all records; best and average over qualifying
 * records, every won record and gaveUp records scoring 0 or more (Q-44, D4): counts always;
 * best, average (A-E3) and longest word (ties to the earliest record) only when defined.
 */
export function statistics(records: readonly GameRecord[]): Statistics {
  const result: { -readonly [K in keyof Statistics]: Statistics[K] } = {
    gamesPlayed: records.length,
    gamesWon: records.filter((r) => r.outcome === 'won').length,
    gamesGivenUp: records.filter((r) => r.outcome === 'gaveUp').length,
  };
  const scored = records.filter((r) => r.outcome === 'won' || r.finalScore >= 0);
  if (scored.length > 0) {
    result.bestScore = scored.reduce((best, r) => Math.max(best, r.finalScore), -Infinity);
    const sum = scored.reduce((total, r) => total + r.finalScore, 0);
    result.averageScore = Math.round(sum / scored.length) + 0;
  }
  let longest: LongestWord | undefined;
  for (const r of records)
    if (
      r.longestWord !== undefined &&
      (longest === undefined || r.longestWord.letterCount > longest.letterCount)
    )
      longest = r.longestWord;
  if (longest !== undefined) result.longestWord = longest;
  return result;
}
