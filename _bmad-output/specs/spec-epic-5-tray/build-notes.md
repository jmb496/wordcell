# Build notes — epic 5

How-level guidance per capability. The spec rules, the spine ADs, DESIGN.md and EXPERIENCE.md are
the contract; these notes fix what they leave open. `[ASSUMPTION]` marks inferences.

## Spine close-out edits (for the owner to fold in at the retrospective; the spine is not edited by this epic)

- AD-12 (F4): the tray band's drop rect is clipped to the visible band like the columns.
- AD-12 (F2): `data-place` `tray`/`strip` presses are tile presses; a D-block mirror press is a
  no-op that keeps a tile selection; the selected-tile 4 px lift moves only the face.
- AD-12 (F5): tile and free-letter drags end like column drags (platform cancel and back fly back,
  `act()` and hide settle at once).
- AD-14 (F6, F7): FLIP lives in `src/ui/flip.ts`; the kind per transition; the controller's
  `pointerdown` and `cancel()` finish every running animation.
- AD-14 (F8): name the epic 5 winning-guard tests; the pending-open cancel and menu case land in
  epic 6.
- AD-11 (F10): `layout.svelte.ts` takes tray rows from `trayLayout`; `TRAY_ROWS` is gone.
- Structural Seed: `src/ui/flip.ts`; the `gestures/` modules CAP-3 splits out and the tile modules
  (build-notes Component tree); the shared class-name module.
- Proposed epics row 5: record what moved to epic 6 (the pending-end-sheet half of the guard, F8).
- AD-17 Speed: the epic 5 warm median on the Linux filesystem (CAP-12).

## EXPERIENCE.md and DESIGN.md close-out edits (EXPERIENCE.md and DESIGN.md are not edited by this epic)

- EXPERIENCE.md Motion: the owner's OQ-1 answer as rows (tray → strip, Flip, k change, tap-add,
  removal, tap-swap, free-letter return).
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
  wrapping; CAP-2 adds the one-run guard and the label shrink (A9 4.2-m1, `ActionBar.svelte:79-83`).
- `Card.svelte` takes `tile`, `segment`, `mirror: 'block'`; the ×2 badge shifts on widened block
  tiles (A9 4.3-m4, `Card.svelte:165-182`); `{#each}` keys by CardId alone in `Column.svelte:82`
  and `WordCellRow.svelte:53` (A9 4.3-m3).
- `overlays.svelte.ts` holds `stack`, `selection`, `endSheet`, `peek`, `viewCell`, `hoverPeek` and
  the deferred-open token; `resetForNewSession` already clears "tail and tile selections" in the
  spine's words, but no tile state exists yet.
- Fixtures: `session-composing` (source 3, 2 cards [42, 0], destination 6, k 1, side right),
  `session-composing-draft-2-letters`, `session-place` (target 3, order [42, 0, 28]),
  `session-place-free-letter-redo-tail` (free letter from cell 3, Place, redo tail),
  `session-idle-empty-column` (cell 7 holds 7 cards), `session-won` (8 committed moves). No
  Session has ≥ 15 tiles.
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
- Word line: render `draft.word` per card so D letters can be underlined (iterate tray order and
  `faces`, uppercase, `QU` as `QU`); shrink with a measured `font-size` between 20 and 14 px in a
  fixed-width box, never a text-dependent px assertion in e2e (epic 4 F11).
- Tags: free-letter origin tag from `draft.freeLetters` / the cell the card came from — read it
  from `GameView` (the cell whose `used` top is that card), never a UI-held map (AD-3).
  [ASSUMPTION: `CellView.cards.at(-1)` of a used cell is the free letter's CardId.]
- Meta format and letter count strings in `text.ts` (F11): `letters(n)`, `placeMeta(n, cell,
  delta)` with `+n`, `±0`, `−n`.
- AD-14: tiles stay the cards' live elements; the block copies stay mirrors; key `{#each}` by
  `${id}-${mirror}` everywhere (A9 4.3-m3).

## CAP-2 D-block controls, Validate and Confirm

- `−`/`+`/Flip are native buttons wrapped in `act()`; disabled from `canDecK`/`canIncK`/`canFlip`;
  the caption shows when `draft.k === 0` [ASSUMPTION: k = 0 iff the destination column is empty
  after R-21, as R-31 states].
- Validate one-run (F15): set a local `pending` flag at tap, dispatch, `flushSync()`, clear it.
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
- Clear rules (F1, F13) in one function used by the controller's tap path and by `act()`.

## CAP-5 Tile drag

- Drag layer: transform the dragged tile's face; the other tiles' parting is a transform on their
  faces too, WAAPI `duration('parting')`, never layout changes mid-drag (hit rects fixed).
- `insertionIndex` gap rects: computed from the resting tile slot rects (not the parted ones) so
  the target does not oscillate; [ASSUMPTION] hysteresis is not needed beyond "nearest gap".
- Reorder result: remove the dragged id from M, insert at the index, compare by card with the
  current order; dispatch only on a change.
- In Place every strip tile (S, F and D) is movable; the gaps are 0…n of the strip.

## CAP-6 Free letters

- A WordCell press in Composing on a cell with `canAddFreeLetter`: tap → `addFreeLetter { cell }`;
  threshold crossing before 400 ms → free-letter drag of the top card's live element; the cell
  shows a ghost (controller class on the cell wrapper, DOM only).
- Full-layout caret: "full" = tile count after the drop > perRow × current rows (card mode holds
  one row), from `trayLayout`.
- The index passed is the gap in M (0…|M|), not the tray position; translate around the D block.

## CAP-7 Place

- Target tap through the WordCell press path: `canSetTarget` → `setTarget { cell }`; otherwise no
  dispatch (F13 decides the tile selection).
- Confirm stays in `ActionBar.svelte`; the commit's fly-to-cell is CAP-8.

## CAP-8 FLIP and fly-to-cell

- Capture before the view changes, play after the DOM update: either `flip.capture()` in the one
  dispatch helper before `game.dispatch` and `flip.play(kind)` after `flushSync()`, or a
  `$effect.pre` on `game.view` (Assumptions). Kind selection compares the previous and next view
  (phase and `cursor`-derived counts) — presentation only, no legality (AD-3).
- Every animation registers with the gate (`enter`/`leave`) and with one running set that
  `finishAll()` completes; the controller's `pointerdown` and `cancel()` call it (F6).
- Fly-to-cell targets the cell's live element stack; stagger bottom card first.
- New game/Replay and restore never animate.

## CAP-9 Tray growth

- Feed `trayLayout(count).rows` (count includes D mirrors in Composing; strip tiles in Place) to
  the layout module as a reactive input; the module requests a band re-layout through the gate,
  which runs after the drag or animation ends (A-D4 "after the edit completes").
- Fixture: script `session-composing-long.json` [ASSUMPTION name] with ≥ 15 tray tiles under the
  epic 3 regeneration rule and add it to `serialize.test.ts`'s valid-fixture list.

## CAP-10 Winning guard

- `motion.ts` installs the capture listener when `flip.play('flyToCell')` starts on a transition
  into won and removes it at settle; Undo is recognised by `[data-testid="undo"]` (keys are epic 6).
- The second Confirm tap lands on `New game` after the commit; the guard consumes it, so
  `current().session.seed` and the stored Session are unchanged.

## CAP-11 / CAP-12 Sweep inventory

| # | Row | Kind | CAP |
| --- | --- | --- | --- |
| S1 | A5: move the copied e2e helpers into `e2e/helpers/` (`tapAt`, `path`, `plus`, `faceOf`, `idOf`, `css`, `targets`, `onAndroid`/`onDesktop`, `holdThrough`, `expectFlownBack`, `selection`/`expectSelection`/`select`, `draft`, `storedText`, `game`/`storedGame`, `trayOrder`, `cursorIndex`, `wcOf`, `isList`, `placeholder`, `footCorner`, `space`, local `Point`/`Box`/`Selection` types, the local `box`es vs `helpers/board.ts` `box`) with `helpers.spec.ts` cases | code | 11 |
| S2 | 4.13-m2: `visibleBand()` and a dev `?bands=` order that moves a bar off its edge (every drag flies back): fix or record as a dev-only limitation | code | 11 |
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

A6 moved to CAP-3 (F14). A9 rows already routed: 4.2-m1 → CAP-2, 4.3-m3 and 4.3-m4 → CAP-1;
4.8-p2a, 4.11-m1, 4.11-m2, 4.11-m3 → epic 7 (Non-goals). Accepted and not carried: 4.8-p2b drift
on scroll mid-drag (plan residual risk), 4.1-m3, 4.6-DN, 4.7-m4.
