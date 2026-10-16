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

Adds the epic's end-to-end proofs in a new e2e/surfaces-success.spec.ts, separate from epic 5's e2e/success-signal.spec.ts (untouched); helpers come from e2e/helpers/ (no copies); test names start with an id (AGENTS.md Conventions: AD-n / Q-n / §n, never R-id coverage for shell sentences). Intent: interface "e2e/surfaces-success.spec.ts; any new fixture."; tests "Success signal android flow (P6); Flow 6 keyboard-only move (P6 desktop)."; owns "The Success signal."

Start state: storage seeded through e2e/helpers/seed.ts `seedStorage` only, no history key unless stated, then `waitForDictionary`. Fixtures that exist: `session-idle-fresh` (seed 1, no moves, Idle), `session-won` (eight words), `session-gave-up`. Test B starts from `session-won` plus one Undo (the Place phase whose Confirm wins, as e2e/end-sheet.spec.ts and win-guard.spec.ts do). Flow 6 starts from `SESSIONS.flow6` in e2e/helpers/sessions.ts (the Flow 1 stand-in; no fixtures/ file holds the spec §8 position; builder check: reuse it if it suits Flow 6, else script fixtures/<key>.json under the epic 3 regeneration rule). Expected values are literals from engine replay.

Android, `onAndroid`, two tests:
- A (empty history, `session-idle-fresh`): 1 play a word (Confirm); 2 Give up from the menu: end sheet with replayed score, band, statistics; 3 open Statistics, then collapse and expand the sheet; 4 reload with the sheet expanded: Board in Game over, sheet expanded, `animationFrames` shows no animation; 5 New game (no confirm for a finished game, EXPERIENCE.md Flow 4 step 4): Statistics games played one higher, the new deal's Board; 6 Show timer on in Preferences: the top-bar readout advances (R-76; Playwright clock or polled text, no fixed sleep); 7 open How to play from the menu by tap.
- B (empty history, win start above): Confirm wins: win title, final score = pre-win score plus the committed delta, end sheet reads.

Desktop, `onDesktop`, Flow 6: `page.keyboard` only after load (no mouse or tap helpers), following EXPERIENCE.md Flow 6 steps 2-5: select and drop, `6` adds the L, Shift+arrows into BALKED, `Enter` validates, `6` keeps the target, `Enter` confirms; final stored Session and score from engine replay; `?` opens the controls table, `Esc` closes it (I-68).

## Acceptance Criteria

Verify: npm run test:all is green with both flows passing. After every dispatching step, after New game (re-based on the new Session) and after the reload, poll until the stored wordcell:session equals current().session (`sameSession`, `storedText`, `stashSession`); non-dispatching UI steps (open, collapse, expand, Statistics, Preferences, How to play) skip the change-poll but leave the equality true. No screenshot spec or baseline is added; npm run test:screens (Docker only) is a no-drift check. Every P6 row of rule-coverage.md for the covered CAPs has a passing test whose name carries its id, this ticket adding none beyond the two flows; audit by grep, record any gap.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-1, CAP-2, CAP-3, CAP-4, CAP-6, CAP-7, CAP-8, CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- rule — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md, Decision on the epic 3 regeneration rule; _bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md
