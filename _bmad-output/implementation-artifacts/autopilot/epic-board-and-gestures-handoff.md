outcome: stopped
ticket: 4.7
reason: 1 — ticket review needs an owner decision (desktop drop-target highlight on a whole-column self-drop)
next: 4.7
updated: 2026-10-02T19:16:34Z
summary: Ticket 4.7's review finished cleanly but asks one desktop-only look question before the build starts.

# Epic board-and-gestures — handoff

Ticket 4.7 (tap to select a stack, tap to drop it) was reviewed in 5 rounds and is ready to build, except for one question only you can answer.

## Your decision

On desktop, if you tap a column's top card (so the whole column is selected) and then point the mouse at that same column's empty space or its "Here" pad, something should light up to show "drop here puts it back". The design only says what lights up while *dragging* a whole column (the empty placeholder) or a partial stack (the lowest card left behind). It doesn't cover this tap-then-hover case.

- **Proposed:** the Here pad lights up with the usual teal outline and wash.
- **Effect:** desktop only, purely what you see while hovering. It doesn't change rules, scoring or touch behaviour.

## Worth knowing

- The review flagged that the "Here" label must show on phones as well as desktop. As written, the ticket could let it be built desktop-only. The build will be told to state this and test it on android.

## Close-out docs

- DESIGN.md § Column slot / drop-target highlight ← your answer to the question above, once given.
- From 4.6: SPEC.md (spec-epic-4-board) § F30 / F25 "spanning the viewport" ← the controller root leaves out the desktop scrollbar strip (owner, 2026-10-02).

## Resume

Record your answer in the ticket's Notes, commit, then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-board-and-gestures`. The next session goes straight to the build.
