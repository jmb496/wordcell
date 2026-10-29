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

Adds `preview?: { readonly top: CardId | null; readonly count: number }` (an inline type, no new export from `src/engine/index.ts`, AD-2) to `CellView` in `src/engine/view.ts`, present exactly when phase = place and the cell is used or the target, otherwise omitted (the key absent, as `kIfTapped`, AD-3). `viewFrom` computes it from one `commitMove(position, placed(draft))` call (`src/engine/rules.ts`, R-60) on the committed-prefix position it already has, never a second copy of the commit rule nor a re-entrant `apply`/`view`: `top` is the cell's last card after the commit (`null` = empty) and `count` its card count after the commit (the length of its cards, not the R-85 letter count). `used`, the other `CellView` fields and every other `GameView` field are unchanged.

## Acceptance Criteria

Verify: Engine unit tests in `src/engine/view.test.ts`, each name starting `Q-49 AD-3`, pass for:

- a target that is not used; a used target (named also R-41) with cards beneath its used card, and one whose only card is the used one (`count` = placement order length), each also asserting `used` true and `cards` its current pre-commit list (Q-49, R-65);
- a used non-target cell with cards beneath and with one card (`top` null); two used cells, neither the target;
- the only-card cases above (no fixture has one) built from a start position through the D2 seam (`startOf`) or a `play` chain with an inline dictionary;
- -compact (QU, card 35, in the placement order) as the case telling `count` (cards) from the R-85 letter count;
- `setTarget` from an unused old target (it loses `preview`) and from a used one (it gets its used-cell preview: the card beneath, or `top` null when the used card was its only card), e.g. on -free-letter-two-cards; the new target's `top` is the last card of `placementOrder`; and a reversed `setPlacementOrder`;
- absence (`Object.hasOwn(cell, 'preview')` false) on unchanged cells in Place, in plain Idle, in plain Composing with a free letter (view.test.ts `FREE`) and in Composing reached by `undo` from Place (`COMPOSING_FROM_PLACE`), both asserting the used cell has no `preview`, in Idle with a pending draft whose `reached` is place or committed, and with status won and with `gaveUp`; the Composing cases catch an implementation keyed on the stored target or missing the phase check;
- the property, on fixtures/session-place.json, -compact, -long, -onto-committed, -free-letter-two-cards and -free-letter-redo-tail as stored, and with a `setTarget` to each other legal target and a reversed `setPlacementOrder` each applied separately to the stored fixture: for every cell, `preview` is present iff that cell's `cards` differ in `view()` after `confirm`, and when present `top` = that cell's last card after `confirm` (`?? null`) and `count` = its length.

`src/architecture-ad2-ad12-ad17.test.ts`, `src/engine/index.test.ts` and `npm run test:all` stay green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- architecture — ARCHITECTURE-SPINE.md AD-2, AD-3
- rules — docs/game-flow-spec.md R-41, R-50, R-52, R-60, R-61, Q-49
- code — src/engine/view.ts, src/engine/rules.ts, src/engine/commands.ts, src/engine/replay.ts, src/engine/test-helpers.ts, src/engine/view.test.ts, fixtures/session-place*.json
