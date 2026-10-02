---
id: 5
type: story
title: "Overlays store: tail selection, end-sheet and view states"
parent: epic-board-and-gestures
covers: [CAP-5]
after: [3.8]
risk: medium
---

# Overlays store: tail selection, end-sheet and view states

## Description

Extends src/ui/overlays.svelte.ts on the epic 3 core (F5, F6): OverlayId gains tailSelection, wordcellView and endSheet. Invalid-state calls throw `Error('AD-13 <op> while <state>')` like the existing open/close (rule 6); the only specified no-ops are those named below.

- Selection: select(column, count) pushes one tailSelection entry on the first selection; re-select (same column, any count) replaces { column, count } with no push, even with a view stacked above; select on a different column while a tail is selected throws (callers deselect first, build-notes CAP-6/CAP-7); count < 1 or column outside 1–8 throws. deselect() closes the entry top-down; with nothing selected it is a no-op (no nav call); when tailSelection is not the top entry (e.g. a sticky view above a kept selection) it throws: callers close the view first.
- View and peek: openView(cell) pushes one wordcellView entry and stores the view cell; allowed while a selection exists (pushes above it; UI gates per CAP-6). openPeek(cell) stores the peek cell, no entry; closePeek() clears it, no entry; peekToSticky() moves the peek cell into the view cell, clears the peek and pushes one wordcellView entry (above a kept selection). closePeek/peekToSticky with no peek open, and openPeek while a peek or the view is open, throw.
- Hover peek: openHoverPeek(cell), closeHoverPeek() and the hoverPeek getter push no entry; openHoverPeek while a peek or view is open is a no-op (the 400 ms timer can fire then, build-notes CAP-9); openPeek, peekToSticky and openView close an open hover peek.
- End sheet: hidden | collapsed | expanded. expandEndSheet() only from collapsed (push); collapseEndSheet() only from expanded with endSheet on top (pop). closedByBack on endSheet sets collapsed, never hidden (AD-13). onUnfinished(): expanded → close('endSheet') (one pop) then hidden; collapsed → hidden, no pop; hidden → cancels any pending deferred-open token, stays hidden, no nav call (AD-13 Undo during the animation, AD-14). deferEndSheetOpen() returns a token, superseding any previous one; openDeferred(token) for the live token closes an open wordcellView (top-down, one pop; AD-13 Game over closes a sticky view first), then sets expanded and pushes one endSheet entry; a cancelled or superseded token is a no-op. The "still won" re-check is the epic 6 caller's; the store does not read game.
- Generic paths: whenever the tailSelection entry is removed (deselect, close, closedByBack, reset) the selection is cleared; whenever wordcellView is removed the view cell is cleared (build-notes CAP-5). Generic open() throws for the three new ids (callers use select / openView / peekToSticky / expandEndSheet / openDeferred).
- Reset: resetForNewSession() cancels the deferred token, closes every stack entry top-down through close (endSheet included when expanded), then sets the sheet hidden and clears the selection, view cell, peek and hover peek; an old token stays dead after reset while a fresh token opens.
- DispatchResult finished/unfinished stays unwired in epic 4 (sheet hidden, nothing pushed). newGame() in src/ui/new-game.ts (used by the ActionBar and the rejected root) keeps calling resetForNewSession, whose widened reset stays compatible. The Playwright case lives in e2e/nav.spec.ts with getByTestId('undo'|'redo') locators so it never collides with entry 2's F4 locator moves.

Interface: select, deselect, selection ({ column, count } | null), endSheet ('hidden' | 'collapsed' | 'expanded'), expandEndSheet, collapseEndSheet, onUnfinished, deferEndSheetOpen/openDeferred, openPeek, closePeek, peek (cell 3–10 | null), peekToSticky, openView, the view cell (cell 3–10 | null), openHoverPeek, closeHoverPeek, hoverPeek (cell 3–10 | null); OverlayId gains tailSelection, wordcellView, endSheet.

Tests: AD-13 one entry per tail selection, re-select pushes none, back clears the selection (S); AD-13 peek pushes none, sticky view one, peek turned sticky one above a kept selection, hover peek closed by openPeek/peekToSticky/openView (S); AD-13 end-sheet hidden/collapsed/expanded, closedByBack collapses, unfinished transitions, deferred-open cancel (deferEndSheetOpen → onUnfinished → openDeferred(token) → hidden, zero pushes), openDeferred entry counts with and without a view open, resetForNewSession from a selection plus a sticky view (S); AD-13 each throw and specified no-op above (S); AD-13 epic 4 leaves DispatchResult finished unwired (P4).

Owns: every overlay open state of the epic: selection, end sheet, peek, sticky view and hover peek; the controller and HoverPeek call only these.

## Acceptance Criteria

Verify: npm run test:all is green with UI Vitest AD-13 cases for every transition, throw, no-op and entry count on a stubbed nav, the existing History notice and Reset confirm tests passing unchanged, and a new separate Playwright test in e2e/nav.spec.ts on android named with AD-13 (e.g. "AD-13 epic 4 leaves DispatchResult finished unwired …"), seeded with session-won and a readable history (no notice), showing Undo then Redo into Game over (primary action shows New game) leaving history.state.wc at 0; the existing win → New game → back test stays unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-5, F5, F6
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-5
- spec — _bmad-output/specs/spec-epic-4-board/rule-coverage.md, AD-13 rows
- spine — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-13, AD-14

## Notes

- Open question: None; the API names in build-notes CAP-5 are assumptions the builder may adjust, recording any change in the plan; the same holds for the names this ticket adds (openHoverPeek, closeHoverPeek, hoverPeek, peek and the view-cell getter).
