# Epic autopilot run 20261008-1002

- Epic: epic-tray-and-place
- Branch: epic-5-tray
- Start commit: 441a17c
- Authorisation: owner-authorised autopilot mode (docs/development-methodology.md § Autopilot, 2026-09-28); one-ticket sessions via loop.sh.


## Stopped — usage limit

Ticket 5.1, step A (ticket review loop, pass 2 reviewers running) at 10:13 EDT 2026-10-08; session limit reset 13:00 EDT. Uncommitted: the 5.1 review log state line (`pass 2: review`), committed with this note; the next session resumes the loop from it.

## 5.1 Draft wordCards and the Composing tray — done
What it adds: the tray now shows the word being built (uppercase, with the destination letters underlined in blue and shrinking to fit), the letter tiles in order with the destination block outlined and free letters tagged with the cell they came from, the letter count, and the "isn't in the word list" line after a failed Validate. The tray is empty when no word is being composed.
Ticket review: 6 passes, converged (resumed after the 10:13 usage limit); nothing needed your input
Build: built; commits 443cbe5
Code review: thorough, 4 passes, converged; fixes in 7a60eac, fa37c25, 2cd48be
Tests: all passing (test:all; the build also ran test:screens green, regenerating the two Composing baselines)
Ref to fix upstream: none
Paused: usage limit at step A, reset 13:00 EDT, resumed at 13:02 EDT
Tokens: 14.3M input-equivalent (ticket review 42%, code review 34%, build 20%, other 2%, orchestrator 1%); orchestrator peak context 65k
Worth knowing: one small open item for the refactor sweep (5.14): the word line fits against a width rounded up to a whole pixel, so a word can occasionally be shortened with "…" at a size that should just fit (fix: measure the fractional width). The code review also left four minor polish items (review log 5-1-build.md, Pass 4).
Close-out docs: none

## Stopped — usage limit

Ticket 5.2, step B (build, plan in-progress) at 15:52 EDT 2026-10-08; session limit reset 18:00 EDT. Uncommitted (the build's own): e2e/board.screens.spec.ts, e2e/tray.spec.ts, src/architecture-ad2-ad12-ad17.test.ts, src/engine/serialize.test.ts, src/ui/Card.svelte, src/ui/Tray.svelte, src/ui/text.test.ts, src/ui/text.ts, src/ui/tray/ControlRow.svelte, src/ui/tray/TileRows.svelte, fixtures/session-place-compact.json, the 5.2 plan.

## 5.2 Place strip, compact tray and session-place-compact — done
What it adds: when you place a word, the tray now shows the word in reading order, the letters in placing order with "bottom" on the first and "top" plus an orange ★ on the last, a tag on each free letter saying which cell it came from, and a line like "6 letters → cell 6 · +30". Long words switch to a compact two-row tray with small corner marks, and a locked letter block that wraps across the two rows is drawn as two outlined pieces with a lock each. A new saved-game test file (a long word with a QU free letter) covers this.
Ticket review: 4 passes, converged; nothing needed your input
Build: built (resumed after the 15:52 usage limit); commits 5146d2e
Code review: thorough (risk medium), 1 pass, converged; 0 fixes applied (2 minor test-strength items left)
Tests: all passing (test:all; the build also ran test:screens green, adding the compact-strip screenshots and regenerating the Place ones)
Ref to fix upstream: none
Paused: usage limit at step B, reset 18:00 EDT, resumed at 18:01 EDT
Tokens: 2.8M input-equivalent (build 57%, code review 33%, other 5%, orchestrator 5%); orchestrator peak context 55k
Worth knowing: one fixture met every condition, so no second fallback fixture was needed. A small paperwork edit is carried to the retro: the epic's Boundaries list should also name the AD-17 valid-fixture list in src/architecture-ad2-ad12-ad17.test.ts (plan `deferred`). The code review left two minor test-strength items for the refactor sweep (5.14): the compact tests named R-33 don't check the used-cell mark, and the wrapped locked block is checked by class counts instead of visible borders (review log 5-2-build.md). During the build one unrelated layout test (e2e/layout.spec.ts:286, banner while scrolling) failed once under load and passed on reruns.
Close-out docs: none

## 5.3 D-block controls, Validate and Confirm states — done
What it adds: while composing a word, the row under the tray now has working − and + buttons (how many cards of the chosen column join the word) and a Flip button, each saved at once; on an empty column a short caption replaces them. The big button reads Validate (or "Need 3+ letters", "Loading words…", "Word list unavailable" when it can't be pressed), checks the word only when tapped, and becomes Confirm while placing; an "invalid word" line goes away on the next edit, Undo or Redo. Long button labels shrink a little before they get cut off. A shared test helper for tapping at a screen point replaces four private copies.
Ticket review: 5 passes, converged; nothing needed your input (one open test-strength item passed to the build, which resolved it in the plan)
Build: built; commits 7768632
Code review: thorough (risk medium), 1 pass, converged; 0 fixes applied (8 minor items left)
Tests: all passing (test:all; the build also ran test:screens green, regenerating only the two board-composing screenshots)
Ref to fix upstream: none
Tokens: 10.6M input-equivalent (ticket review 61%, build 26%, code review 9%, orchestrator 2%, other 2%); orchestrator peak context 60k
Worth knowing: the code review left 8 minor items for the refactor sweep (5.14), listed in review log 5-3-build.md: the "…" at the shrunk label size draws in the larger font; two leftover null checks on an always-present button; two `+` presses in the new tests use a mouse click instead of the tap helper; three test names carry the wrong rule id; one k = 0 width check can never fail; no Playwright Flip on a QU column (R-30); two stale lines in the plan. Nothing deferred by the build.
Close-out docs: none

## 5.4 Controller seams — done
What it adds: nothing the player sees. The big file that handles taps and drags is split into smaller pieces (the visible-area clip, the desktop hover-peek timer, the card fly-back, one shared "find this cell or column" helper, and one list of shared style names), and the old per-ticket comment headers became one short summary per file, so the tile gestures of the next tickets have clean places to go.
Ticket review: 6 passes, converged; nothing needed your input (one open item passed to the build: prove every error message stayed the same, which the build did with a before/after diff of all 82 messages)
Build: built; commits 603c476
Code review: thorough (risk medium), 1 pass, converged; 0 fixes applied (5 minor items left)
Tests: all passing (test:all; the build also ran test:screens green with no screenshot change)
Ref to fix upstream: none
Tokens: 11.9M input-equivalent (ticket review 61%, build 24%, code review 11%, other 2%, orchestrator 2%); orchestrator peak context 64k
Worth knowing: the unit suite went from 2.17 s to 2.33 s (+7 %, well inside the 5 s budget). The code review left 5 minor items in review log 5-4-build.md for later tickets: a card element missing its id would quietly read as card 0 instead of failing (best fixed in 5.5, which touches that code); no test proves detaching clears the hover-peek memory (for the 5.14 sweep); one comment cites the wrong epic 4 document; some paperwork leftovers (the spine's folder list lacks the five new files, a stale "(entry 12)" tag in main.ts, one wrong build-notes label) are noted only in the plan, for the 5.15 sweep; one badly wrapped comment line.
Close-out docs: none

## 5.5 Tile tap: selection, swap and removal — done
What it adds: the player can now tap letters in the word tray. One tap picks a letter up (it lifts and gets a teal outline), a tap on another letter swaps the two, a second tap puts it back down, and on a borrowed free letter a second tap returns it to its column (shown by a `↩`). Pressing any button, or tapping elsewhere, drops the selection; the back button ignores it.
Ticket review: 6 passes, converged; nothing needed your input (one open item passed to the build: lift the tile area's clipping edge only at the top so the raised letter shows without unclipping the hidden extra rows; the build did that)
Build: built; commits 7866052
Code review: thorough (ticket risk high), 4 passes, converged; fixes in 2c4a109, 2ce828c and the earlier pass commit (hit area of tiles near row gaps, test and controller fixes), log d67ff2a
Tests: all passing (test:all; the build also ran test:screens green with no screenshot change)
Ref to fix upstream: none
Tokens: 19.9M input-equivalent (ticket review 43%, code review 31%, build 23%, other 2%, orchestrator 1%); orchestrator peak context 62k
Worth knowing: unit suite 2.43 s (budget 5 s). The code review left one paperwork item: the plan and build-notes CAP-4 still describe the tile's old hit-area trick, not the final per-row-gap version (for the 5.15 sweep). The build flags two risks: if a later feature (epic 6 keyboard commands) changes the game phase without a button, the next tile tap with a stale selection will throw an error rather than quietly clearing; and no test fixture has a third row of compact tiles, so that row's clipping is only checked indirectly.
Close-out docs: none

## 5.6 insertionIndex, gap rects and parting offsets — done
What it adds: the behind-the-scenes maths for dragging letters in the tray: which gap a dragged letter would drop into, where those gaps sit on screen, and how the other letters slide aside to make room. Nothing is wired to a real drag yet (that is ticket 5.7).
Ticket review: 5 passes, converged (majors 9, 5, 3, 3, 0); nothing needed your input. Resumed after the earlier session's usage limit (reset 4am New York).
Build: built; commit 779458b
Code review: thorough (risk medium), 2 passes, converged (majors 1, 1); test fixes in WIP commit c01ca58; one question for you, answered 2026-10-09: Option A, keep the nearest-gap rule (SPEC F25, ticket Notes, 7608342)
Tests: all passing (test:all, run in the resumed session after your answer)
Ref to fix upstream: none
Tokens: 6.9M input-equivalent (ticket review 38%, code review 30%, build 25%, other 4%, orchestrator 3%); orchestrator peak context 61k; resume session: 0.1M input-equivalent (orchestrator 60%, other 40%); orchestrator peak context 50k
Worth knowing: open item for the refactor sweep: no test yet tells straight-line distance apart from other distance measures for the nearest gap (add a diagonal case). Build note: when the word's letters fill a whole tray row on the left, a tile dragged over their far end can land at the start of the next row instead of the front of the word (follows the spec, pinned by a test; judge it in hand at 5.7).
Close-out docs: none (the answer keeps SPEC F3 as written; recorded as SPEC F25)

## Stopped — decision needed (ticket 5.6, Step C)
Question: when the word's destination letters wrap onto a second tray row, a tile dropped just past them on that second row lands at the nearest gap, which can be in the middle of the word, not at its end as the spec's CAP-5 success line ("a tile dragged past the block landing at the M end") expects. Proposed default: keep the nearest-gap rule (F3) with no special case; 5.7's "past the block" check uses a word that fits on one row; judge the wrapped case in hand at 5.7.
Resume: record the answer (ticket Notes / spec memlog), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-tray-and-place`; the next session resumes 5.6 at Step D (code review log has its Result).

## Resumed — 2026-10-09T10:03Z
Owner answered the 5.6 question (Option A). Step D: test:all passed; 5.6 marked done.

## 5.7 Tile drag in the tray and the strip — done
What it adds: you can now drag a letter tile within the tray (while composing) or along the placement strip (on the Place screen) to change the order; the other tiles slide aside to show where it will land. A drag that changes nothing, or is dropped mostly outside the tray, slides the tile back and doesn't count as a move. Leaving the app or pressing back mid-drag cancels the drag cleanly.
Ticket review: 7 passes, converged (majors 14, 8, 5, 4, 2, 2, 0); nothing needed your input
Build: built; commit ae9d19a
Code review: thorough (risk high), 2 passes, converged (majors 1, 1); fixes in WIP commit bf7c654, log a39738e
Tests: all passing (test:all: 2204 unit, 455 + 12 browser tests)
Ref to fix upstream: none
Tokens: 27.7M input-equivalent (ticket review 53%, build 27%, code review 18%, other 1%, orchestrator 1%); orchestrator peak context 69k
Worth knowing: one open item for the refactor sweep (5.14): in the build plan's test table, the row for "a free letter dragged out of the tray is not removed" (R-33) should say the browser test is the coverage, not an extra. Pass 1 of the code review mislabelled it; the code and the test are fine. The ticket was long (1746 words, nearly 4x its stub) because the tickets.toml fields were folded in. From 5.6: the edge case where a tile dragged past the end of a full left-hand row lands at the start of the next row can now be tried on the phone.
Close-out docs: none

## Owner hand check — 2026-10-09
After 5.7, the owner tried the F25 wrapped case on the phone (a tile dropped past a long word's letters that wrap onto a second tray row): works as wanted, no change. Also confirmed the same day: a tile dragged past the far end of a full row landing at the start of the next row (from 5.6) works as wanted. Both hand checks done.
