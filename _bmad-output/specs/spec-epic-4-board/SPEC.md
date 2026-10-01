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
    ordered list of AD-11's eleven band ids (`topBar`; `banner`; `leftover`; `columns`;
    `footRow`; `trayGap`+`tray`; `labels`+`wordcells`; `actionGap`+`actionBar`; F22),
    `ANCHOR_BAND = 'wordcells'` and `SLACK_BAND = 'leftover'`; `?bands=` names units, and a list
    that is not a permutation of the unit ids throws to AD-15 (rule 6; UI Vitest case);
    `src/ui/layout/geometry.ts` exports `cardWidth(innerWidth,
    innerHeight, insets, hoverFine)` and `bands(w, bandOrder, trayRows, bannerShown, innerHeight,
    insets)`; UI Vitest `AD-11 …` cases pin DESIGN.md's reference numbers (412 × 915 → w 46, H 61,
    strip 44, sum 738, leftover 177; 412 × 839 → leftover 101; 360 × 750 → w 40, sum 722; a
    1080p window with a 950 px viewport → 70 × 93, board 592; 412 × 915 with 24/24 insets → w 46,
    H 61, sum 786, leftover 129; 1280 × 720 → w 40, sum 722 > 720, leftover 0, not negative, and a
    banner there pushes all 44 px away from the anchor with the anchor offset +44 and a matching +44 `scrollTop` delta), the
    40 px floor below 352 px available width, the H > 92 tray term, banner growth taken from
    leftover first then pushed away from the anchor, tray growth (+48/+96 at H ≤ 92, +47/+95 at
    H = 93) in the default order and in one fallback order (WordCells and tray above the
    columns), the w-recompute predicate (an innerHeight-only change under 80 px keeps w; two
    60 px shrinks measured against the last w computation recompute), and an innerHeight-only
    change under 80 px with w fixed (F21): leftover = max(0, innerHeight − height-rule sum −
    banner), the change goes to or from leftover, no `scrollTop` delta (412 × 839 → 412 × 779 at
    w 46: leftover 101 → 41; 412 × 780 → 412 × 710: leftover 42 → 0, the page scrolls 28 px).

- **CAP-2** Board render: cards, columns, WordCells and the static tray (AD-3, AD-14, F1, F2)
  - **intent:** The Board renders every state `GameView` exposes, with one live element per card,
    in the DESIGN.md look, replacing the epic 3 minimal board.
  - **success:** `Board.svelte` renders by iterating `BAND_ORDER` (no component names a
    neighbour band); columns are fanned (strip `max(44, round(0.72 H))`, glyph in the top 72 %,
    the flourish, the `QU` ×2 badge), an empty column shows the placeholder slot, each column has
    its 44 px foot pad (`foot-<n>`; on `desktop` it shows the column number while nothing is
    selected) and a whole-slot hit rect (`column-<n>`); the WordCell row
    shows labels 3–10 above, the top card or the empty outline, the count badge at 2+ cards, and
    the used, legal, selected-target (check chip) and not-legal states; Composing shows S ghosts
    and D cards in destination style, Place shows S and D ghosts; the static tray (F2) holds the
    live S and free-letter tiles (`data-place="tray"`) and the D-block mirrors in Composing and
    the live strip tiles (`data-place="strip"`) in Place; Playwright proves, for each of the
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
    (tooltips on `desktop`); the
    banner is sticky under it; the sticky action bar holds `primary-action` (epic 3's labels and
    enablement); `src/ui/layout/` reads insets from an `env(safe-area-inset-*)` probe, recomputes w
    only per CAP-1's predicate on `resize`/`orientationchange`, re-lays bands on banner show/hide
    and innerHeight-only changes under 80 px, and applies the anchor `scrollTop` delta in the same
    frame (none for an innerHeight-only change, F21); `src/ui/gestures/gate.ts` defers both until no gesture, animation or page scroll is
    active (scroll busy from the first `scroll` until `scrollend`, hide/pagehide, or 150 ms
    without `scroll`), then runs them in the next idle `requestAnimationFrame`; cards, tiles and
    WordCells have `touch-action: none` and the DESIGN.md non-card regions `pan-y` (`pan-x pan-y`
    when the board is wider than the available width); the WordCell view sheet and its mirror
    cards are `pan-y` (CAP-9); `?bands=<list>` reorders bands in dev and
    is ignored in the production build (`dist/`, checked by `dist-smoke`); Playwright measures (F11): card and slot sizes at the
    Pixel 7 profile, the banner taking leftover first, the WordCell row's bounding box unchanged
    when the banner shows at a viewport with leftover under 44 px, a banner shown during a scroll
    applied only after it ends (at a scrolling viewport, e.g. 412 × 700: the dictionary route
    held, an in-page `scrollBy` loop every 50 ms, the route fulfilled with a failure, no banner
    while the loop runs, the banner after the loop stops and `scrollend` or the 150 ms backstop),
    and the top-bar score for an Idle, a won and a given-up fixture.

- **CAP-4** Pointer controller core and cancel wiring (AD-12, AD-9, AD-13, AD-16; R1, R2, C-E4b)
  - **intent:** One pointer controller owns every gesture on cards, columns and WordCells, and
    every command, dialog action, back and hide first cancels a gesture in progress.
  - **success:** `src/ui/gestures/controller.ts` classifies a press as tap (< 8 px at
    `pointerup`), drag (≥ 8 px) or long-press (400 ms without crossing the threshold; WordCells
    only) through a pure `classify(...)` in `gestures/`, uses `setPointerCapture`, ignores a
    second pointer in its own classification only (it never calls `preventDefault` or
    `stopPropagation` on it, so native buttons still work), ignores `pointerdown` with
    `button !== 0`, increments the gate at `pointerdown` before completing a running animation,
    and exposes `cancel({ byBack? })`; `pointercancel`, `lostpointercapture` and `cancel()` end
    any press in progress with no command (tap candidate, below-threshold press, Composing
    destination-card press, long-press timer, drag → fly-back), and after `cancel()` the
    controller ignores every remaining event of that `pointerId` until its
    `pointerup`/`pointercancel`; it resolves a press by `data-place` (F23): `column` → column
    press, `cell` → its WordCell press, `tray`/`strip` → inert in epic 4 (no dispatch, no
    selection change); `main.ts` creates it once after `game.load()` and before
    `registerLifecycle()` (also on the rejected root), then registers `cancel` with
    `game.registerBeforeHide` and `() => controller.cancel({ byBack: true })` with the new
    `nav.registerBeforeBack` (F7, R1, F24; `register()` is unchanged; only `byBack` skips
    `overlays.deselect()`), and `gate.ts` (`createGate({ raf, setTimer, clearTimer })`) its scroll
    reset with `registerBeforeHide`; every button handler on the Board, the History notice, the
    Reset confirm, the banner and the Blocking message mounted after the controller calls
    `cancel()` first (F9, R2); the standalone Halted surface (font-check `fatal()` and the
    `game.load()` halted return in `main.ts`) mounts before the controller exists and its Reload
    is exempt (no gesture can exist yet; a reload ends everything); shell Vitest `AD-13` covers the before-back hook (order before the
    close callback, not on own pops or stale launches, throws on a second registration); UI
    Vitest `AD-12` covers `classify`, the cancel paths above and the `byBack` and hide/Undo
    `cancel` paths (deselect skipped only by `byBack`);
    Playwright proves AD-17's hide case (`hidePage` alone writes `wordcell:session` exactly once,
    cancels the gesture and resumes only when visible), AD-9's `hidePage` mid-`touchDrag`
    (the tail returns, `current().session` and the stored Session unchanged, and a move after
    `hidePage` then `end()` changes nothing) and a held destination-card press in Composing +
    `hidePage` → no `tapDestinationCard`, with the held-touch helper (F10); tapping and dragging
    a static tray tile changes nothing.

- **CAP-5** Overlays: tail selection and end-sheet states (AD-13, F5, F6)
  - **intent:** The overlays store owns the tail selection and the end sheet's state alongside the
    epic 3 entry stack, so back, Undo and New game close them in one place.
  - **success:** `overlays.svelte.ts` adds `select(column, count)` (pushes one entry on the first
    selection, none on re-select), `deselect()` (closes the entry top-down), the read-only
    selection, and `endSheet` `hidden | collapsed | expanded` with `expandEndSheet` (push),
    `collapseEndSheet` (pop), `closedByBack` collapsing it (never `hidden`), `onUnfinished`
    (expanded → close then `hidden`; collapsed → `hidden`, no pop), the deferred-open token that
    `resetForNewSession` cancels, and `resetForNewSession` clearing the selection and setting the
    sheet `hidden`; the peek and hover-peek open state: `openPeek(cell)`, `closePeek()`,
    `peekToSticky()` (pushes the `wordcellView` entry) and the hover-peek state, none pushing an
    entry except `peekToSticky`; the controller and `HoverPeek` call only these; UI Vitest
    `AD-13 …` covers each transition (entry counts included) with a stubbed `nav`; the existing
    History notice and Reset confirm tests pass unchanged.

- **CAP-6** Tap-select, foot pads and tap-drop (R-14 tap half, Q-18)
  - **intent:** A player can select a tail by tap and drop it with a second tap, including on its
    own column, with back, Undo and Redo clearing the selection.
  - **success:** Playwright `android`: a tap selects the tapped card and every card below it
    (lifted 8 px, teal outline), the source foot shows `Here` and the other feet the wash; a tap
    on any card, empty space, placeholder or foot of another column, or on `Here` or the empty
    space of the source column, dispatches `drop` with `sourceCount` = the selected tail
    (selection entry popped first); a tap on another source-column card re-selects from it with
    no new entry, above the selected top (the tail grows) or inside the tail (it shrinks), and the
    next tap-drop's `sourceCount` matches; a tap on the selected top card is a no-op; a tap on a
    WordCell deselects and opens no view; a completed tap (< 8 px, or `click`) on the top bar
    background, tray band, labels, gap, action bar background, leftover band, banner background,
    the `desktop` side margins or a disabled control deselects, never a `pointerdown` (F25), so a
    long-press on a WordCell and a pan from a `pan-y` region at a scrolling viewport keep the
    selection; Undo and Redo clear it, then act; back clears it and the app
    stays open at `wc: 0`; a reload shows nothing selected and the Session unchanged; AD-13's
    literal one-overlay case (select, reload, back → the app is left); `desktop`: the hover
    outline of the tail that would lift, the drop-target highlight on another column hovered
    anywhere and on the source column only over its empty space, placeholder or `Here`, the
    re-select outline, nothing on the selected top card.

- **CAP-7** Drag, overlap targeting and drop → Composing (R-14 drag half, Q-34, AD-12)
  - **intent:** A player can drag a stack tail onto any column by card overlap and land in
    Composing, and a drag that never leaves its source column or ends over nothing changes
    nothing.
  - **success:** `targeting.ts` exports the pure `pickTarget(dragged, candidates, sourceId,
    hasLeftSource) → { raw, highlighted }` with UI Vitest `AD-12 …` for the 25 % minimum, largest
    ratio, centre-distance then lower-number tie-break, source suppression until `hasLeftSource`,
    `hasLeftSource` set from `raw` (including `null`), and a sub-25 % drag over the source only;
    during a drag the controller writes `transform` on the tail and the highlight on the target
    (bottom card, placeholder, or the lowest non-tail card on a partial self-drop) with no Svelte
    state change (F12) and the tail's old slots show ghosts; release dispatches at most one
    `drop` on `highlighted` and otherwise flies the tail back (F13); Playwright `android` with
    `touchDrag`: drop on another column → Composing with k = 1 (k = 0 on another empty column, from
    `session-idle-empty-column`), side
    left, S in column order (R-23), the drop saved before the next action (R-73); a drag over
    the WordCell row → fly-back, no command, Session and storage unchanged; a 20 px drag staying
    over the source → cancel (Q-34); a drag that leaves and returns → self-drop; whole-column
    self-drop → k = 0; a drag
    from any column while a tail is selected, the selected source column included (the selected
    card or a card above or below it), replaces the selection: at threshold crossing the
    controller removes the old selection's lift/outline and foot states by DOM class only (F12),
    the new drag gets Q-34 source suppression, and the overlays store deselects at release (or
    `closedByBack` on back); released over nothing it leaves nothing selected with its entry
    popped, and a drag from the source column of a tap-selected tail shows only one tail lifted
    mid-drag; a press during fly-back first `finish()`es it, then re-resolves its target with
    `document.elementFromPoint` at the press point on the settled layout (F13); AD-13's
    case: select, start a drag from another column, back → nothing selected, app open,
    `history.state.wc = 0`; `desktop` repeats the drop and the cancel with `page.mouse`.

- **CAP-8** Composing, Place and Game-over column behaviour (R-39, R-31, R-75, F17)
  - **intent:** After the drop only the destination column responds, by setting k, and in Place
    and Game over the columns are inert.
  - **success:** in Composing a tap on a destination-column card dispatches
    `tapDestinationCard` iff `kIfTapped` maps it to a number (absent or `null`: no dispatch); a
    drag started on a destination-column card does not move it and dispatches the same once at
    `pointerup` for the press card (a cancelled press dispatches nothing, CAP-4); taps and drags on every other column, S ghosts included, do
    nothing; in Place and Game over (`session-gave-up`, `session-won`) every column tap and drag does
    nothing; Playwright asserts
    each by `current().session` and the stored Session (reference unchanged for inert cases, the
    k change saved before the next action, R-73); `desktop` shows the 1 px outline of the D a
    click would set (top of D: k − 1; k = 1 on the top of D: none) and no hover elsewhere.

- **CAP-9** WordCell view: peek, sticky and hover (R-65, Q-21, F14, F19) — needs CAP-4 and CAP-5
  - **intent:** A player can see every card of any WordCell at any time without changing the
    game.
  - **success:** a long-press (≥ 400 ms) on a non-empty WordCell opens the peek (no entry) that
    closes on release unless the rendered sheet's scroll area overflows at release
    (`scrollHeight > clientHeight`, F14), when it stays as the sticky view and pushes one entry
    then (`peekToSticky`, above a kept tail-selection entry); a tap in Idle with
    nothing selected or in Game over opens the sticky view (one entry) with the cell number and
    count as title, bottom card first, `top` on the last; a swipe inside the sheet scrolls it and
    keeps it open (sheet and mirrors `pan-y`); a completed tap (< 8 px) closes it and is
    consumed; back closes it; in Composing and Place a WordCell tap or drag dispatches nothing and
    opens no view in epic 4 (their phase-matrix actions are epic 5; the Session reference is
    unchanged), while the long-press peek works; an empty WordCell opens nothing (a long-press on it acts as a tap on release); a
    long-press with a tail selected keeps the selection; a WordCell drag never lifts a tail
    (R-12); `desktop`: hovering 400 ms opens the hover peek above the cell (F19), top 14 cards
    with `+n older cards`, no scrim, takes no clicks, closes on leave, never opens during a drag;
    Playwright asserts that viewing never changes `current().session` or storage, and AD-13's
    one-overlay reload case with the sticky view. Sources: Idle peeks and the Idle sticky view on
    `session-idle-empty-column`; Composing and Place peeks on `session-place-free-letter-redo-tail`
    (Place, and one Undo → Composing); the Game-over sticky view and overflow on `session-won`;
    a gave-up view on `session-gave-up-after-commit`. The two new valid fixtures are scripted
    under the epic 3 regeneration rule: `session-won`'s first move committed, cursor
    `{ index: 1, phase: 'idle' }`, `gaveUp` false / true.

- **CAP-10** Refactor sweep (R6, R7, AD-17)
  - **intent:** The epic ends with its duplication folded, the shell stores' shared code in one
    helper and the unit budget re-measured.
  - **success:** the `history.svelte.ts` cases live in `src/shell/history.svelte.test.ts` with
    their names unchanged (`game.svelte.test.ts` keeps only game-store cases); the repeated
    `rejectReason`, launch-text/`isStale()`/`loaded()` launch snapshot and halted/booting write guard of the game, history and
    prefs stores live in one shell helper (F18) with no behaviour or message change (every
    existing test passes unedited except imports); the warm-cache median of three `npm test` runs
    after a discarded warm-up is recorded in the plan, and if it exceeds 5 s,
    `src/architecture.test.ts` is split with its exemption before anything else; `npm run
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
  the grabbed card's rendered rect with whole hit rects.
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
  per AGENTS.md Policy; it is a reported spine bug listed for the owner (build-notes close-out
  edit), and the build does not stop on it.

## Non-goals

- Tray interaction, tiles beyond the static tray, the word line, D-block controls, free letters
  (tap and drag) and `insertionIndex`, arrange and tap-swap, the placement strip's tags and
  reordering, target selection, Validate's tray states, FLIP, fly-to-cell, the winning-animation
  input guard, tray growth wiring (epic 5).
- Menu sheet and its button, confirm dialogs, end-sheet UI and its boot push, Statistics,
  Preferences and How to play panels, the menu dot, the pending-draft line, the timer display,
  the keyboard map (`Space`, `Enter`, `Esc`, digits, arrows), focus and screen-reader labels,
  AD-13's two-overlay reload case (epic 6).
- Service worker, `swState()`, `precacheComplete()`, device checks, Q-42's service-worker proof
  (epic 7); C-UI1, C-E56, R4 and I-68.
- Reopening any AD, a rule, an R-02 literal or a DESIGN.md/EXPERIENCE.md decision.

## Success signal

On the `android` project, from `session-idle-fresh`, a held drag (`touchHold`) of column 1's
tail onto column 3 lights column 3 while over it, and its release lands in Composing with the static tray
showing D locked on the left and S after it, saved before the next action; the same drag held
over column 1 alone, or released over the WordCell row, leaves the stored Session byte-identical;
a long-press on a WordCell shows its cards and closes on release; `npm run test:all` is green with
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

- Deploying epic 4 on its own: with the static tray (F2) the live site would let a player drop a
  tail, set k from the column, Validate the dropped order and Confirm on the default cell, but not
  arrange tiles, add free letters or choose a cell until epic 5. Proposed default: merge and deploy
  as for epics 1–3. (Owner.)

## Decisions

Technical defaults under the owner's standing rule; none changes functionality, UX or gameplay.
Rationale in `build-notes.md`.

| # | Question | Decision |
| --- | --- | --- |
| F1 | Which epic renders the WordCell and column states that epic 5 commands produce? | Epic 4 renders every `GameView` state; epic 5 adds the tray interactions, free-letter and target commands, and FLIP. |
| F2 | Where are S and free letters live in Composing before the tray exists? | A static tray: live tray tiles in `arrangement` order with D-block mirrors (Composing), live strip tiles in `placementOrder` (Place); no gestures; the invalid-word line moves to its word-line slot. Epic 5 replaces it. |
| F3 | Top bar without the menu and timer. | Score and Undo/Redo; a reserved empty 44 px menu slot; the timer box is epic 6 (absent while Show timer is off). |
| F4 | Minimal-board heading and Seed line. | Removed; a visually hidden `h1` `WordCell` stays; specs read the seed from `current()`. |
| F5 | End-sheet states without an end sheet. | Built in `overlays.svelte.ts` per AD-13 with UI Vitest only; UI and Playwright in epic 6. |
| F6 | Overlay ids and selection data. | `tailSelection`, `wordcellView`, `endSheet`; `{ column, count }` held in the overlays store. |
| F7 | R1 before-back hook. | `nav.registerBeforeBack(fn)`, separate from `register()`, run before the Forward check and close callback for current-launch backs only. Spine close-out edit. |
| F8 | Controller creation. | `main.ts`, after `game.load()`, before `registerLifecycle()`, rejected root included; registers `cancel` with the store and `nav`. |
| F9 | R2 cancel-first reach. | Every button handler on the Board, dialogs, notices, banner and Blocking message mounted after the controller, through one UI helper; epic 6's menu and keys inherit it. The standalone Halted surface's Reload (mounted before the controller) is exempt. |
| F10 | Mid-drag hide and back in Playwright. | A stepwise held-touch API in `e2e/helpers/touch.ts`, tested in `helpers.spec.ts`. |
| F11 | CI's wider system-ui. | Geometry assertions measure; no text-dependent px literals. |
| F12 | Drag feedback without reactive churn. | Transform and highlight written to the DOM; Svelte state at release. |
| F13 | Epic 4 animation. | Fly-back only, WAAPI via `duration('flyBack')`, gate-counted, completed by a new press, which then re-resolves its target with `document.elementFromPoint` at the press point. |
| F14 | Proving peek → sticky overflow. | Decided at release from the rendered sheet (`scrollHeight > clientHeight`); Playwright on `session-won`'s deepest cell at a short viewport. |
| F15 | Keyboard on cards and WordCells. | Epic 6. |
| F16 | AD-13 two-overlay reload case. | Epic 6 (menu + confirm). |
| F17 | Composing column gestures. | Epic 4; D-block controls epic 5. |
| F18 | R6 helper shape. | `src/shell/stored-key.ts`: `rejectReason`, last-text tracker with `isStale` and the `loaded()` launch snapshot, halted/booting write guard; no behaviour or message change. |
| F19 | Hover peek when no room above (dev fallback orders). | Below the cell, never covering it. |
| F20 | AD-11 `bannerShown` vs Q-42's kept banner. | Latch `dictionary.showBanner`. Spine close-out edit. |
| F21 | innerHeight-only change under 80 px (w fixed). | Leftover = max(0, innerHeight − height-rule sum − banner) absorbs it; no `scrollTop` delta (a viewport change, not band growth). |
| F22 | `BAND_ORDER` shape. | Ordered units of AD-11 band ids; `?bands=` names units; a non-permutation throws (AD-15). |
| F23 | Press resolution. | By `data-place`: `column`, `cell`; `tray`/`strip` inert in epic 4. |
| F24 | One `cancel` for hide, Undo and back. | `cancel({ byBack })`; only `byBack` skips `overlays.deselect()`. |
| F25 | Outside-tap deselect. | On a completed tap (< 8 px, or `click`), never on `pointerdown`. |
