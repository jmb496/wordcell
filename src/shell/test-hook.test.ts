import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// AD-17 Celebration seam (epic 10 entry 5): the test hook over a stubbed `window` (the unit
// environment is `node`, where Vitest's `import.meta.env.DEV` is true, so the gate installs it),
// driven by a stub seam. Fresh module per case (the seam and the precacheComplete state are module
// state). precacheComplete (epic 7 CAP-2) runs over stubbed `navigator`, `fetch`, `caches` and
// `location` globals.
vi.mock('./game.svelte', () => ({ game: { loaded: () => null, current: () => null } }));
vi.mock('./dictionary.svelte', () => ({ dictionary: { state: 'ready' } }));

type Hook = NonNullable<Window['__wordcell']>;

function stubSeam(isRunning = false) {
  const calls: string[] = [];
  const state = { running: isRunning };
  return {
    calls,
    state,
    seam: {
      running: () => state.running,
      advance: (ms: number) => calls.push(`advance ${ms}`),
      setManual: (on: boolean) => calls.push(`setManual ${on}`),
      setEnabled: (on: boolean) => calls.push(`setEnabled ${on}`),
    },
  };
}

async function load(): Promise<typeof import('./test-hook') & { hook: Hook }> {
  vi.resetModules();
  const win: { __wordcell?: Hook } = {};
  vi.stubGlobal('window', win);
  const module = await import('./test-hook');
  const hook = win.__wordcell;
  if (hook === undefined) throw new Error('test hook not installed');
  return { ...module, hook };
}

beforeEach(() => {
  expect(import.meta.env.DEV).toBe(true);
});
afterEach(() => vi.unstubAllGlobals());

describe('AD-17 celebration seam', () => {
  it('AD-17 the hook and its celebration object are frozen with the sorted keys', async () => {
    const { hook } = await load();
    expect(Object.isFrozen(hook)).toBe(true);
    expect(Reflect.ownKeys(hook).map(String).sort()).toEqual([
      'celebration',
      'current',
      'dictionaryState',
      'loaded',
      'precacheComplete',
      'swState',
    ]);
    expect(Object.isFrozen(hook.celebration)).toBe(true);
    expect(Reflect.ownKeys(hook.celebration).map(String).sort()).toEqual([
      'advance',
      'running',
      'setEnabled',
    ]);
  });

  it('AD-17 every celebration method throws before the seam is registered', async () => {
    const { hook } = await load();
    expect(() => hook.celebration.running()).toThrow(/^AD-17 /);
    expect(() => hook.celebration.advance(16)).toThrow(/^AD-17 /);
    expect(() => hook.celebration.setEnabled(true)).toThrow(/^AD-17 /);
  });

  it('AD-17 a second registerCelebrationSeam throws and keeps the first seam', async () => {
    const { hook, registerCelebrationSeam } = await load();
    const first = stubSeam();
    const second = stubSeam(true);
    registerCelebrationSeam(first.seam);
    expect(() => registerCelebrationSeam(second.seam)).toThrow(/^AD-17 /);
    expect(hook.celebration.running()).toBe(false);
  });

  it('AD-17 setEnabled throws while running and calls neither setter', async () => {
    const { hook, registerCelebrationSeam } = await load();
    const stub = stubSeam(true);
    registerCelebrationSeam(stub.seam);
    expect(() => hook.celebration.setEnabled(true)).toThrow(/^AD-17 /);
    expect(() => hook.celebration.setEnabled(false)).toThrow(/^AD-17 /);
    expect(stub.calls).toEqual([]);
  });

  it('AD-17 setEnabled while idle sets the flag, then the manual clock, to the same value', async () => {
    const { hook, registerCelebrationSeam } = await load();
    const stub = stubSeam();
    registerCelebrationSeam(stub.seam);
    hook.celebration.setEnabled(true);
    hook.celebration.setEnabled(false);
    expect(stub.calls).toEqual([
      'setEnabled true',
      'setManual true',
      'setEnabled false',
      'setManual false',
    ]);
  });

  it('AD-17 advance throws while not running and delegates while running', async () => {
    const { hook, registerCelebrationSeam } = await load();
    const stub = stubSeam();
    registerCelebrationSeam(stub.seam);
    expect(() => hook.celebration.advance(16)).toThrow(/^AD-17 /);
    expect(stub.calls).toEqual([]);
    stub.state.running = true;
    expect(hook.celebration.running()).toBe(true);
    hook.celebration.advance(3008);
    expect(stub.calls).toEqual(['advance 3008']);
  });
});

// An excerpt of today's dist/sw.js (`generateSW`): revisioned and `null` entries, the trailing `,{}`.
const SW_SOURCE =
  'define(["./workbox-2fbc6a65"],function(e){"use strict";self.addEventListener("message",e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()}),e.precacheAndRoute([{url:"index.html",revision:"8a6b7b32fbc9939a11f9a8ed8d777efa"},{url:"favicon.svg",revision:"746a04cb3c5e28ac97f112d0145b0403"},{url:"assets/index-ySAiKNLo.js",revision:null},{url:"assets/en-n6QSuDF0.txt",revision:null}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))});';
const SW_URLS = ['index.html', 'favicon.svg', 'assets/index-ySAiKNLo.js', 'assets/en-n6QSuDF0.txt'];

const ORIGIN = 'https://wordcell.test';
const PRECACHE = 'workbox-precache-v2-https://wordcell.test/';
// Absolute keys as Workbox stores them: `?__WB_REVISION__=…` on revisioned entries only. The
// index.html revision differs from SW_SOURCE's: the check ignores revisions (CAP-2).
const KEYS = [
  `${ORIGIN}/index.html?__WB_REVISION__=0000000000000000000000000000000a`,
  `${ORIGIN}/favicon.svg?__WB_REVISION__=746a04cb3c5e28ac97f112d0145b0403`,
  `${ORIGIN}/assets/index-ySAiKNLo.js`,
  `${ORIGIN}/assets/en-n6QSuDF0.txt`,
];

type Registration = 'activated' | 'activating' | 'undefined' | 'active-null' | 'reject';

/** Microtask fakes over one mutable environment; change `env` to change what the next call sees. */
function stubPrecache() {
  const env = {
    container: true,
    registration: 'activated' as Registration,
    // Holds getRegistration() until resolved (the race case).
    hold: null as Promise<void> | null,
    fetch: 'ok' as 'ok' | 'reject' | 404,
    source: SW_SOURCE,
    cachesReject: false,
    stores: { [PRECACHE]: [...KEYS] } as Record<string, string[]>,
  };
  const getRegistration = vi.fn(async () => {
    if (env.hold !== null) await env.hold;
    switch (env.registration) {
      case 'reject':
        throw new Error('getRegistration rejected');
      case 'undefined':
        return undefined;
      case 'active-null':
        return { active: null };
      default:
        return { active: { state: env.registration } };
    }
  });
  const container = { getRegistration };
  vi.stubGlobal('navigator', {
    get serviceWorker() {
      return env.container ? container : undefined;
    },
  });
  const fetch = vi.fn(async (_url: string) => {
    if (env.fetch === 'reject') throw new TypeError('Failed to fetch');
    const source = env.source;
    return {
      ok: env.fetch === 'ok',
      status: env.fetch === 'ok' ? 200 : env.fetch,
      text: async () => source,
    };
  });
  vi.stubGlobal('fetch', fetch);
  const keys = vi.fn(async () => {
    if (env.cachesReject) throw new Error('caches.keys rejected');
    return Object.keys(env.stores);
  });
  const open = vi.fn(async (name: string) => ({
    keys: async () => (env.stores[name] ?? []).map((url) => ({ url })),
  }));
  vi.stubGlobal('caches', { keys, open });
  // A deeper page URL: only resolution against the absolute /sw.js URL matches the keys.
  vi.stubGlobal('location', { href: `${ORIGIN}/play/?seed=1` });
  return { env, getRegistration, fetch, keys, open };
}

const macrotask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('AD-17 precacheComplete', () => {
  // Every case flushes a macrotask before it ends, so no recompute outlives its stubs.
  afterEach(macrotask);

  it('AD-17 importing calls nothing; the first call returns false after one getRegistration(), the next returns true', async () => {
    const stub = stubPrecache();
    const { hook } = await load();
    expect(stub.getRegistration).not.toHaveBeenCalled();
    expect(stub.fetch).not.toHaveBeenCalled();
    expect(stub.keys).not.toHaveBeenCalled();
    expect(hook.precacheComplete()).toBe(false);
    await macrotask();
    expect(stub.getRegistration).toHaveBeenCalledTimes(1);
    expect(hook.precacheComplete()).toBe(true);
    await macrotask();
    expect(stub.getRegistration).toHaveBeenCalledTimes(2);
    expect(stub.fetch).toHaveBeenCalledTimes(1);
  });

  it('AD-17 recompute is true when the worker is activated and every sw.js URL is a precache key, revision stripped', async () => {
    const stub = stubPrecache();
    const { recomputePrecacheComplete } = await load();
    await expect(recomputePrecacheComplete()).resolves.toBe(true);
    expect(stub.fetch.mock.calls).toEqual([[`${ORIGIN}/sw.js`]]);
  });

  type Change = [string, (env: ReturnType<typeof stubPrecache>['env']) => void];
  const NO_WORKER_CASES: Change[] = [
    ['no navigator.serviceWorker', (env) => (env.container = false)],
    ['getRegistration() resolving undefined', (env) => (env.registration = 'undefined')],
    ['a registration with active: null', (env) => (env.registration = 'active-null')],
    ['an activating worker', (env) => (env.registration = 'activating')],
  ];
  const FALSE_CASES: Change[] = [
    ...NO_WORKER_CASES,
    ['one URL missing', (env) => (env.stores[PRECACHE] = KEYS.slice(1))],
    [
      'a URL present only in a cache with another name',
      (env) => {
        env.stores[PRECACHE] = KEYS.slice(1);
        env.stores.other = KEYS.slice(0, 1);
      },
    ],
  ];

  it('AD-17 recompute takes the union of every workbox-precache* cache', async () => {
    const stub = stubPrecache();
    stub.env.stores = {
      [PRECACHE]: KEYS.slice(0, 2),
      'workbox-precache-v2-other': KEYS.slice(2),
    };
    const { recomputePrecacheComplete } = await load();
    await expect(recomputePrecacheComplete()).resolves.toBe(true);
  });

  it.each(FALSE_CASES)('AD-17 true, then %s → false', async (_name, change) => {
    const stub = stubPrecache();
    const { recomputePrecacheComplete } = await load();
    await expect(recomputePrecacheComplete()).resolves.toBe(true);
    change(stub.env);
    await expect(recomputePrecacheComplete()).resolves.toBe(false);
  });

  it.each(NO_WORKER_CASES)(
    'AD-17 %s on a fresh instance → false without fetching',
    async (_name, change) => {
      const stub = stubPrecache();
      change(stub.env);
      const { recomputePrecacheComplete } = await load();
      await expect(recomputePrecacheComplete()).resolves.toBe(false);
      expect(stub.fetch).not.toHaveBeenCalled();
      expect(stub.keys).not.toHaveBeenCalled();
    },
  );

  it('AD-17 overlapping and later calls fetch /sw.js once; after it a rejecting fetch still recomputes from Cache Storage', async () => {
    const stub = stubPrecache();
    const { hook, recomputePrecacheComplete } = await load();
    await expect(
      Promise.all([
        recomputePrecacheComplete(),
        recomputePrecacheComplete(),
        recomputePrecacheComplete(),
      ]),
    ).resolves.toEqual([true, true, true]);
    expect(hook.precacheComplete()).toBe(true);
    await macrotask();
    await expect(recomputePrecacheComplete()).resolves.toBe(true);
    expect(stub.fetch).toHaveBeenCalledTimes(1);
    stub.env.fetch = 'reject';
    stub.env.stores[PRECACHE] = KEYS.slice(1);
    await expect(recomputePrecacheComplete()).resolves.toBe(false);
    stub.env.stores[PRECACHE] = [...KEYS];
    await expect(recomputePrecacheComplete()).resolves.toBe(true);
    expect(stub.fetch).toHaveBeenCalledTimes(1);
  });

  it('AD-17 an older recompute settling after a newer one does not overwrite it and resolves with the newer value', async () => {
    const stub = stubPrecache();
    const { hook, recomputePrecacheComplete } = await load();
    await expect(recomputePrecacheComplete()).resolves.toBe(true);
    let release = () => {};
    stub.env.hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    const older = recomputePrecacheComplete();
    stub.env.hold = null;
    stub.env.stores[PRECACHE] = KEYS.slice(1);
    await expect(recomputePrecacheComplete()).resolves.toBe(false);
    // The older one now reads a complete cache, but its result is dropped.
    stub.env.stores[PRECACHE] = [...KEYS];
    release();
    await expect(older).resolves.toBe(false);
    expect(hook.precacheComplete()).toBe(false);
  });

  const KEPT_VALUE_FAILURES: [
    string,
    (env: ReturnType<typeof stubPrecache>['env'], on: boolean) => void,
    RegExp,
  ][] = [
    [
      'a rejected getRegistration()',
      (env, on) => (env.registration = on ? 'reject' : 'activated'),
      /^getRegistration rejected$/,
    ],
    [
      'a rejected Cache Storage call',
      (env, on) => (env.cachesReject = on),
      /^caches.keys rejected$/,
    ],
  ];

  it.each(KEPT_VALUE_FAILURES)(
    'AD-17 %s rejects the recompute and keeps the value',
    async (_name, set, message) => {
      const stub = stubPrecache();
      const { hook, recomputePrecacheComplete } = await load();
      await expect(recomputePrecacheComplete()).resolves.toBe(true);
      set(stub.env, true);
      await expect(recomputePrecacheComplete()).rejects.toThrow(message);
      set(stub.env, false);
      expect(hook.precacheComplete()).toBe(true);
      await macrotask();
      expect(stub.fetch).toHaveBeenCalledTimes(1);
    },
  );

  const URL_FAILURES: [string, (env: ReturnType<typeof stubPrecache>['env']) => void, RegExp][] = [
    ['a rejected /sw.js fetch', (env) => (env.fetch = 'reject'), /^Failed to fetch$/],
    [
      'a non-OK /sw.js',
      (env) => (env.fetch = 404),
      /^AD-17 sw\.js: GET https:\/\/wordcell\.test\/sw\.js returned 404$/,
    ],
    [
      'a parse throw',
      (env) => (env.source = 'self.skipWaiting()'),
      /^AD-17 sw\.js: expected exactly one/,
    ],
  ];

  it.each(URL_FAILURES)(
    'AD-17 %s rejects every recompute with one fetch (the URL promise is kept)',
    async (_name, change, message) => {
      const stub = stubPrecache();
      change(stub.env);
      const { recomputePrecacheComplete } = await load();
      await expect(recomputePrecacheComplete()).rejects.toThrow(message);
      await expect(recomputePrecacheComplete()).rejects.toThrow(message);
      expect(stub.fetch).toHaveBeenCalledTimes(1);
    },
  );
});

describe('AD-17 precacheUrls', () => {
  it('AD-17 precacheUrls reads every url of the one precacheAndRoute array of a generated sw.js', async () => {
    const { precacheUrls } = await load();
    expect(precacheUrls(SW_SOURCE)).toEqual(SW_URLS);
  });

  it('AD-17 precacheUrls allows whitespace before the array and skips brackets inside strings', async () => {
    const { precacheUrls } = await load();
    expect(
      precacheUrls(
        'precacheAndRoute(\n  [{url:"a].js",revision:"[x"},{url:"b.css",revision:null}],{})',
      ),
    ).toEqual(['a].js', 'b.css']);
  });

  it.each([
    ['zero calls', 'self.skipWaiting()', /expected exactly one precacheAndRoute\(/],
    [
      'two calls',
      'precacheAndRoute([{url:"a.js",revision:null}]);precacheAndRoute([{url:"b.js",revision:null}])',
      /expected exactly one precacheAndRoute\(/,
    ],
    ['a non-array argument', 'precacheAndRoute(e)', /argument is not an array/],
    ['no URLs', 'precacheAndRoute([],{})', /holds no url:"…" entry/],
    [
      'an unclosed array',
      'precacheAndRoute([{url:"a.js",revision:null}',
      /unterminated precache array/,
    ],
    [
      'a single-quoted entry',
      `precacheAndRoute([{url:"a.js",revision:null},{url:'b.js',revision:null}],{})`,
      /2 url: keys but 1 url:"…" entries/,
    ],
    [
      'an escaped entry',
      'precacheAndRoute([{url:"a.js",revision:null},{url:"a\\"b",revision:null}],{})',
      /2 url: keys but 1 url:"…" entries/,
    ],
  ])('AD-17 precacheUrls throws on %s', async (_name, source, message) => {
    const { precacheUrls } = await load();
    expect(() => precacheUrls(source)).toThrow(/^AD-17 sw\.js: /);
    expect(() => precacheUrls(source)).toThrow(message);
  });
});
