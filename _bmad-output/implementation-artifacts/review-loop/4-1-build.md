# Review loop — ticket 4.1 build (code mode, c3e49c1..457dfcc)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/4-1-build.passes/pass0.diff` (git diff c3e49c1..457dfcc)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-layout-definition-and-geometry-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 457dfcc45f5b850988ae1e0e2fdf089ae6425ea2, tree snapshot 0 bd3d11879f0bc21dc5a813089fbd5b745d7088c0

## Pass 1 — 2026-10-01
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5, decision-needed 0  |  Dropped in triage: 1 (merged duplicate)
Snapshot: tree 127df76f3162f0418976fc69475ed79bac5a5ee3 (fix diff `4-1-build.passes/pass1.fix.diff`)
Fixer: items 1–6 applied (geometry.ts `heightRuleSum`, algebraic `total`, cardWidth no-validation comment; 4 new/extended AD-11 tests); orchestrator rerun: `npm test` 36 files, 1699 passed; lint clean (130 files); check 0 errors, 0 warnings.
### Applied
- [major] src/ui/layout/geometry.test.ts banner-growth cases — banner growth is never placed below ANCHOR_BAND, so a named-neighbour `absorbed` (slackAbove-only) passes every banner test → fixer item 1
- [minor] geometry.test.ts 'tray growth with slack and tray both below the anchor' — slack-below exhaustion untested (remainder must land in total, anchor unchanged) → fixer item 2
- [minor] geometry.test.ts banner shown + trayRows 3 (default order) — total and tray not asserted → fixer item 3
- [minor] geometry.test.ts — banner + tray together exceeding leftover on the slack side (412 × 780) untested → fixer item 4
- [minor] geometry.ts bands()/cardWidth() — float drift with non-binary fractional insets (total 839.0000000000001, scroll range 1e-13; exact fit lost) → fixer item 5
- [minor] geometry.ts cardWidth() — NaN clientWidth returns NaN silently; validation waiver stated only for bands/trayGrowth → fixer item 6
### Default applied (technical)
- geometry.ts float drift — sum integer band terms first, insets last; total equals innerHeight exactly while leftover > 0
- cardWidth inputs — document the rule-6 no-validation waiver (callers pass DOM numbers); no runtime check
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge cases: "banner below the anchor while slack above" — duplicate of the verification-gap major (merged into item 1)
