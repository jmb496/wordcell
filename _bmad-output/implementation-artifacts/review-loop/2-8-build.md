# Review loop — ticket 2.8 build (code mode)
State: pass 1: done

Target: `db8edab..HEAD` (commit 71adf5e), diff at `2-8-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-gameview-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD 71adf5e, tree snapshot 0 cb72f12cde02062ed35c0d1655b135c6f9f8b40f

## Pass 1 — 2026-09-29
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 3, decision-needed 0  |  Dropped in triage: 2
Snapshot: tree db548c3532efe1592a6730d9ec49caf16262510c (fix diff `2-8-build.passes/pass1.fix.diff`)
Fixer: all 5 applied; item 1 letterCount corrected to 7 (QU+EJATA = 6 cards, 7 letters), mutation (spell from placementOrder) fails only the new test; item 5 via D2 seam `startOf(['QABCDEFGH','I'])`, L = 11. Orchestrator run: `npm test` 1052 passed, lint pass, check 0 errors.
### Applied
- [major] `src/engine/view.test.ts` wordCount/longestWord tests — no test proves committed-word spelling uses R-37 tray order, not `placementOrder` (every commit asserted uses the default order) → fixer item 1
- [major] `src/engine/view.test.ts` R-31 kIfTapped test — TAP_STATES all have empty WordCells, so the ticket's "WordCell cards make tapDestinationCard throw" is never checked with its code (edge + verification lenses, merged) → fixer item 2
- [minor] `story-gameview-plan.md` Design Notes — claims the structuredClone round trip catches `undefined`-valued keys; it cannot (the `Object.hasOwn` tests do) (correctness + verification, merged) → fixer item 3
- [minor] `view.test.ts` "AD-3 in each canValidate false state…" — covers 7 hand-picked states, not each canValidate-false agreement state → fixer item 4
- [minor] `view.test.ts` legal targets — no L > 10 case (ticket "L ≥ 10") → fixer item 5
### Default applied (technical)
- item 4 — loop over STATES with expected code by status → phase → r36 order
- item 5 — seam-built L = 11 Place state (e.g. 10-card word containing QU)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- intent: `redoAvailable` default calls `reject` — unreachable compile-time exhaustiveness guard that fails fast (rule 6); already triaged and rejected in the build's review (plan Review Triage Log); no behaviour at stake
- verification (minor half of item 2's source): duplicate of the edge-case finding
