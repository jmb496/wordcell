// @ts-check
// AD-18 Deploy checks (ticket 1.11): `verify` checks dist/ before the deploy; `post-deploy <log>`
// extracts the workers.dev URL from the wrangler log and checks the deployed site's index,
// cache headers and 404s. Also exports the pre-deploy config validators for `public/_headers`,
// `public/.assetsignore` and `wrangler.jsonc` (tested by scripts/deploy-config.test.mjs).
// Usage: node scripts/deploy-check.mjs verify | post-deploy <wrangler log path> (dist/ resolved
// against cwd). Test-only env DEPLOY_CHECK_BASE_URL replaces the extracted URL; no workflow sets it.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export const IMMUTABLE = 'public, max-age=31536000, immutable';
export const USER_AGENT = 'wordcell-deploy-check';
const MAX_REDIRECTS = 5;

/** AD-18 `_headers` rules: path → Cache-Control value. */
export const HEADER_RULES = /** @type {const} */ ({
  '/assets/*': IMMUTABLE,
  '/': 'no-cache',
  '/index.html': 'no-cache',
  '/sw.js': 'no-cache',
  '/manifest.webmanifest': 'no-cache',
});

/** Files `verify` requires, dist-relative. */
export const REQUIRED_FILES = [
  'index.html',
  '_headers',
  '.assetsignore',
  'sw.js',
  'manifest.webmanifest',
  '.vite/manifest.json',
];

/** RFC 7230 token (header field name). */
const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/**
 * @typedef {{ status: number, cacheControl: string[], cacheControlLines: string[], location: string | undefined, body: Buffer }} Response
 *   cacheControl: trimmed values of every `cache-control` line; cacheControlLines: `Name: value`
 * @typedef {{ first: Response | undefined, final: Response | undefined, error: string | undefined }} RequestResult
 * @typedef {{ info: (line: string) => void, error: (line: string) => void }} Log
 */

/**
 * Validates `_headers` text against AD-18's five rules exactly (ticket 1.11 grammar).
 * @param {string} text
 * @returns {string[]} errors, empty when valid
 */
export function validateHeaders(text) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Map<string, Map<string, string>>} path → lowercase header name → value */
  const rules = new Map();
  /** @type {Map<string, string> | undefined} */
  let current;
  let currentPath = '';
  text.split('\n').forEach((raw, index) => {
    const line = raw.trimEnd();
    const at = `_headers line ${index + 1}`;
    if (line.trim() === '') return;
    if (line.startsWith('/')) {
      if (rules.has(line)) {
        errors.push(`${at}: duplicate path ${line}`);
        current = new Map(); // its headers are not checked again
        currentPath = line;
        return;
      }
      current = new Map();
      currentPath = line;
      rules.set(line, current);
      return;
    }
    if (!/^[ \t]/.test(line)) {
      errors.push(`${at}: not a path or an indented header: ${JSON.stringify(line)}`);
      return;
    }
    if (current === undefined) {
      errors.push(`${at}: header before any path: ${JSON.stringify(line)}`);
      return;
    }
    const colon = line.indexOf(':');
    const name = colon === -1 ? '' : line.slice(0, colon).trim();
    const value = colon === -1 ? '' : line.slice(colon + 1).trim();
    if (!TOKEN.test(name) || value === '') {
      errors.push(`${at}: not a "Name: value" header: ${JSON.stringify(line)}`);
      return;
    }
    const key = name.toLowerCase();
    if (current.has(key)) {
      errors.push(`${at}: duplicate header ${name} for ${currentPath}`);
      return;
    }
    current.set(key, value);
  });
  for (const [path, expected] of Object.entries(HEADER_RULES)) {
    const headers = rules.get(path);
    if (headers === undefined) {
      errors.push(`_headers: missing path ${path}`);
      continue;
    }
    for (const [name, value] of headers) {
      if (name !== 'cache-control') errors.push(`_headers: ${path} has extra header ${name}`);
      else if (value !== expected) {
        errors.push(
          `_headers: ${path} Cache-Control is ${JSON.stringify(value)}, expected ${JSON.stringify(expected)}`,
        );
      }
    }
    if (!headers.has('cache-control')) errors.push(`_headers: ${path} has no Cache-Control`);
  }
  for (const path of rules.keys()) {
    if (!Object.hasOwn(HEADER_RULES, path)) errors.push(`_headers: extra path ${path}`);
  }
  return errors;
}

/**
 * `.assetsignore` has exactly one non-blank line, `.vite` (trailing whitespace/CR trimmed).
 * @param {string} text
 * @returns {string[]} errors
 */
export function validateAssetsignore(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
  if (lines.length === 1 && lines[0] === '.vite') return [];
  return [`.assetsignore: expected exactly one line ".vite", got ${JSON.stringify(lines)}`];
}

/**
 * The pinned wrangler's `DEFAULT_COMPAT_DATE`, read from `wrangler-dist/cli.js` text (retro P3).
 * @param {string} cliText
 */
export function readDefaultCompatDate(cliText) {
  const values = new Set(
    [...cliText.matchAll(/DEFAULT_COMPAT_DATE = "(\d{4}-\d{2}-\d{2})"/g)].map((match) => match[1]),
  );
  if (values.size !== 1) {
    throw new Error(
      `deploy-check: expected exactly one DEFAULT_COMPAT_DATE in wrangler cli.js, found ${JSON.stringify([...values])}`,
    );
  }
  return [...values][0];
}

/** @param {string} value */
function isCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Validates `wrangler.jsonc` (strict JSON: a comment or trailing comma fails) against AD-18.
 * @param {string} text wrangler.jsonc
 * @param {string} cliText node_modules/wrangler/wrangler-dist/cli.js
 * @returns {string[]} errors
 */
export function validateWrangler(text, cliText) {
  const defaultDate = readDefaultCompatDate(cliText);
  /** @type {unknown} */
  let config;
  try {
    config = JSON.parse(text);
  } catch (error) {
    return [`wrangler.jsonc: not strict JSON: ${/** @type {Error} */ (error).message}`];
  }
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    return ['wrangler.jsonc: not an object'];
  }
  const c = /** @type {Record<string, unknown>} */ (config);
  /** @type {string[]} */
  const errors = [];
  const keys = Object.keys(c).sort();
  const expectedKeys = ['assets', 'compatibility_date', 'name', 'preview_urls', 'workers_dev'];
  if (!isDeepStrictEqual(keys, expectedKeys)) {
    errors.push(
      `wrangler.jsonc: keys ${JSON.stringify(keys)}, expected ${JSON.stringify(expectedKeys)}`,
    );
  }
  if (c.name !== 'wordcell')
    errors.push(`wrangler.jsonc: name ${JSON.stringify(c.name)}, expected "wordcell"`);
  if (c.workers_dev !== true)
    errors.push(`wrangler.jsonc: workers_dev ${JSON.stringify(c.workers_dev)}, expected true`);
  if (c.preview_urls !== false)
    errors.push(`wrangler.jsonc: preview_urls ${JSON.stringify(c.preview_urls)}, expected false`);
  if (!isDeepStrictEqual(c.assets, { directory: './dist' })) {
    errors.push(
      `wrangler.jsonc: assets ${JSON.stringify(c.assets)}, expected {"directory":"./dist"}`,
    );
  }
  const date = c.compatibility_date;
  if (typeof date !== 'string' || !isCalendarDate(date)) {
    errors.push(
      `wrangler.jsonc: compatibility_date ${JSON.stringify(date)} is not a YYYY-MM-DD date`,
    );
  } else if (date > defaultDate) {
    errors.push(
      `wrangler.jsonc: compatibility_date ${date} is later than the pinned wrangler's DEFAULT_COMPAT_DATE ${defaultDate}`,
    );
  }
  return errors;
}

/**
 * Code-point order (UTF-8 byte order), not locale or bash glob order (ticket 1.11).
 * @param {string} a
 * @param {string} b
 */
const byCodePoint = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));

/**
 * The asset globs `verify` counts and `post-deploy` checks, each list code-point sorted.
 * @param {string} distDir
 */
export function distAssets(distDir) {
  const dir = join(distDir, 'assets');
  const files = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort(byCodePoint)
    : [];
  const js = files.filter((name) => name.endsWith('.js'));
  const dictionary = files.filter((name) => name.startsWith('en-') && name.endsWith('.txt'));
  const woff2 = files.filter((name) => name.endsWith('.woff2'));
  /** @type {string[]} */
  const errors = [];
  if (js.length === 0) errors.push('verify dist: dist/assets/ has no *.js file');
  for (const [glob, matches] of /** @type {const} */ ([
    ['en-*.txt', dictionary],
    ['*.woff2', woff2],
  ])) {
    if (matches.length !== 1) {
      errors.push(
        `verify dist: expected exactly one dist/assets/${glob}, found ${matches.length}: ${JSON.stringify(matches)}`,
      );
    }
  }
  return { js, dictionary, woff2, errors };
}

/**
 * Checks dist/ before a deploy and returns every failure (empty when it passes).
 * @param {string} distDir
 * @returns {string[]}
 */
export function verifyDist(distDir) {
  /** @type {string[]} */
  const errors = [];
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(distDir, file))) errors.push(`verify dist: dist/${file} is missing`);
  }
  errors.push(...distAssets(distDir).errors);
  const headers = join(distDir, '_headers');
  if (existsSync(headers)) {
    for (const error of validateHeaders(readFileSync(headers, 'utf8'))) {
      errors.push(`verify dist: dist/${error}`);
    }
  }
  const ignore = join(distDir, '.assetsignore');
  if (existsSync(ignore)) {
    for (const error of validateAssetsignore(readFileSync(ignore, 'utf8'))) {
      errors.push(`verify dist: dist/${error}`);
    }
  }
  return errors;
}

/**
 * The first `https://wordcell.<subdomain>.workers.dev` in the wrangler log.
 * @param {string} log
 */
export function extractBaseUrl(log) {
  const match = /https:\/\/wordcell\.[^/ \n]+\.workers\.dev/.exec(log);
  if (match === null) {
    throw new Error(
      'post-deploy check: no https://wordcell.<subdomain>.workers.dev URL in the wrangler log',
    );
  }
  return match[0];
}

/**
 * Test-only `DEPLOY_CHECK_BASE_URL`: undefined when unset or empty, else an http(s) origin.
 * @param {string | undefined} value
 */
export function baseUrlOverride(value) {
  if (value === undefined || value === '') return undefined;
  const url = URL.canParse(value) ? new URL(value) : undefined;
  if (url === undefined || !['http:', 'https:'].includes(url.protocol) || url.origin !== value) {
    throw new Error(
      `post-deploy check: DEPLOY_CHECK_BASE_URL ${JSON.stringify(value)} is not an http(s) origin without path or trailing slash`,
    );
  }
  return value;
}

/**
 * @param {string} protocol URL protocol, e.g. `https:`
 * @returns {typeof http | typeof https}
 */
export function clientFor(protocol) {
  if (protocol === 'http:') return http;
  if (protocol === 'https:') return https;
  throw new Error(`deploy-check: unsupported protocol ${protocol}`);
}

/**
 * One request without redirect handling.
 * @param {URL} url
 * @param {string} method
 * @param {AbortSignal} signal
 * @returns {Promise<Response>}
 */
function requestOnce(url, method, signal) {
  return new Promise((resolvePromise, reject) => {
    const req = clientFor(url.protocol).request(url, {
      method,
      agent: false,
      headers: { 'User-Agent': USER_AGENT },
    });
    const onAbort = () => {
      reject(signal.reason);
      req.destroy(signal.reason);
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    req.on('error', reject);
    req.on('close', () => signal.removeEventListener('abort', onAbort));
    req.on('response', (res) => {
      /** @type {Buffer[]} */
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => {
        /** @type {string[]} */
        const cacheControl = [];
        /** @type {string[]} */
        const cacheControlLines = [];
        for (let i = 0; i < res.rawHeaders.length; i += 2) {
          if (res.rawHeaders[i].toLowerCase() !== 'cache-control') continue;
          const value = res.rawHeaders[i + 1].trim();
          cacheControl.push(value);
          cacheControlLines.push(`${res.rawHeaders[i]}: ${value}`);
        }
        resolvePromise({
          status: res.statusCode ?? 0,
          cacheControl,
          cacheControlLines,
          location: res.headers.location,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.end();
  });
}

/**
 * A request whose timeout covers the body and any redirects (curl `--max-time`). With
 * `followRedirects`, follows at most 5 redirects (`Location` resolved against the request URL);
 * a 6th redirect, a redirect without `Location` or a non-http(s) target is an error. Errors and
 * timeouts are returned, not thrown: each is a failed attempt (ticket 1.11).
 * @param {string} url
 * @param {{ method: 'GET' | 'HEAD', timeoutMs: number, followRedirects: boolean }} options
 * @returns {Promise<RequestResult>}
 */
export async function request(url, { method, timeoutMs, followRedirects }) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`timed out after ${timeoutMs} ms`)),
    timeoutMs,
  );
  /** @type {Response | undefined} */
  let first;
  try {
    let current = new URL(url);
    for (let redirects = 0; ; redirects++) {
      const response = await requestOnce(current, method, controller.signal);
      first ??= response;
      if (!followRedirects || response.status < 300 || response.status > 399) {
        return { first, final: response, error: undefined };
      }
      if (response.location === undefined) {
        return { first, final: response, error: `${response.status} redirect without Location` };
      }
      if (redirects === MAX_REDIRECTS) {
        return { first, final: response, error: `more than ${MAX_REDIRECTS} redirects` };
      }
      current = new URL(response.location, current);
    }
  } catch (error) {
    return { first, final: undefined, error: /** @type {Error} */ (error).message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {RequestResult} result
 */
function describe(result) {
  const cc = result.final?.cacheControl ?? [];
  const error = result.error === undefined ? '' : `error: ${result.error}, `;
  return `${error}status ${result.final?.status ?? '(none)'}, ${cc.length} cache-control line(s): ${cc.length === 0 ? '(none)' : cc.join('|')}`;
}

/**
 * Deployed-site checks, ported from deploy.yml `post-deploy check` (tickets 1.9, 1.11). Runs
 * verify's asset globs before any request. Returns false when a check ran out of attempts.
 * @param {{ distDir: string, baseUrl: string, attempts: { index: number, check: number }, delayMs: number, timeoutMs: number, log: Log }} options
 * @returns {Promise<boolean>}
 */
export async function postDeploy({ distDir, baseUrl, attempts, delayMs, timeoutMs, log }) {
  const assets = distAssets(distDir);
  if (assets.errors.length > 0) {
    for (const error of assets.errors) log.error(`post-deploy check: ${error}`);
    return false;
  }
  const index = readFileSync(join(distDir, 'index.html'));

  /**
   * @typedef {{ ok: boolean, expected: string, got: string }} CheckResult
   * @param {number} max
   * @param {string} url
   * @param {() => Promise<CheckResult>} check
   */
  const attemptLoop = async (max, url, check) => {
    /** @type {CheckResult | undefined} */
    let result;
    for (let i = 1; i <= max; i++) {
      result = await check();
      if (result.ok) {
        log.info(`ok: ${url} (${result.expected})`);
        return true;
      }
      log.error(
        `attempt ${i}/${max} failed: ${url} expected ${result.expected}; got ${result.got}`,
      );
      if (i < max) await sleep(delayMs);
    }
    log.error(`post-deploy check failed after ${max} attempts: ${url}`);
    log.error(`  expected: ${result?.expected}`);
    log.error(`  last response: ${result?.got}`);
    return false;
  };

  /** @param {string} url */
  const checkIndex = async (url) => {
    const expected = '200 and body byte-identical to dist/index.html';
    const result = await request(url, { method: 'GET', timeoutMs, followRedirects: false });
    const final = result.final;
    if (result.error === undefined && final?.status === 200 && final.body.equals(index)) {
      return { ok: true, expected, got: '' };
    }
    const body =
      final === undefined
        ? 'no body'
        : `body ${final.body.length} bytes, sha256 ${createHash('sha256').update(final.body).digest('hex')}`;
    const error = result.error === undefined ? '' : `error: ${result.error}, `;
    return { ok: false, expected, got: `${error}status ${final?.status ?? '(none)'}, ${body}` };
  };

  /** @param {string} url @param {string} value @param {boolean} followRedirects */
  const checkCache = async (url, value, followRedirects) => {
    const expected = `200 with exactly one cache-control: ${value}`;
    const result = await request(url, { method: 'HEAD', timeoutMs, followRedirects });
    if (followRedirects) {
      const first = result.first;
      const firstCc =
        first === undefined || first.cacheControlLines.length === 0
          ? '(none)'
          : first.cacheControlLines.join('|');
      log.info(`info: ${url} first response status ${first?.status ?? '(none)'}, ${firstCc}`);
    }
    const final = result.final;
    const ok =
      result.error === undefined &&
      final?.status === 200 &&
      final.cacheControl.length === 1 &&
      final.cacheControl[0] === value;
    return { ok, expected, got: describe(result) };
  };

  /** @param {string} url @param {number} status */
  const checkStatus = async (url, status) => {
    const expected = `status ${status}`;
    const result = await request(url, { method: 'HEAD', timeoutMs, followRedirects: false });
    const ok = result.error === undefined && result.final?.status === status;
    return { ok, expected, got: describe(result) };
  };

  const root = `${baseUrl}/`;
  if (!(await attemptLoop(attempts.index, root, () => checkIndex(root)))) return false;

  // Check 1 (first JS asset), then the dictionary, then the font (ticket 1.11).
  /** @type {[string, string][]} */
  const immutable = [
    ['check 1', assets.js[0]],
    ['dictionary check', assets.dictionary[0]],
    ['woff2 check', assets.woff2[0]],
  ];
  for (const [label, asset] of immutable) {
    log.info(`asset for ${label}: ${asset}`);
    const url = `${baseUrl}/assets/${asset}`;
    if (!(await attemptLoop(attempts.check, url, () => checkCache(url, IMMUTABLE, false)))) {
      return false;
    }
  }
  for (const path of ['/', '/sw.js', '/manifest.webmanifest']) {
    const url = `${baseUrl}${path}`;
    if (!(await attemptLoop(attempts.check, url, () => checkCache(url, 'no-cache', false)))) {
      return false;
    }
  }
  const indexHtml = `${baseUrl}/index.html`;
  if (
    !(await attemptLoop(attempts.check, indexHtml, () => checkCache(indexHtml, 'no-cache', true)))
  ) {
    return false;
  }
  for (const path of [
    '/.vite/manifest.json',
    '/assets/does-not-exist.js',
    '/_headers',
    '/.assetsignore',
  ]) {
    const url = `${baseUrl}${path}`;
    if (!(await attemptLoop(attempts.check, url, () => checkStatus(url, 404)))) return false;
  }
  log.info('post-deploy check: all checks passed');
  return true;
}

const USAGE = 'usage: node scripts/deploy-check.mjs verify | post-deploy <wrangler log path>';

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const distDir = resolve(process.cwd(), 'dist');
  if (command === 'verify' && args.length === 0) {
    const errors = verifyDist(distDir);
    for (const error of errors) console.error(error);
    if (errors.length > 0) process.exitCode = 1;
    else console.log('verify dist: ok');
    return;
  }
  if (command === 'post-deploy') {
    if (args.length !== 1 || args[0] === '') {
      throw new Error(`post-deploy check: expected one wrangler log path argument; ${USAGE}`);
    }
    const logPath = args[0];
    /** @type {string} */
    let logText;
    try {
      logText = readFileSync(logPath, 'utf8');
    } catch (error) {
      throw new Error(`post-deploy check: cannot read wrangler log ${logPath}`, { cause: error });
    }
    let baseUrl = extractBaseUrl(logText);
    console.log(`deployed URL: ${baseUrl}`);
    const override = baseUrlOverride(process.env.DEPLOY_CHECK_BASE_URL);
    if (override !== undefined) {
      console.log(
        `DEPLOY_CHECK_BASE_URL set (test only): checking ${override} instead of ${baseUrl}`,
      );
      baseUrl = override;
    }
    const ok = await postDeploy({
      distDir,
      baseUrl,
      attempts: { index: 24, check: 3 },
      delayMs: 5000,
      timeoutMs: 10_000,
      log: { info: (line) => console.log(line), error: (line) => console.error(line) },
    });
    if (!ok) process.exitCode = 1;
    return;
  }
  throw new Error(
    `deploy-check: unknown subcommand ${JSON.stringify(process.argv.slice(2))}; ${USAGE}`,
  );
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
