---
id: 9
type: story
title: "Scene 4: scoring with stacks growing"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5]
after: [8]
risk: low
---

# Scene 4: scoring with stacks growing

## Description

Scoring scene starts as the game looks (WordCells recognisably on the board), animates each WordCell stack downwards to show how many cards it holds, then shows the per-cell numbers and the total; QU counts two.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay checks the scores; Playwright android plays the scene.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-80, R-36
