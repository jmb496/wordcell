import { expect, type Page, test } from '@playwright/test';
import { centre, collapseEndSheet, glidesSettled, openFixture, tapAt } from './helpers/board';
import { hidePage, showPage } from './helpers/lifecycle';
import { onAndroid, onDesktop } from './helpers/project';

// Ticket 5.13 (epic 5 SPEC CAP-10, F8, F23; AD-14, AD-9): the winning-animation input guard.
// session-won plus one Undo is the Place phase whose Confirm wins (cell 6 receives the last word).
// Animation speed Slow is `prefs-non-default` (base 320 ms), Fast is `prefs-fast`, Normal is the
// default. The Vitest guard cases in src/ui/motion.test.ts are authoritative for held-key repeats;
// repeated `keyboard.down('Enter')` is Playwright's closest stand-in for a held key.

const primary = (page: Page) => page.getByTestId('primary-action');
const sheet = (page: Page) => page.locator('[data-view-sheet]');

type Stored = { seed: number; moves: unknown[]; cursor: unknown };
async function stored(page: Page): Promise<Stored> {
  const text = await page.evaluate(() => localStorage.getItem('wordcell:session'));
  if (text === null) throw new Error('no stored session');
  const { seed, moves, cursor } = JSON.parse(text) as Stored;
  return { seed, moves, cursor };
}

const running = (page: Page) => page.evaluate(() => document.getAnimations().length);

// Opens session-won, undoes once (Place), returns the point of cell 6 and of the primary action.
async function place(page: Page, prefs?: string) {
  await openFixture(page, 'session-won', {
    ...(prefs === undefined ? {} : { prefs }),
    steps: ['undo'],
  });
  await expect(primary(page)).toHaveAccessibleName('Confirm');
  return {
    cell: await centre(page.getByTestId('wordcell-6')),
    action: await centre(primary(page)),
  };
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('AD-14 F8 a cell 6 tap during the Confirm animation opens no view, after settle it opens (Slow)', async ({
    page,
  }) => {
    const { cell, action } = await place(page, 'prefs-non-default');
    await tapAt(page, action);
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveCount(0);
    await glidesSettled(page);
    // The consumed tap's backstop (Slow snap 320 ms) and the 300 ms minimum pass.
    await page.waitForTimeout(700);
    await expect(sheet(page)).toHaveCount(0);
    await collapseEndSheet(page);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
  });

  for (const [name, prefs, reduced] of [
    ['Slow', 'prefs-non-default', false],
    ['reduced motion', undefined, true],
    ['Fast', 'prefs-fast', false],
  ] as const) {
    test(`AD-14 F8 F23 a double tap on primary-action leaves the stored session as after the first Confirm, no New game (${name})`, async ({
      page,
    }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
      const { action } = await place(page, prefs);
      await tapAt(page, action);
      const after = await stored(page);
      // The gap to the second tap is not asserted: tapAt timing is not reliable enough to pin it
      // under 300 ms for Fast and reduced motion without flakiness. Only Slow asserts a running animation; Fast and reduced motion rely on the 300 ms minimum.
      if (name === 'Slow') expect(await running(page)).toBeGreaterThan(0);
      await tapAt(page, action);
      await glidesSettled(page);
      await page.waitForTimeout(500);
      expect(await stored(page)).toEqual(after);
      // R-62 Confirm → Game over: the primary action is New game, untouched.
      await expect(primary(page)).toHaveAccessibleName('New game');
    });
  }

  test('AD-14 F8 an untouched win settles and New game starts a new seed', async ({ page }) => {
    const { action } = await place(page, 'prefs-non-default');
    await tapAt(page, action);
    const won = await stored(page);
    await glidesSettled(page);
    await page.waitForTimeout(500);
    await expect(primary(page)).toHaveAccessibleName('New game');
    await primary(page).click();
    await expect.poll(async () => (await stored(page)).seed).not.toBe(won.seed);
  });

  test('AD-14 F8 Undo during the win animation passes through and returns to Place', async ({
    page,
  }) => {
    const { action } = await place(page, 'prefs-non-default');
    const before = await stored(page);
    await tapAt(page, action);
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await page.getByTestId('undo').tap();
    await glidesSettled(page);
    await expect(primary(page)).toHaveAccessibleName('Confirm');
    expect(await stored(page)).toEqual(before);
  });

  test('AD-14 F8 the Redo win guards a cell 6 tap too', async ({ page }) => {
    const { cell } = await place(page, 'prefs-non-default');
    await primary(page).tap();
    await glidesSettled(page);
    await page.waitForTimeout(700);
    await page.getByTestId('undo').tap();
    await glidesSettled(page);
    await page.getByTestId('redo').tap();
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveCount(0);
    await glidesSettled(page);
    await page.waitForTimeout(700);
    await expect(sheet(page)).toHaveCount(0);
    await collapseEndSheet(page);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  for (const [name, prefs] of [
    ['Slow', 'prefs-non-default'],
    ['Normal', undefined],
  ] as const) {
    test(`AD-14 F8 Enter twice on the focused primary action leaves the seed (${name})`, async ({
      page,
    }) => {
      await place(page, prefs);
      await primary(page).focus();
      await page.keyboard.press('Enter');
      const after = await stored(page);
      await page.keyboard.press('Enter');
      await glidesSettled(page);
      await page.waitForTimeout(500);
      expect(await stored(page)).toEqual(after);
    });

    test(`AD-14 F8 a held Enter (repeated keydown) spanning the animation leaves the seed (${name})`, async ({
      page,
    }) => {
      await place(page, prefs);
      await primary(page).focus();
      await page.keyboard.down('Enter');
      const after = await stored(page);
      for (let i = 0; i < 12; i++) {
        await page.keyboard.down('Enter');
        await page.waitForTimeout(60);
      }
      await page.keyboard.up('Enter');
      await glidesSettled(page);
      await page.waitForTimeout(500);
      expect(await stored(page)).toEqual(after);
    });
  }

  test('AD-9 AD-14 F8 smoke: after a key held through hide during the win, a cell 6 click opens the view (Vitest is authoritative for the timing)', async ({
    page,
  }) => {
    const { cell } = await place(page);
    await primary(page).focus();
    await page.keyboard.down('Enter');
    await hidePage(page);
    await showPage(page);
    await page.waitForTimeout(800);
    await collapseEndSheet(page);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    await page.keyboard.up('Enter');
  });
});
