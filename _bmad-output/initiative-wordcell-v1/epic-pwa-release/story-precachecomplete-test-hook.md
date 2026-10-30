---
id: 4
type: story
title: "precacheComplete() test hook"
parent: epic-pwa-release
covers: [CAP-2]
after: [1]
risk: low
---

# precacheComplete() test hook

## Description

Adds CAP-2's sixth hook key `precacheComplete()` (AD-17 Reading state, synchronous `boolean`) in `src/shell/test-hook.ts`, never in `sw.ts` or the worker-state module (entry 1's files); its recompute is called only from the hook's env-gated block, so it is absent from `dist/`.

- Accessor: the value starts `false`; each call starts `void recomputePrecacheComplete()` and returns the last written value. Recomputes run only when the accessor is called (never at boot or on activation); recomputes are numbered in start order and a result writes only if its number is higher than the last written one (older results are dropped).
- Recompute: a named exported async function of the hook module, e.g. `recomputePrecacheComplete(): Promise<boolean>`, called with `void` from the env-gated block only (tree-shaken from `dist/` like `precacheUrls`); it writes the value per the accessor's write rule and rejects on failure. Every recompute checks the registration first. No `navigator.serviceWorker` (F5) or no `getRegistration()` active worker in state `activated` (e.g. `activating`) gives `false` without fetching (CAP-2). The URL list is one shared promise, created by the first recompute that sees an activated worker (it fetches and parses `new URL('/sw.js', location.href)`, which is also the resolution base; Vitest stubs `location`) and reused by every later one: exactly one `/sw.js` fetch per page load; after it, recomputes make no network request. The value is `true` only when the active worker is `activated` and every parsed URL, resolved against the absolute `/sw.js` URL (`new URL(url, <sw.js URL>).href`), equals the URL of some request key, with the `__WB_REVISION__` search parameter removed, in any cache whose name starts with `workbox-precache` (union; the prefix holds while `vite.config.ts` sets no `cacheId`); otherwise `false`. The check deliberately ignores revisions; callers reach `true` before any build swap.
- Parse: an exported pure function of the hook module, e.g. `precacheUrls(source: string): string[]`, throws unless the source holds exactly one `precacheAndRoute(` occurrence followed (whitespace allowed) by `[`, the array closes (a string-aware bracket-depth scan from that `[`, as `arraySlice` in `e2e/helpers/precache.ts` does; no close throws), and the slice holds at least one `url:"…"` string; it extracts every `url:"…"` string of that slice by regex, never a hand list. `e2e/helpers/precache.ts` is reference only (Node `vm`, not importable in the page).
- Failures (rule 6): every recompute failure (a rejected `getRegistration()`, a rejected `/sw.js` fetch, a non-OK response (throw with the status, as `readPrecacheManifest` does), a parse throw, a Cache Storage rejection) rejects the recompute, leaves the value unchanged, is never caught and reaches AD-15 through `main.ts`'s `unhandledrejection` handler; no catch turns it into `false`. A rejected shared URL promise is kept, never retried. There is no online check: callers reach `true` before going offline and never call it after an offline reload (the list lives per page load; an offline first fetch rejects to AD-15, build-notes Offline).
- Change together, to exactly six keys (`celebration`, `current`, `dictionaryState`, `loaded`, `precacheComplete`, `swState`): `src/shell/test-hook.ts`, `src/shell/test-hook.test.ts` (its exact sorted key list), `e2e/globals.d.ts`, `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts`.
- F1: nothing pulls `workbox-window` into the main chunk; `e2e/pwa/build-output.spec.ts` (worker registered only from the `sw.ts` chunk) and the dev test's no-`workbox-window`-request assertion stay green; `dist/` still has no `__wordcell`.
- Interface: `window.__wordcell.precacheComplete(): boolean`, polled; the six-key frozen hook and its `e2e/globals.d.ts` type.
- Tests: AD-17 `swState()` and `precacheComplete()` row of rule-coverage.md (P7, Playwright dev); AD-17 / AD-18 no `__wordcell` in `dist/` (P7 `dist-smoke`, existing).
- Owns: `precacheComplete()` and the six-key hook.
- Consumers: entries 5 (shares `e2e/test-hook.spec.ts`), 6 and 7 (the offline and Q-42 specs wait on it).

## Acceptance Criteria

Verify:

- On `dist-test/` a `pwa` test named AD-17 polls `precacheComplete()` with `expect.poll` (`{ timeout: 15_000 }`, as the existing `swState()` poll) to `true` once the worker is activated and the precache is cached, then asserts every `readPrecacheManifest` URL is in `caches` (same comparison rule); the frozen hook has exactly six keys.
- In the dev server (`e2e/test-hook.spec.ts`) the test, after `dictionaryState()` polls to settled, calls `precacheComplete()` and asserts it returns `false` (not `undefined`), lets that recompute settle (a macrotask, network idle), reads again and asserts `false`, asserts no `/sw.js` request was made, and `swState()` is `unregistered`.
- Shell Vitest `AD-17` covers, awaiting `recomputePrecacheComplete()`: all present (fakes use absolute keys, mixing keys with `?__WB_REVISION__=…` for revisioned entries and plain keys for null-revision entries, as in `dist-test/sw.js`) → `true`; each `false` case first brings the same module instance to `true` (activated worker, all keys present), changes one condition, awaits the recompute and asserts `false`: no `navigator.serviceWorker`; no active worker (`getRegistration()` resolving `undefined`, and a registration with `active: null`); `activating`; one URL missing; a URL present only in a cache with another name; the first three also assert no fetch on a fresh module instance; overlapping calls and later calls cause exactly one `/sw.js` fetch, and after it a recompute with `fetch` stubbed to reject still recomputes from Cache Storage; an older recompute settling after a newer one does not overwrite it; a non-OK `/sw.js` rejects with the status in the message; a rejected `getRegistration()`, a rejected fetch and a rejected Cache Storage call each reject (never resolve `false`) and leave the value unchanged; the `precacheUrls` parse and its throws (zero calls, two calls, no URLs, an unclosed array), asserted directly.
- `e2e/pwa/build-output.spec.ts`, the dev no-`workbox-window` assertion and the existing `dist-smoke` no-`__wordcell` check pass; a new `dist-smoke` assertion (the plan picks the spec) finds `precacheAndRoute(` in no app JS chunk under `dist/assets/` (today only `dist/sw.js` holds it); `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-2, F1, F14; build-notes.md Worker module and state (precacheComplete)
- architecture — ARCHITECTURE-SPINE.md AD-17 (Reading state, Celebration seam key list)
- code — src/shell/test-hook.ts, src/shell/test-hook.test.ts, e2e/globals.d.ts, e2e/test-hook.spec.ts, e2e/pwa/test-hook.spec.ts, e2e/helpers/precache.ts
