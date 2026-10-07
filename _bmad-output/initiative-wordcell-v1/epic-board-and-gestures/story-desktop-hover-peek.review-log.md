# Review log — story-desktop-hover-peek.md (ticket 4.12)

State: pass 4: done

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

## Pass 3 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 11, decision-needed 0  |  Dropped in triage: 0 (sticky-bars contradiction merged across all four lenses; transition wording and page.clock across two)
Words (docs): 1582 (5.97x pass 0; budget 1500 exceeded by the majors' tests, minors kept word-neutral by cuts)  |  Snapshot: story-desktop-hover-peek.passes/pass3.md
### Applied
- [major] Layout — "may extend under the sticky bars" contradicts DESIGN.md Layer order and the ticket's own "above selection/lift" → fixer item 1
- [major] AC — the two no-reopen checks never move the mouse within the cell, so they pass without the boundary-pointerover rule → fixer item 2
- [major] AC — "opens exactly once" is unobservable (a second openHoverPeek throws, overlays.svelte.ts:146); restate as timing from first entry under page.clock → fixer item 3
- [major] AC — "centred, then clamped into the board column" untested (cell 6 is central; cell 8 overhangs) → fixer item 4
- [major] Description/Timer — (hover: hover) and (pointer: fine) gate has no source in the controller (hover filters only pointerType, controller.ts:756) and no test → fixer item 5
- [major] AC — Timer rules untested: detach, entry during fly-back, non-primary press, touch threshold crossing, fire-time empty re-check → fixer item 6
### Default applied (technical)
- Layout — draws over the sticky bars; .board-root position: relative, HoverPeek z-index 4 (lift 3, drag layer 5) → item 1
- Timer — arms only when pointerType is mouse and layout's hoverFine is true, read through ControllerDeps → item 5
- Timer — non-primary-button pointerdowns are not presses (controller.ts:546 button-0 filter) → item 8
- AC — page.clock installed before load in every 300/400/600 ms boundary test → item 9
### Minors
- transition deferred not dropped (item 7); non-primary not a press (item 8); page.clock (item 9); threshold test stays inside cell 6, checked before mouse.up (item 10); suppressed cell = the [data-wordcell] under the last mouse point (item 11); ?bands= with leftover below wordcells (item 12); height measured after render (item 13); spec file e2e/wordcell-view.spec.ts desktop describe (item 14); References add spine AD-12..AD-14 and rule-coverage rows (item 15)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fixer outcome
- all 15 items applied (no conflicts); z-index values checked in src (bars 2, lift 3 Card.svelte:188, drag layer 5 Column.svelte:211); hoverFine is only a local in layout.svelte.ts, so the ticket says the build exposes it as a getter; ?bands= permutation checked against parseBandsParam; e2e/wordcell-view.spec.ts desktop describe exists; unverified: cell 8 overhang of the board column (from the width formula, not measured in a browser); cuts for word neutrality: Notes line, two parentheticals, a duplicate never-intersects clause; fix diff story-desktop-hover-peek.passes/pass3.fix.diff

## Pass 4 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 3, minor 12, decision-needed 0  |  Dropped in triage: 2 (measurement locators left to the plan; viewport-overflow note restates the spec)
Words (docs): 1629 (6.15x pass 0; over the 1500 budget by the majors' additions, minors net −6 words)  |  Snapshot: story-desktop-hover-peek.passes/pass4.md
### Applied
- [major] AC — centring is untestable: every 7-card hover peek (7w + 56) is wider than twice any cell's room, so cell 6 always takes the "if clamped" branch (three lenses; pass 3 item 4 unresolved) → fixer item 1
- [major] "Starts a drag" — "a non-primary-button pointerdown … cancels nothing" contradicts build-notes CAP-9 "any pointerdown cancels the timer" (pass 3 item 8 over-applied) → fixer item 2
- [major] "Starts a drag" — closeHoverPeek() at the threshold crossing is a store write mid-drag for a pick-up drag, against AD-12 "no Svelte state changes until release" → fixer item 3
### Default applied (technical)
- AC — pure exported placement helper x = clamp(cellCentre − width/2, colLeft, colRight − width) with Vitest unclamped, left- and right-clamped; e2e cell 6 left edge = column left, cell 8 right edge = column right, within 1 px → item 1
- "Starts a drag" — close at the crossing only for an inert (WordCell) drag; a pick-up drag (another pointer) closes it in its end path → item 3
- Timer — suppressed cell found geometrically (the [data-wordcell] whose rect contains the last mouse point), not elementFromPoint → item 5
### Minors
- entry into the cell whose hover peek is open does not arm (item 4); geometric suppression (item 5); cancel-first closes on every key command, a superset of EXPERIENCE.md's set (item 6); remaining hover tests named AD-12 (item 7); re-placed on window resize too (item 8); mirrors reuse Card place="view" mirror="view" full (item 9); AD-13 hover-then-hold pinned to session-won cell 6, asserted before mouse.up (item 10); hoverFine re-checked at fire (item 11); cut the first paragraph's restated press clause (item 12)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- AC measurement locators for the board column and the label — plan detail
- viewport overflow in short scrolled windows — as specified (DESIGN.md clamps to the board only)
### Fixer outcome
- all 12 items applied (no conflicts); first paragraph cut to pointers (Timer, Layout, press handling below); Card place/mirror pairing checked in Card.svelte:57–58 and WordCellView.svelte; overlays openHoverPeek throw checked; item 7 shortened to "else AD-12", item 10 relies on the Locator paragraph's definition, item 11 omits the stays-until-leave note (stated elsewhere); fix diff story-desktop-hover-peek.passes/pass4.fix.diff
