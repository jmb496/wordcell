---
id: 12
type: story
title: "Winning guard: the end-sheet half"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-5]
after: [6, 10]
risk: high
---

# Winning guard: the end-sheet half

## Description

Finishes the AD-14 guard: the pending end-sheet open is cancelled by Undo (button, `Z` and Ctrl/Cmd+Z), so the animation completes, it undoes, and the sheet does not open; the guard recognises the Undo key aliases (keydown/keyup and repeats, only while Undo is enabled) beside the target match, Ctrl/Cmd+Shift+Z (Redo) is consumed like any other input; every other input in the window completes the animation and is consumed, then the sheet opens (outcome table in build-notes.md); the deferred open waits for whatever animations are in flight and fires at max(animation settled, 300 ms after the guard is installed), so Undo cancels the open and every other input is consumed for the whole guard window at every speed (EXPERIENCE.md Motion, epic 5 F8, F23); a Redo win behaves like a Confirm win; the menu button case. `inUndo` is already typeof-free.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with Playwright on android and desktop at Normal, Fast, Slow and under reduced motion proving Undo by button and by key during the window leaves play resumed with no sheet, a WordCell tap, the primary action and a menu press each only completing the animation before the sheet opens, and a Redo win followed at once by Undo, Undo between settle and 300 ms (cancels the open, undoes, no sheet) and Fast speed and reduced motion, where the animation settles before 300 ms.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-5), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
