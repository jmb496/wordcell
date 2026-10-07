---
id: 12
type: story
title: "Desktop hover peek"
parent: epic-board-and-gestures
covers: [CAP-9]
after: [11]
risk: low
---

# Desktop hover peek

## Description

Adds HoverPeek.svelte (F19) for (hover: hover) and (pointer: fine) with pointerType mouse: hovering a non-empty WordCell 400 ms opens it through the overlays hover-peek state above the cell, clamped into the board column, below it when there is no room (dev fallback orders), never covering the cell; it shows the top 14 cards, oldest of them first, top card last and tagged top, as mirrors, a +1 older card / +n older cards line from text.ts above them only above 14 cards (F27), no scrim, takes no clicks, closes on leave, never opens during a drag or with a peek or view open, and any pointerdown cancels the timer and closes an open hover peek only when the press starts a drag, a peek or the sticky view.

Interface: new src/ui/HoverPeek.svelte; text.ts gains olderCards(n) (F27); a controller pointerover timer for mouse input. Tests: R-65 (UI) hover peek on desktop (P4, desktop project); AD-13 openPeek closes a hover peek, hover then hold → only the peek sheet (P4 desktop + S from entry 5). Owns: HoverPeek.svelte and the older-cards strings.

Timer (controller, mouse only): an entry is a root pointerover whose relatedTarget is outside that cell's [data-wordcell] element (badge and hidden cards inside; the label outside), arriving while no press is held (pointerdown to that pointer's end) and no fly-back runs; leave is a root pointerout whose relatedTarget is outside it. The 400 ms timer arms once per entry into a non-empty WordCell; leave clears it and closes the hover peek; moving straight to another cell closes the old one and arms for the new one. After any press end (including a drag released over a cell), a fly-back end, a peek or view close or cancel() with the pointer on the cell, it arms only after the pointer leaves that cell and enters again (boundary pointerovers from capture release or scrim removal are not entries). At fire it re-checks against the current GameView that the cell is non-empty and relies on the store gate (overlays.svelte.ts openHoverPeek: no open while a peek, the view or a modal top (history notice, reset confirm, expanded end sheet) is open), so "with a peek or view open" above includes those modal tops. cancel() and detach clear the timer and call closeHoverPeek() (AGENTS.md cancel-first; EXPERIENCE.md key commands close an open hover peek).

"Starts a drag": any press of any pointer type cancels the timer; a press (any pointer) crossing the drag threshold (inert, R-12) calls closeHoverPeek() at the crossing; a press that becomes a peek or the sticky view closes it through the store (openPeek, peekToSticky and openView already clear it); a non-primary-button press does nothing to an open hover peek, and any other press (e.g. a tap that does nothing in Composing or Place) keeps it open until leave.

Layout (DESIGN.md View sheet, Layer order): the view sheet's surface ({colors.surface}, {rounded.lg}, 16 px padding, cards in w + 4 slots with 4 px gaps as WordCellView.svelte), no title, no transition (as the view sheet, SPEC Non-goals); content-sized, so its width is min(count shown, 7)·(w + 4) − 4 + 32 px; cards at card size w, 7 per row, at most two rows; the older-cards line is a ui-label above the first row (n = count − 14); layered above selection/lift and below the drag layer. The anchor box is the union of the cell and its number label (F25 labelsRow): above means the hover peek's bottom at or above the label's top; below means its top at or below the cell's bottom. "No room" means its height exceeds the anchor box's top minus the board's top (board top = the .board top; board column = the --wc-board / metrics.board-wide band column centred in .board, not the full-width Board root); it then goes below, never clamped vertically (not intersecting the anchor box wins over staying inside the board; the page scrolls to show overflow). Centred on the cell's horizontal centre, then clamped into the board column's horizontal extent; never intersects the anchor box; positioned absolutely within the Board root in page-scroll content (the window scrolls), so it moves with the cell on scroll and may extend under the sticky bars in short windows (no viewport clamp); re-placed on any layout change (w, band heights) while open.

Mirrors are drawn from CellView.cards (SPEC CAP-9): on a used cell the top (live in the tray or strip) is a normal-card mirror, unhatched, still tagged top (text.ts viewTop); mirrors carry data-mirror-of only and never animate (AD-14).

Locator: no data-testid (AGENTS.md); the HoverPeek root carries a `data-hover-peek` attribute and aria-hidden="true" (the sticky view stays the accessible path, R-65) (precedent `data-view-scroll`, no new catalogue string); tests locate it, and its `[data-mirror-of]` children through it. "Only the peek sheet visible" means zero `[data-hover-peek]` and the peek dialog visible.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on desktop shows a 400 ms hover opening the hover peek with the top 14 cards and the older-cards line on session-won's cell 6 (24 cards, +10 older cards) and its absence on cell 8 (7 cards), closing on leave, not opening during a page.mouse drag, hover then a 400 ms press-and-hold leaving only the peek sheet visible, and current().session and storage unchanged.

Also, desktop P4 (named R-65 where they cover R-65 sentences): on session-won cell 6, the data-mirror-of sequence equals the cell's last 14 cards oldest first, top tagged on the last; its rect lies above the anchor box, within the board column's horizontal extent and does not intersect the anchor box; with dev `?bands=topBar,banner,leftover,wordcells,columns,tray,actionBar` (WordCell row above the columns, a permutation per src/ui/layout/bands.ts) the test first asserts anchor top − board top < hover peek height, then that it sits below the cell; no scrim, and a click on the cell while it is open does its phase-matrix action (Game over: the sticky view opens, hover peek gone); hover 300 ms, leave, re-enter: no hover peek 300 ms after re-entry, and it opens 400 ms after re-entry (page.clock where it makes timing deterministic); moving among the top card, the count badge and the cell's padding (only the top card is visible) for 400+ ms opens exactly once; moving cell 6 (24 cards) → cell 7 (21): cell 6's closes on leaving it, none shows before 400 ms on cell 7, then cell 7's opens; a press on cell 6 dragged past the threshold closes it; a page.mouse tail drag from column 2 on session-idle-empty-column resting ≥ 600 ms over cell 7 (7 cards) shows no hover peek before release, nor within 600 ms after it without a mouse move out of the cell; hovering session-idle-empty-column's cell 7 for 400 ms opens the hover peek; session-gave-up-after-commit's empty cell 3 hovered 600 ms opens nothing; hovering the used cell 3 (3 cards) of session-place-free-letter-redo-tail shows an unhatched mirror tagged top and exactly one live element per card; R-65 no-history: opening and closing a hover peek on session-won cell 6 leaves Undo/Redo enablement and window.history.length (page.evaluate) unchanged; takes no clicks: the HoverPeek root has pointer-events: none and, while open, document.elementFromPoint at its rect's centre is not inside [data-hover-peek]; a do-nothing press keeps it open: on session-place-free-letter-redo-tail (Place) hover cell 3 400 ms, click it, [data-hover-peek] stays and the Session is unchanged; no reopen: after the session-won sticky view is closed with the pointer still on cell 6, no hover peek within 600 ms without a mouse move out of the cell; the hover-then-hold test is named AD-13. UI Vitest (named AD-n): text.test.ts olderCards(1) → '+1 older card', olderCards(10) → '+10 older cards' (no fixture has a 15-card cell), and a required pure exported .ts helper (beside olderCards in text.ts or a hover-peek .ts module) that HoverPeek.svelte calls, returning the shown top-14 slice and the older count, tested at 1, 14 and 15 cards (15 → +1, 14 → none); controller: cancel() clears a pending hover timer and closes an open hover peek.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-9 (Hover peek)
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-9, F19, F27
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, View sheet (WordCell view), Layer order
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, WordCell view

## Notes

- Open question: None on fixtures: session-won's cell 6 (24 cards) shows the older-cards line and cell 8 (7 cards) its absence; no new fixture.
