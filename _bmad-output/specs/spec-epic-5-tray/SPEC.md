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

- **CAP-1** Tray render (R-32, R-33, R-36, R-50, R-52; DESIGN.md Tray band, Tile, Placement strip; replaces F2)
  - **intent:** The tray shows the live word, the tiles with every tag, the locked destination
    block and the control row in each phase, in the DESIGN.md look.
  - **success:** `Tray.svelte` renders by phase: Composing — the word line (live `draft.word`
    uppercased, `QU` as `QU`, D letters underlined blue, 20 px shrinking to 14 px), the tiles in
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
    Idle and Game over — tile rows and control row empty (the pending-draft line is epic 6);
    the invalid-word line (`✕`, error colour) replaces the word line while `feedback.rejectedWord`
    is set (shrinking to 14 px, then ellipsizing the word part); card mode while the tile count
    fits one row, else compact 44 px rows (DESIGN.md Tile);
    `{#each}` blocks key live and mirror copies apart (A9 4.3-m3) and the ×2 badge keeps its
    18 × 12 px corner on block tiles (A9 4.3-m4); P5 asserts the word line text, tags, meta and
    letter count on `session-composing`, `session-place` and
    `session-place-free-letter-redo-tail` (and its Composing after one Undo), the compact strip
    corner map on `session-place-compact` and the Composing compact marks (`QU` included) after
    one Undo from it (epic 4 D19, Assumptions), and AD-14's 52 live elements in every phase;
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
    `Need 3+ letters`), each click dispatches at most one `validate` (F15), a double tap per OQ-5;
    a failed Validate shows the invalid-word line until the next edit, Undo, Redo or a successful
    Validate, with the draft and Redo unchanged (R-38, R-71); Confirm is enabled throughout Place;
    the primary label shrinks to the ui-label size before it ellipsizes (A9 4.2-m1); every button
    goes through `act()` and clears a tile selection before acting (AD-4); P5 by `current()` and
    the stored Session (each edit saved before the next action, R-73).

- **CAP-3** Controller seams (retrospective A6, F9; no behaviour change)
  - **intent:** The pointer controller is split along its seams before tile gestures are added,
    so new gesture code lands in focused modules.
  - **success:** `src/ui/gestures/controller.ts` keeps the press machine; the visible band and
    clip, the desktop hover peek and the fly-back move to their own `gestures/` modules behind the
    existing `deps` pattern; one lookup helper replaces every cell/column lookup with its own
    throw (build-notes list: `controller.ts`, `intent.ts`, `HoverPeek.svelte`, `WordCellView.svelte`); one
    shared module exports the class names `controller.ts` and `Column.svelte`/`HoverPeek.svelte`
    share; the per-ticket "Entry N" header paragraphs (controller and the other `src/ui` files) are
    replaced by a behaviour summary; every existing test passes with at most import and harness
    path edits; `npm run test:all` and `npm run test:screens` green with no baseline change.

- **CAP-4** Tile tap: selection, swap and removal (R-33, R-34, R-35, R-51, R-71; A-E11) — needs CAP-3
  - **intent:** A player can arrange the tray and the strip, and return a free letter, with taps
    only.
  - **success:** a tap on a movable tile (S or free letter) or a strip tile selects it (teal
    outline, face lifted 4 px, slot unchanged, F2); a tap on another movable tile swaps the two
    (`arrange` / `setPlacementOrder`, one dispatch) and ends the selection; a second tap on a
    selected source tile deselects; on a selected free-letter tile in Composing (which shows `↩`)
    it dispatches `removeFreeLetter`, reactivating the cell with the rest of M in order (Q-31); a
    second tap on any selected strip tile only deselects (no `↩` in Place); a swap of two
    same-letter cards is an edit (invalid line and redo data cleared; `session-won` + two Undos,
    Composing of its last move, cards 38 and 37 both `R`); the selection is kept by
    taps on the destination block, a used or empty WordCell in Composing and a not-legal WordCell
    in Place, and cleared by every other tap and by any enabled control before it acts (F1, F13);
    taps on a disabled control (`−`/`+` at a bound, disabled Validate), a label (letter count),
    the tray band background or the top bar clear it through the controller's document-level tap
    path (a disabled button fires no click, so `act()` never runs); a drag crossing 8 px from an
    inert target (block tile, used or empty cell in Composing, any WordCell in Place) acts on the
    selection as that target's tap would (kept where it keeps it; OQ-2 covers only tile,
    strip-tile and free-letter drags); it pushes no history entry and back ignores it; P5 per path
    on `session-composing`, `session-place`, and `session-place-free-letter-redo-tail` with one
    Undo, incl. a tap on the disabled `−` at k = 1 with a tile selected; UI Vitest `AD-12` for the
    pure tile-tap intent and one inert-target drag.

- **CAP-5** Tile drag and `insertionIndex` (R-34, R-51; AD-12) — needs CAP-4
  - **intent:** A player can reorder the tray and the strip by dragging a tile to a gap.
  - **success:** a tile press that crosses 8 px drags the tile (transform on its face, no Svelte
    state until release, F12 of epic 4); the tray band, clipped to the visible band (F4), is the
    single drop target, accepted at ≥ 25 % of the dragged face's area; while accepted the other
    movable tiles part (always, F16) to the gap chosen by the pure
    `insertionIndex(dragged, gapRects)` in `targeting.ts` (F3) over `duration('parting')` (snap
    under reduced motion): the origin slot collapses and the movable tiles between it and the gap
    shift one slot pitch in reading order (across a row break to the adjacent row's first/last
    slot), from the resting slot rects; D-block mirrors never move; the gap draws at the winning
    rect (either row-break rect); under 25 % every tile rests with the origin slot open; release
    over an accepted gap
    dispatches one `arrange` / `setPlacementOrder` iff the order changes by card; under 25 % it
    returns with no edit (never a removal); returns and landings move per OQ-1; platform cancel
    and back fly it back, `act()` and hide settle it at once (F5); UI Vitest `AD-12` for
    `insertionIndex` (single row, two compact rows, block at either end, ends of M, ties, a drag
    right by one (centre past the neighbour's centre), a drag to the far end, the Place strip with
    D cards movable) and the parting offsets across a row break; P5
    drag-reorder in the tray and the strip, a release under 25 % with the stored Session
    byte-identical, and `hidePage` mid-drag (no dispatch).

- **CAP-6** Free letters from WordCells (R-33, R-41, Q-31; A-E12) — needs CAP-5
  - **intent:** A player can add a WordCell's top card to the word by tap or by dragging it to a
    position.
  - **success:** in Composing a tap on a cell with `canAddFreeLetter` dispatches `addFreeLetter`
    (appended); on a used or empty cell it dispatches nothing and keeps a tile selection; a drag
    from an available top card (crossing 8 px before the 400 ms long-press) leaves a 1 px dashed
    ghost in the cell (the card beneath not revealed, R-61) and inserts at the `insertionIndex` gap
    when released over the tray at ≥ 25 % (`addFreeLetter { cell, index }`), the cell taking the
    used state only then; while the layout is full (the tile count after the drop exceeds the
    current rows) no tile moves and a 3 px teal caret marks the
    gap (DESIGN.md Tray band, F16); released otherwise nothing is dispatched; a used or empty cell's
    drag and every WordCell drag outside Composing are inert; the long-press peek still works; P5
    tap-add, drag-insert at an inner gap, caret case, inert cases by stored Session, and a
    free-letter drag released under 25 % over the tray (stored Session byte-identical, the cell
    not used; epic Done when 3).

- **CAP-7** Place: target, order and Confirm (R-39, R-40, R-41, R-42, R-51, R-60, R-61, R-62; Q-02, Q-22)
  - **intent:** A player can choose the target cell and the order and commit the word.
  - **success:** legal cells ringed, not-legal faded, the stored target pre-selected (R-42); a tap
    on a cell with `canSetTarget` dispatches `setTarget` and keeps the order (R-51); a long-press
    (≥ 400 ms) on an empty WordCell is a tap on release (Place: `setTarget` when `canSetTarget`;
    Composing: no dispatch, tile selection kept); a used cell stays a legal target (R-41, Q-02);
    a not-legal cell tap dispatches nothing and keeps a tile selection; a tap on the current
    target dispatches nothing (`canSetTarget` false) and clears the tile selection (F13); columns stay inert and WordCells respond only
    to target taps and viewing (R-39); Confirm commits (R-60): the word lands bottom → top in the
    chosen order, the score changes by the previewed delta; a free letter's cell other than the
    target shows its next card (R-61); a free letter's cell that is the target has the strip's
    last card on top (R-52); a commit that empties every column enters Game over (R-62; the end
    sheet is epic 6); P5 on `session-place`, `session-place-free-letter-redo-tail`, retargets on
    `session-won` + one Undo (Place of its last move: 6 letters, target 6, legal 3–6, cells 3–5
    empty; incl. the empty-cell long-press and the current-target tap), R-41/R-61
    on a scripted valid fixture whose free letter comes from a cell ≤ L that is not the stored
    target and holds exactly 2 cards (the ticket scripts it under the epic 3 regeneration rule; one
    Confirm shows D14's badge change 2 → 1), the
    score from `displayScore`, and the commit saved before the next action (R-73).

- **CAP-8** FLIP and fly-to-cell (AD-14, AD-10; EXPERIENCE.md Motion) — needs CAP-7
  - **intent:** Every card that changes place between two views moves there visibly, and an
    animation never holds input or state.
  - **success:** one FLIP module (F6) animates the `.face` inside each live element
    (`data-card-id`) from its previous to its next rect after every view change; the wrapper
    (identity, hit rect) is never transformed and sits at its settled rect, so a press mid-animation
    hit-tests the settled layout; only cards whose container (`data-place` column, cell, tray,
    strip) or index within it changed animate, so a pure band shift applies without motion; the
    kind comes from the command and its `DispatchResult` (F7): the
    drop's tail snap into the tray (`snap`), Undo and Redo (`undoRedo`), a commit by Confirm or by
    Redo (`flyToCell`, 2 × base, 30 ms stagger, bottom card first), other moves per OQ-1;
    durations only from `motion.ts`, the 120 ms fade under reduced motion (fly-to-cell: every card
    at once, no stagger); mirrors never animate;
    New game, Replay and restore never animate; each animation is gate-counted (AD-11); a new
    press or an `act()` button completes every running animation and acts on the settled state;
    UI Vitest `AD-14` for the command + result → kind table (reduced-motion fly-to-cell included)
    and the finish-all path; P5 `getAnimations()`
    on the moving faces for drop, Validate, Undo, Confirm, none on wrappers or mirrors, and Undo
    pressed mid-fly-to-cell acting on the settled layout.

- **CAP-9** Tray growth wiring (AD-11; DESIGN.md A-D4) — needs CAP-8
  - **intent:** A word longer than two compact rows grows the tray without moving the WordCell
    row.
  - **success:** the tray-row count from `trayLayout(tile count)` feeds the layout module (F10)
    after every completed edit (drop, tap-add, removal, k change, Undo, Redo, a commit after its
    fly-to-cell settles, restore), never during a drag; rects are captured before dispatch, the
    band re-layout (w fixed) is queued through `gate.whenIdle` (AD-11) and `flip.play` runs right
    after that re-layout frame, so FLIP targets the final rects; mid-drag it waits for release;
    every commit (Confirm, or a Redo that commits) defers the tray-row change until its
    fly-to-cell settles (DESIGN.md A-D4), and a fly finished by a press applies it when that
    gesture ends; P5 at 412 × 839 and at
    412 × 780 (leftover 42 px, below the growth; `geometry.test.ts`), width 412 so rows per tile
    count hold: the WordCell row's bounding box is unchanged after growth to three compact rows
    (+48 px) by `+` on the long-word fixture and back by `−`, the document scrolls by the
    shortfall when leftover is used up, and on the three-row Place fixture Confirm, Undo, Redo
    changes the rows only after the Redo's fly settles; UI Vitest `AD-11` for the row count →
    `bands()` path. Both long-word Sessions are scripted valid fixtures (Assumptions).

- **CAP-10** Winning-animation input guard (AD-14; EXPERIENCE.md Motion) — needs CAP-8
  - **intent:** Input during the winning fly-to-cell can neither start a new game nor open a view,
    while Undo still works.
  - **success:** while the winning commit animation (Confirm, or a Redo that commits the win) runs,
    `motion.ts` holds one capture-phase `pointerdown`/`click`/`keydown` listener on `document`
    that completes the animation and consumes the event (`preventDefault` + `stopPropagation`),
    then consumes only that pointer's `pointerup`/`pointercancel` plus a `click` in the same or
    the next task (for a key: its `keyup` and the synthesized `click`) and always uninstalls; it
    also uninstalls when the animation settles by any path (natural end, `finishAll`, hide) unless
    mid-way through consuming a gesture; on an event
    inside `[data-testid="undo"]` it completes the animation, uninstalls and does not stop the
    event, so the button's own `act()` undoes (F8); P5 from `session-won` after one Undo (Place
    of the last move): Confirm then a WordCell tap during the animation → no view opens; with
    Animation speed Slow seeded, a double tap on `primary-action`, the faces' `getAnimations()`
    running before the second tap → Game over, same seed, no New-game Session written (stored
    `seed`, `moves`, `cursor` equal those read right after the Confirm write); the win settles
    untouched, then New game dispatches; `desktop`: Enter twice on a focused Confirm → same seed,
    no New-game Session; Undo during the animation → back in Place with the move un-applied; from
    `session-won`, Undo then Redo into the win, a WordCell tap during the animation → no view
    opens; UI Vitest `AD-14` for the long-press, `pointercancel` and natural-settle uninstalls.

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
  `data-mirror-of` only and never animate; animations are presentation only and never gate a
  dispatch or a write.
- Hit rects never move under a finger: tray growth and band re-layout run only through the gate;
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
- No engine change; the R-02 golden deal literals stay byte-identical. Test-only edits outside
  `src/ui/` are allowed (S3 `game.svelte.test.ts`; `serialize.test.ts`'s fixture list); no
  engine or shell source change.

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
- Reopening any AD, rule, R-02 literal or DESIGN.md/EXPERIENCE.md decision; any engine change.

## Success signal

On `android` from `session-idle-empty-column` (cell 7 holds a top card), a whole move with taps only (tap-select, tap-drop,
tap-add a free letter, tap-swap tiles into a dictionary word, Validate, tap a legal target,
tap-swap the strip, Confirm) commits the word to the chosen cell in the chosen order with the
previewed score change, every step saved before the next; the same move by drag gives the same
Session apart from `activeMs` (`moves` and `cursor` equal); `npm run test:all` and `npm run test:screens` are green with every P5 row of
`rule-coverage.md` covered.

## Assumptions

- A Composing Session with 14 tiles (two compact rows) that one `+` grows to 15 (three), and a
  Place Session whose strip spans three compact rows, are reachable as scripted valid fixtures
  under the epic 3 regeneration rule (e.g. built from `session-won`'s moves); CAP-9's ticket
  scripts and names them.
- The winning commit is reachable from `session-won` by one Undo (Place of its last move), then
  Confirm (R-70); no new fixture.
- A dictionary word using cell 7's top card as a free letter is playable by taps from
  `session-idle-empty-column` in one move; the ticket picks it from the generated list, else
  scripts a valid fixture under the epic 3 regeneration rule, and the Success signal and epic Done
  when 2 then name that fixture, flagged for the owner at close-out.
- A valid Place Session with ≥ 8 strip tiles (two compact rows) including a `QU` card and a free
  letter is scriptable under the epic 3 regeneration rule; CAP-1's ticket scripts it as
  `session-place-compact` (epic 4 D19).
- A capture before `dispatch` gives FLIP the previous rects without a second render
  (build-notes CAP-8).

## Open Questions

Owner questions (functionality or UX); each has a proposed default and its practical effect. The
build may start on CAP-1 to CAP-3 before they are answered; the rest waits on the named one.

- **OQ-1 (CAP-6, CAP-8)** EXPERIENCE.md Motion names the tail snap, fly-back, parting, Undo/Redo
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
- **OQ-2 (CAP-4, CAP-5, CAP-6)** A tile, strip-tile or free-letter drag started while a tile is
  selected: EXPERIENCE.md ends the selection on an edit, but a drag that changes nothing is not an
  edit and not a tap. Proposed: the selection clears when the drag crosses the 8 px threshold,
  whatever the drag's outcome. Effect: after any drag the player re-selects before a tap-swap.
- **OQ-3 (F40 revisit)** A drop can land on a long column whose highlighted bottom card is under
  the action bar. Proposed: keep it accepted; epic 5's tray growth moves the columns up, never
  toward the action bar, so it adds no new case. Alternative: draw the highlight on the column's
  visible part. Effect of the default: on short screens a rare drop still shows no lit card.
- **OQ-4 (Done when 6)** Merge and deploy epic 5 on its own. Proposed: yes, like epics 1–4.
  Effect: the live site plays whole moves and a win (New game from the action bar after the win),
  but has no menu, Give up, mid-game New game or Replay, end sheet or statistics until epic 6.
- **OQ-5 (CAP-2, F15) PROPOSED BY REVIEW** A fast double tap on a Validate that succeeds lands
  its second tap on Confirm (same `primary-action` button, always enabled in Place) and commits
  the word to the pre-selected target. Proposed: the literal EXPERIENCE.md reading (taps are
  ignored only until the result renders; a second tap after that confirms), pinned by a P5 test.
  Alternative: ignore primary-button taps for one base duration after the phase change. Effect of
  the default: a quick double tap on Validate validates and commits in one go.

## Decisions

Technical defaults under the owner's standing rule; none changes functionality, UX or gameplay.
Rationale in `build-notes.md`.

| # | Question | Decision |
| --- | --- | --- |
| F1 | Where tile selection lives and when it ends. | `overlays.svelte.ts` beside the tail selection; no history entry (back ignores it, EXPERIENCE.md Information Architecture); `resetForNewSession` clears it (AD-13); it ends on a `DispatchResult` with `changed`, on any `act()` press before its handler (a failed Validate included), a phase change and a completed swap; kept or cleared by taps per EXPERIENCE.md Movable tile. |
| F2 | Tile press resolution and hit rect. | `data-place` `tray`/`strip` resolve to tile presses (supersedes epic 4 F23's inert tiles; F25's non-pointer `click` keeps tiles as outside for a tail selection, which cannot coexist with tiles); a D-block mirror is a block press (no-op, keeps a tile selection); a tile hit-tests on its full tile pitch (slot wrapper, epic 4 F26); the 4 px selected-tile lift moves only the face. |
| F3 | `insertionIndex` shape. | Pure `insertionIndex(dragged, gapRects)` in `targeting.ts` (AD-12); `gapRects` is `{ index, rect }[]`, one rect per gap (centred in the gap before tile i, tile height), plus a second rect for a row-break index (end of row r and start of row r+1); a row's end-gap rect sits one half-gap after its last tile, and has no second rect when no next row exists; distance is Euclidean from the dragged face's centre to the gap rect centre; ties go to the lower index. Composing: gaps 0…\|M\| of M only, never inside or beyond the destination block. Place: every strip card (S, F, D) is movable; gaps 0…n of `placementOrder`. The index counts gaps over the sequence including the dragged tile (index j); the reorder inserts at i when i ≤ j, else at i − 1. Vitest. |
| F4 | The tray band's drop rect under a sticky bar. | Clipped to the visible band like the columns. The spine is silent on clipping the tray band; F4 extends the owner's F34 principle ("what the player sees is what happens") and goes to the owner as a spine AD-12 close-out fold. |
| F5 | Tile and free-letter drag ends. | As epic 4 F13: `pointercancel`/`lostpointercapture`/`cancel({ byBack: true })` fly back with no change; `cancel()` from `act()` or before-hide settles at once. |
| F6 | Where FLIP lives. | One UI module (`src/ui/flip.ts`) captures the rects of the `.face` inside each live element before a view change and animates the faces after the DOM update; the wrappers (identity, hit rect) are never transformed; each animation gate-counted; the controller's `pointerdown` and `cancel()` finish every running animation (generalising the fly-back finish). |
| F7 | Animation kind per transition. | From the command plus its `DispatchResult` and the resulting view phase, never from comparing views or a phase rule decided before dispatch (AD-3): each dispatching caller (ActionBar, TopBar, controller, tray) calls `flip.capture()` (rects only) before `game.dispatch` and `flip.play(command, result)` after. Drop → `snap`; Undo/Redo → `undoRedo`, or `flyToCell` when the Redo's result is a commit; Confirm → `flyToCell` with `stagger()`, bottom card first; the win per `finished`; every other move per OQ-1. |
| F8 | Winning guard without the end sheet. | The AD-14 listener in `motion.ts` lands now; consumed events get `preventDefault` + `stopPropagation`; after the completing event it consumes only that pointer's `pointerup`/`pointercancel` plus a `click` in the same or next task (a key: its `keyup` and synthesized `click`), then always uninstalls; it also uninstalls when the animation settles by any path (natural end, `finishAll`, hide) unless mid-gesture; Undo passes through (complete, uninstall, event not stopped); the pending end-sheet open it cancels is epic 6's wiring; epic 5 proves the WordCell-tap (Confirm and Redo wins), double-Confirm, Enter-twice, untouched-settle and Undo cases, epic 6 the menu case and the Undo key aliases (AD-14). |
| F9 | Accessible names of `−`, `+`, `⇄ Flip`. | Their visible text (`−`, `+`, `Flip`, glyph `aria-hidden`); screen-reader labels are epic 6. |
| F10 | Tray-row source. | `trayLayout(tileCount, …).rows` (D-block mirrors counted) feeds `layout.svelte.ts` (replacing `TRAY_ROWS = 1`); band re-layout only, w fixed, through the gate. |
| F11 | Tray copy outside the catalogue. | DESIGN.md's tray strings (letter count, meta, `bottom`/`top`, `Flip`) live in `text.ts`; EXPERIENCE.md's catalogue gains the letter count and the meta at close-out. |
| F12 | Desktop hover on tiles. | None: DESIGN.md Card states list no tile hover (literal reading). |
| F13 | Tile-selection edge taps. | Literal EXPERIENCE.md reading: a tap on the current target dispatches nothing (`canSetTarget` false) and clears the tile selection; a long-press peek keeps it; taps on the destination block keep it. |
| F14 | Sweep shape (L2). | A6 moves forward to CAP-3 so tile code lands in split modules; the rest of the sweep is CAP-11 (code) and CAP-12 (paperwork), two tickets. |
| F15 | Validate "ignored until the result renders". | Each click dispatches at most one `validate`; the synchronous dispatch and render are the guard (no flag). Tests: one click = one dispatch; a double tap's outcome per OQ-5. |
| F16 | Caret vs parting (EXPERIENCE.md Arrange M names the caret for either drag; DESIGN.md Tray band says a reorder always parts). | Follow DESIGN.md: a reorder drag always parts; the caret shows only when a free-letter drop would overflow the current rows. EXPERIENCE.md close-out edit. |
