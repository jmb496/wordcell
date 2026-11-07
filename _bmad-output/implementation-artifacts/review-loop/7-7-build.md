# Review loop log: ticket 7.7 build (code mode)

State: pass 1: done
Target: git diff 360b966..HEAD (commit bdf477e) → `7-7-build.passes/pass0.diff`; intent: story-q-40-failure-and-q-42-controlled-branch-proofs-plan.md
Pre-loop HEAD: bdf477e; tree snapshot 0: b88a14b76b523283b6a313b04ca67f619b399fda

## Pass 1 — 2026-10-31
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree b88a14b76b523283b6a313b04ca67f619b399fda (no fix pass ran)
### Applied
- none (zero majors)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass

Unapplied minors:
- e2e/pwa/sw-failure.spec.ts `expectFatal`: asserts the fatal heading, `current().kind` `halted` and `swState()` `failed`, but not the alertdialog body (`game.haltText`). So the cause of each halt is inferred, not asserted. Fix: pass the expected text into `expectFatal` and assert `toContainText` for each case: 'Q-40 Workbox.register() rejected' (missing script), 'Q-40 a service worker turned redundant before it activated' (icon), 'Q-40 F17 the sw.ts chunk did not load' (chunk).
- e2e/pwa/dist-smoke.spec.ts and sw-failure.spec.ts icon cases: the 30 s "no worker request reached the context.route" timer starts after `goto`, but the handler's 15 s hold deadline starts only at the hit. If the hit comes more than 15 s after `goto` and the hold then times out, the test fails with the wrong message. Fix: have the handler resolve a separate `hit` promise, race only `hit` against the timer, then await `done` (bounded by the handler's deadline).

Final state: npm test pass, lint pass, check pass (run by the orchestrator; no fix pass ran).
