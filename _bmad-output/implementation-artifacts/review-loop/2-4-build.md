# Review loop — ticket 2.4 build (code mode)
State: pass 1: done

Target: `b40b4e3..HEAD` (commit 0da8542), diff at `2-4-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-composing-commands-and-the-command-table-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD 0da8542, tree snapshot 0 23071b8e05fd4d6fb01e7a2d47cc6cb7c82b0044

## Pass 1 — 2026-09-29 05:15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 3, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 945807113d96591980e1058e7426400f1097b31d  |  Fix: mid-M removeFreeLetter assertion in the D8 test, non-throwing `sourceCards` for `arrange`, `apply` seed-order doc sentence, plan Implementation Notes counts  |  Checks: `npm test` 594/594, lint pass, check 0 errors
### Applied
- [major] `src/engine/commands.test.ts` R-33 D8 test / EDITS removeFreeLetter row — every removal takes the last card of M, so a `slice(0, -1)` implementation passes; R-33/Q-31 "without reordering the rest" untested mid-M → fixer item 1
- [minor] `src/engine/commands.ts` `arrange` — calls the throwing `checkSourceCount` although the ticket says `arrange` calls only `checkArrangement` → fixer item 2
- [minor] `src/engine/commands.ts` `apply` — seed resolved before `type` dispatch (CAP-4 says type first); undocumented at the code → fixer item 3
- [minor] plan Implementation Notes — stale counts (63 rows / 87 tests / 180 passed) and `R-71 %o` name vs Auto Run Result and the code → fixer item 4
### Default applied (technical)
- `arrange` S extraction → non-throwing `sourceCards(position, move)` in `rules.ts`, reused by `checkSourceCount`
- seed-before-dispatch → keep behaviour, document in the `apply` doc comment
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case lens plan-count finding — duplicate of the intent-alignment one
