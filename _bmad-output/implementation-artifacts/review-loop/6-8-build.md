# Review loop log — ticket 6.8 build (code mode)

State: pass 1: review
Pre-loop: HEAD 0d28628, range 8fa9499..HEAD, diff at 6-8-build.passes/pass0.diff (png excluded)

## Pass 1
Reviewers: correctness, verification gap  |  Findings: major 2 (same root: gap before '·' ~3.6px, no rendered-gap test), minor 0, decision-needed 0  |  Dropped: 0
Measured by reviewer: the leading space DOES render (flex item, white-space: pre); gap is only ~3.6 px, too narrow.
### Applied
- [major] Tray.svelte .pending-suffix — add padding-inline-start 0.25em (default applied, technical)
- [major] e2e/pending-draft.spec.ts — rendered-gap assertion (Range rect of '·' vs word right edge >= 6px)
State: pass 1: done
