# Epic autopilot — epic-rules-engine (20260928-2138)

Epic: epic-rules-engine (epic 2, Rules engine). Branch: epic-2-engine. Start commit: 906264e.
Authorisation: owner, 2026-09-28 (methodology § Autopilot; invocation prompt of this session). Local commits only; never push; main untouched.
Working dir: /tmp/wordcell-autopilot/20260928-2138

## Setup notes
- The epic file's frontmatter `after: [epic-scaffold-ci-deploy]` gated every ticket, because epic 1's container has no `done` status; reverted to `after: []` (entry 2.1 already waits on 1.10, and the initiative entry keeps the needs line).
- Step A refs use the epic's rule-coverage.md in place of delta-checks.md (epic 2's spec has no delta-checks.md).

## 2.1 Golden deal test and R-id test names — done
What it adds: a test that locks today's card deal for two seeds (which cards land in which column, and which letter each card carries), so no later change can alter a deal unnoticed; the four old deal tests now carry rule ids.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commits 0386bbe, c0b6abc
Code review: quick, 1 pass, converged; 0 fixes applied
Tests: all passing
Ref to fix upstream: none
Worth knowing: nothing

## Stopped — usage limit
Ticket 2.2 (LangData, EN and letterCount), Step A (ticket review loop), staged at pass 0 (partial log committed). Limit message: "You've hit your session limit · resets 10:20pm (America/New_York)". Resume: run `/epic-autopilot epic-rules-engine` after the reset; it reuses this run id and resumes the partial 2.2 review log.

## 2.2 LangData, EN and letterCount — done
What it adds: the English letter set (which letter each card carries, QU counting as two letters) now lives in one place that the deck, scoring and word checks all read; the maximum score (530) is worked out from it rather than typed in. The deal is unchanged (the 2.1 lock test still passes untouched).
Ticket review: 2 passes, converged; nothing needed your input
Build: built; commits 94d329c
Code review: thorough, 2 passes, converged; 1 fix applied (bca5f0f)
Tests: all passing
Ref to fix upstream: none
Paused: usage limit at Step A (ticket review), reset 10:20pm (America/New_York), resumed 22:21 EDT
Worth knowing: two small test gaps noted by the code review (type exports not pinned by a test; the plan's result text is out of date) were left for the closing sweep.

## 2.3 Session, createSession, replay and checkSession — done
What it adds: a game is now stored as its seed plus the list of moves; the engine rebuilds the board from them and rejects a saved game that breaks any rule, with a precise reason for each kind of break.
Ticket review: 7 passes, converged (majors 12, 6, 5, 2, 1, 2, 0); nothing needed your input
Build: built; commits 81b828e
Code review: thorough, 3 passes, converged with one open item; 2 fix commits (809bb54, 276d928)
Tests: all passing
Ref to fix upstream: none (the open item is a missing test, not unclear docs)
Worth knowing: the code review left one test gap open: undone moves after the first one are not yet covered by a test that makes them fail (proposed cases are in review-loop/2-3-build.md Pass 3). Carried to the 2.12 refactor sweep, with seven small test-precision minors from the same log.
