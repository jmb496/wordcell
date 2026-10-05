---
title: 'Drag interruptions: selection replacement, hide, back and cancel-first'
type: 'feature'
ticket: '9'
created: '2026-10-05'
status: 'built'
route: 'full'
route_source: 'auto'
baseline_revision: '996fd046e7e0aeb570216c0dc093866b37d13f0f'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-drag-interruptions-selection-replacement-hide-back-and-cance.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/rule-coverage.md'
warnings: ['oversized']
deferred:
  - summary: >-
      A plain cancel() ending a replacing drag throws in overlays.deselect() when another entry (a sticky WordCell view) sits above tailSelection.
    evidence: |-
      deselect() throws 'AD-13 deselect() while X is the top entry' unless tailSelection is on top. Unreachable today: openView is not wired until entry 11. The ticket review log (pass 3) gives it to the CAP-9 ticket.
    location: >-
      src/ui/gestures/controller.ts end()
    severity: low
---

<intent-contract>

## Intent

**Problem:** A drag that starts while a tail is selected leaves the old selection's lift, outline, `Here` and foot washes on screen, never deselects, and no Playwright case proves hide, back or Undo cancel a drag in progress (SPEC CAP-4, CAP-7, F13, F24, F28; AD-9, AD-12, AD-13, AD-16, AD-17; retro R1, R2/C-E4b).

**Approach:** Ticket 4.9's Description and Acceptance Criteria are the contract, read with the review-log resolutions in Design Notes (they win where they differ). The controller marks a pick-up drag that starts with a selection open as *replacing*: it adds `wc-selection-suppressed` to its attach root at the threshold crossing and removes it on every end path (restoring fly-back: at settle; all others: in `end()`); deselects on release with no highlight and on plain `cancel()`; restores (removes the class only) on same-id pointerdown, pointercancel, lostpointercapture and `cancel({ byBack: true })`. A pointerdown during a fly-back enters the gate, `finish()`es the flight, then resolves. `Column.svelte` CSS under the class cancels the selection visuals. New `e2e/drag-interruptions.spec.ts` holds the P4 cases.

## Boundaries & Constraints

**Always:** the overlays store is untouched mid-drag (F12): "restore" = remove the class, the selection and its nav entry never left; the class is toggled by `classList` on the attach root (App's `<main>`) only; only a pick-up drag (`startDrag` returns a `Drag`) is replacing, an inert drag (non-card column part, foot pad, non-pickable card, WordCell) never adds the class; `overlays.deselect()` at most once per drag end; the drop path keeps its existing deselect-then-dispatch in `pointerup`; suppression CSS cancels visual properties only (transform, box-shadow, outline, background, border colour, `Here` visibility), never `touch-action` (AD-11 foot row stays `none` while selected) and never box size (hit rects do not move, AD-12); suppression rules never apply to `.wc-drag-layer` faces; test names cite ids (UI Vitest always `AD-n`); P4 cases run on `android` first, desktop where the AC says.

**Never:** engine changes or new exports from `src/engine/index.ts` or the controller (no interface change); Svelte state, store calls or nav calls mid-drag before an end path; `!important`; changing `overlays.svelte.ts`, `nav.ts`, `main.ts` (registrations already exist) or screenshot baselines (no static render changes); entry 10 (Composing destination drag), entry 11 (sticky view: `deselect()` under a view on top is the CAP-9 ticket's); moving helpers into `e2e/helpers/` (copy locally, as entry 8 did).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Replace start | selection open, column-card press with `canPickUp` (any column, source included) crosses the threshold | class added to root at that move; drag classes as entry 8 | — |
| Inert with selection | press on a foot pad, column space, non-pickable card or WordCell, moved past threshold | no class, selection visuals and entry kept; release changes nothing | — |
| Drop | replacing, release on a highlight | class removed in `end()`, then `deselect()` (one `pop`), then one `drop` | — |
| No highlight | replacing, release over nothing / WordCell row / non-target column / unhighlighted source | fly-back; class removed in `end()`; `deselect()` once (one `pop`); no dispatch | — |
| Plain cancel | replacing, `cancel()` (before-hide, `act()`, detach) | snap back, class removed, `deselect()` once; on hide the `pop` is nav-queued | — |
| Same-id down | replacing, a same-id pointerdown mid-drag | snap back, class removed, selection kept, no nav call; new press resolves with the selection open | — |
| Restore | replacing, real `pointercancel`, `lostpointercapture`, `cancel({ byBack: true })` | fly-back; class kept until settle; no deselect, no nav call from the controller (byBack: `closedByBack` clears later) | — |
| Restore settle | restoring fly-back ends by `onfinish`, a press, or `cancel()` | class removed, selection kept, no nav call, gate idle | — |
| Press in flight | button-0 pointerdown, no press, flight running | `gate.enter()`, `finishFlight()`, resolve via `elementFromPoint`; resolves to nothing (enabled button) → `gate.leave()` at once | — |
| No selection | any drag with nothing selected | entry 8 behaviour unchanged; no class ever | — |

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` (651 lines) — `Drag` gets `replacing: boolean`; `startDrag` (l. 343) sets it from `overlays.selection !== null` and adds `SUPPRESSED = 'wc-selection-suppressed'` to `root` after `finishFlight()`; `end()` (l. 218) computes `flies` as now, then for a replacing drag: restoring (`flies && kind !== 'up'`) → leave the class for `settle`; otherwise remove it, and deselect when `kind === 'up' && drag.highlighted === null` or `kind === 'cancel' && !byBack` (`end()` clears only `drag.target`, so `drag.highlighted` is still the last-shown value); `settle()` (l. 302) removes the class when `flight.drag.replacing`; `pointerdown` (l. 428) adds the in-flight order (Design Notes); `cancel()` (l. 622) unchanged (it already `finishFlight()`s first, and `press === null` after a flight so no deselect). Update the header comment (entry 9 paragraph). In `settle`, `root` is still set (detach runs `cancel()` → `finishFlight()` before `root = null`); throw if it is null (rule 6).
- `src/ui/gestures/controller.test.ts` (1390 lines) — fake DOM (`setup()`, `t.down/fire/tap/advance/detach`, `navCalls`, `t.overlays`, fake `animate()` with queued `onfinish`), entry 8 `describe('AD-12 entry 8 drag')` at l. 1028 with its board fixture. Existing selection tests that change meaning under F24: l. 909 (drag with a selection released over nothing now deselects if `card2` is a pick-up drag in that setup — check; if so, keep the test's intent by moving its drag assertion to the new F24 cases and leaving the WordCell long-press half) and l. 1312 (keep). Add a `describe('AD-13 entry 9 selection replacement')`.
- `src/ui/Column.svelte` — selection visuals: `.cards` inline `--wc-lift`, Card's `.lifted .face { transform: translateY(-8px); box-shadow; z-index: 3 }` (`src/ui/Card.svelte:162`, scoped specificity 0,4,0), `.selection-outline` element, `.foot.source` (surface-raised) + `.here`, `.foot.target` (wash + dashed border), `.foot.selecting { touch-action: none }`. Add suppression `:global` rules (Design Notes) beside the entry 8 drag CSS, every media context; update the header comment.
- `src/ui/overlays.svelte.ts` — `selection`, `deselect()` (no-op when null; `close` → `nav.pop()`). Do not change.
- `src/shell/nav.ts` — popstate for a back: `beforeBack?.()` (controller `cancel({ byBack: true })`) then `closedByBack(wc)`; `pop()` queued. Do not change.
- `src/main.ts` l. 133–136 — `registerBeforeHide(() => controller.cancel())`, `registerBeforeBack(() => controller.cancel({ byBack: true }))`. Do not change; the back P4 must fail if the latter is removed (verify once by temporarily commenting it out, then restore; record in Implementation Notes).
- `src/ui/act.ts` — `act()` calls `controller.cancel()` first; `TopBar.svelte` `undo()` = `deselect()` then `dispatch({ type: 'undo' })`.
- `e2e/drag.spec.ts` — copy locally: `openFixture`, `column`, `cards`, `foot`, `faceOf`, `box`, `centre`, `ratio`, `stashSession`, `sameSession`, `sessionShape`, the `__flyBack` `addInitScript` animate spy (l. ~449–510). `e2e/tap.spec.ts` — `select`, `tapAt`, `cardAt`, `expectSelection(page, sel, wc)`. Helpers: `touchHold` (`e2e/helpers/touch.ts`), `hidePage`/`showPage`/`animationFrames` (`e2e/helpers/lifecycle.ts`), `armStorageSpy`/`storageWrites` (`e2e/helpers/storage-spy.ts`), `seedStorage`/`fixture` (`e2e/helpers/seed.ts`, accepts `prefs`). Look at an existing hide case (grep `hidePage` in `e2e/`) for the write-once and clock-resume assertions (`activeMs`) pattern.
- Fixtures: `session-idle-fresh` (columns 7/7/7/7/6/6/6/6; multi-card selections work, e.g. tap column 1's 5th card → count 3), `session-idle-empty-column` (column 1 empty, Undo enabled), `prefs-non-default.json` (`animationSpeed: 'slow'` → fly-back 320 ms).
- Read before editing: spine AD-9, AD-11, AD-12, AD-13, AD-16, AD-17; SPEC CAP-4, CAP-7, F12, F13, F24, F28; build-notes CAP-4 (AD-17 hide case, Cancel-first P4), CAP-7; rule-coverage rows AD-9/AD-17, AD-12, AD-13, AD-16.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/controller.ts` -- replacing flag, class add at threshold, end-path removal/deselect/restore per the matrix, settle removal, press-during-flight order, header comment -- SPEC F24/F28, F13, AD-12.
- [x] `src/ui/gestures/controller.test.ts` -- the S cases in Design Notes "Vitest cases"; adjust l. 909 if its drag becomes replacing -- ticket AC S.
- [x] `src/ui/Column.svelte` -- suppression CSS and header comment -- SPEC CAP-7 "foot states", DESIGN.md Card selected.
- [x] `e2e/drag-interruptions.spec.ts` (new) -- the P4 cases in Design Notes "Playwright cases" -- ticket AC P4.
- [x] Run `npm run test:all`; record the warm `npm test` median (3 runs after a warm-up); run `npm run test:screens` in the container with baselines unchanged.

**Acceptance Criteria:**
- Given `npm run test:all`, when run, then it passes and the warm unit median is recorded (under 5 s, or per-file timings recorded for the entry 13 sweep).
- Given `npm run test:screens` in the container, when run, then baselines match unchanged.
- Given every ticket AC bullet and every review-log item, when the Playwright and Vitest cases in Design Notes run, then each passes with a name carrying its id; the hide case's title is the C-E4b proof.

## Implementation Notes

- C-E4b proof: the `e2e/drag-interruptions.spec.ts` android case titled `AD-9 AD-16 AD-17 hidePage mid-touchHold drag cancels it first: wordcell:session written once, tail back, Session unchanged, time resumes only after showPage`. "Session unchanged" is asserted on the Session minus `activeMs` (store and stored), since the hide flush accrues time into a new reference; time is asserted with real waits (2 s hidden: store `activeMs` equals the hide write; then 300 ms visible: the second write grows by ≥ 290 ms and < 2000 ms; the earlier < 1500 ms upper bound was removed at review as a load flake risk, and the code review restored a looser < 2000 ms one, below the ≥ 2290 ms any counted hidden time would give, because store `activeMs` changes only at accrue points and the lower bound alone also passes if hidden time were counted), not `page.clock` (a paused clock would also freeze `requestAnimationFrame`, which `animationFrames` needs).
- Before-back check: with `nav.registerBeforeBack(...)` commented out in `src/main.ts`, `AD-13 R1 select, drag, back …` fails (no fly-back recorded); `main.ts` restored, `git diff src/main.ts` empty.
- F28 synthetic pointercancel recipe confirmed in Chromium (android project): a capturing document `pointerdown` listener yields the touch `pointerId`; the element with `hasPointerCapture(id)` is the dragged card's wrapper; `new PointerEvent('pointercancel', { pointerId, bubbles: true })` dispatched on it reaches the controller on `<main>`, flies back and restores the selection (outline 2 px solid teal, `Here`, lift, wc 1); later moves and the touch end are ignored. On-device ordering stays `unverified` (epic 7).
- `controller.test.ts` l. 909: its `card2` drag was a pick-up drag with a selection open, so under F24 it now deselects; the drag half moved to the new `AD-13 entry 9 selection replacement` cases and the test keeps the WordCell long-press half (renamed). Press-order S cases use an `order` log (gate enter/leave, animation `finish`, `elementFromPoint`).
- Unit budget: warm `npm test` median 6.88 s (6.81, 6.88, 6.92 after a warm-up; wall clock) vs 6.08 s at the baseline (996fd04), so over 5 s before this ticket. This is the recorded figure; the Vitest-reported `Duration` (about 5.3 s at both revisions, Verification) is a different metric that excludes process and npm start-up. Per-file (json reporter): `src/architecture.test.ts` 3.86 s, `src/ui/gestures/controller.test.ts` 2.86 s, `src/shell/game.svelte.test.ts` 2.10 s, `scripts/deploy-check.test.mjs` 1.91 s, `src/engine/view.test.ts` 0.80 s; for the entry 13 sweep.
- Intended: during a replacing drag on desktop the feet show no column numbers. The numbers render only with no selection (`{#if selection === null}` in `Column.svelte`), and the suppression CSS only hides `Here` and the foot states, per the ticket, without changing markup mid-drag (F12).
- `npm run test:all` green (second run); the first run failed only `e2e/layout.spec.ts` `AD-11 banner during a scroll applied after a hide, before the quiet point`, which also fails 2/10 at the baseline with this change stashed (pre-existing flake, not touched here). Targeted `--repeat-each 3` of drag-interruptions, drag, tap and pointer specs: 165 passed. `npm run test:screens` (docker.exe, `D:\CodeProjects\wordcell` mount): 8 passed, baselines unchanged; `test-results/` removed inside the container.

## Plan Change Log

- 2026-10-05, F32 built (owner decision, SPEC F32, build-notes spine close-out "AD-12 (F32)"): the former `deferred[0]` (8 px lift lost when a selected card is dragged) is fixed. `src/ui/gestures/controller.ts` records each dragged face's lift at the threshold crossing (its wrapper's `lifted` class → `LIFT_PX` 8, DESIGN.md Elevation & Depth) and writes `translate(pointer − press point − lift)`, so drop targeting measures the rendered, lifted rect; a restoring fly-back (pointercancel, lostpointercapture, `cancel({ byBack: true })`) animates to `translate(0px, −lift)`, while a release with no highlight (which deselects) still lands on `translate(0px, 0px)`; a restoring reduced-motion fade removes `wc-selection-suppressed` at its start instead of at settle, so the kept selection's non-dragged faces show the same lift as the dragged ones during the fade. Unlifted cards are unchanged. Tests: `src/ui/gestures/controller.test.ts` describe `AD-12 F32 a dragged selected card keeps its lift` (8 cases: threshold move and rect, no-selection drag, restoring fly-back × 3 ends, deselecting release, reduced fade, full-motion suppression until settle); `e2e/drag-interruptions.spec.ts` android `AD-12 F32 a dragged selected card keeps its lift: no jump at pickup, …` (full motion and reduced motion; both fail with the controller change reverted).

## Review Triage Log

### 2026-10-05 — Review pass
- verdicts: 25 findings — high 0, medium 4, low 14, false 7, maybe-false 0
- findings:
  - `[low]` `[reject]` (blind) Undo e2e tests do not prove cancel() runs before the dispatch — order inside one `act()` handler is not observable at the surface; a missing cancel leaves drag residue on keyed wrappers, which the tests assert immediately after the click; the AC asks for the end state
  - `[low]` `[reject]` (blind) a replacing drag ended through `act()` (Undo/menu) untested — `act()` is `controller.cancel()` then the handler (covered by the plain-cancel S cases and the Undo P4s); the menu does not exist until epic 6
  - `[low]` `[patch]` (blind) inert S case covers only foot pad and column space — added a non-pickable card and a WordCell press to that case
  - `[medium]` `[defer]` (blind) dragging a lifted card of the selection: inline translate replaces the 8 px lift, restore lands 8 px low then jumps at settle — see the grouped edge rows; deferred
  - `[medium]` `[patch]` (blind) source foot suppression unasserted — grouped with the verification-gap row; assertions added
  - `[low]` `[patch]` (blind) select-drag-hide test does not assert the app stays open — added `page.url()` not `about:blank` after showPage (written-once is not this case's AC)
  - `[low]` `[reject]` (blind) `settle()` unsuppresses flights whose class `end()` already removed — `classList.remove` is idempotent; a `restoring` flag adds state for no behaviour change
  - `[low]` `[reject]` (blind) `R1`/`R2` in test names look like malformed R-ids — they are the epic 3 retrospective action ids the epic's Done when 4 cites; every title starts with its AD id, and R-ids are `R-xx`
  - `[low]` `[reject]` (blind) helpers copied a third time; ad-hoc `window` casts — the plan prescribes local copies (entry 8 precedent); moving them is a refactor for the entry 13 sweep
  - `[medium]` `[patch]` (blind) hide test's wall-clock upper bound (< 1500 ms) can flake under load — upper bound deleted; lower bound and frozen-while-hidden check kept
  - `[low]` `[patch]` (blind) one-lifted-tail release does not check the fly-back — `expectFlownBack` on the dragged face added
  - `[low]` `[defer]` (edge) restoring fly-back from the selected column lands on the unlifted slot, then snaps up 8 px at settle — accepted outcome in the ticket review log (pass 2 dropped it: lift and fly-back share the face transform); grouped defer with the threshold jump
  - `[low]` `[defer]` (edge) grabbed lifted card jumps 8 px at the threshold crossing — real: AD-12 writes `translate(pointer − press point)` over Card's `translateY(-8px)`; pre-existing since entry 8 (its triage rejected it to entry 9, whose ticket does not specify it); a fix changes the AD-12 transform formula and the fly-back keyframes — owner UX call, deferred
  - `[low]` `[defer]` (edge) plain `cancel()` of a replacing drag throws in `deselect()` when another entry (sticky view) is above `tailSelection` — unreachable today (no sticky view until entry 11); the ticket review log assigns it to the CAP-9 ticket
  - `[false]` `[reject]` (edge, claim) l. 909's drag was deleted, not adjusted — its case (pick-up drag with a selection released with no highlight) is the new `release on the never-left source` / `release over nothing` S cases
  - `[medium]` `[patch]` (verification-gap) `.foot.source` background and lifted-face `box-shadow` suppression unasserted — asserted mid-drag in the one-lifted-tail P4
  - `[low]` `[patch]` (verification-gap) the dragged face's `:not(.wc-drag-layer)` exemption unverified — dragged face computed z-index 5 and box-shadow not none asserted
  - `[low]` `[reject]` (intent) the hide `nav.pop()` queue is not observed — the AC's observable is wc 0 after showPage, asserted
  - `[false]` `[reject]` (intent) before-back removal shown only by construction — demonstrated manually (Implementation Notes)
  - `[false]` `[reject]` (intent) Undo-during-fly-back P4 covers cancel(), not the F13 pointerdown path — the review log assigns press during fly-back to S only
  - `[low]` `[reject]` (intent) capture-resolving press during a restoring flight not combined in one case — `settle()` removes the class for any replacing flight regardless of how the press resolves; the settle-by-press case and the capture-order case each pass
  - `[false]` `[reject]` (intent) one Vitest assertion removed — deliberate: F24 changes that behaviour
  - `[false]` `[reject]` (intent) suppression CSS in a Svelte component — the ticket forbids Svelte-owned classes/styles toggled mid-drag, not component CSS keyed on the controller's class
  - `[false]` `[reject]` (intent) plan claims live outside the diff — the plan is committed with the change
  - `[false]` `[reject]` (intent) Q-34 source suppression not retested — unchanged entry 8 code with its tests

## Design Notes

**Review-log resolutions (ticket 4.9 review log; these refine the ticket).**
- Open major: the one-lifted-tail P4 also asserts mid-drag the `[data-selection-outline]` computed `display` `none` (or outline-style none) and the `Here` text not visible (`toBeHidden` / computed `visibility: hidden`), and the synthetic-pointercancel P4 asserts after settle the outline visible with its 2 px teal outline and `Here` visible on the source foot, plus the lift back (computed face transform not `none`).
- "Release over nothing" = any release with no highlight (over nothing, the WordCell row, a non-target column, an unhighlighted source): all take the deselect path (matrix "No highlight"); an S case covers release on the never-left source.
- Undo during a fly-back P4: seed `prefs-non-default.json` (slow, 320 ms) so the one `page.evaluate` (assert a running animation on the faces via `getAnimations()`, then `document.querySelector('[data-testid=undo]').click()`) runs inside the flight.
- Select-drag back P4: then `end()` changes nothing (Session, selection, wc).
- Hide P4s follow build-notes order: moveTo another column so it is highlighted (`wc-drag-target` present), past the threshold, `hidePage`, `moveTo` again, `end()`; assert after.
- Synthetic-pointercancel P4: after the cancel, a `moveTo` over another column then `end()` yields no `wc-drag-target` and no drop (Session unchanged).
- Tests line: press during fly-back is S only; Undo during fly-back is S + P4.
- "Primary" press = `button === 0` with no active press; enabled buttons included: they enter the gate, finish the flight, resolve to `null` and `leave()` the gate at once.
- Suppression CSS: visual properties only, never `touch-action` (AD-11); an S-free check: the inert foot-pad P4 asserts the foot's computed `touch-action` `none` mid-drag.
- Inert foot-pad P4: another (non-source) column's foot pad, a drop-target foot (`.foot.target` wash visible mid-drag).
- Unit budget: S end-path cases use `it.each`; record the warm median.
- Pass-3 deferrals: lift has no CSS transition (Card l. 162), so no flake guard needed — still assert with `expect.poll`; the inline `--wc-lift` only offsets the outline/hover math, the face lift is the stylesheet `.lifted .face` rule, overridden by the higher-specificity suppression rule; `deselect()` under a sticky view stays the CAP-9 ticket's; the same-id new press sees the restored selection (S asserts `overlays.selection` unchanged and the new press captured as a selected-mode press); fixture for a ≥ 2-card tail is `session-idle-fresh`.

**Suppression CSS (`Column.svelte`, `:global`, beside the drag CSS).** Selectors start `:global(main.wc-selection-suppressed)` so they outrank Card's scoped rule:
```css
:global(main.wc-selection-suppressed) .cards :global(.card.lifted > .face:not(.wc-drag-layer)) {
  transform: none; box-shadow: <Card .face resting box-shadow or none>; z-index: auto;
}
:global(main.wc-selection-suppressed) .selection-outline { display: none; }
:global(main.wc-selection-suppressed) .foot.source { background: none; }
:global(main.wc-selection-suppressed) .here { visibility: hidden; }
:global(main.wc-selection-suppressed) .foot.target { border-color: transparent; background: none; }
```
Read Card's `.face` rule for the resting shadow; dragged faces keep their inline transform (inline beats any stylesheet rule).

**Press during a flight (`pointerdown`).** After the `button`/root and same-id checks: `const inFlight = flying !== null; if (inFlight) { gate.enter(); finishFlight(); }` then `resolve(...)`; `null` → `if (inFlight) gate.leave(); return;`; otherwise `if (!inFlight) gate.enter();` and continue. The gate never reaches idle between settle and the new press.

**Vitest cases (`controller.test.ts`, `AD-13`/`AD-12`, selection opened with `t.overlays.select` first, `navCalls` from there).** `it.each` over replacing end paths: drop on another column (class gone before the dispatch, log `pop` then `dispatch`); release over nothing and on the never-left source (fly-back, class gone at `end()`, one `pop`, no dispatch); plain `cancel()` and detach (snap, class gone, one `pop`); `cancel({ byBack: true })`, real `pointercancel`, `lostpointercapture` (fly-back, class present until settle, selection kept, no nav call). Each restoring settle — `onfinish`, a press, `cancel()`: class removed, selection kept, no nav call, gate idle. Same-id pointerdown mid-drag: snap, class gone at once, selection kept, no nav call, the new press captured on the settled layout. Class added only at the threshold-crossing move (absent below it) and never for an inert drag with a selection (foot pad, column space) nor for a pick-up drag with nothing selected. Press during a flight: call order `gate.enter` → animation `finish` → `elementFromPoint`, `event.target` ignored, capture on the resolved element; enabled-button resolution leaves the gate at once (gate idle). A press-only hide with a selection (existing F24 (a)) stays green.

**Playwright cases (`e2e/drag-interruptions.spec.ts`, android unless stated).**
- `AD-9 AD-16 AD-17 hidePage mid-touchHold drag cancels it first: wordcell:session written once, tail back, Session unchanged, time resumes only after showPage` (`session-idle-fresh`, no selection; storage spy armed; build-notes order; `activeMs` frozen while hidden, grows only after `showPage`; later `moveTo` + `end()` changes nothing). This title is the C-E4b proof.
- `AD-13 F24 select, drag from another column, hidePage, showPage: nothing selected at wc 0` (Session unchanged, tail back, later `end()` changes nothing).
- `AD-13 R1 select, drag, back: the tail flies back, nothing selected, app open at wc 0` (`__flyBack` spy records calls for the tail faces after `page.goBack()` (or `history.back()` via evaluate), Session unchanged, then `end()` changes nothing).
- `AD-13 F28 a synthetic pointercancel restores the selection after the fly-back` (capturing document pointerdown listener records `pointerId`; dispatch on the element with `hasPointerCapture`; wait until the faces' `getAnimations()` is empty; selection, outline, `Here`, lift back, wc 1; `moveTo` another column + `end()` → no highlight, no drop; a back → nothing selected, wc 0). Confirm the `unverified` recipe in Implementation Notes.
- `AD-12 F24 a drag from the source column of a selection lifts one tail` (select column 1 count 3, press its bottom card, drag off): mid-drag the two remaining selected faces' computed transform `none`, outline and `Here` hidden, no foot target wash (`.foot.target` computed background transparent/none), class on `main`, `wc-drag-layer` only on the dragged face; release over nothing → class absent, nothing selected, wc 0.
- `AD-12 R2 Undo during a held drag returns the tail before it undoes` (`session-idle-empty-column`, `getByTestId('undo').dispatchEvent('click')`; tail faces no transform, `cursor.index` decreased, later `end()` changes nothing) on android, and the desktop `page.mouse` twin.
- `AD-12 F13 Undo during a fly-back acts on the settled layout` (`session-idle-empty-column` + slow prefs; as resolved above; faces no transform, no running animation, `cursor.index` decreased).
- `AD-12 CAP-4 an inert 20 px drag from another column's foot pad keeps the selection` (select, 20 px touchHold on a non-source foot, mid-drag outline and `Here` visible, class absent, foot `touch-action` `none`; release over it → Session and selection unchanged, wc 1).

**Rule → test mapping.** AD-9/AD-17 hide, AD-16 Board half → hide P4; AD-12 cancel-first, F13 → Undo P4s + S; AD-13 F24/F28 → S + select-drag-hide, back, pointercancel P4s; AD-12 inert → foot-pad P4; AD-12 F32 (selection lift kept in the drag) → `AD-12 F32` S cases + the two `AD-12 F32` P4s. Exempt: none.

## Verification

**Commands:**
- `npm run lint && npm run check` -- expected: clean.
- `npm test` -- expected: all pass; warm median recorded.
- `npx playwright test e2e/drag-interruptions.spec.ts e2e/drag.spec.ts e2e/tap.spec.ts e2e/pointer.spec.ts --repeat-each 3` -- expected: pass on android and desktop.
- `npm run test:all` -- expected: pass.
- `npm run test:screens` (container via Windows `docker.exe` with the `D:\CodeProjects\wordcell` mount; remove root-owned `test-results/` through the container after) -- expected: pass, baselines unchanged.

## Auto Run Result

**Summary.** Ticket 4.9: a pick-up drag that starts while a tail is selected now replaces the selection. At the threshold crossing the controller puts `wc-selection-suppressed` on App's `<main>`, and `Column.svelte` CSS under it hides the old selection's lift, outline, `Here` and foot paint, with visual properties only. Every end path removes the class. A drop deselects before its dispatch. A release with no highlight deselects as the tail flies back. A plain `cancel()` (hide, `act()`, detach) snaps back and deselects once. A same-id pointerdown snaps back and restores. Pointercancel, lostpointercapture and back fly back, and the class comes off at settle with the selection kept and no nav call. A primary press during a fly-back enters the gate, finishes the flight, then resolves (F13). The new `e2e/drag-interruptions.spec.ts` holds the CAP-4 hide, back, Undo, pointercancel, one-lifted-tail and inert P4 cases.

**Files changed.**
- `src/ui/gestures/controller.ts`: replacing flag, class add/remove, F24/F28 deselect/restore paths, press-during-flight order, header comment.
- `src/ui/gestures/controller.test.ts`: `AD-13 entry 9 selection replacement` S cases (end paths, restoring settles, same-id restore, threshold timing, inert presses, F13 press order); the l. 909 case keeps its WordCell half.
- `src/ui/Column.svelte`: suppression CSS (`:global(main.wc-selection-suppressed)`), header comment.
- `e2e/drag-interruptions.spec.ts` (new): 8 android cases and 1 desktop case. The C-E4b proof is the `AD-9 AD-16 AD-17 hidePage mid-touchHold drag …` title.

**Review-log items (ticket review loop Result).** All resolved in Design Notes "Review-log resolutions" and implemented:
- The open major: outline and `Here` hidden mid-drag in the one-lifted-tail P4, and back after settle in the pointercancel P4.
- Release over nothing means any release with no highlight (S case on the never-left source).
- The Undo-during-fly-back P4 seeds slow prefs.
- The back P4 ends with `end()` changing nothing.
- The hide P4s follow the build-notes order.
- In the pointercancel P4, a `moveTo` over another column then `end()` gives no highlight and no drop.
- Press during a fly-back is S only; Undo is S + P4.
- A primary press on an enabled button leaves the gate (S).
- Suppression is visual only, and the inert P4 asserts `touch-action: none`.
- The inert P4 uses a non-source foot pad.
- The unit budget is recorded below.
- The pass-3 deferrals are recorded in Design Notes.

**Review findings.** 25 findings (high 0, medium 4, low 14, false 7):
- 6 patch entries applied, all test strengthening:
  - inert S case extended to a non-pickable card and a WordCell;
  - source-foot background and lifted-face shadow assertions, plus the dragged face's drag-layer z-index and shadow;
  - fly-back check on the one-lifted-tail release;
  - app-open check after hide + show;
  - the flaky hide upper bound removed.
- 2 deferred, in frontmatter `deferred`:
  - the 8 px lift offset when a selected card is dragged (owner UX call);
  - `deselect()` under a sticky view (the CAP-9 ticket).
- The rest rejected, with reasons in the triage log.
- Patched by verdict: medium 2, low 4.

**Follow-up review recommended:** false. Two medium entries were patched, but both were test-only assertions that now pass, and no unverified risk remains to name.

**Verification.**
- `npm run lint` and `npm run check` are clean.
- `npm run test:all` after the patches:
  - The first run failed only the pre-existing `layout.spec.ts` flake "banner during a scroll applied after a hide", which also fails at the baseline.
  - The rerun exited 0: unit 1925+, dist-smoke 14, e2e 306, pwa 12.
- `drag-interruptions.spec.ts --repeat-each 3`: 27 passed.
- `npm run test:screens` (container): 8/8, baselines unchanged. The patches after it touched only tests.
- Before-back removal makes the back P4 fail (checked manually).
- Unit time: the recorded figure is the warm `npm test` wall-clock median, 6.88 s (6.08 s at the baseline; Implementation Notes). The Vitest-reported `Duration` is a different metric (no process or npm start-up): about 5.3 s both at the baseline (996fd04: 4.94, 5.35, 5.39, 5.28) and with this change (5.10, 5.43, 5.30, 5.31). The suite is already over the 5 s AD-17 budget on this machine today. Per-file timings are in Implementation Notes for the entry 13 sweep.

**Residual risks.**
- The unit suite is over 5 s before and after this ticket. Entry 13's sweep owns it (epic Done when 5).
- The `layout.spec.ts` scroll-gap flake recurs under load (pre-existing).
- Whether Android delivers pointercancel before back on an edge swipe, or before visibilitychange on an app switch, is still `unverified` (epic 7 device check).
- The 8 px lift offset when dragging a selected card: owner decided (F32) and built, see Plan Change Log.
