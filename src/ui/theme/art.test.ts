import { describe, expect, it } from 'vitest';
import { checkTexture, colourOpacities, parseArt, worstRatio } from './art';

// Epic themes TH-9 / TH-5: the art token grammar, the texture cap and the worst-point stacking.

const wrap = (inner: string, attrs = "width='24' height='24' viewBox='0 0 24 24'") =>
  `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' ${attrs}>${inner}</svg>")`;
const GOLDEN = wrap("<path d='M0 12h24' fill='none' stroke='%23fff' stroke-opacity='0.04'/>");

describe('AD-14 theme art grammar', () => {
  it('AD-14 none parses to null and the golden token parses', () => {
    expect(parseArt('none')).toBeNull();
    const art = parseArt(GOLDEN);
    expect(art?.width).toBe(24);
    expect(art?.height).toBe(24);
    expect(art?.shapes).toEqual([
      { element: 'path', fill: null, fillOpacity: 1, stroke: '#ffffff', strokeOpacity: 0.04 },
    ]);
  });

  it('AD-14 a stroke-only shape counts its stroke and no fill', () => {
    expect([...colourOpacities(parseArt(GOLDEN) as never)]).toEqual([['#ffffff', 0.04]]);
  });

  it('AD-14 four distinct colours parse', () => {
    const art = parseArt(
      wrap(
        ['fff', '000', 'f00', '0f0']
          .map((c) => `<rect width='1' height='1' fill='%23${c}'/>`)
          .join(''),
      ),
    );
    expect(colourOpacities(art as never).size).toBe(4);
  });

  it('AD-14 rect, circle, path, #rgb and #rrggbb parse; opacities default to 1', () => {
    const art = parseArt(
      wrap(
        "<rect x='1' y='1' width='4' height='4' fill='%23abc'/><circle cx='5' cy='5' r='2' fill='%23AABBCC' stroke='%23123456' stroke-width='2'/>",
      ),
    );
    expect(art?.shapes).toHaveLength(2);
    expect([...colourOpacities(art as never)]).toEqual([
      ['#aabbcc', 1],
      ['#123456', 1],
    ]);
  });

  it('AD-14 per colour the opacities of every fill and stroke sum, capped at 1', () => {
    const art = parseArt(
      wrap(
        "<rect width='4' height='4' fill='%23fff' fill-opacity='0.6' stroke='%23fff' stroke-opacity='0.6'/><circle cx='5' cy='5' r='2' fill='%23000' fill-opacity='0.02'/><circle cx='9' cy='9' r='2' fill='%23000' fill-opacity='0.03'/>",
      ),
    ) as never;
    const sums = colourOpacities(art);
    expect(sums.get('#ffffff')).toBe(1);
    expect(sums.get('#000000')).toBeCloseTo(0.05);
  });

  it.each([
    ['missing fill', wrap("<path d='M0 12h24' stroke='%23abc'/>")],
    ['fill none without stroke', wrap("<path d='M0 12h24' fill='none'/>")],
    ['attributes on a g', wrap("<g fill='%23abc'><path d='M0 12h24' fill='%23abc'/></g>")],
    ['other element', wrap("<line x1='0' y1='0' x2='4' y2='4' fill='%23abc'/>")],
    ['gradient', wrap("<rect width='4' height='4' fill='url(%23g)'/>")],
    ['href', wrap("<path d='M0 0h4' fill='%23abc' href='x'/>")],
    ['script', wrap('<script></script>')],
    ['external url()', wrap("<rect width='4' height='4' fill='url(http://x/y)'/>")],
    ['var()', wrap("<rect width='4' height='4' fill='var(--wc-card-ink)'/>")],
    ['named colour', wrap("<rect width='4' height='4' fill='red'/>")],
    ['double-quoted attribute', wrap('<rect width="4" height="4" fill="%23abc"/>')],
    ['opacity above 1', wrap("<rect width='4' height='4' fill='%23abc' fill-opacity='1.5'/>")],
    [
      'opacity without paint',
      wrap("<path d='M0 0h4' fill='none' stroke='%23abc' fill-opacity='0.5'/>"),
    ],
    ['duplicate attribute', wrap("<rect width='4' height='4' fill='%23abc' fill='%23def'/>")],
    [
      'stroke-width without stroke',
      wrap("<rect width='4' height='4' fill='%23abc' stroke-width='2'/>"),
    ],
    ['no shapes', wrap('')],
    [
      'non-integer width',
      wrap(
        "<rect width='4' height='4' fill='%23abc'/>",
        "width='2.5' height='24' viewBox='0 0 2.5 24'",
      ),
    ],
    [
      'viewBox not the tile size',
      wrap(
        "<rect width='4' height='4' fill='%23abc'/>",
        "width='24' height='24' viewBox='0 0 12 12'",
      ),
    ],
    ['not a url', 'red'],
    [
      'raw hash',
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1' viewBox='0 0 1 1'><rect width='1' height='1' fill='#fff'/></svg>\")",
    ],
    ['two urls', `${GOLDEN}, ${GOLDEN}`],
    [
      'five colours',
      wrap(
        ['fff', '000', 'f00', '0f0', '00f']
          .map((c) => `<rect width='1' height='1' fill='%23${c}'/>`)
          .join(''),
      ),
    ],
  ])('AD-14 %s throws', (_name, value) => {
    expect(() => parseArt(value)).toThrow('theme art');
  });
});

describe('AD-14 theme art texture cap and worst point', () => {
  it('AD-14 a texture colour over 6 % throws; at 6 % passes', () => {
    const at = (a: number) =>
      parseArt(wrap(`<rect width='4' height='4' fill='%23fff' fill-opacity='${a}'/>`)) as never;
    expect(() => checkTexture(at(0.06))).not.toThrow();
    expect(() => checkTexture(at(0.07))).toThrow('texture colour');
  });

  it('AD-14 parseArt accepts 0.5-opacity table art; only checkTexture caps it', () => {
    const art = parseArt(
      wrap("<rect width='4' height='4' fill='%23fff' fill-opacity='0.5'/>"),
    ) as never;
    expect(art).not.toBeNull();
    expect(() => checkTexture(art)).toThrow('texture colour');
  });

  it('AD-14 the cap sums every shape of one colour', () => {
    const art = parseArt(
      wrap(
        "<rect width='4' height='4' fill='%23fff' fill-opacity='0.04'/><circle cx='5' cy='5' r='2' fill='%23fff' fill-opacity='0.04'/>",
      ),
    ) as never;
    expect(() => checkTexture(art)).toThrow('texture colour');
  });

  const rect = (colour: string, alpha: number) =>
    `<rect width='4' height='4' fill='%23${colour}' fill-opacity='${alpha}'/>`;
  const art = (...rects: string[]) => parseArt(wrap(rects.join(''))) as never;
  const BLACK = { r: 0, g: 0, b: 0 };
  const WHITE = { r: 255, g: 255, b: 255 };
  const RED = { r: 255, g: 0, b: 0 };

  // Over a black surface the brightest pixel is red 0.5 under green 0.5 (63.75, 127.5, 0): 4.909
  // against white ink, under a floor of 5; the other order's brightest pixel is green alone
  // (0, 127.5, 0): 5.170, above it. The result is the same whichever shape the SVG lists first.
  it.each([
    ['red first', art(rect('ff0000', 0.5), rect('00ff00', 0.5))],
    ['green first', art(rect('00ff00', 0.5), rect('ff0000', 0.5))],
  ])('AD-14 worstRatio takes the one stacking order that breaks the floor (%s)', (_n, a) => {
    expect(worstRatio(a, BLACK, WHITE)).toBeCloseTo(4.9089, 4);
  });

  // Over #101010 the brightest pixel is red 0.5 under green 0.5 with the black layer absent
  // (67.75, 131.5, 4): 4.6468 against white ink; green alone gives 4.6590 and black present at any
  // alpha (even 0.05, at the bottom) darkens every stack, so only a proper subset reaches it.
  it('AD-14 worstRatio covers a stack of a proper subset of three colours', () => {
    const a = art(rect('ff0000', 0.5), rect('00ff00', 0.5), rect('000000', 0.5));
    expect(worstRatio(a, { r: 16, g: 16, b: 16 }, WHITE)).toBeCloseTo(4.6468, 4);
  });

  // Green over red against black ink is lowest at alpha 0.2735 (3.93890), between the 0.05 grid
  // points; a shape at exactly that opacity (its colour sums to 0.5) is sampled at its own alpha.
  it('AD-14 worstRatio samples a single shape at its own alpha below its colour sum', () => {
    const a = art(rect('00ff00', 0.2735), rect('00ff00', 0.2265));
    expect(worstRatio(a, RED, BLACK)).toBeCloseTo(3.9389, 4);
  });

  it('AD-14 worstRatio is exactly 1 when the ink luminance lies inside the painted range', () => {
    const stroke = (d: string) =>
      `<path d='${d}' fill='none' stroke='%23fff' stroke-opacity='0.45'/>`;
    const a = parseArt(wrap(stroke('M0 12h24') + stroke('M12 0v24'))) as never;
    // Painted greys run from the bare black surface (5.32:1 to #808080) to white 0.9 (1.25:1).
    expect(worstRatio(a, BLACK, { r: 128, g: 128, b: 128 })).toBe(1);
  });

  // Green 0.5 over red against black ink: 5.252 bare, 4.972 at 0.5, but 3.93890 at alpha 0.2735
  // inside the range. The 0.05 alpha grid finds the inner minimum from above, here within 0.011.
  it('AD-14 worstRatio finds an inner minimum between the alpha ends', () => {
    const r = worstRatio(art(rect('00ff00', 0.5)), RED, BLACK);
    expect(r).toBeGreaterThanOrEqual(3.9389);
    expect(r).toBeLessThan(3.9389 + 0.02);
  });
});
