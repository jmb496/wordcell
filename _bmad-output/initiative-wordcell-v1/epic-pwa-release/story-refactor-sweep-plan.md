---
title: 'Refactor sweep'
type: 'refactor'
ticket: '10'
created: '2026-10-31'
status: 'in-review'
baseline_revision: '575fdf70757c7db2f88f4c44745ac860fb509aa9'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-refactor-sweep.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-refactor-sweep.review-log.md'
warnings: ['oversized']
deferred:
  - summary: >-
      One unexplained failure of the changed D-16 test `AD-17 the update spec activation poll fails at once when B turns redundant` (e2e/pwa/update.spec.ts) on the first single run against a fresh dist-test/; message lost; 18 later runs passed.
    evidence: |-
      Implementation Notes T5. Unverified: a reproduction count (e.g. `--repeat-each=30` on pwa against a fresh build:test) or a recurrence in the final test:all pwa run would settle whether T5 introduced a flake.
    location: >-
      e2e/pwa/update.spec.ts redundant self-test
    severity: medium (unverified)
---

<intent-contract>

## Intent

**Problem:** Epic 7's nine built tickets left deferred findings (plan `deferred`, residual risks, defer/gap-naming reject rows, review-loop unapplied minors, digest open items) spread across their artifacts. G9 (4.6's untested `main.ts` controller-registration order) is still open, and the AD-17 Speed and AD-18 budgets have not been re-measured since the worker landed.

**Approach:** Give every finding one row in the table below with a disposition (ticket 7.10 Scope item 2). Make the "fixed here" fixes inside item 3's edit boundary, each proven per item 5. Add the G9 source-order pin. Then, at the sweep commit, run item 6's counted flake runs, item 7's budgets on a Linux-filesystem clone, `npm run test:all` and `npm run test:screens`, and record each result here.

## Boundaries & Constraints

**Always:**
- Edit only item 3's editable set:
  - `*.test.ts` and `*.test.mjs` (never `src/engine/deal.test.ts`)
  - the `src/architecture-*` files
  - `e2e/**`; a new or changed helper gets an `e2e/helpers.spec.ts` case
  - `scripts/device-preview.mjs`
  - `docs/device-testing.md`
  - code comments anywhere
  - this plan
- Each new or tightened test passes at HEAD and fails on its named mutation. Revert every mutation and record the observed failure in Implementation Notes.
- Each new or changed e2e test passes `--repeat-each=5` on each project that runs it. For a changed shared helper, its `helpers.spec.ts` case and the changed tests repeat ×5.
- Test names follow AGENTS.md: shell/UI/e2e-helper tests use AD-n; tests citing Q-/R-ids keep the existing naming in their file.

**Never:**
- Edit `src/` non-comment code, `vite.config.ts`, `package.json`, the lockfile, Playwright config timeouts, retries or workers, size-budget limits or gate conditions.
- Edit specs, spec companions (`rule-coverage.md`, `device-checks.md`, `build-notes.md`, `release-checklist.md`), the spine, EXPERIENCE.md, DESIGN.md, AGENTS.md, tickets.toml, the epic file, or any done ticket's file, plan or log.
- Loosen any gate or assertion.
- Change `fixtures/`, `SESSION_VERSION` or `HISTORY_VERSION`.
- Push.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| G9 pin holds | `src/main.ts` at HEAD | new `AD-12 AD-13 AD-16 src/main.ts …` test passes | — |
| G9 order broken | any G9 mutation (Design Notes) | the pin fails, naming the needle | — |
| Halted then F17 | pwa: halt, then the `sw.ts` chunk 404s | alertdialog body becomes `Q-40 F17 the sw.ts chunk did not load`; `swState()` `failed`; no persistence call | restoring `&& !halted()` at `src/main.ts:276` fails it |
| Rejected `persisted()` | dev: `StorageManager.prototype.persisted` rejects | AD-15 halt with that message | a `.catch(()=>{})` on `requestPersistence()` fails it |
| Preview port wait times out | `run()` with a fake `waitForPort` that rejects | `run` rejects with the same error; preview `kill` called once | — |
| A final `test:all` fails only on item 6 rows' tests | — | one `npm run test:all` rerun at the same commit; both results go on the item 6 rows | a failing rerun, or any other failure, stops the build and is reported |

</intent-contract>

## Code Map

- `src/main.ts:141-292` -- `boot()`, read-only. Halted return :159-162 (`if (game.state.kind === 'halted') {` … `return;`), `createGate(` :170, `startTracker(` :195, `createController(gate` :205, hide registrations :218-219, `nav.registerBeforeBack(` :233 with `controller.cancel({ byBack: true })` :234, `setController(controller)` :250, `game.registerLifecycle()` :252, `mount(App` :256, F17 catch :274-279.
- `src/architecture-tree-scan.test.ts:38` -- existing AD-14 order pin (needle/`at()` style); :54 the F17 pin. The G9 and D-23 pins go beside them.
- `src/architecture-ad1.test.ts:865-899` (skip-waiting fixtures), `:927-1001` (navigator-storage fixtures); `src/architecture-scan.ts:555` (`storageCheck`), `:585-620` (shell/svelte branches).
- `src/shell/sw.test.ts:91` -- gate-off stub `''`; `src/shell/sw.ts:19` the `=== '1'` gate.
- `e2e/pwa/sw-failure.spec.ts:20-34` -- `chunkUrl`, `macrotask`, `expectFatal`; icon hold :55-110 (deadline :70, timer :97-106); F17 case :112. `src/shell/sw.ts:20,39,75` and `src/main.ts:277` give the halt messages. `src/ui/Halted.svelte` re-renders `game.haltText`, so a later fatal replaces the body.
- `e2e/pwa/dist-smoke.spec.ts:406-466` -- icon hold (deadline :428, timer :456-466); offline final checks :324; F17 :494.
- `e2e/pwa/boot-order.spec.ts:42-72` -- first-launch test; chunk-time `dictionaryState` read :55; halt pattern `halt()` :20; held-chunk case :134. `e2e/helpers/boot-calls.ts` -- `recordBootCalls`, `holdRegister`.
- `src/shell/dictionary.svelte.ts:47-62` -- `state` flips to `ready` synchronously once `response.text()` resolves.
- `e2e/pwa/update.spec.ts` -- `holdWaiting` :117 (the throw on `active`), `withSite` :322-336, redundant self-test :428-441, SKIP_WAITING self-test :454-487.
- `e2e/pwa/test-hook.spec.ts:69-72` -- not-halted check before the last poll settles. `src/shell/test-hook.ts:43,46` (`precacheAndRoute` literal), `:127-135` (recompute write), `:159` (the only `recomputePrecacheComplete()` call).
- `e2e/helpers.spec.ts:1969` -- `precacheMissing` case at `/` (probe-route pattern at :1400); `e2e/helpers/precache.ts:71` `new URL(url, sw)`. "offline helpers" cases; `e2e/helpers/offline.ts:20,45,48,56,59` guards.
- `e2e/pwa/offline.spec.ts:139` -- final `expectNoPrompt` (assumption comment).
- `scripts/device-preview.mjs` -- `main()` :137-209, port probe comment :148, `rmSync` :156, spawn :167, signals :183-184, `waitForPort` :186/:240, the `main()` call :243. `scripts/device-preview.test.mjs:4` imports only the pure helpers.
- `docs/device-testing.md:60-61` (clear site data step 2), `:135-136` (spoiled-read redo).
- `_bmad-output/initiative-wordcell-v1/epic-pwa-release/tickets.toml` entry 11 (read-only), `_bmad-output/specs/spec-epic-7-pwa-release/SPEC.md:73-75` CAP-9 (read-only) -- cites for entry-11 rows.

## Deferred-findings table (Scope item 1)

`baseline_revision` = 575fdf70757c7db2f88f4c44745ac860fb509aa9, the build start commit; the tree was clean, so the files on disk were the baseline. Column 4 is one column: live at `baseline_revision`, then the evidence. Paths: plans are `<story>-plan.md` beside this file; `7-n-build.md` is `_bmad-output/implementation-artifacts/review-loop/7-n-build.md`; "digest" is `_bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md`. Dispositions: **fixed** (this build, item 5's pass recorded in Implementation Notes), **closed by**, **declined**, **fix ticket**, **errata** (declined group: done-plan text), **entry 11** (named by a cited clause), **amend** (entry-11 amendment group below). No row needed **owner call** (functionality or UX only): owner-call rows: none.

### Searches and counts per source

- **Plans 7.1–7.9.** `grep -nE "deferred:|Deferred coverage|Residual risks|\[defer\]|\[reject\]|\`defer\`|\`reject\`"`. Reject rows count only when their reason names a refactor or test gap, judged by reading each row; a tag grep alone is not the filter (log pass 5 minor).
  - 7.1: 1 deferred, Deferred coverage :101, 2 defer, 7 gap-naming rejects, Residual :191.
  - 7.2: 1 deferred, 3 defer, 5 rejects, Residual :187.
  - 7.3: `deferred: []`, 0 defer, 7 gap rejects, Residual :147, :255-263.
  - 7.4: `deferred: []`, 2 gap rejects (:91, :93), Residual :147.
  - 7.5: 2 deferred, 4 defer, 6 gap rejects, Residual :183.
  - 7.6: `deferred: []`, 7 gap rejects, Residual :214-216.
  - 7.7: `deferred: []`, 1 refactor reject (:96), Residual :138.
  - 7.8: 1 deferred (:20-32), Residual :168.
  - 7.9: 2 deferred (:22, :29), 4 defer rows (duplicates), Residual :204-205.
- **7-n-build.md `## Result`.** `sed -n '/^## Result/,$p'`.
  - 7-1: 4 minors.
  - 7-2: 2 minors.
  - 7-3: 6 minors.
  - 7-4: 3 (Pass 1 minors :23-25).
  - 7-5: 1.
  - 7-6: none ("Unapplied minors: none", :24).
  - 7-7: 2.
  - 7-8: none (:42).
  - 7-9: 6 (:50-55).
  - Open majors: 0 in all.
- **Ticket review logs `## Result`.** `grep -n '^## Result'`, each item checked against its plan's resolution list.
  - 7.1–7.7: none open.
  - 7.8: :87, :91 and :95 handed to entry 11 (merged into D-48, D-49 and D-50).
  - 7.9: :120, :123 and :129 merged into D-58, D-59 and D-53.
- **Digest.** `grep -n "Worth knowing\|Close-out"`. Every open item is merged into a row below. Every "Close-out docs" line reads "none".

### Rows

| id | source | finding | live at baseline | disposition |
|---|---|---|---|---|
| D-01 | 7.1 plan :22, :134, :140, :191; digest :18 s2 | AD-16 boot order not pinned | no: `e2e/pwa/boot-order.spec.ts:42` | closed by 1259a50 |
| D-02 | 7.1 plan :101 s1, :191 | the two F4 `halted()` returns in the boot tail are untested | no: boot-order.spec.ts:109, :134 | closed by 1259a50 |
| D-03 | 7.1 plan :101, :114-115, :119, :125-128, :191; 7.1 log :102; digest :18 s1 | before entry 2: rejected `register()`, absent `navigator.serviceWorker`, redundant install and `undefined` registration untested or unhandled; sticky `failed` and second update untested | no: `src/shell/sw.ts:30,38,42,75`; sw.test.ts:319, :370, :407; sw-failure.spec.ts:36, :55 | closed by e340aee (runtime part bdf477e) |
| D-04 | 7-1-build.md:23 (minor 1); 7.1 log :100; digest :18 s3 | F17 `&& !halted()` guard | code clause no: `src/main.ts:276` | code clause: closed by e340aee (code) and 326edb4 (pin, src/architecture-tree-scan.test.ts:54). Clause "the plan's mentions of the guard" (7.1 plan :61, :99, :101, :116, :136, :160; also `src/main.ts:273` in 7.2 plan :26 and digest :18, now :276): errata |
| D-05 | 7-1-build.md:24-26 (minors 2-4) | `!halted()` branch untested; `updatefound` never fires `statechange`; precedence `it.each` uses invalid states | no: sw.test.ts:60, :161, :188, :202 | closed by e340aee |
| D-06 | 7.2 plan :22-26, :118, :128, :133, :187 s2; digest :29 s1 | no runtime test that an already-halted launch still gets the F17 report (only the source pin covers it); log pass 4 minor | yes: no e2e test halts before the chunk 404; boot-order.spec.ts:134 continues the held chunk | **fixed** (T3) |
| D-07 | 7.2 plan :121, :126, :187 s1; digest :29 s2 | external unregister or site-data clear while installing is reported as Q-40 | yes, by design | declined: SPEC CAP-1's literal rule (SPEC.md:43); silent in production (pre-assigned) |
| D-08 | 7.2 plan :127 | skip-waiting code in `index.html`/`public/` escapes the scan | yes | declined: SPEC CAP-1 scopes the scan to non-test `src/`; the generated `sw.js` is pinned by `AD-16 the generated sw.js skips waiting only on SKIP_WAITING and has no clientsClaim` |
| D-09 | 7.2 plan :132 | failure split tested only on fakes | no: sw-failure.spec.ts:36, :55, :112 | closed by bdf477e |
| D-10 | 7-2-build.md:38; digest :29 | AD-16 failing scan fixtures cover only shell `.ts` and script-less markup | yes: src/architecture-ad1.test.ts:865-899 | **fixed** (T1) |
| D-11 | 7-2-build.md:39; digest :29 | gate-off cases stub `''`, so a truthiness gate passes | yes: src/shell/sw.test.ts:91 | **fixed** (T1) |
| D-12 | 7.3 plan :181, :188, :242, :261 | B activating before the first poll gives a generic timeout | no: reload classifier, update.spec.ts:179-187 | closed by 8be346f |
| D-13 | 7.3 plan :168, :177, :189, :262 | static-server throws on malformed percent-encoding | yes: e2e/helpers/static-server.ts:79 | declined: rule 6 fail-fast; no spec sends such a path |
| D-14 | 7-3-build.md:54 (part a); digest :45 | `holdWaiting`'s `active` → timing-label branch has no self-test | yes: update.spec.ts:117; self-test :454-487 | **fixed** (T5) |
| D-15 | 7-3-build.md:54 (parts b, c) | step-2 classifier and `pollActivated` probe untested; plan claims every Matrix row is tested | yes | (b) declined: no deterministic trigger (B must activate before `waiting` is seen), so a test would race; (c) errata (7.3 plan :253) |
| D-16 | 7-3-build.md:53; digest :45 | redundant self-test regex matches B's setup `/sw.js` 200, so it does not prove C's fetch | yes: update.spec.ts:441 | **fixed** (T5) |
| D-17 | 7-3-build.md:55 | SKIP_WAITING self-test waits only for `controllerchange`, not B's `statechange` | yes: update.spec.ts:463-476 | declined: no observed failure. By reasoning (not run): a mutation that stops SKIP_WAITING reaching B leaves B waiting, so no `controllerchange` fires and today's wait already fails. A new bounded wait would add no failing mutation (item 5) |
| D-18 | 7-3-build.md:56 | `withSite`'s `finally` lets a cleanup error replace the body error | yes: update.spec.ts:322-336 | **fixed** (T5) |
| D-19 | 7-3-build.md:51-52; digest :45 | 7.3 plan: `HOLD_MS` hold missing from the step list; :125 `--project pwa <path>` and "6 passed"; digest says "four" minors, Result lists six | yes (text) | errata |
| D-20 | 7.3 plan :171 | static-server self-tests omit directory paths, extra content types, double `serve`, unserved `stop` | yes: helpers.spec.ts has 7 cases | declined: the plan's reason holds (every ticket-listed branch is covered; callers pass fixed literals) |
| D-21 | 7.1 plan :135, :191; 7.2 plan :187 s4; 7.3 plan :263 | plan checkpoint not honoured as a pause | n/a (process) | declined: gate 3 is delegated under owner-authorised autopilot (docs/development-methodology.md § Autopilot) |
| D-22 | 7-4-build.md:23; digest :56 | pwa `precacheComplete()` test checks "not halted" before the last poll's recomputes settle | yes: e2e/pwa/test-hook.spec.ts:69-72 | **fixed** (T6) |
| D-23 | 7-4-build.md:24; digest :56 | nothing stops other modules calling `recomputePrecacheComplete()` | yes: only call `src/shell/test-hook.ts:159`, unpinned | **fixed** (T2) |
| D-24 | 7-4-build.md:25; digest :56 | `precacheMissing` case runs at `/`, so it cannot tell the page URL from `/sw.js` as base | yes: e2e/helpers.spec.ts:1969 | **fixed** (T7) |
| D-25 | 7.4 plan :93 | dist-smoke marker check (dist-smoke.spec.ts:55-63) has no positive control | yes | **fixed** (T6) |
| D-26 | 7.4 plan :91 | an older recompute writing after a newer *rejected* one is untested | yes | declined: the write rule (`number > written`) is the story's literal rule, and the case is reachable only after the newer rejection halted the page (AD-15) |
| D-27 | 7.4 plan :116, :147 s2; 7.4 log :128 | `url:` count in `precacheUrls` is not string-aware | yes, by design (test-hook.ts:78) | declined: accepted in 7.4 Design Notes. It fails fast, never passes falsely, and hashed names hold no `:` |
| D-28 | 7.4 plan :79 (10), :147 s3; 7.4 log :129; digest :56 | 7.4 ticket says "proved by", the plan says "checked by" | yes (done ticket text) | errata |
| D-29 | 7.4 plan :147 s1 | unit 5 s budget not measured | n/a | closed by item 7's re-measurement (Item 7 budgets section) |
| D-30 | 7-5-build.md:25; 7.5 plan :127, :183 s3; digest :67; merged with 7.1 plan :22 | first-launch gating reads `dictionaryState()` asynchronously after the chunk request | clause "tail above `dictionary.load()`" no: `released` read synchronously, boot-order.spec.ts:55; clause "not `loading` at the request" yes: boot-order.spec.ts:55 | per clause: closed by 1259a50 / **fixed** (T4) |
| D-31 | 7.5 plan :20-26, :121, :129, :136, :183 s1; digest :67 | F17 → persistence has no runtime test | no: dist-smoke.spec.ts:494, sw-failure.spec.ts:112 | closed by bdf477e (pre-assigned; both builds and the :121 comment clause) |
| D-32 | 7.5 plan :27-33, :123, :183 s2; digest :67 | AGENTS.md `storage.ts` single-caller line; no `navigator.storage` single owner | yes | entry 11: tickets.toml entry 11 "AGENTS.md (… the `main.ts` `requestPersistence()` exception, `navigator.storage` only in `src/shell/storage.ts` …)"; SPEC CAP-9 |
| D-33 | 7.5 plan :119, :135 | no runtime proof that a persistence rejection reaches AD-15 | yes: no e2e test rejects `persisted`/`persist` | **fixed** (T8) |
| D-34 | 7.5 plan :117 | `navigator-storage` scan fixtures lack `src/main.ts`, `.svelte` `<script>` and template-substitution cases | yes: src/architecture-ad1.test.ts:927-1001 | **fixed** (T1) |
| D-35 | 7.5 plan :116, :131 | `holdRegister` tested only with a fulfilling register | yes | declined: the only caller fulfils; `gate.then(() => original)` passes a rejection through |
| D-36 | 7.5 plan :118 | no controlled-reload once-per-launch proof | yes | declined: the boot tail (`src/main.ts:264-292`) has no branch on a controller |
| D-37 | 7.5 plan :183 s4 | `recordBootCalls` arms after an `await`, so overlapping calls pass | yes | declined: every caller awaits it |
| D-38 | 7.6 plan :167, :215 | `DEFAULTS` mirrored in three specs (restore, prefs, pwa/offline) | yes | declined: each copy is an expected value (AD-7 absent-key defaults), and drift fails loudly in every copy. Merging touches two dev specs outside epic 7 to fix no defect |
| D-39 | 7.6 plan :169, :144 | `offline.ts` guard throws and per-document reset have no helper cases | yes: e2e/helpers/offline.ts:20,45,48,56,59 | **fixed** (T7) |
| D-40 | 7.6 plan :170 | offline timeouts inline on dist-smoke, named on pwa | yes | declined: cosmetic, no defect; both are literals local to one test |
| D-41 | 7.6 plan :214; 7.6 log :116 | final `expectNoPrompt` assumes no dialog opens in the place phase | yes: offline.spec.ts:139, dist-smoke.spec.ts:324 | **fixed** (T6, comment) |
| D-42 | 7.6 plan :165, :151, :154, :174; 7.6 log :110 | pwa offline never polls `swState()`; `requestfailed`/missed drop time out generically; `tapAt` uses mouse clicks | yes | declined: a late halt fails the final `current().kind` and `expectNoPrompt` checks; the generic timeouts cost diagnosis only; `tapAt` was excluded by 7.6's intent contract (:34) |
| D-43 | 7.6 plan :216; digest :82 | SPEC F6 and build-notes :112-115 describe `block` in dist-smoke; nothing sets it | yes; code comment correct (dist-smoke.spec.ts:236) | amend |
| D-44 | 7.7 plan :96, :138 s1 | icon-hold route logic, `macrotask` and `chunkUrl` copied across specs | yes | declined: two call sites with build-specific endings (pwa halts, dist-smoke continues). The copies are one-liners; D-46's fix lands in both |
| D-45 | 7-7-build.md:22; digest :93 | `expectFatal` checks the heading, not the alertdialog body cause | yes: sw-failure.spec.ts:28-34 | **fixed** (T3) |
| D-46 | 7-7-build.md:23; digest :93 | the "no worker request" timer starts at `goto`, the hold at the hit; a late hit plus a hold timeout reports the wrong reason | yes: sw-failure.spec.ts:70, :97-106; dist-smoke.spec.ts:428, :456-466 | **fixed** (T3) |
| D-47 | 7.7 plan :138 s2 | entry 11 must close the epic 3 P7 rows for Q-40/Q-42 | yes | entry 11: "closes this epic's `rule-coverage.md` rows and the epic 3 P7 rows for Q-40 and Q-42" |
| D-48 | 7.8 plan :20-32, :168 s2; 7.8 log :87; digest :104 | `tsconfig.e2e.json` `allowJs` missing from Scaffold deltas | yes: tsconfig.e2e.json:8 | entry 11: "Scaffold deltas" in its spine list |
| D-49 | 7.8 plan :103 (7), :168; 7.8 log :91; digest :104 | AD-18 Size lacks the unreachable-key failure wording and content check | yes | entry 11: "AD-18 Size"; SPEC CAP-9 "AD-18 Size gaining the gate's failure …" |
| D-50 | 7.8 plan :20-25, :103 (11); 7.8 log :95 | build-notes.md :22-23 ("with no edge it counts everything") | yes | amend |
| D-51 | 7.8 plan :168 s3 | done ticket's draft error string differs from as built | yes (text) | errata |
| D-52 | 7.8 plan :168 s1, Triage :127, :134 | gate's CLI exit-1 path covered only by the generic fixture | yes | declined: the `main()` errors loop is generic, and the gate push is already killed by computeBudget cases (size-budget.test.mjs:227, :319-379) |
| D-53 | 7.9 plan :22-28, Triage :132, :143, :145; 7.9 log :129; digest :115 | `main()` wiring of device-preview untested (fixture read first, stale-seed removal, seed write only when seeded, signal handlers before the port wait and `serve`, SIGINT during the wait runs `stop()`, `WORDCELL_APP_VERSION` reaches its build) | yes: device-preview.test.mjs:4 | **fixed** (T9); the `WORDCELL_APP_VERSION` clause is a recorded run (R-runs) |
| D-54 | 7.9 plan :29-35, Triage :127; digest :115 | a `waitForPort` timeout leaves `vite preview` running | yes: device-preview.mjs:186, :243 | **fixed** (T9) |
| D-55 | 7-9-build.md:50; digest :115 | spoiled-read redo restarts at step 1 while B's run holds the port | yes: docs/device-testing.md:135-136 | **fixed** (T10, doc) |
| D-56 | 7-9-build.md:51 | port-probe comment overstates (catches a serving run, not one still building); 7.9 plan :114 Change Log says the same | yes: device-preview.mjs:148 | comment: **fixed** (T9); plan clause: errata |
| D-57 | 7-9-build.md:52 | stale counts in 7.9 plan (:183, :187, :198-199) | yes | errata |
| D-58 | 7-9-build.md:53; 7.9 log :120 | `--no-build` stub-removal check ran before 9da4299 added the port probe | yes | run here (R-runs) |
| D-59 | 7-9-build.md:54; 7.9 log :123 | 7.9 doc-coverage check (7.9 plan :89) has no recorded result | yes | run here (R-runs: read-only clause → section map) |
| D-60 | 7-9-build.md:55; digest :115 | clear-site-data step 2 lacks "skip if not listed" | yes: docs/device-testing.md:60-61 | **fixed** (T10, doc) |
| D-61 | 7.9 plan :204 | device-testing.md "(unverified)" phone steps confirmed only at the device read | yes | the read: entry 11 ("hands Jared the build for every Device row … (`docs/device-testing.md`)"); dropping the tags afterwards: amend |
| D-62 | 7.2 plan :96 (10), :119, :187 s3; digest :29 s3 | build-notes :55 hook gate says `DEV \|\|`; as built `VITE_TEST_HOOKS === '1'` | yes | amend |
| D-63 | 7.3 plan :147, :159, :191, :256-260; digest :45 s2 | SPEC F8 (SPEC.md:134) and build-notes :123-124, :151 static-server/observation wording vs as built | yes | amend; 7.3 plan :147 "handle-only observation": errata |
| D-64 | 7.9 plan :108, :205; epic-place-preview.md:63; place-preview retro A7 | flake `§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm` (e2e/nav.spec.ts:163). 7.9 plan :108 run 2 is the recurrence that epic 11 awaited | yes | fix ticket: owner backlog entry outside this epic (SPEC Non-goals), not tickets.toml (Fix tickets). Counted-run failures are added under Item 6 counted runs |
| D-65 | 7.9 plan :108 run 1, :205; win-trigger plan :101; game-surfaces retro F-13 (:59) | flake `R-73 (UI) Success signal (epic Done when 3): the same move by drag …` (e2e/success-signal.spec.ts:440) | yes | item 6: three counted runs. A test-only fix with a found cause, re-run to 0/3 counted runs, closes it; otherwise (0/3 included) fix ticket (B8, end-of-game-words retro :218) |
| D-66 | device-checks.md G9; 4.6 plan `deferred` :38 | `main.ts` controller-registration order has no test | yes (partly: AD-14 pin src/architecture-tree-scan.test.ts:38 covers cancel before scrollReset) | **fixed** (T2, G9 section) |
| D-67 | 7-6-build.md `## Result` :24; 7-8-build.md :42 (search: `sed -n '/^## Result/,$p'`) | none: "Unapplied minors: none", 0 open majors | n/a | none |
| D-68 | ticket review logs 7.1–7.7 `## Result` (search: `grep -n '^## Result'`, each item checked against its plan's resolution list) | none open (all resolved by the plans: 7.1 :99, 7.2 :96, 7.3 :131-143, 7.4 :79, 7.5 :102, 7.6 :97, 7.7 :114) | n/a | none |
| D-69 | digest "Close-out docs" lines (:19, :30, :46, :57, :68, :83, :94, :105, :116) | none: every line reads "none" | n/a | none |

### Errata group (declined)

D-04 (plan clause), D-15c, D-19, D-28, D-51, D-56 (plan clause), D-57, D-63 (plan clause). Reason: ticket item 3 forbids editing done tickets' plans, logs and ticket files. The rows record each correction.

### Entry-11 amendment (proposal for the owner or orchestrator; the build does not edit tickets.toml)

Add to entry 11's description: "syncs `build-notes.md` (:22-23 CAP-6 unreachable-key gate; :55 hook gate `VITE_TEST_HOOKS === '1'`; :112-115 and SPEC F6: dist-smoke runs in Playwright's default worker mode, not `block`; :123-124, :151 and SPEC F8: no `?__WB_REVISION__` install fetch or CDP route, observation through B's handle and a recorder in A's scope), records ticket 7.10's G9 disposition in `device-checks.md` G9, and updates `docs/device-testing.md`'s (unverified) tags from the device read". Rows: D-43, D-50, D-61, D-62, D-63, D-66. Entry 11 then waits only on its tickets.toml fix tickets (none proposed so far; D-64's backlog entry is outside tickets.toml).

### Fix tickets (proposals)

- **D-64, owner backlog entry (outside epic 7, not tickets.toml).** Title: "Deflake nav.spec.ts rejected-root double tap". Finding: the D-64 test fails intermittently (sightings: end-of-game-words retro :161 L3 (five failures in 10.4–10.9, fixed by 169c6bc); epic 11 recurrence (place-preview retro :120, :141); 7.9 plan :108 run 2; plus the Item 6 counts). Files: `e2e/nav.spec.ts`, `e2e/helpers/` tap helpers. Reproduction: `npx playwright test e2e/nav.spec.ts -g "double tap on New game on the rejected root" --project=android --repeat-each=50`, failure count recorded; failures may not reproduce at that count.
- **D-65, tickets.toml fix ticket (B8), only if Item 6 leaves it open.** The row is completed with counts after the runs: title, finding, sightings (win-trigger plan :101, game-surfaces retro F-13, 7.9 plan :108 run 1, Item 6 counts), files `e2e/success-signal.spec.ts`, `e2e/helpers/drag.ts`, reproduction `npx playwright test e2e/success-signal.spec.ts -g "the same move by drag" --project=android --repeat-each=50`. Note that failures may not reproduce. Flakes are identified by title, not line number (log pass 3 minor).

## Tasks & Acceptance

**Execution:**
- [x] `src/architecture-ad1.test.ts`, `src/shell/sw.test.ts` -- T1:
  - D-10: add two `fails: 'skip-waiting'` fixtures: path `src/main.ts` importing `virtual:pwa-register`, and a `.svelte` `<script>` calling `wb.messageSkipWaiting()`.
  - D-34: add three navigator-storage fail fixtures: `src/main.ts` `navigator.storage.persist()`, a `.svelte` `<script>`, and a template substitution `` `${navigator.storage}` ``. Assert each fixture's rule list exactly.
  - D-11: gate off stubs `'0'` (keep `''` too).
  - Mutations: in `architecture-scan.ts`, narrowing the skip-waiting check to `layer === 'shell'`, then to `!isSvelte`; `storageCheck` exempting `src/main.ts`; `sw.ts:19` changed to a truthiness gate.
- [x] `src/architecture-tree-scan.test.ts` -- T2:
  - G9 pin, Design Notes.
  - D-23 pin `AD-17 recomputePrecacheComplete is called in src/ only from test-hook.ts's env-gated accessor`: over `scanTree().files` minus `*.test.ts`, the name appears outside its defining module only in `src/shell/test-hook.ts`, with exactly one call there.
  - Mutation for D-23: add `void recomputePrecacheComplete()` to `src/main.ts`'s boot.
- [x] `e2e/pwa/sw-failure.spec.ts`, `e2e/pwa/dist-smoke.spec.ts` -- T3:
  - D-45: `expectFatal(page, cause)` asserts `toContainText(cause)` on the alertdialog for each case. The causes come from `sw.ts:20` prefix plus :39, `sw.ts:75` and `main.ts:277`.
  - D-46 (both files): the route handler resolves a `hit` promise at the first worker hit; race only `hit` against the "no worker request" timer, then await the hold.
  - D-06: new pwa test. Hold the chunk route, `halt()` as boot-order does, wait for `halted`, then fulfil the chunk with 404. Assert `swState()` `failed`, the alertdialog body text is the F17 message, and `bootCalls` is empty.
  - Mutations: D-06, restore `&& !halted()` at `src/main.ts:276`. D-45, alter `sw.ts:39`'s message. D-46, the test-side delay the review named (16 s before the hold loop plus a never-ready condition); record both failure messages.
  - Repeat ×5 on `pwa` (sw-failure) and on `dist-smoke` (the changed icon case).
- [x] `e2e/helpers/boot-calls.ts`, `e2e/helpers.spec.ts`, `e2e/pwa/boot-order.spec.ts` -- T4, D-30:
  - Add a `holdListText` option to `recordBootCalls`. Its init script gates `Response.prototype.text` for the word-list URL on a page-side release and stamps the release time.
  - The first-launch test asserts no chunk hit while `text()` is held (frames plus a macrotask), and a chunk request time at or after the stamp.
  - Add a `helpers.spec.ts` probe case for the option.
  - Mutation: temporarily make `dictionary.load()` (`src/shell/dictionary.svelte.ts`) resolve before awaiting `response.text()`.
  - Repeat ×5: boot-order on `pwa`, the helper case on `android`. If it cannot pass ×5, the clause becomes declined with the evidence (item 5).
- [x] `e2e/pwa/update.spec.ts` -- T5:
  - D-14: the SKIP_WAITING self-test ends with `holdWaiting(page2, …)` rejecting with the TIMING label. Mutation: delete the :117 throw.
  - D-16: count the `/sw.js` 200 entries before the C write, and assert the message holds more after it. Mutation: build the message from the requests taken before the write.
  - D-18: `withSite` keeps the body error and attaches the cleanup error (`cause` or `AggregateError`), with a new self-test. Mutation: revert to plain try/finally.
  - Repeat ×5 on `pwa`.
- [x] `e2e/pwa/test-hook.spec.ts`, `e2e/pwa/offline.spec.ts`, `e2e/pwa/dist-smoke.spec.ts` -- T6:
  - D-22: move the not-halted check after the last poll, preceded by the dev test's settle step. Mutation: throw in `test-hook.ts:127-135` when `complete` is already true.
  - D-25: new pwa test `AD-17 AD-18 the test build's app chunk holds precacheAndRoute and __WB_REVISION__ (positive control for dist-smoke)`, walking `dist-test/assets/*.js`. Mutation: split the literal at `test-hook.ts:43,46`.
  - D-41: add the assumption comment at both final `expectNoPrompt` calls.
  - Repeat ×5 on `pwa`.
- [x] `e2e/helpers.spec.ts` -- T7:
  - D-24: route a probe page `**/precache-probe/x` (pattern at :1400) and run `precacheMissing` from it. Mutation: `e2e/helpers/precache.ts:71` resolves against `location.href`.
  - D-39: cases for `pinNextSeed` twice throws, `armSeed`/`seedPins` throw when unpinned, and the counter resets after reload. Mutation: delete the `offline.ts:20` throw.
  - Repeat ×5 on `android`.
- [x] `e2e/test-hook.spec.ts` (dev) -- T8, D-33:
  - New test `AD-15 AD-7 a rejected persisted() reaches the AD-15 halt`: `addInitScript` makes `StorageManager.prototype.persisted` reject with a named error; expect `halted` and the alertdialog body to contain that message.
  - Mutation: `.catch(() => {})` on `requestPersistence()` at `src/main.ts:291`.
  - Repeat ×5 on `android` and `desktop`.
- [x] `scripts/device-preview.mjs`, `scripts/device-preview.test.mjs` -- T9:
  - D-53: export `run(argv, io)` holding `main()`'s body unchanged in order, with each side effect behind `io` (readFixture, portOpen, removeStaleSeed, tailnet status, build, hasDist, writeSeed, spawnPreview, onSignal, waitForPort, serve, serveOff, log, exit). `main()` becomes `run(process.argv.slice(2), realIo)`.
  - Fake-`io` tests for:
    - (a) a bad fixture throws before any port, tailnet or build call;
    - (b) a no-fixture run removes the stale seed before the tailnet call;
    - (c) a seeded run never removes it, and writes the seed after build and hasDist;
    - (d) `--no-build` makes no build call;
    - (e) the signal handlers are registered before `waitForPort` and `serve`, and SIGINT during the wait runs serveOff, kill and exit 0.
  - D-54: a rejected `waitForPort` kills the preview and rethrows the same error. Test it.
  - D-56: reword the :148 comment.
  - Mutations: delete the `rmSync`; move readFixture after the build; move the signal registration after `serve`; drop the kill.
- [x] `docs/device-testing.md` -- T10:
  - D-55: the redo stops B's run first, then A's command, then clears site data.
  - D-60: append "(skip if the origin is not listed: it has no data yet)".
- [ ] this plan -- T11:
  - Record each T1–T10 row's mutation result and repeat counts in Implementation Notes.
  - R-runs: D-58 and D-59, and the D-53 `WORDCELL_APP_VERSION` run.
  - D-59 as a clause → section map: 7.9 plan :89's G1–G6, G20–G22 and release-checklist steps 2–4, plus G3 order, mapped to `docs/device-testing.md` headings.
  - D-58 and the version run need Tailscale with serve enabled and port 4173 free. When those are unavailable, decline with the reason.

**Acceptance Criteria:**
- Given the table, when a reviewer reconciles each source against its search, then every finding has exactly one row (or a clause of one) with a disposition, and every "closed by" cite holds at `baseline_revision` (ticket item 1).
- Given the sweep commit, when the invariant commands in Verification run, then they print nothing and exit 0. `git diff --name-only 575fdf7 -- . ':(exclude)_bmad-output/implementation-artifacts'` lists only item 3's editable files plus this plan. Every hunk in a file item 3 opens only to code comments (here: `src/` non-test files) is comment-only.
- Given the sweep commit, when item 6's three `npx playwright test --project=android` runs finish, then D-64 and D-65 carry their failure counts, and any other test failing in a counted run gets its own row under the same rule: closed only by a test-only fix with a found cause, re-run to 0/3 counted runs; otherwise a fix-ticket row (B8).
- Given a fresh Linux-filesystem clone of the sweep commit, when item 7 runs, then the `npm test` median (3 runs after a discarded warm-up) is under 5 s, the watch re-run under 1 s, and the AD-18 margin are recorded with the commit. If over budget: profile per AD-17, then stop and report.
- Given the sweep commit, when `npm run test:all` runs, then it exits 0. A failure confined to item 6 rows' tests gets one `npm run test:all` rerun at the same commit, both results go on the item 6 rows, and a closed row reopens. A failing rerun, or any other failure, stops the build and is reported.
- Given Docker, when `npm run test:screens` runs, then it is green and `git status --porcelain` shows nothing under `e2e/*-snapshots`.

## Implementation Notes

All runs below: 2026-10-31, working tree on `baseline_revision` 575fdf7 (uncommitted; the sweep commit follows the review), `/mnt/d` checkout, Node 24, CI unset (retries 0). Every mutation was applied to a copy-restored file and reverted; `git diff --stat src/` showed no non-test `src/` change after each revert. Pwa mutations of `src/` rebuilt `dist-test/` (`npm run build:test`) and were followed by a clean rebuild.

**T1 (D-10, D-34, D-11).** `src/architecture-ad1.test.ts` 298 tests and `src/shell/sw.test.ts` 45 tests pass. Each new fixture asserts its exact rule list through `run` (`toEqual` of the rule array).
- Skip-waiting check narrowed to `!isTest && layer === 'shell'`: 2 fail (`AD-16 fails: main.ts imports virtual:pwa-register (src/main.ts)`, `AD-16 fails: svelte <script> messageSkipWaiting() (src/ui/X.svelte)`).
- Narrowed to `!isTest && !isSvelte`: 1 fails (the `.svelte` `<script>` case).
- `storageCheck` exempting `src/main.ts`: 1 fails (`AD-1 fails: main.ts navigator.storage (src/main.ts)`).
- `sw.ts:19` as a truthiness gate (`if (import.meta.env.VITE_TEST_HOOKS)`): 9 fail, every `(gate off '0')` case of `AD-16 Q-40 failure split`.

**T2 (G9, D-23).** Both pins pass. G9 mutations (Design Notes numbering):
1. Halted `if` after `createController`: `expected +0 to be 1` (return count).
2. `if (halted()) return;` between `createGate` and `createController`: `expected 2 to be 1`.
3. `game.registerLifecycle()` above `createController`: `expected 2732 to be less than 2685`.
4. `nav.registerBeforeBack` block above `createController`: `expected 2803 to be less than 2685`.
5. `{ byBack: true }` dropped: `nav.registerBeforeBack(() => { controller.cancel({ byBack: true });: expected -1 to be greater than -1`.
6. `setController(controller)` after `mount(App`: `expected 5158 to be less than 5101`.
7. `setController(controller)` duplicated: `setController( calls: expected 2 to be 1`.
8. `createGate` call deleted: `createGate(: expected -1 to be greater than -1`.
- "Passes the controller to App": `props: { layout }` makes `npm run check` fail (`src/main.ts 256:24 Property 'controller' is missing in type '{ layout: Layout; }' but required in type '$$ComponentProps'`).
- D-23: `void recomputePrecacheComplete();` in `boot()`: `expected [ 'src/main.ts', …(1) ] to deeply equal [ 'src/shell/test-hook.ts' ]`.
- D-23, code-review fix: the call is now also bounded before the env-gated block's closing brace (the first top-level `}` line after the gate). Moving the accessor's call to after the block in `test-hook.ts`: `expected 7119 to be less than 7111`; the old pin (only `> gate`) passed this. Appending a second call after the block: `recomputePrecacheComplete( calls: expected 2 to be 1`.

**T3 (D-45, D-46, D-06).** `e2e/pwa/sw-failure.spec.ts` ×5 on `pwa`: 20/20 passed (with boot-order and pwa test-hook: 75/75). Dist-smoke icon case ×5 on `dist-smoke`: 5/5; whole `dist-smoke` project once: 28/28.
- D-06, `&& !halted()` restored at `src/main.ts:276`: the new test fails (`toHaveAccessibleDescription` expected `Q-40 F17 the sw.ts chunk did not load`, received `F17 test halt`).
- D-45, `sw.ts:39` reason changed to `Workbox.register() threw`: the missing-script case fails (`Expected substring: "Q-40 Workbox.register() rejected"`, received `Something went wrong. Q-40 Workbox.register() threw Reload`).
- D-46, test-side 16 s delay before the hold loop plus a never-ready condition (break only on the deadline, resolve on an impossible state). Fixed spec: `the held icon was released with swState() installing, not installing` (pwa) and `the held icon was released without register() fulfilled: [...]` (dist-smoke), the hold's own reason. Baseline spec with the same mutation: `no worker request for /icons/icon-192.png reached the context.route` in both builds (the wrong reason the review named).

**T4 (D-30).** `recordBootCalls(page, { holdListText: true })` gates `Response.prototype.text` for pathnames matching `LIST_PATH` (`/\/en[^/]*\.txt$/`) and stamps `performance.now()` at the release. The first-launch test now holds `text()` instead of the network request and compares the chunk's resource-timing `startTime` with the stamp (one page clock). Boot-order ×5 on `pwa`: 30/30. The helpers.spec.ts holdListText case and the extended throws case ×5 on `android`: passed (within 30/30 below).
- Mutation: `dictionary.load()` resolves once the response headers arrive, before awaiting `response.text()`. The first-launch test fails at `expect(chunkHits).toEqual([])` (received the `assets/sw-*.js` URL while `text()` was held).

**T5 (D-14, D-16, D-18).** `e2e/pwa/update.spec.ts` ×5 on `pwa`: 30/30. Then ×10: 60/60, then three single runs: 6/6 each. The first single run of the file on the fresh `dist-test/` had 1 failure, in `AD-17 the update spec activation poll fails at once when B turns redundant`. Its message was lost (tail-truncated output, results directory overwritten) and it did not recur in 18 later runs of that test (5 + 10 + 3; 96 counts the whole file's tests). It stays a residual risk, which item 6's counted runs and the final `test:all` re-check.
- D-14, the `active` → TIMING throw deleted from `holdWaiting`: the SKIP_WAITING self-test fails (expected `A-A15 timing differs (SPEC Assumptions, G3): swState() active on page 2 with page 1 open`, received `swState() active on page 2 with page 1 open, not waiting; requests: …`).
- D-16, `pollActivated` given a `Served` whose `requests()` returns the snapshot taken before the C write: the old regex still passes, and the new count fails (`a /sw.js 200 logged after the C write`, expected `> 2`, received `2`).
- D-18, `withSite` reverted to plain try/finally: the new self-test fails (expected constructor `AggregateError`, received `Error`).

**T6 (D-22, D-25, D-41).** Pwa test-hook ×5: 25/25 (within the 75 above).
- D-22, `if (complete) throw …` after the `await` in `recomputePrecacheComplete`: the moved check fails (expected `active`, received `halted`). The baseline test also failed 3/3 on this mutation: the late rejection lands before even the old check, so this mutation proves that the new check catches a late rejection, not that the old one missed it.
- D-25, `CALL` and `REVISION` built with `['precache', 'AndRoute('].join('')` and `['__WB_', 'REVISION__'].join('')`, so the minifier cannot fold them: the positive control fails (`app chunks holding both names`, expected `> 0`, received `0`). `precacheComplete()` still polled to true on that build.
- D-41: comment-only, at `e2e/pwa/offline.spec.ts` and `e2e/pwa/dist-smoke.spec.ts` before the final `expectNoPrompt`.

**T7 (D-24, D-39).** The recordBootCalls describe, precacheMissing and the new pinNextSeed case ×5 on `android`: 30/30.
- D-24, `precache.ts` resolving against `location.href`: the case fails (received adds `"a.js"`, `"b.css"`).
- D-39, `offline.ts:20` throw deleted: the case fails (`Received promise resolved instead of rejected`).
- Code-review fix: the pinNextSeed case now waits for boot (`booted(page)`, the `waitBooted` that `e2e/helpers/board.ts` uses) after the goto and after each reload, so the launch's own deal cannot take the armed pin. ×5 on `android`: 5/5.

**T8 (D-33).** ×5 on `android` and `desktop`: 10/10.
- Mutation: `requestPersistence().catch(() => {})` at `src/main.ts:291`. The test fails (`page.waitForFunction: Test timeout of 30000ms exceeded` waiting for `halted`).

**T9 (D-53, D-54, D-56).** `scripts/device-preview.test.mjs` 32 tests pass (6 new `AD-17 device preview run` cases); `tsc -p tsconfig.node.json` clean.
- `rmSync` (`io.removeStaleSeed()`) deleted: the no-fixture case fails (`expected [ 'portOpen', 'tailnetStatus', …(8) ] to deeply equal [ 'portOpen', 'removeStaleSeed', …(9) ]`).
- readFixture moved after the build: the non-JSON case fails (`expected [ 'portOpen', 'tailnetStatus', …(2) ] to deeply equal [ 'readFixture session-won-words' ]`), and so does the seeded case.
- Signal registration moved after `serve`: the SIGINT case fails (`expected [ 'portOpen', 'removeStaleSeed', …(4) ] to deeply equal ArrayContaining{…}`), and so does the no-fixture order case.
- Kill dropped from the wait's catch: the D-54 case fails (`expected [] to have a length of 1 but got +0`).
- D-56: the `:148` comment now says the probe catches a run that is already serving, not one still building.
- Code-review fix: `fakeIo` keeps the preview's `exit` listener, its `kill()` fires it (as a real child would), and it takes a `serveStatus` option. New cases cover an unexpected preview exit (`error`, `serveOff`, `kill`, `exit 1`) and `serve` returning status 1 (`error`, `error`, `serveOff`, `kill`, `exit 1`, no `log`). The wait-timeout case now also proves nothing follows `kill`. 34 tests pass. Each of these mutations now fails a test:
  - `stopping = true` dropped from the wait's catch: the wait-timeout case fails (`expected [ 'kill', 'kill' ] to have a length of 1 but got 2`).
  - `stop(1)` deleted from the serve-failure branch: the serve-failure case fails (`expected [ 'error', 'error' ] to deeply equal [ 'error', 'error', 'serveOff', …(2) ]`).
  - The `if (!stopping)` guard deleted: 4 cases fail (SIGINT, wait timeout, unexpected exit, serve failure). The fake's synchronous exit event recurses through `stop()` (`RangeError: Maximum call stack size exceeded` in the wait-timeout case).

**T10 (D-55, D-60).** Doc diff only.
- Clearing site data step 2 gains "(skip if the origin is not listed: it has no data yet)", placed right after "Delete data or Clear & reset (unverified)" (moved there in the code-review fix).
- The spoiled-read redo now reads: first stop B's run (Ctrl+C, which frees port 4173), then A's command, then cleared site data.

**R-runs** (Tailscale 1.102.3 via `tailscale.exe`, Serve enabled, `serve status` `No serve config` before, port 4173 free).
- D-58: after a plain `npm run build`, `echo stub > dist/seed.html`, then `timeout --preserve-status -s INT 40 node scripts/device-preview.mjs --no-build` exited 0 with the stub gone. The share came up and printed the four no-fixture lines. A second identical run with no stub also exited 0. `tailscale.exe serve status` afterwards: `No serve config`.
- D-53 `WORDCELL_APP_VERSION`: `WORDCELL_APP_VERSION=SWEEP node scripts/device-preview.mjs` (with build) put `` ue.textContent=`SWEEP` `` into `dist/assets/index-*.js`. The run was ended by the tool's SIGTERM, not a timed SIGINT, so it has no exit code. Its SIGTERM handler ran `stop(0)`: `serve status` `No serve config`, port 4173 free, no preview process left. A plain `npm run build` followed (no `SWEEP` in `dist/`).
- D-53 seeded `realIo` paths (review pass, verification-gap finding): with the existing `dist/`, `rm -f dist/seed.html`, then `timeout --preserve-status -s INT 60 node scripts/device-preview.mjs session-won-words --history history-three-records --no-build` exited 0, printed the seed URL hint, and left `dist/seed.html` holding `wordcell:session` and `wordcell:history` once each, with the session fixture's text embedded (`realIo.readFixture` and `realIo.writeSeed`). `serve status` afterwards: `No serve config`. `dist/seed.html` was removed after the check.
- D-59, clause → section map (7.9 plan :89 against `docs/device-testing.md`): every clause maps to a section, in G3's order.
  - G1: § Install and offline readiness, bullet 1; § Seeded reads step 4.
  - G2: § Install and offline readiness, bullet 2 (readiness, relaunch online, then airplane mode).
  - G3: § Update read (G3) steps 1–10. Steps 1–4 are A built, site data cleared, install and A's readiness. Step 5 is B served keeping site data. Step 6 is the cold launch with footer A. Then the spoiled-read paragraph, step 7 B's readiness, step 8 the Chrome tab with footer A, step 9 resume still A with the discarded-renderer rule, and step 10 everything closed and relaunched with footer B. The intro paragraph carries the Q-38 Reload rule and "no prompt at any point".
  - G4–G6: § Seeded reads table (G4's two tailnet fixtures and "the other G4 boundaries by play"; G5 `session-won-words`; G6 history-only `history-invalid-null`), steps 1–6 (clear, seed, close the tab, cold launch).
  - G20–G22: § Desktop rows.
  - Release-checklist step 2: § Before the production install (uninstall) and § Production variant (A installed and G2's readiness on it).
  - Step 3: § Production variant ("before release-checklist step 3's push").
  - Step 4: § Production variant (Update-read steps 6–10 on the installed app, footer `1.0.0 (<sha>)`, the spoiled production read routing).

**Gates on the working tree** (not the recorded final runs; those run at the sweep commit). `npm run lint` clean; `npm run check` 0 errors; `npm test` 91 files / 3782 passed. Invariant commands exit 0. `git diff --name-only 575fdf7 -- . ':(exclude)_bmad-output/implementation-artifacts'` lists only item 3's editable files plus this plan. No non-test `src/` file changed. `npm run test:all` on the final working tree exited 0 in 7m22s: unit 3782; build total 560,703; dist-smoke 28; dev e2e 1157 passed and 1093 skipped (project-specific); pwa 40.

Two late edits came after the ×5 runs. One is a comment reword in the pwa test-hook spec. The other adds `original.catch(() => {})` to `holdListText`, so a held body failure is not an unhandledrejection before the release. After them, boot-order and pwa test-hook ×5 passed 55/55, and the recordBootCalls describe ×5 on `android` passed 20/20.

**Pending at the sweep commit** (Order of work; the build does not commit before the review):
- Item 6: three counted `npx playwright test --project=android` runs, with counts for D-64, D-65 and any other failing test.
- Item 7: Linux-filesystem clone budgets (`npm test` median, watch re-run, AD-18 margin).
- The final `npm run test:all` and `npm run test:screens`.

For reference, the working-tree `npm run build` total is 560,703 / 600,000 bytes (margin 39,297), not the recorded item 7 value.

## Plan Change Log

- T1: `sw.test.ts`'s `gate` option is now the `VITE_TEST_HOOKS` string (`'1'`, `''` or `'0'`), and `GATES` has three entries, so every gate case runs with both off values.
- T3 D-06: the test also asserts the body before the 404 (`F17 test halt`), so "replaces" is shown, and it asserts the body exactly (`toHaveAccessibleDescription`).
- T4: the first-launch test's network-level word-list hold is replaced by the `text()` hold (it still covers the 1259a50 clause, since `load()` cannot settle while held). The chunk request time is the resource-timing `startTime`, on the same page clock as the stamp. The helper adds `listTextCalls`, `releaseListText` and `LIST_PATH`, with globals in `e2e/globals.d.ts`.
- T5 D-14: `pollState(page2, 'active')` runs before `holdWaiting(page2, …)`, so the hold starts on a registered page. `withSite` and `closePages` take `Pick<BrowserContext, 'pages'>` so the self-test can pass a fake context.
- T6 D-22: `precacheMissing` runs before the settle step and the not-halted check, which is still after the last poll.
- T9: `Io` also has `error` (the `console.error` lines) beside `log`. `stopping` moved into `run` (per-run state). `main()` stays as a one-line `run(process.argv.slice(2), realIo)` wrapper. The Tailscale binary is found once, on first use (the status call, as before).

## Review Triage Log

### 2026-10-31 — Review pass
- verdicts: 30 findings — high 0, medium 2, low 17, false 6, maybe-false 5
- findings:
  - `[low]` `[reject]` blind: Searches cross-refs for the 7.8/7.9 review-log lines point at the wrong rows — plan edit; corrected as bookkeeping (D-48–D-50, D-58/D-59/D-53).
  - `[low]` `[reject]` blind: D-29/D-64/D-65 cite Budgets/Item 6 sections that do not exist yet — plan edit; the sections land with the item 6/7 runs at the sweep commit.
  - `[low]` `[reject]` blind: Code Map's "R4-2" undefined — plan edit; corrected to D-23 (the pin exists, T2).
  - `[low]` `[reject]` blind: per-source counts not line-listed; no "none" rows for sources without findings — plan edit; "none" rows D-67–D-69 added; rows cite their own source lines.
  - `[low]` `[reject]` blind: "owner call" disposition missing — plan edit; legend now states owner-call rows: none.
  - `[maybe-false]` `[defer]` blind: one unexplained failure of the changed D-16 test `AD-17 the update spec activation poll fails at once when B turns redundant`; message lost, 18 later passes — would be medium (a flake introduced by T5) if real; settled by the final `test:all` pwa run plus a reproduction count; deferred, run count corrected in T5 notes.
  - `[low]` `[reject]` blind: D-17 decline claims an unrun mutation — plan edit; reworded as reasoning.
  - `[low]` `[reject]` blind: `withSite` self-test does not assert `site.stop()` after a failed `closePages` — the inner try/finally is the baseline structure, unchanged; adding fake-site plumbing is more than a direct correction for a case nobody meets.
  - `[medium]` `[patch]` blind + verification-gap: fakeIo discards the preview `exit` listener and `serve` always succeeds, so the D-54 catch's `stopping = true`, the unexpected-exit `stop(1)` and the serve-failure `stop(1)` are untested — patched: fakeIo keeps the listener, `kill()` fires it, `serveStatus` option; two new cases; the three mutations each fail (T9 notes).
  - `[low]` `[reject]` blind: `listTextCalls`/`releaseListText` "no held text() in this document" branches untested; a second release re-stamps — the helpers.spec case covers the helper; the unarmed-document branch is fail-fast and reached by no caller; fix adds cases/guards.
  - `[low]` `[reject]` blind: D-46 worst case (hit at 29.9 s, then hold, then expectFatal) can reach the 60 s test timeout — needs a hit at the very end of the 30 s window; in that case the hold's own rejection fires first unless it resolves at its deadline; unlikely, and the fix (retimed budgets) is more than a direct correction.
  - `[low]` `[patch]` blind + intent: D-23 pin bounded only by the gated block's start — patched: the call must also precede the block's closing brace; moved-call mutation now fails (T2 notes).
  - `[low]` `[reject]` blind + intent: D-25 positive control copies dist-smoke's search instead of sharing it — drift requires editing one copy; a shared helper plus helpers.spec case is more than a direct correction; recorded as the control's limit.
  - `[low]` `[patch]` blind: device-testing.md "skip if not listed" note sits in the open-tab sentence — patched: moved after "Delete data or Clear & reset (unverified)".
  - `[false]` `[reject]` blind: `held[0]?.fulfill` could silently no-op — `expect.poll(() => held.length).toBe(1)` precedes it, so the array is non-empty; the dialog body change after the 404 already shows the halted fatal surface.
  - `[false]` `[reject]` blind: plan bookkeeping (empty triage log, T11 unchecked, no size-budget hunk inspection) — the triage log is written by this pass; T11 closes with the item 6/7 records; `scripts/size-budget.mjs` is unchanged (`git diff 575fdf7 -- scripts/size-budget.mjs` empty), so the hunk rule holds trivially.
  - `[maybe-false]` `[reject]` edge: sw-failure icon handler — `route.fulfill` rejecting before `answered` settles hangs `done` to the test timeout — `route.fulfill` rejects only when the page or context is gone, which already fails the test; would be low; not worth a guard.
  - `[maybe-false]` `[reject]` edge: same for dist-smoke's icon handler — same reasoning; low if true.
  - `[low]` `[patch]` edge: new pinNextSeed helpers.spec case does not wait for boot before arming, so a first launch's `newSeed()` could take the pin — patched: `waitBooted(page)` after the goto and each reload; ×5 on android 5/5.
  - `[maybe-false]` `[reject]` edge: `withSite` loses the `closePages` error when `site.stop()` also rejects — needs two cleanup failures after a body failure; low if true; fix adds error plumbing.
  - `[medium]` `[patch]` verification-gap: `realIo.readFixture`/`realIo.writeSeed` (seeded launch) neither tested nor run after the refactor — closed by a recorded seeded run (R-runs: exit 0, `dist/seed.html` held both keys and the fixture text).
  - `[false]` `[reject]` intent: G9 pin checks source order, not runtime behaviour or adjacency — ticket item 4 specifies exactly a test-only source-order pin that pins order, not adjacency; "a second call throws" is the 4.6 act.ts unit coverage, not G9's main.ts bullet.
  - `[low]` `[reject]` intent: D-53's `rmSync` inside `realIo` is not under a unit test (the mutation removed the `io.removeStaleSeed()` call) — the real `rmSync` is exercised by the recorded D-58 run (stub removed); a unit test of `realIo` would touch the real filesystem.
  - `[false]` `[reject]` intent: D-30 holds `text()`, one step before the app's `loading`→`ready` transition — `dictionary.svelte.ts:47-62` flips state synchronously in the same continuation as `text()` resolving, so no task can run between them; a change to the load path fails the `listTextCalls` poll loudly.
  - `[low]` `[reject]` intent: D-33 rejects only `persisted()`, dev build only — both calls share one await chain with no catch in `main.ts`; the pwa/dist boot tails reach the same `requestPersistence()` line; a second case catches no extra mutation.
  - `[false]` `[reject]` intent: D-25 duplicates dist-smoke's search — same as the blind finding above (counted there); the control proves the needles survive minification, its stated purpose.
  - `[false]` `[reject]` intent: D-22's mutation also fails the old placement — item 5 requires the new test to fail on a named mutation, which it does; the notes already say the evidence does not separate old and new placement.
  - `[low]` `[reject]` intent: D-23 pin counts mentions including comments — fails closed (a comment mention fails the pin, never passes a bad call); no harm.
  - `[maybe-false]` `[reject]` intent: D-29 "closed by" cites future work, not a commit — closed when the Item 7 budgets section records the measurement at the sweep commit; if it ever went unrecorded the row would stay live; plan bookkeeping.
  - `[low]` `[reject]` intent: D-66 is both "fixed" and in the amendment group — consistent: the test lands here; recording it in `device-checks.md` G9 is a companion edit item 3 forbids, so it goes to entry 11.

## Design Notes

**G9 pin** (ticket item 4; `src/architecture-tree-scan.test.ts`, beside :54). The test is named `AD-12 AD-13 AD-16 src/main.ts creates the controller after the halted return and createGate, before registerLifecycle and the before-back cancel, and sets it once before mount`. It slices `boot()`'s body (from `async function boot()` to its closing brace) and uses the `at()` needle style:

```ts
const halted = at("if (game.state.kind === 'halted') {");
const haltedReturn = body.indexOf('return;', halted);
// "rejected root included": the halted return is boot()'s only `return` before createController
expect([...body.slice(0, controller).matchAll(/\breturn\b/g)].length).toBe(1);
expect(haltedReturn).toBeLessThan(gate); expect(gate).toBeLessThan(controller);
expect(controller).toBeLessThan(lifecycle); expect(controller).toBeLessThan(beforeBack);
// beforeBack = the `nav.registerBeforeBack(` whose callback holds `controller.cancel({ byBack: true })`
// setController( appears exactly once in main.ts as a call; controller < setController < mount(App
```

It pins order, not the contract's adjacency ("right after `createGate`"; layout, flip and tracker sit between). The existing AD-14 pin (:38) already covers the hide cancel before `gate.scrollReset`. "Passes the controller to App" is covered by `npm run check`: App's `controller` prop is required (`src/ui/App.svelte:43`), so dropping it fails type-checking. Record the check's failure for that mutation.

Each mutation is reverted after its run, and each must fail the new pin:
1. Move the halted `if` after `createController`.
2. Insert `if (halted()) return;` between `createGate` and `createController`.
3. Swap `game.registerLifecycle()` above `createController`.
4. Move the `nav.registerBeforeBack` block above `createController`.
5. Drop `{ byBack: true }`.
6. Move `setController(controller)` after `mount(App`.
7. Duplicate `setController(controller)`.
8. Delete `createGate`'s call; the pin, or `npm run check`, fails.

**Order of work.** T1–T10 first, each proven per item 5. Then the review (step 4) and its patches. Then commit the sweep commit (`test(pwa): refactor sweep … (ticket 7.10)`). Items 6 and 7, the final `test:all` and `test:screens` run at that commit. Any later commit touching files outside `_bmad-output/` re-runs them (item 6). Item 6's counted runs use the `/mnt/d` checkout at the sweep commit, the one `test:all` uses. Item 7 uses `git clone /mnt/d/CodeProjects/wordcell ~/wordcell-sweep && git checkout <sweep sha> && npm ci`, plus whatever `npm run build` needs (the dictionary and generated files). Both checkouts are recorded (log pass 4 minor).

**Ticket review-log carry-overs** (`story-refactor-sweep.review-log.md` `## Result`):
- **Open majors 1 and 2.** The final-`test:all` acceptance criterion follows the pass-5 wording: one `npm run test:all` rerun at the same commit; a failing rerun, or any other failure, stops the build. This includes a rerun that fails a different item-6 test.
- **Item 1 Columns.** "Live at baseline" is one column (table preamble).
- **Item 2.** Entry 11 waits on its tickets.toml fix tickets only (Entry-11 amendment).
- **Rows and runs.**
  - The 7.2 halted-first F17 gap has its own row, D-06.
  - Counted-run checkouts are recorded (Order of work).
  - B8 covers any test failing in a counted run (AC 3).
  - The G9 result goes to `device-checks.md` G9 through the amendment group (D-66).
  - The G9 pin anchors on `game.state.kind === 'halted'`.
  - The watch method is defined below.
- **Fix tickets and flakes.** Non-reproducing flake rows still carry a reproduction command (Fix tickets). The G9 swaps are named mutations. A flake fix is re-run to 0/3 counted runs. Device-read residuals are D-61. 7-9-build.md:54 is D-59. Flakes are identified by title.
- **Reject filter.** Reject-verdict rows are filtered by reading each reason, as the Searches section says.

**Watch re-run method** (AD-17 Speed). Take the slowest engine test file from `npx vitest run src/engine --reporter=json` durations. Run `npx vitest <file>` in watch mode in the clone, wait for the first run, then append and remove a blank line in that file. The re-run time is Vitest's reported `Duration` for the re-run; record the median of three triggers.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: exit 0.
- `npx playwright test <each changed dev spec> --project=android --repeat-each=5` (and `desktop` where the spec runs there) -- expected: all pass.
- `npm run build:test && PW_PREVIEW=dist-test npx playwright test -c playwright.pwa.config.ts --project pwa <changed pwa specs> --repeat-each=5` -- expected: all pass.
- `npm run build && PW_PREVIEW=dist npx playwright test -c playwright.pwa.config.ts --project dist-smoke e2e/pwa/dist-smoke.spec.ts --repeat-each=5` -- expected: all pass.
- `git diff --exit-code 4130fb4 -- fixtures/ src/engine/deal.test.ts && git diff --exit-code -G'_VERSION =' 4130fb4 -- src/engine/session.ts src/engine/history.ts && git diff --exit-code -G'_BYTES' 575fdf7 -- scripts/size-budget.mjs` -- expected: exit 0.

**Manual checks (if no CLI):**
- `git diff --name-only 575fdf7 -- . ':(exclude)_bmad-output/implementation-artifacts'` lists only item 3's editable files and this plan. Each `src/` non-test hunk is comment-only.
