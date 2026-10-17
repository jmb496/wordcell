---
id: 6
type: story
title: "Scene carousel and whole play-area stage"
parent: epic-how-to-play-scenes
covers: [HP-1, HP-2, HP-6]
after: [5]
risk: medium
---

# Scene carousel and whole play-area stage

## Description

Replaces the stacked scene list in the How to play panel with a carousel: one scene at a time, left and right arrow buttons (named, native buttons, wrapped in act(), 44 px targets, previous disabled visually on the first scene and next on the last), dots as buttons that jump to a scene with the current one marked, the current scene plays and the others render nothing, keyboard arrows move between scenes, reduced motion keeps the Next-frame control. Gives every scene one shared stage that draws the whole play area like the game: eight columns with more cards than today and the tray with the word strip and WordCells 3 to 10 where the game puts them (static Card components), so scenes are scripted on a real-looking board. Existing scenes keep working on the new stage until the following entries replace them.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with a Playwright android test that only one scene is playing, the arrows and dots move between scenes and name the position, a closed panel animates nothing, and a screenshot of the stage.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — EXPERIENCE.md How to play panel, DESIGN.md tray and cards
- rules — docs/game-flow-spec.md §8

## Notes

- Open question: How to fit eight columns plus the tray inside the phone-width panel at readable card size; reuse the layout measuring of src/ui/layout/.
