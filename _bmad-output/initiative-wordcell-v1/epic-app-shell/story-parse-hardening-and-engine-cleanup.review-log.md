# Review log — story-parse-hardening-and-engine-cleanup.md (ticket 3.2)

State: pass 4: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 237 words (copy at story-parse-hardening-and-engine-cleanup.passes/pass0.md). Pre-loop HEAD 4496b3f.
Note: the pulled ticket lacked tickets.toml entry 2's interface, tests and owns fields; they are passed as intent and added to the Description in pass 1.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case, adversarial, ref alignment  |  Findings: major 7, minor 13, decision-needed 0  |  Dropped in triage: 1 (duplicates merged: 45 raw → 20)
Words (docs): 620 (2.62 x pass 0; budget 1500)  |  Snapshot: story-parse-hardening-and-engine-cleanup.passes/pass1.md
Fixer: all 19 applied; grep run (23 hits today, expected pre-build).
### Applied
- [major] Description — add Interface/Tests/Owns lines from tickets.toml entry 2 (caller instruction) → fixer 1
- [major] Description E4 — headroom check is parseSession-only, after replay returns (checkSession/accrue untouched; a check in checkSession would break commands.test.ts:1739-1751 accrue at MAX_SAFE_INTEGER and make accrued Sessions unreplayable) → fixer 2
- [major] Verify 2^52 — playing base (session-idle-fresh), exact sum 2^52 + 86 400 000, view/apply on the result do not throw → fixer 3
- [major] Description E5 — won-negative must run for every record (serialize.ts:322 early return); name the three codes and their order; fixtures isolate one check each; case for a won record without longestWord → fixer 4
- [major] Verify "unchanged" — contradicts code-list length tests; SPEC wording with the list of allowed test edits → fixer 5
- [major] Verify grep — not mechanical ("cross-epic" undeterminable, sources vs tests) → exact grep over non-test engine sources, no CAP of any epic → fixer 6
- [major] Verify — no check that the B9 fold happened (SPEC "each exist once") → fixer 7
- [minor] E5 doc comments falsified (serialize.ts:303, errors.ts order) + v1-English-only caveat (SPEC E5) → fixer 8
- [minor] accept-side boundaries (won 0, letterCount 3, quiz 4, gaveUp negative) → fixer 9
- [minor] E4 fixture name ad7 form overrides build-notes assumption; content → fixer 10
- [minor] fold shape/home module; callers keep own codes; required list derived → fixer 11
- [minor] citation replacement default where no id applies → fixer 12
- [minor] Notes open question → constraint → fixer 13
- [minor] "Applies B8 and B9" overclaims (E8 is CAP-3) → fixer 14
- [minor] history.active-ms keeps safe-integer domain (SPEC E4) → fixer 15
- [minor] references: SPEC.md CAP-2 + E4–E6 rows, SPEC.review-log.md Pass 3 → fixer 16
- [minor] E5 reason contents-unreadable named → fixer 17
- [minor] AD-7 deviation is sanctioned by SPEC E4/E5 build-notes spine note; spine not edited here → fixer 18
- [minor] R-84 copy test: not.toBe + toStrictEqual; existing statistics tests untouched → fixer 19
### Default applied (technical)
- E4 — parse-only check in parseSession after replay, code `ad7-active-ms-headroom`, reason replay-failed; new test Row stage for it
- E5 — codes `history.longest-word-letter-count-short`, `history.longest-word-letter-count-mismatch`, `history.won-final-score`, in that order after `history.longest-word-letter-count`; early return restructured into an if-block
- Grep — `grep -rnE 'entry [0-9]|CAP-[0-9]' src/engine --include=*.ts --exclude=*.test.ts` empty; test files not rewritten
- Fold module — one engine-internal module (e.g. `src/engine/fields.ts`), boolean predicates, callers keep codes
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- ref-alignment "put headroom in checkSession" — contradicts SPEC E4 (parseSession) and existing accrue tests

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 4, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: 24 raw → 12)
Words (docs): 875 (3.69 x pass 0; budget 1500)  |  Snapshot: story-parse-hardening-and-engine-cleanup.passes/pass2.md
Fixer: all 12 applied; both greps run (6 call-site hits and 23 citation hits today, expected pre-build).
### Applied
- [major] E4 / Verify — headroom throw inside parseSession's try is swallowed into replay-failed and the rejection harness sends non-schema rows to replay(); code untestable → internal serialize.ts helper (exported for tests like checkSchema, not from index.ts), harness 'parse' branch, PARSE_CODES list → fixer 1
- [major] E5 / Verify — new check order stated but untested → extend the '§2 checkRecord runs in order' pair table → fixer 2
- [major] Fold / Verify — "one definition" passes with inline copies left; call sites unnamed → list call sites, grep AC for inline duplicates → fixer 3
- [major] Verify bullets 5 vs 7 — allowed test edits omit harness branch/counts/order rows; "*.test.ts not rewritten" reads as forbidding them → scope bullet 7 to citations, extend exceptions → fixer 4
- [minor] Fold field lists — required/optional marking, cursor list folded → fixer 5
- [minor] Fold checker contract — returns offending key so messages keep field names → fixer 6
- [minor] Verify 2^52 — name the apply command (giveUp) → fixer 7
- [minor] Verify — view/apply accept the 2^52+1 value (bound is parse-only) → fixer 8
- [minor] Fold letter-count sum — keep rules.ts wordLetterCount, scoring.ts imports it → fixer 9
- [minor] Citations — E ids are epic-local; cite R/Q/§/AD only → fixer 10
- [minor] E5 fixtures — base history-three-records.json record 0 → fixer 11
- [minor] E4 — one clause on why "after ad7-active-ms" means post-replay → fixer 12
### Default applied (technical)
- E4 helper `checkActiveMsHeadroom(session)` in serialize.ts, harness stage 'parse', PARSE_CODES
- Fold: entries carry required/optional; checker returns first missing/unknown key; wordLetterCount stays in rules.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 1, minor 10, decision-needed 0  |  Dropped in triage: 1 (duplicates merged: 23 raw → 11)
Words (docs): 981 (4.14 x pass 0; budget 1500)  |  Snapshot: story-parse-hardening-and-engine-cleanup.passes/pass3.md
Fixer: all 10 applied; no command changed.
### Applied
- [major] Fold checker contract — "first missing or unknown key" merges schema's missing-only requireFields and replay's unknown-only unknownField; schema would throw schema.required-* on the ad7-unknown-* fixtures (harness asserts checkSchema passes them) → one checker with a mode ('missing' | 'unknown' | 'exact') → fixer 1
- [minor] Verify counts are today's values → HISTORY_CODES 12→15, coded 13→16, REPLAY_CODES 23, PARSE_CODES 1 → fixer 2
- [minor] Verify headroom bullet — name apply giveUp (undo throws r70 on idle-fresh); reclassified from major (obvious from the bullet above) → fixer 3
- [minor] fields.ts is fixed (not "default") and holds lists, checker and predicates, matching the grep exclusion → fixer 4
- [minor] history lists (CONTAINER/RECORD/LONGEST_WORD) stay in serialize.ts in the same marked-entry form → fixer 5
- [minor] short check uses MIN_WORD_LENGTH (R-36) not a literal 3 → fixer 6
- [minor] predicates typed (value: unknown) => value is number → fixer 7
- [minor] "on the result" → on the accrued Session → fixer 8
- [minor] SESSION_FIELDS marks version optional (required list unchanged, still a known key) → fixer 9
- [minor] serialize.ts local isSafeInteger type guard may stay (not a domain check) → fixer 10
### Default applied (technical)
- Checker `fieldSetViolation(object, fields, mode)` in src/engine/fields.ts; schema 'missing', checkSession 'unknown', history 'exact'
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial stretch: extend citation grep to E ids — would also catch legitimate non-citation tokens; the Citations bullet already bars E ids (left to code review)

## Pass 4 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 14, decision-needed 0  |  Dropped in triage: 1
Words (docs): 981 (4.14 x pass 0; budget 1500)  |  Snapshot: story-parse-hardening-and-engine-cleanup.passes/pass3.md (no fix pass)
### Open (not fixed; stopping rule)
- [major] Description E4 / Verify accept boundaries — SPEC E4 "History records keep the safe-integer domain" has no test; a builder reusing the 2^52 bound in checkRecord would pass every listed check → add a §2 parseHistory accept row with record activeMs 4503599627370497 (2^52 + 1) (optionally MAX_SAFE_INTEGER)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: widened test-edit exceptions need a SPEC/build-notes note — SPEC's "unchanged" wording is satisfied by the ticket's explicit list; no contract defect

## Result — converged after 4 passes
open major: history activeMs above 2^52 accept test (SPEC E4 "History records keep the safe-integer domain") — add a §2 parseHistory accept row with activeMs 4503599627370497.
Majors per pass: 7, 4, 1, 1. Words 237 → 981 (budget 1500). Technical defaults applied: 12.

### Unapplied minors (for the build's plan)
- Verify 2^52 bullet: bind names (`parsed = parseSession(...).session`, `accrued = accrue(parsed, 86_400_000, EN)`) instead of `result`.
- Verify one-definition bullet: add a mechanical grep (`SESSION_REQUIRED|CURSOR_REQUIRED|MOVE_REQUIRED|requireFields|unknownField|hasFieldSet|const letters =` returns nothing in engine sources); "field lists" means the membership lists named in Fold — serializer key orders (`orderedMove`, `serializeSession`, `orderedRecord`) and `MOVE_TYPES`/`MOVE_DOMAINS` stay.
- Citations: new engine comments cite AD-7, §2, R-36/R-85 only, never E4–E6 (grep does not catch E ids); D-ids and A-E ids stay (only `entry N` and `CAP-n` are removed).
- errors.ts: list the headroom code in its own "parseSession only, after replay returns" line, not under "AD-7 post-replay" (which view/apply can throw).
- Optional case: a Session failing a replay check and the headroom bound reports the replay code (replay-failed).
- Order pair `history.active-ms` before `history.won-final-score` on a record without longestWord.
- Note that the accrued 2^52 + 86 400 000 Session is expected to fail parseSession on next load (E4 headroom, sanctioned).
- `fieldSetViolation` parameter typed `object: object` (Session interface has no index signature).
- History field-set messages stay unchanged (they carry no field name today).
- New history fixture names omit the `longest-word-` prefix of their codes; keep the tickets.toml names and map them in the rows.
