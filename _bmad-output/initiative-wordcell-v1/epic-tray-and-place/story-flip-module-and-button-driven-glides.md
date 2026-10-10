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

Adds src/ui/flip.ts (F6): a `createFlip(deps)` factory (the gate, the DOM root, the reduced-motion flag and `duration()` from motion.ts) installed once from main.ts through a setter as act.ts's `setController` (`capture()`, `play()` or `finishAll()` before the install, or a second install, throws). `capture()` calls `finishAll()`, then `flushSync()` (so a selection act() or TopBar cleared just before is rendered and no lift is recorded), then records, keyed by `data-card-id` (AD-14 FLIP identity is the CardId; after a band change the live element is a new node), each live element's `.face` viewport rect and its band's rect: a card's band comes from its live element's `data-place` (`column` → columns band, `tray`/`strip` → tray band, `cell` → WordCell band), the band rect is that band's `[data-band]` element. `play(command, result)` consumes the pending capture (`play` without one throws, rule 6), calls `flushSync()` before measuring and starts every animation synchronously, so the animations exist when the click handler returns; it animates the faces after the move's update from previous to next rect, wrappers never transformed (a press mid-animation hit-tests the settled layout), every live card whose band-relative position changed animating (a change under 0.5 px on both axes is unchanged, as the controller's `near()`; container or index, Flip, a k change with the block left, card ↔ compact tile by translate only), none on a pure band shift, a card changing band inverting from its captured viewport rect, mirrors never in the glide, durations only from motion.ts, under reduced motion every animated face fading opacity 0 → 1 at its settled rect over 120 ms with no translate (as fly-back.ts), each animation gate-counted. New game, Replay and restore never animate by construction: they go through the store, never capture/play, and act()'s `cancel()` finishes any running glide first. This ticket adds `flip.finishAll()` to the controller's `cancel()` beside `finishFlight()`, so act(), the hide flush and back settle any glide (F6); entry 16 adds the `pointerdown` wiring and the press-path tests.

The kind is a pure exported function of (command, DispatchResult, the resulting `game.view` phase read after the flush), never from comparing views or a phase rule decided before dispatch (F7, AD-3). By command type: `undo`/`redo` → `undoRedo`, except a `redo` whose resulting phase is `idle` is a commit → `flyToCell`; `confirm` → `flyToCell`; `setTarget` and `giveUp` → empty animated set (`giveUp` has no caller until epic 6); every other command (drop, tapDestinationCard, setDestinationCount, flip, arrange, addFreeLetter, removeFreeLetter, validate, setPlacementOrder) → `snap` (F17; a release with an edit glides from its released point). A no-edit release dispatches nothing and never reaches `play`: it keeps the existing fly-back.ts `flyBack` (CAP-5, CAP-6). For `flyToCell` `play` starts no animation and takes no gate count (the cards land at once, as today); entry 11 fills it in. A pure exported planner (captured and next face rects keyed by CardId, band rects before and after, the anchor delta, kind and reduced-motion flag → per-face keyframes) carries the frame rules, so the Vitest (`environment: 'node'`, no DOM or WAAPI) drives it and the kind function with controller.test.ts-style fakes. The act()-wrapped callers (ActionBar, TopBar, ControlRow) call capture before and play after `game.dispatch` (Validate's existing `flushSync()` stays, F15/F21; entry 16 wires the controller's callers); on Validate and on Undo to Composing the D faces glide from and to the column while their block copies appear or vanish at once (F22).

- Interface: New src/ui/flip.ts (`createFlip(deps)` and its install setter, `capture()`, `play(command, result)`, `finishAll()`, the pure kind function and planner); ActionBar, TopBar and ControlRow wrap dispatch in capture/play; the controller's `cancel()` calls `flip.finishAll()` beside `finishFlight()`.
- Tests: R-70 Undo Place → Composing keeps the arrangement and Composing → Idle returns the cards, animated (P5 supp.); AD-14 F22 D faces from and to the column (P5); AD-14 one live element during a Validate glide, faces animate, wrappers and mirrors never (P5); AD-14 FLIP kinds, band-relative set, no motion on a pure band shift, reduced-motion fade (S + P5); AD-14 finish-all path (S).
- Owns: flip.ts, the kind table and the animated set; every later dispatching caller uses capture/play.
- Consumers: The gate's busy sources gain FLIP animations: list layout re-layout, the banner latch, w recompute and the controller's gate enter/leave; ActionBar/TopBar/ControlRow handlers change inside act(): list the AD-12 act() scan; the controller's `cancel()` gains `finishAll()`: list act(), the before-hide flush and before-back.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with:

- UI Vitest AD-14 kind table over (command, DispatchResult, resulting phase): drop, tapDestinationCard, setDestinationCount, flip, arrange, addFreeLetter, removeFreeLetter, validate, setPlacementOrder, setTarget, giveUp, confirm (`flyToCell`, no animation started, no gate count), undo, a committing redo (`flyToCell`) and a non-committing redo (`undoRedo`); reduced-motion snap (flip) and undoRedo fades; a selected tile, Flip pressed, an unmoved tile gets no animation.
- UI Vitest coordinate frame on the pure planner over synthetic inputs: + 14 → 15 with the block left and a band change at 412 × 780 (anchor delta 6 px adding no distance); no keyframes on a pure band shift; a same-band card inverting from the band-relative delta; a band-changing card inverting from its captured viewport rect; a dropped face whose first keyframe starts at its released rect. The live band-shift P5 lands with entry 12.
- UI Vitest the finish-all path: no FLIP animation running or gate-counted when `capture()` returns, including a second Undo pressed during the first glide, and the controller's `cancel()` finishing a running glide (scroll-busy at dispatch is entry 12's `scrollReset`, not this check).
- Playwright on android from `session-composing` with `prefs-non-default` (Slow) seeded through `seedStorage` shows running getAnimations() on the moving faces, none on wrappers or mirrors, read in the page.evaluate that clicks the button, with the tray and strip contents after each step, in one chain: Validate (52 data-card-id during the glide, D faces gliding from the column while the block copies vanish at once) → Undo from Place to Composing (D faces gliding back to the column, the block copies reappearing at once) → Undo from Composing to Idle → Redo from Idle to Composing; and on a separate load Flip → `+` (a k change with the block left; an edit discards the redo tail, R-71).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-8
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Motion
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-10, AD-14

## Notes

- Open question: Whether a capture before dispatch gives the previous rects without a second render (SPEC Assumptions). Whether WAAPI on faces composes with the controller's drag transforms at release without a jump is answered in entry 16, which wires the controller; this ticket covers only the pure first-keyframe Vitest.
