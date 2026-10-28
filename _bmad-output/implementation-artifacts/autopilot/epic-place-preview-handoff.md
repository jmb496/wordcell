# Epic 11 (place preview) autopilot handoff

Last session: ticket 11.2 "WordCell row place preview" — stopped before the build, for one question.

- The ticket review finished (5 passes, no open problems), but it raised one look-and-feel question only you can answer.
- **The question:** on the smallest phones (360 px wide), when a WordCell will hold 10 or more cards after the word, its two-digit card count (bottom-right corner) may touch or slightly cover the new ★ preview mark (bottom-left corner). The design doc puts both in their corners but doesn't say what happens if they meet.
  - **Proposed default:** leave both marks in their corners; where they meet, the count sits on top of the star. You judge it on your phone at the close-out device read (ticket 11.5). The build also measures it at 360 px and stops to tell you if they actually overlap, rather than moving anything on its own.
  - **Effect on the game:** only on small phones, only during Place on a cell reaching 10+ cards, the star may be partly hidden by the count. Everywhere else nothing changes.
  - Alternatives you could choose instead: move the ★ elsewhere (e.g. top-left) in that case, shrink the badge, or hide the ★ when the count is two digits.
- Nothing was built; tests were not run.

Close-out docs so far: none (your answer may add a DESIGN.md Components → WordCell line).

To resume: tell the session your answer (or "take the default"); it records it in the ticket and epic notes, commits, and reruns `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`. The next session starts at the build.

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md`
