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

Adds free letters from WordCells (CAP-6) to the controller's WordCell press path in Composing: a tap on a cell with `canAddFreeLetter` clears a tile selection first (`tileTap`) and dispatches `addFreeLetter { cell }` (appended), a tap on a used or empty cell dispatches nothing and keeps a tile selection, and any press the controller resolves as the WordCell's hit (as the tap) on a cell with `canAddFreeLetter` crossing 8 px before the 400 ms long-press drags the top card's live face, clears any tile selection (F18) and leaves a 1 px dashed ghost in the cell (card beneath not revealed, R-61; the count badge keeps counting the dragged card, R-61, DESIGN.md WordCell), inserting at the entry 6 gap in M with `addFreeLetter { cell, index }` when released over the clipped tray band (entry 7's `trayTarget()`) at ≥ 25 % (the cell takes the used state only then); while accepted the tiles after the gap part with the D-block mirrors shifting too when the block is on the right (the one AD-14 mirror-motion exception), and a 3 px teal caret marks the gap instead while the layout is full (the current tile count (S + F + D mirrors) + 1 > `perRow` × `trayLayout(tileCount, w, trayInnerWidth).rows`, card mode holding one row, checked before calling `partingOffsets`) or when the gap moves no tile (end of M with the block left or k = 0); a release outside the tray band or under 25 % dispatches nothing; used/empty-cell drags and every WordCell drag outside Composing dispatch nothing, the tile selection per `tileTap` (F13; SPEC CAP-4's legal non-current Place cell drag clears it); a long-press peek with a tile selected keeps it.

- Caret (F16): `TileRows.svelte` renders one hidden caret element (3 px teal, tile height, DESIGN.md Tray band); the controller shows it and positions it by DOM at the gap rect `insertionIndex` returned (the winning rect at a row-break gap), parted tiles staying at rest while it shows; it hides under 25 %, outside the band and at every end. No Svelte state mid-drag (AD-12).
- Mirror segments (SPEC CAP-6): while parted, the controller writes the mirrors' segment start/end/lock classes in the DOM from `segmentEnds` over the parted `mirrorBySlot` (each mirror's free-letter `partingOffsets` slot), no Svelte state mid-drag, restored at every end.
- Ends and motion (as entry 7's tile drag): parting runs over `duration('parting')`, snapping under reduced motion; a no-edit release (outside the band, under 25 %), `pointercancel`, `lostpointercapture` and `cancel({ byBack })` fly the face back to its cell by `flyBack` (the fade under reduced motion) while parted tiles and mirrors return, ghost and caret clearing at the settle; `cancel()` from `act()` or hide settles everything at once (F5); a release with an edit finishes the parting, clears the drag (ghost, caret, segment classes), leaves the gate, then dispatches, with no landing glide (CAP-8, F17, entry 16).
- Coexistence: a press reaching 400 ms stays a peek and never becomes a drag; at the threshold crossing the hover peek hides and closes at the end as for the tile drag; Place and Idle press handling is unchanged.

Interface: Controller WordCell press path gains free-letter tap and drag; WordCellRow.svelte gains the dashed ghost class; TileRows.svelte gains the caret; no new engine (AD-2) exports; new class constants in classes.ts (ghost, caret, parted segment classes as needed) and one pure tile.ts free-letter entry point (e.g. `freeLetterRun(view, cell)` giving the run and the release → `addFreeLetter { cell, index }`, index the gap in M per build-notes CAP-6) with its Vitest.
Tests: R-33 (UI) choosing a WordCell marks it used, after tap-add and drag-insert, ghost during the drag (P5); R-33 a tap on a used or empty WordCell is a no-op (P5 supp.); R-33/Q-31 tap appends, drag inserts at the gap (P5 supp.); R-32 never inside or beyond the block (P5 supp.); R-73 (UI) tap-add and drag-insert saved before the next action (P5 part); R-65 (UI) a long-press peek in Composing with a tile selected keeps it (P5); AD-12 tray band >= 25 % and free-letter cancel paths (P5); AD-14 D-block mirrors carry the parting shift only (P5 part).
Owns: Free-letter tap and drag, the WordCell drag ghost, the caret (F16), and the D-block mirror parting exception in the DOM.
Consumers (list in the ticket review): The WordCell press path also serves the long-press peek, sticky view and hover peek (epic 4 CAP-9) and entry 9's target tap; the parting-offset function from entry 6 is shared with entry 7.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the following:

- UI Vitest: `AD-12` free-letter parting offsets with the block on the right across a row break, the mirrors' segment ends and locks from their parted slots (SPEC CAP-6); `AD-12` a free-letter drag ended by `pointercancel`/`lostpointercapture` and by `act()`/`cancel()` dispatches nothing, clears ghost and caret and leaves nothing selected; `AD-12` F18 the tile selection cleared at the 8 px threshold.
- Playwright on android, on session-idle-empty-column after a drop (cell 7 is the only source, so tap-add and drag-insert run from separate loads): with the block left, a tap-add appending cell 7's top with the cell used, and a drag-insert at an inner gap storing the index equal to the gap in M with the cell used (used-hatch mirror), mid-drag the cell showing the ghost without the used state, each saved before the next action (R-73 (UI)); the caret at the end gap of M with the block left and with k = 0 (a tail dropped on empty column 1); tap and drag on a used or empty cell leaving the stored Session byte-identical with a tile selection kept; a long-press peek on available cell 7 with a tile selected leaving the stored Session byte-identical, cell 7 not used and the tile still selected (SPEC CAP-6, R-65).
- Full layout: 7 card-mode tiles (e.g. column 2's whole 7-card tail dropped on empty column 1, k = 0), then cell 7's top dragged, else session-composing-long.json (Notes); the caret shown and the drop asserted by the stored Session (a third compact row is clipped until CAP-9).
- Block right: a tail dropped onto a non-empty column with the block on the right (`⇄ Flip` as needed), cell 7's top dragged to a gap before the block, the D-block mirrors shifted while parted and, where the layout crosses a row break, one closed segment with its own lock per row (else the Vitest above is the coverage). R-32: a free letter released over or past the block is stored at index |M|; with the block left, one released over the block lands at gap 0.
- Ends: a release outside the tray band and one under 25 % (epic Done when 3), `pointercancel` and an App button (`act()`) mid-drag each leaving the stored Session byte-identical with the cell not used; hidePage mid-drag dispatching nothing; `page.goBack()` mid-drag leaving the app with the Session equal apart from `activeMs`, read after `page.goForward()`.
- Epic Done when 4: exactly 52 `[data-card-id]` mid-drag (ghost shown, mirrors parted) and after the drag-insert; mirrors carry only the parting transform (no other animation) and are at rest after release.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-5 (Free-letter parting with room), CAP-6
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band)

## Notes

- Open question (settled by default): the full-layout caret runs on session-idle-empty-column by a 7-tile card-mode route; if none fills the layout at 412 px, this entry scripts session-composing-long.json (14 tray tiles with canIncK, entry 12's fixture) early, adds it to the fixture lists, and entry 12 reuses it. The plan records which route held (unattended build).
