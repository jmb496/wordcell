import { expect, type Locator, type Page, test } from '@playwright/test';
import { cards, centre, END_SHEET, openFixture, tapAt } from './helpers/board';
import { notice, wc } from './helpers/dialogs';
import { expectBoardFocus } from './helpers/keys';
import { onDesktop } from './helpers/project';
import { fixture, seedStorage } from './helpers/seed';
import { select } from './helpers/selection';
import { cursorIndex, game } from './helpers/session';

// Epic 6 entry 10 (ticket 6.10, SPEC CAP-10; Q-24, A-E7, F39, I-68): the overlay and undo keys on
// desktop. Fixtures (seed 1): `session-idle-fresh` (Idle, no moves), `session-idle-empty-column`
// (Idle, one move, Undo enabled, cell 7 holds 7 cards), `session-place-free-letter-redo-tail`
// (Place, a Redo tail), `session-composing` (a tile can be selected), `session-place`,
// `session-won`.

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
type Stored = { seed: number; moves: unknown[]; gaveUp: boolean };
const parsed = async (page: Page) => JSON.parse((await storedText(page)) ?? 'null') as Stored;
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const resultBar = (page: Page) => page.getByRole('button', { name: /^Show result:/ });

type Closer = readonly [string, (page: Page) => Promise<void>];
const MENU_CLOSERS: readonly Closer[] = [
  ['Esc', (page) => page.keyboard.press('Escape')],
  ['back', async (page) => void (await page.goBack())],
  ['a scrim tap', (page) => page.mouse.click(5, 5)],
  ['Close menu', (page) => page.getByRole('button', { name: 'Close menu', exact: true }).click()],
];
const CONFIRM_CLOSERS: readonly Closer[] = [
  [
    'Keep playing',
    (page) =>
      newGameConfirm(page).getByRole('button', { name: 'Keep playing', exact: true }).click(),
  ],
  ['Esc', (page) => page.keyboard.press('Escape')],
  ['back', async (page) => void (await page.goBack())],
  ['a scrim tap', (page) => page.mouse.click(5, 5)],
];

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
    // `?` as a US layout produces it: Shift+/ (key `?`, shiftKey true).
    await page.keyboard.press('Shift+Slash');
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
    await expectBoardFocus(page);
  });

  // build-notes surface table, Confirm dialog focus return: the board, not the opener. Column 1 is
  // empty, so the board is column 2's bottom card, not the column 8 card focused before N.
  test('Q-24 N with a column card focused, then Keep playing, returns focus to the board, not that card', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const before = await storedText(page);
    const card = cards(page, 8).last();
    await card.focus();
    await page.keyboard.press('n');
    await expect(newGameConfirm(page)).toBeVisible();
    await newGameConfirm(page).getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(newGameConfirm(page)).toHaveCount(0);
    await expectBoardFocus(page);
    await expect(card).not.toBeFocused();
    expect(await storedText(page)).toBe(before);
  });

  test('Q-24 N with nothing to lose starts a new game at once', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    const { seed } = await parsed(page);
    await page.keyboard.press('n');
    await expect.poll(async () => (await parsed(page)).seed).not.toBe(seed);
    await expect(newGameConfirm(page)).toHaveCount(0);
    expect((await parsed(page)).moves).toEqual([]);
    await expect(page.getByTestId('undo')).toBeDisabled();
  });

  // Ticket 6.11 Focus: a New game that acts at once focuses the new deal's board (focus-board.ts).
  test('Q-24 N with nothing to lose and a column card focused focuses the new deal board', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const { seed } = await parsed(page);
    await cards(page, 1).last().focus();
    await page.keyboard.press('n');
    await expect.poll(async () => (await parsed(page)).seed).not.toBe(seed);
    await expectBoardFocus(page);
  });

  test('AD-13 ? with a column card focused: Esc closes How to play and returns focus to that card, not the menu button', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const card = cards(page, 1).last();
    await card.focus();
    await page.keyboard.press('?');
    await expect(howTo(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(howTo(page)).toHaveCount(0);
    await expect(card).toBeFocused();
    await expect(menuButton(page)).not.toBeFocused();
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

// SPEC F12: dismissing the menu or an N-opened New game confirm focuses by the phase
// (focus-board.ts `focusByPhase`), the same target as the History notice's close (SPEC F13), not
// the opener or a column card. Each round starts from a focused column card.
for (const [fixture, place] of [
  ['session-composing', 'tray'],
  ['session-place', 'strip'],
] as const) {
  test.describe(`phase focus after a dismissal in ${fixture}`, () => {
    const first = (page: Page) => page.locator(`[data-card-id][data-place="${place}"]`).first();
    const columnCard = (page: Page) => page.locator('[data-card-id][data-place="column"]').first();

    test(`AD-13 M then Esc, back, a scrim tap or Close menu focuses the first ${place} item`, async ({
      page,
    }) => {
      await openFixture(page, fixture);
      const before = await storedText(page);
      for (const [how, close] of MENU_CLOSERS) {
        await columnCard(page).focus();
        await page.keyboard.press('m');
        await expect(menu(page)).toBeVisible();
        await close(page);
        await expect(menu(page), how).toHaveCount(0);
        await expect(first(page), how).toBeFocused();
      }
      expect(await storedText(page)).toBe(before);
    });

    test(`AD-13 N then Keep playing, Esc, back or a scrim tap focuses the first ${place} item`, async ({
      page,
    }) => {
      await openFixture(page, fixture);
      const before = await storedText(page);
      for (const [how, close] of CONFIRM_CLOSERS) {
        await columnCard(page).focus();
        await page.keyboard.press('n');
        await expect(newGameConfirm(page)).toBeVisible();
        await close(page);
        await expect(newGameConfirm(page), how).toHaveCount(0);
        await expect(first(page), how).toBeFocused();
      }
      expect(await storedText(page)).toBe(before);
    });
  });
}

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

  // A mouse long press (classify.ts `longPressTimed` is pointer-type agnostic) on the paused page
  // clock, as e2e/wordcell-view.spec.ts drives it.
  test('F39 M during a long-press peek closes the peek and opens the menu; the release and its click leave the menu open, no page error', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await openFixture(page, 'session-idle-empty-column');
    const before = await storedText(page);
    await page.mouse.move(...(await pointOf(page.getByTestId('wordcell-7'))));
    await page.mouse.down();
    await page.clock.runFor(400);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'peek');
    await page.keyboard.press('m');
    await expect(menu(page)).toBeVisible();
    await expect(sheet(page)).toHaveCount(0);
    await page.mouse.up();
    await page.clock.runFor(1000);
    await expect(menu(page)).toBeVisible();
    await expect(sheet(page)).toHaveCount(0);
    expect(await storedText(page)).toBe(before);
    expect(errors).toEqual([]);
  });

  // The fixture's Undo is enabled (one committed move), so its disabled history control is Redo
  // (no redo tail): Y is the key that does not act with a sticky view open.
  test('F39 Y with Redo disabled and a sticky WordCell view open does nothing: the view stays open, no page error', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await openFixture(page, 'session-idle-empty-column');
    const before = await storedText(page);
    await tapAt(page, await centre(page.getByTestId('wordcell-7')));
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    await expect(page.getByTestId('redo')).toBeDisabled();
    await page.keyboard.press('y');
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    expect((await wc(page))?.wc).toBe(1);
    expect(await storedText(page)).toBe(before);
    expect(errors).toEqual([]);
  });

  test('Q-24 a tile selection survives a key that does not act; Esc clears it', async ({
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
  });

  // From Place (session-place, strip 42 0 28): Z goes to Composing, where the selected strip card
  // 42 is a tray tile again, so a stale selection would show there.
  test('Q-24 a tile selection clears when Z changes the phase (Place to Composing); one tap then selects one tile', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await openFixture(page, 'session-place');
    const strip = page.locator('[data-band="tray"] [data-card-id][data-place="strip"]');
    await tapAt(page, await centre(strip.first()));
    await expect(selectedTiles(page)).toHaveCount(1);
    const before = await game(page);
    await page.keyboard.press('z');
    await expect.poll(() => game(page)).not.toBe(before);
    const tile = page.locator('[data-band="tray"] [data-card-id="42"][data-place="tray"]');
    await expect(tile).toHaveCount(1);
    await expect(selectedTiles(page)).toHaveCount(0);
    await tapAt(page, await centre(tile));
    await expect(selectedTiles(page)).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('R-75 Esc collapses the expanded end sheet; M and ? stay live over it', async ({ page }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const sheet = page.getByRole('dialog', { name: END_SHEET });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('m');
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu(page)).toHaveCount(0);
    await expect(sheet).toBeVisible();
    await page.keyboard.press('?');
    await expect(howTo(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(howTo(page)).toHaveCount(0);
    await expect(sheet).toBeVisible();
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
  });

  test('R-75 N over the expanded end sheet acts at once (no game in progress) and starts a new game', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const sheet = page.getByRole('dialog', { name: END_SHEET });
    await expect(sheet).toBeVisible();
    const { seed } = await parsed(page);
    await page.keyboard.press('n');
    await expect.poll(async () => (await parsed(page)).seed).not.toBe(seed);
    await expect(sheet).toHaveCount(0);
    await expect(resultBar(page)).toHaveCount(0);
    await expect(newGameConfirm(page)).toHaveCount(0);
    const after = await parsed(page);
    expect(after.moves).toEqual([]);
    expect(after.gaveUp).toBe(false);
  });

  test('AD-13 ? over the expanded end sheet: Esc closes How to play and returns focus to Replay this deal', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const replay = page.getByRole('button', { name: 'Replay this deal', exact: true });
    await expect(replay).toBeFocused();
    await page.keyboard.press('?');
    await expect(howTo(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(howTo(page)).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: END_SHEET })).toBeVisible();
    await expect(replay).toBeFocused();
  });

  // SPEC F10: the board is inert under the expanded end sheet, so the menu returns focus to ☰.
  test('AD-13 the menu over the expanded end sheet, closed by Esc, back, a scrim tap or Close menu, returns focus to the menu button', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const endSheet = page.getByRole('dialog', { name: END_SHEET });
    for (const [, close] of MENU_CLOSERS) {
      await page.keyboard.press('m');
      await expect(menu(page)).toBeVisible();
      await close(page);
      await expect(menu(page)).toHaveCount(0);
      await expect(endSheet).toBeVisible();
      await expect(menuButton(page)).toBeFocused();
    }
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
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

  // A History-notice flow (AGENTS.md fixtures): a relaunch into session-won with an unreadable
  // history puts the notice over the expanded end sheet at wc 2 (nav.spec.ts, Not now and back).
  test('I-68 Esc on the History notice over the expanded end sheet closes only the notice: the sheet stays expanded at wc 1, focus on Replay this deal', async ({
    page,
  }) => {
    await seedStorage(page, {
      session: fixture('session-won.json'),
      history: fixture('history-invalid-version-unknown.json'),
    });
    await page.goto('/');
    await expect(notice(page)).toBeVisible();
    const sheet = page.getByRole('dialog', { name: END_SHEET });
    await expect(sheet).toHaveCount(1);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(2);
    await page.keyboard.press('Escape');
    await expect(notice(page)).toHaveCount(0);
    await expect(sheet).toBeVisible();
    await expect(resultBar(page)).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
    await expect(
      sheet.getByRole('button', { name: 'Replay this deal', exact: true }),
    ).toBeFocused();
  });
});
