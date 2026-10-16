---
id: 3
type: story
title: "Place and scoring scenes"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5, HP-6]
after: [2]
risk: low
---

# Place and scoring scenes

## Description

Adds scene 4 (place BALKED: cells 3–6 lit, 6 pre-selected, tap 5 then 6, drag D to the front, Confirm, fly to cell 6, HP-3d) and scene 5 (cells 3, 4 and 6 holding CAT, QUIT and BALKED, per-cell numbers 9, 16, 36, total 61, QU counting two, HP-3e), each with its caption in text.ts and an engine-replayed fixture.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright android tests that play both scenes to their last frame, a final-frame screenshot baseline of each, and an engine replay that checks the placement order and the 61 total and fails when a stated number is changed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-40 to R-42, R-50 to R-52, R-60, R-80, R-36
