// AD-17 test hook: installed only under `vite dev` and the `build:test` build; accessors arrive in
// epics 3 and 7 (update `e2e/globals.d.ts` in the same change).
declare global {
  interface Window {
    __wordcell?: Readonly<Record<string, never>>;
  }
}

if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1') {
  window.__wordcell = Object.freeze({});
}

export {};
