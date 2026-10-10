---
id: 10
type: story
title: "FLIP module and button-driven glides"
parent: epic-tray-and-place
covers: [CAP-8]
after: [9]
risk: high
---

# FLIP module and button-driven glides

## Description

Adds src/ui/flip.ts (F6): `capture()` records the rects of the `.face` inside each live element before a dispatch and `play(command, result)` animates the faces after the move's update from previous to next rect, wrappers never transformed (a press mid-animation hit-tests the settled layout), every live card whose band-relative position changed animating (container or index, Flip, a k change with the block left, card ↔ compact tile by translate only), none on a pure band shift, a card changing band inverting from its captured viewport rect, mirrors never in the glide, durations only from motion.ts with the 120 ms reduced-motion fade, each animation gate-counted, New game, Replay and restore never animating; the kind from the command and its DispatchResult (F7): drop → `snap`, Undo/Redo → `undoRedo`, `setTarget` → empty set, the F17 moves (Validate, Flip, k change, tap-add, removal, tap-swap, a release with an edit gliding from its released point) → `snap`, a no-edit release → `flyBack`; the act()-wrapped callers (ActionBar, TopBar, ControlRow) call capture before and play after `game.dispatch` (entry 16 wires the controller's callers); on Validate and on Undo to Composing the D faces glide from and to the column while their block copies appear or vanish at once (F22); `confirm` and a committing Redo map to `flyToCell` with play left to entry 11.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-14 command + result → kind table (drop, tapDestinationCard, setDestinationCount, flip, arrange, addFreeLetter, removeFreeLetter, validate, setPlacementOrder, setTarget, confirm, undo, redo), reduced-motion snap (flip) and undoRedo fades, the coordinate frame (+ 14 → 15 with the block left; a band change at 412 × 780) the gate idle at every dispatch, and a dropped face whose first keyframe starts at its released position (pure play input), and Playwright on android with prefs-non-default (Slow) shows running getAnimations() on the moving faces, none on wrappers or mirrors, read in the page.evaluate that clicks the button, for Validate (52 data-card-id during the glide, D faces gliding from the column while the block copies vanish at once), Flip, a k change with the block left (after Flip), and Undo from Place to Composing (D faces gliding back to the column, the block copies reappearing at once) and from Composing to Idle with the tray and strip contents after each step.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-8
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Motion
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-10, AD-14

## Notes

- Open question: Whether a capture before dispatch gives the previous rects without a second render (SPEC Assumptions) and whether WAAPI on faces composes with the controller's drag transforms at release without a jump.
