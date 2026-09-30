---
title: 'Session serialise and parse with fixtures'
type: 'feature'
ticket: '10'
created: '2026-09-29'
status: done
baseline_revision: 'b2f734d9e3cc930a8ce6c1bf7107413499e7cf2d'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-session-serialise-and-parse-with-fixtures.md'
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The engine has no way to turn a Session into stored text and back; epic 3's restore needs `serializeSession`/`parseSession` with the AD-7 result reasons, plus committed fixtures proving every rejection path and the restore boundary states.

**Approach:** Add `src/engine/serialize.ts` (version stage → §2 schema stage → `replay`, which runs `checkSession`, per-move checks and `ad7-gave-up-won`), export it per AD-2, generate the nine valid fixtures once through public `apply`, hand-derive one rejecting fixture per schema code and per violable replay code, and test everything as the ticket's Acceptance Criteria state. The ticket file (context) is the authority; this plan settles its open details and the review-log minors.

## Boundaries & Constraints

**Always:**
- Ticket ACs and Description apply verbatim; `SESSION_VERSION` (session.ts) reused. `serializeSession` copies `session.version` (no substitution), writes §2 key order explicitly (root: version, seed, moves, cursor, gaveUp, activeMs; cursor: index, phase; Move: sourceColumn, sourceCount, destinationColumn, destinationCount, destinationSide, freeLetters, arrangement, reached, targetCell?, placementOrder?), compact, no validation (JSDoc precondition).
- Version stage: root not a non-null, non-array object, or `version` not own / not a non-negative safe integer → `{ ok: false, reason: 'version-unreadable' }` (no `version` key); version ≠ `SESSION_VERSION` → `version-unknown { version }`.
- Schema stage (internal exported `checkSchema(value: unknown): asserts value is Session`-style, throws `EngineError('schema.<code>')`): order session → cursor → each move by index; within an object, each check kind (object → required → type → enum → domain) runs over all its fields in §2 key order before the next kind. Required: session = seed, moves, cursor, gaveUp, activeMs; cursor = index, phase; Move = the eight non-optional fields (targetCell/placementOrder presence stays `ad7-place-fields`). Presence = `Object.hasOwn`. Enum fields (cursor.phase, destinationSide, reached) have no type code: any out-of-enum value, any JSON type, is `schema.enum-<field>`. Types only what AD-7 leaves untyped: never seed, activeMs, gaveUp; `cursor.index` integer only (range stays `ad7-cursor-index`); `targetCell`/`placementOrder` typed and domain-checked only when present.
- Full schema code set (22): `required-session|cursor|move`, `object-cursor|move`, `type-moves`, `type-cursor-index`, `enum-cursor-phase`, `type-source-column`, `type-source-count`, `type-destination-column`, `type-destination-count`, `type-free-letters`, `type-arrangement`, `type-target-cell`, `type-placement-order`, `enum-destination-side`, `enum-reached`, `domain-column|count|cell|card` (all prefixed `schema.`). Listed in the errors.ts doc comment; serialize.test.ts asserts the table's schema codes equal this literal list and its replay codes equal the literal 23-code list (13 pre-replay + 9 per-move + `ad7-gave-up-won`).
- Only `EngineError` caught in schema and replay stages; anything else propagates (rule 6).
- Every parse result asserted with `toStrictEqual`; EN and every Session given to `serializeSession` deep-frozen (local `deepFreeze` copied from commands.test.ts).

**Never:** history serialisation, `history-*` fixtures, the scripted Success-signal game (entry 11); new constants; editing replay/checkSession/checkMove behaviour; renaming `s2-free-letters-set`; committing the generator script; an orphan-fixture guard in architecture.test.ts (review-log minor 9 declined: the ticket prescribes hand review, and entry 11 adds more fixtures — record in Implementation Notes).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid | any of the 9 valid fixtures, stringified | `{ ok: true, session }` strict-equal fixture; re-serialize byte-equal | none |
| Unreadable | bad JSON, 42, "x", true, null, [], no version, "1", −1, 1.5, 2**53, version null | `{ ok: false, reason: 'version-unreadable' }` | specified outcome |
| Unknown | version 0 or 2 | `{ ok: false, reason: 'version-unknown', version }` | specified outcome |
| Schema / AD-7 / replay violation | each `session-invalid-*.json` | `{ ok: false, reason: 'replay-failed', version: 1 }`; direct stage throws its code | EngineError caught |
| Non-engine throw | `replay` mocked to throw TypeError | TypeError propagates | not caught |

</intent-contract>

## Code Map

- `src/engine/session.ts` -- `Session`/`Move`/`Cursor` types, `SESSION_VERSION`, `createSession`. Reuse, do not edit.
- `src/engine/replay.ts` -- `replay(session, lang)` (internal; runs `checkSession` in AD-7 order, per-move `checkMove`, post-replay `ad7-gave-up-won` at line ~181). Reuse, do not edit; serialize.ts imports `replay` from `'./replay'`.
- `src/engine/rules.ts` `checkMove` (line 289) -- per-move check order.
- `src/engine/errors.ts` -- `EngineError(check)`; doc comment gains the schema list.
- `src/engine/win-seed.ts` -- `winSeed(seed)` for the won fixture (drives public apply).
- `src/engine/commands.ts` -- `Command` union, `apply(session, command, { lang, dictionary })`, `accrue(session, ms, lang)`.
- `src/engine/commands.test.ts` lines 21–31 -- `deepFreeze` to copy.
- `src/engine/index.ts`, `src/engine/index.test.ts` -- AD-2 export list and its test name.
- `src/architecture.test.ts` line 251 -- already allows `../../fixtures/<name>.json` with `with { type: 'json' }` in engine tests.
- `tsconfig.app.json` -- type-checks engine tests; has no `resolveJsonModule` (bundler resolution): add `"resolveJsonModule": true` if `npm run check` rejects the imports (Scaffold deltas, ticket Notes). `biome.json` includes `*.json` (root only); confirm `fixtures/` is not reformatted, else leave files compact and adjust nothing but what lint requires.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/serialize.ts` -- `serializeSession`, `parseSession(text, lang): ParseSessionResult`, exported internal `checkSchema`; JSDoc citing AD-7/§2/CAP-9.
- [x] `src/engine/errors.ts` -- add the 22 `schema.*` codes (prefix noted) to the doc comment.
- [x] `src/engine/index.ts`, `src/engine/index.test.ts` -- export `parseSession`, `serializeSession`, type `ParseSessionResult`; extend sorted list and test name.
- [x] `/tmp` generator (uncommitted), run with `npx tsx@4.23.15 <script>` -- writes the nine valid fixtures from `serializeSession` output via public createSession/apply/accrue and winSeed(1). Seed 1 where possible; redo-tail fixture: inline dictionary from the chosen cards' R-37 spellings (any seed if seed 1 is awkward). Record each fixture's seed, dictionary words and command sequence, and the redo-tail draft's placementOrder CardIds, in Implementation Notes.
- [x] `fixtures/session-invalid-*.json` -- 22 schema fixtures (named `session-invalid-<code minus schema.>` except the five build-notes names: `column-domain`, `cell-domain`, `cursor-index-type`, `move-not-object`, `cursor-null`) and 23 replay fixtures `session-invalid-<check>.json` (incl. `r33-free-letter-empty`, `r33-free-letter-duplicate`, `ad7-unknown-move-field`, `ad7-unknown-cursor-field`, `s2-free-letters-set`, `ad7-gave-up-won` from won + gaveUp true), plus `session-invalid-null.json`, `session-invalid-array.json`. Each the fewest field changes from a named valid base; negative count → `domain-count` (sourceCount −1); sourceCount 0 → `r13-source-count`.
- [x] `src/engine/serialize.test.ts` -- all ticket AC tests ("§2 …"), rejection table (file, base, stage, code), distinct/literal-list assertions, `expectTypeOf<ParseSessionResult>().toEqualTypeOf<…>()` for the AD-7 shape (review-log minor 6), direct-stage and apply/view equivalence tests, version-stage cases, defining properties (idle-pending-draft also asserts `moves.length === cursor.index + 1`).
- [x] `src/engine/serialize.propagation.test.ts` -- "AD-15 …" partial `vi.mock('./replay')` TypeError propagation.

**Acceptance Criteria (ticket ACs apply verbatim, plus):**
- Given any object, when schema checks run, then the first violation found in the order above is thrown and no check code is produced by both the schema stage and `checkSession`.
- Given each AD-7/replay fixture, when `checkSchema` runs on it, then it does not throw.
- Given `npm run test:all`, then it is green.

## Implementation Notes

- Generator: `/tmp/wcgen/gen.ts` (uncommitted), run with `npx -y tsx@4.23.15`, writes each valid fixture with `serializeSession`. All nine use seed 1 and the inline dictionary `{tan, one, man}` (`ctx = { lang: EN, dictionary }`). Seed 1 bottoms: col2 M26, col3 A0 (above it T42), col4 O32, col6 N28 (above it E9, A1, N27). Command sequences (U = undo):
  - `tan` = drop {3, 2, 6}, flip (word "tan", S = T42 A0, D = N28, side right); `tanPlace` = tan, validate; `tanDone` = tanPlace, confirm (cell 3 ← [42, 0, 28]).
  - `one` = drop {4, 1, 6}, addFreeLetter {cell 3}, flip, validate (word "one": O32, free N28 from cell 3, D = E9; R-51 default order [32, 28, 9]); `oneDone` = one, setPlacementOrder [9, 32, 28], confirm.
  - `man` = drop {2, 1, 6}, setDestinationCount {k 2}, flip, validate, confirm (word "man").
  - session-idle-fresh: createSession(1). session-composing: tan. session-composing-draft-2-letters: drop {3, 1, 6}, flip ("an"). session-place: tanPlace. session-idle-pending-draft: tanPlace, U, U. session-place-free-letter-redo-tail: tanDone, oneDone, man, U ×4 (cursor {1, place}; draft placementOrder [9, 32, 28], freeLetters [3]). session-below-committed-last: tanDone, one, U ×3 (cursor {0, place}, moves[1] reached place). session-won: winSeed(1). session-gave-up: accrue(createSession(1), 1000, EN), giveUp.
- Rejecting fixtures were derived from the valid ones by `/tmp/wcgen/invalid.py` (uncommitted; compact `json.dumps`); each row of the `REJECTIONS` table in `src/engine/serialize.test.ts` names its base. Multi-change fixture: `r36-letter-count` (place: sourceCount 1 and arrangement [0], since S and M must stay consistent for R-36 to be the first violation); all others are one field change.
- `checkSchema(value: object)` takes an object (the version stage has already rejected non-objects) and asserts it is a `Session`.
- `resolveJsonModule` was not needed: `npm run check` accepts the fixture imports as is; biome does not lint `fixtures/` (its `*.json` include is root-only), so the files stay compact.
- Review-log minor 9 (orphan-fixture guard in architecture.test.ts) declined as the plan's Never states: table-vs-files completeness is hand-reviewed, and entry 11 adds more fixtures.
- Beyond the ticket ACs, one `§2` test asserts the schema check order on multi-violation objects (plan AC 1).

## Plan Change Log

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 19 findings — high 0, medium 1, low 14, false 4, maybe-false 0
- findings:
  - `[low]` `[patch]` blind-hunter: propagation test `toThrow(new TypeError(…))` matches the message only, not the class — now `toThrow(TypeError)` plus `toThrow('not an EngineError')` (serialize.propagation.test.ts).
  - `[low]` `[reject]` blind-hunter: SCHEMA_CODES/REPLAY_CODES literals can drift from serialize.ts — the ticket prescribes literal lists copied from errors.ts; deriving them would add an engine constant for an unlikely drift.
  - `[low]` `[reject]` blind-hunter: `Row.base` and file↔import pairing unasserted — the ticket makes base and fewest-changes a hand review, not an assertion.
  - `[low]` `[patch]` blind-hunter: `isPlainObject` array branch untested — added inline `cursor []` → object-cursor and `moves [[]]` → object-move cases.
  - `[low]` `[patch]` blind-hunter: ordering test misses required-before-type (cursor, move), destinationSide-before-reached, domain order across fields — added four cases to the ordering test.
  - `[low]` `[patch]` blind-hunter: each array type code tested in one form only — added freeLetters [3.5], arrangement {}, placementOrder 9 inline cases.
  - `[low]` `[reject]` blind-hunter: `asserts value is Session` narrows fields the schema leaves untyped — `replay` (checkSession) runs immediately after in the only caller; plan settles the assertion signature; a narrower type adds surface for no reachable harm.
  - `[low]` `[reject]` blind-hunter: schema messages omit the bad value — messages are swallowed into replay-failed; the code identifies the check; cosmetic.
  - `[low]` `[reject]` blind-hunter: no in-test regeneration of a fixture from live apply — the ticket prescribes fixtures written once by an uncommitted generator (intent excludes a regeneration check).
  - `[low]` `[patch]` blind-hunter: version boundary MAX_SAFE_INTEGER untested — added to the version-unknown cases.
  - `[low]` `[reject]` blind-hunter: non-SyntaxError rethrow after JSON.parse untested/unreachable — deliberate CLAUDE.md rule 6 (never swallow); no harm.
  - `[low]` `[reject]` blind-hunter: fixtures lack a trailing newline — they equal serializeSession/JSON.stringify output as the ticket requires; tests compare parsed values, so an editor newline changes nothing.
  - `[medium]` `[patch]` verification-gap: destinationColumn/freeLetters domain rows and isColumn's lower bound untested; a regression there makes parseSession throw TypeError from replay instead of replay-failed — added inline cases (sourceColumn 0, destinationColumn 9 and 0, freeLetters [11] and [2]) asserting the schema code and parseSession `replay-failed`.
  - `[low]` `[reject]` intent-alignment: ParseSessionResult check sits in a runtime `it` and uses readonly fields — the `expectTypeOf` is enforced by `npm run check` (review-log minor 6); readonly is the engine's read-only convention and assignable to the AD-7 shape.
  - `[false]` `[reject]` intent-alignment: view().phase never asserted — the ticket allows "via cursor/moves and view"; cursor.phase is the stored phase.
  - `[false]` `[reject]` intent-alignment: equivalence test deep-freezes imported fixture objects in place — nothing mutates fixtures; no test outcome changes.
  - `[low]` `[reject]` intent-alignment: untested rethrow branches (JSON.parse, checkSchema non-EngineError) — same as the rule 6 rethrow row above; the ticket asks only for the replay-stage propagation test.
  - `[false]` `[reject]` intent-alignment: new files mode 100755 — `core.fileMode` is false, so git records 100644.
  - `[false]` `[reject]` intent-alignment: additions beyond intent (Composing-reached test, ordering test, empty-text case) — descriptive, none contradicts the ticket.

## Design Notes

Review-log unapplied minors, resolved: 1 (replay stage names `ad7-gave-up-won`) — Code Map/table; 2, 3, 4 — Always; 5, 6 — applied; 7, 8, 10, 11, 12, 13 — Always/Tasks; 9 — declined (Never); 14 — `s2-free-letters-set` kept. No open major.

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npx vitest run src/engine/serialize` -- expected: all serialize tests pass.

## Auto Run Result

- **Summary:** `src/engine/serialize.ts` adds `serializeSession` (§2 key order, compact, no validation) and `parseSession` (JSON parse → version stage → 22-code §2 schema stage `checkSchema` → `replay`), exported per AD-2 with type `ParseSessionResult`; nine valid round-trip fixtures generated once through public apply/winSeed, 45 rejecting `session-invalid-*.json` fixtures (22 schema, 23 replay) plus null/array; tests per the ticket ACs. Review-log minors 1–8, 10–14 resolved in the plan (Design Notes); 9 declined (Never).
- **Files:** `src/engine/serialize.ts` (new, serialise/parse/schema stage); `src/engine/serialize.test.ts` (new, §2 round trip, key order, defining properties, rejection table, equivalence, version stage, inline schema cases); `src/engine/serialize.propagation.test.ts` (new, AD-15 rethrow); `src/engine/errors.ts` (schema.* codes in the doc comment); `src/engine/index.ts`, `src/engine/index.test.ts` (AD-2 exports); `fixtures/session-*.json` (56 fixtures).
- **Review:** 19 findings. Patched 6 (medium 1, low 5): propagation class check; inline schema cases for object-array branches, destinationColumn/freeLetters domains, isColumn lower bound, alternate array type forms, extra ordering cases; version MAX_SAFE_INTEGER. Deferred 0. Rejected 13 with reasons in the triage log.
- **Follow-up review recommended:** false (first pass; patched high 0, medium 1, low 5).
- **Verification:** `npx vitest run src/engine/serialize` 118 passed; `npm run test:all` exit 0 (unit 1218 passed; e2e:dist 13, e2e 34, e2e:pwa 12 passed).
- **Residual risks:** table-vs-files completeness and each fixture's fewest-changes base are hand-reviewed per the ticket, not asserted.
