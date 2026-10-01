# Review loop — ticket 3.7 build (code, 6da8e6f..9734152)

State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/3-7-build.passes/pass0.diff` (6da8e6f..9734152)
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-score-history-store-and-finish-writes-plan.md`
Depth: thorough, max 7. Pre-loop HEAD 9734152, tree snapshot 0 611cbcdc36ea41f55a900854733f1aacaaa4e28f.

## Pass 1 — 2026-09-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree db8de07245516455abfdec5a4a7eaf316dd83903  |  Fix diff: 3-7-build.passes/pass1.fix.diff  |  Verify: npm test 1556 passed (27 files, 5.14 s), lint clean, check 0 errors; fixer ran blocking.spec.ts android 16 passed
Fixer: all 6 applied; item 5 uses Undo then giveUp (Redo after undoing a give-up throws r71-no-redo-data)
### Applied
- [major] plan Tasks & Acceptance "Tests mapping (sentence → test)" — not sentence-level and lists no exempt/deferred sentences (AGENTS.md Conventions; sibling 3.x plans do) → fixer item 1
- [minor] plan front matter `deferred: []` — Q-29 Replay half has only shell Vitest (Playwright in epic 6, SPEC CAP-6) and is not recorded as deferred → fixer item 2
- [minor] src/shell/game.svelte.test.ts double-throw case — only the remove branch of a throwing rollback is tested; add the write-back (`write(prevText)`) branch → fixer item 3
- [minor] src/shell/game.svelte.test.ts Session-write-throws rollback loop — the remove row skips the content check of the history write before the failing Session write → fixer item 4
- [minor] src/shell/game.svelte.test.ts score history store — no shell case appends a gaveUp record through dispatch → fixer item 5
- [minor] e2e/blocking.spec.ts §2 rejected variants without seeded history — no assertion that wordcell:history stays absent after New game → fixer item 6
### Default applied (technical)
- items 3–6: the reviewers' proposed test additions taken as the default
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
