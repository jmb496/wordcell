// @ts-check
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import {
  baseUrlOverride,
  clientFor,
  extractBaseUrl,
  IMMUTABLE,
  postDeploy,
  request,
  USER_AGENT,
  verifyDist,
} from './deploy-check.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
const script = fileURLToPath(new URL('./deploy-check.mjs', import.meta.url));
const HEADERS = readFileSync(join(repo, 'public/_headers'), 'utf8');
const INDEX = '<!doctype html><title>WordCell</title>\n';
const JS = ['index-b.js', 'chunk-a.js'];
const DICT = 'en-d.txt';
const FONT = 'wordcell-serif-c.woff2';

const tmp = mkdtempSync(join(tmpdir(), 'wordcell-deploy-check-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));
let dirCount = 0;

/**
 * Writes a temp dist/ that passes `verify`, with the given overrides.
 * @param {{ js?: string[], dict?: string[], woff2?: string[], omit?: string[], headers?: string, assetsignore?: string }} [options]
 * @returns {string} the dist directory
 */
function makeDist(options = {}) {
  const dist = join(tmp, `case-${dirCount++}`, 'dist');
  const files = {
    'index.html': INDEX,
    _headers: options.headers ?? HEADERS,
    '.assetsignore': options.assetsignore ?? '.vite\n',
    'sw.js': 'self;\n',
    'manifest.webmanifest': '{}\n',
    '.vite/manifest.json': '{}\n',
  };
  for (const asset of [
    ...(options.js ?? JS),
    ...(options.dict ?? [DICT]),
    ...(options.woff2 ?? [FONT]),
  ]) {
    files[/** @type {keyof typeof files} */ (`assets/${asset}`)] = asset;
  }
  for (const [path, text] of Object.entries(files)) {
    if (options.omit?.includes(path)) continue;
    mkdirSync(dirname(join(dist, path)), { recursive: true });
    writeFileSync(join(dist, path), text);
  }
  return dist;
}

/** @typedef {(req: http.IncomingMessage, res: http.ServerResponse) => void} Handler */

/**
 * @param {number} status
 * @param {Record<string, string | string[]>} [headers]
 * @param {string} [body]
 * @returns {Handler}
 */
const reply =
  (status, headers = {}, body = '') =>
  (req, res) => {
    res.writeHead(status, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  };

/** @type {http.Server[]} */
const servers = [];
afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((done) => {
          server.closeAllConnections();
          server.close(done);
        }),
    ),
  );
});

/**
 * A local stand-in for the deployed site (127.0.0.1, port 0) serving a good deploy of
 * `makeDist()`, with per-path overrides.
 * @param {Record<string, Handler>} [overrides]
 */
async function startSite(overrides = {}) {
  /** @type {Record<string, Handler>} */
  const routes = {
    '/': reply(200, { 'Cache-Control': 'no-cache' }, INDEX),
    '/index.html': reply(200, { 'Cache-Control': 'no-cache' }, INDEX),
    '/sw.js': reply(200, { 'Cache-Control': 'no-cache' }),
    '/manifest.webmanifest': reply(200, { 'Cache-Control': 'no-cache' }),
    '/assets/chunk-a.js': reply(200, { 'Cache-Control': IMMUTABLE }),
    '/assets/index-b.js': reply(200, { 'Cache-Control': IMMUTABLE }),
    [`/assets/${DICT}`]: reply(200, { 'Cache-Control': IMMUTABLE }),
    [`/assets/${FONT}`]: reply(200, { 'Cache-Control': IMMUTABLE }),
    ...overrides,
  };
  /** @type {string[]} */
  const requests = [];
  /** @type {(string | undefined)[]} */
  const agents = [];
  const server = http.createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    agents.push(req.headers['user-agent']);
    (routes[req.url ?? ''] ?? reply(404))(req, res);
  });
  servers.push(server);
  await new Promise((done) => server.listen(0, '127.0.0.1', () => done(undefined)));
  const address = /** @type {import('node:net').AddressInfo} */ (server.address());
  return { base: `http://127.0.0.1:${address.port}`, requests, agents };
}

/**
 * Runs postDeploy against a site with test timings; returns its log lines (`E ` = stderr).
 * @param {string} baseUrl
 * @param {{ distDir?: string, timeoutMs?: number }} [options]
 */
async function check(baseUrl, options = {}) {
  /** @type {string[]} */
  const lines = [];
  const ok = await postDeploy({
    distDir: options.distDir ?? makeDist(),
    baseUrl,
    attempts: { index: 2, check: 2 },
    delayMs: 0,
    timeoutMs: options.timeoutMs ?? 2000,
    log: { info: (line) => lines.push(line), error: (line) => lines.push(`E ${line}`) },
  });
  return { ok, lines };
}

/** @param {string} base */
const allOkLines = (base) => [
  `ok: ${base}/ (200 and body byte-identical to dist/index.html)`,
  'asset for check 1: chunk-a.js',
  `ok: ${base}/assets/chunk-a.js (200 with exactly one cache-control: ${IMMUTABLE})`,
  `asset for dictionary check: ${DICT}`,
  `ok: ${base}/assets/${DICT} (200 with exactly one cache-control: ${IMMUTABLE})`,
  `asset for woff2 check: ${FONT}`,
  `ok: ${base}/assets/${FONT} (200 with exactly one cache-control: ${IMMUTABLE})`,
  `ok: ${base}/ (200 with exactly one cache-control: no-cache)`,
  `ok: ${base}/sw.js (200 with exactly one cache-control: no-cache)`,
  `ok: ${base}/manifest.webmanifest (200 with exactly one cache-control: no-cache)`,
  `info: ${base}/index.html first response status 200, Cache-Control: no-cache`,
  `ok: ${base}/index.html (200 with exactly one cache-control: no-cache)`,
  `ok: ${base}/.vite/manifest.json (status 404)`,
  `ok: ${base}/assets/does-not-exist.js (status 404)`,
  `ok: ${base}/_headers (status 404)`,
  `ok: ${base}/.assetsignore (status 404)`,
  'post-deploy check: all checks passed',
];

/**
 * @param {{ ok: boolean, lines: string[] }} result
 * @param {string} url the check that ran out of attempts
 * @param {string} got substring of the last response
 */
function expectFailed(result, url, got) {
  expect(result.ok).toBe(false);
  const at = result.lines.indexOf(`E post-deploy check failed after 2 attempts: ${url}`);
  expect(at, result.lines.join('\n')).toBeGreaterThan(-1);
  expect(result.lines.slice(at + 1)).toHaveLength(2);
  expect(result.lines[at + 2]).toContain(got);
  expect(result.lines.filter((line) => line.startsWith('E attempt '))).toHaveLength(2);
}

describe('verifyDist', () => {
  it('AD-18 a complete dist with two *.js passes', () => {
    expect(verifyDist(makeDist())).toEqual([]);
  });

  it('AD-18 reports every failure: missing files and each glob count', () => {
    const dist = makeDist({
      js: [],
      dict: [],
      woff2: ['a.woff2', 'b.woff2'],
      omit: ['sw.js', '.vite/manifest.json'],
    });
    expect(verifyDist(dist)).toEqual([
      'verify dist: dist/sw.js is missing',
      'verify dist: dist/.vite/manifest.json is missing',
      'verify dist: dist/assets/ has no *.js file',
      'verify dist: expected exactly one dist/assets/en-*.txt, found 0: []',
      'verify dist: expected exactly one dist/assets/*.woff2, found 2: ["a.woff2","b.woff2"]',
    ]);
  });

  it('AD-18 two en-*.txt and zero *.woff2 fail naming the glob', () => {
    expect(verifyDist(makeDist({ dict: ['en-a.txt', 'en-b.txt'], woff2: [] }))).toEqual([
      'verify dist: expected exactly one dist/assets/en-*.txt, found 2: ["en-a.txt","en-b.txt"]',
      'verify dist: expected exactly one dist/assets/*.woff2, found 0: []',
    ]);
  });

  it('AD-18 each required file missing fails naming it', () => {
    for (const file of [
      'index.html',
      '_headers',
      '.assetsignore',
      'sw.js',
      'manifest.webmanifest',
      '.vite/manifest.json',
    ]) {
      expect(verifyDist(makeDist({ omit: [file] }))).toEqual([
        `verify dist: dist/${file} is missing`,
      ]);
    }
  });

  it('AD-18 validates the dist copies of _headers and .assetsignore', () => {
    const dist = makeDist({
      headers: HEADERS.replace('/sw.js\n  Cache-Control: no-cache\n', ''),
      assetsignore: '.vite\nextra\n',
    });
    expect(verifyDist(dist)).toEqual([
      'verify dist: dist/_headers: missing path /sw.js',
      'verify dist: dist/.assetsignore: expected exactly one line ".vite", got [".vite","extra"]',
    ]);
  });
});

describe('extractBaseUrl and baseUrlOverride', () => {
  it('AD-18 the first workers.dev URL in the wrangler log', () => {
    const log =
      'Uploaded wordcell\nDeployed wordcell triggers\n  https://wordcell.jared.workers.dev\n' +
      'https://wordcell.other.workers.dev/path\n';
    expect(extractBaseUrl(log)).toBe('https://wordcell.jared.workers.dev');
    expect(extractBaseUrl('x https://wordcell.a.workers.dev/y')).toBe(
      'https://wordcell.a.workers.dev',
    );
  });

  it('AD-18 no workers.dev URL throws', () => {
    for (const log of [
      '',
      'https://example.com',
      'http://wordcell.a.workers.dev',
      'https://other.a.workers.dev',
    ]) {
      expect(() => extractBaseUrl(log)).toThrow('no https://wordcell.<subdomain>.workers.dev URL');
    }
  });

  it('AD-18 DEPLOY_CHECK_BASE_URL must be an http(s) origin', () => {
    expect(baseUrlOverride(undefined)).toBeUndefined();
    expect(baseUrlOverride('')).toBeUndefined();
    expect(baseUrlOverride('http://127.0.0.1:4173')).toBe('http://127.0.0.1:4173');
    expect(baseUrlOverride('https://example.com')).toBe('https://example.com');
    for (const value of [
      'http://127.0.0.1:4173/',
      'https://example.com/x',
      'ftp://example.com',
      'example.com',
      'http://host?x=1',
      'http://host#f',
      'http://u:p@host',
    ]) {
      expect(() => baseUrlOverride(value)).toThrow('is not an http(s) origin');
    }
  });

  it('AD-18 clientFor maps http: and https: and rejects others', () => {
    expect(clientFor('http:')).toBe(http);
    expect(clientFor('https:')).toBe(https);
    expect(() => clientFor('ftp:')).toThrow('unsupported protocol ftp:');
  });
});

describe('postDeploy', () => {
  it('AD-18 a good deploy passes every check in order, with the fixed User-Agent', async () => {
    const site = await startSite();
    const result = await check(site.base);
    expect(result).toEqual({ ok: true, lines: allOkLines(site.base) });
    expect(site.requests).toEqual([
      'GET /',
      'HEAD /assets/chunk-a.js',
      `HEAD /assets/${DICT}`,
      `HEAD /assets/${FONT}`,
      'HEAD /',
      'HEAD /sw.js',
      'HEAD /manifest.webmanifest',
      'HEAD /index.html',
      'HEAD /.vite/manifest.json',
      'HEAD /assets/does-not-exist.js',
      'HEAD /_headers',
      'HEAD /.assetsignore',
    ]);
    expect(new Set(site.agents)).toEqual(new Set([USER_AGENT]));
  });

  it('AD-18 lowercase cache-control name passes', async () => {
    const site = await startSite({ '/sw.js': reply(200, { 'cache-control': 'no-cache' }) });
    expect((await check(site.base)).ok).toBe(true);
  });

  it('AD-18 wrong or duplicated cache-control on the woff2 fails', async () => {
    const url = `/assets/${FONT}`;
    const wrong = await startSite({ [url]: reply(200, { 'Cache-Control': 'no-cache' }) });
    expectFailed(
      await check(wrong.base),
      `${wrong.base}${url}`,
      '1 cache-control line(s): no-cache',
    );
    const twice = await startSite({
      [url]: reply(200, { 'Cache-Control': [IMMUTABLE, IMMUTABLE] }),
    });
    expectFailed(await check(twice.base), `${twice.base}${url}`, '2 cache-control line(s)');
  });

  it('AD-18 wrong or duplicated cache-control on the dictionary fails', async () => {
    const url = `/assets/${DICT}`;
    const wrong = await startSite({
      [url]: reply(200, { 'Cache-Control': 'public, max-age=3600' }),
    });
    expectFailed(await check(wrong.base), `${wrong.base}${url}`, 'public, max-age=3600');
    const twice = await startSite({
      [url]: reply(200, { 'Cache-Control': [IMMUTABLE, 'no-cache'] }),
    });
    expectFailed(await check(twice.base), `${twice.base}${url}`, '2 cache-control line(s)');
  });

  it('AD-18 a redirect on a no-cache check is not followed and fails', async () => {
    const site = await startSite({
      '/sw.js': reply(302, { Location: '/sw-final.js', 'Cache-Control': 'no-cache' }),
      '/sw-final.js': reply(200, { 'Cache-Control': 'no-cache' }),
    });
    expectFailed(await check(site.base), `${site.base}/sw.js`, 'status 302');
    expect(site.requests).not.toContain('HEAD /sw-final.js');
  });

  it('AD-18 /index.html: 307 then a final response without no-cache fails; with it passes', async () => {
    const isolated = await startSite({
      '/index.html': reply(307, { Location: 'final.html' }),
      '/final.html': reply(200, { 'Cache-Control': 'max-age=60' }),
    });
    const failed = await check(isolated.base);
    expectFailed(failed, `${isolated.base}/index.html`, '1 cache-control line(s): max-age=60');
    expect(failed.lines).toContain(
      `info: ${isolated.base}/index.html first response status 307, (none)`,
    );
    const good = await startSite({
      '/index.html': reply(307, { Location: '/final.html', 'Cache-Control': 'private' }),
      '/final.html': reply(200, { 'Cache-Control': 'no-cache' }),
    });
    const passed = await check(good.base);
    expect(passed.ok).toBe(true);
    expect(passed.lines).toContain(
      `info: ${good.base}/index.html first response status 307, Cache-Control: private`,
    );
  });

  /**
   * /index.html → /r1 → … → /r<n> (200 no-cache): n redirects.
   * @param {number} n
   */
  function chain(n) {
    /** @type {Record<string, Handler>} */
    const routes = { '/index.html': reply(301, { Location: n === 1 ? '/end' : 'r1' }) };
    for (let i = 1; i < n; i++)
      routes[`/r${i}`] = reply(308, { Location: i + 1 === n ? '/end' : `r${i + 1}` });
    routes['/end'] = reply(200, { 'Cache-Control': 'no-cache' });
    return routes;
  }

  it('AD-18 /index.html: 5 redirects pass, a 6th fails', async () => {
    const five = await startSite(chain(5));
    expect((await check(five.base)).ok).toBe(true);
    const six = await startSite(chain(6));
    expectFailed(await check(six.base), `${six.base}/index.html`, 'more than 5 redirects');
  });

  it('AD-18 /index.html: a 3xx without Location or to a non-http(s) URL fails', async () => {
    const bare = await startSite({ '/index.html': reply(302) });
    expectFailed(
      await check(bare.base),
      `${bare.base}/index.html`,
      '302 redirect without Location',
    );
    const ftp = await startSite({ '/index.html': reply(302, { Location: 'ftp://127.0.0.1/x' }) });
    expectFailed(await check(ftp.base), `${ftp.base}/index.html`, 'unsupported protocol ftp:');
  });

  it('AD-18 /index.html: any 3xx with Location is followed (300 to a no-cache 200 passes)', async () => {
    const site = await startSite({
      '/index.html': reply(300, { Location: '/final.html' }),
      '/final.html': reply(200, { 'Cache-Control': 'no-cache' }),
    });
    expect((await check(site.base)).ok).toBe(true);
    expect(site.requests).toContain('HEAD /final.html');
  });

  it('AD-18 the index wait does not follow a redirect', async () => {
    const site = await startSite({ '/': reply(302, { Location: '/index.html' }, INDEX) });
    expectFailed(await check(site.base), `${site.base}/`, 'status 302');
    expect(site.requests).toEqual(['GET /', 'GET /']);
  });

  it('AD-18 a 404 check does not follow a redirect', async () => {
    const site = await startSite({ '/_headers': reply(301, { Location: '/missing' }) });
    expectFailed(await check(site.base), `${site.base}/_headers`, 'status 301');
    expect(site.requests).not.toContain('HEAD /missing');
  });

  it('AD-18 a 200 where 404 is expected fails', async () => {
    const site = await startSite({ '/_headers': reply(200) });
    expectFailed(await check(site.base), `${site.base}/_headers`, 'status 200');
  });

  it('AD-18 an index body mismatch fails the index wait', async () => {
    const site = await startSite({ '/': reply(200, {}, `${INDEX} `) });
    const result = await check(site.base);
    expectFailed(result, `${site.base}/`, `status 200, body ${INDEX.length + 1} bytes, sha256 `);
    expect(site.requests).toEqual(['GET /', 'GET /']);
  });

  it('AD-18 a server that never responds times out each attempt', async () => {
    const site = await startSite({ '/assets/chunk-a.js': () => {} });
    const result = await check(site.base, { timeoutMs: 100 });
    expectFailed(result, `${site.base}/assets/chunk-a.js`, 'error: timed out after 100 ms');
  });

  it('AD-18 a refused connection fails each attempt', async () => {
    const server = http.createServer();
    await new Promise((done) => server.listen(0, '127.0.0.1', () => done(undefined)));
    const { port } = /** @type {import('node:net').AddressInfo} */ (server.address());
    await new Promise((done) => server.close(done));
    const base = `http://127.0.0.1:${port}`;
    expectFailed(await check(base), `${base}/`, 'ECONNREFUSED');
  });

  it('AD-18 runs the asset glob counts before any request', async () => {
    const site = await startSite();
    const result = await check(site.base, { distDir: makeDist({ woff2: [] }) });
    expect(result).toEqual({
      ok: false,
      lines: [
        'E post-deploy check: verify dist: expected exactly one dist/assets/*.woff2, found 0: []',
      ],
    });
    expect(site.requests).toEqual([]);
  });

  it('AD-18 request timeout covers the body', async () => {
    const site = await startSite({
      '/slow': (_req, res) => {
        res.writeHead(200);
        res.write('partial');
      },
    });
    const result = await request(`${site.base}/slow`, {
      method: 'GET',
      timeoutMs: 100,
      followRedirects: false,
    });
    expect(result.error).toBe('timed out after 100 ms');
    expect(result.first?.status).toBeUndefined();
  });
});

describe('workflows', () => {
  it('AD-18 no workflow sets DEPLOY_CHECK_BASE_URL or puts an expression in a run: body', () => {
    const dir = join(repo, '.github/workflows');
    const files = readdirSync(dir).filter((name) => /\.ya?ml$/.test(name));
    expect(files).toEqual(expect.arrayContaining(['ci.yml', 'deploy.yml']));
    for (const name of files) {
      const text = readFileSync(join(dir, name), 'utf8');
      expect(text, name).not.toContain('DEPLOY_CHECK_BASE_URL');
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        const match = /^(\s*)(?:- )?run:\s*(.*)$/.exec(line);
        if (match === null) return;
        const body = [match[2]];
        if (/^[|>]/.test(match[2])) {
          const indent = match[1].length;
          for (const next of lines.slice(i + 1)) {
            if (next.trim() !== '' && next.length - next.trimStart().length <= indent) break;
            body.push(next);
          }
        }
        expect(body.join('\n'), `${name}:${i + 1}`).not.toContain('${{');
      });
    }
  });

  it("AD-18 secrets appear only in the env of deploy.yml's deploy step", () => {
    const dir = join(repo, '.github/workflows');
    for (const name of readdirSync(dir).filter((file) => /\.ya?ml$/.test(file))) {
      const lines = readFileSync(join(dir, name), 'utf8').split('\n');
      const uses = lines.flatMap((line, i) => (line.includes('secrets.') ? [i] : []));
      if (name !== 'deploy.yml') {
        expect(uses, name).toEqual([]);
        continue;
      }
      const step = lines.indexOf('      - name: deploy');
      const env = lines.indexOf('        env:', step);
      expect(step).toBeGreaterThan(-1);
      expect(lines.slice(step + 1, env).every((line) => line.startsWith('        '))).toBe(true);
      let end = env + 1;
      while (end < lines.length && lines[end].startsWith('          ')) end++;
      expect(uses.length).toBeGreaterThan(0);
      for (const i of uses) expect(i > env && i < end, `deploy.yml:${i + 1}`).toBe(true);
    }
  });
});

describe('CLI', () => {
  /**
   * @param {string[]} args
   * @param {string} cwd
   * @param {Record<string, string>} [env]
   * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
   */
  function spawn(args, cwd, env = {}) {
    const base = { ...process.env };
    delete base.DEPLOY_CHECK_BASE_URL;
    return new Promise((done) => {
      execFile(
        process.execPath,
        [script, ...args],
        { cwd, env: { ...base, ...env } },
        (error, stdout, stderr) => {
          const code = error === null ? 0 : typeof error.code === 'number' ? error.code : -1;
          done({ code, stdout, stderr });
        },
      );
    });
  }

  it('AD-18 CLI verify and post-deploy pass against a temp dist and the local site', async () => {
    const cwd = dirname(makeDist());
    writeFileSync(
      join(cwd, 'wrangler.log'),
      'Deployed wordcell triggers\n  https://wordcell.test.workers.dev\n',
    );
    const site = await startSite();
    const [verify, post] = await Promise.all([
      spawn(['verify'], cwd),
      spawn(['post-deploy', 'wrangler.log'], cwd, { DEPLOY_CHECK_BASE_URL: site.base }),
    ]);
    expect(verify).toEqual({ code: 0, stdout: 'verify dist: ok\n', stderr: '' });
    expect(post.stderr).toBe('');
    expect(post.code).toBe(0);
    expect(post.stdout).toBe(
      [
        'deployed URL: https://wordcell.test.workers.dev',
        `DEPLOY_CHECK_BASE_URL set (test only): checking ${site.base} instead of https://wordcell.test.workers.dev`,
        ...allOkLines(site.base),
        '',
      ].join('\n'),
    );
    expect(post.stdout).toContain(`ok: ${site.base}/assets/${DICT} (`);
    expect(post.stdout).toContain(`ok: ${site.base}/assets/${FONT} (`);
  });

  it('AD-18 CLI failures exit non-zero naming the cause', async () => {
    const cwd = dirname(makeDist({ dict: [] }));
    writeFileSync(join(cwd, 'no-url.log'), 'Deployed wordcell\n');
    writeFileSync(join(cwd, 'wrangler.log'), 'https://wordcell.test.workers.dev\n');
    const results = await Promise.all([
      spawn(['deploy'], cwd),
      spawn([], cwd),
      spawn(['verify', 'extra'], cwd),
      spawn(['verify'], cwd),
      spawn(['post-deploy'], cwd),
      spawn(['post-deploy', 'missing.log'], cwd),
      spawn(['post-deploy', 'no-url.log'], cwd),
      spawn(['post-deploy', 'wrangler.log'], cwd, { DEPLOY_CHECK_BASE_URL: 'http://127.0.0.1:1/' }),
    ]);
    const expected = [
      'deploy-check: unknown subcommand ["deploy"]',
      'deploy-check: unknown subcommand []',
      'deploy-check: unknown subcommand ["verify","extra"]',
      'verify dist: expected exactly one dist/assets/en-*.txt, found 0: []',
      'post-deploy check: expected one wrangler log path argument',
      'post-deploy check: cannot read wrangler log missing.log',
      'post-deploy check: no https://wordcell.<subdomain>.workers.dev URL in the wrangler log',
      'DEPLOY_CHECK_BASE_URL "http://127.0.0.1:1/" is not an http(s) origin',
    ];
    results.forEach((result, i) => {
      expect(result.code, expected[i]).not.toBe(0);
      expect(result.stderr).toContain(expected[i]);
    });
  });
});
