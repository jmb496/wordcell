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
- Engine surface: src/engine/serialize.ts holds serializeSession and parseSession (spine Capability Map); src/engine/index.ts exports both plus the type-only ParseSessionResult per AD-2, and the exact AD-2 runtime export list in src/engine/index.test.ts and its test name are extended. Round-trip and parse tests import through index.ts; internal stage functions may be imported from their modules for the direct-stage assertion.
- The existing SESSION_VERSION (1, src/engine/session.ts, entry 3) is reused unchanged; no new constant.
- Round-trip fixtures (the nine SPEC CAP-9 states), in root fixtures/, named by phase, seed 1 where possible, each written once from serializeSession output by a throwaway generator (script or skipped test) driving public createSession/apply/accrue; only the JSON is committed (build-notes CAP-9):
  - session-idle-fresh.json, session-composing.json (draft ≥ 3 letters), session-composing-draft-2-letters.json (R-36 unchecked below Place; two non-QU cards, so 2 letters), session-place.json, session-idle-pending-draft.json;
  - session-place-free-letter-redo-tail.json (redo tail, a used free letter, non-default placementOrder), session-below-committed-last.json (Q-41, AD-7: at least one committed move, then a pending draft, then one more Undo);
  - session-won.json (from winSeed in src/engine/win-seed.ts), session-gave-up.json (accrue, e.g. 1000 ms, before giveUp: accrue returns its input once not playing, commands.ts).
- serializeSession takes engine-produced Sessions only and does not validate (JSDoc precondition; AD-2, CLAUDE.md rule 6); it writes the §2 keys explicitly, version first, optional fields absent (AD-7), whatever the input's key insertion order.
- parseSession: a JSON.parse failure is version-unreadable (AD-15 specified outcome); inside the schema and replay stages only EngineError is caught (→ replay-failed); anything else propagates (CLAUDE.md rule 6).
- Schema stage codes (default applied): the schema stage types only the fields AD-7 leaves untyped (build-notes CAP-9), never seed, activeMs or gaveUp; cursor.index gets only the integer check, its range stays ad7-cursor-index. Presence is Object.hasOwn (cursor: null → schema.object-cursor; missing cursor → schema.required-session). No check runs in both stages; each fixture's first violation is its named check. Codes: schema.required-<kind> and schema.object-<kind> per object kind (session, cursor, move); schema.type-<field> and schema.enum-<field> per field, kebab-cased (e.g. schema.type-source-column); schema.domain-<column|cell|card|count> per domain. One fixture per code, covering at least the build-notes CAP-9 minimum list, named session-invalid-<code without schema.>.json (e.g. session-invalid-type-source-column.json), except the five build-notes names (session-invalid-column-domain, -cell-domain, -cursor-index-type, -move-not-object, -cursor-null).
- The src/engine/errors.ts doc-comment code list gains the schema.* codes, noting their schema. prefix; the existing s2-free-letters-set code is kept.
- Each rejecting fixture makes the fewest field changes from a valid fixture that make its named check the first violation (SPEC CAP-9, build-notes CAP-9); this and each table row's base fixture are reviewed by hand, not asserted.
- Inherited hand-offs:
  - two R-33 fixtures, session-invalid-r33-free-letter-empty.json and session-invalid-r33-free-letter-duplicate.json (one fixture per check code);
  - extra-key fixtures in a Move and in cursor (build-notes CAP-3; ad7-unknown-move-field, ad7-unknown-cursor-field);
  - a non-integer cursor.index (0.5) is the schema stage's (entry 3 and 6 plans);
  - negative sourceCount/destinationCount are rejected at the schema domain (a schema.* code), while sourceCount 0 stays the R-10/R-13 replay fixture (r13-source-count, entry 4 plan).
- session-invalid-null.json and session-invalid-array.json give version-unreadable only (SPEC.review-log.md "Unapplied minors" item 1).

## Acceptance Criteria

Verify: npm run test:all is green, with these tests in src/engine/serialize.test.ts (the propagation test in its own file, below):

- Result type: parseSession returns ParseSessionResult = { ok: true; session } | { ok: false; reason: 'version-unreadable' } | { ok: false; reason: 'version-unknown' | 'replay-failed'; version: number } (AD-7).
- Round trip: for each of the nine valid fixtures, parseSession(JSON.stringify(fixture), EN) is ok with result.session toStrictEqual the fixture, serializeSession(result.session) === JSON.stringify(fixture), and Object.keys(JSON.parse(serializeSession(result.session))), and of its cursor and each Move, equal the §2 order for that object minus absent optional fields; a Composing-reached move has no targetCell or placementOrder key (Object.hasOwn false).
- Key order: a §2 case serializes the redo-tail fixture rebuilt with root, cursor and Move keys in reversed insertion order and asserts the output equals JSON.stringify of the §2-ordered fixture.
- Defining property: one assertion per valid fixture via cursor/moves and view(parsed, EN): idle-fresh: no moves, phase idle; composing: phase composing and a draft of ≥ 3 letters; 2-letter draft: cursor.phase 'composing', reached 'composing' and a letter count of 2 (view draft or the draft cards); place: phase place, no redo tail; idle-pending-draft: phase idle, moves[cursor.index] exists and is not committed; redo tail: cursor.phase 'place', moves beyond cursor.index, moves.at(-1).reached === 'committed' (unlike below-committed-last), and one named move (index fixed by the plan) with non-empty freeLetters and placementOrder ≠ its word order (R-51); below-committed-last: cursor.phase 'place', moves.length === cursor.index + 2 and moves.at(-1).reached !== 'committed'; won: status won; gave-up: gaveUp true and activeMs > 0.
- Rejecting fixtures: one table (excluding the null/[] fixtures, which the version-stage test covers) maps fixture file → base valid fixture → stage (schema or replay) → expected code; a test asserts the codes are distinct, that the table's replay-stage codes equal, as a set, a literal list in serialize.test.ts of all 23 AD-7 pre-replay, per-move and post-replay (ad7-gave-up-won) codes, copied from and citing the src/engine/errors.ts doc comment (each is violable once the schema stage has run; build-notes CAP-9), and that its schema codes include every build-notes CAP-9 minimum case. For every schema, AD-7 and replay-check fixture, parseSession returns { ok: false, reason: 'replay-failed', version } with the fixture's version, and the stage run directly throws EngineError with the expected code: the internal schema-stage function in serialize.ts (e.g. checkSchema(value)) for schema.* fixtures, the internal replay(session, EN) for AD-7 and per-move fixtures; for every AD-7 and replay-check fixture the schema-stage function does not throw.
- apply/view equivalence: for every AD-7 and replay-check fixture (not schema ones), view(s, EN) and apply(s, { type: 'undo' }, { lang: EN }) (which replays before the command) throw EngineError with the same code the direct stage gives.
- Version stage (inline §2 cases): an object with no version, version "1", -1, 1.5, 9007199254740992 (2**53) and null, unparseable text, primitive roots (42, "x", true), and the null/[] fixtures → version-unreadable; version 0 and 2 → { ok: false, reason: 'version-unknown', version } with the payload asserted.
- Propagation: in src/engine/serialize.propagation.test.ts (so the mock does not affect serialize.test.ts), serialize.ts calls replay from './replay'; a partial vi.mock('./replay') with importOriginal overrides only replay to throw a TypeError, and parseSession rethrows it (CLAUDE.md rule 6).
- Frozen inputs: tests deep-freeze the Session passed to serializeSession and the EN passed to parseSession (build-notes CAP-3 convention; AD-2).
- Test names: every serialize.test.ts test (round trip, key order, defining property, rejection, distinct codes, equivalence, version) is named "§2 …" (rule-coverage §2 rows 24 and 28: replay-check rejection tests are §2 on purpose), the propagation test "AD-15 …", the export test "AD-2 …"; never R-73.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-9 Serialise and parse

## Notes

- JSON imports: src/architecture.test.ts already permits fixtures/<name>.json with `with { type: 'json' }` in engine tests, so no config change is expected; if npm run check or biome objects, fix the config within this ticket (Scaffold deltas).
