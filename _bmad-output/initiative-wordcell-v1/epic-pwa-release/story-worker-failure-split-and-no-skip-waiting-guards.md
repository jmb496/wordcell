---
id: 2
type: story
title: "Worker failure split and no-skip-waiting guards"
parent: epic-pwa-release
covers: [CAP-1]
after: [1]
risk: medium
---

# Worker failure split and no-skip-waiting guards

## Description

Completes CAP-1 on entry 1's `sw.ts` and state module: `failed` on a rejected `register()`, on any worker observed this launch turning redundant before `activated` with no newer worker in any slot, and on an absent `navigator.serviceWorker` (F5, after the dev skip), sticky once set; the attempt always resolves after setting it; silent in production, `reportError(new Error(...))` in hook builds (AD-15 halt, so the boot tail's `halted()` check skips what follows), a redundant install reported later from a listener included; an architecture source scan (string literals kept, `strip(sf, true)`, AD-1 tree-scan exclusions, a scanner fixture case with `'SKIP_WAITING'` in a string) finding no `messageSkipWaiting`, `SKIP_WAITING`, `updateSW` or `virtual:pwa-register` in non-test `src/`; and a build-output assertion that the generated `sw.js` calls `skipWaiting()` only on a `SKIP_WAITING` message and has no `clientsClaim`; it re-runs entry 1's F6 audit for any existing `pwa` spec the hook-build halt now breaks (an install silently turning redundant) and fixes it.

## Acceptance Criteria

Verify: Shell Vitest `AD-16` with a faked registration names and passes the rejected register, first-install redundant, update-failure (older worker staying active), second-update-found-later, activated-then-superseded (not `failed`), absent `navigator.serviceWorker` and sticky-`failed` cases, each checking the production/hook-build split; the architecture scan and its fixture case pass; the generated-`sw.js` build-output test passes; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-1, F4, F5; build-notes.md Worker module and state (Failure), Packaging and budget
- rules — docs/game-flow-spec.md Q-40
- architecture — ARCHITECTURE-SPINE.md AD-1 (scan list), AD-15, AD-16
- code — src/shell/sw.ts, src/architecture-scan.ts, src/architecture-ad2-ad12-ad17.test.ts, e2e/pwa/build-output.spec.ts
