---
id: 1
type: story
title: "Surface foundation and the one New game function"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-1]
risk: high
---

# Surface foundation and the one New game function

## Description

Tracer bullet through the overlays store, nav and the UI: adds the menu, statistics, preferences, howToPlay, newGameConfirm and replayConfirm entries to src/ui/overlays.svelte.ts (one history entry each, closed top-down, back and Esc close the topmost; dismissing a confirm opened from the menu closes only the confirm and does not reopen the menu), the shared sheet, full-screen panel and confirm-dialog components (dialog focus on the dismissive button, scrim rules, safe-area padding, 1 × base open/close transition and the 120 ms reduced-motion fade, the WordCell view sheet and peek transition included); R4 already landed, so `newGame()` in src/ui/new-game.ts stays the one New game function and new entry points only add callers.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with UI Vitest AD-13 cases for every new entry (open, stack, close, back, resetForNewSession), confirm dismissal closing the confirm without reopening the menu, AD-12 act() on the shared close buttons, and a UI Vitest/scan test that no site other than new-game.ts repeats the New game sequence; P6 opening a WordCell view in Idle that animates and ends in the shown state, and under reduced motion fades.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-1), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Open question: Whether the shared components can be proved by UI Vitest alone before entry 2 and later entries give them a real opener (the AD-13 two-overlay reload case is entry 5's P6).
