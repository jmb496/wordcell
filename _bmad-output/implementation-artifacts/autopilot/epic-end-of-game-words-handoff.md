# Epic end-of-game-words: handoff (ticket 10.10 stopped, your input needed)

**What happened.** The review of ticket 10.10 (refactor sweep, the epic's last ticket) picked up after the usage limit and finished: 5 passes, converged. Nothing has been built yet. The review raised three questions about how the win celebration behaves in rare cases. The sweep is cleanup only, so it will not change any of them, but you need to decide each one so it gets recorded (and, if you want a change, a follow-up ticket).

**Your three questions**

1. **Second finger after a skip.** If you tap to skip the celebration while a second finger is already on the screen, that second finger can hit Replay or New game on the end sheet that just opened. *Proposed: leave it as is.* Effect: a rare two-finger accident can start a new game or a replay. The other choice is that the end sheet ignores that finger.
2. **Very short window.** On a window shorter than the top and bottom bars plus one card, the celebration plays as about 6 seconds of nothing before the end sheet appears. *Proposed: skip the celebration there and open the end sheet at once, as reduced motion does.* Effect: on such a window you see your results right away instead of waiting. This is new behaviour, so it would be a follow-up ticket, not part of the sweep.
3. **Very slow device.** Below 20 frames per second, a Normal-speed celebration lasts longer than the 6 seconds the design promises. *Proposed: keep it as is and add a note about slow devices to the design docs (EXPERIENCE.md Motion, AD-19).* Your phone reads found the frame rate good. Effect: on a very slow device the celebration runs past 6 seconds. The other choice is to cap it in real time, which would cut it short there.

**To resume.** Answer the three (e.g. "defaults"), have the answers recorded in the ticket's Scope 9, the epic Notes and the spec memlog, commit, then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words` (add `LIMIT_CHECK=off` if VS Code is closed). The next session starts the build.

**Close-out docs so far:** see the 10.5–10.9 entries of the digest (`_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`). If you accept default 3, add: EXPERIENCE.md § Motion and ARCHITECTURE-SPINE.md AD-19 ← a note that the 6 s cap is simulated time and runs longer below 20 fps.
