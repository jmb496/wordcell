# Review loop — ticket 2.4 build (code mode)
State: pass 2: done

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

## Pass 2 — 2026-09-29 05:40
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 1
Snapshot: tree 945807113d96591980e1058e7426400f1097b31d (no fix pass: stopping rule met)  |  Checks: `npm test` 594/594, lint pass, check 0 errors, `npm run test:all` exit 0 (orchestrator run on this tree)
### Applied
- none (stopping rule: passes 1 and 2 each yielded at most one major)
### Open major (not fixed)
- `src/engine/commands.test.ts` `R-13 …` / `R-22 an empty column is a legal destination, …` — R-13's clause "including their own column when they were the whole column (Q-30)" has no test carrying R-13; the whole-column self-drop runs only in the R-22 test, which asserts k = 0 but not the word → proposed fix: add a whole-column self-drop case (e.g. `drop(2, COL2.length, 2)`, assert k = 0 and `word(...).cards` equals COL2) to the R-13 test, or rename the R-22 test `R-13 R-22 …` and assert the word
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- fix-diff lens: plan's `npm run test:all` exit 0 claim unverified after the pass-1 fix — orchestrator ran `npm run test:all` on tree 9458071: exit 0

## Result — converged after 2 passes
open major: R-13 own-column (Q-30) whole-column self-drop clause has no R-13-named test asserting the word (see Pass 2)

Unapplied minors:
- `src/engine/commands.test.ts` D8 test — removal is tested at the end and the start of M, not strictly inside it; add an `arrange` to e.g. [I, N, W, Z] then remove cell 4 and assert [I, W, Z] (pass 1 log wording "mid-M" is really "first of M")
