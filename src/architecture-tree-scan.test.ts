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
});
