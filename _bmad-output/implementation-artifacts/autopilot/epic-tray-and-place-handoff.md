outcome: done
ticket: 5.12
reason: done
next: 5.13
updated: 2026-10-14T18:30:00Z
summary: Ticket 5.12 (tray grows to extra compact rows as letters are added) is built, reviewed, tested and marked done.

## Report

Ticket 5.12 is done: the tray now grows and shrinks its rows with the tile count after each completed edit, never mid-drag, and the WordCell row stays unchanged. Ticket review and code review each converged in 3 passes with nothing needing your input; `npm run test:all` passes.

**For you:**
- The three-row Place fixture uses a 15-letter non-word with an inline dictionary, since no real 15-letter word fits. Say if that is not acceptable.
- One timing-fragile e2e (780 px scroll-busy) is carried to the refactor sweep.
- `npm run test:screens` was not run (no Docker here); run it before the epic closes.
- Android fling behaviour with the anchor scroll write goes to the epic 7 device checks.

Close-out docs: none

Resume: `.claude/skills/epic-autopilot/scripts/loop.sh epic-tray-and-place`
