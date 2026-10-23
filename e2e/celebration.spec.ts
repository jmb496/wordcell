import { expect, type Page, test } from '@playwright/test';
import { END_SHEET, openFixture } from './helpers/board';
import {
  advance,
  enableCelebration,
  FAST_CAP_STEP_MS,
  finishCelebration,
  MANUAL_STEP_MS,
  NORMAL_CAP_STEP_MS,
  running,
  SLOW_CAP_STEP_MS,
  WON_ROWS,
  watchAdded,
} from './helpers/celebration';
import { wc } from './helpers/dialogs';
import { animationFrames, hidePage, showPage } from './helpers/lifecycle';
import { onAndroid } from './helpers/project';

// Epic 10 entry 5 (R-87; AD-13 celebration bullet, AD-17 Celebration seam, AD-19 Start): the win
// trigger, driven through the hook's manual clock. session-won-words (seed 2089, ten words, QU in
// JDAQUYE) plus one Undo is the Place phase whose Confirm wins. Speeds: `prefs-fast` Fast,
// `prefs-non-default` Slow, Normal by default.

const ROOT = '[data-celebration-root]';
const GROUP = '[data-celebration-group]';
const primary = (page: Page) => page.getByTestId('primary-action');
const sheet = (page: Page) => page.getByRole('dialog', { name: END_SHEET });
const wcOf = (page: Page) => wc(page).then((state) => state?.wc);
const historyLength = (page: Page) => page.evaluate(() => history.length);

/** The board one Confirm from a win, the celebration enabled (manual clock). */
async function readyToWin(page: Page, prefs?: string): Promise<void> {
  await openFixture(page, 'session-won-words', {
    ...(prefs === undefined ? {} : { prefs }),
    steps: ['undo'],
  });
  await enableCelebration(page);
}

async function winIntoRun(page: Page): Promise<void> {
  await primary(page).click();
  await expect.poll(() => running(page)).toBe(true);
}

// Steps the manual clock 16 ms at a time, at most `cap` ms, until a group of the live run is shown
// (computed opacity > 0 and a written transform); returns its index, -1 if none was.
function stepUntilShown(page: Page, cap: number): Promise<number> {
  return page.evaluate(
    ([max, stepMs]) => {
      const hook = window.__wordcell;
      if (hook === undefined) throw new Error('AD-17 no test hook');
      const groups = [...document.querySelectorAll<HTMLElement>('[data-celebration-group]')];
      for (let t = 0; t < max && hook.celebration.running(); t += stepMs) {
        hook.celebration.advance(stepMs);
        const shown = groups.findIndex(
          (g) => Number(getComputedStyle(g).opacity) > 0 && g.style.transform !== '',
        );
        if (shown >= 0) return shown;
      }
      return -1;
    },
    [cap, MANUAL_STEP_MS] as const,
  );
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-87 a win plays the celebration with the sheet hidden; its end pops the entry before the sheet opens expanded with Replay this deal focused', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await expect(page.locator(GROUP)).toHaveCount(WON_ROWS.length);
    const lengthWhileRunning = await historyLength(page);
    expect(await wcOf(page)).toBe(1);
    await expect(sheet(page)).toHaveCount(0);
    await finishCelebration(page);
    await expect(sheet(page).getByRole('button', { name: 'Replay this deal' })).toBeFocused();
    await expect.poll(() => wcOf(page)).toBe(1);
    await animationFrames(page, 3);
    expect(await wcOf(page)).toBe(1);
    expect(await historyLength(page)).toBe(lengthWhileRunning);
  });

  test('R-87 at Fast the run ends by the cap rounded up to a 16 ms step: sheet expanded', async ({
    page,
  }) => {
    await readyToWin(page, 'prefs-fast');
    await winIntoRun(page);
    await advance(page, FAST_CAP_STEP_MS);
    expect(await running(page)).toBe(false);
    await expect(sheet(page)).toBeVisible();
  });

  test('R-87 at Slow the run still runs after the Fast cap and ends by the Slow cap rounded up to a 16 ms step: sheet expanded', async ({
    page,
  }) => {
    await readyToWin(page, 'prefs-non-default');
    await winIntoRun(page);
    await advance(page, FAST_CAP_STEP_MS);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
    await advance(page, SLOW_CAP_STEP_MS - FAST_CAP_STEP_MS);
    expect(await running(page)).toBe(false);
    await expect(sheet(page)).toBeVisible();
  });

  test('R-87 a Give up plays no celebration: the sheet opens expanded at once', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await enableCelebration(page);
    const added = await watchAdded(page, ROOT);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Give up', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Game given up.' })).toBeVisible();
    expect(await running(page)).toBe(false);
    expect(await added()).toBe(false);
  });

  test('R-87 under reduced motion a win plays no celebration: the sheet opens expanded', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await readyToWin(page);
    const added = await watchAdded(page, ROOT);
    await primary(page).click();
    await expect(sheet(page)).toBeVisible();
    expect(await running(page)).toBe(false);
    expect(await added()).toBe(false);
  });

  test('R-87 a page hidden when the win settles plays no celebration: the sheet is expanded on return', async ({
    page,
  }) => {
    await readyToWin(page, 'prefs-non-default');
    const added = await watchAdded(page, ROOT);
    await primary(page).click();
    await hidePage(page);
    // Slow (`prefs-non-default`): its longer glide plus the 300 ms floor give the `hidePage` its
    // margin before the settle. The hide flush finishes the glide, but the settle callback still
    // waits for the winning guard's 300 ms floor (AD-14): stay hidden until today's open has run
    // (the visibility is emulated, so the opened sheet renders).
    await expect(sheet(page)).toBeVisible();
    await showPage(page);
    await expect(sheet(page)).toBeVisible();
    expect(await running(page)).toBe(false);
    expect(await added()).toBe(false);
  });

  test('R-87 a reload mid-run is a relaunch: the sheet opens expanded at boot and no copy is drawn', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await page.reload();
    await expect(sheet(page)).toBeVisible();
    expect(await running(page)).toBe(false);
    await expect(page.locator('[data-celebration]')).toHaveCount(0);
  });

  test('R-87 the copies: 55 face copies beside the 52 live cards, none live or a mirror, each group spelling its word, a group shown by the run', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await expect(page.locator('[data-celebration]')).toHaveCount(55);
    await expect(
      page.locator('[data-celebration]:is([data-card-id], [data-testid], [data-mirror-of])'),
    ).toHaveCount(0);
    const words = await page
      .locator(GROUP)
      .evaluateAll((groups) =>
        groups.map((g) =>
          [...g.querySelectorAll('.glyph')]
            .map((glyph) => (glyph.textContent === 'Qu' ? 'QU' : glyph.textContent))
            .join(''),
        ),
      );
    expect(words).toEqual(WON_ROWS.map((row) => row.split(',')[0]));
    expect(await stepUntilShown(page, NORMAL_CAP_STEP_MS)).toBeGreaterThanOrEqual(0);
  });

  test('R-87 a Redo that restores the win plays it again: the first run is gone and a new group is shown', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    const first = await page.locator(GROUP).first().elementHandle();
    if (first === null) throw new Error('no first-run group');
    await finishCelebration(page);
    await page.getByTestId('undo').click();
    await expect(sheet(page)).toHaveCount(0);
    expect(await running(page)).toBe(false);
    await page.getByTestId('redo').click();
    await expect.poll(() => running(page)).toBe(true);
    expect(await first.evaluate((el) => el.isConnected)).toBe(false);
    await expect(page.locator(GROUP)).toHaveCount(WON_ROWS.length);
    await expect(page.locator('[data-celebration]')).toHaveCount(55);
    expect(await stepUntilShown(page, NORMAL_CAP_STEP_MS)).toBeGreaterThanOrEqual(0);
  });
});
