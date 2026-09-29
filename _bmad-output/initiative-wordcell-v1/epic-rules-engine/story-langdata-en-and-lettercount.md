---
id: 2
type: story
title: "LangData, EN and letterCount"
parent: epic-rules-engine
covers: [CAP-2]
after: [1]
risk: medium
---

# LangData, EN and letterCount

## Description

Adds src/engine/errors.ts EngineError carrying a unique check code (owned here, used by every later entry) and src/engine/lang/en.ts with EN built by one internal LangData constructor (distribution summing to 52, letter values, uppercase letters per CardId, derived maxScore), letterCount and spelling, makes buildDeck read EN, removes the Letter union and language constants from types.ts, turns STUCK_PENALTY_PER_CARD into PENALTY_PER_LETTER = 10, makes Card.letter a string (D1, main.ts and App.svelte type only), and repoints the golden test's letter half to EN.letters with its literal unchanged.

## Acceptance Criteria

Verify: npm run test:all is green with the golden literals byte-identical, R-85 tests show letterCount 2 for QU, 1 otherwise and EngineError for -1, 52 and 1.5, Σ letterCount over the deck is 53, EN.maxScore is 530, and the e2e smoke spec still finds 52 card-<CardId> elements for seed 1.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, Scaffold facts that bite, CAP-1, CAP-2

## Notes

- Open question: Whether a readonly array field on LangData, rather than object key order, reproduces the scaffold deck order without touching the golden literals.
