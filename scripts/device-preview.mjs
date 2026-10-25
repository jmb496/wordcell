// @ts-check
// Owner device reads on a real phone (docs/device-testing.md): builds the hook-free `dist/`, writes
// an optional one-tap seed page into it (never into `public/`, so it never ships), serves it with
// `vite preview` on 4173 and shares that over HTTPS inside the owner's tailnet with
// `tailscale serve`, so the phone gets a secure context (service worker, install) without USB or
// chrome://inspect. Ctrl+C turns the share off and stops the preview. Fails fast (rule 6) when
// Tailscale is missing, Serve is not enabled on the tailnet, or port 4173 is taken.
// Usage: node scripts/device-preview.mjs [fixture] [--no-build]
//   fixture: a `fixtures/session-*.json` name without `.json` (e.g. session-won-words); the phone
//   then opens `/seed.html`, which stores it as `wordcell:session` and opens the app.
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import { join } from 'node:path';

const PORT = 4173;
const SESSION_KEY = 'wordcell:session';

/**
 * The seed page: unregisters any service worker of the origin, stores the Session and opens the app.
 * @param {string} sessionJson
 * @returns {string}
 */
export function seedPage(sessionJson) {
  const session = JSON.stringify(JSON.parse(sessionJson));
  return (
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
    '<title>Seed</title><p>Loading the seeded game…</p><script>(async () => {' +
    'for (const r of (await navigator.serviceWorker?.getRegistrations?.()) ?? []) await r.unregister();' +
    `localStorage.setItem(${JSON.stringify(SESSION_KEY)}, ${JSON.stringify(session)});` +
    "location.replace('/');})();</script>\n"
  );
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
  const args = process.argv.slice(2);
  const build = !args.includes('--no-build');
  const fixture = args.find((a) => !a.startsWith('--'));
  const ts = tailscaleBin();
  const url = tailnetUrl(execFileSync(ts, ['status', '--json'], { encoding: 'utf8' }));

  if (build) execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (!existsSync('dist/index.html'))
    throw new Error('device-preview: no dist/; run without --no-build');
  if (fixture !== undefined) {
    const path = join('fixtures', `${fixture}.json`);
    writeFileSync('dist/seed.html', seedPage(readFileSync(path, 'utf8')));
  }

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

  console.log(
    `\nOn the phone (Tailscale connected): ${url}/${fixture === undefined ? '' : 'seed.html'}`,
  );
  console.log('After a new build, clear the site data on the phone first. Ctrl+C stops.\n');
  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));

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
