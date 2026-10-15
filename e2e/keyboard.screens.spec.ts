import { expect, type Page, test } from '@playwright/test';
import { onDesktop } from './helpers/project';
import { fixture, seedStorage } from './helpers/seed';

// Epic 6 ticket 6.11 (CAP-10; DESIGN.md Focus ring): the keyboard focus ring, alone and together
// with the selection outline. Desktop only; baselines are generated and compared only in the
// Playwright container (npm run test:screens).

test.beforeEach(onDesktop);

async function boot(page: Page, name: string): Promise<void> {
  await seedStorage(page, { session: fixture(`${name}.json`) });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
  await page.evaluate(() => document.fonts.load('600 1em "WordCell Serif"', 'W'));
}

// Tabs until the focused element matches `selector`.
async function tabTo(page: Page, selector: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((s) => document.activeElement?.matches(s) === true, selector)) return;
  }
  throw new Error(`no Tab stop matches ${selector}`);
}

test('AD-17 keyboard focus ring on a column card (Idle)', async ({ page }) => {
  await boot(page, 'session-idle-fresh');
  await tabTo(page, '[data-column="2"] [data-place="column"]');
  await expect(page).toHaveScreenshot('keyboard-focused-column.png');
});

test('AD-17 keyboard focus ring with the tail selection outline (Idle)', async ({ page }) => {
  await boot(page, 'session-idle-fresh');
  await page.keyboard.press('3');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-column="3"] .lifted')).toHaveCount(2);
  await expect(page).toHaveScreenshot('keyboard-focused-selected.png');
});

test('AD-17 keyboard focus ring on a tray tile, alone and with the tile selected (Composing)', async ({
  page,
}) => {
  await boot(page, 'session-composing');
  await tabTo(page, '[data-place="tray"]');
  await expect(page).toHaveScreenshot('keyboard-focused-tile.png');
  await page.keyboard.press('Space');
  await expect(page.locator('[data-place="tray"].selected')).toHaveCount(1);
  await expect(page).toHaveScreenshot('keyboard-focused-tile-selected.png');
});

test('AD-17 keyboard focus ring on a WordCell (Idle)', async ({ page }) => {
  await boot(page, 'session-idle-empty-column');
  await tabTo(page, '[data-wordcell="7"]');
  await expect(page).toHaveScreenshot('keyboard-focused-cell.png');
});
