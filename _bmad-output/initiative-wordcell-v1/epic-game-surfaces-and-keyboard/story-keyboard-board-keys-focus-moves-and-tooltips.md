---
id: 11
type: story
title: "Keyboard: board keys, focus moves and tooltips"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-10]
after: [10]
risk: high
---

# Keyboard: board keys, focus moves and tooltips

## Description

Adds the board keys of the EXPERIENCE.md Keyboard table (`1`–`8`, `↑`/`↓`, `3`–`9`/`0`, `←`/`→`, `Shift`+arrows, `Space`, `Enter`, `+`/`=`/`-`, `F`), Space/Enter tile activation (select, swap, return; epic 5 plan deferral), focus order top bar → columns → tray → WordCells → action bar, focus following the phase, the visible focus ring in accent-teal, and the key in each desktop button's tooltip. That table is the per-phase authority (Idle, Composing, Place, Game over cell of every key); this ticket lists only deltas.

Interface: keys.ts gains the board rows; Board, Column, Tray and WordCellRow gain roving focus; Card focus handling. Owns: the board key table and focus moves. Risk: high.

**Keys.** New rows join the `ROWS` table and `onKeyDown` of keys.ts (6.10), reusing its gate, `act()`, `clearTile`, sticky-view and peek closing, SUSPENDING and Game over gates unchanged; no aria-label or name changes (entry 13).
- Source of the gate: a `GameView` flag for keys that mirror a button (`canIncK`/`canDecK`, `canFlip`, `canValidate`, `canConfirm`; Validate also needs the dictionary ready, as 6.10); the phase column otherwise. `Space`, `Enter` and `F` ignore `event.repeat`.
- No-ops dispatch nothing, no `preventDefault`, no `act()`: Shift+arrow at either end; `3`–`9`/`0` on a used or empty cell; `1`–`8` on an empty column; `+`/`-`/`F` with an empty destination column (R-31); `↑`/`↓` at their limits; a drop on the same number (the source column). One test per table row per phase.
- Tail selection (`1`–`8`, `↑`/`↓`) reuses the tap and drop paths with the tail-selection history push and pop, the same-column behaviour and R-14 gating by `GameView` flag. Per-row `changesPhase`: `1`–`8` and `↑`/`↓` keep the selection, cancel a drag and do not close peeks; every phase-changing row closes them.
- Pending pop: `1`–`8` and `↑`/`↓` touch history (tail selection push and pop), so they wait with `WAITS`; every other board key is dropped.
- Shift is ignored for `+`/`=`; a Shift chord with no table row is a no-op; Ctrl/Cmd/Alt chords stay rejected for board keys.

**Activation.** `Space`/`Enter` on a tile, column card or WordCell call the existing tap handlers through `act()`; no rule logic is duplicated. WordCell: `Enter` is the tap, `Space` opens the sticky view (a tail selection is cleared and its entry popped first). `Enter` on a focused button stays native; the global `Enter` (Validate/Confirm, gated by `canValidate`, dictionary ready, `canConfirm`) acts only when focus is on a tile or the board, and `preventDefault` only when a key acts. `F` and `Enter` attach to the validate, confirm and flip rows from 6.10.

**Focus.**
- Roving model: one Tab stop per region (each column, tray, strip, WordCell row), `tabindex` 0 on the current item and -1 on the rest; `Tab`/`Shift+Tab` move between regions in DOM order top bar → columns → tray → WordCells → action bar; `←`/`→` move within the tray or strip, no wrap. Only live card elements are focusable, never a mirror (AGENTS.md Known pitfalls); a drag start does not steal focus.
- "The board" is the bottom card of the lowest-numbered non-empty column, else the Board container. The container is added by this ticket (resolves the stub's unknown): `tabindex` -1, a programmatic target that takes focus only when no column card exists; `main` carries `tabindex` -1 until now (Menu.svelte).
- Focus follows the entered phase whatever the cause (key, button, pointer, Undo, Redo, restore, first paint) through one UI effect on `GameView.phase`, applied after the DOM update, on the live element. Targets: Composing → first movable tile (destination-block tiles skipped); Place → first strip card; non-winning commit and return to Idle → the board; winning commit → the end sheet's first action once the animation settles. It yields to the 6.10 overlay focus return (menu, panels, dialogs, sticky view keep their own).
- Key edits: after Shift+arrow the moved tile; after a key add the new tile; after a key removal the next tile, the previous if it was last, the board when none is left or none is movable; after a key tail selection the tail's top card. Boundary tests: one tile, last tile, only destination-block tiles.
- Ring: DESIGN.md Focus ring (2 px accent-teal at 2 px offset with the table gap, `:focus-visible` only, distinct from the selection outline, both drawn when both apply, enclosing the visible strip on a fanned card).

**Tooltips.** `title` carries the label and key (`Undo (Z)`) on Undo, Redo, Validate, Confirm, `−`, `+`, Flip, Menu and New game; Give up has no key and none. Strings and format in `text.ts`, the key label read from `keys.ts` per command; shown only on `(hover: hover)` pointers; the accessible name is unchanged (CAP-11).

Tests: Q-24 and A-E7 board keys (P6 desktop); R-14 key selection and drop (P6 desktop); R-33 key add and remove (P6 desktop part); R-31 no-ops; focus follows the phase (P6 desktop); AD-n UI Vitest for the key rows and the tooltip builder.

Consumers (locators on `data-card-id` / `card-<id>` that Card focus handling and roving tabindex must not break): src/ui/gestures/controller.test.ts and lookup.test.ts; e2e helpers e2e/helpers/board.ts, gestures.ts and restore.ts; e2e specs board, board-phases, column-phases, tap, tile-tap, tile-drag, drag, drag-interruptions, free-letter, place, tray, tray-growth, flip, flip-controller, fly-to-cell, pending-draft, confirm, end-sheet, wordcell-view, keys, menu, nav, history, history-notice, how-to-play, preferences, prefs, statistics, dictionary, blocking, app-shell, layout, smoke and success-signal (`.spec.ts`), plus board.screens and preferences.screens. Mirrors never take focus.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on desktop playing EXPERIENCE.md Flow 6 by keyboard alone (only `keyboard.press` after seeding), each table row for its phase (including no-ops that dispatch nothing), a Tab-order test, focus after every phase change and after each key edit, the all-columns-empty case (win or seeded) focusing the Board container, and tooltips showing the key (`title` asserted).

- Sentence to test: Q-24/A-E7 rows, R-14, R-33, R-31 no-ops and focus-follows-phase → Playwright desktop (names start with the id); key-table rows and the tooltip builder → UI Vitest (AD-n).
- Screens (run in Docker, AGENTS.md): focused, and focused plus selected; no existing baseline is expected to change (the ring is `:focus-visible` only).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Resolved: the ticket adds the Board container (EXPERIENCE.md Keyboard: "a focusable board container when every column is empty").
