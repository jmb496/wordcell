outcome: done
ticket: 6.8
reason: done
next: 6.9
updated: 2026-10-15T15:27:21Z
summary: Ticket 6.8 (pending-draft line) is built, reviewed, tested and marked done.

## Report

Ticket 6.8 is done. After your answer on long words, the ticket review settled in 4 passes, the build passed, and the code review (2 passes) widened a cramped gap before the "·". All tests and screenshot checks pass.

Worth knowing: the two new screenshot baselines still show the old narrow gap (they passed anyway); regenerate them next time baselines are refreshed.

Close-out docs (for the retro):
- EXPERIENCE.md State Patterns (Idle/pending draft row) and DESIGN.md Tray band ← at 360 px the line never wraps or overflows, suffix always fully shown, word cut with "…" only if it cannot fit (owner, 2026-10-15)

Next: ticket 6.9 (How to play panel). Rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-game-surfaces-and-keyboard`.
