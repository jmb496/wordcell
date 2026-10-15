# SPEC review log

State: pass 1: review

Pre-loop: HEAD 88bbe9d, words in pass0.md

State: pass 1: done

## Pass 1 — 2026-10-14
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: ~19 major (merged), ~14 minor, decision-needed 0  |  Dropped in triage: 0 (key claims verified against code/refs)
### Applied
- All 19 merged items (end-sheet buttons Replay+Statistics; R4 already landed as newGame(); two-overlay reload moved to ticket 3; in-progress = playing and moves>0; Escape-invert moved to CAP-10; guard key aliases + input table; CAP-10 key semantics; constraints/assumptions on statistics source; best+average exclusion; __APP_VERSION__ format; timer per AD-9; live region; CAP-12 done conditions; end-sheet details; screens/baselines; per-surface table; success signal; coverage rows).
### Default applied (technical)
- All of the above are technical defaults; none changes functionality, UX or gameplay beyond what DESIGN.md/EXPERIENCE.md already state.
### Decision needed
- none
### Dropped
- none
Snapshot: SPEC.review-log.passes/pass1.md; fix diff pass1.fix.diff (companions, epic file and tickets.toml also edited by the fixer; summary in the run report)

State: pass 2: done

## Pass 2 — 2026-10-14
Reviewers: fix diff, builder+edge, adversarial+refs  |  Findings: major 8 (merged), minor 7, decision-needed 0  |  Dropped: 0
### Applied
- [major] two-overlay reload pair (menu+confirm cannot coexist) → Statistics panel + Reset confirm; ticket 2 verify no end sheet; ticket 4 fixture-based; inProgress gate named; I-68 expected results; hide completes the pending open; keys with no Session; timer >10 h format.
### Default applied (technical)
- all above; spine AD-13 wording edit recorded as close-out edit in build-notes.
### Decision needed
- none
Snapshot: SPEC.review-log.passes/pass2.md; fix diff pass2.fix.diff

State: pass 3: done

## Pass 3 — 2026-10-14
Reviewers: fix diff, full read  |  Findings: major 2 (merged: ticket 3 verified later-built surfaces; two scenarios called the same reload test), minor 3, decision-needed 0
### Applied
- Reload and win-smoke tests moved to tickets 5/6; Game-over reload named in CAP-4/ticket 7; flag consumers; just-committed signal from the dispatch call site; WordCell transition P6 in ticket 1.
### Decision needed
- none
Snapshot: pass3.md; fix diff pass3.fix.diff

State: pass 4: done

## Pass 4 — 2026-10-14
Reviewers: fix diff + ticket ordering, ref alignment  |  Findings: major 3 (guard window max(settle,300 ms); ticket 1 verified ☰ from ticket 2; ticket 2 placeholder design), minor 1 (R-82 owner), decision-needed 0
### Applied: all four (technical defaults)
Snapshot: pass4.md; fix diff pass4.fix.diff

State: done

## Pass 5 — 2026-10-14
Reviewers: fix diff + ticket ordering  |  Findings: major 0, minor 3, decision-needed 0

## Result — converged after 5 passes
Majors per pass: ~19, 8, 2, 3, 0. Decision-needed: none. Technical defaults applied: all.
Unapplied minors (for the ticket reviews):
- Ticket 6 verify: Statistics button from the sheet, focus on first action on open; ticket 11 verify: collapse returns focus to the board.
- Ticket 9 `after` should be [2, 4, 5] (it asserts all six menu rows).
- Ticket 10 verify: rejected-root and Halted key cases, end-sheet-open key activity.
Words: 2688 -> see wc (about 1.45x pass 0).
