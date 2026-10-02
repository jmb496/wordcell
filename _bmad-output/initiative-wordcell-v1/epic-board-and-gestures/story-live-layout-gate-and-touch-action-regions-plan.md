---
title: 'Live layout, gate and touch-action regions'
type: 'feature'
ticket: '4'
created: '2026-10-02'
status: done
baseline_revision: 'dfa68a1edba2922de39ab35e6a1093a18dee8133'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-live-layout-gate-and-touch-action-regions.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
warnings: ['oversized']
deferred:
  - summary: 'Desktop below 384 px clientWidth (16 px gutters: 384 − 32 = 352, the board): the horizontal pan scrollbar reduces clientHeight against innerHeight; the height rule there is unverified and not built. The ticket Notes cite "entry 1 plan" for this bound, but entry 1 recorded < 360 (before the gutter correction); < 384 supersedes it.'
    severity: minor
  - summary: 'F22 exception: the banner sticky offset `top: calc(44px + env(safe-area-inset-top))` names the top bar''s DESIGN.md height (a neighbour band); kept by the ticket Notes, recorded here for the retrospective.'
    severity: minor
  - summary: 'Inset changes are noticed only when a resize/orientationchange/media/banner event schedules a relayout (no ResizeObserver on the probe); a pure inset change with no resize goes unapplied until the next event.'
    severity: minor
---

<intent-contract>

## Intent

**Problem:** The Board lays itself out once at mount from `window` reads (zero insets, no banner, no recompute). There is no gesture gate, the dictionary banner shows straight from the store, so it can move cards under a finger and shift the WordCell row, and touch-action/user-select are set only on cards.

**Approach:** Add `src/ui/gestures/gate.ts` (the AD-11 deferral gate) and `src/ui/layout/layout.svelte.ts` (live `$state` layout: w, metrics, wide, heights, bandOrder, gate-latched bannerShown; anchor scroll delta). Create both in `main.ts`, pass the layout through App to Board, add the touch-action/user-select CSS regions, and add the `touchHold` e2e helper and the AD-11 Vitest and Playwright cases. The ticket Description is the contract; this plan adds the resolutions below.

## Boundaries & Constraints

**Always:**
- The ticket Description and AC are binding (the gate algorithm, layout deps, relayout task, CSS regions, main.ts order, touchHold semantics); cite rules by id in comments and test names (`AD-11 …`, helpers `AD-17 …`).
- Geometry only through `geometry.ts` (`cardWidth`, `availableWidth`, `cardMetrics`, `bands`, `shouldRecomputeWidth`, `anchorScroll`) and `bands.ts` (`BAND_ORDER`, `parseBandsParam`); never re-derive. `trayRows` is always 1.
- Every DOM read/write in `layout.svelte.ts` goes through `deps` (narrow structural types, so Vitest fakes need no DOM); Vitest asserts getters and fake `scrollTo` calls only.
- Rule 6: `leave()` at 0 throws; no try/catch around layout work; a `?bands=` non-permutation throws inside `boot()` and reaches AD-15 (unhandledrejection) in dev.
- AGENTS.md pitfalls: no binding named `history`; `console.error` only in main.ts; visibility listeners stay in `game.svelte.ts` (the gate learns of hide only through `registerBeforeHide`).

**Never:**
- No engine change; no change to `geometry.ts`/`bands.ts` semantics or the R-02 golden deal.
- No pointer controller, foot-row `none` while selected (entry 7), view sheet (entry 11), tray-row growth (epic 5).
- No ResizeObserver, no polling, no DnD library; no `scrollTo(x, y)` form (keeps horizontal pan: `scrollTo({ top })`).
- Do not regenerate screenshot baselines unless a fixture render actually changes; only in the container (`npm run test:screens`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gate idle work | `whenIdle(fn)`, gate idle | fn runs in the next raf, FIFO | — |
| Gate busy | `enter()`, `whenIdle(fn)`, raf | fn not run; `leave()` → raf requested → fn runs | `leave()` at 0 throws |
| Scroll busy | `scroll()` then raf | busy; cleared by `scrollEnd()`, 150 ms quiet timer or `scrollReset()`, each releasing queued work | — |
| Own write | `ignoreNextScroll()`, `scroll()` | not busy; flag cleared by the next raf even with an empty queue; a later `scroll()` marks busy | — |
| Flush re-check | fn₁ calls `enter()` | fn₂… return to the queue head in order | — |
| Creation | any viewport | getters set synchronously; no `scrollTo` | — |
| hoverFine flip | 412 × 915, query false → true | w 46 → 43 (innerWidth/innerHeight unchanged) | — |
| Two 60 px shrinks | 412 × 839 → 779 → 719 at scrollY 0 | first: w 46 kept, leftover 101 → 41, no `scrollTo`; second: w 40 | — |
| Inset change | probe padding changes + `resize` | bands re-laid with the new insets | — |
| Upper clamp | 412 × 600 at scrollY 122 → 660 | `scrollTo({ top: 62 })` after `ignoreNextScroll()` | — |
| Banner hide at max | 1280 × 720 hoverFine, banner shown, scrollY 46 | `scrollTo({ top: 2 })` | — |
| w recompute, scrollY > 0 | 412 × 780 banner shown, scrollY 2, hoverFine → true | w 43, clamped target written (implementer derives literals with geometry, records them) | — |
| Revert before idle | resize or banner show then back, gate busy, then idle | nothing changes, no `scrollTo` | — |
| Target equals read | relayout whose clamped target = scrollY | no `ignoreNextScroll`, no `scrollTo` | — |

</intent-contract>

## Code Map

- `src/ui/layout/geometry.ts` — pure; signatures as listed above. Reference numbers (checked): 412 × 915 w 46 leftover 177 (banner 133); 412 × 780 leftover 42, banner → total 782, anchorOffset 651 → 653; 412 × 600 and 1280 × 720 (hoverFine) w 40 total 722 (banner 766); 412 × 839 leftover 101, anchorOffset 710.
- `src/ui/layout/bands.ts` — `BAND_ORDER`, `ANCHOR_BAND`, `parseBandsParam(search)` (throws on non-permutation), `type Unit`, `type BandId`.
- `src/ui/Board.svelte` — today reads `window`/`document` once at mount (zero insets, `bands(..., false, ...)`), iterates `BAND_ORDER`, renders `<DictionaryBanner />` inside `.banner[data-band=banner]` (sticky offset `calc(44px + env(safe-area-inset-top))`, keep). Replace with `layout` prop getters (`w`, `metrics`, `wide`, `heights`, `bandOrder`, `bannerShown`); update the header comment.
- `src/ui/App.svelte` — mounts Board inside `<main>` on the active root; gains a `layout` prop passed to Board.
- `src/ui/DictionaryBanner.svelte` — renders on `dictionary.showBanner`; change to render unconditionally (Board gates it on `layout.bannerShown`); Reload's `disabled` keeps reading live `dictionary.state` (F20).
- `src/ui/TopBar.svelte`, `ActionBar.svelte`, `Column.svelte` (`.column`, `.foot`), `WordCellRow.svelte` (`.label`, `.wordcell`, `.count`), `Tray.svelte` (`.tray`), `Card.svelte` (already `touch-action: none; user-select: none`) — CSS region targets.
- `src/ui/app.css` — global `html, body` rules; add `html { scrollbar-gutter: stable; overflow-anchor: none }`.
- `src/main.ts` — `boot()`: after `game.load()` and its halted return, before `game.registerLifecycle()`: create the gate (browser `requestAnimationFrame`/`setTimeout`/`clearTimeout`), `game.registerBeforeHide(() => gate.scrollReset())`, `createLayout(gate, browserLayoutDeps())`, then `mount(App, { target, props: { layout } })`.
- `src/shell/game.svelte.ts` — `registerBeforeHide(fn)` (any state, run first in the hide flush); read only.
- `src/shell/dictionary.svelte.ts` — `dictionary.showBanner` getter, `dictionary.state`; read only.
- `src/shell/test-hook.ts` — `__wordcell.dictionaryState()` already exists; no change.
- `e2e/helpers/touch.ts` — `checkPoints(page, helper, points)`, `touchDrag`, `longPress` over a CDP session; add `touchHold`.
- `e2e/helpers.spec.ts` — `touchDrag / longPress` describe with `installProbe`/`probeEvents` (pointer event probe); add the `touchHold` cases there.
- `e2e/helpers/lifecycle.ts` — `hidePage`, `showPage`, `animationFrames`.
- `e2e/board.spec.ts` — `openFixture`, `box`; `AD-11 bands render in BAND_ORDER (default)`; `AD-17 F11 geometry` asserts bands sum 839 (must stay green).
- `e2e/dictionary.spec.ts` — `isList` route predicate pattern for holding/failing the word list; banner tests must stay green with the latch.
- `e2e/pwa/dist-smoke.spec.ts` — hook-free dist checks; add the `?bands=` ignored case.
- `src/ui/overlays.svelte.test.ts` — pattern for UI Vitest (node env, server-compiled runes: `$effect` never runs, `flushSync` no-op).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/gate.ts` -- `createGate({ raf, setTimer, clearTimer })` exactly as the ticket Description (counter, scroll-busy, 150 ms quiet timer, ignore flag, single outstanding raf, snapshot FIFO with busy re-check, idle transitions request the raf while the queue is non-empty); export `type Gate` -- AD-11 deferral.
- [x] `src/ui/gestures/gate.test.ts` -- one `describe('AD-11 gate pending work in the next idle frame, scroll busy until scrollend, hide or 150 ms')` with S cases on a fake raf queue and fake timers (`AD-11 …` names): idle work next frame; busy holds work and each transition to idle (leave to 0, scrollEnd, quiet timer, scrollReset) releases it; leave to 0 while scroll-busy does not run work; `leave()` at 0 throws; quiet timer re-armed by each scroll; own-write ignore and its flag clearing by a raf with an empty queue; at most one raf outstanding; snapshot FIFO, busy re-check returning the rest to the head in order; work queued during a flush waits for the next frame -- row 99 S.
- [x] `src/ui/layout/layout.svelte.ts` -- `createLayout(gate, deps)` and `browserLayoutDeps()` per the ticket Description (deps: `window`, `matchMedia`, `getComputedStyle`, `showBanner`, `watchBanner`; listeners resize, orientationchange, the hoverFine query `change`, `watchBanner`, passive `scroll`/`scrollend` → `gate.scroll()`/`gate.scrollEnd()`); first values synchronous, no scroll; one pending `whenIdle` relayout task reading live inputs and applying the predicate (or hoverFine ≠ `last.hoverFine`) and band re-layout on banner/innerHeight/inset change or after a w recompute; `scrollY` read before setting state, `flushSync()`, then `ignoreNextScroll()` + `scrollTo({ top })` only when the clamped target differs; insets probe (`position: fixed`, invisible, `pointer-events: none`, padding `env(safe-area-inset-top)`/`env(safe-area-inset-bottom)`) appended to `deps.window.document.body` at creation; band order `import.meta.env.DEV ? parseBandsParam(…) : BAND_ORDER` once; `wide` = `metrics.board > availableWidth(clientWidth, hoverFine)`, set with w and metrics; `browserLayoutDeps().watchBanner` = `$effect.root` + `$effect` reading `dictionary.showBanner` then calling cb -- AD-11, F20, F21.
- [x] `src/ui/layout/layout.svelte.test.ts` -- `createLayout` with a fake window (listener map, settable innerWidth/innerHeight/scrollY, `scrollTo` recorder, `location.search` ''), fake matchMedia (settable `matches`, change listener), fake getComputedStyle for the probe, stubbed `showBanner`, `watchBanner` capturing cb, a real gate on fake raf/timers with an `ignoreNextScroll` spy for ordering: every I/O-matrix layout row, each `it('AD-11 …')`, including `AD-11 w recompute on a hoverFine change`; inset change delivered with a `resize` event; ordering `ignoreNextScroll` before `scrollTo` -- row 94/99 S support.
- [x] `src/ui/App.svelte`, `src/ui/Board.svelte`, `src/ui/DictionaryBanner.svelte` -- `layout` prop App → Board; Board reads only layout getters, iterates `layout.bandOrder`, renders the banner band's content only while `layout.bannerShown`, Tray `w`/`innerWidth`/`height` from layout -- live layout, F20 latch.
- [x] `src/main.ts` -- create gate, register `scrollReset` with `registerBeforeHide`, create layout, mount App with it (order above; entry 6 will insert its `cancel` registration above the scroll reset) -- AD-16, AD-9.
- [x] CSS regions in `src/ui/Board.svelte` (`.board` sets `--wc-pan: pan-y`, or `pan-x pan-y` when `layout.wide`; `.spacer` (leftover, trayGap, actionGap) and the `.banner` band `touch-action: var(--wc-pan)`), `TopBar.svelte` (`.top-bar` pan; `.icon` `none`), `DictionaryBanner.svelte` (`.secondary` `none`), `ActionBar.svelte` (`.action-bar` pan; `.primary` `none`), `Column.svelte` (`.column` and `.foot` pan; `.foot` also `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none`), `Tray.svelte` (`.tray` pan), `WordCellRow.svelte` (`.label` pan + user-select none + callout none; `.wordcell` and `.count` `touch-action: none`, user-select none, callout none), `Card.svelte` (add `-webkit-touch-callout: none`; mirrors keep `none`), `src/ui/app.css` (`html { scrollbar-gutter: stable; overflow-anchor: none }`) -- DESIGN.md Scrolling, rows 98; ancestors (`.unit`, `.cards`, `.board`, `main`, `#app`, `body`, `html`) set nothing.
- [x] `e2e/helpers/touch.ts` -- `touchHold(page, from): Promise<{ moveTo(p): Promise<void>; end(): Promise<void> }>`: `checkPoints` on `from` before the CDP session opens; touchStart; `moveTo` throws once ended, validates, sends touchMove; a validation or send (CDP rejection) failure ends the hold (touchEnd attempt, detach in finally) and rethrows the original error; `end()` sends touchEnd and detaches once, then is a no-op -- F10.
- [x] `e2e/helpers.spec.ts` -- in `touchDrag / longPress` (rename the describe to include `touchHold`): `AD-17 touchHold holds a touch pointer across moveTo steps until end()` (probe order pointerdown, pointermoves, pointerup, all touch, no up before `end()`), `AD-17 touchHold moveTo throws after a failed moveTo or after end(); end() is then a no-op` (outside-viewport point; repeat `end()`), and `from` outside the viewport rejecting with no touch events -- F10.
- [x] `e2e/layout.spec.ts` (new, dev server) -- `AD-11 banner takes leftover first` (android, 412 × 915, word list failed via route 500 after the board is up: leftover track 177 → 133, tops of `columns` … `actionBar` bands unchanged); `AD-11 WordCell row box unchanged when the banner shows with leftover under 44 px` (android, 412 × 780: `[data-band="wordcells"]` box before/after, |Δ| < 1); `AD-11 banner during a scroll applied after it ends` (see Design Notes); `AD-11 touch-action and user-select regions (computed style)` (android on `session-composing` with a failed word list for the banner; desktop 370 × 750 asserting measured `clientWidth − 32 < 352` and `pan-x pan-y`, computed style only; html `scrollbar-gutter: stable`) -- rows 96, 98, 99 P4.
- [x] `e2e/board.spec.ts` -- `AD-11 ?bands= reorders bands in dev` (android; `?bands=topBar,banner,leftover,tray,columns,wordcells,actionBar`: `[data-band]` DOM order is the flattened permuted order and band tops are non-decreasing in it) -- row 95 dev half.
- [x] `e2e/pwa/dist-smoke.spec.ts` -- `AD-11 ?bands= ignored in dist/`: same query, `[data-band]` order equals the default list -- row 95 dist half.

**Acceptance Criteria:**
- Given the dev server on `android`, when the word list fails at 412 × 915, then the banner appears in the banner band, the leftover band shrinks by 44 px and every band from the columns down keeps its top.
- Given 412 × 780 (leftover 42), when the banner shows, then the WordCell row's bounding box moves by less than 1 px (the layout writes `scrollTop` 2 in the same frame).
- Given a held foot-pad pan at 412 × 600 with scroll events under 150 ms apart and the word list failed mid-pan, when the pan continues, then no banner is inserted until the first rAF after `scrollend` or the 150 ms quiet point (one tick slack); and when the page is hidden mid-pan, the banner is inserted by the first rAF after `visibilitychange`, before the quiet point (touch paths only).
- Given `session-composing` with a failed word list (and `session-won` for count badges), when a computed-style probe runs, then cards, tiles, WordCells and bar/banner buttons compute `touch-action: none`; the non-card regions compute `pan-y` on android and `pan-x pan-y` at desktop 370 × 750; region ancestors outside other regions up to html compute `auto`; user-select is `none` on cards, tiles, WordCells and their count badges, labels and foot pads.
- Given `npm run test:all` and `npm run test:screens`, when run, then both pass, with baselines unchanged unless a fixture render changed.

## Implementation Notes

- Scroll-during-banner procedure: **path 1** (foot-pad `touchHold` pan on android) works; paths 2 and 3 were not needed, so rows 96 and 99 keep their android P4 (hide variant included). Measured on Playwright 1.63.0 Chromium (412 × 600, `session-idle-fresh`): ten 3 px moves give scrollY 17 (touch slop about 13 px); ±3 px steps every ~50 ms change scrollY on every step with `scroll` events about 67 ms apart; a held pan fires no `scrollend` before release (it fired after `touchEnd`). The test steps pause *before* each move (35 ms + one rAF read), so the hide lands about 40 ms after the last scroll, inside the 100 ms validity window; `--repeat-each 8` passed 16/16.
- The banner's own anchor write (+44 at 412 × 600 while scrolled) fires one `scroll` after the insertion; the scroll test takes "last scroll" as the last one before the insertion (or before `visibilitychange`) and asserts at most that one scroll after it.
- I/O row "w recompute, scrollY > 0" literals: 412 × 780, banner shown, scrollY 2, hoverFine → true: w 43, leftover 6, anchor 653 → 655 (target 4) clamped to `[0, 780 − 780]` → `scrollTo({ top: 0 })`. Inset change 0/0 → 24/24 at 412 × 915: topBar 68, actionBar 84, leftover 129, w 46.
- `LayoutDeps` is generic over the probe element (`browserLayoutDeps(): LayoutDeps<HTMLDivElement>`) so `window` satisfies the structural type without casts.
- `touchHold`: a cleanup failure while ending a failed `moveTo` is dropped so the original error is rethrown (as the task prescribes).
- Screenshots: the four `desktop` baselines were regenerated in the container: `html { scrollbar-gutter: stable }` reserves the 15 px gutter, shifting the centred board 7 px left. The four `android` baselines are unchanged (overlay scrollbars).
- Unit suite warm median 4.44 s (4.64 / 4.44 / 4.37).

## Plan Change Log

## Review Triage Log

### 2026-10-02 — Review pass
- verdicts: 27 findings — high 0, medium 0, low 15, false 12, maybe-false 0
- findings:
  - `[false]` `[reject]` (blind) plan does not record test:all passing; triage log empty — the fix edits this build's plan; the results are recorded under Auto Run Result at Finalize.
  - `[low]` `[reject]` (blind) regions test probes only `session-composing` (+ `session-won` badges), not every phase — the region CSS is phase-independent and the ticket AC asks for computed style per region, not per phase; adding phases adds tests for an unlikely defect.
  - `[false]` `[reject]` (blind) no dist test for an invalid `?bands=` — in production `import.meta.env.DEV` is false, so the param is never parsed and cannot throw; the valid-permutation dist case already proves the param is ignored.
  - `[low]` `[reject]` (blind) banner-hide path not tested end to end — covered by the 1280 × 720 Vitest and by `dictionary.spec.ts` Reload tests (banner hidden in place); a scrolled-hide Playwright case is beyond the ticket AC.
  - `[low]` `[reject]` (blind) `wide`/`--wc-pan` switching on a later recompute untested — `wide` comes from the same `widthOf` at creation and recompute; an extra test guards an unlikely regression.
  - `[low]` `[patch]` (blind) passive option, `orientationchange` and coalescing untested — patched the `orientationchange` part (new `AD-11 an orientationchange (no resize) schedules a relayout` case); passive and coalescing rejected as low (the revert-before-idle case already emits several events before idle).
  - `[low]` `[reject]` (blind) browser `watchBanner` effect queues a redundant relayout at boot — real but harmless: the task finds no changed input and returns before any write.
  - `[low]` `[patch]` (blind) touchHold touchStart: a detach failure masks the original error — `session.detach().catch(() => undefined)` before rethrowing (shared with edge E1).
  - `[low]` `[reject]` (blind) ancestor walk does not start from the `none` targets — the wrappers between cards and regions (`.cards`, `.unit`) are asserted `auto` explicitly in `ANCESTORS`.
  - `[low]` `[reject]` (blind) hide variant: no final banner count, extra pages not closed — `rec.inserted` not null proves insertion; Playwright closes context pages at teardown.
  - `[low]` `[patch]` (blind) Board header comment "set none" reads as `touch-action: none` — reworded to "set no touch-action (they compute `auto`)".
  - `[low]` `[reject]` (blind) inset-only change without an event not pinned by a test — the behaviour is deliberate and recorded in `deferred`; pinning it adds a test for a recorded limitation.
  - `[low]` `[patch]` (edge E1) touchHold touchStart detach masks the original error — same patch as above.
  - `[false]` `[reject]` (edge) `parseFloat` of probe padding may be NaN — computed `padding-top`/`padding-bottom` always resolve to px lengths (env() falls back to 0px), so NaN cannot occur.
  - `[low]` `[patch]` (edge) `Math.max(...gaps.slice(-6))` passes vacuously with no gaps — added `expect(gaps.length).toBeGreaterThanOrEqual(6)`.
  - `[low]` `[patch]` (edge) missing `visibilitychange` surfaces as "no scroll before the banner" — explicit "no visibilitychange recorded" failure added.
  - `[low]` `[patch]` (verification-gap) `overflow-anchor: none` never asserted — `expectRegions` now asserts `overflowAnchor` is `none` on html.
  - `[low]` `[patch]` (verification-gap) `orientationchange` listener only counted — new Vitest case emits it alone and asserts the relayout (shared with the blind row above).
  - `[low]` `[reject]` (verification-gap) touchHold CDP-rejection branch untested — needs fault injection into the CDP session; the validation failure exercises the same `finish()` path.
  - `[low]` `[patch]` (verification-gap, other) `rec.visibility[0]` undefined gives a misleading message — same patch as edge row.
  - `[false]` `[reject]` (intent) real-device pans vs computed style — the ticket AC asks for computed style (rule-coverage row 98), plus the foot-pad pan, both delivered.
  - `[false]` `[reject]` (intent) Svelte effects and the real flushSync are not in unit tests — by design (server-compiled runes); the Playwright 412 × 780 and 412 × 600 cases exercise them.
  - `[false]` `[reject]` (intent) only the quiet-point branch observed in Playwright; only the last six gaps checked — the AC says "scrollend or the quiet point" (whichever occurs; a held pan fires no scrollend, measured); any earlier gap > 150 ms would insert the banner and fail the per-step no-insertion check.
  - `[false]` `[reject]` (intent) plan AC says "built app" while tests run on the dev server — the fix edits this build's plan; the ticket asks for Playwright android (dev) plus dist-smoke for `?bands=`.
  - `[false]` `[reject]` (intent) inset change needs an event (R3a vs R3b) — the ticket's review log resolves it: the inset change in Vitest is delivered with a `resize`; the limitation is recorded in `deferred`.
  - `[false]` `[reject]` (intent) hide case retries once instead of failing at once — the review log's unapplied minor prescribes "retry once when the timing precondition is invalid".
  - `[false]` `[reject]` (intent) the layout Vitest asserts the fake `body.append` count — a fake recorder, not the DOM; no harm.

## Design Notes

**Banner-during-scroll procedure (rows 96, 99 P4).** Route the word list held (`page.route(isList, …)` storing the route); open `session-idle-fresh` at 412 × 600 (android). Install in-page recorders before the pan: a continuous rAF tick log (`performance.now()`), `scroll`/`scrollend` timestamps on window, a MutationObserver on `[data-band="banner"]` stamping the first insertion of the banner content, `visibilitychange` timestamp. Path 1: `touchHold` on `foot-1`'s centre (nothing selected), first steps 3 px one way past the touch slop (about 20 px), then 2–3 px steps every ~50 ms (alternating direction allowed), staying within the 122 px range; assert `scrollY` changed between steps; once scrolling, fulfil the held route with 500; keep stepping while polling `__wordcell.dictionaryState()` to `failed`; keep stepping ≥ 300 ms more checking no insertion while consecutive scroll gaps < 150 ms; then stop moving (finger down) and `end()`; assert insertion tick ≤ (first tick after `min(scrollend, lastScroll + 150)`) + 1. Hide variant (separate test or `test.step`): same until the no-banner check, stop moves, `animationFrames(page, 1)`, `hidePage`, `showPage`; validity: `lastScroll < visibilitychange < lastScroll + 100`, else repeat the run once, then fail as invalid; assert insertion by the first tick after `visibilitychange` (+1 slack) and before `lastScroll + 150`. `end()` in `finally`. Path 2 (if path 1 does not scroll or fires `scrollend` before release): `Input.synthesizeScrollGesture` (touch, slow speed so the gesture lasts ≥ 2 s, `preventFling`) sent without awaiting; the route failure and the polling run during it; the hide variant hides while it runs; the no-scrollend-before-release premise is re-checked. Path 3 (last): `desktop` `page.mouse.wheel` steps under 150 ms apart; the hide variant is then S-only (gate Vitest) and rows 96 and 99 lose their android P4: report both in Implementation Notes and the auto-run result. Record the path taken and the measured facts (scroll between steps, scrollend timing) in Implementation Notes.

**Relayout task** (sketch; the ticket is the contract):

```ts
const y = deps.window.scrollY;
const next = bands(nextW, bandOrder, 1, banner, innerHeight, insets);
const target = anchorScroll(applied, next, y, innerHeight);
/* set w/metrics/wide (on recompute), heights, bannerShown; last/applied inputs */
flushSync();
if (target !== y) { gate.ignoreNextScroll(); deps.window.scrollTo({ top: target }); }
```

**Resolved review-log items.** Notes "entry 1 plan" < 384 bound → frontmatter `deferred` (unverified, not built). createLayout cases: upper-bound clamp (412 × 600 → 660, 122 → 62), banner show reverting before idle, creation-time getters with no `scrollTo`, all `AD-11 …` → I/O matrix and layout test task. touchHold send failures and `from` validated before the session → touch.ts task. Layout after a mid-game AD-15 halt or on the rejected root: it keeps listening and re-laying (state is unread; the write clamps; the latched state carries to New game): harmless, no code. Regions: user-select list plus the count badge; mirrors stay `none` (entry 11 overrides in the view sheet); `scrollbar-gutter` asserted on html; 370 × 750 computed style only → regions test task. Hide case retry once; wheel fallback reports rows 96 and 99 → Design Notes above. Inset change via `resize` → layout test task. Pass 3: `leave()`-at-0 throw case and touch slop → gate test task, procedure above. Pass 4: synthesizeScrollGesture per-path procedure → above; the ignore flag suppresses every scroll until the next rAF but not the own write's `scrollend` (accepted edge, no code); `.board` gutters outside bands stay `auto` (accepted); `?bands=` non-permutation throws inside `boot()` → AD-15 in dev, by construction (row 94 S covers the throw). Pass 5: viewports where w changes (839 → 779 → 719; width-limited hoverFine flip 412 × 915) and a w recompute at scrollY > 0 → matrix; inset-only change detection on resize only (no ResizeObserver, `deferred`); `html { overflow-anchor: none }` adopted so browser scroll anchoring adds no unignored scroll; regions setup `session-composing` plus failed route; `?bands=` asserted as DOM order plus non-decreasing tops.

## Verification

**Commands:**
- `npm test -- src/ui/gestures src/ui/layout` -- expected: gate and layout cases pass.
- `npx playwright test e2e/layout.spec.ts e2e/board.spec.ts e2e/helpers.spec.ts e2e/dictionary.spec.ts` -- expected: pass on both projects (android-only cases skip on desktop).
- `npm run test:all` -- expected: exit 0 (unit suite still under 5 s warm).
- `npm run test:screens` -- expected: pass; baselines regenerated only if a fixture render changed (record which).

## Auto Run Result

**Summary.** Ticket 4.4 built: the AD-11 gate (`src/ui/gestures/gate.ts`), the live layout (`src/ui/layout/layout.svelte.ts`) created in `main.ts` and passed App → Board, the F20 gate-latched banner, the DESIGN.md Scrolling touch-action/user-select regions (`--wc-pan`), `html { scrollbar-gutter: stable; overflow-anchor: none }`, the `touchHold` e2e helper, and the AD-11 Vitest and Playwright cases.

**Files changed.**
- `src/ui/gestures/gate.ts`, `gate.test.ts` — gate and its S cases.
- `src/ui/layout/layout.svelte.ts`, `layout.svelte.test.ts` — live layout, `browserLayoutDeps()` and its fake-deps cases.
- `src/main.ts` — gate, `registerBeforeHide(scrollReset)`, layout, `mount(App, { props: { layout } })`.
- `src/ui/App.svelte`, `Board.svelte`, `DictionaryBanner.svelte` — layout prop, layout getters and band order, banner latch.
- `src/ui/TopBar.svelte`, `ActionBar.svelte`, `Column.svelte`, `Tray.svelte`, `WordCellRow.svelte`, `Card.svelte`, `app.css` — touch-action/user-select regions, html gutter and anchoring.
- `e2e/helpers/touch.ts`, `e2e/helpers.spec.ts` — `touchHold` and its self-tests.
- `e2e/layout.spec.ts` — banner leftover, WordCell row box, banner during scroll (end and hide), regions.
- `e2e/board.spec.ts`, `e2e/pwa/dist-smoke.spec.ts` — `?bands=` dev and dist halves.
- `e2e/board.screens.spec.ts-snapshots/*-desktop-linux.png` — four desktop baselines regenerated in the container (the 15 px stable gutter moves the board 7 px); android unchanged.

**Review.** 27 findings: 6 patch rows applied (4 distinct fixes plus 2 tests: touchStart detach catch, Board comment, gaps-length guard, visibilitychange guard, `overflow-anchor` assert, `orientationchange` case); 0 deferred by review; 21 rejected with reasons in the triage log. Patched counts by verdict: high 0, medium 0, low 6. Follow-up review recommended: false (no high, fewer than two medium patched).

**Verification.** `npx vitest run src/ui/gestures src/ui/layout` 71 passed (before patches); `npm run test:all` exit 0 twice (before and after patches; unit 1741 tests, dev e2e 249 passed / 207 skipped, pwa and dist-smoke green, unit warm median 4.44 s); `npm run test:screens` 8/8 passed in the container. Scroll path: path 1 (foot-pad `touchHold`) works, so rule-coverage rows 96 and 99 keep their android P4; no fallback used.

**Residual risks.** The hide case needs `visibilitychange` within 100 ms of the last scroll (measured ~40 ms; retries once, then fails as invalid) and could flake on a slow CI runner. Frontmatter `deferred`: desktop < 384 px clientWidth height rule unverified; F22 banner offset exception; inset changes applied only on the next event.
