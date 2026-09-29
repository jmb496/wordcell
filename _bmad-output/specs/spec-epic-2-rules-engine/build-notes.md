# Build notes — epic 2

How-level guidance per capability. The spec rules and the spine ADs are the contract; these
notes fix choices they leave open. `[ASSUMPTION]` marks inferences.

## Scaffold facts that bite

- `deal.ts` and `types.ts` are byte-identical to `785c0f6` (verified 2026-09-28), so the golden
  layout comes from running HEAD's `deal`. Generate it once, paste the literal arrays into the
  test, never compute the expected value in the test.
- `buildDeck` iterates `Object.entries(ENGLISH_DISTRIBUTION)`: deck order is the object's key
  order. `LangData` must keep that order as an explicit array (alphabetical, `QU` in the Q slot),
  not rely on object key order.
- `deal.test.ts` imports `DECK_SIZE` and `ENGLISH_DISTRIBUTION` from `types.ts`; move them with
  the rename in CAP-1/CAP-2.
- `main.ts` calls `deal(seed)` and passes `Card[][]` to `src/ui/App.svelte` (`import type
  { Card }`). Keep that shape (D1) so no UI file changes beyond what the type needs.
- `STUCK_PENALTY_PER_CARD` is unused scaffold; delete it, do not rename it.

## CAP-1 Golden deal

- First commit of the epic, touching only `deal.test.ts`: `it('R-02 golden deal: seeds 1 and
  4294967295')` with the full `CardId[][]` per seed; rename the four scaffold cases (`R-01 deck
  has 52 cards …`, `R-02 same seed, same shuffle …`, `R-03 columns 1–4 hold 7 …`, `R-03 every
  card dealt once`).
- Every later ticket touching `deal.ts`, `buildDeck` or `lang/` runs it before and after
  (AGENTS.md Policy).

## CAP-2 LangData

- Shape `[ASSUMPTION]`: `{ id: 'en'; letters: readonly string[] (per CardId, 52 entries);
  distribution: readonly { letter: string; count: number }[]; letterValue: (letter) → number
  (QU 2, else 1); maxScore: number }`, deep-frozen. `letterCount(card, lang)` =
  `lang.letterValue(lang.letters[card])`. `spelling(card, lang)` = lowercase letters (`"qu"`).
- `buildDeck` reads `EN.distribution`; `deal(seed)` keeps its signature (English only, v1).
- `Letter` type stays for the placeholder `Card` (D1) or becomes `string` if it no longer
  fits `LangData`; keep `WordCellNumber`, `COLUMN_COUNT`, `DECK_SIZE` in `types.ts` (rule
  constants, not language data).

## CAP-3 Session and replay

- Modules (spine Structural Seed): `session.ts` (types, `createSession`), `replay.ts`
  (position from moves), `errors.ts` (`EngineError`) `[ASSUMPTION]`.
- Position = `{ columns: CardId[][] (top→bottom), cells: CardId[][] (bottom→top, index 0 = cell
  3) }`. Replay: deal → apply each committed move → check the draft or pending draft against
  its `reached` rules → check each redo-tail move against its own `reached` from the position
  it would start from (redo-tail moves are applied in sequence for checking only).
- Validation order is the §2 list; the first violation throws `EngineError` with a message
  naming the move index and rule id (tests match the rule id).
- Replay is cheap (≤ 52 cards); no memoisation unless a test shows a need.

## CAP-4 Commands

- `commands.ts` holds one reducer per command; `apply` dispatches on `type`, checks status
  and phase first (AD-2 table), then domain, then the rule.
- No-op by value: compare the candidate draft's data fields plus `cursor` and `gaveUp` to the
  input by value before R-71 lowering; equal → return the input reference.
- Edit at Composing: delete `targetCell`/`placementOrder`, `reached = 'composing'`, drop moves
  after the draft. Edit at Place: `reached = 'place'`, drop moves after. Advance (drop,
  successful Validate, Confirm): discard both kinds of redo data first.
- The command table: a typed array of `{ command, precondition, outcome: 'noop' | 'throw',
  build: () => [session, command, ctx] }`, first thing in `commands.test.ts`, iterated by one
  `it.each`; its rows are the AD-2 list, one per case, with the AD-2 wording as the
  precondition text.
- Tests use inline sets such as `new Set(['baked', 'balked', 'faked', 'flaked', 'sta', 'ats'])`.
- §8 worked example: build col1 `F E D K A`, col2 `X O R I N`, col3 `L M F B`, cell 6 top `L`
  as a position (D2) and drive the commands; `DEKA…` without `B` is impossible because k ≥ 1 on
  a non-empty column (R-31 `setDestinationCount 0` throws).

## CAP-5 Undo, redo, give up, accrue

- Undo from Idle with a pending draft at `moves[index]`: cursor → `{index − 1, place}`; the
  pending draft stays at the end of `moves` (now redo tail, below committed, Q-41).
- `giveUp` sets the flag only; `undo` while gaveUp clears it and does nothing else.
- `accrue(session, ms, lang)`: needs `lang` only to derive status; returns the input for `0`.

## CAP-6 Scoring

- `scoring.ts`: `liveScore(cells, lang)`, `penalty(columns, lang)` (10 × letters),
  `finalScore`, `band(finalScore, lang)` with thresholds `[156, 260, 370, 460, 520]` over 520 as
  integers; return the count of thresholds met (0–5).

## CAP-7 GameView

- `view.ts` builds the whole `GameView` from one replay. Every `can*` flag is computed by the
  same predicates `apply` uses (shared guard functions), not re-derived, so flag and table
  agree by construction; one test per flag still asserts the agreement against the table.
- `kIfTapped` only for the destination column in Composing; a card mapping to the R-31 no-op
  is `null`; cards outside D's column are absent.
- Longest word: max letter count over committed words, ties to the earliest; word count =
  committed moves.

## CAP-8 History

- `history.ts`: `GameRecord` with fields in AD-6 order; `reconcileHistory` compares
  `status(before)`/`status(after)`; match on `seed`, `outcome`, `activeMs` only.
- Statistics: `gamesPlayed`, `gamesWon`, `gamesGivenUp`, `bestScore?`, `averageScore?`
  (`Math.round(sum / n)`), `longestWord?` (earliest on ties).

## CAP-9 Serialise and parse

- `serialize.ts`: `serializeSession` writes keys in §2 order with `version` first and omits
  absent optional fields; `serializeHistory` = `{ version, records }`.
- `parseSession(text, lang)`: `JSON.parse` in a try (a parse failure is `version-unreadable`,
  a specified outcome, AD-15), then the AD-7 checks in listed order, then replay (an
  `EngineError` → `replay-failed`), then the post-replay `gaveUp` check. Only `EngineError` is
  caught; anything else propagates.
- Fixtures: `fixtures/session-<case>.json`, `fixtures/history-<case>.json`, imported with
  `with { type: 'json' }` and re-stringified for the parser; valid ones double as epic 3's
  restore fixtures (AD-17), so name them by phase (`session-place-free-letter-redo-tail.json`).
- `fixtures/` is a new root folder; check `tsconfig` includes and the AD-1 scan allow the JSON
  import path (AD-1 already permits it for engine tests).
