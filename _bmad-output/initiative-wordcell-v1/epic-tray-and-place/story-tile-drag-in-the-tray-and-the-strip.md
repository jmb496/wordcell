---
id: 7
type: story
title: "Tile drag in the tray and the strip"
parent: epic-tray-and-place
covers: [CAP-5]
after: [5, 6]
risk: high
---

# Tile drag in the tray and the strip

## Description

Adds the tile drag to the controller (CAP-5) on entries 5 and 6: a tile press crossing 8 px clears the tile selection (F18) and drags the tile by `transform` on its face with no Svelte state until release; the tray band, clipped to the visible band (F4), is the single drop target accepted at ≥ 25 % of the dragged face's area; while accepted the other movable tiles part to the `insertionIndex` gap over `duration('parting')` (snap under reduced motion) by face transforms only, nothing drawn at the gap, and under 25 % every tile rests with the origin slot open; release over an accepted gap dispatches one `arrange` / `setPlacementOrder` iff the order changes by card, otherwise the tile flies back by the epic 4 `flyBack` with no edit (never a removal; the landing glide on an edit is entry 10's); a D-block mirror drag moves nothing and keeps a tile selection; platform cancel flies back, a back mid-drag leaves the app (bare-Board rule) and hide or `act()` settles the drag at once with no dispatch (F5).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-10 parting duration and reduced-motion snap and AD-12 a tile drag cancelled by pointercancel with a tile selected ending with nothing selected, and Playwright on android shows drag-reorder in the tray (session-composing) and the strip (session-place), the tray band's drop rect clipped to the visible band under a sticky bar (F4), a release under 25 % leaving the stored Session byte-identical, a free-letter tile dragged out and released there not removed with its cell still used, a block-mirror drag with no dispatch and the selection kept, a tile dragged past the block landing at the M end, a strip drag released over its own gap leaving Redo enabled on session-won + one Undo, each tray tile face's getBoundingClientRect equal to `slotRects(trayLayout(...), origin, n)` at rest on session-composing and session-place-compact and in at least one parted position mid-drag (entry 6's deferred geometry check), hidePage mid-drag dispatching nothing, and page.goBack() mid-drag leaving the app with the Session equal to the pre-drag one apart from activeMs read after page.goForward().

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-5
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns (Movable tile), Motion

## Notes

- Open question: Whether page.goForward() restores the app after a back mid-drag on Playwright 1.63 (default) or the storageState() read is needed (alternative, unverified).
