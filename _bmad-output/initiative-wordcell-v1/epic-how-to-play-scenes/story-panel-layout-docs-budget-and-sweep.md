---
id: 5
type: story
title: "Panel layout, docs, budget and sweep"
parent: epic-how-to-play-scenes
covers: [HP-7]
after: [4]
risk: low
---

# Panel layout, docs, budget and sweep

## Description

Settles the final panel order (scenes above the remaining text sections, anchors, scroll), removes the move steps and worked example text that the scenes replace and updates the How to play specs and screenshot baseline, updates the EXPERIENCE.md How to play section from 'one static page' to the scenes plus text (HP-7), measures the bundle against the 600,000-byte budget and records the margin, runs the epic's coverage audit against the Requirements, and lists every new text.ts string for the owner's catalogue review.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the build size is under 600,000 bytes with the margin recorded in the ticket Notes, and every HP id has a passing test or a recorded reason.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, How to play panel
- constraint — docs/development-methodology.md, Definition of done
