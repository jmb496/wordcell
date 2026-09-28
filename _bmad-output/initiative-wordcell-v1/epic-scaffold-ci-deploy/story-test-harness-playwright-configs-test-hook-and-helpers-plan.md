---
title: 'Test harness: Playwright configs, test hook and helpers'
type: 'chore'
ticket: '3'
created: '2026-09-28'
status: done
route: 'full'
route_source: 'auto'
baseline_revision: '36a86583999ba4febe55732caaddca3f985c95d8'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-test-harness-playwright-configs-test-hook-and-helpers.md'
  - '{project-root}/AGENTS.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Production hook absence (runtime check and dist/ scan) runs only in test:e2e:dist, which test:all does not run.
    evidence: |-
      e2e/pwa/dist-smoke.spec.ts runs only via test:e2e:dist (package.json); playwright.config.ts ignores **/pwa/** and the pwa project ignores dist-smoke.spec.ts. The ticket keeps test:e2e:dist out of test:all (AD-17); entry 8's CI (build -> dist-smoke) closes the gap. Until then a widened gate would pass test:all.
    location: >-
      package.json test:all; e2e/pwa/dist-smoke.spec.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** Later epics need the AD-17 harness: a test build with a gated `window.__wordcell` hook, a `pwa`/`dist-smoke` Playwright config (D5), and the seed, touch and lifecycle helpers; none exist yet, and `test:all` lacks `test:e2e:pwa`.

**Approach:** Implement the ticket's Build choices exactly (they are the spec for every file, script text, helper signature, guard message and self-test case); this plan adds only the code map, task order and verification. Where this plan and the ticket differ, the ticket wins.

## Boundaries & Constraints

**Always:** Ticket "Build choices" verbatim (scripts' exact text, config fields, helper signatures/guards/messages, self-test cases (a)–(g), touch and lifecycle criteria). Test names start with `AD-17`, `AD-8` or `AD-18` as the ticket assigns. Rule 6: helpers throw, never fall back. e2e never imports from `src/`. Biome-clean, `npm run check` clean.

**Never:** Halt-condition workarounds (no `page.touchscreen`, mouse fallback, synthetic PointerEvent, added delays, loosened assertions, `define` tricks, console-error allow-lists). No `__wordcell` accessors (epics 3/7), no Session fixtures (epic 2), no `*.screens.spec.ts` committed, no `cross-env`, no `optimizeDeps.entries`. Do not edit AGENTS.md beyond the TODO line text the ticket gives. Do not push.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| PW_PREVIEW valid | `dist-test` / `dist` | only `pwa` / only `dist-smoke` project registered | — |
| Seed guards | `{}`; second call; after `goto` | reject with `no keys` / `already called` / `about:blank` (that order) | throw in async fn |
| Seed reload | seeded page reloaded | not re-seeded (`sessionStorage` flag) | — |
| Lifecycle guard | `showPage` when visible; 2nd `hidePage` | rejects via `page.evaluate` | throw |
| Precache manifest | `dist-test/sw.js` | exactly one `assets/en-*.txt` entry, `revision: null` | parse surprises throw (untested guard, ticket Deferred) |
| Production build | `dist/` | no `__wordcell` anywhere | halt if present |

</intent-contract>

## Code Map

- `package.json` -- scripts as in ticket Build choices; `check` gains `&& tsc -p tsconfig.e2e.json`; `test:all` gains `&& npm run test:e2e:pwa`. Existing `pre*` hooks use `node scripts/build-dictionary.mjs` (staleness-gated).
- `playwright.config.ts` -- add `testIgnore: ['**/*.screens.spec.ts', '**/pwa/**']`; leave the rest. Its `fullyParallel/forbidOnly/retries/reporter/use.trace` are copied into the pwa config.
- `playwright.pwa.config.ts` (new) -- D5 per ticket; `webServer` `npx vite preview --outDir <PW_PREVIEW> --port 4173 --strictPort`.
- `.gitignore` -- has `dist` (name match only; does not cover `dist-test`); add `dist-test/`.
- `tsconfig.json` -- add reference `./tsconfig.e2e.json`. `tsconfig.e2e.json` (new) per ticket; copy linting flags from `tsconfig.node.json` (`noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`).
- `src/main.ts` -- imports `svelte`, `./engine/index`, then `./shell/dictionary.svelte` side-effect; add `import './shell/test-hook';` as first side-effect import.
- `src/shell/test-hook.ts` (new) -- gated frozen `{}`; `declare global` Window augmentation; `export {}`. Shell layer: may use browser APIs; must pass `src/architecture.test.ts` scan (no `history` bindings, no storage).
- `e2e/globals.d.ts`, `e2e/helpers/{seed,touch,lifecycle,precache}.ts`, `e2e/helpers.spec.ts`, `e2e/test-hook.spec.ts`, `e2e/pwa/{precache,test-hook,dist-smoke}.spec.ts` (new) -- per ticket.
- `e2e/smoke.spec.ts` -- existing `AD-17` placeholder test (heading `WordCell`, 52 `card-<n>`); reference for dist-smoke's load + card checks; do not change.
- `biome.json` -- `files.includes` already covers `e2e/**` and root `*.ts`/`*.json`.
- `AGENTS.md` Running and verifying `TODO(epic 1)` line -- replace with the ticket's resulting text.
- Continuity (ticket 2): the dictionary is emitted as `dist/assets/en-<hash>.txt` and appears in `dist/sw.js`'s precache list; on /mnt/d, Vite does not stop on `timeout -s INT` without a TTY, so let Playwright own servers and check ports 5173/4173 free before runs.

## Tasks & Acceptance

**Execution:**
- [x] `.gitignore`, `package.json`, `tsconfig.json`, `tsconfig.e2e.json` -- scripts, ignore, e2e type-check -- AD-17 Scripts, D5.
- [x] `src/shell/test-hook.ts`, `src/main.ts` -- gated hook -- AD-17 Reading state (empty for now).
- [x] `playwright.config.ts`, `playwright.pwa.config.ts` -- testIgnore; D5 config -- AD-17 Projects.
- [x] `e2e/globals.d.ts`, `e2e/helpers/seed.ts`, `e2e/helpers/touch.ts`, `e2e/helpers/lifecycle.ts`, `e2e/helpers/precache.ts` -- helpers with guards -- AD-17 Seeding / Touch / Time and hide, AD-8.
- [x] `e2e/helpers.spec.ts` -- seed (a)–(g), touch (2), lifecycle self-tests, android-only skip -- AD-17.
- [x] `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts`, `e2e/pwa/precache.spec.ts`, `e2e/pwa/dist-smoke.spec.ts` -- hook presence/absence, precache `revision: null`, dist-smoke load/52 cards/no errors/dist scan -- AD-17, AD-8, AD-18.
- [x] `AGENTS.md` -- TODO line to the ticket's resulting text.
- [x] Plan `## Implementation Notes` -- record evidence (below) and the AD-17 sentence → test mapping with the ticket's Deferred list as exempt/deferred; Handoff items from the ticket.

**Acceptance Criteria:**
- Given a clean tree, when `npm run test:all` runs, then lint, check, unit, `test:e2e` (android + desktop incl. helper self-tests and dev hook test) and `test:e2e:pwa` (hook present, precache `assets/en-*.txt` `revision: null`) all pass.
- Given `npm run build && npm run test:e2e:dist`, then dist-smoke passes and `grep -r __wordcell dist/` is empty.
- Given `rm -rf generated dist-test && npm run build:test`, then `dist-test/` is written; `git check-ignore dist-test/x` succeeds.
- Given a scratch `e2e/scratch.screens.spec.ts`, when `npx playwright test --list`, then it and every `e2e/pwa/` spec are omitted and `smoke`, `test-hook`, `helpers` specs are listed (scratch deleted after).
- Given `PW_PREVIEW=dist-test|dist|''|bogus|unset` with `--list -c playwright.pwa.config.ts`, then the matching project's specs only, or non-zero exit naming `PW_PREVIEW`.
- Given `import './shell/dictionary.svelte';` temporarily removed, when `npm run test:e2e:pwa`, then only the `AD-8` case fails (0 entries, expected 1); import restored.
- Given a scratch type error in `e2e/helpers/seed.ts`, then `npm run check` fails; reverted.

## Implementation Notes

**Evidence (2026-09-28, WSL2, ports 5173/4173 confirmed free before each Playwright run):**
- `npm run test:all`: lint, check (incl. `tsc -p tsconfig.e2e.json`), unit, `test:e2e` (27 passed, 23 skipped = helper self-tests off `android`), `test:e2e:pwa` (2 passed: `AD-8` precache, `AD-17` hook) all green. No Halt condition hit: CDP touch on Pixel 7 gave `touch` pointerdown/moves/up within 1 CSS px, no pointercancel; longPress held ≥ 599 ms.
- `npm run build && npm run test:e2e:dist`: 2 passed (`AD-18` load/52 cards/no errors/no hook; `AD-18` dist scan). No console error from the icons/`registerSW.js`/`sw.js` (third Halt bullet did not trigger).
- `grep -r __wordcell dist/`: empty. `grep -c __wordcell dist-test/assets/*.js`: 1.
- `rm -rf generated dist-test && npm run build:test`: regenerates the dictionary (172713 words) and writes `dist-test/` with `sw.js`. `git check-ignore dist-test/x` prints `dist-test/x`.
- `npx playwright test --list` with a scratch `e2e/scratch.screens.spec.ts`: lists only `helpers.spec.ts`, `smoke.spec.ts`, `test-hook.spec.ts`; scratch and all `e2e/pwa/` specs omitted; scratch deleted.
- `-c playwright.pwa.config.ts --list`: `PW_PREVIEW=dist-test` → `[pwa]` precache + test-hook only; `dist` → `[dist-smoke]` dist-smoke.spec.ts only; empty, `bogus`, unset → exit 1 with `PW_PREVIEW must be exactly 'dist' or 'dist-test' (got …)`; `PW_PREVIEW=dist --project pwa` → exit 1.
- Deferred 1.2 guard: with `import './shell/dictionary.svelte';` removed, `npm run test:e2e:pwa` failed only `AD-8 …` (Expected length 1, Received 0); `AD-17` hook passed; import restored.
- Scratch type error appended to `e2e/helpers/seed.ts` → `npm run check` exit 2 (TS2322); reverted.
- Biome reordered nothing in `src/main.ts`; `import './shell/test-hook';` sits after the engine import, before the dictionary stub.

**AD-17 sentence → test mapping:**
- Scripts / Projects (`build:test`, `test:e2e:pwa`, `test:e2e:dist`, `test:all`, `pwa` / `dist-smoke` via `PW_PREVIEW`, D5) → evidence above (config, not a test).
- Reading state: hook present under dev → `e2e/test-hook.spec.ts` `AD-17 test hook is present under the dev server…` (android + desktop); in the test build → `e2e/pwa/test-hook.spec.ts` `AD-17 …`; absent in production → `e2e/pwa/dist-smoke.spec.ts` `AD-18 production build loads…` + `AD-18 no file in dist/ contains __wordcell`.
- Seeding (`seedStorage`, `captureBoot`, no re-seed on reload, kill variant's new page not seeded, call rules) → `e2e/helpers.spec.ts` seed cases (a)–(g) plus `AD-17 seedStorage with captureBoot records live values after reload` (18 `AD-17 …` tests); validation before tracking → `AD-17 seedStorage that fails validation does not track the page`; guard check order → `AD-17 seedStorage checks no keys before already called`, `AD-17 seedStorage checks already called before about:blank`, `AD-17 captureBoot checks already called before about:blank`.
- Touch (CDP touch, `touchDrag`, `longPress`) → `AD-17 touchDrag …`, `AD-17 longPress …`.
- Time and hide (`hidePage`/`showPage`/`pageHide`/`pageShow`) → `AD-17 hidePage / showPage …`, `AD-17 pageHide / pageShow … while visible|hidden`.
- AD-8 precache half (`?url` row) → `e2e/pwa/precache.spec.ts` `AD-8 …`.
- Exempt/deferred (ticket Deferred list, verbatim scope): `hidePage` exactly-one-`wordcell:session`-write / gesture cancel / resume; restore boundaries; `Page.crash` kill variant with a real Session; `loaded()`/`current()`/`dictionaryState()` (epic 3); `swState()`/`precacheComplete()` and offline test (epic 7); valid Session fixtures (epic 2); font precache half (entry 4); `playwright.screens.config.ts` / `test:screens` / Screenshots (entry 7); "CI runs all of them" (entry 8); `page.clock` / R-76 Time (epic 3); "desktop tests use `page.mouse`" (first desktop-only UI ticket); boot-order half of the one-download proof (epics 3, 7); untested guards (complete list): `readPrecacheManifest` throws, `touchDrag` `steps` / `from` equals `to`, `longPress` `ms`, touch viewport-set / finite-and-inside / `maxTouchPoints > 0`; Split and Speed (process, AGENTS.md); AD-18 "no fatal surface" (epic 3; the no-error assertion stands in).

**Implementation choices within the ticket:** lifecycle recorder records both the listener (`window`/`document`) and the event target, so the `visibilitychange` case asserts one document-listener and one window-listener record per call, both with `target: 'document'`. The `pageHide`/`pageShow` "runs twice" is two generated tests (visible, hidden).
Extra seed test beyond cases (a)–(g): `AD-17 seedStorage with captureBoot records live values after reload` writes `'b'` after the seeded load and expects `'b'` in `__wordcellBoot` after reload, proving the combined script captures live storage on every load rather than echoing the seed and that reload does not re-seed; case (c) stays as the ticket words it.

**Handoff:**
- Entries 4 and 5 extend `e2e/pwa/precache.spec.ts` via `readPrecacheManifest` (`e2e/helpers/precache.ts`).
- Entry 8's CI calls `test:e2e:dist` (after `npm run build`) and the `pwa` project; copied CI `retries` can mask flaky pwa / dist-smoke / touch failures, so entry 8 reports flaky retries. CI checkout path must not contain a `pwa` segment (`testIgnore` `'**/pwa/**'` matches absolute paths).
- The ticket replacing the placeholder `WordCell` heading updates the `AD-18` dist-smoke load criterion (and both test-hook specs, which wait on it) in the same change.
- The helper self-tests' direct `page.evaluate` writes to `wordcell:*` are a scoped exception to the `seedStorage`-only convention, not a pattern for flow specs.
- Owner (gate 4) to route: AGENTS.md `e2e/<flow>.spec.ts` naming drift (`e2e/pwa/*.spec.ts`, `e2e/test-hook.spec.ts`, `e2e/helpers.spec.ts` are not flows) to the D8 audit or a later AGENTS.md refresh.
- The ticket introducing boot-time `wordcell:*` reads/writes (AD-16 load step) reworks seed self-tests (a)–(e): raw strings become `fixtures/*.json` values; assertions allow for the store's own write.
- Epic 3's `__wordcell` accessors update `src/shell/test-hook.ts` and `e2e/globals.d.ts` together.

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 28 findings — high 0, medium 0, low 16, false 12, maybe-false 0
- findings:
  - `[false]` `[reject]` Blind: AGENTS.md managed block edited by hand — SPEC D8 (owner-accepted) has each ticket drop its own TODO(epic 1) items in its diff; the post-epic `bmad-project-context` audit refreshes the block.
  - `[low]` `[reject]` Blind: touch helpers send no `touchCancel` when a CDP send or the wait rejects — only reachable when the test is already failing on a per-test fresh page; fix adds a catch branch.
  - `[low]` `[reject]` Blind: touch self-tests do not assert exactly one pointerdown/pointerup or one pointerId — the helpers visibly send one start/end; the ticket fixes the halt criteria and they are not to be altered.
  - `[low]` `[reject]` Blind: dist-smoke checks count 52 but not ids 0–51 — ticket's criterion is 52 live `card-<CardId>`; `e2e/smoke.spec.ts` asserts the full set from the same component; a prod-only id difference is implausible.
  - `[false]` `[reject]` Blind: `VITE_TEST_HOOKS` untyped, a typo silently drops the hook — `e2e/pwa/test-hook.spec.ts` (in test:all) fails if the hook is absent from dist-test, so the typo is caught.
  - `[low]` `[reject]` Blind: storage key names / `__wordcell` type duplicated — the ticket prescribes both declarations, literal keys inside the init script and e2e never importing src; handoff records the paired update.
  - `[low]` `[reject]` Blind: the two test-hook specs are copy-pasted — the ticket prescribes two 13-line specs; cosmetic.
  - `[low]` `[reject]` Blind: desktop sets up pages for skipped helper tests — the ticket prescribes the beforeEach skip; cost is milliseconds.
  - `[low]` `[reject]` Blind: `runInNewContext` has no timeout — input is our own build's bracket-balanced JSON-like array; a hang is implausible.
  - `[low]` `[reject]` Blind: test:e2e:dist can read a stale dist/ — specified by the ticket (recorded run is `npm run build && npm run test:e2e:dist`; CI builds first per AD-18).
  - `[low]` `[reject]` Edge: touchDrag leaves a touch down on a failed send — same as the Blind touchCancel row.
  - `[low]` `[reject]` Edge: longPress leaves a touch down on a rejected wait — same as the Blind touchCancel row.
  - `[false]` `[reject]` Edge: init script runs in child frames — the app has no iframes; no frame is ever created.
  - `[low]` `[reject]` Edge: `addInitScript` rejecting after tracking blocks a retry — only when the page is closed; the ticket requires tracking after validation, which the code does.
  - `[false]` `[reject]` Edge: template literal with `${` mis-slices the manifest — Workbox emits a JSON-like manifest; any mis-slice makes `runInNewContext` or the entry checks throw loudly (rule 6).
  - `[low]` `[reject]` Edge: `__wordcell` declarations can drift — the ticket forbids e2e importing src and records the paired update in the handoff.
  - `[false]` `[reject]` Edge: scripts fail under Windows cmd — the ticket assumes a POSIX shell (WSL2, CI), no cross-env.
  - `[false]` `[reject]` Edge: backslash separators on Windows — Playwright runs only on WSL2/Linux CI.
  - `[false]` `[reject]` Edge: IDE loading the pwa config without `PW_PREVIEW` breaks — throwing is specified (D5).
  - `[low]` `[defer]` VerifGap: production hook absence is not in test:all — pre-verified; the ticket keeps test:e2e:dist out of test:all (AD-17); entry 8's CI closes it; added to `deferred`.
  - `[low]` `[defer]` Intent: dist-only checks (hook absence, dist scan) live off test:all — same root cause as the VerifGap row; deferred with it.
  - `[false]` `[reject]` Intent: precache check reads dist-test/sw.js, not dist/ — epic decision (owner, 2026-09-27): build-output checks live in e2e/pwa against dist-test so test:all runs them; the hook flag does not change the precache list.
  - `[false]` `[reject]` Intent: test:all now builds dist-test and needs port 4173 — AD-17 Scripts define test:all this way.
  - `[false]` `[reject]` Intent: hook is an empty stub with no accessors — accessors are deferred to epics 3/7 by the ticket.
  - `[false]` `[reject]` Intent: helper self-tests are event-level, not app-level — the ticket prescribes the probe and recorders; app flows arrive with the app.
  - `[false]` `[reject]` Intent: seedStorage uses raw strings, not fixtures — the ticket defers Session fixtures to epic 2.
  - `[low]` `[reject]` Intent: dist-smoke does not check ids 0–51 or data-place — same as the Blind dist-smoke row.
  - `[low]` `[reject]` Intent: `'**/pwa/**'` testIgnore depends on the checkout path — the ticket documents it and hands it to entry 8 (handoff).

## Design Notes

- Precache parse: find the single `precacheAndRoute(`, skip whitespace, require `[`, scan to the matching `]` tracking depth and skipping quoted/backtick strings with `\` escapes, then `vm.runInNewContext('(' + slice + ')')`.
- Seed init script receives `{ values, captureBoot }` as its serialized arg; key names are literals inside the function body.
- `PW_PREVIEW` unset/empty/bogus throwing is `--list` evidence (Acceptance), not a test case.
- Touch: CDP `Input.dispatchTouchEvent` coordinates are CSS pixels relative to the viewport; `touchEnd` with `touchPoints: []`.

## Verification

**Commands** (confirm ports 5173 and 4173 free before each Playwright run):
- `npm run test:all` -- expected: green.
- `npm run build && npm run test:e2e:dist` -- expected: green.
- `grep -r __wordcell dist/` -- expected: no output.
- `git check-ignore dist-test/x` -- expected: prints the path.
- the `--list` checks and the two scratch/removal checks in Acceptance -- expected as stated.

## Auto Run Result

**Summary:** Built the AD-17 harness per ticket 1.3: `testIgnore` in the default config, `playwright.pwa.config.ts` (D5, `PW_PREVIEW`), `build:test`/`prebuild:test`/`test:e2e:pwa`/`test:e2e:dist` and the AD-17 `test:all`, `dist-test/` ignored, gated `window.__wordcell` hook, seed/touch/lifecycle/precache helpers with `AD-17` self-tests, `AD-8` precache check and `AD-18` dist-smoke cases, e2e type-check. No Halt condition triggered (CDP touch under Pixel 7 works).

**Files changed:**
- `.gitignore` -- `dist-test/`.
- `package.json` -- new scripts; `check` adds `tsc -p tsconfig.e2e.json`; `test:all` adds `test:e2e:pwa`.
- `tsconfig.json`, `tsconfig.e2e.json` -- e2e type-check project.
- `playwright.config.ts` -- `testIgnore`.
- `playwright.pwa.config.ts` -- `pwa` / `dist-smoke` chosen by `PW_PREVIEW`.
- `src/shell/test-hook.ts`, `src/main.ts` -- gated frozen hook, imported first among side effects.
- `e2e/globals.d.ts`, `e2e/helpers/{seed,touch,lifecycle,precache}.ts` -- helpers.
- `e2e/helpers.spec.ts`, `e2e/test-hook.spec.ts`, `e2e/pwa/{precache,test-hook,dist-smoke}.spec.ts` -- tests.
- `AGENTS.md` -- TODO(epic 1) line trimmed to `test:screens` / `playwright.screens.config.ts` (D8).

**Review:** 28 findings (0 high, 0 medium, 16 low, 12 false). Patches applied: 0. Deferred: 1 (production hook-absence check off test:all; closed by entry 8's CI). Rejected: 26, each with its reason in the Review Triage Log.

**Follow-up review recommended:** false (no patched entries).

**Verification (orchestrator re-run, 2026-09-28):** ports 5173/4173 free; `npm run test:all` exit 0 (pwa: 2 passed); `npm run build && npm run test:e2e:dist` 2 passed; `grep -r __wordcell dist/` empty; `git check-ignore dist-test/x` → `dist-test/x`; default `--list` shows 50 tests in 3 files (helpers, smoke, test-hook). Implementer evidence for the scratch/removal checks is under Implementation Notes.

**Residual risks:** `readPrecacheManifest` depends on vite-plugin-pwa `generateSW` output shape (throws on change); `'**/pwa/**'` testIgnore breaks under a checkout path with a `pwa` segment (entry 8); CI `retries` can mask flaky touch/pwa runs (entry 8); owner to route the `e2e/<flow>.spec.ts` naming drift (gate 4).
