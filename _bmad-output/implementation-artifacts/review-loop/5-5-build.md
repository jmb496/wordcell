# Review loop — ticket 5.5 build (code mode, d2adfce..7866052)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-5-build.passes/pass0.diff` (git diff d2adfce..7866052)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-tile-tap-selection-swap-and-removal-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 7866052b1d26b97661b78ab1185af679c52a8aa3, tree snapshot 0 484a106ddd4a9a975056cb19ce96bc4344c39726

## Pass 1 — 2026-10-09
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 4, decision-needed 0  |  Dropped in triage: 2 (duplicates merged)
Snapshot: tree c0baa8f634eb00e9fbf5632d8a01452f7b5e32aa (fix diff 5-5-build.passes/pass1.fix.diff)
Fixer: all 5 applied; item 1 uses freeLetters [7, 4] (cell 7 top 13) and was shown to fail a `freeLetters[0]` mutant; item 3 row-2 swap skipped (no live tile in row 2 of session-place-compact + one Undo); orchestrator re-run: `npm test` 54 files, 2125 passed; lint clean (196 files); check 0 errors; fixer ran e2e/tile-tap.spec.ts android 20 passed.
### Applied
- [major] src/ui/gestures/tile.test.ts, controller.test.ts tileView — every free-letter removal test runs on a draft with one free letter, so a `freeLetterCell` returning `freeLetters[0]` would pass; add a second free letter listed first and assert both removals pick their own cell → fixer item 1
- [major] e2e/tile-tap.spec.ts:295, :316, :306, :418, :431, :449, :159 — P5 names claim ids they do not cover (R-41 is ticket 7's; hide/show, full pitch, back led by R-33; `R-35 (UI)` though R-35 has no (UI) tag); rename to the owning id (R-40/F13, AD-9 F1, AD-12 F2, AD-13), merged with intent-alignment minor on :306 → fixer item 2
- [minor] controller.test.ts F2 pitch case / e2e/tile-tap.spec.ts:431 — the ticket's "press in the selected tile's own half-gap resolving to it" is only true by stub construction; add a P5 tap in the selected row-1 tile's half-gap (deselects, Session unchanged) and a selected row-2 tile tapped in row 1's lower half-gap (swaps) (merged with edge-case minor) → fixer item 3
- [minor] controller.test.ts 'AD-12 epic 5 tile tap' — sticky view continuation, scrim tap and back closing a view keep the selection with no controller test → fixer item 4
- [minor] e2e/tile-tap.spec.ts:198 non-word swap step — no `expectSelected(page, null)` after the swap → fixer item 5
### Default applied (technical)
- e2e/tile-tap.spec.ts names — lead each test with the id that owns the behaviour (AD-n or SPEC F-id), never an id another ticket covers
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case half-gap finding — duplicate of verification-gap minor 3 (merged)
- intent-alignment hide/show rename — duplicate of verification-gap major 2 (merged)
