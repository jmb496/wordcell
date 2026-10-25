// Epic 6 CAP-11 (6.13, A-E9): src/ui/announce.ts is the one `game.dispatch(` caller and the one
// live-region writer in src/ui, and App.svelte mounts the one region. The scans read every file
// under src/ui outside `*.test.ts`; aliasing is not detected (as in the AD-1 scan). Written with the
// shared scan module.
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, walk } from './architecture-scan';

const DISPATCH = /(?<![\w$])game\.dispatch\(/;
const WRITE = /(?<![\w$])textContent\s*=[^=]/;
const REGION = /aria-live|role="status"/;
const ANNOUNCE = 'src/ui/announce.ts';
const APP = 'src/ui/App.svelte';

/** The scanned files of `files` (path → source) outside `owner` that match `pattern`. */
function offenders(files: ReadonlyMap<string, string>, pattern: RegExp, owner: string): string[] {
  return [...files]
    .filter(
      ([path, source]) =>
        path !== owner &&
        path.startsWith('src/ui/') &&
        !path.endsWith('.test.ts') &&
        pattern.test(source),
    )
    .map(([path]) => path);
}

describe('AD-3 announcer single owner', () => {
  const files = new Map(
    walk('src/ui')
      .filter((path) => /\.(ts|svelte)$/.test(path))
      .map((path) => [path, readFileSync(posix.join(ROOT, path), 'utf8')] as const),
  );

  it('AD-3 no game.dispatch( call is left in src/ui outside announce.ts and tests', () => {
    expect(DISPATCH.test(files.get(ANNOUNCE) ?? '')).toBe(true);
    expect(offenders(files, DISPATCH, ANNOUNCE)).toEqual([]);
  });

  it('AD-3 only announce.ts writes the live region', () => {
    expect(WRITE.test(files.get(ANNOUNCE) ?? '')).toBe(true);
    expect(offenders(files, WRITE, ANNOUNCE)).toEqual([]);
  });

  it('AD-3 no other component mounts a live region (Tray and every inert wrapper)', () => {
    expect(REGION.test(files.get(APP) ?? '')).toBe(true);
    expect(offenders(files, REGION, APP)).toEqual([]);
  });

  it('AD-3 positive control: a dispatch, a region write and a second region outside their owners are found', () => {
    const planted = new Map([
      [ANNOUNCE, 'game.dispatch(c); node.textContent = "";'],
      [APP, '<div role="status" aria-live="polite"></div>'],
      ['src/ui/Tray.svelte', '<script>game.dispatch({ type: "flip" });</script>'],
      [
        'src/ui/tray/Row.svelte',
        '<script>el.textContent = text;</script><p aria-live="polite"></p>',
      ],
      ['src/ui/keys.ts', 'node.textContent= "x"'],
      ['src/ui/Notice.svelte', '<p role="status">x</p>'],
      ['src/ui/ok.test.ts', 'game.dispatch(c); el.textContent = ""; role="status"'],
      ['src/shell/other.ts', 'game.dispatch(c)'],
      ['src/ui/fine.ts', 'mygame.dispatch(c); if (el.textContent === "") {}'],
    ]);
    expect(offenders(planted, DISPATCH, ANNOUNCE)).toEqual(['src/ui/Tray.svelte']);
    expect(offenders(planted, WRITE, ANNOUNCE)).toEqual([
      'src/ui/tray/Row.svelte',
      'src/ui/keys.ts',
    ]);
    expect(offenders(planted, REGION, APP)).toEqual([
      'src/ui/tray/Row.svelte',
      'src/ui/Notice.svelte',
    ]);
  });
});
