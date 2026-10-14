import { expect, type Page, test } from '@playwright/test';
import { centre, column, glidesSettled, openFixture, tapAt, trayIds } from './helpers/board';
import { touchHold } from './helpers/touch';

// Ticket 5.16 (epic 5 SPEC CAP-8, F7, F17; AD-14): FLIP for controller-driven moves on android,
// Animation speed Slow seeded (`prefs-non-default`, 320 ms base). One `page.evaluate` right after
// the touch ends reads the running animations (positive remaining time) on live faces only; none
// on wrappers or mirrors. A drag release's dragged face, read at animation time 0, sits on its
// released rect within 1 px (the open question: WAAPI composing with the drag transform).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'FLIP glides run on android');
});

// `glided`: the running faces carrying the FLIP `wc-glide` class (a fly-back has none).
type Read = { faces: number[]; glided: number[]; wrappers: number; mirrors: number };

// The live cards whose face runs an animation with time left, and the wrapper/mirror animations.
function readGlides(page: Page): Promise<Read> {
  return page.evaluate(() => {
    const live = [...document.querySelectorAll<HTMLElement>('[data-card-id]')];
    const left = (el: Element) =>
      el
        .getAnimations()
        .some(
          (a) =>
            a.playState === 'running' &&
            Number(a.effect?.getTiming().duration) - Number(a.currentTime) > 0,
        );
    const running = live.filter((w) => {
      const f = w.querySelector(':scope > .face');
      return f !== null && left(f);
    });
    const ids = (ws: HTMLElement[]) =>
      ws.map((w) => Number(w.getAttribute('data-card-id'))).sort((a, b) => a - b);
    return {
      faces: ids(running),
      glided: ids(running.filter((w) => w.querySelector(':scope > .face.wc-glide') !== null)),
      wrappers: live.reduce((n, w) => n + w.getAnimations().length, 0),
      mirrors: [...document.querySelectorAll('[data-mirror-of]')].reduce(
        (n, m) => n + m.getAnimations({ subtree: true }).length,
        0,
      ),
    };
  });
}

const faceRectNow = (page: Page, id: number) =>
  page.evaluate((cardId) => {
    const f = document.querySelector(`[data-card-id="${cardId}"] > .face`);
    if (f === null) throw new Error(`no face ${cardId}`);
    const r = f.getBoundingClientRect();
    return { x: r.left, y: r.top };
  }, id);

// The face's rect once two reads 50 ms apart agree (a coalesced pointermove has been applied).
async function faceRect(page: Page, id: number): Promise<{ x: number; y: number }> {
  let previous = await faceRectNow(page, id);
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(50);
    const next = await faceRectNow(page, id);
    if (next.x === previous.x && next.y === previous.y) return next;
    previous = next;
  }
  throw new Error(`face ${id} rect never settled`);
}

// Running animations whose target sits inside a live card (`[data-card-id]`).
const cardAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => (a.effect as KeyframeEffect).target?.closest('[data-card-id]') != null)
        .length,
  );

// Pauses the face's animations at time 0 (the first keyframe) and reads the rendered rect.
const rectAtTimeZero = (page: Page, id: number) =>
  page.evaluate((cardId) => {
    const f = document.querySelector<HTMLElement>(`[data-card-id="${cardId}"] > .face`);
    if (f === null) throw new Error(`no face ${cardId}`);
    const animations = f.getAnimations();
    for (const a of animations) {
      a.pause();
      a.currentTime = 0;
    }
    const r = f.getBoundingClientRect();
    for (const a of animations) a.play();
    return { x: r.left, y: r.top, animations: animations.length };
  }, id);

const tile = (page: Page, id: number) =>
  page.locator('[data-band="tray"]').getByTestId(`card-${id}`);

async function expectGlide(page: Page, ids: readonly number[]): Promise<void> {
  const read = await readGlides(page);
  expect(read.faces).toEqual([...ids].sort((a, b) => a - b));
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
}

// A parted or shifted face's glide can already have settled under load: the moving face must run.
async function expectGlideAmong(
  page: Page,
  moving: number,
  allowed: readonly number[],
): Promise<void> {
  const read = await readGlides(page);
  expect(read.faces).toContain(moving);
  expect(read.faces.every((id) => allowed.includes(id))).toBe(true);
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
}

test('AD-14 F7 a tap-drop (select the column 3 tail, tap column 1) glides the moved faces by snap', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-empty-column', { prefs: 'prefs-non-default' });
  const tail = column(page, 3).locator('[data-place="column"]');
  const top = tail.last();
  const id = Number(await top.getAttribute('data-card-id'));
  await tapAt(page, await centre(top));
  await expect(page.locator('[data-selection-outline]')).toHaveCount(1);
  await tapAt(page, await centre(column(page, 1)));
  await expectGlide(page, [id]);
  await glidesSettled(page);
});

test('AD-14 F17 a tail drop glides from the released point: the first keyframe renders at the last pointermove rect within 1 px', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-empty-column', { prefs: 'prefs-non-default' });
  const top = column(page, 3).locator('[data-place="column"]').last();
  const id = Number(await top.getAttribute('data-card-id'));
  const from = await centre(top);
  const to = await centre(column(page, 1));
  const hold = await touchHold(page, from);
  let released: { x: number; y: number };
  try {
    await hold.moveTo({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 });
    await hold.moveTo(to);
    released = await faceRect(page, id);
  } finally {
    await hold.end();
  }
  const read = await readGlides(page);
  expect(read.faces).toEqual([id]);
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
  const after = await rectAtTimeZero(page, id);
  expect(after.animations).toBeGreaterThan(0);
  expect(Math.abs(after.x - released.x)).toBeLessThan(1);
  expect(Math.abs(after.y - released.y)).toBeLessThan(1);
  await glidesSettled(page);
});

test('AD-14 F17 a two-card tail drop glides its first and last face from the released point (zero-distance faces excluded)', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-empty-column', { prefs: 'prefs-non-default' });
  const tail = column(page, 3).locator('[data-place="column"]');
  const first = tail.nth((await tail.count()) - 2);
  const last = tail.last();
  const ids = [
    Number(await first.getAttribute('data-card-id')),
    Number(await last.getAttribute('data-card-id')),
  ];
  const from = await centre(first);
  const to = await centre(column(page, 4).locator('[data-place="column"]').last());
  const hold = await touchHold(page, from);
  const released = new Map<number, { x: number; y: number }>();
  try {
    await hold.moveTo({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 });
    await hold.moveTo(to);
    for (const id of ids) released.set(id, await faceRect(page, id));
  } finally {
    await hold.end();
  }
  const read = await readGlides(page);
  expect(read.faces).toEqual([...ids].sort((a, b) => a - b));
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
  for (const id of ids) {
    const after = await rectAtTimeZero(page, id);
    // A face whose settled rect equals its released rect has no glide to check.
    if (after.animations === 0) continue;
    const at = released.get(id);
    if (at === undefined) throw new Error(`card ${id} not recorded`);
    expect(Math.abs(after.x - at.x), `card ${id} x`).toBeLessThan(1);
    expect(Math.abs(after.y - at.y), `card ${id} y`).toBeLessThan(1);
  }
  await glidesSettled(page);
});

test('AD-14 F7 a tile swap by two taps glides the swapped tile faces', async ({ page }) => {
  await openFixture(page, 'session-composing', { prefs: 'prefs-non-default' });
  await tapAt(page, await centre(tile(page, 42)));
  await tapAt(page, await centre(tile(page, 0)));
  await expectGlide(page, [42, 0]);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['0', '42', '28m']);
});

test('AD-14 F17 a tile released over an accepted gap glides from the released point, the dragged tile within 1 px of it', async ({
  page,
}) => {
  await openFixture(page, 'session-composing', { prefs: 'prefs-non-default' });
  const from = await centre(tile(page, 0));
  const target = await centre(tile(page, 42));
  const hold = await touchHold(page, from);
  let released: { x: number; y: number };
  try {
    await hold.moveTo({ x: (from.x + target.x) / 2, y: from.y });
    await hold.moveTo({ x: target.x - 20, y: target.y });
    released = await faceRect(page, 0);
  } finally {
    await hold.end();
  }
  const read = await readGlides(page);
  // The parted tile 42's glide can already have settled under load: the dragged face 0 must run.
  expect(read.faces).toContain(0);
  expect(read.faces.every((id) => id === 0 || id === 42)).toBe(true);
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
  const after = await rectAtTimeZero(page, 0);
  expect(after.animations).toBeGreaterThan(0);
  expect(Math.abs(after.x - released.x)).toBeLessThan(1);
  expect(Math.abs(after.y - released.y)).toBeLessThan(1);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['0', '42', '28m']);
});

test('AD-14 F17 a no-edit tile release flies back with no FLIP glide and a press mid-glide settles it (P5)', async ({
  page,
}) => {
  await openFixture(page, 'session-composing', { prefs: 'prefs-non-default' });
  const from = await centre(tile(page, 0));
  const hold = await touchHold(page, from);
  try {
    await hold.moveTo({ x: from.x + 12, y: from.y });
  } finally {
    await hold.end();
  }
  const read = await readGlides(page);
  // The fly-back animates the face, but no FLIP glide (`wc-glide`) runs.
  expect(read.glided).toEqual([]);
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
  await glidesSettled(page);
  // P5: an edit, then a press during the glide finishes it and acts on the settled view.
  const target = await centre(tile(page, 42));
  const second = await touchHold(page, await centre(tile(page, 0)));
  try {
    await second.moveTo({ x: (from.x + target.x) / 2, y: from.y });
    await second.moveTo({ x: target.x - 20, y: target.y });
  } finally {
    await second.end();
  }
  await expectGlideAmong(page, 0, [0, 42]);
  await tapAt(page, await centre(tile(page, 42)));
  expect(await cardAnimations(page)).toBe(0);
  await expect(page.locator('[data-band="tray"] [data-card-id].selected')).toHaveCount(1);
});

// --- Composing on session-idle-empty-column after a tap drop of column 3's tail [42, 0] onto
// column 4 (tray [32m, 42, 0]; cell 7's top 48 is the one free-letter source). --------------------

const cell7Top = (page: Page) => page.getByTestId('wordcell-7').getByTestId('card-48');

async function composing(page: Page, { reduced = false } = {}): Promise<void> {
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'session-idle-empty-column', { prefs: 'prefs-non-default' });
  const tail = column(page, 3).locator('[data-place="column"]');
  await tapAt(page, await centre(tail.nth((await tail.count()) - 2)));
  await tapAt(page, await centre(column(page, 4).locator('[data-place="column"]').last()));
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['32m', '42', '0']);
}

// Moves the face of `id` held from its centre to (dx, dy) from there; ends the touch and reads the
// glides in the next evaluate. Returns the glide read.
async function dragRelease(page: Page, id: number, to: { x: number; y: number }): Promise<Read> {
  const from = await centre(page.locator(`[data-card-id="${id}"]`));
  const hold = await touchHold(page, from);
  try {
    await hold.moveTo({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 });
    await hold.moveTo(to);
    await faceRect(page, id);
  } finally {
    await hold.end();
  }
  return readGlides(page);
}

test('AD-14 F7 a tap-add of cell 7’s top glides the free letter into the tray, faces only', async ({
  page,
}) => {
  await composing(page);
  await tapAt(page, await centre(cell7Top(page)));
  const read = await readGlides(page);
  expect(read.faces).toEqual([48]);
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
  await glidesSettled(page);
  expect(await trayIds(page)).toContain('48');
});

test('AD-14 F7 a removal (second tap on the selected free letter) glides it back to cell 7, faces only', async ({
  page,
}) => {
  await composing(page);
  await tapAt(page, await centre(cell7Top(page)));
  await glidesSettled(page);
  await tapAt(page, await centre(tile(page, 48)));
  await expect(tile(page, 48)).toHaveClass(/\bselected\b/);
  await tapAt(page, await centre(tile(page, 48)));
  const read = await readGlides(page);
  expect(read.faces).toEqual([48]);
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
  await glidesSettled(page);
  expect(await trayIds(page)).not.toContain('48');
});

test('AD-14 F17 a free-letter edit release glides from the released point', async ({ page }) => {
  await composing(page);
  const target = await centre(tile(page, 0));
  const from = await centre(cell7Top(page));
  const hold = await touchHold(page, from);
  let released: { x: number; y: number };
  try {
    await hold.moveTo({ x: (from.x + target.x) / 2, y: (from.y + target.y) / 2 });
    await hold.moveTo({ x: target.x + 30, y: target.y });
    released = await faceRect(page, 48);
  } finally {
    await hold.end();
  }
  const read = await readGlides(page);
  expect(read.faces).toEqual([48]);
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
  const after = await rectAtTimeZero(page, 48);
  expect(Math.abs(after.x - released.x)).toBeLessThan(1);
  expect(Math.abs(after.y - released.y)).toBeLessThan(1);
  await glidesSettled(page);
  expect(await trayIds(page)).toContain('48');
});

test('AD-14 F17 under reduced motion an edit release plays the fade on the moving faces', async ({
  page,
}) => {
  await composing(page, { reduced: true });
  const target = await centre(tile(page, 42));
  const read = await dragRelease(page, 0, { x: target.x - 20, y: target.y });
  expect(read.faces).toEqual([0]);
  expect(read.wrappers).toBe(0);
  expect(read.mirrors).toBe(0);
  const keys = await page.evaluate(() =>
    (document.querySelector('[data-card-id="0"] > .face') as HTMLElement)
      .getAnimations()
      .flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().map((k) => Object.keys(k))),
  );
  expect(keys.flat()).toContain('opacity');
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['32m', '0', '42']);
});

test('AD-14 F6 P5 a press mid-glide on a card whose post-edit rect differs from its mid-glide rect finishes the glide and acts on the post-edit view', async ({
  page,
}) => {
  await composing(page);
  const target = await centre(tile(page, 42));
  const read = await dragRelease(page, 0, { x: target.x - 20, y: target.y });
  expect(read.faces).toContain(0);
  expect(read.faces.every((id) => id === 0 || id === 42)).toBe(true);
  // Card 0's wrapper is at its post-edit slot; its face still glides from the released point.
  const wrapper = await centre(tile(page, 0));
  const face = await faceRectNow(page, 0);
  expect(Math.abs(face.x - (wrapper.x - 23)) + Math.abs(face.y - (wrapper.y - 30))).toBeGreaterThan(
    1,
  );
  await tapAt(page, wrapper);
  expect(await cardAnimations(page)).toBe(0);
  await expect(tile(page, 0)).toHaveClass(/\bselected\b/);
  await expect(page.locator('[data-band="tray"] [data-card-id].selected')).toHaveCount(1);
});
