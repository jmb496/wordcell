import { afterEach, describe, expect, it, vi } from 'vitest';

// AD-8 dictionary store: a fresh module per test over stubbed fetch, location and navigator, with
// fake timers for the 30 s timeout. "No unhandled rejection" is Vitest's own check: it fails the
// run on any unhandled rejection, which `settled()` gives a real macrotask to surface.

type Reply = () => Promise<unknown>;

function response(status: number, body: string | (() => Promise<string>)) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: typeof body === 'string' ? () => Promise.resolve(body) : body,
  };
}

const ok =
  (body: string): Reply =>
  () =>
    Promise.resolve(response(200, body));
const status =
  (code: number): Reply =>
  () =>
    Promise.resolve(response(code, ''));
const networkError: Reply = () => Promise.reject(new TypeError('network'));
// A body that never enqueues or closes.
const stalled: Reply = () => Promise.resolve(response(200, () => new Promise<string>(() => {})));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// Replies are consumed in order, one per fetch.
async function setup(replies: Reply[], options: { controller?: boolean } = {}) {
  const queue = [...replies];
  const signals: AbortSignal[] = [];
  const fetchSpy = vi.fn((_url: string, init: { signal: AbortSignal }) => {
    signals.push(init.signal);
    const next = queue.shift();
    if (next === undefined) throw new Error('test: unexpected fetch');
    return next();
  });
  vi.stubGlobal('fetch', fetchSpy);
  const reload = vi.fn();
  vi.stubGlobal('location', { reload });
  vi.stubGlobal('navigator', options.controller ? { serviceWorker: { controller: {} } } : {});
  vi.resetModules();
  const { dictionary } = await import('./dictionary.svelte');
  // After the import (the module loader uses real timers); only the store's timer is faked.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  return { dictionary, fetchSpy, reload, signals };
}

// Let pending promise callbacks run, then yield one real macrotask so an unhandled rejection
// surfaces inside the test.
async function settled(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  vi.useRealTimers();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AD-8 dictionary load', () => {
  it('AD-8 starts loading with no words before load()', async () => {
    const { dictionary, fetchSpy } = await setup([]);
    expect(dictionary.state).toBe('loading');
    expect(dictionary.words).toBeUndefined();
    expect(dictionary.showBanner).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('AD-8 a 200 non-empty list is ready with the LF-split words, empty lines dropped', async () => {
    const { dictionary, fetchSpy } = await setup([ok('cat\ndog\n\ntan\n')]);
    await dictionary.load();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(dictionary.state).toBe('ready');
    expect(dictionary.words).toEqual(new Set(['cat', 'dog', 'tan']));
    expect(dictionary.showBanner).toBe(false);
    await settled();
  });

  const failures: [string, Reply][] = [
    ['a 500', status(500)],
    ['a rejected fetch', networkError],
    [
      'a body erroring before the abort',
      () => Promise.resolve(response(200, () => Promise.reject(new TypeError('body')))),
    ],
    ["an '' body", ok('')],
    ["a '\\n' body", ok('\n')],
  ];
  for (const [name, reply] of failures) {
    it(`AD-8 ${name} is failed with no unhandled rejection`, async () => {
      const { dictionary } = await setup([reply]);
      await expect(dictionary.load()).resolves.toBeUndefined();
      expect(dictionary.state).toBe('failed');
      expect(dictionary.words).toBeUndefined();
      expect(dictionary.showBanner).toBe(true);
      await settled();
    });
  }

  it('AD-8 a second load() throws synchronously', async () => {
    const { dictionary } = await setup([ok('cat\n')]);
    const first = dictionary.load();
    expect(() => dictionary.load()).toThrow('AD-8 load() called twice');
    await first;
    await settled();
  });

  it('AD-8 retry() while loading or ready throws synchronously', async () => {
    const { dictionary } = await setup([ok('cat\n')]);
    expect(() => dictionary.retry()).toThrow('AD-8 retry() while loading');
    const loading = dictionary.load();
    expect(() => dictionary.retry()).toThrow('AD-8 retry() while loading');
    await loading;
    expect(() => dictionary.retry()).toThrow('AD-8 retry() while ready');
    await settled();
  });
});

describe('AD-8 dictionary timeout', () => {
  it('AD-8 a never-closing body is loading at 29 999 ms and failed at 30 000 ms', async () => {
    const { dictionary } = await setup([stalled]);
    const loading = dictionary.load();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(dictionary.state).toBe('loading');
    expect(dictionary.showBanner).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(dictionary.state).toBe('failed');
    expect(dictionary.showBanner).toBe(true);
    await expect(loading).resolves.toBeUndefined();
    await settled();
  });

  it('AD-8 a retry with a never-closing body is loading at 29 999 ms and failed at 30 000 ms', async () => {
    const { dictionary } = await setup([status(500), stalled]);
    await dictionary.load();
    const retrying = dictionary.retry();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(dictionary.state).toBe('loading');
    await vi.advanceTimersByTimeAsync(1);
    expect(dictionary.state).toBe('failed');
    await expect(retrying).resolves.toBeUndefined();
    await settled();
  });

  it('AD-8 a never-settling fetch is failed at 30 000 ms', async () => {
    const { dictionary } = await setup([() => new Promise(() => {})]);
    const loading = dictionary.load();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(dictionary.state).toBe('failed');
    await loading;
    await settled();
  });

  it('AD-8 a body erroring on the abort is failed with no unhandled rejection', async () => {
    const { dictionary, signals } = await setup([
      () =>
        Promise.resolve(
          response(
            200,
            () =>
              new Promise<string>((_, reject) => {
                signals[0]?.addEventListener('abort', () => reject(new DOMException('aborted')));
              }),
          ),
        ),
    ]);
    const loading = dictionary.load();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(signals[0]?.aborted).toBe(true);
    expect(dictionary.state).toBe('failed');
    await loading;
    await settled();
  });

  it('AD-8 a settled load clears its timer', async () => {
    const { dictionary } = await setup([ok('cat\n')]);
    await dictionary.load();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('AD-8 dictionary retry', () => {
  it('AD-8 after a 500, retry() is loading synchronously with the banner hidden, then refetches', async () => {
    const { dictionary, fetchSpy, reload } = await setup([status(500), ok('cat\n')]);
    await dictionary.load();
    expect(dictionary.state).toBe('failed');
    const retrying = dictionary.retry();
    expect(dictionary.state).toBe('loading');
    expect(dictionary.showBanner).toBe(false);
    await retrying;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(reload).not.toHaveBeenCalled();
    expect(dictionary.state).toBe('ready');
    expect(dictionary.words).toEqual(new Set(['cat']));
    await settled();
  });

  it('AD-8 a repeat failure after retry() is failed again', async () => {
    const { dictionary, fetchSpy } = await setup([status(500), networkError]);
    await dictionary.load();
    await dictionary.retry();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(dictionary.state).toBe('failed');
    expect(dictionary.showBanner).toBe(true);
    await settled();
  });

  it('AD-8 after a 404, retry() reloads the page, makes no fetch and stays failed', async () => {
    const { dictionary, fetchSpy, reload } = await setup([status(404)]);
    await dictionary.load();
    expect(dictionary.state).toBe('failed');
    await expect(dictionary.retry()).resolves.toBeUndefined();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(dictionary.state).toBe('failed');
    expect(dictionary.showBanner).toBe(true);
    await settled();
  });

  it('AD-8 a 404 on a retry makes the next retry() reload without fetching', async () => {
    const { dictionary, fetchSpy, reload } = await setup([status(500), status(404)]);
    await dictionary.load();
    await dictionary.retry();
    expect(reload).not.toHaveBeenCalled();
    expect(dictionary.state).toBe('failed');
    await dictionary.retry();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(dictionary.state).toBe('failed');
    await settled();
  });
});

describe('AD-8 dictionary retry (Q-42) under a controlling service worker', () => {
  it('AD-8 (Q-42) after a 404, retry() never reloads and refetches with the banner kept shown, then ready hides it', async () => {
    const { dictionary, fetchSpy, reload } = await setup([status(404), ok('cat\n')], {
      controller: true,
    });
    await dictionary.load();
    const retrying = dictionary.retry();
    expect(dictionary.state).toBe('loading');
    expect(dictionary.showBanner).toBe(true);
    await retrying;
    expect(reload).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(dictionary.state).toBe('ready');
    expect(dictionary.showBanner).toBe(false);
    await settled();
  });

  it('AD-8 (Q-42) after a 404, a failing in-place retry is failed with the banner shown and no reload', async () => {
    const { dictionary, fetchSpy, reload } = await setup([status(404), status(404)], {
      controller: true,
    });
    await dictionary.load();
    await dictionary.retry();
    expect(reload).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(dictionary.state).toBe('failed');
    expect(dictionary.showBanner).toBe(true);
    await settled();
  });
});
