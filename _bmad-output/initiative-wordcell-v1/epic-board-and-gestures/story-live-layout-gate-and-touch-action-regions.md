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

- src/ui/gestures/gate.ts: `createGate({ raf, setTimer, clearTimer }) → { enter, leave, busy, whenIdle, scroll, scrollEnd, ignoreNextScroll, scrollReset }`. `busy` is counter > 0 or scroll-busy; `leave()` at count 0 throws (rule 6). `scroll()` marks scroll-busy and (re)arms the 150 ms quiet timer, except while the ignore flag is set; the flag clears in the next raf whether or not a scroll fired (build-notes CAP-3). `scrollEnd()`, the quiet timer or `scrollReset()` (clears the flag and the timer) end scroll-busy. `whenIdle(fn)` runs a snapshot of queued fns FIFO in the first raf with the gate idle; work queued during the flush waits for the next idle frame.
- src/ui/layout/layout.svelte.ts: `createLayout(gate, deps)`, deps injecting window, matchMedia and getComputedStyle so UI Vitest drives it; `$state` getters w, metrics, heights, bandOrder, bannerShown, wide (board wider than the available width). Created once in main.ts right after the gate, before `mount(App, { target, props: { layout } })`; App passes it to Board, which replaces its mount-time inputs (Board.svelte header comment) with these getters. Listeners are attached at creation for the app's lifetime: resize, orientationchange, the hoverFine media query, `dictionary.showBanner`, and passive window `scroll`/`scrollend` forwarded to the gate.
  - First values computed synchronously at creation from the current viewport, insets, hoverFine and `dictionary.showBanner`, with no scroll delta; later changes go through the gate.
  - Calls geometry.ts `cardWidth`, `availableWidth`, `cardMetrics`, `bands`, `shouldRecomputeWidth(last, next)` (`last` updated only on a w recompute, AD-11) and `anchorScroll(prev, next, scrollTop, innerHeight)`; never re-derives. w recomputes per the predicate and always on a hoverFine change; bands re-lay on banner show/hide, innerHeight-only changes under 80 px (F21) and after every w recompute, each with the clamped anchor delta.
  - At most one pending `whenIdle` relayout task; when it runs it reads live innerWidth/innerHeight, hoverFine, insets and `dictionary.showBanner`, applies the predicate against `last` and one anchor delta from the last applied result (no-op if nothing changed). In that task: set state, Svelte `flushSync()`, then write `scrollTop` only when the clamped target differs from the current value, calling `gate.ignoreNextScroll()` before the write.
  - Band order: `import.meta.env.DEV ? parseBandsParam(new URLSearchParams(location.search)) : BAND_ORDER`, parsed once, inert in every production build including dist-test; the one order feeds `bands()` and Board's band iteration.
  - env(safe-area-inset-*) probe read at creation and in every relayout task, feeding geometry's `Insets` (top, bottom).
- Banner latch (F20): the banner band and DictionaryBanner render from the gate-latched `bannerShown`; only Reload's disabled state (and epic 5's Validate label, AD-11) read the live dictionary state.
- CSS: html `scrollbar-gutter: stable`; touch-action none on cards, tiles and WordCells, pan-y (pan-x pan-y when `wide`) on non-card regions (the foot row's none while a tail is selected is entry 7); user-select: none and -webkit-touch-callout: none on cards, tiles, WordCells, labels and foot pads (the view sheet's is entry 11).
- main.ts creates the one gate after `game.load()` and registers its scroll reset with `game.registerBeforeHide` (build-notes reading of AD-9); entry 6 registers the controller's `cancel` ahead of it so cancel stays first.
- e2e/helpers/touch.ts `touchHold(page, from) → { moveTo, end }` (F10): `from` and each `moveTo` reuse `checkPoints`; `end()` sends touchEnd and detaches; `moveTo`/`end` after `end()` throw. Its helpers.spec.ts case asserts event order on a probe and the throw after end.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines regenerated in the container only where the four fixture renders change), with:

- UI Vitest `AD-11 gate pending work in the next idle frame, scroll busy until scrollend, hide or 150 ms` (S cases on injected raf/timers, calling the gate methods directly, own-write ignore included).
- UI Vitest on `createLayout` with injected deps and the gate: `AD-11 w recompute on a hoverFine change` (innerWidth/innerHeight unchanged); two 60 px shrinks recompute on the second; a w recompute applies the clamped anchor delta; a shrink that reverts before idle changes nothing.
- Playwright `AD-11 banner takes leftover first`: at 412 × 915 (leftover 177 at w 46) the leftover shrinks by the banner height and bands below it do not move.
- Playwright `AD-11 WordCell row box unchanged when the banner shows with leftover under 44 px` at 412 × 780.
- Playwright `AD-11 banner during a scroll applied after it ends` at 412 × 600 under build-notes CAP-3's conditions (route failed only after the pan starts, `scrollY` changes between steps, small steps within the scroll range): the android touchHold pan from a foot pad, or the build-notes fallback (the plan records which); no banner while scroll events arrive under 150 ms apart, then the banner within 2 frames of scrollend or 150 ms quiet, timed in-page (performance.now() on scroll/scrollend and on banner insertion via MutationObserver).
- Playwright `AD-11 touch-action and user-select regions (computed style)`: cards, tiles and WordCells `none`; DESIGN.md Scrolling's non-card regions, labels band included, `pan-y`; at 340 × 750 (w 40, board 352 > 332 available) `pan-x pan-y` via `wide`; `user-select` only (rule-coverage).
- Playwright `AD-11 ?bands= reorders in dev and is ignored in dist/ (dist-smoke)`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-3
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.review-log.md, Result (Unapplied minors)

## Notes

- Open question: Whether a CDP touch pan from a pan-y foot pad scrolls the document and fires no scrollend before release (unverified; build-notes CAP-3 fallbacks: desktop page.mouse.wheel steps or Input.synthesizeScrollGesture).
- Deferred from done plans: the banner's sticky offset keeps DESIGN.md's 44 px top bar (record the F22 exception); sub-pixel tolerance on bounding-box asserts with fractional insets; desktop below 360 px clientWidth, horizontal scrollbar vs the height rule (entry 1 plan).
