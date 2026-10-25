import { expect, test } from '@playwright/test';
import { END_SHEET, openFixture } from '../helpers/board';
import { running, watchAdded } from '../helpers/celebration';

test('AD-17 test hook is present in the test build: frozen, exposes loaded, current, dictionaryState and celebration', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  const hook = await page.evaluate(() => {
    const value = window.__wordcell;
    return value === undefined
      ? null
      : {
          frozen: Object.isFrozen(value),
          keys: Reflect.ownKeys(value).map(String).sort(),
          kind: value.current().kind,
          celebrationFrozen: Object.isFrozen(value.celebration),
          celebrationKeys: Reflect.ownKeys(value.celebration).map(String).sort(),
        };
  });
  expect(hook).toEqual({
    frozen: true,
    keys: ['celebration', 'current', 'dictionaryState', 'loaded'],
    kind: 'active',
    celebrationFrozen: true,
    celebrationKeys: ['advance', 'running', 'setEnabled'],
  });
});

// AD-17 Celebration seam: hook builds keep the celebration off until a test enables it, so a win
// takes today's open (session-won-words plus one Undo is the Place phase whose Confirm wins).
test('AD-17 the celebration seam is off by default in the test build: a win opens the sheet expanded, nothing runs and no celebration root is ever added', async ({
  page,
}) => {
  await openFixture(page, 'session-won-words', { steps: ['undo'] });
  const added = await watchAdded(page, '[data-celebration-root]');
  await page.getByTestId('primary-action').click();
  await expect(page.getByRole('dialog', { name: END_SHEET })).toBeVisible();
  expect(await running(page)).toBe(false);
  expect(await added()).toBe(false);
});
