import { expect, type Page, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';

// AD-13 nav adapter: reload, Forward, stale launch, the deferred History-notice push and the
// win → New game → back smoke, on android. The History notice (seeded history-invalid-*, a §2
// rejection flow) provides the pushed entries. Each page opens the app from its initial
// about:blank (Chromium keeps that entry), so "leaves the app" is goBack() landing on it.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'nav flows run on android');
});

const TITLE = "Your score history can't be read.";
const CONFIRM = 'Delete the score history?';
const REJECTED = "This saved game can't be opened.";
const VERSION_UNKNOWN = 'history-invalid-version-unknown.json';

type NavState = { wc: number; launch: number } | null;

const wc = (page: Page) => page.evaluate(() => history.state as NavState);
const notice = (page: Page) => page.getByRole('dialog', { name: TITLE });
const confirmDialog = (page: Page) => page.getByRole('dialog', { name: CONFIRM });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function start(page: Page, seed: { history: string; session?: string }): Promise<void> {
  await seedStorage(page, {
    history: fixture(seed.history),
    ...(seed.session !== undefined && { session: fixture(seed.session) }),
  });
  await page.goto('/');
}

async function boardReady(page: Page): Promise<void> {
  await expect(page.getByTestId('card-0')).toBeVisible();
}

async function launchOf(page: Page): Promise<number> {
  const state = await wc(page);
  if (state === null) throw new Error('no history state');
  return state.launch;
}

async function openConfirm(page: Page): Promise<void> {
  await button(page, 'Reset history').click();
  await expect(confirmDialog(page)).toBeVisible();
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(2);
}

async function expectLeaves(page: Page): Promise<void> {
  await page.goBack();
  await expect(page).toHaveURL('about:blank');
}

// After a reload with entries open: only the notice, at { wc: 1, launch: <new> }; the first back
// closes it, the next leaves the app.
async function expectRepushedNotice(page: Page, old: number): Promise<void> {
  await boardReady(page);
  await expect(notice(page)).toBeVisible();
  await expect(confirmDialog(page)).toHaveCount(0);
  const state = await wc(page);
  expect(state?.wc).toBe(1);
  expect(state?.launch).not.toBe(old);
  await page.goBack();
  await expect(notice(page)).toHaveCount(0);
  expect(await wc(page)).toEqual({ wc: 0, launch: state?.launch });
  await expectLeaves(page);
}

test('AD-13 reload with the notice open re-pushes only the notice at { wc: 1, launch: <new> }; back closes it, the next back leaves the app', async ({
  page,
}) => {
  await start(page, { history: VERSION_UNKNOWN });
  await boardReady(page);
  await expect(notice(page)).toBeVisible();
  const old = await launchOf(page);
  await page.reload();
  await expectRepushedNotice(page, old);
});

test('AD-13 reload with the notice and confirm open re-pushes only the notice at { wc: 1, launch: <new> }; back closes it, the next back leaves the app', async ({
  page,
}) => {
  await start(page, { history: VERSION_UNKNOWN });
  await boardReady(page);
  await openConfirm(page);
  const old = await launchOf(page);
  await page.reload();
  await expectRepushedNotice(page, old);
});

test('AD-13 Forward at depth 0: after Not now, goForward() reopens nothing and returns to wc 0; the next back leaves the app', async ({
  page,
}) => {
  await start(page, { history: VERSION_UNKNOWN });
  await boardReady(page);
  await button(page, 'Not now').click();
  await expect(notice(page)).toHaveCount(0);
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(0);
  await page.goForward();
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(0);
  await expect(notice(page)).toHaveCount(0);
  await expectLeaves(page);
});

test('AD-13 Forward at depth 1: after Keep it, goForward() keeps the notice, the confirm closed, wc 1', async ({
  page,
}) => {
  await start(page, { history: VERSION_UNKNOWN });
  await boardReady(page);
  await openConfirm(page);
  await button(page, 'Keep it').click();
  await expect(confirmDialog(page)).toHaveCount(0);
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(1);
  await page.goForward();
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(1);
  await expect(notice(page)).toBeVisible();
  await expect(confirmDialog(page)).toHaveCount(0);
});

test('AD-13 a stale launch entry reached by Forward is ignored: nothing opens and no back; the first back returns to the new base entry, the next leaves the app', async ({
  page,
}) => {
  await start(page, { history: VERSION_UNKNOWN });
  await boardReady(page);
  await openConfirm(page);
  await button(page, 'Delete history').click();
  await expect(notice(page)).toHaveCount(0);
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(0);
  const old = await launchOf(page);
  await page.reload();
  await boardReady(page);
  await expect(notice(page)).toHaveCount(0);
  const fresh = await launchOf(page);
  expect(fresh).not.toBe(old);
  expect(await wc(page)).toEqual({ wc: 0, launch: fresh });
  await page.goForward();
  await expect.poll(() => wc(page)).toEqual({ wc: 1, launch: old });
  await expect(notice(page)).toHaveCount(0);
  await expect(confirmDialog(page)).toHaveCount(0);
  await page.goBack();
  await expect.poll(() => wc(page)).toEqual({ wc: 0, launch: fresh });
  await expect(notice(page)).toHaveCount(0);
  await expectLeaves(page);
});

test('§2 AD-13 deferred push: a rejected Session plus an unreadable history pushes nothing; New game opens the notice at { wc: 1, launch } of the boot launch', async ({
  page,
}) => {
  await start(page, { history: VERSION_UNKNOWN, session: 'session-invalid-version-unknown.json' });
  await expect(page.getByRole('alertdialog', { name: REJECTED })).toBeVisible();
  await expect(notice(page)).toHaveCount(0);
  const boot = await wc(page);
  expect(boot?.wc).toBe(0);
  await button(page, 'New game').click();
  await boardReady(page);
  await expect(notice(page)).toBeVisible();
  await expect(button(page, 'Not now')).toBeFocused();
  expect(await wc(page)).toEqual({ wc: 1, launch: boot?.launch });
  await page.goBack();
  await expect(notice(page)).toHaveCount(0);
  await expectLeaves(page);
});

test('§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm', async ({
  page,
}) => {
  await start(page, { history: VERSION_UNKNOWN, session: 'session-invalid-version-unknown.json' });
  await expect(page.getByRole('alertdialog', { name: REJECTED })).toBeVisible();
  const box = await button(page, 'New game').boundingBox();
  if (box === null) throw new Error('no New game box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(80);
  await page.touchscreen.tap(x, y);
  await boardReady(page);
  await expect(notice(page)).toBeVisible();
  await expect(confirmDialog(page)).toHaveCount(0);
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(1);
  await expect(notice(page)).toBeVisible();
});

test('AD-13 win → New game → back leaves the app; no notice (already shown this launch; store not rejected)', async ({
  page,
}) => {
  await start(page, { history: VERSION_UNKNOWN, session: 'session-won.json' });
  await boardReady(page);
  await button(page, 'Not now').click();
  await expect(notice(page)).toHaveCount(0);
  await expect.poll(() => wc(page).then((state) => state?.wc)).toBe(0);
  await page.getByTestId('undo').click();
  await expect(page.getByTestId('redo')).toBeEnabled();
  await page.getByTestId('redo').click();
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('New game');
  await primary.click();
  await expect(primary).toHaveText('Validate');
  await expect(notice(page)).toHaveCount(0);
  expect((await wc(page))?.wc).toBe(0);
  await expectLeaves(page);
});
