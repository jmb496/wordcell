# Review loop — 90de645 (F37 fix, F34 banner e2e, Q-18 name)
State: pass 2: done
Pre-loop: HEAD 1d40a4b, tree 0 3f4253f77fbd18fc5387675d53ea2d33b696d78a; target _bmad-output/implementation-artifacts/review-loop/4-retro-f37.passes/pass0.diff

## Pass 1 — 2026-10-08
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 7, decision-needed 0  |  Dropped in triage: 2 (duplicates of 1)
### Applied
- [major] controller.test.ts F37 — no test for the other half of the F37 rule (raw null under a bar and the face off the source's unclipped rect → left; return lights the source, release self-drops) → fixer item 1 (correctness, verification gap, intent alignment)
- [major] EXPERIENCE.md Drop targeting step 5 — still says "another column or no column" leaves the source; contradicts F37 / spine AD-12 → fixer item 2
- [minor] controller.test.ts F37 press point lies under the mocked bar; press on the visible sliver → item 3
- [minor] F37 only under the top bar; add the action-bar case → item 4
- [minor] rule-coverage.md Q-18 / Q-34 / AD-12 hasLeftSource rows stale → item 5
- [minor] no Playwright case for the F37 scenario (R-14 (UI) / Q-34) → item 6
- [minor] under-bar two-column asymmetry: pin with a Vitest, keep spine wording → item 7 (default applied)
- [minor] banner e2e lacks a premise that the band below the top bar overlaps column 3 ≥ 25 % → item 8
### Default applied (technical)
- overSource tests only the source candidate → keep AD-12 wording, pin with a Vitest (item 7)
Fix: fixer applied items 1–8 (tests and docs only; controller.ts unchanged); npm test 2062 passed, lint clean, check 0 errors; e2e drag+tap android 36 passed. Snapshot: tree f0129da52fd57caef8019d803b3e891985394d1f

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge cases + verification gap, intent alignment  |  Findings: major 0 after triage, minor 4, decision-needed 0  |  Dropped/reclassified in triage: 3
### Reclassified
- [major → outside this change] AGENTS.md:59-60 (managed block) still budgets the unit suite "on the dev machine" while F41 moved it to a Linux-filesystem checkout (intent; edge+verify). Not fixable here: the managed block changes only through `bmad-project-context`, which needs the owner (retrospective G4). Tracked as G4.
- [major → minor] e2e F37 test: no premise that the nudge crosses DRAG_PX 8 with `raw` null (fix diff; edge+verify). The pass-1 fixer verified the test fails when the F37 condition is reverted; on the Pixel 7 profile the nudge is about 11 px. Minor: add the premise.
### Unapplied minors (converged)
- e2e/drag.spec.ts F37 test: `expect(from.y - nudge.y).toBeGreaterThanOrEqual(8)` citing DRAG_PX
- e2e F37 test title: lead with R-14 ("R-14 Q-34 AD-12 F37 …") per AGENTS.md naming; update the rule-coverage Q-34 quote
- SPEC.md:225 "`hasLeftSource` set from `raw` (including `null`)" → F37 wording
- SPEC.md F38 row: "(split and dev-checkout measurement superseded by F41)"

## Result — converged after 2 passes
Majors per pass: 2, 0. Technical defaults applied: 1. Decision-needed: 0. Final: npm test 2062 passed, lint clean, check 0 errors (tree after pass 1). Unapplied minors: the four listed under Pass 2 (applied by the orchestrator after the loop, see below).
Orchestrator, 2026-10-08: the four minors applied after the loop (premise and rename in e2e/drag.spec.ts, SPEC.md:225 and the F38 note, rule-coverage Q-34 quote); test:all green (unit 2062, dist 14, e2e 373, pwa 12).
