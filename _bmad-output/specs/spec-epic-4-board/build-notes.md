# Build notes — epic 4

How-level guidance per capability. The spec rules, the spine ADs, DESIGN.md and EXPERIENCE.md are
the contract; these notes fix what they leave open. `[ASSUMPTION]` marks inferences.

## Spine close-out edits (for the owner to fold in at the retrospective; the spine is not edited by this epic)

Spine edits are batched at close-out as in epic 3, so the R1 AD-13 record (retrospective routing) is deliberately deferred to here.

- AD-13 (R1, F7): `nav` gains `registerBeforeBack(fn)`, separate from `register()` (which still
  throws on a second call). `main.ts` calls it once, after the pointer controller exists
  (AD-16 order). It throws before `launch()` resolves or on a second call. The hook runs for every
  `popstate` nav did not start whose `launch` is current and whose `wc` is a number, before the
  Forward check and the close callback; never for nav's own pops or Forward corrections, stale
  launches or a missing `wc`. A back arriving before registration runs no hook. Folded at the epic 4 retrospective, C11.
- AD-9/AD-17: the gesture-cancel half of the hide assertion lands (epic 3 build-notes "Not folded"
  note, retrospective S2, C-E4b): `e2e/drag-interruptions.spec.ts` "AD-9 AD-16 AD-17 hidePage
  mid-touchHold drag cancels it first…" proves it. Folded at the epic 4 retrospective, C13, C14.
- AD-12 (R2, F9): the cancel-first list widens to every App-owned dialog, notice,
  dictionary-banner and Session-rejected New game action, matching AGENTS.md's "(opening it and
  its items)"; all go through one UI helper that epic 6's menu and `keys.ts` reuse. Halted's
  Reload is exempt in both mounts (standalone, inside App on halt). Folded at the epic 4 retrospective, C7.
- AD-11 (F20): `bannerShown` is the gate-latched copy of `dictionary.showBanner` (`failed`, or the
  Q-42 kept banner during a service-worker retry), not `state === 'failed'`. The spine bug is
  reported in SPEC Open Questions (Q-42 wins per AGENTS.md Policy). Folded at the epic 4 retrospective, C1.
- AD-11: `cardWidth`'s first argument is the available viewport width (`clientWidth`, excluding a
  classic scrollbar), kept stable by `scrollbar-gutter: stable` (CAP-1). Folded at the epic 4 retrospective, C2.
- AD-13 (F16): the two-plain-overlay reload case is proven in epic 6 (menu plus confirm dialog);
  epic 4 proves the one-overlay case with a tail selection and with the sticky view. Folded at the epic 4 retrospective, C12.
- Proposed epics rows 4/5 (F1, F2, F17): epic 4 renders every `GameView` board state, a static tray
  (live tiles, no gestures) and the Composing column gestures; epic 5 keeps the tray interactions,
  the WordCell commands in Composing and Place, the placement strip, FLIP and tray growth wiring. Owner-accepted 2026-10-01 (F29): fold the move into Proposed epics; epic 4 is
  merged and deployed on its own like epics 1–3, after the owner's go-ahead. Folded at the epic 4 retrospective, C19.
- AD-12 (F13): cancel-on-back flies the tail back as for `pointercancel` (EXPERIENCE.md); cancel
  from `act()` and before-hide settles it at once, since a button press acts on the settled state.
  A real `pointercancel` ending a selection-replacing drag keeps the old selection (F24), unlike a
  release over nothing. Owner-confirmed 2026-10-01 (F28): amend AD-12 to say a drag interrupted by
  the platform (e.g. an Android edge-swipe back) that had replaced a tap-selected tail restores the
  earlier selection. Folded at the epic 4 retrospective, C8, C9.
- AD-12 (F26): "full slot pitch applies only to tile tap hit rects" reads as tile drags vs tile
  taps; column cards and WordCells also hit-test on the full slot pitch (DESIGN.md Hit rects). Folded at the epic 4 retrospective, C4.
- AD-12 (F32): the drag transform keeps a tap-selected card's 8 px selection lift (DESIGN.md
  lift) for the whole drag, and a cancelled drag's fly-back lands on the lifted slot, so a
  selected card neither jumps at pickup nor snaps at settle. Owner answer 2026-10-05.
  F33: a restoring fly-back returns the kept selection's lift, outline and `Here` at its start
  (both motion settings); the lift is kept only for a dragged stack inside the selection.
  The spine's AD-11/AD-12 text should name `SELECTION_LIFT_PX` (`src/ui/layout/geometry.ts`, fed
  to CSS as Board's `--wc-select-lift`) as the single owner of DESIGN.md's 8 px selection lift
  (AD-11 lists only two `geometry.ts` entry points today). Folded at the epic 4 retrospective, C3, C10.
- AD-12 (F34): drop targeting by card overlap uses each column's hit rect clipped to the visible
  band between the sticky top bar (plus the dictionary banner when shown) and the action bar, not
  the "whole hit rect", so a column hidden under a bar is never a target. Owner answer 2026-10-07. Folded at the epic 4 retrospective, C5.
- AD-17 Touch (F10): `touch.ts` adds the stepwise held-touch API beside `touchDrag` and `longPress`. Folded at the epic 4 retrospective, C15.
- AD-17 Speed: record the epic 4 warm median and, if it was done, the `architecture.test.ts` split.
  F35 (owner, 2026-10-07): 5.62 s on `/mnt/d` after the split (3.14 s on the Linux filesystem) is
  accepted for now; the retrospective decides whether the 5 s budget, or where it is measured, changes.
  F38 (owner, 2026-10-08): the 5 s budget stays; F41 (owner, 2026-10-08): the trial split of
  `controller.test.ts` (5.30 → 5.98 s on `/mnt/d`) is reverted and the budget is measured on a
  Linux-filesystem checkout. Folded at the epic 4 retrospective, C16, C17.

## EXPERIENCE.md close-out edits (owner answers 2026-10-01; EXPERIENCE.md is not edited by this epic)

- Message catalogue (F27): add the WordCell view and peek title `WordCell 6 · 7 cards`, singular
  `WordCell 6 · 1 card`, and the `desktop` hover peek line `+1 older card` / `+n older cards`, as
  they stand in `src/ui/text.ts`. Folded at the epic 4 retrospective, C20.
- Drop targeting by overlap step 6 (F24, F28): a drag that replaced a tap-selection and is
  interrupted by the platform (real `pointercancel`/`lostpointercapture`, e.g. an Android
  edge-swipe back) flies back and restores the earlier selection (lift, outline, foot states and
  history entry kept); a release over nothing still leaves nothing selected. Folded at the epic 4 retrospective, C21.
- Pointer thresholds, the `pointercancel` line (F24, F28): the same restore for a column drag that
  replaced a tap-selection; a following back then clears the restored selection by the normal
  back rule. Folded at the epic 4 retrospective, C22.

## DESIGN.md close-out edits (owner answer 2026-10-02; DESIGN.md is not edited by this epic)

- Column slot / drop-target highlight (F31): on `desktop`, with a whole column tap-selected,
  hovering that column's empty space or Here pad lights the Here pad with the usual teal
  drop-target outline and wash. Folded at the epic 4 retrospective, C24.
- Hover peek surface (ticket 12, F19): the view sheet's surface (`{colors.surface}`,
  `{rounded.lg}`, 16 px padding, no title), content-sized width `min(n, 7)·(w + 4) − 4 + 32` px
  for n shown cards (a technical default; DESIGN.md View sheet does not state it). Folded at the epic 4 retrospective, C26.
- Hover peek placement (ticket 12, F19): with no room above the anchor box it goes below the
  cell and may leave the board vertically, overriding "clamped inside the board"; this occurs
  only with dev `?bands=` orders. Folded at the epic 4 retrospective, C26.

## As-built facts that bite (a887379)

- `src/ui/App.svelte` is the epic 3 minimal board: a visible `h1` `WordCell` (a locator in
  `smoke.spec.ts`, `game-store.spec.ts` and others), a `Seed <n>` line (`blocking.spec.ts:328`
  reads it), grid columns, the WordCells as `<ol data-testid="wordcell-<n>" aria-label="WordCell
  <n>">`, Undo/Redo icon buttons, `primary-action`, the invalid-word line, `DictionaryBanner` and
  `HistoryNotice`. Its primary-action label logic and its New game sequence
  (`wasRejected` → `game.newGame()` → `overlays.resetForNewSession()` → `openHistoryNotice()`, R4,
  epic 6 folds it) move unchanged into the action bar.
- `main.ts` boot: `nav.launch()` → `nav.register({ closedByBack, depth })` → font check →
  `prefs.load()` → `game.load()` → (halted → standalone, return) → `game.registerLifecycle()` →
  `openHistoryNotice()` → `mount(App)` → paint → `whenVisible()` → `dictionary.load()`. The
  controller step goes between `game.load()` and `registerLifecycle()`; `main.ts` stays the only
  importer of both `src/ui/` and the shell boot functions.
- `nav.register()` throws on a second call; do not reuse it for the hook (R1).
- `overlays.svelte.ts` holds `stack` of `'historyNotice' | 'resetConfirm'`; `close` is top-down
  only and calls `nav.pop()`; `closedByBack` never calls nav; `resetForNewSession` closes top-down.
- `game.registerBeforeHide(fn)` exists, runs callbacks first in `flush()`, has no caller.
- `dictionary.showBanner` is `state === 'failed' || keepBanner`; `DictionaryBanner.svelte` renders
  on it.
- `e2e/helpers/touch.ts` `touchDrag` sends start, moves and end in one call; `longPress` holds
  with `page.waitForTimeout`.
- `src/ui/motion.ts` `duration('flyBack')` exists, unused.
- `Dialog.svelte` has no keydown handling; Esc is epic 6.
- `e2e/placeholder.screens.spec.ts` and its two baselines are the minimal board; replace them
  (CAP-2) and regenerate in the container (`npm run test:screens -- --update-snapshots`).
- The `desktop` project is `Desktop Chrome` (1280 × 720): below the 722 px height-rule minimum,
  so w = 40, H = 53 and the page scrolls 2 px. `android` is Pixel 7 (412 × 839, DPR 2.625, touch).
- CI's `system-ui` (DejaVu Sans) is wider than the dev box and the screenshot container: never
  assert a px value that depends on text metrics (F11).
- AD-18 budget: about 147 KB gzip is left for `index.html`, JS and CSS beside the dictionary and
  font; `npm run build` prints the table. Watch it per ticket.

## Component tree and modules [ASSUMPTION names]

```text
src/ui/
  App.svelte            # roots: halted / rejected / Board; dialogs beside the Board
  Board.svelte          # iterates BAND_ORDER; one component per band
  TopBar.svelte         # menu slot (empty), Score, Undo, Redo
  Column.svelte         # whole-slot hit rect (column-<n>), fanned cards, placeholder, ghosts, foot pad (foot-<n>)
  Card.svelte           # face, glyph in top 72 %, flourish, QU ×2 badge, lock, states; live or mirror
  Tray.svelte           # static tray (F2); invalid-word line in the word-line slot
  WordCellRow.svelte    # labels, WordCell slots (wordcell-<n>), count badge, states
  WordCellView.svelte   # sticky view and long-press peek (view-sheet), with its scrim inside the Board root (the controller's listener root)
  HoverPeek.svelte      # desktop hover peek
  ActionBar.svelte      # primary-action
  act.ts                # F9 helper: cancel() first, then the handler
  hover-peek.ts         # hover peek cards, width and placement (pure)
  layout/ bands.ts, geometry.ts, layout.svelte.ts, tray.ts
  gestures/ controller.ts, classify.ts, intent.ts, targeting.ts, drop-target.ts, gate.ts,
            click-swallow.ts
```

Components receive `GameView` slices and UI state as props; none imports the engine at runtime.

## CAP-1 Layout definition and geometry

- Bar sizing (owner decision 2026-10-02, Jared, Option A): The top and action bars are
  content-sized: 44 px and 60 px of content plus `env(safe-area-inset-*)` padding, which entry 2
  ships; every other band but the banner takes its height from `bands()`. Entry 4 feeds real
  insets; `bands()` bar heights equal the rendered bars.
- `BAND_ORDER` (F22) [ASSUMPTION ids]: seven units `[['topBar'], ['banner'], ['leftover'],
  ['columns', 'footRow'], ['trayGap', 'tray'], ['labels', 'wordcells'], ['actionGap',
  'actionBar']]`, the eleven AD-11 bands (foot row with its columns, DESIGN.md, so the column hit
  rect stays contiguous; gaps 4 px and 8 px with their lower neighbour, labels 16 px with the
  WordCell row). A unit's id for `?bands=` is its first non-gap, non-label band
  [ASSUMPTION]: `topBar,banner,leftover,columns,tray,wordcells,actionBar`; absent or
  empty → the default order, repeated → the first value; a list that is not a permutation of them
  throws (AD-15).
- `cardWidth`: AD-11's signature kept, but the layout module passes
  `document.documentElement.clientWidth` (excludes a classic scrollbar) as its first argument;
  `innerWidth` stays only in the w-recompute predicate. `html { scrollbar-gutter: stable }` keeps
  `clientWidth` unchanged when the page becomes scrollable, so w never goes stale (checked on
  Playwright 1.63.0's Chromium: `desktop` 1265 with and without overflow; `android` overlay
  scrollbars unaffected). Available width = that − 2 × (hoverFine ?
  16 : 4); width-derived
  `floor(avail / 8 − 4)`; height-derived = the largest integer w whose height-rule sum (with
  insets, H = round(4w/3), strip = max(44, round(0.72 H)), tray reserved = 24 + max(H, 92) + 44 +
  16) fits innerHeight, 40 when even w = 40 does not fit (S: 412 × 500 → 40); result
  `max(40, min(width, height))`.
- `bands(...)` returns each band's height, the leftover used and the absolute `ANCHOR_BAND`
  offset; the layout module (CAP-3) turns the offset change into a `scrollTop` delta. Growth rule
  exactly as AD-11 (slack on the same side of the anchor absorbs first; the rest pushes away from
  the anchor; a `scrollTop` delta only when the growing band is above it).
- Tray rows: `trayRows` = compact rows count (1 means card-height mode); the A-D4 growth formula
  `max(0, r × 44 + (r − 1) × 4 − max(H, 92))`. Epic 5 feeds real values; epic 4 always passes 1.
- The w-recompute predicate is a pure function of (last w inputs, new innerWidth/innerHeight):
  recompute iff innerWidth changed or |ΔinnerHeight| ≥ 80 px against the last computation; w is
  also recomputed (through the gate) when the `(hover: hover) and (pointer: fine)` query changes.
- innerHeight-only change under 80 px (F21) and a w recompute: `bands(...)` recomputes leftover
  = max(0, innerHeight − sum − banner) and the anchor offset; the layout module applies the
  offset delta clamped to `[0, total − innerHeight]`, total from the new `bands(...)` result,
  never a stale `scrollHeight` (SPEC CAP-1 values).

## CAP-2 Board render

- Live vs mirror (AD-14), as rendered here:
  - Idle and Game over: every column card and every WordCell card live (`data-place="column"` /
    `"cell"`); non-top WordCell cards live but visually hidden in the cell stack.
  - Composing: D cards live in their column (destination style); S slots in the source column are
    ghost mirrors; S and free-letter cards live as static tray tiles (`data-place="tray"`) in
    `draft.arrangement` order, with the D tray-block copies as mirrors at the `draft.side` end (D
    reversed when `right`, R-30); a used WordCell's face is a mirror (used state).
  - Place: every word card live as a static strip tile (`data-place="strip"`) in
    `place.placementOrder`; S and D slots in their columns are ghost mirrors; used faces mirrors.
  - Placeholder under the S ghosts when the emptied source column is also the destination.
- The static tray (F2): card-height tiles in one row while they fit (tiles per row =
  floor((inner width + 4) ÷ (tile width + 4)), 7 at 412 and 360 px); beyond, compact 44 px tiles
  in up to two rows (44 + 4 + 44 = 92 ≤ max(H, 92)), the tile area `overflow: hidden`, no growth;
  epic 5 owns the full tile metrics.
- WordCell states from `CellView`: `used`, `isLegalTarget` (ring), the target (from
  `place.target`: 3 px ring + check chip), not legal in Place (35 %); a used non-legal cell keeps
  its hatch at 40 % and the whole cell at 35 %.
- Visually hidden `h1` `WordCell`; replace every `Seed <n>` read in specs with
  `current().session.seed` (F4).
- C-E4a: extend `smoke.spec.ts`, as `R-03 …`, to assert every column's letters top→bottom for
  `session-idle-fresh` (literal lists, as column 1's `L D X O M I W` today), not only column 1;
  read each card's letter from its glyph element so the `QU` ×2 badge does not pollute the text,
  `QU` written as `QU`.
- Screenshots: `e2e/board.screens.spec.ts` with Idle (`session-idle-fresh`), Composing
  (`session-composing`), Place (`session-place-free-letter-redo-tail`) and Game over
  (`session-gave-up`) on both projects; delete the placeholder spec and baselines.

## CAP-3 Bars and live layout

- `layout.svelte.ts` holds `$state` w, band heights and the anchor offset; it listens to `resize`
  and `orientationchange` (allowed in `src/ui/`) and to the latched banner flag; it schedules work
  through `gate.whenIdle(fn)`; it applies `scrollTop += delta` in the same frame it re-lays bands,
  writing only when the clamped target differs from the current value, and the `scroll` event of
  that one write does not mark the gate scroll-busy (the ignore flag clears in the next
  `requestAnimationFrame` whether or not a `scroll` fired).
- Insets probe: a fixed-position, invisible element with `padding: env(safe-area-inset-*)`,
  read with `getComputedStyle`.
- `main.ts` creates one gate before the controller, passes it to `createController(gate)` and the
  layout module, and registers its scroll reset with `registerBeforeHide`.
- `gate.ts` (`createGate({ raf, setTimer, clearTimer })`, injected for S tests): a counter
  (`enter()`/`leave()`) for gestures and running animations, a scroll-busy
  flag (`scroll` sets, `scrollend` or a 150 ms quiet timer or the before-hide reset clears),
  `whenIdle(fn)` queues work for the first `requestAnimationFrame` with the gate idle.
- Score text `Score <n>` goes in `text.ts` (`score(n)`), with U+2212 for negatives.
- Playwright (measure, F11): assert relations between rendered rects (slot = w + 4, board =
  8 × slot, H = round(4w/3), strip = max(44, round(0.72 H)), columns + foot + gap + tray +
  labels + cells + gap + action bar fitting innerHeight when no scroll is expected) and the
  Pixel 7 card size (46 × 61, font-independent); never a text-dependent px value.
- Banner anchoring test: a viewport with leftover < 44 px (e.g. 412 × 780 → leftover 42 at
  w = 46) and the dictionary route failing; record the WordCell row box before and after the banner
  appears. Scroll test: 412 × 600 (w 40, sum 722, scroll range 122 px), the dictionary route
  held; `touchHold` on a foot pad with nothing selected (`pan-y`; the leftover band is 0 px
  there), small `moveTo` steps of 2–3 px about every 50 ms (or alternating direction) so total travel stays
  within the 122 px range, the finger kept down; fail the route only after the pan has started,
  continuing through the failure and the no-banner check (an instant `scrollTo` is a completed scroll
  and fires `scrollend`; the 150 ms backstop clears busy even with the finger down), assert
  `scrollY` changed between steps and no banner while `scroll` events arrive under 150 ms apart,
  then stop or `end()` and assert the banner within a frame of `scrollend` or 150 ms quiet.
  `unverified`: a CDP touch pan from a `pan-y` foot pad scrolls the document, and a held pan fires
  no `scrollend` before release; the ticket checks both. If the pan does not scroll or ends
  early, fall back on `desktop` to `page.mouse.wheel` steps under 150 ms apart (`unverified`: no
  `scrollend` between steps) or CDP `Input.synthesizeScrollGesture` (`unverified`).

## CAP-4 Pointer controller core and cancel wiring

- `createController(gate)` (the shared gate, CAP-3) returns `{ cancel, attach(root) }` [ASSUMPTION]; `attach` runs from a
  Svelte action on App's active-branch root, which spans the viewport except the desktop
  `scrollbar-gutter` strip (F30), on every mount and returns
  a detach that calls `cancel()` first (F8); listeners on that root for `pointerdown` (`button !== 0` ignored), then
  `setPointerCapture` only for a press resolved to a column, a WordCell or a tile;
  `pointermove`, `pointerup`, `pointercancel`, `lostpointercapture` on it; presses on enabled
  buttons are never classified or captured (their own `act()` handlers run); disabled controls
  fall through to the outside-tap path (F25). A second `pointerId` during an active press never
  touches controller state, with no `preventDefault` or `stopPropagation`, so a second finger's
  native button `click` still fires. Classification is the pure `classify(...)` in `gestures/`
  (S); the listeners only feed it. A primary `pointerdown` with no active press `finish()`es a
  running fly-back (gate `leave()` included) without calling `cancel()`, then resolves from
  `elementFromPoint` at the press point (never `event.target`) and captures on the resolved
  element.
- Slot wrappers (F26): card and WordCell elements are `w + 4` wide (strip, or H for a bottom card
  and a WordCell) with the face centred inside and `pointer-events: none`, so hit-testing and `elementFromPoint`
  see only wrappers (a lifted face would otherwise overlap the card above); size assertions on cards measure the face child.
- Press targets (F23): a card press resolves by its `data-place`: `column` → column press,
  `cell` → its WordCell's press, `tray`/`strip` → inert (no dispatch, no selection change);
  non-card presses by `closest('[data-column]')`, `closest('[data-wordcell]')`,
  `closest('[data-foot]')` [ASSUMPTION attribute names, not test ids]; a non-card column press or
  a WordCell press that crosses the threshold is inert (nothing lifted, no dispatch, selection
  kept); drop targets register with
  `use:dropTarget={{ kind: 'column', id }}` on the whole slot.
- Long-press: a plain `setTimeout(400)` in the UI, cleared on threshold crossing, release or
  cancel; only WordCell presses start it.
- `cancel({ byBack })` `finish()`es a running fly-back (gate `leave()` included); any press in
  progress ends with no command (tap candidate, below-threshold press, Composing destination-card
  press, long-press timer cleared, drag → tail back in its slot at once, transform cleared, no
  fly-back), gate idle before a `cancel()` without `byBack` returns; a real `pointercancel`/`lostpointercapture` and
  `cancel({ byBack: true })` end a press the same way except that a drag flies back (F13); peek → `closePeek()`; it releases capture and clears
  the active press at once, so another pointer's `pointerdown` starts a new gesture; only the dead
  `pointerId`'s own events are dropped until its `pointerup`/`pointercancel`. Only a drag that
  replaced a selection calls `overlays.deselect()`, and not with `byBack` or on a real
  `pointercancel`/`lostpointercapture` (F24): those restore the old selection's lift, outline and
  foot classes and keep its entry (back's `closedByBack` clears it); on hide that deselect's `nav.pop()` goes through nav's queue (`wc` 0
  after `showPage`); a plain tap-selection survives hide (no `nav.pop()` during pagehide), and
  no other overlay entry is closed by `cancel()` (AD-13). `main.ts`:
  `game.registerBeforeHide(() => controller.cancel())`,
  `nav.registerBeforeBack(() => controller.cancel({ byBack: true }))`.
- `act(handler)` (F9) wraps every native button `onclick` in `App` (the rejected root's New game
  included), `TopBar`, `ActionBar`, `HistoryNotice`, `Dialog` callers and `DictionaryBanner`;
  `Halted.svelte` owns its `reload` and is exempt in both mounts (`main.ts` `showStandalone` and
  App's `{#if halted}`). Undo, Redo and the banner `Reload` always call `overlays.deselect()` in their
  handler, then act (the banner's `dictionary.retry()` decides any page reload privately). S tests spy that `cancel` (and so a fly-back `finish()`) runs before
  the handler.
- Held-touch helper (F10): `touchHold(page, from)` returning `{ moveTo(point), end() }` on one CDP
  session (`touchStart`, `touchMove`s, `touchEnd`), with a `helpers.spec.ts` case.
- AD-17 hide case: `touchHold` from a column card, `moveTo` another column, `hidePage`, `moveTo`
  again, then `end()`: no `drop` (Session reference unchanged), exactly one `wordcell:session`
  write (`armStorageSpy`), the tail back in its column, clock resumes only after `showPage`.
  Same with a held destination-card press in `session-composing`: `hidePage`, `end()` → no
  `tapDestinationCard`.
- Cancel-first P4: during a held `touchHold` drag, trigger Undo with
  `getByTestId('undo').dispatchEvent('click')` (the one-point helper has no second touch), from
  `session-idle-empty-column` (Undo enabled in Idle); on `desktop` the same while a `page.mouse`
  drag is held; assert the tail returned, then `current().session.cursor.index` decreased.
- Rejected root: the controller exists but is detached; `hidePage` there writes nothing (epic 3)
  and the before-hide `cancel` is a no-op. App's `newGame` swaps to the Board without a reload, so
  the Board root's mount attaches it (P4 in `blocking.spec.ts`).

## CAP-5 Overlays

- API [ASSUMPTION names]: `select(column, count)`, `deselect()`, `selection` getter,
  `endSheet` getter, `expandEndSheet()`, `collapseEndSheet()`, `onUnfinished()`,
  `deferEndSheetOpen(): token`, `openDeferred(token)` (no-op if cancelled), `openView(cell)`. `closedByBack(d)` pops
  deeper entries topmost first; on `endSheet` it sets `collapsed`; on `tailSelection` it clears the
  selection.
- The selection entry stays at its position when a sticky view stacks above it (EXPERIENCE.md
  Information Architecture).

## CAP-6 Tap-select and tap-drop

- Selection order of effects for a tap-drop: `overlays.deselect()` (queues the pop), then
  `game.dispatch({ type: 'drop', sourceColumn, sourceCount, destinationColumn })`; nav's queue
  keeps the pop before any later push.
- Gate on `GameView`: select, or lift a tail by drag, only when `column.canPickUp` (otherwise
  the press is inert); drop only when `column.canDropOn`; no dispatch otherwise.
- Taps outside the columns (F25): deselect only on the controller's `tap` classification (a
  pointer tap's trailing `click` is ignored; `click` counts only for non-pointer activation)
  whose target is outside every column hit rect, `[data-wordcell]`, the open view sheet and scrim,
  and is not an enabled control (an enabled control deselects in its own handler before acting),
  never on `pointerdown` or a long-press, so a non-empty WordCell long-press and a `pan-y` pan
  keep the selection; an empty-WordCell long-press deselects on release as a tap (controller). Outside regions: top bar background,
  banner background, leftover band, tray band, labels, gaps, action bar background, `desktop`
  side margins, disabled controls. Whether Chromium fires pointer events on a disabled
  `<button>` is unverified: the ticket checks and, if not, wraps disabled controls' hit area
  [ASSUMPTION].
- Desktop hover under `(hover: hover) and (pointer: fine)` only, via CSS and the controller's
  `pointerover`; outlines are classes on the column (`[data-column]`), set by `pointerover` and
  `refreshHover()`, never Svelte state per move.

## CAP-7 Drag and targeting

- Dragged rect: the grabbed card's face `getBoundingClientRect()` after its transform (F26); candidates: every
  registered column hit rect, read live each `pointermove`, rendered rects clipped vertically to
  the visible band between the sticky bars (F34).
- `Column.svelte` always renders the placeholder in the top slot (hidden when not empty); on a
  whole-column drag over its source the controller reveals and outlines it by DOM class.
- `hasLeftSource` becomes true at the first post-threshold `pointermove` where `raw !== sourceId`.
- Fly-back: WAAPI `transform` from the release offset to 0 over `duration('flyBack')` (reduced
  motion: clear the transform at once and fade the faces 0 → 1 over that duration, gate-counted), `gate.enter()` until finished, the flying tail
  `pointer-events: none`; a primary `pointerdown` `finish()`es it (no `cancel()`) and an `act()`
  handler's `cancel()` does, so the press (re-resolved per CAP-4; `elementFromPoint` stays the
  resolver after `finish()`) or the button acts on the settled layout (EXPERIENCE.md Interaction
  Primitives; P4).
- A drag that replaces a selection, from any column including the selected source column (the
  selected card or one above or below it): at threshold crossing the controller removes the old
  selection's lift/outline and foot-state classes from the DOM only (F12), and the new drag gets
  Q-34 source suppression; at release, on a `drop`, `overlays.deselect()` then dispatch; released with no
  command, `overlays.deselect()` too; ended by a real `pointercancel`/`lostpointercapture` or
  `cancel({ byBack: true })`, no deselect: the tail flies back and the controller re-adds the old
  selection's classes (`closedByBack` clears it on back). P4: drag from the source column of a tap-selected tail, assert one
  lifted tail mid-drag.
- The lifted tail draws above the bars (layer order: drag layer above sticky bars).

## CAP-8 Composing, Place, Game over

- Destination-column tap: `column.kIfTapped.get(card)` is a number → `dispatch({ type:
  'tapDestinationCard', card })`; `null` or absent → nothing.
- Hover preview (desktop): outline the cards from the hovered card to the bottom when the map
  gives a number; for the top of D the outline shows the D at k − 1.
- A press that crosses the threshold without a pick-up drag suppresses hover while held and
  repaints it at every end; a column press also clears it at the crossing. The k preview ends at
  the remainder's bottom card (never S ghosts).

## CAP-9 WordCell view

- Overflow (F14): at release, the peek stays as the sticky view iff the rendered sheet's scroll
  area overflows (`scrollHeight > clientHeight`); no pure formula.
- Peek and sticky state through the overlays store only (CAP-5): long-press → `openPeek(cell)`,
  release → `closePeek()` or `peekToSticky()`; tap → `openView(cell)`;
  `openPeek`, `peekToSticky` and `openView` close an open hover peek; `HoverPeek` uses the store's hover-peek state.
- Sticky view: the sheet and its mirror cards are `touch-action: pan-y`, so a swipe scrolls it
  and keeps it open; a full-viewport scrim (`touch-action: none`). The controller classifies
  sheet and scrim presses: `tap` → `overlays.close('wordcellView')`, then a one-shot
  capture-phase `click` listener swallows that gesture's trailing `click` (so it cannot reach the
  button under the closed scrim), disarmed by the swallowed `click`, the next `pointerdown` or a 300 ms
  expiry armed at `pointerup`, whichever first (`setTimeout(0)` can run before Chromium's touch
  gesture-tap `click`; the touch `pointerup` → `click` order is `unverified`, gated by the
  `android` P4 scrim tap over Undo) (S: the trailing click swallowed, then a later click reaches
  its handler; with no trailing click, the next `pointerdown` or the expiry disarms it); drag → nothing. The sheet's scroll area has
  `overscroll-behavior: contain`. Back → `closedByBack`.
- Hover peek: 400 ms `pointerover` timer on the cell, started only for `pointerType === 'mouse'`
  under `(hover: hover) and (pointer: fine)`, cancelled on leave; any `pointerdown` cancels the
  timer, and closes an open hover peek only when the press starts a drag, a peek or the sticky
  view (otherwise it stays until `pointerleave`, EXPERIENCE.md);
  never opens during a drag or while a peek or the view is open; positioned above the cell, clamped inside the board,
  below when no room (F19).
- The peek and hover copies are mirrors (`data-mirror-of`). Every view lists `CellView.cards`
  in full: a used cell's top (live in the tray or strip) is a normal-card mirror (AD-14), not
  hatched, still tagged `top`; count `cards.length`; empty = `cards.length === 0`.

## CAP-10 Refactor sweep

- R7: move the `describe('score history store', …)` block (`game.svelte.test.ts:1197` on) and any
  history-only helpers into `src/shell/history.svelte.test.ts`; test names unchanged.
- R6 / F18 `src/shell/stored-key.ts`: `rejectReason(parsed)` generic over the three parse result
  types; `lastText` tracker `{ remember(text), isStale(currentText) }` (each store passes its own
  `read(KEY)`, as `history.svelte.ts` `read(HISTORY_KEY) !== lastText` today) and the `loaded()`
  launch snapshot pattern fed by the store; `stored-key.ts` never imports `./storage` (AGENTS.md:
  only the shell stores call it); `assertWritable(owner, op)` for the
  history `reset` and prefs setters (`AD-15 <op>() while <kind>`). Derive `PrefsRejectReason`
  from `ParsePrefsResult`. Update AGENTS.md "Where things are" through `bmad-project-context`.
- Re-measure (AD-17): three `npm test` runs after a discarded warm-up, warm `fsModuleCache`; record
  the median and the slowest engine file's watch re-run; split `src/architecture.test.ts` (with
  its scan exemption) first if the median exceeds 5 s.
