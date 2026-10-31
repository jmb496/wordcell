---
id: 6
type: story
title: "Offline proof"
parent: epic-pwa-release
covers: [CAP-4]
after: [3, 4]
risk: low
---

# Offline proof

## Description

Adds CAP-4's offline proof (brief §6.8) in `e2e/pwa/`: after a move online and `precacheComplete()` (no polling after it), `context.setOffline(true)` and a reload restore the game with entry 3's no-prompt check before the deal, then a deal (accepting the New game confirm) and a validated word with `dictionaryState()` `ready` and no fatal surface; a `dist-smoke` case in `e2e/pwa/dist-smoke.spec.ts` (an `allow` `test.describe` with `test.use`, never file level) does the same on `dist/` minus the hook reads (build-notes Offline), waiting by polling Cache Storage from the spec with `readPrecacheManifest` URLs and the active worker `activated`, not the hook; the existing `precache.spec.ts` one-download check stays green.

## Acceptance Criteria

Verify: `npm run test:e2e:pwa` and `npm run build && npm run test:e2e:dist` pass the tests named `AD-16 AD-17 offline after the precache is complete …` on `dist-test/` and `dist/`, and `precache.spec.ts` (AD-8, dictionary once with revision `null`) passes; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-4, F6; build-notes.md Playwright mechanics (Offline, No-prompt checks)
- brief — brief.md §6.8
- code — e2e/pwa/dist-smoke.spec.ts, e2e/pwa/precache.spec.ts, e2e/helpers/precache.ts, src/ui/ConfirmDialogs.svelte
