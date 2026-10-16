---
id: 17
type: story
title: "Refactor sweep: paperwork and budget"
parent: epic-game-surfaces-and-keyboard
after: [16]
risk: low
---

# Refactor sweep: paperwork and budget

## Description

Paperwork and measurements only: the P6 audit of rule-coverage.md (every row maps to a passing test), the unit-suite budget, the size budget, the close-out edit lists in build-notes.md and the retrospective inputs.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with every P6 row of rule-coverage.md covered, the unit median under 5 s on the Linux filesystem and the size script under 600,000 bytes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (Constraints), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
