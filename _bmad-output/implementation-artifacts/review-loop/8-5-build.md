# Review loop — ticket 8.5 build (code, quick, max 7)

State: done
Pre-loop: HEAD 216cb69, tree snapshot 0 812295dc6f11a078dc58f0ea42f77fb866238ee6. Range 216cb69~1..HEAD (build commit 216cb69). Intent: story-panel-layout-docs-budget-and-sweep-plan.md

## Pass 1 — 2026-10-16
Reviewers: correctness, verification gap  |  Findings: major 0, minor 6 (after merging), decision-needed 0  |  Dropped in triage: 0
Snapshot: none (no fix pass)
### Applied
- none
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass

Unapplied minors:
- e2e/how-to-play.spec.ts tap pause/restart test: add `currentTime` to `sceneAnimations` and assert it is frozen; require `paused` (not `finished`).
- e2e outline/order tests: drop the tautological `toHaveLength(7)`; replace the `order.slice(9)` offset with `indexOf(h.goal)`.
- AD-14 e2e test: the removed `touch-action: pan-y` check has no replacement on scene cards (`.panel figure .card`).
- how-to-play.test.ts HP-7: `not.toContain('class="example"')` is vacuous under Svelte scoped classes.
- Ticket Notes HP-5/HP-6 rows cite tests loosely; name exact tests or exemption reasons (aria-hidden, `act()`).

Final status at HEAD: npm test pass (2894 tests), lint pass, check pass.
