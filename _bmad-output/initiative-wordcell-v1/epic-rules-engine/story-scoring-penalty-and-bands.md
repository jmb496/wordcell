---
id: 7
type: story
title: "Scoring, penalty and bands"
parent: epic-rules-engine
covers: [CAP-6]
after: [2]
risk: low
---

# Scoring, penalty and bands

## Description

Adds src/engine/scoring.ts: liveScore over WordCells, lettersLeft and the R-81 penalty, the unclamped final score, and band as the 0–5 index relative to LangData's derived `maxScore` (SPEC D3: band is an index 0–5; names stay UI text), with a synthetic LangData built by `makeLangData` (src/engine/lang/lang-data.ts, ticket 2.2) proving the thresholds are relative.

- Signatures, all pure over an already-replayed Position: import `type Position` from `./rules` (ticket 2.3, already on HEAD; no new position type); no replay or Session dependency:
  - `liveScore(cells, lang)` over the committed Position's `cells` (AD-3: committed WordCells only); cell i scores Σ letterCount × `WORD_CELL_NUMBERS[i]`, never a literal +3 (R-80).
  - `lettersLeft(columns, lang)` = Σ letterCount over the Position's column cards (`QU` 2).
  - `penalty(columns, lang)` = `PENALTY_PER_LETTER` × lettersLeft.
  - `finalScore(position, gaveUp, lang)` = liveScore − (gaveUp ? penalty : 0), unclamped (R-81, Q-28).
  - `band(score, lang)` returns an integer 0–5: the count of t in `BAND_THRESHOLDS` with `score × BAND_DENOMINATOR ≥ t × lang.maxScore` (integer comparison, R-83). No domain check (engine-internal callers pass integers); no new `EngineError` code.
- Constants: import the existing `PENALTY_PER_LETTER` from types.ts (do not re-add or rename); types.ts gains only `BAND_THRESHOLDS = [156, 260, 370, 460, 520] as const` (readonly, ascending, so the count-met formula equals R-83's "highest matching band wins") and `BAND_DENOMINATOR = 520`, beside `PENALTY_PER_LETTER`. The EN absolutes (159, 265, …) appear only in tests. `lang/` is untouched.
- scoring.ts is engine-internal: not exported from src/engine/index.ts; index.ts and index.test.ts unchanged (AD-2 list); tests import from `./scoring`. CAP-7 (entry 8, view) exposes the values through `GameView` (AD-3).
- Scope: only R-83's band sentences (thresholds, integer comparison, negative → band 0). R-83's longest-word (V) sentence goes to CAP-7 (entry 8); its (UI) sentences (names, messages) are out of scope here.
- Never: view.ts, `GameView`, text.ts, longest word, word count.

## Acceptance Criteria

- Verify: npm run test:all is green with the tests below in src/engine/scoring.test.ts, names starting with the id (`'R-80 …'`, `'R-81 …'`, `'R-83 …'`), small inline data (no generated dictionary).
- R-80: hand-built cells in at least two different WordCells, one word containing `QU` (e.g. cells 3 and 10), expected total as a literal; all cells empty → 0. R-80's max sentence is already covered by lang-data.test.ts `R-80 EN.maxScore is 530` (ticket 2.2), not re-tested.
- R-81:
  - gaveUp with letters left subtracts the penalty; a `QU` left in a column counts 2 → penalty 20.
  - Not gaveUp (won, empty columns) → final = live.
  - One Position with letters left in the columns and at least one non-empty WordCell: `finalScore(p, false, EN)` equals `liveScore(p.cells, EN)` (a non-zero literal) and `finalScore(p, true, EN)` equals that literal minus the penalty (discriminates `gaveUp`).
  - Empty columns → lettersLeft 0 and penalty 0.
  - Give up at the deal: a hand-built Position with columns holding CardIds 0–51 (any split) and 8 empty cells (not from `deal`, which returns Card objects), no words → finalScore −530 (negative finals kept).
- R-83 EN bands: 158→0, 159→1, 264→1, 265→2, 377→2, 378→3, 468→3, 469→4, 529→4, 530→5, and a negative score (−530) → 0.
- R-83 synthetic LangData (scoring.test.ts builds the entries inline from `EN.distribution` with `Z`'s value set to 2 and passes them to `makeLangData`, the same language as lang-data.test.ts but no import from another test file; Σ letterCount 54, `maxScore` 540): boundaries 161/162, 269/270, 384/385, 477/478, 539/540 (the 384/385 and 477/478 pairs catch whole-percent rounding); one score banded differently under EN than under the synthetic language (159 → 1 under EN, 0 under synthetic; 530 → 5 vs 4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- rules — docs/game-flow-spec.md §6 R-80, R-81, R-83; §9 Q-06, Q-15, Q-28
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-6, D3
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-6 Scoring
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, rows R-80, R-81, R-83
- spine — ARCHITECTURE-SPINE.md AD-1, AD-2, AD-3
- code — src/engine/lang/lang-data.ts `makeLangData` (synthetic language in lang-data.test.ts); src/engine/types.ts
- prior plan (hand-off) — story-langdata-en-and-lettercount-plan.md (`PENALTY_PER_LETTER`, `makeLangData`; in _bmad-output/initiative-wordcell-v1/epic-rules-engine/)

## Notes

- Open question: None.
