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
    ['--wc-x in Card.svelte', () => svelte('[data-theme="a"] { --wc-x: #fff; }')],
    ['non-token colour in app.css', () => css(':root { color: #fff; }', 'src/ui/app.css')],
    ['hex in style directive expression', () => svelte('', "<div style:color={'#ffffff'}></div>")],
    [
      'short hex in style directive expression',
      () => svelte('', "<div style:color={'#fff'}></div>"),
    ],
    ['named in fill expression', () => svelte('', "<path fill={'red'} />")],
    ['hex in style attr expression', () => svelte('', `<div style="color: {'#ffffff'}"></div>`)],
    ['short hex in style attr expression', () => svelte('', `<div style="color: {'#fff'}"></div>`)],
    ['named in style attr expression', () => svelte('', `<div style="color: {'red'}"></div>`)],
    ['short hex assigned to a style colour', () => ts("el.style.color = '#fff';")],
    ['named in setProperty', () => ts("el.style.setProperty('background', 'white');")],
    ['named canvas fillStyle', () => ts("ctx.fillStyle = 'black';")],
    [
      'short hex in a conditional style directive',
      () => svelte('', "<div style:color={cond ? '#fff' : 'blue'}></div>"),
    ],
    [
      'named in a conditional style directive',
      () => svelte('', "<div style:color={cond ? 'var(--wc-table)' : 'red'}></div>"),
    ],
    ['named in a style template expression', () => svelte('', '<div style={`color: red`}></div>')],
    ['short hex in a conditional assignment', () => ts("el.style.color = cond ? '#fff' : 'x';")],
    ['short hex in a conditional else branch', () => ts("el.style.color = cond ? 'x' : '#000';")],
    ['named in a wrapped assignment', () => ts("el.style.color =\n  'red';")],
    ['named in cssText', () => ts("el.style.cssText = 'color: red';")],
    ['named in setAttribute fill', () => ts("el.setAttribute('fill', 'red');")],
    ['short hex in setAttribute stroke', () => ts("el.setAttribute('stroke', '#fff');")],
    ['named after a non-colour declaration', () => ts("const s = 'cursor: grab; color: red';")],
    ['named background after gap', () => ts("const s = 'gap: 4px; background: white';")],
    [
      'named in a probe-shaped declaration string',
      () => ts("const s = 'position: fixed; top: 0; visibility: hidden; background: red;';"),
    ],
    [
      'short hex in a border declaration string',
      () => ts("const s = 'gap: 0; border: 1px solid #fff';"),
    ],
    ['named var() fallback in a declaration string', () => ts("const s = 'color: var(--x, red)';")],
    [
      'named in a filter declaration string',
      () => ts("const s = 'filter: drop-shadow(0 0 2px red)';"),
    ],
    [
      'named in a text-decoration declaration string',
      () => ts("const s = 'text-decoration: underline red';"),
    ],
    [
      'named in a prefixed fill-color declaration string',
      () => ts("const s = '-webkit-text-fill-color: red';"),
    ],
    [
      'named in a column-rule declaration string',
      () => ts("const s = 'column-rule: 1px solid red';"),
    ],
    [
      'named in a scrollbar-color declaration string',
      () => ts("const s = 'scrollbar-color: red blue';"),
    ],
    [
      'named in a text-emphasis-color declaration string',
      () => ts("const s = 'text-emphasis-color: red';"),
    ],
    [
      'named in a mask declaration string',
      () => ts("const s = 'mask: linear-gradient(red, blue)';"),
    ],
    [
      'encoded hex in a custom property data URI string',
      () => ts(`const s = "--wc-x: url('data:image/svg+xml,%3Csvg fill=%22%23ff0000%22/%3E')";`),
    ],
    [
      'encoded hex in a background-image data URI string',
      () =>
        ts(`const s = "background-image: url('data:image/svg+xml,%3Csvg fill=%22%23f00%22/%3E')";`),
    ],
    ['named in a multi-token style assignment', () => ts("el.style.border = '1px solid red';")],
    [
      'short hex in a multi-token style assignment',
      () => ts("el.style.border = '1px solid #fff';"),
    ],
    ['short hex in a box-shadow assignment', () => ts("el.style.boxShadow = '0 0 2px #fff';")],
    [
      'named in a gradient assignment',
      () => ts("el.style.background = 'linear-gradient(red, blue)';"),
    ],
    [
      'named in a multi-token setProperty',
      () => ts("el.style.setProperty('border', '1px solid red');"),
    ],
    [
      'named in a custom-property setProperty',
      () => ts("el.style.setProperty('--wc-x', '0 0 4px gold');"),
    ],
    ['named in a multi-token template assignment', () => ts('el.style.border = `1px solid red`;')],
    [
      'named in a multi-token style directive expression',
      () => svelte('', "<div style:border={'1px solid red'}></div>"),
    ],
    [
      'named in a multi-token conditional style directive',
      () => svelte('', "<div style:border={cond ? '1px solid red' : 'none'}></div>"),
    ],
    [
      'named in a multi-token conditional style attr expression',
      () => svelte('', `<div style="border: {cond ? '1px solid red' : 'none'}"></div>`),
    ],
    [
      'named var() fallback in a component stylesheet',
      () => svelte('.a { color: var(--foo, red); }'),
    ],
    ['named var() fallback in a css file', () => css('.a { color: var(--foo, red); }')],
    [
      'named var() fallback in a style attr',
      () => svelte('', '<div style="color: var(--foo, red)"></div>'),
    ],
    [
      'named var() fallback in a style directive',
      () => svelte('', '<div style:color="var(--wc-table, red)"></div>'),
    ],
    ['named var() fallback in a style assignment', () => ts("el.style.color = 'var(--foo, red)';")],
    [
      'named var() fallback in setProperty',
      () => ts("el.style.setProperty('color', 'var(--foo, red)');"),
    ],
    [
      'named in a conditional template substitution assignment',
      () => ts(`el.style.color = \`\${cond ? 'red' : 'blue'}\`;`),
    ],
    [
      'short hex in a template substitution assignment',
      () => ts(`el.style.color = \`\${'#fff'}\`;`),
    ],
    [
      'named in a cssText template substitution',
      () => ts(`el.style.cssText = \`position: fixed; color: \${ok ? 'green' : 'red'}\`;`),
    ],
    [
      'named in a declaration template substitution',
      () => ts(`const s = \`color: \${dark ? 'red' : 'blue'}\`;`),
    ],
    [
      'named in a template substitution in a component script',
      () => svelte('', '', `const s = \`color: \${dark ? 'red' : 'blue'}\`;`),
    ],
    ['named in a filter assignment', () => ts("el.style.filter = 'drop-shadow(0 0 2px red)';")],
    [
      'named in a text-decoration assignment',
      () => ts("el.style.textDecoration = 'underline red';"),
    ],
    ['named in a column-rule assignment', () => ts("el.style.columnRule = '1px solid red';")],
    ['named in a mask assignment', () => ts("el.style.mask = 'linear-gradient(red, blue)';")],
    ['named in a bracketed style assignment', () => ts("el.style['color'] = 'red';")],
    ['named under a colour object key', () => ts("const s = { backgroundColor: 'red' };")],
    [
      'named in a static background attr',
      () => svelte('', '<table><tr><td background="red"></td></tr></table>'),
    ],
    [
      'named in a static lighting-color attr',
      () => svelte('', '<svg><rect lighting-color="white"/></svg>'),
    ],
    [
      'short hex and named in $props() defaults',
      () => svelte('', '<path {fill} />', "let { fill = '#fff', color = 'white' } = $props();"),
    ],
    [
      'named in a typed $props() default',
      () => svelte('', '', "let { color = 'white' }: { color?: string } = $props();"),
    ],
    [
      'short hex in a $derived under a colour name',
      () => svelte('', '', "const stroke = $derived(on ? '#000' : 'none');"),
    ],
    [
      'short hex in a $derived.by arrow under a colour name',
      () => svelte('', '', "const stroke = $derived.by(() => (on ? '#000' : 'none'));"),
    ],
    [
      'named in a $state.raw under a colour name',
      () => svelte('', '', "let fill = $state.raw('white');"),
    ],
    [
      'short hex in an expression-bodied arrow under a colour name',
      () => ts("const stroke = (on: boolean) => (on ? '#000' : 'none');"),
    ],
    [
      'short hex returned from a block-bodied $derived.by arrow under a colour name',
      () =>
        svelte('', '', "const stroke = $derived.by(() => {\n  return on ? '#000' : 'none';\n});"),
    ],
    [
      'short hex returned from a block-bodied function expression under a colour name',
      () => ts("const fill = function () {\n  return '#000';\n};"),
    ],
    ['short hex in a colour-named const', () => ts("const fill = '#fff';")],
    ['short hex in a colour-named let', () => ts("let stroke = '#000';")],
    ['named in a colour-named const', () => ts("const color = 'red';")],
    ['short hex in a SCREAMING_SNAKE fill const', () => ts("const POINTER_FILL = '#fff';")],
    ['short hex in an exported colour const', () => ts("export const SHADOW_COLOR = '#0008';")],
    ['short hex in a camelCase shadow colour const', () => ts("const shadowColor = '#0008';")],
    ['named in a colour-word const', () => ts("const inkColour = 'white';")],
    ['named in a parameter default', () => ts("function paint(fill = 'red') {}")],
    [
      'short hex in a destructured parameter default',
      () => ts("function paint({ fill = '#fff' } = {}) {}"),
    ],
    ['named in a class field', () => ts("class P { color = 'red'; }")],
    ['named assigned to a colour-named variable', () => ts("stroke = '#000';")],
    [
      'named in a template-literal setProperty name',
      () => ts("el.style.setProperty(`--wc-x`, 'red');"),
    ],
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
    ['hex-like id in a markup expression', () => svelte('', "<a href={'#add'}>x</a>")],
    ['theme id named like a colour', () => ts("const THEMES = ['default', 'plum'];")],
    ['setAttribute on a non-colour attribute', () => ts("el.setAttribute('data-theme', 'plum');")],
    ['theme id in an object beside a colour key', () => ts("const a = { color: x, id: 'plum' };")],
    ['prose with a rating-band prefix', () => ts("const m = 'Impressive: you struck gold.';")],
    ['prose with a colour word after a colon', () => ts("const tip = 'Tip: drag a red card';")],
    [
      'prose label with a colour word',
      () => svelte('', "<button aria-label={'Theme: Plum Dusk'}>x</button>"),
    ],
    ['prose text expression with a colour word', () => svelte('', "<p>{'Note: white wins'}</p>")],
    ['hyphenated prose prefix', () => ts("const tip = 'Long-press: drag a red card';")],
    ['prose prefix named like a property', () => ts("const tip = 'Top: the red card';")],
    ['prose with a short hex-like id after a colon', () => ts("const tip = 'Tip: drag #abc';")],
    ['prose with a short number after a colon', () => ts("const m = 'Deal: #123 of the week';")],
    ['hyphenated prose with a hex-like id', () => ts("const tip = 'Long-press: card #add';")],
    [
      'the real insets probe declaration string',
      () =>
        ts(
          "const PROBE_CSS = 'position: fixed; top: 0; left: 0; width: 0; height: 0; visibility: hidden; ' +\n" +
            "  'pointer-events: none; padding-top: env(safe-area-inset-top); ' +\n" +
            "  'padding-bottom: env(safe-area-inset-bottom);';",
        ),
    ],
    [
      'theme id compared in a conditional style directive',
      () =>
        svelte(
          '',
          "<div style:color={theme === 'plum' ? 'var(--wc-table)' : 'var(--wc-table)'}></div>",
        ),
    ],
    [
      'theme id compared in a nested conditional assignment',
      () => ts("el.style.color = cond ? (theme === 'plum' ? a : b) : c;"),
    ],
    ['prose under a shadow-named variable', () => ts("const shadowHint = 'Drag a red card';")],
    [
      'theme name in a $props() default',
      () => svelte('', '', "let { label = 'Plum Dusk' } = $props();"),
    ],
    ['WAAPI fill mode under a fill-named variable', () => ts("const fillMode = 'forwards';")],
    [
      'a $derived.by arrow under a fillMode binding',
      () => svelte('', '', "const fillMode = $derived.by(() => (on ? 'red' : '#abc'));"),
    ],
    [
      'a colour-named arrow whose block body returns a theme id',
      () => ts("const fill = () => {\n  const id = 'plum';\n  return id;\n};"),
    ],
    [
      "a nested function's return inside a colour-named block-bodied arrow",
      () =>
        ts(
          "const fill = () => {\n  const pick = () => {\n    return 'red';\n  };\n  return pick;\n};",
        ),
    ],
    [
      'an arrow passed to a non-rune call under a colour name',
      () => ts("const color = items.map((i) => (i ? 'red' : 'tan'));"),
    ],
    ['letters under a FILLER-named const', () => ts("const FILLER_LETTERS = 'RED TAN GOLD';")],
    [
      'prose under an outline-named key',
      () => ts("const t = { outlineLabel: 'Outline the red card' };"),
    ],
    [
      'theme names in a ternary after a comparison',
      () => ts("const label = colour === x ? 'Plum Dusk' : 'Charcoal';"),
    ],
    [
      'theme name in a ternary else branch',
      () => ts("const label = cond ? fill : 'Plum Dusk theme';"),
    ],
    [
      'prose under a background-named export',
      () => ts("export const backgroundTip = 'Tip: gold cards score more';"),
    ],
    [
      'prose under a shadow-named variable in a component script',
      () => svelte('', '', "const shadowHint = 'Drag a red card';"),
    ],
    ['theme id compared with a style colour', () => ts("if (el.style.color === 'plum') go();")],
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
      '--wc-x in the app.css garden theme block',
      () => css('[data-theme="garden"] { --wc-x: rgb(0 0 0 / 0.5); }', 'src/ui/app.css'),
    ],
    [
      'hex inside an art data URI in a token file theme block',
      () =>
        css(
          `[data-theme="garden"] { --wc-table-art: url("data:image/svg+xml,<svg fill='#fff'/>"); }`,
          'src/ui/app.css',
        ),
    ],
  ])('AD-14 passes %s', (_name, run) => {
    expect(run()).toEqual([]);
  });

  it('AD-14 hex inside an art data URI is flagged in a component stylesheet', () => {
    const found = css(
      `.a { background-image: url("data:image/svg+xml,<svg fill='#fff'/>"); }`,
      'src/ui/Card.svelte.css',
    );
    expect(found.map((v) => v.rule)).toEqual(['hex']);
  });

  it.each([
    "const s = 'gap: 0; border: 1px solid #fff';",
    "const s = 'color: #ffffff';",
    "el.style.border = '1px solid #ffffff';",
  ])('AD-14 each hex is reported once: %s', (body) => {
    expect(ts(body).map((v) => v.rule)).toEqual(['hex']);
  });

  it('AD-14 each $props() default is reported', () => {
    const found = svelte('', '', "let { fill = '#fff', color = 'white' } = $props();");
    expect(found.map((v) => v.rule)).toEqual(['hex', 'named-colour']);
  });

  it('AD-14 a .svelte parse error throws', () => {
    expect(() => scan('src/ui/Bad.svelte', '<div', known)).toThrow();
  });

  it('AD-14 a .ts parse error throws, and so does a </script that would end the wrapper', () => {
    expect(() => ts('const a = ;')).toThrow();
    expect(() => ts("// </script>\nel.style.color = 'red';")).toThrow('</script');
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
