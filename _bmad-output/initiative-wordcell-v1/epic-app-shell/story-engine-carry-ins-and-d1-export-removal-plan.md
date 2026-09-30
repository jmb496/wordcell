---
title: 'Engine carry-ins and D1 export removal'
type: 'feature'
ticket: '1'
created: '2026-09-30'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-engine-carry-ins-and-d1-export-removal.md'
  - '{project-root}/_bmad-output/specs/spec-epic-3-app-shell/build-notes.md'
warnings: [oversized]
deferred:
  - summary: >-
      AGENTS.md Known pitfall "type exports are unchecked" is stale now that the AD-2 compiler-API export test exists.
    evidence: |-
      src/architecture.test.ts "AD-2 src/engine/index.ts exports exactly the AD-2 names, types and values" checks type exports; the agent-context file must be updated via bmad-project-context, not hand-edited (ticket Notes).
    location: >-
      AGENTS.md Known pitfalls
    severity: low
  - summary: >-
      Placeholder board letters, in-column order and the card-count text are asserted only by the screenshot job, not by test:all.
    evidence: |-
      e2e/smoke.spec.ts never reads card text or order; only e2e/placeholder.screens.spec.ts (test:screens, CI screens job) would catch a wrong faces index or order. Pre-existing gap; add DOM text/order assertions when CAP-3/epic 4 replaces the board.
    location: >-
      src/ui/App.svelte
    severity: low
baseline_revision: 'ad5ed006ad8d2f884b97d2da9f2731185486656d'
---

<intent-contract>

## Intent

**Problem:** Epic 2 left B6 (`addFreeLetter` with a present `index: undefined` throws instead of appending), the B7 test gaps, and the transitional `deal`/`Card` export (D1) that the placeholder board still reads; AD-2's type exports are unchecked.

**Approach:** Fix B6 in `commands.ts`, land the B7 tests (R-38 row id, four 2-12 minors, accrue between finish and un-finish, nine-fixture rebuild, compiler-API export exactness), drop `deal`/`Card` from `index.ts`, and feed `App.svelte` from a first `src/shell/game.svelte.ts` cut that boots active with `createSession(1)` (E7). The ticket file is the authority; this plan settles the review log's open major and unapplied minors (Design Notes).

## Boundaries & Constraints

**Always:** AGENTS.md rules 1–7, Conventions and pitfalls; test names lead with the id; R-02 golden literals and `deal.ts` code unchanged (only `deal()`'s doc comment); fixture files never edited — a fixture no script reproduces stops the build as a reported bug; App renders the same elements, attributes and text as today (heading `WordCell`, `Seed 1 · placeholder board · 52 cards`, classes, `data-testid`/`data-card-id`/`data-place`, letters from `view.faces`, so QU reads QU); unit suite stays under 5 s.

**Never:** storage, dispatch, `apply` or lifecycle listeners in the store; new engine exports; editing AGENTS.md, the SPEC, build-notes or ticket files; `noLib` in the export test; regenerating screenshot baselines (CAP-3's); editing `e2e/smoke.spec.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| B6 present undefined | `COMPOSING`, `{ addFreeLetter, cell: 4, index: undefined }` | `toStrictEqual` the absent-index result; new reference; arrangement ends with cell 4's top card | none |
| index null | same, `index: null` | throws `command-domain` | TABLE throw row |
| index -1 / \|M\|+1 / 0.5 | existing rows | unchanged throws | unchanged |
| accrue while finished | `accrue(WON1, 500, EN)` / `accrue(GAVE_UP1, 500, EN)` | same reference; undo + reconcile removes the record | none |
| export drift | scratch `export type { Start } from './replay'` in index.ts | AD-2 exactness test fails | revert scratch |

</intent-contract>

## Code Map

- `src/engine/commands.ts:243-260` -- `addFreeLetter`: `hasIndex = Object.hasOwn(command, 'index')` → replace with `command.index !== undefined` (strict; null still reaches `assertInteger`).
- `src/engine/commands.test.ts` -- TABLE rows: R-36 SHORT/`DICT('mw')` row at ~688 (relabel id), present-undefined throw row at ~851 (delete), 0.5 row at ~843 (model for the null row); `asCommand` at 253; TABLE describe at 926 builds names as `${row.id} ${row.command} …`; `R-33 addFreeLetter with index |M|` test at ~1081 (B6 test goes right after it); `expectLegalTargets` at ~1194 (its R-42 assertion uses `word(...)`, hence the literal-order case).
- `src/engine/view.test.ts:27-30` -- local `LANG`/`CTX`/`DICT`; `LABELLED` at ~782 ('Idle with a pending draft' ~787, 'Composing k = 1' ~799, 'Composing k = n − 1' ~820). `test-helpers.ts:52` exports the frozen `DICT` on `EN`.
- `src/engine/history.test.ts` -- `reconcile` helper line 34, `COL5_DONE`/`GAVE_UP1`/`WON1`/`WON1_BEFORE` at ~55-62, R-84 un-finish tests at ~242-257.
- `src/engine/serialize.test.ts` -- nine valid fixture imports (lines 44-55 area), `VALID` list ~270, history rebuild test at ~1046 (precedent: `toStrictEqual` + `JSON.stringify(...) === serialize…`).
- Fixture scripts (epic 2 generator record, `epic-rules-engine/story-session-serialise-and-parse-with-fixtures-plan.md` Implementation Notes line 85): all seed 1, dictionary `{tan, one, man}`, `ctx = { lang: EN, dictionary }`; `tan` = drop {3,2,6}, flip; `tanPlace` = tan, validate; `tanDone` = tanPlace, confirm; `one` = drop {4,1,6}, addFreeLetter {cell 3}, flip, validate; `oneDone` = one, setPlacementOrder [9,32,28], confirm; `man` = drop {2,1,6}, setDestinationCount {k 2}, flip, validate, confirm. idle-fresh: createSession(1); composing: tan; composing-draft-2-letters: drop {3,1,6}, flip; place: tanPlace; idle-pending-draft: tanPlace, U, U; place-free-letter-redo-tail: tanDone, oneDone, man, U×4; below-committed-last: tanDone, one, U×3; won: `winSeed(1)` (`win-seed.ts`); gave-up: accrue(createSession(1), 1000, EN), giveUp.
- `src/architecture.test.ts` -- already imports `ts`, `readdirSync`, `posix`, `ROOT`; `AD-1 engine tsconfig` describe (~1883) shows the `getParsedCommandLineOfConfigFile` + `createProgram` pattern to reuse.
- `src/engine/index.ts` / `index.test.ts` -- drop `deal` export and `Card` from the types line; index.test.ts drops `deal` from the runtime-key test name and list and the `Card` import and `expectTypeOf<Card>` line.
- `src/engine/deal.ts:57` -- `deal()` doc comment "D1: …" → "test helper: dealIds with EN letters (R-03 tests)"; `deal.test.ts:130` rename `AD-2 deal(seed) …` → `AD-5 deal(seed) …`, body unchanged.
- `src/main.ts` -- drops the engine import and props; `mount(App, { target })`.
- `src/ui/App.svelte` -- placeholder board; `view.columns[i].cards` (CardId[], top → bottom), `view.faces[id].letter`.
- `src/shell/` -- new `game.svelte.ts` (shell may import only `src/engine/index.ts`, AD-1).

## Tasks & Acceptance

**Execution:**
- [x] (before any edit) run `npx vitest run` and record Duration in Implementation Notes (planning measured 2.92 s).
- [x] `src/engine/commands.ts` -- B6: `index === undefined` takes the append path whether or not the key is present; strict check.
- [x] `src/engine/commands.test.ts` -- delete the present-undefined throw row; add AD-2 throw row `addFreeLetter` / `index null outside its documented domain` / `command-domain` / `on(COMPOSING, asCommand({ type: 'addFreeLetter', cell: 4, index: null }))` beside the 0.5 row; relabel the R-36 `DICT('mw')` row id to `R-38 R-36`; add `it('R-33 addFreeLetter with index: undefined appends like an absent index (Q-31)')` right after the `index |M|` test (strict-equal to absent, new reference vs `COMPOSING`, arrangement's last card is cell 4's top card); add a literal-order R-42 case (left side, k ≥ 1, interleaved free letter) in the `R-40 R-42 legal targets` describe asserting `placementOrder` against a literal CardId array.
- [x] `src/engine/view.test.ts` -- import `DICT` from `test-helpers.ts`, drop the local copy (keep `LANG`/`CTX` if still used; `seam` keeps working since both are frozen EN contexts); add `expect(draftOf(s).reached).toBe('composing')` to 'Idle with a pending draft', `destinationCount > 0` to 'Composing k = n − 1', `remainderOf(s).length > 1` to 'Composing k = 1' (use the file's existing remainder helper or `destinationRemainder`).
- [x] `src/engine/history.test.ts` -- `it('R-76 R-84 accrue between a finish and its un-finish keeps the reference and the un-finish still removes the record (AD-4 order)')` for both `WON1_BEFORE → WON1` and `COL5_DONE → GAVE_UP1`: start = `(historyThreeRecords as unknown as ScoreHistory).records` (import `with { type: 'json' }`); finished = reconcile(start, before, after); `accrue(after, 500, LANG)` `toBe(after)`; undone = play(accrued, [UNDO]); reconcile(finished, accrued, undone) `toStrictEqual(start)`.
- [x] `src/engine/serialize.test.ts` -- `describe('AD-17 fixture regeneration')` with `it.each` over the nine fixtures named `AD-17 <fixture>.json equals its scripted accrue/apply rebuild`: build from the Code Map scripts via public `createSession`/`apply`/`accrue` + `winSeed(1)`, assert `JSON.parse(serializeSession(built))` `toStrictEqual(fixture)` and `JSON.stringify(fixture) === serializeSession(built)`.
- [x] `src/architecture.test.ts` -- (a) `it('AD-17 the valid fixtures/session-*.json files are exactly the nine rebuilt ones')`: readdirSync names matching `session-*.json`, not `session-invalid-*`, sorted, equal a literal nine-name list (own copy; tests never import each other); (b) `describe('AD-2 engine index exports')` `it('AD-2 src/engine/index.ts exports exactly the AD-2 names, types and values')`: options from src/engine/tsconfig.json (`getParsedCommandLineOfConfigFile` as the AD-1 tsconfig test, i.e. `parseJsonConfigFileContent` underneath), `createProgram({ rootNames: [index.ts], options })`, assert `ts.getPreEmitDiagnostics(program, indexSf)` is empty, then `checker.getExportsOfModule(checker.getSymbolAtLocation(indexSf))` names sorted equal the build-notes CAP-1 literal list (16 values + 26 types, no `Card`/`deal`).
- [x] `src/engine/index.ts`, `src/engine/index.test.ts`, `src/engine/deal.ts`, `src/engine/deal.test.ts` -- D1 removal as the Code Map says.
- [x] `src/shell/game.svelte.ts` -- new: `$state.raw` state `{ kind: 'booting' } | { kind: 'active'; session: Session }` set to active with `createSession(1)` at module load (comment: E7 transitional, CAP-3 replaces); `$derived` view = `state.kind === 'active' ? view(state.session, EN) : undefined`; `export const game = { get state() {…}, get view() {…} }`.
- [x] `src/ui/App.svelte` -- no props; import `game` from `../shell/game.svelte`, `import type` nothing else needed; `{#if game.state.kind === 'active' && game.view}` wraps the whole `<main>`; seed from `game.state.session.seed`; card count = sum of `game.view.columns[i].cards.length`; each over `game.view.columns` keyed by `column.column`, cards keyed by id, letter `game.view.faces[id].letter`, `data-testid="column-{column.column}"`; styles unchanged.
- [x] `src/main.ts` -- `mount(App, { target })`, no engine or store import.
- [x] Verification per the section below, including the scratch mutation and `npm run test:screens`; record outputs and timings in Implementation Notes.

**Acceptance Criteria:**
- Given the built app, when `e2e/smoke.spec.ts` runs unchanged, then it passes (52 live cards, `Seed 1`, 7/6 column counts) and `npm run test:screens` passes against the unchanged baseline.
- Given index.ts, when a scratch `export type { Start } from './replay'` is added, then the AD-2 exactness test fails; after revert it passes, and the failure output is recorded in Implementation Notes.
- Given `git diff src/engine/deal.test.ts`, then only the test-name line changes and the R-02 golden literals are byte-identical.
- Given `npm run test:all`, then it is green and the unit suite Duration stays under 5 s (before/after recorded).

## Implementation Notes

- Unit suite Duration (`npx vitest run`): before 2.76 s (1394 tests); after 2.85 s (1408 tests; 2.95 s inside `test:all`). No `skipLibCheck` needed; the AD-2 exactness test runs ~0.23–0.30 s.
- All nine fixture rebuilds match their files byte-for-byte from the Code Map scripts; no fixture bug to report.
- B6: `hasIndex = command.index !== undefined`; the B6 test asserts the appended card is `N` (cell 4's top).
- R-42 literal-order case: `startOf(['ST', 'BAD'], { 3: 'E' })`, drop S T onto column 2, k = 2, free letter E at index 1, word `adset`; `placementOrder` = `[a, d, s, e, t]` (via `expectLegalTargets`, default target 5).
- App.svelte: the card count is a script `$derived` (`undefined` while `game.view` is undefined, only rendered inside the `{#if}`) rather than an inline markup expression, because Biome's `noUnusedImports` does not see markup-only uses of `game` in `.svelte` files; rendered DOM is unchanged.
- Scratch mutation `export type { Start } from './replay'` in index.ts → `npx vitest run src/architecture.test.ts`: `× AD-2 src/engine/index.ts exports exactly the AD-2 names, types and values` — `AssertionError: expected [ Array(43) ] to deeply equal [ Array(42) ]`, diff `+ "Start"`; 1 failed | 261 passed. Reverted; 262 passed; `git diff src/engine/index.ts` shows only the D1 removal.
- `git diff src/engine/deal.ts src/engine/deal.test.ts`: the doc comment line and the test-name line only.
- Before the D1 removal the new AD-2 exactness test failed with exactly `+ "Card"`, `+ "deal"`.
- `npm run test:all`: exit 0 (lint, check, 1408 unit, build, dist-smoke 13 passed, e2e 34 passed, pwa 12 passed).
- `npm run test:screens` (Docker): exit 0, 2 passed (android, desktop) against the unchanged baseline.

## Plan Change Log

## Review Triage Log

### 2026-09-30 — Review pass
- verdicts: 14 findings — high 0, medium 0, low 8, false 6, maybe-false 0
- findings:
  - `[low]` `[reject]` blind-hunter: the valid-fixture name check covers only `session-*.json`; a new valid `history-*.json` has no guard — the ticket scopes the check to the nine valid session fixtures, so the intent excludes history fixtures.
  - `[low]` `[reject]` blind-hunter: `src/shell/game.svelte.ts` has no shell Vitest test and `GameState` is not exported — the module is a transitional E7 cut that CAP-3 replaces along with its store tests; the unchanged smoke spec and the screenshot job cover its render. No consumer needs `GameState` yet. Adding a test file for code that is about to be removed is not worth it.
  - `[false]` `[reject]` blind-hunter: the R-38 row id `R-38 R-36` contradicts the ticket and is not logged — the invocation told the build to resolve the review log's unapplied minors, and that minor asks for exactly `R-38 R-36`; Design Notes record it.
  - `[low]` `[patch]` blind-hunter: the redundant `(command.index as number)` cast after the B6 change (the doc-comment half is not a defect: "default |M|" still describes absent/undefined) — the cast was dropped, since TS narrows through the `hasIndex` const; `npm run check` is green.
  - `[low]` `[patch]` blind-hunter: the fixture-regeneration comment wrongly said "public … only", and the new `TAN*` script names clashed with the existing `TAN_SCRIPT`/`TAN_DONE` — the comment now names `play` and `winSeed(1)`, and the constants were renamed `FIXTURE_*`.
  - `[false]` `[reject]` blind-hunter: the accrue test casts the fixture instead of calling `parseHistory` and has no `isRecorded` assertion — fixture drift is already caught by `§2 history-three-records.json equals the reconciled history` in serialize.test.ts. `accrue` is asserted `toBe(after)`, so the record's matchability cannot change between the steps.
  - `[low]` `[defer]` blind-hunter: the AGENTS.md pitfall "type exports are unchecked" is now stale, and there are two export lists — the fix edits an agent-context file (deferred; the ticket routes it through `bmad-project-context`). The two lists are intended: the ticket's Owns says the runtime-key list mirrors the literal values.
  - `[low]` `[reject]` blind-hunter: the literal-order R-42 case covers only the left side — the carried minor asks for exactly left side, k ≥ 1 and an interleaved free letter; right-side order is already covered by the `word()`-based checks. Adding more cases goes beyond the intent.
  - `[low]` `[defer]` verification-gap: the placeholder board's letters, in-column order and `52 cards` text are checked only by the screenshot job, not by `test:all` — this gap predates the change (smoke never read card text), `test:screens` passed against the unchanged baseline, and the board is replaced in CAP-3 and epic 4. Deferred.
  - `[false]` `[reject]` intent-alignment: R-38 id departs from the literal ticket — same refutation as the blind-hunter R-38 row.
  - `[false]` `[reject]` intent-alignment: `accrue(after, 500, LANG)` against the ticket's `accrue(finished, ms > 0, EN)` — `after` is the finished Session, and `LANG` is the deep-frozen `EN`, so the semantics are identical.
  - `[false]` `[reject]` intent-alignment: the undefined TABLE row was edited in place rather than deleted and re-added — the resulting TABLE is identical.
  - `[false]` `[reject]` intent-alignment: `getParsedCommandLineOfConfigFile` is used instead of `parseJsonConfigFileContent` — it wraps that call with the same options, as in the existing AD-1 tsconfig test.
  - `[low]` `[defer]` intent-alignment: App and store expectations are backed only by the unchanged e2e and screenshot specs, not by tests in the diff — same root cause as the verification-gap row (grouped, deferred).

## Design Notes

Review-log resolutions (all technical defaults, no functionality/UX change):
- Open major (noLib vs no-pre-emit-diagnostics): resolved — the program always uses `rootNames: [src/engine/index.ts]` with the engine tsconfig options; if the unit suite exceeds 5 s, add `skipLibCheck: true` only; `noLib` is never used (supersedes build-notes CAP-1 wording). Diagnostics are scoped to index.ts's source file.
- R-38 row id `R-38 R-36` (not the ticket's `R-36 R-38`) so the generated TABLE name leads with R-38, meeting SPEC CAP-1's "a test named `R-38 …`".
- Fixture-name case keeps its own literal nine-name list; the optional fs cross-check of serialize.test.ts case names is declined (names come from an `it.each` template, so a text scan would test formatting, not coverage).
- Owns (restored): a later valid `session-*.json` adds its rebuild case, enforced by the AD-17 name-list check.
- main.ts store-free (App the only store reader), superseding SPEC CAP-1's "main.ts and App read view" — technical default; spec owner rewords later (ticket Notes).
- `index: null` row built with `asCommand` like the 0.5 row; the B6 named test sits beside the `R-33 … index |M|` test, outside the TABLE describe.
- Accrue test pairs and record typing as in the Tasks; fixture scripts from the epic 2 generator record.
- App's `&& game.view` conjunct is type narrowing only; seed line and card count are E1 placeholders CAP-3 replaces, not AD-3 re-derivation.
- AC wording "same elements, attributes and text" (the `{#if}` adds an anchor comment node).
- Tests list additionally covers: AD-17 valid-fixture name list, AD-5 deal rename, AD-2 runtime keys minus `deal`.
- The B6 parenthetical cut is ticket-text only; ticket files are never written by the build — not applicable.

Follow-ups (not this build): AGENTS.md pitfall "type exports are unchecked" updated via `bmad-project-context`; spec owner rewords SPEC/build-notes CAP-1 (B6 "table row", main.ts reads view, noLib).

## Verification

**Commands:**
- `npx vitest run` -- all pass; Duration < 5 s, recorded before and after.
- scratch `export type { Start } from './replay'` in index.ts → `npx vitest run src/architecture.test.ts` fails on the AD-2 exactness test; revert; passes.
- `git diff src/engine/deal.test.ts src/engine/deal.ts` -- name line and doc comment only.
- `npm run test:all` -- green.
- `npm run test:screens` -- passes against the unchanged baseline (Docker 29.8 present); if Docker fails, stop and report, never skip.

## Auto Run Result

- **Summary:** B6 fixed (`addFreeLetter` treats a present `index: undefined` as absent; `index: null` still throws `command-domain`). The B7 tests landed: the `R-38 R-36` row id, the R-33 undefined-index test, a literal-order R-42 case, the view.test.ts minors, the R-76/R-84 accrue-between-finish-and-un-finish test, nine AD-17 fixture rebuilds, the AD-17 valid-fixture name list, and the compiler-API AD-2 export exactness test. `deal`/`Card` were removed from `src/engine/index.ts`, and the first `src/shell/game.svelte.ts` cut (E7) now feeds `App.svelte`. `main.ts` mounts without props.
- **Files:** `src/engine/commands.ts` (B6); `src/engine/commands.test.ts` (TABLE rows, R-33, R-42); `src/engine/view.test.ts` (shared DICT, LABELLED guards); `src/engine/history.test.ts` (R-76 R-84); `src/engine/serialize.test.ts` (AD-17 rebuilds); `src/architecture.test.ts` (AD-17 name list, AD-2 exactness); `src/engine/index.ts` and `src/engine/index.test.ts` (D1 removal); `src/engine/deal.ts` (comment only); `src/engine/deal.test.ts` (AD-5 rename only); `src/shell/game.svelte.ts` (new store cut); `src/ui/App.svelte` (reads the store); `src/main.ts` (no props).
- **Review-log items:** the open major is resolved (index.ts is the only root with the engine tsconfig options; `skipLibCheck` was not needed at 2.8 s; `noLib` is never used). Every unapplied minor is resolved in Design Notes. The B6-parenthetical minor is ticket text only, so it does not apply to the build.
- **Review:** 14 findings. 2 patched (low: redundant cast; fixture comment and names). 3 deferred (AGENTS.md pitfall via `bmad-project-context`; placeholder-board text and order covered only by screenshots, twice, grouped). 3 low rejected (history fixture guard outside intent; store unit test for a transitional cut; extra R-42 sides beyond the minor). 6 false.
- **Follow-up review recommended:** false (patched: high 0, medium 0, low 2).
- **Verification:** after the patches, `npm run test:all` exited 0 (1408 unit tests, 2.78 s; dist-smoke 13, e2e 34, pwa 12) and `npm run test:screens` passed 2 of 2 against the unchanged baseline. The scratch `Start` export failed the AD-2 test (`+ "Start"`, 43 vs 42) and passed after the revert. The deal diffs are the comment and test-name lines only.
- **Residual risks:** SPEC/build-notes CAP-1 wording (B6 "table row", main.ts reads view, noLib) still needs the spec owner's rewording. The AGENTS.md pitfall is stale until `bmad-project-context` runs.
