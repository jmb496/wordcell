import { expect, type Locator, type Page, test } from '@playwright/test';
import {
  box,
  cards,
  centre,
  column,
  foot,
  openFixture,
  type Point,
  sameSession,
  stashSession,
  tapAt,
} from './helpers/board';
import { dragResidue, expectNoResidue } from './helpers/drag';
import {
  faceOf,
  footCorner,
  holdThrough,
  path,
  placeholder,
  plus,
  space,
} from './helpers/gestures';
import { animationFrames, hidePage } from './helpers/lifecycle';
import { onAndroid, onDesktop } from './helpers/project';
import { draft, game, storedGame, storedText } from './helpers/session';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';
import { touchHold } from './helpers/touch';

// Epic 4 entry 10: the column side of Composing and the phase inertness of columns (SPEC CAP-8,
// CAP-4; rule-coverage R-31, R-39, R-73, R-75 and the AD-9 / AD-17 hide row). `session-composing`
// is the drop of column 3's bottom 2 cards onto column 6 at k = 1: column 6 holds 6 live cards
// (index 5 the top of D), column 3 five live cards above 2 S ghosts. `session-idle-fresh` columns
// hold 7/7/7/7/6/6/6/6 cards; `session-idle-empty-column` has column 1 empty after one committed
// whole-column self-drop.

const ghosts = (page: Page, n: number) => column(page, n).locator('[data-mirror-of]');
async function points(locator: Locator): Promise<Point[]> {
  const out: Point[] = [];
  for (const el of await locator.all()) out.push(await centre(el));
  return out;
}

// The rendered selection outline count plus lifted cards (a count here, not helpers/selection.ts's Selection): null when none.
function selection(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const outlines = document.querySelectorAll('[data-selection-outline]').length;
    const lifted = document.querySelectorAll('.lifted').length;
    return outlines === 0 && lifted === 0 ? null : outlines + lifted;
  });
}

const k = async (page: Page) => (await draft(page)).destinationCount;

// R-73: the stored Session equals the store's, with the literal destinationCount.
async function expectSaved(page: Page, count: number): Promise<void> {
  await expect.poll(() => k(page)).toBe(count);
  const { stored, current } = await page.evaluate(() => {
    const c = window.__wordcell?.current();
    if (c?.kind !== 'active') throw new Error(`store is ${c?.kind}`);
    const text = localStorage.getItem('wordcell:session');
    if (text === null) throw new Error('wordcell:session is absent');
    return {
      stored: JSON.parse(text),
      current: c.session,
    };
  });
  expect(stored).toEqual(current);
  expect(stored.moves[stored.cursor.index].destinationCount).toBe(count);
}

const sessionWrites = async (page: Page) =>
  (await storageWrites(page)).filter((w) => w.key === 'wordcell:session').length;

// SPEC CAP-8 inert: per point a tap, then a held drag past the threshold (residue checked while
// held), each changing neither the Session reference nor the stored text, selecting nothing and
// leaving no drag residue. Captured per gesture, after any in-test drop settled.
async function expectInert(page: Page, at: Point[]): Promise<void> {
  const size = page.viewportSize();
  if (size === null) throw new Error('page has no viewport size');
  const width = size.width;
  for (const p of at) {
    let before = await stashSession(page);
    await tapAt(page, p);
    await animationFrames(page, 2);
    expect(await sameSession(page), `tap at ${p.x},${p.y}`).toBe(true);
    expect(await storedText(page)).toBe(before);
    expect(await selection(page)).toBeNull();
    await expectNoResidue(page);

    before = await stashSession(page);
    const hold = await touchHold(page, p);
    try {
      await hold.moveTo(plus(p, p.x > width / 2 ? -20 : 20, 0));
      await animationFrames(page, 2);
      expect(await dragResidue(page), `drag at ${p.x},${p.y}`).toEqual({
        classes: 0,
        transforms: 0,
      });
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await sameSession(page), `drag at ${p.x},${p.y}`).toBe(true);
    expect(await storedText(page)).toBe(before);
    expect(await selection(page)).toBeNull();
    await expectNoResidue(page);
  }
}

// The bottom live card of each listed column.
async function bottomCards(page: Page, columns: number[]): Promise<Point[]> {
  const out: Point[] = [];
  for (const n of columns) out.push(await centre(cards(page, n).last()));
  return out;
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-31 R-73 destination taps set k from kIfTapped and save before the next action; the top of D at k = 1 is a no-op', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    expect(await draft(page)).toEqual({
      phase: 'composing',
      sourceColumn: 3,
      sourceCount: 2,
      destinationColumn: 6,
      destinationCount: 1,
    });
    const dest = cards(page, 6);
    await expect(dest).toHaveCount(6);
    // The card above the top of D → k = 2; the new top of D → k = 1.
    await tapAt(page, await centre(dest.nth(4)));
    await expectSaved(page, 2);
    await tapAt(page, await centre(dest.nth(4)));
    await expectSaved(page, 1);
    // R-31: the top of D at k = 1 is a no-op.
    const before = await stashSession(page);
    await tapAt(page, await centre(dest.nth(5)));
    await animationFrames(page, 2);
    expect(await sameSession(page)).toBe(true);
    expect(await storedText(page)).toBe(before);
    expect(await k(page)).toBe(1);
    // k = 3, then the middle D card makes itself the top: k = 2.
    await tapAt(page, await centre(dest.nth(3)));
    await expectSaved(page, 3);
    await tapAt(page, await centre(dest.nth(4)));
    await expectSaved(page, 2);
  });

  test('R-39 R-73 a drag on a destination card is a tap: the card never moves, one write at pointerup', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    const dest = cards(page, 6);
    await tapAt(page, await centre(dest.nth(4)));
    await expectSaved(page, 2);
    await armStorageSpy(page);
    // The top of D at k = 2 dragged onto column 3 → k = 1.
    const top = dest.nth(4);
    const rest = await box(faceOf(top));
    const from = await centre(top);
    const over = await centre(cards(page, 3).last());
    const hold = await holdThrough(page, from, path(from, over, 5));
    try {
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      expect(await box(faceOf(top))).toEqual(rest);
      expect(await k(page)).toBe(2);
    } finally {
      await hold.end();
    }
    await expectSaved(page, 1);
    expect(await sessionWrites(page)).toBe(1);
    // From k = 1, the card above the top of D released over another column → k = 2.
    const above = await centre(dest.nth(4));
    const to = await centre(cards(page, 2).last());
    const second = await holdThrough(page, above, path(above, to, 5));
    await second.end();
    await expectSaved(page, 2);
    expect(await sessionWrites(page)).toBe(2);
    // The bottom card at k = 2 → k = 1; then its drag (top of D at k = 1, null) changes nothing.
    await tapAt(page, await centre(dest.nth(5)));
    await expectSaved(page, 1);
    expect(await sessionWrites(page)).toBe(3);
    const before = await stashSession(page);
    const bottom = await centre(dest.nth(5));
    const third = await holdThrough(page, bottom, path(bottom, to, 5));
    await third.end();
    await animationFrames(page, 2);
    expect(await sameSession(page)).toBe(true);
    expect(await storedText(page)).toBe(before);
    expect(await sessionWrites(page)).toBe(3);
    await expectNoResidue(page);
  });

  test('R-39 a 600 ms still press on a destination card is released as a tap', async ({ page }) => {
    await openFixture(page, 'session-composing');
    const hold = await touchHold(page, await centre(cards(page, 6).nth(4)));
    try {
      await page.waitForTimeout(600);
    } finally {
      await hold.end();
    }
    await expectSaved(page, 2);
  });

  test('R-39 in Composing other columns’ cards, S ghosts, the destination’s space and foot and another column’s space and foot are inert', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    await expect(ghosts(page, 3)).toHaveCount(2);
    await expectInert(page, [
      ...(await bottomCards(page, [1, 2, 3, 4, 5, 7, 8])),
      await centre(cards(page, 3).first()),
      ...(await points(ghosts(page, 3))),
      await space(page, 6),
      await centre(foot(page, 6)),
      await footCorner(page, 6),
      await space(page, 5),
      await centre(foot(page, 1)),
    ]);
    expect(await k(page)).toBe(1);
  });

  test('R-31 R-39 a partial self-drop: a remainder card sets k; S ghosts stay inert at k ≥ 2', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    // Tail of 3 from column 1 (7 cards), dropped on its own foot: remainder 4 at k = 1 (R-14, R-21).
    await tapAt(page, await centre(cards(page, 1).nth(4)));
    await expect.poll(() => selection(page)).not.toBeNull();
    await tapAt(page, await centre(foot(page, 1)));
    await expect
      .poll(() => draft(page))
      .toEqual({
        phase: 'composing',
        sourceColumn: 1,
        sourceCount: 3,
        destinationColumn: 1,
        destinationCount: 1,
      });
    await expect(cards(page, 1)).toHaveCount(4);
    await expect(ghosts(page, 1)).toHaveCount(3);
    await tapAt(page, await centre(cards(page, 1).nth(2)));
    await expectSaved(page, 2);
    await expectInert(page, await points(ghosts(page, 1)));
    expect(await k(page)).toBe(2);
  });

  test('R-39 a whole-column self-drop (Undo into Composing): ghosts, placeholder and foot are inert', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await tapAt(page, await centre(page.getByTestId('undo')));
    await expect.poll(async () => (await draft(page)).phase).toBe('place');
    await tapAt(page, await centre(page.getByTestId('undo')));
    await expect
      .poll(() => draft(page))
      .toEqual({
        phase: 'composing',
        sourceColumn: 1,
        sourceCount: 7,
        destinationColumn: 1,
        destinationCount: 0,
      });
    await expect(cards(page, 1)).toHaveCount(0);
    await expect(ghosts(page, 1)).toHaveCount(7);
    await expectInert(page, [
      ...(await points(ghosts(page, 1))),
      await centre(placeholder(page, 1)),
      await centre(foot(page, 1)),
      await footCorner(page, 1),
    ]);
  });

  test('R-31 R-39 an empty destination (k = 0): its placeholder and foot are inert', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await tapAt(page, await centre(cards(page, 2).last()));
    await expect.poll(() => selection(page)).not.toBeNull();
    await tapAt(page, await centre(placeholder(page, 1)));
    await expect
      .poll(() => draft(page))
      .toEqual({
        phase: 'composing',
        sourceColumn: 2,
        sourceCount: 1,
        destinationColumn: 1,
        destinationCount: 0,
      });
    await expectInert(page, [
      await centre(placeholder(page, 1)),
      await centre(foot(page, 1)),
      await footCorner(page, 1),
    ]);
  });

  test('R-39 in Place live cards, S and D ghosts, empty space and foot pads are inert', async ({
    page,
  }) => {
    await openFixture(page, 'session-place');
    await expect(ghosts(page, 3)).toHaveCount(2);
    await expect(ghosts(page, 6)).toHaveCount(1);
    await expectInert(page, [
      ...(await bottomCards(page, [1, 2, 3, 4, 5, 6, 7, 8])),
      ...(await points(ghosts(page, 3))),
      ...(await points(ghosts(page, 6))),
      await space(page, 6),
      await centre(foot(page, 1)),
      await centre(foot(page, 6)),
    ]);
  });

  test('R-75 on session-gave-up live cards, empty space and foot pads are inert', async ({
    page,
  }) => {
    await openFixture(page, 'session-gave-up');
    await expectInert(page, [
      ...(await bottomCards(page, [1, 2, 3, 4, 5, 6, 7, 8])),
      await centre(cards(page, 1).first()),
      await space(page, 5),
      await centre(foot(page, 1)),
      await centre(foot(page, 8)),
    ]);
  });

  test('R-75 on session-won placeholders and foot pads are inert', async ({ page }) => {
    await openFixture(page, 'session-won');
    await expect(page.locator('[data-place="column"]')).toHaveCount(0);
    await expectInert(page, [
      await centre(placeholder(page, 1)),
      await centre(placeholder(page, 8)),
      await centre(foot(page, 1)),
      await centre(foot(page, 8)),
    ]);
  });

  test('R-39 to change source or destination, Undo: the tail returns and a new drag gives that draft', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    await tapAt(page, await centre(page.getByTestId('undo')));
    await expect.poll(async () => (await draft(page)).phase).toBe('idle');
    await expect(cards(page, 3)).toHaveCount(7);
    await expect(ghosts(page, 3)).toHaveCount(0);
    const from = await centre(cards(page, 1).last());
    const to = await centre(cards(page, 2).last());
    const hold = await holdThrough(page, from, path(from, to, 5));
    await hold.end();
    await expect
      .poll(() => draft(page))
      .toEqual({
        phase: 'composing',
        sourceColumn: 1,
        sourceCount: 1,
        destinationColumn: 2,
        destinationCount: 1,
      });
  });

  for (const moved of [false, true]) {
    test(`AD-9 AD-17 a held destination-card press${moved ? ' past the threshold' : ''} plus hidePage dispatches no tapDestinationCard; one wordcell:session write`, async ({
      page,
    }) => {
      await openFixture(page, 'session-composing');
      const before = await game(page);
      await armStorageSpy(page);
      const from = await centre(cards(page, 6).nth(4));
      const hold = await touchHold(page, from);
      try {
        if (moved) {
          await hold.moveTo(plus(from, -20, 0));
          await animationFrames(page, 2);
        }
        await hidePage(page);
      } finally {
        await hold.end();
      }
      await animationFrames(page, 2);
      expect(await game(page)).toBe(before);
      expect(await storedGame(page)).toBe(before);
      expect(await k(page)).toBe(1);
      const writes = await storageWrites(page);
      expect(writes.map((w) => w.key)).toEqual(['wordcell:session']);
    });
  }
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  async function moveTo(page: Page, p: Point): Promise<void> {
    await page.mouse.move(p.x, p.y);
    await animationFrames(page, 1);
  }

  const classes = (page: Page, n: number) =>
    column(page, n).evaluate((el) => [...el.classList].filter((c) => c.startsWith('wc-')).sort());

  // Every column's wc-* classes, columns with none left out.
  const hovered = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-column]')]
        .map((el) => [...el.classList].filter((c) => c.startsWith('wc-')))
        .filter((c) => c.length > 0),
    );

  const cursorOf = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).cursor);

  // The k preview outline runs from the face of live card `from` to the face bottom of `to`.
  async function expectPreview(page: Page, n: number, from: number, to: number): Promise<void> {
    await expect.poll(() => classes(page, n)).toEqual(['wc-hover-tail']);
    const o = await box(column(page, n).locator('.hover-outline'));
    const top = await box(faceOf(cards(page, n).nth(from)));
    const last = await box(faceOf(cards(page, n).nth(to)));
    expect(o.y).toBeCloseTo(top.y, 0);
    expect(o.y + o.h).toBeCloseTo(last.y + last.h, 0);
  }

  test('R-31 the k hover previews the would-be D; none on inert parts; no grab cursor', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    const dest = cards(page, 6);
    // k = 1: remainder cards above D outline from themselves to the remainder's bottom card.
    await moveTo(page, await centre(dest.nth(4)));
    await expectPreview(page, 6, 4, 5);
    expect(await cursorOf(dest.nth(4))).not.toBe('grab');
    await moveTo(page, await centre(dest.nth(1)));
    await expectPreview(page, 6, 1, 5);
    // None on the top of D at k = 1, other columns' cards, S ghosts, the destination space and foot.
    const inert: [Point, Locator | null][] = [
      [await centre(dest.nth(5)), dest.nth(5)],
      [await centre(cards(page, 1).last()), cards(page, 1).last()],
      [await centre(ghosts(page, 3).first()), ghosts(page, 3).first()],
      [await centre(ghosts(page, 3).last()), null],
      [await space(page, 6), null],
      [await centre(foot(page, 6)), null],
    ];
    for (const [p, el] of inert) {
      await moveTo(page, p);
      expect(await hovered(page)).toEqual([]);
      if (el !== null) expect(await cursorOf(el)).not.toBe('grab');
    }
    // k = 3: the top of D previews k − 1 (from the card below it); a non-top D card from itself.
    await tapAt(page, await centre(dest.nth(3)));
    await expect.poll(() => k(page)).toBe(3);
    await expectPreview(page, 6, 4, 5);
    await moveTo(page, await centre(dest.nth(4)));
    await expectPreview(page, 6, 4, 5);
    await moveTo(page, await centre(dest.nth(5)));
    await expectPreview(page, 6, 5, 5);
  });

  test('R-31 at k = 2 clicking the bottom card without moving sets k = 1 and its preview disappears', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    const dest = cards(page, 6);
    await tapAt(page, await centre(dest.nth(4)));
    await expect.poll(() => k(page)).toBe(2);
    // The mouse rests on the new top of D: it previews k − 1.
    await expectPreview(page, 6, 5, 5);
    await moveTo(page, await centre(dest.nth(5)));
    await expectPreview(page, 6, 5, 5);
    await page.mouse.down();
    await page.mouse.up();
    await expect.poll(() => k(page)).toBe(1);
    await expect.poll(() => hovered(page)).toEqual([]);
  });

  test('R-39 a mouse drag-as-tap on the top of D writes once; no hover outline while crossing another destination card', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    const dest = cards(page, 6);
    await tapAt(page, await centre(dest.nth(4)));
    await expect.poll(() => k(page)).toBe(2);
    await armStorageSpy(page);
    const from = await centre(dest.nth(4));
    const across = await centre(dest.nth(2));
    await moveTo(page, from);
    await page.mouse.down();
    try {
      for (const p of path(from, across, 4)) {
        await moveTo(page, p);
        expect(await hovered(page)).toEqual([]);
        expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      }
    } finally {
      await page.mouse.up();
    }
    await expectSaved(page, 1);
    expect(await sessionWrites(page)).toBe(1);
    // Repainted at pointerup: the mouse rests on a remainder card above D (k → 4).
    await expectPreview(page, 6, 2, 5);
  });

  test('R-31 a partial self-drop reached by clicks: S ghosts preview nothing; the preview ends at the remainder’s bottom card', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await tapAt(page, await centre(cards(page, 1).nth(4)));
    await expect.poll(() => selection(page)).not.toBeNull();
    await tapAt(page, await centre(foot(page, 1)));
    await expect
      .poll(() => draft(page))
      .toMatchObject({ phase: 'composing', destinationColumn: 1 });
    await tapAt(page, await centre(cards(page, 1).nth(2)));
    await expect.poll(() => k(page)).toBe(2);
    await expect(ghosts(page, 1)).toHaveCount(3);
    for (const p of await points(ghosts(page, 1))) {
      await moveTo(page, p);
      expect(await hovered(page)).toEqual([]);
    }
    for (const i of [0, 1]) {
      await moveTo(page, await centre(cards(page, 1).nth(i)));
      await expectPreview(page, 1, i, 3);
      const range = await column(page, 1).evaluate((el) => {
        const style = (el as HTMLElement).style;
        const from = Number(style.getPropertyValue('--wc-hover-from'));
        const len = Number(style.getPropertyValue('--wc-hover-len'));
        const slots = [...el.querySelectorAll('[data-place="column"], [data-mirror-of]')];
        const lastLive = slots.findLastIndex((s) => s.hasAttribute('data-card-id'));
        return {
          from,
          end: len - 1,
          lastLive,
          mirrors: slots.slice(from, len).filter((s) => s.hasAttribute('data-mirror-of')).length,
        };
      });
      expect(range).toEqual({ from: i, end: 3, lastLive: 3, mirrors: 0 });
    }
  });

  for (const name of ['session-place', 'session-gave-up', 'session-won']) {
    const id = name === 'session-place' ? 'R-39' : 'R-75';
    test(`${id} on ${name} no hover outline and no grab cursor on any column card or placeholder`, async ({
      page,
    }) => {
      await openFixture(page, name);
      const targets = [
        ...(await page.locator('[data-column] [data-place="column"]').all()),
        ...(await page.locator('[data-column] [data-mirror-of]').all()),
        ...(await page.locator('[data-column] .placeholder.shown').all()),
      ];
      if (name === 'session-won') {
        expect(await page.locator('[data-place="column"]').count()).toBe(0);
        expect(targets).toHaveLength(8);
      }
      for (const el of targets) {
        await moveTo(page, await centre(el));
        expect(await hovered(page)).toEqual([]);
        expect(await cursorOf(el)).not.toBe('grab');
      }
    });
  }
});
