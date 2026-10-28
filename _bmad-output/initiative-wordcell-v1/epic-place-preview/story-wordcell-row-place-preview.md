---
id: 2
type: story
title: "WordCell row place preview"
parent: epic-place-preview
covers: [E2, E3, E4, E5]
after: [1]
risk: medium
---

# WordCell row place preview

## Description

Renders `cell.preview` in Place in `WordCellRow.svelte`: no used mirror; a used non-target cell shows its live card beneath (or the empty outline); the target hides its current top and shows a new `preview` mirror kind in `Card.svelte` (`data-mirror-of`, no card id, no FLIP) of the strip's last card; the `★` pill at the card rect's bottom-left on a non-empty preview, as the one shared source entry 4's scene card reuses; the count badge from `preview.count`; the two `, after this word` names in `src/ui/text.ts`; Composing, the R-65 view and the not-legal dim unchanged; adds `fixtures/session-place-<reason>.json` (seeded through `e2e/helpers/seed.ts`; a used single-card cell and a used cell with a card beneath, neither the target); keeps `e2e/fly-to-cell.spec.ts` green: its Place start checks move to the preview and the `flip.ts` capture skips the `preview` mirror; the hold itself is entry 3's.

## Acceptance Criteria

Verify: Playwright on `android` (named R-50 (UI), R-33 (UI) and Q-49) shows the target preview and badge following a reorder and a retarget, a used target, a used non-target cell with a card beneath and one left empty, no used card drawn in Place, Undo to Composing restoring the used look, Redo and a reload into Place showing the preview, and the WordCell view listing the current cards; the `★` on a non-empty preview and none on an empty one, and the 35 % dim on a changed cell that is not legal; the two `, after this word` names pass in `src/ui/labels.test.ts` (AD-3) and `e2e/screen-reader.spec.ts` (A-E9); the existing specs that pinned the used mirror in Place (e.g. `e2e/board-phases.spec.ts` R-33 (UI)) are updated, not deleted; `npm run test:all` and `npm run test:screens` (updated Place baselines in every theme spec) are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- design — DESIGN.md Components → WordCell (*place preview*); EXPERIENCE.md Place state row, Place, Message catalogue (screen-reader names)
- architecture — ARCHITECTURE-SPINE.md AD-3, AD-14
- code — src/ui/WordCellRow.svelte, src/ui/Card.svelte, src/ui/text.ts, src/ui/app.css, e2e/board-phases.spec.ts, e2e/free-letter.spec.ts, e2e/fly-to-cell.spec.ts, e2e/place.spec.ts, e2e/screen-reader.spec.ts, src/ui/labels.test.ts, e2e/*.screens.spec.ts, fixtures/
