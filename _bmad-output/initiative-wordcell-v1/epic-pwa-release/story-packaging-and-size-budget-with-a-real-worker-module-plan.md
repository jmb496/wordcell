---
title: 'Packaging and size budget with a real worker module'
type: 'feature'
ticket: '8'
created: '2026-10-31'
status: 'built'
baseline_revision: '0a61fc2d4ae7c812b94d8e2b4eb85c02975b9e03'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-packaging-and-size-budget-with-a-real-worker-module.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/build-notes.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Scaffold delta for entry 11 (CAP-9): `tsconfig.e2e.json` gains `allowJs: true` (ticket 7.8) so
      `e2e/pwa/build-output.spec.ts` imports `computeBudget` and `collectSizes` from
      `scripts/size-budget.mjs`; the spine's Scaffold deltas do not list it yet. Entry 10's sweep logs
      this row as handed to entry 11, which also syncs AD-18 Size (the unreachable-key failure and the
      content check) and build-notes line 23.
    evidence: |-
      Ticket 7.8 Consumers line; ARCHITECTURE-SPINE.md Scaffold deltas (package.json `check` names
      tsconfig.e2e.json, no compiler options listed); AD-18 Size lists only the 600,000 / font /
      dictionary failures.
    location: >-
      tsconfig.e2e.json
    severity: low
---

<intent-contract>

## Intent

**Problem:** `size-budget.mjs` silently counts everything when the `src/shell/sw.ts` key exists but no dynamic edge from the entry walk reaches it, and no build check proves `workbox-window` and `serviceWorker.register` really sit outside the counted set (SPEC CAP-6).

**Approach:** Add the unreachable-key gate as a fourth `errors` entry in `computeBudget`, export `collectSizes(dist)`, let the e2e TS project import the `.mjs` (`allowJs`), add an sw.ts static-closure helper beside `swChunkFile`, and add one `build-output.spec.ts` content case reading the real manifest; record the budget margin and the A3 re-check.

## Boundaries & Constraints

**Always:**
- Gate: after the main walk, `Object.hasOwn(manifest, SW_KEY) && !main.swDynamic` → push exactly `size-budget: manifest key src/shell/sw.ts is reached by no dynamic import from the entry` (review-log item 7: wording fits the unreached-importer case; SPEC does not fix the string) after the missing-dictionary push, before the 4 MB pushes. Not a throw: table and total still print, exit 1. Counting is unchanged (with no edge everything visited is still counted, review-log item 11).
- Keys the entry walk never visits (an orphan key, an unreached-importer subtree) are not validated: no `chunkOf` on them (review-log items 6).
- `size-budget.test.mjs` stays synthetic; no new CLI fixture: `AD-18 CLI passes, fails and throws per the fixture dist` already covers the generic `errors` → exit 1 path (item 10).
- Closure helper `swStaticClosureFiles(root = buildRoot())` in `e2e/helpers/dist-test.ts`: reads `.vite/manifest.json` like `swChunkFile`, starts at `src/shell/sw.ts`, follows `imports` only, visited set (the real sw.ts imports `index.html`, whose `dynamicImports` lists itself), returns one file per visited key (sw.ts's own first); throws naming the key (`… has no key <k>` / `… key <k> has no file`) on a missing key or a key without string `file` (rule 6).
- Content case reads only `rows` (never asserts `total` or `errors`: `dist-test/` has no postbuild; the total is checked by `npm run build`, item 5); every file read as `latin1`; asserts over whatever closure the manifest gives, never a fixed list; hook-free (file header).
- Test names start with the AD id; helper self-test named `AD-17 …`.

**Never:** a throw for the gate; validating unvisited keys; edits to the ticket file, the spine, SPEC or build-notes (entry 11 syncs them, SPEC wins); renaming or editing `AD-16 the build has no registerSW.js and registers a worker only from the sw.ts chunk`; editing `AD-18 a dangling src/shell/sw.ts key throws`; shipped-source (`src/`) or `vite.config.ts` changes; a real-build read in `size-budget.test.mjs`. An A3 item found open is a stop-and-report (rule 7: HALT blocked), not a fix here (item 12).

## I/O & Edge-Case Matrix

All synthetic (`size-budget.test.mjs`, `baseManifest()` + `sizesOf()`; base total 421,300).

| Scenario | Manifest | `errors` | rows / total |
|---|---|---|---|
| Orphan | `[SW_KEY]: { file: 'assets/sw-chunk.js', imports: ['_only-sw.js'] }`, `_only-sw.js` with file; no edge | `[UNREACHABLE_SW]` | no sw-chunk / only-sw file; total 421,300 |
| Orphan without file | `[SW_KEY]: { src: SW_KEY }` | `[UNREACHABLE_SW]` (no throw) | total 421,300 |
| Unreached importer | `[SW_KEY]` imports `_only-sw.js`, which lists `SW_KEY` in `dynamicImports`; nothing from the entry | `[UNREACHABLE_SW]` | no sw subtree files; total 421,300 |
| Static only (amended) | existing `_a.js` imports `SW_KEY` | `[UNREACHABLE_SW]` | sw-chunk, sw.css, x.js still counted |
| Static + dynamic | entry `dynamicImports: [SW_KEY]`, `_a.js` (entry `imports`) lists `SW_KEY` in `imports`; sw has css + `_x.js` | `[]` | sw-chunk, sw.css, x.js in rows |
| Ordered errors (amended) | existing over-budget case + orphan `SW_KEY` | over, font, dict, `UNREACHABLE_SW`, 4 MB a, z | — |
| No key, no edge | `baseManifest()` | `[]` (existing first case) | unchanged |
| Dangling edge | unchanged existing case | throws `SW_KEY` | — |

</intent-contract>

## Code Map

- `scripts/size-budget.mjs` -- `closure()` (:63) already returns `swDynamic` for the main walk (:98); push the gate error between :145 and :146. Header comment (:2-3) gains the failure. Private `collectSizes(dir, prefix, sizes)` (:166) → keep as an inner recursive helper, export `collectSizes(dist)` returning a new `Map<string, FileSize>`; `main()` (:197-198) uses it. JSDoc types (`// @ts-check`) must pass strict tsc once e2e imports it.
- `scripts/size-budget.test.mjs` -- add `UNREACHABLE_SW` constant beside `MISSING_DICT` (:22); amend :226 (rename `AD-18 over-budget, missing font, missing dictionary, unreachable sw.ts key and 4 MB files are reported in order`, add orphan `SW_KEY`) and :316 (rename `AD-18 sw.ts statically imported by a counted chunk is counted with its css and imports and fails as unreachable`, expect `[UNREACHABLE_SW]`, keep row asserts); new cases near :316: `AD-18 an orphan src/shell/sw.ts key fails as unreachable and is not counted`, `AD-18 an orphan src/shell/sw.ts key without file fails as unreachable without a throw`, `AD-18 sw.ts dynamically imported only from its own unreached subtree fails as unreachable`, `AD-18 sw.ts reached both statically and dynamically passes and is counted`.
- `tsconfig.e2e.json` -- add `"allowJs": true` under compilerOptions (no `checkJs`; `// @ts-check` in the `.mjs` still type-checks it).
- `e2e/helpers/dist-test.ts` -- `swChunkFile` (:27) is the pattern (manifest read, error prefix `${root}/.vite/manifest.json`, `root` param for the self-test); add `swStaticClosureFiles` after it.
- `e2e/helpers.spec.ts` -- `test.describe('swChunkFile', …)` (:1338) pattern (mkdtemp, write manifest, finally rm); add a `swStaticClosureFiles` describe after it: `AD-17 swStaticClosureFiles returns sw.ts's file and its imports closure once each and throws naming a missing or file-less key` covering a missing `src/shell/sw.ts` key, an imported missing key, a key without `file`, a two-hop closure (sw → a → b), and a two-chunk cycle (a ↔ b, each file once). Import it on :34.
- `e2e/pwa/build-output.spec.ts` -- runs under `pwa` and `dist-smoke`; add after the registerSW test (:67) `AD-18 the sw.ts chunk is a dynamic entry outside the counted rows and only uncounted sw.ts closure files carry the Workbox marker and serviceWorker.register`: `root = buildRoot()`; manifest from `.vite/manifest.json`; `{ rows } = computeBudget(manifest, collectSizes(root))`; `counted = rows.map(r => r.file)`; `sw = swChunkFile(root)` (proves `isDynamicEntry` and `file`); `expect(counted).not.toContain(sw)`; `closure = swStaticClosureFiles(root)`, `expect(closure).toContain(sw)`; `uncounted = closure.filter(f => !counted.includes(f))`; for each marker of `['messageSkipWaiting', 'serviceWorker.register']` on its own: no counted row's latin1 text contains it; some uncounted closure file contains it. Import from `'../../scripts/size-budget.mjs'`.
- Real manifest today (dist/, start commit): `index.html` entry (`dynamicImports: ['index.html', 'src/shell/sw.ts']`), `src/shell/sw.ts` (`isDynamicEntry`, `imports: ['index.html']`), font, dictionary; both markers only in `assets/sw-*.js`.
- Do not change: `vite.config.ts`, `playwright.pwa.config.ts`, any `src/` file.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/size-budget.mjs` -- gate push, header comment, exported `collectSizes(dist)` used by `main` -- CAP-6 gate, e2e access.
- [x] `scripts/size-budget.test.mjs` -- every I/O Matrix row: four new cases, two amended and renamed (items 8, 9: orphan and unreached-importer also assert no sw subtree files in rows and total 421,300) -- CAP-6 B row.
- [x] `tsconfig.e2e.json` -- `allowJs: true` -- the e2e spec imports the `.mjs`.
- [x] `e2e/helpers/dist-test.ts` -- `swStaticClosureFiles` -- content case closure (item 2).
- [x] `e2e/helpers.spec.ts` -- `AD-17` self-test of the helper (item 2 cases).
- [x] `e2e/pwa/build-output.spec.ts` -- the `AD-18` content case (items 1, 5).
- [x] This plan -- record budget and A3 re-check in Implementation Notes after `npm run build` on the changed tree.

**Acceptance Criteria:**
- Given the synthetic manifests, when `npm test` runs, then every `AD-18` case in `size-budget.test.mjs` (new and amended) passes with the exact `errors` arrays above.
- Given `dist-test/` and `dist/`, when `npm run test:e2e:pwa` and `npm run test:e2e:dist` run, then the `AD-18` content case passes under `pwa` and `dist-smoke`, and the unchanged `AD-16 … only from the sw.ts chunk` case still passes.
- Given the dev-server suite, when `npm run test:e2e` runs, then the `AD-17 swStaticClosureFiles …` self-test passes.
- Given the changed tree, when `npm run check` runs, then it is clean with `allowJs`; when `npm run build` runs, then postbuild prints `total N / 600000` with N ≤ 600,000 and exits 0.
- Given the full suite, when `npm run test:all` runs, then it exits 0.

## Implementation Notes

Review-log unapplied minors, resolved: (1) content case asserts `swChunkFile(root)` not in `rows` first — Code Map; (2) closure helper visited set and its four self-test cases — Always, Code Map; (3) no `workbox-window` comparison; the `allowJs` Scaffold delta is this plan's `deferred` row for entry 10 to log as handed to entry 11; (4) budget recorded on the changed tree against start commit `0a61fc2d4ae7c812b94d8e2b4eb85c02975b9e03`, below; (5) content case reads `rows` only — Always; (6) unvisited keys never validated — Always; (7) message `… reached by no dynamic import from the entry` adopted (technical default; SPEC fixes no string; the ticket's draft string is superseded here and entry 11 syncs AD-18 to it); (8) both amended cases renamed — Code Map; (9) orphan and unreached-importer cases assert rows and total — Tasks, Matrix; (10) no new CLI fixture — Always; (11) build-notes line 23 "with no edge it counts everything" stays true of counting; the gate adds a failure (entry 11 syncs) — Always; (12) open A3 item → HALT blocked — Never.

Budget at the start commit `0a61fc2d4ae7c812b94d8e2b4eb85c02975b9e03` (`npm run build`, 2026-10-31, before changes): total 560,701 / 600,000 (margin 39,299); −1 from entry 5's 560,702, spanning entries 6–8 (the hashed entry-chunk name carries the git SHA via `__APP_VERSION__`). This ticket changes no shipped source, so the end figure should match.

Budget on the changed tree (start commit `0a61fc2d4ae7c812b94d8e2b4eb85c02975b9e03` plus this ticket's changes, `npm run build` inside `npm run test:all`, 2026-10-31): total 560,701 / 600,000 (margin 39,299); unchanged from the start-commit figure, −1 from entry 5's recorded 560,702. Postbuild exited 0 with no errors, so the real manifest passes the new unreachable-key gate (`index.html` `dynamicImports` lists `src/shell/sw.ts`).

A3 re-check (F13, device-checks G28) at HEAD `0a61fc2`, all closed:
- Packaging specs in `dist-smoke`'s `testMatch` through `buildRoot()`: `playwright.pwa.config.ts:22-27` lists `dist-smoke.spec.ts`, `precache.spec.ts`, `build-output.spec.ts`, `font.spec.ts`; each reads the build through `e2e/helpers/dist-test.ts` `buildRoot()` (`precache.spec.ts:37`, `font.spec.ts:52`, `build-output.spec.ts` throughout). All ran under `[dist-smoke]` in this run.
- `vite.config.ts:24` `includeManifestIcons: false`; no `includeAssets` anywhere in `vite.config.ts` (grep).
- `e2e/pwa/precache.spec.ts:29` `AD-16 the precache manifest holds exactly one entry per URL, one per build file the globPatterns match` passed under both `[pwa]` and `[dist-smoke]`.

As built: `collectSizes(dist)` keeps the recursion as an inner `visit` closure. `swStaticClosureFiles` walks breadth-first, so sw.ts's own file comes first. The `AD-17 swStaticClosureFiles …` self-test runs under `android` and is skipped under `desktop`, the same as the neighbouring `AD-17 swChunkFile …` case. No deviations from the Code Map.

## Plan Change Log

## Review Triage Log

### 2026-10-31 — Review pass
- verdicts: 16 findings — high 0, medium 0, low 9, false 7, maybe-false 0
- findings:
  - `[low]` `[patch]` (blind) `swStaticClosureFiles` header comment justifies the visited set by `index.html`'s self-listed `dynamicImports`, which the `imports`-only walk never follows — comment now gives the real reason (shared imports, `imports` cycles such as a back-edge to sw.ts); no code change.
  - `[low]` `[reject]` (blind) self-test lacks the real manifest shape, a file-less sw.ts key and the error prefix — the file-less sw.ts key takes the same branch as the tested file-less `_a.js`; the real shape is exercised by the `AD-18` content case on both builds; the prefix is cosmetic.
  - `[false]` `[reject]` (blind) `swStaticClosureFiles` duplicates `size-budget.mjs`'s `closure()` and can drift — the ticket places the helper in `e2e/helpers/dist-test.ts`; an independent walk is what keeps the content case from checking `computeBudget` against itself; order and wording differences change no assertion (the case uses `includes`/`some`).
  - `[low]` `[reject]` (blind) the content case ignores `errors`, so the gate never runs on `dist-test/` — the intent excludes it (ticket review-log item 5: rows only, nothing on `total` or `errors`); the gate runs on `dist/` in postbuild, exit 0 this run.
  - `[low]` `[reject]` (blind) exported `collectSizes` has no direct test and no CLI fixture produces the new error — the intent excludes a new CLI fixture (item 10); `collectSizes` is pinned by the CLI pass case's exact stdout and by the content case.
  - `[low]` `[reject]` (blind) content case reads files once per marker and parses the manifest three times — a few MB of disk reads in a millisecond-scale test; caching adds code for no developer-visible cost.
  - `[low]` `[reject]` (blind) the negative marker check catches only the literal `serviceWorker.register` — the ticket names the literal markers; entry 1's `AD-16` registerSW test and the AD-16 source scan cover placement; broadening the pattern is new scope.
  - `[low]` `[reject]` (blind) `imports` trusted through a cast (a string would be spread per character) — Vite always writes arrays; `size-budget.mjs` trusts the same field; a guard adds a branch for an unseen input, and the result would still throw loudly.
  - `[low]` `[reject]` (edge) content case discards `errors` on `dist-test/` — same claim and reason as the blind `errors` row (intent item 5).
  - `[low]` `[reject]` (edge) a JSON `null` manifest value throws a bare TypeError — Vite never writes `null`; the throw is still loud (rule 6), only its message differs.
  - `[false]` `[reject]` (intent) error string longer than the ticket's literal, chosen without asking (rule 7) — SPEC CAP-6 and the spine fix no string; the invocation's item 7 offered this wording to resolve in the plan; recorded in Implementation Notes (7) for entry 11's AD-18 sync.
  - `[false]` `[reject]` (intent) the gate's failure path is tested only through `computeBudget`, not the CLI — the intent's item 10 settles the CLI path on the existing generic fixture; postbuild ran the passing path on the real build.
  - `[false]` `[reject]` (intent) "dynamic edge reaches" vs "dynamic entry" checked on different surfaces — the ticket accepts it (static-plus-dynamic passes, "the content case is its guard"); the content case asserts the sw chunk is not counted.
  - `[false]` `[reject]` (intent) under `pwa` the content case reads `dist-test/`, whose rows may differ from `dist/` — the ticket requires both projects; `dist-smoke` covers `dist/`; both passed.
  - `[false]` `[reject]` (intent) a marker stands in for workbox-window identity — the ticket's "e.g." marker and item 3 drop any package comparison.
  - `[false]` `[reject]` (intent) margin, A3 and `test:all` are plan claims only — re-run by the orchestrator after the patch: `npm run test:all` exit 0, `total 560701 / 600000`.

## Verification

Result (2026-10-31): `npm run test:all` exit 0. Unit 3737 passed (34 in `size-budget.test.mjs`); lint and check clean (`tsc -p tsconfig.e2e.json` clean with `allowJs`); build `total 560701 / 600000`; `test:e2e:dist` 28 passed, `test:e2e` 1153 passed, `test:e2e:pwa` 37 passed. The new `AD-18` content case passed under `[pwa]` and `[dist-smoke]`, as did the unchanged `AD-16 … only from the sw.ts chunk` case.

**Commands:**
- `npm test` -- expected: green, including the new `AD-18` cases.
- `npm run lint` and `npm run check` -- expected: clean.
- `npm run build` -- expected: `total N / 600000`, N ≤ 600,000, exit 0; record N and margin.
- `npm run test:all` -- expected: exit 0.

## Auto Run Result

**Summary:** `scripts/size-budget.mjs` now pushes `size-budget: manifest key src/shell/sw.ts is reached by no dynamic import from the entry` (after the missing-dictionary error, before the 4 MB errors; table and total still print, exit 1) when the `src/shell/sw.ts` key exists and the entry walk finds no `dynamicImports` edge to it (orphan, static-only, unreached importer); counting is unchanged and unvisited keys are not validated. `collectSizes(dist)` is exported; `tsconfig.e2e.json` gains `allowJs`; `swStaticClosureFiles(root)` beside `swChunkFile` returns the sw.ts `imports` closure files once each; a new `AD-18` build-output case shows on the real manifest (both `pwa` and `dist-smoke`) that the sw chunk is not a counted row and that `messageSkipWaiting` and `serviceWorker.register` each sit in no counted row and in an uncounted closure file. Budget 560,701 / 600,000 (margin 39,299) at start commit `0a61fc2d4ae7c812b94d8e2b4eb85c02975b9e03` and after the changes; A3 items all closed (Implementation Notes). All twelve review-log minors resolved in Implementation Notes.

**Files changed:**
- `scripts/size-budget.mjs` — unreachable-key gate, header comment, exported `collectSizes(dist)`.
- `scripts/size-budget.test.mjs` — four new `AD-18` cases, two amended and renamed.
- `tsconfig.e2e.json` — `allowJs: true`.
- `e2e/helpers/dist-test.ts` — `swStaticClosureFiles`.
- `e2e/helpers.spec.ts` — `AD-17 swStaticClosureFiles …` self-test.
- `e2e/pwa/build-output.spec.ts` — the `AD-18` manifest content case.

**Review findings:** 16 (high 0, medium 0, low 9, false 7). Patched 1 low (closure-helper comment reason). Deferred none from review (the plan's one `deferred` row, the `allowJs` Scaffold delta for entry 11, was recorded at planning). Rejected 15, reasons in the Review Triage Log: 7 false (helper duplication, error-string wording, CLI path, edge vs entry surfaces, `dist-test/` rows, marker as proxy, plan-only claims); 8 low (self-test gaps covered elsewhere, `errors` on `dist-test/` excluded by intent item 5 (two rows), no CLI fixture per item 10, double reads, literal marker spelling, unchecked `imports`, JSON `null`).

**Follow-up review recommendation:** `false` — first pass, patched high 0, medium 0, low 1.

**Verification:** after the patch, `npm run test:all` exit 0: lint and check clean (`tsc -p tsconfig.e2e.json` with `allowJs`); unit 3,737 passed; build `total 560701 / 600000`, postbuild exit 0; `test:e2e:dist` 28 passed; `test:e2e` 1,153 passed; `test:e2e:pwa` 37 passed; the `AD-18` content case passed under `[pwa]` and `[dist-smoke]`. Matrix audit: all 8 I/O rows covered by passing `size-budget.test.mjs` cases.

**Residual risks:** the gate's own CLI exit-1 path is covered only through the generic missing-dictionary fixture (intent item 10). Entry 11 must sync AD-18 Size (the unreachable-key failure with this wording and the content check), build-notes line 23 and the `tsconfig.e2e.json` `allowJs` Scaffold delta; the ticket's draft error string differs from the as-built one.
