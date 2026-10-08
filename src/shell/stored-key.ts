// F18 stored-key helpers shared by the game, score-history and prefs stores: the failed-parse
// reason (AD-4, AD-6, AD-10), the Q-38 last-text tracker, the AD-17 `loaded()` launch snapshot and
// the AD-15 halted/booting write guard. Plain module: no runes, no storage access (each store
// passes its own `read(KEY)` text and `game.state.kind`), no store imports.

/** A failed parse result without `ok` (distributive: each failure keeps its own fields). */
export type RejectReasonOf<R> = R extends { readonly ok: false } ? Omit<R, 'ok'> : never;

/** The failed parse result shape every stored-key parser returns (AD-7, AD-10). */
type ParseFailure =
  | { readonly ok: false; readonly reason: 'version-unreadable' }
  | { readonly ok: false; readonly reason: string; readonly version: number };

/** Strips `ok` from a failed parse result; `version` only when the version was readable. */
export function rejectReason<F extends ParseFailure>(parsed: F): RejectReasonOf<F> {
  return (
    'version' in parsed
      ? { reason: parsed.reason, version: parsed.version }
      : { reason: parsed.reason }
  ) as RejectReasonOf<F>;
}

/** Q-38: the last text a store read or successfully wrote for its key (`null` when absent). */
export interface LastText {
  remember(text: string | null): void;
  /** Whether the key's current text differs from the remembered one. */
  isStale(current: string | null): boolean;
  text(): string | null;
}

export function trackLastText(): LastText {
  let last: string | null = null;
  return {
    remember(text) {
      last = text;
    },
    isStale(current) {
      return current !== last;
    },
    text() {
      return last;
    },
  };
}

/** AD-17 `loaded()`: the launch result, set once by `load()`; `null` is a value (absent key). */
export interface LaunchSnapshot<T> {
  /** Throws `twice` when the snapshot is already set. */
  assertUnset(twice: string): void;
  set(value: T): void;
  /** The snapshot; throws `early()` while unset. */
  get(early: () => string): T;
}

export function launchSnapshot<T>(): LaunchSnapshot<T> {
  let launch: T | undefined;
  return {
    assertUnset(twice) {
      if (launch !== undefined) throw new Error(twice);
    },
    set(value) {
      launch = value;
    },
    get(early) {
      if (launch === undefined) throw new Error(early());
      return launch;
    },
  };
}

/** AD-15: a store write while the game store is halted or booting is a bug. */
export function assertWritable(kind: string, op: string): void {
  if (kind === 'halted' || kind === 'booting') throw new Error(`AD-15 ${op}() while ${kind}`);
}
