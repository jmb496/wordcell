import { expect, type Page, test } from '@playwright/test';
import {
  centre,
  collapseEndSheet,
  END_SHEET,
  glidesSettled,
  openFixture,
  tapAt,
} from './helpers/board';
import { hidePage, showPage } from './helpers/lifecycle';
import { onAndroid, onDesktop } from './helpers/project';

// Ticket 5.13 (epic 5 SPEC CAP-10, F8, F23; AD-14, AD-9): the winning-animation input guard.
// session-won plus one Undo is the Place phase whose Confirm wins (cell 6 receives the last word).
// Animation speed Slow is `prefs-non-default` (base 320 ms), Fast is `prefs-fast`, Normal is the
// default. The Vitest guard cases in src/ui/motion.test.ts are authoritative for held-key repeats;
// repeated `keyboard.down('Enter')` is Playwright's closest stand-in for a held key.

const primary = (page: Page) => page.getByTestId('primary-action');
const sheet = (page: Page) => page.locator('[data-view-sheet]');

type Stored = { seed: number; moves: unknown[]; cursor: unknown };
async function stored(page: Page): Promise<Stored> {
  const text = await page.evaluate(() => localStorage.getItem('wordcell:session'));
  if (text === null) throw new Error('no stored session');
  const { seed, moves, cursor } = JSON.parse(text) as Stored;
  return { seed, moves, cursor };
}

const running = (page: Page) => page.evaluate(() => document.getAnimations().length);

type Recorded = { __seen: Record<string, boolean>; __bubbled: string[]; __afterBack?: number };

// Records whether an element matching `selector` is ever added from now on (a MutationObserver, so
// a sheet that opens and closes again before the next check is still seen); returns the reader.
async function watchFor(page: Page, selector: string): Promise<() => Promise<boolean>> {
  await page.evaluate((s) => {
    const w = window as unknown as Recorded;
    w.__seen ??= {};
    w.__seen[s] = document.querySelector(s) !== null;
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element && (node.matches(s) || node.querySelector(s) !== null)) {
            w.__seen[s] = true;
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }, selector);
  return () => page.evaluate((s) => (window as unknown as Recorded).__seen[s] === true, selector);
}

// Records every event of `types` that bubbles to `window`: the guard stops a consumed event at
// document capture, so a consumed input records nothing.
async function recordBubbled(
  page: Page,
  types = ['pointerdown', 'pointerup', 'click', 'keydown', 'keyup'],
): Promise<() => Promise<string[]>> {
  await page.evaluate((list) => {
    const w = window as unknown as Recorded;
    w.__bubbled = [];
    for (const type of list) {
      window.addEventListener(type, (event) => {
        const key = event instanceof KeyboardEvent ? ` ${event.key}` : '';
        w.__bubbled.push(`${type}${key}`);
      });
    }
  }, types);
  return () => page.evaluate(() => (window as unknown as Recorded).__bubbled);
}

const END_SHEET_EL = '[aria-labelledby="end-title"]';
const VIEW_EL = '[data-view-sheet]';

// Opens session-won, undoes once (Place), returns the point of cell 6 and of the primary action.
async function place(page: Page, prefs?: string) {
  await openFixture(page, 'session-won', {
    ...(prefs === undefined ? {} : { prefs }),
    steps: ['undo'],
  });
  await expect(primary(page)).toHaveAccessibleName('Confirm');
  return {
    cell: await centre(page.getByTestId('wordcell-6')),
    action: await centre(primary(page)),
  };
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('AD-14 F8 a cell 6 tap during the Confirm animation opens no view, after settle it opens (Slow)', async ({
    page,
  }) => {
    const { cell, action } = await place(page, 'prefs-non-default');
    await tapAt(page, action);
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveCount(0);
    await glidesSettled(page);
    // The consumed tap's backstop (Slow snap 320 ms) and the 300 ms minimum pass.
    await page.waitForTimeout(700);
    await expect(sheet(page)).toHaveCount(0);
    await collapseEndSheet(page);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
  });

  for (const [name, prefs, reduced] of [
    ['Slow', 'prefs-non-default', false],
    ['reduced motion', undefined, true],
    ['Fast', 'prefs-fast', false],
  ] as const) {
    test(`AD-14 F8 F23 a double tap on primary-action leaves the stored session as after the first Confirm, no New game (${name})`, async ({
      page,
    }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
      const { action } = await place(page, prefs);
      await tapAt(page, action);
      const after = await stored(page);
      // The gap to the second tap is not asserted: tapAt timing is not reliable enough to pin it
      // under 300 ms for Fast and reduced motion without flakiness. Only Slow asserts a running animation; Fast and reduced motion rely on the 300 ms minimum.
      if (name === 'Slow') expect(await running(page)).toBeGreaterThan(0);
      await tapAt(page, action);
      await glidesSettled(page);
      await page.waitForTimeout(500);
      expect(await stored(page)).toEqual(after);
      // R-62 Confirm → Game over: the primary action is New game, untouched.
      await expect(primary(page)).toHaveAccessibleName('New game');
    });
  }

  test('AD-14 F8 an untouched win settles and New game starts a new seed', async ({ page }) => {
    const { action } = await place(page, 'prefs-non-default');
    await tapAt(page, action);
    const won = await stored(page);
    await glidesSettled(page);
    await page.waitForTimeout(500);
    await expect(primary(page)).toHaveAccessibleName('New game');
    await primary(page).click();
    await expect.poll(async () => (await stored(page)).seed).not.toBe(won.seed);
  });

  test('AD-14 F8 Undo during the win animation passes through and returns to Place', async ({
    page,
  }) => {
    const { action } = await place(page, 'prefs-non-default');
    const before = await stored(page);
    await tapAt(page, action);
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await page.getByTestId('undo').tap();
    await glidesSettled(page);
    await expect(primary(page)).toHaveAccessibleName('Confirm');
    expect(await stored(page)).toEqual(before);
  });

  test('AD-14 F8 the Redo win guards a cell 6 tap too', async ({ page }) => {
    const { cell } = await place(page, 'prefs-non-default');
    await primary(page).tap();
    await glidesSettled(page);
    await page.waitForTimeout(700);
    await page.getByTestId('undo').tap();
    await glidesSettled(page);
    await page.getByTestId('redo').tap();
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveCount(0);
    await glidesSettled(page);
    await page.waitForTimeout(700);
    await expect(sheet(page)).toHaveCount(0);
    await collapseEndSheet(page);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  for (const [name, prefs] of [
    ['Slow', 'prefs-non-default'],
    ['Normal', undefined],
  ] as const) {
    test(`AD-14 F8 Enter twice on the focused primary action leaves the seed (${name})`, async ({
      page,
    }) => {
      await place(page, prefs);
      await primary(page).focus();
      await page.keyboard.press('Enter');
      const after = await stored(page);
      await page.keyboard.press('Enter');
      await glidesSettled(page);
      await page.waitForTimeout(500);
      expect(await stored(page)).toEqual(after);
    });

    test(`AD-14 F8 a held Enter (repeated keydown) spanning the animation leaves the seed (${name})`, async ({
      page,
    }) => {
      await place(page, prefs);
      await primary(page).focus();
      await page.keyboard.down('Enter');
      const after = await stored(page);
      for (let i = 0; i < 12; i++) {
        await page.keyboard.down('Enter');
        await page.waitForTimeout(60);
      }
      await page.keyboard.up('Enter');
      await glidesSettled(page);
      await page.waitForTimeout(500);
      expect(await stored(page)).toEqual(after);
    });
  }

  test('AD-9 AD-14 F8 smoke: after a key held through hide during the win, a cell 6 click opens the view (Vitest is authoritative for the timing)', async ({
    page,
  }) => {
    const { cell } = await place(page);
    await primary(page).focus();
    await page.keyboard.down('Enter');
    await hidePage(page);
    await showPage(page);
    await page.waitForTimeout(800);
    await collapseEndSheet(page);
    await tapAt(page, cell);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    await page.keyboard.up('Enter');
  });
});

// Ticket 6.12 (CAP-5, AD-14, R-62, R-70, build-notes "Winning-guard input outcomes"): the end-sheet
// half. The 300 ms floor timing and the hold cases are authoritative in src/ui/motion.test.ts; these
// cases pin the outcomes at each animation speed and, where the project allows, by key.
const endSheet = (page: Page) => page.getByRole('dialog', { name: END_SHEET });
const giveUpItem = (page: Page) => page.getByRole('button', { name: 'Give up', exact: true });
const SPEEDS = [
  ['Normal', undefined, false],
  ['Fast', 'prefs-fast', false],
  ['Slow', 'prefs-non-default', false],
  ['reduced motion', undefined, true],
] as const;

async function confirmWin(page: Page, prefs: string | undefined, reduced: boolean) {
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  await place(page, prefs);
  await primary(page).click();
}

for (const project of ['android', 'desktop'] as const) {
  test.describe(`${project} end-sheet half`, () => {
    test.beforeEach(project === 'android' ? onAndroid : onDesktop);

    for (const [name, prefs, reduced] of SPEEDS) {
      test(`AD-14 R-62 no input: the sheet opens after the win (${name})`, async ({ page }) => {
        await confirmWin(page, prefs, reduced);
        await expect(endSheet(page)).toBeVisible();
      });

      test(`AD-14 R-70 Undo button during the window: undone, play resumed, no sheet (${name})`, async ({
        page,
      }) => {
        if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
        await place(page, prefs);
        const before = await stored(page);
        const length = await page.evaluate(() => history.length);
        const undo = await centre(page.getByTestId('undo'));
        await primary(page).click();
        // A touch tap on android: its click is a separate, later input than its pointerup.
        await tapAt(page, undo);
        await glidesSettled(page);
        await page.waitForTimeout(800);
        await expect(endSheet(page)).toHaveCount(0);
        await expect(primary(page)).toHaveAccessibleName('Confirm');
        expect(await stored(page)).toEqual(before);
        expect(await page.evaluate(() => history.length)).toBe(length);
      });

      test(`AD-14 the menu button press is consumed, the menu stays closed, then the sheet opens (${name})`, async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await confirmWin(page, prefs, reduced);
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        await expect(endSheet(page)).toBeVisible();
        await expect(giveUpItem(page)).toHaveCount(0);
        expect(errors).toEqual([]);
      });
    }

    test('R-70 Undo after the sheet opened: the sheet closes and play resumes', async ({
      page,
    }) => {
      await place(page);
      await primary(page).click();
      await expect(endSheet(page)).toBeVisible();
      await page.getByTestId('undo').click();
      await expect(endSheet(page)).toHaveCount(0);
      await expect(primary(page)).toHaveAccessibleName('Confirm');
    });
  });
}

test.describe('desktop end-sheet half keys', () => {
  test.beforeEach(onDesktop);

  for (const [name, prefs, reduced] of SPEEDS) {
    for (const chord of ['z', 'Control+z']) {
      test(`AD-14 R-70 ${chord} during the window undoes with no sheet (${name})`, async ({
        page,
      }) => {
        await confirmWin(page, prefs, reduced);
        await page.keyboard.press(chord);
        await glidesSettled(page);
        await page.waitForTimeout(800);
        await expect(endSheet(page)).toHaveCount(0);
        await expect(primary(page)).toHaveAccessibleName('Confirm');
      });
    }

    for (const key of ['Control+Shift+z', 'y', 'Control+y', 'Escape', 'Tab', 'm', 'n']) {
      test(`AD-14 ${key} during the window is consumed and the sheet opens (${name})`, async ({
        page,
      }) => {
        if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
        await place(page, prefs);
        const bubbled = await recordBubbled(page, ['keydown', 'keyup']);
        await primary(page).click();
        if (name === 'Slow') expect(await running(page)).toBeGreaterThan(0);
        await page.keyboard.press(key);
        // Slow: the press completed the animation at once, before the sheet is due.
        if (name === 'Slow') expect(await running(page)).toBe(0);
        expect(await bubbled()).toEqual([]);
        await expect(endSheet(page)).toBeVisible();
        await expect(giveUpItem(page)).toHaveCount(0);
      });
    }
  }

  test('AD-13 AD-14 browser back during the window completes the animation at once, then the end sheet opens (Slow)', async ({
    page,
  }) => {
    await place(page, 'prefs-non-default');
    // An entry to go back from: back to the base entry follows the normal back rule (closes
    // nothing). The recorder's popstate listener runs after nav's, so it reads the animations
    // right after the before-back hook.
    await page.evaluate(() => {
      history.pushState(null, '');
      window.addEventListener('popstate', () => {
        (window as unknown as Recorded).__afterBack = document.getAnimations().length;
      });
    });
    await primary(page).click();
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await page.goBack();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as Recorded).__afterBack))
      .toBe(0);
    await expect(endSheet(page)).toBeVisible();
  });

  test('AD-14 R-70 a Z held after its Undo applied: M is not consumed and opens the menu', async ({
    page,
  }) => {
    await confirmWin(page, undefined, false);
    await page.keyboard.down('z');
    await expect(primary(page)).toHaveAccessibleName('Confirm');
    await page.keyboard.press('m');
    await expect(giveUpItem(page)).toBeVisible();
    await page.keyboard.up('z');
  });

  test('AD-9 AD-14 hide during the window completes the animation at once; on return the sheet is open and expanded', async ({
    page,
  }) => {
    await confirmWin(page, 'prefs-non-default', false);
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await hidePage(page);
    // The hide flush finished the animation (Slow runs 640 ms), long before the 300 ms floor.
    expect(await running(page)).toBe(0);
    await showPage(page);
    await expect(endSheet(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Show result:/ })).toHaveCount(0);
  });
});

// Ticket 6.12 timing cases on Playwright's fake clock: the guard reads performance.now and
// setTimeout, which the clock owns, so the 300 ms floor is stepped with runFor. WAAPI animations
// still run in real time. The clock runs from boot and is paused once the board is ready.
async function frozenPlace(page: Page, prefs: string | undefined, reduced: boolean) {
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: 0 });
  const points = await place(page, prefs);
  await page.clock.pauseAt(60_000);
  return points;
}

for (const project of ['android', 'desktop'] as const) {
  test.describe(`${project} end-sheet half, fake clock`, () => {
    test.beforeEach(project === 'android' ? onAndroid : onDesktop);

    for (const [name, prefs, reduced] of [
      ['Fast', 'prefs-fast', false],
      ['reduced motion', undefined, true],
    ] as const) {
      test(`AD-14 R-62 no input: the sheet opens 300 ms after install, not at settle (${name})`, async ({
        page,
      }) => {
        await frozenPlace(page, prefs, reduced);
        await primary(page).click();
        await glidesSettled(page);
        await expect(endSheet(page)).toHaveCount(0);
        await page.clock.runFor(299);
        await expect(endSheet(page)).toHaveCount(0);
        await page.clock.runFor(1);
        await expect(endSheet(page)).toBeVisible();
      });

      test(`AD-14 R-70 Undo between settle and 300 ms leaves no sheet (${name})`, async ({
        page,
      }) => {
        await frozenPlace(page, prefs, reduced);
        const undo = await centre(page.getByTestId('undo'));
        await primary(page).click();
        await glidesSettled(page);
        await tapAt(page, undo);
        await page.clock.runFor(1000);
        await expect(endSheet(page)).toHaveCount(0);
        await expect(primary(page)).toHaveAccessibleName('Confirm');
      });

      test(`AD-14 a non-Undo input between settle and 300 ms is consumed and the sheet still opens at 300 ms (${name})`, async ({
        page,
      }) => {
        const { cell } = await frozenPlace(page, prefs, reduced);
        const length = await page.evaluate(() => history.length);
        const viewSeen = await watchFor(page, VIEW_EL);
        await primary(page).click();
        await glidesSettled(page);
        await tapAt(page, cell);
        // The tap opened no view (openDeferred would close one under the end sheet) and pushed no
        // entry, checked before the sheet is due.
        expect(await viewSeen()).toBe(false);
        expect(await page.evaluate(() => history.length)).toBe(length);
        await page.clock.runFor(299);
        await expect(endSheet(page)).toHaveCount(0);
        expect(await viewSeen()).toBe(false);
        expect(await page.evaluate(() => history.length)).toBe(length);
        await page.clock.runFor(1);
        await expect(endSheet(page)).toBeVisible();
        await expect(sheet(page)).toHaveCount(0);
        expect(await viewSeen()).toBe(false);
      });
    }

    for (const [name, prefs] of [
      ['Normal', undefined],
      ['Slow', 'prefs-non-default'],
    ] as const) {
      test(`AD-14 R-70 Undo button after the floor during the animation: no sheet, no history entry (${name})`, async ({
        page,
      }) => {
        await frozenPlace(page, prefs, false);
        const length = await page.evaluate(() => history.length);
        const sheetSeen = await watchFor(page, END_SHEET_EL);
        const undo = await centre(page.getByTestId('undo'));
        await primary(page).click();
        await page.clock.runFor(400);
        // WAAPI runs in real time: the animation is still in flight when Undo lands.
        expect(await running(page)).toBeGreaterThan(0);
        await tapAt(page, undo);
        await glidesSettled(page);
        await page.clock.runFor(1000);
        await expect(endSheet(page)).toHaveCount(0);
        await expect(primary(page)).toHaveAccessibleName('Confirm');
        expect(await sheetSeen()).toBe(false);
        expect(await page.evaluate(() => history.length)).toBe(length);
      });

      if (project === 'desktop') {
        test(`AD-14 R-70 Control+z after the floor during the animation: no sheet ever, no history entry (${name})`, async ({
          page,
        }) => {
          await frozenPlace(page, prefs, false);
          const length = await page.evaluate(() => history.length);
          const sheetSeen = await watchFor(page, END_SHEET_EL);
          await primary(page).click();
          await page.clock.runFor(400);
          expect(await running(page)).toBeGreaterThan(0);
          await page.keyboard.press('Control+z');
          await glidesSettled(page);
          await page.clock.runFor(1000);
          await expect(primary(page)).toHaveAccessibleName('Confirm');
          expect(await sheetSeen()).toBe(false);
          expect(await page.evaluate(() => history.length)).toBe(length);
        });
      }
    }
  });
}

// Ticket 6.12 AC: each of these only completes the animation and is consumed; the sheet then opens.
for (const project of ['android', 'desktop'] as const) {
  test.describe(`${project} end-sheet half, other inputs`, () => {
    test.beforeEach(project === 'android' ? onAndroid : onDesktop);

    for (const [name, prefs, reduced] of SPEEDS) {
      test(`AD-14 a WordCell tap during the window opens no view; the sheet opens (${name})`, async ({
        page,
      }) => {
        if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
        const { cell, action } = await place(page, prefs);
        // openDeferred closes a top WordCell view as the end sheet opens: the recorder sees one
        // that opened at all.
        const viewSeen = await watchFor(page, VIEW_EL);
        await tapAt(page, action);
        await tapAt(page, cell);
        await expect(endSheet(page)).toBeVisible();
        await expect(sheet(page)).toHaveCount(0);
        expect(await viewSeen()).toBe(false);
      });

      test(`AD-14 a second primary action press is consumed: same session, the sheet opens (${name})`, async ({
        page,
      }) => {
        if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
        const { action } = await place(page, prefs);
        await tapAt(page, action);
        const after = await stored(page);
        await tapAt(page, action);
        await expect(endSheet(page)).toBeVisible();
        expect(await stored(page)).toEqual(after);
      });

      test(`AD-14 the Redo button during a Redo win is consumed and the sheet opens (${name})`, async ({
        page,
      }) => {
        if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
        await place(page, prefs);
        await primary(page).click();
        await expect(endSheet(page)).toBeVisible();
        await collapseEndSheet(page);
        await page.getByTestId('undo').click();
        await glidesSettled(page);
        const redo = await centre(page.getByTestId('redo'));
        const bubbled = await recordBubbled(page);
        await page.getByTestId('redo').click();
        if (name === 'Slow') expect(await running(page)).toBeGreaterThan(0);
        const before = (await bubbled()).length;
        // Redo is disabled once the win is redone: a coordinate tap reaches the guard.
        await tapAt(page, redo);
        // Slow: the tap completed the animation at once, before the sheet is due.
        if (name === 'Slow') expect(await running(page)).toBe(0);
        expect((await bubbled()).slice(before)).toEqual([]);
        await expect(endSheet(page)).toBeVisible();
      });

      test(`AD-14 Redo win followed at once by the Undo button: no sheet (${name})`, async ({
        page,
      }) => {
        if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
        await place(page, prefs);
        await primary(page).click();
        await expect(endSheet(page)).toBeVisible();
        await collapseEndSheet(page);
        await page.getByTestId('undo').click();
        await glidesSettled(page);
        await page.getByTestId('redo').click();
        await page.getByTestId('undo').click();
        await glidesSettled(page);
        await page.waitForTimeout(800);
        await expect(endSheet(page)).toHaveCount(0);
      });
    }
  });
}
