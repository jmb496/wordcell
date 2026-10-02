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

Extends src/ui/overlays.svelte.ts on the epic 3 core (F5, F6): ids tailSelection, wordcellView and endSheet; select(column, count) pushing one entry on the first selection and none on re-select, deselect() closing it top-down (no nav call with nothing selected), the read-only selection; endSheet hidden | collapsed | expanded with expandEndSheet (push), collapseEndSheet (pop), closedByBack collapsing it, onUnfinished, the deferred-open token that resetForNewSession cancels, resetForNewSession clearing the selection and hiding the sheet; openPeek(cell), closePeek(), peekToSticky() (pushes wordcellView above a kept selection), openView(cell) and the hover-peek state, with openPeek, peekToSticky and openView closing a hover peek and no hover peek opening while a peek or view is open; DispatchResult finished/unfinished stays unwired (sheet hidden, nothing pushed); entry 2's ActionBar keeps calling resetForNewSession, whose widened reset stays compatible; its Playwright case lives in e2e/nav.spec.ts with getByTestId('undo'|'redo') locators so it never collides with entry 2's F4 locator moves.

## Acceptance Criteria

Verify: npm run test:all is green with UI Vitest AD-13 cases for every transition and entry count on a stubbed nav, the existing History notice and Reset confirm tests passing unchanged, and Playwright on android showing Undo then Redo into won on session-won leaving history.state.wc at 0.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-5

## Notes

- Open question: None; the API names in build-notes CAP-5 are assumptions the builder may adjust, recording any change in the plan.
