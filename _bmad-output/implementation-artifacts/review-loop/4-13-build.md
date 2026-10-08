# Review loop — ticket 4.13 build (code mode, 3014424..b209110)
State: pass 2: done (result written)

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

## Pass 2 — 2026-10-07
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 6, decision-needed 0  |  Dropped in triage: 2 (duplicates merged)
Snapshot: tree 3559f4110a59337a942e6da014f0ba0e1eb75d33 (no fix pass: stopping rule met)
### Applied
- none (two consecutive passes with at most one major: converged; the pass 2 major is recorded as open)
### Open major (not fixed)
- story-refactor-sweep-plan.md Verification / D1 counting — the pass 1 fixes edited src/ and e2e/ after the plan's five green `npm run test:e2e` runs and its `test:all` run, so ticket D1 ("the five runs follow every src/ and e2e/ edit other than the architecture-test split") and the AGENTS.md test:all gate are not evidenced for the reviewed tree. Orchestrator re-ran `npm run test:all` plus four more `npm run test:e2e` at tree 3559f41 (results below); recording them in the plan's D1 list and Verification is left for the caller.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- fix diff: plan D8 / review-fix notes stale — merged into minor 1 (intent alignment)
- verification gap: plan §Split lacks the AD-7 F18 describe — merged into minor 1

## Result — converged after 2 passes
open major: story-refactor-sweep-plan.md Verification / D1 counting predates the pass 1 src/ and e2e/ edits (pass 2, intent alignment). Orchestrator evidence at tree 3559f41 (commit ef96eac): `npm run test:all` green 21:22–21:25 (lint, check, unit 50 files / 2058 passed, build, test:e2e:dist, test:e2e 371 passed, test:e2e:pwa); `npm run test:e2e` at 21:25 **failed once** in D1's test `e2e/layout.spec.ts:286` "AD-11 banner during a scroll applied after a hide, before the quiet point" [android] (`scrollY changes between steps`, expected not 12, layout.spec.ts:228; a pan step that did not scroll, not the 150 ms window), which resets the D1 count; then five consecutive green `npm run test:e2e` runs at 21:27, 21:30, 21:32, 21:35, 21:37 (371 passed each). The D1 count is met again, but the D1 test is not fully deterministic under load (one failure since its fix; a second would be an owner stop per ticket D1). Recording these runs and the failure in the plan's D1 list and Verification is left for the caller. Logs: `4-13-build.passes/testall.log`, `e2e-2.log` … `e2e-7.log`.

Unapplied minors (for the next build or loop):
1. story-refactor-sweep-plan.md R6 'Review fix' (l.181), D7 (l.191), D8 (l.213), Split (l.228-230), Review Triage Log (l.283) — not updated for the pass 1 fixes: the 'while halted' test, the F34 source-clip Vitest, `{ booted: false }` at board/board-phases call sites, `sameSession` 'no stashed session' throw, and the `AD-7 F18 stored-key helpers` describe in architecture-ad1.test.ts (ticket Split puts only AD-1 blocks there; move it to architecture-ad2-ad12-ad17.test.ts or record why it stays).
2. src/ui/gestures/controller.ts visibleBand() — a shown banner, or a top/action bar, moved off its edge by a dev-only `?bands=` order sets a band that clips every column, so every drag flies back (SPEC F22 dev stickiness); count a bar/banner only when it touches its viewport edge, plus a Vitest, or record the dev-only limitation.
3. src/shell/stored-key.ts rejectReason — the switch from `reason === 'version-unreadable'` to `'version' in parsed` is pinned only by `toEqual` assertions, which ignore an undefined `version` key; add a `toStrictEqual`/`Object.keys` case per store.
4. e2e/helpers.spec.ts openFixture — the `booted` option (default wait and `{ booted: false }`) has no helper test; assert `current().kind !== 'booting'` after the default call and add a `{ booted: false }` call.
5. e2e/layout.spec.ts:228 (D1 test, android) — the pan step can leave scrollY unchanged under load (one failure at 21:25 on 2026-10-07); make the step's scroll deterministic (see open major).
