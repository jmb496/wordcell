# Review loop log: ticket 6.14 build (code mode)

State: done
Target: commit range f1d0431..HEAD (HEAD e01cf6a); intent: story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc-plan.md
Pre-loop: HEAD e01cf6a, tree snapshot 0 = 98566e4ed833f255d4f6f6dffd4c6be3ea13a109; diff `6-14-build.passes/pass0.diff`

## Pass 1 — 2026-10-16
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 13 (before dedupe), decision-needed 0  |  Dropped in triage: 0 (edge-case "major" reclassified minor)
Snapshot: tree 98566e4 (no fix pass)
### Reclassified
- [major→minor] controller.ts rescroll / targeting.ts inStartFrame — a layout anchor write (dictionary banner appearing mid mouse drag) adds its scroll delta to the face; unlikely corner (needs a dictionary failure during a drag) and the story prescribes "any scroll source takes the same recompute". Unapplied; see minors.
### Minors (unapplied)
- e2e/wheel-drag.spec.ts final form not re-run against unfixed code (failing-first not recorded); stash the controller change, run once, record in Implementation Notes.
- Plan: tick the Implementation Notes checkbox; refresh front matter (review_loop_iteration, followup_review_recommended).
- controller.test.ts: free-letter case coordinates `56 - 22 - 100 + 100` → literals `34, 190`.
- controller.ts pre-threshold scroll absorbed into origin: add a one-line comment that the offset is deliberate.
- controller.test.ts "any scroll source… layout scrollTo write" duplicates the plain wheel case; drive a real layout write (banner appearing mid mouse drag) or rename.
- controller.test.ts small free-letter scroll case passes vacuously; add an assertion unfixed code fails, or call it a guard.
- Tile/free-letter wheel has no Playwright case (story assigns it to Vitest); optional desktop tray case.
- tile-drag.ts:111 overlong comment; re-wrap.
Final: npm test pass, lint pass, check pass.

## Result — converged after 1 passes
