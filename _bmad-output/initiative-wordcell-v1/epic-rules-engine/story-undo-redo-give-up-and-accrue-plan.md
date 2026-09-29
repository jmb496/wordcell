---
title: 'Undo, redo, give up and accrue'
type: 'feature'
ticket: '6'
created: '2026-09-29'
baseline_revision: 'e94b7ae4001f1be10b86f3c5b5bf8561f27b02c3'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-undo-redo-give-up-and-accrue.md'
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
  - '{project-root}/docs/game-flow-spec.md'
warnings: ['oversized']
deferred:
  - summary: >-
      checkSession accepts a non-integer cursor.index, so undo on index 1.5 returns index 0.5.
    evidence: |-
      replay.ts checkSession only range-checks cursor.index (>= 0 and <= moves.length); edge-case lens reproduced undo returning {index: 0.5, phase: 'place'}. Pre-existing; unreachable from apply-produced Sessions; entry 10's parseSession schema stage should reject non-integers.
    location: >-
      src/engine/replay.ts:checkSession
    severity: low
---

<intent-contract>

## Intent

**Problem:** `apply` has no `undo`, `redo` or `giveUp`, and there is no `accrue`, so no game can step back, forward or end by giving up, active time cannot be recorded, and the AD-2 command table lacks its undo/redo/giveUp/status rows (incomplete until CAP-5).

**Approach:** Add the three reducers and `accrue` to `commands.ts` (spec R-70, R-71, R-75, R-76; build-notes CAP-5), a pure `win-seed.ts` test helper, and the ticket's table rows and named tests. The ticket file (context) is the full contract; this plan fixes its open choices and resolves the review-log items.

## Boundaries & Constraints

**Always:** Check order: seed (`seed-uint32`, already in `apply` via `dealtStart`) → type dispatch → replay → status (not for undo) → phase → own check. Undo: replay; `gaveUp` → `{ ...session, gaveUp: false }`; Idle at index 0 → `r70-nothing-to-undo`; Idle index > 0 → cursor `{index − 1, place}`; place → `{index, composing}`; composing → `{index, idle}`; `moves` never touched (same array reference kept). Redo: replay → status → Idle with `moves.length > index` → `{index, composing}`; composing with `reached` ≥ place → `{index, place}` (no dictionary); place with `reached` committed → `{index + 1, idle}`; else `r71-no-redo-data`. giveUp: replay → status → phase idle → `gaveUp: true`. Each step returns a new Session differing only in `cursor` or `gaveUp`. Every test input deep-frozen; test names start with their id; asserts codes, not messages.

**Never:** `view`, `can*`, scoring, `gameRecord`, parse/serialize, won fixture file (entries 7–11); changes to `deal.ts`, `buildDeck`, `lang/`, `src/ui/`, `src/shell/`, `main.ts`; `winSeed` exported from `index.ts` or using the D1 `deal` export; any new Session field.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Undo Idle | index > 0, any pending draft / tail, status playing or won | cursor `{index − 1, place}`, moves equal | none |
| Undo nothing | Idle, index 0, not gaveUp (pending draft or not) | — | `r70-nothing-to-undo` |
| Undo gaveUp | gaveUp, any index | only `gaveUp` false | none |
| Redo none | Idle `moves.length = index`; composing at reached composing; place at reached place | — | `r71-no-redo-data` |
| Redo not playing | won or gaveUp | — | `command-status` |
| giveUp | Idle playing | only `gaveUp` true | Composing/Place → `command-phase` |
| accrue bad ms | −1, 1.5, NaN, Infinity, 2**53, any status or an unreplayable Session | — | `r76-elapsed-ms` |
| accrue 0 / −0 | any Session (even one failing replay) | input reference | none |
| accrue playing | Idle, Composing, Place | new Session, `activeMs + ms` | sum not safe → `r76-active-ms-overflow` |
| accrue not playing | won / gaveUp, ms > 0 (even activeMs = MAX_SAFE_INTEGER) | input reference | none |

</intent-contract>

## Code Map

- `src/engine/commands.ts` -- `Command` union (add `undo`, `redo`, `giveUp`); `prelude(start, session, ctx, type, phase)` does replay → status → phase; reuse it for `giveUp` ('idle'); add a status-only variant for `redo` (replay → status) and a replay-only path for `undo` (`replayFrom(start, session, ctx.lang)` + `status(session, position)` from `./replay` for nothing else). `reachedAtLeast` from `./rules`. `applyFrom`'s switch has a `never` exhaustiveness default — add the three cases there. Add `export function accrue(session, elapsedMs, lang): Session` below `apply` using `dealtStart(session.seed)` + `replayFrom` + `status`.
- `src/engine/errors.ts` -- doc comment: after `r33-free-letter-index` in the Commands list add `r70-nothing-to-undo`, `r71-no-redo-data` (note: undo skips status and phase); new line `- accrue: r76-elapsed-ms, r76-active-ms-overflow`.
- `src/engine/index.ts` -- `export { accrue, apply } from './commands'`. `index.test.ts` -- rename to `AD-2 index exports accrue, apply, createSession, deal, EN, letterCount and SESSION_VERSION only at runtime`, add `'accrue'` to the sorted list.
- `src/engine/win-seed.ts` (new) -- `winSeed(seed: number): Session`: `createSession(seed)`; for column c = 1…8: `apply(s, drop(c, len, c), ctx)` (k = 0), `validate` with `{ lang: EN, dictionary: new Set([spell]) }` where `spell = dealIds(seed)[c−1].map((id) => spelling(id, EN)).join('').toLowerCase()` (check `spelling`'s signature in `lang/lang-data.ts`; `QU` → "qu"), `confirm`. Imports `apply`, `createSession`, `EN` from `./index`, `dealIds` from `./deal`. Pure; no vitest.
- `src/engine/win-seed.test.ts` (new) -- `R-62 winSeed wins seeds 1 and 4294967295 at cursor {8, idle}` via `status(s, replay(s, EN))`.
- `src/engine/commands.test.ts` -- helpers 11–110 (`deepFreeze`, `expectEngineError`, `CTX`, `DICT`, `sessionOf`, `run`, `seam`, `draftOf`); fixtures 112–260 (`IDLE`, `COMPOSING`, `PLACE`, `PENDING`, `WITH_TAIL`, `PENDING_TAIL`, `GAVE_UP`, `PLACE_TAIL`, `SHORT`, `SELF`); `SAMPLE` ~296 (Record over `Command['type']`: add `undo`, `redo`, `giveUp`); `TABLE` ~318–833; gaveUp status generator ~529 (`Object.keys(SAMPLE)`); R-31 `tapDestinationCard … at k = 1` and the two `flip … k = 0` rows; `§2 a drop in Idle …` ~941; `R-37 R-38 a failed Validate …` ~1118; `R-60 confirm discards …` ~1233. Seed 1 column 3 is `L QU E J A(2) T A(0)` (CardIds `…21, 2, 42, 0`).

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/commands.ts`, `errors.ts`, `index.ts`, `index.test.ts` -- as Code Map and Always.
- [x] `src/engine/win-seed.ts`, `win-seed.test.ts` -- as Code Map.
- [x] `src/engine/commands.test.ts` -- fixtures: `WON = deepFreeze(winSeed(1))`; `PENDING0` = seed 1, moves `[{ ...selfDrop(5, 3), reached: 'place' }]`, cursor `{0, idle}`; `SAME_LETTER` = `[...PREFIX, committed drop of col3's bottom 3 (A2 T42 A0) onto empty col5, k 0, target 3, order = arrangement, TAIL]` at `{2, composing}` (verify it replays). `st = (s) => status(s, replay(s, EN))`.
- [x] Table rows (ticket AC): `R-70 undo nothing to undo (Idle, index 0, playing)` on `createSession(1)` and on `PENDING0` (`… with a pending draft`) → `r70-nothing-to-undo`; `R-71 redo no redo data` on `IDLE` (Idle), `SELF` (composing, reached composing), `PLACE` (place, reached place) → `r71-no-redo-data`; `R-75 giveUp` wrong phase on `COMPOSING` / `PLACE` → `command-phase`; status rows from `STATUS_TYPES = Object.keys(SAMPLE).filter((t) => t !== 'undo')` for gaveUp (existing generator switched to it; id `R-75`, redo `R-71 R-75`) and won (`a command while status ≠ playing (won)` on `WON`, same ids; validate with `ctxFor`). Rename the R-31 k = 1 tap row and both k = 0 flip rows' id to `R-31 R-71`.
- [x] Named tests (ticket AC; each undo/redo/giveUp output `toStrictEqual` an expected whole Session):
  - `R-70` Idle → previous Place over four Sessions (`IDLE`, `PENDING`, a never-committed pending draft at reached composing, `PENDING_TAIL`); Place → Composing (`PLACE`, and `PLACE_TAIL` → `WITH_TAIL`); Composing → Idle (`COMPOSING`, and `WITH_TAIL` → `PENDING_TAIL`); won → playing (`WON` undo gives `{7, place}`, `st` playing).
  - `R-70` chain (review item 9): from `PENDING` undo twice (`{1, place}`, `{1, composing}`), each replays and `st` playing; redo twice returns `PENDING`.
  - `R-39` undo from Composing after drop + `setDestinationCount` + `addFreeLetter` + `arrange` from `IDLE`: `{index, idle}`, draft kept; replaying the same drop, same k, same addFreeLetter and arrange through `apply` from the undone Session yields a draft `toStrictEqual` the kept one (review item 5).
  - `R-60 R-71` Redo from Place at reached committed on `PLACE_TAIL`: `{3, idle}`, moves `toStrictEqual` input (review item 1).
  - `R-71` redo successes (never-committed pending → `{i, composing}`; `PENDING_TAIL` → composing; `COMPOSING` and `WITH_TAIL` → place, fields kept); `R-71` redo into Place ignores the dictionary (`CTX` and `DICT()` with empty set); `R-71` same-letter swap: `arrange` swapping A2 and A0 on `SAME_LETTER` → reached composing, no Place fields, TAIL dropped.
  - `R-62` `WON` undo then redo → `toStrictEqual` `WON`, `st` won. `R-72` Composing and Place in-phase actions then one undo; redo restores the pre-undo Session.
  - `R-75 R-70` give up: fresh session; `PENDING_TAIL`; undo while gaveUp at index 0 and > 0 (only flag, `st` playing); redo while gaveUp → `command-status`; giveUp/undo/redo on `PENDING_TAIL` → `{2, composing}`, gaveUp false.
  - accrue tests in `describe('accrue')`: `AD-2` invalid ms (−1, 1.5, NaN, Infinity, 2**53) in playing (`IDLE`), won (`WON`), gaveUp (`GAVE_UP`); `AD-2` ms validated and 0 returned before replay (a Session with `cursor.index` 9 on `PREFIX`: −1 → `r76-elapsed-ms`, 0 → same reference); `R-76` 0 and −0 same reference in all three statuses; `R-76` add in Idle, Composing and Place (frozen input, new Session equal except activeMs); `R-76` overflow at MAX_SAFE_INTEGER − 5 (+5 ok, +6 throws); `R-76` won/gaveUp at MAX_SAFE_INTEGER, ms 1 → input.
- [x] Renames: `R-71 §2 a drop in Idle …` (review item 7, R-id first per AGENTS.md), `R-60 R-71 confirm discards …`, `R-37 R-38 R-71 a failed Validate …`.

**Review-log items:** 1 applied; 2 applied (R-76 names); 3 applied (before-replay test); 4 applied (Place and −0); 5 applied; 6 applied; 7 applied; 8 applied (A2/A0 of seed 1 column 3); 9 applied (chain); 10 applied (errors.ts); 11 not applicable here — the won fixture is entry 10's, generated from an engine-side test or script since `winSeed` is not exported; 12 applied (reducers in `commands.ts`, dispatched in `applyFrom`).

**Sentence → test mapping:** R-39 (undo sentence) → R-39 test; R-60 redo sentences → R-60 R-71 test; R-62 → winSeed and R-62 tests; R-70 → R-70 tests and rows; R-71 → rows, redo, discard and same-letter tests; R-72 → R-72 tests; R-75 → give-up tests and status rows; R-76 → accrue tests. Exempt: R-39 UI sentences, R-73 (UI), R-76 display/shell sentences (entry P3+).

**Acceptance Criteria:**
- Given the change, when `npx vitest run src/engine` runs, then every table row and named test passes.
- Given the change, when `npm run test:all` runs, then it exits 0 and nothing under `src/ui/`, `src/shell/`, `src/main.ts`, `deal.ts` or `lang/` changed.

## Implementation Notes

- `commands.ts`: replay → status factored into `playing()`, which `prelude` and `redo` share; `undo` calls `replayFrom` only. `accrue` uses `replayFrom(dealtStart(seed), …)`.
- `win-seed.ts` also imports `spelling` from `./lang/lang-data` (R-37 string per card).
- `commands.test.ts`: named tests share a `step` helper (public `apply` via `run`, frozen result, no `rejectedWord`); `NEVER` is DRAFT_DATA pending at reached composing. The before-replay accrue test also asserts that ms 1 on the same Session throws `ad7-cursor-index`, proving it is unreplayable.

## Plan Change Log

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 17 findings — high 0, medium 2, low 7, false 8, maybe-false 0
- findings:
  - `[medium]` `[patch]` blind: activeMs preservation untested (every fixture at 0), though the ticket AC requires it untouched — undo, redo and giveUp cases added on a fixture with activeMs 1234.
  - `[medium]` `[patch]` blind: no test proves undo/redo/giveUp replay first — grouped with verification-gap 1; for redo and giveUp the status rows already need the replayed position, undo had no guard; fixed there.
  - `[low]` `[reject]` blind: `winSeed` ignores `rejectedWord`, so a rejected column surfaces as `command-phase` — the inline set is built from the column's own spelling, so rejection cannot happen; a guard adds a branch for an unreachable case, and the test still fails loudly.
  - `[low]` `[reject]` blind: `winSeed` tested on two seeds only — the ticket AC names seeds 1 and 4294967295; the won status covers gaveUp false, and `reached` committed follows from cursor {8, idle} (AD-7 prefix check).
  - `[low]` `[patch]` blind: `moves` same reference asserted with `toStrictEqual` — grouped with verification-gap 2; fixed there.
  - `[low]` `[patch]` blind: R-39 discards the original per-step drafts and checks a magic `destinationCount` — the rebuilt drafts now `toStrictEqual` the original run's drafts.
  - `[low]` `[reject]` blind: same-letter swap test sits in `describe('redo')` and uses a bare `replay` call — cosmetic; a bare `replay` throws on an invalid fixture, so the check is real.
  - `[low]` `[patch]` blind: errors.ts doc comment's adjacent parentheticals read as if "reused" belonged to undo — undo note moved after the reused list.
  - `[false]` `[reject]` blind: status rows only on Idle Sessions, so no row shows status blocking a phase-valid command — the drop and giveUp status rows are exactly that (phase Idle valid, `command-status` thrown); the Composing/Place-command rows would throw `command-phase` if the order were reversed.
  - `[low]` `[defer]` edge: a fractional `cursor.index` (1.5) passes `checkSession`, so undo returns index 0.5 — pre-existing `checkSession` gap (integer check), not caused by this change; engine inputs come from `apply` or entry 10's `parseSession` schema stage; deferred for entry 10.
  - `[medium]` `[patch]` verification-gap: undo's replay of its input is never tested (deleting it passes every test) — added `AD-7` table rows: undo on `cursor.index` 9 over `PREFIX`, playing and gaveUp, → `ad7-cursor-index`.
  - `[low]` `[patch]` verification-gap: "moves never touched" pinned only by deep equality — `toBe(input.moves)` in the R-70 Idle, `R-60 R-71` redo and give-up tests.
  - `[false]` `[reject]` intent: `test:all` is whole-app while the diff's evidence is engine-only — `npm run test:all` was run and exited 0.
  - `[false]` `[reject]` intent: R-39/R-70 asserted on cursor and command acceptance, not positions — positions are replay-derived (AGENTS.md rule 2; replay tests cover un-applying); the R-39 rebuild re-applies the same drop, k and free letter, which succeed only if S, D and F are back, as the ticket AC defines.
  - `[false]` `[reject]` intent: R-76 shell sentences (hidden-app pause, shell measuring time) not covered — spec preamble and ticket assign those to the shell/Playwright (P3), exempt here.
  - `[false]` `[reject]` intent: `winSeed` not reachable by entries 10/11 outside the engine — its consumers are engine-side tests or scripts (review-log item 11, recorded in the plan); not a defect of this change.
  - `[false]` `[reject]` intent: `R-71 §2` rename vs ticket `§2 R-71`, and tests import `apply` from `./commands` — the order follows review-log item 7 and AGENTS.md (R-id first); `./commands` is the existing test file's import, same function.

## Design Notes

- Undo and redo return a new Session even though `moves` is unchanged: `cursor` differs, so no no-op by value applies (AD-2).
- `accrue` checks `elapsedMs === 0` (true for −0) before any replay, so the shell's frequent 0-ms flush is free.

## Verification

**Commands:**
- `npx vitest run src/engine` -- expected: all pass
- `git diff --stat HEAD -- src/ui src/shell src/main.ts src/engine/deal.ts src/engine/lang` -- expected: empty
- `npm run test:all` -- expected: exit 0

## Auto Run Result

- **Summary:** `undo` (replay only; clears gaveUp, else one phase state back, `r70-nothing-to-undo` at Idle index 0), `redo` (replay → status → one phase state forward over stored data, no dictionary, Place commits only at reached committed, `r71-no-redo-data`), `giveUp` (Idle while playing, flag only) and `accrue` (ms validated first, 0 before replay, adds only while playing, safe-integer overflow check), with the `winSeed` helper and the completed AD-2 command table plus the named R-39, R-60, R-62, R-70–R-72, R-75, R-76 tests.
- **Files:**
  - `src/engine/commands.ts` — three commands in `Command`, `playing` helper, `undo`/`redo`/`giveUp` reducers dispatched in `applyFrom`, exported `accrue`.
  - `src/engine/errors.ts` — four new codes documented.
  - `src/engine/index.ts`, `index.test.ts` — `accrue` exported and listed.
  - `src/engine/win-seed.ts`, `win-seed.test.ts` — new pure won helper and its R-62 test (seeds 1, 4294967295).
  - `src/engine/commands.test.ts` — fixtures (`WON`, `PENDING0`, `SAME_LETTER`, `NEVER`), undo/redo/giveUp/status/AD-7 rows, R-id renames, named undo/redo/give-up/accrue tests.
- **Review-log items:** all 12 unapplied minors from the ticket review log resolved as listed under Tasks & Acceptance (11 not applicable: entry 10's won fixture).
- **Review findings:** 17 — patched 7 rows in 5 entries (2 medium: non-zero activeMs coverage; undo replay-first AD-7 rows; 3 low: `moves` by reference, R-39 per-step drafts, errors.ts wording); 1 deferred (low, pre-existing non-integer `cursor.index` in `checkSession`, for entry 10); rejected 4 low and 8 false (reasons in the Review Triage Log).
- **Follow-up review:** recommended (`true`): two medium entries patched (0 high). Unverified risk: the AD-7 undo rows, the activeMs test and the reworked R-39/reference assertions were added at triage and no lens has re-read them.
- **Verification:** `npx vitest run src/engine` —  285 passed (285); `npm run test:all` exit 0 (before and after patches); forbidden-path diff (`src/ui`, `src/shell`, `src/main.ts`, `deal.ts`, `lang/`) empty.
- **Residual risks:** `winSeed` is proven on two seeds only (per ticket); entries 8–11 rely on it.
