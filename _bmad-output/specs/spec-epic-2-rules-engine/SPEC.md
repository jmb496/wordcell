---
id: SPEC-epic-2-rules-engine
companions:
  - rule-coverage.md
  - build-notes.md
  - ../../../docs/game-flow-spec.md
  - ../../planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md
  - ../../../AGENTS.md
  - ../../../docs/development-methodology.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Epic 2 — Rules engine

## Why

Foundation. Every later epic renders or stores what the engine derives, and the BGA version's
desync bugs (carryover §7) came from rules living outside one pure core. Spec §2–§6 is complete
(no open questions) and the spine fixes the surface (AD-2, AD-3, AD-6, AD-7), so this epic turns
every untagged engine sentence into tested code in `src/engine/` without a line of UI. Scope is
spine Proposed epics row 2 plus the Scaffold delta epic 1 deferred to it (epic 1 SPEC D2);
`docs/game-flow-spec.md` is the rule text, the spine the shape, and neither is reopened.

## Capabilities

In build order; each depends on those above it unless noted. `rule-coverage.md` assigns every
rule of §2–§6 to a capability and to its test kind (engine Vitest here; `(UI)` and app-shell
sentences to later epics). `build-notes.md` holds the how.

- **CAP-1** Golden deal and deal freeze (AD-5)
  - **intent:** The dealt layout for any seed is pinned by a test before any engine file
    changes, so no later refactor can alter a deal.
  - **success:** The epic's first commit adds `it('R-02 golden deal …')` pinning the CardIds per
    column for seeds `1` and `4294967295`, generated from the HEAD `deal.ts` (identical to
    `785c0f6`, verified); it stays green unchanged through every later ticket; the scaffold's four
    unnamed `deal.test.ts` cases carry R-ids (R-01, R-02, R-03).

- **CAP-2** Language data (R-85, Scaffold delta)
  - **intent:** Distribution, per-card letters and letter values are one `LangData` value
    (`EN`) that the deck, scoring and word strings read, and `letterCount(card, lang)` is the
    only way the engine counts letters.
  - **success:** `src/engine/lang/en.ts` exports `EN`; `types.ts` holds no language constant and
    no `STUCK_PENALTY_PER_CARD`; `buildDeck` reads `EN` and the golden test is unchanged;
    `letterCount` is 2 for the `QU` card and 1 for every other; Σ letterCount over the deck is 53
    and the derived max score is 530 (R-80).

- **CAP-3** Session, replay and position (§2, R-03, R-04, R-60–R-62)
  - **intent:** A game is the §2 `Session` value; `createSession(seed)` starts one and every
    position (columns, WordCells, draft, status) is derived by replaying `moves` against the
    rules of each move's own `reached`.
  - **success:** `createSession` gives R-04's state and throws on a non-uint32 seed; replay of a
    committed move applies R-60 atomically (S, D, free letters out; placement order onto the
    target; R-61 exposure); status derives per §2 (`gaveUp` flag, else won when every column is
    empty in Idle, R-62); a Session breaking any §2 invariant or any rule at a move's `reached`
    (the redo tail and a below-committed last element included, Q-41) makes replay throw
    `EngineError` (the value `parseSession` maps to `replay-failed`, CAP-9); replay never takes
    a dictionary.

- **CAP-4** Move commands (R-10–R-13, R-20–R-23, R-30–R-38, R-40–R-42, R-50–R-52, R-60–R-62)
  - **intent:** `apply(session, command, ctx)` implements every AD-2 move command (`drop`,
    `tapDestinationCard`, `setDestinationCount`, `flip`, `addFreeLetter`, `removeFreeLetter`,
    `arrange`, `validate`, `setTarget`, `setPlacementOrder`, `confirm`) with R-71's edit and
    advance semantics, AD-2's no-op by value, and `EngineError` for everything the command table
    marks as throw.
  - **success:** `src/engine/commands.test.ts` opens with the AD-2 command table and runs each
    row (no-op → same reference; throw → `EngineError`); each untagged sentence of the listed
    rules has a passing test named with its R-id (`rule-coverage.md`); the §8 worked example
    (BAKED, BALKED, FAKED, FLAKED; `DEKA…` under col3 without `B` impossible) passes on a
    hand-built position; a failed Validate returns the input reference plus `rejectedWord`
    (R-37 string, `QU` as "qu"), and `validate` without `ctx.dictionary` throws.

- **CAP-5** Undo, redo, give up and active time (R-70–R-72, R-75, R-76 engine part)
  - **intent:** `undo`, `redo` and `giveUp` walk the phase-state history exactly as R-70, R-71
    and R-75 define, and `accrue(session, elapsedMs, lang)` adds active time only while playing.
  - **success:** Tests per R-id cover every R-70 transition (Idle→previous Place with a pending
    draft pushed into the redo tail, Place→Composing, Composing→Idle, index 0, won → playing),
    R-71 enablement and discard cases (including the same-letter swap edit and a failed
    Validate keeping redo data), Redo from Place committing only at `reached = 'committed'`,
    give up and its undo at index 0; `accrue` returns the input reference for `0` and while not
    playing, and throws on a negative or non-integer value.

- **CAP-6** Scoring and bands (R-80, R-81, R-83)
  - **intent:** The engine computes the live score, the give-up penalty per letter left in the
    columns, the unclamped final score and the rating band from `LangData`'s max score.
  - **success:** R-80 score over hand-built WordCells (with `QU`); R-81 penalty 10 per letter
    (`QU` 20), negative final scores kept; band index by `finalScore × 520 ≥ t × max` for
    t ∈ {156, 260, 370, 460, 520}, English boundaries 158/159, 264/265, 377/378, 468/469,
    529/530 and a negative score in band 0; no BGA absolute in the code.

- **CAP-7** GameView (AD-3)
  - **intent:** `view(session, lang)` returns every derived value AD-3 lists, so no UI module
    ever re-derives game state.
  - **success:** Each AD-3 field has a test (named with the R-id it derives, else `AD-3`):
    faces, columns, WordCells, per-column and per-cell flags, `kIfTapped` (`null` at the R-31
    no-op, inert cards absent), the draft and its structural reason, Place data with the A-E14
    score delta (equal to the live-score change the commit then makes), `liveScore`,
    `displayScore`, end values absent while playing, longest word (ties to the earliest), word
    count, pending-draft word only in Idle while playing, every `can*` flag agreeing with the
    command table (a flag is true iff the command it gates is neither a no-op nor a throw), and
    `inProgress`.

- **CAP-8** Score history semantics (AD-6, R-84)
  - **intent:** The engine builds a game's record, reconciles the history across a finish or an
    un-finish, tells whether this game is recorded, and computes the six v1 statistics.
  - **success:** Tests for `gameRecord` (null while playing; `longestWord` omitted with no
    word; spelling lowercase), `reconcileHistory` (append on finish, remove the last record
    only on a seed/outcome/`activeMs` match, same reference otherwise, Q-43), `isRecorded`, and
    `statistics` (played, won, given up, best, average rounded per A-E3, longest word ever with
    ties to the earliest record; absent values on an empty history).

- **CAP-9** Serialise and parse (AD-7, §2) — may follow CAP-5
  - **intent:** Sessions and score histories round-trip through one JSON format, and every
    unreadable, unknown-version or replay-failing input comes back as the AD-7 reason value.
  - **success:** `parseSession(serializeSession(s))` deep-equals `s` for fixtures at every
    phase (a redo tail, a pending draft, `gaveUp`, a below-committed last element); `version`
    first, optional fields absent; each AD-7 pre-replay check, replay failure and post-replay
    check, and each `parseHistory` record check, has its own `fixtures/*.json` fixture and a
    passing `§2 …` test; `null` and `[]` texts give `version-unreadable`; `SESSION_VERSION` and
    `HISTORY_VERSION` are `1`.

## Constraints

- The deal never changes (AD-5, AGENTS.md Policy): no edit to the PRNG, `shuffle`, deal order or
  the distribution's order and counts; any ticket touching `deal.ts`, `buildDeck` or language
  data runs the golden test first and keeps it byte-identical.
- `src/engine/index.ts` exports exactly AD-2's list plus its types, and the transitional D1
  `deal`/`Card` export; nothing else crosses the boundary.
- `src/engine/commands.test.ts` opens with the command table and is its single source of truth;
  tickets and plans link to it, never copy it.
- No-op by value: a command leaving every stored field equal returns the input reference and
  keeps `reached` and the redo tail (AD-2); every edit and advance discards redo data per R-71.
- Engine purity (AD-1): no clock, randomness, I/O or DOM; seeds, elapsed time and the dictionary
  arrive as data; engine values are `readonly` and no argument is mutated.
- Fail fast (rule 6): illegal commands and corrupt Sessions throw `EngineError`; only
  `parseSession`/`parseHistory` results and `rejectedWord` are values (AD-15).
- Engine tests use small inline `Set` dictionaries; the unit suite stays under 5 s.
- Test names start with the R-id (else §, Q, AD) of the sentence they prove; only engine Vitest
  tests count here, and `(UI)` or app-shell sentences are not claimed (AGENTS.md Conventions).
- `SESSION_VERSION` and `HISTORY_VERSION` bump only per AD-7; there is no migration code.

## Non-goals

- Game store, dispatch, `feedback.rejectedWord`, storage, history store, dictionary load,
  clock, seed generation, prefs, test-hook accessors and restore Playwright tests (epic 3).
- Any `(UI)` sentence or Playwright R-id test; band names and messages (`text.ts`); the board
  beyond keeping the placeholder rendering (epics 4–6).
- Hints or "no legal move" detection (Q-08, Q-19); languages other than English (Q-14).
- A dictionary change or regeneration; the dictionary repro cases of AD-8 unless a ticket
  needs one.

## Success signal

`npm run test:all` is green with every untagged engine sentence of spec §2–§6 mapped in
`rule-coverage.md` to a passing R-id-named Vitest test; a scripted game on seed 1 (drop,
compose, validate against an inline set, place, confirm, then undo and redo to both ends) gives,
after every step, a Session whose `serializeSession` → `parseSession` round trip yields an equal
`view`; and the `R-02 golden deal` test passes unchanged from its first commit.

## Assumptions

- The command table is executable: `commands.test.ts` iterates its rows, so the table and the
  tests cannot disagree.
- Rules are tested on hand-built positions through internal engine modules (D2); public-API
  tests go through `index.ts`.
- Parse fixtures are JSON under root `fixtures/` (AD-17), one per AD-7 check; texts that are
  not a JSON object stay inline strings in the test.
- No owner question arose: every engine behaviour in §2–§6 is decided by the spec (Q-01…Q-43),
  AD-2, AD-3, AD-6, AD-7 and EXPERIENCE.md A-E3 and A-E14.

## Decisions

Technical defaults taken under the owner's standing rule (2026-09-28); none changes
functionality, UX or gameplay. Rationale in `build-notes.md`.

| # | Question | Decision |
| --- | --- | --- |
| D1 | `main.ts` feeds the placeholder with `deal(1)`, but AGENTS.md lets only the store call `createSession`, and the store is epic 3. | Keep `deal(seed)` and `Card { id, letter }` exported from `index.ts` (epic 1 D1, outside AD-2's list) with letters from `EN`; epic 3 removes them when the store feeds the board. |
| D2 | How to test rules on positions no seed deals (the §8 example, full columns, `QU` edges)? | Internal modules take a position (columns, WordCells); engine tests build positions directly. |
| D3 | Band representation. | Index 0–5 (0 = below 156/520) on `GameView`; names and messages stay UI text. |
| D4 | Where A-E3's average rounding lives. | In `statistics` (`Math.round`); games played = record count. |
| D5 | Starting versions. | `SESSION_VERSION = 1`, `HISTORY_VERSION = 1` (AD-7). |
| D6 | Place score delta formula (AD-3 "per EXPERIENCE.md Word line"). | A-E14: word letter count × target − Σ(free letter count × its source cell); tested equal to the commit's live-score change. |
| D7 | Structural check reasons. | `too-short` (R-36) is the only runtime failure; R-30–R-35 hold by construction or throw. |
