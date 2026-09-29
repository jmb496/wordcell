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

Adds src/engine/errors.ts EngineError carrying a unique check code (owned here, used by every later entry) and src/engine/lang/en.ts with EN built by one internal LangData constructor (distribution summing to 52, letter values, uppercase letters per CardId, derived maxScore), letterCount and spelling, makes buildDeck read EN, removes the Letter union and language constants from types.ts, turns STUCK_PENALTY_PER_CARD into PENALTY_PER_LETTER = 10, makes Card.letter a string, and repoints the golden test's letter half to EN.letters with its literal unchanged.

- Modules: `class EngineError extends Error` with `readonly check: string` and `name` `'EngineError'` in `src/engine/errors.ts`; the check-code scheme is the builder's, one unique code per check. The `LangData` type and its constructor live in `src/engine/lang/lang-data.ts` (internal; CAP-6 imports the constructor); `src/engine/lang/en.ts` holds only `EN`.
- Constructor: takes an ordered readonly `{ letter, count, value }[]` with every value explicit (EN: `QU` 2, every other letter 1), in scaffold order (alphabetical, `QU` in the Q slot). It derives `letters` (per CardId) and `maxScore` (Σ count × value × 10, R-80), never literals; `letterValue` throws `EngineError` for a letter not in the language (no default, rule 6). It throws `EngineError` unless the counts sum to `DECK_SIZE` and returns a deep-frozen value (build-notes CAP-2).
- `type CardId = number` (0–51, spec §2) is added to `types.ts`. `letterCount(card: CardId, lang: LangData): number`; a card fails the domain check unless `Number.isInteger(card)` and 0 ≤ card ≤ 51, throwing `EngineError`.
- Internal `spelling(card: CardId, lang): string` = `lang.letters[card]` lowercased (`'qu'` for the QU card), with the same CardId-domain throw as `letterCount`.
- `buildDeck` builds each card as `{ id, letter: EN.letters[id] }` for the 52 ids (one derivation), so the golden letter assertion on `EN.letters` also pins the board; no second test or literal (build-notes CAP-2). Its plain-`Error` length check is removed (the constructor's sum check owns it).
- `deal.test.ts`: the R-01 test's `ENGLISH_DISTRIBUTION` import and loop are repointed to iterate `EN.distribution` entries; `DECK_SIZE` stays imported from `types.ts`. Only the GOLDEN_* literals are frozen (ticket 2.1) and they stay byte-identical.
- `src/engine/index.ts` afterwards: drops the `Letter` type export and exports `EN`, `letterCount`, `type LangData` and `type CardId` (AD-2 items this ticket creates) beside D1's `deal`/`Card`. `EngineError`, the LangData constructor and `spelling` stay internal (SPEC Constraints).
- `PENALTY_PER_LETTER` is only the rename here; it has no consumer in this ticket, and R-81 coverage is CAP-6's.
- No file under `src/ui/` or `src/main.ts` is expected to change (App.svelte imports only type `Card`, main.ts only `deal`); if `npm run check` needs one, only the type change D1 allows.

## Acceptance Criteria

Verify: npm run test:all is green with the golden literals byte-identical, R-85 tests show letterCount 2 for QU, 1 otherwise and EngineError for -1, 52 and 1.5, Σ letterCount over the deck is 53, EN.maxScore is 530, and the e2e smoke spec still finds 52 card-<CardId> elements for seed 1.

- The `R-02 golden deal` test runs green before the first edit to `deal.ts`, `types.ts` or language data, and after (SPEC Constraints, AGENTS.md Policy).
- Every throw test in this ticket asserts `EngineError` and its exact `check` code: CardId domain (letterCount; spelling may share the code if it is one check), constructor sum, unknown letter.
- letterCount domain: -1, 52, 1.5 and NaN throw; cards 0 and 51 are valid.
- Constructor: distributions summing to 51 and 53 throw; a valid 52-card synthetic language builds (e.g. two cards worth 2 → maxScore 540, the input CAP-6 needs).
- `letterValue` for a letter not in the language throws.
- One assertion that `EN`, `EN.letters`, `EN.distribution` and its entries are frozen.
- R-37 test for spelling: the QU card gives `'qu'`, one single-letter card gives its lowercase letter, and -1, 52 and 1.5 throw.
- Test ids: the maxScore 530 test is `R-80 …`; the Σ letterCount 53, letterCount, constructor, letterValue and frozen tests are `R-85 …`.
- R-85 sentence map: "never counts cards where letters are meant" is completed by the QU cases of R-36, R-40, R-80 and R-81 in their CAPs; "English only" is exempt (rule-coverage R-85).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, Scaffold facts that bite, CAP-1, CAP-2

## Notes

- Decision (build-notes Scaffold facts that bite): `distribution` is an explicit ordered array, not object key order; the byte-identical golden letter literal proves it reproduces the scaffold deck order.
- The AGENTS.md Known pitfalls line about `STUCK_PENALTY_PER_CARD` goes stale; it is refreshed through `bmad-project-context`, not hand-edited in this ticket.
