---
id: 14
type: story
title: "Carry-ins: wheel during a mouse drag, hover-peek re-anchor, bfcache hide flush"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-12]
after: [11]
risk: medium
---

# Carry-ins: wheel during a mouse drag, hover-peek re-anchor, bfcache hide flush

## Description

Closes the epic 4 retrospective A8 items: after a desktop wheel scroll during a mouse drag the faces, highlight and drop target follow the pointer (controller test and desktop Playwright), a hover-peek re-anchor test asserting the peek stays anchored above the hovered cell after layout shifts, and the hide-flush `controller.cancel()` after a bfcache restore reproduced first and fixed only if it swallows a real back (done: a reproducing test whose failure is then fixed, or a recorded non-reproduction attempt in build-notes.md).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with a controller Vitest and a desktop Playwright case for the wheel scroll, the hover-peek re-anchor test passing, and either a failing-then-passing bfcache test or a build-notes line recording that it does not reproduce.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-12), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Open question: Whether the bfcache back reproduces at all in Playwright's Chromium.
