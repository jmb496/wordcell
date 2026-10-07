outcome: stopped
ticket: 4.13
reason: 1 — ticket review needs an owner decision (D7: drops onto columns hidden under the bars)
next: 4.13
updated: 2026-10-07T22:22:19Z
summary: Ticket 4.13 (Refactor sweep) is hardened but needs one gameplay answer before it can be built.

# Epic board-and-gestures — handoff

The last ticket of the epic, 4.13 (Refactor sweep), went through 7 rounds of review and now has a complete list of the leftover clean-up items. One of them changes how the game plays, so it needs your answer before the build:

**Dragging over the top or bottom bars.** When you have scrolled the board so some columns are partly hidden under the sticky top bar (or the dictionary banner, or the bottom action bar), dragging cards over that bar can highlight a column you cannot see, and letting go drops the cards there.

- **Fix it now (proposed).** Only the visible part of a column counts as a drop target. Letting go over a bar sends the cards back where they came from, which matches the design rule "what the player sees is what happens". It goes against the wording of architecture rule AD-12 ("whole hit rect"), so that wording would be updated at the retrospective.
- **Leave it for v1.** No change now. The odd drop stays possible, and it gets noted at the retrospective.

How to resume: put your answer in row D7 of `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-refactor-sweep.md` (replace "Owner decision pending"), commit, and rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-board-and-gestures`. It goes straight to the build.

Close-out docs so far: none from owner decisions. If you choose the fix, ARCHITECTURE-SPINE.md AD-12 (drop targeting by "whole hit rect") changes at the retrospective. The 4.12 build notes also list two DESIGN.md wording edits made by technical default (hover peek width and its below-the-row placement in the dev band-order mode).

## Resolved
Owner, 2026-10-07: D7 fix now (SPEC F34); D7 cell updated, AD-12 close-out note in build-notes.md. Rerun the driver: it goes to the build.
