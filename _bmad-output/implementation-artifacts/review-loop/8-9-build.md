# Review loop: ticket 8.9 build (code mode)

State: done
Target: commit range 31d0bb2..HEAD (5aa3ca9), diff `8-9-build.passes/pass0.diff`; intent: story-scene-4-scoring-with-stacks-growing-plan.md
Pre-loop: HEAD 5aa3ca9968ae3c8b7939e96c8a2a819feadf476a, tree 0 2eb6beebaf2e59748b40633b94b74abe4e993718

## Pass 1 — 2026-10-17
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 8, decision-needed 0  |  Dropped in triage: 0
Snapshot: none (no fix pass; converged)
### Applied
- none (zero majors; minors are not applied at convergence)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass

Final status at HEAD 5aa3ca9: npm test pass (76 files, 2940 tests), lint pass, check pass.

### Unapplied minors
1. scoring.ts `stackPoint(cell, cards)`: `cards` always 1; drop the parameter.
2. script.ts `defineScene`: no check that a frame's `stacks` is within the `grows` count or that the k-th grown cell is the k-th `cellScores` cell (rule 6).
3. e2e restart test: single read right after the tap does not confirm the scene is at the wait phase.
4. scenes.test.ts "reveal.show accepts a list": redefined-scene check is vacuous; assert effects on the redefined scene.
5. script.ts `cards < 2` throw branch has no test (or drop it from the plan's applied list).
6. No assertion of which letter is the visible top card (T, T, E); only the Docker baseline covers it.
7. e2e rest-state test reads `transform` but never asserts the top card's translateY 0.
8. Stage.svelte `grow` count mismatch renders unwrapped cards silently; throw instead (rule 6).
