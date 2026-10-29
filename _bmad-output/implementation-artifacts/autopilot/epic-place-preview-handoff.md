# Epic 11 (place preview) autopilot handoff

Last session: ticket 11.4 "How to play Place scene preview" **stopped for your answer** before the build.

What happened: the previous session ran out of the 5-hour usage allowance in the middle of this ticket's review. This session picked it up where it stopped; the review finished cleanly (4 passes, nothing major left) but raised one question that is yours to decide.

**Question:** in the real game, the WordCell you are about to place onto shows a small number badge (for example "6", how many cards it will hold after Confirm). The How to play scenes never draw these badges. Should the How to play Place scene show the "6" badge on that WordCell too?

- **No badge (proposed):** the scene shows the new top letter with the ★ but not the number. Every How to play frame stays badge-free; the scene differs from the real game only by the missing number.
- **Show the badge:** the scene matches the game more closely, but it becomes the only How to play frame with a badge.

To continue: write your answer in the ticket's Notes (`_bmad-output/initiative-wordcell-v1/epic-place-preview/story-how-to-play-place-scene-preview.md`) and the epic Notes, commit, then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`. The next session goes straight to the build.

Close-out docs so far (applied at the retrospective, not now):
- DESIGN.md § Components → WordCell (place preview) ← the count badge draws above the ★ pill where they meet at 360 px (owner, 2026-10-28)
- DESIGN.md § Components → WordCell (fly-to-cell hold with the previewed top) ← landed cards stack over the previewed-top copy (no ★) until the last landing, epic 5 F28 kept (owner, 2026-10-28), if its wording does not already say so
- ARCHITECTURE-SPINE.md AD-14 mirror list ← the hold's previewed-top copy replaces the R-52 used mirror (follows from the same decision; wording in the 11.3 plan's Design Notes, left to ticket 11.5)

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md`
