---
id: 9
type: story
title: "Scene 4: scoring with stacks growing"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5]  # HP-1, HP-2, HP-6 are provided by the player and honoured, not covered here
after: [8]
risk: low
---

# Scene 4: scoring with stacks growing

## Description

Scoring scene starts as the game looks (WordCells recognisably on the board), animates each WordCell stack downwards to show how many cards it holds, then shows the per-cell numbers and the total; QU counts two.

- Current state: scene id `scoring` (8.3): `src/ui/scenes/scoring.ts`, `fixtures/how-to-play-scoring.json` (cells 3, 4, 6 = CAT, QUIT, BALKED: 3, 3, 6 cards). The shared `Stage.svelte` draws the stacks (`mini`) from the fixture start, today full from frame 0. No layout, `STAGE_H`, `opens` or fixture change; the `MAX_CELL_CARDS` comment stays. 8.8's `Frame.cellTop` is not used (full stacks at the end).
- Frame 0 look (R-52): cells 3, 4, 6 draw only their top card (T, T, E), as the game shows a WordCell; cells 5, 7 to 10 stay empty.
- Growth: new `Step.grows { cell, cards }` on the tap steps. Stage (given the scoring scene's cell numbers, motion on only) wraps each stack card in a `grow-<cell>-<j>` div (j = 0 bottom of the fixture list = top of the drawn stack; `n - 1` is the top card), DOM order j ascending so later cards paint above. Base style from the script: cards j < n-1 opacity 0; the top card `translateY(-(n-1) * STRIP)` (the collapsed look); nothing else inline. Ids join `scoringScene.elements`.
- Order per cell (steps stay four taps; figure reveals 9, 16, 36, total 61): ghost taps the cell's top card (fixed point `stackPoint(cell, 1)`, replacing the height-dependent targets); the stack grows; its figure fades in; step 4 taps the total as today. With g = the step's `times` (2) and n the cards, the grow effects are phase 0 with `times` g + n - 1 multiples of `duration('flyToCell')` (no new kind; Animation speed applies, HP-2), effect easing `'linear'`, and hold for the first g/(g + n - 1) (the ghost's move). Slice m (0 to n-2) spans offsets o_m = (g + m)/(g + n - 1) to o_(m+1): the top card goes from `translateY(-(n-1-m) * STRIP)` to `-(n-2-m) * STRIP` with segment easing `'ease-in-out'`; card m appears (opacity 0 to 1, constant keyframes at o_m) hidden under the top card, so one card appears per slice and the top card ends at today's layout (cell 6's bottom equals today's). n cards need n - 1 moves, so n - 1 slices, not n (3, 3, 6 cards: 2, 2, 5 slices). The figure is the existing phase 1 reveal, so it follows the growth.
- Reduced motion (HP-1, HP-2): five frames, no wrappers: frame 0 top cards only, no figures; frames 1 to 3 draw cell 3, 4, 6 full and show that figure; frame 4 adds total 61. Stack k is full when `numbers > k` (derived in `Scene.svelte`, no new Frame field). The final frame equals today's final look and the animated resting state, so the scene-4 final baseline stays.
- Loop, tap-restart, Replay, Previous restore frame 0 (collapsed, no figures): all state is WAAPI keyframes over the base style, cancelled on restart; Pause freezes. Hidden page and closed panel are the existing player and Carousel mechanism, unchanged.
- QU (Q-06, R-65): stack height counts cards (3, 3, 6), figures count letters (3 x 3 = 9, 4 x 4 = 16, 6 x 6 = 36). QU keeps its x2 badge, no extra emphasis. The badge (top 1 px, 12 px high) sits inside the 20 px `STRIP` that stays visible under the card below, so it is not hidden by overlap.
- Boundary: only this fixture; `defineScene` throws (AGENTS rule 6) when `grows.cards` differs from the fixture start's cell length or `cell` is absent from it. Fixture and engine unchanged.
- Caption: unchanged, `text.howTo.scenes.scoring` (HP-6); rewording is the owner's.

Interface: scene script under src/ui/scenes/; fixture; text.ts caption. No engine source change.
Tests: Engine replay incl. scores (U); play (P6 android); screenshots. Engine replay: the fixture stays (cells 3/4/6, cellScores 9/16/36, total 61, HP-5) with its negatives (total 62, +1 per cell); new named negative: cell 4 stated 12 (QU counted as one) fails the harness. UI unit (AD-n only, never R-id coverage) on `sceneEffects`: grow ids, keyframes, durations, order, the figure after growth, DOM order; the cell 4 stack has 3 Card layers while its figure letters is 4; layout and cell 6's bottom equal today's; `defineScene` throws on a mismatched `cards`. Playwright android (P6): motion-on play test sees running grow animations, then stacks of 3/3/6 cards, the three figures and total 61, and the QU x2 badge visible in cell 4; one test polls mid-growth of cell 6, taps (paused), taps (restart) and asserts frame 0 (top cards only, figures at opacity 0). Updated, not new: `scenes.test.ts` scoring steps/frames/figure tests (tap targets, `grows`); the reduced-motion frames test and play-on-open test in `e2e/how-to-play.spec.ts` (card counts per frame). Screenshots (Docker only): the scene-4 final baseline stays; one new start-frame baseline (frame 0 under reduced motion) via a small test beside the final-frame loop in `e2e/how-to-play.screens.spec.ts`; the others stay.
Owns: Scene 4.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay checks the scores; Playwright android plays the scene.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-80, R-36, R-52, R-65, Q-06

## Notes

- Decision: 2026-10-17, review default taken (the owner reviews all scene captions at the epic end): the Scene 4 caption stays as it is in `text.howTo.scenes.scoring`.
