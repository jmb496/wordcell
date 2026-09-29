---
id: 3
type: story
title: "Session, createSession, replay and checkSession"
parent: epic-rules-engine
covers: [CAP-3]
after: [2]
risk: medium
---

# Session, createSession, replay and checkSession

## Description

A game becomes the §2 Session: createSession starts it, replay derives the position per each move's `reached`, and any AD-7 pre-/post-replay or per-move §2 violation throws a unique `EngineError` code. Entry 4 adds applyFrom, entry 8 the view counterpart.

- Modules (build-notes CAP-3): `src/engine/session.ts` (§2 types, `SESSION_VERSION = 1` (D5), `createSession`), `src/engine/replay.ts` (`Start`, `replay`, `replayFrom`, `checkSession`, `status`), and an internal `dealIds(seed)` in `deal.ts`; D1 `deal(seed)` (unchanged for `main.ts` and the e2e smoke, still `>>> 0`) is rebuilt over `dealIds`, which adds no seed check.
- `createSession(seed)` returns `{ version: SESSION_VERSION, seed, moves: [], cursor: { index: 0, phase: 'idle' }, gaveUp: false, activeMs: 0 }`.
- Internal signatures: `replay(session, lang)` over `dealIds(session.seed)` and empty cells, and `replayFrom(start, session, lang)`, both returning the committed-prefix Position (build-notes CAP-3); draft and redo tail touch only scratch positions. `checkSession(session)` runs exactly the AD-7 pre-replay checks; `replayFrom` validates the Start, calls `checkSession` before any move, and finally the post-replay gaveUp non-won check (`replay` wraps `replayFrom`). `Start.columns`/`cells` are fixed 8-tuples (a wrong count is a compile error). `status(session, position)`: gaveUp if the flag, else won when Idle and every column empty (Idle by construction: non-idle drafts on empty columns fail R-10/R-13 first; plan-named, no test), else playing. `lang` is `LangData` (letterCount for R-36/R-40), never a dictionary.
- Inputs: the `parseSession` schema stage (entry 10, build-notes CAP-9) owns required fields, plain objects, JSON types of fields AD-7 does not type, enums and AD-2 domains (columns, cells, CardIds, counts); replay adds no such check. Rejecting tests feed checkSession's typed checks (`seed`, `activeMs`, `gaveUp`, `cursor.index`, unknown fields) through a cast. Neither checks `version` (entry 10).
- Checks: the `activeMs` check is `Number.isSafeInteger` and ≥ 0 (build-notes Spine note). Optional-field presence is per `Object.hasOwn` (build-notes CAP-3). R-33's free-letter cell empty and duplicate are two codes; one code each: R-31's range (0..0 on an empty destination, else 1..n, n = destination size after removing S, R-21), `sourceCount` range (1..column size, R-10/R-13), cursor phase vs reached (missing draft included), `targetCell`/`placementOrder` presence; the §2 invariant is two (a non-committed move before `cursor.index`; a non-last element below committed). createSession and checkSession share one seed guard and code (e.g. `seed-uint32`). Codes are unique, kebab-case per `errors.ts` (e.g. `ad7-gave-up-idle`) and listed in its "Codes in use". Rule-coverage and build-notes code literals are illustrative (`§2.freeLetters-set` → `s2-free-letters-set`; entry 10 uses `schema-*`). Messages per build-notes CAP-3; tests assert only codes. Per-move validation is move-major (move i fully, then i+1; technical default).
- R-60 scope, covered here: position effects through replay and "the commit never touches later moves": replaying the redo-tail case's Session leaves the deep-frozen `moves` unchanged and still checks the tail. Replay never writes a cursor, so `cursor = {index + 1, idle}` and "Confirm first discards the redo data" are entry 5's (`confirm`).
- `src/engine/index.ts` gains `createSession`, `SESSION_VERSION` and every type `Session`'s public fields reference (`Session`, `Move`, `Cursor`, `Phase`, `Reached`, `DestinationSide`, `WordCellNumber`; §2 shape) and nothing else; `replay`, `replayFrom`, `Start`, `checkSession`, `status`, `dealIds`, the rule guards and `EngineError` stay internal (SPEC Constraints, AD-2). The `AD-2 index exports …` test (`src/engine/index.test.ts`) gets the new runtime list and a matching name.

## Acceptance Criteria

Verify: npm run test:all is green with R-04, R-52, R-74, R-60–R-62 and §2 replay tests passing (a committed word absent from any set still replays).

- The `R-02 golden deal` test is green before and after the first `deal.ts` edit; its literals stay byte-identical, the only edit its CardId-half call repointed to `dealIds(seed)` (AGENTS.md Policy).
- createSession, the `R-04 …` test: the result `toStrictEqual` the literal above, and `replay(createSession(s), EN)` has eight empty cells and `status` playing. `R-74 …`: seeds 0 and 4294967295 `toStrictEqual` it with that seed; -1, 4294967296, 1.5, NaN and Infinity throw the shared seed code.
- One rejecting case per violable check, asserting its `EngineError` code: every AD-7 pre-replay check (`checkSession`; unknown fields: one code per object kind) and per-move check ("Validation order"; list = CAP-9 "Replay fixtures") in build-notes CAP-3, the post-replay gaveUp check, both §2 invariant codes, and each D2 seam throw (duplicate id anywhere in the Start, out-of-range id via the CardId domain guard (`card-id-domain`, one code), no column card). `activeMs` rejecting cases: -1 and 2^53.
- The R-31 rejecting case: a self-drop with `destinationCount` = the column size before removing S (R-21 folded in).
- Accepting cases for permit-only rules (CAP-9 list): R-11 whole-column tail; R-20 a committed self-drop with k ≥ 1 (its R-60 test asserts the column loses S, then D, R-21); R-22 empty destination with k = 0; R-30 a committed `destinationSide: 'right'` word; R-34 an arrangement interleaving S and F, two free letters in `freeLetters` reversed from `arrangement` (D8); R-41 target equal to a free letter's source cell. R-12 holds by construction (source is a column); a D card in `arrangement` fails the §2 set check, so R-32 needs no test; both plan-named.
- Redo tail (CAP-3, Q-41): accepting `§2` case with Place cursor (Q-41: Undo from Idle pushed the pending draft to the tail), a committed-reached draft at `cursor.index`, then a redo tail using a free letter only that draft exposes (its target's new top), whose last element is below committed (e.g. Composing-reached breaking R-36); rejecting `§2` case whose only violation is a redo-tail `sourceCount` legal on the committed prefix but not after the draft commits.
- Committed prefix (§4 preamble): replaying a Session with a Place-reached draft, an Idle pending draft, and a redo tail, deep-equals replaying the same seed with `moves.slice(0, cursor.index)` and cursor `{ index, phase: 'idle' }`.
- Cases are inline Sessions minimally changed from a valid one so their check is the first violation; `fixtures/*.json` and `parseSession` → `replay-failed` assertions are entry 10's.
- An Idle-pending Composing-reached 2-letter draft replays; counter case: cursor phase composing with a Place-reached 2-letter draft (redo data (a)) throws the R-36 code, proving checks follow `reached`, not `cursor.phase`.
- QU boundary via the seam: a committed-reached word of one S card plus QU as D (k = 1) replays at targetCell 3 and throws the R-40 code at 4. Upper: a committed 9-card word containing QU (10 letters) accepts targetCell 10; swapping QU for a plain card throws it.
- R-52: a committed move targeting a used free letter's source cell: the old top leaves, `placementOrder` is pushed, its last card becomes the new top (the next free letter). The R-41 accepting case's Session: its move also takes a second free letter from a non-target cell and has destination ≠ source, k ≥ 1, `destinationSide: 'right'` and `placementOrder` not in word order: the `§2` test asserts it replays, the R-52 test the new top, the R-60 test that source and destination lose S and D, the non-target cell loses its free letter, the target ends as its old cards minus the used top, then `placementOrder`.
- R-61, through replay: a committed move using free letters from non-target cells, one from a two-card cell (its next card becomes the top, usable by the next committed move) and one from a single-card cell (it ends empty); and a move whose `freeLetters` lists cell c twice, `arrangement` holding c's top and next card, throws the R-33 duplicate code.
- §2 status: gaveUp flag on a non-won position; playing on a committed-move Session (e.g. R-52's); won: the `R-62 …` test.
- One won test, `R-62 …` (also the post-replay gaveUp case): a seam start with a few column cards (D2 throws on none), all cleared by structurally valid committed moves (e.g. whole-column k = 0 self-drops of 3+ letters; no dictionary). Public won cases wait for entry 6's helper.
- replay, replayFrom and checkSession tests deep-freeze their Session, Start and `LangData`.
- Test ids: `R-02 golden deal` keeps its name; new R-id names only the R-04, R-52, R-60–R-62 and R-74 sentence tests; replay-check rejecting and accepting cases, per-move replay cases, and the QU boundary are `§2 …` (rule-coverage §2 rows), plus an `R-61 …` twin of the R-33 duplicate case; D2 seam throws are `AD-2 …` (no R-/§-id applies).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-3, D1, D2, D5, Constraints
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-3 Session and replay, CAP-9 "Replay fixtures", Spine note
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, §2 rows and R-04, R-52, R-60–R-62, R-74 rows
- spine — ARCHITECTURE-SPINE.md AD-2, AD-5, AD-7
- rules — docs/game-flow-spec.md §2, R-04, R-52, R-60–R-62, R-74

## Notes

- Decision (technical default): per-move rule checks are pure guard functions in an internal module (e.g. `src/engine/rules.ts`) throwing coded `EngineError`; replay and entries 4, 5 and 8 use them.
- Decision (technical default): `replayFrom(start, session, lang)` deviates from build-notes' `replayFrom(start, moves)`: it needs the cursor and `lang`.
- Hand-off (tickets.toml entry 6 and R-60's coverage row lack CAP-5): this ticket covers R-60 "the commit never touches later moves" via replay; entry 6 must add the Redo path and "Redo performs the commit without discarding" to its verify line.
