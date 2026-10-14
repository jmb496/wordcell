---
id: 12
type: story
title: "Tray growth wiring"
parent: epic-tray-and-place
covers: [CAP-9]
after: [11]
risk: high
---

# Tray growth wiring

## Description

Feeds `trayLayout(tile count).rows` (D-block mirrors counted) into layout.svelte.ts in place of `TRAY_ROWS = 1` (F10) after every completed edit (drop, free-letter add, removal, k change, Undo, Redo, a commit, restore), never during a drag, with the Tray's tile mode and row count read from the same row count; per AD-11 (amended, F24) `flip.capture()` first calls `gate.scrollReset()`, the band re-layout (w fixed) and its anchor `scrollTop` delta apply in the same update as the move, `flip.play` measures after it, and a move's re-layout that finds the gate busy throws (rule 6); scripts session-composing-long.json [ASSUMPTION name] (or reuses it if entry 8 scripted it) (14 tray tiles with `canIncK`, one `+` → 15, three compact rows) and a valid Place Session whose strip spans three compact rows, both added to serialize.test.ts and the AD-17 valid-fixture list.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-11 row count → bands() and a 14 → 15 + dispatched within 150 ms of a scroll (busy cleared, the 15th tile, band height and hit rects change in the move's update, glide starts at once), and Playwright on android at 412 × 839 and 412 × 780 shows the WordCell row's bounding box unchanged after growth to three compact rows by + on the long Composing fixture and back by −, the document scrolling by the shortfall at 780, and on the three-row Place fixture Confirm, Undo and Redo each changing the rows with the move, the WordCell row unchanged and the flying cards visible, and after + 14 → 15 on the long Composing fixture no running animation on any column face (a pure band shift).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-9
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-11
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band, A-D4)

## Notes

- Open question: The anchor scrollTop write's effect on a running fling on Android is unverified and goes to the epic 7 device checks; whether both long-word Sessions are scriptable from session-won's moves (SPEC Assumptions).
