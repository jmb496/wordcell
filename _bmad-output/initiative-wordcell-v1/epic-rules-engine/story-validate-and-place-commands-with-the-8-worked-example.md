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

Adds validate, setTarget, setPlacementOrder and confirm with R-40–R-42, R-50–R-52 and the R-60 commit through apply, their command-table rows, and the §8 worked example (BAKED, BALKED, FAKED, FLAKED; DEKA… impossible) on a hand-built start through the D2 seam.

- validate checks, in build-notes CAP-4 order: status → phase → `ctx.dictionary` present → R-36 → membership (a value result, not a throw); rejectedWord is the R-37 lowercase string.
- Check codes: new `command-dictionary` (added to `errors.ts` "Codes in use"); reused `r36-letter-count`, `r40-target-cell`, `r50-placement-order` (via the `rules.ts` guards), `command-domain` for a setTarget cell outside 3–10 or non-integer and a non-array order, `card-id-domain` for order elements.
- R-71 split: this ticket implements and tests the advance/edit semantics of its four commands on hand-built engine-valid Sessions with a redo tail; enablement, undo and redo stay entry 6's. validate and confirm are advances (discard redo data first); setTarget and setPlacementOrder are R-71 Place edits (set reached 'place', drop the moves after the draft); AD-2 equal → no-op, illegal target / non-permutation → throw.
- No-op comparison: validate and confirm are advances and never no-ops; the setTarget/setPlacementOrder no-ops compare the draft data plus cursor and gaveUp per AD-2 (`sameDraftData` suffices since these commands never change cursor or gaveUp).
- Out of scope per rule-coverage: R-37 list construction (AD-8); R-38 dictionary loading (P3) and the inactive Validate control (canValidate, entry 8); R-42 pre-selection (UI); R-50 "The UI shows which card lands…" (P4–6); R-36 structural reason and can* flags (entry 8); R-60 "Redo commits without discarding" (entry 6).

## Acceptance Criteria

- Verify: npm run test:all is green with the new table rows, the R-36–R-38, R-40–R-42, R-50–R-52 and R-60 tests and the §8 test passing.
- New table rows, in ticket 2.4's row format and naming (`<id> <command> <AD-2 precondition> → noop|throw`); every validate row except the missing-dictionary one is built with a dictionary:
  - Wrong phase (§4): validate in Idle (with a pending draft) and in Place; setTarget, setPlacementOrder and confirm in Idle and in Composing.
  - Status (R-75): one gaveUp row per command; won rows stay entry 6's.
  - validate without `ctx.dictionary` → throw `command-dictionary`, including a too-short draft (dictionary precedes R-36); validate too short with a dictionary → throw `r36-letter-count`.
  - setTarget equal → no-op (R-71); above L → throw `r40-target-cell`.
  - setPlacementOrder equal → no-op (R-71); not a permutation (a missing card, a duplicate, a foreign card) → throw `r50-placement-order`.
  - Domain (AD-2): setTarget cell 2, 11 and 3.5 → `command-domain`; setPlacementOrder a non-array → `command-domain`, an element 52 → `card-id-domain`.
  - Equal-value no-op rows use an input with redo data (reached 'committed' plus a redo tail), so lowering before the comparison fails them.
- validate outcomes (R-37, R-38, R-71):
  - A failed Validate (word not in the set) returns the input reference plus `rejectedWord` (the R-37 string; one case a QU word giving "qu"), changes no field and keeps the redo data.
  - A successful Validate on a Composing draft that had reached 'committed', with a redo tail and a non-default stored target and order, sets reached 'place', recomputes the R-42/R-51 defaults, drops the tail, moves cursor to place, and its result has no `rejectedWord` key (`toStrictEqual`).
- Legal targets (R-40–R-42), asserted as validate's default targetCell = min(L, 10), setTarget accepted for every cell up to it and setTarget on the next cell throwing `r40-target-cell`; built on D2 starts:
  - QU: a 4-card word containing QU (L = 5) → default 5; setTarget 6 throws.
  - A word of letter count ≥ 11 → default 10; every cell 3–10 accepted.
  - L = 3 → default 3; setTarget 4 throws.
  - R-36 QU boundary: a 2-card word with QU (count 3, e.g. "qua") validates; a 2-card plain word throws `r36-letter-count`.
- R-51: with destinationSide 'right' and k ≥ 2, validate's default placementOrder equals the word's cards in word order (M then D reversed, per R-30 / `rules.ts` `word()`), last letter on top; setPlacementOrder then setTarget keeps the custom order ("changing the target does not reset the order").
- setTarget and setPlacementOrder, each on a Place draft with a redo tail, set reached 'place' and drop the moves after the draft (R-71).
- R-60: confirm through public apply on a Place draft with a redo tail discards the tail first, sets reached 'committed' and cursor {index + 1, idle}; the replayed position has S, D and the used free letters removed and placementOrder pushed onto the target.
- §8 worked example, start built per build-notes CAP-4 §8, inline set holding the four words:
  - BAKED validates with default target 5; setTarget 6 throws.
  - BALKED (adding cell 6's L) gives target 6 and cell 6 stays legal (R-41); confirming BALKED onto cell 6 places the L once, travelling with the word.
  - A self-drop on col1 gives FAKED and FLAKED.
  - The top-of-D tap at k = 1 returns the same reference.
  - `setDestinationCount` 0 on col3 throws `r31-destination-count` (DEKA… impossible).

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
