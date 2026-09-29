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
