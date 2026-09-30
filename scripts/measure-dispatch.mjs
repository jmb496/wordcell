// @ts-check
// E8 dispatch cost (epic 3 SPEC E8): walks session-won.json back with Undo and forward with Redo
// on the `build:test` output under CDP CPU throttling (rate 4, Pixel 7 emulation) and prints the
// max and median per figure. Host-only, never in test:all or CI; needs Node >= 22.18 (unflagged
// type stripping, for e2e/helpers/seed.ts). Run `npm run build:test` first, then
// `node scripts/measure-dispatch.mjs`.
// Figures per step, from one click: `sync` = performance.now() right after button.click() minus
// right before (the synchronous handler: take, accrue, dispatch's own apply/view replay calls,
// storage write); `frame` = the same t0 to the callback of a second nested requestAnimationFrame
// (Svelte flushes in a microtask after the handler, so the render's `$derived` view recomputation
// and the DOM update fall here, plus one frame's render). Only `sync` carries the 16 ms flag, recorded for the epic 7
// device check, not optimised (spine Deferred). A flagged run exits 0; only setup or walk
// failures exit non-zero.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

/** @typedef {{ count: number, max: number, median: number, flagged: boolean }} Summary */

const PORT = 4174;
const URL_ROOT = `http://localhost:${PORT}/`;
const STEP_CAP = 200;
const FIXTURE = 'session-won.json';

/**
 * Max and median of the samples; `flagged` iff max > 16 ms (rule 6: an empty list throws).
 * @param {readonly number[]} ms
 * @returns {Summary}
 */
export function summarise(ms) {
  if (ms.length === 0) throw new Error('summarise: no samples');
  const sorted = [...ms].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const max = sorted[sorted.length - 1];
  return { count: sorted.length, max, median, flagged: max > 16 };
}

// In-page (lib ES2023 here, no DOM types): one click on the button with the given test id,
// timed synchronously and to the second nested rAF.
/** @param {'undo' | 'redo'} testId */
function stepSource(testId) {
  return `new Promise((resolve) => {
  const button = document.querySelector('[data-testid="${testId}"]');
  if (button === null) throw new Error('measure-dispatch: no ${testId} button');
  const t0 = performance.now();
  button.click();
  const t1 = performance.now();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const t2 = performance.now();
      resolve({ sync: t1 - t0, frame: t2 - t0, disabled: button.disabled });
    });
  });
})`;
}

const READY = `(() => {
  const hook = window.__wordcell;
  const undo = document.querySelector('[data-testid="undo"]');
  return hook !== undefined && hook.current().kind === 'active' && undo !== null && !undo.disabled;
})()`;

const STORED = `JSON.parse(localStorage.getItem('wordcell:session'))`;

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(URL_ROOT);
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    await sleep(250);
  }
  throw new Error(`measure-dispatch: vite preview did not answer on ${URL_ROOT} within 30 s`);
}

/**
 * Clicks one button until it is disabled after a step; fails at the cap.
 * @param {import('@playwright/test').Page} page
 * @param {'undo' | 'redo'} testId
 * @param {number[]} sync
 * @param {number[]} frame
 * @returns {Promise<number>} the step count
 */
async function walk(page, testId, sync, frame) {
  for (let steps = 1; steps <= STEP_CAP; steps++) {
    const sample = /** @type {{ sync: number, frame: number, disabled: boolean }} */ (
      await page.evaluate(stepSource(testId))
    );
    sync.push(sample.sync);
    frame.push(sample.frame);
    if (sample.disabled) return steps;
  }
  throw new Error(`measure-dispatch: ${testId} still enabled after ${STEP_CAP} steps`);
}

/** @param {string} name @param {Summary} summary @param {boolean} withFlag */
function report(name, summary, withFlag) {
  const figures = `count ${summary.count}, max ${summary.max.toFixed(2)} ms, median ${summary.median.toFixed(2)} ms`;
  console.log(`${name}: ${figures}${withFlag ? `, flagged ${summary.flagged}` : ''}`);
}

async function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  if (!existsSync(`${root}dist-test/index.html`)) {
    throw new Error(
      'measure-dispatch: dist-test/index.html is missing; run npm run build:test first',
    );
  }
  const expected = JSON.parse(readFileSync(`${root}fixtures/${FIXTURE}`, 'utf8'));
  const child = spawn(
    `${root}node_modules/.bin/vite`,
    ['preview', '--outDir', 'dist-test', '--port', String(PORT), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] },
  );
  process.on('SIGINT', () => {
    child.kill();
    process.exit(130);
  });
  /** @type {import('@playwright/test').Browser | undefined} */
  let browser;
  /** @type {(code: number | null) => void} */
  let onExit = () => {};
  try {
    const exited = new Promise((_, reject) => {
      onExit = (code) =>
        reject(new Error(`measure-dispatch: vite preview exited early (code ${code})`));
      child.once('exit', onExit);
    });
    await Promise.race([waitForServer(), exited]);
    // A later exit mid-walk must not abort Node before `finally`; the walk then fails on its own.
    exited.catch(() => {});
    const { chromium, devices } = await import('@playwright/test');
    const { fixture, seedStorage } = await import(
      new URL('../e2e/helpers/seed.ts', import.meta.url).href
    );
    browser = await chromium.launch();
    const context = await browser.newContext({ ...devices['Pixel 7'] });
    const page = await context.newPage();
    await seedStorage(page, { session: fixture(FIXTURE) });
    await page.goto(URL_ROOT);
    await page.waitForFunction(READY);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    /** @type {number[]} */
    const sync = [];
    /** @type {number[]} */
    const frame = [];
    const undoSteps = await walk(page, 'undo', sync, frame);
    const redoSteps = await walk(page, 'redo', sync, frame);
    if (undoSteps !== redoSteps) {
      throw new Error(`measure-dispatch: ${undoSteps} Undo steps but ${redoSteps} Redo steps`);
    }
    const stored = await page.evaluate(STORED);
    if (!isDeepStrictEqual({ ...stored, activeMs: 0 }, { ...expected, activeMs: 0 })) {
      throw new Error(
        `measure-dispatch: stored Session after the Redo walk differs from ${FIXTURE}`,
      );
    }
    console.log(`measure-dispatch: ${FIXTURE}, Undo steps ${undoSteps}, Redo steps ${redoSteps}`);
    console.log(`measure-dispatch: Chromium ${browser.version()}, CPU throttling rate 4, Pixel 7`);
    report('sync', summarise(sync), true);
    report('frame', summarise(frame), false);
  } finally {
    child.off('exit', onExit);
    await browser?.close();
    child.kill();
  }
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
