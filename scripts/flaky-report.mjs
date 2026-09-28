// @ts-check
// AD-18 CI `flaky report` step: lists Playwright tests that passed on retry (status `flaky`) in the
// job summary and as `::warning::` annotations. Flaky tests never fail the job; a missing report
// after a successful step, a malformed or wrong-shape report or an unexpected outcome does (rule 6).
// Usage: node scripts/flaky-report.mjs (env OUTCOME_DIST_SMOKE, OUTCOME_E2E, OUTCOME_PWA,
// PW_JSON_DIR, GITHUB_STEP_SUMMARY). Imports only node: built-ins (ticket 1.11).
import { appendFileSync, existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Playwright 1.63 JSON report, only the fields the report reads (`JSONReportSuite`,
 * `JSONReportSpec`, `JSONReportTest`).
 * @typedef {{ status: string, projectName: string }} ReportTest
 * @typedef {{ file: string, title: string, tests: ReportTest[] }} ReportSpec
 * @typedef {{ title: string, specs?: ReportSpec[], suites?: ReportSuite[] }} ReportSuite
 * @typedef {{ suites: ReportSuite[] }} Report
 * @typedef {{ id: string, outcome: string }} StepOutcome
 * @typedef {{ path: string, text: string | undefined }} ReportFile text undefined: the file is missing
 */

/** The steps in report order, with the env name carrying each outcome. */
export const STEPS = /** @type {const} */ ([
  { id: 'dist-smoke', env: 'OUTCOME_DIST_SMOKE' },
  { id: 'e2e', env: 'OUTCOME_E2E' },
  { id: 'pwa', env: 'OUTCOME_PWA' },
]);

/** @param {unknown} value */
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Checks the report shape (ticket 1.11 Flaky report contract) and returns it typed.
 * @param {unknown} json parsed report
 * @param {string} id step id, named in every error
 * @returns {Report}
 */
export function validateReport(json, id) {
  /** @param {string} what */
  const fail = (what) => {
    throw new Error(`flaky report: step ${id} JSON has an unexpected shape (${what})`);
  };
  if (!isObject(json)) fail('root is not an object');
  const root = /** @type {Record<string, unknown>} */ (json);
  if (!Array.isArray(root.suites)) fail('no .suites array');

  /** @param {unknown} suite @param {string} where */
  const checkSuite = (suite, where) => {
    if (!isObject(suite)) fail(`${where} is not an object`);
    const s = /** @type {Record<string, unknown>} */ (suite);
    if (typeof s.title !== 'string') fail(`${where}.title is not a string`);
    if (s.specs !== undefined) {
      if (!Array.isArray(s.specs)) fail(`${where}.specs is not an array`);
      /** @type {unknown[]} */ (s.specs).forEach((spec, i) => {
        checkSpec(spec, `${where}.specs[${i}]`);
      });
    }
    if (s.suites !== undefined) {
      if (!Array.isArray(s.suites)) fail(`${where}.suites is not an array`);
      /** @type {unknown[]} */ (s.suites).forEach((child, i) => {
        checkSuite(child, `${where}.suites[${i}]`);
      });
    }
  };

  /** @param {unknown} spec @param {string} where */
  const checkSpec = (spec, where) => {
    if (!isObject(spec)) fail(`${where} is not an object`);
    const s = /** @type {Record<string, unknown>} */ (spec);
    if (typeof s.file !== 'string') fail(`${where}.file is not a string`);
    if (typeof s.title !== 'string') fail(`${where}.title is not a string`);
    if (!Array.isArray(s.tests)) fail(`${where}.tests is not an array`);
    /** @type {unknown[]} */ (s.tests).forEach((test, i) => {
      const at = `${where}.tests[${i}]`;
      if (!isObject(test)) fail(`${at} is not an object`);
      const t = /** @type {Record<string, unknown>} */ (test);
      if (typeof t.status !== 'string') fail(`${at}.status is not a string`);
      if (typeof t.projectName !== 'string') fail(`${at}.projectName is not a string`);
    });
  };

  /** @type {unknown[]} */ (root.suites).forEach((suite, i) => {
    checkSuite(suite, `.suites[${i}]`);
  });
  return /** @type {Report} */ (json);
}

/**
 * Flaky entries in report order: `<project> > <file> > <nested describe titles…> > <title>`. The
 * root suites (one per file) contribute no title; within a suite, its specs come before its child
 * suites. CR and LF become spaces so each entry is one line.
 * @param {Report} report
 * @returns {string[]}
 */
export function flakyEntries(report) {
  /** @type {string[]} */
  const entries = [];
  /** @param {ReportSuite} suite @param {string[]} path */
  const walk = (suite, path) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        if (test.status !== 'flaky') continue;
        const text = [test.projectName, spec.file, ...path, spec.title].join(' > ');
        entries.push(text.replace(/[\r\n]/g, ' '));
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  for (const suite of report.suites) walk(suite, []);
  return entries;
}

/**
 * Escapes a flaky entry for a `::warning::` workflow command message.
 * @param {string} text
 */
export const escapeWarning = (text) => text.replaceAll('%', '%25');

/**
 * Builds the summary and warnings, or throws naming the step id (rule 6).
 * @param {{ outcomes: StepOutcome[], readReport: (id: string) => ReportFile }} input
 * @returns {{ summary: string, warnings: string[] }}
 */
export function buildReport({ outcomes, readReport }) {
  const summary = ['## Flaky tests'];
  /** @type {string[]} */
  const flaky = [];
  for (const { id, outcome } of outcomes) {
    if (outcome === 'skipped') {
      summary.push(`- ${id}: not run`);
      continue;
    }
    if (outcome !== 'failure' && outcome !== 'success') {
      throw new Error(`flaky report: step ${id} has unexpected outcome '${outcome}'`);
    }
    const file = readReport(id);
    if (file.text === undefined) {
      if (outcome === 'failure') {
        summary.push(`- ${id}: failed before reporting`);
        continue;
      }
      throw new Error(`flaky report: step ${id} succeeded but ${file.path} is missing`);
    }
    /** @type {unknown} */
    let json;
    try {
      json = JSON.parse(file.text);
    } catch (error) {
      throw new Error(`flaky report: step ${id} JSON ${file.path} does not parse`, {
        cause: error,
      });
    }
    flaky.push(...flakyEntries(validateReport(json, id)));
  }
  if (flaky.length === 0) summary.push('- No flaky tests.');
  for (const text of flaky) summary.push(`- \`\` ${text} \`\``);
  return {
    summary: `${summary.join('\n')}\n`,
    warnings: flaky.map((text) => `::warning::Flaky: ${escapeWarning(text)}`),
  };
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {string} name
 */
function requireEnv(env, name) {
  const value = env[name];
  if (value === undefined || value === '') {
    throw new Error(`flaky report: environment variable ${name} is unset or empty`);
  }
  return value;
}

function main() {
  const dir = requireEnv(process.env, 'PW_JSON_DIR');
  const summaryPath = requireEnv(process.env, 'GITHUB_STEP_SUMMARY');
  const { summary, warnings } = buildReport({
    outcomes: STEPS.map(({ id, env }) => ({ id, outcome: process.env[env] ?? '' })),
    readReport: (id) => {
      const path = join(dir, `${id}.json`);
      return { path, text: existsSync(path) ? readFileSync(path, 'utf8') : undefined };
    },
  });
  appendFileSync(summaryPath, summary);
  for (const line of warnings) console.log(line);
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
