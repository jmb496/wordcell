// Epic 6 CAP-1 (6.1, SPEC F8, AD-13): every menu item, button and key opens a surface only through
// `openSurface` (src/ui/open-surface.ts). The scan lists each `overlays.open(<arg>)` text in src/ui
// outside `*.test.ts` and fails on any site the allow-list does not name; aliasing is not detected
// (as in the AD-1 scan). Exemptions: open-surface.ts is the one owner (any id); history-notice.svelte.ts
// opens `historyNotice`, which is not a SurfaceId (the boot and rejected-root notice, AD-16, opened
// once per launch with no clearing). Written with the shared scan module.
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, walk } from './architecture-scan';

const CALL = /(?<![\w$])overlays\.open\(([^)]*)\)/g;
const OWNER = 'src/ui/open-surface.ts';
const ALLOWED: ReadonlyMap<string, readonly string[]> = new Map([
  ['src/ui/history-notice.svelte.ts', ["'historyNotice'"]],
]);

function isScanned(path: string): boolean {
  return path !== OWNER && path.startsWith('src/ui/') && !path.endsWith('.test.ts');
}

/** `path: arg` for every scanned `overlays.open(arg)` of `files` (path → source) not allowed. */
function bypasses(files: ReadonlyMap<string, string>): string[] {
  return [...files]
    .filter(([path]) => isScanned(path))
    .flatMap(([path, source]) =>
      [...source.matchAll(CALL)]
        .map((match) => (match[1] ?? '').trim())
        .filter((arg) => !(ALLOWED.get(path) ?? []).includes(arg))
        .map((arg) => `${path}: ${arg}`),
    );
}

describe('AD-13 openSurface single opening path', () => {
  it('AD-13 in src/ui outside tests only open-surface.ts calls overlays.open(, plus history-notice.svelte.ts for historyNotice', () => {
    const files = new Map(
      walk('src/ui')
        .filter((path) => /\.(ts|svelte)$/.test(path))
        .map((path) => [path, readFileSync(posix.join(ROOT, path), 'utf8')] as const),
    );
    expect([...(files.get(OWNER) ?? '').matchAll(CALL)].length).toBeGreaterThan(0);
    expect(bypasses(files)).toEqual([]);
  });

  it('AD-13 positive control: a surface opened past openSurface in a component or module is found', () => {
    const files = new Map([
      [OWNER, 'overlays.open(id);'],
      ['src/ui/HistoryNotice.svelte', "<script>overlays.open('resetConfirm');</script>"],
      ['src/ui/history-notice.svelte.ts', "overlays.open('historyNotice'); overlays.open('menu');"],
      ['src/ui/Menu.svelte', '<script>function go() { overlays.open( "statistics" ); }</script>'],
      ['src/ui/ok.test.ts', "overlays.open('menu')"],
      ['src/ui/fine.ts', "openSurface('menu'); myoverlays.open('menu');"],
    ]);
    expect(bypasses(files)).toEqual([
      "src/ui/HistoryNotice.svelte: 'resetConfirm'",
      "src/ui/history-notice.svelte.ts: 'menu'",
      'src/ui/Menu.svelte: "statistics"',
    ]);
  });
});
