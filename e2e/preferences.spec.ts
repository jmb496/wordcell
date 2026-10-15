import { expect, type Page, test } from '@playwright/test';
import { text } from '../src/ui/text';
import { stored } from './helpers/blocking';
import { glidesSettled, openFixture } from './helpers/board';
import { hidePage, showPage } from './helpers/lifecycle';
import { onAndroid } from './helpers/project';
import { booted } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';

// Epic 6 ticket 6.4 (SPEC CAP-7; R-76, R-82, spec §7.10, Q-36, AD-9, AD-10): the Preferences panel
// from the Menu row and the top-bar timer. Time-sensitive cases install `page.clock` before `goto`
// (so `now` never precedes the clock's `startedAt`) and pause it at 1000 ms, so only `runFor` moves
// time. Fixtures (seed 1): `session-composing` (playing, activeMs 0), `session-idle-fresh`,
// `session-won` (activeMs 0), `session-gave-up` (activeMs 1000, Score −530), `prefs-non-default`
// (slow, showTimer true), `prefs-fast`, `prefs-unreadable`.

const SESSION = 'wordcell:session';
const PREFS = 'wordcell:prefs';
const KEYS = ['wordcell:session', 'wordcell:history', 'wordcell:prefs'];

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const menu = (page: Page) => page.getByRole('dialog', { name: 'Menu', exact: true });
const panel = (page: Page) => page.getByRole('dialog', { name: 'Preferences', exact: true });
const timer = (page: Page) => page.locator('[data-band="topBar"] .timer');
const showTimerSwitch = (page: Page) => panel(page).getByRole('switch', { name: 'Show timer' });
const speed = (page: Page, name: string) =>
  panel(page).getByRole('radiogroup', { name: 'Animation speed' }).getByRole('radio', { name });

async function paused(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
}

async function openPanel(page: Page): Promise<void> {
  await menuButton(page).click();
  await menu(page).getByRole('button', { name: 'Preferences', exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(menu(page)).toHaveCount(0);
}

async function closePanel(page: Page): Promise<void> {
  await panel(page).getByRole('button', { name: 'Close preferences' }).click();
  await expect(panel(page)).toHaveCount(0);
}

const mss = text.timer;

const cssBase = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--wc-base-ms'));

const keys = (page: Page) =>
  page.evaluate((ks) => ks.map((k) => [k, localStorage.getItem(k)]), KEYS);

type Stored = { moves: unknown[]; activeMs: number; gaveUp: boolean };
const session = async (page: Page) => JSON.parse((await stored(page, SESSION)) ?? 'null') as Stored;

function withActiveMs(name: string, activeMs: number): string {
  return JSON.stringify({ ...JSON.parse(fixture(name)), activeMs });
}

async function openSeeded(page: Page, seed: Parameters<typeof seedStorage>[1]): Promise<void> {
  await seedStorage(page, seed);
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await booted(page);
}

test.describe('panel (android)', () => {
  test.beforeEach(onAndroid);

  test('R-76 Show timer on shows the timer ticking while playing and not at all when off', async ({
    page,
  }) => {
    await paused(page);
    await openFixture(page, 'session-composing');
    await expect(timer(page)).toHaveCount(0);
    await page.clock.runFor(5000);
    await expect(timer(page)).toHaveCount(0);
    await openPanel(page);
    await expect(showTimerSwitch(page)).toHaveAttribute('aria-checked', 'false');
    await showTimerSwitch(page).click();
    await expect(showTimerSwitch(page)).toHaveAttribute('aria-checked', 'true');
    // An open panel neither stops nor writes.
    const before = await keys(page);
    await page.clock.runFor(3000);
    await expect(timer(page)).toHaveText('0:08');
    expect((await keys(page)).filter(([k]) => k === SESSION)).toEqual(
      before.filter(([k]) => k === SESSION),
    );
    await closePanel(page);
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('0:10');
    await openPanel(page);
    await showTimerSwitch(page).click();
    await closePanel(page);
    await expect(timer(page)).toHaveCount(0);
  });

  for (const [row, confirm, accept] of [
    ['Replay this deal', 'Replay this deal?', 'Replay'],
    ['New game', 'Start a new game?', 'New game'],
  ] as const) {
    test(`§7.10 non-default prefs survive reload and ${row}; the timer shows 0:00 after it`, async ({
      page,
    }) => {
      await paused(page);
      await openFixture(page, 'session-composing', { prefs: 'prefs-non-default' });
      await expect(timer(page)).toBeVisible();
      expect(await cssBase(page)).toBe('320ms');
      await page.clock.runFor(4000);
      await expect(timer(page)).toHaveText('0:04');
      await menuButton(page).click();
      await menu(page).getByRole('button', { name: row, exact: true }).click();
      await page
        .getByRole('dialog', { name: confirm })
        .getByRole('button', { name: accept, exact: true })
        .click();
      await expect(timer(page)).toHaveText('0:00');
      expect(await stored(page, PREFS)).toBe(fixture('prefs-non-default.json'));
      await page.reload();
      await expect(page.getByTestId('card-0')).toBeVisible();
      await expect(timer(page)).toBeVisible();
      expect(await cssBase(page)).toBe('320ms');
      await openPanel(page);
      await expect(speed(page, 'Slow')).toBeChecked();
      await expect(showTimerSwitch(page)).toHaveAttribute('aria-checked', 'true');
    });
  }

  test('R-76 a New game from a finished game shows 0:00 and keeps the prefs', async ({ page }) => {
    await paused(page);
    await openFixture(page, 'session-gave-up', { prefs: 'prefs-non-default' });
    await expect(timer(page)).toHaveText('0:01');
    await menuButton(page).click();
    await menu(page).getByRole('button', { name: 'New game', exact: true }).click();
    await expect(timer(page)).toHaveText('0:00');
    expect(await stored(page, PREFS)).toBe(fixture('prefs-non-default.json'));
  });

  for (const [name, expected] of [
    ['session-gave-up', '0:01'],
    ['session-won', '0:00'],
  ] as const) {
    test(`R-76 the timer is frozen in Game over (${name} shows ${expected})`, async ({ page }) => {
      await paused(page);
      await openFixture(page, name, { prefs: 'prefs-non-default' });
      await expect(timer(page)).toHaveText(expected);
      await page.clock.runFor(5000);
      await expect(timer(page)).toHaveText(expected);
    });
  }

  test('R-76 advancing the clock then a forced re-derive leaves the gave-up timer unchanged', async ({
    page,
  }) => {
    await paused(page);
    await openFixture(page, 'session-gave-up', { prefs: 'prefs-non-default' });
    await expect(timer(page)).toHaveText('0:01');
    await page.clock.runFor(7000);
    await hidePage(page);
    await page.clock.runFor(3000);
    await showPage(page);
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('0:01');
  });

  test('R-76 Undo out of Game over resumes from the stored value', async ({ page }) => {
    await paused(page);
    await openSeeded(page, {
      session: withActiveMs('session-won.json', 5000),
      prefs: fixture('prefs-non-default.json'),
    });
    await expect(timer(page)).toHaveText('0:05');
    await page.clock.runFor(4000);
    await expect(timer(page)).toHaveText('0:05');
    await page.getByTestId('undo').click();
    await expect(timer(page)).toHaveText('0:05');
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('0:07');
  });

  test('R-76 live playing to Game over: the timer freezes at the transition and equals the stored activeMs', async ({
    page,
  }) => {
    await paused(page);
    await openFixture(page, 'session-idle-fresh', { prefs: 'prefs-non-default' });
    await page.clock.runFor(3000);
    await expect(timer(page)).toHaveText('0:03');
    await menuButton(page).click();
    await menu(page).getByRole('button', { name: 'Give up', exact: true }).click();
    await expect.poll(async () => (await session(page)).gaveUp).toBe(true);
    const frozen = await timer(page).textContent();
    expect(frozen).toBe(mss((await session(page)).activeMs));
    await page.clock.runFor(6000);
    await expect(timer(page)).toHaveText(frozen ?? '');
    await hidePage(page);
    await showPage(page);
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText(frozen ?? '');
    expect(frozen).toBe(mss((await session(page)).activeMs));
  });

  for (const name of ['session-composing', 'session-gave-up']) {
    test(`R-76 a tick writes nothing (${name}): every wordcell key and the move count stay put`, async ({
      page,
    }) => {
      await paused(page);
      await openFixture(page, name, { prefs: 'prefs-non-default' });
      const before = await keys(page);
      const moves = (await session(page)).moves.length;
      await page.clock.runFor(5000);
      await expect(timer(page)).toBeVisible();
      expect(await keys(page)).toEqual(before);
      expect((await session(page)).moves.length).toBe(moves);
    });
  }

  test('R-76 hidden, the displayed value stays constant and resumes within one tick after showPage', async ({
    page,
  }) => {
    await paused(page);
    await openFixture(page, 'session-composing', { prefs: 'prefs-non-default' });
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('0:02');
    await hidePage(page);
    await expect(timer(page)).toHaveText('0:02');
    await page.clock.runFor(5000);
    await expect(timer(page)).toHaveText('0:02');
    await showPage(page);
    await page.clock.runFor(1000);
    await expect(timer(page)).toHaveText('0:03');
  });

  for (const [prefsName, expected] of [
    ['prefs-fast', '90ms'],
    ['prefs-non-default', '320ms'],
  ] as const) {
    test(`§7.10 ${prefsName} gives --wc-base-ms ${expected}`, async ({ page }) => {
      await openFixture(page, 'session-idle-empty-column', { prefs: prefsName });
      expect(await cssBase(page)).toBe(expected);
    });
  }

  test('§7.10 Normal gives --wc-base-ms 180 and a glide under Fast is shorter than under Normal', async ({
    page,
  }) => {
    // The longest running face animation right after clicking `testid`, in the click's task.
    const glide = (testid: string) =>
      page.evaluate((id) => {
        document.querySelector<HTMLElement>(`[data-testid="${id}"]`)?.click();
        const durations = [...document.querySelectorAll<HTMLElement>('[data-card-id] > .face')]
          .flatMap((f) => f.getAnimations())
          .map((a) => Number(a.effect?.getTiming().duration));
        return Math.max(0, ...durations);
      }, testid);
    await openFixture(page, 'session-place', { prefs: 'prefs-fast' });
    expect(await cssBase(page)).toBe('90ms');
    const fast = await glide('undo');
    await glidesSettled(page);
    await openPanel(page);
    await speed(page, 'Normal').check();
    await closePanel(page);
    expect(await cssBase(page)).toBe('180ms');
    const normal = await glide('redo');
    expect(fast).toBeGreaterThan(0);
    expect(fast).toBeLessThan(normal);
  });

  test('§7.10 a change applies at once, writes a valid record and leaves the Session and Undo alone', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const before = await stored(page, SESSION);
    await expect(page.getByTestId('undo')).toBeEnabled();
    await openPanel(page);
    await expect(speed(page, 'Normal')).toBeChecked();
    await speed(page, 'Fast').check();
    expect(await stored(page, PREFS)).toBe(
      '{"version":1,"animationSpeed":"fast","showTimer":false}',
    );
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--wc-base-ms'),
      ),
    ).toBe('90ms');
    await showTimerSwitch(page).click();
    expect(await stored(page, PREFS)).toBe(
      '{"version":1,"animationSpeed":"fast","showTimer":true}',
    );
    await closePanel(page);
    expect(await stored(page, SESSION)).toBe(before);
    await expect(page.getByTestId('undo')).toBeEnabled();
    await expect(page.getByTestId('redo')).toBeDisabled();
  });

  test('Q-36 unreadable prefs show Normal and off; the first change writes a valid record', async ({
    page,
  }) => {
    await seedStorage(page, {
      session: fixture('session-idle-empty-column.json'),
      prefs: fixture('prefs-unreadable.json'),
    });
    await page.goto('/');
    await expect(page.getByTestId('card-0')).toBeVisible();
    expect(await stored(page, PREFS)).toBe(fixture('prefs-unreadable.json'));
    await openPanel(page);
    await expect(speed(page, 'Normal')).toBeChecked();
    await expect(showTimerSwitch(page)).toHaveAttribute('aria-checked', 'false');
    await speed(page, 'Slow').check();
    expect(await stored(page, PREFS)).toBe(
      '{"version":1,"animationSpeed":"slow","showTimer":false}',
    );
  });

  test('R-82 at 360 px the top bar fits Score −530 and a 12:03:04 timer, without overlap or overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await paused(page);
    await openSeeded(page, {
      session: withActiveMs('session-gave-up.json', 43_384_000),
      prefs: fixture('prefs-non-default.json'),
    });
    await expect(timer(page)).toHaveText('12:03:04');
    const bar = page.locator('[data-band="topBar"]');
    await expect(bar.locator('.score')).toHaveText('Score −530');
    expect(await bar.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await timer(page).evaluate((el) => el.scrollWidth)).toBeLessThanOrEqual(64);
    const board = await bar.boundingBox();
    const parts = [
      menuButton(page),
      bar.locator('.score'),
      timer(page),
      page.getByTestId('undo'),
      page.getByTestId('redo'),
    ];
    let previousRight = board?.x ?? 0;
    for (const part of parts) {
      const b = await part.boundingBox();
      expect(b?.x).toBeGreaterThanOrEqual(previousRight - 0.5);
      previousRight = (b?.x ?? 0) + (b?.width ?? 0);
    }
    expect(previousRight).toBeLessThanOrEqual((board?.x ?? 0) + (board?.width ?? 0) + 0.5);
  });

  test('R-76 the timer box keeps its width across ticks, including 59:59 to 1:00:01', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await paused(page);
    await openSeeded(page, {
      session: withActiveMs('session-composing.json', 3_599_000),
      prefs: fixture('prefs-non-default.json'),
    });
    await expect(timer(page)).toHaveText('59:59');
    const before = (await timer(page).boundingBox())?.width;
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('1:00:01');
    expect((await timer(page).boundingBox())?.width).toBe(before);
    expect(before).toBe(64);
  });
});

test.describe('closing and focus', () => {
  for (const [name, close] of [
    ['the back control', (page: Page) => closePanel(page)],
    ['Esc', (page: Page) => page.keyboard.press('Escape')],
    ['browser back', async (page: Page) => void (await page.goBack())],
  ] as const) {
    test(`AD-13 closing the panel by ${name} leaves focus on the ☰ button`, async ({
      page,
    }, info) => {
      test.skip(
        info.project.name !== 'android' && name !== 'Esc',
        'Esc also runs on desktop; the rest on android',
      );
      await openFixture(page, 'session-idle-empty-column');
      await openPanel(page);
      await expect(page.getByRole('heading', { name: 'Preferences' })).toBeFocused();
      await close(page);
      await expect(panel(page)).toHaveCount(0);
      await expect(menuButton(page)).toBeFocused();
    });
  }
});
