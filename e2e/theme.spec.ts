import { expect, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { openFixture } from './helpers/board';
import { onAndroid } from './helpers/project';
import { booted, openBoard } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';

// Epic themes ticket 4 (Q-36, Q-45, AD-10, AD-16, AD-17; TH-3): the theme preference and the
// pre-paint apply, on android (all five themes are registered in every build). Fixtures: `prefs-theme-paper`, `prefs-invalid-theme-unknown`.

test.beforeEach(onAndroid);

const PREFS = 'wordcell:prefs';
const SESSION = 'wordcell:session';
const PAPER = '#ECE6D8';
const CHARCOAL = '#15171B';
const SCIFI = '#0A0F1C';
const GARDEN = '#101A14';
const STEAMPUNK = '#1D1510';

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
const rootVar = (page: Page, name: string) =>
  page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase(),
    name,
  );
const colorScheme = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);

// Q-45: the switch is at once. The one exception is the Show timer switch track, whose existing
// `background` transition (PreferencesPanel, `--wc-base-ms`) also fires when its surface-raised
// token changes with the theme; reported on the ticket, component left unchanged.
async function expectNoThemeAnimations(page: Page): Promise<void> {
  const running = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => {
        const target = (a.effect as KeyframeEffect | null)?.target;
        return !(
          a instanceof CSSTransition &&
          target instanceof HTMLElement &&
          target.classList.contains('track')
        );
      }).length,
  );
  expect(running).toBe(0);
}

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
    // Every frame from the first one: the inline head script (AD-16) sets data-theme before paint.
    const tick = () => {
      frames.push({
        theme: document.documentElement.getAttribute('data-theme'),
        meta: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? null,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const recorded = await page.evaluate(() => {
    const w = window as unknown as {
      __themeSeen: unknown[];
      __themeFrames: { theme: string | null; meta: string | null }[];
    };
    return { seen: w.__themeSeen, frames: w.__themeFrames };
  });
  expect(recorded.seen[0]).toBe('paper');
  expect(recorded.frames.length).toBeGreaterThan(0);
  for (const frame of recorded.frames) expect(frame.theme).toBe('paper');
  expect(recorded.frames.at(-1)?.meta).toBe(PAPER);
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
  await expect(group.getByRole('radio')).toHaveCount(5);
  await expect(group.getByRole('radio').nth(0)).toHaveAccessibleName('Charcoal');
  await expect(group.getByRole('radio').nth(1)).toHaveAccessibleName('Deep Space');
  await expect(group.getByRole('radio').nth(2)).toHaveAccessibleName('Greenhouse Dusk');
  await expect(group.getByRole('radio').nth(3)).toHaveAccessibleName('Brass and Walnut');
  await expect(group.getByRole('radio').nth(4)).toHaveAccessibleName('Daylight Paper');
  await expect(group.getByRole('radio', { name: 'Charcoal' })).toBeChecked();
  const defaults = {
    scrim: await rootVar(page, '--wc-scrim'),
    table: await rootVar(page, '--wc-table'),
    face: await rootVar(page, '--wc-card-face'),
  };
  expect(await colorScheme(page)).toBe('dark');
  await group.getByRole('radio', { name: 'Daylight Paper' }).check();
  expect(await attr(page)).toBe('paper');
  expect(await colorScheme(page)).toBe('light');
  expect(await meta(page)).toBe(PAPER);
  expect(await rootVar(page, '--wc-scrim')).toBe(defaults.scrim);
  await expectNoThemeAnimations(page);
  expect((await prefsOf(page)).theme).toBe('paper');
  expect(JSON.parse((await storedPrefs(page)) ?? 'null')).toMatchObject({ theme: 'paper' });
  expect(await stored(page, SESSION)).toBe(before);
  await group.getByRole('radio', { name: 'Charcoal' }).check();
  expect(await attr(page)).toBe('default');
  expect(await meta(page)).toBe(CHARCOAL);
  expect(await rootVar(page, '--wc-table')).toBe(defaults.table);
  expect(await rootVar(page, '--wc-card-face')).toBe(defaults.face);
  await expectNoThemeAnimations(page);
  expect((await prefsOf(page)).theme).toBe('default');
  expect(JSON.parse((await storedPrefs(page)) ?? 'null')).not.toHaveProperty('theme');
  expect(await stored(page, SESSION)).toBe(before);
});

test('Q-45 AD-10 AD-16 Deep Space switches at once with both art layers, Charcoal removes them, a reload keeps it', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPrefs(page);
  const group = themeGroup(page);
  await group.getByRole('radio', { name: 'Deep Space' }).check();
  expect(await attr(page)).toBe('scifi');
  expect(await colorScheme(page)).toBe('dark');
  expect(await meta(page)).toBe(SCIFI);
  expect(await rootVar(page, '--wc-table-art')).not.toBe('none');
  expect(await rootVar(page, '--wc-card-texture')).not.toBe('none');
  await expectNoThemeAnimations(page);
  await page.reload();
  await expect(page.getByTestId('card-0')).toBeVisible();
  expect(await attr(page)).toBe('scifi');
  expect(await meta(page)).toBe(SCIFI);
  await openPrefs(page);
  await expect(themeGroup(page).getByRole('radio', { name: 'Deep Space' })).toBeChecked();
  await themeGroup(page).getByRole('radio', { name: 'Charcoal' }).check();
  expect(await attr(page)).toBe('default');
  expect(await meta(page)).toBe(CHARCOAL);
  expect(await rootVar(page, '--wc-table-art')).toBe('none');
  expect(await rootVar(page, '--wc-card-texture')).toBe('none');
});

test('Q-45 AD-10 AD-16 Greenhouse Dusk switches at once with both art layers, Charcoal removes them, a reload keeps it', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPrefs(page);
  const group = themeGroup(page);
  await group.getByRole('radio', { name: 'Greenhouse Dusk' }).check();
  expect(await attr(page)).toBe('garden');
  expect(await colorScheme(page)).toBe('dark');
  expect(await meta(page)).toBe(GARDEN);
  expect(await rootVar(page, '--wc-table-art')).not.toBe('none');
  expect(await rootVar(page, '--wc-card-texture')).not.toBe('none');
  await expectNoThemeAnimations(page);
  await page.reload();
  await expect(page.getByTestId('card-0')).toBeVisible();
  expect(await attr(page)).toBe('garden');
  expect(await meta(page)).toBe(GARDEN);
  await openPrefs(page);
  await expect(themeGroup(page).getByRole('radio', { name: 'Greenhouse Dusk' })).toBeChecked();
  await themeGroup(page).getByRole('radio', { name: 'Charcoal' }).check();
  expect(await attr(page)).toBe('default');
  expect(await meta(page)).toBe(CHARCOAL);
  expect(await rootVar(page, '--wc-table-art')).toBe('none');
  expect(await rootVar(page, '--wc-card-texture')).toBe('none');
});

test('Q-45 AD-10 AD-16 Brass and Walnut switches at once with both art layers, Charcoal removes them, a reload keeps it', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPrefs(page);
  const group = themeGroup(page);
  await group.getByRole('radio', { name: 'Brass and Walnut' }).check();
  expect(await attr(page)).toBe('steampunk');
  expect(await colorScheme(page)).toBe('dark');
  expect(await meta(page)).toBe(STEAMPUNK);
  expect(await rootVar(page, '--wc-table-art')).not.toBe('none');
  expect(await rootVar(page, '--wc-card-texture')).not.toBe('none');
  await expectNoThemeAnimations(page);
  await page.reload();
  await expect(page.getByTestId('card-0')).toBeVisible();
  expect(await attr(page)).toBe('steampunk');
  expect(await meta(page)).toBe(STEAMPUNK);
  await openPrefs(page);
  await expect(themeGroup(page).getByRole('radio', { name: 'Brass and Walnut' })).toBeChecked();
  await themeGroup(page).getByRole('radio', { name: 'Charcoal' }).check();
  expect(await attr(page)).toBe('default');
  expect(await meta(page)).toBe(CHARCOAL);
  expect(await rootVar(page, '--wc-table-art')).toBe('none');
  expect(await rootVar(page, '--wc-card-texture')).toBe('none');
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
    theme: 'plum',
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
