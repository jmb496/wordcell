# Review log — story-end-sheet-history-unreadable-block-and-reset-history.md

State: pass 3: done (converged)
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

## Pass 2 — 2026-10-15
Reviewers: fix diff (replaces builder's reading), edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 8, decision-needed 1 (merged into the pass 1 item)  |  Dropped in triage: 1 (getter-unit-test naming, test choice left to the plan)
Words (docs): 537 (2.1 x pass 0)  |  Snapshot: .review-log.passes/pass2.md
### Applied
- [major] AC back sequence — "the notice stays after the first back" attached to the wrong step, no state after each back; EXPERIENCE says back acts as Not now (closes the notice) → fixer item 1 (steps with history.state after each)
- [minor] confirm dismissal Esc/back/scrim = Keep it, never collapses the sheet or reaches the notice (EXPERIENCE Confirm dialog row) → item 2
- [minor] Delete history history.state values (wc 1 in both cases) → item 3
- [minor] cite catalogue rows by name, not line number → item 4
- [minor] before Reset the stored history is unchanged by the finish (tickets.toml 7 tests: R-84 history untouched) → item 5
- [minor] stored post-reset shape named; screens variant named; win/Give up seeding path → items 6-8
### Default applied (technical)
- Seeding: live finish on a seeded history for win and Give up, relaunch for the third fixture; screens variant history-invalid-version-unknown
### Decision needed (functionality / UX / gameplay)
- Extends the pass 1 item: if the player reaches Reset history through the Statistics panel (opened from the sheet or the menu) rather than the sheet's own block, does the sheet then show `This game wasn't added to your statistics.` or nothing? EXPERIENCE only covers Reset "from the end sheet". Proposed default: the line shows only after a Reset from the sheet's block or the notice over it; a Reset from the Statistics panel leaves the sheet with neither block nor line.
### Dropped
- Unit test naming for the shared getter (plan detail)

## Pass 3 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 6, decision-needed 0  |  Dropped in triage: 0
Words (docs): 537 (2.1 x pass 0, unchanged; no fix pass)  |  Snapshot: .review-log.passes/pass2.md
### Applied
- none (zero majors; stopping rule met)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none

## Result — converged after 3 passes

Unapplied minors (for the plan or next loop):
- Non-reload history.state values written without `launch` (`{ wc: 1 }`); nav stamps `{ wc, launch }` — write wc values for the current launch.
- Pair each AC block with its tickets.toml test id (Q-33 block and variants, §2 Reset then Undo, R-84 history untouched, AD-13 Game-over reload) and say strings go in text.ts.
- State history.state after Undo ({ wc: 0 }, relaunch { wc: 0, launch: new }) and Undo in the relaunch route.
- Live-finish tests answer the launch notice with Not now first (stack wc 0, sheet wc 1).
- Classification of the other 16 history-invalid-* fixtures into variants rests on the EXPERIENCE row; optionally pin history-invalid-array.
- Earlier: tab order of Reset history, F8/act() citation, dependency list (after: [6]), numbered AC split, Statistics/Replay buttons with the block showing, shared-getter test, Give-up first render.

Open decision-needed (owner): lifetime of the single line `This game wasn't added to your statistics.` after Reset history — after a reload with a readable history, after Undo then a new finish, and when Reset is made through the Statistics panel.
