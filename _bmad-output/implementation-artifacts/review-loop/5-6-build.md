# Review loop — ticket 5.6 build (code mode, c80a447..779458b)
State: pass 2: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-6-build.passes/pass0.diff` (git diff c80a447..779458b)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-insertionindex-gap-rects-and-parting-offsets-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 779458b9c67b94687958ac59787519ca51150643, tree snapshot 0 76fe9ce89d9a8c351d082509535967803016ebc0

## Pass 1 — 2026-10-09
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 5d7269506618f72369f5cdb4028c8e7153131947 (fix diff 5-6-build.passes/pass1.fix.diff)
Fixer: all 3 applied; tickets.toml entry 7 verify gained the slotRects-vs-rendered-faces clause (no entry 7 story file yet), plan `deferred` points at it; new tray.test.ts case 'AD-12 free-letter parting offsets, block right still across a row break when parted: two segments, two locks'; new targeting.test.ts case '… block right across a row break: over mirror slot 7 (row 1 start) → gap 0, not gap |M|'; owner note covers both block sides. Orchestrator re-run: `npm test` 54 files, 2175 passed; lint clean (196 files); check 0 errors.
### Applied
- [major] plan `deferred` + tickets.toml entry 7 verify — the DOM-vs-slotRects geometry check is deferred to entry 7, but entry 7's ticket never asks for it, so the deferral can be lost; add it to entry 7's verify and story → fixer item 1
- [minor] tray.test.ts free-letter block-right parting case — parted mirrors end on one row; no free-letter case where the parted block stays split across a row break (two segments, two locks) → fixer item 2
- [minor] targeting.test.ts block right / plan owner note — F3 nearest-centre with the block right across a row break sends a face over a row-1 mirror to gap 0; pin it with a test and widen the owner UX note to both block sides → fixer item 3
### Default applied (technical)
- entry 7 tickets.toml verify + story — add a Playwright android check of resting (and one parted) tile face rects against `slotRects` rather than writing e2e now (plan forbids touching e2e)
### Decision needed (functionality / UX / gameplay)
- none (the nearest-centre outcome follows confirmed F3; it stays a non-blocking owner note in the plan)
### Dropped
- none

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 4, decision-needed 1  |  Dropped in triage: 1 (duplicate merged)
Snapshot: tree 5d7269506618f72369f5cdb4028c8e7153131947 (unchanged; stopping rule met, no fix pass)
### Open (not fixed; stopping rule: two consecutive passes with at most one major)
- [major] src/ui/gestures/targeting.test.ts 'AD-12 insertionIndex' — no case discriminates F3's Euclidean metric: every cross-row case gives the same winner under Manhattan or Chebyshev, so `|dx| + |dy|` would pass; add 'AD-12 insertionIndex uses Euclidean distance' with one gap centre offset (30, 0) and another (20, 20) from the face centre, expecting the diagonal one (`toBe`)
### Default applied (technical)
- none this pass (no fix pass)
### Decision needed (functionality / UX / gameplay)
- targeting.test.ts block right across a row break; SPEC CAP-5 success line 169 vs F3 — when the word's destination block wraps onto the next row, a tile dragged past the block onto that row lands at the nearest gap of the word (e.g. its middle), not at the end of the word; SPEC CAP-5 expects "a tile dragged past the block landing at the M end" — proposed default: keep F3's nearest-centre rule; entry 7's "past the block" Playwright case uses a block within one row; the owner judges the wrapped case in hand once entry 7 wires the drag
### Dropped
- intent-alignment plan verification-record minor — duplicate of the fix-diff minor on the stale 2173 count (merged)

## Result — converged after 2 passes
open major: targeting.test.ts has no insertionIndex case that distinguishes Euclidean from Manhattan/Chebyshev distance (F3); add the (30, 0) vs (20, 20) case.

Unapplied minors:
- plan Auto Run Result / Implementation Notes — "2173 unit" and "test:all exit 0 after patches" predate the pass 1 tests (now 2175; pass 1 re-ran npm test, lint, check only); re-run test:all/test:screens and update, or note the scope of the re-run.
- tickets.toml entry 7 verify geometry clause — `n` undefined and the mid-drag comparison unspecified; write it as face p (nothing selected, no lift) = `slotRects(trayLayout(n, w, inner), origin, perRow × rows)[p]` at rest, and mid-drag each non-dragged face p = `slotRects[partingOffsets(...)[p].slot]` once parting settles, dragged face excluded, compared to whole pixels.
- plan owner note / entry 7 verify — say the "past the block" Playwright case uses a block within one row (ties to the decision-needed item above).
