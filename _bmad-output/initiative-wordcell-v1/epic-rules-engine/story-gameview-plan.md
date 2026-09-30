---
title: 'GameView'
type: 'feature'
ticket: '8'
created: '2026-09-29'
status: done
baseline_revision: 'db8edabd659a1163d65a8e277e5ee417b7f433dd'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-gameview.md'
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The engine has no `view`: nothing derives AD-3's `GameView` (faces, columns, cells, per-column/per-cell flags, `kIfTapped`, draft and Place data with the D6 delta, scores, end values, longest word, word count, pending-draft word, `inProgress`, `can*` flags), so the UI would have to re-derive game state.

**Approach:** Add `src/engine/view.ts` (`view`, internal `viewFrom` D2 counterpart) building every field from one `replayWords` pass; extract boolean predicates from the throwing checks into `rules.ts` (move rules) and `commands.ts` (undo/redo/give-up availability) so flags and `apply` share them; `replayWords`/`longestWord` internal for CAP-8. The ticket file (context) is the contract, including every test named in its Acceptance Criteria; this plan fixes its open choices and resolves the review-log `## Result` minors.

## Boundaries & Constraints

**Always:**
- `view(session, lang)` = `viewFrom(dealtStart(session.seed), session, lang)`; `viewFrom` calls `replayWords(start, session, lang)` exactly once; never calls `apply`/`applyFrom`, never catches.
- `replayWords` runs every check `replayFrom` runs, same order and codes; `replayFrom` returns `replayWords(…).position` (one loop). `words` = one `{ spelling, letterCount }` per committed-prefix move (index < `cursor.index`), spelling = `rules.word(positionBeforeMove, move, lang).spelling`.
- `longestWord(words)`: max `letterCount`, ties → earliest; `undefined` for none.
- Check functions and reducers become thin wrappers over the predicates: same code, same message, same check order. `commands.test.ts` passes unchanged.
- `GameView` is plain data; absent optional fields are omitted keys (never `key: undefined`); `kIfTapped` a `Map`.
- Top-level types (review-log minor): `status: Status` (replay.ts), `phase: Phase` (session.ts), `band?: number` (0–5, D3), `longestWord?: { spelling; letterCount }`, `pendingDraftWord?: string` (lowercase). Nested shapes exactly as the ticket's Shape bullet.
- Flag formulas (all false unless status = playing, except `canUndo`): `canPickUp(c)`/`canDropOn(c)` Idle and the drop's source-count predicate holds for some candidate; `canTapForK(c)` Composing, c = destination, some card's tap result ≠ k; `canDecK`/`canIncK` Composing, k ∓ 1 passes the R-31 range predicate on a non-empty remainder; `canFlip` Composing and k ≥ 1; `canAddFreeLetter(cell)` Composing, cell not in `freeLetters`, cell non-empty; `canSetTarget(cell)` Place, cell ≤ L, cell ≠ target; `isLegalTarget(cell)` Place and cell ≤ L; `used(cell)` phase ≠ Idle and cell in `freeLetters`; `canConfirm` Place; `canGiveUp` Idle; `canValidate` Composing and L ≥ `MIN_WORD_LENGTH`; `canUndo`/`canRedo` from the commands.ts availability predicates (undo: gaveUp, or not Idle-at-index-0; redo: playing and R-71 data present).
- `kIfTapped` (Composing, destination column only): key per card of the remainder after R-21; value = the R-31 tap result (`null` when it equals k, i.e. k = 1 and the bottom card), computed by a `rules.ts` tap-mapping function the reducer also uses.
- D6 `scoreDelta` = L × target − Σ over `freeLetters` of (`letterCount(top card)` × cell).
- End values when status ≠ playing: `finalScore = scoring.finalScore(position, status === 'gaveUp', lang)`, `penalty`/`lettersLeft` = scoring's over the committed columns, `band = scoring.band(finalScore, lang)`; `displayScore` = `finalScore` then, else `liveScore`.
- `pendingDraftWord`: playing, Idle and `moves[cursor.index]` exists → `word(position, that move).spelling`.
- `inProgress` = playing and `moves.length > 0`.
- Test names per the ticket AC; every test input deep-frozen.

**Never:** export `viewFrom`, `replayWords`, `longestWord` or a predicate from `index.ts`; change any command's behaviour, check code or order; change `deal.ts`, `buildDeck`, `lang/`, `scoring.ts` behaviour, `src/ui/`, `src/shell/`, `main.ts`; add a Session field; import from another test file; `history.ts`/`gameRecord` (entry 9).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh | `createSession(1)` | Idle, no draft/place/pendingDraftWord/end values, `inProgress` false, wordCount 0, no longestWord, `canUndo` false | none |
| First drop | Composing after one drop | `inProgress` true (review-log minor) | none |
| n = 1 destination | self-drop leaving 1 card | `kIfTapped` {card → null}; canTapForK/canDecK/canIncK false; canFlip true | none |
| k = 0 | whole-column self-drop; drop onto empty column | canDecK/canIncK/canFlip/canTapForK false; `kIfTapped` empty Map | none |
| Place R-41 | used free letter, target = its cell, L < 10 | cells > L: `isLegalTarget`/`canSetTarget` false (review-log minor) | none |
| Legal targets | L = 3 (2-card QU word); L = 10 | `[3]`; `[3…10]` (review-log minor: L = 10) | none |
| Undo after give up | gaveUp at index > 0 → undo | `inProgress` true; fresh giveUp → undo: false (review-log minor) | none |
| Won | `winSeed(1)` | end values present, `penalty` 0, `displayScore` = `finalScore` | none |
| gaveUp | band(liveScore) ≠ band(finalScore) | band from finalScore | none |
| Invalid | `r31-destination-count` in draft; in a redo-tail move | — | EngineError `r31-destination-count` |

</intent-contract>

## Code Map

- `src/engine/rules.ts` -- extract predicates from `checkSourceCount` (source count in 1…len), `checkDestinationCount` (R-31 range over `destinationRemainder`), `checkFreeLetterEmpty` (cell non-empty), `checkLetterCount` (sum ≥ MIN), `checkTargetCell` (cell ≤ L); add a pure R-31 tap-mapping function `(remainder or position+move, card, k) → new k` used by `commands.ts` `tapDestinationCard` (now inline at `commands.ts` ~206–222). `word()` gives the R-30 word; `inDestination`, `hasFreeLetter`, `freeCards`, `sourceCards`, `destinationRemainder` reusable as is. `commitMove` is the R-60 effect.
- `src/engine/commands.ts` -- `undo` (~390) / `redo` (~412) / `giveUp` / `flip` logic: export internal availability predicates (e.g. `canUndoSession(session)`, `redoAvailable(session)`) and have the reducers throw `r70-nothing-to-undo` / `r71-no-redo-data` when false; `playing()`/`prelude()` keep the status/phase order.
- `src/engine/replay.ts` -- `replayFrom` (~116) becomes `replayWords(start, session, lang): { position; words }` + `replayFrom = replayWords(...).position`; `dealtStart`, `status`, `Status` reused.
- `src/engine/scoring.ts` -- `liveScore`, `lettersLeft`, `penalty`, `finalScore`, `band`; read-only.
- `src/engine/lang/lang-data.ts` -- `letterCount`, `spelling`; read-only.
- `src/engine/view.ts` (new) -- `GameView` and nested types, `viewFrom`, `view`, `longestWord`.
- `src/engine/index.ts` -- `export { view } from './view'` and `export type { GameView, … nested types, Status }` (type-only; review-log minor).
- `src/engine/index.test.ts` -- rename to `AD-2 index exports accrue, apply, createSession, deal, EN, letterCount, SESSION_VERSION and view only at runtime`, add `'view'`.
- `src/engine/view.test.ts` (new) -- copy the small helpers it needs from `commands.test.ts` 21–109 (`deepFreeze`, `expectEngineError`, `startOf`, `sessionOf`, `seam`-style `applyFrom` driver); import `winSeed` from `./win-seed`, scoring functions, `apply`/`applyFrom`, `dealIds`. Seed-1 column facts: `commands.test.ts` 112–280 (e.g. col 3 `L QU E J A T A`).
- `src/engine/replay.test.ts` -- add a `replayWords`/prefix-only test only if not covered via view; existing tests must pass unchanged.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/rules.ts`, `commands.ts`, `replay.ts` -- predicates, tap mapping, availability predicates, `replayWords`, thin throwing wrappers -- one source of truth for flags and `apply`.
- [x] `src/engine/view.ts` -- `view`, `viewFrom`, `longestWord`, types -- per Always.
- [x] `src/engine/index.ts`, `index.test.ts` -- exports and AD-2 test.
- [x] `src/engine/view.test.ts` -- every test in the ticket's Acceptance Criteria, named as it prescribes, plus the review-log resolutions below. Agreement tests: one per flag (AD-3), looping the ticket's "Flag agreement states"; states built through public `apply` with a validate set holding the chosen word, else the D2 seam with `applyFrom` (review-log minor). Existential candidates (review-log minor): `canDropOn(c)` over every (sourceColumn, sourceCount 1…len); `canPickUp(c)` over sourceCount 1 × every destination; `canTapForK` over every CardId 0–51. `canValidate` agreement: `validate` with a set holding the draft word where one exists, else an empty set (status/phase checks throw first) (review-log minor). Agreement = "`apply` neither throws nor returns the input reference" (use a local helper that catches `EngineError` in the test only).

**Review-log `## Result` minors:** inProgress "undo after give up at index > 0 true, fresh give up → undo false" applied; inProgress first-drop Composing true applied; kIfTapped loop over the destination column after R-21 applied; R-41 Place state pinned to L < 10 applied; legal targets L = 10 applied; test ids: legal-target and position tests stay AD-3 (not R-40/§2 coverage), longest-word, tie, wordCount and faces tests AD-3 applied; top-level types applied; canValidate empty set applied; existential candidates applied; type-only nested exports applied; hard-to-reach states applied. Not applied (ticket text edits; the ticket is read-only to the build, and the plan already states each once): D6 clause duplicated in Verify; splitting the Verify sentence.

**Sentence → test mapping:** R-12 → R-12 test (cells carry no pick-up flag); R-30 → R-30 draft-word tests (both sides, right-side QU "qu"); R-31 → R-31 bounds, k = 0 and kIfTapped tests; R-33 → R-33 canAddFreeLetter test; R-36 → R-36 too-short tests (QU passes at 2 cards/3 letters, fails at 2 letters); R-80 → liveScore; R-81 → displayScore/end values; R-83 → band and absent-longest-word tests; §2 → status and inProgress tests; CAP-3 → view-rejects tests (AD-3 naming unless an id applies). Exempt: R-39 inertness and R-82 (UI).

**Acceptance Criteria:**
- Given the change, when `npm run test:all` runs, then it exits 0, `commands.test.ts` and `replay.test.ts` pass without edits to their assertions, and nothing under `src/ui/`, `src/shell/`, `src/main.ts`, `deal.ts` or `lang/` changed.
- Given `view(s, EN)` for any listed state, when each `can*` flag is compared to its mapped command, then they agree in both directions.
- Given `npx vitest run src/engine`, when timed, then the engine suite stays within the AD-17 unit budget (whole unit suite < 5 s).

## Implementation Notes

- rules.ts predicates: `sourceCountAllowed`, `destinationCountAllowed(n, k)`, `tapDestinationCount(remainder, card, k)`, `cellHasTop`, `wordLetterCount` + `letterCountAllowed`, `targetCellAllowed`; each `check*` now throws when its predicate is false (codes, messages, order unchanged).
- commands.ts internal exports: `undoAvailable`, `redoAvailable` (undo/redo reducers throw `r70-nothing-to-undo` / `r71-no-redo-data` from them), `giveUpAvailable(session, status)`; the `giveUp` reducer keeps `prelude` so status and phase keep their separate codes.
- replay.ts: `replayWords` + `CommittedWord`; `replayFrom` = `replayWords(...).position`.
- `canIncK` k+2 and `canDropOn` = `idle` mutations are equivalent on the listed states (Design Notes), so they do not fail; the tap-mapping and undo-availability mutations do.

- Review patches (applied in the main session; the resumed implementer could not be awaited unattended and was stopped before any edit): `flippedSide(move)` in rules.ts shared by `flip` and `canFlip`; comment on the Composing/Place gating (AD-7); STATES gain `Composing k = n − 1` and `Place with L = 10` (the `canIncK` k + 2 and `canSetTarget` always-false mutations now fail); D6 A-E14 BALKED +30 test via the D2 seam.
- Erratum 2026-09-29: each flag's agreement test is one `it.each` over STATES, so Vitest reports one test per flag × state; each flag still has one test definition with identical coverage, which meets the "one per flag (AD-3)" Execution item (2-8 review-loop Result; ticket 2.12 S22).

## Plan Change Log

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 28 findings — high 0, medium 2, low 19, false 7, maybe-false 0
- findings:
  - `[medium]` `[patch]` blind: `canSetTarget` agreement never expects true (both Place states L = 3, target 3) — added `Place with L = 10` to STATES; an always-false mutation now fails.
  - `[low]` `[reject]` blind: every `apply` now builds committed words it discards — the ticket prescribes one loop (`replayFrom` = `replayWords(…).position`); cost is O(moves ≤ 26) string joins, unit suite ~1.3 s.
  - `[low]` `[patch]` blind: `canFlip`, `canSetTarget`, `canConfirm`, `canAddFreeLetter` restate guards instead of sharing predicates — `canFlip` now uses rules.ts `flippedSide`, shared with the `flip` reducer; `canAddFreeLetter` already uses the rules.ts `hasFreeLetter`/`cellHasTop` predicates, `canConfirm` is the Place phase gate itself and `canSetTarget`'s `cell ≠ target` is the placeEdit no-op on its only changed field; all pinned by the agreement tests.
  - `[low]` `[reject]` blind: `redoAvailable` and `redo` both switch over phase with an unreachable `never` default — the default is compile-time exhaustiveness, unreachable at runtime; merging is refactor-sweep material (entry 12).
  - `[false]` `[reject]` blind: new files would be committed 100755 — `core.fileMode` is false in this repo; the 100755 came from `git diff --no-index`, which ignores that config.
  - `[low]` `[patch]` blind: Composing/Place flags not gated on playing, relying on AD-7 — comment added citing §2 status and `ad7-gave-up-idle` (no logic change needed: won and gaveUp require Idle).
  - `[false]` `[reject]` blind: sentence → test mapping missing — it is in the plan's Tasks & Acceptance (the lens had only the diff).
  - `[low]` `[reject]` blind: ~90 lines of test helpers copied from commands.test.ts — the plan's chosen default (tests never import another test file); a shared helper module is refactor-sweep (entry 12) scope.
  - `[false]` `[reject]` blind: no test proves messages and check order unchanged — the diff keeps every message string verbatim; undo's r70 check now precedes the gaveUp return but `undoAvailable` is true whenever gaveUp, so the outcome is identical; the unchanged command table pins codes and order.
  - `[low]` `[reject]` blind: `Object.isFrozen` assertion restates deepFreeze — mutation of a frozen input throws in strict-mode ESM, failing the test; the line is redundant, harmless.
  - `[low]` `[patch]` blind: D6 test lacks the ticket-cited A-E14 BALKED on cell 6 → +30 — added `AD-3 D6 A-E14` test on the §8 start via the seam; delta 30 equals the commit's live-score change.
  - `[low]` `[reject]` blind: `faces` rebuilt per view call — 52 small objects; a per-LangData cache adds state for no measured cost.
  - `[low]` `[reject]` blind: `longestWord` copies the winning entry — cosmetic; the copy keeps GameView free of aliasing into replay output.
  - `[low]` `[reject]` blind: `canDropOn`'s `anySource` hard to read — cosmetic; it is the R-10 predicate over sourceCount 1, as the plan's Design Notes state.
  - `[low]` `[patch]` edge: `canFlip` does not share `flip`'s predicate — same entry as the blind shared-predicate row; fixed with `flippedSide`.
  - `[medium]` `[patch]` verification-gap: `canSetTarget` true direction untested — same root as the first row; fixed there (also added `Composing k = n − 1`, closing the `canIncK` k + 2 survivor the implementer reported).
  - `[low]` `[patch]` intent: flags restated instead of shared (reading B partly implemented) — grouped with the shared-predicate entry; `flippedSide` extracted, the rest shared or pinned as above.
  - `[low]` `[reject]` intent: `canDecK`/`canIncK` at n = 0 agree with `r31-set-count-empty-destination` by arithmetic only — `destinationCountAllowed(0, k ∓ 1)` is false for every k ≠ 0, the same set the guard rejects; the R-31 k = 0 tests pin it.
  - `[low]` `[patch]` intent: status/phase gates rebuilt in viewFrom — grouped with the AD-7 comment row.
  - `[false]` `[reject]` intent: agreement states not seam-built — the ticket says "through public apply where possible, else the D2 seam"; every listed state is reachable through apply.
  - `[low]` `[reject]` intent: "view never calls apply / never catches" has no test — a structural property visible in view.ts's imports (no `apply`, no `try`); a test would be a source scan with no other use.
  - `[low]` `[patch]` intent: A-E14 BALKED +30 not reproduced — same entry as the blind D6 row.
  - `[false]` `[reject]` intent: faces test named AD-3 not R-85 — the review-log Result minor names faces tests AD-3 (R-85 cited, not the name).
  - `[low]` `[reject]` intent: frozen-argument check restates freezing — same as the blind row; harmless.
  - `[false]` `[reject]` intent: extra `type Status` export — GameView's `status` field needs it ("plus the nested types it needs"); type-only, runtime list unchanged.
  - `[false]` `[reject]` intent: undo check order moved — outcome identical (see the messages row).
  - `[low]` `[reject]` intent: faces allocation / seam coverage remarks beyond the above — descriptive only, no defect named.
  - `[low]` `[reject]` intent: tests exercise reading A's behavioural surface rather than B's structure — by design (build-notes CAP-7: one agreement test per flag); structure improved where cheap.

## Design Notes

- Flags from predicates, not from calling `apply`: view replays once; the agreement tests prove the predicates match `apply` (build-notes CAP-7).
- `canDropOn` is true for every column in Idle while playing (a non-empty column always exists then; any non-empty source works, including c itself); still computed from the predicate over candidates, not hard-coded.
- Omitted keys, not `undefined`-valued ones: the per-key `Object.hasOwn` tests and the plain-data test's no-`undefined`-value check prove it (`structuredClone` keeps `undefined`-valued keys); the whole-view `toStrictEqual` + `structuredClone` round trip proves there are no functions or other non-cloneable values.

## Verification

**Commands:**
- `npx vitest run src/engine` -- expected: all pass
- `npm run check` -- expected: exit 0
- `git diff --stat HEAD -- src/ui src/shell src/main.ts src/engine/deal.ts src/engine/lang` -- expected: empty
- `npm run test:all` -- expected: exit 0

## Auto Run Result

- **Summary:** public `view(session, lang)` (internal `viewFrom` D2 counterpart) builds every AD-3 field from one `replayWords` pass; flags come from boolean predicates extracted into rules.ts and commands.ts, with the check functions and reducers now thin throwing wrappers (codes, messages, order unchanged); internal `replayWords`/`longestWord` ready for CAP-8.
- **Files:**
  - `src/engine/view.ts` — new: `GameView` and nested types, `view`, `viewFrom`, `longestWord`.
  - `src/engine/view.test.ts` — new: every ticket AC test, one agreement test per flag over 24 states, R-12/R-30/R-31/R-33/R-36/R-80/R-81/R-83/§2 tests, D6 incl. A-E14.
  - `src/engine/rules.ts` — predicates (`sourceCountAllowed`, `destinationCountAllowed`, `cellHasTop`, `wordLetterCount`, `letterCountAllowed`, `targetCellAllowed`), `tapDestinationCount`, `flippedSide`.
  - `src/engine/commands.ts` — `undoAvailable`, `redoAvailable`, `giveUpAvailable` internal; tap/flip use the shared rules.
  - `src/engine/replay.ts` — `replayWords` + `CommittedWord`; `replayFrom` wraps it.
  - `src/engine/index.ts`, `index.test.ts` — `view` runtime export, type-only view types and `Status`.
- **Review-log items:** 11 unapplied minors applied (listed under Tasks & Acceptance); 2 not applied — both edits to the ticket's own wording (D6 clause duplicated in Verify; splitting the Verify sentence), which the build cannot change.
- **Review findings:** 28 rows — patched 5 entries (2 medium: canSetTarget true direction [+ k = n − 1 state]; 3 low: shared `flippedSide`, AD-7 gating comment, A-E14 D6 test); 0 deferred; rejected 12 low and 7 false with reasons in the Review Triage Log.
- **Follow-up review:** false — first pass, no high patched; the two medium rows are one entry (same root cause), so fewer than two medium entries were patched.
- **Verification:** `npx vitest run src/engine` 641 passed; `npm run check` 0 errors; forbidden-path diff empty; `npm run test:all` exit 0 before and after patches (unit 1051 passed, e2e suites passed); `canIncK` k + 2 and `canSetTarget` always-false mutations fail the suite.
- **Residual risks:** `canSetTarget`'s no-op and `canConfirm` remain inline expressions (pinned by agreement tests only); test helpers duplicated between commands.test.ts and view.test.ts (entry 12 candidate).
