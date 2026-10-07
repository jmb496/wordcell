---
id: 11
type: story
title: "WordCell peek and sticky view"
parent: epic-board-and-gestures
covers: [CAP-9]
after: [10]
risk: high
---

# WordCell peek and sticky view

## Description

Adds WordCellView.svelte and its controller paths (R-65, Q-21, F14): a long-press ≥ 400 ms on a non-empty WordCell opens the peek through overlays.openPeek (no entry), closing on release unless the rendered sheet's scroll area overflows (scrollHeight > clientHeight), when peekToSticky pushes one entry above any kept selection; a tap in Idle with nothing selected or in Game over opens the sticky view via openView (one entry) titled WordCell n · m cards / WordCell n · 1 card from text.ts (F27), listing CellView.cards bottom first with top on the last as mirrors (a used cell's top a normal-card mirror); the sheet and its mirrors pan-y, user-select: none and -webkit-touch-callout: none with overscroll-behavior contain, a touch-action none scrim, the controller classifying sheet and scrim presses (tap closes and swallows that gesture's trailing click until it, the next pointerdown or a 300 ms expiry; drag does nothing), back closing it; Composing and Place WordCell taps and drags dispatch nothing and open no view while the peek works; an empty WordCell opens nothing; a WordCell drag never lifts a tail (R-12); and the scripted valid fixture session-gave-up-after-commit.json (as session-idle-empty-column with gaveUp true) added to src/engine/serialize.test.ts (VALID and REBUILDS) and src/architecture.test.ts's valid session-fixture list (count ten → eleven).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines regenerated in the container only where the four fixture renders change) with UI Vitest AD-12 trailing-click cases, and Playwright on android shows the long-press peek on session-idle-empty-column (also with a tail selected, selection kept), on session-place-free-letter-redo-tail and after one Undo into Composing, and on session-won; peek turned sticky on session-won's deepest cell at a short viewport; tap → sticky view in Idle and on session-won and session-gave-up-after-commit with the F27 title; a swipe in an overflowing view scrolling it open; a 20 px scrim drag keeping it; a scrim tap over the enabled Undo closing it without undoing; sticky-view reload then back leaving the app; and every view leaving current().session and storage unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-9

## Notes

- Open question: The touch pointerup → click order on Chromium (unverified, gated by the scrim-over-Undo case); whether session-won's deepest cell overflows at a usable short viewport (else the ticket scripts one more valid fixture, SPEC Assumptions).
