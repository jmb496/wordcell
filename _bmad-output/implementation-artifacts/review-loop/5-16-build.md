# Review loop — 5-16-build (code mode)

State: pass 2: done
Target: git diff 054c82c..HEAD (pass0.diff); pre-loop HEAD bf274f7, tree snapshot 0 fcd8d2a469104e98c9541059a53ec4908d00396c
Intent: _bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-flip-for-controller-driven-moves-plan.md

## Pass 1 — 2026-10-14 11:42:58
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor ~9, decision-needed 0  |  Dropped in triage: 2 (parted-offset e2e downgraded to minor, covered by unit snapshot; test:screens/gate-idle are process items, recorded not fixed)
Snapshot: tree 50e677a7d6bdae2a020c6cae83f1cafe87f36f50
### Applied
- [major] controller.test.ts — no test for throwing dispatch (play must not run) → fixer item 1
- [minor] fake play ignores result; vacuous capture=play invariant; free-letter release order test; stale free-letter.spec comment; loosened race-prone exact face sets; plan task ticks
### Default applied (technical)
- sameId/longPress invariant ends not added (0=0 non-discriminating); added a dispatching 'up' with capture=play=1 instead
### Decision needed
- none
### Not fixed (recorded)
- test:screens not run (Docker unavailable); gate-idle not asserted in e2e (hook does not expose gate)

## Pass 2 — 2026-10-14
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 4, decision-needed 0  |  Dropped in triage: 0
### Open major (recorded, not fixed: second consecutive pass with at most one major)
- controller.test.ts — the "no end leaves a capture pending" invariant is not tested for the free-letter drag (ends and no-edit release), sameId, tail up with null highlight, longPress or sheet/scrim; code read-through by the edge-case lens found no pending-capture path.
### Minors (unapplied)
- P5 e2e press assertions weak (glide may end naturally; pause animations before the press)
- drag-as-tap `card === null` fixture does not prove the null branch was reached
- setTarget no-op proven only against a fake play
- no e2e asserts glide duration equals snap
- from pass 1: deferred gate-idle e2e; test:screens not run (Docker unavailable)

## Result — converged after 2 passes
open major: the capture=play invariant has no test for free-letter drag ends, sameId, tail null-highlight up, longPress, sheet/scrim.
Final: npm test pass (2299), lint pass, check pass.
