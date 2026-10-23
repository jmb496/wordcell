---
id: 5
type: story
title: "Win trigger and celebration test seam"
parent: epic-end-of-game-words
covers: [CAP-3, CAP-6]
after: [1, 2, 3, 4]
risk: high
---

# Win trigger and celebration test seam

## Description

Mounts `Celebration.svelte` in `App.svelte`, calls entry 4's `attachOverlays()` from `main.ts`, starts the run from `onDispatched`'s winning `whenSettled` callback (push the entry, run, open the end sheet on `done`) with the finish and cap and the no-start cases (relaunch, reduced motion, Give up, seam disabled), and adds the AD-17 seam: `registerCelebrationSeam` and `window.__wordcell.celebration.{setEnabled, running, advance}` on the frozen hook (created at import, late-bound to entry 3's manual clock, registered from `main.ts` beside `registerBeforeBack`, off by default), the four-key changes to `e2e/globals.d.ts`, `e2e/test-hook.spec.ts` and `e2e/pwa/test-hook.spec.ts`, and the e2e helper that enables it and advances to the end; `Celebration.svelte` is mounted once per run (keyed on the run, e.g. `{#key}` on the controller's reactive `celebration.props()`) so `register` always matches the current groups.

## Acceptance Criteria

Verify: `npm run test:all` is green with every existing win-and-sheet spec unchanged (seam off by default), the two hook specs assert the four-key frozen hook, and Playwright rows pass for the won-words fixture + Undo + Confirm → celebration → expanded sheet, the cap at Fast and Slow, no celebration on Give up, relaunch and emulated reduced motion, a test records that the seam is off by default, and the copies being separate from live cards (live `[data-card-id]` stays at 52 while the `[data-celebration]` copy count equals the sum of the `wordList` card counts and exceeds 52 for the shared-card fixture), a check that after `advance` past the first launch at least one `[data-celebration-group]` has opacity > 0 and a non-empty transform, the groups registered in `wordList` order, and that a second run (Undo then Redo of the win, no reload) mounts a fresh `Celebration` whose own groups become visible; no screenshot baseline changes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-13, AD-14 (winning guard), AD-17 (Celebration seam), AD-19
- design — EXPERIENCE.md Win celebration
- code — src/ui/end-sheet.ts, src/ui/App.svelte, src/ui/motion.ts (whenOpenAllowed), src/shell/test-hook.ts, src/main.ts, e2e/globals.d.ts, e2e/test-hook.spec.ts, e2e/pwa/test-hook.spec.ts, e2e/win-guard.spec.ts

## Notes

- Open question: How the seam's disabled path interacts with the existing winning guard in every existing win spec; the unchanged-specs run proves it.
