# Review loop — ticket 4.7 build (code mode, 7766b23..HEAD)

State: pass 1: done

Target: commit range 7766b23..HEAD (diff `4-7-build.passes/pass0.diff`)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-tap-select-foot-pads-and-tap-drop-plan.md`
Depth: thorough, max 7
Pre-loop: HEAD 45e9fb8c220acf29b15ed48c599cb87d6dfa803c, tree snapshot 0 ec646b50f6d3e2a8cd3ca4e7137da5aa46e341bd

## Pass 1 — 2026-10-02
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 5, decision-needed 0  |  Dropped in triage: 2 (deferred, outside this target)
Snapshot: tree de6d0698ce98a06dfb08d6d642e060fe2b176c1a (fix diff `4-7-build.passes/pass1.fix.diff`)
### Applied
- [major] e2e/tap.spec.ts:659-714 — partial self-drop (remainder-top face) and F31 Here pad hover assert only the 3 px outline, not the 12 % wash the owner decision F31 / DESIGN.md Card states require (intent + verification-gap, merged) → fixer item 1
- [major] e2e/tap.spec.ts desktop describe — no desktop test that `Here` replaces the column numbers while a tail is selected (ticket Description, DESIGN.md Column slot; desktop-only behaviour) → fixer item 2
- [minor] e2e/tap.spec.ts:365-385 — Undo/Redo "then acts" only assert the cursor changed; assert the expected direction/cursor → fixer item 3
- [minor] e2e/tap.spec.ts:423 P4 — no assert that lifted faces and the outline sit above the sticky bars (z-index) → fixer item 4
- [minor] plan Design Notes "Deselect-before-act order per handler" — claims the order is proven by Playwright outcomes; it is not → fixer item 5
### Default applied (technical)
- e2e/tap.spec.ts Undo/Redo — exact cursor assertions → default: assert cursor index −1 (Undo) and the pending draft redone (Redo)
- P4 z-index — default: computed z-index of faces and outline greater than the top bar's
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- build-notes CAP-6 says hover classes go on cards (build uses `[data-column]`, justified in plan Design Notes) — a spec-side wording update for epic close-out, not this diff; listed as unapplied minor
- WordCell tap / Undo / Redo / Reload `deselect()` would throw under a view — unreachable until ticket 4.11 adds `openView`; already recorded in plan Residual risks; listed as unapplied minor (carry into 4.11)
### Fixer outcome
- 1: wash asserted on column 5 remainder-top `.face` (partial) and on foot-5 (F31) in the desktop hover tests.
- 2: new desktop test `AD-12 a selected tail replaces the column numbers with Here on the source foot; deselect restores them`.
- 3: Undo asserts {1, idle} → {0, place}; Redo asserts {0, idle} → {0, composing}.
- 4: P4 asserts lifted face and outline z-index (3) > top bar z-index (2).
- 5: plan Design Notes bullet reworded (order checked by code review only).
- Verified: `npx playwright test e2e/tap.spec.ts` 30 passed; orchestrator re-ran `npm test` (1877 passed), `npm run lint` clean, `npm run check` 0 errors.
