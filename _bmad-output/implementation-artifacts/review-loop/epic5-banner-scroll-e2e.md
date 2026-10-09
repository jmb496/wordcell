# Code review loop — banner-during-scroll e2e (commit b94b7b2)
State: pass 2: done

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

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5, decision-needed 0  |  Dropped in triage: 2 (6 duplicates merged)
Snapshot: unchanged (tree e4eeba0df169a6b0ef490fab6d5d0b73b9388be7); no fix pass (stopping rule).
### Open (not fixed, stopping rule)
- [major] e2e/layout.spec.ts:195-197, 219-223, 226, 234, 245 — pass-1 item 1 only partly resolved: every `settle` call passes `min` 2 (slop move expects +6, steps ±3), so a 2+1 / 2+4 split still settles part-way, and the inline comment "one move is one scroll event, so `last` is never an intermediate position" contradicts settle's "a move split over frames does not settle early". The flake symptom stays fixed (the next settle needs the opposite sign from `last`). Proposed default: `min` just under the full move (e.g. 5.5 for the slop move, 2.5 per 3 px step, allowing DPR rounding) and reword :219 to "each move settles once scrollY reached its position". (intent alignment major; fix-diff + edge-case minors merged)
### Minors (unapplied)
- e2e/layout.spec.ts:198-211, :228, :237, :247 — the poll now enforces direction/distance, so the labelled expects after it cannot fail; a stalled/reversed scroll fails as an unlabelled `expect.poll` timeout. Default: pass a message to `expect.poll` (caller's label) and drop the redundant expects. (3 reviewers)
- e2e/layout.spec.ts:176 — header cites commit hash b94b7b2, unstable under squash/rebase; cite "the ticket 5.2 flake fix" instead.
- e2e/layout.spec.ts:226 — first settle hard-codes `from` 0; read scrollY before the 21 px move and pass it.
- commit b94b7b2 body, Fix paragraph — "settling on its single scroll event" is stale vs the `min` guard; reword if the WIP commits are ever squashed into it.
### Dropped
- fix diff: prescribed run once failed 5/60 — concurrent reviewer Playwright runs shared the dev server on :5173 (`reuseExistingServer`); orchestrator re-ran alone: `--repeat-each=30 --workers=4 --retries=0` android 60/60. Environmental.
- verification gap: setup failures (port 5173 in use, ERR_CONNECTION_REFUSED) in its stress runs — same concurrency cause; ~195 pan runs passed with no settle or "scrollY changes" failure.

## Result — converged after 2 passes
open major: settle `min` 2 below the full move + contradictory inline comment (e2e/layout.spec.ts:195-245), see Pass 2 Open.
Final state: lint clean, check 0 errors, npm test 2082 passed; android banner-during-scroll `--repeat-each=30 --workers=4 --retries=0` 60/60 (alone).
Unapplied minors: the four listed under Pass 2 Minors.
