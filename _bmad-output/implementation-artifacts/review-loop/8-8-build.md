# Review loop: 8.8 build (code, quick, max 7)
State: done
Pre-loop HEAD: 118c2722dfc6b997d629975c752a209d426a7150; target diff: _bmad-output/implementation-artifacts/review-loop/8-8-build.passes/pass0.diff (85b6121..HEAD)
Intent: _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-3-place-with-cards-tucking-into-the-wordcell-plan.md

## Pass 1
Reviewers: correctness, verification gap  |  Findings: major 0, minor 8, decision-needed 0  |  Dropped in triage: 0
No fix pass ran; nothing applied.

## Result — converged after 1 pass
Final state: npm test pass (2933 tests), lint pass, check pass.

### Unapplied minors
- Scene.svelte:398 `confirm` marker tied to `last - 1`; defineScene (script.ts) should throw unless the placed frame is second-to-last.
- place.ts:144-146 tucks step keeps unused `times: 2`; remove or reject in defineScene.
- scenes.test.ts:709 closing `score-3` assertion says nothing about R-52; replace or delete.
- script.ts:77-96 defineScene tucks guards (tucks with flies/reveal, missing placeOrder frame, undeclared `confirm`/`tuck-3`) untested.
- e2e mid-tuck restart test does not check that strip-4/confirm hold effects are cleared after restart.
- e2e motion-on tuck test proves only six concurrent animations, not leftmost-first landing order at runtime.
- scenes.test.ts:631-646 tuck keyframe end-transform assertion is tautological (e2e rect check covers it).
- Scene-3 screenshot baseline: re-run `npm run test:screens` in Docker after the final patches (tolerance 0.01 can hide the six-card to one-card change; DOM tests cover R-52).
