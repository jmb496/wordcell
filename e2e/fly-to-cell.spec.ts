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

type CellCard = { id: number; mirror: boolean; visibility: string };
type Snapshot = {
  live: number;
  cells: Record<string, CellCard[]>;
  badges: Record<string, string | null>;
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
      for (const cell of document.querySelectorAll<HTMLElement>('[data-wordcell]')) {
        const n = cell.getAttribute('data-wordcell') ?? '';
        cells[n] = [...cell.children]
          .filter((el) => el.hasAttribute('data-card-id') || el.hasAttribute('data-mirror-of'))
          .map((el) => ({
            id: Number(el.getAttribute('data-card-id') ?? el.getAttribute('data-mirror-of')),
            mirror: el.hasAttribute('data-mirror-of'),
            visibility: getComputedStyle(el).visibility,
          }));
        badges[n] = cell.querySelector('.count')?.textContent ?? null;
      }
      return { live: document.querySelectorAll('[data-card-id]').length, cells, badges };
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
const shown = (cards: CellCard[] | undefined) =>
  (cards ?? [])
    .filter((c) => c.visibility !== 'hidden')
    .map((c) => `${c.mirror ? 'm' : ''}${c.id}`);

// The shared flight checks (Confirm and a committing Redo): only the committed faces animate
// bottom first, every flying card visible, 52 live elements, the previous top and the committed
// cards drawn until the last landing, then only the new top. `cell` is the target WordCell,
// `committed` its new cards bottom → top, `before` its card ids at the click.
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
  expect(ids(run.start.cells[cell])).toEqual(before);
  expect(ids(run.afterClick.cells[cell])).toEqual([...before, ...committed]);
  // The previous top (if any) and every committed card are drawn at the click; the first landing
  // and just before the last change nothing; the last landing hides all but the new top.
  const previousTop = before.length === 0 ? [] : [`${before[before.length - 1]}`];
  const drawn = [...previousTop, ...committed.map(String)];
  expect(shown(run.afterClick.cells[cell])).toEqual(drawn);
  expect(shown(run.afterFirst.cells[cell])).toEqual(drawn);
  expect(shown(run.beforeLast.cells[cell])).toEqual(drawn);
  expect(shown(run.afterLast.cells[cell])).toEqual([`${committed[committed.length - 1]}`]);
  expect(run.afterLast.live).toBe(52);
  expect(run.afterClick.badges[cell]).toBe(String(before.length + committed.length));
  expect(run.afterLast.badges[cell]).toBe(String(before.length + committed.length));
}

test('AD-14 F28 Confirm on session-place: only the committed faces animate, staggered bottom first, every flying card visible, 52 live elements, previous top and landed cards shown until the last landing, then the non-top committed cards hide together', async ({
  page,
}) => {
  await openFixture(page, 'session-place', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  expectFlight(run, '3', [42, 0, 28], []);
  await glidesSettled(page);
});

test('AD-14 F28 Confirm onto a non-empty cell on session-place-onto-committed: the previous top stays shown until the last landing, the cards beneath it stay hidden, then only the new top is shown', async ({
  page,
}) => {
  await openFixture(page, 'session-place-onto-committed', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  // Cell 3 holds TAN (42, 0, 28) from the first move; AIM (2, 19, 26) lands on it.
  expectFlight(run, '3', [2, 19, 26], [42, 0, 28]);
  expect(shown(run.start.cells['3'])).toEqual(['28']);
  expect(shown(run.afterClick.cells['3'])).toEqual(['28', '2', '19', '26']);
  expect(shown(run.afterLast.cells['3'])).toEqual(['26']);
  await glidesSettled(page);
});

test('AD-14 F28 Confirm into the free letter own cell on session-place-free-letter-redo-tail: the used mirror is the only previous top drawn until the last landing, 52 live elements, mirror gone after', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  expect(run.onlyFaces).toBe(true);
  expect(run.clickLive).toBe(52);
  expect(run.start.cells['3']?.some((c) => c.mirror && c.id === 28)).toBe(true);
  expect(run.anims.map((a) => a.id)).toEqual([9, 32, 28]);
  const mirrorFirst = (cards: CellCard[]) => cards[0]?.mirror === true && cards[0].id === 28;
  for (const snap of [run.afterClick, run.afterFirst, run.beforeLast]) {
    const cards = snap.cells['3'] ?? [];
    expect(mirrorFirst(cards)).toBe(true);
    expect(shown(cards).filter((s) => !s.startsWith('m'))).toEqual(['9', '32', '28']);
    expect(shown(cards)[0]).toBe('m28');
  }
  const after = run.afterLast.cells['3'] ?? [];
  expect(after.some((c) => c.mirror)).toBe(false);
  expect(shown(after)).toEqual(['28']);
  expect(run.afterLast.live).toBe(52);
  await glidesSettled(page);
});

test('AD-14 F28 Confirm on session-place-free-letter-two-cards into another cell: at the click the source cell mirror is gone and its beneath card shown, the target cell holds the five committed cards and only the top is shown after the last landing', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-two-cards', { prefs: 'prefs-non-default' });
  const run = await fly(page, 'primary-action');
  expect(run.clickLive).toBe(52);
  // Source cell 4 holds 20 and the used mirror of 28 (the free letter); 28 leaves for cell 5.
  expect(run.start.cells['4']?.some((c) => c.mirror && c.id === 28)).toBe(true);
  expect(ids(run.start.cells['4'])).toEqual([20, 28]);
  for (const snap of [run.afterClick, run.afterFirst, run.beforeLast, run.afterLast]) {
    expect(ids(snap.cells['4'])).toEqual([20]);
    expect(shown(snap.cells['4'])).toEqual(['20']);
  }
  expect(run.anims.map((a) => a.id)).toEqual([26, 32, 45, 28, 42]);
  expect(ids(run.start.cells['5'])).toEqual([]);
  expect(shown(run.afterClick.cells['5'])).toEqual(['26', '32', '45', '28', '42']);
  expect(shown(run.beforeLast.cells['5'])).toEqual(['26', '32', '45', '28', '42']);
  expect(shown(run.afterLast.cells['5'])).toEqual(['42']);
  expect(run.afterClick.badges['5']).toBe('5');
  expect(run.afterLast.badges['5']).toBe('5');
  await glidesSettled(page);
});

test('AD-14 F28 Undo before a card has started acts on the settled layout and leaves nothing held; a Redo of the commit flies the same way', async ({
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
  await expect(page.locator('[data-wordcell] [data-mirror-of]')).toHaveCount(0);
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

test('AD-14 F28 one Confirm under emulated reduced motion on session-place-free-letter-redo-tail: every face fades in at once, unstaggered, the used mirror is held first and gone at the fade end', async ({
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
  const held = run.beforeLast.cells['3'] ?? [];
  expect(held[0]?.mirror === true && held[0].id === 28).toBe(true);
  expect(shown(held)).toEqual(['m28', '9', '32', '28']);
  const after = run.afterLast.cells['3'] ?? [];
  expect(after.some((c) => c.mirror)).toBe(false);
  expect(shown(after)).toEqual(['28']);
  await glidesSettled(page);
});
