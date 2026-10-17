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

- Current state: scene id `place` (position 3 in the carousel; an older comment in `e2e/how-to-play.spec.ts` says "scene 4 (place)") was built in 8.3: `src/ui/scenes/place.ts`, `fixtures/how-to-play-place.json`, `text.howTo.scenes.place`. Layout is already the whole-play-area stage and geometry of 8.6/8.7 (`Scene.svelte` place mode): columns, the tray strip, Confirm and WordCells 3 to 10 are drawn; no new geometry. Fixture commands, steps up to the Confirm tap (command 7) and frames 0 to 4 stay unchanged. Changed: the Confirm fly, which today slides the single `strip-4` block (the whole strip) to cell 6, and the final frame, which draws cell 6 as a stack of six cards (`cellCards`) and so becomes one top card.
- Order dragging stays: tile D is dragged to the front (`setPlacementOrder`, command 6; order D B A L K E, R-51: front = bottom); the free letter is L from cell 6, used and gone after Confirm (R-41, R-60, Q-02).
- Tuck (technical default; no player change, step ids stay): the fly step stays step 6 (`place-step-6`; `rest` stays 6 x `flyToCell`), so the e2e `lastStep` 6 is unchanged. A new `Step.tucks` (card elements in placement order, start points, one end point, a scale) is expanded in `effects.ts` beside `flies` into six per-card effects `tuck-0` to `tuck-5` (D B A L K E, R-51). Each lasts `times: 6` of `duration('flyToCell')` (no new FACTOR, so Animation speed applies, HP-2) and holds its start via keyframe `offset`s until its turn: card k flies for one multiple, starting when card k-1 lands, so the tuck takes six multiples with nothing overlapping. All end at the exact top-card box of cell 6, scaled from tray-tile to cell-card size, so each covers the previous entirely; nothing fades. The fliers are `Card mirror="static"` (no `data-card-id`/`data-testid`, AD-14) in a `tuck` layer in `Scene.svelte` place mode (motion on only), after the `place-<i>` layers, in DOM order D to E, so card k paints above card k-1 throughout.
- Visible state: at tuck start the frame-4 strip tiles (`strip-4`) and Confirm (new element `confirm`) fade out while the `tuck` layer shows the six fliers on the tile slots, so no tile shows twice. The static cell-6 L (new element `cell6`, frame 4's stack) stays until D lands, then hides (D covers it), so the cell never flashes empty. After the last landing, `place-5` fades in (the existing reveal) as `tuck` fades out; both hold E in the same box, and E is drawn once at rest. All per-card state is WAAPI keyframes only (no runtime inline style), so Pause, tap-restart, Replay, Previous and the loop restore frame 4's look.
- One card: this is the scene's drawing only, per the epic decision of 2026-10-17; R-65 (all cards viewable) is untouched and the fixture `cells` entry (six cards) stays. A new `Frame.cellTop` (place scene's last frame only) makes `cellCards` in `Scene.svelte` return the last card of the stated entry, so the final `place-5` layer renders exactly one Card (E) in cell 6, with motion on or reduced; the `tuck` layer is not rendered under reduced motion. Scoring and the other scenes keep their full stacks. Reduced motion: Next shows the final frame; a closed panel runs nothing; the scene uses the player's existing paths (HP-1, HP-2). Confirm and the tuck share the final frame as in 8.3; there are no intermediate frames.
- Start: the scene keeps its own fixture start (the §8 position, set-up commands 0 to 2) and does not chain from scene 2's end state (no `opens`; the epic's "starts from" wording applies to scene 2 only).
- Caption: unchanged, `text.howTo.scenes.place`, read from `text.ts` as the figure's `Scene.caption` (HP-6); rewording is the owner's.
- Boundary: the tuck is per card (a `QU` card is one card, R-65); only this six-card case is in scope.

Interface: scene script and effects under src/ui/scenes/; fixtures; text.ts caption. No engine source change.
Tests: Engine replay (U); play (P6 android); screenshots. Fixture game content (commands, order, target 6, `cells` after 8 holding D B A L K E, score 36) stays under HP-5 replay with its existing negatives (8.3); the drawn top card of cell 6 equals the last `cells` entry (E). UI unit (AD-n only, never R-id coverage, 'AD-3 scene place' style) on `sceneEffects`: no `strip-4` block fly remains; `tuck-0` to `tuck-5` exist with start times strictly increasing; every flight ends at the same cell-6 point; card k is after card k-1 in DOM order; the last frame is the only one with `cellTop`, the fixture `cells` is unchanged and scoring keeps full stacks. Playwright android (P6): sentence to test, R-51 (leftmost first): the motion-on play test reads the fliers' letters in DOM order D B A L K E and sees running `place-step-6` animations on all six `tuck-k` elements (the `sceneAnimations` helper gains the target's `data-scene-el`), then at rest only `place-rest` runs and cell 6 of `place-5` holds one Card, E; R-52 (E is the top card): the reduced-motion frames test, the only home of the one-card assertion (last frame cell 6 holds exactly one Card, E, equal to the last `cells` entry). One more test: tap to pause mid-tuck, tap to restart, and the first frame equals the initial state (`place-0` shown, `tuck` hidden, L in cell 6). Updated, not new: the reduced-motion frames test in `e2e/how-to-play.spec.ts` (last-frame `cell6` 'DBALKE' becomes 'E'); the play-on-open test (`place-step-6` stays); in `src/ui/scenes/scenes.test.ts` the `strip-4` fly assertion and the last-frame `toStrictEqual` (gains `cellTop`). Only baseline `e2e/how-to-play.screens.spec.ts-snapshots/how-to-play-scene-3-final-android-linux.png` changes, regenerated in the Docker container; the other baselines stay. Playwright test names start with the ids (R-51, R-52, AD-14), HP ids trailing.
Owns: Scene 3.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay passes; a Playwright android test plays the scene; a final-frame screenshot shows one top card.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-40 to R-42, R-50 to R-52, R-60
