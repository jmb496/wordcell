// AD-4 game store: the one writer. `load()` (called by `main.ts` before mount) enters `active` or
// `rejected`; `dispatch` is the only way a player action reaches the engine; `newGame()` and
// `replay()` start a fresh Session (R-74). `feedback.rejectedWord` is the last failed Validate's
// spelling (R-38). `halt()` enters `halted` from any state (AD-15 fatal from the `main.ts`
// handlers, Q-38 another-window from the `storage` listener registered at import); while halted
// nothing writes and `load()` only records the launch result.
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
import { words } from './dictionary.svelte';
import { newSeed } from './seed';
import { isLocalArea, read, SESSION_KEY, write } from './storage';

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

/** AD-4 `feedback`: `rejectedWord` is absent when cleared. */
export interface Feedback {
  readonly rejectedWord?: string;
}

/** AD-15/Q-38: why the store is halted; a fatal always wins over another-window. */
export type HaltCause = 'fatal' | 'another-window';

let state = $state.raw<GameState>({ kind: 'booting' });
let halted = $state.raw<{ cause: 'fatal'; text: string } | { cause: 'another-window' } | undefined>(
  undefined,
);
let launch: Loaded | undefined;
let feedback = $state.raw<Feedback>({});

const currentView: GameView | undefined = $derived(
  state.kind === 'active' ? view(state.session, EN) : undefined,
);

function rejectReason(parsed: Exclude<ParseSessionResult, { ok: true }>): RejectReason {
  return parsed.reason === 'version-unreadable'
    ? { reason: parsed.reason }
    : { reason: parsed.reason, version: parsed.version };
}

function load(): void {
  if (state.kind === 'halted') {
    // Q-38: halted during boot; record the launch result (AD-17 `loaded()`) and write nothing.
    if (launch !== undefined) throw new Error('AD-4 load() called twice');
    const stored = read(SESSION_KEY);
    if (stored === null) {
      launch = { session: null };
      return;
    }
    const result = parseSession(stored, EN);
    launch = { session: result.ok ? result.session : { rejected: rejectReason(result) } };
    return;
  }
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
  const result = apply(accrued, command, { lang: EN, dictionary: words });
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
  if (result.rejectedWord !== undefined) feedback = { rejectedWord: result.rejectedWord };
  else if (changed) feedback = {};
  return {
    changed,
    ...(result.rejectedWord !== undefined && { rejectedWord: result.rejectedWord }),
    ...(finished !== undefined && { finished }),
    ...(unfinished !== undefined && { unfinished }),
  };
}

// AD-4 order: take and discard the clock ms, enter active with feedback cleared, then write; a
// throwing write rethrows to the AD-15 surface (entry 5 halts).
function fresh(seed: number): void {
  clock.take(performance.now());
  const session = createSession(seed);
  state = { kind: 'active', session };
  feedback = {};
  write(SESSION_KEY, serializeSession(session));
}

/** R-74: a fresh random deal, from `active` or `rejected`. */
function newGame(): void {
  if (state.kind !== 'active' && state.kind !== 'rejected') {
    throw new Error(`AD-4 newGame() while ${state.kind}`);
  }
  fresh(newSeed());
}

/** R-74: the same seed dealt fresh, from `active` only. */
function replay(): void {
  if (state.kind !== 'active') throw new Error(`AD-4 replay() while ${state.kind}`);
  fresh(state.session.seed);
}

/** AD-15: a fatal error; replaces the text of an earlier fatal and any another-window cause. */
function halt(cause: 'fatal', text: string): void;
/** Q-38: another window wrote a `wordcell:` key; an earlier fatal keeps its cause and text. */
function halt(cause: 'another-window'): void;
function halt(cause: HaltCause, text?: string): void {
  if (cause === 'fatal') {
    if (text === undefined) throw new Error('AD-15 halt(fatal) without text');
    halted = { cause, text };
  } else if (halted?.cause !== 'fatal') {
    halted = { cause };
  }
  if (state.kind !== 'halted') state = { kind: 'halted' };
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
  get feedback(): Feedback {
    return feedback;
  },
  /** AD-4: undefined unless halted. */
  get haltCause(): HaltCause | undefined {
    return state.kind === 'halted' ? halted?.cause : undefined;
  },
  /** AD-15: the fatal error text; undefined unless halted with cause `fatal`. */
  get haltText(): string | undefined {
    return state.kind === 'halted' && halted?.cause === 'fatal' ? halted.text : undefined;
  },
  halt,
  load,
  dispatch,
  newGame,
  replay,
  loaded,
  current,
};

// Q-38: another window wrote (or cleared) a `wordcell:` key in this origin's localStorage.
// Registered at import, while booting (AD-15: listener registration only, no storage reads).
window.addEventListener('storage', (event) => {
  if (!isLocalArea(event.storageArea)) return;
  if (event.key === null || event.key.startsWith('wordcell:')) halt('another-window');
});
