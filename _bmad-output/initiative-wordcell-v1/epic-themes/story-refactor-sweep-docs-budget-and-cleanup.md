---
id: 11
type: story
title: "Refactor sweep: docs, budget and cleanup"
parent: epic-themes
covers: [TH-7, TH-8]
after: [3, 4, 5, 6, 7, 8, 9, 10]
risk: low
---

# Refactor sweep: docs, budget and cleanup

## Description

Removes dead tokens and any temporary theme scaffolding, confirms the spec, UX docs and spine match what was built, measures the bundle against the 600,000-byte budget and records the margin, and lists review findings deferred during the epic.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the build size is under 600,000 bytes with the margin recorded, and no unused token or theme scaffolding remains.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- constraint — docs/development-methodology.md, Definition of done
