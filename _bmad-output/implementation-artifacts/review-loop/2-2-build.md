# Review loop — ticket 2.2 build (code mode)
State: pass 2: done

Target: `6f8101f..HEAD` (commit 94d329c), diff at `2-2-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-langdata-en-and-lettercount-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD 94d329c, tree snapshot 0 2a95487a78df0a34986d5689031ee5ad578f6904

## Pass 1 — 2026-09-28 22:40
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 2b6ad782def5d09e4834fe05853dfbeded2313d3  |  Fix: new `src/engine/index.test.ts`; `lang-data.test.ts` loops all 52 cards and adds the `'qu'` case  |  Checks: `npm test` 425/425, lint pass, check 0 errors
### Applied
- [major] `src/engine/index.ts` — no test pins the AD-2 surface this ticket defines (EN, letterCount, deal exported; EngineError, makeLangData, spelling internal); tsc does not fail on a missing or extra re-export → fixer item 1
- [minor] `src/engine/lang/lang-data.test.ts` 'R-85 letterCount is 2 for QU, 1 otherwise' — checks only cards 0 and 51; loop all 52 → fixer item 2
- [minor] `src/engine/lang/lang-data.test.ts` 'R-85 letterValue throws …' — the documented case-sensitivity (`'qu'` is not a glyph) is untested → fixer item 3
### Default applied (technical)
- `src/engine/index.test.ts` — how to pin the AD-2 runtime surface → new test `AD-2 …` comparing sorted runtime keys of `./index` to `['EN','deal','letterCount']`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-09-28 22:55
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 2b6ad782def5d09e4834fe05853dfbeded2313d3 (unchanged; no fix pass)
### Applied
- none (converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 2 passes
Final state (tree 2b6ad78, commit bca5f0f): `npm test` 425/425 pass, `npm run lint` pass, `npm run check` 0 errors.
Unapplied minors:
- `src/engine/index.test.ts` — the `type LangData` / `type CardId` exports are not pinned by a test; a type-level `expectTypeOf` use would make `npm run check` fail if either were dropped.
- plan Auto Run Result — out of date after pass 1: no `src/engine/index.test.ts`, still says 424 unit tests (now 425), letterCount test described as 0/51/QU only.
