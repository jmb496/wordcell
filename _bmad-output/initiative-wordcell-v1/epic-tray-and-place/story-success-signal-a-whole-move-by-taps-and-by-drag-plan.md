---
title: 'Success signal: a whole move by taps and by drag'
type: 'feature'
ticket: 17
created: '2026-10-09'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-success-signal-a-whole-move-by-taps-and-by-drag.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-success-signal-a-whole-move-by-taps-and-by-drag.review-log.md'
warnings: ['oversized']
deferred: []
baseline_revision: '6304f6a759ebc405efee879557cf5f3831c3806c'
---

<intent-contract>

## Intent

**Problem:** Epic 5's Success signal (epic Done when 2 and Done when 3's same-Session sentence) has no proof: no Playwright test plays a whole move from `session-idle-empty-column` to commit by taps only, nor the same move by drag.

**Approach:** Implement ticket 5.17 as written (its Description and Acceptance are the contract; read the ticket first): one new `e2e/success-signal.spec.ts`, android only, with two tests playing ANEW (column 6's tail [1, 9, 28] A E N on empty column 1, k 0; free letter 48 W from cell 7; arrange [1, 28, 9, 48]; Validate → target 4 pre-selected, legal 3–4; retarget 3; strip [28, 1, 9, 48]; Confirm), once by taps and once with the drop, the free-letter add and both reorders by drag. No source change expected.

## Boundaries & Constraints

**Always:** Ticket 5.17 wins over this plan where they differ (record the difference in Implementation Notes). Expected values are the ticket's literals (confirmed by engine replay in the ticket's review passes), never edited to pass. Every dispatching step polls its expected stored value, then calls `expectSaved` (R-73) before the next step. Outcomes through `current()`, `wordcell:session` and DOM reads with `expect.poll`; no fixed waits tied to animation timing. Helpers are local copies (no new `e2e/helpers` module; S1 is entry 14's). Test names id-first exactly as the ticket gives them (completed with a short description).

**Never:** No engine, shell or UI source change unless the spec exposes a defect in entries 1–9; a UI defect is fixed at its cause in `src/ui/` / `src/main.ts` wiring and recorded here; an engine or shell defect or a spec deviation stops (HALT `blocked`, owner). No screenshot baseline change. Do not edit the ticket, the review log, SPEC.md, the epic file or the AGENTS.md managed block. No new fixture unless the Notes guard fires (below).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tap-only move | session-idle-empty-column, dictionary ready | cell 3 [28, 1, 9, 48]; score 49 → 54 = meta +5; moves/cursor = EXPECTED | — |
| Drag move | same start | same `moves`/`cursor` as EXPECTED (activeMs aside) | — |
| Non-dispatching tap (tap-only) | tail tap-select; first tap of each swap | `expectSaved` holds (no write expected; not asserted with a spy) | — |
| Notes guard | Validate shows `rejectedWord` for ANEW (cursor stays composing) | stop: script a fixture per the ticket's Notes, re-derive every literal by engine replay, record it here for the owner | test fails first; never silently passes |

</intent-contract>

## Code Map

- `e2e/success-signal.spec.ts` (new) -- the two tests. `test.beforeEach(onAndroid)` with `onAndroid` as in `e2e/place.spec.ts:30`. Local copies:
  - from `e2e/place.spec.ts`: `expectSaved` (l. 61-80), `storedMove`, `expectCursor`, `tapTile`/`select`/`expectSelected`, `cellIds` (l. 172-177), `columnIds`, `signed`, `score` (`.score`, `Score n`), `metaDelta` (`.controls .meta`, `· ±n`), `confirm` (primary reads `Confirm`, `tapAt` its centre). Import `stored` (`helpers/blocking`), `cards`, `centre`, `box`, `column`, `openFixture`, `tapAt`, `trayIds`, `type Point` (`helpers/board`), `waitForDictionary` (`helpers/restore`), `animationFrames` (`helpers/lifecycle`), `touchHold`/`TouchHold` (`helpers/touch`), `expectNoResidue` (`helpers/drag`).
  - for the tray and strip reorders: `e2e/tile-drag.spec.ts` `geometry` (l. 140-175, `slotRects` over the tile count), `gapCentre`, `holdTile` (l. 218-234, via `faceOf`), `moveFace`, `path`, `mid`, `plus`.
  - for W's end-gap insert: `e2e/free-letter.spec.ts` `geometry` (l. 221-251, one extra slot while `room`) renamed locally `insertGeometry`, its `gapCentre` renamed `insertGapCentre`, and `holdTop` (l. 288-302, cell 7's top face `card-48`); `moveFace`/`path`/`mid` shared with the tile-drag copy (identical).
  - for the drag drop: `e2e/drag.spec.ts` `holdThrough` + `path` + face-centring (l. 279-299, R-22 R-23 k = 0 on column 1's `[data-placeholder]`), pressed on card 1 (`cards(page, 6).nth(len - 3)`; centre of its wrapper, as `e2e/free-letter.spec.ts` `open` taps).
- Tap points (from `e2e/tap.spec.ts:177` and `e2e/free-letter.spec.ts:182`): card 1 (column 6, third from the bottom) selects the tail; column 1's `[data-placeholder]` receives the tap-drop; cell 7's `card-48` tap-adds; tiles by `tray.getByTestId('card-<id>')`; cells by `wordcell-<n>`; Validate/Confirm by `primary-action`.
- `src/engine/`, `src/shell/`, `src/ui/`, `fixtures/` -- read-only unless the Notes guard or a UI defect (Boundaries).
- `_bmad-output/specs/spec-epic-5-tray/build-notes.md` `## CAP-7 Place` -- append one as-built bullet (ticket 5.17: the Success-signal move, its literals, the spec file; guard not fired, or the fixture if it fired).

## Tasks & Acceptance

**Execution:**
- [x] `e2e/success-signal.spec.ts` -- header comment (epic 5 entry 17, SPEC Success signal, the move and fixture facts, helper provenance); module-level `EXPECTED` (`moves`, `cursor`) per Design Notes; helpers per Code Map; test 1 and test 2 per Design Notes.
- [x] `_bmad-output/specs/spec-epic-5-tray/build-notes.md` -- CAP-7 as-built bullet.

**Acceptance Criteria:**
- Given session-idle-empty-column on android with the dictionary ready, when test 1 plays the move by taps, then after Confirm `cellIds(page, 3)` polls to [28, 1, 9, 48] with `card-48` visible in cell 3, column 6 polls to [31, 34, 27], the meta delta read before Confirm (+5) equals the score change 49 → 54, and `current().session` and the stored Session equal EXPECTED (activeMs excluded).
- Given the same start, when test 2 plays the same move with the drop, the W add and both reorders by drag, then the same cell 3, column 6 and EXPECTED assertions hold, and no drag residue remains after each drag release.
- Given each dispatching step of either test, when it completes, then its expected stored value is polled and `expectSaved` passes before the next input; after each non-dispatching tap of test 1, `expectSaved` passes.
- Given the full gates, when `npm run test:all` and `npm run test:screens` run, then both are green and no screenshot baseline changed.

## Implementation Notes

- `e2e/success-signal.spec.ts` built per the step table; both tests passed on the first run (and 5/5 under `--repeat-each=5`). No engine, shell, UI or fixture change: the Notes guard did not fire (ANEW validates; Validate pre-selects 4, legal 3–4).
- Helper copies: the two `geometry` variants share one local `trayMetrics` read (tile-drag's one slot per tile as `geometry`, free-letter's extra slot while `room` as `insertGeometry`); `gapCentre` is identical for both, so `insertGapCentre` is an alias; `holdTile` and `holdTop` share one `holdFace` (press at the face centre, `moveFace` to each target). `selection` (e2e/tap.spec.ts) checks step 1's tail tap-select ({ column 6, count 3 }).
- Each dispatching step polls the stored `wordcell:session` move at the cursor (a picked subset, plus the cursor where the step changes it) via `expectStep`, then `expectSaved`; the meta deltas +9/+5 are DOM polls (`metaDelta`) after Validate and after the retarget, in both tests; the R-80 score/delta check is test 1's only.
- Premises asserted on open: column 1 empty, column 6 [31, 34, 27, 1, 9, 28], card 48 on cell 7.
- Verification (orchestrator, on this tree, port 5173 free): `npx playwright test e2e/success-signal.spec.ts --project=android` 2 passed; every `test:all` step in sequence: `npm run lint` (200 files), `npm run check` (0 errors), `npm test` (54 files, 2237 tests), `npm run build` (513,537 / 600,000), `npm run test:e2e:dist` (14 passed), `npm run test:e2e` (496 passed, 452 skipped), `npm run test:e2e:pwa` (12 passed); `npm run test:screens` (Docker) 10 passed, no baseline written or changed.
- Matrix audit: rows 1–3 are tests 1 and 2 (row 3: `expectSaved` after the tail tap-select and the first tap of each swap); row 4 (Notes guard) is the Validate step's `expectStep` (phase `place`, target 4), which fails on a `rejectedWord`; it did not fire.

## Plan Change Log

## Review Triage Log

### 2026-10-10 — Review pass
- verdicts: 16 findings — high 0, medium 3, low 8, false 5, maybe-false 0 (edge-case-hunter reported none)
- findings:
  - `[medium]` `[patch]` (blind-hunter) the stored move's `reached` is never polled per step, though ticket AC R-73 names drop → `reached` composing and validate → `reached` place — patched: `DROPPED` adds `reached: 'composing'`, the Validate `expectStep` adds `reached: 'place'` (engine sets them at `commands.ts` 143 and 162/320); the optional cursor pin on steps 3–4 is not in the ticket and was not added.
  - `[low]` `[reject]` (blind-hunter) non-dispatching taps are not proven write-free (no `stashSession` spy) — the intent's I/O matrix row 3 and the ticket review log's minor settle it as a note, not an assertion.
  - `[low]` `[reject]` (blind-hunter) test 2 cannot tell the W end-gap drag from a tap-add — the ticket fixes the end gap; a press that crossed the threshold is never a tap (`src/ui/gestures/classify.ts:47`) and `e2e/free-letter.spec.ts`'s fly-back tests cover a crossed-threshold release; extra in-flight assertions add complexity for an unlikely regression.
  - `[low]` `[reject]` (blind-hunter) "legal 3–4" is stated but not asserted — the Success signal needs at least two legal cells, which the test proves (4 pre-selected, 3 accepted by setTarget, which the engine rejects for an illegal cell); the exact set is engine replay's (ticket review passes) and engine-tested; asserting the ring set adds a DOM reader for no AC.
  - `[low]` `[reject]` (blind-hunter) after Confirm, column 1, cell 7 and the single live `card-48` are not checked — beyond the ticket AC; the final Session equality pins the state and the AD-14 one-live-element rule is covered by the board and place specs; `cellIds` DOM order is the ticket's "on top" check.
  - `[low]` `[reject]` (blind-hunter) test 2 never checks selection state after drags — not in the AC; the stored arrangement/placement polls and the final Session pin the outcome and selection after drag is entries 3/5's tile-drag specs'.
  - `[low]` `[patch]` (blind-hunter) the provenance header says `holdTile`/`holdTop` are copies and omits the new helpers — patched: header names the `trayMetrics`/`holdFace` adaptations and lists `storedAt`, `expectStep`, `expectStoredCursor`, `expectFinalSession`, `expectLanded` as new.
  - `[false]` `[reject]` (blind-hunter) `insertGapCentre` alias and `geometry`/`insertGeometry` are needless duplicates — the alias is the rename the ticket review log's minor asked for and holds no logic; the two geometries already share `trayMetrics` and differ in the slot count, so nothing is duplicated for S1 to fold.
  - `[false]` `[reject]` (blind-hunter) the build-notes bullet overstates (legal 3–4, "same Session") — build notes record as-built facts: legal 3–4 is the engine replay's literal, and both tests deep-equal one EXPECTED literal (activeMs aside), which is the ticket's definition of the same Session.
  - `[medium]` `[patch]` (verification-gap, other) `reached` not polled at drop and Validate — same root cause as the first row; patched there.
  - `[medium]` `[patch]` (intent-alignment) `reached` replaced by `cursor.phase` — same root cause as the first row; patched there.
  - `[low]` `[reject]` (intent-alignment) drag aim points come from `src/ui/layout/tray` — the ticket's References direct reuse of tile-drag/free-letter `geometry`, which compute gaps this way; intent-scoped.
  - `[false]` `[reject]` (intent-alignment) test 2 has no top-bar score/R-80 read — the ticket gives R-80 only in test 1's name (review-log minor applied); test 2's score is pinned by the final Session.
  - `[false]` `[reject]` (intent-alignment) "card-48 visible on top" is DOM order plus visibility — the ticket's AC defines it via `cellIds` bottom → top, as `e2e/place.spec.ts` does.
  - `[false]` `[reject]` (intent-alignment) runs on the dev-server android project, not a PWA/device — the ticket specifies "Playwright on android"; no divergence from the intent.
  - `[low]` `[reject]` (intent-alignment) non-dispatching taps prove equality, not no-write — same as the second row; the intent's matrix accepts it.

## Design Notes

**EXPECTED** (module level): `moves` = [the fixture's move verbatim: `{ sourceColumn: 1, sourceCount: 7, destinationColumn: 1, destinationCount: 0, destinationSide: 'left', freeLetters: [], arrangement: [24, 6, 49, 30, 25, 20, 48], reached: 'committed', targetCell: 7, placementOrder: [24, 6, 49, 30, 25, 20, 48] }`, `{ sourceColumn: 6, sourceCount: 3, destinationColumn: 1, destinationCount: 0, destinationSide: 'left', freeLetters: [7], arrangement: [1, 28, 9, 48], reached: 'committed', targetCell: 3, placementOrder: [28, 1, 9, 48] }]`, `cursor` `{ index: 2, phase: 'idle' }`. Final check in both tests: `{ ...session, activeMs: 0 }` of `current().session` and of the parsed stored Session each `toEqual({ version: 1, seed: 1, moves, cursor, gaveUp: false, activeMs: 0 })`.

**Step table** (stored value polled, then `expectSaved`; "DOM" = read from the page, not stored):

| # | Test 1 (taps) | Test 2 (drags) | Poll |
|---|---|---|---|
| 0 | open fixture; `waitForDictionary(page, 'ready')` | same | — |
| 1 | tap card 1 (tail selected) → `expectSaved` | — | — |
| 2 | tap column 1's placeholder | drag card 1's face centre onto column 1's placeholder (`holdThrough`) | cursor phase composing; move ⊇ `{ sourceColumn: 6, sourceCount: 3, destinationColumn: 1, destinationCount: 0, destinationSide: 'left', arrangement: [1, 9, 28] }` |
| 3 | tap `card-48` in cell 7 | `holdTop` to `insertGapCentre(g, 0, 3, 3)` (end gap of M, k 0) | arrangement [1, 9, 28, 48], `freeLetters` [7] |
| 4 | tap tile 9 (selected) → `expectSaved`; tap tile 28 | `holdTile(28, [gapCentre(g, 0, 4, 1)])` (gap before tile 9) | arrangement [1, 28, 9, 48] |
| 5 | tap Validate | same (tap) | phase place, `targetCell` 4, `placementOrder` [1, 28, 9, 48]; DOM meta delta +9 |
| 6 | tap cell 3 | same (tap) | `targetCell` 3; DOM meta delta +5 |
| 7 | tap strip tile 1 (selected) → `expectSaved`; tap strip tile 28 | `holdTile(28, [gapCentre(g, 0, 4, 0)])` | `placementOrder` [28, 1, 9, 48] |
| 8 | test 1 only (R-80): read `metaDelta` (+5) and `score` (49); Confirm | Confirm | cursor `{ index: 2, phase: 'idle' }`; test 1: score polls to 49 + delta = 54 |
| 9 | `cellIds(3)` polls [28, 1, 9, 48] (word ANEW; N A E W bottom → top), `card-48` visible in cell 3, column 6 polls [31, 34, 27]; EXPECTED check | same | — |

After each test-2 drag release: `expectNoResidue(page)` once the step's poll and `expectSaved` passed. Geometry is re-read after each tray change (tile count changes). Ticket wording for the test names (complete each with a short tail): `R-73 (UI) R-80 Success signal (epic Done when 2): tap-only move from session-idle-empty-column …` and `R-73 (UI) Success signal (epic Done when 3): the same move by drag …`.

**Notes guard.** It fires only if Validate in the test shows `rejectedWord` for ANEW (cursor stays `composing`). Then: script a valid start fixture under the epic 3 regeneration rule wired as ticket 5.9 did (`serialize.test.ts` VALID/REBUILDS/PROPERTIES, `ValidName`, the AD-17 list and its count in `src/architecture-ad2-ad12-ad17.test.ts`), re-derive every literal of the ticket's Acceptance by engine replay, record the fixture name and literals here, and flag it for the owner's close-out in Auto Run Result (SPEC Assumptions: the named start changes). SPEC.md and the epic file stay untouched.

**Review-log unapplied minors, one by one:**
- R-80 scoped to the tap-only test: applied — step 8's score/meta R-80 check is test 1's only; test 2 still reads the meta deltas in steps 5 and 6 (R-73 step checks, not R-80).
- "(ANEW, bottom → top)" gloss: applied — the spec comment and step 9 say "word ANEW; N A E W bottom → top".
- Meta deltas +9/+5 are DOM reads: applied — labelled "DOM" in the step table.
- "Holds with no write" is a note: applied — `expectSaved` only, no storage spy (I/O matrix row 3).
- Drop poll adds `destinationColumn` 1 and `destinationCount` 0: applied — step 2.
- Helper pairs from tile-drag.spec.ts and free-letter.spec.ts: applied — Code Map (free-letter's renamed `insertGeometry`/`insertGapCentre`).
- Add tap.spec.ts and drag.spec.ts to the reuse: applied — Code Map.
- Name tap points: applied — Code Map "Tap points".
- Drag version in tap order: applied — step table (one order for both tests).
- Notes guard trigger and re-derivation: applied — Design Notes "Notes guard".
- Stretch: column 6 → [31, 34, 27] after Confirm: applied — step 9 and AC 1.

## Verification

**Commands:**
- `npx playwright test e2e/success-signal.spec.ts --project=android` -- expected: 2 passed (iterate here first).
- `npm run test:all` -- expected: green (if port 5173 is held by a stale dev server not started by this build, run the steps on a scratch port as entry 8 did; record it).
- `npm run test:screens` -- expected: green, no baseline written or changed.

## Auto Run Result

Resumed run (the previous build stopped at a usage limit during step 4 with the plan `in-review`); review re-run from the start of step 4 on the existing tree.

- **Summary:** new `e2e/success-signal.spec.ts` (android) plays ANEW from `session-idle-empty-column` once by taps only (R-73 (UI) R-80, epic Done when 2) and once with the drop, the W insert and both reorders by drag (R-73 (UI), epic Done when 3), each step polled in storage then `expectSaved`, both ending equal to one EXPECTED `moves`/`cursor` literal. Notes guard not fired: no fixture, engine, shell or UI change.
- **Files changed:**
  - `e2e/success-signal.spec.ts` — the two Success-signal tests and their local helper copies.
  - `_bmad-output/specs/spec-epic-5-tray/build-notes.md` — CAP-7 as-built bullet for ticket 5.17.
- **Review findings:** 16 (high 0, medium 3 (one root cause, one entry), low 8, false 5). Patched: `reached` composing/place added to the drop and Validate polls (medium); header provenance corrected (low). Deferred: none. Rejected: write-free non-dispatching taps (intent matrix), W drag vs tap indistinguishable (classify + fly-back coverage), legal 3–4 not asserted (≥2 legal proven), vacated column/cell and single live card-48 (beyond AC, covered elsewhere), selection after drags (beyond AC), aim points from layout code (ticket-directed reuse), alias/geometry duplication (false), build-notes overstatement (false), no R-80 in test 2 (false, ticket scope), "on top" via DOM order (false, ticket definition), dev-server android (false, ticket surface).
- **Ticket review-log unapplied minors:** all 11 resolved in the plan (Design Notes "Review-log unapplied minors, one by one").
- **Follow-up review recommended:** false — patched entries at entry verdict: high 0, medium 1, low 1.
- **Verification (after the patches, this tree, port 5173 free):** `npx playwright test e2e/success-signal.spec.ts --project=android` 2 passed; `npm run lint` 200 files clean; `npm run check` 0 errors; `npm test` 54 files, 2237 passed; `npm run build` 513,537 / 600,000; `npm run test:e2e:dist` 14 passed; `npm run test:e2e` 496 passed, 452 skipped; `npm run test:e2e:pwa` 12 passed; `npm run test:screens` (Docker) 10 passed, no baseline written or changed.
- **Residual risks:** the W end-gap drag yields the same arrangement as a tap-add, so test 2 alone would not notice a drag that degraded to a tap (covered by the gesture classifier and free-letter fly-back tests). FLIP and fly-to-cell (entries 10, 11, 16) land after this ticket; the spec uses only polls, no animation-timed waits.
