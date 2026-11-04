---
title: 'Deflake the success-signal drag test (D-65)'
type: 'bugfix'
ticket: 13
created: '2026-11-03'
status: 'built'
route: 'oneshot'
route_source: 'auto'
baseline_revision: '84df83ff4ac64715ae6fb608dc5c6f8bcb8c1f45'
review: 'quick'
review_source: 'auto'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: true
context: []
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** D-65 (ticket 7.10's sweep): `R-73 (UI) Success signal (epic Done when 3): the same move by drag …` (`e2e/success-signal.spec.ts`) has failed intermittently under full-suite load. The one surviving failure output (`.autopilot/20261014-2230/6.1-T-attempt1.log:1361`) shows the Validate tap in `validateAndRetarget` (steps 5–6, after step 4's tile reorder) not taking effect: the stored cursor stayed `{ index: 1, phase: "composing" }` for the 5 s poll.

**Approach:** Follow ticket Scope items 3–6. Record before-counts (item 4), diff the failing path against the 6.1 tree, then test named mechanisms with temporary, reverted, test-side injections (item 5). A test-side fix lands only with both halves of item 5's proof. Otherwise the plan records the outcome that applies (Reproduces, Never reproduces, or a fix-ticket proposal) with its counts and evidence. Item 1's boundary holds: no `src/` or Playwright config edit, no `test.skip`/`fixme`/retries, no title, step, literal or check change.

</intent-contract>

## Outcome

**Never reproduces** (ticket Scope item 5). No R-73 test failed in this build's uninjected runs: the isolated ×50, three counted runs, three diagnostic runs (16 workers; the 6.1 run's drvfs trace output, isolated and full suite) and the final `test:all` (see item 4). No injection showed the mode. Two named mechanisms were refuted by injection at 84df83f: a late touchEnd turning the tap into a long press, and the Validate button moving under the tap. The long-press refutation carries to 03824f1 (same Playwright, hence Chromium); the layout one holds for 84df83f only. A third, an AD-15 fatal halt, is contradicted by the 6.1 log; a Q-38 `another-window` halt has no trigger in this test. CPU throttling did not show the mode either; its only failures were 30 s budget exhaustion. No test or helper was edited. Per item 5, a later sighting gets a new B8 fix ticket that cites this ticket and this plan.

## Implementation Notes

Oneshot route: the investigation found no cause, so there is no code change (0 lines). Everything below is the ticket's evidence record. Build start commit (baseline): `84df83ff4ac64715ae6fb608dc5c6f8bcb8c1f45`. All runs: `/mnt/d` checkout, Node 24, CI unset (retries 0, `playwright.base.ts`), 16 cores. Logs and the injection generator are copied to `~/wordcell-traces/7.13/`. Nothing there is committed.

### Item 3: evidence and the 6.1 tree

- Failure output: `.autopilot/20261014-2230/6.1-T-attempt1.log:1361-1412`. The test was `[android] e2e/success-signal.spec.ts:440:3`, in `expectStep` (`:145`) ← `validateAndRetarget` (`:383`) ← the test (`:475`). Expected cursor `place`, `reached: place`, `targetCell: 4`, `placementOrder [1, 28, 9, 48]`. Received cursor `{ index: 1, phase: "composing" }`, `reached: composing`, `targetCell`/`placementOrder` undefined, after "Timeout 5000ms exceeded". Its trace (`test-results/…/trace.zip`, log :1404) does not survive.
- 6.1 run's commit: **`03824f12f3f19e9e544d369d9934e80facbafc39`** (`fix(ui): WIP code review pass 2 (ticket 6.1)`, 23:36:40). The log was written at 23:44:03, before `0dd0c15` (23:51:05). This confirms the review log's guess.
- Diff of the failing path, `03824f1..84df83f`:
  - `e2e/success-signal.spec.ts`: unchanged.
  - `e2e/helpers/board.ts`: `tapAt`, `centre`, `box` and `glidesSettled` unchanged. Only `openFixture` gained the end-sheet and history options, which are inert for this fixture.
  - `e2e/helpers/touch.ts`: `touchHold` unchanged; `doubleTap` was added.
  - `playwright.base.ts`: the OS-temp `outputDir` only. `playwright.config.ts`: `outputDir` and the `WORDCELL_APP_VERSION` env. `playwright.pwa.config.ts` and `playwright.screens.config.ts` are not on this path.
    - The `outputDir` change does alter the run condition. The 6.1 run wrote traces to repo-local `test-results/` on the drvfs checkout, which `09285b2`'s comment says stalled context teardown under 8 workers. This build's runs write to OS temp.
    - So two diagnostic runs added that condition back with the `--output=test-results` CLI option, with no config edit (item 4).
  - `src/ui/ActionBar.svelte`: `validate`/`confirm` moved to `src/ui/commands.ts`, with `closeTransient()` and `dispatchAnnounced` added; the button's enablement is unchanged.
  - `src/ui/open-surface.ts`: `closeTransient()` is new and is the first call in `validate()`. It closes a sticky view, a peek or hover peek, then pops a tail selection. See item 5.
  - `src/ui/announce.ts` (new, 6.13): `dispatchAnnounced` replaces `game.dispatch` at every UI call site. It runs one `required(game.view, …)` check before `game.dispatch` and the announcement after it. See item 5.
  - `src/ui/motion.ts` (+225; `play()` calls its `install`, and flip's settle its `whenOpenAllowed`): the 6.12 Undo hold and lost-end handling of the winning guard, and the AD-19 celebration timings. Its tracker still consumes an event only with the guard installed or a click owed by a consumed pointerup, and the guard installs only on a `won` result. Nothing wins before Confirm, so it is inert for this flow.
  - `src/ui/gestures/controller.ts`: +123 lines (6.11 key activation, 6.14 wheel). The enabled-button press path is unchanged: `resolve` returns `null` for `button:enabled`, before any new press field is set. Step 4's drag commit in `pointerup`:
    - `dispatchAnnounced` replaces `game.dispatch` (above).
    - `rescroll()` runs first. It is a no-op here: `drag.scroll` is set only for a mouse press.
    - A new `p.celebrating` guard returns early only for a press begun under the celebration; none runs before Confirm.
    - `cancel()` is now `settle(false, …)`, with the same steps.
  - `src/ui/gestures/tile-drag.ts`: `move` adds the page scroll since the drag start (6.14 F3). For a touch drag `scrolled` is 0, so it is unchanged here.
  - `src/ui/Tray.svelte`, `src/ui/tray/TileRows.svelte`, `src/ui/tray/ControlRow.svelte`: inert for this flow.
    - Tray: an `inert` prop (true only with the end sheet expanded), the idle pending-draft line and the end bar (won or gaveUp only).
    - TileRows: the 6.11 roving tab stop, the 6.13 tile names and the A-D4 grown area (compact mode only).
    - ControlRow: `setK`/`flip` moved to `commands.ts`; tooltips only on a desktop (`hoverFine`).
  - The test's own `src` imports. `src/ui/layout/tray.ts` changes only compact mode (`area` grows by `trayGrowth`). Card mode is unchanged, and this flow's 4 tiles stay in card mode: the Pixel 7 tray row holds 7 tiles (`cardMetrics`, `trayLayout`). `src/ui/gestures/targeting.ts` only adds `inStartFrame`; the test imports only its `Rect` type.
  - The files that place the Validate button. These differ from 6.1, so the item 5 `probe` reading holds for 84df83f only.
    - `src/ui/Board.svelte` (places `ActionBar`): 6.11 focus-follow, and `inert` bands while the end sheet is expanded. Its focus moves use `preventScroll: true` (`focus-board.ts`).
    - `src/ui/App.svelte`: the 6.13 live region; the menu, end sheet, celebration and panels rendered beside `main`; `main` inert under `SUSPENDING` except the celebration. None is open before Confirm.
    - `src/ui/TopBar.svelte`: the ☰ button in the old 44 px menu slot; the timer only with Show timer on (default off).
    - `src/ui/app.css`: the theme token blocks, table art, the focus ring and the shared dim and used styles. No size or position rule changed.
  - `src/main.ts` (+143): `fatal()` now calls `clearTheme()` between `game.halt` and `console.error`. The rest is boot: themes, keys, the celebration seam, the worker outside dev, `requestPersistence`. At 6.1, `fatal()` calls `console.error` right after `game.halt`.
  - `src/ui/flip.ts` (the Validate click's `capture()`/`play()`): a 134-line refactor.
    - It adds `found(…)` lookups, which throw, for the tile area and each glide's rects.
    - It adds the `deps.dispatched` settle wiring for ticket 6.6's end sheet.
    - It removes the R-52 used-mirror hold (`mirrors` in `measure()`, `inFlightUsed`, `inFlight.used`).
    - It adds `lifts()`: a tray translate that starts outside `.tiles` lifts the tile-area clip too, where 6.1 lifted it only on `bandChange`.
    
    None of these can skip or delay `game.dispatch` in `validate()`. `capture()` is synchronous and returns or throws; a throw is covered by the 6.1 log check (item 5). `lifts()`, the hold and the settle wiring run in `play()`, after `dispatch` has written storage.
  - `src/ui/act.ts`: only `cancelGesture`/`activateHit` were added; `act()` itself is unchanged.
  - `src/shell/game.svelte.ts`: only the `elapsedMs` accessor was added; `dispatch` is unchanged.
  
  Other `src/ui/` files changed too (e.g. `Card.svelte`: 6.11/6.13 focus and names, the Q-49 preview mirror). They are not on the tap path above. The test, its helpers, `act()` and `dispatch` are unchanged since 6.1. The rest of the path did change, so the item 5 code read holds only for the current tree. The 6.1 log's client-error check (item 5) covers the 6.1 tree directly.
- Sightings: three distinct ones.
  - 6.1 `test:all`: the log above. Game-surfaces retro F-13 ("once", digest 6.1) is this same sighting.
  - Win-trigger plan :101: a `test:all` that also had the `nav.spec.ts` double-tap flake. No step named.
  - 7.9 plan :108 run 1: "drag step". No output survives, so it may be a different step.
  
  Only the first has a failing step, and none has a trace.
- Run load: the counted runs are android-only (903 tests, about 4.2 min) and lighter than `test:all`'s `test:e2e` (both projects). That is why the 16-worker diagnostic run, the CPU-throttling injections and the final `test:all` were added.

### Item 4: reproduction counts (baseline 84df83f, no fix)

| Run | Command | Result |
| --- | --- | --- |
| Isolated | `npx playwright test e2e/success-signal.spec.ts -g "the same move by drag" --project=android --repeat-each=50` | **0/50** failed (50 passed, 1.1 min) |
| Counted 1–3 | `npx playwright test --project=android --reporter=line` ×3 | **0/3**: each exit 0, 903 passed, 225 skipped, 0 failed (4.1–4.2 min). `success-signal.spec.ts:397` (tap-only) and `:440` (drag) ran and passed in all three. No D-64, D-71 or other failure. |
| Diagnostic (uninjected, extra load) | `npx playwright test e2e/success-signal.spec.ts --project=android --repeat-each=100 --workers=16` | 0/200 failed (both R-73 tests ×100) |
| Diagnostic (uninjected, 6.1 I/O condition) | the isolated command plus `--output=test-results` (traces on drvfs, as at 6.1) | 0/50 failed (1.7 min, against 1.1 min with OS-temp output) |
| Diagnostic (uninjected, 6.1 I/O condition, both projects as `test:e2e`) | `npx playwright test --output=test-results --reporter=line` | Exit 1 in 15.4 min: 1156 passed, 1095 skipped, 5 failed. Both R-73 tests ran and passed on android. Each of the 5 failures was `Tearing down "context" exceeded the test timeout of 30000ms`, the drvfs trace-I/O stall that `09285b2` moved `outputDir` to OS temp for: `surfaces-success.spec.ts:70` (android), `celebration.spec.ts:870`, `celebration.spec.ts:894`, `confirm.spec.ts:218` and `drag-interruptions.spec.ts:693` (desktop). This is not a counted run, so item 4's stop rule does not apply; it reproduces a condition the repo already fixed. The output is copied to `~/wordcell-traces/7.13/diag-drvfs-full/`. |
| Final `npm run test:all` (at 84df83f, the build's only tree: nothing outside `_bmad-output/` changed) | `npm run test:all` | exit 0, 7m42s. Lint clean; check 0 errors; unit 3788 passed; build total 560,703 / 600,000; `test:e2e:dist` 28 passed; `test:e2e` 1161 passed, 1095 skipped (project-specific), 0 failed, with `success-signal.spec.ts:397` and `:440` passing on android; `test:e2e:pwa` 44 passed. No D-64, D-71 or other failure. |

No fix landed, so there is no after-fix count. The void rule never applied.

### Item 5: mechanisms and injections

Every injection was a temporary edit of `e2e/success-signal.spec.ts`'s `validateAndRetarget` or the drag test's start, applied from a saved clean copy by `~/wordcell-traces/7.13/injections/run.sh` and restored after the run. `git diff --stat` after each revert was empty (recorded at the end of each `inj-*.log`).

The archive holds the final harness as `run.sh` (list reporter, copies `outputDir` after each run; it ran `cpu 20b`) and the pre-`cpu 20b` one as `run.sh.v1` (line reporter, no copy). `injected.ts` is the `cpu 20b` file and `injected.ts.v1` the `probe` file. `make.py` also defines `lateEndStamped` and `lateTap` variants, which were never run, so they have no results.

One harness slip happened before the first injection ran. A shell redirect truncated the spec before the generator read it. The `cp` from the clean copy restored it at once, `cmp` against `git show HEAD:e2e/success-signal.spec.ts` was identical, and no test ran on the truncated file.

| Injection (drag test, android) | Models | Result |
| --- | --- | --- |
| `lateEnd 1200`: Validate tap as CDP touchStart, a 1200 ms wait, then touchEnd (`--repeat-each=5`) | late CDP delivery of the tap's touchEnd (the D-71 load symptom) making Chromium classify a long press, so no click | 5/5 **passed**. Page events `pointerdown@t`, `pointerup@t+1.2s`, `click@t+1.2s`: the click still fires. |
| `lateEnd 3000` (`--repeat-each=2`) | the same, at 3 s | 2/2 passed; click fired at +3 s. Long-press suppression is **refuted** at 84df83f. The classification is Chromium's, and both trees pin Playwright 1.63.0 (`package.json` `@playwright/test`; the lock's `playwright-core`, same integrity hash), hence one Chromium build, so this refutation carries to 03824f1. |
| `probe` (`--repeat-each=3`, diagnostic) | the button moving between `centre()` and the tap (deferred AD-11 re-layout or anchor scroll after step 4) | 3/3 passed. The rAF sampler showed `primary-action` top 785.0 throughout, `scrollY` 0 and `scrollHeight` 839 (the page fits the Pixel 7 viewport, so the sticky action bar never moves). The tap's pointerdown and click both hit `span.primary-label`. **Refuted** at 84df83f only: the layout files that place the button differ at 03824f1 (item 3). |
| `cpu 6`: `Emulation.setCPUThrottlingRate` 6 from the test start (×10) | load (diagnostic only; item 5 bars load alone as a proof) | 10/10 passed |
| `cpu 10` (×20) | load | 20/20 passed |
| `cpu 20` (×20) | load | 8/20 failed, all `Test timeout of 30000ms exceeded`, **outside the mode**: no failure was in `validateAndRetarget` and none showed `composing`. Clean-file lines (the injected file is clean +1): 4× step 7's `expectStep`/`expectSaved` (:483), 1× step 7's `expectNoResidue` (:484), 1× `expectStoredCursor` after Confirm (:487) and 2× step 7's `expectDragging` (:481). These are budget exhaustion on this run's own log. The failures are repeat0–repeat7, the first worker wave (all reported before test 9 started). Every error is `Test timeout of 30000ms exceeded`, never a step's own 5 s poll timeout (no `Timeout 5000ms exceeded` in the log), so each failing poll began with under 5 s of the budget left. `cpu 20b` corroborates this. Deviation from item 3: the first harness (`run.sh.v1`) did not copy `outputDir`, so these traces were removed when the next Playwright run cleared it. The errors and stacks survive in `~/wordcell-traces/7.13/inj-cpu20.log`. The harness was then changed to copy `outputDir` after every run (`run.sh`), and this injection was re-run as `cpu 20b`. |
| `cpu 20b`: the same, re-run with traces copied (×20, list reporter) | load | 8/20 failed, all `Test timeout of 30000ms exceeded`: 6× `expectStoredCursor` after Confirm (:487) and 2× `expectLanded` (:489). The 8 failures are exactly the first (cold) worker wave, at 30.8–31.2 s each. The 12 later tests passed in 18.8–23.4 s, the second 8-test wave included (22.7–23.4 s). Every failure got past Validate; the first trace's error context shows the post-Confirm board. These are budget exhaustion at whatever step the 30 s ran out, not a step-specific mode. Traces: `~/wordcell-traces/7.13/cpu20b/`. |

Code read for other mechanisms; each is a recorded hypothesis only, with no test edit (item 5):

- **The button was disabled?** No. `canValidate` is `composing && letterCountAllowed(count)` (`src/engine/view.ts:248`), so AENW and ANEW (4 letters) both enable Validate.
- **The store dropped the dispatch?** No. `dispatch` (`src/shell/game.svelte.ts:136`) drops nothing silently: its one guard throws (`AD-4 dispatch while …`, an AD-15 halt; see the halt bullet). There is no stale check, and a rejected word cannot happen because the stored arrangement was ANEW.
- **The controller swallowed the click?** No. The `click-swallow.ts` swallower is armed only by a sticky-view close (`controller.ts`) and by the win celebration's skip (`src/ui/celebration/skip.ts`). Neither runs before Confirm.
- **The tap's pointerdown resolved to a captured press?** No. `resolve` returns `null` for `button:enabled`.
- **An AD-15 halt inside `act(validate)`?** Contradicted by the 6.1 log. A halt would leave storage at `composing` with exactly this poll output, because `storedAt` reads only `localStorage`.
  - On the 6.1 tree itself: a fatal halt reaches `main.ts` `fatal()`, which calls `console.error`. The dev server forwards client errors as `[WebServer] … [vite] (client) [Unhandled error|rejection]` / `[console.error]` lines. The 6.1 log's forwarded set (storage-spy, the AD-15 font checks, Q-37, Q-38, AD-15 halt order, focus and message-only, a blank reason, a `NetworkError`) is the deliberate set: the same entries appear in this build's green `test:all`. It holds no AD-4, AD-11 or AD-14 error. So the log contradicts a fatal halt in the failing test, as far as the forwarded console shows.
  - A Q-38 `another-window` halt calls no `console.error`, so the log cannot rule it out. On the 6.1 tree, `halt('another-window')` runs from the `storage` listener and from a bfcache `pageshow` with stale owners (`src/shell/game.svelte.ts`). Neither can fire in this test:
    - Each test has its own browser context with one page, and the spec opens no second page. So no other same-origin document fires a `storage` event.
    - The test navigates once, `openFixture`'s `page.goto('/')`, so there is no bfcache `pageshow`.
  - A halt of either cause before the tap would also have failed `tapPrimary`'s `toHaveText('Validate')`: a halted store renders `Halted` in place of the board (`App.svelte`, both trees). The failure was in `expectStep`, after that check passed.
  - On the current tree, no candidate throw was found by code read:
    - `act` → `cancel()` finishes every flight, parting and glide (gate holders: flip, fly-back, parting, the press).
    - `validate()` (`src/ui/commands.ts`) then runs `closeTransient()`. It throws only with another entry above what it closes (`close('wordcellView')` when the view is not the top, `deselect()` under another entry). The drag test opens no view, menu or dialog before Validate, so it closes at most a peek and returns.
    - `capture()` → `beginMove`/`finishAll`, then `play()` → `endMove` run synchronously in the click.
    - `dispatchAnnounced`'s one check before `game.dispatch` is `required(game.view, 'before view')`; the view is defined while the store is active. Its later checks (`draft`, `draft.word`, `draft.letterCount` for the Place text) run after `dispatch` has written storage, so they could not leave it at `composing`. They are defined in Place with 4 letters anyway (`src/engine/view.ts`).
    - `endMove`'s "rows changed while the gate is busy" needs a gate holder that `cancel()` and `capture()` leave running. None was found.
  
  If the mode recurs with a trace, the next ticket should still check its error context for the Halted surface.
- **The 7.9 sighting ("drag step") as a mode an injection may show?** No injection result matches it. Item 5 keys a mode by its failing step or error, and 7.9 records neither; no output survives. The `cpu 20` failures in step 7's drag are budget exhaustion on their own log (the first worker wave, only 30 s test timeouts; see the `cpu 20` row), corroborated by `cpu 20b`. They are not a step-specific failure, so they show no mode.

### Item 6, hand-offs and review-log items

- Item 6: no helper changed, so there is nothing to run. No `*.screens.spec.ts` import changed, so `test:screens` is not triggered by this ticket.
- **7.14 hand-off (entry 14):** this ticket changed neither `e2e/helpers/touch.ts` nor `e2e/helpers.spec.ts`, so 7.14's before-count needs no re-baseline for it.
  - One observation, offered as evidence and not a conclusion: in this Chromium (Playwright 1.63, Pixel 7 emulation), on an unloaded page, a single CDP touch tap (fresh session) whose touchEnd came 1.2 s after its touchStart (5/5) or 3 s after (2/2) still gave pointerup and a click.
  - That is all it shows: a late touchEnd within one tap did not lose its click there. It says nothing about what else late delivery affects.
- **No new `e2e/helpers/` export**, so there is no entry-11 AD-17 Touch spine-sync note.
- **tickets.toml:** entry 13's description and verify differ from the hardened ticket file. This build followed the ticket file and did not edit `tickets.toml`. Entry 14's `after` still lacks 13; that sync is the orchestrator's (review log, Unapplied minors).
- Review-log items the ticket left for the build, as resolved here:
  - **Void rule (open major)**: reading adopted: only runs with the fix applied count toward voiding. The pre-proof injections and the without-fix half of a proof never void a fix. Moot here: no fix.
  - **"Proven fixes for other modes still land" for a mode that does not recur**: adopted as the reading. Moot: no mode opened.
  - **Isolated ×50 for a tap-only mode fix**: would add `-g "tap-only move" --repeat-each=50`. Moot: the tap-only test never failed (counted 0/3, diagnostic 0/100).
  - **A void-revert re-runs nothing**: adopted default. Moot.
  - **Diff `playwright*.ts` against the 6.1 tree, 6.1 tree `03824f1`**: done, see item 3.
  - **F-13 is the 6.1 sighting, and counted runs are lighter**: recorded in item 3; the extra load runs were added.
  - **`git diff` after each injection revert**: recorded in each injection log.
  - **A tap-only failure after a shared-function change voids the fix**: confirmed reading ("any R-73 failure"). Moot: no fix.

## Plan Change Log

## Review Triage Log

### 2026-11-03 — Review pass
- Routing note: the workflow rejects a finding "whose fix is to edit this build's plan". Here the ticket makes this plan its deliverable (ticket Description: "Everything is recorded in this ticket's plan"), so an inaccurate evidence record is a defect in the deliverable. Such findings are routed `patch`; each patch edits only the record here, and none touches a file outside `_bmad-output/`. So the tree tested by item 4's runs and the final `test:all` is unchanged and nothing re-runs (Scope item 4).
- verdicts: 9 findings — high 0, medium 5, low 4, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` Item 3's 6.1 diff omitted `src/ui/flip.ts`, `src/ui/act.ts` and `src/shell/game.svelte.ts`, so "nothing on the path changed" and the halt code read were unsupported for the 6.1 tree. Verified: `git diff 03824f1 84df83f` changes all three; `flip.ts` adds `found` throws on the Validate path. Fix: the three files are listed, the claim is narrowed to the current tree, and the 6.1 tree is covered by the log check (next finding but one).
  - `[medium]` `[patch]` The `playwright.base.ts` `outputDir` move changed the run condition: 6.1 wrote traces to drvfs `test-results/`, and this build's runs did not. Verified from `09285b2`'s comment and 6.1 log :1404. Fix: two diagnostic runs with `--output=test-results` added (isolated 0/50; full both-project run with both R-73 tests passing and 5 drvfs teardown stalls elsewhere), recorded in item 4 and item 3.
  - `[low]` `[patch]` The `cpu 20` tally summed to 9, not 8, and the `:484` note was misleading. Verified from `inj-cpu20.log`: 4× :483, 1× :484, 1× :487, 2× :481 (clean numbering). Fix: the row is corrected.
  - `[medium]` `[patch]` Item 3's trace-copy-before-next-run requirement was unmet for `cpu 20`, because the harness never copied `outputDir`. Verified in the harness (archived as `run.sh.v1`). Fix: the harness now copies `outputDir` after every run (archived as `run.sh`); the injection was re-run as `cpu 20b` with traces in `~/wordcell-traces/7.13/cpu20b/`; the original loss stays recorded as a deviation.
  - `[medium]` `[patch]` "No injection showed the mode" checked only the 6.1 mode, not the 7.9 "drag step" sighting. Verified: the plan gave no reason. Fix: the `cpu 20` failures are budget exhaustion on their own log (repeat0–repeat7, the first worker wave; every error the 30 s test timeout, none a 5 s poll timeout), corroborated by `cpu 20b`'s timings (the first (cold) wave at 30.8–31.2 s; later passes at 18.8–23.4 s; all past Validate). 7.9 records no step or error, so no injection result can match it. Recorded in item 5.
  - `[medium]` `[patch]` The halt hypothesis was left open although the 6.1 log's forwarded client errors could test it. Verified: the forwarded set in the 6.1 log equals the deliberate set in this build's green `test:all`, with no AD-4, AD-11 or AD-14 error. Fix: recorded as contradicting a halt on the 6.1 tree.
  - `[low]` `[patch]` "`dispatch` has no gate" was false: it throws when not active. Verified at `src/shell/game.svelte.ts:137`. Fix: the wording now says its one guard throws (an AD-15 halt).
  - `[low]` `[patch]` "The swallower arms only after a sticky-view close" was incomplete: the celebration skip arms it too. Verified at `src/ui/celebration/skip.ts:147`. Fix: both arming sites named; neither runs before Confirm.
  - `[low]` `[patch]` The 7.14 hand-off overclaimed ("only the tap-count window … is affected"). Verified: the evidence is 7 unloaded runs. Fix: restated as an observation with its limits.

## Verification

**Commands:**
- `npx playwright test e2e/success-signal.spec.ts -g "the same move by drag" --project=android --repeat-each=50`: expected 0 failures (recorded: 0/50)
- `npx playwright test --project=android` ×3: expected no R-73 failure and no other failure (recorded: 0/3, 903 passed each)
- `npm run test:all`: expected exit 0 (recorded: exit 0, see item 4)
- `git diff --name-only 84df83ff4ac64715ae6fb608dc5c6f8bcb8c1f45 -- . ':(exclude)_bmad-output'`: expected empty (recorded: empty)

## Auto Run Result

- **Summary:** ticket 7.13 (D-65) closes as **Never reproduces** (ticket Scope item 5). No R-73 test failed in any uninjected run of this build:
  - isolated 0/50
  - counted 0/3
  - diagnostics: 0/200 at 16 workers; 0/50 isolated with drvfs trace output; both R-73 tests passing in a full both-project run with drvfs trace output
  - final `test:all` green

  No injection showed the mode:
  - A late touchEnd (1.2 s, 3 s) still clicks, which refutes the long-press theory at 84df83f. The Playwright version, hence Chromium, is the same at 03824f1, so this carries to the 6.1 tree.
  - The rAF probe shows the Validate button never moves, which refutes the layout-shift theory at 84df83f only (the 6.1 layout files differ).
  - CPU throttling at 6× and 10× passes. At 20×, it fails only by 30 s budget exhaustion after Validate, in the first (cold) worker wave of each run.
  - The 6.1 log's forwarded client errors contain no unexpected error, which contradicts a fatal AD-15 halt. A Q-38 `another-window` halt has no trigger in the test (one page, one navigation).

  The 6.1 run's tree is `03824f1`. A later sighting gets a new B8 fix ticket that cites this plan.
- **Files changed:** this plan only (`_bmad-output/…/story-deflake-the-success-signal-drag-test-plan.md`, new). `git diff --name-only 84df83f -- . ':(exclude)_bmad-output'` is empty. No test, helper, `src/` or config file was edited; every injection was reverted with an empty `git diff --stat` afterwards.
- **Review:** quick lens, 9 findings, all accuracy defects in the evidence record (5 medium, 4 low). All were patched in the record, with 3 extra evidence runs (`cpu 20b`, 2 drvfs-output diagnostics). None deferred, none rejected.
- **Follow-up review recommended:** true. Five medium entries were patched (first pass). The specific unverified risk: the corrected item 3 and item 5 records have had no fresh review. These are the `flip.ts` 6.1 delta, the halt reading from the forwarded console, and the `cpu 20b` budget-exhaustion reading of the 7.9 sighting.
- **Verification:**
  - final `npm run test:all` at `84df83f`: exit 0, 7m42s
  - item 4 counts and every injection result: in Implementation Notes
  - logs: `~/wordcell-traces/7.13/`, not committed
- **Residual risks:**
  - The one surviving failure (6.1) remains unexplained. The evidence is consistent with a load-only race that none of this build's conditions reached.
  - The counted runs are lighter than the 6.1 `test:all`. The diagnostics narrowed that gap but cannot close it.
- **Owner / orchestrator:**
  - nothing blocks
  - tickets.toml entry 13 still differs from the ticket file
  - entry 14's `after` lacks 13 (orchestrator sync; not edited here)
  - no 7.14 hand-off is needed, because `touch.ts` and `helpers.spec.ts` are unchanged
