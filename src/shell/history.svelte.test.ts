import { afterEach, describe, expect, it, vi } from 'vitest';
import historyNull from '../../fixtures/history-invalid-null.json' with { type: 'json' };
import historyRecordsNotArray from '../../fixtures/history-invalid-records-not-array.json' with {
  type: 'json',
};
import historyVersionUnknown from '../../fixtures/history-invalid-version-unknown.json' with {
  type: 'json',
};
import threeRecords from '../../fixtures/history-three-records.json' with { type: 'json' };
import gaveUp from '../../fixtures/session-gave-up.json' with { type: 'json' };
import invalidNull from '../../fixtures/session-invalid-null.json' with { type: 'json' };
import place from '../../fixtures/session-place.json' with { type: 'json' };
import won from '../../fixtures/session-won.json' with { type: 'json' };
import {
  type Command,
  parseHistory,
  type Session,
  serializeHistory,
  statistics,
} from '../engine/index';

const KEY = 'wordcell:session';
const HISTORY = 'wordcell:history';
const PREFS = 'wordcell:prefs';
// AD-17 `current().history` for a never-written history.
const EMPTY = { version: 1, records: [] };
// AD-7 defaults: `current().prefs` for never-written prefs.
const DEFAULT_PREFS = { version: 1, animationSpeed: 'normal', showTimer: false };
const UNDO: Command = { type: 'undo' };
const REDO: Command = { type: 'redo' };

type Options = {
  stored?: string;
  history?: string;
  /** Seeds `wordcell:prefs`. */
  prefs?: string;
  /** Calls `prefs.load()` after the imports (default true; false only for import safety). */
  loadPrefs?: boolean;
  storage?: Partial<FakeStorage>;
  seed?: number;
};
type FakeStorage = ReturnType<typeof fakeStorage>;

// `writes` logs setItem and removeItem (as `[key, null]`) in order; `control.fail` returns the
// error a call throws before it changes anything (undefined: the call succeeds).
function fakeStorage(stored: string | undefined, historyText?: string, prefsText?: string) {
  const map = new Map<string, string>(stored === undefined ? [] : [[KEY, stored]]);
  if (historyText !== undefined) map.set(HISTORY, historyText);
  if (prefsText !== undefined) map.set(PREFS, prefsText);
  const writes: [string, string | null][] = [];
  const control: { fail: (op: 'set' | 'remove', key: string) => Error | undefined } = {
    fail: () => undefined,
  };
  return {
    map,
    writes,
    control,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      const error = control.fail('set', key);
      if (error !== undefined) throw error;
      writes.push([key, value]);
      map.set(key, value);
    },
    removeItem: (key: string) => {
      const error = control.fail('remove', key);
      if (error !== undefined) throw error;
      writes.push([key, null]);
      map.delete(key);
    },
  };
}

// AD-10 stub: the root element's inline style (map-backed).
function fakeStyle() {
  const props = new Map<string, string>();
  return {
    props,
    setProperty: (name: string, value: string) => {
      props.set(name, value);
    },
    getPropertyValue: (name: string) => props.get(name) ?? '',
  };
}

// Fresh store and clock modules per test, over stubbed window (an EventTarget: the store adds its
// Q-38 `storage` listener at import), document (an EventTarget with a settable visibilityState and
// a `documentElement.style`), matchMedia, localStorage, performance and crypto; `prefs.load()` runs
// after the imports, as `main.ts` does before `game.load()`. `added(type)` lists the listeners the
// store added after import (Node's dispatchEvent swallows a listener's throw, so tests call them
// directly).
async function setup(options: Options = {}) {
  const win = new EventTarget();
  vi.stubGlobal('window', win);
  const style = fakeStyle();
  const doc = Object.assign(new EventTarget(), {
    visibilityState: 'visible' as DocumentVisibilityState,
    documentElement: { style },
  });
  vi.stubGlobal('document', doc);
  // The reduced-motion MediaQueryList: not matching; prefs cases live in prefs.svelte.test.ts.
  const queries: string[] = [];
  vi.stubGlobal('matchMedia', (query: string) => {
    queries.push(query);
    return Object.assign(new EventTarget(), { matches: false });
  });
  vi.resetModules();
  const storage = {
    ...fakeStorage(options.stored, options.history, options.prefs),
    ...options.storage,
  };
  vi.stubGlobal('localStorage', storage);
  const time = { now: 0 };
  vi.stubGlobal('performance', { now: () => time.now });
  if (options.seed !== undefined) {
    const seed = options.seed;
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint32Array) => {
        array[0] = seed;
        return array;
      },
    });
  }
  const { game } = await import('./game.svelte');
  const { scoreHistory } = await import('./history.svelte');
  const { prefs } = await import('./prefs.svelte');
  const clock = await import('./clock');
  if (options.loadPrefs ?? true) prefs.load();
  // A synthetic `storage` event (another window's write) dispatched on the stubbed window.
  const storageEvent = (key: string | null, area: object, newValue: string | null = 'x') => {
    win.dispatchEvent(Object.assign(new Event('storage'), { key, newValue, storageArea: area }));
  };
  const spies = [vi.spyOn(doc, 'addEventListener'), vi.spyOn(win, 'addEventListener')];
  const added = (type: string) =>
    spies.flatMap((spy) =>
      spy.mock.calls
        .filter(([t]) => t === type)
        .map(([, listener]) => listener as unknown as (event: object) => void),
    );
  // Calls the one listener the store added for `type`.
  const fire = (type: string, event: object = {}) => {
    const listeners = added(type);
    if (listeners.length !== 1) throw new Error(`${listeners.length} ${type} listeners`);
    listeners[0]?.(event);
  };
  return {
    game,
    scoreHistory,
    prefs,
    clock,
    storage,
    time,
    storageEvent,
    doc,
    style,
    queries,
    added,
    fire,
  };
}

async function active(stored: string, historyText?: string) {
  const env = await setup({ stored, history: historyText });
  env.game.load();
  return env;
}

// The active Session reported by `current()`; throws unless active.
function sessionOf(game: Awaited<ReturnType<typeof setup>>['game']): Session {
  const now = game.current();
  if (now.kind !== 'active') throw new Error(`not active: ${now.kind}`);
  return now.session;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('score history store', () => {
  const THREE = JSON.stringify(threeRecords);
  const UNKNOWN = JSON.stringify(historyVersionUnknown);
  const UNKNOWN_REASON = { reason: 'version-unknown', version: 2 };
  const EMPTY_TEXT = '{"version":1,"records":[]}';
  const PERSISTED = { persisted: true };
  type Env = Awaited<ReturnType<typeof setup>>;

  const historyWrites = (env: Env) => env.storage.writes.filter(([key]) => key === HISTORY);
  const recordsOf = (text: string | undefined) => JSON.parse(text ?? '').records;

  // session-won.json with no history, after the Undo (un-finish, nothing to remove).
  async function unfinishedWon(): Promise<Env> {
    const env = await active(JSON.stringify(won));
    env.game.dispatch(UNDO);
    expect(historyWrites(env)).toEqual([]);
    return env;
  }

  const loads: [string, () => Promise<Env>, object, object | null, object][] = [
    [
      'absent',
      () => active(JSON.stringify(place)),
      { status: 'ok', records: [] },
      null,
      { kind: 'active', session: place, history: EMPTY, prefs: DEFAULT_PREFS },
    ],
    [
      'ok (history-three-records.json)',
      () => active(JSON.stringify(place), THREE),
      { status: 'ok', records: threeRecords.records },
      threeRecords,
      { kind: 'active', session: place, history: threeRecords, prefs: DEFAULT_PREFS },
    ],
    [
      'unreadable (history-invalid-version-unknown.json)',
      () => active(JSON.stringify(place), UNKNOWN),
      { status: 'unreadable', reason: UNKNOWN_REASON },
      { rejected: UNKNOWN_REASON },
      {
        kind: 'active',
        session: place,
        history: { rejected: UNKNOWN_REASON },
        prefs: DEFAULT_PREFS,
      },
    ],
    [
      'unreadable (history-invalid-null.json)',
      () => active(JSON.stringify(place), JSON.stringify(historyNull)),
      { status: 'unreadable', reason: { reason: 'version-unreadable' } },
      { rejected: { reason: 'version-unreadable' } },
      {
        kind: 'active',
        session: place,
        history: { rejected: { reason: 'version-unreadable' } },
        prefs: DEFAULT_PREFS,
      },
    ],
    [
      'unreadable (history-invalid-records-not-array.json)',
      () => active(JSON.stringify(place), JSON.stringify(historyRecordsNotArray)),
      { status: 'unreadable', reason: { reason: 'contents-unreadable', version: 1 } },
      { rejected: { reason: 'contents-unreadable', version: 1 } },
      {
        kind: 'active',
        session: place,
        history: { rejected: { reason: 'contents-unreadable', version: 1 } },
        prefs: DEFAULT_PREFS,
      },
    ],
    [
      'beside a rejected Session',
      () => active(JSON.stringify(invalidNull), THREE),
      { status: 'ok', records: threeRecords.records },
      threeRecords,
      { kind: 'rejected', reason: { reason: 'version-unreadable' } },
    ],
    [
      'halted during boot',
      async () => {
        const env = await setup({ stored: JSON.stringify(place), history: THREE });
        env.storageEvent(KEY, env.storage);
        env.game.load();
        return env;
      },
      { status: 'ok', records: threeRecords.records },
      threeRecords,
      { kind: 'halted' },
    ],
  ];
  for (const [name, start, state, launch, now] of loads) {
    it(`AD-17 load with the history ${name} sets the state, writes no history and isStale() turns true on another write`, async () => {
      const env = await start();
      expect(env.scoreHistory.state).toEqual(state);
      expect(env.game.loaded().history).toEqual(launch);
      expect(env.game.current()).toEqual(now);
      expect(historyWrites(env)).toEqual([]);
      expect(() => env.scoreHistory.load()).toThrow('AD-6 load() called twice');
      expect(env.scoreHistory.isStale()).toBe(false);
      env.storage.map.set(HISTORY, 'another writer');
      expect(env.scoreHistory.isStale()).toBe(true);
    });
  }

  it('AD-4 a first launch loads the absent history and writes only wordcell:session', async () => {
    const env = await setup({ seed: 7 });
    env.game.load();
    expect(env.storage.writes.map(([key]) => key)).toEqual([KEY]);
    expect(env.scoreHistory.state).toEqual({ status: 'ok', records: [] });
    expect(env.game.loaded()).toEqual({ session: null, history: null, prefs: null });
  });

  it('AD-4 a finish writes the history before the Session; an un-finish of the recorded game removes it', async () => {
    const env = await unfinishedWon();
    const before = sessionOf(env.game);
    env.storage.writes.length = 0;
    expect(env.game.dispatch(REDO)).toEqual({ changed: true, finished: 'won' });
    const [first, second] = env.storage.writes;
    expect(env.storage.writes).toHaveLength(2);
    expect(first?.[0]).toBe(HISTORY);
    expect(second?.[0]).toBe(KEY);
    const record = recordsOf(first?.[1] ?? '')[0];
    const { activeMs: _ms, ...rest } = record;
    const { activeMs: _fixtureMs, ...fixtureRest } = threeRecords.records[0] ?? {};
    expect(rest).toEqual(fixtureRest);
    expect(record.activeMs).toBe(sessionOf(env.game).activeMs);
    expect(env.scoreHistory.state).toEqual({ status: 'ok', records: [record] });
    expect(env.game.current()).toEqual({
      kind: 'active',
      session: sessionOf(env.game),
      history: { version: 1, records: [record] },
      prefs: DEFAULT_PREFS,
    });
    env.game.dispatch(UNDO);
    expect(env.storage.map.get(HISTORY)).toBe(EMPTY_TEXT);
    expect(env.scoreHistory.state).toEqual({ status: 'ok', records: [] });
    expect(sessionOf(env.game)).not.toBe(before);
  });

  it('AD-4 a give-up finish appends its gaveUp record before the Session write', async () => {
    const env = await active(JSON.stringify(gaveUp), THREE);
    env.game.dispatch(UNDO);
    env.storage.writes.length = 0;
    expect(env.game.dispatch({ type: 'giveUp' })).toEqual({ changed: true, finished: 'gaveUp' });
    expect(env.storage.writes.map(([key]) => key)).toEqual([HISTORY, KEY]);
    const records = recordsOf(env.storage.map.get(HISTORY));
    expect(records).toHaveLength(threeRecords.records.length);
    expect(records.at(-1)).toMatchObject({ outcome: 'gaveUp', seed: gaveUp.seed });
  });

  it('AD-4 a non-finishing dispatch with a throwing Session write touches no history key', async () => {
    const env = await active(JSON.stringify(place), THREE);
    env.storage.control.fail = (op, key) =>
      op === 'set' && key === KEY ? new Error('session failed') : undefined;
    expect(() => env.game.dispatch(UNDO)).toThrow('session failed');
    expect(historyWrites(env)).toEqual([]);
    expect(env.storage.map.get(HISTORY)).toBe(THREE);
  });

  it('AD-4 a throwing history write on a finish propagates before the Session write; both keys and states unchanged', async () => {
    const env = await unfinishedWon();
    const session = env.storage.map.get(KEY);
    const gameState = env.game.state;
    const historyState = env.scoreHistory.state;
    env.storage.writes.length = 0;
    env.storage.control.fail = (op, key) =>
      op === 'set' && key === HISTORY ? new Error('history failed') : undefined;
    expect(() => env.game.dispatch(REDO)).toThrow('history failed');
    expect(env.storage.writes).toEqual([]);
    expect(env.storage.map.get(KEY)).toBe(session);
    expect(env.storage.map.has(HISTORY)).toBe(false);
    expect(env.game.state).toBe(gameState);
    expect(env.scoreHistory.state).toBe(historyState);
    expect(env.game.isStale()).toBe(false);
    expect(env.scoreHistory.isStale()).toBe(false);
  });

  const rollbacks: [string, () => Promise<Env>, Command, string | undefined][] = [
    ['absent history (remove)', unfinishedWon, REDO, undefined],
    [
      'seeded history (write-back)',
      () => active(JSON.stringify(gaveUp), THREE),
      UNDO,
      JSON.stringify({ ...threeRecords, records: threeRecords.records.slice(0, -1) }),
    ],
  ];
  for (const [name, start, command, written] of rollbacks) {
    it(`AD-4 Q-39 a throwing Session write after the history write rolls the ${name} back and rethrows`, async () => {
      const env = await start();
      const stored = env.storage.map.get(HISTORY);
      const session = env.storage.map.get(KEY);
      const gameState = env.game.state;
      const historyState = env.scoreHistory.state;
      env.storage.writes.length = 0;
      env.storage.control.fail = (op, key) =>
        op === 'set' && key === KEY ? new Error('session failed') : undefined;
      expect(() => env.game.dispatch(command)).toThrow('session failed');
      const [first, second] = env.storage.writes;
      expect(first?.[0]).toBe(HISTORY);
      if (written !== undefined) expect(first?.[1]).toBe(written);
      else {
        const records = recordsOf(first?.[1] ?? undefined);
        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({ outcome: 'won', seed: won.seed });
      }
      expect(second).toEqual([HISTORY, stored ?? null]);
      expect(env.storage.writes).toHaveLength(2);
      expect(env.storage.map.get(HISTORY)).toBe(stored);
      expect(env.storage.map.get(KEY)).toBe(session);
      expect(env.game.state).toBe(gameState);
      expect(env.scoreHistory.state).toBe(historyState);
      expect(env.game.isStale()).toBe(false);
      expect(env.scoreHistory.isStale()).toBe(false);
    });
  }

  it('AD-4 Q-39 a throwing rollback after a throwing Session write propagates its own error', async () => {
    const env = await unfinishedWon();
    const errorA = new Error('A');
    const errorB = new Error('B');
    env.storage.control.fail = (op, key) => {
      if (op === 'set' && key === KEY) return errorA;
      if (op === 'remove' && key === HISTORY) return errorB;
      return undefined;
    };
    const session = env.storage.map.get(KEY);
    const gameState = env.game.state;
    expect(() => env.game.dispatch(REDO)).toThrow(errorB);
    // The rollback restores bytes first: its remove threw, so the appended record stays in memory.
    const state = env.scoreHistory.state;
    if (state.status !== 'ok') throw new Error('history is unreadable');
    expect(state.records).toHaveLength(1);
    expect(env.storage.map.get(HISTORY)).toBe(
      serializeHistory({ version: 1, records: state.records }),
    );
    expect(env.scoreHistory.isStale()).toBe(false);
    expect(env.storage.map.get(KEY)).toBe(session);
    expect(env.game.state).toBe(gameState);
  });

  it('AD-4 Q-39 a throwing write-back rollback after a throwing Session write propagates its own error', async () => {
    const env = await active(JSON.stringify(gaveUp), THREE);
    const errorA = new Error('A');
    const errorB = new Error('B');
    let historySets = 0;
    env.storage.control.fail = (op, key) => {
      if (op === 'set' && key === KEY) return errorA;
      if (op === 'set' && key === HISTORY && ++historySets === 2) return errorB;
      return undefined;
    };
    const session = env.storage.map.get(KEY);
    const gameState = env.game.state;
    expect(() => env.game.dispatch(UNDO)).toThrow(errorB);
    // The rollback restores bytes first: its write-back threw, so the shortened records stay in memory.
    const state = env.scoreHistory.state;
    if (state.status !== 'ok') throw new Error('history is unreadable');
    expect(state.records).toEqual(threeRecords.records.slice(0, -1));
    expect(env.storage.map.get(HISTORY)).toBe(
      serializeHistory({ version: 1, records: state.records }),
    );
    expect(env.scoreHistory.isStale()).toBe(false);
    expect(env.storage.map.get(KEY)).toBe(session);
    expect(env.game.state).toBe(gameState);
  });

  const own: [string, (env: Env) => void][] = [
    [
      'finish',
      (env) => {
        env.game.dispatch(UNDO);
        env.game.dispatch(REDO);
        expect(env.storage.map.has(HISTORY)).toBe(true);
      },
    ],
    [
      'reset()',
      (env) => {
        env.scoreHistory.reset();
        expect(env.storage.map.get(HISTORY)).toBe(EMPTY_TEXT);
      },
    ],
  ];
  for (const [name, act] of own) {
    it(`AD-4 an own ${name}, then a persisted pageshow does not halt`, async () => {
      const env = await active(JSON.stringify(won));
      env.game.registerLifecycle();
      act(env);
      expect(env.scoreHistory.isStale()).toBe(false);
      env.fire('pageshow', PERSISTED);
      expect(env.game.current().kind).toBe('active');
      expect(env.game.haltCause).toBeUndefined();
    });
  }

  const others: [string, string | undefined, (env: Env) => void][] = [
    ['absent → present', undefined, (env) => env.storage.map.set(HISTORY, THREE)],
    ['changed', THREE, (env) => env.storage.map.set(HISTORY, EMPTY_TEXT)],
    ['removed', THREE, (env) => env.storage.map.delete(HISTORY)],
  ];
  for (const [name, historyText, change] of others) {
    it(`AD-4 wordcell:history ${name} by another writer, then a persisted pageshow halts with another-window`, async () => {
      const env = await active(JSON.stringify(place), historyText);
      env.game.registerLifecycle();
      change(env);
      expect(env.game.isStale()).toBe(false);
      expect(env.scoreHistory.isStale()).toBe(true);
      env.fire('pageshow', PERSISTED);
      expect(env.game.current()).toEqual({ kind: 'halted' });
      expect(env.game.haltCause).toBe('another-window');
    });
  }

  it('AD-4 replay() and newGame() leave the wordcell:history bytes and the history state unchanged', async () => {
    const env = await active(JSON.stringify(gaveUp), THREE);
    const state = env.scoreHistory.state;
    env.game.replay();
    env.game.newGame();
    expect(historyWrites(env)).toEqual([]);
    expect(env.storage.map.get(HISTORY)).toBe(THREE);
    expect(env.scoreHistory.state).toBe(state);
  });

  it('AD-6 recorded: a loaded finished game with no record is false; Redo onto it true; Undo false', async () => {
    const env = await active(JSON.stringify(won));
    expect(env.game.view?.status).toBe('won');
    expect(env.scoreHistory.recorded).toBe(false);
    env.game.dispatch(UNDO);
    expect(env.scoreHistory.recorded).toBe(false);
    env.game.dispatch(REDO);
    expect(env.scoreHistory.recorded).toBe(true);
    env.game.dispatch(UNDO);
    expect(env.scoreHistory.recorded).toBe(false);
  });

  it('AD-6 recorded is true for session-gave-up.json beside its record and false after the Undo removes it', async () => {
    const env = await active(JSON.stringify(gaveUp), THREE);
    expect(env.scoreHistory.recorded).toBe(true);
    env.game.dispatch(UNDO);
    expect(env.scoreHistory.recorded).toBe(false);
    expect(recordsOf(env.storage.map.get(HISTORY))).toEqual(threeRecords.records.slice(0, -1));
  });

  it('AD-6 statistics equals the engine statistics(records) for history-three-records.json', async () => {
    const env = await active(JSON.stringify(place), THREE);
    const result = parseHistory(THREE);
    if (!result.ok) throw new Error(`fixture does not parse: ${result.reason}`);
    expect(env.scoreHistory.statistics).toEqual(statistics(result.history.records));
  });

  it('AD-6 while unreadable: recorded false, statistics undefined and a finish writes no history', async () => {
    const env = await active(JSON.stringify(won), UNKNOWN);
    expect(env.scoreHistory.recorded).toBe(false);
    expect(env.scoreHistory.statistics).toBeUndefined();
    env.game.dispatch(UNDO);
    expect(env.game.dispatch(REDO)).toEqual({ changed: true, finished: 'won' });
    expect(historyWrites(env)).toEqual([]);
    expect(env.storage.map.get(HISTORY)).toBe(UNKNOWN);
    expect(env.scoreHistory.recorded).toBe(false);
  });

  it('AD-6 an unreadable load, then reset(): the empty history is written and a following finish is recorded', async () => {
    const env = await active(JSON.stringify(won), UNKNOWN);
    env.scoreHistory.reset();
    expect(env.storage.map.get(HISTORY)).toBe(EMPTY_TEXT);
    expect(EMPTY_TEXT).toBe(serializeHistory({ version: 1, records: [] }));
    expect(env.scoreHistory.state).toEqual({ status: 'ok', records: [] });
    expect(env.scoreHistory.statistics).toEqual(statistics([]));
    expect(env.game.loaded().history).toEqual({ rejected: UNKNOWN_REASON });
    env.game.dispatch(UNDO);
    env.game.dispatch(REDO);
    expect(env.scoreHistory.recorded).toBe(true);
    expect(recordsOf(env.storage.map.get(HISTORY))).toHaveLength(1);
  });

  it('AD-6 reset() while rejected writes the empty history and sets the state ok', async () => {
    const env = await active(JSON.stringify(invalidNull), THREE);
    env.scoreHistory.reset();
    expect(env.storage.writes).toEqual([[HISTORY, EMPTY_TEXT]]);
    expect(env.scoreHistory.state).toEqual({ status: 'ok', records: [] });
    expect(env.game.current().kind).toBe('rejected');
  });

  it('AD-15 reset() throws while booting and writes nothing', async () => {
    const env = await setup({ stored: JSON.stringify(place) });
    expect(() => env.scoreHistory.reset()).toThrow('AD-15 reset() while booting');
    expect(env.storage.writes).toEqual([]);
  });

  it('AD-15 while halted, reset() and dispatch throw and no wordcell:history write happens', async () => {
    const env = await unfinishedWon();
    env.game.halt('fatal', 'boom');
    expect(() => env.scoreHistory.reset()).toThrow('AD-15 reset() while halted');
    expect(() => env.game.dispatch(REDO)).toThrow('while halted');
    expect(historyWrites(env)).toEqual([]);
    expect(env.storage.map.has(HISTORY)).toBe(false);
  });
});

// Ticket 4.13 R6: the guard message now passed through stored-key.ts, pinned exactly.
describe('score history store R6 guard messages', () => {
  it('AD-17 history loaded() before load() throws "AD-17 history loaded() before load()"', async () => {
    const env = await setup();
    expect(() => env.scoreHistory.loaded()).toThrow(/^AD-17 history loaded\(\) before load\(\)$/);
  });
});
