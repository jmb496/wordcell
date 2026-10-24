---
id: 8
type: story
title: "Hook-free celebration suite"
parent: epic-end-of-game-words
covers: [CAP-6]
after: [6, 7]
risk: medium
---

# Hook-free celebration suite

## Description

Adds to `e2e/pwa/dist-smoke.spec.ts` (run by the `dist-smoke` project of `playwright.pwa.config.ts` against `dist/`, with no test hook) two tests, each on a fresh page with the same setup: a real win (the won-words fixture, one Undo and Confirm) plays the celebration in real time and is skipped, (a) by entry 6's press helper, (b) by back, each opening the expanded end sheet. This closes the 10.5 deferral (autopilot digest, 10.5 entry: a test that a real win in the hook-free production build starts the celebration).

- Tests: Hook-free rows of rule-coverage.md (P6 `dist-smoke`): the row "R-87 hook-free build (`dist-smoke` only): a real win plays, a press skips it, back skips it" maps plays → both tests, a press skips it → (a), back skips it → (b). Owns: The hook-free proof. Consumers: None.
- Setup: `openFixture(page, 'session-won-words', { booted: false, steps: ['undo'] })` (it seeds through `seedStorage`; Undo acts with the relaunch sheet expanded, EXPERIENCE.md End sheet), then wait for `primary-action` to read Confirm and click it. No prefs seeded (Normal speed); the project's default reduced motion `no-preference` (AD-19 Start: reduced motion plays no run). The tests use only DOM helpers (`skipByPress`, `watchAdded`, `glidesSettled`, `END_SHEET`), never a `window.__wordcell` reader (`running`, `advance`, `enableCelebration`, `finishCelebration`, restore.ts `booted`). Each collects `pageerror` and console errors as the AD-18 load test in the same file does and asserts none (AD-15).
- Start proof (both tests, before the skip): `watchAdded(page, '[data-celebration-root]')`, called before Confirm, reads true after it; `[data-celebration-group]` count > 0 while the `END_SHEET` dialog count is 0; a group's transform changes between two reads across real animation frames (the real rAF loop runs; AD-17 Celebration seam). This is the start proof story-win-trigger-and-celebration-test-seam-plan.md hands to this entry. The plan records a negative control: with the celebration forced off in the hook-free build, both tests fail.
- Real time: skip as soon as the first group mounts, and assert `[data-celebration-root]` is still attached right before the press or back, so a natural finish cannot stand in for the skip. Letting the run reach its cap is not required (AD-17: winning `dist-smoke` specs end the run early).
- (a) `skipByPress` (e2e/helpers/celebration.ts) ends the run → expanded end sheet.
- (b) After a mounted group, `page.goBack()` ends the run → the `END_SHEET` dialog visible (expanded), `[data-celebration-root]` count 0, the page still on the app's URL (not `about:blank`), focus on Replay this deal (AD-19 Skip, EXPERIENCE.md Win celebration Skip).
- Audit (the `dist-smoke` testMatch: dist-smoke, precache, build-output, font specs): none wins a game by play; the R-87 relaunch test seeds a finished game and starts no run, so no existing spec changes.

## Acceptance Criteria

Verify: `npm run test:all` is green (it runs `build` then `test:e2e:dist`), and these two new tests pass in the `dist-smoke` project against the production build:

- (a) "R-87 hook-free build: a real win plays and a press skips it to the expanded end sheet".
- (b) "R-87 hook-free build: back skips a real win's celebration and the app stays open".

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-17 (Celebration seam), AD-18, AD-19 (Start, Skip), AD-13 (the celebration overlay entry bullet)
- spec — SPEC.md CAP-6, F12, F16; rule-coverage.md (R-87 hook-free row)
- design — EXPERIENCE.md Win celebration (Skip), End sheet
- code — e2e/pwa/dist-smoke.spec.ts, playwright.pwa.config.ts (dist-smoke project), e2e/helpers/celebration.ts (`skipByPress`, `watchAdded`), e2e/helpers/board.ts (`openFixture`, `END_SHEET`), fixtures/session-won-words.json
- deferral — _bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md (10.5 entry)

## Notes

- Spine reading (for entry 9's close-out): AD-17 Celebration seam ("every `dist-smoke` spec that wins a game ends the run by a press outside the bars") and SPEC CAP-6/F12 name only the press; rule-coverage.md's R-87 hook-free row (a SPEC companion) adds back. The rule-coverage row is followed; the AD-17 sentence is read as "ends the run early by a skip (a press outside the bars or back)", its purpose being that no hook-free spec waits for a real-time run; entry 9 syncs the AD-17 Celebration seam and SPEC CAP-6/F12 wording.
