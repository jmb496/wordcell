---
id: 13
type: story
title: "Statistics exclude negative given-up scores"
parent: epic-rules-engine
covers: [CAP-8]
after: [12]
risk: low
---

# Statistics exclude negative given-up scores

## Description

Applies owner decision D-STATS (R-84, Q-44; SPEC D4): statistics computes best score and average score over won records and gaveUp records with finalScore >= 0 only; excluded negative gaveUp records still count in gamesPlayed, gamesGivenUp and longestWord; when no record qualifies, bestScore and averageScore are absent. A record qualifies iff `outcome === 'won' || finalScore >= 0` (Q-44: every won record counts). The `statistics()` doc comment in `src/engine/history.ts` ("… negative scores included (Q-28)") is replaced by one citing R-84, Q-44 and D4 (best and average over qualifying records; counts and longest word over all records); the `Statistics` interface comments stay.

## Acceptance Criteria

Verify: npm run test:all is green. New tests are named `R-84 … (Q-44)`:

- won 100, gaveUp −50 whose record carries the strictly longest word: gamesPlayed 2, gamesGivenUp 1, averageScore 100, longestWord is the gaveUp record's word.
- [won 10, gaveUp 0] → averageScore 5; [gaveUp 0] alone → bestScore 0 and averageScore 0, both present.
- only negative gaveUp records: asserted with `toStrictEqual` to counts only (bestScore and averageScore keys omitted, not undefined); this also shows best-score exclusion.

Existing `statistics` tests in `src/engine/history.test.ts`:

- mixed history (won 200, won 400, gaveUp −50): inputs kept, averageScore 183 → 300.
- "all-negative history: negative best and negative average": replaced by the only-negative test above.
- "longestWord is absent" (won 10, gaveUp −10): inputs kept, averageScore 0 → 10.
- A-E3 rounding tests −5, −10 → −7; −7, −8, −8 → −8; 1 and −2 → 0: inputs and expectations kept, negative records built as synthetic `won` records (`statistics` is pure over records; `parseHistory` accepts any safe-integer finalScore), so the −x.5, round-to-nearest and −0 coverage (SPEC CAP-8, build-notes CAP-8) stays; `+ 0` and the "−0 normalised to 0" doc line stay.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-8 History
- rules — docs/game-flow-spec.md R-84, §9 Q-44
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-8 and D4
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, R-84 row
- code — src/engine/history.ts, src/engine/history.test.ts (files changed)

## Notes

- Open question: None.
