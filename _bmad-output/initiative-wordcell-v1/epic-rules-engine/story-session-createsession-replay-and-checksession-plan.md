---
title: 'Session, createSession, replay and checkSession'
type: 'feature'
ticket: '3'
created: '2026-09-28'
status: 'built'
baseline_revision: '0e58096253760f7570a52a6882c5515d2b07f66e'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-session-createsession-replay-and-checksession.md'
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
  - '{project-root}/docs/game-flow-spec.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The engine has no game state: no §2 `Session`, no `createSession`, no replay deriving positions from moves, and no validation of a stored Session, which every later command, view and parser depends on.

**Approach:** Add `session.ts` (types, `SESSION_VERSION = 1`, `createSession`), `rules.ts` (pure per-move guards and the commit, shared with entries 4, 5, 8), `replay.ts` (`Start`, `replayFrom`, `replay`, `checkSession`, `status`) and an internal `dealIds(seed)` under D1 `deal`. The ticket file (context) is the full contract; this plan fixes its open choices and resolves the review-log items.

## Boundaries & Constraints

**Always:** Engine purity (AGENTS.md rule 1). `index.ts` gains only `createSession`, `SESSION_VERSION` and the types `Session`, `Move`, `Cursor`, `Phase`, `Reached`, `DestinationSide`, `WordCellNumber`. Every throw is `EngineError` with a unique kebab-case code listed in `errors.ts` "Codes in use"; messages name the move index and rule id (build-notes CAP-3); tests assert codes only. Inputs never mutated; tests deep-freeze Session, Start and `EN`. Replay tests pass `EN` only. `R-02 golden deal` literals byte-identical; only its CardId-half call changes to `dealIds(seed)`; green before (recorded below) and after.

**Never:** Export `replay`, `replayFrom`, `Start`, `checkSession`, `status`, `dealIds`, rules guards or `EngineError`. No dictionary parameter anywhere in replay. No schema-stage checks (types, enums, AD-2 domains; entry 10) and no `version` check. No `apply`, `confirm`, cursor writes or `view` (entries 4, 5, 8). No fixtures under `fixtures/` (entry 10). No changes to `mulberry32`, the shuffle algorithm, deck order, `main.ts` or `src/ui/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh game | `createSession(s)`, s uint32 (incl. `-0`) | the literal Session; replay: dealt columns, 8 empty cells, status playing | none |
| Bad seed | -1, 4294967296, 1.5, NaN, Infinity (createSession and checkSession) | throws | `seed-uint32` |
| Composing 2-letter pending draft | Idle, `moves[index]` reached composing, 2 letters | replays | none (R-36 only at ≥ place) |
| Redo tail | Place cursor, committed draft at index, tail moves | returns committed prefix; tail checked from draft-committed scratch | first violation's code |
| Won then gave up | R-62 session with `gaveUp: true` | throws after replay | `ad7-gave-up-won` |

</intent-contract>

## Code Map

- `src/engine/deal.ts` -- make `shuffle` generic (`<T>(items: readonly T[], seed) => T[]`, same algorithm); add internal `dealIds(seed): CardId[][]` (shuffle ids 0–51, round-robin); rebuild `deal` as `dealIds(seed).map(col => col.map(id => ({ id, letter: EN.letters[id] })))`. No seed check in either.
- `src/engine/deal.test.ts:119-121` -- golden test; repoint the two `deal(seed).map(... c.id)` calls to `dealIds(seed)` only.
- `src/engine/errors.ts` -- `EngineError(check, message)`; extend "Codes in use".
- `src/engine/lang/lang-data.ts` -- reuse `letterCount` (throws `card-id-domain` via `assertCardId`; export `assertCardId` for the Start guard, keeping the one code).
- `src/engine/types.ts` -- `CardId`, `WordCellNumber`, `WORD_CELL_NUMBERS`, `COLUMN_COUNT`, `MIN_WORD_LENGTH` (use in R-36).
- `src/engine/index.ts`, `index.test.ts` -- export list and the `AD-2 index exports …` test.
- `src/engine/lang/lang-data.test.ts` -- pattern for `expectEngineError` (copy locally; no shared engine helper module).
- `src/architecture.test.ts` -- AD-1 purity scan applies to new engine sources; `src/engine/tsconfig.json` covers them.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/session.ts` -- `Phase`, `Reached`, `DestinationSide`, `Cursor`, `Move` (§2 fields, `readonly`, optional `targetCell`/`placementOrder`), `Session`; `SESSION_VERSION = 1`; `assertSeed` (`Number.isInteger`, 0…4294967295, `seed-uint32`); `createSession(seed)` returning the ticket literal.
- [x] `src/engine/rules.ts` -- `Position = { columns, cells }` (build-notes CAP-3 layout, readonly); `checkMove(position, move, index, lang)` in build-notes order, each guard its own function; `commitMove(position, move): Position` (R-60/R-61/R-52: remove S, then D from the remainder, then each used free letter's top, then push `placementOrder` onto the target; returns new arrays).
- [x] `src/engine/replay.ts` -- `Start` (`columns`/`cells` fixed 8-tuples), `checkStart`, `checkSession`, `replayFrom(start, session, lang)`, `replay(session, lang)` = `assertSeed` then `replayFrom({ columns: dealIds(seed), cells: 8 × [] }, …)`, `status(session, position)`.
- [x] `src/engine/deal.ts`, `deal.test.ts` -- as Code Map; golden before/after.
- [x] `src/engine/errors.ts`, `index.ts`, `index.test.ts` -- codes list; exports; test renamed `AD-2 index exports createSession, deal, EN, letterCount and SESSION_VERSION only at runtime`.
- [x] `src/engine/session.test.ts` -- `R-04 …`, `R-74 …` per the ticket.
- [x] `src/engine/replay.test.ts` -- every ticket Acceptance case plus the resolved review-log items below; local `startOf` helper building a `Start` from letter strings (each letter takes the lowest free CardId for it, `'Q'` meaning the QU card), local `deepFreeze`, local `expectEngineError`.

**Codes (fixed):** pre-replay in AD-7 order, each check iterating moves in order: `seed-uint32`, `ad7-active-ms` (`Number.isSafeInteger` and ≥ 0), `ad7-gave-up-type`, `ad7-cursor-index`, `ad7-cursor-phase` (missing draft included), `ad7-gave-up-idle`, `ad7-place-fields` (`targetCell`/`placementOrder` present iff reached ≥ place, via `Object.hasOwn`), `ad7-k0-side`, `s2-committed-prefix`, `s2-last-only`, `ad7-unknown-session-field`, `ad7-unknown-cursor-field`, `ad7-unknown-move-field`. Per move (move-major): `r13-source-count` (1…column size), `r31-destination-count` (0 iff empty after R-21, else 1…n), `r33-free-letter-duplicate` (before empty), `r33-free-letter-empty`, `s2-free-letters-set`, `r35-arrangement` (permutation of S ∪ F); at reached ≥ place: `r36-letter-count`, `r40-target-cell`, `r50-placement-order` (permutation of S ∪ F ∪ D). Post-replay: `ad7-gave-up-won` (every committed-prefix column empty). Start: `card-id-domain` (existing), `start-duplicate-card`, `start-no-column-card`.

**Review-log items (resolved):**
- R-20 accepting case uses k = n ≥ 1 (non-empty remainder); its R-60 test asserts the column loses S, then D.
- Test ids: all rejecting/accepting replay cases and the QU boundary are `§2 …` except the carve-outs: `AD-2 …` seam throws and the R-id sentence tests (R-04, R-52, R-60–R-62, R-74, the `R-61` duplicate twin).
- `start-duplicate-card`: a CardId twice anywhere in the Start (columns and cells together); one case with the duplicate across a column and a cell.
- Dictionary row: a `§2 replay never consults the dictionary` test cites the R-62 Session, whose committed words are non-words, and `replay` has no dictionary parameter.
- `replay` runs `assertSeed` before `dealIds`; accepting cases are committed moves unless the ticket names another `reached`; every rejecting case changes the fewest fields of a valid (Start, Session) pair; `-0` seed and `activeMs` are accepted (one `§2` case); R-33 duplicate is checked before empty.
- Not the build's: R-33's two codes need two fixtures in entry 10; tickets.toml sync (entry 3 description/verify, entry 10 drops `SESSION_VERSION = 1`, entry 6 gains R-60 Redo path) is a publish step (Auto Run Result hand-off).

**Acceptance Criteria:**
- Given the ticket's Acceptance list, when `npx vitest run src/engine` runs, then every listed case passes under its id, and each rejecting case asserts exactly its code above.
- Given `index.ts`, when `Object.keys(engine)` is read, then it is `['EN', 'SESSION_VERSION', 'createSession', 'deal', 'letterCount']`.
- Given the change, when `npm run test:all` runs, then it exits 0 and nothing under `src/ui/` or `src/main.ts` changed.

## Implementation Notes

- Pre-edit golden run at `0e58096253760f7570a52a6882c5515d2b07f66e`: `R-02 golden deal` 1 passed.
- Post-edit golden run: 1 passed. `deal.test.ts` diff: the two call lines plus the import line (`dealIds` must be imported to call it).
- `commitMove` takes a `PlacedMove`; `placed(move)` is a type-only narrowing justified by `checkSession`'s `ad7-place-fields` (no runtime fallback, rule 6).
- `ad7-cursor-index` checks only the 0…`moves.length` range; integer type stays with entry 10's schema stage.
- `npm run test:all` exit 0 (unit 489 passed, 1.99 s).

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 33 findings — high 0, medium 1, low 8, false 24, maybe-false 0
- findings:
  - `[false]` `[reject]` blind: fractional `cursor.index` passes `ad7-cursor-index` — the ticket's Inputs bullet gives integer types to entry 10's schema stage ("replay adds no such check"); apply/view take engine-produced Sessions (build-notes CAP-3).
  - `[low]` `[patch]` blind: out-of-domain Move fields crash with TypeError; the schema-valid precondition is undocumented — the domain guards themselves are entry 10's (ticket Inputs); a JSDoc sentence on `replayFrom` and `checkMove` now states the precondition.
  - `[medium]` `[patch]` blind: `deal()` letters no longer covered once the golden test calls `dealIds` — new test `AD-2 deal(seed) is dealIds(seed) with each card's EN letter` (seeds 1, 4294967295); golden test and literals untouched.
  - `[low]` `[reject]` blind: plan Verification says only two call lines change in `deal.test.ts`, but the import changed too — the fix edits this build's plan; the import line is the needed repoint and the literals are byte-identical (checked by grep).
  - `[low]` `[reject]` blind: `createSession(-0)` keeps `-0`, no R-74 case — review-log only requires acceptance, which the `§2 -0` case asserts; `-0 >>> 0` deals as seed 0, no harm.
  - `[low]` `[patch]` blind: R-04 test froze the Session shallowly — now deep-freezes the Session and `EN`.
  - `[low]` `[patch]` blind: `ad7-place-fields` placementOrder-only direction untested — added a committed move missing only `placementOrder`.
  - `[false]` `[reject]` blind: R-60 "never touches later moves" test duplicates the redo-tail rejecting case — the ticket's R-60 bullet asks for exactly that assertion under R-60.
  - `[false]` `[reject]` blind: `status`'s idle clause is unreachable — the ticket specifies the clause and asks for it plan-named without a test (Design Notes).
  - `[low]` `[reject]` blind: dictionary test's arity check is brittle — the test also replays the R-62 non-word Session (the review-log's evidence); cosmetic.
  - `[false]` `[reject]` blind: plan review record empty — the triage log is written after the lenses report (this entry).
  - `[low]` `[reject]` blind: `replay` builds its 8-tuple by hand — cosmetic; `dealIds` always returns `COLUMN_COUNT` columns (R-03 tests).
  - `[false]` `[reject]` edge: non-integer `cursor.index` — schema stage (entry 10), as blind 1.
  - `[false]` `[reject]` edge: out-of-enum `cursor.phase` — enums are the schema stage's (ticket Inputs).
  - `[false]` `[reject]` edge: out-of-enum `reached` — schema stage (enums).
  - `[false]` `[reject]` edge: `sourceColumn` outside 1–8 — AD-2 domain, schema stage.
  - `[false]` `[reject]` edge: `destinationColumn` outside 1–8 — AD-2 domain, schema stage.
  - `[false]` `[reject]` edge: non-integer counts — integer types are the schema stage's (build-notes CAP-9).
  - `[false]` `[reject]` edge: `freeLetters` outside 3–10 — AD-2 domain, schema stage.
  - `[false]` `[reject]` edge: `targetCell` outside 3–10 — AD-2 domain, schema stage.
  - `[false]` `[reject]` edge: out-of-enum `destinationSide` — schema stage (enums).
  - `[false]` `[reject]` edge: own property with value `undefined` — JSON cannot carry `undefined` and the engine never writes such a key (build-notes CAP-3).
  - `[false]` `[reject]` edge: no `version` check — the ticket says neither function checks `version` (entry 10).
  - `[low]` `[patch]` verification-gap: R-33 duplicate-before-empty order unpinned — added `freeLetters: [5, 5]` asserting `r33-free-letter-duplicate`.
  - `[medium]` `[patch]` verification-gap: `deal()` letters unpinned — same root cause as blind 3; same fix.
  - `[false]` `[reject]` intent: R-60/R-62 tested at the replay surface, not a confirm command — the ticket narrows R-60 to position effects and gives cursor/Confirm to entry 5, public won cases to entry 6.
  - `[false]` `[reject]` intent: R-74 covered only as `createSession` + seed throw — the ticket names R-74's engine part; UI/shell parts are other entries' (rule-coverage split).
  - `[false]` `[reject]` intent: most cases use the seam, not real deals — the ticket prescribes seam starts for these cases (D2).
  - `[low]` `[patch]` intent: R-04 shallow freeze — same as blind 6; same fix.
  - `[false]` `[reject]` intent: redo-tail rejecting case meets only the weak "only violation" reading — the replayed Session's only violation is `r13-source-count`; `sourceCount` 3 is legal on the 3-card prefix column, as the ticket requires, and build-notes' fewest-changes rule selects this reading.
  - `[false]` `[reject]` intent: committed-prefix "Idle pending draft" uses a committed-reached draft — the ticket does not fix `reached`; the Composing-reached one is covered by its own test.
  - `[false]` `[reject]` intent: tests beyond the ticket's list — they are the plan's resolved review-log items (seed guard in `replay`, `-0`, dictionary row).
  - `[false]` `[reject]` intent: golden-before and `test:all` not visible in the diff — recorded in Implementation Notes and Auto Run Result (both passed).

## Design Notes

- `replayFrom`: `checkStart` → `checkSession` → copy start → for i < `cursor.index`: `checkMove`, `commitMove` → the committed prefix is the result. If `moves[index]` exists, check it at its `reached` from the prefix; if a redo tail follows (the draft is then committed by the §2 invariant), scratch = `commitMove(prefix, draft)`, then each tail move is checked and, when committed, committed onto scratch. Finally `ad7-gave-up-won`.
- `status`: gaveUp if the flag, else won when `cursor.phase` is idle and every column empty (Idle by construction; plan-named, no test), else playing.
- Plan-named, no test: R-12 (source is a column by type), R-32 (a D card in `arrangement` fails `s2-free-letters-set`).

## Verification

**Commands:**
- `npx vitest run src/engine/deal.test.ts -t "R-02 golden deal"` -- expected: 1 passed before and after
- `git diff 0e58096253760f7570a52a6882c5515d2b07f66e -- src/engine/deal.test.ts` -- expected: only the import line, the two golden call lines and the added `AD-2 deal(seed) is dealIds(seed) with each card's EN letter` test change
- `npm run test:all` -- expected: exit 0

## Auto Run Result

- **Change:** §2 `Session` types, `SESSION_VERSION = 1` and `createSession` (shared `seed-uint32` guard); internal `rules.ts` (per-move guards in build-notes order, `commitMove` for R-60/R-61/R-52); internal `replay.ts` (`Start` seam with D2 throws, `checkSession` AD-7 pre-replay checks, `replayFrom`/`replay` returning the committed prefix and checking draft and redo tail on scratch, post-replay `ad7-gave-up-won`, `status`); internal `dealIds` with D1 `deal` rebuilt over it; `index.ts` gains only `createSession`, `SESSION_VERSION` and the §2 types.
- **Files:** `src/engine/session.ts`, `rules.ts`, `replay.ts` (new); `session.test.ts`, `replay.test.ts` (new, R-04/R-74, 60+ `§2`/AD-2/R-52/R-60–R-62 cases); `deal.ts` (generic `shuffle`, `dealIds`, `deal` over it); `deal.test.ts` (golden calls repointed, new `deal` letters test); `errors.ts` (codes list); `lang/lang-data.ts` (`assertCardId` exported); `index.ts`, `index.test.ts`; this plan.
- **Review-log items:** all resolved in the plan (Tasks, "Review-log items (resolved)"); none left open.
- **Review (thorough):** 33 findings; 5 patch entries (1 medium: `deal` letters coverage; 4 low: R-33 order case, `ad7-place-fields` placementOrder case, R-04 deep freeze, schema-valid precondition doc), 0 deferred, rest rejected with reasons in the triage log (mostly type/enum/domain guards the ticket assigns to entry 10's schema stage).
- **Follow-up review recommended:** false (patched: high 0, medium 1, low 4).
- **Verification:** `R-02 golden deal` passed at `0e58096` before the first edit and after the patches; no `GOLDEN_*` line in the diff; `npm run test:all` exit 0 after the patches (492 unit, dist-smoke 13, dev e2e 34, pwa 12); nothing under `src/ui/` or `src/main.ts` changed.
- **Hand-off (publish / later entries):** tickets.toml sync (entry 3 description/verify: R-52, won-test wording; entry 10 drops `SESSION_VERSION = 1`; entry 6 verify gains R-60 "Redo performs the commit without discarding" and the Redo path of "never touches later moves"); entry 10 needs two R-33 fixtures (duplicate, empty) and owns every type/enum/domain check replay assumes.
- **Residual risks:** replay trusts schema-valid input; a malformed Session reaching `replayFrom` without entry 10's schema stage can throw `TypeError` or mis-replay (e.g. fractional `cursor.index`).
