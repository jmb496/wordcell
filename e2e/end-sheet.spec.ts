import { expect, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { centre, glidesSettled, openFixture, tapAt } from './helpers/board';
import { WON_ROWS } from './helpers/celebration';
import { button, confirmDialog, expectLeaves, type NavState, notice, wc } from './helpers/dialogs';
import { expectBoardFocus } from './helpers/keys';
import { onAndroid, onDesktop } from './helpers/project';
import { fixture, seedStorage } from './helpers/seed';
import { SESSIONS } from './helpers/sessions';

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

// EXPERIENCE.md Focus after an Undo of the finish: a win's Undo enters Place (Q-01), the first
// strip card; a Give up's resumes Idle, the board.
async function expectPhaseFocus(
  page: Page,
  name: 'session-won' | 'session-gave-up',
): Promise<void> {
  if (name === 'session-won') {
    await expect(page.locator('[data-card-id][data-place="strip"]').first()).toBeFocused();
  } else {
    await expectBoardFocus(page);
  }
}

// Started just before Confirm (the fixture has booted, the sheet is absent): records the most
// animations running outside the sheet before it exists (the flyToCell faces, AD-14) and how many
// run at the first frame the end sheet exists; the sheet's own open transition is not counted.
async function probeOutsideAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    const probe: { max: number; outside?: number } = { max: 0 };
    (window as unknown as { __open: typeof probe }).__open = probe;
    const outsideCount = (): number =>
      document
        .getAnimations()
        .filter((a) => !(a.effect as KeyframeEffect).target?.closest('[role="dialog"], .layer'))
        .length;
    const tick = (): void => {
      if (document.querySelector('[role="dialog"] .score') !== null) {
        probe.outside = outsideCount();
        return;
      }
      probe.max = Math.max(probe.max, outsideCount());
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
    await openFixture(page, 'session-won', { steps: ['undo'] });
    await expect(primary(page)).toHaveAccessibleName('Confirm');
    await expect(anySheet(page)).toHaveCount(0);
    const before = await topBarScore(page);
    const meta = (await page.locator('[data-band="tray"] .meta').textContent()) ?? '';
    const delta = Number((/·\s*(\S+)$/.exec(meta)?.[1] ?? '').replace('−', '-').replace('+', ''));
    expect(Number.isFinite(delta)).toBe(true);
    await probeOutsideAnimations(page);
    await primary(page).click();
    await expect(sheet(page)).toBeVisible();
    // The sheet opens only after the glide settles: no flyToCell face still animates at that frame.
    const probe = await page.evaluate(
      () => (window as unknown as { __open: { max: number; outside?: number } }).__open,
    );
    expect(probe.max).toBeGreaterThan(0); // the glide was observed, so the check is not vacuous
    expect(probe.outside).toBe(0);
    await expect(sheet(page).locator('.band')).toHaveText('Lexicon Legend');
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
    const before = await topBarScore(page);
    await giveUpFromMenu(page);
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(
      sheet(page, GAVE).getByText('53 letters left: −530', { exact: true }),
    ).toBeVisible();
    expect(await sheetScore(page, GAVE)).toBe(before - 530);
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

  test('R-83 the longest word shows from the view, QU as QU, with the words placed', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    await expect(sheet(page).locator('dd').nth(0)).toHaveText('LQUEJATA');
    await expect(sheet(page).locator('dd').nth(1)).toHaveText('8');
  });

  test('R-83 with no word committed the longest word shows a dash and words placed 0', async ({
    page,
  }) => {
    await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
    await expect(sheet(page, GAVE).locator('dd').nth(0)).toHaveText('\u2014');
    await expect(sheet(page, GAVE).locator('dd').nth(1)).toHaveText('0');
  });

  test('R-83 the sheet shows the final score, band name and message from the view', async ({
    page,
  }) => {
    // session-gave-up: no word committed (score 0) minus the R-81 penalty for 53 letters left.
    await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
    await expect(sheet(page, GAVE).locator('.score')).toHaveText('−530');
    await expect(sheet(page, GAVE).locator('.band')).toHaveText('Just Getting Started');
    await expect(sheet(page, GAVE).locator('.message')).toHaveText(
      'Every word has to start somewhere. Lovely first steps!',
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

  test('R-75 expanded, the board under the scrim is inert and both bars are live; collapsed, the board is live again', async ({
    page,
  }) => {
    // build-notes Per-surface behaviour: End sheet expanded, board inert, bars live.
    await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
    const underInert = (testId: string) =>
      page.getByTestId(testId).evaluate((el) => el.closest('[inert]') !== null);
    const card = page.locator('[data-column="1"] [data-card-id]').first();
    const cardInert = () => card.evaluate((el) => el.closest('[inert]') !== null);
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(primary(page)).toHaveAccessibleName('New game');
    expect(await cardInert()).toBe(true);
    expect(await underInert('wordcell-6')).toBe(true);
    expect(await underInert('column-1')).toBe(true);
    expect(await underInert('undo')).toBe(false);
    expect(await underInert('primary-action')).toBe(false);
    await handle(page).click();
    await expect(anySheet(page)).toHaveCount(0);
    expect(await cardInert()).toBe(false);
    expect(await underInert('wordcell-6')).toBe(false);
    expect(await underInert('column-1')).toBe(false);
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
    await expect(page.getByTestId('redo')).toBeDisabled();
    await expect(primary(page)).toHaveAccessibleName('New game');
    await page.getByTestId('undo').click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect(primary(page)).not.toHaveAccessibleName('New game');
  });

  for (const [name, title] of [
    ['session-won', WIN],
    ['session-gave-up', GAVE],
  ] as const) {
    test(`R-70 R-75 Undo from the expanded sheet (${name}) pops its entry, resumes play, phase focus`, async ({
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
      await expectPhaseFocus(page, name);
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
      await expectPhaseFocus(page, name);
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

  test('R-75 Redo is disabled after an undone Give up', async ({ page }) => {
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

  test('R-75 R-71 Redo after an undone Give up with a redo tail re-applies the move and does not reopen the sheet', async ({
    page,
  }) => {
    // Undo clears the flag, then three Undos step the one committed move back to Idle at index 0,
    // leaving it as the redo tail; Give up leaves the tail untouched (R-75).
    await openFixture(page, 'session-gave-up-after-commit', {
      steps: ['undo', 'undo', 'undo', 'undo'],
    });
    expect((await parsed(page)).cursor).toEqual({ index: 0, phase: 'idle' });
    await giveUpFromMenu(page);
    await expect(sheet(page, GAVE)).toBeVisible();
    await page.getByTestId('undo').click();
    await expect(anySheet(page)).toHaveCount(0);
    const redo = page.getByTestId('redo');
    await expect(redo).toBeEnabled();
    for (let step = 0; step < 3; step += 1) {
      await redo.click();
      await glidesSettled(page);
    }
    expect(await parsed(page)).toMatchObject({
      cursor: { index: 1, phase: 'idle' },
      gaveUp: false,
    });
    await page.waitForTimeout(400);
    await expect(anySheet(page)).toHaveCount(0);
    await expect(bar(page)).toHaveCount(0);
    await expect.poll(() => wcOf(page)).toBe(0);
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
    await expectBoardFocus(page);
  });

  test('R-75 one Escape with the Menu open over the expanded sheet closes only the Menu; the next collapses the sheet', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const launch = await launchOf(page);
    await menuButton(page).click();
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0);
    await expect(handle(page)).toBeVisible();
    await expect.poll(() => wc(page)).toEqual({ wc: 1, launch });
    await page.keyboard.press('Escape');
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    await expect(bar(page)).toBeVisible();
  });

  test('R-74 New game from the expanded sheet (action bar) hides it, wc 0 with the base launch', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const launch = await launchOf(page);
    const { seed } = await parsed(page);
    await primary(page).click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect.poll(() => wc(page)).toEqual({ wc: 0, launch });
    await expect(bar(page)).toHaveCount(0);
    const after = await parsed(page);
    expect(after.seed).not.toBe(seed);
    expect(after.moves).toEqual([]);
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

  test('AD-13 Statistics over the sheet: wc 2, Esc closes only the panel, the top bar is inert under it; Esc and back return focus to the Statistics button of the sheet', async ({
    page,
  }) => {
    await openFixture(page, 'session-won', { endSheet: 'expanded' });
    const opener = sheet(page).getByRole('button', { name: 'Statistics', exact: true });
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
    // build-notes Per-surface: a panel returns focus to its opener (not the ☰ button).
    await expect(opener).toBeFocused();
    await statisticsButton(page).click();
    await expect(panel).toBeVisible();
    await page.goBack();
    await expect(panel).toHaveCount(0);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
    await expect(opener).toBeFocused();
  });

  // Ticket 6.7 (SPEC CAP-4, F4, F8; R-84; owner 2026-10-15). History fixtures are §2 rejection
  // seeds; the wins and Give ups are live finishes on a game played with the seeded history.
  const HISTORY = 'wordcell:history';
  const NOT_ADDED = "This game wasn't added to your statistics.";
  const UNREADABLE = "Your score history can't be read.";
  const EMPTY = '{"version":1,"records":[]}';
  const VARIANTS = [
    ['history-invalid-version-unknown', "It uses format version 2, which this version can't read."],
    ['history-invalid-null', "Its format version can't be read."],
    [
      'history-invalid-record-field-set',
      "It uses format version 1 but its contents can't be read.",
    ],
  ] as const;
  const resetButton = (page: Page) =>
    anySheet(page).getByRole('button', { name: 'Reset history', exact: true });
  const line = (page: Page) => anySheet(page).getByText(NOT_ADDED, { exact: true });

  async function expectBlock(page: Page, name: string, sentence: string, title: string) {
    const dialog = sheet(page, title);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(UNREADABLE, { exact: true })).toBeVisible();
    await expect(dialog.getByText(sentence, { exact: true })).toBeVisible();
    await expect(line(page)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Reset history', exact: true })).toBeVisible();
    expect(await stored(page, HISTORY)).toBe(fixture(`${name}.json`));
  }

  for (const [name, sentence] of VARIANTS) {
    test(`R-84 a live win shows the block with the variant sentence (${name}), history untouched`, async ({
      page,
    }) => {
      await openFixture(page, 'session-won', { steps: ['undo'], history: name });
      await primary(page).click();
      await expectBlock(page, name, sentence, WIN);
    });

    test(`R-84 a live Give up shows the block with the variant sentence (${name}), history untouched`, async ({
      page,
    }) => {
      await openFixture(page, 'session-idle-fresh', { history: name });
      await giveUpFromMenu(page);
      await expectBlock(page, name, sentence, GAVE);
    });
  }

  async function giveUpWithBlock(page: Page): Promise<void> {
    await openFixture(page, 'session-idle-fresh', { history: 'history-invalid-version-unknown' });
    await giveUpFromMenu(page);
    await expect(resetButton(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
  }

  test('AD-13 Reset history then Delete history closes only the confirm: sheet expanded at wc 1 with the single line', async ({
    page,
  }) => {
    await giveUpWithBlock(page);
    await resetButton(page).click();
    await expect(confirmDialog(page)).toBeVisible();
    await expect(button(page, 'Keep it')).toBeFocused();
    await expect.poll(() => wcOf(page)).toBe(2);
    await button(page, 'Delete history').click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect.poll(() => wcOf(page)).toBe(1);
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(sheet(page, GAVE).getByText(UNREADABLE)).toHaveCount(0);
    await expect(resetButton(page)).toHaveCount(0);
    await expect(line(page)).toHaveCount(1);
    await expect(replayButton(page)).toBeFocused();
    expect(await stored(page, HISTORY)).toBe(EMPTY);
    // Collapse and expand keep the line.
    await handle(page).click();
    await expect(anySheet(page)).toHaveCount(0);
    await bar(page).click();
    await expect(line(page)).toBeVisible();
    // Undo leaves the history empty, drops the line; a new finish records normally, no line.
    await page.getByTestId('undo').click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect(primary(page)).not.toHaveAccessibleName('New game');
    expect(await stored(page, HISTORY)).toBe(EMPTY);
    await giveUpFromMenu(page);
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(line(page)).toHaveCount(0);
    await expect
      .poll(async () => JSON.parse((await stored(page, HISTORY)) ?? 'null').records.length)
      .toBe(1);
  });

  for (const how of ['Keep it', 'Escape', 'back', 'scrim'] as const) {
    test(`AD-13 ${how} on the sheet's Reset confirm closes only the confirm; the block stays`, async ({
      page,
    }) => {
      await giveUpWithBlock(page);
      const before = await stored(page, HISTORY);
      await resetButton(page).click();
      await expect(confirmDialog(page)).toBeVisible();
      if (how === 'Keep it') await button(page, 'Keep it').click();
      else if (how === 'Escape') await page.keyboard.press('Escape');
      else if (how === 'back') await page.goBack();
      else await page.touchscreen.tap(5, 300);
      await expect(confirmDialog(page)).toHaveCount(0);
      await expect(sheet(page, GAVE)).toBeVisible();
      await expect(resetButton(page)).toBeVisible();
      await expect(resetButton(page)).toBeFocused();
      await expect.poll(() => wcOf(page)).toBe(1);
      expect(await stored(page, HISTORY)).toBe(before);
    });
  }

  test('AD-13 a relaunch into Game over with an unreadable history shows the notice over the sheet; confirm and back sequence', async ({
    page,
  }) => {
    await seedStorage(page, {
      session: fixture('session-won.json'),
      history: fixture('history-invalid-version-unknown.json'),
    });
    await page.goto('/');
    const seeded = fixture('history-invalid-version-unknown.json');
    await expect(notice(page)).toBeVisible();
    await expect(sheet(page)).toBeVisible();
    expect(await wc(page)).toEqual({ wc: 2, launch: expect.any(Number) });
    await notice(page).getByRole('button', { name: 'Reset history', exact: true }).click();
    await expect(confirmDialog(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(3);
    // Keep it, Esc, back and a scrim tap return to the notice.
    await button(page, 'Keep it').click();
    await expect(notice(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(2);
    expect(await stored(page, HISTORY)).toBe(seeded);
    await notice(page).getByRole('button', { name: 'Reset history', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toBeVisible();
    expect(await stored(page, HISTORY)).toBe(seeded);
    await notice(page).getByRole('button', { name: 'Reset history', exact: true }).click();
    await page.touchscreen.tap(5, 300);
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toBeVisible();
    expect(await stored(page, HISTORY)).toBe(seeded);
    await notice(page).getByRole('button', { name: 'Reset history', exact: true }).click();
    // Back sequence from wc 3.
    await page.goBack();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(2);
    expect(await stored(page, HISTORY)).toBe(seeded);
    await page.goBack();
    await expect(notice(page)).toHaveCount(0);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
    await page.goBack();
    await expect(anySheet(page)).toHaveCount(0);
    await expect(bar(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(0);
    await expectLeaves(page);
  });

  test('AD-13 Delete history on the relaunch notice closes confirm and notice: sheet expanded, wc 1, the single line', async ({
    page,
  }) => {
    await seedStorage(page, {
      session: fixture('session-gave-up.json'),
      history: fixture('history-invalid-null.json'),
    });
    await page.goto('/');
    await expect(notice(page)).toBeVisible();
    await notice(page).getByRole('button', { name: 'Reset history', exact: true }).click();
    await button(page, 'Delete history').click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(notice(page)).toHaveCount(0);
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(line(page)).toBeVisible();
    await expect(resetButton(page)).toHaveCount(0);
    await expect.poll(() => wcOf(page)).toBe(1);
    expect(await stored(page, HISTORY)).toBe(EMPTY);
    // EXPERIENCE.md End sheet: the sheet's open focus, a relaunch included.
    await expect(replayButton(page)).toBeFocused();
  });

  test('AD-13 Reset history from the Statistics panel leaves the sheet with neither block nor line', async ({
    page,
  }) => {
    await giveUpWithBlock(page);
    await anySheet(page).getByRole('button', { name: 'Statistics', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Statistics' })
      .getByRole('button', { name: 'Reset history', exact: true })
      .click();
    await button(page, 'Delete history').click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(sheet(page, GAVE).getByText(UNREADABLE)).toHaveCount(0);
    await expect(line(page)).toHaveCount(0);
    await expect(resetButton(page)).toHaveCount(0);
  });

  test('AD-13 Reset history from the Statistics panel opened from the menu over the collapsed sheet leaves neither block nor line', async ({
    page,
  }) => {
    await giveUpWithBlock(page);
    await handle(page).click();
    await expect(anySheet(page)).toHaveCount(0);
    await menuButton(page).click();
    await page.getByRole('button', { name: 'Statistics', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Statistics' })
      .getByRole('button', { name: 'Reset history', exact: true })
      .click();
    await button(page, 'Delete history').click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Statistics' })).toHaveCount(0);
    await bar(page).click();
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(sheet(page, GAVE).getByText(UNREADABLE)).toHaveCount(0);
    await expect(line(page)).toHaveCount(0);
    await expect(resetButton(page)).toHaveCount(0);
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

// Ticket 10.2 (R-88): the Words section of the expanded sheet (`WON_ROWS` in helpers/celebration.ts).
const GAVE_ROWS = WON_ROWS.slice(1);

// The won fixture with its last move dropped and gaveUp set (a `{ literal }` session).
function gaveUpLiteral(): string {
  const session = JSON.parse(fixture('session-won-words.json')) as {
    moves: unknown[];
    cursor: { index: number };
    gaveUp: boolean;
  };
  session.moves = session.moves.slice(0, 9);
  session.cursor.index = 9;
  session.gaveUp = true;
  return JSON.stringify(session);
}

const wordsList = (page: Page) => page.getByRole('list', { name: 'Words', exact: true });
const rows = (page: Page) =>
  wordsList(page)
    .getByRole('listitem')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
const wordcellKeys = (page: Page) =>
  page.evaluate(() =>
    JSON.stringify(
      Object.keys(localStorage)
        .filter((k) => k.startsWith('wordcell:'))
        .sort()
        .map((k) => [k, localStorage.getItem(k)]),
    ),
  );

test.describe('android words', () => {
  test.beforeEach(onAndroid);

  test('R-88 a won sheet lists the ten words in order, SURF twice', async ({ page }) => {
    await openFixture(page, 'session-won-words', { endSheet: 'expanded' });
    await expect(wordsList(page)).toBeVisible();
    expect(await rows(page)).toEqual(WON_ROWS);
    // The visible spans carry the same pairs: capitals with `QU` as `QU`, `n letters` by letterCount.
    const shown = await wordsList(page)
      .getByRole('listitem')
      .evaluateAll((els) =>
        els.map((e) =>
          ['.word', '.count'].map((s) => (e.querySelector(s) as HTMLElement).innerText),
        ),
      );
    expect(shown.map(([word, count]) => `${word}, ${count}`)).toEqual(WON_ROWS);
    expect(shown[1]).toEqual(['JDAQUYE', '7 letters']);
    await expect(page.getByRole('listitem', { name: 'SURF, 4 letters', exact: true })).toHaveCount(
      2,
    );
    await expect(page.getByRole('heading', { name: 'Words', level: 3 })).toBeVisible();
    await expect(replayButton(page)).toBeFocused();
  });

  test('R-88 a give-up with words lists the nine remaining words', async ({ page }) => {
    await openFixture(page, { literal: gaveUpLiteral() }, { endSheet: 'expanded' });
    await expect(sheet(page, GAVE)).toBeVisible();
    expect(await rows(page)).toEqual(GAVE_ROWS);
    await expect(page.getByRole('listitem', { name: /^EHNPBNTFSA/ })).toHaveCount(0);
  });

  test('R-88 a zero-move give-up shows the heading and the empty line, no list', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await giveUpFromMenu(page);
    await expect(sheet(page, GAVE)).toBeVisible();
    await expect(sheet(page, GAVE).getByRole('heading', { name: 'Words', level: 3 })).toBeVisible();
    await expect(sheet(page, GAVE).getByText('No words were played.')).toBeVisible();
    await expect(wordsList(page)).toHaveCount(0);
  });

  test('R-88 the section scrolls with the sheet, rows are 44 px, nothing overflows at 360 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 480 });
    await openFixture(page, 'session-won-words', { endSheet: 'expanded' });
    const content = page.locator('.content');
    const dims = await content.evaluate((el) => ({
      scroll: el.scrollHeight,
      client: el.clientHeight,
    }));
    expect(dims.scroll).toBeGreaterThan(dims.client);
    const fixed = async () => [
      await handle(page).boundingBox(),
      await page.locator('.top-bar').boundingBox(),
      await page.getByTestId('primary-action').boundingBox(),
    ];
    const before = await fixed();
    await content.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    expect(await content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await fixed()).toEqual(before);
    expect(await wordsList(page).evaluate((el) => getComputedStyle(el).overflowY)).toBe('visible');
    for (const item of await wordsList(page).getByRole('listitem').all()) {
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await content.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    const long = page.getByRole('listitem', { name: 'EHNPBNTFSA, 10 letters', exact: true });
    expect(await long.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    const wordSize = await long
      .locator('.word')
      .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(wordSize).toBeGreaterThanOrEqual(14);
    expect(await page.locator('.words button, .words a, .words [tabindex]').count()).toBe(0);
    const centres = await long.locator('span').evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return r.top + r.height / 2;
      }),
    );
    expect(centres).toHaveLength(2);
    expect(Math.abs(centres[0] - centres[1])).toBeLessThanOrEqual(2);
  });

  // DESIGN.md Words section: at 360 px the word shrinks (to 14 px at the least) before it wraps,
  // so a 20-letter word sits on one line beside its count.
  test('R-88 a 20-letter word shrinks below 16 px but not under 14 px and stays on one line beside its count at 360 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openFixture(page, { literal: SESSIONS.longWord }, { endSheet: 'expanded' });
    const long = page.getByRole('listitem', {
      name: 'TNPDVIMLDXOMIWRNZOAF, 20 letters',
      exact: true,
    });
    await expect(long).toBeVisible();
    const word = long.locator('.word');
    await expect(word).toHaveText('TNPDVIMLDXOMIWRNZOAF');
    const size = await word.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(size).toBeGreaterThanOrEqual(14);
    expect(size).toBeLessThan(16);
    // One line: every line box of the word's text shares one top.
    const lines = await word.evaluate((e) => {
      const range = document.createRange();
      range.selectNodeContents(e);
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    });
    expect(lines).toBe(1);
    const centres = await long.locator('span').evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return r.top + r.height / 2;
      }),
    );
    expect(centres).toHaveLength(2);
    expect(Math.abs(centres[0] - centres[1])).toBeLessThanOrEqual(2);
    expect(await long.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('R-88 scrolling, collapsing and expanding leave localStorage untouched', async ({
    page,
  }) => {
    await openFixture(page, 'session-won-words', { endSheet: 'expanded' });
    const before = await wordcellKeys(page);
    const session = (JSON.parse(before) as [string, string][]).find(([k]) => k === SESSION);
    expect(session?.[1]).toBe(fixture('session-won-words.json'));
    await page.locator('.content').evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await handle(page).click();
    await expect(anySheet(page)).toHaveCount(0);
    await expect(wordsList(page)).toHaveCount(0);
    await bar(page).click();
    await expect(wordsList(page)).toBeVisible();
    expect(await rows(page)).toEqual(WON_ROWS);
    expect(await wordcellKeys(page)).toBe(before);
  });

  test('R-88 the won list survives a reload', async ({ page }) => {
    await openFixture(page, 'session-won-words', { endSheet: 'expanded' });
    await page.reload();
    await expect(sheet(page)).toBeVisible();
    expect(await rows(page)).toEqual(WON_ROWS);
  });

  test('R-88 the give-up list survives a reload', async ({ page }) => {
    await openFixture(page, { literal: gaveUpLiteral() }, { endSheet: 'expanded' });
    await page.reload();
    await expect(sheet(page, GAVE)).toBeVisible();
    expect(await rows(page)).toEqual(GAVE_ROWS);
  });

  test('R-88 Undo of the finish removes the list and a later Give up lists the other words', async ({
    page,
  }) => {
    await openFixture(page, 'session-won-words', { endSheet: 'expanded' });
    await page.getByTestId('undo').click();
    await expect(wordsList(page)).toHaveCount(0);
    // Give up needs Idle (giveUpAvailable): undo the last word's Place and Composing phases too.
    for (let i = 0; i < 2; i++) {
      await page.getByTestId('undo').click();
      await glidesSettled(page);
    }
    await giveUpFromMenu(page);
    await expect(sheet(page, GAVE)).toBeVisible();
    const gave = await rows(page);
    expect(gave).not.toEqual(WON_ROWS);
    expect(gave).toHaveLength(9);
  });

  test('R-88 New game removes the list', async ({ page }) => {
    await openFixture(page, 'session-won-words', { endSheet: 'expanded' });
    await primary(page).click();
    await expect(wordsList(page)).toHaveCount(0);
  });

  test('R-88 Replay removes the list', async ({ page }) => {
    await openFixture(page, 'session-won-words', { endSheet: 'expanded' });
    await replayButton(page).click();
    await expect(wordsList(page)).toHaveCount(0);
  });
});
