import { expect, type Page, test } from '@playwright/test';
import { text } from '../src/ui/text';
import { openFixture } from './helpers/board';
import { wc } from './helpers/dialogs';
import { onAndroid } from './helpers/project';
import { select } from './helpers/selection';

// Epic 6 ticket 6.9 (SPEC CAP-8; AD-3, AD-13, AD-14): the How to play panel from the Menu's last row.
// Fixtures (seed 1): `session-idle-fresh`, `session-gave-up` (end sheet expanded).

test.beforeEach(onAndroid);

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const menu = (page: Page) => page.getByRole('dialog', { name: 'Menu', exact: true });
const panel = (page: Page) => page.getByRole('dialog', { name: 'How to play', exact: true });
const h = text.howTo.headings;

async function openPanel(page: Page): Promise<void> {
  await menuButton(page).click();
  await menu(page).getByRole('button', { name: 'How to play', exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(menu(page)).toHaveCount(0);
}

const closers: readonly [string, (page: Page) => Promise<void>][] = [
  ['Esc', (page) => page.keyboard.press('Escape')],
  ['back', async (page) => void (await page.goBack())],
  [
    'the Close how to play control',
    (page) => panel(page).getByRole('button', { name: 'Close how to play', exact: true }).click(),
  ],
];

test('AD-3 the menu lists the six rows in order, then How to play opens the outline', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await menuButton(page).click();
  const rows = menu(page).locator('button.row');
  await expect(rows).toHaveText([
    'New game',
    'Replay this deal',
    'Give up',
    'Statistics',
    'Preferences',
    'How to play',
  ]);
  await rows.last().click();
  await expect(panel(page)).toBeVisible();
  const headings = panel(page).getByRole('heading');
  await expect(headings).toHaveText([text.howToPlay, ...Object.values(h)]);
  const example = panel(page).locator('section.example');
  for (const word of text.howTo.exampleWords) {
    await expect(example.getByText(text.howTo.exampleCaption(word), { exact: true })).toBeVisible();
  }
  for (const name of text.howTo.exampleWords.map(text.howTo.exampleCaption)) {
    expect(name).toMatch(/, [56] letters$/);
  }
  await expect(panel(page).locator('ul.bands li')).toHaveText(
    [0, 1, 2, 3, 4, 5].map((b) => `${text.bandName(b)}${text.bandScore(b)}`),
  );
  await expect(panel(page).locator('table')).toHaveCount(3);
  for (const caption of Object.values(text.howTo.controlCaptions)) {
    await expect(panel(page).locator('caption', { hasText: caption })).toHaveCount(1);
  }
  for (const sentence of text.howTo.undo) {
    await expect(panel(page).getByText(sentence, { exact: true })).toBeVisible();
  }
  await expect(panel(page).getByText(text.howTo.empty[0], { exact: true })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: /^(Cancel|Hint)/ })).toHaveCount(0);
});

for (const [name, close] of closers) {
  test(`AD-13 closing How to play by ${name} returns focus to the menu button, one history entry`, async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
    await close(page);
    await expect(panel(page)).toHaveCount(0);
    await expect(menuButton(page)).toBeFocused();
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
  });
}

test('AD-13 opening with a tail selected clears the selection; one back closes the panel', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await select(page, 1, 0);
  await openPanel(page);
  await expect(page.locator('[data-selection-outline]')).toHaveCount(0);
  await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
  await page.goBack();
  await expect(panel(page)).toHaveCount(0);
  await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
});

test('AD-13 a reopened panel starts scrolled to the top', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const content = page.locator('.panel .content');
  await content.evaluate((el) => {
    el.scrollTop = 400;
  });
  expect(await content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await openPanel(page);
  await expect.poll(() => page.locator('.panel .content').evaluate((el) => el.scrollTop)).toBe(0);
});

test('AD-13 from Game over the panel closes with focus on the menu button and the end sheet expanded', async ({
  page,
}) => {
  await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
  await openPanel(page);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(menuButton(page)).toBeFocused();
  await expect(page.getByRole('button', { name: 'Collapse result', exact: true })).toBeVisible();
});

test('AD-14 at 360 px the page scrolls vertically only; the example cards are static, the 52 live cards stay one element each', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const content = page.locator('.panel .content');
  expect(await content.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await content.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const rowsFit = await panel(page)
    .locator('.word')
    .evaluateAll((els) => els.map((el) => el.scrollWidth <= el.clientWidth));
  expect(rowsFit).toEqual([true, true, true, true]);
  await expect(panel(page).locator('[data-card-id]')).toHaveCount(0);
  await expect(panel(page).locator('[data-testid^="card-"]')).toHaveCount(0);
  await expect(panel(page).locator('[data-mirror-of]')).toHaveCount(0);
  const cards = panel(page).locator('.word .card');
  await expect(cards).toHaveCount(22);
  await expect(cards.first()).toHaveAttribute('aria-hidden', 'true');
  expect(
    await cards.evaluateAll((els) => els.map((el) => getComputedStyle(el).touchAction)),
  ).toEqual(Array(22).fill('pan-y'));
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});
