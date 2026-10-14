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

Wires entry 10's flip.ts into the pointer controller: every controller dispatch (drop, tapDestinationCard, tile tap-swap and removal, tap-add, setTarget, tile and free-letter releases) calls `flip.capture()` before and `flip.play(command, result)` after `game.dispatch`, on a drag release before `clearDrag` removes the drag and parting transforms (F7, build-notes CAP-8: `controller.ts` end() clears before the drop dispatch today), so a tile or free letter released with an edit glides from its released position by `snap` and one released with no edit returns by `flyBack` (F17); entry 10 already finishes glides in the controller's `pointerdown` and `cancel()` (`finishGlides`/`glidesRunning`, F6), and this entry's press-path P5 shows a press during a glide acting on the settled state.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-14 capture-before-clearDrag order, and Playwright on android with prefs-non-default (Slow) shows running getAnimations() on the moving faces (none on wrappers or mirrors) read in a page.evaluate right after the touch end for a drop (snap), tap-add, removal, tap-swap, a tile and a free letter released with an edit (first keyframe at the released point) and with no edit (flyBack), and a press during a glide acting on the settled layout.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-8 (Capture before the view changes, Landing glides)

## Notes

- Open question: Whether WAAPI on faces composes with the controller's drag transforms at release without a visible jump.
