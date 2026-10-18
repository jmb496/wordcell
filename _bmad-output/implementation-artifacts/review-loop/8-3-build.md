# Review loop: ticket 8.3 build (76fc0b4..HEAD)

State: done
Pre-loop: HEAD 1fb031f987f93ff0f381522042bdaab68a68ea81; diff `8-3-build.passes/pass0.diff`; intent: story-place-and-scoring-scenes-plan.md

## Pass 1
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 9, decision-needed 1  |  Dropped in triage: 0 (3 duplicates merged)
Snapshot: tree fd65379e26efbfd2055629ff9eb025ebb3eb8f6f (npm test 2838 pass, lint pass, check pass)
### Applied
- [major] e2e/how-to-play.spec.ts — place test asserted only counts; now asserts target and lit cell numbers per frame → fixer 1
- [minor] scenes.test.ts Q-06 asserted `validate` on frames that draw Confirm → limited to frame 0 → 2
- [minor] how-to-play-scenes.test.ts sum-mismatch test only hit missing scores; branch unreachable, removed, test renamed → 3
- [minor] command-4 setTarget test now asserts index → 4
- [minor] scene-replay.ts absent cell fails explicitly, negative test → 5
- [minor] Scene.svelte silent defaults for scoring/place fixture fields now throw → 6
### Default applied (technical)
- Scene.svelte defaults — fail fast per AGENTS rule 6
### Decision needed (functionality / UX / gameplay)
- place scene column 3 (Scene.svelte landed branch, ticket "destination column whole") — column 3 still shows the B card during scene 4 while B is also in the word strip/cell 6, so B appears twice — proposed default: keep as the ticket prescribes
### Dropped
- unapplied minors: pointer-ghost fade-in also affects scenes 1-3 (note only); scoreFigure/total wording unreviewed by owner; cell-6 used/borrowed state (R-41/R-60/Q-02) not asserted by a named test

## Pass 2
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 4, decision-needed 0  |  Dropped in triage: 0
### Open major (not fixed: two consecutive passes with at most one major)
- [major] fixtures/how-to-play-place.json `cells` (only `after: 8`) and Scene.svelte cellCards — frames 0 to 4 draw WordCell 6 from `start.cells` (hand-written, e2e pins 'L'), never engine-checked mid-scene; add `cells` entries for cell 6 (and 3 to 5 if drawn empty) at after 3 to 7
### Unapplied minors
- scenes.test.ts Q-06 Validate test checks only frame 0; rename, drop dead branches, drop Q-06 from name
- R-36 cited for the QU scoring figure in scenes.test.ts and e2e; Q-06 is the QU rule
- pass 1 minors: ghost fade-in affects scenes 1-3; scoreFigure/total wording unreviewed by owner; cell-6 used/borrowed (R-41/R-60/Q-02) unasserted

## Result — converged after 2 passes
open major: place fixture cell 6 mid-frame state not engine-checked (see Pass 2)
Final: npm test 2838 pass, lint pass, check pass.
