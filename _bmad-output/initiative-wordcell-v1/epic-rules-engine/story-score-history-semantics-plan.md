---
title: 'Score history semantics'
type: 'feature'
ticket: '9'
created: '2026-09-29'
status: done
baseline_revision: '6f03e959d536b8834071c5aa6f9413896311b780'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-score-history-semantics.md'
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The engine has no score-history semantics: nothing builds a `GameRecord` from a finished Session, decides append/remove on a finish or un-finish, says whether this game is recorded, or computes the six v1 statistics (AD-6, R-84), so the shell (epic 3) would have to invent them.

**Approach:** Add pure `src/engine/history.ts` (`HISTORY_VERSION`, `GameRecord`, `Statistics`, `gameRecord`, `reconcileHistory`, `isRecorded`, `statistics`) reusing replay.ts, scoring.ts and view.ts's internal `longestWord`; export them from index.ts; test exhaustively in `history.test.ts`. The ticket file (context) is the contract, including every test in its Acceptance Criteria; this plan fixes its open choices and resolves the review-log `## Result` minors.

## Boundaries & Constraints

**Always:**
- `gameRecord(session, lang)`: one `replayWords(dealtStart(session.seed), session, lang)` pass (not a call to `view`); `null` iff `status(session, position) === 'playing'`; otherwise `{ version: HISTORY_VERSION, seed, outcome, finalScore: finalScore(position, outcome === 'gaveUp', lang), longestWord?, activeMs: session.activeMs }` built in that key order, `longestWord` key only when `longestWord(words)` is defined. Replay errors propagate (rule 6).
- `reconcileHistory(records, before, after, lang)`: b = status(before), a = status(after) via `gameRecord(x) !== null`. b playing ∧ a not → `[...records, gameRecord(after)]`; b not ∧ a playing ∧ last record matches `gameRecord(before)` on `seed`, `outcome`, `activeMs` → `records.slice(0, -1)`; otherwise `records` (same reference). Never compares `finalScore`/`longestWord` (Q-43); looks only at the last record.
- `isRecorded(records, session, lang)`: `gameRecord(session)` non-null and last record matches it on the same three fields.
- `statistics(records)` takes only records: `gamesPlayed`, `gamesWon`, `gamesGivenUp` always; `bestScore`, `averageScore` (`Math.round(sum / n) + 0`), `longestWord` (strictly greater `letterCount` replaces, so ties keep the lowest index) only when defined — omitted keys, never `undefined`/`null`/0.
- Types readonly (AD-2): `GameRecord`, `Statistics`, nested `longestWord` typed as view.ts `LongestWord`; `records: readonly GameRecord[]`; no argument mutated.
- Variables/params named `records`, never `history` (Known pitfalls; AD-1 scan covers engine tests).

**Never:** touch replay.ts, scoring.ts, view.ts logic, deal, `SESSION_VERSION`; add serialise/parse (entry 11); add shell code; export `longestWord`/`replayWords`; dedupe or guard against repeated calls in the engine.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Finish | before playing, after won/gaveUp | new array, record appended, earlier records unchanged | none |
| Un-finish, match | before finished, after playing, last matches | new array without last | none |
| Un-finish, mismatch/empty | only seed/outcome/activeMs differs, earlier-only match, empty | same reference | none |
| No transition | playing→playing; same finished Session as before and after | same reference | none |
| Empty statistics | `[]` | `{ gamesPlayed: 0, gamesWon: 0, gamesGivenUp: 0 }` (toStrictEqual) | none |
| Rounding | 5,10→8; −5,−10→−7; −7,−8,−8→−8; 1,−2→0 (toBe(0)) | `Math.round(sum/n) + 0` | none |
| Invalid Session | replay-invalid | `EngineError` from replay propagates | fail fast |

</intent-contract>

## Code Map

- `src/engine/replay.ts` -- `replayWords(start, session, lang)` → `{ position, words }` (committed prefix only); `dealtStart(seed)`; `status(session, position)`; `Status`. Reuse, do not edit.
- `src/engine/scoring.ts` -- `finalScore(position, gaveUp, lang)` (unclamped, R-81). Reuse.
- `src/engine/view.ts` -- internal `longestWord(words)` (ties earliest, returns a fresh `{ spelling, letterCount }` or `undefined`), `LongestWord` type. Reuse, do not edit.
- `src/engine/win-seed.ts` -- `winSeed(seed)`: won Session, cursor {8, idle}, activeMs 0.
- `src/engine/commands.ts` -- public `apply(session, command, ctx)` (`.session`), `accrue(session, ms, lang)` (no-op once finished).
- `src/engine/view.test.ts` lines 14–120 -- `deepFreeze`, `play`, `DICT`, `UNDO`/`REDO`/`GIVE_UP` helper patterns to copy locally (tests never import another test file).
- `src/engine/index.ts`, `src/engine/index.test.ts` -- runtime export list test `AD-2 index exports … only at runtime` (sorted keys).
- `_bmad-output/initiative-wordcell-v1/epic-rules-engine/tickets.toml` -- entry 11 description holds "HISTORY_VERSION = 1, ".
- Seeds (verified with `dealIds`): seed 1 has QU in column 3 (7 cards, 8 letters → longest "l…qu…" word of winSeed(1) is column 3's, spelled with "qu"); seed 2 has QU in column 8 (columns 1–4 each 7 letters, column 8 6 cards = 7 letters → tie, column 1's word expected).

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/history.ts` -- create per Boundaries; JSDoc citing AD-6/R-84/Q-43/A-E3 like view.ts.
- [x] `src/engine/index.ts` -- export `gameRecord`, `reconcileHistory`, `isRecorded`, `statistics`, `HISTORY_VERSION`, `type GameRecord`, `type Statistics`.
- [x] `src/engine/index.test.ts` -- extend the sorted runtime list and the test name with `gameRecord`, `HISTORY_VERSION`, `isRecorded`, `reconcileHistory`, `statistics`.
- [x] `src/engine/history.test.ts` -- every ticket AC test, with the resolutions below; local `deepFreeze`; all inputs deep-frozen.
- [x] `tickets.toml` -- entry 11 description: drop "HISTORY_VERSION = 1, " (ticket Notes hand-off).

**Acceptance Criteria (ticket ACs apply verbatim, amended by the review-log minors):**
- Given the test names, then: no-mutation/new-array tests start `AD-2`; the key-order test `AD-6`; append-on-finish `R-84`; match tests `R-84 … (Q-43)`; same-seed `R-74`; activeMs `R-76` (won/gaveUp × 0/non-zero); every other history.test.ts test `R-84`; export test `AD-2` in index.test.ts.
- Given seeds 1 and 2 hard-coded, when the qu and tie tests run, then each first asserts its QU column with `dealIds()` (column 3 for seed 1, column 8 for seed 2).
- Given a gaveUp at the start of seed 1 (no word), then its record has a negative `finalScore` equal to `view(session).finalScore` and no `longestWord` key.
- Given the pending-draft case, then after the longer 7-card-column word is confirmed it is undone three times back to Idle (pending draft, reached committed) before giveUp.
- Given finished→finished, then the same finished Session is passed as `before` and `after`.
- Given R-74, then the two same-seed records are two gaveUp finishes of seed 1 with activeMs 0 differing only in `finalScore` (give up at start; give up after one committed word); un-finishing the second (undo) removes only the last record and the remaining record `toStrictEqual`s the first.
- Given the empty history, then `statistics([])` is asserted with `toStrictEqual`; the 1 and −2 case with `toBe(0)`.
- Erratum 2026-09-29: in "Given R-74" above, "differing only in `finalScore`" is inexact: the second record (give up after the column-5 word) also carries a `longestWord`, so the two records differ in `finalScore` and `longestWord` (Implementation Notes; 2-9 review-loop Result; ticket 2.12 S26).

## Implementation Notes

- R-74: the second gaveUp record (give up after the column-5 word) necessarily also carries a `longestWord`, so the two records differ in `finalScore` and `longestWord`, not `finalScore` alone; the test asserts they agree on `seed`/`outcome`/`activeMs` and differ in `finalScore`.
- `statistics` computes `bestScore` with `reduce` (no spread into `Math.max`, so no argument-count limit); counts filter by outcome.
- Mutation spot checks (drop `+ 0`, `>=` tie, ignore `activeMs`, `Math.ceil`, match any record instead of the last) each fail at least one test.

## Plan Change Log

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 16 findings — high 0, medium 0, low 10, false 6, maybe-false 0
- findings:
  - `[false]` `[reject]` Plan has no review/verification record — the review runs in this step; this log and `## Auto Run Result` record it; `test:all` ran green.
  - `[low]` `[reject]` Plan R-74 AC says "differ only in finalScore" while Implementation Notes say longestWord differs too — fix edits this build's plan; the Implementation Notes already record the deviation.
  - `[low]` `[patch]` R-74 test's `toMatchObject(first)` passes only because `first` lacks longestWord — replaced by an explicit toStrictEqual of version/seed/outcome/activeMs.
  - `[low]` `[patch]` statistics literals 'quiz'/'quid' with letterCount 5 are impossible (QU = 2) — 'quiz' → 4; tie pair → 'quids'/'bread' (5 each).
  - `[low]` `[patch]` Nothing pins that the engine does not deduplicate — added `R-84 a finish appends even when the last record already equals gameRecord(after) (no dedupe)`.
  - `[low]` `[reject]` Error propagation tested only through gameRecord — reconcileHistory/isRecorded call gameRecord with no catch; extra tests exceed a direct correction for an unlikely regression.
  - `[low]` `[patch]` Longest-word statistics test names lack A-E3 — "(A-E3)" added to the three longest-word tests.
  - `[low]` `[patch]` `statistics` result type repeats Statistics by hand — now `{ -readonly [K in keyof Statistics]: Statistics[K] }` as view.ts does.
  - `[false]` `[reject]` `GameRecord.version` should be `typeof HISTORY_VERSION` — AD-6 types it as the stored number like `Session.version: number`; entry 11's parse rejects other versions (AD-7), no harm named.
  - `[low]` `[reject]` reconcileHistory replays twice per call — AD-6 fixes the Session-based signature; engine suite and budget unaffected; epic 3 may measure.
  - `[false]` `[reject]` Edge: unrelated before/after (New game) unguarded — AD-4 never calls it for New game/Replay; even then the seed match prevents removal and playing→playing returns the same reference; a guard would be defensive code (rule 6).
  - `[false]` `[reject]` Edge: both finished but differing records — no single apply produces it (finished Sessions only accept undo); unreachable.
  - `[low]` `[patch]` Edge: R-74 toMatchObject hides extra key — same root cause as the R-74 row above; same patch.
  - `[low]` `[reject]` Intent: R-74 uses two gaveUp finishes, not gaveUp then won as the ticket text says — deliberate per the review-log minor (discriminating "remaining equals the first"); the invocation asked to resolve those minors in the plan.
  - `[false]` `[reject]` Intent: no-mutation tests named AD-2 not AD-6 — review-log minor applied by design (AD-2 owns readonly/no-mutation).
  - `[false]` `[reject]` Intent: tests import `./history` rather than `index.ts` — same pattern as every engine ticket; index.test.ts pins the export surface (AD-2).

## Design Notes

- Review-log `## Result` minors: all ten applied above (names, tickets.toml touch, finished→finished, R-74 discriminating records, own replayWords pass, toStrictEqual/toBe(0), hard-coded seeds, negative gaveUp record, "undo three times"); the shell hand-off minor is recorded here: the shell calls `reconcileHistory` exactly once per applied command (never for New game/Replay, AD-4); the engine does not deduplicate — at most once holds because a second finish only follows an un-finish.
- `gameRecord` agreeing with `view` follows from the shared `replayWords`/`finalScore`/`longestWord`; tests assert equality with `view(session)` rather than hand numbers where the ticket says so.

## Verification

**Commands:**
- `npx vitest run src/engine` -- expected: all pass.
- `npm run test:all` -- expected: green.

## Auto Run Result

- Summary: pure `src/engine/history.ts` adds `HISTORY_VERSION = 1`, readonly `GameRecord`/`Statistics`, `gameRecord` (one `replayWords` pass, `finalScore`, view's `longestWord`, `activeMs` copied), `reconcileHistory` (append on finish, remove last on a seed/outcome/activeMs match, else same reference), `isRecorded`, `statistics` (A-E3 `Math.round(sum / n) + 0`, ties to earliest); exported from `index.ts`.
- Files: `src/engine/history.ts` (new module); `src/engine/history.test.ts` (48 tests, R-84/R-76/R-74/AD-2/AD-6 names); `src/engine/index.ts` (exports); `src/engine/index.test.ts` (AD-2 export list); `tickets.toml` (entry 11 description drops "HISTORY_VERSION = 1", ticket Notes hand-off).
- Review-log `## Result` minors: all resolved in the plan (Design Notes, ACs); the shell hand-off minor recorded in Design Notes.
- Review: 16 findings; 6 low patched (5 entries, applied in the main session because the implementer could not be awaited unattended); 0 deferred; 10 rejected with reasons in the triage log.
- Follow-up review recommended: false (patched: high 0, medium 0, low 5 entries).
- Verification: `npx vitest run src/engine` 690 passed; `npm run test:all` exit 0 (1100 unit tests, build with size budget, dist-smoke 13, e2e 34, pwa 12).
- Residual risks: at-most-once relies on the epic-3 shell calling `reconcileHistory` exactly once per applied command (Design Notes); each call replays both Sessions.
