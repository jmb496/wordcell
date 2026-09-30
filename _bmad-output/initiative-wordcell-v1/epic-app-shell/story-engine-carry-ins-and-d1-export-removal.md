---
id: 1
type: story
title: "Engine carry-ins and D1 export removal"
parent: epic-app-shell
covers: [CAP-1]
after: [2.13]
risk: medium
---

# Engine carry-ins and D1 export removal

## Description

Tracer bullet: fixes B6, lands the B7 test gaps, removes deal and Card (D1, the epic 2 transitional `deal`/`Card` export) from src/engine/index.ts, and feeds main.ts and App.svelte from a first game.svelte.ts cut (E7).

- B6 (retro D1 crash): delete the AD-2 TABLE throw row "index undefined (present key) outside its documented domain" in src/engine/commands.test.ts; commands.ts treats `index === undefined` like an absent key (the `index: -1`, `|M| + 1` and `0.5` throw rows stay). A new AD-2 TABLE throw row `addFreeLetter` with `index: null` (built with `asCommand`) → `command-domain` pins that only `undefined` counts as absent: the fix checks strictly `index === undefined`, so null still reaches the integer check. Proof is a named test right after the TABLE, not a TABLE row (the TABLE holds only no-op/throw rows; supersedes the "table row" wording of SPEC CAP-1 and build-notes CAP-1 per SPEC.review-log.md Pass 3 open major 2, and this R-33-led name supersedes the Q-31-led name in SPEC.review-log.md and tickets.toml, since R-33 holds the Q-31 sentence, AGENTS.md Conventions): `R-33 addFreeLetter with index: undefined appends like an absent index (Q-31)` applies `addFreeLetter` with `index: undefined` and without `index` to the same Composing Session with a non-empty arrangement and asserts the results `toStrictEqual`, and that the undefined-index result is a new reference whose arrangement ends with the cell's top card (so two no-ops cannot pass).
- R-38: the existing R-36 TABLE row "a word with letter count below 3 (its spelling in the dictionary)" (`on(SHORT, VALIDATE, DICT('mw'))`, `r36-letter-count`) gets the id `R-36 R-38`; no new row.
- The four review-loop/2-12-build.md test minors (build-notes CAP-1); the view.test.ts minor drops its local `DICT` and imports test-helpers.ts's `DICT` (already deep-frozen); `LANG` stays if still used.
- Accrue finish/un-finish (SPEC CAP-1): an `R-76 R-84 …` engine test in src/engine/history.test.ts beside the existing R-84 finish/un-finish tests, for a gaveUp and a won finish: it first records the finish with `reconcileHistory` (before-finish → finished); then `accrue(finished, ms > 0)` returns the same reference, then the un-finishing `apply` undo, then `reconcileHistory` in AD-4 order (accrue, apply, reconcile) removes the finish's record.
- Fixture regeneration, a read-only AD-17 check in src/engine/serialize.test.ts beside the existing history-three-records rebuild test, named `AD-17 <fixture>.json equals its scripted accrue/apply rebuild`: one Vitest case per valid session fixture (session-below-committed-last, session-composing, session-composing-draft-2-letters, session-gave-up, session-idle-fresh, session-idle-pending-draft, session-place, session-place-free-letter-redo-tail, session-won) builds the Session from `createSession(seed)` plus the scripted `accrue`/`apply` sequence recovered from its moves (inline Set dictionary) and asserts `JSON.parse(serializeSession(built))` equals the fixture imported `with { type: 'json' }`. Fixture files are never edited; a fixture no script reproduces stops the build as a reported bug (build-notes CAP-1).
- Export exactness: a compiler-API AD-2 test in src/architecture.test.ts (build-notes CAP-1 literal list).
- D1 removal: only index.ts loses `deal` and `Card`; deal.ts, `deal()`, the `Card` type and the R-02 golden test stay engine-internal and unchanged (the deal.test.ts test `AD-2 deal(seed) is dealIds(seed) …` is renamed to lead with AD-5, body unchanged). src/engine/index.test.ts drops `deal` from its runtime-key test name and list and drops the `Card` type import and assertion, and otherwise stays.

Interface: index.ts loses deal and Card (types and values). New src/shell/game.svelte.ts exports one `game` object (a .svelte.ts module cannot export reassigned `$state`/`$derived` bindings) with getters `state` (a `$state.raw` value `{ kind: 'booting' } | { kind: 'active'; session }`, set at module load to active with `createSession(1)`; E7 transitional exemption, removed by CAP-3) and `view` (`$derived` `GameView | undefined`: `view(session, EN)` while active, undefined while booting). main.ts mounts App without props (was `{ seed, columns }`) and does not import the store; App imports it, reads `game.view` (import type only from the engine) and the Seed line from the active session's seed, and renders the board inside `{#if game.view}`, nothing while booting (a specified AD-4 state, not a fallback; the first cut never boots; CAP-3 owns the booting render). No storage, no dispatch yet.

Tests: `R-33 … (Q-31)` index: undefined; AD-2 `index: null` throw row; `R-36 R-38` row: validate throws its structural code while R-36 fails; R-42 literal-order case; view.test.ts minors; R-76/R-84 accrue between finish and un-finish; AD-17 fixture regeneration (nine valid session fixtures); AD-2 index export exactness.

Owns: the AD-2 export literal list and the nine-valid-fixture regeneration test; a later ticket that adds a valid `session-*.json` adds its case here.

## Acceptance Criteria

Verify: npm run test:all is green, npm run test:screens passes against the unchanged placeholder-board baseline (baseline regeneration is CAP-3's, SPEC E7), the R-02 golden deal literals are byte-identical, the export-exactness test fails when a scratch `export type { Start } from './replay'` is added to index.ts (then the scratch line is reverted and the failing test output recorded in the plan), the smoke spec passes unchanged, and `npm run check` proves App no longer uses `deal`/`Card`.

App.svelte renders the same DOM and text as today (heading, Seed line, classes, card attributes, letters from `view.faces`, so QU still reads QU).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-1
- review — _bmad-output/implementation-artifacts/review-loop/2-12-build.md, Result

## Notes

- Open question: Whether ts.createProgram over src/engine/index.ts keeps the unit suite under 5 s (reviewer estimate ~0.75 s, unverified); the plan records unit-suite time before and after; fallback `noLib`/`skipLibCheck` over engine files only (build-notes CAP-1).
- Follow-up recorded in the plan: after this lands, the AGENTS.md pitfall "type exports are unchecked" is updated through `bmad-project-context`; the build does not hand-edit AGENTS.md.
- Follow-up, not this build: the spec owner rewords the B6 "table row" wording of SPEC CAP-1 and build-notes CAP-1 to a named test.
