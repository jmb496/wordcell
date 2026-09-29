---
id: 9
type: story
title: "Score history semantics"
parent: epic-rules-engine
covers: [CAP-8]
after: [8]
risk: medium
---

# Score history semantics

## Description

Adds src/engine/history.ts: gameRecord, reconcileHistory, isRecorded and the six v1 statistics per AD-6, R-76's record part and R-84, including the empty-history, mismatch and A-E3 rounding cases.

- Signatures (AD-6): `gameRecord(session, lang): GameRecord | null`, `reconcileHistory(records, before, after, lang)`, `isRecorded(records, session, lang)`, `statistics(records)`. Records are `readonly GameRecord[]`; an append returns a new array; no argument is mutated.
- Version: this ticket defines `HISTORY_VERSION = 1` (SPEC D5) in history.ts; entry 11 (serialize/parse) only uses it.
- gameRecord: keys in AD-6 order `{ version, seed, outcome, finalScore, longestWord?, activeMs }`, `longestWord` omitted (never undefined) with no committed word. Built from the same one `replayWords` pass (src/engine/replay.ts, committed prefix `moves.slice(0, cursor.index)` only), scoring's `finalScore` and `longestWord` (src/engine/view.ts) that view uses, so it agrees with view; `activeMs` copied from the Session (R-76).
- Match: removal and isRecorded look only at the last record and compare its `seed`, `outcome` and `activeMs` with `gameRecord(before)` / `gameRecord(session)`; `finalScore` and `longestWord` are never compared (Q-43).
- Statistics (build-notes CAP-8, D4): `gamesPlayed`, `gamesWon`, `gamesGivenUp` always present; `bestScore?`, `averageScore?`, `longestWord?` optional, keys absent (never null or 0) on an empty history. Best and average cover all records, won and gaveUp, negative included; average = `Math.round(sum / n)` (A-E3, half toward +∞); longest-word ties → the earliest record (lowest index, append order).
- Exports: src/engine/index.ts exports `gameRecord`, `reconcileHistory`, `isRecorded`, `statistics`, `HISTORY_VERSION` and `type GameRecord`, `type Statistics`; index.test.ts extends the AD-2 exact runtime export list and test name (as ticket 2.8 did for view).
- Touches: new history.ts and history.test.ts; index.ts, index.test.ts (plus any internal export needed from view.ts).

## Acceptance Criteria

- Verify: npm run test:all is green with the tests below in src/engine/history.test.ts. Names: statistics and rounding tests start `R-84` (A-E3 in the text), match tests `R-84 … (Q-43)`, the same-seed test `R-74`, the activeMs test `R-76`.
- Construction: won Sessions from `winSeed` (src/engine/win-seed.ts, activeMs 0); gaveUp through public `apply` giveUp; non-zero activeMs via `accrue` before the finishing command (accrue is a no-op once finished); mismatch records may be hand-built literals. Inputs are deep-frozen.
- gameRecord: null while playing; keys in AD-6 order, checked with toStrictEqual; a gaveUp record's finalScore is after R-81 (negative allowed) and equals `view(session).finalScore`; longestWord key absent with no committed word; spelling lowercase with QU as "qu"; a gaveUp Session with an Idle pending draft (redo tail) gives finalScore and longestWord equal to view's, excluding the uncommitted word; ties: two equal-length committed words keep the earliest.
- R-76: activeMs copied from the Session for a won and a gaveUp finish, 0 included.
- R-74: two finished Sessions with the same seed both append; un-finishing the second removes only the last record, the first stays.
- reconcileHistory: append on finish (new array); same reference for playing→playing, finished→finished, an un-finish on an empty history, an un-finish where only seed, only outcome or only activeMs differs (one test each), and where an earlier record matches but the last does not. At most once: finish → un-finish → finish leaves exactly one record.
- isRecorded: true when the last record matches; false while playing, on an empty history, for each single-field mismatch (one test each), and when only a non-last record matches.
- Q-43: a last record equal to `gameRecord(before)` in seed/outcome/activeMs but differing in finalScore and longestWord is removed by reconcileHistory, and isRecorded is true for it.
- statistics: never replayed: takes only records (no Session, no lang) and returns values from hand-written GameRecord literals unchanged; empty history: counts 0, optional keys absent; best is a gaveUp record in one history; a negative average in another; rounding: 5 and 10 → 8, −5 and −10 → −7, −7, −8, −8 → −8 (rules out Math.ceil); a cross-record longest-word tie (equal letterCount, different spellings) keeps the lowest index; longestWord absent when no record has one.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-8, D4, D5
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, § CAP-8 History
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, rows R-74, R-76, R-84
- spine — ARCHITECTURE-SPINE.md, AD-2, AD-6, AD-7 (HISTORY_VERSION bump rule)
- rules — docs/game-flow-spec.md, R-74, R-76, R-84, Q-43
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, A-E3
- code — src/engine/view.ts `longestWord`, src/engine/win-seed.ts `winSeed`
- hand-off — story-gameview-plan.md

## Notes

- Open question: None.
