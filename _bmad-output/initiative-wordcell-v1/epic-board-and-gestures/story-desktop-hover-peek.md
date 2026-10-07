---
id: 12
type: story
title: "Desktop hover peek"
parent: epic-board-and-gestures
covers: [CAP-9]
after: [11]
risk: low
---

# Desktop hover peek

## Description

Adds HoverPeek.svelte (F19) for (hover: hover) and (pointer: fine) with pointerType mouse: hovering a non-empty WordCell 400 ms opens it through the overlays hover-peek state above the cell, clamped inside the board, below it when there is no room (dev fallback orders), never covering the cell; it shows the top 14 cards, oldest of them first, top card last and tagged top, as mirrors, a +1 older card / +n older cards line from text.ts above them only above 14 cards (F27), no scrim, takes no clicks, closes on leave, never opens during a drag or with a peek or view open, and any pointerdown cancels the timer and closes an open hover peek only when the press starts a drag, a peek or the sticky view.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on desktop shows a 400 ms hover opening the hover peek with the top 14 cards and the older-cards line on session-won's cell 6 (24 cards, +10 older cards) and its absence on cell 8 (7 cards), closing on leave, not opening during a page.mouse drag, hover then a 400 ms press-and-hold leaving only the peek sheet visible, and current().session and storage unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-9 (Hover peek)

## Notes

- Open question: None on fixtures: session-won's cell 6 (24 cards) shows the older-cards line and cell 8 (7 cards) its absence; no new fixture.
