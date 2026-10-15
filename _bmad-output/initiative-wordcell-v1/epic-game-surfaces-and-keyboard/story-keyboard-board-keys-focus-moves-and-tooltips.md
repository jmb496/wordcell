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

Adds the board keys of the EXPERIENCE.md Keyboard table (`1`–`8`, `↑`/`↓`, `3`–`9`/`0`, `←`/`→`, `Shift`+arrows, `Space`, `Enter`, `+`/`=`/`-`, `F`), Space/Enter tile activation (select, swap, return; epic 5 plan deferral), focus order top bar → columns → tray → WordCells → action bar, focus following the phase, the visible focus ring in accent-teal, and the key in each desktop button's tooltip. That table is the per-phase authority (every key, every phase); this ticket lists only deltas.

Interface: keys.ts gains the board rows; Board, Column, Tray and WordCellRow gain roving focus; Card focus handling; focus-board.ts (6.10) is updated. Owns: the board key table and focus moves. Risk: high.

**Keys.** New rows join the `ROWS` table and `onKeyDown` of keys.ts (6.10), reusing its gate, `act()`, `clearTile`, sticky-view and peek closing, SUSPENDING and Game over gates unchanged; no aria-label or name changes (entry 13).
- Source of the gate: a `GameView` flag for keys that mirror a button (`canIncK`/`canDecK`, `canFlip`, `canValidate`, `canConfirm`; Validate also needs the dictionary ready, as 6.10); per column `canPickUp`/`canDropOn`, per cell `canAddFreeLetter`/`canSetTarget`; the phase column otherwise. Every board row is `single` (ignores `event.repeat`), Shift+arrow included; only Undo and Redo repeat.
- No-ops dispatch nothing, no `preventDefault`, no `act()`: Shift+arrow at either end; `3`–`9`/`0` on a used or empty cell, and in Place on an illegal cell or the current target (Flow 6 step 4: `6` keeps the target); `1`–`8` on an empty column; `+`/`-`/`F` with an empty destination column (R-31); `↑`/`↓` at their limits; `Space`/`Enter` on an empty WordCell (`Space` with a tail selected deselects, no view, EXPERIENCE.md Keyboard). One test per table row per phase.
- Tail selection (`1`–`8`, `↑`/`↓`) reuses the tap and drop paths with the tail-selection history push and pop and R-14 gating by `GameView` flag. A source-column number is a drop on the source column (as the `Here` pad, `tapAction` in intent.ts), not a no-op; test selection and history entry after it. Per-row `changesPhase` (a new `Row` field): `1`–`8` and `↑`/`↓` keep the selection, cancel a drag and do not close peeks; every phase-changing row closes them through the commands.ts / open-surface.ts helper.
- Pending pop: `1`–`8`, `↑`/`↓` and `Space`/`Enter` on a column card or WordCell touch history (tail selection push and pop; `Space` on a WordCell pushes the sticky view), so they wait with `WAITS` (and `CommandId`, extended for them); every key that never touches history is dropped. Test: a WordCell key pressed during a pending pop.
- Shape (technical defaults): parametric and focus-dependent keys get a key context (digit, focused element or region) passed to gate and run, or a second table sharing `attempt()` and `WAITS`. Each row has a key `label`; `CommandId` gains the k+/k- ids.
- Shift is ignored for `+`/`=`; a Shift chord with no table row is a no-op; Ctrl/Cmd/Alt chords stay rejected for board keys.

**Activation.** `Space` on a focused tile or strip card is the tap (select, swap, return). `Space` or `Enter` on a column card is the tap on it (Game over: inert); on a WordCell `Enter` is the tap and `Space` opens the sticky view (a tail selection is cleared and its entry popped first; Game over: both open the view). `Enter` on a tile, strip card or the board is never a tap: it is Validate (Composing; `canValidate`, dictionary ready) or Confirm (Place; `canConfirm`). `Enter` and `Space` on a focused native button stay native; `preventDefault` only when a key acts. `F` and `Enter` attach to the 6.10 flip, validate and confirm rows. `act()` runs `cancel()` then `clearTile()`, which would destroy the selection that select, swap and return need, so tile, strip-card and column-card activation call the controller's tap path directly (`tileTap` in tile.ts, then `tapAction` in intent.ts, as a released pointer tap does in controller.ts; its `click` handler skips tiles, so the controller gains a key-activation entry), not `act()`. Only rows that change phase or open surfaces use `act()` (WordCell `Space`, Validate, Confirm, key adds). Tests: `Enter` on a tile and on a strip card validates or confirms; `Space` on a tile and a strip card taps.

**Focus.**
- Roving model: one Tab stop per region, `tabindex` 0 on the current item, -1 on the rest. Current item: column = last-focused card, default its bottom card (a key tail selection sets it to the tail's top card); tray and strip = last-focused item; WordCells 3–10 = each cell its own Tab stop (default). `Tab`/`Shift+Tab` move between regions in DOM order top bar → columns → tray → WordCells → action bar; `←`/`→` move within the tray or strip, skipping destination-block tiles, no wrap. Only live card elements are focusable, never a mirror (AGENTS.md Known pitfalls); a drag start does not steal focus. Test: reach cell 10 and open its view with `Space`.
- "The board" is the bottom card of the lowest-numbered non-empty column, else the Board container. `main` already has `tabindex` -1 (App.svelte) and `focusBoard` (focus-board.ts, 6.10) is the single resolver: `main` stays the container, and this ticket makes `focusBoard` the target of the phase effect, updating it and its test.
- Focus follows the entered phase whatever the cause (key, button, pointer, Undo, Redo, restore) through one UI effect on `GameView.phase`, applied after the DOM update, on the live element. Targets: Composing → first movable tile (destination-block tiles skipped); Place → first strip card; non-winning commit and return to Idle → the board; winning commit → the end sheet's first action, moved by the sheet (entry 6) and asserted here. The trigger is the sheet opening (the CAP-5 deferred open, entry 12; Undo can cancel it), never a timer. A restore into Game over focuses at once; the first Idle paint moves no focus. It yields to the 6.10 overlay focus return (menu, panels, dialogs, sticky view keep their own).
- Key edits: after Shift+arrow the moved tile; after a key add the new tile; after a key removal the next tile, the previous if it was last, the board when none is left or none is movable; after a key tail selection the tail's top card. Boundary tests: one tile, last tile, only destination-block tiles.
- Focus loss: if the focused element leaves the DOM without a phase change (Undo/Redo inside Composing or Place, pointer edit, `+`/`-`, Flip), focus falls to the next sibling in its region, else the region's first item, else the board. Test Undo and Redo inside Composing and Place.
- Ring: DESIGN.md Focus ring (2 px accent-teal at 2 px offset with the table gap, `:focus-visible` only, distinct from the selection outline, both drawn when both apply, enclosing the visible strip on a fanned card).

**Tooltips.** `title` carries the label and key (`Undo (Z)`) on Undo, Redo, Validate, Confirm, `−`, `+`, Flip, Menu and New game; Give up has no key and none. How to play (`?`) in the menu carries its key too. A pure builder in `text.ts` (strings, format) reads the key label from `keys.ts` per command and is unit-tested per command; `title` is set from `layout.hoverFine`, so it is undefined on touch; the accessible name is unchanged (CAP-11). Test: `title` absent on `android`, present on `desktop`.

Tests: Q-24 and A-E7 board keys (P6 desktop); Space/Enter tile activation (P6 desktop); R-14 key selection and drop (P6 desktop); R-33 key add and remove (P6 desktop part); R-31 no-ops; focus follows the phase (P6 desktop); AD-n UI Vitest for the key rows and the tooltip builder.

Consumers (locators on `data-card-id` / `card-<id>` that roving tabindex must not break): src/ui/gestures/controller.test.ts and lookup.test.ts; e2e helpers e2e/helpers/board.ts, gestures.ts and restore.ts; e2e specs board, board-phases, column-phases, tap, tile-tap, tile-drag, drag, drag-interruptions, free-letter, place, tray, tray-growth, flip, flip-controller, fly-to-cell, pending-draft, confirm, end-sheet, wordcell-view, keys, menu, nav, history, history-notice, how-to-play, preferences, prefs, statistics, dictionary, blocking, app-shell, layout, smoke and success-signal (`.spec.ts`), plus board.screens and preferences.screens.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on desktop playing EXPERIENCE.md Flow 6 by keyboard alone (only `keyboard.press` after seeding), each table row for its phase (including no-ops that dispatch nothing), a Tab-order test, focus after every phase change and after each key edit, the all-columns-empty case (seeded `session-won` via `seedStorage`, sheet collapsed with `Esc`) focusing the Board container, and tooltips showing the key (`title` asserted).

- Sentence to test: Q-24/A-E7 rows, R-14, R-33, R-31 no-ops and focus-follows-phase → Playwright desktop (names start with the id); key-table rows and the tooltip builder → UI Vitest (AD-n).
- Screens (run in Docker, AGENTS.md): focused, and focused plus selected; no existing baseline is expected to change (the ring is `:focus-visible` only).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Resolved: the Board container is `main` (EXPERIENCE.md Keyboard: "a focusable board container when every column is empty").
