---
id: 10
type: story
title: "Scene 5: the one Tricky rule"
parent: epic-how-to-play-scenes
covers: [HP-4, HP-5, HP-6]
after: [9]
risk: low
---

# Scene 5: the one Tricky rule

## Description

Replaces the Tricky rules section (three scenes) by a single scene as the last carousel item: lift E D K A, drop back on column 1, F must join, the rearranged word (FAKED) is animated in the tray, on the shared stage and visuals. Caption: Dropping back on the column you lifted from is allowed. You must use at least 1 letter from the destination column, unless you drag to an empty column. The empty-column and one-top-card scenes are removed.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay passes for the scene fixture; no leftover Tricky rules section or fixtures for the removed scenes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-21, R-13
