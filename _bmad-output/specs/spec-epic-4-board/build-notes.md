# Build notes — epic 4

How-level guidance per capability. The spec rules, the spine ADs, DESIGN.md and EXPERIENCE.md are
the contract; these notes fix what they leave open. `[ASSUMPTION]` marks inferences.

## Spine close-out edits (for the owner to fold in at the retrospective; the spine is not edited by this epic)

- AD-13 (R1, F7): `nav` gains `registerBeforeBack(fn)`, separate from `register()` (which still
  throws on a second call). `main.ts` calls it once, after the pointer controller exists
  (AD-16 order). It throws before `launch()` resolves or on a second call. The hook runs for every
  `popstate` nav did not start whose `launch` is current and whose `wc` is a number, before the
  Forward check and the close callback; never for nav's own pops or Forward corrections, stale
  launches or a missing `wc`. A back arriving before registration runs no hook.
- AD-9/AD-17: the gesture-cancel half of the hide assertion lands (epic 3 build-notes "Not folded"
  note, retrospective S2, C-E4b): name the Playwright test that proves it.
- AD-12 (R2, F9): the cancel-first list widens to every dialog, notice, dictionary-banner and
  Blocking-message action, matching AGENTS.md's "(opening it and its items)"; all go through one UI
  helper that epic 6's menu and `keys.ts` reuse.
- AD-11 (F20): `bannerShown` is the gate-latched copy of `dictionary.showBanner` (`failed`, or the
  Q-42 kept banner during a service-worker retry), not `state === 'failed'`.
- AD-13 (F16): the two-plain-overlay reload case is proven in epic 6 (menu plus confirm dialog);
  epic 4 proves the one-overlay case with a tail selection and with the sticky view.
- Proposed epics rows 4/5 (F1, F2, F17): epic 4 renders every `GameView` board state, a static tray
  (live tiles, no gestures) and the Composing column gestures; epic 5 keeps the tray interactions,
  the WordCell commands in Composing and Place, the placement strip, FLIP and tray growth wiring.
- AD-17 Touch (F10): `touch.ts` adds the stepwise held-touch API beside `touchDrag` and `longPress`.
- AD-17 Speed: record the epic 4 warm median and, if it was done, the `architecture.test.ts` split.

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
  WordCellView.svelte   # sticky view and long-press peek (view-sheet)
  HoverPeek.svelte      # desktop hover peek
  ActionBar.svelte      # primary-action
  act.ts                # F9 helper: cancel() first, then the handler
  layout/ bands.ts, geometry.ts, layout.svelte.ts
  gestures/ controller.ts, gate.ts, targeting.ts
```

Components receive `GameView` slices and UI state as props; none imports the engine at runtime.

## CAP-1 Layout definition and geometry

- `BAND_ORDER` ids [ASSUMPTION]: `topBar`, `banner`, `leftover`, `columns` (with the foot row),
  `trayGap` (4 px, grouped with the tray), `tray`, `wordcells` (labels 16 px + cells), `actionGap`
  (8 px, grouped with the action bar), `actionBar`. "Each gap with its lower neighbour" and
  "labels with the WordCell row" are units, so a fallback order moves them together.
- `cardWidth`: available width = innerWidth − 2 × (hoverFine ? 16 : 4); width-derived
  `floor(avail / 8 − 4)`; height-derived = the largest integer w whose height-rule sum (with
  insets, H = round(4w/3), strip = max(44, round(0.72 H)), tray reserved = 24 + max(H, 92) + 44 +
  16) fits innerHeight; result `max(40, min(width, height))`.
- `bands(...)` returns each band's height, the leftover used and the absolute `ANCHOR_BAND`
  offset; the layout module (CAP-3) turns the offset change into a `scrollTop` delta. Growth rule
  exactly as AD-11 (slack on the same side of the anchor absorbs first; the rest pushes away from
  the anchor; a `scrollTop` delta only when the growing band is above it).
- Tray rows: `trayRows` = compact rows count (1 means card-height mode); the A-D4 growth formula
  `max(0, r × 44 + (r − 1) × 4 − max(H, 92))`. Epic 5 feeds real values; epic 4 always passes 1.
- The w-recompute predicate is a pure function of (last w inputs, new innerWidth/innerHeight):
  recompute iff innerWidth changed or |ΔinnerHeight| ≥ 80 px against the last computation.

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
- The static tray shows tiles at card height in one row and wraps without compact mode or
  growth [ASSUMPTION]: epic 4 needs only identity and order, epic 5 owns tile metrics.
- WordCell states from `CellView`: `used`, `isLegalTarget` (ring), the target (from
  `place.target`: 3 px ring + check chip), not legal in Place (35 %); a used non-legal cell keeps
  its hatch at 40 % and the whole cell at 35 %.
- Visually hidden `h1` `WordCell`; replace every `Seed <n>` read in specs with
  `current().session.seed` (F4).
- C-E4a: extend `smoke.spec.ts` to assert every column's letters top→bottom for
  `session-idle-fresh` (literal lists, as column 1's `L D X O M I W` today), not only column 1.
- Screenshots: `e2e/board.screens.spec.ts` with Idle (`session-idle-fresh`), Composing
  (`session-composing`), Place (`session-place-free-letter-redo-tail`) and Game over
  (`session-gave-up`) on both projects; delete the placeholder spec and baselines.

## CAP-3 Bars and live layout

- `layout.svelte.ts` holds `$state` w, band heights and the anchor offset; it listens to `resize`
  and `orientationchange` (allowed in `src/ui/`) and to the latched banner flag; it schedules work
  through `gate.whenIdle(fn)`; it applies `scrollTop += delta` in the same frame it re-lays bands.
- Insets probe: an absolutely positioned, invisible element with `padding: env(safe-area-inset-*)`,
  read with `getComputedStyle`.
- `gate.ts`: a counter (`enter()`/`leave()`) for gestures and running animations, a scroll-busy
  flag (`scroll` sets, `scrollend` or a 150 ms quiet timer or the before-hide reset clears),
  `whenIdle(fn)` queues work for the first `requestAnimationFrame` with the gate idle.
- Score text `Score <n>` goes in `text.ts` (`score(n)`), with U+2212 for negatives.
- Playwright (measure, F11): assert relations between rendered rects (slot = w + 4, board =
  8 × slot, H = round(4w/3), strip = max(44, round(0.72 H)), columns + foot + gap + tray +
  labels + cells + gap + action bar fitting innerHeight when no scroll is expected) and the
  Pixel 7 card size (46 × 61, font-independent); never a text-dependent px value.
- Banner anchoring test: a viewport with leftover < 44 px (e.g. 412 × 780 → leftover 42 at
  w = 46) and the dictionary route failing; record the WordCell row box before and after the banner
  appears. Scroll test: start a scroll (`page.mouse.wheel` on desktop or a touch pan on a `pan-y`
  region), fail the dictionary during it, assert the banner applies only after `scrollend`.

## CAP-4 Pointer controller core and cancel wiring

- `createController()` returns `{ cancel, attach(root) }` [ASSUMPTION]; listeners on the board
  root for `pointerdown`, then `setPointerCapture` on the pressed element; `pointermove`,
  `pointerup`, `pointercancel` on it; a second `pointerId` is ignored until the first ends.
- Press targets are found by `closest('[data-card-id]')`, `closest('[data-column]')`,
  `closest('[data-wordcell]')`, `closest('[data-foot]')` [ASSUMPTION attribute names, not test
  ids]; drop targets register with `use:dropTarget={{ kind: 'column', id }}` on the whole slot.
- Long-press: a plain `setTimeout(400)` in the UI, cleared on threshold crossing, release or
  cancel; only WordCell presses start it.
- `cancel()` = `pointercancel` semantics: column drag → fly-back, no command; peek → closes; no
  overlay entry is closed by `cancel()` itself (AD-13).
- `act(handler)` (F9) wraps every native button `onclick` in `App`, `TopBar`, `ActionBar`,
  `HistoryNotice`, `Dialog` callers, `DictionaryBanner` and `BlockingMessage`; S test spies that
  `cancel` runs before the handler.
- Held-touch helper (F10): `touchHold(page, from)` returning `{ moveTo(point), end() }` on one CDP
  session (`touchStart`, `touchMove`s, `touchEnd`), with a `helpers.spec.ts` case.
- AD-17 hide case: `touchHold` from a column card, `moveTo` another column, `hidePage`, then
  `end()`: no `drop` (Session reference unchanged), exactly one `wordcell:session` write
  (`armStorageSpy`), the tail back in its column, clock resumes only after `showPage`.
- Rejected root: the controller exists but nothing is attached; `hidePage` there writes nothing
  (epic 3) and the before-hide `cancel` is a no-op.

## CAP-5 Overlays

- API [ASSUMPTION names]: `select(column, count)`, `deselect()`, `selection` getter,
  `endSheet` getter, `expandEndSheet()`, `collapseEndSheet()`, `onUnfinished()`,
  `deferEndSheetOpen(): token`, `openDeferred(token)` (no-op if cancelled). `closedByBack(d)` pops
  deeper entries topmost first; on `endSheet` it sets `collapsed`; on `tailSelection` it clears the
  selection.
- The selection entry stays at its position when a sticky view stacks above it (EXPERIENCE.md
  Information Architecture).

## CAP-6 Tap-select and tap-drop

- Selection order of effects for a tap-drop: `overlays.deselect()` (queues the pop), then
  `game.dispatch({ type: 'drop', sourceColumn, sourceCount, destinationColumn })`; nav's queue
  keeps the pop before any later push.
- Gate on `GameView`: select only when `column.canPickUp`; drop only when `column.canDropOn`; no
  dispatch otherwise.
- Taps outside the columns: a capture-phase `pointerdown`/`click` on the document that deselects
  when the target is outside every column hit rect and is not an enabled control (an enabled
  control deselects in its own `act` handler before acting). Whether Chromium fires pointer events
  on a disabled `<button>` is unverified: the ticket checks and, if not, wraps disabled controls'
  hit area [ASSUMPTION].
- Desktop hover under `(hover: hover) and (pointer: fine)` only, via CSS and the controller's
  `pointerover`; outlines are classes on the column cards, never Svelte state per move.

## CAP-7 Drag and targeting

- Dragged rect: the grabbed card's `getBoundingClientRect()` after its transform; candidates: every
  registered column hit rect, read live each `pointermove`.
- `hasLeftSource` becomes true at the first post-threshold `pointermove` where `raw !== sourceId`.
- Fly-back: WAAPI `transform` from the release offset to 0 over `duration('flyBack')` (reduced
  motion: the 120 ms opacity fade), `gate.enter()` until finished; a new `pointerdown` calls
  `finish()` first.
- A drag that replaced a selection: on a `drop`, `overlays.deselect()` then dispatch; with no
  command, `overlays.deselect()` too, except when ended by the before-back `cancel()`.
- The lifted tail draws above the bars (layer order: drag layer above sticky bars).

## CAP-8 Composing, Place, Game over

- Destination-column tap: `column.kIfTapped.get(card)` is a number → `dispatch({ type:
  'tapDestinationCard', card })`; `null` or absent → nothing.
- Hover preview (desktop): outline the cards from the hovered card to the bottom when the map
  gives a number; for the top of D the outline shows the D at k − 1.

## CAP-9 WordCell view

- Overflow (F14): `rows = ceil(count / perRow)`, `perRow = floor((boardWidth − 32 + 4) / (w + 4))`;
  overflow iff title + rows × (H + 4) − 4 + padding > 0.8 × innerHeight [ASSUMPTION exact paddings
  per DESIGN.md view-sheet].
- Sticky view: `overlays.open('wordcellView')`; a full-viewport scrim catches the closing tap
  (consumed); back → `closedByBack`.
- Hover peek: 400 ms `pointerover` timer on the cell, cancelled on leave or any `pointerdown`;
  never while the controller has a drag; positioned above the cell, clamped inside the board,
  below when no room (F19).
- The peek and hover copies are mirrors (`data-mirror-of`).

## CAP-10 Refactor sweep

- R6: move the `describe('score history store', …)` block (`game.svelte.test.ts:1197` on) and any
  history-only helpers into `src/shell/history.svelte.test.ts`; test names unchanged.
- R7 / F18 `src/shell/stored-key.ts`: `rejectReason(parsed)` generic over the three parse result
  types; `lastText` tracker `{ remember(text), isStale(key) }`; `assertWritable(owner, op)` for the
  history `reset` and prefs setters (`AD-15 <op>() while <kind>`). Derive `PrefsRejectReason`
  from `ParsePrefsResult`. Update AGENTS.md "Where things are" through `bmad-project-context`.
- Re-measure (AD-17): three `npm test` runs after a discarded warm-up, warm `fsModuleCache`; record
  the median and the slowest engine file's watch re-run; split `src/architecture.test.ts` (with
  its scan exemption) first if the median exceeds 5 s.
