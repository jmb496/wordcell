// AD-17 test hook: installed only under `vite dev` and the `build:test` build; read-only accessors
// delegate to the stores (update `e2e/globals.d.ts` in the same change).
import { type Current, game, type Loaded } from './game.svelte';

declare global {
  interface Window {
    __wordcell?: Readonly<{ loaded(): Loaded; current(): Current }>;
  }
}

if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1') {
  window.__wordcell = Object.freeze({
    loaded: () => game.loaded(),
    current: () => game.current(),
  });
}
