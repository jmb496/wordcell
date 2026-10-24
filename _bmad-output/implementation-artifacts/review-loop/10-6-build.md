# Review loop — ticket 10.6 build (celebration skip, code mode)
State: pass 1: done

Target: commit range `d404cae..HEAD` (5f67795), code only (`_bmad-output/` excluded). Staged diff: `10-6-build.passes/pass0.diff` (1505 lines).
Mode: code, thorough, max 7. Pre-loop: HEAD 5f67795e0b910c8bbc32eb6f3a8654fafc441aad, tree 0 f133377259c5f2810601f6e9b05d9a8951eb054d.
Intent: `_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-skip-plan.md` (plus ticket `story-celebration-skip.md`). Caller focus: the press skip's per-skip `cancel()` side effects (hover-peek close and suppression slot, held pre-start press ended, deselect) and the deferred `< LONG_PRESS_MS` e2e timing flake.
Checkpoint: each pass's fixes are committed as `fix(celebration): WIP code review pass <n> (ticket 10.6)` with this log.

## Pass 1 — 2026-10-23
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 6, decision-needed 0  |  Dropped in triage: 1 (merged: tap-window timing ×4 (2 major, 2 minor → major); cancelGesture doc comment ×4; real-controller cancel test ×2)
Snapshot: tree 0 f133377259c5f2810601f6e9b05d9a8951eb054d (pre-fix)
### Applied
- [major] e2e/celebration.spec.ts R-87 touch-press rows and held-finger row — the `< LONG_PRESS_MS` check is Node wall-clock from before `touchHold` (checkPoints evaluate, newCDPSession, the toBeVisible backoff poll, touchEnd + detach), so a loaded `test:all` runner can fail a correct build (the plan's deferred item); it also never observes that a click was generated → fixer item 1 (default applied: page-side window capture-phase recorder of `pointerdown`/`pointerup`/`click` `timeStamp`s; assert up − down < LONG_PRESS_MS and a click dispatched; held-finger row compares the touch pointerdown with the Enter keydown timeStamp; drop the Date.now() checks)
- [major] e2e/celebration.spec.ts android describe — no P6 test presses the top bar or action bar mid-run, so R-87 "outside the top and action bars" is covered only by the skip.test.ts selector fake, nothing ties `BARS` to TopBar/ActionBar DOM → fixer item 2 (default applied: android row tapping a non-control point inside `[data-band="topBar"]` and one inside `[data-band="actionBar"]`; `running()` stays true, sheet count 0)
- [minor] src/ui/celebration/skip.ts:36 and header line 8 — `cancelGesture` doc says "key skip only" though the press skip calls it; header line unwrapped → fixer item 3
- [minor] src/ui/gestures/controller.test.ts (AD-13 gestures while the celebration runs) — the press skip's `cancel()` side effects (held pre-start press ended, hover peek closed) proven only as call order on fakes (caller focus) → fixer item 4 (default applied: one AD-19 real-controller case)
- [minor] src/ui/celebration/attached.test.ts 'skip press before the push settles' — the nav mock's `whenSettled` runs at once and `settled` is read by nothing, so the test equals the settled case → fixer item 5
- [minor] e2e/celebration.spec.ts `expectSkipped` — the `replayConfirm` count 0 check is vacuous on a finished game (Replay acts at once) → fixer item 6 (default applied: comment that `sameSession` and the visible sheet are the activation detectors)
### Dropped
- Plan Change Log / matrix row lacks the press skip's `cancelGesture()` (intent) — the plan is the build's record, not the code target; its Review Triage Log already records the patch.
### Fixer outcome
1. `recordCaptured` (window capture-phase recorder of pointerdown/pointerup/click/keydown `timeStamp`s); touch rows assert `['pointerdown touch','pointerup touch','click touch']` captured (the CDP tap does generate the click), up − down < LONG_PRESS_MS, bubble recorder empty; held-finger row asserts Enter keydown − touch pointerdown < LONG_PRESS_MS; Date.now() checks gone.
2. New android row 'R-87 a press on the top bar (touch) or the action bar (mouse) where no control lies does not skip the run' (`quietBarPoint` via elementFromPoint, `recordPressTargets` confirms the bar target). Action bar by mouse: Chromium touch adjustment snaps every margin touch onto the primary button (comment in the spec). Positive controls: removing `inBars` fails the top-bar half; removing `actionBar` from BARS fails the action-bar half (both reverted).
3. skip.ts `cancelGesture` doc reworded; header and one Space-tail line re-wrapped to 100 columns.
4. controller.test.ts 'AD-19 a press held from before the run, then the press skip (act.ts cancelGesture(), end()) and the sheet open: its same-id release performs nothing' (real controller; fails with cancelGesture() removed). Hover-peek half unreachable: `startCelebration()` already closes a hover peek and `openHoverPeek` is a no-op under the entry (comment; asserts `hoverPeek` null).
5. attached.test.ts nav mock queues `whenSettled` while unsettled; test renamed '… still ends at once and waits on no nav settle (nav orders the pop)'; asserts log synchronously, empty queue, then done/push after a microtask.
6. `expectSkipped` comment: on a finished game `sameSession` and the visible sheet are the activation detectors.
Fixer note (not changed): a touch on the action bar mid-run can land on the primary button, whose own handler ends the run (bars are exempt from the skip, so the button acts).
Fixer runs: npm test 3525 passed; lint 1 pre-existing warning; check 0 errors; `playwright test e2e/celebration.spec.ts e2e/helpers.spec.ts` 90 passed; celebration.spec.ts `--repeat-each=3` 51 passed; touch and bar rows `--repeat-each=8` 32 passed.
Orchestrator verify: npm test 89 files / 3525 passed; lint pass (1 pre-existing warning); check 0 errors.
Snapshot: tree 1 c4437179f922d29dd488ae48cd9d7da1a809e29e; fix diff `10-6-build.passes/pass1.fix.diff` (297 lines); restaged `pass1.diff`.
