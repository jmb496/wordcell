// @ts-check
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { FAVICON, ICONS, readFont, readSources } from './build-icons.mjs';

// AD-16 app icons (DESIGN.md App icon, A-A7). Chromium is never launched here. The committed SVG
// sources and public/favicon.svg are read directly: they are the artifact under test, the recorded
// exception to SPEC.md's inline-fixtures rule (build-notes.md "Tests of `scripts/*.mjs`").

/** DESIGN.md tokens an icon may use: table, card-face, card-edge, card-ink, accent-teal, -orange. */
const TOKENS = ['#15171b', '#23262c', '#6a707c', '#f3eee4', '#3dbdb5', '#ef7a3d'];
const TABLE = '#15171b';
const SHAPES = new Set([
  'rect',
  'circle',
  'ellipse',
  'path',
  'polygon',
  'polyline',
  'line',
  'text',
]);
const ALLOWED = new Set([...SHAPES, 'svg', 'g', 'tspan', 'title', 'desc']);

/**
 * @typedef {{
 *   name: string,
 *   attributes: Map<string, string>,
 *   parent: Element | null,
 *   children: (Element | string)[],
 * }} Element
 */

/**
 * A small SVG tag tokenizer: open, close and self-closing tags, text nodes, an element stack.
 * Fails on CDATA, entity references, DOCTYPE and processing instructions other than a leading
 * XML declaration. XML comments are stripped first.
 * @param {string} source
 * @returns {{ root: Element, elements: Element[] }} root and every element in document order
 */
function parse(source) {
  let text = source.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/^\s*<\?xml\b[^?]*\?>/, '');
  if (text.includes('<![CDATA[')) throw new Error('CDATA is not allowed');
  if (/<!/.test(text)) throw new Error('DOCTYPE or other markup declaration is not allowed');
  if (text.includes('<?')) throw new Error('processing instruction is not allowed');
  if (text.includes('&')) throw new Error('entity references are not allowed');

  /** @type {Element[]} */
  const elements = [];
  /** @type {Element[]} */
  const stack = [];
  /** @type {Element | null} */
  let root = null;
  const tag = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/y;
  let i = 0;
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    const chunk = text.slice(i, lt === -1 ? text.length : lt);
    if (chunk.length > 0) {
      const top = stack.at(-1);
      if (top) top.children.push(chunk);
      else if (chunk.trim() !== '') throw new Error(`text outside the root: ${chunk.trim()}`);
    }
    if (lt === -1) break;
    tag.lastIndex = lt;
    const m = tag.exec(text);
    if (!m) throw new Error(`malformed tag at ${lt}: ${text.slice(lt, lt + 40)}`);
    const [, closing, name, rawAttributes, selfClosing] = m;
    if (closing) {
      if (selfClosing || (rawAttributes ?? '').trim() !== '') throw new Error(`bad </${name}>`);
      const open = stack.pop();
      if (open?.name !== name) throw new Error(`</${name}> does not close <${open?.name}>`);
    } else {
      /** @type {Map<string, string>} */
      const attributes = new Map();
      for (const a of (rawAttributes ?? '').matchAll(
        /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
      )) {
        if (attributes.has(a[1])) throw new Error(`duplicate attribute ${a[1]} on <${name}>`);
        attributes.set(a[1], a[2] ?? a[3] ?? '');
      }
      const parent = stack.at(-1) ?? null;
      /** @type {Element} */
      const element = { name, attributes, parent, children: [] };
      if (parent) parent.children.push(element);
      else if (root) throw new Error('more than one root element');
      else root = element;
      elements.push(element);
      if (!selfClosing) stack.push(element);
    }
    i = tag.lastIndex;
  }
  if (stack.length > 0) throw new Error(`unclosed <${stack.at(-1)?.name}>`);
  if (!root) throw new Error('no root element');
  return { root, elements };
}

/**
 * A property set as a presentation attribute or an inline style declaration; style wins.
 * @param {Element} element
 * @param {string} name
 * @returns {string | undefined}
 */
function property(element, name) {
  for (const declaration of (element.attributes.get('style') ?? '').split(';')) {
    const colon = declaration.indexOf(':');
    if (colon !== -1 && declaration.slice(0, colon).trim().toLowerCase() === name) {
      return declaration.slice(colon + 1).trim();
    }
  }
  return element.attributes.get(name)?.trim();
}

/** @param {Element} element */
function textContent(element) {
  /** @type {string} */
  let text = '';
  for (const child of element.children) {
    text += typeof child === 'string' ? child : textContent(child);
  }
  return text;
}

/**
 * Rules (a)–(e) of the ticket for every source.
 * @param {string} source
 */
function checkCommonRules(source) {
  const { root, elements } = parse(source);

  // (a) root viewBox exactly `0 0 N N`, no root width/height.
  expect(root.name).toBe('svg');
  const viewBox = /^0 0 (\d+) \1$/.exec(root.attributes.get('viewBox') ?? '');
  expect(viewBox, 'viewBox is 0 0 N N').not.toBeNull();
  const n = Number(viewBox?.[1]);
  expect(root.attributes.has('width')).toBe(false);
  expect(root.attributes.has('height')).toBe(false);

  // (b) the first shape is a full-bleed, untransformed table-colour rect.
  const first = elements.find((element) => SHAPES.has(element.name));
  expect(first?.name).toBe('rect');
  const field = /** @type {Element} */ (first);
  /** @type {[string, number][]} */
  const geometry = [
    ['x', 0],
    ['y', 0],
    ['width', n],
    ['height', n],
  ];
  for (const [attribute, expected] of geometry) {
    expect(Number(property(field, attribute)), attribute).toBe(expected);
  }
  expect(property(field, 'rx')).toBeUndefined();
  expect(property(field, 'ry')).toBeUndefined();
  for (let e = /** @type {Element | null} */ (field); e; e = e.parent) {
    expect(property(e, 'transform'), `transform on <${e.name}>`).toBeUndefined();
  }
  expect(property(field, 'fill')?.toLowerCase()).toBe(TABLE);

  for (const element of elements) {
    // (c) colours are `none` or a literal token hex.
    for (const name of ['fill', 'stroke', 'stop-color', 'color']) {
      const value = property(element, name);
      if (value === undefined) continue;
      const lower = value.toLowerCase();
      expect(lower === 'none' || TOKENS.includes(lower), `${name}="${value}"`).toBe(true);
    }
    // (d) every shape and tspan carries its own fill.
    if (SHAPES.has(element.name) || element.name === 'tspan') {
      expect(property(element, 'fill'), `fill on <${element.name}>`).toBeDefined();
    }
    // (e) element and attribute allow-list, no transparency.
    expect(ALLOWED.has(element.name), `<${element.name}>`).toBe(true);
    for (const name of ['class', 'href', 'xlink:href']) {
      expect(element.attributes.has(name), `${name} on <${element.name}>`).toBe(false);
    }
    for (const name of ['opacity', 'fill-opacity', 'stroke-opacity']) {
      const value = property(element, name);
      if (value !== undefined) expect(Number(value), name).toBeGreaterThanOrEqual(1);
    }
  }
  return elements;
}

/** @param {string} name */
function readIconSource(name) {
  return readFileSync(new URL(`./icons/${name}`, import.meta.url), 'utf8');
}

describe('AD-16 build-icons tables', () => {
  it('AD-16 ICONS maps the two sources to the three manifest PNGs', () => {
    expect(ICONS).toEqual([
      { source: 'icon.svg', output: 'icon-192.png', size: 192 },
      { source: 'icon.svg', output: 'icon-512.png', size: 512 },
      { source: 'icon-maskable.svg', output: 'icon-512-maskable.png', size: 512 },
    ]);
  });

  it('AD-16 FAVICON copies scripts/icons/favicon.svg to public/favicon.svg', () => {
    expect(FAVICON).toEqual({ source: 'favicon.svg', output: 'favicon.svg' });
  });
});

describe('AD-16 readSources and readFont', () => {
  /** @type {string[]} */
  const temps = [];
  afterEach(() => {
    for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  /** @param {string[]} names */
  function sourceDir(names) {
    const dir = mkdtempSync(join(tmpdir(), 'build-icons-'));
    temps.push(dir);
    for (const name of names) writeFileSync(join(dir, name), `<svg>${name}</svg>`);
    return dir;
  }

  it('AD-16 readSources returns each unique source once, favicon included', () => {
    const sources = readSources(sourceDir(['icon.svg', 'icon-maskable.svg', 'favicon.svg']));
    expect([...sources.keys()]).toEqual(['icon.svg', 'icon-maskable.svg', 'favicon.svg']);
    expect(sources.get('icon.svg')).toBe('<svg>icon.svg</svg>');
  });

  it('AD-16 readSources throws naming icon.svg when it is missing', () => {
    expect(() => readSources(sourceDir(['icon-maskable.svg', 'favicon.svg']))).toThrow(
      /missing source icon\.svg/,
    );
  });

  it('AD-16 readSources throws naming icon-maskable.svg when it is missing', () => {
    expect(() => readSources(sourceDir(['icon.svg', 'favicon.svg']))).toThrow(
      /missing source icon-maskable\.svg/,
    );
  });

  it('AD-16 readSources throws naming icon.svg first when both icon sources are missing', () => {
    expect(() => readSources(sourceDir(['favicon.svg']))).toThrow(/missing source icon\.svg/);
  });

  it('AD-16 readSources throws naming favicon.svg when only it is missing', () => {
    expect(() => readSources(sourceDir(['icon.svg', 'icon-maskable.svg']))).toThrow(
      /missing source favicon\.svg/,
    );
  });

  it('AD-16 readFont throws naming the missing path', () => {
    const path = join(sourceDir([]), 'absent.woff2');
    expect(() => readFont(path)).toThrow(path);
  });
});

describe('AD-16 committed icon sources', () => {
  for (const name of ['icon.svg', 'icon-maskable.svg']) {
    it(`AD-16 ${name} follows SVG source rules (a)–(f)`, () => {
      const elements = checkCommonRules(readIconSource(name));
      // (f) serif W text only.
      const texts = elements.filter((element) => element.name === 'text');
      expect(texts.length).toBeGreaterThan(0);
      for (const element of elements.filter((e) => e.name === 'text' || e.name === 'tspan')) {
        expect(property(element, 'font-weight')).toBe('600');
        const family = (property(element, 'font-family') ?? '').trim();
        const unquoted = /^(['"])(.*)\1$/.exec(family)?.[2] ?? family;
        expect(unquoted).toBe('WordCell Serif');
        expect(family.includes(',')).toBe(false);
      }
      for (const text of texts) expect(textContent(text).trim()).toBe('W');
    });
  }

  it('AD-16 favicon.svg follows rules (a)–(e) and draws the W without text', () => {
    const elements = checkCommonRules(readIconSource('favicon.svg'));
    expect(elements.filter((e) => e.name === 'text' || e.name === 'tspan')).toEqual([]);
  });

  it('AD-16 public/favicon.svg is byte-equal to scripts/icons/favicon.svg', () => {
    const published = readFileSync(new URL('../public/favicon.svg', import.meta.url));
    expect(published.equals(readFileSync(new URL('./icons/favicon.svg', import.meta.url)))).toBe(
      true,
    );
  });
});
