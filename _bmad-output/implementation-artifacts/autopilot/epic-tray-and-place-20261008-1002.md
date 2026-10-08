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
