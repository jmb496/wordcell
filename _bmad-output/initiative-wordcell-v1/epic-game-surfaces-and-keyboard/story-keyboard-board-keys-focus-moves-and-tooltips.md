---
id: 11
type: story
title: "Keyboard: board keys, focus moves and tooltips"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-10]
after: [10]
risk: high
---

# Keyboard: board keys, focus moves and tooltips

## Description

Adds the board keys of the EXPERIENCE.md table (`1`–`8`, `↑`/`↓`, `3`–`9`/`0`, `←`/`→`, `Shift`+arrows, `Space`, `Enter`, `+`/`=`/`-`, `F`), Space/Enter tile activation (select, swap, return; epic 5 plan deferral), focus order top bar → columns → tray → WordCells → action bar, focus following the phase (first movable tile, first strip card, the board, the end sheet's first action, the moved tile, the new tile after a key add, the next tile after a key removal, the tail's top card after a key selection), the visible focus ring in accent-teal, and the key in each desktop button's tooltip.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on desktop playing EXPERIENCE.md Flow 6 by keyboard alone, each table row for its phase (including no-ops that dispatch nothing), focus after every phase change and after each key edit, and tooltips showing the key.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-10), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Open question: Whether a focusable board container exists when every column is empty or the ticket adds it.
