# Review loop — ticket 2.12 build (code mode)
State: pass 1: done

Target: `3a26472..HEAD` (commit dee02da), diff at `2-12-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-refactor-sweep-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD dee02da, tree snapshot 0 4689dd226ce12774fe0bdde04992e0fe1cd689a9

## Pass 1 — 2026-09-29
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 6, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 4689dd226ce12774fe0bdde04992e0fe1cd689a9 (no fix pass; HEAD dee02da). Orchestrator: `npm test` 1391 passed (2.61 s), lint pass, check 0 errors.
### Applied
- none (stopping rule: zero majors, converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case lens `LABELLED['Idle with a pending draft']` minor — duplicate of the verification-gap lens finding (kept once below)

## Result — converged after 1 pass

Unapplied minors (for a later build or loop):
- `src/engine/commands.test.ts` expectLegalTargets `// R-42` assertion — expected order comes from `word(...).cards`, the same function validate uses, so it cannot catch a wrong word order; add a literal-order R-42 case (left side, k ≥ 1, interleaved free letter).
- `src/engine/view.test.ts` LABELLED['Idle with a pending draft'] — also satisfied by PENDING_COMMITTED/PENDING_TAIL; add `expect(draftOf(s).reached).toBe('composing')`.
- `src/engine/view.test.ts` LABELLED['Composing k = n − 1'] / ['Composing k = 1'] — do not exclude the degenerate n = 1 cases; add `destinationCount > 0` and `remainderOf(s).length > 1` respectively.
- `src/engine/view.test.ts:29` — local `DICT` (on LANG) left beside the shared `play` (test-helpers DICT on EN); import DICT from test-helpers and drop the copy.
- `story-refactor-sweep-plan.md` Code Map last bullet — still maps 2.2 to the golden-deal plan; the Plan Change Log says 2.2 is the langdata plan.
- `story-refactor-sweep-plan.md` Implementation Notes — S6 row names the pre-rename test; Verification row's 1376 count predates the review patches (1391 now).
