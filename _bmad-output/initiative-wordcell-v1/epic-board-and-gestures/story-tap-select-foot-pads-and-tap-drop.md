---
id: 7
type: story
title: "Tap-select, foot pads and tap-drop"
parent: epic-board-and-gestures
covers: [CAP-6]
after: [6]
risk: medium
---

# Tap-select, foot pads and tap-drop

## Description

Adds the tap half of R-14 and Q-18 to the controller: a tap on a column card with column.canPickUp selects it and every card below (faces lifted 8 px, teal outline, source foot Here, other feet the wash) through overlays.select; a tap on any card, empty space, placeholder or foot of another column, or on Here or the source column's empty space, deselects then dispatches drop with sourceCount = the selected tail when canDropOn; re-select inside the source column grows or shrinks the tail with no new entry; a tap on the selected top is a no-op; a WordCell tap or an empty-WordCell long-press deselects with no view; the F25 outside-tap deselect on the controller's tap classification (top bar, tray band, labels, gaps, action bar, leftover band, banner background, desktop side margins, disabled controls), never on pointerdown; Undo, Redo and the banner Reload deselect then act; desktop hover outlines (grab cursor, drop-target highlight, re-select outline) as CSS classes; the foot row touch-action none while a tail is selected (pan-y otherwise, entry 4); and the blocking.spec.ts case where New game from a session-invalid-* fixture then a tap selects with history.state.wc 1.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines regenerated in the container only where the four fixture renders change), and Playwright on android shows a tap-select dispatching nothing with the Session reference and storage unchanged, tap-drops on another column's card, placeholder, empty space and foot and on Here giving drop with the selected sourceCount (self-drop k = 1, whole column k = 0), re-select keeping history.state.wc, back clearing the selection with the app open at wc 0, reload showing nothing selected, select-reload-back leaving the app, the F26 360 × 750 slot-margin and lifted-tail taps, desktop hover outlines, and the foot row's computed touch-action none with a tail selected and pan-y without.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-6

## Notes

- Open question: Whether Chromium fires pointer events on a disabled <button> (unverified); if not, the ticket wraps disabled controls' hit area [ASSUMPTION, build-notes CAP-6].
