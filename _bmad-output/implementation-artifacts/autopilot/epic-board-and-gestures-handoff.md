outcome: done
ticket: 4.7
reason: done
next: 4.8
updated: 2026-10-02T20:17:09Z
summary: Ticket 4.7 (tap to pick up and drop cards) is built, reviewed, fully tested and marked done.

# Epic board-and-gestures — handoff

Ticket 4.7 is done. You can now tap a card to pick up it and the cards below it, then tap another column or its "Here" pad to drop them there. Tapping the same column puts them back, and tapping elsewhere lets go. Your F31 answer is built in: on desktop, after tapping a whole column, hovering that column lights its Here pad.

- Ticket review: 5 rounds, then your one decision.
- Build: one commit (45e9fb8).
- Code review: 2 rounds, which added 5 test and plan fixes.
- Tests: all suites pass. The first full run hit a known flaky layout test (the "banner during a scroll" test from 4.5). It is unrelated to this ticket and passed on the rerun.

## Worth knowing

- When ticket 4.11 adds the WordCell view, it must make sure Undo, Redo, Reload and taps don't crash when that view is open on top of a selected stack. That can't happen today.
- The flaky layout test is worth fixing in the refactor sweep (4.13).

## Close-out docs (applied at the retrospective)

- DESIGN.md § Column slot / drop-target highlight ← F31: desktop whole-column self-drop hover lights the Here pad (owner, 2026-10-02).
- SPEC.md (spec-epic-4-board) build-notes CAP-6 ← hover highlight classes sit on the column, not the cards (wording).
- From 4.6: SPEC.md (spec-epic-4-board) § F30 / F25 "spanning the viewport" ← the controller root leaves out the desktop scrollbar strip (owner, 2026-10-02).

## Resume

Nothing to decide. The driver continues with ticket 4.8 (drag, overlap targeting and drop into Composing).
