---
id: 4
type: story
title: "Composing commands and the command table"
parent: epic-rules-engine
covers: [CAP-4]
after: [3]
risk: medium
---

# Composing commands and the command table

## Description

Creates src/engine/commands.test.ts opening with the executable AD-2 command table and implements apply, in the check order of build-notes CAP-4 (the one statement of it), for drop, tapDestinationCard, setDestinationCount, flip, addFreeLetter, removeFreeLetter and arrange: R-71 edit and advance semantics, no-op by value, D8 freeLetters order, applyFrom on the D2 seam, and their table rows with check codes; validate and the Place commands are entry 5; the R-12, R-31 and R-33 flag and kIfTapped tests are entry 8's.

- Public surface: `src/engine/index.ts` gains `apply` and the types `Command`, `ApplyContext` (`{ lang; dictionary? }`) and `ApplyResult` (AD-2); the `AD-2 index exports …` test (`src/engine/index.test.ts`) adds `'apply'` to its list and name. `Command` holds only these seven commands; `apply` dispatches with an exhaustive `never` switch, and entries 5 and 6 widen the union (no not-implemented branch, AGENTS.md rule 6).
- No-op by value (AD-2, before R-71 lowering) is compared only after every throw check (status, phase, domain, rule) passes, so `setDestinationCount { k: 0 }` on an empty destination throws the R-31 code, never a no-op.
- Check codes: reducers call the existing `rules.ts` guards and reuse their codes where the check is the same rule; new kebab-case codes only for command-only checks (status, phase, domain, e.g. `tap-not-in-destination`, `free-letter-absent`), each unique and added to `errors.ts` "Codes in use".
- Domain vs rule: the domain check is type, integer-ness and id ranges (columns 1–8, cells 3–10, `CardId` 0–51); count and index ranges (`sourceCount`, k, `addFreeLetter` index outside 0…|M|) are rule checks with that rule's code.
- R-30: an internal word helper in `rules.ts` (the word's CardIds D_left + M + D_right and its R-37 lowercase string, `QU` → "qu"), not exported from `index.ts`, reused by entries 5 and 8.
- Inputs: Place-phase and redo-data inputs are hand-written Session literals that `replay` accepts (Place-reached draft with `targetCell`/`placementOrder`, cursor phase place); status rows use a hand-built Idle `gaveUp: true` Session. Won status rows are entry 6's (won helper).
- D2 split: table rows and at least one test per command go through public `apply`; `applyFrom` only for positions no seed deals.
- Each table row deep-freezes its Session, command and ctx (`EN` is already frozen by its constructor).

## Acceptance Criteria

- Verify: npm run test:all is green.
- Every row for the seven commands passes: no-op rows assert `result.session === input` and no `rejectedWord` key; throw rows assert `EngineError` with the named check code.
- Row names are `<id> <command> <AD-2 precondition> → noop|throw`, id = the R-id rule-coverage attributes to the row (e.g. R-13, R-31, R-33, R-35, R-71), else AD-2; the plan's sentence → test mapping cites rows by that name.
- Rows, AD-2 wording as precondition text, one row per case:
  - AD-2 fixed cases: `drop` with `sourceCount` 0, larger than the column, or from an empty source column → throw; `setDestinationCount` equal to k → no-op, outside 1…n → throw, any value on an empty destination → throw; `tapDestinationCard` on the top of D at k = 1 → no-op, on a card not in the destination after R-21 (including an S card of a self-drop) → throw; `flip` at k = 0 (including a whole-column self-drop) → no-op; `addFreeLetter` on a used or empty cell or `index` outside 0…|M| → throw; `removeFreeLetter` on a cell not in `freeLetters` → throw; `arrange` equal in value → no-op, not a permutation of S ∪ F → throw.
  - An equal-value no-op row for every command where one exists (R-71 non-edit).
  - One wrong-phase row per command per invalid §4 phase.
  - One status row per command on the `gaveUp` Session, asserting the status code (status precedes phase).
  - Domain: for each id or number field of the seven commands, an out-of-range and a non-integer value (including non-integer `drop.sourceCount` and `addFreeLetter.index`) → throw with the domain code.
- An `R-33 …` test: `addFreeLetter` with `index` = |M| equals the default append.
- A `§2 …` test: a drop in Idle over a pending draft and redo tail writes the new draft at `moves[cursor.index]` and truncates the tail.
- `R-71 …` tests: each Composing edit command on a Place-reached (or committed) Composing draft with a redo tail deletes `targetCell`/`placementOrder`, sets `reached` 'composing' and drops later moves; R-71's enablement, undo/redo and remaining discard cases are entry 6's.
- `R-30 …` tests run the word helper on D2-seam drafts, including the STA…/…ATS example and a `QU` card on the right side.
- An `R-12 …` test: `drop` has no WordCell source (`@ts-expect-error` on a cell-source field), plus the `drop` `sourceColumn` 0 and 9 rows throwing the domain code; the canPickUp half is entry 8's.
- An `R-39 …` test: `{ type: 'cancel' }` is not assignable to `Command` (`@ts-expect-error`); R-39's Undo-from-Composing sentence is entry 6's.
- Tests cover the CAP-4 sentences of R-10–R-13, R-20–R-23 and R-30–R-35; the R-31/R-33 flag and kIfTapped sentences and R-12 canPickUp are entry 8's.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-4, D2, D8
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-4 Commands
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, §2 rows and R-10–R-39 rows
- spine — ARCHITECTURE-SPINE.md AD-2
- rules — docs/game-flow-spec.md §2, §4
- prior plan — _bmad-output/initiative-wordcell-v1/epic-rules-engine/story-session-createsession-replay-and-checksession-plan.md (rules.ts guards, D2 seam)

## Notes

- Decision (technical default): the table uses the build-notes CAP-4 row shape plus the expected check code on throw rows; grouping by `describe` per command is allowed; readability refactors go to entry 12.
