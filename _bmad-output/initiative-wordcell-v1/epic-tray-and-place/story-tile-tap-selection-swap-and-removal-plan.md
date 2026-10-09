---
title: 'Tile tap: selection, swap and removal'
type: 'feature'
ticket: '5'
created: '2026-10-09'
status: 'built'
baseline_revision: 'd2adfce555ff5266ca1d9a8311999b7a434d8f29'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-tile-tap-selection-swap-and-removal.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-tile-tap-selection-swap-and-removal.review-log.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/SPEC.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Epic 6 key commands call cancel(), not act(), so they must also clear the tile selection on a phase change
      (and keyboard/AT tile activation is epic 6's); review log 5.5 passes 3 and 4.
    severity: minor
    location: src/ui (epic 6 keyboard map)
  - summary: >-
      The selected tile is signalled only by the `selected` CSS class; no aria state (e.g. aria-pressed) announces it.
    evidence: |-
      src/ui/Card.svelte adds class:selected only; screen-reader labels and focus are epic 6 per the epic Boundaries.
    location: >-
      src/ui/Card.svelte
    severity: low
---

<intent-contract>

## Intent

**Problem:** Tray and strip tiles are inert (epic 4 F23), so a player cannot arrange the tray or the strip, or return a free letter, with taps (SPEC CAP-4, R-33, R-34, R-35, R-51, R-71, R-73).

**Approach:** Add a tile selection to `overlays.svelte.ts` (F1), resolve tray/strip presses as tile hits and tray-band mirrors as block hits (F2), decide every released tap with a pure `tileTap(hit, view, tileSelection)` in `src/ui/gestures/tile.ts`, wire its result in the controller, clear in `act()`, and render the selected look (DESIGN.md Tile) with the tile area's clip raised only at its top edge.

## Boundaries & Constraints

**Always:** the ticket (`story-tile-tap-selection-swap-and-removal.md`) is the contract: every Description bullet and every Acceptance bullet; AGENTS.md rules 1–7 and Conventions (test names start with the id; UI/shell Vitest named `AD-n`; P5 names carry the R-ids; `data-testid` only as listed); the engine command TABLE in `src/engine/commands.test.ts` decides no-op vs throw; a stale `tileSelection` (not a live tile of the current phase) throws `AD-13 …`/`AD-12 …` (rule 6); `npm run test:all` and `npm run test:screens` green with **no baseline change**; unit suite stays under the 5 s budget.

**Never:** no engine or shell source change; no tile drag motion (CAP-5, ticket 7); no `addFreeLetter`/`setTarget` dispatch (tickets 8, 9); no history entry for the tile selection; never clear inside `controller.cancel()` (hide flush, AD-9); no lifted-card shadow on tiles; never remove `.tiles` `overflow: hidden` (compact rows past the second stay clipped until CAP-9); no edit to the ticket file.

## I/O & Edge-Case Matrix

`sel` = `overlays.tileSelection`. Composing tiles: live S + free letters (`draft.arrangement`); mirrors = block. Place tiles: `place.placementOrder`.

| Scenario | Input / State | Expected | Error handling |
|---|---|---|---|
| Select | tap live tile, sel null | `select(card)` | — |
| Swap | tap other live tile, sel set | one `arrange` (Composing) / `setPlacementOrder` (Place) with the two exchanged; sel cleared first | — |
| Deselect | tap sel again; S tile or any strip tile | sel null, no dispatch, stored Session byte-identical | — |
| Remove | tap sel again; Composing free letter | sel cleared, `removeFreeLetter{cell}` for the `draft.freeLetters` cell whose `originCard` is sel | miss throws (lookup `found`) |
| Keep | block mirror; scrim/sheet; Composing WordCell with `!canAddFreeLetter` (used/empty, empty long-press = tap); Place WordCell `!isLegalTarget` | sel unchanged | — |
| Clear | Composing `canAddFreeLetter` cell; Place current target or `canSetTarget` cell; column card/space (any dispatch result); `outside` (tray background, labels, disabled controls, top bar, `[data-band="actionGap"]`) | sel null; no new dispatch beyond existing `tapAction` | — |
| Drag-as-tap | non-tile, non-block press ≥ 8 px ending `pointerup` | `tileTap` keep/clear only (+ unchanged R-39 `tapDestinationCard`) | select/swap/remove/deselect from a drag throws (unreachable) |
| F18 | live tile press crossing 8 px | `clearTile()` at the crossing, nothing at any end | — |
| Keeps | block press/drag; non-tile press ended by pointercancel, lostpointercapture, sameId, `cancel()`/`cancel({byBack})`; tile press < 8 px ended by pointercancel; long-press peek (incl. ≥ 8 px after it); non-pointer `click()` (detail 0) | sel unchanged | — |
| act() | any `act()` button | `cancel()`, then `clearTile()`, then the handler | — |
| Stale | sel not a tile of the current phase / no draft | — | `tileTap` throws |

</intent-contract>

## Code Map

- `src/ui/overlays.svelte.ts` -- add `let tileSelection = $state<CardId | null>(null)`; `selectTile(card)` (throws if a tile or tail selection is set or card ∉ 0–51), `clearTile()` (no-op when null), getter `tileSelection`; `resetForNewSession` clears it. No `push`/nav. `import type { CardId }` from `../engine/index`.
- `src/ui/gestures/tile.ts` (new) -- pure `tileTap(hit: Hit, view: GameView, selection: CardId | null): TileAction`, `TileAction = select{card} | deselect | swap{command: Command} | remove{cell} | keep | clear`. Uses `originCard` (`../tray/tags`) for the free-letter cell; `Command` is `import type` from `../../engine/index`. Header comment cites SPEC CAP-4, F1, F2, F13, F18, R-33, R-34, R-35, Q-31.
- `src/ui/gestures/intent.ts` -- `Hit`: `tile` becomes `{ kind: 'tile'; card: CardId }`, add `{ kind: 'block' }`; `tapAction` throws for `tile`/`block` like `sheet`/`scrim` (drop the `case 'tile'` outside branch); `hoverAction` returns null for both (already does by flow; keep it explicit if needed).
- `src/ui/gestures/controller.ts` -- `resolve` (l. 261-269): tray/strip → `{kind:'tile', card: attribute(card,'data-card-id')}`, tray mirror → `{kind:'block'}`; `pointermove` crossing: `if (p.hit.kind === 'tile') overlays.clearTile()`; `pointerup` (l. 676-685): on `tap`, apply `tileTap` (clear before any dispatch), then `perform(hit)` only for non-tile/non-block hits; on drag-as-tap (drag null, outcome `drag`) for non-tile/non-block hits apply `tileTap`'s keep/clear before the R-39 dispatch; `click()` (l. 719-727): tile/block → `OUTSIDE` before `perform`, never `tileTap`. Update the header's "Taps" and "Composing" paragraphs. Do not touch `cancel()`/`end()` clearing.
- `src/ui/act.ts` -- after `controller.cancel()`, `overlays.clearTile()`, then the handler.
- `src/ui/Card.svelte` -- new `selected` prop → `class:selected` on the wrapper; `.card.tile.selected .face { transform: translateY(-4px); outline: 2px solid var(--wc-accent-teal); z-index: 3 }` (no shadow; DESIGN.md Tile). Compact half-gap owner: `.card.tile.compact { position: relative }` + `::before { content:''; position:absolute; inset:-2px 0 }` so the 4 px row gap splits 2/2 (horizontal half-gaps are already inside the pitch wrapper). The pseudo inherits `touch-action`.
- `src/ui/tray/TileRows.svelte` -- pass `selected={!tile.mirror && overlays.tileSelection === tile.id}` and `returnSlot={selected && tags.has(tile.id)}` (Card already hides `↩` in the strip). Clip (open major): keep `overflow: hidden`, raise only the top edge by lift + outline: `padding-top: 6px; margin-top: -6px` on `.tiles` with the inline height staying `sizing.area` (content-box, so the box is area + 6 tall, bottom unchanged, rows unmoved).
- `src/ui/tray/tags.ts` -- reuse `originCard`; no change.
- `e2e/board-phases.spec.ts:464-476` -- AD-11 (F2) assertion updated in step: `overflow: hidden` stays; the clip box is 98 tall with its bottom where the 92 px area ended and the first tile row's top 6 px below its top (rows unmoved).
- Tests to touch: `src/ui/overlays.svelte.test.ts`, `src/ui/act.test.ts`, new `src/ui/gestures/tile.test.ts`, `src/ui/gestures/intent.test.ts` (tile cases at l. 71-79, 156-163, 227-230, 298, 395 move to the new Hit shape/throw), `src/ui/gestures/controller.test.ts` (harness tile at l. 340, captured-element case l. 593, tile cases l. 1241, 1462-1475). New P5 spec `e2e/tile-tap.spec.ts` (android only, `test.skip` as `e2e/tray-controls.spec.ts:10-12`).
- Reuse: `e2e/helpers/board.ts` (`openFixture` with `steps`, `tapAt`, `box`, `centre`, `stashSession`/`sameSession`, `trayIds`), `e2e/helpers/blocking.ts` `stored`, `e2e/helpers/dialogs.ts` `expectLeaves` (back leaves the app), `e2e/helpers/lifecycle.ts` `hidePage`/`showPage`, `e2e/helpers/style.ts` `tokenColor`, `e2e/helpers/touch.ts` `touchHold`/`longPress`.
- Consumers (retrospective L1) of the changed F25 outside-tap classification and `act()`: tail-selection deselect paths (`tapAction` outside/wordcell branches, `cancel({byBack})`, `closedByBack`), the scrim click swallower (`click-swallow.ts`, untouched: it runs before `click()`), every `act()` button (TopBar Undo/Redo, ActionBar Validate/Confirm/New game, ControlRow −/+/Flip, DictionaryBanner Reload, HistoryNotice/Dialog actions, App's Session-rejected New game). `clearTile()` there is a no-op outside Composing/Place.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/overlays.svelte.ts` + `overlays.svelte.test.ts` -- tile selection state per Code Map; AD-13 tests: select/clear, no history entry (`nav.push` not called, depth unchanged), `resetForNewSession` clears, invalid `selectTile` throws.
- [x] `src/ui/gestures/intent.ts` + `intent.test.ts` -- Hit shape; `tapAction` throws on tile/block; `hoverAction` null for tile/block (AD-12 test).
- [x] `src/ui/gestures/tile.ts` + `tile.test.ts` -- `tileTap` total over Hit per the I/O matrix; AD-12 cases for every row, incl. scrim/sheet keep, available Composing cell and legal non-current Place cell clear, empty-cell (long-press → tap) keep, stale selection throws, swap commands exact.
- [x] `src/ui/gestures/controller.ts` + `controller.test.ts` -- wiring per Code Map; AD-12 cases: tray/strip/mirror resolution (stub `elementFromPoint` returning the wrapper, i.e. a hit inside the pitch outside the face resolves to its tile); D-block mirror drag keeps; ≥ 8 px on the tray background ended by pointerup clears, by pointercancel and by lostpointercapture keeps; F18 live-tile ≥ 8 px ended by pointerup or pointercancel clears, dispatches nothing; tile press < 8 px then pointercancel keeps; sameId and `cancel({byBack:true})` keep; `cancel()` (before-hide) keeps; long-press peek (and peek + ≥ 8 px move) keeps; a changed swap/remove dispatch ends the selection; detail-0 click on outside or a tile leaves the tile selection alone; a column-card tap in Composing clears and still dispatches `tapDestinationCard`. Update the existing epic 4 tile cases to the new rules and list each in Implementation Notes.
- [x] `src/ui/act.ts` + `act.test.ts` -- AD-4 case: `cancel()`, then `clearTile()`, then the handler (order observed), and with no selection still fine.
- [x] `src/ui/Card.svelte`, `src/ui/tray/TileRows.svelte` -- selected look, `↩`, compact half-gap owner, raised clip.
- [x] `e2e/board-phases.spec.ts` -- the AD-11 (F2) clip assertion updated in the same commit as the clip change.
- [x] `e2e/tile-tap.spec.ts` -- every ticket Acceptance P5 bullet, plus the carry-ins marked P5 under Design Notes; each edit asserts `stored(page,'wordcell:session')` equals `current().session` before the next action (R-73); selection read by the live tile's `selected` class.
- [x] `_bmad-output/specs/spec-epic-5-tray/build-notes.md` CAP-4 -- close-out edit: `tileTap` returns the six-way result (no `none`); the "one clear-rules function used by the controller and act()" bullet becomes "act() clears unconditionally after cancel(); target-dependent keep/clear only in `tileTap`"; F18 threshold clear; the raised-clip mechanism.

**Acceptance Criteria:**
- Given the ticket's Acceptance list, when `npm run test:all` and `npm run test:screens` run, then both are green, every listed UI Vitest and P5 case exists with an id-led name, and no screenshot baseline changed.
- Given a compact tray with a row-1 tile selected on android, when its face box grown by 2 px is measured, then it is inside the tray band's rect and not clipped, the slot rect equals the unselected one, and a third compact row (if present) stays clipped.

## Design Notes

**Open major (raised clip).** `.tiles` keeps `overflow: hidden`; `padding-top: 6px; margin-top: -6px` (4 px lift + 2 px outline) moves only the clip's top edge up into the word line's bottom 6 px, which is transparent and resolved `outside` either way. Rows, the area bottom and the compact overflow clip are unchanged; the AD-11 (F2) test is updated in step. Chosen over `clip-path: inset(-6px 0 0)` because it keeps `overflow: hidden` (no scrollable overflow from rows 3+ before CAP-9).

**Review-log unapplied minors, one by one** (P5 = goes into `e2e/tile-tap.spec.ts`; V = UI Vitest):
- p6 "(remove there too)" → "(and remove)": reading taken (removal on both fixtures); the ticket file is not edited by the build.
- p6 F18 "any live tile": applied (V; block keeps).
- p6 drop `tapDestinationCard` from the changed-clear: applied: column taps clear through `tileTap` whatever the result; only swap/remove clear by their own outcome.
- p6 only the compact row gap needs an owner: applied (Card `::before`, 2 px per side; above row 1 the 2 px half-gap also belongs to row 1).
- p6 pitch/half-gap is geometry: V stubs `elementFromPoint` to the wrapper; the geometry evidence is P5 Full pitch.
- p6 Undo with a selection needs surviving tiles: applied: P5 Undo on `session-place-free-letter-redo-tail` at load with a strip tile selected → Composing with nothing selected; plus the V act() case.
- p6 lostpointercapture keep: applied (V). p6 sameId / back-cancel keep: applied (V).
- p6 hover over tile/block null: applied (V).
- p6 hide/show keep: applied (P5, `hidePage`/`showPage`, selection still set).
- p6 R-71 non-word swap: applied with cards 41 and 46 (verify their letters make a non-word in the fixture; else pick two other non-38/37 cards and note it).
- p6 empty-cell long-press is a tap for `tileTap`: applied (V, keep in Composing).
- p6 face 4 px up, 2 px teal outline: applied (P5: face top = slot top − 4; `outline` 2px solid `tokenColor('--wc-accent-teal')`).
- p6 `↩` on card-mode free letter 28: applied (P5: `.return.band-r` inside card 28 after one Undo on `session-place-free-letter-redo-tail`).
- p6 long-press peek keep: applied (V; P5 stays CAP-6's).
- p5 R-35 second tap byte-identical: applied (P5). p5 after removal wordcell-4 shows card 35 live and the tray leaves compact: applied (P5). p5 disabled − by coordinate: `tapAt`. p5 Card/TileRows in the file list: Code Map. p5 Consumers: Code Map.
- p4 epic 6 key commands also clear: not this ticket (no key map until epic 6); recorded in `deferred`. p4 non-pointer click leaves the selection: applied (V). p4 no shadow: applied. p4 peek then ≥ 8 px: applied (V). p4 tile press < 8 px + pointercancel keeps: applied (V). p4 build-notes close-out: task. p4 gap element: `[data-band="actionGap"]` spacer, resolves `outside` → clear (V).
- p3 stale selection throws: applied. p3 no phase-change watcher: applied (act(), changed outcomes and `resetForNewSession` cover every phase change this epic wires). p3 keyboard/AT tile activation: epic 6, `deferred`.

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npm run test:screens` -- expected: green, no baseline written or changed.
- `npm test` median on a Linux-filesystem checkout -- expected: under 5 s.

## Implementation Notes

- `tileTap` throws (rule 6) for a stale selection, a tile hit outside Composing/Place or on a card
  that is not a live tile of the phase, and a block hit outside Composing; with nothing selected,
  non-tile hits return keep/clear (a no-op) in every phase, so Idle taps never throw.
- Controller: `applyTile` runs on every released tap before `perform` (skipped for tile/block hits);
  drag-as-tap runs `applyTileDrag` (keep/clear only, anything else throws) before R-39's dispatch;
  `pointermove`'s threshold crossing on a `tile` hit calls `overlays.clearTile()`; `click()` maps
  tile/block to `OUTSIDE` and calls `perform(OUTSIDE)`; `cancel()`/`end()` untouched.
- Epic 4 tile cases updated in `controller.test.ts`: the press-targets case (tray tile and mirror
  captured) and the long-press-timer case now run on a Composing `tileView()` (a tile tap selects;
  the test clears it); the entry 10 `compose()` view gained a `draft` (tileTap reads it); the F25
  detail-0 click on a tile still deselects a tail (mapped to outside). The harness gained `tile2`,
  `stripTile`, `tileFace`, `tray` and `[data-band="actionGap"]` elements. In `intent.test.ts` the
  tile cases at the old l. 71-79, 156-163, 227-230 and 395 became throw cases (tapAction) and
  null cases (hoverAction, tile and block).
- `act.test.ts` mocks `../shell/nav` (act now imports the overlays store).
- P5 (`e2e/tile-tap.spec.ts`): R-71 non-word swap uses 41 (S) and 46 (U) → UBRRCS, rejected by
  Validate as expected. The enabled-control case presses +, then − (enabled at k = 2), then
  Validate at k = 1 (TAN; TANE is not a word). The compact full-pitch case uses tile 1 (A, row 1);
  no fixture has a third compact row, so that clause is not exercised.
- Unit suite on a Linux-filesystem copy: 2.43 s warm median (3 runs after a warm-up).


## Plan Change Log

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 26 findings — high 0, medium 1, low 14, false 11, maybe-false 0
- findings:
  - `[false]` `[reject]` blind: tapping the visible raised strip of a selected face clears (row 1) or swaps with the row above (compact row 2) — by design: ticket "the 4 px lift moves the face only", review log pass 4 item 4 deleted the visible-face hit rule as contrary to AD-12 / DESIGN.md Hit rects (slot pitch).
  - `[low]` `[reject]` blind: 6 px raise, 4 px lift and 2 px outline are unlinked literals — unlikely to bite in everyday work (DESIGN.md fixes both values; the comments name the sum); a token would add surface.
  - `[low]` `[reject]` blind: "a third compact row stays clipped" never exercised — no reachable fixture has 15+ tiles before CAP-9; the clip bottom edge and `overflow: hidden` are asserted in the AD-11 (F2) test.
  - `[low]` `[reject]` blind: compact half-gap only tested below row 1 — the ticket asks exactly that case; the `::before` is symmetric CSS.
  - `[low]` `[patch]` blind: controller test name claims a legal non-current Place cell clear but never taps one — harness `cell5` (legal, non-current) added and tapped: clears, no dispatch.
  - `[false]` `[reject]` blind: available Composing cell, legal non-current Place cell and action gap have no P5 — the ticket assigns these interim cases to UI Vitest (Acceptance, UI Vitest bullet); its P5 Clear list does not include them.
  - `[low]` `[patch]` blind: `tileFace` harness element unused — removed (pitch geometry is P5's, review log p6).
  - `[low]` `[patch]` blind: `toContain(['keep','clear'])` weak assertion in tile.test.ts — exact per-hit results.
  - `[low]` `[reject]` blind: `overlays.select` has no guard while a tile is selected — unreachable (a tile selection exists only in Composing/Place and every route to Idle clears it); adding a branch guards undemonstrated state.
  - `[false]` `[reject]` blind: exact layout equality in board-phases may be flaky — the file already asserts exact px (`tray.height` 176) at both widths and all values are integral; `card-42` is first by `session-composing`'s arrangement [42, 0], side right.
  - `[low]` `[reject]` blind: R-71 e2e misses selection/stored checks after the non-word swap and Validate — the swap's clear is covered in the Composing swap tests; the failed-Validate stored Session is covered by tray-controls R-38 tests.
  - `[low]` `[defer]` blind: selected state is CSS-only, no aria state — screen-reader labels are epic 6 (epic Boundaries); deferred.
  - `[false]` `[reject]` blind: plan lacks run evidence, `ticket: '5'`, iteration 0 — fix edits this build's plan; `ticket` is find's `id` as the workflow requires; results go in Auto Run Result.
  - `[low]` `[patch]` blind: header comments in controller.ts and TileRows.svelte overrun the wrap width — reflow.
  - `[false]` `[reject]` edge: compact row ≥ 2 selected-face top strip resolves to the row-above tile's half-gap — by design (same as row 1 above).
  - `[false]` `[reject]` edge: row-1 selected-face top strip resolves outside — by design (ticket F2, review log pass 4 item 4).
  - `[medium]` `[patch]` verification-gap: R-39 drag-as-tap with a tile selected has no test of clear-before-dispatch — controller AD-12 case added.
  - `[false]` `[reject]` intent: "any phase change" enforced by call sites, not a watcher — review log pass 3 default (no watcher); every phase change this epic wires goes through act(), the controller or `resetForNewSession`; epic 6 keys already deferred.
  - `[false]` `[reject]` intent: changed-dispatch clear not gated on `changed` — review log p6 minor drops the gate; a real swap or removal is always changed (build-notes CAP-4).
  - `[false]` `[reject]` intent: scrim/sheet keep by early return, not `tileTap` — same observable outcome, and `tileTap` stays total (tested).
  - `[low]` `[reject]` intent: F2 carve-out enforced by a runtime throw rather than a narrowed type — no runtime harm; narrowing would split the shared Hit union across modules.
  - `[false]` `[reject]` intent: `.tiles` box measures 98 px — the resolution of the review log's open major (raise only the clip's top edge, rows unmoved), asserted in step.
  - `[low]` `[reject]` intent: Vitest pitch cases tap the wrapper — review log p6: pitch is geometry, P5 Full pitch is the evidence (same root as the `tileFace` patch).
  - `[low]` `[reject]` intent: second Composing 38/37 swap does not re-check Redo/tail — the first swap already dropped the tail; a re-check proves nothing.
  - `[low]` `[patch]` intent: no test carries R-72 although rule-coverage maps "three tile edits then one Undo" to R-72 — P5 renamed to lead with R-72.
  - `[false]` `[reject]` intent: no record of test:all / test:screens runs — both ran green in step 3 (logged under Auto Run Result).

## Auto Run Result

**Summary:** Tile tap (SPEC CAP-4): `overlays.tileSelection` (`selectTile`/`clearTile`, no history entry, cleared by `resetForNewSession`); tray/strip presses resolve to `tile` hits and tray mirrors to `block` hits (F2); pure `tileTap` (select | deselect | swap | remove | keep | clear) wired in the controller's tap and drag-as-tap paths, F18 clear at a tile press's threshold, non-pointer `click()` mapping tile/block to outside; `act()` clears after `cancel()`; selected look (4 px lift, 2 px teal outline, no shadow, `↩` on Composing free letters); compact row-gap halves owned by each tile; the tile area's clip raised 6 px at the top only (open major resolved, `overflow: hidden` kept, rows unmoved, AD-11 (F2) assertion updated in step). Every review-log unapplied minor is resolved in Design Notes.

**Files:**
- `src/ui/overlays.svelte.ts` (+ test) — tile selection state.
- `src/ui/gestures/tile.ts` (+ `tile.test.ts`, new) — `tileTap`.
- `src/ui/gestures/intent.ts` (+ test) — `tile{card}`/`block` hits; `tapAction` throws on them.
- `src/ui/gestures/controller.ts` (+ test) — press resolution, tile wiring, F18, click carve-out.
- `src/ui/act.ts` (+ test) — `clearTile()` after `cancel()`.
- `src/ui/Card.svelte` — `selected` look, compact half-gap `::before`.
- `src/ui/tray/TileRows.svelte` — `selected`/`returnSlot`, raised clip.
- `e2e/tile-tap.spec.ts` (new, 20 android tests); `e2e/board-phases.spec.ts` — AD-11 (F2) clip assertion.
- `_bmad-output/specs/spec-epic-5-tray/build-notes.md` — CAP-4 close-out edit.

**Review:** 26 findings — 6 patched (1 medium: R-39 drag-as-tap clear-before-dispatch test; 5 low: Place legal non-current cell tap, unused `tileFace`, exact `tileTap` assertions, R-72 test name, comment reflow), 1 deferred (no aria selected state, epic 6), 19 rejected with reasons in the triage log (11 false, 8 low).

**Follow-up review recommended:** false — first pass patched 0 high and 1 medium (all test-only or comment changes).

**Verification:** `npm run test:all` green after patches (2124 unit tests, 435 Playwright passed, 391 skipped by project, dist and pwa suites green); `npm run test:screens` green (10 passed, no baseline written or changed); unit suite warm median 2.43 s on a Linux-filesystem checkout (implementer).

**Residual risks:** a stale tile selection throws at the next tap if a future phase-change path bypasses `act()` (epic 6 key commands, deferred); no fixture reaches a third compact row, so its clipping is covered only structurally (bottom edge and `overflow: hidden` asserted).
