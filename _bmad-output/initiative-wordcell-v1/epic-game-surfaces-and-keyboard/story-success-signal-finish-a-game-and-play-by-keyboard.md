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

Adds the epic's end-to-end proofs: on android a fresh launch plays to a win and to a Give up, reads the end sheet, opens Statistics, collapses and expands the sheet, starts a new game, turns on Show timer and opens How to play, and reloads with the sheet expanded; on desktop Flow 6 by keyboard alone; scripting any missing start fixture under the epic 3 regeneration rule.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the two Playwright flows passing with the stored Session equal to current().session after every step.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-1, CAP-2, CAP-3, CAP-4, CAP-6, CAP-7, CAP-8, CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
