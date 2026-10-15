# Review loop — 6-1-build (code mode)

State: pass 1: done
Target: a27a690..HEAD (build bfed752), diff at /mnt/d/CodeProjects/wordcell/_bmad-output/implementation-artifacts/review-loop/6-1-build.passes/pass0.diff. Intent: story-surface-foundation-and-the-one-new-game-function-plan.md. Pre-loop HEAD bfed7523ffed7cfe0f583a23868222bf73044911, tree 0 0888aacf016ac599d6c04ab331820718426f2d88.

## Pass 1 — 2026-10-14
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 5 (after dedupe), minor 9, decision-needed 0  |  Dropped in triage: 0
### Applied (sent to fixer)
- [major] presence.svelte.ts onend — transitioncancel (interrupted open by a close) unmounts at once; bubbled descendant opacity events unmount early → items 1, 2
- [major] presence.ts/svelte.ts — close before opacity ever changed (no transition event) leaves invisible layer present → item 3
- [major] surfaces.test.ts — missing mounted tests: focus start, focus return, cancel-first on wrapped handlers, exiting inert, peek→sticky no replay, close/reopen during exit → item 4 (default applied: Playwright dev-server spec; no jsdom dependency)
### Minor (applied if no cost)
- openSurface return early when overlays.isOpen(id); WordCellView exit snapshot; expandEndSheet exact message; closedByBack for confirms; opener from menu hand-off, reduced-motion in Sheet/Panel (deferred to 6.2, tree-shaken) — recorded
### Default applied (technical)
- Playwright for mounted coverage; event-target filter for presence
### Decision needed
- none
Snapshot: tree f068ac28c60a2ea5cffadf05d4cbe0a49974f5ba; fix diff pass1.fix.diff; fixer ran test/lint/check/e2e green. Deferred: Sheet/Panel focus + act() caller mount tests to 6.2 (no opener).
