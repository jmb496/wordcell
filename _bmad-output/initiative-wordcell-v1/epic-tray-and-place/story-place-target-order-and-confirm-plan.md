---
title: 'Place target, order and Confirm'
type: 'feature'
ticket: 9
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
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-place-target-order-and-confirm.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-place-target-order-and-confirm.review-log.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
warnings: ['oversized']
deferred: []
baseline_revision: '5709d02e46edea3a9da18066ef3947bc5639997f'
---

<intent-contract>

## Intent

**Problem:** In Place a WordCell tap never dispatches: intent.ts `tapAction` gives `none` for every Place WordCell, so the player cannot choose the target (R-40–R-42, R-51), and Confirm (R-60–R-62, R-80), R-41 and R-61 have no browser proof on a fixture whose free letter's cell holds exactly 2 cards (S15).

**Approach:** Implement ticket 5.9 exactly as written (its Description and Acceptance are the contract; read the ticket first): a Place case in `tapAction` gives `setTarget { cell }` when `canSetTarget`, reached by the existing tap and empty-cell long-press-as-tap paths (`tileTap` already clears or keeps per F13); script `fixtures/session-place-free-letter-two-cards.json`; flip the superseded Vitest; add `e2e/place.spec.ts`.

## Boundaries & Constraints

**Always:** Ticket 5.9 wins over this plan where they differ (record the difference in Implementation Notes). `tileTap` runs before `perform` (selection cleared before the dispatch, F1). The target ring, fade and check stay on `isLegalTarget` + `place.target` (WordCellRow.svelte:35-47); `canSetTarget` gates only the dispatch. Assert every outcome in `current().session` and stored `wordcell:session` (R-73), plus the DOM where the ticket names it. Id-led test names (`R-41 R-80 …`, `R-61 R-65 R-80 …`, `R-62 …`); shell/UI Vitest names start with AD-n. Cite ids in comments.

**Never:** No engine or shell source change (SPEC Constraints); `src/engine/serialize.test.ts` and `src/architecture-ad2-ad12-ad17.test.ts` change only as listed. Confirm in `ActionBar.svelte` is not rebuilt. No keyboard target keys (epic 6), no fly-to-cell or FLIP (entries 10/11/16), no end sheet (epic 6). No screenshot baseline change. Do not edit the ticket, the review log or the AGENTS.md managed block. Do not change classify.ts.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Retarget tap | Place, cell `canSetTarget` (legal, not current), tile selected or not | tile selection cleared, then one `setTarget { cell }`; `placementOrder` unchanged | — |
| Current-target tap | Place, cell = `place.target` | no dispatch; tile selection cleared (F13) | — |
| Not-legal tap | Place, cell not `isLegalTarget` | no dispatch; tile selection kept; no WordCell view (R-39) | — |
| Empty-cell long-press | Place, empty legal non-current cell, timer fired, `pointerup` anywhere (moved > 8 px after 400 ms included) | as a tap on the cell where it started: clear, one `setTarget` | — |
| Empty long-press, not legal / current target | Place | no dispatch; keep (not legal) / clear (current) | — |
| Long-press cancelled | `pointercancel` / `lostpointercapture` after 400 ms | no dispatch, tile selection kept (F1) | — |
| Non-empty long-press | Place, any non-empty cell | peek opens, release keeps or closes it (F14); no dispatch; tile selection kept | — |
| WordCell drag | Place, ≥ 8 px before 400 ms, `pointerup` | nothing moves; no dispatch; legal cell clears, not-legal keeps (`pointercancel` keeps) | — |
| Composing empty long-press | tile selected | no dispatch, selection kept (unchanged) | — |
| Desktop click with hover peek open | Place, legal non-current non-empty cell | one `setTarget`; hover peek stays open (as F26 for the Composing click-add) | — |

</intent-contract>

## Code Map

- `src/ui/gestures/intent.ts` -- `TapAction` gains `{ kind: 'setTarget'; cell: WordCellNumber }`. In `tapAction`, after the Composing WordCell branch and before `if (selection === null)`: `if (place(view) && hit.kind === 'wordcell')` → `cellIn(...)`, `canSetTarget ? { kind: 'setTarget', cell: cell.cell } : NONE` (a Place view never has a tail selection). Header (l. 9-12): replace "nothing in Place" with the Place target sentence (epic 5 SPEC CAP-7, R-39, R-40, R-41, R-51).
- `src/ui/gestures/controller.ts` -- `perform` (l. 1286-1318): `case 'setTarget': game.dispatch({ type: 'setTarget', cell: action.cell })`. No other logic change: `pointerup`'s `outcome === 'tap'` path already runs `applyTile(tileAction(hit))` then `perform(hit)`; an empty WordCell's long-press classifies as `tap` (classify.ts:48) with the pointerdown's `hit`, so "wherever released" holds; the drag-as-tap path (l. 1352-1361) gives only `destinationTap` (null in Place) → no dispatch. Header: in "Peek and view" (l. 71-79) add one sentence: in Place a tap (or an empty cell's long-press released by `pointerup`) on a `canSetTarget` cell clears the tile selection, then dispatches one `setTarget { cell }`; every other Place WordCell tap, drag and cancelled long-press dispatches nothing.
- `src/ui/gestures/tile.ts` -- header l. 11-12: drop "until ticket 9 dispatches there"; say the current target clears with no dispatch and another legal cell clears, then intent.ts sets the target (epic 5 SPEC CAP-7). `wordcellHit` (l. 87-92) unchanged.
- `src/ui/gestures/intent.test.ts` -- l. 92-107 (`AD-12 a non-empty WordCell opens the view … Place are inert`): Place half becomes: a `canSetTarget` cell → `setTarget`, the current target and a not-legal cell → `none`; rename (`… Composing is inert …; Place gives setTarget on a canSetTarget cell only`). The local `view()` (l. 16-40) needs cells with `canSetTarget`/`isLegalTarget` and a `place` for the Place variant.
- `src/ui/gestures/controller.test.ts` -- harness: `board()` (l. 284-455) gains `cell6` (`data-wordcell="6"`, x 150 … 200, y 450 … 510, empty); `tileView('place')` (l. 651-693) gains `cell(6, [], { isLegalTarget: true, canSetTarget: true })` in Place only (cells 3–5 unchanged, Composing unchanged: add cell 6 with no flags there too only if the Composing view needs it to resolve). Supersede l. 3469 (`… a legal non-current cell clear, dispatching nothing`) → `… the current target clears with no dispatch; a legal non-current cell clears, then dispatches one setTarget` (one `setTarget { cell: 5 }`, selection null at the dispatch via `shared.onDispatch`, as l. 3393-3398). Keep l. 3481 as is. Check `AD-12 R-33 … every WordCell drag in Place and Idle, are inert` (l. 4782) still passes. Long-press harness: `t.down(el)`, `t.advance(400)`, `t.fire('pointermove', …)`, `t.fire('pointerup' | 'pointercancel')`; `lostpointercapture` needs `target` = the captured element (see existing lostpointercapture tests).
- `fixtures/session-place-free-letter-two-cards.json` (new) -- the `serializeSession` output of the script in Design Notes; same formatting as `fixtures/session-place-compact.json` (run `npx biome format --write` on it if Biome formats JSON).
- `src/engine/serialize.test.ts` -- import `validPlaceFreeLetterTwoCards` (after l. 213, `with { type: 'json' }`); `ValidName` (l. 278-290) += `'place-free-letter-two-cards'`; `VALID` (l. 293-306) appends it, comment "twelve" → "thirteen" (l. 292); `PROPERTIES` (l. 783+) entry per Design Notes; `REBUILDS` (l. 1657-1720) appends `['session-place-free-letter-two-cards', …, () => play(createSession(191), [...], ['quin', 'quartered', 'mount'])]`. Extract the shared session-place-compact command list into a local `const PLACE_COMPACT: readonly Command[]` used by both rebuilds (byte-identical output).
- `src/architecture-ad2-ad12-ad17.test.ts` -- l. 11 "twelve" → "thirteen"; add `'session-place-free-letter-two-cards.json'` to the sorted list (after `session-place-free-letter-redo-tail.json`).
- `e2e/place.spec.ts` (new) -- android tests skip other projects, desktop test skips non-desktop (copy the `test.skip(test.info().project.name …)` pattern of `e2e/free-letter.spec.ts` l. 30-40). Reuse: `openFixture`/`seedStorage` patterns, `expectSaved`/`storedMove` style from `e2e/tile-drag.spec.ts`/`e2e/tile-tap.spec.ts`, `stashSession`/`sameSession` (`e2e/helpers/board.ts`), `armStorageSpy`/`storageWrites` (`e2e/helpers/storage-spy.ts`), touch long-press helpers (`touchHold` in `e2e/tile-drag.spec.ts` / `e2e/helpers/touch.ts`), `hoverCell`/`hoverPeek` (copy from `e2e/wordcell-view.spec.ts`), `trayIds` for the strip DOM order, `expectUsedCell3` (`e2e/board-phases.spec.ts:335`) for the used-hatch check. The meta delta is ControlRow.svelte `.meta` (`text.placeMeta`); the score is the top bar's score element (find its locator in an existing spec).
- `e2e/wordcell-view.spec.ts` l. 942 comment -- "Place: a WordCell click does nothing (CAP-9)" → "a click on the current target 3 does nothing (F13)"; test unchanged and green.
- Existing coverage kept green, not duplicated: `e2e/tile-tap.spec.ts:299` (R-40 not-legal keeps), `:320` (F13 current-target clears, no dispatch), `:286` (Composing used/empty keep), `e2e/board-phases.spec.ts:307,316,348` (R-42 rings, R-33 used mirror with target).
- `_bmad-output/specs/spec-epic-5-tray/build-notes.md` CAP-7 -- one as-built bullet (the `setTarget` tap action, the fixture's script and literals, S15 done).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/intent.ts` + `intent.test.ts` -- Place `setTarget` tap action; flip the l. 92 test; cases: `canSetTarget` → setTarget, current target → none, not legal → none, a missing cell throws.
- [x] `src/ui/gestures/controller.ts`, `src/ui/gestures/tile.ts` -- `perform` case; header comments.
- [x] `src/ui/gestures/controller.test.ts` -- harness cell 6; supersede l. 3469; new `AD-12 epic 5 Place target` describe covering every I/O row except the desktop click: retarget tap (selection null at dispatch), current-target and not-legal taps, empty legal long-press released in place and after moving > 8 px (one `setTarget { cell: 6 }`), empty not-legal long-press (cell 4: keep, none), empty current-target long-press (variant view, target 6: clear, none), long-press on cell 6 ended by `pointercancel` and by `lostpointercapture` (keep, none), non-empty cell 5 long-press (peek opened, release closes or keeps per F14, none, keep).
- [x] `fixtures/session-place-free-letter-two-cards.json`, `src/engine/serialize.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts` -- fixture and wiring per Code Map and Design Notes.
- [x] `e2e/place.spec.ts` -- every Playwright bullet of the ticket's Acceptance, split as Design Notes' test list.
- [x] `e2e/wordcell-view.spec.ts` -- comment only.
- [x] `_bmad-output/specs/spec-epic-5-tray/build-notes.md` -- CAP-7 as-built bullet.

**Acceptance Criteria:**
- Given ticket 5.9's Acceptance list, when `npm run test:all` and `npm run test:screens` run, then both are green, every listed Playwright case exists with an id-led name, and no screenshot baseline changed.
- Given `session-place-free-letter-two-cards` loaded on android, when the page renders, then wordcell-4's badge reads 2, cell 4's top is the used mirror of card 28, cell 5 is the target and cells 3–4 are ringed; and after one Confirm cell 4 holds only card 20 with no badge.
- Given a desktop hover peek open on cell 4 of that fixture, when the cell is clicked, then the stored Place move's `targetCell` is 4 and the hover peek is still visible.
- Given the unit suite on a Linux-filesystem checkout, when its warm median is measured, then it is under 5 s (AD-17).

**Sentence → test** (P5 = `e2e/place.spec.ts`, S = UI Vitest, never R-id coverage):

| Sentence | Test(s) |
|---|---|
| R-39 (UI) Place WordCells inert except target and viewing | P5 R-39 sequence (won + Undo); S Place describe |
| R-40 legal ringed, not-legal no-op | P5 session-place and won + Undo ring/fade; kept: tile-tap.spec.ts:299 |
| R-41 used cell a legal target | P5 `R-41 R-80 …` (two-cards) |
| R-42 (UI) pre-selected after Validate, retarget, reload | P5 Validate from session-composing, retarget cases, reload test; kept: board-phases.spec.ts:307,316 |
| R-51 retarget keeps the order | P5 `R-51 R-42 R-73 (UI) …` (won + Undo, retarget to 3) |
| R-52 new top is the strip's last card | P5 `R-60 R-52 …` (cell 3 [42, 0, 9, 32, 28], then `addFreeLetter { cell: 3 }`); R-41 test (cell 4 top 42) |
| R-60 commit atomically | P5 `R-60 R-52 …` (redo-tail) |
| R-61 next card after commit, S15 badge | P5 `R-61 R-65 R-80 …` (two-cards) |
| R-62 every column empty → Game over | P5 `R-62 …` (won + Undo) |
| R-80 score change equals preview | P5 R-41 and R-61 tests |
| R-71 retarget is an edit | P5 `R-71 …` (won + Undo, tap cell 4) |
| R-73 (UI) saved before next action, reload | `expectSaved` after every setTarget / setPlacementOrder / confirm in the P5 tests; P5 reload test |
| R-65 (UI) viewing in Place | P5 R-61 test's peek on cell 4; desktop hover-peek click |

Exempt here: fly-to-cell and FLIP (entries 10/11/16), end sheet (epic 6), keyboard target keys (epic 6), winning guard (entry 13).

## Implementation Notes

- Differences from the Code Map (none changes behaviour beyond the ticket):
  - `src/ui/gestures/intent.test.ts` R-33 free-letter test (`AD-12 R-33 a Composing WordCell tap adds the free letter …`): its Place-with-a-tail-selection line expected `deselect`; with the Place branch placed before `if (selection === null)` as the Code Map prescribes it now gives `none` (a Place view never has a tail selection, so this was an unreachable combination). Expectation and comment updated; not listed in the Code Map.
  - P5 3 (rings on redo-tail and won + Undo) is two tests, one per fixture: `seedStorage` seeds once per page (AD-17 Seeding), so each fixture gets its own page.
  - P5 7's top-card drag is on card 13 (cell 6's top in won + Undo); mid-drag `dragResidue` reads `{ classes: 0, transforms: 0 }`.
  - P5 14 (desktop) waits for the hover peek in real time (`toBeVisible` auto-wait) instead of a paused page clock.
- Fixture: `fixtures/session-place-free-letter-two-cards.json` written from `serializeSession` of the Design Notes script (temporary engine test, deleted); single line, no trailing newline, as session-place-compact (Biome does not include `fixtures/`). Literals match Design Notes: cursor `{ index: 2, phase: 'place' }`, `placementOrder` [26, 32, 45, 28, 42], `targetCell` 5, legal 3–5, cell 4 [20, 28]. Score 89; Confirm into 5 → 110 (+21), retarget 4 then Confirm → 105 (+16).
- Verification: `npm run test:all` green (lint, check, 2237 unit tests, build 513,537 / 600,000 bytes, dist smoke 14, e2e 494 passed / 450 skipped, pwa 12); port 5173 was free. `e2e/place.spec.ts`: 15 android + 1 desktop tests. `npm run test:screens` green (10 passed), no baseline written or changed. Unit suite on the Linux filesystem (`~/wordcell-watch`, src and fixtures synced): 3.13 s (discarded warm-up), then 2.91, 2.89, 2.92 s → warm median 2.91 s (< 5 s, AD-17).
- Mutation check: with intent.ts's Place branch forced to `none`, the P5 long-press-on-5 and R-41 tests fail (restored after).

## Plan Change Log

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 22 findings — high 0, medium 0, low 13, false 9, maybe-false 0
- findings:
  - `[false]` `[reject]` (blind) the Place branch before `selection === null` silently keeps a tail selection in Place (was `deselect`), against rule 6 — a tail selection cannot exist in Place: only Idle columns `canPickUp`, a drop deselects before its dispatch (controller.ts), Undo and Redo deselect first (TopBar.svelte `undo`/`redo`), and `selectTile` throws while a tail is selected (overlays.svelte.ts); a throw would guard an unreachable state.
  - `[low]` `[patch]` (blind) three e2e/place.spec.ts names lead with `AD-12` although R-39 applies — reordered to `R-39 R-42 AD-12 …` (two long-press tests) and `R-39 AD-12 Composing …`.
  - `[low]` `[reject]` (blind) the R-39 sequence's drags from cell 4 and cell 6 rely on `touchHold` + `moveTo` landing within 400 ms of real time — one `page.evaluate` and one CDP send between touchStart and touchMove, the same pattern as every WordCell and tile drag P5 in e2e/free-letter.spec.ts and e2e/tile-drag.spec.ts; passed in every run; a paused-clock rewrite adds machinery for no observed flake.
  - `[low]` `[patch]` (blind) controller Vitest `AD-12 R-51 …` asserts `placementOrder` on the static fake view, which can never fail — assertion, its helpers and "the order is untouched" removed from the name (the exact `setTarget { cell }` command already pins that no order is sent).
  - `[low]` `[reject]` (blind) PROPERTIES `place-free-letter-two-cards` uses `?? 0` / `?.` and does not pin `canSetTarget`, `used` or the top card — a missing draft still fails the entry; the idiom matches the existing `place-compact` entry; every property the ticket pins is asserted, and the used mirror and the top card are asserted in the P5 tests.
  - `[false]` `[reject]` (blind) the plan's Change Log and Triage Log are empty while `in-review` — the Change Log is filled only on a bad_plan loopback and the Triage Log by this step; the fix would edit this build's plan.
  - `[low]` `[patch]` (blind) tile.ts header "Clear:" list mixes bare citations with list items — citations put in parentheses, rewrapped, no other wording change.
  - `[low]` `[reject]` (blind) a fourth local `dispatched` helper in controller.test.ts — the per-describe copy is the file's existing pattern; hoisting is the entry 14 sweep's (S1 consolidation), not a defect here.
  - `[low]` `[patch]` (blind) the R-41 P5 never checks that the old target 5 becomes a ringed legal cell — `expectLegal(page, [3, 5])` added after the retarget.
  - `[low]` `[patch]` (blind) intent.test.ts name "empty and Composing is inert" — now "are inert".
  - `[false]` `[reject]` (edge) Place WordCell tap with a tail selection keeps it (rule 6) — as the first blind row: unreachable.
  - `[low]` `[reject]` (edge) touchHold drags flaky past 400 ms under load — as the blind flake row.
  - `[low]` `[patch]` (edge) the pointercancel half of `AD-12 F1 … pointercancel or lostpointercapture …` never asserts no dispatch (the second `ready()` resets `navCalls`) — `expect(navCalls).toEqual([])` added before the second `ready()`.
  - `[low]` `[reject]` (intent) R-73 tested as eventual equality (`expectSaved` polls) — the entry 5/7/8 pattern; `game.dispatch` writes `wordcell:session` synchronously (AD-4, AD-9), so equality holds before the next input; the redo-tail Confirm also counts exactly one write.
  - `[false]` `[reject]` (intent) Place with a tail selection now `none`, not `deselect` — as the first blind row: unreachable; recorded in Implementation Notes.
  - `[false]` `[reject]` (intent) serialize.test.ts changes more than listed (`PLACE_COMPACT` extraction, `isLegalTarget` check) — the extraction is the plan's Code Map and the session-place-compact rebuild stays byte-identical (its AD-17 rebuild test passes); the extra check is consistent with the fixture.
  - `[low]` `[patch]` (intent) "no WordCell view on a not-legal tap" proved in the browser only on empty cells — the R-61 R-65 R-80 P5 now taps non-empty not-legal cell 9 with tile 45 selected: no view, tile kept, Session byte-identical.
  - `[low]` `[reject]` (intent) the long-press peek's sticky (overflow) branch is Vitest-only in Place — the release path is phase-independent (`releasePeek`) and browser-covered by e2e/wordcell-view.spec.ts; the ticket asks only that a Place peek still opens, which the R-61 P5 proves.
  - `[false]` `[reject]` (intent) R-52's drop done by tap-select and tap-drop — the ticket says "dropping", not dragging; both give the same `drop` command.
  - `[false]` `[reject]` (intent) the R-39 sequence gains a top-card drag and the ring bullet spans several tests — the pass 3 minor and AD-17 seeding (one fixture per page), both recorded in the plan.
  - `[false]` `[reject]` (intent) desktop hover peek relies on existing controller behaviour — described, not a defect; the desktop P5 passes.
  - `[false]` `[reject]` (intent) R-62 "no dialog" holds trivially (end sheet is epic 6) and F1 clear-before-dispatch is Vitest-only — the ticket's own scoping; nothing diverges.

## Design Notes

**Fixture (verified at planning by a temporary engine run, file deleted).** Seed 191, words `['quin', 'quartered', 'mount']`: session-place-compact's commands + `CONFIRM` (QUARTERED → cell 9; cell 4 left [20, 28] = I N), then `drop(4, 3, 8)` (column 4's 3 cards O T U on column 8; default k 1, D = card 26 M, side left), `{ type: 'addFreeLetter', cell: 4 }` (card 28 N), `{ type: 'arrange', arrangement: [32, 45, 28, 42] }` (O U N T), `VALIDATE` → MOUNT. Result: 3 moves, cursor `{ index: 2, phase: 'place' }` (n = 2), `freeLetters` [4], `targetCell` 5, legal 3–5 (3 and 5 empty, 4 used), `placementOrder` [26, 32, 45, 28, 42], `scoreDelta` 21, activeMs 0. So c = 4 ≤ L = 5, c ≠ target 5, cell 4 holds exactly 2 cards: the SPEC CAP-7 conditions hold (the Notes' rule-7 stop does not fire). Expected after Confirm into 5: cell 4 [20], cell 5 [26, 32, 45, 28, 42], cursor `{ index: 3, phase: 'idle' }`; after `setTarget 4` + Confirm: cell 4 [20, 26, 32, 45, 28, 42] (28 once, top 42, R-52). The rebuild's `play` gets its own word list, never `FIXTURE_WORDS`.

**PROPERTIES entry.** Place; `moves.length === cursor.index + 1`; the move's `freeLetters` has exactly one cell c; c ≤ `view(s).draft.letterCount`; c ≠ the move's `targetCell`; `view(s).cells` c holds exactly 2 cards; c `isLegalTarget`.

**P5 tests** (each seeded fresh; "won + Undo" = session-won, then one Undo: Place at cursor 7, legal 3–6, target 6, cells 3–5 empty):
1. `R-40 R-39 (UI)` session-place: cell 3 target, 4–10 faded; a tap on 4 and on 3 dispatches nothing, stored Session byte-identical.
2. `R-42 (UI)` session-composing with the dictionary loaded: Validate → target 3 pre-selected, 4–10 faded, stored `targetCell` 3.
3. `R-40 R-42 (UI)` session-place-free-letter-redo-tail and won + Undo: ring (legal non-current), check on target, fade (not legal).
4. `R-71 …` won + Undo: Redo enabled; tap cell 4; Redo disabled; `targetCell` 4 saved.
5. `R-51 R-42 R-73 (UI) …` won + Undo: strip tap-swap to a non-default order, then tap cell 3: `placementOrder` unchanged in `current().session`, storage and strip DOM (`trayIds`), cell 3 the target, `targetCell` 3, cursor unchanged.
6. `AD-12 R-39 …` won + Undo: long-press cell 5 released in place → `targetCell` 5; separate test: long-press cell 3 (400 ms), move past 8 px over cell 4, release → `targetCell` 3.
7. `R-39 F1 F13 …` won + Undo, a strip tile selected before each: tap not-legal 7 (kept, no WordCell view), drag from cell 4 ending in `pointerup` (cleared), drag on cell 6's top card (target, non-empty: no face transform or drag class, cleared), tap current target 6 (cleared); each no dispatch, stored Session byte-identical; then tap cell 4 → `targetCell` 4, selection cleared.
8. `R-62 …` won + Undo: strip swap, tap cell 3, Confirm: cell 3 cards bottom → top equal the reordered strip, cursor `{ index: 8, phase: 'idle' }` in both, `primary-action` reads `New game`, every column empty, no dialog.
9. `R-60 R-52 …` redo-tail: storage spy armed, Confirm (target 3): cursor `{ index: 2, phase: 'idle' }`, `moves` length 2 in both, exactly one `wordcell:session` write, column 4 without 32 and column 6 without 9 (`column-<n>` card ids), Redo disabled, cell 3 [42, 0, 9, 32, 28]; then drop column 2's bottom card on column 6 (tap-select, tap-drop), tap cell 3 → the Composing draft's `freeLetters` [3].
10. `R-41 R-80 …` two-cards: read meta delta and score; tap cell 4 → `targetCell` 4 in both, cursor and `placementOrder` unchanged; Confirm → cell 4 [20, 26, 32, 45, 28, 42], cursor `{ index: 3, phase: 'idle' }` in both, score change = delta.
11. `R-61 R-65 R-80 …` two-cards: badge 2 on cell 4, top is the used mirror; select a strip tile; long-press cell 4 → peek opens, no dispatch, Session byte-identical, target 5, tile kept; close the peek; Confirm → cell 4 shows card 20, no badge, cursor `{ index: 3, phase: 'idle' }` in both, score change = delta.
12. `R-73 (UI) R-42 …` two-cards: strip swap, tap cell 4, select a strip tile, reload: same strip order and tags, target 4, cell 4 the used-hatch mirror with the target state, nothing selected.
13. `AD-12 R-39 …` session-composing, a tile selected: long-press an empty WordCell, release: no dispatch, Session byte-identical, tile still selected.
14. desktop `R-65 (UI) …` two-cards: hover cell 4 400 ms → hover peek; click → `targetCell` 4 saved; hover peek still visible.
Every test asserts stored Session = `current().session` after each `setTarget`, `setPlacementOrder` and `confirm` (R-73).

**Review-log items, one by one:**
- Open major (desktop hover peek as consumer): applied — listed in Code Map Consumers below, I/O row, AC 3, P5 14; wordcell-view.spec.ts:942 stays green (comment only).
- Pass 3: not-legal tap on 7 opens no view → P5 7; drag c's top card in Place → P5 7 (cell 6's top, won + Undo) and S l. 4782 kept; "c holds exactly 3 cards after the first commit" → recorded in Design Notes fixture (cell 4 holds 3 cards [20, 28, 35] after QUIN; 2 after QUARTERED); session-place byte-identical → P5 1.
- Pass 4: "in both" = `current().session` and storage → every P5; bullet 4 expected columns → P5 9; R-62 own test → P5 8; session-place cases already covered → kept, P5 1 adds only byte-identity and fade; R-80/R-65 in names → P5 10, 11; intent.ts header stale → Code Map; cancelled long-press needs an empty legal non-current cell → harness cell 6; empty not-legal and empty current-target long-press rows → S; setTarget observable (`targetCell`, cursor and `placementOrder` unchanged) → P5 5, 10; R-73 inside bullet 2, 3, 5 tests → every P5; R-51 retarget cell 3 → P5 5; R-41 Confirm into c with the free letter once → P5 10; desktop click test → P5 14; cut "(no existing e2e covers it)" and "it" → "the tile selection" are ticket wording, not code: nothing to build.

**Consumers (L1):** the empty-WordCell long-press-as-tap (classify.ts:48) now dispatches in Place; the non-empty long-press peek (still no dispatch); the desktop hover peek (stays open on a dispatching click); entry 13's winning-guard long-press uninstall (not built yet).

## Verification

**Commands:**
- `npm run test:all` -- expected: green (if port 5173 is held by a stale dev server not started by this build, run every step and the dev-server e2e on a scratch port as entry 8 did; record it).
- `npm run test:screens` -- expected: green, no baseline written or changed.
- Unit suite warm median on a Linux-filesystem checkout (e.g. `~/wordcell-watch`) -- expected: under 5 s; record the runs.

## Auto Run Result

**Summary.** Ticket 5.9 built. In Place a tap on a WordCell with `canSetTarget` (legal, not the current target) clears the tile selection (`tileTap`, F1), then dispatches one `setTarget { cell }` (intent.ts `tapAction` Place case, controller.ts `perform`); `placementOrder` is untouched (R-51). An empty cell's long-press released by `pointerup`, wherever released, is that tap (classify.ts unchanged); a cancelled long-press, the current-target tap (clears, F13), a not-legal tap (keeps) and any WordCell drag dispatch nothing; a non-empty cell's long-press still peeks with no dispatch. Confirm (ActionBar.svelte, unchanged) is re-proved for R-60, R-61, R-52, R-62 and R-80. New valid fixture `session-place-free-letter-two-cards` (seed 191, MOUNT with free letter 28 from cell 4 holding [20, 28], target 5) settles the ticket's unknown (S15) and is wired into serialize.test.ts and the AD-17 list.

**Review-log items (invocation).** Open major: resolved — the desktop hover peek is listed among the Consumers (Design Notes), and a desktop P5 shows a click on legal non-current cell 4 setting the target with the hover peek still open; wordcell-view.spec.ts ~l. 942 stays green (comment updated). Unapplied minors (pass 3, pass 4): each mapped in Design Notes "Review-log items, one by one"; the two ticket-wording minors need no build work.

**Files changed.**
- `src/ui/gestures/intent.ts` — `setTarget` tap action for Place; header.
- `src/ui/gestures/controller.ts` — `perform` dispatches `setTarget`; header.
- `src/ui/gestures/tile.ts` — header: the "until ticket 9" note resolved.
- `src/ui/gestures/intent.test.ts`, `src/ui/gestures/controller.test.ts` — superseded Place tests flipped; harness cell 6; new `AD-12 epic 5 Place target` describe.
- `fixtures/session-place-free-letter-two-cards.json` — new valid fixture.
- `src/engine/serialize.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts` — fixture wiring, "thirteen".
- `e2e/place.spec.ts` — new: 15 android + 1 desktop tests.
- `e2e/wordcell-view.spec.ts` — comment only.
- `_bmad-output/specs/spec-epic-5-tray/build-notes.md` — CAP-7 as built.

**Review findings.** 22 findings (high 0, medium 0, low 13, false 9). Patched (7, all low): R-id-led e2e names; vacuous order assertion removed; pointercancel no-dispatch assertion; tile.ts citations parenthesised; R-41 old-target ring check; intent test name; a browser tap on non-empty not-legal cell 9. Deferred: none. Rejected: 15, each with its reason in the Review Triage Log (9 false: the unreachable Place tail selection ×3, plan-bookkeeping, scope descriptions; 6 low: touchHold timing ×2 (house pattern, no flake seen), PROPERTIES idiom, helper duplication (entry 14 sweep), eventual-equality R-73 (synchronous store write), Vitest-only sticky peek in Place (phase-independent path)).

**Follow-up review recommendation:** false. Patched by verdict: high 0, medium 0, low 7.

**Verification.** After the patches, on this tree: `npm run lint` (199 files), `npm run check` (exit 0), `npm test` (54 files, 2237 tests), `npm run build` (in budget), `npm run test:e2e:dist` (14 passed), `npm run test:e2e` (494 passed, 450 skipped, 0 failed; `e2e/place.spec.ts` 16 passed), `npm run test:e2e:pwa` (12 passed) — every `test:all` step, run in sequence in two commands, port 5173 free; `npm run test:screens` (Docker) 10 passed, no baseline written or changed. Unit warm median 2.91 s on the Linux filesystem (implementer, before the test-only patches).

**Residual risks.**
- The P5 WordCell drags (cells 4 and 6) start in real time; a CI worker stalling > 400 ms between touchStart and touchMove would turn them into long-presses (house pattern, never observed).
- Entry 13's winning-guard long-press uninstall (a consumer of the press path) is not built yet; it must keep the Place long-press-as-tap.
