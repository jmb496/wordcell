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

## Stopped — decision needed and code review session ended early (ticket 5.8, Step C)
5.8 "Free letters by tap and by drag" is built but not done.
Ticket review: 5 passes, converged (majors 12, 7, 3, 1, 1); nothing needed your input. Its one open item (the D-block mirrors must snap home under reduced motion, no fade) was handed to the build, and the build resolved it.
Build: built; commit 44eda8b. Deferred: the browser check of the parted-block outline across a row break waits for entry 12's long Composing fixture.
Code review: thorough (risk high). Pass 1 found 3 majors and 5 minors and one decision for the owner, then the session ended while its fixer was running (it did not wait for its own fixer). The fixer's partial, unverified edits are in WIP commit 8d40dff. A scratch probe test it left (`src/zz-probe-tmp.test.ts`, asserting `'x'`) was deleted.
Decision needed (desktop only): clicking a WordCell to add its letter while that cell's hover preview is open leaves the preview open, now showing the cell as used, until the mouse leaves the cell. Proposed default: keep as built.
Environment: the owner's `npm run dev --host` (started 11:06 EDT for the phone check) still holds port 5173. Playwright reuses it, so the build could not run `test:all` as one command (each part ran green separately), and Step D needs the port free.
Tokens: 22.3M input-equivalent (ticket review 43%, build 38%, code review 16%, orchestrator 2%, other 1%); orchestrator peak context 82k
Resume: answer the decision (record it in the ticket's Notes), stop the dev server on port 5173, then rerun loop.sh. The next session resumes the code review at pass 1's fix step.

## Resumed — 2026-10-09T23:15Z
Owner answered the 5.8 question (keep as built, SPEC F26) and freed port 5173. Step C resumed at pass 1's fix step.

## 5.8 Free letters by tap and by drag — done
What it adds: the player can tap a WordCell to add its top letter to the end of the word, or drag it into the tray to drop it at a chosen spot. While dragging, the other tiles slide aside (or a teal caret marks the spot when the tray is full) and the cell shows a dashed outline.
Ticket review: 5 passes, converged (majors 12, 7, 3, 1, 1); nothing needed your input (its one open item, reduced-motion snap-home for the mirrors, was resolved by the build)
Build: built; commit 44eda8b
Code review: thorough (risk high), 4 passes, converged (majors 3, 1, 1, 0); one question for you, answered 2026-10-09: keep as built (SPEC F26); fixes in 8d40dff (partial, earlier session), 67bab55, e356f0b, 1382c32, 7a0dd5b
Tests: all passing (test:all as one command: 2227 unit, 478 + 12 browser tests, build 513,501 / 600,000 bytes)
Ref to fix upstream: none
Tokens: 22.3M input-equivalent for the first session (see the stop entry above); resume session 6.3M input-equivalent (code review 97%, orchestrator 2%, other 1%); orchestrator peak context 57k
Worth knowing: one browser check is deferred to 5.12 (entry 12's long Composing fixture): a real free-letter drag that parts a multi-tile word block across a tray row break. The CSS itself is already checked on a one-row block. One paperwork leftover: two triage rows in the plan still use older wording (for the 5.15 sweep). The unit suite runs in 2.0 s of test time (6.0 s total on /mnt/d, budget measured on the Linux filesystem).
Close-out docs: none (the answer keeps EXPERIENCE.md as written; recorded as SPEC F26)

## 5.9 Place target, order and Confirm — done
What it adds: on the Place screen the player can now pick which WordCell the word goes into (legal cells ringed, others faded, the current choice pre-selected) by tapping it, or by a long-press on an empty cell, without losing the letter order they set; Confirm then commits the word into that cell, and an emptied board goes straight to Game over. A new test game covers a free letter taken from a cell holding exactly two cards.
Ticket review: 4 passes, converged (majors 11, 4, 1, 1); nothing needed your input. Its one open item (a desktop click on a legal cell while the hover preview is open) was handed to the build: the preview stays open and the click sets the target, as SPEC F26 already decided for the Composing click.
Build: built; commit bd90124
Code review: thorough (risk high), 1 pass, converged (majors 0); 0 fixes applied (4 minor test-precision notes listed in the log, not fixed)
Tests: all passing (test:all as one command: 2237 unit, 494 + 14 + 12 browser tests, build 513,537 / 600,000 bytes); the build also ran test:screens (10 passed, no baseline changed)
Ref to fix upstream: none
Tokens: 14.5M input-equivalent (ticket review 55%, build 34%, code review 9%, orchestrator 2%, other 1%); orchestrator peak context 68k
Worth knowing: the four minor review notes are about test precision only (one test checks an impossible state, one test-name clause can never fail, the save check retries until it matches, and the drag tests rely on real timing and check only the final target); candidates for the 5.14 sweep. Unit suite warm median 2.91 s on the Linux filesystem.
Close-out docs: none

## Stopped — usage limit

- Ticket 5.17 (Success signal: a whole move by taps and by drag), step: build (bmad-build-auto exited 1 at 22:54 on 2026-10-09).
- Reset: 00:10 EDT Sat 2026-10-10; rerun `loop.sh epic-tray-and-place` after it (+3 min).
- Uncommitted: `_bmad-output/specs/spec-epic-5-tray/build-notes.md` (modified), `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-success-signal-a-whole-move-by-taps-and-by-drag-plan.md` (new), `e2e/success-signal.spec.ts` (new).

## Resumed — 2026-10-10T04:47Z
After the usage limit reset, the 5.17 build was resumed from its review step (plan `in-review`, its own files uncommitted in the tree).

## 5.17 Success signal: a whole move by taps and by drag — done
What it adds: an end-to-end check that a player can make a whole move on a phone, start to finish: from the empty-column test game it plays the word ANEW (three letters moved to the empty column, the W added from a WordCell, letters reordered, Validate, a different target cell chosen, the order changed again, Confirm), once by taps only and once by dragging, and checks the saved game after every step and that both ways end in exactly the same game. No game code changed; it confirms the epic's tap and drag paths work together.
Ticket review: 3 passes, converged (majors 6, 2, 0); nothing needed your input
Build: built (resumed after the usage limit); commit dd74345
Code review: thorough (risk medium), 1 pass, converged (majors 0); 0 fixes applied (3 minor notes in the log)
Tests: all passing (test:all as one command: 2237 unit, 14 + 496 + 12 browser tests, build 513,537 / 600,000 bytes); the build also ran test:screens (no baseline changed)
Ref to fix upstream: none
Paused: usage limit at the build, reset 00:10 EDT 2026-10-10, resumed at 00:47 EDT
Tokens: 2.2M input-equivalent for the resume session (code review 49%, build 42%, orchestrator 7%, other 3%); orchestrator peak context 60k
Worth knowing: ANEW is a real dictionary word from the named start, so no substitute test game was needed (nothing for you to check at close-out). Three minor test-precision notes for the 5.14 sweep: the tap-only test does not prove that taps which should save nothing wrote nothing; the W drag cannot be told apart from a tap (same result); tile positions are read once before each drag, which may need a wait once later tickets animate tiles.
Close-out docs: none

## Stopped — 5.10 FLIP module and button-driven glides, at Step A (your decision needed)
What it adds: the glide animation that moves letter cards smoothly to their new place after a button press (Validate, Flip, changing the word length, Undo/Redo), instead of jumping.
Ticket review: 7 passes, converged (majors 10, 9, 4, 3, 2, 2, 0); one item needs your input (below).
Build: not started.
Tokens: 14.6M input-equivalent (ticket review 98%, orchestrator 1%, other 1%); orchestrator peak context 55k
Worth knowing: the question is about what a WordCell looks like while Undo sends a free letter back into it. Proposed default: a plain glide, with the cell looking empty for the glide (about 180 ms at Normal, 320 ms at Slow). Alternative: the cell keeps its used look until the letter lands, the way Confirm's fly-to-cell does, which means more work in this ticket.
Close-out docs: none yet (depends on your answer; if you pick the alternative, EXPERIENCE.md § Motion and the epic 5 SPEC/build-notes CAP-8 may need a line).

## Resumed — 2026-10-10T10:13Z
Jared chose the plain glide for the free-letter Undo (SPEC F27, ticket Notes, 2026-10-10). The 5.10 ticket review is complete (7 passes, converged); going straight to the build.

## 5.10 FLIP module and button-driven glides — done
What it adds: cards now glide smoothly to their new place after a button press (Validate, Undo, Redo, Flip, and the word-length − and + buttons) instead of jumping. With reduced motion turned on they fade instead. A tap or a button press during a glide finishes it first and then acts on the settled board. When Undo sends a free letter back to its WordCell, it glides home into a cell that looks empty until it lands (your choice, SPEC F27).
Ticket review: 7 passes, converged (majors 10, 9, 4, 3, 2, 2, 0); one question for you (how the WordCell looks during a free letter's Undo glide), answered 2026-10-10 with the plain glide
Build: built; commit 70b4bb1
Code review: thorough (risk high), 3 passes, converged (majors 2, 2, 0); 4 fixes applied (WIP commits 1eb19b4, 7c4555f)
Tests: all passing (test:all as one command: 2288 unit, 14 + 500 + 12 browser tests, build 515,024 / 600,000 bytes); the build also ran test:screens (no baseline changed)
Ref to fix upstream: none
Tokens: 16.2M input-equivalent for this session (code review 50%, build 47%, orchestrator 2%, other 1%); orchestrator peak context 67k; the ticket review's 14.6M is in the stop entry above
Worth knowing: the code review also brought the planning notes for later tickets in line with this one. Pressing during a glide now finishes the glide here, in 5.10, instead of in 5.16, and 5.12 gains a check that growing the tray does not move the columns. Two low/medium items are deferred: the reduced-motion fade and a press, back or hide during a glide are checked only by unit tests, not in the browser. 5.16 tests the press in the browser; back and hide during a glide are covered only by unit tests (review minor 5). Seven minor test-precision notes in the code review log are left for the 5.14 sweep. Unit suite warm median 2.87 s.
Close-out docs: none (your 2026-10-10 answer is already recorded in SPEC F27 and changes no other owner doc)

## Resumed — 2026-10-14T14:45Z

## 5.16 FLIP for controller-driven moves — done
What it adds: Cards now glide smoothly after drag releases and taps on the tray (drops, tap-add, removal, swaps, free letters); a release with no change flies back; pressing during a glide finishes it first.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commits bf274f7
Code review: thorough (ticket risk high), 2 passes, converged; fixes applied in 74cebb3 (1 major each pass)
Tests: all passing (`npm run test:all`)
Ref to fix upstream: none
Tokens: 5.7M input-equivalent (ticket review 38%, build 35%, code review 22%, orchestrator 3%, other 2%); orchestrator peak context 58k
Worth knowing: open item carried to the refactor sweep: the "no end leaves a capture pending" check is untested for free-letter drag ends, same-id, tail up with no highlight, long-press and sheet/scrim ends (code read-through found no such path). `npm run test:screens` was not run (Docker unavailable here); the ticket's verify line names it, so run it before the epic closes. Gate-idle is not asserted in e2e (test hook does not expose the gate).
Close-out docs: none

## Resumed — 2026-10-14T16:37Z

## 5.11 Fly-to-cell on commit — stopped (needs your decision)
What it adds: when you Confirm a word (or Redo one), the letters would fly one after another from the tray into the WordCell.
Ticket review: 5 passes, diverging (majors 9, 5, 5, 1, 3); one question for you (below). Not built yet.
Build: not started
Ref to fix upstream: SPEC.md F7 and build-notes.md CAP-8 (Fly-to-cell): which cards count as "flying" when the free letter is already in a WordCell (spec intent); ticket wording of previous-card visibility (ticket only).
Tokens: Tokens: 3.0M input-equivalent (ticket review 96%, orchestrator 2%, other 2%); orchestrator peak context 51k
Worth knowing: the question: during a Confirm's flight into a WordCell that already holds cards, the spec as written would make the cell look empty briefly (up to ~270 ms for a 10-letter word) between the first landing and the top card landing, while F27 says Confirm's fly is where the cell never looks empty. Proposed default: keep previous and landed cards visible until the last landing, then hide all but the top together, so the cell never looks empty. Alternative: the spec literal, with a brief empty cell.
Close-out docs: none yet (SPEC.md F7 / build-notes CAP-8 may need a line once you answer)

## Resumed — 2026-10-14T16:52:45Z
Owner answers for 5.11 recorded (SPEC F28); ticket review log has its Result, going to the build.

## 5.11 Fly-to-cell on commit — done
What it adds: when you Confirm (or Redo) a word, the letters fly one after another into the WordCell. The cell never looks empty during the flight, and a free letter already in another WordCell flies too (your 2026-10-14 answers, SPEC F28).
Ticket review: 5 passes, diverging (majors 9, 5, 5, 1, 3); two questions for you, answered 2026-10-14 and applied to the ticket
Build: built; commit 6419f65
Code review: thorough (ticket risk medium), 2 passes, converged (majors 4, 0); fixes applied in 7a74d12
Tests: all passing (`npm run test:all`)
Ref to fix upstream: SPEC.md F7 and build-notes.md CAP-8 (flying set; now answered, see Close-out docs)
Tokens: 2.7M input-equivalent (code review 63%, build 31%, orchestrator 3%, other 3%); orchestrator peak context 55k
Worth knowing: `npm run test:screens` was not run (Docker not installed in this WSL); no baseline change expected, run it before the epic closes. The build ran one independent reviewer instead of the full lens set. The hold is set after measuring, with a second flush before paint, because the ticket's "hold above the first flushSync" cannot work (recorded in the plan). Minor review items carried to the 5.14 sweep.
Close-out docs:
- SPEC.md F7 and build-notes.md CAP-8 ← free letter already in a WordCell flies too (owner, 2026-10-14, recorded as F28)
- SPEC.md F27/F28 ← Confirm's fly-to-cell never shows an empty cell: previous top and landed cards stay until the last landing (owner, 2026-10-14)

## 5.12 Tray growth wiring — done
What it adds: the tray now grows to two or three rows of compact tiles as letters are added (e.g. 14 → 15) and shrinks back, after every completed edit, never mid-drag; the WordCell row stays put and the page scrolls by any shortfall. Two long-word fixtures were added.
Ticket review: 3 passes, converged; nothing needed your input
Build: built; commits fa2a8fb
Code review: thorough, 3 passes, converged; fixes applied in WIP commits a4420c3, 12bc402
Tests: all passing
Ref to fix upstream: none
Tokens: 7.0M input-equivalent (build 39%, code review 35%, ticket review 23%, orchestrator 2%); orchestrator peak 54k
Worth knowing: (1) session-place-long.json uses a 15-letter non-word with an inline dictionary (no real 15-letter word available); the loader does not re-check membership. (2) Open major carried to the refactor sweep: the 780-px scroll-busy e2e in e2e/tray-growth.spec.ts asserts 0 < scrollY < 6 after a smooth scroll, which is timing-fragile; fix by dispatching scroll and click in one evaluate, or rely on the real-flip unit case. (3) The watchTiles effect (New game/Replay swap) is covered only by unit fakes. (4) Anchor scrollTop write during an Android fling unverified (epic 7 device checks). (5) test:screens not run (no Docker here).
Close-out docs: none

## 5.13 Winning-animation input guard — done
What it adds: while the winning animation plays, stray taps, clicks and key presses (including a held Enter or a double tap on Confirm) are swallowed so they cannot start a new game or open views; Undo still works, and the guard lifts after the animation settles. Adds the fast-motion prefs fixture.
Ticket review: 7 passes, converged (majors 10, 10, 6, 3, 2, 1, 0); nothing needed your input
Build: built; commits a6bb2c2
Code review: thorough (ticket risk high), 3 passes, converged (majors 4, 2, 0); fixes applied in WIP commits 855ad3e, 05451d2
Tests: all passing
Ref to fix upstream: none
Tokens: 7.6M input-equivalent (ticket review 48%, code review 28%, build 20%, orchestrator 2%, other 2%); orchestrator peak context 57k
Worth knowing: unapplied minors from the code review log (motion.ts `typeof closest` guard against rule 6, use `instanceof Element` or drop it; plan Code Map notes) carried to the refactor sweep (5.14). test:screens not run (no Docker here).
Close-out docs: none
