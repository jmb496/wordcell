import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('AD-18 production build loads with 52 live cards, no errors and no test hook', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack ?? error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()} @ ${msg.location().url}`);
  });
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
  const files = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)));
  expect(files).toContain('index.html');
  expect(files.some((file) => /^assets\/[^/]+\.js$/.test(file))).toBe(true);
  const hits = files.filter((file) =>
    readFileSync(path.join(root, file), 'latin1').includes('__wordcell'),
  );
  expect(hits).toEqual([]);
});
