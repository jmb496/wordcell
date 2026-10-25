import { expect, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { CONFIRM_TITLE, confirmDialog, expectLeaves, notice, wc } from './helpers/dialogs';
import { onAndroid } from './helpers/project';
import { openBoard } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';

// Epic 6 ticket 6.5 (SPEC CAP-6; R-84, Q-33, Q-35, Q-44, AD-13): the Statistics panel from the Menu
// row, the unreadable-history message and the ☰ dot. Seeded only through seedStorage; the unreadable
// cases are §2 rejection flows and seed history-invalid-* fixtures. android only.

test.beforeEach(onAndroid);

const HISTORY = 'wordcell:history';
const UNREADABLE = "Your score history can't be read.";
const HINT = 'Statistics are off until you reset it. Resetting deletes the old history.';
const EMPTY_LINE = 'Finish or give up a game to see statistics here.';

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const menu = (page: Page) => page.getByRole('dialog', { name: 'Menu', exact: true });
const panel = (page: Page) => page.getByRole('dialog', { name: 'Statistics', exact: true });

async function openWith(page: Page, history: string | null): Promise<void> {
  await seedStorage(page, { history: history ?? '{"version":1,"records":[]}' });
  await openBoard(page);
}

async function openPanel(page: Page): Promise<void> {
  await menuButton(page).click();
  await menu(page).getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(menu(page)).toHaveCount(0);
}

// The six tiles as label -> value text (and the caption of the longest word, if any).
async function tiles(page: Page): Promise<string[][]> {
  return panel(page)
    .locator('.tile')
    .evaluateAll((els) =>
      els.map((el) => [...el.querySelectorAll('p')].map((p) => p.textContent ?? '')),
    );
}

async function dismissNotice(page: Page): Promise<void> {
  await notice(page).getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(notice(page)).toHaveCount(0);
}

const DASH = '—';

test('R-84 the Statistics row opens the panel with the six values of three records and no empty line', async ({
  page,
}) => {
  await openWith(page, fixture('history-three-records.json'));
  await openPanel(page);
  expect(await tiles(page)).toEqual([
    ['Games played', '3'],
    ['Games won', '1'],
    ['Games given up', '2'],
    ['Best score', '355'],
    ['Average score', '355'],
    ['Longest word', 'LQUEJATA', '8 letters'],
  ]);
  await expect(panel(page).getByText(EMPTY_LINE)).toHaveCount(0);
  await expect(panel(page).getByRole('heading', { name: 'Statistics' })).toBeFocused();
});

test('R-84 best score and average score differ and skip a negative given-up record', async ({
  page,
}) => {
  const rec = (outcome: string, finalScore: number) =>
    `{"version":1,"seed":1,"outcome":"${outcome}","finalScore":${finalScore},"activeMs":0}`;
  await openWith(
    page,
    `{"version":1,"records":[${rec('won', 100)},${rec('won', 51)},${rec('gaveUp', -20)}]}`,
  );
  await openPanel(page);
  const rows = await tiles(page);
  expect(rows[3]).toEqual(['Best score', '100']);
  expect(rows[4]).toEqual(['Average score', '76']);
});

test('R-84 a fresh history shows zeros, dashes and the empty line', async ({ page }) => {
  await openWith(page, null);
  await openPanel(page);
  expect(await tiles(page)).toEqual([
    ['Games played', '0'],
    ['Games won', '0'],
    ['Games given up', '0'],
    ['Best score', DASH],
    ['Average score', DASH],
    ['Longest word', DASH],
  ]);
  await expect(panel(page).getByText(EMPTY_LINE)).toBeVisible();
});

test('Q-44 a history of only negative given-up games shows counts, dashes and no empty line', async ({
  page,
}) => {
  await openWith(page, fixture('history-negative-only.json'));
  await openPanel(page);
  expect(await tiles(page)).toEqual([
    ['Games played', '2'],
    ['Games won', '0'],
    ['Games given up', '2'],
    ['Best score', DASH],
    ['Average score', DASH],
    ['Longest word', DASH],
  ]);
  await expect(panel(page).getByText(EMPTY_LINE)).toHaveCount(0);
});

test('Q-35 a longest-word tie shows the earlier record, and 0 shows as 0', async ({ page }) => {
  await openWith(page, fixture('history-tie-longest-word.json'));
  await openPanel(page);
  const rows = await tiles(page);
  expect(rows[3]).toEqual(['Best score', '0']);
  expect(rows[4]).toEqual(['Average score', '0']);
  expect(rows[5]).toEqual(['Longest word', 'TAN', '3 letters']);
});

test('Q-35 a QU word keeps QU in capitals', async ({ page }) => {
  const record = (word: string) =>
    `{"version":1,"seed":1,"outcome":"won","finalScore":10,"longestWord":{"spelling":"${word}","letterCount":${word.length}},"activeMs":0}`;
  await openWith(page, `{"version":1,"records":[${record('quit')}]}`);
  await openPanel(page);
  expect((await tiles(page))[5]).toEqual(['Longest word', 'QUIT', '4 letters']);
});

test('R-84 closing the panel returns focus to the menu button; Esc closes it on top', async ({
  page,
}) => {
  await openWith(page, fixture('history-three-records.json'));
  await openPanel(page);
  await panel(page).getByRole('button', { name: 'Close statistics' }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(menuButton(page)).toBeFocused();
  await openPanel(page);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(menuButton(page)).toBeFocused();
});

for (const [file, sentence] of [
  [
    'history-invalid-version-unknown.json',
    "It uses format version 2, which this version can't read.",
  ],
  ['history-invalid-array.json', "Its format version can't be read."],
  ['history-invalid-won-negative.json', "It uses format version 1 but its contents can't be read."],
] as const) {
  test(`Q-33 ${file} shows the notice's headline above its message and Reset history instead of tiles, and the menu dot`, async ({
    page,
  }) => {
    await seedStorage(page, { history: fixture(file) });
    await openBoard(page);
    await dismissNotice(page);
    // The dot, with every surface closed: the button keeps its name and gains the description.
    await expect(menuButton(page)).toHaveAccessibleDescription("Your score history can't be read.");
    await openPanel(page);
    await expect(panel(page)).toContainText(`${sentence} ${HINT}`);
    // EXPERIENCE.md catalogue: the same text as the History notice, its headline first (SPEC F9).
    const lines = await panel(page)
      .locator('p')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() ?? ''));
    expect(lines).toEqual([UNREADABLE, `${sentence} ${HINT}`]);
    await expect(panel(page).locator('.tile')).toHaveCount(0);
    await expect(panel(page).getByText(EMPTY_LINE)).toHaveCount(0);
    await expect(panel(page).getByRole('button', { name: 'Reset history' })).toBeVisible();
    await expect(panel(page).getByRole('button', { name: 'Not now' })).toHaveCount(0);
  });
}

test('Q-33 a readable history has no menu dot and no description', async ({ page }) => {
  await openWith(page, fixture('history-three-records.json'));
  await expect(menuButton(page)).not.toHaveAttribute('aria-describedby', /.+/);
});

const VERSION_UNKNOWN = 'history-invalid-version-unknown.json';

async function openUnreadablePanel(page: Page): Promise<void> {
  await seedStorage(page, { history: fixture(VERSION_UNKNOWN) });
  await openBoard(page);
  await dismissNotice(page);
  await openPanel(page);
}

const resetButton = (page: Page) =>
  panel(page).getByRole('button', { name: 'Reset history', exact: true });

test.describe('Reset history from the panel', () => {
  test('Q-33 Keep it keeps the message, the dot and the panel, focus on Reset history', async ({
    page,
  }) => {
    await openUnreadablePanel(page);
    await resetButton(page).click();
    await expect(confirmDialog(page)).toBeVisible();
    await confirmDialog(page).getByRole('button', { name: 'Keep it' }).click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(panel(page)).toBeVisible();
    await expect(resetButton(page)).toBeFocused();
    await expect(menuButton(page)).toHaveAttribute('aria-describedby', /.+/);
    expect(await stored(page, HISTORY)).toBe(fixture(VERSION_UNKNOWN));
  });

  for (const how of ['Esc', 'back', 'scrim'] as const) {
    test(`Q-33 ${how} on the confirm acts as Keep it and leaves the panel`, async ({ page }) => {
      await openUnreadablePanel(page);
      await resetButton(page).click();
      await expect(confirmDialog(page)).toBeVisible();
      if (how === 'Esc') await page.keyboard.press('Escape');
      else if (how === 'back') await page.goBack();
      else await page.mouse.click(5, 5);
      await expect(confirmDialog(page)).toHaveCount(0);
      await expect(panel(page)).toBeVisible();
      await expect(resetButton(page)).toBeFocused();
      await expect(menuButton(page)).toHaveAttribute('aria-describedby', /.+/);
    });
  }

  test('Q-33 Tab never reaches the panel behind the open Reset confirm', async ({ page }) => {
    await openUnreadablePanel(page);
    await resetButton(page).click();
    await expect(confirmDialog(page)).toBeVisible();
    const behind = [
      panel(page).getByRole('button', { name: 'Close statistics' }),
      resetButton(page),
    ];
    for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      for (const b of behind) await expect(b).not.toBeFocused();
    }
  });

  test('§2 Delete history shows the fresh view in the open panel, drops the dot, focus on the heading', async ({
    page,
  }) => {
    await openUnreadablePanel(page);
    await resetButton(page).click();
    await confirmDialog(page).getByRole('button', { name: 'Delete history' }).click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(panel(page)).toBeVisible();
    expect((await tiles(page))[0]).toEqual(['Games played', '0']);
    await expect(panel(page).getByText(EMPTY_LINE)).toBeVisible();
    await expect(panel(page).getByRole('heading', { name: 'Statistics' })).toBeFocused();
    await expect(menuButton(page)).not.toHaveAttribute('aria-describedby', /.+/);
    expect(await stored(page, HISTORY)).toBe('{"version":1,"records":[]}');
    await panel(page).getByRole('button', { name: 'Close statistics' }).click();
    await expect(menuButton(page)).toBeFocused();
  });

  test('AD-13 reload with Statistics and its Reset confirm open shows the Board and the notice; the dot stays and back leaves', async ({
    page,
  }) => {
    await openUnreadablePanel(page);
    await resetButton(page).click();
    await expect(page.getByRole('dialog', { name: CONFIRM_TITLE })).toBeVisible();
    const before = await wc(page);
    expect(before?.wc).toBe(2);
    await page.reload();
    await expect(page.getByTestId('card-0')).toBeVisible();
    await expect(notice(page)).toBeVisible();
    await expect(panel(page)).toHaveCount(0);
    await expect(confirmDialog(page)).toHaveCount(0);
    await dismissNotice(page);
    const after = await wc(page);
    expect(after?.wc).toBe(0);
    expect(after?.launch).not.toBe(before?.launch);
    await expect(menuButton(page)).toHaveAttribute('aria-describedby', /.+/);
    await expectLeaves(page);
  });
});
