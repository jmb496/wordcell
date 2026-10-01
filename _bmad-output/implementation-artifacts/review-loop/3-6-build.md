# Review loop — ticket 3.6 build (code, 81a61e9..28d1cff)

State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/3-6-build.passes/pass0.diff` (81a61e9..28d1cff)
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-lifecycle-and-visible-time-clock-plan.md`
Depth: thorough, max 7. Pre-loop HEAD 28d1cff, tree snapshot 0 9122552ec44dea3a462114df75f477a558739a59.

## Pass 1 — 2026-09-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 7, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 9122552ec44dea3a462114df75f477a558739a59 (no fix pass)  |  Final: npm test 1528 passed (27 files, 4.83 s), lint clean, check 0 errors
### Applied
- none (converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (two minors are recorded below as "no change: as specified")

## Result — converged after 1 pass

Unapplied minors (for a later build or loop):
- e2e/lifecycle.spec.ts `R-76 New game starts at activeMs 0 with the discarded take`: the ticket AC labels this case R-74 (the fresh `activeMs = 0`), and the plan relabelled it R-76. Rename it `R-74 …` or record the departure in the Plan Change Log.
- e2e/lifecycle.spec.ts `R-76 AD-17 a page loaded hidden does not grow until showPage`: the first check reads the stored bytes, so it would also pass if the pageHide flush wrote nothing. Arm the spy and assert the entries `[seeded]` and then `[seeded, seeded + M]`.
- src/shell/game.svelte.test.ts whenVisible case: it runs only on an active store, but the ticket says whenVisible is independent of store state (rejected root, CAP-8). Add rejected and halted variants.
- e2e/lifecycle.spec.ts `Q-38 a persisted pageshow after an own dispatch stays active`: the pageHide between the Undo and the pageshow rewrites sessionText, so a dispatch that fails to update it would go unnoticed here. Only the AD-4 shell Vitest case covers that. Add a no-pageHide variant or note the split.
- src/shell/game.svelte.ts flush(): it assigns `state` even when `accrued === state.session` (won or given up, or a zero take on the second flush of a hide pair), which forces a needless GameView re-derive. Assign only on a changed reference, like dispatch, and keep the unconditional write.
- src/shell/game.svelte.ts flush(): a fresh window's write that lands just before this page's pagehide (with its storage event not yet handled) is overwritten. No change: AD-9 specifies an unconditional write and the window is tiny.
- src/shell/game.svelte.ts flush(): if a before-hide callback throws, the hidden+pagehide pair re-runs the callbacks and a second fatal replaces the first one's text. No change: as specified (rule 6), and the store is already halted.
