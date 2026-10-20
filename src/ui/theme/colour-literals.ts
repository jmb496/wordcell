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
const PRESENTATION = 'fill|stroke|stop-color|flood-color|color';

// --- comment stripping ---------------------------------------------------------------------

/** Blank comments to spaces, string-aware; `line` also strips `//` (script and .ts only). */
function stripComments(text: string, line: boolean): string {
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
    } else if (c === '"' || c === "'" || (line && c === '`')) {
      quote = c;
      out += c;
      i++;
    } else if (c === '/' && n === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (line && c === '/' && n === '/') {
      let stop = text.indexOf('\n', i);
      if (stop < 0) stop = text.length;
      out += ' '.repeat(stop - i);
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

const THEME_SELECTOR = /^(?::root|\[data-theme="([^"]*)"\])$/;

function exemptSelector(selector: string): boolean {
  return selector.split(',').every((part) => THEME_SELECTOR.test(part.trim()));
}

/** Theme records: every top-level `[data-theme="id"]` rule, as id to `--wc-*` name to value. */
export function themeRecords(css: string): Map<string, Map<string, string>> {
  const records = new Map<string, Map<string, string>>();
  for (const decl of cssDecls(stripComments(css, false))) {
    if (decl.stack.length !== 1 || !decl.name.startsWith('--wc-')) continue;
    for (const part of (decl.stack[0] as string).split(',')) {
      const id = /^\[data-theme="([^"]*)"\]$/.exec(part.trim())?.[1];
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

/** Blank the arguments of every var() call. */
function blankVars(value: string): string {
  let out = '';
  let i = 0;
  while (i < value.length) {
    const m = /var\(/i.exec(value.slice(i));
    if (!m) {
      out += value.slice(i);
      break;
    }
    const open = i + m.index + m[0].length;
    out += value.slice(i, open);
    let depth = 1;
    let j = open;
    while (j < value.length && depth > 0) {
      if (value[j] === '(') depth++;
      if (value[j] === ')') depth--;
      j++;
    }
    out += blank(value.slice(open, j - 1)) + (depth === 0 ? ')' : '');
    i = j;
  }
  return out;
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
    const named = namedIn(blankVars(value));
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
  for (const decl of cssDecls(stripComments(css, false))) {
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

const STRING_LITERAL = /"((?:\\.|[^"\\\n])*)"|'((?:\\.|[^'\\\n])*)'|`((?:\\.|[^`\\])*)`/g;

function scanScript(
  script: string,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  const text = stripComments(script, true);
  for (const m of text.matchAll(STRING_LITERAL)) {
    const s = m[1] ?? m[2] ?? m[3] ?? '';
    if (COLOUR_FN.test(s)) out.push({ path, rule: 'colour-function', detail: s });
    const hex = hexIn(s, [6, 8]);
    if (hex) out.push({ path, rule: 'hex', detail: s });
    else if (/(?:^|;)\s*[a-z-]+\s*:[^;]*#/i.test(s) && hexIn(s, [3, 4])) {
      out.push({ path, rule: 'hex', detail: s });
    }
    if (s.includes('var(--wc-')) checkVars(s, known, path, out);
  }
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

function scanMarkup(
  markup: string,
  known: ReadonlySet<string>,
  path: string,
  out: ColourViolation[],
): void {
  const presentation = new RegExp(
    `(?<![\\w:.-])(${PRESENTATION})\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    'g',
  );
  for (const m of markup.matchAll(presentation)) {
    checkAttrValue(m[1] as string, (m[2] ?? m[3]) as string, known, path, out);
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

/** Scan one non-test file's text for colour literals; a .svelte parse error throws. */
export function scan(
  path: string,
  text: string,
  knownTokens: ReadonlySet<string>,
): ColourViolation[] {
  const out: ColourViolation[] = [];
  if (path.endsWith('.css')) {
    scanCss(text, knownTokens, path, out);
  } else if (path.endsWith('.ts')) {
    scanScript(text, knownTokens, path, out);
  } else if (path.endsWith('.svelte')) {
    const ast: AST.Root = parseSvelte(text, { modern: true });
    let markup = text;
    const blanks: [number, number][] = [];
    for (const script of [ast.module, ast.instance]) {
      if (!script) continue;
      const content = script.content as unknown as { start: number; end: number };
      scanScript(text.slice(content.start, content.end), knownTokens, path, out);
      blanks.push([script.start, script.end]);
    }
    if (ast.css) {
      scanCss(text.slice(ast.css.content.start, ast.css.content.end), knownTokens, path, out);
      blanks.push([ast.css.start, ast.css.end]);
    }
    for (const [a, b] of blanks)
      markup = markup.slice(0, a) + blank(markup.slice(a, b)) + markup.slice(b);
    markup = markup.replace(/<!--[\s\S]*?-->/g, blank);
    scanMarkup(markup, knownTokens, path, out);
  }
  return out;
}
