// AD-1 check 2: scans every file under src/** except the architecture tests and their scan module
// (`SELF`, src/architecture-scan.ts).
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { check, ROOT, SELF, walk } from './architecture-scan';

describe('AD-1 tree scan', () => {
  it('AD-1 every file under src/ except the architecture tests and their scan module passes the scan', () => {
    const files = walk('src').filter((p) => !SELF.has(p));
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
});
