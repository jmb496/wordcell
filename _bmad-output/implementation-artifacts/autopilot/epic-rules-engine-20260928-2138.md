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

## Stopped — usage limit
Ticket 2.4 (Composing commands and the command table), Step B (build), plan status `in-review`. Limit message: "You've hit your session limit · resets 3:20am (America/New_York)". The build's own files (src/engine/commands.ts, commands.test.ts, edits to errors.ts, index.ts, index.test.ts, replay.ts, rules.ts, and the plan) are left uncommitted for bmad-build-auto's resume. Resume: run `/epic-autopilot epic-rules-engine` after the reset; Step B resumes the in-progress build.

## 2.4 Composing commands and the command table — done
What it adds: the first player actions: picking up a stack and dropping it, choosing how many destination cards join the word, flipping sides, adding and removing free letters, and reordering letters. There is also a single table listing, for every action, when it is refused or does nothing.
Ticket review: 5 passes, converged (majors 8, 8, 3, 1, 0); nothing needed your input
Build: built; commits 0da8542
Code review: thorough, 2 passes, converged with one open item; 1 fix commit (1af45be)
Tests: all passing
Ref to fix upstream: none
Paused: usage limit during the build (reset 3:20am America/New_York), resumed 04:58 EDT; the build resumed from its saved plan
Worth knowing: open test gap: no R-13 test asserts the word formed when a whole column is dropped back onto itself (Q-30), and one D8 removal case sits at the edge rather than the middle. Both are carried to the 2.12 sweep.

## 2.5 Validate and Place commands with the §8 worked example — done
What it adds: checking a word against the dictionary, choosing which WordCell it goes to and in what order the cards land, and confirming the move. The rulebook's worked example (BAKED, BALKED, FAKED, FLAKED) now runs as a test.
Ticket review: 4 passes, converged (majors 10, 5, 3, 0); nothing needed your input
Build: built; commits a489441
Code review: thorough, 2 passes, converged; 1 fix commit (55df7eb)
Tests: all passing
Ref to fix upstream: none
Worth knowing: two small test-precision minors (the R-42 default order asserted only under other test names; reorder not checked to keep a non-default target) carried to the 2.12 sweep.

## 2.6 Undo, redo, give up and accrue — done
What it adds: undo and redo through every step of a move (including a word you validated but did not place), giving up and taking it back, and the play-time clock, which only counts while a game is being played. The table of refused actions is now complete, and a shared test helper wins a real seed for later tests.
Ticket review: 5 passes, converged (majors 6, 4, 4, 2, 0); nothing needed your input
Build: built; commits 683add5
Code review: thorough, 2 passes, converged with one open item; 1 fix commit (fc32abb)
Tests: all passing
Ref to fix upstream: none
Worth knowing: open item: a safety check added by the review (undo on a corrupted phase value) has no row in the command table yet; carried to 2.10/2.12. The build deferred one item to 2.10: saved-game checking must reject a fractional or unknown cursor, which 2.10's parser stage owns.

## 2.7 Scoring, penalty and bands — done
What it adds: the score (each card's letters times the WordCell number it sits on), the give-up penalty of 10 per letter left in the columns (QU counts 2), final scores that can go negative, and the six rating bands, set relative to the maximum score rather than fixed numbers.
Ticket review: 3 passes, converged (majors 6, 1, 1) with one open item handed to the build (a test that a negative give-up score lands in the lowest band); nothing needed your input
Build: built; commits efbf06f
Code review: quick, 1 pass, converged; 0 fixes applied
Tests: all passing
Ref to fix upstream: none
Paused: usage limit during the code review (reset 9:50am America/New_York), resumed 14:24 EDT
Worth knowing: the build deferred one doc item: AGENTS.md still calls STUCK_PENALTY_PER_CARD scaffold, which is now stale (it needs a bmad-project-context refresh). There are also two small scoring-test minors; both are carried to the 2.12 sweep.

## Skill notes (first run of the updated review-loop and epic-autopilot skills)
- Usage-limit detection works for session limits (three pauses caught and resumed cleanly: 2.2 Step A, 2.4 Step B, 2.7 Step C). It misses the weekly limit: the log line reads `You've hit your weekly limit · resets Sep 30, 4pm (America/New_York)`, and the skill's pattern `hit your (session|usage) limit` does not match it, so the step looked like "no JSON written" (rule 5) until the log was read. Proposed: `grep -iE "hit your [a-z]+ limit"`.
- Resume of partial review logs (Steps A and C) and of an `in-review` build (Step B) worked as written; the build resumed from its saved plan without redoing work.
- Step A's prompt names `delta-checks.md`, an epic-1-only companion. Epic 2's spec has `rule-coverage.md` instead; the run substituted it. Proposed: "the epic spec's companions (every file listed in SPEC.md `companions:` under the spec folder)".
- An epic file's frontmatter `after: [<previous epic>]` makes `tickets.py next` gate every ticket until the previous epic's container has `status: done`, which nothing sets after a retrospective. Proposed: the retrospective (or the autopilot's setup) marks the finished epic container done, or ticketing pins cross-epic needs on entries only.
- The Step C depth rule ("no high or medium finding left unresolved … and risk not medium or higher") worked; low-risk tickets 2.1 and 2.7 ran quick, the rest thorough.
- Code loops stopping with an open major under the "two passes with ≤ 1 major" rule (2.3, 2.4, 2.6) reported it as `late_majors` though the result was `converged`; the skill's rule reads late_majors only "when not converged". Treated as open items carried to the sweep; the skill could say so explicitly.
- Review-loop passes ran within the growth budget; no loop diverged.

## Stopped — usage limit
Ticket 2.8 (GameView), Step A (ticket review loop), pass 1 done and committed (a389245). Limit message: "You've hit your weekly limit · resets Sep 30, 4pm (America/New_York)". Tree clean. Resume: run `/epic-autopilot epic-rules-engine` after the reset; Step A resumes the partial 2.8 review log.
