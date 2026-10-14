---
id: 11
type: story
title: "Fly-to-cell on commit"
parent: epic-tray-and-place
covers: [CAP-8]
after: [16]
risk: medium
---

# Fly-to-cell on commit

## Description

Plays `flyToCell` for a Confirm and a committing Redo (F7): 2 × base, 30 ms `stagger()` bottom card first, each committed card visible in flight (today non-top cell cards are `visibility: hidden`, WordCellRow.svelte:59) and taking the hidden state on landing if not the top, the target cell's previous cards keeping their pre-commit visibility (and the free letter's own-cell used-state mirror staying drawn when that cell is the target) until the first flying card lands or the animation is finished; under reduced motion every card fades in at once over 120 ms with no stagger and the switch happens at the fade's end; Undo pressed mid-flight finishes it and acts on the settled layout.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-14 reduced-motion fly-to-cell (120 ms opacity fade, no stagger) and stagger order, and Playwright on android with prefs-non-default (Slow) shows Confirm on session-place running getAnimations() on each committed face with every flying card not visibility: hidden during its flight and exactly 52 data-card-id elements in the same evaluate, the target's previous top still shown until the first card lands, Confirm into the free letter's own cell on session-place-free-letter-redo-tail keeping its used mirror until then, Undo mid-fly-to-cell acting on the settled layout, a Redo of a commit flying the same way, and one Confirm under emulated reduced motion fading with no stagger.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-8 (Fly-to-cell)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (WordCell)

## Notes

- Open question: Whether holding the previous cards' visibility until the first landing needs a flip.ts landing callback or can key off the first animation's finished promise.
