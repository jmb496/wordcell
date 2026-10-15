import { expect, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { centre, glidesSettled, openFixture, tapAt } from './helpers/board';
import { expectLeaves, type NavState, wc } from './helpers/dialogs';
import { onAndroid, onDesktop } from './helpers/project';
import { fixture, seedStorage } from './helpers/seed';

// Epic 6 entry 6 (ticket 6.6, SPEC CAP-4; R-62, R-73, R-75, R-81, R-83, R-84; AD-13, AD-16): the
// end sheet. `launch: new` in the comments is the launch id nav stamps (`NavState.launch`, a
// number): `history.state` is `{ wc: 1, launch: new }` after boot, `{ wc: 0, launch: new }` after
// collapse and `{ wc: 1, launch: new }` after re-expand. Fixtures (seed 1): `session-won` (eight
// words, longest LQUEJATA), `session-gave-up` (no word), `session-idle-fresh` (a QU left, so a
// Give up counts 53 letters), `session-one-letter-left` (one letter left, Idle). The win by Confirm
// starts from `session-won` plus one Undo (the Place phase whose Confirm wins, as win-guard.spec).

const WIN = 'Every column cleared.';
const GAVE = 'Game given up.';
const SESSION = 'wordcell:session';

const sheet = (page: Page, title: string = WIN) => page.getByRole('dialog', { name: title });
const anySheet = (page: Page) =>
  page.getByRole('dialog', { name: /^(Every column cleared\.|Game given up\.)$/ });
const handle = (page: Page) => page.getByRole('button', { name: 'Collapse result', exact: true });
const bar = (page: Page) => page.getByRole('button', { name: /^Show result:/ });
const replayButton = (page: Page) =>
  anySheet(page).getByRole('button', { name: 'Replay this deal', exact: true });
const statisticsButton = (page: Page) =>
  page.getByRole('button', { name: 'Statistics', exact: true });
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const primary = (page: Page) => page.getByTestId('primary-action');
const wcOf = (page: Page) => wc(page).then((state) => state?.wc);

type Stored = { seed: number; moves: unknown[]; cursor: { index: number }; gaveUp: boolean };
const parsed = async (page: Page) => JSON.parse((await stored(page, SESSION)) ?? 'null') as Stored;

// The visible score of the sheet (the large number), as a number with U+2212 read as a minus.
async function sheetScore(page: Page, title: string = WIN): Promise<number> {
  const text = (await sheet(page, title).locator('.score').textContent()) ?? '';
  return Number(text.replace('−', '-'));
}

async function topBarScore(page: Page): Promise<number> {
  const text = (await page.locator('.top-bar .score').textContent()) ?? '';
  return Number(text.replace('Score ', '').replace('−', '-'));
}

async function giveUpFromMenu(page: Page): Promise<void> {
  await menuButton(page).click();
  await page.getByRole('button', { name: 'Give up', exact: true }).click();
}

// The nav launch id of the current history entry (a number stamped by nav).
async function launchOf(page: Page): Promise<number> {
  const state = (await wc(page)) as NavState;
  if (state === null) throw new Error('no history state');
  return state.launch;
}

async function expectBoardFocus(page: Page): Promise<void> {
  const last = page.locator('[data-column="1"] [data-card-id][data-place="column"]').last();
  if ((await last.count()) > 0) await expect(last).toBeFocused();
  else await expect(page.locator('main')).toBeFocused();
}

// Records, at the first frame the end sheet exists, how many animations run outside the sheet
// (the flyToCell faces, AD-14); the sheet's own open transition is not counted.
async function probeOutsideAnimations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const probe: { outside?: number } = {};
    (window as unknown as { __open: typeof probe }).__open = probe;
    const tick = (): void => {
      if (document.querySelector('[role="dialog"] .score') !== null) {
        probe.outside = document
          .getAnimations()
          .filter(
            (a) => !(a.effect as KeyframeEffect).target?.closest('[role="dialog"], .layer'),
          ).length;
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-62 a win by Confirm opens the sheet after the glide: win title, final score = pre-win score plus the committed delta, no penalty line', async ({
    page,
  }) => {
    // The session-won + Undo start stands in for a scripted one-move-from-won fixture (equivalent).
    await probeOutsideAnimations(page);
    await openFixture(page, 'session-won', { steps: ['undo'] });
    await expect(primary(page)).toHaveAccessibleName('Confirm');
    const before = await topBarScore(page);
    const meta = (await page.locator('[data-band="tray"] .meta').textContent()) ?? '';
    const delta = Number((/·\s*(\S+)$/.exec(meta)?.[1] ?? '').replace('−', '-').replace('+', ''));
    expect(Number.isFinite(delta)).toBe(true);
    await primary(page).click();
    await expect(sheet(page)).toBeVisible();
    // The sheet opens only after the glide settles: no flyToCell face still animates at that frame.
    expect(
      await page.evaluate(() => (window as unknown as { __open: { outside?: number } }).__open),
    ).toEqual({ outside: 0 });
    expect(await sheetScore(page)).toBe(before + delta);
    await expect(sheet(page).getByText(/letters? left/)).toHaveCount(0);
    await expect(replayButton(page)).toBeFocused();
    await expect.poll(() => wcOf(page)).toBe(1);
  });

  test('R-62 a win by Redo opens the sheet again after Undo closed it', async ({ page }) => {
    await openFixture(page, 'session-won', { steps: ['undo'] });
    await primary(page).click();
    await expect(sheet(page)).toBeVisible();
    await page.getByTestId('undo').click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect.poll(() => wcOf(page)).toBe(0);
    await page.getByTestId('redo').click();
    await glidesSettled(page);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
  });

  test('R-75 R-81 Give up from the menu opens the sheet at once; a QU left counts 2 (53 letters), penalty line after the stat lines', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await giveUpFromMenu(page);
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(
      sheet(page, GAVE).getByText('53 letters left: −530', { exact: true }),
    ).toBeVisible();
    await expect(sheet(page, GAVE).getByText('Longest word')).toBeVisible();
    await expect(replayButton(page)).toBeFocused();
    await expect.poll(() => wcOf(page)).toBe(1);
    const lines = await sheet(page, GAVE)
      .locator('dl, .penalty')
      .evaluateAll((els) => els.map((e) => e.tagName.toLowerCase()));
    expect(lines).toEqual(['dl', 'p']);
  });

  test('R-81 one letter left reads the singular 1 letter left: −10', async ({ page }) => {
    await openFixture(page, 'session-one-letter-left');
    await giveUpFromMenu(page);
    await expect(sheet(page, GAVE).getByText('1 letter left: −10', { exact: true })).toBeVisible();
  });

  test('R-84 the longest word is the earliest longest, QU as QU, with the words placed', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    await expect(sheet(page).locator('dd').nth(0)).toHaveText('LQUEJATA');
    await expect(sheet(page).locator('dd').nth(1)).toHaveText('8');
  });

  test('R-84 with no word committed the longest word shows a dash and words placed 0', async ({
    page,
  }) => {
    await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
    await expect(sheet(page, GAVE).locator('dd').nth(0)).toHaveText('\u2014');
    await expect(sheet(page, GAVE).locator('dd').nth(1)).toHaveText('0');
  });

  test('R-83 the sheet shows the final score, band name and message from the view', async ({
    page,
  }) => {
    await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
    const score = await sheetScore(page, GAVE);
    expect(score).toBeLessThan(0);
    await expect(sheet(page, GAVE).locator('.score')).toHaveText(`−${-score}`);
    await expect(sheet(page, GAVE).locator('.band')).toHaveText('Alphabet Soup');
    await expect(sheet(page, GAVE).locator('.message')).toHaveText(
      'Plenty of letters, not much broth. The deck forgives you.',
    );
  });

  for (const name of ['session-won', 'session-gave-up'] as const) {
    test(`R-73 a relaunch into ${name} opens the sheet expanded with no animation, wc 1, focus on Replay this deal`, async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const probe: { opacity?: string; transform?: string; animations?: number } = {};
        (window as unknown as { __probe: typeof probe }).__probe = probe;
        const tick = (): void => {
          const el = document.querySelector('[role="dialog"] .score')?.closest('.sheet');
          if (el !== null && el !== undefined && probe.opacity === undefined) {
            const style = getComputedStyle(el);
            probe.opacity = style.opacity;
            probe.transform = style.transform;
            probe.animations = document.getAnimations().length;
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await seedStorage(page, { session: fixture(`${name}.json`) });
      await page.goto('/');
      await expect(anySheet(page)).toBeVisible();
      const probe = await page.evaluate(
        () => (window as unknown as { __probe: Record<string, unknown> }).__probe,
      );
      expect(probe).toEqual({ opacity: '1', transform: 'none', animations: 0 });
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
      expect(typeof (await launchOf(page))).toBe('number');
      expect(await wcOf(page)).toBe(1);
      await expect(replayButton(page)).toBeFocused();
    });
  }

  test('R-75 the grab handle collapses: wc 0 with the same launch, board focus, WordCells viewable, the bar expands again (wc 1)', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const launch = await launchOf(page);
    await handle(page).click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    await expectBoardFocus(page);
    await expect(bar(page)).toBeVisible();
    await tapAt(page, await centre(page.getByTestId('wordcell-6')));
    await expect(page.locator('[data-view-sheet]')).toBeVisible();
    await page.goBack();
    await expect(page.locator('[data-view-sheet]')).toHaveCount(0);
    await bar(page).click();
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wc(page)).toEqual({ wc: 1, launch });
    await expect(replayButton(page)).toBeFocused();
  });

  test('R-75 a scrim tap collapses and is consumed: a tap on a column card selects nothing, opens no view and pushes no entry', async ({
    page,
  }) => {
    await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
    const launch = await launchOf(page);
    await expect(sheet(page, GAVE)).toBeVisible();
    const before = await stored(page, SESSION);
    // The sheet covers the WordCell row itself (a tap there lands on the sheet), so the scrim's
    // tap goes to the board above it: a column card, which would otherwise select.
    await tapAt(page, await centre(page.locator('[data-column="1"] [data-card-id]').first()));
    await expect(anySheet(page)).toHaveCount(0);
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    await expect(page.locator('[data-selection-outline]')).toHaveCount(0);
    await expect(page.locator('[data-view-sheet]')).toHaveCount(0);
    await expect(bar(page)).toBeVisible();
    expect(await stored(page, SESSION)).toBe(before);
  });

  test('R-75 back collapses, never hides: the bar shows and back again leaves the app', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const launch = await launchOf(page);
    await page.goBack();
    await expect(anySheet(page)).toHaveCount(0);
    await expect(bar(page)).toBeVisible();
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    await expectLeaves(page);
  });

  test('R-75 the top bar and the action bar stay usable above the scrim', async ({ page }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    await expect(page.getByTestId('undo')).toBeEnabled();
    await expect(primary(page)).toHaveAccessibleName('New game');
    await page.getByTestId('undo').click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect(primary(page)).not.toHaveAccessibleName('New game');
  });

  for (const [name, title] of [
    ['session-won', WIN],
    ['session-gave-up', GAVE],
  ] as const) {
    test(`R-70 R-75 Undo from the expanded sheet (${name}) pops its entry, resumes play, board focus`, async ({
      page,
    }) => {
      await openFixture(page, name, { endSheet: 'expanded' });
      const launch = await launchOf(page);
      await page.getByTestId('undo').click();
      await expect(sheet(page, title)).toHaveCount(0);
      await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
      await expect(primary(page)).not.toHaveAccessibleName('New game');
      await expect(bar(page)).toHaveCount(0);
      await expect(page.locator('main')).not.toHaveJSProperty('inert', true);
      await expectBoardFocus(page);
      if (name === 'session-gave-up') {
        const gaveUp = (await parsed(page)).gaveUp;
        expect(gaveUp).toBe(false);
      }
    });

    test(`R-70 R-75 Undo from the collapsed sheet (${name}) hides it with no pop`, async ({
      page,
    }) => {
      await openFixture(page, name);
      const length = await page.evaluate(() => history.length);
      await expect(bar(page)).toBeVisible();
      await page.getByTestId('undo').click();
      await expect(bar(page)).toHaveCount(0);
      await expect(primary(page)).not.toHaveAccessibleName('New game');
      await expect.poll(() => wcOf(page)).toBe(0);
      expect(await page.evaluate(() => history.length)).toBe(length);
      await expectBoardFocus(page);
    });
  }

  test('AD-13 R-62 a win by Redo while a sticky WordCell view is open drops the view and shows the sheet at wc 1', async ({
    page,
  }) => {
    // A WordCell view cannot open in the Place phase after an Undo (a tap targets the cell), so the
    // view opens over the collapsed won board, and Undo and Redo run as dispatched clicks (the
    // view's scrim covers the top bar, as menu.spec).
    await openFixture(page, 'session-won');
    await tapAt(page, await centre(page.getByTestId('wordcell-6')));
    await expect(page.locator('[data-view-sheet]')).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
    await page.getByTestId('undo').dispatchEvent('click');
    await glidesSettled(page);
    await page.getByTestId('redo').dispatchEvent('click');
    await glidesSettled(page);
    await expect(page.locator('[data-view-sheet]')).toHaveCount(0);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
  });

  test('R-75 Redo after an undone Give up does not reopen the sheet', async ({ page }) => {
    await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
    await page.getByTestId('undo').click();
    await expect(anySheet(page)).toHaveCount(0);
    const redo = page.getByTestId('redo');
    // A give-up is flag-only and not redoable (R-75).
    await expect(redo).toBeDisabled();
    await expect(anySheet(page)).toHaveCount(0);
    await expect(bar(page)).toHaveCount(0);
    expect((await parsed(page)).gaveUp).toBe(false);
  });

  test('R-74 Replay this deal from the expanded sheet acts at once: same seed, empty moves, sheet hidden, wc 0', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const launch = await launchOf(page);
    const { seed } = await parsed(page);
    await replayButton(page).click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    const after = await parsed(page);
    expect(after.seed).toBe(seed);
    expect(after.moves).toEqual([]);
  });

  test('R-74 New game from the expanded sheet (action bar) hides it, wc 0 with the base launch', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const launch = await launchOf(page);
    await primary(page).click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    await expect(bar(page)).toHaveCount(0);
  });

  test('R-74 Replay from the collapsed sheet (menu) hides the bar and pops nothing', async ({
    page,
  }) => {
    await openFixture(page, 'session-won');
    const launch = await launchOf(page);
    const { seed } = await parsed(page);
    await menuButton(page).click();
    await page.getByRole('button', { name: 'Replay this deal', exact: true }).click();
    await expect(bar(page)).toHaveCount(0);
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    expect((await parsed(page)).seed).toBe(seed);
    expect((await parsed(page)).moves).toEqual([]);
  });

  test('R-74 New game from the collapsed sheet (action bar) hides the bar, wc 0', async ({
    page,
  }) => {
    await openFixture(page, 'session-gave-up');
    const launch = await launchOf(page);
    const { seed } = await parsed(page);
    await primary(page).click();
    await expect(bar(page)).toHaveCount(0);
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    expect((await parsed(page)).seed).not.toBe(seed);
  });

  test('AD-13 Statistics over the sheet: wc 2, Esc closes only the panel, the top bar is inert under it', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    await statisticsButton(page).click();
    const panel = page.getByRole('dialog', { name: 'Statistics', exact: true });
    await expect(panel).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(2);
    await expect(page.locator('main')).toHaveJSProperty('inert', true);
    // The top bar (Undo) is unreachable under the panel.
    expect(await page.getByTestId('undo').evaluate((el) => el.closest('[inert]') !== null)).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
    await statisticsButton(page).click();
    await expect(panel).toBeVisible();
    await page.goBack();
    await expect(panel).toHaveCount(0);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  test('R-75 Esc collapses the expanded sheet (wc 0) and focus goes to the board', async ({
    page,
  }) => {
    await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
    const launch = await launchOf(page);
    await page.keyboard.press('Escape');
    await expect(anySheet(page)).toHaveCount(0);
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    await expect(bar(page)).toBeVisible();
    await expectBoardFocus(page);
    await page.keyboard.press('Escape');
    await expect(bar(page)).toBeVisible();
  });
});
