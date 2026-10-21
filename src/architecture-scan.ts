// AD-1 check 2, shared machinery of the architecture tests (ticket 4.13 split of the former
// src/architecture.test.ts, AD-17 Speed): the scanner (`check`) with its stripper, import, history
// binding and .svelte helpers, the fixture scaffolding (`run`, `Case`), and the tree-scan `ROOT`,
// `walk` and `SELF` (the architecture test files and this module, exempt from the scan). Fixture
// cases run on virtual (path, source) pairs through the same `check` the tree scan uses;
// resolution and layer classification are path-lexical and never consult the filesystem.
// Known limitation (story 1.1 OQ #2): aliasing and destructuring (`const { random } = Math`,
// `const M = Math`, `history['back']()`, `const h = window.history`, `window['localStorage']`)
// pass the scan; code review covers deliberate aliasing. `.svelte` files are split with
// svelte/compiler `parse` (scripts, markup text, markup bindings), never by regex (ticket 1.10).
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AST } from 'svelte/compiler';
import ts from 'typescript';
import { expect, it } from 'vitest';

export type Rule =
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

export interface Violation {
  readonly path: string;
  readonly rule: Rule;
  readonly detail: string;
}

export type Layer = 'engine' | 'shell' | 'ui' | 'entry' | 'declaration' | 'stray';

export const CODE_EXT = /\.(ts|js|svelte|mjs|cjs|mts|cts|tsx|jsx)$/;
export const BANNED_EXT = /\.(mjs|cjs|mts|cts|tsx|jsx)$/;
// Identifier boundaries: `\b` treats `$` as a boundary, so `$window` would match.
export const ENGINE_TOKENS =
  /(?<![\w$])(Date|performance|crypto|setTimeout|setInterval|requestAnimationFrame|fetch|localStorage|sessionStorage|globalThis|window|document|process|console)(?![\w$])/g;
export const MATH_RANDOM = /(?<![\w$])Math\s*(?:\?\.|\.)\s*random(?![\w$])/;
export const MATH_COMPUTED = /(?<![\w$])Math\s*(?:\?\.)?\s*\[/;
export const HISTORY_API =
  /(?<![\w$])(?:window\s*(?:\?\.|\.)\s*)?history\s*(?:\?\.|\.)\s*(?:pushState|replaceState|back|forward|go|state|length)(?![\w$])/;
export const LOCAL_STORAGE = /(?<![\w$])localStorage(?![\w$])/;
export const REFERENCE_DIRECTIVE = /^\s*\/\/\/\s*<reference\b/im;
export const TS_DIRECTIVE = /@ts-(?:nocheck|ignore|expect-error)\b/i;
export const IMPORT_EXT =
  /\.(ts|js|mjs|cjs|mts|cts|tsx|jsx|svelte|json|txt|css|html|svg|png|woff2?)$/;

export function layerOf(path: string): Layer {
  if (path.startsWith('src/engine/')) return 'engine';
  if (path.startsWith('src/shell/')) return 'shell';
  if (path.startsWith('src/ui/')) return 'ui';
  if (path === 'src/main.ts') return 'entry';
  if (path.endsWith('.d.ts') && posix.dirname(path) === 'src') return 'declaration';
  return 'stray';
}

// --- Stripper -------------------------------------------------------------------------------

export const LITERAL_KINDS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.RegularExpressionLiteral,
]);

export function blank(chars: string[], start: number, end: number): void {
  for (let i = start; i < end; i++) if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = ' ';
}

/** Blanks the comments inside a trivia range (whitespace and comments only). */
export function blankComments(text: string, chars: string[], start: number, end: number): void {
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
export function strip(sf: ts.SourceFile, keepStrings: boolean): string {
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

export interface ImportRef {
  /** null for a dynamic import whose specifier is not a literal. */
  readonly spec: string | null;
  readonly typeOnly: boolean;
  readonly json: boolean;
}

export function literalText(node: ts.Node | undefined): string | null {
  if (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
    return node.text;
  }
  return null;
}

export function hasJsonAttribute(attributes: ts.ImportAttributes | undefined): boolean {
  return (
    attributes?.elements.some(
      (el) => el.name.text === 'type' && literalText(el.value) === 'json',
    ) ?? false
  );
}

export function dynamicJsonOption(options: ts.Expression | undefined): boolean {
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

export function collectImports(sf: ts.SourceFile): { imports: ImportRef[]; globs: number } {
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

export function isRelative(spec: string): boolean {
  return spec === '.' || spec === '..' || spec.startsWith('./') || spec.startsWith('../');
}

/** Repo-relative, path-lexical resolution; a `/`-rooted specifier resolves against the root. */
export function resolveSpec(importer: string, spec: string): string {
  const joined = spec.startsWith('/')
    ? posix.normalize(spec.slice(1))
    : posix.normalize(posix.join(posix.dirname(importer), spec));
  return joined.length > 1 && joined.endsWith('/') ? joined.slice(0, -1) : joined;
}

export function splitQuery(spec: string): { bare: string; query: string | null } {
  const q = spec.indexOf('?');
  return q === -1
    ? { bare: spec, query: null }
    : { bare: spec.slice(0, q), query: spec.slice(q + 1) };
}

export function checkImport(
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

export function isHistoryName(node: ts.Node | undefined): boolean {
  return !!node && ts.isIdentifier(node) && node.text === 'history';
}

/** True when `literal` is (nested in) the left side of an `=` assignment: a destructuring pattern. */
export function inAssignmentPattern(literal: ts.Node): boolean {
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

export function historyBindings(sf: ts.SourceFile): number {
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
export const { parse: parseSvelte } = createRequire(import.meta.url)(
  'svelte/compiler',
) as typeof import('svelte/compiler');

// Every Svelte (not ESTree) node type of svelte/compiler's modern AST (namespace AST).
export const SVELTE_NODES = new Set([
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
export const BINDING_FIELDS = new Set([
  'EachBlock.context',
  'AwaitBlock.value',
  'AwaitBlock.error',
  'SnippetBlock.expression',
  'SnippetBlock.parameters',
  'LetDirective.expression',
]);
export const DECLARATION_FIELDS = new Set(['ConstTag.declaration', 'DeclarationTag.declaration']);
export const ESTREE_KEYS = new Set([
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

export interface SvelteParts {
  /** Instance, module and `<script>` element bodies, each scanned as TypeScript. */
  readonly scripts: string[];
  /** The source with scripts, styles and HTML comments blanked to spaces. */
  readonly markup: string;
  /** Markup bindings rewritten as TypeScript for `historyBindings`. */
  readonly bindingSources: string[];
  /** Markup bindings named `history` with no TypeScript form (each index, `let:history`, `{history}`). */
  readonly directBindings: number;
}

export type AnyNode = { type: string; start: number; end: number; [key: string]: unknown };

export const isNode = (value: unknown): value is AnyNode =>
  typeof value === 'object' && value !== null && typeof (value as AnyNode).type === 'string';

export function svelteParts(source: string): SvelteParts {
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

export function check(path: string, source: string): Violation[] {
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
export const js = (s: string): string => s.replaceAll('~', '`').replaceAll('@{', `\${`);

export const E = 'src/engine/x.ts';
export const ET = 'src/engine/x.test.ts';
export const S = 'src/shell/x.ts';
export const ST = 'src/shell/x.test.ts';
export const U = 'src/ui/x.ts';
export const UT = 'src/ui/x.test.ts';
export const UV = 'src/ui/X.svelte';
export const NAV = 'src/shell/nav.ts';

export interface Case {
  readonly name: string;
  readonly path: string;
  readonly source: string;
  /** The exact rules the case must report, in order (one rule or a list); absent means clean. */
  readonly fails?: Rule | readonly Rule[];
}

export function run(cases: readonly Case[]): void {
  for (const c of cases) {
    it(`AD-1 ${c.fails ? 'fails' : 'passes'}: ${c.name} (${c.path})`, () => {
      const expected =
        c.fails === undefined ? [] : typeof c.fails === 'string' ? [c.fails] : c.fails;
      expect(check(c.path, c.source).map((v) => v.rule)).toEqual(expected);
    });
  }
}

export const TOKENS = [
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

// --- Tree scan ------------------------------------------------------------------------------

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
/** The architecture tests and this module: exempt from the tree scan (AD-1). */
export const SELF: ReadonlySet<string> = new Set([
  'src/architecture-scan.ts',
  'src/architecture-tree-scan.test.ts',
  'src/architecture-ad1.test.ts',
  'src/architecture-ad2-ad12-ad17.test.ts',
  'src/architecture-new-game.test.ts',
  'src/architecture-open-surface.test.ts',
]);

export function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(posix.join(ROOT, dir), { withFileTypes: true })) {
    const rel = posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}
