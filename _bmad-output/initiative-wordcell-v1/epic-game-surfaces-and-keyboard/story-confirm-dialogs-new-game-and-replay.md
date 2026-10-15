---
id: 3
type: story
title: "Confirm dialogs, New game and Replay"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-3]
after: [2]
risk: medium
---

# Confirm dialogs, New game and Replay

## Description

Wires the menu's New game and Replay this deal rows (acting at once since entry 2) to their confirm dialogs (`newGameConfirm`, `replayConfirm`; texts from text.ts per the EXPERIENCE.md message-catalogue rows New game confirm and Replay confirm, strings only in text.ts with a text.ts test; `Keep playing` focused first, action style per Dialog.svelte; Esc, back and scrim tap dismiss) only while a game is in progress (GameView.inProgress, §2, R-74, never re-derived); a fresh deal or finished game acts at once. The action bar's New game appears only when status is not playing (and on the rejected root), so it goes through the same gate (inProgress false there, so it acts at once; one code path). The only mid-game confirm openers in this ticket are the two menu rows; the N key (entry 10) is the next caller of the same gate. The rejected root has no Session or GameView (`game.state.kind === 'rejected'`, no menu, Replay not offered): the gate is the absence of a Session, so New game acts at once.

Mechanism: a row closes the menu, then opens the confirm only through `openSurface(id)` (SPEC F8), so the menu pop completes before the push (CAP-1). Confirm buttons are `act()`-wrapped. Accepting pops the confirm, then calls `newGame()` (entry 1) or the Replay sequence once; Replay's `game.replay()` plus `overlays.resetForNewSession()` (Q-29) moves into one helper beside `newGame()` in src/ui/new-game.ts, which Menu's at-once row and the dialog both call, and the CAP-1 scan or UI Vitest forbids other sites. After accept the stack is the bare Board. While a confirm is open the top bar is inert (SPEC F6, build-notes).

Esc: Dialog.svelte has no keydown handling, so the confirms get an interim window keydown handler like Menu's, `act()`-wrapped, active only when the top overlay is `newGameConfirm`/`replayConfirm`, closing only that entry, replaced by entry 10's keymap.

Focus: a dismissal (Keep playing, Esc, back, scrim) of a menu-originated confirm focuses ☰ once the dialog has exited and the top bar is no longer inert, and Menu's focus-main-on-close must not take it; accepting focuses the board (`main`) as in the 6.2 plan; a confirm opened from elsewhere (action bar or key, only when inProgress) returns focus to the board.

- interface: text.ts gains the dialog strings; the existing Dialog.svelte (extended in entry 1) used from Menu.svelte; the shared Replay helper in new-game.ts; no store API change.
- tests: R-74 (UI) confirm only while in progress, Replay keeps the seed (P6); Q-29 Replay proof (P6); win → New game → back (P6); focus-on-☰ dismissal (P6, rule-coverage.md); AD-4 New game and Replay go through the store (U, UI Vitest); AD-13 Vitest for each new confirm entry; text.ts test.
- owns: the two confirm dialogs, the I-68 proofs.
- consumers: `newGame()` gains the dialog accept path and the menu rows (confirm only when inProgress); the action bar New game (direct, finished game) and the rejected-root New game (direct) keep calling it unchanged; the deferred History notice is opened by `newGame()` after a rejected root (new-game.ts, AD-16) and is not a new caller or gated by the confirm.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on android (and Esc also on desktop) showing:

- both dialogs only mid-game; boundary cases: fresh deal (no dialog), one move (dialog), and a relaunch into Idle with only a redo tail (a `seedStorage`-built Session, status playing, `cursor.index` 0, moves > 0), asserting the dialog shows exactly when `GameView.inProgress` is true rather than hard-coding it;
- Keep playing leaving `wordcell:session` byte-identical (read localStorage right before opening and right after dismissal, no hide event, no clock advance);
- a confirm opened from the menu rows dismissed by Keep playing, Esc, back and scrim tap closing only the confirm, the menu not reopened, with `toBeFocused` on the ☰ button; accepting New game or Replay with `toBeFocused` on `main`; a confirm opened from the action bar or key returning focus to `main`;
- New game giving a seed different from the seeded fixture's known seed, and Replay the same deal;
- the finished-game New game (action bar) and the rejected-root New game (`session-invalid-version-unknown.json`) with no dialog;
- I-68: from `fixtures/session-won.json` (seed 1), win → New game leaves the bare Board (`history.state` `{ wc: 0, launch: new }`, no end-sheet assertion, the sheet being entry 6's; if entry 6 has landed, the relaunch's end-sheet entry is gone), and one back from it leaves the app, never showing the finished game.

Screens specs: `e2e/confirm.screens.spec.ts` (New game confirm and Replay confirm at 360 px, android), baselines generated in the container (build-notes naming).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-3), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
