import { expect, type Locator, type Page, test } from '@playwright/test';
import {
  type Box,
  box,
  cards,
  centre,
  column,
  foot,
  openFixture,
  type Point,
  sameSession,
  stashSession,
  trayIds,
} from './helpers/board';
import { expectNoResidue } from './helpers/drag';
import {
  css,
  expectFlownBack,
  faceOf,
  holdThrough,
  idOf,
  path,
  placeholder,
  plus,
  targets,
} from './helpers/gestures';
import { animationFrames } from './helpers/lifecycle';
import { onAndroid, onDesktop } from './helpers/project';
import { waitForDictionary } from './helpers/restore';
import { type DraftDetail, draftDetail, storedText } from './helpers/session';
import { tokenColor } from './helpers/style';

// Epic 4 entry 8: drag, overlap targeting and drop into Composing (R-14 drag half, Q-34, SPEC
// CAP-7, AD-12, F12, F13, F26; rule-coverage §3 R-10, R-11, R-14 drag rows, R-20–R-23, R-73 drop
// row). Nothing is selected in any case here (entry 9 owns the selection-replacing drag).
// `session-idle-fresh` columns hold 7/7/7/7/6/6/6/6 cards; `session-idle-empty-column` has column 1
// empty. Faces are located as `card-<id> > .face`; points come from live boxes.

// Overlap area of `a` with `b` ÷ area of `a`.
function ratio(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? (w * h) / (a.w * a.h) : 0;
}

// The Session's move count and cursor index.
function sessionShape(page: Page): Promise<{ moves: number; index: number }> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return { moves: current.session.moves.length, index: current.session.cursor.index };
  });
}

// R-73: the stored Session deep-equals the store's, read in one task.
function storedMatchesCurrent(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return localStorage.getItem('wordcell:session') === JSON.stringify(current.session);
  });
}

async function expectDrop(
  page: Page,
  d: { sourceColumn: number; sourceCount: number; destinationColumn: number },
  k: number,
): Promise<DraftDetail> {
  await expect.poll(async () => (await draftDetail(page)).phase).toBe('composing');
  const got = await draftDetail(page);
  expect(got).toMatchObject({ ...d, destinationCount: k, destinationSide: 'left' });
  expect(await storedMatchesCurrent(page)).toBe(true);
  return got;
}

const hasClass = (locator: Locator, name: string) =>
  locator.evaluate((el, c) => el.classList.contains(c), name);
// A held drag of `card`'s tail: its face carries an inline transform, its wrapper `wc-drag-ghost`.
async function expectDragging(card: Locator): Promise<void> {
  expect(await faceOf(card).evaluate((el) => (el as HTMLElement).style.transform)).not.toBe('');
  expect(await hasClass(card, 'wc-drag-ghost')).toBe(true);
}

// Logs the card id of every `.face` an `animate` call targets (the fly-back, F13); before goto.
async function recordFaceAnimations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const ids: number[] = [];
    (window as unknown as { __faceAnimations: number[] }).__faceAnimations = ids;
    const original = Element.prototype.animate;
    Element.prototype.animate = function animate(this: Element, keyframes, options) {
      if (this.classList.contains('face')) {
        ids.push(Number(this.parentElement?.getAttribute('data-card-id')));
      }
      return original.call(this, keyframes, options);
    };
  });
}

const faceAnimations = (page: Page) =>
  page.evaluate(() => (window as unknown as { __faceAnimations: number[] }).__faceAnimations);

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-14 R-20 R-23 R-73 the Success-signal drag: column 1’s bottom card held over column 3 lights it and drops into Composing, saved before the next action', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const before = await stashSession(page);
    const shape = await sessionShape(page);
    const dragged = cards(page, 1).last();
    const draggedId = await idOf(dragged);
    const bottom3 = cards(page, 3).last();
    const bottom3Id = await idOf(bottom3);
    const from = await centre(dragged);
    const to = await centre(bottom3);
    const restShadow = await css(faceOf(dragged), 'box-shadow');
    const hold = await holdThrough(page, from, path(from, to, 5), async () => {
      expect(await sameSession(page)).toBe(true);
    });
    try {
      expect(await hasClass(bottom3, 'wc-drag-target')).toBe(true);
      expect(await targets(page)).toEqual([3]);
      expect(await css(faceOf(bottom3), 'outline-width')).toBe('3px');
      const dragShadow = await css(faceOf(dragged), 'box-shadow');
      expect(dragShadow).not.toBe('none');
      expect(dragShadow).not.toBe(restShadow);
      expect(await sameSession(page)).toBe(true);
      expect(await storedText(page)).toBe(before);
    } finally {
      await hold.end();
    }
    // R-73: expectDrop checks the stored Session equals the store's, before any other action.
    await expectDrop(page, { sourceColumn: 1, sourceCount: 1, destinationColumn: 3 }, 1);
    expect(await sameSession(page)).toBe(false);
    // Exactly one drop: one more (draft) move; the cursor index counts committed moves only (§2).
    expect(await sessionShape(page)).toEqual({ moves: shape.moves + 1, index: shape.index });
    await stashSession(page);
    await animationFrames(page, 3);
    expect(await sameSession(page), 'one Session change per drop').toBe(true);
    // Static tray: the locked mirror of column 3's bottom card (A, card 0) first, then the dragged
    // tile (W, card 48).
    expect(await trayIds(page)).toEqual([`${bottom3Id}m`, `${draggedId}`]);
    const mirror = page.locator(`[data-band="tray"] [data-mirror-of="${bottom3Id}"]`);
    await expect(mirror.locator('.lock:visible')).toHaveCount(1);
    await expectNoResidue(page);
  });

  test('Q-34 R-14 the same drag held over column 1 alone highlights nothing and leaves the stored Session byte-identical', async ({
    page,
  }) => {
    await recordFaceAnimations(page);
    await openFixture(page, 'session-idle-fresh');
    const before = await stashSession(page);
    const dragged = cards(page, 1).last();
    const rest = await box(faceOf(dragged));
    const from = await centre(dragged);
    const points = [
      plus(from, 0, -20),
      plus(from, 6, -60),
      plus(from, -6, -120),
      plus(from, 0, 20),
    ];
    const source = await box(column(page, 1));
    const hold = await holdThrough(page, from, points, async () => {
      // Every move is ≥ 8 px from the press: a drag from the first.
      await expectDragging(dragged);
      // Raw is the source (≥ 25 %): the empty highlight is Q-34's suppression.
      expect(ratio(await box(faceOf(dragged)), source)).toBeGreaterThanOrEqual(0.25);
      expect(await targets(page)).toEqual([]);
      expect(await sameSession(page)).toBe(true);
    });
    await hold.end();
    await animationFrames(page, 2);
    expect(await targets(page)).toEqual([]);
    await expect.poll(() => faceAnimations(page)).toEqual([await idOf(dragged)]);
    await expectFlownBack(faceOf(dragged), rest);
    expect(await storedText(page)).toBe(before);
    expect(await sameSession(page)).toBe(true);
    await expectNoResidue(page);
  });

  test('R-22 R-23 k = 0 on an empty column: column 2’s bottom card over column 1’s placeholder', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const from = await centre(cards(page, 2).last());
    const face = await box(faceOf(cards(page, 2).last()));
    const slot = await box(placeholder(page, 1));
    // Centre the dragged face on the placeholder.
    const dx = slot.x + slot.w / 2 - (face.x + face.w / 2);
    const dy = slot.y + slot.h / 2 - (face.y + face.h / 2);
    const hold = await holdThrough(page, from, path(from, plus(from, dx, dy), 5));
    try {
      expect(await hasClass(placeholder(page, 1), 'wc-drag-target')).toBe(true);
      expect(await css(placeholder(page, 1), 'outline-width')).toBe('3px');
      expect(await css(placeholder(page, 1), 'visibility')).toBe('visible');
    } finally {
      await hold.end();
    }
    await expectDrop(page, { sourceColumn: 2, sourceCount: 1, destinationColumn: 1 }, 0);
    await expectNoResidue(page);
  });

  test('R-23 Q-26 drops at the top and at the bottom of a column give the same draft', async ({
    page: first,
    context,
  }) => {
    const drafts: DraftDetail[] = [];
    // Two loads, each on its own page (seedStorage seeds a page once).
    let page = first;
    for (const where of ['top', 'foot'] as const) {
      if (where === 'foot') {
        await page.close();
        page = await context.newPage();
      }
      await openFixture(page, 'session-idle-fresh');
      const dragged = cards(page, 1).last();
      const from = await centre(dragged);
      const face = await box(faceOf(dragged));
      const spot = await centre(where === 'top' ? cards(page, 3).first() : foot(page, 3));
      const dx = spot.x - (face.x + face.w / 2);
      const dy = spot.y - (face.y + face.h / 2);
      const hold = await holdThrough(page, from, path(from, plus(from, dx, dy), 5));
      try {
        const moved = await box(faceOf(dragged));
        expect(ratio(moved, await box(column(page, 3))), where).toBeGreaterThanOrEqual(0.25);
        expect(await targets(page)).toEqual([3]);
      } finally {
        await hold.end();
      }
      drafts.push(
        await expectDrop(page, { sourceColumn: 1, sourceCount: 1, destinationColumn: 3 }, 1),
      );
    }
    expect(drafts[0]).toEqual(drafts[1]);
  });

  test('R-10 R-11 R-23 a whole-column drag from column 5’s top card onto column 2: ghosts, the face keeps its fill and paints on top, S in column order', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const ids = await cards(page, 5).evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('data-card-id'))),
    );
    expect(ids).toHaveLength(6);
    const top = cards(page, 5).first();
    const from = await centre(top);
    const fill = await tokenColor(page, '--wc-card-face');
    // Up over the top bar first.
    const bar = await box(page.locator('[data-band="topBar"]'));
    const overBar = { x: from.x, y: bar.y + bar.h / 2 };
    const hold = await holdThrough(page, from, path(from, overBar, 4));
    try {
      const wrappers = await cards(page, 5).evaluateAll((els) =>
        els.map((el) => [
          el.classList.contains('wc-drag-ghost'),
          getComputedStyle(el, '::before').borderTopStyle,
        ]),
      );
      expect(wrappers).toEqual(ids.map(() => [true, 'dashed']));
      expect(await css(faceOf(top), 'background-color')).toBe(fill);
      await expect(page.locator('[data-mirror-of]')).toHaveCount(0);
      await expect(page.locator('[data-card-id]')).toHaveCount(52);
      // The dragged face paints above the top bar where it covers it: probed at the centre of
      // the face ∩ top bar.
      const onTop = await faceOf(top).evaluate((face) => {
        const r = face.getBoundingClientRect();
        const barEl = document.querySelector('[data-band="topBar"]');
        if (barEl === null) throw new Error('no top bar');
        const b = barEl.getBoundingClientRect();
        const left = Math.max(r.left, b.left);
        const right = Math.min(r.right, b.right);
        const top = Math.max(r.top, b.top);
        const bottom = Math.min(r.bottom, b.bottom);
        if (right <= left || bottom <= top) throw new Error('the face does not cover the top bar');
        const x = (left + right) / 2;
        const y = (top + bottom) / 2;
        const el = face as HTMLElement;
        el.style.pointerEvents = 'auto';
        try {
          const first = document.elementsFromPoint(x, y)[0];
          return first !== undefined && (first === face || face.contains(first));
        } finally {
          el.style.pointerEvents = '';
        }
      });
      expect(onTop).toBe(true);
      const to = await centre(cards(page, 2).last());
      for (const p of path(overBar, plus(to, 0, 0), 4)) {
        await hold.moveTo(p);
        await animationFrames(page, 2);
      }
      expect(await targets(page)).toEqual([2]);
    } finally {
      await hold.end();
    }
    const got = await expectDrop(
      page,
      { sourceColumn: 5, sourceCount: 6, destinationColumn: 2 },
      1,
    );
    expect(got.arrangement).toEqual(ids);
    // D19: the emptied source column shows its ghosts, no placeholder.
    expect(await css(placeholder(page, 5), 'visibility')).toBe('hidden');
    const tray = (await trayIds(page)).filter((t) => !t.endsWith('m')).map(Number);
    expect(tray).toEqual(ids);
    await expectNoResidue(page);
  });

  test('R-14 a drag released over the WordCell row flies back from the last move with no command', async ({
    page,
  }) => {
    // The fly-back guard: each `animate` call records its first keyframe's transform at call
    // time, the element's inline transform a microtask later and the face's card id.
    await page.addInitScript(() => {
      const log: { first: string | null; inline: string | null; face: boolean; id: number }[] = [];
      (window as unknown as { __flyBack: typeof log }).__flyBack = log;
      const original = Element.prototype.animate;
      Element.prototype.animate = function animate(this: Element, keyframes, options) {
        const frames = Array.isArray(keyframes) ? keyframes : null;
        const first = frames?.[0]?.transform;
        const entry = {
          first: typeof first === 'string' ? first : null,
          inline: null as string | null,
          face: this.classList.contains('face'),
          id: Number(this.parentElement?.getAttribute('data-card-id')),
        };
        log.push(entry);
        const result = original.call(this, keyframes, options);
        queueMicrotask(() => {
          entry.inline = (this as HTMLElement).style.transform;
        });
        return result;
      };
    });
    await openFixture(page, 'session-idle-fresh');
    const before = await stashSession(page);
    const pressed = cards(page, 1).nth(5);
    const below = cards(page, 1).nth(6);
    const tail = [await idOf(pressed), await idOf(below)].sort((a, b) => a - b);
    const rest = await box(faceOf(pressed));
    const restBelow = await box(faceOf(below));
    const from = await centre(pressed);
    const cell = await centre(page.getByTestId('wordcell-6'));
    const points = path(from, cell, 5);
    const hold = await holdThrough(page, from, points);
    const last = points.at(-1) as Point;
    try {
      expect(await targets(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __flyBack: unknown[] }).__flyBack.length),
      )
      .toBe(2);
    const log = await page.evaluate(
      () =>
        (
          window as unknown as {
            __flyBack: { first: string | null; inline: string | null; face: boolean; id: number }[];
          }
        ).__flyBack,
    );
    // One animation per tail face: the two tail cards' ids.
    expect(log.map((entry) => entry.id).sort((a, b) => a - b)).toEqual(tail);
    for (const entry of log) {
      expect(entry.face).toBe(true);
      expect(entry.inline).toBe('');
      const m = /^translate\((-?[\d.]+)px, (-?[\d.]+)px\)$/.exec(entry.first ?? '');
      expect(m, entry.first ?? 'no transform keyframe').not.toBeNull();
      expect(Math.abs(Number(m?.[1]) - (last.x - from.x))).toBeLessThanOrEqual(1);
      expect(Math.abs(Number(m?.[2]) - (last.y - from.y))).toBeLessThanOrEqual(1);
    }
    expect(await storedText(page)).toBe(before);
    expect(await sameSession(page)).toBe(true);
    await expectNoResidue(page);
    await expectFlownBack(faceOf(pressed), rest);
    await expectFlownBack(faceOf(below), restBelow);
    expect(await storedText(page)).toBe(before);
  });

  test('Q-34 R-14 a 20 px drag down from column 4’s bottom card highlights nothing and flies back', async ({
    page,
  }) => {
    await recordFaceAnimations(page);
    await openFixture(page, 'session-idle-fresh');
    const before = await stashSession(page);
    const dragged = cards(page, 4).last();
    const rest = await box(faceOf(dragged));
    const from = await centre(dragged);
    const source = await box(column(page, 4));
    const hold = await holdThrough(page, from, path(from, plus(from, 0, 20), 5), async (i) => {
      expect(await targets(page)).toEqual([]);
      // From the threshold crossing (≥ 8 px) on, as in the desktop case; raw is the source.
      if (i >= 2) {
        await expectDragging(dragged);
        expect(ratio(await box(faceOf(dragged)), source)).toBeGreaterThanOrEqual(0.25);
      }
    });
    await hold.end();
    await expect.poll(() => faceAnimations(page)).toEqual([await idOf(dragged)]);
    await expectFlownBack(faceOf(dragged), rest);
    await expectNoResidue(page);
    expect(await storedText(page)).toBe(before);
    expect(await sameSession(page)).toBe(true);
  });

  test('R-14 Q-34 a sub-25 % drag over the source only highlights nothing and flies back', async ({
    page,
  }) => {
    await recordFaceAnimations(page);
    await openFixture(page, 'session-idle-fresh');
    const before = await stashSession(page);
    const dragged = cards(page, 4).last();
    const from = await centre(dragged);
    const face = await box(faceOf(dragged));
    const col = await box(column(page, 4));
    // Straight up until 15 % of the face's height still overlaps column 4's top.
    const dy = col.y + 0.15 * face.h - (face.y + face.h);
    const points = path(from, plus(from, 0, dy), 8);
    const hold = await holdThrough(page, from, points, async (i) => {
      expect(await targets(page)).toEqual([]);
      // From the threshold crossing (≥ 8 px) on.
      if (Math.abs((points[i] as Point).y - from.y) > 8) await expectDragging(dragged);
    });
    try {
      const moved = await box(faceOf(dragged));
      const own = ratio(moved, col);
      expect(own).toBeGreaterThan(0);
      expect(own).toBeLessThan(0.25);
      for (const n of [1, 2, 3, 5, 6, 7, 8]) {
        expect(ratio(moved, await box(column(page, n))), `column ${n}`).toBe(0);
      }
    } finally {
      await hold.end();
    }
    await expect.poll(() => faceAnimations(page)).toEqual([await idOf(dragged)]);
    await expectFlownBack(faceOf(dragged), face);
    await expectNoResidue(page);
    expect(await storedText(page)).toBe(before);
    expect(await sameSession(page)).toBe(true);
  });

  test('R-10 R-14 R-20 R-21 leave and return on column 1’s third card from the bottom drops on column 1 with D the card above the tail', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const pressed = cards(page, 1).nth(4);
    const above = cards(page, 1).nth(3);
    const aboveId = await idOf(above);
    const from = await centre(pressed);
    const slot = await box(column(page, 1));
    const hold = await holdThrough(page, from, [plus(from, 0, 10), plus(from, 4, 14)], async () => {
      expect(await targets(page)).toEqual([]);
      // A drag from the first move (≥ 8 px) whose raw target is the source (≥ 25 %).
      await expectDragging(pressed);
      expect(ratio(await box(faceOf(pressed)), slot)).toBeGreaterThanOrEqual(0.25);
    });
    try {
      for (const p of [plus(from, slot.w, 10), plus(from, 0, 0)]) {
        await hold.moveTo(p);
        await animationFrames(page, 2);
      }
      expect(await hasClass(above, 'wc-drag-target')).toBe(true);
      expect(await targets(page)).toEqual([1]);
    } finally {
      await hold.end();
    }
    await expectDrop(page, { sourceColumn: 1, sourceCount: 3, destinationColumn: 1 }, 1);
    const destination = await column(page, 1)
      .locator('[data-place="column"].destination')
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-card-id'))));
    expect(destination).toEqual([aboveId]);
  });

  test('R-14 R-20 R-22 whole-column self-drop: column 5’s top card off column 5 and back reveals the placeholder, k = 0', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const from = await centre(cards(page, 5).first());
    const slot = await box(column(page, 5));
    const hold = await holdThrough(page, from, [plus(from, 0, 10)], async () => {
      expect(await targets(page)).toEqual([]);
      expect(await css(placeholder(page, 5), 'visibility')).toBe('hidden');
      // A drag from the first move (≥ 8 px) whose raw target is the source (≥ 25 %).
      await expectDragging(cards(page, 5).first());
      expect(ratio(await box(faceOf(cards(page, 5).first())), slot)).toBeGreaterThanOrEqual(0.25);
    });
    try {
      for (const p of [plus(from, slot.w, 10), plus(from, 0, 0)]) {
        await hold.moveTo(p);
        await animationFrames(page, 2);
      }
      expect(await hasClass(placeholder(page, 5), 'wc-drag-target')).toBe(true);
      expect(await css(placeholder(page, 5), 'visibility')).toBe('visible');
      expect(await targets(page)).toEqual([5]);
    } finally {
      await hold.end();
    }
    await expectDrop(page, { sourceColumn: 5, sourceCount: 6, destinationColumn: 5 }, 0);
    await expectNoResidue(page);
  });
});

// Ticket 4.13 D7 (SPEC F34, AD-12): 412 × 600 (w 40, scroll range 122, build-notes CAP-3), the
// board scrolled to its end so the columns' tops lie under the sticky top bar.
test.describe('android, scrolled board', () => {
  test.use({ viewport: { width: 412, height: 600 } });
  test.beforeEach(onAndroid);

  test('AD-12 F34 a tail held over the top bar never lights the column under it; the release flies back and the stored Session is byte-identical', async ({
    page,
  }) => {
    await recordFaceAnimations(page);
    await openFixture(page, 'session-idle-fresh');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await animationFrames(page, 2);
    const before = await stashSession(page);
    const bar = await box(page.locator('[data-band="topBar"]'));
    const barBottom = bar.y + bar.h;
    // Premise: column 3's hit rect starts under the top bar.
    const col3 = await box(column(page, 3));
    expect(col3.y).toBeLessThan(0);
    const dragged = cards(page, 1).last();
    const rest = await box(faceOf(dragged));
    const from = await centre(dragged);
    // Up inside column 1 until the face's bottom is 4 px above the bar's bottom, then across to
    // column 3's centre over the bar.
    const up = plus(from, 0, barBottom - 4 - (rest.y + rest.h));
    const across = { x: from.x + (col3.x + col3.w / 2 - (rest.x + rest.w / 2)), y: up.y };
    const vertical = path(from, up, 6);
    const horizontal = path(up, across, 6);
    const hold = await holdThrough(page, from, [...vertical, ...horizontal], async (i) => {
      await expectDragging(dragged);
      expect(await targets(page)).not.toContain(3);
      if (i < vertical.length) return;
      expect(await targets(page)).toEqual([]);
    });
    try {
      const face = await box(faceOf(dragged));
      // The face lies wholly under the bar, yet overlaps column 3's unclipped rect fully.
      expect(face.y + face.h).toBeLessThanOrEqual(barBottom);
      expect(ratio(face, col3)).toBeGreaterThanOrEqual(0.25);
      expect(await targets(page)).toEqual([]);
      expect(await sameSession(page)).toBe(true);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await targets(page)).toEqual([]);
    await expect.poll(() => faceAnimations(page)).toEqual([await idOf(dragged)]);
    await expectFlownBack(faceOf(dragged), rest);
    expect(await storedText(page)).toBe(before);
    expect(await sameSession(page)).toBe(true);
    await expectNoResidue(page);
  });

  test('AD-12 F34 with the dictionary banner shown, a tail held over the banner never lights the column under it; the release flies back and the stored Session is byte-identical', async ({
    page,
  }) => {
    // AD-8: the word list request fails, so the banner shows under the top bar.
    await page.route('**/en*.txt', (route) =>
      /\/en[^/?]*\.txt$/.test(route.request().url()) ? route.abort() : route.continue(),
    );
    await recordFaceAnimations(page);
    await openFixture(page, 'session-idle-fresh');
    await waitForDictionary(page, 'failed');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await animationFrames(page, 2);
    const before = await stashSession(page);
    const banner = await box(page.locator('[data-band="banner"]'));
    expect(banner.h).toBeGreaterThan(0);
    const bannerBottom = banner.y + banner.h;
    // Premise: column 3's hit rect starts under the banner.
    const col3 = await box(column(page, 3));
    expect(col3.y).toBeLessThan(banner.y);
    const top = await box(page.locator('[data-band="topBar"]'));
    const actionBar = await box(page.locator('[data-band="actionBar"]'));
    const dragged = cards(page, 1).last();
    const rest = await box(faceOf(dragged));
    const from = await centre(dragged);
    // Up inside column 1 until the face's bottom is 4 px above the banner's bottom, then across to
    // column 3's centre over the banner.
    const up = plus(from, 0, bannerBottom - 4 - (rest.y + rest.h));
    const across = { x: from.x + (col3.x + col3.w / 2 - (rest.x + rest.w / 2)), y: up.y };
    const vertical = path(from, up, 6);
    const horizontal = path(up, across, 6);
    const hold = await holdThrough(page, from, [...vertical, ...horizontal], async (i) => {
      await expectDragging(dragged);
      expect(await targets(page)).not.toContain(3);
      if (i < vertical.length) return;
      expect(await targets(page)).toEqual([]);
    });
    try {
      const face = await box(faceOf(dragged));
      // The face lies over the banner, wholly above its bottom, yet overlaps column 3's unclipped
      // rect fully.
      expect(face.y + face.h).toBeLessThanOrEqual(bannerBottom);
      expect(face.y + face.h).toBeGreaterThan(banner.y);
      expect(ratio(face, col3)).toBeGreaterThanOrEqual(0.25);
      // Premise: were the banner ignored, column 3 clipped to the band between the bars would take
      // ≥ 25 % of the face, so only the banner's clipping keeps it unlit.
      const bandTop = Math.max(col3.y, top.y + top.h);
      const bandBottom = Math.min(col3.y + col3.h, actionBar.y);
      const col3InBars = { x: col3.x, y: bandTop, w: col3.w, h: bandBottom - bandTop };
      expect(ratio(face, col3InBars)).toBeGreaterThanOrEqual(0.25);
      expect(await targets(page)).toEqual([]);
      expect(await sameSession(page)).toBe(true);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await targets(page)).toEqual([]);
    await expect.poll(() => faceAnimations(page)).toEqual([await idOf(dragged)]);
    await expectFlownBack(faceOf(dragged), rest);
    expect(await storedText(page)).toBe(before);
    expect(await sameSession(page)).toBe(true);
    await expectNoResidue(page);
  });

  test("R-14 Q-34 AD-12 F37 a tail pressed mostly under the top bar, nudged and released back over its column's visible part, flies back: nothing lit and the stored Session byte-identical", async ({
    page,
  }) => {
    await recordFaceAnimations(page);
    await openFixture(page, 'session-idle-fresh');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await animationFrames(page, 2);
    const before = await stashSession(page);
    const bar = await box(page.locator('[data-band="topBar"]'));
    const barBottom = bar.y + bar.h;
    const col1 = await box(column(page, 1));
    const col1Visible = { ...col1, y: barBottom, h: col1.y + col1.h - barBottom };
    // Column 1's third card: its face mostly under the bar, with a sliver between the bar and the
    // next card's face to press.
    const dragged = cards(page, 1).nth(2);
    const rest = await box(faceOf(dragged));
    const next = await box(faceOf(cards(page, 1).nth(3)));
    expect(barBottom - rest.y).toBeGreaterThan(rest.h / 2);
    expect(next.y).toBeGreaterThan(barBottom);
    const from = { x: rest.x + rest.w / 2, y: (barBottom + next.y) / 2 };
    // A nudge up until 10 % of the face is below the bar (`raw` null), then back down until 70 %
    // of it lies over column 1's visible part (`raw` the source).
    const nudge = plus(from, 0, barBottom + 0.1 * rest.h - (rest.y + rest.h));
    // The nudge must cross the 8 px drag threshold (DRAG_PX, classify.ts) while `raw` is null.
    expect(from.y - nudge.y).toBeGreaterThanOrEqual(8);
    const back = plus(from, 0, barBottom + 0.7 * rest.h - (rest.y + rest.h));
    const down = path(nudge, back, 6);
    const hold = await holdThrough(page, from, [...path(from, nudge, 3), ...down], async () => {
      expect(await targets(page)).toEqual([]);
    });
    try {
      await expectDragging(dragged);
      const face = await box(faceOf(dragged));
      expect(ratio(face, col1Visible)).toBeGreaterThanOrEqual(0.25);
      expect(await targets(page)).toEqual([]);
      expect(await sameSession(page)).toBe(true);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await targets(page)).toEqual([]);
    await expect.poll(() => faceAnimations(page)).toContain(await idOf(dragged));
    await expectFlownBack(faceOf(dragged), rest);
    expect(await storedText(page)).toBe(before);
    expect(await sameSession(page)).toBe(true);
    await expectNoResidue(page);
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  async function mouseThrough(page: Page, from: Point, points: Point[]): Promise<void> {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (const p of points) {
      await page.mouse.move(p.x, p.y);
      await animationFrames(page, 1);
    }
  }

  const hoverClasses = (page: Page) =>
    page
      .locator('[data-column]')
      .evaluateAll((els) =>
        els.flatMap((el) =>
          [...el.classList].filter((c) => c.startsWith('wc-hover') || c === 'wc-grab'),
        ),
      );

  test('R-14 R-20 R-23 R-73 the Success-signal drop with the mouse', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    const from = await centre(cards(page, 1).last());
    const to = await centre(cards(page, 3).last());
    await mouseThrough(page, from, path(from, to, 5));
    expect(await targets(page)).toEqual([3]);
    await page.mouse.up();
    await expectDrop(page, { sourceColumn: 1, sourceCount: 1, destinationColumn: 3 }, 1);
    await expectNoResidue(page);
  });

  test('Q-34 R-14 a 20 px mouse drag down from column 4’s bottom card cancels; the hover classes return after the fly-back without a further move', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const before = await stashSession(page);
    const from = await centre(cards(page, 4).last());
    await page.mouse.move(from.x, from.y);
    await animationFrames(page, 1);
    expect(await hoverClasses(page)).toEqual(['wc-hover-tail', 'wc-grab']);
    await page.mouse.down();
    for (const [i, p] of path(from, plus(from, 0, 20), 5).entries()) {
      await page.mouse.move(p.x, p.y);
      await animationFrames(page, 1);
      expect(await targets(page)).toEqual([]);
      // From the threshold crossing (≥ 8 px) on, no column carries a hover class.
      if (i >= 2) expect(await hoverClasses(page)).toEqual([]);
    }
    await page.mouse.up();
    await expectNoResidue(page);
    await expect.poll(() => hoverClasses(page)).toEqual(['wc-hover-tail', 'wc-grab']);
    expect(await storedText(page)).toBe(before);
    expect(await sameSession(page)).toBe(true);
  });
});
