import { expect, type Page, test } from '@playwright/test';
import { hidePage } from './helpers/lifecycle';
import { fixture, seedStorage } from './helpers/seed';

// Preferences and the motion variables (§7.10, Q-36, R-76, AD-10) through the AD-17 hook, on
// android.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'prefs flows run on android');
});

const PREFS = 'wordcell:prefs';
const DEFAULTS = { version: 1, animationSpeed: 'normal', showTimer: false };

// AD-10: a root CSS variable as computed.
function cssVar(page: Page, name: string): Promise<string> {
  return page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n), name);
}

function storedPrefs(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), PREFS);
}

function current(page: Page) {
  return page.evaluate(() => {
    const hook = window.__wordcell;
    if (hook === undefined) throw new Error('window.__wordcell is missing');
    return hook.current();
  });
}

function loaded(page: Page) {
  return page.evaluate(() => {
    const hook = window.__wordcell;
    if (hook === undefined) throw new Error('window.__wordcell is missing');
    return hook.loaded();
  });
}

async function prefsOf(page: Page): Promise<unknown> {
  const now = await current(page);
  if (now.kind !== 'active') throw new Error(`store is ${now.kind}`);
  return now.prefs;
}

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
}

async function reload(page: Page): Promise<void> {
  await page.reload();
  await expect(page.getByTestId('card-0')).toBeVisible();
}

test('§7.10 non-default prefs set 320ms and survive New game and reload', async ({ page }) => {
  const text = fixture('prefs-non-default.json');
  await seedStorage(page, { session: fixture('session-gave-up.json'), prefs: text });
  await open(page);
  expect(await cssVar(page, '--wc-base-ms')).toBe('320ms');
  expect(await prefsOf(page)).toEqual(JSON.parse(text));
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('New game');
  await primary.click();
  await expect(primary).not.toHaveText('New game');
  expect(await storedPrefs(page)).toBe(text);
  expect(await prefsOf(page)).toEqual(JSON.parse(text));
  expect(await cssVar(page, '--wc-base-ms')).toBe('320ms');
  await reload(page);
  expect(await storedPrefs(page)).toBe(text);
  expect(await prefsOf(page)).toEqual(JSON.parse(text));
  expect(await cssVar(page, '--wc-base-ms')).toBe('320ms');
});

test('§7.10 non-default prefs survive Undo and Redo', async ({ page }) => {
  const text = fixture('prefs-non-default.json');
  await seedStorage(page, { session: fixture('session-place.json'), prefs: text });
  await open(page);
  await expect(page.getByTestId('redo')).toBeDisabled();
  await page.getByTestId('undo').click();
  await expect(page.getByTestId('redo')).toBeEnabled();
  expect(await storedPrefs(page)).toBe(text);
  expect(await cssVar(page, '--wc-base-ms')).toBe('320ms');
  await page.getByTestId('redo').click();
  await expect(page.getByTestId('redo')).toBeDisabled();
  expect(await storedPrefs(page)).toBe(text);
  expect(await cssVar(page, '--wc-base-ms')).toBe('320ms');
  expect(await prefsOf(page)).toEqual(JSON.parse(text));
});

test('Q-36 unreadable prefs give the defaults silently and stay untouched', async ({ page }) => {
  const text = fixture('prefs-unreadable.json');
  await seedStorage(page, { session: fixture('session-place.json'), prefs: text });
  await open(page);
  expect(await cssVar(page, '--wc-base-ms')).toBe('180ms');
  expect(await storedPrefs(page)).toBe(text);
  expect((await loaded(page)).prefs).toEqual({
    rejected: { reason: 'contents-unreadable', version: 1 },
  });
  expect((await current(page)).kind).toBe('active');
  expect(await prefsOf(page)).toEqual(DEFAULTS);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await hidePage(page);
  expect(await storedPrefs(page)).toBe(text);
  await reload(page);
  expect(await storedPrefs(page)).toBe(text);
  expect(await cssVar(page, '--wc-base-ms')).toBe('180ms');
  expect((await loaded(page)).prefs).toEqual({
    rejected: { reason: 'contents-unreadable', version: 1 },
  });
  expect(await prefsOf(page)).toEqual(DEFAULTS);
});

test('R-76 a first launch has Show timer off', async ({ page }) => {
  await open(page);
  expect((await loaded(page)).prefs).toBeNull();
  expect(await prefsOf(page)).toMatchObject({ showTimer: false });
});

test('§7.10 a first launch uses Normal speed and writes no prefs', async ({ page }) => {
  await open(page);
  expect(await prefsOf(page)).toMatchObject({ animationSpeed: 'normal' });
  expect(await cssVar(page, '--wc-base-ms')).toBe('180ms');
  await hidePage(page);
  expect(await storedPrefs(page)).toBeNull();
});

test('§7.10 New game without stored prefs writes none', async ({ page }) => {
  await seedStorage(page, { session: fixture('session-gave-up.json') });
  await open(page);
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('New game');
  await primary.click();
  await expect(primary).not.toHaveText('New game');
  expect(await storedPrefs(page)).toBeNull();
});

test('AD-10 reduced motion follows the media query live', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page);
  expect(await cssVar(page, '--wc-reduced')).toBe('0');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => cssVar(page, '--wc-reduced')).toBe('1');
  expect(await cssVar(page, '--wc-base-ms')).toBe('180ms');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => cssVar(page, '--wc-reduced')).toBe('0');
});

test('AD-10 reduced motion at launch sets --wc-reduced 1', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  expect(await cssVar(page, '--wc-reduced')).toBe('1');
  expect(await cssVar(page, '--wc-base-ms')).toBe('180ms');
});
