# Review loop: ticket 5.12 build (code mode)

State: pass 1: review
Pre-loop: HEAD fa2a8fbab314313ca32f3a974250df7236e68a10, tree snapshot 0 ffe9a137a283579393ff834ea845d9e27ed2f262
Target: /mnt/d/CodeProjects/wordcell/_bmad-output/implementation-artifacts/review-loop/5-12-build.passes/pass0.diff (59f57b3..HEAD); intent: story-tray-growth-wiring-plan.md

## Pass 1 — 2026-10-14
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 8, decision-needed 0  |  Dropped in triage: 2
### Majors (to fix)
1. src/ui/layout/layout.svelte.test.ts 14→15→14 shrink case and flip-over-layout 14→15 case: shrink assertion passes if anchor logic is absent (fake already clamped); no assertion that w/metrics are not recomputed on a row-changing move (AC bullet 4).
2. e2e/tray-growth.spec.ts 'a restored three-row Tray lays out at load': claims a swap it does not run and asserts nothing about Tray height at load.
### Minors (to fix, default applied)
- e2e 150 ms scroll-busy test: do scrollTo and click in one page.evaluate (or rename; unit cases cover the gate).
- e2e PLUS locator: use getByRole('button', {name:'+', exact:true}).
- layout.svelte.test.ts 'AD-3 sizing and rows share one value': tie heights.tray to tray.rows at 0/14/15.
- tray.test.ts: add AD-3 cases for trayTiles/trayTileCount (Place, Composing, Idle/Game over).
- 'every tile-count edit kind': retitle to row-boundary counts, or add giveUp 15→0 case.
- e2e '+' test: add a positive animation control so columnFaces 0 is meaningful.
- fixture session-place-long is a non-word 15-letter strip: note in plan residual risks (no code change).
- beginMove/endMove stuck `moving` after a throw: add a one-line comment that it is intended (app halts).
### Dropped
- Intent #1 (no call-order spy / mid-drag rows test): call order covered by controller.test.ts (ticket 5.16 capture-first, gate leave, dispatch) and rows change only inside a move by construction.
- Correctness #2 duplicate of the stuck `moving` minor.
### Applied (pass 1 fix)
- [major] layout test shrink without clamp + w/metrics refs → fixer 1
- [major] e2e restored-Tray test renamed, height + no scrollTo asserted → fixer 2
- [minor] fixer 4–11 applied (single-task click, role locator, AD-3 sizing, tray.ts tests, retitle, positive control, comment, plan residual risk)
Snapshot: tree 6b052921eba55f047b893d43e5000453606ea535. test/lint/check pass.
State: pass 1: done
