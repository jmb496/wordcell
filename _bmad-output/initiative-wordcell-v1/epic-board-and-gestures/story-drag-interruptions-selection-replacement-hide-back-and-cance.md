---
id: 9
type: story
title: "Drag interruptions: selection replacement, hide, back and cancel-first"
parent: epic-board-and-gestures
covers: [CAP-4, CAP-7]
after: [8]
risk: high
---

# Drag interruptions: selection replacement, hide, back and cancel-first

## Description

Completes AD-12/AD-9/AD-13 for drags in progress: a drag from any column while a tail is selected (the selected source column included) removes the old selection's classes by DOM only at threshold crossing, gets Q-34 source suppression and deselects at release (also when released over nothing), while a real pointercancel/lostpointercapture or cancel({ byBack: true }) flies it back and restores the old selection, its classes and entry (F24, F28); a primary pointerdown during a fly-back finish()es it and re-resolves by document.elementFromPoint, and act() finishes it before its handler (F13); the CAP-4 Playwright drag cases: hidePage mid-touchDrag, select then touchHold a drag from another column then hidePage/showPage, select then drag then back, Undo during a held drag (dispatchEvent click), Undo during a fly-back via one page.evaluate, and an inert foot-pad drag with a tail selected.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android shows hidePage mid-touchHold drag writing wordcell:session exactly once with the tail back, the Session unchanged and a later moveTo then end() changing nothing; select, drag from another column, hidePage, showPage leaving nothing selected at wc 0; select, drag, back leaving the app open at wc 0; one lifted tail mid-drag from the source column of a selection; Undo during a held drag returning the tail then decreasing cursor.index (also desktop with page.mouse); Undo during a fly-back acting on the settled faces; and a 20 px foot-pad drag with a tail selected leaving Session and selection unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-4 (AD-17 hide case, Cancel-first P4), CAP-7

## Notes

- Open question: That Android delivers pointercancel before back on an edge swipe is unverified (epic 7 device check); the restore path is proven here with a synthetic pointercancel.
