import { expect, type Page, test } from '@playwright/test';
import { centre, glidesSettled, openFixture, tapAt, trayIds } from './helpers/board';

// Ticket 5.10 (epic 5 SPEC CAP-8, F6, F7, F17, F22; AD-14): the button-driven FLIP glides on
// android, with Animation speed Slow seeded (`prefs-non-default`, 320 ms base). Each step waits
// for every prior animation to finish, records the live faces' top-lefts, then clicks the button
// and reads `getAnimations()` in the same `page.evaluate` (animation time 0): the moving faces, and
// only they, run one animation each over 320 ms, start at their recorded top-left (within 1 px) and
// sit on the glide layer (`z-index: 1`); no wrapper and no mirror (nor a mirror's face) animates; a
// band-changing glide lifts the tile area's clip (`overflow: visible`). Expected values are
// literals from view() over session-composing (seed 1: S [42, 0] from column 3, D [28] at the
// bottom of column 6, k 1, side right; `+` adds 9, the next `+` 1; e2e/tray-controls.spec.ts),
// never edited to pass.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'FLIP glides run on android');
});

const SLOW_MS = 320;

type TopLeft = { x: number; y: number };
type FaceRead = {
  id: number;
  durations: number[];
  zIndex: string;
  x: number;
  y: number;
  place: string | null;
  band: string | null;
  column: string | null;
};
type Read = {
  live: number;
  animated: number[];
  faces: FaceRead[];
  wrapperAnimations: number;
  mirrorAnimations: number;
  tilesOverflow: string;
  blockMirrors: string[];
  wordcellMirrors: string[];
};

// The button: a data-testid, or a tray control by its text.
type Button = { testid: string } | { control: '+' | '\u2212' | 'Flip' };

// Live face top-lefts by CardId, once every prior animation has finished.
async function topLefts(page: Page): Promise<Map<number, TopLeft>> {
  await glidesSettled(page);
  const entries = await page.evaluate(() =>
    [...document.querySelectorAll('[data-card-id]')].map((el) => {
      const face = el.querySelector(':scope > .face');
      if (face === null) throw new Error('live card without a face');
      const r = face.getBoundingClientRect();
      return [Number(el.getAttribute('data-card-id')), { x: r.left, y: r.top }] as const;
    }),
  );
  return new Map(entries);
}

// Clicks `button` and reads, in the same task, the animations and the faces they run on.
function clickAndRead(page: Page, button: Button): Promise<Read> {
  return page.evaluate((b) => {
    let el: HTMLElement | null;
    if ('testid' in b) {
      el = document.querySelector(`[data-testid="${b.testid}"]`);
    } else {
      el =
        [...document.querySelectorAll<HTMLElement>('[data-band="tray"] .controls button')].find(
          (button) => button.textContent?.trim().endsWith(b.control),
        ) ?? null;
    }
    if (el === null) throw new Error(`no button ${JSON.stringify(b)}`);
    el.click();
    const live = [...document.querySelectorAll<HTMLElement>('[data-card-id]')];
    const faces: FaceRead[] = [];
    for (const wrapper of live) {
      const face = wrapper.querySelector<HTMLElement>(':scope > .face');
      if (face === null) throw new Error('live card without a face');
      const running = face.getAnimations().filter((a) => a.playState === 'running');
      if (running.length === 0) continue;
      const r = face.getBoundingClientRect();
      faces.push({
        id: Number(wrapper.getAttribute('data-card-id')),
        durations: running.map((a) => Number(a.effect?.getTiming().duration)),
        zIndex: getComputedStyle(face).zIndex,
        x: r.left,
        y: r.top,
        place: wrapper.getAttribute('data-place'),
        band: wrapper.closest('[data-band]')?.getAttribute('data-band') ?? null,
        column: wrapper.closest('[data-column]')?.getAttribute('data-column') ?? null,
      });
    }
    const tiles = document.querySelector('[data-band="tray"] .tiles');
    return {
      live: live.length,
      animated: faces.map((f) => f.id).sort((x, y) => x - y),
      faces,
      wrapperAnimations: live.reduce((n, w) => n + w.getAnimations().length, 0),
      mirrorAnimations: [...document.querySelectorAll('[data-mirror-of]')].reduce(
        (n, m) => n + m.getAnimations({ subtree: true }).length,
        0,
      ),
      tilesOverflow: tiles === null ? 'none' : getComputedStyle(tiles).overflow,
      blockMirrors: [...document.querySelectorAll('[data-band="tray"] [data-mirror-of]')].map(
        (m) => m.getAttribute('data-mirror-of') ?? '',
      ),
      wordcellMirrors: [
        ...document.querySelectorAll('[data-band="wordcells"] [data-mirror-of]'),
      ].map((m) => m.getAttribute('data-mirror-of') ?? ''),
    };
  }, button);
}

// The common assertions: exactly `moving` animate, each once over Slow 320 ms from its recorded
// top-left on the glide layer; 52 live elements; no wrapper or mirror animation.
function expectGlides(read: Read, moving: readonly number[], before: Map<number, TopLeft>): void {
  expect(read.live).toBe(52);
  expect(read.animated).toEqual([...moving].sort((x, y) => x - y));
  for (const face of read.faces) {
    expect(face.durations, `card ${face.id}`).toEqual([SLOW_MS]);
    expect(face.zIndex, `card ${face.id}`).toBe('1');
    const from = before.get(face.id);
    if (from === undefined) throw new Error(`card ${face.id} not recorded`);
    expect(Math.abs(face.x - from.x), `card ${face.id} x`).toBeLessThanOrEqual(1);
    expect(Math.abs(face.y - from.y), `card ${face.id} y`).toBeLessThanOrEqual(1);
  }
  expect(read.wrapperAnimations).toBe(0);
  expect(read.mirrorAnimations).toBe(0);
}

const face = (read: Read, id: number): FaceRead => {
  const found = read.faces.find((f) => f.id === id);
  if (found === undefined) throw new Error(`card ${id} not animated`);
  return found;
};

test('R-70 AD-14 F22 Validate → Undo → Undo → Redo on session-composing: the D faces glide column → strip and back while their block copies vanish and reappear at once; Undo to Composing keeps the arrangement and Undo to Idle returns S to column 3, animated; one live element per card, wrappers and mirrors never animate', async ({
  page,
}) => {
  await openFixture(page, 'session-composing', { prefs: 'prefs-non-default' });
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('Validate');
  await expect(primary).toBeEnabled();
  // The D ids are the block mirrors' data-mirror-of before Validate.
  const d = await page
    .locator('[data-band="tray"] [data-mirror-of]')
    .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-mirror-of'))));
  expect(d).toEqual([28]);

  // Validate: D faces from column 6 into the strip, the tile area unclipped, block copies gone.
  let before = await topLefts(page);
  let read = await clickAndRead(page, { testid: 'primary-action' });
  expectGlides(read, d, before);
  for (const id of d) {
    expect(face(read, id).place).toBe('strip');
    expect(face(read, id).band).toBe('tray');
  }
  expect(read.tilesOverflow).toBe('visible');
  expect(read.blockMirrors).toEqual([]);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['42', '0', '28']);

  // Undo Place → Composing: D faces from their strip top-lefts back to column 6, block copies back
  // at once; the arrangement is kept.
  before = await topLefts(page);
  read = await clickAndRead(page, { testid: 'undo' });
  expectGlides(read, d, before);
  for (const id of d) {
    expect(face(read, id).place).toBe('column');
    expect(face(read, id).column).toBe('6');
  }
  expect(read.tilesOverflow).toBe('visible');
  expect(read.blockMirrors).toEqual(['28']);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['42', '0', '28m']);

  // Undo Composing → Idle: the S faces glide from the tray back to column 3.
  before = await topLefts(page);
  read = await clickAndRead(page, { testid: 'undo' });
  expectGlides(read, [42, 0], before);
  for (const id of [42, 0]) expect(face(read, id).column).toBe('3');
  expect(read.blockMirrors).toEqual([]);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual([]);

  // Redo Idle → Composing: the S faces glide back into the tray (undoRedo, not a commit).
  before = await topLefts(page);
  read = await clickAndRead(page, { testid: 'redo' });
  expectGlides(read, [42, 0], before);
  for (const id of [42, 0]) expect(face(read, id).place).toBe('tray');
  expect(read.tilesOverflow).toBe('visible');
  expect(read.blockMirrors).toEqual(['28']);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['42', '0', '28m']);
});

test('AD-14 F17 on a fresh session-composing (block right, k 1): + with a tile selected moves no face; Flip glides the S faces on the glide layer; + with the block left glides them one slot and − glides them back', async ({
  page,
}) => {
  await openFixture(page, 'session-composing', { prefs: 'prefs-non-default' });
  await tapAt(page, await centre(page.locator('[data-band="tray"]').getByTestId('card-42')));
  await expect(page.locator('[data-band="tray"] [data-card-id="42"].selected')).toHaveCount(1);

  // + with the block right: the tapped tile keeps its slot (deselected, unlifted at capture).
  let before = await topLefts(page);
  let read = await clickAndRead(page, { control: '+' });
  expectGlides(read, [], before);
  expect(read.blockMirrors).toEqual(['28', '9']);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['42', '0', '28m', '9m']);
  await expect(page.locator('[data-band="tray"] [data-card-id].selected')).toHaveCount(0);

  // Flip: the S faces move past the block.
  before = await topLefts(page);
  read = await clickAndRead(page, { control: 'Flip' });
  expectGlides(read, [42, 0], before);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['9m', '28m', '42', '0']);

  // + with the block left: one more D copy on the left, the S faces one slot right.
  before = await topLefts(page);
  read = await clickAndRead(page, { control: '+' });
  expectGlides(read, [42, 0], before);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['1m', '9m', '28m', '42', '0']);

  // − with the block left: one D copy fewer, the S faces one slot back.
  before = await topLefts(page);
  read = await clickAndRead(page, { control: '\u2212' });
  expectGlides(read, [42, 0], before);
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual(['9m', '28m', '42', '0']);
});

test('AD-14 F27 Undo Composing → Idle on session-place-free-letter-two-cards + one Undo: the free letter 28 glides from the tray back into WordCell 4 on the glide layer, the S faces into their column', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-two-cards', {
    prefs: 'prefs-non-default',
    steps: ['undo'],
  });
  // Composing: D 26 as the block copy, S 32, 45, 42 and the free letter 28 (from cell 4).
  expect(await trayIds(page)).toEqual(['26m', '32', '45', '28', '42']);

  const before = await topLefts(page);
  const read = await clickAndRead(page, { testid: 'undo' });
  expectGlides(read, [28, 32, 42, 45], before);
  expect(face(read, 28).place).toBe('cell');
  expect(face(read, 28).zIndex).toBe('1');
  // F27 (owner): no used mirror of 28 is held in the WordCell band while the letter flies home.
  expect(read.wordcellMirrors.filter((m) => m === '28')).toHaveLength(0);
  for (const id of [32, 42, 45]) expect(face(read, id).place).toBe('column');
  expect(read.tilesOverflow).toBe('visible');
  await glidesSettled(page);
  expect(await trayIds(page)).toEqual([]);
});
