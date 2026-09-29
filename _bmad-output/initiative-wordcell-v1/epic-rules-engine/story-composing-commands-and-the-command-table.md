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

- Public surface: `src/engine/index.ts` gains `apply` and the types `Command`, `ApplyContext` (`{ lang; dictionary? }`) and `ApplyResult` (AD-2); the `AD-2 index exports …` test (`src/engine/index.test.ts`) adds `'apply'` to its list and name. `Command` holds only these seven commands; `apply` dispatches with an exhaustive `never` switch, and entries 5 and 6 widen the union (no not-implemented branch, AGENTS.md rule 6); the switch's default throws `EngineError` `command-type`.
- No-op by value (AD-2, before R-71 lowering) is compared only after every throw check (status, phase, domain, rule) passes, so `setDestinationCount { k: 0 }` on an empty destination throws `r31-set-count-empty-destination`, never a no-op (fields per AD-2, excluding `reached` and the redo tail).
- Check codes: `rules.ts` exports its individual guards (internal, not from `index.ts`); a reducer calls the one guard for its precondition with the draft's `cursor.index` as the move index and reuses its code (used cell → `r33-free-letter-duplicate`, empty cell → `r33-free-letter-empty`, drop count/empty source → `r13-source-count`, k outside 1…n on a non-empty destination → `r31-destination-count`, non-permutation arrange → `r35-arrangement`, `arrange` building F from the `freeLetters` cells' top cards and calling only `checkArrangement`); `card` and each `arrangement` element reuse `assertCardId` (`card-id-domain`); new kebab-case codes, each unique and added to `errors.ts` "Codes in use", only for checks with no guard: `command-type`, one `command-status`, one `command-phase` and one `command-domain` code, and rule checks with no replay guard following the rule's scheme (`r31-tap-not-in-destination`, `r33-free-letter-absent`, `r31-set-count-empty-destination` (any `setDestinationCount` on an empty destination, checked before the no-op comparison), `r33-free-letter-index`).
- Domain vs rule: the domain check is type, integer-ness and id ranges (columns 1–8, cells 3–10, `CardId` 0–51); count and index ranges (`sourceCount`, k, `addFreeLetter` index outside 0…|M|) are rule checks with that rule's code.
- R-30: an internal word helper in `rules.ts` (the word's CardIds D_left + M + D_right and its string via the internal `spelling`), not exported from `index.ts`, reused by entries 5 and 8.
- Inputs: Place-phase and redo-data inputs are hand-written Session literals that `replay` accepts (Place-reached draft with `targetCell`/`placementOrder`, cursor phase place); so are positions needing committed moves (non-empty WordCells for addFreeLetter/removeFreeLetter/index rows and the R-33 tests, an emptied source column for `drop` from an empty column), their committed moves written into the literal; only the command under test goes through public `apply`; status rows use a hand-built Idle `gaveUp: true` Session. Won status rows are entry 6's (won helper).
- D2 split: table rows and at least one test per command go through public `apply`; `applyFrom` only for tableau shapes no replayable move sequence reaches (e.g. §8, full columns, QU edges).
- Each table row deep-freezes its Session, command and ctx (`EN` is already frozen by its constructor).

## Acceptance Criteria

- Verify: npm run test:all is green.
- Every row for the seven commands passes: no-op rows assert `result.session === input` and no `rejectedWord` key; throw rows assert `EngineError` with the named check code.
- Row names are `<id> <command> <AD-2 precondition> → noop|throw`, id in AGENTS.md order: the R-id rule-coverage attributes to the row (e.g. R-13, R-31, R-33, R-35), else §/Q-id, else AD-2. Status rows → R-75 (rule-coverage R-75 "every command except `undo` throws while not playing"); wrong-phase rows → §4 ("§4 preamble … Command table rows"); the k = 0 flip and k = 1 top-of-D tap no-op rows → R-31; the equal-value no-op rows (`setDestinationCount` equal to k, arrange equal) → R-71; the D-card arrange row → R-32, missing-free-letter → R-33, the other arrange throw rows R-35; the `drop` `sourceColumn` 0/9 domain rows → R-12, other domain rows AD-2. Wrong-phase and status names append the phase or status, e.g. `§4 drop a command in the wrong phase (composing) → throw`, `R-75 flip a command while status ≠ playing (gaveUp) → throw`. The plan's sentence → test mapping cites rows by that name, and the R-31 no-op rows for R-71 too.
- Rows, AD-2 wording as precondition text, one row per case:
  - AD-2 fixed cases: `drop` with `sourceCount` 0, larger than the column, or from an empty source column → throw; `setDestinationCount` equal to k → no-op, k = 0 and k = n + 1 (partial self-drop, n = column size after R-21) → throw, k = 0 on an empty destination → throw `r31-set-count-empty-destination`; `tapDestinationCard` on the top of D at k = 1 → no-op, on a card not in the destination after R-21 → throw, and a separate row on an S card of a self-drop → throw; `flip` at k = 0 (drop onto another, empty column) → no-op, and a separate row on a whole-column self-drop → no-op; `addFreeLetter` on a used or empty cell, `index` −1, `index` |M| + 1 → throw; `removeFreeLetter` on a cell not in `freeLetters` → throw; `arrange` equal in value → no-op, not a permutation of S ∪ F (a missing S card, a missing free letter (R-33), a D card included (R-32), a duplicated card) → throw `r35-arrangement`.
  - Equal-value no-op rows exist only for `arrange`, `setDestinationCount` and the R-31 flip/tap cases (R-71 non-edit); `drop` never (it moves the cursor). Each equal-value/R-31 no-op row uses an input with redo data (a committed Composing draft with a redo tail, or a Place-reached Composing draft), so lowering before the comparison fails it.
  - One wrong-phase row per command per invalid §4 phase (`drop` valid in Idle, the six others in Composing; so `drop`: Composing, Place; others: Idle, Place); the Idle rows for the six Composing commands use an Idle Session with a pending draft.
  - One status row per command on the `gaveUp` Session, asserting the status code (status precedes phase).
  - One row for an unknown `type` (cast `as unknown as Command`) → throw `command-type`.
  - Domain: out-of-range and non-integer rows with `command-domain` (`card`, `arrangement`: `card-id-domain`) for id fields (`sourceColumn`, `destinationColumn`, `card`, `cell`, each `arrangement` element); `sourceCount`, k and `index` get only a non-integer domain row, their range cases being the rule rows above. `index` is absent only when the key is absent (`Object.hasOwn`); a present `index: undefined` is a non-integer row.
- An `R-33 …` test: `addFreeLetter` with `index` = |M| equals the default append.
- An `R-33 …` test (D8): two adds, the second at index 0 → `freeLetters` in add order and `arrangement` with the second free letter first; removing the first leaves the rest of both arrays in order (`toStrictEqual`).
- An `R-23 …` test: drops onto non-empty destinations of varied lengths → k = 1, and onto an empty one → k = 0; each draft also has `destinationSide` 'left', `freeLetters` [] and `arrangement` = S top-to-bottom (`toStrictEqual`).
- A `§2 …` test: a drop in Idle over a pending draft and redo tail writes the new draft at `moves[cursor.index]` and truncates the tail.
- `R-71 …` tests: each Composing edit on a Place-reached Composing draft (last move, no tail) deletes `targetCell`/`placementOrder` and sets `reached` 'composing'; at least one edit on a committed Composing draft with a redo tail also drops the later moves; R-71's enablement, undo/redo and remaining discard cases are entry 6's.
- `R-30 …` tests run the word helper on D2-seam drafts, including k = 0 (word = M alone), the STA…/…ATS example and a `QU` card on the right side.
- An `R-12 …` test: `drop` has no WordCell source (`@ts-expect-error` on the offending property of `const _c: Command = { type: 'drop', … }`), plus the R-12 `drop` `sourceColumn` 0 and 9 rows throwing the domain code; the canPickUp half is entry 8's.
- An `R-39 …` test: `{ type: 'cancel' }` is not assignable to `Command` (`@ts-expect-error`); R-39's Undo-from-Composing sentence is entry 6's.
- Tests cover the CAP-4 sentences of R-10–R-13, R-20–R-23 and R-30–R-35 (entry 8's excluded, above).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-4, D2, D8
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-4 Commands
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, §2 rows and R-10–R-39 rows
- spine — ARCHITECTURE-SPINE.md AD-2
- rules — docs/game-flow-spec.md §2, §4
- prior plan — _bmad-output/initiative-wordcell-v1/epic-rules-engine/story-session-createsession-replay-and-checksession-plan.md (rules.ts guards, D2 seam)

## Notes

- Decision (technical default): the table uses the build-notes CAP-4 row shape plus an `id` field and the expected check code on throw rows, the `it.each` name built from `id`, `command`, precondition; readability refactors go to entry 12.
- Decision (technical default): this entry adds the `gaveUp` status rows early; entry 6 adds only the won status rows for these seven commands plus its own commands' rows.
