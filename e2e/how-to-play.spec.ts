import { expect, type Locator, type Page, test } from '@playwright/test';
import { STAGE_W, STRIP } from '../src/ui/scenes/geometry';
import { bandNames, text } from '../src/ui/text';
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
const sceneOrder = ['moveCompose', 'freeLetter', 'place', 'sourceDrop', 'scoring'] as const;
type SceneKey = (typeof sceneOrder)[number];
// A scene's animation ids start with its script id (`move-compose-step-1`), not its text.ts key.
const stepPrefix: Record<SceneKey, string> = {
  moveCompose: 'move-compose',
  freeLetter: 'free-letter',
  place: 'place',
  scoring: 'scoring',
  sourceDrop: 'source-drop',
};
/** A scene's open tray layers (not the tile wrappers inside them). */
const trayLayers = '[data-scene-el^="tray-"]:not([data-scene-el*="-tile-"])';
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
  expect(Object.values(h)).toHaveLength(3);
  await expect(panel(page).locator('ul.bands li')).toHaveText(
    bandNames().map((_, b) => `${text.bandName(b)}${text.bandScore(b)}`),
  );
  await expect(panel(page).locator('table')).toHaveCount(3);
  for (const caption of Object.values(text.howTo.controlCaptions)) {
    await expect(panel(page).locator('caption', { hasText: caption })).toHaveCount(1);
  }
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
  await expect(content).toHaveCSS('scrollbar-gutter', 'stable');
  await expect(panel(page).locator('[data-card-id]')).toHaveCount(0);
  await expect(panel(page).locator('[data-testid^="card-"]')).toHaveCount(0);
  await expect(panel(page).locator('[data-mirror-of]')).toHaveCount(0);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

// Epic 8 tickets 1 and 7 (HP-1, HP-2, HP-6): scene 1, the move-compose scene, above the text sections.
const scene = (page: Page) =>
  panel(page).getByRole('figure', { name: text.howTo.scenes.moveCompose });
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
        element: (a.effect as KeyframeEffect).target
          ?.closest('[data-scene-el]')
          ?.getAttribute('data-scene-el'),
        currentTime: Number(a.currentTime),
      })),
  );

// Every animation created on a scene element since the page loaded (an init script, so call it
// before `openFixture`): `document.getAnimations()` omits an unmounted scene's detached elements,
// which a player that was never destroyed keeps animating.
const recordSceneAnimations = (page: Page) =>
  page.addInitScript(() => {
    const all: Animation[] = [];
    (window as unknown as { recordedScene: Animation[] }).recordedScene = all;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args) {
      const animation = animate.apply(this, args);
      if (this.closest('[data-scene-el]') !== null) all.push(animation);
      return animation;
    };
  });

/**
 * After scene `sceneId` (its script id) left the page: within its longest animation no new one
 * starts, and every animation it created is cancelled (`idle`), none still running or finished.
 */
async function expectSceneStopped(page: Page, sceneId: string): Promise<void> {
  const mine = () =>
    page.evaluate(
      (prefix) =>
        (window as unknown as { recordedScene: Animation[] }).recordedScene
          .filter((a) => a.id.startsWith(prefix))
          .map((a) => ({
            id: a.id,
            playState: a.playState,
            duration: Number(a.effect?.getTiming().duration),
          })),
      `${sceneId}-`,
    );
  const before = await mine();
  expect(before.length).toBeGreaterThan(0);
  await page.waitForTimeout(Math.max(...before.map((a) => a.duration)));
  const after = await mine();
  expect(after).toHaveLength(before.length);
  expect(after.filter((a) => a.playState !== 'idle')).toEqual([]);
}

/**
 * The WAAPI durations of scene 1's step-0 tail lift, in creation order (recorded, so call
 * `recordSceneAnimations` first): an effect, not the step's wait hold, which animates the stage.
 */
const tailLiftMs = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { recordedScene: Animation[] }).recordedScene
      .filter(
        (a) =>
          a.id === 'move-compose-step-0' &&
          (a.effect as KeyframeEffect).target?.getAttribute('data-scene-el') === 'tail',
      )
      .map((a) => Number(a.effect?.getTiming().duration)),
  );

// Only scene 1's animations (ids `move-compose-...`): the other scenes keep playing meanwhile.
const sceneOneAnimations = async (page: Page) =>
  (await sceneAnimations(page)).filter((a) => a.id.startsWith('move-compose-'));

test('R-10 R-20 R-23 AD-14 the scene plays on open, a tap pauses it and a tap restarts it from step 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect(scene(page)).toBeVisible();
  await expect(scene(page).getByText(text.howTo.scenes.moveCompose, { exact: true })).toBeVisible();
  await expect(scene(page).getByRole('button', { name: controls.next })).toHaveCount(0);
  await expect
    .poll(async () => (await sceneOneAnimations(page)).map((a) => a.id))
    .toContain('move-compose-step-1');
  await scene(page).getByRole('button', { name: controls.pause, exact: true }).click();
  const paused = scene(page).getByRole('button', { name: controls.restart, exact: true });
  await expect(paused).toBeVisible();
  // HP-1: the icon shows the state: two bars while playing, the play triangle while paused.
  const icon = scene(page).locator('.tap .icon');
  const glyph = () =>
    icon.evaluate((el) => ({
      triangle: getComputedStyle(el, '::before').borderLeftWidth,
      bar: getComputedStyle(el, '::after').content,
    }));
  await expect(icon).toHaveClass(/\bpaused\b/);
  expect(await glyph()).toEqual({ triangle: '10px', bar: 'none' });
  const frozen = await sceneOneAnimations(page);
  expect(frozen.length).toBeGreaterThan(0);
  expect(frozen.every((a) => a.playState === 'paused' || a.playState === 'finished')).toBe(true);
  await page.waitForTimeout(400);
  expect(await sceneOneAnimations(page)).toEqual(frozen);
  await paused.click();
  await expect(
    scene(page).getByRole('button', { name: controls.pause, exact: true }),
  ).toBeVisible();
  await expect(icon).not.toHaveClass(/\bpaused\b/);
  expect(await glyph()).toEqual({ triangle: '0px', bar: '""' });
  const ids = (await sceneOneAnimations(page)).map((a) => a.id);
  expect(ids).toContain('move-compose-step-0');
  expect(ids).not.toContain('move-compose-step-2');
  await expect
    .poll(async () => (await sceneOneAnimations(page)).map((a) => a.id))
    .toContain('move-compose-step-2');
});

test('R-10 AD-14 closed, the scene animates nothing; reopened, it starts again at step 1', async ({
  page,
}) => {
  await recordSceneAnimations(page);
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect.poll(async () => (await sceneAnimations(page)).length).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  expect(await sceneAnimations(page)).toEqual([]);
  await expectSceneStopped(page, 'move-compose');
  await openPanel(page);
  await expect
    .poll(async () => (await sceneAnimations(page)).map((a) => a.id))
    .toContain('move-compose-step-0');
});

test('R-10 R-20 R-23 AD-14 with reduced motion scene 1 shows eight frames on Next and Replay returns to the first', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect(scene(page)).toBeVisible();
  expect(await sceneAnimations(page)).toEqual([]);
  await expect(scene(page).getByRole('button', { name: controls.pause })).toHaveCount(0);
  await expect(scene(page).getByRole('button', { name: controls.restart })).toHaveCount(0);
  const tray = scene(page).locator(trayLayers);
  const open = scene(page).locator('[data-scene-el="tray-7"]');
  const tail = scene(page).locator('[data-scene-el="tail"]');
  const transform = () => tail.evaluate((el) => (el as HTMLElement).style.transform);
  const frames: string[] = [await transform()];
  await expect(open).toHaveCSS('opacity', '0');
  for (let i = 0; i < 2; i++) {
    await scene(page).getByRole('button', { name: controls.next, exact: true }).click();
    if (i === 0) frames.push(await transform());
    await expect(open).toHaveCSS('opacity', '0');
  }
  expect(frames[1]).not.toBe(frames[0]);
  // Frame 2 has the tail gone into the tray with tray-2 shown.
  await expect(tail).toHaveCSS('visibility', 'hidden');
  await expect(scene(page).locator('[data-scene-el="tray-2"]')).toHaveCSS('opacity', '1');
  for (let i = 2; i < 7; i++)
    await scene(page).getByRole('button', { name: controls.next, exact: true }).click();
  await expect(open).toHaveCSS('opacity', '1');
  await expect(tail).toHaveCSS('visibility', 'hidden');
  await expect(tray.and(scene(page).locator('[style*="opacity: 1"]'))).toHaveCount(1);
  await expect(scene(page).getByRole('button', { name: controls.next })).toHaveCount(0);
  expect(await sceneAnimations(page)).toEqual([]);
  await scene(page).getByRole('button', { name: controls.replay, exact: true }).click();
  await expect(open).toHaveCSS('opacity', '0');
  expect(await transform()).toBe(frames[0]);
  await expect(scene(page).getByRole('button', { name: controls.next, exact: true })).toBeVisible();
});

test('R-10 AD-10 Animation speed Slow runs a scene step longer than Fast', async ({
  page,
  context,
}) => {
  const stepMs = async (p: Page, prefs: string): Promise<number> => {
    await recordSceneAnimations(p);
    await openFixture(p, 'session-idle-fresh', { prefs });
    await openPanel(p);
    await expect.poll(async () => (await tailLiftMs(p)).length).toBeGreaterThan(0);
    return (await tailLiftMs(p))[0];
  };
  const slow = await stepMs(page, 'prefs-non-default');
  const fastPage = await context.newPage();
  const fast = await stepMs(fastPage, 'prefs-fast');
  expect(fast).toBeGreaterThan(0);
  expect(slow).toBeGreaterThan(fast);
  // BASE_MS: Slow 320 against Fast 90.
  expect(slow / fast).toBeCloseTo(320 / 90);
});

test('AD-9 a hidden page stops the scene and a visible one restarts it at step 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect
    .poll(async () => (await sceneAnimations(page)).map((a) => a.id))
    .toContain('move-compose-step-1');
  // This page keeps rendering, but a hidden tab does not advance WAAPI: while "hidden" the scene's
  // running animations are paused, so the step in flight finishes only once visible again. Every
  // animation started from then on is recorded. A pause applies on the next frame (its `ready`
  // resolves once the currentTime is held), and a phase finishing in that frame starts the next
  // phase: pause again until no scene animation runs.
  const setHidden = (hidden: boolean) =>
    page.evaluate(async (h) => {
      const held = window as unknown as { heldScene?: Animation[]; startedScene?: Animation[] };
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => (h ? 'hidden' : 'visible'),
      });
      document.dispatchEvent(new Event('visibilitychange'));
      if (h) {
        const started: Animation[] = [];
        held.startedScene = started;
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          const animation = animate.apply(this, args);
          started.push(animation);
          return animation;
        };
        held.heldScene = [];
        for (;;) {
          const running = document
            .getAnimations()
            .filter((a) => a.playState === 'running')
            .filter((a) => (a.effect as KeyframeEffect | null)?.target?.closest('figure'));
          if (running.length === 0) break;
          for (const a of running) a.pause();
          held.heldScene.push(...running);
          await Promise.all(running.map((a) => a.ready));
        }
        return held.heldScene.map((a) => a.id);
      }
      for (const a of held.heldScene ?? []) a.play();
      return [];
    }, hidden);
  const inFlight = await setHidden(true);
  expect(inFlight.length).toBeGreaterThan(0);
  const frozen = await sceneAnimations(page);
  await page.waitForTimeout(400);
  expect(await sceneAnimations(page)).toEqual(frozen);
  await setHidden(false);
  // The first animation after the step in flight is step 1's, not the next step's.
  await expect
    .poll(() =>
      page.evaluate(
        (ids) =>
          (window as unknown as { startedScene: Animation[] }).startedScene
            .filter((a) => (a.effect as KeyframeEffect | null)?.target?.closest('figure'))
            .map((a) => a.id)
            .find((id) => !ids.includes(id)),
        inFlight,
      ),
    )
    .toBe('move-compose-step-0');
});

// Epic 8 tickets 2 and 7 (HP-3, HP-2): scenes 1 and 2 stepped to their last frame under reduced
// motion; per frame the open tray layer, its tiles, k's side, Validate and WordCell 6 are asserted.
const stepScenes = [
  {
    id: 'moveCompose' as const,
    rules: 'R-10 R-13 R-20 R-23 R-30 R-31 R-32',
    lastStep: 8,
    // Per frame: the open layer's tiles (undefined: no tray), Validate class, cell 6 covered, and
    // the D block (E on column 3): at home, or gone once it is a tray tile.
    frames: [
      { tiles: undefined, validate: undefined, used: false, k: 0, side: 'left', dest: 'home' },
      { tiles: undefined, validate: undefined, used: false, k: 0, side: 'left', dest: 'home' },
      { tiles: 'EKBA', validate: 'lit', used: false, k: 1, side: 'left', dest: 'gone' },
      { tiles: 'DEKBA', validate: 'lit', used: false, k: 2, side: 'left', dest: 'gone' },
      { tiles: 'NDEKBA', validate: 'lit', used: false, k: 3, side: 'left', dest: 'gone' },
      { tiles: 'DEKBA', validate: 'lit', used: false, k: 2, side: 'left', dest: 'gone' },
      { tiles: 'KBAED', validate: 'lit', used: false, k: 2, side: 'right', dest: 'gone' },
      { tiles: 'BAKED', validate: 'lit', used: false, k: 2, side: 'right', dest: 'gone' },
    ],
  },
  {
    id: 'freeLetter' as const,
    rules: 'R-33 R-34 R-38 Q-31',
    // The last step index (Validate); the rest after it is `freeLetter-rest`, not a step id.
    lastStep: 2,
    // The tap appends L at the right end of the arranged cards (Q-31), then an arrange gives BALKED.
    frames: [
      { tiles: 'BAKED', validate: 'lit', used: false, k: 2, side: 'right' },
      { tiles: 'BAKLED', validate: 'lit', used: true, k: 2, side: 'right' },
      { tiles: 'BALKED', validate: 'lit', used: true, k: 2, side: 'right' },
      { tiles: 'BALKED', validate: 'pressed', used: true, k: 2, side: 'right' },
    ],
  },
];

for (const { id, rules, frames, lastStep } of stepScenes) {
  test(`${rules} AD-14 with reduced motion scene ${id} steps through ${frames.length} frames to its last`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    await expect(figure.getByText(text.howTo.scenes[id], { exact: true })).toBeVisible();
    expect(await sceneAnimations(page)).toEqual([]);
    // Owner decision D10: column 3's cards that join the D block (D at k 2, N at k 3) leave it.
    const joins = figure.locator('[data-column="3"] [data-scene-el^="join-"]');
    await expect(joins).toHaveCount(id === 'moveCompose' ? 2 : 1);
    for (const [i, frame] of frames.entries()) {
      for (const el of await joins.all()) {
        const depth = Number((await el.getAttribute('data-scene-el'))?.slice('join-'.length));
        await expect(el).toHaveCSS('opacity', frame.k > depth ? '0' : '1');
      }
      const layer = figure.locator(trayLayers);
      if (frame.tiles === undefined) {
        for (const el of await layer.all()) await expect(el).toHaveCSS('opacity', '0');
      } else {
        const open = figure.locator(`[data-scene-el="tray-${i}"]`);
        await expect(open).toHaveCSS('opacity', '1');
        await expect(open.locator('.tiles .card')).toHaveText(frame.tiles.split(''));
        await expect(open.locator('.validate')).toHaveClass(new RegExp(frame.validate ?? ''));
        await expect(open.locator('.cell6.used')).toHaveCount(frame.used ? 1 : 0);
        // R-33 owner decision D11: the used top card is the game's look (face 40 %, 45° hatch).
        if (frame.used) {
          const face = open.locator('.cell6.used .card.used .face');
          await expect(face).toHaveCSS('opacity', '0.4');
          await expect(face).toHaveCSS('background-image', /repeating-linear-gradient/);
        }
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
      // Scene.svelte destState (a scene that draws a D block): `gone` hides it, home shows it.
      if ('dest' in frame)
        await expect(figure.locator('[data-scene-el="dest"]')).toHaveCSS(
          'visibility',
          frame.dest === 'gone' ? 'hidden' : 'visible',
        );
      if (i < frames.length - 1)
        await figure.getByRole('button', { name: controls.next, exact: true }).click();
    }
    await expect(figure.getByRole('button', { name: controls.next })).toHaveCount(0);
    await figure.getByRole('button', { name: controls.replay, exact: true }).click();
    await expect(figure.getByRole('button', { name: controls.next, exact: true })).toBeVisible();
  });

  test(`${rules} AD-14 scene ${id} plays on open through its last step`, async ({ page }) => {
    test.setTimeout(60_000);
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    await expect(figure.getByRole('button', { name: controls.pause, exact: true })).toBeVisible();
    await expect
      .poll(async () => (await sceneAnimations(page)).map((a) => a.id), { timeout: 40_000 })
      .toContain(`${stepPrefix[id]}-step-${lastStep}`);
  });
}

// Epic 8 ticket 3 (HP-3d, HP-3e, HP-2): scenes 3 (place) and 5 (scoring) stepped to their last
// frame under reduced motion; per frame the open layer, the strip, the lit cells and the figures.
test('R-40 R-42 R-50 R-51 R-52 R-60 Q-49 AD-14 with reduced motion scene place steps through 6 frames to its last', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'place');
  expect(await sceneAnimations(page)).toEqual([]);
  // Per frame: tray or strip letters (undefined: none), lit cells, the selected WordCell number,
  // cell 5's and cell 6's cards ('' none), whether cell 6's top card is used (R-33), the cells whose
  // top carries the Q-49 preview `★`, whether cell 6 is drawn empty, the not-legal (dimmed) cells
  // (R-40). Frame 0 is the composed word in the tray (owner decision D5); a strip marks its first
  // card bottom and its last top (R-50 (UI), owner decision D9). Frames 1 to 4 draw the preview
  // (Q-49), never a count badge (owner decision 2026-10-29).
  const frames = [
    {
      tiles: 'BALKED',
      strip: false,
      lit: [],
      target: undefined,
      cell5: '',
      cell6: 'L',
      used: true,
      stars: [],
      empty6: false,
      dim: [],
      button: text.validate,
    },
    {
      tiles: 'BALKED',
      strip: true,
      lit: [3, 4, 5],
      target: 6,
      cell5: '',
      cell6: 'D',
      used: false,
      stars: [6],
      empty6: false,
      dim: [7, 8, 9, 10],
      button: text.confirm,
    },
    {
      tiles: 'BALKED',
      strip: true,
      lit: [3, 4, 6],
      target: 5,
      cell5: 'D',
      cell6: '',
      used: false,
      stars: [5],
      empty6: true,
      dim: [7, 8, 9, 10],
      button: text.confirm,
    },
    {
      tiles: 'BALKED',
      strip: true,
      lit: [3, 4, 5],
      target: 6,
      cell5: '',
      cell6: 'D',
      used: false,
      stars: [6],
      empty6: false,
      dim: [7, 8, 9, 10],
      button: text.confirm,
    },
    {
      tiles: 'DBALKE',
      strip: true,
      lit: [3, 4, 5],
      target: 6,
      cell5: '',
      cell6: 'E',
      used: false,
      stars: [6],
      empty6: false,
      dim: [7, 8, 9, 10],
      button: text.confirm,
    },
    {
      tiles: undefined,
      strip: false,
      lit: [],
      target: undefined,
      cell5: '',
      cell6: 'E',
      used: false,
      stars: [],
      empty6: false,
      dim: [],
      button: undefined,
    },
  ];
  for (const [i, frame] of frames.entries()) {
    const layer = figure.locator(`[data-scene-el="place-${i}"]`);
    await expect(layer).toHaveCSS('opacity', '1');
    await expect(figure.locator('[data-scene-el^="place-"][style*="opacity: 1"]')).toHaveCount(1);
    if (frame.tiles === undefined) await expect(layer.locator('.tiles')).toHaveCount(0);
    else {
      const cards = layer.locator('.tiles .card');
      await expect(cards.locator('.glyph')).toHaveText(frame.tiles.split(''));
      const marks = await cards.evaluateAll((els) =>
        els.map((el) => [...el.querySelectorAll('.mark')].map((m) => m.textContent)),
      );
      expect(marks).toEqual(
        [...frame.tiles].map((_, j) =>
          !frame.strip
            ? []
            : j === 0
              ? [text.stripBottom]
              : j === frame.tiles.length - 1
                ? [text.stripTop, text.star]
                : [],
        ),
      );
      // The marks sit inside their card's face, visible (R-50 (UI)).
      if (frame.strip)
        for (const card of [cards.first(), cards.last()])
          await expect(card.locator('.position.mark')).toBeVisible();
    }
    const dimmed = await layer
      .locator('.wcell.wc-dim .num')
      .allTextContents()
      .then((n) => n.map(Number));
    expect(dimmed).toEqual(frame.dim);
    for (const n of frame.dim)
      await expect(
        layer.locator('.wcell', { has: page.locator('.num', { hasText: new RegExp(`^${n}$`) }) }),
      ).toHaveCSS('opacity', '0.35');
    const cell6 = layer.locator('.wcell', { has: page.locator('.num', { hasText: /^6$/ }) });
    await expect(cell6.locator('.card.used')).toHaveCount(frame.used ? 1 : 0);
    if (frame.used) await expect(cell6.locator('.card.used .face')).toHaveCSS('opacity', '0.4');
    // The WordCell numbers of the lit stacks and of the selected one (R-40 R-42).
    const cellNumbers = async (selector: string): Promise<number[]> =>
      (await layer.locator(`.wcell:has(${selector}) .num`).allTextContents()).map(Number);
    expect(await cellNumbers('.stack.lit')).toEqual(frame.lit);
    expect(await cellNumbers('.stack.target')).toEqual(
      frame.target === undefined ? [] : [frame.target],
    );
    const cell5 = layer.locator('.wcell', { has: page.locator('.num', { hasText: /^5$/ }) });
    for (const [cell, letters] of [
      [cell5, frame.cell5],
      [cell6, frame.cell6],
    ] as const)
      if (letters === '') await expect(cell.locator('.card')).toHaveCount(0);
      else await expect(cell.locator('.card .glyph')).toHaveText(letters.split(''));
    expect(await cellNumbers('.preview-mark')).toEqual(frame.stars);
    for (const n of frame.stars)
      await expect(
        layer
          .locator('.wcell', { has: page.locator('.num', { hasText: new RegExp(`^${n}$`) }) })
          .locator('.preview-mark'),
      ).toHaveText(text.star);
    await expect(cell6.locator('.stack.empty')).toHaveCount(frame.empty6 ? 1 : 0);
    await expect(layer.locator('.count')).toHaveCount(0);
    if (frame.button !== undefined) await expect(layer.locator('.ctl')).toHaveText(frame.button);
    else await expect(layer.locator('.ctl')).toHaveCount(0);
    if (i < frames.length - 1)
      await figure.getByRole('button', { name: controls.next, exact: true }).click();
  }
  await expect(figure.getByRole('button', { name: controls.next })).toHaveCount(0);
  await figure.getByRole('button', { name: controls.replay, exact: true }).click();
  await expect(figure.getByRole('button', { name: controls.next, exact: true })).toBeVisible();
});

test('R-51 R-52 Q-49 AD-14 with motion on the place scene tucks D B A L K E into WordCell 6, ending on one top card E', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'place');
  const fliers = figure.locator('[data-scene-el^="tuck-"]');
  expect(
    await fliers.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-scene-el'))),
  ).toEqual(['tuck-0', 'tuck-1', 'tuck-2', 'tuck-3', 'tuck-4', 'tuck-5']);
  expect(await fliers.locator('.glyph').allTextContents()).toEqual(['D', 'B', 'A', 'L', 'K', 'E']);
  // Q-49 (E6): while the tuck runs the target's star is gone and place-4's cell 6 still shows the
  // previewed top E under the fliers, until place-5 swaps in.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const running = document
            .getAnimations()
            .filter(
              (a) =>
                a.id === 'place-step-6' &&
                a.playState === 'running' &&
                (a.effect as KeyframeEffect | null)?.target
                  ?.closest('[data-scene-el]')
                  ?.getAttribute('data-scene-el')
                  ?.startsWith('tuck-'),
            ).length;
          const mark = document.querySelector('[data-scene-el="mark-4"]');
          const layer = document.querySelector('[data-scene-el="place-4"]');
          const cell6 = [...document.querySelectorAll('[data-scene-el="place-4"] .wcell')].find(
            (c) => c.querySelector('.num')?.textContent === '6',
          );
          return {
            running,
            opacity: mark === null ? undefined : getComputedStyle(mark).opacity,
            layer: layer === null ? undefined : getComputedStyle(layer).opacity,
            glyph: cell6?.querySelector('.glyph')?.textContent,
          };
        }),
      { timeout: 30_000 },
    )
    .toEqual({ running: 6, opacity: '0', layer: '1', glyph: 'E' });
  await expect
    .poll(
      async () =>
        (await sceneAnimations(page)).filter((a) => a.playState === 'running').map((a) => a.id),
      { timeout: 30_000 },
    )
    .toEqual(['place-rest']);
  const last = figure.locator('[data-scene-el="place-5"]');
  await expect(
    last.locator('.wcell', { has: page.locator('.num', { hasText: /^6$/ }) }).locator('.card'),
  ).toHaveText(['E']);
  const rects = await page.evaluate(() => {
    const face = (root: Element | null) => root?.querySelector('.face')?.getBoundingClientRect();
    const cells = document.querySelectorAll('[data-scene-el="place-5"] .wcell');
    const cell6 = [...cells].find((c) => c.querySelector('.num')?.textContent === '6') ?? null;
    const a = face(document.querySelector('[data-scene-el="tuck-5"]'));
    const b = face(cell6?.querySelector('.card') ?? null);
    return a && b
      ? { a: [a.x, a.y, a.width, a.height], b: [b.x, b.y, b.width, b.height] }
      : undefined;
  });
  expect(rects).toBeDefined();
  rects?.a.forEach((v, i) => {
    expect(Math.abs(v - (rects.b[i] ?? 0))).toBeLessThan(0.5);
  });
});

test('R-51 AD-14 a tap while card 1 is in flight pauses the tuck and a second tap restores the frame-0 look', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'place');
  await expect
    .poll(
      async () => {
        const a = (await sceneAnimations(page)).find(
          (x) => x.id === 'place-step-6' && x.element === 'tuck-1',
        );
        return (
          a !== undefined && a.currentTime > a.duration / 6 && a.currentTime < (a.duration * 2) / 6
        );
      },
      { timeout: 30_000, intervals: [20] },
    )
    .toBe(true);
  await figure.getByRole('button', { name: controls.pause, exact: true }).click();
  await expect(figure.locator('[data-scene-el="tuck"]')).toHaveCSS('opacity', '1');
  await figure.getByRole('button', { name: controls.restart, exact: true }).click();
  await expect(figure.locator('[data-scene-el="place-0"]')).toHaveCSS('opacity', '1');
  await expect(figure.locator('[data-scene-el="tuck"]')).toHaveCSS('opacity', '0');
  await expect(
    figure
      .locator('[data-scene-el="place-0"] .wcell', {
        has: page.locator('.num', { hasText: /^6$/ }),
      })
      .locator('.card'),
  ).toHaveText(['L']);
});

// Epic 8 ticket 9 (HP-2, HP-3): the visible cards of WordCell `cell` in the scene (the stage's mini stack).
const cellCards = (figure: Locator, cell: number) => figure.locator(`[data-cell="${cell}"] .card`);

test('R-80 R-36 AD-14 with reduced motion scene scoring steps through 6 frames to the total', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'scoring');
  expect(await sceneAnimations(page)).toEqual([]);
  await expect(figure.locator('[data-scene-el^="grow-"]')).toHaveCount(0);
  const figures = ['3 × 3 = 9', '4 × 4 = 16', '6 × 6 = 36'];
  // Visible cards of cells 3, 4, 6 per frame: stacks fill in turn, then figures, then the total.
  const counts = [
    [1, 1, 1],
    [3, 1, 1],
    [3, 3, 1],
    [3, 3, 6],
    [3, 3, 6],
    [3, 3, 6],
  ];
  for (let i = 0; i < 6; i++) {
    for (const [k, cell] of [3, 4, 6].entries())
      await expect(cellCards(figure, cell)).toHaveCount(counts[i][k]);
    for (const label of figures)
      await expect(figure.getByText(label, { exact: true })).toHaveCSS(
        'opacity',
        i >= 4 ? '1' : '0',
      );
    await expect(figure.getByText(text.score(61), { exact: true })).toHaveCSS(
      'opacity',
      i === 5 ? '1' : '0',
    );
    if (i < 5) await figure.getByRole('button', { name: controls.next, exact: true }).click();
  }
  await expect(figure.getByRole('button', { name: controls.next })).toHaveCount(0);
  await figure.getByRole('button', { name: controls.replay, exact: true }).click();
  await expect(figure.getByRole('button', { name: controls.next, exact: true })).toBeVisible();
});

// Epic 8 ticket 9: the scoring scene's growth wrappers (motion on). `wrapper-<cell>-<j>` boxes are
// read in ONE evaluate so a running scene cannot change between reads.
const GROW_CELLS = [
  [3, 3],
  [4, 3],
  [6, 6],
] as const;
const readScoring = (page: Page) =>
  page.evaluate((cells) => {
    const box = (el: Element | null) => {
      const r = el?.getBoundingClientRect();
      if (!r) throw new Error('missing element');
      return { top: r.top, height: r.height, width: r.width, left: r.left };
    };
    const stage = box(document.querySelector('[data-scene-el="stage"]'));
    const opacity = (el: Element | null) => Number(getComputedStyle(el ?? document.body).opacity);
    const byEl = (id: string) => document.querySelector(`[data-scene-el="${id}"]`);
    return {
      stage,
      cells: cells.map(([cell, n]) => {
        const mini = document.querySelector(`[data-cell="${cell}"] .mini`);
        return {
          cell,
          mini: box(mini),
          wrappers: Array.from({ length: n }, (_, j) => {
            const w = byEl(`grow-${cell}-${j}`);
            return {
              ...box(w),
              opacity: opacity(w),
              transform: w ? getComputedStyle(w).transform : '',
            };
          }),
          lastCard: box([...(mini?.querySelectorAll('.card') ?? [])].at(-1) ?? null),
        };
      }),
      figures: ['score-1', 'score-2', 'score-3', 'total'].map((id) => opacity(byEl(id))),
      total: byEl('total')?.textContent,
      badge: (() => {
        const w = byEl('grow-4-0');
        const b = [...(w?.querySelectorAll('*') ?? [])].find(
          (e) => e.children.length === 0 && e.textContent === '\u00d72',
        );
        return { wrapper: box(w), badge: box(b ?? null) };
      })(),
    };
  }, GROW_CELLS);

/** Polls until the scoring scene is resting (only `scoring-rest` runs), then pauses it. */
async function restAndPause(page: Page, figure: Locator): Promise<void> {
  await expect
    .poll(
      async () =>
        (await sceneAnimations(page))
          .filter((a) => a.id.startsWith('scoring-') && a.playState === 'running')
          .map((a) => a.id),
      { timeout: 30_000 },
    )
    .toEqual(['scoring-rest']);
  await figure.getByRole('button', { name: controls.pause, exact: true }).click();
}

test('R-80 R-36 AD-14 with motion on the scoring scene grows the stacks first, then shows 9, 16, 36 and the total 61', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'scoring');
  // Step 2 grows cell 6; by then no figure shows.
  await expect
    .poll(
      async () =>
        (await sceneAnimations(page)).some(
          (a) =>
            a.id === 'scoring-step-2' &&
            a.element?.startsWith('grow-6-') &&
            a.playState === 'running',
        ),
      { timeout: 30_000 },
    )
    .toBe(true);
  await figure.getByRole('button', { name: controls.pause, exact: true }).click();
  expect((await readScoring(page)).figures).toEqual([0, 0, 0, 0]);
  await figure.getByRole('button', { name: controls.restart, exact: true }).click();
  await restAndPause(page, figure);
  const strip = (await readScoring(page)).stage.width / STAGE_W;
  const read = await readScoring(page);
  for (const { cell, mini, wrappers } of read.cells) {
    for (const [j, w] of wrappers.entries()) {
      expect(w.opacity, `grow-${cell}-${j}`).toBe(1);
      expect(Math.abs(w.top - (mini.top + j * STRIP * strip))).toBeLessThan(0.5);
    }
  }
  expect(read.figures).toEqual([1, 1, 1, 1]);
  expect(read.total).toBe(text.score(61));
});

test('Q-06 AD-14 QUIT keeps its x2 badge inside the strip under the card below, once the stack has grown', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'scoring');
  await restAndPause(page, figure);
  const { stage, badge } = await readScoring(page);
  const strip = (stage.width / STAGE_W) * STRIP;
  expect(badge.badge.top).toBeGreaterThanOrEqual(badge.wrapper.top - 0.5);
  expect(badge.badge.top + badge.badge.height).toBeLessThanOrEqual(badge.wrapper.top + strip + 0.5);
});

test('AD-14 R-65 a tap restart returns the stacks to their collapsed top cards and hides the figures (HP-1)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'scoring');
  await expect
    .poll(
      async () =>
        (await sceneAnimations(page)).some(
          (a) => a.element?.startsWith('grow-6-') && a.playState === 'running' && a.currentTime > 0,
        ),
      { timeout: 30_000, intervals: [20] },
    )
    .toBe(true);
  await figure.getByRole('button', { name: controls.pause, exact: true }).click();
  await figure.getByRole('button', { name: controls.restart, exact: true }).click();
  // Read at once, inside step 0's two-multiple wait, where the frame stays still.
  const read = await readScoring(page);
  expect(read.figures).toEqual([0, 0, 0, 0]);
  for (const { cell, mini, wrappers } of read.cells) {
    for (const [j, w] of wrappers.entries()) {
      if (j < wrappers.length - 1) expect(w.opacity, `grow-${cell}-${j}`).toBe(0);
      else expect(Math.abs(w.top - mini.top)).toBeLessThan(0.5);
    }
  }
});

test('AD-14 R-65 reduced motion draws no growth wrappers and one top card per stack; switching back restores them (HP-2)', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'scoring');
  await expect(figure.locator('[data-scene-el^="grow-"]')).toHaveCount(0);
  for (const cell of [3, 4, 6]) await expect(cellCards(figure, cell)).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const back = panel(page).getByRole('figure', { name: text.howTo.scenes.scoring });
  await expect(back.locator('[data-scene-el^="grow-"]')).toHaveCount(12);
});

test('R-80 R-36 AD-14 the animated final frame and the reduced-motion final frame have equal stack boxes', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const figure = await showScene(page, 'scoring');
  await restAndPause(page, figure);
  const rel = async () => {
    const r = await readScoring(page);
    return r.cells.map((c) => ({
      height: c.mini.height,
      last: [c.lastCard.left - r.stage.left, c.lastCard.top - r.stage.top, c.lastCard.height],
    }));
  };
  const animated = await rel();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const still = panel(page).getByRole('figure', { name: text.howTo.scenes.scoring });
  for (let i = 0; i < 5; i++)
    await still.getByRole('button', { name: controls.next, exact: true }).click();
  const reducedRead = await page.evaluate(() => {
    const stage = document.querySelector('[data-scene-el="stage"]')?.getBoundingClientRect();
    return [3, 4, 6].map((cell) => {
      const mini = document.querySelector(`[data-cell="${cell}"] .mini`);
      const last = [...(mini?.querySelectorAll('.card') ?? [])].at(-1)?.getBoundingClientRect();
      if (!stage || !mini || !last) throw new Error('missing');
      return {
        height: mini.getBoundingClientRect().height,
        last: [last.left - stage.left, last.top - stage.top, last.height],
      };
    });
  });
  for (const [k, a] of animated.entries()) {
    expect(Math.abs(a.height - reducedRead[k].height)).toBeLessThan(0.5);
    a.last.forEach((v, i) => {
      expect(Math.abs(v - reducedRead[k].last[i])).toBeLessThan(0.5);
    });
  }
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

// Epic 8 ticket 10 (HP-4, HP-2, HP-6): the one Tricky rule scene follows the four basic ones in the carousel
// (ticket 6 removes the stacked list and its heading). Captions are looked up by their text.ts key.
// Epic 8 ticket 5 (HP-1): a tap pauses scenes 2 to 4 and a second tap restarts them from step 0
// (`later`: a step the restart has not reached yet; free-letter has two steps).
for (const [id, later] of [
  ['freeLetter', 1],
  ['place', 2],
  ['scoring', 2],
] as const) {
  test(`R-10 AD-14 a tap on scene ${id} pauses it and a second tap restarts it from step 0`, async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await openPanel(page);
    const figure = await showScene(page, id);
    const prefix = stepPrefix[id];
    const mine = async () =>
      (await sceneAnimations(page)).filter((a) => a.id.startsWith(`${prefix}-step-`));
    await expect
      .poll(async () => (await mine()).map((a) => a.id), { timeout: 30_000 })
      .toContain(`${prefix}-step-1`);
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
    expect(ids).toContain(`${prefix}-step-0`);
    expect(ids).not.toContain(`${prefix}-step-${later}`);
    await expect
      .poll(async () => (await mine()).map((a) => a.id), { timeout: 30_000 })
      .toContain(`${prefix}-step-${later}`);
  });
}

const sourceDropRows = [
  {
    id: 'sourceDrop' as const,
    rules: 'R-21 R-13 Q-11',
    scene: 'source-drop',
    lastStep: 5,
    // Per frame: the D block state, the open layer's tiles and Validate class.
    frames: [
      { dest: undefined, tiles: undefined, validate: undefined },
      { dest: undefined, tiles: undefined, validate: undefined },
      { dest: 'gone', tiles: 'FEDKA', validate: 'lit' },
      { dest: 'gone', tiles: 'FAKED', validate: 'lit' },
    ],
  },
];

for (const { id, rules, frames } of sourceDropRows) {
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
      const layers = figure.locator(trayLayers);
      if (frame.tiles === undefined) {
        for (const el of await layers.all()) await expect(el).toHaveCSS('opacity', '0');
      } else {
        const open = figure.locator(`[data-scene-el="tray-${i}"]`);
        await expect(open).toHaveCSS('opacity', '1');
        await expect(open.locator('.tiles .card')).toHaveText(frame.tiles.split(''));
        await expect(open.locator('.validate')).toHaveClass(
          new RegExp(`(^|\\s)${frame.validate}(\\s|$)`),
        );
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
    for (const el of await figure.locator(trayLayers).all())
      await expect(el).toHaveCSS('opacity', '0');
  });

  test(`${rules} AD-14 scene ${id} plays on open through its last step; a tap pauses and a tap restarts`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const row = sourceDropRows.find((t) => t.id === id);
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
const sceneIds = ['move-compose', 'free-letter', 'place', 'source-drop', 'scoring'] as const;
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

test('HP-1 HP-6 the panel mounts one playing scene figure, the arrows and five dots named exactly', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect(current(page)).toHaveCount(1);
  await expect(root(page)).toBeVisible();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  await expect.poll(() => stepIds(page)).toContain('move-compose-step-1');
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

const arrowOpacity = (page: Page, which: 'previous' | 'next') =>
  arrow(page, which).evaluate((el) => getComputedStyle(el).opacity);
/** HP-1 ticket 8.6 Controls: a disabled end arrow carries the dimmed style, an enabled one does not. */
async function expectDimmed(page: Page, dimmed: 'previous' | 'next' | 'none') {
  for (const which of ['previous', 'next'] as const) {
    if (which === dimmed) await expect(arrow(page, which)).toContainClass('dim');
    else await expect(arrow(page, which)).not.toContainClass('dim');
  }
  const [previous, next] = [await arrowOpacity(page, 'previous'), await arrowOpacity(page, 'next')];
  if (dimmed === 'none') expect(previous).toBe(next);
  else expect(previous).not.toBe(next);
}

test('HP-1 the arrows walk all five scenes in order, one figure at a time, only the current scene animating, the end arrows aria-disabled and dimmed', async ({
  page,
}) => {
  await recordSceneAnimations(page);
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  for (const [i, key] of sceneOrder.entries()) {
    await expect(current(page)).toHaveCount(1);
    await expect(current(page)).toHaveAccessibleName(text.howTo.scenes[key]);
    await expect(current(page).locator('figcaption')).toHaveText(text.howTo.scenes[key]);
    await expect(dotOf(page, i + 1)).toHaveAttribute('aria-current', 'true');
    await expect(panel(page).locator('[aria-current="true"]')).toHaveCount(1);
    if (i > 0) await expectSceneStopped(page, sceneIds[i - 1]);
    await expectDimmed(page, i === 0 ? 'previous' : i === sceneOrder.length - 1 ? 'next' : 'none');
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
  await expect(arrow(page, 'previous')).toHaveAttribute('aria-disabled', 'true');
  await expectDimmed(page, 'previous');
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
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  await expect(arrow(page, 'previous')).toBeFocused();
  await dotOf(page, 5).click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.scoring);
  await expect(dotOf(page, 5)).toBeFocused();
  await expect(dotOf(page, 5)).toHaveAttribute('aria-current', 'true');
  await arrow(page, 'next').focus();
  await arrow(page, 'next').click({ force: true });
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.scoring);
  await expect(arrow(page, 'next')).toBeFocused();
  await dotOf(page, 3).click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.place);
  await expect(dotOf(page, 3)).toBeFocused();
});

test('HP-1 Left and Right move between scenes while focus is in the carousel, stop at the ends, and are ignored outside it', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await arrow(page, 'next').click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.freeLetter);
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.place);
  await expect(arrow(page, 'next')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  // Handled keys, also at an end, are prevented and stopped before they bubble to the document.
  const keyOutcome = (key: string) =>
    page.evaluate((k) => {
      let reached = false;
      const spy = () => {
        reached = true;
      };
      document.addEventListener('keydown', spy);
      const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
      (document.activeElement ?? document.body).dispatchEvent(event);
      document.removeEventListener('keydown', spy);
      return { prevented: event.defaultPrevented, reached };
    }, key);
  expect(await keyOutcome('ArrowLeft')).toEqual({ prevented: true, reached: false });
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  expect(await keyOutcome('ArrowRight')).toEqual({ prevented: true, reached: false });
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.freeLetter);
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  await dotOf(page, 5).click();
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.scoring);
  // A modified key is ignored.
  await page.keyboard.press('Shift+ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.scoring);
  // Outside the carousel (the Close control) the keys do nothing.
  await panel(page).getByRole('button', { name: 'Close how to play', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.scoring);
  // Inside a scene (its pause control) they act.
  await current(page).getByRole('button', { name: controls.pause, exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.sourceDrop);
  await expect(root(page)).toBeFocused();
});

test('HP-1 a newly shown scene starts at step 1 and a tap on the current dot does nothing; reopening resets to scene 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await expect.poll(() => stepIds(page)).toContain('move-compose-step-1');
  await markLive(page);
  await dotOf(page, 1).click();
  expect(await reEntered(page)).toBe(false);
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  await dotOf(page, 3).click();
  const ids = await stepIds(page);
  expect(ids).toContain('place-step-0');
  expect(ids).not.toContain('place-step-2');
  expect(ids.every((id) => id.startsWith('place-'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await openPanel(page);
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  await expect(dotOf(page, 1)).toHaveAttribute('aria-current', 'true');
  await expect.poll(() => stepIds(page)).toContain('move-compose-step-0');
});

test('HP-1 a tap pauses and restarts the carousel scene', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  await arrow(page, 'next').click();
  await expect.poll(() => stepIds(page)).toContain('free-letter-step-1');
  await current(page).getByRole('button', { name: controls.pause, exact: true }).click();
  const paused = current(page).getByRole('button', { name: controls.restart, exact: true });
  await expect(paused).toBeVisible();
  await paused.click();
  await expect(
    current(page).getByRole('button', { name: controls.pause, exact: true }),
  ).toBeVisible();
  expect(await stepIds(page)).toContain('free-letter-step-0');
});

test('HP-1 closed, the carousel keeps no scene and no animation; rapid switching leaves only the current scene animating', async ({
  page,
}) => {
  await recordSceneAnimations(page);
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  for (let i = 0; i < sceneOrder.indexOf('sourceDrop'); i++) await arrow(page, 'next').click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.sourceDrop);
  await expect.poll(() => stepIds(page)).toContain('source-drop-step-0');
  for (const passed of sceneIds.slice(0, sceneOrder.indexOf('sourceDrop')))
    await expectSceneStopped(page, passed);
  expect((await stepIds(page)).every((id) => id.startsWith('source-drop-'))).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              !a.id.startsWith('source-drop-') &&
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
  await expectSceneStopped(page, 'source-drop');
});

test('HP-1 during the panel exit the empty carousel keeps the closing scene and its stage height; reopening starts at scene 1', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const stageHeight = () =>
    current(page)
      .locator('.area')
      .evaluate((el) => el.getBoundingClientRect().height);
  const first = await stageHeight();
  await showScene(page, 'scoring');
  const closing = await stageHeight();
  expect(Math.abs(closing - first)).toBeGreaterThan(1);
  await page.keyboard.press('Escape');
  // Read in the frame the figure unmounts, while the panel still animates out.
  const exit = await page.evaluate(
    () =>
      new Promise<{ panel: boolean; host: number; current: number }>((resolve) => {
        const read = (): void => {
          if (document.querySelector('.panel figure') !== null) {
            requestAnimationFrame(read);
            return;
          }
          const host = document.querySelector('.panel [role="group"] .host');
          const dots = [...document.querySelectorAll('.panel [role="group"] .dot')];
          resolve({
            panel: host !== null,
            host: host?.getBoundingClientRect().height ?? 0,
            current: dots.findIndex((d) => d.getAttribute('aria-current') === 'true') + 1,
          });
        };
        read();
      }),
  );
  expect(exit.panel).toBe(true);
  expect(exit.host).toBeCloseTo(closing, 0);
  expect(exit.current).toBe(sceneOrder.length);
  await expect(panel(page)).toHaveCount(0);
  await openPanel(page);
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
  await expect(dotOf(page, 1)).toHaveAttribute('aria-current', 'true');
});

test('HP-2 with reduced motion Next steps to Replay and Replay returns to Next, each taking focus; a scene change resets the frame', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const next = () => current(page).getByRole('button', { name: controls.next, exact: true });
  const replay = () => current(page).getByRole('button', { name: controls.replay, exact: true });
  const tray = () => current(page).locator('[data-scene-el="tray-7"]');
  await next().click();
  await expect(next()).toBeFocused();
  for (let i = 0; i < 6; i++) await next().click();
  await expect(replay()).toBeFocused();
  await expect(tray()).toHaveCSS('opacity', '1');
  await replay().click();
  await expect(next()).toBeFocused();
  await expect(tray()).toHaveCSS('opacity', '0');
  for (let i = 0; i < 7; i++) await next().click();
  await expect(replay()).toBeVisible();
  await arrow(page, 'next').click();
  await expect(next()).toBeVisible();
  await expect(arrow(page, 'next')).toBeFocused();
  await arrow(page, 'previous').click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.moveCompose);
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
  await expect(current(page).locator('[data-scene-el="tray-7"]')).toHaveCSS('opacity', '0');
  await next.click();
  await expect(next).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(root(page)).toBeFocused();
  await expect(
    current(page).getByRole('button', { name: controls.pause, exact: true }),
  ).toBeVisible();
  await expect.poll(() => stepIds(page)).toContain('move-compose-step-0');
});

test('HP-1 AD-11 resize refits the stage; each scene has the stage height it needs; an unchanged card width does not restart the scene', async ({
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
  await expect.poll(() => stepIds(page)).toContain('move-compose-step-1');
  const first = await box();
  expect(await cardWidth()).toBeGreaterThanOrEqual(32);
  await markLive(page);
  // 361 px: content 329, the floor(content / 8 - 4) card width is still 37: no refit.
  await page.setViewportSize({ width: 361, height: 740 });
  await page.waitForTimeout(300);
  expect(await reEntered(page)).toBe(false);
  await dotOf(page, 5).click();
  const other = await box();
  // Scoring (tall WordCell stacks) is taller than move-compose, at the same width: at 360 x 740
  // neither is capped by height (on a short window each scene fits its own width, decision D7).
  expect(other.height).toBeGreaterThan(first.height);
  expect(other.width).toBeCloseTo(first.width, 0);
  await expect.poll(() => stepIds(page), { timeout: 30_000 }).toContain('scoring-step-1');
  await markLive(page);
  await page.setViewportSize({ width: 412, height: 740 });
  await expect.poll(() => reEntered(page)).toBe(true);
  const wider = await box();
  expect(wider.width).toBeGreaterThan(first.width);
  expect(await cardWidth()).toBeGreaterThanOrEqual(32);
  await dotOf(page, 2).click();
  // Free-letter has the shortest columns and a one-card WordCell band.
  expect((await box()).height).toBeLessThan(wider.height);
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
  await dotOf(page, 5).scrollIntoViewIfNeeded();
  await dotOf(page, 5).click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.scoring);
  await arrow(page, 'previous').click();
  await expect(current(page)).toHaveAccessibleName(text.howTo.scenes.sourceDrop);
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
    await expect(dotOf(page, 5)).toBeVisible();
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
    expect(geometry.dots).toHaveLength(5);
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
  context,
}) => {
  await recordSceneAnimations(page);
  await openFixture(page, 'session-idle-fresh', { prefs: 'prefs-fast' });
  await openPanel(page);
  await expect.poll(() => stepIds(page)).toContain('move-compose-step-0');
  expect(await stepIds(page)).not.toContain('move-compose-step-2');
  await expect.poll(async () => (await tailLiftMs(page)).length).toBeGreaterThan(0);
  const fast = (await tailLiftMs(page))[0];
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await openPanel(page);
  await expect.poll(() => stepIds(page)).toContain('move-compose-step-0');
  expect(await stepIds(page)).not.toContain('move-compose-step-2');
  await expect.poll(async () => (await tailLiftMs(page)).length).toBeGreaterThan(1);
  const reopened = (await tailLiftMs(page))[1];
  expect(reopened).toBe(fast);
  // The slower seeded speed's step is longer, so the scene key carries baseMs.
  const slowPage = await context.newPage();
  await recordSceneAnimations(slowPage);
  await openFixture(slowPage, 'session-idle-fresh', { prefs: 'prefs-non-default' });
  await openPanel(slowPage);
  await expect.poll(async () => (await tailLiftMs(slowPage)).length).toBeGreaterThan(0);
  const slow = (await tailLiftMs(slowPage))[0];
  expect(fast).toBeGreaterThan(0);
  expect(slow).toBeGreaterThan(fast);
  // BASE_MS: Slow 320 against Fast 90.
  expect(slow / fast).toBeCloseTo(320 / 90);
});

// Owner decision D6 (2026-10-22; AD-11): on a short window the stage fits the height left below
// the arrows and dots, so every scene's whole stage shows in the panel without scrolling; each
// scene keeps its own card width (owner decision D7).
test('HP-1 AD-11 on a short window every scene’s whole stage fits below the carousel controls without scrolling, at its own card width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 560 });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const content = panel(page).locator('.content');
  const widths = new Map<SceneKey, number>();
  for (const [i, key] of sceneOrder.entries()) {
    await dotOf(page, i + 1).click();
    const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[key] });
    await expect(figure).toBeVisible();
    await content.evaluate((el) => {
      el.scrollTop = 0;
    });
    const stage = figure.locator('[data-scene-el="stage"]');
    const box = await stage.boundingBox();
    const scroller = await content.boundingBox();
    if (box === null || scroller === null) throw new Error('no box');
    expect(box.y + box.height, key).toBeLessThanOrEqual(scroller.y + scroller.height + 0.5);
    // The fitted card width: the stage is the base slot (44 px) scaled to the card's slot (w + 4).
    const w = await stage.evaluate(
      (el) =>
        Math.round((el.getBoundingClientRect().width / (el as HTMLElement).offsetWidth) * 44) - 4,
    );
    expect(w, key).toBeGreaterThanOrEqual(32);
    expect(w, key).toBeLessThanOrEqual(52);
    widths.set(key, w);
  }
  // The width alone gives 52 px cards (448 px content); the tall scenes are capped below it by
  // the height left under the controls, the short free-letter one is not (per-scene widths, D7).
  expect(widths.get('scoring')).toBeLessThan(52);
  expect(widths.get('moveCompose')).toBeLessThan(52);
  expect(widths.get('freeLetter')).toBeGreaterThan(widths.get('scoring') ?? 0);
});

// Owner decision D12 (2026-10-22; DESIGN.md: no text under 11 px): at the 32 px landscape floor the
// stage is scaled below its base size, and its text (WordCell numbers, score figures, controls, the
// ×2 badge, the strip marks) is counter-scaled to render at 11 px or more.
test('HP-1 AD-11 at the 32 px landscape floor every scene’s text renders at 11 px or more', async ({
  page,
}) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-fresh');
  await openPanel(page);
  const seen = new Set<string>();
  for (const [i, key] of sceneOrder.entries()) {
    await dotOf(page, i + 1).click();
    const figure = panel(page).getByRole('figure', { name: text.howTo.scenes[key] });
    await expect(figure).toBeVisible();
    // The fitted card is the 32 px floor: the stage is scaled to a 36 px slot over its 44 px base.
    const scale = await figure
      .locator('[data-scene-el="stage"]')
      .evaluate((el) => el.getBoundingClientRect().width / (el as HTMLElement).offsetWidth);
    expect(scale * 44 - 4, key).toBeCloseTo(32, 1);
    // Step through every frame: each draws its own layer's text.
    for (;;) {
      const sizes = await figure.locator('[data-scene-el="stage"]').evaluate((stage) => {
        const scale = stage.getBoundingClientRect().width / (stage as HTMLElement).offsetWidth;
        const texts = stage.querySelectorAll('.num, .figure, .ctl, .badge, .mark');
        return [...texts]
          .filter((el) => el.textContent?.trim() && getComputedStyle(el).display !== 'none')
          .map((el) => ({
            what: `${['num', 'figure', 'ctl', 'badge', 'mark'].find((c) => el.classList.contains(c))} ${el.textContent}`,
            px: Number.parseFloat(getComputedStyle(el).fontSize) * scale,
            scale,
          }));
      });
      for (const { what, px, scale } of sizes) {
        expect(scale).toBeLessThan(1);
        expect(px, `${key} ${what}`).toBeGreaterThanOrEqual(10.99);
        seen.add(what.split(' ')[0]);
      }
      const next = figure.getByRole('button', { name: controls.next, exact: true });
      if ((await next.count()) === 0) break;
      await next.click();
    }
  }
  expect([...seen].sort()).toEqual(['badge', 'ctl', 'figure', 'mark', 'num']);
});
