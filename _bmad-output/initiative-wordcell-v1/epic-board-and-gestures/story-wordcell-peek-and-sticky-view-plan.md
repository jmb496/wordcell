---
title: 'WordCell peek and sticky view'
type: 'feature'
ticket: '11'
created: '2026-10-07'
status: done
baseline_revision: '69bf8b22b91cdfb75763be0f717eae861f917725'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-wordcell-peek-and-sticky-view.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/rule-coverage.md'
warnings: ['oversized']
deferred:
  - summary: >-
      e2e/layout.spec.ts AD-11 banner-during-scroll cases (l.250, l.272) fail intermittently under full-suite load.
    evidence: |-
      Failed once in each of this build's two npm run test:all runs ("scrollY changes between steps", "no banner while the pan continues"); 3/3 and 15/15 green in isolation and green on full test:e2e re-runs. Ticket 4.10's plan records the same flake on layout.spec.ts:272 before this change. Pre-existing timing sensitivity (150 ms quiet window under CDP load), not caused by this diff.
    location: >-
      e2e/layout.spec.ts:250
    severity: low
---

<intent-contract>

## Intent

**Problem:** A player cannot yet see the cards under a WordCell's top card (R-65, Q-21): a WordCell long-press does nothing visible, a tap in Idle/Game over is inert, and the overlays store's `openPeek`/`peekToSticky`/`openView` have no caller or renderer.

**Approach:** Ticket 4.11 as written (story file in `context`, its Description and Acceptance Criteria are binding): a `WordCellView.svelte` sheet + scrim rendered from the overlays store, controller long-press/peek/sticky and sheet/scrim paths, a node-tested click swallower, F27 title and `top` tag strings in `text.ts`, the fixture `session-gave-up-after-commit.json`, and the S and P4 tests the ticket's AC lists.

## Boundaries & Constraints

**Always:** peek/view state only through `overlays` (`openPeek`, `closePeek`, `peekToSticky`, `openView`, `close('wordcellView')`, `closedByBack`); the overflow decision at the long-press release reads the rendered `[data-view-scroll]` under the controller root (`scrollHeight > clientHeight` → `peekToSticky()`, else `closePeek()`; a missing scroll area throws, rule 6); every non-`up` press end (cancel, pointercancel, lostCapture, sameId, detach) with a peek open calls `closePeek()`, never `peekToSticky()`; sheet/scrim presses are classified (resolved before `data-place`) without `setPointerCapture`; a sheet/scrim `tap` calls `overlays.close('wordcellView')` then arms the swallower; a drag (or a pan's pointercancel) on them does nothing; sheet and scrim carry no click handlers; mirrors carry `data-mirror-of` only (AD-14) and never animate; `.board` alone gets `inert` while the sticky view is open (`overlays.viewCell !== null`), never during a held peek, never the wrapper, `<main>` or a view ancestor; scrim and sheet stack above bars, banner, lifted faces (z 3) and drag layer (z 5); player strings only in `text.ts`; tests named by id (UI Vitest `AD-n`).

**Never:** engine changes or new `src/engine/index.ts` exports; R-02 literals touched; open/close transition on the sheet (SPEC Non-goals); keydown/Esc handling, focus management, hover peek (entry 12); changing the swallower's arming point (`pointerup`) or 300 ms expiry; a fallback fixture without first measuring that cell 6 of `session-won` cannot overflow; regenerating screenshot baselines without recording the diff's cause here.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tap opens view | Idle, nothing selected, or Game over; non-empty WordCell tap | `openView(cell)`, one nav push | — |
| Tap inert | Composing or Place WordCell tap; any empty WordCell tap with nothing selected | nothing (no dispatch, no view, no nav) | — |
| Tap deselects | Idle with a tail selected, any WordCell tap | `deselect()`, no view (R-14, unchanged) | — |
| WordCell drag | any phase, any selection | nothing; selection kept; no tail lifted (R-12) | — |
| Long-press peek | non-empty WordCell, 400 ms, any phase, with or without selection | `openPeek(cell)` (no nav); on `up`: overflow → `peekToSticky()` (one push, above any selection) else `closePeek()` | missing `[data-view-scroll]` throws |
| Peek other end | cancel()/pointercancel/lostCapture/same-id pointerdown/detach while peek held | `closePeek()`, no push | — |
| Empty long-press | empty WordCell, 400 ms | no peek; releases as a tap (deselect with a selection, else nothing) | — |
| Sheet/scrim tap | sticky view open | `close('wordcellView')` (one pop), selection under it kept, swallower armed | — |
| Sheet/scrim drag | sticky view open | nothing (sheet scrolls, scrim `touch-action: none`) | — |
| Trailing click | swallower armed; `click` with `detail ≥ 1` on root | capture phase: `stopPropagation()` + `preventDefault()`, then disarm | — |
| Disarm | armed; next `pointerdown` on root (any id/button), 300 ms expiry from arm, or detach | listener and timer removed; a later click reaches its handler | — |
| Keyboard click | armed; `click` with `detail 0` | passes, does not disarm | — |
| Under view + selection | peek turned sticky above `tailSelection`; `cancel()`, `cancel({byBack})`, before-hide | no throw; selection and view kept, depth unchanged, no nav call | — |
| Back | sticky view above selection | first back closes view, second clears selection | — |

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` -- `resolve()` (l.195): add sheet/scrim before `data-place`: `[data-view-scrim]` → `{target:'other', capture:null, hit:{kind:'scrim'}}`, `[data-view-sheet]` → `hit:{kind:'sheet'}`; WordCell hits gain `cell` (`attribute(cellEl,'data-wordcell')`). `onTimer` (l.494): when the new state is `longPress` and target `wordcell` → `overlays.openPeek(hit.cell)`. `end()` (l.256): close the peek for every kind but `up` (adds `sameId`; detach already goes through `cancel()`). `pointerup` (l.595): outcome `longPress` with `overlays.peek !== null` → overflow read; sheet/scrim `tap` → `close('wordcellView')` + `swallower.arm(root)`. `pointerdown` (l.506): `swallower.disarm()` first, for every pointerdown. Detach (l.746): `swallower.disarm()`. `perform()` gains `openView`. Swallower uses `deps.setTimer/clearTimer`.
- `src/ui/gestures/intent.ts` -- `Hit` wordcell → `{kind:'wordcell'; cell:number}`; add `{kind:'sheet'}`, `{kind:'scrim'}` (never reach `tapAction`'s column branches: the controller handles them before `perform`); `TapAction` gains `{kind:'openView'; cell}`: selection null, cell non-empty in `view.cells`, and `view.status !== 'playing' || view.phase === 'idle'`. Composing branch (l.97) unchanged (wordcell falls to `selection === null` path → must return none in Composing/Place).
- `src/ui/gestures/classify.ts` -- unchanged (long-press already WordCell-only; empty long-press releases as tap).
- new `src/ui/gestures/click-swallow.ts` (+ `.test.ts`) -- `createClickSwallower({ setTimer, clearTimer })` → `{ arm(target: EventTarget): void; disarm(): void }`; arm while armed re-arms (disarm first). Test in node with `new EventTarget()` and injected timer stubs as in `gate.test.ts` (no `vi.useFakeTimers`).
- `src/ui/overlays.svelte.ts` -- no change expected (API complete; `deselect()` throws unless `tailSelection` is top — the reason sheet/scrim taps never call it).
- `src/ui/Board.svelte` -- move the `style:--wc-*` props (l.60–69) to a new wrapper `div.board-root` (width 100%) holding `.board` then `<WordCellView>`; `.board` gets `inert={overlays.viewCell !== null}`. `.board` keeps its class, layout and contents (bars/banner inside), so baselines stay unchanged.
- new `src/ui/WordCellView.svelte` -- renders when `overlays.peek ?? overlays.viewCell` is non-null; cell's `CellView` from `view.cells`; `div[data-view-scrim]` (fixed, inset 0, `{colors.scrim}`, `touch-action: none`) and `div[data-view-sheet][role="dialog"]` with `aria-label` = F27 title, `data-mode="peek|sticky"`, fixed centred, width `var(--wc-board)`, `max-height: 80dvh`, `{colors.surface}`, radius 20 px, `touch-action: pan-y`, `user-select: none`, `-webkit-touch-callout: none`; title (`text.viewTitle`) then a `[data-view-scroll]` area (`overflow-y: auto; overscroll-behavior: contain`, also on the sheet root) holding a grid of `Card` mirrors, 16 px padding, cards per row per DESIGN.md formula, bottom card first, top last with the `top` tag. No transitions.
- `src/ui/Card.svelte` -- add mirror kind `'view'` with `place: 'view'` (a live card with `place 'view'` throws): `full` height, in flow (not absolute), `touch-action: pan-y`, no hatch/opacity even for a used cell's top; prop `topTag` renders `text.viewTop` as a small ui-label pill inside the wrapper (`pointer-events: none`).
- `src/ui/text.ts` (+ `text.test.ts`) -- `viewTitle: (cell, count) => count === 1 ? \`WordCell ${cell} · 1 card\` : \`WordCell ${cell} · ${count} cards\`` (U+00B7), `viewTop: 'top'`; listed together under one F27 comment.
- `src/ui/App.svelte` -- unchanged (`<main use:pointerRoot inert={historyNotice}>` stays).
- `fixtures/session-gave-up-after-commit.json` -- generate from the REBUILDS script below and write the produced JSON (epic 3 regeneration rule).
- `src/engine/serialize.test.ts` -- import it; `ValidName` + `'gave-up-after-commit'`; `VALID` append; comment "The eleven …"; `PROPERTIES['gave-up-after-commit']`: `gaveUp` true, cursor idle at `moves.length`, column 1 empty, cell 7 has 7 cards; `REBUILDS` append `play(createSession(1), [drop(1, 7, 1), VALIDATE, CONFIRM, GIVE_UP], ['ldxomiw'])` (`GIVE_UP` exists l.1000; `activeMs` 0).
- `src/architecture.test.ts` (l.1932) -- list gains `session-gave-up-after-commit.json` (sorted), name "exactly the eleven rebuilt ones".
- `src/ui/gestures/controller.test.ts` -- fake harness (FakeEl with attributes/closest/querySelector, virtual clock, nav log, real overlays). l.919 case re-pointed (non-empty long-press now opens a peek and closes it on release when the fake scroll area does not overflow; selection kept, nav `['push']`); the l.~950 "openView above a selection" case kept. Fake scroll area = a FakeEl with `data-view-scroll` and settable `scrollHeight`/`clientHeight` placed under the root.
- `src/ui/gestures/intent.test.ts` l.66 -- `{kind:'wordcell', cell}` with nothing selected now yields `openView` for a non-empty cell in Idle and Game over, `none` for empty and in Composing/Place.
- `e2e/tap.spec.ts` -- l.176 test drops `wordcell-7`, renamed "… and an empty WordCell are inert"; l.357 test extended: while held (`touchHold`, no move, wait ≥ 450 ms) the peek sheet is visible and its scroll area does not overflow, after `end()` it is gone, selection and `wc` 1 kept.
- new `e2e/wordcell-view.spec.ts` -- all new P4 cases (android describe + desktop describe); copy small helpers locally (as entries 8–10 did); `wc` from `e2e/helpers/dialogs.ts`, `longPress`/`touchHold`/`touchDrag` from `e2e/helpers/touch.ts`, `hidePage` not needed.
- Facts: `session-won` cell 6 holds 24 cards (deepest), cell 7 21, cell 8 7; `session-idle-empty-column` cell 7 holds 7, column 1 empty, Undo enabled; `main.ts` already registers `cancel` before-hide and `cancel({byBack:true})` before-back.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/text.test.ts` -- add `viewTitle`, `viewTop`; tests `AD-13 F27 view title at 7 cards` / `at 1 card`, `viewTop` reads `top`.
- [x] `src/ui/gestures/click-swallow.ts`, `click-swallow.test.ts` -- module per Code Map; tests: `AD-12 a trailing click is swallowed (stopPropagation, preventDefault) then a later click reaches its handler`; `AD-12 the next pointerdown disarms it` (controller-level, see below) / `AD-12 the 300 ms expiry disarms it`; `AD-12 a detail-0 click passes and keeps it armed`; `AD-12 disarm removes listener and timer`.
- [x] `src/ui/gestures/intent.ts`, `intent.test.ts` -- Hit/TapAction changes; I/O rows Tap opens/inert/deselects.
- [x] `src/ui/gestures/controller.ts`, `controller.test.ts` -- paths per Code Map; S cases: `AD-12 peek on end` (each of cancel, pointercancel, lostCapture, same-id pointerdown, detach → `closePeek`, never sticky, no nav); long-press up without/with overflow (no push / one push above a kept selection); missing scroll area at release throws; a still press on the sheet then lift closes the view (one pop); scrim tap closes only the view (selection kept); a scrim drag ≥ 8 px keeps it; trailing click swallowed then a later click handled; next pointerdown disarms; detach disarms; `AD-13` peek turned sticky above a selection then `cancel()`, `cancel({byBack:true})` and the before-hide `cancel()` neither throw and keep selection + view (depth 2, no nav call); `AD-13` first `closedByBack(1)` closes the view, `closedByBack(0)` clears the selection; `AD-13` back while a peek is held above a selection: `cancel({byBack:true})` closes the peek (no sticky), `closedByBack(0)` clears the selection.
- [x] `src/ui/Card.svelte`, `src/ui/WordCellView.svelte`, `src/ui/Board.svelte` -- per Code Map.
- [x] `fixtures/session-gave-up-after-commit.json`, `src/engine/serialize.test.ts`, `src/architecture.test.ts` -- per Code Map.
- [x] `e2e/tap.spec.ts` -- the two updates per Code Map.
- [x] `e2e/wordcell-view.spec.ts` -- every Playwright case of the ticket AC, named by id (`R-65`, `R-33`, `R-39`, `R-12`, `R-75`, `Q-21`, `AD-11`, `AD-12`, `AD-13`); each view case also asserts `current().session` reference, `localStorage` `wordcell:session` text and Undo/Redo `disabled` state unchanged.

**Acceptance Criteria:**
- Given the ticket's Acceptance Criteria, when `npm run test:all` runs, then every case it lists exists under its id and passes.
- Given `session-won` at the pinned android viewport 412 × 360 with the WordCell row scrolled into view (`scrollIntoViewIfNeeded`) before the hold, when cell 6 (24 cards) is long-pressed, then the held sheet's scroll area has `scrollHeight > clientHeight` before release, the view stays after release with `wc` +1, a `touchDrag` upward inside it raises `scrollTop` and keeps it, and a tap on a non-top mirror closes it (R-65 "only the top card is usable": the tap does nothing else) with `wc` back to its prior value.
- Given `session-idle-empty-column` with the sticky view of cell 7 open over the enabled Undo, when the scrim is tapped at Undo's centre (android touch; desktop mouse), then the view closes, `cursor.index` is unchanged, and a capture-phase `click` recorder on `window` installed before the tap shows every trailing click whose target is inside Undo was `defaultPrevented`; the observed target and order are recorded in Implementation Notes (android resolves the unverified pointerup → click order; on desktop the click retargets to the common ancestor, so that half only proves "no Undo").
- Given the used cell of `session-place-free-letter-redo-tail`, when it is long-pressed, then its last mirror shows the `top` tag text, lacks the `used` class, and the title count equals its `cards.length`.
- Given the board fixtures, when `npm run test:screens` runs in the container, then the eight board baselines match unchanged.

## Implementation Notes

- **Overflow viewport (AC):** android 412 × 360 (`page.setViewportSize` before `goto`), `wordcell-6` scrolled into view with `scrollIntoViewIfNeeded`; `session-won` cell 6 (24 cards) overflows the held peek sheet there (`scrollHeight > clientHeight` before release). No fallback fixture was needed (`session-overflow-cell.json` not added; fixture count eleven).
- **Scrim-over-Undo order (AC, gate passed):** android (CDP touch tap at Undo's centre): `pointerup` on `div[data-view-scrim]`, then one `click` whose target is Undo's `svg` (inside Undo), `defaultPrevented` true (swallowed at the root's capture listener); `cursor.index` unchanged. Desktop (`page.mouse.click`): `pointerup` on the scrim and no `click` at all observed on `window` (the mousedown target was removed), so the desktop half only proves "no Undo". Sanity check: with `swallower.arm(root)` commented out the android case fails (Undo runs), so the swallower is load-bearing; restored.
- `tapAction` throws on a `sheet`/`scrim` hit (rule 6: the controller handles them before `perform`).
- `Card.svelte` throws (`AD-14 …`) when `place === 'view'` and `mirror === 'view'` disagree, evaluated in a `$derived.by` read by the markup (a script-level check only sees initial props).
- The `top` tag uses the DESIGN.md Typography 11 px card-badge type (DESIGN.md lists the view's `top` tag among the 11 px texts) as a raised pill at the face's foot.
- Controller test harness: `FakeEl` keeps `{ capture: true }` listeners apart (they run first in `fire`), and the board fixture carries the scrim, sheet, `[data-view-scroll]` (settable `scrollHeight`/`clientHeight`) and a sheet mirror. The old "pointerup leaves the peek to the handlers" case was replaced by the long-press release cases (a pending-state pointerup with a manually opened peek is now a tap → `openView`, which throws while a peek is open).
- `npm run test:screens` could not run: Docker is not reachable from this WSL2 distro (Docker Desktop WSL integration off). Baselines not regenerated; no view is open in any baseline and the closed `WordCellView` renders nothing, the only DOM change being the `.board-root` wrapper (width 100%, no layout properties of its own).

## Plan Change Log

## Review Triage Log

### 2026-10-07 — Review pass
- verdicts: 24 findings — high 0, medium 1, low 18, false 5, maybe-false 0
- findings:
  - `[medium]` `[patch]` (blind) scrim-over-Undo android case passes vacuously when no click inside Undo is recorded — patched: android now requires ≥ 1 recorded click inside Undo, each `defaultPrevented`.
  - `[low]` `[reject]` (blind) desktop "focus + Enter" proves nothing once focus fails — the ticket AC prescribes exactly this check, and the `[inert]` ancestor assert carries the proof.
  - `[low]` `[patch]` (blind) nothing asserts `.board` is not inert during a held peek — patched: the held-peek helper asserts no `inert` attribute while held.
  - `[low]` `[patch]` (blind) "unhatched" asserted by absence of a class a `view` mirror never has; self-contradictory test name — patched: computed face `opacity` 1 and `background-image` none; renamed.
  - `[low]` `[reject]` (blind) gave-up-after-commit PROPERTIES does not pin cell 3 empty or status gaveUp — the ticket fixes the defining property set; the e2e tests read the DOM directly.
  - `[false]` `[reject]` (blind) sheet lacks `aria-modal`/`aria-labelledby` — focus and screen-reader labels are SPEC Non-goals (epic 6).
  - `[false]` `[reject]` (blind) plan claims more than verified (baselines, test:all, empty logs) — fix edits this build's plan; results are recorded at Finalize below.
  - `[low]` `[reject]` (blind) WordCell drag P4 only in Idle without a selection — the AC asks P4 for Idle only; the selection-kept and other-phase paths are S-covered and share one code path.
  - `[low]` `[reject]` (blind) fixed 450 ms waits leave thin margin — green across three full runs; the assertions that follow poll.
  - `[low]` `[reject]` (blind) cards-per-row formula not tested — cosmetic layout, no rule depends on it; would need new geometry assertions.
  - `[low]` `[reject]` (blind) `topTag` unguarded on live cards — only WordCellView passes it; a guard adds a branch for an unreachable state.
  - `[low]` `[reject]` (blind) Board.svelte indentation hides the new nesting — cosmetic; re-indent would bloat the diff.
  - `[low]` `[reject]` (edge) a 1 px `scrollHeight` rounding could turn a fitting peek sticky — F14 pins `scrollHeight > clientHeight`; both are integer-rounded from the same layout, so equality holds when content fits.
  - `[low]` `[reject]` (edge) desktop hover not repainted after the view closes until the mouse moves — absence of a hover outline, fixed by the next move; never a wrong outline.
  - `[low]` `[patch]` (edge) AD-11 styles and AD-13 reload cases skip the unchanged-state asserts the plan requires — patched: same stash/unchanged checks; the post-reload stored Session compared ignoring `activeMs`, which AD-9 accrues on reload (as `tap.spec.ts`'s reload case does).
  - `[false]` `[reject]` (intent) hide flush proven only with a stand-in — the ticket AC places this case in UI Vitest with stubbed nav; the registered before-hide hook is `controller.cancel()` itself.
  - `[low]` `[reject]` (intent) peek→sticky above a kept selection is S only — recorded decision from the ticket review loop (pass 2): no Idle fixture overflows at a usable viewport.
  - `[low]` `[reject]` (intent) overflow→sticky proven in Game over only — one phase-independent code path; peek release in Place/Composing is P4.
  - `[low]` `[reject]` (intent) WordCell drag with a selection is unit-only — duplicate of the blind drag-coverage finding.
  - `[low]` `[reject]` (intent) scrim presses over Reload, columns and WordCells never tried — one full-viewport scrim above all of them; Undo stands for the class and the desktop inert case covers the bars and banner band.
  - `[low]` `[patch]` (intent) bottom-first order never checked against the cell's cards — patched: the used-cell case asserts the sheet's `data-mirror-of` order equals the cell's bottom-first order.
  - `[false]` `[reject]` (intent) `-webkit-touch-callout` not asserted — the ticket AC excludes it (Chromium 1.63 reports none, rule-coverage AD-11).
  - `[low]` `[reject]` (intent) the swallower's detail-0 pass-through is a fourth rule beyond the intent — carried ticket review minor (pass 3): a keyboard click is not a pointer gesture's trailing click.
  - `[false]` `[reject]` (intent) "reaches its handler" inferred from `cancelBubble` — the node test infers reach from `!event.cancelBubble` on the dispatched click (a root capture listener that stopped propagation hides it from every descendant handler) and asserts the second click is not stopped or prevented; disarm by pointerdown/detach is the controller's job and tested there.

## Design Notes

**Review-log minors (ticket 4.11), resolved here.** (1) `top` tag string → `text.viewTop` beside `viewTitle` (Code Map text.ts). (2) scrim-over-Undo → capture-phase recorder AC above; desktop half weak by design, recorded. (3) deepest cell = `session-won` cell 6, 24 cards (verified against the fixture). (4) the closing sheet tap after the swipe lands on a non-top mirror (AC above). Other carried minors: WordCell drag inert in Game over too (matrix "any phase"); no transition, so the release-time overflow read is stable; back while a peek is held above a selection (controller task); tap.spec rename; `inert` only while sticky; no click handlers on sheet/scrim; a tap that stops a fling closes (accepted); any pointerdown disarms; no capture for sheet/scrim; fallback fixture only if 412 × 360 and smaller usable heights (≥ 300) all fail to overflow cell 6 — then add `session-overflow-cell.json` per the ticket Notes, record it as the SPEC Assumptions exception, and follow the count; double tap: the second tap hits the scrim and closes; Esc and focus are epic 6; desktop mouse peek is the same pointer path (no separate case beyond the scrim/inert desktop cases); a still finger lifted on the sheet closes it (S case); F30 gutter strip accepted; an empty cell in Game over (`session-gave-up-after-commit` cell 3) opens nothing on tap or long-press; `elementFromPoint` at a lifted face during a held peek with a selection returns the scrim or sheet (assert in the extended tap.spec.ts:357 case). AD-13 "peek turned sticky above a kept selection" is S only: no Idle fixture overflows at a usable viewport (P4 covers peek→sticky on `session-won` without a selection).

**Scrim-over-Undo gate.** If the android case fails because the trailing click reaches Undo, stop and HALT `blocked` (ticket Notes, AGENTS.md rule 7); do not move the arming point or change 300 ms.

## Verification

**Commands:**
- `npm run test:all` -- expected: green (lint, check, unit, build within budget, dist, e2e, pwa).
- `npm run test:screens` -- expected: green with baselines unchanged (Docker in WSL2; if Docker is unavailable, record that here and in the result).

## Auto Run Result

- **Summary:** WordCell long-press peek (closes on release, turns sticky iff `[data-view-scroll]` overflows), tap → sticky view in Idle/Game over, `WordCellView.svelte` sheet + scrim over a `.board-root` wrapper with `.board` inert while sticky, sheet/scrim tap closes and swallows the trailing click (`click-swallow.ts`), F27 title and `top` tag in `text.ts`, fixture `session-gave-up-after-commit.json` (count eleven).
- **Files:** `src/ui/gestures/controller.ts` (peek, view, sheet/scrim paths), `src/ui/gestures/intent.ts` (Hit cell/sheet/scrim, `openView`), `src/ui/gestures/click-swallow.ts` (+ test, new), `src/ui/WordCellView.svelte` (new), `src/ui/Board.svelte` (wrapper, inert), `src/ui/Card.svelte` (`view` mirror, `top` tag), `src/ui/text.ts` (+ test), `fixtures/session-gave-up-after-commit.json` (new), `src/engine/serialize.test.ts`, `src/architecture.test.ts`, `src/ui/gestures/controller.test.ts`, `src/ui/gestures/intent.test.ts`, `e2e/tap.spec.ts`, `e2e/wordcell-view.spec.ts` (new, 17 cases).
- **Review:** 24 findings; 5 patched (1 medium, 4 low; all e2e test tightening); 19 rejected; 1 item deferred outside the lenses (pre-existing layout.spec.ts flake); with reasons in the triage log.
- **Ticket review-log minors:** (1) `top` tag → `text.viewTop` beside `viewTitle`; (2) capture-phase click recorder on android saw Undo's `svg` as the trailing click target, `defaultPrevented`, no undo; on desktop no click fires (retarget), so that half only proves "no Undo"; (3) deepest cell = `session-won` cell 6, 24 cards, overflows at 412 × 360 (no fallback fixture); (4) the closing sheet tap after the swipe lands on a non-top mirror.
- **Follow-up review recommended:** false (patched: high 0, medium 1, low 4).
- **Verification:** `npm run test:all` run twice; each run failed only the pre-existing `e2e/layout.spec.ts` banner-during-scroll timing case (l.250/l.272) under full-suite load; that spec passed 15/15 in isolation, `npm run test:e2e` re-ran green (349 passed), `npm run test:e2e:pwa` green (12), lint, check, unit (1987), build and dist (14) green. After the code-review fixes, one complete `npm run test:all` run passed green (exit 0): lint, check, unit 1988 passed (46 files), build within budget, dist 14 passed, e2e 349 passed, pwa 12 passed. `npm run test:screens` not run: Docker is not reachable from this WSL2 distro; the eight board baselines are expected unchanged (a closed view renders nothing; the wrapper has no layout of its own).
- **Residual risks:** screenshot baselines unverified until `npm run test:screens` runs in the container; the android scrim-over-Undo result depends on Chromium's gesture-tap click order (now pinned by the strengthened test); on-device behaviour is epic 7's.

