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

// Epic 8 ticket 6 (HP-1, HP-6; EXPERIENCE.md How to play panel: "Left and Right keys on the
// carousel do the same as the arrows"): the carousel by keyboard alone.
const carousel = text.howTo.carousel;
const controls = text.howTo.sceneControls;
const figure = (page: Page) => panel(page).getByRole('figure');
const arrow = (page: Page, which: 'previous' | 'next') =>
  panel(page).getByRole('button', { name: carousel[which], exact: true });
const dotOf = (page: Page, n: number) =>
  panel(page).getByRole('button', { name: carousel.dot(n, keys.length), exact: true });

async function expectScene(page: Page, n: number): Promise<void> {
  await expect(figure(page)).toHaveAccessibleName(text.howTo.scenes[keys[n - 1]]);
  await expect(dotOf(page, n)).toHaveAttribute('aria-current', 'true');
  await expect(panel(page).locator('[aria-current="true"]')).toHaveCount(1);
}

async function openByKeyboard(page: Page): Promise<void> {
  await openFixture(page, 'session-idle-fresh');
  await page.keyboard.press('?');
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole('heading', { name: text.howToPlay })).toBeFocused();
}

test('HP-1 HP-6 Tab walks the previous arrow, the five dots, the next arrow, then the scene pause control', async ({
  page,
}) => {
  await openByKeyboard(page);
  const order = [
    arrow(page, 'previous'),
    ...keys.map((_, i) => dotOf(page, i + 1)),
    arrow(page, 'next'),
    figure(page).getByRole('button', { name: controls.pause, exact: true }),
  ];
  for (const control of order) {
    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();
  }
  await expectScene(page, 1);
});

test('HP-1 Enter and Space activate an arrow and the pause control; Left and Right move scenes, stop at the ends with focus kept, ignore modifiers', async ({
  page,
}) => {
  await openByKeyboard(page);
  // Previous arrow, five dots, next arrow.
  for (let i = 0; i < 7; i++) await page.keyboard.press('Tab');
  await expect(arrow(page, 'next')).toBeFocused();
  await page.keyboard.press('Enter');
  await expectScene(page, 2);
  await page.keyboard.press('Space');
  await expectScene(page, 3);
  await expect(arrow(page, 'next')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expectScene(page, 4);
  await page.keyboard.press('ArrowRight');
  await expectScene(page, 5);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expectScene(page, 5);
  await expect(arrow(page, 'next')).toBeFocused();
  for (const key of ['Shift+ArrowLeft', 'Control+ArrowLeft']) {
    await page.keyboard.press(key);
    await expectScene(page, 5);
  }
  for (let n = 4; n >= 1; n--) {
    await page.keyboard.press('ArrowLeft');
    await expectScene(page, n);
  }
  await page.keyboard.press('ArrowLeft');
  await expectScene(page, 1);
  await expect(arrow(page, 'next')).toBeFocused();
  for (const key of ['Shift+ArrowRight', 'Control+ArrowRight']) {
    await page.keyboard.press(key);
    await expectScene(page, 1);
  }
  // The scene's pause control: Enter pauses, Space restarts, focus stays on it.
  await page.keyboard.press('Tab');
  const tap = figure(page).locator('button.tap');
  await expect(tap).toBeFocused();
  await expect(tap).toHaveAccessibleName(controls.pause);
  await page.keyboard.press('Enter');
  await expect(tap).toHaveAccessibleName(controls.restart);
  await expect(tap).toBeFocused();
  await page.keyboard.press('Space');
  await expect(tap).toHaveAccessibleName(controls.pause);
  await expect(tap).toBeFocused();
  await expectScene(page, 1);
  // Shift+Tab back to the previous arrow: Enter at the start is a no-op that keeps focus.
  for (let i = 0; i < 7; i++) await page.keyboard.press('Shift+Tab');
  await expect(arrow(page, 'previous')).toBeFocused();
  await page.keyboard.press('Enter');
  await expectScene(page, 1);
  await expect(arrow(page, 'previous')).toBeFocused();
});

test('HP-1 Right with focus outside the carousel (the Close control) does not change the scene', async ({
  page,
}) => {
  await openByKeyboard(page);
  await page.keyboard.press('Shift+Tab');
  const close = panel(page).getByRole('button', { name: text.closeHowToPlay, exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expectScene(page, 1);
  await expect(close).toBeFocused();
  // The same key inside the carousel moves on.
  await page.keyboard.press('Tab');
  await expect(arrow(page, 'previous')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expectScene(page, 2);
});
