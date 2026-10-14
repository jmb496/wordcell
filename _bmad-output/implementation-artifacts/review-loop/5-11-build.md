# Review loop — ticket 5.11 build (code mode)

State: pass 1: done
Target: commit range c068cee..HEAD (6419f65) — diff at 5-11-build.passes/pass0.diff
Intent: _bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-fly-to-cell-on-commit-plan.md
Pre-loop: HEAD 6419f650756c48f78ceff46343db2faf2638aa4c, tree snapshot 0 = 798e3a82a6f6a0ca3f123b757de12a32257c4b0f

## Pass 1 — 2026-10-14
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 4, minor 4, decision-needed 0  |  Dropped in triage: 0 (2 duplicates merged)
Snapshot: tree 798e3a82a6f6a0ca3f123b757de12a32257c4b0f (pre-fix)
### Applied (to fix)
- [major] e2e/fly-to-cell.spec.ts Redo test — only ids/delay/duration checked; ticket AC "the same checks hold" → fixer 1
- [major] e2e — no Confirm into a target cell with existing cards; previous-top hold (WordCellRow `lowest - 1` clause) untested → fixer 2
- [major] e2e reduced-motion — runs on session-place (no used mirror); AC "mirror gone at its end" unproven → fixer 3
- [major] e2e two-cards test — source-cell beneath-card and target-cell held state assertions too weak → fixer 4
- [minor] landed[] restates delay order → fixer 5; gate idle after finishAll e2e → fixer 6; unit setup reset of inFlight → fixer 7; fail-fast same-cell check on flying set → fixer 8
### Default applied (technical)
- all of the above are test/internal-structure choices; reviewer defaults taken
### Decision needed
- none

Pass 1 fix applied; snapshot tree cbcb67f4ec9d1ff789e0c34fd6ea152e701dd26e. Fixer reported test 2311 pass, lint pass, check pass, fly-to-cell e2e 7 pass. Fixer 6 (gate idle) is indirect and was not shown to fail against a leaked enter().
