---
id: 4
type: story
title: "How to play Place scene preview"
parent: epic-place-preview
covers: [E7]
after: [3]
risk: low
---

# How to play Place scene preview

## Description

Updates the Place scene (`src/ui/scenes/place.ts`, `Scene.svelte`) so frames 1–4 (those with a `placeOrder`) draw the preview as the game does (Q-49), while frame 0 (the tray frame) keeps cell 6 used, superseding epic 8 D5 for frames 1–4 only. Frame 5 is unchanged.

The preview is engine-checked like every other drawn scene fact (AD-3): `fixtures/how-to-play-place.json` keeps its start, commands and existing entries and gains a `previews` list (per Place step: `after`, `cell`, `top` letter or `null`, `count`) for each changed cell; `src/engine/scene-replay.ts` checks it against `view().cells[].preview` and that no other cell has a preview; `SceneFixtureData` (types.ts) gains `previews`. Scene.svelte draws each frame's changed cells from that frame's entry, never from the cell number; frames 1–4 drop `cell6` (only frame 0 keeps `'used'`).

Frames are 0-based indexes of `placeScene.frames`:

| Frame | Drawn |
| --- | --- |
| 0 (tray) | cell 6 shows L in the used look, no ★ |
| 1, 3 | cell 6 (target) shows only D with the ★, never L |
| 2 | cell 5 (target) shows D with the ★; cell 6 shows no card (empty, ringed as legal) and no ★ |
| 4 | cell 6 (target) shows only E with the ★ |
| 5 | unchanged: cell 6 one top card E, no ★ |

Frames 1–4 draw no used card. The previewed top is a `mirror="static"` Card with `previewMark` (Card.svelte), not the `preview` mirror kind, so scene copies keep no `data-mirror-of` (AD-14).

With motion on, from the Confirm tap the ★ on frame 4's target goes (a declared scene element in `elements`, held at opacity 0 with the strip and Confirm), while the previewed top E stays under the tuck fliers until `place-5` (E6, DESIGN.md WordCell). Reduced motion is unchanged.

Stage.svelte counter-scales `.card .preview-mark` (pill size and font) by `--wc-scene-up`, as it does `.card .badge` and `.card .mark` (epic 8 D12).

Code comments citing D5 for frames 1–4 (place.ts header, the scenes.test.ts `AD-14 frame cell 6 state` comment, the e2e place test comment) cite Q-49 for frames 1–4 and keep D5 for frame 0 (Scene.svelte's frame-0 comment stays). The epic 8 Notes are left for entry 5's close-out.

## Acceptance Criteria

Verify:

- `src/engine/how-to-play-scenes.test.ts` has a new test named with Q-49 that the `previews` entries match the engine, and a negative case (a wrong preview entry fails the harness).
- `src/ui/scenes/scenes.test.ts` asserts the frame table above in both motion modes where the existing layer tests run, and the effects/tuck test (`AD-14 the tuck: six fliers D B A L K E …`) asserts the ★ held at 0 from Confirm while the previewed top stays.
- The tests that pin D5 for frames 1–4 are updated, not deleted, with Q-49 added to their names: scenes.test.ts `AD-14 R-40 R-33 scene place: not-legal cells dim in Place and cell 6 is used until Confirm …`, and the `AD-14 frame cell 6 state against the fixture commands` describe (its case `AD-14 R-33 scene place: cell 6 is used from frame 0 through frame 4, and Confirm ends it`).
- `src/ui/scenes/stage.test.ts` `AD-11 scene text stays at or above 11 px …` covers `.card .preview-mark`.
- `e2e/how-to-play.spec.ts`: the reduced-motion test `R-40 R-42 R-50 R-51 R-52 R-60 AD-14 with reduced motion scene place steps through 6 frames to its last` (Q-49 added) has the frame table above in its per-frame table; the motion-on test `R-51 R-52 AD-14 with motion on the place scene tucks D B A L K E …` asserts no ★ from the Confirm tap and E on cell 6 under the fliers.
- `src/ui/how-to-play.test.ts` stays green (scene cards stay static).
- `e2e/how-to-play.screens.spec.ts` adds one `android` baseline (AD-17), test `AD-17 how to play scene 3 frame 4 screenshot at 360 px`, snapshot `how-to-play-scene-3-frame-4.png`: frame 4 (four Next clicks under reduced motion, strip D B A L K E, cell 6 showing E with the ★); no other baseline changes.
- `npm run test:all` and `npm run test:screens` pass.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- code — src/ui/scenes/place.ts, src/ui/scenes/Scene.svelte, src/ui/scenes/Stage.svelte, src/ui/scenes/types.ts, src/ui/scenes/effects.ts, src/ui/scenes/scenes.test.ts, src/ui/scenes/stage.test.ts, src/engine/scene-replay.ts, src/engine/how-to-play-scenes.test.ts, fixtures/how-to-play-place.json, e2e/how-to-play.spec.ts, e2e/how-to-play.screens.spec.ts, src/ui/Card.svelte (`previewMark`)
- decision — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md, Notes D5, D12
