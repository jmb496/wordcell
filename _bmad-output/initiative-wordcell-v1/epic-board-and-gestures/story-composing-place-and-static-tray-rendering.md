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

- Composing: D cards live in destination style, S slots as ghost mirrors, and the static tray (F2) holding live S and free-letter tiles (data-place tray) in draft.arrangement order with the D-block mirrors at the draft.side end (D reversed when right, R-30), drawn per DESIGN.md Destination block; the word-line slot shows only the epic 3 invalid-word line (4.2 hand-over: an existing rejected-word flow asserts it inside the word-line slot) and the control row is empty.
- Place: live strip tiles (data-place strip) in placementOrder, S and D ghosts and the selected-target ring and check chip.
- Ghosts and destination style come from membership in view.draft.source / view.draft.destination never from slicing column cards by counts (AD-3).
- Used WordCell faces as mirrors. Every mirror (ghost, D-block tray copy, used face) carries data-mirror-of=<CardId> and no data-place, data-card-id or data-testid (F23 resolves presses by data-place; CAP-8 ghost presses do nothing).
- The placeholder under the S ghosts in Composing when the emptied source is the destination.
- Static tiles draw the plain card face (compact ones per DESIGN.md compact tiles), no origin, position or star tags (epic 5 owns tile metrics and tags, build-notes CAP-2), with the card wrapper's touch-action: none and user-select: none (rule-coverage AD-11 row, rule 4).
- Tray sizing counts the word's tiles (arrangement plus D-block mirrors in Composing, placementOrder in Place). A pure UI helper of tile count, card width w and tray inner width (tile width max(w, 44), tiles per row per build-notes CAP-2) returns card mode or compact with an uncapped row count (epic 5 reuses it); Tray.svelte clips beyond two rows inside max(H, 92). An AD-n-named UI Vitest asserts, at 412 px (w 46, inner 384) and 360 px (w 40, inner 336; desktop w 40 alike): 7 → card; 8 and 14 → compact 2; 15 → compact 3.
- New scripted valid fixture session-idle-empty-column.json (version 1, seed 1, activeMs 0, moves [session-won.moves[0]], cursor { index 1, phase idle }, gaveUp false), added in src/engine/serialize.test.ts to ValidName, VALID, PROPERTIES (§2 defining property: phase idle, cursor.index === moves.length, column 1 empty and cell 7 holding 7 cards in view) and REBUILDS (play(createSession(1), [drop(1, 7, 1), VALIDATE, CONFIRM], ['ldxomiw']), byte-equal to the fixture; FIXTURE_WORDS lacks the word); and to the name list of 'AD-17 the valid fixtures/session-*.json files are exactly the nine rebuilt ones' in src/architecture.test.ts, whose title and the serialize.test.ts VALID comment become 'ten'.
- Moves e2e/smoke.spec.ts 'AD-17 WordCell cards render bottom → top as live cell cards' to cell 7 of session-idle-empty-column ([24, 6, 49, 30, 25, 20, 48], Idle, zero mirrors); the redo tail's used cell 3 is left to R-33.
- Creates e2e/board.screens.spec.ts for Idle (session-idle-fresh), Composing (session-composing), Place (session-place-free-letter-redo-tail) and Game over (session-gave-up) on android and desktop, baselines generated in the container, and drops the `--pass-with-no-tests` flag ticket 4.2 added to package.json `test:screens:run`. Each capture waits for `__wordcell.dictionaryState()` 'ready', the primary action's ready label, no banner and the card font loaded (as the deleted placeholder spec); viewport capture.

Interface: New src/ui/Tray.svelte (static, epic 5 replaces it), Card.svelte mirror, ghost and destination variants (mirrors set no data-place), and the ghost/mirror rendering in Column.svelte and WordCellRow.svelte; new fixtures/session-idle-empty-column.json; new e2e/board.screens.spec.ts and its baselines.

Tests: AD-14 exactly one live element per card in Idle, Composing, Place and Game over, and the R-30 D reversal rendered; R-33 (UI) used WordCell state on session-place-free-letter-redo-tail and after Undo into its Composing (P4 part); R-42 (UI) selected-target state on session-place (P4 part); R-73 (UI) exact phase re-rendered after reload (P4 part); R-22 empty column placeholder rendered on session-idle-empty-column; R-70/R-71 Redo into Composing with a free letter re-renders the used state (P4 supp.).

Owns: The static tray, the ghost and mirror rendering, session-idle-empty-column.json, and the board screenshot baselines.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows:

- AD-14: exactly 52 data-card-id elements, each id once, and exactly 52 `[data-place]` elements, each also carrying data-card-id, with data-place per AD-14, on session-idle-fresh, session-composing, session-place, session-place-free-letter-redo-tail, its Composing after one Undo, its move 2 Composing after two Redos, session-won, session-gave-up, and session-idle-empty-column in Idle, after one Undo and after two Undos. Per state the test asserts the exact set of data-mirror-of ids and the live tray/strip order as literals computed from view() at planning (the plan lists them).
- AD-14 (R-30 render; the rule is Vitest-covered): in that move 2 Composing (k = 2, side right) the tray holds live [26] then D mirrors [1, 27]; cards 27 and 1 live in column 6 in destination style.
- R-42 (UI): on session-place (only cell 3 legal), wordcell-3 shows the selected-target ring and its check element visible at full opacity, cells 4–10 the not-legal state; on session-idle-empty-column after one Undo (target 7), cells 3–6 show the legal-target ring.
- AD-11 (F2): on session-composing the tray tile area has overflow hidden, height max(H, 92) and its bottom at or above the labels band top.
- R-22: on session-idle-empty-column, column 1's placeholder is visible; after one Undo (move 0's Place) column 1 shows 7 ghosts, no placeholder, strip [24, 6, 49, 30, 25, 20, 48]; after two Undos (move 0's Composing, whole 7-card self-drop of column 1, k = 0) column 1 shows its 7 ghost mirrors with the placeholder visible beneath and the tray holds the 7 live S tiles in that order.
- R-33 (UI): wordcell-3's face is a [data-mirror-of] element in the used state on session-place-free-letter-redo-tail and after one Undo into its Composing.
- R-73 (UI): a reload re-renders the same state: session-composing → ghosts, destination style, tray order (incl. the D mirror); session-place-free-letter-redo-tail → S and D ghosts (32, 9), used cell 3, strip order [9, 32, 28], target 3.
- R-70/R-71: from session-place-free-letter-redo-tail, Undo twice then Redo once lands in move 1's Composing with cell 3 used (mirror face of 28) and card-28 live in the tray ([32, 28], D mirror 9 at the right end).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-2 (Live vs mirror, static tray, Screenshots)

## Notes

- Resolved (F2): beyond 14 tiles (compact 3+ from the helper) Tray.svelte clips by `overflow: hidden` inside the reserved max(H, 92) area, never over the labels or WordCells, every element kept in the DOM (AD-14).
- Count badge 1/2-card boundary (deferred by ticket 4.2) stays deferred: no state reachable by Undo/Redo from any valid fixture has 1 or 2 cards on a WordCell, needing another scripted fixture; the plan's deferred list carries it to the epic retrospective.
