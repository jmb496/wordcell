---
id: 10
type: story
title: "Local gate matches CI"
parent: epic-scaffold-ci-deploy
covers: [CAP-3, CAP-4, CAP-5, CAP-6, CAP-7]
after: [9]
risk: low
---

# Local gate matches CI

## Description

Closes retro A2, A3, A5, A9 and the A7 follow-ups:

- `test:all` inserts `npm run build && npm run test:e2e:dist` after the unit step (CI order), so the postbuild size budget and dist-smoke run locally; screenshots stay out (container-only, AD-17 Screenshots). A2 is the owner-accepted source: the build updates AD-17 Scripts, SPEC CAP-3 success, delta-checks row 25 and, through `bmad-project-context`, the AGENTS.md managed block, recording the screenshot exclusion.
- The hook-free tests of the precache, build-output and font specs also run against `dist/`: `distTest()` takes its root from `PW_PREVIEW` and the `dist-smoke` project's `testMatch` widens to them, so `test:e2e:dist` (and CI's existing step, no ci.yml change) runs them. A3 supersedes the epic Note (owner, 2026-09-27) limiting dist-smoke and the matching SPEC dist-smoke scope; the build updates both.
- Precache holds exactly one entry per URL (R5): plugin options only (drop `includeAssets`, `includeManifestIcons: false`, and `workbox.globIgnores: ['manifest.webmanifest']` or equivalent for the plugin's second manifest entry); AD-16 globPatterns and the A-D5 manifest (its three icons) unchanged. The precache test asserts one entry for every URL and loses `PUBLIC_DUPLICATES`; the build amends build-notes CAP-5 ("keep includeAssets").
- `@playwright/test` pinned exactly; a test asserts the package.json spec is exact and equals the lockfile `@playwright/test`, `playwright` and `playwright-core` versions and every `playwright:v<x>-noble` tag in package.json and ci.yml (fails if none found).
- data/README.md (Font sources, new Icon sources) records the SHA-256 of each output (woff2; `public/icons/*.png`, `public/favicon.svg`) with its inputs (font: build-font.py and the recorded TTF; icons: `scripts/icons/*.svg`, build-icons.mjs, the woff2). A unit test fails when any recorded hash mismatches, so an input changed without regenerating and re-recording fails; regeneration itself stays a manual check (A9). The build updates A-A7 (spine, SPEC if present) and the build-icons.mjs header ("no v1 guard …") to name the test.
- The size-budget tests pin gzip level 9 (AD-18 Size) with a fixture whose gzip size differs between level 9 and the zlib default.
- New pin and hash tests live in `scripts/*.test.mjs` with AD-17/AD-18 ids.
- The 1.1 follow-up review covers the markup `history`-binding regex and `svelteMarkup` script-cutting; findings go in the plan.

## Acceptance Criteria

Verify: `npm run test:all` is green and runs the size budget and dist-smoke; a scratch over-budget asset makes it fail at the build's postbuild size budget; a duplicated precache URL, a mismatched Playwright version, a one-byte-changed woff2, icon or generator input, and dropping the gzip level each fail a named test; each confirmed 1.1 gap gets an AD-1 fixture in `src/architecture.test.ts` that fails before the fix.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- retrospective — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy-retrospective.md, R1, R2, R4, R5, R7, R11, S7, S8, A2, A3, A5, A7, A9
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-16, AD-17, AD-18
