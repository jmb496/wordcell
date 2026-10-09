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

- Interface: gestures/targeting.ts gains `insertionIndex(dragged: Rect, gapRects: { index: number; rect: Rect }[]): { index: number; rect: Rect }` (the winning entry; gap callers read `.index`) and `reorder(order: readonly CardId[], j: number, i: number): readonly CardId[]`; layout/tray.ts gains `slotRects(sizing, origin: { x, y }, slotCount): Rect[]`, `gapRects(slots, first, count)`, `partingOffsets(slots, tileCount, first, count, gap, from?)` and `segmentEnds(slot, perRow, mirrorBySlot: readonly boolean[]): { start, end }`; `TrayLayout` gains `tileHeight` (card H, compact 44).
- Slot rects: from `trayLayout` numbers (column pitch tileWidth + 4 px gap; compact row pitch tileHeight + 4) and an origin at the wrapper at tray position 0 (live tile or mirror), top-left + 2 px in x (never a face rect or the 6 px-raised `.tiles` box), measured once at drag start; a slot rect is the unlifted face, tileWidth × tileHeight; slotCount is perRow × rendered rows (slot n only with room).
- `insertionIndex`: Euclidean distance from the dragged face's centre to the nearest of that index's gap-rect centres (F3), ties to the lower index. Throws on an empty `gapRects` (gap 0 always exists) and a zero-area dragged rect, like `pickTarget`.
- `gapRects`: over the movable run [first, first + count) in tray positions (Composing M: first = k with the block on the left, 0 on the right; Place the whole strip, every card movable), indices 0…count over that run only, so none lies inside or beyond the block; the index is the gap in M or `placementOrder`, not the tray position (build-notes CAP-6). A rect is the 4 px gap's width, centred in it, tileHeight tall (CAP-6's caret draws at the winning rect); a row's start and end gaps centre a half-gap outside its tiles; a row-break index gets a second rect (end of row r, start of row r+1), none after the last row. M's boundary gap with the block at a row break gets both too, neither inside the mirror slots. Covers every rendered row; clipping rows past the second until CAP-9 is entry 7's tray-band acceptance.
- `reorder`: over M (Composing) or `placementOrder` (Place), j the dragged tile, i the gap over the sequence including it: insert at i when i ≤ j, else i − 1; returns the new order, or the input reference when unchanged by card (gaps j and j + 1).
- `partingOffsets` returns per tray position its parted slot index and `{ dx, dy }` from the slot rects; `gap` and `from` are run indices, run index i at tray position first + i. Reorder (`from` j): the `from` position keeps its own slot and zero offsets (its face follows the drag); drag right (i > j + 1) run tiles j+1…i−1 take the slot one back; drag left (i < j) run tiles i…j−1 take the slot one forward; across a row break to the adjacent row's last/first slot (build-notes CAP-5); D-block mirrors never move. Free-letter insert (no `from`): every tile after the gap takes the slot one forward, the D-block mirrors included when the block is on the right. A free-letter call with tileCount + 1 > slots.length throws (rule 6); entry 8 decides room by SPEC CAP-6's full rule. A gap that moves no tile (the end gap of M when the block is on the left or k = 0) returns all-zero offsets (entry 8 shows the caret, CAP-6).
- `segmentEnds`: the D-block segment rule extracted from `segment(i)` in tray/TileRows.svelte, which then uses it with no visible change; parted segments are `segmentEnds` over the parted slots.
- Owns all six; entries 7 and 8 call them and never re-derive a gap, offset or segment.
- Unchanged for consumers: `pickTarget`, `Rect` (gestures/controller.ts, gestures/visible-band.ts), `trayOrder` (Tray.svelte), `trayLayout` (tray/TileRows.svelte).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (no baseline change) with UI Vitest AD-12 cases:

- AD-12 insertionIndex nearest gap, wrapped rows by distance, never inside or beyond the block: single row, two compact rows, block left, block right and k = 0 (indices in M), ends of M, ties (lower index), a drag right by one past the neighbour's centre (gap j + 2, order changes by one), a drag to the far end, the Place strip with D cards movable, a row-break index whose start-of-row rect wins (that rect returned), empty `gapRects` and zero-area dragged rect throw.
- AD-12 slotRects: card and compact pitches, + 2 px origin, slot n with room. AD-12 gapRects: half-gap row ends, a row-break pair, none after the last row, M meeting the block at a row break (both rects), block on each side; segmentEnds at rest for a 3-tile block within a row and split by a row break, literals from today's `segment(i)`.
- `AD-12 destination cards never reordered or interleaved` (backs rule-coverage's R-32 V row, supplementary): Composing, block on either side: gapRects yields only indices 0…|M|, no rect inside or beyond the mirror slots; reorder and reorder-mode partingOffsets never move a D position.
- AD-12 reorder: a drag left (inserts at i) and a drag right (at i − 1); gaps j and j + 1 return the input reference.
- AD-12 parting offsets across a row break and drag right by two (from j, gap j + 3: tiles j+1, j+2 one slot back each) and drag left by two (gap j − 2: tiles j−2, j−1 one slot forward); AD-12 free-letter parting offsets with the block on the right across a row break (CAP-6; the mirrors' parted segments and locks via `segmentEnds`); free-letter with the block on the left (mirrors unmoved, only M tiles after the gap shift); a free-letter gap that moves no tile (all zero); a free-letter call without room throws.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-5 (insertionIndex gap rects, Parting, Reorder result, Free-letter parting with room)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band parting geometry)

## Notes

- Settled ([ASSUMPTION] build-notes CAP-5): no hysteresis; resting rects fix the targets.
