# Review loop — ticket 11.3 build (code, 136527c..HEAD)
State: pass 1: done

Target: commit range `136527c..HEAD` (staged as `11-3-build.passes/pass0.diff`); intent `_bmad-output/initiative-wordcell-v1/epic-place-preview/story-fly-to-cell-keeps-the-previewed-top-plan.md`. Depth thorough, max 7.
Pre-loop: HEAD c0664ef31e167e2ee0d90943da5639bcc0d630b2, tree snapshot 0 0e749e1a9d22e90f57323a7d9e39826e2721c0ee.
Refs: docs/game-flow-spec.md, docs/requirements-carryover.md, CLAUDE.md, AGENTS.md, ARCHITECTURE-SPINE.md, DESIGN.md, EXPERIENCE.md, epic-place-preview.md, story-fly-to-cell-keeps-the-previewed-top.md.

## Pass 1 — 2026-10-28
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 3, decision-needed 0  |  Dropped in triage: 0 (1 duplicate merged)
Snapshot: tree 0e749e1a9d22e90f57323a7d9e39826e2721c0ee (no fix pass). Orchestrator at the final state: `npm test` pass, `npm run lint` pass, `npm run check` 0 errors.
### Applied
- none (converged; minors are listed under Result, not applied)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (correctness and intent-alignment both raised the plan's stale "Not committed" Status bullet; merged)

## Result — converged after 1 pass

Unapplied minors (for the next build or loop):
- [minor] plan `story-fly-to-cell-keeps-the-previewed-top-plan.md`, Auto Run Result → "2026-10-28 — build run", Status bullet — says the build was not committed and the working tree holds the diff, but commit c0664ef holds it; name c0664ef as the build commit (correctness + intent alignment).
- [minor] plan Review Triage Log (the two `[false]` "Undo mid-flight" rejections) and Design Notes (Undo bullet) — the reasoning that a leftover copy "would make the `.preview` count 2" is wrong: in Place `shown()` returns from the `cell.preview` branch before the hold branch, so the Undo-before-start test cannot detect it. The interrupt row is actually covered by the unit chain (`capture()` → `finishAll()` empties `inFlight.committed`, flip.test.ts ~:637/:871) plus the e2e `afterLast` release check; reword the rationale to say so (verification gap).
- [minor] `e2e/fly-to-cell.spec.ts` Undo-before-start test — no end-to-end check that the copy leaves the DOM when an interruption ends outside Place (e.g. Confirm, then an act()-wrapped New game in the same click task); the release holds by composition (act() → controller `cancel()` → `finishAll()` → `inFlight.committed` cleared → WordCellRow drops the copy). Optional: add that e2e, or record in the plan that it is covered by composition only (edge cases).
