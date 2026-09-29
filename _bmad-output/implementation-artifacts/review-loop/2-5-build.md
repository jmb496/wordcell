# Review loop — ticket 2.5 build (code mode)
State: pass 2: done

Target: `19f8d8d..HEAD` (commit a489441), diff at `2-5-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-validate-and-place-commands-with-the-8-worked-example-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD a489441, tree snapshot 0 f1e8d5c0cf87a66331bd4753beed8b4e09d04a5f

## Pass 1 — 2026-09-29 05:53
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree f91ea918540be1e1baf09ab2724f6de5a187229b  |  Fix: second R-60 test (confirm on `PLACE`, reached place → committed), custom-order case in the R-52 test, plan test list and mapping lines  |  Checks: `npm test` 647/647, lint pass, check 0 errors
### Applied
- [major] `src/engine/commands.test.ts` `R-60 confirm discards the redo tail, …` — runs only on `PLACE_TAIL`, whose draft is already `reached: 'committed'`, so R-60's "then commits and sets `reached = 'committed'`" has no R-60-named test that can fail (edge-case lens; reclassified minor → major: missing test for a stated rule sentence) → fixer item 1
- [minor] `src/engine/commands.test.ts` `R-52 after BALKED is confirmed onto cell 6, …` — default order makes placementOrder top, arrangement top and word's last letter all D, so pushing the arrangement instead of the order would pass → fixer item 2
### Default applied (technical)
- R-60 coverage → add a confirm-on-`PLACE` (no tail, `reached: 'place'`) case to the R-60 test
- R-52 → keep the default-order case (ticket review-log item 8) and add a custom-order case whose top is not D
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (correctness and intent-alignment lenses returned no findings)

## Pass 2 — 2026-09-29 06:10
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree f91ea918540be1e1baf09ab2724f6de5a187229b (no fix pass: stopping rule met)  |  Checks: `npm test` 647/647, lint pass, check 0 errors (orchestrator run on this tree)
### Applied
- none (stopping rule: zero majors)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (fix-diff, edge-case and intent-alignment lenses returned no findings)

## Result — converged after 2 passes

Unapplied minors (for the next build or loop):
- `src/engine/commands.test.ts` `expectLegalTargets` / `R-40 R-42 …` tests — R-42's `placementOrder` = word order clause is asserted only in tests named `R-38 R-71 … R-42 / R-51 defaults`, `R-51 …` and `§8 …`, none starting with R-42 → proposed: assert `placementOrder` equals `word(...).cards` in `expectLegalTargets`, or rename the R-51 default-order test `R-42 R-51 …`
- `src/engine/commands.test.ts` setPlacementOrder tests — every reorder runs on a draft whose `targetCell` is still the validate default, so an implementation resetting the target on reorder would pass → proposed: in the R-51 test run setTarget(4) then setOrder(custom) and assert `targetCell` stays 4
