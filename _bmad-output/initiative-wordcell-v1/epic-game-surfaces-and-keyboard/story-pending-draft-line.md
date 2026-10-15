---
id: 8
type: story
title: "Pending-draft line"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-9]
after: [1]
risk: low
---

# Pending-draft line

## Description

Shows `Undone: BAKED · Redo brings it back` in the tray band in ink-secondary in Idle with a pending draft (word uppercase, `QU` as `QU`) from GameView only, absent otherwise and after a new edit discards the redo tail.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on android through EXPERIENCE.md Flow 3 steps 3 to 5 showing the line after the second Undo, gone after Redo, and gone after a new drop discards the redo data; UI Vitest AD-3 on the string with a QU word.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-9), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
