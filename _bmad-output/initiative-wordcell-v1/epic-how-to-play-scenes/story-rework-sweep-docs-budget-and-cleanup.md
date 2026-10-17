---
id: 11
type: story
title: "Rework sweep: docs, budget and cleanup"
parent: epic-how-to-play-scenes
covers: [HP-7]
after: [10]
risk: low
---

# Rework sweep: docs, budget and cleanup

## Description

Removes dead scene code, fixtures, text and tests of the replaced scenes, updates the EXPERIENCE.md How to play section (carousel, arrows, dots, five scenes), updates specs and screenshot baselines, measures the bundle against the 600,000-byte budget and records the margin, and lists every new or changed text.ts string for the owner's review.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the build size is under 600,000 bytes with the margin recorded, and no unused scene code or fixture remains.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — EXPERIENCE.md How to play panel
- constraint — docs/development-methodology.md, Definition of done
