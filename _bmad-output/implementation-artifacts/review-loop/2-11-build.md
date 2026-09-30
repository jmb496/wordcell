# Review loop — ticket 2.11 build (code mode)
State: pass 1: done

Target: `23f2111..HEAD` (commit 9ce1533), diff at `2-11-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-history-serialise-and-parse-and-the-epic-s-scripted-game-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD 9ce1533, tree snapshot 0 93a773e10e606041857a842ee6a4ca866728d2fd

## Pass 1 — 2026-09-29
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5 (4 applied), decision-needed 0  |  Dropped in triage: 0
Snapshot: tree f6daf32632b9f1a68abc6d02d9a71919d5d12978 (fix diff `2-11-build.passes/pass1.fix.diff`). Fixer and orchestrator: `npm test` 1285 passed, lint pass, check 0 errors.
### Applied
- [major] `serialize.ts` checkRecord spelling guard / `serialize.test.ts` checkRecord table — the anchored `^[a-z]+$` is not pinned (a `/[a-z]/` mutant stays green); add mixed-case (`lqueJata`) and non-letter (`tan1`) rows → fixer item 1
- [minor] `serialize.test.ts` inline boundaries — record-not-object only tested with null; add an array record `[]` row → fixer item 2
- [minor] `serialize.propagation.test.ts` — the plan's "only a SyntaxError from JSON.parse is version-unreadable" is untested; add a JSON.parse-throws-TypeError rethrow case → fixer item 3
- [minor] `serialize.ts` parseHistory JSDoc — returned records keep the stored key order; only serializeHistory guarantees AD-6 order → fixer item 4
### Default applied (technical)
- `serialize.propagation.test.ts` — rethrow branch of the JSON.parse catch → pinned with a `mockImplementationOnce` TypeError case
- `serialize.ts` parseHistory — raw parsed records returned in stored key order → keep behaviour, document it
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (the `-0` version minor is kept unapplied, not dropped: same as the 2.10 loop's unapplied parseSession minor)
