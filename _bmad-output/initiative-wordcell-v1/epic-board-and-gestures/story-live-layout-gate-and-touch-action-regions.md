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

Builds src/ui/gestures/gate.ts (createGate({ raf, setTimer, clearTimer }): enter/leave counter, scroll busy from the first scroll until scrollend, a 150 ms quiet timer or the before-hide reset, whenIdle(fn) in the next idle requestAnimationFrame), src/ui/layout/layout.svelte.ts ($state w, band heights and anchor offset; resize/orientationchange and the hoverFine media query recomputing w through the gate per entry 1's predicate, always on a hoverFine change (review-log Pass 7 minor), band re-layout on banner show/hide and innerHeight-only changes under 80 px, the clamped anchor scrollTop delta in the same frame with its own scroll event ignored), the env(safe-area-inset-*) probe, the banner latch from dictionary.showBanner (F20), html scrollbar-gutter: stable, touch-action none on cards, tiles and WordCells and pan-y (pan-x pan-y when wider) on non-card regions (the foot row's none while a tail is selected is entry 7), user-select: none and -webkit-touch-callout: none on cards, tiles, WordCells, labels and foot pads (the view sheet's is entry 11), ?bands= in dev only, main.ts creating the one gate and registering its scroll reset with game.registerBeforeHide, and the stepwise held-touch helper touchHold(page, from) → { moveTo, end } in e2e/helpers/touch.ts with its helpers.spec.ts case (F10).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines regenerated in the container only where the four fixture renders change) with UI Vitest AD-11 gate cases on injected raf/timers, and Playwright shows the banner taking leftover first, the WordCell row's bounding box unchanged when the banner shows at 412 × 780, a banner held off during a touchHold pan from a foot pad at 412 × 600 while scroll events arrive under 150 ms apart and shown within a frame of scrollend or 150 ms quiet, computed touch-action and user-select per region, ?bands= reordering bands in dev, and dist-smoke showing ?bands= ignored in dist/.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-3
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.review-log.md, Result (Unapplied minors)

## Notes

- Open question: Whether a CDP touch pan from a pan-y foot pad scrolls the document and fires no scrollend before release (unverified; build-notes CAP-3 fallbacks: desktop page.mouse.wheel steps or Input.synthesizeScrollGesture).
