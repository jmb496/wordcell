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

Adds scene 4 (place BALKED: cells 3–6 lit, 6 pre-selected, tap 5 then 6, drag D to the front, Confirm, fly to cell 6, HP-3d) and scene 5 (cells 3, 4 and 6 holding CAT, QUIT and BALKED, per-cell numbers 9, 16, 36, total 61, QU counting two, HP-3e), each with its caption in text.ts and an engine-replayed fixture in 8.2's format, captions the epic Notes' verbatim in text.ts `howTo.scenes` (`place`, `scoring`), each the figure's `Scene.caption` (HP-6).

- Scene 4 (§8 start; `scene` `place`): fixtures/how-to-play-place.json. Commands: 0 drop column 1 count 4 to column 3, 1 arrange A K E D, 2 addFreeLetter cell 6 index 1, 3 validate (R-42 pre-selects target 6; cells 3 to 6 lit, R-40), 4 setTarget 5, 5 setTarget 6, 6 setPlacementOrder, 7 confirm. Words entries as 8.2; no rejected entries. Order bottom to top D B A L K E (CardIds 6 3 0 24 22 8 from `startOf`; 'front' = bottom, R-51; E on top becomes the free letter, R-52). After confirm cell 6 holds exactly BALKED, the cell-6 L used (R-41, R-60, Q-02).
- Scene 5 (`scene` `scoring`): fixtures/how-to-play-scoring.json. Cells-only start on purpose, off the rulebook position (the engine start needs one undrawn column card, `Z`): cell 3 C A T, cell 4 QU I T (`QU` one card), cell 6 B A L K E D bottom to top, scene 4's end order. `commands` [], `scores` [{after 0, score 61}]; no dictionary entries. Per-cell 9, 16, 36 (letters x cell number, QU = 2, Q-06, R-80; R-36 is only the 3-letter floor).
- Frames (reduced motion, frame i = state after step i; Frame gains target and lit cells, order, per-cell numbers, total). Scene 4: start, validated (lit 3 to 6, target 6), target 5, target 6, order D B A L K E, final after Confirm (cell 6 BALKED). Scene 5: start, then 9, 16, 36 revealed one by one, final with total 61.
- Steps: scene 4 taps WordCell 5 and 6 animate commands 4 and 5, dragging D 6, Confirm tap 7 then the fly; `defineScene` also matches setTarget (tap WordCell), setPlacementOrder (drag D) and confirm (tap Confirm). Scene 5 has no command steps.
- New static visuals: placement strip, Confirm, per-cell numbers, inert markup in the aria-hidden node, as 8.1.

Interface: src/ui/scenes/ (place and scoring scripts; `SceneFixtureData` gains the optional fields below, AD-1); new fixtures and text.ts howTo captions; src/engine/scene-replay.ts `SceneFixture` gains optional `cells: {after, cell, cards}[]` (letters bottom to top, asserted against `viewFrom` cells), `place: {after, target, legalTargets, order}[]` (against `viewFrom` place, R-40, R-42, R-51) and `cellScores: {after, cell, score}[]` (letters x cell, summing to the checked `scores` total); `after` range-checked 0..count like `scores`.
Tests: engine replay incl. placement and scores (U): FIXTURES gains both, `rejectedWords` all undefined; negatives: 61 to 62, a changed placement order, a changed per-cell number, an out-of-range `after`, BALKED missing from `DICT`; script-vs-fixture coverage and drawn state per frame (U, AD-n); play to the last frame by reduced-motion Next, asserting final content (P6 android); final-frame screenshots (screens). Names: R-40, R-42, R-50 to R-52, R-60, R-80, Q-06, AD-n (UI unit), HP ids trailing.
Owns: scenes 4 and 5 and their captions.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright android tests that play both scenes to their last frame, a final-frame screenshot baseline of each, and an engine replay that checks the placement order and the 61 total and fails when a stated number is changed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md (HP-3d, HP-3e, HP-5, HP-6, Notes)
- continuity — story-scene-player-first-scene-and-engine-replay-harness.md (8.1), story-compose-and-destination-block-scenes.md (8.2) and their plans
- rules — docs/game-flow-spec.md, R-36, R-40 to R-42, R-50 to R-52, R-60, R-80, Q-02, Q-06, §8
- code — src/ui/scenes, fixtures/how-to-play-compose.json, src/engine/scene-replay.ts, src/engine/commands.test.ts TABLE
- constraint — ARCHITECTURE-SPINE.md#ad-1
