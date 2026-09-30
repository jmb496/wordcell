---
id: 12
type: story
title: "Refactor sweep"
parent: epic-rules-engine
covers: [CAP-1, CAP-2, CAP-3, CAP-4, CAP-5, CAP-6, CAP-7, CAP-8, CAP-9]
after: [11]
risk: low
---

# Refactor sweep

## Description

Cleanup only across src/engine/, scoped when it starts from the epic's build records and the review findings deferred during entries 1–11; scope pushed out of another story is a new story.

## Acceptance Criteria

Verify: npm run test:all is green, the R-02 golden deal literals are unchanged, and every change maps to a deferred finding named in the plan.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md

## Notes

- Open question: Scope is unknown until the earlier builds finish.
