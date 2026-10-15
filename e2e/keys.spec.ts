import { expect, type Locator, type Page, test } from '@playwright/test';
import { centre, END_SHEET, openFixture, tapAt } from './helpers/board';
import { wc } from './helpers/dialogs';
import { onDesktop } from './helpers/project';
import { select } from './helpers/selection';
import { cursorIndex, game } from './helpers/session';

// Epic 6 entry 10 (ticket 6.10, SPEC CAP-10; Q-24, A-E7, F39, I-68): the overlay and undo keys on
// desktop. Fixtures (seed 1): `session-idle-fresh` (Idle, no moves), `session-idle-empty-column`
// (Idle, one move, Undo enabled, cell 7 holds 7 cards), `session-place-free-letter-redo-tail`
// (Place, a Redo tail), `session-composing` (a tile can be selected).

test.beforeEach(onDesktop);

const SESSION = 'wordcell:session';
const pointOf = async (locator: Locator) => {
  const at = await centre(locator);
  return [at.x, at.y] as const;
};
const menu = (page: Page) => page.getByRole('dialog', { name: 'Menu', exact: true });
const howTo = (page: Page) => page.getByRole('dialog', { name: 'How to play', exact: true });
const newGameConfirm = (page: Page) =>
  page.getByRole('dialog', { name: 'Start a new game?', exact: true });
const sheet = (page: Page) => page.locator('[data-view-sheet]');
const storedText = (page: Page) => page.evaluate((key) => localStorage.getItem(key), SESSION);

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.describe('opening and closing surfaces', () => {
  test('Q-24 M opens the menu and Esc closes it; ? opens How to play and Esc closes it', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await openFixture(page, 'session-idle-empty-column');
    await page.keyboard.press('m');
    await expect(menu(page)).toBeVisible();
    expect((await wc(page))?.wc).toBe(1);
    await page.keyboard.press('Escape');
    await expect(menu(page)).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
    await page.keyboard.press('?');
    await expect(howTo(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(howTo(page)).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
    expect(errors).toEqual([]);
  });

  test('Q-24 N on a game in progress opens the New game confirm; Esc closes only it (I-68: the board, no menu)', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const before = await storedText(page);
    await page.keyboard.press('n');
    await expect(newGameConfirm(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(newGameConfirm(page)).toHaveCount(0);
    await expect(menu(page)).toHaveCount(0);
    expect(await storedText(page)).toBe(before);
  });

  test('Q-24 N with nothing to lose starts a new game at once', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    await page.keyboard.press('n');
    await expect(newGameConfirm(page)).toHaveCount(0);
    await expect(page.getByTestId('undo')).toBeDisabled();
  });

  test('Q-24 game keys do nothing under an open panel while Tab still works; Esc closes it', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await page.keyboard.press('m');
    await expect(menu(page)).toBeVisible();
    const before = await storedText(page);
    for (const key of ['m', 'n', '?', 'z', 'y', 'Control+z']) await page.keyboard.press(key);
    await expect(menu(page)).toBeVisible();
    await expect(newGameConfirm(page)).toHaveCount(0);
    await expect(howTo(page)).toHaveCount(0);
    expect(await storedText(page)).toBe(before);
    const first = await page.evaluate(() => document.activeElement?.textContent);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent)).not.toBe(first);
    await page.keyboard.press('Escape');
    await expect(menu(page)).toHaveCount(0);
  });
});

test.describe('Undo and Redo keys', () => {
  test('Q-24 Z and Ctrl+Z undo; Y, Ctrl+Y and Ctrl+Shift+Z redo, only when the control is enabled', async ({
    page,
  }) => {
    await openFixture(page, 'session-place-free-letter-redo-tail');
    const redo = page.getByTestId('redo');
    await expect(redo).toBeEnabled();
    const tail = await game(page);
    await page.keyboard.press('z');
    await expect.poll(() => game(page)).not.toBe(tail);
    const undone = await game(page);
    await page.keyboard.press('y');
    await expect.poll(() => game(page)).toBe(tail);
    await page.keyboard.press('Control+z');
    await expect.poll(() => game(page)).toBe(undone);
    await page.keyboard.press('Control+Shift+z');
    await expect.poll(() => game(page)).toBe(tail);
    await page.keyboard.press('z');
    await expect.poll(() => game(page)).toBe(undone);
    await page.keyboard.press('Control+y');
    await expect.poll(() => game(page)).toBe(tail);
  });

  test('Q-24 Y, Ctrl+Y, Ctrl+Shift+Z and Z do nothing while Redo and Undo are disabled', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await expect(page.getByTestId('redo')).toBeDisabled();
    await expect(page.getByTestId('undo')).toBeDisabled();
    const before = await game(page);
    for (const key of ['y', 'Control+y', 'Control+Shift+z', 'z', 'Control+z']) {
      await page.keyboard.press(key);
    }
    expect(await game(page)).toBe(before);
  });

  test('F39 Z with a sticky WordCell view open closes the view and undoes, no page error', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await openFixture(page, 'session-idle-empty-column');
    const start = await cursorIndex(page);
    await tapAt(page, await centre(page.getByTestId('wordcell-7')));
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    await page.keyboard.press('z');
    await expect(sheet(page)).toHaveCount(0);
    await expect.poll(() => cursorIndex(page)).toBe(start - 1);
    expect(errors).toEqual([]);
  });

  test('F39 M with a sticky WordCell view open closes the view and opens the menu, no page error', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await openFixture(page, 'session-idle-empty-column');
    await tapAt(page, await centre(page.getByTestId('wordcell-7')));
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    await page.keyboard.press('m');
    await expect(menu(page)).toBeVisible();
    await expect(sheet(page)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('F39 Z with a tail selected pops the selection and undoes, no page error', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await openFixture(page, 'session-idle-empty-column');
    const start = await cursorIndex(page);
    await select(page, 2, 0);
    await page.keyboard.press('z');
    await expect.poll(() => cursorIndex(page)).toBe(start - 1);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
    expect(errors).toEqual([]);
  });
});

test.describe('Esc order', () => {
  test('Q-24 Esc pops a tail selection, and with nothing open does nothing', async ({ page }) => {
    await openFixture(page, 'session-idle-empty-column');
    const before = await storedText(page);
    await page.keyboard.press('Escape');
    expect((await wc(page))?.wc).toBe(0);
    await select(page, 2, 0);
    await page.keyboard.press('Escape');
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
    expect(await storedText(page)).toBe(before);
  });

  test('Q-24 Esc closes How to play; the next Esc, with nothing open, does nothing', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await page.keyboard.press('?');
    await expect(howTo(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(howTo(page)).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
    await page.keyboard.press('Escape');
    expect((await wc(page))?.wc).toBe(0);
  });
});

const hoverPeek = (page: Page) => page.locator('[data-hover-peek]');
const trayTiles = (page: Page) => page.locator('[data-band="tray"] [data-card-id]');
const selectedTiles = (page: Page) => page.locator('[data-band="tray"] [data-card-id].selected');

test.describe('peeks, tile selection and the end sheet', () => {
  test('F39 M while a hover peek is open closes the peek and opens the menu, no page error', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await openFixture(page, 'session-idle-empty-column');
    await page.mouse.move(...(await pointOf(page.getByTestId('wordcell-7'))));
    await expect(hoverPeek(page)).toBeVisible();
    await page.keyboard.press('m');
    await expect(menu(page)).toBeVisible();
    await expect(hoverPeek(page)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('Q-24 a tile selection survives a key that does not act and clears when Z changes the phase; Esc clears it', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    await tapAt(page, await centre(trayTiles(page).first()));
    await expect(selectedTiles(page)).toHaveCount(1);
    // Redo is disabled here: Y does nothing at all, the selection stays.
    await expect(page.getByTestId('redo')).toBeDisabled();
    await page.keyboard.press('y');
    await expect(selectedTiles(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(selectedTiles(page)).toHaveCount(0);
    await tapAt(page, await centre(trayTiles(page).first()));
    await expect(selectedTiles(page)).toHaveCount(1);
    const before = await game(page);
    await page.keyboard.press('z');
    await expect.poll(() => game(page)).not.toBe(before);
    await expect(selectedTiles(page)).toHaveCount(0);
  });

  test('R-75 Esc collapses the expanded end sheet; M, N and ? stay live over it', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const sheet = page.getByRole('dialog', { name: END_SHEET });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('m');
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu(page)).toHaveCount(0);
    await expect(sheet).toBeVisible();
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
  });

  test('I-68 Esc on the New game confirm opened from the menu closes only the confirm: the menu is not reopened', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await page.keyboard.press('m');
    await menu(page).getByRole('button', { name: 'New game', exact: true }).click();
    await expect(newGameConfirm(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(newGameConfirm(page)).toHaveCount(0);
    await expect(menu(page)).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
  });
});
