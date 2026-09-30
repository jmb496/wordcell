// AD-4 game store: the one writer. `load()` (called by `main.ts` before mount) enters `active` or
// `rejected`; `dispatch` is the only way a player action reaches the engine. `halted` (AD-15,
// Q-38) is not reachable yet.
import {
  accrue,
  apply,
  type Command,
  createSession,
  EN,
  type GameView,
  type ParseSessionResult,
  parseSession,
  type Session,
  serializeSession,
  view,
} from '../engine/index';
import * as clock from './clock';
import { newSeed } from './seed';
import { read, SESSION_KEY, write } from './storage';

/** AD-4: a failed `parseSession` result without `ok`. */
export type RejectReason = ParseSessionResult extends infer R
  ? R extends { readonly ok: false }
    ? Omit<R, 'ok'>
    : never
  : never;

export type GameState =
  | { readonly kind: 'booting' }
  | { readonly kind: 'rejected'; readonly reason: RejectReason }
  | { readonly kind: 'active'; readonly session: Session }
  | { readonly kind: 'halted' };

export interface DispatchResult {
  readonly changed: boolean;
  readonly rejectedWord?: string;
  readonly finished?: 'won' | 'gaveUp';
  readonly unfinished?: true;
}

/** AD-17 `loaded()`: the launch parse result in stored shape (entries 7 and 10 add history, prefs). */
export interface Loaded {
  readonly session: Session | null | { readonly rejected: RejectReason };
}

/** AD-17 `current()` (entries 7 and 10 add history and prefs to the active variant). */
export type Current =
  | { readonly kind: 'booting' }
  | { readonly kind: 'active'; readonly session: Session }
  | { readonly kind: 'rejected'; readonly reason: RejectReason }
  | { readonly kind: 'halted' };

let state = $state.raw<GameState>({ kind: 'booting' });
let launch: Loaded | undefined;

const currentView: GameView | undefined = $derived(
  state.kind === 'active' ? view(state.session, EN) : undefined,
);

function rejectReason(parsed: Exclude<ParseSessionResult, { ok: true }>): RejectReason {
  return parsed.reason === 'version-unreadable'
    ? { reason: parsed.reason }
    : { reason: parsed.reason, version: parsed.version };
}

function load(): void {
  if (state.kind !== 'booting') throw new Error(`AD-4 load() while ${state.kind}`);
  const text = read(SESSION_KEY);
  if (text === null) {
    // R-74: a first launch deals and stores at once; write first, then enter active.
    const session = createSession(newSeed());
    write(SESSION_KEY, serializeSession(session));
    launch = { session: null };
    state = { kind: 'active', session };
    return;
  }
  const parsed = parseSession(text, EN);
  if (parsed.ok) {
    launch = { session: parsed.session };
    state = { kind: 'active', session: parsed.session };
    return;
  }
  const reason = rejectReason(parsed);
  launch = { session: { rejected: reason } };
  state = { kind: 'rejected', reason };
}

function dispatch(command: Command): DispatchResult {
  if (state.kind !== 'active') throw new Error(`AD-4 dispatch while ${state.kind}`);
  const before = state.session;
  // The taken ms are dropped if a later step throws; entry 5 (AD-15 halt) makes that fatal.
  const accrued = accrue(before, clock.take(performance.now()), EN);
  const result = apply(accrued, command, { lang: EN });
  const changed = result.session !== accrued;
  let finished: 'won' | 'gaveUp' | undefined;
  let unfinished: true | undefined;
  if (changed) {
    const from = view(accrued, EN).status;
    const to = view(result.session, EN).status;
    if (from === 'playing' && to !== 'playing') finished = to;
    else if (from !== 'playing' && to === 'playing') unfinished = true;
  }
  if (result.session !== before) {
    // R-73: write first, then assign, so a throwing write leaves memory equal to storage.
    write(SESSION_KEY, serializeSession(result.session));
    state = { kind: 'active', session: result.session };
  }
  return {
    changed,
    ...(result.rejectedWord !== undefined && { rejectedWord: result.rejectedWord }),
    ...(finished !== undefined && { finished }),
    ...(unfinished !== undefined && { unfinished }),
  };
}

function loaded(): Loaded {
  if (launch === undefined) throw new Error(`AD-17 loaded() while ${state.kind}`);
  return launch;
}

function current(): Current {
  return state;
}

export const game = {
  get state(): GameState {
    return state;
  },
  get view(): GameView | undefined {
    return currentView;
  },
  load,
  dispatch,
  loaded,
  current,
};
