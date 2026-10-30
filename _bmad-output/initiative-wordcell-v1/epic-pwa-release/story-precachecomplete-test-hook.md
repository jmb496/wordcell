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

Adds CAP-2's sixth hook key `precacheComplete()` (AD-17 Reading state, synchronous `boolean`), its code in `src/shell/test-hook.ts` or a new hook-only shell module, never in `sw.ts` or the worker-state module (entry 2's files): behind the hook's env gate, each call starts an asynchronous recompute and returns the last computed value; a recompute returns `false` without fetching unless `navigator.serviceWorker.getRegistration()` has an `activated` active worker, then fetches `/sw.js` once while online, extracts the URLs of its single `precacheAndRoute([` array by regex (failing fast if none; never a hand list) and keeps them, so later recomputes read only Cache Storage (keys compared with `__WB_REVISION__` stripped); `src/shell/test-hook.ts`, `e2e/globals.d.ts`, `e2e/test-hook.spec.ts` and `e2e/pwa/test-hook.spec.ts` change together to exactly six keys; nothing pulls `workbox-window` into the main chunk (F1) and `dist/` still has no `__wordcell`.

## Acceptance Criteria

Verify: On `dist-test/` a `pwa` test named AD-17 polls `precacheComplete()` with `expect.poll` from `false` to `true` once the worker is activated and the precache is cached, and the frozen hook has exactly six keys; in the dev server `precacheComplete()` is `false` and `swState()` `unregistered`; shell Vitest `AD-17` covers the no-active-worker (no fetch), the parse (and its fail-fast) and the cached-keys comparison; the existing `dist-smoke` no-`__wordcell` check passes; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-2, F1, F14; build-notes.md Worker module and state (precacheComplete)
- architecture — ARCHITECTURE-SPINE.md AD-17 (Reading state, Celebration seam key list)
- code — src/shell/test-hook.ts, e2e/globals.d.ts, e2e/test-hook.spec.ts, e2e/pwa/test-hook.spec.ts, e2e/helpers/precache.ts
