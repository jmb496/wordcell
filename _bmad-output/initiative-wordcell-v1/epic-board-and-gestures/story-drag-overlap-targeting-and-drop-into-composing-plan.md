---
title: 'Drag, overlap targeting and drop into Composing'
type: 'feature'
ticket: '8'
created: '2026-10-02'
status: 'built'
route: 'full'
route_source: 'auto'
baseline_revision: '472db5238a40f7bb92757807ae449320e01d4212'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-drag-overlap-targeting-and-drop-into-composing.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/rule-coverage.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The controller latches a drag but does nothing with it: no tail follows the finger, no column lights, release never drops, and nothing flies back (R-14 drag half, Q-34, SPEC CAP-7, AD-12, F12, F13, F26).

**Approach:** Ticket 4.8's Description and Acceptance Criteria are the contract, read with the review-log resolutions in Design Notes (they override the ticket's wording where they differ). A pure `targeting.ts` `pickTarget` picks the column; a `dropTarget` action registers column hit rects; the controller drives the drag by DOM only (transform, classes), dispatches at most one `drop` at release on `highlighted`, and otherwise flies the tail back with WAAPI, gate-counted.

## Boundaries & Constraints

**Always:** drag only from a `[data-place="column"]` card press of a column whose `canPickUp` is true (read from `game.view` at threshold), tail = pressed card to the bottom (R-10); the threshold-crossing move is the first drag move; each drag move writes `translate(dx px, dy px)` (pointer − press point) inline on every tail face, then measures the grabbed (tail[0]) face's `getBoundingClientRect()` against every registered column element's live rect; the controller (not `pickTarget`) sets `hasLeftSource` when `raw !== sourceId`, `null` included (AD-12); no Svelte state change, store call or dispatch before release (F12); release drops on the last-shown `highlighted` (deselect first when a selection is open), else flies back; every drag class and the inline transform are gone before a drop dispatches; all durations from `motion.ts` `duration('flyBack')`; CSS for the drag classes in `Column.svelte` `:global` selectors, outside any media query; test names cite ids (UI Vitest always `AD-n`).

**Never:** engine changes or new `src/engine/index.ts` exports; a DnD library; moving or cloning any element mid-drag (no mirror, AD-14, F26); Card's `.ghost` styles on dragged faces; entry 9's scope (selection-class removal/restore at threshold, release-over-nothing deselect, press-during-fly-back `finish()` + re-resolve, Undo/hide/back drag P4s), entry 10's Composing destination-card drag; hover in Svelte state; changing screenshot baselines (no static render changes).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Drop other | Idle, drag column `s` tail of `n` released with `highlighted = c ≠ s` | transform/classes cleared, then one `drop(s, n, c)` | `canPickUp` false → no drag |
| Flick | one move from press straight onto column `c` ≥ 25 %, release | drop on `c` | — |
| Never left | moves while `raw` stays `s` (or below 25 % over `s` only) | no highlight at any step; release flies back, no dispatch | — |
| Leave & return | `raw` ≠ `s` once (another column or null), then back on `s` | `s` highlighted (partial: lowest non-tail wrapper; whole: placeholder revealed); release self-drop | — |
| Over nothing | release over the WordCell row / bars | fly-back over `duration('flyBack')`, gate entered then left, no dispatch | — |
| Reduced motion | `prefs.motion.reduced` | transform cleared at once, faces fade opacity 0 → 1 over `duration('flyBack')` (120 ms), gate-counted | — |
| Platform end | `pointercancel`, `lostpointercapture`, `cancel({ byBack: true })` mid-drag | as Over nothing (flies back from the last written transform), highlight cleared | — |
| Plain end | `cancel()` (act, before-hide, detach) or a same-id `pointerdown` mid-drag; `cancel()` mid-fly-back (press or none) | tail at its slot at once, every drag class gone, running fly-back `finish()`ed, gate idle before return, no dispatch | — |
| Selection open | a selection exists, drag dropped on a column other than its source | `overlays.deselect()` once, then the dispatch | — |
| Hover | mouse drag | hover classes cleared at threshold; `refreshHover()` and `pointerover` only clear during a drag or fly-back; recomputed after release or fly-back end | — |

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` -- `Press` gets an optional drag record (source column, tail ids, wrappers, faces, press point, last transform, `hasLeftSource`, current target element); `pointermove` (drag start at `kind` → `'drag'`, then every drag move), `pointerup` (drop or fly-back), `end()` (the one end path: decide fly-back vs snap by `EndReason`, `byBack` now meaningful; fly-back `gate.enter()` before the press's `gate.leave()`), `cancel()` (also settles a running fly-back when `press === null`), `refreshHover`/`pointerover` (clear only while dragging or flying), `clearHover`. Keep entry 6/7 invariants: capture, `menuSlot`, contextmenu, tap `perform` after `end()`, one pointer.
- `src/ui/gestures/classify.ts` -- unchanged; `DRAG_PX` 8, drag latched once.
- `src/ui/gestures/intent.ts` -- unchanged (tap/hover only).
- `src/ui/gestures/gate.ts` -- `enter`/`leave`; `leave()` at count 0 throws.
- `src/ui/motion.ts` -- `duration('flyBack')`; may drop the "No animation uses it until epic 5" comment.
- `src/shell/prefs.svelte.ts` -- `prefs.motion.reduced` (mock as in `src/ui/motion.test.ts`).
- `src/ui/overlays.svelte.ts` -- `selection`, `deselect()`. Do not change.
- `src/ui/Column.svelte` -- `.column` (`data-column`), `.cards`, `.placeholder` (always rendered, `class:shown` toggled via `classList` by Svelte 5.57 for a static class value, so controller classes survive), cards keyed by id. Add `use:dropTarget={{ kind: 'column', id: column.column }}` on the `.column` element and a `data-placeholder` attribute on the placeholder.
- `src/ui/Card.svelte` -- wrapper `.card` (slot w+4 wide, strip or H tall, `data-card-id`), `.face` (relative, `pointer-events: none`, margin 0 2px, w × H, radius 6). `.lifted .face` z-index 3. Do not change.
- Sticky bars z-index 2 (`TopBar`, `ActionBar`, banner in `Board.svelte`); hover peek (entry 12) will take 4.
- `src/ui/App.svelte` -- the hover `$effect` already calls `controller.refreshHover()` on `game.view` change.
- `src/main.ts` -- creates gate and controller; `registerBeforeHide(() => controller.cancel())`, `registerBeforeBack(() => controller.cancel({ byBack: true }))`. No change expected.
- `src/ui/gestures/controller.test.ts` -- fake DOM (`FakeEl` parent chain, `closest` attr selectors, classList, style, capture), counting gate, `shared.view`, `navCalls` order log incl. `dispatch`. Extend: children + `querySelector`, settable rects, `getBoundingClientRect` (face rect = slot rect + parsed inline transform), `style.transform`/`opacity`, `animate()` returning a fake Animation (`finish()`, `onfinish`, effect timing) and a virtual-time finish; mock `prefs.svelte`. Existing drag tests (lines ~640, ~771) keep their assertions (no dispatch, selection kept on fly-back is entry 8's interim behaviour).
- `e2e/tap.spec.ts` -- helpers to copy or move: `openFixture`, `column`, `cards`, `foot`, `box`, `centre`, `draft`, `storedText`, `expectDrop`; `stashSession`/`sameSession` in `e2e/pointer.spec.ts`; `trayOrder` in `e2e/board-phases.spec.ts`; `tokenColor` in `e2e/helpers/style.ts`; `touchHold`/`touchDrag` in `e2e/helpers/touch.ts`; `animationFrames` in `e2e/helpers/lifecycle.ts`. Moving a helper into `e2e/helpers/` needs a `helpers.spec.ts` case; copying locally does not.
- Fixtures: `session-idle-fresh` (columns 7/7/7/7/6/6/6/6, Pixel 7 leftover 101 px), `session-idle-empty-column` (column 1 empty).
- Read before editing: spine AD-3, AD-10, AD-11, AD-12, AD-14; SPEC CAP-7, F12, F13, F24, F26; build-notes CAP-7; DESIGN.md Card states, Elevation & Depth (layer order), Card ghost; EXPERIENCE.md Drop targeting by overlap.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/targeting.ts` -- pure: `Rect = { left; top; right; bottom }`, `Candidate = { id: number; rect: Rect }`, `pickTarget(dragged, candidates, sourceId, hasLeftSource) → { raw: number | null; highlighted: number | null }`: ratio = intersection area ÷ dragged area; `raw` = largest ratio ≥ 0.25 (inclusive), ties to the smaller |candidate centre x − dragged centre x|, then the lower id; `highlighted = raw === sourceId && !hasLeftSource ? null : raw` (the source is never excluded from candidates) -- EXPERIENCE.md Drop targeting 3–5, AD-12.
- [x] `src/ui/gestures/targeting.test.ts` -- `AD-12 …`: below 25 % → null; exactly 25 % qualifies; largest ratio wins; equal ratios → nearest centre, then lower id; source largest + `hasLeftSource` false → `raw` = source, `highlighted` null; same with true → source highlighted; another column ≥ 25 % with the source larger and `hasLeftSource` false → `highlighted` null (not the runner-up); sub-25 % over the source only → both null; zero-area dragged rect throws.
- [x] `src/ui/gestures/drop-target.ts` -- the `dropTarget(node, { kind: 'column', id })` Svelte action registering into a module registry (insertion order; `update` replaces, `destroy` removes; a duplicate registration throws) and `columnTargets(): readonly { id; el }[]` read by the controller -- AD-12.
- [x] `src/ui/gestures/controller.ts` -- drag path per the matrix and Design Notes: drag start (clear hover, collect tail wrappers by `[data-card-id]` inside the source `[data-column]` and their `.face` children, add `wc-drag-ghost` to the wrappers and `wc-drag-layer` to the faces, settle any running fly-back first); each drag move (transform, measure, `pickTarget`, move `wc-drag-target` to the target element: other column → its bottom card wrapper or `[data-placeholder]` when empty; source partial → the wrapper at `start − 1`; source whole → `[data-placeholder]`); release; fly-back; snap; `cancel()` settling a fly-back; hover gating -- AD-12, F12, F13.
- [x] `src/ui/gestures/controller.test.ts` -- `AD-12`/`AD-10` S cases per Design Notes "Vitest cases".
- [x] `src/ui/Column.svelte` -- `use:dropTarget`, `data-placeholder`; `:global` CSS (every media context): `.card.wc-drag-ghost { position: relative }` + `::before` ghost (`content: ''`, absolute, top 0, left 2px, `box-sizing: border-box`, `width: var(--wc-w)`, `height: var(--wc-H)`, `border: 1px dashed var(--wc-outline)`, radius 6px, `pointer-events: none`); `.face.wc-drag-layer { z-index: 5; box-shadow: 0 6px 16px #0008 }` (above lift 3 and the hover peek's reserved 4, below any scrim); `.card.wc-drag-target > .face` and `.placeholder.wc-drag-target` (`visibility: visible`): 3 px teal outline + 12 % teal wash as the entry 7 `wc-drop` rule; update the header comment -- DESIGN.md Card states, Layer order.
- [x] `src/ui/motion.ts` -- drop the stale "No animation uses it until epic 5" sentence.
- [x] `e2e/drag.spec.ts` (new) -- the ticket AC Playwright cases plus the review-log items, per Design Notes "Playwright cases".
- [x] Run `npm run test:all`, then `npm run test:screens` (container) with baselines unchanged; record the warm `npm test` median.

**Acceptance Criteria:**
- Given `npm run test:all`, when run, then it passes and the warm unit median (3 runs after a warm-up) is recorded and under 5 s.
- Given `npm run test:screens` in the container, when run, then the `board.screens.spec.ts` baselines match unchanged in both projects.
- Given the Success-signal drag on `android`, when it is held over column 3 and released, then column 3's bottom face shows the 3 px outline mid-drag and the tray shows column 3's bottom card as the locked D mirror first and the S tile after it, saved before the next action.

## Implementation Notes

- `targeting.ts` `pickTarget` per the task; `drop-target.ts` registry with its own `AD-12` S cases (`drop-target.test.ts`, insertion order, update, destroy, duplicate element/id throws).
- Controller: `Press.drag` (source, tail wrappers/faces, press point, last transform, `hasLeftSource`, `highlighted`, target element); one `end()` decides fly-back (`up` with no highlight, `pointercancel`, `lostCapture`, `cancel({ byBack: true })`) vs snap (plain `cancel()`, `sameId`, detach, and the drop path, which clears before `pointerup` dispatches). `cancel()` first `finish()`es a running fly-back (with or without a press), then ends the press; a new drag settles a running fly-back first. Target elements come from the `GameView` (bottom card id, remainder top id) looked up inside the registered column element.
- `controller.test.ts` fake DOM extended (children, `querySelector` for attribute and `.class` selectors, settable rects, `getBoundingClientRect` + parsed `translate`, `style.transform`, fake `animate()` finishing in virtual time, prefs mocked); 16 new cases; the two existing drag tests keep their assertions.
- `e2e/drag.spec.ts`: 10 `android` + 2 `desktop` cases per Design Notes; helpers copied locally (no `e2e/helpers/` change). The Q-26 top/bottom case uses a second page from the same context for the second load (`seedStorage` seeds a page once).
- Verification: `npm run test:all` green (a first run hit a known timing flake in `layout.spec.ts` "banner during a scroll applied after a hide" — a scroll gap of exactly 150 ms under 8-worker load; it passed 3/3 in isolation and the full rerun was green). `npm run test:screens` in the container: 8/8, baselines unchanged. `drag.spec.ts` passed `--repeat-each 3`.
- Warm `npm test` median (3 runs after a warm-up): 4.93 s (5.22, 4.91, 4.93; a second set 4.96, 4.77, 5.02). Under 5 s but up from 4.73 s at ticket 7 — little headroom left for entries 9–10.

## Plan Change Log

## Review Triage Log

### 2026-10-02 — Review pass
- verdicts: 26 findings — high 0, medium 1, low 15, false 5, maybe-false 0 (plus 5 low rejected below are counted in low)
- findings:
  - `[low]` `[reject]` (blind) fly-back settles only via `onfinish`; an externally cancelled animation would leave the gate busy — unreachable today: every path that could re-render or cancel during a flight (Undo, Redo, menu, hide, back, detach) calls `cancel()` first, which `finish()`es and settles synchronously; the fix adds an untested branch
  - `[low]` `[patch]` (blind) fake `finish()` fires `onfinish` synchronously, so the cancel-mid-fly-back test does not pin the direct settle — fake now queues `onfinish`
  - `[low]` `[patch]` (blind) R-73 check right after `hold.end()` can pass before the drop — removed; `expectDrop` compares storage with `current().session` with no action in between
  - `[low]` `[patch]` (blind) "reference changed exactly once" not proven — Success-signal test asserts the move count and cursor index grew by exactly one
  - `[low]` `[reject]` (blind) a wheel scroll mid-drag lets the face drift until the next move — desktop-only, cosmetic, corrected by the next pointermove; the fix adds a scroll listener path
  - `[low]` `[reject]` (blind) back / `pointercancel` mid-drag and reduced motion not covered end to end — the ticket gives the hide/back drag P4s to entry 9 and specifies reduced motion and platform ends as S cases
  - `[low]` `[reject]` (blind) dragging a lifted (selected) tail jumps 8 px and flies back to translate(0,0) — the ticket gives selection-class removal at threshold and restore to entry 9; this ticket's tests start with nothing selected
  - `[low]` `[reject]` (blind) selection on the drag's own source / self-drop with a selection / fly-back with a selection not tested — entry 9's F24/F28 scope per the ticket
  - `[low]` `[patch]` (blind) `Drag.start` stored but never read — field removed
  - `[low]` `[reject]` (blind) e2e helpers copied a third time — the plan allows local copies; moving them is a refactor with `helpers.spec.ts` cases, not a direct correction
  - `[low]` `[patch]` (blind) fly-back guard would pass with two entries on the same face — guard records each face's card id and asserts the two tail cards
  - `[low]` `[patch]` (blind) desktop hover test assumes the second 4 px step lands exactly on 8 px — asserts from the third step (12 px)
  - `[low]` `[reject]` (blind) pickTarget source-vs-neighbour exact tie, empty candidates, dropTarget use-after-destroy untested — behaviour follows the spec tie-break; test-only gaps with no defect
  - `[false]` `[reject]` (blind) plan lacks the triage log and a deferred item for the unit-time risk — the triage log is written at this step; the fix edits this build's plan; the 4.93 s median is recorded in Auto Run Result residual risks
  - `[low]` `[reject]` (edge) `onfinish` never firing on a cancelled animation — same root cause and reasoning as the first blind row
  - `[low]` `[reject]` (edge) drag of a lifted tail — same as the blind lifted-tail row (entry 9)
  - `[low]` `[reject]` (edge) wheel scroll mid-drag — same as the blind scroll row
  - `[false]` `[reject]` (edge) GameView change mid-drag without `cancel()` dispatches a drop with `canDropOn` false — no such path: every command and New game/Replay go through `act()` (cancel first), hide and back cancel first (AD-12, AD-9); an engine throw there would be the fail-fast rule 6 surface
  - `[medium]` `[patch]` (verification-gap) leave through `raw === null` and return untested — added the AD-12 S case: column 1 off every column, back, highlight on the source, `drop(1, 1, 1)`
  - `[medium]` `[patch]` (intent) "including null" leave has no test — same root cause as the verification-gap row; fixed there
  - `[false]` `[reject]` (intent) fly-back guard checks one microtask, not the whole flight — exactly the resolution the owner's review log prescribed
  - `[low]` `[patch]` (intent) R-73 immediate check trivially passable — same root cause as the blind R-73 row; fixed there
  - `[low]` `[patch]` (intent) cleanup before dispatch only asserted after Composing renders — an S drop case snapshots the tail at dispatch time (no transform, no drag class)
  - `[false]` `[reject]` (intent) `finishFlight()` at drag start overlaps entry 9 — the plan prescribes it to keep one flight; entry 9 owns the press-time `finish()` and re-resolve, which this does not add
  - `[low]` `[reject]` (intent) desktop Success-signal test lighter than android — the AC asks desktop to repeat the drop; the visual asserts are android's (DESIGN.md looks are media-independent)
  - `[false]` `[reject]` (intent) code deselects on any drop with a selection, test covers other-column only — the Description says "a drop released while a tap-selection is open calls overlays.deselect() then dispatches"; the code matches it

### 2026-10-02 — Review pass (resumed run)
- verdicts: 25 findings — high 0, medium 0, low 20, false 5, maybe-false 0
- findings:
  - `[false]` `[reject]` (blind) drop highlight ignores `canDropOn` — a drag starts only from an Idle column with `canPickUp`, and `canDropOn = idle && anySource` (`src/engine/view.ts:182`), so every column is droppable for the whole drag
  - `[low]` `[reject]` (blind) cancelled fly-back never settles via `onfinish` — carried: same claim as the first pass's row; every path that could cancel a flight calls `cancel()` first
  - `[low]` `[reject]` (blind) every drag move forces a layout read — the ticket prescribes measuring live column rects each move (Description, AD-12)
  - `[low]` `[reject]` (blind) tie-break compares float ratios exactly — rarely met (equal-width columns give exact equal ratios); an epsilon adds complexity to a pure rule that matches EXPERIENCE.md
  - `[low]` `[patch]` (blind) desktop R-73 check right after `page.mouse.up()` is trivially passable — removed the line; `expectDrop` checks storage against `current()` after the drop
  - `[low]` `[patch]` (blind) drag box-shadow assert passes for any shadow — the Success-signal test now also asserts the drag shadow differs from the face's resting shadow
  - `[low]` `[reject]` (blind) deselect on every drop / selection e2e missing — carried: first pass rows (Description wording; entry 9 owns F24/F28 selection cases)
  - `[low]` `[reject]` (blind) pointercancel/byBack/reduced-motion fly-backs only unit-tested — carried; the ticket's Tests assign them to S and Scope gives hide/back drag cases to entry 9
  - `[low]` `[reject]` (blind) `dropTarget` use-after-destroy and remount untested — carried for use-after-destroy; columns are never remounted during play (keyed by column number), test-only gap
  - `[low]` `[reject]` (blind) ghost/drag-layer CSS repeats Card literals — refactor to shared tokens, not a direct correction; values match today
  - `[false]` `[reject]` (blind) dropped tail snaps without animation — the ticket's Lifetime prescribes clearing the transform before the drop dispatches; drop motion is epic 5
  - `[false]` `[reject]` (blind) plan missing from the content — the plan is the claims file, outside the reviewed diff by design; it carries the rule → test mapping
  - `[low]` `[reject]` (edge) `oncancel` not wired — carried (same as the blind fly-back row)
  - `[false]` `[reject]` (edge) `flyBack` can orphan a running flight — a flight only starts from a drag's end, and `startDrag` calls `finishFlight()` first, so no flight runs when `flyBack` is called
  - `[low]` `[reject]` (edge) desktop hover asserted from the 12 px step, not the crossing step — carried: first pass patched it to the 12 px step deliberately (8 px float landing)
  - `[low]` `[reject]` (edge) `page.mouse.up()` not in a `finally` — diagnostics only on an already failing test
  - `[low]` `[reject]` (edge, claim) plan's `onfinish` rationale implies external cancel is handled — the fix edits this build's plan
  - `[low]` `[reject]` (verification-gap) no e2e Back mid-drag through `main.ts` — the ticket's Scope gives "the hide/back drag cases" to entry 9
  - `[false]` `[reject]` (intent) jump Unknown guarded at its precondition, not visually — exactly the owner's review-log resolution of the open major (Design Notes)
  - `[low]` `[reject]` (intent) drag look checked by a few computed styles, no 12 % wash / scrim order — ticket's P4 list names the asserted styles; no static render change so no screenshot
  - `[low]` `[reject]` (intent) "unclipped" never exercised with a clipped column — met by construction (whole column slot rects); no scroll during a drag (`touch-action: none`)
  - `[low]` `[reject]` (intent) tie-break and largest-ratio only in Vitest — the ticket assigns pickTarget to S cases
  - `[low]` `[reject]` (intent) fly-back animation observed only in the WordCell-row guard — the ticket assigns duration/gate/reduced motion to S
  - `[low]` `[reject]` (intent) desktop Success-signal lighter than android — carried (first pass row)
  - `[low]` `[reject]` (intent) "static tray" not asserted as animation-free — no tray animation exists in this ticket
- verification fix: the first pass's patch asserting `cursor.index` + 1 after the drop was wrong (a draft drop adds a move; `cursor.index` counts committed moves, §2) and failed; the assertion now expects the index unchanged.

## Design Notes

**Review-log resolutions (ticket 4.8; these replace the ticket's wording).**
- Open major, fly-back guard: the `addInitScript` wrapper of `Element.prototype.animate` records, per call, the first keyframe's `transform` at call time and, in a `queueMicrotask` after the call, the element's `style.transform`; the test asserts each record's inline value is `''` and its first keyframe parses to the last touchHold move − press point within 1 px. No sampling of a running animation.
- Lifetime: fly-back first keyframe = the last written transform (pointercancel, lostpointercapture and byBack carry no reliable release point).
- Drag move writes `translate(pointer − press point)`; `hasLeftSource` is the controller's (AD-12); a plain `cancel()` clears every drag class (ghost, drag-layer, drag-target) and the transform; drop targets are read on each drag move (not every pointermove); the S selection case is a drag dropped on a column other than its source; a same-id `pointerdown` ending a drag snaps back like a plain `cancel()`.
- Column 5 whole-column P4 also asserts no `[data-mirror-of]` mid-drag and 52 `[data-card-id]`.
- Desktop: hover classes cleared mid-drag and restored after the fly-back without a further mouse move; S: `refreshHover()` during a fly-back adds no class.
- Ghost pseudo-element sized and placed like Card's `.ghost` face (w × H, 2 px inset) — Column task.
- Empty-column k = 0: column 2's bottom card of `session-idle-empty-column` held over column 1's placeholder: the placeholder carries `wc-drag-target` with computed outline-width 3px; release → `drop(2, 1, 1)`, k = 0.

**Lifetime.** Release: target class removed. Drop: transforms, ghost and drag-layer classes cleared, `end({kind:'up'})`, `overlays.deselect()` if a selection is open, then one `game.dispatch({ type: 'drop', … })`; then `refreshHover()`. Fly-back (release with `highlighted` null, `pointercancel`, `lostCapture`, `cancel({byBack:true})`): `gate.enter()` (before the press's `leave()`), per face `face.animate([{ transform: last }, { transform: 'translate(0px, 0px)' }], { duration: duration('flyBack'), easing: 'ease-out' })` then `face.style.transform = ''` in the same task; reduced motion: `style.transform = ''` then `animate([{ opacity: 0 }, { opacity: 1 }], { duration })`. Settle (all faces' `onfinish`, or `finish()` from `cancel()`/a new drag): idempotent — remove ghost and drag-layer classes, `gate.leave()`, flight cleared, `refreshHover()`. Use `onfinish`, not the `finished` promise (an externally cancelled animation would reject it unhandled). Snap (plain `cancel()`, `sameId`, detach): clear transform and every drag class at once, nothing dispatched; `cancel()` with a fly-back running settles it via `finish()` and its settle runs synchronously, so the gate is idle before `cancel()` returns. Svelte never re-renders mid-drag (F12) and toggles directive classes with `classList`, so controller classes on wrappers, faces and the placeholder survive until cleared.

**Vitest cases (`controller.test.ts`).** `AD-12` single-move flick onto column 3 drops there; transform written per move (`translate(dx px, dy px)`) with no dispatch or nav call before release and one dispatch at release; never-left drag releases with no dispatch; leave-and-return highlights the source (partial: wrapper `start − 1`; whole: placeholder); `AD-10` fly-back duration equals `duration('flyBack')` with `baseMs` 180 and 320; reduced motion clears the transform at once and animates opacity 0 → 1 over 120 ms, gate entered then left at finish; `pointercancel`, `lostpointercapture` and `cancel({ byBack: true })` with a column highlighted each fly back from the last transform over `duration('flyBack')`, gate busy, no dispatch, target class gone at once, ghost/drag-layer gone and gate idle at finish; plain `cancel()` mid-drag and mid-fly-back (no press) and a same-id `pointerdown` mid-drag leave no transform or drag class, gate idle, no dispatch; with a selection open a drag dropped on a column other than its source logs `pop` before `dispatch` once; `refreshHover()` mid-drag and mid-fly-back adds no hover class and the fly-back end recomputes it (mouse); drag from a `canPickUp: false` column does nothing.

**Playwright cases (`e2e/drag.spec.ts`, android unless stated; `session-idle-fresh` unless named; nothing selected).** Faces located as `card-<id>` `> .face`; transform via `style.transform`; points from live boxes.
- `R-14 R-20 R-23 R-73 the Success-signal drag …`: column 1 bottom card held over column 3 (touchHold steps): mid-drag column 3's bottom card has `wc-drag-target`, its face computed `outline-width` 3px, the dragged face's `box-shadow` not none, `current().session` reference unchanged across moves; release → Composing, `drop(1, 1, 3)`, k = 1, side left, tray order = D mirror (column 3's bottom card, locked) then the S tile; stored `wordcell:session` deep-equals `current().session` right after release; reference changed exactly once (unchanged a few frames later); no inline transform, `wc-drag-*` class anywhere.
- `Q-34 R-14 the same drag held over column 1 alone …`: no `wc-drag-target` at any step, release → storage byte-identical, reference unchanged.
- `R-22 R-23 k = 0 on an empty column` (`session-idle-empty-column`, per resolution above).
- `R-23 Q-26 drops at the top and at the bottom …`: column 1's bottom card centred over column 3's first card vs over `foot-3` (each ≥ 25 %, checked from boxes), two loads, drafts deep-equal.
- `R-11 R-23 a whole-column drag from column 5's top card onto column 2`: mid-drag every column-5 wrapper has `wc-drag-ghost` (computed `::before` border-style dashed), the dragged face's background colour equals `--wc-card-face`, no `[data-mirror-of]`, 52 `[data-card-id]`; while held over the top bar, one `page.evaluate` sets the face's `pointer-events: auto`, asserts `elementsFromPoint` first hit is the face or inside it, restores; release over column 2 → `drop(5, 6, 2)`, k = 1, side left, tray S order = column 5's ids top to bottom.
- `R-14 a drag released over the WordCell row flies back` + the guard: tail = column 1's bottom 2 cards; init-script records two `animate` calls (resolution above); storage byte-identical, reference unchanged; after the animations finish no `wc-drag-*` class.
- `Q-34 R-14 a 20 px drag down from column 4's bottom card …`: no highlight at any step, fly-back, byte-identical.
- `Q-34 a sub-25 % drag over the source only`: column 4's bottom card moved straight up until its face's overlap with column 4's box is in (0, 25 %) and none with another column (computed from boxes), released: no highlight at any step, byte-identical.
- `R-14 R-21 leave and return on column 1's third card from the bottom`: no highlight before leaving; after leaving and returning, the 4th card from the bottom has `wc-drag-target`; release → `drop(1, 3, 1)`, k = 1, D = that card.
- `R-14 R-22 whole-column self-drop`: column 5's top card off column 5 and back: before leaving, placeholder hidden and nothing highlighted; after returning the placeholder is visible with `wc-drag-target`; release → `drop(5, 6, 5)`, k = 0.
- Desktop (`page.mouse`, live rects): the Success-signal drop; the 20 px Q-34 cancel; hover: hovering column 4's bottom card shows `wc-hover-tail`/`wc-grab`, mid-drag no `[data-column]` carries a hover class, after a fly-back released over that card they return without a further mouse move.

**Rule → test mapping.** R-10, R-11, R-14 (UI) drag rows, Q-34, R-20–R-23, R-73 drop row → the Playwright cases above (names carry the ids); AD-12 transform/one-command, pickTarget → S + P4; AD-10 fly-back → S. Exempt: none.

## Verification

**Commands:**
- `npm run lint && npm run check` -- expected: clean.
- `npm test` -- expected: all pass; warm median recorded (3 runs after a warm-up), under 5 s.
- `npx playwright test e2e/drag.spec.ts e2e/tap.spec.ts e2e/pointer.spec.ts e2e/helpers.spec.ts` -- expected: pass on android and desktop.
- `npm run test:all` -- expected: pass.
- `npm run test:screens` (Docker; on this WSL distro via the Windows `docker.exe` with the `D:\CodeProjects\wordcell` mount, then remove the root-owned `test-results/` through the container) -- expected: pass, baselines unchanged.

## Auto Run Result

**Summary.** Ticket 4.8's drag path: pure `pickTarget` (`targeting.ts`), the `dropTarget` column registry (`drop-target.ts`), the controller's drag (DOM-only transform, ghost, drag layer, drag target), one `drop` at release on the highlighted column (deselect first), and a gate-counted WAAPI fly-back over `duration('flyBack')` (fade under reduced motion); `Column.svelte` registers targets and styles the drag classes; Playwright `e2e/drag.spec.ts` covers the ticket's android and desktop cases. This run resumed the `in-review` plan from a usage-limit stop and ran a second review pass.

**Files changed.**
- `src/ui/gestures/targeting.ts` / `.test.ts` — `pickTarget` and its AD-12 cases.
- `src/ui/gestures/drop-target.ts` / `.test.ts` — column drop-target registry and cases.
- `src/ui/gestures/controller.ts` / `.test.ts` — drag, drop, fly-back, snap, hover gating; fake DOM and WAAPI extended, AD-12/AD-10 cases.
- `src/ui/Column.svelte` — `use:dropTarget`, `data-placeholder`, `:global` drag-class CSS.
- `src/ui/motion.ts` — stale comment dropped.
- `e2e/drag.spec.ts` — 10 android + 2 desktop drag cases with the fly-back guard.

**Review-log items (ticket review loop Result).** All resolved in this plan's Design Notes "Review-log resolutions" and implemented: the open major (the fly-back guard records the inline transform in a microtask after each `animate()` call, no sampling of a running animation; `e2e/drag.spec.ts`), and every unapplied minor (Lifetime last-written transform, translate(pointer − press point), controller-owned `hasLeftSource`, plain `cancel()` clearing every drag class, drop targets per drag move, selection case wording, same-id `pointerdown` snap, column 5 no-mirror / 52 `[data-card-id]`, desktop hover clear/restore and `refreshHover()` during fly-back, ghost sized like Card's `.ghost`, empty-column k = 0 case naming its card and asserting the placeholder highlight).

**Review findings.** First pass: 26 findings, 8 patch groups applied, rest rejected (see first triage entry). Second pass (this run): 25 findings — 2 low patches applied (desktop R-73 line removed; drag shadow compared to the resting shadow), 0 deferred, 23 rejected with reasons in the triage log. Plus one verification fix (the first pass's `cursor.index` assertion). Patched counts this pass: high 0, medium 0, low 2.

**Follow-up review recommended:** false — only low entries patched this pass, none high, fewer than two medium.

**Verification.**
- `npm run lint`, `npm run check`: clean.
- `npx playwright test e2e/drag.spec.ts --repeat-each 3`: 36 passed; with tap/pointer/helpers specs: green after the assertion fix.
- `npm run test:all`: first run 1 failure, the known `layout.spec.ts` "banner during a scroll applied after a hide" scroll-timing flake (passed 3/3 in isolation); full rerun exit 0 (unit 1906 passed, dist-smoke 14, e2e 297, pwa 12).
- `npm run test:screens` (container via `docker.exe`): 8/8, baselines unchanged.
- Warm unit median from the first run: 4.93 s (under 5 s; unit sources unchanged this run).

**Residual risks.**
- Warm unit median 4.93 s leaves little headroom under the 5 s AD-17 budget for entries 9–10.
- The `layout.spec.ts` scroll-gap flake recurs under 8-worker load (pre-existing, not this ticket's code).
- A fly-back cancelled by anything other than `cancel()` would not settle (`onfinish` only); unreachable today, relevant when epic 5 adds animations.
