---
id: 6
type: story
title: "insertionIndex, gap rects and parting offsets"
parent: epic-tray-and-place
covers: [CAP-5, CAP-6]
after: [4]
risk: medium
---

# insertionIndex, gap rects and parting offsets

## Description

Builds the pure functions entries 7 and 8 drive (F3, build-notes CAP-5, CAP-6).

- Interface: gestures/targeting.ts gains `insertionIndex(dragged: Rect, gapRects: { index: number; rect: Rect }[]): number` and `reorder(order: readonly CardId[], j: number, i: number): readonly CardId[]`; layout/tray.ts gains `slotRects(sizing, origin, slots)`, `gapRects(slots, first, count)`, `partingOffsets(slots, tileCount, first, count, gap, origin?)` and `segmentEnds(slot, perRow, mirrorBySlot): { start, end }`.
- Slot rects: from `trayLayout` numbers (column pitch tileWidth + 4 px gap; compact row pitch tile height + 4) and the tile area's origin measured once at drag start; slot k exists for any k < perRow × rendered rows (a free-letter insert's slot n included). `gapRects` and `partingOffsets` both use them.
- `insertionIndex`: Euclidean distance from the dragged face's centre to the nearest of that index's gap-rect centres (F3), ties to the lower index. Throws on an empty `gapRects` (gap 0 always exists, even with |M| = 0) and on a zero-area dragged rect, like `pickTarget`.
- `gapRects`: over the movable run [first, first + count) in tray positions (Composing M: first = k with the block on the left, 0 on the right; Place the whole strip, every card movable), indices 0…count over that run only, so none lies inside or beyond the block; the index is the gap in M or `placementOrder`, not the tray position (build-notes CAP-6). A rect is the 4 px gap's width, centred in it, at tile height (CAP-6's caret draws at the winning rect); a row's start and end gaps sit a half-gap outside its tiles; a row-break index gets a second rect (end of row r, start of row r+1), none after the last row. Where M meets the block at a row break, the boundary gap gets rects only on M's side (the half-gap before M's first tile / after M's last); a row-break pair only between two movable tiles. Covers every rendered row; clipping rows past the second until CAP-9 is entry 7's tray-band acceptance.
- `reorder`: over M (Composing) or `placementOrder` (Place), j the dragged tile, i the gap over the sequence including it: insert at i when i ≤ j, else i − 1; returns the new order, or the input reference when unchanged by card (gaps j and j + 1). A free-letter gap is the index in M directly.
- `partingOffsets` returns per tray position its parted slot index and `{ dx, dy }` from the slot rects. Reorder (`origin` j): the origin slot collapses; drag right (i > j + 1) the tiles at j+1…i−1 each take the slot one back; drag left (i < j) the tiles at i…j−1 each take the slot one forward; across a row break to the adjacent row's last/first slot (build-notes CAP-5); D-block mirrors never move. Free-letter insert (no `origin`): every tile after the gap takes the slot one forward, the D-block mirrors included when the block is on the right. Entry 8 decides room by SPEC CAP-6's full rule and never calls it without room; such a call throws (rule 6). A gap that moves no tile (end gap of M with the block on the left, or k = 0) returns all-zero offsets (entry 8 shows the caret, CAP-6).
- `segmentEnds`: the D-block segment rule extracted from `segment(i)` in tray/TileRows.svelte, which then uses it with no visible change; parted segments are `segmentEnds` over the parted slots.
- Owns: `insertionIndex`, `slotRects`, `gapRects`, `reorder`, `partingOffsets`, `segmentEnds`; entries 7 and 8 call them and never re-derive a gap, offset or segment.
- Consumers: targeting.ts holds epic 4 `pickTarget` and `Rect`, used by gestures/controller.ts (`pickTarget` at the source-left check and the column drop target; `Rect`) and gestures/visible-band.ts (`Rect`), which stay unchanged; layout/tray.ts `trayOrder` feeds Tray.svelte and `trayLayout` feeds tray/TileRows.svelte (layout.svelte.ts imports neither).
- Tests (S): AD-12 insertionIndex nearest gap, wrapped rows by distance, never inside or beyond the block; `AD-12 destination cards never reordered or interleaved` (backs rule-coverage's R-32 V row, supplementary); AD-12 parting offsets across a row break and drag right by two; AD-12 free-letter parting offsets with the block on the right across a row break (CAP-6).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (no baseline change) with UI Vitest AD-12 cases:

- insertionIndex: single row, two compact rows, block left, block right and k = 0 (indices in M), ends of M, ties (lower index), a drag right by one past the neighbour's centre (gap j + 2, order changes by one), a drag to the far end, the Place strip with D cards movable, empty `gapRects` and zero-area dragged rect throw.
- reorder: gaps j and j + 1 return the input reference.
- parting offsets: reorder across a row break; a drag right by two (origin j, gap j + 3: tiles j+1, j+2 one slot back each); free-letter with the block on the right across a row break (the mirrors' parted segments and locks via `segmentEnds`); free-letter with the block on the left (mirrors unmoved, only M tiles after the gap shift); a gap that moves no tile (all zero); a free-letter call without room throws.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-5 (insertionIndex gap rects, Parting, Reorder result, Free-letter parting with room)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band parting geometry)

## Notes

- Settled ([ASSUMPTION] build-notes CAP-5): no hysteresis; resting rects fix the targets and ties go to the lower index, so the midpoint result is deterministic.
