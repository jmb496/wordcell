---
title: 'Parse hardening and engine cleanup'
type: 'refactor'
ticket: '2'
created: '2026-09-30'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-parse-hardening-and-engine-cleanup.md'
warnings: [oversized]
deferred:
  - summary: >-
      checkRecord still accepts other records no play can produce: a won record without longestWord, a spelling with q not followed by u, a letterCount above the deck's letters.
    evidence: |-
      A win places every card, so it commits words and has a longestWord; Q exists only as the QU card; no word can exceed the deck's letter total. SPEC E5 lists exactly the three checks this build added, so any further rejection is a data-rule decision for the owner (spec change), not a build default.
    location: >-
      src/engine/serialize.ts checkRecord
    severity: low
baseline_revision: '124ae044b38483322ac0f1cd328bb0dc96dd6254'
---

<intent-contract>

## Intent

**Problem:** B8: `parseSession` accepts an `activeMs` so close to 2^53 that the first `accrue` throws on every launch (E4); `checkRecord` accepts records no play can produce (won with a negative score, `letterCount` < 3 or ≠ spelling length, E5); `statistics` hands out the record's own `longestWord` (E6). B9: the field lists, field-set checkers, uint32/safe-non-negative checks and letter-count sum are duplicated, and engine comments cite `entry N` / `CAP-n`.

**Approach:** Add the parse-only headroom check and the three record checks with their codes and fixtures, copy `longestWord` in `statistics`, fold the duplicates into `src/engine/fields.ts` + `rules.ts` `wordLetterCount`, and rewrite the citations. The ticket file is the authority for every name, order and test; this plan settles the review log's open major and unapplied minors (Design Notes).

## Boundaries & Constraints

**Always:** AGENTS.md rules 1–7, Conventions, pitfalls; every existing check code, order, message wording (history field-set messages included) and fixture result unchanged; each caller keeps its own code, message and throw site; test names lead with the id; new fixtures are copies of their base with only the listed values changed, in the base file's exact byte format; unit suite < 5 s.

**Never:** any `src/engine/index.ts` change or new export from it; touching `deal.ts` logic or the R-02 golden test; editing the spine, SPEC, build-notes, AGENTS.md or ticket files; a headroom bound in `checkSession`, `accrue` or `checkRecord`; rewriting CAP-n/entry citations in `*.test.ts` files; E4–E6 ids in engine comments.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| headroom boundary | idle-fresh, `activeMs` 2^52 | `parseSession` ok; `accrue(parsed, 86_400_000, EN).activeMs` = 2^52 + 86 400 000; `view`, `apply(giveUp)` don't throw | none |
| headroom reject | fixture, `activeMs` 2^52 + 1 | `replay-failed` v1; schema + replay pass; `checkActiveMsHeadroom` throws `ad7-active-ms-headroom` | — |
| headroom parse-only | same, deep-frozen | `view` ok; `apply(giveUp)` returns `{ session }` | none |
| replay code wins | idle-fresh, `seed` −1, `activeMs` 2^52 + 1 | `replay-failed`; `replay` throws `seed-uint32` | — |
| history activeMs | record `activeMs` 2^52 + 1, MAX_SAFE_INTEGER | `parseHistory` ok | none |
| E5 rejects | {'ab',2} / {'tan',4} / won −1 (with and without `longestWord`) | `contents-unreadable`; `-short` / `-mismatch` / `won-final-score` | — |
| E5 accepts | won 0; gaveUp negative with word; {'tan',3}; {'quiz',4} | ok | none |

</intent-contract>

## Code Map

- `src/engine/serialize.ts` -- `SESSION_REQUIRED`/`CURSOR_REQUIRED`/`MOVE_REQUIRED` (66-77) and `requireFields` (124) → fields.ts 'missing'; `hasFieldSet` (264) → 'exact' (`!== undefined`); `CONTAINER_FIELDS`/`RECORD_REQUIRED`/`RECORD_OPTIONAL`/`LONGEST_WORD_FIELDS` (276-279) stay here in marked-entry form (`RECORD_FIELDS`); `MAX_UINT32` (281) and seed check (313) → `isUint32`; version check (199) and record `activeMs` (320) → `isSafeNonNegative`; local `isSafeInteger` guard (283) stays for finalScore/letterCount; `checkRecord` early return (322) → if-block, new checks after letter-count (329), then won-final-score for every record; doc comment 298-305 ("not cross-checked"); `parseSession` (211-223) calls `checkActiveMsHeadroom(value)` inside the try after `replay`. Keep `orderedMove`, `serializeSession`, `orderedRecord`, `MOVE_TYPES`, `MOVE_DOMAINS`. CAP-9 citations at 19, 46, 62, 152, 206, 225, 247, 286, 299, 334.
- `src/engine/replay.ts` -- `SESSION_FIELDS`/`CURSOR_FIELDS`/`MOVE_FIELDS` sets (30-43), `unknownField` (58), calls 117-133 → 'unknown'; activeMs 66 → `isSafeNonNegative`; "entry 10" at 147.
- `src/engine/session.ts:52-56` -- `MAX_SEED` + `assertSeed` → `isUint32`.
- `src/engine/commands.ts:522` -- accrue `elapsedMs` → `isSafeNonNegative`; citations 82 ("build-notes CAP-4" → AD-2 command TABLE order), 372 (CAP-5 → drop), 461.
- `src/engine/scoring.ts:11-12` -- `letters` → import `wordLetterCount` from `./rules` (rules does not import scoring).
- `src/engine/history.ts:98-119` -- `statistics` longest → copy `{ spelling, letterCount }`; citation line 20.
- `src/engine/errors.ts` -- history order list (13-18) gains the three codes; own line for the headroom code; line 27 "build-notes CAP-4 order" → AD-2 command TABLE order.
- Other citations: `rules.ts:7`, `rules.ts:285-286`, `deal.ts:38`, `view.ts:155`, `test-helpers.ts:51`, `win-seed.ts:6`.
- `src/engine/serialize.test.ts` -- `Row` (285-299), `REPLAY_CODES` (652, stays 23), rejection harness (800-827), `HISTORY_REJECTIONS` (~1100-1177), `HISTORY_CODES` + length/`coded` asserts (1180-1209), inline rejects (1231), order pairs (1294-1347; `base` = record 0, won, 'lquejata' 8), accepts (1369-1381; −5 at 1372).
- `src/engine/history.test.ts:427-556` -- statistics tests (`rec`, `stats` helpers).
- `fixtures/` -- bases `session-idle-fresh.json`, `history-three-records.json` (single-line compact JSON).
- `lang/lang-data.ts:32` `const letters =` is a letter table, not the sum; out of scope.

## Tasks & Acceptance

**Execution:**
- [x] (before any edit) `npx vitest run`; record Duration in Implementation Notes.
- [x] `src/engine/fields.ts` -- new, per ticket Fold: marked field lists `SESSION_FIELDS` (`version` optional), `CURSOR_FIELDS`, `MOVE_FIELDS` (`targetCell`, `placementOrder` optional), in today's order; `fieldSetViolation(object: object, fields, mode)`; `isUint32`, `isSafeNonNegative` (`(value: unknown) => value is number`, on `Number.isSafeInteger`). Header comment cites AD-7/§2.
- [x] `src/engine/serialize.ts`, `replay.ts`, `session.ts`, `commands.ts`, `scoring.ts` -- switch to fields.ts / `wordLetterCount` at the Code Map sites; delete the replaced definitions; codes and messages unchanged.
- [x] `src/engine/serialize.ts` -- `checkActiveMsHeadroom(session: Session)` exported (not from index.ts), throws `EngineError('ad7-active-ms-headroom', 'AD-7 activeMs … above 2^52 headroom')` when `activeMs > 2 ** 52`, called in parseSession's try after `replay`; E5 checks per ticket (short uses `MIN_WORD_LENGTH`; mismatch comment cites R-85/AD-7 v1-English-only, moving behind LangData); doc comments updated.
- [x] `src/engine/history.ts` -- `statistics` returns a copy of the longest word.
- [x] `src/engine/errors.ts` -- history list + headroom line ("parseSession only, after replay returns"); citation fix.
- [x] Citations in all listed engine sources; then both ticket greps and the Design Notes grep return nothing.
- [x] `fixtures/` -- four new fixtures per ticket (E4: idle-fresh with `activeMs` 4503599627370497; E5: history-three-records record 0 changed), byte format of the base.
- [x] `src/engine/serialize.test.ts` -- `'parse'` stage + harness branch, `PARSE_CODES` (length 1) with coverage assert, headroom row; three history rows (ticket fixture names mapped to their codes), `HISTORY_CODES` 15, `coded` 16; inline rejects incl. won −1 without `longestWord`; order pairs per ticket AC + `history.active-ms` before `history.won-final-score` (`{won, −1, activeMs −1}` vs `{won, −1}`, both without `longestWord`); accepts: won 0, gaveUp negative with word, 'tan' 3, `activeMs` 2^52 + 1 and MAX_SAFE_INTEGER; ~1372 → `{ ...base, outcome: 'gaveUp', finalScore: -5 }`; §2 headroom tests from the matrix (2^52 accept with `parsed`/`accrued` bindings, also asserting `parseSession(serializeSession(accrued), EN)` is `replay-failed`; parse-only frozen view/giveUp; replay code wins).
- [x] `src/engine/history.test.ts` -- `it('R-84 statistics returns a copy of the longest word …')`: `not.toBe(record.longestWord)` and `toStrictEqual` it.
- [x] Verification below; record outputs and timings in Implementation Notes.

**Acceptance Criteria:**
- Given the ticket's Acceptance Criteria, when `npm run test:all` runs, then it is green and every listed test exists and passes.
- Given `git diff` of existing tests, then only the ticket-allowed edits appear (harness branch, code lists and counts, new rows, ~1372 gaveUp, import paths); no existing fixture changes.
- Given the three greps under Verification, then each returns nothing.

## Design Notes

Review-log resolutions (technical defaults):
- Open major (history keeps the safe-integer domain): §2 parseHistory accept rows for record `activeMs` 4503599627370497 and `Number.MAX_SAFE_INTEGER`.
- 2^52 test binds `parsed = parseSession(…).session`, `accrued = accrue(parsed, 86_400_000, EN)`; it also pins that `accrued` fails the next parse (E4 sanctioned), documenting that note in the test.
- One-definition grep adopted with one adjustment: `const letters = \(` instead of `const letters =`, since `lang/lang-data.ts:32` holds the unrelated letter table. Serializer key orders and `MOVE_TYPES`/`MOVE_DOMAINS` stay.
- New comments cite AD-7, §2, R-36, R-85 only; D- and A-E ids stay.
- errors.ts lists the headroom code on its own parseSession-only line, not under "AD-7 post-replay".
- Optional replay-code-wins case adopted (matrix row).
- Order pair `history.active-ms` before `history.won-final-score` adopted.
- `fieldSetViolation` takes `object: object`; history field-set messages unchanged.
- Fixture names stay as the ticket lists them; rows map them to their codes.

## Verification

**Commands:**
- `npx vitest run` -- all pass; Duration < 5 s, before/after recorded.
- `grep -rnE 'entry [0-9]|CAP-[0-9]' src/engine --include=*.ts --exclude=*.test.ts` -- nothing.
- `grep -rnE '4294967295|0xffff_?ffff|MAX_UINT32|MAX_SEED|isSafeInteger\([a-zA-Z.]+\) && [a-zA-Z.]+ >= 0' src/engine --include=*.ts --exclude=*.test.ts --exclude=fields.ts` -- nothing.
- `grep -rnE 'SESSION_REQUIRED|CURSOR_REQUIRED|MOVE_REQUIRED|requireFields|unknownField|hasFieldSet|const letters = \(' src/engine --include=*.ts --exclude=*.test.ts` -- nothing.
- `git status --short fixtures/` -- only the four new files (untracked), no modified fixture.
- `npm run test:all` -- green.

## Implementation Notes

- Baseline `npx vitest run` before any edit: 1408 passed, Duration 2.90 s. After: 1429 passed, Duration 2.87 s.
- `src/engine/fields.ts`: field lists are `[name, 'required' | 'optional']` tuples (`FieldList`); history lists in serialize.ts use the same type. `fieldSetViolation` is called inline at each site (no `requireFields` wrapper), so each caller keeps its own code, message and throw site.
- `checkRecord`: the `longestWord` block is an if-block; `-short`, `-mismatch` follow `longest-word-letter-count`; `won-final-score` runs last for every record.
- Citations: CAP-n/entry references replaced by §2, AD-2 command TABLE order, AD-3, AD-17, the errors.ts per-move order, or dropped (deal.ts, win-seed.ts, commands.ts undo section, serialize.ts headers).
- Tests: 21 new (headroom row + 3 §2 headroom tests, 3 history fixture rows, 4 inline rejects, 4 order pairs, 5 accepts, R-84 copy test); `-5` accept turned gaveUp.
- Verification: the three greps return nothing; `git status --short fixtures/` shows only the four new untracked files; `npm run test:all` green (unit 1429, dist-smoke 13, e2e 34, pwa 12).

## Plan Change Log

## Review Triage Log

### 2026-09-30 — Review pass
- verdicts: 18 findings — high 0, medium 0, low 8, false 10, maybe-false 0
- findings:
  - `[low]` `[reject]` blind-hunter: 2^52 has no named constant — one source site (check + its message); tests pin literal values on purpose; negligible.
  - `[low]` `[patch]` blind-hunter: new test comment cites the epic-local "SPEC E4" — comment now cites AD-7 (parse-only bound).
  - `[low]` `[reject]` blind-hunter: fields.ts has no own unit test — every mode and predicate is exercised through its callers by the full rejection/accept suites; the untested distinctions (exact-mode order) have no observable effect since history maps both to one code.
  - `[false]` `[reject]` blind-hunter: SESSION_FIELDS `version` optional is a trap for a future 'exact' caller — the ticket prescribes this marking; no 'exact' caller of SESSION_FIELDS exists.
  - `[false]` `[reject]` blind-hunter: history field-set errors drop the key — the ticket and review-log minor require history messages unchanged.
  - `[low]` `[defer]` blind-hunter: checkRecord still accepts impossible records (won without longestWord; q without u) — beyond SPEC E5's enumerated checks; owner decision; deferred.
  - `[low]` `[patch]` blind-hunter: garbled checkRecord doc-comment clause — reworded; notes longestWord checks skip when absent and won-final-score runs regardless.
  - `[low]` `[patch]` blind-hunter: `(record.finalScore as number)` cast — `const { finalScore } = record` bound before the guard, cast removed.
  - `[low]` `[reject]` blind-hunter: field-by-field `longestWord` copy drops future fields — LONGEST_WORD_FIELDS is an exact set, so a new field needs a check change anyway; explicit copy matches orderedRecord.
  - `[false]` `[reject]` blind-hunter: `'parse'` stage name is vague — the ticket names the stage `'parse'` and the list `PARSE_CODES`.
  - `[low]` `[defer]` edge-case: won record without longestWord accepted — same root cause as the deferred E5-scope row.
  - `[false]` `[reject]` edge-case: won at finalScore 0 should be rejected — the ticket AC pins won at 0 as an accept boundary (SPEC E5: finalScore ≥ 0).
  - `[low]` `[defer]` edge-case: letterCount far above the deck's letters accepted — same root cause as the deferred E5-scope row.
  - `[false]` `[reject]` edge-case: -0 passes isSafeNonNegative/isUint32 — pre-existing (the replaced checks accepted -0 identically); version -0 is pinned as current behaviour; -0 and 0 compare equal.
  - `[false]` `[reject]` intent-alignment: no Playwright storage-surface test of the new rejections — the new checks are untagged engine sentences (Vitest per AD-17); the shell store does not load storage until CAP-3.
  - `[false]` `[reject]` intent-alignment: accrued Session above 2^52 fails the next parse — sanctioned parse-only design, deliberately pinned (review-log minor).
  - `[false]` `[reject]` intent-alignment: view.ts weighted `freeScore` reduce not folded — it is a weighted score, not the letter-count sum the ticket names.
  - `[false]` `[reject]` intent-alignment: replacement citations unverified — AD-3 (GameView from view), AD-17 (inline test dictionaries), §2 (Position/replay) do carry the cited content; the ticket allows the errors.ts order list / TABLE.

## Auto Run Result

- **Summary:** E4 parse-only `activeMs` headroom (`ad7-active-ms-headroom`, replay-failed), E5 record checks (`longest-word-letter-count-short`, `-mismatch`, `won-final-score`, contents-unreadable), E6 `statistics` longestWord copy, B9 fold into `src/engine/fields.ts` (field lists, `fieldSetViolation`, `isUint32`, `isSafeNonNegative`) plus scoring.ts on `wordLetterCount`, and every `entry N`/`CAP-n` citation in engine sources replaced.
- **Files:** `src/engine/fields.ts` (new fold module); `serialize.ts` (headroom helper, E5 checks, fold call sites, citations); `replay.ts`, `session.ts`, `commands.ts`, `scoring.ts` (fold call sites); `history.ts` (E6); `errors.ts` (code lists); `rules.ts`, `deal.ts`, `view.ts`, `test-helpers.ts`, `win-seed.ts` (citations only); `serialize.test.ts`, `history.test.ts` (new tests, allowed edits); four new fixtures.
- **Review-log items:** open major resolved (history record `activeMs` 2^52 + 1 and MAX_SAFE_INTEGER accept rows); every unapplied minor resolved per Design Notes (the `const letters =` grep narrowed to `const letters = \(` because lang-data.ts holds an unrelated letter table).
- **Review:** 18 findings. 3 patched (low: E-id test comment, garbled doc comment, finalScore cast). 1 deferred group (3 rows: further impossible records beyond SPEC E5, owner decision). 4 low rejected (unnamed 2^52 constant, fields.ts own test, field-by-field copy — reasons in the triage log). 10 false.
- **Follow-up review recommended:** false (patched: high 0, medium 0, low 3).
- **Verification:** after the patches, `npm run test:all` exit 0 (1429 unit tests, 3.53 s; dist-smoke 13, e2e 34, pwa 12); the three greps return nothing; `git status --short fixtures/` shows only the four new files.
- **Residual risks:** owner may want further record-plausibility checks (deferred item); a Session accrued past 2^52 is rejected on the next load (sanctioned by SPEC E4).
