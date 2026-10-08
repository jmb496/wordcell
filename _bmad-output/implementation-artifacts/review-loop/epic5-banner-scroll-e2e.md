# Code review loop — banner-during-scroll e2e (commit b94b7b2)
State: pass 1: done

Target: range b94b7b2~1..b94b7b2 (`_bmad-output/implementation-artifacts/review-loop/epic5-banner-scroll-e2e.passes/pass0.diff`). Intent: make the flaky "banner during a scroll" e2e in e2e/layout.spec.ts deterministic without retries or added timeouts; test-only; root cause in the commit body.
Refs: AGENTS.md, CLAUDE.md, ARCHITECTURE-SPINE.md (AD-11, AD-12, AD-17). Depth: thorough, max 7.
Pre-loop: HEAD b94b7b2, tree 0 c2ed46a27a57f2e4e53c7e78e586362eda55923f.

## Pass 1 — 2026-10-08
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 4, decision-needed 0  |  Dropped in triage: 0 (5 duplicates merged)
### Applied
- [major] e2e/layout.spec.ts settle / panThroughFailure — `settle` still resolves on any new scroll event whose y equals scrollY, so the fix holds only if one move = one scroll event; a move split across frames (or a queued remainder) brings back the intermediate-baseline flake. A verification-gap reviewer saw 1 failure in ~360 runs (:296, hide variant, assertion lost). Merged edge-case + verification-gap majors. → fixer item 1 (default applied: settle waits for the position the move should reach, not any event)
- [minor] e2e/layout.spec.ts:176 — header line 120 chars > biome lineWidth 100 (3 reviewers) → item 2
- [minor] e2e/layout.spec.ts:175-177 — header says "21 px move past the touch slop" (reads as beyond it) and omits that setup steps are each settled → item 3
- [minor] e2e/layout.spec.ts:217 — 21 px silently assumes Chromium's 15 px touch slop → item 4
- [minor] e2e/layout.spec.ts:175 — "Path 1 (plan Design Notes)" no longer matches the plan's 3 px slop steps; note the deliberate deviation → item 5
### Default applied (technical)
- settle — wait condition → wait until scrollY reached the move's expected direction/magnitude, then settle one frame
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fix outcome
- 1: `settle(count, from, sign, min)` now also waits until scrollY moved `sign`-wards from `from` by ≥ `min` (2) px; slop move `settle(start, 0, 1, 2)`, 3 px steps `settle(count, last.y, 1, 2)`, `step()` derives sign from `dir` (flip moved after settle). Observed scrollY 6 → 9 → 12 → 15, then 12/15.
- 2–5: header rewrapped ≤ 100 cols, "across the touch slop … each settled", "21 px = Chromium's 15 px touch slop + 6 px of scroll (scrollY 6)" (observed), plan-deviation note citing b94b7b2.
- Fixer runs: lint clean; check 0 errors; npm test 2082 passed; android `--repeat-each=30 --workers=4 --retries=0` 60/60; extra `--repeat-each=200 --workers=8` 400/400.
- Orchestrator verify: lint, check, npm test (2082) all pass. Snapshot: tree e4eeba0df169a6b0ef490fab6d5d0b73b9388be7; fix diff `pass1.fix.diff`.
