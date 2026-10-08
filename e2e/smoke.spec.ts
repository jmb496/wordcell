import { expect, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';

test('AD-17 board renders 52 live card elements with AD-14 attributes', async ({ page }) => {
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  const cards = page.getByTestId(/^card-\d+$/);
  await expect(cards).toHaveCount(52);
  const ids: number[] = [];
  for (const card of await cards.all()) {
    const testId = await card.getAttribute('data-testid');
    const id = Number(testId?.slice('card-'.length));
    expect(await card.getAttribute('data-card-id')).toBe(String(id));
    expect(await card.getAttribute('data-place')).toBe('column');
    ids.push(id);
  }
  expect(new Set(ids)).toEqual(new Set(Array.from({ length: 52 }, (_, i) => i)));
  // Seed 1, column 1 top → bottom (view(createSession(1), EN)).
  const column1 = page.getByTestId('column-1').getByTestId(/^card-\d+$/);
  await expect(column1).toHaveCount(7);
  expect(
    await column1.evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id'))),
  ).toEqual(['24', '6', '49', '30', '25', '20', '48']);
  await expect(page.getByTestId('column-8').getByTestId(/^card-\d+$/)).toHaveCount(6);
  for (let cell = 3; cell <= 10; cell++) {
    await expect(page.getByTestId(`wordcell-${cell}`)).toBeVisible();
    await expect(page.getByTestId(`wordcell-${cell}`)).toHaveAccessibleName(`WordCell ${cell}`);
  }
  await expect(page.getByTestId('app')).toHaveCount(0);
  const current = await page.evaluate(() => window.__wordcell?.current());
  expect(current?.kind === 'active' && current.session.seed).toBe(1);
  for (const name of ['Undo', 'Redo']) {
    const button = page.getByRole('button', { name, exact: true });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('data-testid', name.toLowerCase());
    const box = await button.boundingBox();
    expect(box && { width: box.width, height: box.height }).toEqual({ width: 44, height: 44 });
  }
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(page.locator('[data-mirror-of]')).toHaveCount(0);
});

test('AD-17 WordCell cards render bottom → top as live cell cards', async ({ page }) => {
  test.skip(test.info().project.name !== 'android', 'AD-17 cell rendering runs on android');
  await seedStorage(page, { session: fixture('session-idle-empty-column.json') });
  await page.goto('/');
  // Cell 7 holds the committed column 1, bottom → top (view(...).cells for cell 7).
  const cell7 = page.getByTestId('wordcell-7').locator('[data-card-id]');
  await expect(cell7).toHaveCount(7);
  expect(
    await cell7.evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id'))),
  ).toEqual(['24', '6', '49', '30', '25', '20', '48']);
  // Only the top card is visible; the cards beneath stay live but hidden (build-notes CAP-2).
  await expect(page.getByTestId('card-48')).toBeVisible();
  for (const id of [24, 6, 49, 30, 25, 20]) {
    await expect(page.getByTestId(`card-${id}`)).toBeHidden();
  }
  for (const card of await cell7.all()) {
    await expect(card).toHaveAttribute('data-place', 'cell');
  }
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(page.locator('[data-mirror-of]')).toHaveCount(0);
  const cursor = await page.evaluate(() => {
    const current = window.__wordcell?.current();
    return current?.kind === 'active' ? current.session.cursor : null;
  });
  expect(cursor).toEqual({ index: 1, phase: 'idle' });
});

test('R-03 the dealt layout renders top → bottom in every column', async ({ page }) => {
  test.skip(test.info().project.name !== 'android', 'R-03 runs on android');
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  const expected: Record<number, string[]> = {
    1: ['L', 'D', 'X', 'O', 'M', 'I', 'W'],
    2: ['T', 'N', 'P', 'D', 'V', 'I', 'M'],
    3: ['L', 'QU', 'E', 'J', 'A', 'T', 'A'],
    4: ['E', 'K', 'G', 'H', 'H', 'I', 'O'],
    5: ['T', 'S', 'C', 'F', 'S', 'Z'],
    6: ['O', 'P', 'N', 'A', 'E', 'N'],
    7: ['Y', 'E', 'U', 'R', 'H', 'F'],
    8: ['S', 'B', 'R', 'R', 'C', 'U'],
  };
  for (const [column, letters] of Object.entries(expected)) {
    const glyphs = await page
      .getByTestId(`column-${column}`)
      .locator('[data-card-id] .glyph')
      .evaluateAll((els) => els.map((el) => (el.textContent ?? '').toUpperCase()));
    expect(glyphs, `column ${column}`).toEqual(letters);
    // DOM order is visual order: card wrapper tops strictly increase down the column.
    const tops = await page
      .getByTestId(`column-${column}`)
      .locator('[data-card-id]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i], `column ${column} card ${i}`).toBeGreaterThan(tops[i - 1] as number);
    }
  }
});
