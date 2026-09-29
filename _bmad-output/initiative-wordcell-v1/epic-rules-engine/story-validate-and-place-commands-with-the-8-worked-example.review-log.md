# Review log — story-validate-and-place-commands-with-the-8-worked-example.md (ticket 2.5)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 38243a1, copy `story-validate-and-place-commands-with-the-8-worked-example.review-log.passes/pass0.md`, 151 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md, story-langdata-en-and-lettercount-plan.md, story-session-createsession-replay-and-checksession-plan.md, story-composing-commands-and-the-command-table-plan.md.

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 3, decision-needed 0  |  Dropped in triage: 1 (plus duplicates merged across the four lenses)
Words (docs): 922 (6.1 x pass 0)  |  Snapshot: story-validate-and-place-commands-with-the-8-worked-example.review-log.passes/pass1.md
Fixer: all 13 items applied; no commands touched.
### Applied
- [major] Description, validate — check order contradicts build-notes CAP-4 (dictionary presence before R-36); check codes unnamed (new dictionary code) → fixer item 1
- [major] AC "the new table rows" — rows not enumerated (wrong phase, gaveUp status, dictionary, domain, equal no-op, non-permutation) → fixer item 2
- [major] validate outcomes — R-38 failed Validate (same reference, redo kept, `rejectedWord`, QU "qu") and R-71 successful-Validate advance unspecified → fixer item 3
- [major] setTarget/setPlacementOrder — R-71 Place-edit lowering, tail drop, R-51 target change keeps order, AD-2 no-op/throw unspecified; R-71 scope vs entry 6 unclear → fixer item 4
- [major] confirm — no R-60 test (discard redo, reached committed, cursor, commit position) → fixer item 5
- [major] "legal targets" not observable without `view` (entry 8) → fixer item 6
- [major] R-40/R-42 boundaries (10+ letters clamp to 10, L = 3) and R-36 QU boundary untested → fixer item 7
- [major] R-51 default order on a right-side draft with k ≥ 2 untested → fixer item 8
- [major] §8 test assertions and "DEKA… impossible" mechanism unspecified → fixer item 9
- [major] References omit SPEC CAP-4/D2, build-notes CAP-4, rule-coverage, AD-2, ticket 2.4 plan → fixer item 10
- [minor] Notes — stale open question → fixer item 11
- [minor] no-op comparison — sameDraftData omits cursor/gaveUp (entry 4 hand-off) → fixer item 12
- [minor] out-of-scope/exempt sentences not named → fixer item 13
### Default applied (technical)
- dictionary-missing check code → new `command-dictionary`, listed in errors.ts
- legal-target observation → validate's default `targetCell` = min(L, 10), `setTarget` accepted up to it, next cell throws `r40-target-cell`
- R-71 split → this ticket implements and tests its commands' advance/edit semantics; enablement, undo, redo stay entry 6
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- growth-budget caution (adversarial) — guidance, not a defect; passed to the fixer as a constraint
