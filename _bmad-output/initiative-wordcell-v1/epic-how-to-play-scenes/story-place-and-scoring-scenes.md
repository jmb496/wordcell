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

Adds scene 4 (place BALKED: cells 3–6 lit, 6 pre-selected, tap 5 then 6, drag D to the front, Confirm, fly to cell 6, HP-3d) and scene 5 (cells 3, 4 and 6 holding CAT, QUIT and BALKED, per-cell numbers 9, 16, 36, total 61, QU counting two, HP-3e), each with its caption in text.ts and an engine-replayed fixture in 8.2's format; captions are the epic Notes' verbatim in text.ts `howTo.scenes` (`place`, `scoring`), each the figure's `Scene.caption` (HP-6).

- Scene 4 (§8 start; `scene` `place`): fixtures/how-to-play-place.json. Commands: 0 drop column 1 count 4 to column 3, 1 arrange A K E D, 2 addFreeLetter cell 6 index 1, 3 validate (R-42 pre-selects target 6; cells 3 to 6 lit, R-40), 4 setTarget 5, 5 setTarget 6, 6 setPlacementOrder, 7 confirm. Words entries as 8.2, none rejected. Order bottom to top D B A L K E (CardIds 6 3 0 24 22 8; 'front' = bottom, R-51). After confirm cell 6 holds BALKED, top E (R-52), the cell-6 L used (R-41, R-60, Q-02).
- Scene 5 (`scene` `scoring`): fixtures/how-to-play-scoring.json. Cells-only start, off the rulebook position: cell 3 C A T, cell 4 QU I T (`QU` one card), cell 6 D B A L K E bottom to top. `start.columns` [["Z"]], ignored. `commands` [], `scores` [{after 0, score 61}]; no dictionary entries. Scene 4 gains `scores` [{after 8, score 36}] with `cells`/`cellScores` entries at after 8 (cell 6 only), and no `validatable` entry (scene 4 draws no Validate). Per-cell 9, 16, 36 (Q-06, R-80).
- Frames (reduced motion; frame i+1 = after step i, the fly shares the final frame; Frame gains `placeTarget` (number), `lit` (number[]), `placeOrder` (letters; fixture `place.order` is CardIds), `numbers` (count of revealed cell numbers) and `total` (number); place and scoring frames have `tail` 'gone', `tray` false, `order` absent, keeping the `tray === (order !== undefined)` test). Scene 4 (commands 0 to 2 are set-up): start (after 3), validated (after 4; lit 3 to 6, target 6), target 5 (after 5), target 6 (after 6), order D B A L K E (after 7), final (after 8, cell 6 D B A L K E). Scene 5 (all after 0): start, then `numbers` 1, 2, 3 for 9, 16, 36, final with `total` 61 (four tap steps; the pointer ghost is a build-plan choice, tests do not read pointer position).
- Steps: scene 4 animates commands 3 to 7: tap Validate 3, taps WordCell 5 and 6 4 and 5, dragging D 6 (a `move` step), Confirm tap 7 then the fly (command-less); COMMAND_TYPES gains `tap`: setTarget, confirm and `move`: setPlacementOrder. Scene 5 steps are commandless `tap` steps with a `reveal`. 8.2's coverage test (steps cover all commands in order) skips scene 4's set-up prefix, commands 0 to 2.
- New static visuals: placement strip, Confirm, per-cell numbers, inert markup in the aria-hidden node, as 8.1.

Interface: src/ui/scenes/ (place and scoring scripts; `SceneFixtureData` gains the optional fields below, AD-1); src/engine/scene-replay.ts `SceneFixture` gains optional `cells: {after, cell, cards}[]` (letters bottom to top, `'QU'` for the QU card, asserted against `viewFrom` cells), `place: {after, target, legalTargets, order}[]` (`order` CardIds bottom to top, against `viewFrom` place, R-40, R-42, R-51; after 4 to 7 only, place phase) and `cellScores: {after, cell, score}[]` (each non-empty cell's letters x cell from `viewFrom`; a mismatch or missing cell fails; the sum equals `scores` at that `after`); `after` range-checked 0..count like `scores`. `Scene.carry` becomes optional; Scene.svelte draws no column cards, tail or tray without it (scene 5's `Z` is not drawn).
Tests: engine replay incl. placement and scores (U): FIXTURES gains both, `rejectedWords` all undefined; scoring (`commands` []) is exempt from the `moves.length > 0` check, with its own replay test; negatives: 61 to 62, a changed placement order, a changed per-cell number, an out-of-range `after`, BALKED missing from `DICT` (the EngineError at command 4 setTarget: a rejected validate leaves composing); script-vs-fixture coverage and drawn state per frame (U, AD-n); play to the last frame by reduced-motion Next (P6 android); final-frame screenshots (screens). Names: R-40, R-42, R-50 to R-52, R-60, R-80, Q-06, AD-n (UI unit), HP ids trailing.
Owns: scenes 4 and 5 and their captions.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright android tests that play both scenes to their last frame, a final-frame screenshot baseline of each, and an engine replay that checks the placement order and the 61 total and fails when a stated number is changed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md (HP-3d, HP-3e, HP-5, HP-6, Notes)
- continuity — story-scene-player-first-scene-and-engine-replay-harness.md (8.1), story-compose-and-destination-block-scenes.md (8.2) and their plans
- rules — docs/game-flow-spec.md, R-40 to R-42, R-50 to R-52, R-60, R-80, Q-02, Q-06, §8
- code — src/ui/scenes, fixtures/how-to-play-compose.json, src/engine/scene-replay.ts, src/engine/commands.test.ts TABLE
- constraint — ARCHITECTURE-SPINE.md#ad-1
