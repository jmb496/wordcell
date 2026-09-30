---
title: 'History serialise and parse, and the epic''s scripted game'
type: 'feature'
ticket: '11'
created: '2026-09-29'
status: done
baseline_revision: '23f2111b23781c096c9edc4858f3cacc96c3af1d'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-history-serialise-and-parse-and-the-epic-s-scripted-game.md'
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 3 must store and restore the score history (`wordcell:history`), and nothing turns a history into text and back with the AD-7 reasons. The SPEC Success signal (a scripted seed-1 game that round-trips to an equal view after every step) has no test yet.

**Approach:** Add `serializeHistory`/`parseHistory` (with internal `checkContainer`/`checkRecord`) to `src/engine/serialize.ts` and export them per AD-2. Add the `ScoreHistory` type to history.ts. Commit one valid fixture (from a throwaway generator) and hand-derived rejecting fixtures. Write the tests the ticket's Acceptance Criteria name. The ticket file (context) is the authority, with its Description and ACs applied verbatim. This plan settles the review-log minors (Design Notes).

## Boundaries & Constraints

**Always:**
- `serializeHistory` writes `{ version, records }` compactly. Each record's keys go in AD-6 order (version, seed, outcome, finalScore, longestWord?, activeMs), and `longestWord` is written as `{ spelling, letterCount }` in that key order, or omitted when absent (`Object.hasOwn`). No validation (JSDoc precondition).
- `parseHistory` stages: JSON.parse (only a SyntaxError becomes version-unreadable; anything else is rethrown) → root is a plain object with an own safe-integer `version` ≥ 0, else version-unreadable → `version !== HISTORY_VERSION` gives version-unknown `{ version }` → **one** try wrapping `checkContainer(value)` and then `checkRecord(r, version)` for each record in order. Only an `EngineError` is caught, giving contents-unreadable `{ version }`.
- Codes (12, each prefixed `history.`): `container-field-set`, `records-not-array`, `record-not-object`, `record-field-set`, `record-version`, `seed-uint32`, `outcome`, `final-score`, `active-ms`, `longest-word-not-object`, `longest-word-spelling`, `longest-word-letter-count`. The checks run in exactly the ticket's order, and the first violation wins. `longest-word-not-object` covers null, an array, a non-object and any object whose key set is not exactly `{spelling, letterCount}`. List them in the errors.ts doc comment with that note.
- serialize.ts and the tests: no binding named `history`; write result keys explicitly (`history: value`); never `.history.length` or another History API member (use `result.history.records`).
- Every parse result is asserted with `toStrictEqual`, and every input to serialize/reconcile is deep-frozen (copy `deepFreeze` locally).
- Helpers are copied from history.test.ts into serialize.test.ts; never import a `*.test.ts`. "The tan sequence" means the full tanDone sequence through confirm (a giveUp needs Idle).

**Never:** changing HISTORY_VERSION, gameRecord or reconcileHistory behaviour; exporting checkContainer/checkRecord from index.ts; cross-checking letterCount against the spelling; committing the generator; R-73 test names; touching the session fixtures or parseSession behaviour.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid | empty history, reconciled 3-record history, history-three-records.json | `{ ok: true, history: h }`; re-serialise byte-equal | none |
| Unreadable | '', bad JSON, 42, "x", true, null, [], version missing/"1"/−1/1.5/2**53/null | `{ ok: false, reason: 'version-unreadable' }` | specified outcome |
| Unknown | version 0, 2, MAX_SAFE_INTEGER | `{ ok: false, reason: 'version-unknown', version }` | specified outcome |
| Contents | each container/record fixture | `{ ok: false, reason: 'contents-unreadable', version }` (container version) | EngineError caught |
| Non-engine throw | JSON.parse spied to return a root whose `records` getter throws a TypeError | TypeError propagates | not caught |

</intent-contract>

## Code Map

- `src/engine/serialize.ts` -- has `serializeSession`, `parseSession`, `checkSchema`, and a local `isPlainObject` to reuse. Add `ParseHistoryResult`, `serializeHistory`, `parseHistory`, and internal exported `checkContainer(value: object)` and `checkRecord(record: unknown, version: number)`, following the style of `fail()` but with the `history.` prefix. Import `HISTORY_VERSION` and `type ScoreHistory, type GameRecord` from `./history`.
- `src/engine/history.ts` -- add `export type ScoreHistory = { readonly version: number; readonly records: readonly GameRecord[] }` next to `GameRecord`. Do not change anything else.
- `src/engine/index.ts` -- add `serializeHistory` and `parseHistory` to the `./serialize` export, `ParseHistoryResult` beside `ParseSessionResult`, and `ScoreHistory` to the history type export.
- `src/engine/index.test.ts` -- add both names to the sorted list and to the test name.
- `src/engine/errors.ts` -- add the history bullet after the schema bullet.
- `src/engine/history.test.ts` -- add `it('AD-7 HISTORY_VERSION is 1')`. Its helpers (`deepFreeze`, `play`, `recordOf`, `reconcile`, `drop`, `WON1`/`WON1_BEFORE` via `winSeed(1)` then undo) are the patterns to copy.
- `src/engine/serialize.test.ts` -- existing patterns to mirror: `expectEngineError`, the `ParseSessionResult` expectTypeOf test, the reversed-keys test, `SCHEMA_CODES` with its length and set test, and the version-stage `it.each`. Append new `describe` blocks. Imports go through `./index`, except `checkContainer`/`checkRecord` from `./serialize` and `winSeed` from `./win-seed`.
- `src/engine/serialize.propagation.test.ts` -- currently `vi.mock('./replay')`. Add a parseHistory case using `vi.spyOn(JSON, 'parse').mockReturnValueOnce(...)`, with `mockRestore()` in a `finally` or `afterEach`.
- `src/engine/win-seed.ts` -- `winSeed(seed)`, the helper for won Sessions.
- Seed-1 facts (verified with a tsx probe): tan = drop {3, 2, 6}, flip, validate, setPlacementOrder {order: [28, 0, 42]}, confirm, with dictionary {tan}. Each returns a new reference. The cursor goes to {1, idle}; undo moves it to {0, place}, then {0, composing}, then {0, idle} (3 undos). The gaveUp after tan scores −491 with longestWord {tan, 3}, activeMs 0. accrue(createSession(1), 1000, EN) then giveUp scores −530 with no longestWord, activeMs 1000.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/history.ts` -- add the `ScoreHistory` type.
- [x] `src/engine/serialize.ts` -- add the result type, the two functions and the two internal checks, with JSDoc citing AD-6/AD-7/§2/CAP-9.
- [x] `src/engine/errors.ts`, `src/engine/index.ts`, `src/engine/index.test.ts` -- codes doc, AD-2 exports, export test.
- [x] `/tmp` generator (uncommitted, `npx -y tsx@4.23.15`) -- write `fixtures/history-three-records.json` from `serializeHistory` of the three reconciled records (won via winSeed(1); gaveUp after tan; accrue 1000 then giveUp).
- [x] `fixtures/history-invalid-*.json` (15 files) -- `null`, `array`, `container-field-set` (extra key), `records-not-array`, `record-not-object`, `record-field-set` (activeMs dropped), `record-version`, `seed-uint32`, `outcome`, `final-score`, `active-ms`, `longest-word-not-object` (null), `longest-word-spelling-empty`, `longest-word-spelling-case`, `longest-word-letter-count`. Container and record fixtures are the fewest changes from history-three-records.json.
- [x] `src/engine/serialize.test.ts` -- all ticket AC tests ("§2 …"), a fixture table of `{ file, value, reason, code? }`, HISTORY_CODES, inline boundaries, and the scripted game.
- [x] `src/engine/serialize.propagation.test.ts` -- the "AD-15 …" parseHistory case.
- [x] `src/engine/history.test.ts` -- the AD-7 version test.

**Acceptance Criteria (ticket ACs apply verbatim, plus):**
- Given each fixture row, when its checks run directly (checkContainer, then checkRecord over its records with the container version), then the first thrown code equals the row's own code, and the codes are unique except for the two spelling fixtures.
- Given inline rejecting partners (seed −1 and 4294967296, activeMs −1, finalScore 1.5, letterCount 0; the record field-set extra key; longestWord extra key and missing key; a container with `records` dropped), when checkRecord or checkContainer runs, then each throws its code.
- Given inline accepting cases (seed 0 and 4294967295, a negative finalScore, longestWord {quiz, 4}), when parsed, then each is ok and `toStrictEqual` its input.
- Given `npm run test:all`, then it is green.

## Implementation Notes

- Generator (uncommitted, `/tmp`, `npx -y tsx@4.23.15`): reconciled, in order, `winSeed(1)` against it one undo earlier; the tan sequence (dictionary {tan}) then giveUp; `accrue(createSession(1), 1000, EN)` then giveUp; wrote `serializeHistory({ version: HISTORY_VERSION, records })` to `fixtures/history-three-records.json` (records: won 355 {lquejata, 8} 0; gaveUp −491 {tan, 3} 0; gaveUp −530 no word 1000).
- Rejecting fixtures change record 0 (the won record) or the container by one field: extra container key `extra: 0`; `records: null`; record 0 → `null`; activeMs dropped; version 2; seed −1; outcome `lost`; finalScore 355.5; activeMs −1; longestWord `null`; spelling `""`; spelling `LQUEJATA`; letterCount 0.
- `npm run test:all` green (1272 unit tests; dist-smoke, e2e and pwa suites pass).

## Plan Change Log

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 20 findings — high 0, medium 3, low 11, false 6, maybe-false 0
- findings:
  - `[low]` `[reject]` blind-hunter: the propagation case exercises only the container stage while its name says "container or record stage". The ticket AC uses that wording, and review-log minor 7 settled that the case exercises the container stage and that one try wraps both stages.
  - `[low]` `[reject]` blind-hunter: `orderedRecord` throws on an own `longestWord: undefined`. `gameRecord` never produces that, and the JSDoc precondition says input is engine-produced; the plan's Always prescribes `Object.hasOwn`.
  - `[low]` `[reject]` blind-hunter: parseHistory's version stage duplicates parseSession's. The ticket prescribes that it mirror parseSession; extracting a shared helper is a refactor for epic entry 12, not a defect.
  - `[low]` `[reject]` blind-hunter: `OUTCOMES`/`RECORD_REQUIRED` are not tied to `GameRecord` by type. A new outcome is a record-shape change (Q-43) that bumps HISTORY_VERSION and touches these checks anyway; unlikely drift.
  - `[medium]` `[patch]` blind-hunter: the type and integer halves of the checkRecord guards are untested. Grouped with the verification-gap integer-type finding; patched as below.
  - `[false]` `[reject]` blind-hunter: the round trip never pins bytes or container/longestWord key order. `JSON.stringify(historyThreeRecords)` is asserted byte-equal to `serializeHistory(RECONCILED)`, and that fixture has version first and `{spelling, letterCount}` order; the reversed-keys test pins order against any insertion order.
  - `[low]` `[reject]` blind-hunter: module-level setup makes a failure fail the whole file. This is the same pattern as history.test.ts and view.test.ts; the collection error still names the throw.
  - `[low]` `[reject]` blind-hunter: `-0` is accepted and written as `0`. Engine-written text never contains `-0` (JSON.stringify writes 0); parseSession behaves the same.
  - `[low]` `[reject]` blind-hunter: history error messages omit the record index. Messages are swallowed into contents-unreadable and the code identifies the check; cosmetic.
  - `[low]` `[reject]` edge-case-hunter: `longestWord: undefined` crash in `orderedRecord`. Same as the blind-hunter row (precondition).
  - `[false]` `[reject]` edge-case-hunter: letterCount is not cross-checked against spelling. The ticket excludes this explicitly (parseHistory has no lang).
  - `[low]` `[reject]` edge-case-hunter: there is no outcome/finalScore cross-field check. No spec rule defines one; AD-7 names only structural checks.
  - `[medium]` `[patch]` verification-gap: no rejecting case puts the bad record after record 0. Added the inline test "§2 parseHistory checks every record: a bad record 1 after a valid record 0 is rejected", asserting contents-unreadable and `history.seed-uint32`.
  - `[medium]` `[patch]` verification-gap: the integer/type halves of the seed, activeMs and letterCount checks are untested. Added checkRecord rows for seed 1.5 and "1", activeMs 1.5, finalScore "355", letterCount 1.5, spelling 5, outcome 5 and record version "1", each asserting its code and contents-unreadable.
  - `[false]` `[reject]` intent-alignment: the AD-2 export test is a literal list, not tied to the spine. The ticket AC prescribes extending the existing sorted literal list; it equals AD-2's list plus deal.
  - `[false]` `[reject]` intent-alignment: the scripted game plays on the original Session, not the parsed one. The SPEC Success signal and the ticket AC ask for a round trip giving an equal Session and view at every step; the parsed Session is asserted toStrictEqual, so it is interchangeable.
  - `[false]` `[reject]` intent-alignment: key order is checked on the serialised bytes, not on result records. The AC's "Object.keys in AD-6 order" is met on the text; result records are the JSON.parse of that text.
  - `[false]` `[reject]` intent-alignment: fixtures are re-stringified, not read as file bytes. This mirrors the ticket 2.10 pattern and build-notes CAP-9 ("imported … and re-stringified for the parser").
  - `[low]` `[reject]` intent-alignment: the propagation case covers only the container stage. Same as the blind-hunter row (review-log minor 7).
  - `[low]` `[reject]` intent-alignment: an own-undefined `longestWord` is unhandled in serializeHistory. Same as the blind-hunter row (precondition).

## Design Notes

Review-log unapplied minors, resolved: (1) helpers copied, never imported (Always). (2) the tan sequence means tanDone through confirm (Always). (3) longestWord is written as `{spelling, letterCount}`, and the reversed-keys inline case also reverses longestWord's keys (Always, Tasks). (4) inline rejecting partners (AC). (5) the fixture already holds a negative finalScore; quiz is an extra QU case, not a regex boundary; each accepting case asserts ok and toStrictEqual (AC). (6) "the fixture's version" is the container version (Matrix). (7) the propagation case exercises only the container stage, and one try wraps both stages (Always). (8) container and record fixtures derive from the valid fixture; null and array do not (Tasks). (9) rows are keyed by fixture and code (AC). (10) the errors.ts note on longest-word-not-object (Always). (11) a test comment says that equality with live reconcileHistory output is intended drift detection, and that a scoring change regenerates the fixture. (12) container-field-set adds an extra key, and an inline checkContainer case drops `records` (Tasks, AC). No open major.

## Verification

**Commands:**
- `npx vitest run src/engine` -- expected: all engine tests pass.
- `npm run test:all` -- expected: green.

## Auto Run Result

- **Summary:** Added to `src/engine/serialize.ts`:
  - `serializeHistory`: compact `{ version, records }`, keys in AD-6 order, `longestWord` omitted when absent, no validation.
  - `parseHistory`: JSON parse → version stage → `checkContainer` → `checkRecord` over each record, all inside one try; an `EngineError` becomes contents-unreadable and anything else propagates.
  - The 12 `history.*` codes and the type `ParseHistoryResult`.

  Also: `ScoreHistory` in history.ts, the AD-2 exports, one valid three-record fixture and 15 rejecting fixtures, and the tests the ticket names, including the scripted seed-1 game (5 commands, 3 undos, 3 redos, a Session round trip and equal view at every step). Review-log minors 1–12 are resolved in the plan (Design Notes); there was no open major.
- **Files:**
  - `src/engine/serialize.ts`: history serialise/parse and the internal checks.
  - `src/engine/history.ts`: the `ScoreHistory` type.
  - `src/engine/index.ts`, `src/engine/index.test.ts`: AD-2 exports and the export test.
  - `src/engine/errors.ts`: the history codes in the doc comment.
  - `src/engine/serialize.test.ts`: history round trip, fixture table, HISTORY_CODES, inline boundaries, version stage, scripted game.
  - `src/engine/serialize.propagation.test.ts`: the AD-15 parseHistory rethrow case.
  - `src/engine/history.test.ts`: AD-7 HISTORY_VERSION is 1.
  - `fixtures/history-*.json`: 16 files.
- **Review:** 20 findings.
  - Patched 3 rows in 2 entries (medium): a test with a bad record after a valid record 0, and rejecting rows for the integer/type halves of every checkRecord guard.
  - Deferred 0.
  - Rejected 17, each with its reason in the triage log.
- **Follow-up review recommended:** false. First pass; patched high 0, medium 2 entries, but both are test-only additions with no unverified risk that can be named.
- **Verification:** `npx vitest run src/engine`: 871 passed. `npm run test:all`: exit 0 (unit 1281 passed; e2e:dist 13, e2e 34, e2e:pwa 12 passed).
- **Residual risks:**
  - The fewest-changes base of each fixture is hand-reviewed, not asserted.
  - history-three-records.json must be regenerated if scoring changes (a test comment says so).
