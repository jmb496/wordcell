---
id: 2
type: story
title: "Parse hardening and engine cleanup"
parent: epic-app-shell
covers: [CAP-2]
after: [1]
risk: medium
---

# Parse hardening and engine cleanup

## Description

Applies B8 and the B9 engine fold (E8's dispatch timing stays with CAP-3).

- E4: parseSession-only. An internal serialize.ts helper `checkActiveMsHeadroom(session)` (exported for tests like `checkSchema`, not from index.ts) throws `EngineError('ad7-active-ms-headroom')` when `activeMs > 2^52`; `parseSession` calls it inside its try after `replay(value, lang)` returns, so it maps to `replay-failed`. It runs post-replay (after `ad7-active-ms`, which still catches non-safe, negative and fractional values) because `checkSession` is shared with `apply`, `view` and `accrue`, which keep the safe-integer domain (commands.test.ts ~1739-1751 unchanged); `history.active-ms` keeps it too (SPEC E4). errors.ts lists the code as a parseSession-only post-replay check. serialize.test.ts: `Row['stage']` gains `'parse'`, whose harness branch asserts `checkSchema` and `replay` do not throw and `checkActiveMsHeadroom` throws the code; the code sits in its own `PARSE_CODES` list with its own coverage and length assertion (not `REPLAY_CODES`). Fixture `session-invalid-ad7-active-ms-headroom.json` (overrides build-notes' [ASSUMPTION] name): a copy of `session-idle-fresh.json` with `activeMs` 4503599627370497 (2^52 + 1).
- E5: `checkRecord` adds, in order after `history.longest-word-letter-count`: `history.longest-word-letter-count-short` (letterCount < `MIN_WORD_LENGTH`, R-36), `history.longest-word-letter-count-mismatch` (letterCount ≠ spelling.length; comment cites R-85 and AD-7 as v1-English-only, moving behind LangData later), `history.won-final-score` (outcome won and finalScore < 0), the last run for every record (the `longestWord` early return at serialize.ts ~322 becomes an if-block). `parseHistory` returns `contents-unreadable`. Fixtures, each a copy of `history-three-records.json` with record 0 changed as listed, breaking only its own check: `history-invalid-letter-count-short.json` (spelling 'ab', letterCount 2), `history-invalid-letter-count-mismatch.json` ('tan', 4), `history-invalid-won-negative.json` (won, finalScore −1). Update the `checkRecord` doc comment (~303 "not cross-checked against the spelling") and the errors.ts history order list. The won −5 accept case (serialize.test.ts ~1372) becomes gaveUp (SPEC.review-log.md Pass 3).
- E6: `statistics` returns a copy of `longestWord`.
- Fold: one engine-internal module `src/engine/fields.ts` (not exported from index.ts) holding the field lists, the checker and both predicates: one ordered field list per object (`SESSION_FIELDS`, `CURSOR_FIELDS`, `MOVE_FIELDS`), each entry marked required or optional, replacing replay.ts's sets and serialize.ts's `SESSION_REQUIRED`, `CURSOR_REQUIRED`, `MOVE_REQUIRED` (required = all minus optional; `SESSION_FIELDS` marks `version` optional, so the required list stays seed, moves, cursor, gaveUp, activeMs and `version` stays a known key for 'unknown'); one checker `fieldSetViolation(object, fields, mode: 'missing' | 'unknown' | 'exact'): string | undefined` ('missing': first absent required key in list order; 'unknown': first key not in the list; 'exact': missing, then unknown), called with 'missing' by `checkSchema` (replacing `requireFields`), 'unknown' by `checkSession` (replacing `unknownField`) and 'exact' by history (replacing `hasFieldSet`, comparing to `undefined`), messages keeping the field name. History lists stay in serialize.ts in the same marked-entry form: `CONTAINER_FIELDS`, `RECORD_FIELDS` (`RECORD_REQUIRED` + `RECORD_OPTIONAL`), `LONGEST_WORD_FIELDS`. Predicates `isUint32` and `isSafeNonNegative`, typed `(value: unknown) => value is number` on `Number.isSafeInteger`; serialize.ts's local `isSafeInteger` type guard (finalScore, letterCount) may stay. Call sites that use them: `isUint32` in session.ts `assertSeed` and serialize.ts `checkRecord` seed; `isSafeNonNegative` in replay.ts `checkSession` activeMs, serialize.ts `versionStage` version and `checkRecord` activeMs, commands.ts `accrue` elapsedMs. scoring.ts imports rules.ts `wordLetterCount` (the single letter-count sum) instead of its `letters` copy. Each caller keeps its own code, message and throw site.
- Citations: replace every `entry N` and `CAP-n` citation in engine sources with R/Q/§/AD ids (E ids are epic-local like CAP-n); where none carries the cited order (e.g. errors.ts:27, commands.ts:82 "build-notes CAP-4"), cite the errors.ts order list or the AD-2 command TABLE, or drop it.

Interface: No index.ts change; internal engine modules only; new codes in errors.ts; new fixtures session-invalid-ad7-active-ms-headroom.json, history-invalid-won-negative.json, history-invalid-letter-count-short.json, history-invalid-letter-count-mismatch.json.
Tests: §2 parseSession/parseHistory per new check; R-84 statistics longestWord copy; existing §2 fixture suite unchanged.
Owns: E4, E5, E6 and the B9 fold.

## Acceptance Criteria

Verify: npm run test:all is green with:

- a §2 test per new check asserting its code and reason, plus an inline §2 case of a won record at finalScore −1 without `longestWord`;
- '§2 checkRecord runs in order: %s before %s' pairs: `longest-word-letter-count` before `-short` ({'ab',0} vs {'ab',2}), `-short` before `-mismatch` ({'tan',2} vs {'tan',4}), `-mismatch` before `won-final-score` (won −1 with {'tan',4} vs won −1 with {'tan',3});
- §2 accept boundaries: won at finalScore 0, gaveUp at a negative finalScore with a `longestWord`, letterCount exactly 3 ('tan'), 'quiz' 4 (existing);
- `session-idle-fresh.json` with `activeMs` 2^52 parses ok, `accrue(…, 86 400 000)` gives exactly 2^52 + 86 400 000, and `view` and `apply(result, { type: 'giveUp' }, { lang: EN })` (legal while idle and playing) on the accrued Session do not throw, the latter returning `{ session }`;
- `view` and `apply(frozen, { type: 'giveUp' }, { lang: EN })` (returning `{ session }`) on the deep-frozen value of `session-invalid-ad7-active-ms-headroom.json` do not throw (the bound is parse-only);
- an R-84 test that `statistics` longestWord is `not.toBe(record.longestWord)` and `toStrictEqual` it; existing statistics tests (won records with negative scores fed directly) unchanged;
- every existing engine test passing unchanged except: the harness `'parse'` branch and `PARSE_CODES`, the new codes added to the code lists, code-list and row-count length assertions (`HISTORY_CODES` 12 → 15, `coded` 13 → 16, `REPLAY_CODES` stays 23, `PARSE_CODES` 1), new rejection rows, order-pair rows and accept rows, the ~1372 won −5 case turned gaveUp, and import paths of moved helpers; every existing fixture keeping its result and code;
- field lists, field-set checker, `isUint32`, `isSafeNonNegative` and the letter-count sum each having exactly one definition in `src/engine` sources, and `grep -rnE '4294967295|0xffff_?ffff|MAX_UINT32|MAX_SEED|isSafeInteger\([a-zA-Z.]+\) && [a-zA-Z.]+ >= 0' src/engine --include=*.ts --exclude=*.test.ts --exclude=fields.ts` returning nothing;
- `grep -rnE 'entry [0-9]|CAP-[0-9]' src/engine --include=*.ts --exclude=*.test.ts` returning nothing (test-helpers.ts and win-seed.ts included); test files keep their CAP-n/entry citations.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/SPEC.md, CAP-2 and E4–E6 rows
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-2
- review — _bmad-output/specs/spec-epic-3-app-shell/SPEC.review-log.md, Pass 3

## Notes

- The fold keeps every check order and code; the existing fixture suite is the proof (build-notes CAP-2).
- The AD-7 domain changes are sanctioned by SPEC E4/E5 and recorded as a build-notes spine note; do not edit the spine in this ticket.
