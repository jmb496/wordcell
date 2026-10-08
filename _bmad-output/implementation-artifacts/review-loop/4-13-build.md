# Review loop — ticket 4.13 build (code mode, 3014424..b209110)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/4-13-build.passes/pass0.diff` (git diff 3014424..b209110; build commits 921c0c5, f717fac; b209110 and 0c39b04 docs)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-refactor-sweep-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD b2091102899544a48597ea731ba3b353242280fe, tree snapshot 0 1f55bff60a7c24e71f92747090d726422861a522

## Pass 1 — 2026-10-07
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 7, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 3559f4110a59337a942e6da014f0ba0e1eb75d33 (fix diff `4-13-build.passes/pass1.fix.diff`)
Fixer: items 1-8 applied (helpers.spec non-active case now `about:blank` → 'store is undefined'; source-clip Vitest confirmed to fail on an unclipped source; plan counts 89 game / 31 history). Orchestrator check: `npm test` 50 files, 2058 passed; lint clean (178 files); check 0 errors.
### Applied
- [major] e2e/helpers.spec.ts:423 'AD-17 stashSession … reject a non-active store' — seeds `session-invalid-array.json` outside a §2 rejection / History-notice flow (AGENTS.md Known pitfalls, AD-17 Seeding) → fixer item 1
- [minor] src/shell/stored-key.ts:10-19 rejectReason — casts hide a parse-failure member without `version`; constrain F's shape and narrow with `'version' in` → fixer item 2
- [minor] e2e/helpers/board.ts sameSession — returns false silently when nothing was stashed; throw 'no stashed session' and test it → fixer item 3
- [minor] src/ui/gestures/controller.test.ts F34 — no case clips the source column (D7 "source included") → fixer item 4
- [minor] src/shell/stored-key.ts — R6/F18 "never imports ./storage or a shell store" unpinned; add AD-7 import test → fixer item 5
- [minor] src/shell/game.svelte.test.ts R6 guard messages — lazy `loaded()` message only tested in 'booting'; add a non-booting kind → fixer item 6
- [minor] e2e/board.spec.ts, e2e/board-phases.spec.ts openFixture call sites — gained a boot wait their local copies lacked (D8 same behaviour); pass `{ booted: false }` → fixer item 7
- [minor] story-refactor-sweep-plan.md AC 1, §R7, Verification — "five describes"/counts and "no build-notes/ticket change" stale (merged from two reviewers) → fixer item 8
### Default applied (technical)
- e2e/helpers.spec.ts non-active store — reach a non-active store without an invalid fixture → `about:blank` (no store) or a halted/booting store, fixer's choice
- board/board-phases openFixture — keep pre-refactor behaviour → `{ booted: false }`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- verification gap: plan AC "five describes" — duplicate of the intent-alignment plan-drift finding (merged into item 8)
