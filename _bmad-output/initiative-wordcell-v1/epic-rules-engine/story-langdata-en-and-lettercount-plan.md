---
title: 'LangData, EN and letterCount'
type: 'feature'
ticket: '2'
created: '2026-09-28'
status: done
baseline_revision: '6f8101fc1f4d4e12db6697cd7c24f82ef8a94089'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/specs/spec-epic-2-rules-engine/build-notes.md'
warnings: [oversized]
deferred: []
---

<intent-contract>

## Intent

**Problem:** Language data is scattered in `types.ts` (`Letter` union, `ENGLISH_DISTRIBUTION`, object key order drives deck order) and nothing counts letters per card, so scoring (R-80/R-81) and word strings (R-37) have no single source (R-85, spine Scaffold delta).

**Approach:** Add `EngineError` (`src/engine/errors.ts`), an internal `LangData` constructor plus `letterCount`/`spelling` (`src/engine/lang/lang-data.ts`) and `EN` (`src/engine/lang/en.ts`), per the ticket Description; `buildDeck` reads `EN.letters`; the golden test's letter half reads `EN.letters` with GOLDEN_* literals byte-identical.

## Boundaries & Constraints

**Always:** Run `R-02 golden deal` green before the first edit to `deal.ts`/`types.ts`/lang data and after. GOLDEN_* literals byte-identical. Every throw is `EngineError` with a unique `check` code; tests assert class and exact code. `maxScore` and `letters` derived in the constructor, never literals. Rule 1 purity (AD-1 scan).

**Never:** Change deal order, PRNG or shuffle. Export `EngineError`, the constructor or `spelling` from `index.ts`. Touch `src/ui/`, `src/main.ts` beyond a D1 type fix (none expected). Hand-edit AGENTS.md (pitfall refresh is `bmad-project-context`'s). Add constructor checks beyond the sum check (duplicate letters, non-positive counts/values: out of scope; the only inputs are code-owned).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| QU card | `letterCount(qu, EN)` (QU's CardId = 35, derived as `EN.letters.indexOf('QU')` in tests) | 2 | — |
| Other card | cards 0 and 51 | 1 | — |
| Out of domain | -1, 52, 1.5, NaN to `letterCount` and `spelling` | throws | `EngineError`, check `card-id-domain` (one shared guard) |
| Spelling | QU card; card 0 | `'qu'`; `'a'` | — |
| Bad sum | EN entries with one count ±1 (51, 53) | throws | `EngineError`, check `lang-deck-size` |
| Unknown letter | `EN.letterValue('Ä')` | throws | `EngineError`, check `lang-unknown-letter` |
| Synthetic | EN entries with `Z` value 2 | builds; `maxScore` 540; frozen | — |

</intent-contract>

## Code Map

- `src/engine/types.ts` -- delete `Letter` and `ENGLISH_DISTRIBUTION` only; add `export type CardId = number` (0–51, §2); `Card { readonly id: CardId; readonly letter: string }`; rename `STUCK_PENALTY_PER_CARD` → `PENALTY_PER_LETTER = 10` (no consumer yet). Keep `WordCellNumber`, `WORD_CELL_NUMBERS`, `COLUMN_COUNT`, `DECK_SIZE`, `MIN_WORD_LENGTH`.
- `src/engine/deal.ts` -- `buildDeck` = `Array.from({ length: DECK_SIZE }, (_, id) => ({ id, letter: EN.letters[id] }))`; drop the plain-`Error` length check and the `Letter`/`ENGLISH_DISTRIBUTION` imports. `mulberry32`, `shuffle`, `deal` untouched.
- `src/engine/index.ts` -- `export { deal }`, `export { EN }`, `export { letterCount }`, `export type { Card, CardId }`, `export type { LangData }`; drop `Letter`.
- `src/engine/deal.test.ts` -- R-01 loop iterates `EN.distribution` (`{ letter, count }`); add inside R-01 `expect(buildDeck().map((c) => c.letter)).toEqual(EN.letters)`; golden test `letters` = `EN.letters` (was `buildDeck().map(...)`). `DECK_SIZE` import stays. Nothing else changes.
- `src/ui/App.svelte`, `src/main.ts` -- read-only; import only `Card` / `deal`.
- `src/architecture.test.ts` -- read-only; engine token scan (no `console`, `Date`, `Math.random`, `Math[`, …); `Math.max(...)` is allowed.

## Tasks & Acceptance

**Execution:**
- [x] (pre) `npx vitest run src/engine/deal.test.ts -t "R-02 golden deal"` -- 1 passed before any edit -- AGENTS.md Policy.
- [x] `src/engine/errors.ts` -- `export class EngineError extends Error { readonly check: string; constructor(check, message?) }`, `name = 'EngineError'` -- scheme: kebab-case string, one per check, owned here for later entries.
- [x] `src/engine/types.ts` -- per Code Map.
- [x] `src/engine/lang/lang-data.ts` -- `interface LangData { readonly id: string; readonly letters: readonly string[]; readonly distribution: readonly LangEntry[]; readonly letterValue: (letter: string) => number; readonly maxScore: number }`, `LangEntry = { readonly letter; readonly count; readonly value }`; `makeLangData(id, entries)`: throws `lang-deck-size` unless Σ count = `DECK_SIZE`; `letters` expanded in entry order; `letterValue` via a `Map`, unknown → `lang-unknown-letter`; `maxScore` = Σ count × value × `Math.max(...WORD_CELL_NUMBERS)` (R-80; never `PENALTY_PER_LETTER`); freezes entries, both arrays and the value. `letterCount(card, lang)` = `lang.letterValue(lang.letters[card])` after `assertCardId`; `spelling(card, lang)` = `lang.letters[card].toLowerCase()` after the same guard; `assertCardId` throws `card-id-domain` unless `Number.isInteger(card) && 0 <= card <= DECK_SIZE - 1`.
- [x] `src/engine/lang/en.ts` -- `export const EN = makeLangData('en', [...])`, 26 entries alphabetical with `QU` in the Q slot, counts from the removed `ENGLISH_DISTRIBUTION`, value `QU` 2 else 1, every value explicit.
- [x] `src/engine/deal.ts`, `src/engine/index.ts`, `src/engine/deal.test.ts` -- per Code Map.
- [x] `src/engine/lang/lang-data.test.ts` -- the tests below.

**Acceptance Criteria:**
- Given the edits, when `R-02 golden deal` runs, then it passes with `git diff` showing no change to any GOLDEN_* line.
- Given `lang-data.test.ts`, then it holds, each throw asserting `EngineError` and exact `check`: `R-85 letterCount is 2 for QU, 1 otherwise` (cards 0, 51, QU); `R-85 letterCount throws outside CardId 0–51` (-1, 52, 1.5, NaN); `R-85 Σ letterCount over the deck is 53`; `R-80 EN.maxScore is 530`; `R-85 constructor throws unless counts sum to 52` (51, 53) and builds the synthetic language (maxScore 540, frozen); `R-85 letterValue throws for a letter not in the language`; `R-85 EN, its letters, distribution and entries are frozen` (one `Object.isFrozen` assertion over all); `R-37 spelling lowercases, QU as qu` (QU → `'qu'`, 0 → `'a'`, -1/52/1.5/NaN throw `card-id-domain`).
- Given `npm run test:all`, then exit 0, and the e2e smoke still finds 52 `card-<CardId>` for seed 1.
- Given `git diff --name-only` against the baseline, then no file under `src/ui/` or `src/main.ts`.

## Implementation Notes

### Review-log minors (resolution)

1. LangData shape -- applied build-notes shape with `id` passed to the constructor, `letterValue` a function, `distribution` = input entries (with `value`) deep-frozen.
2. Home of `letterCount`/`spelling` -- `lang/lang-data.ts`; index re-exports only `letterCount`.
3. `letterCount` derivation -- `lang.letterValue(lang.letters[card])` after the guard.
4. Extra constructor checks -- not added; only the sum check is in scope (Boundaries).
5. maxScore factor -- `Math.max(...WORD_CELL_NUMBERS)`.
6. Synthetic language -- EN entries with `Z` value 2; asserts maxScore 540 and frozen.
7. spelling NaN and shared guard -- applied (`assertCardId`, one code).
8. Test names -- kept the ticket's Acceptance naming (frozen and constructor tests `R-85 …`): the ticket is the contract and R-85 is the LangData rule, so the AD-n fallback does not apply; CAP-4 still owns R-37's word-string coverage.
9. `buildDeck` reads `EN.letters` (refines build-notes' "reads `EN.distribution`", one derivation); the optional `buildDeck` = `EN.letters` assertion is added inside R-01.
10. Only `Letter` and `ENGLISH_DISTRIBUTION` leave `types.ts` -- applied (Code Map).
11. AGENTS.md pitfall refresh -- trigger named: the epic's closing sweep (entry 12) runs `bmad-project-context`; recorded in Auto Run Result as a hand-off.

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 17 findings — high 0, medium 0, low 10, false 7, maybe-false 0
- findings:
  - `[false]` `[reject]` blind: Verification grep on `GOLDEN_` misses edited literal rows — the diff's only hunks in `deal.test.ts` are at lines 1–6, 84–88 and 118–121, outside every literal; the literals are byte-identical. (The stronger check would edit the plan.)
  - `[false]` `[reject]` blind: plan lacks Auto Run Result / recorded results — Finalize writes them; they are below.
  - `[low]` `[patch]` blind: synthetic language never read through `letterCount` — added `expect(letterCount(51, synthetic)).toBe(2)` in the R-85 constructor test.
  - `[low]` `[patch]` blind: `letterValue` case-sensitivity undocumented while `spelling` returns lowercase — doc comment added on `LangData.letterValue` (uppercase glyph as in `letters`, else `lang-unknown-letter`). Grouped with edge 2.
  - `[low]` `[reject]` blind: check codes are `string`, not a union — the ticket makes the scheme the builder's; a union adds surface each later entry must edit, no current harm.
  - `[low]` `[reject]` blind: `expectEngineError` local to one test file — only one consumer yet; the later entry that needs it can extract it.
  - `[false]` `[reject]` blind: `assertCardId` checks `DECK_SIZE`, a structural `LangData` could be shorter — every `LangData` comes from `makeLangData`, whose sum check guarantees 52 letters; no path builds another.
  - `[low]` `[reject]` blind: synthetic test mixes R-80 max with R-85 naming — the ticket's Acceptance puts the synthetic build in the constructor test; cosmetic.
  - `[low]` `[reject]` blind: build-notes CAP-2 shape (`distribution` without `value`, `buildDeck` reads `distribution`) not updated — the ticket (refined intent) overrides the `[ASSUMPTION]` shape; extra `value` is additive, CAP-6 reads `letterValue`/`maxScore`. Editing the spec is outside this build.
  - `[false]` `[reject]` blind: `Math.max(...WORD_CELL_NUMBERS)` hides R-80's ×10 — chosen per review-log minor 5 and documented on `LangData.maxScore`; R-80's factor is the highest cell number.
  - `[low]` `[reject]` blind: R-01 now partly circular — `goldenCounts` stays the independent check; no change needed.
  - `[low]` `[reject]` edge: fractional/negative counts summing to 52 give a short `letters` — only code-owned inputs exist (EN, test synthetic); plan Boundaries keep extra constructor checks out of scope; fix adds a guard.
  - `[low]` `[patch]` edge: `letterValue` with lowercase input throws — same root cause as blind 4; doc comment applied (callers pass `letters` glyphs, never `spelling` output).
  - `[false]` `[reject]` edge: removed `buildDeck` length check lets undefined letters through — `makeLangData` throws `lang-deck-size` unless Σ count = 52 and integer counts expand to exactly 52.
  - `[false]` `[reject]` intent: codes live at throw sites, not in `errors.ts` — matches reading A1, the ticket's "the check-code scheme is the builder's".
  - `[false]` `[reject]` intent: added R-01 `buildDeck` = `EN.letters` assertion is a "second test" — review-log minor 9 sanctions it inside the existing R-01 test; no new test, no literal.
  - `[false]` `[reject]` intent: tests import the internal module, not `index.ts` — `index.ts` re-exports the same bindings; `npm run check` and the build type the export list, and the e2e smoke (52 cards, seed 1) passed.

## Design Notes

Deck order comes from the ordered `entries` array, so `EN.letters` reproduces the scaffold order (the ticket's `unknown`); the byte-identical golden letter literal proves it.

## Verification

**Commands:**
- `npx vitest run src/engine/deal.test.ts -t "R-02 golden deal"` -- expected: 1 passed, before and after
- `git diff <baseline> -- src/engine/deal.test.ts | grep -n "GOLDEN_"` -- expected: no `+`/`-` line inside the literals
- `npm run test:all` -- expected: exit 0

## Auto Run Result

- **Change:** `EngineError` with a unique `check` code; internal `makeLangData` builds a deep-frozen `LangData` (ordered entries, derived `letters` and `maxScore`, sum check); `EN`; `letterCount` and internal `spelling` share one CardId-domain guard; `buildDeck` reads `EN.letters`; `types.ts` loses `Letter`/`ENGLISH_DISTRIBUTION`, gains `CardId`, `PENALTY_PER_LETTER = 10`; golden letter half reads `EN.letters`, literals byte-identical.
- **Files:** `src/engine/errors.ts` (new, EngineError); `src/engine/lang/lang-data.ts` (new, LangData, constructor, letterCount, spelling); `src/engine/lang/en.ts` (new, EN); `src/engine/lang/lang-data.test.ts` (new, R-85/R-80/R-37 tests); `src/engine/types.ts`, `deal.ts`, `index.ts`, `deal.test.ts` (repoints); this plan.
- **Review (thorough):** 17 findings; 2 patches (low, one root cause each: synthetic `letterCount` assertion, `letterValue` doc), 0 deferred, 15 rejected with reasons in the triage log.
- **Follow-up review recommended:** false (patched: high 0, medium 0, low 2).
- **Verification:** `R-02 golden deal` 1 passed before the first edit and after the patches; no diff hunk inside GOLDEN_* literals; `npm run test:all` exit 0 after patches (424 unit tests, dist-smoke 13, dev e2e 34 incl. 52 `card-<CardId>` for seed 1, pwa 12); nothing under `src/ui/` or `src/main.ts` changed.
- **Hand-off:** AGENTS.md Known pitfalls line on `STUCK_PENALTY_PER_CARD` (and ticket 2.1's unnamed-scaffold-tests line) is stale; refresh via `bmad-project-context` in the epic's closing sweep (entry 12).
- **Residual risks:** none known; `PENALTY_PER_LETTER` has no consumer until CAP-6.
- Erratum 2026-09-29: this result predates the 2-2 review loop's pass-1 fix; the state at bca5f0f adds `src/engine/index.test.ts` (the AD-2 runtime-surface test), `lang-data.test.ts`'s letterCount test loops all 52 cards plus the `'qu'` case, and `npm test` runs 425 unit tests (2-2 review-loop Result; ticket 2.12 S31).
- Erratum 2026-09-29: the Hand-off trigger (and Implementation Notes item 11) moved: entry 12, the refactor sweep, does not run `bmad-project-context`; the AGENTS.md Known pitfalls refresh is recorded in the 2.12 plan as a `bmad-retrospective` action item (ticket 2.12 S37).
