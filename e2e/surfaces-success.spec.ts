import { expect, type Page, test } from '@playwright/test';
import { EN, parseSession, view } from '../src/engine/index';
import { bandNames } from '../src/ui/text';
import { cards, centre, column, openFixture, tapAt } from './helpers/board';
import { arrangeByKeys, press, toComposing, tray } from './helpers/keys';
import { animationFrames } from './helpers/lifecycle';
import { onAndroid, onDesktop } from './helpers/project';
import { booted, waitForDictionary } from './helpers/restore';
import { game, storedGame, storedText } from './helpers/session';

// Epic 6 ticket 6.15 (the epic's Success signal; SPEC CAP-1, CAP-2, CAP-3, CAP-4, CAP-6, CAP-7, CAP-8,
// CAP-10; R-62, R-73, R-75, R-76, R-81, Q-24, I-68): finish a game and play by keyboard. A and B
// run on `android`, Flow 6 on `desktop`. Fixtures: `session-idle-empty-column` (seed 1, column 1
// empty, Idle), `session-won` plus one Undo (the Place phase whose Confirm wins), `SESSIONS.flow6`.
// Expected values are literals, or `view()` over the stored Session where the story names it.
// After every dispatching step, `synced` polls the stored Session to equal the store's (R-73).

const WIN = 'Every column cleared.';
const GAVE = 'Game given up.';
const W = 48;

const sheet = (page: Page, title: string) => page.getByRole('dialog', { name: title, exact: true });
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const menu = (page: Page) => page.getByRole('dialog', { name: 'Menu', exact: true });
const primary = (page: Page) => page.getByTestId('primary-action');
const timer = (page: Page) => page.locator('[data-band="topBar"] .timer');
const stats = (page: Page) => page.getByRole('dialog', { name: 'Statistics', exact: true });
const prefs = (page: Page) => page.getByRole('dialog', { name: 'Preferences', exact: true });
const howTo = (page: Page) => page.getByRole('dialog', { name: 'How to play', exact: true });

// The stored Session equals the store's (both without activeMs), re-read each time.
async function synced(page: Page): Promise<void> {
  await expect.poll(async () => (await storedGame(page)) === (await game(page))).toBe(true);
}

// view() over the stored Session.
async function storedView(page: Page) {
  const text = await storedText(page);
  if (text === null) throw new Error('wordcell:session is absent');
  const parsed = parseSession(text, EN);
  if (!parsed.ok) throw new Error(`stored session does not parse: ${parsed.reason}`);
  return view(parsed.session, EN);
}

async function menuRow(page: Page, name: string): Promise<void> {
  await menuButton(page).click();
  await menu(page).getByRole('button', { name, exact: true }).click();
  await expect(menu(page)).toHaveCount(0);
}

// The Statistics tiles as label -> value.
async function statTiles(page: Page): Promise<string[][]> {
  return stats(page)
    .locator('.tile')
    .evaluateAll((els) =>
      els.map((el) => [...el.querySelectorAll('p')].map((p) => p.textContent ?? '')),
    );
}

async function tapPrimary(page: Page, label: string): Promise<void> {
  await expect(primary(page)).toHaveText(label);
  await tapAt(page, await centre(primary(page)));
}

const tile = (page: Page, id: number) => tray(page).getByTestId(`card-${id}`);

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-73 R-75 R-76 R-81 Success signal android: give up, sheet, reload, New game', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await waitForDictionary(page, 'ready');
    await synced(page);
    const topScore = page.locator('.top-bar .score');
    await expect(topScore).toHaveText('Score 49');

    // 1: ANEW by taps only: tail 1, 9, 28 of column 6 to the column 1 placeholder, W on cell 7.
    const count = await cards(page, 6).count();
    await tapAt(page, await centre(cards(page, 6).nth(count - 3)));
    await tapAt(page, await centre(column(page, 1).locator('[data-placeholder]')));
    await expect(tray(page).locator('[data-card-id]')).toHaveCount(3);
    await synced(page);
    await tapAt(page, await centre(page.getByTestId('wordcell-7').getByTestId(`card-${W}`)));
    await expect(tray(page).locator('[data-card-id]')).toHaveCount(4);
    await synced(page);
    await tapAt(page, await centre(tile(page, 9)));
    await tapAt(page, await centre(tile(page, 28)));
    await synced(page);
    await tapPrimary(page, 'Validate');
    await expect(page.getByTestId('wordcell-4')).toHaveClass(/target/);
    await synced(page);
    await tapPrimary(page, 'Confirm');
    await expect(topScore).toHaveText('Score 58');
    await synced(page);

    // 2: Give up from the menu (no confirm, A-E10, R-75).
    await menuRow(page, 'Give up');
    await expect(sheet(page, GAVE)).toBeVisible();
    await synced(page);
    const v = await storedView(page);
    expect(v.status).toBe('gaveUp');
    expect(v.finalScore).toBe(-372);
    expect(v.lettersLeft).toBe(43);
    expect(v.penalty).toBe(430);
    expect(v.band).toBe(0);
    await expect(sheet(page, GAVE).locator('.score')).toHaveText('−372');
    await expect(
      sheet(page, GAVE).getByText('43 letters left: −430', { exact: true }),
    ).toBeVisible();
    await expect(sheet(page, GAVE)).toContainText(bandNames()[0] as string);
    const longest = v.longestWord?.spelling.toUpperCase();
    expect(longest).toBeDefined();
    await expect(sheet(page, GAVE).locator('dd').nth(0)).toHaveText(longest as string);
    await expect(sheet(page, GAVE).locator('dd').nth(1)).toHaveText(String(v.wordCount));

    // 3: Statistics from the sheet, then collapse and expand the sheet.
    await sheet(page, GAVE).getByRole('button', { name: 'Statistics', exact: true }).click();
    await expect(stats(page)).toBeVisible();
    expect((await statTiles(page))[0]).toEqual(['Games played', '1']);
    await stats(page).getByRole('button', { name: 'Close statistics', exact: true }).click();
    await expect(stats(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Collapse result', exact: true }).click();
    await expect(sheet(page, GAVE)).toHaveCount(0);
    await page.getByRole('button', { name: /^Show result:/ }).click();
    await expect(sheet(page, GAVE)).toBeVisible();
    await synced(page);

    // 4: reload into Game over with the sheet expanded and no animation running (R-73).
    await page.reload();
    await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
    await booted(page);
    await expect(sheet(page, GAVE)).toBeVisible();
    expect((await storedView(page)).status).toBe('gaveUp');
    await expect(page.getByRole('button', { name: 'Collapse result', exact: true })).toBeVisible();
    await animationFrames(page, 2);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await synced(page);

    // 5: New game from the menu, no confirm for a finished game.
    await menuRow(page, 'New game');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Collapse result', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Show result:/ })).toHaveCount(0);
    await expect
      .poll(async () => {
        const s = JSON.parse(await game(page)) as { seed: number; moves: unknown[] };
        return s.moves.length === 0 && s.seed !== 1;
      })
      .toBe(true);
    await synced(page);
    await menuRow(page, 'Statistics');
    await expect(stats(page)).toBeVisible();
    expect((await statTiles(page))[0]).toEqual(['Games played', '1']);
    await stats(page).getByRole('button', { name: 'Close statistics', exact: true }).click();
    await expect(stats(page)).toHaveCount(0);

    // 6: Show timer on; the first reading changes without a clock stub or a sleep (R-76).
    await menuRow(page, 'Preferences');
    await prefs(page).getByRole('switch', { name: 'Show timer' }).click();
    await prefs(page).getByRole('button', { name: 'Close preferences', exact: true }).click();
    await expect(prefs(page)).toHaveCount(0);
    await expect(timer(page).first()).toBeVisible();
    const first = await timer(page).first().textContent();
    expect(first).toMatch(/^(\d+:)?\d{1,2}:\d{2}$/);
    await expect.poll(() => timer(page).first().textContent(), { timeout: 5000 }).not.toBe(first);

    // 7: How to play by tap dispatches nothing.
    const before = await game(page);
    await menuButton(page).click();
    await tapAt(
      page,
      await centre(menu(page).getByRole('button', { name: 'How to play', exact: true })),
    );
    await expect(howTo(page)).toBeVisible();
    await howTo(page).getByRole('button', { name: 'Close how to play', exact: true }).click();
    await expect(howTo(page)).toHaveCount(0);
    expect(await game(page)).toBe(before);
    await synced(page);
  });

  test('R-62 Success signal win by Confirm', async ({ page }) => {
    await openFixture(page, 'session-won', { steps: ['undo'] });
    await waitForDictionary(page, 'ready');
    await synced(page);
    await expect(page.locator('.top-bar .score')).toHaveText('Score 319');
    await expect(page.getByTestId('wordcell-6')).toHaveClass(/target/);
    await expect(primary(page)).toHaveAccessibleName('Confirm');
    await tapAt(page, await centre(primary(page)));
    await expect(sheet(page, WIN)).toBeVisible();
    await synced(page);
    const v = await storedView(page);
    expect(v.status).toBe('won');
    expect(v.finalScore).toBe(355);
    expect(v.finalScore).toBe(319 + 36);
    expect(v.band).toBe(bandNames().indexOf('Word Nerd'));
    await expect(sheet(page, WIN).locator('.score')).toHaveText('355');
    await expect(sheet(page, WIN)).toContainText('Word Nerd');
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  test('Q-24 I-68 Flow 6 keyboard-only move, Esc closes the table', async ({ page }) => {
    // Flow 6 steps 2: `6`, `Up` x3, `5`.
    await toComposing(page);
    await synced(page);
    await page.keyboard.press('8');
    await expect(page.locator('[data-band="tray"] [data-place="tray"]')).toHaveCount(5);
    await synced(page);
    await arrangeByKeys(page, 'ENANA');
    await expect(page.locator('[data-band="tray"] .word-line')).toHaveText('ZENANA');
    await synced(page);
    await page.keyboard.press('Enter');
    await expect(primary(page)).toHaveAccessibleName('Confirm');
    await synced(page);
    const beforeSix = await game(page);
    expect(await press(page, '6')).toBe(false);
    expect(await game(page)).toBe(beforeSix);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('wordcell-6').locator('.count')).toHaveText('6');
    await synced(page);

    const stored = JSON.parse(await storedGame(page)) as {
      moves: unknown[];
      cursor: { index: number; phase: string };
    };
    expect(stored.moves[3]).toEqual({
      sourceColumn: 6,
      sourceCount: 4,
      destinationColumn: 5,
      destinationCount: 1,
      destinationSide: 'left',
      freeLetters: [8],
      arrangement: [9, 27, 1, 28, 0],
      reached: 'committed',
      targetCell: 6,
      placementOrder: [51, 9, 27, 1, 28, 0],
    });
    expect(stored.cursor.index).toBe(4);
    expect((await storedView(page)).displayScore).toBe(190);

    // I-68: `?` opens the controls table, Esc closes it and nothing else, a second Esc is idle.
    await page.keyboard.press('?');
    await expect(howTo(page)).toBeVisible();
    const before = await game(page);
    const action = await primary(page).textContent();
    const trayCount = await tray(page).locator('[data-card-id]').count();
    await page.keyboard.press('Escape');
    await expect(howTo(page)).toHaveCount(0);
    expect(await game(page)).toBe(before);
    expect(await primary(page).textContent()).toBe(action);
    await expect(tray(page).locator('[data-card-id]')).toHaveCount(trayCount);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await game(page)).toBe(before);
    expect(await primary(page).textContent()).toBe(action);
    await expect(tray(page).locator('[data-card-id]')).toHaveCount(trayCount);
    await synced(page);
  });
});
