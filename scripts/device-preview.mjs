// @ts-check
// Owner device reads on a real phone (docs/device-testing.md, CAP-7): builds the hook-free `dist/`,
// writes an optional one-tap seed page into it (never into `public/`, so it never ships, F9), serves
// it with `vite preview` on 4173 and shares that over HTTPS inside the owner's tailnet with
// `tailscale serve`, so the phone gets a secure context (service worker, install) without USB or
// chrome://inspect. Ctrl+C (or SIGTERM, or SIGHUP from a closed terminal) turns the share off and
// stops the preview, waiting for it to exit (SIGKILL after KILL_GRACE_MS). Fails fast (rule 6) on a
// usage error, a missing or non-JSON fixture, when Tailscale is missing, Serve is not enabled on
// the tailnet, or port 4173 is taken.
// Usage: node scripts/device-preview.mjs [session-fixture] [--history <history-fixture>] [--no-build]
//   session-fixture: a `fixtures/session-*.json` name without `.json` (e.g. session-won-words);
//   --history: a `fixtures/history-*.json` name without `.json` (e.g. history-invalid-null).
//   With either, the phone opens `/seed.html`, which stores them as `wordcell:session` /
//   `wordcell:history` and opens the app. A worker controlling the origin answers `/seed.html`
//   with the app, so clear the origin's site data before a seed (docs/device-testing.md).
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 4173;
/** A cold `vite preview` on the /mnt/d checkout took 9–15 s to listen (epic 7 retro A3). */
const PORT_WAIT_MS = 45_000;
/** How long a stopped preview gets to exit after SIGTERM before SIGKILL (epic 7 retro A3). */
const KILL_GRACE_MS = 5_000;
const SESSION_KEY = 'wordcell:session';
const HISTORY_KEY = 'wordcell:history';
const USAGE =
  'usage: node scripts/device-preview.mjs [session-fixture] [--history <history-fixture>] [--no-build]';

/**
 * @typedef {{ session: string | undefined, history: string | undefined, build: boolean }} Args
 */

/**
 * Parses the CLI (CAP-7, F9). Throws a usage error (rule 6) on anything else.
 * @param {string[]} argv
 * @returns {Args}
 */
export function parseArgs(argv) {
  /** @param {string} reason */
  const usage = (reason) => new Error(`device-preview: ${reason}; ${USAGE}`);
  /** @type {Args} */
  const parsed = { session: undefined, history: undefined, build: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-build') {
      parsed.build = false;
    } else if (arg === '--history') {
      if (parsed.history !== undefined) throw usage('--history given twice');
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) throw usage('--history needs a value');
      if (!value.startsWith('history-'))
        throw usage(`--history ${value} is not a history- fixture`);
      parsed.history = value;
      i++;
    } else if (arg.startsWith('-')) {
      throw usage(`unknown flag ${arg}`);
    } else {
      if (parsed.session !== undefined) throw usage(`second fixture ${arg}`);
      if (!arg.startsWith('session-')) throw usage(`${arg} is not a session- fixture`);
      parsed.session = arg;
    }
  }
  return parsed;
}

/**
 * The seed page: stores the given fixtures (raw JSON text, re-serialised) and opens the app. Its
 * unregister is a guard for an uncontrolled first visit: a controlling worker answers `/seed.html`
 * with the app, so the page never runs then.
 * @param {{ sessionJson?: string, historyJson?: string }} fixtures
 * @returns {string}
 */
export function seedPage({ sessionJson, historyJson }) {
  if (sessionJson === undefined && historyJson === undefined) {
    throw new Error('device-preview: seedPage needs sessionJson or historyJson');
  }
  let stores = '';
  for (const [key, json] of [
    [SESSION_KEY, sessionJson],
    [HISTORY_KEY, historyJson],
  ]) {
    if (json === undefined) continue;
    const value = JSON.stringify(JSON.parse(json));
    stores += `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`;
  }
  return (
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
    '<title>Seed</title><p>Loading the seeded game…</p><script>(async () => {' +
    'for (const r of (await navigator.serviceWorker?.getRegistrations?.()) ?? []) await r.unregister();' +
    stores +
    "location.replace('/');})();</script>\n"
  );
}

/**
 * The lines printed once the share is up (CAP-7), one element per line, no blank entries.
 * @param {string} url
 * @param {Args} parsed
 * @returns {string[]}
 */
export function hintLines(url, parsed) {
  const seeded = parsed.session !== undefined || parsed.history !== undefined;
  return seeded
    ? [
        `On the phone (Tailscale connected): ${url}/seed.html`,
        "Seed, re-seed or fresh install: clear this origin's site data on the phone first.",
        'Ctrl+C stops.',
      ]
    : [
        `On the phone (Tailscale connected): ${url}/`,
        'Fresh install: clear site data first.',
        'Update read (G3): keep site data.',
        'Ctrl+C stops.',
      ];
}

/**
 * The machine's tailnet HTTPS URL from `tailscale status --json`.
 * @param {string} statusJson
 * @returns {string}
 */
export function tailnetUrl(statusJson) {
  const name = JSON.parse(statusJson)?.Self?.DNSName;
  if (typeof name !== 'string' || name === '') {
    throw new Error(
      'device-preview: tailscale status has no Self.DNSName (is Tailscale logged in?)',
    );
  }
  return `https://${name.replace(/\.$/, '')}`;
}

/** `tailscale.exe` from WSL (Tailscale runs on Windows), else `tailscale` on PATH. */
function tailscaleBin() {
  for (const bin of ['tailscale.exe', 'tailscale']) {
    if (spawnSync(bin, ['version'], { stdio: 'ignore' }).status === 0) return bin;
  }
  throw new Error('device-preview: Tailscale CLI not found (tailscale.exe or tailscale)');
}

/**
 * The side effects `run` performs, in the order it performs them (`realIo` below; fakes in
 * scripts/device-preview.test.mjs).
 * @typedef {{ on(event: 'exit', listener: (code: number | null) => void): unknown, kill(signal?: 'SIGTERM' | 'SIGKILL'): unknown }} Preview
 * @typedef {{ status: number | null, stdout?: string | null, stderr?: string | null }} ServeResult
 * @typedef {{
 *   readFixture(name: string): string,
 *   portOpen(port: number): Promise<boolean>,
 *   removeStaleSeed(): void,
 *   tailnetStatus(): string,
 *   build(): void,
 *   hasDist(): boolean,
 *   writeSeed(html: string): void,
 *   spawnPreview(port: number): Preview,
 *   onSignal(signal: 'SIGINT' | 'SIGTERM' | 'SIGHUP', handler: () => void): void,
 *   waitForPort(port: number, timeoutMs: number): Promise<void>,
 *   serve(port: number): ServeResult,
 *   serveOff(): void,
 *   log(text: string): void,
 *   error(text: string): void,
 *   exit(code: number): void,
 * }} Io
 */

/**
 * The CLI run (CAP-7): fixtures, port probe, stale-seed removal, tailnet URL, build, seed page,
 * `vite preview`, signal handlers, port wait, `tailscale serve`, hint lines. Every stop waits for
 * the preview to exit (SIGKILL after KILL_GRACE_MS), so no path leaves it listening on 4173.
 * @param {string[]} argv
 * @param {Io} io
 * @returns {Promise<void>}
 */
export async function run(argv, io) {
  const parsed = parseArgs(argv);
  /** @param {string | undefined} name */
  const readFixture = (name) => {
    if (name === undefined) return undefined;
    const json = io.readFixture(name);
    JSON.parse(json); // fail fast, before any Tailscale or build output (rule 6)
    return json;
  };
  const sessionJson = readFixture(parsed.session);
  const historyJson = readFixture(parsed.history);
  // Before the build: a second run would otherwise rebuild `dist/` under a first run that is
  // already serving. A first run still building (its port not open yet) is not caught here: both
  // builds write `dist/`, and the later `vite preview --strictPort` fails.
  if (await io.portOpen(PORT)) {
    throw new Error(
      `device-preview: port ${PORT} is taken; stop the other run (Ctrl+C) or free it`,
    );
  }
  const seeded = sessionJson !== undefined || historyJson !== undefined;
  // A `--no-build` run must not serve a stale seed page from an earlier seeded run.
  if (!seeded) io.removeStaleSeed();

  const url = tailnetUrl(io.tailnetStatus());

  // No `env`: the build inherits WORDCELL_APP_VERSION (scripts/app-version.mjs) for the G3 read.
  if (parsed.build) io.build();
  if (!io.hasDist()) throw new Error('device-preview: no dist/; run without --no-build');
  if (seeded) io.writeSeed(seedPage({ sessionJson, historyJson }));

  let stopping = false;
  const preview = io.spawnPreview(PORT);
  /** @type {Promise<void>} */
  const exited = new Promise((resolve) => {
    preview.on('exit', () => resolve());
  });
  preview.on('exit', (code) => {
    if (!stopping) {
      io.error(`device-preview: vite preview exited (${code}); is port ${PORT} taken?`);
      void stop(1);
    }
  });
  // Registered before the port wait and `serve`, so an early Ctrl+C still runs `stop()`.
  io.onSignal('SIGINT', () => void stop(0));
  io.onSignal('SIGTERM', () => void stop(0));
  io.onSignal('SIGHUP', () => void stop(0));

  try {
    await io.waitForPort(PORT, PORT_WAIT_MS);
  } catch (error) {
    // No share yet: stop the preview and wait for it to exit, then fail with the wait's own error.
    stopping = true;
    await killPreview();
    throw error;
  }

  // `serve --bg` prints an approval link and waits when Serve is not enabled on the tailnet.
  const serve = io.serve(PORT);
  if (serve.status !== 0) {
    io.error(`${serve.stdout ?? ''}${serve.stderr ?? ''}`);
    io.error('device-preview: tailscale serve failed; approve the link above, then rerun');
    await stop(1);
    return;
  }

  io.log(['', ...hintLines(url, parsed), ''].join('\n'));

  /** @param {number} code */
  async function stop(code) {
    stopping = true;
    io.serveOff();
    await killPreview();
    io.exit(code);
  }

  /** SIGTERM, then SIGKILL if the preview has not exited after KILL_GRACE_MS; resolves on exit. */
  async function killPreview() {
    preview.kill('SIGTERM');
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    const graceOver = new Promise((resolve) => {
      timer = setTimeout(() => resolve(true), KILL_GRACE_MS);
    });
    const timedOut = await Promise.race([exited.then(() => false), graceOver]);
    clearTimeout(timer);
    if (timedOut) {
      io.error(`device-preview: vite preview ignored SIGTERM for ${KILL_GRACE_MS} ms; SIGKILL`);
      preview.kill('SIGKILL');
      await exited;
    }
  }
}

/** @type {string | undefined} */
let tailscale;
/** The Tailscale CLI, found once, on first use. */
const ts = () => {
  tailscale ??= tailscaleBin();
  return tailscale;
};

/** @type {Io} */
const realIo = {
  readFixture: (name) => readFileSync(join('fixtures', `${name}.json`), 'utf8'),
  portOpen,
  removeStaleSeed: () => rmSync('dist/seed.html', { force: true }),
  tailnetStatus: () => execFileSync(ts(), ['status', '--json'], { encoding: 'utf8' }),
  build: () => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  },
  hasDist: () => existsSync('dist/index.html'),
  writeSeed: (html) => writeFileSync('dist/seed.html', html),
  spawnPreview: (port) =>
    spawn(
      join('node_modules', '.bin', 'vite'),
      ['preview', '--port', String(port), '--strictPort'],
      {
        // Vite's host check rejects the tailnet name otherwise.
        env: { ...process.env, __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: '.ts.net' },
        stdio: ['ignore', 'inherit', 'inherit'],
      },
    ),
  onSignal: (signal, handler) => {
    process.on(signal, handler);
  },
  waitForPort,
  serve: (port) =>
    spawnSync(ts(), ['serve', '--bg', String(port)], { encoding: 'utf8', timeout: 20_000 }),
  serveOff: () => {
    spawnSync(ts(), ['serve', '--https=443', 'off'], { stdio: 'ignore', timeout: 20_000 });
  },
  log: (text) => console.log(text),
  error: (text) => console.error(text),
  exit: (code) => process.exit(code),
};

/**
 * Whether something listens on localhost:port right now.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function portOpen(port) {
  return new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1');
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

/**
 * Resolves once something listens on localhost:port; throws after timeoutMs.
 * @param {number} port
 * @param {number} timeoutMs
 */
async function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await portOpen(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`device-preview: nothing listening on port ${port} after ${timeoutMs} ms`);
}

function main() {
  return run(process.argv.slice(2), realIo);
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
