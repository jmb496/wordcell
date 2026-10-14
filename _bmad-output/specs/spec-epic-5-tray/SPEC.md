---
id: SPEC-epic-5-tray
companions:
  - rule-coverage.md
  - build-notes.md
  - ../spec-epic-4-board/SPEC.md
  - ../../../docs/game-flow-spec.md
  - ../../planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md
  - ../../../AGENTS.md
  - ../../../docs/development-methodology.md
sources:
  - ../../initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures-retrospective.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Epic 5 — Tray and Place

## Why

Vision, the first whole move. Epic 4 lets a player pick up a tail and land in Composing, but the
tray is static (epic 4 SPEC F2): no arranging, no free letters, no target choice, no animation, so
a word can be validated only in its dropped order and confirmed only on the default cell. This
epic builds spine Proposed epics row 5 (= epic 4 SPEC Non-goals, first bullet): the working tray
and Place screen, FLIP and fly-to-cell (AD-14), tray growth (AD-11) and the winning-animation
input guard, so a full move from pick-up to commit plays on a phone with no drag ever required.
It also closes the epic 4 retrospective's epic 5 items (A5, A6, A9, F40 revisit, L1–L3) and the
epic 3 carry-ins C-UI1 and C-E56. `docs/game-flow-spec.md` is the rule text, the spine the shape,
DESIGN.md and EXPERIENCE.md the look and behaviour; none is reopened.

## Capabilities

In build order; each depends on those above it unless noted. `rule-coverage.md` maps every (UI)
sentence and spine behaviour this epic proves to its capability and test kind; `build-notes.md`
holds the how, the as-built facts and the close-out edits. The **tile count** is, in Composing,
S + F + the D mirrors; in Place, the strip tiles (CAP-1 mode, CAP-6 caret, CAP-9 rows).

- **CAP-1** Tray render (R-32, R-33, R-36, R-50, R-52, R-80; DESIGN.md Tray band, Tile, Placement strip; replaces F2)
  - **intent:** The tray shows the live word, the tiles with every tag, the locked destination
    block and the control row in each phase, in the DESIGN.md look.
  - **success:** first, the engine view gains `draft.wordCards` (AD-3, amended 2026-10-08) with
    `R-30` engine unit tests (side left and right, a `QU` card, Place keeps word order); `Tray.svelte` renders by phase:
    Composing — the word line (`draft.wordCards` through `faces`, uppercased, `QU` as `QU`, cards
    in `draft.destination` underlined blue, 20 px shrinking to 14 px), the tiles in
    R-30 order (`trayOrder`), the destination block joined edge to edge with one blue outline and
    lock per row segment, free-letter tiles with their cell tag (compact tiles: tag top-left, `↩`
    in the ×2 corner, bottom-right on a `QU` tile, DESIGN.md Tile), the control row with the
    D-block controls `[−] k [+] [⇄ Flip]` (CAP-2) left and `5 letters` / `1 letter` right
    (`draft.letterCount`, `QU` = 2);
    Place — the word line holding the validated word in word order (unchanged by strip reorders,
    no D underline),
    the strip in `placementOrder` with D cards as normal tiles, `bottom` tag on the first tile,
    `top` tag and orange `★` on the last, free-letter origin tag top-left on full-height tiles
    (A-D10), the compact corner map (`▼`/`★` top-left, ×2 top-right, origin tag bottom-left), and
    the meta `6 letters → cell 6 · +30` from `place.scoreDelta` (`+n`, `±0`, U+2212 `−n`);
    Idle and Game over — word line, tile rows and control row empty (the pending-draft line is epic 6);
    the invalid-word line (`✕`, error colour) replaces the word line while `feedback.rejectedWord`
    is set (shrinking to 14 px, then ellipsizing the word part); card mode while the tile count
    fits one row, else compact 44 px rows (DESIGN.md Tile);
    `{#each}` blocks key live and mirror copies apart (A9 4.3-m3) and the ×2 badge keeps its
    18 × 12 px corner on block tiles (A9 4.3-m4); P5 asserts the word line text, tags, meta and
    letter count on `session-composing`, `session-place` and
    `session-place-free-letter-redo-tail` (and its Composing after one Undo), a free-letter
    origin tag from a cell other than 3 (`session-place-compact`'s `QU` free letter, or the Assumptions fallback fixture's; cell lookup by `cell` field, build-notes CAP-1), the compact strip
    corner map on `session-place-compact` and the Composing compact marks (the `QU` free-letter
    tile's tag included; its `↩` is CAP-4's P5, since CAP-1 cannot tap-select) after one Undo from it (epic 4 D19, Assumptions),
    with its D block crossing the row break there shown as two outlined segments with two locks,
    and AD-14's 52 live elements in every phase; UI Vitest `AD-3` on `text.ts` `placeMeta` and
    `letters` (`+n`, `±0`, U+2212 `−n`, n = 1);
    screenshot baselines regenerated in the container.

- **CAP-2** D-block controls, Validate and Confirm states (R-30, R-31, R-38; Q-23)
  - **intent:** A player can change k and the side from buttons and always sees why Validate is
    unavailable.
  - **success:** `−`/`+` (44 × 44 secondary circles, the count `k` between them) dispatch `setDestinationCount` k ∓ 1 and are
    disabled at a bound (`canDecK`/`canIncK`, a press there dispatches nothing); `⇄ Flip`
    dispatches `flip` while `canFlip`; on an empty destination column (k = 0) none is rendered and
    the caption `Empty column: no cards join the word` (single line, ellipsizing before the letter
    count) takes their place; Validate follows EXPERIENCE.md Validate (enabled iff `canValidate`
    and the dictionary is loaded; label precedence `Word list unavailable` > `Loading words…` >
    `Need 3+ letters`), each click dispatches at most one `validate` (F15), a double tap per F21
    (P5 on `session-composing`, whose word is valid (`session-place` is its Validate): after the
    dictionary is loaded (Validate label `Validate`, enabled), a double tap on `primary-action` commits the move on the pre-selected target cell 3: the stored
    Session's last move committed at cell 3, and the storage-spy writes
    (`__wordcellStorageWrites`) show the Place write then the commit write; no new fixture);
    a failed Validate shows the invalid-word line until the next edit, Undo, Redo or a successful
    Validate, with the draft and Redo unchanged (R-38, R-71); Confirm is enabled throughout Place;
    the primary label shrinks to the ui-label size before it ellipsizes (A9 4.2-m1); every button
    goes through `act()` (the tile-selection clear before acting is CAP-4's); P5 by `current()` and
    the stored Session (each edit saved before the next action, R-73); taps on a disabled control
    go by a coordinate tap (move the private `tapAt` copies in `e2e/column-phases.spec.ts`,
    `e2e/drag-interruptions.spec.ts`, `e2e/tap.spec.ts` and `e2e/wordcell-view.spec.ts` into
    `e2e/helpers/` with a `helpers.spec.ts` test, each spec importing it) or `click({ force: true })`.

- **CAP-3** Controller seams (retrospective A6, F14; no behaviour change)
  - **intent:** The pointer controller is split along its seams before tile gestures are added,
    so new gesture code lands in focused modules.
  - **success:** `src/ui/gestures/controller.ts` keeps the press machine; the visible band and
    clip, the desktop hover peek and the fly-back move to their own `gestures/` modules behind the
    existing `deps` pattern (the hover-peek timer and suppress logic moved out of `controller.ts`
    goes to `gestures/hover-peek-timer.ts`; `src/ui/hover-peek.ts` stays as the render helpers);
    one lookup helper replaces every cell/column lookup with its own
    throw (build-notes list: `controller.ts`, `intent.ts`, `HoverPeek.svelte`, `WordCellView.svelte`, the CAP-1 tray tag lookup),
    taking the caller's message so every existing throw string stays unchanged; one
    shared module exports the class names `controller.ts` and `Column.svelte`/`HoverPeek.svelte`
    share; the per-ticket "Entry N" header paragraphs (controller and the other `src/ui` files) are
    replaced by a behaviour summary; every existing test passes with at most import and harness
    path edits; `npm run test:all` and `npm run test:screens` green with no baseline change.

- **CAP-4** Tile tap: selection, swap and removal (R-33, R-34, R-35, R-51, R-71, R-73; A-E11) — needs CAP-3
  - **intent:** A player can arrange the tray and the strip, and return a free letter, with taps
    only.
  - **success:** a tap on a movable tile (S or free letter) or a strip tile selects it (teal
    outline, face lifted 4 px, slot unchanged, F2); a tap on another movable or strip tile swaps the two
    (`arrange` / `setPlacementOrder`, one dispatch) and ends the selection; a second tap on a
    selected source tile deselects; on a selected free-letter tile in Composing (which shows `↩`)
    it dispatches `removeFreeLetter`, reactivating the cell with the rest of M in order (Q-31); a
    second tap on any selected strip tile only deselects (no `↩` in Place); a swap of two
    same-letter cards is an edit (invalid line and redo data cleared; `session-won` + two Undos,
    Composing of its last move, cards 38 and 37 both `R`); the selection is kept by
    taps on the destination block, a used or empty WordCell in Composing and a not-legal WordCell
    in Place, and cleared by every other tap and by any enabled control before it acts (F1, F13;
    `act()` clears it before the handler, AD-4);
    taps on a disabled control (`−`/`+` at a bound, disabled Validate), a label (letter count),
    the tray band background or the top bar clear it through the controller's root tap path
    (epic 4 F25; a disabled button fires no click, so `act()` never runs); a drag crossing 8 px from
    any target with no drag behaviour and ending in `pointerup` acts on the selection as its tap
    would (a press ended by `pointercancel`/`lostpointercapture` keeps it however far it moved,
    F1), except that a drag
    from a legal non-current Place cell dispatches nothing and clears it (F18 covers only tile,
    strip-tile and free-letter drags); it pushes no history entry and back ignores it; P5 per path
    on `session-composing`, `session-place`, and `session-place-free-letter-redo-tail` with one
    Undo, incl. a tap on the disabled `−` at k = 1 with a tile selected (a coordinate tap, CAP-2,
    or `click({ force: true })`) and an enabled control
    (`+`, Validate, Undo) pressed with a tile selected, `↩` after a tap selects the `QU`
    free-letter tile on `session-place-compact` after one Undo (or the Assumptions fallback
    fixture; moved from CAP-1), and a reload in
    Composing with a free letter after a tap-swap (same tray and tags; a tile selected before the
    reload is not selected after, R-73); UI Vitest `AD-12` for the
    pure tile-tap intent and one inert-target drag; UI Vitest `AD-12`: a move ≥ 8 px then
    `pointercancel` on the tray background keeps the tile selection.

- **CAP-5** Tile drag and `insertionIndex` (R-34, R-51; AD-12) — needs CAP-4
  - **intent:** A player can reorder the tray and the strip by dragging a tile to a gap.
  - **success:** a tile press that crosses 8 px drags the tile (transform on its face, no Svelte
    state until release, F12 of epic 4); the tray band, clipped to the visible band (F4), is the
    single drop target, accepted at ≥ 25 % of the dragged face's area; while accepted the other
    movable tiles part (always, F16) to the gap chosen by the pure
    `insertionIndex(dragged, gapRects)` in `targeting.ts` (F3) over `duration('parting')` (snap
    under reduced motion): the origin slot collapses and the movable tiles between it and the gap
    shift one slot pitch in reading order (across a row break to the adjacent row's first/last
    slot), from the resting slot rects; D-block mirrors never move; the parting opening is the gap's only
    mark (nothing is drawn at the gap rect; gap rects are hit-test only); under 25 % every tile rests with the origin slot open; release
    over an accepted gap
    dispatches one `arrange` / `setPlacementOrder` iff the order changes by card; under 25 % or
    with no order change it returns with no edit (never a removal), flying back by the epic 4 `flyBack`; the F17 landing
    glides on an edit are CAP-8's; platform cancel
    flies it back, a back leaves the app (bare-Board rule) and hide, like `act()`, settles it at
    once (F5); UI Vitest `AD-12` for
    `insertionIndex` (single row, two compact rows, block at either end, ends of M, ties, a drag
    right by one (centre past the neighbour's centre), a drag to the far end, the Place strip with
    D cards movable) and the parting offsets across a row break and for a drag right by two; UI Vitest `AD-12`: a tile drag
    cancelled by `pointercancel` with a tile selected ends with nothing selected (F18); P5
    drag-reorder in the tray and the strip, a release under 25 % with the stored Session
    byte-identical, a free-letter tile (not a source tile) dragged out of the tray and released
    there (not removed, its WordCell still used; R-33), a block-mirror drag (no dispatch, tile
    selection kept), a tile dragged past the block landing at the M end, `hidePage` mid-drag (no
    dispatch), and a back mid-drag (`page.goBack()` leaving the app, the stored Session equal to
    the pre-drag one apart from `activeMs` (the epic 4 `activeMs: 0` comparison,
    `e2e/drag-interruptions.spec.ts:95-109`), read after a `page.goForward()` that restores the app (default), or through
    `page.context().storageState()` after the back (alternative, `unverified` on Playwright 1.63)).

- **CAP-6** Free letters from WordCells (R-33, R-41, Q-31; A-E12) — needs CAP-5
  - **intent:** A player can add a WordCell's top card to the word by tap or by dragging it to a
    position.
  - **success:** in Composing a tap on a cell with `canAddFreeLetter` dispatches `addFreeLetter`
    (appended); on a used or empty cell it dispatches nothing and keeps a tile selection; a drag
    from an available top card (crossing 8 px before the 400 ms long-press) leaves a 1 px dashed
    ghost in the cell (the card beneath not revealed, R-61) and inserts at the `insertionIndex` gap
    when released over the tray at ≥ 25 % (`addFreeLetter { cell, index }`), the cell taking the
    used state only then; while accepted and the layout has room the tiles after the gap part per DESIGN.md
    Tray band parting geometry (no origin slot; the D-block mirrors shift too when the block is on
    the right, the one AD-14 mirror-motion exception; while parted, the mirrors' segment ends and
    lock placement derive from their parted slots, so every row segment stays closed with its own
    lock); while it is full (the tile count after the
    drop exceeds `perRow` × the rows the Tray currently renders, CAP-9) no
    tile moves and a 3 px teal caret marks the
    gap (DESIGN.md Tray band, F16), and when an accepted gap would move no tile (the end gap of M
    when the block is on the left or k = 0) the same caret marks that gap; released otherwise nothing is dispatched; a used or empty cell's
    drag and every WordCell drag outside Composing are inert; P5
    tap-add, drag-insert at an inner gap, caret case (full layout, and the end gap of M with the
    block on the left), inert cases by stored Session, a long-press peek with a tile selected (no
    dispatch, selection kept), and a
    free-letter drag released outside the tray band or under 25 % over it (stored Session byte-identical, the cell
    not used; epic Done when 3); UI Vitest `AD-12` for the free-letter parting offsets with the
    block on the right across a row break (the mirrors' segment ends and locks from their parted
    slots).

- **CAP-7** Place: target, order and Confirm (R-39, R-40, R-41, R-42, R-51, R-60, R-61, R-62, R-73, R-80; Q-02, Q-22)
  - **intent:** A player can choose the target cell and the order and commit the word.
  - **success:** legal cells ringed, not-legal faded, the stored target pre-selected (R-42); a tap
    on a cell with `canSetTarget` dispatches `setTarget` and keeps the order (R-51); a long-press
    (≥ 400 ms) on an empty WordCell is a tap on release on the cell where the press started,
    wherever released (Place: `setTarget` when `canSetTarget`;
    Composing: no dispatch, tile selection kept); the long-press timer wins once it fires (a
    release after moving is still that tap) and the 8 px drag wins before it; a used cell stays a legal target (R-41, Q-02);
    a not-legal cell tap dispatches nothing and keeps a tile selection; a tap on the current
    target dispatches nothing (`canSetTarget` false) and clears the tile selection (F13); columns stay inert and WordCells respond only
    to target taps and viewing (R-39); Confirm commits (R-60): the word lands bottom → top in the
    chosen order, the score changes by the previewed delta; a free letter's cell other than the
    target shows its next card (R-61); a free letter's cell that is the target has the strip's
    last card on top (R-52); a commit that empties every column enters Game over (R-62; the end
    sheet is epic 6); P5 on `session-place`, `session-place-free-letter-redo-tail`, retargets on
    `session-won` + one Undo (Place of its last move: 6 letters, target 6, legal 3–6, cells 3–5
    empty; incl. the empty-cell long-press, one released after moving past 8 px after 400 ms, and
    the current-target tap), R-41 and R-61 as two
    tests on the same scripted valid fixture (R-41 retargets to the used cell, R-61 confirms
    elsewhere) whose free letter comes from a cell ≤ L that is not the stored
    target and holds exactly 2 cards (the ticket scripts it under the epic 3 regeneration rule; the
    badge still reads 2 after the free letter is added and before Confirm, and one Confirm shows
    D14's badge change 2 → 1), the
    score from `displayScore`, the commit saved before the next action (R-73), and a reload in
    Place on the scripted free-letter fixture after a retarget and a strip reorder (same strip,
    tags and target, the free letter's cell still showing the used-hatch mirror; a tile selected
    before the reload is not selected after, R-73).

- **CAP-8** FLIP and fly-to-cell (AD-14, AD-10; EXPERIENCE.md Motion) — needs CAP-7
  - **intent:** Every card that changes place between two views moves there visibly, and an
    animation never holds input or state.
  - **success:** one FLIP module (F6) animates the `.face` inside each live element
    (`data-card-id`) from its previous to its next rect after every view change; the wrapper
    (identity, hit rect) is never transformed and sits at its settled rect, so a press mid-animation
    hit-tests the settled layout; every live card whose position relative to its band changed
    animates (container or index, Flip, a k change with the block left, card ↔ compact tile:
    translate only, the face takes its new size at once and glides from the previous rect's
    top-left), a
    pure band shift gets no motion (AD-14, amended 2026-10-08): a card that stays in its band
    inverts from the band-relative delta (the band's own shift jumps, as a pure band shift), a
    card that changes band (column ↔ tray/strip ↔ cell) inverts from its on-screen rect just
    before the re-layout (the captured viewport rect, never shifted by the re-layout's own anchor
    `scrollTop` delta, AD-11, DESIGN.md A-D4) to its viewport rect after the re-layout and the
    anchor delta; the
    kind comes from the command and its `DispatchResult` (F7): the
    drop's tail snap into the tray (`snap`), Undo and Redo (`undoRedo`), a commit by Confirm or by
    Redo (`flyToCell`, 2 × base, 30 ms stagger, bottom card first; each committed card visible
    in flight, hidden on landing if not the top, AD-14; the target cell's previous cards keep
    their pre-commit visibility until the first flying card lands or the animation is finished,
    and when the target is the free letter's own cell its used-state mirror stays drawn until then too),
    other moves per F17 (incl. the landing glide of a tile or free letter dragged in with an edit,
    from its released position; CAP-5 and CAP-6 own only the no-edit `flyBack`);
    durations only from `motion.ts`, the 120 ms fade under reduced motion (fly-to-cell: every card
    at once, no stagger; "the first flying card lands" means the fade's end, EXPERIENCE.md Motion,
    as epic 4's fly-back fade: faces at the settled rect fading opacity 0 → 1; the previous cards
    and the used-state mirror switch then); mirrors never take part in the FLIP glide;
    New game, Replay and restore never animate; each animation is gate-counted (AD-11); a new
    press or an `act()` button completes every running animation and acts on the settled state
    (`flip.finishAll()` joins the controller's `pointerdown` and `cancel()`, which today call only
    `finishFlight()`, F6);
    on a drag release `flip.capture()` runs before the controller clears the drag and parting
    transforms (F7);
    UI Vitest `AD-14` for the command + result → kind table (`drop`, `tapDestinationCard`,
    `setDestinationCount`, `flip`, `arrange`, `addFreeLetter`, `removeFreeLetter`, `validate`,
    `setPlacementOrder`, `setTarget` (no card motion: empty animated set), `confirm`, `undo`,
    `redo`; reduced-motion fly-to-cell, one reduced-motion `snap` case (`flip`) and one `undoRedo`
    case, each asserting the 120 ms opacity fade),
    the coordinate frame (a same-band card with a band shift, e.g. `+` 14 → 15 with the block on
    the left; a band change, including one at 412 × 780 (anchor delta 6 px)),
    the finish-all path (the gate idle at every dispatch) and a dropped face whose first keyframe starts at its released position;
    P5, with Animation
    speed Slow seeded (`prefs-non-default`, 320 ms base), `getAnimations()` read inside the same
    `page.evaluate` that clicks or keys an `act()` button (Validate, Flip, `−`/`+`, Undo, Redo,
    Confirm), and for a pointer-driven action (every controller-classified press: tile, WordCell
    and column taps as well as drags) in a `page.evaluate` run right after the touch end/`mouse.up`
    (the Slow base gives the window): `getAnimations()` on the moving faces for drop,
    Validate, Flip, a k change with the block left (after `⇄ Flip`), tap-add, removal, tap-swap, a tile and a free letter released
    with an edit (the dragged face glides from its released point), a tile and a free letter
    released with no edit (`flyBack`), Undo, Confirm, none on wrappers or mirrors,
    each Confirm-flying card visible (not `visibility: hidden`) during its flight, exactly 52
    `[data-card-id]` elements in the evaluate that reads `getAnimations()` during a Validate glide
    and a Confirm fly-to-cell, Undo
    pressed mid-fly-to-cell acting on the settled layout, and one Confirm under emulated reduced
    motion (fade, no stagger); on Validate and on Undo back to Composing the D faces animate
    from and to the column per AD-14 and their tray-block copies appear or vanish at once (F22).

- **CAP-9** Tray growth wiring (AD-11; DESIGN.md A-D4) — needs CAP-8
  - **intent:** A word longer than two compact rows grows the tray without moving the WordCell
    row.
  - **success:** the tray-row count from `trayLayout(tile count)` feeds the layout module (F10)
    after every completed edit (drop, free-letter add (tap or drag), removal, k change, Undo, Redo, a commit, restore),
    never during a drag; rects are captured before dispatch, the band re-layout (w fixed) is
    applied in the same update as the move, and FLIP measures after it, then plays (AD-11,
    amended 2026-10-08, F24): `flip.capture()` first calls `gate.scrollReset()` (epic 4's
    `src/ui/gestures/gate.ts`), and every dispatch path ends any gesture and finishes running
    animations first (`act()` and key commands → `cancel()`, the controller's `pointerdown`; a
    release dispatches after the controller's `gate.leave()`), so the gate is idle at every move
    (a move is every dispatch, AD-11);
    a move's re-layout that finds the gate busy throws (rule 6, AD-15); there is no interim tray
    render. The anchor `scrollTop` write's effect on a running fling on Android is unverified on
    device and goes to the epic 7 device checks. The Tray's tile mode and row count come from the same row count as the band, so both
    switch together; UI Vitest `AD-11` for a 14 → 15 `+` dispatched within 150 ms of a `scroll`
    (page scroll no longer busy; the 15th tile, the band height and the hit rects change in the
    move's update and the glide starts at once); P5 at 412 × 839 (leftover absorbs the growth) and at 412 × 780 (leftover
    42 px < 48 px: the document scrolls 6 px; `geometry.test.ts`), width 412 so rows per tile
    count hold: the WordCell row's bounding box is unchanged after growth to three compact rows
    (+48 px) by `+` on the long-word fixture and back by `−`, the document scrolls by the
    shortfall when leftover is used up, and on the three-row Place fixture Confirm, Undo, Redo
    each change the rows with the move, the WordCell row unchanged and the flying cards visible; UI Vitest `AD-11` for the row count →
    `bands()` path. Both long-word Sessions are scripted valid fixtures (Assumptions).

- **CAP-10** Winning-animation input guard (AD-14; EXPERIENCE.md Motion) — needs CAP-8
  - **intent:** Input during the winning fly-to-cell can neither start a new game nor open a view,
    while Undo still works.
  - **success:** while the winning commit animation (Confirm, or a Redo that commits the win) runs,
    under both motion settings (the reduced-motion fade included), the `motion.ts` guard holds as
    F8 states it once (install on `finished` `won`, not when `flip.play` starts; listener set;
    open-gesture tracker and consumed gestures; settle, the 300 ms minimum (F23) and backstop;
    Undo pass-through; no hover-peek timer); P5 from
    `session-won` after one Undo (Place
    of the last move), with Animation speed Slow seeded (`prefs-non-default`) and `getAnimations()`
    read as CAP-8's P5 states:
    Confirm then a tap on the target cell 6 during the animation → no view opens, and the same tap
    after the animation settles opens the view; a double tap on
    `primary-action`, the faces' `getAnimations()`
    running before the second tap → Game over, same seed, no New-game Session written (stored
    `seed`, `moves`, `cursor` equal those read right after the Confirm write); separately, an
    untouched win settles, then a New game tap starts a new game (a new seed in `current()` and
    the stored Session); the double tap again under emulated reduced motion and at Fast speed
    (`prefs-fast.json` [ASSUMPTION name], scripted), second tap within 300 ms of the guard install (F8) → same
    seed, no New-game Session (F23); `desktop`: Enter twice on a focused
    Confirm, the faces' `getAnimations()` running before the second Enter → same seed, no
    New-game Session; `desktop`: Enter held on a focused Confirm (repeated `keyboard.down('Enter')`
    calls, `repeat: true` on the later ones, spanning the animation, then `keyboard.up`), at Slow and at
    Normal speed → same seed, no New-game Session; Undo during the animation → back in Place with
    the move un-applied; from `session-won`, Undo then Redo into the win, a tap on cell 6 during
    the animation → no view opens, and after it settles it opens; UI Vitest `AD-14` for the
    long-press, `pointercancel` and natural-settle uninstalls, both guard endings (a `pointerdown`
    after settle in the backstop window uninstalls unconsumed, backstop expiry), a `keydown` after
    settle in the backstop window passing through, the triggering key's repeats and `keyup`
    consumed with the animation still running, a key held through a hide or a window `blur` (including one held before the win) uninstalling the guard,
    the reduced-motion win, the 300 ms minimum (a `pointerdown` after settle but before 300 ms
    consumed, under reduced motion and at Fast), and (injected hover timer) a hover-peek timer pending at install
    cleared, a hover on a cell while the guard is installed starting no peek timer, and starting
    one after uninstall.

- **CAP-11** Refactor sweep: code (retrospective A5, A9; C-UI1, C-E56; L2)
  - **intent:** The epic's code ends with its duplication folded and the carried minors closed.
  - **success:** every row of build-notes Sweep inventory marked code is applied or recorded with
    a reason: the e2e helpers copied between specs live in `e2e/helpers/` with `helpers.spec.ts`
    cases (A5); 4.13-m2 … m5; 4.12-m3 … m6 confirmed (applied in 4.13); `Dialog.svelte` and `BlockingMessage.svelte` share one card style
    (C-UI1); every CSS transition the epic added reads `--wc-base-ms` and honours `--wc-reduced`
    (C-E56); `npm run test:all` and `npm run test:screens` pass.

- **CAP-12** Refactor sweep: paperwork and budget (retrospective A9; AD-17; L2)
  - **intent:** The epic's records match the as-built code and the unit budget is re-measured.
  - **success:** the build-notes Sweep inventory rows marked paperwork are applied (4.13-OM,
    4.13-m1, 4.9f-m5, 4.11-OM; 4.12-OM confirmed, applied in 4.13); the AD-17 warm-cache median of three `npm test` runs after a
    discarded warm-up on a Linux-filesystem checkout and the slowest engine file's watch re-run
    are recorded (over 5 s or 1 s: per-file timings, stop for the owner); the build-notes
    close-out edit list is complete for the retrospective.

## Constraints

- Thin renderer (AD-3): tray, strip and controls read `GameView` (`draft`, `place`, `cells`,
  `can*` flags) plus tile selection and dictionary state; no component computes k bounds,
  legality, the word, letter counts or the score delta.
- One writer (AD-4): every tray, strip and WordCell action reaches the engine through
  `game.dispatch`, at most one command per gesture; UI no-ops are the UI not dispatching, gated by
  a `GameView` flag; an engine throw is a bug.
- Hand-rolled gestures (rule 4, AD-12): tile and free-letter drags use the one pointer
  controller, `transform` on the dragged face, the tray band as single overlap target, Svelte
  state only at release.
- AD-14: one live element per card in every phase and mid-animation; mirrors carry
  `data-mirror-of` only and never take part in the FLIP glide (a D-block mirror carries the drag
  parting shift); animations are presentation only and never gate a
  dispatch or a write. The owner-authorised AD-14 amendment (2026-10-08) governs that one
  mirror-motion exception and supersedes the AGENTS.md Known pitfalls "never animate" wording and
  epic Done when 4 until their edits land (build-notes, due before CAP-5 is ticketed); the
  owner-authorised AD-3 amendment (2026-10-08) supersedes epic Boundaries "No engine change" for
  `draft.wordCards` until its edit lands (build-notes, due before CAP-1 is ticketed).
- Hit rects never move under a finger: band re-layout waits for an active gesture or page
  scroll; a move's re-layout never waits, and a gate still busy at a move is a bug (AD-11, F24);
  a selected tile's lift moves only its face (AD-11, F2).
- Single owners (AGENTS.md Conventions): tile selection in `overlays.svelte.ts`; WAAPI durations
  only from `motion.ts`, CSS transitions on `--wc-base-ms`; player strings only in `text.ts`;
  `data-testid` only for the AGENTS.md list (tiles reuse `card-<CardId>`; controls by role and
  name).
- Fail fast (rule 6): no try/catch in the UI.
- Every tray target ≥ 44 × 44 px (tiles, D-block buttons); board text fixed px (A-D9).
- Test split (AD-17): every `rule-coverage.md` P5 row has a passing `android` Playwright test
  named with its id (`desktop` where the row says so); UI Vitest tests are `AD-n` and never R-id
  coverage; the unit suite stays under the AD-17 budget measured on the Linux filesystem.
- Every ticket's checks include `npm run test:screens` in the container (retrospective L3); a
  ticket that changes an input to a shared rule (e.g. the rects fed to `pickTarget` or
  `insertionIndex`, the gate's busy sources) lists that rule's other consumers in its ticket
  review (L1).
- The size budget (AD-18, 600,000 bytes) holds; no new runtime dependency.
- One engine change: the AD-3 `draft.wordCards` view field (`src/engine/view.ts`, `R-30` unit
  tests, no new exported name, AD-2's list unchanged; CAP-1); the R-02 golden deal literals stay
  byte-identical; no engine or shell source change other than `draft.wordCards`; test, fixture
  and e2e files may change (e.g. S3 `game.svelte.test.ts`, `serialize.test.ts`'s fixture list).

## Non-goals

- Epic 6: menu sheet and button, confirm dialogs, end sheet with its `finished`/`unfinished`
  wiring and deferred open (the guard's pending-open cancel, F8), Statistics, Preferences and How
  to play panels, menu dot, pending-draft line, timer display, keyboard map (digits, arrows,
  `Shift`+arrows, `Space`, `Enter`, `Esc`, `F`, `+`/`-`) with the winning guard's Undo exception
  extended to the Undo key aliases (AD-14, F8), focus moves, screen-reader labels and
  live region, the view sheet and peek open/close transition, AD-13's two-overlay reload case;
  F39 (Undo, Redo, menu and keys close an open WordCell view first, else `overlays.deselect()`
  throws; epic 6 blocker); R4; I-68; retrospective A8 (wheel scroll during a mouse drag,
  hover-peek re-anchor test, hide flush after a bfcache restore, `WordCellRow.svelte` aria-label
  into `text.ts`).
- Epic 7: service worker, `swState()`, `precacheComplete()`, device checks, Q-42's
  service-worker proof, B9 dispatch replay cost, and the A9 rows routed there (4.8-p2a release
  without move, 4.11-m1 long still touch on the scrim, 4.11-m2 wheel over the scrim, 4.11-m3 sheet
  below 320 px).
- Reopening any AD, rule, R-02 literal or DESIGN.md/EXPERIENCE.md decision beyond the
  Upstream amendments below; any engine change beyond `draft.wordCards`.

## Success signal

On `android` from `session-idle-empty-column` (cell 7 holds a top card), a whole move with taps only (tap-select, tap-drop,
tap-add a free letter, tap-swap tiles into a dictionary word with at least two legal target
cells (Assumptions), Validate, tap a legal target other than the pre-selected one,
tap-swap the strip, Confirm) commits the word to the chosen cell in the chosen order with the
previewed score change, every step saved before the next; the same move with the tail drop, the free-letter add and both reorders done by drag (as many
drags as needed to reach the same `arrangement` and `placementOrder`) gives the
same Session apart from `activeMs` (`moves` and `cursor` equal); `npm run test:all` and `npm run test:screens` are green with every P5 row of
`rule-coverage.md` covered.

## Assumptions

- A Composing Session with 14 tiles (two compact rows) that one `+` grows to 15 (three), and a
  Place Session whose strip spans three compact rows, are reachable as scripted valid fixtures
  under the epic 3 regeneration rule (e.g. built from `session-won`'s moves); CAP-9's ticket
  scripts and names them.
- The winning commit is reachable from `session-won` by one Undo (Place of its last move), then
  Confirm (R-70); no new fixture.
- A dictionary word of 4+ letters (at least two legal target cells, so the target tap is a real
  retarget) using cell 7's top card as a free letter is playable by taps from
  `session-idle-empty-column` in one move; the ticket picks it from the generated list, else
  scripts a valid fixture under the epic 3 regeneration rule, and the Success signal and epic Done
  when 2 then name that fixture, flagged for the owner at close-out.
- A valid Place Session with 8–14 strip tiles (two compact rows) whose `QU` card is a free letter
  from a cell other than 3 (so the compact `QU` `↩` case is reachable after one Undo), and whose
  Composing after one Undo has a D block crossing the row break (R-32), is scriptable under the epic 3
  regeneration rule; CAP-1's ticket scripts it as `session-place-compact` (epic 4 D19); if one
  fixture cannot meet both conditions, a second, Composing fixture meets the one it misses (a
  compact `QU` free letter from a cell other than 3, or a D block crossing the row break).
- A capture before `dispatch` gives FLIP the previous rects without a second render
  (build-notes CAP-8).

## Open Questions

Owner questions (functionality or UX). OQ-1…OQ-5 answered 2026-10-08: F17, F19 and F20 record the
owner's answers; F18 and F21 resolve OQ-2 and OQ-5 by reference to EXPERIENCE.md. OQ-6 and OQ-7
answered 2026-10-08 → F22, F23; no question is open.

- **OQ-1 (CAP-6, CAP-8) — answered → F17** EXPERIENCE.md Motion names the tail snap, fly-back, parting, Undo/Redo
  and fly-to-cell, but not the other card moves: tray → strip on Validate, Flip, a k change, a
  tap-add, a removal, a tap-swap, a free letter returning after a drag released outside the tray,
  a tray or strip tile released under 25 % or over an accepted gap with no order change, the
  dragged tile landing in its new gap and a dragged free letter landing in its gap. Proposed: all
  glide by FLIP at 1 × base (the `snap` kind), the free letter and a tile released with no edit
  return like the tail fly-back (`flyBack`, 1 × base), on an edit the dragged tile or free letter
  glides from its released position by FLIP `snap`, and
  reduced motion fades in 120 ms. Effect: at Normal speed every live tile that changes place
  glides in 180 ms; the destination block's copies (mirrors, AD-14) appear at their new place
  without motion.
- **OQ-2 (CAP-4, CAP-5, CAP-6) — answered → F18** A tile, strip-tile or free-letter drag started while a tile is
  selected: EXPERIENCE.md ends the selection on an edit, but a drag that changes nothing is not an
  edit and not a tap. Proposed: the selection clears when the drag crosses the 8 px threshold,
  whatever the drag's outcome. Effect: after any drag the player re-selects before a tap-swap.
- **OQ-3 (F40 revisit) — answered → F19** A drop can land on a long column whose highlighted bottom card is under
  the action bar. Proposed: keep it accepted; epic 5's tray growth moves the columns up, never
  toward the action bar, so it adds no new case. Alternative: draw the highlight on the column's
  visible part. Effect of the default: on short screens a rare drop still shows no lit card.
- **OQ-4 (Done when 6) — answered → F20** Merge and deploy epic 5 on its own. Proposed: yes, like epics 1–4.
  Effect: the live site plays whole moves and a win (New game from the action bar after the win),
  but has no menu, Give up, mid-game New game or Replay, end sheet or statistics until epic 6.
- **OQ-5 (CAP-2, F15) PROPOSED BY REVIEW — answered → F21** A fast double tap on a Validate that succeeds lands
  its second tap on Confirm (same `primary-action` button, always enabled in Place) and commits
  the word to the pre-selected target. Proposed: the literal EXPERIENCE.md reading (taps are
  ignored only until the result renders; a second tap after that confirms), pinned by a P5 test.
  Alternative: ignore primary-button taps for one base duration after the phase change. Effect of
  the default: a quick double tap on Validate validates and commits in one go.
- **OQ-6 (CAP-8, F17, AD-14) PROPOSED BY REVIEW — answered → F22** Under AD-14 a destination (D) card's
  live element in Composing is in its column and its tray-block copy is a mirror that takes no
  part in the glide, so on Validate the destination letters vanish from the tray block and glide
  from the column into the strip, and on Undo back to Composing they glide back up to the column
  while the block copies reappear in the tray with no motion. Should the destination letters
  visibly travel from the column (as AD-14 implies) or appear to glide from their tray-block
  copies? Proposed: as AD-14 implies (from and to the column). Effect of the default: on Validate
  the player sees the destination letters fly from the destination column into the strip while
  their tray-block copies disappear at once.
- **OQ-7 (F8, CAP-10, epic Done when 5, AD-14) PROPOSED BY REVIEW — answered → F23** With reduced motion
  on (and nearly so at Fast speed), the winning fade ends 120 ms after the win, and the guard's
  backstop ends soon after. A normal double tap on Confirm (about 100–250 ms between taps) can
  then land its second tap on New game and start a new game. Done when 5 and AD-14 promise "a
  second tap on the primary action starts no new game" with no speed qualifier, while
  EXPERIENCE.md consumes input only "during the winning commit animation". Should a quick second
  tap right after a short winning animation be blocked from starting a new game, whatever the
  motion setting? Proposed: yes — the guard stays for at least 300 ms after the win whatever the
  speed, and the double-tap test runs under reduced motion and at Fast too. Effect of the
  default: with reduced motion or Fast speed, New game ignores taps for about a third of a second
  after a win.

## Decisions

Technical defaults under the owner's standing rule; none changes functionality, UX or gameplay.
F17, F19, F20, F22 and F23 record the owner's answers and F24 the owner's AD-11 amendment
(2026-10-08); F18 and F21 resolve OQ-2 and OQ-5 by reference to EXPERIENCE.md. Rationale in `build-notes.md`.

| # | Question | Decision |
| --- | --- | --- |
| F1 | Where tile selection lives and when it ends. | `overlays.svelte.ts` beside the tail selection; no history entry (back ignores it, EXPERIENCE.md Information Architecture); `resetForNewSession` clears it (AD-13); it ends on a `DispatchResult` with `changed`, on any `act()` press before its handler (a failed Validate included), a phase change and a completed swap; kept or cleared by taps per EXPERIENCE.md Movable tile; a plain tile selection (no drag) is kept by a press ended by `pointercancel` (e.g. a page pan) and by a hide/show without reload, as epic 4 F24 keeps a tail selection. |
| F2 | Tile press resolution and hit rect. | `data-place` `tray`/`strip` resolve to tile presses (supersedes epic 4 F23's inert tiles; F25's non-pointer `click` keeps tiles as outside for a tail selection, which cannot coexist with tiles); a D-block mirror is a block press (no-op, keeps a tile selection); a tile hit-tests on its full tile pitch both ways (slot wrapper tile width + 4 wide and tile height + 4 tall between rows, epic 4 F26); the 4 px selected-tile lift moves only the face. |
| F3 | `insertionIndex` shape. | Pure `insertionIndex(dragged, gapRects)` in `targeting.ts` (AD-12); `gapRects` is `{ index, rect }[]`, one rect per gap (centred in the gap before tile i, tile height), plus a second rect for a row-break index (end of row r and start of row r+1); a row's start-gap rect sits one half-gap before its first tile; a row's end-gap rect sits one half-gap after its last tile, and has no second rect when no next row exists; distance is Euclidean from the dragged face's centre to the nearest of that index's gap rect centres; ties go to the lower index. Composing: gaps 0…\|M\| of M only, never inside or beyond the destination block. Place: every strip card (S, F, D) is movable; gaps 0…n of `placementOrder`. The index counts gaps over the sequence including the dragged tile (index j); the reorder inserts at i when i ≤ j, else at i − 1; a free-letter drag inserts at i directly (gap in M). Vitest. |
| F4 | The tray band's drop rect under a sticky bar. | Clipped to the visible band like the columns. The spine is silent on clipping the tray band; F4 extends the owner's F34 principle ("what the player sees is what happens") and goes to the owner as a spine AD-12 close-out fold. |
| F5 | Tile and free-letter drag ends. | As epic 4 F13 (the tile selection per F18, never restored): `pointercancel`/`lostpointercapture` fly back with no change; in Composing and Place no history entry exists (EXPERIENCE.md Information Architecture; F2), so a back mid-drag follows the bare-Board rule (leaves the app) and the hide flush's `cancel()` settles the drag at once with no dispatch; `cancel()` from `act()` or before-hide settles at once. |
| F6 | Where FLIP lives. | One UI module (`src/ui/flip.ts`) captures the rects of the `.face` inside each live element before a view change and animates the faces after the move's update and its re-layout (AD-11); the wrappers (identity, hit rect) are never transformed; each animation gate-counted; the controller's `pointerdown` and `cancel()` finish every running animation (CAP-8; generalising the fly-back finish). |
| F7 | Animation kind per transition. | From the command plus its `DispatchResult` and the resulting view phase, never from comparing views or a phase rule decided before dispatch (AD-3): each dispatching caller (ActionBar, TopBar, controller, tray) calls `flip.capture()` (rects only) before `game.dispatch` and `flip.play(command, result)` after; on a drag release the capture runs before the controller clears the drag and parting transforms, so the transformed face rects are the previous rects. Drop → `snap`; Undo/Redo → `undoRedo`; a Redo whose resulting view phase is `idle` is a commit (→ `flyToCell`); `setTarget` → no card motion (empty animated set); Confirm → `flyToCell` with `stagger()`, bottom card first; `finished: 'won'` only installs the CAP-10 guard (both motion settings, the reduced-motion fade included), the kind stays `flyToCell`; every other move per F17. |
| F8 | Winning guard without the end sheet. | The AD-14 guard in `motion.ts` lands now, installed when the Confirm or Redo dispatch returns `finished` `won` (F7): capture-phase listeners on `document` for `pointerdown`, `pointerup`, `pointercancel`, `click`, `keydown`, `keyup`; a consumed event gets `preventDefault` + `stopPropagation`; the first event of a gesture started after install completes the animation and its gesture is consumed; the triggering gesture's remaining events (its repeats, `keyup`, `pointerup`, its `click`) are consumed but never complete it. `motion.ts` keeps an always-installed capture-phase tracker of open gestures (pointerIds down, keys down by `code`); at install every open gesture is marked consumed (the triggering Confirm or Redo press or key among them while it is still open), and every gesture started before settle is consumed too: all their events are consumed (a key: its repeats and its `keyup`), and an expected `click` is consumed if it arrives. Hide (the AD-9 hide path) and window `blur` clear every gesture the tracker holds, consumed or not (`src/main.ts` registers the guard's and tracker's hide-clear through `game.registerBeforeHide`, AD-9, beside the controller's `cancel` and `gate.scrollReset`). Every gesture started within 300 ms of install is consumed, at any speed and motion setting (F23). When no gesture is being consumed, the animation has settled (any path: natural end, `finishAll`, hide) and 300 ms have passed since install, the guard stays only until a backstop of `duration('snap')` (120 ms under reduced motion) after the last consumed gesture's end event (`pointerup`, `pointercancel`, `keyup`, or the hide or `blur` that closed it) expires; the backstop starts at install when no gesture is open; a new `pointerdown` or `keydown` after settle and the 300 ms, in that window, uninstalls the guard and is not consumed. Undo passes through: on an event inside `[data-testid="undo"]` the guard completes the animation, uninstalls and does not stop the event, so the button's own `act()` undoes; the triggering key's repeats and `keyup` stay consumed after that uninstall (by the tracker). Installing the guard clears any pending desktop hover-peek timer, and none starts while it is installed. The pending end-sheet open it cancels is epic 6's wiring; epic 5 proves the WordCell-tap (Confirm and Redo wins), double-Confirm (also under reduced motion and at Fast), Enter-twice, held-Enter (Slow and Normal speed), untouched-settle and Undo cases and both guard endings, epic 6 the menu case and the Undo key aliases (AD-14). |
| F9 | Accessible names of `−`, `+`, `⇄ Flip`. | Their visible text (`−`, `+`, `Flip`, glyph `aria-hidden`); screen-reader labels are epic 6. |
| F10 | Tray-row source. | `trayLayout(tileCount, …).rows` (D-block mirrors counted) feeds `layout.svelte.ts` (replacing `TRAY_ROWS = 1`); band re-layout only, w fixed, through the gate. |
| F11 | Tray copy outside the catalogue. | DESIGN.md's tray strings (letter count, meta, `bottom`/`top`, `Flip`) live in `text.ts`; EXPERIENCE.md's catalogue gains the letter count and the meta at close-out. |
| F12 | Desktop hover on tiles. | None: DESIGN.md Card states list no tile hover (literal reading). |
| F13 | Tile-selection edge taps. | Literal EXPERIENCE.md reading: a tap on the current target dispatches nothing (`canSetTarget` false) and clears the tile selection; a long-press peek keeps it; taps on the destination block keep it. |
| F14 | Sweep shape (L2). | A6 moves forward to CAP-3 so tile code lands in split modules; the rest of the sweep is CAP-11 (code) and CAP-12 (paperwork), two tickets. |
| F15 | Validate "ignored until the result renders". | Each click dispatches at most one `validate`; the synchronous dispatch and render are the guard (no flag). Tests: one click = one dispatch; a double tap's outcome per F21. |
| F16 | Caret vs parting (EXPERIENCE.md Arrange M names the caret for either drag; DESIGN.md Tray band says a reorder always parts). | Follow DESIGN.md: a reorder drag always parts; the caret shows only when a free-letter drop would overflow the current rows, or when an accepted free-letter gap would move no tile (CAP-6). EXPERIENCE.md close-out edit. |
| F17 | OQ-1: card moves EXPERIENCE.md Motion did not name. | Owner: tray → strip on Validate, Flip, a k change, tap-add, removal, tap-swap and a release with an edit all glide at 1 × base (`snap`); a tile or free letter released with no edit glides back like the tail fly-back (`flyBack`, 1 × base); on an edit the dragged one glides from where it was released; reduced motion uses the 120 ms fade. EXPERIENCE.md Motion line added. |
| F18 | OQ-2: a drag started while a tile is selected. | Answered by reference, not an owner question: EXPERIENCE.md Drop targeting step 6 by analogy (a tail selection clears once the drag crosses the threshold): a tile, strip-tile or free-letter drag clears the tile selection at the 8 px threshold, and every end (release, `pointercancel`, `lostpointercapture`, back, `act()`, hide) leaves nothing selected (no restore after a platform interruption). EXPERIENCE.md Movable tile close-out edit. |
| F19 | OQ-3: F40 revisit (a drop on a long column whose highlighted bottom card is under the action bar). | Owner: keep F40 as accepted; no highlight change in epic 5. |
| F20 | OQ-4: merge and deploy epic 5 on its own. | Owner: yes, accepting the no-menu / stuck-game gap until epic 6. |
| F21 | OQ-5: a fast double tap on a Validate that succeeds. | Answered by reference, not an owner question: EXPERIENCE.md "ignored until the result renders"; a fast double tap validates then confirms; the P5 test is CAP-2's. |
| F22 | OQ-6: destination letters on Validate and on Undo back to Composing. | Owner: as AD-14 implies, the D faces glide from and to their destination column; the tray-block copies (mirrors) disappear and reappear at once (CAP-8). |
| F23 | OQ-7: winning guard window. | Owner: the guard lasts at least 300 ms after the win at any speed, reduced motion and Fast included (F8); the double-tap test also runs under reduced motion and at Fast (CAP-10). Spine AD-14 and EXPERIENCE.md Motion amended. |
| F24 | Spine AD-11: a move during page scroll. | Owner-approved amendment: every move (every dispatch, AD-11) clears page-scroll busy first (as `gate.scrollReset` does on hide), so its re-layout and glide are never scroll-deferred; only an active gesture defers, and no dispatch path reaches a move with one active (CAP-9). The change to epic 4's gate wiring is CAP-9's task. DESIGN.md Tray band amended. |
| F25 | Ticket 5.6 code review: a tile dropped past a destination block that wraps onto the next tray row. | Owner (2026-10-09): keep F3's nearest-gap rule, no special case; the drop may land mid-M. CAP-5's "a tile dragged past the block landing at the M end" applies to a block within one row (entry 7's Playwright case); the owner judges the wrapped case in hand once entry 7 wires the drag. Owner hand check (2026-10-09, after 5.7): the wrapped case works as wanted; no change. |
| F26 | Ticket 5.8 code review: a desktop click-add on a WordCell whose hover peek is open. | Owner (2026-10-09): keep as built; the hover peek stays open, updates to show the cell used, and closes when the pointer leaves the cell (EXPERIENCE.md closes the peek only for key commands). No doc change. |
| F27 | Ticket 5.10 ticket review: how a WordCell looks while Undo glides a free letter back into it. | Owner (2026-10-10): plain glide; the cell looks empty while the letter flies home, then the letter lands (Confirm's fly-to-cell, where the cell never looks empty, is unchanged). No doc change. |
| F28 | Ticket 5.11 ticket review: the cell during Confirm's fly-to-cell, and a free letter already in a WordCell. | Owner (2026-10-14): the cell never looks empty: previous top and landed cards stay visible until the last card lands, then all but the top committed card hide together (not per-card hiding at each landing). A free letter already in another WordCell flies to the target cell like the tray letters (rect to rect), not just losing its old copy. |

## Upstream amendments (done 2026-10-08, owner-authorised)

Made with this spec's owner answers; not close-out edits.

- Spine AD-3: `draft.wordCards` (CAP-1).
- Spine AD-11: a move's tray-row change applies in the same update as the move; FLIP measures
  after it; every move first clears page-scroll busy, so only an active gesture defers both the
  re-layout and the glide (F24, CAP-9; DESIGN.md Tray band likewise).
- Spine AD-14 and EXPERIENCE.md Motion: the winning guard lasts at least 300 ms after the win (F23).
- Spine AD-14: the animated set (position relative to the band; no motion for a pure band shift);
  committed cards visible during fly-to-cell; mirrors take no part in the FLIP glide but carry the
  drag parting shift (CAP-6, CAP-8).
- DESIGN.md Tray band: parting geometry for a free-letter drag with room; a move's change applies
  with the move (AD-11). DESIGN.md WordCell: committed cards visible in flight.
- EXPERIENCE.md Motion: the F17 line.
