outcome: done
ticket: 4.9
reason: done
next: 4.10
updated: 2026-10-05T14:21:37Z
summary: Ticket 4.9 (dragging when interrupted, with your selected-card lift fix) passed every test and is marked done.

# Epic board-and-gestures — handoff

Ticket 4.9 is done. Dragging copes with interruptions, and, following your answer, a selected card keeps its lift while you drag it, so nothing jumps at pickup or snaps after a cancelled drag. The full test run passed first time.

## Worth knowing

- One new drag-cancel test may be flaky on a busy machine; the fix is written down in `review-loop/4-9-f32.md` and goes to the refactor sweep (4.13), along with the unit-test speed (about 5.3 s against a 5 s budget).

## Close-out docs (applied at the retrospective)

- ARCHITECTURE-SPINE.md § AD-12 drag transform / fly-back (and AD-11 naming `SELECTION_LIFT_PX`) ← F32/F33 (owner, 2026-10-05)
- DESIGN.md § selection lift ← F32: the lift stays during a drag (owner, 2026-10-05)
- Earlier tickets' entries are in the digest (`_bmad-output/implementation-artifacts/autopilot/epic-board-and-gestures-20261001-1955.md`).

## Resume

Next is 4.10 (Composing, Place and Game-over column behaviour). Rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-board-and-gestures` (it continues automatically when driven by the loop).
