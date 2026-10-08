---
title: 'Desktop hover peek'
type: 'feature'
ticket: '12'
created: '2026-10-07'
status: done
baseline_revision: 'fa088cd76b05c30e8e930f873a7e309a003ee47b'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-desktop-hover-peek.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/rule-coverage.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Desktop players have no quick way to see a WordCell's buried cards: the sticky view needs a click and the long-press peek a held press. CAP-9/F19 call for a 400 ms mouse-hover peek.

**Approach:** Implement the ticket (`story-desktop-hover-peek.md`, the full contract; its Description, Timer, "Starts a drag", Layout, Mirrors, Locator and AC paragraphs are binding) with the review-log minors resolved as stated in Design Notes. Three parts: a controller hover timer (mouse only, gated by a live `layout.hoverFine`), a pure `hover-peek.ts` (slice and placement), and `HoverPeek.svelte`, rendered from `overlays.hoverPeek`. Wording: the older-cards line shows only when the cell holds more than 14 cards.

## Boundaries & Constraints

**Always:** AD-12 pick-up drags make no Svelte state change before their end (only the DOM hide class at the crossing). Mirrors only, carrying `data-mirror-of` and never animating (AD-14). Strings go in `text.ts`. Test names carry ids (R-65 where they cover R-65 sentences, else AD-12/AD-13; UI Vitest names use AD-n). Rule 6: fail fast, with no defensive fallbacks. AD-3: emptiness and counts come from `GameView` only. The cancel-first wiring is unchanged.

**Never:** No `data-testid` on the hover peek. No overlays-store API change (`openHoverPeek`/`closeHoverPeek` exist with their gates). No transition. No engine change. No viewport clamp. No hover peek for touch or pen. Do not edit the ticket file, the spine, DESIGN.md or EXPERIENCE.md.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Arm | mouse pointerover into non-empty cell X (relatedTarget outside X or null), `hoverFine`, no press, no flight, `buttons === 0`, X not suppressed, X's hover peek not open | one 400 ms timer (single slot, replaces any pending) | — |
| No arm | touch/pen; `hoverFine` false; press held (captured or not); flight running; `buttons ≠ 0`; X suppressed; X empty | no timer | — |
| Fire | timer fires | re-check `hoverFine` and `game.view` cell non-empty → `overlays.openHoverPeek(X)` (store gates peek/view/modal top) | either check false → nothing |
| Leave | mouse pointerout from X, relatedTarget outside X | clear X's timer, `closeHoverPeek()`, clear suppression if X | — |
| Any pointerdown | any type or button, enabled button included | pending timer cleared first | — |
| Inert drag crossing | WordCell, inert column or S-ghost, any other non-pick-up crossing | `closeHoverPeek()` at the crossing | — |
| Pick-up drag | crossing | add `wc-hover-peek-hidden` to `[data-hover-peek]` (DOM); `closeHoverPeek()` in `end()` on every path, before fly-back/clearDrag and before pointerup's drop dispatch | — |
| Suppression | mouse press end, fly-back settle, `cancel()` (idle too) | slot = `[data-wordcell]` whose rect contains `lastPoint`, else null | — |
| cancel()/detach | press or no press | clear timer, `closeHoverPeek()`, set suppression; then end any press | — |
| hoverFine → false | media `change` → `layout.watchHoverFine` callback (the controller subscribes `refreshHover` in `attach`, unwatches on detach) → `refreshHover()` | clear timer, `closeHoverPeek()` | — |

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` -- `ControllerDeps` (l.88) gains `hoverFine(): boolean` and `watchHoverFine(callback): () => void` (the hoverFine watcher: `attach` subscribes `refreshHover`, detach unwatches). `Press` gains `mouse: boolean` (from `event.pointerType`). `pointerover`/`pointerout` (l.761/765) feed the hover timer beside `track`/`refreshHover`. `pointerdown` (l.541) clears the timer first, before the button-0 filter. `pointermove` crossing (l.600) closes or hides. `end()` (l.280): pick-up close plus mouse-press suppression. `settle()` (l.390) suppresses. `cancel()` (l.788) no longer returns early when idle. `refreshHover()` (l.739) closes when `!deps.hoverFine()`; it must not read `overlays.hoverPeek`, or App's selection/GameView effect would track it. Detach resets suppression. Update the header comment with an "Entry 12" paragraph.
- `src/ui/gestures/controller.test.ts` -- harness `setup()` (l.357): add `hoverFine` (mutable, default **false**, so the existing `setTimer` call-count tests stay valid). The cells (`b.cell3` non-empty, `b.cell4` empty) need `getBoundingClientRect` and a root `querySelectorAll('[data-wordcell]')` if `FakeEl` lacks them. The existing `hover()` helper fires mouse pointerover; extend it with `relatedTarget`/`buttons`.
- `src/ui/layout/layout.svelte.ts` -- `Layout` gains `readonly hoverFine: boolean`: a `$state(media.matches)` set synchronously in the `change` listener (the listener also still calls `schedule()`), and `watchHoverFine(callback)`, which the `change` listener calls after setting `hoverFine`; returns the unwatch. `layout.svelte.test.ts` uses the fake `matchMedia`.
- `src/main.ts` (l.123–136) -- create `layout` before `controller` (beforeHide registration order unchanged) and pass `hoverFine: () => layout.hoverFine` and `watchHoverFine: (callback) => layout.watchHoverFine(callback)`. Fix the order comment.
- `src/ui/App.svelte` -- unchanged: its refreshHover `$effect` reads only `overlays.selection` and `game.view`; it is not the hoverFine watcher (the controller's `watchHoverFine` is).
- `src/ui/hover-peek.ts` (new) + `hover-peek.test.ts` -- `HOVER_PEEK_MAX = 14`, `PER_ROW = 7`. `hoverPeekCards(cards) → { shown, older }`. `hoverPeekWidth(count, slot) = min(count,7)·slot − 4 + 32`. `placeHoverPeek({ cell, slot, width, height, labelTop, cellBottom, boardTop }) → { x, y, below }`: x is column-relative, `clamp((cell − 2.5)·slot − width/2, 0, 8·slot − width)`; below iff `height > labelTop − boardTop`; y = `labelTop − height` above, else `cellBottom`.
- `src/ui/HoverPeek.svelte` (new) -- props `view`, `layout`. `{#if overlays.hoverPeek !== null}` root `div.hover-peek` with `data-hover-peek`, `aria-hidden="true"`, `pointer-events: none`, `position: absolute`, `z-index: 4`, surface `var(--wc-surface)`, radius 20px (as `.sheet`), 16 px padding, `box-sizing: border-box`, width from `hoverPeekWidth`. Optional `ui-label` line `text.olderCards(older)`. A flex-wrap grid (`margin: 0 -2px; row-gap: 4px`, as WordCellView) of `Card place="view" mirror="view" full topTag={last}`. `:global(.wc-hover-peek-hidden)` → `visibility: hidden`. Horizontal: `left: calc(max(0px, (100% - var(--wc-board)) / 2) + {x}px)` (board column inside `.board-root`, `safe center`). Vertical: a `$effect` reads `layout.w`, `layout.metrics`, `layout.heights`, `layout.bannerShown`, the cell and its count, then measures the root height, `[data-wordcell-label=n]` top, `[data-wordcell=n]` bottom and `.board` top relative to `.board-root`, calls `placeHoverPeek` and writes `y` state. `visibility: hidden` until the first placement.
- `src/ui/Board.svelte` -- `.board-root { position: relative }`; render `<HoverPeek {view} {layout} />` after `<WordCellView>`.
- `src/ui/WordCellRow.svelte` -- label span gains `data-wordcell-label={cell.cell}` (measurement locator; outside `[data-wordcell]`).
- `src/ui/text.ts` + `text.test.ts` -- `olderCards: (n) => n === 1 ? '+1 older card' : \`+${n} older cards\`` (F27, catalogue row 107).
- `e2e/wordcell-view.spec.ts` -- the desktop describe (l.522) and its helpers (`openFixture`, `cell`, `centre`, `stash`, `wcOf`). For the clock: `page.clock.install({ time: 0 })` + `pauseAt` before `goto`, `runFor` (as `e2e/blocking.spec.ts` l.57–69).
- `_bmad-output/specs/spec-epic-4-board/build-notes.md` §DESIGN.md close-out edits (l.65) -- append two bullets (Design Notes item 8).
- Reuse, don't change: `overlays.svelte.ts` (`openHoverPeek` gate l.152, and `openPeek`/`openView`/`peekToSticky`, which already clear `hoverPeek`), `Card.svelte` view mirror, `classify.ts` `LONG_PRESS_MS`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/text.test.ts` -- add `olderCards`; tests named like the existing text.test.ts cases: `olderCards(1)`, `olderCards(10)`.
- [x] `src/ui/hover-peek.ts`, `src/ui/hover-peek.test.ts` -- the pure helpers. Tests (AD-12): slice at 1, 14 and 15 cards (15 → `older` 1, 14 → 0); width; placement unclamped (narrow width), left-clamped, right-clamped, above and below when there is no room (both assert y).
- [x] `src/ui/layout/layout.svelte.ts`, `layout.svelte.test.ts` -- `hoverFine` getter. Test (AD-11): it follows a media `change` immediately, before the gate's idle task.
- [x] `src/ui/gestures/controller.ts` -- the timer, suppression, crossing and end behaviour in the matrix. `cancel()` order: `finishFlight()` (its settle suppresses), clear timer, `closeHoverPeek()`, suppress, then `end` if pressed.
- [x] `src/ui/gestures/controller.test.ts` -- AD-12 cases: every controller Vitest in the ticket AC, plus mouse pointerover with `buttons ≠ 0` and no press → no arm; an open hover peek closes when `hoverFine` flips false and `refreshHover()` runs; `cancel()` with no press closes it and suppresses (a later boundary pointerover into that cell does not arm; pointerout then re-entry arms); suppression is a single slot (a later press end over no cell clears it); an inert WordCell drag closes it at the crossing; a pick-up drag adds the hide class at the crossing and closes it in `end()` on pointerup (before the drop dispatch), pointercancel, lostpointercapture and `cancel()`; a relatedTarget-null entry arms.
- [x] `src/main.ts` -- the `hoverFine` and `watchHoverFine` deps. The watcher is controller-owned (`attach` subscribes `deps.watchHoverFine(refreshHover)`, detach unwatches); tests: AD-12 controller `AD-12 a hoverFine change to false closes an open hover peek with no refreshHover() call; detach unwatches` and AD-11 layout `AD-11 watchHoverFine runs its callback after every media change, with hoverFine already set, until unwatched`.
- [x] `src/ui/WordCellRow.svelte`, `src/ui/HoverPeek.svelte`, `src/ui/Board.svelte` -- render and placement.
- [x] `e2e/wordcell-view.spec.ts` -- every desktop P4 case in the ticket AC and Verify, with the 1 px tolerances of Design Notes item 6.
- [x] `build-notes.md` -- the two close-out bullets.

**Acceptance Criteria:**
- Given a desktop page on session-won (cell 6 = 24, cell 7 = 21, cell 8 = 7, verified by replay at planning), when cell 6 is hovered for 400 ms, then `[data-hover-peek]` shows the last 14 cards oldest first, with `top` on the last, `+10 older cards` above them and no scrim; cell 8 shows 7 mirrors and no older line.
- Given each ticket AC scenario (placement, `?bands=` below, re-entry timing, cell-to-cell move, threshold close before `mouse.up`, the tail drag from column 2 on session-idle-empty-column, the empty cell, the used cell, no-history, takes-no-clicks, do-nothing press, no reopen, AD-13 hover-then-hold), when run on desktop, then it passes as the ticket states, and `current().session` and storage are unchanged.
- Given `npm run test:all`, then it is green.

## Implementation Notes

- Controller: `hoverTimer` (single slot, with the cell element it was armed for) and `suppressed`
  (one `Element | null`). Entry, leave, crossing, `end()`, `settle()`, `cancel()` and detach as
  in the matrix; `refreshHover()` calls `closeHover()` first when `!deps.hoverFine()`.
- `HoverPeek.svelte` computes x and y in one `$effect` (x is pure, y measured), stored as `placed`;
  the root is `visibility: hidden` until `placed` is set and `placed` resets to null on close.
- The older-cards line is a 500 14px/20px ink-secondary paragraph (DESIGN.md ui-label) with an
  8 px gap above the first row (a technical default).
- e2e: the desktop hover cases run under a paused page clock; `expectNoView`'s animation frames
  would hang there, so they use a frame-free `expectNoViewPaused`.
- Verification: `npm run test:all` green (2018 unit, 364 e2e passed). `npm run test:screens` not
  run: Docker is unreachable in this WSL session. The warm unit suite runs about 5.5 s on this
  checkout both with and without this change (already over the 5 s budget before it).

## Plan Change Log

- 2026-10-07 (ticket 4.13 D5, D6): the hoverFine watcher is the controller-owned `ControllerDeps.watchHoverFine` / `layout.watchHoverFine` (subscribed in `attach`, unwatched on detach) since the 4.12 build review loop pass 1 (4-12-build.md), not App.svelte's refreshHover `$effect`; the matrix, Code Map, Tasks, Design Notes item 2 and Auto Run Result now say so and cite its two Vitests. Added the R-65 sentence → test list (Design Notes); the `?bands=` placement test is named AD-12. The Review Triage Log is left as written at the time.

## Review Triage Log

### 2026-10-07 — Review pass
- verdicts: 27 findings — high 0, medium 0, low 15, false 12, maybe-false 0
- findings:
  - `[false]` `[reject]` blind: the hover delay reuses LONG_PRESS_MS — the ticket Timer paragraph pins it to LONG_PRESS_MS (§7.9 "the same delay").
  - `[false]` `[reject]` blind: the `hoverTimers` helper (ms === 400) cannot tell hover from long-press timers — every assertion is an exact count (controller.test.ts l.2469–2636), so an extra hover arm beside a long-press timer changes the count and fails.
  - `[low]` `[reject]` blind: x comes from a slot formula while y is measured — the plan chose this on purpose (Design Notes item 7: width-only resizes need no listener). The e2e edge assertions on cells 6 and 8 catch any drift. There is no user harm today.
  - `[false]` `[reject]` blind: the room-above check ignores scroll and the sticky top bar — the ticket Layout says it is positioned in the Board root, scrolls with the cell, may draw over the sticky bars and has no viewport clamp.
  - `[false]` `[reject]` blind: nothing closes the hover peek if its cell empties while open — a WordCell's cards change only through commit, Undo or Redo, all of which go through buttons or keys with cancel-first (AGENTS.md), and cancel() now closes it.
  - `[low]` `[reject]` blind: no e2e for the key, back or modal-top close paths — cancel-first is existing wiring with its own tests; the modal-top gate is the existing store gate (overlays tests). An extra e2e is more than a direct fix for an unlikely regression.
  - `[low]` `[reject]` blind: the live re-placement and the App watcher are untested (grouped with the VG watcher and re-placement rows) — rare on desktop (the input type or window changes while hovering); the review log reclassified it as a corner case needing only the controller Vitest, which exists.
  - `[false]` `[reject]` blind: the build-notes record a spec deviation without an owner question — ticket 4.12's owner-gated review loop settled it as a technical default for dev `?bands=` only. In the default order the e2e cell 6 case asserts "above" (room covers the columns).
  - `[low]` `[reject]` blind: `cellOf`/surface styles duplicated from WordCellView — the cost is cosmetic, and a shared helper adds surface.
  - `[low]` `[reject]` blind: the cancel/detach controller test loop is hard to read — cosmetic.
  - `[false]` `[reject]` blind: the peek is wider than the column when slot < 28 — card width w is far above 24 px at every supported viewport (geometry.ts cardWidth), so 7·slot + 28 ≤ 8·slot.
  - `[low]` `[reject]` blind: e2e locators use `.track`/`.board` classes — the alternatives would be new attributes only for tests; a rename fails loudly.
  - `[low]` `[patch]` edge: four desktop hover tests never assert that the Session and storage are unchanged — added stash/unchanged to the takes-no-clicks, re-entry, within-cell and cell-to-cell tests.
  - `[low]` `[reject]` VG: the App reaction (`void layout.hoverFine`) is not tested end to end — same group as the blind watcher row. It needs CDP media emulation that may not fire `change`, and real devices rarely flip mid-hover.
  - `[low]` `[reject]` VG: re-placement while open is not tested — same group. A resize or banner change while hovering is rare, and a clock-paused resize e2e is more than a direct fix.
  - `[low]` `[patch]` VG: settle()'s suppress() is never isolated — added an AD-12 Vitest: a touch drag's fly-back settles with the mouse resting in cell 3, so the next entry does not arm, and out-and-in arms.
  - `[low]` `[reject]` intent: item 9 wording not applied to the ticket file — build-auto never writes ticket files (Design Notes item 9); the behaviour matches.
  - `[low]` `[reject]` intent: the watcher chain is untested — same group as the VG watcher row.
  - `[low]` `[patch]` intent: the inert-column and S-ghost crossings are untested — added an AD-12 Vitest for an inert column (canPickUp false) crossing that closes at the crossing. The S ghost shares the same `p.drag === null` branch.
  - `[false]` `[reject]` intent: item 5 is combined into one Vitest — the buttons ≠ 0 assertion is present and fails if the check is removed.
  - `[low]` `[reject]` intent: the "cell's padding" point is not pinned — card wrappers span the whole slot (F26), so a move inside the cell never crosses the cell boundary. The unit test "a move inside the cell (relatedTarget inside) does not" covers the rule.
  - `[false]` `[reject]` intent: the anchor-box union is never built — above is checked against the label top and below against the cell bottom, the union's only relevant edges (ticket Layout).
  - `[false]` `[reject]` intent: a width-only resize does not re-measure y — the vertical layout does not depend on width at constant w; x follows by CSS.
  - `[false]` `[reject]` intent: openHoverPeek throws if another cell's peek is open — leaving a cell always closes it before the next entry can fire (hoverLeave). A throw would be a real bug (rule 6).
  - `[low]` `[reject]` intent: hard-coded 20px and 14px instead of the DESIGN.md tokens — same values as WordCellView's sheet (the existing precedent). Cosmetic.
  - `[false]` `[reject]` intent: store-level AD-13 expectations rely on existing code — as planned (Code Map "Reuse, don't change").
  - `[false]` `[reject]` intent: the board column measured by stand-ins — the e2e asserts the edges match within 1 px, which verifies the stand-in.

## Design Notes

**Review-log minors, resolved.**
1. Pick-up drag: `closeHoverPeek()` runs in `end()` whenever `p.drag !== null`, so it covers pointerup, pointercancel, lostpointercapture, cancel() and same-id. Any crossing that does not start a pick-up (WordCell, inert column, S ghost in Composing/Game over, a drag-as-tap or a tile) closes at the crossing (build-notes CAP-9 "closes … when the press starts a drag").
2. Watcher: `layout.hoverFine` is `$state` that the media `change` listener updates; the listener then runs every `layout.watchHoverFine` callback. The controller subscribes `refreshHover` through `ControllerDeps.watchHoverFine` in `attach` and unwatches on detach, and `refreshHover()` closes the hover peek when `deps.hoverFine()` is false. App.svelte plays no part. Vitests: `AD-12 a hoverFine change to false closes an open hover peek with no refreshHover() call; detach unwatches` (controller.test.ts) and `AD-11 watchHoverFine runs its callback after every media change, with hoverFine already set, until unwatched` (layout.svelte.test.ts).
3. `cancel()` works when idle (Tasks).
4. Suppression is a single `Element | null` slot, replaced by each mouse press end, fly-back settle and `cancel()`; it is null when the point is in no cell or `lastPoint` is null. Touch press ends leave it, because `lastPoint` is mouse-only (ticket: "any mouse press end"). An entry's relatedTarget is outside the cell or null.
5. The `buttons ≠ 0` Vitest is in the Tasks list.
6. Vertical checks in e2e: above, `bottom ≤ label top + 1`; below, `top ≥ cell bottom − 1`; horizontal edges within 1 px.
7. Placement is reactive: x is pure CSS plus the column-relative helper. Width-only window resizes therefore need no listener, because the `.board` column is centred by `safe center`, matched by `max(0px, (100% − board)/2)`. y comes from an `$effect` over the layout state and the count. The root renders only while `overlays.hoverPeek` is set, so the hide class dies with the close.
8. Two bullets go into build-notes §DESIGN.md close-out edits. (a) Hover peek surface: view-sheet surface, `{rounded.lg}`, 16 px padding, content-sized width `min(n,7)·(w+4) − 4 + 32` (a technical default; DESIGN.md View sheet does not state it). (b) The below branch, which may leave the board vertically (overriding "clamped inside the board"), occurs only with dev `?bands=` orders.
9. The Description wording ("only when the cell holds more than 14 cards") is used in this plan. The ticket file is not edited (build-auto never writes tickets).
10. Counts were verified by replaying the fixtures (Vitest probe, 2026-10-07): session-won cells 6/7/8 = 24/21/7; session-idle-empty-column cell 7 = 7; session-gave-up-after-commit cell 3 = 0, cell 7 = 7; session-place-free-letter-redo-tail cell 3 = 3, `used`. The e2e asserts the counts through the `GameView` or mirror counts.

**R-65 sentence → test (hover peek, `desktop` P4 in `e2e/wordcell-view.spec.ts`).** Ticket 4.13 D6. The long-press peek and sticky view tests in the same file cover R-65 on `android`; this list is the hover gesture (§7.9 "On desktop, hovering the cell for the same delay opens the same overlay").
- "The player may view every card of any WordCell at any time (Q-21), via the view gesture chosen by the UX step": `R-65 hover 400 ms on session-won cell 6 shows its last 14 cards oldest first, top tagged, +10 older cards, above the anchor at the column’s left edge, no scrim; leave closes it` (Game over); `R-65 hover 400 ms on session-won cell 8 (7 cards) shows 7 mirrors and no older line, its right edge on the column’s right edge`; `R-65 hovering session-idle-empty-column’s cell 7 for 400 ms opens its hover peek` (Idle); `R-65 the used cell 3’s hover peek shows an unhatched mirror tagged top; one live element per card; a do-nothing click keeps it open` (Place); `R-65 R-75 session-gave-up-after-commit’s empty cell 3 hovered 600 ms opens nothing` (an empty cell has no cards to view). The `(§7.9 proposes long-press; the Playwright test binds to the gesture UX confirms)` parenthesis is process (exempt). Placement only, no R-65 sentence: `AD-12 with the WordCell row under the top bar (?bands=), no room above: the hover peek sits below the cell`.
- "Viewing changes nothing: only the top card is usable (R-33)": `R-65 a click on the cell while the hover peek is open does its phase action (Game over: the sticky view), hover peek gone`; `R-65 the hover peek takes no clicks: pointer-events none; elementFromPoint at its centre is outside it`; `R-65 the used cell 3’s hover peek shows an unhatched mirror tagged top; one live element per card; a do-nothing click keeps it open`. Every R-65 test above also asserts `current().session` and storage unchanged (`stash`/`unchanged`).
- "the view does not enter the move history": `R-65 opening and closing a hover peek leaves Undo/Redo enablement and window.history.length unchanged`.

`?bands=topBar,banner,wordcells,leftover,columns,tray,actionBar`: the room above is only the top bar plus the banner, so any 7-card hover peek goes below. Assert `anchor top − board top < height` first.

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npm run test:screens` -- expected: baselines unchanged (no hover in any baseline; `.board-root` gains only `position: relative`). If Docker is unreachable, record that.

## Auto Run Result

- **Summary:** Desktop hover peek (CAP-9, F19, F27). A 400 ms mouse hover on a non-empty WordCell opens `HoverPeek.svelte` through `overlays.hoverPeek`. It shows the top 14 cards as `view` mirrors (oldest first, top tagged) and a `+n older cards` line only when the cell holds more than 14. It sits above the cell's label, clamped to the board column, or below the cell when there is no room (dev `?bands=` only). It is `aria-hidden`, takes no clicks and has no scrim. In the controller, the timer is mouse-only, gated by a live `layout.hoverFine`, with a single-slot suppression after mouse press ends, fly-back settles and `cancel()`. A pick-up drag hides the peek (DOM) at the crossing and closes it in `end()`; any other drag closes it at the crossing. `cancel()` (idle too), detach and hoverFine → false close it.
- **Files:**
  - `src/ui/gestures/controller.ts`: hover timer, suppression, crossing and end closes, idle `cancel()`.
  - `src/ui/HoverPeek.svelte` (new): render and placement.
  - `src/ui/hover-peek.ts` (new): pure slice, width and placement helpers.
  - `src/ui/layout/layout.svelte.ts`: live `hoverFine` getter and `watchHoverFine`.
  - `src/main.ts`: layout created before the controller; `hoverFine` and `watchHoverFine` deps.
  - The hoverFine watcher is the controller's `ControllerDeps.watchHoverFine` subscription (attach/detach), not App.svelte (unchanged).
  - `src/ui/Board.svelte`: `.board-root` `position: relative`; renders HoverPeek.
  - `src/ui/WordCellRow.svelte`: `data-wordcell-label`.
  - `src/ui/text.ts`: `olderCards`.
  - Tests: `controller.test.ts` (20 AD-12 cases), `hover-peek.test.ts` (new), `layout.svelte.test.ts`, `text.test.ts`, and `e2e/wordcell-view.spec.ts` (15 desktop cases).
  - `build-notes.md`: two DESIGN.md close-out bullets.
- **Ticket review-log minors:** all ten resolved, as in Design Notes items 1–10. Item 9 is applied in this plan and in the behaviour (the ticket file is never written by build-auto). Item 10: the fixtures were replayed (session-won cells 6/7/8 = 24/21/7) and the e2e asserts the counts.
- **Review:** 27 findings (high 0, medium 0, low 15, false 12).
  - 3 patched (all low, test-only): Session/storage-unchanged assertions on four desktop tests, a Vitest isolating fly-back-settle suppression, and a Vitest for an inert column crossing.
  - 24 rejected, with reasons in the Review Triage Log; 0 deferred.
- **Follow-up review recommended:** false (patched: high 0, medium 0, low 3).
- **Verification:** `npm run test:all` green twice: before review (2018 unit, 364 e2e, 14 dist, 12 pwa) and after the patches (exit 0: lint, check, 2020 unit in 47 files, build within budget, 14 dist, 364 e2e, 12 pwa). The new desktop cases ran (not skipped). `npm run test:screens` not run: Docker is unreachable from this WSL2 distro. The baselines are expected unchanged (no hover in any baseline; `.board-root` gains only `position: relative`).
- **Residual risks:**
  - The screenshot baselines are unverified until `test:screens` runs in the container.
  - The hoverFine watcher (controller-owned `watchHoverFine`) and the live re-placement while open are covered only at unit level: the watcher by the AD-12 controller and AD-11 layout Vitests named in Design Notes item 2; a media flip mid-hover is not driven end to end (rejected as a rare desktop corner case).
  - The warm unit suite measured about 5.5 s on this checkout before and after this change; this predates the change and is for entry 13's AD-17 re-measure.
