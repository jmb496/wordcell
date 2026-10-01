---
title: 'Refactor sweep and shared Playwright config'
type: 'refactor'
ticket: '12'
created: '2026-10-01'
status: 'built'
baseline_revision: 'f496ae43346052eb8fe6b575a20bd33b088de6d0'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-refactor-sweep-and-shared-playwright-config.md'
warnings: ['oversized', 'multiple-goals']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 3 closes with ~55 unapplied review-loop minors and deferred plan items, three Playwright configs with copied settings (B11, E9), e2e helpers copied between specs, and a unit suite at 6.6 s against AD-17's 5 s budget.

**Approach:** Give every inventory item one disposition (table I below), apply the test-strengthening and small src items, fold the identical e2e helpers into `e2e/helpers/`, add `playwright.base.ts`, turn on Vitest `fsModuleCache`, and record measurements and the carry-forward list here.

## Boundaries & Constraints

**Always:** Ticket rules (Tests, Inventory, Carry-forward only, base paragraph, budget paragraph) bind as written. New shell/UI Vitest and new Playwright tests without an existing id use AD-n names; Playwright R/Q/§ names carry only ids existing engine Vitest or Playwright tests already carry. Each applied src/ behaviour change (I-19, I-25) has a test that fails before and passes after; record both runs. A new or strengthened test that fails on current code is a bug: fix it in src/ when that restores specified behaviour, else leave the test out and add a carry-forward row with the failing case. Renames keep every id an engine-Vitest or Playwright title carried and add a dated correction line naming the old title to each done plan that names it. Dated correction lines go at the end of the done plan's Implementation Notes as `- Correction 2026-10-01 (3.12): …`; done plans keep `status: done`.

**Never:** No `src/engine/index.ts` export change and no new `src/` module (strict Interface reading; a fold that needs one is carried forward). No edit to done ticket files, tickets.toml, AGENTS.md, CLAUDE.md, spec §9, the spine, DESIGN/EXPERIENCE, SPEC.md or build-notes.md; `rule-coverage.md` only for CAP-column changes (I-24). No screenshot baseline added, removed or changed. No test removed, skipped, todo'd or loosened. No `isolate: false`, no pool change and no noLib/skipLibCheck unless `fsModuleCache` alone misses a budget. No changes to the dealt layout.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Base config, CI unset | each config loads | same `--list` and same resolved export as start commit | — |
| Base config, CI=1 | each config loads | forbidOnly true, retries 2 (dev, pwa), 0 (screens), reporter github | — |
| pwa without PW_PREVIEW | load | still throws its own guard | as today |
| flush with nothing to accrue | won/given-up Session, or 0 ms take | `wordcell:session` still written; `game.view` keeps its reference | — |
| fatal | any error after boot | store halted before `console.error` runs | — |

</intent-contract>

## Code Map

- `playwright.config.ts`, `playwright.pwa.config.ts`, `playwright.screens.config.ts` -- shared: `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: CI ? 2 : 0` (dev, pwa), `reporter: CI ? 'github' : 'list'`, `use.trace: 'retain-on-failure'`, android `devices['Pixel 7']` / desktop `devices['Desktop Chrome']` (dev, screens). Each keeps baseURL, webServer, testDir/testMatch/testIgnore, expect, updateSnapshots, env guards; pwa keeps its `devices['Pixel 7']` project; screens keeps `retries: 0`.
- `tsconfig.e2e.json` include -- `["playwright*.config.ts", "e2e/**/*.ts"]`; the glob misses `playwright.base.ts`.
- `vite.config.ts` `test` block -- add `fsModuleCache: true` (cache in `node_modules/.vitest-cache`, git-ignored with node_modules).
- `src/main.ts:44-48` `fatal()` -- `console.error(reason)` runs before `game.halt(...)`; AD-15 wants halt first. Hook `src/shell/test-hook.ts` exposes `current().kind` (frozen; DEV or VITE_TEST_HOOKS).
- `src/shell/game.svelte.ts:245-256` `flush()` -- always assigns `state = { kind:'active', session: accrued }`; `accrue` returns the same object for 0 ms or a finished game (`commands.ts:525,527`); `state` is `$state.raw` (:83); `game.view` (:316) returns `$derived` `currentView`.
- `src/shell/game.svelte.ts:108,120,146` -- messages `AD-4 load() called twice`, `AD-4 load() while ${kind}`, `AD-4 dispatch while ${kind}`; tests at `game.svelte.test.ts:321,326,332,338` use bare `toThrow()`. whenVisible test :996 (active only); `registerLifecycle` throws while booting/halted (:265). Load table :1130-1180.
- `e2e/helpers/` -- `restore.ts` (`open`, `booted`, `dictionaryReady`, …), `storage-spy.ts` (`armStorageSpy` throws on a second arm per Page), `dist-test.ts` (`walk`), `lifecycle.ts`, `seed.ts`, `touch.ts`, `precache.ts`; cases in `e2e/helpers.spec.ts`.
- Copies: `tokenColor` (`game-store.spec.ts:126`, `dictionary.spec.ts:56`, identical); `waitForDictionary` (`dictionary.spec.ts:21`); `kind` (`blocking.spec.ts:16`, `lifecycle.spec.ts:18`, identical); `expectAnotherWindow` (`blocking.spec.ts:36`, `lifecycle.spec.ts:54`, same assertions, lifecycle inlines `expectOnlyButton`); `stored` (history:20 and history-notice:23 `(page,key)`, blocking:17 `(page,key='wordcell:session')`, lifecycle:19 `(page)` fixed SESSION); `wc`, `notice`, `confirmDialog`, `button`, `expectLeaves` identical in `nav.spec.ts:20-23,49` and `history-notice.spec.ts:24-27,87`; card-0 `open` identical in history:45, dictionary:50, history-notice:38, prefs:46; `hitAt` (`history-notice.spec.ts:70`) vs nav inline probe (`nav.spec.ts:180-190`, different shape). `expectFatal` (blocking:26 vs history:63) and `openConfirm` (nav:43 vs history-notice:52) differ in assertions; lifecycle `open` (paused clock), nav/history-notice `start`, blocking `hookReady` differ in waits.
- Walkers: `src/architecture.test.ts:1855`, `scripts/size-budget.mjs:166`, `e2e/helpers/dist-test.ts:52` `walk`, inline in `e2e/pwa/dist-smoke.spec.ts:26` (same as `walk` minus separator normalisation and sort).
- Engine tests: `src/engine/serialize.test.ts` VALID :283, REBUILDS :1602, row `"longestWord 'tan' 4"` :1380, title `'§2 a replay code wins over the headroom: seed -1 with activeMs 2^52 + 1'` :1137; `src/engine/view.ts:154-155` comment "(AD-3)"; `src/architecture.test.ts` synthetic sources ~861-952 use `Card`/`deal`.
- Read-only: done ticket files, every file listed under Never.

## Tasks & Acceptance

**Execution:**
- [x] Baseline (done at start commit f496ae4, Design Notes M) -- re-run `/tmp/wc312/snap.sh` and `/tmp/wc312/screens-list.sh` into a new dir immediately before the B11 step only if any config, e2e or tsconfig file changed before it.
- [x] `playwright.base.ts` (new) + three configs + `tsconfig.e2e.json` -- B11/E9 per the ticket's base paragraph and Code Map; configs `import … from './playwright.base'`; add `"playwright.base.ts"` to include. Then snapshot again and diff (AC 1).
- [x] `vite.config.ts` -- `fsModuleCache: true` in `test` (AD-17 budget, I-60).
- [x] Items with disposition **apply** in table I, one by one, each in the file named there.
- [x] Done plans -- the dated correction lines named in table I.
- [x] `_bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md` -- R-74 New game and R-74 Q-29 rows: CAP `3` → `3, 4` (I-24).
- [x] This plan -- Implementation Notes: before/after measurements (Design Notes M), config diff result, Vitest name superset check with rename map, Playwright list diffs with additions, each fold's old→new call map, every carry-forward row actually used, each failing-before/passing-after record.

**Acceptance Criteria:**
- Given the comparison set (dev; pwa PW_PREVIEW=dist and dist-test; screens in the container), each with CI unset and CI=1, when the B11 step lands, then `playwright test --list` output and the sorted-JSON dump of each config's default export are identical before and after it.
- Given the final tree, when each `--list` is compared with `/tmp/wc312/before/pw/*.list`, then it equals the start list plus the plan's listed additions under the rename map, nothing removed.
- Given an idle machine (load average recorded), when `npm test` runs once to warm and then 3 times, then the median Vitest Duration is < 5 s; and the median of 3 watch re-run Durations of `src/engine/view.test.ts` is < 1 s.
- Given the final tree, when the Vitest name list is compared with `/tmp/wc312/before/names.txt`, then it is a superset under the rename map, with no skip/todo.
- Given the final tree, when `npm run test:all` and `npm run test:screens` run, then both pass with no baseline file changed.
- Given table I, when the plan is read, then every inventory item has exactly one disposition, and every diff hunk maps to an item, B11/E9 or the AD-17 budget.

## Design Notes

### M. Measurements (before, start commit f496ae4)

Method: WSL2 /mnt/d checkout, no concurrent Playwright/Docker/build; load average 0.55 → 2.00 (1-min, start → end of the series). `npm test`: warm-up 6.62 s (discarded), runs 6.72 / 6.61 / 6.58 → **median 6.61 s** (min 6.58, max 6.72); 34 files, 1654 tests; transform 72 %. Per-file (`--reporter=json`, `/tmp/wc312/before/report.json`): architecture.test.ts 1.76 s, game.svelte.test.ts 0.92 s, deploy-check.test.mjs 0.85 s, nav.test.ts 0.55 s, **slowest engine file `src/engine/view.test.ts` 0.53 s**. Names: `/tmp/wc312/before/names.txt` (file :: fullName :: status).

Watch re-run: native watch gets no inotify events on drvfs /mnt/d (a `fs.watch` probe saw none), and `CHOKIDAR_USEPOLLING` starved the suite (nav.test timeouts). So `/tmp/wc312/watch-api.mjs` starts Vitest in watch mode through `startVitest('test', [], { watch: true })` and emits the watcher's own `change` event for the file, which is the path a real edit takes. view.test.ts re-run Durations 538 / 558 / 462 ms → **median 538 ms**. Informational: architecture.test.ts 1.53 / 1.61 / 1.45 s → median 1.53 s. Probe: `--fsModuleCache` gave cold 7.37 s, warm 4.16 / 4.25 / 4.38 s.

After: same method, plus one cold run (`rm -rf node_modules/.vitest-cache`) recorded beside the medians; watch re-run on the same file.

### P. Plan-level answers (review log, Unapplied minors)

- Watch clause "or if split the slowest successor": moot. `view.test.ts` is not split, and table I does not split architecture.test.ts (I-63).
- architecture.test.ts watch re-run (1.53 s) is over 1 s and informational only, so it goes in carry-forward row C-AD17W.
- Cold run beside the medians: yes (M). Per-file timings come from `--reporter=json` (done). Test identity after a split is `fullName` without the file path, under the rename map; no split is planned.
- Screens: `--list` runs inside the pinned container through `/tmp/wc312/screens-list.sh`, which runs `docker run … -e WORDCELL_SCREENS_CONTAINER=1 …` with `--list`, then `CI=1 npx playwright test -c playwright.screens.config.ts --list`. Config dumps run on the host with `WORDCELL_SCREENS_CONTAINER=1` (`/tmp/wc312/dump-config.sh`: esbuild bundle with packages external, then a sorted-JSON dump).
- New internal src/ module: not allowed (Never), so I-42 is carried forward.
- Observing seams: I-19 (main.ts halt order) uses a Playwright init script that wraps `console.error` and records `window.__wordcell?.current().kind` at call time, then triggers a fatal after boot. Before the fix it records `active`; after, `halted`. I-25 (flush) uses a shell Vitest test: read `game.view`, flush a won Session (or a 0 ms take), and assert `game.view` is the same reference while the write still happens.
- Computed-style gate: not needed, because the style fold is carried forward (I-42).
- Budget miss: commit the landed items, set status `blocked` with the medians, and add a C-AD17 row.
- pwa keeps its own `devices['Pixel 7']` (the ticket says it imports everything except the device map). The base module reads `process.env.CI` at import time; that is a read only and has no side effect, so it counts as "constants".
- Record load average beside each timing series. The AGENTS.md carry-forward rows (C-AG1, C-AG2) are due before epic 4 starts.

### I. Inventory dispositions

Sources: (a) `review-loop/3-N-build.md` Result minors, as `a3-5.2` = 3-5 item 2; (b)/(c) plans, by ticket number; (d) digest line; (e) epic 1 retro A8; (f) SPEC.review-log Pass 3. A = apply, N = no change, C = carry forward (row in the carry-forward list), R = already resolved.

| # | Item (sources) | Disp. | Action / reason |
|---|---|---|---|
| I-1 | AD-1 synthetic sources import `Card`/`deal` (a3-1.1) | A | `architecture.test.ts` ~861-952: use `CardId`/`createSession`; only the names change, every row's expected result stays the same |
| I-2 | fixtures name check "optionally" (a3-1.2) | N | 'optionally', and it closes no gap this plan names |
| I-3 | REBUILDS not linked to VALID (a3-1.3) | A | serialize.test.ts: an AD-17 test asserting the REBUILDS names equal VALID mapped to `session-${v}`; reword the comment |
| I-4 | GAVE_UP0 pair "optionally" (a3-1.4) | N | 'optionally'; ticket minimum met (3-1) |
| I-5 | commands row `R-38 R-36` vs ticket wording (a3-1.5; d L16) | N | intended deviation recorded in the plan 1 Design Notes; ticket 1 is done and read-only |
| I-6 | letter-count mismatch only for count > length (a3-2.1) | A | add `{ spelling: 'tans', letterCount: 3 }` reject row to the '§2 checkRecord rejects %s' table |
| I-7 | title '§2 a replay code wins over the headroom: …' (a3-2.2) | A | rename to what it checks, keeping `§2` (e.g. '§2 seed -1 with activeMs 2^52 + 1 is replay-failed'); add a correction line to plan 2 (it names "replay code wins") |
| I-8 | `view.ts` comment cites AD-3 (a3-2.3) | A | cite AD-2 |
| I-9 | impossible records parse (a3-2.4; plan 2 deferred; d L25) | C | C-OWN1 |
| I-10 | ticket 3 Undo/Redo wording (a3-3.1; d L44) | N | done ticket, read-only; build follows SPEC E1 (plan 3 Residual risks) |
| I-11 | smoke bottom→top DOM order only (a3-3.2) | A | `e2e/smoke.spec.ts:47`: also assert bounding-box y card-42 > card-0 > card-28 |
| I-12 | bare `toThrow()` (a3-3.3) | A | `toThrow('AD-4 load() while active')`, `…while rejected`, `'AD-4 dispatch while booting'`, `…while rejected` |
| I-13 | plan 4 R-74 row says history `null` (a3-4.1) | A | correction line, plan 4 |
| I-14 | plan 4 Tasks/Design Notes describe pre-patch code (a3-4.2) | A | correction line, plan 4 (`$state.raw`; too-short reason; render `$derived` in frame) |
| I-15 | measure-dispatch single-sample flags (a3-4.3) | A | add `summarise([1, 2, 16.01])` → flagged, median 2 |
| I-16 | e2e New game range-checks seed only (a3-4.4) | A | the stronger option would need a done-ticket AC change, so add a correction line to plan 4 recording that it relies on the AD-4 seed-stub Vitest |
| I-17 | plan 5 DN 3 throwing timer (a3-5.1) | A | correction line, plan 5 (`reportError`) |
| I-18 | font-timeout `timedOut` guard untested (a3-5.2) | A | blocking.spec: after the fatal, fulfil the held routes with 404 and assert the body keeps the timeout text (AD-15 name) |
| I-19 | `console.error` before `game.halt` (a3-5.5) | A | swap the order in `src/main.ts` `fatal()`; Playwright 'AD-15 a fatal halts the store before console.error reports it' (seam P) |
| I-20 | null `event.error` untested (a3-5.3; plan 5 `[defer]`) | A | blocking.spec: dispatch `new ErrorEvent('error', { message })`, assert the body is the message |
| I-21 | plan 5 halted-boot "no App mount" mapping (a3-5.4) | A | correction line, plan 5 (proven via entries 6 and 9) |
| I-22 | unit suite over budget (a3-5.7; plan 3 residual; plan 9 deferred; plan 11 notes; d L69, L141) | A | `fsModuleCache` (M); C-AD17 only on a miss |
| I-23 | halted-boot obligations moved to 6/9 (plan 5) | R | lifecycle.spec:232, game.svelte.test:961, dictionary.spec:279/305 |
| I-24 | rule-coverage R-74 rows CAP `3` (a3-5.6) | A | CAP `3, 4` |
| I-25 | flush() re-derive (a3-6.5; d L84) | A | assign `state` only on a changed reference; keep the unconditional write; Vitest 'AD-9 a flush that accrues nothing keeps the GameView reference' (seam P) |
| I-26 | 'R-76 New game starts at activeMs 0 …' label (a3-6.1) | A | rename to 'R-74 R-76 New game starts at activeMs 0 with the discarded take'; correction line, plan 6 |
| I-27 | hidden-load test reads bytes only (a3-6.2) | A | arm `armStorageSpy`; assert writes `[seeded]` then `[seeded, seeded + M]` per the minor |
| I-28 | whenVisible only on active store (a3-6.3) | A | add a rejected variant; add a halted variant only if `whenVisible` can be reached halted without `registerLifecycle` (else N: registerLifecycle throws while halted, game.svelte.ts:265) |
| I-29 | Q-38 persisted pageshow only after pageHide (a3-6.4) | A | add a no-pageHide variant (Q-38 name) |
| I-30 | flush overwrite race; throwing before-hide re-run (a3-6.6, 6.7) | N | as specified: AD-9 unconditional write; rule 6 |
| I-31 | plan 7 counts (a3-7.1; d L93) | A | correction line, plan 7 (1556 tests, 28 cases, two missing names) |
| I-32 | no Playwright Q-38 after own finish (a3-7.2) | A | lifecycle.spec: session-won.json, Undo, Redo, pageHide, pageShow persisted → active (Q-38 name) |
| I-33 | Q-39 (a) `expect.any(String)` (a3-7.3) | A | parse the history entry: one won record with the session-won.json seed |
| I-34 | load table missing history rejections (a3-7.4) | A | rows `history-invalid-null.json` (version-unreadable) and a contents-unreadable fixture (e.g. records-not-array), each with no history write |
| I-35 | `hitAt` vs nav inline probe (a3-8.1) | A | move `hitAt` to `e2e/helpers/` with a helpers.spec case; nav.spec uses it only if its asserted `name`/`dialog` stay equal (else the nav probe stays; reason recorded) |
| I-36 | nav.test stale-launch title (a3-8.2) | A | rename to '…, calls no back and keeps the count' |
| I-37 | no `aria-modal` assertion (a3-8.3) | A | assert `aria-modal="true"` in `expectNotice` and `openConfirm` (history-notice.spec) |
| I-38 | AD-13 spine notes: stale-entry push; stored wc > real history; Forward overlay; back between Delete history's pops (a3-8.4; plan 8 deferred and residuals) | C | C-SP1 |
| I-39 | Q-42 owner docs (a3-9 doc sync; plan 9 deferred) | C | C-OWN2 |
| I-40 | text.test QU case (a3-9.1) | A | `invalidWord('quit')` → `QUIT isn't in the word list.` |
| I-41 | dictionary Timeout banner unbounded (a3-9.2) | A | `toBeVisible({ timeout: 500 })` |
| I-42 | Dialog copies BlockingMessage card styles (plan 8 `[reject]`) | C | C-UI1 |
| I-43 | Q-42 in shell Vitest names (a3-9.3) | A | drop "(Q-42)" from the describe and two `it` names (shell renames may drop ids); correction line in plan 9 if it names them |
| I-44 | plan 10 matchMedia row (a3-10.1) | A | correction line, plan 10 |
| I-45 | prefs CSS mirror before mount unobserved (a3-10.2) | A | Playwright init-script MutationObserver: `--wc-base-ms` set when `#app` first gains a child (AD-16 AD-10 name) |
| I-46 | helpers.spec `.not.toBe('booting')` (a3-11.1) | A | `.toBe('active')` |
| I-47 | restore hidden-branch comment (a3-11.2) | A | arm `armStorageSpy` around `hidePage` (restore never arms it) and assert exactly one `wordcell:session` write; correct the comment |
| I-48 | plan 11 Auto Run 'Review' bullet and DN 6; residual risk 1 (a3-11.3, 11.4) | A | correction lines, plan 11 |
| I-49 | restore else branch hard-codes prefs (a3-11.5) | A | compare every seeded key from `c.seed` with `first.loaded[field]` |
| I-50 | R-84 first launch skips history (a3-11.6) | A | compare `first.loaded.history` with `c.seed.history` before the Undo |
| I-51 | copied `tokenColor`, `waitForDictionary` (plan 9 `[reject]`) | A | `tokenColor` → `e2e/helpers/`; `waitForDictionary(page, state)` → `e2e/helpers/restore.ts` beside `dictionaryReady`; replace the identical inline 'ready' waits in non-screens specs; helpers.spec cases |
| I-52 | copied `expectAnotherWindow`/`kind`/`stored` (plan 6, 7 `[reject]`) | A | new `e2e/helpers/blocking.ts`: `kind`, `expectOnlyButton`, `expectAnotherWindow`, `stored(page, key)` (key required; old no-key calls pass `SESSION`); helpers.spec cases. `expectFatal` stays (the copies assert differently) |
| I-53 | nav / history-notice copies `wc`, `notice`, `confirmDialog`, `button`, `expectLeaves`; four identical card-0 `open` (plan 11 Never; (c)) | A | fold into `e2e/helpers/` (card-0 open as `openBoard`); `openConfirm`, lifecycle `open`, `start`, `boardReady`, `hookReady` stay (different waits/assertions) |
| I-54 | prefs.spec local hook wrapper (plan 10 `[reject]`) | N | rejected in 3.10 triage as the local-wrapper pattern; its `open` folds under I-53 |
| I-55 | AGENTS.md type-export pitfall stale (plan 1 deferred; d L16; build-notes CAP-1) | C | C-AG1 |
| I-56 | AGENTS.md fixtures pitfall widening (plan 8 deferred; f Constraints) | C | C-AG2 |
| I-57 | board letters asserted only by screenshots (plan 1 deferred) | C | C-E4a |
| I-58 | SPEC/build-notes CAP-1 wording (plan 1 follow-ups; d L16) | C | C-SP2 |
| I-59 | `game.load()` throw blanks the page (plan 3 deferred) | R | ticket 5: `src/main.ts` boot halt → `showStandalone`; blocking.spec |
| I-60 | B11/E9 shared base; epic 1 A8 part 1 (e) | A | `playwright.base.ts` |
| I-61 | interim primary label / `R-74 R-73` (plan 4) | R | ticket 9: App.svelte primary label; game-store.spec:93 |
| I-62 | directory walkers (e A8) | A/N | inline walker in dist-smoke.spec → `walk` from `e2e/helpers/dist-test.ts` if its result is used order-insensitively (else N). architecture.test.ts and size-budget.mjs: N, because they differ in shape (root-prefixed list vs Map collector that skips `.vite`) and layer (scanned src test vs node script), and no shared location is importable by both without a new exemption |
| I-63 | architecture.test.ts split (e A8) | N | the retro accepted it; a split brings the scanner into the AD-1 scan or needs a new exemption, which AGENTS.md and the spine name; the budget is met without it (if it is missed, C-AD17) |
| I-64 | E8 sync max 6–10 ms (plan 4 residual); dispatch speed (d L53) | C / N | C-E7a; d L53: no change, under 16 ms (3.4) |
| I-65 | armStorageSpy refuses a second arm (plan 5) | N | no caller needs it (I-27 and I-47 arm once per Page) |
| I-66 | rule-coverage R-84 wording (plan 5 → 7) | R / C | same-task wording resolved (row 66, ticket 7); stale "init script" wording → C-SP3 |
| I-67 | gesture cancel / hidePage mid-touchDrag (plan 6) | C | C-E4b |
| I-68 | Q-29 Replay Playwright proof; statistics notice P4–6; Replay `resetForNewSession`; Escape invert; win smoke discrimination (plans 7, 8) | C | C-E6 |
| I-69 | §2 history notice with Reset (plan 7); unreadable-history dismisses notice (plan 7 residual) | R | ticket 8: history-notice.spec:120; history.spec:232 |
| I-70 | A-A11 back device check; 250 ms rewind; Q-42 SW Playwright (plans 8, 9; f last; d L111) | C | C-E7b |
| I-71 | entry 10 boot-order cases (plan 8 deferred) | R / A / N | "launch before font check": R (blocking.spec:146); "notice before mount": A, using the I-45 observer to record `history.state.wc` = 1 at the first `#app` child on an unreadable-history seed (AD-16 name); "after registerLifecycle": N, no page-observable seam without a new hook (AD-16 order in main.ts) |
| I-72 | spine AD-15 vs AD-8 timeout wording (plan 9) | C | C-SP4 |
| I-73 | startHidden one-request test (plan 9 `[reject]`) | R | dictionary.spec:324 |
| I-74 | `--wc-base-ms` unconsumed (plan 10) | C | C-E56 |
| I-75 | Spec review Pass 3 test minors: Q-38 two-page; CAP-5 not-persisted; `--wc-reduced`; kill variant; below-committed restore; replay-no-dictionary; New game prefs; headroom code; halted no fetch; createSession(1) removed; standalone haltCause (f) | R | blocking.spec:293, :329; lifecycle.spec:146; prefs.spec:139, :150, :56; game-store.spec:214; restore.spec:50; dictionary.spec:128, :279; errors.ts:29; game.svelte.ts:83 |
| I-76 | Spec review Pass 3 wording minors: E8 mechanics; CAP-1 0.75 s; CAP-4 intent wording (f) | R / C | E8 as built (scripts/measure-dispatch.mjs, 3.4); 0.75 s superseded by M; CAP-4 wording → C-SP2 |
| I-77 | spine Scaffold-deltas glob; build-notes CAP-11 departure (`use` narrowed to `trace`; screens keeps `retries: 0`) (ticket) | C | C-SP5 |

### Carry-forward list (for the epic 3 retrospective)

| Row | Item | Target / owner | Reason |
|---|---|---|---|
| C-OWN1 | Reject impossible records (no-word win, q without u, > 23 letters) | Jared | data-rule decision |
| C-OWN2 | Q-42 retry-in-place wording in §9 Q-42, AD-8 Load, EXPERIENCE Dictionary failed, rule-coverage Q-42 row | Jared / spine owner | owner docs |
| C-SP1 | AD-13 stale-launch edges (I-38) | spine owner | spine wording |
| C-SP2 | SPEC/build-notes CAP-1 (B6 named test, main.ts reads view, noLib) and CAP-4 intent wording | spec owner | SPEC wording |
| C-SP3 | rule-coverage R-84 "init script" → "armStorageSpy after boot" | spec owner | wording, no id/CAP change |
| C-SP4 | AD-15 says font timeout throws "like AD-8"; AD-8 maps to failed | spine owner | spine bug |
| C-SP5 | Scaffold deltas tsconfig.e2e glob add `playwright.base.ts`; build-notes CAP-11 departure | spine / spec owner | doc wording |
| C-AG1 | AGENTS.md: type exports are checked by architecture.test.ts | bmad-project-context / Jared, before epic 4 | AGENTS.md is not hand-edited |
| C-AG2 | AGENTS.md: History-notice flows may seed `history-invalid-*` | bmad-project-context / Jared, before epic 4 | same |
| C-UI1 | Dialog/BlockingMessage shared card styles | epic 5 (UI) | needs a new src/ module or global class; strict Interface reading |
| C-AD17W | architecture.test.ts watch re-run > 1 s (informational) | spine owner (AD-17 watch scope) | the gate is on the engine file |
| C-E4a, C-E4b | DOM board-letter assertions; gesture cancel on hide | epic 4 | board and gestures land there |
| C-E6 | I-68 items | epic 6 | end screen, Replay, keyboard map |
| C-E7a, C-E7b | E8 device figure; A-A11 back, 250 ms rewind, Q-42 SW P7 | epic 7 | device checks |
| C-E56 | stylesheets consume `--wc-base-ms`/`--wc-reduced` | epics 5/6 | motion lands there |

## Verification

**Commands:**
- `/tmp/wc312/snap.sh <dir>`, `/tmp/wc312/screens-list.sh <dir>`, then `diff -r` against the pre-B11 dir -- expected: no difference
- `npm test` ×4 (first discarded) plus one cold run; `node .wc-watch.mjs src/engine/view.test.ts` (copy of `/tmp/wc312/watch-api.mjs`, removed after) -- expected: medians < 5 s and < 1 s
- `npx vitest run --reporter=json` name list vs `/tmp/wc312/before/names.txt` -- expected: superset under the rename map
- `npm run test:all` and `npm run test:screens` -- expected: green; `git status` shows no `e2e/**/*-snapshots/**` change

## Implementation Notes

- **B11/E9 (AC 1).** `playwright.base.ts` exports `fullyParallel`, `forbidOnly`, `retries` (CI 2 / 0), `reporter`, `use` (`{ trace }`) and `deviceProjects` (android `Pixel 7`, desktop `Desktop Chrome`); dev and screens spread `use` and take `deviceProjects`, pwa takes everything but `deviceProjects`, screens keeps `retries: 0`; `tsconfig.e2e.json` includes `playwright.base.ts`. No config, e2e or tsconfig file changed before the step, so the start-commit snapshot `/tmp/wc312/before/pw` is the pre-B11 snapshot. Immediately after the step (`/tmp/wc312/after-b11`): `diff -r` of the 8 sorted-JSON config dumps and the 6 host `--list` files (dev; pwa dist and dist-test; each CI unset and CI=1) is empty; the container `--list` for screens (CI unset and CI=1) is identical; pwa without `PW_PREVIEW` still throws its own guard. Final tree (`/tmp/wc312/final`): all 8 config dumps still identical to the start commit.
- **Playwright list diffs (AC 2),** compared with line numbers stripped: pwa dist / dist-test lists unchanged; screens unchanged (2 tests). Dev list 332 → 354 tests (CI unset and CI=1 identical diffs): 11 additions per project (android and desktop; the desktop copies skip as their specs do) and 1 rename, nothing removed. Additions: blocking.spec `AD-15 fatal handler` › `AD-15 a font load settling after the 30 s timeout reports nothing more` (I-18), `AD-15 an error event without an error object gives its message as the fatal body` (I-20), `AD-15 a fatal halts the store before console.error reports it` (I-19); lifecycle.spec `Q-38 a persisted pageshow right after an own dispatch (no pageHide) stays active` (I-29), `Q-38 a persisted pageshow after an own finish (wordcell:history written) stays active` (I-32); prefs.spec `AD-16 AD-10 the motion variable is set before App mounts` (I-45); history-notice.spec `AD-16 the History notice entry is pushed before App mounts` (I-71); helpers.spec `AD-17 openBoard waits for card 0; waitForDictionary …`, `AD-17 tokenColor resolves …`, `AD-17 kind and stored read …`, `AD-17 wc, button and hitAt read a healthy board; expectLeaves goes back from the base entry to about:blank` (I-35, I-51–I-53; no `*-invalid-*` fixture is seeded; `notice`/`confirmDialog` are exercised by history-notice.spec and nav.spec). Rename map: `R-76 New game starts at activeMs 0 with the discarded take` → `R-74 R-76 New game starts at activeMs 0 with the discarded take` (I-26; correction line in plan 6).
- **Vitest names (AC 4).** 1654 → 1664 tests, all passed, no skip/todo; the start list is a subset under this rename map: architecture.test.ts `AD-1 fails: UI inline import { type Card } (src/ui/x.ts)` → `… { type CardId } …` (I-1, no plan names it); serialize.test.ts `§2 a replay code wins over the headroom: seed -1 with activeMs 2^52 + 1` → `§2 seed -1 with activeMs 2^52 + 1 is replay-failed` (I-7, correction line in plan 2); dictionary.svelte.test.ts describe `AD-8 dictionary retry (Q-42) under a controlling service worker` → `AD-8 dictionary retry under a controlling service worker` and its two `AD-8 (Q-42) after a 404, …` → `AD-8 after a 404, …` (I-43; plan 9 names none of them); nav.test.ts `AD-13 a stale-launch popstate closes nothing and calls no back` → `…, calls no back and keeps the count` (I-36; plan 8 names it not). Additions: REBUILDS ↔ VALID (I-3), `'tans' 3` row (I-6), summarise `[1, 2, 16.01]` (I-15), flush ×3 (I-25: two accrue-nothing cases plus 'AD-9 a flush that accrues time assigns a new game.state with the written Session'), whenVisible rejected and halted-after-registerLifecycle (I-28), history-invalid-null and history-invalid-records-not-array load rows (I-34).
- **Unit-suite budget (AC 3), after**, same method as M, load average 2.42 → 3.75 (1-min; the machine was otherwise idle, the load is the series itself): cold run (`rm -rf node_modules/.vitest-cache`) 7.78 s; `npm test` warm-up 4.36 s (discarded), runs 4.55 / 4.29 / 4.21 → **median 4.29 s** (min 4.21, max 4.55; before 6.61 s); 34 files, 1663 tests (before the review fixes added one flush case). Watch re-run of `src/engine/view.test.ts` (copy of watch-api.mjs as `.wc-watch.mjs`, removed after; Vitest's own re-run Duration lines, as in M): 478 / 451 / 459 ms → **median 459 ms** (before 538 ms), load 2.22. Informational: architecture.test.ts 1.50 / 1.49 / 1.55 s → median 1.50 s (C-AD17W). Lever: `fsModuleCache` only; no pool, `isolate` or noLib/skipLibCheck change. The script's own wall-clock RERUNS (emit → run end) read ~1.0 s for view.test.ts at both the start commit (stashed tree, same load) and the final tree, so the wall-clock overhead is watcher/reporter time, not this change; the budget figure is Vitest's Duration.
- **Failing before / passing after.** I-19: `AD-15 a fatal halts the store before console.error reports it` (records the store kind only for `console.error` calls whose first argument is the `AD-15 halt order` Error) failed on the start code (recorded kinds `["active"]`), passes after swapping `game.halt` before `console.error` in `src/main.ts` `fatal()`. I-25: both `AD-9 a flush that accrues nothing keeps the game.state reference (…)` failed on the start code (`game.state` a new object), pass after `flush()` assigns `state` only when `accrue` returned a new Session (the write stays unconditional); the accruing case fails if the assignment is dropped. Seam P deviation: under Vitest the `.svelte.ts` store compiles for the server, where `$derived` re-derives on every read (a probe read `game.view` twice with no change and got two objects, also inside a `toStore` subscription), so `game.view` identity is unobservable there; the test asserts the reference of `state`, `currentView`'s only dependency. Discrimination checks (not src changes): I-18 fails with the `timedOut` guard removed from the catch (body becomes `A network error occurred.`); I-45 and I-71 fail with `prefs.load()` / `openHistoryNotice()` moved after `mount(App)` (`""` and `0`).
- **I-45 / I-71 observer deviation:** instead of a MutationObserver, the init script wraps `Node.prototype.appendChild` and records at the first append into `#app` (Svelte's `mount` appends its anchor there). A MutationObserver callback runs only after the whole synchronous boot task, so it could not order `prefs.load()` or `openHistoryNotice()` against `mount(App)`; the synchronous wrap can, as the discrimination checks show.
- **I-28:** `whenVisible` is reachable while halted after a successful `registerLifecycle()` (halt arrives later), so the halted variant was added (not N); halted-before-registerLifecycle stays unreachable (`registerLifecycle` throws, game.svelte.ts).
- **Fold call map (I-35, I-51, I-52, I-53, I-62); every wait and assertion is unchanged in predicate:**
  - `e2e/helpers/blocking.ts` (new): `kind`, `stored(page, key)`, `expectOnlyButton`, `expectAnotherWindow`. blocking.spec: local copies removed; `stored(page)` / `stored(page1)` ×5 → `stored(page, SESSION)`. lifecycle.spec: local `kind`, `stored(page)` (fixed SESSION) ×2 → `stored(page, SESSION)`, `expectAnotherWindow` (its inlined two button assertions are `expectOnlyButton(page, 'Reload')`'s). history.spec and history-notice.spec: local `stored(page, key)` → helper. `expectFatal` stays per spec.
  - `e2e/helpers/dialogs.ts` (new): `NOTICE_TITLE`, `CONFIRM_TITLE`, `NavState`, `wc`, `notice`, `confirmDialog`, `button`, `expectLeaves`, `hitAt`. nav.spec and history-notice.spec import them (titles aliased `TITLE`/`CONFIRM`); history-notice's `hitAt` moved verbatim. nav.spec's inline elementFromPoint probe → `hitAt`, asserting `{ kind: 'button', name: 'Reset history', dialog: TITLE }` (its `name` and `dialog` expressions are hitAt's, so the asserted pair is equal and `kind` is added). `openConfirm`, nav `start`/`boardReady`, history-notice `start`, lifecycle `open`, blocking `hookReady` stay (different waits/assertions).
  - `e2e/helpers/restore.ts`: `openBoard` (goto `/` then card-0 visible) replaces the identical local `open` of history.spec (×10 calls), dictionary.spec (×8), history-notice.spec (×1, via `start`), prefs.spec (×8). `DictionaryState` and `waitForDictionary(page, state)` moved from dictionary.spec; `dictionaryReady` now calls `waitForDictionary(page, 'ready')` (same predicate). Inline `waitForFunction(() => …dictionaryState() === 'ready')` → `waitForDictionary(page, 'ready')` in blocking.spec ×1, history.spec ×3, nav.spec ×1; game-store.spec's parameterised `waitForFunction((expected) => … === expected, state)` → `waitForDictionary(page, state)`.
  - `e2e/helpers/style.ts` (new): `tokenColor` from game-store.spec and dictionary.spec (identical).
  - dist-smoke.spec's inline walker → `walk` (dist-test.ts): its result is used only through `toContain`, `some` and a `filter` expected empty, so order and separator normalisation do not matter.
- **Other applied items:** I-1 synthetic sources in architecture.test.ts (lines ~861-974, plus the same pattern at the UI-test and markup cases ~1544/1672) use `CardId`/`createSession`, every expected result unchanged; I-3 comment reworded in architecture.test.ts; I-8 view.ts cites AD-2; I-11 smoke.spec y order 42 > 0 > 28; I-12 four `toThrow` messages; I-27, I-33, I-37 (history-notice.spec `expectNotice`/`openConfirm` and nav.spec `openConfirm`), I-40, I-41, I-46, I-47, I-49, I-50 as table I; I-24 rule-coverage R-74 New game and R-74 Q-29 rows CAP `3, 4`; I-22/I-60 `fsModuleCache: true` in vite.config.ts.
- **Correction lines** (dated 2026-10-01 (3.12), end of each plan's Implementation Notes): plan 2 (I-7), plan 4 (I-13, I-14, I-16), plan 5 (I-17, I-21, and one for I-19: Design Notes 1 lists the old `console.error`-first order), plan 6 (I-26), plan 7 (I-31), plan 10 (I-44), plan 11 (I-48 ×2, and one for I-47: the Plan Change Log's claim about the `after.loaded.session` equality).
- **Verification (AC 5):** `npm run test:all` exit 0 (lint, check 0 errors, unit 1663 passed in 4.53 s (1664 after the review fixes), build + size budget, `test:e2e:dist` 13 passed, `test:e2e` 183 passed / 173 skipped (before the coordinator's review fixes, which removed one helpers.spec case per project) (android-only specs on desktop), `test:e2e:pwa` 12 passed). `npm run test:screens` 2 passed; `git status` shows no `e2e/**/*-snapshots/**` change.
- **Carry-forward rows used:** C-OWN1, C-OWN2, C-SP1, C-SP2, C-SP3, C-SP4, C-SP5, C-AG1, C-AG2, C-UI1, C-AD17W, C-E4a, C-E4b, C-E6, C-E7a, C-E7b, C-E56. C-AD17 not needed (both medians meet their budgets). No new or strengthened test failed on current code beyond I-19 and I-25, which were fixed in src/.

- **Orchestrator verification (step 3, 2026-10-01).** Re-measured on the final tree, nothing else running (the load average 2.4 → 5.6 comes from the suite's own workers; the before series rose the same way, 0.55 → 2.00): cold run (`node_modules/.vitest-cache` removed) 7.15 s; `npm test` warm-up 4.27 s (discarded), runs 4.46 / 4.23 / 4.33 s → **median 4.33 s** (min 4.23, max 4.46), 1663 tests. Watch re-run of `src/engine/view.test.ts` 464 / 454 / 472 ms → **median 464 ms**; architecture.test.ts 1.49 / 1.50 / 1.52 s (informational, C-AD17W). Lint, check, unit, build, test:e2e:dist (13), test:e2e (183 passed, 173 skipped), test:e2e:pwa (12) and test:screens (2) all green; no snapshot file changed. Config dumps for all 8 variants are identical to the start commit. The `--list` diffs are only the listed additions plus the I-26 rename; the screens lists (container, CI unset and CI=1) are unchanged. The Vitest names missing from the start list are exactly the five renames in the map above. Matrix: the config rows are checked by the dump and list comparison, the pwa guard by helpers.spec `AD-17 a missing build … unset or unknown PW_PREVIEW throws`, flush by the I-25 Vitest pair, and fatal by the I-19 Playwright test.

- **Orchestrator verification after review patches (2026-10-01).** Load average 0.96 when the series started. `npm test` warm-up 4.35 s (discarded), runs 4.26 / 4.34 / 4.32 s → **median 4.32 s** (min 4.26, max 4.34), 1664 tests. Watch re-run of `src/engine/view.test.ts` 466 / 462 / 467 ms → **median 466 ms**. Lint, check, unit, build, test:e2e:dist (13), test:e2e (182 passed, 172 skipped), test:e2e:pwa (12) and test:screens (2) all green; no snapshot changed. Config dumps for all 8 variants are identical to the start commit. Dev `--list` (CI unset and CI=1): 11 additions per project plus the I-26 rename, nothing else removed; pwa and screens lists unchanged.

## Plan Change Log

## Review Triage Log

### 2026-10-01 — Review pass
- verdicts: 21 findings — high 0, medium 1, low 13, false 7, maybe-false 0
- findings:
  - `[low]` `[reject]` (blind) The new `appendChild` init script is copied into prefs.spec and history-notice.spec — real, but two 12-line test-local probes. Folding them needs a new helper plus a helpers.spec case, more than a direct correction, and developers seldom meet it.
  - `[low]` `[patch]` (blind) The I-25 titles claim "GameView is not re-derived" but assert only `game.state` — titles renamed to say what they check.
  - `[low]` `[patch]` (blind) No shell test for the accruing branch of `if (accrued !== state.session)` — added an AD-9 case: a non-zero take gives a new `state` whose activeMs equals the written Session's.
  - `[low]` `[patch]` (blind) The I-19 test records every `console.error` — it now records only calls whose argument is the thrown 'AD-15 halt order' Error.
  - `[low]` `[reject]` (blind) `stored()` sits in `e2e/helpers/blocking.ts` — placement only, and no caller is harmed; moving it is churn.
  - `[low]` `[patch]` (blind) The whenVisible table takes its expected kind from the row-name string — the expected kind is now data in each tuple.
  - `[false]` `[reject]` (blind) `playwright.base.ts` shares mutable `use`/`deviceProjects` between configs — each Playwright run loads exactly one config, so no two importers share an instance in one process. The resolved dumps for all 8 variants are identical.
  - `[low]` `[reject]` (blind) Measurement scripts live in /tmp, not in the repo — the fix is to edit this plan or add files outside the inventory. Their methods are described in Design Notes M/P.
  - `[low]` `[reject]` (blind) The watch method departs from `npm run test:watch` (no inotify on drvfs) and is not a carry-forward row — the fix edits this plan. It is recorded under Auto Run Result residual risks for the owner.
  - `[false]` `[reject]` (blind) The budget is met only with a warm cache — the ticket names `fsModuleCache` as a lever and defines the budget as the median after a discarded warm-up. The cold run is recorded beside it, and the residual risk is noted under Auto Run Result.
  - `[false]` `[reject]` (blind) Frontmatter vs body (empty logs, `deferred: []`) — the logs are filled by this step. Carry-forward rows are ticket dispositions, not review deferrals.
  - `[low]` `[patch]` (blind) aria-modal is asserted only in history-notice.spec's copies — added to nav.spec's `openConfirm`.
  - `[low]` `[reject]` (blind) Timings not shown idle — the orchestrator re-measured on its own with nothing else running, and the rise is the suite's own workers, the same as in the before series. A final re-measure after these patches is recorded in Implementation Notes.
  - `[low]` `[reject]` (blind) Table I still says MutationObserver for I-45/I-71 — the fix edits this plan. The departure is recorded in Implementation Notes.
  - `[false]` `[reject]` (intent 1) Warm vs cold budget surface — same refutation as the warm-cache row above (reading A1 is licensed by the ticket's lever list).
  - `[low]` `[reject]` (intent 2) Watch measured by an injected watcher event — same as the watch-method row above (plan-level).
  - `[low]` `[patch]` (intent 3) I-25 proves `state` rather than GameView — same root cause and fix as the I-25 title row.
  - `[false]` `[reject]` (intent 4) Style-fold gate not run — the ticket requires the gate only before folding. It carries the item forward otherwise, which I-42 does.
  - `[medium]` `[patch]` (intent 5) helpers.spec seeds `history-invalid-version-unknown.json` outside a §2 rejection test (AGENTS.md fixtures pitfall) — the helpers.spec dialog cases now run on a healthy board with no `*-invalid-*` seed. `notice`/`confirmDialog` stay exercised by history-notice.spec and nav.spec, under the existing History-notice practice (C-AG2).
  - `[false]` `[reject]` (intent 6) Base module shape (`use` object, CI read at import) — a naming choice. The resolved configs and lists are identical (P records the env read).
  - `[false]` `[reject]` (intent 7) The dump is of the evaluated default export, not Playwright's FullConfig — the AC names the "resolved default export", which is what was dumped. `--list` identity covers Playwright's own resolution.

## Auto Run Result

- **Summary:** Epic 3 refactor sweep. Every inventory item I-1…I-77 has one disposition. `playwright.base.ts` is shared by the three configs (B11/E9), and their resolved exports and `--list` output are unchanged. Vitest `fsModuleCache` brings the unit suite from a 6.61 s to a 4.32 s median, and the `view.test.ts` watch re-run from 538 ms to 466 ms. Two src fixes, each with a test that fails before and passes after: `main.ts` halts before `console.error` (I-19), and `flush()` keeps `state` when nothing accrued (I-25). Identical e2e helper copies are folded into `e2e/helpers/` (`blocking.ts`, `dialogs.ts`, `style.ts`, `restore.ts` additions) with helpers.spec cases. The remaining test-strengthening minors are applied. Dated correction lines go into done plans 2, 4, 5, 6, 7, 10 and 11, and rule-coverage R-74 rows get CAP `3, 4`. Seventeen carry-forward rows are listed for the epic 3 retrospective, including AGENTS.md C-AG1/C-AG2, due before epic 4.
- **Files:** `playwright.base.ts` (new shared settings); `playwright.config.ts`, `playwright.pwa.config.ts`, `playwright.screens.config.ts` (import the base); `tsconfig.e2e.json` (include the base); `vite.config.ts` (`fsModuleCache`); `src/main.ts` (halt before report); `src/shell/game.svelte.ts` (flush assigns only a changed Session); `src/engine/view.ts` (comment cites AD-2); tests in `src/architecture.test.ts`, `src/engine/serialize.test.ts`, `src/shell/game.svelte.test.ts`, `src/shell/nav.test.ts`, `src/shell/dictionary.svelte.test.ts`, `src/ui/text.test.ts`, `scripts/measure-dispatch.test.mjs`; e2e specs blocking, dictionary, game-store, helpers, history, history-notice, lifecycle, nav, prefs, restore, smoke, pwa/dist-smoke, plus new helper modules; done plans (correction lines); `rule-coverage.md` (CAP column).
- **Review:** 4 lenses (blind-hunter, edge-case-hunter, verification-gap, intent-alignment); 21 findings. Patched: 1 medium (helpers.spec seeding a `*-invalid-*` fixture) and 5 low (I-25 titles, accruing flush test, I-19 filter, whenVisible data, nav aria-modal). Deferred: none. Rejected: 15, each with its reason in the Review Triage Log (7 false; 8 low that were plan edits, placement or churn).
- **Follow-up review recommended:** false (patched: high 0, medium 1, low 5).
- **Verification:** see the two orchestrator verification notes in Implementation Notes. All of test:all's suites and test:screens are green, both medians meet budget, the config and list comparisons hold, and the Vitest names are a superset under the rename map.
- **Residual risks:**
  - The 4.32 s median depends on a warm `node_modules/.vitest-cache`. A cold run (fresh `npm ci`, CI) takes 7.15–7.78 s, above the 6.61 s before.
  - On the /mnt/d drvfs checkout, `npm run test:watch` gets no file events and never re-runs on edit. The watch figure was taken by emitting Vitest's watcher `change` event (Design Notes M), and its wall clock is about 1.0 s against the 466 ms Vitest Duration.
  - The owner may want an AD-17 note covering both points, alongside C-AD17W.

