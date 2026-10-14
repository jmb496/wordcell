# Review loop — 5-16-build (code mode)

State: pass 1: done
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
