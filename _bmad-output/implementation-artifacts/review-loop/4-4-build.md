# Review loop — ticket 4.4 build (code mode, dfa68a1..0fffa6c)
State: pass 1: done

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
