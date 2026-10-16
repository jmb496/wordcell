// Epic 6 CAP-1 (R4, SPEC F1): New game has one function, `newGame()` in src/ui/new-game.ts. The
// scan fails if any file in src/ outside new-game.ts, `*.test.ts` and `src/architecture-*` contains
// the text `game.newGame(` or `game.replay(` (`replayDeal()` is Replay's one site); aliasing is not
// detected (as in the AD-1 scan). Written with the shared scan module.
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, walk } from './architecture-scan';

const CALL = /(?<![\w$])game\.(?:newGame|replay)\(/;
const OWNER = 'src/ui/new-game.ts';

function isScanned(path: string): boolean {
  return (
    path !== OWNER &&
    !path.endsWith('.test.ts') &&
    !posix.basename(path).startsWith('architecture-') &&
    /\.(ts|svelte)$/.test(path)
  );
}

/** The scanned files of `files` (path → source) that hold a `game.newGame(` call. */
function callSites(files: ReadonlyMap<string, string>): string[] {
  return [...files]
    .filter(([path, source]) => isScanned(path) && CALL.test(source))
    .map(([p]) => p);
}

describe('AD-4 newGame single call site', () => {
  it('AD-4 only src/ui/new-game.ts calls game.newGame( and game.replay( outside tests and the architecture files', () => {
    const files = new Map(
      walk('src')
        .filter((path) => /\.(ts|svelte)$/.test(path))
        .map((path) => [path, readFileSync(posix.join(ROOT, path), 'utf8')] as const),
    );
    expect(CALL.test(files.get(OWNER) ?? '')).toBe(true);
    expect(/game\.replay\(/.test(files.get(OWNER) ?? '')).toBe(true);
    expect(callSites(files)).toEqual([]);
  });

  it('AD-4 positive control: a second call site in src/ui, a component or src/shell is found', () => {
    const files = new Map([
      [OWNER, 'game.newGame();'],
      ['src/ui/Menu.svelte', '<script>function go() { game.newGame(); }</script>'],
      ['src/shell/other.ts', 'game.newGame()'],
      ['src/ui/Replay.svelte', '<script>game.replay();</script>'],
      ['src/ui/ok.test.ts', 'game.newGame()'],
      ['src/architecture-x.test.ts', 'game.newGame()'],
      ['src/ui/fine.ts', 'newGame(); mygame.newGame();'],
    ]);
    expect(callSites(files)).toEqual([
      'src/ui/Menu.svelte',
      'src/shell/other.ts',
      'src/ui/Replay.svelte',
    ]);
  });
});
