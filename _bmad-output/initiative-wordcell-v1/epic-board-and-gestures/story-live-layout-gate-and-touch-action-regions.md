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

Owns gate.ts (the controller, fly-back and layout all count through it), layout.svelte.ts, the touch-action/user-select CSS regions, and the touchHold helper every later drag test uses.

- src/ui/gestures/gate.ts: `createGate({ raf, setTimer, clearTimer }) → { enter, leave, busy, whenIdle, scroll, scrollEnd, ignoreNextScroll, scrollReset }`. `busy` is counter > 0 or scroll-busy; `leave()` at count 0 throws (rule 6). `scroll()` marks scroll-busy and (re)arms the 150 ms quiet timer, except while the ignore flag is set; the flag clears in the next raf whether or not a scroll fired (build-notes CAP-3). `scrollEnd()` and the quiet timer clear scroll-busy and the timer; `scrollReset()` clears scroll-busy, the ignore flag and the timer. `whenIdle(fn)` queues fn; at most one raf is outstanding, requested on `whenIdle` and on every busy→idle transition (leave to 0, scrollEnd, quiet timer, scrollReset) while the queue is non-empty. A raf finding the gate busy does nothing, else runs a snapshot FIFO, each fn re-checking `busy` (if busy, the rest return to the queue head in order); work queued during the flush waits for the next idle frame.
- src/ui/layout/layout.svelte.ts: `createLayout(gate, deps)`, every DOM read/write through deps (`window` with its document, location, scrollY, scrollTo; matchMedia; getComputedStyle; `watchBanner(cb)`, in the browser an `$effect.root` over `dictionary.showBanner`, called directly by Vitest, where server-compiled runes run no `$effect` and `flushSync` is a noop); `$state` getters w, metrics, heights, bandOrder, bannerShown, wide (board wider than the available width). Created once in main.ts right after the gate, before `mount(App, { target, props: { layout } })`; App passes it to Board, which replaces its mount-time inputs (Board.svelte header comment) with these getters. Listeners are attached at creation for the app's lifetime: resize, orientationchange, the hoverFine media query, `watchBanner`, and passive window `scroll`/`scrollend` forwarded to the gate.
  - First values computed synchronously at creation from the current viewport, insets, hoverFine and `dictionary.showBanner`, with no scroll delta; later changes go through the gate.
  - Calls geometry.ts `cardWidth`, `availableWidth`, `cardMetrics`, `bands`, `shouldRecomputeWidth(last, next)` (`last` updated only on a w recompute, AD-11, and also recording that computation's hoverFine) and `anchorScroll(prev, next, scrollTop, innerHeight)`; never re-derives. `cardWidth`/`availableWidth` get `documentElement.clientWidth`; innerWidth feeds only the predicate. `trayRows` is fixed at 1 (build-notes CAP-1; AD-11's tray-row trigger is epic 5). w recomputes when the predicate holds or hoverFine differs from `last`'s (flip and flip-back before idle: no-op); bands re-lay when bannerShown, innerHeight (F21) or either inset differs from the last applied inputs, and after every w recompute, each with the clamped anchor delta.
  - At most one pending `whenIdle` relayout task; when it runs it reads live innerWidth/innerHeight, hoverFine, insets and `dictionary.showBanner`, applies the predicate against `last` and one anchor delta from the last applied result (no-op if nothing changed). In that task: set state, Svelte `flushSync()`, then write `scrollTop` only when the clamped target differs from the current value, calling `gate.ignoreNextScroll()` before the write.
  - Band order: `import.meta.env.DEV ? parseBandsParam(new URLSearchParams(deps.window.location.search)) : BAND_ORDER`, parsed once, inert in every production build including dist-test; the one order feeds `bands()` and Board's band iteration.
  - env(safe-area-inset-*) probe (build-notes CAP-3) created in `deps.window.document` at creation, read then and in every relayout task, feeding geometry's `Insets` (top, bottom).
- Banner latch (F20): the banner band and DictionaryBanner render from the gate-latched `bannerShown`; only Reload's disabled state (and epic 5's Validate label, AD-11) read the live dictionary state.
- CSS: html `scrollbar-gutter: stable`; touch-action none on cards, tiles and WordCells, pan-y (pan-x pan-y when `wide`) on the non-card regions only, the banner background outside Reload and the 4 px tray gap included (ancestors stay `auto`, as touch-action intersects; the foot row's none while a tail is selected is entry 7); user-select: none and -webkit-touch-callout: none on cards, tiles, WordCells, labels and foot pads (the view sheet's is entry 11).
- main.ts creates the one gate, then the layout, after `game.load()`'s halted return and before `game.registerLifecycle()` (entry 6, AD-16), and registers its scroll reset with `game.registerBeforeHide` (build-notes reading of AD-9); entry 6 registers the controller's `cancel` ahead of it so cancel stays first.
- e2e/helpers/touch.ts `touchHold(page, from) → { moveTo, end }` (F10): `from` and each `moveTo` reuse `checkPoints`; `end()` sends touchEnd and detaches; `moveTo` validates first and on failure sends touchEnd and detaches before rethrowing; `moveTo`/`end` after either throw; callers end holds in try/finally. Its helpers.spec.ts case asserts event order on a probe and the throw after end.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines regenerated in the container only where the four fixture renders change), with:

- UI Vitest `AD-11 gate pending work in the next idle frame, scroll busy until scrollend, hide or 150 ms` (S cases on injected raf/timers, calling the gate methods directly, own-write ignore included; leave to 0, the quiet timer and scrollReset each release queued work).
- UI Vitest on `createLayout` with injected deps and the gate: `AD-11 w recompute on a hoverFine change` (innerWidth/innerHeight unchanged); two 60 px shrinks recompute on the second; a w recompute applies the clamped anchor delta, `ignoreNextScroll` before the write, no write when the target equals scrollTop; a shrink that reverts before idle changes nothing. Assert `$state` getters and scroll writes through fakes, never DOM or effects.
- Playwright (android) `AD-11 banner takes leftover first`: at 412 × 915 (leftover 177 at w 46) the leftover shrinks by the banner height and bands below it do not move.
- Playwright (android) `AD-11 WordCell row box unchanged when the banner shows with leftover under 44 px` at 412 × 780.
- Playwright `AD-11 banner during a scroll applied after it ends` at 412 × 600 under build-notes CAP-3's conditions (route failed only after the pan starts, `scrollY` changes between steps, small steps within the scroll range): the android touchHold pan from a foot pad, else CDP `Input.synthesizeScrollGesture` (touch) on android, last desktop `page.mouse.wheel` steps (a SPEC Constraints exception; the plan records which). While the pan continues, poll `__wordcell.dictionaryState()` until `failed`; no banner insertion from then while scroll events arrive under 150 ms apart, then the banner within a frame: inserted (MutationObserver) by the first rAF after scrollend or the 150 ms quiet point, counted in-page in rAF ticks (any slack is a plan-recorded test tolerance). Hide case: a held pan, `hidePage` then `showPage` within 150 ms, the banner before the quiet point.
- Playwright `AD-11 touch-action and user-select regions (computed style)`: cards, tiles and WordCells `none`; DESIGN.md Scrolling's non-card regions, labels band included, `pan-y` (android); at desktop 370 × 750 (clientWidth 355, available 323 < board 352) `pan-x pan-y` via `wide`; every ancestor of each checked region up to html computes `auto`; `user-select` only (rule-coverage).
- Playwright (android) `AD-11 ?bands= reorders bands in dev` beside board.spec.ts; `AD-11 ?bands= ignored in dist/` in e2e/pwa/dist-smoke.spec.ts (SPEC Constraints exception).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-3
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.review-log.md, Result (Unapplied minors)

## Notes

- Open question: Whether a CDP touch pan from a pan-y foot pad scrolls the document and fires no scrollend before release (unverified; fallbacks in the order above).
- Deferred from done plans: the banner's sticky offset keeps DESIGN.md's 44 px top bar (record the F22 exception); bounding-box asserts allow < 1 px with fractional insets; the desktop < 360 px clientWidth case, horizontal scrollbar vs the height rule (entry 1 plan), is recorded in the plan as unverified, not built.
