// Epic themes TH-5, TH-8, TH-9: the theme art grammar. A `--wc-table-art` / `--wc-card-texture`
// token is `none` or one `url("data:image/svg+xml,…")` whose decoded SVG is a flat tile of
// rect, circle and path shapes with explicit hex paints. Pure; the Vitest checks (art.test.ts,
// contrast.test.ts) call it and every deviation throws (rule 6, no runtime check).

export interface Shape {
  readonly element: 'rect' | 'circle' | 'path';
  /** Lower-case `#rrggbb`, or null for `fill="none"`. */
  readonly fill: string | null;
  readonly fillOpacity: number;
  readonly stroke: string | null;
  readonly strokeOpacity: number;
}

export interface Art {
  readonly width: number;
  readonly height: number;
  readonly shapes: readonly Shape[];
}

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** TH-9: a card texture's per-colour capped opacity sum may not exceed 6 %. */
export const TEXTURE_CAP = 0.06;
/** More distinct colours than this is rejected (the stacking check is factorial). */
export const MAX_COLOURS = 4;

const PREFIX = 'url("data:image/svg+xml,';
const COMMON = ['fill', 'stroke', 'stroke-width', 'fill-opacity', 'stroke-opacity'];
const GEOMETRY: Record<Shape['element'], readonly string[]> = {
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  circle: ['cx', 'cy', 'r'],
  path: ['d'],
};
const NUMBER = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;
const PATH_DATA = /^[MmLlHhVvCcSsQqTtAaZz0-9 ,.-]+$/;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function fail(message: string): never {
  throw new Error(`theme art: ${message}`);
}

/** Attributes of a single-quoted attribute list; anything else in the list throws. */
function attributes(list: string, where: string): Map<string, string> {
  const out = new Map<string, string>();
  let rest = list;
  while (rest.trim() !== '') {
    const m = /^\s+([a-zA-Z][\w:-]*)='([^'"<>]*)'/.exec(rest);
    if (!m) fail(`${where}: attributes must be single-quoted name='value' pairs (got ${rest})`);
    const name = m[1] as string;
    if (out.has(name)) fail(`${where}: duplicate attribute ${name}`);
    out.set(name, m[2] as string);
    rest = rest.slice(m[0].length);
  }
  return out;
}

function onlyNames(attrs: Map<string, string>, allowed: readonly string[], where: string): void {
  for (const name of attrs.keys()) {
    if (!allowed.includes(name)) fail(`${where}: attribute ${name} is outside the grammar`);
  }
}

function integer(value: string | undefined, name: string): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    fail(`svg ${name} must be a positive integer (got ${value})`);
  }
  return Number(value);
}

function opacity(value: string | undefined, name: string, painted: boolean): number {
  if (value === undefined) return 1;
  if (!painted) fail(`${name} on an unpainted side`);
  if (!/^\d*\.?\d+$/.test(value) || Number(value) > 1) {
    fail(`${name} must be a decimal in [0,1] (got ${value})`);
  }
  return Number(value);
}

function hex(value: string, name: string): string {
  if (!HEX.test(value)) fail(`${name} must be #rgb or #rrggbb (got ${value})`);
  const h = value.slice(1).toLowerCase();
  return `#${h.length === 3 ? [...h].map((c) => c + c).join('') : h}`;
}

function shape(element: Shape['element'], attrs: Map<string, string>): Shape {
  const where = `<${element}>`;
  onlyNames(attrs, [...COMMON, ...GEOMETRY[element]], where);
  for (const name of GEOMETRY[element]) {
    const v = attrs.get(name);
    if (element === 'path' && name === 'd') {
      if (v === undefined || !PATH_DATA.test(v)) fail(`${where}: d is missing or has bad data`);
    } else if (v !== undefined && !NUMBER.test(v)) {
      fail(`${where}: ${name} must be a number (got ${v})`);
    }
  }
  const rawFill = attrs.get('fill');
  if (rawFill === undefined) fail(`${where}: every shape needs an explicit fill (or fill='none')`);
  const fill = rawFill === 'none' ? null : hex(rawFill, `${where} fill`);
  const rawStroke = attrs.get('stroke');
  const stroke = rawStroke === undefined ? null : hex(rawStroke, `${where} stroke`);
  if (fill === null && stroke === null) fail(`${where}: fill='none' without a stroke is invisible`);
  const width = attrs.get('stroke-width');
  if (width !== undefined && (stroke === null || !NUMBER.test(width) || Number(width) <= 0)) {
    fail(`${where}: stroke-width needs a stroke and a positive number (got ${width})`);
  }
  return {
    element,
    fill,
    fillOpacity: opacity(attrs.get('fill-opacity'), 'fill-opacity', fill !== null),
    stroke,
    strokeOpacity: opacity(attrs.get('stroke-opacity'), 'stroke-opacity', stroke !== null),
  };
}

/** Parse a token value; `none` gives null. Throws outside the grammar. */
export function parseArt(value: string): Art | null {
  if (value === 'none') return null;
  if (!value.startsWith(PREFIX) || !value.endsWith('")') || value.length <= PREFIX.length + 2) {
    fail(`not none or one url("data:image/svg+xml,…") (got ${value.slice(0, 60)})`);
  }
  const encoded = value.slice(PREFIX.length, -2);
  if (/["#\r\n]/.test(encoded))
    fail('the data URI may not hold a raw quote, newline or # (write %23)');
  let svg: string;
  try {
    svg = decodeURIComponent(encoded);
  } catch {
    return fail('the data URI is not valid percent-encoding');
  }
  const root = /^<svg((?:\s+[^<>]*?)?)>(.*)<\/svg>$/s.exec(svg);
  if (!root) fail('the decoded text is not one <svg>…</svg>');
  const rootAttrs = attributes(root[1] as string, '<svg>');
  onlyNames(rootAttrs, ['xmlns', 'width', 'height', 'viewBox'], '<svg>');
  if (rootAttrs.get('xmlns') !== 'http://www.w3.org/2000/svg') fail('<svg> needs the SVG xmlns');
  const width = integer(rootAttrs.get('width'), 'width');
  const height = integer(rootAttrs.get('height'), 'height');
  if (rootAttrs.get('viewBox') !== `0 0 ${width} ${height}`) {
    fail(`<svg> viewBox must be '0 0 ${width} ${height}' (the tile size)`);
  }
  const shapes: Shape[] = [];
  let rest = root[2] as string;
  while (rest !== '') {
    const m = /^<(rect|circle|path)((?:\s+[^<>]*?)?)\s*\/>/.exec(rest);
    if (!m) fail(`only self-closing rect, circle and path shapes are allowed (got ${rest})`);
    shapes.push(shape(m[1] as Shape['element'], attributes(m[2] as string, `<${m[1]}>`)));
    rest = rest.slice(m[0].length);
  }
  if (shapes.length === 0) fail('the tile has no shapes');
  const art: Art = { width, height, shapes };
  if (colourOpacities(art).size > MAX_COLOURS) fail(`more than ${MAX_COLOURS} distinct colours`);
  return art;
}

/** Per distinct colour, the sum of its fill and stroke opacities capped at 1 (bounds overlap). */
export function colourOpacities(art: Art): Map<string, number> {
  const sums = new Map<string, number>();
  const add = (colour: string | null, a: number) => {
    if (colour !== null) sums.set(colour, (sums.get(colour) ?? 0) + a);
  };
  for (const s of art.shapes) {
    add(s.fill, s.fillOpacity);
    add(s.stroke, s.strokeOpacity);
  }
  return new Map([...sums].map(([colour, sum]) => [colour, Math.min(1, sum)]));
}

/** TH-9 texture form: every colour's capped opacity sum is at most 6 %; throws otherwise. */
export function checkTexture(art: Art): void {
  for (const [colour, sum] of colourOpacities(art)) {
    if (sum > TEXTURE_CAP + 1e-9) fail(`texture colour ${colour} totals ${sum} > ${TEXTURE_CAP}`);
  }
}

export function parseHex(colour: string): Rgb {
  const h = colour.slice(1);
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const byte = (i: number) => Number.parseInt(full.slice(i * 2, i * 2 + 2), 16);
  return { r: byte(0), g: byte(1), b: byte(2) };
}

const over = (fg: Rgb, alpha: number, bg: Rgb): Rgb => ({
  r: fg.r * alpha + bg.r * (1 - alpha),
  g: fg.g * alpha + bg.g * (1 - alpha),
  b: fg.b * alpha + bg.b * (1 - alpha),
});

function orderings<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) =>
    orderings([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

/** Every non-empty subset of `items`. */
function subsets<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 1; mask < 1 << items.length; mask++) {
    out.push(items.filter((_, i) => mask & (1 << i)));
  }
  return out;
}

/**
 * Every surface colour the art can produce over `surface` (sRGB, straight alpha): every stack of
 * any non-empty subset of the art's colours in every order (a single colour is a subset of one).
 */
export function worstSurfaces(art: Art, surface: Rgb): Rgb[] {
  const layers = [...colourOpacities(art)].map(([colour, a]) => ({ rgb: parseHex(colour), a }));
  const out: Rgb[] = [];
  for (const subset of subsets(layers)) {
    for (const order of orderings(subset)) {
      out.push(order.reduce((below, l) => over(l.rgb, l.a, below), surface));
    }
  }
  return out;
}
