# Review loop — ticket 5.9 build (code mode, 5709d02..bd90124)
State: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-9-build.passes/pass0.diff` (git diff 5709d02..bd90124)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-place-target-order-and-confirm-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD bd90124239a93c0c7cc88a0b28ac4b8adc6f9e84, tree snapshot 0 86949cdd3aca86aee6687e20d4e1d3a9ff8c138c

## Pass 1 — 2026-10-09 22:01
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 4, decision-needed 0  |  Dropped in triage: 2 (duplicates)
Snapshot: tree 86949cdd3aca86aee6687e20d4e1d3a9ff8c138c (no fix pass)
### Applied
- none (no majors; minors are not applied at convergence)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- (duplicate) edge-case and intent-alignment reviewers' tail-selection-in-Place finding, merged into minor 1 below (the correctness reviewer gave the clearest fix)
- (triage note) minor 1 kept minor: the Composing WordCell branch already returns `none` with a tail selection (intent.test.ts:329-330), so the Place branch follows an existing pattern for an unreachable state

## Result — converged after 1 pass
Checks at the final state (HEAD bd90124, no changes): `npm test` 54 files / 2237 tests pass; `npm run lint` pass (199 files); `npm run check` 0 errors, 0 warnings.

Unapplied minors (for the next build or loop):
1. src/ui/gestures/intent.test.ts:363 — pins `none` for a Place WordCell tap with a tail selection, which cannot happen; drop the assertion (alternative raised: throw under rule 6 in intent.ts:141-145 and expect the throw)
2. src/ui/gestures/controller.test.ts:3692 — "opens no view" cannot fail, because the not-legal cell tapped (cell 4) is empty; tap a non-empty not-legal cell or drop the clause from the name (the case is covered by intent.test.ts and the R-61 P5)
3. e2e/place.spec.ts:72-91 `expectSaved` — polls until storage matches, so a deferred save would still pass R-73; add a non-polling comparison first, or count the `wordcell:session` writes right after Confirm in the R-60 redo-tail test
4. e2e/place.spec.ts R-39 drag4/drag6 (l. 397-401) and the cell 5 / cell 3 long-press tests — the drag relies on the 8 px move beating the 400 ms timer in real time (assert no peek and an unchanged targetCell so a lost race fails clearly), and the long-press tests check only the final targetCell (arm the storage spy and assert one write with placementOrder and cursor unchanged)
