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

- **State (F1, AD-13):** overlays.svelte.ts gains `tileSelection: CardId | null` (`selectTile`, `clearTile`) beside the tail selection; no history entry; resetForNewSession clears it; back ignores it (bare-Board rule).
- **Press resolution (F2, superseding epic 4 F23's inert tiles):** `data-place` `tray`/`strip` presses resolve to a tile hit carrying the card and whether it is a D-block mirror (a block press); each tile hit-tests on its full pitch, the 4 px lift on the face only. Tiles have no long-press: a hold under 8 px is a tap.
- **Tap outcomes:** a pure `tileTap(hit, view, tileSelection)` in gestures/tile.ts, total over Hit, returns select | deselect | swap | remove | keep | clear; the controller calls it on every released tap and drag-as-tap. A tap on a movable (S or free letter) or strip tile selects it (DESIGN.md Tile: teal 2 px outline, face lifted 4 px; distinct from the column `lifted` look; a `selected` class on the live tile). A tap on another swaps the two with one `arrange` / `setPlacementOrder` and ends the selection. A second tap on a selected source or strip tile deselects (no `↩`); on a selected Composing free-letter tile (showing `↩`) it dispatches `removeFreeLetter` (Q-31) for the `draft.freeLetters` cell whose top card is the tile (CAP-3 lookup, as tags.ts `originCard`).
- **Keep:** taps on the destination block (R-32 (UI)), a used or empty WordCell in Composing, a not-legal WordCell in Place; a WordCell long-press peek, its sticky continuation and the consumed tap closing a sticky view (F13; EXPERIENCE.md WordCell view); a press ended by `pointercancel`/`lostpointercapture`; a hide/show without reload (F1).
- **Clear:** every other tap, e.g. the current target cell (F13) and, on the controller's root tap path (epic 4 F25), disabled controls, labels, the tray band background, the gap above the action bar, the top bar. F1/AD-4: it ends on any changed DispatchResult and any phase change. Every UI dispatch outside act() (the controller's swap, `removeFreeLetter`, `addFreeLetter`, `tapDestinationCard`, `setTarget`) clears it when `changed`; `act()` calls `overlays.clearTile()` unconditionally after `cancel()` and before its handler, so every enabled button clears; shell never imports UI (rule 2). Never clear inside the controller's `cancel()` (the hide flush calls it, AD-9).
- **Drag:** a press on a non-tile target with no drag behaviour crossing 8 px and ending in `pointerup` acts on the tile selection as that target's tap would (keep or clear) and dispatches nothing (build-notes CAP-4), e.g. a legal non-current Place cell clears, a D-block mirror drag keeps. Epic 4's destination-column drag-as-tap (`tapDestinationCard` at pointerup, R-39) is unchanged and, as a changed dispatch, clears. Tiles have no drag motion until CAP-5 (ticket 6): a tray/strip tile press crossing 8 px dispatches nothing and clears the selection at the threshold whatever end follows (F18).
- **Look:** the selected tile's lifted face and outline stay fully visible in every row (TileRows.svelte `.tiles` has `overflow: hidden`, rows top-aligned); mechanism is the plan's; note any screenshot baseline regenerated.
- **F2 carve-out:** the F25 non-pointer click path (controller.ts:719-727 `click()`) still treats a tile as outside for a tail selection; `tapAction` never receives a tile hit (tile hits route to `tileTap`).
- **Interface:** overlays tile selection; new gestures/tile.ts; act.ts clears after `cancel()`; controller resolves tray/strip/block presses; intent.ts drops its tile case.
- **Owns:** the tile selection and its clear rules (F1, F13), tile press resolution (F2), gestures/tile.ts, act()'s tile clear.
- **Consumers:** changing the F25 outside-tap classification (intent.ts:131, controller.ts:719-727) and act(): list the tail-selection deselect paths, the scrim click swallower and every act()-wrapped button.
- **Tests:** R-32 (UI), R-33, R-73 (UI) P5; R-33/Q-31, R-34, R-35, R-51, R-71, R-72 P5 supp.; AD-4, AD-12, AD-13 S + P5 (below).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with:

- UI Vitest: AD-12 tileTap intent cases; tray/strip/block-mirror press resolution, a hit inside the pitch but outside the face resolving to the tile; an inert-target drag case; a ≥ 8 px move then pointercancel on the tray background keeping the selection; AD-12/AD-9 the controller's `cancel()` (before-hide path) keeping it; AD-4 act() clearing before its handler and a changed controller dispatch clearing; AD-13 resetForNewSession clearing it and no history entry pushed.
- Playwright on android (selection by the live tile's `selected` class; edits by current() and the stored Session):
  - Composing select/swap/deselect on session-composing and session-place-free-letter-redo-tail + one Undo (remove only there); strip paths on session-place; the selected source tile (Composing) and a selected strip free-letter tile (Place) show no `↩` before the second tap (R-35).
  - R-33/Q-31 on session-place-compact + one Undo (arrangement [35, 1, 38, 44, 11], compact QU free letter 35 from cell 4): tap-swap it into a middle slot, remove it with `↩`; the stored arrangement is the old one minus 35, in order.
  - R-71: swap cards 38 and 37 (both R) at Composing (session-won + two Undos) and at Place (session-won + one Undo); each: Redo disabled, stored Session has no redo tail, 38 and 37 exchanged.
  - Three tile edits then one Undo on session-composing return to Idle.
  - Keep with a tile selected (selection kept, stored Session byte-identical): a D-block tile tap (R-32 (UI)); a used or empty WordCell in Composing (session-place-free-letter-redo-tail + one Undo, cell 3 used); a not-legal WordCell in Place.
  - Clear with a tile selected: the current target cell (F13), the tray band background, the letter-count label, the top bar, an inert column card, a disabled − at k = 1; +, Validate and Undo; a Validate rejected as not a word (still Composing, rejected-word line shown); opening the menu.
  - Full pitch: a coordinate tap in the 4 px gap between two tiles and in a compact row gap selects the adjacent tile; the selected tile's slot rect is unchanged by the lift.
  - Back with a tile selected leaves the app (bare-Board rule).
  - R-73: in Composing with a free letter, tap-swap, select a tile, reload: same tray and tags, nothing selected.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-4
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns (Movable tile, Destination block)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Tile

## Notes

- Decided (was open): act() clears unconditionally after `cancel()` and needs no target; target-dependent keep/clear lives only in `tileTap`.
