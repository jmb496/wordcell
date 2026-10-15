---
id: 5
type: story
title: "Statistics panel, history flag and menu dot"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-6]
after: [2]
risk: medium
---

# Statistics panel, history flag and menu dot

## Description

Adds the Statistics panel and its menu row (2 × 3 tiles: games played, won, given up, best score, average score (both leaving out given-up games with a negative score, R-84, Q-44, the engine's statistics output shown unchanged), longest word ever with its letter count, `—` where none, the no-finished-games line, U+2212 negatives) over scoreHistory.statistics and one UI-layer derived unreadable-history getter over scoreHistory that also shows the History-unreadable message with Reset history in the panel and the error-coloured dot on the ☰ button in TopBar.svelte; Reset history opens the existing confirm: Delete history closes only the dialog and the surface stays open showing the clean state, Keep it closes only the dialog.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with Playwright on android opening the panel from its menu row, seeded from history fixtures showing the six values, `—` and the empty line on a fresh history, a history with only negative given-up games, the unreadable message and its version-sentence variants and the menu dot on each history-invalid-* fixture, and Reset history clearing the message and the dot with the panel staying open; the AD-13 two-overlay reload (Statistics panel with Reset history's confirm on top, seeded from a history-invalid-* fixture): Board stays, history.state { wc: 0, launch: new } once the notice is answered, back leaves the app.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-6), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
