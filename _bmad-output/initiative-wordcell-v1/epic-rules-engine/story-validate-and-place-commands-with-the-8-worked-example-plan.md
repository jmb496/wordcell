---
title: 'Validate and Place commands with the §8 worked example'
type: 'feature'
ticket: '5'
created: '2026-09-29'
baseline_revision: '19f8d8d6cc2ed0f6b6dcc2f0510ea7544b72cc27'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-validate-and-place-commands-with-the-8-worked-example.md'
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
  - '{project-root}/docs/game-flow-spec.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** `apply` handles only the seven Composing commands; a draft can never be validated against the dictionary, given a target and placement order, or committed, so no game can progress past Composing and the §8 worked example is unproven.

**Approach:** Add `validate`, `setTarget`, `setPlacementOrder` and `confirm` to `commands.ts`, reusing the replay guards from `rules.ts` (now exported), extend the AD-2 command table and add the ticket's named R-id and §8 tests. The ticket file (context) is the full contract; this plan fixes its open choices and resolves the review-log items.

## Boundaries & Constraints

**Always:** Check order per build-notes CAP-4: `type` dispatch → status → phase (`validate` composing; the other three place) → `ctx.dictionary` (`validate` only; `ctx.dictionary === undefined` → `command-dictionary`) → domain → rule; no-op comparison last. One guard per code shared with replay (`checkLetterCount`, `checkTargetCell`, `checkPlacementOrder`). No argument mutated; no `undefined`-valued key written. Test names per ticket 2.4's row format; tests assert codes, not messages.

**Never:** `undo`, `redo`, `giveUp`, won rows, R-60 "never touches later moves" and "Redo commits without discarding" (entry 6); `view`/`can*` flags (entry 8). No change to `deal.ts`, `buildDeck`, `lang/`, `index.ts` exports, `main.ts`, `src/ui/`. Only `validate` reads `ctx.dictionary`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful Validate | Composing draft, spelling ∈ dictionary | draft data kept, `reached: 'place'`, `targetCell` = min(L, 10), `placementOrder` = `word().cards`; later moves dropped; cursor `{index, place}`; no `rejectedWord` key | none |
| Failed Validate | spelling ∉ dictionary | `{ session: input, rejectedWord: spelling }` | none (value result) |
| Missing dictionary | `validate`, no `ctx.dictionary` (even a 2-letter draft) | — | `command-dictionary` (after status/phase) |
| Place edit | `setTarget`/`setPlacementOrder` changing a field | `reached: 'place'`, Place fields kept/replaced, moves after the draft dropped, cursor unchanged | `r40-target-cell` / `r50-placement-order` / domain codes |
| Place equal value | same target / same order, input with redo tail | input reference | none |
| Confirm | Place draft (any redo data) | moves = prefix + draft `reached: 'committed'`; cursor `{index + 1, idle}` | none beyond status/phase |

</intent-contract>

## Code Map

- `src/engine/rules.ts:196-222` -- export `checkLetterCount`, `checkTargetCell`, `checkPlacementOrder` unchanged (replay keeps calling them); `word()` (R-30) gives the cards and R-37 spelling; `sameDraftData` already compares `targetCell`/`placementOrder`.
- `src/engine/commands.ts` -- widen `Command` with `{ type: 'validate' }`, `{ type: 'setTarget'; cell: WordCellNumber }`, `{ type: 'setPlacementOrder'; order: readonly CardId[] }`, `{ type: 'confirm' }`; add a `place(...)` prelude wrapper beside `composing(...)`; reuse `assertCell` (integer + 3–10 → `command-domain`), `assertCardId`, `edit` (Composing lowering) and add a Place-edit sibling. Word cards for L / R-50 derive as `checkMove` does: `[...sourceCards, ...freeCards(draft.freeLetters), ...checkDestinationCount-tail]` (multiset equals `word().cards`).
- `src/engine/errors.ts` -- Commands list: `command-dictionary` between `command-phase` and `command-domain`; reused list adds `r36-letter-count`, `r40-target-cell`, `r50-placement-order`.
- `src/engine/commands.test.ts` -- helpers at 11-78 (`deepFreeze`, `expectEngineError`, `startOf`, `CTX`, `sessionOf`, `run`, `draftOf`); seed-1 literals 80-195 (`COMPOSING`, `PLACE`, `PENDING_TAIL`, `WITH_TAIL`, `GAVE_UP`, `COMMITTED_DRAFT`, `TAIL`; `DRAFT_DATA` word is 4 letters, target 4); `SAMPLE` (Record over `Command['type']`, so it must gain the four types, which also auto-adds their gaveUp rows at ~446); `TABLE` 227-626; `seam` 846 inside `describe('R-30 word helper')`.
- `src/engine/index.ts`, `index.test.ts` -- unchanged (`apply`/`Command` already exported).

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/rules.ts`, `src/engine/errors.ts` -- as Code Map.
- [x] `src/engine/commands.ts` -- reducers:
  - `validate` (composing): dictionary presence → `checkLetterCount(wordCards)` (`r36`) → `word(position, draft, lang)`; `!dictionary.has(spelling)` → `{ session, rejectedWord: spelling }`; else advance: `{ ...draft data, reached: 'place', targetCell: min(L, 10), placementOrder: word().cards }`, `moves.slice(0, index)` + it, cursor `{ index, 'place' }`.
  - `setTarget` (place): `assertCell`; `checkTargetCell` with L; Place edit.
  - `setPlacementOrder` (place): non-array → `command-domain`; each element `assertCardId`; `checkPlacementOrder`; Place edit with `[...order]`.
  - Place edit: `sameDraftData` equal → input reference; else draft `reached: 'place'`, `moves.slice(0, index)` + it, cursor unchanged.
  - `confirm` (place): draft `reached: 'committed'`, `moves.slice(0, index)` + it, cursor `{ index + 1, 'idle' }`.
- [x] `src/engine/commands.test.ts` -- review-log item 1: hoist `seam` to file scope as `seam(start, commands, ctx = CTX): { before: Session; result: ApplyResult }` (runs `applyFrom` from a fresh seed-1 Session, every input deep-frozen, `before` = the Session the last command received); the R-30 tests call `word(replayFrom(start, result.session, EN), draftOf(result.session), EN)` via a local `spell` wrapper. Add `DICT = (…words) => deepFreeze({ lang: EN, dictionary: new Set(words) })` and `PLACE_TAIL` = Place over `COMMITTED_DRAFT` + `TAIL`.
- [x] Table rows (ticket AC, all through `apply`): `validate` Idle/Place, `setTarget`/`setPlacementOrder`/`confirm` Idle/Composing (`§4`, Idle rows on `PENDING_TAIL`, existing 2.4 rows untouched); gaveUp rows come from `SAMPLE` (validate's with a dictionary); check-order rows without a dictionary (`AD-2 validate … no ctx.dictionary` on `COMPOSING` and on a too-short draft → `command-dictionary`; gaveUp → `command-status`; Idle → `command-phase`); `R-36 validate too short` with a dictionary → `r36-letter-count`; `R-71 setTarget equal` / `R-71 setPlacementOrder equal` → noop on `PLACE_TAIL`; `R-40 setTarget above L` (5) → `r40-target-cell`; `R-50` missing / duplicate / foreign card → `r50-placement-order`; `AD-2` domain: cell 2, 11, 3.5 → `command-domain`, non-array order → `command-domain`, element 52 / 1.5 → `card-id-domain`. The row `build` returns its own ctx, so validate rows other than the check-order rows pass a dictionary.
- [x] Named tests (ticket AC, IDs as listed):
  - `R-37 R-38` failed Validate on `COMPOSING` (public apply): same reference, `rejectedWord` = the spelling; the QU variant (`"qu…"`) via `seam`.
  - `R-38 R-71` successful Validate on `WITH_TAIL` with a non-default stored target (3) and order (reversed), dictionary holding its spelling: whole `ApplyResult` `toStrictEqual`, cursor place (no auto-confirm).
  - `R-38` drop and arrange without a dictionary on an out-of-set word, and setTarget without a dictionary on `PLACE`, never throw `command-dictionary` nor return `rejectedWord` (review-log item 4).
  - `R-40 R-42` legal targets via `seam` on empty-destination drops (k = 0): QU 4-card word L = 5; exactly 10 cards; 11 cards and 10 cards with QU (default 10, all 3–10 accepted); L = 3 (setTarget 4 throws). `R-36` QU boundary: 2-card "qua" validates, 2-card plain word throws `r36-letter-count`.
  - `R-51` right side, k ≥ 2: default order = `word().cards`; setPlacementOrder then setTarget keeps the custom order.
  - `R-50` BALKED position: order with S, F, D interleaved and B on top, then confirm pushes exactly that order.
  - `R-71` setTarget and setPlacementOrder on `PLACE_TAIL`: whole Session `toStrictEqual`.
  - `R-60` confirm on `PLACE_TAIL` (public apply): tail dropped, reached committed, cursor `{3, idle}`; `replay` shows S, D, Z removed and the order on cell 4.
  - `§8 worked example …` on `startOf(['FEDKA', 'XORIN', 'LMFB'], { 6: 'L' })` with `DICT('baked', 'balked', 'faked', 'flaked')`, each variant from a fresh Idle Session: BAKED (default 5; 3–5 accepted; 6 throws); `R-41 §8 worked example BALKED …` (default 6; 3–6; setTarget 5 then 6; confirm onto 6: cell 6's L CardId appears once in the result, inside cell 6's pushed order); `R-41` BALKED confirmed onto cell 5 leaves cell 6 empty (the L travels); FAKED / FLAKED self-drop (default 5 / 6, no `rejectedWord`); tap on B at k = 1 → same reference; `setDestinationCount` 0 → `r31-destination-count`.
  - `R-52` after BALKED (default order) confirmed onto cell 6, a drop then `addFreeLetter { cell: 6 }` inserts the committed order's last CardId (col1's D), not the L.
- [x] Every successful result replays (`replay` / `replayFrom`).

**Review-log items (resolved):** 1 `seam` hoisted (Tasks); 2 check-order rows are the dictionary-less exceptions, validate's gaveUp row keeps a dictionary; 3 `PENDING_TAIL` only on the new Idle rows; 4 R-38 setTarget on a validated Place draft (`PLACE`); 5 successful-Validate test named `R-38 R-71 …`; 6 `R-41 §8 worked example BALKED …`; 7 L asserted by CardId; 8 R-52 uses the default order, new top asserted by CardId; 9 R-60 "never touches later moves" out of scope (entry 6, Never); 10 the R-41 "travels" onto-cell-5 test is included; 11 guards derive word cards as `checkMove` does (Code Map).

**Sentence → test mapping:** R-36 → r36 row + QU boundary; R-37 → failed-Validate tests; R-38 → dictionary rows, R-38 tests; R-40–R-42 → legal-target, §8 and r40 rows; R-50–R-52 → R-50/R-51/R-52 tests and r50 rows; R-60 → R-60 test; R-71 (these commands) → equal rows and R-71 tests; §4/R-75 → phase/status rows. Exempt per ticket Out of scope: R-37 list construction, R-38 loading and inactive control, R-42 pre-selection, R-50 UI sentence, R-36 structural reason, R-60 redo sentences.

**Acceptance Criteria:**
- Given `commands.test.ts`, when `npx vitest run src/engine` runs, then every table row and named test passes and each throw row's check is its input's first violation.
- Given `validate` without `ctx.dictionary` on a playing Composing Session, when applied, then it throws `command-dictionary`.
- Given the change, when `npm run test:all` runs, then it exits 0 and nothing under `src/ui/`, `src/main.ts`, `deal.ts` or `lang/` changed.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 24 findings — high 0, medium 2, low 12, false 10, maybe-false 0
- findings:
  - `[low]` `[patch]` blind: `SAMPLE`'s JSDoc left above the moved `asCommand` — moved `asCommand` above the comment.
  - `[low]` `[reject]` blind: `validate` derives the word cards twice (`wordCards` and `word()`) — negligible cost; one shared derivation per review-log item 11, no user or developer harm.
  - `[low]` `[reject]` blind: `command-dictionary` message cites R-38 and uses a template literal — messages are not asserted, Biome passes, R-38 is the rule that passes the dictionary to Validate.
  - `[medium]` `[patch]` blind: `expectLegalTargets` never replays its `setTarget` results nor pins the equal-target no-op; R-51's `reordered` unreplayed — each result now replayed, `toBe(validated)` at the default, `reordered` replayed (grouped with edge 3–5 and intent "unreplayed edits").
  - `[medium]` `[patch]` blind: no test pins R-36 before the membership miss (the R-36 row's word was in the set) — added row `R-36 validate … (its spelling not in the dictionary) → throw` on `SHORT` with `DICT(DRAFT_WORD)`.
  - `[false]` `[reject]` blind: "only validate reads the dictionary" covers too few commands — every other command's tests already run with the dictionary-less `CTX`; the ticket AC names drop, arrange, setTarget.
  - `[low]` `[reject]` blind: no whole-Session confirm from a plain `reached: 'place'` draft — covered by the §8 seam confirms (replayed, cells asserted); adding a test is not a direct correction.
  - `[false]` `[reject]` blind: `COMPOSING`/`PLACE` fixtures never linked — the `R-38 R-71` test's expected moves are `[...PREFIX, PLACE_DRAFT]`.
  - `[low]` `[reject]` blind: `targetCell` cast relies on MIN_WORD_LENGTH = lowest cell — `checkLetterCount` runs just before and R-36 fixes that bound; guard would add complexity.
  - `[low]` `[reject]` blind: reducer signatures pass `lang`/`ctx` inconsistently — cosmetic; no caller diverges.
  - `[low]` `[reject]` blind: plan line references and log sections stale — fix edits this build's plan.
  - `[false]` `[reject]` blind: plan file committed as 100755 — `core.fileMode` is false, the index records 100644; the mode came from `git diff --no-index`.
  - `[low]` `[reject]` blind: FAKED/FLAKED share one `it` — assertion diffs show the failing values; cosmetic.
  - `[false]` `[reject]` edge: `ctx.dictionary` null/non-Set → TypeError — `ApplyContext.dictionary` is typed `ReadonlySet | undefined`; the ticket defines missing as `=== undefined`; a loud failure on an unreachable input is correct.
  - `[low]` `[reject]` edge: `-0` order element stored — same pre-existing `assertCardId` path as `arrange`; UI dispatches CardIds from data, never `-0`.
  - `[medium]` `[patch]` edge: legal-target `setTarget` results not replayed — grouped with blind 4; fixed there.
  - `[medium]` `[patch]` edge: R-51 `reordered` not replayed — grouped with blind 4; fixed there.
  - `[medium]` `[patch]` edge (claim): "every successful result replays" untrue — grouped with blind 4; now true.
  - `[false]` `[reject]` intent: R-36-before-dictionary vs dictionary-first — the ticket (and build-notes CAP-4) settle dictionary presence before R-36; the diff follows it.
  - `[false]` `[reject]` intent: R-38 app-shell/UI sentences not exercised — ticket Out of scope (P3, entry 8).
  - `[medium]` `[patch]` intent: legal-target edits asserted on unreplayed results — grouped with blind 4; fixed there.
  - `[false]` `[reject]` intent: `seam` replaced rather than reused — review-log item 1 asks to hoist and widen it.
  - `[false]` `[reject]` intent: R-52 `at(-1) === D` rests on append default — R-33/Q-31 define the default append; `D` is the committed order's last CardId, a direct identity check.
  - `[false]` `[reject]` intent: Verify line omits R-60 — the ticket AC includes R-60 and the diff tests it; no divergence.

## Design Notes

- A successful Validate is never a no-op (cursor changes); a failed one returns before any candidate exists.
- Place edits keep `cursor` and `gaveUp`, so `sameDraftData` is AD-2's full comparison here.
- `confirm` needs no rule check: replay already proved the Place draft valid.

## Verification

**Commands:**
- `npx vitest run src/engine` -- expected: all pass
- `git diff --stat 19f8d8d6cc2ed0f6b6dcc2f0510ea7544b72cc27 -- src/ui src/main.ts src/engine/deal.ts src/engine/lang src/engine/index.ts` -- expected: empty
- `npm run test:all` -- expected: exit 0

## Auto Run Result

- **Summary:** `validate` (status → phase → `ctx.dictionary` → R-36 → membership; failed Validate = input reference + R-37 `rejectedWord`; success = advance to Place with min(L, 10) and word order, redo data dropped), `setTarget` / `setPlacementOrder` (R-71 Place edits, equal value → input reference) and `confirm` (R-60: redo discarded, committed, cursor `{index + 1, idle}`), with their AD-2 table rows and the named R-36–R-38, R-40–R-42, R-50–R-52, R-60 and §8 tests.
- **Files:**
  - `src/engine/commands.ts` — four commands in `Command`, `place` prelude, `wordCards`, `placeEdit`, the four reducers.
  - `src/engine/rules.ts` — `checkLetterCount`, `checkTargetCell`, `checkPlacementOrder` exported (unchanged).
  - `src/engine/errors.ts` — `command-dictionary` and the three reused codes listed.
  - `src/engine/commands.test.ts` — file-scope `seam`, `DICT`, `PLACE_TAIL`, `SHORT`; new table rows; validate / legal-target / Place / §8 tests.
- **Review-log items:** all 11 unapplied minors from the ticket review log's `## Result` resolved as listed under Tasks & Acceptance ("Review-log items (resolved)").
- **Review findings:** 24 — patched 3 entries (2 medium: replay of every successful result incl. the equal-target no-op; the R-36-before-miss row; 1 low: JSDoc placement); 0 deferred; rejected 9 low and 10 false (reasons in the Review Triage Log).
- **Follow-up review:** recommended (`true`): two medium entries patched (0 high). Unverified risk: the added R-36 row and the reworked `expectLegalTargets` assertions were added at triage and no lens has re-read them.
- **Verification:** `npx vitest run src/engine` 236 passed; `npm run test:all` exit 0; forbidden-path diff (`src/ui`, `src/main.ts`, `deal.ts`, `lang/`, `index.ts`) empty.
- **Residual risks:** `validate` and the Place edits re-derive the word cards from the replayed position on every call (cheap); an untyped caller passing `dictionary: null` gets a `TypeError`, not `command-dictionary`.
