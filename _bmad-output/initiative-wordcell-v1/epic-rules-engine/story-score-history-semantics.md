---
id: 9
type: story
title: "Score history semantics"
parent: epic-rules-engine
covers: [CAP-8]
after: [8]
risk: medium
---

# Score history semantics

## Description

Adds src/engine/history.ts: gameRecord (reusing entry 8's longest-word function), reconcileHistory, isRecorded and the six v1 statistics per AD-6, R-76's record part and R-84, including the empty-history, mismatch and A-E3 rounding cases; won cases use entry 6's helper.

## Acceptance Criteria

Verify: npm run test:all is green with the R-84, R-74 and R-76 record tests passing: append on finish, remove only on a seed/outcome/activeMs match, isRecorded true and false cases, and statistics with −7.5 → −7.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md

## Notes

- Open question: None.
