# Build notes — epic 5

How-level guidance per capability. The spec rules, the spine ADs, DESIGN.md and EXPERIENCE.md are
the contract; these notes fix what they leave open. `[ASSUMPTION]` marks inferences.

## Spine close-out edits (for the owner to fold in at the retrospective; the spine is not edited by this epic)

- AD-12 (F4): the tray band's drop rect is clipped to the visible band like the columns.
- AD-12 (F2): `data-place` `tray`/`strip` presses are tile presses; a D-block mirror press is a
  no-op that keeps a tile selection; the selected-tile 4 px lift moves only the face.
- AD-12 (F5): tile and free-letter drags end like column drags (platform cancel and back fly back,
  `act()` and hide settle at once).
- AD-14 (F6, F7): FLIP lives in `src/ui/flip.ts` and moves faces, never wrappers, and only of
  cards whose container or index changed; the kind comes from the dispatching command and its
  `DispatchResult`; the controller's `pointerdown` and `cancel()` finish every running animation.
- AD-14 (F8): name the epic 5 winning-guard tests; the guard consumes the rest of the settling
  gesture (bounded: `pointerup`/`pointercancel` plus a same- or next-task `click`; a key's
  `keyup` and `click`), uninstalls at settle by any path, and lets Undo through; the
  pending-open cancel, menu case and Undo key aliases land in epic 6.
- AD-11 (F10): `layout.svelte.ts` takes tray rows from `trayLayout`; `TRAY_ROWS` is gone.
- AD-11 (CAP-9): edit ordering: FLIP captures rects before dispatch, the tray-row change queues
  through `gate.whenIdle`, `flip.play` runs right after that re-layout frame; a commit defers the
  row change until its fly-to-cell settles (A-D4).

## Epic file close-out edits

- `epic-tray-and-place.md` Boundaries: add the two test-only files outside `src/ui/`
  (`src/shell/game.svelte.test.ts`, `src/engine/serialize.test.ts`'s fixture list; SPEC
  Constraints).
- Structural Seed: `src/ui/flip.ts`; the `gestures/` modules CAP-3 splits out and the tile modules
  (build-notes Component tree); the shared class-name module.
- Proposed epics row 5: record what moved to epic 6 (the pending-end-sheet half of the guard, F8).
- AD-17 Speed: the epic 5 warm median on the Linux filesystem (CAP-12).

## EXPERIENCE.md and DESIGN.md close-out edits (EXPERIENCE.md and DESIGN.md are not edited by this epic)

- EXPERIENCE.md Motion: the owner's OQ-1 answer as rows (tray → strip, Flip, k change, tap-add,
  removal, tap-swap, free-letter return, tile released under 25 % or with no order change, the
  dragged tile landing in its new gap, a dragged free letter landing in its gap).
- EXPERIENCE.md Arrange M (F16): the caret shows only when a free-letter drop would overflow the
  current rows; a reorder drag always parts (DESIGN.md Tray band).
- EXPERIENCE.md Movable tile: the owner's OQ-2 answer (a drag and an existing tile selection).
- EXPERIENCE.md message catalogue (F11): letter count `5 letters` / `1 letter`; Place meta
  `6 letters → cell 6 · +30` (`±0`, U+2212).
- DESIGN.md (OQ-3): only if the owner changes F40's highlight.

## As-built facts that bite (f62a89a)

- `src/ui/Tray.svelte` is the F2 static tray: the word-line slot shows only the invalid line, the
  tile area is a CSS grid of `Card` with `place` `tray`/`strip`, `mirror: 'block'` copies with
  `segment` ends, and an empty `.controls` row. `layout/tray.ts` exports `trayLayout(tileCount, w,
  innerWidth)` (mode, rows, perRow, tileWidth, area) and `trayOrder(draft)`; reuse both.
- `layout.svelte.ts` lays one tray row (`TRAY_ROWS = 1`, line 66); `geometry.ts` `trayGrowth` and
  `bands(…, trayRows, …)` already compute growth and the anchor delta; `anchorScroll` applies it.
- The controller resolves `data-place` `tray`/`strip` and tray mirrors as inert tiles (F23,
  `controller.ts:257-279`) and treats a tile as outside for F25 (`intent.ts:131`, `controller.ts:794`).
- `motion.ts` has kinds `snap`, `flyBack`, `parting`, `undoRedo`, `flyToCell`, `overlay` and
  `stagger()`; only `duration('flyBack')` is called (`controller.ts:396`). No CSS transition or
  `@keyframes` exists in `src/`; `prefs.svelte.ts:97-98` sets `--wc-base-ms` and `--wc-reduced`
  and nothing reads them (C-E56).
- `game.dispatch` returns `DispatchResult` (`changed`, `rejectedWord`, `finished`, `unfinished`);
  `game.feedback.rejectedWord` clears on any `changed` dispatch (AD-4).
- `ActionBar.svelte` already holds the Validate/Confirm/New game label precedence and `act()`
  wrapping; CAP-2 adds the label shrink (A9 4.2-m1, `ActionBar.svelte:79-83`).
- `Card.svelte` takes `tile`, `segment`, `mirror: 'block'`; the ×2 badge shifts on widened block
  tiles (A9 4.3-m4, `Card.svelte:165-182`); `{#each}` keys by CardId alone in `Column.svelte:82`
  and `WordCellRow.svelte:53` (A9 4.3-m3).
- `overlays.svelte.ts` holds `stack`, `selection`, `endSheet`, `peek`, `viewCell`, `hoverPeek` and
  the deferred-open token; `resetForNewSession` already clears "tail and tile selections" in the
  spine's words, but no tile state exists yet.
- Fixtures: `session-composing` (source 3, 2 cards [42, 0], destination 6, k 1, side right),
  `session-composing-draft-2-letters`, `session-place` (target 3, order [42, 0, 28]),
  `session-place-free-letter-redo-tail` (free letter from cell 3, Place, redo tail),
  `session-idle-empty-column` (cell 7 holds 7 cards), `session-won` (8 committed moves; last
  move `S B R R C U`, cards 38 and 37 both `R`, target 6). No Session has ≥ 15 tiles or a
  compact strip; in both Place fixtures L = 3 and target 3, so no retarget is possible there.
- `controller.ts` is 1004 lines; Entry 7–13 header paragraphs at lines 14–103; responsibilities:
  press machine 315–378, 620–787, 952–1004; visible band 207–212, 534–561; hover peek 597–618,
  857–950; fly-back 389–451; hover classes 801–851; drag 380–388, 453–595; tap actions 697–727,
  789–799. Lookups with their own throw: `controller.ts:229, 240, 465, 485, 556, 591, 847, 924`,
  `intent.ts:62, 103`, `HoverPeek.svelte:29`, `WordCellView.svelte:22`. Shared class strings
  (`controller.ts:197-204`): `wc-hover-tail`, `wc-grab`, `wc-drop`, `wc-drop-self`,
  `wc-drag-ghost`, `wc-drag-layer`, `wc-drag-target`, `wc-selection-suppressed` (Column.svelte),
  `wc-hover-peek-hidden` (HoverPeek.svelte); e2e specs also hard-code them.
- `controller.test.ts` is 3193 lines and the unit-suite critical path; F41 keeps it one file.
  CAP-3's split must not multiply `vi.resetModules()` setups; move the harness, not the tests,
  unless the Linux-filesystem median improves.

## Component tree and modules [ASSUMPTION names]

```text
src/ui/
  Tray.svelte              # phase switch: Composing tray, Place strip, empty
  tray/WordLine.svelte     # word (D underline) or invalid line, shrink 20 → 14 px
  tray/TileRows.svelte     # tiles, block segments, parting gap, caret
  tray/ControlRow.svelte   # −/k/+, Flip or the empty caption; letter count or Place meta
  flip.ts                  # F6: capture(), play(kind), finishAll(); gate-counted
  motion.ts                # + the AD-14 winning guard
  overlays.svelte.ts       # + tile selection (F1)
  layout/tray.ts           # + gap rects for insertionIndex
  gestures/
    controller.ts          # press machine only (CAP-3)
    visible-band.ts        # clip, bars, visible band (CAP-3)
    hover-peek-timer.ts    # desktop hover peek (CAP-3)
    fly-back.ts            # fly-back and settle (CAP-3)
    lookup.ts              # one cell/column lookup (CAP-3)
    classes.ts             # shared class names (CAP-3)
    tile.ts                # tile tap intent and tile/free-letter drag (CAP-4–6)
    targeting.ts           # + insertionIndex (F3)
```

## CAP-1 Tray render

- Split the tray into word line, tile rows and control row components; the band height stays
  `heights.tray` from `bands()`.
- Word line: render `draft.word` per card so D letters can be underlined (Composing only; Place
  has no D underline) (iterate tray order and
  `faces`, uppercase, `QU` as `QU`); shrink with a measured `font-size` between 20 and 14 px in a
  fixed-width box, never a text-dependent px assertion in e2e (epic 4 F11).
- Tags: free-letter origin tag from `draft.freeLetters` (cell numbers): the card of cell c is
  `cells[c].cards.at(-1)` (fact: `CellView.cards` is bottom → top and the draft leaves the cell
  stack in place, `view.ts:194-205`; `freeCards` takes the same top, `rules.ts:144-152`). Looked
  up per render from `cells`; no stored map (AD-3).
- Fixture `session-place-compact` (Assumptions): ≥ 8 strip tiles with a `QU` card and a free
  letter, scripted under the epic 3 regeneration rule, added to `serialize.test.ts`'s
  valid-fixture list (S14).
- Meta format and letter count strings in `text.ts` (F11): `letters(n)`, `placeMeta(n, cell,
  delta)` with `+n`, `±0`, `−n`.
- AD-14: tiles stay the cards' live elements; the block copies stay mirrors; key `{#each}` by
  `${id}-${mirror}` everywhere (A9 4.3-m3).

## CAP-2 D-block controls, Validate and Confirm

- `−`/`+`/Flip are native buttons wrapped in `act()`; disabled from `canDecK`/`canIncK`/`canFlip`;
  the caption shows when `draft.k === 0` [ASSUMPTION: k = 0 iff the destination column is empty
  after R-21, as R-31 states].
- Validate (F15): no flag; the click handler dispatches once and `flushSync()` renders the result
  synchronously. A double tap's second click follows OQ-5.
- A tile selection is cleared inside `act()`'s handler path before the dispatch (AD-4); do it in
  one place (e.g. `act()` calls `overlays.clearTile()` after `cancel()`) so every button inherits it.

## CAP-3 Controller seams

- Behaviour-neutral: no test renamed, no assertion changed; the per-ticket header becomes one
  behaviour summary per module.
- Keep the `deps` injection so `controller.test.ts` harness stays the seam; profile the unit
  suite before and after on the Linux filesystem (F41).

## CAP-4 Tile tap

- Tile press: the controller classifies as for column cards (8 px, no long-press on tiles); a tap
  calls a pure `tileTap(hit, view, tileSelection)` → `select | deselect | swap | remove | none`.
- Swap commands: `arrange` with the two CardIds exchanged in `draft.arrangement`;
  `setPlacementOrder` with them exchanged in `place.placementOrder`; the engine's no-op-by-value
  never fires for a real swap of two different cards.
- Clear rules (F1, F13) in one function used by the controller's tap path and by `act()`; the
  controller's document-level tap path covers disabled controls, labels, the tray band background
  and the top bar (no `click` reaches `act()` there).
- A drag crossing 8 px from an inert target resolves, for the tile selection, as that target's
  tap (no dispatch).

## CAP-5 Tile drag

- Drag layer: transform the dragged tile's face; the other tiles' parting is a transform on their
  faces too, WAAPI `duration('parting')`, never layout changes mid-drag (hit rects fixed).
- Parting (sortable list): while accepted, the origin slot collapses and each movable tile
  between the origin and gap i takes the resting rect of its neighbour slot one pitch over in
  reading order; a tile crossing a row break gets the face transform to the first/last slot of
  the adjacent row; offsets come from the resting slot rects (a pure function, Vitest across a
  row break); D-block mirrors never move; the gap or caret draws at the row-break rect that won;
  under 25 % every tile returns to rest with the origin slot open.
- `insertionIndex` gap rects (F3): `{ index, rect }[]` computed from the resting tile slot rects
  (not the parted ones) so the target does not oscillate; one rect per gap centred before tile i,
  tile height, a second rect for a row-break index; a row's end gap one half-gap after its last
  tile (no second rect without a next row); Euclidean distance from the dragged face's
  centre; ties to the lower index; [ASSUMPTION] hysteresis is not needed beyond "nearest gap".
- Reorder result: gap i counts over the sequence including the dragged tile (index j); remove the
  dragged id, insert at i when i ≤ j, else at i − 1; compare by card with the current order;
  dispatch only on a change.
- In Place every strip tile (S, F and D) is movable; the gaps are 0…n of `placementOrder`.
- A reorder drag always parts the tiles, never the caret (F16).

## CAP-6 Free letters

- A WordCell press in Composing on a cell with `canAddFreeLetter`: tap → `addFreeLetter { cell }`;
  threshold crossing before 400 ms → free-letter drag of the top card's live element; the cell
  shows a ghost (controller class on the cell wrapper, DOM only).
- Full-layout caret: "full" = tile count (SPEC Capabilities) after the drop > perRow × current
  rows (card mode holds one row), from `trayLayout`.
- The index passed is the gap in M (0…|M|), not the tray position; translate around the D block.

## CAP-7 Place

- Target tap through the WordCell press path: `canSetTarget` → `setTarget { cell }`; otherwise no
  dispatch (F13 decides the tile selection).
- Confirm stays in `ActionBar.svelte`; the commit's fly-to-cell is CAP-8.

## CAP-8 FLIP and fly-to-cell

- Capture before the view changes, play after the re-layout: each dispatching caller
  (`ActionBar.svelte`, `TopBar.svelte` (Undo/Redo), the controller, the tray) calls
  `flip.capture()` (rects only) before `game.dispatch` and `flip.play(command, result)` after the
  re-layout frame (CAP-9). The kind comes from the command plus the `DispatchResult` and the
  resulting view phase, never from comparing views (a drop and its Redo, a Validate and its Redo,
  have the same view change) and never decided before dispatch (that would re-derive a phase
  rule, AD-3): Undo/Redo → `undoRedo`, a Redo whose result is a commit → `flyToCell`; the win
  per `finished`; a UI Vitest `AD-14` covers the command + result → kind table, including the
  reduced-motion fly-to-cell (120 ms fade on every card at once, no stagger). Presentation only,
  no legality (AD-3).
- Only cards whose container (`data-place` column, cell, tray, strip) or index within it changed
  animate; a pure band shift (tray growth moving every column card by the band delta) applies
  without motion.
- FLIP moves the `.face` inside each live wrapper; the wrapper (identity, hit rect) stays at its
  settled rect, so a press mid-animation hit-tests the settled layout.
- Every animation registers with the gate (`enter`/`leave`) and with one running set that
  `finishAll()` completes; the controller's `pointerdown` and `cancel()` call it (F6).
- Fly-to-cell targets the cell's live element stack; stagger bottom card first.
- New game/Replay and restore never animate.

## CAP-9 Tray growth

- Feed `trayLayout(count).rows` (the tile count, SPEC Capabilities) to the layout module as a
  reactive input. Keep AD-11: the re-layout is queued by `gate.whenIdle(relayout)`
  (`layout.svelte.ts`) and runs in the next rAF in which the gate is idle; once FLIP runs the gate
  is busy. Order per edit: `flip.capture()` before dispatch → the row change queues through
  `whenIdle` → `flip.play` right after that re-layout frame, so FLIP targets the final rects.
  Mid-drag the row change waits for release. Every commit (Confirm, or a Redo that commits)
  defers it until its fly-to-cell settles (A-D4); a fly finished by a press applies it when that
  gesture ends (hit rects never move under a finger). Record the ordering as the AD-11 close-out
  edit above.
- Fixtures: script `session-composing-long.json` [ASSUMPTION name] with 14 tray tiles and
  `canIncK` (one `+` → 15, three rows), and a valid Place Session with a three-row strip, under
  the epic 3 regeneration rule; add both to `serialize.test.ts`'s valid-fixture list.

## CAP-10 Winning guard

- `motion.ts` installs the capture listener when `flip.play` starts a fly-to-cell whose result
  is `finished` `won` (Confirm or Redo). A consumed event gets `preventDefault` +
  `stopPropagation` (stopping keydown propagation alone does not cancel a focused button's
  default activation). After the completing event the guard consumes only that pointer's
  `pointerup`/`pointercancel` plus a `click` in the same or the next task (for a key: its `keyup`
  and the synthesized `click`), then always uninstalls, so a long press, pan or `pointercancel`
  with no click cannot strand it. With no input it uninstalls when the animation settles by any
  path (natural end, `finishAll`, hide), so New game works after an untouched win. Undo is recognised by `[data-testid="undo"]`: the guard completes the animation,
  uninstalls and does not stop the event, so the button's own `act()` undoes (the key aliases are
  epic 6).
- The second Confirm tap's `pointerdown` settles the animation and its `click` would land on
  `New game`; the guard consumes it, so `current().session.seed` is unchanged and the stored
  `seed`, `moves` and `cursor` equal those of the `wordcell:session` value read right after the
  Confirm write (`activeMs` may differ). Seed Animation speed Slow and assert the faces'
  `getAnimations()` are running before the second tap.

## CAP-11 / CAP-12 Sweep inventory

| # | Row | Kind | CAP |
| --- | --- | --- | --- |
| S1 | A5: move the copied e2e helpers into `e2e/helpers/` (`tapAt`, `path`, `plus`, `faceOf`, `idOf`, `css`, `targets`, `onAndroid`/`onDesktop`, `holdThrough`, `expectFlownBack`, `selection`/`expectSelection`/`select`, `draft`, `storedText`, `game`/`storedGame`, `trayOrder`, `cursorIndex`, `wcOf`, `isList`, `placeholder`, `footCorner`, `space`, local `Point`/`Box`/`Selection` types, the local `box`es vs `helpers/board.ts` `box`) with `helpers.spec.ts` cases | code | 11 |
| S2 | 4.13-m2: `visibleBand()` and a dev `?bands=` order that moves a bar off its edge (every drag flies back): recorded in AD-12; fix optional | code | 11 |
| S3 | 4.13-m3: pin `rejectReason`'s `'version' in` beyond `toEqual` (`game.svelte.test.ts:296-300`) | code | 11 |
| S4 | 4.13-m4: a helper test for `openFixture` `{ booted: false }` (`helpers.spec.ts:345`) | code | 11 |
| S5 | 4.13-m5: the layout.spec banner-during-scroll pan step can leave `scrollY` unchanged under load (`layout.spec.ts:228`) | code | 11 |
| S6 | C-UI1: one shared card style for `Dialog.svelte` and `BlockingMessage.svelte` (`.card`, `h2`, `p`, wrapper) | code | 11 |
| S7 | C-E56: every CSS transition added in epic 5 reads `--wc-base-ms` and honours `--wc-reduced` | code | 11 |
| S8 | 4.13-OM: record the 21:25 banner-during-scroll failure and the five green runs in `story-refactor-sweep-plan.md` | paperwork | 12 |
| S9 | 4.13-m1: `story-refactor-sweep-plan.md` updates (`sameSession`, F34 source-clip Vitest, 'while halted', `{ booted: false }`, the `AD-7 F18` describe location) | paperwork | 12 |
| S10 | 4.9f-m5: ticket 4.9 Notes "plan `deferred[0]`" → "the former" | paperwork | 12 |
| S11 | 4.11-OM: ticket 4.11 plan names the final tree for its `test:all` line | paperwork | 12 |
| S12 | AD-17 re-measure on the Linux filesystem; slowest engine file's watch re-run | paperwork | 12 |
| S13 | The close-out edit lists above complete for the retrospective | paperwork | 12 |
| S14 | Epic 4 D19 (compact half): compact tray and strip (8+ tiles, two rows, `QU` compact tile) checked in a browser on `session-place-compact` | code | 1 |
| S15 | Epic 4 D14: WordCell count badge at 2 cards (shown) and 1 card (none), on CAP-7's scripted free-letter fixture, whose free letter's cell holds exactly 2 cards before the move: one Confirm into a different cell shows 2 → 1 | code | 7 |
| S16 | 4.12-OM (`review-loop/4-12-build.md` Result open major): hover-peek plan names App.svelte as the hoverFine watcher. Applied by ticket 4.13 D5 (`story-refactor-sweep-plan.md` l.219, 253); confirm at HEAD and record | paperwork | 12 |
| S17 | 4.12-m1, m2 (`4-12-build.md` Pass 2 Unapplied minors, `controller.ts` hover peek): timer keyed by cell number, half-open `suppress()` rects. Applied by 4.13 D6 (`controller.ts:311, 883` at f62a89a, two `AD-12` Vitests); CAP-3's hover-peek move keeps both and their Vitests | code | 3 |
| S18 | 4.12-m3 … m6 (same log): 399 ms still-open assert, two-sided 1 px gaps, plan R-65 sentence list, `?bands=` test renamed `AD-12`. Applied by 4.13 D6 sharpenings 1–4 (`story-refactor-sweep-plan.md` l.216, 219); confirm at HEAD and record | code | 11 |

A6 moved to CAP-3 (F14). A9 rows already routed: 4.2-m1 → CAP-2, 4.3-m3 and 4.3-m4 → CAP-1;
4.8-p2a, 4.11-m1, 4.11-m2, 4.11-m3 → epic 7 (Non-goals). Accepted and not carried: 4.8-p2b
transform drift on scroll mid-drag (`4-8-build.md` Result "(pass 2, accepted)", plan Residual
risks); 4.1-m3 fractional `anchorOffset` (`4-1-build.md` Result minor 3, resolved by 4.4's
sub-pixel tolerance: `story-refactor-sweep-plan.md` l.206, 253); 4.6-DN desktop scrollbar-gutter
lost press (`4-6-build.md` Pass 2 decision-needed, owner-accepted, epic 4 SPEC F30; retrospective C31);
4.7-m4 `overlays.deselect()` under a view (`4-7-build.md` Result minor 4, confirmed unreachable by
4.13 D20, `story-refactor-sweep-plan.md` l.202; key commands → epic 6 F39, Non-goals).
