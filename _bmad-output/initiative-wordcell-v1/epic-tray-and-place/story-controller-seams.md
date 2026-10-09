---
id: 4
type: story
title: "Controller seams"
parent: epic-tray-and-place
covers: [CAP-3]
after: [3]
risk: medium
---

# Controller seams

## Description

Behaviour-neutral split of src/ui/gestures/controller.ts along its seams before tile gestures land (retrospective A6, F14): the controller keeps the press machine; the visible band and clip move to gestures/visible-band.ts, the desktop hover-peek timer and suppress logic to gestures/hover-peek-timer.ts (src/ui/hover-peek.ts stays the render helpers; the cell-keyed timer and half-open suppress rects and their AD-12 Vitests kept, S17) and the fly-back to gestures/fly-back.ts, each behind the existing `deps` pattern; one gestures/lookup.ts helper taking the caller's message replaces every cell/column lookup with its own throw (controller.ts, intent.ts, HoverPeek.svelte, WordCellView.svelte and entry 1's tray tag lookup) with every throw string unchanged; one gestures/classes.ts exports the class names controller.ts, Column.svelte and HoverPeek.svelte share; and the per-ticket "Entry N" header paragraphs in controller.ts and the other src/ui files become one behaviour summary per module; controller.test.ts stays one file, its harness moved only (F41).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with no screenshot baseline change, every existing test passing with at most import and harness-path edits, and the plan recording the Linux-filesystem warm unit-suite median before and after the split.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, As-built facts that bite (controller.ts line map, controller.test.ts), CAP-3, Sweep inventory S17

## Notes

- Open question: Whether moving the hover-peek and fly-back code behind deps multiplies vi.resetModules() setups in controller.test.ts and slows the unit suite; the before/after median decides.
