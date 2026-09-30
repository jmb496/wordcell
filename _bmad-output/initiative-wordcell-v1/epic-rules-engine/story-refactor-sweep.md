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

Test gaps and behaviour-neutral cleanup in src/engine/, plus the listed corrections to done plans and the AGENTS.md follow-up; any item that would change engine behaviour is Excluded and becomes a new story.

## Scope

Sources: `2-N` is `_bmad-output/implementation-artifacts/review-loop/2-N-build.md` (exact case values are there); plans are in this folder. Files are under `src/engine/` unless noted.

| # | Source | File(s) | Change |
| --- | --- | --- | --- |
| S1 | 2-3 Pass 3 open major | replay.test.ts | Two §2 rejecting cases on REDO_TAIL breaking REDO_T2: `{ ...REDO_T2, sourceCount: 2 }` (legal only before REDO_T1 commits) and REDO_T2 `sourceCount: 0` as last tail element, both → `r13-source-count` |
| S2 | 2-4 Pass 2 open major | commands.test.ts | R-13-named whole-column self-drop (Q-30), e.g. `drop(2, COL2.length, 2)`: k = 0 and `word(...).cards` equals the column (or rename the R-22 test `R-13 R-22 …` and add the word assertion) |
| S3 | 2-6 Pass 2 open major | commands.test.ts | AD-2 command-table undo row on `sessionOf([...PREFIX, <committed draft>], { index: PREFIX.length, phase: 'committed' as never })` → `command-domain`; if `checkSession` rejects it first, the plan records the branch as exhaustiveness-only |
| S4 | 2-11 Pass 2 open major | serialize.test.ts | checkRecord `it.each`, one row per adjacent check pair, breaking checks n and n+1, asserting check n's code |
| S5 | 2-3 Result (replay.test.ts:304) | replay.test.ts | Same adjacent-pair table over the AD-7 pre-replay order (today only seed → activeMs) |
| S6 | 2-2 + 2-3 Result | index.test.ts | AD-2 test with `import type` of every AD-2 type export and `expectTypeOf`, so `npm run check` fails if one is dropped |
| S7 | 2-3 Result | replay.test.ts | Self-drop k = n + 1: `{ ...BASE, destinationColumn: 1, destinationCount: 4 }` → `r31-destination-count` |
| S8 | 2-3 Result | replay.test.ts | Lone-QU-card R-36 rejecting case |
| S9 | 2-3 Result | replay.test.ts | REDO_DRAFT `targetCell: 4` inside REDO_TAIL → `r40-target-cell` |
| S10 | 2-3 Result | replay.test.ts:245-249, 265 | Rebuild each to break exactly one check (cursor `{ index: 0, phase: 'idle' }`, no Place fields) |
| S11 | 2-3 Result | 2.3 plan | Implementation Notes name the 11-letter R-40 case (replay.test.ts:498) |
| S12 | 2-4 Result | commands.test.ts (D8 test) | Mid-M removal: arrange [I, N, W, Z], remove cell 4 → [I, W, Z] |
| S13 | 2-5 Result | commands.test.ts | R-42-named assertion that `placementOrder` equals `word(...).cards` (in `expectLegalTargets`, or rename the default-order test `R-42 R-51 …`) |
| S14 | 2-5 Result | commands.test.ts | `setTarget(4)` then `setOrder(custom)` keeps `targetCell` 4 |
| S15 | 2-7 Result | scoring.test.ts:93-97 | Move the `lettersLeft` assertions into an R-81 test |
| S16 | 2-7 Result | scoring.test.ts | `liveScore(cellsWith({10:[Z]}), synthetic) === 20` (R-80) and `penalty(z, synthetic) === 20` (R-81) |
| S17 | 2-8 Result | view.test.ts | canValidate-false test: expected code from `session.cursor.phase` and a per-fixture status, not the view |
| S18 | 2-8 Result | view.test.ts | `isLegalTarget` checked against literal cells or `apply(setTarget)` |
| S19 | 2-8 Result | view.test.ts | STATES labelled-property assertions; each flag true in ≥1 and false in ≥1 state |
| S20 | 2-8 Result | view.test.ts | TAP_STATES gains K0_SELF and K0_EMPTY |
| S21 | 2-8 Result | view.test.ts | STATES gains an Idle state with a committed pending draft and redo tail (`play(COMMITTED, [UNDO, UNDO, UNDO])`) |
| S22 | 2-8 Result | 2.8 plan | Note that the per-flag × state `it.each` meets the AC |
| S23 | 2-9 Result | history.test.ts | R-74 gaveUp(seed 1) → won(seed 1) variant |
| S24 | 2-9 Result | history.test.ts | `reconcile([...EARLIER, recordOf(GAVE_UP0)], GAVE_UP0, play(GAVE_UP0, [UNDO]))` → EARLIER |
| S25 | 2-9 Result | history.test.ts | "(A-E3)" in statistics test names lacking it; rename "R-84 a replay-invalid Session throws …" to an AD-6 id |
| S26 | 2-9 Result | 2.9 plan | Reword AC "Given R-74" "only in finalScore" (longestWord differs too) |
| S27 | 2-10 Result | serialize.test.ts (withDraft `it.each`) | placementOrder [9,32,52] and arrangement [32,−1] → `schema.domain-card`; destinationCount −1 → `schema.domain-count`; targetCell 2 → `schema.domain-cell` |
| S28 | 2-10 Result | serialize.test.ts | Non-string enums: cursor.phase null → `schema.enum-cursor-phase`, destinationSide 1 → `schema.enum-destination-side` |
| S29 | 2-10 + 2-11 Result | serialize.test.ts | Frozen version-2 round trips: session output starts `{"version":2,`; history container and record versions both 2 |
| S30 | 2-10 + 2-11 Result | serialize.test.ts | Pin today's −0: one inline case per parser, `{"version":-0}` → `version-unknown` with version −0 |
| S31 | 2-2 Result | 2.2 plan | Correct the stale Auto Run Result |
| S32 | story-gameview-plan.md:115 | commands.ts | Merge `redoAvailable`/`redo`'s duplicated phase switch with the unreachable `never` default |
| S33 | story-gameview-plan.md:119, 169 | commands.test.ts, view.test.ts (history.test.ts if shared) | Move duplicated helpers into `src/engine/test-helpers.ts`, a non-test module imported only by `*.test.ts`, no vitest import; if AD-1's scan or the spine rejects it, the row moves to Excluded with the reason |
| S34 | history-serialise plan:100 | serialize.ts | Shared version-stage helper for `parseSession` and `parseHistory` |
| S35 | 2-8 Result | commands.ts | `giveUp`'s reducer calls `giveUpAvailable` instead of restating `prelude`'s gates |
| S36 | composing-commands plan:152 | commands.ts, rules.ts | `sameDraftData` compares draft data only, not cursor/gaveUp: confirm it is correct for every caller in commands.ts and record it in the plan, or add a pinning test |
| S37 | langdata plan:134, golden-deal plan:86, scoring plan `deferred` | AGENTS.md | Known pitfalls' two stale sentences (STUCK_PENALTY_PER_CARD scaffold; deal.test.ts tests "not id-named"): not hand-edited; the plan's result records a follow-up for `bmad-project-context` at the epic retrospective |

S32, S34 and S35 are behaviour-neutral: the commands.test.ts table and the existing view agreement and serialize tests pass unchanged before and after, and no engine export changes.

### Dropped (already fixed)

- 2.6 deferred non-integer or unknown cursor: 2.10 `parseSession` schema stage (`type-cursor-index`, `enum-cursor-phase`).
- 2.7 negative give-up in the lowest band: scoring.test.ts `R-81 give up at the deal`.
- 2.3 plan residual on malformed Sessions reaching replay: 2.10 schema stage.

### Excluded

- −0 normalisation (would change behaviour; S30 pins today's).
- A `dictionary: null` guard (2.5 residual; triaged false in 2.5).
- Command-table "readability refactors" (2.4 ticket decision; no concrete finding recorded).

## Acceptance Criteria

- Every change maps to a Scope row and nothing outside the rows changes; every row is done or moved to Excluded/Dropped with a reason recorded in the plan.
- No engine behaviour change: engine exports and command-table outcomes unchanged; existing tests pass unchanged except the listed renames and fixture fixes.
- New and renamed tests are id-first named (AGENTS.md Conventions); the unit suite stays under 5 s (AD-17).
- The plan names, for each gap-closing test, the mutant or wrong implementation it catches (from the source log).
- Verify: `npm run test:all` is green and the R-02 golden deal literals are unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- review logs — _bmad-output/implementation-artifacts/review-loop/2-2-build.md … 2-11-build.md
