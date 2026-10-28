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

Renders `cell.preview` in Place in `WordCellRow.svelte`: no used mirror; a used non-target cell shows its live card beneath (or the empty outline); the target hides its current top and shows a new `preview` mirror kind in `Card.svelte` (`data-mirror-of`, no card id, no FLIP) of `cell.preview.top` (the strip's last card); a changed cell draws the empty outline when `preview.top` is null and the count badge when `preview.count >= 2` (DESIGN.md WordCell); nothing about a changed cell is drawn from `place.placementOrder` or `cell.cards`; the `★` pill is a `Card.svelte` prop (e.g. `previewMark`) drawn inside the card rect at bottom-left, set by WordCellRow on the shown top of a non-empty preview (the live card beneath or the `preview` mirror) and by entry 4 on a `static` card, under the cell's 35 % dim; the plan checks the pill and a two-digit badge do not overlap on `session-place-long` at the narrowest `android` viewport; in Place a changed cell exposes no named card button (the card beneath stays silent, the `preview` mirror is unnamed, the hidden current top is not exposed) and its group's `, after this word` name (the two in `src/ui/text.ts`) carries it; Composing, the R-65 view and the not-legal dim unchanged; adds `fixtures/session-place-used-cells.json` (seeded through `e2e/helpers/seed.ts`; a used single-card cell and a used cell with a card beneath, neither the target, and at least one used non-target cell numbered above the word's letter count, not legal by R-40), registered in the AD-17 valid-fixture list (`src/architecture-ad2-ad12-ad17.test.ts`), `src/engine/serialize.test.ts` `VALID`, `PROPERTIES` (its defining property) and `REBUILDS` (a scripted rebuild), and ticket 11.1's Q-49 property loop in `src/engine/view.test.ts`; keeps `e2e/fly-to-cell.spec.ts` green: its Place start checks move to the preview, and the `flip.ts` capture skips the `preview` mirror, so until entry 3 a used target's in-flight hold draws no used mirror (the existing hold shows the card beneath, WordCellRow's current `lowest − 1` rule); this ticket updates the F28 in-flight checks of the held `m28` used mirror (reduced motion included), the Undo-back-to-Place `[data-wordcell] [data-mirror-of]` count (excluding `preview` mirrors) and the `src/ui/flip.test.ts` fake capture selector to that interim, and entry 3 rewrites them for the final hold (the interim lives only on the epic branch).

This ticket has a plan checkpoint: an unattended build stops after planning for a person to approve the plan before implementing.

## Acceptance Criteria

Verify: Playwright on `android` (named R-50 (UI), R-33 (UI) and Q-49) shows the target preview and badge following a reorder and a retarget, a used target (on `session-place-compact` a retarget onto used cell 4 draws a `preview` mirror of `preview.top` and no live used card, and away again its live card beneath with badge and `★`), a used non-target cell with a card beneath and one left empty, no used card drawn in Place, Undo to Composing restoring the used look, Redo, Undo of a commit (Idle → Place, R-70) and a reload into Place showing the preview, and the WordCell view listing the current cards (a long-press on an empty target drawn with a preview opens no view; one on the used single-card cell drawn empty lists its one current card); the `★` on a non-empty preview and none on an empty one, and the 35 % dim on a changed cell that is not legal (both may run on `session-place-used-cells`); AD-14: in Place 52 `[data-card-id]` elements, one per id, the target's preview element carries `data-mirror-of` = `preview.top` and no `data-card-id`/`data-testid`, no WordCell child is a used card, and the preview face takes no FLIP glide across a reorder and a retarget; the two `, after this word` names and zero named card buttons in a changed cell (one in an unchanged non-empty cell) pass in `src/ui/labels.test.ts` (AD-3) and `e2e/screen-reader.spec.ts` (new tests named `A-E9 Q-49 …`); `A-E9 a used WordCell reads its name with used` moves to Composing (same fixture, one Undo) and keeps its `, used` expectation; the existing specs that pinned the used mirror in Place (e.g. `e2e/board-phases.spec.ts` R-33 (UI)) are updated, not deleted; `npm run test:all` and `npm run test:screens` (updated Place baselines in `board.screens.spec.ts` (`place`, `place-compact`) and every `theme-*.screens.spec.ts`; no other baseline changes) are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- design — DESIGN.md Components → WordCell (*place preview*); EXPERIENCE.md Place state row, Place, Message catalogue (screen-reader names)
- architecture — ARCHITECTURE-SPINE.md AD-3, AD-14
- rules — docs/game-flow-spec.md Q-49, R-33, R-40, R-41, R-50, R-65, R-70, R-71, R-73
- code — src/ui/WordCellRow.svelte, src/ui/Card.svelte, src/ui/text.ts, src/ui/app.css, src/ui/flip.ts, src/ui/flip.test.ts, e2e/board-phases.spec.ts, e2e/free-letter.spec.ts, e2e/fly-to-cell.spec.ts, e2e/flip.spec.ts, e2e/place.spec.ts, e2e/wordcell-view.spec.ts, e2e/screen-reader.spec.ts, src/ui/labels.test.ts, src/engine/serialize.test.ts, src/engine/view.test.ts, src/architecture-ad2-ad12-ad17.test.ts, e2e/*.screens.spec.ts, fixtures/
