import { expect, type Locator, type Page, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { onAndroid } from './helpers/project';
import { tokenColor } from './helpers/style';

// Epic themes ticket 5 (TH-5, TH-9, AD-14): the art hooks end to end on android, against a build
// carrying the test hook (the test-only `garden` theme, src/ui/theme/garden.css, is registered
// there). Fixture: `prefs-theme-garden`. Contrast floors: contrast.test.ts TABLE card-ink 4.5.

test.beforeEach(onAndroid);

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
      for (let i = 0; i < data.length; i += 4) {
        const l = lum(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0);
        const r = (Math.max(l, inkLum) + 0.05) / (Math.min(l, inkLum) + 0.05);
        worst = Math.min(worst, r);
      }
      return worst;
    },
    { b64: png.toString('base64'), inkColour: ink },
  );
}

test('TH-9 AD-14 garden: the worst pixel under the letter of a live card, the QU card, a tray tile and a block or destination card meets 4.5 against card-ink', async ({
  page,
}) => {
  await openFixture(page, 'session-composing', { prefs: 'prefs-theme-garden' });
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('garden');
  const ink = await tokenColor(page, '--wc-card-ink');
  await page.addStyleTag({
    content: '.glyph, .lock, .badge, .mark { visibility: hidden !important; }',
  });

  const live = page.locator('[data-testid="column-1"] [data-card-id]').first();
  const qu = page.locator('[data-card-id]:has(.glyph.qu)').first();
  const trayTile = page.locator('[data-band="tray"] .card.tile').first();
  const destination = page.locator('[data-testid="column-6"] .card.destination').first();
  const block = page.locator('[data-band="tray"] .card.block').first();
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

test('TH-9 garden: a used face keeps its hatch and no texture, html carries the table image and body none', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', { prefs: 'prefs-theme-garden' });
  const used = page.getByTestId('wordcell-3').locator('[data-mirror-of="28"] .face');
  const usedImage = await style(used, 'background-image');
  expect(usedImage).toContain('repeating-linear-gradient');
  expect(usedImage).not.toMatch(IMAGE);
  expect(await style(page.locator('html'), 'background-image')).toMatch(IMAGE);
  expect(await style(page.locator('body'), 'background-image')).toBe('none');
  expect(await style(page.locator('body'), 'background-color')).toBe('rgba(0, 0, 0, 0)');
});

test('TH-9 garden: a ghost has no image and the sticky bars stay flat', async ({ page }) => {
  await openFixture(page, 'session-composing', { prefs: 'prefs-theme-garden' });
  const ghost = page.locator('.card.ghost .face').first();
  await expect(ghost).toHaveCount(1);
  expect(await style(ghost, 'background-image')).toBe('none');
  for (const bar of ['topBar', 'actionBar', 'banner']) {
    const el = page.locator(`[data-band="${bar}"]`);
    if ((await el.count()) > 0) expect(await style(el, 'background-image'), bar).toBe('none');
  }
});

test('TH-9 default: both art tokens resolve to none and nothing is painted', async ({ page }) => {
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

test('TH-9 P6 a theme switch default to garden changes no rect, nor the document scroll size', async ({
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
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'garden';
  });
  expect(await style(page.locator('html'), 'background-image')).toMatch(IMAGE);
  expect(await measure()).toEqual(before);
});
