---
id: 5
type: story
title: "Validate and Place commands with the §8 worked example"
parent: epic-rules-engine
covers: [CAP-4]
after: [4]
risk: medium
---

# Validate and Place commands with the §8 worked example

## Description

Adds validate (structural R-36, then ctx.dictionary membership, rejectedWord as the R-37 lowercase string), setTarget, setPlacementOrder and confirm with R-40–R-42, R-50–R-52 and the R-60 commit through apply, their command-table rows, and the §8 worked example (BAKED, BALKED, FAKED, FLAKED; DEKA… impossible) on a hand-built start through the D2 seam.

## Acceptance Criteria

Verify: npm run test:all is green with the new table rows, the R-36–R-38, R-40–R-42 and R-50–R-52 tests (including a QU word whose legal targets reach cell 5) and the §8 test passing, and validate without ctx.dictionary throws its check code.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- rules — docs/game-flow-spec.md, §8 worked example

## Notes

- Open question: None beyond entry 4's table shape.
