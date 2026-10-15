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

Adds the one key handler in src/ui/ mounted from src/main.ts (match on event.key, letter keys case-insensitive, Ctrl/Cmd+Shift+Z before Z) for the overlay and undo keys `M`, `N`, `?`, `Esc`, `Z`/`Y` and the Ctrl/Cmd aliases. This ticket builds the handler, the enablement gate and these keys; the board keys (1-8, arrows, 3-9/0, +/-, F, Space/Enter tile activation), focus order, focus-follows-phase and tooltips stay with entry 11 and plug into the same gate.

- Gate: keys that mirror a button (Undo, Redo, Validate, Confirm, +, -, Flip, M) act only when that control is enabled, other keys gate by the table's phase column from GameView, so Y, Ctrl/Cmd+Y and Ctrl/Cmd+Shift+Z act only when Redo is enabled (no-op in Game over). Only the Z/Y aliases take Ctrl/Cmd; any other Ctrl/Cmd/Alt chord is ignored and not default-prevented. Single-shot keys (M, N, ?, Esc, Validate, Confirm, Flip) ignore repeats (build-notes Key handler details); held Z/Y repeat and act. Tab, Enter and Space stay native on a focused button or input under an open surface.
- Pending pop: acting keys that touch history (Undo, Redo, M, N, ?) wait for the pending pop, then act; every other key, Esc included, is dropped without side effects.
- Suspension and no-op: a key that does not act (disabled control, suspended by an open surface, ignored repeat, rejected root, Halted) does nothing at all: no act(), no view or peek close, no selection change (CAP-10: precondition steps run only when the shortcut acts). With any menu, panel or dialog open only Tab, Enter, Space and Esc act (M, N, ? and Z are no-ops there); with the end sheet or a WordCell view open M, N, ?, Z and Y are not suspended but still follow the gate; with no active Session (the rejected root) only N, which acts at once, and Esc are live, and in Halted no key acts (SPEC CAP-10).
- When a key acts: it cancels a drag (act()) and closes a sticky view first; overlay-opening keys (M, N, ?) go through openSurface (SPEC F8), which closes any long-press or hover peek (open() throws while a peek is open) and waits for a pending pop; Undo and Redo clear a tail selection and pop its entry (any pop completing before a following push); peeks also close for keys that change phase or word data (F39: Undo, Redo, menu and keys no longer make overlays.deselect() throw).
- Selections: phase-changing keys (Undo and Redo with their aliases, Confirm, Validate, and N when it acts at once: rejected root, or a finished game with nothing to lose, CAP-3) call overlays.clearTile in the handler before dispatch. Overlay-opening keys (M, ?, and N when it opens a confirm) clear a tail selection only; 1-8 and up/down keep the selection per the table. tileTap's stale-selection throw stays, tested separately.
- Esc order, read from the overlay stack: the topmost entry first (confirm or History notice, menu or panel, sticky WordCell view, expanded end sheet collapses, tail selection pops its entry), else it clears a tile selection, else nothing; a collapsed end sheet is not an overlay. I-68's Escape case: Esc on a confirm opened from the menu closes only the confirm and leaves the Board (menu not reopened, CAP-1/CAP-3), and Esc on the History notice over the end sheet leaves the sheet expanded.
- Replaced handlers: the one handler replaces the interim per-component Esc handlers (Menu.svelte window Esc, ConfirmDialogs.svelte, PreferencesPanel.svelte, HowToPlayPanel.svelte, StatisticsPanel.svelte) so Esc has a single path; the interim `main` tabindex stays until entry 11 owns the board focus target; the existing tests of those surfaces keep passing through the key handler.

## Acceptance Criteria

Verify: npm run test:all is green and npm run test:screens just stays green (the ticket adds no screens specs); rule-coverage rows owned: Q-24/A-E7 overlay and undo rows (P6 desktop), F39 (P6 + U), stale selection (U), Esc fallback (P6 desktop), I-68; Playwright on desktop shows each key opening or closing its surface, Undo and Redo and the menu closing an open sticky WordCell view first without a page error, M during a long-press peek, a disabled Undo with a sticky view open leaving the view open, Y with and without a redo tail, a tile selection surviving or clearing correctly when a key changes the phase, game keys doing nothing under an open panel while Tab/Enter/Space still work, the Esc fallback order and both Escape cases; UI Vitest AD-12 covers key-event filtering (repeat, other chords not default-prevented, Shift+Z alias) and pop ordering (a two-press Esc), and on the key table covers every row of build-notes' per-surface table (menu, panels, dialogs, History notice, end sheet, WordCell view) plus the rejected root and Halted, and on the clearTile call sites (phase-changing keys, both N cases) and tileTap's stale-selection throw (directly seeded selection) separately.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
