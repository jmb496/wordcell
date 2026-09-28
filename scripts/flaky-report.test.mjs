// @ts-check
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { buildReport, escapeWarning, flakyEntries, validateReport } from './flaky-report.mjs';

/**
 * Real Playwright 1.63.0 JSON report, trimmed to the fields the report shape uses. Captured with
 * `npx playwright test -c .tmp-flaky/playwright.config.ts --retries=1 --reporter=json` (throwaway
 * config and spec outside e2e/, deleted after): `passes on retry` inside `outer > inner` fails on
 * its first try (file marker) and passes on retry.
 */
const REAL_FLAKY = {
  suites: [
    {
      title: 'flaky.spec.ts',
      file: 'flaky.spec.ts',
      specs: [
        {
          title: 'top level',
          file: 'flaky.spec.ts',
          tests: [{ projectName: 'android', status: 'expected' }],
        },
      ],
      suites: [
        {
          title: 'outer',
          file: 'flaky.spec.ts',
          specs: [
            {
              title: 'stable',
              file: 'flaky.spec.ts',
              tests: [{ projectName: 'android', status: 'expected' }],
            },
          ],
          suites: [
            {
              title: 'inner',
              file: 'flaky.spec.ts',
              specs: [
                {
                  title: 'passes on retry',
                  file: 'flaky.spec.ts',
                  tests: [{ projectName: 'android', status: 'flaky' }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const NO_FLAKY = {
  suites: [
    {
      title: 'a.spec.ts',
      specs: [
        { title: 'ok', file: 'a.spec.ts', tests: [{ projectName: 'android', status: 'expected' }] },
      ],
    },
  ],
};

/**
 * @param {string} title
 * @param {string} [status]
 */
const oneSpec = (title, status = 'flaky') => ({
  suites: [
    {
      title: 'b.spec.ts',
      specs: [{ title, file: 'b.spec.ts', tests: [{ projectName: 'desktop', status }] }],
    },
  ],
});

/**
 * @param {Record<string, string>} outcomes id → outcome
 * @param {Record<string, unknown>} files id → report (string = raw text); absent = missing file
 */
function run(outcomes, files) {
  return buildReport({
    outcomes: Object.entries(outcomes).map(([id, outcome]) => ({ id, outcome })),
    readReport: (id) => {
      const value = files[id];
      const path = `/pw-json/${id}.json`;
      if (value === undefined) return { path, text: undefined };
      return { path, text: typeof value === 'string' ? value : JSON.stringify(value) };
    },
  });
}

const ALL_OK = { 'dist-smoke': 'success', e2e: 'success', pwa: 'success' };

describe('flaky report', () => {
  it('AD-18 three successful steps without flaky tests write No flaky tests.', () => {
    const result = run(ALL_OK, { 'dist-smoke': NO_FLAKY, e2e: NO_FLAKY, pwa: NO_FLAKY });
    expect(result).toEqual({ summary: '## Flaky tests\n- No flaky tests.\n', warnings: [] });
  });

  it('AD-18 real Playwright 1.63 report: nested describe flaky entry, full summary', () => {
    const result = run(ALL_OK, { 'dist-smoke': NO_FLAKY, e2e: REAL_FLAKY, pwa: NO_FLAKY });
    expect(result.summary).toBe(
      '## Flaky tests\n- `` android > flaky.spec.ts > outer > inner > passes on retry ``\n',
    );
    expect(result.warnings).toEqual([
      '::warning::Flaky: android > flaky.spec.ts > outer > inner > passes on retry',
    ]);
  });

  it('AD-18 entries keep report order: specs before child suites, steps in order', () => {
    const report = {
      suites: [
        {
          title: 'c.spec.ts',
          specs: [
            {
              title: 'top',
              file: 'c.spec.ts',
              tests: [
                { projectName: 'android', status: 'flaky' },
                { projectName: 'desktop', status: 'flaky' },
              ],
            },
          ],
          suites: [
            {
              title: 'one',
              suites: [
                {
                  title: 'two',
                  specs: [
                    {
                      title: 'deep',
                      file: 'c.spec.ts',
                      tests: [{ projectName: 'android', status: 'flaky' }],
                    },
                  ],
                },
              ],
              specs: [
                {
                  title: 'mid',
                  file: 'c.spec.ts',
                  tests: [{ projectName: 'android', status: 'flaky' }],
                },
              ],
            },
            {
              title: 'three',
              specs: [
                {
                  title: 'last',
                  file: 'c.spec.ts',
                  tests: [{ projectName: 'android', status: 'passed' }],
                },
              ],
            },
          ],
        },
        {
          title: 'd.spec.ts',
          specs: [
            {
              title: 'other',
              file: 'd.spec.ts',
              tests: [{ projectName: 'android', status: 'flaky' }],
            },
          ],
        },
      ],
    };
    expect(flakyEntries(validateReport(report, 'e2e'))).toEqual([
      'android > c.spec.ts > top',
      'desktop > c.spec.ts > top',
      'android > c.spec.ts > one > mid',
      'android > c.spec.ts > one > two > deep',
      'android > d.spec.ts > other',
    ]);
    const result = run(ALL_OK, {
      'dist-smoke': oneSpec('first'),
      e2e: NO_FLAKY,
      pwa: oneSpec('third'),
    });
    expect(result.summary).toBe(
      '## Flaky tests\n- `` desktop > b.spec.ts > first ``\n- `` desktop > b.spec.ts > third ``\n',
    );
  });

  it('AD-18 warning escapes % and CR/LF in a title become spaces', () => {
    const result = run(ALL_OK, {
      'dist-smoke': oneSpec('50% done\r\nnext\nline'),
      e2e: NO_FLAKY,
      pwa: NO_FLAKY,
    });
    expect(result.summary).toBe(
      '## Flaky tests\n- `` desktop > b.spec.ts > 50% done  next line ``\n',
    );
    expect(result.warnings).toEqual([
      '::warning::Flaky: desktop > b.spec.ts > 50%25 done  next line',
    ]);
    expect(escapeWarning('a%b%')).toBe('a%25b%25');
  });

  it('AD-18 a flaky entry is listed even when that step failed; exit is not affected', () => {
    const result = run(
      { 'dist-smoke': 'success', e2e: 'failure', pwa: 'success' },
      { 'dist-smoke': NO_FLAKY, e2e: oneSpec('retried'), pwa: NO_FLAKY },
    );
    expect(result.summary).toBe('## Flaky tests\n- `` desktop > b.spec.ts > retried ``\n');
  });

  it('AD-18 outcomes: skipped is not run, failure without file failed before reporting', () => {
    const result = run(
      { 'dist-smoke': 'skipped', e2e: 'failure', pwa: 'success' },
      { pwa: NO_FLAKY },
    );
    expect(result.summary).toBe(
      '## Flaky tests\n- dist-smoke: not run\n- e2e: failed before reporting\n- No flaky tests.\n',
    );
  });

  it('AD-18 actionlint failing first leaves all three steps not run', () => {
    const result = run({ 'dist-smoke': 'skipped', e2e: 'skipped', pwa: 'skipped' }, {});
    expect(result.summary).toBe(
      '## Flaky tests\n- dist-smoke: not run\n- e2e: not run\n- pwa: not run\n- No flaky tests.\n',
    );
  });

  it('AD-18 success without a report file throws naming the step id', () => {
    expect(() => run(ALL_OK, { 'dist-smoke': NO_FLAKY, pwa: NO_FLAKY })).toThrow(
      'step e2e succeeded but /pw-json/e2e.json is missing',
    );
  });

  it('AD-18 an unexpected or empty outcome throws naming the step id', () => {
    expect(() => run({ 'dist-smoke': 'cancelled' }, {})).toThrow(
      "step dist-smoke has unexpected outcome 'cancelled'",
    );
    expect(() => run({ pwa: '' }, {})).toThrow("step pwa has unexpected outcome ''");
  });

  it('AD-18 malformed JSON throws naming the step id', () => {
    expect(() => run({ pwa: 'success' }, { pwa: '{"suites": [' })).toThrow(
      'step pwa JSON /pw-json/pwa.json does not parse',
    );
  });

  it('AD-18 wrong-shape reports throw naming the step id', () => {
    /** @type {[unknown, string][]} */
    const cases = [
      [[], 'root is not an object'],
      [{}, 'no .suites array'],
      [{ suites: {} }, 'no .suites array'],
      [{ suites: [{ specs: [] }] }, '.suites[0].title is not a string'],
      [{ suites: [{ title: 1 }] }, '.suites[0].title is not a string'],
      [{ suites: [{ title: 'a', specs: {} }] }, '.suites[0].specs is not an array'],
      [{ suites: [{ title: 'a', suites: 'x' }] }, '.suites[0].suites is not an array'],
      [
        { suites: [{ title: 'a', suites: [{ title: 2 }] }] },
        '.suites[0].suites[0].title is not a string',
      ],
      [
        { suites: [{ title: 'a', specs: [{ title: 't', file: 'f' }] }] },
        '.suites[0].specs[0].tests is not an array',
      ],
      [
        { suites: [{ title: 'a', specs: [{ title: 't', file: 3, tests: [] }] }] },
        '.suites[0].specs[0].file is not a string',
      ],
      [
        { suites: [{ title: 'a', specs: [{ file: 'f', tests: [] }] }] },
        '.suites[0].specs[0].title is not a string',
      ],
      [
        {
          suites: [
            { title: 'a', specs: [{ title: 't', file: 'f', tests: [{ projectName: 'p' }] }] },
          ],
        },
        '.suites[0].specs[0].tests[0].status is not a string',
      ],
      [
        {
          suites: [
            { title: 'a', specs: [{ title: 't', file: 'f', tests: [{ status: 'flaky' }] }] },
          ],
        },
        '.suites[0].specs[0].tests[0].projectName is not a string',
      ],
    ];
    for (const [report, detail] of cases) {
      expect(() => run({ e2e: 'success' }, { e2e: JSON.stringify(report) })).toThrow(
        `flaky report: step e2e JSON has an unexpected shape (${detail})`,
      );
    }
  });

  describe('CLI', () => {
    const script = fileURLToPath(new URL('./flaky-report.mjs', import.meta.url));
    const dir = mkdtempSync(join(tmpdir(), 'wordcell-flaky-'));
    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    /**
     * @param {Record<string, string>} env
     * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
     */
    function spawn(env) {
      const base = { ...process.env };
      for (const name of [
        'OUTCOME_DIST_SMOKE',
        'OUTCOME_E2E',
        'OUTCOME_PWA',
        'PW_JSON_DIR',
        'GITHUB_STEP_SUMMARY',
      ]) {
        delete base[name];
      }
      return new Promise((done) => {
        execFile(
          process.execPath,
          [script],
          { cwd: dir, env: { ...base, ...env } },
          (error, stdout, stderr) => {
            const code = error === null ? 0 : typeof error.code === 'number' ? error.code : -1;
            done({ code, stdout, stderr });
          },
        );
      });
    }

    it('AD-18 CLI appends the summary, prints the warning and exits 0 with a flaky entry', async () => {
      const jsonDir = join(dir, 'pw-json');
      const summary = join(dir, 'summary.md');
      mkdirSync(jsonDir);
      writeFileSync(join(jsonDir, 'e2e.json'), JSON.stringify(REAL_FLAKY));
      writeFileSync(join(jsonDir, 'pwa.json'), JSON.stringify(NO_FLAKY));
      writeFileSync(summary, 'before\n');
      const env = {
        OUTCOME_DIST_SMOKE: 'skipped',
        OUTCOME_E2E: 'failure',
        OUTCOME_PWA: 'success',
        PW_JSON_DIR: jsonDir,
        GITHUB_STEP_SUMMARY: summary,
      };
      const [ok, noDir, emptySummary] = await Promise.all([
        spawn(env),
        spawn({ ...env, PW_JSON_DIR: '' }),
        spawn({ ...env, GITHUB_STEP_SUMMARY: '' }),
      ]);
      expect(ok).toEqual({
        code: 0,
        stdout: '::warning::Flaky: android > flaky.spec.ts > outer > inner > passes on retry\n',
        stderr: '',
      });
      expect(readFileSync(summary, 'utf8')).toBe(
        'before\n## Flaky tests\n- dist-smoke: not run\n' +
          '- `` android > flaky.spec.ts > outer > inner > passes on retry ``\n',
      );
      expect(noDir.code).not.toBe(0);
      expect(noDir.stderr).toContain('environment variable PW_JSON_DIR is unset or empty');
      expect(emptySummary.code).not.toBe(0);
      expect(emptySummary.stderr).toContain(
        'environment variable GITHUB_STEP_SUMMARY is unset or empty',
      );
      const unset = await spawn({ PW_JSON_DIR: jsonDir });
      expect(unset.code).not.toBe(0);
      expect(unset.stderr).toContain('environment variable GITHUB_STEP_SUMMARY is unset or empty');
    });
  });
});
