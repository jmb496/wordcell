outcome: stopped
ticket: 10.6
reason: rule 1, decision needed
next: 10.6 (Celebration skip), at Step B (build) once you answer

Plain language: ticket 10.6 adds the ways to skip the win celebration: a tap on the board, Space or Esc on desktop, or the Android back gesture. Its ticket review finished cleanly in 5 passes. One question needs your answer before the build starts.

The question: on desktop, after you confirm the winning word with a click or Enter, keyboard focus stays on the action bar's main button, which now reads "New game". The architecture says Space and Esc skip "unless a bar control has focus". In that usual case, then, Space would start a new game (you would never see the end sheet) and Esc would do nothing. The game rules (R-87) and EXPERIENCE.md just say Space and Esc skip, with no exception.

- Proposed default: Space and Esc always skip while the celebration plays, whatever has focus. Effect: a desktop player can always press Space or Esc to jump to the end sheet. For those few seconds, Space no longer presses a focused Undo or New game button. Clicks and the Z, N and M keys still work. The exception is removed from the architecture doc at 10.9's doc sync.
- Alternative: keep the exception as the architecture states it. Effect: right after a win by click or Enter, Space starts a new game and Esc does nothing, so on desktop only a tap on the board skips.

After the build: the ticket has an owner check at gate 4 (your Android read of a real win with the long-word fixture settles the copy cost, the starting bounce constants and A-D12). Once it is built and verified, it stops as `built` and waits for you instead of being marked done.

Close-out docs (applied at the retro or by 10.9):
- ARCHITECTURE-SPINE.md AD-19 Skip ← pending your answer above
- ARCHITECTURE-SPINE.md AD-19 Rule, Start bullet ← F16 (owner, 2026-10-23), from 10.5
- EXPERIENCE.md celebration "Never plays" ← F16 (owner, 2026-10-23), from 10.5
- EXPERIENCE.md § Keyboard ← F15 (owner, 2026-10-23), from 10.4

Digest: _bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md
Resume: record your answer (ticket Notes, epic Notes, SPEC memlog), commit, then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. The next session starts the build.
