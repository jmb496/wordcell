import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { END_SHEET, openFixture } from '../helpers/board';
import { skipByPress, watchAdded, watchAddedFromBoot } from '../helpers/celebration';
import { walk } from '../helpers/dist-test';
import { animationFrames } from '../helpers/lifecycle';
import { fixture, seedStorage } from '../helpers/seed';

/** AD-15: collects page errors and console errors from now on (attach before the first goto). */
function errorsOf(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack ?? error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()} @ ${msg.location().url}`);
  });
  return errors;
}

test('AD-18 production build loads with 52 live cards, no errors and no test hook', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await expect(page.getByTestId(/^card-\d+$/)).toHaveCount(52);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  expect(await page.evaluate(() => '__wordcell' in window)).toBe(false);
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('AD-18 no file in dist/ contains __wordcell', () => {
  const root = path.resolve(import.meta.dirname, '../../dist');
  const files = walk(root);
  expect(files).toContain('index.html');
  expect(files.some((file) => /^assets\/[^/]+\.js$/.test(file))).toBe(true);
  const hits = files.filter((file) =>
    readFileSync(path.join(root, file), 'latin1').includes('__wordcell'),
  );
  expect(hits).toEqual([]);
});

// R-87 (AD-13 "a reload mid-run is a relaunch"): the hook-free build keeps the celebration on (real
// rAF), and a relaunch into a won game opens the sheet at boot without starting it.
test('R-87 a relaunch into a won game plays no celebration in the hook-free build', async ({
  page,
}) => {
  await seedStorage(page, { session: fixture('session-won-words.json') });
  const added = await watchAddedFromBoot(page, '[data-celebration-root]');
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: END_SHEET })).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  expect(await added()).toBe(false);
});

// R-87 hook-free row (ticket 10.8; closes the 10.5 deferral): a real win in `dist/` starts the run
// on the real rAF loop (no prefs: Normal speed), proven from the DOM only (AD-17 Celebration seam,
// AD-18: no `window.__wordcell`). The skip follows the start proof at once, the root still attached,
// and the sheet is bounded to 1 s, so the run's natural end (Normal ≈5.8 s) cannot stand in for it.
const WON = 'Every column cleared.';
const wonSheet = (page: Page) => page.getByRole('dialog', { name: WON, exact: true });
const ROOT = '[data-celebration-root]';

async function winIntoRealRun(page: Page): Promise<void> {
  // AD-19 Start: reduced motion plays no run, so pin the media feature.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openFixture(page, 'session-won-words', { booted: false, steps: ['undo'] });
  await expect(page.getByTestId('primary-action')).toHaveText('Confirm');
  const added = await watchAdded(page, ROOT);
  await page.getByTestId('primary-action').click();
  // The run starts in the winning whenSettled callback, after the commit glide and the 300 ms guard.
  await expect.poll(() => page.locator('[data-celebration-group]').count()).toBeGreaterThan(0);
  // The 10.5 deferral's literal assertion: a root is added after a real winning Confirm.
  expect(await added()).toBe(true);
  await expect(wonSheet(page)).toHaveCount(0);
  // SPEC F21/F26: the first shown copy's transform moves between real frames (a run's first frame
  // has dt 0, so two frames apart).
  await expect
    .poll(async () => {
      const first = await page.evaluate(() => {
        const copies = [...document.querySelectorAll<HTMLElement>('[data-celebration]')];
        const i = copies.findIndex(
          (c) => c.style.visibility !== 'hidden' && c.style.transform !== '',
        );
        return { i, a: copies[i]?.style.transform ?? '' };
      });
      await animationFrames(page, 2);
      const b = await page.evaluate(
        (i) =>
          document.querySelectorAll<HTMLElement>('[data-celebration]')[i]?.style.transform ?? '',
        first.i,
      );
      return first.a !== '' && first.a !== b;
    })
    .toBe(true);
  await expect(page.locator(ROOT)).toHaveCount(1);
}

async function expectSkippedToSheet(page: Page): Promise<void> {
  await expect(page.locator(ROOT)).toHaveCount(0);
  await expect(
    wonSheet(page).getByRole('button', { name: 'Replay this deal', exact: true }),
  ).toBeFocused();
}

test('R-87 hook-free build: a real win plays and a press skips it to the expanded end sheet', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await winIntoRealRun(page);
  // A touch tap (Pixel 7); the mouse branch is covered by the e2e/helpers.spec.ts self-test.
  await skipByPress(page);
  await expect(wonSheet(page)).toBeVisible({ timeout: 1000 });
  await expectSkippedToSheet(page);
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

// Back ends the run through `closedByBack` (AD-13 celebration entry, AD-19 `end()`); the depth check
// (back again collapses the sheet) is e2e/celebration.spec.ts's.
test('R-87 hook-free build: a real win plays and back skips it to the expanded end sheet, the app still open', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await winIntoRealRun(page);
  await page.goBack();
  await expect(wonSheet(page)).toBeVisible({ timeout: 1000 });
  await expectSkippedToSheet(page);
  expect(page.url()).not.toBe('about:blank');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('AD-11 ?bands= ignored in dist/', async ({ page }) => {
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/?bands=topBar,banner,leftover,tray,columns,wordcells,actionBar');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  const order = await page
    .locator('[data-band]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-band')));
  expect(order).toEqual([
    'topBar',
    'banner',
    'leftover',
    'columns',
    'footRow',
    'trayGap',
    'tray',
    'labels',
    'wordcells',
    'actionGap',
    'actionBar',
  ]);
});

test('Q-45 AD-10 the production Theme radiogroup offers Charcoal, Deep Space, Greenhouse Dusk, Brass and Walnut, Daylight Paper and Plum Dusk, applied as default', async ({
  page,
}) => {
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/');
  await expect(page.getByTestId(/^card-\d+$/)).toHaveCount(52);
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(
    'default',
  );
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  const group = page
    .getByRole('dialog', { name: 'Preferences', exact: true })
    .getByRole('radiogroup', { name: 'Theme' });
  const radios = group.getByRole('radio');
  await expect(radios).toHaveCount(6);
  await expect(radios.nth(0)).toHaveAccessibleName('Charcoal');
  await expect(radios.nth(1)).toHaveAccessibleName('Deep Space');
  await expect(radios.nth(2)).toHaveAccessibleName('Greenhouse Dusk');
  await expect(radios.nth(3)).toHaveAccessibleName('Brass and Walnut');
  await expect(radios.nth(4)).toHaveAccessibleName('Daylight Paper');
  await expect(radios.nth(5)).toHaveAccessibleName('Plum Dusk');
  await expect(group.getByRole('radio', { name: 'Charcoal' })).toBeChecked();
  await group.getByRole('radio', { name: 'Plum Dusk' }).check();
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(
    'plum',
  );
  expect(
    await page.evaluate(
      () => document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
    ),
  ).toBe('#1D1028');
});
