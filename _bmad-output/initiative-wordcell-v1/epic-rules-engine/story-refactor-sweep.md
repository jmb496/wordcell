---
id: 12
type: story
title: "Refactor sweep"
parent: epic-rules-engine
covers: [CAP-1, CAP-2, CAP-3, CAP-4, CAP-5, CAP-6, CAP-7, CAP-8, CAP-9]
after: [11]
risk: low
---

# Refactor sweep

## Description

Test gaps and behaviour-neutral src/engine/ cleanup, plus listed done-plan corrections and the AGENTS.md follow-up; behaviour-changing items are Excluded with a reason (a new story only if the owner wants one).

## Scope

Sources: `2-N` is `_bmad-output/implementation-artifacts/review-loop/2-N-build.md` (exact case values are there); plans are in this folder. Files are under `src/engine/` unless noted. Done-plan corrections (S11, S22, S26, S31) are dated errata lines, not rewrites.

| # | Source | File(s) | Change |
| --- | --- | --- | --- |
| S1 | 2-3 Pass 3 open major | replay.test.ts | Two §2 rejecting cases on REDO_TAIL breaking REDO_T2: `{ ...REDO_T2, sourceCount: 2 }` (legal only before REDO_T1 commits) and REDO_T2 `sourceCount: 0` as last tail element, both → `r13-source-count` |
| S2 | 2-4 Pass 2 open major | commands.test.ts | R-13-named whole-column self-drop (Q-30), e.g. `drop(2, COL2.length, 2)`: k = 0 and `word(...).cards` equals the column (or rename the R-22 test `R-13 R-22 …`, adding the word assertion) |
| S3 | 2-6 Pass 2 open major | commands.test.ts | AD-2 command-table undo and redo rows on `sessionOf([...PREFIX, <committed draft>], { index: PREFIX.length, phase: 'committed' as never })`, both → `command-domain` (redo hits `redoAvailable`'s default, commands.ts:438; `redo`'s own is exhaustiveness-only); if replay rejects it first, the plan records the branch as exhaustiveness-only |
| S4 | 2-11 Pass 2 open major | serialize.test.ts | checkRecord `it.each`, one row per adjacent check pair, breaking checks n and n+1, asserting check n's code; pairs whose check n+1 cannot be broken alone are named in the plan instead |
| S5 | 2-3 Result (replay.test.ts:304) | replay.test.ts | Same adjacent-pair table over the AD-7 pre-replay order (today only seed → activeMs); same rule for unbreakable pairs |
| S6 | 2-2 + 2-3 Result | index.test.ts | AD-2 test with `import type` of every `export type` name of index.ts and `expectTypeOf`, so `npm run check` fails if one is dropped |
| S7 | 2-3 Result | replay.test.ts | Self-drop k = n + 1: `{ ...BASE, destinationColumn: 1, destinationCount: 4 }` → `r31-destination-count` |
| S8 | 2-3 Result | replay.test.ts | Lone-QU-card R-36 rejecting case: a committed one-card QU word (e.g. whole-column self-drop of a one-card QU column, k = 0) → `r36-letter-count` |
| S9 | 2-3 Result | replay.test.ts | REDO_DRAFT `targetCell: 4` inside REDO_TAIL → `r40-target-cell` |
| S10 | 2-3 Result | replay.test.ts:245-249, 265 | Rebuild each to break exactly one check: :245-249 (`ad7-cursor-phase`, cursor place) omits composingBase's Place fields; :265 (`ad7-place-fields`) keeps them with cursor `{ index: 0, phase: 'idle' }` |
| S11 | 2-3 Result | 2.3 plan | Implementation Notes name the 11-letter R-40 case (replay.test.ts:498) |
| S12 | 2-4 Result | commands.test.ts (D8 test) | Mid-M removal: arrange [I, N, W, Z], remove cell 4 → [I, W, Z] |
| S13 | 2-5 Result | commands.test.ts | R-42-named assertion that `placementOrder` equals `word(...).cards` (in `expectLegalTargets`, or rename the default-order test `R-42 R-51 …`) |
| S14 | 2-5 Result | commands.test.ts | In the R-51 test (default target 5): `setTarget(4)` then `setOrder(custom)` keeps `targetCell` 4 |
| S15 | 2-7 Result | scoring.test.ts:93-97 | Move the `lettersLeft` assertions into an R-81 test |
| S16 | 2-7 Result | scoring.test.ts | `liveScore(cellsWith({10:[Z]}), synthetic) === 20` (R-80) and `penalty(z, synthetic) === 20` (R-81) |
| S17 | 2-8 Result | view.test.ts | canValidate-false test: expected code from `session.cursor.phase` and a per-fixture status, not the view |
| S18 | 2-8 Result | view.test.ts | `isLegalTarget` checked against literal cells or `apply(setTarget)` |
| S19 | 2-8 Result | view.test.ts | STATES labelled-property assertions; each top-level GameView boolean flag true in ≥1 and false in ≥1 state |
| S20 | 2-8 Result | view.test.ts | TAP_STATES gains K0_SELF and K0_EMPTY |
| S21 | 2-8 Result | view.test.ts | STATES gains an Idle state with a committed pending draft and redo tail (`play(COMMITTED, [UNDO, UNDO, UNDO])`) |
| S22 | 2-8 Result | 2.8 plan | Note that the per-flag × state `it.each` meets the AC |
| S23 | 2-9 Result | history.test.ts | R-74 gaveUp(seed 1) → won(seed 1) variant |
| S24 | 2-9 Result | history.test.ts | `reconcile([...EARLIER, recordOf(GAVE_UP0)], GAVE_UP0, play(GAVE_UP0, [UNDO]))` → EARLIER |
| S25 | 2-9 Result | history.test.ts | "(A-E3)" in statistics test names lacking it; rename "R-84 a replay-invalid Session throws …" to an AD-6 id |
| S26 | 2-9 Result | 2.9 plan | Reword AC "Given R-74" "only in finalScore" (longestWord differs too) |
| S27 | 2-10 Result | serialize.test.ts (withDraft `it.each`) | placementOrder [9,32,52] and arrangement [32,−1] → `schema.domain-card`; destinationCount −1 → `schema.domain-count`; targetCell 2 → `schema.domain-cell` |
| S28 | 2-10 Result | serialize.test.ts | Non-string enums: cursor.phase null → `schema.enum-cursor-phase`, destinationSide 1 → `schema.enum-destination-side` |
| S29 | 2-10 + 2-11 Result | serialize.test.ts | Serialize a frozen version-2 copy: session output starts `{"version":2,`; history container and record versions both 2 |
| S30 | 2-10 + 2-11 Result | serialize.test.ts | Pin today's −0: one inline case per parser, `{"version":-0}` → `version-unknown` with version −0, and a plan note that an accepted −0 seed or activeMs serializes back as 0 |
| S31 | 2-2 Result | 2.2 plan | Correct the stale Auto Run Result to the state at bca5f0f (`index.test.ts` added, 425 tests, letterCount over all 52 cards plus `'qu'`), with a dated note also recording S37's trigger move |
| S32 | story-gameview-plan.md:115 | commands.ts | Merge `redoAvailable`/`redo`'s duplicated phase switch with the unreachable `never` default, leaving one, `redoAvailable`'s, pinned by S3's redo row |
| S33 | story-gameview-plan.md:119, 169 | src/engine/*.test.ts defining an identical copy | Move expect-free helpers whose copies are byte-identical (e.g. `deepFreeze`, `startOf`, `DICT`, `draftOf`, `drop`, `play`; builder confirms) into `src/engine/test-helpers.ts`, replacing every identical copy; differing ones (`seam`, `setTarget`, `sessionOf`, session.test.ts's `deepFreeze`) stay local. A non-test module imported only by `*.test.ts` (the `win-seed.ts` precedent), no vitest import, no own test file (exercised by its importers); if AD-1's scan or the spine rejects it, the row moves to Excluded |
| S34 | history-serialise plan:100 | serialize.ts | Shared version-stage helper for `parseSession` and `parseHistory` |
| S37 | langdata plan:134, golden-deal plan:86, scoring plan `deferred` | 2.12 plan (follow-up record) | AGENTS.md Known pitfalls' two stale sentences (STUCK_PENALTY_PER_CARD scaffold; deal.test.ts tests "not id-named"): not hand-edited; the plan's result records a `bmad-project-context` follow-up at the epic retrospective, moving the trigger from entry 12 (langdata plan:89, :134), which this sweep does not run |

S32 and S34 are behaviour-neutral: test rows land first, their commits touch no test file, the command table, view agreement and serialize tests pass unchanged across each, and no engine export or signature changes (index.ts plus view.ts's internal imports `redoAvailable`, `undoAvailable`, `giveUpAvailable`).

### Dropped (already fixed)

- 2.6 deferred non-integer or unknown cursor: 2.10 `parseSession` schema stage (`type-cursor-index`, `enum-cursor-phase`).
- 2.7 negative give-up in the lowest band: scoring.test.ts `R-81 give up at the deal`.
- 2.3 plan residual on malformed Sessions reaching replay: 2.10 schema stage.
- `sameDraftData` omits cursor/gaveUp: composing-commands plan:123 and validate-and-place plan:129 confirm it is complete for its only callers (commands.ts:133, :160).
- 2-8 `giveUpAvailable` restating prelude: kept by design (gameview plan:99; separate `command-status`/`command-phase` codes); pinned by the canGiveUp agreement test.
- 2.2 `PENALTY_PER_LETTER` consumer (2.7), 2.7 GameView wiring (2.8), 2.4–2.6 recommended follow-up reviews (2-4…2-6 code review loops): done.
- Composing-commands plan:152 residual (invalid seed throws `seed-uint32` before `command-type`): documented (plan:90, `apply`'s doc comment).

### Excluded

- −0 normalisation (would change behaviour; S30 pins today's).
- A `dictionary: null` guard (2.5 residual, triaged false).
- gameview plan:169 residual, `canSetTarget`'s no-op and `canConfirm` inline (pinned by agreement tests).
- Command-table "readability refactors" (2.4 ticket decision; no concrete finding recorded).
- Accepted residuals, not cleanup: 2.5 per-call word re-derivation; 2.6 winSeed proven on two seeds; 2.9 once-per-command reconcile (epic-3 shell); 2.10/2.11 hand-reviewed fixture bases, three-records regeneration note.

## Acceptance Criteria

- Every change maps to a Scope row; every row is done or moved to Excluded/Dropped with a reason in the plan.
- No engine behaviour change: engine exports (as above) and command-table outcomes unchanged; existing tests change only as a Scope row prescribes (none deleted or weakened).
- New and renamed tests are id-first named (AGENTS.md Conventions); the unit suite stays under 5 s (AD-17).
- The plan names, for each gap-closing test, the mutant or wrong implementation it catches (from the source log, else one the builder names and shows failing on a reverted mutation, test name and failure recorded).
- Verify: `npm run test:all` is green and the R-02 golden deal literals are unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- review logs — _bmad-output/implementation-artifacts/review-loop/2-1-build.md … 2-11-build.md
- autopilot log — _bmad-output/implementation-artifacts/autopilot/epic-rules-engine-20260928-2138.md
- done tickets' plans — `*-plan.md` in this folder
