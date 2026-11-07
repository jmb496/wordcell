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

Completes CAP-6 on top of entry 1's narrowed build-output test.

- **Gate.** `scripts/size-budget.mjs` (postbuild) fails when the `src/shell/sw.ts` key exists and no chunk reached from the entry (over static and dynamic imports, as `computeBudget` walks it; i.e. `main.swDynamic` false) lists it in `dynamicImports`: an orphan key, a key reached only statically, and a key whose only dynamic importer is unreached from the entry (e.g. only inside the subtree of a sw.ts key nothing reaches) all fail. A manifest with no `src/shell/sw.ts` key and no edge to it passes (on real builds `swChunkFile` throws when it is absent); a dangling edge still throws (existing `AD-18 a dangling src/shell/sw.ts key throws`, unchanged); a key reached both statically and dynamically passes and is counted (conservative; the content case is its guard, since the markers would then sit in a counted row). For an orphan key the gate pushes its error without validating the key's `file` (nothing visits it). The failure is not a throw: it pushes exactly `size-budget: manifest key src/shell/sw.ts is reached by no dynamic import` to `errors` after the missing-dictionary error and before the 4 MB precache errors (the per-file table and total still print; exit code 1). `AD-18 sw.ts statically imported by a counted chunk is counted with its css and imports` is the static-only proof: it now expects that error while still asserting its counted rows. New `AD-18 …` cases in `size-budget.test.mjs` cover orphan and unreached-importer, asserting the exact `errors` array, and `AD-18 sw.ts reached both statically and dynamically passes and is counted` (entry chunk lists the key in `dynamicImports`, a counted chunk lists it in `imports`; `errors` `[]`, and the sw chunk file, its css and its imports in `rows`); `AD-18 over-budget, missing font, missing dictionary and 4 MB files are reported in order` gains it. `size-budget.test.mjs` stays on synthetic manifests (it runs before `build` in `test:all`); real-build checks live only in `build-output.spec.ts`.
- **Content case.** `size-budget.mjs` exports `collectSizes(dist)` returning the sizes Map (its CLI `main` uses it); `tsconfig.e2e.json` gains `allowJs: true` so `e2e/pwa/build-output.spec.ts` imports `computeBudget` and `collectSizes` and calls them on `buildRoot()` (a root config change: the plan reads Scaffold deltas, AGENTS.md; the plan lists it as a deferred item for entry 11, as the `workbox-window` dependency hand-off; the build confirms `npm run check` passes with it). The sw.ts static-import closure (manifest keys mapped to `manifest[key].file`) is a helper `(root = buildRoot())` in `e2e/helpers/dist-test.ts` beside `swChunkFile`: it follows `imports` only and throws naming the key on a missing key or a key without `file` (rule 6); its `e2e/helpers.spec.ts` self-test is named `AD-17 …`, as `swChunkFile`'s is. A new `AD-18 …` case shows the `src/shell/sw.ts` key a dynamic entry outside the counted set, and checks each of `messageSkipWaiting` and `serviceWorker.register` on its own: it occurs in no file of `computeBudget`'s counted `rows` (every row read as `latin1`, a byte-faithful decode; the markers are ASCII) and in at least one closure file that is not a counted row (`manifest['src/shell/sw.ts'].file` or an uncounted closure file). The closure includes the entry chunk (today key `index.html`, file `assets/index-*.js`), which is counted, so only uncounted closure files may carry the markers; the case asserts over whatever closure the manifest gives, never a fixed file list. The case runs under `pwa` (`dist-test/`) and `dist-smoke` (`dist/`) and checks manifest shape and marker placement only, staying hook-free (file header). Entry 1's `AD-16 the build has no registerSW.js and registers a worker only from the sw.ts chunk` stays unchanged as the AD-16 placement row's proof (stricter than, and inside, the content check's allowance).
- **Budget.** The total stays at or under 600,000 bytes, checked by the `postbuild` run on `dist/` (`npm run build`), not by the e2e case. The plan records `total / 600,000 (margin N)` measured on the build's start commit plus this ticket's changes, naming the start commit, with the change from the last recorded figure (560,702, entry 5's plan, story-persistent-storage-request-and-boot-order-proofs-plan.md), for entries 10 and 11.
- **A3 re-check (F13, device-checks G28).** Confirmed closed at HEAD: the packaging specs in the `dist-smoke` project's `testMatch` through `buildRoot()`; `includeManifestIcons: false` and no `includeAssets` in `vite.config.ts`; the `precache.spec.ts` one-entry-per-URL test passing. The plan records, per item, the file:line or passing test.

Tests: AD-16 `serviceWorker.register` placement and AD-18 counted-set rows of rule-coverage.md (B, postbuild). Owns: the size-budget gate's unreachable-key failure and the manifest content check. Consumers: entry 10 (re-measures the margin), entry 11 (AD-18 Size sync; Scaffold deltas: `tsconfig.e2e.json` `allowJs`).

## Acceptance Criteria

Verify: The new `AD-18` `size-budget.test.mjs` cases (and the two amended ones) and the `build-output.spec.ts` `AD-18` manifest content case under both `pwa` and `dist-smoke` pass, the closure helper's `AD-17` self-test in `e2e/helpers.spec.ts` passes, `npm run check` is clean with `allowJs`, `npm run build` reports the counted total at or under 600,000 bytes, the margin and the A3 re-check are recorded in the plan, and `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-6, F13; build-notes.md Packaging and budget
- architecture — ARCHITECTURE-SPINE.md AD-16, AD-18 (Size)
- code — scripts/size-budget.mjs, scripts/size-budget.test.mjs, e2e/pwa/build-output.spec.ts, e2e/helpers/dist-test.ts, e2e/helpers.spec.ts, tsconfig.e2e.json, vite.config.ts

## Notes

- **Spine gap.** SPEC CAP-6 governs; AD-18 Size gaining the unreachable-key failure and the content check is the known gap entry 11 (CAP-9) syncs. SPEC wins (AGENTS.md Policy), so the build does not stop for it; this ticket edits neither the spine nor the spec companions. build-notes' "with no edge it counts everything" describes today's code and is superseded by the gate. The `size-budget.mjs` header comment gains the new failure in this ticket.
