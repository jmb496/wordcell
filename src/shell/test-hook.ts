// AD-17 test hook: installed only under `vite dev` and the `build:test` build; read-only accessors
// delegate to the stores (update `e2e/globals.d.ts` in the same change); `history` comes from
// the score-history store through the game store (AD-6); `dictionaryState` from the AD-8 store.
// Celebration seam (AD-17, AD-19, epic 10 entry 5): `celebration` is the one writable part. The run
// controller lives in `src/ui/`, which shell never imports (AD-1), so main.ts passes it in through
// `registerCelebrationSeam` (hook builds only); until then every method throws (rule 6).
import { type DictionaryState, dictionary } from './dictionary.svelte';
import { type Current, game, type Loaded } from './game.svelte';

/** What main.ts hands over: the controller's `running`, `advance`, `setManual` and the flag setter. */
export type CelebrationSeam = {
  running(): boolean;
  advance(ms: number): void;
  setManual(on: boolean): void;
  setEnabled(on: boolean): void;
};

type CelebrationHook = Readonly<{
  advance(ms: number): void;
  running(): boolean;
  setEnabled(on: boolean): void;
}>;

declare global {
  interface Window {
    __wordcell?: Readonly<{
      loaded(): Loaded;
      current(): Current;
      dictionaryState(): DictionaryState;
      celebration: CelebrationHook;
    }>;
  }
}

let seam: CelebrationSeam | null = null;

/** AD-17: main.ts, once, in hook builds; a second call throws. */
export function registerCelebrationSeam(next: CelebrationSeam): void {
  if (seam !== null) throw new Error('AD-17 registerCelebrationSeam() called twice');
  seam = next;
}

function registered(op: string): CelebrationSeam {
  if (seam === null) throw new Error(`AD-17 celebration.${op}() before the seam is registered`);
  return seam;
}

// `setEnabled` always sets the manual clock with the flag, so a run the hook can see runs on the
// manual clock; the controller's silent `advance` on a real-rAF run is unreachable here (AD-17
// Celebration seam).
if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1') {
  window.__wordcell = Object.freeze({
    loaded: () => game.loaded(),
    current: () => game.current(),
    dictionaryState: () => dictionary.state,
    celebration: Object.freeze({
      advance: (ms: number) => {
        const current = registered('advance');
        if (!current.running()) throw new Error('AD-17 celebration.advance() while not running');
        current.advance(ms);
      },
      running: () => registered('running').running(),
      setEnabled: (on: boolean) => {
        const current = registered('setEnabled');
        if (current.running()) throw new Error('AD-17 celebration.setEnabled() while running');
        current.setEnabled(on);
        current.setManual(on);
      },
    }),
  });
}
