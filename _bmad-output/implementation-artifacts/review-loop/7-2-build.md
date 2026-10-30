# Review loop — ticket 7.2 build (code, 1a96068..HEAD)
State: pass 1: done

Target: commit range `1a96068..HEAD` (staged as `7-2-build.passes/pass0.diff`); intent `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-worker-failure-split-and-no-skip-waiting-guards-plan.md`. Depth thorough, max 7.
Pre-loop: HEAD e340aeeedacbaffbc522473b6fa3dff8ea5204fc, tree snapshot 0 725580c1faf823c92eaa35143f8e7252631ee3cc.
Refs: docs/game-flow-spec.md, docs/requirements-carryover.md, CLAUDE.md, AGENTS.md, ARCHITECTURE-SPINE.md, epic-pwa-release.md, story-worker-failure-split-and-no-skip-waiting-guards.md, story-worker-failure-split-and-no-skip-waiting-guards-plan.md.

## Pass 1 — 2026-10-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 2 (duplicates)
Snapshot: tree 28671ccd55dd097f2d6eb33433f5dd7b293838b7 (fix diff `7-2-build.passes/pass1.fix.diff`). Fixer: 3/3 applied, test and plan only (`src/shell/sw.test.ts` +2 `it.each(GATES)` cases "AD-16 update failure: … installing slot cleared before its statechange → failed (%s)" and "AD-16 slot ranking active < waiting: … → failed (%s)"; `src/architecture-tree-scan.test.ts` "AD-16 src/main.ts reports the F17 chunk failure on the hook gate alone, halted or not"; plan `deferred` entry, Matrix "Update failure" row, Review Triage Log F17 rows, Auto Run Result review-findings and residual-risk lines). Mutation checks: loop swapped to `[waiting, active, installing]` fails exactly the 2 new ranking cases; `&& !halted()` restored fails the source pin; `sw.ts`/`main.ts` unchanged. Orchestrator: `npm test` 3684 passed, `npm run lint` pass, `npm run check` 0 errors.
### Applied
- [major] `src/shell/sw.test.ts` "AD-16 Q-40 failure split" / `src/shell/sw.ts` slot loop `[active, waiting, installing]` — no case pins active < waiting in the first-seen ranking (ticket Failure: "one slot read … ranks active < waiting < installing"); swapping the loop to `[waiting, active, installing]` passes every case; add a gate-split case: activated A + installed W at `register()`, W → `redundant` still slotted → `failed`, 0 / 1 reports → fixer item 1
- [minor] `src/shell/sw.test.ts` "AD-16 update failure …" vs plan Matrix row "Update failure" ("installing slot null") — the case keeps I slotted, so no case has an older active plus a failing installing worker whose slot was cleared; add the slot-cleared variant beside it → fixer item 2
- [minor] `src/main.ts:273` F17 report — dropping `&& !halted()` is untested and entry 7's F17 case (SPEC CAP-5) does not halt first, so it would not close the plan's deferral; pin the condition with a source-level test beside `AD-14 src/main.ts …` in `src/architecture-tree-scan.test.ts` and reword the plan's deferred entry → fixer item 3
### Default applied (technical)
- fixer item 2 — test form → `it.each` over slotted / slot cleared (or a sibling `it.each(GATES)` case)
- fixer item 3 — how to pin the unconditional report → source-level assertion that the F17 catch's condition is exactly `import.meta.env.VITE_TEST_HOOKS === '1'`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- verification-gap "Update failure Matrix row vs test" — duplicate of correctness minor (item 2)
- verification-gap "main.ts F17 untested; entry 7 does not close it" — duplicate of correctness minor (item 3, clearer wording kept)
