---
id: 13
type: story
title: "Statistics exclude negative given-up scores"
parent: epic-rules-engine
covers: [CAP-8]
after: [12]
risk: low
---

# Statistics exclude negative given-up scores

## Description

Applies owner decision D-STATS (R-84, Q-44; SPEC D4): statistics computes best score and average score over won records and gaveUp records with finalScore >= 0 only; excluded negative gaveUp records still count in gamesPlayed, gamesGivenUp and longestWord; when no record qualifies, bestScore and averageScore are absent. Updates the statistics doc comment that cites Q-28.

## Acceptance Criteria

Verify: npm run test:all is green with R-84 tests: a negative gaveUp record excluded from best and average but counted in played, given up and longest word; a 0-score gaveUp record counted in best and average; a history of only negative gaveUp records giving bestScore and averageScore absent; the existing statistics tests updated where they assumed negative gaveUp records count.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-8 History
- rules — docs/game-flow-spec.md R-84, §9 Q-44

## Notes

- Open question: None.
