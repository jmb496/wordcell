// AD-1 check 2: scans every file under src/** except this one. Fixture cases run first on
// virtual (path, source) pairs through the same `check` the tree scan uses; resolution and layer
// classification are path-lexical and never consult the filesystem.
// Known limitation (story 1.1 OQ #2): aliasing and destructuring (`const { random } = Math`,
// `const M = Math`, `history['back']()`, `const h = window.history`, `window['localStorage']`)
// pass the scan; code review covers deliberate aliasing. `.svelte` files are split with
// svelte/compiler `parse` (scripts, markup text, markup bindings), never by regex (ticket 1.10).
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AST } from 'svelte/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

type Rule =
  | 'extension'
  | 'stray-file'
  | 'engine-token'
  | 'engine-directive'
  | 'engine-import'
  | 'deep-engine-import'
  | 'ui-value-engine-import'
  | 'cross-layer-import'
  | 'non-literal-import'
  | 'import-meta-glob'
  | 'history-api'
  | 'popstate'
  | 'history-binding'
  | 'local-storage';

interface Violation {
  readonly path: string;
  readonly rule: Rule;
  readonly detail: string;
}

type Layer = 'engine' | 'shell' | 'ui' | 'entry' | 'declaration' | 'stray';

const CODE_EXT = /\.(ts|js|svelte|mjs|cjs|mts|cts|tsx|jsx)$/;
const BANNED_EXT = /\.(mjs|cjs|mts|cts|tsx|jsx)$/;
// Identifier boundaries: `\b` treats `$` as a boundary, so `$window` would match.
const ENGINE_TOKENS =
  /(?<![\w$])(Date|performance|crypto|setTimeout|setInterval|requestAnimationFrame|fetch|localStorage|sessionStorage|globalThis|window|document|process|console)(?![\w$])/g;
const MATH_RANDOM = /(?<![\w$])Math\s*(?:\?\.|\.)\s*random(?![\w$])/;
const MATH_COMPUTED = /(?<![\w$])Math\s*(?:\?\.)?\s*\[/;
const HISTORY_API =
  /(?<![\w$])(?:window\s*(?:\?\.|\.)\s*)?history\s*(?:\?\.|\.)\s*(?:pushState|replaceState|back|forward|go|state|length)(?![\w$])/;
const LOCAL_STORAGE = /(?<![\w$])localStorage(?![\w$])/;
const REFERENCE_DIRECTIVE = /^\s*\/\/\/\s*<reference\b/im;
const TS_DIRECTIVE = /@ts-(?:nocheck|ignore|expect-error)\b/i;
const IMPORT_EXT = /\.(ts|js|mjs|cjs|mts|cts|tsx|jsx|svelte|json|txt|css|html|svg|png|woff2?)$/;

function layerOf(path: string): Layer {
  if (path.startsWith('src/engine/')) return 'engine';
  if (path.startsWith('src/shell/')) return 'shell';
  if (path.startsWith('src/ui/')) return 'ui';
  if (path === 'src/main.ts') return 'entry';
  if (path.endsWith('.d.ts') && posix.dirname(path) === 'src') return 'declaration';
  return 'stray';
}

// --- Stripper -------------------------------------------------------------------------------

const LITERAL_KINDS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.RegularExpressionLiteral,
]);

function blank(chars: string[], start: number, end: number): void {
  for (let i = start; i < end; i++) if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = ' ';
}

/** Blanks the comments inside a trivia range (whitespace and comments only). */
function blankComments(text: string, chars: string[], start: number, end: number): void {
  let i = start;
  while (i < end) {
    if (text.startsWith('#!', i) && i === 0) {
      const eol = text.indexOf('\n', i);
      const stop = eol === -1 || eol > end ? end : eol;
      blank(chars, i, stop);
      i = stop;
    } else if (text.startsWith('//', i)) {
      const eol = text.indexOf('\n', i);
      const stop = eol === -1 || eol > end ? end : eol;
      blank(chars, i, stop);
      i = stop;
    } else if (text.startsWith('/*', i)) {
      const close = text.indexOf('*/', i + 2);
      const stop = close === -1 || close + 2 > end ? end : close + 2;
      blank(chars, i, stop);
      i = stop;
    } else {
      i++;
    }
  }
}

/**
 * Same-length copy of the source with comments blanked and, unless `keepStrings`, the string,
 * regex and template literal parts blanked too (template `${}` expressions are kept).
 */
function strip(sf: ts.SourceFile, keepStrings: boolean): string {
  const text = sf.text;
  const chars = text.split('');
  const visit = (node: ts.Node): void => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode) {
      return; // JSDoc text is also the next token's leading trivia
    }
    if (node.kind < ts.SyntaxKind.FirstNode) {
      const start = node.getStart(sf);
      blankComments(text, chars, node.pos, start);
      if (!keepStrings && LITERAL_KINDS.has(node.kind)) blank(chars, start, node.end);
      return;
    }
    for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);
  return chars.join('');
}

// --- Imports --------------------------------------------------------------------------------

interface ImportRef {
  /** null for a dynamic import whose specifier is not a literal. */
  readonly spec: string | null;
  readonly typeOnly: boolean;
  readonly json: boolean;
}

function literalText(node: ts.Node | undefined): string | null {
  if (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
    return node.text;
  }
  return null;
}

function hasJsonAttribute(attributes: ts.ImportAttributes | undefined): boolean {
  return (
    attributes?.elements.some(
      (el) => el.name.text === 'type' && literalText(el.value) === 'json',
    ) ?? false
  );
}

function dynamicJsonOption(options: ts.Expression | undefined): boolean {
  if (!options || !ts.isObjectLiteralExpression(options)) return false;
  return options.properties.some((prop) => {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) return false;
    if (prop.name.text !== 'with' || !ts.isObjectLiteralExpression(prop.initializer)) return false;
    return prop.initializer.properties.some(
      (inner) =>
        ts.isPropertyAssignment(inner) &&
        ts.isIdentifier(inner.name) &&
        inner.name.text === 'type' &&
        literalText(inner.initializer) === 'json',
    );
  });
}

function collectImports(sf: ts.SourceFile): { imports: ImportRef[]; globs: number } {
  const imports: ImportRef[] = [];
  let globs = 0;
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      imports.push({
        spec: literalText(node.moduleSpecifier),
        typeOnly: node.importClause?.isTypeOnly ?? false,
        json: hasJsonAttribute(node.attributes),
      });
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      imports.push({
        spec: literalText(node.moduleSpecifier),
        typeOnly: node.isTypeOnly,
        json: hasJsonAttribute(node.attributes),
      });
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      imports.push({
        spec: literalText(node.moduleReference.expression),
        typeOnly: node.isTypeOnly,
        json: false,
      });
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      imports.push({
        spec: literalText(node.arguments[0]),
        typeOnly: false,
        json: dynamicJsonOption(node.arguments[1]),
      });
    } else if (ts.isImportTypeNode(node)) {
      const arg = node.argument;
      imports.push({
        spec: ts.isLiteralTypeNode(arg) ? literalText(arg.literal) : null,
        typeOnly: false,
        json: false,
      });
    } else if (
      ts.isPropertyAccessExpression(node) &&
      ts.isMetaProperty(node.expression) &&
      node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
      node.name.text.startsWith('glob')
    ) {
      globs++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { imports, globs };
}

function isRelative(spec: string): boolean {
  return spec === '.' || spec === '..' || spec.startsWith('./') || spec.startsWith('../');
}

/** Repo-relative, path-lexical resolution; a `/`-rooted specifier resolves against the root. */
function resolveSpec(importer: string, spec: string): string {
  const joined = spec.startsWith('/')
    ? posix.normalize(spec.slice(1))
    : posix.normalize(posix.join(posix.dirname(importer), spec));
  return joined.length > 1 && joined.endsWith('/') ? joined.slice(0, -1) : joined;
}

function splitQuery(spec: string): { bare: string; query: string | null } {
  const q = spec.indexOf('?');
  return q === -1
    ? { bare: spec, query: null }
    : { bare: spec.slice(0, q), query: spec.slice(q + 1) };
}

function checkImport(
  path: string,
  layer: Layer,
  isTest: boolean,
  imp: ImportRef,
): [Rule, string][] {
  if (imp.spec === null)
    return [['non-literal-import', 'dynamic import needs a literal specifier']];
  const spec = imp.spec;
  if (layer === 'engine') {
    if (isTest) {
      if (spec === 'vitest') return [];
      if (isRelative(spec)) {
        const { bare, query } = splitQuery(spec);
        const resolved = resolveSpec(path, bare);
        if (query === null && /^fixtures\/[^/]+\.json$/.test(resolved)) {
          return imp.json ? [] : [['engine-import', `${spec} needs with { type: 'json' }`]];
        }
        if (query === 'raw' && resolved === 'generated/dictionary/en.txt') return [];
      }
    }
    if (!isRelative(spec)) return [['engine-import', `${spec} is not a relative path`]];
    const found: [Rule, string][] = [];
    if (spec.includes('?')) found.push(['engine-import', `${spec} carries a query`]);
    const resolved = resolveSpec(path, splitQuery(spec).bare);
    if (!(resolved === 'src/engine' || resolved.startsWith('src/engine/'))) {
      found.push(['engine-import', `${spec} leaves src/engine/`]);
    }
    if (IMPORT_EXT.test(posix.basename(resolved))) {
      found.push(['engine-import', `${spec} carries a file extension`]);
    }
    return found;
  }
  if (layer === 'entry') return [];
  if (!isRelative(spec) && !spec.startsWith('/')) return []; // bare / npm specifier
  const resolved = resolveSpec(path, splitQuery(spec).bare);
  if (resolved === 'src/engine' || resolved.startsWith('src/engine/')) {
    if (resolved !== 'src/engine' && resolved !== 'src/engine/index') {
      return [['deep-engine-import', `${spec} bypasses src/engine/index.ts`]];
    }
    if (layer === 'ui' && !imp.typeOnly) {
      return [['ui-value-engine-import', `${spec} must be a whole-statement import type`]];
    }
    return [];
  }
  if (resolved === 'src/main' || resolved.startsWith('src/main.')) {
    return [['cross-layer-import', `${spec} imports the entry`]];
  }
  if ((resolved === 'src/ui' || resolved.startsWith('src/ui/')) && layer !== 'ui') {
    return [['cross-layer-import', `${spec} imports src/ui/ from ${layer}`]];
  }
  return [];
}

// --- History bindings -----------------------------------------------------------------------

function isHistoryName(node: ts.Node | undefined): boolean {
  return !!node && ts.isIdentifier(node) && node.text === 'history';
}

/** True when `literal` is (nested in) the left side of an `=` assignment: a destructuring pattern. */
function inAssignmentPattern(literal: ts.Node): boolean {
  let child = literal;
  let parent = literal.parent;
  while (
    ts.isObjectLiteralExpression(parent) ||
    ts.isArrayLiteralExpression(parent) ||
    ts.isPropertyAssignment(parent) ||
    ts.isSpreadElement(parent) ||
    ts.isSpreadAssignment(parent)
  ) {
    child = parent;
    parent = parent.parent;
  }
  return (
    ts.isBinaryExpression(parent) &&
    parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    parent.left === child
  );
}

function historyBindings(sf: ts.SourceFile): number {
  let count = 0;
  const visit = (node: ts.Node): void => {
    const named =
      ts.isVariableDeclaration(node) ||
      ts.isParameter(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isClassDeclaration(node) ||
      ts.isClassExpression(node) ||
      ts.isImportClause(node) ||
      ts.isNamespaceImport(node) ||
      ts.isImportSpecifier(node) ||
      ts.isImportEqualsDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isModuleDeclaration(node) ||
      ts.isShorthandPropertyAssignment(node);
    if (named && isHistoryName(node.name)) count++;
    if (
      ts.isBindingElement(node) &&
      (isHistoryName(node.name) || isHistoryName(node.propertyName))
    ) {
      count++;
    }
    if (
      (ts.isMethodDeclaration(node) ||
        ts.isGetAccessorDeclaration(node) ||
        ts.isSetAccessorDeclaration(node)) &&
      ts.isObjectLiteralExpression(node.parent) &&
      isHistoryName(node.name)
    ) {
      count++;
    }
    if (
      ts.isPropertyAssignment(node) &&
      isHistoryName(node.name) &&
      inAssignmentPattern(node.parent)
    ) {
      count++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return count;
}

// --- .svelte split --------------------------------------------------------------------------

// Loaded through Node's require (the CJS build): a Vitest import would transform the whole
// compiler (vite-plugin-svelte inlines svelte) and cost ~10 s per run (AD-17 unit-suite budget).
const { parse: parseSvelte } = createRequire(import.meta.url)(
  'svelte/compiler',
) as typeof import('svelte/compiler');

// Every Svelte (not ESTree) node type of svelte/compiler's modern AST (namespace AST).
const SVELTE_NODES = new Set([
  'AnimateDirective',
  'AttachTag',
  'Attribute',
  'AwaitBlock',
  'BindDirective',
  'ClassDirective',
  'Comment',
  'Component',
  'ConstTag',
  'DebugTag',
  'DeclarationTag',
  'EachBlock',
  'ExpressionTag',
  'Fragment',
  'HtmlTag',
  'IfBlock',
  'KeyBlock',
  'LetDirective',
  'OnDirective',
  'RegularElement',
  'RenderTag',
  'SlotElement',
  'SnippetBlock',
  'SpreadAttribute',
  'StyleDirective',
  'SvelteBody',
  'SvelteBoundary',
  'SvelteComponent',
  'SvelteDocument',
  'SvelteElement',
  'SvelteFragment',
  'SvelteHead',
  'SvelteSelf',
  'SvelteWindow',
  'Text',
  'TitleElement',
  'TransitionDirective',
  'UseDirective',
]);
// ESTree fields of Svelte nodes that declare bindings (patterns), and that hold declarations;
// every other ESTree field is an expression. An ESTree node under any key outside ESTREE_KEYS
// throws, so an unknown Svelte node type fails the scan instead of passing it (rule 6).
const BINDING_FIELDS = new Set([
  'EachBlock.context',
  'AwaitBlock.value',
  'AwaitBlock.error',
  'SnippetBlock.expression',
  'SnippetBlock.parameters',
  'LetDirective.expression',
]);
const DECLARATION_FIELDS = new Set(['ConstTag.declaration', 'DeclarationTag.declaration']);
const ESTREE_KEYS = new Set([
  'expression',
  'context',
  'value',
  'error',
  'key',
  'test',
  'parameters',
  'declaration',
  'identifiers',
  'tag',
]);

interface SvelteParts {
  /** Instance, module and `<script>` element bodies, each scanned as TypeScript. */
  readonly scripts: string[];
  /** The source with scripts, styles and HTML comments blanked to spaces. */
  readonly markup: string;
  /** Markup bindings rewritten as TypeScript for `historyBindings`. */
  readonly bindingSources: string[];
  /** Markup bindings named `history` with no TypeScript form (each index, `let:history`, `{history}`). */
  readonly directBindings: number;
}

type AnyNode = { type: string; start: number; end: number; [key: string]: unknown };

const isNode = (value: unknown): value is AnyNode =>
  typeof value === 'object' && value !== null && typeof (value as AnyNode).type === 'string';

function svelteParts(source: string): SvelteParts {
  const ast: AST.Root = parseSvelte(source, { modern: true });
  const scripts: string[] = [];
  const blanks: [number, number][] = [];
  const bindingSources: string[] = [];
  let directBindings = 0;

  for (const script of [ast.module, ast.instance]) {
    if (!script) continue;
    const content = script.content as unknown as AnyNode;
    scripts.push(source.slice(content.start, content.end));
    blanks.push([script.start, script.end]);
  }
  if (ast.css) blanks.push([ast.css.start, ast.css.end]);

  const estree = (owner: AnyNode, key: string, node: AnyNode): void => {
    if (!ESTREE_KEYS.has(key))
      throw new Error(`AD-1: unknown Svelte node ${node.type} in ${owner.type}.${key}`);
    const text = source.slice(node.start, node.end);
    const field = `${owner.type}.${key}`;
    if (BINDING_FIELDS.has(field)) bindingSources.push(`function f(${text}) {}`);
    else if (DECLARATION_FIELDS.has(field)) bindingSources.push(`${text};`);
    else bindingSources.push(`(${text});`);
  };

  const visit = (node: AnyNode): void => {
    if (node.type === 'Comment') {
      blanks.push([node.start, node.end]);
      return;
    }
    if (node.type === 'RegularElement' && (node.name === 'script' || node.name === 'style')) {
      blanks.push([node.start, node.end]);
      if (node.name === 'script') {
        const { nodes } = node.fragment as { nodes: AnyNode[] };
        const [first, last] = [nodes[0], nodes.at(-1)];
        if (first && last) scripts.push(source.slice(first.start, last.end));
      }
      return;
    }
    if (node.type === 'EachBlock' && node.index === 'history') directBindings++;
    if (node.type === 'LetDirective' && node.expression === null && node.name === 'history') {
      directBindings++;
    }
    const value = node.value;
    if (
      node.type === 'Attribute' &&
      isNode(value) &&
      source[node.start] === '{' &&
      node.name === 'history'
    ) {
      directBindings++;
    }
    for (const [key, field] of Object.entries(node)) {
      for (const child of Array.isArray(field) ? field : [field]) {
        if (!isNode(child)) continue;
        if (SVELTE_NODES.has(child.type)) visit(child);
        else estree(node, key, child);
      }
    }
  };
  visit(ast.fragment as unknown as AnyNode);
  for (const attribute of ast.options?.attributes ?? []) visit(attribute as unknown as AnyNode);

  let markup = source;
  for (const [start, end] of blanks) {
    markup = markup.slice(0, start) + ' '.repeat(end - start) + markup.slice(end);
  }
  return { scripts, markup, bindingSources, directBindings };
}

// --- check ----------------------------------------------------------------------------------

function check(path: string, source: string): Violation[] {
  if (!CODE_EXT.test(path)) return [];
  const found: [Rule, string][] = [];
  const layer = layerOf(path);
  if (BANNED_EXT.test(path)) return [{ path, rule: 'extension', detail: 'extension not allowed' }];
  if (layer === 'engine' && /\.(js|svelte)$/.test(path)) {
    return [{ path, rule: 'extension', detail: 'engine sources are .ts only' }];
  }
  if (layer === 'stray') found.push(['stray-file', 'outside engine/, shell/, ui/, main.ts']);

  const isTest = path.endsWith('.test.ts');
  const isSvelte = path.endsWith('.svelte');
  const navChecks =
    path !== 'src/shell/nav.ts' && !(isTest && (layer === 'shell' || layer === 'ui'));
  const storageCheck =
    path !== 'src/shell/storage.ts' && !(isTest && (layer === 'shell' || layer === 'ui'));
  const scriptKind = path.endsWith('.js') ? ts.ScriptKind.JS : ts.ScriptKind.TS;

  const svelte = isSvelte ? svelteParts(source) : undefined;
  for (const script of svelte ? svelte.scripts : [source]) {
    const sf = ts.createSourceFile(path, script, ts.ScriptTarget.Latest, true, scriptKind);
    const full = strip(sf, false);
    const commentsOnly = strip(sf, true);

    if (layer === 'engine' && !isTest) {
      for (const m of full.matchAll(ENGINE_TOKENS)) found.push(['engine-token', m[1]]);
      if (MATH_RANDOM.test(full)) found.push(['engine-token', 'Math.random']);
      if (MATH_COMPUTED.test(full)) found.push(['engine-token', 'Math[']);
      if (REFERENCE_DIRECTIVE.test(script)) found.push(['engine-directive', '/// <reference']);
      if (TS_DIRECTIVE.test(script)) found.push(['engine-directive', '@ts- directive']);
    }

    const { imports, globs } = collectImports(sf);
    for (const imp of imports) found.push(...checkImport(path, layer, isTest, imp));
    if (globs > 0) found.push(['import-meta-glob', 'import.meta.glob']);

    if (navChecks) {
      if (HISTORY_API.test(full)) found.push(['history-api', 'History API outside nav.ts']);
      if (commentsOnly.includes('popstate')) found.push(['popstate', 'popstate outside nav.ts']);
      if (historyBindings(sf) > 0) found.push(['history-binding', 'binding named history']);
    }
    if (storageCheck && LOCAL_STORAGE.test(full)) {
      found.push(['local-storage', 'localStorage outside storage.ts']);
    }
  }

  if (svelte) {
    const { markup } = svelte;
    if (navChecks && HISTORY_API.test(markup)) found.push(['history-api', 'History API in markup']);
    if (navChecks && markup.includes('popstate')) found.push(['popstate', 'popstate in markup']);
    const markupBindings =
      svelte.directBindings +
      svelte.bindingSources.reduce(
        (sum, text) =>
          sum +
          historyBindings(
            ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
          ),
        0,
      );
    if (navChecks && markupBindings > 0) {
      found.push(['history-binding', 'binding named history in markup']);
    }
    if (storageCheck && LOCAL_STORAGE.test(markup)) {
      found.push(['local-storage', 'localStorage in markup']);
    }
  }

  const seen = new Set<string>();
  const violations: Violation[] = [];
  for (const [rule, detail] of found) {
    const key = `${rule}|${detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    violations.push({ path, rule, detail });
  }
  return violations;
}

// --- Fixtures -------------------------------------------------------------------------------

/** Fixture source helper: `~` becomes a backtick and `@{` becomes a template placeholder. */
const js = (s: string): string => s.replaceAll('~', '`').replaceAll('@{', `\${`);

const E = 'src/engine/x.ts';
const ET = 'src/engine/x.test.ts';
const S = 'src/shell/x.ts';
const ST = 'src/shell/x.test.ts';
const U = 'src/ui/x.ts';
const UT = 'src/ui/x.test.ts';
const UV = 'src/ui/X.svelte';
const NAV = 'src/shell/nav.ts';

interface Case {
  readonly name: string;
  readonly path: string;
  readonly source: string;
  /** The exact rules the case must report, in order (one rule or a list); absent means clean. */
  readonly fails?: Rule | readonly Rule[];
}

function run(cases: readonly Case[]): void {
  for (const c of cases) {
    it(`AD-1 ${c.fails ? 'fails' : 'passes'}: ${c.name} (${c.path})`, () => {
      const expected =
        c.fails === undefined ? [] : typeof c.fails === 'string' ? [c.fails] : c.fails;
      expect(check(c.path, c.source).map((v) => v.rule)).toEqual(expected);
    });
  }
}

const TOKENS = [
  'Date',
  'performance',
  'crypto',
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'fetch',
  'localStorage',
  'sessionStorage',
  'globalThis',
  'window',
  'document',
  'process',
  'console',
];

describe('AD-1 engine tokens', () => {
  run([
    {
      name: 'identifier $window is not window',
      path: E,
      source: 'export const $window = 1;',
    },
    ...TOKENS.map(
      (t): Case => ({
        name: `token ${t}`,
        path: E,
        source: `export const a = ${t};`,
        // localStorage is also outside storage.ts
        fails: t === 'localStorage' ? ['engine-token', 'local-storage'] : 'engine-token',
      }),
    ),
    { name: 'Math.random()', path: E, source: 'Math.random();', fails: 'engine-token' },
    { name: "Math['random']", path: E, source: "Math['random']();", fails: 'engine-token' },
    { name: "Math ['random']", path: E, source: "Math ['random']();", fails: 'engine-token' },
    { name: "Math?.['random']", path: E, source: "Math?.['random']();", fails: 'engine-token' },
    { name: 'Math?.random()', path: E, source: 'Math?.random();', fails: 'engine-token' },
    { name: 'Math . random()', path: E, source: 'Math . random();', fails: 'engine-token' },
    {
      name: 'Math newline .random()',
      path: E,
      source: 'Math\n  .random();',
      fails: 'engine-token',
    },
    {
      name: 'template placeholder Date.now()',
      path: E,
      source: js('const s = ~@{Date.now()}~;'),
      fails: 'engine-token',
    },
    { name: 'property name x.process', path: E, source: 'x.process;', fails: 'engine-token' },
    {
      name: 'object key { fetch: 1 }',
      path: E,
      source: 'const o = { fetch: 1 };',
      fails: 'engine-token',
    },
    {
      name: 'engine .d.ts declare const document',
      path: 'src/engine/x.d.ts',
      source: 'declare const document: unknown;',
      fails: 'engine-token',
    },
    { name: 'Math.floor and Math.imul', path: E, source: 'Math.floor(Math.imul(a, b));' },
    { name: 'Dated and consoleLike', path: E, source: 'const Dated = 1; const consoleLike = 2;' },
    { name: 'xMath.random()', path: E, source: 'xMath.random();' },
    { name: 'Math.randomize()', path: E, source: 'Math.randomize();' },
    { name: 'engine test uses Date.now()', path: ET, source: 'Date.now();' },
  ]);
});

describe('AD-1 stripper', () => {
  run([
    { name: 'token in a line comment', path: E, source: '// Date.now()\nexport {};' },
    { name: 'token in a block comment', path: E, source: '/* window */ export {};' },
    {
      name: 'token in a JSDoc comment',
      path: E,
      source: '/** uses no document */\nexport const a = 1;',
    },
    { name: 'token in a string', path: E, source: "const s = 'Date';" },
    { name: 'token in a double-quoted string', path: E, source: 'const s = "window.document";' },
    { name: 'token in a regex literal', path: E, source: 'const r = /Date|console/;' },
    {
      name: 'token in a template literal part',
      path: E,
      source: js('const s = ~Date @{a} window~;'),
    },
    {
      name: 'token in a template middle part',
      path: E,
      source: js('const s = ~a@{x}Date@{y}b~;'),
    },
    {
      name: 'division is not a regex',
      path: E,
      source: 'a / 2; Date.now(); b / 3;',
      fails: 'engine-token',
    },
    {
      name: "'//' in a string",
      path: E,
      source: "const u = '//'; Date.now();",
      fails: 'engine-token',
    },
    {
      name: '"/*" in a string',
      path: E,
      source: 'const s = "/*"; Date.now(); // */',
      fails: 'engine-token',
    },
    {
      name: 'nested template',
      path: E,
      source: js('const s = ~a@{~b@{Date.now()}~}~;'),
      fails: 'engine-token',
    },
    {
      name: "'}' string inside a placeholder",
      path: E,
      source: js("const s = ~@{'}' + Date.now()}~;"),
      fails: 'engine-token',
    },
    { name: 'History API text in a shell string', path: S, source: "const s = 'history.back()';" },
  ]);
});

describe('AD-1 engine directives', () => {
  run([
    {
      name: '/// <reference lib="dom" />',
      path: E,
      source: '/// <reference lib="dom" />\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: '/// <reference types="node" />',
      path: E,
      source: '/// <reference types="node" />\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: '// @ts-nocheck',
      path: E,
      source: '// @ts-nocheck\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: '// @ts-ignore',
      path: E,
      source: '// @ts-ignore\nexport const a: number = 1;',
      fails: 'engine-directive',
    },
    {
      name: '// @ts-expect-error',
      path: E,
      source: '// @ts-expect-error\nexport const a: number = 1;',
      fails: 'engine-directive',
    },
    {
      name: '// @TS-NOCHECK',
      path: E,
      source: '// @TS-NOCHECK\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: '/// <REFERENCE LIB="dom" />',
      path: E,
      source: '/// <REFERENCE LIB="dom" />\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: 'reference directive in an engine test',
      path: ET,
      source: '/// <reference lib="dom" />\nexport {};',
    },
    { name: '@ts-nocheck in an engine test', path: ET, source: '// @ts-nocheck\nexport {};' },
  ]);
});

describe('AD-1 scan scope', () => {
  run([
    {
      name: '.d.ts in a stray directory',
      path: 'src/lib/x.d.ts',
      source: 'declare const x: string;',
      fails: 'stray-file',
    },
    {
      name: '.mts under engine',
      path: 'src/engine/x.mts',
      source: 'export {};',
      fails: 'extension',
    },
    { name: '.mjs under shell', path: 'src/shell/x.mjs', source: 'export {};', fails: 'extension' },
    { name: '.cjs at the root', path: 'src/x.cjs', source: '', fails: 'extension' },
    { name: '.cts under shell', path: 'src/shell/x.cts', source: 'export {};', fails: 'extension' },
    { name: '.tsx under ui', path: 'src/ui/x.tsx', source: 'export {};', fails: 'extension' },
    { name: '.jsx under ui', path: 'src/ui/x.jsx', source: 'export {};', fails: 'extension' },
    { name: '.js under engine', path: 'src/engine/x.js', source: 'export {};', fails: 'extension' },
    {
      name: '.svelte under engine',
      path: 'src/engine/X.svelte',
      source: '<p>x</p>',
      fails: 'extension',
    },
    { name: 'stray root .ts', path: 'src/foo.ts', source: 'export {};', fails: 'stray-file' },
    { name: 'stray directory', path: 'src/lib/x.ts', source: 'export {};', fails: 'stray-file' },
    { name: 'stray root .svelte', path: 'src/App.svelte', source: '<p>x</p>', fails: 'stray-file' },
    {
      name: 'ui .d.ts binding named history',
      path: 'src/ui/x.d.ts',
      source: 'declare const history: unknown;',
      fails: 'history-binding',
    },
    {
      name: 'shell .d.ts localStorage',
      path: 'src/shell/x.d.ts',
      source: 'declare const s: typeof localStorage;',
      fails: 'local-storage',
    },
    {
      name: 'root .d.ts deep engine import',
      path: 'src/x.d.ts',
      source: "import type { Card } from './engine/deal';",
      fails: 'deep-engine-import',
    },
    { name: 'root .d.ts', path: 'src/x.d.ts', source: 'declare const __APP_VERSION__: string;' },
    {
      name: 'root .d.ts importing the engine index',
      path: 'src/x.d.ts',
      source: "import type { CardId } from './engine';",
    },
    {
      name: 'main.ts',
      path: 'src/main.ts',
      source: "import { createSession } from './engine/index';\ncreateSession(1);",
    },
    {
      name: 'non-code file under engine',
      path: 'src/engine/tsconfig.json',
      source: '{ "window": 1 }',
    },
    { name: 'css under ui', path: 'src/ui/app.css', source: 'body { color: red; }' },
  ]);
});

describe('AD-1 import forms', () => {
  run([
    {
      name: "shell import x = require('../engine/deal')",
      path: S,
      source: "import x = require('../engine/deal');",
      fails: 'deep-engine-import',
    },
    {
      name: "shell export * from '../engine/deal'",
      path: S,
      source: "export * from '../engine/deal';",
      fails: 'deep-engine-import',
    },
    {
      name: 'shell import.meta.globEager',
      path: S,
      source: "import.meta.globEager('./*.ts');",
      fails: 'import-meta-glob',
    },
    {
      name: 'shell test importing ui',
      path: ST,
      source: "import { x } from '../ui/x';",
      fails: 'cross-layer-import',
    },
    {
      name: 'commented-out UI deep import',
      path: U,
      source: "// import { deal } from '../engine/deal';\nexport {};",
    },
    {
      name: "UI import type from '../engine'",
      path: U,
      source: "import type { CardId } from '../engine';",
    },
    {
      name: "UI import type from '../engine/'",
      path: U,
      source: "import type { CardId } from '../engine/';",
    },
    {
      name: "UI import type from '../engine/index'",
      path: U,
      source: "import type { CardId } from '../engine/index';",
    },
    {
      name: 'UI export type from the engine',
      path: U,
      source: "export type { CardId } from '../engine';",
    },
    {
      name: "UI '../engine/index.js'",
      path: U,
      source: "import type { CardId } from '../engine/index.js';",
      fails: 'deep-engine-import',
    },
    {
      name: "UI '../engine/index.ts'",
      path: U,
      source: "import type { CardId } from '../engine/index.ts';",
      fails: 'deep-engine-import',
    },
    {
      name: 'shell value import of the engine index',
      path: S,
      source: "import { createSession } from '../engine';",
    },
    {
      name: "shell '../engine/index'",
      path: S,
      source: "import { createSession } from '../engine/index';",
    },
    {
      name: 'no-substitution template specifier',
      path: S,
      source: js('await import(~../engine/deal~);'),
      fails: 'deep-engine-import',
    },
    {
      name: 'UI inline import { type CardId }',
      path: U,
      source: "import { type CardId } from '../engine';",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI import-type expression',
      path: U,
      source: "type C = import('../engine').CardId;",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI value re-export',
      path: U,
      source: "export { createSession } from '../engine';",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI export * from the engine',
      path: U,
      source: "export * from '../engine';",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI dynamic import of the engine',
      path: U,
      source: "await import('../engine');",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI side-effect import of the engine',
      path: U,
      source: "import '../engine';",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'shell side-effect import of ui',
      path: S,
      source: "import '../ui/x';",
      fails: 'cross-layer-import',
    },
    {
      name: 'shell non-literal import(x)',
      path: S,
      source: 'await import(x);',
      fails: 'non-literal-import',
    },
    {
      name: 'main.ts non-literal import(x)',
      path: 'src/main.ts',
      source: 'await import(x);',
      fails: 'non-literal-import',
    },
    {
      name: 'shell template import with a placeholder',
      path: S,
      source: js('await import(~./@{x}~);'),
      fails: 'non-literal-import',
    },
    {
      name: 'shell import.meta.glob',
      path: S,
      source: "import.meta.glob('./*.ts');",
      fails: 'import-meta-glob',
    },
    {
      name: 'main.ts import.meta.glob',
      path: 'src/main.ts',
      source: "import.meta.glob('./ui/*.svelte');",
      fails: 'import-meta-glob',
    },
    {
      name: "shell import '../ui'",
      path: S,
      source: "import '../ui';",
      fails: 'cross-layer-import',
    },
    {
      name: "UI import x = require('../engine')",
      path: U,
      source: "import x = require('../engine');",
      fails: 'ui-value-engine-import',
    },
    { name: 'import.meta alone', path: S, source: 'export const dev = import.meta.env.DEV;' },
    {
      name: 'main.ts deep engine import',
      path: 'src/main.ts',
      source: "import { deal } from './engine/deal';",
    },
  ]);
});

describe('AD-1 layer table', () => {
  run([
    {
      name: "shell '../engine/deal'",
      path: S,
      source: "import { deal } from '../engine/deal';",
      fails: 'deep-engine-import',
    },
    {
      name: "UI '../engine/deal'",
      path: U,
      source: "import type { Card } from '../engine/deal';",
      fails: 'deep-engine-import',
    },
    {
      name: "UI '/src/engine/deal'",
      path: U,
      source: "import type { Card } from '/src/engine/deal';",
      fails: 'deep-engine-import',
    },
    {
      name: "engine '../shell/x'",
      path: E,
      source: "import { x } from '../shell/x';",
      fails: 'engine-import',
    },
    {
      name: "engine './words.txt?raw'",
      path: E,
      source: "import w from './words.txt?raw';",
      fails: ['engine-import', 'engine-import'], // a query and a non-code extension
    },
    {
      name: "engine './deal.js'",
      path: E,
      source: "import { deal } from './deal.js';",
      fails: 'engine-import',
    },
    {
      name: "engine './deal.ts'",
      path: E,
      source: "import { deal } from './deal.ts';",
      fails: 'engine-import',
    },
    {
      name: "engine '/src/engine/deal'",
      path: E,
      source: "import { deal } from '/src/engine/deal';",
      fails: 'engine-import',
    },
    {
      name: 'engine bare specifier',
      path: E,
      source: "import x from 'lodash';",
      fails: 'engine-import',
    },
    {
      name: "shell '../ui/x'",
      path: S,
      source: "import { x } from '../ui/x';",
      fails: 'cross-layer-import',
    },
    {
      name: "shell '../main'",
      path: S,
      source: "import app from '../main';",
      fails: 'cross-layer-import',
    },
    {
      name: "shell '../main.js'",
      path: S,
      source: "import app from '../main.js';",
      fails: 'cross-layer-import',
    },
    {
      name: "UI '../main'",
      path: U,
      source: "import app from '../main';",
      fails: 'cross-layer-import',
    },
    { name: 'stray src/foo.ts', path: 'src/foo.ts', source: '', fails: 'stray-file' },
    { name: "UI '../shell/x'", path: U, source: "import { x } from '../shell/x';" },
    {
      name: 'shell dictionary ?url asset',
      path: S,
      source: "import url from '../../generated/dictionary/en.txt?url';",
    },
    { name: "UI 'svelte'", path: U, source: "import { mount } from 'svelte';" },
    { name: "UI './Card.svelte'", path: U, source: "import Card from './Card.svelte';" },
    { name: "shell './storage'", path: S, source: "import { read } from './storage';" },
    {
      name: "shell '../../fixtures/x.json'",
      path: S,
      source: "import x from '../../fixtures/x.json';",
    },
    { name: "engine './deal'", path: E, source: "import { deal } from './deal';" },
    { name: "engine './lang/en'", path: E, source: "import { EN } from './lang/en';" },
    {
      name: "engine '..' from lang/",
      path: 'src/engine/lang/en.ts',
      source: "import { deal } from '..';",
    },
    { name: "engine './deal.data'", path: E, source: "import { t } from './deal.data';" },
  ]);
});

describe('AD-1 engine tests', () => {
  run([
    {
      name: 'engine test dynamic fixtures JSON with the option',
      path: ET,
      source: "await import('../../fixtures/a.json', { with: { type: 'json' } });",
    },
    {
      name: 'engine test dynamic fixtures JSON without the option',
      path: ET,
      source: "await import('../../fixtures/a.json');",
      fails: 'engine-import',
    },
    {
      name: 'engine test dictionary ?url',
      path: ET,
      source: "import url from '../../generated/dictionary/en.txt?url';",
      fails: ['engine-import', 'engine-import', 'engine-import'], // query, leaves src/engine/, extension,
    },
    { name: "engine test './deal'", path: ET, source: "import { deal } from './deal';" },
    { name: 'engine test vitest', path: ET, source: "import { it } from 'vitest';" },
    {
      name: 'engine test fixtures JSON with the attribute',
      path: ET,
      source: "import a from '../../fixtures/a.json' with { type: 'json' };",
    },
    {
      name: 'engine test dictionary ?raw',
      path: ET,
      source: "import words from '../../generated/dictionary/en.txt?raw';",
    },
    {
      name: 'engine test nested fixtures JSON',
      path: ET,
      source: "import a from '../../fixtures/sub/a.json' with { type: 'json' };",
      fails: ['engine-import', 'engine-import'], // leaves src/engine/ and has an extension
    },
    {
      name: "engine test 'vitest/config'",
      path: ET,
      source: "import { defineConfig } from 'vitest/config';",
      fails: 'engine-import',
    },
    {
      name: "engine test '@vitest/expect'",
      path: ET,
      source: "import { x } from '@vitest/expect';",
      fails: 'engine-import',
    },
    {
      name: 'engine test fixtures JSON without the attribute',
      path: ET,
      source: "import a from '../../fixtures/a.json';",
      fails: 'engine-import',
    },
    {
      name: "engine test '../shell/x'",
      path: ET,
      source: "import { x } from '../shell/x';",
      fails: 'engine-import',
    },
    {
      name: "engine test 'node:fs'",
      path: ET,
      source: "import { readFileSync } from 'node:fs';",
      fails: 'engine-import',
    },
    {
      name: "engine test fixtures JSON with { type: 'css' }",
      path: ET,
      source: "import a from '../../fixtures/a.json' with { type: 'css' };",
      fails: 'engine-import',
    },
    {
      name: 'engine test other generated ?raw',
      path: ET,
      source: "import w from '../../generated/other.txt?raw';",
      fails: ['engine-import', 'engine-import', 'engine-import'], // query, leaves src/engine/, extension
    },
    {
      name: 'engine test fixtures JSON ?raw with the attribute',
      path: ET,
      source: "import a from '../../fixtures/a.json?raw' with { type: 'json' };",
      fails: ['engine-import', 'engine-import', 'engine-import'], // query, leaves src/engine/, extension
    },
    {
      name: 'engine source fixtures JSON with the attribute',
      path: E,
      source: "import a from '../../fixtures/a.json' with { type: 'json' };",
      fails: ['engine-import', 'engine-import'], // leaves src/engine/ and has an extension
    },
  ]);
});

describe('AD-1 History API', () => {
  run([
    {
      name: 'history.pushState',
      path: S,
      source: "history.pushState({}, '');",
      fails: 'history-api',
    },
    {
      name: 'window.history.back()',
      path: U,
      source: 'window.history.back();',
      fails: 'history-api',
    },
    { name: 'history?.back()', path: S, source: 'history?.back();', fails: 'history-api' },
    {
      name: 'window.history?.pushState',
      path: S,
      source: "window.history?.pushState({}, '');",
      fails: 'history-api',
    },
    { name: 'history . go(-1)', path: S, source: 'history . go(-1);', fails: 'history-api' },
    {
      name: 'history newline .state',
      path: S,
      source: 'const s = history\n  .state;',
      fails: 'history-api',
    },
    {
      name: 'loaded().history.length',
      path: S,
      source: 'const n = loaded().history.length;',
      fails: 'history-api',
    },
    {
      name: 'main.ts history.back()',
      path: 'src/main.ts',
      source: 'history.back();',
      fails: 'history-api',
    },
    { name: 'nav.ts history.pushState', path: NAV, source: "history.pushState({}, '');" },
    { name: 'loaded().history.records', path: S, source: 'const r = loaded().history.records;' },
    { name: 'scoreHistory.length', path: S, source: 'const n = scoreHistory.length;' },
    { name: 'myhistory.back()', path: S, source: 'myhistory.back();' },
    { name: 'history.goTo()', path: S, source: 'history.goTo();' },
  ]);
});

describe('AD-1 history bindings', () => {
  run([
    {
      name: 'enum history',
      path: S,
      source: 'enum history {}',
      fails: 'history-binding',
    },
    {
      name: 'namespace history',
      path: S,
      source: 'namespace history {}',
      fails: 'history-binding',
    },
    {
      name: 'module history',
      path: S,
      source: 'module history {}',
      fails: 'history-binding',
    },
    {
      name: 'class history',
      path: S,
      source: 'class history {}',
      fails: 'history-binding',
    },
    {
      name: 'const [history] = x',
      path: S,
      source: 'const [history] = x;',
      fails: 'history-binding',
    },
    {
      name: 'catch (history)',
      path: S,
      source: 'try {} catch (history) {}',
      fails: 'history-binding',
    },
    {
      name: 'for (const history of xs)',
      path: S,
      source: 'for (const history of xs) {}',
      fails: 'history-binding',
    },
    {
      name: "import history = require('./h')",
      path: S,
      source: "import history = require('./h');",
      fails: 'history-binding',
    },
    { name: 'const history', path: S, source: 'const history = 1;', fails: 'history-binding' },
    { name: 'let history', path: S, source: 'let history = 1;', fails: 'history-binding' },
    { name: 'var history', path: S, source: 'var history = 1;', fails: 'history-binding' },
    {
      name: 'function history()',
      path: S,
      source: 'function history() {}',
      fails: 'history-binding',
    },
    {
      name: 'parameter (history) =>',
      path: S,
      source: 'const f = (history) => 0;',
      fails: 'history-binding',
    },
    {
      name: 'typed parameter (history: Foo) =>',
      path: S,
      source: 'const f = (history: Foo) => 0;',
      fails: 'history-binding',
    },
    {
      name: 'function f(history: Foo)',
      path: S,
      source: 'function f(history: Foo) {}',
      fails: 'history-binding',
    },
    {
      name: 'const { history } = x',
      path: S,
      source: 'const { history } = x;',
      fails: 'history-binding',
    },
    {
      name: 'const { history: h } = x',
      path: S,
      source: 'const { history: h } = x;',
      fails: 'history-binding',
    },
    {
      name: 'shorthand { history }',
      path: S,
      source: 'const o = { history };',
      fails: 'history-binding',
    },
    {
      name: 'method shorthand { history() {} }',
      path: S,
      source: 'const o = { history() {} };',
      fails: 'history-binding',
    },
    {
      name: 'import history from',
      path: S,
      source: "import history from './h';",
      fails: 'history-binding',
    },
    {
      name: 'import * as history',
      path: S,
      source: "import * as history from './h';",
      fails: 'history-binding',
    },
    {
      name: 'import { a as history }',
      path: S,
      source: "import { a as history } from './h';",
      fails: 'history-binding',
    },
    {
      name: 'function expression history',
      path: S,
      source: 'const f = function history() {};',
      fails: 'history-binding',
    },
    {
      name: 'class expression history',
      path: S,
      source: 'const C = class history {};',
      fails: 'history-binding',
    },
    {
      name: 'destructuring assignment ({ history: h } = x)',
      path: S,
      source: '({ history: h } = x);',
      fails: 'history-binding',
    },
    {
      name: 'nested destructuring assignment ({ a: { history: h } } = x)',
      path: S,
      source: '({ a: { history: h } } = x);',
      fails: 'history-binding',
    },
    {
      name: 'object-literal getter history',
      path: S,
      source: 'const o = { get history() { return 1; } };',
      fails: 'history-binding',
    },
    {
      name: 'object-literal setter history',
      path: S,
      source: 'const o = { set history(v) {} };',
      fails: 'history-binding',
    },
    { name: 'class getter history', path: S, source: 'class C { get history() { return 1; } }' },
    { name: 'scoreHistory', path: S, source: 'const scoreHistory = 1;' },
    { name: 'interface member', path: S, source: 'interface L { history: H }' },
    { name: 'type literal member', path: S, source: 'type T = { history?: H };' },
    { name: 'class field', path: S, source: 'class C { history = x; }' },
    { name: 'property assignment o.history = x', path: S, source: 'o.history = x;' },
    { name: 'object-literal key history: x', path: S, source: 'const o = { history: x };' },
    { name: 'loaded().history', path: S, source: 'const h = loaded().history;' },
    { name: 'nav.ts const history', path: NAV, source: 'const history = window.history;' },
  ]);
});

describe('AD-1 popstate', () => {
  run([
    {
      name: "'popstate' in a string",
      path: S,
      source: "addEventListener('popstate', f);",
      fails: 'popstate',
    },
    { name: 'window.onpopstate', path: S, source: 'window.onpopstate = f;', fails: 'popstate' },
    {
      name: 'popstate only in a comment',
      path: S,
      source: '// popstate is nav.ts business\nexport {};',
    },
    { name: 'nav.ts popstate', path: NAV, source: "addEventListener('popstate', f);" },
  ]);
});

describe('AD-1 localStorage', () => {
  run([
    {
      name: 'shell localStorage',
      path: S,
      source: "localStorage.getItem('x');",
      fails: 'local-storage',
    },
    {
      name: 'UI localStorage',
      path: U,
      source: "localStorage.getItem('x');",
      fails: 'local-storage',
    },
    {
      name: 'storage.ts localStorage',
      path: 'src/shell/storage.ts',
      source: "localStorage.getItem('x');",
    },
    { name: 'localStorage in a shell string', path: S, source: "const s = 'localStorage';" },
    { name: 'localStorageKey', path: S, source: 'const localStorageKey = 1;' },
  ]);
});

describe('AD-1 test-file exemptions', () => {
  run([
    { name: 'engine test Date.now()', path: ET, source: 'Date.now();' },
    {
      name: 'shell test localStorage and history.pushState',
      path: ST,
      source: "localStorage.getItem('x');\nhistory.pushState({}, '');",
    },
    {
      name: 'UI test const history and popstate',
      path: UT,
      source: "const history = 1;\nconst e = 'popstate';",
    },
    { name: 'UI test localStorage', path: UT, source: 'localStorage.clear();' },
    {
      name: 'engine test localStorage',
      path: ET,
      source: 'localStorage.clear();',
      fails: 'local-storage',
    },
    {
      name: 'engine test history.pushState',
      path: ET,
      source: "history.pushState({}, '');",
      fails: 'history-api',
    },
    {
      name: "engine test 'popstate'",
      path: ET,
      source: "const e = 'popstate';",
      fails: 'popstate',
    },
    {
      name: 'UI test value-importing the engine',
      path: UT,
      source: "import { createSession } from '../engine';",
      fails: 'ui-value-engine-import',
    },
  ]);
});

describe('AD-1 .svelte extraction', () => {
  run([
    {
      name: 'markup {#each xs as history}',
      path: UV,
      source: '{#each xs as history}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as { history }}',
      path: UV,
      source: '{#each xs as { history }}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {@const history = x}',
      path: UV,
      source: '{#each xs as x}{@const history = x}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#snippet row(history)}',
      path: UV,
      source: '{#snippet row(history)}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:then history}',
      path: UV,
      source: '{#await p}<p>x</p>{:then history}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:catch history}',
      path: UV,
      source: '{#await p}<p>x</p>{:catch history}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup let:history',
      path: UV,
      source: '<List let:history><p>x</p></List>',
      fails: 'history-binding',
    },
    {
      name: 'markup {@const { history } = x}',
      path: UV,
      source: '{#each xs as x}{@const { history } = x}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:then { history }}',
      path: UV,
      source: '{#await p}<p>x</p>{:then { history }}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:catch { history }}',
      path: UV,
      source: '{#await p}<p>x</p>{:catch { history }}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as record} reading record.history',
      path: UV,
      source: '{#each xs as record}<p>{record.history}</p>{/each}',
    },
    {
      name: 'ownership words in a script comment and strings',
      path: UV,
      source: [
        '<script lang="ts">',
        '  // popstate is handled in nav.ts',
        "  const a = 'history.back()';",
        "  const b = 'localStorage';",
        '</script>',
        '<p>{a}{b}</p>',
      ].join('\n'),
    },
    {
      name: 'instance and module scripts each hold a violation',
      path: UV,
      source: [
        '<script module lang="ts">',
        "  import app from '../main';",
        '</script>',
        '<script lang="ts">',
        "  import { deal } from '../engine/deal';",
        '</script>',
        '<p>x</p>',
      ].join('\n'),
      fails: ['cross-layer-import', 'deep-engine-import'],
    },
    {
      name: 'legacy context="module" script',
      path: UV,
      source: '<script context="module" lang="ts">\n  const history = 1;\n</script>\n<p>x</p>',
      fails: 'history-binding',
    },
    {
      name: 'markup onclick history.back()',
      path: UV,
      source: '<button onclick={() => history.back()}>Back</button>',
      fails: 'history-api',
    },
    {
      name: 'markup svelte:window onpopstate',
      path: UV,
      source: '<svelte:window onpopstate={onPop} />',
      fails: 'popstate',
    },
    {
      name: 'markup localStorage',
      path: UV,
      source: "<p>{localStorage.getItem('x')}</p>",
      fails: 'local-storage',
    },
    {
      name: 'markup text with an apostrophe, HTML comment and style',
      path: UV,
      source: [
        '<script lang="ts">',
        "  import type { CardId } from '../engine';",
        "  import { x } from '../shell/x';",
        '</script>',
        '<!-- history.back() and popstate live in nav.ts -->',
        "<p>it's the score history</p>",
        '<style>.popstate { color: red; }</style>',
      ].join('\n'),
    },
    {
      name: 'script closed by </script > with whitespace',
      path: UV,
      source: '<script>\nconst history = 1;\n</script >\n<p>{history}</p>',
      fails: 'history-binding',
    },
    {
      name: 'script closed by </script\\n> with a newline',
      path: UV,
      source: "<script>\nimport { deal } from '../engine/deal';\n</script\n>",
      fails: 'deep-engine-import',
    },
    {
      name: 'markup {#snippet history()}',
      path: UV,
      source: '{#snippet history()}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup <svelte:options customElement={{ extend: (history) => history }} />',
      path: UV,
      source: '<svelte:options customElement={{ extend: (history) => history }} />',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as x, history} index',
      path: UV,
      source: '{#each xs as x, history}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {const history = x}',
      path: UV,
      source: '{const history = 1}<p>{history}</p>',
      fails: 'history-binding',
    },
    {
      name: 'markup {let history = x}',
      path: UV,
      source: '{let history = $state(0)}<p>{history}</p>',
      fails: 'history-binding',
    },
    {
      name: 'markup { #each xs as history} with whitespace after {',
      path: UV,
      source: '{ #each xs as history}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup { @const history = x} with whitespace after {',
      path: UV,
      source: '{#each xs as x}{ @const history = x}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#await p then history}',
      path: UV,
      source: '{#await p then history}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#await p catch history}',
      path: UV,
      source: '{#await p catch history}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as { ...history }}',
      path: UV,
      source: '{#each xs as { ...history }}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#snippet row(...history)}',
      path: UV,
      source: '{#snippet row(...history)}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup let:item={history}',
      path: UV,
      source: '<List let:item={history}><p>x</p></List>',
      fails: 'history-binding',
    },
    {
      name: 'markup {@const { a = 1, history } = x}',
      path: UV,
      source: '{#each xs as x}{@const { a = 1, history } = x}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#snippet row<T>(history: T)}',
      path: UV,
      source: '<script lang="ts"></script>\n{#snippet row<T>(history: T)}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#snippet row(a = f(), history)}',
      path: UV,
      source: '{#snippet row(a = f(), history)}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:then { a: { b }, history }}',
      path: UV,
      source: '{#await p}<p>x</p>{:then { a: { b }, history }}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup arrow parameter (history) => …',
      path: UV,
      source: '<button onclick={(history) => f(history)}>x</button>',
      fails: 'history-binding',
    },
    {
      name: 'markup {@attach (history) => …}',
      path: UV,
      source: '<div {@attach (history) => f(history)}></div>',
      fails: 'history-binding',
    },
    {
      name: 'markup shorthand attribute {history}',
      path: UV,
      source: '<Comp {history} />',
      fails: 'history-binding',
    },
    {
      name: 'markup shorthand object {{ history }}',
      path: UV,
      source: '<Comp data={{ history }} />',
      fails: 'history-binding',
    },
    {
      name: '<script> inside an HTML comment',
      path: UV,
      source:
        '<!-- <script> -->\n{#each xs as history}<p>x</p>{/each}\n<script>const a = 1;</script>',
      fails: 'history-binding',
    },
    {
      name: '<script> inside a markup string',
      path: UV,
      source:
        "<p>{'<script>'}</p>{#each xs as history}<p>x</p>{/each}<script>const a = 1;</script>",
      fails: 'history-binding',
    },
    {
      name: 'svelte:head script body',
      path: UV,
      source: '<svelte:head><script>const history = 1;</script></svelte:head>',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as x (history)} key is a reference',
      path: UV,
      source: '{#each xs as x (history)}<p>x</p>{/each}',
    },
    {
      name: 'markup history={history} attribute is a reference',
      path: UV,
      source: '<Comp history={history} />',
    },
    {
      name: 'markup {@render row(history)} argument is a reference',
      path: UV,
      source: '{@render row(history)}',
    },
  ]);
});

// --- Tree scan ------------------------------------------------------------------------------

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SELF = 'src/architecture.test.ts';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(posix.join(ROOT, dir), { withFileTypes: true })) {
    const rel = posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

describe('AD-1 tree scan', () => {
  it('AD-1 every file under src/ except this one passes the scan', () => {
    const files = walk('src').filter((p) => p !== SELF);
    expect(files).toEqual(
      expect.arrayContaining([
        'src/main.ts',
        'src/engine/deal.ts',
        'src/engine/index.ts',
        'src/ui/App.svelte',
      ]),
    );
    const violations = files.flatMap((p) => check(p, readFileSync(posix.join(ROOT, p), 'utf8')));
    expect(violations.map((v) => `${v.path}: ${v.rule} (${v.detail})`)).toEqual([]);
  });
});

// --- AD-1 check 1 gate ----------------------------------------------------------------------

describe('AD-1 engine tsconfig', () => {
  it('AD-1 src/engine/tsconfig.json covers engine sources only and has no DOM or Node globals', () => {
    const parsed = ts.getParsedCommandLineOfConfigFile(
      posix.join(ROOT, 'src/engine/tsconfig.json'),
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (d) => {
          throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
        },
      },
    );
    if (!parsed) throw new Error('src/engine/tsconfig.json did not parse');
    expect(parsed.errors).toEqual([]);
    const files = parsed.fileNames.map((f) => posix.relative(ROOT, f));
    expect(files).toContain('src/engine/deal.ts');
    expect(files.filter((f) => f.endsWith('.test.ts'))).toEqual([]);

    const virtual = posix.join(ROOT, 'src/engine/__virtual__.ts');
    const source = 'export const globals = [navigator, document, Buffer];\n';
    const host = ts.createCompilerHost(parsed.options);
    const realGetSourceFile = host.getSourceFile.bind(host);
    const realFileExists = host.fileExists.bind(host);
    const realReadFile = host.readFile.bind(host);
    host.getSourceFile = (name, language, ...rest) =>
      name === virtual
        ? ts.createSourceFile(name, source, language)
        : realGetSourceFile(name, language, ...rest);
    host.fileExists = (name) => name === virtual || realFileExists(name);
    host.readFile = (name) => (name === virtual ? source : realReadFile(name));
    const program = ts.createProgram({ rootNames: [virtual], options: parsed.options, host });
    const sf = program.getSourceFile(virtual);
    if (!sf) throw new Error('virtual engine source missing from the program');
    const messages = program
      .getSemanticDiagnostics(sf)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    for (const name of ['navigator', 'document', 'Buffer']) {
      expect(messages.some((m) => m.startsWith(`Cannot find name '${name}'`))).toBe(true);
    }
  });
});

// --- AD-17 valid fixtures -------------------------------------------------------------------

describe('AD-17 valid session fixtures', () => {
  it('AD-17 the valid fixtures/session-*.json files are exactly the nine rebuilt ones', () => {
    // Own copy of serialize.test.ts's VALID names (tests never import each other); serialize.test.ts
    // ties REBUILDS to VALID, so a new valid fixture fails here until both lists there name it.
    const names = readdirSync(posix.join(ROOT, 'fixtures'))
      .filter((name) => /^session-.*\.json$/.test(name) && !name.startsWith('session-invalid-'))
      .sort();
    expect(names).toEqual([
      'session-below-committed-last.json',
      'session-composing-draft-2-letters.json',
      'session-composing.json',
      'session-gave-up.json',
      'session-idle-fresh.json',
      'session-idle-pending-draft.json',
      'session-place-free-letter-redo-tail.json',
      'session-place.json',
      'session-won.json',
    ]);
  });
});

// --- AD-2 engine surface --------------------------------------------------------------------

describe('AD-2 engine index exports', () => {
  it('AD-2 src/engine/index.ts exports exactly the AD-2 names, types and values', () => {
    const parsed = ts.getParsedCommandLineOfConfigFile(
      posix.join(ROOT, 'src/engine/tsconfig.json'),
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (d) => {
          throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
        },
      },
    );
    if (!parsed) throw new Error('src/engine/tsconfig.json did not parse');
    expect(parsed.errors).toEqual([]);
    const index = posix.join(ROOT, 'src/engine/index.ts');
    const program = ts.createProgram({ rootNames: [index], options: parsed.options });
    const sf = program.getSourceFile(index);
    if (!sf) throw new Error('src/engine/index.ts missing from the program');
    const diagnostics = ts
      .getPreEmitDiagnostics(program, sf)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    expect(diagnostics).toEqual([]);
    const checker = program.getTypeChecker();
    const moduleSymbol = checker.getSymbolAtLocation(sf);
    if (!moduleSymbol) throw new Error('src/engine/index.ts has no module symbol');
    const names = checker
      .getExportsOfModule(moduleSymbol)
      .map((symbol) => symbol.name)
      .sort();
    expect(names).toEqual(
      [
        // values
        'accrue',
        'apply',
        'createSession',
        'EN',
        'gameRecord',
        'HISTORY_VERSION',
        'isRecorded',
        'letterCount',
        'parseHistory',
        'parseSession',
        'reconcileHistory',
        'SESSION_VERSION',
        'serializeHistory',
        'serializeSession',
        'statistics',
        'view',
        // types
        'ApplyContext',
        'ApplyResult',
        'CardId',
        'CellView',
        'ColumnView',
        'Command',
        'Cursor',
        'DestinationSide',
        'DraftView',
        'Face',
        'GameRecord',
        'GameView',
        'LangData',
        'LongestWord',
        'Move',
        'ParseHistoryResult',
        'ParseSessionResult',
        'Phase',
        'PlaceView',
        'Reached',
        'ScoreHistory',
        'Session',
        'Statistics',
        'Status',
        'StructuralCheck',
        'WordCellNumber',
      ].sort(),
    );
  });
});
