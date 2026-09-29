---
id: 3
type: story
title: "Session, createSession, replay and checkSession"
parent: epic-rules-engine
covers: [CAP-3]
after: [2]
risk: medium
---

# Session, createSession, replay and checkSession

## Description

Adds the §2 Session types, createSession (R-74 engine part: throws on a non-uint32 seed, holds the seed given), the internal CardId deal (the golden test's CardId half repointed to it), the D2 seam's Start type with its validation throws and replayFrom (entry 4 adds applyFrom, entry 8 the view counterpart), replay taking no dictionary with per-reached validation in the build-notes order, checkSession for the AD-7 checks, R-60 commit, R-61 exposure and status derivation (R-62), so a Session breaking any §2 invariant or rule at its reached throws while a Composing-reached 2-letter draft replays; its R-62 won test builds the position through the seam or hand-built committed moves [ASSUMPTION], public won cases waiting for entry 6's helper.

## Acceptance Criteria

Verify: npm run test:all is green with R-04, R-74, R-60–R-62 and §2 replay tests passing (a committed word absent from any set still replays), including one rejecting case per violable check asserting its unique code, the accepting cases for permit-only rules, and deep-frozen inputs.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-3 Session and replay

## Notes

- Open question: How much of the per-move rule checking can be shared with the command reducers of entries 4 and 5 without the seam leaking into index.ts.
