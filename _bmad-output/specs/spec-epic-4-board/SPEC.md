---
id: SPEC-epic-4-board
companions:
  - rule-coverage.md
  - build-notes.md
  - ../../../docs/game-flow-spec.md
  - ../../planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md
  - ../../../AGENTS.md
  - ../../../docs/development-methodology.md
sources:
  - ../../initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Epic 4 — Board and gestures

## Why

Vision, first playable surface. Epics 2 and 3 give a pure engine and a store that saves, restores
and reports failures, but the player still sees the epic 3 minimal board: no layout, no gestures,
no way to start a move. This epic builds spine Proposed epics row 4: the real Board laid out by
the DESIGN.md height rule in one band-order definition (AD-11), the pointer controller with
overlap targeting (AD-12), tail selection and the end-sheet states on the epic 3 overlays core
(AD-13), and the WordCell view, so that a tail can be picked up by drag or tap and dropped into
Composing on a phone. It also closes the epic 3 retrospective's epic 4 carry-ins (R1, R2/C-E4b,
C-E4a, R6, R7, the AD-17 re-measure). `docs/game-flow-spec.md` is the rule text, the spine the
shape, DESIGN.md and EXPERIENCE.md the look and behaviour; none is reopened.

## Capabilities

In build order; each depends on those above it unless noted. `rule-coverage.md` maps every (UI)
sentence and spine behaviour this epic proves to its capability and test kind; `build-notes.md`
holds the how, the component tree and the spine close-out edits.

- **CAP-1** Layout definition and geometry (AD-11, pure)
  - **intent:** One ordered band list and two pure functions decide card width, band heights and
    the anchored WordCell-row offset for any viewport and band order.
  - **success:** `src/ui/layout/bands.ts` exports `BAND_ORDER`, an ordered list of units, each an
    ordered list of AD-11's eleven band ids in seven units (`topBar`; `banner`; `leftover`;
    `columns`+`footRow`; `trayGap`+`tray`; `labels`+`wordcells`; `actionGap`+`actionBar`; F22),
    `ANCHOR_BAND = 'wordcells'` and `SLACK_BAND = 'leftover'`; `?bands=` names units, and a list
    that is not a permutation of the unit ids throws to AD-15 (rule 6; UI Vitest case);
    `src/ui/layout/geometry.ts` exports `cardWidth(innerWidth,
    innerHeight, insets, hoverFine)` and `bands(w, bandOrder, trayRows, bannerShown, innerHeight,
    insets)`; UI Vitest `AD-11 …` cases pin DESIGN.md's reference numbers (412 × 915 → w 46, H 61,
    strip 44, sum 738, leftover 177; 412 × 839 → leftover 101; 360 × 750 → w 40, sum 722; a
    1080p window with a 950 px viewport → 70 × 93, board 592; 412 × 915 with 24/24 insets → w 46,
    H 61, sum 786, leftover 129; 1280 × 720 → w 40, sum 722 > 720, leftover 0, not negative, and a
    banner there pushes all 44 px away from the anchor with the anchor offset +44 and a matching +44 `scrollTop` delta, and its hide reverses it: anchor offset −44, `scrollTop` delta −44 clamped to the new 0–2 range), the
    40 px floor below 352 px available width, the H > 92 tray term, banner growth taken from
    leftover first then pushed away from the anchor, tray growth (+48/+96 at H ≤ 92, +47/+95 at
    H = 93) in the default order and in one fallback order (WordCells and tray above the
    columns), the w-recompute predicate (an innerHeight-only change under 80 px keeps w; two
    60 px shrinks measured against the last w computation recompute), and an innerHeight-only
    change under 80 px with w fixed (F21; anchor offset = top of the WordCell row): 412 × 839 →
    412 × 779 at w 46: leftover 101 → 41, anchor offset 710 → 650, delta −60 clamped to 0 at
    `scrollTop` 0, scroll range 0; 412 × 780 → 412 × 710: leftover 42 → 0, anchor offset 651 →
    609, delta −42 clamped to 0, `scrollTop` stays 0, scroll range 0 → 28.

- **CAP-2** Board render: cards, columns, WordCells and the static tray (AD-3, AD-14, F1, F2)
  - **intent:** The Board renders every state `GameView` exposes, with one live element per card,
    in the DESIGN.md look, replacing the epic 3 minimal board.
  - **success:** `Board.svelte` renders by iterating `BAND_ORDER` (no component names a
    neighbour band); columns are fanned (strip `max(44, round(0.72 H))`, glyph in the top 72 %,
    the flourish, the `QU` ×2 badge), an empty column shows the placeholder slot, each column has
    its 44 px foot pad (`foot-<n>`; on `desktop` it shows the column number while nothing is
    selected) and a whole-slot hit rect (`column-<n>`); every live card and WordCell element spans
    its full slot pitch, its face `pointer-events: none` (F26); the WordCell row
    shows labels 3–10 above, the top card or the empty outline, the count badge at 2+ cards, and
    the used, legal, selected-target (check chip) and not-legal states; Composing shows S ghosts
    and D cards in destination style, Place shows S and D ghosts; the static tray (F2) holds the
    live S and free-letter tiles (`data-place="tray"`) and the D-block mirrors in Composing and
    the live strip tiles (`data-place="strip"`) in Place, in one card-height row or two clipped
    compact rows (F2); Playwright proves, for each of the
    Idle, Composing, Place and Game-over fixtures (Game over: `session-won` and
    `session-gave-up`), exactly 52 elements with `data-card-id`, each
    id once, `data-place` per AD-14, mirrors carrying `data-mirror-of` and no `data-card-id` or
    `data-testid`, and the board letters read from the DOM (C-E4a: every column of
    `session-idle-fresh` top→bottom equals a literal letter list); the visible heading and Seed
    line are gone (F4); screenshot baselines for the four phases on `android` and `desktop` are
    regenerated in the container.

- **CAP-3** Bars and live layout (AD-11, R-82, F3, F20)
  - **intent:** The top bar, dictionary banner and action bar sit in the band order, card width
    is recomputed only between gestures, and the WordCell row never moves when a band grows.
  - **success:** the sticky top bar holds the reserved 44 px menu slot, `Score <n>` from
    `displayScore` (U+2212 for negatives, tabular numerals) and the Undo/Redo icon buttons
    (`desktop` tooltips show only the accessible name; epic 6 appends the key with the keyboard map, EXPERIENCE.md); the
    banner is sticky under it; the sticky action bar holds `primary-action` (epic 3's labels and
    enablement); `src/ui/layout/` reads insets from an `env(safe-area-inset-*)` probe, recomputes w
    only per CAP-1's predicate on `resize`/`orientationchange` or a `hoverFine` media-query change, re-lays bands on banner show/hide
    and innerHeight-only changes under 80 px and after a w recompute, and applies the anchor
    `scrollTop` delta in the same frame (clamped to the scroll range, F21); `src/ui/gestures/gate.ts` defers both until no gesture, animation or page scroll is
    active (scroll busy from the first `scroll` until `scrollend`, hide/pagehide, or 150 ms
    without `scroll`), then runs them in the next idle `requestAnimationFrame`; cards, tiles and
    WordCells have `touch-action: none` and the DESIGN.md non-card regions `pan-y`, the labels band included (`pan-x pan-y`
    when the board is wider than the available width; the foot row only while no tail is
    selected, `none` while one is); the WordCell view sheet and its mirror
    cards (`data-mirror-of`, never draggable) are a non-card region, `pan-y` (CAP-9); cards, tiles,
    WordCells (badge included), the cell-number labels, foot pads and the view sheet carry `user-select: none`
    and `-webkit-touch-callout: none`, so native long-press handling never cancels the 400 ms peek
    (CAP-4 `contextmenu`); `?bands=<list>` reorders bands in dev and
    is ignored in the production build (`dist/`, checked by `dist-smoke`); Playwright measures (F11): card and slot sizes at the
    Pixel 7 profile, the banner taking leftover first, the WordCell row's bounding box unchanged
    when the banner shows at a viewport with leftover under 44 px, a banner shown during a scroll
    applied only after it ends (412 × 600: w 40, sum 722, scroll range 122 px; one held
    `touchHold` pan from a `pan-y` region (a foot pad with nothing selected; leftover is 0 there),
    small `moveTo` steps about every 50 ms with the finger down through the route failure and the
    check, no banner while `scroll` events keep arriving under 150 ms apart, then the banner within
    a frame after `scrollend` or 150 ms quiet (AD-11 backstop); that a CDP touch pan from a
    `pan-y` foot pad scrolls the document (the ticket checks `scrollY` changes between steps) and
    fires no `scrollend` before release is `unverified`), and the top-bar score on Idle,
    `session-place`, `session-won` and `session-gave-up` (negative, U+2212) and after a Redo
    across a commit.

- **CAP-4** Pointer controller core and cancel wiring (AD-12, AD-9, AD-13, AD-16; R1, R2, C-E4b)
  - **intent:** One pointer controller owns every gesture on cards, columns and WordCells, and
    every command, dialog action, back and hide first cancels a gesture in progress.
  - **success:** `src/ui/gestures/controller.ts` classifies a press as drag (latched at the
    first `pointermove` whose Euclidean distance from the `pointerdown` point is ≥ 8 px), tap
    (released without ever crossing it) or long-press (400 ms without crossing the threshold; WordCells
    only; once it fires, later movement never classifies as a drag) through a pure
    `classify(...)` in `gestures/`, uses `setPointerCapture`, ignores a
    second pointer entirely during an active press (it never touches controller state and never
    calls `preventDefault` or `stopPropagation` on it, so native buttons still work), ignores `pointerdown` with
    `button !== 0`, increments the gate at `pointerdown` before completing a running animation
    (a primary `pointerdown` with no active press `finish()`es a running fly-back, F13),
    `preventDefault()`s `contextmenu` for a press it captured, and exposes `cancel({ byBack? })`;
    `pointercancel`, `lostpointercapture` and `cancel()` end any press in progress with no command (tap candidate, below-threshold press, Composing
    destination-card press, long-press timer, drag) and close a peek with `closePeek()` (no sticky, no entry); a drag ended by `pointercancel`/`lostpointercapture` or `cancel({ byBack: true })` flies back, one ended by any other `cancel()` (`act()`, before-hide) returns to its slot at once with no fly-back and a running fly-back finished, gate idle before `cancel()` returns (F13); `cancel()` releases capture and
    ends the press at once, so another pointer's `pointerdown` starts a new gesture, and only the
    cancelled `pointerId`'s own remaining events are ignored until its
    `pointerup`/`pointercancel`; it attaches through a Svelte action on App's active-branch (Board)
    root, which spans the viewport except the desktop `scrollbar-gutter` strip (F30), each time that root mounts and detaches on its unmount (halt,
    rejected) after a `cancel()` (a halt mid-drag), and captures only presses resolved to a column, a WordCell or a tile, never on enabled buttons (F25); it resolves a press by `data-place` (F23): `column` → column
    press, `cell` → its WordCell press, `tray`/`strip` → inert in epic 4 (no dispatch, no
    selection change); a press on a non-card part of a column (empty space, placeholder, foot
    pad) or on a WordCell that crosses the threshold is inert in every phase: lifts nothing,
    dispatches nothing, keeps any selection; `main.ts` creates it once after `game.load()`'s halted early return and before
    `registerLifecycle()` (also on the rejected root), then registers `cancel` with
    `game.registerBeforeHide` and `() => controller.cancel({ byBack: true })` with the new
    `nav.registerBeforeBack` (F7, R1, F24; `register()` is unchanged), and `gate.ts`
    (`createGate({ raf, setTimer, clearTimer })`) its scroll
    reset with `registerBeforeHide`; every App-owned button handler (Board, History notice,
    Reset confirm, banner, the Session-rejected root's New game) calls
    `cancel()` first through `act()` (F9, R2); the Halted surface's Reload is exempt in both its
    mounts (standalone from `main.ts` `showStandalone`, and inside App on halt): a reload ends
    every gesture and the Board unmounts on halt, so `act()` never runs without a controller;
    shell Vitest `AD-13` covers the before-back hook (order before the
    close callback, not on own pops or stale launches, throws on a second registration); UI
    Vitest `AD-12` covers `classify` (long-press then move; on an empty WordCell a fired long-press then a
    move still releases as a tap (deselect); a second pointer untouched; move
    10 px, back to 2 px, release → drag), the cancel paths above, a new pointer after `cancel()`,
    `act()` finishing a fly-back first (after its `cancel()` no fly-back runs, gate count 0), a
    second-pointer fake event whose `preventDefault`/`stopPropagation` are never called, and
    F24 (hide keeps a tap-selection with no `nav` call and does not throw under a sticky view;
    hide during a drag that replaced a tap-selection deselects with one queued `nav.pop()`; such a drag then `pointercancel` → old selection kept, its classes restored, no `nav` call);
    Playwright proves an inert foot-pad drag with a tail selected (rule-coverage AD-12), AD-17's hide case (`hidePage` alone writes `wordcell:session` exactly once,
    cancels the gesture and resumes only when visible), AD-9's `hidePage` mid-`touchDrag`
    (the tail returns, `current().session` and the stored Session unchanged, and a move after
    `hidePage` then `end()` changes nothing), the same after a tap-select with the `touchHold`
    drag from another column (after `showPage`: nothing selected, `history.state.wc` 0, Session
    unchanged) and a held destination-card press in Composing +
    `hidePage` → no `tapDestinationCard`, with the held-touch helper (F10); tapping and dragging
    a static tray tile changes nothing; in the existing §2 rejection flow (`blocking.spec.ts`),
    after New game from a `session-invalid-*` fixture a tap selects a tail and `history.state.wc`
    becomes 1.

- **CAP-5** Overlays: tail selection and end-sheet states (AD-13, F5, F6)
  - **intent:** The overlays store owns the tail selection and the end sheet's state alongside the
    epic 3 entry stack, so back, Undo and New game close them in one place.
  - **success:** `overlays.svelte.ts` adds `select(column, count)` (pushes one entry on the first
    selection, none on re-select), `deselect()` (closes the entry top-down; with nothing
    selected a no-op with no `nav` call), the read-only selection, and `endSheet` `hidden | collapsed | expanded` with `expandEndSheet` (push),
    `collapseEndSheet` (pop), `closedByBack` collapsing it (never `hidden`), `onUnfinished`
    (expanded → close then `hidden`; collapsed → `hidden`, no pop), the deferred-open token that
    `resetForNewSession` cancels, and `resetForNewSession` clearing the selection and setting the
    sheet `hidden`; the peek and hover-peek open state: `openPeek(cell)`, `closePeek()`,
    `peekToSticky()` (pushes the `wordcellView` entry), `openView(cell)` (pushes `wordcellView`, stores
    the cell; `close`/`closedByBack` clear it) and the hover-peek state, none pushing an entry
    except `peekToSticky` and `openView`; `openPeek`, `peekToSticky` and `openView` close an open
    hover peek, and no hover peek opens while a peek or the view is open; the controller and `HoverPeek` call only these; UI Vitest
    `AD-13 …` covers each transition (entry counts included; hover peek open, then `openPeek` → hover
    peek closed) with a stubbed `nav`; the existing
    History notice and Reset confirm tests pass unchanged. Epic 4 does not connect the store's
    `DispatchResult` `finished`/`unfinished` to `endSheet`: it stays `hidden` and nothing is
    pushed on finish (epic 6 wires it with the sheet UI and boot push); Playwright: Undo then Redo
    into `won` on `session-won` leaves `history.state.wc` at 0.

- **CAP-6** Tap-select, foot pads and tap-drop (R-14 tap half, Q-18)
  - **intent:** A player can select a tail by tap and drop it with a second tap, including on its
    own column, with back, Undo and Redo clearing the selection.
  - **success:** Playwright `android`: a tap selects the tapped card and every card below it
    (faces lifted 8 px, F26, teal outline), the source foot shows `Here` and the other feet the wash; a tap
    on any card, empty space, placeholder or foot of another column, or on `Here` or the empty
    space of the source column, dispatches `drop` with `sourceCount` = the selected tail
    (selection entry popped first); with nothing selected, a tap on a column's empty space, placeholder or foot pad dispatches and selects nothing; a tap on another source-column card re-selects from it with
    no new entry, above the selected top (the tail grows) or inside the tail (it shrinks), and the
    next tap-drop's `sourceCount` matches; a tap on the selected top card is a no-op; a tap on a
    WordCell deselects and opens no view, and so does a long-press on an empty WordCell on
    release (entry popped, no view); a tap (F25) on the top bar
    background, tray band, labels, gap, action bar background, leftover band, banner background,
    the `desktop` side margins or a disabled control deselects, never a `pointerdown`, so a
    long-press on a non-empty WordCell and a pan from the tray band (`pan-y` in Idle; the foot row is `none` with a tail selected) at a scrolling viewport
    keep the selection; Undo, Redo and the banner `Reload` clear it, then act; back clears it and the app
    stays open at `wc: 0`; a reload shows nothing selected and the Session unchanged; AD-13's
    literal one-overlay case (select, reload, back → the app is left); `desktop`: the hover
    outline of the tail that would lift (cursor `grab`), the drop-target highlight on another column hovered
    anywhere and on the source column only over its empty space, placeholder or `Here`, the
    re-select outline, nothing on the selected top card. F26 at 360 × 750: a tap 1 px inside a
    card's slot margin hits that card; with column 1's bottom 3 cards of `session-idle-fresh`
    selected, a tap on the bottom 8 px of the tail's bottom card re-selects from it (shrinks, no
    drop), and a tap on the 8 px of the card just above the lifted tail re-selects from that card.

- **CAP-7** Drag, overlap targeting and drop → Composing (R-14 drag half, Q-34, AD-12)
  - **intent:** A player can drag a stack tail onto any column by card overlap and land in
    Composing, and a drag that never leaves its source column or ends over nothing changes
    nothing.
  - **success:** `targeting.ts` exports the pure `pickTarget(dragged, candidates, sourceId,
    hasLeftSource) → { raw, highlighted }` with UI Vitest `AD-12 …` for the 25 % minimum (exactly 25 %
    qualifies), largest ratio, horizontally nearest centre then lower-number tie-break, source suppression until `hasLeftSource`,
    `hasLeftSource` set from `raw` (including `null`), and a sub-25 % drag over the source only;
    during a drag the controller writes `transform` on the tail and the highlight on the target
    (bottom card, placeholder (a whole-column self-drop included), or the lowest non-tail card on a partial self-drop) with no Svelte
    state change (F12) and the tail's old slots show ghosts (a controller-added class on the
    dragged slot wrappers draws each as a pseudo-element; no mirror element mid-drag); release dispatches at most one
    `drop` on `highlighted` and otherwise flies the tail back (F13); Playwright `android` with
    `touchDrag`: drop on another column → Composing with k = 1 (k = 0 on another empty column, from
    `session-idle-empty-column`), side
    left, S in column order (R-23), the drop saved before the next action (R-73); a drag over
    the WordCell row → fly-back, no command, Session and storage unchanged; a 20 px drag straight
    down from column 4's bottom card of `session-idle-fresh` → no highlight at any step, cancel (Q-34); a drag that leaves and returns → self-drop; whole-column
    self-drop → k = 0; a drag
    from any column while a tail is selected, the selected source column included (the selected
    card or a card above or below it), replaces the selection: at threshold crossing the
    controller removes the old selection's lift/outline and foot states by DOM class only (F12),
    the new drag gets Q-34 source suppression, and the overlays store deselects at release (or
    `closedByBack` on back); released over nothing it leaves nothing selected with its entry
    popped (`overlays.deselect()`); ended by a real `pointercancel`/`lostpointercapture` it flies back
    and restores the old selection's lift, outline and foot classes, selection and entry kept (as
    with `byBack`; a following back clears them via `closedByBack`; that Android delivers
    `pointercancel` before back is `unverified`, on-device, epic 7); and a drag from the source column of a tap-selected tail shows only one tail lifted
    mid-drag; a press during fly-back first `finish()`es it, then re-resolves its target with
    `document.elementFromPoint` at the press point on the settled layout (F13), and Undo pressed
    during a fly-back acts on the settled layout (P4: from `session-idle-empty-column`, release a
    drag over nothing with `touchHold` `end()`, then one `page.evaluate` asserts a running animation on the tail's faces
    (`face.getAnimations()`) and calls
    `document.querySelector('[data-testid="undo"]').click()`; the faces then have no computed `transform` and no running animation, `current().session.cursor.index` decreased); AD-13's
    case: select, start a drag from another column, back → nothing selected, app open,
    `history.state.wc = 0`; `desktop` repeats the drop and the cancel with `page.mouse`.

- **CAP-8** Composing, Place and Game-over column behaviour (R-39, R-31, R-75, F17)
  - **intent:** After the drop only the destination column responds, by setting k, and in Place
    and Game over the columns are inert.
  - **success:** in Composing a tap on a destination-column card dispatches
    `tapDestinationCard` iff `kIfTapped` maps it to a number (absent or `null`: no dispatch); a
    drag started on a destination-column card does not move it and dispatches the same once at
    `pointerup` for the press card (a cancelled press dispatches nothing, CAP-4); taps and drags on every other column, S ghosts included, and presses on non-card parts of any
    column or on any ghost mirror (destination column included, self-drop) do nothing; in Place and Game over (`session-gave-up`, `session-won`) every column tap and drag does
    nothing; Playwright asserts
    each by `current().session` and the stored Session (reference unchanged for inert cases, the
    k change saved before the next action, R-73); `desktop` shows the 1 px outline of the D a
    click would set (top of D: k − 1; k = 1 on the top of D: none) and no hover outline on other column cards; in
    Place (`session-place`) and Game over (`session-won`) no column card shows a hover outline or
    the `grab` cursor.

- **CAP-9** WordCell view: peek, sticky and hover (R-65, Q-21, F14, F19) — needs CAP-4 and CAP-5
  - **intent:** A player can see every card of any WordCell at any time without changing the
    game.
  - **success:** a long-press (≥ 400 ms) on a non-empty WordCell opens the peek (no entry) that
    closes on release unless the rendered sheet's scroll area overflows at release
    (`scrollHeight > clientHeight`, F14), when it stays as the sticky view and pushes one entry
    then (`peekToSticky`, above a kept tail-selection entry); a tap in Idle with
    nothing selected or in Game over opens the sticky view (one entry) with the view title (F27), bottom card first,
    `top` on the last; a view lists `CellView.cards` in full, so in view, peek and hover peek a
    used cell's top (live in the tray or strip) is a normal-card mirror (AD-14), still tagged
    `top`, the count is `cards.length` and "empty" means `cards.length === 0` (P4: the used cell's
    peek on `session-place-free-letter-redo-tail`, its top unhatched); a swipe inside the sheet scrolls it and
    keeps it open (sheet and mirrors `pan-y`); the controller classifies sheet and scrim presses
    (AD-12): a `tap` closes the view and suppresses that gesture's trailing `click` once
    (capture phase; disarmed by the swallowed `click`, the next `pointerdown` or a 300 ms expiry armed at `pointerup`, whichever first; the touch `pointerup` → `click` order is `unverified`, gated by the `android` P4 scrim tap over Undo below; UI Vitest `AD-12`: a scrim tap whose trailing click is swallowed, then a later click reaches its handler; with no trailing click, the next `pointerdown` or the expiry disarms it), a drag does nothing (the scrim is `touch-action: none`; on the sheet it
    scrolls) (P4: a 20 px drag on the scrim keeps the view; a scrim tap over the enabled Undo
    closes it without undoing);
    back closes it; in Composing and Place a WordCell tap or drag dispatches nothing and
    opens no view in epic 4 (their phase-matrix actions are epic 5; the Session reference is
    unchanged), while the long-press peek works; an empty WordCell opens nothing (a long-press on it acts as a tap on release, whatever movement
    follows); a
    long-press on a non-empty WordCell with a tail selected keeps the selection (on an empty one it
    deselects on release, CAP-6); a WordCell drag never lifts a tail
    (R-12); `desktop`: hovering 400 ms opens the hover peek above the cell (F19), the top 14
    cards, oldest of them first, top card last and tagged `top`, a `+n older cards` line (F27) above
    them only above 14 cards, no scrim, takes no clicks, closes on leave, never opens during a drag or with a peek or view open (P4 `desktop`: hover 400 ms, then press
    and hold 400 ms → only the peek sheet visible);
    Playwright asserts that viewing never changes `current().session` or storage, and AD-13's
    one-overlay reload case with the sticky view. Sources: Idle peeks and the Idle sticky view on
    `session-idle-empty-column`; Composing and Place peeks on `session-place-free-letter-redo-tail`
    (Place, and one Undo → Composing); the Game-over sticky view and overflow on `session-won`;
    a gave-up view on `session-gave-up-after-commit`. The two new valid fixtures are scripted
    under the epic 3 regeneration rule: `version` 1, `seed` 1 (`session-won`'s), `activeMs` 0, `moves: [session-won.moves[0]]` (no redo tail; column 1's
    whole 7-card tail self-dropped and committed to cell 7, leaving column 1 empty), cursor
    `{ index: 1, phase: 'idle' }`, `gaveUp` false / true.

- **CAP-10** Refactor sweep (R6, R7, AD-17)
  - **intent:** The epic ends with its duplication folded, the shell stores' shared code in one
    helper and the unit budget re-measured.
  - **success:** the `history.svelte.ts` cases live in `src/shell/history.svelte.test.ts` with
    their names unchanged (`game.svelte.test.ts` keeps only game-store cases); the repeated
    `rejectReason`, launch-text/`isStale()`/`loaded()` launch snapshot and halted/booting write guard of the game, history and
    prefs stores live in one shell helper (F18) with no behaviour or message change (every
    existing test passes unedited except imports); the warm-cache median of three `npm test` runs
    after a discarded warm-up and the slowest engine file's watch re-run are recorded in the plan (a re-run over 1 s: per-test timings, stop for the owner before `built`), and if it exceeds 5 s,
    `src/architecture.test.ts` is split with its exemption before anything else, and if the
    median still exceeds 5 s the plan records per-file timings and stops for the owner before
    `built`; `npm run
    test:all` and `npm run test:screens` pass; the sweep's other findings are applied or recorded
    with a reason.

## Constraints

- Thin renderer (AD-3): components read `GameView` plus overlays, selection and dictionary state;
  no component derives legality, k, tail validity beyond the R-10 slice (`sourceCount` = cards
  from the pressed card to the bottom), score or phase mappings.
- One writer (AD-4): gestures reach the engine only through `game.dispatch`, at most one command
  per gesture; UI-level no-ops are the controller not dispatching, gated by a `GameView` flag.
- Hand-rolled gestures (rule 4, AD-12): Pointer Events with `setPointerCapture`, no DnD library,
  `transform` written directly during a drag, Svelte state only at release, drop by overlap of
  the grabbed card's rendered rect with whole hit rects clipped to the visible band (F34).
- Hit rects never move under a finger: w and band changes run only through the gate (AD-11).
- No code assumes which band sits above which; `BAND_ORDER` is the only order (AD-11).
- Single owners (AGENTS.md Conventions): overlay open state, the long-press peek and the hover
  peek included (CAP-5), only in `overlays.svelte.ts`; the
  History API only in `nav.ts`; lifecycle listeners only in `game.svelte.ts`; WAAPI durations only
  from `src/ui/motion.ts`, CSS transitions on `--wc-base-ms`; player strings only in
  `src/ui/text.ts`; `data-testid` only for the AGENTS.md list.
- AD-14: exactly one live element per card in every phase; mirrors carry `data-mirror-of` only
  and never animate.
- Fail fast (rule 6): no try/catch in the UI; an engine throw from a gesture is a bug.
- Every board touch target ≥ 44 × 44 px; board text in fixed px (DESIGN.md A-D9).
- Test split (AD-17): every `rule-coverage.md` row whose Kind includes P4 has a passing `android`
  Playwright test named with its id (`desktop` too for hover); UI and shell Vitest tests are
  `AD-n` and never R-id coverage; the unit suite stays under the AD-17 budget. Exception: the
  `?bands=` row's production half runs in the hook-free `dist-smoke` project, not `android`.
- Geometry e2e assertions measure rendered and computed values (F11); screenshots only in the
  container.
- The size budget (AD-18, 600,000 bytes) holds; no new runtime dependency.
- F20 follows Q-42 (spec text), which wins over AD-11's literal `dictionary.state === 'failed'`
  per AGENTS.md Policy; the spine bug is reported to the owner in Open Questions.

## Non-goals

- Tray interaction, tiles beyond the static tray, the word line's word display (F2), D-block controls, free letters
  (tap and drag) and `insertionIndex`, arrange and tap-swap, the placement strip's tags and
  reordering, target selection, Validate's tray states, FLIP, fly-to-cell, the winning-animation
  input guard, tray growth wiring (epic 5).
- Menu sheet and its button, confirm dialogs, end-sheet UI, its boot push and its
  `finished`/`unfinished` wiring, Statistics,
  Preferences and How to play panels, the menu dot, the pending-draft line, the timer display,
  the keyboard map (`Space`, `Enter`, `Esc`, digits, arrows), focus and screen-reader labels,
  AD-13's two-overlay reload case (epic 6); the view sheet and peek open/close transition
  (EXPERIENCE.md Motion, Overlays and sheets; with C-E56, epics 5/6).
- Service worker, `swState()`, `precacheComplete()`, device checks, Q-42's service-worker proof
  (epic 7); C-UI1, C-E56, R4 and I-68.
- Reopening any AD, a rule, an R-02 literal or a DESIGN.md/EXPERIENCE.md decision.

## Success signal

On the `android` project, from `session-idle-fresh`, a held drag (`touchHold`) of column 1's
bottom card (`sourceCount` 1) onto column 3 lights column 3 while over it, and its release lands
in Composing with the static tray showing column 3's bottom card as the locked D mirror on the
left and the one S tile after it, saved before the next action; the same drag held
over column 1 alone, or released over the WordCell row, leaves the stored Session byte-identical;
a long-press on cell 7 of `session-idle-empty-column` shows its cards and closes on release; `npm run test:all` is green with
every P4 row of `rule-coverage.md` covered.

## Assumptions

- The Pixel 7 profile (412 × 839, zero insets) gives w 46, H 61 and 101 px of leftover; the
  `desktop` project (1280 × 720) is below the 722 px minimum, so w = 40 and the page scrolls 2 px;
  tests that need the leftover exhausted set their own viewport.
- UI Vitest tests (geometry, targeting, overlays, gate, controller classification) run in node
  without a DOM library, as epic 3's shell tests do: classification is the pure `classify(...)`
  and `gate.ts` takes injected `raf`/timer functions (`createGate({ raf, setTimer, clearTimer
  })`); S tests target those seams, the DOM wiring is proven by P4.
- `session-won`'s deepest cell overflows the view sheet at some short viewport (F14); if none
  does, the ticket adds a scripted valid fixture under the epic 3 regeneration rule.

## Open Questions

None open for the build. The owner (Jared, 2026-10-01) answered three; each answer is a decision
below (F27–F29). The spine bug report stands as a report, its default per AGENTS.md Policy:

- Deploying epic 4 on its own (static tray F2, no end sheet until epic 6, F1/F2/F17 moved from spine
  Proposed-epics row 5): accepted. Epic 4 is merged and deployed on its own like epics 1–3, after
  the owner's go-ahead; the row 5 move is folded into Proposed epics at close-out (F29).
- Spine bug report (AGENTS.md Policy): AD-11's `bannerShown` as a latched copy of
  `dictionary.state === 'failed'` vs Q-42's banner kept during a service-worker retry. Not answered
  2026-10-01; Q-42 is spec text and wins, so the default applies: latch `dictionary.showBanner`
  (F20), correction folded into AD-11 at the epic 4 retrospective (C1).
- The WordCell view and peek title and the hover peek's older-cards line (CAP-9): accepted as
  proposed (F27).
- A drag interrupted by the platform (e.g. an Android edge-swipe back) that had replaced a
  tap-selected tail: it restores the earlier selection, as F24 states (F28).

## Decisions

Technical defaults under the owner's standing rule; none changes functionality, UX or gameplay.
Rationale in `build-notes.md`.

| # | Question | Decision |
| --- | --- | --- |
| F1 | Which epic renders the WordCell and column states that epic 5 commands produce? | Epic 4 renders every `GameView` state; epic 5 adds the tray interactions, free-letter and target commands, and FLIP. |
| F2 | Where are S and free letters live in Composing before the tray exists? | A static tray: live tray tiles in `arrangement` order with D-block mirrors (Composing), live strip tiles in `placementOrder` (Place); no gestures; the word-line slot is reserved and shows only the epic 3 invalid-word line (the word display is epic 5); the control row is empty (the D-block controls and the empty-destination line, EXPERIENCE.md catalogue, are epic 5); tiles at card height in one row while they fit (DESIGN.md tiles per row), else compact 44 px in up to two rows within the reserved max(H, 92) tile area, clipped beyond (`overflow: hidden`), never over the labels or WordCells, every element kept in the DOM (AD-14). Epic 5 replaces it. |
| F3 | Top bar without the menu and timer. | Score and Undo/Redo; a reserved empty 44 px menu slot; the timer box is epic 6 (absent while Show timer is off). |
| F4 | Minimal-board heading and Seed line. | Removed; a visually hidden `h1` `WordCell` stays; specs read the seed from `current()`. |
| F5 | End-sheet states without an end sheet. | Built in `overlays.svelte.ts` per AD-13 with UI Vitest only; `DispatchResult` `finished`/`unfinished` not wired (sheet stays `hidden`, no push); UI, wiring and Playwright in epic 6. |
| F6 | Overlay ids and selection data. | `tailSelection`, `wordcellView`, `endSheet`; `{ column, count }` held in the overlays store. |
| F7 | R1 before-back hook. | `nav.registerBeforeBack(fn)`, separate from `register()`, run before the Forward check and close callback for current-launch backs only. Spine close-out edit. |
| F8 | Controller creation. | `main.ts`, after `game.load()` and its halted early return, before `registerLifecycle()`, rejected root included; registers `cancel` with the store and `nav`. It attaches (Svelte action) to App's active-branch root on every mount, so a rejected → Board switch by New game needs no reload, and detaches after `cancel()` on unmount. |
| F9 | R2 cancel-first reach. | Every App-owned button handler (Board, dialogs, notices, banner, the Session-rejected root's New game) through one UI helper `act()`; epic 6's menu and keys inherit it. Halted's Reload is exempt in both mounts (standalone and inside App): a reload ends every gesture and the Board unmounts on halt, so `act()` never runs without a controller. |
| F10 | Mid-drag hide and back in Playwright. | A stepwise held-touch API in `e2e/helpers/touch.ts`, tested in `helpers.spec.ts`. |
| F11 | CI's wider system-ui. | Geometry assertions measure; no text-dependent px literals. |
| F12 | Drag feedback without reactive churn. | Transform and highlight written to the DOM; Svelte state at release. |
| F13 | Epic 4 animation. | Fly-back only, WAAPI via `duration('flyBack')`, gate-counted, run only for a drag released over nothing or ended by a real `pointercancel`/`lostpointercapture` or by the before-back `cancel({ byBack: true })` (EXPERIENCE.md "as for `pointercancel`"; no handler acts after it); `cancel()` from `act()` or before-hide (EXPERIENCE.md "cancels the drag as for `pointercancel`, then acts" with "completes any running animation at once and acts on the settled state") returns the tail to its slot at once and `finish()`es a running fly-back, gate idle before it returns; a primary `pointerdown` with no active press `finish()`es a running fly-back (gate `leave()` included) without calling `cancel()`, then resolves from `document.elementFromPoint` at the press point, ignores `event.target` and captures on the resolved element; a second `pointerId` during an active press never touches controller state. |
| F14 | Proving peek → sticky overflow. | Decided at release from the rendered sheet (`scrollHeight > clientHeight`); Playwright on `session-won`'s deepest cell at a short viewport. |
| F15 | Keyboard on cards and WordCells. | Epic 6. |
| F16 | AD-13 two-overlay reload case. | Epic 6 (menu + confirm). |
| F17 | Composing column gestures. | Epic 4; D-block controls epic 5. |
| F18 | R6 helper shape. | `src/shell/stored-key.ts`, which never imports `./storage`: `rejectReason`, last-text tracker whose `isStale(currentText)` takes the store's own `read(KEY)`, the `loaded()` launch snapshot fed by the store, halted/booting write guard; no behaviour or message change. |
| F19 | Hover peek when no room above (dev fallback orders). | Below the cell, never covering it. |
| F20 | AD-11 `bannerShown` vs Q-42's kept banner. | Latch `dictionary.showBanner`. Reported to the owner (Open Questions); folded into spine AD-11 at the retrospective (C1). |
| F21 | innerHeight-only change under 80 px (w fixed). | AD-11's rule: leftover = max(0, innerHeight − height-rule sum − banner) absorbs it; the layout module applies the absolute anchor offset's delta clamped to the document's scroll range, so at `scrollTop` 0 a leftover shrink applies none, and past exhaustion the document becomes scrollable by the shortfall with `scrollTop` unchanged; a w recompute applies the same clamped anchor-offset delta. |
| F22 | `BAND_ORDER` shape. | Ordered units of AD-11 band ids; `?bands=` names units (absent or empty: the default order; repeated: the first value); a non-permutation throws (AD-15); stickiness follows the top bar, banner and action-bar units wherever they sit (dev only). |
| F23 | Press resolution. | By `data-place`: `column`, `cell`; `tray`/`strip` inert in epic 4. |
| F24 | One `cancel` for hide, Undo and back. | `cancel({ byBack })` deselects only when the gesture it ends is a drag that replaced a selection, and `byBack` skips even that (`closedByBack` clears it); a release over nothing ending such a drag deselects (`overlays.deselect()`, entry popped), while a real `pointercancel`/`lostpointercapture` flies it back and restores the old selection's classes, selection and entry kept as with `byBack` (an Android edge-swipe may send `pointercancel` then back; `unverified`, epic 7); so hide during such a drag returns the tail and leaves nothing selected, its entry popped through nav's queue (`wc` 0 after `showPage`), while hide keeps a plain tap-selection; Undo, Redo, the banner `Reload` and the outside tap deselect in their own handlers. |
| F25 | Outside-tap deselect. | The controller listens on App's active-branch root spanning the viewport except the desktop `scrollbar-gutter` strip (F8, F30) (side margins, bars and banner included); presses on enabled buttons are never classified or captured (their `act()` handlers run), disabled controls fall through to this path. On the controller's `tap` classification for pointer input (`click` only for non-pointer activation, never both for one gesture), never on `pointerdown`; excludes `[data-wordcell]` (the controller handles WordCells; the cell-number labels sit outside it and take this path), the open view sheet and scrim (classified per CAP-9), and long-presses; `deselect()` with nothing selected is a no-op with no `nav` call. |
| F26 | Hit rects (DESIGN.md Hit rects) vs the drawn card. | Each live card and WordCell element is a slot wrapper spanning its full slot pitch (w + 4 wide; strip or H tall) with the drawn face inside; the wrapper carries `data-card-id`, `data-testid` and `data-place` (AD-14's one live element), the face none and is `pointer-events: none`, so hit-testing and `elementFromPoint` see only wrappers. The 8 px selection lift moves only the face, so hit areas never move under a finger; a drag's `transform` moves the faces (the wrappers stay to draw the ghosts, CAP-7), and overlap uses the grabbed face's rect. |
| F27 | WordCell view and peek title; hover peek older-cards line. | Owner, 2026-10-01: `WordCell 6 · 7 cards`, singular `WordCell 6 · 1 card`; `desktop` hover peek line `+1 older card` / `+n older cards`; all in `src/ui/text.ts`; EXPERIENCE.md's message catalogue gains them at close-out (`build-notes.md`). |
| F28 | A platform-interrupted drag (e.g. Android edge-swipe back) that had replaced a tap-selected tail. | Owner, 2026-10-01: restores the earlier selection, as F24 states (real `pointercancel`/`lostpointercapture` → fly-back, old selection, classes and entry kept; a following back clears it via `closedByBack`). EXPERIENCE.md Drop targeting step 6, its Pointer thresholds line and spine AD-12 are amended at close-out (`build-notes.md`). |
| F29 | Merge and deploy. | Owner, 2026-10-01: epic 4 is merged and deployed on its own like epics 1–3, after the owner's go-ahead; spine Proposed epics takes the F1/F2/F17 move from row 5 at close-out. |
| F30 | Controller root vs the `desktop` scrollbar gutter (ticket 4.6 probe). | Owner, 2026-10-02: accept the root stopping ~15 px short of the right edge at the `scrollbar-gutter: stable` strip; no listeners outside the root (F25's "spanning the viewport" excludes the gutter); a mouse press released over the strip stays held until the next click, which recovers. |
| F31 | `desktop` hover highlight when a whole column is tap-selected and the pointer is over that column's empty space or Here pad (self-drop). | Owner, 2026-10-02: the Here pad lights up with the usual teal drop-target outline and wash; desktop hover only, no change to rules, scoring or touch. DESIGN.md Column slot / drop-target highlight gains it at close-out (`build-notes.md`). |
| F32 | Dragging a card that is already lifted because it is tap-selected (ticket 4.9 code review). | Owner, 2026-10-05: the dragged card keeps its 8 px selection lift for the whole drag, so there is no jump at pickup; a cancelled drag flies back to the lifted slot with no snap at settle; under reduced motion the dragged and non-dragged selected cards show the same lift during the fade-back. The AD-12 drag transform (and fly-back target) accounts for the lift; spine close-out entry in `build-notes.md`. |
| F33 | F32 corner cases (ticket 4.9 F32 review). | Owner, 2026-10-05: (a) when a cancelled drag restores a selection, the selected cards left in the column, the selection outline and `Here` return as the fly-back starts, under full and reduced motion alike, so nothing pops at settle; (b) the lift is kept only when the dragged stack lies inside the selection; a drag from above the selection in the same column (a stack bigger than the selection) is drawn evenly with no lift, as before F32. |
| F34 | Drops onto columns hidden under the sticky top bar, the dictionary banner or the action bar (ticket 4.13 review, D7). | Owner, 2026-10-07: fix in 4.13; only the visible part of each column, between the sticky top bar (plus the banner when shown) and the action bar, is a drop target, so a drag over a bar never lights or drops onto a hidden column and a release there flies back (EXPERIENCE.md Drop targeting "what the player sees is what happens"). AD-12's "whole hit rect" wording is amended at close-out (`build-notes.md`). |
| F35 | AD-17 unit-suite budget after the 4.13 architecture-test split (warm median 5.62 s on the `/mnt/d` checkout, 3.14 s on the Linux filesystem; critical path `src/ui/gestures/controller.test.ts`). | Owner, 2026-10-07: accepted for now; no further speed-up in epic 4; the retrospective decides whether the 5 s budget stays or changes (AD-17 Speed close-out, `build-notes.md`). |
| F36 | Bar sizing (ticket 4.1 build, owner 2026-10-02, recorded at the retrospective). | Owner, 2026-10-02 (Option A): the top and action bars are content-sized, 44 px and 60 px plus `env(safe-area-inset-top/bottom)` padding; `bands()` returns those sums, which equal the rendered bars (build-notes CAP-1; spine AD-11 at close-out). |
| F37 | Retrospective F1: a press on a card mostly under a sticky bar counts as having left its column (F34 clipping vs Q-34), so a release back over the same column drops onto it. | Owner, 2026-10-08: fix before the epic 4 merge, with a controller Vitest, an android F34 e2e with the dictionary banner shown, and the Q-18 test name (retrospective A1–A3). |
| F38 | AD-17 unit budget after epic 4 (follows F35). | Owner, 2026-10-08: keep the 5 s warm median on the dev checkout; split `src/ui/gestures/controller.test.ts` (shared harness module, about five files) before the epic 4 merge and re-measure (retrospective A4). |
| F39 | A sticky WordCell view opened over a kept tail selection (retrospective F2, Q-21 scope). | Owner, 2026-10-08: allowed as today; when epic 6 adds key commands, Undo, Redo, the menu and key commands first close the view, then act, so `deselect()` never runs under the view (retrospective A7, epic 6 blocker). |
| F40 | Drop highlight on a long column's bottom card hidden under the action bar (retrospective F4). | Owner, 2026-10-08: accepted for now; revisit with the epic 5 tray work. |
| F41 | F38's split of `src/ui/gestures/controller.test.ts` made the `/mnt/d` unit median worse (5.30 → 5.98 s; the drvfs run is CPU-bound and each file adds worker start-up). | Owner, 2026-10-08: revert the split (one file, plus the F37 test) and measure the AD-17 5 s warm median on a Linux-filesystem checkout from now on; spine AD-17 Speed and AGENTS.md (managed block) say so. |
