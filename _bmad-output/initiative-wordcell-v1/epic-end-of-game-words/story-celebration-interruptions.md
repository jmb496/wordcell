---
id: 7
type: story
title: "Celebration interruptions"
parent: epic-end-of-game-words
covers: [CAP-3]
after: [6]
risk: high
---

# Celebration interruptions

## Description

Adds the new end paths on top of entries 5 and 6: the ☰ button and `M` (sheet expanded, then the menu after the push settles), the before-hide callback (sheet open queued for the next visible, idempotent) and `resize`/`orientationchange`; and proves with Playwright the behaviours entries 4 and 5 already provide: Undo, New game and the `N` key cancel without a sheet, a Redo that restores the win starts it again, and `?` and WordCell keys do nothing while it runs.

## Acceptance Criteria

Verify: The R-87 interruption rows of rule-coverage.md pass on `android` (`desktop` for the keys) with the seam enabled, including hide → show → sheet expanded with back and the menu still working, and `npm run test:all` and `npm run test:screens` are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-9, AD-13, AD-19 (Hide)
- design — EXPERIENCE.md Win celebration (Skip, Never plays, Keys while it runs), A-E16
- code — src/ui/keys.ts, src/ui/act.ts, src/ui/Menu.svelte, src/shell/game.svelte.ts (registerBeforeHide), e2e/helpers/lifecycle.ts

## Notes

- Open question: How Android treats the sheet's history push after the hide callback; the lifecycle test proves the app-level behaviour and the epic 7 device check the platform.
