---
id: 11
type: story
title: "History serialise and parse, and the epic's scripted game"
parent: epic-rules-engine
covers: [CAP-9]
after: [10]
risk: medium
---

# History serialise and parse, and the epic's scripted game

## Description

Adds serializeHistory, parseHistory with its stage order, container and checkRecord checks, the history round trip built from gameRecord outputs, one history-invalid-<check>.json per record check, and the SPEC Success signal test: a scripted seed-1 game round-tripped to an equal view after every step, undo to the start and redo to the end; won records use winSeed (src/engine/win-seed.ts, build-notes CAP-5).

- Scope: the history half of CAP-9 plus only the scripted-game part of the SPEC Success signal; the rule-coverage audit and the R-02 golden-literal check are epic Done-when items.
- Engine surface: src/engine/serialize.ts holds both functions and the type ParseHistoryResult; index.ts exports serializeHistory and parseHistory, and ParseHistoryResult type-only next to ParseSessionResult (AD-2). history.ts has no container type; if one is needed, add it (e.g. `ScoreHistory = { readonly version: number; readonly records: readonly GameRecord[] }`) and export it type-only too. HISTORY_VERSION (1, history.ts) is reused unchanged.
- serializeHistory(scoreHistory: { version; records: readonly GameRecord[] }): string writes compact JSON with version first (copied as is, like serializeSession), each record's keys in AD-6 order, longestWord omitted when absent; no validation (JSDoc precondition; AD-2, CLAUDE.md rule 6). serialize.ts and its tests declare no binding named history, write the result key explicitly (`history: value`, never shorthand or destructured) and never follow `.history` with a History API member such as `.length` (use e.g. `result.history.records`) (AD-1 scan, AGENTS.md Known pitfalls).
- parseHistory(text): ParseHistoryResult = { ok: true; history: { version; records } } | { ok: false; reason: 'version-unreadable' } | { ok: false; reason: 'version-unknown' | 'contents-unreadable'; version: number } (AD-7, build-notes CAP-9). Stage order mirrors parseSession: a JSON.parse failure, a non-object root or a version that is not a non-negative safe integer → version-unreadable; version ≠ HISTORY_VERSION → version-unknown { version }; then the container check; then each record in order → contents-unreadable { version }.
- Checks live in internal checkContainer(value) and checkRecord(record, version) in serialize.ts (not exported from index.ts, SPEC Constraints), each failure throwing EngineError with its own code, prefixed history. like the schema. codes (e.g. history.record-version), added to the src/engine/errors.ts doc-comment list. parseHistory catches only EngineError (→ contents-unreadable { version }); anything else propagates (CLAUDE.md rule 6, AD-15).
  - checkContainer: field set exactly { version, records } (container-field-set), then records an array (records-not-array).
  - checkRecord, first violation wins: a plain object (record-not-object) → exact AD-6 field set, a missing or extra field one code (record-field-set) → version equals the container's (record-version) → seed a uint32 (seed-uint32) → outcome ∈ { won, gaveUp } (outcome) → finalScore a safe integer (final-score) → activeMs a safe integer ≥ 0 (active-ms) → longestWord, when present, a plain object with exactly { spelling, letterCount }, null included (longest-word-not-object) → spelling a non-empty ^[a-z]+$ string (longest-word-spelling) → letterCount a positive safe integer (longest-word-letter-count). letterCount is not cross-checked against the spelling (parseHistory has no lang).
- Valid fixture: fixtures/history-three-records.json holds the round-trip history below, written once from serializeHistory output by a throwaway generator (as ticket 2.10 did; only the JSON is committed). It is in the round trip and is the base of every rejecting history fixture.
- Rejecting fixtures, each the fewest field changes from history-three-records.json that make its named check the first violation (SPEC CAP-9; hand-reviewed): history-invalid-null.json and history-invalid-array.json (version-unreadable only); history-invalid-container-field-set.json and history-invalid-records-not-array.json; one history-invalid-<code without history.>.json per checkRecord code, with the build-notes names history-invalid-record-not-object, -record-version and -longest-word-not-object (longestWord set to null, AD-7, build-notes; the extra-key variant is an inline checkRecord case); for longest-word-spelling, history-invalid-longest-word-spelling-empty.json and history-invalid-longest-word-spelling-case.json replace the single per-code file, both asserting that code.
- Round trip (SPEC CAP-9): for h = { version: HISTORY_VERSION, records: [] } and for the records built by reconcileHistory from gameRecord outputs in this order: a won game with a word (after = winSeed(1), before = it one undo earlier, as history.test.ts does); a gaveUp game after at least one committed word, with a negative finalScore; a gaveUp on a fresh createSession (no longestWord).
- Accepting boundaries: inline accepting cases derived from the valid fixture cover seed 0 and 4294967295, activeMs 0, a negative finalScore and a spelling containing qu (e.g. { spelling: 'quiz', letterCount: 4 }, QU counting 2 per spec §1).
- Scripted game (SPEC Success signal), through index.ts: seed 1, an inline Set holding the word, commands drop, at least one compose command (e.g. flip), validate, a Place command (setTarget, which needs a word of 4 or more letters (R-40), or setPlacementOrder with a non-identity permutation of the word's card ids) whose returned Session is not the input reference, confirm; then undo until view.canUndo is false, then redo until view.canRedo is false. Step 0 is the createSession(1) state. The word comes from the seed-1 deal, e.g. the ticket 2.10 plan's tan sequence (drop { sourceColumn 3, sourceCount 2, destinationColumn 6 }, flip, validate, setPlacementOrder { order: [28, 0, 42] } (a permutation of T42, A0, N28), confirm); the exact word is the plan's.

## Acceptance Criteria

Verify: npm run test:all is green, with these tests (round trip, fixtures, inline and scripted-game tests in src/engine/serialize.test.ts importing through index.ts; internal checks imported from serialize.ts for the direct assertion):

- Result type: ParseHistoryResult is as above, enforced by npm run check, not a runtime test.
- Round trip: for both histories h, parseHistory(serializeHistory(h)) is ok with result.history toStrictEqual h, serializeHistory(result.history) is byte-equal to serializeHistory(h), and each record's Object.keys are in AD-6 order; the reconciled records are, in order, won with a longestWord, gaveUp with finalScore < 0 and a longestWord, gaveUp without a longestWord key; history-three-records.json round-trips the same way and equals the reconciled history.
- Rejecting fixtures: every history fixture asserts its parseHistory reason (with the fixture's version where AD-7 carries one); container and record fixtures also assert the unique code from the direct run: checkContainer, then checkRecord over the fixture's records in order with the container version, asserting the first thrown code; a test asserts the codes are distinct and cover every history.* code.
- Inline §2 cases (mirroring the Session ones in serialize.test.ts, not fixtures): empty and unparseable text, roots 42, "x" and true, and versions missing, "1", -1, 1.5, 2**53 and null → version-unreadable; versions 0, 2 and Number.MAX_SAFE_INTEGER → { ok: false, reason: 'version-unknown', version } with the payload asserted.
- Scripted game: at every step s, parseSession(serializeSession(s), EN) is ok, the parsed Session toStrictEqual s, and view(parsed, EN) toStrictEqual view(s, EN); after the undos the cursor is { index: 0, phase: 'idle' }, view.canUndo is false, view.canRedo is true, and view.columns and view.cells toStrictEqual those of view(createSession(1), EN); the view after the last redo equals the view before the first undo.
- Propagation: a parseHistory case in src/engine/serialize.propagation.test.ts: a non-EngineError thrown inside the container or record stage is rethrown: vi.spyOn(JSON, 'parse') returns { version: 1, get records() { throw new TypeError('x') } }, and parseHistory rethrows that TypeError (AD-15).
- Exports: the existing test in src/engine/index.test.ts gains serializeHistory and parseHistory in its sorted list and its name (AD-2).
- Version: it('AD-7 HISTORY_VERSION is 1') asserts the SPEC CAP-9 value.
- Test names: parse, fixture, round-trip, inline and scripted-game tests "§2 …", the propagation case "AD-15 …", the export test "AD-2 …"; never R-73 (UI, P3).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-9 and Success signal
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-9 (history bullets) and CAP-5 (won helper)
- spine — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-2, AD-6, AD-7, AD-15, AD-17
- hand-offs — _bmad-output/initiative-wordcell-v1/epic-rules-engine/story-session-serialise-and-parse-with-fixtures-plan.md

## Notes

- Open question: None.
