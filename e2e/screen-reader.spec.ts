import { expect, type Page, test } from '@playwright/test';
import { centre, glidesSettled, openFixture, tapAt } from './helpers/board';
import { hidePage, showPage } from './helpers/lifecycle';
import {
  REGION,
  recordRegion,
  recordRegionFromBoot,
  resetRegion,
  sets,
} from './helpers/live-region';
import { onAndroid } from './helpers/project';
import { fixture, seedStorage } from './helpers/seed';

// Epic 6 ticket 6.13 (SPEC CAP-11; EXPERIENCE.md Accessibility Floor, A-E9): accessible names and
// the one polite live region. Fixtures (seed 1): `session-composing` (TAN, 3 letters, column 3's
// two cards on column 6 with k = 1), `session-place` (the same word in Place, target cell 3),
// `session-idle-fresh`, `session-won` (Undo gives the Place whose Confirm wins), `session-gave-up`,
// `session-place-used-cells` (Q-49: MINOR in Place, target 5, used cells 3 and 6, unchanged 4).

test.beforeEach(onAndroid);

const primary = (page: Page) => page.getByTestId('primary-action');
const region = (page: Page) => page.locator(REGION);
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const WIN = 'Every column cleared.';

// Waits one settled frame so a pending rAF set has landed.
async function settled(page: Page): Promise<void> {
  await glidesSettled(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

// The glyph of a live card, `Qu` read as the QU name.
async function letterOf(page: Page, id: number): Promise<string> {
  const glyph = (await page.getByTestId(`card-${id}`).locator('.glyph').textContent()) ?? '';
  return glyph === 'Qu' ? 'Q U, counts as two letters' : glyph;
}

test('A-E9 the region is one polite status element at the root, clipped and not inert', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await expect(region(page)).toHaveCount(1);
  await expect(region(page)).toHaveAttribute('role', 'status');
  await expect(region(page)).toHaveAttribute('aria-live', 'polite');
  const state = await region(page).evaluate((el) => ({
    display: getComputedStyle(el).display,
    inert: el.closest('[inert]') !== null,
    insideTray: el.closest('[data-band="tray"]') !== null,
  }));
  expect(state).toEqual({ display: 'block', inert: false, insideTray: false });
  await menuButton(page).click();
  expect(await region(page).evaluate((el) => el.closest('[inert]') !== null)).toBe(false);
});

test('A-E9 column cards, a selected card and a source foot read their names', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  const first = page.locator('[data-testid="column-1"] [data-place="column"]');
  const n = await first.count();
  const id = Number(await first.nth(1).getAttribute('data-card-id'));
  const letter = await letterOf(page, id);
  await expect(first.nth(1)).toHaveAttribute('role', 'button');
  await expect(first.nth(1)).toHaveAccessibleName(`${letter}, column 1, card 2 of ${n}`);
  await expect(page.getByTestId('foot-1')).toHaveAttribute('role', 'group');
  await expect(page.getByRole('group', { name: 'Column 3 foot' })).toHaveCount(1);

  await tapAt(page, await centre(first.nth(n - 1)));
  const last = Number(await first.nth(n - 1).getAttribute('data-card-id'));
  await expect(first.nth(n - 1)).toHaveAccessibleName(
    `${await letterOf(page, last)}, column 1, card ${n} of ${n}, selected`,
  );
  await expect(page.getByTestId('foot-1')).toHaveAccessibleName('Column 1, here');
  await expect(page.getByTestId('foot-2')).toHaveAccessibleName('Column 2 foot');
});

test('A-E9 an empty WordCell reads its name', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  await expect(page.getByTestId('wordcell-3')).toHaveAccessibleName('WordCell 3, empty');
});

test('A-E9 a stacked WordCell reads its name and exposes one named button', async ({ page }) => {
  await openFixture(page, 'session-won');
  const name = await page.getByTestId('wordcell-7').getAttribute('aria-label');
  expect(name).toMatch(/^WordCell 7, top (Q U, counts as two letters|[A-Z]), \d+ cards$/);
  // Only the top card of a non-used cell is a named button; a buried card is aria-hidden.
  const buttons = page.getByTestId('wordcell-7').getByRole('button');
  await expect(buttons).toHaveCount(1);
  await expect(buttons.first()).toHaveAccessibleName(/, WordCell 7, top$/);
});

test('A-E9 Composing names the destination card, tray tiles, a selected tile and −, +, Flip', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  await expect(page.getByRole('button', { name: /, destination$/ })).toHaveCount(1);
  const tiles = page.getByRole('button', { name: /, tray, tile \d of \d/ });
  const n = await tiles.count();
  expect(n).toBeGreaterThan(0);
  await expect(tiles.last()).toHaveAccessibleName(new RegExp(`, tray, tile ${n} of ${n}$`));
  await tapAt(page, await centre(tiles.first()));
  await expect(
    page.getByRole('button', { name: new RegExp(`, tray, tile 1 of ${n}, selected$`) }),
  ).toHaveCount(1);
  await expect(page.getByRole('button', { name: '−', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '+', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Flip', exact: true })).toHaveCount(1);
});

test('A-E9 Place names the tray tiles of the placement strip', async ({ page }) => {
  await openFixture(page, 'session-place');
  const tiles = page.getByRole('button', { name: /, tray, tile \d of \d/ });
  await expect(tiles).toHaveCount(3);
  await expect(tiles.first()).toHaveAccessibleName(/, tray, tile 1 of 3$/);
  await expect(tiles.last()).toHaveAccessibleName(/, tray, tile 3 of 3$/);
});

test('A-E9 live region through Validate, Confirm, Undo and a committing Redo', async ({ page }) => {
  await openFixture(page, 'session-composing');
  await recordRegion(page);
  await primary(page).click();
  await expect(primary(page)).toHaveText('Confirm');
  await expect.poll(() => sets(page)).toEqual(['Place. TAN, 3 letters.']);
  await resetRegion(page);

  await primary(page).click();
  await glidesSettled(page);
  await expect.poll(() => sets(page)).toEqual(['TAN placed on cell 3, plus 9']);
  await resetRegion(page);

  await page.getByTestId('undo').click();
  await expect.poll(() => sets(page)).toEqual(['Undo. Place. TAN, 3 letters.']);
  await resetRegion(page);

  await page.getByTestId('redo').click();
  await expect.poll(() => sets(page)).toEqual(['TAN placed on cell 3, plus 9']);
});

test('A-E9 Undo and Redo of a phase announce the resulting phase', async ({ page }) => {
  await openFixture(page, 'session-composing');
  await recordRegion(page);
  await page.getByTestId('undo').click();
  await expect.poll(() => sets(page)).toEqual(['Undo. Idle.']);
  await resetRegion(page);
  await page.getByTestId('redo').click();
  await expect.poll(() => sets(page)).toEqual(['Redo. Composing. TAN, 3 letters.']);
});

test('A-E9 a repeated invalid word is announced twice, as two separate sets', async ({ page }) => {
  await page.route(/\/en[^/?]*\.txt$/, (route) =>
    route.fulfill({ status: 200, body: 'cat\ndog\n' }),
  );
  await seedStorage(page, { session: fixture('session-composing.json') });
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
  await expect(primary(page)).toHaveText('Validate');
  await expect(primary(page)).toBeEnabled();
  await recordRegion(page);
  await primary(page).click();
  await expect.poll(() => sets(page)).toEqual(["TAN isn't in the word list."]);
  await settled(page);
  await primary(page).click();
  await expect
    .poll(() => sets(page))
    .toEqual(["TAN isn't in the word list.", "TAN isn't in the word list."]);
});

test('A-E9 New game and Replay announce the Idle phase', async ({ page }) => {
  await openFixture(page, 'session-composing');
  await recordRegion(page);
  await menuButton(page).click();
  await page
    .getByRole('dialog', { name: 'Menu', exact: true })
    .getByRole('button', { name: 'Replay this deal', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: 'Replay this deal?' })
    .getByRole('button', { name: 'Replay', exact: true })
    .click();
  await expect.poll(() => sets(page)).toEqual(['Replay. Idle.']);
  await resetRegion(page);

  await menuButton(page).click();
  await page
    .getByRole('dialog', { name: 'Menu', exact: true })
    .getByRole('button', { name: 'New game', exact: true })
    .click();
  // After Replay the deal has no moves, so New game acts at once (R-74).
  await expect.poll(() => sets(page)).toEqual(['New game. Idle.']);
});

test('A-E9 New game from the rejected root announces', async ({ page }) => {
  await seedStorage(page, { session: fixture('session-invalid-version-unknown.json') });
  await page.goto('/');
  await recordRegion(page);
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await expect.poll(() => sets(page)).toEqual(['New game. Idle.']);
});

test('A-E9 a win announces the commit text first, then the outcome', async ({ page }) => {
  await openFixture(page, 'session-won', { steps: ['undo'] });
  await recordRegion(page);
  await resetRegion(page);
  await primary(page).click();
  await expect.poll(async () => (await sets(page)).length).toBe(2);
  const [commit, outcome] = await sets(page);
  expect(commit).toBe('SBRRCU placed on cell 6, plus 36');
  expect(outcome).toBe(`${WIN} Score 355, Lexicon Legend.`);
});

test('A-E9 a Give up announces only the outcome, penalty not read', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  await recordRegion(page);
  await menuButton(page).click();
  await page
    .getByRole('dialog', { name: 'Menu', exact: true })
    .getByRole('button', { name: 'Give up', exact: true })
    .click();
  await expect.poll(async () => (await sets(page)).length).toBe(1);
  const [outcome] = await sets(page);
  expect(outcome).toMatch(/^Game given up\. Score minus \d+, [A-Za-z ]+\.$/);
});

test('A-E9 a relaunch into a stored session is silent', async ({ page }) => {
  await recordRegionFromBoot(page);
  await openFixture(page, 'session-composing');
  await settled(page);
  expect(await sets(page)).toEqual([]);
  // Control: the boot recorder does see a set, so the empty list above is not a blind recorder.
  await page.getByTestId('undo').click();
  await expect.poll(async () => (await sets(page)).length).toBe(1);
});

test('A-E9 a relaunch into Game over is silent', async ({ page }) => {
  await recordRegionFromBoot(page);
  await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
  await settled(page);
  expect(await sets(page)).toEqual([]);
});

test('A-E9 a return from hidden and a sheet re-expand are silent', async ({ page }) => {
  await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
  await recordRegion(page);
  await page.getByRole('button', { name: 'Collapse result', exact: true }).click();
  await page.getByRole('button', { name: /^Show result:/ }).click();
  await hidePage(page);
  await page.waitForTimeout(300);
  await showPage(page);
  await settled(page);
  expect(await sets(page)).toEqual([]);
});

// Confirms in one page task and, with `hide`, hides in the same task, so the commit's set is still
// pending (before its frame) when the hide flush runs. The emulated hide does not stop rAF: only the
// flush can drop the set.
function confirmThen(page: Page, hide: boolean): Promise<void> {
  return page.evaluate((hideToo) => {
    const button = document.querySelector<HTMLElement>('[data-testid="primary-action"]');
    if (button === null) throw new Error('no primary action');
    button.click();
    if (!hideToo) return;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  }, hide);
}

test('A-E9 a commit set still pending when the page hides is never spoken on return', async ({
  page,
}) => {
  await openFixture(page, 'session-place');
  await recordRegion(page);
  await confirmThen(page, true);
  await settled(page);
  await showPage(page);
  await settled(page);
  await expect(primary(page)).toHaveText('Validate');
  expect(await sets(page)).toEqual([]);
});

test('A-E9 the same commit with no hide is announced (control for the hide case)', async ({
  page,
}) => {
  await openFixture(page, 'session-place');
  await recordRegion(page);
  await confirmThen(page, false);
  await settled(page);
  expect(await sets(page)).toEqual(['TAN placed on cell 3, plus 9']);
});

test('A-E9 a used WordCell reads its name with used', async ({ page }) => {
  // Composing (one Undo from Place): in Place the cell reads its Q-49 preview name instead.
  await openFixture(page, 'session-place-free-letter-two-cards', { steps: ['undo'] });
  await expect(page.getByTestId('wordcell-4')).toHaveAccessibleName(
    'WordCell 4, top N, 2 cards, used',
  );
});

test('A-E9 Q-49 in Place each WordCell the commit changes reads its after-this-word name and exposes no named card', async ({
  page,
}) => {
  // session-place-used-cells: target 5 (empty), used cells 3 (one card) and 6 (not legal).
  await openFixture(page, 'session-place-used-cells');
  for (const [n, name] of [
    [5, 'WordCell 5, top R, 5 cards, after this word'],
    [6, 'WordCell 6, top O, 5 cards, after this word'],
    [3, 'WordCell 3, empty, after this word'],
  ] as const) {
    const cell = page.getByTestId(`wordcell-${n}`);
    await expect(cell).toHaveAccessibleName(name);
    await expect(cell.getByRole('button')).toHaveCount(0);
  }
});

test('A-E9 Q-49 in Place an unchanged WordCell keeps its name and its one named top card', async ({
  page,
}) => {
  await openFixture(page, 'session-place-used-cells');
  const cell = page.getByTestId('wordcell-4');
  await expect(cell).toHaveAccessibleName('WordCell 4, top R, 5 cards');
  await expect(cell.getByRole('button')).toHaveCount(1);
  await expect(cell.getByRole('button', { name: 'R, WordCell 4, top', exact: true })).toHaveCount(
    1,
  );
});

test('A-E9 a QU column card reads Q U, counts as two letters', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  await expect(
    page.getByRole('button', { name: 'Q U, counts as two letters, column 3, card 2 of 7' }),
  ).toHaveCount(1);
});

test('A-E9 a QU top card of a non-used WordCell reads Q U, counts as two letters', async ({
  page,
}) => {
  // Place with QU as the free letter of cell 4, undone twice: Idle, cell 4 no longer used.
  await openFixture(page, 'session-place-compact', { steps: ['undo', 'undo'] });
  await expect(page.getByTestId('wordcell-4')).toHaveAccessibleName(
    'WordCell 4, top Q U, counts as two letters, 3 cards',
  );
  await expect(
    page.getByRole('button', { name: 'Q U, counts as two letters, WordCell 4, top' }),
  ).toHaveCount(1);
});

test('A-E9 the region has no inert ancestor with a panel and a dialog open', async ({ page }) => {
  const inert = () => region(page).evaluate((el) => el.closest('[inert]') !== null);
  await openFixture(page, 'session-idle-empty-column');
  await menuButton(page).click();
  await page
    .getByRole('dialog', { name: 'Menu', exact: true })
    .getByRole('button', { name: 'Preferences', exact: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Preferences', exact: true })).toBeVisible();
  expect(await inert()).toBe(false);
  await page.getByRole('button', { name: 'Close preferences', exact: true }).click();
  await menuButton(page).click();
  await page
    .getByRole('dialog', { name: 'Menu', exact: true })
    .getByRole('button', { name: 'New game', exact: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Start a new game?' })).toBeVisible();
  expect(await inert()).toBe(false);
});

test('A-E9 the region has no inert ancestor with the History notice open', async ({ page }) => {
  await seedStorage(page, {
    session: fixture('session-idle-fresh.json'),
    history: fixture('history-invalid-null.json'),
  });
  await page.goto('/');
  await expect(
    page.getByRole('dialog', { name: "Your score history can't be read." }),
  ).toBeVisible();
  expect(await region(page).evaluate((el) => el.closest('[inert]') !== null)).toBe(false);
});
