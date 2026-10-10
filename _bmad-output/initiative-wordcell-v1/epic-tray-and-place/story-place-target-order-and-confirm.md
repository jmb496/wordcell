---
id: 9
type: story
title: "Place target, order and Confirm"
parent: epic-tray-and-place
covers: [CAP-7]
after: [8]
risk: high
---

# Place target, order and Confirm

## Description

Completes the move (CAP-7) in Place legal cells ringed, not-legal faded, the stored target pre-selected; a tap on a cell with `canSetTarget` dispatches `setTarget` keeping `placementOrder` (R-51), a long-press ≥ 400 ms on an empty WordCell acts as a tap on release on the cell where it started (the timer wins once fired, the 8 px drag before it; Composing: no dispatch, selection kept), a used cell stays a legal target (R-41, Q-02), a not-legal or current-target tap dispatches nothing (the current-target tap clears the tile selection, F13), WordCells otherwise respond only to viewing (R-39); Confirm commits (R-60, R-61, R-52, R-62 into Game over with no end sheet); scripts the valid free-letter fixture whose free letter comes from a cell ≤ L that is not the stored target and holds exactly 2 cards (count badge 2 before Confirm, 2 → 1 after, S15), added to serialize.test.ts and the AD-17 valid-fixture list.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows on session-place, session-place-free-letter-redo-tail and session-won + one Undo the ring/fade/pre-selection, retargets keeping the order, the empty-cell long-press (also released after moving past 8 px after 400 ms) and current-target tap, R-41 and R-61 as two tests on the scripted fixture with the badge 2 → 1, Confirm into the free letter's own cell leaving the strip's last card on top, Confirm on session-won + one Undo entering Game over, a long-press peek on a non-empty Place cell still opening, and a reload in Place on the scripted free-letter fixture after a retarget and strip reorder showing the same strip, tags and target with the free letter's cell still the used-hatch mirror and nothing selected.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-7, Sweep inventory S15
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Place, Flows 1–3

## Notes

- Open question: Whether one scripted Place fixture meets every condition (free letter from a cell ≤ L, not the stored target, holding exactly 2 cards) under the epic 3 regeneration rule.
