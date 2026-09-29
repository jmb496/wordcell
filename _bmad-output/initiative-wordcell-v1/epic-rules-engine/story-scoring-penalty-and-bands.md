---
id: 7
type: story
title: "Scoring, penalty and bands"
parent: epic-rules-engine
covers: [CAP-6]
after: [2]
risk: low
---

# Scoring, penalty and bands

## Description

Adds src/engine/scoring.ts: liveScore over WordCells, lettersLeft and the R-81 penalty (PENALTY_PER_LETTER × lettersLeft), the unclamped final score, and band as the 0–5 index relative to LangData's derived max (D3), with a synthetic LangData from the entry-2 constructor proving the thresholds are relative.

## Acceptance Criteria

Verify: npm run test:all is green with R-80 (including a word containing QU scored by letter count), R-81 (a QU left counts 2, negative finals kept) and R-83 boundary tests 158/159, 264/265, 377/378, 468/469, 529/530 and a negative score in band 0 passing, plus the synthetic LangData (Σ letterCount 54, derived max 540) band test.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md

## Notes

- Open question: None.
