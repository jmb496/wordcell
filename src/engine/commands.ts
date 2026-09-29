import { EngineError } from './errors';
import { assertCardId, type LangData } from './lang/lang-data';
import { dealtStart, replayFrom, type Start, status } from './replay';
import {
  checkArrangement,
  checkDestinationCount,
  checkFreeLetterDuplicate,
  checkFreeLetterEmpty,
  checkSourceCount,
  destinationRemainder,
  freeCards,
  freeLetterIndexInRange,
  hasFreeLetter,
  inDestination,
  type Position,
  sameDraftData,
} from './rules';
import type { Move, Phase, Session } from './session';
import { type CardId, COLUMN_COUNT, WORD_CELL_NUMBERS, type WordCellNumber } from './types';

/** AD-2 commands (the Composing family; entries 5 and 6 widen the union). */
export type Command =
  | {
      readonly type: 'drop';
      readonly sourceColumn: number;
      readonly sourceCount: number;
      readonly destinationColumn: number;
    }
  | { readonly type: 'tapDestinationCard'; readonly card: CardId }
  | { readonly type: 'setDestinationCount'; readonly k: number }
  | { readonly type: 'flip' }
  | { readonly type: 'addFreeLetter'; readonly cell: WordCellNumber; readonly index?: number }
  | { readonly type: 'removeFreeLetter'; readonly cell: WordCellNumber }
  | { readonly type: 'arrange'; readonly arrangement: readonly CardId[] };

/** AD-2 `ctx`: language data, and the dictionary for `validate`. */
export interface ApplyContext {
  readonly lang: LangData;
  readonly dictionary?: ReadonlySet<string>;
}

/** AD-2 result: the new Session (the input reference on a no-op). */
export interface ApplyResult {
  readonly session: Session;
  readonly rejectedWord?: string;
}

type CommandOf<T extends Command['type']> = Extract<Command, { readonly type: T }>;

/** What a reducer works on once status and phase passed. */
interface Context {
  readonly session: Session;
  readonly position: Position;
  /** `cursor.index`: the draft's (or the new draft's) move index. */
  readonly index: number;
}

interface DraftContext extends Context {
  readonly draft: Move;
}

function reject(check: string, message: string): never {
  throw new EngineError(check, message);
}

// --- prelude: replay → status → phase (build-notes CAP-4) ------------------------------------

function prelude(start: Start, session: Session, ctx: ApplyContext, type: string, phase: Phase) {
  const position = replayFrom(start, session, ctx.lang);
  const current = status(session, position);
  if (current !== 'playing')
    reject('command-status', `R-75 ${type} while status is ${current}, not playing`);
  if (session.cursor.phase !== phase)
    reject('command-phase', `§4 ${type} in phase ${session.cursor.phase}, needs ${phase}`);
  return { session, position, index: session.cursor.index };
}

function composing(start: Start, session: Session, ctx: ApplyContext, type: string) {
  const context = prelude(start, session, ctx, type, 'composing');
  return { ...context, draft: session.moves[context.index] };
}

// --- domain (AD-2) ----------------------------------------------------------------------------

function assertInteger(value: unknown, field: string): asserts value is number {
  if (!Number.isInteger(value))
    reject('command-domain', `AD-2 ${field} ${String(value)} is not an integer`);
}

function assertColumn(value: unknown, field: string): void {
  assertInteger(value, field);
  if (!(value >= 1 && value <= COLUMN_COUNT))
    reject('command-domain', `AD-2 ${field} ${value} outside 1–${COLUMN_COUNT}`);
}

function assertCell(value: unknown): void {
  assertInteger(value, 'cell');
  if (!WORD_CELL_NUMBERS.includes(value as WordCellNumber))
    reject('command-domain', `AD-2 cell ${value} outside 3–10`);
}

// --- no-op by value or R-71 edit at Composing ------------------------------------------------

/** AD-2: equal by value → the input reference; else lower per R-71 and drop later moves. */
function edit({ session, index, draft }: DraftContext, candidate: Move): ApplyResult {
  if (sameDraftData(candidate, draft)) return { session };
  const lowered: Move = {
    sourceColumn: candidate.sourceColumn,
    sourceCount: candidate.sourceCount,
    destinationColumn: candidate.destinationColumn,
    destinationCount: candidate.destinationCount,
    destinationSide: candidate.destinationSide,
    freeLetters: candidate.freeLetters,
    arrangement: candidate.arrangement,
    reached: 'composing',
  };
  return { session: { ...session, moves: [...session.moves.slice(0, index), lowered] } };
}

// --- reducers ---------------------------------------------------------------------------------

/** R-10–R-13, R-20–R-23, §2: an advance; writes the new draft at `cursor.index`. */
function drop({ session, position, index }: Context, command: CommandOf<'drop'>): ApplyResult {
  const { sourceColumn, sourceCount, destinationColumn } = command;
  assertColumn(sourceColumn, 'sourceColumn');
  assertInteger(sourceCount, 'sourceCount');
  assertColumn(destinationColumn, 'destinationColumn');
  const base: Move = {
    sourceColumn,
    sourceCount,
    destinationColumn,
    destinationCount: 0,
    destinationSide: 'left',
    freeLetters: [],
    arrangement: [],
    reached: 'composing',
  };
  const source = checkSourceCount(position, base, index);
  const draft: Move = {
    ...base,
    destinationCount: destinationRemainder(position, base).length === 0 ? 0 : 1,
    arrangement: source,
  };
  return {
    session: {
      ...session,
      moves: [...session.moves.slice(0, index), draft],
      cursor: { index, phase: 'composing' },
    },
  };
}

/** R-31 tap mapping: the tapped card becomes the top of D; the current top → k − 1, min 1. */
function tapDestinationCard(
  context: DraftContext,
  command: CommandOf<'tapDestinationCard'>,
): ApplyResult {
  const { position, draft } = context;
  const { card } = command;
  assertCardId(card);
  if (!inDestination(position, draft, card))
    reject(
      'r31-tap-not-in-destination',
      `move ${context.index}: R-31 card ${card} is not in the destination column after R-21`,
    );
  const remainder = destinationRemainder(position, draft);
  const tapped = remainder.length - remainder.indexOf(card);
  const k = draft.destinationCount;
  return edit(context, { ...draft, destinationCount: tapped === k ? Math.max(1, k - 1) : tapped });
}

/** R-31 plus/minus: k in 1…n on a non-empty destination; never on an empty one. */
function setDestinationCount(
  context: DraftContext,
  command: CommandOf<'setDestinationCount'>,
): ApplyResult {
  const { position, draft, index } = context;
  const { k } = command;
  assertInteger(k, 'k');
  if (destinationRemainder(position, draft).length === 0)
    reject(
      'r31-set-count-empty-destination',
      `move ${index}: R-31 setDestinationCount on an empty destination`,
    );
  const candidate: Move = { ...draft, destinationCount: k };
  checkDestinationCount(position, candidate, index);
  return edit(context, candidate);
}

/** R-30, R-31: toggle the side; at k = 0 it stays left (a no-op). */
function flip(context: DraftContext): ApplyResult {
  const { draft } = context;
  const side = draft.destinationCount === 0 || draft.destinationSide === 'right' ? 'left' : 'right';
  return edit(context, { ...draft, destinationSide: side });
}

/** R-33, Q-31, D8: append `cell`; insert its top card into M at `index` (default |M|). */
function addFreeLetter(context: DraftContext, command: CommandOf<'addFreeLetter'>): ApplyResult {
  const { position, draft, index } = context;
  const { cell } = command;
  assertCell(cell);
  const hasIndex = Object.hasOwn(command, 'index');
  if (hasIndex) assertInteger(command.index, 'index');
  const withCell: Move = { ...draft, freeLetters: [...draft.freeLetters, cell] };
  checkFreeLetterDuplicate(withCell, index);
  checkFreeLetterEmpty(position, withCell, index);
  const at = hasIndex ? (command.index as number) : draft.arrangement.length;
  if (!freeLetterIndexInRange(draft, at))
    reject(
      'r33-free-letter-index',
      `move ${index}: R-33 index ${at} outside 0…${draft.arrangement.length}`,
    );
  const [top] = freeCards(position, [cell]);
  const arrangement = [...draft.arrangement.slice(0, at), top, ...draft.arrangement.slice(at)];
  return edit(context, { ...withCell, arrangement });
}

/** R-33, Q-31, D8: delete `cell` and its top card in place. */
function removeFreeLetter(
  context: DraftContext,
  command: CommandOf<'removeFreeLetter'>,
): ApplyResult {
  const { position, draft, index } = context;
  const { cell } = command;
  assertCell(cell);
  if (!hasFreeLetter(draft, cell))
    reject('r33-free-letter-absent', `move ${index}: R-33 WordCell ${cell} is not a free letter`);
  const [top] = freeCards(position, [cell]);
  return edit(context, {
    ...draft,
    freeLetters: draft.freeLetters.filter((c) => c !== cell),
    arrangement: draft.arrangement.filter((c) => c !== top),
  });
}

/** R-34, R-35 (R-32): the new M is a permutation of S ∪ F. */
function arrange(context: DraftContext, command: CommandOf<'arrange'>): ApplyResult {
  const { position, draft, index } = context;
  const { arrangement } = command;
  if (!Array.isArray(arrangement))
    reject('command-domain', `AD-2 arrangement ${String(arrangement)} is not an array`);
  for (const card of arrangement) assertCardId(card);
  const candidate: Move = { ...draft, arrangement: [...arrangement] };
  const source = checkSourceCount(position, draft, index);
  checkArrangement(candidate, source, freeCards(position, draft.freeLetters), index);
  return edit(context, candidate);
}

// --- dispatch ---------------------------------------------------------------------------------

/**
 * `apply` over a D2 start (internal seam). Dispatches on `type` first (`command-type`), then
 * checks status, phase, domain and the rule (build-notes CAP-4); no-op by value last (AD-2).
 */
export function applyFrom(
  start: Start,
  session: Session,
  command: Command,
  ctx: ApplyContext,
): ApplyResult {
  switch (command.type) {
    case 'drop':
      return drop(prelude(start, session, ctx, command.type, 'idle'), command);
    case 'tapDestinationCard':
      return tapDestinationCard(composing(start, session, ctx, command.type), command);
    case 'setDestinationCount':
      return setDestinationCount(composing(start, session, ctx, command.type), command);
    case 'flip':
      return flip(composing(start, session, ctx, command.type));
    case 'addFreeLetter':
      return addFreeLetter(composing(start, session, ctx, command.type), command);
    case 'removeFreeLetter':
      return removeFreeLetter(composing(start, session, ctx, command.type), command);
    case 'arrange':
      return arrange(composing(start, session, ctx, command.type), command);
    default: {
      const unknown: never = command;
      return reject(
        'command-type',
        `AD-2 unknown command type ${String((unknown as { type: unknown }).type)}`,
      );
    }
  }
}

/** AD-2: applies `command` to `session` over the dealt start. */
export function apply(session: Session, command: Command, ctx: ApplyContext): ApplyResult {
  return applyFrom(dealtStart(session.seed), session, command, ctx);
}
