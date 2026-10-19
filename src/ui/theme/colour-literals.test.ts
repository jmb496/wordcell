import { readdirSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultTokenNames, scan, themeRecords } from './colour-literals';

const known = new Set(['accent-teal', 'ink-primary', 'table']);
const css = (body: string, path = 'src/ui/x.css') => scan(path, body, known);
const svelte = (style: string, markup = '', script = '') =>
  scan(
    'src/ui/Card.svelte',
    `${script ? `<script lang="ts">${script}</script>\n` : ''}${markup}\n<style>${style}</style>`,
    known,
  );
const ts = (body: string) => scan('src/ui/x.ts', body, known);

describe('AD-14 colour-literal scan positives', () => {
  it.each([
    ['named in fill attr', () => svelte('', '<path fill="red" />')],
    ['hex in fill attr', () => svelte('', '<path fill="#fff" />')],
    ['named background', () => css('.a { background: red; }')],
    ['named in border shorthand', () => css('.a { border: 1px solid white; }')],
    ['undefined token in color', () => css('.a { color: var(--wc-typo); }')],
    ['undefined token in background', () => css('.a { background: var(--wc-nope); }')],
    ['hex in script string', () => ts("const c = '#ffffff';")],
    ['declaration-shaped hex string', () => ts("const c = 'color: #fff';")],
    ['colour function in script', () => ts('const c = `rgb(0 0 0)`;')],
    ['custom property rgb in component', () => svelte('.a { --wc-x: rgb(0, 0, 0); }')],
    ['short hex in component', () => svelte('.a { box-shadow: 0 6px 16px #0008; }')],
    ['hex in component', () => svelte('.a { color: #fff; }')],
    ['hsl', () => css('.a { color: hsl(0 0% 0%); }')],
    ['hex in style attr', () => svelte('', '<div style="color: #fff"></div>')],
    ['hex in style directive', () => svelte('', '<div style:color="#fff"></div>')],
    [
      'named in color-mix',
      () => css('.a { color: color-mix(in srgb, red 50%, var(--wc-table)); }'),
    ],
    [
      '--wc-x in app.css under a media wrapper',
      () => css('@media (x) { :root { --wc-x: #fff; } }', 'src/ui/app.css'),
    ],
    ['--wc-x on another selector in app.css', () => css('.a { --wc-x: #fff; }', 'src/ui/app.css')],
    [
      '--wc-x on another selector in garden.css',
      () => css('.a { --wc-x: #fff; }', 'src/ui/theme/garden.css'),
    ],
    ['--wc-x in Card.svelte', () => svelte('[data-theme="a"] { --wc-x: #fff; }')],
    ['non-token colour in app.css', () => css(':root { color: #fff; }', 'src/ui/app.css')],
  ])('AD-14 flags %s', (_name, run) => {
    expect(run().length).toBeGreaterThan(0);
  });
});

describe('AD-14 colour-literal scan negatives', () => {
  it.each([
    ['id selector', () => css('#app { height: 1px; }')],
    ['href anchor', () => svelte('', '<a href="#main">x</a>')],
    ['entity', () => svelte('', '<p>&#8722;</p>')],
    ['white-space', () => css('.a { white-space: nowrap; }')],
    ['class named like a colour', () => css('.red { margin: 0; }')],
    ['quoted font name', () => css('.a { font-family: "Tan Pearl", serif; }')],
    ['querySelector id', () => ts("document.querySelector('#add');")],
    ['four-digit hex-like id', () => ts("const id = '#face';")],
    ['token outline', () => css('.a { outline: 2px solid var(--wc-accent-teal); }')],
    ['allowlisted width', () => css('.a { width: var(--wc-w); }')],
    ['allowlisted transform', () => css('.a { transform: translateY(var(--wc-select-lift)); }')],
    ['url fragment', () => css('.a { background: url(//x/#fff); }')],
    ['line comment', () => ts('// #fff\nconst a = 1;')],
    ['block comment in css', () => css('/* #fff red */ .a { margin: 0; }')],
    ['markup comment', () => svelte('', '<!-- fill="#fff" -->')],
    [
      'transparent and currentColor',
      () => css('.a { color: currentColor; background: transparent; }'),
    ],
    ['url paint server', () => svelte('', '<path fill="url(#g)" />')],
    [
      'color-mix over tokens',
      () => css('.a { color: color-mix(in srgb, var(--wc-table) 50%, transparent); }'),
    ],
    ['--wc-x in app.css root', () => css(':root { --wc-x: #fff; }', 'src/ui/app.css')],
    [
      '--wc-x in app.css theme block',
      () => css(':root, [data-theme="default"] { --wc-x: rgb(0 0 0 / 0.5); }', 'src/ui/app.css'),
    ],
    [
      '--wc-x in the garden.css test sheet theme block',
      () => css('[data-theme="garden"] { --wc-x: rgb(0 0 0 / 0.5); }', 'src/ui/theme/garden.css'),
    ],
    [
      'hex inside an art data URI',
      () =>
        css(
          `.a { background-image: url("data:image/svg+xml,<svg fill='#fff'/>"); }`,
          'src/ui/Card.svelte.css',
        ),
    ],
  ])('AD-14 passes %s', (_name, run) => {
    expect(run()).toEqual([]);
  });

  it('AD-14 a .svelte parse error throws', () => {
    expect(() => scan('src/ui/Bad.svelte', '<div', known)).toThrow();
  });
});

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const read = (rel: string) => readFileSync(posix.join(ROOT, rel), 'utf8');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(posix.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

describe('AD-14 token sites', () => {
  const tokens = themeRecords(read('src/ui/app.css')).get('default');
  const site = (file: string, token: string, literal: string) => {
    const text = read(file);
    expect(text).not.toContain(literal);
    expect(text).toContain(`var(--wc-${token})`);
  };
  it('AD-14 the default block holds the 4 new tokens at the old literal text', () => {
    expect(tokens?.get('--wc-shadow-drag')).toBe('#0008');
    expect(tokens?.get('--wc-scene-pointer-fill')).toBe('#fff');
    expect(tokens?.get('--wc-scene-pointer-stroke')).toBe('#1a1a1a');
    expect(tokens?.get('--wc-scene-pointer-shadow')).toBe('rgb(0 0 0 / 0.45)');
  });
  it('AD-14 the 4 shadow sites read --wc-shadow-drag', () => {
    for (const f of ['Card', 'Column', 'WordCellRow', 'tray/TileRows']) {
      site(`src/ui/${f}.svelte`, 'shadow-drag', '#0008');
    }
  });
  it('AD-14 the Scene pointer reads its three tokens', () => {
    const text = read('src/ui/scenes/Scene.svelte');
    expect(text).not.toContain('fill="#fff"');
    expect(text).not.toContain('stroke="#1a1a1a"');
    expect(text).not.toContain('rgb(0 0 0 / 0.45)');
    expect(text).toContain('var(--wc-scene-pointer-fill)');
    expect(text).toContain('var(--wc-scene-pointer-stroke)');
    expect(text).toContain('var(--wc-scene-pointer-shadow)');
  });
});

// Epic themes TH-3: the theme registry holds the explicit `theme-color` meta colour literals (AD-10).
const REGISTRY = 'src/ui/theme/registry.ts';

describe('AD-10 theme registry meta colour', () => {
  it('AD-10 the default entry meta colour equals --wc-table in app.css, read as text (TH-3)', () => {
    const token = /--wc-table:\s*(#[0-9a-f]{6})/i.exec(read('src/ui/app.css'))?.[1];
    const meta = /id: 'default'[^}]*meta: '(#[0-9a-f]{6})'/i.exec(read(REGISTRY))?.[1];
    expect(token).toBeDefined();
    expect(meta?.toLowerCase()).toBe(token?.toLowerCase());
  });
});

describe('AD-14 real tree', () => {
  it('AD-14 src/** has no colour literal outside the tokens', () => {
    const names = defaultTokenNames(read('src/ui/app.css'));
    const violations = walk('src')
      .filter((p) => /\.(svelte|css|ts)$/.test(p))
      .filter(
        (p) => !/\.test\.ts$/.test(p) && p !== 'src/ui/theme/colour-literals.ts' && p !== REGISTRY,
      )
      .flatMap((p) => scan(p, read(p), names));
    expect(violations).toEqual([]);
  });
});
