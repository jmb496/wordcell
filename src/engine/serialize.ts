import { EngineError } from './errors';
import type { LangData } from './lang/lang-data';
import { replay } from './replay';
import { type Move, SESSION_VERSION, type Session } from './session';
import { COLUMN_COUNT, DECK_SIZE, WORD_CELL_NUMBERS } from './types';

/** AD-7 `parseSession` result; each failure maps onto an EXPERIENCE.md message variant. */
export type ParseSessionResult =
  | { readonly ok: true; readonly session: Session }
  | { readonly ok: false; readonly reason: 'version-unreadable' }
  | {
      readonly ok: false;
      readonly reason: 'version-unknown' | 'replay-failed';
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
 * AD-7, §2, CAP-9: compact JSON of `session` with the §2 keys in order (`version` first, copied
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

// --- schema stage (build-notes CAP-9) ---------------------------------------------------------

type Fields = Readonly<Record<string, unknown>>;

const SESSION_REQUIRED = ['seed', 'moves', 'cursor', 'gaveUp', 'activeMs'] as const;
const CURSOR_REQUIRED = ['index', 'phase'] as const;
const MOVE_REQUIRED = [
  'sourceColumn',
  'sourceCount',
  'destinationColumn',
  'destinationCount',
  'destinationSide',
  'freeLetters',
  'arrangement',
  'reached',
] as const;

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

function requireFields(object: Fields, fields: readonly string[], code: string, where: string) {
  const missing = fields.find((field) => !Object.hasOwn(object, field));
  if (missing !== undefined) fail(code, `${where} lacks ${missing}`);
}

function checkMoveSchema(move: unknown, i: number): void {
  const where = `move ${i}`;
  if (!isPlainObject(move)) fail('object-move', `${where} is not an object`);
  requireFields(move, MOVE_REQUIRED, 'required-move', where);
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
 * The §2 schema stage of `parseSession` (build-notes CAP-9), after the version stage has shown
 * `value` to be a plain object with a readable version: required fields, object, JSON type,
 * enum and AD-2 domain of every field AD-7 leaves untyped (never `seed`, `activeMs`, `gaveUp`;
 * `cursor.index` integer only). Order: session → cursor → each move; within an object, object →
 * required → type → enum → domain. The first violation throws `EngineError('schema.<code>')`
 * (codes in errors.ts). Internal.
 */
export function checkSchema(value: object): asserts value is Session {
  const session = value as Fields;
  requireFields(session, SESSION_REQUIRED, 'required-session', 'Session');
  if (!Array.isArray(session.moves)) fail('type-moves', 'moves is not an array');
  const { cursor } = session;
  if (!isPlainObject(cursor)) fail('object-cursor', 'cursor is not an object');
  requireFields(cursor, CURSOR_REQUIRED, 'required-cursor', 'cursor');
  if (!Number.isInteger(cursor.index)) fail('type-cursor-index', 'cursor.index is not an integer');
  if (!PHASES.includes(cursor.phase))
    fail('enum-cursor-phase', 'cursor.phase is not idle, composing or place');
  for (const [i, move] of session.moves.entries()) checkMoveSchema(move, i);
}

// --- parse (AD-7) -----------------------------------------------------------------------------

/**
 * AD-7, §2, CAP-9: JSON parse → version stage → §2 schema stage → `replay` (AD-7 `checkSession`,
 * per-move checks, post-replay `ad7-gave-up-won`). A JSON parse failure is `version-unreadable`
 * (AD-15 specified outcome); an `EngineError` from the schema or replay stage is
 * `replay-failed`; anything else propagates (CLAUDE.md rule 6).
 */
export function parseSession(text: string, lang: LangData): ParseSessionResult {
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
  if (!(typeof version === 'number' && Number.isSafeInteger(version) && version >= 0))
    return { ok: false, reason: 'version-unreadable' };
  if (version !== SESSION_VERSION) return { ok: false, reason: 'version-unknown', version };
  try {
    checkSchema(value);
    replay(value, lang);
  } catch (error) {
    if (error instanceof EngineError) return { ok: false, reason: 'replay-failed', version };
    throw error;
  }
  return { ok: true, session: value };
}
