# Review loop — ticket 3.4 build (code, d7df29c..c581c0d)

State: pass 2: done

Target: `_bmad-output/implementation-artifacts/review-loop/3-4-build.passes/pass0.diff` (d7df29c..c581c0d)
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-primary-action-new-game-replay-and-feedback-plan.md`
Depth: quick, max 7. Pre-loop HEAD c581c0d, tree snapshot 0 60d6f3dae562d19636c6deb3d23b2e831323a4fc.

## Pass 1 — 2026-09-30
Reviewers: correctness, verification gap  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree c1e409bfe056b846795b80141c1028d32e0ca01f  |  Fix diff: 3-4-build.passes/pass1.fix.diff  |  After fix: npm test 1490 passed (4.58 s), lint clean, check 0 errors; fixer ran e2e/game-store.spec.ts android 13 passed
### Applied
- [major] e2e/game-store.spec.ts `R-73 Undo, Redo and Confirm …` — the Confirm step would pass if `primary-action` dispatched any Session-changing command (e.g. undo); assert the committed result (cursor/moves after confirm) and the label turning `Validate` → fixer item 1
- [minor] src/ui/App.svelte `.primary.reason:disabled` — ticket Look sentence (Need 3+ letters ink-secondary vs Validate ink-disabled) untested; assert computed colour in the AD-3 composing-draft-2-letters test → fixer item 2
### Default applied (technical)
- e2e colour check — compare `getComputedStyle(...).color` against the resolved token values rather than a screenshot
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-09-30
Reviewers: fix diff, correctness, verification gap  |  Findings: major 0, minor 4, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree c1e409bfe056b846795b80141c1028d32e0ca01f (no fix pass)
### Applied
- none (converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 2 passes

Final state (tree c1e409b, commit a4fddaf): npm test 1490 passed (4.58 s), lint clean, check 0 errors.

Unapplied minors:
- Plan Tests mapping, R-74 row — still says `wordcell:history` stays `null`; the test seeds history-three-records.json and asserts its bytes unchanged (Q-29).
- Plan Tasks / Design Notes — describe pre-patch code: `$state` feedback (code: `$state.raw`), `Need 3+ letters` on `ok === false` alone (code also checks `reason === 'too-short'`), sync figure incl. replay in `view` (script header: render `$derived` falls in frame).
- scripts/measure-dispatch.test.mjs — flag tests use single samples (max = median); add e.g. `summarise([1, 2, 16.01])` → flagged true, median 2.
- e2e `R-74 R-73 game-over New game …` — range-checks the seed only, so it would pass if New game reused the old seed; the fresh-vs-old distinction rests on the AD-4 Vitest seed-stub test (not R-id coverage). Record that reliance in the plan, or assert `seed !== 1` if the ticket AC is relaxed.
