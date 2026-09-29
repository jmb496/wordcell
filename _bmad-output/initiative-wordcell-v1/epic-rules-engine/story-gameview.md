---
id: 8
type: story
title: "GameView"
parent: epic-rules-engine
covers: [CAP-7]
after: [6, 7]
risk: medium
---

# GameView

## Description

Adds view(session, lang) building every AD-3 field from one replay: faces, columns, WordCells, per-column and per-cell flags from the guards apply uses, kIfTapped, draft and Place data with the D6 score delta, live and display score, end values, word count and the internal longest-word function (reused by entry 9), pending-draft word and inProgress, the view counterpart of the D2 seam, and the R-12, R-31 and R-33 flag and kIfTapped tests entry 4 leaves (canPickUp, canIncK/canDecK at bounds, canAddFreeLetter on used or empty cells, S cards of a self-drop absent).

## Acceptance Criteria

Verify: npm run test:all is green with one test per AD-3 field (named with its R-id, else AD-3), every can* flag agreeing with its mapped command in the build-notes table in both directions, and the D6 delta equal to the live-score change of the commit, QU free letter included.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-7 GameView

## Notes

- Open question: Whether computing every flag through apply's shared guards keeps view within the unit-suite time budget.
