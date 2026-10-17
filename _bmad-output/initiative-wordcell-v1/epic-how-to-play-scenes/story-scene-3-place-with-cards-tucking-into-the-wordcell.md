---
id: 8
type: story
title: "Scene 3: place with cards tucking into the WordCell"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5]  # HP-1, HP-2, HP-6 are provided by the player and honoured, not covered here
after: [7]
risk: low
---

# Scene 3: place with cards tucking into the WordCell

## Description

Place scene laid out exactly like the game. The word's cards animate into the chosen WordCell leftmost first, each disappearing below the card above it, so the WordCell ends with a single top card and not a stack; order dragging of the free letter stays as in the current scene.

- Current state: scene id `place` (position 3 in the carousel; older comments and tests, e.g. `e2e/how-to-play.spec.ts` and the `place.ts` header, say "scene 4 (place)") was built in 8.3: `src/ui/scenes/place.ts`, `fixtures/how-to-play-place.json`, `text.howTo.scenes.place`. Layout is already the whole-play-area stage and geometry of 8.6/8.7 (`Scene.svelte` place mode): columns, the tray strip, Confirm and WordCells 3 to 10 are drawn; no new geometry. Fixture commands, steps up to the Confirm tap (command 7) and frames 0 to 4 stay unchanged. Changed: the Confirm fly, which today slides the single `strip-4` block (the whole strip) to cell 6, and the final frame, which draws cell 6 as a stack of six cards (`cellCards`) and so becomes one top card.
- Order dragging stays: tile D is dragged to the front (`setPlacementOrder`, command 6; order D B A L K E, R-51: front = bottom); the free letter is L from cell 6, used and gone after Confirm (R-41, R-60, Q-02).
- Tuck: after Confirm the six cards fly to cell 6 as per-card elements in placement order, leftmost first (D B A L K E, R-51), each ending hidden below the card above it, in z-order under the next; E, the last, is the new top card (R-52) and stays visible; nothing is drawn beneath it. The cards are `Card mirror="static"` without `data-card-id`/`data-testid` (AD-14). Timing comes from `motion.ts` `duration('flyToCell')` multiples (no new FACTOR), so Animation speed applies (HP-2). Confirm and the tuck share the final frame as in 8.3; there are no intermediate frames. Reduced motion: Next shows the final frame (one top card, no stack); a closed panel runs nothing; the scene uses the player's existing paths and must not bypass them (HP-1, HP-2).
- Start: the scene keeps its own fixture start (the §8 position, set-up commands 0 to 2) and does not chain from scene 2's end state (no `opens`; the epic's "starts from" wording applies to scene 2 only).
- Caption: unchanged, `text.howTo.scenes.place`, read from `text.ts` as the figure's `Scene.caption` (HP-6); rewording is the owner's.
- Boundary: the tuck is per card (a `QU` card is one card, R-65); only this six-card case is in scope.

Interface: scene script and effects under src/ui/scenes/; fixtures; text.ts caption. No engine source change.
Tests: Engine replay (U); play (P6 android); screenshots. Fixture game content (commands, order, target 6, `cells` after 8 holding D B A L K E, score 36) stays under HP-5 replay with its existing negatives (8.3); the drawn top card of cell 6 equals the last `cells` entry (E). UI unit (AD-n, 'AD-3 scene place' style): the fly order is leftmost first and the final frame draws exactly one card in cell 6, E. Playwright android (P6): reduced-motion Next to the last frame asserts exactly one card in WordCell 6; a play test with motion on reaches the rest frame. Baseline `e2e/how-to-play.screens.spec.ts-snapshots/how-to-play-scene-3-final-android-linux.png` regenerated in the Docker container. Test names start with R-51, R-52 or AD-n, HP ids trailing.
Owns: Scene 3.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay passes; a Playwright android test plays the scene; a final-frame screenshot shows one top card.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-40 to R-42, R-50 to R-52, R-60
