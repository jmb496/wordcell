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

Adds `wordList` and the exported `WordListEntry { spelling, letterCount, cards, cell }` type to `GameView`, built from the replay pass: the internal `replayWords` return in `src/engine/replay.ts` widens to carry each committed move's cards and cell (the widened shape is not exported from `index.ts`; `CommittedWord`, `longestWord`, history and the Session shape stay unchanged and the existing tests stay green). One entry per committed-prefix move (pending draft and redo tail excluded): `spelling` is the R-37 lowercase string (as `CommittedWord.spelling`, AD-3; uppercasing is the UI's), `letterCount` the R-85 count (QU counts 2, so `cards.length` may be smaller), `cards` in word order, `cell` the placement cell. Order is letter count descending, then spelling ascending by plain code-unit comparison (no `localeCompare`); equal entries keep move order (stable). The `wordList` key is omitted (not `undefined`, as the other optional `GameView` fields) while playing, and is `[]` for won or gaveUp with no committed word. The change adds `WordListEntry` to the exported-type name list in `src/architecture-ad2-ad12-ad17.test.ts` and the `expectTypeOf` pins in `src/engine/index.test.ts`; the runtime-key pin and AD-1 scan stay green.

It also adds `fixtures/session-won-words.json`, a valid won Session (status won, final move the Confirm of the last word, no redo tail with the cursor at the end, `gaveUp` false, so Undo then Confirm re-wins) with a duplicate word, a letter-count tie, one long word of exactly 10 letters (WordCell 10; `letterCount` counts QU as 2) and one card shared by two words (a WordCell top card reused as a free letter, R-41). Committed words are trusted by the parser (R-37), so a partition found by search is enough; real words preferred for the device read. It is registered in the fixture name list of `src/architecture-ad2-ad12-ad17.test.ts` and in the `ValidName` union, `VALID`, `PROPERTIES` and `REBUILDS` of `src/engine/serialize.test.ts`, at the same index in `VALID` and `REBUILDS` (the AD-17 check requires the order). The rebuild is a scripted drop/validate/confirm sequence with inline dictionaries, as `winSeed` does. The architecture test title says "exactly the seventeen rebuilt ones" but the list holds 18 names (19 with the new one); the title is made count-free. The fixture's `PROPERTIES` entry asserts the literal expected `wordList` via `view(s, lang)` with the inline dictionary (spelling, `letterCount`, `cards` and `cell` for each entry, the duplicate, the tie in alphabetical order against move order, the shared `CardId` in two entries), and a test shows Undo of the finish gives playing with no `wordList` and Confirm restores the identical list. Seeded only through `seedStorage`; no Session or history shape changes.

Intent: risk low. Interface: `view(session, lang).wordList?: readonly WordListEntry[]`; `fixtures/session-won-words.json` (Undo then Confirm is the Playwright win route). Tests: R-86 rows of rule-coverage.md (E); architecture tests; fixture registration and rebuild tests. Owns: the word list derivation and the shared won-with-words fixture. Consumers: entry 2 (`EndSheet.svelte`), entry 3 (the celebration), entries 5-8 (Playwright).

## Acceptance Criteria

Verify: The engine unit tests named R-86 pass for order, ties, duplicates (equal entries in move order with different cards and cell), QU (lowercase `qu`, `letterCount` 2), empty (gaveUp with no word gives `[]`), a reused card, draft exclusion (including gaveUp with a pending draft), a redo tail excluded and Undo of the finish, `src/architecture-ad2-ad12-ad17.test.ts` and `src/engine/index.test.ts` list `WordListEntry`, `wordList` is absent while playing (`'wordList' in view` false) and present for won and gaveUp, the new fixture is registered in those three places, parses, rebuilds byte for byte and yields the expected list (including the shared `CardId` in two entries), and the existing serialize and fixture tests stay green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-2, AD-3, AD-6
- rules — docs/game-flow-spec.md R-86, Q-47
- code — src/engine/view.ts, src/engine/replay.ts, src/engine/index.ts, fixtures/, e2e/helpers/seed.ts

## Notes

- Open question: Finding a seed and move partition that gives a duplicate, a tie, a long word and a shared card is a search; real words are best-effort.
