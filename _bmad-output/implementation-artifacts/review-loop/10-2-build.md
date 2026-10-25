# Review loop — ticket 10.2 build (code, quick, max 7)

State: pass 2: done

Pre-loop: HEAD 02b125b, range 1190a6f..HEAD, tree0 2eb7c4c466a32dc32243f222f7dbbd14516042df, diff _bmad-output/implementation-artifacts/review-loop/10-2-build.passes/pass0.diff

## Pass 1
Reviewers: correctness, verification-gap | Findings: major 2, minor 2, decision-needed 0 | Dropped: 0
### Applied (in progress)
- [major] EndSheet.svelte .word — no shrink to 14 px before wrap (ticket/DESIGN contract) → fixer 1
- [major] end-sheet.screens.spec.ts — scroll not asserted, baselines not compare-run → fixer 2
- [minor] end-sheet.test.ts test name; e2e `?? 0` fallback and no-focusable check → fixer 3, 4
### Default applied (technical)
- shrink via CSS clamp with 14px floor
Snapshot: tree b92a665c0fb1c1ebbe5d90e171e7075463312021. Note: 6 pre-existing screenshot baseline mismatches (expanded/history-unreadable/not-added) fail without this work too.

## Pass 2
Reviewers: fix-diff | Findings: major 1 (dropped), minor 4, decision-needed 0 | Dropped: 1
### Dropped
- Words baselines not compare-run — disproved: pass-1 fixer ran `npm run test:screens` in Docker, the 6 Words tests passed against the committed baselines (the CSS leaves 16px at 360 px).
### Minors (unapplied)
- screens spec: `scrollTop > 0` poll assumes overflow in every project
- e2e `wordSize >= 14` is weak (add <= 16 and a 3-letter row at 16px)
- `.word` clamp uses heuristic 0.75em/6.5rem; worst-case wide 10-letter word unmeasured
- `boundingBox()!` trips biome noNonNullAssertion (the one lint warning, e2e/end-sheet.spec.ts:779)

## Result — converged after 2 passes
