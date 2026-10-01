import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import historyVersionUnknown from '../../fixtures/history-invalid-version-unknown.json' with {
  type: 'json',
};
import threeRecords from '../../fixtures/history-three-records.json' with { type: 'json' };
import composing from '../../fixtures/session-composing.json' with { type: 'json' };
import gaveUp from '../../fixtures/session-gave-up.json' with { type: 'json' };
import idleFresh from '../../fixtures/session-idle-fresh.json' with { type: 'json' };
import invalidNull from '../../fixtures/session-invalid-null.json' with { type: 'json' };
import invalidLastOnly from '../../fixtures/session-invalid-s2-last-only.json' with {
  type: 'json',
};
import place from '../../fixtures/session-place.json' with { type: 'json' };
import won from '../../fixtures/session-won.json' with { type: 'json' };
import {
  accrue,
  apply,
  type Command,
  createSession,
  EN,
  parseHistory,
  parseSession,
  type Session,
  serializeHistory,
  serializeSession,
  statistics,
} from '../engine/index';

const KEY = 'wordcell:session';
const HISTORY = 'wordcell:history';
const PREFS = 'wordcell:prefs';
// AD-17 `current().history` for a never-written history.
const EMPTY = { version: 1, records: [] };
// AD-7 defaults: `current().prefs` for never-written prefs.
const DEFAULT_PREFS = { version: 1, animationSpeed: 'normal', showTimer: false };
// Q-39 harness: a fake storage `control.fail` that throws on every setItem.
const FAIL_SETS = (op: 'set' | 'remove') =>
  op === 'set' ? new Error('setItem failed') : undefined;
const UNDO: Command = { type: 'undo' };
const REDO: Command = { type: 'redo' };
// The AD-2 TABLE's R-71 no-op on session-composing.json.
const NO_OP: Command = { type: 'setDestinationCount', k: 1 };
const VALIDATE: Command = { type: 'validate' };

// R-74 fresh shape (AD-4 newGame()/replay()).
function freshShape(seed: number) {
  return {
    version: idleFresh.version,
    seed,
    moves: [],
    cursor: { index: 0, phase: 'idle' },
    gaveUp: false,
    activeMs: 0,
  };
}

function parsed(text: string): Session {
  const result = parseSession(text, EN);
  if (!result.ok) throw new Error(`fixture does not parse: ${result.reason}`);
  return result.session;
}

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

describe('game store', () => {
  it('AD-4 reactivity probe: a dispatch changes game.view', async () => {
    const { game } = await active(JSON.stringify(place));
    expect(game.view?.canRedo).toBe(false);
    game.dispatch(UNDO);
    expect(game.view?.canRedo).toBe(true);
  });

  it('AD-4 the store starts booting and importing it reads no storage', async () => {
    const throwing = () => {
      throw new Error('storage touched at import');
    };
    const { game, queries, style } = await setup({
      storage: { getItem: throwing, setItem: throwing, removeItem: throwing },
      loadPrefs: false,
    });
    expect(queries).toEqual([]);
    expect([...style.props]).toEqual([]);
    expect(game.state).toEqual({ kind: 'booting' });
    expect(game.current()).toEqual({ kind: 'booting' });
    expect(game.view).toBeUndefined();
    expect(() => game.loaded()).toThrow();
  });

  it('AD-4 first launch writes createSession(newSeed()), then enters active', async () => {
    const { game, storage } = await setup({ seed: 7 });
    game.load();
    expect(storage.writes).toHaveLength(1);
    const [key, text] = storage.writes[0] ?? [];
    expect(key).toBe(KEY);
    const session = parsed(text ?? '');
    expect(session.seed).toBe(7);
    expect(session.activeMs).toBe(0);
    expect(game.current()).toEqual({
      kind: 'active',
      session,
      history: EMPTY,
      prefs: DEFAULT_PREFS,
    });
    expect(JSON.parse(text ?? '')).toEqual(session);
    expect(game.loaded()).toEqual({ session: null, history: null, prefs: null });
  });

  for (const seed of [0, 4294967295]) {
    it(`AD-5 first launch with getRandomValues stubbed to ${seed} stores that seed and parses back ok`, async () => {
      const { game, storage } = await setup({ seed });
      game.load();
      const text = storage.map.get(KEY) ?? '';
      expect(parseSession(text, EN).ok).toBe(true);
      expect(parsed(text).seed).toBe(seed);
      expect(game.current()).toEqual({
        kind: 'active',
        session: parsed(text),
        history: EMPTY,
        prefs: DEFAULT_PREFS,
      });
    });
  }

  it('AD-4 a throwing first-launch write rethrows, stays booting and loaded() still throws', async () => {
    const { game, storage } = await setup();
    storage.control.fail = FAIL_SETS;
    expect(() => game.load()).toThrow('setItem failed');
    expect(game.state).toEqual({ kind: 'booting' });
    expect(() => game.loaded()).toThrow();
    expect(storage.map.has(KEY)).toBe(false);
  });

  it('AD-4 a parse-ok load enters active with the parsed Session and writes nothing', async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await active(text);
    expect(storage.writes).toEqual([]);
    expect(game.current()).toEqual({
      kind: 'active',
      session: JSON.parse(text),
      history: EMPTY,
      prefs: DEFAULT_PREFS,
    });
    expect(game.loaded()).toEqual({ session: JSON.parse(text), history: null, prefs: null });
  });

  it('AD-4 a version-unknown load is rejected with its version and writes nothing', async () => {
    const text = JSON.stringify({ ...idleFresh, version: 99 });
    const { game, storage } = await active(text);
    const reason = { reason: 'version-unknown', version: 99 };
    expect(game.state).toEqual({ kind: 'rejected', reason });
    expect(game.current()).toEqual({ kind: 'rejected', reason });
    expect(game.loaded()).toEqual({ session: { rejected: reason }, history: null, prefs: null });
    expect(game.view).toBeUndefined();
    expect(storage.writes).toEqual([]);
    expect(storage.map.get(KEY)).toBe(text);
  });

  it('AD-4 a version-unreadable load (session-invalid-null.json) is rejected without a version', async () => {
    const { game, storage } = await active(JSON.stringify(invalidNull));
    const reason = { reason: 'version-unreadable' };
    expect(game.current()).toEqual({ kind: 'rejected', reason });
    expect(game.loaded()).toEqual({ session: { rejected: reason }, history: null, prefs: null });
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 a replay-failed load (session-invalid-s2-last-only.json) is rejected with its version', async () => {
    const { game, storage } = await active(JSON.stringify(invalidLastOnly));
    const reason = { reason: 'replay-failed', version: 1 };
    expect(game.current()).toEqual({ kind: 'rejected', reason });
    expect(game.loaded()).toEqual({ session: { rejected: reason }, history: null, prefs: null });
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 load() after an active load throws', async () => {
    const { game } = await active(JSON.stringify(place));
    expect(() => game.load()).toThrow();
  });

  it('AD-4 load() after a rejected load throws', async () => {
    const { game, storage } = await active(JSON.stringify(invalidNull));
    expect(() => game.load()).toThrow();
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 dispatch throws while booting and writes nothing', async () => {
    const { game, storage } = await setup({ stored: JSON.stringify(place) });
    expect(() => game.dispatch(UNDO)).toThrow();
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 dispatch throws while rejected and writes nothing', async () => {
    const { game, storage } = await active(JSON.stringify(invalidNull));
    expect(() => game.dispatch(UNDO)).toThrow();
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 Undo writes the post-Undo Session, updates the state and reports changed', async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await active(text);
    const expected = apply(parsed(text), UNDO, { lang: EN }).session;
    expect(game.dispatch(UNDO)).toEqual({ changed: true });
    expect(storage.writes).toEqual([[KEY, serializeSession(expected)]]);
    expect(game.current()).toEqual({
      kind: 'active',
      session: expected,
      history: EMPTY,
      prefs: DEFAULT_PREFS,
    });
  });

  it('AD-4 a throwing session write rethrows and leaves game.state the same reference', async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await active(text);
    const before = game.state;
    storage.control.fail = FAIL_SETS;
    expect(() => game.dispatch(UNDO)).toThrow('setItem failed');
    expect(game.state).toBe(before);
    expect(storage.map.get(KEY)).toBe(text);
  });

  it('AD-4 a no-op with the clock paused reports changed false and writes nothing', async () => {
    const { game, storage } = await active(JSON.stringify(composing));
    const before = game.state;
    expect(game.dispatch(NO_OP)).toEqual({ changed: false });
    expect(storage.writes).toEqual([]);
    expect(game.state).toBe(before);
  });

  it('AD-4 an accrue-only dispatch reports changed false and writes the accrued Session', async () => {
    const text = JSON.stringify(composing);
    const { game, storage, clock, time } = await active(text);
    clock.resume(time.now);
    time.now += 1000;
    expect(game.dispatch(NO_OP)).toEqual({ changed: false });
    const expected = { ...parsed(text), activeMs: composing.activeMs + 1000 };
    expect(storage.writes).toEqual([[KEY, serializeSession(expected)]]);
    expect(game.current()).toEqual({
      kind: 'active',
      session: expected,
      history: EMPTY,
      prefs: DEFAULT_PREFS,
    });
  });

  it('AD-4 dispatch takes and accrues the clock ms; the written Session is Undo of the accrued one', async () => {
    const text = JSON.stringify(place);
    const { game, storage, clock, time } = await active(text);
    clock.resume(time.now);
    time.now += 1000;
    expect(game.dispatch(UNDO)).toEqual({ changed: true });
    const expected = apply(accrue(parsed(text), 1000, EN), UNDO, { lang: EN }).session;
    expect(expected.activeMs).toBe(place.activeMs + 1000);
    expect(storage.writes).toEqual([[KEY, serializeSession(expected)]]);
    expect(game.current()).toEqual({
      kind: 'active',
      session: expected,
      history: EMPTY,
      prefs: DEFAULT_PREFS,
    });
  });

  it('AD-4 dispatch order: accrue runs before apply, so a Redo onto a win keeps the accrued ms', async () => {
    const { game, storage, clock, time } = await active(JSON.stringify(won));
    game.dispatch(UNDO);
    clock.resume(time.now);
    time.now += 1000;
    expect(game.dispatch(REDO)).toEqual({ changed: true, finished: 'won' });
    const [, text] = storage.writes.at(-1) ?? [];
    expect(parsed(text ?? '').activeMs).toBe(won.activeMs + 1000);
  });

  it('AD-4 Undo off a win reports unfinished; Redo onto it reports finished won', async () => {
    const { game } = await active(JSON.stringify(won));
    expect(game.view?.status).toBe('won');
    expect(game.dispatch(UNDO)).toEqual({ changed: true, unfinished: true });
    expect(game.dispatch(REDO)).toEqual({ changed: true, finished: 'won' });
  });

  it('AD-4 Undo off a gave-up game reports unfinished; Give up again reports finished gaveUp', async () => {
    const { game } = await active(JSON.stringify(gaveUp));
    expect(game.view?.status).toBe('gaveUp');
    expect(game.dispatch(UNDO)).toEqual({ changed: true, unfinished: true });
    // Undo of a give-up clears the flag (R-75); Redo has no data then (AD-2 TABLE), so Give up.
    expect(game.view?.canGiveUp).toBe(true);
    expect(game.dispatch({ type: 'giveUp' })).toEqual({ changed: true, finished: 'gaveUp' });
  });

  it('AD-4 loaded() is unchanged after a changing dispatch', async () => {
    const text = JSON.stringify(place);
    const { game } = await active(text);
    game.dispatch(UNDO);
    expect(game.loaded()).toEqual({ session: JSON.parse(text), history: null, prefs: null });
    expect(sessionOf(game)).not.toEqual(JSON.parse(text));
  });
});

describe('game store newGame() and replay()', () => {
  const REJECTED = JSON.stringify(invalidNull);
  const REJECT_LAUNCH = {
    session: { rejected: { reason: 'version-unreadable' } },
    history: null,
    prefs: null,
  };

  async function rejected(seed: number) {
    const env = await setup({ stored: REJECTED, seed });
    env.game.load();
    return env;
  }

  // Sentinel texts for the other keys, set before the call, so a write or remove of them shows.
  const OTHER_KEYS: [string, string][] = [
    ['wordcell:history', 'history sentinel'],
    ['wordcell:prefs', 'prefs sentinel'],
  ];

  function setSentinels(env: Awaited<ReturnType<typeof setup>>): void {
    for (const [key, value] of OTHER_KEYS) env.storage.map.set(key, value);
  }

  // Asserts the stored bytes are replaced by the fresh Session, written only to wordcell:session.
  function expectFreshStored(
    env: Awaited<ReturnType<typeof setup>>,
    seed: number,
    previous: string,
  ): void {
    const text = env.storage.map.get(KEY) ?? '';
    expect(text).not.toBe(previous);
    expect(text).toBe(serializeSession(createSession(seed)));
    expect(JSON.parse(text)).toEqual(freshShape(seed));
    expect(env.storage.writes).toEqual([[KEY, text]]);
    expect([...env.storage.map.keys()].sort()).toEqual(
      [KEY, ...OTHER_KEYS.map(([key]) => key)].sort(),
    );
    for (const [key, value] of OTHER_KEYS) expect(env.storage.map.get(key)).toBe(value);
    expect(env.game.current()).toEqual({
      kind: 'active',
      session: JSON.parse(text),
      history: EMPTY,
      prefs: DEFAULT_PREFS,
    });
  }

  it('AD-4 newGame() from active stores createSession(newSeed()) before it returns', async () => {
    const text = JSON.stringify(place);
    const env = await setup({ stored: text, seed: 7 });
    env.game.load();
    setSentinels(env);
    env.game.newGame();
    expectFreshStored(env, 7, text);
  });

  it('AD-4 newGame() from rejected stores a fresh Session and loaded() keeps the launch result', async () => {
    const env = await rejected(7);
    setSentinels(env);
    env.game.newGame();
    expectFreshStored(env, 7, REJECTED);
    expect(env.game.loaded()).toEqual(REJECT_LAUNCH);
  });

  it('AD-4 replay() stores the fresh shape with the old seed', async () => {
    const text = JSON.stringify(place);
    const env = await setup({ stored: text, seed: 7 });
    env.game.load();
    setSentinels(env);
    env.game.replay();
    expectFreshStored(env, place.seed, text);
  });

  it('AD-4 newGame() while booting throws and writes nothing', async () => {
    const { game, storage } = await setup({ stored: JSON.stringify(place), seed: 7 });
    expect(() => game.newGame()).toThrow('AD-4 newGame() while booting');
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 replay() while booting throws and writes nothing', async () => {
    const { game, storage } = await setup({ stored: JSON.stringify(place) });
    expect(() => game.replay()).toThrow('AD-4 replay() while booting');
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 replay() while rejected throws and writes nothing', async () => {
    const { game, storage } = await rejected(7);
    expect(() => game.replay()).toThrow('AD-4 replay() while rejected');
    expect(storage.writes).toEqual([]);
    expect(storage.map.get(KEY)).toBe(REJECTED);
  });

  // The in-memory state after a throwing write is entry 5's halt, so only the bytes are asserted.
  it('AD-4 a throwing write in newGame() from active rethrows and leaves the stored bytes unchanged', async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await setup({ stored: text, seed: 7 });
    game.load();
    storage.control.fail = FAIL_SETS;
    expect(() => game.newGame()).toThrow('setItem failed');
    expect(storage.map.get(KEY)).toBe(text);
  });

  it('AD-4 a throwing write in newGame() from rejected rethrows and leaves the stored bytes unchanged', async () => {
    const { game, storage } = await rejected(7);
    storage.control.fail = FAIL_SETS;
    expect(() => game.newGame()).toThrow('setItem failed');
    expect(storage.map.get(KEY)).toBe(REJECTED);
  });

  it('AD-4 a throwing write in replay() rethrows and leaves the stored bytes unchanged', async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await active(text);
    storage.control.fail = FAIL_SETS;
    expect(() => game.replay()).toThrow('setItem failed');
    expect(storage.map.get(KEY)).toBe(text);
  });

  const discarded: [
    string,
    () => Promise<Awaited<ReturnType<typeof setup>>>,
    'newGame' | 'replay',
  ][] = [
    ['newGame() from active', () => active(JSON.stringify(place)), 'newGame'],
    ['newGame() from rejected', () => rejected(7), 'newGame'],
    ['replay()', () => active(JSON.stringify(place)), 'replay'],
  ];
  for (const [name, start, call] of discarded) {
    it(`AD-4 ${name} discards the taken clock ms: activeMs counts only time after it`, async () => {
      const { game, storage, clock, time } = await start();
      clock.resume(time.now);
      time.now += 700;
      game[call]();
      time.now += 300;
      expect(game.dispatch({ type: 'giveUp' })).toEqual({ changed: true, finished: 'gaveUp' });
      expect(parsed(storage.map.get(KEY) ?? '').activeMs).toBe(300);
    });
  }
});

describe('game store feedback', () => {
  // session-composing.json spells TAN; the dictionary lacks it, so Validate is rejected (R-38).
  beforeAll(() => {
    vi.doMock('./dictionary.svelte', () => ({
      dictionaryUrl: '',
      dictionary: { state: 'ready', words: new Set(['cat']) },
    }));
  });
  afterAll(() => {
    vi.doUnmock('./dictionary.svelte');
  });

  async function rejectedValidate() {
    const env = await active(JSON.stringify(composing));
    expect(env.game.feedback).toEqual({});
    expect(env.game.dispatch(VALIDATE)).toEqual({ changed: false, rejectedWord: 'tan' });
    return env;
  }

  function expectCleared(feedback: object): void {
    expect(feedback).toEqual({});
    expect('rejectedWord' in feedback).toBe(false);
  }

  it('AD-4 a failed Validate sets feedback.rejectedWord to the engine spelling', async () => {
    const { game } = await rejectedValidate();
    expect(game.feedback).toEqual({ rejectedWord: 'tan' });
  });

  it('AD-4 feedback.rejectedWord is kept on a no-op with the clock paused', async () => {
    const { game, storage } = await rejectedValidate();
    expect(game.dispatch(NO_OP)).toEqual({ changed: false });
    expect(storage.writes).toEqual([]);
    expect(game.feedback).toEqual({ rejectedWord: 'tan' });
  });

  it('AD-4 feedback.rejectedWord is kept on an accrue-only dispatch', async () => {
    const { game, storage, clock, time } = await rejectedValidate();
    clock.resume(time.now);
    time.now += 1000;
    expect(game.dispatch(NO_OP)).toEqual({ changed: false });
    expect(storage.writes).toHaveLength(1);
    expect(game.feedback).toEqual({ rejectedWord: 'tan' });
  });

  it('AD-4 feedback.rejectedWord is cleared on a changed dispatch (Undo)', async () => {
    const { game } = await rejectedValidate();
    expect(game.dispatch(UNDO).changed).toBe(true);
    expectCleared(game.feedback);
  });

  it('AD-4 feedback.rejectedWord is cleared on newGame()', async () => {
    const { game } = await rejectedValidate();
    game.newGame();
    expectCleared(game.feedback);
  });

  it('AD-4 feedback.rejectedWord is cleared on replay()', async () => {
    const { game } = await rejectedValidate();
    game.replay();
    expectCleared(game.feedback);
  });
});

describe('game store halt', () => {
  const SESSION_STORAGE = { getItem: () => null };
  const HALTED = { kind: 'halted' };

  const beforeLoad: [string, string | undefined, object][] = [
    ['the key absent', undefined, { session: null, history: null, prefs: null }],
    ['a valid Session', JSON.stringify(place), { session: place, history: null, prefs: null }],
    [
      'a rejected Session',
      JSON.stringify(invalidNull),
      { session: { rejected: { reason: 'version-unreadable' } }, history: null, prefs: null },
    ],
  ];
  for (const [name, stored, launch] of beforeLoad) {
    it(`AD-4 AD-15 a storage event before load with ${name}: load writes nothing and stays halted`, async () => {
      const { game, storage, storageEvent } = await setup({ stored, seed: 7 });
      storageEvent(KEY, storage);
      expect(game.current()).toEqual(HALTED);
      expect(game.haltCause).toBe('another-window');
      expect(() => game.load()).not.toThrow();
      expect(storage.writes).toEqual([]);
      expect(game.current()).toEqual(HALTED);
      expect(game.haltCause).toBe('another-window');
      expect(game.view).toBeUndefined();
      expect(game.loaded()).toEqual(launch);
    });
  }

  it('AD-4 fatal then a storage event: the cause stays fatal with its text', async () => {
    const { game, storage, storageEvent } = await active(JSON.stringify(place));
    game.halt('fatal', 'boom');
    storageEvent(KEY, storage);
    expect(game.current()).toEqual(HALTED);
    expect(game.haltCause).toBe('fatal');
    expect(game.haltText).toBe('boom');
  });

  it('AD-4 a storage event then fatal: the cause becomes fatal with its text; a second fatal replaces the text', async () => {
    const { game, storage, storageEvent } = await active(JSON.stringify(place));
    storageEvent(KEY, storage);
    expect(game.haltCause).toBe('another-window');
    expect(game.haltText).toBeUndefined();
    game.halt('fatal', 'boom');
    expect(game.current()).toEqual(HALTED);
    expect(game.haltCause).toBe('fatal');
    expect(game.haltText).toBe('boom');
    game.halt('fatal', 'second');
    expect(game.haltCause).toBe('fatal');
    expect(game.haltText).toBe('second');
  });

  it('AD-4 rejected + a storage event halts with another-window', async () => {
    const { game, storage, storageEvent } = await active(JSON.stringify(invalidNull));
    storageEvent(KEY, storage);
    expect(game.current()).toEqual(HALTED);
    expect(game.haltCause).toBe('another-window');
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 rejected + halt(fatal) halts with fatal', async () => {
    const { game } = await active(JSON.stringify(invalidNull));
    game.halt('fatal', 'boom');
    expect(game.current()).toEqual(HALTED);
    expect(game.haltCause).toBe('fatal');
    expect(game.haltText).toBe('boom');
  });

  const ignored: [string, string | null, 'local' | 'session'][] = [
    ['a foreign localStorage key', 'other:key', 'local'],
    ['a sessionStorage wordcell:session', KEY, 'session'],
    ['a sessionStorage clear (key null)', null, 'session'],
  ];
  // Ignored events leave the store active, so one store serves every case.
  it(`AD-4 ${ignored.map(([name]) => name).join(', ')}: none halts`, async () => {
    const { game, storage, storageEvent } = await active(JSON.stringify(place));
    for (const [name, key, area] of ignored) {
      storageEvent(key, area === 'local' ? storage : SESSION_STORAGE);
      expect(game.current().kind, name).toBe('active');
      expect(game.haltCause, name).toBeUndefined();
    }
  });

  const halting: [string, string | null, string | null][] = [
    ['wordcell:session removed (newValue null)', KEY, null],
    ['a localStorage clear (key null)', null, null],
    ['wordcell:prefs written', 'wordcell:prefs', '{}'],
  ];
  for (const [name, key, newValue] of halting) {
    it(`AD-4 ${name} halts with another-window`, async () => {
      const { game, storage, storageEvent } = await active(JSON.stringify(place));
      storageEvent(key, storage, newValue);
      expect(game.current()).toEqual(HALTED);
      expect(game.haltCause).toBe('another-window');
    });
  }

  it('AD-4 haltCause and haltText are undefined while booting, active and rejected', async () => {
    const booting = await setup({ stored: JSON.stringify(place) });
    expect(booting.game.haltCause).toBeUndefined();
    expect(booting.game.haltText).toBeUndefined();
    booting.game.load();
    expect(booting.game.current().kind).toBe('active');
    expect(booting.game.haltCause).toBeUndefined();
    expect(booting.game.haltText).toBeUndefined();
    const { game } = await active(JSON.stringify(invalidNull));
    expect(game.current().kind).toBe('rejected');
    expect(game.haltCause).toBeUndefined();
    expect(game.haltText).toBeUndefined();
  });

  const commands: [string, (game: Awaited<ReturnType<typeof setup>>['game']) => unknown][] = [
    ['dispatch', (game) => game.dispatch(UNDO)],
    ['newGame', (game) => game.newGame()],
    ['replay', (game) => game.replay()],
  ];
  // A throw while halted changes nothing, so one halted store serves every command.
  it(`AD-15 while halted (from active) ${commands.map(([name]) => name).join(', ')} each throw and write nothing`, async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await setup({ stored: text, seed: 7 });
    game.load();
    game.halt('fatal', 'boom');
    for (const [name, call] of commands) {
      expect(() => call(game), name).toThrow('while halted');
      expect(storage.writes, name).toEqual([]);
      expect(storage.map.get(KEY), name).toBe(text);
      expect(game.current(), name).toEqual(HALTED);
    }
  });
});

describe('game store lifecycle', () => {
  const LIFECYCLE = ['visibilitychange', 'pagehide', 'pageshow'];
  const PERSISTED = { persisted: true };

  type Env = Awaited<ReturnType<typeof setup>>;

  function expectNoLifecycleListener(env: Env): void {
    for (const type of LIFECYCLE) expect(env.added(type), type).toEqual([]);
  }

  // A persisted pageshow after this store's own last write or read does not halt.
  function expectNotStale(env: Env, kind: 'active' | 'rejected'): void {
    expect(env.game.isStale()).toBe(false);
    env.fire('pageshow', PERSISTED);
    expect(env.game.current().kind).toBe(kind);
    expect(env.game.haltCause).toBeUndefined();
  }

  const ownWrites: [string, () => Promise<Env>][] = [
    [
      'first-launch load',
      async () => {
        const env = await setup({ seed: 7 });
        env.game.load();
        env.game.registerLifecycle();
        expect(env.storage.writes).toHaveLength(1);
        return env;
      },
    ],
    [
      'dispatch',
      async () => {
        const env = await active(JSON.stringify(place));
        env.game.registerLifecycle();
        env.game.dispatch(UNDO);
        expect(env.storage.writes).toHaveLength(1);
        return env;
      },
    ],
    [
      'hide flush (hidden)',
      async () => {
        const env = await active(JSON.stringify(place));
        env.game.registerLifecycle();
        env.time.now += 250;
        env.doc.visibilityState = 'hidden';
        env.fire('visibilitychange');
        expect(parsed(env.storage.map.get(KEY) ?? '').activeMs).toBe(place.activeMs + 250);
        env.doc.visibilityState = 'visible';
        return env;
      },
    ],
    [
      'hide flush (pagehide)',
      async () => {
        const env = await active(JSON.stringify(place));
        env.game.registerLifecycle();
        env.time.now += 250;
        env.fire('pagehide');
        expect(parsed(env.storage.map.get(KEY) ?? '').activeMs).toBe(place.activeMs + 250);
        return env;
      },
    ],
    [
      'newGame() from active',
      async () => {
        const env = await active(JSON.stringify(place));
        env.game.registerLifecycle();
        env.game.newGame();
        return env;
      },
    ],
    [
      'newGame() from rejected',
      async () => {
        const env = await active(JSON.stringify(invalidNull));
        env.game.registerLifecycle();
        env.game.newGame();
        return env;
      },
    ],
    [
      'replay()',
      async () => {
        const env = await active(JSON.stringify(place));
        env.game.registerLifecycle();
        env.game.replay();
        return env;
      },
    ],
  ];
  for (const [name, start] of ownWrites) {
    it(`AD-4 ${name}: the own write leaves isStale() false and a persisted pageshow does not halt`, async () => {
      const env = await start();
      expect(env.storage.writes.length).toBeGreaterThan(0);
      expect(env.game.current()).toEqual({
        kind: 'active',
        session: parsed(env.storage.map.get(KEY) ?? ''),
        history: EMPTY,
        prefs: DEFAULT_PREFS,
      });
      expectNotStale(env, 'active');
    });
  }

  it('AD-4 a rejected load, then a persisted pageshow: stays rejected', async () => {
    const env = await active(JSON.stringify(invalidNull));
    env.game.registerLifecycle();
    expectNotStale(env, 'rejected');
    expect(env.storage.writes).toEqual([]);
  });

  it('AD-4 a valid stored Session loaded (no write), then a persisted pageshow: stays active', async () => {
    const env = await active(JSON.stringify(place));
    env.game.registerLifecycle();
    expectNotStale(env, 'active');
    expect(env.storage.writes).toEqual([]);
  });

  it('AD-4 while halted, a persisted pageshow reads no storage and keeps the fatal', async () => {
    const env = await active(JSON.stringify(place));
    env.game.registerLifecycle();
    env.game.halt('fatal', 'AD-4 earlier fatal');
    env.storage.map.set(KEY, JSON.stringify(won));
    const getItem = vi.spyOn(env.storage, 'getItem');
    env.fire('pageshow', PERSISTED);
    expect(getItem).not.toHaveBeenCalled();
    expect(env.game.haltCause).toBe('fatal');
    expect(env.game.haltText).toBe('AD-4 earlier fatal');
  });

  it('AD-4 a rejected load, stored text changed, then a persisted pageshow halts with another-window', async () => {
    const env = await active(JSON.stringify(invalidNull));
    env.game.registerLifecycle();
    env.storage.map.set(KEY, JSON.stringify(won));
    expect(env.game.isStale()).toBe(true);
    env.fire('pageshow', PERSISTED);
    expect(env.game.current()).toEqual({ kind: 'halted' });
    expect(env.game.haltCause).toBe('another-window');
  });

  it('AD-4 an active load, stored text changed, then a non-persisted pageshow does not halt', async () => {
    const env = await active(JSON.stringify(place));
    env.game.registerLifecycle();
    env.storage.map.set(KEY, JSON.stringify(won));
    env.fire('pageshow', { persisted: false });
    expect(env.game.current().kind).toBe('active');
  });

  it('AD-4 an own setShowTimer(true), then a persisted pageshow does not halt', async () => {
    const env = await active(JSON.stringify(place));
    env.game.registerLifecycle();
    env.prefs.setShowTimer(true);
    expect(env.storage.map.get(PREFS)).toBe(
      '{"version":1,"animationSpeed":"normal","showTimer":true}',
    );
    expect(env.prefs.isStale()).toBe(false);
    env.fire('pageshow', PERSISTED);
    expect(env.game.current().kind).toBe('active');
    expect(env.game.haltCause).toBeUndefined();
  });

  const prefsOthers: [string, string | undefined, (env: Env) => void][] = [
    [
      'written',
      undefined,
      (env) => env.storage.map.set(PREFS, '{"version":1,"animationSpeed":"fast","showTimer":true}'),
    ],
    ['removed', JSON.stringify(DEFAULT_PREFS), (env) => env.storage.map.delete(PREFS)],
  ];
  for (const [name, prefsText, change] of prefsOthers) {
    it(`AD-4 wordcell:prefs ${name} outside the setters, then a persisted pageshow halts with another-window`, async () => {
      const env = await setup({ stored: JSON.stringify(place), prefs: prefsText });
      env.game.load();
      env.game.registerLifecycle();
      expect(env.prefs.isStale()).toBe(false);
      change(env);
      expect(env.game.isStale()).toBe(false);
      expect(env.scoreHistory.isStale()).toBe(false);
      expect(env.prefs.isStale()).toBe(true);
      env.fire('pageshow', PERSISTED);
      expect(env.game.current()).toEqual({ kind: 'halted' });
      expect(env.game.haltCause).toBe('another-window');
    });
  }

  it('AD-16 halted before load: load, then registerLifecycle() throws and adds no listener', async () => {
    const env = await setup({ stored: JSON.stringify(place) });
    env.storageEvent(KEY, env.storage);
    env.game.load();
    expect(() => env.game.registerLifecycle()).toThrow('AD-16 registerLifecycle() while halted');
    expectNoLifecycleListener(env);
  });

  it('AD-16 registerLifecycle() before load() throws and adds no listener', async () => {
    const env = await setup({ stored: JSON.stringify(place) });
    expect(() => env.game.registerLifecycle()).toThrow('AD-16 registerLifecycle() while booting');
    expectNoLifecycleListener(env);
  });

  it('AD-16 a second registerLifecycle() after a successful one throws and adds no listener', async () => {
    const env = await active(JSON.stringify(place));
    env.game.registerLifecycle();
    const counts = LIFECYCLE.map((type) => env.added(type).length);
    expect(counts).toEqual([1, 1, 1]);
    expect(() => env.game.registerLifecycle()).toThrow('AD-16 registerLifecycle() called twice');
    expect(LIFECYCLE.map((type) => env.added(type).length)).toEqual(counts);
  });

  it('AD-16 registerLifecycle() resumes the clock only when visible', async () => {
    const visible = await active(JSON.stringify(place));
    visible.game.registerLifecycle();
    visible.time.now += 100;
    expect(visible.clock.peek(visible.time.now)).toBe(100);
    const hidden = await active(JSON.stringify(place));
    hidden.doc.visibilityState = 'hidden';
    hidden.game.registerLifecycle();
    hidden.time.now += 100;
    expect(hidden.clock.peek(hidden.time.now)).toBe(0);
  });

  it('AD-16 whenVisible() throws before registerLifecycle(), resolves at once when visible, else on visibilitychange to visible only', async () => {
    const env = await active(JSON.stringify(place));
    expect(() => env.game.whenVisible()).toThrow('AD-16 whenVisible() before registerLifecycle()');
    env.game.registerLifecycle();
    // Visible: settled after one microtask, with no listener fired.
    let atOnce = false;
    void env.game.whenVisible().then(() => {
      atOnce = true;
    });
    await Promise.resolve();
    expect(atOnce).toBe(true);
    env.doc.visibilityState = 'hidden';
    env.fire('visibilitychange');
    const order: string[] = [];
    void env.game.whenVisible().then(() => order.push('first'));
    void env.game.whenVisible().then(() => order.push('second'));
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    await settle();
    env.fire('pageshow', PERSISTED);
    env.fire('pageshow', { persisted: false });
    // A visibilitychange that leaves the page hidden (another hide) resolves nothing.
    env.fire('visibilitychange');
    await settle();
    expect(order).toEqual([]);
    env.doc.visibilityState = 'visible';
    env.fire('visibilitychange');
    await settle();
    expect(order).toEqual(['first', 'second']);
  });

  it('AD-9 registerBeforeHide callbacks run in registration order before the take', async () => {
    const env = await active(JSON.stringify(place));
    const calls: string[] = [];
    env.game.registerBeforeHide(() => {
      calls.push('before');
      env.time.now += 40;
    });
    env.game.registerLifecycle();
    env.game.registerBeforeHide(() => {
      calls.push('after');
      env.time.now += 2;
    });
    env.time.now += 100;
    env.fire('pagehide');
    expect(calls).toEqual(['before', 'after']);
    expect(parsed(env.storage.map.get(KEY) ?? '').activeMs).toBe(place.activeMs + 142);
  });

  it('AD-9 a throwing before-hide callback propagates and the flush writes nothing', async () => {
    const env = await active(JSON.stringify(place));
    const error = new Error('stub callback');
    env.game.registerBeforeHide(() => {
      throw error;
    });
    env.game.registerLifecycle();
    const before = env.game.state;
    env.time.now += 100;
    expect(() => env.fire('pagehide')).toThrow(error);
    expect(env.storage.writes).toEqual([]);
    expect(env.game.state).toBe(before);
    // Neither taken nor paused: the clock still holds the 100 ms and keeps running.
    expect(env.clock.peek(env.time.now)).toBe(100);
    env.time.now += 50;
    expect(env.clock.peek(env.time.now)).toBe(150);
  });

  for (const persisted of [true, false]) {
    it(`AD-9 a pageshow while visible resumes the clock after a pagehide flush (persisted ${persisted})`, async () => {
      const env = await active(JSON.stringify(place));
      env.game.registerLifecycle();
      env.time.now += 30;
      env.fire('pagehide');
      env.time.now += 500;
      env.fire('pageshow', { persisted });
      env.time.now += 100;
      expect(env.clock.peek(env.time.now)).toBe(100);
    });
  }

  it('AD-4 an active store whose wordcell:session was removed: isStale() is true and a persisted pageshow halts with another-window', async () => {
    const env = await active(JSON.stringify(place));
    env.game.registerLifecycle();
    env.storage.map.delete(KEY);
    expect(env.game.isStale()).toBe(true);
    env.fire('pageshow', PERSISTED);
    expect(env.game.current()).toEqual({ kind: 'halted' });
    expect(env.game.haltCause).toBe('another-window');
  });

  it('AD-9 a throwing hide-flush write propagates, leaves the bytes and the Session unchanged', async () => {
    const text = JSON.stringify(place);
    const env = await active(text);
    env.game.registerLifecycle();
    const before = env.game.state;
    env.time.now += 100;
    env.storage.control.fail = FAIL_SETS;
    env.doc.visibilityState = 'hidden';
    expect(() => env.fire('visibilitychange')).toThrow('setItem failed');
    expect(env.storage.map.get(KEY)).toBe(text);
    expect(env.game.state).toBe(before);
    expect(env.game.current()).toEqual({
      kind: 'active',
      session: place,
      history: EMPTY,
      prefs: DEFAULT_PREFS,
    });
  });

  it('AD-9 the hide flush while rejected writes nothing', async () => {
    const env = await active(JSON.stringify(invalidNull));
    env.game.registerLifecycle();
    env.time.now += 100;
    env.fire('pagehide');
    env.doc.visibilityState = 'hidden';
    env.fire('visibilitychange');
    expect(env.storage.writes).toEqual([]);
    expect(env.game.current().kind).toBe('rejected');
  });
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
