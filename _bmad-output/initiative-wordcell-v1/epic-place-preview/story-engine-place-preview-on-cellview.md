---
id: 1
type: story
title: "Engine place preview on CellView"
parent: epic-place-preview
covers: [E1]
after: [epic-end-of-game-words]
risk: low
---

# Engine place preview on CellView

## Description

Adds `preview?: { readonly top: CardId | null; readonly count: number }` (an inline type, no new export from `src/engine/index.ts`, AD-2) to `CellView` in `src/engine/view.ts`, present exactly when phase = place and the cell is used or the target, computed from the R-60 commit of the current draft (reusing the engine's commit path, never a second copy of its rule) so `top` and `count` equal that cell after Confirm.

## Acceptance Criteria

Verify: Engine unit tests named Q-49 AD-3 pass for a target that is not used, a used target (R-41), a used non-target cell with cards beneath and with one card (`top` null), two used cells, a target change and a reorder, absence in Idle, Composing and Game over and on unchanged cells, and the property that every cell's `preview` equals that cell in `view()` after `confirm` on each Place fixture; `src/architecture-ad2-ad12-ad17.test.ts`, `src/engine/index.test.ts` and `npm run test:all` stay green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- architecture — ARCHITECTURE-SPINE.md AD-2, AD-3
- rules — docs/game-flow-spec.md R-41, R-60, R-61, Q-49
- code — src/engine/view.ts, src/engine/commands.ts, src/engine/view.test.ts, fixtures/session-place*.json
