outcome: stopped
ticket: 4.6
reason: rule 1 — code review decision-needed (desktop scrollbar strip outside the gesture area)
next: 4.7
updated: 2026-10-02T18:37:56Z
summary: Ticket 4.6 is built and code-reviewed, but one desktop behaviour needs your yes or no before it can be marked done.

# Epic board-and-gestures — handoff

Ticket 4.6 (the code that turns every press on the board into a tap, long press or drag, and the "cancel the press first" hook) is built and its code review has finished. The earlier session paused at a usage limit; this one resumed and completed the review.

## Your decision

On desktop, the area that listens for presses stops about 15 px short of the right edge, where the browser keeps a strip for the scrollbar. The ticket said to stop and ask if that happened.

What it means for a player: if they press the mouse on the board background, an empty part of a column or a column's foot pad, then drag off and let go over that thin right-edge strip, the game thinks the button is still held. Nothing visibly breaks; the next click clears it. Until then, a pending layout update (for example after resizing the window) waits. The top bar, banner and action bar are not affected, and phones are not affected.

- **Accept it (proposed):** keep things as built. The rare stuck press clears on the next click.
- **Fix it:** listen for presses outside the board area too, so the strip is covered. That goes against what the ticket asked (no listeners outside the gesture area) and adds work to this ticket.

## Also worth knowing

- One open review item carries forward: the tests do not yet check which part of the board a press is aimed at. Proposed: add a couple of checks now and let ticket 4.7's tap tests cover it fully.
- Five small review suggestions are listed in `_bmad-output/implementation-artifacts/review-loop/4-6-build.md` (Result section).
- Close-out docs: none.

## Resume

Tell me your answer; I record it in the ticket notes and commit. Then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-board-and-gestures`: the next session runs the full test suite and marks 4.6 done, then moves to 4.7.
