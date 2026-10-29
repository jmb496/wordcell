---
id: 3
type: story
title: "Fly-to-cell keeps the previewed top"
parent: epic-place-preview
covers: [E6]
after: [2]
risk: medium
---

# Fly-to-cell keeps the previewed top

## Description

Changes the F28 hold in `src/ui/flip.ts` (`inFlight`) and `WordCellRow.svelte` so that from Confirm, or a Redo that commits, until the last landing the target shows the previewed top (no `★`) and never its previous top or the used card, used non-target cells show their card beneath with no flash of the used card, and reduced motion keeps its unstaggered fade.

## Acceptance Criteria

Verify: The `e2e/fly-to-cell.spec.ts` F28 tests are rewritten for the new hold (named AD-14 F28 Q-49) on `session-place-free-letter-redo-tail` and a target that is not used: frame samples during the flight never show the previous top or a used mirror, 52 live cards after landing, Redo and reduced motion included; the `src/ui/flip.test.ts` AD-14 test of the target cell's used mirror (R-52) is rewritten for the preview; `npm run test:all` and `npm run test:screens` (no baseline change expected) are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- design — DESIGN.md Components → WordCell (*place preview*, fly-to-cell)
- architecture — ARCHITECTURE-SPINE.md AD-14
- code — src/ui/flip.ts, src/ui/flip.test.ts, src/ui/WordCellRow.svelte, e2e/fly-to-cell.spec.ts
