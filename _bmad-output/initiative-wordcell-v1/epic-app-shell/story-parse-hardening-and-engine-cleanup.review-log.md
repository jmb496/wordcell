# Review log — story-parse-hardening-and-engine-cleanup.md (ticket 3.2)

State: pass 1: done

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
