import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import invalidNull from '../../fixtures/session-invalid-null.json' with { type: 'json' };
import place from '../../fixtures/session-place.json' with { type: 'json' };
import type { parsePrefs as ParsePrefs } from './prefs.svelte';

// AD-10 prefs store: fresh game and prefs modules per test over stubbed window, document (with a
// map-backed `documentElement.style`), matchMedia and localStorage (setup trimmed from
// game.svelte.test.ts). NON_DEFAULT and UNREADABLE are the verbatim texts of fixtures/prefs-*.json.

const SESSION = 'wordcell:session';
const PREFS = 'wordcell:prefs';
const QUERY = '(prefers-reduced-motion: reduce)';
const DEFAULTS = { version: 1, animationSpeed: 'normal', showTimer: false };
const NON_DEFAULT = '{ "version": 1, "animationSpeed": "slow", "showTimer": true }';
const UNREADABLE = '{"version":1,"animationSpeed":"turbo","showTimer":true}';
const UNKNOWN = '{"version":2,"animationSpeed":"slow","showTimer":true}';

type Options = {
  stored?: string;
  prefs?: string;
  reducedMotion?: boolean;
  /** Calls `prefs.load()` (default true). */
  loadPrefs?: boolean;
  /** Calls `game.load()` after `prefs.load()` (default true). */
  loadGame?: boolean;
};

function fakeStorage(entries: [string, string | undefined][]) {
  const map = new Map<string, string>();
  for (const [key, value] of entries) if (value !== undefined) map.set(key, value);
  const writes: [string, string | null][] = [];
  const control = { fail: false };
  return {
    map,
    writes,
    control,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (control.fail) throw new Error('setItem failed');
      writes.push([key, value]);
      map.set(key, value);
    },
    removeItem: (key: string) => {
      writes.push([key, null]);
      map.delete(key);
    },
  };
}

function fakeMediaQuery(matches: boolean) {
  const query = Object.assign(new EventTarget(), {
    matches,
    fire(next: boolean) {
      query.matches = next;
      query.dispatchEvent(Object.assign(new Event('change'), { matches: next }));
    },
  });
  return query;
}

async function setup(options: Options = {}) {
  vi.stubGlobal('window', new EventTarget());
  const props = new Map<string, string>();
  const style = {
    setProperty: (name: string, value: string) => {
      props.set(name, value);
    },
    getPropertyValue: (name: string) => props.get(name) ?? '',
  };
  vi.stubGlobal(
    'document',
    Object.assign(new EventTarget(), {
      visibilityState: 'visible' as DocumentVisibilityState,
      documentElement: { style },
    }),
  );
  const media = fakeMediaQuery(options.reducedMotion ?? false);
  const queries: string[] = [];
  vi.stubGlobal('matchMedia', (query: string) => {
    queries.push(query);
    return media;
  });
  vi.resetModules();
  const storage = fakeStorage([
    [SESSION, options.stored ?? JSON.stringify(place)],
    [PREFS, options.prefs],
  ]);
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('performance', { now: () => 0 });
  const { game } = await import('./game.svelte');
  const { prefs } = await import('./prefs.svelte');
  if (options.loadPrefs ?? true) prefs.load();
  if ((options.loadPrefs ?? true) && (options.loadGame ?? true)) game.load();
  const css = (name: string) => style.getPropertyValue(name);
  const prefsWrites = () => storage.writes.filter(([key]) => key === PREFS);
  return { game, prefs, storage, media, queries, css, prefsWrites };
}

type Env = Awaited<ReturnType<typeof setup>>;

function expectMirror(env: Env, baseMs: string, reduced: string): void {
  expect(env.css('--wc-base-ms')).toBe(baseMs);
  expect(env.css('--wc-reduced')).toBe(reduced);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parsePrefs', () => {
  let parsePrefs: typeof ParsePrefs;

  beforeAll(async () => {
    vi.stubGlobal('window', new EventTarget());
    vi.resetModules();
    ({ parsePrefs } = await import('./prefs.svelte'));
    vi.unstubAllGlobals();
  });

  const unreadable: [string, string][] = [
    ['non-JSON text', 'x'],
    ['null', 'null'],
    ['an array', '[]'],
    ['an empty object (no version)', '{}'],
    ['version -1', '{"version":-1,"animationSpeed":"normal","showTimer":false}'],
    ['version 1.5', '{"version":1.5,"animationSpeed":"normal","showTimer":false}'],
    ["version '1'", '{"version":"1","animationSpeed":"normal","showTimer":false}'],
  ];
  for (const [name, text] of unreadable) {
    it(`AD-10 parsePrefs: ${name} is version-unreadable`, () => {
      expect(parsePrefs(text)).toEqual({ ok: false, reason: 'version-unreadable' });
    });
  }

  it('AD-10 parsePrefs: version 9007199254740992 (not a safe integer) is version-unreadable', () => {
    expect(
      parsePrefs('{"version":9007199254740992,"animationSpeed":"normal","showTimer":false}'),
    ).toEqual({ ok: false, reason: 'version-unreadable' });
  });

  it('AD-10 parsePrefs: version 0 is version-unknown with its version', () => {
    expect(parsePrefs('{"version":0,"animationSpeed":"normal","showTimer":false}')).toEqual({
      ok: false,
      reason: 'version-unknown',
      version: 0,
    });
  });

  it('AD-10 parsePrefs: version 2 is version-unknown with its version', () => {
    expect(parsePrefs(UNKNOWN)).toEqual({ ok: false, reason: 'version-unknown', version: 2 });
  });

  const contents: [string, string][] = [
    ['a missing field', '{"version":1,"animationSpeed":"normal"}'],
    ['an extra field', '{"version":1,"animationSpeed":"normal","showTimer":false,"extra":0}'],
    ["animationSpeed 'turbo'", UNREADABLE],
    ["showTimer 'true'", '{"version":1,"animationSpeed":"normal","showTimer":"true"}'],
  ];
  for (const [name, text] of contents) {
    it(`AD-10 parsePrefs: ${name} is contents-unreadable with version 1`, () => {
      expect(parsePrefs(text)).toEqual({ ok: false, reason: 'contents-unreadable', version: 1 });
    });
  }

  it('AD-10 parsePrefs: prefs-non-default.json parses ok', () => {
    expect(parsePrefs(NON_DEFAULT)).toEqual({
      ok: true,
      prefs: { version: 1, animationSpeed: 'slow', showTimer: true },
    });
  });
});

describe('prefs store', () => {
  it('AD-10 before load(): value and motion are the defaults, isStale() works, loaded() throws', async () => {
    const env = await setup({ loadPrefs: false });
    expect(env.prefs.value).toEqual(DEFAULTS);
    expect(env.prefs.motion).toEqual({ baseMs: 180, reduced: false });
    expect(env.prefs.isStale()).toBe(false);
    expect(() => env.prefs.loaded()).toThrow('AD-17 prefs loaded() before load()');
    expect(env.css('--wc-base-ms')).toBe('');
    expect(env.queries).toEqual([]);
  });

  it('AD-10 an absent key: defaults, loaded() null, nothing written, mirror 180ms and 0, not stale', async () => {
    const env = await setup();
    expect(env.prefs.value).toEqual(DEFAULTS);
    expect(env.prefs.loaded()).toBeNull();
    expect(env.game.loaded().prefs).toBeNull();
    expect(env.game.current()).toMatchObject({ kind: 'active', prefs: DEFAULTS });
    expect(env.prefsWrites()).toEqual([]);
    expect(env.storage.map.has(PREFS)).toBe(false);
    expect(env.prefs.motion).toEqual({ baseMs: 180, reduced: false });
    expectMirror(env, '180ms', '0');
    expect(env.queries).toEqual([QUERY]);
    expect(env.prefs.isStale()).toBe(false);
  });

  it('AD-10 load() called twice throws', async () => {
    const env = await setup();
    expect(() => env.prefs.load()).toThrow('AD-10 load() called twice');
  });

  it('AD-10 prefs-non-default.json: value parsed, baseMs 320 and --wc-base-ms 320ms', async () => {
    const env = await setup({ prefs: NON_DEFAULT });
    const parsedPrefs = { version: 1, animationSpeed: 'slow', showTimer: true };
    expect(env.prefs.value).toEqual(parsedPrefs);
    expect(env.prefs.loaded()).toEqual(parsedPrefs);
    expect(env.game.current()).toMatchObject({ prefs: parsedPrefs });
    expect(env.prefs.motion).toEqual({ baseMs: 320, reduced: false });
    expectMirror(env, '320ms', '0');
    expect(env.prefsWrites()).toEqual([]);
    expect(env.prefs.isStale()).toBe(false);
  });

  const rejected: [string, string, object][] = [
    ['non-JSON', 'x', { reason: 'version-unreadable' }],
    [
      'unreadable (prefs-unreadable.json)',
      UNREADABLE,
      { reason: 'contents-unreadable', version: 1 },
    ],
    ['unknown-version', UNKNOWN, { reason: 'version-unknown', version: 2 }],
  ];
  for (const [name, text, reason] of rejected) {
    it(`AD-10 ${name} stored prefs: defaults silently, not written before the first changing setter, then replaced by the full valid object`, async () => {
      const env = await setup({ prefs: text });
      expect(env.prefs.value).toEqual(DEFAULTS);
      expect(env.prefs.loaded()).toEqual({ rejected: reason });
      expect(env.game.current()).toMatchObject({ kind: 'active', prefs: DEFAULTS });
      expectMirror(env, '180ms', '0');
      expect(env.prefs.isStale()).toBe(false);
      env.prefs.setAnimationSpeed('normal');
      env.prefs.setShowTimer(false);
      expect(env.prefsWrites()).toEqual([]);
      expect(env.storage.map.get(PREFS)).toBe(text);
      env.prefs.setAnimationSpeed('fast');
      const full = '{"version":1,"animationSpeed":"fast","showTimer":false}';
      expect(env.prefsWrites()).toEqual([[PREFS, full]]);
      expect(env.prefs.value).toEqual({ version: 1, animationSpeed: 'fast', showTimer: false });
      expect(env.prefs.loaded()).toEqual({ rejected: reason });
      expectMirror(env, '90ms', '0');
      expect(env.prefs.isStale()).toBe(false);
    });
  }

  it("AD-10 setAnimationSpeed('slow') writes at once and updates motion.baseMs and --wc-base-ms", async () => {
    const env = await setup();
    env.prefs.setAnimationSpeed('slow');
    expect(env.prefsWrites()).toEqual([
      [PREFS, '{"version":1,"animationSpeed":"slow","showTimer":false}'],
    ]);
    expect(env.prefs.value).toEqual({ version: 1, animationSpeed: 'slow', showTimer: false });
    expect(env.prefs.motion).toEqual({ baseMs: 320, reduced: false });
    expectMirror(env, '320ms', '0');
    expect(env.prefs.isStale()).toBe(false);
  });

  it('AD-10 setShowTimer(true) writes the full object and leaves motion unchanged', async () => {
    const env = await setup();
    env.prefs.setShowTimer(true);
    expect(env.prefsWrites()).toEqual([
      [PREFS, '{"version":1,"animationSpeed":"normal","showTimer":true}'],
    ]);
    expect(env.game.current()).toMatchObject({
      prefs: { version: 1, animationSpeed: 'normal', showTimer: true },
    });
    expect(env.prefs.motion).toEqual({ baseMs: 180, reduced: false });
    expectMirror(env, '180ms', '0');
  });

  it('AD-10 a setter with the in-memory value is a no-op', async () => {
    const env = await setup({ prefs: NON_DEFAULT });
    const before = env.prefs.value;
    env.prefs.setAnimationSpeed('slow');
    env.prefs.setShowTimer(true);
    expect(env.prefsWrites()).toEqual([]);
    expect(env.storage.map.get(PREFS)).toBe(NON_DEFAULT);
    expect(env.prefs.value).toBe(before);
  });

  const blocked: [string, (env: Env) => void][] = [
    ['halted', (env) => env.game.halt('fatal', 'boom')],
    ['booting', () => undefined],
  ];
  for (const [kind, enter] of blocked) {
    it(`AD-10 AD-15 setters throw while ${kind}, whatever the value, and write nothing`, async () => {
      const env = await setup({ loadGame: kind !== 'booting' });
      enter(env);
      expect(env.game.state.kind).toBe(kind);
      const calls: [string, () => void][] = [
        ['setAnimationSpeed', () => env.prefs.setAnimationSpeed('slow')],
        ['setAnimationSpeed', () => env.prefs.setAnimationSpeed('normal')],
        ['setShowTimer', () => env.prefs.setShowTimer(true)],
        ['setShowTimer', () => env.prefs.setShowTimer(false)],
      ];
      for (const [name, call] of calls) {
        expect(call, name).toThrow(`AD-15 ${name}() while ${kind}`);
      }
      expect(env.prefsWrites()).toEqual([]);
      expect(env.prefs.value).toEqual(DEFAULTS);
      expectMirror(env, '180ms', '0');
    });
  }

  it('AD-10 a setter writes while the game store is rejected', async () => {
    const env = await setup({ stored: JSON.stringify(invalidNull) });
    expect(env.game.state.kind).toBe('rejected');
    env.prefs.setShowTimer(true);
    expect(env.storage.map.get(PREFS)).toBe(
      '{"version":1,"animationSpeed":"normal","showTimer":true}',
    );
    expect(env.prefs.value).toEqual({ version: 1, animationSpeed: 'normal', showTimer: true });
  });

  it('AD-10 a throwing setter write propagates and leaves storage, value, lastText and the mirror unchanged', async () => {
    const env = await setup({ prefs: NON_DEFAULT });
    const before = env.prefs.value;
    env.storage.control.fail = true;
    expect(() => env.prefs.setAnimationSpeed('fast')).toThrow('setItem failed');
    expect(env.storage.map.get(PREFS)).toBe(NON_DEFAULT);
    expect(env.prefs.value).toBe(before);
    expect(env.prefs.isStale()).toBe(false);
    expectMirror(env, '320ms', '0');
  });

  it('AD-10 reduced motion at load: motion.reduced true and --wc-reduced 1; baseMs stays 180', async () => {
    const env = await setup({ reducedMotion: true });
    expect(env.prefs.motion).toEqual({ baseMs: 180, reduced: true });
    expectMirror(env, '180ms', '1');
  });

  it('AD-10 a reduced-motion change event updates motion.reduced and --wc-reduced together', async () => {
    const env = await setup();
    env.media.fire(true);
    expect(env.prefs.motion).toEqual({ baseMs: 180, reduced: true });
    expectMirror(env, '180ms', '1');
    env.media.fire(false);
    expect(env.prefs.motion).toEqual({ baseMs: 180, reduced: false });
    expectMirror(env, '180ms', '0');
  });
});
