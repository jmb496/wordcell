# Adversarial review: spine amendment 2026-09-30 (epic 2 reconciliation)

- Target: uncommitted diff of `ARCHITECTURE-SPINE.md` (AD-2 `accrue`, AD-6 Q-44, AD-7 `parseHistory`
  and safe-integer checks, AD-17 Seeding, Scaffold deltas, header amendment line).
- Lens: two units one level down that obey every AD to the letter yet build incompatibly; changed
  sentences checked against `src/engine/` and `fixtures/`.
- Verdict: **accept with fixes**. No decision changed; every changed sentence about the engine
  matches the code. One new sentence (AD-17 "Vitest only") creates a real conflict with AD-17's own
  test split for epic 3; the rest are wording gaps.

## Code conformance of the changed sentences

| Spine sentence | Code | Result |
| --- | --- | --- |
| AD-2 `accrue`: non-negative safe integer `elapsedMs`, else throw; sum leaving safe range throws; `0` and status ≠ playing return input reference | `commands.ts:521-534` (`r76-elapsed-ms`, `r76-active-ms-overflow`; `0` checked before replay, status after) | Matches. Clock `take()` floors (AD-9 line 374), so the shell never passes a fraction. |
| AD-6 `statistics`: best and average over won + gaveUp ≥ 0, absent when none qualifies (Q-44) | `history.ts:98-119` (`scored` filter, optional keys omitted) | Matches spec Q-44 and R-84 (spec line 354, 474). Longest word over all records, ties to earliest (strict `>`): matches. |
| AD-7 `parseHistory` returns `{ ok: true, history }` or `{ ok: false, reason }` | `serialize.ts:20-27, 341-353`; `history: ScoreHistory` = `{ version, records }` | Matches, but the spine does not name the payload type (F3). |
| AD-7 record `finalScore`, `activeMs` safe integers, `activeMs` ≥ 0 | `checkRecord` `serialize.ts:306-331` | Matches. `letterCount` is also checked as a safe integer; spine still says "positive integer" (F5). |
| AD-7 Session `activeMs` non-negative safe integer | `replay.ts` `checkSession` / `session-invalid-ad7-active-ms.json` | Matches. |
| AD-17 invalid fixtures "one per AD-7 check (Vitest only)" | 62 `*-invalid-*` fixtures; only `src/engine/serialize.test.ts` imports them; `grep` of `e2e/`, `src/shell`, `src/ui`, `src/main.ts` finds no fixture use (valid or invalid) | True today, but see F1 and F2. |
| Scaffold deltas: done in 2.2/2.7, `PENALTY_PER_LETTER` in `types.ts`, language data in `lang/en.ts` | `types.ts:23`, `scoring.ts:24-26`, `src/engine/lang/` | Matches; no `STUCK_PENALTY_PER_CARD` remains in `src/`. |

## Findings

### F1 (major) — "Vitest only" contradicts AD-17's own split for §2 rejection; two e2e units diverge

AD-17 Split sends "§2 storage and version rejection" to Playwright on `android`. Those tests must
seed a rejecting `wordcell:session` / `wordcell:history` through `seedStorage` (AD-17 Seeding;
AGENTS.md "shared fixtures in root `fixtures/*.json`, seeded only through `seedStorage`"). The new
sentence makes every `session-invalid-*` / `history-invalid-*` file Vitest only, and there is no
valid-shape "rejecting" fixture for `version-unknown` at all (only `null` and `[]` cover
`version-unreadable`). Construction: epic 3 unit A (restore-rejection spec) inlines a
`'{"version":99}'` string in the spec; unit B (history-unreadable spec) adds
`fixtures/history-version-unknown.json`, a fixture that is neither "valid" nor a `*-invalid-*`
"one per AD-7 check" file. Both obey the letter; the fixture set loses its single convention, and
the Vitest-only files that already cover every reason cannot be reused.

Fix: replace the sentence with
"`fixtures/*.json` (repo root) are serialised Sessions and histories shared by Vitest repro cases
and Playwright: valid ones, plus the rejecting `session-invalid-*` and `history-invalid-*` files,
one per parser check (AD-7), which Playwright may seed for the §2 rejection flows; a rejection
reason with no such file (e.g. `version-unknown`) gets one named `<key>-invalid-version-unknown.json`."

### F2 (minor) — "one per AD-7 check" does not describe the fixture set

AD-7's written checks for history are record checks only; the code and fixtures also have container
checks (`history-invalid-container-field-set`, `-records-not-array`) and structural ones
(`-record-not-object`, `-longest-word-not-object`). The Session set also covers schema, domain, enum
and replay (R-13, R-31, R-33, R-35, R-36, R-40, R-50, §2) failures, which AD-7 names only as
"schema or any replay violation". A ticket author counting "AD-7 checks" to verify fixture coverage
gets a different number from the code author.

Fix: in AD-7, after "Each record is checked", add "after the container check (exactly
`{ version, records }`, `records` an array), each failure → `contents-unreadable`"; and in AD-17
say "one per parser check (the `CAP-9` / `checkSession` codes in `errors.ts`)".

### F3 (minor) — `parseHistory`'s success payload is unnamed; three history shapes coexist

Now documented: `parseHistory` → `{ ok: true, history }`; AD-6 store state →
`{ status: 'ok'; records }`; AD-17 `loaded().history` → `{ version, records }`; Reset writes
`{ version: HISTORY_VERSION, records: [] }`; `serializeHistory` has no signature in AD-2. Unit A
(store) keeps `result.history` and later calls `serializeHistory(records)`; unit B (test hook)
reads `scoreHistory.records` and rebuilds a container. The type checker catches A only if
`ScoreHistory` is known to be the parameter. Also the spine's shorthand `{ ok: true, history }`
invites `const { history } = result`, which the AGENTS.md Known pitfall (AD-1 `history` scan)
forbids.

Fix: in AD-2's surface list write "`serializeHistory(scoreHistory: ScoreHistory)`,
`parseHistory(text)` (`ScoreHistory` = `{ version, records }`)", and in AD-7 write
"`parseHistory` returns `{ ok: true, history: ScoreHistory }` (read as `result.history`, never
destructured; AGENTS.md Known pitfalls) or `{ ok: false, reason }`".

### F4 (minor) — frontmatter `binds` is stale after the Q-44 bind

AD-6 now binds Q-44 and AD-7 already relies on Q-36…Q-43, but the frontmatter still says
`Q-01…Q-35`. A reviewer checking coverage by the frontmatter treats Q-44 as out of the spine's
scope.

Fix: `binds: ['spec R-01…R-85, §2, Q-01…Q-44', …]`.

### F5 (nit) — `letterCount` wording lags the safe-integer change

The amendment switched `finalScore` / `activeMs` to "safe integers" but left "a positive integer
`letterCount`"; `checkRecord` requires a positive safe integer.

Fix: "a positive safe integer `letterCount`".

## Neighbour note (outside the spine, not a spine fix)

AGENTS.md Known pitfalls still says `STUCK_PENALTY_PER_CARD` "is scaffold … epic 2 replaces it";
the Scaffold delta now records it done and no such constant exists in `src/`. The line is in the
managed block, so refresh it through `bmad-project-context` alongside this amendment.

## No clash found

- `accrue` vs AD-9 clock: `take()` floors, so no fractional `elapsedMs` reaches the engine; the
  overflow throw is an AD-15 bug path, consistent with rule 6.
- `statistics` single owner: engine computes, `history.svelte.ts` derives; no UI filtering of
  negative given-up records is licensed.
- Q-44 does not touch the record shape, so `HISTORY_VERSION` correctly does not bump (AD-7).
