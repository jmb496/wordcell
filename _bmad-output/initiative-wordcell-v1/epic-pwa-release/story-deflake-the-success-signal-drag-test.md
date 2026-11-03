---
id: 13
type: story
title: "Deflake the success-signal drag test"
parent: epic-pwa-release
covers: [CAP-8]
after: [10]
risk: low
hitl: false
---

# Deflake the success-signal drag test

## Description

Fix ticket from ticket 7.10's sweep (row D-65, B8): the test `R-73 (UI) Success signal (epic Done when 3): the same move by drag …` (`e2e/success-signal.spec.ts`, identified by title, not line) fails intermittently with no cause found (sightings, each in a full-suite `test:all` / `test:e2e` run under load and passing alone: win-trigger plan :101, game-surfaces retro F-13, 7.9 plan :108 run 1; 0/15 across 7.10's item 6 counted runs at five trees). Find the cause and fix it test-side inside item 1's boundary; a cause in `src/` goes to item 5's fix-ticket proposal. Builds before ticket 7.14 (tickets.toml order); a change here to `e2e/helpers/touch.ts` leaves 7.14 to re-run its own before-count from this ticket's commit. Everything is recorded in this ticket's plan (`story-deflake-the-success-signal-drag-test-plan.md`), citing D-65; the done 7.10 plan and its D-65 row stay unedited.

## Scope

1. Edit boundary. Editable: `e2e/success-signal.spec.ts`, any `e2e/helpers/` module it imports (the drag runs through `gestures.ts`, `touch.ts`, `board.ts` and `lifecycle.ts`; `drag.ts` holds only the residue checks), `e2e/helpers.spec.ts` for helper cases, code comments, and this ticket's plan. `src/` and Playwright config files are not editable.
2. Never: a Playwright config timeout, retry or worker change; `test.skip`, `test.fixme`, `test.slow` or retries; a change to the test's title, step order, dragged steps (the drop, the W insert, both reorders), per-step stored-Session checks (`expectStep`, `expectNoResidue`, `expectDragging`) or expected literals (spec header: "never edited to pass"); an assertion removed or loosened, unless the recorded cause shows it asserted the wrong thing. A per-test timeout or wait change only when the recorded cause explains it.
3. Evidence. Start from the only surviving failure output, `.autopilot/20261014-2230/6.1-T-attempt1.log:1361` (a 6.1 build's full android run): `expectStep` in `validateAndRetarget`, in the "5, 6: Validate … by taps" step after step 4's tile reorder, timed out on cursor `{ index: 1, phase: "composing" }` where `place` was expected, i.e. the Validate tap after the drags did not dispatch. No trace survives (traces are `retain-on-failure` under the OS-temp `outputDir`, `playwright.base.ts`). Each failure seen records its error, failing step, run condition (isolated, counted, `test:all`, injection) and trace path, the trace copied out before the next run.
4. Reproduction, CI unset (retries 0, `playwright.base.ts`), on the `/mnt/d` checkout, before and after any fix: `npx playwright test e2e/success-signal.spec.ts -g "the same move by drag" --project=android --repeat-each=50`, and three counted `npx playwright test --project=android` runs (7.10 item 6); failure counts recorded. After a fix both are 0 (0/50 isolated, 0/3 counted).
5. Cause. Found only when a temporary, reverted test-side injection (e.g. a delay or forced input timing at the suspected step, or CPU throttling) reproduces the sighted failure mode without the fix and passes with it, both results recorded (7.10 plan D-70 precedent); with that proof the fix lands even when the natural before-count is 0. Without it a suspected cause is a recorded hypothesis, with no test edit. Outcomes:
   - Test-side cause: fixed inside items 1 and 2.
   - Input-delivery cause (Chromium/CDP delivering input late under load, as D-71): fixed test-side only when the test can wait on an observable page state instead of wall time, with the injection proof; otherwise recorded, and the plan reaches `built` with that reason.
   - `src/` cause: no `src/` edit; the cause, its proof and a B8 fix-ticket proposal (title, finding, files, reproduction; 7.10 plan Fix tickets format) are recorded for the owner or orchestrator to add (SPEC CAP-8 technical default), and the plan stops short of `built`; the owner is asked only if the fix would change what the player sees or does.
   - Reproduces, or an injection shows the mode, but no cause is found: counts, failing step, error and evidence recorded, no speculative edit; the plan stops short of `built` for the orchestrator.
   - Never reproduces: counts and evidence recorded; the plan reaches `built` with that reason. A later sighting gets a new fix ticket under B8 citing this one.
6. Changed helper: a new or changed helper gets or keeps an `e2e/helpers.spec.ts` case that fails on a named mutation; that case and the changed test pass `--repeat-each=5` on android; other callers run through `test:all`; if a helper a `*.screens.spec.ts` imports changes, `npm run test:screens` (in the container, AGENTS.md) is green too.

## Acceptance Criteria

Verify: The cause is recorded with its item 5 proof and fixed with 0/50 isolated and 0/3 counted failures after the fix, or the plan records the item 5 outcome that applies with its counts and evidence; `npm run test:all` is green.

- A final `test:all` failure confined to D-64's test (`e2e/nav.spec.ts`, `§2 AD-13 a double tap on New game on the rejected root …`) or D-71's (`e2e/helpers.spec.ts`, `AD-17 doubleTap gives two touch taps …`, ticket 7.14) gets one rerun at the same commit, both results recorded; this ticket's test failing in any `test:all` after the fix is an after-fix failure; any other failure, or a failing rerun, stops the build and is reported.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-8
- plan — _bmad-output/initiative-wordcell-v1/epic-pwa-release/story-refactor-sweep-plan.md (D-65, D-70, D-71, Fix tickets)
- constraint — docs/development-methodology.md, Definition of done; AGENTS.md Running and verifying; ARCHITECTURE-SPINE.md AD-17
- evidence — .autopilot/20261014-2230/6.1-T-attempt1.log:1361-1412
- code — e2e/success-signal.spec.ts, e2e/helpers/ (gestures.ts, touch.ts, board.ts, lifecycle.ts, drag.ts), e2e/helpers.spec.ts, playwright.base.ts
