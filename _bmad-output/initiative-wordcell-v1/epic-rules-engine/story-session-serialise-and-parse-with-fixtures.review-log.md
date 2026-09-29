# Review log — story-session-serialise-and-parse-with-fixtures.md (ticket 2.10)
State: pass 3: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 7a2eea3, copy `story-session-serialise-and-parse-with-fixtures.review-log.passes/pass0.md`, 186 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-composing-commands-and-the-command-table-plan.md story-gameview-plan.md story-golden-deal-test-and-r-id-test-names-plan.md story-langdata-en-and-lettercount-plan.md story-score-history-semantics-plan.md story-scoring-penalty-and-bands-plan.md story-session-createsession-replay-and-checksession-plan.md story-undo-redo-give-up-and-accrue-plan.md story-validate-and-place-commands-with-the-8-worked-example-plan.md 

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 6, decision-needed 0  |  Dropped in triage: 3 (duplicates merged across lenses)
Words (docs): 738 (4.0x pass 0; stated budget 1500)  |  Snapshot: story-session-serialise-and-parse-with-fixtures.review-log.passes/pass1.md
Fixer: all 17 items applied; no runnable commands added; the tsc JSON-import claim in Notes was not run by the fixer but was verified by pass 1 and pass 2 reviewers on TS 6.0.3 (tsc with @tsconfig/svelte, rc 0); arch-test permission at src/architecture.test.ts:251.
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

## Pass 2 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 8, decision-needed 0  |  Dropped in triage: 2 (fixture staleness/regeneration guard: over-specification for a plan; tsc log wording: corrected in the log directly)
Words (docs): 1082 (5.8x pass 0; stated budget 1500)  |  Snapshot: story-session-serialise-and-parse-with-fixtures.review-log.passes/pass2.md
Fixer: all 16 items applied; tool claims run: Vitest 5.0.2 ships vi.mock; Node 24 Number.isSafeInteger(2**53) false, JSON.parse keeps 9007199254740992.
### Applied
- [major] AC — §2 key order proven on reversed-insertion input; Object.keys on parsed output, cursor and Moves → fixer item 1
- [major] Description — session-below-committed-last is the Q-41 undone-draft-in-redo-tail case, with its defining facts → fixer item 2
- [major] Description / AC — 2-letter draft fixture uses two non-QU cards, letter count 2 → fixer item 3
- [major] AC — table replay-stage codes equal the errors.ts violable code set; schema codes include the build-notes minimum → fixer item 4
- [major] Description / AC — no check in both stages: schema stage types only fields AD-7 leaves untyped; schema stage does not throw on AD-7/replay fixtures → fixer item 5
- [major] Description / AC — fewest field changes from a valid base; table gains base-fixture column → fixer item 6
- [major] AC — propagation via vi.mock stub in a separate file, "AD-15 …" → fixer item 7
- [major] AC — version 2**53 → version-unreadable → fixer item 8
- [minor] items 9–16 (build-notes fixture names win; catch wording; result type named; defining property per fixture; test names for all tests; errors.ts code list; non-zero activeMs in gave-up fixture; table excludes null/[])
### Default applied (technical)
- parse result type { ok: true; session } | { ok: false; reason: 'version-unreadable' } | { ok: false; reason: 'version-unknown' | 'replay-failed'; version }
- propagation test file src/engine/serialize.propagation.test.ts with vi.mock of replay
- schema.* codes appended to the errors.ts doc-comment list
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- fixture staleness/regeneration guard (over-specification; plan-level)
- log wording on the tsc claim (corrected in the pass 1 log line)

## Pass 3 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; fixture-provenance rebuild test reclassified minor: build-notes CAP-9 prescribes a throwaway generator)
Words (docs): 1229 (6.6x pass 0; stated budget 1500)  |  Snapshot: story-session-serialise-and-parse-with-fixtures.review-log.passes/pass3.md
Fixer: all 13 items applied; 23 replay-stage codes counted in errors.ts (13 + 9 + 1); partial vi.mock with importOriginal marked unverified (not run against Vitest 5).
### Applied
- [major] AC — replay-stage code set compared against a literal list in serialize.test.ts citing errors.ts (engine tests cannot read the doc comment); every listed code violable after the schema stage → fixer item 1
- [major] Description — schema code granularity: required/object per object kind, type/enum per field (kebab-case), domain per domain; file slug rule → fixer item 2
- [minor] items 3–13 (throwaway generator writes via serializeSession; Object.hasOwn presence; redo-tail vs below-committed distinguishing asserts; composing phases and letter counts; ParseSessionResult; partial mock; serializeSession precondition; accrue before giveUp; fewest-change rule hand-reviewed; deep-freeze inputs)
### Default applied (technical)
- literal expected code list in serialize.test.ts (no new runtime export in errors.ts)
- ParseSessionResult type name; partial vi.mock of './replay'
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (fixture-provenance rebuild test reclassified minor and answered by the build-notes throwaway generator)
