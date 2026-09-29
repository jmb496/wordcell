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

- `Command` gains `{ type: 'undo' }`, `{ type: 'redo' }` and `{ type: 'giveUp' }`. Every new row and test deep-freezes its inputs (SPEC Constraints).
- Check order follows build-notes CAP-4's prelude: type, status, phase, then the command's own check; undo skips the status check (R-70, R-75). New codes `r70-nothing-to-undo`, `r71-no-redo-data`, `r76-elapsed-ms`, `r76-active-ms-overflow`, listed in `errors.ts`'s doc comment (the first two under Commands, the last two under a new accrue line).
- `accrue(session, elapsedMs, lang): Session` lives in `src/engine/commands.ts` and is exported from `index.ts`; the `AD-2 index exports …` test in `index.test.ts` adds `accrue`. Order per build-notes CAP-5: validate `elapsedMs` (`Number.isSafeInteger` and ≥ 0, else throw `r76-elapsed-ms` in every status) first; return the input for 0, before any replay; return the input while not playing; while playing, throw `r76-active-ms-overflow` if `activeMs + elapsedMs` is not a safe integer.
- Won helper: `src/engine/win-seed.ts` exports `winSeed(seed: number): Session`, algorithm per build-notes CAP-5. It is pure and passes the AD-1 engine scan (relative engine imports only, no vitest) and is not exported from `index.ts`.

## Acceptance Criteria

- Verify: npm run test:all is green with the rows and tests below and the command table complete.
- Command-table rows, in ticket 2.4's row format and naming:
  - undo at Idle index 0 while playing, with and without a pending draft → throw `r70-nothing-to-undo`.
  - redo with no redo data in Idle (moves.length = index), Composing (reached = composing) and Place (reached = place) → throw `r71-no-redo-data`.
  - giveUp in Composing and in Place → `command-phase`.
  - Status rows (gaveUp, and won built with `winSeed`) for every command except undo → `command-status`, generated from an explicit command list excluding `undo`; the existing gaveUp generator (`Object.keys(SAMPLE)`, near line 528) switches to that list so no undo status row contradicts R-75.
  - Undo from won and from gaveUp are named success tests, not rows.
- `win-seed.test.ts`: seeds 1 and 4294967295 reach status won at cursor {8, idle}.
- R-70 transitions, each a named test: Idle → previous Place with the pending draft pushed into the redo tail (build-notes CAP-5, Q-41); Place → Composing keeping targetCell and placementOrder; Composing → Idle; won → playing via `winSeed`.
- R-39: after undo from Composing (a draft using a free letter), the internal `replay` position deep-equals the pre-drop position, cursor is {index, idle} and the draft stays unchanged at moves[index].
- R-60: Redo from Place on a draft at reached = committed with a redo tail commits, cursor → {index + 1, idle}, later moves unchanged (`toStrictEqual`) ("Redo performs the commit without discarding"; the Redo path of "never touches later moves").
- R-71:
  - Enablement and discard cases, Redo into Place ignoring the dictionary included.
  - An `arrange` swapping two same-letter CardIds on a draft with redo data is an edit: reached → composing, targetCell and placementOrder deleted, later moves dropped (start built through the D2 seam with two same-letter cards).
  - A failed Validate on a draft with both kinds of redo data (later phase states and a tail) returns the input reference.
- R-62: from `winSeed`'s Session, undo then redo returns status won and a Session equal to the helper's.
- R-72 cases.
- R-75 / R-70 give up:
  - giveUp on Idle with a pending draft and a redo tail leaves `moves` and cursor unchanged and only sets gaveUp.
  - Undo while gaveUp clears only the flag, at index 0 and at index > 0 (cursor unchanged).
  - Give up is not redoable: redo while gaveUp throws; after the undo, redo does not set gaveUp.
- accrue, own `it` tests named R-76 / AD-2 beside the table (build-notes CAP-5 split): the invalid-ms throw and the 0 same-reference return in playing, won and gaveUp; the overflow throw only while playing; a won or gaveUp Session at activeMs = MAX_SAFE_INTEGER with positive ms returns the input.

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
