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

Wires the menu's New game and Replay this deal rows (acting at once since entry 2) and the action bar's New game to their confirm dialogs (texts from text.ts, `Keep playing` focused first, Esc, back and scrim tap dismiss) only while a game is in progress (GameView.inProgress, §2, R-74, never re-derived); a fresh deal or finished game acts at once, and from the rejected root New game acts at once (no menu there, Replay not offered); New game calls newGame() from entry 1 and Replay calls `game.replay()` then `overlays.resetForNewSession()` (Q-29); adds the I-68 proofs (Q-29 Replay: same deal, empty moves, history unchanged; win → New game → back from a seeded won-state fixture with no end-sheet assertion, the sheet being entry 6's).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with Playwright on android showing both dialogs only mid-game, boundary cases (fresh deal, one move, relaunch into Idle with only a redo tail, where the dialog shows because inProgress counts the redo tail), Keep playing leaving wordcell:session byte-identical, a confirm opened from the menu rows dismissed by Keep playing, Esc, back and scrim tap closing only the confirm with focus on the ☰ button (the menu not reopened), New game giving a new seed and Replay the same deal, the finished-game and rejected-root New game with no dialog, and the I-68 cases: win → New game → back (seeded won-state fixture, no end-sheet assertion) leaves the app (or follows the bare-Board rule) and never returns to the finished game.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-3), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
