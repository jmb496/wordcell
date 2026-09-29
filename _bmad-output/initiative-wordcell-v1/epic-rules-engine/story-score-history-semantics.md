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

- Signatures (AD-6): `gameRecord(session, lang): GameRecord | null`, `reconcileHistory(records, before, after, lang)`, `isRecorded(records, session, lang)`, `statistics(records)`. `GameRecord`, `Statistics` and their nested `longestWord` fields are readonly (AD-2), like view.ts's types. Records are `readonly GameRecord[]`; an append returns a new array; no argument is mutated.
- Version: this ticket defines `HISTORY_VERSION = 1` (SPEC D5) in history.ts; entry 11 (serialize/parse) only uses it. In history.ts and history.test.ts arrays are named `records`, never `history` (AGENTS.md Known pitfalls; the AD-1 scan covers engine tests).
- gameRecord: keys in AD-6 order `{ version, seed, outcome, finalScore, longestWord?, activeMs }`, `longestWord` omitted (never undefined) with no committed word. Built from the same one `replayWords` pass (src/engine/replay.ts, committed prefix `moves.slice(0, cursor.index)` only), scoring's `finalScore` and `longestWord` (src/engine/view.ts) that view uses, so it agrees with view; `activeMs` copied from the Session (R-76).
- Match: removal and isRecorded look only at the last record and compare its `seed`, `outcome` and `activeMs` with `gameRecord(before)` / `gameRecord(session)`; `finalScore` and `longestWord` are never compared (Q-43). Detection (AD-6, build-notes CAP-8): append when status(before) = playing and status(after) ≠ playing; remove (subject to the match) when status(before) ≠ playing and status(after) = playing; otherwise same reference.
- Statistics (build-notes CAP-8, D4): `gamesPlayed` (= `records.length`), `gamesWon`, `gamesGivenUp` (counts by outcome) always present; `bestScore?` (highest finalScore), `averageScore?`, `longestWord?: { spelling, letterCount }` (view's `LongestWord` shape, as stored) optional; the other five are numbers; on an empty history the counts are 0 and bestScore, averageScore and longestWord are absent (never null or 0). Best and average cover all records, won and gaveUp, negative included; average = `Math.round(sum / n) + 0` (A-E3, half toward +∞; `+ 0` normalises −0); longest-word ties → the earliest record (lowest index, append order).
- Exports: src/engine/index.ts exports `gameRecord`, `reconcileHistory`, `isRecorded`, `statistics`, `HISTORY_VERSION` and `type GameRecord`, `type Statistics`; index.test.ts extends the AD-2 exact runtime export list and test name (as ticket 2.8 did for view).
- Touches: new history.ts and history.test.ts; index.ts, index.test.ts. Reuses view.ts `longestWord`, scoring.ts `finalScore`, replay.ts `replayWords`/`dealtStart`/`status`; no new logic in those files.

## Acceptance Criteria

- Verify: npm run test:all is green with the tests below in src/engine/history.test.ts. Names: statistics and rounding tests start `R-84` (A-E3 in the text), match tests `R-84 … (Q-43)`, the same-seed test `R-74`, the activeMs tests `R-76` (one per outcome × 0/non-zero); the no-mutation/new-array tests and the key-order test `AD-6`; all remaining history.test.ts tests `R-84`; the export test stays in index.test.ts as `AD-2`.
- Construction: won Sessions from `winSeed` (src/engine/win-seed.ts, activeMs 0); the won before/after pair is before = `apply(winSeed(seed), undo)` (Place, playing), after = `apply(before, redo)`; gaveUp through public `apply` giveUp; accrue is a no-op once finished, so non-zero activeMs comes from `accrue` while playing (see R-76); mismatch records may be hand-built literals. Inputs are deep-frozen via a local `deepFreeze` copy in history.test.ts, as the other engine test files do. Seeds via `dealIds()`: the qu case needs QU in a 7-card column (1–4), the tie case QU in columns 5–8 (column 1's word expected).
- gameRecord: null while playing; key order checked with `expect(Object.keys(record)).toEqual(['version','seed','outcome','finalScore','longestWord','activeMs'])` (without `'longestWord'` for a record with no word), values and the absent (not undefined) key with toStrictEqual, one of them with the literal `version: 1`; a gaveUp record's finalScore is after R-81 (negative allowed) and equals `view(session).finalScore`; longestWord key absent with no committed word; spelling lowercase with QU as "qu"; the won qu and tie records' finalScore and longestWord equal `view(session)`'s; a pending draft at reached = committed: commit a 6-card column (5–8) with no QU, then commit and undo back to Idle a 7-card column (1–4) whose word is strictly longer, then giveUp; finalScore and longestWord equal view's and differ from `gameRecord` of the same game given up right after that second confirm (before the undos); ties: two equal-length committed words keep the earliest.
- R-76: activeMs copied from the Session for each outcome, with 0 and with a non-zero value: won 0 from `winSeed`; won non-zero via `winSeed(seed)` → apply undo (back to Place, playing) → `accrue` → apply redo (re-finishes); gaveUp 0 via apply giveUp with no accrue; gaveUp non-zero via `accrue` before apply giveUp.
- R-74: two finished Sessions with the same seed (the first a gaveUp, the second won) both append; un-finishing the second removes only the last record, and the remaining record equals the first.
- reconcileHistory: append on finish (new array) onto a non-empty deep-frozen history, earlier records unchanged; one removal test per outcome: a won finish un-finished via apply undo (R-70) and a gaveUp finish un-finished via undo (R-75, flag cleared, cursor unmoved); same reference for playing→playing, finished→finished, an un-finish on an empty history, an un-finish where only seed, only outcome or only activeMs differs (one test each), and where an earlier record matches but the last does not. At most once: finish → un-finish → finish leaves exactly one record, for won and for gaveUp.
- isRecorded: true when the last record matches; false while playing, on an empty history, for each single-field mismatch (one test each), and when only a non-last record matches.
- Q-43: a last record equal to `gameRecord(before)` in seed/outcome/activeMs but differing in finalScore and longestWord is removed by reconcileHistory, and isRecorded is true for it.
- statistics: never replayed: takes only records (no Session, no lang) and returns values from hand-written GameRecord literals unchanged, asserted with toEqual (statistics may return the stored longestWord object or a copy); empty history: counts 0, optional keys absent; a mixed history (e.g. 2 won, 1 gaveUp) asserts all six values with toStrictEqual, its best score neither first nor last; best is a gaveUp record in one history; a negative average in another, all records negative so bestScore is negative; rounding: 5 and 10 → 8, −5 and −10 → −7, −7, −8, −8 → −8 (rules out Math.ceil), 1 and −2 → 0 (not −0); an earlier record with a shorter longestWord, then a later record with strictly higher letterCount: the later wins; a cross-record longest-word tie (equal letterCount, different spellings) keeps the lowest index; longestWord absent when no record has one.

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
- Hand-off: this ticket's build also updates tickets.toml entry 11's description to drop "HISTORY_VERSION = 1" (SPEC D5 fixes the value; this ticket owns the constant); entry 11 only uses it.
- Hand-off: reconcileHistory assumes `after` derives from `before` by one apply; per AD-4 the shell never calls it for New game or Replay.
