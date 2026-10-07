# Review log — story-desktop-hover-peek.md (ticket 4.12)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 7c21189, copy story-desktop-hover-peek.passes/pass0.md, 265 words. Intent includes tickets.toml entry 12 fields interface, tests, owns (not copied at pull; fixer adds them to the Description in pass 1); copy at story-desktop-hover-peek.passes/intent-tickets-toml-12.md.

## Pass 1 — 2026-10-07
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 4, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 984 (3.71x pass 0; budget 1500)  |  Snapshot: story-desktop-hover-peek.passes/pass1.md
### Applied
- [major] Description — tickets.toml entry 12 intent fields (interface, tests, owns) absent → fixer item 1
- [major] Description — hover timer lifecycle unspecified: arming once per entry into a cell (within-cell pointerover ignored), cell-to-cell switch, no arming while a press is held or a fly-back runs, re-arm only on a fresh entry after a cancelling press or an overlay close, gates and non-empty re-checked at fire, modal tops block (store), cancel()/detach clear the timer and close the hover peek → fixer item 2
- [major] Description — "starts a drag" ambiguous (only a press on the hovered WordCell can occur; a WordCell drag is inert, R-12) → fixer item 3
- [major] Description — layout and placement undefined: DESIGN.md card size, 7 per row, two rows, ui-label older line, layer order; "no room" and the board bounds undefined; position must follow scroll/layout → fixer item 4
- [major] Description — SPEC CAP-9 used-cell top (normal-card mirror, unhatched, tagged top, CellView.cards in full) dropped → fixer item 5
- [major] AC — no locator for the hover peek (data-testid not allowed) → fixer item 6
- [major] AC — stated rules untested: placement (above, inside board, no intersection; ?bands= WordCells-first below), pass-through click, mirror order and top tag, drag case unpinned, WordCell press-drag closes, leave before 400 ms, empty cell, used cell, within-cell moves, cell switch, olderCards(1)/(10) and 14/15 split, cancel() clears timer → fixer item 7
### Default applied (technical)
- AC — hover peek locator → `data-hover-peek` attribute on the root (precedent `data-view-scroll`; no new catalogue string) → item 6
- Description — "no room" → height of the hover peek exceeds cell top − board top (Board root rect) → item 4
- Description — "starts a drag" → the press on the hovered cell crossing the drag threshold calls closeHoverPeek at the crossing → item 3
- Description — position tracks layout: positioned inside the board's scrolling content, recomputed on layout change → item 4
### Minors
- layer order (item 4); modal tops in the "never opens" list (item 2); scroll/resize anchor (item 4); References gain SPEC CAP-9, DESIGN.md View sheet and Layer order, EXPERIENCE.md WordCell view (item 8)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged)
### Fixer outcome
- all 8 items applied (no conflicts); fixture counts verified via parseSession+view probe (session-won 24/21/7; session-idle-empty-column cell 7 = 7, column 2 = 7; session-gave-up-after-commit cell 3 empty; session-place-free-letter-redo-tail cell 3 used, 3 cards); ?bands= string checked against parseBandsParam; unverified: column 2 tail pick-up in a browser, Game-over cell click opening the sticky view (from SPEC CAP-9); fix diff story-desktop-hover-peek.passes/pass1.fix.diff

## Pass 2 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 12, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: fresh-entry/cancel re-arm across three lenses, pure 14/15 helper across two)
Words (docs): 1407 (5.31x pass 0; budget 1500, nearly reached)  |  Snapshot: story-desktop-hover-peek.passes/pass2.md
### Applied
- [major] Timer — "fresh entry" undefined: boundary pointerover after capture release, fly-back end, scrim removal or cancel() could re-arm; leave defined on pointerout (controller has no pointerleave) → fixer item 1
- [major] Layout — horizontal clamp to the Board root is the full viewport width (.board-root width 100%); clamp to the board column (--wc-board) → fixer item 2
- [major] Layout — hover peek placed against the cell rect covers the cell's number label (separate labelsRow element, F25) → fixer item 3
- [major] Layout — the hover peek's surface (padding, gap, radius, background) unspecified, yet its width drives clamp and no-room → fixer item 4
- [major] AC — untested: R-65 "does not enter the move history" (rule-coverage: Undo/Redo enablement unchanged, no entry pushed), "takes no clicks" over the tray/columns, a do-nothing press keeps it open, no reopen after a drag release / view close on the cell; 14/15 split must be a pure helper (component derivation is not unit-testable) → fixer item 5
- [major] AC — "hover 200 ms, leave, re-enter 200 ms" races the 400 ms fire and never shows a re-entry opening → fixer item 6
### Default applied (technical)
- Timer — entry = a root pointerover whose relatedTarget is outside that [data-wordcell] while no press is held and no fly-back runs; after any press end, fly-back, overlay close or cancel() over the cell, the timer arms only after the pointer leaves the cell and re-enters → item 1
- Layout — clamp to the board column; anchor box = cell ∪ its label; surface reuses the view sheet's tokens; content-sized, centred on the cell → items 2–4, 8
- AC — "takes no clicks" by hit test (elementFromPoint), pointer-events none → item 5
- AC — 14/15 split as a pure .ts helper → item 5
### Minors
- below position never vertically clamped (not intersecting wins; page scrolls) (item 7); width min(count,7) cards, centred on the cell then clamped (item 8); any pointer type crossing the threshold closes it, non-primary buttons do nothing (item 9); ?bands= test asserts the no-room precondition (item 10); page-scroll positioning in the Board root, may extend under sticky bars (item 11); "moving among cards" → top card, count badge, padding (item 12); cell switch wording (item 13); aria-hidden root (item 14); no transition (item 15); one positive Idle hover (item 16); hover-then-hold test named AD-13 (item 17)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fixer outcome
- all 17 items applied (no conflicts); width formula refined to min(count,7)·(w + 4) − 4 + 32 px from WordCellView.svelte slots; fixture counts already verified in pass 1; no commands added; fix diff story-desktop-hover-peek.passes/pass2.fix.diff
