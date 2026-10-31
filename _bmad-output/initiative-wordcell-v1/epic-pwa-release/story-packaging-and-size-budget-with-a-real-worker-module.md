---
id: 8
type: story
title: "Packaging and size budget with a real worker module"
parent: epic-pwa-release
covers: [CAP-6]
after: [2]
risk: low
---

# Packaging and size budget with a real worker module

## Description

Completes CAP-6 on top of entry 1's narrowed build-output test: `scripts/size-budget.mjs` (postbuild) fails when the manifest has a `src/shell/sw.ts` key no dynamic edge reaches (a `size-budget.test.mjs` case on a synthetic manifest); an `e2e/pwa/build-output.spec.ts` case reads `.vite/manifest.json` (entry 1's chunk helper) to show the `src/shell/sw.ts` key a dynamic entry outside the counted set and a Workbox marker (e.g. `messageSkipWaiting`) and `serviceWorker.register` in no file of `computeBudget`'s counted `rows` but in `manifest['src/shell/sw.ts'].file` or its static-import closure outside them; the total stays at or under 600,000 bytes with the margin recorded in the plan; and the epic 1 A3 items are re-checked closed at HEAD (F13).

## Acceptance Criteria

Verify: The new `size-budget.test.mjs` case and the `build-output.spec.ts` manifest content case pass, `npm run build` reports the counted total at or under 600,000 bytes (margin recorded), the A3 re-check is recorded in the plan, and `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-6, F13; build-notes.md Packaging and budget
- architecture — ARCHITECTURE-SPINE.md AD-16, AD-18 (Size)
- code — scripts/size-budget.mjs, scripts/size-budget.test.mjs, e2e/pwa/build-output.spec.ts, vite.config.ts
