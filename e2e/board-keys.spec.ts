import { expect, type Locator, type Page, test } from '@playwright/test';
import { cards, glidesSettled } from './helpers/board';
import { wc } from './helpers/dialogs';
import {
  arrangeByKeys,
  focusedCard,
  open,
  press,
  tiles,
  toComposing,
  tray,
  where,
} from './helpers/keys';
import { onDesktop } from './helpers/project';
import { expectSelection, selection } from './helpers/selection';
import { draftDetail, game } from './helpers/session';
import { SESSIONS } from './helpers/sessions';

// Epic 6 ticket 6.11 (SPEC CAP-10; Q-24, A-E7, R-14, R-31, R-33; EXPERIENCE.md Keyboard, Flow 6):
// the board keys, the roving focus and focus-follows-phase on desktop. Fixtures: `session-idle-fresh`
// (seed 1, Idle), `session-idle-empty-column` (column 1 empty, cell 7 holds 7 cards),
// `SESSIONS.flow6` (a Flow 1 stand-in, seed 1 after 3 words: columns 1-3 empty, cell 7 holds
// 14 cards, cell 8 holds 7; column 6's bottom four cards dropped on column 5 spell ZENANA with
// cell 8's top card as the free letter, six letters so the default target is cell 6),
// `SESSIONS.cell10` (cell 10 holds a 10-letter word), `session-won`, `session-gave-up`,
// `session-place-free-letter-two-cards` (Place, legal targets 3-5, target 5). Every expected value is
// a literal from view() over the fixtures, never edited to pass.

test.beforeEach(onDesktop);

// The elements that are Tab stops (tabindex 0) among `locator`.
const stops = (locator: Locator) =>
  locator.evaluateAll((els) => els.filter((el) => (el as HTMLElement).tabIndex === 0).length);

const strip = (page: Page) => tray(page).locator('[data-card-id][data-place="strip"]');
const cell = (page: Page, n: number) => page.getByTestId(`wordcell-${n}`);
const foot = (page: Page, n: number) => page.getByTestId(`foot-${n}`);
const sheet = (page: Page) => page.locator('[data-view-sheet]');
const primary = (page: Page) => page.getByTestId('primary-action');
const phaseOf = (page: Page) =>
  page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session.cursor.phase;
  });
const lowest = (page: Page, n: number) => cards(page, n).last();

const tileSelection = (page: Page) =>
  page
    .locator('[data-band="tray"] [data-card-id].selected')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id')));

// A key that does not act dispatches nothing and is not default-prevented (CAP-10).
async function expectNoop(page: Page, key: string): Promise<void> {
  const before = await game(page);
  const selBefore = await selection(page);
  const tilesBefore = await tileSelection(page);
  expect(await press(page, key), `${key} is not default-prevented`).toBe(false);
  expect(await game(page), `${key} dispatches nothing`).toBe(before);
  expect(await selection(page), `${key} leaves the column selection`).toEqual(selBefore);
  expect(await tileSelection(page), `${key} leaves the tile selection`).toEqual(tilesBefore);
}

test.describe('Idle', () => {
  test('R-14 Q-24 1 selects the bottom card of column 1, up and down re-select, down at one card is a no-op', async ({
    page,
  }) => {
    await open(page, 'session-idle-fresh');
    expect(await press(page, '1')).toBe(true);
    await expectSelection(page, { column: 1, count: 1 }, 1);
    await expect(foot(page, 1)).toHaveText('Here');
    await expect(lowest(page, 1)).toBeFocused();
    expect(await press(page, 'ArrowUp')).toBe(true);
    await expectSelection(page, { column: 1, count: 2 }, 1);
    await expect(cards(page, 1).nth(5)).toBeFocused();
    expect(await press(page, 'ArrowUp')).toBe(true);
    await expectSelection(page, { column: 1, count: 3 }, 1);
    expect(await press(page, 'ArrowDown')).toBe(true);
    await expectSelection(page, { column: 1, count: 2 }, 1);
    expect(await press(page, 'ArrowDown')).toBe(true);
    await expectSelection(page, { column: 1, count: 1 }, 1);
    await expect(lowest(page, 1)).toBeFocused();
    const before = await game(page);
    expect(await press(page, 'ArrowDown')).toBe(false);
    await expectSelection(page, { column: 1, count: 1 }, 1);
    expect(await game(page)).toBe(before);
  });

  test('R-14 up stops at the whole column: the seventh card selects 7, one more up is a no-op', async ({
    page,
  }) => {
    await open(page, 'session-idle-fresh');
    await page.keyboard.press('1');
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
    await expectSelection(page, { column: 1, count: 7 }, 1);
    expect(await press(page, 'ArrowUp')).toBe(false);
    await expectSelection(page, { column: 1, count: 7 }, 1);
  });

  test('R-14 R-21 a number with a tail selected drops there; the source number is a drop on the source column (the Here pad), with the selection and its history entry gone', async ({
    page,
  }) => {
    await open(page, 'session-idle-fresh');
    await page.keyboard.press('1');
    await expectSelection(page, { column: 1, count: 1 }, 1);
    expect(await press(page, '2')).toBe(true);
    await expect
      .poll(() => draftDetail(page))
      .toMatchObject({
        phase: 'composing',
        sourceColumn: 1,
        sourceCount: 1,
        destinationColumn: 2,
      });
    await expectSelection(page, null, 0);
    await expect(tiles(page).first()).toBeFocused();
    await page.keyboard.press('z');
    await expect(tiles(page)).toHaveCount(0);
    await page.keyboard.press('1');
    await expectSelection(page, { column: 1, count: 1 }, 1);
    expect(await press(page, '1')).toBe(true);
    await expect
      .poll(() => draftDetail(page))
      .toMatchObject({
        phase: 'composing',
        sourceColumn: 1,
        destinationColumn: 1,
      });
    await expectSelection(page, null, 0);
  });

  test('R-14 a number drops on an empty column; with nothing selected an empty column is a no-op', async ({
    page,
  }) => {
    await open(page, 'session-idle-empty-column');
    await expectNoop(page, '1');
    await page.keyboard.press('2');
    await expectSelection(page, { column: 2, count: 1 }, 1);
    expect(await press(page, '1')).toBe(true);
    await expect
      .poll(() => draftDetail(page))
      .toMatchObject({
        phase: 'composing',
        sourceColumn: 2,
        destinationColumn: 1,
        destinationCount: 0,
      });
  });

  test('Q-24 the keys with no Idle row do nothing: 9, 0, +, =, -, F, arrows, Shift+arrows, Enter and Space on nothing', async ({
    page,
  }) => {
    await open(page, 'session-idle-fresh');
    for (const key of [
      '9',
      '0',
      '+',
      '=',
      '-',
      'f',
      'F',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Shift+ArrowLeft',
      'Shift+ArrowRight',
      'Enter',
      'Space',
    ]) {
      await expectNoop(page, key);
    }
    await expectSelection(page, null, 0);
  });

  test('R-10 Space and Enter on a focused column card are the tap on it', async ({ page }) => {
    await open(page, 'session-idle-fresh');
    for (const key of ['Space', 'Enter']) {
      await cards(page, 2).nth(4).focus();
      expect(await press(page, key)).toBe(true);
      await expectSelection(page, { column: 2, count: 3 }, 1);
      await page.keyboard.press('Escape');
      await expectSelection(page, null, 0);
    }
  });

  test('R-65 R-75 Enter and Space on a non-empty WordCell open the sticky view; an empty one opens nothing', async ({
    page,
  }) => {
    await open(page, 'session-idle-empty-column');
    for (const key of ['Enter', 'Space']) {
      await cell(page, 7).focus();
      expect(await press(page, key)).toBe(true);
      await expect(sheet(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(sheet(page)).toHaveCount(0);
    }
    await cell(page, 3).focus();
    await expectNoop(page, 'Enter');
    await expectNoop(page, 'Space');
    await expect(sheet(page)).toHaveCount(0);
  });

  test('R-65 a tail selection is cleared first: Space on a non-empty WordCell pops its entry and opens the view; Enter or Space on an empty one only deselects', async ({
    page,
  }) => {
    await open(page, 'session-idle-empty-column');
    await page.keyboard.press('2');
    await expectSelection(page, { column: 2, count: 1 }, 1);
    await cell(page, 3).focus();
    expect(await press(page, 'Enter')).toBe(true);
    await expectSelection(page, null, 0);
    await expect(sheet(page)).toHaveCount(0);
    await page.keyboard.press('2');
    await cell(page, 3).focus();
    expect(await press(page, 'Space')).toBe(true);
    await expectSelection(page, null, 0);
    await expect(sheet(page)).toHaveCount(0);
    await page.keyboard.press('2');
    await cell(page, 7).focus();
    expect(await press(page, 'Space')).toBe(true);
    await expect(sheet(page)).toBeVisible();
    await expectSelection(page, null, 1);
    expect((await wc(page))?.wc).toBe(1);
  });

  test('R-65 Enter on a non-empty WordCell with a tail selected is the tap: it deselects and opens no view', async ({
    page,
  }) => {
    await open(page, 'session-idle-empty-column');
    await page.keyboard.press('2');
    await expectSelection(page, { column: 2, count: 1 }, 1);
    await cell(page, 7).focus();
    expect(await press(page, 'Enter')).toBe(true);
    await expectSelection(page, null, 0);
    await expect(sheet(page)).toHaveCount(0);
  });

  test('Q-24 1 with the sticky view open closes it, then selects', async ({ page }) => {
    await open(page, 'session-idle-empty-column');
    await cell(page, 7).focus();
    await page.keyboard.press('Enter');
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press('2');
    await expect(sheet(page)).toHaveCount(0);
    await expectSelection(page, { column: 2, count: 1 }, 1);
    await expect(lowest(page, 2)).toBeFocused();
  });
});

test.describe('Tab order', () => {
  test('Q-24 Tab visits the top bar, one stop per non-empty column and the WordCells 3-10, reaching cell 10 and opening its view', async ({
    page,
  }) => {
    await open(page, { literal: SESSIONS.cell10 });
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    const visited: string[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const at = await where(page);
      if (at.tag === 'BODY' || at.tag === '') break;
      visited.push(
        at.column !== null && at.card !== null
          ? `column ${at.column}`
          : at.cell !== null
            ? `cell ${at.cell}`
            : (at.testid ?? at.name ?? at.tag),
      );
      if (at.cell === '10') break;
    }
    expect(visited).toEqual([
      'Menu',
      'undo',
      'column 1',
      'column 3',
      'column 4',
      'column 5',
      'column 6',
      'column 7',
      'column 8',
      'cell 3',
      'cell 4',
      'cell 5',
      'cell 6',
      'cell 7',
      'cell 8',
      'cell 9',
      'cell 10',
    ]);
    await page.keyboard.press('Tab');
    // Idle: the primary action is disabled (not a Tab stop), so Tab leaves the board stops.
    await expect(primary(page)).toBeDisabled();
    const after = await where(page);
    expect(after.cell, 'Tab after cell 10 stops on no further cell').not.toBe('10');
    expect(after.card, 'Tab after cell 10 stops on no card').toBeNull();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(sheet(page)).toBeVisible();
  });

  test('Q-24 a column is one Tab stop on its last-focused card, the bottom one by default; a key tail selection sets the tail top card', async ({
    page,
  }) => {
    await open(page, 'session-idle-fresh');
    await expect(cards(page, 2).last()).toHaveAttribute('tabindex', '0');
    await expect(cards(page, 2).first()).toHaveAttribute('tabindex', '-1');
    await cards(page, 2).nth(2).focus();
    await expect(cards(page, 2).nth(2)).toHaveAttribute('tabindex', '0');
    await expect(cards(page, 2).last()).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('3');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(cards(page, 3).nth(4)).toHaveAttribute('tabindex', '0');
    await expect(cards(page, 3).nth(4)).toBeFocused();
  });

  test('Q-24 the tray is one Tab stop; the arrows move within it without wrapping and skip the destination block', async ({
    page,
  }) => {
    await toComposing(page);
    await expect(tiles(page).first()).toBeFocused();
    await expect(tiles(page).first()).toHaveAttribute('tabindex', '0');
    await expect(tiles(page).nth(1)).toHaveAttribute('tabindex', '-1');
    await expectNoop(page, 'ArrowLeft');
    for (let i = 1; i < 4; i++) {
      expect(await press(page, 'ArrowRight')).toBe(true);
      await expect(tiles(page).nth(i)).toBeFocused();
    }
    await expectNoop(page, 'ArrowRight');
    await expect(tiles(page).nth(3)).toBeFocused();
  });
});

test.describe('Mirrors', () => {
  test('Q-24 AD-14 no mirror is focusable and exactly one element per data-card-id is', async ({
    page,
  }) => {
    await toComposing(page);
    const found = await page.evaluate(() => {
      const mirrors = [...document.querySelectorAll('[data-mirror-of]')];
      const live = [...document.querySelectorAll('[data-card-id]')];
      const ids = live.map((el) => el.getAttribute('data-card-id'));
      return {
        mirrors: mirrors.length,
        focusableMirrors: mirrors.filter((el) => el.hasAttribute('tabindex')).length,
        duplicateIds: ids.length - new Set(ids).size,
        focusableLive: live.filter((el) => el.hasAttribute('tabindex')).length,
        mirrorOfFocusable: mirrors.filter((el) =>
          live.some(
            (l) =>
              l.getAttribute('data-card-id') === el.getAttribute('data-mirror-of') &&
              l.hasAttribute('tabindex'),
          ),
        ).length,
      };
    });
    expect(found.mirrors, 'the Composing board renders mirrors').toBeGreaterThan(0);
    expect(found.focusableMirrors).toBe(0);
    expect(found.duplicateIds).toBe(0);
    expect(found.focusableLive).toBeGreaterThan(0);
    expect(found.mirrorOfFocusable).toBeGreaterThan(0);
  });
});

test.describe('Tab order by phase', () => {
  test('Q-24 Composing: the tray is exactly one Tab stop; Tab leaves it and Shift+Tab returns to the preceding column stop', async ({
    page,
  }) => {
    await toComposing(page);
    await page.keyboard.press('8');
    expect(await stops(tiles(page))).toBe(1);
    await tiles(page).nth(2).focus();
    expect(await stops(tiles(page))).toBe(1);
    await expect(tiles(page).nth(2)).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('Shift+Tab');
    const back = await where(page);
    expect(back.place).toBe('column');
    const lastStop = await page.evaluate(() => {
      const stopsInColumns = [
        ...document.querySelectorAll<HTMLElement>('[data-column] [data-card-id]'),
      ].filter((el) => el.tabIndex === 0);
      return stopsInColumns.at(-1)?.getAttribute('data-card-id') ?? null;
    });
    expect(back.card).toBe(lastStop);
    await page.keyboard.press('Tab');
    const forward = await where(page);
    expect(forward.place, 'Tab from the column stop enters the tray at one tile').toBe('tray');
    await page.keyboard.press('Tab');
    expect((await where(page)).place, 'Tab leaves the tray').not.toBe('tray');
  });

  test('Q-24 Place: the strip is exactly one Tab stop; Tab leaves it and Shift+Tab returns to the preceding column stop', async ({
    page,
  }) => {
    await open(page, 'session-place-free-letter-two-cards');
    expect(await stops(strip(page))).toBe(1);
    await strip(page).nth(1).focus();
    expect(await stops(strip(page))).toBe(1);
    await expect(strip(page).nth(1)).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('Shift+Tab');
    const back = await where(page);
    expect(back.place).toBe('column');
    await page.keyboard.press('Tab');
    expect((await where(page)).place).toBe('strip');
    await page.keyboard.press('Tab');
    expect((await where(page)).place, 'Tab leaves the strip').not.toBe('strip');
  });
});

test.describe('Composing', () => {
  test('R-33 Q-31 3-9 and 0 add that WordCell top card as a free letter and focus the new tile; a used or empty cell and 1, 2 are no-ops', async ({
    page,
  }) => {
    await toComposing(page);
    expect(await press(page, '8')).toBe(true);
    await expect(tiles(page)).toHaveCount(5);
    await expect(tiles(page).last()).toBeFocused();
    await expect.poll(async () => (await game(page)).includes('"freeLetters":[8]')).toBe(true);
    expect(await press(page, '7')).toBe(true);
    await expect(tiles(page)).toHaveCount(6);
    await expect(tiles(page).last()).toBeFocused();
    for (const key of ['3', '4', '5', '6', '9', '0', '1', '2']) await expectNoop(page, key);
    await expectNoop(page, '8');
  });

  test('R-34 Shift+arrow moves the focused tile one place and focus stays on it; at either end it is a no-op, not an edit', async ({
    page,
  }) => {
    await toComposing(page);
    const first = await focusedCard(page);
    await expectNoop(page, 'Shift+ArrowLeft');
    expect(await press(page, 'Shift+ArrowRight')).toBe(true);
    await expect
      .poll(async () => (await draftDetail(page)).arrangement.indexOf(Number(first)))
      .toBe(1);
    expect(await focusedCard(page)).toBe(first);
    expect(await press(page, 'Shift+ArrowLeft')).toBe(true);
    await expect
      .poll(async () => (await draftDetail(page)).arrangement.indexOf(Number(first)))
      .toBe(0);
    expect(await focusedCard(page)).toBe(first);
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
    await expectNoop(page, 'Shift+ArrowRight');
  });

  test('R-35 Space on a tile selects, on another swaps; on a free letter twice returns it and focus goes to the previous tile when it was last', async ({
    page,
  }) => {
    await toComposing(page);
    const before = (await draftDetail(page)).arrangement;
    expect(await press(page, 'Space')).toBe(true);
    await expect(tiles(page).first()).toHaveClass(/selected/);
    await page.keyboard.press('ArrowRight');
    expect(await press(page, 'Space')).toBe(true);
    await expect(tray(page).locator('[data-card-id].selected')).toHaveCount(0);
    await expect
      .poll(async () => (await draftDetail(page)).arrangement)
      .toEqual([before[1], before[0], before[2], before[3]]);
    expect(await focusedCard(page)).toBe(String(before[1]));
    await page.keyboard.press('8');
    await expect(tiles(page)).toHaveCount(5);
    await expect(tiles(page).last()).toBeFocused();
    await page.keyboard.press('Space');
    await expect(tiles(page).last()).toHaveClass(/selected/);
    await page.keyboard.press('Space');
    await expect(tiles(page)).toHaveCount(4);
    await expect(tiles(page).last()).toBeFocused();
    await expect.poll(async () => (await game(page)).includes('"freeLetters":[]')).toBe(true);
  });

  test('R-33 returning a free letter that is not last focuses the next tile', async ({ page }) => {
    await toComposing(page);
    await page.keyboard.press('8');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    const ids = await tiles(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-card-id')),
    );
    expect(await focusedCard(page)).toBe(ids[2]);
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await expect(tiles(page)).toHaveCount(4);
    await expect.poll(() => focusedCard(page)).toBe(ids[3]);
  });

  test('R-31 + and = add a destination card, - removes one, F flips; each only while its control is enabled', async ({
    page,
  }) => {
    await toComposing(page);
    const k = async () => (await draftDetail(page)).destinationCount;
    expect(await k()).toBe(1);
    await expectNoop(page, '-');
    expect(await press(page, '+')).toBe(true);
    await expect.poll(k).toBe(2);
    expect(await press(page, '=')).toBe(true);
    await expect.poll(k).toBe(3);
    expect(await press(page, '-')).toBe(true);
    await expect.poll(k).toBe(2);
    const side = async () => (await draftDetail(page)).destinationSide;
    expect(await side()).toBe('left');
    expect(await press(page, 'f')).toBe(true);
    await expect.poll(side).toBe('right');
    expect(await press(page, 'Shift+F')).toBe(true);
    await expect.poll(side).toBe('left');
  });

  test('Q-24 +, - and F in Composing leave focus on a live tray tile (the focused tile is never removed by them)', async ({
    page,
  }) => {
    await toComposing(page);
    // These keys re-render the destination block but never remove the focused movable tile.
    await tiles(page).first().focus();
    for (const key of ['+', '-', 'f']) {
      await page.keyboard.press(key);
      await expect
        .poll(async () => {
          const at = await where(page);
          return at.tag !== 'BODY' && at.card !== null && at.place === 'tray';
        }, key)
        .toBe(true);
    }
  });

  test('Q-24 Enter and Space on a focused top-bar button belong to the button: the board Enter row does not fire', async ({
    page,
  }) => {
    await toComposing(page);
    const before = await phaseOf(page);
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    for (const key of ['Enter', 'Space']) {
      await menu.focus();
      await page.keyboard.press(key);
      await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).toBeVisible();
      expect(await phaseOf(page), `${key} on Menu does not validate`).toBe(before);
      expect(before).toBe('composing');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).toHaveCount(0);
    }
  });

  test('Q-24 Enter on a tile validates only when Validate is enabled; with the tray at 2 letters it is a no-op', async ({
    page,
  }) => {
    await open(page, 'session-composing-draft-2-letters');
    await tiles(page).first().focus();
    await expect(primary(page)).toBeDisabled();
    await expectNoop(page, 'Enter');
  });
});

test.describe('Flow 6', () => {
  test('Q-24 A-E7 EXPERIENCE.md Flow 6: a full move placed and confirmed by keyboard.press alone', async ({
    page,
  }) => {
    await toComposing(page);
    // Step 3: `8` adds the free letter at the end, Shift+arrows spell ZENANA.
    await page.keyboard.press('8');
    await expect(tiles(page)).toHaveCount(5);
    await arrangeByKeys(page, 'ENANA');
    await expect(tray(page).locator('.word-line')).toHaveText('ZENANA');
    await page.keyboard.press('Enter');
    await expect(strip(page)).toHaveCount(6);
    await expect(strip(page).first()).toBeFocused();
    await expect(primary(page)).toHaveAccessibleName('Confirm');
    // Step 4: `6` keeps the target (cell 6 for six letters), Enter confirms.
    const placed = await game(page);
    expect(await press(page, '6')).toBe(false);
    expect(await game(page)).toBe(placed);
    await page.keyboard.press('Enter');
    await glidesSettled(page);
    await expect.poll(async () => (await game(page)).includes('"phase":"idle"')).toBe(true);
    await expect(cell(page, 6).locator('.count')).toHaveText('6');
    // The board: the bottom card of the lowest-numbered non-empty column (column 4).
    await expect(lowest(page, 4)).toBeFocused();
    // Step 5: `?` shows the same controls table.
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog', { name: 'How to play', exact: true })).toBeVisible();
  });
});

test.describe('Place', () => {
  test('R-40 R-41 3-9 and 0 set a legal cell as the target; the current target, an illegal cell and 1, 2 are no-ops', async ({
    page,
  }) => {
    await open(page, 'session-place-free-letter-two-cards');
    const target = async () => (await draftDetail(page)).phase;
    expect(await target()).toBe('place');
    await expectNoop(page, '5');
    for (const key of ['6', '7', '8', '9', '0', '1', '2']) await expectNoop(page, key);
    expect(await press(page, '4')).toBe(true);
    await expect(cell(page, 4)).toHaveClass(/target/);
    expect(await press(page, '3')).toBe(true);
    await expect(cell(page, 3)).toHaveClass(/target/);
    await expectNoop(page, '3');
  });

  test('R-51 Space on a strip card selects, on another swaps; Shift+arrow moves the focused card; ←/→ move focus without wrapping; Enter confirms', async ({
    page,
  }) => {
    await open(page, 'session-place-free-letter-two-cards');
    await strip(page).first().focus();
    await expectNoop(page, 'ArrowLeft');
    await expectNoop(page, 'Shift+ArrowLeft');
    const order = () =>
      strip(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id')));
    const start = await order();
    expect(await press(page, 'Shift+ArrowRight')).toBe(true);
    await expect.poll(order).toEqual([start[1], start[0], ...start.slice(2)]);
    expect(await focusedCard(page)).toBe(start[0]);
    expect(await press(page, 'ArrowRight')).toBe(true);
    await expect.poll(() => focusedCard(page)).toBe(start[2]);
    await page.keyboard.press('Space');
    await expect(strip(page).nth(2)).toHaveClass(/selected/);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');
    await expect.poll(order).toEqual([start[1], start[2], start[0], ...start.slice(3)]);
    await page.keyboard.press('Enter');
    await glidesSettled(page);
    await expect.poll(() => phaseOf(page)).toBe('idle');
  });

  test('R-41 Enter on a legal WordCell sets the target (the tap on it)', async ({ page }) => {
    await open(page, 'session-place-free-letter-two-cards');
    await cell(page, 4).focus();
    expect(await press(page, 'Enter')).toBe(true);
    await expect(cell(page, 4)).toHaveClass(/target/);
    await cell(page, 7).focus();
    await expectNoop(page, 'Enter');
  });
});

test.describe('focus follows the phase', () => {
  test('Q-24 Composing focuses the first movable tile, Place the first strip card, an Undo back the first tile and then the board; a commit returns to the board', async ({
    page,
  }) => {
    await toComposing(page);
    await expect(tiles(page).first()).toBeFocused();
    await page.keyboard.press('8');
    await arrangeByKeys(page, 'ENANA');
    await page.keyboard.press('Enter');
    await expect(strip(page).first()).toBeFocused();
    await page.keyboard.press('z');
    await expect(strip(page)).toHaveCount(0);
    await expect(tiles(page).first()).toBeFocused();
    await page.keyboard.press('z');
    await expect(tiles(page)).toHaveCount(0);
    await expect(lowest(page, 4)).toBeFocused();
    await page.keyboard.press('y');
    await expect(tiles(page).first()).toBeFocused();
    await page.keyboard.press('y');
    await expect(strip(page).first()).toBeFocused();
    await page.keyboard.press('Enter');
    await glidesSettled(page);
    await expect(lowest(page, 4)).toBeFocused();
  });

  test('Q-24 a pointer edit that removes a non-last focused free-letter tile hands focus to the next tile', async ({
    page,
  }) => {
    await toComposing(page);
    await page.keyboard.press('8');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    const ids = await tiles(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-card-id')),
    );
    const middle = tiles(page).nth(2);
    await expect(middle).toBeFocused();
    await middle.click();
    await middle.click();
    await expect(tiles(page)).toHaveCount(4);
    await expect.poll(() => focusedCard(page)).toBe(ids[3]);
  });

  test('Q-24 a pointer edit that removes the focused free-letter tile hands focus to the region first tile', async ({
    page,
  }) => {
    await toComposing(page);
    await page.keyboard.press('8');
    const last = tiles(page).last();
    await expect(last).toBeFocused();
    await last.click();
    await last.click();
    await expect(tiles(page)).toHaveCount(4);
    await expect(tiles(page).first()).toBeFocused();
  });

  test('Q-24 a restore into Composing focuses the first tile at once', async ({ page }) => {
    await open(page, 'session-composing-draft-2-letters');
    await expect(tiles(page).first()).toBeFocused();
  });

  test('Q-24 a restore into Place focuses the first strip card at once', async ({ page }) => {
    await open(page, 'session-place-free-letter-two-cards');
    await expect(strip(page).first()).toBeFocused();
  });

  test('Q-24 the first Idle paint moves no focus', async ({ page }) => {
    await open(page, 'session-idle-fresh');
    expect((await where(page)).tag).toBe('BODY');
  });

  test('Q-24 a winning commit moves focus to the end sheet first action', async ({ page }) => {
    await open(page, 'session-won', { steps: ['undo'] });
    await strip(page).first().focus();
    await page.keyboard.press('Enter');
    await glidesSettled(page);
    await expect(page.getByRole('button', { name: 'Replay this deal', exact: true })).toBeFocused();
  });

  test('Q-24 with every column empty (session-won, sheet collapsed with Esc) focus lands on the Board container', async ({
    page,
  }) => {
    await open(page, 'session-won', { endSheet: 'expanded' });
    await expect(page.getByRole('button', { name: 'Replay this deal', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('main')).toBeFocused();
  });
});

// Undo and Redo always step a whole phase (R-70, Q-01), so inside Composing and Place they hand
// focus to the new phase's target (focus-follow.ts followPhase); the same-phase recovery of a
// removed item is in focus-follow.test.ts and the pointer-edit specs above.
test.describe('Undo and Redo with a focused item', () => {
  test('Q-24 Composing: Undo with a free letter tile focused leaves the tray for the board; Redo returns to the first tile with the free letter kept', async ({
    page,
  }) => {
    await toComposing(page);
    await page.keyboard.press('8');
    await expect(tiles(page).last()).toBeFocused();
    await page.keyboard.press('z');
    await expect(tiles(page)).toHaveCount(0);
    await expect(lowest(page, 4)).toBeFocused();
    await page.keyboard.press('y');
    await expect(tiles(page)).toHaveCount(5);
    await expect(tiles(page).first()).toBeFocused();
  });

  test('Q-24 Place: after a strip reorder and a target change (not undo steps, Q-01) Undo focuses the first tile, Redo the first strip card with order and target kept', async ({
    page,
  }) => {
    await open(page, 'session-place-free-letter-two-cards');
    await strip(page).first().focus();
    const order = () =>
      strip(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id')));
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('4');
    const placed = await order();
    await expect(cell(page, 4)).toHaveClass(/target/);
    await page.keyboard.press('z');
    await expect(strip(page)).toHaveCount(0);
    await expect(tiles(page).first()).toBeFocused();
    await page.keyboard.press('y');
    await expect(strip(page).first()).toBeFocused();
    expect(await order()).toEqual(placed);
    await expect(cell(page, 4)).toHaveClass(/target/);
  });
});

test.describe('pointer drag and focus', () => {
  test('R-14 Q-24 a pointer drag on a column card makes no programmatic focus() call (the press focus is the browser own)', async ({
    page,
  }) => {
    await open(page, 'session-idle-fresh');
    await page.evaluate(() => {
      const w = window as unknown as { __focusCalls: string[] };
      w.__focusCalls = [];
      const native = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
        w.__focusCalls.push(this.getAttribute('data-card-id') ?? this.tagName);
        return native.call(this, options);
      };
    });
    const box = await lowest(page, 1).boundingBox();
    if (box === null) throw new Error('column 1 bottom card has no box');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 60, y - 60, { steps: 6 });
    await page.mouse.move(x + 80, 2, { steps: 8 });
    await page.mouse.up();
    await glidesSettled(page);
    expect(await phaseOf(page), 'the drag dropped nowhere').toBe('idle');
    expect(
      await page.evaluate(() => (window as unknown as { __focusCalls: string[] }).__focusCalls),
    ).toEqual([]);
  });
});

test.describe('Game over', () => {
  test('R-75 board keys do nothing in Game over, a column card is inert; Space and Enter on a non-empty WordCell open the view', async ({
    page,
  }) => {
    await open(page, 'session-gave-up', { endSheet: 'collapsed' });
    for (const key of ['1', '5', '8', '+', 'f']) await expectNoop(page, key);
    await lowest(page, 1).focus();
    await expectNoop(page, 'Space');
    await expectNoop(page, 'Enter');
    await expect(selection(page)).resolves.toBeNull();
  });

  test('R-75 Space and Enter on a non-empty WordCell in Game over open the sticky view', async ({
    page,
  }) => {
    await open(page, 'session-won', { endSheet: 'collapsed' });
    for (const key of ['Enter', 'Space']) {
      await cell(page, 7).focus();
      expect(await press(page, key)).toBe(true);
      await expect(sheet(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(sheet(page)).toHaveCount(0);
    }
  });
});
