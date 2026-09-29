---
title: 'Golden deal test and R-id test names'
type: 'chore'
ticket: '1'
created: '2026-09-28'
status: done
baseline_revision: '82d85532a161ffeb3960dd4e2bcfb382c99d0495'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'auto'
lenses_ran: [quick]
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Nothing pins the dealt layout, so a later engine refactor (CAP-2 `LangData`, CAP-3 CardId deal) could silently change every seed's deal (AD-5, R-02); the four scaffold tests in `src/engine/deal.test.ts` carry no R-ids.

**Approach:** Test-only commit to `src/engine/deal.test.ts`, exactly as the ticket's Description and Acceptance 1–7 specify: `it('R-02 golden deal: seeds 1 and 4294967295')` with one `toEqual` of `{ seed1, seedMax, letters }` against the literal consts `GOLDEN_COLUMNS_SEED_1`, `GOLDEN_COLUMNS_SEED_MAX`, `GOLDEN_LETTERS` (untyped, no `as const`) generated once from HEAD via a temporary printing `it`; the four title renames; the R-01 per-letter count check derived from `GOLDEN_LETTERS`; a new `R-03 deals round-robin, first dealt is the column top` case for both seeds. No `src/engine/` source change.

</intent-contract>

## Implementation Notes

Oneshot: one test file, ~60 logical lines plus three literals.

Pre-generation (Acceptance 1): at HEAD `82d85532a161ffeb3960dd4e2bcfb382c99d0495` (= B, the commit before the build's first commit), `git diff --quiet 785c0f6 HEAD -- src/engine/deal.ts src/engine/types.ts` exit 0; `git diff --quiet -- src/engine/deal.ts src/engine/types.ts` (working tree clean for both) exit 0.

### Review-log minors (resolution)

1. *"an R-01 test ties the deck to carryover §1" overstates* — accepted. `GOLDEN_LETTERS` is generated from `buildDeck`, so the R-01 count check ties the deck to the golden literal; the tie to carryover §1 is the cross-check recorded below, which the R-01 row of the sentence map cites.
2. *Acceptance 1 non-zero exit / clean tree* — applied: both checks above, exit 0; a non-zero exit would have ended the build blocked for the owner with no code.
3. *Blocked path* — noted: on a §1 mismatch, Acceptances 2–7 would not apply and this plan's mismatch record would be the only output. Not triggered.
4. *Acceptance 5 truncation* — applied: if the combined diff is truncated, differing keys are confirmed with a temporary per-key `toEqual` while the mutation is applied. 5(a) moves only letters because ids are positional (`cards.push({ id: cards.length, … })`), so the CardId columns are unchanged.
5. *Acceptance 7 wording* — applied in the sentence map below.
6. *Notes / build-notes "CAP-1 only renames tests"* — accepted: that line is about imports (no import change here); the R-01 count check and R-03 round-robin case come from rule-coverage R-01/R-03. The R-03 tests may be repointed later; only the GOLDEN_* consts are frozen.
7. *`biome check --write` applies safe fixes* — applied: the golden test is re-run after formatting, and `grep -n console src/engine/deal.test.ts` must be empty before commit.

### Sentence → test map (R-01–R-03)

| Sentence | Test |
| --- | --- |
| R-01 "Deck: 52 cards, English distribution in carryover §1" | `R-01 deck has 52 cards matching the English distribution` (length, counts vs ENGLISH_DISTRIBUTION and vs `GOLDEN_LETTERS`); the §1 tie is the cross-check recorded below; `R-02 golden deal` letter half pins order |
| R-01 "`QU` is one card" | `R-01 deck has 52 cards …` (`QU` counted as one entry of `GOLDEN_LETTERS`) |
| R-02 "seeded PRNG; same seed → same deal on every device" | `R-02 golden deal: seeds 1 and 4294967295` (the literal is the cross-device coverage, AD-5); `R-02 same seed, same shuffle; different seeds differ` (the "different seeds differ" half is an extra check, not an R-02 sentence) |
| R-02 "PRNG and shuffle frozen once shipped; changing them bumps version" | exempt (versioning process, rule-coverage R-02) |
| R-02 "One golden-deal test pins a seed" | `R-02 golden deal: seeds 1 and 4294967295` |
| R-03 "round-robin … i-th card to column (i mod 8)+1 … first dealt is top, last is bottom" | `R-03 deals round-robin, first dealt is the column top` |
| R-03 "columns 1–4 hold 7 cards, columns 5–8 hold 6" | `R-03 columns 1–4 hold 7 cards, columns 5–8 hold 6`; `R-03 every card dealt once` |

### Build record

- Generation: a temporary `src/engine/golden-gen.test.ts` printed `JSON.stringify` of the three arrays through Vitest at `82d8553…`; deleted before commit, no generator or console call committed.
- Carryover §1 cross-check: counts of `GOLDEN_LETTERS` in order = `A3 B1 C2 D2 E4 F2 G1 H3 I3 J1 K1 L2 M2 N3 O3 P2 QU1 R3 S3 T3 U2 V1 W1 X1 Y1 Z1`, identical to carryover §1 line 11 (string compare true, 52 entries, alphabetical, `QU` in the Q slot). No mismatch.
- `npx biome check --write src/engine/deal.test.ts` reformatted the literals (one element per line for `GOLDEN_LETTERS`); golden test re-run green after; `grep -n console` empty.
- `-t "R-02 golden deal"`: `Tests 1 passed | 5 skipped (6)`.
- Mutation 5(a), `A: 3`/`B: 1` swapped in types.ts: `× R-02 golden deal`, failing at `src/engine/deal.test.ts:122:41` (the `toEqual`); diff has one hunk `@@ -1,11 +1,11 @@` inside `"letters"` only (seed1/seedMax unchanged; ids are positional). Reverted (`git checkout`).
- Mutation 5(b), `0x6d2b79f5` → `0x6d2b79f6` in deal.ts: same line 122:41; hunk `@@ -53,144 +53,144 @@` covers `"seed1"` and `"seedMax"` with changed entries, `"letters"` (lines 1–52) untouched. Reverted; `git diff --quiet src/engine/deal.ts src/engine/types.ts` exit 0.
- The four renames change titles only, plus the R-01 `GOLDEN_LETTERS` count check.
- Acceptance 3 (after commit `0386bbe56cb2e2b568ac0294100c3a24241dc8cc`): `git diff --name-only 82d85532a161ffeb3960dd4e2bcfb382c99d0495..HEAD -- . ':(exclude)_bmad-output'` printed exactly `src/engine/deal.test.ts`.
- `npm run test:all`: exit 0.

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 1 findings — high 0, medium 0, low 0, false 1, maybe-false 0
- findings:
  - `[false]` `[reject]` Acceptance 3 unmet: nothing committed yet, the name-only diff against B is empty and the plan only claims "no other files" — the commit is Finalize's job; after it (`0386bbe`) the command printed exactly `src/engine/deal.test.ts`, now recorded in the Build record in place of the claim.

## Auto Run Result

- **Change:** `src/engine/deal.test.ts` gains `GOLDEN_COLUMNS_SEED_1`, `GOLDEN_COLUMNS_SEED_MAX`, `GOLDEN_LETTERS` and `R-02 golden deal: seeds 1 and 4294967295`; the four scaffold tests carry R-01/R-02/R-03 titles; R-01 also checks deck counts against `GOLDEN_LETTERS`; new `R-03 deals round-robin, first dealt is the column top`.
- **Files:** `src/engine/deal.test.ts` (tests only); this plan.
- **Review (quick):** 1 finding, rejected as false (see triage log); no patches, nothing deferred.
- **Follow-up review recommended:** false (no patches: high 0, medium 0, low 0).
- **Verification:** see Build record: `-t` count 1, both mutations red on the expected keys and reverted, `grep console` empty, `npm run test:all` exit 0, Acceptance 3 name-only diff = `src/engine/deal.test.ts`.
- **Residual risks:** none known. AGENTS.md Known pitfalls' sentence on unnamed scaffold tests is now stale (ticket Notes: left for the bmad-project-context refresh or retro).

## Verification

**Commands:**
- `npx vitest run src/engine/deal.test.ts -t "R-02 golden deal"` -- expected: exactly 1 test passed, rest skipped
- Mutations 5(a) and 5(b), each applied then reverted -- expected: golden test red with the stated differing keys; `git diff src/engine/deal.ts src/engine/types.ts` empty after revert
- `grep -n console src/engine/deal.test.ts` -- expected: no output
- `npm run test:all` -- expected: green
- `git diff --name-only 82d85532a161ffeb3960dd4e2bcfb382c99d0495..HEAD -- . ':(exclude)_bmad-output'` -- expected: exactly `src/engine/deal.test.ts`
