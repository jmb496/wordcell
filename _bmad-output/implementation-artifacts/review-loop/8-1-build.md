# Review loop log — ticket 8.1 build (code mode)

State: pass 1: review
Target: commit range 6a8ad66..HEAD (bbf44c3), diff at 8-1-build.passes/pass0.diff
Intent: _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-player-first-scene-and-engine-replay-harness-plan.md
Pre-loop: HEAD bbf44c3, tree snapshot 0 = d18a9e228153d1e08e51131f38e7f4a6e6cbd6fb
State: pass 1: done

## Pass 1 — 2026-10-16
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 11, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (no major; minors not applied at convergence)
### Decision needed
- none
## Result — converged after 1 passes

### Unapplied minors
- how-to-play-scenes.test.ts:392 wrong score hardcoded 6/7; derive engine score + 1.
- how-to-play-scenes.test.ts:447 dictionary repro test vacuous for the moves-only fixture.
- e2e/how-to-play.spec.ts:210 closed-panel test passes even if Scene effect never destroys the player; add unmount unit test.
- e2e/how-to-play.spec.ts:238 and scenes.test.ts:1295 reduced-motion frames don't pin exact poses.
- e2e/how-to-play.spec.ts:257 Slow/Fast uses one browser context; use newContext.
- plan: example baseline not regenerated (triage says unchanged) — state it; task checkboxes still `[ ]`.
- player.ts hiddenStop only at step/loop boundaries (documented residual risk); reword matrix row.
- scene-replay.ts:108 rejectedWord outcome doesn't assert session unchanged; throw without `check` gives confusing message.
- Scene.svelte/script.ts: defineScene doesn't range-check carry count/columns.
Final state: npm test, lint, check all pass.
