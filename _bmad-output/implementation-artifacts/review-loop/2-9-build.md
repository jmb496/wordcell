# Review loop — ticket 2.9 build (code mode)
State: pass 1: done

Target: `6f03e95..HEAD` (commit 567524c), diff at `2-9-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-score-history-semantics-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD 567524c, tree snapshot 0 3a819dc96a9359dcbedf5587b5f403f0dafb04fa

## Pass 1 — 2026-09-29
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 5, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 3a819dc96a9359dcbedf5587b5f403f0dafb04fa (no fix pass; HEAD 567524c). Orchestrator run: `npm test` pass, lint pass, check 0 errors.
### Applied
- none (zero majors; stopping rule met before fix)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge: R-74 uses two gaveUp finishes, not the ticket's gaveUp-then-won — duplicate of the correctness finding (kept below)

## Result — converged after 1 pass

Unapplied minors:
- `src/engine/history.test.ts` R-74 test — ticket text says gaveUp then won; the plan deliberately uses two gaveUp finishes (review-log minor); optionally add a gaveUp(seed 1) → won(seed 1) variant too.
- `story-score-history-semantics-plan.md` AC "Given R-74" — says the records differ "only in finalScore"; they also differ in longestWord (Implementation Notes say so); reword the AC.
- `history.test.ts` reconcileHistory — no removal test for un-finishing a give-up at cursor index 0 (R-75/R-70 boundary); add `reconcile([...EARLIER, recordOf(GAVE_UP0)], GAVE_UP0, play(GAVE_UP0, [UNDO]))` → EARLIER.
- `history.test.ts` statistics test names — several lack "(A-E3)" though the ticket asks for it in statistics/rounding names.
- `history.test.ts` "R-84 a replay-invalid Session throws replay’s EngineError" — the fail-fast check is not an R-84 sentence; rename to an AD-6 id (rule 6).
