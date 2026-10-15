import { expect, type Page, test } from '@playwright/test';
import { onAndroid } from './helpers/project';
import { openBoard } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';

// Epic 6 ticket 6.5 (build-notes Screens specs): the Statistics panel with values, empty and
// unreadable, and the top bar with the menu dot, at 360 px. android; baselines are generated and
// compared only in the Playwright container (npm run test:screens).

test.beforeEach(onAndroid);

async function open(page: Page, history: string): Promise<void> {
  await page.setViewportSize({ width: 360, height: 740 });
  // A seeded Session keeps the dealt board (seen behind the top bar) the same on every run.
  await seedStorage(page, { history, session: fixture('session-idle-fresh.json') });
  await openBoard(page);
}

async function openPanel(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Statistics', exact: true })).toBeVisible();
}

test('AD-17 statistics panel with values screenshot at 360 px', async ({ page }) => {
  await open(page, fixture('history-three-records.json'));
  await openPanel(page);
  await expect(page.getByText('LQUEJATA')).toBeVisible();
  await expect(page).toHaveScreenshot('statistics-values.png');
});

test('AD-17 statistics panel empty screenshot at 360 px', async ({ page }) => {
  await open(page, '{"version":1,"records":[]}');
  await openPanel(page);
  await expect(page.getByText('Finish or give up a game to see statistics here.')).toBeVisible();
  await expect(page).toHaveScreenshot('statistics-empty.png');
});

test('AD-17 statistics panel unreadable screenshot at 360 px', async ({ page }) => {
  await open(page, fixture('history-invalid-version-unknown.json'));
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await openPanel(page);
  await expect(page.getByRole('button', { name: 'Reset history', exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot('statistics-unreadable.png');
});

test('AD-17 top bar with the menu dot screenshot at 360 px', async ({ page }) => {
  await open(page, fixture('history-invalid-version-unknown.json'));
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
  await expect(page).toHaveScreenshot('top-bar-dot.png');
});
