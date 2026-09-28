---
title: 'Local gate matches CI'
type: 'chore'
ticket: '10'
created: '2026-09-28'
status: done
route: 'full'
route_source: 'auto'
baseline_revision: '3d0819bd17b880b1755f51d496fd8c10a371ec1a'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-local-gate-matches-ci.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-local-gate-matches-ci.review-log.md'
warnings: [oversized]
deferred:
  - summary: >-
      The AGENTS.md managed block was edited by hand (test:all composition, widened test:e2e:dist scope) instead of through bmad-project-context.
    evidence: |-
      Ticket says "the AGENTS.md managed block through bmad-project-context"; the review-log minor taken into the plan chose a direct edit listed for the next D8-style audit. Running the skill edits agent context, which triage defers.
    location: >-
      AGENTS.md:55-56
    severity: low
  - summary: >-
      AGENTS.md has no pointer to the new asset-hash test and its re-record step.
    evidence: |-
      An agent editing build-font.py or an icon SVG gets a red npm run test; the re-record procedure is only in data/README.md and the build-icons.mjs header. Fix edits an agent-context file.
    location: >-
      AGENTS.md Running and verifying
    severity: low
  - summary: >-
      The svelteParts "unknown Svelte node" throw has no test.
    evidence: |-
      No fixture makes check() throw 'AD-1: unknown Svelte node'; the public parser cannot emit an unknown node on demand, so a test needs a synthetic AST. Revisit on the next Svelte upgrade.
    location: >-
      src/architecture.test.ts svelteParts estree()
    severity: low
---

<intent-contract>

## Intent

**Problem:** `npm run test:all` skips what CI gates (the `build` postbuild size budget, `test:e2e:dist`); the packaging specs run only against `dist-test/`; the precache holds duplicate public entries; the Playwright version, the committed woff2/icons and the size-budget gzip level are pinned by nothing; the 1.1 markup `history` regex never got its follow-up review (retro A2, A3, A5, A7, A9).

**Approach:** Do exactly what the ticket's Description bullets say, taking the review log's unapplied minors as resolved below; every new check gets a named test and a scratch proof that it fails.

## Boundaries & Constraints

**Always:** cite rules by id in test names (AD-16 icon hashes, AD-17 Playwright pin, AD-18 font hash and gzip; widened specs keep their existing AD-8/AD-16/AD-18 ids, only titles/comments go build-neutral); AD-16 `globPatterns` and the A-D5 manifest unchanged; fail fast (rule 6); revert every scratch edit; `npm run test:all` green at the end.

**Never:** no ci.yml or deploy.yml edits (ticket 11 owns CI scripts); no icon or font regeneration (A9: manual check); no screenshots in `test:all`; do not touch `deal.ts`/engine; do not run `bmad-project-context` (edit the managed-block lines directly and list them for the next audit, D8 precedent); no `dontCacheBustURLsMatching`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gate | clean tree, `npm run test:all` | lint → check → unit → build (size budget) → test:e2e:dist → test:e2e → test:e2e:pwa, green | first failing step stops the chain |
| dist/ missing | `test:e2e:dist` without `npm run build` | widened specs throw naming `npm run build` | throw; `dist-test` names `npm run build:test` |
| Duplicate precache URL | e.g. `includeAssets: ['favicon.svg']` restored | `AD-16 … exactly one entry per URL` fails | named test |
| Playwright mismatch | lockfile 1.63.0, ci.yml `v1.62.0-noble` or `^1.63.0` spec | `AD-17 …` pin test fails | also fails: no tag in package.json or ci.yml, or a non-`v<semver>-noble` `mcr.microsoft.com/playwright` reference |
| Hash drift | one byte changed in woff2, a PNG, favicon, an SVG, build-icons.mjs or build-font.py | hash test fails; message "input changed: regenerate, then re-record" for inputs, "output differs: regenerate or re-record" for outputs | also fails when recorded set ≠ glob matches (added/removed file) |
| gzip level | `level: 9` dropped from `collectSizes` | `AD-18 … gzip level 9` CLI test fails | fixture's level-9 and default sizes asserted different first |

</intent-contract>

## Code Map

- `package.json` -- `test:all` (line 27): insert `npm run build && npm run test:e2e:dist` after `npm run test`. `@playwright/test` `^1.63.0` → `1.63.0`; then `npm install` so the lockfile root spec updates (versions stay 1.63.0).
- `playwright.pwa.config.ts` -- `dist-smoke` `testMatch` → the four files `dist-smoke`, `precache`, `build-output`, `font` `.spec.ts`; header comment says dist-smoke also runs the hook-free packaging specs.
- `e2e/helpers/dist-test.ts` -- today `root` is fixed to `dist-test` and `distTest()`'s error names `npm run build:test`. Rename `distTest()` → `buildRoot()` resolving `PW_PREVIEW` (`dist`|`dist-test`, throw otherwise) and naming `npm run build` / `npm run build:test`; update `readSite` and the three spec importers. Header comment build-neutral.
- `e2e/pwa/precache.spec.ts` -- third test: drop `PUBLIC_DUPLICATES`; every unique URL has exactly one entry; title build-neutral (keep AD-16); comment that `manifest.webmanifest` comes from the plugin's own entry, not the glob (`globIgnores`). Header note: runs under `pwa` and `dist-smoke`, must stay hook-free.
- `e2e/pwa/build-output.spec.ts`, `e2e/pwa/font.spec.ts` -- titles containing `dist-test/` go build-neutral ("the build's …"); header comments likewise, plus the hook-free note. `e2e/pwa/test-hook.spec.ts` stays pwa-only.
- `vite.config.ts` -- VitePWA: remove `includeAssets`; add `includeManifestIcons: false`; `workbox.globIgnores: ['manifest.webmanifest']` (workbox-build 7.4.1 still ignores `sw.js`/`workbox-*.js` itself; vite-plugin-pwa 1.3.0 always adds its manifest entry). If the one-entry test shows `globIgnores` wrong, drop it and record why.
- `scripts/size-budget.mjs` -- `collectSizes` line 175 `gzipSync(bytes, { level: 9 })` is what the gzip test pins; no change.
- `scripts/size-budget.test.mjs` -- `describe('size-budget CLI')`, `distFiles`, `run`: reuse for the gzip test.
- `scripts/build-font.test.mjs` -- `bullet(prefix)` requires exactly one SHA-256 line per bullet and a unique prefix: leave the Fraunces and `OFL.txt` bullets untouched; new hashes go in their own subsection/bullets.
- `data/README.md` -- Font sources section; add hashes and a new `## Icon sources` section.
- `scripts/build-icons.mjs` header lines 4–7 -- "no v1 guard …" sentence → names the hash test; `ICONS`, `FAVICON` exports give the icon file set. Rendered with Chromium 153.0.8010.12 (1.5 plan:226), @playwright/test 1.63.0.
- `.gitattributes` -- add `-text` for `scripts/build-font.py`, `scripts/build-icons.mjs`, `scripts/icons/*.svg`, `public/favicon.svg`; `public/icons/*.png binary`. All are `i/lf w/lf` today.
- `src/architecture.test.ts` -- `MARKUP_HISTORY_BINDING` line 52, `svelteMarkup` line 373, markup checks 426–433, fixture tables (`describe('AD-1 history bindings')` 1144). 1.1 plan:173 names the regex, the script-cutting and "the exact-assertion change touched every failing case" as unverified.
- `.github/workflows/ci.yml` -- read-only: `screens` job image `mcr.microsoft.com/playwright:v1.63.0-noble`; its `test:e2e:dist` step picks up the widened scope with no edit. `playwright.screens.config.ts:5` also holds the tag.
- Docs (edit in place, dated "(ticket 1.10, 2026-09-28)" where an owner Decision is amended): spine `ARCHITECTURE-SPINE.md` AD-17 Projects (~685) and Scripts (~690), AD-18 CI (~724); `SPEC.md` CAP-3 success (57–63) and dist-smoke scope (167); `delta-checks.md` rows at lines 25, 45, 46; epic `epic-scaffold-ci-deploy.md` Decisions at lines 54 and 58; `build-notes.md` line 91 (drop "keep includeAssets") and line 94 (names the hash test); `docs/development-methodology.md` line 70; `AGENTS.md` managed block lines 55–56.
- Already done, no action: retro A7 errata for 1.7 and 1.9 (commit 6990f6b).

## Tasks & Acceptance

**Execution:**
- [x] `vite.config.ts`, `e2e/pwa/precache.spec.ts` -- precache dedupe per Code Map; run `npm run test:e2e:pwa` to confirm exactly one entry per URL and the full expected set.
- [x] `e2e/helpers/dist-test.ts`, `playwright.pwa.config.ts`, `e2e/pwa/{precache,build-output,font}.spec.ts` -- `buildRoot()` from `PW_PREVIEW`, widened `dist-smoke` `testMatch`, build-neutral titles/comments and hook-free header notes.
- [x] `package.json`, `package-lock.json` -- `test:all` order; exact `@playwright/test` pin via `npm install`.
- [x] `scripts/playwright-pin.test.mjs` (new, `// @ts-check`) -- `AD-17 …`: package.json spec is exact semver and equals lockfile `node_modules/@playwright/test`, `node_modules/playwright`, `node_modules/playwright-core` versions; every `mcr.microsoft.com/playwright` reference in `package.json`, `.github/workflows/ci.yml` and `playwright.screens.config.ts` is `mcr.microsoft.com/playwright:v<that version>-noble`; package.json and ci.yml each hold ≥ 1.
- [x] `scripts/size-budget.test.mjs` -- `AD-18 CLI sizes the counted files at gzip level 9`: deterministic runtime-generated fixture (e.g. LCG word list in the dictionary file) whose `gzipSync` level-9 and default sizes are asserted different, then the CLI stdout row equals the level-9 size.
- [x] `scripts/build-icons.mjs` -- header: "no v1 guard …" → the hash test (`scripts/asset-hashes.test.mjs`) pins PNGs, favicon and inputs; regeneration stays a manual check (A-A7, A9). Edit before recording hashes.
- [x] `.gitattributes` -- entries per Code Map, using the test's globs.
- [x] `data/README.md` -- under Font sources, a `### Build hashes` subsection: `- \`<path>\` SHA-256: <hex>` bullets for input `scripts/build-font.py` (its `TTF_SHA256` pins the TTF) and output `src/ui/assets/wordcell-serif.woff2` (recorded once). New `## Icon sources`: prose (sources, `node scripts/build-icons.mjs`, Chromium 153.0.8010.12 / @playwright/test 1.63.0, woff2 input recorded under Font sources) plus bullets for inputs `scripts/icons/*.svg`, `scripts/build-icons.mjs` and outputs `public/icons/*.png`, `public/favicon.svg`. Record after all input edits.
- [x] `scripts/asset-hashes.test.mjs` (new, `// @ts-check`) -- parses the two sections; `AD-18 …` font and `AD-16 …` icon tests: each recorded path's SHA-256 matches, and each group's recorded set equals its globs' files (`fs.globSync` or `readdirSync`); message distinguishes input vs output per the I/O matrix. `build-font.test.mjs` stays green.
- [x] `src/architecture.test.ts` -- 1.1 follow-up: launch one fresh-context review subagent on `MARKUP_HISTORY_BINDING`, `svelteMarkup` script-cutting and the exact-assertion fixtures; for each confirmed gap add an AD-1 fixture, show it fails, then fix. Record findings or "none found" in Implementation Notes.
- [x] Docs per Code Map -- `test:all` = lint + check + unit + build (size budget) + `test:e2e:dist` + `test:e2e` + `test:e2e:pwa`, screenshots container-only (`npm run test:screens`); `dist-smoke` = dist-smoke.spec.ts plus the hook-free precache, build-output and font specs, whose cases keep their AD ids (epic:58's "dist-smoke cases are AD-18" covers dist-smoke.spec.ts only); precache check also under `dist-smoke`; methodology DoD line 70 lists the new composition. AGENTS.md: record edited managed-block lines in Implementation Notes for the next `bmad-project-context` audit.

**Acceptance Criteria:**
- Given a clean tree, when `npm run test:all` runs, then it is green and its log shows the size-budget table and the `dist-smoke` project running the dist-smoke, precache, build-output and font specs.
- Given `generated/dictionary/en.txt` padded past 600,000 gzip bytes (scratch; restore with `npm run build:dictionary`), when `npm run build` runs, then the postbuild size budget exits non-zero.
- Given each scratch edit in the I/O matrix (restored `includeAssets`, a mismatched ci.yml tag, one byte appended to the woff2, a PNG, an SVG and build-icons.mjs, `level: 9` removed), when the relevant suite runs, then the named test fails; after revert it passes.
- Given each confirmed 1.1 gap, when its new AD-1 fixture runs before the fix, then it fails, and passes after.

## Implementation Notes

- Precache (vite.config.ts): `includeAssets` dropped, `includeManifestIcons: false`, `workbox.globIgnores: ['manifest.webmanifest']` kept: the one-entry test proves it (build log `precache 10 entries`; with `globIgnores` removed, 11 entries and the test fails on a second `manifest.webmanifest`; with `includeAssets` restored, 11 entries and it fails on a second `favicon.svg`). `PUBLIC_DUPLICATES` removed; the test now compares the full sorted URL list (duplicates included) to the glob-matched build files.
- `e2e/helpers/dist-test.ts`: `distTest()` renamed `buildRoot()`; `PW_PREVIEW` other than `dist`/`dist-test` throws; a missing build throws `…/dist/index.html is missing: run npm run build` (resp. `run npm run build:test`), both shown via `node` type stripping with the build dir moved aside.
- `@playwright/test` pinned `1.63.0`; `npm install` changed only the lockfile root spec. `scripts/playwright-pin.test.mjs` also scans `playwright.screens.config.ts` (a tag there must match; ≥ 1 required only in package.json and ci.yml). Manual-update points on a bump: build-icons.mjs header, AGENTS.md, spine AD-17 tag.
- gzip test: random-letter fixtures gzip identically at level 6 and 9, so the fixture is a syllable word list (LCG, high bits): 10301 vs 10296 bytes on Node 24; the test asserts the difference first.
- Hash records: `data/README.md` Font sources → `### Build hashes` (build-font.py, woff2) and `## Icon sources` (3 SVGs, build-icons.mjs, 3 PNGs, favicon). The woff2 is recorded once; the icon test checks it as an icon input against the Font sources record. Recorded after the build-icons.mjs header edit and Biome.
- 1.1 follow-up (fresh-context subagent review of `MARKUP_HISTORY_BINDING`, `svelteMarkup`, exact-assertion fixtures): exact assertions confirmed sound. Confirmed gaps: (A) `</script >` / `</script\n>` not cut, so the script escaped the TypeScript scan; (B) Svelte 5.5x `{const …}`/`{let …}` declaration tags; (C) whitespace after `{` (`{ #each …}`, `{ @const …}`); (D) inline `{#await p then|catch x}`; (E) rest patterns `...history`; (F) `let:item={history}`; (G) `{@const}` with defaults before `history`; (H) snippet params with nested parens or generics; (I) nested braces before `history`; (J) arrow parameters in markup expressions and `{@attach}`; (K) markup shorthand `{history}` / `{{ history }}`; `<script>` inside an HTML comment or markup string swallowing markup; false positive on an each key `(history)`. 22 new fixtures under `AD-1 .svelte extraction` failed before the fix (plus an each-index fixture shown failing with the index check removed); all pass after. Fix: regex markup scan replaced by svelte/compiler `parse(…, { modern: true })`: scripts by AST offsets (plus `<script>` elements), markup text with scripts/styles/comments blanked, binding patterns and declarations rewritten as TypeScript for the existing `historyBindings`, other markup expressions scanned the same way; an ESTree node under an unknown Svelte key throws (rule 6). svelte/compiler is loaded with `createRequire` (CJS build): a Vitest import made the suite take ~11 s (vite-plugin-svelte inlines svelte), now 1.5 s (AD-17).
- AGENTS.md managed-block lines edited directly (D8, for the next `bmad-project-context` audit): "Running and verifying" bullet `npm run test:all …` (composition, screenshots excluded) and bullet `npm run test:e2e` … (`test:e2e:dist` widened scope).
- Docs edited: spine AD-17 Projects and Scripts, AD-18 CI; SPEC CAP-3 success and the dist-smoke note; delta-checks rows `test:all`, `pwa` project, `dist-smoke` project; epic Decisions (build-output checks; AD-8/AD-18 naming) amended with dated notes; build-notes CAP-5 (no `includeAssets`; hash test); methodology DoD `test:all` line.
- Verification: `npm run test:all` exit 0 (size-budget table `total 473036 / 600000`; `[dist-smoke]` 13 tests across dist-smoke, precache, build-output, font specs); scratch proofs each failed the named test and passed after revert: `includeAssets` restored, `globIgnores` removed, ci.yml `v1.62.0-noble`, ci.yml `:latest`, ci.yml without an image, `^1.63.0` spec, one byte appended to the woff2, `icon-192.png`, `icon.svg`, build-icons.mjs, build-font.py, `public/favicon.svg`, an extra `scripts/icons/*.svg`, `level: 9` removed; dictionary padded (60,000 random words) → `npm run build` exit 1 `total 781526 gzip bytes is over the 600000 budget`, restored with `npm run build:dictionary`.
- Step-03 verify (parent session): the matrix row "dist/ missing" had no automated test, so `buildRoot()` takes an optional `repo` directory and `e2e/helpers.spec.ts` gains `AD-17 a missing build names the script that builds it` (android; temp dir, both targets and a bad `PW_PREVIEW`).

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 22 findings — high 0, medium 1, low 16, false 3, maybe-false 2
- findings:
  - `[medium]` `[patch]` blind: `{#snippet history()}` name not scanned as a binding — `SnippetBlock.expression` scanned as a reference; fix: count the snippet name as a binding plus a failing-first fixture.
  - `[low]` `[reject]` blind: `<script>` elements of any `type` scanned as TypeScript — no non-JS script in src/**; skipping types adds a branch for an unmet case.
  - `[low]` `[reject]` blind: shorthand `{history}` reported as "binding" — AGENTS.md pitfall forbids shorthand; message wording only, needs a new rule id.
  - `[low]` `[patch]` blind: pin test scans only ci.yml among workflows — fix: scan `.github/workflows/*.yml`.
  - `[low]` `[reject]` blind: build-icons.mjs header, AGENTS.md, spine tag, README prose unchecked — plan lists them as manual-update points; README prose records the rendering version, a fact not a pin.
  - `[low]` `[reject]` blind: gzip fixture margin only 5 bytes — a zlib change fails the precondition loudly (rule 6), never silently; unlikely on Node 24.
  - `[low]` `[reject]` blind: malformed hash bullets skipped silently — the set-equality assertion still fails loudly.
  - `[low]` `[reject]` blind: helper file name `dist-test.ts` — rename optional per review log; cosmetic.
  - `[low]` `[patch]` blind: buildRoot test title narrower than its assertions; unset `PW_PREVIEW` untested — fix: widen title, add the unset case.
  - `[low]` `[patch]` blind: vite.config.ts comment sits above the wrong option — fix: each reason beside its option.
  - `[low]` `[defer]` blind: AGENTS.md has no pointer to the hash test — fix edits an agent-context file; deferred to the next bmad-project-context audit.
  - `[false]` `[reject]` blind: plan logs empty — logs are filled by this step; fix would edit the plan.
  - `[low]` `[patch]` blind: delta-checks `pwa` row "it" ambiguous — fix: "the precache check".
  - `[maybe-false]` `[reject]` edge: an unknown Svelte node under an ESTREE key is treated as an expression — only on a Svelte upgrade adding node types; if true, low (scanner gap); guard adds complexity. Would settle: diff svelte AST types on upgrade.
  - `[maybe-false]` `[reject]` edge: rewritten binding text parsed with silent TS recovery — all fixtures parse; if true, low. Would settle: assert `parseDiagnostics` empty across fixtures.
  - `[low]` `[patch]` edge: pin test misses other workflows — grouped with the blind workflows finding.
  - `[low]` `[reject]` edge: existing CRLF clones keep CRLF after `-text` lands — every hashed file is `w/lf` in the owner's WSL clone; CI clones fresh; fails loudly.
  - `[low]` `[patch]` verification-gap: `<svelte:options>` attribute pass has no fixture (low: the pass works, only untested) — fix: add the fixture, shown failing with the loop removed.
  - `[low]` `[defer]` verification-gap: "unknown Svelte node" throw never exercised — needs a synthetic AST and exported internals; revisit on the next Svelte upgrade.
  - `[low]` `[defer]` intent: AGENTS.md managed block edited by hand, not through `bmad-project-context` — review-log minor (taken into the plan per the invocation) chose direct edit plus audit; running the skill edits agent context → deferred to the owner's audit.
  - `[false]` `[reject]` intent: over-budget proof padded the dictionary, not an entry-chunk import — the ticket's "e.g." is an example; `computeBudget` never reads `chunk.assets`, so an imported asset is not in the counted set; the dictionary is.
  - `[false]` `[reject]` intent: acceptance rests on plan claims / parser replaces the regex — named tests ran green in the parent's `npm run test:all`; the ticket asks confirmed gaps be fixed and the spine does not prescribe a regex.

## Design Notes

Unapplied review-log minors resolved: widened specs keep existing ids; over-budget proof pads the dictionary (computeBudget never reads `chunk.assets`); `.gitattributes` uses globs; new hashes never inside the Fraunces/OFL bullets; failure messages split input vs output; errata already exist; 1.1 review covers the exact-assertion change; header comments build-neutral with hook-free notes; precache comment on `globIgnores`; screens config scanned by the pin test, build-icons.mjs header and AGENTS.md/spine AD-17 tag are manual-update points on a Playwright bump; AGENTS.md managed lines edited and listed for audit; icon Chromium version recorded; gzip precondition asserted; woff2 hash once; a subagent runs the 1.1 review.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0, size-budget table printed, dist-smoke runs 4 spec files.
- `npm run test` -- expected: new `AD-16`/`AD-17`/`AD-18` script tests pass.
- `git status --short` after scratch proofs -- expected: only intended changes.

**Manual checks (if no CLI):**
- Ports 4173/5173 free before Playwright runs.

## Auto Run Result

**Summary:** `npm run test:all` now runs lint → check → unit → `build` (postbuild size budget) → `test:e2e:dist` → `test:e2e` → `test:e2e:pwa` (screenshots stay container-only). The precache, build-output and font specs also run under `dist-smoke` against `dist/` via `buildRoot()` (`PW_PREVIEW`). The precache holds exactly one entry per URL (10 entries, was 11). `@playwright/test` is pinned `1.63.0` and a test ties it to the lockfile and every container tag. `data/README.md` records SHA-256s of the woff2, icons, favicon and their generator inputs, checked by a new test. The size-budget CLI test pins gzip level 9. The 1.1 follow-up found 12+ markup `history`-binding gaps; the regex markup scan is replaced by `svelte/compiler` `parse` (test-only, loaded via `createRequire`, unit suite still ~1.5 s).

**Files changed:**
- `package.json`, `package-lock.json` — `test:all` order; exact Playwright pin.
- `vite.config.ts` — no `includeAssets`, `includeManifestIcons: false`, `globIgnores: ['manifest.webmanifest']`.
- `playwright.pwa.config.ts` — `dist-smoke` `testMatch` widened to four specs.
- `e2e/helpers/dist-test.ts` — `distTest()` → `buildRoot(repo?)` from `PW_PREVIEW`, missing-build error names its script.
- `e2e/helpers.spec.ts` — `AD-17` self-test of `buildRoot` errors.
- `e2e/pwa/precache.spec.ts`, `build-output.spec.ts`, `font.spec.ts` — build-neutral titles/comments, hook-free notes; one-entry-per-URL assertion.
- `scripts/playwright-pin.test.mjs` (new) — AD-17 pin test (package.json, screens config, every workflow).
- `scripts/asset-hashes.test.mjs` (new) — AD-18 font and AD-16 icon hash tests.
- `scripts/size-budget.test.mjs` — AD-18 gzip level 9 CLI test.
- `scripts/build-icons.mjs` — header names the hash test.
- `src/architecture.test.ts` — Svelte-parser markup scan plus 25 new AD-1 fixtures.
- `.gitattributes` — `-text` for hashed text files, PNGs `binary`.
- `data/README.md` — Build hashes and Icon sources.
- Docs: spine AD-17/AD-18, SPEC CAP-3, delta-checks, epic Decisions (dated amendments), build-notes CAP-5, methodology DoD, AGENTS.md managed-block lines 55–56 (for the next `bmad-project-context` audit).

**Review:** 22 findings (high 0, medium 1, low 16, false 3, maybe-false 2). Patched 6 entries (1 medium: snippet-name binding; 5 low: `<svelte:options>` fixture, all-workflows pin scan, buildRoot test title and unset case, vite.config.ts comments, delta-checks wording). Deferred 3 (low): AGENTS.md managed block hand-edited rather than via `bmad-project-context`; AGENTS.md pointer to the hash test; untested "unknown Svelte node" throw. Rejected: non-JS `<script>` types, shorthand message wording, extra manual-update points, 5-byte gzip margin, malformed hash bullets, helper file name, empty plan logs (false), unknown-node-under-ESTree-key and TS-recovery (maybe-false, low if true), CRLF in existing clones, dictionary-padding over-budget proof (false), plan-claims evidence (false). Reasons in the Review Triage Log.

**Follow-up review recommended:** false — patched: 0 high, 1 medium, 5 low.

**Verification:** `npm run test:all` exit 0 after patches — Biome 52 files clean; check clean; Vitest 342 passed (1.51 s); size budget `total 473036 / 600000`; dist-smoke 13 passed; e2e 34 passed / 24 skipped (android-only guards); pwa 12 passed. Scratch proofs recorded in Implementation Notes (each failed its named test, passed after revert; padded dictionary failed `npm run build` at 781,526 bytes).

**Residual risks:** a Svelte upgrade adding markup node types makes the AD-1 scan throw until `SVELTE_NODES` is updated (intended, fail-fast); on a Playwright bump the build-icons.mjs header, AGENTS.md and spine AD-17 tag need a hand update; the owner should run the `bmad-project-context` audit to take the AGENTS.md managed-block edits.
