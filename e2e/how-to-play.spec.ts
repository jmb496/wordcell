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
// Epic 8 ticket 6: the scenes in carousel order, by their text.ts keys; the panel shows one at a time.
const sceneOrder = [
  'drag',
  'compose',
  'destination',
  'place',
  'scoring',
  'sourceDrop',
  'destinationRule',
  'topCard',
] as const;
type SceneKey = (typeof sceneOrder)[number];
const carousel = text.howTo.carousel;
const dotOf = (page: Page, n: number) =>
  panel(page).getByRole('button', { name: carousel.dot(n, sceneOrder.length), exact: true });
const arrow = (page: Page, which: 'previous' | 'next') =>
  panel(page).getByRole('button', { name: carousel[which], exact: true });
const root = (page: Page) => panel(page).getByRole('group', { name: carousel.label, exact: true });

/** Jumps to a scene by its dot and returns its figure (the only one mounted). */
async function showScene(page: Page, id: SceneKey) {
  await dotOf(page, sceneOrder.indexOf(id) + 1).click();
  const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[id] });
  await expect(figure).toBeVisible();
  return figure;
}

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
  expect(Object.values(h)).toHaveLength(6);
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

test('AD-14 at 360 px the page scrolls vertically only; the scenes carry no card ids, the 52 live cards stay one element each', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const content = page.locator('.panel .content');
  expect(await content.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await content.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(panel(page).locator('[data-card-id]')).toHaveCount(0);
  await expect(panel(page).locator('[data-testid^="card-"]')).toHaveCount(0);
  await expect(panel(page).locator('[data-mirror-of]')).toHaveCount(0);
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

// Only the drag scene's animations (ids `drag-...`): the other scenes keep playing meanwhile.
const dragAnimations = async (page: Page) =>
  (await sceneAnimations(page)).filter((a) => a.id.startsWith('drag-'));

test('R-10 R-20 R-23 AD-14 the scene plays on open, a tap pauses it and a tap restarts it from step 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect(scene(page)).toBeVisible();
  await expect(scene(page).getByText(text.howTo.scenes.drag, { exact: true })).toBeVisible();
  await expect(scene(page).getByRole('button', { name: controls.next })).toHaveCount(0);
  await expect
    .poll(async () => (await dragAnimations(page)).map((a) => a.id))
    .toContain('drag-step-1');
  await scene(page).getByRole('button', { name: controls.pause, exact: true }).click();
  const paused = scene(page).getByRole('button', { name: controls.restart, exact: true });
  await expect(paused).toBeVisible();
  const frozen = await dragAnimations(page);
  expect(frozen.length).toBeGreaterThan(0);
  expect(frozen.every((a) => a.playState === 'paused' || a.playState === 'finished')).toBe(true);
  await page.waitForTimeout(400);
  expect(await dragAnimations(page)).toEqual(frozen);
  await paused.click();
  await expect(
    scene(page).getByRole('button', { name: controls.pause, exact: true }),
  ).toBeVisible();
  const ids = (await dragAnimations(page)).map((a) => a.id);
  expect(ids).toContain('drag-step-0');
  expect(ids).not.toContain('drag-step-2');
  await expect
    .poll(async () => (await dragAnimations(page)).map((a) => a.id))
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

// Epic 8 ticket 2 (HP-3b, HP-3c, HP-2): scenes 2 and 3 stepped to their last frame under reduced
// motion; per frame the open tray layer, its tiles, k's side, Validate and WordCell 6 are asserted.
const stepScenes = [
  {
    id: 'compose' as const,
    rules: 'R-23 R-33 R-38',
    // Per frame: the open layer's tiles (undefined: no tray), Validate class, cell 6 covered.
    frames: [
      { tiles: undefined, validate: undefined, used: false, k: 0, side: 'left' },
      { tiles: undefined, validate: undefined, used: false, k: 0, side: 'left' },
      { tiles: 'BEDKA', validate: 'lit', used: false, k: 1, side: 'left' },
      { tiles: 'BAKED', validate: 'lit', used: false, k: 1, side: 'left' },
      { tiles: 'BALKED', validate: 'lit', used: true, k: 1, side: 'left' },
      { tiles: 'BALKED', validate: 'pressed', used: true, k: 1, side: 'left' },
    ],
  },
  {
    id: 'destination' as const,
    rules: 'R-30 R-31 R-32',
    frames: [
      { tiles: undefined, validate: undefined, used: false, k: 0, side: 'left' },
      { tiles: 'APE', validate: 'lit', used: false, k: 1, side: 'left' },
      { tiles: 'TAPE', validate: 'lit', used: false, k: 2, side: 'left' },
      { tiles: 'STAPE', validate: 'lit', used: false, k: 3, side: 'left' },
      { tiles: 'PEATS', validate: 'lit', used: false, k: 3, side: 'right' },
    ],
  },
];

for (const { id, rules, frames } of stepScenes) {
  test(`${rules} AD-14 with reduced motion scene ${id} steps through ${frames.length} frames to its last`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    await expect(figure.getByText(text.howTo.scenes[id], { exact: true })).toBeVisible();
    expect(await sceneAnimations(page)).toEqual([]);
    for (const [i, frame] of frames.entries()) {
      const layer = figure.locator('[data-scene-el^="tray-"]');
      if (frame.tiles === undefined) {
        for (const el of await layer.all()) await expect(el).toHaveCSS('opacity', '0');
      } else {
        const open = figure.locator(`[data-scene-el="tray-${i}"]`);
        await expect(open).toHaveCSS('opacity', '1');
        await expect(open.locator('.tiles .card')).toHaveText(frame.tiles.split(''));
        await expect(open.locator('.validate')).toHaveClass(new RegExp(frame.validate ?? ''));
        await expect(open.locator('.cell6.used')).toHaveCount(frame.used ? 1 : 0);
        const n = frame.tiles.length;
        const locked = frame.side === 'left' ? [0, frame.k] : [n - frame.k, n];
        const marked = await open
          .locator('.tiles .card')
          .evaluateAll((els) => els.map((el, j) => el.classList.contains('destination') && j));
        expect(marked.filter((j) => j !== false)).toStrictEqual(
          Array.from({ length: frame.k }, (_, j) => locked[0] + j),
        );
        await expect(layer.and(figure.locator('[style*="opacity: 1"]'))).toHaveCount(1);
      }
      if (i < frames.length - 1)
        await figure.getByRole('button', { name: controls.next, exact: true }).click();
    }
    await expect(figure.getByRole('button', { name: controls.next })).toHaveCount(0);
    await figure.getByRole('button', { name: controls.replay, exact: true }).click();
    await expect(figure.getByRole('button', { name: controls.next, exact: true })).toBeVisible();
  });

  test(`${rules} AD-14 scene ${id} plays on open through its last step`, async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    await expect(figure.getByRole('button', { name: controls.pause, exact: true })).toBeVisible();
    const lastStep = frames.filter((f) => f.tiles !== undefined).length + 2;
    await expect
      .poll(async () => (await sceneAnimations(page)).map((a) => a.id), { timeout: 20_000 })
      .toContain(`${id}-step-${lastStep}`);
  });
}

// Epic 8 ticket 3 (HP-3d, HP-3e, HP-2): scenes 4 (place) and 5 (scoring) stepped to their last
// frame under reduced motion; per frame the open layer, the strip, the lit cells and the figures.
test('R-40 R-42 R-50 R-51 R-52 R-60 AD-14 with reduced motion scene place steps through 6 frames to its last', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'place');
  expect(await sceneAnimations(page)).toEqual([]);
  // Per frame: strip letters (undefined: none), lit cells, the selected WordCell number, cell 6's cards.
  const frames = [
    { strip: undefined, lit: [], target: undefined, cell6: 'L', button: text.validate },
    { strip: 'BALKED', lit: [3, 4, 5], target: 6, cell6: 'L', button: text.confirm },
    { strip: 'BALKED', lit: [3, 4, 6], target: 5, cell6: 'L', button: text.confirm },
    { strip: 'BALKED', lit: [3, 4, 5], target: 6, cell6: 'L', button: text.confirm },
    { strip: 'DBALKE', lit: [3, 4, 5], target: 6, cell6: 'L', button: text.confirm },
    { strip: undefined, lit: [], target: undefined, cell6: 'DBALKE', button: undefined },
  ];
  for (const [i, frame] of frames.entries()) {
    const layer = figure.locator(`[data-scene-el="place-${i}"]`);
    await expect(layer).toHaveCSS('opacity', '1');
    await expect(figure.locator('[data-scene-el^="place-"][style*="opacity: 1"]')).toHaveCount(1);
    if (frame.strip === undefined) await expect(layer.locator('.tiles')).toHaveCount(0);
    else await expect(layer.locator('.tiles .card')).toHaveText(frame.strip.split(''));
    // The WordCell numbers of the lit stacks and of the selected one (R-40 R-42).
    const cellNumbers = async (selector: string): Promise<number[]> =>
      (await layer.locator(`.wcell:has(${selector}) .num`).allTextContents()).map(Number);
    expect(await cellNumbers('.stack.lit')).toEqual(frame.lit);
    expect(await cellNumbers('.stack.target')).toEqual(
      frame.target === undefined ? [] : [frame.target],
    );
    await expect(
      layer.locator('.wcell', { has: page.locator('.num', { hasText: /^6$/ }) }).locator('.card'),
    ).toHaveText(frame.cell6.split(''));
    if (frame.button !== undefined) await expect(layer.locator('.ctl')).toHaveText(frame.button);
    else await expect(layer.locator('.ctl')).toHaveCount(0);
    if (i < frames.length - 1)
      await figure.getByRole('button', { name: controls.next, exact: true }).click();
  }
  await expect(figure.getByRole('button', { name: controls.next })).toHaveCount(0);
  await figure.getByRole('button', { name: controls.replay, exact: true }).click();
  await expect(figure.getByRole('button', { name: controls.next, exact: true })).toBeVisible();
});

test('R-80 R-36 AD-14 with reduced motion scene scoring steps through 5 frames to the total', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'scoring');
  expect(await sceneAnimations(page)).toEqual([]);
  const figures = ['3 × 3 = 9', '4 × 4 = 16', '6 × 6 = 36'];
  for (let i = 0; i < 5; i++) {
    for (const [k, label] of figures.entries())
      await expect(figure.getByText(label, { exact: true })).toHaveCSS(
        'opacity',
        i > k ? '1' : '0',
      );
    await expect(figure.getByText(text.score(61), { exact: true })).toHaveCSS(
      'opacity',
      i === 4 ? '1' : '0',
    );
    if (i < 4) await figure.getByRole('button', { name: controls.next, exact: true }).click();
  }
  await expect(figure.getByRole('button', { name: controls.next })).toHaveCount(0);
  await figure.getByRole('button', { name: controls.replay, exact: true }).click();
  await expect(figure.getByRole('button', { name: controls.next, exact: true })).toBeVisible();
});

for (const [id, rules, lastStep] of [
  ['place', 'R-40 R-42 R-51', 6],
  ['scoring', 'R-80 R-36', 3],
] as const) {
  test(`${rules} AD-14 scene ${id} plays on open through its last step`, async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    await expect(figure.getByRole('button', { name: controls.pause, exact: true })).toBeVisible();
    await expect
      .poll(async () => (await sceneAnimations(page)).map((a) => a.id), { timeout: 30_000 })
      .toContain(`${id}-step-${lastStep}`);
  });
}

// Epic 8 ticket 4 (HP-4, HP-2, HP-6): the Tricky rules scenes follow the five basic ones in the carousel
// (ticket 6 removes the stacked list and its heading). Captions are looked up by their text.ts key.
// Epic 8 ticket 5 (HP-1): a tap pauses scenes 2 to 5 and a second tap restarts them from step 0.
for (const id of ['compose', 'destination', 'place', 'scoring'] as const) {
  test(`R-10 AD-14 a tap on scene ${id} pauses it and a second tap restarts it from step 0`, async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    const mine = async () =>
      (await sceneAnimations(page)).filter((a) => a.id.startsWith(`${id}-step-`));
    await expect.poll(async () => (await mine()).map((a) => a.id)).toContain(`${id}-step-1`);
    await figure.getByRole('button', { name: controls.pause, exact: true }).click();
    const paused = figure.getByRole('button', { name: controls.restart, exact: true });
    await expect(paused).toBeVisible();
    const frozen = await mine();
    expect(frozen.length).toBeGreaterThan(0);
    expect(frozen.every((a) => a.playState === 'paused' || a.playState === 'finished')).toBe(true);
    await page.waitForTimeout(400);
    expect(await mine()).toEqual(frozen);
    await paused.click();
    await expect(figure.getByRole('button', { name: controls.pause, exact: true })).toBeVisible();
    const ids = (await mine()).map((a) => a.id);
    expect(ids).toContain(`${id}-step-0`);
    expect(ids).not.toContain(`${id}-step-2`);
    await expect
      .poll(async () => (await mine()).map((a) => a.id), { timeout: 30_000 })
      .toContain(`${id}-step-2`);
  });
}

const trickyScenes = [
  {
    id: 'sourceDrop' as const,
    rules: 'R-21 R-13 Q-11',
    scene: 'source-drop',
    lastStep: 5,
    // Per frame: the open layer's tiles, Validate class, the cells dimmed in that layer.
    frames: [
      { dest: undefined, tiles: undefined, validate: undefined, used: [] },
      { dest: undefined, tiles: undefined, validate: undefined, used: [] },
      { dest: 'gone', tiles: 'FEDKA', validate: 'lit', used: [] },
      { dest: 'gone', tiles: 'FAKED', validate: 'lit', used: [] },
    ],
  },
  {
    id: 'destinationRule' as const,
    rules: 'R-13 R-22 R-31',
    scene: 'destination-rule',
    lastStep: 10,
    frames: [
      { dest: undefined, tiles: undefined, validate: undefined, used: [] },
      { dest: undefined, tiles: undefined, validate: undefined, used: [] },
      { dest: 'gone', tiles: 'BAT', validate: 'lit', used: [] },
      { dest: undefined, tiles: undefined, validate: undefined, used: [] },
      { dest: 'lifted', tiles: undefined, validate: undefined, used: [] },
      { dest: 'gone', tiles: 'B', validate: 'off', used: [] },
      { dest: 'gone', tiles: 'BA', validate: 'off', used: [3] },
      { dest: 'gone', tiles: 'BAT', validate: 'lit', used: [3, 4] },
    ],
  },
  {
    id: 'topCard' as const,
    rules: 'R-33',
    scene: 'top-card',
    lastStep: 5,
    frames: [
      { dest: undefined, tiles: undefined, validate: undefined, used: [] },
      { dest: undefined, tiles: undefined, validate: undefined, used: [] },
      { dest: 'gone', tiles: 'AT', validate: 'off', used: [] },
      { dest: 'gone', tiles: 'SAT', validate: 'lit', used: [5] },
    ],
  },
];

for (const { id, rules, frames } of trickyScenes) {
  test(`${rules} AD-14 with reduced motion scene ${id} steps through ${frames.length} frames to its last, caption equal to text.ts`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    await expect(figure.locator('figcaption')).toHaveText(text.howTo.scenes[id]);
    expect(await sceneAnimations(page)).toEqual([]);
    for (const [i, frame] of frames.entries()) {
      const layers = figure.locator('[data-scene-el^="tray-"]');
      if (frame.tiles === undefined) {
        for (const el of await layers.all()) await expect(el).toHaveCSS('opacity', '0');
      } else {
        const open = figure.locator(`[data-scene-el="tray-${i}"]`);
        await expect(open).toHaveCSS('opacity', '1');
        await expect(open.locator('.tiles .card')).toHaveText(frame.tiles.split(''));
        await expect(open.locator('.validate')).toHaveClass(
          new RegExp(`(^|\\s)${frame.validate}(\\s|$)`),
        );
        const dimmed = await open
          .locator('.cell.used')
          .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-cell'))));
        expect(dimmed).toStrictEqual(frame.used);
        await expect(layers.and(figure.locator('[style*="opacity: 1"]'))).toHaveCount(1);
      }
      // Scene.svelte destState: `gone` hides the D block (it is in the tray), `lifted` shows it.
      const dest = figure.locator('[data-scene-el="dest"]');
      if (frame.dest === 'gone') await expect(dest).toHaveCSS('visibility', 'hidden');
      else await expect(dest).toHaveCSS('visibility', 'visible');
      if (i < frames.length - 1)
        await figure.getByRole('button', { name: controls.next, exact: true }).click();
    }
    await expect(figure.getByRole('button', { name: controls.next })).toHaveCount(0);
    await figure.getByRole('button', { name: controls.replay, exact: true }).click();
    await expect(figure.getByRole('button', { name: controls.next, exact: true })).toBeVisible();
    // Frame 0 is the start again: no layer shown, tail and D block back at home.
    await expect(figure.locator('[data-scene-el="dest"]')).toHaveCSS('visibility', 'visible');
    await expect(figure.locator('[data-scene-el="tail"]')).toHaveCSS('visibility', 'visible');
    for (const el of await figure.locator('[data-scene-el^="tray-"]').all())
      await expect(el).toHaveCSS('opacity', '0');
  });

  test(`${rules} AD-14 scene ${id} plays on open through its last step; a tap pauses and a tap restarts`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const row = trickyScenes.find((t) => t.id === id);
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    const prefix = `${row?.scene}-step-`;
    await expect(figure.getByRole('button', { name: controls.pause, exact: true })).toBeVisible();
    await expect
      .poll(async () => (await sceneAnimations(page)).map((a) => a.id), { timeout: 60_000 })
      .toContain(`${prefix}${row?.lastStep}`);
    await figure.getByRole('button', { name: controls.pause, exact: true }).click();
    const paused = figure.getByRole('button', { name: controls.restart, exact: true });
    await expect(paused).toBeVisible();
    await paused.click();
    await expect(figure.getByRole('button', { name: controls.pause, exact: true })).toBeVisible();
    await expect
      .poll(async () => (await sceneAnimations(page)).map((a) => a.id))
      .toContain(`${prefix}0`);
  });
}

// Epic 8 ticket 6 (HP-1, HP-2, HP-6; AD-11): the scene carousel and the fitted whole-play-area stage.
const sceneIds = [
  'drag',
  'compose',
  'destination',
  'place',
  'scoring',
  'source-drop',
  'destination-rule',
  'top-card',
] as const;
const current = (page: Page) => panel(page).getByRole('figure');
const stepIds = async (page: Page) => (await sceneAnimations(page)).map((a) => a.id);
/** Remembers the live animations so a later check can tell whether the scene was re-entered. */
const markLive = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { live: Animation[] }).live = document.getAnimations();
  });
/** Whether any animation remembered by `markLive` was cancelled since (the scene re-entered). */
const reEntered = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { live: Animation[] }).live.some((a) => a.playState === 'idle'),
  );

test('HP-1 HP-6 the panel mounts one playing scene figure, the arrows and eight dots named exactly', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect(current(page)).toHaveCount(1);
  await expect(root(page)).toBeVisible();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.drag);
  await expect.poll(() => stepIds(page)).toContain('drag-step-1');
  expect(carousel.previous).toBe('Previous scene');
  expect(carousel.next).toBe('Next scene');
  for (let n = 1; n <= sceneOrder.length; n++) {
    await expect(dotOf(page, n)).toBeVisible();
    if (n === 1) await expect(dotOf(page, n)).toHaveAttribute('aria-current', 'true');
    else await expect(dotOf(page, n)).not.toHaveAttribute('aria-current', 'true');
  }
  await expect(panel(page).locator('[aria-current="true"]')).toHaveCount(1);
  await expect(arrow(page, 'previous')).toHaveAttribute('aria-disabled', 'true');
  await expect(arrow(page, 'next')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(panel(page).locator('[aria-live]')).toHaveCount(0);
  await expect(panel(page).locator('h3', { hasText: 'Tricky rules' })).toHaveCount(0);
  await expect(panel(page).locator('a, [role="link"], [href]')).toHaveCount(0);
});

test('HP-1 the arrows walk all eight scenes in order, one figure at a time, only the current scene animating', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  for (const [i, key] of sceneOrder.entries()) {
    await expect(current(page)).toHaveCount(1);
    await expect(current(page)).toHaveAccessibleName(text.howTo.scenes[key]);
    await expect(current(page).locator('figcaption')).toHaveText(text.howTo.scenes[key]);
    await expect(dotOf(page, i + 1)).toHaveAttribute('aria-current', 'true');
    await expect(panel(page).locator('[aria-current="true"]')).toHaveCount(1);
    await expect.poll(async () => (await stepIds(page)).length > 0).toBe(true);
    expect((await stepIds(page)).every((id) => id.startsWith(`${sceneIds[i]}-step-`))).toBe(true);
    if (i < sceneOrder.length - 1) {
      await arrow(page, 'next').click();
      await expect(arrow(page, 'next')).toBeFocused();
    }
  }
  await expect(arrow(page, 'next')).toHaveAttribute('aria-disabled', 'true');
  await expect(arrow(page, 'previous')).not.toHaveAttribute('aria-disabled', 'true');
  for (let i = sceneOrder.length - 2; i >= 0; i--) {
    await arrow(page, 'previous').click();
    await expect(arrow(page, 'previous')).toBeFocused();
    await expect(current(page)).toHaveAccessibleName(text.howTo.scenes[sceneOrder[i]]);
  }
});

test('HP-1 a disabled end is a no-op that keeps focus; a dot jumps to its scene and keeps focus', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  // aria-disabled is not the disabled attribute: the button stays focusable and clickable (forced
  // here because Playwright treats aria-disabled as not enabled), and the click does nothing.
  await arrow(page, 'previous').focus();
  await arrow(page, 'previous').click({ force: true });
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.drag);
  await expect(arrow(page, 'previous')).toBeFocused();
  await dotOf(page, 8).click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.topCard);
  await expect(dotOf(page, 8)).toBeFocused();
  await expect(dotOf(page, 8)).toHaveAttribute('aria-current', 'true');
  await arrow(page, 'next').focus();
  await arrow(page, 'next').click({ force: true });
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.topCard);
  await expect(arrow(page, 'next')).toBeFocused();
  await dotOf(page, 3).click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.destination);
  await expect(dotOf(page, 3)).toBeFocused();
});

test('HP-1 Left and Right move between scenes while focus is in the carousel, stop at the ends, and are ignored outside it', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await arrow(page, 'next').click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.compose);
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.destination);
  await expect(arrow(page, 'next')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.drag);
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.drag);
  await dotOf(page, 8).click();
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.topCard);
  // A modified key is ignored.
  await page.keyboard.press('Shift+ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.topCard);
  // Outside the carousel (the Close control) the keys do nothing.
  await panel(page).getByRole('button', { name: 'Close how to play', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.topCard);
  // Inside a scene (its pause control) they act.
  await current(page).getByRole('button', { name: controls.pause, exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.destinationRule);
  await expect(root(page)).toBeFocused();
});

test('HP-1 a newly shown scene starts at step 1 and a tap on the current dot does nothing; reopening resets to scene 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect.poll(() => stepIds(page)).toContain('drag-step-1');
  await markLive(page);
  await dotOf(page, 1).click();
  expect(await reEntered(page)).toBe(false);
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.drag);
  await dotOf(page, 4).click();
  const ids = await stepIds(page);
  expect(ids).toContain('place-step-0');
  expect(ids).not.toContain('place-step-2');
  expect(ids.every((id) => id.startsWith('place-'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await openPanel(page);
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.drag);
  await expect(dotOf(page, 1)).toHaveAttribute('aria-current', 'true');
  await expect.poll(() => stepIds(page)).toContain('drag-step-0');
});

test('HP-1 a tap pauses and restarts the carousel scene', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await arrow(page, 'next').click();
  await expect.poll(() => stepIds(page)).toContain('compose-step-1');
  await current(page).getByRole('button', { name: controls.pause, exact: true }).click();
  const paused = current(page).getByRole('button', { name: controls.restart, exact: true });
  await expect(paused).toBeVisible();
  await paused.click();
  await expect(
    current(page).getByRole('button', { name: controls.pause, exact: true }),
  ).toBeVisible();
  expect(await stepIds(page)).toContain('compose-step-0');
});

test('HP-1 closed, the carousel keeps no scene and no animation; rapid switching leaves only the current scene animating', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  for (let i = 0; i < 7; i++) await arrow(page, 'next').click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.topCard);
  await expect.poll(() => stepIds(page)).toContain('top-card-step-0');
  expect((await stepIds(page)).every((id) => id.startsWith('top-card-'))).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              !a.id.startsWith('top-card-') &&
              (a.effect as KeyframeEffect | null)?.target?.closest('figure'),
          ).length,
    ),
  ).toBe(0);
  await page.keyboard.press('Escape');
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => (a.effect as KeyframeEffect | null)?.target?.closest('[role="group"]'))
          .length,
    ),
  ).toBe(0);
  await expect(panel(page)).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('HP-2 with reduced motion Next steps to Replay and Replay returns to Next, each taking focus; a scene change resets the frame', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const next = () => current(page).getByRole('button', { name: controls.next, exact: true });
  const replay = () => current(page).getByRole('button', { name: controls.replay, exact: true });
  const tray = () => current(page).locator('[data-scene-el="tray"]');
  await next().click();
  await expect(next()).toBeFocused();
  await next().click();
  await next().click();
  await expect(replay()).toBeFocused();
  await expect(tray()).toHaveCSS('opacity', '1');
  await replay().click();
  await expect(next()).toBeFocused();
  await expect(tray()).toHaveCSS('opacity', '0');
  for (let i = 0; i < 3; i++) await next().click();
  await expect(replay()).toBeVisible();
  await arrow(page, 'next').click();
  await expect(next()).toBeVisible();
  await expect(arrow(page, 'next')).toBeFocused();
  await arrow(page, 'previous').click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.drag);
  await expect(next()).toBeVisible();
  await expect(tray()).toHaveCSS('opacity', '0');
  expect(await sceneAnimations(page)).toEqual([]);
});

test('HP-2 AD-11 toggling reduced motion or resizing re-enters the scene and moves focus from inside the scene to the carousel', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const next = current(page).getByRole('button', { name: controls.next, exact: true });
  await next.click();
  await next.click();
  await expect(next).toBeFocused();
  await page.setViewportSize({ width: 420, height: 740 });
  await expect(root(page)).toBeFocused();
  await expect(next).toBeVisible();
  // Frame 0 again: the transform of the tail is the home one.
  await expect(current(page).locator('[data-scene-el="tray"]')).toHaveCSS('opacity', '0');
  await next.click();
  await expect(next).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(root(page)).toBeFocused();
  await expect(
    current(page).getByRole('button', { name: controls.pause, exact: true }),
  ).toBeVisible();
  await expect.poll(() => stepIds(page)).toContain('drag-step-0');
});

test('HP-1 AD-11 resize refits the stage; two scenes have equal stage heights; an unchanged card width does not restart the scene', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const stage = () => current(page).locator('[data-scene-el="stage"]');
  const box = async () => {
    const b = await stage().boundingBox();
    if (b === null) throw new Error('no stage box');
    return b;
  };
  const cardWidth = async () => {
    const b = await current(page).locator('.card').first().boundingBox();
    if (b === null) throw new Error('no card box');
    return b.width;
  };
  await expect.poll(() => stepIds(page)).toContain('drag-step-1');
  const first = await box();
  expect(await cardWidth()).toBeGreaterThanOrEqual(32);
  await markLive(page);
  // 361 px: content 329, the floor(content / 8 - 4) card width is still 37: no refit.
  await page.setViewportSize({ width: 361, height: 740 });
  await page.waitForTimeout(300);
  expect(await reEntered(page)).toBe(false);
  await dotOf(page, 5).click();
  const other = await box();
  expect(other.height).toBeCloseTo(first.height, 0);
  expect(other.width).toBeCloseTo(first.width, 0);
  await expect.poll(() => stepIds(page)).toContain('scoring-step-1');
  await markLive(page);
  await page.setViewportSize({ width: 412, height: 740 });
  await expect.poll(() => reEntered(page)).toBe(true);
  const wider = await box();
  expect(wider.width).toBeGreaterThan(first.width);
  expect(await cardWidth()).toBeGreaterThanOrEqual(32);
  await dotOf(page, 2).click();
  expect((await box()).height).toBeCloseTo(wider.height, 0);
});

test('HP-1 AD-11 landscape: cards are at least 32 px, the arrows and dots are reachable and at least 44 px, the dots fit two rows', async ({
  page,
}) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const cardBox = await current(page).locator('.card').first().boundingBox();
  expect(cardBox?.width ?? 0).toBeGreaterThanOrEqual(32);
  // The height cap is wired: the width-only card (content 528 px, w 62) is 60 px on the stage.
  expect(cardBox?.width ?? 99).toBeLessThan(55);
  for (const which of ['previous', 'next'] as const) {
    await arrow(page, which).scrollIntoViewIfNeeded();
    const b = await arrow(page, which).boundingBox();
    expect(b?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(b?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  await dotOf(page, 8).scrollIntoViewIfNeeded();
  await dotOf(page, 8).click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.topCard);
  await arrow(page, 'previous').click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.destinationRule);
});

for (const [width, name] of [
  [360, 'at 360 px'],
  [300, 'below 288 px of content'],
] as const) {
  test(`HP-1 AD-11 ${name} the dots are at least 44 px, in at most two rows inside the content, with no horizontal overflow`, async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    await page.setViewportSize({ width, height: 740 });
    await expect(dotOf(page, 8)).toBeVisible();
    const geometry = await page.evaluate(() => {
      const content = document.querySelector('.panel .content');
      const inner = document.querySelector('.panel .inner');
      if (content === null || inner === null) throw new Error('no panel');
      const rect = inner.getBoundingClientRect();
      const style = getComputedStyle(inner);
      const left = rect.left + Number.parseFloat(style.paddingLeft);
      const right = rect.right - Number.parseFloat(style.paddingRight);
      const dots = [...document.querySelectorAll('.panel [role="group"] .dot')].map((el) => {
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height };
      });
      return { left, right, dots, overflow: content.scrollWidth > content.clientWidth };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.dots).toHaveLength(8);
    for (const d of geometry.dots) {
      expect(d.w).toBeGreaterThanOrEqual(44);
      expect(d.h).toBeGreaterThanOrEqual(44);
      expect(d.x).toBeGreaterThanOrEqual(geometry.left - 0.5);
      expect(d.x + d.w).toBeLessThanOrEqual(geometry.right + 0.5);
    }
    expect(new Set(geometry.dots.map((d) => Math.round(d.y))).size).toBeLessThanOrEqual(2);
    const stageBox = await current(page).locator('[data-scene-el="stage"]').boundingBox();
    expect((stageBox?.x ?? 0) + (stageBox?.width ?? 0)).toBeLessThanOrEqual(geometry.right + 0.5);
  });
}

// Animation speed cannot change while the panel is open (LEGAL_TOPS), so a different seeded speed is
// covered by reopening: the scene keyed on baseMs starts at step 1 with that speed's durations.
test('HP-1 AD-10 a different Animation speed seeded before opening starts the scene at step 1 with its durations', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh', { prefs: 'prefs-fast' });
  await openPanel(page);
  await expect.poll(() => stepIds(page)).toContain('drag-step-0');
  expect(await stepIds(page)).not.toContain('drag-step-2');
  const fast = (await sceneAnimations(page)).find((a) => a.id === 'drag-step-0')?.duration ?? 0;
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await openPanel(page);
  await expect.poll(() => stepIds(page)).toContain('drag-step-0');
  expect(await stepIds(page)).not.toContain('drag-step-2');
  expect((await sceneAnimations(page)).find((a) => a.id === 'drag-step-0')?.duration).toBe(fast);
});
