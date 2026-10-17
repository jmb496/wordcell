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
    const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[id] });
    await figure.scrollIntoViewIfNeeded();
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
    const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[id] });
    await figure.scrollIntoViewIfNeeded();
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
  const figure = panel(page).getByRole('figure', { name: text.howTo.scenes.place });
  await figure.scrollIntoViewIfNeeded();
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
    await expect(layer.locator('.wcell').last().locator('.card')).toHaveText(frame.cell6.split(''));
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
  const figure = panel(page).getByRole('figure', { name: text.howTo.scenes.scoring });
  await figure.scrollIntoViewIfNeeded();
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
    const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[id] });
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.getByRole('button', { name: controls.pause, exact: true })).toBeVisible();
    await expect
      .poll(async () => (await sceneAnimations(page)).map((a) => a.id), { timeout: 30_000 })
      .toContain(`${id}-step-${lastStep}`);
  });
}

// Epic 8 ticket 4 (HP-4, HP-2, HP-6): the Tricky rules section, after the five basic scenes.
// Captions are looked up by their text.ts key, never by position; the order is asserted separately.
test('R-21 R-31 R-33 AD-14 the Tricky rules heading and its three scenes follow the five basic scenes, in order', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const s = text.howTo.scenes;
  const order = await panel(page).locator('h3, figure.scene > figcaption').allTextContents();
  expect(order.slice(0, 9)).toStrictEqual([
    s.drag,
    s.compose,
    s.destination,
    s.place,
    s.scoring,
    h.tricky,
    s.sourceDrop,
    s.destinationRule,
    s.topCard,
  ]);
  expect(h.tricky).toBe('Tricky rules');
  expect(order[9]).toBe(h.goal);
  for (const caption of [s.sourceDrop, s.destinationRule, s.topCard])
    await expect(panel(page).getByRole('figure', { name: caption })).toHaveCount(1);
});

const trickyScenes = [
  {
    id: 'sourceDrop' as const,
    rules: 'R-21 R-13 Q-11',
    scene: 'source-drop',
    lastStep: 5,
    // Per frame: the open layer's tiles, Validate class, the cells dimmed in that layer.
    frames: [
      { tiles: undefined, validate: undefined, used: [] },
      { tiles: undefined, validate: undefined, used: [] },
      { tiles: 'FEDKA', validate: 'lit', used: [] },
      { tiles: 'FAKED', validate: 'lit', used: [] },
    ],
  },
  {
    id: 'destinationRule' as const,
    rules: 'R-13 R-22 R-31',
    scene: 'destination-rule',
    lastStep: 10,
    frames: [
      { tiles: undefined, validate: undefined, used: [] },
      { tiles: undefined, validate: undefined, used: [] },
      { tiles: 'BAT', validate: 'lit', used: [] },
      { tiles: undefined, validate: undefined, used: [] },
      { tiles: undefined, validate: undefined, used: [] },
      { tiles: 'B', validate: 'off', used: [] },
      { tiles: 'BA', validate: 'off', used: [3] },
      { tiles: 'BAT', validate: 'lit', used: [3, 4] },
    ],
  },
  {
    id: 'topCard' as const,
    rules: 'R-33',
    scene: 'top-card',
    lastStep: 5,
    frames: [
      { tiles: undefined, validate: undefined, used: [] },
      { tiles: undefined, validate: undefined, used: [] },
      { tiles: 'AT', validate: 'off', used: [] },
      { tiles: 'SAT', validate: 'lit', used: [5] },
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
    const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[id] });
    await figure.scrollIntoViewIfNeeded();
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
        await expect(open.locator('.validate')).toHaveClass(new RegExp(frame.validate ?? ''));
        const dimmed = await open
          .locator('.cell.used')
          .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-cell'))));
        expect(dimmed).toStrictEqual(frame.used);
        await expect(layers.and(figure.locator('[style*="opacity: 1"]'))).toHaveCount(1);
      }
      if (i < frames.length - 1)
        await figure.getByRole('button', { name: controls.next, exact: true }).click();
    }
    await expect(figure.getByRole('button', { name: controls.next })).toHaveCount(0);
    await figure.getByRole('button', { name: controls.replay, exact: true }).click();
    await expect(figure.getByRole('button', { name: controls.next, exact: true })).toBeVisible();
    // Frame 0 is the start again: no layer shown, tail back at home.
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
    const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[id] });
    await figure.scrollIntoViewIfNeeded();
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
