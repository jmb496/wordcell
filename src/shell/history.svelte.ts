// AD-6 score-history store: the owner of `wordcell:history`. `load()` (called by `game.load()`
// right after its Session read) parses the key and never writes; `reconcile()` (called only by
// `game.dispatch`, before the Session write) appends or removes a record per R-84 and returns the
// Q-39 rollback; `reset()` empties the history (Delete history). `isStale()` is the Q-38 bfcache
// check. Reads `game.state` only inside functions and derivations (import cycle with the game store).
import {
  EN,
  type GameRecord,
  HISTORY_VERSION,
  isRecorded,
  type ParseHistoryResult,
  parseHistory,
  reconcileHistory,
  type ScoreHistory,
  type Session,
  type Statistics,
  serializeHistory,
  statistics,
} from '../engine/index';
import { game } from './game.svelte';
import { HISTORY_KEY, read, remove, write } from './storage';
import {
  assertWritable,
  launchSnapshot,
  type RejectReasonOf,
  rejectReason,
  trackLastText,
} from './stored-key';

/** AD-6: a failed `parseHistory` result without `ok`. */
export type HistoryRejectReason = RejectReasonOf<ParseHistoryResult>;

export type HistoryState =
  | { readonly status: 'ok'; readonly records: readonly GameRecord[] }
  | { readonly status: 'unreadable'; readonly reason: HistoryRejectReason };

/** AD-17 `loaded().history`: stored shape, `null` when absent. */
export type LoadedHistory = ScoreHistory | null | { readonly rejected: HistoryRejectReason };

/** AD-17 `current().history`: in-memory value. */
export type CurrentHistory = ScoreHistory | { readonly rejected: HistoryRejectReason };

// AD-17: the never-written history (`current().history` before any write, and reset()'s value).
const EMPTY: ScoreHistory = { version: HISTORY_VERSION, records: [] };

let state = $state.raw<HistoryState>({ status: 'ok', records: EMPTY.records });
// Q-38: the last `wordcell:history` text this store read or successfully wrote (`null` when absent).
const lastText = trackLastText();
const launch = launchSnapshot<LoadedHistory>();

const currentStatistics: Statistics | undefined = $derived(
  state.status === 'ok' ? statistics(state.records) : undefined,
);

const currentRecorded: boolean = $derived(
  state.status === 'ok' && game.state.kind === 'active'
    ? isRecorded(state.records, game.state.session, EN)
    : false,
);

function load(): void {
  launch.assertUnset('AD-6 load() called twice');
  const text = read(HISTORY_KEY);
  lastText.remember(text);
  if (text === null) {
    launch.set(null);
    state = { status: 'ok', records: EMPTY.records };
    return;
  }
  const result = parseHistory(text);
  if (result.ok) {
    launch.set(JSON.parse(text) as ScoreHistory);
    state = { status: 'ok', records: result.history.records };
    return;
  }
  const reason = rejectReason(result);
  launch.set({ rejected: reason });
  state = { status: 'unreadable', reason };
}

/**
 * R-84: reconciles the records with one apply (`accrued` → `after`); writes first, then assigns.
 * Returns the Q-39 rollback when it wrote, undefined when it wrote nothing (unreadable, or no
 * change). No halted check: `game.dispatch` is the only caller.
 */
function reconcile(accrued: Session, after: Session): (() => void) | undefined {
  if (state.status !== 'ok') return undefined;
  const next = reconcileHistory(state.records, accrued, after, EN);
  if (next === state.records) return undefined;
  const prevText = lastText.text();
  const prevState = state;
  const text = serializeHistory({ version: HISTORY_VERSION, records: next });
  write(HISTORY_KEY, text);
  lastText.remember(text);
  state = { status: 'ok', records: next };
  // Q-39: bytes first, then memory; a throwing restore propagates as-is (rule 6).
  return () => {
    if (prevText === null) remove(HISTORY_KEY);
    else write(HISTORY_KEY, prevText);
    state = prevState;
    lastText.remember(prevText);
  };
}

/** AD-6 Delete history: writes an empty history, from `active` or `rejected` only. */
function reset(): void {
  assertWritable(game.state.kind, 'reset');
  const text = serializeHistory(EMPTY);
  write(HISTORY_KEY, text);
  lastText.remember(text);
  state = { status: 'ok', records: EMPTY.records };
}

/** Q-38: whether `wordcell:history` differs from the text this store last read or wrote. */
function isStale(): boolean {
  return lastText.isStale(read(HISTORY_KEY));
}

function loaded(): LoadedHistory {
  return launch.get(() => 'AD-17 history loaded() before load()');
}

function current(): CurrentHistory {
  return state.status === 'ok'
    ? { version: HISTORY_VERSION, records: state.records }
    : { rejected: state.reason };
}

export const scoreHistory = {
  get state(): HistoryState {
    return state;
  },
  /** R-84: undefined while unreadable. */
  get statistics(): Statistics | undefined {
    return currentStatistics;
  },
  /** AD-6: the active game is finished and its record is the last one. */
  get recorded(): boolean {
    return currentRecorded;
  },
  load,
  reconcile,
  reset,
  isStale,
  loaded,
  current,
};
