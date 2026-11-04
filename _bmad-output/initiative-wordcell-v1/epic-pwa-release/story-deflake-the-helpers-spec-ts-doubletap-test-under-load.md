---
id: 14
type: story
title: "Deflake the helpers.spec.ts doubleTap test under load"
parent: epic-pwa-release
covers: [CAP-8]
after: [10, 13]
risk: low
hitl: false
---

# Deflake the helpers.spec.ts doubleTap test under load

## Description

Fix ticket from ticket 7.10's sweep (row D-71, B8): the test `AD-17 doubleTap gives two touch taps whose clicks have detail 1 then 2, even 600 ms apart in real time` (`e2e/helpers.spec.ts`, identified by title, not line) failed once under full-suite load: click details `[1, 1]`, not `[1, 2]`; the page events were timeStamped 740.1 and 2520.2 ms (a 1780 ms page gap) although the CDP stamps were 80 ms apart. `doubleTap` stamps its taps so real-time lateness does not matter (`e2e/helpers/touch.ts` comment), and the test asserts a page gap < 400 ms after a 600 ms real wait, so the stamp premise failed under load: the page did not follow the stamps. That premise, the touch.ts comment and AD-17 Touch's "stamped CDP taps", is the claim under test; the open question the build answers is why the page event timeStamps did not follow the CDP stamps. Related history only: D-64's mechanism (unstamped taps past Chromium's tap-count window, end-of-game-words epic :75, 169c6bc); a fix here may touch D-64's path but does not close D-64 (SPEC Non-goals A7).

Sightings: the 7.10 review pass 1 tree bbdd2d5's final `npm run test:all` (`test:e2e`, the only failure); 30/30 alone afterwards; 0/3 counted runs at the review pass 2 and 3 trees (2d01200, f29b440), and passed in both trees' final `test:all`; 7.13's build counted 0/3 and a green final `test:all` at 84df83f (7.13 plan). 7.13 changed neither helper file, so no re-baseline. Everything is recorded in this ticket's plan (`story-deflake-the-helpers-spec-ts-doubletap-test-under-load-plan.md`), citing D-71; the done 7.10 plan and its D-71 row stay unedited.

## Scope

1. Edit boundary. Editable: `e2e/helpers.spec.ts`, `e2e/helpers/touch.ts` and this ticket's plan. `src/` (comments included), Playwright config files and every other spec (including `doubleTap`'s callers) are not editable.
2. Never: `test.skip`, `test.fixme` or retries; a change to the test's title, its 600 ms `between`, its < 400 ms page-gap check, the helper's `[1, 2]` check or `DOUBLE_TAP_GAP_MS`, or the failure-report format its self-tests pin; any assertion loosened; unless the recorded cause shows it asserts something AD-17 Touch does not prescribe. A longer timeout or a retap never fixes an input-delivery cause.
3. Evidence. The only surviving evidence is the 7.10 plan's D-71 row and its Final `test:all` note (:418, review pass 1 tree bbdd2d5): the two page timeStamps. The full helper report (page events, CDP epoch stamp, `performance.timeOrigin`) and the trace do not survive. Each new failure records the full helper message, run condition (isolated, counted, diagnostic, `test:all`, injection) and trace path, the trace copied to `~/wordcell-traces/7.14/` before the next run (nothing committed).
4. Reproduction, CI unset (retries 0, `playwright.base.ts`), on the `/mnt/d` checkout, before and after any fix: `npx playwright test e2e/helpers.spec.ts -g "doubleTap gives two touch taps" --project=android --repeat-each=50` and three counted `npx playwright test --project=android` runs (7.10 item 6); counts recorded with the tree. After a fix both are 0 (0/50, 0/3) at the last tree changing anything outside `_bmad-output/`; any later such change, review fixer included, re-runs them and `test:all`. Uninjected heavier-load diagnostics (e.g. `--workers=16`, both projects) are allowed and recorded: counted runs are lighter than `test:all`'s `test:e2e` (7.13 plan). A candidate fix may be revised until its injection proof passes; from the fix's first uninjected run on, any failure of this test voids and reverts it (diff kept in the plan), and the plan stops short of `built` (no second unattended attempt). With no fix, any failure is a reproduction, so the outcome is not "Never reproduces".
5. Cause. Cause found: a temporary, reverted test-side injection modelling the named mechanism (e.g. a longer real `between` than 600 ms with the stamps kept 80 ms apart; never load alone) reproduces details `[1, 1]`. Fix proven: the same injection, same command, passes with the fix. Without the fix the injection fails 5/5 (`--repeat-each=5`) or else ≥5/20; with it 0/5 or 0/20 respectively. Without both halves a suspected cause is a recorded hypothesis, with no edit. Outcomes:
   - Test-side cause (both halves): fixed inside items 1 and 2.
   - Input-delivery cause (Chromium/CDP not honouring or late-delivering stamped input): fixed test-side (e.g. page-state waits or deterministic stamping) if both halves prove it; else a B8 fix-ticket proposal as for a `src/` cause, and the plan stops short of `built`.
   - `src/` or config cause (cause found): no edit; the cause, its proof and a B8 fix-ticket proposal (7.10 plan Fix tickets format) are recorded, and the plan stops short of `built`; the owner is asked only if the fix needs a functionality or UX call (CAP-8).
   - Reproduces without proof: counts, error and evidence recorded, no speculative edit; the plan stops short of `built`.
   - Never reproduces: no failure of this test in item 4's runs or this build's `test:all`; counts and evidence recorded; the plan reaches `built` with that reason. A later sighting after a close gets a new B8 fix ticket citing this one.
6. Changed helper: a new or changed `e2e/helpers/` function gets or keeps an `e2e/helpers.spec.ts` case that fails on a named mutation; that case, this test and each caller spec's `doubleTap` tests (`e2e/nav.spec.ts`, D-64's test; `e2e/celebration.spec.ts`; `e2e/history-notice.spec.ts`) pass `--repeat-each=5` on android. If a module a `*.screens.spec.ts` imports changes, directly or through another helper (e.g. `gestures.ts` imports `touch.ts`), `npm run test:screens` (in the container, AGENTS.md; no Docker: stop and report) is green. A change to `doubleTap`'s signature or contract records an entry-11 AD-17 Touch spine-sync note in the plan, no spine edit.

## Acceptance Criteria

Verify: The cause is recorded with its item 5 proof and fixed with 0/50 isolated and 0/3 counted failures, or the plan records each item 5 outcome that applies with its counts and evidence; for `built`, `npm run test:all` is green; `git diff --name-only <baseline> -- . ':(exclude)_bmad-output'` (baseline: the build's start commit) lists only item 1's files.

- A final `test:all` (or counted-run) failure confined to D-64's test (`e2e/nav.spec.ts`, `§2 AD-13 a double tap on New game on the rejected root …`) or D-65's R-73 tests (`e2e/success-signal.spec.ts`, ticket 7.13) gets one rerun at the same commit, both results recorded, unless this ticket changed a helper that test calls (then it stops the build); a failure of this test follows items 4 and 5; any other failure or a failing rerun stops the build and is reported.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-8, Non-goals
- plan — _bmad-output/initiative-wordcell-v1/epic-pwa-release/story-refactor-sweep-plan.md (D-64, D-71, Fix tickets, Final `test:all` at the review pass 1 tree)
- constraint — docs/development-methodology.md, Definition of done; AGENTS.md Running and verifying; ARCHITECTURE-SPINE.md AD-17 Touch
- evidence — _bmad-output/initiative-wordcell-v1/epic-pwa-release/story-deflake-the-success-signal-drag-test-plan.md, 7.14 hand-off (a late touchEnd within one tap still clicked, unloaded; an observation, not a conclusion)
- history — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md:75 (D-64 mechanism, 169c6bc)
- code — e2e/helpers.spec.ts, e2e/helpers/touch.ts, playwright.base.ts
