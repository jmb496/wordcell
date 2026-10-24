import { expect, type Page, type Request, test } from '@playwright/test';
import { LONG_PRESS_MS } from '../src/ui/gestures/classify';
import {
  box,
  centre,
  column,
  END_SHEET,
  openFixture,
  type Point,
  sameSession,
  stashSession,
} from './helpers/board';
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
import { button, wc } from './helpers/dialogs';
import { animationFrames, hidePage, showPage } from './helpers/lifecycle';
import { onAndroid, onDesktop } from './helpers/project';
import { isList, waitForDictionary } from './helpers/restore';
import { touchHold } from './helpers/touch';

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

const REPLAY = 'Replay this deal';
const replay = (page: Page) => sheet(page).getByRole('button', { name: REPLAY, exact: true });
const replayConfirm = (page: Page) => page.getByRole('dialog', { name: 'Replay this deal?' });
const viewSheet = (page: Page) => page.locator('[data-view-sheet]');

// An empty band point (AD-12): the centre of column 1 (empty on the won board) clipped to the band
// between the lower of the top bar's and the banner's bottom and the action bar's top.
async function emptyPoint(page: Page): Promise<Point> {
  const bottomOf = async (band: string) => {
    const b = await box(page.locator(`[data-band="${band}"]`));
    return b.y + b.h;
  };
  const col = await box(column(page, 1));
  const top = Math.max(col.y, await bottomOf('topBar'), await bottomOf('banner'));
  const bottom = Math.min(col.y + col.h, (await box(page.locator('[data-band="actionBar"]'))).y);
  if (!(bottom > top)) throw new Error('column 1 is not in the band');
  return { x: col.x + col.w / 2, y: (top + bottom) / 2 };
}

type Recorded = { __inputs?: string[] };

// A page-side window bubble-phase `pointerup`/`click` recorder, from now on (no `__wordcell`).
async function recordInputs(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const w = window as unknown as Recorded;
    const seen: string[] = [];
    w.__inputs = seen;
    for (const type of ['pointerup', 'click']) window.addEventListener(type, () => seen.push(type));
  });
  return () => page.evaluate(() => [...((window as unknown as Recorded).__inputs ?? [])]);
}

// The sheet expanded with Replay this deal focused and not activated, the Session unchanged.
async function expectSkipped(page: Page): Promise<void> {
  expect(await running(page)).toBe(false);
  await expect(sheet(page)).toBeVisible();
  await expect(replay(page)).toBeFocused();
  await expect(replayConfirm(page)).toHaveCount(0);
  await expect(viewSheet(page)).toHaveCount(0);
  expect(await sameSession(page)).toBe(true);
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

  for (const [name, at] of [
    ['an empty band point', emptyPoint],
    ['a non-empty WordCell', (page: Page) => centre(page.getByTestId('wordcell-3'))],
  ] as const) {
    test(`R-87 a touch press on ${name} skips the run, consumed: held until the sheet is expanded and released within the tap window, no pointerup or click reaches the page, nothing activated, Session unchanged`, async ({
      page,
    }) => {
      await readyToWin(page);
      await winIntoRun(page);
      await stashSession(page);
      const point = await at(page);
      const inputs = await recordInputs(page);
      const pressed = Date.now();
      const hold = await touchHold(page, point);
      try {
        await expect(sheet(page)).toBeVisible();
      } finally {
        await hold.end();
      }
      // A release after the long-press time would not be a tap: fail rather than prove nothing.
      expect(Date.now() - pressed).toBeLessThan(LONG_PRESS_MS);
      await animationFrames(page, 3);
      expect(await inputs()).toEqual([]);
      await expectSkipped(page);
      // Positive control: once the tail is gone, the recorder sees an ordinary tap on the empty
      // point.
      const empty = await emptyPoint(page);
      await page.waitForTimeout(300);
      await page.touchscreen.tap(empty.x, empty.y);
      await expect.poll(inputs).toEqual(['pointerup', 'click']);
    });
  }

  test('R-87 back skips the run: the sheet expanded and the app open; back again collapses the sheet, the app still open', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await page.goBack();
    await expect(sheet(page)).toBeVisible();
    expect(await running(page)).toBe(false);
    expect(page.url()).not.toBe('about:blank');
    await expect.poll(() => wcOf(page)).toBe(1);
    await page.goBack();
    await expect(sheet(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Show result:/ })).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(0);
    expect(page.url()).not.toBe('about:blank');
    await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  });

  test('R-87 a touch held on an empty band point from before the Confirm, released mid-run, does not skip it', async ({
    page,
  }) => {
    await readyToWin(page);
    const point = await emptyPoint(page);
    const pressed = Date.now();
    const hold = await touchHold(page, point);
    try {
      // Undo leaves focus on the first strip card (focusByPhase), where Enter confirms.
      await page.keyboard.press('Enter');
      expect(Date.now() - pressed).toBeLessThan(LONG_PRESS_MS);
      await expect.poll(() => running(page)).toBe(true);
    } finally {
      await hold.end();
    }
    // The release never reaches the page here either way: the AD-14 winning guard marks every
    // gesture open at its install consumed (motion.ts `install`, F8), so only `running()` shows the
    // skip ignored it.
    await animationFrames(page, 3);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
  });

  test('R-87 the dictionary banner’s Reload pressed mid-run refetches and does not skip the run', async ({
    page,
  }) => {
    const requests: Request[] = [];
    page.on('request', (request) => {
      if (isList(request)) requests.push(request);
    });
    await page.route('**/en*.txt', (route) => route.fulfill({ status: 500, body: '' }));
    await readyToWin(page);
    await waitForDictionary(page, 'failed');
    await expect(page.getByText("Word list didn't load.", { exact: true })).toBeVisible();
    expect(requests).toHaveLength(1);
    await winIntoRun(page);
    await button(page, 'Reload').tap();
    await expect.poll(() => requests.length).toBe(2);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
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

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  // Undo leaves focus on the first strip card (focusByPhase), where Enter confirms; the AD-14
  // winning guard eats keys sent before the run, so each key waits for `running()`.
  async function enterIntoRun(page: Page): Promise<void> {
    await readyToWin(page);
    await page.keyboard.press('Enter');
    await expect.poll(() => running(page)).toBe(true);
    await stashSession(page);
  }

  test('R-87 Space skips the run: its repeat once Replay this deal has focus and its release activate nothing', async ({
    page,
  }) => {
    await enterIntoRun(page);
    await page.keyboard.down('Space');
    await expect(replay(page)).toBeFocused();
    await page.keyboard.down('Space');
    await page.keyboard.up('Space');
    await animationFrames(page, 3);
    await expectSkipped(page);
  });

  test('R-87 Esc skips the run: the sheet expanded with Replay this deal focused, Session unchanged', async ({
    page,
  }) => {
    await enterIntoRun(page);
    await page.keyboard.press('Escape');
    await animationFrames(page, 3);
    await expectSkipped(page);
  });
});
