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

Wires the menu's New game and Replay this deal rows (acting at once since entry 2) to their confirm dialogs (`newGameConfirm`, `replayConfirm`; texts per the EXPERIENCE.md message-catalogue rows New game confirm and Replay confirm; Esc, back and scrim tap dismiss) only while a game is in progress (GameView.inProgress, §2, R-74, never re-derived); a fresh deal or finished game acts at once. The rejected root has no Session or GameView (`game.state.kind === 'rejected'`).

Gate: new-game.ts gains `requestNewGame(view | undefined)` and `requestReplay(view)`; each calls `openSurface('newGameConfirm'|'replayConfirm')` when `view?.inProgress`, else the ungated action. `newGame()` and the new `replayDeal()` (`game.replay()` plus `overlays.resetForNewSession()`, Q-29; Menu's inline copy is deleted) stay ungated. Callers: the menu rows and, later, the N key (entry 10) call the gate; the dialog accept calls the ungated action; the action bar and the rejected root's BlockingMessage button (no GameView) keep calling `newGame()` directly, unchanged. A row closes the menu, then opens the confirm only through `openSurface(id)` (SPEC F8), so the menu pop completes before the push (CAP-1). Confirm buttons are `act()`-wrapped. Accept calls the ungated action once: `resetForNewSession()` already pops the confirm, so there is no separate close. Dialog is inert while exiting, so a second tap does not act. While a confirm is open the top bar is inert (SPEC F6, build-notes).

Mount: a `ConfirmDialogs.svelte` beside Menu in App.svelte renders both, open from `overlays.isOpen(id)`, `onscrim` dismissing. Esc: Dialog.svelte has no keydown handling, so the confirms get an interim window keydown handler like Menu's, `act()`-wrapped, active only when the top overlay is a confirm, closing only that entry, replaced by entry 10's keymap.

Focus: Menu's wasOpen effect focuses `main` after every close and presence's restoreFocus refocuses the unmounted opener: a row handler tells Menu to skip its focus-main step when a confirm follows, and restoreFocus must not win. A dismissal (Keep playing, Esc, back, scrim) focuses ☰ once the dialog has exited and the top bar is no longer inert; accept focuses `main`. A non-menu opener's return to `main` is Dialog's default, proved by entry 10.

- interface: text.ts gains `newGameConfirmTitle`/`Body`, `replayConfirmTitle`/`Body`, `keepPlaying`; the extended Dialog.svelte; the gate and `replayDeal()` in new-game.ts; no store API change.
- tests: R-74 (UI) confirm only while in progress, Replay keeps the seed (P6); Q-29 Replay proof (P6); win → New game → back (P6); focus-on-☰ dismissal (P6, rule-coverage.md); AD-4 (U, UI Vitest): extend the `game.newGame(` scan in `src/architecture-new-game.test.ts` so `game.replay(` and `game.newGame(` appear under src/ui only in new-game.ts; AD-13 Vitest for the two accept paths only (6.1 covers the entries): after accept, overlays depth 0 and `history.state.wc` 0 once the nav queue settles, and a reload with a confirm open leaves the Board, Session unchanged; text.ts test comparing each string to its catalogue row.
- owns: the two confirm dialogs, the I-68 proofs.
- consumers: the menu rows (via the gate) and the dialog accept; the deferred History notice is opened by `newGame()` after a rejected root (new-game.ts, AD-16) and is not gated by the confirm.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on android (and Esc also on desktop) showing:

- both dialogs only mid-game; boundary cases: fresh deal (no dialog), one move (dialog), and a relaunch into Idle with only a redo tail (`fixtures/session-idle-pending-draft.json`), asserting the dialog shows exactly when `GameView.inProgress` is true rather than hard-coding it;
- Keep playing leaving `wordcell:session` byte-identical (read localStorage right before opening and right after dismissal, no hide event, no dispatch);
- on open `Keep playing` is `toBeFocused` for both dialogs; a confirm dismissed by Keep playing, Esc, back and scrim tap closes only the confirm, the menu not reopened, with `toBeFocused` on the ☰ button; accepting New game or Replay with `toBeFocused` on `main`; focus assertions are made after the exit transition;
- New game giving a seed different from the seeded fixture's known seed (one change on a double tap of accept); Replay keeping the seed, leaving moves empty and `wordcell:history` byte-identical;
- the finished-game New game (action bar), Replay from a finished game (menu row, Q-29, CAP-3) and the rejected-root New game (`session-invalid-version-unknown.json`) with no dialog;
- I-68: from `fixtures/session-won.json` (seed 1), win → New game (action bar) leaves the bare Board (`history.state` `{ wc: 0, launch: <the id read before New game> }`, no end-sheet assertion, the sheet being entry 6's; if entry 6 has landed, the relaunch's end-sheet entry is gone), and one back from it leaves the app (the page leaves the game document), never showing the finished game.

Screens specs: `e2e/confirm.screens.spec.ts` (New game confirm and Replay confirm at 360 px, android), baselines generated in the container (build-notes naming).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-3), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
