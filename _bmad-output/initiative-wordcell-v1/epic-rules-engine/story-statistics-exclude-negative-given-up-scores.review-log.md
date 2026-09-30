# Review log — story-statistics-exclude-negative-given-up-scores.md (ticket 2.13)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 3f15022, copy `story-statistics-exclude-negative-given-up-scores.review-log.passes/pass0.md`, 170 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), docs/game-flow-spec.md (R-84, §9 Q-28/Q-44), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md, src/engine/history.ts, src/engine/history.test.ts, story-score-history-semantics-plan.md (done ticket 2.5 plan). D-STATS / Q-44 itself is the owner's approved decision and out of review scope.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 6, decision-needed 0  |  Dropped in triage: 4
Words (docs): 365 (2.1 x pass 0)  |  Snapshot: story-statistics-exclude-negative-given-up-scores.review-log.passes/pass1.md
Fixer: all 8 items applied; no commands touched.
### Applied
- [major] Acceptance Criteria, last clause — SPEC CAP-8 success and build-notes CAP-8 still require x.5/−x.5 (−5, −10 → −7) and the −0 case; every existing negative-average test uses gaveUp records that Q-44 now excludes, so the builder must guess delete vs rewrite → fixer item 1 (default applied: keep the tests, rebuild them from synthetic negative `won` records; predicate `outcome === 'won' || finalScore >= 0`, the literal Q-44 "every won record counts"; keep `+ 0` and its −0 doc line)
- [major] Acceptance Criteria, last clause — affected existing tests and their new expected values unlisted (mixed history avg 183 → 300; all-negative test contradicts R-84 now; longestWord-absent avg 0 → 10) → fixer item 2 (default applied: all-negative test becomes the only-negative-gaveUp absent test)
- [minor] AC — 0-score test must be one where inclusion is observable → fixer item 3
- [minor] AC — negative gaveUp record must hold the strictly longest word; best-exclusion shown by only-negative history → fixer item 4
- [minor] AC — "absent" asserted with `toStrictEqual` (keys omitted, not undefined) → fixer item 5
- [minor] Description — doc comment replacement citation (R-84, Q-44, D4) and interface comments unchanged → fixer item 6
- [minor] References — add SPEC.md CAP-8/D4, rule-coverage.md R-84 row, the two source files → fixer item 7
- [minor] AC — test names `R-84 … (Q-44)` → fixer item 8
### Default applied (technical)
- AC — how to keep the −x.5/−0 rounding coverage → synthetic negative won records, filter `outcome === 'won' || finalScore >= 0`
- AC — fate of the all-negative test → replaced by the only-negative-gaveUp absent test
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Ref-alignment: amend SPEC/build-notes to drop −x.5 and remove `+ 0` — conflicts with the default taken (spec keeps its requirement; no spec edit needed)
- −0 bestScore normalisation — unreachable from `gameRecord`, and qualifying won scores are the only possible −0 source; no behaviour change
- tickets.toml id 13 duplicates description/verify — board sync is preview-ticketing's job, outside this ticket file; left for the caller
- Duplicates of the above across lenses
