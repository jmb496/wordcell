import { expect, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';

test('AD-17 minimal board renders 52 live card elements with AD-14 attributes', async ({
  page,
}) => {
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
  await expect(column1).toHaveText(['L', 'D', 'X', 'O', 'M', 'I', 'W']);
  await expect(page.getByTestId('column-8').getByTestId(/^card-\d+$/)).toHaveCount(6);
  for (let cell = 3; cell <= 10; cell++) {
    await expect(page.getByTestId(`wordcell-${cell}`)).toBeVisible();
    await expect(page.getByTestId(`wordcell-${cell}`)).toHaveAccessibleName(`WordCell ${cell}`);
  }
  await expect(page.getByTestId('app')).toHaveCount(0);
  await expect(page.getByText('Seed 1', { exact: true })).toBeVisible();
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
  await seedStorage(page, { session: fixture('session-place-free-letter-redo-tail.json') });
  await page.goto('/');
  // Cell 3 holds the committed first move, bottom → top (view(...).cells for cell 3).
  const cell3 = page.getByTestId('wordcell-3').getByTestId(/^card-\d+$/);
  await expect(cell3).toHaveCount(3);
  expect(
    await cell3.evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id'))),
  ).toEqual(['42', '0', '28']);
  // Visually bottom → top too: card 42 sits lowest on screen.
  const y = async (id: number) => {
    const box = await page.getByTestId(`card-${id}`).boundingBox();
    if (box === null) throw new Error(`card-${id} has no box`);
    return box.y;
  };
  const [y42, y0, y28] = [await y(42), await y(0), await y(28)];
  expect(y42).toBeGreaterThan(y0);
  expect(y0).toBeGreaterThan(y28);
  for (const card of await cell3.all()) {
    await expect(card).toHaveAttribute('data-place', 'cell');
  }
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(page.locator('[data-mirror-of]')).toHaveCount(0);
});
