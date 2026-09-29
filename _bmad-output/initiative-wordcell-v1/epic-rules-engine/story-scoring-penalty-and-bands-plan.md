---
title: 'Scoring, penalty and bands'
type: 'feature'
ticket: '7'
created: '2026-09-29'
status: done
baseline_revision: '0d3c9de5d38390b7153b7e6f88061e0e48d7c383'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-scoring-penalty-and-bands.md'
warnings: []
deferred:
  - summary: >-
      AGENTS.md Known pitfalls still describes STUCK_PENALTY_PER_CARD as scaffold to be replaced; ticket 2.2 already replaced it with PENALTY_PER_LETTER and this ticket completes R-81.
    evidence: |-
      grep finds no STUCK_PENALTY_PER_CARD in src/; the pitfall is stale. Fix edits agent-context (managed block via bmad-project-context), so deferred.
    location: >-
      AGENTS.md Known pitfalls
    severity: low
---

<intent-contract>

## Intent

**Problem:** The engine has no scoring: nothing computes the live score over WordCells (R-80), the give-up penalty and unclamped final score (R-81, Q-25, Q-28), or the rating band as a fraction of the language's derived max (R-83, Q-15, SPEC D3).

**Approach:** Add engine-internal `src/engine/scoring.ts` with `liveScore`, `lettersLeft`, `penalty`, `finalScore` and `band` exactly as the ticket Description signs them, two band constants in `types.ts`, and `src/engine/scoring.test.ts` covering R-80, R-81 and R-83's band sentences with inline data.

## Boundaries & Constraints

**Always:** Signatures `liveScore(cells, lang)`, `lettersLeft(columns, lang)`, `penalty(columns, lang)`, `finalScore(position, gaveUp, lang)`, `band(score, lang)`; `Position` is `import type` from `./rules`; letters via `letterCount` from `./lang/lang-data`; cell i multiplies by `WORD_CELL_NUMBERS[i]`; band is the count of `t` in `BAND_THRESHOLDS` with `score * BAND_DENOMINATOR >= t * lang.maxScore`; reuse `PENALTY_PER_LETTER`; test names start with `R-80`, `R-81` or `R-83`; small inline data only.

**Never:** export scoring from `src/engine/index.ts` or touch `index.test.ts`; touch `src/engine/lang/`, `view.ts`, `GameView`, `src/ui/`, `src/shell/`; clamp; add an `EngineError` code or a band domain check; hard-code EN absolutes (159, 265 …) outside tests; hard-code the QU CardId (use `EN.letters.indexOf('QU')`); longest word or word count; import from another test file.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| R-80 live | cell 3 = a 3-card word containing QU (4 letters), cell 10 = two stacked words (e.g. 3 + 4 cards), others empty | literal Σ letterCount × cell number (e.g. 4×3 + 7×10 = 82) | none |
| R-80 empty | 8 empty cells | 0 | none |
| R-81 QU penalty | columns holding only the QU card | lettersLeft 2, penalty 20 | none |
| R-81 empty columns | all columns empty | lettersLeft 0, penalty 0 | none |
| R-81 won | empty columns, cards in cells | `finalScore(p, false, EN)` = the liveScore literal | none |
| R-81 gaveUp discriminates | same Position, letters in columns, ≥1 non-empty cell | false → live literal (non-zero); true → literal − penalty | none |
| R-81 give up at the deal | 8 columns holding CardIds 0–51 between them, 8 empty cells | finalScore −530; `band(−530, EN)` 0 (Q-28 lowest band) | none |
| R-83 EN | 158,159,264,265,377,378,468,469,529,530,−530 | 0,1,1,2,2,3,3,4,4,5,0 | none |
| R-83 synthetic | EN.distribution with Z value 2 → `makeLangData`; assert maxScore 540 first | 161→0,162→1,269→1,270→2,384→2,385→3,477→3,478→4,539→4,540→5; 159: EN 1 vs synthetic 0; 530: EN 5 vs synthetic 4 | none |

</intent-contract>

## Code Map

- `src/engine/types.ts` -- add, beside `PENALTY_PER_LETTER`: `BAND_THRESHOLDS = [156, 260, 370, 460, 520] as const` (ascending) and `BAND_DENOMINATOR = 520`, each with a one-line R-83 doc comment. Nothing else changes.
- `src/engine/rules.ts:10` -- `Position { columns, cells }` (`columns[0]` = column 1, `cells[0]` = WordCell 3); read-only.
- `src/engine/lang/lang-data.ts` -- `LangData` (`maxScore`, `letters`, `distribution`), `makeLangData(id, entries)`, `letterCount(card, lang)`; read-only.
- `src/engine/lang/en.ts` -- `EN` (maxScore 530, QU value 2); read-only.
- `src/engine/lang/lang-data.test.ts` -- style reference (QU via `EN.letters.indexOf('QU')`, JSDoc density); do not import from it.
- `src/engine/scoring.ts` -- new, engine-internal.
- `src/engine/scoring.test.ts` -- new; imports `EN` from `./lang/en`, `makeLangData` from `./lang/lang-data`, functions from `./scoring`.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/types.ts` -- add the two band constants -- R-83 rule constants live beside `PENALTY_PER_LETTER`.
- [x] `src/engine/scoring.ts` -- implement the five functions per Boundaries, short JSDoc citing R-80/R-81/R-83 -- pure over an already-replayed Position.
- [x] `src/engine/scoring.test.ts` -- one test per matrix row group, names `R-80 …`, `R-81 …`, `R-83 …`; the give-up-at-the-deal test is named e.g. `'R-81 give up at the deal: −530, unclamped, lowest band'` and asserts both −530 and band 0 -- every matrix row covered.

**Acceptance Criteria:**
- Given the change, when `npm run test:all` runs, then it is green and `src/engine/index.ts`, `index.test.ts` and `src/engine/lang/` are unchanged in `git diff`.
- Given `src/architecture.test.ts`, when it scans `scoring.ts`, then no AD-1 violation (engine purity, relative imports only).

## Implementation Notes

- Implemented as planned; `npx vitest run src/engine/scoring.test.ts src/architecture.test.ts` and `npm run test:all` green on 2026-09-29. Not committed.

## Plan Change Log

## Review Triage Log

### 2026-09-29 — Review pass
- verdicts: 10 findings — high 0, medium 0, low 4, false 6, maybe-false 0
- findings:
  - `[false]` `[reject]` blind: liveScore gives NaN for >8 cells, band hides it as 0 — every Position comes from replay (rules.ts `Position`, always 8 cells); scoring has no caller yet and the ticket forbids domain checks; unreachable.
  - `[low]` `[patch]` blind: only `band` shown to read `lang` — added Z-card `lettersLeft` 1 under EN / 2 under synthetic in the R-83 synthetic test.
  - `[low]` `[patch]` blind: R-80 comment calls card sets "words" — reworded to "3 cards incl. QU = 4 letters × 3; 7 cards × 10".
  - `[low]` `[patch]` blind: won test checks only gaveUp=false — added `finalScore(position, true, EN) === 82` (empty columns, penalty 0).
  - `[false]` `[reject]` blind: "never +3" not testable — `WORD_CELL_NUMBERS[i]` equals i+3 by definition; no observable defect.
  - `[low]` `[defer]` blind: AGENTS.md pitfall on STUCK_PENALTY_PER_CARD stale — pre-existing since ticket 2.2 and an agent-context edit; deferred.
  - `[false]` `[reject]` blind: "ascending" on BAND_THRESHOLDS unchecked — the constant is a literal that is ascending; the comment is accurate and count-met needs only the literal.
  - `[false]` `[reject]` edge: cells longer than 8 → NaN — same as the first row; replay never produces it.
  - `[false]` `[reject]` edge: NaN score → band 0 — no path produces NaN; ticket: no band domain check.
  - `[false]` `[reject]` edge: maxScore 0 → band 5 — only EN (530) and test data exist; a zero-value language is R-85 data, not reachable.
- verification-gap: no gaps; intent-alignment: implements the ticket's reading (engine-internal functions + unit tests), game-level exposure deliberately CAP-7.

## Design Notes

Review-log hand-off (ticket review log `## Result`), each resolved here:
- Open major (R-81 lowest-band sentence) → R-81 give-up-at-the-deal test asserts `band(finalScore(p, true, EN), EN) === 0`.
- QU penalty wording → "columns holding only the QU card → lettersLeft 2, penalty 20" (matrix).
- Stacked words in one cell → R-80 row (cell 10 holds two words).
- QU CardId via `EN.letters.indexOf('QU')`; give-up-at-deal columns wording; won case (empty columns, cards in cells, final = live literal); `synthetic.maxScore === 540` asserted first; test imports — all in matrix/Code Map.
- Constants style → `as const`, per the ticket.
- `after: [2]` vs `Position` from rules.ts (ticket 2.3) → not changed: the ticket file is read-only to the build and 2.3 is already on HEAD, so the dependency is satisfied; noted for the owner/retro only.
- finalScore callers → out of scope: CAP-7 (entry 8) calls `finalScore` only when status ≠ playing, passing `status === 'gaveUp'` (AD-3); recorded here as the hand-off.

## Verification

**Commands:**
- `npx vitest run src/engine/scoring.test.ts src/architecture.test.ts` -- expected: all pass
- `npm run test:all` -- expected: exit 0

## Auto Run Result

- **Change:** engine-internal `src/engine/scoring.ts` (`liveScore`, `lettersLeft`, `penalty`, `finalScore`, `band`) per R-80/R-81/R-83, with 9 id-named tests covering every matrix row.
- **Files:** `src/engine/scoring.ts` (new, scoring functions); `src/engine/scoring.test.ts` (new, R-80/R-81/R-83 tests); `src/engine/types.ts` (+`BAND_THRESHOLDS`, `BAND_DENOMINATOR`).
- **Review:** 3 low patches applied (test coverage/comment), 1 deferred (stale AGENTS.md pitfall), 6 rejected as false (see triage log).
- **Review-log hand-off:** open major resolved (R-81 give-up-at-the-deal test asserts band 0); all unapplied minors resolved per Design Notes; `after: [2]` vs 2.3 left in the read-only ticket (2.3 on HEAD) for the owner/retro; `finalScore` caller contract recorded for CAP-7.
- **Follow-up review:** false (patched: high 0, medium 0, low 3).
- **Verification:** `npx vitest run src/engine/scoring.test.ts src/architecture.test.ts` pass; `npm run test:all` exit 0 before and after patches (unit 704 passed, all e2e suites passed).
- **Residual risks:** none known; scoring is not wired into `GameView` until entry 8.
