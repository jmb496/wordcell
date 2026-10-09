---
id: 5
type: story
title: "Tile tap: selection, swap and removal"
parent: epic-tray-and-place
covers: [CAP-4]
after: [4]
risk: high
---

# Tile tap: selection, swap and removal

## Description

Adds the tile selection (F1) to overlays.svelte.ts beside the tail selection (no history entry, cleared by resetForNewSession) and resolves `data-place` `tray`/`strip` presses as tile presses and a D-block mirror press as a block press (F2, superseding epic 4 F23's inert tiles, each tile hit-testing on its full pitch with the 4 px lift on the face only), with a pure `tileTap(hit, view, tileSelection)` in gestures/tile.ts: a tap on a movable (S or free letter) or strip tile selects it (teal outline, face lifted), a tap on another swaps the two with one `arrange` / `setPlacementOrder` and ends the selection, a second tap on a selected source or strip tile deselects and on a selected Composing free-letter tile (showing `↩`) dispatches `removeFreeLetter` (Q-31); taps on the destination block, a used or empty WordCell in Composing and a not-legal WordCell in Place keep it, every other tap clears it, `act()` clears it after `cancel()` and before its handler, and the controller's root tap path (epic 4 F25) clears it on disabled controls, labels, the tray band background and the top bar; a drag crossing 8 px from a target with no drag behaviour and ending in `pointerup` acts as that target's tap (a legal non-current Place cell: no dispatch, cleared) while one ended by `pointercancel`/`lostpointercapture` keeps it; back ignores it (bare-Board rule).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-12 tileTap intent cases, an inert-target drag case and a ≥ 8 px move then pointercancel on the tray background keeping the selection, and Playwright on android shows on session-composing, session-place and session-place-free-letter-redo-tail after one Undo each select/swap/deselect/remove path by current() and the stored Session, a swap of cards 38 and 37 (both R) as an edit at Composing (session-won + two Undos) and at Place (session-won + one Undo: Redo disabled, stored reached place), three tile edits then one Undo returning to Idle, back with a tile selected leaving the app (bare-Board rule), a disabled − tap at k = 1 and +, Validate and Undo pressed with a tile selected clearing it, ↩ on the compact QU free letter of session-place-compact after one Undo, and a reload in Composing with a free letter after a tap-swap showing the same tray and tags with nothing selected.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-4
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns (Movable tile, Destination block)

## Notes

- Open question: Whether one clear-rules function can serve both the controller tap path and act() without act() learning the tap target; build-notes CAP-4 suggests act() calls overlays.clearTile() after cancel().
