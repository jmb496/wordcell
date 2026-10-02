---
id: 4
type: story
title: "Live layout, gate and touch-action regions"
parent: epic-board-and-gestures
covers: [CAP-3]
after: [3]
risk: high
---

# Live layout, gate and touch-action regions

## Description

Owns gate.ts (controller and fly-back count through it; layout defers), layout.svelte.ts, the touch-action/user-select CSS regions, and the touchHold helper later drag tests use.

- src/ui/gestures/gate.ts: `createGate({ raf, setTimer, clearTimer }) → { enter, leave, busy, whenIdle, scroll, scrollEnd, ignoreNextScroll, scrollReset }`. `busy` getter: counter > 0 or scroll-busy; `leave()` at count 0 throws (rule 6). `scroll()` marks scroll-busy and (re)arms the 150 ms quiet timer unless the ignore flag is set; `ignoreNextScroll()` sets it and requests the raf (build-notes CAP-3). `scrollEnd()` and the quiet timer clear scroll-busy and the timer; `scrollReset()` clears those and the flag. `whenIdle(fn)` queues fn. At most one raf is outstanding, its mark cleared as the callback starts; also requested on `whenIdle` and every transition to idle (leave to 0, scrollEnd, quiet timer, scrollReset) while the queue is non-empty. Each raf first clears the flag, scroll or not; if busy it stops, else runs a snapshot FIFO, each fn re-checking `busy` (if busy, the rest return to the queue head in order); work queued during the flush waits for the next idle frame.
- src/ui/layout/layout.svelte.ts: `createLayout(gate, deps)`, every DOM read/write through deps (`window`: every read, write and listener; matchMedia; getComputedStyle; `showBanner()`, `watchBanner(cb)`: in `browserLayoutDeps()`, exported and passed by main.ts, `() => dictionary.showBanner` and an `$effect.root` over it; Vitest stubs `showBanner`, calls cb directly, where server-compiled runes run no `$effect` and `flushSync` is a noop); `$state` getters w, metrics, wide (set together; board wider than available width), heights, bandOrder, bannerShown. Created once, before `mount(App, { target, props: { layout } })`; App passes it to Board, which replaces its mount-time inputs (Board.svelte header comment) with these getters. App-lifetime listeners attached at creation: resize, orientationchange, the hoverFine media query, `watchBanner`, and passive window `scroll`/`scrollend` forwarded to the gate.
  - First values computed synchronously at creation from the relayout task's live inputs, no scroll delta; later changes go through the gate.
  - Calls geometry.ts `cardWidth`, `availableWidth`, `cardMetrics`, `bands`, `shouldRecomputeWidth(last, next)` (`last`, with its hoverFine, updated only on a w recompute, AD-11) and `anchorScroll(prev, next, scrollTop, innerHeight)`; never re-derives. `cardWidth`/`availableWidth` get `documentElement.clientWidth`; innerWidth feeds only the predicate. `trayRows` is fixed at 1 (build-notes CAP-1; AD-11's tray-row trigger is epic 5). w recomputes when the predicate holds or hoverFine differs from `last`'s (flip and flip-back before idle: no-op); bands re-lay when bannerShown, innerHeight (F21) or either inset differs from the last applied inputs, and after every w recompute, each with the clamped anchor delta.
  - At most one pending `whenIdle` relayout task, reading live innerWidth/innerHeight, hoverFine, insets and `deps.showBanner()`, applying the predicate against `last` and one anchor delta from the last applied result (no-op if unchanged): read `scrollY`, set state, Svelte `flushSync()` (may clamp), then, if the clamped target differs from that read, `gate.ignoreNextScroll()` and `deps.window.scrollTo({top})`.
  - Band order: `import.meta.env.DEV ? parseBandsParam(new URLSearchParams(deps.window.location.search)) : BAND_ORDER`, parsed once, inert in every production build including dist-test; the one order feeds `bands()` and Board's band iteration.
  - env(safe-area-inset-*) probe (build-notes CAP-3) created in `deps.window.document` at creation, read then and in every relayout task, feeding geometry's `Insets` (top, bottom).
- Banner latch (F20): the banner band and DictionaryBanner render from the gate-latched `bannerShown`; only Reload's disabled state (and the ActionBar's Validate label, AD-11) read the live dictionary state.
- CSS: html `scrollbar-gutter: stable`; touch-action none on cards, tiles and WordCells, pan-y (pan-x pan-y when `wide`) on the non-card regions only, the banner background outside Reload and the 4 px tray gap included, each on a background element (a column's on `.column` and `.foot`, AD-12 hit rect unchanged) whose none descendants stay none (touch-action intersects) and buttons set none; non-region ancestors stay `auto` (the foot row's none while a tail is selected is entry 7); user-select: none and -webkit-touch-callout: none on cards, tiles, WordCells, labels and foot pads (the view sheet's is entry 11).
- main.ts creates the one gate, then the layout, after `game.load()`'s halted return and before `game.registerLifecycle()` (entry 6, AD-16), and registers its scroll reset with `game.registerBeforeHide` (build-notes reading of AD-9); entry 6 inserts its `cancel` registration above this one.
- e2e/helpers/touch.ts `touchHold(page, from) → { moveTo, end }` (F10): `from` and each `moveTo` reuse `checkPoints`; `end()` sends touchEnd and detaches; `moveTo` validates first, on failure doing the same before rethrowing; after a failed `moveTo` or `end()`, `moveTo` throws and `end()` is a no-op; callers end holds in try/finally. helpers.spec.ts asserts probe event order, both `moveTo` throws and `end()` no-ops.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines regenerated only where the four fixture renders change), with:

- UI Vitest `AD-11 gate pending work in the next idle frame, scroll busy until scrollend, hide or 150 ms` (S cases on injected raf/timers, calling the gate methods directly, own-write ignore and its flag clearing with an empty queue included; each transition to idle releases queued work).
- UI Vitest on `createLayout` with injected deps and the gate: `AD-11 w recompute on a hoverFine change` (innerWidth/innerHeight unchanged); a 60 px innerHeight shrink keeps w, shrinks the `heights` leftover, writes no scroll at scrollTop 0, and a second recomputes w; an inset change re-lays bands; a w recompute applies the clamped anchor delta, `ignoreNextScroll` before `scrollTo`, neither when the target equals the pre-flush `scrollY`; a banner hide at max scroll (1280 × 720) scrolls 46 → 2; a shrink that reverts before idle changes nothing. Assert getters and fake scroll writes, never DOM or effects.
- Playwright (android) `AD-11 banner takes leftover first`: at 412 × 915 (leftover 177, w 46) the leftover shrinks by the banner height; bands below stay put.
- Playwright (android) `AD-11 WordCell row box unchanged when the banner shows with leftover under 44 px` at 412 × 780.
- Playwright `AD-11 banner during a scroll applied after it ends` at 412 × 600 under build-notes CAP-3's conditions: a foot-pad touchHold pan, else CDP `Input.synthesizeScrollGesture` (touch), both android, last desktop `page.mouse.wheel` (build-notes CAP-3's fallback, off SPEC Constraints' android rule; the plan records which). While the pan continues, poll `__wordcell.dictionaryState()` until `failed`; no banner insertion from then while scroll events arrive under 150 ms apart, then the banner inserted (MutationObserver) by the first rAF after scrollend or the quiet point, counted in-page in rAF ticks (one-tick measurement slack, both cases). Hide case (touch paths; S-only on the wheel, plan-recorded): same pan, after `failed` and the no-banner check, stop moves, await one rAF, `hidePage`, `showPage`; in-page timestamps put visibilitychange after the last scroll, within 100 ms (else it fails as invalid) and the banner inserted by the first rAF after it, before the quiet point.
- Playwright `AD-11 touch-action and user-select regions (computed style)`: cards, tiles, WordCells and bar/banner buttons `none`; DESIGN.md Scrolling's non-card regions, labels, banner background and tray gap included, `pan-y` (android; foot row: `.foot`); at desktop 370 × 750 (measured clientWidth − 32 < board 352) `pan-x pan-y` via `wide`; non-region ancestors up to html compute `auto`; `user-select` only (rule-coverage).
- Playwright (android) `AD-11 ?bands= reorders bands in dev` in board.spec.ts (`?bands=topBar,banner,leftover,tray,columns,wordcells,actionBar`: `[data-band]` vertical order); `AD-11 ?bands= ignored in dist/` in e2e/pwa/dist-smoke.spec.ts (SPEC Constraints exception).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-3
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.review-log.md, Result (Unapplied minors)

## Notes

- Open question: whether a CDP touch pan from a pan-y foot pad scrolls the document without scrollend before release (fallbacks above).
- Deferred from done plans: the banner's sticky offset keeps DESIGN.md's 44 px top bar (record the F22 exception); bounding-box asserts allow < 1 px with fractional insets; the desktop < 384 px clientWidth case, horizontal scrollbar vs the height rule (entry 1 plan), is plan-recorded as unverified, not built.
