import { afterEach, describe, expect, it, vi } from 'vitest';

// AD-13 nav adapter on a stubbed window (an EventTarget) and a simulated session history: the
// fake records every call; `go`/`back` only queue a traversal, which the test settles by hand
// (`settle()`), as a browser fires `popstate` later. `forward()` / `userBack()` are the player's
// own traversals. Fresh module per test (module-level state).

type Entry = { state: unknown };
type Call = ['push' | 'replace', unknown] | ['go', number] | ['back'];

function fakeHistory(initial: unknown[] = [null], index = initial.length - 1) {
  const entries: Entry[] = initial.map((state) => ({ state }));
  let at = index;
  const calls: Call[] = [];
  const traversals: number[] = [];
  const api = {
    get state() {
      return entries[at]?.state ?? null;
    },
    pushState(state: unknown) {
      calls.push(['push', state]);
      entries.splice(at + 1, entries.length, { state });
      at += 1;
    },
    replaceState(state: unknown) {
      calls.push(['replace', state]);
      const entry = entries[at];
      if (entry === undefined) throw new Error('no current entry');
      entry.state = state;
    },
    go(delta: number) {
      calls.push(['go', delta]);
      traversals.push(delta);
    },
    back() {
      calls.push(['back']);
      traversals.push(-1);
    },
  };
  return { api, entries, calls, traversals, at: () => at, move: (delta: number) => (at += delta) };
}

async function setup(initial?: unknown[], index?: number) {
  const win = new EventTarget();
  vi.stubGlobal('window', win);
  const fake = fakeHistory(initial, index);
  vi.stubGlobal('history', fake.api);
  vi.resetModules();
  const { nav } = await import('./nav');
  const addSpy = vi.spyOn(win, 'addEventListener');
  const listener = () => {
    const spy = addSpy.mock.calls.filter(([type]) => type === 'popstate');
    if (spy.length !== 1) throw new Error(`${spy.length} popstate listeners`);
    return spy[0]?.[1] as unknown as (event: { state: unknown }) => void;
  };
  // Moves by `delta` and fires popstate with the landed entry's state (listener called directly:
  // Node's dispatchEvent swallows a listener's throw).
  const traverse = (delta: number) => {
    fake.move(delta);
    listener()({ state: fake.api.state });
  };
  const settle = () => {
    const delta = fake.traversals.shift();
    if (delta === undefined) throw new Error('no traversal pending');
    traverse(delta);
  };
  const callbacks = { depth: 0, closed: [] as number[] };
  const register = () =>
    nav.register({
      closedByBack: (d) => {
        callbacks.closed.push(d);
        callbacks.depth = Math.min(callbacks.depth, d);
      },
      depth: () => callbacks.depth,
    });
  // The launch id launch() stamped on the base entry (entry 0 in every case here).
  const launchId = () => {
    const stamp = fake.entries[0]?.state as { launch?: unknown } | null;
    if (typeof stamp?.launch !== 'number') throw new Error('no launch id on the base entry');
    return stamp.launch;
  };
  return { nav, fake, traverse, settle, callbacks, register, launchId, listener };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('AD-13 launch', () => {
  it('AD-13 launch with no entry state stamps { wc: 0, launch } and resolves', async () => {
    const t = await setup([null]);
    await t.nav.launch();
    expect(t.fake.calls).toEqual([['replace', { wc: 0, launch: expect.any(Number) }]]);
  });

  it('AD-13 launch on a wc 0 entry stamps the new launch without rewinding', async () => {
    const t = await setup([{ wc: 0, launch: 1 }]);
    await t.nav.launch();
    expect(t.fake.calls).toEqual([['replace', { wc: 0, launch: expect.any(Number) }]]);
  });

  it('AD-13 launch at wc 2 rewinds with go(-2); its own popstate (old launch) is exempt from the stale check', async () => {
    const t = await setup([
      { wc: 0, launch: 1 },
      { wc: 1, launch: 1 },
      { wc: 2, launch: 1 },
    ]);
    const launched = t.nav.launch();
    expect(t.fake.calls).toEqual([['go', -2]]);
    t.settle();
    await launched;
    expect(t.fake.at()).toBe(0);
    expect(t.fake.calls.at(-1)).toEqual(['replace', { wc: 0, launch: expect.any(Number) }]);
    expect(t.launchId()).not.toBe(1);
  });

  it('AD-13 no rewind popstate within 250 ms rejects launch() without throwing in the timer; later popstates are ignored', async () => {
    vi.useFakeTimers();
    const t = await setup([
      { wc: 0, launch: 1 },
      { wc: 1, launch: 1 },
    ]);
    const launched = t.nav.launch();
    const outcome = launched.then(
      () => 'resolved',
      (error: Error) => error.message,
    );
    vi.advanceTimersByTime(249);
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(1);
    expect(() => vi.advanceTimersByTime(1)).not.toThrow();
    expect(await outcome).toBe('AD-13 launch rewind: no popstate within 250 ms');
    t.settle();
    expect(t.fake.calls).toEqual([['go', -1]]);
    expect(() => t.register()).toThrow(/^AD-13 register\(\) before launch/);
  });

  it('AD-13 launch() twice throws', async () => {
    const t = await setup();
    await t.nav.launch();
    expect(() => t.nav.launch()).toThrow(/^AD-13 launch\(\) called twice/);
  });

  it('AD-13 launch with a non-positive-integer wc (1.5, −1, "2") does no rewind and only stamps the entry', async () => {
    for (const bad of [1.5, -1, '2']) {
      const t = await setup([null, { wc: bad, launch: 1 }]);
      await t.nav.launch();
      expect(t.fake.calls).toEqual([['replace', { wc: 0, launch: expect.any(Number) }]]);
      vi.unstubAllGlobals();
    }
  });
});

describe('AD-13 register', () => {
  it('AD-13 register() before launch resolves throws; twice throws', async () => {
    const t = await setup([null, { wc: 1, launch: 1 }]);
    const launched = t.nav.launch();
    expect(() => t.register()).toThrow(/^AD-13 register\(\) before launch/);
    t.settle();
    await launched;
    t.register();
    expect(() => t.register()).toThrow(/^AD-13 register\(\) called twice/);
  });

  it('AD-13 push() and pop() before register() throw', async () => {
    const t = await setup();
    await t.nav.launch();
    expect(() => t.nav.push()).toThrow(/^AD-13 push\(\) before register\(\)/);
    expect(() => t.nav.pop()).toThrow(/^AD-13 pop\(\) before register\(\)/);
  });

  it('AD-13 a stale popstate before register() is ignored; a current-launch one with a wc throws', async () => {
    const t = await setup([null, { wc: 1, launch: 1 }], 0);
    await t.nav.launch();
    t.traverse(1);
    expect(t.fake.calls).toHaveLength(1);
    expect(() => t.traverse(-1)).toThrow(/^AD-13 back before register\(\)/);
    expect(t.fake.calls).toHaveLength(1);
  });
});

describe('AD-13 push, pop and back', () => {
  async function ready(depth = 0) {
    const t = await setup();
    await t.nav.launch();
    t.register();
    for (let i = 0; i < depth; i++) {
      t.nav.push();
      t.callbacks.depth += 1;
    }
    t.fake.calls.length = 0;
    return t;
  }

  it('AD-13 each push sends { wc: count + 1, launch }', async () => {
    const t = await ready();
    t.nav.push();
    t.nav.push();
    const launch = t.launchId();
    expect(t.fake.calls).toEqual([
      ['push', { wc: 1, launch }],
      ['push', { wc: 2, launch }],
    ]);
  });

  it('AD-13 a back to { wc: 0 } at depth 1 calls closedByBack(0) and nothing else', async () => {
    const t = await ready(1);
    t.traverse(-1);
    expect(t.callbacks.closed).toEqual([0]);
    expect(t.fake.calls).toEqual([]);
  });

  it('AD-13 a popstate from nav’s own pop() does not call the close callback', async () => {
    const t = await ready(1);
    t.callbacks.depth = 0;
    t.nav.pop();
    expect(t.fake.calls).toEqual([['back']]);
    t.settle();
    expect(t.callbacks.closed).toEqual([]);
  });

  it('AD-13 a second pop() issues its back only after the first pop’s popstate', async () => {
    const t = await ready(2);
    t.callbacks.depth = 0;
    t.nav.pop();
    t.nav.pop();
    expect(t.fake.calls).toEqual([['back']]);
    t.settle();
    expect(t.fake.calls).toEqual([['back'], ['back']]);
    t.settle();
    expect(t.fake.at()).toBe(0);
    expect(t.callbacks.closed).toEqual([]);
  });

  it('AD-13 a push issued while a pop is pending is sent after its popstate; two such pushes go out as consecutive wc (pop from wc 2 → wc 2, 3)', async () => {
    const t = await ready(2);
    const launch = t.launchId();
    t.callbacks.depth = 1;
    t.nav.pop();
    t.nav.push();
    t.nav.push();
    expect(t.fake.calls).toEqual([['back']]);
    t.settle();
    expect(t.fake.calls).toEqual([
      ['back'],
      ['push', { wc: 2, launch }],
      ['push', { wc: 3, launch }],
    ]);
  });

  it('AD-13 a missing wc on a current-launch popstate is ignored', async () => {
    const t = await ready(1);
    const launch = t.launchId();
    expect(() => t.listener()({ state: { launch } })).not.toThrow();
    expect(() => t.listener()({ state: { launch, wc: '0' } })).not.toThrow();
    expect(t.callbacks.closed).toEqual([]);
    expect(t.fake.calls).toEqual([]);
  });

  it('AD-13 a stale-launch popstate closes nothing and calls no back', async () => {
    const t = await ready(1);
    t.listener()({ state: { wc: 0, launch: -1 } });
    t.listener()({ state: null });
    expect(t.callbacks.closed).toEqual([]);
    expect(t.fake.calls).toEqual([]);
  });

  it('AD-13 Forward (wc beyond depth) does go(−(d − depth)), closes nothing, and its popstate closes nothing', async () => {
    const t = await ready(2);
    t.callbacks.depth = 0;
    t.nav.pop();
    t.nav.pop();
    t.settle();
    t.settle();
    t.fake.calls.length = 0;
    t.traverse(2);
    expect(t.fake.calls).toEqual([['go', -2]]);
    expect(t.callbacks.closed).toEqual([]);
    t.settle();
    expect(t.fake.at()).toBe(0);
    expect(t.callbacks.closed).toEqual([]);
  });

  it('AD-13 after a Forward correction push() sends { wc: depth + 1 }', async () => {
    const t = await ready(2);
    const launch = t.launchId();
    t.callbacks.depth = 1;
    t.nav.pop();
    t.settle();
    t.fake.calls.length = 0;
    t.traverse(1);
    expect(t.fake.calls).toEqual([['go', -1]]);
    t.nav.push();
    expect(t.fake.calls).toEqual([['go', -1]]);
    t.settle();
    expect(t.fake.calls).toEqual([
      ['go', -1],
      ['push', { wc: 2, launch }],
    ]);
  });

  it('AD-13 a multi-step back (popstate { wc: 0 } at depth 2) calls closedByBack(0) once', async () => {
    const t = await ready(2);
    t.traverse(-2);
    expect(t.callbacks.closed).toEqual([0]);
    expect(t.fake.calls).toEqual([]);
  });

  it('AD-13 a pending pop settled by a stale-launch popstate still settles: count unchanged, a queued push goes out', async () => {
    const t = await ready(2);
    const launch = t.launchId();
    t.callbacks.depth = 1;
    t.nav.pop();
    t.nav.push();
    expect(t.fake.calls).toEqual([['back']]);
    t.fake.traversals.shift();
    t.fake.move(-1);
    t.listener()({ state: { wc: 0, launch: -1 } });
    expect(t.callbacks.closed).toEqual([]);
    expect(t.fake.calls).toEqual([['back'], ['push', { wc: 3, launch }]]);
  });
});
