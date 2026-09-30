# Review log — story-engine-carry-ins-and-d1-export-removal.md (ticket 3.1)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 224 words (copy at story-engine-carry-ins-and-d1-export-removal.passes/pass0.md).
Note: the pulled ticket lacked tickets.toml entry 1's interface, tests and owns fields; they are passed as intent and added to the Description in pass 1.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case, adversarial, ref alignment  |  Findings: major 7, minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: 36 raw → 13)
Words (docs): 714 (3.19 x pass 0; budget 1500)  |  Snapshot: story-engine-carry-ins-and-d1-export-removal.passes/pass1.md
Fixer: all 12 applied; unverified (not run): npm run test:screens (needs Docker), scratch `export type { Start } from './replay'` mutation.
### Applied
- [major] Description B6 — delete the TABLE throw row for present `index: undefined` (commands.test.ts ~851), `index === undefined` takes the append path, test deep-equals the absent-index result on a non-empty arrangement, supersedes SPEC/build-notes "table row" wording (SPEC.review-log.md Pass 3 open major 2), name `R-33 … (Q-31)` per AGENTS.md test-name rule → fixer 1
- [major] Description accrue finish/un-finish — AD-4 order, accrue returns same reference while finished, reconcileHistory removes the record (SPEC CAP-1) → fixer 2
- [major] Description fixture regeneration — read-only check, JSON.parse(serializeSession(built)) toEqual imported fixture, fixtures never edited, mismatch reported, nine names → fixer 3
- [major] Description D1 removal — index.test.ts drops deal/Card; deal.ts/types.ts unchanged (default applied) → fixer 4
- [major] Verify — App.svelte keeps DOM/text identical; npm run test:screens green against the unchanged baseline (CAP-3 owns regeneration, SPEC E7) → fixer 5
- [major] Interface — store shape (Svelte .svelte.ts cannot export reassigned $state/$derived): `game` object with `state` and `view` getters, view(session, EN), main.ts mounts App without props → fixer 6
- [major] Description — add Interface/Tests/Owns lines from tickets.toml entry 1 (caller instruction) → fixer 7
- [minor] Verify scratch line `export type { Start } from './replay'` → fixer 8
- [minor] Notes timing: record unit-suite time before/after; fallback over engine files only → fixer 9
- [minor] Notes: AGENTS.md "type exports are unchecked" pitfall is a bmad-project-context follow-up, not hand-edited → fixer 10
- [minor] R-38 case as a TABLE throw row (default) → fixer 11
- [minor] view.test.ts DICT swap keeps the frozen context → fixer 12
- [minor] "review-log open major 2" → cite SPEC.review-log.md Pass 3 (merged into fixer 1) → fixer 1
### Default applied (technical)
- D1 — leave deal.ts `deal()` and the Card type engine-internal (only index.ts and index.test.ts change); rename the `AD-2 deal(seed)` test to AD-5
- Store — `export const game` with getters `state`, `view` (`GameView | undefined`, undefined while booting)
- R-38 — TABLE row id R-38, validate, SHORT dictionary word, throw `r36-letter-count`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 2, minor 12, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: 25 raw → 14; R-38 duplicate-row reclassified major → minor)
Words (docs): 937 (4.18 x pass 0; budget 1500)  |  Snapshot: story-engine-carry-ins-and-d1-export-removal.passes/pass2.md
Fixer: all 14 applied; unverified (not run): `npm run check` claim in Verify.
### Applied
- [major] Description B6 — there is no `index: null` TABLE row; the rows that stay are `-1`, `|M| + 1`, `0.5`; add an AD-2 throw row `index: null` → `command-domain`; the check is strict `=== undefined` → fixer 1
- [major] Interface — App's render while `game.view` is undefined unspecified → board inside `{#if game.view}`, booting renders nothing (specified AD-4 state, not a fallback; CAP-3 owns the booting render) → fixer 2
- [minor] R-38 — relabel the existing R-36 SHORT-in-dictionary row id `R-36 R-38` instead of a duplicate row → fixer 3
- [minor] view.test.ts DICT clause misleading (test-helpers DICT already deep-frozen) → fixer 4
- [minor] B6 test also asserts the undefined-index result appends (new reference, arrangement ends with the cell's top card) → fixer 5
- [minor] Record the R-33 name supersession of the Q-31-led name → fixer 6
- [minor] Regeneration test location/name: src/engine/serialize.test.ts beside the history-three-records rebuild, `AD-17 <fixture>.json equals its scripted accrue/apply rebuild` → fixer 7
- [minor] Accrue test: src/engine/history.test.ts; record the finish first with reconcileHistory → fixer 8
- [minor] Verify scratch mutation: revert it, record the failing output in the plan → fixer 9
- [minor] Verify "rendered from view" not observable: smoke passes unchanged; npm run check proves App no longer uses deal/Card → fixer 10
- [minor] main.ts mounts App without importing the store → fixer 11
- [minor] Notes follow-up: SPEC/build-notes CAP-1 B6 "table row" wording to be reworded by the spec owner → fixer 12
- [minor] "D1" label collision with retro D1 → fixer 13
- [minor] Owns: a later ticket adding a valid session fixture adds its case → fixer 14
### Default applied (technical)
- App first cut — `{#if game.view}` board, nothing while booting
- `index: null` — new AD-2 TABLE throw row `command-domain`
- R-38 — relabel existing row `R-36 R-38`
- Test files — regeneration in serialize.test.ts, accrue test in history.test.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
