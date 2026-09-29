---
title: 'Composing commands and the command table'
type: 'feature'
ticket: '4'
created: '2026-09-29'
baseline_revision: 'eaf7f739b38e9021736a3aab6f099c45ed3976c8'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-composing-commands-and-the-command-table.md'
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
  - '{project-root}/docs/game-flow-spec.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The engine has replay but no commands: nothing turns a player intent into a new Session, and the AD-2 command table that every later entry, the store and `GameView` flags depend on does not exist.

**Approach:** Add `commands.ts` with public `apply` and internal `applyFrom` (D2 seam) for the seven Composing-family commands (`drop`, `tapDestinationCard`, `setDestinationCount`, `flip`, `addFreeLetter`, `removeFreeLetter`, `arrange`), reusing `rules.ts` guards, and open `commands.test.ts` with the executable table. The ticket file (context) is the full contract; this plan fixes its open choices and resolves the review-log items.

## Boundaries & Constraints

**Always:** Check order per build-notes CAP-4: dispatch on `type` (unknown → `command-type`), status (`command-status`), phase (`command-phase`), domain (`command-domain`; `card`/`arrangement` elements via `assertCardId` → `card-id-domain`), rule; the no-op-by-value comparison runs only after every throw check. Every throw is `EngineError` with a unique code listed in `errors.ts`. No argument mutated; the engine never writes an `undefined`-valued key. `index.ts` gains only `apply` and the types `Command`, `ApplyContext`, `ApplyResult`. Test names per the ticket's row-name rules; tests assert codes, not messages.

**Never:** `validate`, `setTarget`, `setPlacementOrder`, `confirm` (entry 5); `undo`, `redo`, `giveUp`, won rows (entry 6); `view`/`can*` flags/`kIfTapped` (entry 8); the R-12/R-31/R-33 flag tests (entry 8). No not-implemented branch. No change to `deal.ts`, `buildDeck`, `lang/`, `main.ts`, `src/ui/`. No export of `applyFrom`, `rules.ts` helpers, `EngineError` or the seam from `index.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Drop in Idle | fresh or pending-draft Idle Session | new draft at `moves[cursor.index]`, tail truncated, cursor `{index, composing}`, R-23 fields | `r13-source-count` on 0 / too many / empty column |
| Equal-value edit | Place-reached or committed-with-tail Composing draft, command leaving fields equal | `result.session === input`, no `rejectedWord` key, redo data kept | none |
| Real edit | same inputs, a changed field | `targetCell`/`placementOrder` deleted, `reached: 'composing'`, later moves dropped | none |
| Empty destination | k = 0 draft, `setDestinationCount` any k (0 and 1 rows) | throws before the no-op comparison | `r31-set-count-empty-destination` |
| Unknown type on gaveUp | `{ type: 'x' }` | dispatch precedes status | `command-type` |

</intent-contract>

## Code Map

- `src/engine/rules.ts` -- export (internal) `checkSourceCount`, `checkDestinationCount`, `checkFreeLetterDuplicate`, `checkFreeLetterEmpty`, `checkArrangement`, `destinationRemainder`; extract the tops-of-listed-cells loop of `checkFreeLettersSet` into an exported `freeCards(position, freeLetters)` and reuse it there. Add boolean predicates for the command-only checks (`inDestination(position, move, card)`, `freeLetterIndexInRange(move, index)` with |M| = `arrangement.length`, `hasFreeLetter(move, cell)`, `sameDraftData(a, b)` comparing the §2 data fields element by element, excluding `reached`) so entry 8's `can*` flags reuse them (build-notes CAP-7); `commands.ts` turns them into throws. Add the R-30 helper `word(position, move, lang): { cards: readonly CardId[]; spelling: string }` (D top → bottom then M on the left; M then D reversed by card on the right; string via `spelling`). `checkMove` order and codes unchanged.
- `src/engine/replay.ts` -- extract `dealtStart(seed)` (runs `assertSeed`, builds the 8-tuple) from `replay`; `replay` becomes `replayFrom(dealtStart(session.seed), session, lang)`. Reuse `status`.
- `src/engine/commands.ts` (new) -- `Command` union (seven members, `readonly` fields, `addFreeLetter.index?`), `ApplyContext { readonly lang: LangData; readonly dictionary?: ReadonlySet<string> }`, `ApplyResult { readonly session: Session; readonly rejectedWord?: string }`, `applyFrom(start, session, command, ctx)`, `apply(session, command, ctx)` = `applyFrom(dealtStart(session.seed), …)`. The `never` switch comes first (so an unknown type throws `command-type` even on a gaveUp Session); each case calls a shared prelude (replay → status → phase: `drop` idle, the rest composing) then its reducer (domain → rule guards with `cursor.index` as move index → candidate → no-op or edit).
- `src/engine/errors.ts` -- add a "Commands" line to "Codes in use": `command-type`, `command-status`, `command-phase`, `command-domain`, `r31-tap-not-in-destination`, `r31-set-count-empty-destination`, `r33-free-letter-absent`, `r33-free-letter-index` (reused: `card-id-domain`, `r13-source-count`, `r31-destination-count`, `r33-free-letter-duplicate`, `r33-free-letter-empty`, `r35-arrangement`).
- `src/engine/index.ts`, `index.test.ts` -- export `apply` and the three types; rename the test to `AD-2 index exports apply, createSession, deal, EN, letterCount and SESSION_VERSION only at runtime` with `'apply'` in the sorted list.
- `src/engine/replay.test.ts:11-80` -- copy the `deepFreeze`, `expectEngineError`, `startOf` helper patterns locally into `commands.test.ts` (no shared helper module, as entry 3).
- `src/architecture.test.ts` -- AD-1 scan covers the new files; nothing to change.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/rules.ts`, `src/engine/replay.ts` -- as Code Map.
- [x] `src/engine/commands.ts` -- reducers:
  - `drop` (Idle): domain `sourceColumn`/`destinationColumn` integers 1–8, `sourceCount` integer; `checkSourceCount`; draft `{ sourceColumn, sourceCount, destinationColumn, destinationCount: remainder empty ? 0 : 1, destinationSide: 'left', freeLetters: [], arrangement: S top → bottom, reached: 'composing' }` written at `moves[cursor.index]`, `moves` truncated after it, cursor `{ index, composing }`. Never a no-op.
  - `tapDestinationCard`: `assertCardId`; `inDestination` else `r31-tap-not-in-destination`; card at remainder position i (0 = top of n) → k = n − i; if that equals current k, k = max(1, k − 1).
  - `setDestinationCount`: integer k; remainder empty → `r31-set-count-empty-destination` (any k); else `checkDestinationCount` (`r31-destination-count`).
  - `flip`: k = 0 → side stays `left` (no-op by value); else toggle.
  - `addFreeLetter`: `cell` integer 3–10; `index` checked iff `Object.hasOwn(command, 'index')` (integer, so a present `undefined` → `command-domain`); then `checkFreeLetterDuplicate`, `checkFreeLetterEmpty` on the candidate, then `freeLetterIndexInRange` (`r33-free-letter-index`); append `cell` to `freeLetters` (D8), insert the cell's top card into `arrangement` at `index` (default `arrangement.length`).
  - `removeFreeLetter`: `cell` integer 3–10; `hasFreeLetter` else `r33-free-letter-absent`; delete `cell` from `freeLetters` and its top card from `arrangement` in place.
  - `arrange`: non-array → `command-domain`; each element `assertCardId`; `checkArrangement` with S and `freeCards` (`r35-arrangement`).
  - Candidate equal by `sameDraftData` (cursor/gaveUp unchanged for these six) → return `{ session }` with the input reference; else the lowered draft (no `targetCell`/`placementOrder` keys, `reached: 'composing'`) and `moves.slice(0, index)` + it.
- [x] `src/engine/errors.ts`, `src/engine/index.ts`, `src/engine/index.test.ts` -- as Code Map.
- [x] `src/engine/commands.test.ts` (new) -- first thing: the table (`{ id, command, precondition, outcome: 'noop' } | { …, outcome: 'throw', check }` plus `build: () => [session, command, ctx]`), iterated by one `it.each` named `` `${id} ${command} ${precondition} → ${outcome}` `` (phase/status suffix inside `precondition`); each row deep-freezes Session, command and ctx; throw rows assert `EngineError` + `check`; no-op rows assert `result.session === input` and `!Object.hasOwn(result, 'rejectedWord')`. Rows go through public `apply` on seed 1 with hand-written Session literals built from `dealIds(1)` (committed moves = whole-column self-drops, k = 0, `targetCell: 3`, `placementOrder` = the column, which put cards on WordCells and empty a column). Then the named tests below.

**Table rows (one violation each):** the ticket's AD-2 fixed cases, wrong-phase rows (14, `§4`), `gaveUp` status rows (7, `R-75`), unknown type on the gaveUp Session (`AD-2`, `command-type`), plus: k = 1 on an empty destination (`R-31`, `r31-set-count-empty-destination`); a foreign-card `arrange` row (`R-35`); domain rows per command × id field with one above-max and one non-integer value (`sourceColumn` also 0; `sourceColumn` 0/9 named `R-12` per the ticket AC, the rest `AD-2`), `sourceCount`/k/`index` one non-integer row each plus `index: undefined`, `arrange` one row with a single bad element (52, `card-id-domain`) and one non-array row (`command-domain`). Ids for otherwise ambiguous rows come from the check-code prefix (tap → R-31, empty source → R-13). No-op rows use an input with redo data and a ≥ 3-letter word with a legal target (R-36/R-40 at Place).

**Named tests (outside the table):** the ticket's R-33 index = |M|, R-33 D8, R-23 (whole Session `toStrictEqual`), §2 drop-over-pending-draft (whole Session `toStrictEqual`), R-71 edit tests (each of the six edits on a Place-reached draft, plus one on a committed draft with a redo tail; whole `ApplyResult` `toStrictEqual`; inputs deep-frozen), R-30 word helper (k = 0, `STA…`/`…ATS` via `startOf` + `applyFrom`, `QU` on the right spells `…qu` in order), R-12 and R-39 `@ts-expect-error` (all required fields present, offending property on its own line; `cancel` literal on one line); success tests `R-10`/`R-11` (tail by count, whole column), `R-13` destination-only word via an empty column, `R-20`/`R-21` (self-drop draws D after S), `R-22` (empty destination incl. whole-column self-drop, k = 0), `R-31` tap mapping (mid-column tap sets k, top-of-D tap at k > 1 → k − 1) and flip toggling, `R-34` interleaved free letter arrangement accepted. Every successful result also passes `replay(result.session, EN)` (or `replayFrom` for seam tests).

**Sentence → test mapping (ticket rules; entry 8's flags excluded):** R-10, R-11 → `R-10 …`, `R-11 …`; R-12 → `R-12 …` ts test + `R-12 drop sourceColumn 0/9` rows; R-13 → `r13` rows + `R-13 …` success; R-20–R-22 → named tests; R-23 → `R-23 …`; R-30 → `R-30 …`; R-31 → tap/set/flip rows and named tests (k = 0 flip and k = 1 top-of-D no-op rows also cover R-71 non-edit); R-32 → the D-card `arrange` row; R-33 → free-letter rows and the two named tests; R-34 → `R-34 …`; R-35 → `arrange` rows; R-39 "no Cancel" → `R-39 …`; §2 drop truncation → `§2 …`; §4 preamble → wrong-phase rows; R-71 edit/non-edit → `R-71 …` tests and the equal-value rows; R-75 "every command except undo throws while not playing" → status rows (these seven). Exempt here: R-32/R-33 tray visuals (UI), R-39 inertness (UI) and Undo-from-Composing (entry 6).

**Review-log items (resolved):** row-name format incl. outcome and suffix (Tasks); k = 1 empty-destination row; command-only checks and the no-op comparison as `rules.ts` predicates; module `commands.ts`; `addFreeLetter` order duplicate → empty → index; non-array `arrangement` → `command-domain`, |M| = `arrangement.length`; `sourceColumn` 0/9 stay `R-12` (the ticket AC names them; the minor left it to the plan); negative counts: `apply` throws the rule code, `parseSession`'s schema stage (entry 10) the domain — kept, handed to entry 10; R-23/§2 whole-Session asserts; domain row set; foreign-card row; edit tests deep-freeze; unknown type on gaveUp; `@ts-expect-error` layout; ids from code prefix; replay of results (pass 4); R-13 success (pass 4); R-71 `ApplyResult` `toStrictEqual` (pass 3); named success tests for tap/flip/R-21 (pass 3). Not the build's: the same-letter swap edit (entry 6, SPEC CAP-5); tickets.toml text for entries 4 and 6 (publish step, hand-off).

**Acceptance Criteria:**
- Given `commands.test.ts`, when `npx vitest run src/engine` runs, then every table row and named test passes, and each throw row's named check is the first violation of its input.
- Given `index.ts`, when `Object.keys(engine)` is read, then it is `['EN', 'SESSION_VERSION', 'apply', 'createSession', 'deal', 'letterCount']`.
- Given the change, when `npm run test:all` runs, then it exits 0 and nothing under `src/ui/`, `src/main.ts` or `deal.ts` changed.

## Implementation Notes

- `apply` resolves `dealtStart(session.seed)` before dispatch, so a Session with a bad seed throws `seed-uint32` before `command-type`; every engine-produced Session has a valid seed.
- `sameDraftData` also compares `targetCell`/`placementOrder` (presence and elements); the candidate keeps them from the input, so they never decide the comparison.
- The six R-71 Place-reached edits are one `it.each` (`R-71 %o …`); the command table has 63 rows (87 tests in `commands.test.ts`).
- Verified: `npx vitest run src/engine` 180 passed; `npm run test:all` exit 0; the forbidden-path diff is empty.

## Plan Change Log

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 22 findings — high 0, medium 5, low 8, false 9, maybe-false 0
- findings:
  - `[low]` `[reject]` blind: `arrange` calls `checkSourceCount` although the ticket says it calls only `checkArrangement` — the draft's S was already validated by replay, so the extra throw path is unreachable; no user or developer harm.
  - `[medium]` `[patch]` blind: no non-integer `arrangement` element domain row — added `AD-2 arrange an arrangement element 1.5 outside its documented domain → throw` (`card-id-domain`).
  - `[medium]` `[patch]` blind: phase-before-domain order not pinned — grouped with verification-gap 2; rows added there.
  - `[false]` `[reject]` blind: null/non-object command throws `TypeError` — `command` is typed `Command`; no caller can pass null, and a loud failure on an unreachable input is correct.
  - `[low]` `[reject]` blind: `edit`/`sameDraftData` list Move fields by hand — drift is speculative; §2 fields change only with a `SESSION_VERSION` bump that would revisit both.
  - `[low]` `[reject]` blind: tap inside D below its top untested — same `k = n − i` branch as the tested raise; the new self-drop tap test adds another mapping case.
  - `[low]` `[reject]` blind: no `arrange` row with an unchosen WordCell's top card — same `checkArrangement` path as the foreign-card row; no defect.
  - `[false]` `[reject]` blind: no no-op row keeps a redo tail — a no-op returns the input reference, which carries its tail; the ticket allows Place-reached inputs for these rows.
  - `[false]` `[reject]` blind: plan not in the diff — by design the plan is the claims file; its sentence → test mapping is in Tasks & Acceptance.
  - `[low]` `[reject]` blind: `errors.ts` "CAP-4 order" wording vs rule-code order — the step categories are in CAP-4 order; cosmetic.
  - `[low]` `[reject]` edge: unknown type on a bad-seed Session throws `seed-uint32` first — recorded in Implementation Notes; engine-produced Sessions have valid seeds.
  - `[false]` `[reject]` edge: null command → `TypeError` — as the blind null finding.
  - `[false]` `[reject]` edge: `word()` with k out of range — its inputs are replay-validated drafts (`checkDestinationCount` in replay); no caller passes an unchecked k.
  - `[low]` `[reject]` edge: plan says committed moves target cell 3 while `PREFIX` uses 3 and 4 — the fix edits this build's plan.
  - `[medium]` `[patch]` verification-gap: successful tap on a partial self-drop never run — added `R-21 R-31 a tap on a self-drop counts k within the cards left after S` (SELF, tap `COL1[2]` → k = 3).
  - `[medium]` `[patch]` verification-gap: status/phase before domain not pinned — added rows `R-75 drop … sourceColumn 9 … (gaveUp) → throw` (`command-status`) and `§4 setDestinationCount … k 1.5 … (idle) → throw` (`command-phase`).
  - `[false]` `[reject]` intent: type before status vs reading B — build-notes CAP-4 (the ticket's cited single statement) dispatches on `type` first.
  - `[false]` `[reject]` intent: no §8 worked example — the epic's split decision gives §8 to entry 5.
  - `[medium]` `[patch]` intent: no non-integer `arrangement` element row — grouped with the blind finding; row added.
  - `[false]` `[reject]` intent: no test name starts with R-21 — AGENTS.md requires the name to carry the id; `R-20 R-21 …` and the new `R-21 R-31 …` do.
  - `[false]` `[reject]` intent: extra rows (foreign card, k = 1 empty destination) — the ticket review log's minors ask for them.
  - `[low]` `[reject]` intent: `sameDraftData` omits `cursor`/`gaveUp` vs build-notes — identical for these seven commands, which never change either; entries 5/6 revisit when their commands do.

## Design Notes

- The candidate draft keeps the input's `targetCell`/`placementOrder`/`reached` until the comparison; only a real edit lowers it, so an equal-value command on a Place-reached draft keeps its redo data (AD-2) and the no-op rows would fail if lowering ran first.
- `drop` is an advance: truncation at `cursor.index` discards both kinds of redo data (R-71); no comparison.
- Status needs the position, so the prelude replays first; a corrupt Session throws replay's code before `command-status`.

## Verification

**Commands:**
- `npx vitest run src/engine` -- expected: all pass
- `git diff --stat eaf7f739b38e9021736a3aab6f099c45ed3976c8 -- src/ui src/main.ts src/engine/deal.ts src/engine/deal.test.ts src/engine/lang` -- expected: empty
- `npm run test:all` -- expected: exit 0

## Auto Run Result

- **Summary:** `apply` and internal `applyFrom` for the seven Composing commands (`drop`, `tapDestinationCard`, `setDestinationCount`, `flip`, `addFreeLetter`, `removeFreeLetter`, `arrange`) with the build-notes CAP-4 check order, no-op by value and R-71 lowering; `commands.test.ts` opens with the executable AD-2 command table (66 rows) followed by the named R-id tests.
- **Files:**
  - `src/engine/commands.ts` — new: `Command`, `ApplyContext`, `ApplyResult`, `applyFrom`, `apply`, reducers.
  - `src/engine/commands.test.ts` — new: command table and named tests.
  - `src/engine/rules.ts` — exported guards, `freeCards`, predicates (`inDestination`, `freeLetterIndexInRange`, `hasFreeLetter`, `sameDraftData`) and the R-30 `word` helper.
  - `src/engine/replay.ts` — `dealtStart` extracted.
  - `src/engine/errors.ts` — Commands codes listed.
  - `src/engine/index.ts`, `src/engine/index.test.ts` — `apply` and the three types exported; export test renamed.
- **Review findings:** 3 patch entries applied (5 medium rows: non-integer arrangement element row; status/phase-before-domain rows; self-drop tap test); 0 deferred; rejected: 8 low and 9 false, each with its reason in the Review Triage Log.
- **Review-log items:** every item under the ticket review log's `## Result` is resolved in Tasks & Acceptance ("Review-log items (resolved)"); the tickets.toml text for entries 4 and 6 is left to the publish step (outside this ticket).
- **Follow-up review:** recommended (`true`): three medium entries were patched (5 medium rows, 0 high). Unverified risk: the three new table rows and the new named test were added at triage and no lens has reviewed them against the AC row-name format.
- **Verification:** `npx vitest run src/engine` 184 passed; `npm run test:all` exit 0; the forbidden-path diff (`src/ui`, `src/main.ts`, `deal.ts`, `deal.test.ts`, `lang/`) is empty.
- **Residual risks:** `sameDraftData` compares draft data only, not `cursor`/`gaveUp` (equivalent for these seven; entries 5/6 must revisit); a Session with an invalid seed throws `seed-uint32` before `command-type`.
