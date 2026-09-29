---
id: 8
type: story
title: "GameView"
parent: epic-rules-engine
covers: [CAP-7]
after: [6, 7]
risk: medium
---

# GameView

## Description

Adds view(session, lang) building every AD-3 field from one replay: faces, columns, WordCells, per-column and per-cell flags from the guards apply uses, kIfTapped, draft and Place data with the D6 score delta, live and display score, end values, word count and the internal longest-word function (reused by entry 9), pending-draft word and inProgress, the view counterpart of the D2 seam, and the R-12, R-31 and R-33 flag and kIfTapped tests entry 4 leaves (canPickUp, canIncK/canDecK at bounds, canAddFreeLetter on used or empty cells, S cards of a self-drop absent).

- Flags: view replays once and computes every flag from boolean predicates extracted into rules.ts (e.g. tap mapping, set-count allowed, legal targets, undo/redo availability). The rules.ts check* functions and the commands.ts reducers become `if (!pred) reject(...)` wrappers over them; check codes and messages unchanged. view never calls apply/applyFrom and never catches EngineError; only tests call apply. The commands.test.ts command table stays green unchanged.
- Shape: GameView is plain data (no functions or closures; kIfTapped a ReadonlyMap per AD-3), with AD-3 names (camelCase where AD-3 uses prose): status, phase, faces, liveScore, displayScore, finalScore, penalty, lettersLeft, band, longestWord, wordCount, pendingDraftWord, inProgress, canUndo, canRedo, canGiveUp, canValidate, canConfirm, canFlip, canDecK, canIncK. Nested shapes (field names AD-3 does not give are the default; card order per AD-3: columns `cards` top→bottom, cells `cards` bottom→top):
  - `faces: readonly { letter; letterCount }[]` (index = CardId)
  - `columns: readonly { column: 1–8; cards; canPickUp; canDropOn; canTapForK; kIfTapped? }[]`
  - `cells: readonly { cell: 3–10; cards; used; canAddFreeLetter; canSetTarget; isLegalTarget }[]`
  - `draft?: { sourceColumn: 1–8; source: readonly CardId[] (S, top→bottom); destinationColumn: 1–8; destination: readonly CardId[] (D, top→bottom, empty at k = 0); k; side; arrangement; freeLetters: readonly WordCellNumber[] (Move order); word; letterCount; structural: { ok: true } | { ok: false; reason: 'too-short' } }` (D7)
  - `place?: { legalTargets; target; placementOrder; scoreDelta }`, legalTargets in ascending cell number (default).
- Longest word: internal `longestWord(start, session, lang)` (CAP-8 passes the dealt start; viewFrom the D2 start) reading `moves.slice(0, cursor.index)`, shaped `{ spelling, letterCount }` per AD-6. The single replay pass collects each committed move's word (spelling = rules.word of the move from the position before it, R-37 tray order, not placementOrder); wordCount, longestWord and view all use it, no second replay.
- Exports: src/engine/index.ts exports `view` and `type GameView` (plus the nested types it needs); index.test.ts adds 'view' to the AD-2 export test and its name. The D2 counterpart (e.g. `viewFrom(start, session, lang)`) and `longestWord` stay internal.
- Touches: new view.ts and view.test.ts; rules.ts, commands.ts, replay.ts (word collector, if it lives there), index.ts, index.test.ts.

## Acceptance Criteria

- Verify: npm run test:all is green with one test per AD-3 field (named with its R-id, else §/Q-id, else AD-3 per AGENTS.md; flags behind R-39 inertness are named AD-3 per rule-coverage; score tests are named with the R-id they derive, R-80 for liveScore, R-81 for displayScore and end values; never R-39 or R-82; flag tests default to one test per flag, named with its id, looping over the listed states), every can* flag agreeing with its mapped command in the build-notes CAP-7 list (outcomes per the commands.test.ts table) in both directions, and the D6 delta equal to the live-score change of the commit, QU free letter included.
- Rule coverage: the plan's sentence → test mapping covers R-12 (`cells` entries carry no pick-up flag; only `columns` entries carry canPickUp; the canPickUp agreement test itself is named AD-3), R-30 (draft word string via view on both sides; a right-side D holding QU spells "qu"), R-31, R-33, R-36 (reason too-short; QU case: 2 cards with letter count 3 passes, 2 letters fails), R-83 (longest word absent with no word) and §2 (status, inProgress).
- Flag agreement states: fresh Idle; Idle with a pending draft; Idle with an empty column after a committed move (canPickUp false there); Composing on a non-empty destination (k = 1, middle, n); Composing on a one-card destination (n = 1: kIfTapped {card → null}; canTapForK, canDecK, canIncK false; canFlip true; D2 seam if no seed deals it); Composing with k = 0 (both: whole-column self-drop and drop onto an empty column); Composing after a partial self-drop (non-empty remainder; S cards absent from kIfTapped); Composing with a used free letter, an empty cell and a non-empty unused cell (canAddFreeLetter true); Composing reached by undo from Place (reached = place, canRedo true); Place with a used free letter whose cell is ≤ L (R-41); Place reached by undo from Idle (reached = committed, canRedo true); won; gaveUp at index 0 and at index > 0 (R-75). In each, every can* flag for every column 1–8 and cell 3–10 (and every source/destination candidate for existential flags) equals "apply (applyFrom for seam-built states) neither throws nor returns the input reference", per build-notes CAP-7 (canValidate per its structural rule there; used and isLegalTarget per their definitions there, covered under boundary cases). States are built through public apply where possible, else the D2 seam.
- R-31 kIfTapped: for every card of the destination column at k = 1, a middle k and n (n = 1 included), both sides, kIfTapped.get(card) equals the destinationCount apply(tapDestinationCard) produces, or null exactly when apply returns the input reference; cards absent from the map (incl. S cards of a self-drop) make tapDestinationCard throw. kIfTapped exists only on the destination column's entry in Composing, absent on every other column and in every other phase.
- R-31 empty destination (k = 0): canDecK, canIncK, canFlip and canTapForK false; kIfTapped an empty map.
- CAP-3: view throws EngineError with the same check code as replay for at least one replay-invalid Session (e.g. an R-31 k-range violation, `r31-destination-count`).
- AD-3: view(s) toStrictEqual view(structuredClone(s)), run on a deep-frozen Session and LangData (no argument mutated).
- Columns and WordCells are replay's committed-prefix position in every phase (S stays in its source column during Composing); one test.
- End values: every won case uses `winSeed` (src/engine/win-seed.ts, CAP-5). finalScore, penalty, lettersLeft and band are absent while playing (including after undo from won) and present for won and gaveUp; displayScore = liveScore while playing, the final score otherwise. When not playing, finalScore and displayScore equal scoring's `finalScore(position, status === 'gaveUp', lang)` (hand-off, story-scoring-penalty-and-bands-plan.md).
- inProgress: fresh false; undo to index 0 leaving a pending draft true; won and gaveUp false.
- D6: the delta tests include a QU free letter, a target equal to a free letter's source cell (R-41; EXPERIENCE A-E14 BALKED on cell 6 previews +30) and a delta ≤ 0; each equals the liveScore change after confirm.
- Place legal targets: L = 3 gives only cell 3; L ≥ 10 gives all of 3–10.
- Build-notes CAP-7 boundary cases: one D2-seam longest-word test (viewFrom from a non-dealt start); committed redo tail excluded from word count and longest word; longest-word ties to the earliest (incl. a QU word vs a plain word of equal letterCount); isLegalTarget and used tested in all three phases; draft present iff phase ≠ Idle and Place data iff phase = Place; every word string lowercase with QU → "qu"; in each canValidate false state validate throws the expected check code; pending-draft word present only while playing and Idle (absent after give up with a pending draft); pendingDraftWord and used false in Idle tested for both pending-draft kinds: an undone Composing draft with a free letter, and a committed move reached by undo Idle → Place → Composing → Idle.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-7, D6, D7
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-7 GameView
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, rows with CAP 7

## Notes

- Open question: None.
