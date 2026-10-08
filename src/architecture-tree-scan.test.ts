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
});
