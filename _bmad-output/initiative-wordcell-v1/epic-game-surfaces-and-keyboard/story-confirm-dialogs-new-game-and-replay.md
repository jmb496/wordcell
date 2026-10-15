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

Wires the menu's New game and Replay this deal rows to their confirm dialogs (`newGameConfirm`, `replayConfirm`; texts per the EXPERIENCE.md message-catalogue rows New game confirm and Replay confirm) only while a game is in progress (GameView.inProgress, §2, R-74, never re-derived); a fresh deal or finished game acts at once. The rejected root has no Session or GameView (`game.state.kind === 'rejected'`).

Gate: new-game.ts gains `requestNewGame(view)` and `requestReplay(view)` (entry 10 may widen the first); each calls `openSurface('newGameConfirm'|'replayConfirm')` when `view.inProgress`, else the ungated action. `newGame()` and the new `replayDeal()` (`game.replay()` plus `overlays.resetForNewSession()`, Q-29; replaces Menu's inline copy) stay ungated. Menu rows and, later, the N key (entry 10) call the gate; the dialog accept calls the ungated action; the action bar and the rejected root's BlockingMessage button keep calling `newGame()` directly. A row closes the menu, then opens the confirm only through `openSurface(id)` (SPEC F8), so the menu pop completes before the push (CAP-1). Confirm buttons are `act()`-wrapped. Accept calls the ungated action: `resetForNewSession()` already pops the confirm, so there is no separate close; Dialog's `firstClick` (presence.ts, ignores event.detail > 1) makes it act once. While a confirm is open the top bar is inert (SPEC F6, build-notes).

Mount: `ConfirmDialogs.svelte` beside Menu in App.svelte renders both from `overlays.isOpen(id)`, `onscrim` dismissing. Esc: Dialog.svelte has no keydown handling, so the confirms get an interim window keydown handler like Menu's, `act()`-wrapped, active only when the top overlay is a confirm, closing only it, replaced by entry 10's keymap.

Focus: ConfirmDialogs.svelte owns both moves. Accept sets a flag; an effect on `isOpen(id)` going true→false runs `tick().then(...)`: flag set focuses `main`, else the ☰ button (`main`'s inert clears at stack removal, not exit end). It covers Esc, back and scrim dismissals and skips when focus moved into a menu reopened during the exit. Menu's row handler sets a skip flag before close(), cleared by Menu's own effect, so its wasOpen effect does not focus `main`; presence's restoreFocus targets the menu row in the exiting sheet, so the effect must win (unverified). A non-menu opener's return to `main` is Dialog's default, proved by entry 10.

- interface: text.ts gains `newGameConfirmTitle`/`Body`, `replayConfirmTitle`/`Body`, `replayConfirmAction`, `keepPlaying` (New game's action reuses `text.newGame`); the extended Dialog.svelte; the gate and `replayDeal()` in new-game.ts; no store API change.
- tests: R-74 (UI) confirm and boundary tests, Q-29 Replay proof (P6); AD-13 win → New game → back and focus-on-☰ dismissal (P6, rule-coverage.md); AD-4 (U, UI Vitest): extend the `CALL` regex in `src/architecture-new-game.test.ts` to `game.replay(`, keeping its whole-src scope and exclusions, with a positive control; AD-13 Vitest for the two accept paths only (6.1 covers the entries): after accept, overlays depth 0 and `history.state.wc` 0 once the nav queue settles; text.ts test comparing all five strings to their catalogue rows plus the reuse.
- owns: the two confirm dialogs, the I-68 proofs.
- consumers: the menu rows (via the gate) and the dialog accept; the deferred History notice is opened by `newGame()` after a rejected root (new-game.ts, AD-16) and is not gated by the confirm.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on android (and Esc also on desktop) showing:

- both dialogs only mid-game; boundary cases: fresh deal (no dialog), one move (dialog), and a relaunch into Idle with only a redo tail (`fixtures/session-idle-pending-draft.json`), asserting the dialog shows exactly when `GameView.inProgress` is true;
- Keep playing leaving `wordcell:session` byte-identical (read right before opening and after dismissal, no hide event, no dispatch), and a reload with a confirm open leaving the Board, Session unchanged;
- on open `Keep playing` is `toBeFocused` for both dialogs; a confirm dismissed by Keep playing, Esc, back and scrim tap closes only the confirm, the menu not reopened, with `toBeFocused` on the ☰ button; accepting New game or Replay with `toBeFocused` on `main`; focus assertions are made after the exit transition, and a menu reopened during the exit keeps focus;
- New game giving a seed different from the seeded fixture's known seed (one change on a double tap); Replay keeping the seed, leaving moves empty and `wordcell:history` byte-identical;
- finished-game New game (action bar), Replay from a finished game (menu row, Q-29) and the rejected-root New game (`session-invalid-version-unknown.json`) with no dialog;
- I-68: from `fixtures/session-won.json` (seed 1), win → New game (action bar) leaves the bare Board (`history.state` `{ wc: 0, launch: <the id read before New game> }`, no end-sheet assertion, entry 6's), and one back from it leaves the app (the page leaves the game document), never showing the finished game.

Screens specs: `e2e/confirm.screens.spec.ts` (New game confirm and Replay confirm at 360 px, android), baselines generated in the container.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-3), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
