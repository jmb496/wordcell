import { expect, type Page, test } from '@playwright/test';
import { sceneStageHeight } from '../src/ui/layout/geometry';
import { text } from '../src/ui/text';
import { openFixture } from './helpers/board';
import { onDesktop } from './helpers/project';

// Epic 8 (owner decision 2026-10-17; AD-11): at 1920 x 1080 every scene's figure and caption fit the
// How to play panel without scrolling, because each scene's stage is only as tall as it needs.

test.beforeEach(onDesktop);

const panel = (page: Page) => page.getByRole('dialog', { name: 'How to play', exact: true });
const OLD_WORST_CASE = { columnCards: 9, trayRows: 2, cellCards: 6 } as const;
const keys = ['moveCompose', 'freeLetter', 'place', 'sourceDrop', 'scoring'] as const;

test('AD-11 at 1920 x 1080 each scene’s caption is inside the panel without scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openFixture(page, 'session-idle-fresh');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await expect(panel(page)).toBeVisible();
  const heights: number[] = [];
  for (const [i, key] of keys.entries()) {
    await panel(page)
      .getByRole('button', { name: text.howTo.carousel.dot(i + 1, keys.length), exact: true })
      .click();
    const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[key] });
    await expect(figure).toBeVisible();
    const stage = await figure.locator('[data-scene-el="stage"]').boundingBox();
    const caption = await figure.locator('figcaption').boundingBox();
    const content = await panel(page).locator('.content').boundingBox();
    if (stage === null || caption === null || content === null) throw new Error('no box');
    const card = await figure.locator('.card').first().boundingBox();
    if (card === null) throw new Error('no card box');
    // Shorter than the old shared stage, which was sized for 9 column cards and 6 WordCell cards.
    expect(stage.height, key).toBeLessThan(sceneStageHeight(card.width, OLD_WORST_CASE));
    heights.push(stage.height);
    expect(caption.y + caption.height, key).toBeLessThanOrEqual(content.y + content.height);
    await expect(figure.locator('figcaption')).toBeInViewport({ ratio: 1 });
  }
  // The scenes differ in height (no shared worst case): the shortest is below the tallest.
  expect(Math.min(...heights)).toBeLessThan(Math.max(...heights));
});
