# Review loop — ticket 4.1 build (code mode, c3e49c1..457dfcc)
State: pass 2: done

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

## Pass 2 — 2026-10-01
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 8, decision-needed 0  |  Dropped in triage: 2 (duplicates merged)
Snapshot: tree 127df76f3162f0418976fc69475ed79bac5a5ee3 (no fix pass; pass 1 state, commit 84e5008)
### Applied
- none (zero majors: stopping rule met before the fix step)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- verification gap "total never checked against the sum of heights" — duplicate of intent alignment's minor (kept as minor 2)
- edge cases "anchorOffset not computed integer-first" — duplicate of intent alignment's minor (kept as minor 3)

## Result — converged after 2 passes
Final state (orchestrator run at tree 127df76, commit 84e5008): `npm test` 36 files, 1699 passed; `npm run lint` clean (130 files); `npm run check` 0 errors, 0 warnings.

Unapplied minors (for the next build or loop):
1. geometry.test.ts 'AD-11 banner and tray growth together exceed leftover' — assert `after.total` 830 and scroll range 0–50 (pins the exhausted-leftover branch of the closed-form `total`).
2. geometry.ts bands() `total` (closed form since pass 1) — no test checks it equals the sum of `heights`; add a `toBeCloseTo(…, 9)` sum check in the test `layout()` helper (also covers growth landing in a band below the anchor in non-default orders) and assert `heights.tray` 224 in the fallback-order case.
3. geometry.ts bands() anchorOffset — still summed in band order with the fractional top inset inside topBar, unlike `heightRuleSum`; with fractional insets anchorScroll deltas carry ulp noise (insets {0.1, 0.7}, 760, banner: 22.799999999999955). Compute integer-first, or fold into the deferred entry-4 sub-pixel tolerance item.
4. geometry.test.ts — no case at the exact absorb boundary (412 × 782, leftover 44, banner shown → leftover 0, total 782, anchor 653, delta 0) where `total` switches branches.
5. geometry.test.ts F21 — innerHeight-only change untested with slack below the anchor (`topBar,banner,columns,wordcells,tray,leftover,actionBar`: 839 → 779 delta 0; 780 → 710 delta 0, range 0–28).
6. bands.ts / geometry.ts purity (AD-11 "geometry.ts is pure") — no scan test; add `AD-11 layout modules are pure` reading both files with node:fs for the AD-1 forbidden tokens, `import.meta` and `svelte`.
7. bands.test.ts:62-63 — `toThrow(Error)` accepts subclasses; assert the thrown value's constructor is `Error` to pin "plain Error".
8. cardWidth exact-fit with fractional insets (734.3, {0.1, 0.2} → 44 after pass 1) — fixed in code but untested.
