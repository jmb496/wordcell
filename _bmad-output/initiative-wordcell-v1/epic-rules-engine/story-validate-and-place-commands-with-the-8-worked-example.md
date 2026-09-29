---
id: 5
type: story
title: "Validate and Place commands with the §8 worked example"
parent: epic-rules-engine
covers: [CAP-4]
after: [4]
risk: medium
---

# Validate and Place commands with the §8 worked example

## Description

Adds validate, setTarget, setPlacementOrder and confirm with R-36–R-38, R-40–R-42, R-50–R-52 and the R-60 commit through apply, their command-table rows, and the §8 worked example (BAKED, BALKED, FAKED, FLAKED; DEKA… impossible) on a hand-built start through the D2 seam.

- validate checks, in build-notes CAP-4 order: status → phase → `ctx.dictionary` present (`ctx.dictionary === undefined`, an absent key or undefined value, is missing and throws `command-dictionary`) → R-36 → membership (a value result, not a throw); rejectedWord is the R-37 lowercase string.
- Check codes: new `command-dictionary` (added to `errors.ts`'s Commands list between `command-phase` and `command-domain`, the check order); reused `r36-letter-count`, `r40-target-cell`, `r50-placement-order` via `checkLetterCount`, `checkTargetCell`, `checkPlacementOrder`, now exported from `rules.ts` so replay and the commands share one guard per code (the three codes join `errors.ts`'s Commands "reused" list); `command-domain` for a setTarget cell outside 3–10 or non-integer and a non-array order, `card-id-domain` for order elements.
- R-71 split: this ticket implements and tests the advance/edit semantics of its four commands; enablement, undo and redo stay entry 6's. A successful Validate and confirm are advances (Validate discards redo data once membership passes; confirm discards it first, R-60); a failed Validate returns the input reference plus rejectedWord (R-38); setTarget and setPlacementOrder are R-71 Place edits (set reached 'place', drop the moves after the draft); AD-2 equal → no-op, illegal target / non-permutation → throw. The successful-Validate advance, plain failed-Validate, setTarget/setPlacementOrder edit and equal-value no-op tests use public `apply` on engine-valid Sessions built from a real seed (as `commands.test.ts` does); the legal-target, QU (including the "qu" failed Validate), boundary and §8 cases use the D2 seam (SPEC D2) through `commands.test.ts`'s existing `seam(start, commands)` helper.
- No-op comparison: a successful Validate and confirm are advances and never no-ops (a failed Validate is R-38's input reference plus rejectedWord); the setTarget/setPlacementOrder no-ops compare the draft data plus cursor and gaveUp per AD-2 (`sameDraftData` suffices since these commands never change cursor or gaveUp).
- Out of scope per rule-coverage: R-37 list construction (AD-8); R-38 dictionary loading (P3) and the inactive Validate control (canValidate, entry 8); R-42 pre-selection (UI); R-50 "The UI shows which card lands…" (P4–6); R-36 structural reason and can* flags (entry 8); R-60 "Redo commits without discarding" (entry 6).

## Acceptance Criteria

- Verify: npm run test:all is green with the new table rows, the R-36–R-38, R-40–R-42, R-50–R-52 and R-60 tests and the §8 test passing.
- New table rows, in ticket 2.4's row format and naming (`<id> <command> <AD-2 precondition> → noop|throw`); every validate row except the missing-dictionary one is built with a dictionary:
  - Wrong phase (§4): every Idle row uses the existing Idle Session over a committed pending draft and a redo tail (`PENDING_TAIL`), so a confirm that commits the pending draft fails; validate in Idle and in Place; setTarget, setPlacementOrder and confirm in Idle and in Composing.
  - Status (R-75): one gaveUp row per command; won rows stay entry 6's.
  - validate without `ctx.dictionary` → throw `command-dictionary`, including a too-short draft (dictionary precedes R-36); validate on the gaveUp Session without a dictionary → `command-status`; validate in Idle without a dictionary → `command-phase`; validate too short with a dictionary → throw `r36-letter-count`.
  - setTarget equal → no-op (R-71); above L → throw `r40-target-cell`.
  - setPlacementOrder equal → no-op (R-71); not a permutation (a missing card, a duplicate, a foreign card) → throw `r50-placement-order`.
  - Domain (AD-2): setTarget cell 2, 11 and 3.5 → `command-domain`; setPlacementOrder a non-array → `command-domain`, an element 52 or 1.5 → `card-id-domain`.
  - Equal-value no-op rows use an input with redo data (reached 'committed' plus a redo tail), so lowering before the comparison fails them.
- validate outcomes (R-37, R-38, R-71):
  - A failed Validate (word not in the set) returns the input reference plus `rejectedWord` (the R-37 string; one case a QU word giving "qu"), changes no field and keeps the redo data.
  - A successful Validate on a Composing draft that had reached 'committed', with a redo tail and a non-default stored target and order, sets reached 'place', recomputes the R-42/R-51 defaults, drops the tail, moves cursor to place (not committed: no auto-confirm, R-38), and its result has no `rejectedWord` key (`toStrictEqual`).
  - R-38-named: drop, arrange and setTarget without `ctx.dictionary`, on a draft whose word is in no set, never throw `command-dictionary` or return `rejectedWord` (only validate reads the dictionary).
- Legal targets (R-40–R-42), asserted as validate's default targetCell = min(L, 10), setTarget accepted (does not throw: the current target is the equal no-op, any other legal cell an edit) for every cell up to it and, when the default is below 10, setTarget on the next cell throwing `r40-target-cell` (at default 10 there is no higher cell; setTarget 11 is the `command-domain` row); built on D2 starts:
  - QU: a 4-card word containing QU (L = 5) → default 5; setTarget 6 throws.
  - Letter count exactly 10 → default 10, and letter count ≥ 11 (e.g. 11 cards, or 10 cards including QU) → default 10; every cell 3–10 accepted in both.
  - L = 3 → default 3; setTarget 4 throws.
  - R-36 QU boundary: a 2-card word with QU (count 3, e.g. "qua") validates; a 2-card plain word throws `r36-letter-count`.
- R-51: with destinationSide 'right' and k ≥ 2, validate's default placementOrder equals the word's cards in word order (M then D reversed, per R-30 / `rules.ts` `word()`), last letter on top; setPlacementOrder then setTarget keeps the custom order ("changing the target does not reset the order").
- R-50: setPlacementOrder accepts a non-default permutation interleaving S, F and D cards (a D card on top; the §8 BALKED position suits), and confirm then pushes exactly that order onto the target.
- setTarget and setPlacementOrder, each on a Place draft with a redo tail, set reached 'place', drop the moves after the draft and give the commanded targetCell / placementOrder (R-71).
- R-60: confirm through public apply on a Place draft with a redo tail discards the tail first, sets reached 'committed' and cursor {index + 1, idle}; the replayed position has S, D and the used free letters removed and placementOrder pushed onto the target.
- §8 worked example (tests named `§8 worked example …`), start built per build-notes CAP-4 §8, inline set holding the four words; each variant (BAKED, BALKED + confirm, FAKED, FLAKED, the k = 1 tap, the setDestinationCount 0 throw) starts from a fresh Idle Session over the §8 start; the word variants are driven drop → (setDestinationCount / addFreeLetter) → arrange → validate, the tap and setDestinationCount 0 variants stop after the drop onto col3:
  - BAKED validates with default target 5; setTarget accepts 3–5 and 6 throws.
  - `R-41 §8 BALKED …` (adding cell 6's L): default target 6, accepts 3–6, cell 6 legal via an edit (setTarget 5 then 6); confirm onto cell 6 leaves the L once, in the word on cell 6.
  - The col1 self-drop gives k = 1 with D = col1's F; FAKED and FLAKED each validate with no `rejectedWord`, default target 5 and 6.
  - After the col3 drop, the tap on B (top of D at k = 1) returns the same reference.
  - `setDestinationCount` 0 on col3 throws `r31-destination-count` (DEKA… impossible).
- R-52: after BALKED is confirmed onto cell 6, a new drop then addFreeLetter { cell: 6 } uses the last card of the committed placementOrder (cell 6's new top), not the L.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-4, D2
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-4 Commands (check order, table row shape, §8 construction, inline set)
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, §4 rows R-36–R-60
- spine — ARCHITECTURE-SPINE.md AD-2
- rules — docs/game-flow-spec.md, §8 worked example
- prior plan — _bmad-output/initiative-wordcell-v1/epic-rules-engine/story-composing-commands-and-the-command-table-plan.md (codes, row naming, startOf helper, sameDraftData)

## Notes

- Open question: None; row shape and naming follow ticket 2.4.
