import { EngineError } from './errors';
import {
  CURSOR_FIELDS,
  type FieldList,
  fieldSetViolation,
  isSafeNonNegative,
  isUint32,
  MOVE_FIELDS,
  SESSION_FIELDS,
} from './fields';
import { type GameRecord, HISTORY_VERSION, type ScoreHistory } from './history';
import type { LangData } from './lang/lang-data';
import { replay } from './replay';
import { type Move, SESSION_VERSION, type Session } from './session';
import { COLUMN_COUNT, DECK_SIZE, MIN_WORD_LENGTH, WORD_CELL_NUMBERS } from './types';
import type { LongestWord } from './view';

/** AD-7 `parseSession` result; each failure maps onto an EXPERIENCE.md message variant. */
export type ParseSessionResult =
  | { readonly ok: true; readonly session: Session }
  | { readonly ok: false; readonly reason: 'version-unreadable' }
  | {
      readonly ok: false;
      readonly reason: 'version-unknown' | 'replay-failed';
      readonly version: number;
    };

/** AD-7 `parseHistory` result (mirrors `ParseSessionResult`). */
export type ParseHistoryResult =
  | { readonly ok: true; readonly history: ScoreHistory }
  | { readonly ok: false; readonly reason: 'version-unreadable' }
  | {
      readonly ok: false;
      readonly reason: 'version-unknown' | 'contents-unreadable';
      readonly version: number;
    };

/** §2 Move keys in order, optional fields last (AD-7). */
function orderedMove(move: Move): Move {
  return {
    sourceColumn: move.sourceColumn,
    sourceCount: move.sourceCount,
    destinationColumn: move.destinationColumn,
    destinationCount: move.destinationCount,
    destinationSide: move.destinationSide,
    freeLetters: move.freeLetters,
    arrangement: move.arrangement,
    reached: move.reached,
    ...(Object.hasOwn(move, 'targetCell') ? { targetCell: move.targetCell } : {}),
    ...(Object.hasOwn(move, 'placementOrder') ? { placementOrder: move.placementOrder } : {}),
  };
}

/**
 * AD-7, §2: compact JSON of `session` with the §2 keys in order (`version` first, copied
 * as is), optional fields absent. Precondition: `session` is engine-produced; nothing is
 * validated (AD-2, CLAUDE.md rule 6).
 */
export function serializeSession(session: Session): string {
  const ordered: Session = {
    version: session.version,
    seed: session.seed,
    moves: session.moves.map(orderedMove),
    cursor: { index: session.cursor.index, phase: session.cursor.phase },
    gaveUp: session.gaveUp,
    activeMs: session.activeMs,
  };
  return JSON.stringify(ordered);
}

// --- schema stage (§2) ------------------------------------------------------------------------

type Fields = Readonly<Record<string, unknown>>;

/** Move fields the schema stage types, in §2 order: integer or integer array; optional ones last. */
const MOVE_TYPES = [
  ['sourceColumn', 'integer', 'type-source-column'],
  ['sourceCount', 'integer', 'type-source-count'],
  ['destinationColumn', 'integer', 'type-destination-column'],
  ['destinationCount', 'integer', 'type-destination-count'],
  ['freeLetters', 'integers', 'type-free-letters'],
  ['arrangement', 'integers', 'type-arrangement'],
  ['targetCell', 'integer', 'type-target-cell'],
  ['placementOrder', 'integers', 'type-placement-order'],
] as const;

const PHASES: readonly unknown[] = ['idle', 'composing', 'place'];
const SIDES: readonly unknown[] = ['left', 'right'];
const REACHED: readonly unknown[] = ['composing', 'place', 'committed'];

const isColumn = (n: number): boolean => n >= 1 && n <= COLUMN_COUNT;
const isCount = (n: number): boolean => n >= 0;
const isCell = (n: number): boolean => (WORD_CELL_NUMBERS as readonly number[]).includes(n);
const isCard = (n: number): boolean => n >= 0 && n < DECK_SIZE;

/** Move domains in §2 order (AD-2): one code per domain across every field holding it. */
const MOVE_DOMAINS = [
  ['sourceColumn', isColumn, 'domain-column'],
  ['sourceCount', isCount, 'domain-count'],
  ['destinationColumn', isColumn, 'domain-column'],
  ['destinationCount', isCount, 'domain-count'],
  ['freeLetters', isCell, 'domain-cell'],
  ['arrangement', isCard, 'domain-card'],
  ['targetCell', isCell, 'domain-cell'],
  ['placementOrder', isCard, 'domain-card'],
] as const;

function fail(code: string, detail: string): never {
  throw new EngineError(`schema.${code}`, `§2 schema: ${detail}`);
}

function isPlainObject(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIntegerArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((n) => Number.isInteger(n));
}

function checkMoveSchema(move: unknown, i: number): void {
  const where = `move ${i}`;
  if (!isPlainObject(move)) fail('object-move', `${where} is not an object`);
  const missing = fieldSetViolation(move, MOVE_FIELDS, 'missing');
  if (missing !== undefined) fail('required-move', `${where} lacks ${missing}`);
  for (const [field, kind, code] of MOVE_TYPES) {
    if (!Object.hasOwn(move, field)) continue;
    const value = move[field];
    if (kind === 'integer' ? !Number.isInteger(value) : !isIntegerArray(value))
      fail(code, `${where} ${field} is not ${kind === 'integer' ? 'an integer' : 'integers'}`);
  }
  if (!SIDES.includes(move.destinationSide))
    fail('enum-destination-side', `${where} destinationSide is not left or right`);
  if (!REACHED.includes(move.reached))
    fail('enum-reached', `${where} reached is not composing, place or committed`);
  for (const [field, allowed, code] of MOVE_DOMAINS) {
    if (!Object.hasOwn(move, field)) continue;
    const value = move[field] as number | readonly number[];
    const values = typeof value === 'number' ? [value] : value;
    if (!values.every(allowed)) fail(code, `${where} ${field} outside its AD-2 domain`);
  }
}

/**
 * The §2 schema stage of `parseSession`, after the version stage has shown
 * `value` to be a plain object with a readable version: required fields, object, JSON type,
 * enum and AD-2 domain of every field AD-7 leaves untyped (never `seed`, `activeMs`, `gaveUp`;
 * `cursor.index` integer only). Order: session → cursor → each move; within an object, object →
 * required → type → enum → domain. The first violation throws `EngineError('schema.<code>')`
 * (codes in errors.ts). Internal.
 */
export function checkSchema(value: object): asserts value is Session {
  const session = value as Fields;
  const missingSession = fieldSetViolation(session, SESSION_FIELDS, 'missing');
  if (missingSession !== undefined) fail('required-session', `Session lacks ${missingSession}`);
  if (!Array.isArray(session.moves)) fail('type-moves', 'moves is not an array');
  const { cursor } = session;
  if (!isPlainObject(cursor)) fail('object-cursor', 'cursor is not an object');
  const missingCursor = fieldSetViolation(cursor, CURSOR_FIELDS, 'missing');
  if (missingCursor !== undefined) fail('required-cursor', `cursor lacks ${missingCursor}`);
  if (!Number.isInteger(cursor.index)) fail('type-cursor-index', 'cursor.index is not an integer');
  if (!PHASES.includes(cursor.phase))
    fail('enum-cursor-phase', 'cursor.phase is not idle, composing or place');
  for (const [i, move] of session.moves.entries()) checkMoveSchema(move, i);
}

// --- parse (AD-7) -----------------------------------------------------------------------------

/** The early results of the AD-7 version stage, shared by both parse results. */
type VersionFailure =
  | { readonly ok: false; readonly reason: 'version-unreadable' }
  | { readonly ok: false; readonly reason: 'version-unknown'; readonly version: number };

/**
 * AD-7 version stage of `parseSession` and `parseHistory`: JSON parse → plain-object root with an
 * own `version` → a safe integer ≥ 0 → equal to `current`. A JSON parse failure, a non-object
 * root or an unreadable version is `version-unreadable`; another version is `version-unknown`; a
 * non-`SyntaxError` from `JSON.parse` propagates (CLAUDE.md rule 6). Internal.
 */
function versionStage(
  text: string,
  current: number,
): VersionFailure | { readonly ok: true; readonly value: Fields; readonly version: number } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false, reason: 'version-unreadable' };
    throw error;
  }
  if (!isPlainObject(value) || !Object.hasOwn(value, 'version'))
    return { ok: false, reason: 'version-unreadable' };
  const { version } = value;
  if (!isSafeNonNegative(version)) return { ok: false, reason: 'version-unreadable' };
  if (version !== current) return { ok: false, reason: 'version-unknown', version };
  return { ok: true, value, version };
}

/**
 * AD-7 headroom check of `parseSession` only, after `replay` returns: `activeMs` at most 2^52, so
 * a stored Session leaves room for `accrue`. `checkSession` keeps the safe-integer domain for
 * `apply`, `view` and `accrue`. Throws `ad7-active-ms-headroom`. Internal.
 */
export function checkActiveMsHeadroom(session: Session): void {
  if (session.activeMs > 2 ** 52)
    throw new EngineError(
      'ad7-active-ms-headroom',
      `AD-7 activeMs ${session.activeMs} above 2^52 headroom`,
    );
}

/**
 * AD-7, §2: JSON parse → version stage → §2 schema stage → `replay` (AD-7 `checkSession`,
 * per-move checks, post-replay `ad7-gave-up-won`) → `checkActiveMsHeadroom`. A JSON parse failure
 * is `version-unreadable` (AD-15 specified outcome); an `EngineError` from the schema, replay or
 * headroom stage is `replay-failed`; anything else propagates (CLAUDE.md rule 6).
 */
export function parseSession(text: string, lang: LangData): ParseSessionResult {
  const stage = versionStage(text, SESSION_VERSION);
  if (!stage.ok) return stage;
  const { value, version } = stage;
  try {
    checkSchema(value);
    replay(value, lang);
    checkActiveMsHeadroom(value);
  } catch (error) {
    if (error instanceof EngineError) return { ok: false, reason: 'replay-failed', version };
    throw error;
  }
  return { ok: true, session: value };
}

// --- score history (AD-6, AD-7) --------------------------------------------------------------

/** AD-6 record keys in order, `longestWord` as `{ spelling, letterCount }` or absent. */
function orderedRecord(record: GameRecord): GameRecord {
  return {
    version: record.version,
    seed: record.seed,
    outcome: record.outcome,
    finalScore: record.finalScore,
    ...(Object.hasOwn(record, 'longestWord')
      ? {
          longestWord: {
            spelling: (record.longestWord as LongestWord).spelling,
            letterCount: (record.longestWord as LongestWord).letterCount,
          },
        }
      : {}),
    activeMs: record.activeMs,
  };
}

/**
 * AD-6, AD-7, §2: compact JSON `{ version, records }` (`version` copied as is), each
 * record's keys in AD-6 order, `longestWord` omitted when absent. Precondition: `scoreHistory`
 * is engine-produced; nothing is validated (AD-2, CLAUDE.md rule 6).
 */
export function serializeHistory(scoreHistory: ScoreHistory): string {
  const ordered: ScoreHistory = {
    version: scoreHistory.version,
    records: scoreHistory.records.map(orderedRecord),
  };
  return JSON.stringify(ordered);
}

function failHistory(code: string, detail: string): never {
  throw new EngineError(`history.${code}`, `AD-7 history: ${detail}`);
}

/** AD-6/AD-7 history field lists in the fields.ts marked-entry form. */
const CONTAINER_FIELDS: FieldList = [
  ['version', 'required'],
  ['records', 'required'],
];
const RECORD_FIELDS: FieldList = [
  ['version', 'required'],
  ['seed', 'required'],
  ['outcome', 'required'],
  ['finalScore', 'required'],
  ['longestWord', 'optional'],
  ['activeMs', 'required'],
];
const LONGEST_WORD_FIELDS: FieldList = [
  ['spelling', 'required'],
  ['letterCount', 'required'],
];
const OUTCOMES: readonly unknown[] = ['won', 'gaveUp'];

const isSafeInteger = (value: unknown): value is number => Number.isSafeInteger(value);

/**
 * AD-7 container check of `parseHistory`, after the version stage: field set
 * exactly `{ version, records }` (`history.container-field-set`), then `records` an array
 * (`history.records-not-array`). Internal.
 */
export function checkContainer(value: object): asserts value is { records: unknown[] } {
  const container = value as Fields;
  if (fieldSetViolation(container, CONTAINER_FIELDS, 'exact') !== undefined)
    failHistory('container-field-set', 'the container is not exactly { version, records }');
  if (!Array.isArray(container.records))
    failHistory('records-not-array', 'records is not an array');
}

/**
 * AD-6/AD-7 record check of `parseHistory`, first violation wins: plain object → field set →
 * `version` equal to the container's → `seed` uint32 → `outcome` → `finalScore` safe integer →
 * `activeMs` non-negative safe integer → when `longestWord` is present (skipped when absent):
 * exactly `{ spelling, letterCount }` → spelling `^[a-z]+$` → letterCount a positive safe integer
 * → letterCount at least `MIN_WORD_LENGTH` (R-36) → letterCount equal to the spelling's length
 * (R-85); then, whether or not `longestWord` is present, outcome `won` needs `finalScore` ≥ 0.
 * Codes in errors.ts. Internal.
 */
export function checkRecord(record: unknown, version: number): asserts record is GameRecord {
  if (!isPlainObject(record)) failHistory('record-not-object', 'a record is not an object');
  if (fieldSetViolation(record, RECORD_FIELDS, 'exact') !== undefined)
    failHistory('record-field-set', 'a record lacks a field or has an unknown one');
  if (record.version !== version)
    failHistory('record-version', "a record's version differs from the container's");
  if (!isUint32(record.seed)) failHistory('seed-uint32', 'a record seed is not a uint32');
  if (!OUTCOMES.includes(record.outcome))
    failHistory('outcome', 'a record outcome is not won or gaveUp');
  const { finalScore } = record;
  if (!isSafeInteger(finalScore))
    failHistory('final-score', 'a record finalScore is not a safe integer');
  if (!isSafeNonNegative(record.activeMs))
    failHistory('active-ms', 'a record activeMs is not a non-negative safe integer');
  if (Object.hasOwn(record, 'longestWord')) {
    const word = record.longestWord;
    if (
      !(isPlainObject(word) && fieldSetViolation(word, LONGEST_WORD_FIELDS, 'exact') === undefined)
    )
      failHistory('longest-word-not-object', 'longestWord is not { spelling, letterCount }');
    const { spelling } = word;
    if (!(typeof spelling === 'string' && /^[a-z]+$/.test(spelling)))
      failHistory('longest-word-spelling', 'longestWord.spelling is not a lowercase word');
    const { letterCount } = word;
    if (!(isSafeInteger(letterCount) && letterCount > 0))
      failHistory('longest-word-letter-count', 'longestWord.letterCount is not a positive integer');
    if (letterCount < MIN_WORD_LENGTH)
      failHistory(
        'longest-word-letter-count-short',
        `longestWord.letterCount is below ${MIN_WORD_LENGTH} (R-36)`,
      );
    // R-85, AD-7: v1 is English only, where one letter per character holds (`QU` counts 2 and is
    // spelled "qu"); moves behind LangData when a second language arrives.
    if (letterCount !== spelling.length)
      failHistory(
        'longest-word-letter-count-mismatch',
        "longestWord.letterCount differs from the spelling's length (R-85)",
      );
  }
  if (record.outcome === 'won' && finalScore < 0)
    failHistory('won-final-score', 'a won record has a negative finalScore');
}

/**
 * AD-7, §2: JSON parse → version stage → container check → each record in order. A JSON
 * parse failure, a non-object root or an unreadable version is `version-unreadable` (AD-15
 * specified outcome); a version other than `HISTORY_VERSION` is `version-unknown`; an
 * `EngineError` from the container or record checks is `contents-unreadable`; anything else
 * propagates (CLAUDE.md rule 6). An accepted history is returned as parsed, so its records keep
 * the stored key order; only `serializeHistory` writes AD-6 order.
 */
export function parseHistory(text: string): ParseHistoryResult {
  const stage = versionStage(text, HISTORY_VERSION);
  if (!stage.ok) return stage;
  const { value, version } = stage;
  try {
    checkContainer(value);
    for (const record of value.records) checkRecord(record, version);
  } catch (error) {
    if (error instanceof EngineError) return { ok: false, reason: 'contents-unreadable', version };
    throw error;
  }
  return { ok: true, history: value as unknown as ScoreHistory };
}
