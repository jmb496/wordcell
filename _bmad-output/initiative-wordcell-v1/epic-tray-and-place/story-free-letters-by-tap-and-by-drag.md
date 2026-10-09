---
id: 8
type: story
title: "Free letters by tap and by drag"
parent: epic-tray-and-place
covers: [CAP-6]
after: [7]
risk: high
---

# Free letters by tap and by drag

## Description

Adds free letters from WordCells (CAP-6) to the controller's WordCell press path in Composing: a tap on a cell with `canAddFreeLetter` dispatches `addFreeLetter { cell }` (appended), a tap on a used or empty cell dispatches nothing and keeps a tile selection, and a press crossing 8 px before the 400 ms long-press drags the top card's live face, clears any tile selection (F18) and leaves a 1 px dashed ghost in the cell (card beneath not revealed, R-61), inserting at the entry 6 gap in M with `addFreeLetter { cell, index }` when released over the tray band at ≥ 25 % (the cell takes the used state only then); while accepted the tiles after the gap part with the D-block mirrors shifting too when the block is on the right (the one AD-14 mirror-motion exception), and a 3 px teal caret marks the gap instead while the layout is full (tile count after the drop > `perRow` × the rendered rows) or when the gap moves no tile (end of M with the block left or k = 0); a release outside the tray band or under 25 % dispatches nothing, used/empty-cell drags and every WordCell drag outside Composing are inert, and a long-press peek with a tile selected keeps it.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows on session-idle-empty-column after a drop a tap-add appending cell 7's top with the cell used, a drag-insert at an inner gap, the caret at the end gap of M with the block on the left and in a full layout, tap and drag on a used or empty cell leaving the stored Session byte-identical with a tile selection kept, a long-press peek with a tile selected keeping it, the dashed ghost in the cell during the drag, a drag-insert on session-composing (block on the right) with the D-block mirrors shifted while parted, tap-add and drag-insert each saved before the next action, hidePage mid-drag and page.goBack() mid-drag dispatching nothing (Session equal apart from activeMs, read after page.goForward()), and a free-letter drag released outside the tray band and one under 25 % leaving the stored Session byte-identical with the cell not used (epic Done when 3).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-5 (Free-letter parting with room), CAP-6
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band)

## Notes

- Open question: Whether the caret's full-layout case is reachable at 412 px on existing fixtures; if not, this entry scripts session-composing-long.json (14 tray tiles with canIncK, entry 12's fixture) early, adds it to the fixture lists, and entry 12 reuses it.
