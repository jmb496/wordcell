# Review loop — ticket 2.6 build (code mode)
State: pass 1: done

Target: `e94b7ae..HEAD` (commit 683add5), diff at `2-6-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-undo-redo-give-up-and-accrue-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD 683add5, tree snapshot 0 e4cc6cc4d6089a7e068177d641f0f758a39e4ed7

## Pass 1 — 2026-09-29 07:00
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 1 (part of the edge-case finding)
Snapshot: tree 96c5a00a3a5be68af856b324634d2a3dfea325bd  |  Fix: fresh-deal case in the R-76 add test (renamed `… on a fresh deal and in Idle, Composing and Place`), `never` default in `undo`  |  Checks: `npm test` 695/695, lint pass, check 0 errors
### Applied
- [major] `src/engine/commands.test.ts` `R-76 accrue adds elapsedMs while playing, …` — R-76 "the clock runs … (including a fresh deal)" has no test on a fresh Session (moves [], cursor {0, idle}); an accrue gated on "in progress" would pass → fixer item 1
- [minor] `src/engine/commands.ts` `undo` switch — no exhaustive `never` default (unlike `applyFrom`), so an ill-typed `cursor.phase` (e.g. 'committed', which passes `checkSession`) makes undo return `undefined` instead of throwing (rule 6; edge-case lens, reclassified major → minor: ill-typed input unreachable from `apply`, schema stage is entry 10's) → fixer item 2
### Default applied (technical)
- R-76 fresh deal → add `createSession(1)` (frozen) to the accrue add cases
- undo exhaustiveness → `never` default rejecting `command-domain`, as `applyFrom`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case lens: make `checkSession` reject an unknown `cursor.phase` and a non-integer `cursor.index` — pre-existing `replay.ts` gap outside this diff; the plan already defers the non-integer index to entry 10's `parseSession` schema stage, which is where the phase type check belongs too
