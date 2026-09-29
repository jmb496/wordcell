# Review log — story-session-serialise-and-parse-with-fixtures.md (ticket 2.10)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 7a2eea3, copy `story-session-serialise-and-parse-with-fixtures.review-log.passes/pass0.md`, 186 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-composing-commands-and-the-command-table-plan.md story-gameview-plan.md story-golden-deal-test-and-r-id-test-names-plan.md story-langdata-en-and-lettercount-plan.md story-score-history-semantics-plan.md story-scoring-penalty-and-bands-plan.md story-session-createsession-replay-and-checksession-plan.md story-undo-redo-give-up-and-accrue-plan.md story-validate-and-place-commands-with-the-8-worked-example-plan.md 

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 6, decision-needed 0  |  Dropped in triage: 3 (duplicates merged across lenses)
Words (docs): 738 (4.0x pass 0; stated budget 1500)  |  Snapshot: story-session-serialise-and-parse-with-fixtures.review-log.passes/pass1.md
Fixer: all 17 items applied; no runnable commands added; the tsc JSON-import claim in Notes is marked unverified (reviewers verified it on TS 6.0.3 in scratch projects; arch-test permission read at src/architecture.test.ts:251).
### Applied
- [major] AC — replay-failed limited to schema, AD-7 and replay-check fixtures; null/[] fixtures give version-unreadable only → fixer item 1
- [major] Description — scope: Session half only; history half, history-* fixtures, parseHistory inline cases, Success-signal game are entry 11 → fixer item 2
- [major] Description — engine surface: serialize.ts, index.ts exports, index.test.ts exact AD-2 list → fixer item 3
- [major] Description — SESSION_VERSION already exists (entry 3 hand-off): reused, not added → fixer item 4
- [major] Description / AC — nine SPEC CAP-9 round-trip fixtures named and their production stated → fixer item 5
- [major] AC — defining property asserted per valid fixture (epic 3 restore fixtures) → fixer item 6
- [major] AC — AD-7 format (version first, §2 key order, optional fields absent) tested via exact text → fixer item 7
- [major] AC — version-stage inline cases listed (unreadable vs unknown boundary, payload) → fixer item 8
- [major] Description — schema code scheme, one fixture per code, distinct-code test → fixer item 9
- [major] Description — inherited hand-offs (two R-33 fixtures, extra-key fixtures, fractional cursor.index, negative counts at schema domain, EngineError-only catch) → fixer item 10
- [major] AC — apply/view throw the same code as the direct stage for every AD-7 and replay fixture → fixer item 11
- [minor] items 12–17 (direct stage named; Notes open question answered; review-log citation named; winSeed named; §2/AD-2 test names; non-EngineError propagation test)
### Default applied (technical)
- schema.* code scheme: one code per check category per object kind/field
- equivalence check command: apply(s, { type: 'undo' }, { lang: EN }) (undo replays first)
- fixture file names by phase; test file src/engine/serialize.test.ts
- exact-text round trip: serializeSession(parsed) === JSON.stringify(fixture)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: assert each rejecting fixture differs minimally from its base (stretch; SPEC's "fewest field changes" is a construction rule, not gated)
- adversarial: -0 seed/activeMs round trip (engine-produced fixtures never carry -0)
- duplicates across lenses merged
