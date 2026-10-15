---
id: 9
type: story
title: "How to play panel"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-8]
after: [2]
risk: medium
---

# How to play panel

## Description

Adds the How to play panel and its menu row (the sheet now lists all six rows) with the eight sections in order, text drafted from spec §3–§6 and §9 (no Cancel, no hints, Q-12), rating-band names from text.ts, the §8 worked example drawn with the real card component as static non-interactive images (aria-hidden, no data-card-id or data-testid, not live elements), and the controls section with the touch, mouse and keyboard tables; the owner reads the text at ticket review.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on android that opens the panel from its menu row, asserts the menu lists all six rows, sees the eight section headings in order, the four worked-example words, the band names, back closing it, and UI Vitest AD-3 that every string is in text.ts.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-8), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Open question: How long the page is on a small viewport and whether the static cards need a new non-interactive Card variant.
