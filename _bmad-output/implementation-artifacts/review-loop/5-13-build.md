# Review loop: ticket 5.13 build (code mode)

State: pass 1: done
Range: bbaf8f1..a6bb2c2 (HEAD a6bb2c2); intent: story-winning-animation-input-guard-plan.md; thorough, max 7
Pre-loop tree 0: 60f702b969488653284d1a2294e34d7c1d8a673b
Target diff: _bmad-output/implementation-artifacts/review-loop/5-13-build.passes/pass0.diff

## Pass 1 — 2026-10-14
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 4, minor 12, decision-needed 0  |  Dropped in triage: 0 (3 reviewer majors on the same bug merged)
State: pass 1: done
### Findings (triaged)
1. [major] src/ui/motion.ts onEvent `!windowPassed` path — finish(t) runs `complete`→settle→notifySettled→evaluate before the gesture is in t.open, so the guard uninstalls while the gesture is still consumed (confirmed in source, 3 reviewers) — fix: t.open.set(id,true) before finish(t); add test whose `complete` calls notifySettled
2. [major] src/ui/motion.test.ts — no test for keydown inside Undo passing through (AC)
3. [major] src/ui/motion.test.ts — "backstop unchanged" held-key tests pass on a wrong implementation (no time advance)
4. [major] src/ui/flip.test.ts — nothing shows `complete` given to install is finishAll
5. [minor] flip.ts play(): notifySettled on size 0 for any play, not only a winning one
6. [minor] e2e/win-guard.spec.ts: re-assert toHaveCount(0) after glidesSettled; precondition for non-Slow variants
7. [minor] motion.test.ts: blur/hide combos; mis-named tests ('no listener exists before startTracker', 'after uninstall ... consumed'); keyboard-click and long-hold-past-settle tests
8. [minor] plan: tick completed task checkboxes
### Default applied (technical)
- all of the above — reviewer's proposed default
### Not applied (minor)
- e2e fixed waitForTimeout flake risk; lost pointerup leaves guard until blur/hide/Undo (F8 behaviour, accepted); notifySettled silent on null tracker; flip animation-set scoping (AD-14 gate)
### Applied (pass 1 fix, tree 4246b06dc0a1)
- [major] motion.ts onEvent — gesture marked consumed before finish(t); regression test → fixer 1
- [major] Undo keydown tests → 2; [major] backstop-unchanged tests with time advance → 3; [major] flip finishAll test → 4
- [minor] flip.ts notify only on win → 5; e2e re-asserts → 6; test renames/extra cases → 7; plan checkboxes → 8
Final: npm test / lint / check pass (run by orchestrator).
