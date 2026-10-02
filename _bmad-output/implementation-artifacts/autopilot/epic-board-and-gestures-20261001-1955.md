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
