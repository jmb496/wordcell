---
id: 11
type: story
title: "History serialise and parse, and the epic's scripted game"
parent: epic-rules-engine
covers: [CAP-9]
after: [10]
risk: medium
---

# History serialise and parse, and the epic's scripted game

## Description

Adds serializeHistory, parseHistory with its stage order, container and checkRecord checks, the history round trip built from gameRecord outputs, one history-invalid-<check>.json per record check, and the SPEC Success signal test: a scripted seed-1 game round-tripped to an equal view after every step, undo to the start and redo to the end; won records use entry 6's helper.

## Acceptance Criteria

Verify: npm run test:all is green with the history round trip, every history fixture asserting its reason and checkRecord code, the scripted-game test, and an AD-2 test that index.ts's runtime export names equal AD-2's list plus deal passing.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md

## Notes

- Open question: None.
