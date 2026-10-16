import { expect, type Page, test } from '@playwright/test';
import { text } from '../src/ui/text';
import { openFixture } from './helpers/board';
import { wc } from './helpers/dialogs';
import { onAndroid } from './helpers/project';
import { select } from './helpers/selection';

// Epic 6 ticket 6.9 (SPEC CAP-8; AD-3, AD-13, AD-14): the How to play panel from the Menu's last row.
// Fixtures (seed 1): `session-idle-fresh`, `session-gave-up` (end sheet expanded).

test.beforeEach(onAndroid);

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const menu = (page: Page) => page.getByRole('dialog', { name: 'Menu', exact: true });
const panel = (page: Page) => page.getByRole('dialog', { name: 'How to play', exact: true });
const h = text.howTo.headings;

async function openPanel(page: Page): Promise<void> {
  await menuButton(page).click();
  await menu(page).getByRole('button', { name: 'How to play', exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await expect(menu(page)).toHaveCount(0);
}

const closers: readonly [string, (page: Page) => Promise<void>][] = [
  ['Esc', (page) => page.keyboard.press('Escape')],
  ['back', async (page) => void (await page.goBack())],
  [
    'the Close how to play control',
    (page) => panel(page).getByRole('button', { name: 'Close how to play', exact: true }).click(),
  ],
];

test('AD-3 the menu lists the six rows in order, then How to play opens the outline', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await menuButton(page).click();
  const rows = menu(page).locator('button.row');
  await expect(rows).toHaveText([
    'New game',
    'Replay this deal',
    'Give up',
    'Statistics',
    'Preferences',
    'How to play',
  ]);
  await rows.last().click();
  await expect(panel(page)).toBeVisible();
  const headings = panel(page).getByRole('heading');
  await expect(headings).toHaveText([text.howToPlay, ...Object.values(h)]);
  const example = panel(page).locator('section.example');
  for (const word of text.howTo.exampleWords) {
    await expect(example.getByText(text.howTo.exampleCaption(word), { exact: true })).toBeVisible();
  }
  for (const name of text.howTo.exampleWords.map(text.howTo.exampleCaption)) {
    expect(name).toMatch(/, [56] letters$/);
  }
  await expect(panel(page).locator('ul.bands li')).toHaveText(
    [0, 1, 2, 3, 4, 5].map((b) => `${text.bandName(b)}${text.bandScore(b)}`),
  );
  await expect(panel(page).locator('table')).toHaveCount(3);
  for (const caption of Object.values(text.howTo.controlCaptions)) {
    await expect(panel(page).locator('caption', { hasText: caption })).toHaveCount(1);
  }
  for (const sentence of text.howTo.undo) {
    await expect(panel(page).getByText(sentence, { exact: true })).toBeVisible();
  }
  await expect(panel(page).getByText(text.howTo.empty[0], { exact: true })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: /^(Cancel|Hint)/ })).toHaveCount(0);
});

for (const [name, close] of closers) {
  test(`AD-13 closing How to play by ${name} returns focus to the menu button, one history entry`, async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
    await close(page);
    await expect(panel(page)).toHaveCount(0);
    await expect(menuButton(page)).toBeFocused();
    await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
  });
}

test('AD-13 opening with a tail selected clears the selection; one back closes the panel', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await select(page, 1, 0);
  await openPanel(page);
  await expect(page.locator('[data-selection-outline]')).toHaveCount(0);
  await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(1);
  await page.goBack();
  await expect(panel(page)).toHaveCount(0);
  await expect.poll(() => wc(page).then((s) => s?.wc)).toBe(0);
});

test('AD-13 a reopened panel starts scrolled to the top', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const content = page.locator('.panel .content');
  await content.evaluate((el) => {
    el.scrollTop = 400;
  });
  expect(await content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await openPanel(page);
  await expect.poll(() => page.locator('.panel .content').evaluate((el) => el.scrollTop)).toBe(0);
});

test('AD-13 from Game over the panel closes with focus on the menu button and the end sheet expanded', async ({
  page,
}) => {
  await openFixture(page, 'session-gave-up', { endSheet: 'expanded' });
  await openPanel(page);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(menuButton(page)).toBeFocused();
  await expect(page.getByRole('button', { name: 'Collapse result', exact: true })).toBeVisible();
});

test('AD-14 at 360 px the page scrolls vertically only; the example cards are static, the 52 live cards stay one element each', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const content = page.locator('.panel .content');
  expect(await content.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await content.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const rowsFit = await panel(page)
    .locator('.word')
    .evaluateAll((els) => els.map((el) => el.scrollWidth <= el.clientWidth));
  expect(rowsFit).toEqual([true, true, true, true]);
  await expect(panel(page).locator('[data-card-id]')).toHaveCount(0);
  await expect(panel(page).locator('[data-testid^="card-"]')).toHaveCount(0);
  await expect(panel(page).locator('[data-mirror-of]')).toHaveCount(0);
  const cards = panel(page).locator('.word .card');
  await expect(cards).toHaveCount(22);
  await expect(cards.first()).toHaveAttribute('aria-hidden', 'true');
  expect(
    await cards.evaluateAll((els) => els.map((el) => getComputedStyle(el).touchAction)),
  ).toEqual(Array(22).fill('pan-y'));
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

// Epic 8 ticket 1 (HP-1, HP-2, HP-6): scene 1, the drag scene, above the text sections.
const scene = (page: Page) => panel(page).getByRole('figure', { name: text.howTo.scenes.drag });
const controls = text.howTo.sceneControls;

// The ids and WAAPI durations of the scene's running animations (the element carries data-scene-el).
const sceneAnimations = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => (a.effect as KeyframeEffect | null)?.target?.closest('figure'))
      .map((a) => ({
        id: a.id,
        playState: a.playState,
        duration: Number(a.effect?.getTiming().duration),
      })),
  );

test('R-10 R-20 R-23 AD-14 the scene plays on open, a tap pauses it and a tap restarts it from step 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect(scene(page)).toBeVisible();
  await expect(scene(page).getByText(text.howTo.scenes.drag, { exact: true })).toBeVisible();
  await expect(scene(page).getByRole('button', { name: controls.next })).toHaveCount(0);
  await expect
    .poll(async () => (await sceneAnimations(page)).map((a) => a.id))
    .toContain('drag-step-1');
  await scene(page).getByRole('button', { name: controls.pause, exact: true }).click();
  const paused = scene(page).getByRole('button', { name: controls.restart, exact: true });
  await expect(paused).toBeVisible();
  const frozen = await sceneAnimations(page);
  expect(frozen.length).toBeGreaterThan(0);
  expect(frozen.every((a) => a.playState === 'paused' || a.playState === 'finished')).toBe(true);
  await page.waitForTimeout(400);
  expect(await sceneAnimations(page)).toEqual(frozen);
  await paused.click();
  await expect(
    scene(page).getByRole('button', { name: controls.pause, exact: true }),
  ).toBeVisible();
  const ids = (await sceneAnimations(page)).map((a) => a.id);
  expect(ids).toContain('drag-step-0');
  expect(ids).not.toContain('drag-step-2');
  await expect
    .poll(async () => (await sceneAnimations(page)).map((a) => a.id))
    .toContain('drag-step-2');
});

test('R-10 AD-14 closed, the scene animates nothing; reopened, it starts again at step 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect.poll(async () => (await sceneAnimations(page)).length).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  expect(await sceneAnimations(page)).toEqual([]);
  await openPanel(page);
  await expect
    .poll(async () => (await sceneAnimations(page)).map((a) => a.id))
    .toContain('drag-step-0');
});

test('R-10 R-20 R-23 AD-14 with reduced motion the scene shows four frames on Next and Replay returns to the first', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect(scene(page)).toBeVisible();
  expect(await sceneAnimations(page)).toEqual([]);
  await expect(scene(page).getByRole('button', { name: controls.pause })).toHaveCount(0);
  await expect(scene(page).getByRole('button', { name: controls.restart })).toHaveCount(0);
  const tray = scene(page).locator('[data-scene-el="tray"]');
  const tail = scene(page).locator('[data-scene-el="tail"]');
  const transform = () => tail.evaluate((el) => (el as HTMLElement).style.transform);
  const frames: string[] = [await transform()];
  await expect(tray).toHaveCSS('opacity', '0');
  for (let i = 0; i < 2; i++) {
    await scene(page).getByRole('button', { name: controls.next, exact: true }).click();
    frames.push(await transform());
    await expect(tray).toHaveCSS('opacity', '0');
  }
  expect(new Set(frames).size).toBe(3);
  await scene(page).getByRole('button', { name: controls.next, exact: true }).click();
  await expect(tray).toHaveCSS('opacity', '1');
  await expect(tail).toHaveCSS('visibility', 'hidden');
  await expect(scene(page).getByRole('button', { name: controls.next })).toHaveCount(0);
  expect(await sceneAnimations(page)).toEqual([]);
  await scene(page).getByRole('button', { name: controls.replay, exact: true }).click();
  await expect(tray).toHaveCSS('opacity', '0');
  expect(await transform()).toBe(frames[0]);
  await expect(scene(page).getByRole('button', { name: controls.next, exact: true })).toBeVisible();
});

test('R-10 AD-10 Animation speed Slow runs a scene step longer than Fast', async ({
  page,
  context,
}) => {
  const stepMs = async (p: Page, prefs: string): Promise<number> => {
    await openFixture(p, 'session-idle-fresh', { prefs });
    await openPanel(p);
    await expect
      .poll(async () => (await sceneAnimations(p)).some((a) => a.id === 'drag-step-0'))
      .toBe(true);
    const step = (await sceneAnimations(p)).find((a) => a.id === 'drag-step-0');
    return step?.duration ?? 0;
  };
  const slow = await stepMs(page, 'prefs-non-default');
  const fastPage = await context.newPage();
  const fast = await stepMs(fastPage, 'prefs-fast');
  expect(fast).toBeGreaterThan(0);
  expect(slow).toBeGreaterThan(fast);
});

test('AD-9 a hidden page stops the scene and a visible one restarts it at step 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect
    .poll(async () => (await sceneAnimations(page)).map((a) => a.id))
    .toContain('drag-step-1');
  const setHidden = (hidden: boolean) =>
    page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => (h ? 'hidden' : 'visible'),
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  await setHidden(true);
  await expect.poll(async () => (await sceneAnimations(page)).length).toBe(0);
  await page.waitForTimeout(400);
  expect(await sceneAnimations(page)).toEqual([]);
  await setHidden(false);
  await expect
    .poll(async () => (await sceneAnimations(page)).map((a) => a.id))
    .toContain('drag-step-0');
});
