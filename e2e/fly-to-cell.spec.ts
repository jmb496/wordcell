import { expect, type Page, test } from '@playwright/test';
import { glidesSettled, openFixture } from './helpers/board';

// Ticket 5.11 (epic 5 SPEC CAP-8, F7, F28; AD-14): Confirm and a committing Redo fly the committed
// cards into the target WordCell on android, Animation speed Slow seeded (`prefs-non-default`,
// 320 ms base: 2 × base = 640 ms, stagger 30 ms). One page.evaluate clicks the button and reads the
// WAAPI animations on `.face` elements (time 0), then pauses them all and finishes them
// in landing order (`await animation.finished`), snapshotting the cells at stated points: right
// after the click, after the first landing, just before the last, after the last. Finishing makes
// the observations timing-independent. Expected values are literals from view() over the
// fixtures, never edited to pass.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'fly-to-cell runs on android');
});

const FLY_MS = 640;
const STAGGER_MS = 30;

// `preview`: a `preview` mirror (a mirror too): the Q-49 Place preview top, or from the click to
// the last landing the hold's copy of the target's new top (F28, E6); `used`: the used look
// (`.used`); `opacity`: the computed opacity of the card's face. Per WordCell, `marks` counts the
// `★` (`.preview-mark`) and `empty` is its empty-outline class.
type CellCard = {
  id: number;
  mirror: boolean;
  preview: boolean;
  used: boolean;
  opacity: string | null;
  visibility: string;
};
type Snapshot = {
  live: number;
  cells: Record<string, CellCard[]>;
  badges: Record<string, string | null>;
  marks: Record<string, number>;
  empty: Record<string, boolean>;
};
type Anim = { id: number; delay: number; duration: number; fill: string; keyframes: string[] };
type Run = {
  clickLive: number;
  anims: Anim[];
  onlyFaces: boolean;
  flightVisible: Record<number, string>;
  start: Snapshot;
  afterClick: Snapshot;
  afterFirst: Snapshot;
  beforeLast: Snapshot;
  afterLast: Snapshot;
};

// Clicks `testid` (the button), then watches the flight as described above.
function fly(page: Page, testid: string): Promise<Run> {
  return page.evaluate(async (id) => {
    const snapshot = (): Snapshot => {
      const cells: Record<string, CellCard[]> = {};
      const badges: Record<string, string | null> = {};
      const marks: Record<string, number> = {};
      const empty: Record<string, boolean> = {};
      for (const cell of document.querySelectorAll<HTMLElement>('[data-wordcell]')) {
        const n = cell.getAttribute('data-wordcell') ?? '';
        cells[n] = [...cell.children]
          .filter((el) => el.hasAttribute('data-card-id') || el.hasAttribute('data-mirror-of'))
          .map((el) => {
            const face = el.querySelector(':scope > .face');
            return {
              id: Number(el.getAttribute('data-card-id') ?? el.getAttribute('data-mirror-of')),
              mirror: el.hasAttribute('data-mirror-of'),
              preview: el.classList.contains('preview'),
              used: el.classList.contains('used'),
              opacity: face === null ? null : getComputedStyle(face).opacity,
              visibility: getComputedStyle(el).visibility,
            };
          });
        badges[n] = cell.querySelector('.count')?.textContent ?? null;
        marks[n] = cell.querySelectorAll('.preview-mark').length;
        empty[n] = cell.classList.contains('empty');
      }
      return {
        live: document.querySelectorAll('[data-card-id]').length,
        cells,
        badges,
        marks,
        empty,
      };
    };
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const waapi = () =>
      document
        .getAnimations()
        .filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition));
    const button = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    if (button === null) throw new Error(`no ${id}`);
    const start = snapshot();
    button.click();
    const afterClick = snapshot();
    const all = waapi();
    const faces = all.filter((a) => {
      const target = (a.effect as KeyframeEffect | null)?.target;
      return target instanceof HTMLElement && target.classList.contains('face');
    });
    const anims: Anim[] = faces.map((a) => {
      const effect = a.effect as KeyframeEffect;
      const timing = effect.getTiming();
      const wrapper = (effect.target as HTMLElement).parentElement as HTMLElement;
      return {
        id: Number(wrapper.getAttribute('data-card-id')),
        delay: Number(timing.delay),
        duration: Number(timing.duration),
        fill: String(timing.fill),
        keyframes: effect.getKeyframes().map((k) => String(k.transform ?? k.opacity)),
      };
    });
    const flightVisible: Record<number, string> = {};
    for (const anim of anims) {
      const wrapper = document.querySelector<HTMLElement>(`[data-card-id="${anim.id}"]`);
      if (wrapper !== null) flightVisible[anim.id] = getComputedStyle(wrapper).visibility;
    }
    for (const a of faces) a.pause();
    const order = faces
      .map((a, i) => ({ a, anim: anims[i] as Anim }))
      .sort((x, y) => x.anim.delay - y.anim.delay);
    const seek = async (entry: { a: Animation; anim: Anim }) => {
      entry.a.finish();
      await entry.a.finished;
      await frame();
    };
    const first = order[0];
    const last = order[order.length - 1];
    let afterFirst = afterClick;
    let beforeLast = afterClick;
    let afterLast = afterClick;
    if (first !== undefined && last !== undefined) {
      await seek(first);
      afterFirst = snapshot();
      for (const entry of order.slice(1, -1)) {
        await seek(entry);
      }
      beforeLast = snapshot();
      if (last !== first) {
        await seek(last);
      }
      afterLast = snapshot();
    }
    return {
      clickLive: afterClick.live,
      anims,
      onlyFaces: all.length === faces.length,
      flightVisible,
      start,
      afterClick,
      afterFirst,
      beforeLast,
      afterLast,
    };
  }, testid);
}

const ids = (cards: CellCard[] | undefined) => (cards ?? []).map((c) => c.id);
// The cell's card elements without the Q-49 `preview` mirror.
const nonPreview = (cards: CellCard[] | undefined) => (cards ?? []).filter((c) => !c.preview);
const shown = (cards: CellCard[] | undefined) =>
  (cards ?? [])
    .filter((c) => c.visibility !== 'hidden')
    .map((c) => `${c.preview ? 'p' : c.mirror ? 'm' : ''}${c.id}`);

// No `★` in any WordCell (E6: it goes at commit).
function expectNoMarks(snap: Snapshot): void {
  for (const [n, count] of Object.entries(snap.marks)) expect(count, `wordcell ${n}`).toBe(0);
}
// No used mirror (the *used this word* look) in any WordCell.
function expectNoUsedMirror(snap: Snapshot): void {
  for (const [n, cards] of Object.entries(snap.cells))
    expect(
      cards.filter((c) => c.mirror && !c.preview),
      `wordcell ${n}`,
    ).toEqual([]);
}
// The hold's copy of the new top at the click: no used look, its face at full opacity.
function expectCopyAtClick(run: Run, cell: string, newTop: number): void {
  const copies = (run.afterClick.cells[cell] ?? []).filter((c) => c.preview);
  expect(copies.map((c) => c.id)).toEqual([newTop]);
  expect(copies[0]?.used).toBe(false);
  expect(copies[0]?.opacity).toBe('1');
}

// The shared flight checks (Confirm and a committing Redo): only the committed faces animate
// bottom first, every flying card visible, 52 live elements; from the click until the last
// landing the target draws the held copy of its new top first, then the committed cards, never a
// card before the committed run or a used mirror, and no WordCell draws the `★`; after the last
// landing only the live new top. `cell` is the target WordCell, `committed` its new cards
// bottom → top, `before` its card ids at the click.
function expectFlight(run: Run, cell: string, committed: number[], before: number[]): void {
  expect(run.onlyFaces).toBe(true);
  expect(run.clickLive).toBe(52);
  expect(run.anims.map((a) => a.id)).toEqual(committed);
  run.anims.forEach((a, i) => {
    expect(a.duration).toBe(FLY_MS);
    expect(a.delay).toBe(i * STAGGER_MS);
    expect(a.fill).toBe('backwards');
    expect(a.keyframes[1]).toBe('translate(0px, 0px)');
  });
  for (const anim of run.anims)
    expect(run.flightVisible[anim.id], `card ${anim.id}`).toBe('visible');
  const newTop = committed[committed.length - 1] as number;
  // In Place the target draws its Q-49 preview: one `preview` mirror of the last committed card.
  expect(ids(nonPreview(run.start.cells[cell]))).toEqual(before);
  expect((run.start.cells[cell] ?? []).filter((c) => c.preview).map((c) => c.id)).toEqual([newTop]);
  expect(ids(run.afterClick.cells[cell])).toEqual([newTop, ...before, ...committed]);
  // F28, E6: the copy of the new top first, then every committed card, at the click, after the
  // first landing and just before the last; the last landing leaves only the live new top.
  const held = [`p${newTop}`, ...committed.map(String)];
  const flight = [run.afterClick, run.afterFirst, run.beforeLast, run.afterLast];
  for (const snap of [run.afterClick, run.afterFirst, run.beforeLast]) {
    expect(shown(snap.cells[cell])).toEqual(held);
    expect(snap.empty[cell]).toBe(false);
  }
  expect(shown(run.afterLast.cells[cell])).toEqual([`${newTop}`]);
  expect((run.afterLast.cells[cell] ?? []).filter((c) => c.mirror)).toEqual([]);
  expectCopyAtClick(run, cell, newTop);
  for (const snap of [run.start, ...flight]) expectNoUsedMirror(snap);
  for (const snap of flight) {
    expectNoMarks(snap);
    expect(snap.live).toBe(52);
  }
  expect(run.afterClick.badges[cell]).toBe(String(before.length + committed.length));
  expect(run.afterLast.badges[cell]).toBe(String(before.length + committed.length));
}

test('AD-14 F28 Q-49 Confirm on session-place: only the committed faces animate, staggered bottom first, every flying card visible, 52 live elements, the held copy of the new top and the landed cards shown until the last landing, then the non-top committed cards hide together', async ({
  page,
}) => {
  await openFixture(page, 'session-place', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  expectFlight(run, '3', [42, 0, 28], []);
  expect(shown(run.afterClick.cells['3'])).toEqual(['p28', '42', '0', '28']);
  expect(shown(run.afterLast.cells['3'])).toEqual(['28']);
  await glidesSettled(page);
});

test('AD-14 F28 Q-49 Confirm onto a non-empty cell on session-place-onto-committed, and its committing Redo: the held copy of the new top is the base until the last landing, the previous top and the cards beneath never show, then only the new top is shown', async ({
  page,
}) => {
  await openFixture(page, 'session-place-onto-committed', { prefs: 'prefs-non-default' });
  // Cell 3 holds TAN (42, 0, 28) from the first move; AIM (2, 19, 26) lands on it.
  for (const button of ['primary-action', 'redo']) {
    const run = await fly(page, button);
    expectFlight(run, '3', [2, 19, 26], [42, 0, 28]);
    expect(shown(run.start.cells['3'])).toEqual(['p26']);
    expect(shown(run.afterClick.cells['3'])).toEqual(['p26', '2', '19', '26']);
    expect(shown(run.afterLast.cells['3'])).toEqual(['26']);
    await glidesSettled(page);
    if (button === 'primary-action') {
      await page.getByTestId('undo').click();
      await glidesSettled(page);
    }
  }
});

test('AD-14 F28 Q-49 Confirm into the free letter own cell on session-place-free-letter-redo-tail: the held copy of the new top 28 is the base until the last landing, the cards beneath (42, 0) never show, no used mirror, 52 live elements', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  // Q-49: in Place the used target previews its own free letter 28 (no used mirror).
  expect(shown(run.start.cells['3'])).toEqual(['p28']);
  // Cell 3 holds TAN (42, 0, 28); 28 is the free letter, so 42 and 0 lie beneath the committed run.
  expectFlight(run, '3', [9, 32, 28], [42, 0]);
  expect(shown(run.afterClick.cells['3'])).toEqual(['p28', '9', '32', '28']);
  await glidesSettled(page);
});

test('AD-14 F28 Q-49 Confirm on session-place-free-letter-two-cards into another cell: the source cell shows its beneath card at every snapshot, the target cell holds the copy of the new top under the five committed cards and only the top is shown after the last landing', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-two-cards', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  // Q-49: source cell 4 previews its card beneath, 20 (no element for 28, the free letter, which
  // leaves for cell 5); target 5 previews the strip's last card 42.
  expect(ids(run.start.cells['4'])).toEqual([20]);
  expect(shown(run.start.cells['4'])).toEqual(['20']);
  for (const snap of [run.afterClick, run.afterFirst, run.beforeLast, run.afterLast]) {
    expect(ids(snap.cells['4'])).toEqual([20]);
    expect(shown(snap.cells['4'])).toEqual(['20']);
  }
  expect(shown(run.start.cells['5'])).toEqual(['p42']);
  expectFlight(run, '5', [26, 32, 45, 28, 42], []);
  expect(shown(run.afterClick.cells['5'])).toEqual(['p42', '26', '32', '45', '28', '42']);
  await glidesSettled(page);
});

test('AD-14 F28 Q-49 Confirm on session-place-used-cells into empty cell 5: used single-card source cell 3 stays drawn empty and used source cell 6 shows 31 at every snapshot, the target holds the copy of the new top 38 under the committed cards', async ({
  page,
}) => {
  await openFixture(page, 'session-place-used-cells', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  expectFlight(run, '5', [26, 19, 27, 32, 38], []);
  expect(shown(run.afterClick.cells['5'])).toEqual(['p38', '26', '19', '27', '32', '38']);
  for (const snap of [run.start, run.afterClick, run.afterFirst, run.beforeLast, run.afterLast]) {
    expect(shown(snap.cells['3'])).toEqual([]);
    expect(snap.empty['3']).toBe(true);
    expect(shown(snap.cells['6'])).toEqual(['31']);
  }
  await glidesSettled(page);
});

test('AD-14 F28 Q-49 Undo before a card has started acts on the settled layout and leaves nothing held; a Redo of the commit flies the same way', async ({
  page,
}) => {
  await openFixture(page, 'session-place', { prefs: 'prefs-non-default' });
  // Undo in the click task of Confirm: no card has landed, the last has not started.
  const undone = await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-testid="primary-action"]')?.click();
    const running = document.getAnimations().length;
    document.querySelector<HTMLElement>('[data-testid="undo"]')?.click();
    return { running };
  });
  expect(undone.running).toBeGreaterThan(0);
  await glidesSettled(page);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(page.locator('[data-wordcell] [data-mirror-of]:not(.preview)')).toHaveCount(0);
  await expect(page.getByTestId('wordcell-3').locator('.preview[data-mirror-of="28"]')).toHaveCount(
    1,
  );
  // The `★` is back on the restored Place preview.
  await expect(
    page.getByTestId('wordcell-3').locator('.preview[data-mirror-of="28"] .preview-mark'),
  ).toHaveCount(1);
  await expect(page.getByTestId('primary-action')).toHaveText('Confirm');
  // Nothing is held: every non-top card in every WordCell is hidden again.
  const heldVisible = await page.evaluate(
    () =>
      [...document.querySelectorAll('[data-wordcell]')].flatMap((cell) =>
        [...cell.querySelectorAll(':scope > [data-card-id]')]
          .slice(0, -1)
          .filter((c) => getComputedStyle(c).visibility !== 'hidden'),
      ).length,
  );
  expect(heldVisible).toBe(0);
  // Settled Place again: Confirm, settle, Undo, then Redo with the Confirm checks.
  await page.getByTestId('primary-action').click();
  await glidesSettled(page);
  await page.getByTestId('undo').click();
  await glidesSettled(page);
  const redo = await fly(page, 'redo');
  expectFlight(redo, '3', [42, 0, 28], []);
  await glidesSettled(page);
});

test('AD-14 F28 Q-49 an act() key (M) right after Confirm on session-place ends the hold: the copy of the new top 28 leaves wordcell 3 by the next frame, the cell keeps its cards with only 28 shown', async ({
  page,
}) => {
  await openFixture(page, 'session-place', { prefs: 'prefs-non-default' });
  // One task: Confirm, read the hold, then `M` (keys.ts `menu`, act() → controller cancel() →
  // finishGlides → flip finishAll). A click's pointerdown would finish the glides itself
  // (controller.ts F13), so the key is the interrupt. Slow motion: the flight outlasts the frame.
  const run = await page.evaluate(async () => {
    const copies = () =>
      document.querySelectorAll('[data-wordcell="3"] .preview[data-mirror-of="28"]').length;
    const visible = () =>
      [...document.querySelectorAll<HTMLElement>('[data-wordcell="3"] > [data-card-id]')]
        .filter((el) => getComputedStyle(el).visibility !== 'hidden')
        .map((el) => Number(el.getAttribute('data-card-id')));
    document.querySelector<HTMLElement>('[data-testid="primary-action"]')?.click();
    const held = { copies: copies(), visible: visible(), running: document.getAnimations().length };
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return { held, copies: copies(), visible: visible() };
  });
  expect(run.held).toEqual({ copies: 1, visible: [42, 0, 28], running: run.held.running });
  expect(run.held.running).toBeGreaterThan(0);
  expect(run.copies).toBe(0);
  expect(run.visible).toEqual([28]);
  await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).toBeVisible();
  const cell = page.getByTestId('wordcell-3');
  await expect(cell.locator('[data-card-id]')).toHaveCount(3);
  await expect(cell.locator('[data-mirror-of]')).toHaveCount(0);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

test('AD-14 F28 a Confirm undone in the same click task leaves the gate idle: the board stays live, layout follows a viewport change and a second Confirm flies', async ({
  page,
}) => {
  await openFixture(page, 'session-place', { prefs: 'prefs-non-default' });
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-testid="primary-action"]')?.click();
    document.querySelector<HTMLElement>('[data-testid="undo"]')?.click();
  });
  await glidesSettled(page);
  const bandWidth = () =>
    page.evaluate(
      () => document.querySelector('[data-band="columns"]')?.getBoundingClientRect().width,
    );
  const before = await bandWidth();
  const size = page.viewportSize();
  if (size === null) throw new Error('no viewport');
  await page.setViewportSize({ width: size.width - 40, height: size.height });
  // AD-11: layout work runs once the gate is idle; a leaked enter() would leave it deferred.
  await expect.poll(bandWidth).toBeLessThan(before ?? 0);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
  await page.getByTestId('primary-action').click();
  await glidesSettled(page);
  await expect(page.getByTestId('wordcell-3').locator('[data-card-id]')).toHaveCount(3);
});

test('AD-14 F28 Q-49 one Confirm under emulated reduced motion on session-place-free-letter-redo-tail: every face fades in at once, unstaggered, over the held copy of the new top 28 until the fade end; the cards beneath (42, 0) never show', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-place-free-letter-redo-tail', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  expect(run.anims.map((a) => a.id).sort((a, b) => a - b)).toEqual([9, 28, 32]);
  for (const a of run.anims) {
    expect(a.delay).toBe(0);
    expect(a.duration).toBe(120);
    expect(a.keyframes).toEqual(['0', '1']);
  }
  expect(shown(run.start.cells['3'])).toEqual(['p28']);
  const flight = [run.afterClick, run.afterFirst, run.beforeLast, run.afterLast];
  for (const snap of [run.afterClick, run.afterFirst, run.beforeLast]) {
    expect(shown(snap.cells['3'])).toEqual(['p28', '9', '32', '28']);
  }
  expectCopyAtClick(run, '3', 28);
  for (const snap of [run.start, ...flight]) expectNoUsedMirror(snap);
  for (const snap of flight) {
    expectNoMarks(snap);
    expect(snap.live).toBe(52);
  }
  const after = run.afterLast.cells['3'] ?? [];
  expect(after.some((c) => c.mirror)).toBe(false);
  expect(shown(after)).toEqual(['28']);
  await glidesSettled(page);
});
