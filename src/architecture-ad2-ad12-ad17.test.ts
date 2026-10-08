// AD-17 valid session fixtures, AD-2 engine index exports and the AD-12 act() scan.
import { readdirSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { type AnyNode, isNode, parseSvelte, ROOT, walk } from './architecture-scan';

// --- AD-17 valid fixtures -------------------------------------------------------------------

describe('AD-17 valid session fixtures', () => {
  it('AD-17 the valid fixtures/session-*.json files are exactly the eleven rebuilt ones', () => {
    // Own copy of serialize.test.ts's VALID names (tests never import each other); serialize.test.ts
    // ties REBUILDS to VALID, so a new valid fixture fails here until both lists there name it.
    const names = readdirSync(posix.join(ROOT, 'fixtures'))
      .filter((name) => /^session-.*\.json$/.test(name) && !name.startsWith('session-invalid-'))
      .sort();
    expect(names).toEqual([
      'session-below-committed-last.json',
      'session-composing-draft-2-letters.json',
      'session-composing.json',
      'session-gave-up-after-commit.json',
      'session-gave-up.json',
      'session-idle-empty-column.json',
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

// --- AD-12 act() scan -----------------------------------------------------------------------

// AD-12 R2/F9: every App-owned button handler is an `act(…)` call. Parsed with svelte/compiler (no
// regex over `.svelte`, ticket 1.10). Dialog, BlockingMessage and Halted pass handlers through
// unwrapped and must contain no `act(` call; ActionBar's `onclick={primary.onclick}` is the one
// exempt attribute, its derived `onclick:` properties checked instead (each ternary branch).
const ACT_EXEMPT_FILES = new Set(['Dialog.svelte', 'BlockingMessage.svelte', 'Halted.svelte']);
const HANDLER_ATTRIBUTE = /^on(?:click|action|dismiss|scrim)$/;

const isActCall = (node: unknown): boolean =>
  isNode(node) &&
  node.type === 'CallExpression' &&
  isNode(node.callee) &&
  node.callee.type === 'Identifier' &&
  node.callee.name === 'act';

const isUndefined = (node: unknown): boolean =>
  isNode(node) && node.type === 'Identifier' && node.name === 'undefined';

// Every node (Svelte and ESTree) of the parsed file, scripts included, depth first.
function allNodes(root: unknown): AnyNode[] {
  const out: AnyNode[] = [];
  const seen = new WeakSet<object>();
  const visit = (value: unknown): void => {
    if (typeof value !== 'object' || value === null || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (isNode(value)) out.push(value);
    for (const [key, field] of Object.entries(value)) {
      if (key === 'parent' || key === 'metadata' || key === 'loc') continue;
      visit(field);
    }
  };
  visit(root);
  return out;
}

function actViolations(path: string, source: string): string[] {
  const name = posix.basename(path);
  const ast = parseSvelte(source, { modern: true });
  const nodes = allNodes(ast);
  const where = (node: AnyNode) => `${path}:${source.slice(node.start, node.end)}`;
  if (ACT_EXEMPT_FILES.has(name)) {
    return nodes.filter(isActCall).map((node) => `${where(node)} act( in an exempt file`);
  }
  const out: string[] = [];
  const checkBranch = (owner: AnyNode, value: unknown): void => {
    if (isUndefined(value) || isActCall(value)) return;
    if (isNode(value) && value.type === 'ConditionalExpression') {
      checkBranch(owner, value.consequent);
      checkBranch(owner, value.alternate);
      return;
    }
    out.push(`${where(owner)} onclick: branch is not act(…)`);
  };
  for (const node of nodes) {
    if (node.type === 'SpreadAttribute') out.push(`${where(node)} spread attribute`);
    if (node.type === 'OnDirective' && HANDLER_ATTRIBUTE.test(`on${node.name}`)) {
      out.push(`${where(node)} on: directive`);
    }
    if (node.type === 'Attribute' && HANDLER_ATTRIBUTE.test(String(node.name))) {
      const value = node.value as unknown;
      const expression = isNode(value) && value.type === 'ExpressionTag' ? value.expression : null;
      const exempt =
        name === 'ActionBar.svelte' &&
        node.name === 'onclick' &&
        source.slice(node.start, node.end) === 'onclick={primary.onclick}';
      if (!exempt && !isActCall(expression)) out.push(`${where(node)} handler is not act(…)`);
    }
    if (
      node.type === 'Property' &&
      isNode(node.key) &&
      node.key.type === 'Identifier' &&
      node.key.name === 'onclick' &&
      !node.computed
    ) {
      checkBranch(node, node.value);
    }
  }
  return out;
}

describe('AD-12 act() scan', () => {
  const OK = 'src/ui/X.svelte';
  const cases: [string, string, string, number][] = [
    ['act( call', OK, '<button onclick={act(go)}>a</button>', 0],
    ['component handlers', OK, '<D ondismiss={act(a)} onaction={act(b)} onscrim={act(c)} />', 0],
    ['bare identifier', OK, '<button onclick={go}>a</button>', 1],
    ['shorthand', OK, '<button {onclick}>a</button>', 1],
    ['spread', OK, '<button {...props}>a</button>', 1],
    ['inline arrow', OK, '<button onclick={() => act(go)()}>a</button>', 1],
    ['other callee', OK, '<button onclick={wrap(go)}>a</button>', 1],
    ['string value', OK, '<button onclick="go()">a</button>', 1],
    ['on: directive', OK, '<button on:click={act(go)}>a</button>', 1],
    ['primary.onclick outside ActionBar', OK, '<button onclick={primary.onclick}>a</button>', 1],
    [
      'ActionBar exempt attribute, act branches',
      'src/ui/ActionBar.svelte',
      '<script>const p = { onclick: a ? act(x) : undefined }; const q = { onclick: undefined };</script><button onclick={primary.onclick}>a</button>',
      0,
    ],
    [
      'ActionBar bare branch',
      'src/ui/ActionBar.svelte',
      '<script>const p = { onclick: a ? x : undefined };</script><button onclick={primary.onclick}>a</button>',
      1,
    ],
    ['onclick: property elsewhere', OK, '<script>const p = { onclick: go };</script>', 1],
    [
      'exempt file passes through',
      'src/ui/Dialog.svelte',
      '<button onclick={onaction}>a</button>',
      0,
    ],
    [
      'act( in an exempt file',
      'src/ui/Halted.svelte',
      '<script>const r = act(reload);</script>',
      1,
    ],
  ];
  for (const [label, path, source, count] of cases) {
    it(`AD-12 scan: ${label} → ${count} violation(s)`, () => {
      expect(actViolations(path, source)).toHaveLength(count);
    });
  }

  it('AD-12 every src/ui/**/*.svelte button handler is an act( call; the exempt files have none', () => {
    const files = walk('src/ui').filter((p) => p.endsWith('.svelte'));
    expect(files).toEqual(
      expect.arrayContaining([
        'src/ui/App.svelte',
        'src/ui/ActionBar.svelte',
        'src/ui/Dialog.svelte',
        'src/ui/BlockingMessage.svelte',
        'src/ui/Halted.svelte',
      ]),
    );
    const violations = files.flatMap((p) =>
      actViolations(p, readFileSync(posix.join(ROOT, p), 'utf8')),
    );
    expect(violations).toEqual([]);
  });
});
