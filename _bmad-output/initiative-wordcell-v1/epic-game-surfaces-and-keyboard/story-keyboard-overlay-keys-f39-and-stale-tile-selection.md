---
id: 10
type: story
title: "Keyboard: overlay keys, F39 and stale tile selection"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-10]
after: [3, 4, 5, 6, 9]
risk: high
---

# Keyboard: overlay keys, F39 and stale tile selection

## Description

Adds the one key handler in src/ui/ mounted from src/main.ts (match on event.key, letter keys case-insensitive, Ctrl/Cmd+Shift+Z before Z) for the overlay and undo keys `M`, `N`, `?`, `Esc`, `Z`/`Y` and the Ctrl/Cmd aliases; keys that mirror a button (Undo, Redo, Validate, Confirm, +, -, Flip, M) act only when that control is enabled, other keys gate by the table's phase column from GameView; every key command cancels a drag (act()) and closes a sticky view first, overlay-opening keys, Undo and Redo clear a tail selection and pop its entry (any pop completing before a following push), peeks close only for keys that change phase or word data (F39: Undo, Redo, menu and keys no longer make overlays.deselect() throw); every key command that changes the phase clears the tile selection at the source (overlays.clearTile) while tileTap's stale-selection throw stays, tested separately; with any menu, panel or dialog open only Tab, Enter, Space and Esc act (M, N, ? and Z are no-ops), with the end sheet or a WordCell view open M, N, ?, Z, Y stay active; Esc closes the topmost overlay, else clears the selection, in Game over collapses the sheet; I-68's Escape case: Esc closes the topmost surface and never reopens or inverts.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with Playwright on desktop showing each key opening or closing its surface, Undo and Redo and the menu closing an open sticky WordCell view first without a page error, a tile selection surviving or clearing correctly when a key changes the phase, game keys doing nothing under an open panel while Tab/Enter/Space still work, the Esc fallback and the Escape case, and UI Vitest AD-12 on the key table and on the clearTile / tileTap throw separately.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
