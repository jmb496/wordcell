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

Adds the epic's end-to-end proofs in a new e2e/surfaces-success.spec.ts, separate from epic 5's e2e/success-signal.spec.ts (untouched); helpers come from e2e/helpers/ (no copies); test names start with an id. Intent: interface "e2e/surfaces-success.spec.ts, plus e2e/helpers/keys.ts (the Flow 6 helpers `open`, `toComposing`, `arrangeByKeys`, `press`, `track` and what they use, moved unchanged from e2e/board-keys.spec.ts, which imports them; one AD-17 test in e2e/helpers.spec.ts); no new fixture."; tests "Success signal android flow (P6); Flow 6 keyboard-only move (P6 desktop)."; owns "The Success signal."

Start state: `seedStorage` via `openFixture` only, no history key, then `waitForDictionary(page, 'ready')`. A: `session-idle-empty-column` (seed 1, column 1 empty, Idle; `session-idle-fresh`'s whole-column move spells no dictionary word). B: `openFixture(page, 'session-won', { steps: ['undo'] })`, the Place phase whose Confirm wins. Flow 6: `openFixture(page, { literal: SESSIONS.flow6 })`. Literals were replayed read-only; others are read from view().

Android, `onAndroid`:
- A: 1 play ANEW by `tapAt(centre(...))` taps only, no drag helper (tail 1, 9, 28 of column 6, the column 1 placeholder, W card 48 on cell 7, tiles 9 then 28, Validate to target 4, Confirm): score 49 to 58; 2 Give up from the menu (no confirm: A-E10, R-75): `Game given up.`, final score −372, the line `43 letters left: −430` (QU counts 2, R-81), band `bandNames()[0]`, longest word and words placed read from view(); 3 open Statistics from the sheet: Games played 1 (the SPEC's "one higher" over the empty history), close it (`Close statistics`), collapse (`Collapse result`) and expand (the `Show result:` bar) the sheet; 4 reload: Board in Game over, the dialog and `Collapse result` visible, and after `animationFrames(page, 2)` `document.getAnimations().length` is 0 (R-73); 5 New game from the menu (no confirm for a finished game, EXPERIENCE.md Flow 4 step 4): no dialog, `game()` has no moves and a seed other than 1, the sheet is gone, Statistics (menu row) Games played still 1; 6 Show timer on in Preferences: read the first `.timer` text once visible, then `expect.poll` with `timeout` 5000 or more until it differs (R-76; no `page.clock`, no fixed sleep); 7 open How to play from the menu by tap: dialog `How to play` visible, closed by `Close how to play`, nothing dispatched.
- B: Confirm wins: `Every column cleared.`, top-bar score 319 before Confirm, final score 355 (delta 36), band Word Nerd; `wordcell-6` and `primary-action` by testid.

Desktop, `onDesktop`, Flow 6: `page.keyboard` only after load, the keys of the existing e2e/board-keys.spec.ts 'Flow 6' test (ZENANA on cell 6 from cell 8's free letter),. Adds: the stored Session equals the store's after each dispatching key, `moves[3]` equal to the literal `{"sourceColumn":6,"sourceCount":4,"destinationColumn":5,"destinationCount":1,"destinationSide":"left","freeLetters":[8],"arrangement":[9,27,1,28,0],"reached":"committed","targetCell":6,"placementOrder":[51,9,27,1,28,0]}` with cursor index 4 and score 190 (literals, not view() at test time), and `Esc` closing the controls table in the How to play dialog, `game()` unchanged, a second `Esc` leaving the Session alone (I-68).

Test names: `R-73 R-75 R-76 R-81 Success signal android: give up, sheet, reload, New game`; `R-62 Success signal win by Confirm`; `Q-24 I-68 Flow 6 keyboard-only move, Esc closes the table`.

## Acceptance Criteria

Verify: npm run test:all is green with both flows passing. After every dispatching step, after New game and after the reload, `expect.poll` until `storedGame(page)` equals `game(page)` (e2e/helpers/session.ts; both drop `activeMs`), re-read from the store each time, no stale stash; `stashSession` and `sameSession` prove a step dispatched nothing only within one page load and where no time accrues (the game-over steps 3); on the Playing deal and for the `6` no-op and `Esc`, `game()` is equal before and after. No screenshot spec or baseline is added; npm run test:screens (Docker only) is a no-drift check. Every P6 row of rule-coverage.md whose CAP is in `covers` has a passing test whose name carries its id, this ticket adding none beyond the flows; audit by grep, the list in the build plan; a gap goes there, not fixed here.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-1, CAP-2, CAP-3, CAP-4, CAP-6, CAP-7, CAP-8, CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- rule — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md, Decision on the epic 3 regeneration rule; _bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md
