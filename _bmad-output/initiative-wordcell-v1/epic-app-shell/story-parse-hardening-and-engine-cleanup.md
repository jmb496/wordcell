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

- E4: parseSession-only. In serialize.ts `parseSession`, after `replay(value, lang)` returns, throw `EngineError('ad7-active-ms-headroom')` when `activeMs > 2^52`, mapped to `replay-failed`; `ad7-active-ms` still catches non-safe, negative and fractional values first. `checkSession`, `accrue` and `apply` keep the safe-integer domain (commands.test.ts ~1739-1751 unchanged); `history.active-ms` keeps it too (SPEC E4). errors.ts lists the code as a parseSession-only post-replay check; serialize.test.ts `Row['stage']` gains `'parse'` for it. Fixture `session-invalid-ad7-active-ms-headroom.json` (overrides build-notes' [ASSUMPTION] name): a copy of `session-idle-fresh.json` with `activeMs` 4503599627370497 (2^52 + 1).
- E5: `checkRecord` adds, in order after `history.longest-word-letter-count`: `history.longest-word-letter-count-short` (letterCount < 3), `history.longest-word-letter-count-mismatch` (letterCount ≠ spelling.length; comment cites E5/R-85 as v1-English-only, moving behind LangData later), `history.won-final-score` (outcome won and finalScore < 0), the last run for every record (the `longestWord` early return at serialize.ts ~322 becomes an if-block). `parseHistory` returns `contents-unreadable`. Fixtures, each breaking only its own check: `history-invalid-letter-count-short.json` (spelling 'ab', letterCount 2), `history-invalid-letter-count-mismatch.json` ('tan', 4), `history-invalid-won-negative.json` (won, finalScore −1). Update the `checkRecord` doc comment (~303 "not cross-checked against the spelling") and the errors.ts history order list. The won −5 accept case (serialize.test.ts ~1372) becomes gaveUp (SPEC.review-log.md Pass 3).
- E6: `statistics` returns a copy of `longestWord`.
- Fold: one engine-internal module (default `src/engine/fields.ts`, not exported from index.ts) holding one ordered field list per object (`SESSION_FIELDS`, `MOVE_FIELDS`; the schema's required list derived from it), one field-set checker, boolean predicates `isUint32` and `isSafeNonNegative`; one letter-count sum used by scoring.ts and rules.ts. Each caller keeps its own code, message and throw site.
- Citations: replace every `entry N` and `CAP-n` citation in engine sources with R/Q/§/AD/E ids; where none carries the cited order (e.g. errors.ts:27, commands.ts:82 "build-notes CAP-4"), cite the errors.ts order list or the AD-2 command TABLE, or drop it.

Interface: No index.ts change; internal engine modules only; new codes in errors.ts; new fixtures session-invalid-ad7-active-ms-headroom.json, history-invalid-won-negative.json, history-invalid-letter-count-short.json, history-invalid-letter-count-mismatch.json.
Tests: §2 parseSession/parseHistory per new check; R-84 statistics longestWord copy; existing §2 fixture suite unchanged.
Owns: E4, E5, E6 and the B9 fold.

## Acceptance Criteria

Verify: npm run test:all is green with:

- a §2 test per new check asserting its code and reason, plus an inline §2 case of a won record at finalScore −1 without `longestWord`;
- §2 accept boundaries: won at finalScore 0, gaveUp at a negative finalScore with a `longestWord`, letterCount exactly 3 ('tan'), 'quiz' 4 (existing);
- `session-idle-fresh.json` with `activeMs` 2^52 parses ok, `accrue(…, 86 400 000)` gives exactly 2^52 + 86 400 000, and `view` and a non-throwing `apply` on the result do not throw;
- an R-84 test that `statistics` longestWord is `not.toBe(record.longestWord)` and `toStrictEqual` it; existing statistics tests (won records with negative scores fed directly) unchanged;
- every existing engine test passing unchanged except: the new codes added to the code lists and their length assertions, new rejection rows, the ~1372 won −5 case turned gaveUp, and import paths of moved helpers; every existing fixture keeping its result and code;
- field lists, field-set checker, `isUint32`, `isSafeNonNegative` and the letter-count sum each having exactly one definition in `src/engine` sources;
- `grep -rnE 'entry [0-9]|CAP-[0-9]' src/engine --include=*.ts --exclude=*.test.ts` returning nothing (test-helpers.ts and win-seed.ts included); `*.test.ts` files not rewritten.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/SPEC.md, CAP-2 and E4–E6 rows
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-2
- review — _bmad-output/specs/spec-epic-3-app-shell/SPEC.review-log.md, Pass 3

## Notes

- The fold keeps every check order and code; the existing fixture suite is the proof (build-notes CAP-2).
- The AD-7 domain changes are sanctioned by SPEC E4/E5 and recorded as a build-notes spine note; do not edit the spine in this ticket.
