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
- Internal signatures: `replay(session, lang)` over `dealIds(session.seed)` and empty cells, and `replayFrom(start, session, lang)`, both returning the committed-prefix Position (build-notes CAP-3 shape); the draft and redo tail are applied only to scratch positions for checking. `replayFrom` runs the same `checkSession` as `replay`. `status(session, position)`: gaveUp if the flag, else won when Idle and every column empty, else playing. `lang` is `LangData` (letterCount for R-36/R-40), never a dictionary.
- Inputs: replay and checkSession take schema-valid, type-correct Sessions. AD-2 domain and JSON-type checks are the `parseSession` schema stage (entry 10, CAP-9), so replay adds no such check and no test here feeds out-of-domain or wrongly typed fields. Neither checks `version` (`parseSession`, entry 10).
- Checks: the `activeMs` check is `Number.isSafeInteger` and ≥ 0 (build-notes Spine note). R-33's free-letter cell empty and duplicate are two codes. Codes keep `errors.ts`'s kebab-case scheme (e.g. `ad7-gave-up-idle`, `s2-free-letters-set`) and extend its "Codes in use" list; uniqueness is the requirement (build-notes code examples are illustrative).
- R-60 scope: this ticket covers the atomic-commit sentences through replay (S, D and the free letters leave; `placementOrder` is pushed onto the target; later moves untouched). "Confirm first discards the redo data" is entry 5's (`confirm`), "Redo performs the commit without discarding" entry 6's. R-61's "not usable in the same word" is R-33's check, which entry 4 enforces on commands.
- `src/engine/index.ts` gains `createSession`, `SESSION_VERSION` and the §2 types (`Session`, `Move`, the cursor type, `WordCellNumber` as needed) and nothing else; `replay`, `replayFrom`, `Start`, `checkSession`, `status`, `dealIds`, the rule guards and `EngineError` stay internal (SPEC Constraints, AD-2). The `AD-2 index exports …` test in `src/engine/index.test.ts` is updated to the new runtime list.

## Acceptance Criteria

Verify: npm run test:all is green with R-04, R-52, R-74, R-60–R-62 and §2 replay tests passing (a committed word absent from any set still replays), including one rejecting case per violable check asserting its unique code, the accepting cases for permit-only rules, and deep-frozen inputs.

- The `R-02 golden deal` test runs green before the first edit to `deal.ts` and after; its literals stay byte-identical, the only edit its CardId-half call repointed to `dealIds(seed)` (AGENTS.md Policy).
- createSession: the result matches the literal above with `toStrictEqual`. R-74 seeds 0 and 4294967295 are accepted and held; -1, 4294967296, 1.5 and NaN throw `EngineError`.
- Violable checks, one rejecting case each asserting `EngineError` and its code: every AD-7 pre-replay check in build-notes CAP-3 `checkSession` (unknown fields: one code per object kind), every per-move check in build-notes CAP-3 "Validation order" (list = build-notes CAP-9 "Replay fixtures"), the post-replay gaveUp check, each D2 seam throw (duplicate id, out-of-range id, no column card) and the createSession seed throw. `activeMs` rejecting cases: -1 and 2^53.
- Accepting cases for permit-only rules: the CAP-9 list (R-11, R-12, R-20, R-22, R-30, R-32, R-34, R-41).
- These cases are inline hand-built Sessions, each the fewest field changes from a valid one that make its check the first violation; the `fixtures/*.json` files and `parseSession` → `replay-failed` assertions are entry 10's.
- Composing-reached 2-letter draft replays; counter case: cursor phase composing with a Place-reached 2-letter draft (redo data (a)) throws the R-36 code, proving checks follow `reached`, not `cursor.phase`.
- QU boundary via the seam: a Place- or committed-reached 2-card word containing QU replays (letter count 3, R-36) with targetCell 3; the same word with targetCell 4 throws the R-40 code.
- R-52: a committed move whose targetCell equals a used free letter's source cell: the old top leaves, `placementOrder` is pushed, its last card is the new top (the next free letter).
- §2 status: gaveUp flag on a non-won position; playing fresh and mid-game; won in Idle. AD-7 post-replay: gaveUp on a won position throws its unique code.
- R-62 won test (and the gaveUp-on-won case): a D2 start with no column card throws, so it uses a seam start with a few column cards cleared by hand-built committed moves (replay trusts committed words; no dictionary). Public won cases wait for entry 6's helper.
- Every replay, checkSession and createSession test deep-freezes its input Session, Start and `LangData`.
- Test ids: replay-check rejecting and accepting cases are named `§2 …` (rule-coverage §2 rows); R-ids name only the R-04, R-52, R-60–R-62 and R-74 sentence tests.

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
