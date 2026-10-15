import { expect, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { openFixture } from './helpers/board';
import { expectLeaves, type NavState, wc } from './helpers/dialogs';
import { onAndroid, onDesktop } from './helpers/project';
import { fixture, seedStorage } from './helpers/seed';

// Epic 6 ticket 6.3 (SPEC CAP-3; R-74, Q-29, AD-13): the New game and Replay confirms. Fixtures
// (seed 1): `session-idle-fresh` (no moves), `session-idle-empty-column` (one move),
// `session-idle-pending-draft` (Idle with only a redo tail), `session-composing`, `session-won`,
// `session-gave-up`, `session-invalid-version-unknown`.

const SESSION = 'wordcell:session';
const HISTORY = 'wordcell:history';
const SEED = 1;

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const menu = (page: Page) => page.getByRole('dialog', { name: 'Menu', exact: true });
const newGameConfirm = (page: Page) => page.getByRole('dialog', { name: 'Start a new game?' });
const replayConfirm = (page: Page) => page.getByRole('dialog', { name: 'Replay this deal?' });
const keepPlaying = (page: Page) => page.getByRole('button', { name: 'Keep playing', exact: true });

type Stored = { seed: number; moves: unknown[] };
const parsed = async (page: Page) => JSON.parse((await stored(page, SESSION)) ?? 'null') as Stored;

async function openRow(page: Page, row: 'New game' | 'Replay this deal'): Promise<void> {
  await menuButton(page).click();
  await expect(menu(page)).toBeVisible();
  await menu(page).getByRole('button', { name: row, exact: true }).click();
}

const CONFIRMS = [
  ['New game', 'New game', newGameConfirm],
  ['Replay', 'Replay this deal', replayConfirm],
] as const;

test.describe('on android', () => {
  test.beforeEach(onAndroid);

  test.describe('the gate', () => {
    for (const [name, row, dialog] of CONFIRMS) {
      test(`R-74 ${name} acts at once on a fresh deal: no dialog, focus on main`, async ({
        page,
      }) => {
        await openFixture(page, 'session-idle-fresh');
        await openRow(page, row);
        await expect(dialog(page)).toHaveCount(0);
        await expect(menu(page)).toHaveCount(0);
        await expect(page.locator('main')).toBeFocused();
        expect((await parsed(page)).moves).toHaveLength(0);
      });

      for (const fixtureName of ['session-idle-empty-column', 'session-idle-pending-draft']) {
        test(`R-74 ${name} confirms after one move or with only a redo tail (${fixtureName}); Keep playing focused`, async ({
          page,
        }) => {
          await openFixture(page, fixtureName);
          await openRow(page, row);
          await expect(dialog(page)).toBeVisible();
          await expect(menu(page)).toHaveCount(0);
          await expect(keepPlaying(page)).toBeFocused();
          await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
        });
      }

      for (const fixtureName of ['session-won', 'session-gave-up']) {
        test(`R-74 ${name} acts at once in a finished game (${fixtureName})`, async ({ page }) => {
          await openFixture(page, fixtureName);
          await openRow(page, row);
          await expect(dialog(page)).toHaveCount(0);
          await expect(page.locator('main')).toBeFocused();
        });
      }
    }

    test('R-74 the rejected root: New game acts at once with no dialog', async ({ page }) => {
      await seedStorage(page, { session: fixture('session-invalid-version-unknown.json') });
      await page.goto('/');
      await page.getByRole('button', { name: 'New game', exact: true }).click();
      await expect(newGameConfirm(page)).toHaveCount(0);
      await expect(page.locator('[data-card-id]')).toHaveCount(52);
    });
  });

  test.describe('dismissal', () => {
    const dismissers: readonly [string, (page: Page) => Promise<void>][] = [
      ['Keep playing', (page) => keepPlaying(page).click()],
      ['back', async (page) => void (await page.goBack())],
      [
        'a scrim tap',
        async (page) => {
          await page.mouse.click(5, 5);
        },
      ],
    ];
    for (const [name, row, dialog] of CONFIRMS) {
      for (const [how, dismiss] of dismissers) {
        test(`R-74 ${name} confirm dismissed by ${how} closes only the confirm: session byte-identical, focus on the menu button`, async ({
          page,
        }) => {
          await openFixture(page, 'session-idle-empty-column');
          const before = await stored(page, SESSION);
          await openRow(page, row);
          await expect(dialog(page)).toBeVisible();
          await dismiss(page);
          await expect(dialog(page)).toHaveCount(0);
          await expect(menu(page)).toHaveCount(0);
          await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
          expect(await stored(page, SESSION)).toBe(before);
          await expect(menuButton(page)).toBeFocused();
        });
      }

      test(`R-74 a menu reopened right after the ${name} confirm closes stays open and the confirm is gone`, async ({
        page,
      }) => {
        await openFixture(page, 'session-idle-empty-column');
        await openRow(page, row);
        await keepPlaying(page).click();
        await menuButton(page).click();
        await expect(menu(page)).toBeVisible();
        await expect(dialog(page)).toHaveCount(0);
        // The reopened sheet is not in the confirm's exit path; the ☰ focus move ran at close.
        await expect(menuButton(page)).not.toBeFocused();
      });

      test(`R-74 a reload with the ${name} confirm open leaves the Board and the Session unchanged`, async ({
        page,
      }) => {
        await openFixture(page, 'session-idle-empty-column');
        const before = await stored(page, SESSION);
        await openRow(page, row);
        await expect(dialog(page)).toBeVisible();
        await page.reload();
        await expect(page.locator('[data-card-id]')).toHaveCount(52);
        await expect(dialog(page)).toHaveCount(0);
        const after = await stored(page, SESSION);
        expect({ ...(JSON.parse(after ?? 'null') as object), activeMs: 0 }).toEqual({
          ...(JSON.parse(before ?? 'null') as object),
          activeMs: 0,
        });
      });
    }
  });

  test.describe('accept', () => {
    test('R-74 New game accepted gives a new seed, acts once on a double tap, focus on main', async ({
      page,
    }) => {
      await openFixture(page, 'session-composing');
      await page.evaluate(() => {
        const writes: number[] = [];
        (window as unknown as { __seeds: number[] }).__seeds = writes;
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key: string, value: string) {
          if (key === 'wordcell:session') writes.push((JSON.parse(value) as { seed: number }).seed);
          return original.call(this, key, value);
        };
      });
      await openRow(page, 'New game');
      await expect(newGameConfirm(page)).toBeVisible();
      await newGameConfirm(page).getByRole('button', { name: 'New game', exact: true }).dblclick();
      await expect(newGameConfirm(page)).toHaveCount(0);
      await expect(page.locator('main')).toBeFocused();
      await expect.poll(async () => (await parsed(page)).seed).not.toBe(SEED);
      expect((await parsed(page)).moves).toHaveLength(0);
      const seeds = await page.evaluate(() => (window as unknown as { __seeds: number[] }).__seeds);
      expect(new Set(seeds).size).toBe(1);
      await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
    });

    test('Q-29 Replay accepted keeps the seed, empties the moves and leaves wordcell:history byte-identical', async ({
      page,
    }) => {
      await seedStorage(page, {
        session: fixture('session-idle-empty-column.json'),
        history: fixture('history-three-records.json'),
      });
      await page.goto('/');
      await expect(page.locator('[data-card-id]')).toHaveCount(52);
      await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
      const history = await stored(page, HISTORY);
      await openRow(page, 'Replay this deal');
      await replayConfirm(page).getByRole('button', { name: 'Replay', exact: true }).dblclick();
      await expect(replayConfirm(page)).toHaveCount(0);
      await expect(page.locator('main')).toBeFocused();
      await expect.poll(async () => (await parsed(page)).moves.length).toBe(0);
      expect((await parsed(page)).seed).toBe(SEED);
      expect(await stored(page, HISTORY)).toBe(history);
      await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
    });
  });

  test.describe('I-68', () => {
    test('AD-13 win, New game from the action bar: bare Board with the same launch id, one back leaves the app', async ({
      page,
    }) => {
      await openFixture(page, 'session-won');
      const before = (await wc(page)) as NonNullable<NavState>;
      await page.getByTestId('primary-action').click();
      await expect.poll(async () => (await parsed(page)).seed).not.toBe(SEED);
      await expect.poll(() => wc(page)).toEqual({ wc: 0, launch: before.launch });
      expect((await parsed(page)).moves).toHaveLength(0);
      await expectLeaves(page);
    });
  });
});

test.describe('on desktop', () => {
  test.beforeEach(onDesktop);

  for (const [name, row, dialog] of CONFIRMS) {
    test(`R-74 Esc closes only the ${name} confirm; focus on the menu button`, async ({ page }) => {
      await openFixture(page, 'session-idle-empty-column');
      const before = await stored(page, SESSION);
      await openRow(page, row);
      await expect(dialog(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog(page)).toHaveCount(0);
      await expect(menu(page)).toHaveCount(0);
      expect(await stored(page, SESSION)).toBe(before);
      await expect(menuButton(page)).toBeFocused();
    });
  }
});
