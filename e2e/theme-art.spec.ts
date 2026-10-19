import { expect, type Locator, type Page, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { onAndroid } from './helpers/project';
import { tokenColor } from './helpers/style';

// Epic themes ticket 5 (TH-5, TH-9, AD-14): the art hooks end to end on android, against the
// dev server (Greenhouse Dusk `garden` and Deep Space `scifi` are registered in every build).
// Fixture: `prefs-theme-garden`. Contrast floors: contrast.test.ts TABLE card-ink 4.5.

test.beforeEach(onAndroid);

const ARTS = [
  { id: 'garden', prefs: 'prefs-theme-garden', radio: 'Greenhouse Dusk' },
  { id: 'steampunk', prefs: 'prefs-theme-steampunk', radio: 'Brass and Walnut' },
  { id: 'scifi', prefs: 'prefs-theme-scifi', radio: 'Deep Space' },
] as const;

const IMAGE = /data:image\/svg\+xml/;

const style = (el: Locator, prop: string) =>
  el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop);

// The worst contrast against `ink` over the screenshot of the glyph box of `card`, with every
// glyph (and the non-letter marks, exempt per TH-9) hidden so only the face (colour plus texture) shows.
async function worstOverGlyphBox(page: Page, card: Locator, ink: string): Promise<number> {
  await card.scrollIntoViewIfNeeded();
  // The letter box clipped to the card's visible strip: the next card of a column covers the rest.
  const b = await card.evaluate((el) => {
    const g = (el.querySelector('.glyph') as Element).getBoundingClientRect();
    const w = el.getBoundingClientRect();
    // Whole pixels, inset by the face's 6 px corner radius (and 2 px at the strip's end, so the next
    // card's top border is never sampled).
    const bottom = Math.floor(Math.min(g.bottom, w.bottom)) - 2;
    const x = Math.ceil(g.x) + 6;
    const y = Math.ceil(g.y) + 6;
    return { x, y, width: Math.floor(g.width) - 13, height: bottom - y };
  });
  expect(b.width).toBeGreaterThan(4);
  expect(b.height).toBeGreaterThan(4);
  const png = await page.screenshot({ clip: b });
  return await page.evaluate(
    async ({ b64, inkColour }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx === null) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      const lin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const lum = (r: number, g: number, bl: number) =>
        0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
      const [ir = 0, ig = 0, ib = 0] = (inkColour.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
      const inkLum = lum(ir, ig, ib);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let worst = Number.POSITIVE_INFINITY;
      const first = [data[0], data[1], data[2]].join();
      let textured = false;
      for (let i = 0; i < data.length; i += 4) {
        if ([data[i], data[i + 1], data[i + 2]].join() !== first) textured = true;
        const l = lum(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0);
        const r = (Math.max(l, inkLum) + 0.05) / (Math.min(l, inkLum) + 0.05);
        worst = Math.min(worst, r);
      }
      if (!textured)
        throw new Error('the sampled region is uniform: no texture reached the pixels');
      return worst;
    },
    { b64: png.toString('base64'), inkColour: ink },
  );
}

for (const { id, prefs } of ARTS) {
  test(`AD-14 TH-9 ${id}: the worst pixel under the letter of a live card, the QU card, a tray tile and a block or destination card meets 4.5 against card-ink`, async ({
    page,
  }) => {
    await openFixture(page, 'session-composing', { prefs });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(id);
    const ink = await tokenColor(page, '--wc-card-ink');
    await page.addStyleTag({
      content: '.glyph, .lock, .badge, .mark { visibility: hidden !important; }',
    });

    const live = page.locator('[data-testid="column-1"] [data-card-id]').first();
    const qu = page.locator('[data-card-id]:has(.glyph.qu)');
    const trayTile = page.locator('[data-band="tray"] .card.tile').first();
    const destination = page.locator('[data-testid="column-6"] .card.destination');
    const block = page.locator('[data-band="tray"] .card.block');
    for (const [name, card] of [
      ['live', live],
      ['QU', qu],
      ['tray tile', trayTile],
      ['destination', destination],
      ['block mirror', block],
    ] as const) {
      await expect(card, name).toHaveCount(1);
      // The texture is really on the face.
      expect(await style(card.locator('.face'), 'background-image'), name).toMatch(IMAGE);
      expect(await worstOverGlyphBox(page, card, ink), name).toBeGreaterThanOrEqual(4.5);
    }
  });
}

for (const { id, prefs } of ARTS) {
  test(`AD-14 TH-9 ${id}: a used face keeps its hatch and no texture, html carries the table image and body none`, async ({
    page,
  }) => {
    await openFixture(page, 'session-place-free-letter-redo-tail', { prefs });
    const used = page.locator('.card.used .face');
    await expect(used).toHaveCount(1);
    const usedImage = await style(used, 'background-image');
    expect(usedImage).toContain('repeating-linear-gradient');
    expect(usedImage).not.toMatch(IMAGE);
    expect(await style(page.locator('html'), 'background-image')).toMatch(IMAGE);
    expect(await style(page.locator('body'), 'background-image')).toBe('none');
    expect(await style(page.locator('body'), 'background-color')).toBe('rgba(0, 0, 0, 0)');
  });
}

for (const { id, prefs } of ARTS) {
  test(`AD-14 TH-9 ${id}: a ghost has no image and the sticky bars stay flat`, async ({ page }) => {
    await openFixture(page, 'session-composing', { prefs });
    const ghost = page.locator('.card.ghost .face').first();
    await expect(ghost).toHaveCount(1);
    expect(await style(ghost, 'background-image')).toBe('none');
    for (const bar of ['topBar', 'actionBar']) {
      const el = page.locator(`[data-band="${bar}"]`);
      await expect(el, bar).toHaveCount(1);
      expect(await style(el, 'background-image'), bar).toBe('none');
      expect(await style(el, 'background-color'), bar).toMatch(/^rgb\(/);
    }
  });
}

test('AD-14 TH-9 default: both art tokens resolve to none and nothing is painted', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('default');
  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return [
      cs.getPropertyValue('--wc-table-art').trim(),
      cs.getPropertyValue('--wc-card-texture').trim(),
    ];
  });
  expect(tokens).toEqual(['none', 'none']);
  expect(await style(page.locator('html'), 'background-image')).toBe('none');
  expect(await style(page.locator('[data-card-id] .face').first(), 'background-image')).toBe(
    'none',
  );
});

for (const { id, radio } of ARTS) {
  test(`AD-14 TH-9 P6 a theme switch default to ${id} changes no rect, nor the document scroll size`, async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    const measure = () =>
      page.evaluate(() => {
        const rect = (el: Element) => {
          const r = el.getBoundingClientRect();
          return [r.x, r.y, r.width, r.height];
        };
        const sel = [
          '[data-testid^="column-"]',
          '[data-testid^="wordcell-"]',
          '[data-card-id]',
          '[data-band]',
          '.card[data-mirror-of]',
        ];
        const el = document.documentElement;
        return {
          rects: sel.map((s) => [...document.querySelectorAll(s)].map(rect)),
          scrollHeight: el.scrollHeight,
          scrollWidth: el.scrollWidth,
        };
      });
    const before = await measure();
    expect(before.rects.every((group) => group.length > 0)).toBe(true);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Menu', exact: true })
      .getByRole('button', { name: 'Preferences', exact: true })
      .click();
    const prefs = page.getByRole('dialog', { name: 'Preferences', exact: true });
    await prefs
      .getByRole('radiogroup', { name: 'Theme' })
      .getByRole('radio', { name: radio })
      .check();
    await prefs.getByRole('button', { name: 'Close preferences' }).click();
    await expect(prefs).toBeHidden();
    expect(await style(page.locator('html'), 'background-image')).toMatch(IMAGE);
    expect(await measure()).toEqual(before);
  });
}
