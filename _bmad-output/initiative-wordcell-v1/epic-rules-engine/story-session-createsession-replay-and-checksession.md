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

Adds the §2 Session types, createSession (R-74 engine part: throws on a non-uint32 seed, holds the seed given), the internal CardId deal (the golden test's CardId half repointed to it), the D2 seam's Start type with its validation throws and replayFrom (entry 4 adds applyFrom, entry 8 the view counterpart), replay taking no dictionary with per-reached validation in the build-notes order, checkSession for the AD-7 checks, R-60 commit, R-52/R-61 exposure and status derivation (R-62), so a Session breaking any §2 invariant or rule at its reached throws while a Composing-reached 2-letter draft replays.

- Modules (build-notes CAP-3): `src/engine/session.ts` (§2 types, `SESSION_VERSION = 1` (D5), `createSession`), `src/engine/replay.ts` (`Start`, `replay`, `replayFrom`, `checkSession`, `status`), and an internal `dealIds(seed)` in `deal.ts`; D1 `deal(seed)` is rebuilt over `dealIds`, so `main.ts` and the e2e smoke are unchanged.
- `createSession(seed)` returns `{ version: SESSION_VERSION, seed, moves: [], cursor: { index: 0, phase: 'idle' }, gaveUp: false, activeMs: 0 }`.
- Internal signatures: `replay(session, lang)` over `dealIds(session.seed)` and empty cells, and `replayFrom(start, session, lang)`, both returning the committed-prefix Position (build-notes CAP-3 shape); the draft and redo tail are applied only to scratch positions for checking. `checkSession(session)` runs only the AD-7 pre-replay checks; `replayFrom` calls it, then after deriving the position runs the post-replay gaveUp non-won check (`replay` wraps `replayFrom`). `Start.columns` and `Start.cells` are fixed-length 8-tuples, so a wrong count is a compile error, not a runtime throw. `status(session, position)`: gaveUp if the flag, else won when Idle and every column empty, else playing. `lang` is `LangData` (letterCount for R-36/R-40), never a dictionary.
- Inputs: the `parseSession` schema stage (entry 10, build-notes CAP-9) owns required fields, plain objects, JSON types of fields AD-7 does not type, enums and AD-2 domains (columns, cells, CardIds, counts); replay adds no such check. checkSession owns the AD-7 checks (`seed` uint32, `activeMs`, `gaveUp` boolean, `cursor.index` range, unknown fields); their rejecting tests feed such values through a cast. Neither checks `version` (`parseSession`, entry 10).
- Checks: the `activeMs` check is `Number.isSafeInteger` and ≥ 0 (build-notes Spine note). Optional-field presence is per `Object.hasOwn` (build-notes CAP-3). R-33's free-letter cell empty and duplicate are two codes; R-31's range (0..0 on an empty destination, else 1..n) is one code; `targetCell`/`placementOrder` presence is one code; the §2 invariant is two (a non-committed move before `cursor.index`; a non-last element below committed). createSession's seed throw and checkSession's seed check share one guard and one code (e.g. `seed-uint32`). Codes keep `errors.ts`'s kebab-case scheme (e.g. `ad7-gave-up-idle`) and extend its "Codes in use" list; uniqueness is the requirement. Code literals in rule-coverage and build-notes are illustrative and map to kebab-case (`§2.freeLetters-set` → `s2-free-letters-set`; entry 10 uses `schema-*`). Per-move messages name the move index and rule id, AD-7 messages carry the AD-7 wording (build-notes CAP-3); tests assert only the code.
- R-60 scope: this ticket covers the position effects through replay (S, D and the free letters leave; `placementOrder` is pushed onto the target). Replay never writes a cursor, so `cursor = {index + 1, idle}` and "the commit never touches later moves" are entry 5's (`confirm`) and entry 6's (`redo`), as are "Confirm first discards the redo data" (entry 5) and "Redo performs the commit without discarding" (entry 6).
- `src/engine/index.ts` gains `createSession`, `SESSION_VERSION` and every type `Session`'s public fields reference (`Session`, `Move`, `Cursor`, `Phase`, `Reached`, `DestinationSide`, `WordCellNumber`; §2 shape) and nothing else; `replay`, `replayFrom`, `Start`, `checkSession`, `status`, `dealIds`, the rule guards and `EngineError` stay internal (SPEC Constraints, AD-2). The `AD-2 index exports …` test in `src/engine/index.test.ts` is updated to the new runtime list.

## Acceptance Criteria

Verify: npm run test:all is green with R-04, R-52, R-74, R-60–R-62 and §2 replay tests passing (a committed word absent from any set still replays), including one rejecting case per violable check asserting its unique code, the accepting cases for permit-only rules, and deep-frozen inputs.

- The `R-02 golden deal` test runs green before the first edit to `deal.ts` and after; its literals stay byte-identical, the only edit its CardId-half call repointed to `dealIds(seed)` (AGENTS.md Policy).
- createSession: the result matches the literal above with `toStrictEqual`. R-74 seeds 0 and 4294967295 are accepted and held; -1, 4294967296, 1.5, NaN and Infinity throw `EngineError` with the shared seed code.
- Violable checks, one rejecting case each asserting `EngineError` and its code: every AD-7 pre-replay check in build-notes CAP-3 `checkSession` (unknown fields: one code per object kind), every per-move check in build-notes CAP-3 "Validation order" (list = build-notes CAP-9 "Replay fixtures"), the post-replay gaveUp check, both §2 invariant codes, and each D2 seam throw (duplicate id, out-of-range id, no column card); the seed code is asserted in the checkSession and createSession tests. `activeMs` rejecting cases: -1 and 2^53.
- Accepting cases for permit-only rules (CAP-9 list): R-11 whole-column tail; R-20 self-drop; R-22 empty destination with k = 0; R-30 a committed `destinationSide: 'right'` word; R-34 an arrangement interleaving S and F; R-41 target equal to a free letter's source cell. R-12 and R-32 cannot be expressed by any Move field (source is a column; D is never in `arrangement`): covered by construction, named in the plan, no separate test.
- Redo tail (CAP-3, Q-41): accepting `§2` case with Idle cursor, a committed pending draft at `cursor.index`, then a redo tail whose last element is below committed (e.g. Composing-reached breaking R-36); rejecting `§2` case whose only violation is in a redo-tail move (e.g. R-40), checked from the scratch position it would start from.
- Committed prefix (§4 preamble): replaying a Session with a Place-reached draft, and one with a redo tail, returns a position deep-equal to replaying `moves.slice(0, cursor.index)` alone.
- These cases are inline hand-built Sessions, each the fewest field changes from a valid one that make its check the first violation; the `fixtures/*.json` files and `parseSession` → `replay-failed` assertions are entry 10's.
- Composing-reached 2-letter draft replays; counter case: cursor phase composing with a Place-reached 2-letter draft (redo data (a)) throws the R-36 code, proving checks follow `reached`, not `cursor.phase`.
- QU boundary via the seam: a Place- or committed-reached 2-card word containing QU replays (letter count 3, R-36) with targetCell 3; the same word with targetCell 4 throws the R-40 code. Upper: a committed 9-card word containing QU (10 letters) accepts targetCell 10; with a plain card instead of QU it throws the R-40 code.
- R-52: a committed move whose targetCell equals a used free letter's source cell: the old top leaves, `placementOrder` is pushed, its last card is the new top (the next free letter). It shares one hand-built Session with the R-41 accepting case: the `§2` test asserts it replays, the R-52 test asserts the new top.
- R-61, through replay: a committed move using free letters from non-target cells, one from a two-card cell (its next card becomes the top and is usable by the next committed move) and one from a single-card cell (it ends empty); and a move using a cell's top and that cell again throws the R-33 duplicate code.
- §2 status: gaveUp flag on a non-won position; playing fresh and mid-game; won in Idle. AD-7 post-replay: gaveUp on a won position throws its unique code.
- R-62 won test (and the gaveUp-on-won case): a D2 start with no column card throws, so it uses a seam start holding only a few column cards, all cleared by structurally valid committed moves (e.g. whole-column self-drops at k = 0 with a 3+ letter word; replay trusts committed words, no dictionary). Public won cases wait for entry 6's helper.
- Every replay, replayFrom and checkSession test deep-freezes its input Session, Start and `LangData`.
- Test ids: the `R-02 golden deal` test keeps its name; new R-id names only the R-04, R-52, R-60–R-62 and R-74 sentence tests; replay-check rejecting and accepting cases, per-move replay cases, the QU boundary and the D2 seam throws are `§2 …` (rule-coverage §2 rows).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, CAP-3, D1, D2, D5, Constraints
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-3 Session and replay, CAP-9 "Replay fixtures", Spine note
- coverage — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, §2 rows and R-04, R-52, R-60–R-62, R-74 rows
- spine — ARCHITECTURE-SPINE.md AD-2, AD-5, AD-7
- rules — docs/game-flow-spec.md §2, R-04, R-52, R-60–R-62, R-74

## Notes

- Decision (technical default): per-move rule checks are pure guard functions in an internal engine module (e.g. `src/engine/rules.ts`) throwing coded `EngineError`; replay uses them now, entries 4, 5 and 8 reuse them; never exported from `index.ts`.
- Decision (technical default): `replayFrom(start, session, lang)` deviates from build-notes' `replayFrom(start, moves)` because the cursor and `lang` are needed.
