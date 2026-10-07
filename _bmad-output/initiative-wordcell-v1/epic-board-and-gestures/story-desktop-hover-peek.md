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

Adds HoverPeek.svelte (F19) for (hover: hover) and (pointer: fine) with pointerType mouse: hovering a non-empty WordCell 400 ms opens it through the overlays hover-peek state above the cell, clamped inside the board, below it when there is no room (dev fallback orders), never covering the cell; it shows the top 14 cards, oldest of them first, top card last and tagged top, as mirrors, a +1 older card / +n older cards line from text.ts above them only above 14 cards (F27), no scrim, takes no clicks, closes on leave, never opens during a drag or with a peek or view open, and any pointerdown cancels the timer and closes an open hover peek only when the press starts a drag, a peek or the sticky view.

Interface: new src/ui/HoverPeek.svelte; text.ts gains olderCards(n) (F27); a controller pointerover timer for mouse input. Tests: R-65 (UI) hover peek on desktop (P4, desktop project); AD-13 openPeek closes a hover peek, hover then hold → only the peek sheet (P4 desktop + S from entry 5). Owns: HoverPeek.svelte and the older-cards strings.

Timer (controller, mouse only): the 400 ms timer arms once per entry into a non-empty WordCell; a pointerover from inside the cell already tracked does nothing; moving straight to another cell closes the old hover peek and re-arms for the new one. It never arms while any press is held (pointerdown to that pointer's end) or a fly-back runs; after a pointerdown cancelled it, or after a peek or view closes with the pointer still on the cell, it re-arms only on a fresh entry. At fire it re-checks against the current GameView that the cell is non-empty and relies on the store gate (overlays.svelte.ts openHoverPeek: no open while a peek, the view or a modal top (history notice, reset confirm, expanded end sheet) is open), so "with a peek or view open" above includes those modal tops. cancel() and detach clear the timer and call closeHoverPeek() (AGENTS.md cancel-first; EXPERIENCE.md key commands close an open hover peek).

"Starts a drag": while a hover peek is open the only possible press is on the hovered cell; that press crossing the drag threshold (inert, R-12) calls closeHoverPeek() at the crossing; a press that becomes a peek or the sticky view closes it through the store (openPeek, peekToSticky and openView already clear it); any other press (e.g. a tap that does nothing in Composing or Place) keeps it open until pointerleave.

Layout (DESIGN.md View sheet, Layer order): cards at card size w, 7 per row, at most two rows; the older-cards line is a ui-label above the first row (n = count − 14); layered above selection/lift and below the drag layer. "No room" means the hover peek's height exceeds the cell's top minus the board's top (board = the Board root's rect); it then goes below the cell. Horizontally clamped inside the board; never intersects the cell; positioned inside the board's scrolling content so it moves with the cell on scroll, and re-placed on any layout change (w, band heights) while open.

Mirrors are drawn from CellView.cards (SPEC CAP-9): on a used cell the top (live in the tray or strip) is a normal-card mirror, unhatched, still tagged top (text.ts viewTop); mirrors carry data-mirror-of only and never animate (AD-14).

Locator: no data-testid (AGENTS.md); the HoverPeek root carries a `data-hover-peek` attribute (precedent `data-view-scroll`, no new catalogue string); tests locate it, and its `[data-mirror-of]` children through it. "Only the peek sheet visible" means zero `[data-hover-peek]` and the peek dialog visible.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on desktop shows a 400 ms hover opening the hover peek with the top 14 cards and the older-cards line on session-won's cell 6 (24 cards, +10 older cards) and its absence on cell 8 (7 cards), closing on leave, not opening during a page.mouse drag, hover then a 400 ms press-and-hold leaving only the peek sheet visible, and current().session and storage unchanged.

Also, desktop P4 (named R-65 where they cover R-65 sentences): on session-won cell 6, the data-mirror-of sequence equals the cell's last 14 cards oldest first, top tagged on the last; its rect lies above the cell, inside the board and does not intersect the cell; with dev `?bands=topBar,banner,leftover,wordcells,columns,tray,actionBar` (WordCell row above the columns, a permutation per src/ui/layout/bands.ts) it sits below the cell; no scrim, and a click on the cell while it is open does its phase-matrix action (Game over: the sticky view opens, hover peek gone); hover 200 ms, leave, re-enter 200 ms opens nothing; moving among cards inside cell 6 for 400+ ms opens exactly once; moving cell 6 (24 cards) → cell 7 (21) switches the hover peek; a press on cell 6 dragged past the threshold closes it; a page.mouse tail drag from column 2 on session-idle-empty-column resting ≥ 600 ms over cell 7 (7 cards) shows no hover peek before release; session-gave-up-after-commit's empty cell 3 hovered 600 ms opens nothing; hovering the used cell 3 (3 cards) of session-place-free-letter-redo-tail shows an unhatched mirror tagged top and exactly one live element per card. UI Vitest (named AD-n): text.test.ts olderCards(1) → '+1 older card', olderCards(10) → '+10 older cards' (no fixture has a 15-card cell), and the 14/15 split (a pure helper or the component's derivation): 14 → no line, 15 → +1; controller: cancel() clears a pending hover timer and closes an open hover peek.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-9 (Hover peek)
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-9, F19, F27
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, View sheet (WordCell view), Layer order
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, WordCell view

## Notes

- Open question: None on fixtures: session-won's cell 6 (24 cards) shows the older-cards line and cell 8 (7 cards) its absence; no new fixture.
