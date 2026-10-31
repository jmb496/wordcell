// @ts-check
// Owner device reads on a real phone (docs/device-testing.md, CAP-7): builds the hook-free `dist/`,
// writes an optional one-tap seed page into it (never into `public/`, so it never ships, F9), serves
// it with `vite preview` on 4173 and shares that over HTTPS inside the owner's tailnet with
// `tailscale serve`, so the phone gets a secure context (service worker, install) without USB or
// chrome://inspect. Ctrl+C turns the share off and stops the preview. Fails fast (rule 6) on a
// usage error, a missing or non-JSON fixture, when Tailscale is missing, Serve is not enabled on
// the tailnet, or port 4173 is taken.
// Usage: node scripts/device-preview.mjs [session-fixture] [--history <history-fixture>] [--no-build]
//   session-fixture: a `fixtures/session-*.json` name without `.json` (e.g. session-won-words);
//   --history: a `fixtures/history-*.json` name without `.json` (e.g. history-invalid-null).
//   With either, the phone opens `/seed.html`, which stores them as `wordcell:session` /
//   `wordcell:history` and opens the app. A worker controlling the origin answers `/seed.html`
//   with the app, so clear the origin's site data before a seed (docs/device-testing.md).
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import { join } from 'node:path';

const PORT = 4173;
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

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  /** @param {string | undefined} name */
  const readFixture = (name) => {
    if (name === undefined) return undefined;
    const json = readFileSync(join('fixtures', `${name}.json`), 'utf8');
    JSON.parse(json); // fail fast, before any Tailscale or build output (rule 6)
    return json;
  };
  const sessionJson = readFixture(parsed.session);
  const historyJson = readFixture(parsed.history);
  const seeded = sessionJson !== undefined || historyJson !== undefined;
  // A `--no-build` run must not serve a stale seed page from an earlier seeded run.
  if (!seeded) rmSync('dist/seed.html', { force: true });

  const ts = tailscaleBin();
  const url = tailnetUrl(execFileSync(ts, ['status', '--json'], { encoding: 'utf8' }));

  // No `env`: the build inherits WORDCELL_APP_VERSION (scripts/app-version.mjs) for the G3 read.
  if (parsed.build) execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (!existsSync('dist/index.html'))
    throw new Error('device-preview: no dist/; run without --no-build');
  if (seeded) writeFileSync('dist/seed.html', seedPage({ sessionJson, historyJson }));

  const preview = spawn(
    join('node_modules', '.bin', 'vite'),
    ['preview', '--port', String(PORT), '--strictPort'],
    {
      // Vite's host check rejects the tailnet name otherwise.
      env: { ...process.env, __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: '.ts.net' },
      stdio: ['ignore', 'inherit', 'inherit'],
    },
  );
  preview.on('exit', (code) => {
    if (!stopping) {
      console.error(`device-preview: vite preview exited (${code}); is port ${PORT} taken?`);
      stop(1);
    }
  });
  // Registered before the port wait and `serve`, so an early Ctrl+C still runs `stop()`.
  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));

  await waitForPort(PORT, 15_000);

  // `serve --bg` prints an approval link and waits when Serve is not enabled on the tailnet.
  const serve = spawnSync(ts, ['serve', '--bg', String(PORT)], {
    encoding: 'utf8',
    timeout: 20_000,
  });
  if (serve.status !== 0) {
    console.error(`${serve.stdout ?? ''}${serve.stderr ?? ''}`);
    console.error('device-preview: tailscale serve failed; approve the link above, then rerun');
    stop(1);
    return;
  }

  console.log(['', ...hintLines(url, parsed), ''].join('\n'));

  /** @param {number} code */
  function stop(code) {
    stopping = true;
    spawnSync(ts, ['serve', '--https=443', 'off'], { stdio: 'ignore', timeout: 20_000 });
    preview.kill();
    process.exit(code);
  }
}

let stopping = false;

/**
 * Resolves once something listens on localhost:port; throws after timeoutMs.
 * @param {number} port
 * @param {number} timeoutMs
 */
async function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const open = await new Promise((resolve) => {
      const socket = connect(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.end();
        resolve(true);
      });
      socket.once('error', () => resolve(false));
    });
    if (open) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`device-preview: nothing listening on port ${port} after ${timeoutMs} ms`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
