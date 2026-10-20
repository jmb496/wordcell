---
id: 1
type: story
title: "Engine word list and its fixture"
parent: epic-end-of-game-words
covers: [CAP-1]
risk: low
---

# Engine word list and its fixture

## Description

Adds `wordList` and the exported `WordListEntry` type to `GameView`, built from the replay pass (whose internal return widens to carry each move's cards and cell): one entry per committed move with spelling, letter count, cards in word order and placement cell, ordered by letter count descending then spelling ascending, absent while playing; amends the AD-2 export list and the `expectTypeOf` pins; and adds `fixtures/session-won-words.json`, a valid won Session with a duplicate word, a letter-count tie, one long word and one card shared by two words (a WordCell top card reused as a free letter, R-41) (committed words are trusted by the parser, R-37, so a partition found by search is enough; real words preferred for the device read), registered in the fixture name list of `src/architecture-ad2-ad12-ad17.test.ts` (whose count wording is corrected) and in the `ValidName` union, `VALID`, `PROPERTIES` and `REBUILDS` of `src/engine/serialize.test.ts` (the rebuild is a scripted drop/validate/confirm sequence with inline dictionaries, as `winSeed` does), with the long word at least 10 letters, seeded only through `seedStorage`; no Session or history shape changes.

## Acceptance Criteria

Verify: The engine unit tests named R-86 pass for order, ties, duplicates, QU, empty, a reused card, draft exclusion and Undo of the finish, `src/architecture-ad2-ad12-ad17.test.ts` and `src/engine/index.test.ts` list `WordListEntry`, `wordList` is absent while playing and present for won and gaveUp, the new fixture is registered in those three places, parses, rebuilds byte for byte and yields the expected list (including the shared `CardId` in two entries), and the existing serialize and fixture tests stay green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-2, AD-3, AD-6
- rules — docs/game-flow-spec.md R-86, Q-47
- code — src/engine/view.ts, src/engine/replay.ts, src/engine/index.ts, fixtures/, e2e/helpers/seed.ts

## Notes

- Open question: Finding a seed and move partition that gives a duplicate, a tie, a long word and a shared card is a search; real words are best-effort.
