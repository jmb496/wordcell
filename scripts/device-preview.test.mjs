// @ts-check
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { hintLines, parseArgs, run, seedPage, tailnetUrl } from './device-preview.mjs';

/**
 * The value the seed page stores under `key`, parsed, or null when it stores nothing there.
 * @param {string} page
 * @param {string} key
 */
function stored(page, key) {
  const match = new RegExp(
    `localStorage\\.setItem\\(${JSON.stringify(key)}, (".*?(?<!\\\\)")\\);`,
  ).exec(page);
  return match === null ? null : { value: JSON.parse(/** @type {string} */ (match[1])) };
}

describe('AD-17 device preview helpers', () => {
  it('AD-17 seedPage stores the fixture as wordcell:session and opens the app', () => {
    const json = readFileSync('fixtures/session-won-words.json', 'utf8');
    const page = seedPage({ sessionJson: json });
    const session = /localStorage\.setItem\("wordcell:session", (".*?(?<!\\)")\);/.exec(page);
    expect(session).not.toBeNull();
    expect(JSON.parse(JSON.parse(/** @type {string[]} */ (session)[1]))).toEqual(JSON.parse(json));
    expect(page).toContain('unregister()');
    expect(page).toContain("location.replace('/')");
    expect(page).not.toContain('wordcell:history');
  });

  it('AD-17 seedPage throws on a fixture that is not JSON', () => {
    expect(() => seedPage({ sessionJson: '{not json' })).toThrow();
  });

  it('AD-17 seedPage history-only stores wordcell:history as "null" and no wordcell:session', () => {
    const json = readFileSync('fixtures/history-invalid-null.json', 'utf8');
    const page = seedPage({ historyJson: json });
    expect(stored(page, 'wordcell:history')).toEqual({ value: 'null' });
    expect(stored(page, 'wordcell:session')).toBeNull();
    expect(page).not.toContain('wordcell:session');
    expect(page).toContain('unregister()');
    expect(page).toContain("location.replace('/')");
    expect(page.indexOf('unregister()')).toBeLessThan(page.indexOf('localStorage.setItem'));
    expect(page.lastIndexOf('localStorage.setItem')).toBeLessThan(
      page.indexOf("location.replace('/')"),
    );
  });

  it('AD-17 seedPage with session and history stores both', () => {
    const sessionJson = readFileSync('fixtures/session-won-words.json', 'utf8');
    const historyJson = readFileSync('fixtures/history-three-records.json', 'utf8');
    const page = seedPage({ sessionJson, historyJson });
    expect(
      JSON.parse(/** @type {{ value: string }} */ (stored(page, 'wordcell:session')).value),
    ).toEqual(JSON.parse(sessionJson));
    expect(
      JSON.parse(/** @type {{ value: string }} */ (stored(page, 'wordcell:history')).value),
    ).toEqual(JSON.parse(historyJson));
    expect(page.indexOf('unregister()')).toBeLessThan(page.indexOf('localStorage.setItem'));
    expect(page.lastIndexOf('localStorage.setItem')).toBeLessThan(
      page.indexOf("location.replace('/')"),
    );
  });

  it('AD-17 seedPage throws without any fixture', () => {
    expect(() => seedPage({})).toThrow();
  });

  it('AD-17 seedPage throws on an empty historyJson (an empty file is not absent)', () => {
    expect(() => seedPage({ historyJson: '' })).toThrow();
    const sessionJson = readFileSync('fixtures/session-won-words.json', 'utf8');
    expect(() => seedPage({ sessionJson, historyJson: '' })).toThrow();
  });

  it('AD-17 seedPage rejects a bare string (no string overload)', () => {
    const json = readFileSync('fixtures/session-won-words.json', 'utf8');
    expect(() => seedPage(/** @type {any} */ (json))).toThrow();
  });

  it('AD-17 tailnetUrl drops the trailing dot of Self.DNSName', () => {
    const status = JSON.stringify({ Self: { DNSName: 'desk.tail0.ts.net.' } });
    expect(tailnetUrl(status)).toBe('https://desk.tail0.ts.net');
  });

  it('AD-17 tailnetUrl throws without Self.DNSName', () => {
    expect(() => tailnetUrl('{}')).toThrow(/DNSName/);
  });
});

describe('AD-17 device preview parseArgs', () => {
  it('AD-17 parseArgs with no args builds with no fixture', () => {
    expect(parseArgs([])).toEqual({ session: undefined, history: undefined, build: true });
  });

  it('AD-17 parseArgs with a session positional alone gives no history', () => {
    expect(parseArgs(['session-x'])).toEqual({
      session: 'session-x',
      history: undefined,
      build: true,
    });
  });

  it('AD-17 parseArgs with --history alone gives no session', () => {
    expect(parseArgs(['--history', 'history-x'])).toEqual({
      session: undefined,
      history: 'history-x',
      build: true,
    });
  });

  it('AD-17 parseArgs takes session and history in either order', () => {
    const both = { session: 'session-x', history: 'history-y', build: true };
    expect(parseArgs(['session-x', '--history', 'history-y'])).toEqual(both);
    expect(parseArgs(['--history', 'history-y', 'session-x'])).toEqual(both);
  });

  it('AD-17 parseArgs --no-build in any position, repeated or not, gives build false', () => {
    const args = ['session-x', '--history', 'history-y'];
    const expected = { session: 'session-x', history: 'history-y', build: false };
    expect(parseArgs(['--no-build', ...args])).toEqual(expected);
    expect(parseArgs(['session-x', '--no-build', '--history', 'history-y'])).toEqual(expected);
    expect(parseArgs([...args, '--no-build'])).toEqual(expected);
    expect(parseArgs(['--no-build', '--no-build'])).toEqual({
      session: undefined,
      history: undefined,
      build: false,
    });
  });

  it.each([
    ['--history without a value', ['--history']],
    ['--history with a --no-build value', ['--history', '--no-build']],
    ['--history with a --prefixed value', ['--history', '--other']],
    ['a repeated --history', ['--history', 'history-x', '--history', 'history-y']],
    ['a second positional', ['session-x', 'session-y']],
    ['an unknown flag', ['--seed']],
    ['a positional not starting session-', ['won-words']],
    ['a history- positional', ['history-x']],
    ['a --history value not starting history-', ['--history', 'invalid-null']],
    ['a session- --history value', ['--history', 'session-x']],
  ])('AD-17 parseArgs throws a usage error on %s', (_, argv) => {
    expect(() => parseArgs(argv)).toThrow(/usage/);
  });
});

describe('AD-17 device preview hintLines', () => {
  const url = 'https://desk.tail0.ts.net';

  it('AD-17 hintLines for a seed run points at /seed.html and says clear site data', () => {
    expect(hintLines(url, parseArgs(['--history', 'history-x']))).toEqual([
      'On the phone (Tailscale connected): https://desk.tail0.ts.net/seed.html',
      "Seed, re-seed or fresh install: clear this origin's site data on the phone first.",
      'Ctrl+C stops.',
    ]);
    expect(hintLines(url, parseArgs(['session-x']))[0]).toBe(
      'On the phone (Tailscale connected): https://desk.tail0.ts.net/seed.html',
    );
  });

  it('AD-17 hintLines for a no-fixture run points at / with the fresh-install and update lines', () => {
    expect(hintLines(url, parseArgs([]))).toEqual([
      'On the phone (Tailscale connected): https://desk.tail0.ts.net/',
      'Fresh install: clear site data first.',
      'Update read (G3): keep site data.',
      'Ctrl+C stops.',
    ]);
  });
});

/**
 * A fake `Io` that records each call by name (with its argument where it matters). `waitForPort`
 * resolves unless `wait` is given; `portOpen` returns `portOpen` (default false); `serve` returns
 * `serveStatus` (default 0); `exit` only records.
 * The preview keeps its `exit` listener (`exitPreview` fires it) and `kill()` fires it with null, as
 * a real child would.
 * @param {{ fixture?: string, wait?: () => Promise<void>, portOpen?: boolean, serveStatus?: number }} [options]
 */
function fakeIo(options = {}) {
  /** @type {string[]} */
  const calls = [];
  /** @type {Partial<Record<'SIGINT' | 'SIGTERM' | 'SIGHUP', () => void>>} */
  const signals = {};
  /** @type {string[]} */
  const seeds = [];
  /** @type {((code: number | null) => void)[]} */
  const exitListeners = [];
  /** @param {number | null} code */
  const exitPreview = (code) => {
    for (const listener of exitListeners) listener(code);
  };
  /** @type {import('./device-preview.mjs').Io} */
  const io = {
    readFixture: (name) => {
      calls.push(`readFixture ${name}`);
      return options.fixture ?? readFileSync(`fixtures/${name}.json`, 'utf8');
    },
    portOpen: async () => {
      calls.push('portOpen');
      return options.portOpen ?? false;
    },
    removeStaleSeed: () => {
      calls.push('removeStaleSeed');
    },
    tailnetStatus: () => {
      calls.push('tailnetStatus');
      return JSON.stringify({ Self: { DNSName: 'desk.tail0.ts.net.' } });
    },
    build: () => {
      calls.push('build');
    },
    hasDist: () => {
      calls.push('hasDist');
      return true;
    },
    writeSeed: (html) => {
      calls.push('writeSeed');
      seeds.push(html);
    },
    spawnPreview: () => {
      calls.push('spawnPreview');
      return {
        on: (_event, listener) => {
          exitListeners.push(listener);
        },
        kill: () => {
          calls.push('kill');
          exitPreview(null);
        },
      };
    },
    onSignal: (signal, handler) => {
      calls.push(`onSignal ${signal}`);
      signals[signal] = handler;
    },
    waitForPort: () => {
      calls.push('waitForPort');
      return options.wait === undefined ? Promise.resolve() : options.wait();
    },
    serve: () => {
      calls.push('serve');
      return { status: options.serveStatus ?? 0, stdout: '', stderr: '' };
    },
    serveOff: () => {
      calls.push('serveOff');
    },
    log: () => {
      calls.push('log');
    },
    error: () => {
      calls.push('error');
    },
    exit: (code) => {
      calls.push(`exit ${code}`);
    },
  };
  return { io, calls, signals, seeds, exitPreview };
}

describe('AD-17 device preview run', () => {
  it('AD-17 run throws on a non-JSON fixture before any port, tailnet or build call', async () => {
    const { io, calls } = fakeIo({ fixture: '{not json' });
    await expect(run(['session-won-words'], io)).rejects.toThrow(SyntaxError);
    expect(calls).toEqual(['readFixture session-won-words']);
  });

  it('AD-17 run with port 4173 taken throws before removing the seed, the tailnet call or the build', async () => {
    const { io, calls } = fakeIo({ portOpen: true });
    await expect(run([], io)).rejects.toThrow(
      'device-preview: port 4173 is taken; stop the other run (Ctrl+C) or free it',
    );
    expect(calls).toEqual(['portOpen']);
  });

  it('AD-17 run without a fixture removes the stale seed page before the tailnet call and writes none', async () => {
    const { io, calls } = fakeIo();
    await run([], io);
    expect(calls).toEqual([
      'portOpen',
      'removeStaleSeed',
      'tailnetStatus',
      'build',
      'hasDist',
      'spawnPreview',
      'onSignal SIGINT',
      'onSignal SIGTERM',
      'onSignal SIGHUP',
      'waitForPort',
      'serve',
      'log',
    ]);
  });

  it('AD-17 run with a fixture never removes the seed page and writes it after the build and the dist check', async () => {
    const { io, calls, seeds } = fakeIo();
    await run(['session-won-words', '--history', 'history-three-records'], io);
    expect(calls).not.toContain('removeStaleSeed');
    expect(calls.slice(0, 7)).toEqual([
      'readFixture session-won-words',
      'readFixture history-three-records',
      'portOpen',
      'tailnetStatus',
      'build',
      'hasDist',
      'writeSeed',
    ]);
    expect(seeds).toHaveLength(1);
    expect(seeds[0]).toContain('wordcell:session');
    expect(seeds[0]).toContain('wordcell:history');
  });

  it('AD-17 run with a session fixture only never removes the seed page and writes a session-only seed after the dist check', async () => {
    const { io, calls, seeds } = fakeIo();
    await run(['session-won-words'], io);
    expect(calls).not.toContain('removeStaleSeed');
    expect(calls.filter((call) => call === 'writeSeed')).toHaveLength(1);
    expect(calls.indexOf('writeSeed')).toBe(calls.indexOf('hasDist') + 1);
    expect(seeds).toHaveLength(1);
    const seed = /** @type {string} */ (seeds[0]);
    expect(stored(seed, 'wordcell:session')).not.toBeNull();
    expect(stored(seed, 'wordcell:history')).toBeNull();
  });

  it('AD-17 run with a history fixture only never removes the seed page and writes a history-only seed after the dist check', async () => {
    const { io, calls, seeds } = fakeIo();
    await run(['--history', 'history-invalid-null'], io);
    expect(calls).not.toContain('removeStaleSeed');
    expect(calls.filter((call) => call === 'writeSeed')).toHaveLength(1);
    expect(calls.indexOf('writeSeed')).toBe(calls.indexOf('hasDist') + 1);
    expect(seeds).toHaveLength(1);
    const seed = /** @type {string} */ (seeds[0]);
    expect(stored(seed, 'wordcell:history')).toEqual({ value: 'null' });
    expect(stored(seed, 'wordcell:session')).toBeNull();
  });

  it('AD-17 run with --no-build makes no build call', async () => {
    const { io, calls } = fakeIo();
    await run(['--no-build'], io);
    expect(calls).not.toContain('build');
    expect(calls).toContain('hasDist');
  });

  it('AD-17 run registers the signal handlers before the port wait and serve; SIGINT during the wait turns the share off, kills the preview and exits 0', async () => {
    const { io, calls, signals } = fakeIo({ wait: () => new Promise(() => {}) });
    void run([], io);
    await vi.waitFor(() => expect(calls).toContain('waitForPort'));
    const wait = calls.indexOf('waitForPort');
    expect(calls.slice(0, wait)).toEqual(
      expect.arrayContaining(['onSignal SIGINT', 'onSignal SIGTERM', 'onSignal SIGHUP']),
    );
    expect(calls).not.toContain('serve');
    const sigint = signals.SIGINT;
    if (sigint === undefined) throw new Error('no SIGINT handler');
    sigint();
    await vi.waitFor(() => expect(calls.slice(wait + 1)).toEqual(['serveOff', 'kill', 'exit 0']));
  });

  it('AD-17 run SIGTERM during the port wait turns the share off, kills the preview and exits 0', async () => {
    const { io, calls, signals } = fakeIo({ wait: () => new Promise(() => {}) });
    void run([], io);
    await vi.waitFor(() => expect(calls).toContain('waitForPort'));
    const wait = calls.indexOf('waitForPort');
    const sigterm = signals.SIGTERM;
    if (sigterm === undefined) throw new Error('no SIGTERM handler');
    sigterm();
    await vi.waitFor(() => expect(calls.slice(wait + 1)).toEqual(['serveOff', 'kill', 'exit 0']));
  });

  it('AD-17 run kills the preview and rethrows the same error when the port wait times out', async () => {
    const timeout = new Error('device-preview: nothing listening on port 4173 after 15000 ms');
    const { io, calls } = fakeIo({ wait: () => Promise.reject(timeout) });
    await expect(run([], io)).rejects.toBe(timeout);
    expect(calls.filter((call) => call === 'kill')).toHaveLength(1);
    // Nothing follows the kill: its exit event is expected (no error, serveOff or exit).
    expect(calls.slice(calls.indexOf('waitForPort'))).toEqual(['waitForPort', 'kill']);
  });

  it('AD-17 run reports an unexpected preview exit and stops with exit 1', async () => {
    const { io, calls, exitPreview } = fakeIo({ wait: () => new Promise(() => {}) });
    void run([], io);
    await vi.waitFor(() => expect(calls).toContain('waitForPort'));
    exitPreview(1);
    await vi.waitFor(() =>
      expect(calls.slice(calls.indexOf('waitForPort') + 1)).toEqual([
        'error',
        'serveOff',
        'kill',
        'exit 1',
      ]),
    );
  });

  it('AD-17 run stops with exit 1 and prints no hint when tailscale serve fails', async () => {
    const { io, calls } = fakeIo({ serveStatus: 1 });
    await run([], io);
    expect(calls.slice(calls.indexOf('serve') + 1)).toEqual([
      'error',
      'error',
      'serveOff',
      'kill',
      'exit 1',
    ]);
    expect(calls).not.toContain('log');
  });
});
