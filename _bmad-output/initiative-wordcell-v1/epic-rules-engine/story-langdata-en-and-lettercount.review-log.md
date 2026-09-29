# Review log — story-langdata-en-and-lettercount.md (ticket 2.2)
State: pass 2: done (converged)

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 4b2107a, copy `story-langdata-en-and-lettercount.review-log.passes/pass0.md`, 204 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md.

## Pass 1 — 2026-09-28 22:30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 11, decision-needed 0  |  Dropped in triage: 3 (plus duplicates merged)
Words (docs): 758 (3.7 x pass 0; budget 1500)  |  Snapshot: story-langdata-en-and-lettercount.review-log.passes/pass1.md
Fixer: applied items 1–19; no commands touched.
### Applied
- [major] Description — `index.ts` surface after the change unstated (drop `Letter`; add `EN`, `letterCount`, `type LangData`, `type CardId`; `EngineError`, constructor, `spelling` stay internal) → fixer item 1
- [major] Description — after the golden repoint nothing ties `buildDeck`'s `Card.letter` to `EN.letters` → fixer item 2
- [major] AC — constructor's sum-to-52 throw untested → fixer item 3
- [major] Description/AC — `spelling` has no signature, domain or test → fixer item 4
- [major] Description — R-01 test in `deal.test.ts` imports `ENGLISH_DISTRIBUTION` and loops `Object.entries`; repoint to `EN.distribution` unstated → fixer item 5
- [major] AC — tests assert only the class, not the exact `check` code; field name unset → fixer item 6
- [major] Description — constructor input shape and letter values implicit ("QU 2, else 1" is a silent default; CAP-6 synthetic language needs explicit values) → fixer item 7
- [major] AC — `letterCount` parameter type ambiguous (Card object vs CardId; no `CardId` type yet) → fixer item 8
- [minor] Notes — open question already answered by build-notes Scaffold facts → fixer item 9
- [minor] Description — module location of `LangData` type and constructor → fixer item 10
- [minor] AC — test ids for 53 / 530 (R-85 / R-80) → fixer item 11
- [minor] Description — deep-frozen `EN` dropped → fixer item 12
- [minor] AC — domain edges 0/51 valid and NaN → fixer item 13
- [minor] Description — `buildDeck` plain-`Error` length check duplicates the constructor → fixer item 14
- [minor] Description — "main.ts and App.svelte type only" implies edits → fixer item 15
- [minor] AC — golden test run before the first edit and after (SPEC Constraints) → fixer item 16
- [minor] Description — AGENTS.md `STUCK_PENALTY_PER_CARD` pitfall goes stale; refresh via bmad-project-context, not here → fixer item 17
- [minor] Description — `PENALTY_PER_LETTER` has no consumer here; R-81 coverage is CAP-6 → fixer item 18
- [minor] AC — R-85 sentence map (QU cases in later CAPs, "English only" exempt) → fixer item 19
### Default applied (technical)
- constructor input — ordered readonly `{ letter, count, value }[]`; `letterValue` throws `EngineError` for a letter not in the language
- `EngineError` — `class EngineError extends Error { readonly check: string }`, codes the builder's, unique, asserted exactly
- module layout — `LangData` type and constructor in `src/engine/lang/lang-data.ts`; `en.ts` holds only `EN`
- `buildDeck` — cards take `letter = EN.letters[id]`; its plain-`Error` length check goes (constructor enforces 52)
- `CardId` — `type CardId = number` in `types.ts`, type-exported
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- constructor rejecting duplicate letters / non-positive counts (not in refs; would invent requirements)
- R-01 test asserting `QU` once (already pinned by the golden letter literal)
- separate test that `buildDeck` letters equal `EN.letters` (build-notes: no second test; covered by item 2's single derivation)

## Pass 2 — 2026-09-28 22:50
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 16 (after merge), decision-needed 0  |  Dropped in triage: 2
Words (docs): 758 (3.7 x pass 0; budget 1500)  |  Snapshot: story-langdata-en-and-lettercount.review-log.passes/pass1.md (no fix pass)
### Applied
- none (converged; no fix pass)
### Default applied (technical)
- none this pass
### Decision needed (functionality / UX / gameplay)
- none
### Reclassified
- edge-case "constructor validates only the sum (duplicate letter, non-positive/non-integer count or value)" major → minor: refs require only the sum check (SPEC CAP-2, build-notes CAP-2) and every input is engine-authored (`EN`, the CAP-6 test language); pass 1 already dropped the same point as inventing requirements.
### Dropped
- (none from the fix-diff lens: it found items 1–19 landed and raised only the distribution-shape minor, merged below)
- "golden before-edit run needs recorded evidence" — process evidence belongs in the build plan (minor at most; plan detail).

## Result — converged after 2 passes

Majors per pass: 8, 0. Decision-needed: none. Technical defaults applied: 5 (pass 1).

Unapplied minors (for the build plan or a later loop):
- LangData output shape unstated: whether `EN.distribution` entries keep `value`, whether build-notes' `id: 'en'` stays, `letterValue` function vs map (default: build-notes shape; `distribution` = the constructor's input entries as given, deep-frozen; `id` passed to the constructor).
- Home module of `letterCount` and `spelling` unnamed (default: `src/engine/lang/lang-data.ts`, index re-exports only `letterCount`).
- `letterCount` derivation not restated (default: `lang.letterValue(lang.letters[card])` after the domain check, build-notes CAP-2).
- Constructor accepts duplicate letters or non-positive/non-integer counts/values (default: state only the sum check is in scope, or add one code per check).
- maxScore factor 10 unnamed; must be the highest WordCell number (`Math.max(...WORD_CELL_NUMBERS)`), never `PENALTY_PER_LETTER`.
- Synthetic-language case is only "e.g."; make it assert `maxScore` 540 and frozen, encoded as EN with one more count-1 letter at value 2.
- spelling throw list lacks NaN; use one shared CardId-domain guard (and code) for `letterCount` and `spelling`.
- Test names: frozen test → `AD-2 …`, constructor sum test → `R-01 …` rather than R-85; note CAP-4 still owns R-37's word-string coverage.
- `buildDeck` reads `EN.letters` refines build-notes' "reads `EN.distribution`"; say so. Optionally one `expect(buildDeck().map(c => c.letter)).toEqual(EN.letters)` inside the existing R-01 test (no new test, no literal).
- Say only `Letter` and `ENGLISH_DISTRIBUTION` leave `types.ts`; the rule constants stay (build-notes Scaffold facts).
- The AGENTS.md pitfall refresh needs a named trigger (build hand-off or the epic's closing sweep).
