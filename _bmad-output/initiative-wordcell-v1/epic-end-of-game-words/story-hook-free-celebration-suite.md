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
- Setup: `openFixture(page, 'session-won-words', { booted: false, steps: ['undo'] })` (it seeds through `seedStorage`; Undo acts with the relaunch sheet expanded, EXPERIENCE.md End sheet), then wait for `primary-action` to read Confirm and click it. No prefs seeded (Normal speed); the project's default reduced motion `no-preference` (AD-19 Start: reduced motion plays no run). The tests use only hook-free helpers (e.g. `openFixture` with `booted: false`, `skipByPress`, `watchAdded`, `animationFrames`, `glidesSettled`), never a `window.__wordcell` reader (`running`, `advance`, `enableCelebration`, `finishCelebration`, restore.ts `booted`). Each attaches its `pageerror` and console-error listeners before `openFixture` (it calls `page.goto`), as the AD-18 load test in the same file does, and at the end, after `page.waitForLoadState('networkidle')`, asserts none (AD-15).
- Start proof (both tests, before the skip): `watchAdded(page, '[data-celebration-root]')` is called before Confirm. The run starts only in the winning whenSettled callback, after the commit glide and the 300 ms guard (AD-19 Start), so in order: poll until `[data-celebration-group]` count > 0; then `added()` reads true and the dialog named exactly "Every column cleared." has count 0; then poll until the inline `style.transform` of the first group's first `[data-celebration]` copy is non-empty and differs between two reads taken `animationFrames(page, n)` apart (e2e/helpers/lifecycle.ts; DOM-only; the real rAF loop runs; AD-17 Celebration seam). This follows the build and SPEC F21/F26 (groups get `opacity`, shown copies `transform`), not AD-19's stale "writes `transform` directly to the groups", which entry 9 syncs. This is the start proof story-win-trigger-and-celebration-test-seam-plan.md hands to this entry. The plan records a negative control: temporarily move the gated `setCelebrationEnabled(false)` in src/main.ts out of its hook gate, `npm run build` then `npm run test:e2e:dist`, record that both tests fail at the start proof, and revert before committing (that plan's Deferred 1).
- Real time: skip right after the start proof, with no other waits, and assert `[data-celebration-root]` is still attached right before the press or back, so a natural finish cannot stand in for the skip. Letting the run reach its cap is not required (AD-17 as read in Notes).
- (a) `skipByPress` (e2e/helpers/celebration.ts) ends the run → the dialog named exactly "Every column cleared." visible (expanded), `[data-celebration-root]` count 0, focus on Replay this deal.
- (b) After the start proof, `page.goBack()` ends the run → the dialog named exactly "Every column cleared." visible (expanded), `[data-celebration-root]` count 0, the page still on the app's URL (not `about:blank`), focus on Replay this deal (AD-19 Skip, EXPERIENCE.md Win celebration Skip).
- Audit (the `dist-smoke` testMatch: dist-smoke, precache, build-output, font specs): none wins a game by play; the R-87 relaunch test seeds a finished game and starts no run, so no existing spec changes.

## Acceptance Criteria

Verify: `npm run test:all` is green (it runs `build` then `test:e2e:dist`), and these two new tests pass in the `dist-smoke` project against the production build:

- (a) "R-87 hook-free build: a real win plays and a press skips it to the expanded end sheet".
- (b) "R-87 hook-free build: a real win plays and back skips it to the expanded end sheet, the app still open".

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-17 (Celebration seam), AD-18, AD-19 (Start, Skip), AD-13 (the celebration overlay entry bullet)
- spec — SPEC.md CAP-6, F12, F16; rule-coverage.md (R-87 hook-free row)
- design — EXPERIENCE.md Win celebration (Skip), End sheet
- code — e2e/pwa/dist-smoke.spec.ts, playwright.pwa.config.ts (dist-smoke project), e2e/helpers/celebration.ts (`skipByPress`, `watchAdded`), e2e/helpers/board.ts (`openFixture`, `glidesSettled`), e2e/helpers/lifecycle.ts (`animationFrames`), fixtures/session-won-words.json
- deferral — _bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md (10.5 entry)

## Notes

- Spine reading (for entry 9's close-out): AD-17 Celebration seam ("every `dist-smoke` spec that wins a game ends the run by a press outside the bars") and SPEC CAP-6/F12 name only the press; rule-coverage.md's R-87 hook-free row (a SPEC companion) adds back. The rule-coverage row is followed; the AD-17 sentence is read as "ends the run early by a skip (a press outside the bars or back)", its purpose being that no hook-free spec waits for a real-time run; entry 9 syncs the AD-17 Celebration seam and SPEC CAP-6/F12 wording. Entry 9's scope does not name SPEC.md and this handoff is written only here, so the build's plan records the press-or-back sync (AD-17 Celebration seam, SPEC CAP-6, F12) and AD-19's copies-not-groups `transform` wording as deferred items addressed to entry 9, as the 10.5 plan's deferral reached this entry.
