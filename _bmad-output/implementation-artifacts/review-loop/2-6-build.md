# Review loop — ticket 2.6 build (code mode)
State: pass 2: done

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
- undo exhaustiveness → `never` default in the style of `applyFrom`'s (which rejects `command-type`), rejecting `command-domain` since the bad value is a Session field, not the command type
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case lens: make `checkSession` reject an unknown `cursor.phase` and a non-integer `cursor.index` — pre-existing `replay.ts` gap outside this diff; the plan already defers the non-integer index to entry 10's `parseSession` schema stage, which is where the phase type check belongs too

## Pass 2 — 2026-09-29 07:20
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 96c5a00a3a5be68af856b324634d2a3dfea325bd (no fix pass: stopping rule met)  |  Checks at final state: `npm test` 695/695, lint pass, check 0 errors
### Open (not fixed — stopping rule: second consecutive pass with at most one major)
- [major] `src/engine/commands.ts` `undo` `never` default (pass 1 fix) — the new `command-domain` throw has no row in the `commands.test.ts` command × precondition table (AGENTS.md: the table is the single source of truth for every command × precondition → throw) and no test, so deleting it passes every test. Proposed fix: an `AD-2` undo row on `sessionOf([...PREFIX, <committed draft>], { index: PREFIX.length, phase: 'committed' as never })` → `command-domain` (first confirm `checkSession` accepts it; else note the branch is exhaustiveness-only in the plan).
### Applied (to this log only)
- [minor] Pass 1 "Default applied" named `applyFrom` as the precedent for `command-domain`, but `applyFrom`'s default rejects `command-type` → reworded above
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- verification-gap lens: undo `never` default untested — duplicate of the fix-diff major above (kept the table-contract wording)

## Result — converged after 2 passes (majors 1, 1)
open major: `undo` `never` default (`command-domain`) has no command-table row or test (see Pass 2 Open); fix in the next build or entry that touches `commands.test.ts`.

Unapplied minors: none.
Deferred (not this diff): `checkSession` does not reject an unknown `cursor.phase` or a non-integer `cursor.index` — entry 10's `parseSession` schema stage.
