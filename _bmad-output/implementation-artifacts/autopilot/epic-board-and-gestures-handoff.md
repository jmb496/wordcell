outcome: stopped
ticket: 4.2
reason: 1 — ticket review diverged with a late major that is spec intent (bar heights vs safe-area padding)
next: 4.2
updated: 2026-10-02T03:11:22Z
summary: Ticket 4.2's review stopped on one design question about how the top and action bars fit around a phone's notch and gesture bar.

# Epic board-and-gestures — handoff

## What happened
Ticket 4.2 (the first real board on screen, with top bar, banner and action bar) went through six review passes after the usage limit reset. The reviewers kept finding problems in the same spot and could not settle it, because the spec notes leave one thing open, and that spec text is yours to decide.

## The question
On phones with a notch or a gesture bar, how do the top bar and the bottom action bar make room for it?

- **Option A (proposed):** the bars keep their full size (top bar 44 px, action bar 60 px of buttons) and the extra room for the notch or gesture bar is added on top of that. Buttons stay full-size and easy to hit everywhere; on those phones the columns get a few pixels less height. This ticket would add that padding now; ticket 4.4 later makes the layout's own numbers match it.
- **Option B:** the bars keep a fixed total height and the notch/gesture room is taken out of it. Columns keep their room, but on those phones the bar buttons get shorter than 44/60 px, below the usual touch-target size.

Proposed wording for `build-notes.md` CAP-1: "The top and action bars are content-sized: 44 px and 60 px of content plus `env(safe-area-inset-*)` padding, which entry 2 ships; every other band but the banner takes its height from `bands()`. Once entry 4 feeds real insets, `bands()` bar heights equal the rendered bars."

## Also open (technical, defaults will be applied)
- The board's root element must span the whole screen width, side margins included (the spec's F25 needs it for gestures); a late edit had dropped that.
- The board's minimum height should use `100dvh`, not `100vh`, so the page doesn't scroll in the Android browser while its address bar shows.

## How to resume
Answer the question (A or B). Then record it in `build-notes.md` CAP-1 (or the ticket's Notes), apply the three open items above to the ticket, commit, and rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-board-and-gestures`. The next session goes straight to building 4.2.

## Close-out docs
- `_bmad-output/specs/spec-epic-4-board/build-notes.md` CAP-1 / CAP-3 ← bar sizing and safe-area padding (waiting for your answer, 2026-10-01)

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-board-and-gestures-20261001-1955.md`. Ticket review log: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-board-render-in-idle-and-game-over-with-bars.review-log.md`.
