# Epic end-of-game-words: handoff (ticket 10.6, stopped for your input)

**What happened.** Ticket 10.6 (skipping the win celebration) is built. The build picked up where the usage limit stopped it. The code review then ran 4 passes and fixed 6 important and 15 small issues. The final full test run has not happened yet. The review raised two questions that are yours to answer.

**Question 1: a quick second tap after skipping.** When you tap to skip the celebration, the end sheet opens right under your finger. Only that first tap is ignored. If you double-tap out of impatience, the second tap can land on "Replay this deal" or "New game" and trigger it.
- *Proposed:* for 0.3 s after the skipping tap, ignore any new tap (the same guard the winning move already uses).
- *Effect:* an accidental double-tap can't throw away the finished game. A deliberate tap on the end sheet within 0.3 s of skipping does nothing.
- This is not built yet. A "yes" means a small code change before the final tests.

**Question 2: two changes where the review followed the spec over the architecture doc.**
1. Whether a tap counts as "on a bar" is now judged by where the finger lands, not by which button the browser snaps the touch to. A touch just beside Undo, Menu, Redo or New game now skips the celebration instead of pressing that button.
2. Shift/Ctrl/Alt+Space, or a held-down Space, never presses a focused button while the celebration plays.
- *Proposed:* keep both. Ticket 10.9 updates the architecture doc (AD-19 Skip) to match.

**To resume.** Record your answers in the ticket Notes, epic Notes and SPEC memlog. If question 1 is "yes", add the 0.3 s guard and its test, then commit. Then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. The next session runs the full tests and screenshots (Step D). The ticket then stays `built` for your Android read of a real win (done checkpoint), not `done`.

**Close-out docs (pending your answers; 10.9 syncs them):**
- ARCHITECTURE-SPINE.md AD-19 Skip ← how presses are judged on bars, Space chords and repeats, the post-run tails, passing everything while halted
- docs/game-flow-spec.md R-87 ← the dictionary banner is exempt from skipping, as well as the two bars
- From 10.5 (already decided, F16, 2026-10-23): AD-19 Start; EXPERIENCE.md "Never plays"

**Still true:** pressing ☰ or M during a celebration halts the app until ticket 10.7, so don't merge the branch before 10.7.

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`
