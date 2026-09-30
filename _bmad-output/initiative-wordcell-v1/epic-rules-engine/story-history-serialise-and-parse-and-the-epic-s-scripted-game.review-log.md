# Review log — story-history-serialise-and-parse-and-the-epic-s-scripted-game.md (ticket 2.11)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 714c76e, copy `story-history-serialise-and-parse-and-the-epic-s-scripted-game.review-log.passes/pass0.md`, 146 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-composing-commands-and-the-command-table-plan.md story-gameview-plan.md story-golden-deal-test-and-r-id-test-names-plan.md story-langdata-en-and-lettercount-plan.md story-score-history-semantics-plan.md story-scoring-penalty-and-bands-plan.md story-session-createsession-replay-and-checksession-plan.md story-session-serialise-and-parse-with-fixtures-plan.md story-undo-redo-give-up-and-accrue-plan.md story-validate-and-place-commands-with-the-8-worked-example-plan.md 

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 6, decision-needed 0  |  Dropped in triage: 23 (duplicates merged across lenses)
Words (docs): 1114 (7.6x pass 0; stated budget 1500)  |  Snapshot: story-history-serialise-and-parse-and-the-epic-s-scripted-game.review-log.passes/pass1.md
Fixer: all 17 items applied; design statements only, no runnable commands; codes use a history.* prefix listed in errors.ts; propagation trigger for parseHistory left to the plan.
### Applied
- [major] Description — serializeHistory signature/format and ParseHistoryResult type, exported type-only → fixer item 1
- [major] Description — parseHistory stage order, container check, checkRecord checks in fixed order with unique codes → fixer item 2
- [major] Description — checkContainer/checkRecord internal, throw EngineError; parseHistory catches only EngineError; AD-15 propagation test → fixer item 3
- [major] Description — full history fixture list (null, array, container, one per record check) and inline version-stage cases incl. version-unknown → fixer item 4
- [major] AC — "reason and checkRecord code" untestable for version-stage/container fixtures; reworded per stage → fixer item 5
- [major] Description — valid history fixture as base for the rejecting ones (AD-17 seeding) → fixer item 6
- [major] Description — round-trip cases: empty history and reconcileHistory won/gaveUp-negative/no-word → fixer item 7
- [major] Description/AC — scripted game steps, stops (canUndo/canRedo, cursor {0, idle}), per-step assertion → fixer item 8
- [major] AC — index.ts exports and extend existing index.test.ts AD-2 list → fixer item 9
- [major] AC — HISTORY_VERSION is 1 (SPEC CAP-9) has no test → fixer item 10
- [major] References — SPEC CAP-9/Success signal, build-notes CAP-9/CAP-5, AD-2/6/7/15/17 → fixer item 11
- [minor] items 12–17 (test id prefixes, winSeed named, Success-signal scope, accepting boundaries, safe integers / no letterCount cross-check, final-view equalities)
### Default applied (technical)
- checkRecord order: plain object → exact field set (missing or extra, one code) → version equals container → seed uint32 → outcome → finalScore safe integer → activeMs safe integer ≥ 0 → longestWord exact {spelling, letterCount} object → spelling ^[a-z]+$ → letterCount positive integer
- checkContainer/checkRecord internal in serialize.ts, EngineError codes, not exported
- valid fixture fixtures/history-three-records.json generated once by a throwaway script
- test ids: §2 parse/round trip/scripted game, AD-15 propagation, AD-2 exports, AD-7 HISTORY_VERSION
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- 23 duplicates of the above across the four lenses
