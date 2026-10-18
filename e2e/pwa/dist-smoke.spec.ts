import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { walk } from '../helpers/dist-test';
import { fixture, seedStorage } from '../helpers/seed';

test('AD-18 production build loads with 52 live cards, no errors and no test hook', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack ?? error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()} @ ${msg.location().url}`);
  });
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

test('Q-45 AD-10 the production Theme radiogroup offers Charcoal only, applied as default', async ({
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
  await expect(group.getByRole('radio')).toHaveCount(1);
  await expect(group.getByRole('radio', { name: 'Charcoal' })).toBeChecked();
});
