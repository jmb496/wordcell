---
title: 'Scene 4: scoring with stacks growing'
type: 'feature'
ticket: '9'
created: '2026-10-17'
status: done
baseline_revision: '31d0bb29237d73ab027596234860d78b167a8a88'
route: 'full'
route_source: 'auto'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-4-scoring-with-stacks-growing.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-4-scoring-with-stacks-growing.review-log.md'
warnings: [oversized]
deferred: []
---

<intent-contract>

## Intent

**Problem:** The scoring scene draws full stacks from frame 0 (HP-3); the game shows one top card per WordCell (R-65).

**Approach:** Start each stack as its top card, grow the three stacks one after another (stacks first, owner decision 2026-10-17), then fade in 9, 16, 36 together and the total 61. The ticket file is the full specification.

## Boundaries & Constraints

**Always:** Follow the ticket bullets and the Always list of plans 8.1 to 8.8. Durations from motion.ts, text in text.ts, AGENTS rule 6 throws in `defineScene`.

**Never:** Change the engine, the fixture, STAGE_H, the caption; modify bga-wordcell; add fallbacks; push; generate screenshot baselines on the host.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Motion on | play | stacks 3, 4, 6 grow in turn, figures together after the third, then total | none |
| Reduced motion | Next x5 | six frames: 1/1/1, 3/1/1, 3/3/1, 3/3/6 cards, figures, total | none |
| Bad `grows` | non-tap, unknown cell, wrong count, repeated cell, missing `grow-` id, array `show` on arrange | `defineScene` throws | throw |

</intent-contract>

## Code Map

- `src/ui/scenes/types.ts` -- `Step.grows`, `reveal.show` string or list, `Frame.stacks`
- `src/ui/scenes/geometry.ts` -- `liftedBy` (one px-string helper); `stage.ts` -- `growBase`
- `src/ui/scenes/effects.ts` -- grow effects on tap; list `show`; `script.ts` -- validation
- `src/ui/scenes/Stage.svelte` -- optional `grow` prop, wrappers `grow-<cell>-<j>`; `Scene.svelte` -- `grow`, per-frame `stageCells`
- `src/ui/scenes/scoring.ts` -- steps, targets, elements, six frames
- `src/ui/scenes/scenes.test.ts`, `src/engine/how-to-play-scenes.test.ts`, `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts`

## Tasks & Acceptance

**Execution:**
- [x] source files above -- implemented per the ticket
- [x] unit tests (AD-14 keyframe arithmetic, SSR wrapper order and base style, defineScene throws, engine negative QUIT 12)
- [x] e2e: reduced frames with card counts, stacks-first play, Q-06 badge, AD-14 restart, reduced toggle, layout equality
- [x] Docker: `npm run test:screens -- e2e/how-to-play.screens.spec.ts -g "scene 4" --update-snapshots` ran in the container: the scene-4 final baseline is unchanged (passes), the new start baseline was written

**Acceptance Criteria:**
- Given motion on, when the scene plays, then stacks grow 3, 4, 6 before any figure shows, and rest equals the reduced final frame.
- Given reduced motion, when Next is pressed, then six frames show the card counts above.

## Implementation Notes

Dispositions of the review log's unapplied minors:
- Applied: Stage base style pinned to the t=0 keyframes on SSR `body(scoringScene)` with one px helper (`liftedBy`), comparing with whitespace and -0 normalised; opacity step keyframes as duplicated offsets at o_m, list pinned in the unit test; `grows` n<2 throws; test names carry AD ids; rest-sync poll filters by `scoring-` id prefix and playState; long motion-on tests set `test.setTimeout(60_000)`; step-1 polls get `timeout: 30_000`; step-length formula tested (6, 5, 8.5, 3.5); engine QUIT-12 negative labelled regression-only; frame 0 identical in both modes (SSR counts only).
- Not applied: `grows.cell` vs step target check and an ungrown fixture cell check (targets are free-form ids; the unit test pins the k-th grown cell to the k-th `cellScores` cell instead); the restart read window stays a single evaluate right after the tap, inside step 0's 2-multiple wait.
- Stack-height clause of the layout check kept (cell 6 last-card box); reduced-motion locator is `[data-cell] .card`.
- Start-frame screenshot has its own test (`how-to-play-scene-4-start`), zero Next clicks; baseline generated in Docker and viewed (top cards T, T, E).
- `npm run test:all` passed. The full `npm run test:screens` (all scenes) was not rerun; the formal bmad-code-review step was not run (owner or /review-loop can do it).

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- Docker; generate the new start baseline and compare the final one
