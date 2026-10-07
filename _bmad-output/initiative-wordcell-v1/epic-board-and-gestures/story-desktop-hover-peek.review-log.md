# Review log — story-desktop-hover-peek.md (ticket 4.12)

State: pass 1: done

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
