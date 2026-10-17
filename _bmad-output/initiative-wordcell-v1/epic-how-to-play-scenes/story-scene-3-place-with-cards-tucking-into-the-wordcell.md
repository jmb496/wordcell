---
id: 8
type: story
title: "Scene 3: place with cards tucking into the WordCell"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5]
after: [7]
risk: low
---

# Scene 3: place with cards tucking into the WordCell

## Description

Place scene laid out exactly like the game. The word's cards animate into the chosen WordCell leftmost first, each disappearing below the card above it, so the WordCell ends with a single top card and not a stack; order dragging of the free letter stays as in the current scene.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay passes; a Playwright android test plays the scene; a final-frame screenshot shows one top card.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-40 to R-42, R-50 to R-52, R-60
