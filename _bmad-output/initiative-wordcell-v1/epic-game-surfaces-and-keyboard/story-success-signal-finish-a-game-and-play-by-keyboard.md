---
id: 15
type: story
title: "Success signal: finish a game and play by keyboard"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-1, CAP-2, CAP-3, CAP-4, CAP-6, CAP-7, CAP-8, CAP-10]
after: [4, 7, 9, 12, 13, 14]
risk: medium
---

# Success signal: finish a game and play by keyboard

## Description

Adds the epic's end-to-end proofs in a new e2e/surfaces-success.spec.ts, separate from epic 5's e2e/success-signal.spec.ts (untouched); helpers come from e2e/helpers/ (no copies); test names start with an id. Intent: interface "e2e/surfaces-success.spec.ts; no new fixture."; tests "Success signal android flow (P6); Flow 6 keyboard-only move (P6 desktop)."; owns "The Success signal."

Start state: `seedStorage` via `openFixture` only, no history key, then `waitForDictionary`. A: `session-idle-empty-column` (seed 1, column 1 empty, Idle; `session-idle-fresh`'s whole-column move spells no dictionary word). B: `openFixture(page, 'session-won', { steps: ['undo'] })`, the Place phase whose Confirm wins. Flow 6: `openFixture(page, { literal: SESSIONS.flow6 })`. Expected values are literals from engine replay, else "read from view()".

Android, `onAndroid`:
- A: 1 play ANEW by touch as e2e/success-signal.spec.ts does (tail 1, 9, 28 of column 6 on empty column 1, W card 48 added, order 1, 28, 9, 48, Validate to target 4, Confirm): score 49 to 58; 2 Give up from the menu (no confirm: A-E10, R-75): `Game given up.`, final score −372 (penalty 430, 43 letters left), band `bandNames()[0]`, longest word and words placed read from view(); 3 open Statistics from the sheet: Games played 1 (the SPEC's "one higher" over the empty history), close it (`Close statistics`), collapse (`Collapse result`) and expand (the `Show result:` bar) the sheet; 4 reload: Board in Game over, the dialog and `Collapse result` visible, and after `animationFrames(page, 2)` `document.getAnimations().length` is 0 (R-73); 5 New game from the menu (no confirm for a finished game, EXPERIENCE.md Flow 4 step 4): the new deal's Board, Statistics (menu row) Games played still 1; 6 Show timer on in Preferences: `expect.poll` the top-bar `.timer` text until it changes (R-76; no `page.clock`, no fixed sleep); 7 open How to play from the menu by tap.
- B: Confirm wins: `Every column cleared.`, top-bar score 319 read before Confirm, final score 355 = 319 plus the delta read from the tray meta, band Word Nerd; `wordcell-6` and `primary-action` by testid.

Desktop, `onDesktop`, Flow 6: `page.keyboard` only after load, the keys of the existing e2e/board-keys.spec.ts 'Flow 6' test, which already covers the move and `?`. This test adds the stored Session equalling current().session after each dispatching key, the final Session and score from engine replay, and `Esc` closing the controls table with the Board unchanged (I-68).

Test names: `AD-17 Success signal android: give up, sheet, reload, New game`; `R-62 Success signal win by Confirm`; `Q-24 Flow 6 keyboard-only move, Esc closes the table`.

## Acceptance Criteria

Verify: npm run test:all is green with both flows passing. After every dispatching step, after New game and after the reload, `expect.poll` until `storedGame(page)` equals `game(page)` (e2e/helpers/session.ts; both drop `activeMs`), re-read from the store each time, no stale stash; `stashSession` before and `sameSession` after prove only that a non-dispatching step (open, collapse, expand, Statistics, Preferences, How to play, the `6` no-op, `Esc`) dispatched nothing. No screenshot spec or baseline is added; npm run test:screens (Docker only) is a no-drift check. Every P6 row of rule-coverage.md for the covered CAPs has a passing test whose name carries its id, this ticket adding none beyond the two flows; audit by grep; a gap goes in the build plan, not fixed here.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-1, CAP-2, CAP-3, CAP-4, CAP-6, CAP-7, CAP-8, CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- rule — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md, Decision on the epic 3 regeneration rule; _bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md
