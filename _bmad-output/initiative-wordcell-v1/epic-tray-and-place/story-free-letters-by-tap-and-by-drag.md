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

Adds free letters from WordCells (CAP-6) to the controller's WordCell press path in Composing: a tap on a cell with `canAddFreeLetter` clears a tile selection first (`tileTap`) and dispatches `addFreeLetter { cell }` (appended), a tap on a used or empty cell dispatches nothing and keeps a tile selection, and any press the controller resolves as the WordCell's hit (as the tap) on a cell with `canAddFreeLetter` crossing 8 px before the 400 ms long-press drags the top card's live face, clears any tile selection (F18) and leaves a 1 px dashed ghost in the cell (card beneath hidden, badge still counting it, R-61, DESIGN.md WordCell), inserting at the entry 6 gap in M with `addFreeLetter { cell, index }` when released over the clipped tray band (entry 7's `trayTarget()`) at ≥ 25 % (the cell takes the used state only then); while accepted the tiles after the gap part with the D-block mirrors shifting too when the block is on the right (the one AD-14 mirror-motion exception), and a 3 px teal caret marks the gap instead while the layout is full (the current tile count (S + F + D mirrors) + 1 > `perRow` × the rows `TileRows` renders (`trayLayout`'s once CAP-9 lands), checked before calling `partingOffsets`) or when the gap moves no tile (end of M with the block left or k = 0); a release outside the tray band or under 25 % dispatches nothing; used/empty-cell drags and every WordCell drag outside Composing dispatch nothing, the tile selection per `tileTap` (F13; SPEC CAP-4's legal non-current Place cell drag clears it); a long-press peek with a tile selected keeps it.

- Caret (F16): `TileRows.svelte` renders one hidden caret element (3 px teal, tile height, DESIGN.md Tray band); the controller shows it and positions it by DOM at the gap rect `insertionIndex` returned (the winning rect at a row-break gap), parted tiles staying at rest while it shows; it hides under 25 %, outside the band and at every end. No Svelte state mid-drag (AD-12).
- Mirror segments (SPEC CAP-6): Card.svelte renders the lock on every block mirror, CSS showing it on the resting `.start` or a parted start; while parted, the controller toggles dedicated parted classes (e.g. `wc-part-start`/`wc-part-end`, overriding `.start`/`.end` in CSS, never Svelte's own classes) from `segmentEnds` over the parted `mirrorBySlot` (each mirror's free-letter `partingOffsets` slot), restored at every end.
- Ends and motion (as entry 7's tile drag, face on `DRAG_LAYER`): parting runs over `duration('parting')`, snapping under reduced motion; a no-edit release (outside the band, under 25 %), `pointercancel`, `lostpointercapture` and `cancel({ byBack })` fly the face back to its cell by `flyBack` (the fade under reduced motion) while parted tiles and mirrors return, ghost and caret clearing at the settle; `cancel()` from `act()` or hide settles everything at once (F5); a release with an edit finishes the parting, clears the drag (ghost, caret, segment classes), leaves the gate, then dispatches, with no landing glide (CAP-8, F17, entry 16).
- Coexistence: a press reaching 400 ms stays a peek and never becomes a drag; at the threshold crossing the hover peek hides and closes at the end as for the tile drag; Place and Idle press handling is unchanged.

Interface: Controller WordCell press path gains free-letter tap and drag; WordCellRow.svelte styles the dashed `DRAG_GHOST` (reused); TileRows.svelte gains the caret; Card.svelte renders the lock on every block mirror (CSS-shown); no new engine (AD-2) exports; new classes.ts constants only for the caret and parted segment classes, and one pure tile.ts free-letter entry point (e.g. `freeLetterRun(view, cell)` giving the run and the release → `addFreeLetter { cell, index }`, index the gap in M per build-notes CAP-6) with its Vitest.
Tests: R-33 (UI) choosing a WordCell marks it used, after tap-add and drag-insert, ghost during the drag (P5); R-33 a tap on a used or empty WordCell is a no-op (P5 supp.); R-33/Q-31 tap appends, drag inserts at the gap (P5 supp.); R-32 never inside or beyond the block (P5 supp.); R-73 (UI) tap-add and drag-insert saved before the next action (P5 part); R-65 (UI) a long-press peek in Composing with a tile selected keeps it (P5); AD-12 tray band >= 25 % and free-letter cancel paths (P5); AD-14 D-block mirrors carry the parting shift only (P5 part).
Owns: Free-letter tap and drag, the WordCell drag ghost, the caret (F16), and the D-block mirror parting exception in the DOM.
Consumers: The WordCell press path also serves the long-press peek, sticky view and hover peek (epic 4 CAP-9) and entry 9's target tap; the parting-offset function from entry 6 is shared with entry 7.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the following:

- UI Vitest: `AD-12` a block-right free-letter drag across a row break writes the parted segment and lock classes on the mirrors from their parted slots and restores them at the end (entry 6's tray.test.ts keeps the pure offsets); `AD-12` a free-letter drag ended by `pointercancel`/`lostpointercapture` and by `act()`/`cancel()` dispatches nothing, clears ghost and caret and leaves nothing selected; `AD-12` F18 the tile selection cleared at the 8 px threshold.
- Playwright on android, on session-idle-empty-column after a drop (cell 7 is the only source, so tap-add and drag-insert run from separate loads; `⇄ Flip` sets either block side): with the block left, a tap-add with a tile selected appending cell 7's top, cell used and nothing selected, and a drag-insert at an inner gap storing cell 7's top at that gap of M in `arrangement`, cell used (used-hatch mirror), mid-drag the cell showing the ghost (badge unchanged, no card beneath) without the used state, each saved before the next action (R-73 (UI)); the caret at, and a release into, the end gap of M (tiles untransformed) with the block left and with k = 0 (a tail dropped on empty column 1); tap and drag on a used or empty cell leaving the stored Session byte-identical with a tile selection kept; a long-press peek on available cell 7 with a tile selected, the peek shown, leaving the stored Session byte-identical, cell 7 not used and the tile still selected (SPEC CAP-6, R-65).
- Full layout: 7 card-mode tiles (e.g. column 2's whole 7-card tail dropped on empty column 1, k = 0), then cell 7's top dragged, else session-composing-long.json (Notes); held over an inner gap (0 < gap < |M|), the caret shown with every tile face untransformed, and the release stored with cell 7's top at that gap of M (a third row clips until CAP-9).
- Block right: a tail dropped onto a non-empty column with the block on the right, cell 7's top dragged to a gap before the block, the D-block mirrors shifted while parted and, where the layout crosses a row break, one closed segment with its own lock per row (else the controller Vitest above is the coverage). R-32 (block within one row, F25; a separate single-row drop): a free letter released over or past the block is stored at the end of M; with the block left, one released over the block lands first in M.
- Ends: a release outside the tray band, one under 25 % (epic Done when 3) and `pointercancel` each leaving the stored Session byte-identical, cell 7 unused; an App button (e.g. `+`) mid-drag settling the drag at once and storing only its own command, cell 7 unused, nothing selected; hidePage mid-drag storing the pre-drag Session bar `activeMs`; `page.goBack()` mid-drag leaving the app with the Session equal bar `activeMs`, read after `page.goForward()`.
- Desktop (`desktop` project): hover cell 7 until the hover peek shows, then mouse-drag its top past 8 px: the peek hidden mid-drag and closed after release, the drop stored.
- Epic Done when 4: exactly 52 `[data-card-id]` mid-drag (ghost shown, mirrors parted) and after the drag-insert; mirrors carry only the parting transform and are at rest after release.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-5 (Free-letter parting with room), CAP-6
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band)

## Notes

- Open question (settled by default): the full-layout caret runs on session-idle-empty-column by a 7-tile card-mode route; if none fills the layout at 412 px, this entry scripts session-composing-long.json (14 tray tiles with canIncK, entry 12's fixture) early, adds it to the fixture lists, and entry 12 reuses it. The plan records which route held.
