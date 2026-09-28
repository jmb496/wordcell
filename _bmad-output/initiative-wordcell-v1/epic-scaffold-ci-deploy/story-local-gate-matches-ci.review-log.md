# Review log — story-local-gate-matches-ci.md (ticket 1.10)

State: pass 1: done

Mode: docs, depth thorough (builder, edge-case, adversarial, ref-alignment), cap 7. Pre-loop: HEAD 40fe05d, copy at story-local-gate-matches-ci.review-log.passes/pass0.md, 217 words (growth budget ~540).

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 7, minor 3, decision-needed 0  |  Dropped in triage: 2 (plus duplicates)
### Applied
- [major] Description / test:all — new composition contradicts AD-17 Scripts, SPEC CAP-3, delta-checks row 25, AGENTS.md; A2's "screenshots stay container-only" dropped; order unstated
- [major] Description / dist/ packaging checks — not disk-only (precache reads /sw.js via preview; font uses page); no project/script named; supersedes epic Note (owner, 2026-09-27) and SPEC dist-smoke scope
- [major] Description / precache — only two of three duplicate sources named (manifest.webmanifest); mechanism unstated; build-notes:91 "keep includeAssets" contradicted; AD-16 globPatterns and A-D5 manifest must stay
- [major] Description / hash test — output-only hashes do not tie outputs to generator inputs (A9, R11); record location unnamed; A-A7 and build-icons.mjs header would contradict; A9 "regeneration by hand" half dropped
- [major] Verify — 1.1 history-regex follow-up has no deliverable or check; svelteMarkup script-cutting half dropped
- [major] Verify — over-budget asset fails the postbuild script, not a named test
- [major] Description / gzip level — level unnamed; current tiny fixtures gzip identically at default and 9, so a naive pin cannot fail
- [minor] Description / Playwright pin — which entries compared, exact-pin assertion, tag parsing, fail on no tag found
- [minor] Description / new unit tests — home and id
- [minor] Title/Description — local gate still excludes screenshots (folded into the test:all major)
### Default applied (technical)
- test:all order — insert `npm run build && npm run test:e2e:dist` after unit, matching CI order
- dist/ packaging run — `distTest()` takes its root from `PW_PREVIEW`; the `dist-smoke` project widens `testMatch` to the hook-free packaging specs; CI unchanged via `test:e2e:dist`
- precache dedupe — plugin options only (drop `includeAssets`, `includeManifestIcons: false`, dedupe the plugin's manifest entry); AD-16 globPatterns, A-D5 manifest unchanged; `PUBLIC_DUPLICATES` tolerance removed
- hash records — data/README.md (Font sources plus a new Icon sources section), input and output hashes together; regeneration stays a manual check
- gzip — level 9 (AD-18 Size), fixture whose size differs between level 9 and the default
- new pin tests — `scripts/*.test.mjs`, AD-17/AD-18 ids
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Add CAP-8 to covers if ci.yml changes — the default needs no ci.yml change.
- Spine Stack row auto-checked by the Playwright test — beyond A5; the ticket names the spine for manual update on a bump at most.
### Fixer outcome
All 9 applied. Checked in node_modules: `includeManifestIcons` (vite-plugin-pwa 1.3.0), `globIgnores` (workbox-build 7.4.1); plugin always adds its own manifest entry. `unverified`: that `globIgnores: ['manifest.webmanifest']` removes exactly the duplicate (ticket says "or equivalent").
Words (docs): 474 (2.18 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-local-gate-matches-ci.review-log.passes/pass1.md
