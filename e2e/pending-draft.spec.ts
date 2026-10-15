import { expect, type Page, test } from '@playwright/test';
import { cards, centre, glidesSettled, openFixture } from './helpers/board';
import { waitForDictionary } from './helpers/restore';
import { touchDrag } from './helpers/touch';

// Story pending-draft-line (Flow 3, R-72, Q-41, A-E13): the Idle tray line naming what Redo brings
// back. Setup: session-place is TAN in Place (seed 1, cell 3); two Undos leave Idle with the pending
// draft TAN (the same Session as session-idle-pending-draft). session-idle-pending-draft-long holds
// the 10-letter word VIMLDXOMIW after two Undos. The discard test composes TAW from the dealt
// board (seed 1): a 2-card tail of column 3 (T, A) dropped on column 1 with k = 1, Flip, Validate.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'pending-draft line runs on android');
});

const LINE = 'Undone: TAN · Redo brings it back';
const tray = (page: Page) => page.locator('[data-band="tray"]');
const line = (page: Page) => tray(page).locator('.pending');

test('R-72 session-place + Undo x2 shows the line, a reload keeps it, Redo removes it', async ({
  page,
}) => {
  await openFixture(page, 'session-place');
  await expect(line(page)).toHaveCount(0);
  // Place -> Composing -> Idle: the second Undo leaves the pending draft.
  await page.getByTestId('undo').click();
  await glidesSettled(page);
  await expect(line(page)).toHaveCount(0);
  await page.getByTestId('undo').click();
  await glidesSettled(page);
  await expect(line(page)).toHaveText(LINE);
  await page.reload();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(line(page)).toHaveText(LINE);
  for (const _ of [1, 2]) {
    await page.getByTestId('redo').click();
    await glidesSettled(page);
  }
  await expect(line(page)).toHaveCount(0);
});

test('R-72 a new edit from Idle discards the old tail: the line names the NEW word after Undo x2, and is absent after a commit', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-pending-draft');
  await waitForDictionary(page, 'ready');
  await expect(line(page)).toHaveText(LINE);
  const from = await centre(cards(page, 3).nth(-2));
  const to = await centre(cards(page, 1).last());
  await touchDrag(page, from, to);
  await expect(line(page)).toHaveCount(0);
  await expect(page.getByTestId('redo')).toBeDisabled();
  await tray(page).getByRole('button', { name: 'Flip', exact: true }).click();
  await expect(tray(page).locator('.word-text')).toHaveText('TAW');
  await page.getByTestId('primary-action').click();
  await expect(page.getByTestId('primary-action')).toHaveText('Confirm');
  await expect(line(page)).toHaveCount(0);
  await page.getByTestId('undo').click();
  await glidesSettled(page);
  await expect(line(page)).toHaveCount(0);
  await page.getByTestId('undo').click();
  await glidesSettled(page);
  await expect(line(page)).toHaveText('Undone: TAW \u00b7 Redo brings it back');
  for (const _ of [1, 2]) {
    await page.getByTestId('redo').click();
    await glidesSettled(page);
  }
  await page.getByTestId('primary-action').click();
  await glidesSettled(page);
  await expect(line(page)).toHaveCount(0);
});

test('R-72 the word span ellipsizes, the line is static text without a live region', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-pending-draft');
  const styles = await tray(page)
    .locator('.pending-word')
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { whiteSpace: s.whiteSpace, textOverflow: s.textOverflow, overflow: s.overflowX };
    });
  expect(styles).toEqual({ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' });
  await expect(tray(page).locator('[aria-live], [role="status"]')).toHaveCount(0);
});

test('R-72 a 10-letter pending word at 360 px stays on one row with the full suffix', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-pending-draft-long');
  await expect(line(page)).toHaveText('Undone: VIMLDXOMIW · Redo brings it back');
  const fit = await line(page).evaluate((el) => {
    const word = el.querySelector('.pending-word') as HTMLElement;
    const suffix = el.querySelector('.pending-suffix') as HTMLElement;
    const r = suffix.getBoundingClientRect();
    const p = el.getBoundingClientRect();
    const band = el.closest('[data-band="tray"]') as HTMLElement;
    return {
      overflow: el.scrollWidth <= el.clientWidth,
      bandOverflow: band.scrollWidth <= band.clientWidth,
      suffixInside: r.right <= p.right + 0.5 && r.width >= suffix.scrollWidth - 0.5,
      oneRow:
        word.getBoundingClientRect().top === r.top && word.getBoundingClientRect().height <= 20,
      whiteSpace: getComputedStyle(suffix).whiteSpace,
      gap: (() => {
        const node = suffix.firstChild as Text;
        const range = document.createRange();
        const at = (node.textContent ?? '').indexOf('·');
        range.setStart(node, at);
        range.setEnd(node, at + 1);
        return range.getBoundingClientRect().left - word.getBoundingClientRect().right;
      })(),
    };
  });
  expect(fit.whiteSpace).toBe('pre');
  expect(fit.gap).toBeGreaterThanOrEqual(6);
  expect({ ...fit, gap: 0, whiteSpace: '' }).toEqual({
    overflow: true,
    bandOverflow: true,
    suffixInside: true,
    oneRow: true,
    whiteSpace: '',
    gap: 0,
  });
});
