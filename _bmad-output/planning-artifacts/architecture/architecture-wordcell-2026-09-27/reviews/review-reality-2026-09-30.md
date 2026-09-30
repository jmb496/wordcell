# Review: reality check of the 2026-09-30 spine amendment (epic 2 as-built)

- Lens: every changed sentence reality-checked against the project (engine code, fixtures, spec).
- Target: uncommitted diff of `ARCHITECTURE-SPINE.md` (amendment note, AD-2 `accrue`, AD-6 Binds and
  `statistics`, AD-7 `parseHistory` / record checks / `parseSession` `activeMs`, AD-17 Seeding,
  Scaffold deltas).
- No library or version is named in the changed passages, so no web check was needed.
- Verdict: **pass with minor fixes**. Every changed behavioural claim matches the code. One
  inconsistency the amendment introduces (citing Q-44 while the spine is still pinned to spec v0.7)
  and two wording gaps.

## Claim-by-claim verification

| # | Changed claim | Evidence | Result |
| --- | --- | --- | --- |
| 1 | AD-2: `accrue` throws for an `elapsedMs` that is not a non-negative safe integer, and for a sum outside the safe-integer range; `0` and status ≠ playing return the input reference | `src/engine/commands.ts:521-534` (`r76-elapsed-ms` at 522-523, `0` return at 524, non-playing return at 526, `r76-active-ms-overflow` at 528-532); codes listed `src/engine/errors.ts:34` | Matches |
| 2 | AD-6 Binds adds Q-44 | `docs/game-flow-spec.md:474` (Q-44 row), `:352-354` (R-84 text) | Matches |
| 3 | AD-6: best and average cover won records and gaveUp records scoring ≥ 0; absent when none qualifies | `src/engine/history.ts:104-109` (`outcome === 'won' \|\| finalScore >= 0`; keys set only when `scored.length > 0`); spec `:352-354`, `:474` | Matches (excluded records still counted in played/given up/longest word: `history.ts:100-102`, `110-117`) |
| 4 | AD-7: `parseHistory` returns `{ ok: true, history }` or `{ ok: false, reason }` | `src/engine/serialize.ts:20-27` (`ParseHistoryResult`), `history` is `ScoreHistory` `{ version, records }` (`src/engine/history.ts:21`) | Matches |
| 5 | AD-7: record `finalScore` and `activeMs` safe integers, `activeMs` ≥ 0 | `src/engine/serialize.ts:317-321` | Matches |
| 6 | AD-7: `parseSession` pre-replay `activeMs` a non-negative safe integer | `src/engine/replay.ts:66-69` | Matches |
| 7 | AD-17 Seeding: rejecting `session-invalid-*` and `history-invalid-*` fixtures, Vitest only | 62 `*-invalid-*` files in `fixtures/`, all 62 referenced from `src/**` tests; none referenced from `e2e/` | Matches (see F3 on "one per AD-7 check") |
| 8 | Scaffold deltas: done in epic 2 tickets 2.2 and 2.7; `PENALTY_PER_LETTER` in `types.ts`, language data in `lang/en.ts` | `src/engine/types.ts:23` `PENALTY_PER_LETTER = 10`; no `STUCK_PENALTY_PER_CARD` left in `src/`; commit `94d329c` (ticket 2.2) adds `lang/en.ts`, `lang/lang-data.ts`, shrinks `types.ts`; commit `efbf06f` (ticket 2.7) scoring and penalty; used at `src/engine/scoring.ts:24-26` | Matches |
| 9 | Amendment note: "no decision changed" | Q-44 is an owner answer in the spec (v0.9), not a spine decision; the AD-6 sentence records it | Holds |

## Findings

### F1 (medium) — Q-44 cited while the spine is pinned to spec v0.7

The amendment adds Q-44 (AD-6 Binds and rule text, amendment note), but the frontmatter still
says `binds: ['spec R-01…R-85, §2, Q-01…Q-35', …]` (spine line 11) and `sources:
docs/game-flow-spec.md (v0.7)` (line 14), and the preamble says ids "are
`docs/game-flow-spec.md` v0.7" (line 26). Q-44 exists only from spec v0.9
(`docs/game-flow-spec.md:10-11`). (Q-36…Q-43, v0.8, were already cited without bumping these; the
amendment widens the gap.)

Fix: frontmatter `binds: ['spec R-01…R-85, §2, Q-01…Q-44', …]`, `sources: docs/game-flow-spec.md
(v0.9)`, and preamble "…are `docs/game-flow-spec.md` v0.9."

### F2 (low) — `letterCount` left as "positive integer" in the sentence that now says "safe integers"

AD-7 now says `finalScore` and `activeMs` are safe integers but, in the same sentence, a
"positive integer `letterCount`". The code checks a positive **safe** integer
(`src/engine/serialize.ts:328-330`, doc comment at `:302`).

Fix: "…with a lowercase `a–z` spelling and a positive safe integer `letterCount`; a fixture per
check."

### F3 (low) — "one per AD-7 check" understates the rejecting fixture set

AD-17 says the rejecting fixtures are "one per AD-7 check". Only some are AD-7 checks
(`session-invalid-ad7-*`, the `seed-uint32` and `s2-*` ones, and all `history-invalid-*`); the
rest are §2 schema-stage codes (`session-invalid-type-*`, `-enum-*`, `-required-*`, `-*-domain`,
build-notes CAP-9 in `src/engine/serialize.ts:151-158`) and replay rule violations
(`session-invalid-r13-*`, `-r31-*`, `-r33-*`, `-r35-*`, `-r36-*`, `-r40-*`, `-r50-*`). The count is
right; the description is narrower than the directory.

Fix: "…plus the rejecting `session-invalid-*` and `history-invalid-*` files, one per AD-7 check,
schema-stage code and replay rule violation (Vitest only)."

### F4 (note, outside the spine) — AGENTS.md pitfall still describes `STUCK_PENALTY_PER_CARD`

The Scaffold delta now records that `STUCK_PENALTY_PER_CARD` was replaced, but AGENTS.md
"Known pitfalls" still tells agents it is scaffold in `src/engine/types.ts` (the constant no
longer exists). Not part of this diff; route to `bmad-project-context` refresh.

## Not flagged

- AD-2's "while status ≠ playing, and for `0`" ordering: the code validates `elapsedMs` before the
  `0` / status short-circuits, consistent with the sentence (a negative value throws in any status).
- Longest-word tie to the earliest record: strict `>` at `src/engine/history.ts:114` keeps the
  earliest.
