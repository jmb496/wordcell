---
id: 1
type: story
title: "Golden deal test and R-id test names"
parent: epic-rules-engine
covers: [CAP-1]
after: [1.10]
risk: low
---

# Golden deal test and R-id test names

## Description

Test-only first code commit of the epic: adds `it('R-02 golden deal: seeds 1 and 4294967295')` to src/engine/deal.test.ts, asserting `deal(seed).map((col) => col.map((c) => c.id))` for each seed and `buildDeck().map((c) => c.letter)` against literal arrays generated once from HEAD's deal.ts, never computed in the test (build-notes.md § CAP-1 Golden deal). The three literals are named top-level `const`s (`GOLDEN_COLUMNS_SEED_1`, `GOLDEN_COLUMNS_SEED_MAX`, `GOLDEN_LETTERS`); the test makes one `toEqual` of `{ seed1, seedMax, letters }` (the three calls) against `{ seed1: GOLDEN_COLUMNS_SEED_1, seedMax: GOLDEN_COLUMNS_SEED_MAX, letters: GOLDEN_LETTERS }`, so one failure diff shows every differing part and a repoint edits only call lines. The literals come from an uncommitted one-off: by default a temporary `it` printing `JSON.stringify` of the three arrays through Vitest, removed before commit; no generator, snapshot file or console call is committed. Then `npx biome format --write src/engine/deal.test.ts` formats the file before commit so the literals stay byte-identical afterwards. The letter literal is 52 uppercase strings, alphabetical, `'QU'` one entry in the Q slot; cross-check its counts against docs/requirements-carryover.md §1 before pasting (the R-01 scaffold test compares only against ENGLISH_DISTRIBUTION itself); on any mismatch, stop and report to the owner without editing types.ts or the literal (AGENTS.md Policy). Later tickets only repoint the calls (CAP-2 the letter half to `EN.letters`, CAP-3 the CardId deal); the literals stay byte-identical and the only copy (SPEC CAP-1).

Renames the four scaffold tests: `has 52 cards matching the English distribution` → `R-01 deck has 52 cards matching the English distribution`; `shuffles deterministically for a given seed` → `R-02 same seed, same shuffle; different seeds differ`; `gives columns 1–4 seven cards and columns 5–8 six cards` → `R-03 columns 1–4 hold 7 cards, columns 5–8 hold 6`; `uses every card exactly once` → `R-03 every card dealt once`. Adds one R-03 case, `it('R-03 deals round-robin, first dealt is the column top')`, asserting for seed 1 that `deal(1)[i % 8][Math.floor(i / 8)].id === shuffle(buildDeck(), 1)[i].id` for every i in 0..51 (rule-coverage.md R-03). No src/engine source changes.

## Acceptance Criteria

Verify:

1. Before generating, `git diff --quiet 785c0f6 HEAD -- src/engine/deal.ts src/engine/types.ts` succeeds (AGENTS.md Policy); the plan records the command, its exit code 0 and the HEAD sha at generation time.
2. `npm run test:all` is green.
3. The build changes no file outside `_bmad-output/` other than src/engine/deal.test.ts: `git diff --name-only <B>..HEAD -- . ':(exclude)_bmad-output'` lists exactly `src/engine/deal.test.ts` (non-empty), where B is the commit before the build's first commit, recorded in the plan; no src/engine source change (SPEC CAP-1).
4. Every `it` title in deal.test.ts starts with an R-id; both `describe('deck')` and `describe('deal')` blocks stay, and the golden and R-03 round-robin tests go in `describe('deal')`; `npx vitest run src/engine/deal.test.ts -t "R-02 golden deal"` reports exactly one test run (a non-matching `-t` exits 0 with all tests skipped, so check the count, not the exit code).
5. Each mutation, applied temporarily, turns the R-02 golden deal test red: (a) swap the key order of `A: 3` and `B: 1` in ENGLISH_DISTRIBUTION (types.ts) → the failure diff shows only `letters` differing; (b) change mulberry32's `0x6d2b79f5` (deal.ts) → the diff shows both `seed1` and `seedMax` differing. Each is reverted, never committed; the plan records each mutation's failing R-02 output and a clean `git diff src/engine/deal.ts src/engine/types.ts` after reverting.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md — CAP-1, Constraints
- _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md — § Scaffold facts that bite, § CAP-1 Golden deal
- _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md — R-01–R-03 rows
- _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md — AD-5
- AGENTS.md — Policy

## Notes

- Open question: None expected; deal.ts and types.ts are byte-identical to 785c0f6 (verified 2026-09-28).
- AGENTS.md Known pitfalls' sentence on the unnamed scaffold tests in deal.test.ts goes stale with this ticket; left for the bmad-project-context refresh or the epic retro, not edited here.
