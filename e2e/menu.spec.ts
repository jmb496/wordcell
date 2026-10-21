import { expect, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { centre, openFixture, tapAt } from './helpers/board';
import { wc } from './helpers/dialogs';
import { onAndroid } from './helpers/project';
import { select } from './helpers/selection';
import { touchHold } from './helpers/touch';

// Epic 6 entry 2 (ticket 6.2, SPEC CAP-2; AD-13, AD-14, AD-3): the ☰ button, the Menu sheet with its
// six rows and the footer version. The footer is the WORDCELL_APP_VERSION override that
// playwright.config.ts sets for the dev server. Fixtures (seed 1): `session-idle-fresh` (Idle,
// no moves), `session-idle-empty-column` (Idle, one move, cell 7 holds cards), `session-composing`,
// `session-place`, `session-won`, `session-gave-up`.

test.beforeEach(onAndroid);

const SESSION = 'wordcell:session';
const VERSION = '0.0.0 (test)';

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const sheet = (page: Page) => page.getByRole('dialog', { name: 'Menu', exact: true });
const row = (page: Page, name: string) => sheet(page).getByRole('button', { name, exact: true });
const closeButton = (page: Page) => page.getByRole('button', { name: 'Close menu', exact: true });

type Stored = { seed: number; moves: unknown[]; gaveUp: boolean };
const parsed = async (page: Page) => JSON.parse((await stored(page, SESSION)) ?? 'null') as Stored;

async function openMenu(page: Page): Promise<void> {
  await menuButton(page).click();
  await expect(sheet(page)).toBeVisible();
}

async function expectClosed(page: Page): Promise<void> {
  await expect(sheet(page)).toHaveCount(0);
  await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
}

test.describe('the sheet', () => {
  test('AD-13 ☰ opens the menu: six rows, the footer version, one entry, focus on the first row', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await expect(menuButton(page)).toBeVisible();
    const box = await menuButton(page).boundingBox();
    expect(box?.width).toBe(44);
    expect(box?.height).toBe(44);
    await openMenu(page);
    await expect(sheet(page).getByRole('button')).toHaveCount(7); // six rows and the close control
    for (const name of [
      'New game',
      'Replay this deal',
      'Give up',
      'Statistics',
      'Preferences',
      'How to play',
    ]) {
      await expect(row(page, name)).toBeVisible();
      const height = (await row(page, name).boundingBox())?.height;
      // Rows measure 52 +- a sub-pixel (51.99997, 52.00003) depending on layout rounding.
      expect(height).toBeCloseTo(52, 1);
    }
    await expect(sheet(page).getByText(VERSION, { exact: true })).toBeVisible();
    await expect(row(page, 'New game')).toBeFocused();
    expect((await wc(page))?.wc).toBe(1);
  });

  test('AD-13 the top bar is inert under the menu: Tab and Enter never reach Undo or Redo', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await expect(page.getByTestId('undo')).toBeEnabled();
    const before = await stored(page, SESSION);
    await openMenu(page);
    await expect(page.locator('main')).toHaveJSProperty('inert', true);
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('undo')).not.toBeFocused();
      await expect(page.getByTestId('redo')).not.toBeFocused();
    }
    // Enter with nothing focused (a focused sheet row would legitimately act): it must not reach the bar.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Enter');
    await expect(sheet(page)).toBeVisible();
    await expect(page.getByTestId('undo')).toBeEnabled();
    await expect(page.getByTestId('redo')).not.toBeFocused();
    expect(await stored(page, SESSION)).toBe(before);
    for (const id of ['undo', 'redo']) {
      expect(await page.getByTestId(id).evaluate((el) => el.closest('[inert]') !== null)).toBe(
        true,
      );
    }
  });

  // Epic 6 CAP-1 (6.1, SPEC F7): Sheet and Panel move on `--wc-base-ms` (opacity and transform);
  // under reduced motion their @container branch fades opacity only at `--wc-fade-ms` (120 ms).
  for (const reduced of [false, true]) {
    test(`AD-10 the menu sheet and a panel transition on ${reduced ? 'opacity only at --wc-fade-ms (reduced motion)' : 'opacity and transform at --wc-base-ms'}`, async ({
      page,
    }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
      await openFixture(page, 'session-idle-fresh');
      const base = await page.evaluate(
        () =>
          Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue('--wc-base-ms'),
          ) / 1000,
      );
      const property = reduced ? 'opacity' : 'opacity, transform';
      const duration = reduced ? '0.12s' : `${base}s, ${base}s`;
      await openMenu(page);
      await expect(sheet(page)).toHaveCSS('opacity', '1');
      await expect(sheet(page)).toHaveCSS('transition-property', property);
      await expect(sheet(page)).toHaveCSS('transition-duration', duration);
      await row(page, 'Statistics').click();
      const panel = page.getByRole('dialog', { name: 'Statistics', exact: true });
      await expect(panel).toHaveCSS('opacity', '1');
      await expect(panel).toHaveCSS('transition-property', property);
      await expect(panel).toHaveCSS('transition-duration', duration);
    });
  }

  test('AD-14 the menu keeps 52 live card elements', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    await openMenu(page);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
  });

  test('AD-14 at 360 x 320 the sheet is at most 80 % high; the close control, every row and the footer are reachable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 320 });
    await openFixture(page, 'session-idle-fresh');
    await openMenu(page);
    const sheetBox = await page.locator('.sheet').boundingBox();
    expect(sheetBox?.height).toBeLessThanOrEqual(320 * 0.8 + 0.5);
    const close = await closeButton(page).boundingBox();
    expect(close?.y).toBeGreaterThanOrEqual(0);
    expect((close?.y ?? 0) + (close?.height ?? 0)).toBeLessThanOrEqual(320);
    for (const target of [
      row(page, 'New game'),
      row(page, 'Replay this deal'),
      row(page, 'Give up'),
      row(page, 'Preferences'),
      row(page, 'How to play'),
      sheet(page).getByText(VERSION, { exact: true }),
    ]) {
      await target.scrollIntoViewIfNeeded();
      const b = await target.boundingBox();
      expect(b?.y).toBeGreaterThanOrEqual(0);
      expect((b?.y ?? 0) + (b?.height ?? 0)).toBeLessThanOrEqual(320);
    }
  });
});

test.describe('opening', () => {
  test('AD-13 opening clears a tail selection (its entry is popped, one entry remains)', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 1, 0);
    await openMenu(page);
    await expect(page.locator('[data-selection-outline]')).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
  });

  test('AD-13 opening clears a tile selection', async ({ page }) => {
    await openFixture(page, 'session-composing');
    const tile = page.locator('[data-band="tray"] [data-card-id]').first();
    await tapAt(page, await centre(tile));
    await expect(page.locator('[data-band="tray"] [data-card-id].selected')).toHaveCount(1);
    await openMenu(page);
    await expect(page.locator('[data-band="tray"] [data-card-id].selected')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expectClosed(page);
    await expect(page.locator('[data-band="tray"] [data-card-id].selected')).toHaveCount(0);
  });

  test('AD-13 ☰ opens from an open WordCell view: the view closes, one menu entry (openSurface path via dispatched click, not a real tap)', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await tapAt(page, await centre(page.getByTestId('wordcell-7')));
    await expect(page.locator('[data-view-sheet]')).toBeVisible();
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
    // The view's scrim and the inert .board cover the bar (epic 4 layer order), so the opener
    // runs through a dispatched click: openSurface closes the view first (SPEC F8).
    await menuButton(page).dispatchEvent('click');
    await expect(sheet(page)).toBeVisible();
    await expect(page.locator('[data-view-sheet]')).toHaveCount(0);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
  });

  test('AD-13 ☰ opens over a held peek: the peek closes (openSurface path via dispatched click, not a real tap)', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const hold = await touchHold(page, await centre(page.getByTestId('wordcell-7')));
    try {
      await page.waitForTimeout(450);
      await expect(page.locator('[data-view-sheet]')).toHaveAttribute('data-mode', 'peek');
      await menuButton(page).dispatchEvent('click');
      await expect(sheet(page)).toBeVisible();
      await expect(page.locator('[data-view-sheet]')).toHaveCount(0);
    } finally {
      await hold.end();
    }
  });
});

test.describe('closing', () => {
  const closers: readonly [string, (page: Page) => Promise<void>][] = [
    ['the close control', (page) => closeButton(page).click()],
    ['Esc', (page) => page.keyboard.press('Escape')],
    ['back', async (page) => void (await page.goBack())],
    [
      'a scrim tap',
      async (page) => {
        await page.mouse.click(180, 20);
      },
    ],
  ];
  for (const [name, close] of closers) {
    test(`AD-13 closing by ${name} leaves wordcell:session byte-identical and focus on the board`, async ({
      page,
    }) => {
      await openFixture(page, 'session-idle-empty-column');
      const before = await stored(page, SESSION);
      await openMenu(page);
      await close(page);
      await expectClosed(page);
      expect(await stored(page, SESSION)).toBe(before);
      await expect(page.locator('main')).toBeFocused();
    });
  }
});

test.describe('Give up', () => {
  for (const fixture of ['session-composing', 'session-place', 'session-won', 'session-gave-up']) {
    test(`R-75 Give up is disabled in ${fixture} and dispatches nothing`, async ({ page }) => {
      await openFixture(page, fixture);
      const before = await stored(page, SESSION);
      await openMenu(page);
      await expect(row(page, 'Give up')).toBeDisabled();
      await row(page, 'Give up').click({ force: true });
      await expect(sheet(page)).toBeVisible();
      expect(await stored(page, SESSION)).toBe(before);
    });
  }

  test('R-75 Give up is enabled in Idle and acts at once: gaveUp is stored right after the click, the menu closed, the end sheet open', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openMenu(page);
    await expect(row(page, 'Give up')).toBeEnabled();
    await row(page, 'Give up').click();
    expect((await parsed(page)).gaveUp).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
    // Ticket 6.6: the end sheet opens at once, one entry, focus on its first action.
    await expect(page.getByRole('dialog', { name: 'Game given up.' })).toBeVisible();
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
    await expect(page.getByRole('button', { name: 'Replay this deal', exact: true })).toBeFocused();
  });
});

test.describe('New game and Replay', () => {
  // R-74: in-progress games go through the confirm (accept = the dialog's action button); finished
  // games act at once. The confirms' own cases live in confirm.spec.ts.
  for (const [fixture, inProgress] of [
    ['session-idle-empty-column', true],
    ['session-composing', true],
    ['session-won', false],
    ['session-gave-up', false],
  ] as const) {
    test(`R-74 Q-29 New game gives a new seed and Replay the same seed with empty moves (${fixture})`, async ({
      page,
    }) => {
      await openFixture(page, fixture);
      const seed = (await parsed(page)).seed;
      await openMenu(page);
      await expect(row(page, 'New game')).toBeEnabled();
      await expect(row(page, 'Replay this deal')).toBeEnabled();
      await row(page, 'Replay this deal').click();
      if (inProgress) {
        await page
          .getByRole('dialog', { name: 'Replay this deal?' })
          .getByRole('button', { name: 'Replay', exact: true })
          .click();
      }
      await expectClosed(page);
      await expect(page.locator('main')).toBeFocused();
      await expect.poll(async () => (await parsed(page)).moves.length).toBe(0);
      expect((await parsed(page)).seed).toBe(seed);
      expect((await parsed(page)).gaveUp).toBe(false);

      await openMenu(page);
      await row(page, 'New game').click();
      // The Replayed deal has no moves, so New game now acts at once.
      await expectClosed(page);
      await expect(page.locator('main')).toBeFocused();
      await expect.poll(async () => (await parsed(page)).seed).not.toBe(seed);
      expect((await parsed(page)).moves).toHaveLength(0);
    });
  }
});

test.describe('top bar fit', () => {
  test('AD-11 at 360 px the top bar holds ☰, a negative score and Undo/Redo without overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openFixture(page, 'session-gave-up-after-commit');
    const score = page.locator('[data-band="topBar"] .score');
    const bar = await page.locator('[data-band="topBar"]').boundingBox();
    const parts = [menuButton(page), score, page.getByTestId('undo'), page.getByTestId('redo')];
    let previousRight = bar?.x ?? 0;
    for (const part of parts) {
      const b = await part.boundingBox();
      expect(b?.x).toBeGreaterThanOrEqual(previousRight - 0.5);
      previousRight = (b?.x ?? 0) + (b?.width ?? 0);
    }
    expect(previousRight).toBeLessThanOrEqual((bar?.x ?? 0) + (bar?.width ?? 0) + 0.5);
    await expect(score).toHaveText(/^Score −\d+$/);
  });
});
