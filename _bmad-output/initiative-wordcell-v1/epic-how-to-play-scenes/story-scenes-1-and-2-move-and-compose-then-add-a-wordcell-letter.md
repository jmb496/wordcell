---
id: 7
type: story
title: "Scenes 1 and 2: move and compose, then add a WordCell letter"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5, HP-6]
after: [6]
risk: medium
---

# Scenes 1 and 2: move and compose, then add a WordCell letter

## Description

Scene 1 combines the old drag and destination-block scenes on a fuller board: lift a stack, drop it, the cards are rearranged in the tray with an animated reorder (the pointer does not drag every card), add destination letters with the plus and minus, Flip. Scene 2 starts from scene 1's final state and adds a WordCell's top card as a free letter (change the word as needed), Validate; its caption includes: The top card of each WordCell can be used as a free letter added to the word. Fixtures replayed by the engine test; captions drafted in text.ts for the owner's review.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay passes for both fixtures and scene 2 provably starts from scene 1's final position; Playwright android plays both.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-30 to R-38, R-21
- code — src/ui/scenes/
