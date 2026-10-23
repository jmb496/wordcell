// Colour-literal scan and theme-record extraction (AD-14, AD-17; epic themes TH-2, TH-4). Pure:
// `scan(path, text, knownTokens)` returns violations for colour literals outside the `--wc-*`
// tokens. The CJS svelte/compiler is loaded through Node's require as src/architecture-scan.ts
// does (a Vitest import would transform the whole compiler, AD-17 unit-suite budget).
import { createRequire } from 'node:module';
import type { AST } from 'svelte/compiler';

const { parse: parseSvelte } = createRequire(import.meta.url)(
  'svelte/compiler',
) as typeof import('svelte/compiler');

export interface ColourViolation {
  readonly path: string;
  readonly rule: string;
  readonly detail: string;
}

/** Non-colour `--wc-*` properties set or read at runtime. */
export const RUNTIME_ALLOWLIST: ReadonlySet<string> = new Set([
  'w',
  'H',
  'slot',
  'strip',
  'board',
  'pan',
  'select-lift',
  'lift',
  'lift-start',
  'len',
  'hover-from',
  'hover-len',
  'base-ms',
  'fade-ms',
  'reduced',
  'scene-up',
]);

/** The token files: theme blocks of `--wc-*` declarations are exempt here (TH-2, TH-9). */
export const TOKEN_FILES: readonly string[] = ['src/ui/app.css'];

const NAMED = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown ' +
    'burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan ' +
    'darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid ' +
    'darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet ' +
    'deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ' +
    'ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki ' +
    'lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow ' +
    'lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray ' +
    'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine ' +
    'mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise ' +
    'mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab ' +
    'orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru ' +
    'pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown ' +
    'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan ' +
    'teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'
  ).split(' '),
);

const COLOUR_FN = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const HEX = /#([0-9a-f]+)(?!\w)/gi;
const VAR_WC = /var\(\s*--wc-([\w-]+)/g;

// --- comment stripping ---------------------------------------------------------------------

/** Blank CSS comments to spaces, string-aware. */
function stripComments(text: string): string {
  let out = '';
  let i = 0;
  let quote: string | null = null;
  while (i < text.length) {
    const c = text[i] as string;
    const n = text[i + 1];
    if (quote) {
      out += c;
      if (c === '\\' && n !== undefined) {
        out += n;
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
    } else if (c === '"' || c === "'") {
      quote = c;
      out += c;
      i++;
    } else if (c === '/' && n === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

const blank = (s: string): string => s.replace(/[^\n]/g, ' ');

// --- CSS parsing ---------------------------------------------------------------------------

export interface CssDecl {
  readonly stack: readonly string[];
  readonly name: string;
  readonly value: string;
}

/** Every declaration of comment-stripped CSS with its stack of enclosing preludes. */
export function cssDecls(css: string): CssDecl[] {
  const out: CssDecl[] = [];
  const stack: string[] = [];
  let buf = '';
  let paren = 0;
  let quote: string | null = null;
  const flush = (): void => {
    const at = buf.indexOf(':');
    if (stack.length > 0 && at > 0) {
      out.push({
        stack: [...stack],
        name: buf.slice(0, at).trim(),
        value: buf.slice(at + 1).trim(),
      });
    }
    buf = '';
  };
  for (let i = 0; i < css.length; i++) {
    const c = css[i] as string;
    if (quote) {
      buf += c;
      if (c === '\\') buf += css[++i] ?? '';
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    if (c === '(') paren++;
    if (c === ')') paren--;
    if (paren === 0 && c === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (paren === 0 && c === '}') {
      flush();
      stack.pop();
    } else if (paren === 0 && c === ';') flush();
    else buf += c;
  }
  return out;
}

const THEME_SELECTOR = /^(?::root|(?::root)?\[data-theme="([^"]*)"\])$/;

function exemptSelector(selector: string): boolean {
  return selector.split(',').every((part) => THEME_SELECTOR.test(part.trim()));
}

/** Theme records: every top-level `[data-theme="id"]` or `:root[data-theme="id"]` rule, as id to
 * `--wc-*` name to value. */
export function themeRecords(css: string): Map<string, Map<string, string>> {
  const records = new Map<string, Map<string, string>>();
  for (const decl of cssDecls(stripComments(css))) {
    if (decl.stack.length !== 1 || !decl.name.startsWith('--wc-')) continue;
    for (const part of (decl.stack[0] as string).split(',')) {
      const id = /^(?::root)?\[data-theme="([^"]*)"\]$/.exec(part.trim())?.[1];
      if (id === undefined) continue;
      const record = records.get(id) ?? new Map<string, string>();
      records.set(id, record);
      record.set(decl.name, decl.value);
    }
  }
  return records;
}

/** Names (without `--wc-`) of the default theme block's tokens. */
export function defaultTokenNames(css: string): Set<string> {
  const record = themeRecords(css).get('default');
  if (!record) throw new Error('app.css has no [data-theme="default"] rule');
  return new Set([...record.keys()].map((k) => k.slice('--wc-'.length)));
}

// --- value checks --------------------------------------------------------------------------

/** Blank quoted strings and url() contents. */
function blankStringsAndUrls(value: string): string {
  return value
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, blank)
    .replace(/url\(([^)]*)\)/gi, (_m, inner: string) => `url(${blank(inner)})`);
}

/** Blank the custom-property name of every var() call; its fallback stays a value. */
function blankVarNames(value: string): string {
  return value.replace(
    /(var\(\s*)(--[\w-]+)/gi,
    (_m, open: string, name: string) => open + blank(name),
  );
}

function hexIn(text: string, lengths: readonly number[]): string | undefined {
  for (const m of text.matchAll(HEX)) {
    if (lengths.includes((m[1] as string).length)) return m[0];
  }
  return undefined;
}

function namedIn(text: string): string | undefined {
  for (const m of text.matchAll(/(?<![\w#.-])([a-z]+)(?![\w-]|\s*\()/gi)) {
    if (NAMED.has((m[1] as string).toLowerCase())) return m[1];
  }
  return undefined;
}

function checkVars(
  value: string,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  for (const m of value.matchAll(VAR_WC)) {
    const name = m[1] as string;
    if (!known.has(name) && !RUNTIME_ALLOWLIST.has(name)) {
      out.push({ path, rule: 'unknown-token', detail: `var(--wc-${name})` });
    }
  }
}

/** The one TH-2 value check (CSS declarations, static style attributes and directives, the
 * colour-bearing parts of a script or markup string, and a string in a colour context): hex, art
 * data-URI paints, colour functions and named colours, var() fallbacks included. */
function checkDeclValue(
  prop: string,
  rawValue: string,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  const value = blankStringsAndUrls(rawValue);
  const hex = hexIn(value, [3, 4, 6, 8]);
  if (hex) out.push({ path, rule: 'hex', detail: `${prop}: ${hex}` });
  // Art data URIs hold hex paints only in a token file's theme block (scanCss skips those).
  for (const m of rawValue.matchAll(/url\(\s*["']?data:[^)]*/gi)) {
    const paint = /(?:#|%23)[0-9a-f]{3,8}(?![\w])/i.exec(m[0]);
    if (paint) out.push({ path, rule: 'hex', detail: `${prop}: ${paint[0]} in a data URI` });
  }
  if (COLOUR_FN.test(value))
    out.push({ path, rule: 'colour-function', detail: `${prop}: ${rawValue}` });
  const p = prop.toLowerCase();
  if (p !== 'font-family' && p !== 'content') {
    const named = namedIn(blankVarNames(value));
    if (named) out.push({ path, rule: 'named-colour', detail: `${prop}: ${named}` });
  }
  checkVars(value, known, path, out);
}

function scanCss(
  css: string,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  for (const decl of cssDecls(stripComments(css))) {
    const exempt =
      TOKEN_FILES.includes(path) &&
      decl.stack.length === 1 &&
      !(decl.stack[0] as string).startsWith('@') &&
      decl.name.startsWith('--wc-') &&
      exemptSelector(decl.stack[0] as string);
    if (exempt) continue;
    checkDeclValue(decl.name, decl.value, known, path, out);
  }
}

// --- script and markup ---------------------------------------------------------------------

const SIDE = '(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?';

// The one colour-name rule: a CSS declaration, object key, assignment target, setProperty() /
// setAttribute() name or markup attribute is colour-bearing iff its kebab-case form is a real
// colour-bearing CSS property name (optionally vendor-prefixed), a custom property, or a canvas 2D
// paint (`fillStyle`, `strokeStyle`, `shadowColor`). Prose such as 'Tip: drag a red card' or a key
// such as `outlineLabel` is never one.
const COLOUR_PROP = new RegExp(
  `^(?:-?(?:webkit|moz)-)?(?:${[
    'color',
    `(?:accent|background|caret|column-rule|flood|lighting|outline|scrollbar|shadow|stop|tap-highlight|text-decoration|text-emphasis|text-fill|text-stroke|border${SIDE})-color`,
    'background(?:-image)?',
    `border${SIDE}`,
    'border-image(?:-source)?',
    'outline',
    '(?:box|text)-shadow',
    'fill(?:-style)?',
    'stroke(?:-style)?',
    'text-stroke',
    '(?:backdrop-)?filter',
    'text-decoration',
    'text-emphasis',
    'column-rule',
    'mask(?:-image|-border(?:-source)?)?',
    '--[\\w-]+',
  ].join('|')})$`,
);

const colourName = (name: string): boolean =>
  COLOUR_PROP.test(name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));

const COLOUR_WORDS = new Set([
  'color',
  'colour',
  'fill',
  'stroke',
  'background',
  'shadow',
  'border',
  'outline',
]);

/** A binding (variable, assignment target, parameter or destructuring default, class field) is
 * colour-bearing when its name passes the colour-name rule or its last camelCase / snake_case
 * word is a colour word (`inkColour`, `POINTER_FILL`; not `shadowHint`, `fillMode`). */
const colourBinding = (name: string): boolean =>
  colourName(name) ||
  COLOUR_WORDS.has(
    (
      name
        .split(/_|(?<=[a-z0-9])(?=[A-Z])/)
        .filter(Boolean)
        .at(-1) ?? ''
    ).toLowerCase(),
  );

const DECL_PART = /^\s*-{0,2}[a-z][\w-]*\s*:(?!\/\/)/i;

/** The `name: value` parts of `s` split at `;` with each part's span in `s`, and whether every
 * non-empty part is one. */
function declarations(s: string): { parts: [string, string, number, number][]; all: boolean } {
  const parts: [string, string, number, number][] = [];
  let all = true;
  let any = false;
  let start = 0;
  for (const part of s.split(';')) {
    const end = start + part.length;
    if (part.trim() !== '') {
      any = true;
      if (DECL_PART.test(part)) {
        const at = part.indexOf(':');
        parts.push([part.slice(0, at).trim(), part.slice(at + 1), start, end]);
      } else all = false;
    }
    start = end + 1;
  }
  return { parts, all: any && all };
}

/** One string `s` (a template's substitutions blanked); `context` is a colour context around it.
 * In a colour context the string is a colour value (each declaration's value when it is all
 * declarations); elsewhere each colour-bearing part is one, and the rest only fails for a colour
 * function or a 6/8-digit hex (elsewhere `#rgb` / `#rgba` and named colours are ids such as '#add'
 * or a theme id such as 'plum'). Each check sees its text once. */
function checkString(
  s: string,
  context: boolean,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  const decls = declarations(s);
  if (context) {
    if (decls.all) {
      for (const [prop, value] of decls.parts) checkDeclValue(prop, value, known, path, out);
    } else checkDeclValue('value', s, known, path, out);
    return;
  }
  let rest = s;
  for (const [prop, value, start, end] of decls.parts) {
    if (!colourName(prop)) continue;
    checkDeclValue(prop, value, known, path, out);
    rest = rest.slice(0, start) + blank(rest.slice(start, end)) + rest.slice(end);
  }
  if (COLOUR_FN.test(rest)) out.push({ path, rule: 'colour-function', detail: s });
  if (hexIn(rest, [6, 8])) out.push({ path, rule: 'hex', detail: s });
  if (rest.includes('var(--wc-')) checkVars(rest, known, path, out);
}

interface Node {
  readonly [key: string]: unknown;
  readonly type?: unknown;
  readonly start?: unknown;
  readonly end?: unknown;
}

// The keys of a node inside a colour context whose children stay in a value position: the context's
// value, an expression tag's expression, a ternary's branches (not its test), logical operands and
// a TS cast's expression; every other child (a comparison operand, a call argument) leaves it.
const VALUE_KEYS: Readonly<Record<string, readonly string[]>> = {
  StyleDirective: ['value'],
  Attribute: ['value'],
  ExpressionTag: ['expression'],
  ConditionalExpression: ['consequent', 'alternate'],
  LogicalExpression: ['left', 'right'],
  TSAsExpression: ['expression'],
  TSSatisfiesExpression: ['expression'],
  TSNonNullExpression: ['expression'],
  AssignmentPattern: ['right'],
};

/** The value keys of `node` in a colour context: VALUE_KEYS, plus a `$derived(…)` / `$state(…)`
 * rune's argument. */
function valueKeys(node: Node): readonly string[] | undefined {
  const callee = node.callee as Node | undefined;
  if (node.type === 'CallExpression' && callee?.type === 'Identifier') {
    return callee.name === '$derived' || callee.name === '$state' ? ['arguments'] : undefined;
  }
  return typeof node.type === 'string' ? VALUE_KEYS[node.type] : undefined;
}

/** The static name of a member property or object key: a plain identifier, a string literal or
 * an expression-free template literal. */
function staticName(key: unknown, computed: unknown): string | undefined {
  const k = key as Node | null | undefined;
  if (k?.type === 'Identifier' && !computed) return k.name as string;
  if (k?.type === 'Literal' && typeof k.value === 'string') return k.value;
  if (k?.type === 'TemplateLiteral' && (k.expressions as unknown[]).length === 0) {
    return ((k.quasis as Node[])[0]?.value as { cooked?: string } | undefined)?.cooked;
  }
  return undefined;
}

/** The children of `node` that open a colour context, by the one colour-name rule: a `style:`
 * directive's value, a `style` or colour attribute's value, the value assigned to a colour
 * member (`.style.color`, `.style['color']`, `ctx.fillStyle`) or to `cssText`, a colour key's
 * value, and the value argument of setProperty() / setAttribute() on a colour (or `style`) name;
 * and by colourBinding, the value of a colour-named binding (variable, assignment target,
 * parameter or destructuring default, `$props()` default, class field). */
function colourChildren(node: Node): unknown[] {
  switch (node.type) {
    case 'StyleDirective':
      return [node.value];
    case 'Attribute': {
      const name = node.name as string;
      return name.toLowerCase() === 'style' || colourName(name) ? [node.value] : [];
    }
    case 'VariableDeclarator': {
      const id = node.id as Node;
      return id.type === 'Identifier' && colourBinding(id.name as string) ? [node.init] : [];
    }
    case 'AssignmentPattern': {
      const left = node.left as Node;
      return left.type === 'Identifier' && colourBinding(left.name as string) ? [node.right] : [];
    }
    case 'PropertyDefinition': {
      const name = staticName(node.key, node.computed);
      return name !== undefined && colourBinding(name) ? [node.value] : [];
    }
    case 'AssignmentExpression': {
      const left = node.left as Node;
      if (left.type === 'Identifier') {
        return colourBinding(left.name as string) ? [node.right] : [];
      }
      if (left.type !== 'MemberExpression') return [];
      const name = staticName(left.property, left.computed);
      return name !== undefined && (name === 'cssText' || colourName(name)) ? [node.right] : [];
    }
    case 'Property': {
      // An object-pattern default (`{ fill: f = '#fff' }`) is a binding of the key's name.
      const name = staticName(node.key, node.computed);
      const binding = (node.value as Node | null)?.type === 'AssignmentPattern';
      return name !== undefined && (binding ? colourBinding(name) : colourName(name))
        ? [node.value]
        : [];
    }
    case 'CallExpression': {
      const callee = node.callee as Node;
      const method =
        callee.type === 'MemberExpression'
          ? staticName(callee.property, callee.computed)
          : undefined;
      if (method !== 'setProperty' && method !== 'setAttribute') return [];
      const [first, value] = node.arguments as unknown[];
      const name = staticName(first, true);
      if (name === undefined) return [];
      return colourName(name) || (method === 'setAttribute' && name === 'style') ? [value] : [];
    }
    default:
      return [];
  }
}

/** Every string and template literal in the script ASTs and the markup's expressions; the colour
 * context comes from the AST ancestors (colourChildren) through value positions only
 * (VALUE_KEYS). A template's substitution sits in the context of the declaration it is the value
 * of (`color: ${…}`), or else in the template's own. */
function scanTree(
  roots: readonly unknown[],
  text: string,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  const seen = new WeakSet<object>();
  const template = (node: Node, colour: boolean): void => {
    const from = (node.start as number) + 1;
    const quasis = node.quasis as Node[];
    let s = text.slice(from, (node.end as number) - 1);
    for (let i = 0; i + 1 < quasis.length; i++) {
      const a = (quasis[i]?.end as number) - from;
      const b = (quasis[i + 1]?.start as number) - from;
      s = s.slice(0, a) + blank(s.slice(a, b)) + s.slice(b);
    }
    checkString(s, colour, known, path, out);
    (node.expressions as unknown[]).forEach((expression, i) => {
      const before = s.slice(0, (quasis[i]?.end as number) - from);
      const part = before.slice(before.lastIndexOf(';') + 1);
      const decl = DECL_PART.test(part) ? part.slice(0, part.indexOf(':')).trim() : undefined;
      visit(expression, decl === undefined ? colour : colourName(decl));
    });
  };
  const visit = (node: unknown, colour: boolean): void => {
    if (typeof node !== 'object' || node === null || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const child of node) visit(child, colour);
      return;
    }
    const n = node as Node;
    if (n.type === 'Literal' && typeof n.value === 'string') {
      checkString(
        text.slice((n.start as number) + 1, (n.end as number) - 1),
        colour,
        known,
        path,
        out,
      );
      return;
    }
    if (n.type === 'TemplateLiteral') {
      template(n, colour);
      return;
    }
    const opens = colourChildren(n);
    const keys = valueKeys(n);
    for (const [key, child] of Object.entries(n)) {
      const value = colour && keys?.includes(key) === true;
      if (Array.isArray(child)) {
        for (const c of child) visit(c, value || opens.includes(child) || opens.includes(c));
      } else visit(child, value || opens.includes(child));
    }
  };
  for (const root of roots) visit(root, false);
}

function checkAttrValue(
  prop: string,
  value: string,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  checkDeclValue(prop, value, known, path, out);
}

/** Static markup values: colour attributes (the one colour-name rule), `style` attributes and
 * `style:` directives. */
function scanMarkup(
  markup: string,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  for (const m of markup.matchAll(/(?<![\w:.-])([a-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const name = m[1] as string;
    if (name.toLowerCase() !== 'style' && colourName(name)) {
      checkAttrValue(name, (m[2] ?? m[3]) as string, known, path, out);
    }
  }
  for (const m of markup.matchAll(/(?<![\w:.-])style\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    for (const part of ((m[1] ?? m[2]) as string).split(';')) {
      const at = part.indexOf(':');
      if (at > 0) checkAttrValue(part.slice(0, at).trim(), part.slice(at + 1), known, path, out);
    }
  }
  for (const m of markup.matchAll(/style:([\w-]+)(?:\|\w+)*\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    checkAttrValue(m[1] as string, (m[2] ?? m[3]) as string, known, path, out);
  }
}

/** Scan one non-test file's text for colour literals; a .ts or .svelte parse error throws. A .ts
 * file is parsed as the TypeScript instance script of a Svelte wrapper (the compiler is loaded
 * already), so script and markup share one AST visitor; a `</script` in it would end the wrapper,
 * so it throws. */
export function scan(
  path: string,
  text: string,
  knownTokens: ReadonlySet<string>,
): ColourViolation[] {
  const out: ColourViolation[] = [];
  if (path.endsWith('.css')) {
    scanCss(text, knownTokens, path, out);
  } else if (path.endsWith('.ts')) {
    if (text.includes('</script')) throw new Error(`${path}: '</script' ends the scan wrapper`);
    const wrapped = `<script lang="ts">${text}</script>`;
    const ast: AST.Root = parseSvelte(wrapped, { modern: true });
    scanTree([ast.instance?.content], wrapped, knownTokens, path, out);
  } else if (path.endsWith('.svelte')) {
    const ast: AST.Root = parseSvelte(text, { modern: true });
    let markup = text;
    const blanks: [number, number][] = [];
    for (const script of [ast.module, ast.instance]) {
      if (script) blanks.push([script.start, script.end]);
    }
    if (ast.css) {
      scanCss(text.slice(ast.css.content.start, ast.css.content.end), knownTokens, path, out);
      blanks.push([ast.css.start, ast.css.end]);
    }
    for (const [a, b] of blanks)
      markup = markup.slice(0, a) + blank(markup.slice(a, b)) + markup.slice(b);
    markup = markup.replace(/<!--[\s\S]*?-->/g, blank);
    scanMarkup(markup, knownTokens, path, out);
    scanTree(
      [ast.module?.content, ast.instance?.content, ast.fragment],
      text,
      knownTokens,
      path,
      out,
    );
  }
  return out;
}
