import { dealIds } from './deal';
import { EngineError } from './errors';
import { assertCardId, type LangData } from './lang/lang-data';
import { checkMove, commitMove, type Position, placed, reachedAtLeast } from './rules';
import { assertSeed, type Session } from './session';
import type { CardId } from './types';

type Eight<T> = readonly [T, T, T, T, T, T, T, T];

/**
 * D2 start-position seam: exactly 8 columns (top → bottom) and 8 WordCells (3–10, bottom → top),
 * each CardId at most once, missing cards allowed, at least one column card. Internal.
 */
export interface Start {
  readonly columns: Eight<readonly CardId[]>;
  readonly cells: Eight<readonly CardId[]>;
}

/** §2 derived status (R-62, R-75). */
export type Status = 'playing' | 'won' | 'gaveUp';

const SESSION_FIELDS = new Set(['version', 'seed', 'moves', 'cursor', 'gaveUp', 'activeMs']);
const CURSOR_FIELDS = new Set(['index', 'phase']);
const MOVE_FIELDS = new Set([
  'sourceColumn',
  'sourceCount',
  'destinationColumn',
  'destinationCount',
  'destinationSide',
  'freeLetters',
  'arrangement',
  'reached',
  'targetCell',
  'placementOrder',
]);

/** D2: throws `card-id-domain`, `start-duplicate-card` or `start-no-column-card`. */
export function checkStart(start: Start): void {
  const seen = new Set<CardId>();
  for (const card of [...start.columns.flat(), ...start.cells.flat()]) {
    assertCardId(card);
    if (seen.has(card))
      throw new EngineError('start-duplicate-card', `D2 start holds card ${card} twice`);
    seen.add(card);
  }
  if (start.columns.every((column) => column.length === 0))
    throw new EngineError('start-no-column-card', 'D2 start has no column card');
}

function unknownField(object: object, known: ReadonlySet<string>): string | undefined {
  return Object.keys(object).find((key) => !known.has(key));
}

/** AD-7 pre-replay checks, in AD-7 order; the first violation throws. */
export function checkSession(session: Session): void {
  const { moves, cursor } = session;
  assertSeed(session.seed);
  if (!(Number.isSafeInteger(session.activeMs) && session.activeMs >= 0))
    throw new EngineError(
      'ad7-active-ms',
      `AD-7 activeMs ${session.activeMs} is not a non-negative safe integer`,
    );
  if (typeof session.gaveUp !== 'boolean')
    throw new EngineError('ad7-gave-up-type', `AD-7 gaveUp ${session.gaveUp} is not a boolean`);
  if (!(cursor.index >= 0 && cursor.index <= moves.length))
    throw new EngineError(
      'ad7-cursor-index',
      `AD-7 cursor.index ${cursor.index} outside 0…${moves.length}`,
    );
  if (cursor.phase !== 'idle') {
    const draft = moves[cursor.index];
    if (draft === undefined || !reachedAtLeast(draft.reached, cursor.phase))
      throw new EngineError(
        'ad7-cursor-phase',
        `AD-7 cursor.phase ${cursor.phase} needs moves[${cursor.index}] reached ≥ ${cursor.phase}`,
      );
  }
  if (session.gaveUp && cursor.phase !== 'idle')
    throw new EngineError('ad7-gave-up-idle', `AD-7 gaveUp needs cursor.phase idle`);
  for (const [i, move] of moves.entries()) {
    const needed = reachedAtLeast(move.reached, 'place');
    if (
      Object.hasOwn(move, 'targetCell') !== needed ||
      Object.hasOwn(move, 'placementOrder') !== needed
    )
      throw new EngineError(
        'ad7-place-fields',
        `move ${i}: AD-7 targetCell/placementOrder present iff reached ≥ place`,
      );
  }
  for (const [i, move] of moves.entries())
    if (move.destinationCount === 0 && move.destinationSide !== 'left')
      throw new EngineError(
        'ad7-k0-side',
        `move ${i}: AD-7 k = 0 needs destinationSide left (R-31)`,
      );
  for (const [i, move] of moves.entries())
    if (i < cursor.index && move.reached !== 'committed')
      throw new EngineError(
        's2-committed-prefix',
        `move ${i}: §2 a move before cursor.index must be committed`,
      );
  for (const [i, move] of moves.entries())
    if (i < moves.length - 1 && move.reached !== 'committed')
      throw new EngineError(
        's2-last-only',
        `move ${i}: §2 only the last move may be below committed`,
      );
  const sessionField = unknownField(session, SESSION_FIELDS);
  if (sessionField !== undefined)
    throw new EngineError(
      'ad7-unknown-session-field',
      `AD-7 unknown Session field ${sessionField}`,
    );
  const cursorField = unknownField(cursor, CURSOR_FIELDS);
  if (cursorField !== undefined)
    throw new EngineError('ad7-unknown-cursor-field', `AD-7 unknown cursor field ${cursorField}`);
  for (const [i, move] of moves.entries()) {
    const moveField = unknownField(move, MOVE_FIELDS);
    if (moveField !== undefined)
      throw new EngineError(
        'ad7-unknown-move-field',
        `move ${i}: AD-7 unknown Move field ${moveField}`,
      );
  }
}

/**
 * Replays `session` from `start` (§2): every committed move, then the draft or pending draft at
 * its `reached`, then each redo-tail move at its own `reached` on a scratch position. Returns the
 * committed-prefix position. Inputs are schema-valid (engine-produced, or passed by `parseSession`'s
 * schema stage, entry 10); replay adds no type or domain check.
 */
export function replayFrom(start: Start, session: Session, lang: LangData): Position {
  checkStart(start);
  checkSession(session);
  const { moves, cursor } = session;
  let position: Position = {
    columns: start.columns.map((column) => [...column]),
    cells: start.cells.map((cell) => [...cell]),
  };
  for (let i = 0; i < cursor.index; i++) {
    checkMove(position, moves[i], i, lang);
    position = commitMove(position, placed(moves[i]));
  }
  const draft = moves[cursor.index];
  if (draft !== undefined) {
    checkMove(position, draft, cursor.index, lang);
    if (moves.length > cursor.index + 1) {
      // A redo tail exists, so the draft is committed (§2 invariant).
      let scratch = commitMove(position, placed(draft));
      for (let i = cursor.index + 1; i < moves.length; i++) {
        checkMove(scratch, moves[i], i, lang);
        if (moves[i].reached === 'committed') scratch = commitMove(scratch, placed(moves[i]));
      }
    }
  }
  if (session.gaveUp && position.columns.every((column) => column.length === 0))
    throw new EngineError('ad7-gave-up-won', 'AD-7 gaveUp needs a non-won position');
  return position;
}

/** The dealt start (D2): `dealIds(seed)` and eight empty WordCells; throws `seed-uint32`. */
export function dealtStart(seed: number): Start {
  assertSeed(seed);
  const columns = dealIds(seed);
  return {
    columns: [
      columns[0],
      columns[1],
      columns[2],
      columns[3],
      columns[4],
      columns[5],
      columns[6],
      columns[7],
    ],
    cells: [[], [], [], [], [], [], [], []],
  };
}

/** `replayFrom` over the dealt start. */
export function replay(session: Session, lang: LangData): Position {
  return replayFrom(dealtStart(session.seed), session, lang);
}

/** §2 status: gaveUp if the flag, else won when Idle and every column empty, else playing. */
export function status(session: Session, position: Position): Status {
  if (session.gaveUp) return 'gaveUp';
  if (session.cursor.phase === 'idle' && position.columns.every((column) => column.length === 0))
    return 'won';
  return 'playing';
}
