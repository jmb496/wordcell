---
id: 6
type: story
title: "Undo, redo, give up and accrue"
parent: epic-rules-engine
covers: [CAP-5]
after: [5]
risk: medium
---

# Undo, redo, give up and accrue

## Description

Adds undo, redo and giveUp per R-70, R-71 and R-75 (pending draft into the redo tail, Redo from Place committing only at reached = committed, won → playing), accrue with safe-integer checks, the shared test helper that wins a real seed through public apply, and the command table's undo, redo, giveUp and status rows, completing the table.

- `Command` gains `{ type: 'undo' }`, `{ type: 'redo' }` and `{ type: 'giveUp' }`; `SAMPLE` (`Record<Command['type'], Command>`) gains all three. Every new row and test deep-freezes its inputs (SPEC Constraints).
- Check order follows build-notes CAP-4's prelude: type, then replay (undo, redo and giveUp replay first, as the prelude does), status, phase, then the command's own check. Undo skips the status check and has no phase check (R-70, R-75); its own order: gaveUp → clear the flag; Idle at index 0 → `r70-nothing-to-undo`; otherwise the phase step. Redo: replay → status → `r71-no-redo-data` (no phase check). giveUp: replay → status → phase Idle (`command-phase`), no own check. New codes `r70-nothing-to-undo`, `r71-no-redo-data`, `r76-elapsed-ms`, `r76-active-ms-overflow`, listed in `errors.ts`'s doc comment (the first two under Commands, the last two under a new accrue line).
- `accrue(session, elapsedMs, lang): Session` lives in `src/engine/commands.ts` and is exported from `index.ts`; the `AD-2 index exports …` test in `index.test.ts` adds `accrue` to its name and its expected key list. Order per build-notes CAP-5: validate `elapsedMs` (`Number.isSafeInteger` and ≥ 0, else throw `r76-elapsed-ms` in every status) first; return the input for 0, before any replay; return the input while not playing; while playing, throw `r76-active-ms-overflow` if `activeMs + elapsedMs` is not a safe integer; otherwise return the Session with activeMs + elapsedMs.
- Won helper: `src/engine/win-seed.ts` exports `winSeed(seed: number): Session`, algorithm per build-notes CAP-5, using `EN` and public `apply` from `./index`, columns 1 → 8 in order, each column's spelling from `deal(seed)` (via `./index`) letters lowercased, `QU` → "qu". It is pure and passes the AD-1 engine scan (relative engine imports only, no vitest) and is not exported from `index.ts`.

## Acceptance Criteria

- Verify: npm run test:all is green with the rows and tests below and the command table complete.
- Command-table rows, in ticket 2.4's row format and naming:
  - undo at Idle index 0 while playing, with and without a pending draft → throw `r70-nothing-to-undo`.
  - redo with no redo data in Idle (moves.length = index), Composing (reached = composing) and Place (reached = place) → throw `r71-no-redo-data`.
  - giveUp in Composing and in Place → `command-phase`, id `R-75`.
  - Status rows (gaveUp, and won built with `winSeed`) for every command except undo → `command-status`, generated from an explicit list of every type other than `undo`, redo's rows with id `R-71 R-75`; the existing gaveUp generator (`Object.keys(SAMPLE)`, near line 528) switches to that list so no undo status row contradicts R-75.
  - Undo while status ≠ playing is not a row; see R-70 and R-75 below.
- Every named undo, redo and giveUp test asserts the whole Session with `toStrictEqual` against an expected object: each undo, redo or giveUp step's output equals its own input except `cursor` or `gaveUp` (activeMs etc. untouched).
- Status assertions (R-62, won → playing, `winSeed`, R-75) use the internal `status(s, replay(s, EN))` from `./replay`.
- `win-seed.test.ts`: seeds 1 and 4294967295 reach status won at cursor {8, idle}.
- R-70 transitions, each a named test: Idle → previous Place with the pending draft pushed into the redo tail (build-notes CAP-5, Q-41), in three variants in one test: no pending draft (moves.length = index), a never-committed pending draft (reached composing, and PENDING at reached place; stays last per Q-41), a committed pending draft with a tail; each asserts cursor {index − 1, place}, moves `toStrictEqual` the input (reached unchanged, target and order intact), and redo returns the input Session (`toStrictEqual`); Place → Composing keeping targetCell and placementOrder; Composing → Idle; both also on the tail fixtures: undo on PLACE_TAIL `toStrictEqual` WITH_TAIL and undo on WITH_TAIL `toStrictEqual` PENDING_TAIL (reached = committed and the tail kept, R-72); won → playing via `winSeed`.
- R-39: after undo from Composing (a draft using a free letter), cursor is {index, idle}, the draft stays unchanged at moves[index], and re-applying the same drop then the same addFreeLetter through public `apply` succeeds (S and the free letter are back).
- R-60: Redo from Place on a draft at reached = committed with a redo tail commits, cursor → {index + 1, idle}, later moves unchanged (`toStrictEqual`) ("Redo performs the commit without discarding"; the Redo path of "never touches later moves").
- R-71:
  - Enablement is the command-table rows. Discard: rename `§2 a drop in Idle writes the new draft at moves[cursor.index] and truncates the tail` to `§2 R-71 a drop in Idle …` and `R-60 confirm discards the redo tail, …` to `R-60 R-71 confirm discards …`; no duplicates; the other discard and edit cases are already R-71-named.
  - Redo success, each a named test changing only `cursor`: Idle with a never-committed pending draft → {index, composing}; Idle over a committed pending draft with a redo tail (PENDING_TAIL) → {index, composing}; Composing at reached ≥ place → {index, place} with stored targetCell and placementOrder kept.
  - Redo into Place ignores the dictionary: run with a ctx without `dictionary` and with `new Set()`, both reaching {index, place}.
  - Same-letter swap through public `apply` on a hand-built Session (`sessionOf`), the plan choosing a seed and move whose S ∪ F holds two same-letter cards (the `applyFrom` seam only as a D2 exception the plan names if no dealt seed offers one): an `arrange` swapping two same-letter CardIds on a draft with redo data is an edit: reached → composing, targetCell and placementOrder deleted, later moves dropped.
  - Failed Validate: rename the existing `R-37 R-38 a failed Validate returns the input reference…` test (WITH_TAIL) to add R-71; no duplicate.
- R-62: from `winSeed`'s Session, undo then redo returns status won and a Session equal to the helper's.
- R-72: after several in-phase actions in Composing (e.g. arrange, setDestinationCount, flip, addFreeLetter), one undo reaches {index, idle} and moves[index] `toStrictEqual` the last edited draft; after setTarget/setPlacementOrder in Place, one undo reaches {index, composing} keeping the latest target and order.
- R-75 / R-70 give up:
  - giveUp on a fresh `createSession` Session (index 0, no moves) changes only `gaveUp`.
  - giveUp on Idle with a pending draft and a redo tail leaves `moves` and cursor unchanged and only sets gaveUp.
  - Undo while gaveUp clears only the flag, at index 0 (on the fresh give-up result above) and at index > 0 (cursor unchanged); the internal `status` is playing.
  - Give up is not redoable: redo while gaveUp throws `command-status`; giveUp in Idle with a pending draft (the Session above), undo, then redo enters {index, composing} with gaveUp false.
- accrue, own `it` tests named R-76 / AD-2 beside the table (build-notes CAP-5 split): the invalid-ms throw (−1, 1.5, NaN, Infinity, 2**53) and the 0 same-reference return in playing, won and gaveUp; while playing (Idle and Composing), a positive safe ms returns a new Session equal to the input except activeMs + ms (input frozen, not mutated); activeMs = MAX_SAFE_INTEGER − 5 with ms 5 gives MAX_SAFE_INTEGER, with ms 6 throws `r76-active-ms-overflow`; the overflow throw only while playing; a won or gaveUp Session at activeMs = MAX_SAFE_INTEGER with positive ms returns the input.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-5, D2, Constraints
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-4 check order, CAP-5 Undo, redo, give up, accrue
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, rows R-39 and R-70–R-76
- spine — ARCHITECTURE-SPINE.md AD-1, AD-2
- prior plans (hand-offs) — story-session-createsession-replay-and-checksession-plan.md, story-composing-commands-and-the-command-table-plan.md, story-validate-and-place-commands-with-the-8-worked-example-plan.md (all in _bmad-output/initiative-wordcell-v1/epic-rules-engine/)

## Notes

- Every seed wins by construction: `winSeed`'s inline set is built from each column's own R-37 string (6–7 cards per column satisfy R-36; R-22/Q-30 allow the whole-column self-drop).
- Hand-off: entries 8–11 use `winSeed` for every won case (build-notes CAP-5).
