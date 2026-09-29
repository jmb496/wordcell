---
id: 10
type: story
title: "Session serialise and parse with fixtures"
parent: epic-rules-engine
covers: [CAP-9]
after: [9]
risk: medium
---

# Session serialise and parse with fixtures

## Description

Adds serializeSession and parseSession (JSON parse, version checks, the §2 schema stage, then replay with checkSession), the valid round-trip fixtures in root fixtures/ generated once through public apply, and one rejecting session-invalid-<check>.json per schema code, AD-7 check and violable replay check.

- Scope: the Session half of CAP-9 only. serializeHistory, parseHistory, checkRecord, every history-* fixture (history-invalid-null/-array included), the parseHistory inline cases and the SPEC Success-signal scripted seed-1 game are entry 11's.
- Engine surface: src/engine/serialize.ts holds serializeSession and parseSession (spine Capability Map); src/engine/index.ts exports both (plus the parse result type if one is added) per AD-2, and the exact AD-2 runtime export list in src/engine/index.test.ts and its test name are extended. Round-trip and parse tests import through index.ts; internal stage functions may be imported from their modules for the direct-stage assertion.
- The existing SESSION_VERSION (1, src/engine/session.ts, entry 3) is reused unchanged; no new constant.
- Round-trip fixtures (the nine SPEC CAP-9 states), in root fixtures/, named by phase, each produced once through public createSession/apply/accrue, seed 1 where possible:
  - session-idle-fresh.json, session-composing.json, session-composing-draft-2-letters.json (R-36 unchecked below Place), session-place.json, session-idle-pending-draft.json;
  - session-place-free-letter-redo-tail.json (redo tail, a used free letter, non-default placementOrder), session-below-committed-last.json;
  - session-won.json (from winSeed in src/engine/win-seed.ts), session-gave-up.json.
- Each valid fixture is written in §2 key order with version first and optional fields absent (AD-7).
- Schema stage codes (default applied): one schema.* code per check category per object kind or field (e.g. schema.required-<kind>, schema.object-<kind>, schema.type-<field>, schema.enum-<field>, schema.domain-<column|cell|card|count>), one fixture per code, covering at least the build-notes CAP-9 minimum list; <check> in the file name equals the code slug where practical.
- Inherited hand-offs:
  - two R-33 fixtures, session-invalid-r33-free-letter-empty.json and session-invalid-r33-free-letter-duplicate.json (one fixture per check code);
  - extra-key fixtures in a Move and in cursor (build-notes CAP-3; ad7-unknown-move-field, ad7-unknown-cursor-field);
  - a non-integer cursor.index (0.5) is the schema stage's (entry 3 and 6 plans);
  - negative sourceCount/destinationCount are rejected at the schema domain (a schema.* code), while sourceCount 0 stays the R-10/R-13 replay fixture (r13-source-count, entry 4 plan);
  - only EngineError is caught; anything else propagates (CLAUDE.md rule 6).
- session-invalid-null.json and session-invalid-array.json give version-unreadable only (SPEC.review-log.md "Unapplied minors" item 1).

## Acceptance Criteria

Verify: npm run test:all is green, with these tests in src/engine/serialize.test.ts:

- Round trip: for each of the nine valid fixtures, parseSession(JSON.stringify(fixture), EN) is ok and toStrictEqual the fixture, serializeSession(parsed) === JSON.stringify(fixture), and Object.keys of the output starts with 'version'; a Composing-reached move has no targetCell or placementOrder key (Object.hasOwn false).
- Defining property: one assertion per valid fixture via cursor/moves and view(parsed, EN) (e.g. redo tail: moves beyond cursor.index, a used free letter, non-default placementOrder; won: status won; gave-up: gaveUp true; 2-letter draft: Composing-reached).
- Rejecting fixtures: one table maps fixture file → stage (schema or replay) → expected code; a test asserts the codes are distinct. For every schema, AD-7 and replay-check fixture, parseSession returns { ok: false, reason: 'replay-failed', version } with the fixture's version, and the stage run directly throws EngineError with the expected code: the internal schema-stage function in serialize.ts (e.g. checkSchema(value)) for schema.* fixtures, the internal replay(session, EN) for AD-7 and per-move fixtures.
- apply/view equivalence: for every AD-7 and replay-check fixture (not schema ones), view(s, EN) and apply(s, { type: 'undo' }, { lang: EN }) (which replays before the command) throw EngineError with the same code the direct stage gives.
- Version stage (inline §2 cases): an object with no version, version "1", -1, 1.5 and null, unparseable text, primitive roots (42, "x", true), and the null/[] fixtures → version-unreadable; version 0 and 2 → { ok: false, reason: 'version-unknown', version } with the payload asserted.
- A non-EngineError thrown inside a stage propagates from parseSession (CLAUDE.md rule 6); the builder chooses the mechanism (crafted input or stub) in the plan.
- Test names: every round-trip, version and rejection test is named "§2 …" (rule-coverage §2 rows 24 and 28: replay-check rejection tests are §2 on purpose), the export test "AD-2 …"; never R-73.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-9 Serialise and parse

## Notes

- JSON imports: src/architecture.test.ts already permits fixtures/<name>.json with `with { type: 'json' }` in engine tests, so no config change is expected; if npm run check or biome objects, fix the config within this ticket (Scaffold deltas).
