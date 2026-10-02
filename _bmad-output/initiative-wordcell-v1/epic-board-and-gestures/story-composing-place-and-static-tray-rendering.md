---
id: 3
type: story
title: "Composing, Place and static tray rendering"
parent: epic-board-and-gestures
covers: [CAP-2]
after: [2]
risk: medium
---

# Composing, Place and static tray rendering

## Description

Renders every remaining GameView board state (F1):

- Composing: D cards live in destination style, S slots as ghost mirrors, and the static tray (F2) holding live S and free-letter tiles (data-place tray) in draft.arrangement order with the D-block mirrors at the draft.side end (D reversed when right, R-30), drawn in the DESIGN.md destination-block look (destination fill, one outline, one lock); the word-line slot shows only the epic 3 invalid-word line and the control row is empty.
- Place: live strip tiles (data-place strip) in placementOrder, S and D ghosts and the selected-target ring and check chip.
- Ghosts and destination style come from membership in view.draft.source / view.draft.destination (GameView), never from slicing column cards by counts (AD-3).
- Used WordCell faces as mirrors. Every mirror (ghost, D-block tray copy, used face) carries data-mirror-of=<CardId> and no data-place, data-card-id or data-testid (F23 resolves presses by data-place; CAP-8 ghost presses do nothing).
- The placeholder under S ghosts when the emptied source is the destination.
- Static tiles draw the plain card face, no origin, position or star tags (epic 5 owns tile metrics and tags, build-notes CAP-2).
- Tray sizing counts the word's tiles (arrangement plus D-block mirrors in Composing, placementOrder in Place): card height in one row while they fit (tiles per row per build-notes CAP-2), else compact 44 px in up to two rows clipped inside max(H, 92). The mode (one card-height row, or compact with row count) comes from a pure UI helper of tile count and available width, covered by an AD-n-named UI Vitest at 7, 8, 14 and 15 tiles on 412 and 360 px.
- New scripted valid fixture session-idle-empty-column.json (version 1, seed 1, activeMs 0, moves [session-won.moves[0]], cursor { index 1, phase idle }, gaveUp false), added in src/engine/serialize.test.ts to ValidName, VALID, PROPERTIES (§2 defining property: phase idle, cursor.index === moves.length, column 1 empty and cell 7 holding 7 cards in view) and REBUILDS (play(createSession(1), [drop(1, 7, 1), VALIDATE, CONFIRM], ['ldxomiw']), byte-equal to the fixture; FIXTURE_WORDS lacks the word), and to the valid session-fixture list test there; 'nine' titles and comments become 'ten'.
- Updates e2e/smoke.spec.ts 'AD-17 WordCell cards render bottom → top as live cell cards': on session-place-free-letter-redo-tail cell 3's top (28) is used by move 1, so assert 42 and 0 live (data-place cell), 28 as a data-mirror-of mirror in cell 3 and card-28 live with data-place strip; or move the bottom→top assertion to cell 7 of session-idle-empty-column ([24, 6, 49, 30, 25, 20, 48]).
- Creates e2e/board.screens.spec.ts for Idle (session-idle-fresh), Composing (session-composing), Place (session-place-free-letter-redo-tail) and Game over (session-gave-up) on android and desktop, baselines generated in the container, and drops the `--pass-with-no-tests` flag ticket 4.2 added to package.json `test:screens:run`.

Interface: New src/ui/Tray.svelte (static, epic 5 replaces it) and the ghost/mirror rendering in Column.svelte and WordCellRow.svelte; new fixtures/session-idle-empty-column.json; new e2e/board.screens.spec.ts and its baselines (entry 2 deleted the placeholder spec).

Tests: AD-14 exactly one live element per card in Idle, Composing, Place and Game over; R-33 (UI) used WordCell state on session-place-free-letter-redo-tail and after Undo into its Composing (P4 part); R-42 (UI) selected-target state on session-place (P4 part); R-73 (UI) exact phase re-rendered after reload (P4 part); R-22 empty column placeholder rendered on session-idle-empty-column; R-70/R-71 Redo into Composing with a free letter re-renders the used state (P4 supp.).

Owns: The static tray, the ghost and mirror rendering, session-idle-empty-column.json, and the board screenshot baselines.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows:

- AD-14: exactly 52 data-card-id elements, each id once, and exactly 52 `[data-place]` elements, each also carrying data-card-id, with data-place per AD-14, on session-idle-fresh, session-composing, session-place, session-place-free-letter-redo-tail, its Composing after one Undo (cell 3's top a mirror, card-28 live with data-place tray), session-won, session-gave-up and session-idle-empty-column after two Undos. Per state the test asserts the exact set of data-mirror-of ids and the live tray/strip order as literals computed from view() at planning (the plan lists them); e.g. session-composing: ghosts 42 and 0 in column 3, tray live [42, 0] then mirror 28 at the right end.
- R-42 (UI): on session-place, wordcell-3 (place.target) shows the selected-target ring and check chip.
- R-22: on session-idle-empty-column, column 1's placeholder is visible; after two Undos (move 0's Composing, whole 7-card self-drop of column 1, k = 0) column 1 shows its 7 ghost mirrors with the placeholder visible beneath and the tray holds the 7 live S tiles [24, 6, 49, 30, 25, 20, 48].
- R-33 (UI): wordcell-3 is used on session-place-free-letter-redo-tail and after one Undo into its Composing.
- R-73 (UI): a reload re-renders the same state: session-composing → ghosts, destination style, tray order (incl. the D mirror); session-place-free-letter-redo-tail → S and D ghosts (32, 9), used cell 3, strip order [9, 32, 28], target 3.
- R-70/R-71: from session-place-free-letter-redo-tail, Undo twice (Place → Composing → Idle) then Redo once lands in move 1's Composing with cell 3 used (mirror face of 28) and card-28 live in the tray ([32, 28], D mirror 9 at the right end).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-2 (Live vs mirror, static tray, Screenshots)

## Notes

- Resolved (F2): more than 14 tiles at 360 px are clipped by `overflow: hidden` inside the reserved max(H, 92) area, never over the labels or WordCells, every element kept in the DOM (AD-14).
- Count badge 1/2-card boundary (deferred by ticket 4.2) stays deferred: no state reachable by Undo/Redo from any valid fixture, the new one included, has a WordCell with 1 or 2 cards (every committed word puts 3+ cards on a cell and the fixtures' only free letter is taken from its own target cell), so covering it needs another scripted fixture.
