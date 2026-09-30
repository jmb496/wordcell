# Review loop — ticket 3.3 build (code, 162af5a..d6a0f11)
State: pass 1: done

Target: code diff 162af5a..d6a0f11 (excluding `_bmad-output/`), staged at `3-3-build.passes/pass0.diff`.
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-game-store-load-dispatch-and-storage-plan.md` (ticket `story-game-store-load-dispatch-and-storage.md`).
Pre-loop: HEAD d6a0f112b66ba90031ae5a0fcdf644a96935e019, tree snapshot 0 247de96bf273e434b42ead5a392921fa84f0c73b.
Depth: thorough, max 7.

## Pass 1 — 2026-09-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 4 (1 unapplied), decision-needed 0  |  Dropped in triage: 3 (duplicates)
Snapshot: tree e2a571f10c66fa5fadfc0f1a754783395862628d (fix diff `3-3-build.passes/pass1.fix.diff`)
Fixer: items 1–3 applied (new test 'AD-4 dispatch order: accrue runs before apply, so a Redo onto a win keeps the accrued ms' fails on an apply-first mutant; old test renamed 'AD-4 dispatch takes and accrues the clock ms; …'). Orchestrator re-run: `npm test` 1466 passed (4.51 s), lint pass, check 0 errors; fixer ran `npx playwright test e2e/smoke.spec.ts` 3 passed.
### Applied
- [major] `src/shell/game.svelte.test.ts` 'AD-4 dispatch order …' — passes with apply-then-accrue too (Undo keeps `playing`, so both orders give +1000); add a status-changing case (won fixture: Undo paused, resume, +1000, Redo → `activeMs` +1000, `finished: 'won'`) → fixer item 1
- [minor] `src/shell/game.svelte.ts` dispatch — ms taken by `clock.take` are lost when accrue/apply/write throws; note it in a one-line comment (entry 5 makes such a throw fatal) → fixer item 2
- [minor] `e2e/smoke.spec.ts` WordCells loop — cell-number labelling unasserted; add `toHaveAccessibleName('WordCell <n>')` → fixer item 3
### Default applied (technical)
- `src/shell/game.svelte.test.ts` — order test fixture → session-won.json Undo then clocked Redo (reviewer default)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- dispatch-order finding raised by edge-case (major) and intent (minor) lenses — duplicates of the verification-gap major
- clock-take loss raised by edge-case lens — duplicate of the correctness minor
### Unapplied minor
- ticket Board (E1) still says text-labelled Undo/Redo (correctness, intent) — kept as unapplied minor: a ticket-text fix, outside the code target; plan Residual risks already records it
