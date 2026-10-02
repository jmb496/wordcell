# Review loop — ticket 4.4 build (code mode, dfa68a1..0fffa6c)
State: pass 4: done

Target: `_bmad-output/implementation-artifacts/review-loop/4-4-build.passes/pass0.diff` (git diff dfa68a1..0fffa6c)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-live-layout-gate-and-touch-action-regions-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 0fffa6c162ba8f09d04bd64475e61d9bf184f204, tree snapshot 0 6329d88cc16091d6e115a758deeb96284b32d140

## Pass 1 — 2026-10-02
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 4, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 83d73571fac027ef13634024f141f92320dbd3a1  |  Fix: items 1–5 applied; test-only, no production change. The fixer checked that moving the scrollY read after flushSync now fails three cases. Orchestrator check: npm test 39 files, 1743 passed; lint clean (147 files); check 0 errors
### Applied
- [major] src/ui/layout/layout.svelte.test.ts fake `scrollY` — the fake window never clamps scrollY when the document shrinks, so the "banner hide at max scroll 46 → 2" case passes whether scrollY is read before or after `flushSync()` → fixer item 1 (default applied: clamp the fake getter to `max(0, total − innerHeight)`)
- [major] src/ui/layout/layout.svelte.test.ts — no case reads non-zero probe insets at creation, so hard-coded zero insets at creation would pass → fixer item 2 (default applied: new AD-11 creation-with-insets case)
- [minor] layout.svelte.test.ts fake `addEventListener` — passive option for scroll/scrollend unasserted → fixer item 3
- [minor] layout.svelte.test.ts creation case — probe CSS (fixed, hidden, pointer-events none, env() paddings) unasserted → fixer item 4
- [minor] plan Acceptance Criteria 1 and 4 — overstate the coverage ("built app"; "any phase fixture") → fixer item 5
### Default applied (technical)
- Fake scroll clamp and the new creation-with-insets test, as above.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none. Not sent to the fixer: build-notes CAP-3 says the probe is "absolutely positioned" while code and plan say `position: fixed`. That doc is outside this diff, so the fix belongs with the epic's close-out doc edits (left as an unapplied minor).

## Pass 2 — 2026-10-02
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 6, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 9edb67bb390e8d9cf7964a7be9e8d6009edd9b31  |  Fix: items 1–9 applied, test-only. Each new or tightened test fails with its guarded behaviour broken (fixer). The item 7 MutationObserver catches a scroll write deferred by one frame (scrollY 0). e2e/layout.spec.ts: 6 passed, 4 skipped (android-only on desktop). Orchestrator: npm test 39 files, 1746 passed; lint clean; check 0 errors
Note: majors rose 2 → 3, but not because the refs are unclear. The pass-1 fixes all held (the fix-diff reviewer found nothing), and the three majors are independent test gaps in areas pass 1 did not touch. As in 3-8-build, the diverging diagnosis does not apply, so the loop continues.
### Applied
- [major] layout.svelte.test.ts 'two 60 px shrinks' — the first shrink's "keeps w" holds even under an always-recompute layout (cardWidth gives 46 at both 839 and 779) → fixer item 1 (default applied: a 779 → 719 case where a recompute would give 40)
- [major] layout.svelte.test.ts — "cardWidth/availableWidth get clientWidth; innerWidth feeds only the predicate" is untested: every case gives the same w from either input → fixer item 2 (default applied: hoverFine 427/412 case at 915, w 43, plus a clientWidth-only change that does not recompute)
- [major] gate.test.ts — "each raf first clears the flag … if busy it stops" has no busy-frame case → fixer item 3
- [minor] layout.svelte.test.ts flip/flip-back no-op — assert the `heights`/`metrics` references stay the same → fixer item 4
- [minor] layout.svelte.test.ts inset change — change one inset at a time → fixer item 5
- [minor] layout.svelte.test.ts fake matchMedia — record and assert the query → fixer item 6
- [minor] e2e/layout.spec.ts banner-shows-with-leftover-under-44 — check the row box at insertion time (same frame) → fixer item 7 (raised by two reviewers; merged)
- [minor] e2e/layout.spec.ts desktop regions premise — measure the rendered board width rather than a hard-coded 352 → fixer item 8
- [minor] e2e/layout.spec.ts 'banner takes leftover first' — assert w 46 at 412 × 915 → fixer item 9
### Default applied (technical)
- New Vitest cases for items 1–3, as above.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Edge-case reviewer's same-frame finding: a duplicate of the verification-gap reviewer's (merged into item 7).

## Pass 3 — 2026-10-02
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree a78686abd3270c8bc6c3f2e90c92c7a640017901  |  Fix: items 1–3 applied, test and plan only. Each new case fails with its guarded behaviour broken (fixer: stale `applied`, stale `last`, BAND_ORDER passed to bands()). Orchestrator: npm test 39 files, 1749 passed; lint clean; check 0 errors
### Applied
- [major] layout.svelte.test.ts — nothing chains two relayouts where the second depends on stored state. Untested: `applied` updated after each relayout (bands re-lay against the last applied inputs, anchor from the last applied result), and `last` updated on a w recompute. Production code is correct (layout.svelte.ts:166-174) → fixer item 1 (default applied: banner show → hide at 412 × 780; 915 → 779 → 719 shrinks)
- [minor] layout.svelte.test.ts — `?bands=` order not shown to feed `bands()`/`anchorScroll` → fixer item 2
- [minor] plan Auto Run Result > Files changed — stale case counts (15/16) → fixer item 3
### Default applied (technical)
- Two new chained-relayout Vitest cases and a `?bands=` case, as above.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 4 — 2026-10-02
Reviewers: fix diff, edge cases, verification gap, intent alignment (late-pass bar)  |  Findings: major 0, minor 1, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree a78686abd3270c8bc6c3f2e90c92c7a640017901 (no fix pass; pass 3 state)
### Applied
- none (zero majors: stopping rule met before the fix step)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 4 passes (majors 2, 3, 1, 0)
Final state (orchestrator run at 2f8b783, tree a78686a): `npm test` 39 files, 1749 passed; `npm run lint` clean (147 files); `npm run check` 0 errors, 0 warnings. The fixer ran `npx playwright test e2e/layout.spec.ts` in pass 2: 6 passed, 4 skipped (android-only on desktop). The full `test:all` was not run by this loop.
Technical defaults applied: 9 (all test or plan only; no production code changed).

Unapplied minors (for the next build or loop):
1. _bmad-output/specs/spec-epic-4-board/build-notes.md CAP-3 "Insets probe" — says the probe is "absolutely positioned"; the code and plan use `position: fixed`. Fix it with the epic's close-out doc edits.
2. e2e/layout.spec.ts 'AD-11 touch-action and user-select regions' — android is never wide and the only desktop case is wide, so a `--wc-pan` keyed on hoverFine rather than `wide` would pass. Add a non-wide desktop check (e.g. 1280 × 720 → `pan-y` on `[data-band="leftover"]`) before the 370 × 750 step.
