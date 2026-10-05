import { expect, type Locator, type Page, test } from '@playwright/test';
import { wc } from './helpers/dialogs';
import { animationFrames, hidePage, showPage } from './helpers/lifecycle';
import { booted } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';
import { tokenColor } from './helpers/style';
import { type TouchHold, touchHold } from './helpers/touch';

// Epic 4 entry 9: drag interruptions (SPEC CAP-4, CAP-7, F13, F24, F28; AD-9, AD-12, AD-13, AD-16,
// AD-17; build-notes CAP-4 AD-17 hide case and Cancel-first P4). A pick-up drag started with a
// tail selected replaces it (`wc-selection-suppressed` on `<main>` mid-drag); hide, back, Undo and
// a platform pointercancel end a held drag. Helpers are local copies of e2e/drag.spec.ts and
// e2e/tap.spec.ts. `session-idle-fresh` columns hold 7/7/7/7/6/6/6/6 cards;
// `session-idle-empty-column` has column 1 empty with Undo enabled.

type Point = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };
type Selection = { column: number; count: number } | null;

const SUPPRESSED = 'wc-selection-suppressed';

const onAndroid = () =>
  test.skip(test.info().project.name !== 'android', 'touch drag flows run on android');
const onDesktop = () =>
  test.skip(test.info().project.name !== 'desktop', 'mouse drag flows run on desktop');

async function openFixture(page: Page, name: string, prefs?: string): Promise<void> {
  await seedStorage(page, {
    session: fixture(`${name}.json`),
    ...(prefs === undefined ? {} : { prefs: fixture(`${prefs}.json`) }),
  });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await booted(page);
}

const column = (page: Page, n: number) => page.getByTestId(`column-${n}`);
const cards = (page: Page, n: number) => column(page, n).locator('[data-place="column"]');
const foot = (page: Page, n: number) => page.getByTestId(`foot-${n}`);
const faceOf = (card: Locator) => card.locator(':scope > .face');
const outline = (page: Page) => page.locator('[data-selection-outline]');
const here = (page: Page, n: number) => foot(page, n).locator('.here');

async function box(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (b === null) throw new Error('element has no box');
  return { x: b.x, y: b.y, w: b.width, h: b.height };
}

async function centre(locator: Locator): Promise<Point> {
  const b = await box(locator);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

const idOf = async (card: Locator) => Number(await card.getAttribute('data-card-id'));
const plus = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy });

// `steps` points from `from` (excluded) to `to` (included).
function path(from: Point, to: Point, steps: number): Point[] {
  return Array.from({ length: steps }, (_, i) => ({
    x: from.x + ((to.x - from.x) * (i + 1)) / steps,
    y: from.y + ((to.y - from.y) * (i + 1)) / steps,
  }));
}

// One held touch moved to each point in turn, a frame after each move.
async function holdThrough(page: Page, from: Point, points: Point[]): Promise<TouchHold> {
  const hold = await touchHold(page, from);
  try {
    for (const p of points) {
      await hold.moveTo(p);
      await animationFrames(page, 2);
    }
  } catch (error) {
    await hold.end();
    throw error;
  }
  return hold;
}

async function tapAt(page: Page, p: Point): Promise<void> {
  if (test.info().project.name === 'android') await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
}

// The rendered selection: the outline's column and its lifted cards (e2e/tap.spec.ts).
function selection(page: Page): Promise<Selection> {
  return page.evaluate(() => {
    const outlines = document.querySelectorAll('[data-selection-outline]');
    if (outlines.length > 1) throw new Error('more than one selection outline');
    const found = outlines[0];
    if (found === undefined) {
      if (document.querySelector('.lifted') !== null) throw new Error('lifted without outline');
      return null;
    }
    const col = found.closest('[data-column]');
    if (col === null) throw new Error('outline outside a column');
    return {
      column: Number(col.getAttribute('data-column')),
      count: col.querySelectorAll('[data-place="column"].lifted').length,
    };
  });
}

const wcOf = async (page: Page) => (await wc(page))?.wc;

async function expectSelection(page: Page, expected: Selection, entries: number): Promise<void> {
  await expect.poll(() => selection(page)).toEqual(expected);
  await expect.poll(() => wcOf(page)).toBe(entries);
}

async function select(page: Page, n: number, i: number): Promise<void> {
  await tapAt(page, await centre(cards(page, n).nth(i)));
  const count = await cards(page, n).count();
  await expectSelection(page, { column: n, count: count - i }, 1);
}

// Stashes the store's Session reference.
async function stashSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    window.__pointerSession = current.session;
  });
}

function sameSession(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session === window.__pointerSession;
  });
}

// The store's Session without `activeMs` (a hide flush accrues time into a new reference).
function game(page: Page): Promise<string> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return JSON.stringify({ ...current.session, activeMs: 0 });
  });
}

// The stored wordcell:session without `activeMs`.
function storedGame(page: Page): Promise<string> {
  return page.evaluate(() => {
    const text = localStorage.getItem('wordcell:session');
    if (text === null) throw new Error('wordcell:session is absent');
    return JSON.stringify({ ...JSON.parse(text), activeMs: 0 });
  });
}

const activeMs = (page: Page) =>
  page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session.activeMs;
  });

const cursorIndex = (page: Page) =>
  page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session.cursor.index;
  });

// Every element with a `wc-drag-*` class, and every face with an inline transform.
function dragResidue(page: Page): Promise<{ classes: number; transforms: number }> {
  return page.evaluate(() => ({
    classes: [...document.querySelectorAll('*')].filter((el) =>
      [...el.classList].some((c) => c.startsWith('wc-drag-')),
    ).length,
    transforms: [...document.querySelectorAll<HTMLElement>('.face')].filter(
      (el) => el.style.transform !== '',
    ).length,
  }));
}

async function expectNoResidue(page: Page): Promise<void> {
  await expect.poll(() => dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
}

// The `data-column`s of elements carrying `wc-drag-target`.
function targets(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.wc-drag-target')].map((el) =>
      Number(el.closest('[data-column]')?.getAttribute('data-column')),
    ),
  );
}

const suppressed = (page: Page) =>
  page.evaluate((c) => document.querySelector('main')?.classList.contains(c) === true, SUPPRESSED);
const css = (locator: Locator, property: string) =>
  locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);
const runningAnimations = (locator: Locator) => locator.evaluate((el) => el.getAnimations().length);

// R-14 the tail returned: no running animation and back on `rest` (±1 px).
async function expectFlownBack(face: Locator, rest: Box): Promise<void> {
  await expect.poll(() => runningAnimations(face)).toBe(0);
  const now = await box(face);
  for (const k of ['x', 'y', 'w', 'h'] as const) {
    expect(Math.abs(now[k] - rest[k]), k).toBeLessThanOrEqual(1);
  }
}

// The fly-back spy (e2e/drag.spec.ts): logs the card id of every `.face` an `animate` call targets.
async function recordFlyBack(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const ids: number[] = [];
    (window as unknown as { __flyBack: number[] }).__flyBack = ids;
    const original = Element.prototype.animate;
    Element.prototype.animate = function animate(this: Element, keyframes, options) {
      if (this.classList.contains('face')) {
        ids.push(Number(this.parentElement?.getAttribute('data-card-id')));
      }
      return original.call(this, keyframes, options);
    };
  });
}

const flyBackIds = (page: Page) =>
  page.evaluate(() => (window as unknown as { __flyBack: number[] }).__flyBack);

test.describe('android', () => {
  test.beforeEach(onAndroid);

  // C-E4b proof (build-notes CAP-4 AD-17 hide case).
  test('AD-9 AD-16 AD-17 hidePage mid-touchHold drag cancels it first: wordcell:session written once, tail back, Session unchanged, time resumes only after showPage', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const before = await game(page);
    await armStorageSpy(page);
    const dragged = cards(page, 1).last();
    const rest = await box(faceOf(dragged));
    const from = await centre(dragged);
    const to = await centre(cards(page, 3).last());
    const hold = await holdThrough(page, from, path(from, to, 5));
    let hiddenMs: number;
    try {
      expect(await targets(page)).toEqual([3]);
      await hidePage(page);
      const writes = await storageWrites(page);
      expect(writes.map((w) => w.key)).toEqual(['wordcell:session']);
      hiddenMs = (JSON.parse(writes[0]?.value ?? 'null') as { activeMs: number }).activeMs;
      // AD-16 Board half: main.ts's before-hide hook cancelled the drag (snap, no fly-back).
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      await hold.moveTo(plus(to, 0, 10));
      await animationFrames(page, 2);
      expect(await targets(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await game(page)).toBe(before);
    expect(await storedGame(page)).toBe(before);
    expect(await storageWrites(page)).toHaveLength(1);
    await expectNoResidue(page);
    await expectFlownBack(faceOf(dragged), rest);
    // R-76: hidden time accrues nothing; the clock resumes with showPage.
    await page.waitForTimeout(2000);
    expect(await activeMs(page)).toBe(hiddenMs);
    await showPage(page);
    await page.waitForTimeout(300);
    await hidePage(page);
    const writes = await storageWrites(page);
    expect(writes).toHaveLength(2);
    const later = (JSON.parse(writes[1]?.value ?? 'null') as { activeMs: number }).activeMs;
    expect(later - hiddenMs).toBeGreaterThanOrEqual(290);
    // Any counted hidden time (2 s) would give ≥ 2290; 2000 leaves room for load.
    expect(later - hiddenMs).toBeLessThan(2000);
  });

  test('AD-13 F24 select, drag from another column, hidePage, showPage: nothing selected at wc 0', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 1, 4);
    const before = await game(page);
    const dragged = cards(page, 2).last();
    const rest = await box(faceOf(dragged));
    const from = await centre(dragged);
    const to = await centre(cards(page, 3).last());
    const hold = await holdThrough(page, from, path(from, to, 5));
    try {
      expect(await targets(page)).toEqual([3]);
      expect(await suppressed(page)).toBe(true);
      await hidePage(page);
      expect(await suppressed(page)).toBe(false);
      await hold.moveTo(plus(to, 0, 10));
      await animationFrames(page, 2);
      expect(await targets(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    await showPage(page);
    await expectSelection(page, null, 0);
    expect(page.url()).not.toBe('about:blank');
    await animationFrames(page, 2);
    expect(await game(page)).toBe(before);
    expect(await storedGame(page)).toBe(before);
    await expectNoResidue(page);
    await expectFlownBack(faceOf(dragged), rest);
  });

  test('AD-13 R1 select, drag, back: the tail flies back, nothing selected, app open at wc 0', async ({
    page,
  }) => {
    await recordFlyBack(page);
    await openFixture(page, 'session-idle-fresh');
    await select(page, 1, 4);
    await stashSession(page);
    const dragged = cards(page, 2).last();
    const draggedId = await idOf(dragged);
    const rest = await box(faceOf(dragged));
    const from = await centre(dragged);
    const to = await centre(cards(page, 3).last());
    const hold = await holdThrough(page, from, path(from, to, 5));
    try {
      expect(await targets(page)).toEqual([3]);
      expect(await flyBackIds(page)).toEqual([]);
      await page.goBack();
      // main.ts's before-back hook: cancel({ byBack: true }) flies the tail back.
      await expect.poll(() => flyBackIds(page)).toEqual([draggedId]);
      expect(await targets(page)).toEqual([]);
      await expectSelection(page, null, 0);
      expect(page.url()).not.toBe('about:blank');
      await hold.moveTo(plus(to, 0, 10));
      await animationFrames(page, 2);
      expect(await targets(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await sameSession(page)).toBe(true);
    await expectSelection(page, null, 0);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await expectFlownBack(faceOf(dragged), rest);
    expect(await css(faceOf(dragged), 'transform')).toBe('none');
    await expectNoResidue(page);
    expect(await suppressed(page)).toBe(false);
  });

  test('AD-13 F28 a synthetic pointercancel restores the selection after the fly-back', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await page.evaluate(() => {
      document.addEventListener(
        'pointerdown',
        (event) => {
          (window as unknown as { __pointerId: number }).__pointerId = event.pointerId;
        },
        { capture: true },
      );
    });
    await select(page, 1, 4);
    await stashSession(page);
    const teal = await tokenColor(page, '--wc-accent-teal');
    const lifted = faceOf(cards(page, 1).nth(4));
    const liftedTransform = await css(lifted, 'transform');
    expect(liftedTransform).not.toBe('none');
    const dragged = cards(page, 2).last();
    const draggedId = await idOf(dragged);
    const rest = await box(faceOf(dragged));
    const from = await centre(dragged);
    const to = await centre(cards(page, 3).last());
    const hold = await holdThrough(page, from, path(from, to, 5));
    try {
      expect(await targets(page)).toEqual([3]);
      expect(await suppressed(page)).toBe(true);
      // The platform cancel on the element holding the capture (SPEC F28 recipe).
      const captured = await page.evaluate(() => {
        const id = (window as unknown as { __pointerId: number }).__pointerId;
        const el = [...document.querySelectorAll('*')].find((e) => e.hasPointerCapture(id));
        if (el === undefined) throw new Error(`no element holds pointer ${id}`);
        el.dispatchEvent(new PointerEvent('pointercancel', { pointerId: id, bubbles: true }));
        return Number(el.getAttribute('data-card-id'));
      });
      expect(captured).toBe(draggedId);
      await expectFlownBack(faceOf(dragged), rest);
      await expect.poll(() => suppressed(page)).toBe(false);
      await expectSelection(page, { column: 1, count: 3 }, 1);
      expect(await css(outline(page), 'outline-style')).toBe('solid');
      expect(await css(outline(page), 'outline-width')).toBe('2px');
      expect(await css(outline(page), 'outline-color')).toBe(teal);
      await expect(here(page, 1)).toBeVisible();
      await expect.poll(() => css(lifted, 'transform')).toBe(liftedTransform);
      // The rest of that pointer is ignored: no highlight, no drop.
      await hold.moveTo(await centre(cards(page, 4).last()));
      await animationFrames(page, 2);
      expect(await targets(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await sameSession(page)).toBe(true);
    await expectSelection(page, { column: 1, count: 3 }, 1);
    await page.goBack();
    await expectSelection(page, null, 0);
    expect(page.url()).not.toBe('about:blank');
  });

  test('AD-12 F24 a drag from the source column of a selection lifts one tail', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const bottom = cards(page, 1).last();
    // The unlifted slot: the tail ends with nothing selected.
    const rest = await box(faceOf(bottom));
    await select(page, 1, 4);
    await stashSession(page);
    // Lifted and `Here` shown before the drag, so the mid-drag checks prove suppression.
    for (const i of [4, 5]) {
      expect(await css(faceOf(cards(page, 1).nth(i)), 'transform'), `card ${i}`).not.toBe('none');
    }
    await expect(here(page, 1)).toHaveCount(1);
    await expect(here(page, 1)).toBeVisible();
    const bottomId = await idOf(bottom);
    const from = await centre(bottom);
    const cell = await centre(page.getByTestId('wordcell-6'));
    const hold = await holdThrough(page, from, path(from, cell, 5));
    try {
      expect(await targets(page)).toEqual([]);
      expect(await suppressed(page)).toBe(true);
      for (const i of [4, 5]) {
        expect(await css(faceOf(cards(page, 1).nth(i)), 'transform'), `card ${i}`).toBe('none');
        expect(await css(faceOf(cards(page, 1).nth(i)), 'box-shadow'), `card ${i}`).toBe('none');
      }
      // The dragged face is exempt: drag layer z-index and shadow.
      expect(await css(faceOf(bottom), 'z-index')).toBe('5');
      expect(await css(faceOf(bottom), 'box-shadow')).not.toBe('none');
      expect(await css(foot(page, 1), 'background-color')).toBe('rgba(0, 0, 0, 0)');
      expect(await css(foot(page, 1), 'background-image')).toBe('none');
      expect(await css(outline(page), 'display')).toBe('none');
      await expect(here(page, 1)).toBeHidden();
      const feet = await page.locator('.foot.target').evaluateAll((els) =>
        els.map((el) => {
          const s = getComputedStyle(el);
          return [s.backgroundColor, s.backgroundImage, s.borderTopColor];
        }),
      );
      expect(feet).toHaveLength(7);
      for (const f of feet) expect(f).toEqual(['rgba(0, 0, 0, 0)', 'none', 'rgba(0, 0, 0, 0)']);
      const layer = await page
        .locator('.wc-drag-layer')
        .evaluateAll((els) => els.map((el) => Number(el.parentElement?.dataset.cardId)));
      expect(layer).toEqual([bottomId]);
    } finally {
      await hold.end();
    }
    await expect.poll(() => suppressed(page)).toBe(false);
    await expectSelection(page, null, 0);
    expect(await sameSession(page)).toBe(true);
    await expectFlownBack(faceOf(bottom), rest);
    await expectNoResidue(page);
  });

  test('AD-12 R2 Undo during a held drag returns the tail before it undoes', async ({ page }) => {
    await openFixture(page, 'session-idle-empty-column');
    const index = await cursorIndex(page);
    const dragged = cards(page, 2).last();
    const from = await centre(dragged);
    const to = await centre(cards(page, 3).last());
    const hold = await holdThrough(page, from, path(from, to, 5));
    try {
      expect(await targets(page)).toEqual([3]);
      await page.getByTestId('undo').dispatchEvent('click');
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      await expect.poll(() => cursorIndex(page)).toBe(index - 1);
      await stashSession(page);
      await hold.moveTo(plus(to, 0, 10));
      await animationFrames(page, 2);
      expect(await targets(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await sameSession(page)).toBe(true);
    await expectNoResidue(page);
  });

  test('AD-12 F13 Undo during a fly-back acts on the settled layout', async ({ page }) => {
    await openFixture(page, 'session-idle-empty-column', 'prefs-non-default');
    const index = await cursorIndex(page);
    const dragged = cards(page, 2).last();
    const draggedId = await idOf(dragged);
    const from = await centre(dragged);
    const cell = await centre(page.getByTestId('wordcell-6'));
    const hold = await holdThrough(page, from, path(from, cell, 5));
    expect(await targets(page)).toEqual([]);
    // One-shot hook: the fly-back's `animate` on the dragged face queues a microtask (after the
    // controller's pointerup listener returns) that records the running animations and clicks Undo.
    await page.evaluate((id) => {
      const w = window as unknown as { __undoInFlight?: number };
      const original = Element.prototype.animate;
      Element.prototype.animate = function animate(this: Element, keyframes, options) {
        const animation = original.call(this, keyframes, options);
        if (this.parentElement?.getAttribute('data-card-id') === String(id)) {
          Element.prototype.animate = original;
          queueMicrotask(() => {
            w.__undoInFlight = this.getAnimations().length;
            const undo = document.querySelector<HTMLElement>('[data-testid="undo"]');
            if (undo === null) throw new Error('no Undo button');
            undo.click();
          });
        }
        return animation;
      };
    }, draggedId);
    await hold.end();
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __undoInFlight?: number }).__undoInFlight),
      )
      .toBeGreaterThan(0);
    const face = faceOf(page.getByTestId(`card-${draggedId}`));
    expect(await runningAnimations(face)).toBe(0);
    expect(await css(face, 'transform')).toBe('none');
    await expect.poll(() => cursorIndex(page)).toBe(index - 1);
    await expectNoResidue(page);
  });

  test('AD-12 CAP-4 an inert 20 px drag from another column’s foot pad keeps the selection', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 1, 4);
    await stashSession(page);
    const f = await box(foot(page, 3));
    const from = { x: f.x + f.w / 2 - 10, y: f.y + f.h / 2 };
    const hold = await holdThrough(page, from, path(from, plus(from, 20, 0), 4));
    try {
      expect(await suppressed(page)).toBe(false);
      expect(await css(outline(page), 'display')).not.toBe('none');
      await expect(here(page, 1)).toBeVisible();
      expect(await css(faceOf(cards(page, 1).nth(4)), 'transform')).not.toBe('none');
      expect(await css(foot(page, 3), 'touch-action')).toBe('none');
      expect(await css(foot(page, 3), 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
      expect(await css(foot(page, 3), 'border-top-style')).toBe('dashed');
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await sameSession(page)).toBe(true);
    await expectSelection(page, { column: 1, count: 3 }, 1);
  });

  // F32: records each pointerdown's id, then dispatches pointercancel on the element holding that
  // pointer's capture (the F28 recipe above).
  async function trackPointerId(page: Page): Promise<void> {
    await page.evaluate(() => {
      document.addEventListener(
        'pointerdown',
        (event) => {
          (window as unknown as { __pointerId: number }).__pointerId = event.pointerId;
        },
        { capture: true },
      );
    });
  }
  async function cancelCaptured(page: Page): Promise<void> {
    await page.evaluate(() => {
      const id = (window as unknown as { __pointerId: number }).__pointerId;
      const el = [...document.querySelectorAll('*')].find((e) => e.hasPointerCapture(id));
      if (el === undefined) throw new Error(`no element holds pointer ${id}`);
      el.dispatchEvent(new PointerEvent('pointercancel', { pointerId: id, bubbles: true }));
    });
  }
  // Pauses the face's one running animation just before its end (or at `fraction` of it).
  const pauseNear = (face: Locator, fraction: number) =>
    face.evaluate((el, f) => {
      const [a] = el.getAnimations();
      if (a === undefined) throw new Error('no running animation');
      const ms = Number(a.effect?.getTiming().duration);
      a.pause();
      a.currentTime = ms * f;
    }, fraction);
  const finishAll = (face: Locator) =>
    face.evaluate((el) => {
      for (const a of el.getAnimations()) a.finish();
    });

  for (const reduced of [false, true]) {
    test(`AD-12 F32 a dragged selected card keeps its lift: no jump at pickup, ${reduced ? 'the reduced-motion fade shows every selected face lifted' : 'the fly-back lands on the lifted slot'}`, async ({
      page,
    }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
      await openFixture(page, 'session-idle-fresh');
      await trackPointerId(page);
      await select(page, 1, 4);
      const kept = faceOf(cards(page, 1).nth(4));
      const keptTransform = await css(kept, 'transform');
      expect(keptTransform).not.toBe('none');
      const dragged = cards(page, 1).last();
      const face = faceOf(dragged);
      const lifted = await box(face);
      const from = await centre(dragged);
      // Past the 8 px threshold, then back to the press point: a drag with zero pointer delta.
      const hold = await holdThrough(page, from, [plus(from, 0, 12), from]);
      try {
        expect(await suppressed(page)).toBe(true);
        expect((await box(face)).y).toBeCloseTo(lifted.y, 0);
        await hold.moveTo(plus(from, 0, 40));
        await animationFrames(page, 2);
        expect((await box(face)).y).toBeCloseTo(lifted.y + 40, 0);
        await cancelCaptured(page);
        // F33: mid-flight (mid-fade), the kept selection is back: outline, `Here` and the
        // non-dragged selected cards lifted.
        await pauseNear(face, 0.5);
        expect(await suppressed(page)).toBe(false);
        await expect(outline(page)).toBeVisible();
        await expect(here(page, 1)).toBeVisible();
        for (const i of [4, 5]) {
          expect(await css(faceOf(cards(page, 1).nth(i)), 'transform'), `card ${i}`).toBe(
            keptTransform,
          );
        }
        if (reduced) {
          // Mid-fade: the dragged face and the kept selected face show the same lift.
          expect((await box(face)).y).toBeCloseTo(lifted.y, 0);
          expect(await css(face, 'transform')).toBe(keptTransform);
        } else {
          // Just before the fly-back's end the face is already on its lifted slot.
          await pauseNear(face, 0.999);
          expect((await box(face)).y).toBeCloseTo(lifted.y, 0);
        }
        await finishAll(face);
        await expectFlownBack(face, lifted);
        await expect.poll(() => suppressed(page)).toBe(false);
        await expectSelection(page, { column: 1, count: 3 }, 1);
        expect(await css(face, 'transform')).toBe(keptTransform);
      } finally {
        await hold.end();
      }
      await animationFrames(page, 2);
      await expectNoResidue(page);
      await expectSelection(page, { column: 1, count: 3 }, 1);
      expect((await box(face)).y).toBeCloseTo(lifted.y, 0);
    });
  }

  test('AD-12 F32 select, drag a selected card, back: the face flies to its unlifted slot with no snap at settle', async ({
    page,
  }) => {
    await recordFlyBack(page);
    // Pauses every `.face` animation at its creation once `__pauseFaces` is set.
    await page.addInitScript(() => {
      const original = Element.prototype.animate;
      Element.prototype.animate = function animate(this: Element, keyframes, options) {
        const animation = original.call(this, keyframes, options);
        const pause = (window as unknown as { __pauseFaces?: boolean }).__pauseFaces === true;
        if (pause && this.classList.contains('face')) animation.pause();
        return animation;
      };
    });
    await openFixture(page, 'session-idle-fresh');
    const dragged = cards(page, 1).last();
    const face = faceOf(dragged);
    // The unlifted slot: back closes the selection.
    const rest = await box(face);
    await select(page, 1, 4);
    const draggedId = await idOf(dragged);
    const from = await centre(dragged);
    const hold = await holdThrough(page, from, path(from, plus(from, 0, 60), 5));
    try {
      await page.evaluate(() => {
        (window as unknown as { __pauseFaces: boolean }).__pauseFaces = true;
      });
      await page.goBack();
      await expect.poll(() => flyBackIds(page)).toEqual([draggedId]);
      await expectSelection(page, null, 0);
      // Just before the fly-back's end the face is already on its unlifted slot.
      await pauseNear(face, 0.999);
      expect((await box(face)).y).toBeCloseTo(rest.y, 0);
      await finishAll(face);
      await expectFlownBack(face, rest);
      expect(await css(face, 'transform')).toBe('none');
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    await expectNoResidue(page);
    await expectSelection(page, null, 0);
    expect((await box(face)).y).toBeCloseTo(rest.y, 0);
  });

  test('AD-12 F33 a drag from above the selection in its column is drawn evenly with no lift', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const rests = await Promise.all([4, 5, 6].map((i) => box(faceOf(cards(page, 1).nth(i)))));
    await select(page, 1, 5);
    const from = await centre(cards(page, 1).nth(4));
    // Past the 8 px threshold, then back to the press point: a drag with zero pointer delta.
    const hold = await holdThrough(page, from, [plus(from, 0, 12), from]);
    try {
      expect(await suppressed(page)).toBe(true);
      for (const [k, i] of [4, 5, 6].entries()) {
        const y = (await box(faceOf(cards(page, 1).nth(i)))).y;
        expect(y, `card ${i}`).toBeCloseTo((rests[k] as Box).y, 0);
      }
    } finally {
      await hold.end();
    }
    // A release on the never-left source deselects (entry 9).
    await expectSelection(page, null, 0);
    await expectNoResidue(page);
  });

  test('AD-12 F33 a pointercancel of a drag from above the selection flies each face to its resting slot: selected faces lifted, no snap at settle', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await trackPointerId(page);
    const faces = [4, 5, 6].map((i) => faceOf(cards(page, 1).nth(i)));
    const unlifted = await box(faces[0] as Locator);
    await select(page, 1, 5);
    const keptTransform = await css(faces[1] as Locator, 'transform');
    expect(keptTransform).not.toBe('none');
    const rests = [unlifted, await box(faces[1] as Locator), await box(faces[2] as Locator)];
    const from = await centre(cards(page, 1).nth(4));
    const hold = await holdThrough(page, from, [plus(from, 0, 12), plus(from, 0, 40)]);
    try {
      expect(await suppressed(page)).toBe(true);
      await cancelCaptured(page);
      // Just before the fly-back's end each face is already on its resting slot.
      for (const [k, face] of faces.entries()) {
        await pauseNear(face, 0.999);
        expect((await box(face)).y, `card ${k + 4}`).toBeCloseTo((rests[k] as Box).y, 0);
      }
      for (const [k, face] of faces.entries()) {
        await finishAll(face);
        await expectFlownBack(face, rests[k] as Box);
      }
      await expectSelection(page, { column: 1, count: 2 }, 1);
      for (const face of faces.slice(1)) expect(await css(face, 'transform')).toBe(keptTransform);
      expect(await css(faces[0] as Locator, 'transform')).toBe('none');
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    await expectNoResidue(page);
    await expectSelection(page, { column: 1, count: 2 }, 1);
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  test('AD-12 R2 Undo during a held mouse drag returns the tail before it undoes', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const index = await cursorIndex(page);
    const from = await centre(cards(page, 2).last());
    const to = await centre(cards(page, 3).last());
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    try {
      for (const p of path(from, to, 5)) {
        await page.mouse.move(p.x, p.y);
        await animationFrames(page, 1);
      }
      expect(await targets(page)).toEqual([3]);
      await page.getByTestId('undo').dispatchEvent('click');
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      await expect.poll(() => cursorIndex(page)).toBe(index - 1);
      await stashSession(page);
      await page.mouse.move(to.x, to.y + 10);
      await animationFrames(page, 1);
      expect(await targets(page)).toEqual([]);
    } finally {
      await page.mouse.up();
    }
    await animationFrames(page, 2);
    expect(await sameSession(page)).toBe(true);
    await expectNoResidue(page);
  });
});
