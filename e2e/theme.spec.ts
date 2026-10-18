import { expect, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { openFixture } from './helpers/board';
import { onAndroid } from './helpers/project';
import { booted, openBoard } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';

// Epic themes ticket 4 (Q-36, Q-45, AD-10, AD-16, AD-17; TH-3): the theme preference and the
// pre-paint apply, on android, against a build carrying the test hook (the test-only `paper`
// entry is registered there). Fixtures: `prefs-theme-paper`, `prefs-invalid-theme-unknown`.

test.beforeEach(onAndroid);

const PREFS = 'wordcell:prefs';
const SESSION = 'wordcell:session';
const PAPER = '#F4EFE4';
const CHARCOAL = '#15171B';

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const panel = (page: Page) => page.getByRole('dialog', { name: 'Preferences', exact: true });
const themeGroup = (page: Page) => panel(page).getByRole('radiogroup', { name: 'Theme' });

const attr = (page: Page) =>
  page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const meta = (page: Page) =>
  page.evaluate(
    () => document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? null,
  );
const storedPrefs = (page: Page) => stored(page, PREFS);

async function openPrefs(page: Page): Promise<void> {
  await menuButton(page).click();
  await page
    .getByRole('dialog', { name: 'Menu', exact: true })
    .getByRole('button', { name: 'Preferences', exact: true })
    .click();
  await expect(panel(page)).toBeVisible();
}

async function prefsOf(page: Page) {
  return await page.evaluate(() => {
    const now = window.__wordcell?.current();
    if (now?.kind !== 'active') throw new Error(`store is ${now?.kind}`);
    return now.prefs;
  });
}

test('Q-45 AD-16 no flash: data-theme is first set to the stored theme and the meta matches by the first frame', async ({
  page,
}) => {
  await seedStorage(page, {
    session: fixture('session-idle-fresh.json'),
    prefs: fixture('prefs-theme-paper.json'),
  });
  await page.addInitScript(() => {
    const seen: (string | null)[] = [];
    const frames: { theme: string | null; meta: string | null }[] = [];
    const w = window as unknown as { __themeSeen: typeof seen; __themeFrames: typeof frames };
    w.__themeSeen = seen;
    w.__themeFrames = frames;
    new MutationObserver(() => {
      seen.push(document.documentElement.getAttribute('data-theme'));
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-theme'] });
    // Every frame once the board is mounted (the pre-apply frames are the exempt ones).
    const tick = () => {
      if (document.querySelector('[data-card-id]') !== null) {
        frames.push({
          theme: document.documentElement.getAttribute('data-theme'),
          meta:
            document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? null,
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const recorded = await page.evaluate(() => {
    const w = window as unknown as { __themeSeen: unknown[]; __themeFrames: unknown[] };
    return { seen: w.__themeSeen, frames: w.__themeFrames };
  });
  expect(recorded.seen).toEqual(['paper']);
  expect(recorded.frames.length).toBeGreaterThan(0);
  for (const frame of recorded.frames) expect(frame).toEqual({ theme: 'paper', meta: PAPER });
});

test('Q-45 a first launch applies the default theme', async ({ page }) => {
  await openBoard(page);
  expect(await attr(page)).toBe('default');
  expect(await meta(page)).toBe(CHARCOAL);
  expect((await prefsOf(page)).theme).toBe('default');
  expect(await storedPrefs(page)).toBeNull();
});

test('Q-45 AD-10 the Theme radiogroup switches at once, stores theme, and Charcoal removes it', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  const before = await stored(page, SESSION);
  await openPrefs(page);
  const group = themeGroup(page);
  await expect(group.getByRole('radio')).toHaveCount(2);
  await expect(group.getByRole('radio', { name: 'Charcoal' })).toBeChecked();
  await group.getByRole('radio', { name: 'Daylight Paper' }).check();
  expect(await attr(page)).toBe('paper');
  expect(await meta(page)).toBe(PAPER);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect((await prefsOf(page)).theme).toBe('paper');
  expect(JSON.parse((await storedPrefs(page)) ?? 'null')).toMatchObject({ theme: 'paper' });
  expect(await stored(page, SESSION)).toBe(before);
  await group.getByRole('radio', { name: 'Charcoal' }).check();
  expect(await attr(page)).toBe('default');
  expect(await meta(page)).toBe(CHARCOAL);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect((await prefsOf(page)).theme).toBe('default');
  expect(JSON.parse((await storedPrefs(page)) ?? 'null')).not.toHaveProperty('theme');
  expect(await stored(page, SESSION)).toBe(before);
});

test('Q-45 the choice survives a reload', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  await openPrefs(page);
  await themeGroup(page).getByRole('radio', { name: 'Daylight Paper' }).check();
  await page.reload();
  await expect(page.getByTestId('card-0')).toBeVisible();
  expect(await attr(page)).toBe('paper');
  expect(await meta(page)).toBe(PAPER);
  await openPrefs(page);
  await expect(themeGroup(page).getByRole('radio', { name: 'Daylight Paper' })).toBeChecked();
});

test('Q-45 the theme survives New game and Replay, never follows prefers-color-scheme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await seedStorage(page, {
    session: fixture('session-gave-up.json'),
    prefs: fixture('prefs-theme-paper.json'),
  });
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
  expect(await attr(page)).toBe('paper');
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await attr(page)).toBe('paper');
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('New game');
  await primary.click();
  await expect(primary).not.toHaveText('New game');
  expect(await attr(page)).toBe('paper');
  expect(await meta(page)).toBe(PAPER);
  await menuButton(page).click();
  await page
    .getByRole('dialog', { name: 'Menu', exact: true })
    .getByRole('button', { name: 'Replay this deal', exact: true })
    .click();
  expect(await attr(page)).toBe('paper');
  expect(await storedPrefs(page)).toBe(fixture('prefs-theme-paper.json'));
});

test('Q-45 the apply runs on the rejected-Session path', async ({ page }) => {
  await seedStorage(page, {
    session: fixture('session-invalid-version-unknown.json'),
    prefs: fixture('prefs-theme-paper.json'),
  });
  await page.goto('/');
  await booted(page);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('rejected');
  expect(await attr(page)).toBe('paper');
  expect(await meta(page)).toBe(PAPER);
});

test('AD-10 AD-15 an AD-7-valid but unregistered theme reaches Halted with the default look and prefs untouched', async ({
  page,
}) => {
  const text = JSON.stringify({
    version: 1,
    animationSpeed: 'normal',
    showTimer: false,
    theme: 'scifi',
  });
  await seedStorage(page, { session: fixture('session-idle-fresh.json'), prefs: text });
  await page.goto('/');
  await expect(page.getByRole('alertdialog')).toHaveCount(1);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('halted');
  expect(await attr(page)).toBeNull();
  expect(await meta(page)).toBe(CHARCOAL);
  expect(await storedPrefs(page)).toBe(text);
});

test('Q-36 an unknown theme value boots the default theme and leaves the key untouched until a setter', async ({
  page,
}) => {
  const text = fixture('prefs-invalid-theme-unknown.json');
  await seedStorage(page, { session: fixture('session-idle-fresh.json'), prefs: text });
  await openBoard(page);
  expect(await attr(page)).toBe('default');
  expect(await meta(page)).toBe(CHARCOAL);
  expect(await storedPrefs(page)).toBe(text);
  expect(await page.evaluate(() => window.__wordcell?.loaded().prefs)).toEqual({
    rejected: { reason: 'contents-unreadable', version: 1 },
  });
  await openPrefs(page);
  await themeGroup(page).getByRole('radio', { name: 'Daylight Paper' }).check();
  expect(JSON.parse((await storedPrefs(page)) ?? 'null')).toEqual({
    version: 1,
    animationSpeed: 'normal',
    showTimer: false,
    theme: 'paper',
  });
});
