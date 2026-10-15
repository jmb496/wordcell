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

Adds the board keys of the EXPERIENCE.md Keyboard table (`1`–`8`, `↑`/`↓`, `3`–`9`/`0`, `←`/`→`, `Shift`+arrows, `Space`, `Enter`, `+`/`=`/`-`, `F`), Space/Enter tile activation (epic 5 plan deferral), focus order top bar → columns → tray → WordCells → action bar, focus following the phase, the visible focus ring in accent-teal, and the key in each desktop tooltip. That table is the per-phase authority; this ticket lists only deltas.

Interface: keys.ts board rows (`↑`/`↓` re-select by tap on the card above/below the tail top); tooltips in ControlRow.svelte, ActionBar.svelte (title follows the primary action) and Menu.svelte; roving focus in Board, Column, Tray, WordCellRow and Card; focus-board.ts (6.10) updated. Owns: board key table and focus moves. Risk: high.

**Keys.** New rows join the `ROWS` table and `onKeyDown` of keys.ts (6.10), reusing its gate, `act()`, `clearTile`, view and peek closing and the SUSPENDING gate; no Game over gate (board keys no-op there via `GameView` gates, except `Space`/`Enter` on a non-empty WordCell); no name changes (entry 13).
- Gate source: a `GameView` flag for keys that mirror a button (`canIncK`/`canDecK`, `canFlip`, `canValidate`, `canConfirm`; Validate also needs the dictionary ready); per column `canPickUp`/`canDropOn`, per cell `canAddFreeLetter`/`canSetTarget`, else the phase column. Every board row is `single` (ignores `event.repeat`); only Undo and Redo repeat.
- No-ops dispatch nothing, no `preventDefault`, no `act()`: Shift+arrow at either end; `3`–`9`/`0` on a used or empty cell, and in Place on an illegal cell or the current target (Flow 6: `6` keeps the target); `1`–`8` with no selection on an empty column (a tail selected drops there; test it); any false per-column or per-cell gate; `+`/`-`/`F` with an empty destination column (R-31); `↑`/`↓` at their limits; `Space`/`Enter` on an empty WordCell with nothing selected, except Place `Enter` on a `canSetTarget` cell; `←`/`→`/Shift+arrow with focus outside the tray/strip; `↑`/`↓` with no tail selected or outside Idle. One test per table row per phase, both keys.
- Tail selection (`1`–`8`, `↑`/`↓`) reuses the tap and drop paths with the history push and pop, gated per R-14 by `GameView` flag. With a tail selected, `Space`/`Enter` on an empty WordCell deselect (no view). A source-column number is a drop on the source column (as the `Here` pad), not a no-op; test selection and history entry after it. Per-row `changesPhase` (a new `Row` field): `1`–`8` and `↑`/`↓` keep the selection and cancel a drag; every phase-changing row closes peeks through the commands.ts / open-surface.ts helper.
- Pending pop: `1`–`8`, `↑`/`↓`, Idle `Space`/`Enter` on a column card, and `Space`/`Enter` on a non-empty WordCell that opens the view (Idle, Game over), touch history, so they wait with `WAITS` (and `CommandId`); `Enter` on a WordCell in Composing or Place, tile activation and other no-history keys are dropped. Test: a WordCell key during a pending pop, Idle and Game over.
- Shape: parametric and focus-dependent keys get a key context (digit, focused element or region) passed to gate and run, or a second table sharing `attempt()`/`WAITS`. Rows have a key `label`; `CommandId` gains k+/k-.
- Shift is ignored for `+`/`=`; a Shift chord with no row is a no-op; Ctrl/Cmd/Alt chords stay rejected.

**Activation.** `Space` on a focused tile is the tap (select, swap, return), on a strip card select or swap. `Space` or `Enter` on a column card is the tap on it (Game over: inert); on a WordCell `Enter` is the tap and `Space` opens the sticky view (a tail selection is cleared and its entry popped first; Game over: both open the view). `Enter` on a column card is the tap in every phase; only on a tile, a strip card or the Board container is it Validate (Composing; `canValidate`) or Confirm (Place; `canConfirm`), never a tap. Native buttons keep `Enter`/`Space`; `preventDefault` only when a key acts. `F` and `Enter` attach to the 6.10 flip, validate and confirm rows. `act()`'s `clearTile()` would destroy the selection that select, swap and return need, so tile, strip-card and column-card activation, `1`–`8` and `↑`/`↓` use a new controller key-activation entry: it calls `cancel()`, never `clearTile()`, then the tap path (`tileTap`, `tapAction`, as a released pointer tap), first closing an open sticky view on every activation (EXPERIENCE.md Keyboard, CAP-10); it closes peeks only when the tap changes the phase or word data (tile swap or return, strip swap, a `1`–`8` drop that starts Composing, or sets k); a column-tail select, re-select or deselect leaves peeks open (controller.ts closes only on non-`up` ends). Rows that change phase or open a surface use `act()`. Tests: `Enter` on a tile and a strip card validates or confirms; `Space` on both taps; `Enter` on a column card taps it in Composing and Place, `canValidate` true and false; `Space` on a card during a held pointer drag cancels it, then taps; `1`–`8` select keeps a peek, a drop starting Composing closes it; `1` with a sticky view open closes it, then selects.

**Focus.**
- Roving model: each non-empty column, the tray, the strip and each WordCell 3–10 is one Tab stop; `tabindex` 0 on a region's current item, -1 on the rest. Current item: column = last-focused card (a key tail selection sets the tail's top card); tray and strip = last-focused item; if absent or not live, the fallback is the region's first live item (a column's bottom card). `Tab`/`Shift+Tab` move between regions in DOM order; `←`/`→` move within the tray or strip, skipping destination-block tiles, no wrap. Only the live element per card is focusable, never a mirror; a drag start steals no focus. Tab-order test asserts it, reaching cell 10 and opening its view.
- "The board" is the bottom card of the lowest-numbered non-empty column, else the Board container. `main` already has `tabindex` -1 (App.svelte); `focusBoard` (focus-board.ts, 6.10) is the single resolver and the phase effect's target; update it and its test.
- Focus follows the entered phase whatever the cause through one UI effect on `GameView.phase`, applied after the DOM update, on the live element. Targets: Composing → first movable tile (destination-block tiles skipped); Place → first strip card; non-winning commit and return to Idle → the board; winning commit → the end sheet's first action, moved by the sheet (entry 6) and asserted here. The trigger is the sheet opening (CAP-5, entry 12), never a timer. A restore into Game over focuses at once; the first Idle paint moves no focus. It yields to the 6.10 overlay focus return.
- Key edits: after Shift+arrow the moved tile; after a key add the new tile; after a key removal the next tile, the previous if it was last, the board when none is left or none is movable; after a key tail selection the tail's top card. Boundary tests: one tile, last tile, only blocks.
- Focus loss: if the focused element leaves the DOM without a phase change (Undo/Redo inside Composing or Place, pointer edit, `+`/`-`, Flip), focus falls to the next sibling in its region, else the region's first item, else the board. Test Undo and Redo inside Composing and Place.
- Ring: DESIGN.md Focus ring (2 px accent-teal, 2 px offset, `:focus-visible` only, distinct from the selection outline, both drawn when both apply, enclosing the visible strip on a fanned card).

**Tooltips.** `title` carries the label and key (`Undo (Z)`) on Undo, Redo, Validate, Confirm, `−`, `+`, Flip, Menu and New game; Give up has no key and none. How to play (`?`) in the menu carries its key too. A pure `text.ts` builder reads the key label from `keys.ts` per command, unit-tested per command; `title` is set from `layout.hoverFine` and replaces the static `title={text.undo}`/`text.redo` in TopBar.svelte, so it is undefined on touch; the accessible name is unchanged (CAP-11). Test: `title` absent on `android`, present on `desktop`.

Consumers (locators roving tabindex must not break): src/ui/gestures/controller.test.ts and lookup.test.ts; e2e/helpers/board.ts, gestures.ts and restore.ts; every `e2e/**` file matching `card-` or `data-card-id`, plus board.screens and preferences.screens.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on desktop playing EXPERIENCE.md Flow 6 by keyboard alone (only `keyboard.press` after seeding), each table row per phase (no-ops dispatch nothing), a Tab-order test, focus after every phase change and key edit, the all-columns-empty case (seeded `session-won` via `seedStorage`, sheet collapsed with `Esc`) focusing the Board container, and tooltips showing the key (`title` asserted).

- Sentence to test: Q-24/A-E7, R-14, R-33, R-31 and focus-follows-phase → Playwright desktop (names start with the id); key rows and the tooltip builder → UI Vitest (AD-n).
- Screens (Docker): focused, and focused plus selected; no existing baseline changes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Resolved (technical choice): the Board container is `main`; EXPERIENCE.md says only a focusable board container.
- Owner decision (2026-10-15): one Tab stop per non-empty column (its bottom or last-focused card; the tail's top card after a key selection), not every card of a fanned column; play stays fully possible with 1-8 and up/down.
- Owner decision (2026-10-15): the focus ring on column cards sits inside the card (offset -2px), not outside as DESIGN.md says; DESIGN.md should state this at the retro. Neighbouring overlapping cards never clip it.
