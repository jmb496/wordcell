import { describe, expect, it } from 'vitest';
import { checkTexture, colourOpacities, parseArt, worstSurfaces } from './art';

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

  it('AD-14 the cap sums every shape of one colour', () => {
    const art = parseArt(
      wrap(
        "<rect width='4' height='4' fill='%23fff' fill-opacity='0.04'/><circle cx='5' cy='5' r='2' fill='%23fff' fill-opacity='0.04'/>",
      ),
    ) as never;
    expect(() => checkTexture(art)).toThrow('texture colour');
  });

  it('AD-14 worstSurfaces gives each colour alone and every stacking order', () => {
    const art = parseArt(
      wrap(
        "<rect width='4' height='4' fill='%23fff' fill-opacity='0.5'/><circle cx='5' cy='5' r='2' fill='%23000' fill-opacity='0.5'/>",
      ),
    ) as never;
    const out = worstSurfaces(art, { r: 100, g: 100, b: 100 });
    // alone: white 0.5 -> 177.5, black 0.5 -> 50; stacked: white then black 0.5 -> 88.75;
    // black then white -> 25 + 127.5... = (50*.5)+127.5 = 152.5
    const reds = out.map((c) => c.r).sort((a, b) => a - b);
    expect(reds).toEqual([50, 88.75, 152.5, 177.5]);
  });
});
