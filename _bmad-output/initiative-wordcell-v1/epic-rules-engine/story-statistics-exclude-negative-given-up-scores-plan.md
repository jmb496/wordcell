---
title: 'Statistics exclude negative given-up scores'
type: 'feature'
ticket: '13'
created: '2026-09-30'
status: 'built'
baseline_revision: '1f6b83d4fbc898b90ff3c6c35232eb35c9b4c0fa'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'auto'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-statistics-exclude-negative-given-up-scores.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** `statistics()` in `src/engine/history.ts` computes best and average score over all records, negative given-up scores included (Q-28). Owner decision D-STATS (R-84, Q-44, SPEC D4) excludes gaveUp records with `finalScore < 0` from best and average only.

**Approach:** Ticket 2.13 (context file) is the authority; apply its Description and Acceptance Criteria as written. A record qualifies iff `outcome === 'won' || finalScore >= 0`. Best and average are computed over qualifying records and are absent when none qualifies. Counts and longest word still cover all records. The `statistics()` doc comment clause "over all records, won and gaveUp, negative scores included (Q-28)" is replaced by R-84/Q-44/D4 wording; the A-E3 and tie wording stay. Tests in `src/engine/history.test.ts` change per the ticket's AC.

Review-log unapplied minors, each resolved:
1. Add `R-84 a negative won record still counts (Q-44)`: [won −100 (synthetic), gaveUp −50] → bestScore −100, averageScore −100. **Adopted.**
2. Only-negative test reuses the replaced test's inputs (gaveUp −100, −20, −60, no words) → `toStrictEqual({ gamesPlayed: 3, gamesWon: 0, gamesGivenUp: 3 })`. **Adopted.**
3. First new test asserts the full object with `toStrictEqual` (gamesWon 1, bestScore 100). **Adopted.**
4. The A-E3 rounding tests get a comment noting that negative `won` records are unreachable from `gameRecord` (R-80) and exist only to exercise rounding. **Adopted.**
5. `Statistics` interface comment "absent on a history without a value for them": **not changed**, because the ticket says the interface comments stay. The rewritten `statistics()` comment states the Q-44 absence rule.
6. Modified existing tests keep their names, and all other `statistics` tests stay unchanged. **Adopted.**
7. Only the Q-28 clause of the doc comment is replaced. **Adopted.**

</intent-contract>

## Implementation Notes

Oneshot: two files and about 50 lines, with a precise ticket AC.

Implemented in the main session. `src/engine/history.ts`: the `statistics()` body filters to qualifying records (`scored`) for best and average; the doc comment's Q-28 clause is replaced with R-84/Q-44/D4 wording. `src/engine/history.test.ts`: the tests follow the ticket AC and minors 1–4 and 6 (see the intent). The "all-negative history" test is replaced by four new Q-44 tests. The synthetic-won comment sits above the A-E3 rounding group. Mutants: dropping the filter fails 5 tests; dropping the `won` clause fails 4, including `a negative won record still counts (Q-44)` and the three rounding tests. `npm run test:all` exits 0.

## Plan Change Log

## Review Triage Log

### 2026-09-30 — Review pass
- verdicts: 1 findings — high 0, medium 0, low 0, false 1, maybe-false 0
- findings:
  - `false` `reject` New plan file added as mode 100755 — the repo has `core.fileMode=false`, so git stages it as 100644; the 755 came only from the `git diff --no-index` used to put the untracked file into the review diff.

## Verification

**Commands:**
- `npm run test:all` -- expected: green, with the new `R-84 … (Q-44)` tests passing.
- Mutant check: remove the qualify filter and confirm the new Q-44 tests fail, then revert.

## Auto Run Result

- **Summary:** `statistics()` now computes best and average score over qualifying records only: won records, plus gaveUp records scoring 0 or more (R-84, Q-44, D4). Counts and longest word still cover every record. Best and average are absent when no record qualifies.
- **Files:** `src/engine/history.ts` (the qualifying filter and the doc comment); `src/engine/history.test.ts` (four new `R-84 … (Q-44)` tests; mixed and longestWord-absent expectations updated; the all-negative test replaced; the A-E3 rounding tests use synthetic negative won records).
- **Review-log minors:** 1–4, 6 and 7 adopted. Minor 5 (the `Statistics` interface comment) was not applied, because the ticket keeps the interface comments; the `statistics()` comment states the Q-44 absence rule.
- **Review:** quick lens, 1 finding, rejected as false (file mode; see the triage log). No patches, no deferrals.
- **Follow-up review recommended:** false (0 patched: high 0, medium 0, low 0).
- **Verification:** `npm run test:all` exited 0. The history test file passes 54 tests. The mutants fail the tests (filter removed: 5 tests fail; won clause removed: 4 fail).
- **Residual risks:** none known. `statistics` has no callers outside `src/engine/history*` yet; the epic-3 UI will read these values.
