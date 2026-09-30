import { afterEach, describe, expect, it, vi } from 'vitest';
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

// Fresh store and clock modules per test, over stubbed localStorage, performance and crypto.
async function setup(options: Options = {}) {
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
  return { game, clock, storage, time };
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

  it('AD-4 dispatch order: take, accrue, then apply; the written Session is Undo of the accrued one', async () => {
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
