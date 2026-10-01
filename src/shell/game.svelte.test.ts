import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
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
  parseSession,
  type Session,
  serializeSession,
} from '../engine/index';

const KEY = 'wordcell:session';
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

type Options = { stored?: string; storage?: Partial<FakeStorage>; seed?: number };
type FakeStorage = ReturnType<typeof fakeStorage>;

function fakeStorage(stored: string | undefined) {
  const map = new Map<string, string>(stored === undefined ? [] : [[KEY, stored]]);
  const writes: [string, string][] = [];
  const control = { failWrites: false };
  return {
    map,
    writes,
    control,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (control.failWrites) throw new Error('setItem failed');
      writes.push([key, value]);
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

// Fresh store and clock modules per test, over stubbed window (an EventTarget: the store adds its
// Q-38 `storage` listener at import), document (an EventTarget with a settable visibilityState),
// localStorage, performance and crypto. `added(type)` lists the listeners the store added after
// import (Node's dispatchEvent swallows a listener's throw, so tests call them directly).
async function setup(options: Options = {}) {
  const win = new EventTarget();
  vi.stubGlobal('window', win);
  const doc = Object.assign(new EventTarget(), {
    visibilityState: 'visible' as DocumentVisibilityState,
  });
  vi.stubGlobal('document', doc);
  vi.resetModules();
  const storage = { ...fakeStorage(options.stored), ...options.storage };
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
  const clock = await import('./clock');
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
  return { game, clock, storage, time, storageEvent, doc, added, fire };
}

async function active(stored: string) {
  const env = await setup({ stored });
  env.game.load();
  return env;
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
    const { game } = await setup({
      storage: { getItem: throwing, setItem: throwing, removeItem: throwing },
    });
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
    expect(game.current()).toEqual({ kind: 'active', session });
    expect(JSON.parse(text ?? '')).toEqual(session);
    expect(game.loaded()).toEqual({ session: null });
  });

  for (const seed of [0, 4294967295]) {
    it(`AD-5 first launch with getRandomValues stubbed to ${seed} stores that seed and parses back ok`, async () => {
      const { game, storage } = await setup({ seed });
      game.load();
      const text = storage.map.get(KEY) ?? '';
      expect(parseSession(text, EN).ok).toBe(true);
      expect(parsed(text).seed).toBe(seed);
      expect(game.current()).toEqual({ kind: 'active', session: parsed(text) });
    });
  }

  it('AD-4 a throwing first-launch write rethrows, stays booting and loaded() still throws', async () => {
    const { game, storage } = await setup();
    storage.control.failWrites = true;
    expect(() => game.load()).toThrow('setItem failed');
    expect(game.state).toEqual({ kind: 'booting' });
    expect(() => game.loaded()).toThrow();
    expect(storage.map.has(KEY)).toBe(false);
  });

  it('AD-4 a parse-ok load enters active with the parsed Session and writes nothing', async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await active(text);
    expect(storage.writes).toEqual([]);
    expect(game.current()).toEqual({ kind: 'active', session: JSON.parse(text) });
    expect(game.loaded()).toEqual({ session: JSON.parse(text) });
  });

  it('AD-4 a version-unknown load is rejected with its version and writes nothing', async () => {
    const text = JSON.stringify({ ...idleFresh, version: 99 });
    const { game, storage } = await active(text);
    const reason = { reason: 'version-unknown', version: 99 };
    expect(game.state).toEqual({ kind: 'rejected', reason });
    expect(game.current()).toEqual({ kind: 'rejected', reason });
    expect(game.loaded()).toEqual({ session: { rejected: reason } });
    expect(game.view).toBeUndefined();
    expect(storage.writes).toEqual([]);
    expect(storage.map.get(KEY)).toBe(text);
  });

  it('AD-4 a version-unreadable load (session-invalid-null.json) is rejected without a version', async () => {
    const { game, storage } = await active(JSON.stringify(invalidNull));
    const reason = { reason: 'version-unreadable' };
    expect(game.current()).toEqual({ kind: 'rejected', reason });
    expect(game.loaded()).toEqual({ session: { rejected: reason } });
    expect(storage.writes).toEqual([]);
  });

  it('AD-4 a replay-failed load (session-invalid-s2-last-only.json) is rejected with its version', async () => {
    const { game, storage } = await active(JSON.stringify(invalidLastOnly));
    const reason = { reason: 'replay-failed', version: 1 };
    expect(game.current()).toEqual({ kind: 'rejected', reason });
    expect(game.loaded()).toEqual({ session: { rejected: reason } });
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
    expect(game.current()).toEqual({ kind: 'active', session: expected });
  });

  it('AD-4 a throwing session write rethrows and leaves game.state the same reference', async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await active(text);
    const before = game.state;
    storage.control.failWrites = true;
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
    expect(game.current()).toEqual({ kind: 'active', session: expected });
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
    expect(game.current()).toEqual({ kind: 'active', session: expected });
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
    expect(game.loaded()).toEqual({ session: JSON.parse(text) });
    expect(game.current()).not.toEqual({ kind: 'active', session: JSON.parse(text) });
  });
});

describe('game store newGame() and replay()', () => {
  const REJECTED = JSON.stringify(invalidNull);
  const REJECT_LAUNCH = { session: { rejected: { reason: 'version-unreadable' } } };

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
    expect(env.game.current()).toEqual({ kind: 'active', session: JSON.parse(text) });
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
    storage.control.failWrites = true;
    expect(() => game.newGame()).toThrow('setItem failed');
    expect(storage.map.get(KEY)).toBe(text);
  });

  it('AD-4 a throwing write in newGame() from rejected rethrows and leaves the stored bytes unchanged', async () => {
    const { game, storage } = await rejected(7);
    storage.control.failWrites = true;
    expect(() => game.newGame()).toThrow('setItem failed');
    expect(storage.map.get(KEY)).toBe(REJECTED);
  });

  it('AD-4 a throwing write in replay() rethrows and leaves the stored bytes unchanged', async () => {
    const text = JSON.stringify(place);
    const { game, storage } = await active(text);
    storage.control.failWrites = true;
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
    vi.doMock('./dictionary.svelte', () => ({ dictionaryUrl: '', words: new Set(['cat']) }));
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
    ['the key absent', undefined, { session: null }],
    ['a valid Session', JSON.stringify(place), { session: place }],
    [
      'a rejected Session',
      JSON.stringify(invalidNull),
      { session: { rejected: { reason: 'version-unreadable' } } },
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
    const before = env.game.current();
    env.time.now += 100;
    expect(() => env.fire('pagehide')).toThrow(error);
    expect(env.storage.writes).toEqual([]);
    expect(env.game.current()).toBe(before);
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
    const before = env.game.current();
    env.time.now += 100;
    env.storage.control.failWrites = true;
    env.doc.visibilityState = 'hidden';
    expect(() => env.fire('visibilitychange')).toThrow('setItem failed');
    expect(env.storage.map.get(KEY)).toBe(text);
    expect(env.game.current()).toBe(before);
    expect(env.game.current()).toEqual({ kind: 'active', session: place });
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
