// @ts-check
// Pre-deploy config test (ticket 1.11, retro R3): the validators live in deploy-check.mjs (SPEC D3
// deviation recorded in build-notes); they run on the committed files and inline mutated copies.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  readDefaultCompatDate,
  validateAssetsignore,
  validateHeaders,
  validateWrangler,
} from './deploy-check.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
/** @param {string} path */
const read = (path) => readFileSync(join(repo, path), 'utf8');

const HEADERS = read('public/_headers');
const ASSETSIGNORE = read('public/.assetsignore');
const WRANGLER = read('wrangler.jsonc');
// Read once: the pinned wrangler's DEFAULT_COMPAT_DATE (retro P3).
const CLI = read('node_modules/wrangler/wrangler-dist/cli.js');
const DEFAULT_DATE = readDefaultCompatDate(CLI);
/** A cli.js stand-in carrying only the real constant. */
const CLI_STUB = `const DEFAULT_COMPAT_DATE = "${DEFAULT_DATE}";`;

describe('_headers', () => {
  it('AD-18 the committed public/_headers passes', () => {
    expect(validateHeaders(HEADERS)).toEqual([]);
  });

  it('AD-18 lowercase cache-control, extra blank lines, CRLF, trailing spaces and tab indent pass', () => {
    const text = `\n\n${HEADERS.replaceAll('Cache-Control', 'cache-control').replaceAll('\n', ' \r\n\n')}\n\n`;
    expect(validateHeaders(text)).toEqual([]);
    expect(
      validateHeaders(HEADERS.replace('/sw.js\n  Cache-Control', '/sw.js\n\tCache-Control')),
    ).toEqual([]);
  });

  it('AD-18 rule order is ignored', () => {
    const blocks = HEADERS.trim().split('\n\n');
    expect(validateHeaders(blocks.reverse().join('\n\n'))).toEqual([]);
  });

  /** @type {[string, string, string][]} name, mutated text, expected error */
  const cases = [
    [
      'without the /sw.js rule',
      HEADERS.replace('/sw.js\n  Cache-Control: no-cache\n', ''),
      '_headers: missing path /sw.js',
    ],
    [
      'with a wrong immutable value',
      HEADERS.replace('max-age=31536000', 'max-age=3600'),
      '_headers: /assets/* Cache-Control is "public, max-age=3600, immutable", expected "public, max-age=31536000, immutable"',
    ],
    [
      'with an extra rule',
      `${HEADERS}\n/favicon.svg\n  Cache-Control: no-cache\n`,
      '_headers: extra path /favicon.svg',
    ],
    [
      'with a duplicate rule',
      `${HEADERS}\n/sw.js\n  Cache-Control: no-cache\n`,
      '_headers line 16: duplicate path /sw.js',
    ],
    [
      'with a duplicate header',
      HEADERS.replace('/sw.js\n', '/sw.js\n  cache-control: no-cache\n'),
      '_headers line 12: duplicate header Cache-Control for /sw.js',
    ],
    [
      'with an extra header',
      HEADERS.replace('/sw.js\n', '/sw.js\n  X-Frame-Options: DENY\n'),
      '_headers: /sw.js has extra header x-frame-options',
    ],
    [
      'with a # line',
      `# comment\n${HEADERS}`,
      '_headers line 1: not a path or an indented header: "# comment"',
    ],
    [
      'with an unindented ! line',
      `${HEADERS}! Cache-Control\n`,
      '_headers line 15: not a path or an indented header: "! Cache-Control"',
    ],
    [
      'with an indented ! detach line',
      HEADERS.replace('/sw.js\n', '/sw.js\n  ! Cache-Control\n'),
      '_headers line 11: not a "Name: value" header: "  ! Cache-Control"',
    ],
    [
      'with an indented line without :',
      HEADERS.replace('/sw.js\n', '/sw.js\n  no-cache\n'),
      '_headers line 11: not a "Name: value" header: "  no-cache"',
    ],
    [
      'with a header before any path',
      `  Cache-Control: no-cache\n${HEADERS}`,
      '_headers line 1: header before any path: "  Cache-Control: no-cache"',
    ],
    [
      'with a path without Cache-Control',
      HEADERS.replace('/sw.js\n  Cache-Control: no-cache\n', '/sw.js\n'),
      '_headers: /sw.js has no Cache-Control',
    ],
  ];
  for (const [name, text, error] of cases) {
    it(`AD-18 _headers ${name} fails`, () => {
      expect(validateHeaders(text)).toEqual([error]);
    });
  }
});

describe('.assetsignore', () => {
  it('AD-18 the committed public/.assetsignore passes, also with trailing CR/space', () => {
    expect(validateAssetsignore(ASSETSIGNORE)).toEqual([]);
    expect(validateAssetsignore('\n.vite \r\n\n')).toEqual([]);
  });

  it('AD-18 .assetsignore without .vite or with an extra line fails', () => {
    for (const text of ['', '\n', '.vite\n.vite\n', '.vite\n_headers\n', 'vite\n', ' .vite\n']) {
      expect(validateAssetsignore(text), JSON.stringify(text)).toHaveLength(1);
    }
  });
});

describe('wrangler.jsonc', () => {
  it('AD-18 the committed wrangler.jsonc passes against the DEFAULT_COMPAT_DATE read from the real cli.js', () => {
    expect(DEFAULT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(validateWrangler(WRANGLER, CLI_STUB)).toEqual([]);
  });

  /** @param {(config: Record<string, any>) => void} mutate */
  const mutated = (mutate) => {
    const config = JSON.parse(WRANGLER);
    mutate(config);
    return JSON.stringify(config, null, 2);
  };

  /** @type {[string, string, string][]} */
  const cases = [
    [
      'assets.not_found_handling',
      mutated((c) => {
        c.assets.not_found_handling = 'single-page-application';
      }),
      'wrangler.jsonc: assets {"directory":"./dist","not_found_handling":"single-page-application"}, expected {"directory":"./dist"}',
    ],
    [
      'an extra top-level key',
      mutated((c) => {
        c.main = 'worker.js';
      }),
      'wrangler.jsonc: keys ["assets","compatibility_date","main","name","preview_urls","workers_dev"]',
    ],
    [
      'a missing key',
      mutated((c) => {
        delete c.workers_dev;
      }),
      'wrangler.jsonc: workers_dev undefined, expected true',
    ],
    [
      'preview_urls: true',
      mutated((c) => {
        c.preview_urls = true;
      }),
      'wrangler.jsonc: preview_urls true, expected false',
    ],
    [
      'another name',
      mutated((c) => {
        c.name = 'wordcell-dev';
      }),
      'wrangler.jsonc: name "wordcell-dev", expected "wordcell"',
    ],
    ['a comment', `// config\n${WRANGLER}`, 'wrangler.jsonc: not strict JSON'],
    [
      'a trailing comma',
      WRANGLER.replace('"./dist"\n', '"./dist",\n'),
      'wrangler.jsonc: not strict JSON',
    ],
    [
      'a malformed date',
      mutated((c) => {
        c.compatibility_date = '2026-9-25';
      }),
      'wrangler.jsonc: compatibility_date "2026-9-25" is not a YYYY-MM-DD date',
    ],
    [
      'a non-calendar date',
      mutated((c) => {
        c.compatibility_date = '2026-02-30';
      }),
      'wrangler.jsonc: compatibility_date "2026-02-30" is not a YYYY-MM-DD date',
    ],
    [
      'a date later than DEFAULT_COMPAT_DATE',
      mutated((c) => {
        c.compatibility_date = '9999-12-31';
      }),
      `wrangler.jsonc: compatibility_date 9999-12-31 is later than the pinned wrangler's DEFAULT_COMPAT_DATE ${DEFAULT_DATE}`,
    ],
  ];
  for (const [name, text, error] of cases) {
    it(`AD-18 wrangler.jsonc with ${name} fails`, () => {
      const errors = validateWrangler(text, CLI_STUB);
      expect(
        errors.some((line) => line.startsWith(error)),
        errors.join('\n'),
      ).toBe(true);
    });
  }

  it('AD-18 compatibility_date equal to DEFAULT_COMPAT_DATE passes, the day after fails', () => {
    const at = mutated((c) => {
      c.compatibility_date = DEFAULT_DATE;
    });
    expect(validateWrangler(at, CLI_STUB)).toEqual([]);
    expect(validateWrangler(WRANGLER, 'const DEFAULT_COMPAT_DATE = "2026-01-01";')[0]).toContain(
      'is later than',
    );
  });

  it('AD-18 cli.js without or with two distinct DEFAULT_COMPAT_DATE fails', () => {
    expect(() => validateWrangler(WRANGLER, 'no constant here')).toThrow(
      'expected exactly one DEFAULT_COMPAT_DATE in wrangler cli.js, found []',
    );
    const two = 'DEFAULT_COMPAT_DATE = "2026-09-25"; DEFAULT_COMPAT_DATE = "2026-09-26";';
    expect(() => readDefaultCompatDate(two)).toThrow('found ["2026-09-25","2026-09-26"]');
    const same = 'DEFAULT_COMPAT_DATE = "2026-09-25"; DEFAULT_COMPAT_DATE = "2026-09-25";';
    expect(readDefaultCompatDate(same)).toBe('2026-09-25');
  });
});
