# Review log — story-end-sheet-history-unreadable-block-and-reset-history.md

State: pass 1: done
Pre-loop: HEAD a2ad4adf23613cffb3930c6a4cbacb0dfffb5775; pass 0 copy `.review-log.passes/pass0.md`, 252 words (growth budget 2.5x ≈ 630 words).

## Pass 1 — 2026-10-15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 7, decision-needed 1  |  Dropped in triage: 2 (focus-return after Reset left to the plan; Give-up flash)
Words (docs): 428 (1.7 x pass 0)  |  Snapshot: .review-log.passes/pass1.md
### Applied
- [major] AC "each history-invalid-* fixture" — 19 fixtures, 3 variants, no map → fixer item 1 (default: one fixture per variant, win and Give up on them)
- [major] AC Reset flow — Keep it / Delete history outcomes and wc values from the sheet (non-reload) and over the notice (reload; EXPERIENCE Reset confirm row) unspecified → item 2
- [major] AC "screens specs … per build-notes" — build-notes default list names none for the block → item 3 (default: block at 360 px, single-line state)
- [minor] Undo-after-Reset assertion wording → item 4; add F4 reference → item 5; back sequence "notice stays", "collapsed, not hidden" → item 6
### Default applied (technical)
- Fixture choice, screens list, Undo assertion form → defaults above
### Decision needed (functionality / UX / gameplay)
- Description, single line after Reset history — how long does `This game wasn't added to your statistics.` show? After a reload into Game over with the now-readable empty history, or after Undo then a new finish, does the sheet show the line? Nothing stored marks the finish as unrecorded (AGENTS rule 2) — proposed default: the line shows only on the sheet that was open when Reset ran (and its collapse/expand); after reload with a readable history the sheet shows no line; Undo then a new finish records normally with no line.
### Dropped
- Focus return after Reset (plan detail); Give-up first-render flash (unlikely, plan); tab order, F8/act() citation, dependency list, AC split into numbered items — minor, unapplied
