---
title: 'Tap-select, foot pads and tap-drop'
type: 'feature'
ticket: '7'
created: '2026-10-02'
status: done
route: 'full'
route_source: 'auto'
baseline_revision: '7766b236fa4bd5efd741c1131e6da07573c8f1b6'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-tap-select-foot-pads-and-tap-drop.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/rule-coverage.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The controller classifies presses but acts on none: no tail can be tap-selected, dropped by a second tap, re-selected or deselected by an outside tap, and the board shows no selection, `Here` pad, foot wash or desktop hover (R-14 tap half, Q-18, SPEC CAP-6, F25, F26, F31).

**Approach:** Ticket 4.7's Description is the contract, read with the review-log resolutions in Design Notes. A pure `intent.ts` decides tap and hover outcomes from the pointerdown hit, `GameView` and the selection; the controller performs them on a released tap (select / re-select / deselect then `drop` / F25 deselect) and toggles hover classes on `[data-column]` elements; `Column`/`Card` render the lift, the one tail outline, `Here` and the wash from `overlays.selection`.

## Boundaries & Constraints

**Always:** act only on `classify`'s final `'tap'` at the pressing pointer's `pointerup` (a non-empty WordCell long-press and a drag do nothing; the empty-WordCell long-press is already a tap), after `end()`; the hit is the one resolved at pointerdown (`elementFromPoint`), column membership and card index come from `game.view` at tap time (AD-3); a tap-drop is `overlays.deselect()` then `game.dispatch({ type: 'drop', sourceColumn, sourceCount, destinationColumn })` only when the destination's `canDropOn`; select only when the column's `canPickUp`, `count = cards.length − index`; F25 outside deselect only when `overlays.top === 'tailSelection'` (a view above keeps it, no throw); with a selection, empty-space, placeholder and foot presses are captured (`[data-foot]` for foot presses, else `[data-column]`) so their contextmenu is suppressed; Undo, Redo and banner Reload handlers call `overlays.deselect()` first (after act()'s `cancel()`); hover only for `pointerType === 'mouse'`, CSS under `@media (hover: hover) and (pointer: fine)`, classes only on `[data-column]` elements (Svelte owns `.card`'s class attribute and would wipe them); lifted faces keep `pointer-events: none` and the slot wrappers never move (F26); cite ids in tests (`R-14 …`, `AD-13 …`; UI Vitest always `AD-n`).

**Never:** add a new export to `src/engine/index.ts` or any engine change; add drag, view or peek behaviour (entries 8–12); store hover in Svelte state; listen outside the App root or on `pointerdown` for F25; change screenshot baselines (fixtures render no selection); write a fallback beyond the ticket's disabled-control wrapper.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Select | nothing selected, tap column `c` card at index `i`, `canPickUp` | `overlays.select(c, len − i)`; no dispatch; wc 1 | — |
| Inert | nothing selected: column empty space / placeholder / foot, WordCell, outside, `canPickUp` false | nothing (no dispatch, select or nav) | — |
| Tap-drop other | selection `{s, n}`, tap any card / space / placeholder / foot of column `c ≠ s` | deselect, then `drop(s, n, c)` | `canDropOn` false → nothing |
| Self-drop | selection, tap source empty space / placeholder / foot (Here) | deselect, then `drop(s, n, s)` (partial → k 1, whole → k 0) | — |
| Re-select | selection, tap source card index `i`, `len − i ≠ n` | `overlays.select(s, len − i)`; no nav call | — |
| Selected card | `len − i === n` | no-op (selection, wc kept) | — |
| WordCell | selection, tap (or empty-cell long-press release) | `deselect()`; no view | — |
| Outside (F25) | selection, `other` hit (bars' background, score, tray band/tile, labels, gaps, leftover, banner background, side margins, disabled control) | `deselect()` iff top is `tailSelection` | view on top → selection kept, no throw |
| Non-pointer click | `click` with `detail === 0` whose target resolves outside, top `tailSelection` | `deselect()`; a pointer tap's trailing click (`detail ≥ 1`) ignored | — |
| Long-press / drag / pan | non-empty WordCell long-press; drag; `pointercancel` pan | selection kept | — |
| Hover (mouse) | Idle playing, none selected, column card `i` with `canPickUp` | `[data-column]` gets the tail outline from `i` + cursor `grab` | — |
| Hover drop | selection; column `c ≠ s` anywhere (cards, space, foot) | drop-target on `c`'s bottom card or placeholder | — |
| Hover self | selection; source empty space / placeholder / Here | partial: lowest non-tail card highlighted; whole column: Here pad (F31) | source card ≠ selected → re-select outline; selected card → nothing |

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` -- `resolve()` (extend `Resolved` with a `hit` description: column card `{column, cardId}`, column space `{column, foot}`, wordcell, outside; capture for non-card column parts when `overlays.selection !== null`), `pointerup` (outcome after `end`), `LISTENED`/`handlers` (add `pointerover`, `pointerout`, `click`), `Controller` type (add `refreshHover(): void`), detach clears hover classes. Keep the entry 6 end/gate/contextmenu invariants untouched.
- `src/ui/gestures/classify.ts` -- `classify(state, {type:'up'})` already returns `'tap'` for an empty-WordCell long-press. Do not change.
- `src/ui/overlays.svelte.ts` -- `select` (re-select same column: no push), `deselect` (no-op when none; throws if top ≠ tailSelection), `top`, `selection`. Do not change.
- `src/engine/view.ts` 39–47, 176–183 -- `ColumnView.canPickUp`/`canDropOn` (Idle only); any tail is legal (`sourceCountAllowed`). `drop` command shape in `src/engine/commands.ts:33`.
- `src/ui/Column.svelte` -- `.cards` (relative, flex column: placeholder first, then cards; card `i` top at `i × --wc-strip`; last card `full`), `.foot` (`data-foot`, `.number` desktop-only). Add `selection` prop.
- `src/ui/Card.svelte` -- `.face` (relative, `pointer-events: none`, `margin: 0 2px`); add a `lifted` prop. Svelte owns the wrapper's class attribute.
- `src/ui/Board.svelte` -- passes props to `Column`; pass `selection={overlays.selection}`. Sticky bars and banner have `z-index: 2`.
- `src/ui/App.svelte` -- add the hover-refresh `$effect` (reads `overlays.selection` and `game.view`, calls `controller.refreshHover()`).
- `src/ui/TopBar.svelte` (`undo`, `redo`), `src/ui/DictionaryBanner.svelte` (`reload`), `src/ui/ActionBar.svelte` (primary disabled in Idle) -- deselect first; disabled-control wrapper only if the probe requires it.
- `src/ui/text.ts` -- add `here: 'Here'` (EXPERIENCE.md Foot pad, Information Architecture row 200).
- `src/ui/app.css` -- tokens `--wc-accent-teal` (#3dbdb5), `--wc-surface-raised`, `--wc-outline`.
- `src/ui/gestures/controller.test.ts` -- fake root/elements/events, settable `shared.view`, nav call log; add a `dispatch` spy to the `game` mock.
- `e2e/pointer.spec.ts` (`openFixture`, `centre`, `stashSession`/`sameSession`, `contextmenuPrevented`), `e2e/helpers/dialogs.ts` (`wc`, `expectLeaves`, `hitAt`), `e2e/helpers/touch.ts` (`touchHold`, `longPress`, `touchDrag`), `e2e/helpers/restore.ts`, `e2e/helpers/seed.ts` -- reuse; move shared helpers into `e2e/helpers/` only with a `helpers.spec.ts` case.
- `e2e/layout.spec.ts` -- entry 4's scrolling viewport setup for the tray-band pan case; its tests must stay green.
- `e2e/blocking.spec.ts` `§2 Session rejected` -- add the New-game-then-select case.
- Fixtures: `session-idle-fresh` (column 5 self-drops, column 1 F26), `session-idle-empty-column` (placeholder, Undo), `session-idle-pending-draft` (Redo).
- Read before editing: spine AD-3, AD-11, AD-12, AD-13, AD-14; SPEC CAP-6, F25, F26, F30, F31; DESIGN.md Elevation & Depth, Card states, Focus ring, Column slot; EXPERIENCE.md Mouse and hover.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/intent.ts` -- pure (no DOM; `import type` from `../../engine/index` and `../overlays.svelte`): `Hit` union; `tapAction(hit, view, selection, top) → { kind: 'select'; column; count } | { kind: 'drop'; sourceColumn; sourceCount; destinationColumn } | { kind: 'deselect' } | { kind: 'none' }` per the I/O matrix (F25 rows return `deselect` only when `top === 'tailSelection'`; `drop` already implies deselect-first in the controller); `hoverAction(hit, view, selection) → { column; kind: 'tail'; from; grab: boolean } | { column; kind: 'drop' } | { column; kind: 'dropSelf' } | null` (Idle playing only; `status !== 'playing'` or non-Idle → null) -- SPEC CAP-6, DESIGN.md Card states.
- [x] `src/ui/gestures/intent.test.ts` -- `AD-12` cases, one per matrix row, including: re-select above (grow) and inside (shrink), selected card no-op, whole-column select (`index 0`), `canDropOn`/`canPickUp` false, outside with `top 'wordcellView'` → none, hover rows (another column's foot → drop; source card ≠ selected → tail outline; selected card → null; whole-column self hover → dropSelf).
- [x] `src/ui/gestures/controller.ts` -- resolve the `Hit` at pointerdown; capture non-card column parts when a selection exists; on `pointerup` with outcome `'tap'`: `end()`, then perform `tapAction` (`select`, `deselect`, or `deselect` + `game.dispatch(drop)`); `click` listener: only `detail === 0` events whose target resolves `outside` run the F25 path; hover: track the last mouse point inside the root (`pointerover`/`pointermove`, cleared by a `pointerout` whose `relatedTarget` is outside the root), `pointerover` and `refreshHover()` recompute `hoverAction` at that point via `elementFromPoint` and swap classes `wc-hover-tail` (+ `--wc-hover-from`), `wc-grab`, `wc-drop`, `wc-drop-self` on at most one `[data-column]` (old one cleared first); detach clears them -- AD-12, F25, F31.
- [x] `src/ui/gestures/controller.test.ts` -- `AD-12`/`AD-13` cases: held column-card press released without a drag selects (ticket AC S); with `openView` above a selection an outside tap keeps it and does not throw (ticket AC S); tap-drop calls `deselect` (nav `pop`) before `dispatch` (order log); re-select no nav call; a drag or non-empty WordCell long-press changes nothing; a non-card column press is captured and its contextmenu prevented only with a selection; `click` with `detail 0` outside deselects, `detail 1` does nothing; `refreshHover` toggles and clears the column classes (fake `classList`/`style.setProperty`).
- [x] `src/ui/Card.svelte` -- `lifted` prop → `.lifted .face { transform: translateY(-8px); box-shadow: 0 6px 16px #0008; z-index: 3 }` (face only; wrapper and `pointer-events` unchanged) -- F26, DESIGN.md Elevation & Depth.
- [x] `src/ui/Column.svelte` -- `selection: TailSelection | null` prop; lifted cards `i ≥ len − count` on the source; one `[data-selection-outline]` element in `.cards` (absolute, `pointer-events: none`, `z-index: 3`, over the union of the lifted faces: `top: (len − count) × strip − 8px`, `left: 2px`, `width: --wc-w`, `height: (count − 1) × strip + H`, `outline: 2px solid var(--wc-accent-teal)`, radius 6 px); foot: `Here` span (`text.here`, visible on every device) on the source, `.number` hidden while any selection exists, other feet the 8 % teal wash + 1 px dashed `--wc-outline` border, source foot `--wc-surface-raised`; every foot `touch-action: none` while a selection exists, `var(--wc-pan)` otherwise; hover CSS under the media query: `.wc-hover-tail` shows a 1 px teal outline element from `--wc-hover-from` to the bottom card, `.wc-grab` cursor `grab` on cards, `.wc-drop` 3 px teal outline + 12 % teal wash on the bottom (`.full`) card's face or the shown placeholder, `.wc-drop-self` the same on the lowest non-tail card (partial) or the Here pad (whole column, F31) -- DESIGN.md Column slot, Card states, AD-11 row.
- [x] `src/ui/Board.svelte`, `src/ui/App.svelte`, `src/ui/text.ts` -- pass `selection`; the `$effect` hover refresh; `here`.
- [x] `src/ui/TopBar.svelte`, `src/ui/DictionaryBanner.svelte` -- `overlays.deselect()` first in `undo`, `redo`, `reload`.
- [x] Disabled-control probe -- first write the e2e taps on the disabled primary-action, Undo, Redo (and banner Reload during a held retry if reachable) with `page.touchscreen.tap` (android) and `page.mouse.click` (desktop) at the box centre. If any project gets no pointer events at the root, give each disabled-able button `pointer-events: none` only while disabled inside a same-box non-button wrapper that carries the button's `title` only while disabled (F3 tooltips unchanged); role, name, `data-testid` stay on the button; baselines and locators unchanged. Record the probe result in Implementation Notes.
- [x] `e2e/tap.spec.ts` (new; android unless stated) -- one test per ticket AC Playwright clause, named by id: `R-14 a tap-select dispatches nothing …` (Session reference and storage unchanged, wc 1); `R-14 with nothing selected …` inert taps (wc 0); `R-14 R-20 …` tap-drop on another column's bottom card **and an upper card**; `R-14 R-22 …` placeholder (`session-idle-empty-column`); empty space and foot of another column; `R-14 R-11 R-22 …` self-drops on `session-idle-fresh` column 5 via its empty space (partial, k 1) and via a corner of `foot-5` off the label (whole column, k 0); selected card no-op; `R-14 R-10 …` re-select grow and shrink with wc kept and the next drop's `sourceCount`; WordCell taps (empty and non-empty) and empty-WordCell long-press release; every F25 outside region and the disabled primary-action (dictionary ready first), Undo and Redo; non-empty WordCell long-press and tray-band pan at entry 4's scrolling viewport keep it; Undo (`session-idle-empty-column`), Redo (`session-idle-pending-draft`) and banner Reload (dictionary URL aborted → failed) clear then act; `AD-13 …` pops on drop, deselect, Undo, Redo; back clears (app open, wc 0); reload shows nothing selected, Session unchanged; select-reload-back leaves the app (`expectLeaves`); `AD-12 …` P4 computed style (faces: `box-shadow`, `translateY(-8px)`, wrappers' rects unchanged; outline element 2 px teal enclosing the lifted faces' union; source foot `Here` visible on android on surface-raised, other feet wash and dashed border); `AD-12 F26 …` at 360 × 750 (slot-margin tap, bottom-8-px re-select, 8 px above the lifted tail re-select); `AD-11 …` foot row computed `touch-action` none with a selection, `pan-y` without, and a held non-card **column** press's contextmenu prevented with a selection. Desktop describe: grab outline + cursor, drop-target on another column (card, space, foot) and on the source only over empty space / Here, re-select outline, nothing on the selected card including right after a click-select without moving, F31 Here pad for a whole column, side-margin click and box-centre clicks on the disabled controls deselect, back with the mouse resting on another column's empty space leaves no `wc-drop`.
- [x] `e2e/blocking.spec.ts` -- `§2 AD-13 New game from a rejected Session, then a tap selects` (`session-invalid-null.json`): New game, tap a column card, `history.state.wc` 1.

**Acceptance Criteria:**
- Given `npm run test:all`, when run, then it passes, and `npm test`'s warm median is recorded (AD-17 5 s budget).
- Given `npm run test:screens` in the container, when run, then the four `board.screens.spec.ts` renders match their baselines unchanged in both projects.
- Given any selected tail, when its faces lift, then `elementFromPoint` at each card's original slot still returns that card's wrapper (F26).

## Implementation Notes

- Disabled-control probe (Playwright 1.63.0 Chromium, `session-idle-fresh`, dictionary ready): `page.touchscreen.tap` (android) and `page.mouse.click` (desktop) at the box centre of the disabled Undo, Redo and primary-action each deliver `pointerdown` and `pointerup` to the App root (target the icon `svg` for Undo/Redo, the `BUTTON` for primary-action) in both projects. No wrapper was added; the F25 outside path handles them (tap.spec `R-14 F25 …` android and desktop cases). Banner Reload while held disabled not probed separately (same element kind).
- `Hit` adds a `tile` kind (tray/strip tile or tray mirror, inert per F23) beside the plan's card / space / wordcell / outside.
- Column empty space exists only below 6-card columns of `session-idle-fresh` (the columns band fits 7 cards exactly), so empty-space taps and hovers use columns 5–8.
- The reload test compares the stored Session without `activeMs` (the hide flush accrues it, AD-9).
- Hover tail outline follows the 8 px lift on the source column via `--wc-lift`/`--wc-lift-start` on `.cards`.
- `npm test` warm median (3 runs after a warm-up): 4.73 s (4.76, 4.73, 4.71) under the AD-17 5 s budget.
- `npm run test:all`: pass (size budget total 501056 / 600000). `npm run test:screens`: Docker is not wired into this WSL distro, so the orchestrator ran the same container command through the Windows `docker.exe` with the `D:\CodeProjects\wordcell` mount: 8 passed, the four `board.screens.spec.ts` baselines unchanged in both projects.

## Plan Change Log

## Review Triage Log

### 2026-10-02 — Review pass
- verdicts: 25 findings — high 0, medium 1, low 13, false 7, maybe-false 4
- findings:
  - `[low]` `[patch]` (blind) a tray/strip tile tap with a selection returned `none`, against the plan matrix's Outside row (tray band/tile) — `tapAction` now treats `tile` like `outside` when a tail is selected (deselect iff top is `tailSelection`); intent test updated
  - `[false]` `[reject]` (blind) Undo/Redo/Reload `overlays.deselect()` throws with a view above a selection — no `openView` caller exists in this tree, so the state is unreachable; entry 11 owns taps and handlers under a view (Design Notes)
  - `[maybe-false]` `[reject]` (blind) hover classes stale when the layout moves under a still mouse (banner, resize) — would need a check of whether Chromium's post-layout hover update dispatches `pointerover`; if true only low (desktop, cosmetic, cleared by the next mouse move)
  - `[false]` `[reject]` (blind) plan metadata (`ticket: '7'`, empty change log, `remainderTop` not in the plan) — `ticket` is find's id per the template; no loopback happened; Design Notes name `.remainder-top`; fix would edit the plan
  - `[false]` `[reject]` (blind) `remainderTop` comment cites R-21 wrongly — DESIGN.md Card states cites R-21 for exactly this element ("the future top of D (R-21)")
  - `[low]` `[reject]` (blind) non-pointer click F25 path has no Playwright test — no focusable outside element exists, so only programmatic clicks reach it; covered by controller Vitest; adding an e2e path is not a direct correction
  - `[low]` `[reject]` (blind) Inert row: outside tap with nothing selected and canPickUp-false card not in e2e — canPickUp is false only outside Idle (entry 10, review log pass 2); intent Vitest covers both
  - `[low]` `[reject]` (blind) desktop never drops by mouse click — the ticket's desktop AC lists hover and outside clicks only; the same pointer path is covered on android
  - `[maybe-false]` `[reject]` (blind) partial self-drop highlight on the remainder-top face may be mostly covered; lift over the bar untested — DESIGN.md prescribes that element and layer order; visibility would need a screenshot review; if true only low
  - `[low]` `[patch]` (blind) side-margin click at `board.x / 2` not guarded; `about:blank` URL check weak — added `expect(board.x).toBeGreaterThan(8)`; the URL check is backed by the `card-0` visible assertion (kept)
  - `[low]` `[reject]` (blind) `pointermove`-only hover and outside `pointerover` clearing not unit-tested — same `track`/`refreshHover` code, `refreshHover` clears first (tested); unlikely to regress silently
  - `[low]` `[reject]` (blind) `ender === enders[0]` assertion depends on array order — cosmetic test style
  - `[low]` `[patch]` (blind) controller header comment line ~130 chars — rewrapped to ~100, wording unchanged
  - `[false]` `[reject]` (edge) lifted faces and outlines (z-index 3) paint over the sticky bars when scrolled — DESIGN.md Elevation & Depth layer order puts selection/lift above the sticky bars ("A lifted or dragged tail passes over the bars"); all are `pointer-events: none`
  - `[medium]` `[patch]` (verification-gap) empty-column placeholder hover drop target and the 12 % wash never asserted — added desktop `AD-12 hover with a tail selected: an empty column's placeholder shows the drop target` (class, 3 px teal outline, 12 % wash via probe) and the wash assert on the bottom-card face
  - `[low]` `[patch]` (verification-gap) re-select hover outline position under the 8 px lift unchecked — added box comparisons after hovering column 5 cards 1 and 5
  - `[low]` `[reject]` (intent) AD-11 contextmenu e2e is synthetic and presses empty space, not the foot — the AC's "held non-card column press" is met; the synthetic dispatch is the entry 6 pattern and the on-device check is deferred there; foot capture is in controller Vitest
  - `[false]` `[reject]` (intent) hover after Undo/Redo/Reload not e2e-tested — review log pass 4 narrowed the AC to back only (Undo cannot run with a still mouse)
  - `[low]` `[patch]` (intent) re-select outline extent and wash not asserted — same root cause as the two verification-gap rows; fixed by those patches
  - `[low]` `[reject]` (intent) partial self-drop via Here and whole-column via empty space not in e2e — the AC pairs one surface per k; intent Vitest covers the rest
  - `[low]` `[reject]` (intent) banner Reload full-reload branch untested — needs a 404 then a page reload; recorded in Design Notes (AD-13 launch rewind)
  - `[low]` `[patch]` (intent) tile with a selection: plan and code disagree — same root cause as the first blind row; fixed there
  - `[false]` `[reject]` (intent) reload compare excludes `activeMs` — the hide flush accrues it (AD-9); the game itself is compared unchanged
  - `[maybe-false]` `[reject]` (intent) banner Reload held-disabled state not probed — same element kind as the probed buttons; would need a held retry probe; if true only low (wrapper fallback)
  - `[maybe-false]` `[reject]` (intent) `test:screens` green not shown in the diff — ran it: 8 passed, baselines unchanged (Implementation Notes); counted maybe-false only because the diff alone cannot show it

## Design Notes

**Review-log resolutions (ticket 4.7).** Open major (Here on android) → Column task: a separate `Here` span, visible on every device, and the P4 "Here visible" assert on android. Unapplied minors: "in any project" → disabled-control probe task; "held non-card column press" → AD-11 test; "With nothing selected, …" governs Select and the WordCell clause → I/O matrix (a card tap of another column with a selection is a drop, never `select`), and the R-20 drop also taps an upper card; wrapper title only while disabled → probe task; whole-column self-drop on column 5 → tap.spec; disabled primary-action waits for the dictionary → tap.spec; faces keep `pointer-events: none` → Card task; hover reaction as an App `$effect` calling `refreshHover` (a `Controller` member, no new module export); last point inside the root only; hover computed-style asserts; score text, another column's foot → matrix; `pointerType 'mouse'` only; capture element `[data-foot]`/`[data-column]`; a drag with a tail selected keeps it (entries 8–9 add drag); whole-column lift over the bar above → `z-index: 3` on faces and outline, above the bars' 2. Column and WordCell paths under a view are unreachable here (entry 11's scrim); `deselect()` there would throw, which is entry 11's to classify.
- **Banner Reload full reload:** after a 404, `retry()` calls `location.reload()`; the `deselect()` before it queues `nav.pop()` that may not run, and AD-13's launch rewind on the next boot drops the stale entry. Only the in-place path is tested.
- **Deselect-before-act order per handler:** checked by code review only; the Playwright tests prove the end state (wc 0 and the move changed), not the order. No Svelte component Vitest harness exists, so no per-handler spy test (rejected as plan-level minor).
- **Owner decision F31 (ticket Notes, 2026-10-02):** desktop, whole column tap-selected, hovering that column's empty space or Here pad lights the Here pad with the 3 px teal outline and 12 % wash (`wc-drop-self` on a whole-column selection).

**Why hover classes go on `[data-column]`:** `Card.svelte`'s wrapper class attribute is rebuilt by Svelte on any `class:` change, which would drop controller-added classes; the column element's class is static. Column CSS maps the column class to the right child (bottom `.full` card, shown placeholder, `.remainder-top` card, Here pad, outline element).

## Verification

**Commands:**
- `npm run lint && npm run check` -- expected: clean.
- `npm test` -- expected: all pass; warm median recorded (3 runs after a warm-up).
- `npx playwright test e2e/tap.spec.ts e2e/pointer.spec.ts e2e/blocking.spec.ts e2e/layout.spec.ts` -- expected: pass on android and desktop.
- `npm run test:all` -- expected: pass.
- `npm run test:screens` (Docker) -- expected: pass with baselines unchanged.

## Auto Run Result

**Summary.** Ticket 4.7 built: a pure `intent.ts` (`tapAction`, `hoverAction`) and controller tap handling: tap-select through `overlays.select`, re-select with no new entry, selected-card no-op, tap-drop (`deselect()` then one `drop`) on any part of another column and on the source column's empty space or Here pad, WordCell and empty-WordCell long-press deselect, the F25 outside-tap deselect gated on `top === 'tailSelection'` (non-pointer `click` only for `detail === 0`), tail-selected capture of non-card column presses; selection visuals (faces lifted 8 px with the shadow, one 2 px teal outline, `Here` pad on every device, foot wash and dashed border, foot row `touch-action: none`); desktop hover classes on `[data-column]` refreshed by an App `$effect` (grab outline, drop target, re-select outline, F31 Here pad); Undo, Redo and banner Reload deselect first.

**Files.**
- `src/ui/gestures/intent.ts` (+test) — pure tap and hover outcomes.
- `src/ui/gestures/controller.ts` (+test) — Hit resolution, tap actions, non-pointer click, hover classes, `refreshHover`.
- `src/ui/Card.svelte`, `src/ui/Column.svelte` — lift, outline, Here, wash, foot touch-action, hover CSS.
- `src/ui/Board.svelte`, `src/ui/App.svelte`, `src/ui/text.ts` — selection prop, hover reaction, `here`.
- `src/ui/TopBar.svelte`, `src/ui/DictionaryBanner.svelte` — deselect before acting.
- `src/ui/act.test.ts` — fake controller gains `refreshHover`.
- `e2e/tap.spec.ts` (new), `e2e/blocking.spec.ts` — android and desktop Playwright coverage.

**Review.** 25 findings: patched 1 medium, 5 low (tile as outside with a selection; placeholder hover and 12 % wash asserts; re-select outline position; side-margin guard; comment wrap). No deferrals. Rejected: 7 false, 4 maybe-false, 8 low, each with its reason in the triage log.

**Follow-up review:** false (first pass; no high and one medium patched).

**Verification.** `npm run test:all` exit 0 after the patches (unit 1877 passed, dist-smoke 14, dev e2e 284 passed, pwa 12); warm unit median 4.73 s (under 5 s, little headroom). `npm run test:screens` run through the Windows `docker.exe` (Docker is not integrated into this WSL distro): 8 passed, baselines unchanged; the review patches changed only tests, `intent.ts` and a comment, no CSS, so it was not re-run. The container run leaves a root-owned `test-results/` that blocks the next host Playwright run; it was removed through the container.

**Residual risks.** Unit suite close to the 5 s budget. Undo, Redo, Reload and column/WordCell taps call `deselect()`, which throws with a view above a selection: unreachable now, entry 11 must classify them. Banner Reload's full-reload path rests on AD-13's launch rewind (untested). Hover may stay stale until the next mouse move when the layout shifts under a still mouse.
