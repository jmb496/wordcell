---
title: 'Tile drag in the tray and the strip'
type: 'feature'
ticket: 7
created: '2026-10-09'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-tile-drag-in-the-tray-and-the-strip.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
warnings: ['oversized']
deferred: []
baseline_revision: '2318fac075c76d2ae7a76e2af00477b634d6bc5c'
---

<intent-contract>

## Intent

**Problem:** Tray and strip tiles can only be rearranged by tap-swap; a crossed tile press does nothing (controller header "no tile drag until CAP-5"), so R-34/R-51 drag-reorder, the tray band as a drop target and the parting animation (SPEC CAP-5) are missing.

**Approach:** Implement ticket 5.7 exactly as written (its Description, bullets and Acceptance are the contract; read the ticket file first): a tile variant of the controller's `Drag` that moves the tile face by `transform`, targets the tray band (registered via `use:dropTarget`, clipped to the visible band) at ≥ 25 %, parts the other movable faces to entry 6's `insertionIndex` gap with WAAPI, and on release dispatches one `arrange` / `setPlacementOrder` iff the order changes, else flies back.

## Boundaries & Constraints

**Always:** Ticket 5.7 text wins over this plan where they differ (report the difference). SPEC CAP-5: D-block mirrors never move during a reorder drag (no inline transform, no animation on any `[data-mirror-of]`); gaps never inside or beyond the block (entry 6's `gapRects` over the run guarantees it). No Svelte state or store write during the drag except the F18 threshold `overlays.clearTile()`; `game.dispatch` only at release, at most once. Hit rects (wrappers) never move: only `.face` elements get transforms. Geometry only from entry 6 (`trayLayout`, `slotRects`, `gapRects`, `partingOffsets`, `insertionIndex`, `reorder`); `w` and `trayInnerWidth` through controller deps, never `window.innerWidth`. Durations only from `motion.ts` (`duration('parting')`, `duration('flyBack')`). Rule 6: lookups throw through `lookup.ts`; no try/catch. Test names start with their id (AD-n for UI Vitest). Cite ids, don't restate rules, in comments.

**Never:** No landing glide on an edit (entry 16, CAP-8 F17): an edit renders the new order at rest at once. No free-letter drag, caret or mirror parting (entry 8). No new exports beyond: one `tile.ts` entry point, drop-target.ts's tray accessor (and its params variant), the `.tiles` clip class in `classes.ts`, the `Layout.trayInnerWidth` getter and two `ControllerDeps` members. No `SELECTION_LIFT_PX` for the tile lift and no new constant for it. No ghost at the origin slot, nothing drawn at the gap. No engine, shell or AD-2 change. No screenshot baseline change. Do not edit the ticket file or the AGENTS.md managed block. Do not re-measure `origin` per move (review-log pass 2 minor, not applied: see Design Notes).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Reorder edit | Composing `[42, 0]`, tile 0 held over gap 0 (≥ 25 %), released | one `arrange [0, 42]`; drag + parting cleared before the dispatch, gate idle at it; hover repainted after | — |
| Strip edit | Place `[42, 0, 28]`, tile 28 to gap 0 | one `setPlacementOrder [28, 42, 0]` | — |
| Own gap | tile released over gap j or j + 1 | no dispatch; tile flies back (`flyBack`), parted faces return over `duration('flyBack')` | — |
| Under 25 % | face's overlap with the clipped tray rect < 25 % (exactly 25 % accepts) | every other face rests (origin slot open); release flies back, no dispatch | — |
| Selected tile dragged | tile selected, crosses 8 px | selection cleared at the threshold; first transform `translate(dx, dy − lift)`, lift = slot top − face top (4); fly-back lands unlifted | — |
| Block mirror drag | press on a `[data-mirror-of]` in the tray, ≥ 8 px | nothing moves, no dispatch, tile selection kept | — |
| Gap changes | two gap changes within one parting duration | each change animates every other movable face from its current offset to the new one over `duration('parting')`; superseded animation cancelled and replaced; reduced motion: written at once, no animation | a parting/return animation cancelled by anything but the controller throws (rule 6) |
| Platform cancel | `pointercancel` / `lostpointercapture` / `cancel({ byBack: true })` mid-drag | fly-back + returns, no dispatch, nothing selected | — |
| Settle at once | `cancel()` (hide, `act()`), same-id pointerdown, detach | every transform, class and animation cleared at once, gate idle, no dispatch, nothing selected | — |
| New press during a return | button-0 pointerdown while a fly-back or return runs | both finished first (gate never idles between) | — |
| No tray target | tile drag with no or two `kind: 'tray'` registrations | — | throws (rule 6) |

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` (923 lines) -- press machine. `Drag` (l. 163) becomes a union: existing fields as the column variant plus a `kind` discriminant; a tile variant holds `faces: [face]`, `wrappers: [wrapper]`, `x/y/dx/dy/lift`, the `.tiles` element, run data (`first`, `count`, `tileCount`, `from`, the run's faces in run order), `slots`, `gaps` (`gapRects` result), `accepted: boolean`, `gap: number | null` (last move's). `startDrag` (l. 429) is called at the crossing (l. 633); add a tile branch for `hit.kind === 'tile'` that runs before `overlays.clearTile()` (l. 632) so the lift is measured first. `dragMove` (l. 504) gets a tile branch: transform, `pickTarget` with the clipped tray rect as the sole candidate (`hasLeftSource` true), `insertionIndex`, then a parting update only when acceptance or gap changed. `end()` (l. 340): tile `flies` = `kind === 'up' ? release is no edit : pointercancel | lostCapture | cancel byBack`; non-flying ends clear at once; the edit path finishes the parting (gate count settled synchronously), then one `clearDrag` (dragged face + `.tiles` class + every parting transform), then `gate.leave()`; `pointerup` (l. 714) then dispatches the release command and calls `refreshHover()` (as the column drop, l. 757-764). Crossing (l. 629-638): a tile drag also `clearHover()`s and `hover.hideHoverPeek()`s. `pointerdown` (l. 585-589) and `cancel()` (l. 886-895): finish the parting returns as well as the flight. Replace the header's "(no tile drag until CAP-5)" paragraph with one behaviour summary of the tile drag. The parting set (per-face running animation map, one gate count while any parting or return animation runs, `finishAll`, read-current-offset) is an unexported section of this file (tile.ts stays pure).
- `src/ui/gestures/tile.ts` -- pure; add the one entry point `tileRun(view: GameView, card: CardId)` → `{ first, count, tileCount, from, release(gap): Command | null }` (Composing: run = `draft.arrangement`, `first` = k when `draft.side === 'left'` else 0, `tileCount` = |M| + k; Place: run = `placementOrder`, `first` 0, `tileCount` n; `release` = `reorder(order, from, gap)` compared by card → `arrange` / `setPlacementOrder` (same command shapes as `tileHit`'s swap, l. 67-74) or null). Throws (rule 6) for a card not live in the phase, outside Composing/Place. Return type may stay unexported.
- `src/ui/gestures/fly-back.ts` -- reuse for the dragged tile (`flyBack(drag, false)`: lands unlifted). Narrow the parameter to the fields it reads (`faces`, `wrappers`, `dx`, `dy`, `lift`) by making `createFlyBack` generic over the drag type so `clearDrag` receives the controller's full variant; no new export.
- `src/ui/gestures/drop-target.ts` -- `DropTargetParams` gains `{ kind: 'tray' }`; one tray registration kept apart from `targets`; `columnTargets()` stays columns-only; new accessor `trayTarget(): Element` throws on none; a second tray registration throws; `update`/`destroy` handle the tray entry (a kind change on `update` throws).
- `src/ui/gestures/classes.ts` -- add the `.tiles` clip class, `DRAG_TILES = 'wc-drag-tiles'`, and name TileRows.svelte among the literal-keeping CSS files in the header.
- `src/ui/gestures/visible-band.ts` -- reuse `clip()` and `createVisibleBand` unchanged.
- `src/ui/gestures/targeting.ts`, `src/ui/layout/tray.ts` -- reuse unchanged (`pickTarget`, `MIN_RATIO` inclusive, `insertionIndex`, `reorder`, `trayLayout`, `slotRects`, `gapRects`, `partingOffsets`; `slotRects` JSDoc defines `origin`: tray position 0's wrapper top-left + 2 px x).
- `src/ui/Tray.svelte` -- `use:dropTarget={{ kind: 'tray' }}` on the `[data-band="tray"]` div.
- `src/ui/tray/TileRows.svelte` -- scoped rules: `.tiles:global(.wc-drag-tiles)` lifts `overflow` to `visible`; `.tiles :global(.face.wc-drag-layer)` z-index 5 + `box-shadow: 0 6px 16px #0008` (Column.svelte l. 220). `.face` is already `position: relative` (Card.svelte l. 172). Header comment: one sentence on the drag classes.
- `src/ui/layout/layout.svelte.ts` -- `Layout` gains `readonly trayInnerWidth: number` (`metrics.board - 16`, JSDoc: DESIGN.md Tray band padding 8 + 8).
- `src/ui/Board.svelte:61` -- `innerWidth={layout.trayInnerWidth}` instead of `metrics.board - 16`.
- `src/main.ts:120-126` -- `ControllerDeps` gain `w(): number` (`layout.w`) and `trayInnerWidth(): number` (`layout.trayInnerWidth`), read once at drag start.
- Tests: `src/ui/gestures/controller.test.ts` (harness l. 113-561: `FakeEl` rects incl. `translate()` parsing l. 166-176, `FakeAnimation` l. 66-84 with `finish`/`onfinish`/`oncancel`, `durations.kinds` recorder l. 32-43, `motion.value.reduced` l. 25, `board()` tray l. 348-354 with `tile`(3)/`tile2`(4)/`stripTile`(6)/`trayMirror` and no faces/rects yet, `setup()` drop-target registration l. 488-491, `tileView(phase)` l. 564-605 (`arrangement [3,4]`, destination `[5]`, Place order `[3,4,6]`), epic 5 describe l. 3266 with `move`/`crossed`/`ready` l. 3269-3283). `src/ui/gestures/drop-target.test.ts` (43 lines), `src/ui/gestures/tile.test.ts`, `src/ui/layout/layout.svelte.test.ts` (getter case), `src/ui/gestures/fly-back` has no own test (covered by controller.test.ts).
- E2E reuse: `e2e/helpers/touch.ts` `touchHold`; `e2e/helpers/board.ts` `openFixture` (`steps`), `box`, `centre`, `tapAt`, `stashSession`/`sameSession`, `trayIds`; `e2e/helpers/blocking.ts` `stored`; `e2e/helpers/drag.ts` `dragResidue`/`expectNoResidue`; `e2e/helpers/lifecycle.ts` `hidePage`/`showPage`/`animationFrames`; `e2e/helpers/dialogs.ts` `expectLeaves`. Patterns to copy (locally, S1 consolidation is entry 14's): `e2e/drag-interruptions.spec.ts` `game`/`storedGame` `activeMs: 0` comparison (l. 101-117), pointercancel via the captured element's `dispatchEvent(new PointerEvent('pointercancel', …))` (`trackPointerId`/`cancelCaptured` l. 516-546), App button mid-drag via `dispatchEvent('click')` (l. 423), hide mid-drag (l. 177-223); `e2e/drag.spec.ts` F34 scrolled-board setup (l. 604-660: `test.use({ viewport })`, scroll, premise asserts); `e2e/tile-tap.spec.ts` `expectSaved`/`expectSelected`/`open` (l. 39-92) and its android-only `beforeEach` skip; `e2e/board-phases.spec.ts:335` `expectUsedCell3` (local, not exported: copy it); `e2e/tray-controls.spec.ts:17-21` control locators (Flip by accessible name `Flip`, exact). E2E may import `trayLayout`/`slotRects`/`gapRects`/`partingOffsets` from `../src/ui/layout/tray` (e2e already imports from `../src/engine/index`).
- Fixtures (no new fixture): `session-composing` (`[42, 0]`, D col 6, k 1, right), `session-place` (`[42, 0, 28]`), `session-place-compact` (Place `[35, 1, 38, 44, 11, 36, 9, 7]`, 7 + 1 at android width), `session-place-free-letter-redo-tail` + one Undo (Composing `[32, 28]`, 28 the free letter of cell 3), `session-won` + one Undo (Place `[41, 3, 38, 37, 5, 46]`, Redo enabled).
- Consumers (retrospective L1, for the ticket review): the visible-band clip now also feeds the tray band (other consumers: epic 4 `pickTarget` column targeting and the column drop-target registrations); the new drag's gate enter/leave and the parting gate count (consumers: layout re-layout, the banner latch, the w recompute); fly-back.ts's parameter narrowing (consumer: the epic 4 column-drag fly-back, every existing fly-back test must pass unchanged); the `trayInnerWidth` getter (consumers: Tray/TileRows `trayLayout` via Board, and the controller's `slotRects`).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/drop-target.ts` + `drop-target.test.ts` -- tray variant and accessor per Code Map; AD-12 cases: registers and reads the tray element, `columnTargets()` excludes it, none → accessor throws, a second tray registration throws, destroy removes it.
- [x] `src/ui/gestures/tile.ts` + `tile.test.ts` -- the pure run/release entry point; AD-12 cases: Composing block right/left/k = 0 runs, Place run, release → command iff the order changes by card (own gap j and j + 1 → null), a gap past a block on the right ends at M's end, non-live card throws.
- [x] `src/ui/gestures/classes.ts`, `src/ui/tray/TileRows.svelte`, `src/ui/Tray.svelte` -- clip class, drag-layer rule, tray registration.
- [x] `src/ui/layout/layout.svelte.ts` + test, `src/ui/Board.svelte`, `src/main.ts` -- `trayInnerWidth` getter and the two controller deps.
- [x] `src/ui/gestures/fly-back.ts` -- parameter narrowing only.
- [x] `src/ui/gestures/controller.ts` -- tile drag, parting set, ends, hover, header per Code Map and Design Notes.
- [x] `src/ui/gestures/controller.test.ts` -- harness: tiles get `.face` children and rects, a `.tiles` element, the tray registered with `kind: 'tray'` in `setup()`, deps `w`/`trayInnerWidth` (entry 5's tile tests keep passing with the tray registered). Supersede :3449 (crossed mouse tile press hover) and the end half of :3430 (keep its F18 threshold-clear assertion); list both in Implementation Notes. New AD-n tests: every UI Vitest bullet of ticket Acceptance, plus Design Notes' Vitest minors.
- [x] `e2e/tile-drag.spec.ts` (new, android only, `test.skip` as tile-tap.spec.ts) -- every Playwright bullet of ticket Acceptance plus Design Notes' P5 minors; edit releases assert `expectSaved` (R-73 (UI)) then one `dragResidue` read equal to zeros (no polling); no-edit live-tile drags first assert the held face (`wc-drag-layer`, inline transform) mid-drag.
- [x] `_bmad-output/specs/spec-epic-5-tray/build-notes.md` CAP-5 -- as-built close-out: tile.ts entry point name, the parting set living in controller.ts, return animations only on faces off rest, current offset read from the face rect minus its slot.

**Acceptance Criteria:**
- Given ticket 5.7's Acceptance list, when `npm run test:all` and `npm run test:screens` run, then both are green, every listed UI Vitest and Playwright case exists with an id-led name, and no screenshot baseline changed.
- Given a tile drag in progress on android, when any face in the tray is read, then no `[data-mirror-of]` face carries an inline transform or a running animation (SPEC CAP-5 "D-block mirrors never move").
- Given the unit suite on a Linux-filesystem checkout, when its warm median is measured, then it is under 5 s (AD-17).

**Sentence → test** (rule-coverage rows this ticket owns; P5 = `e2e/tile-drag.spec.ts`, android; V = UI Vitest, never R-id coverage):

| Sentence | Test(s) |
|---|---|
| R-32 (UI) a block-mirror drag moves nothing; gaps never inside or beyond the block | P5 `R-32 (UI) a block-mirror drag …` (selection kept, no dispatch, no tray face transformed while held); P5 `R-32 (UI) after + (k = 2) tile 42 held over mid-block parts tile 0 one slot left …` (no mirror transformed); V entry 6's `gapRects` block cases (unchanged) |
| R-32 drag past the block lands at the M end | P5 `R-32 tile 42 released right of the block (one row, F25) stores [0, 42]`; the k = 2 case |
| R-33 a dragged-out free letter is not removed | (P5 supplementary; R-id coverage is the engine Vitest `src/engine/commands.test.ts`, `src/engine/view.test.ts`) P5 `R-33 … free-letter tile 28 released over WordCell 3: Session byte-identical, cell 3 used` |
| R-34 drag-reorder | (P5 supplementary; R-id coverage is the engine Vitest `src/engine/commands.test.ts`) P5 `R-34 R-73 (UI) tile 0 to gap 0 on session-composing stores [0, 42]`, `R-34 … tile 28 to gap 0 stores [28, 32]`, `R-34 R-32 after Flip tile 0 to gap 0 …` |
| R-51 strip drag reorder | (P5 supplementary; R-id coverage is the engine Vitest `src/engine/commands.test.ts`) P5 `R-51 R-73 (UI) tile 28 to gap 0 on session-place stores [28, 42, 0]`, the session-place-compact geometry case `[1, 38, 44, 11, 36, 9, 7, 35]` |
| R-71 a no-change drag is not an edit | (P5 supplementary; R-id coverage is the engine Vitest `src/engine/commands.test.ts`) P5 `R-71 on session-won + one Undo strip tile 38 released over its own gap 2 leaves Redo enabled` |
| R-73 (UI) a reorder saved before the next action | `expectSaved` after every edit release above |
| AD-12 tray band single target ≥ 25 %, clipped (F4) | P5 under-25 % case, F4 clip case, the hold-over-a-column case; V exactly-25 % inclusive, sole candidate |
| AD-12 F5 cancel paths | P5 hidePage, back, pointercancel, App button; V `pointercancel`/`lostpointercapture`/`cancel({ byBack })`/`cancel()` |
| AD-12 F18 drag clears the tile selection | V cancel-path tests ending with nothing selected; P5 hidePage/pointercancel/App-button cases with a tile selected first |
| AD-10 parting 0.5 × base, snap under reduced motion | V `AD-10 …` (`duration('parting')` recorded; reduced: transforms at once, no animation) |

Exempt here: free-letter drag, caret, mirror parting (entry 8); landing glides (entry 16); the wrapped-block drop (F25) is judged by the owner by hand.

## Implementation Notes

- Superseded in `src/ui/gestures/controller.test.ts` (epic 5 tile tap describe): the former :3430 `AD-12 F18 a ≥ 8 px press on any live tile clears at the threshold and dispatches nothing, ended by pointerup or pointercancel` keeps only its threshold half (renamed `AD-12 F18 a ≥ 8 px press on any live tile clears the tile selection at the threshold`); its ends are now the tile drag's (new `AD-12 epic 5 tile drag` describe). The former :3449 `AD-12 CAP-8 a crossed mouse tile press released over a Composing destination card repaints the k hover at pointerup` is replaced by `AD-12 a mouse tile drag clears hover and hides the hover peek at its threshold, closes the peek at its end, and repaints hover only at the fly-back's settle (or after an edit dispatch)`.
- Harness: the tray band now has a rect and a `.tiles` child holding tray positions 0 (tile 3), 1 (tile 4), 2 (strip tile 6 / the mirror), each with a `.face` on its resting slot (w 40, tray inner width 384 → tileWidth 44, H 53, perRow 8, origin (10, 640)); `setup()` registers the tray `kind: 'tray'`; deps `w`/`trayInnerWidth`; `tileView` drafts carry `k: 1, side: 'right'`; `FakeAnimation` gained `cancel()` (no later finish).
- `tileRun` also returns `order` (the run), which the controller needs for the run faces; its return type stays unexported.
- Unknown (ticket) resolved: back mid-drag uses the default. `page.goForward()` from about:blank reloads the app (a window marker set before the back was gone after it, checked once with a scratch spec), and the stored Session is read there.
- Ticket vs plan: the ticket says every edit release ends with `expectNoResidue`; the plan (p6 minor) asks for one non-polling `dragResidue` read equal to zeros after `expectSaved`. The edit releases use the single read (`expectEdit`), which is the stricter form; the App-button case ends with `expectNoResidue` as the ticket says.
- F4 clip (P5): the test scrolls by max(0, tile-row bottom + 4 − action-bar top) at 412 × 600 under reduced motion, then asserts the premises (tile 0 pressable, the bar's top inside the tray band below the tile row, the held face ≥ 25 % of the whole band and < 25 % of its visible part) before holding.
- Verification: `npm run test:all` green (lint, check, 2199 unit tests, build within budget, dist smoke 14, e2e 453 passed / 409 skipped, pwa 12). `e2e/tile-drag.spec.ts`: 20 android tests (after the review fixes). Unit suite on the Linux filesystem (`~/wordcell-watch`, src and fixtures synced): 2.94 s (discarded warm-up), then 2.51, 2.54, 2.57 s → warm median 2.54 s (< 5 s, AD-17).
- `npm run test:screens` NOT run: Docker Desktop was not running (no daemon on `dockerDesktopLinuxEngine`, no WSL integration). No baseline file changed; the CSS added applies only under the drag classes and the Tray's `use:dropTarget` adds no markup, so no screenshot change is expected, but this is unverified until the owner runs it.
- Orchestrator verification (2026-10-09): `npm run test:all` re-run, exit 0 (e2e 453 passed, pwa 12 passed). Docker Desktop started, then `npm run test:screens` exit 0, 10 passed, no baseline written or changed (tree status unchanged). Matrix audit: every I/O row covered by a passing `controller.test.ts` / `drop-target.test.ts` / `tile.test.ts` case.

## Plan Change Log

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 27 findings — high 0, medium 3, low 18, false 5, maybe-false 1
- findings:
  - `[low]` `[patch]` (blind) `part()`/`home()` restart a running animation whose target is unchanged on a gap change (stutter, longer gate hold) — remember each running animation's target; skip when equal.
  - `[false]` `[reject]` (blind) unchecked `slots[p]`/`offsets[p]` casts break rule 6 — `slots` and `partingOffsets` both have length `tileCount` and `p = first + r < first + count ≤ tileCount` by `tileRun`'s construction; the out-of-range read cannot happen.
  - `[maybe-false]` `[reject]` (blind) no assertion that `.tiles` children count equals `run.tileCount` — each pointer event is its own task, so Svelte has flushed any prior dispatch; a missing tile already throws in the `runFaces` lookup. Would only be low if real; fix adds a guard.
  - `[medium]` `[patch]` (blind) block-on-the-left parting path has no controller Vitest — grouped with the verification-gap finding below.
  - `[low]` `[patch]` (blind) back-mid-drag `expectNoResidue` after `goForward()` runs on a reloaded page and cannot fail — assertion removed.
  - `[low]` `[reject]` (blind) drag-layer P5 does not prove paint order — the ticket's acceptance names exactly computed z-index 5, the shadow and `overflow: visible` (as drag-interruptions.spec.ts); faces are `pointer-events: none`, so `elementFromPoint` cannot see them.
  - `[low]` `[patch]` (blind) at-rest geometry P5 opens a second page sharing localStorage without try/finally — split into one test per fixture.
  - `[low]` `[reject]` (blind) "flies back" in P5 names not asserted (snap would pass) — the fly-back vs snap is pinned by the controller Vitests (R-71, F4, F5 cases); asserting WAAPI starts in Playwright is racy.
  - `[low]` `[reject]` (blind) no desktop Playwright coverage — the ticket's verify and acceptance place the hover behaviour in UI Vitest and the drags on android; out of scope per the intent.
  - `[low]` `[patch]` (blind) two drop-target.ts rule-6 throws untested (column element registered as tray; tray handle used after destroy) — cases added.
  - `[low]` `[patch]` (blind) `export type Drag` now unused — made module-private.
  - `[false]` `[reject]` (blind) two reduced-motion sources (`duration('parting') === 0` vs `prefs.motion.reduced`) — both derive from `prefs.motion.reduced` (motion.ts `duration`), and the returns need the flag for fly-back.ts's fade as fly-back.ts itself reads it.
  - `[false]` `[reject]` (blind) `tileCommand` computed twice — pure and deterministic on the same drag state; no divergence possible.
  - `[low]` `[reject]` (blind) "wrappers never move" not asserted — no code path writes a wrapper transform; adding the assertion fixes no defect.
  - `[low]` `[reject]` (blind) plan triage log empty and a stale "test:screens NOT run" note — fix edits this build's plan (the orchestrator bullet records the screens run).
  - `[low]` `[reject]` (blind) harness tray mirror `data-mirror-of="1"` vs destination `[5]` — the controller never reads a mirror's id (a block hit carries none); no behaviour depends on it.
  - `[low]` `[reject]` (edge) stale slots/gaps after a document scroll mid-drag (desktop wheel) — the intent measures `origin` once (ticket Geometry); wheel scroll during a mouse drag is retrospective A8, epic 6 (SPEC Non-goals); touch drags cannot scroll (`touch-action: none`). Same as review-log pass 2 minor, recorded not applied.
  - `[medium]` `[patch]` (verification-gap) controller tests never cover `run.first > 0`; the Flip P5 never checks where tile 42 parts — Flip P5 asserts tile 42 transformed and settled on `slots[2]`; a `side: 'left'` controller Vitest added.
  - `[medium]` `[patch]` (verification-gap) a plain `cancel()` during a tile drag's returns is untested — tile-drag version of the mid-fly-back `cancel()` Vitest added.
  - `[low]` `[reject]` (intent) superseding a running parting reads the inline end in the harness, not the visible position — in a browser `getBoundingClientRect()` includes the running animation's effect (the design); a motion-on mid-flight Playwright check would be timing-dependent.
  - `[low]` `[patch]` (intent) dragging the selected tile itself never runs in a browser — android P5 added (no jump at pickup, nothing selected, lands unlifted, Session byte-identical).
  - `[false]` `[reject]` (intent) a selected tile X glides down when Y is dragged — X's selection ends at the threshold (F18) either way; the rect-based read turns the CSS snap into a `duration('parting')` glide to rest, which is presentation only, gate-counted and finished before any dispatch.
  - `[low]` `[reject]` (intent) drag-layer paint order not observed — same as the blind drag-layer row.
  - `[low]` `[reject]` (intent) desktop hover only in Vitest — same as the blind desktop row.
  - `[low]` `[reject]` (intent) "origin slot shows nothing (no ghost)" not asserted — the tile drag adds no ghost class or element; nothing to regress beyond the absent code.
  - `[low]` `[reject]` (intent) parting/return timing only via the harness — the ticket names the AD-10 check as UI Vitest at controller level.
  - `[false]` `[reject]` (intent) the geometry oracle shares `trayLayout`/`slotRects`/`partingOffsets` with the code — the ticket's acceptance defines the check against exactly those functions (entry 6's deferred geometry check), with DOM-measured inputs and literal stored results.

## Design Notes

**Parting mechanics.** Current offset of a face = its `getBoundingClientRect()` left/top minus its resting slot (`slots[first + r]`); in the browser the rect includes a running animation's effect, in the harness the inline end value. On each acceptance/gap change, for every run face except the dragged one: target = accepted ? `partingOffsets(slots, tileCount, first, count, gap, from)[first + r]` : rest; skip when current equals target and nothing runs; else cancel a running animation (clear its `oncancel` first), `animate([{transform: translate(cur)}, {transform: target or translate(0px, 0px)}], { duration: duration('parting'), easing: 'ease-out' })` and write the end transform inline (`''` at rest, as fly-back.ts). Reduced motion (`duration('parting') === 0`): write at once, no `animate`. Returns (no-edit release, any fly-back end): faces off rest animate to rest over `duration('flyBack')`; under reduced motion clear the transform and fade `opacity` 0 → 1 as fly-back.ts. One gate count: enter when the set goes from idle to running, leave when its last animation finishes or at `finishAll` (synchronous settle, as `finishFlight`). Any `oncancel` not caused by the controller throws (rule 6).

**Review-log unapplied minors, one by one** (P5 = into `e2e/tile-drag.spec.ts`; V = UI Vitest):
- p7 under-25 %: applied (P5 asserts no *other* face inline-transformed; the held face keeps its transform).
- p7 hover: applied (supersede :3449 and :3430's end half, keep :3430's threshold clear).
- p7 Flip by accessible name `Flip`: applied (P5).
- p6 "D-block mirrors never move": applied (Always + AC 2; P5 k = 2 and Flip cases).
- p6 App button via `+` on session-composing → k 2, `[42, 0]`: applied (P5; `dispatchEvent('click')` as the Undo case).
- p6 edit releases read `dragResidue` once without polling: applied (P5).
- p6 hover repaint after the edit dispatch: applied (code + V).
- p6 a new press during a return finishes it first: applied (code + V).
- p6 tray accessor throws on none or a second registration; entry 5 tile Vitests register a tray target: applied (drop-target.test.ts, harness).
- p6 AD-12 tags on the drag-layer and geometry cases: applied (P5 names start `AD-12`).
- p6 Consumers (L1): applied (Code Map).
- p5 hover V also asserts the peek closes at the end and hover repaints at an edit release's end: applied (V).
- p5 lift no-jump V (`translate(dx, dy − 4)`): applied (V; the harness sets the selected face's rect 4 px above its slot).
- p5 k = 2 hold: no inline transform on any mirror: applied (P5).
- p5 tile.ts stays pure: applied (DOM/WAAPI in controller.ts).
- p5 F4 "parts nothing" read once settled or under reduced motion: applied (P5 under `emulateMedia({ reducedMotion: 'reduce' })`).
- p5 block-left `gapRects` cases stay entry 6's V: applied (no new geometry V).
- p4 exactly-25 % inclusive tray acceptance: applied (V).
- p4 R-71 and session-place under-25 % cases name the tile and gap j, Redo enabled before the drag: applied (P5: R-71 tile 38, own gap 2; under-25 %: tile 42 parting toward gap 3 first, then moved out).
- p4 hold over a column first, assert no `wc-drag-target`: applied (P5, in the session-composing reorder case).
- p4 drop-target.test.ts tray registration cases: applied.
- p4 centre held faces on the named gap's `gapRects` rect: applied (P5 computes the target point from `slotRects`/`gapRects` with the in-page origin, `w`, `trayInnerWidth`).
- p3 release finish settles the parting gate count synchronously: applied (code + V gate idle at dispatch).
- p3 same-id pointerdown and detach snap at once: applied (V).
- p3 strip marks travel with their faces and update at release: applied (P5 after the session-place edit: card 28 shows `bottom`, card 0 `top`; marks are inside the face so they move with it).
- p3 concrete F4 viewport/scroll, premise-asserted: applied: android `test.use({ viewport: { width: 412, height: 600 } })`, scroll so the action bar's top lies just below the tile row (tile pressable, control row under the bar); premises: tile centre resolves to the tile, `actionBar.top` inside the tray band, the chosen held face rect has ≥ 25 % with the unclipped band and < 25 % with the clipped one (computed in the test before release).
- p2 re-measure `origin` per move for a desktop wheel scroll mid-drag: not applied: the ticket's Geometry bullet measures `origin` once per `slotRects`' JSDoc, and wheel scroll during a mouse drag is retrospective A8 (epic 6, SPEC Non-goals; 4.8-p2b accepted the same drift for column drags).

**Unknown (ticket).** Back mid-drag: read the stored Session after `page.goForward()` restores the app (default); if Playwright 1.63 does not restore it, use `page.context().storageState()` after the back and record which in Implementation Notes.

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npm run test:screens` -- expected: green, no baseline written or changed.
- Unit suite warm median on a Linux-filesystem checkout (e.g. a worktree under `~/`) -- expected: under 5 s; record the runs in Implementation Notes.

## Auto Run Result

**Summary.** Ticket 5.7 built: a live tray or strip tile press crossing 8 px becomes a tile drag in `controller.ts` (lift measured before the F18 clear; face-only transform; the clipped tray band as the sole ≥ 25 % `pickTarget` candidate; `insertionIndex` gap; WAAPI parting of the other run faces over `duration('parting')`, written at once under reduced motion; D-block mirrors never move). A release on the last move's accepted gap that changes the order dispatches one `arrange` / `setPlacementOrder` after one `clearDrag` and `gate.leave()`; every other release, `pointercancel`, `lostpointercapture` and `cancel({ byBack: true })` fly back unlifted with the parted faces returning; `cancel()` (hide, `act()`), a same-id pointerdown and detach settle at once.

**Files changed.**
- `src/ui/gestures/controller.ts` — tile drag variant, private parting set (one gate count, target-aware supersede), ends, hover, header.
- `src/ui/gestures/tile.ts` — pure `tileRun(view, card)` (run, first, count, tileCount, from, `release(gap)`).
- `src/ui/gestures/drop-target.ts` — `{ kind: 'tray' }` registration and `trayTarget()`.
- `src/ui/gestures/fly-back.ts` — generic over the drag type (fields it reads).
- `src/ui/gestures/classes.ts` — `DRAG_TILES`.
- `src/ui/tray/TileRows.svelte` — unclip and drag-layer rules.
- `src/ui/Tray.svelte` — `use:dropTarget={{ kind: 'tray' }}`.
- `src/ui/layout/layout.svelte.ts`, `src/ui/Board.svelte`, `src/main.ts` — `trayInnerWidth` getter and the controller deps `w`/`trayInnerWidth`.
- Tests: `controller.test.ts` (tile-drag describe, superseded :3430 end half and :3449), `drop-target.test.ts`, `tile.test.ts`, `layout.svelte.test.ts`; new `e2e/tile-drag.spec.ts` (20 android tests).
- `_bmad-output/specs/spec-epic-5-tray/build-notes.md` — CAP-5 as-built note.

**Review findings.** 27 findings (high 0, medium 3, low 18, false 5, maybe-false 1). Patches applied (9 rows, 8 entries): target-aware parting supersede, `Drag` made private, block-left controller Vitest and Flip P5 parting check (medium, two rows), plain `cancel()` during returns Vitest (medium), vacuous back-test residue check removed, at-rest geometry P5 split per fixture, selected-tile drag P5, two drop-target throw cases. Deferred: none. Rejected: 18 rows, each with its reason in the Review Triage Log (false claims, ticket-defined scope (android-only P5, measure `origin` once, Vitest-level AD-10), plan-only edits, low findings needing guards).

**Follow-up review recommendation:** false. Patched by verdict: medium 2 entries, low 6 entries, high 0. Both medium entries were missing tests, now added and passing, and the implementer confirmed each fails when its code path is removed, so no unverified risk remains to name.

**Verification.** `npm run test:all` exit 0 after the patches (54 unit files, 2203 tests; build within budget; dist smoke; e2e 455 passed; pwa 12 passed). `npm run test:screens` exit 0, 10 passed, no baseline written or changed (Docker Desktop started by the orchestrator). Unit warm median on the Linux filesystem 2.54 s (implementer, before the patches; the patches add 4 small Vitests).

**Residual risks.**
- F25 (owner, by hand): a tile dropped past a destination block that wraps onto the next tray row lands by F3's nearest gap and may land mid-M; this ticket's P5 covers only a block within one row.
- A document scroll mid-drag (desktop wheel) leaves the drag-start slots stale (review-log pass 2 minor not applied; retrospective A8, epic 6).
- The superseded-animation offset read relies on `getBoundingClientRect()` including a running WAAPI effect; verified in the harness only by the inline end value, not by a motion-on browser test.
