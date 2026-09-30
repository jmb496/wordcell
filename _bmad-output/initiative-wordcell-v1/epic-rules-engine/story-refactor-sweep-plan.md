---
title: 'Refactor sweep'
type: 'refactor'
ticket: '12'
created: '2026-09-29'
status: 'built'
baseline_revision: '3a26472be9f2811ac0553ac34257bb5c8c5ad07d'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-refactor-sweep.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-refactor-sweep.review-log.md'
warnings: ['oversized', 'multiple-goals']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Entries 1–11 left test gaps, two small engine refactors and stale plan text (the ticket's Scope rows S1–S37). Nothing pins them yet.

**Approach:** Carry out every Scope row of the ticket (the context file, applied verbatim, is the authority for row content). Land the test rows first, then the refactor rows S32 and S34, then the plan errata. This plan settles the review log's open major and the unapplied minors (Design Notes). Record per row what was done in Implementation Notes.

## Boundaries & Constraints

**Always:**
- No engine behaviour change. The runtime and type exports of `index.ts` stay the same, `view.ts` keeps importing `redoAvailable`, `undoAvailable` and `giveUpAvailable`, and every command-table outcome stays the same. S32 and S34 touch no `*.test.ts`, and the whole suite passes unchanged across each.
- New and renamed tests are named id first (AGENTS.md Conventions). Cite rules by id. Deep-freeze inputs as the file already does. Assert with `toStrictEqual` or `toThrow`-by-code as the file already does.
- For each gap-closing test (S1–S10, S12–S14, S16–S21, S23, S24, S27–S29), apply a named wrong implementation to `src/engine/`, show the test failing, then revert. Record the mutant, the test name and the failure line in Implementation Notes. S30 pins current behaviour and is exempt. For S4/S5, one mutant (swapping the order of one pair) is enough per table.
- Line numbers in the ticket are anchors as of 635a8e9. Find each target by its content.
- Done-plan edits (S11, S22, S26, S31) are dated `Erratum 2026-09-29:` lines appended to the named section. Never rewrite existing text.

**Never:**
- Touching `deal.ts`, `buildDeck`, the distribution data or the R-02 golden deal literals.
- Hand-editing AGENTS.md (S37 is a follow-up record only).
- Deleting a case without keeping its coverage, or weakening an assertion. A replaced test (S5), moved assertions (S15) or a removed helper copy (S33) is fine when the covered case stays covered.
- Fixing an engine bug found by a new test (see the Design Notes on a red test).
- Changing `SESSION_VERSION` or `HISTORY_VERSION`.

</intent-contract>

## Code Map

- `src/engine/commands.ts:384-400` -- `redoAvailable`, whose `never` default (`command-domain`) must stay. `:435-452` `redo` is the S32 target: remove only its `default:` branch. The switch stays type-exhaustive, because `phase` is the `Phase` union and every case returns.
- `src/engine/serialize.ts:180-202` `parseSession`, `:320-342` `parseHistory` -- the S34 target. Both have the same JSON.parse → plain-object/own `version` → safe-integer ≥ 0 → `!== CURRENT` stage. Extract an internal helper that returns either the numeric version or the early `version-unreadable`/`version-unknown` result. Keep the rethrow of non-SyntaxError errors, and keep the result shapes identical.
- `src/engine/serialize.ts:285-318` `checkRecord` order (S4): not-object → field-set → record-version → seed-uint32 → outcome → final-score → active-ms → longest-word-not-object → spelling → letter-count.
- `src/engine/replay.ts:63-147` `checkSession`, the AD-7 pre-replay order (S5): seed → active-ms → gave-up-type → cursor-index → cursor-phase → gave-up-idle → place-fields → k0-side → s2-committed-prefix → s2-last-only → unknown session/cursor/move field. `replay.test.ts:304` is the seed→activeMs test that S5 replaces.
- `src/engine/index.ts`, `index.test.ts` -- S6 adds a type test next to the runtime keys test.
- `src/engine/{commands,replay,view,history,serialize,scoring,session,deal}.test.ts` -- S33 helper copies (`deepFreeze`, `startOf`, `DICT`, `draftOf`, `drop`, `play` and others). Confirm byte identity with a diff before moving anything.
- `src/architecture.test.ts` -- the AD-1 scan that must accept `src/engine/test-helpers.ts`.
- Done plans in this folder: `story-golden-deal-test-and-r-id-test-names-plan.md` (2.2), `story-session-createsession-replay-and-checksession-plan.md` (2.3), `story-gameview-plan.md` (2.8), `story-score-history-semantics-plan.md` (2.9).

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/replay.test.ts` -- S1, S5, S7, S8, S9, S10 as the ticket says. For S5: build one `it.each` row per adjacent pair of the order above, each breaking checks n and n+1 and expecting n's code. Leave out any pair that cannot be broken together, and name it in Implementation Notes.
- [x] `src/engine/commands.test.ts` -- S2, S3 (undo and redo rows, landed before S32), S12, S13, S14.
- [x] `src/engine/serialize.test.ts` -- S4 (same rule as S5), S27, S28, S29, S30 (plus the −0 note in Implementation Notes).
- [x] `src/engine/scoring.test.ts` -- S15, S16.
- [x] `src/engine/view.test.ts` -- S17–S21 (see the Design Notes for S19/S21).
- [x] `src/engine/history.test.ts` -- S23, S24 (`EARLIER` = any non-empty list of records other than GAVE_UP0's), S25.
- [x] `src/engine/index.test.ts` -- S6: `import type` every `export type` name of index.ts, one `expectTypeOf` each.
- [x] `src/engine/test-helpers.ts` -- S33. First add an empty module and run `npm run test -- src/architecture.test.ts` and `npm run check`. If either rejects it, move S33 to Excluded with the output. Otherwise move the byte-identical expect-free helpers and replace every identical copy.
- [x] `src/engine/commands.ts` -- S32 (after the S3 rows are green).
- [x] `src/engine/serialize.ts` -- S34.
- [x] Done plans -- S11, S22, S26, S31 errata.
- [x] This plan -- S37: an Implementation Notes line recording the `bmad-project-context` follow-up (AGENTS.md Known pitfalls: the STUCK_PENALTY_PER_CARD sentence and the deal.test.ts "not id-named" sentence are stale) as a `bmad-retrospective` action item, with the trigger moved from entry 12.

**Acceptance Criteria:**
- Given the sweep is finished, when Implementation Notes are read, then every row S1–S34 and S37 is marked done (with its mutant for gap tests), or moved to Excluded/Dropped with a reason.
- Given S32 and S34, when their diffs are inspected, then no `*.test.ts` changed in them, and `npm run test` passes before and after each.
- Given `npm run test:all`, when run, then it is green, `git diff 3a26472 -- src/engine/deal.test.ts` shows no change to the golden literals, and the `npm run test` duration measured on this machine is recorded (target < 5 s, AD-17).

## Design Notes

Review-log settlements (ticket review log, Result):
- **Open major, a red gap test:** if a new test fails on unchanged engine code, it is a found bug. Leave the engine unchanged, mark the test `it.fails` or skip it with the id in its name, record the test and the failure here, and finish the other rows. The build then ends `blocked` for the owner (rule 7), and the fix becomes a new story.
- AC2 "none deleted or weakened" is read as none weakened: a replaced or moved case stays covered.
- S32 deliberately departs from gameview plan:115's "merge": only redo's unreachable default goes.
- S19: any top-level boolean flag of GameView that is constant across STATES gets a new state, which is listed here. S21's state counts. S21: prefer `play(WON, [UNDO ×6])`, which gives Idle at 6 with pending `moves[6]` and a redo tail `moves[7]`. Verify it in view.test.ts, else fall back to `play(COMMITTED, [UNDO, UNDO, UNDO])`.
- Description vs tickets.toml entry 12: the Excluded items are accepted residuals or rejected findings, not scope pushed out of another story, so no new story is needed.

## Verification

**Commands:**
- `npm run test` -- expected: green; record the duration.
- `npm run check` and `npm run lint` -- expected: clean.
- `npm run build && npm run test:all` -- expected: green.

## Implementation Notes

Baseline at 3a26472: `npm run test` 1285 passed, 4.23 s. Mutants were applied to `src/engine/` sources by a script that restored the file after each run (`git diff --stat` on the non-test sources was empty after every mutant). "Fails" gives the failing test and its first failure line.

**Test rows**
- S1 done. `§2 checks a later redo-tail move on the scratch after the earlier tail commits (Q-41)` and `§2 checks a below-committed last redo-tail move (Q-41)`. Mutant (a), tail scratch never advanced (the `scratch = commitMove(…)` line removed): the first test fails `expected undefined to be an instance of EngineError`; three existing redo-tail tests also fail, because REDO_T2 already needs the advanced scratch. Mutant (b), only committed tail moves checked: both new tests fail `expected undefined to be an instance of EngineError`, and no existing test fails.
- S2 done. `R-13 a whole column may drop onto its own column (Q-30): k = 0 and the word is the column`. Mutant: drop's initial k ignores R-21 (`position.columns[destinationColumn - 1].length === 0 ? 0 : 1`). commands.test.ts then fails at import: the module-level `winSeed(1)` throws `R-31 destinationCount 1 outside 0…0`, so every test in the file is red, the new one included. No finer mutant exists, because `winSeed` itself runs whole-column self-drops.
- S3 done, landed before S32. Command-table rows `AD-2 undo a cursor phase outside Phase (committed) → throw` and `AD-2 redo … → throw` on `OUT_OF_PHASE` (`[...PREFIX, COMMITTED_DRAFT]`, cursor `{ index: 2, phase: 'committed' as never }`). checkSession accepts it (reached committed ≥ committed). Mutants: undo's default returns an Idle Session → `expected undefined to be an instance of EngineError`. `redoAvailable`'s default returns false → `expected 'r71-no-redo-data' to be 'command-domain'`.
- S4 done. `§2 checkRecord runs in order: %s before %s`, 9 pairs. Every pair can be broken together; not-object with field-set uses a record array `[]`. Mutant: the outcome and final-score checks swapped → `history.outcome before history.final-score` fails `expected 'history.final-score' to be 'history.outcome'`.
- S5 done. `§2 pre-replay checks run in AD-7 order: %s before %s` replaces the seed → activeMs test. It has 12 pairs over the 13 AD-7 codes (the unknown session, cursor and move fields are three steps). Every pair can be broken together. Mutant: the place-fields and k0-side blocks swapped → `ad7-place-fields before ad7-k0-side` fails `expected 'ad7-k0-side' to be 'ad7-place-fields'`.
- S6 done. `AD-2 index exports every engine type (checked by npm run check)`: 27 names, each `expectTypeOf<X>().toEqualTypeOf<module.X>()` against its source module. history.ts is imported as the namespace `scoreHistory`, because a `history` binding fails the AD-1 scan. Mutant: `DestinationSide` dropped from index.ts → `npm run check` (svelte-check) `ERROR src/engine/index.test.ts 13:3 Module './index' has no exported member 'DestinationSide'`.
- S7 done. Per-move case `a self-drop with k = n + 1 after S is removed (R-31, R-21)`. Mutant: `checkDestinationCount` lets k = n + 1 through on a self-drop → `expected 'r50-placement-order' to be 'r31-destination-count'`.
- S8 done. `§2 rejects a lone QU card as a committed word: 2 letters (R-36)` (one-card QU column, whole-column self-drop, k = 0). Mutant: R-36 is checked only when D is non-empty → `expected 'r40-target-cell' to be 'r36-letter-count'`.
- S9 done. `§2 rejects a committed draft breaking R-40 in front of a redo tail (Q-41)` (REDO_DRAFT `targetCell: 4` in REDO_TAIL). Mutant: the draft is checked only when no redo tail follows → `expected 's2-free-letters-set' to be 'r40-target-cell'`.
- S10 done. The cursor-place case now uses `composingNoPlaceFields` (composingBase without its Place fields), and the Place-fields case now uses cursor `{ index: 0, phase: 'idle' }`. Mutants: the cursor-phase check tests only that the draft exists → `§2 rejects phase place above the draft reached (ad7-cursor-phase)` fails `expected undefined to be an instance of EngineError`. The place-fields check rejects only missing fields → `§2 rejects composing move with Place fields (ad7-place-fields)`, same line.
- S12 done. The D8 test adds `arrange [I, N, W, Z]`, removes cell 4 and expects `[I, W, Z]`. Mutant: `removeFreeLetter` trims the first card of M when it is the removed one, else the last → the D8 test fails (replay: `§2 freeLetters tops differ from the arrangement cards not in S`).
- S13 done. `expectLegalTargets` gains a `// R-42` assertion that `placementOrder` equals `word(…).cards`; its callers are named `R-40 R-42 …`. Mutant: validate reverses the default order at k = 0 → the five `R-40 R-42 legal targets` tests fail, e.g. `expected [ 42, +0, 4 ] to strictly equal [ 4, +0, 42 ]`. No other test fails.
- S14 done. The R-51 test also runs setTarget(4) then setOrder(custom) and expects target 4 and the custom order. Mutant: `setPlacementOrder` resets `targetCell` to min(|order|, 10) → the R-51 test fails `expected 5 to be 4` (the R-72 test fails too).
- S15 done. The `lettersLeft` assertions moved from the R-83 synthetic test into `R-81 letters left and the penalty read the language letter counts (synthetic LangData)`. This is a move, so no mutant is needed.
- S16 done. `R-80 live score reads the language letter counts (synthetic LangData)` (`liveScore(cellsWith({ 10: [Z] }), synthetic)` = 20), plus `penalty(z, synthetic)` = 20 in S15's test. Mutants: `liveScore` or `penalty` counts QU as 2 and every other card as 1, ignoring the lang values → `expected 10 to be 20`, each in its own test.
- S17 done. `checkOf` now reads `OVER` (a per-fixture map of the non-playing STATES: WON won, GAVE_UP0 and GAVE_UP1 gaveUp) and `session.cursor.phase`. Mutant: the shared `status()` in replay.ts ignores `gaveUp`. View and apply then move together, which the old view-derived expectation would follow. Result: `AD-3 in each canValidate false state …` fails `expected 'command-phase' to be 'command-status'`.
- S18 done. For PLACE_R41, `isLegalTarget` is checked against the literal cell 3. For PLACE_R41, PLACE_FROM_IDLE and PLACE_L10 it is checked against `apply(setTarget)` (throws `r40-target-cell` → false). Mutant: the view's L is one too high in Place (`count + 1`, shared by `legalTargets` and `isLegalTarget`, so the old comparison stays green) → `AD-3 isLegalTarget and used in all three phases` fails `expected true to be false`.
- S19 done. `LABELLED` holds one property check per STATES label. `AD-3 every STATES label has a labelled property …` also checks the labels and `OVER` against the view status. `AD-3 %s is true in at least one STATES entry and false in another` runs over the 9 top-level boolean flags (inProgress, canUndo, canRedo, canGiveUp, canValidate, canConfirm, canFlip, canDecK, canIncK). No flag is constant across STATES, so no state was added beyond S21's. Mutant: undo from Place lowers a last draft to Composing, dropping the stored validation → `AD-3 STATES Composing reached by undo from Place has its labelled property` fails `expected 'composing' to be 'place'`, while the agreement tests stay green.
- S20 done. TAP_STATES gains K0_SELF and K0_EMPTY. Mutant: `tapDestinationCard` at k = 0 is a no-op instead of `r31-tap-not-in-destination` → `R-31 kIfTapped matches apply(tapDestinationCard) …` fails `expected undefined to be an instance of EngineError`. canTapForK agreement stays green, because a no-op and a throw both count as no change.
- S21 done with the preferred fixture. `PENDING_TAIL = play(WON, [UNDO ×6])` is labelled `Idle with a committed pending draft and a redo tail`. Its labelled check confirms Idle at 6, `moves[6]` committed, the tail `moves[7]` and canRedo true. Mutant: `redoAvailable` in Idle refuses a committed pending draft → its labelled-property test fails `expected false to be true` (canRedo agreement stays green).
- S23 done. `R-74 a gaveUp then a won finish of the same seed both append; un-finishing the win removes only it`. Mutant: a won finish replaces a same-seed last record of the other outcome → `expected [ {…} ] to strictly equal [ {…}, …(1) ]`.
- S24 done. `R-84 a give-up at index 0 un-finished by undo (R-75, R-70) removes the last record`. `EARLIER` is the existing seed-7 won / seed-9 gaveUp constant. Mutant: an un-finish is recognised only when `after.cursor.index > 0` → `expected [ … ] (3 records) to strictly equal [ … ] (2 records)`.
- S25 done. `R-84 a replay-invalid …` is renamed `AD-15 a replay-invalid Session throws replay’s EngineError`, and `(A-E3)` is appended to the three statistics test names that lacked it.
- S27 done. Four withDraft `it.each` rows. Mutants: the placementOrder row removed from MOVE_DOMAINS; `isCard` without its lower bound; the destinationCount row removed; the targetCell row removed. Each fails its new row with `expected undefined to be an instance of EngineError`; the targetCell mutant also fails the `session-invalid-cell-domain.json` row.
- S28 done. Rows `cursor.phase null` and `destinationSide 1`. Mutants: each enum check applied only to strings → each row fails `expected undefined to be an instance of EngineError`.
- S29 done. `§2 serializeSession copies session.version: a version-2 copy writes version 2` and `§2 serializeHistory copies the container and record versions: a version-2 copy writes 2`. Mutants: serializeSession writes `SESSION_VERSION` → `expected '{"version":1,"seed":1,…' to match /^\{"version":2,/`. The container writes `HISTORY_VERSION` → `expected 1 to be 2`. Records write `HISTORY_VERSION` → `expected [ 1, 1, 1 ] to strictly equal [ 2, 2, 2 ]`.
- S30 done (pins current behaviour, no mutant). `§2 version -0 is version-unknown with version -0 (current behaviour, pinned)` and the history counterpart, each also checking `Object.is(version, -0)`. Note: a stored −0 `seed` or `activeMs` passes AD-7 (a safe integer ≥ 0), and `serializeSession` writes it back as `0` (`JSON.stringify(-0)` is `"0"`), so that round trip is not byte-equal. The engine never writes −0; normalising it is Excluded (a behaviour change).
- S33 done. The empty `src/engine/test-helpers.ts` passed `npm run test -- src/architecture.test.ts` and `npm run check` first. The first scan failure came from S6's `history` namespace binding, not from the module, and was fixed by the rename. Moved, with byte identity confirmed by md5: `deepFreeze` (commands, history, replay, serialize, view); `Eight` + `startOf` (commands, replay, view); `drop` (commands, history, serialize, view); `play` (history, serialize, view); `draftOf` (commands, view); `DICT` in its `lang: EN` form (commands, serialize). These stay local because they differ or use `expect`: session.test.ts's `deepFreeze`; view.test.ts's `DICT` (`lang: LANG`); `seam`; `setTarget`; `sessionOf`; `CTX`; `run`; `reconcile`; `expectEngineError`. history.test.ts's `lang: LANG` DICT became unused once `play` moved and was removed; `LANG` is `deepFreeze(EN)`, the same object, so the shared `play` behaves identically. One-line command constants (`UNDO`, `REDO`, …) are data, not helpers, and stay local. The module imports no vitest and has no own test file.

**Refactor rows**
- S32 done. commands.ts diff: `redo`'s `default:` branch (4 lines) removed; the switch stays exhaustive over `Phase` (`npm run check` clean). No `*.test.ts` changed (test-file diff stat unchanged, 7 files +511/−234, before and after). `npm run test` gave 1376 passed before and after. S3's redo row still throws `command-domain` through `redoAvailable`'s kept default. This deliberately departs from gameview plan:115's "merge" (Design Notes).
- S34 done. serialize.ts: internal `versionStage(text, current)` returns the `VersionFailure` result or `{ ok: true, value, version }`. `parseSession` and `parseHistory` return its failure as is. Result shapes and the non-SyntaxError rethrow are unchanged. No `*.test.ts` changed, and `npm run test` gave 1376 passed before and after (serialize.propagation.test.ts included).

**Doc rows**
- S11, S22, S26, S31 done: dated `Erratum 2026-09-29:` lines appended to the session plan's Implementation Notes (S11), the gameview plan's Implementation Notes (S22), the score-history plan's Acceptance Criteria (S26) and the langdata plan's Auto Run Result (S31, two lines: the bca5f0f state and the S37 trigger move). S31 went to `story-langdata-en-and-lettercount-plan.md`, which is ticket 2.2 in tickets.toml and the 2-2 log's intent file (see Plan Change Log).
- S37 done, as a follow-up record: **`bmad-retrospective` action item: run `bmad-project-context` to refresh AGENTS.md Known pitfalls. Two sentences are stale: the STUCK_PENALTY_PER_CARD scaffold sentence (`PENALTY_PER_LETTER` replaced it in 2.2; R-81 was completed in 2.7) and the "deal.test.ts tests are not id-named" sentence (renamed in 2.1).** The trigger moves from entry 12 (langdata plan:89, :134; golden-deal plan:86; the scoring plan's `deferred`) to the epic retrospective. This sweep did not run the skill and did not hand-edit AGENTS.md.

**Verification**
- No gap-closing test was red on unchanged engine code (Design Notes open-major rule not triggered).
- `npm run test`: 1376 passed (1285 at baseline, +91), 2.62–2.68 s over three runs on this machine (AD-17 target < 5 s).
- `npm run lint` and `npm run check`: clean.
- `npm run build` exit 0 (size budget 473364 / 600000). `npm run test:all` exit 0: unit 1376; dist-smoke 13; e2e 34; pwa 12.
- `git diff 3a26472 -- src/engine/deal.test.ts src/engine/deal.ts src/engine/types.ts src/engine/lang` is empty, so the golden literals are unchanged. `SESSION_VERSION` and `HISTORY_VERSION` are unchanged. `index.ts` is unchanged (runtime and type exports).

**Review patches**
- S5: each `orderPairs` row gains a repaired session (check n fixed, n + 1 still broken); the same `it.each` asserts that it throws the second code.
- S4: each checkRecord order row gains a repaired record (check n fixed, n + 1 still broken), asserted to throw the second code. The not-object row's repaired record is `{}`.
- S19: new `AD-3 FLAGS are exactly the top-level boolean GameView keys` compares FLAGS with the boolean-valued keys of `v(FRESH)`.
- S6: renamed to `AD-2 index keeps exporting each listed type, equal to its source-module type (checked by npm run check)`; it does not claim completeness.
- S19: the Composing labels (middle k and right side, k = n, k = n − 1, n = 1 and right side, both k = 0, partial self-drop) now assert `cursor.phase` composing, and partial self-drop asserts `sourceCount` < the source column length.
- S19: the `won` label also asserts `s.gaveUp` false, so it no longer rests only on `OVER`.
- S21: STATES gain the ticket's literal fixture `PENDING_COMMITTED = play(COMMITTED, [UNDO, UNDO, UNDO])`, labelled `Idle with a committed pending draft, no redo tail` (Idle, `moves[index]` committed, `moves.length` = index + 1, canRedo true), next to PENDING_TAIL.

## Plan Change Log

- 2026-09-29: Code Map listed `story-golden-deal-test-and-r-id-test-names-plan.md` as 2.2. In tickets.toml that plan is entry 1 (2.1), and 2.2 is `story-langdata-en-and-lettercount-plan.md`. The ticket's S31 content (index.test.ts, 425 tests, letterCount loop) describes the langdata plan, so its erratum went there.

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 26 findings — high 0, medium 3, low 13, false 10, maybe-false 0
- findings:
  - `[false]` `[reject]` blind: S32 leaves `redo` without a runtime guard — `redo` calls `redoAvailable` (commands.ts:438) before the switch on every path, and its `never` default throws `command-domain`; the switch is type-exhaustive; S32 is exactly what the ticket prescribes, pinned by S3's redo row.
  - `[medium]` `[patch]` blind: S4/S5 order tables never prove the second check is broken — grouped with the edge-case and verification-gap rows below; fix: each row gains a repaired fixture asserting the second code.
  - `[low]` `[patch]` blind: S19 FLAGS hand-maintained, not tied to GameView — fix: assertion that FLAGS equals GameView's top-level boolean keys.
  - `[low]` `[patch]` blind: S6 test name overpromises completeness — fix: rename to what it checks.
  - `[low]` `[reject]` blind: S2 mutant turns the whole file red, not the test alone — the new test is shown failing, which meets AC4; winSeed(1) runs whole-column self-drops, so a word-derivation mutant for them also breaks the file at load.
  - `[low]` `[patch]` blind: Composing labels don't assert phase; partial self-drop lacks sourceCount < column — fix: add the assertions.
  - `[low]` `[patch]` blind: `won` label's OVER check is circular — fix: also assert `gaveUp === false`.
  - `[false]` `[reject]` blind: plan has no Excluded section and skips S35/S36 — every row is done (none needed moving); S35/S36 were deleted in the ticket's review loop; fixing would edit this plan.
  - `[false]` `[reject]` blind: plan review record empty — the triage log is written by this step; status was in-review at the snapshot.
  - `[low]` `[reject]` blind: nothing stops engine sources importing test-helpers.ts — src/architecture.test.ts has no such rule (verified), but no production file imports it and the name signals intent; a new scan rule is added complexity; recorded as a residual risk.
  - `[false]` `[reject]` blind: VersionFailure a third copy of the union — if a public result union diverged, `return stage` would stop type-checking (`npm run check`), so drift cannot pass silently.
  - `[false]` `[reject]` blind: view.test.ts keeps its own DICT — S33 prescribes that differing copies stay local; view's is `lang: LANG`.
  - `[low]` `[reject]` blind: S30 Object.is lines redundant and casts — cosmetic, no harm.
  - `[low]` `[reject]` blind: S37 follow-up not in `deferred` — the ticket prescribes a plan-result record as a retrospective action item; the fix would edit this plan; repeated in Auto Run Result.
  - `[medium]` `[patch]` edge-case: order-pair rows may stop breaking check n+1 after fixture changes — same root cause as the blind S4/S5 row; same fix.
  - `[medium]` `[patch]` verification-gap: order tables' `second` column unused — same root cause; same fix.
  - `[low]` `[patch]` intent: S21 uses play(WON, [UNDO ×6]) instead of the ticket's literal play(COMMITTED, [UNDO ×3]) — fix: add the literal fixture as its own STATES entry too.
  - `[false]` `[reject]` intent: S31 erratum target resolved by content — tickets.toml makes 2.2 the langdata plan; the erratum is in the right plan.
  - `[false]` `[reject]` intent: history.test.ts DICT deleted rather than kept local — it became unused once `play` moved (LANG is EN), and lint would flag it.
  - `[low]` `[reject]` intent: S2 mutant coarse — duplicate of the blind S2 row; same reason.
  - `[low]` `[reject]` intent: R-42 assertion runs in two tests without R-42 in their names — R-42 is covered by the id-named `R-40 R-42 …` tests; the extra runs only strengthen it.
  - `[low]` `[reject]` intent: order tables pin the coded order, not an independent spec text — the ticket asks to pin the AD-7 order as implemented (reviewed in 2.3 and 2.11).
  - `[false]` `[reject]` intent: S6 does not detect types added later — the ticket asks only that a dropped export fails `npm run check`.
  - `[low]` `[patch]` intent: FLAGS completeness by hand — same root cause as the blind FLAGS row; same fix.
  - `[false]` `[reject]` intent: S32/S34 sequencing is visible only in plan prose — the ticket's criteria read "their diffs touch no test file", which the diff confirms (commands.ts and serialize.ts only); this is not a defect.
  - `[false]` `[reject]` intent: additions beyond the rows (EN baseline, OVER agreement, cursor assert, Object.is) — they strengthen coverage within their rows; AC1 is met.

## Auto Run Result

**Summary:** Every Scope row of ticket 2.12 is done: S1–S30 gap tests, S32 and S34 behaviour-neutral refactors, S33 shared `test-helpers.ts`, S11/S22/S26/S31 errata and the S37 follow-up record. No row went to Excluded or Dropped, and no new test was red on unchanged engine code. Review-log items: the open major (a red gap test) is settled in Design Notes and was not triggered. The unapplied minors are settled in Design Notes and Implementation Notes: the AC2 reading, drifting line anchors, `EARLIER`, S32 vs "merge", S19 constant flags (none), the S33 empty-module check first, AC4 reverted mutants, Excluded vs tickets.toml, AC3 timing recorded, and S21 using both fixtures after review.

**Files changed:**
- `src/engine/commands.ts` -- S32: `redo`'s unreachable `never` default removed.
- `src/engine/serialize.ts` -- S34: internal `versionStage` shared by `parseSession` and `parseHistory`.
- `src/engine/test-helpers.ts` -- S33: byte-identical expect-free helpers.
- `src/engine/{replay,commands,serialize,scoring,view,history,index}.test.ts` -- gap tests, renames and helper imports per Scope row.
- Four done plans (2.2 langdata, 2.3 session, 2.8 gameview, 2.9 score history) -- dated errata.

**Review (thorough, 4 lenses, 26 findings):** Patched 6 entries: 1 medium (the S4/S5 order tables now also prove check n+1 with a repaired fixture) and 5 low (FLAGS completeness test, S6 rename, Composing label phase asserts, `won` gaveUp assert, the literal S21 fixture added). Deferred: none. Rejected: 10 false and 10 low, each with its reason in the Review Triage Log.

**Follow-up review recommended:** false (first pass; 0 high and 1 medium patched).

**Verification:** `npm run lint` and `npm run check` are clean. `npm run test` passes 1391 tests in 2.73 s (AD-17 target < 5 s). `npm run build` is within budget (473364 / 600000). `npm run test:all` exits 0 (unit 1391, dist-smoke 13, e2e 34, pwa 12). Deal, types and lang sources and the golden literals are unchanged since 3a26472, and `index.ts` is unchanged.

**Residual risks:**
- `src/architecture.test.ts` does not stop a non-test engine module from importing `test-helpers.ts`. Nothing does today.
- S2's mutant turns the whole of commands.test.ts red, not the new test alone.
- A stored −0 seed or activeMs re-serializes as 0 (pinned, Excluded).
- S37 retrospective action item: run `bmad-project-context` to refresh the two stale AGENTS.md Known pitfalls sentences.
