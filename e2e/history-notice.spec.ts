import { expect, type Locator, type Page, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';

// §2/Q-33 History notice and its Reset confirm over the AD-13 nav adapter, on android. History-
// notice flows are §2 rejection flows and seed history-invalid-* fixtures. Each page opens the
// app from its initial about:blank (Chromium keeps that entry), so "leaves the app" is goBack()
// landing on about:blank.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'history-notice flows run on android');
});

const SESSION = 'wordcell:session';
const HISTORY = 'wordcell:history';
const EMPTY_TEXT = '{"version":1,"records":[]}';
const TITLE = "Your score history can't be read.";
const HINT = 'Statistics are off until you reset it. Resetting deletes the old history.';
const CONFIRM = 'Delete the score history?';
const VERSION_UNKNOWN = 'history-invalid-version-unknown.json';

type NavState = { wc: number; launch: number } | null;

const stored = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);
const wc = (page: Page) => page.evaluate(() => history.state as NavState);
const notice = (page: Page) => page.getByRole('dialog', { name: TITLE });
const confirmDialog = (page: Page) => page.getByRole('dialog', { name: CONFIRM });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

// Seeds `history` (and optionally `session`), then opens the app from about:blank.
async function start(page: Page, history: string, session?: string): Promise<void> {
  await seedStorage(page, {
    history: fixture(history),
    ...(session !== undefined && { session: fixture(session) }),
  });
  await open(page);
}

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
}

async function expectNotice(page: Page, sentence: string): Promise<void> {
  const dialog = notice(page);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName(TITLE);
  await expect(dialog).toHaveAccessibleDescription(`${sentence} ${HINT}`);
  await expect(dialog.getByRole('button', { name: 'Reset history', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Not now', exact: true })).toBeFocused();
}

async function openConfirm(page: Page): Promise<void> {
  await button(page, 'Reset history').click();
  await expect(confirmDialog(page)).toBeVisible();
  await expect(confirmDialog(page)).toHaveAccessibleDescription("This can't be undone.");
  await expect(button(page, 'Keep it')).toBeFocused();
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(2);
}

// A touch double tap: two taps ~80 ms apart (the second click has detail 2).
async function doubleTap(page: Page, x: number, y: number): Promise<void> {
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(80);
  await page.touchscreen.tap(x, y);
}

// Back from the base entry leaves the app.
async function expectLeaves(page: Page): Promise<void> {
  await page.goBack();
  await expect(page).toHaveURL('about:blank');
}

// The undo button's centre, asserted outside `box` (a scrim tap point; no new test id).
async function scrimPoint(page: Page, dialog: Locator): Promise<{ x: number; y: number }> {
  const undo = await page.getByTestId('undo').boundingBox();
  const box = await dialog.boundingBox();
  if (undo === null || box === null) throw new Error('no undo or dialog box');
  const point = { x: undo.x + undo.width / 2, y: undo.y + undo.height / 2 };
  const inside =
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height;
  expect(inside).toBe(false);
  return point;
}

test.describe('§2 History notice variants', () => {
  const variants = [
    {
      file: VERSION_UNKNOWN,
      sentence: "It uses format version 2, which this version can't read.",
    },
    { file: 'history-invalid-null.json', sentence: "Its format version can't be read." },
    {
      file: 'history-invalid-won-negative.json',
      sentence: "It uses format version 1 but its contents can't be read.",
    },
  ];
  for (const variant of variants) {
    test(`§2 an unreadable history (${variant.file}) opens the History notice with its sentence and Reset history at wc 1`, async ({
      page,
    }) => {
      await start(page, variant.file);
      await expectNotice(page, variant.sentence);
      const state = await wc(page);
      expect(state).toEqual({ wc: 1, launch: expect.any(Number) });
    });
  }
});

test.describe('§2 History notice flows (history-invalid-version-unknown.json)', () => {
  const SENTENCE = "It uses format version 2, which this version can't read.";

  test('§2 AD-13 Not now closes the notice to wc 0; the next back leaves the app', async ({
    page,
  }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await button(page, 'Not now').click();
    await expect(notice(page)).toHaveCount(0);
    await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(0);
    await expectLeaves(page);
  });

  test('AD-13 back closes the notice to wc 0; the next back leaves the app', async ({ page }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await page.goBack();
    await expect(notice(page)).toHaveCount(0);
    expect((await wc(page))?.wc).toBe(0);
    await expectLeaves(page);
  });

  test('§2 a scrim tap on the notice leaves it open at wc 1 and the Session unchanged', async ({
    page,
  }) => {
    await start(page, VERSION_UNKNOWN, 'session-place.json');
    await expectNotice(page, SENTENCE);
    const session = await stored(page, SESSION);
    const point = await scrimPoint(page, notice(page));
    await page.touchscreen.tap(point.x, point.y);
    await expect(notice(page)).toBeVisible();
    expect((await wc(page))?.wc).toBe(1);
    expect(await stored(page, SESSION)).toBe(session);
  });

  test('§2 the Reset confirm focuses Keep it; Tab never reaches the notice; Escape leaves it open at wc 2 (interim)', async ({
    page,
  }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await openConfirm(page);
    const noticeButtons = [button(page, 'Not now'), button(page, 'Reset history')];
    for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      for (const b of noticeButtons) await expect(b).not.toBeFocused();
    }
    await page.keyboard.press('Escape');
    await expect(confirmDialog(page)).toBeVisible();
    expect((await wc(page))?.wc).toBe(2);
  });

  test('§2 Keep it closes the confirm, the notice stays with Reset history focused, wc 1', async ({
    page,
  }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await openConfirm(page);
    await button(page, 'Keep it').click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toBeVisible();
    await expect(button(page, 'Reset history')).toBeFocused();
    await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(1);
  });

  test('AD-13 back on the confirm closes only the confirm, wc 1', async ({ page }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await openConfirm(page);
    await page.goBack();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toBeVisible();
    await expect(button(page, 'Reset history')).toBeFocused();
    expect((await wc(page))?.wc).toBe(1);
  });

  test('§2 a scrim tap on the confirm acts as Keep it, wc 1', async ({ page }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await openConfirm(page);
    const point = await scrimPoint(page, confirmDialog(page));
    await page.mouse.click(point.x, point.y);
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toBeVisible();
    await expect(button(page, 'Reset history')).toBeFocused();
    await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(1);
  });

  test("§2 a tap on the Reset confirm's card body leaves the confirm open at wc 2", async ({
    page,
  }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await openConfirm(page);
    await confirmDialog(page).getByText("This can't be undone.", { exact: true }).click();
    await expect(confirmDialog(page)).toBeVisible();
    expect((await wc(page))?.wc).toBe(2);
  });

  test('§2 the board is inert under the notice (session-place.json): Undo takes no focus; a tap on Undo under the confirm acts as Keep it', async ({
    page,
  }) => {
    await start(page, VERSION_UNKNOWN, 'session-place.json');
    await expectNotice(page, SENTENCE);
    const undo = page.getByTestId('undo');
    await expect(undo).toBeEnabled();
    await undo.focus();
    await expect(undo).not.toBeFocused();
    const session = await stored(page, SESSION);
    await openConfirm(page);
    const point = await scrimPoint(page, confirmDialog(page));
    await page.mouse.click(point.x, point.y);
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toBeVisible();
    await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(1);
    expect(await stored(page, SESSION)).toBe(session);
  });

  test('AD-13 Keep it then Reset history with no wait ends at wc 2 with the confirm open', async ({
    page,
  }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await openConfirm(page);
    await button(page, 'Keep it').click();
    await button(page, 'Reset history').click();
    await expect(confirmDialog(page)).toBeVisible();
    await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(2);
  });

  test('§2 Delete history writes the empty history, closes both to wc 0; a reload shows no notice and back leaves the app', async ({
    page,
  }) => {
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await openConfirm(page);
    await button(page, 'Delete history').click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toHaveCount(0);
    expect(await stored(page, HISTORY)).toBe(EMPTY_TEXT);
    await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(0);
    await page.reload();
    await expect(page.getByTestId('card-0')).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
    expect((await wc(page))?.wc).toBe(0);
    await expectLeaves(page);
  });

  test('§2 wordcell:history bytes are unchanged after Not now, Keep it, back and reload', async ({
    page,
  }) => {
    const text = fixture(VERSION_UNKNOWN);
    await start(page, VERSION_UNKNOWN);
    await expectNotice(page, SENTENCE);
    await openConfirm(page);
    await button(page, 'Keep it').click();
    await expect(confirmDialog(page)).toHaveCount(0);
    expect(await stored(page, HISTORY)).toBe(text);
    await openConfirm(page);
    await page.goBack();
    await expect(confirmDialog(page)).toHaveCount(0);
    expect(await stored(page, HISTORY)).toBe(text);
    await button(page, 'Not now').click();
    await expect(notice(page)).toHaveCount(0);
    expect(await stored(page, HISTORY)).toBe(text);
    await page.reload();
    await expect(page.getByTestId('card-0')).toBeVisible();
    await expect(notice(page)).toBeVisible();
    expect(await stored(page, HISTORY)).toBe(text);
  });
});

// The shortest notice body puts the confirm's Delete history over Reset history's top edge.
test('§2 a double tap near the top edge of Reset history (history-invalid-null.json) leaves the Reset confirm open at wc 2 and wordcell:history unchanged', async ({
  page,
}) => {
  const file = 'history-invalid-null.json';
  await start(page, file);
  await expectNotice(page, "Its format version can't be read.");
  const box = await button(page, 'Reset history').boundingBox();
  if (box === null) throw new Error('no Reset history box');
  await doubleTap(page, box.x + box.width / 2, box.y + 2);
  await expect(confirmDialog(page)).toBeVisible();
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(2);
  await expect(confirmDialog(page)).toBeVisible();
  expect(await stored(page, HISTORY)).toBe(fixture(file));
});
