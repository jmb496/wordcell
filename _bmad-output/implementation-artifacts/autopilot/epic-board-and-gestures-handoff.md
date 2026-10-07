outcome: done
ticket: 4.12
reason: done
next: 4.13
updated: 2026-10-07T20:42:52Z
summary: Ticket 4.12 (Desktop hover peek) passed every test and is marked done.

# Epic board-and-gestures — handoff

Ticket 4.12 is done. On a desktop with a mouse, resting the pointer on a filled WordCell for a moment shows its cards in a small panel just above the WordCell row. Clicks pass straight through the panel, and it closes when the mouse leaves or you start pressing or dragging. Nothing needed your input. This session resumed the ticket review after the earlier session hit the usage limit.

## Worth knowing
- The first full test run hit the known flaky "banner during a scroll" layout test again (it passed 5 of 5 when run alone, and the second full run was all green). Fixing that flake belongs in the refactor sweep, ticket 4.13.
- The plan's text about who watches the mouse/hover setting is out of date after a review fix. The code is correct; the plan wording is left for 4.13, along with six small review leftovers in `review-loop/4-12-build.md`.
- Screenshot tests still not run (Docker unreachable from WSL). No change is expected, but run them, or let CI do it, before the epic merges.

## Close-out docs
- None from owner decisions. The build notes carry two technical-default DESIGN.md wording edits (hover peek width and surface, and its below-the-row placement in dev band orders) for the epic close-out.

## Resume
Next is 4.13 Refactor sweep, the epic's last ticket. Run `.claude/skills/epic-autopilot/scripts/loop.sh epic-board-and-gestures`.
