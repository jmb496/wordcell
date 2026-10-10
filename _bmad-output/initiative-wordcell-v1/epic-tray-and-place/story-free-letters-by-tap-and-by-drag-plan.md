---
title: 'Free letters by tap and by drag'
type: 'feature'
ticket: 8
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
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-free-letters-by-tap-and-by-drag.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-tile-drag-in-the-tray-and-the-strip-plan.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
warnings: ['oversized']
deferred:
  - summary: >-
      No real free-letter drag parts a multi-mirror D block across a row break in a browser; the class-driven segment CSS itself (Card.svelte wc-parted / wc-part-start / wc-part-end rules) is browser-checked by the k = 2 P5 `AD-14 a k = 2 block (redo-tail fixture, block right) under wc-parted …`.
    evidence: |-
      Controller Vitest asserts only class writes on a fake DOM; the k = 2 P5 writes the parted classes by hand on a one-row block (lock, face width, edges, badge offset), and the one real-drag P5 parted case has a single mirror (start and end in both states). No fixture holds a Composing block across a row break with an available WordCell (session-place-compact + Undo has none). Settle with entry 12's long Composing fixture: part across the row break with a real drag and assert .lock:visible per mirror and the start/end border widths.
    location: >-
      src/ui/Card.svelte block segment rules
    severity: medium
  - summary: >-
      With ≥ 15 tiles, DRAG_TILES lifts the .tiles clip at the crossing, so the clipped third row shows for the whole drag and can receive a parted tile (clipping accepted until CAP-9); settle with entry 12.
    evidence: |-
      Ticket 5.8 review pass 1 (code review); no fixture reaches ≥ 15 tiles before entry 12's long Composing fixture.
    location: >-
      src/ui/gestures/controller.ts free-letter crossing (DRAG_TILES)
    severity: low
baseline_revision: '875266ca67f5a3cda292ca9a07bb5e545b2d9a4e'
---

<intent-contract>

## Intent

**Problem:** In Composing a WordCell tap or drag adds nothing: an available cell's tap only clears the tile selection and its crossed press is an inert drag-as-tap (tile.ts header "until tickets 8/9"), so R-33/Q-31 free letters (SPEC CAP-6), the cell ghost, the caret (F16) and the D-block mirror parting exception (AD-14) are missing.

**Approach:** Implement ticket 5.8 exactly as written (Description, its bullets and Acceptance are the contract; read the ticket first) on top of entry 7's tile drag: a tap on a `canAddFreeLetter` cell dispatches `addFreeLetter { cell }` after `tileTap`'s clear; its crossed press becomes a third `Drag` variant that moves the top card's live face, leaves `DRAG_GHOST` on the cell, targets the tray band as entry 7 does, parts every tray position after the gap (mirrors included) or shows the caret, and on an accepted release dispatches `addFreeLetter { cell, index }`.

## Boundaries & Constraints

**Always:** Ticket 5.8 wins over this plan where they differ (record the difference in Implementation Notes). Everything entry 7's plan Always lists holds here too (face-only transforms, DOM-only mid-drag, one dispatch at release after `clearDrag` and `gate.leave()`, geometry only from layout/tray.ts and targeting.ts, durations only from motion.ts, rule 6 throws, id-led test names, cite ids). AD-14: a D-block mirror face receives only the parting transform: under reduced motion it is written at once, both parting and return, with no `animate` call of any kind (no opacity fade); live S/F faces keep entry 7's return fade. The index dispatched is the gap in M (0…|M|), never a tray position. "Full" = current tray count (S + F + D mirrors) + 1 > `perRow` × `trayLayout(current count).rows`, checked before calling `partingOffsets`. The caret and parted classes are DOM-only (no Svelte state mid-drag, AD-12).

**Never:** No engine, shell or AD-2 change; no new fixture (session-composing-long.json stays entry 12's). No landing glide on the insert (entry 16); no FLIP. No change to Place or Idle press handling, the long-press peek, or entry 7's tile drag behaviour. No new classes.ts constants beyond the caret, its shown state, the parted marker and the two parted segment classes. No Svelte class directive or `.start`/`.end` class written by the controller. Do not edit the ticket file or the AGENTS.md managed block. No screenshot baseline change.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tap-add | Composing, cell `canAddFreeLetter`, tile selected | selection cleared, then one `addFreeLetter { cell }` (no index) | — |
| Used / empty cell tap or drag | Composing, cell not `canAddFreeLetter` | no dispatch, tile selection kept, nothing moves | — |
| Outside Composing | WordCell drag in Idle / Place | inert as built (no face moves; `tileTap` keep/clear as today) | — |
| Drag start | available cell, press crosses 8 px before 400 ms | top card's face takes `DRAG_LAYER` and follows the pointer; the `[data-wordcell]` takes `DRAG_GHOST`; `.tiles` takes `DRAG_TILES`; tile selection cleared at the crossing (F18) | no tray registration or DOM/view mismatch → throws |
| Parting with room | accepted (≥ 25 % of clipped band), gap g, not full, first + g < tileCount | every tray position ≥ first + g (mirrors included) parts one slot forward over `duration('parting')`; mirrors take `PARTED` + parted segment classes from the parted `mirrorBySlot`; caret hidden | — |
| Caret | accepted and full, or first + g = tileCount | no face moves (parted faces return to rest over `parting`, parted classes off at once); caret shown at the winning gap rect in `.tiles` coordinates | — |
| Unaccepted | under 25 % or outside the band | caret hidden, every tray face at rest, parted classes off | — |
| Edit release | pointerup, last move accepted at gap g | parting finished, one `clearDrag` (face, ghost, `DRAG_TILES`, caret, parted classes, tray transforms), `gate.leave()`, then one `addFreeLetter { cell, index: g }`, hover repaint | — |
| No-edit release / pointercancel / lostpointercapture | — | face flies back to the cell (`flyBack(drag, false)`), parted faces return (mirrors snap under reduced motion), caret and parted classes off at once, ghost cleared at the settle; no dispatch; nothing selected | — |
| Settle at once | `cancel()` (act(), hide), same-id pointerdown, detach | everything cleared at once, gate idle, no dispatch, nothing selected | — |
| Long-press first | timer fires before 8 px | peek opens; later moves never start a drag; release dispatches nothing; tile selection kept | — |

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` -- add a `FreeLetterDrag` variant (`kind: 'freeLetter'`) to the `Drag` union (l. 252): `cell`, `cellEl` (the `[data-wordcell]` carrying `DRAG_GHOST`), `wrappers: [topCardWrapper]`, `faces: [topFace]`, `x/y/dx/dy`, `lift: 0`, `tiles`, `run` (tile.ts `freeLetterRun`), `trayFaces` (every tray position's face in tray order, mirrors included), `mirror: boolean[]` per position, `slots` (resting slot rects for tileCount + 1 positions when not full, else tileCount), `gaps` (`gapRects(slots, perRow, tileCount, first, count)`), `full: boolean`, `perRow`, `caret` element, `tilesRect` (measured once), `accepted`, `gap`. `startDrag` (l. 694): `hit.kind === 'wordcell'` in Composing with `canAddFreeLetter` → `startFreeLetterDrag`; any other WordCell press stays null (inert). Crossing (l. 946-956): the F18 `overlays.clearTile()` also runs when the new drag is a free-letter drag; the hover peek hide/close is already generic. `dragMove` (l. 815): a free-letter branch mirroring `tileMove` (l. 799) — transform, clipped tray acceptance (`TRAY`), `insertionIndex` (keep the returned `GapRect` for the caret), update parting/caret only on an acceptance or gap change. `end()` (l. 526-598): free-letter `flies` as tile (command null on `up`, or pointercancel / lostCapture / cancel byBack); flying → `flight.flyBack(drag, false)` + return of the tray faces + caret hidden + parted classes off; else `parting.finishAll()` + `clearDrag`. `clearDrag` (l. 607): free-letter branch (tray face transforms, dragged face transform and `DRAG_LAYER`, `DRAG_GHOST` off the cell, `DRAG_TILES`, caret hidden, parted classes off). `pointerup` (l. 1073-1081): free-letter edit → `game.dispatch(command)` then `refreshHover()`. `pointerdown`/`cancel()` (l. 899-906, 1213-1224): the `press?.drag?.kind !== 'tile'` guard covers the free-letter drag too. `perform` (l. 1001): new `addFreeLetter` tap action dispatches `{ type: 'addFreeLetter', cell }`. Replace the header's "Composing … WordCell" gaps with one free-letter paragraph after the tile-drag paragraph (l. 88-107).
- `createParting` (controller.ts l. 270-371) -- `home()` gains a snap path for mirrors: under reduced motion a mirror face's transform clears at once with no `animate` (its running animation, if any, taken as today); `part()` already writes at once at `ms` 0. Mirror faces are never animated with opacity.
- `src/ui/gestures/tile.ts` -- add `freeLetterRun(view, cell)` → `{ card (the cell's top), tray: TrayTile[] (layout/tray.ts `trayOrder(draft)`), first (k when `side === 'left'`, else 0), count (|M|), tileCount (|M| + k), release(gap): Command }` (`{ type: 'addFreeLetter', cell, index: gap }`; gap outside 0…count throws). Throws (rule 6) outside Composing or when the cell lacks `canAddFreeLetter`. Update the header (l. 1-17): an available Composing cell clears, then intent.ts adds the letter; drop "until tickets 8/9" for Composing (Place stays entry 9's).
- `src/ui/gestures/intent.ts` -- `TapAction` gains `{ kind: 'addFreeLetter'; cell }`; `tapAction` in Composing on a `wordcell` hit → that action when `canAddFreeLetter`, else `none` (before the selection branch). Header comment updated.
- `src/ui/gestures/classes.ts` -- `CARET = 'wc-caret'` (the caret element's class), `CARET_SHOWN = 'wc-caret-shown'`, `PARTED = 'wc-parted'`, `PART_START = 'wc-part-start'`, `PART_END = 'wc-part-end'`; header names WordCellRow.svelte and Card.svelte among the literal-keeping CSS files.
- `src/ui/layout/tray.ts` -- reuse `trayLayout`, `slotRects`, `gapRects`, `partingOffsets` (free-letter mode: `from` omitted, needs slots ≥ tileCount + 1), `segmentEnds`, `trayOrder` unchanged; update `segmentEnds`' JSDoc "Entry 8 builds" sentence to as-built.
- `src/ui/tray/TileRows.svelte` -- `.tiles` gets `position: relative`; after the `{#each}` one `<span class="wc-caret" aria-hidden="true">` (absolute, top-left 0, 3 × `sizing.tileHeight` px, `--wc-accent-teal`, `display: none` unless `.wc-caret-shown`, `pointer-events: none`, z-index above tiles). It must stay the last child so `tiles.children[0]` remains tray position 0 (entry 7's origin). Header sentence for the caret.
- `src/ui/Card.svelte` -- `lock = destination || block` (every block mirror renders the svg); CSS: a block mirror's lock shows only on `.start` without `wc-parted`, or with `wc-parted.wc-part-start`; under `:global(.wc-parted)` the outline-end/radius/width rules read `wc-part-start`/`wc-part-end` instead of `.start`/`.end` (badge `right: 5px` too). Rewrite the block segment rules once with `:is()`/`:global()` so the resting look is pixel-identical.
- `src/ui/WordCellRow.svelte` -- scoped `:global` rules as Column.svelte l. 205-210: `.wordcell:global(.wc-drag-ghost)::before` 1 px dashed `--wc-outline` at the card rect (top 0, left 2px, `--wc-w` × `--wc-H`, radius 6); `.wordcell :global(.face.wc-drag-layer)` z-index 5 + `box-shadow: 0 6px 16px #0008`. Header sentence.
- E2E lock selectors (`:visible` added, same counts, `unverified` in the ticket): `e2e/board-phases.spec.ts:278-279,412-416`, `e2e/drag.spec.ts:241`, `e2e/tray.spec.ts:242,298,447`; grep `lock` in `e2e/` for any other.
- Tests: `src/ui/gestures/controller.test.ts` -- harness (l. 284-455 `board()`, l. 459-600 `setup()`, l. 606 `tileView`): `cellCard` gets a `.face` child with a rect; `tiles` gets a rect and a caret child (`wc-caret`, last); `trayMirror` becomes `data-mirror-of="5"` (tileView's destination) with a `.face` on slot 2; `setup()`'s `trayInnerWidth` reads a mutable value so a test can set perRow; a helper builds a custom `.tiles` (n live tiles + k mirrors on given slots) for the row-break case. Supersede `:3399` (available-cell tap now dispatches `addFreeLetter { cell: 3 }`) and `:3460` (available-cell crossing = free-letter drag; F18 clear at the threshold; fly-back no dispatch); list both in Implementation Notes. `src/ui/gestures/tile.test.ts`, `src/ui/gestures/intent.test.ts` cases.
- E2E reuse: `e2e/tile-drag.spec.ts` (l. 1-80 header, `open`/`expectSaved`/`storedMove`, gap-point computation from `slotRects`/`gapRects`, `touchHold`, `dragResidue`, hidePage/back/pointercancel/App-button patterns), `e2e/tile-tap.spec.ts:286` (used/empty tap half, already covered), `e2e/board-phases.spec.ts:335` `expectUsedCell3` (copy locally). Fixture `session-idle-empty-column`: column 1 empty, cell 7 holds 7 cards, seed 1.
- Consumers (L1): the WordCell press path's crossing (long-press peek, sticky view, hover peek, entry 9's target tap); `createParting` (entry 7's tile drag: `home()` change must leave tile returns identical); `partingOffsets` free-letter mode (entry 6); Card.svelte block CSS (every tray screenshot and lock-count spec).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/tile.ts` + `tile.test.ts` -- `freeLetterRun` per Code Map; `AD-12` cases: block right (first 0), block left (first k), k = 0, `release(g)` → `addFreeLetter { cell, index: g }` for g = 0 and |M|, gap out of range throws, not Composing / not `canAddFreeLetter` throws.
- [x] `src/ui/gestures/intent.ts` + `intent.test.ts` -- `addFreeLetter` tap action; available / used / empty Composing cases.
- [x] `src/ui/gestures/classes.ts`, `src/ui/tray/TileRows.svelte`, `src/ui/Card.svelte`, `src/ui/WordCellRow.svelte` -- constants, caret, lock/segment CSS, ghost and drag-layer rules.
- [x] `src/ui/gestures/controller.ts` -- tap dispatch, free-letter drag, caret, parted classes, mirror snap, ends, header (Code Map, Design Notes).
- [x] `src/ui/gestures/controller.test.ts` -- harness and superseded tests per Code Map; new `AD-12 epic 5 free-letter` describe covering every I/O row plus the ticket's three UI Vitest bullets and: `AD-14` under reduced motion no `animate` call on any mirror face during parting or return (block right, parted then released outside); `AD-10` parting over `duration('parting')`; caret shown at the full layout's inner gap and at the end gap of M (block left; k = 0) with no face transformed, hidden under 25 % and at every end; same-id pointerdown and detach settle at once; the edit release has the gate idle at the dispatch.
- [x] e2e lock selectors -- `:visible` per Code Map.
- [x] `e2e/free-letter.spec.ts` (new; android tests skip other projects as tile-drag.spec.ts, the desktop test skips non-desktop) -- every Playwright bullet of ticket Acceptance plus Design Notes' P5 minors.
- [x] `_bmad-output/specs/spec-epic-5-tray/build-notes.md` CAP-6 -- as-built note (entry point names, ghost on `[data-wordcell]`, caret element and placement, parted classes, mirror snap).

**Acceptance Criteria:**
- Given ticket 5.8's Acceptance list, when `npm run test:all` and `npm run test:screens` run, then both are green, every listed UI Vitest and Playwright case exists with an id-led name, and no screenshot baseline changed.
- Given a free-letter drag with the block on the right under reduced motion, when it parts and then returns, then no `animate` call reaches any `[data-mirror-of]` face (AD-14; the review log's open major).
- Given the unit suite on a Linux-filesystem checkout, when its warm median is measured, then it is under 5 s (AD-17).

**Sentence → test** (P5 = `e2e/free-letter.spec.ts`; S = UI Vitest, never R-id coverage):

| Sentence | Test(s) |
|---|---|
| R-33 (UI) choosing a WordCell marks it used; ghost during the drag | P5 `R-33 (UI) R-73 (UI) tap-add …`, `R-33 (UI) R-73 (UI) drag-insert at an inner gap … ghost mid-drag …` (used-hatch mirror after; mid-drag `DRAG_GHOST` on `wordcell-7`, badge text unchanged, no visible card beneath, no `used`) |
| R-33 used or empty WordCell tap no-op | P5 supp.: tap half `e2e/tile-tap.spec.ts:286` (kept); drag half `R-33 a drag on a used and an empty WordCell …` |
| R-33/Q-31 tap appends, drag inserts at the gap | P5 supp. tap-add, inner-gap, end-gap, full-layout cases (stored `arrangement`) |
| R-32 never inside or beyond the block | P5 supp. `R-32 … released over or past the block (one row, F25) lands at the M end; block left over the block lands first in M` |
| R-73 (UI) saved before the next action | `expectSaved` after the tap-add and every drag-insert |
| R-65 (UI) long-press peek in Composing keeps a tile selection | P5 `R-65 (UI) …` (peek shown, Session byte-identical, cell 7 unused, tile selected) |
| AD-12 ≥ 25 % tray band, cancel paths, F18 | P5 outside-band, under-25 %, pointercancel, App button, hidePage, back, long-press-then-move, the three caret-shown ends (`AD-12 F5 F16 {pointercancel, an enabled App button (Flip), hidePage} mid-drag with the caret shown …`); S cancel paths, F18 threshold |
| AD-14 mirrors carry the parting shift only; Done when 4 | P5 block-right case (mirrors one pitch while parted, none after; 52 `[data-card-id]` mid-drag and after); P5 `AD-14 a k = 2 block (redo-tail fixture, block right) under wc-parted …` (parted-class CSS: lock, face width, edges, badge offset); S reduced-motion no-animate |

Exempt here: landing glides and FLIP (entries 10/16); tray growth (entry 12); Place target taps (entry 9).

## Implementation Notes

- Superseded in `src/ui/gestures/controller.test.ts` (epic 5 tile tap describe): the former :3399 `AD-12 R-32 a block tap, an empty or long-pressed empty Composing WordCell keep; an available cell, outside, the action gap and a disabled button clear` is now `… outside, the action gap and a disabled button clear; an available cell clears, then dispatches addFreeLetter` (one `addFreeLetter { cell: 3 }`, selection already null at the dispatch). The former :3460 `AD-12 F1 a crossed captured non-tile press ended by lostpointercapture keeps; an available cell dragged and released clears` is now `… an available cell crossing is a free-letter drag: F18 clear at the threshold, a release off the tray flies back with no dispatch`.
- Also superseded (not listed in the Code Map): `src/ui/gestures/intent.test.ts` `AD-12 the branch ignores a selection; WordCells and outside keep today’s paths` asserted a Composing WordCell tap with a tail selection deselects; the plan's "before the selection branch" makes it `none` (cell not available), renamed `… WordCells take the free-letter branch, outside keeps today’s path`. A tail selection cannot exist in Composing, so no behaviour a player can reach changed.
- Harness (controller.test.ts): `cellCard` has a `.face` (x 2 … 42, y 450 … 503); `.tiles` has a rect (x 8 … 392, y 634 … 800) and ends with the caret; the tray mirror is `data-mirror-of="5"` with a `.face` on slot 2; `setup()` returns `trayWidth` (settable inner width, read at drag start); a `compactTiles` helper (in the new describe) rebuilds `.tiles` on perRow-4 compact slots for the row-break cases. Every entry 5/7 test passes unchanged with the new harness.
- Caret rendering (deviation from the Code Map's "after the `{#each}` one `<span>`"): TileRows renders the caret only in Composing with tiles (`{#if !strip && tiles.length > 0}`). Rendered always, it broke `e2e/tray.spec.ts`'s `AD-14 … word line, tiles and control row empty` (`.tiles *` count 0 in Idle and Game over); free letters exist only in Composing, so the guard changes nothing the drag reads.
- Not in the Code Map: `e2e/tile-drag.spec.ts` `geometry()` and `expectAtRest` counted `.tiles` children / `.tiles > *`; both now exclude `.wc-caret` (else the tile count is one too many and the caret has no `.face`).
- `controller.ts`: `tileCommand` became `releaseCommand` (tile and free-letter drags), and the clipped-tray acceptance is one `overTray()` helper both moves use; behaviour unchanged. A caret follows the winning rect of an unchanged row-break gap (a DOM write only, no parting update), per the ticket's "the winning rect at a row-break gap".
- Card.svelte: the resting computed styles of every block mirror and live D card were compared before and after the CSS rewrite in Chromium (android, `session-place-compact` + Undo (block across the row break) and `session-composing` + `+` (k 2)): identical width, margins, borders, radii, badge offset and face rects; the only difference is the lock svg now present (display none) on non-start mirrors.
- Verification: the user's own `vite --host` dev server (pid started 11:06, from the docker-desktop bind mount of this repo) holds port 5173 and serves stale modules (no file events on drvfs: it served `classes.ts` without `CARET`). `playwright.config.ts` reuses an existing server locally, so `npm run test:e2e` (and so `npm run test:all`) ran against stale code (17 of 18 free-letter tests failed there). It was not stopped (not this build's process). Every `test:all` step was run instead: `npm run lint`, `npm run check` (exit 0), `npm test` (54 files, 2224 tests), `npm run build` (513,498 / 600,000), `npm run test:e2e:dist` (14 passed), the dev-server e2e suite with an identical scratch config on port 5180 with a fresh `vite` (473 passed, 0 failed; `e2e/free-letter.spec.ts` 17 android + 1 desktop), `npm run test:e2e:pwa` (12 passed). The scratch config was deleted. `npm run test:screens` (Docker): 10 passed, no baseline written or changed (run twice, the second after the final TileRows change).
- Unit suite on the Linux filesystem (`~/wordcell-watch`, src and fixtures synced): 3.09 s (discarded warm-up), then 2.78, 2.73, 2.79 s → warm median 2.78 s (< 5 s, AD-17).

- Orchestrator verification (2026-10-09, after the review patches): every `npm run test:all` step re-run green — lint, check, unit (54 files, 2224 tests), build, `test:e2e:dist`, the dev-server e2e suite on a temporary port-5180 copy of `playwright.config.ts` (474 passed, 0 failed; the copy deleted), `test:e2e:pwa` (12 passed); `npm run test:screens` exit 0, 10 passed, no baseline written or changed. Port 5173 is held by a `npm run dev --host` process started 11:05 from the docker-desktop bind mount (not this build's), which serves stale modules; it was left running.
- Code review verification (2026-10-09, after code review pass 2's changes, including `createParting` `take()`): `npm run test:all` run as one command, exit 0, port 5173 free — lint (198 files), check (0 errors), unit (54 files, 2227 tests), build (513,501 / 600,000), `test:e2e:dist` (14 passed), `test:e2e` (478 passed, 434 skipped, 0 failed; `e2e/free-letter.spec.ts` 22 android + 1 desktop), `test:e2e:pwa` (12 passed). Screenshots (`npm run test:screens`) were not rerun by the review.

## Plan Change Log

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 30 findings — high 0, medium 3, low 19, false 8, maybe-false 0
- findings:
  - `[false]` `[reject]` (blind) scratch `playwright.verify-5180.config.ts` left in the tree — it was the orchestrator's own verification copy, present only while the diff was staged; deleted by the same command (`ls playwright.verify*` finds nothing), never in the change set.
  - `[low]` `[patch]` (blind) e2e residue checks cannot see a leaked caret or `wc-parted`/`wc-part-*` (`dragResidue` counts only `wc-drag-*` and `.face` transforms) — a local free-letter residue helper in e2e/free-letter.spec.ts asserts the caret hidden with no transform and no parted class, called at every end and edit.
  - `[low]` `[patch]` (blind) controller Vitest "… inert" never asserts no dispatch for the Place case (the next `setup()` resets `navCalls`) nor the Place ghost — assertions added after the Place pointerup.
  - `[low]` `[patch]` (blind) intent.test.ts Place/Idle cases use a negative `not.toEqual(addFreeLetter)` — now assert the exact action per phase.
  - `[low]` `[patch]` (blind) e2e/tray.spec.ts `tileTops` reads `.tiles > *`, now including the caret — selector excludes `.wc-caret`.
  - `[low]` `[reject]` (blind) the ghost's rect, colour, radius and removal after settle are not asserted — the P5 checks the 1 px dashed `::before`, hidden cards beneath and the badge; `expectNoResidue` sees `wc-drag-ghost` removed; the rect is fixed CSS copied from Column.svelte's ghost. Adding assertions fixes no observed defect.
  - `[medium]` `[defer]` (blind) the parted segment CSS (`:is()`/`:global(.wc-parted)` rewrite) is never rendered with a multi-mirror block whose segment ends move — real gap; the ticket assigns the row-break case to the controller Vitest (review-log pass 3) and no fixture reaches a Composing block across a row break with an available cell (entry 12's long fixture). The sub-claim that the added specificity beats `selected`/`lifted`/`wc-drag-layer` rules is false: those classes never land on a `.block` mirror.
  - `[low]` `[patch]` (blind) the reduced-motion mirror return (open major, AD-14 snap path) has no browser case — android P5 added: block right, parted at gap 0, then ended by pointercancel while parted under reduced motion (reaching `home()`'s reduced-motion mirror snap); the mirror face has no transform and no animation, Session byte-identical.
  - `[low]` `[reject]` (blind) `npm run test:all` not run as one command; no deferred item or pitfall for the stale-server trap — every step ran green (orchestrator re-run, see Verification); the stale server is an environment fact (a dev server outside this build), recorded in Implementation Notes; fixes would edit the plan or agent-context files.
  - `[low]` `[patch]` (blind) R-65 P5's `waitForTimeout(500)` is redundant with the following `toBeVisible()` — removed.
  - `[false]` `[reject]` (blind) `freeLetterMove` reads `CARET_SHOWN` from the DOM and leaves `drag.rect` stale while parting — `moves` depends only on `gap` and the fixed `full`, so the caret can only appear through `partTray` on a gap/acceptance change, which writes the current rect first; no stale rect is ever shown.
  - `[low]` `[reject]` (blind) most `startFreeLetterDrag` rule-6 throws untested — unreachable with the rendered DOM; tests for each would add four cases for no observed defect.
  - `[low]` `[patch]` (blind) e2e/tile-drag.spec.ts header comment line at 136 columns — rewrapped to 100.
  - `[false]` `[reject]` (blind) new files carry an executable bit — `core.filemode` is false in this repository, so git records 644.
  - `[low]` `[patch]` (edge) `dragResidue` misses caret and parted residue — same root cause and fix as the blind residue row.
  - `[medium]` `[defer]` (verification-gap) Card.svelte parted CSS never checked in a browser with a segment end that moves — same entry as the blind parted-CSS row (filed disposition defer; needs entry 12's fixture).
  - `[false]` `[reject]` (verification-gap other) the diff includes `playwright.verify-5180.config.ts` — as the blind row: the orchestrator's temporary copy, deleted.
  - `[low]` `[reject]` (verification-gap other) `test:all` green only step by step — every step passed; the one-command run is blocked by a stale dev server outside this build on port 5173 (environment).
  - `[medium]` `[defer]` (intent) mirror segment rendering under a real free-letter drag exercised in the browser only with a one-mirror block — same entry as the parted-CSS rows; the class-driven CSS is browser-checked on a k = 2 block by P5 `AD-14 a k = 2 block (redo-tail fixture, block right) under wc-parted …`; open: a real drag parting a block across a row break (entry 12's long fixture).
  - `[low]` `[reject]` (intent) parted classes come off at the return's start, so a multi-segment block's outline follows the resting ends during the return — the ticket's review log settles "when parting stops" as the mirrors returning to rest, not the animation's end; the effect lasts one `flyBack` duration on a wrapped block only.
  - `[low]` `[reject]` (intent) "full" with a clipped third row untested — needs ≥ 15 tiles (entry 12's fixture); the formula is the ticket's and Vitest-covered for one row.
  - `[low]` `[reject]` (intent) caret at a row-break winning rect Vitest only — as the plan's review-log item records; a P5 needs a full multi-row layout.
  - `[low]` `[reject]` (intent) normal-motion mirror parting/return checked only in Vitest — a motion-on Playwright timing check would be racy (entry 7 precedent); the reduced-motion browser cases pin the AD-14 constraint.
  - `[low]` `[reject]` (intent) back mid-drag: fly-back vs settle unobserved in the browser — F5: back leaves the app in Composing; the stored Session is the observable, and the controller Vitest pins the byBack path.
  - `[low]` `[reject]` (intent) R-73 tested as eventual equality — the entry 5/7 `expectSaved` pattern; the store writes synchronously in `dispatch`, so equality is reached before the next input.
  - `[false]` `[reject]` (intent) used/empty tap half relies on tile-tap.spec.ts — the ticket's review log names that test as the coverage; only the drag half was new.
  - `[low]` `[reject]` (intent) ghost position not asserted — as the blind ghost row.
  - `[false]` `[reject]` (intent) scratch config in the diff — as the blind row.
  - `[false]` `[reject]` (intent) e2e/tile-drag.spec.ts edited outside the named spec edits — a required consequence of the caret child (tile counts), recorded in Implementation Notes.
  - `[false]` `[reject]` (intent) intent.ts now returns `none` instead of `deselect` for a Composing WordCell tap with a tail selection — no tail selection exists in Composing (columns `canPickUp` false; a drop deselects), so the path is unreachable.

## Design Notes

**Geometry at drag start.** `run = freeLetterRun(view, cell)`; `sizing = trayLayout(run.tileCount, deps.w(), deps.trayInnerWidth())`; `full = run.tileCount + 1 > sizing.perRow * sizing.rows`; origin as entry 7 (`.tiles.children[0]` wrapper + 2 px x); `slots = slotRects(sizing, origin, full ? tileCount : tileCount + 1)` — when not full, card mode needs `rows` ≥ 1 capacity, which holds since tileCount + 1 ≤ perRow × rows. Tray faces: for each `run.tray` entry, `.tiles [data-card-id=id]` or `[data-mirror-of=id]` → its `.face` (throw on a missing one). Caret move: `moves = !full && run.first + gap < run.tileCount`; parting when `accepted && moves`, caret when `accepted && !moves`. Parting offsets: `partingOffsets(slots, tileCount, first, count, gap)` (free-letter mode). Parted classes: `mirrorBySlot[offsets[p].slot] = mirror[p]` over all p; each mirror p gets `PARTED` and `PART_START`/`PART_END` from `segmentEnds(offsets[p].slot, perRow, mirrorBySlot)`; off whenever the parting stops (caret, unaccepted, any end). Caret: `transform = translate(rect.left − tilesRect.left + 0.5, rect.top − tilesRect.top)` with the `GapRect` `insertionIndex` returned (the winning rect at a row-break gap); `tilesRect` measured once at start (after `DRAG_TILES`).

**Ends and motion.** The fly-back reuses `flight.flyBack(drag, false)` (face → cell, fade under reduced motion: it is a live card, allowed). Returns: live tray faces as entry 7's `home()`; mirror faces through the snap path under reduced motion, else the transform return over `duration('flyBack')` (the parting shift reversing, AD-14-allowed). Caret hidden and parted classes off at `end()` itself; the ghost, `DRAG_LAYER`, `DRAG_TILES` at the settle (`clearDrag`). The edit path: `parting.finishAll()` → `clearDrag` → `gate.leave()` → dispatch → `refreshHover()` (no landing glide).

**Review-log items, one by one** (from the ticket's review log; P5 = e2e/free-letter.spec.ts, S = controller Vitest):
- Open major (mirror fade under reduced motion): applied — mirror snap path; S `AD-14` no-animate case; AC 2.
- controller.test.ts:3399/:3460 and tile.ts:10-11: applied (Code Map, superseded list in Implementation Notes).
- "when parting stops" = when the mirrors return to rest: applied (classes off at the return's start).
- UI Vitest asserted mirror = the one starting the resting second row (the block's first mirror stays a start): applied — S row-break case e.g. perRow 4, M [3, 4], k 3 block right, gap 0: resting segments [2–3][4], parted [3][4–5]; the slot-4 mirror loses its start (no `wc-part-start` under `wc-parted`), the first mirror keeps one.
- R-32 "released inside the band" = accepted (≥ 25 %): applied.
- android bullet drop: ≥ 2 cards onto a non-empty column (k ≥ 1, |M| ≥ 2): applied — pick the drop from the fixture by `current()` and assert those premises before the drag.
- Block right / Done when 4 with a short tail (room): applied.
- "full" from `trayLayout(current count).rows`: applied (Design Notes geometry).
- Caret in `.tiles` coordinates; `DRAG_TILES` lifts the clip: applied.
- Caret hidden at a parting gap / under 25 % / outside: applied — P5 in the full-layout case moves under 25 % after the caret shows and asserts it hidden; S covers parting-gap hide.
- Desktop "as above" = the block-left drop: applied.
- Used/empty tap half already covered by tile-tap.spec.ts:286: applied (only the drag half is new).
- Long-press then moved into the band and released: applied (P5: no dispatch, cell 7 unused; S matrix row).
- Same-id pointerdown and detach settle at once: applied (S).
- Caret at a row-break gap's winning rect: applied as S only (harness row-break tray: gap at the break, caret on the winning rect); no P5 (needs a full multi-row layout, entry 12's fixture).
- References SPEC CAP-6/F5/F16/F18, DESIGN.md WordCell: applied in code comments and this plan; ticket not edited.
- Full-layout route "perRow card-mode tiles (7 at 412 px)": applied — P5 asserts `trayLayout(7, w, inner).perRow === 7` and card mode as premises.
- Done when 4: P5 tells the parting transform from other motion: applied — mid-drag each shifted mirror's face offset equals one slot step (`slotRects`), after release no mirror face has an inline transform or running animation.
- hidePage / back also assert nothing selected and cell 7 unused: applied.

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npm run test:screens` -- expected: green, no baseline written or changed (start Docker Desktop if needed; if impossible, record it).
- Unit suite warm median on a Linux-filesystem checkout (e.g. `~/wordcell-watch`) -- expected: under 5 s; record the runs in Implementation Notes.

## Auto Run Result

**Summary.** Ticket 5.8 built. In Composing a tap on a WordCell with `canAddFreeLetter` clears the tile selection and dispatches `addFreeLetter { cell }` (intent.ts `tapAction`); a used or empty cell's tap or drag, and every WordCell drag outside Composing, stay inert. An available cell's press crossing 8 px before the long-press becomes a free-letter drag (controller.ts `FreeLetterDrag`, tile.ts `freeLetterRun`): F18 clear at the threshold, `wc-drag-ghost` on the cell, the top face on `wc-drag-layer`; the clipped tray band at ≥ 25 % accepts and `insertionIndex` picks the gap in M. With room, every tray position from the gap on parts (D-block mirrors included, AD-14) with `wc-parted` + `wc-part-start`/`wc-part-end` from `segmentEnds` over the parted slots; a full layout or a gap moving no tile shows the 3 px teal caret on the winning gap rect instead. An accepted release finishes the parting, clears, leaves the gate, then dispatches `addFreeLetter { cell, index }`; other releases, `pointercancel`, `lostpointercapture` and byBack fly back (mirrors snap under reduced motion, the review log's open major); `cancel()`, same-id pointerdown and detach settle at once.

**Files changed.**
- `src/ui/gestures/controller.ts` — free-letter tap dispatch and drag, caret, parted classes, mirror snap in `home()`, ends, header.
- `src/ui/gestures/tile.ts` — pure `freeLetterRun(view, cell)`; header.
- `src/ui/gestures/intent.ts` — `addFreeLetter` tap action.
- `src/ui/gestures/classes.ts` — `CARET`, `CARET_SHOWN`, `PARTED`, `PART_START`, `PART_END`.
- `src/ui/tray/TileRows.svelte` — the caret (Composing with tiles), `.tiles` positioned.
- `src/ui/Card.svelte` — lock on every block mirror, CSS-shown; segment rules read the parted classes under `wc-parted`.
- `src/ui/WordCellRow.svelte` — cell ghost and drag-layer rules.
- `src/ui/layout/tray.ts` — `segmentEnds` JSDoc as built.
- Tests: `controller.test.ts` (harness, two superseded tests, 17-case free-letter describe), `tile.test.ts`, `intent.test.ts`; new `e2e/free-letter.spec.ts` (22 android + 1 desktop); `:visible` lock selectors in `board-phases`, `drag`, `tray` specs; caret-aware selectors in `tile-drag` and `tray` specs.
- `_bmad-output/specs/spec-epic-5-tray/build-notes.md` — CAP-6 as built.

**Review findings.** 30 findings (high 0, medium 3, low 19, false 8, maybe-false 0). Patched (7 entries, all low): free-letter residue helper (caret and parted classes) in every e2e end/edit check; reduced-motion mirror return P5; Place no-dispatch and no-ghost assertions in the inert Vitest; exact Place/Idle actions in intent.test.ts; caret-aware `tileTops`; R-65 sleep removed; tile-drag.spec.ts comment rewrapped. Deferred (1 entry, medium): no real free-letter drag parts a block across a row break in a browser (needs entry 12's long Composing fixture); the class-driven parted segment CSS is browser-checked by the k = 2 P5. Rejected: 22 rows, each with its reason in the Review Triage Log (8 false claims; lows that are ticket-scoped (Vitest-only row-break caret and segments, settled "when parting stops"), environment (the stale port-5173 server), or test additions for no observed defect).

**Follow-up review recommendation:** false. Patched by verdict: high 0, medium 0, low 7.

**Verification.** See Implementation Notes (code review bullet): `npm run test:all` green as one command after code review pass 2 (unit 2227, e2e 478, pwa 12, dist 14, build in budget); `npm run test:screens` 10 passed, no baseline changed (orchestrator run, before the code review; not rerun by the review); unit warm median 2.78 s on the Linux filesystem (implementer).

**Residual risks.**
- A real free-letter drag parting a block across a row break is unverified in a browser (deferred, entry 12's fixture); the parted segment CSS itself is browser-checked by the k = 2 P5.
- `npm run test:all` as one command fails locally while the stale `vite --host` process holds port 5173 (Playwright reuses it); stop that process and the command runs as is.
- A full layout with a clipping third row (≥ 15 tiles) and the caret at a row-break gap are Vitest-only until entry 12's fixture.
