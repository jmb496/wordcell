---
id: 16
type: story
title: "Refactor sweep: code"
parent: epic-game-surfaces-and-keyboard
after: [15]
risk: low
---

# Refactor sweep: code

## Description

Cleanup only, scope set from the build records and review findings deferred during the epic: duplicated surface code, comment history paragraphs, shared e2e helpers, the AD-1 and AD-2 scans, and any controller or overlays simplification the deferred findings name.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with no behaviour change and no baseline change.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (Constraints), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
