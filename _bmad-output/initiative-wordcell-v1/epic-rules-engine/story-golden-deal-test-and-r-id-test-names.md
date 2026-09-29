---
id: 1
type: story
title: "Golden deal test and R-id test names"
parent: epic-rules-engine
covers: [CAP-1]
after: [1.10]
risk: low
---

# Golden deal test and R-id test names

## Description

Test-only first code commit of the epic: adds it('R-02 golden deal …') to src/engine/deal.test.ts pinning, as literal arrays generated once from HEAD's deal.ts, the CardId columns for seeds 1 and 4294967295 and the 52-entry buildDeck() letter sequence, and renames the four scaffold deal tests with R-01/R-02/R-03 ids; no src/engine source changes.

## Acceptance Criteria

Verify: npm run test:all is green, git diff for the commit touches only src/engine/deal.test.ts, and temporarily swapping two entries of ENGLISH_DISTRIBUTION or changing the PRNG constant turns the R-02 golden deal test red.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md

## Notes

- Open question: None expected; deal.ts and types.ts are byte-identical to 785c0f6 (verified 2026-09-28).
