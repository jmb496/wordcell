import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { type Art, checkTexture, parseArt, worstSurfaces } from './art';
import { themeRecords } from './colour-literals';
import { defaultTheme, gardenTheme, paperTheme, scifiTheme } from './registry';

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}
type Record = ReadonlyMap<string, string>;

const NUM = '(\\d+(?:\\.\\d+)?)';
const RGB = new RegExp(`^rgba?\\(\\s*${NUM}\\s+${NUM}\\s+${NUM}(?:\\s*/\\s*${NUM})?\\s*\\)$`, 'i');

function parseColour(value: string): Rgba {
  const hex = /^#([0-9a-f]+)$/i.exec(value)?.[1];
  if (hex && [3, 4, 6, 8].includes(hex.length)) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
    const byte = (i: number) => Number.parseInt(full.slice(i * 2, i * 2 + 2), 16);
    return { r: byte(0), g: byte(1), b: byte(2), a: full.length === 8 ? byte(3) / 255 : 1 };
  }
  const m = RGB.exec(value);
  if (m)
    return {
      r: +(m[1] as string),
      g: +(m[2] as string),
      b: +(m[3] as string),
      a: m[4] === undefined ? 1 : +m[4],
    };
  throw new Error(`unparseable-value: ${value}`);
}

function resolve(record: Record, name: string, seen: string[] = []): Rgba {
  if (seen.includes(name)) throw new Error(`var cycle: ${[...seen, name].join(' -> ')}`);
  const value = record.get(name);
  if (value === undefined) throw new Error(`missing token ${name}`);
  if (value.includes('var(')) {
    const ref = /^var\(\s*(--wc-[\w-]+)\s*\)$/.exec(value)?.[1];
    if (!ref) throw new Error(`unparseable-value: ${value}`);
    return resolve(record, ref, [...seen, name]);
  }
  return parseColour(value);
}

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ({ r, g, b }: Rgba) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
function ratio(fg: Rgba, bg: Rgba): number {
  const [a, b] = [luminance(fg), luminance(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const round1 = (n: number) => Math.round(n * 10) / 10;

const TABLE: readonly [string, string, number, number][] = [
  ['card-ink', 'card-face', 4.5, 13.1],
  ['ink-secondary', 'surface', 4.5, 6.4],
  ['ink-secondary', 'surface-raised', 4.5, 5.6],
  ['ink-primary', 'destination-fill', 4.5, 9.9],
  ['card-ink', 'destination-fill', 4.5, 9.9],
  ['error', 'surface', 4.5, 6.7],
  ['ink-on-accent', 'accent-orange', 4.5, 6.4],
  ['outline', 'table', 3, 3.8],
  ['outline', 'surface', 3, 3.4],
  ['card-edge', 'table', 3, 3.6],
  ['card-edge', 'surface', 3, 3.2],
  ['accent-teal', 'surface', 3, 7.0],
  ['accent-teal', 'card-face', 3, 6.6],
];
// TH-9: the two art tokens are `none` or an SVG data URI, optional in a non-default record.
const TABLE_ART = '--wc-table-art';
const CARD_TEXTURE = '--wc-card-texture';
const ART_KEYS: readonly string[] = [TABLE_ART, CARD_TEXTURE];
// The TABLE rows whose background a texture sits on, and the one the table art sits on.
const TEXTURED = ['card-face', 'destination-fill'];
const TRANSLUCENT = ['scrim', 'shadow-drag', 'scene-pointer-shadow'];
const OPAQUE = ['scene-pointer-fill', 'scene-pointer-stroke'];

/** Failures of one theme record; `figures` also pins the DESIGN.md figures (default theme). */
function check(record: Record, figures: boolean, defaultKeys?: ReadonlySet<string>): string[] {
  const fails: string[] = [];
  const guard = (label: string, fn: () => void) => {
    try {
      fn();
    } catch (e) {
      fails.push(`${label}: ${(e as Error).message}`);
    }
  };
  for (const name of record.keys()) {
    if (!ART_KEYS.includes(name)) guard(name, () => resolve(record, name));
  }
  let texture: Art | null = null;
  let tableArt: Art | null = null;
  guard(CARD_TEXTURE, () => {
    texture = parseArt(record.get(CARD_TEXTURE) ?? 'none');
    if (texture) checkTexture(texture);
  });
  guard(TABLE_ART, () => {
    tableArt = parseArt(record.get(TABLE_ART) ?? 'none');
  });
  // Worst point: the foreground against every colour the art can produce over the surface.
  const overArt = (art: Art | null, fg: Rgba, bg: Rgba, floor: number, label: string) => {
    if (art === null) return;
    for (const surface of worstSurfaces(art, bg)) {
      const r = ratio(fg, { ...surface, a: 1 });
      if (r < floor) fails.push(`${label}: ${r} < ${floor}`);
    }
  };
  for (const [fg, bg, floor, figure] of TABLE) {
    guard(`${fg}/${bg}`, () => {
      const f = resolve(record, `--wc-${fg}`);
      const b = resolve(record, `--wc-${bg}`);
      if (f.a < 1 || b.a < 1) throw new Error('ratioed token has alpha < 1');
      const r = ratio(f, b);
      if (r < floor) fails.push(`${fg}/${bg}: ${r} < ${floor}`);
      if (figures && round1(r) !== figure) fails.push(`${fg}/${bg}: ${round1(r)} != ${figure}`);
      if (TEXTURED.includes(bg)) overArt(texture, f, b, floor, `${fg}/${bg} over texture`);
      if (bg === 'table') overArt(tableArt, f, b, floor, `${fg}/${bg} over table art`);
    });
  }
  for (const t of TRANSLUCENT) {
    guard(t, () => {
      if (resolve(record, `--wc-${t}`).a >= 1) throw new Error('alpha >= 1');
    });
  }
  for (const t of OPAQUE) guard(t, () => void resolve(record, `--wc-${t}`));
  if (defaultKeys) {
    const keys = new Set([...record.keys()].filter((k) => !ART_KEYS.includes(k)));
    for (const k of defaultKeys) {
      if (!keys.has(k) && !ART_KEYS.includes(k)) fails.push(`missing key ${k}`);
    }
    for (const k of keys) if (!defaultKeys.has(k)) fails.push(`extra key ${k}`);
  }
  return fails;
}

const read = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');
const themes = themeRecords(read('../app.css'));
const defaults = themes.get('default') as Record;

describe('AD-14 theme contrast', () => {
  it('AD-14 app.css has a default theme record', () => {
    expect(defaults).toBeDefined();
  });

  it.each([...themes.keys()])('AD-14 theme %s meets the contrast floors', (id) => {
    const record = themes.get(id) as Record;
    expect(check(record, id === 'default', new Set(defaults.keys()))).toEqual([]);
  });

  it.each([defaultTheme, scifiTheme, gardenTheme, paperTheme])(
    'AD-14 the meta of theme $id equals its --wc-table',
    (entry) => {
      const table = (themes.get(entry.id) as Record).get('--wc-table') as string;
      expect(entry.meta.toLowerCase()).toBe(table.toLowerCase());
    },
  );

  it('AD-14 the parser reads #rgb, #rgba, #rrggbbaa and slash-alpha rgb()', () => {
    expect(parseColour('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColour('#0008').a).toBeCloseTo(0x88 / 255);
    expect(parseColour('#000000b3').a).toBeCloseTo(0xb3 / 255);
    expect(parseColour('rgb(0 0 0 / 0.45)')).toEqual({ r: 0, g: 0, b: 0, a: 0.45 });
  });

  it('AD-14 a low-contrast record fails', () => {
    const bad = new Map(defaults);
    bad.set('--wc-card-ink', defaults.get('--wc-card-face') as string);
    expect(check(bad, false).some((f) => f.startsWith('card-ink/card-face'))).toBe(true);
  });

  it('AD-14 a comma-form value fails as unparseable', () => {
    const bad = new Map(defaults);
    bad.set('--wc-scene-pointer-shadow', 'rgb(0, 0, 0)');
    expect(check(bad, false).some((f) => f.includes('unparseable-value'))).toBe(true);
  });

  it('AD-14 a missing token, a cycle and an opaque scrim fail', () => {
    const missing = new Map(defaults);
    missing.delete('--wc-error');
    expect(check(missing, false).length).toBeGreaterThan(0);
    const cycle = new Map(defaults);
    cycle.set('--wc-table', 'var(--wc-surface)');
    cycle.set('--wc-surface', 'var(--wc-table)');
    expect(check(cycle, false).some((f) => f.includes('cycle'))).toBe(true);
    const opaque = new Map(defaults);
    opaque.set('--wc-scrim', '#000000');
    expect(check(opaque, false).some((f) => f.startsWith('scrim'))).toBe(true);
  });

  it('AD-14 the default theme declares both art tokens none; garden sets both art tokens in app.css', () => {
    expect(defaults.get(TABLE_ART)).toBe('none');
    expect(defaults.get(CARD_TEXTURE)).toBe('none');
    const garden = themes.get('garden') as Record;
    expect(parseArt(garden.get(TABLE_ART) as string)).not.toBeNull();
    expect(parseArt(garden.get(CARD_TEXTURE) as string)).not.toBeNull();
  });

  it('AD-14 the art keys are optional in the key-set check', () => {
    const bare = new Map(defaults);
    bare.delete(TABLE_ART);
    bare.delete(CARD_TEXTURE);
    expect(check(bare, true, new Set(defaults.keys()))).toEqual([]);
  });

  // The lightest grey ink that still meets `floor` on `face`: a texture then pushes it under.
  const marginalInk = (face: string, floor: number): string => {
    const bg = resolve(defaults, face);
    for (let g = 0; g < 256; g++) {
      const h = g.toString(16).padStart(2, '0');
      if (ratio(parseColour(`#${h}${h}${h}`), bg) >= floor) return `#${h}${h}${h}`;
    }
    throw new Error('no grey meets the floor');
  };
  const art = (inner: string) =>
    `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'>${inner}</svg>")`;

  it('AD-14 a texture that drops card-ink below 4.5 at the worst point fails naming the pair', () => {
    const bad = new Map(defaults);
    bad.set('--wc-card-ink', marginalInk('--wc-card-face', 4.5));
    expect(check(bad, false).filter((f) => f.startsWith('card-ink/card-face'))).toEqual([]);
    bad.set(CARD_TEXTURE, art("<rect width='8' height='8' fill='%23fff' fill-opacity='0.06'/>"));
    expect(check(bad, false).some((f) => f.startsWith('card-ink/card-face over texture'))).toBe(
      true,
    );
  });

  it('AD-14 table art that drops card-edge below 3 fails naming the pair', () => {
    const bad = new Map(defaults);
    bad.set('--wc-card-edge', marginalInk('--wc-table', 3));
    expect(check(bad, false).filter((f) => f.startsWith('card-edge/table'))).toEqual([]);
    bad.set(TABLE_ART, art("<rect width='8' height='8' fill='%23fff' fill-opacity='0.5'/>"));
    expect(check(bad, false).some((f) => f.startsWith('card-edge/table over table art'))).toBe(
      true,
    );
  });

  it('AD-14 a texture that drops card-ink below 4.5 on destination-fill fails naming the pair', () => {
    const bad = new Map(defaults);
    bad.set('--wc-card-ink', marginalInk('--wc-destination-fill', 4.5));
    expect(check(bad, false).filter((f) => f.startsWith('card-ink/destination-fill'))).toEqual([]);
    bad.set(CARD_TEXTURE, art("<rect width='8' height='8' fill='%23fff' fill-opacity='0.06'/>"));
    expect(
      check(bad, false).some((f) => f.startsWith('card-ink/destination-fill over texture')),
    ).toBe(true);
  });

  it('AD-14 a texture that drops ink-primary below 4.5 on destination-fill fails naming the pair', () => {
    const bad = new Map(defaults);
    bad.set('--wc-ink-primary', marginalInk('--wc-destination-fill', 4.5));
    expect(check(bad, false).filter((f) => f.startsWith('ink-primary/destination-fill'))).toEqual(
      [],
    );
    bad.set(CARD_TEXTURE, art("<rect width='8' height='8' fill='%23fff' fill-opacity='0.06'/>"));
    expect(
      check(bad, false).some((f) => f.startsWith('ink-primary/destination-fill over texture')),
    ).toBe(true);
  });

  it('AD-14 table art that drops outline below 3 on table fails naming the pair', () => {
    const bad = new Map(defaults);
    bad.set('--wc-outline', marginalInk('--wc-table', 3));
    expect(check(bad, false).filter((f) => f.startsWith('outline/table'))).toEqual([]);
    bad.set(TABLE_ART, art("<rect width='8' height='8' fill='%23fff' fill-opacity='0.5'/>"));
    expect(check(bad, false).some((f) => f.startsWith('outline/table over table art'))).toBe(true);
  });

  it('AD-14 a texture over 6 % or a token outside the grammar fails the record', () => {
    const heavy = new Map(defaults);
    heavy.set(CARD_TEXTURE, art("<rect width='8' height='8' fill='%23fff' fill-opacity='0.2'/>"));
    expect(check(heavy, false).some((f) => f.includes('texture colour'))).toBe(true);
    const nofill = new Map(defaults);
    nofill.set(TABLE_ART, art("<path d='M0 4h8' stroke='%23fff'/>"));
    expect(check(nofill, false).some((f) => f.includes('explicit fill'))).toBe(true);
  });

  it('AD-14 a theme record with a different key set fails', () => {
    const odd = new Map(defaults);
    odd.delete('--wc-hairline');
    expect(check(odd, false, new Set(defaults.keys())).some((f) => f.includes('hairline'))).toBe(
      true,
    );
  });
});
