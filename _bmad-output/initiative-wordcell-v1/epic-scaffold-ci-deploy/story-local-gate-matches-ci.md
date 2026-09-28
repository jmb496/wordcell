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

- `test:all` inserts `npm run build && npm run test:e2e:dist` after the unit step (CI order), so the postbuild size budget and dist-smoke run locally; screenshots stay out (container-only, AD-17 Screenshots).
- The precache, build-output and font specs (hook-free; hook-using tests stay in pwa-only files) also run against `dist/`: `distTest()` takes its root from `PW_PREVIEW` and its missing-build error names that target's script; the `dist-smoke` project's `testMatch` widens to them (build-neutral titles), so `test:e2e:dist` (and CI's existing step, no ci.yml change) runs them. A3 supersedes epic Decisions epic:54 and epic:58: widened specs keep their AD ids; only dist-smoke.spec.ts cases stay AD-18.
- Precache holds exactly one entry per URL (R5): plugin options only (drop `includeAssets`, `includeManifestIcons: false`, and `workbox.globIgnores: ['manifest.webmanifest']` (the one-entry test decides) for the plugin's second manifest entry); AD-16 globPatterns and the A-D5 manifest (its three icons) unchanged. Its test asserts this and drops `PUBLIC_DUPLICATES`.
- `@playwright/test` pinned exactly; a test asserts the package.json spec is exact and equals the lockfile `@playwright/test`, `playwright` and `playwright-core` versions and every `mcr.microsoft.com/playwright:v<semver>-noble` tag; package.json and ci.yml each need at least one, and any other `mcr.microsoft.com/playwright` reference in them fails.
- data/README.md (Font sources, new Icon sources) records, after the build's own input edits, the SHA-256 of each output (`src/ui/assets/*.woff2`; `public/icons/*.png`, `public/favicon.svg`) and its committed inputs (font: build-font.py, whose `TTF_SHA256` pins the git-ignored TTF; icons: `scripts/icons/*.svg`, build-icons.mjs, the woff2). A unit test fails on any mismatch or when the recorded set differs from the globs' files, saying regenerate or re-record; regeneration itself stays a manual check (A9). Every hashed text file (inputs and `public/favicon.svg`) gets `-text` in .gitattributes (OFL.txt precedent).
- The size-budget tests pin gzip level 9 (AD-18 Size) with a fixture whose level-9 and default sizes differ, computed at runtime.
- New tests live in `scripts/*.test.mjs`: AD-16 icon hashes, AD-17 Playwright pin, AD-18 font hash and gzip.
- The 1.1 follow-up review covers the markup `history`-binding regex and `svelteMarkup` script-cutting; confirmed gaps are fixed here; findings or "none found" go in the plan.
- Doc updates: spine AD-17 Scripts and Playwright configs (precache check also under `dist-smoke`) and AD-18 CI (dist-smoke scope); SPEC CAP-3 success and dist-smoke scope; delta-checks rows 25, 45 and 46; epic:54 and epic:58; build-notes CAP-5 line 91 drops "keep includeAssets"; line 94 and the build-icons.mjs header ("no v1 guard …") name the hash test; methodology Definition of done line 70; the AGENTS.md managed block through `bmad-project-context`, recording the screenshot exclusion and the widened `test:e2e:dist` scope.

## Acceptance Criteria

Verify: `npm run test:all` is green and runs the size budget and dist-smoke; a scratch over-budget asset in AD-18's counted set (e.g. imported from the entry chunk) makes it fail at the build's postbuild size budget; a duplicated precache URL, a mismatched Playwright version, a one-byte-changed woff2, icon or generator input, and dropping the gzip level each fail a named test; each confirmed 1.1 gap gets an AD-1 fixture in `src/architecture.test.ts` that fails before the fix.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- retrospective — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy-retrospective.md, R1, R2, R4, R5, R7, R11, S7, S8, A2, A3, A5, A7, A9
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-16, AD-17, AD-18
