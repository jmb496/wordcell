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

Builds the pure functions entries 7 and 8 drive: `insertionIndex(dragged, gapRects)` in gestures/targeting.ts per F3 (`gapRects` `{ index, rect }[]`, one rect centred in each gap at tile height plus a second rect for a row-break index, start and end gaps a half-gap outside a row's tiles, Euclidean distance from the dragged face's centre to the nearest rect of each index, ties to the lower index; Composing gaps 0…|M| only, never inside or beyond the destination block; Place every strip card movable, gaps 0…n), the gap-rect builder in layout/tray.ts from resting slot rects, the reorder rule (gap i over the sequence including the dragged tile j: insert at i when i ≤ j, else i − 1; a free-letter gap is the index in M), and one pure parting-offset function for a reorder (origin slot collapses, tiles between origin and gap shift one slot pitch in reading order across a row break, D-block mirrors never move) and for a free-letter insert with room (no origin slot, every tile after the gap shifts, the D-block mirrors included when the block is on the right, with segment ends and locks from their parted slots).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (no baseline change) with UI Vitest AD-12 insertionIndex cases (single row, two compact rows, block at either end, ends of M, ties, a drag right by one past the neighbour's centre, a drag to the far end, the Place strip with D cards movable) and parting-offset cases (reorder across a row break, a drag right by two, a free-letter insert with the block on the right across a row break with the mirrors' segment ends and locks).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-5 (insertionIndex gap rects, Parting, Reorder result, Free-letter parting with room)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band parting geometry)

## Notes

- Open question: Whether nearest-gap without hysteresis oscillates when the dragged centre sits between two gap rects ([ASSUMPTION] build-notes CAP-5: not needed); the resting rects keep the targets fixed.
