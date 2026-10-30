---
id: 1
type: story
title: "Worker registration, state module and swState()"
parent: epic-pwa-release
covers: [CAP-1, CAP-2, CAP-4, CAP-6]
after: [epic-place-preview]
risk: medium
---

# Worker registration, state module and swState()

## Description

Tracer bullet for CAP-1 and CAP-2: adds the F1 worker-state shell module (no `workbox-window` import; `unregistered`, `installing`, `waiting`, `active`, `failed` with CAP-1's precedence), `src/shell/sw.ts` registering `/sw.js` with `workbox-window`'s `Workbox` (F2; no prompt UI, no `updateSW`, no skip-waiting message; `statechange` on the registration's existing workers and its own `updatefound` listener, build-notes), `main.ts`'s boot tail (after `dictionary.load()` settles: `halted()` return, dev skip (F3), dynamic `import()`, `halted()` return again, await the attempt; F17's catch setting `failed` and, in hook builds, `reportError(new Error(...))`), `workbox-window` in `package.json` `dependencies` pinned to the version vite-plugin-pwa resolves, and `swState()` on the frozen hook (five keys; `src/shell/test-hook.ts`, `e2e/globals.d.ts`, `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` together); because a registering worker breaks them, it narrows `e2e/pwa/build-output.spec.ts` "registers no service worker automatically" to CAP-6's first clause (no `registerSW.js`; `serviceWorker.register` only in the `sw.ts` chunk, found through a shared helper reading `.vite/manifest.json`, e.g. `swChunkFile()` in `e2e/helpers/dist-test.ts`, that entries 5, 7 and 8 reuse; entry 8 adds the manifest content check) and runs the F6 audit of every existing `pwa` and `dist-smoke` spec (worker mode set explicitly where a spec routes across a reload, handlers asserted hit); the failure detection is entry 2's.

## Acceptance Criteria

Verify: On `dist-test/` a `pwa` test named AD-16 AD-17 polls `swState()` to `active` and the frozen hook has exactly five keys; in the dev server `swState()` is `unregistered` and no `/src/shell/sw.ts` request is made; shell Vitest `AD-16` with a faked `Workbox` covers the state precedence (pre-existing installing, waiting, active; an update found later through the module's own `updatefound`) and `messageSkipWaiting`/`messageSW` never called; the narrowed build-output test and every existing `pwa` and `dist-smoke` spec pass; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-1, CAP-2, F1–F6, F17; build-notes.md As built at 4130fb4, Worker module and state, Playwright mechanics
- architecture — ARCHITECTURE-SPINE.md AD-15, AD-16, AD-17 (Reading state), Scaffold deltas
- code — src/main.ts, src/shell/test-hook.ts, e2e/globals.d.ts, e2e/test-hook.spec.ts, e2e/pwa/test-hook.spec.ts, e2e/pwa/build-output.spec.ts, e2e/pwa/dist-smoke.spec.ts, e2e/pwa/theme.spec.ts, playwright.pwa.config.ts, vite.config.ts, package.json

## Notes

- Open question: Which existing `pwa` and `dist-smoke` specs a registering worker breaks (routes across a reload, a precached URL answered with an error before install) is found by the F6 audit, not known up front.
