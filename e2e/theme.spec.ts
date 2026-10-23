import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { cssDecls, themeRecords } from '../src/ui/theme/colour-literals';
import { stored } from './helpers/blocking';
import { openFixture } from './helpers/board';
import { onAndroid, onDesktop } from './helpers/project';
import { booted, openBoard } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';
import { tokenColor } from './helpers/style';

// Epic themes ticket 4 (Q-36, Q-45, AD-10, AD-16, AD-17; TH-3): the theme preference and the
// pre-paint apply, on android (all six themes are registered in every build); the Theme list at
// 360 px on both projects and the keyboard focus ring on desktop (owner decisions D1, D5). Fixtures: `prefs-theme-paper`, `prefs-invalid-theme-unknown`.

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

// AD-10: what app.css declares for one theme id: its `--wc-*` record over the default record (an
// alternate record may omit the optional art tokens) and its `color-scheme`, else the `:root` one.
const APP_CSS = readFileSync(path.resolve(import.meta.dirname, '../src/ui/app.css'), 'utf8');
const RECORDS = themeRecords(APP_CSS);
const SCHEMES = cssDecls(APP_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
  .filter((decl) => decl.stack.length === 1 && decl.name === 'color-scheme')
  .map((decl) => ({ parts: (decl.stack[0] as string).split(',').map((p) => p.trim()), decl }));
function declared(id: string): { vars: Map<string, string>; scheme: string } {
  const record = RECORDS.get(id);
  if (record === undefined) throw new Error(`app.css has no record for theme '${id}'`);
  const own = SCHEMES.find(({ parts }) =>
    parts.some((p) => p === `[data-theme="${id}"]` || p === `:root[data-theme="${id}"]`),
  );
  const root = SCHEMES.find(({ parts }) => parts.includes(':root'));
  const scheme = (own ?? root)?.decl.value;
  if (scheme === undefined) throw new Error(`app.css sets no color-scheme for theme '${id}'`);
  return { vars: new Map([...(RECORDS.get('default') ?? []), ...record]), scheme };
}
const computedRoot = (page: Page, names: string[]) =>
  page.evaluate((list) => {
    const style = getComputedStyle(document.documentElement);
    return {
      vars: Object.fromEntries(list.map((n) => [n, style.getPropertyValue(n).trim()])),
      scheme: style.colorScheme,
    };
  }, names);

async function prefsOf(page: Page) {
  return await page.evaluate(() => {
    const now = window.__wordcell?.current();
    if (now?.kind !== 'active') throw new Error(`store is ${now?.kind}`);
    return now.prefs;
  });
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

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
          meta:
            document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? null,
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
    await expect(group.getByRole('radio')).toHaveCount(6);
    await expect(group.getByRole('radio').nth(0)).toHaveAccessibleName('Charcoal');
    await expect(group.getByRole('radio').nth(1)).toHaveAccessibleName('Deep Space');
    await expect(group.getByRole('radio').nth(2)).toHaveAccessibleName('Greenhouse Dusk');
    await expect(group.getByRole('radio').nth(3)).toHaveAccessibleName('Brass and Walnut');
    await expect(group.getByRole('radio').nth(4)).toHaveAccessibleName('Daylight Paper');
    await expect(group.getByRole('radio').nth(5)).toHaveAccessibleName('Plum Dusk');
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

  test('Q-45 AD-10 AD-16 Plum Dusk switches at once with no art, Charcoal restores, a reload keeps it', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPrefs(page);
    const group = themeGroup(page);
    await group.getByRole('radio', { name: 'Plum Dusk' }).check();
    expect(await attr(page)).toBe('plum');
    expect(await colorScheme(page)).toBe('dark');
    expect(await meta(page)).toBe('#1D1028');
    expect(await rootVar(page, '--wc-table-art')).toBe('none');
    expect(await rootVar(page, '--wc-card-texture')).toBe('none');
    await expectNoThemeAnimations(page);
    await page.reload();
    await expect(page.getByTestId('card-0')).toBeVisible();
    expect(await attr(page)).toBe('plum');
    expect(await meta(page)).toBe('#1D1028');
    await openPrefs(page);
    await expect(themeGroup(page).getByRole('radio', { name: 'Plum Dusk' })).toBeChecked();
    await themeGroup(page).getByRole('radio', { name: 'Charcoal' }).check();
    expect(await attr(page)).toBe('default');
    expect(await meta(page)).toBe(CHARCOAL);
  });

  test('AD-10 Q-45 every registered theme computes its app.css record on the root, in any source order', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPrefs(page);
    const radios = themeGroup(page).getByRole('radio');
    const count = await radios.count();
    expect(count).toBeGreaterThan(0);
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      await radios.nth(i).check();
      await radios.nth(i).focus();
      const id = await attr(page);
      if (id === null) throw new Error('no data-theme after choosing a theme');
      ids.push(id);
      const expected = declared(id);
      const actual = await computedRoot(page, [...expected.vars.keys()]);
      expect({ id, ...actual }).toEqual({
        id,
        vars: Object.fromEntries(expected.vars),
        scheme: expected.scheme,
      });
    }
    expect([...ids].sort()).toEqual([...RECORDS.keys()].sort());
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
});

// Owner decision D1 (2026-10-22): Theme is a vertical single-choice list; at 360 px, with no
// scrolling, every theme's label lies inside the group, clear of the header and inside the
// viewport, on a row of at least 44 px, and a tap at its centre hits that theme's radio.
test('AD-10 Q-45 at 360 px every Theme label lies inside the group and is hit at its centre, without scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh');
  await openPrefs(page);
  const radios = themeGroup(page).getByRole('radio');
  await expect(radios).toHaveCount(RECORDS.size);
  const rows = await themeGroup(page).evaluate((group) => {
    const header = (group.closest('[role="dialog"]') as Element)
      .querySelector('header')
      ?.getBoundingClientRect();
    if (header === undefined) throw new Error('the panel has no header');
    const g = group.getBoundingClientRect();
    return [...group.querySelectorAll('label')].map((label) => {
      const input = label.querySelector('input');
      const span = label.querySelector('span');
      if (input === null || span === null) throw new Error('a theme row without input or label');
      const range = document.createRange();
      range.selectNodeContents(span);
      const t = range.getBoundingClientRect();
      const row = label.getBoundingClientRect();
      const hit = document.elementFromPoint(t.x + t.width / 2, t.y + t.height / 2);
      return {
        name: span.textContent,
        rowHeight: row.height,
        inGroup: t.left >= g.left && t.right <= g.right && t.top >= g.top && t.bottom <= g.bottom,
        inRow:
          t.left >= row.left && t.right <= row.right && t.top >= row.top && t.bottom <= row.bottom,
        inView:
          t.left >= 0 && t.right <= innerWidth && t.top >= header.bottom && t.bottom <= innerHeight,
        hit: hit === input,
      };
    });
  });
  expect(rows).toHaveLength(RECORDS.size);
  for (const row of rows) {
    expect(row.rowHeight, `${row.name}`).toBeGreaterThanOrEqual(44);
    expect(row, `${row.name}`).toMatchObject({
      inGroup: true,
      inRow: true,
      inView: true,
      hit: true,
    });
  }
  expect(await page.evaluate(() => [scrollX, scrollY])).toEqual([0, 0]);
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  // The colour classes of the pixel rows down the middle of `label`'s top edge: `t` table, `a`
  // accent-teal, `.` anything else (an anti-aliased or border row).
  async function topRows(page: Page, label: Locator): Promise<string> {
    const box = await label.boundingBox();
    if (box === null) throw new Error('no box for the segment');
    const clip = {
      x: Math.round(box.x + box.width / 2),
      y: Math.floor(box.y),
      width: 1,
      height: 12,
    };
    const png = await page.screenshot({ clip });
    const table = await tokenColor(page, '--wc-table');
    const teal = await tokenColor(page, '--wc-accent-teal');
    return await page.evaluate(
      async ({ b64, colours }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx === null) throw new Error('no 2d context');
        ctx.drawImage(img, 0, 0);
        const rgb = (c: string) => (c.match(/\d+/g) ?? []).slice(0, 3).map(Number);
        const [t, a] = [rgb(colours.table), rgb(colours.teal)];
        const near = (p: number[], q: number[]) =>
          p.every((v, i) => Math.abs(v - (q[i] ?? 0)) <= 6);
        let out = '';
        for (let y = 0; y < img.height; y++) {
          const p = [...ctx.getImageData(0, y, 1, 1).data.slice(0, 3)];
          out += near(p, t) ? 't' : near(p, a) ? 'a' : '.';
        }
        return out;
      },
      { b64: png.toString('base64'), colours: { table, teal } },
    );
  }

  // Owner decision D5 (2026-10-22), DESIGN.md Focus ring: the keyboard-focused segment, which is
  // the checked one with its teal fill, draws the teal ring with a table-coloured gap between it
  // and the fill, in the Theme and the Animation speed groups, under every registered theme.
  test('AD-10 Q-45 the focused checked segment shows a table-coloured gap inside its ring in every theme', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPrefs(page);
    // The panel's entry fade and slide have ended, so the pixels are its settled colours.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    const radios = themeGroup(page).getByRole('radio');
    await expect(radios).toHaveCount(RECORDS.size);
    const speed = panel(page).getByRole('radiogroup', { name: 'Animation speed' });
    for (let i = 0; i < RECORDS.size; i++) {
      await radios.nth(i).check();
      await radios.nth(i).focus();
      const id = await attr(page);
      // Keyboard focus back onto the checked theme row (from Show timer), then onto the checked
      // speed segment (two steps back: Show timer, then the speed group).
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      const themeRow = themeGroup(page).locator('label:has(input:checked)');
      await expect(themeRow.locator('input')).toBeFocused();
      expect(await themeRow.locator('input').evaluate((el) => el.matches(':focus-visible'))).toBe(
        true,
      );
      expect(await topRows(page, themeRow), `${id} theme row`).toMatch(/a+\.*t+\.*a+/);
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
      const speedSegment = speed.locator('label:has(input:checked)');
      await expect(speedSegment.locator('input')).toBeFocused();
      expect(await topRows(page, speedSegment), `${id} speed segment`).toMatch(/a+\.*t+\.*a+/);
    }
  });
});
