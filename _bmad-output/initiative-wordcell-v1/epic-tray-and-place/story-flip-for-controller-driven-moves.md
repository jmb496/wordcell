---
id: 16
type: story
title: "FLIP for controller-driven moves"
parent: epic-tray-and-place
covers: [CAP-8]
after: [10]
risk: high
---

# FLIP for controller-driven moves

## Description

Wires entry 10's flip.ts into the pointer controller: every `game.dispatch` in `controller.ts` is bracketed: `flip.capture()` directly before it (after any `deselect`/`clearTile`) and `flip.play(command, result)` directly after, unconditionally, even on a no-op: `applyTile` swap and removal, `perform` drop, tapDestinationCard, addFreeLetter, setTarget (capture/play with an empty animated set), the drag-as-tap tapDestinationCard, the tail drag drop, and the tile and free-letter release command (F7, F17, build-notes CAP-8).

Release order: `end()` takes the capture on kind 'up' when the release will dispatch (tail: `highlighted !== null`; tile and free letter: `releaseCommand !== null`), computing that predicate once and recording the capture; `pointerup` dispatches iff `end()` captured, then plays. The capture runs after the selection clear (`overlays.deselect` / `clearTile`) and before `parting.finishAll()` and `clearDrag`, so the parted and shifted faces' rendered, possibly mid-animation, offsets are the previous rects (CAP-8); then `clearDrag`, `gate.leave`, dispatch, play. No other end (longPress, sheet or scrim tap, pointercancel, lostCapture, `cancel`, byBack) leaves a capture pending (`flip.capture` throws if one is).

A tile or free letter released with an edit glides by `snap` from its released point (top-left): the dragged face's viewport rect at the last move before release; the parted tiles and shifted tray faces glide from their parted offsets (CAP-8 previous rects). A release with no edit is the existing `flight.flyBack` (F17): no dispatch, no flip capture/play, regression coverage only (CAP-5/CAP-6 own it). Entry 10 already finishes glides in `pointerdown` and `cancel()` (`finishGlides`/`glidesRunning`, F6); new here are glides from a controller dispatch and the press-path P5 (a press during one acts on the settled state).

- interface: no new module exports; `ControllerDeps` gains `capture` and `play`, wired in `main.ts` like `finishGlides`/`glidesRunning`, so the Vitest order test uses fakes.
- tests: AD-14 FLIP kinds for controller-driven moves, release glides from the released point, flyBack on no edit (S + P5); AD-14 input during an animation completes it and acts on the settled state (P5; the S half is entry 10's).
- owns: the controller's release FLIP wiring (capture/play) and the press-path P5.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines unchanged), with the UI Vitest AD-14 order test (capture after the selection clear, before `parting.finishAll()` and `clearDrag`, then `gate.leave`, dispatch, play, in one pointerup, including a tap site: `perform` drop with a selection) and a test that every `game.dispatch` site in `controller.ts` is capture-before, play-after; an invariant case that capture count equals play count for every EndReason variant (up with and without a dispatching outcome, pointercancel, lostCapture, sameId, cancel with and without byBack); and a case covering tapDestinationCard and setTarget (setTarget: capture/play with an empty animated set, no running animation). Playwright on android with prefs-non-default (Slow) shows running getAnimations() with positive remaining time on the moving faces (none on wrappers or mirrors) read in a page.evaluate right after the touch end for a tap drop and a tail drag drop (snap), tap-add, removal, tap-swap, and a tile and a free letter released with an edit; there (non-reduced motion) the first keyframe is at the released point, asserted from `getKeyframes()[0]` read in the same evaluate: settled rect plus translate equals the released rect within 1 px, including a tail drop (first and last faces), and one parted face's first keyframe is at its parted offset, not transform none. Under reduced motion an edit release plays entry 10's reduced form, with no first-keyframe assertion. A release with no edit shows flyBack (regression). Press-path P5: a release with an edit starts a glide, then a press on a card or tile mid-glide; getAnimations() is empty after the press, the gate is idle, and the press acts on the post-edit view.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-8 (Capture before the view changes, Landing glides)

## Notes

- Open question: Whether WAAPI on faces composes with the controller's drag transforms at release without a visible jump. Resolved when the face rect in the last pre-`clearDrag` frame and in the first animated frame differ by under 1 px (Playwright); if it fails, stop and report a spine/spec issue, no silent workaround.
