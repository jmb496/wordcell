# Epic autopilot — epic-board-and-gestures — run 20261001-1955

- Epic: epic-board-and-gestures (Board and gestures)
- Branch: epic-4-board
- Start commit: a336272
- Mode: one-ticket sessions (driver `loop.sh`)
- Authorisation: owner-authorised autopilot (methodology § Autopilot, 2026-09-28); gates 3 and 4 delegated per the skill.

## 4.1 Layout definition and geometry — done
What it adds: the measuring rules for the new board, as plain code with no screen yet: the order of the screen bands (top bar, banner, columns, WordCell row, tray, spare space, action bar), how wide a card can be for a given phone or window, and how tall each band is, all pinned by tests against the numbers in the epic spec.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commits 457dfcc
Code review: thorough, 2 passes, converged; 1 fix applied (84e5008)
Tests: all passing
Ref to fix upstream: none
Tokens: 6.9M input-equivalent (ticket review 53%, code review 23%, build 19%, orchestrator 2%, other 2%); orchestrator peak context 59k
Worth knowing: the layout module exposes a few more helper functions than the architecture note for AD-11 describes ("two entry points"); the build recorded this for the retrospective to fold into AD-11. Ticket 4.4 (live layout) should allow sub-pixel tolerance on phones with fractional safe-area insets, and should pick up the helper names the 4.4 entry in tickets.toml does not mention yet. Five small extra test cases from the code review were left as optional minors in its log.
Close-out docs: none

## Stopped — 4.2 Board render in Idle and Game over with bars, Step A (owner question)
What it adds: the first real board on screen (columns, WordCells, top bar, banner and action bar) in the Idle and Game-over states.
Paused: usage limit at Step A pass 1 (reset 10:30pm America/New_York), resumed 2026-10-02T02:30Z.
Ticket review: 6 passes, diverging (majors 11, 8, 6, 3, 2, 3); stopped by rule 1 — one late major is spec intent.
Ref to fix upstream: bar heights vs safe-area padding → build-notes.md CAP-1 / CAP-3 (spec intent, owner question); board root extent → ticket Board paragraph (restore SPEC F25 "spans the viewport width"); root min-height unit → ticket Board paragraph (100dvh, never 100vh).
Tokens: 10.2M input-equivalent (ticket review 98%, other 1%, orchestrator 1%); orchestrator peak context 54k
Owner question: on phones with a notch or gesture bar, do the top bar and action bar keep their full 44 px / 60 px content height with the safe-area padding added outside it (proposed), or is the padding squeezed inside the band heights the layout computes?
Resume: record the answer in build-notes.md CAP-1 (or the ticket Notes), apply the three open majors in the ticket (the two ticket-wording ones take the proposed defaults), commit, and rerun the driver. The ticket review log already has its `## Result`, so the next session goes straight to the build.
Close-out docs: build-notes.md CAP-1 / CAP-3 ← bar box model and safe-area padding (pending owner answer, 2026-10-01)

## 4.2 Board render in Idle and Game over with bars — done
What it adds: the real game board on screen when no word is being built and at game over: the eight columns, the WordCell row with labels and card counts, the top bar, the dictionary banner and the action bar. On phones with a notch or gesture bar, the bars keep their full size and get extra padding (your Option A).
Ticket review: 6 passes, diverging; your answer on bar sizing (2026-10-02, Option A) settled the late major; the two wording fixes took their defaults (board spans the full width; min-height 100dvh)
Build: built; commits 55e6beb
Code review: thorough (ticket risk high), 1 pass, converged; 0 fixes applied (log 4-2-build.md)
Tests: all passing
Ref to fix upstream: build-notes CAP-1 / CAP-3 bar box model (now settled by the owner answer)
Paused: resumed 2026-10-02T06:25Z after the owner answer
Tokens: 4.1M input-equivalent (build 69%, code review 25%, orchestrator 3%, other 3%); orchestrator peak context 59k
Worth knowing: three small items moved on: the card-count badge at exactly 1 or 2 cards is untested (no saved game has such a WordCell; ticket 4.3 should script one); the banner's position under the top bar hard-codes the bar height, which ticket 4.4 (live layout) should derive or record as an exception; one ticket sentence sits under the wrong heading (wording only). Until 4.4, the board can be a few pixels taller than the screen on notched phones. Code review left minors only (e.g. a test labelled AD-17 where AD-3 fits better).
Close-out docs:
- build-notes.md CAP-1 / CAP-3 ← bars are content-sized, 44/60 px plus safe-area padding, bands() matches from entry 4 (owner, 2026-10-02; already written into build-notes CAP-1; check DESIGN.md bar section and spine AD-11 bands() wording agree at the retro)

## 4.3 Composing, Place and static tray rendering — done
What it adds: the board now draws the two in-move states too. While composing a word, the cards being used show as faint "ghosts" where they came from, the destination cards are styled and locked, and a simple (not yet interactive) tray shows the letters in order; while placing, the letter strip and the chosen WordCell's highlight ring show. A new saved game with an empty column was added for tests, plus screenshots of all four board states on phone and desktop.
Ticket review: 5 passes, converged; nothing needed your input
Build: built; commits 7ca5c5a
Code review: thorough (ticket risk medium), 1 pass, converged; 0 fixes applied
Tests: all passing
Ref to fix upstream: none
Tokens: 12.5M input-equivalent (ticket review 59%, build 29%, code review 8%, other 2%, orchestrator 2%); orchestrator peak context 62k
Worth knowing: the tray's compact mode (8 or more tiles in up to two rows) can't be reached by any saved game yet, so it is only unit-tested; ticket 4.7 (tap-drop) is the first that can reach it and should add a browser check. The "dropped a whole column on another column" placeholder case also waits for the drop tickets (4.7/4.8). The 1- and 2-card count badge from 4.2 is still untested, carried to the retrospective. Code review left minors only: a few highlight-ring and ghost-placement checks could be stricter, column and WordCell lists should be keyed like the tray before animations land, and a small badge overlap on a QU tile inside a tray block.
Close-out docs: none

## 4.4 Live layout, gate and touch-action regions — done
What it adds: the board now adapts live to the screen. It recomputes its size when the window or phone rotates, slots the dictionary banner into spare space without shifting the word row, and holds back layout changes while you are scrolling or touching (a "gate") so nothing jumps under your finger. It also marks which parts of the screen scroll and which are for card touches, and stops long-press text selection on cards. Tests gained a "hold a finger down and move" helper that the later drag tickets will use.
Ticket review: 6 passes, converged; nothing needed your input
Build: built; commits 0fffa6c
Code review: thorough (ticket risk high), 4 passes, converged; 9 fixes applied (tests and plan only, no game code changed); commits 8f61600, 6241c47, 2f8b783, 6af0dff
Tests: all passing
Ref to fix upstream: none
Tokens: 17.6M input-equivalent (ticket review 47%, code review 30%, build 20%, other 2%, orchestrator 1%); orchestrator peak context 61k
Worth knowing: the desktop screenshots shifted 7 px because of the new reserved scrollbar gutter (regenerated in the container; phone screenshots unchanged). One test needs the page hidden within 100 ms of a scroll (measured about 40 ms) and could be flaky on a slow machine. Left as known limits: on very narrow desktop windows (under 384 px) the height rule is unchecked; a safe-area change with no resize is only applied at the next resize. Small leftovers for the epic's close-out: build-notes.md CAP-3 says the insets probe is "absolutely positioned" but it is fixed; the touch-action test could add a narrow desktop case.
Close-out docs: none

## 4.5 Overlays store: tail selection, end-sheet and view states — done
What it adds: one place that keeps track of what is "open" on the board: a selected stack of cards, the end-of-game sheet (hidden, folded or expanded), and the WordCell peek, pinned view and desktop hover peek. It also makes the phone's Back button close these in the right order. Nothing new is visible yet; later gesture tickets will use it.
Ticket review: 4 passes (resumed after a usage limit at pass 2), converged; nothing needed your input
Build: built; commits c3c4415
Code review: thorough (ticket risk medium), 2 passes, converged; 1 fix applied (tests only); commits 459c6be, 3857dfa
Tests: all passing
Ref to fix upstream: none
Paused: usage limit at ticket review pass 2 (reset 8:30am America/New_York), resumed 2026-10-02 13:35 UTC
Tokens: 4.9M input-equivalent (ticket review 34%, code review 29%, build 28%, other 5%, orchestrator 3%); orchestrator peak context 58k
Worth knowing: one test gap left open for the refactor sweep (4.13): no test checks that opening a deferred end sheet is refused when a dialog sits above a pinned WordCell view (the code handles it; only the test is missing), plus a test name that mentions a hover peek it never opens. The build saw two existing "banner during a scroll" layout tests flake once each under full-suite load (they passed on rerun and in this run); recorded as deferred in the plan.
Close-out docs: none

## Stopped — owner decision at ticket 4.6 code review
## 4.6 Pointer controller core and cancel wiring — done
What it adds: the one piece of code that watches every finger or mouse press on the board and decides whether it is a tap, a long press or the start of a drag, plus the "cancel any press first" hook that Undo, Redo, the menu, keys, Back and hiding the app all call. Nothing new is visible yet; tap and drag tickets 4.7–4.9 build on it.
Ticket review: 6 passes, converged; nothing needed your input (one open item on clearing the long-press timer was resolved in the build plan)
Build: built; commits 9c25a0c
Code review: thorough (one medium item deferred in the plan), 2 passes, converged; pass 1 applied 6 fixes (c027aff); stopped once for your decision on the desktop scrollbar strip (F30: accepted as built, 2026-10-02, commit 74d59c2)
Tests: all passing (test:all, 2026-10-02)
Ref to fix upstream: none
Paused: usage limit at code review pass 2 (reset 1:30pm America/New_York), resumed 2026-10-02 18:32 UTC; owner decision stop, resumed 2026-10-02 18:41 UTC
Tokens: 1.0M input-equivalent in the review session (code review 87%, orchestrator 8%, other 5%), under 0.1M in the close-out session; orchestrator peak context 55k
Worth knowing: open major carried to ticket 4.7 / the refactor sweep (4.13): the controller tests never check which target (column, WordCell, other) a press resolves to, so a wrong lookup would pass; 4.7's tap tests should cover it. Five unapplied minors are listed in the review log's Result (e.g. a missed release leaving a card peek open). On desktop, a mouse press released over the thin right-edge scrollbar strip stays "held" until the next click (your F30 decision).
Close-out docs: SPEC.md (spec-epic-4-board) § open questions F30 and F25 "spanning the viewport" ← the controller root excludes the desktop scrollbar gutter (owner, 2026-10-02; already recorded in the spec's F30 row, F25 wording may want the same note)

## Stopped — owner decision at ticket 4.7 ticket review
Ticket 4.7 (Tap-select, foot pads and tap-drop) was pulled (cfe9343) and its ticket review ran 5 passes and converged (majors 7, 9, 6, 1, 1; WIP commits up to 6532cef), but it raised one question for you, so the build has not started.
Question: on desktop, with a whole column selected by tapping its top card, which element lights up as the drop target when you point at that same column's empty space or its Here pad? Proposed: the Here pad gets the teal drop-target outline and wash. Desktop only; no rule, score or touch change.
Open item for the build: the "Here" label must show on phones too, not only on desktop (the review recorded it as an open major; the build should state it and test it on android).
Tokens: 6.4M input-equivalent (ticket review 97%, orchestrator 1%, other 1%); orchestrator peak context 52k
Resume: record the answer in the ticket (Notes), commit, rerun `loop.sh epic-board-and-gestures`; the next session starts at the build (Step B).

## 4.7 Tap-select, foot pads and tap-drop — done
What it adds: the first playable touch gestures. Tap a card to pick up it and the cards below it (they lift and get an outline), then tap another column or its "Here" pad at the foot to drop them there. Tapping the same column again puts them back, and tapping elsewhere lets go. On desktop, hovering a column while holding a selection lights up where the cards would land.
Ticket review: 5 passes, converged; stopped once for your decision F31 (desktop: tapping a whole column then hovering it lights the Here pad, 2026-10-02, commit 7766b23); the open item "Here must show on phones too" went to the build
Build: built; commits 45e9fb8
Code review: thorough (ticket risk medium), 2 passes, converged; 5 fixes applied (tests and one plan note); commits 8bf3dac, 9f469de
Tests: all passing (test:all, 2026-10-02, second run; the first run hit the known "banner during a scroll after a hide" android layout flake also seen in 4.5, in code this ticket does not touch)
Ref to fix upstream: none
Paused: owner decision stop at ticket review, resumed 2026-10-02 19:18 UTC
Tokens: 7.5M input-equivalent (build 54%, code review 42%, orchestrator 2%, other 1%); orchestrator peak context 57k
Worth knowing: Undo, Redo, Reload and column or WordCell taps would crash if a WordCell view were open on top of a selection. That can't happen yet, but ticket 4.11 (which adds the view) must handle it. On desktop, a hover highlight may stay on the wrong column if the layout shifts while the mouse is still (cosmetic, unconfirmed). The "banner during a scroll" layout test flaked again under full-suite load and is worth fixing in the refactor sweep (4.13). Two small unapplied review notes are in the review log (a keyboard-click path that ignores tiles, which can't happen today, and a stacking check).
Close-out docs:
- DESIGN.md § Column slot / drop-target highlight ← F31: on desktop, with a whole column tap-selected, hovering its empty space or Here pad lights the Here pad with the teal outline and wash (owner, 2026-10-02)
- SPEC.md (spec-epic-4-board) build-notes CAP-6 "hover classes on cards" ← the build puts them on the column (`[data-column]`), a wording update (technical, from code review)

## Stopped — usage limit

Ticket 4.8, Step B (build), 2026-10-02 17:21 EDT: "You've hit your session limit · resets 7pm (America/New_York)". The build's own files are left uncommitted in the tree for bmad-build-auto's resume (plan `story-drag-overlap-targeting-and-drop-into-composing-plan.md` at `in-review`; `src/ui/gestures/{targeting,drop-target}.ts` with tests, `e2e/drag.spec.ts`, edits to `controller.ts`, `controller.test.ts`, `Column.svelte`, `motion.ts`). Resume: rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-board-and-gestures`; Setup 2's exception resumes Step B.

## 4.8 Drag, overlap targeting and drop into Composing — done
What it adds: you can now drag cards with your finger (or mouse). Hold a card and the cards below it, move them over another column and it lights up; let go and the word starts there. Let go anywhere else (or over the column you started from without leaving it) and the cards fly back to where they were.
Ticket review: 5 passes, converged; nothing needed your input. One open item and eleven small notes went to the build, which handled them in its plan.
Build: built (resumed after the usage limit, from its review stage); commits 6a9b473
Code review: thorough (ticket risk high), 3 passes, converged; 5 major fixes and 6 technical defaults applied (tests and controller fixes); commits f68221b, 65f189b, 712dba1
Tests: all passing (test:all, 2026-10-02, first run); the build also ran the screenshot suite in the container: 8/8, pictures unchanged
Ref to fix upstream: none
Paused: usage limit at Step B, reset 7pm (America/New_York), resumed 2026-10-02 23:19 UTC
Tokens: 6.4M input-equivalent (code review 77%, build 19%, orchestrator 3%, other 2%); orchestrator peak context 55k
Worth knowing: three small review notes were left unapplied, logged in `review-loop/4-8-build.md`: (1) when the board is scrolled under the sticky top bar, dragging cards over the bar could light the column hidden beneath it — worth deciding in the refactor sweep (4.13) whether to clip that; (2) a plan sentence about a cancelled fly-back is out of date; (3) one tie-break unit test could be sharper. The known "banner during a scroll" layout flake hit the build's first full run again (not this session's), so it is still worth fixing in 4.13.
Close-out docs: none

## 4.9 Drag interruptions: selection replacement, hide, back and cancel-first — stopped
What it adds: dragging keeps working when you're interrupted. If you drag while some cards are already selected, the drag takes over cleanly and the old selection is dropped. If the drag is cut short (the app goes to the background, you press back, or the system cancels the touch), the cards fly back and your earlier selection comes back too. Pressing Undo in the middle of a drag first puts the dragged cards back, then undoes.
Ticket review: 4 passes, converged; nothing needed your input. One open item (check that the old selection's outline and "Here" marker hide during the drag and return after a cancel) and nine small notes went to the build.
Build: built; commits 8ce0a98
Code review: thorough (ticket risk high), 2 passes, converged; 1 major fix applied; commits 6b9bfed. One decision for you (below).
Tests: not run yet by the autopilot (the code review's own unit tests, lint and type check pass); `test:all` runs when the ticket resumes at Step D
Ref to fix upstream: none
Tokens: 9.8M input-equivalent (ticket review 39%, build 32%, code review 25%, orchestrator 2%, other 1%); orchestrator peak context 58k
Worth knowing: the unit suite takes about 5.3 s, a little over its 5 s budget (not caused by this ticket; left for the refactor sweep 4.13). The "banner during a scroll" layout test flaked once more during the build. Three small unapplied test notes are in `review-loop/4-9-build.md`.
Close-out docs: none yet (depends on your answer below)

## Stopped — owner decision at ticket 4.9 code review

Stop rule 1. The code review asks: when you drag a card that is already lifted because it is selected, should it keep its lift while dragged? Today it drops 8 px when the drag starts, and if the drag is cancelled it flies back 8 px too low and then snaps up. Proposed default: keep the current behaviour for v1 and revisit in a polish ticket. The ticket is `built`; the code review log has its `## Result`, so a resume goes straight to Step D (test:all, mark done).

## 4.9 Drag interruptions: selection replacement, hide, back and cancel-first — done
What it adds: dragging copes with interruptions (selection replaced by a drag, cancelled drags fly home and restore the earlier selection, Undo mid-drag puts the cards back first). After your F32/F33 answers, a dragged card that was already selected keeps its lift: no jump at pickup, no snap after a cancelled drag.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commits 8ce0a98; F32 fix de3b04a (built in an interactive session after your answer)
Code review: thorough, 2 passes, converged (1 fix, 6b9bfed); then a separate F32 review, 3 passes, converged (7548c60, 6d09434, log `review-loop/4-9-f32.md`)
Tests: all passing (test:all, 2026-10-05, first run)
Ref to fix upstream: none
Paused: owner decision stop at code review (F32), resolved 2026-10-05 with F32/F33; resumed at Step D 2026-10-05 14:17 UTC
Tokens: 0.1M input-equivalent in the close-out session (other 69%, orchestrator 31%); orchestrator peak context 50k
Worth knowing: the F32 review left one open item for the refactor sweep (4.13): a new drag-cancel test in `drag-interruptions.spec.ts` (bigger stack from above the selection) may flake on a loaded machine; the fix is in the review log. Four small unapplied notes are listed there too (a reduced-motion variant of that test, a comment reflow, two stale plan/ticket wording notes). Unit suite still about 5.3 s, over its 5 s budget (4.13).
Close-out docs:
- ARCHITECTURE-SPINE.md § AD-12 drag transform and fly-back target (and AD-11 naming `SELECTION_LIFT_PX`) ← F32/F33: a dragged stack inside a tap selection keeps the 8 px lift for the whole drag and its fly-back; a restoring fly-back returns lift, outline and `Here` at its start (owner, 2026-10-05; recorded in spec-epic-4-board build-notes.md)
- DESIGN.md § selection lift ← F32: the lift persists while a selected card is dragged (owner, 2026-10-05)

## 4.10 Composing, Place and Game-over column behaviour — done
What it adds: while you are composing a word, tapping a card in the destination column changes how many of its cards are used (and pressing one and dragging works as a tap, without moving it); every other column, and the faint "ghost" copies, ignore taps and drags. While placing a word or after the game ends, columns ignore taps and drags entirely. On desktop, hovering a destination card outlines the cards a click would use.
Ticket review: 5 passes, diverging (majors 7, 6, 6, 2, 3); nothing needed your input. Three late test-wording slips were handed to the build, which resolved them in its plan.
Build: built; commits ad02f2e
Code review: thorough (risk medium), 3 passes, converged (majors 1, 1, 0); fixes in b847e65, 6442caf
Tests: all passing (test:all, 2026-10-05, second run; the first run hit the known "banner during a scroll" android layout flake, 150.3 ms against a 150 ms limit, in code this ticket does not touch)
Ref to fix upstream: ticket test steps on how k changes after a tap (which card is the new top of the destination) → the ticket's own Acceptance Criteria, R-31; hover during a press that crosses the drag threshold without picking anything up → build-notes.md CAP-8 (the build added one bullet there, as the review log recommended)
Tokens: 11.4M input-equivalent (ticket review 40%, code review 29%, build 27%, orchestrator 3%, other 2%); orchestrator peak context 72k
Worth knowing: the screenshot suite (`npm run test:screens`) was not run: Docker is not reachable from this WSL distro (Docker Desktop's WSL integration looks off). The code review left that as its one open item, because the change touches the hover outline's height in Column.svelte; hover is not in the screenshots, so no picture change is expected, but run `npm run test:screens` (or let CI) before the epic merges. The "banner during a scroll" layout flake hit again (it is now in roughly every other full run) and should be fixed in the refactor sweep (4.13).
Close-out docs: none

## 4.11 WordCell peek and sticky view — done
What it adds: you can now see every card in any WordCell at any time. Press and hold a filled WordCell to peek at its cards; they close when you let go, unless the list is too long to fit, in which case it stays open so you can scroll. In Idle with nothing selected, or after the game ends, a tap on a filled WordCell opens the same list as a view that stays open, titled "WordCell n · m cards". Tapping outside it or pressing back closes it, and that closing tap never reaches the button underneath (e.g. Undo). Looking never changes the game, its saved state or the undo history. Tests also gained a new saved game: a game given up after one word.
Ticket review: 5 passes, converged (majors 7, 7, 3, 1, 0); nothing needed your input
Build: built; commits f97c288
Code review: thorough (risk high), 4 passes, converged (majors 1, 3, 1, 1); fixes in 3ca10ad, 048cc7d, 041af96
Tests: all passing (test:all, 2026-10-07, first run; unit 1988, e2e 349, pwa 12, dist 14)
Ref to fix upstream: none
Tokens: 17.7M input-equivalent (ticket review 42%, code review 30%, build 25%, orchestrator 1%, other 1%); orchestrator peak context 61k
Worth knowing: the screenshot suite (`npm run test:screens`) was not run again (Docker still unreachable from WSL). The board now sits in a new wrapper element, but the closed view draws nothing and the wrapper has no layout of its own, so no picture change is expected; run it (or let CI) before the epic merges. The code review's one open item, recording the final full test run in the plan, was already done by the build. Four small leftovers for the refactor sweep (4.13) or the device pass in epic 7: a long still press on the view's background may close or keep it depending on the browser; on desktop the mouse wheel over the view's background scrolls the board behind it; on screens narrower than about 320 px the view is wider than the screen and its edge cards are cut off; and the test that peeks while a tail is selected should carry the R-65/Q-21 ids and check that nothing changed.
Close-out docs: none
