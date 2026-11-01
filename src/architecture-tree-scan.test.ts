// AD-1 check 2: scans every file under src/** except the architecture tests and their scan module
// (`SELF`, src/architecture-scan.ts); the same scan carries epic 7 SPEC CAP-1's skip-waiting rule.
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { check, ROOT, SELF, type Violation, walk } from './architecture-scan';

// One scan of the tree, shared by the AD-1 and AD-16 tree tests (AD-17 Speed).
let scanned: { files: string[]; violations: Violation[] } | undefined;
function scanTree(): { files: string[]; violations: Violation[] } {
  if (scanned === undefined) {
    const files = walk('src').filter((p) => !SELF.has(p));
    const violations = files.flatMap((p) => check(p, readFileSync(posix.join(ROOT, p), 'utf8')));
    scanned = { files, violations };
  }
  return scanned;
}

describe('AD-1 tree scan', () => {
  it('AD-1 every file under src/ except the architecture tests and their scan module passes the scan', () => {
    const { files, violations } = scanTree();
    expect(files).toEqual(
      expect.arrayContaining([
        'src/main.ts',
        'src/engine/deal.ts',
        'src/engine/index.ts',
        'src/ui/App.svelte',
      ]),
    );
    expect(violations.map((v) => `${v.path}: ${v.rule} (${v.detail})`)).toEqual([]);
  });
  it('AD-16 no skip-waiting names in non-test src/', () => {
    const { files, violations } = scanTree();
    expect(files).toEqual(expect.arrayContaining(['src/shell/sw.ts', 'src/main.ts']));
    const skipWaiting = violations.filter((v) => v.rule === 'skip-waiting');
    expect(skipWaiting.map((v) => `${v.path}: ${v.detail}`)).toEqual([]);
  });
  it('AD-14 src/main.ts starts the tracker before the controller and registers the hide-clear after controller.cancel and gate.scrollReset', () => {
    const source = readFileSync(posix.join(ROOT, 'src/main.ts'), 'utf8');
    const at = (needle: string) => {
      const index = source.indexOf(needle);
      expect(index, needle).toBeGreaterThan(-1);
      return index;
    };
    const tracker = at('startTracker(');
    const controller = at('createController(gate');
    const cancel = at('game.registerBeforeHide(() => controller.cancel())');
    const scroll = at('game.registerBeforeHide(() => gate.scrollReset())');
    const clear = at('game.registerBeforeHide(() => hideClear())');
    expect(tracker).toBeLessThan(controller);
    expect(cancel).toBeLessThan(scroll);
    expect(scroll).toBeLessThan(clear);
  });
  it('AD-16 src/main.ts reports the F17 chunk failure on the hook gate alone, halted or not', () => {
    const source = readFileSync(posix.join(ROOT, 'src/main.ts'), 'utf8');
    const report = source.indexOf("'Q-40 F17 the sw.ts chunk did not load'");
    expect(report).toBeGreaterThan(-1);
    // The F17 catch, from its `catch (` up to the report's message.
    const f17 = source.slice(source.lastIndexOf('catch (', report), report);
    const condition = /\bif\s*\(([\s\S]*?)\)\s*\{\s*reportError\(\s*new Error\(\s*$/.exec(f17)?.[1];
    expect(condition?.replace(/\s+/g, ' ').trim()).toBe("import.meta.env.VITE_TEST_HOOKS === '1'");
  });
  // Epic 4 G9 (device-checks.md; the 4.6 contract's main.ts bullet): order only, not adjacency.
  // The hide cancel before gate.scrollReset is the AD-14 pin above; passing the controller to App
  // is App's required `controller` prop (`npm run check`).
  it('AD-12 AD-13 AD-16 src/main.ts creates the controller after the halted return and createGate, before registerLifecycle and the before-back cancel, and sets it once before mount', () => {
    const source = readFileSync(posix.join(ROOT, 'src/main.ts'), 'utf8');
    const start = source.indexOf('async function boot()');
    expect(start, 'async function boot()').toBeGreaterThan(-1);
    const body = source.slice(start, source.indexOf('\n}\n', start) + 2);
    const at = (needle: string) => {
      const index = body.indexOf(needle);
      expect(index, needle).toBeGreaterThan(-1);
      return index;
    };
    const halted = at("if (game.state.kind === 'halted') {");
    const haltedReturn = body.indexOf('return;', halted);
    const gate = at('createGate(');
    const controller = at('createController(gate');
    const lifecycle = at('game.registerLifecycle()');
    const mount = at('mount(App');
    const setController = at('setController(controller)');
    // The `nav.registerBeforeBack(` whose callback opens with the by-back cancel.
    const beforeBack =
      /nav\.registerBeforeBack\(\(\) => \{\s*controller\.cancel\(\{ byBack: true \}\);/.exec(body)
        ?.index ?? -1;
    expect(
      beforeBack,
      'nav.registerBeforeBack(() => { controller.cancel({ byBack: true });',
    ).toBeGreaterThan(-1);
    // Rejected root included: the halted return is boot()'s only `return` before createController.
    expect([...body.slice(0, controller).matchAll(/\breturn\b/g)].length).toBe(1);
    expect(haltedReturn).toBeGreaterThan(halted);
    expect(haltedReturn).toBeLessThan(gate);
    expect(gate).toBeLessThan(controller);
    expect(controller).toBeLessThan(lifecycle);
    expect(controller).toBeLessThan(beforeBack);
    expect([...source.matchAll(/\bsetController\(/g)].length, 'setController( calls').toBe(1);
    expect(controller).toBeLessThan(setController);
    expect(setController).toBeLessThan(mount);
  });
  it("AD-17 recomputePrecacheComplete is called in src/ only from test-hook.ts's env-gated accessor", () => {
    const { files } = scanTree();
    const name = 'recomputePrecacheComplete';
    const sources = files.filter((p) => !p.endsWith('.test.ts'));
    expect(sources).toEqual(expect.arrayContaining(['src/shell/test-hook.ts', 'src/main.ts']));
    const mentions = sources.filter((p) =>
      readFileSync(posix.join(ROOT, p), 'utf8').includes(name),
    );
    expect(mentions).toEqual(['src/shell/test-hook.ts']);
    const source = readFileSync(posix.join(ROOT, 'src/shell/test-hook.ts'), 'utf8');
    const calls = [...source.matchAll(/(?<!function )\brecomputePrecacheComplete\(/g)];
    expect(calls.length, `${name}( calls`).toBe(1);
    const gate = source.indexOf(
      "if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1') {\n  window.__wordcell = Object.freeze({",
    );
    expect(gate, 'the env-gated window.__wordcell block').toBeGreaterThan(-1);
    // The block's closing brace: the first top-level `}` line after the gate.
    const end = source.indexOf('\n}\n', gate);
    expect(end, 'the end of the env-gated block').toBeGreaterThan(gate);
    // The `precacheComplete` accessor inside the block, up to its closing `},` line.
    const accessor = source.indexOf('\n    precacheComplete: () => {\n', gate);
    expect(accessor, 'the precacheComplete accessor').toBeGreaterThan(gate);
    expect(accessor, 'the precacheComplete accessor').toBeLessThan(end);
    const accessorEnd = source.indexOf('\n    },\n', accessor);
    expect(accessorEnd, 'the end of the precacheComplete accessor').toBeGreaterThan(accessor);
    expect(accessorEnd, 'the end of the precacheComplete accessor').toBeLessThan(end);
    expect(calls[0]?.index).toBeGreaterThan(accessor);
    expect(calls[0]?.index).toBeLessThan(accessorEnd);
  });
});
