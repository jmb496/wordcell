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

Updates the Place scene (`src/ui/scenes/place.ts`, `Scene.svelte`) so frames 1–4 (those with a `placeOrder`) draw the preview as the game does (Q-49), while frame 0 (the tray frame) keeps cell 6 used, superseding epic 8 D5 for frames 1–4 only. Frame 5 and the other scenes, including free-letter's Validate-pressed frame, are unchanged (E7).

The preview is engine-checked like every other drawn scene fact (AD-3): `fixtures/how-to-play-place.json` keeps its start, commands and existing entries (this supersedes tickets.toml entry 4's "unchanged" clause) and gains a `previews` list (per Place step: `after`, `cell`, `top` a letter (`'QU'` for the QU card) or `null`, `count`) for each changed cell; when a fixture has `previews` (only the place fixture does), `src/engine/scene-replay.ts` range-checks each entry's `after` (`index()`) and checks that at every after from 0 to `commands.length` the cells with a `view().cells[].preview` and the listed entries match exactly (so an after with no entries, e.g. 3 and 8, proves no preview); `SceneFixture` (scene-replay.ts) and `SceneFixtureData` (types.ts) gain an optional `previews`. `Frame` gains an optional `after` (the fixture command count the frame shows), set in place.ts on frames 1–4 (4–7); Scene.svelte draws each frame's changed cells from the `previews` entries at `frame.after` and throws (CLAUDE.md rule 6, as `needed()` does) when a `placeOrder` frame has no `after` or no entry at it; frames 1–4 drop `cell6` (only frame 0 keeps `'used'`).

Frames are 0-based indexes of `placeScene.frames`:

| Frame | Drawn |
| --- | --- |
| 0 (tray) | cell 6 shows L in the used look, no ★ |
| 1, 3 | cell 6 (target) shows only D with the ★, never L |
| 2 | cell 5 (target) shows only D with the ★; cell 6 shows no card (empty, ringed as legal) and no ★ |
| 4 | cell 6 (target) shows only E with the ★ |
| 5 | unchanged: cell 6 one top card E, no ★ |

Frames 1–4 draw no used card. The previewed top is a `mirror="static"` Card with `previewMark` (Card.svelte), not the `preview` mirror kind, so scene copies keep no `data-mirror-of` (AD-14). Card.svelte gains an optional `markEl?: string` that writes `data-scene-el` on the `.preview-mark` span; only Scene.svelte passes it, as `mark-<i>` on the last `placeOrder` frame's target only (WordCellRow does not); effects.ts derives that id as it does `stripId`, and defineScene's tucks `needs` (script.ts) includes it.

With motion on, the ★ on frame 4's target goes in phase 0 of the tuck fly step (`place-step-6`), after its `wait`, with `strip-4` and `confirm`: the scene's commit moment (E6). `mark-4`, listed in place.ts `elements`, is held at opacity 0 in that step's phase-0 holds (effects.ts), while the previewed top E stays drawn on cell 6 in `place-4` under the tuck fliers until `place-5` (E6, DESIGN.md WordCell). Under reduced motion the frame 4 to frame 5 step is unchanged.

Stage.svelte counter-scales `.card .preview-mark` by `--wc-scene-up` as the badge: size and font, not the inset, as it does `.card .badge` and `.card .mark` (epic 8 D12).

Code comments citing D5 for frames 1–4 (place.ts header, the scenes.test.ts `AD-14 frame cell 6 state` comment, the e2e place test comment) cite Q-49 for frames 1–4 and keep D5 for frame 0 (Scene.svelte's frame-0 comment stays). The epic 8 Notes are not edited; this epic's Notes record the supersession.

Owner decision (Jared, 2026-10-29, the review's decision-needed item): the scene's previewed WordCell draws no count badge, only the new top letter with the `★`; every scene frame stays badge-free.

## Acceptance Criteria

Verify:

- `src/engine/how-to-play-scenes.test.ts` has a new test named with Q-49 that the `previews` entries match the engine, and a Q-49 `it.each` negative case where each of a wrong `top`, a wrong `count`, a missing entry (cell 6's `null` at after 5 removed) and an extra entry for an unchanged cell fails the harness; the AD-2 out-of-range test (`AD-2 a fixture index out of range or negative fails …`) covers a `previews` `after`.
- `src/ui/scenes/scenes.test.ts` asserts the frame table above in both motion modes where the existing layer tests run, asserts `frame.after` equals the applied command count on frames 1–4 and is absent on frames 0 and 5, and an AD-14 Q-49 case throws rendering a `placeScene` copy whose frame 2 `after` names an after with no entries (e.g. 3), and one with frame 2's `after` removed; the effects/tuck test (`AD-14 the tuck: six fliers D B A L K E …`, Q-49 added) asserts no effect of the fly step targets `place-4` and `mark-4` is held at opacity 0 in the fly step's phase 0.
- The tests that pin D5 for frames 1–4 are updated, not deleted, their names reworded to the Q-49 behaviour with Q-49 added (e.g. "cell 6 is used in frame 0 only"): scenes.test.ts `AD-14 R-40 R-33 scene place: not-legal cells dim in Place and cell 6 is used until Confirm …`, and in the `AD-14 frame cell 6 state against the fixture commands` describe both the case `AD-14 R-33 scene place: cell 6 is used from frame 0 through frame 4, and Confirm ends it` and the shared `it.each` `AD-14 R-33 scene %s: cell 6 is drawn used exactly while the applied fixture commands hold its top card`, whose place row expects `cell6: 'used'` only on frames without a `placeOrder` (other scenes, free-letter's Validate-pressed frame included, keep the used look).
- `src/ui/scenes/stage.test.ts` `AD-11 scene text stays at or above 11 px …` covers `.card .preview-mark`.
- `e2e/how-to-play.spec.ts`: the reduced-motion test `R-40 R-42 R-50 R-51 R-52 R-60 AD-14 with reduced motion scene place steps through 6 frames to its last` (Q-49 added) has the frame table above in its per-frame table; the motion-on test `R-51 R-52 AD-14 with motion on the place scene tucks D B A L K E …` (Q-49 added) asserts, while the `place-step-6` `tuck-*` animations run, that `[data-scene-el="mark-4"]` has computed opacity 0 and `place-4`'s cell 6 glyph is E.
- scenes.test.ts `AD-3 scene place: six layers, strips on frames 1 to 4, Confirm, no tail, no ids` (its `not.toContain('data-mirror-of')` assertion) covers the previewed top.
- `e2e/how-to-play.screens.spec.ts` adds one `android` baseline (AD-17), test `AD-17 how to play scene 3 frame 4 screenshot at 360 px`, snapshot `how-to-play-scene-3-frame-4.png`: frame 4 (four Next clicks under reduced motion, strip D B A L K E, cell 6 showing E with the ★); no other baseline changes.
- `npm run test:all` and `npm run test:screens` pass.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- code — src/ui/scenes/place.ts, src/ui/scenes/Scene.svelte, src/ui/scenes/Stage.svelte, src/ui/scenes/types.ts, src/ui/scenes/effects.ts, src/ui/scenes/scenes.test.ts, src/ui/scenes/stage.test.ts, src/engine/scene-replay.ts, src/engine/how-to-play-scenes.test.ts, fixtures/how-to-play-place.json, e2e/how-to-play.spec.ts, e2e/how-to-play.screens.spec.ts, src/ui/Card.svelte (`previewMark`, `markEl`)
- decision — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md, Notes D5, D12
