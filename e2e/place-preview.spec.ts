import { expect, type Locator, type Page, test } from '@playwright/test';
import { box, centre, glidesSettled, openFixture, tapAt } from './helpers/board';
import { faceOf, holdThrough, path } from './helpers/gestures';
import { onAndroid } from './helpers/project';
import { booted } from './helpers/restore';
import { tokenColor } from './helpers/style';
import { touchHold } from './helpers/touch';

// Ticket 11.2 (epic place-preview E2–E5; Q-49, R-33, R-50, R-65, R-70, R-71, R-73; AD-14): in
// Place each WordCell the commit changes shows its top and count after the commit. Fixtures (view()
// literals, never edited to pass): `session-place-onto-committed` (target 3 [42, 0, 28], strip AIM
// ending 26, preview {26, 6}); `session-place-free-letter-redo-tail` (used target 3 [42, 0, 28],
// strip [9, 32, 28], preview {28, 5}); `session-place-free-letter-two-cards` (target 5 empty, strip
// [26, 32, 45, 28, 42], used cell 4 [20, 28] → {20, 1}); `session-place-compact` (target 9, strip
// ending 7, used cell 4 [20, 28, 35] → {28, 2}); `session-place-used-cells` (MINOR, target 5 empty
// → {38, 5}, legal 3–5, used cell 3 [32] → {null, 0}, used not-legal cell 6
// [48, 9, 1, 34, 31, 27] → {31, 5}, unchanged cell 4 [20, 28, 5, 46, 37]); `session-place` (TAN,
// target 3 empty → {28, 3}); `session-place-long` (target 10, count 15).

test.describe('android', () => {
  test.beforeEach(onAndroid);

  type Probe = { __mirrorAnimations: number };

  const cell = (page: Page, n: number) => page.getByTestId(`wordcell-${n}`);
  const sheet = (page: Page) => page.locator('[data-view-sheet]');
  const tray = (page: Page) => page.locator('[data-band="tray"]');
  const primary = (page: Page) => page.getByTestId('primary-action');
  const previewOf = (page: Page, n: number, id: number) =>
    cell(page, n).locator(`.preview[data-mirror-of="${id}"]`);
  // Every element of card `id` (live or mirror) in WordCell `n`.
  const anyOf = (page: Page, n: number, id: number) =>
    cell(page, n).locator(`[data-card-id="${id}"], [data-mirror-of="${id}"]`);

  // AD-14: counts every WAAPI animation started on a mirror or inside one (init script, so it
  // covers the whole page life), plus any CSS animation running on one when read.
  async function spyMirrorAnimations(page: Page): Promise<void> {
    await page.addInitScript(() => {
      const probe = window as unknown as Probe;
      probe.__mirrorAnimations = 0;
      const original = Element.prototype.animate;
      Element.prototype.animate = function (
        this: Element,
        ...args: Parameters<Element['animate']>
      ): Animation {
        if (this.closest('[data-mirror-of]') !== null) probe.__mirrorAnimations += 1;
        return original.apply(this, args);
      };
    });
  }

  function mirrorAnimations(page: Page): Promise<number> {
    return page.evaluate(
      () =>
        (window as unknown as Probe).__mirrorAnimations +
        document.getAnimations().filter((a) => {
          const target = (a.effect as KeyframeEffect | null)?.target;
          return target instanceof Element && target.closest('[data-mirror-of]') !== null;
        }).length,
    );
  }

  async function open(page: Page, name: string, steps: ('undo' | 'redo')[] = []): Promise<void> {
    await spyMirrorAnimations(page);
    await openFixture(page, name, { steps });
  }

  // The store's in-memory Session move at the cursor (AD-17 hook).
  function cursorMove(page: Page): Promise<{ targetCell?: number; placementOrder?: number[] }> {
    return page.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      const s = current.session;
      return s.moves[s.cursor.index] as { targetCell?: number; placementOrder?: number[] };
    });
  }

  async function phase(page: Page): Promise<string> {
    return page.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      return current.session.cursor.phase;
    });
  }

  async function retarget(page: Page, n: number): Promise<void> {
    await tapAt(page, await centre(cell(page, n)));
    await expect.poll(async () => (await cursorMove(page)).targetCell).toBe(n);
    await glidesSettled(page);
  }

  // A strip tap-swap of tiles `a` and `b` (one setPlacementOrder).
  async function swap(page: Page, a: number, b: number): Promise<void> {
    const before = (await cursorMove(page)).placementOrder;
    await tapAt(page, await centre(tray(page).getByTestId(`card-${a}`)));
    await expect(tray(page).getByTestId(`card-${a}`)).toHaveClass(/\bselected\b/);
    await tapAt(page, await centre(tray(page).getByTestId(`card-${b}`)));
    await expect.poll(async () => (await cursorMove(page)).placementOrder).not.toEqual(before);
    await glidesSettled(page);
  }

  // Q-49: target `n` draws `top` as one `preview` mirror with the ★, badge `count`; its current
  // cards (`hidden`) stay live and hidden; no used mirror, no empty outline.
  async function expectPreviewMirror(
    page: Page,
    n: number,
    top: number,
    count: number,
    hidden: readonly number[],
  ): Promise<void> {
    const mirror = previewOf(page, n, top);
    await expect(mirror).toHaveCount(1);
    await expect(mirror).toBeVisible();
    await expect(mirror.locator('.preview-mark')).toBeVisible();
    await expect(cell(page, n).locator('[data-mirror-of]')).toHaveCount(1);
    await expect(cell(page, n).locator('.used')).toHaveCount(0);
    await expect(cell(page, n)).not.toHaveClass(/\bempty\b/);
    await expect(cell(page, n).locator('.count')).toHaveText(String(count));
    for (const id of hidden) {
      const live = cell(page, n).getByTestId(`card-${id}`);
      await expect(live).toHaveCount(1);
      await expect(live).toBeHidden();
    }
    // AD-14: the preview mirror is bare.
    for (const attribute of ['data-card-id', 'data-testid', 'data-place', 'aria-label', 'tabindex'])
      await expect(mirror).not.toHaveAttribute(attribute);
    await expect(mirror).toHaveAttribute('aria-hidden', 'true');
  }

  // Q-49: cell `n` shows its live card `shown` with the ★ and no mirror; badge `count` (none < 2);
  // its other live cards stay hidden.
  async function expectPreviewLive(
    page: Page,
    n: number,
    shown: number,
    count: number,
  ): Promise<void> {
    const live = cell(page, n).getByTestId(`card-${shown}`);
    await expect(live).toBeVisible();
    await expect(cell(page, n).locator('[data-card-id]:visible')).toHaveCount(1);
    await expect(live.locator('.preview-mark')).toBeVisible();
    await expect(cell(page, n).locator('.preview-mark')).toHaveCount(1);
    await expect(cell(page, n).locator('[data-mirror-of]')).toHaveCount(0);
    if (count >= 2) await expect(cell(page, n).locator('.count')).toHaveText(String(count));
    else await expect(cell(page, n).locator('.count')).toHaveCount(0);
    // A changed cell exposes no named card (the group name carries it).
    await expect(cell(page, n).getByRole('button')).toHaveCount(0);
  }

  // Q-49: cell `n` is empty after the commit: the empty outline, no ★, no badge, no visible card.
  async function expectPreviewEmpty(page: Page, n: number): Promise<void> {
    await expect(cell(page, n)).toHaveClass(/\bempty\b/);
    await expect(cell(page, n).locator('.preview-mark')).toHaveCount(0);
    await expect(cell(page, n).locator('.count')).toHaveCount(0);
    await expect(cell(page, n).locator('[data-mirror-of]')).toHaveCount(0);
    await expect(cell(page, n).locator('.card:visible')).toHaveCount(0);
  }

  // The ★ pill's and the face's rects for a card wrapper.
  function markRects(card: Locator) {
    return card.evaluate((el) => {
      const r = (e: Element | null) => {
        if (e === null) throw new Error('missing element');
        const b = e.getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      };
      return {
        face: r(el.querySelector(':scope > .face')),
        mark: r(el.querySelector('.preview-mark')),
      };
    });
  }

  async function expectMarkCorner(page: Page, card: Locator): Promise<void> {
    const { face, mark } = await markRects(card);
    expect(mark.left - face.left).toBeCloseTo(2, 1);
    expect(face.bottom - mark.bottom).toBeCloseTo(2, 1);
    expect(mark.right - mark.left).toBeCloseTo(16, 1);
    expect(mark.bottom - mark.top).toBeCloseTo(16, 1);
    const pill = card.locator('.preview-mark');
    await expect(pill).toHaveText('★');
    await expect(pill).toHaveCSS('color', await tokenColor(page, '--wc-accent-orange'));
    await expect(pill).toHaveCSS('background-color', await tokenColor(page, '--wc-surface-raised'));
  }

  // The ★ pill paints above the card face: with pointer events lifted on both for the read only
  // (both are `pointer-events: none`), the hit at the pill centre is the pill. Only where the pill
  // does not meet the count badge.
  async function expectMarkOverFace(card: Locator): Promise<void> {
    const hit = await card.evaluate((el) => {
      const face = el.querySelector<HTMLElement>(':scope > .face');
      const mark = el.querySelector<HTMLElement>('.preview-mark');
      if (face === null || mark === null) throw new Error('missing face or mark');
      face.style.pointerEvents = 'auto';
      mark.style.pointerEvents = 'auto';
      try {
        const b = mark.getBoundingClientRect();
        return document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2) === mark;
      } finally {
        face.style.pointerEvents = '';
        mark.style.pointerEvents = '';
      }
    });
    expect(hit).toBe(true);
  }

  test('R-50 (UI) Q-49 AD-14 on session-place-onto-committed target 3 shows the preview mirror of 26 with the star and badge 6, its live top 28 hidden, 52 live elements', async ({
    page,
  }) => {
    await open(page, 'session-place-onto-committed');
    await expectPreviewMirror(page, 3, 26, 6, [42, 0, 28]);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    const ids = await page
      .locator('[data-card-id]')
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-card-id'))));
    expect(new Set(ids).size).toBe(52);
    // The live 26 is the strip's last tile; the cell holds only its mirror.
    await expect(page.getByTestId('card-26')).toHaveAttribute('data-place', 'strip');
    await expect(page.locator('[data-wordcell] .used')).toHaveCount(0);
    await expectMarkCorner(page, previewOf(page, 3, 26));
    await expectMarkOverFace(previewOf(page, 3, 26));
  });

  test('R-50 (UI) Q-49 on session-place-long at 360 × 839 target 10 previews the strip top with badge 15; the star and the badge keep their corners and the badge draws above the star where they meet', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 839 });
    await open(page, 'session-place-long');
    const last = await tray(page)
      .locator('[data-place="strip"]')
      .last()
      .getAttribute('data-card-id');
    const target = cell(page, 10);
    const mirror = target.locator('.preview[data-mirror-of]');
    await expect(mirror).toHaveCount(1);
    await expect(mirror).toHaveAttribute('data-mirror-of', String(last));
    await expect(target.locator('.count')).toHaveText('15');
    await expectMarkCorner(page, mirror);
    // DESIGN.md WordCell count badge: bottom-right of the card rect, inset 2 px.
    const geometry = await target.evaluate((el) => {
      const r = (e: Element | null) => {
        if (e === null) throw new Error('missing element');
        const b = e.getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      };
      const face = r(el.querySelector('.preview > .face'));
      const mark = el.querySelector<HTMLElement>('.preview-mark');
      const count = el.querySelector<HTMLElement>('.count');
      if (mark === null || count === null) throw new Error('missing mark or badge');
      const [m, c] = [r(mark), r(count)];
      // Owner decision 2026-10-28: the badge draws above the pill where they meet. Their natural
      // intersection at 360 px (Plan Design Notes, about 0.35–0.6 px) depends on the font's "15",
      // so the probe widens the badge leftward (it is anchored right) to the pill's centre for
      // the read only; both marks take no pointer events, so that is lifted for the read too.
      count.style.minWidth = `${c.right - (m.left + m.right) / 2}px`;
      mark.style.pointerEvents = 'auto';
      count.style.pointerEvents = 'auto';
      const w = r(count);
      const overlap = {
        left: Math.max(m.left, w.left),
        right: Math.min(m.right, w.right),
        top: Math.max(m.top, w.top),
        bottom: Math.min(m.bottom, w.bottom),
      };
      const hit = document.elementFromPoint(
        (overlap.left + overlap.right) / 2,
        (overlap.top + overlap.bottom) / 2,
      );
      count.style.minWidth = '';
      mark.style.pointerEvents = '';
      count.style.pointerEvents = '';
      if (overlap.right <= overlap.left || overlap.bottom <= overlap.top) {
        throw new Error('the widened badge does not meet the pill');
      }
      return { face, count: c, hitIsCount: hit === count };
    });
    expect(geometry.face.right - geometry.count.right).toBeCloseTo(2, 1);
    expect(geometry.face.bottom - geometry.count.bottom).toBeCloseTo(2, 1);
    expect(geometry.hitIsCount).toBe(true);
  });

  test('R-50 (UI) Q-49 AD-14 a used cell that is not the target shows the card beneath its used one, or its empty slot (session-place-used-cells)', async ({
    page,
  }) => {
    await open(page, 'session-place-used-cells');
    await expectPreviewLive(page, 6, 31, 5);
    await expect(anyOf(page, 6, 27)).toHaveCount(0);
    await expectPreviewEmpty(page, 3);
    await expect(anyOf(page, 3, 32)).toHaveCount(0);
    // AD-14: the used cards 32 and 27 are live only in the strip, copied in no WordCell.
    for (const id of [32, 27]) {
      await expect(page.getByTestId(`card-${id}`)).toHaveAttribute('data-place', 'strip');
      await expect(page.locator(`[data-wordcell] [data-mirror-of="${id}"]`)).toHaveCount(0);
    }
    await expectPreviewMirror(page, 5, 38, 5, []);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
  });

  test('R-50 (UI) Q-49 a used cell that is not the target shows the card beneath its used one (session-place-compact)', async ({
    page,
  }) => {
    await open(page, 'session-place-compact');
    await expectPreviewLive(page, 4, 28, 2);
    await expect(anyOf(page, 4, 35)).toHaveCount(0);
  });

  test('R-50 (UI) Q-49 AD-14 the preview follows a tap-swap that makes free letter 28 the strip top, with no mirror animation (session-place-free-letter-two-cards)', async ({
    page,
  }) => {
    await open(page, 'session-place-free-letter-two-cards');
    await expectPreviewMirror(page, 5, 42, 5, []);
    await expectPreviewLive(page, 4, 20, 1);
    await swap(page, 28, 42);
    expect((await cursorMove(page)).placementOrder).toEqual([26, 32, 45, 42, 28]);
    await expectPreviewMirror(page, 5, 28, 5, []);
    await expect(cell(page, 5).locator('[data-mirror-of="28"]')).not.toHaveClass(/\bused\b/);
    await expectPreviewLive(page, 4, 20, 1);
    await expect(anyOf(page, 4, 28)).toHaveCount(0);
    expect(await mirrorAnimations(page)).toBe(0);
  });

  test('R-50 (UI) Q-49 AD-14 the preview follows a strip drag of free letter 28 to the last slot on drop, never mid-drag, with no mirror animation (session-place-free-letter-two-cards)', async ({
    page,
  }) => {
    await open(page, 'session-place-free-letter-two-cards');
    await expectPreviewMirror(page, 5, 42, 5, []);
    const tile28 = tray(page).getByTestId('card-28');
    const from = await centre(faceOf(tile28));
    // The face centre on the gap after the last tile 42 (layout/tray.ts `gapRects`: 4 px wide).
    const last = await box(faceOf(tray(page).getByTestId('card-42')));
    const to = { x: last.x + last.w + 2, y: last.y + last.h / 2 };
    const hold = await holdThrough(page, from, path(from, to, 4));
    try {
      // Rule 3: mid-drag nothing is dispatched and the preview is unchanged.
      await expect(faceOf(tile28)).toHaveClass(/\bwc-drag-layer\b/);
      expect((await cursorMove(page)).placementOrder).toEqual([26, 32, 45, 28, 42]);
      expect(
        await cell(page, 5)
          .locator('[data-mirror-of]')
          .evaluateAll((els) => els.map((el) => el.getAttribute('data-mirror-of'))),
      ).toEqual(['42']);
    } finally {
      await hold.end();
    }
    await expect
      .poll(async () => (await cursorMove(page)).placementOrder)
      .toEqual([26, 32, 45, 42, 28]);
    await glidesSettled(page);
    await expectPreviewMirror(page, 5, 28, 5, []);
    await expect(cell(page, 5).locator('[data-mirror-of="28"]')).not.toHaveClass(/\bused\b/);
    await expectPreviewLive(page, 4, 20, 1);
    await expect(anyOf(page, 4, 28)).toHaveCount(0);
    expect(await mirrorAnimations(page)).toBe(0);
  });

  test('R-50 (UI) Q-49 AD-14 the preview follows a retarget onto used cell 4 and back to 9, with no mirror animation (session-place-compact)', async ({
    page,
  }) => {
    await open(page, 'session-place-compact');
    await retarget(page, 4);
    await expectPreviewMirror(page, 4, 7, 10, [28, 20]);
    await expect(anyOf(page, 4, 35)).toHaveCount(0);
    await expect(cell(page, 9).locator('.preview-mark')).toHaveCount(0);
    expect(await mirrorAnimations(page)).toBe(0);
    await retarget(page, 9);
    await expectPreviewLive(page, 4, 28, 2);
    await expect(anyOf(page, 4, 35)).toHaveCount(0);
    await expect(cell(page, 9).locator('.preview[data-mirror-of="7"]')).toHaveCount(1);
    expect(await mirrorAnimations(page)).toBe(0);
  });

  test('R-50 (UI) Q-49 AD-14 the preview follows retargets onto unused cell 4 and used single-card cell 3 and back, with no mirror animation (session-place-used-cells)', async ({
    page,
  }) => {
    await open(page, 'session-place-used-cells');
    await retarget(page, 4);
    await expectPreviewMirror(page, 4, 38, 10, [20, 28, 5, 46, 37]);
    await expect(cell(page, 4).getByRole('button')).toHaveCount(0);
    await expectPreviewEmpty(page, 5);
    expect(await mirrorAnimations(page)).toBe(0);

    await retarget(page, 5);
    await expect(cell(page, 4).getByTestId('card-37')).toBeVisible();
    await expect(cell(page, 4).locator('[data-mirror-of]')).toHaveCount(0);
    await expect(cell(page, 4).locator('.preview-mark')).toHaveCount(0);
    await expect(cell(page, 4).locator('.count')).toHaveText('5');
    await expect(cell(page, 4).getByRole('button')).toHaveCount(1);
    await expect(cell(page, 4).getByRole('button', { name: 'R, WordCell 4, top' })).toHaveCount(1);
    await expectPreviewMirror(page, 5, 38, 5, []);
    expect(await mirrorAnimations(page)).toBe(0);

    await retarget(page, 3);
    await expectPreviewMirror(page, 3, 38, 5, []);
    await expect(cell(page, 3).locator('[data-card-id]')).toHaveCount(0);
    await expect(anyOf(page, 3, 32)).toHaveCount(0);
    expect(await mirrorAnimations(page)).toBe(0);

    await retarget(page, 5);
    await expectPreviewEmpty(page, 3);
    await expectPreviewMirror(page, 5, 38, 5, []);
    expect(await mirrorAnimations(page)).toBe(0);
  });

  // The WordCell view's card ids, bottom first.
  const viewIds = (page: Page) =>
    sheet(page)
      .locator('[data-mirror-of]')
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-mirror-of'))));

  // A long-press held on WordCell `n` past the 400 ms timer; `whileHeld` runs before the release.
  async function hold(page: Page, n: number, whileHeld: () => Promise<void>): Promise<void> {
    const press = await touchHold(page, await centre(cell(page, n)));
    try {
      await page.waitForTimeout(450);
      await whileHeld();
    } finally {
      await press.end();
    }
  }

  test('R-65 (UI) Q-49 R-50 (UI) the current top is not shown, but the WordCell view of target 3 lists 42, 0, 28 with top on 28 (session-place-onto-committed)', async ({
    page,
  }) => {
    await open(page, 'session-place-onto-committed');
    await expect(cell(page, 3).getByTestId('card-28')).toHaveCount(1);
    await expect(cell(page, 3).getByTestId('card-28')).toBeHidden();
    await hold(page, 3, async () => {
      await expect(sheet(page)).toBeVisible();
      expect(await viewIds(page)).toEqual([42, 0, 28]);
      await expect(sheet(page).locator('[data-mirror-of="28"] .top-tag')).toHaveCount(1);
      await expect(sheet(page).locator('.top-tag')).toHaveCount(1);
    });
  });

  test('R-65 (UI) Q-49 a long-press on an empty target drawn with a preview opens no view (session-place)', async ({
    page,
  }) => {
    await open(page, 'session-place');
    await expect(previewOf(page, 3, 28)).toHaveCount(1);
    await hold(page, 3, async () => {
      await expect(sheet(page)).toHaveCount(0);
    });
    await expect(sheet(page)).toHaveCount(0);
  });

  test('R-65 (UI) Q-49 a long-press on used cell 3 drawn empty lists its one current card 32 (session-place-used-cells)', async ({
    page,
  }) => {
    await open(page, 'session-place-used-cells');
    await expectPreviewEmpty(page, 3);
    await hold(page, 3, async () => {
      await expect(sheet(page)).toBeVisible();
      expect(await viewIds(page)).toEqual([32]);
    });
  });

  test('R-65 (UI) Q-49 a long-press on used cell 6 drawn with 31 on top lists its current cards 48, 9, 1, 34, 31, 27 with top on 27 (session-place-used-cells)', async ({
    page,
  }) => {
    await open(page, 'session-place-used-cells');
    await expectPreviewLive(page, 6, 31, 5);
    await hold(page, 6, async () => {
      await expect(sheet(page)).toBeVisible();
      expect(await viewIds(page)).toEqual([48, 9, 1, 34, 31, 27]);
      await expect(sheet(page).locator('[data-mirror-of="27"] .top-tag')).toHaveCount(1);
      await expect(sheet(page).locator('.top-tag')).toHaveCount(1);
    });
  });

  test('R-33 (UI) Q-49 in Composing the used look, in Place the preview replaces it (session-place-used-cells, Undo)', async ({
    page,
  }) => {
    await open(page, 'session-place-used-cells');
    await expect(page.locator('[data-wordcell] .used')).toHaveCount(0);
    await page.getByTestId('undo').click();
    await glidesSettled(page);
    expect(await phase(page)).toBe('composing');
    for (const [n, id] of [
      [3, 32],
      [6, 27],
    ] as const) {
      const used = cell(page, n).locator(`[data-mirror-of="${id}"]`);
      await expect(used).toHaveCount(1);
      await expect(used).toHaveClass(/\bused\b/);
    }
    await expect(page.locator('[data-wordcell] .preview')).toHaveCount(0);
    await expect(page.locator('[data-wordcell] .preview-mark')).toHaveCount(0);
    // The reveal is undone: cell 6's 31 hides again under the used top (R-61), cell 3 is no longer
    // drawn empty and the badges count the current cards.
    await expect(cell(page, 6).getByTestId('card-31')).toHaveCount(1);
    await expect(cell(page, 6).getByTestId('card-31')).toBeHidden();
    await expect(cell(page, 6).locator('.count')).toHaveText('6');
    await expect(cell(page, 3)).not.toHaveClass(/\bempty\b/);
    await expect(cell(page, 3).locator('.count')).toHaveCount(0);
  });

  test('R-33 (UI) Q-49 AD-14 Validate into Place swaps the used mirror of 28 for the preview mirror of the strip top 9 with no mirror animation (session-place-free-letter-redo-tail + Undo)', async ({
    page,
  }) => {
    await open(page, 'session-place-free-letter-redo-tail', ['undo']);
    expect(await phase(page)).toBe('composing');
    await expect(cell(page, 3).locator('.used[data-mirror-of="28"]')).toHaveCount(1);
    await expect(primary(page)).toHaveText('Validate');
    const before = await mirrorAnimations(page);
    await primary(page).click();
    await expect.poll(() => phase(page)).toBe('place');
    await glidesSettled(page);
    await expect(cell(page, 3).locator('.used')).toHaveCount(0);
    // A fresh Validate drops the redo tail: the default strip [32, 28, 9] ends with 9.
    expect((await cursorMove(page)).placementOrder).toEqual([32, 28, 9]);
    await expectPreviewMirror(page, 3, 9, 5, [42, 0]);
    await expect(anyOf(page, 3, 28)).toHaveCount(0);
    expect(await mirrorAnimations(page)).toBe(before);
    expect(before).toBe(0);
  });

  test('R-50 (UI) Q-49 R-71 a Redo into Place shows the preview (session-place-free-letter-redo-tail + Undo)', async ({
    page,
  }) => {
    await open(page, 'session-place-free-letter-redo-tail', ['undo', 'redo']);
    expect(await phase(page)).toBe('place');
    await expectPreviewMirror(page, 3, 28, 5, [42, 0]);
    expect(await mirrorAnimations(page)).toBe(0);
  });

  test('R-50 (UI) Q-49 R-73 (UI) a reload into Place shows the preview (session-place-used-cells)', async ({
    page,
  }) => {
    await open(page, 'session-place-used-cells');
    await page.reload();
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await booted(page);
    await expectPreviewMirror(page, 5, 38, 5, []);
    await expectPreviewLive(page, 6, 31, 5);
    await expectPreviewEmpty(page, 3);
  });

  test('R-50 (UI) Q-49 R-70 AD-14 Undo of a commit (Idle → Place) shows the preview from the first frame while the live faces glide back, mirrors never animate (session-place)', async ({
    page,
  }) => {
    // Read in the click task of Undo, while the live faces glide back to the strip.
    await open(page, 'session-place');
    await primary(page).click();
    await glidesSettled(page);
    expect(await phase(page)).toBe('idle');
    const read = await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="undo"]')?.click();
      const animations = document.getAnimations();
      const onMirror = animations.filter((a) => {
        const target = (a.effect as KeyframeEffect | null)?.target;
        return target instanceof Element && target.closest('[data-mirror-of]') !== null;
      }).length;
      const faces = animations.filter((a) => {
        const target = (a.effect as KeyframeEffect | null)?.target;
        return target instanceof Element && target.classList.contains('face');
      }).length;
      return {
        preview: document.querySelectorAll(
          '[data-testid="wordcell-3"] .preview[data-mirror-of="28"]',
        ).length,
        onMirror,
        faces,
      };
    });
    expect(read).toEqual({ preview: 1, onMirror: 0, faces: expect.any(Number) });
    expect(read.faces).toBeGreaterThan(0);
    await glidesSettled(page);
    await expectPreviewMirror(page, 3, 28, 3, []);
    expect(await mirrorAnimations(page)).toBe(0);
  });

  test('R-50 (UI) Q-49 R-70 AD-14 Undo of a commit onto committed cards adds no hold: from the first frame the preview mirror of 26 shows over hidden 42, 0, 28 (session-place-onto-committed)', async ({
    page,
  }) => {
    await open(page, 'session-place-onto-committed');
    await primary(page).click();
    await glidesSettled(page);
    expect(await phase(page)).toBe('idle');
    // Read in the click task of Undo, while the live faces of 2, 19, 26 glide back to the strip.
    const read = await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="undo"]')?.click();
      const three = document.querySelector('[data-testid="wordcell-3"]');
      if (three === null) throw new Error('missing wordcell-3');
      const live = [...three.querySelectorAll(':scope > [data-card-id]')];
      return {
        preview: three.querySelectorAll('.preview[data-mirror-of="26"]').length,
        live: live.map((c) => Number(c.getAttribute('data-card-id'))),
        heldVisible: live.filter((c) => getComputedStyle(c).visibility !== 'hidden').length,
      };
    });
    expect(read).toEqual({ preview: 1, live: [42, 0, 28], heldVisible: 0 });
    await glidesSettled(page);
    await expectPreviewMirror(page, 3, 26, 6, [42, 0, 28]);
    expect(await mirrorAnimations(page)).toBe(0);
  });

  // The WordCells carrying the ★, in cell order.
  const marked = (page: Page) =>
    page
      .locator('[data-wordcell]:has(.preview-mark)')
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-wordcell'))));

  test('R-50 (UI) Q-49 the star marks a non-empty preview only: none on an empty one, an unchanged cell or after Undo to Composing; a not-legal changed cell dims at 35 % with card, star and badge', async ({
    page,
  }) => {
    await open(page, 'session-place-used-cells');
    // Non-empty previews 5 (mirror) and 6 (live 31) carry it; empty 3 and unchanged 4 do not.
    expect(await marked(page)).toEqual([5, 6]);
    await expect(page.locator('[data-wordcell] .preview-mark')).toHaveCount(2);
    await expectMarkCorner(page, cell(page, 6).getByTestId('card-31'));
    await expectMarkCorner(page, previewOf(page, 5, 38));
    await expectMarkOverFace(cell(page, 6).getByTestId('card-31'));
    await expectMarkOverFace(previewOf(page, 5, 38));
    // The ★ sits over the card flourish (`.face::after`) without suppressing it.
    for (const card of [cell(page, 6).getByTestId('card-31'), previewOf(page, 5, 38)]) {
      const content = await faceOf(card).evaluate((el) => getComputedStyle(el, '::after').content);
      expect(content).not.toBe('none');
    }
    // R-40: cell 6 is not legal: the whole cell at 35 %, card, star and badge inside it.
    const six = cell(page, 6);
    await expect(six).toHaveClass(/\bwc-dim\b/);
    await expect(six).toHaveCSS('opacity', '0.35');
    await expect(six.getByTestId('card-31')).toBeVisible();
    await expect(six.locator('.preview-mark')).toBeVisible();
    await expect(six.locator('.count')).toHaveText('5');

    await page.getByTestId('undo').click();
    await glidesSettled(page);
    expect(await phase(page)).toBe('composing');
    expect(await marked(page)).toEqual([]);
  });

  test('R-50 (UI) Q-49 the star goes with the commit: none after Confirm’s last landing (session-place-onto-committed)', async ({
    page,
  }) => {
    await open(page, 'session-place-onto-committed');
    expect(await marked(page)).toEqual([3]);
    await primary(page).click();
    await glidesSettled(page);
    expect(await phase(page)).toBe('idle');
    expect(await marked(page)).toEqual([]);
    await expect(page.locator('[data-wordcell] [data-mirror-of]')).toHaveCount(0);
  });
});
