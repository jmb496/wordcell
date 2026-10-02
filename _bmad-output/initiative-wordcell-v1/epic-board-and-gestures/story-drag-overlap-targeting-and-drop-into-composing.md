---
id: 8
type: story
title: "Drag, overlap targeting and drop into Composing"
parent: epic-board-and-gestures
covers: [CAP-7]
after: [7]
risk: high
---

# Drag, overlap targeting and drop into Composing

## Description

Adds src/ui/gestures/targeting.ts with the pure pickTarget(dragged, candidates, sourceId, hasLeftSource) → { raw, highlighted } (25 % minimum inclusive, largest ratio, horizontally nearest centre then lower column tie-break, source suppressed until hasLeftSource, hasLeftSource set from raw including null), and the drag path in the controller: on threshold crossing from a canPickUp card it writes transform on the tail's faces and the highlight on the target (bottom card, placeholder or the lowest non-tail card on a partial self-drop) by DOM only (F12), draws the old slots as ghosts by a class on the slot wrappers, measures the grabbed face's rect against live unclipped column hit rects each pointermove, dispatches at most one drop on highlighted at release, and otherwise flies the tail back with WAAPI over motion.ts duration('flyBack') (reduced motion: a fade, gate-counted, F13), the drag layer drawing above the sticky bars; desktop repeats with page.mouse.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines regenerated in the container only where the four fixture renders change) with UI Vitest AD-12 pickTarget cases and an AD-10 fly-back duration case, and Playwright on android with touchHold shows the SPEC Success-signal drag (column 1's bottom card held over column 3 lights it, release lands in Composing with column 3's bottom card as the locked D mirror on the left of the static tray and the S tile after it), a drop on another column landing in Composing with k = 1 (k = 0 on column 1 of session-idle-empty-column), side left and S in column order saved before the next action, drops at the top and the bottom of a column giving the same draft, a whole-column drag from a column's top card, a drag over the WordCell row and a 20 px drag down from column 4's bottom card of session-idle-fresh flying back with no highlight and the Session byte-identical, a sub-25 % drag over the source only cancelling, a leave-and-return giving a self-drop, a whole-column self-drop giving k = 0, and the same drop and cancel on desktop with page.mouse.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-7
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Drop targeting by overlap

## Notes

- Open question: Whether WAAPI on the faces composes with the per-move transform writes without a jump at release; the P4 Success-signal drag is the guard.
