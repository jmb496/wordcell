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
- **Press resolution (F2, superseding epic 4 F23's inert tiles):** a `data-place` `tray`/`strip` press resolves to a tile hit (the card); a tray-band `data-mirror-of` press to a block hit (F2: keep). Each tray/strip slot, block mirrors included, hit-tests on its full pitch (the 4 px and compact row gaps split at the midline, 2 px per side); the 4 px lift moves the face only. No tile long-press: a hold under 8 px is a tap.
- **Tap outcomes:** a pure `tileTap(hit, view, tileSelection)` in gestures/tile.ts, total over Hit, returns select | deselect | swap | remove | keep | clear; called on every released tap and drag-as-tap. A tap on a movable (S or free letter) or strip tile selects it (DESIGN.md Tile; a `selected` class on the live tile, distinct from the column `lifted` look). A tap on another swaps them with one `arrange` / `setPlacementOrder`. A second tap on a selected source or strip tile deselects (no `↩`); on a selected Composing free-letter tile it dispatches `removeFreeLetter` (Q-31) for the `draft.freeLetters` cell whose top card is the tile (as tags.ts `originCard`).
- **Keep:** taps on the destination block (R-32 (UI)), a used or empty WordCell in Composing, a not-legal WordCell in Place; a WordCell long-press peek, its sticky continuation, the consumed tap or back closing a sticky view (F13; EXPERIENCE.md WordCell view); a non-tile press ended by `pointercancel`/`lostpointercapture`; a hide/show without reload (F1).
- **Clear:** every other tap, e.g. the current target cell (F13), any column card or space whatever the dispatch result, and, on the root tap path (epic 4 F25), disabled controls, labels, the tray band background, the gap above the action bar, the top bar. F1/AD-4: also any phase change; the controller clears it after a `changed` swap, `removeFreeLetter` or `tapDestinationCard` (the only dispatches this ticket wires); until tickets 8/9 wire `addFreeLetter`/`setTarget`, an available Composing or legal non-current Place cell clears, dispatching nothing. `act()` calls `overlays.clearTile()` unconditionally after `cancel()`, before its handler (rule 2). Never clear inside `cancel()` (the hide flush calls it, AD-9).
- **Drag:** a press on a non-tile, non-enabled-button target with no drag behaviour crossing 8 px and ending in `pointerup` acts on the tile selection as that target's tap would; R-39's destination-card drag-as-tap also dispatches (`tapDestinationCard`, unchanged; build-notes CAP-4). Tiles have no drag motion until ticket 7 (CAP-5): a live tray/strip tile press crossing 8 px dispatches nothing and clears at the threshold whatever end follows (F18); a block press or drag keeps (SPEC CAP-5).
- **Look:** the selected tile's lifted face and outline stay fully visible in every row (TileRows.svelte `.tiles` clips, rows top-aligned): lift the clip, not the rows; resting positions and screenshot baselines unchanged (none has a selected tile). `selected` also turns on Card's `↩` returnSlot (Composing free letters only, DESIGN.md Tile).
- **F2 carve-out:** the F25 non-pointer `click()` (controller.ts:719-727) maps a tile or block hit to `{ kind: 'outside' }` before `perform` (unreachable, F2), so `tapAction`'s Hit has neither `tile` nor `block`; pointerup sends them to `tileTap` only.
- **Interface:** overlays, new gestures/tile.ts, act.ts, controller press resolution; intent.ts drops its tile case.
- **Owns:** all of the above (F1, F13 clear rules).
- **Consumers:** changing the F25 outside-tap classification (intent.ts:131, controller.ts:719-727) and act(): list the tail-selection deselect paths, the scrim click swallower and every act()-wrapped button.
- **Tests:** R-32 (UI), R-33, R-73 (UI) P5; R-33/Q-31, R-34, R-35, R-51, R-71, R-72 P5 supp.; AD-4, AD-12, AD-13 S + P5 (below).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with:

- UI Vitest: AD-12 tileTap intent cases (a scrim/sheet hit keeping; an available Composing cell and a legal non-current Place cell clearing); tray/strip/block-mirror press resolution, a hit inside the pitch but outside the face, and a press in the selected tile's own half-gap resolving to it; a D-block mirror drag keeping; a ≥ 8 px move on the tray background ended by pointerup clearing and by pointercancel keeping; F18: with a tile selected, a ≥ 8 px press on any tile, ended by pointerup or pointercancel, clears and dispatches nothing; AD-12/AD-9 controller `cancel()` (before-hide path) keeping it; AD-4 act() clearing before its handler and a changed controller dispatch clearing; AD-13 resetForNewSession clearing it; no history entry pushed.
- Playwright on android (selection by the live tile's `selected` class; each edit: stored Session equals current().session before the next action (R-73)):
  - Composing select/swap/deselect on session-composing and session-place-free-letter-redo-tail + one Undo (remove there too); strip paths on session-place; the selected source tile (Composing) and a selected strip free-letter tile (Place, session-place-free-letter-redo-tail at load, free letter 28 from cell 3) show no `↩` before the second tap (R-35).
  - R-33/Q-31 on session-place-compact + one Undo (arrangement [35, 1, 38, 44, 11], compact QU free letter 35 from cell 4): swap 35 with 38 giving [38, 1, 35, 44, 11]; tap 35 (selected, `↩` bottom-right, DESIGN.md Tile), tap it again: removed; stored arrangement [38, 1, 44, 11], freeLetters [].
  - R-71: swap cards 38 and 37 (both R) at Composing (session-won + two Undos, Redo enabled first), then a non-word swap, select a tile, Validate: rejected line, still Composing, selection cleared (act(), F1); swap 38/37 again: line hidden; and at Place (session-won + one Undo). Each 38/37 swap: Redo disabled, no stored redo tail, 38 and 37 exchanged; stored move `reached` `composing` (no `targetCell`/`placementOrder`) at Composing, `place` at Place.
  - Three tile edits then one Undo on session-composing return to Idle.
  - Keep with a tile selected (selection kept, stored Session byte-identical): a D-block tile tap (R-32 (UI)); a used and an empty WordCell in Composing (session-place-free-letter-redo-tail + one Undo, cell 3 used); a not-legal WordCell in Place (session-place, plan's cell).
  - Clear with a tile selected: the current target cell (F13), the tray band background, the letter-count label, the top bar, an inert column card, a disabled − at k = 1; +, Validate and Undo; the menu inherits act()'s clear in epic 6.
  - Full pitch: a tap 1 px outside a named tile's face inside the gap (horizontally; in a compact tray, vertically below a row-1 tile) selects that tile; the selected tile's slot rect is unchanged by the lift; a selected row-1 tile's face box grown by the 2 px outline is not clipped and lies inside the tray band's rect.
  - Back with a tile selected leaves the app (bare-Board rule).
  - R-73 on session-place-free-letter-redo-tail + one Undo: tap-swap, select a tile, reload: same tray and tags, nothing selected.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-4
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns (Movable tile, Destination block)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Tile

## Notes

- Decided: act() needs no target; target-dependent keep/clear lives only in `tileTap`, whose six-way result and act()'s clear replace build-notes CAP-4's `none` and its one clear-rules function (close-out edit).
