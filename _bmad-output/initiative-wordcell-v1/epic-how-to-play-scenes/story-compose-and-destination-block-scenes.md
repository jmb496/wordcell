---
id: 2
type: story
title: "Compose and destination-block scenes"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5, HP-6]
after: [1]
risk: low
---

# Compose and destination-block scenes

## Description

Adds scene 2 (arrange A K E D, borrow L from WordCell 6, BALKED, Validate, HP-3b) and scene 3 (mini board: source P E, destination S T A; APE, + twice STAPE with Validate still lit, Flip to PEATS, HP-3c), each with its caption in text.ts and an engine-replayed fixture.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright android tests that play each scene to its last frame, a final-frame screenshot baseline of each, and an engine replay that passes for both fixtures and fails when a stated word is changed to a non-word.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-30 to R-38, §8
