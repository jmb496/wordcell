# Build notes — epic 2

How-level guidance per capability. The spec rules and the spine ADs are the contract; these
notes fix choices they leave open. `[ASSUMPTION]` marks inferences.

Spine note (for the spine owner to fold in): "safe integer" is taken as the integer domain of
AD-7's `activeMs` and AD-2's `elapsedMs` (`Number.isSafeInteger`), a stricter technical default.

## Scaffold facts that bite

- `deal.ts` and `types.ts` are byte-identical to `785c0f6` (verified 2026-09-28), so the golden
  layout comes from running HEAD's `deal`. Generate it once, paste the literal arrays into the
  test, never compute the expected value in the test.
- `buildDeck` iterates `Object.entries(ENGLISH_DISTRIBUTION)`: deck order is the object's key
  order. `LangData` must keep that order as an explicit array (alphabetical, `QU` in the Q slot),
  not rely on object key order.
- `deal.test.ts` imports `DECK_SIZE` and `ENGLISH_DISTRIBUTION` from `types.ts`. CAP-1 only
  renames tests; CAP-2 repoints the `ENGLISH_DISTRIBUTION` import to `EN.distribution`;
  `DECK_SIZE` stays in `types.ts`.
- `main.ts` calls `deal(seed)` and passes `Card[][]` to `src/ui/App.svelte` (`import type
  { Card }`, not `Letter`). Keep that shape (D1) so no UI file changes beyond what the type
  needs.
- `STUCK_PENALTY_PER_CARD` becomes `PENALTY_PER_LETTER = 10` in `types.ts` (spine Scaffold
  delta), used by `penalty`; `MIN_WORD_LENGTH` and `WORD_CELL_NUMBERS` stay in `types.ts` as rule
  constants.

## CAP-1 Golden deal

- The epic's first code commit (CAP-1's ticket, before any `src/engine/` source change; the
  spec commit precedes it), touching only `deal.test.ts`: `it('R-02 golden deal: seeds 1 and
  4294967295')` asserting `deal(seed).map((col) => col.map((c) => c.id))` against the literal
  `CardId[][]` per seed, plus `buildDeck().map((c) => c.letter)` against a literal 52-entry
  letter array (alphabetical, `'QU'` in the Q slot) so a reordered or recounted distribution
  fails. CAP-3 adds the internal CardId deal (e.g. `dealIds(seed)` in `deal.ts`,
  used by `createSession` and replay, with D1's `Card[][]` `deal` built over it) and repoints the
  deal call to it; CAP-2's ticket repoints the letter half to assert `EN.letters`; call repoints
  are the only edits, the literal arrays stay byte-identical and are the only copy; rename the four scaffold cases (`R-01 deck
  has 52 cards …`, `R-02 same seed, same shuffle …`, `R-03 columns 1–4 hold 7 …`, `R-03 every
  card dealt once`).
- Every later ticket touching `deal.ts`, `buildDeck` or `lang/` runs it before and after
  (AGENTS.md Policy).

## CAP-2 LangData

- Shape `[ASSUMPTION]`: `{ id: 'en'; letters: readonly string[] (per CardId, 52 entries,
  uppercase glyphs, `'QU'` in the Q slot; `faces.letter` and D1's `Card.letter` use them unchanged);
  distribution: readonly { letter: string; count: number }[]; letterValue: (letter) → number
  (QU 2, else 1); maxScore: number }`, deep-frozen. `maxScore` is computed when `EN` is built
  (Σ count × letterValue × 10, R-80), never a literal; a test asserts 530. One internal
  constructor builds a `LangData` from distribution + letter values and throws `EngineError`
  unless the counts sum to `DECK_SIZE` (52); `EN` and the CAP-6 synthetic language both use it.
  CAP-2's requirement is the golden test's letter-half repoint to `EN.letters`, not a second test
  or a second copy of the literal. `letterCount(card, lang)` =
  `lang.letterValue(lang.letters[card])`; a card that is not an integer in 0–51 throws
  `EngineError` (AD-2 domain; R-85 test for -1, 52 and 1.5). `spelling(card, lang)` = lowercase letters (`"qu"`).
- `buildDeck` reads `EN.distribution`; `deal(seed)` keeps its signature (English only, v1).
- The `Letter` union and its `index.ts` type export go; `Card.letter` becomes `string` read from
  `EN` (App.svelte imports only `Card`). Keep `WordCellNumber`, `COLUMN_COUNT`, `DECK_SIZE` in
  `types.ts` (rule constants, not language data).

## CAP-3 Session and replay

- Modules (spine Structural Seed): `session.ts` (types, `createSession`), `replay.ts`
  (position from moves), `errors.ts` (`EngineError`) `[ASSUMPTION]`. `EngineError` is not
  exported from `index.ts` (not in AD-2's list); engine tests import it from `./errors`. It
  carries a machine-readable `check` code unique per check (e.g. `schema.moves-array`,
  `ad7.gaveUp-idle`, `§2.freeLetters-set`, `R-31.k-range`; scheme is the builder's,
  uniqueness required); `checkSession` (AD-7 checks), replay's per-move rule checks and the
  command reducers' throws all carry one; tests assert the exact code.
- Start-position seam (D2): `type Start = { columns, cells }`; internal `replayFrom(start,
  moves)`, `applyFrom(start, session, command, ctx)` and a `view` counterpart take it in place
  of `dealIds(seed)` + empty cells; `replay`, `apply` and `view` are thin wrappers over the
  dealt start. Never exported from `index.ts`. A start has exactly 8 columns and 8 cells (3–10),
  each `CardId` at most once, cards chosen by `EN` letter, missing cards allowed; the seam
  throws `EngineError` on a duplicate or out-of-range id or a start with no column card. §8, full-column and `QU` edge tests use the
  seam; the command table, no-op/redo semantics and at least one test per command family go
  through public `apply`.
- Position = `{ columns: CardId[][] (top→bottom), cells: CardId[][] }`; `cells` is indexed by
  cell (index 0 = cell 3 … index 7 = cell 10), each inner array bottom→top. Replay: deal → apply each committed move → check the draft or pending draft against
  its `reached` rules → check each redo-tail move against its own `reached` from the position
  it would start from. When a redo tail exists, the draft at `cursor.index` is committed: it is
  applied to a scratch position, then the tail moves are applied in sequence, for checking
  only. A move is checked only against its own `reached` rules: a `§2` test (and a valid
  round-trip fixture) with a Composing-reached 2-letter draft (fails R-36) replays and parses ok.
- `checkSession` (internal, called by replay) runs the AD-7 stage; its pre-replay checks run once
  before replay: `seed` uint32, `activeMs` a non-negative safe integer, `gaveUp` boolean, `cursor.index` in
  0…`moves.length`, `cursor.phase ≠ idle` needs a `reached` ≥ the phase, `gaveUp` needs idle,
  `targetCell`/`placementOrder` present iff `reached ≥ place`, k = 0 needs side left, the §2
  invariant, no unknown fields in the Session, `cursor` or any Move (one code per object kind;
  fixtures include an extra key in a Move and in `cursor`; optional-field presence tested with
  `Object.hasOwn`); only the
  `gaveUp` non-won check runs after replay. Each message carries its AD-7 wording. `apply` and
  `view` take engine-produced (type-correct) Sessions and skip the schema stage (CAP-9), so the
  three reject the same schema-valid Sessions of the current version.
- Validation order: AD-7 pre-replay checks in AD-7 order, then per move: range/domain (R-10/R-13
  `sourceCount`, R-31 `destinationCount` incl. k = 0 iff empty destination, R-33 cell empty or
  duplicate, §2 `freeLetters` set equality with the F cards in `arrangement`), then composition (R-35, R-36), then Place
  (R-40, R-50); then the post-replay `gaveUp` check. The first violation throws `EngineError`
  with a message naming the move index and rule id. Each rejecting fixture uses the fewest field
  changes from a valid one that make its named check the first violation.
- The engine never writes an `undefined`-valued key; round-trip and reducer tests use
  `toStrictEqual`.
- `freeLetters` order is not a rule (§2 checks it as a set): replay accepts any order (D8).
- Replay is cheap (≤ 52 cards); no memoisation unless a test shows a need.
- Tests deep-freeze the input Session and `LangData` (command table, replay) so a mutation
  throws.

## CAP-4 Commands

- `commands.ts` holds one reducer per command; `apply` dispatches on `type`, then checks in
  this order (the one statement of it): status (every command except `undo`), phase,
  `ctx.dictionary` (`validate` only), domain, the rule (for `validate`, R-36).
- No-op by value: compare the candidate draft's data fields plus `cursor` and `gaveUp` to the
  input by value before R-71 lowering; equal → return the input reference.
- Edit at Composing: delete `targetCell`/`placementOrder`, `reached = 'composing'`, drop moves
  after the draft. Edit at Place: `reached = 'place'`, drop moves after. Advance (drop,
  successful Validate, Confirm): discard both kinds of redo data first.
- The command table: a typed array of `{ command, precondition, outcome: 'noop' | 'throw',
  build: () => [session, command, ctx] }`, first thing in `commands.test.ts`, iterated by one
  `it.each`; each throw row also names the expected check code of its precondition and asserts
  it, so it cannot pass on an earlier throw; every `validate` row other than the missing-dictionary
  one is built with a dictionary; its rows are the AD-2 list, one per case, with the AD-2 wording as the
  precondition text; they include a non-integer `drop.sourceCount` and a non-integer
  `addFreeLetter.index` (AD-2 out-of-domain throws). "Wrong phase" and "status ≠ playing" expand to one row per command per
  invalid phase/status from §4, not one sample row. CAP-4 adds the move-command rows; CAP-5
  adds the undo, redo, `giveUp` and status rows; the table is complete at the end of CAP-5.
- `addFreeLetter` appends `cell` to `freeLetters`; `removeFreeLetter` deletes it in place (D8).
- Tests use inline sets such as `new Set(['baked', 'balked', 'faked', 'flaked', 'sta', 'ats'])`.
- §8 worked example: build col1 `F E D K A`, col2 `X O R I N`, col3 `L M F B`, cell 6 top `L`
  as a start position through the D2 seam (each letter takes the lowest free CardId for it) and
  drive the commands; the drop onto col3 gives k = 1, and a tap on the top of D at k = 1 is the
  no-op (same reference); `DEKA…` without `B` is impossible because k ≥ 1 on a non-empty column
  (R-31 `setDestinationCount 0` throws).

## CAP-5 Undo, redo, give up, accrue

- Undo from Idle with a pending draft at `moves[index]`: cursor → `{index − 1, place}`; the
  pending draft stays at `moves[index]` with its `reached` unchanged and becomes the first
  redo-tail move; it is below committed (and so last) only when never committed (Q-41).
- `giveUp` sets the flag only; `undo` while gaveUp clears it and does nothing else.
- `accrue(session, ms, lang)`: needs `lang` only to derive status. Validates `ms` first
  (`Number.isSafeInteger` and ≥ 0, else throws in every status), then returns the input for `0`
  and while not playing; while playing, throws if `activeMs + ms` is not a safe integer.
  `accrue` is not a command: its cases are own `it` tests named R-76 / AD-2 next to the table —
  the invalid-`ms` throw and the `0` same-reference return in playing, won and `gaveUp`; the
  overflow throw while playing; a won or `gaveUp` Session at `activeMs` = `MAX_SAFE_INTEGER`
  with positive `ms` returns the input.
- Won helper (shared test helper, e.g. `winSeed(seed)`): wins a real seed through public
  `apply` — per column, self-drop the whole column (k = 0), validate against an inline set
  holding the column's letters top to bottom as the R-37 lowercase string (`QU` → "qu"), confirm
  at the default target (R-42). Every won case uses it: command-table status rows,
  `accrue` won, `gameRecord` won, and generating the won fixture.

## CAP-6 Scoring

- `scoring.ts`: `liveScore(cells, lang)`, `lettersLeft(columns, lang)` (Σ letterCount over
  column cards, `QU` 2), `penalty` = `PENALTY_PER_LETTER × lettersLeft` (tested with a `QU`
  left),
  `finalScore`, `band(finalScore, lang)` with thresholds `[156, 260, 370, 460, 520]` over 520 as
  integers; return the count of thresholds met (0–5). One test with a synthetic `LangData`
  from the CAP-2 constructor (Σ letterCount over its 52 cards = 54, e.g. two cards worth 2 →
  derived `maxScore` 540) proves the thresholds are relative.

## CAP-7 GameView

- `view.ts` builds the whole `GameView` from one replay. Every `can*` flag is computed by the
  same predicates `apply` uses (shared guard functions), not re-derived, so flag and table
  agree by construction; one test per flag still asserts the agreement against the mapped
  command (true iff it is neither no-op nor throw):
  - `canPickUp(c)`: some `drop` from c with `sourceCount` 1 does not throw.
  - `canDropOn(c)`: a `drop` onto c from some legal source does not throw.
  - `canTapForK(c)`: some `tapDestinationCard` on a card of c is neither no-op nor throw.
  - `canDecK` / `canIncK`: `setDestinationCount { k ∓ 1 }`; `canFlip`: `flip`.
  - `canAddFreeLetter(cell)`: `addFreeLetter { cell }` without index (AD-3 has no removal
    flag; `removeFreeLetter { cell }` is covered by the command table).
  - `canSetTarget(cell)`: `setTarget { cell }`; `canConfirm`, `canUndo`, `canRedo`,
    `canGiveUp`: the same-named command.
  - `isLegalTarget(cell)`: false unless phase = Place, then equal to Place data's legal
    targets; `used(cell)`: true iff the cell is in the draft's `freeLetters` while phase ≠ Idle,
    false in Idle; both tested in all three phases under AD-3.
  - `canValidate`: phase = Composing, playing and R-36 passes (structural, AD-3; `view` has no
    dictionary); its test applies `validate` with a set holding the word, and in each false
    state (other phase, not playing, too short) `validate` with a dictionary throws the expected
    check code.
- `kIfTapped` only for the destination column in Composing: exactly the cards of that column
  after R-21 (S removed), mapped per R-31, the R-31 no-op as `null`; every other card is absent,
  S cards of a self-drop included (an R-31 self-drop test asserts it).
- The draft is present iff phase ≠ Idle; Place data iff phase = Place; absence tested under
  AD-3.
- Longest word and word count read `moves.slice(0, cursor.index)` only (a test with a committed
  redo tail asserts it is not counted); longest word = max letter count, ties to the earliest,
  shaped `{ spelling, letterCount }` as AD-6, absent with no word, from one internal function
  that CAP-7 creates for `view` and CAP-8's `gameRecord` reuses. Every word string (draft, pending-draft, longest word) is R-37's lowercase
  string (`QU` → "qu"); the UI uppercases for display.
- Place score delta (D6): word letter count × target − Σ over free letters of (that card's
  `letterCount` × its source cell); the test includes a `QU` free letter.

## CAP-8 History

- `history.ts`: `GameRecord` with fields in AD-6 order, `longestWord` from CAP-7's internal
  function, `activeMs` copied from the Session
  (`R-76` test: won and `gaveUp` finishes, 0 included); `reconcileHistory` compares
  `status(before)`/`status(after)`; match on `seed`, `outcome`, `activeMs` only; an un-finish
  on an empty history returns the same reference (R-84).
- Statistics: `gamesPlayed`, `gamesWon`, `gamesGivenUp` (always present, 0 on empty),
  `bestScore?`, `averageScore?`
  (`Math.round(sum / n)`; tests include an x.5 and a −x.5 average, e.g. −5 and −10 → −7), `longestWord?` (earliest on ties; absent when no record has one, tested on
  such a history). Best and average cover won records and gaveUp
  records with `finalScore >= 0` (D4: R-84, Q-44); a negative gaveUp record still counts in
  `gamesPlayed`, `gamesGivenUp` and `longestWord`. Tests: a negative gaveUp record excluded from
  best and average but counted in played, given up and longest word; a 0-score gaveUp record
  counted; a history of only negative gaveUp records gives best and average absent.
- `isRecorded`: true when the last record matches; false while playing, on an empty history,
  and when only `seed`, only `outcome` or only `activeMs` differs (one test each).

## CAP-9 Serialise and parse

- `serialize.ts`: `serializeSession` writes keys in §2 order with `version` first and omits
  absent optional fields; `serializeHistory` = `{ version, records }`.
- `parseSession(text, lang)`: `JSON.parse` in a try (a parse failure is `version-unreadable`,
  a specified outcome, AD-15), then the version checks, then the schema stage, then replay
  (whose `checkSession` runs the AD-7 stage, CAP-3; an `EngineError` → `replay-failed`). Only
  `EngineError` is caught; anything else propagates. No check runs in both stages; each
  fixture's first violation is its named check.
- Schema stage (parseSession only; `EngineError` with a `schema.*` code → `replay-failed`)
  checks only: required non-optional fields of Session, `cursor` and each Move present; `cursor`
  and every `moves` element a non-null, non-array plain object; JSON type of every field AD-7
  does not type (`moves` an array, integers for `cursor.index` (AD-7 range stays in
  `checkSession`), `sourceColumn`,
  `sourceCount`, `destinationColumn`, `destinationCount`, `targetCell` and CardIds, integer
  arrays for `arrangement`, `placementOrder`, `freeLetters`); enums `cursor.phase`, `reached`,
  `destinationSide`; AD-2 domains (columns 1–8, cells 3–10, CardIds 0–51, counts non-negative
  integers). Fixtures at least: non-array `moves`, missing `cursor`, string `sourceColumn`,
  wrong-typed `destinationCount`, `reached: 'x'`, `session-invalid-column-domain` (column 9),
  `session-invalid-cell-domain` (cell 11), `session-invalid-cursor-index-type` (0.5),
  `session-invalid-move-not-object`, `session-invalid-cursor-null`.
- Replay fixtures: one rejecting fixture per violable replay check, each with a unique code:
  `sourceCount` range (R-10/R-13); `destinationCount` range and k = 0 iff empty destination
  (R-31, R-21 folded in); R-33 free-letter cell empty or duplicate; §2 `freeLetters` set equality
  with the F cards in `arrangement` (`§2.freeLetters-set`); R-35
  arrangement a permutation of S ∪ F; R-36; R-40; R-50 placement order a permutation. R-11,
  R-12, R-20, R-22, R-30, R-32, R-34, R-41 get accepting replay cases instead (valid fixture or
  replay test: whole-column tail, self-drop, empty destination, an R-41 target equal to a free
  letter's source cell).
- `null` and `[]` → `version-unreadable`, as fixtures `session-invalid-null.json`,
  `session-invalid-array.json`, `history-invalid-null.json`, `history-invalid-array.json`.
  Unparseable text and a primitive JSON root (`42`, `"x"`, `true`) are inline-string `§2` cases in
  both parsers (not fixture files), also `version-unreadable`.
- `parseHistory(text)` → `{ ok: true, history: { version, records } }`. Stage order mirrors
  `parseSession`: JSON parse failure, non-object root or bad `version` → `version-unreadable`;
  unknown version → `version-unknown`; then the container check; then records in order. A
  container whose field set is not exactly `{ version, records }` or whose `records` is not an
  array → `contents-unreadable { version }`, each with a fixture; so is a record that is not a
  plain object (`history-invalid-record-not-object`), a record whose own `version` differs from
  the container's (`history-invalid-record-version`; `checkRecord` takes the container version), a
  present `longestWord` that is not one, `null` included (`history-invalid-longest-word-not-object`) and a `longestWord.spelling` that is not a
  non-empty `^[a-z]+$` string (`history-invalid-longest-word-spelling-empty` and
  `-spelling-case`, both asserting one code), each with its own `checkRecord` code.
- Fixtures: flat root `fixtures/` (the architecture test allows only `fixtures/<name>.json`),
  imported with `with { type: 'json' }` and re-stringified for the parser. Valid ones are
  generated once by a throwaway script/test driving public `apply` (e.g. seed 1) and committed
  as JSON; each invalid one makes the fewest field changes to a valid one that make its named
  check the first violation. Valid ones double as
  epic 3's restore fixtures (AD-17), named by phase (`session-place-free-letter-redo-tail.json`);
  round-trip ones cover fresh Idle, Composing, a Composing draft of 2 letters (R-36 unchecked
  below Place), Place, Idle with a pending draft, Place with a redo tail (with a used free letter
  and a non-default `placementOrder`, AD-17 restore boundary), a below-committed last element,
  won and `gaveUp`; rejecting ones are labelled
  `session-invalid-<check>.json` / `history-invalid-<check>.json`.
- History round trip: `parseHistory(serializeHistory(h))` ok and deep-equal `h` for an empty
  history and one built by `reconcileHistory` from `gameRecord` outputs: a won game with a word
  (won helper), a `gaveUp` game with a negative score and a game with no word.
- Session rejecting fixture tests assert both `parseSession(text, EN)` → `{ ok: false, reason:
  'replay-failed', version }` with the fixture's `version` and the exact `EngineError` check code
  from the stage (schema stage or replay) run directly. History fixture tests assert the `parseHistory` reason and call the internal
  `checkRecord` / container check directly, asserting its unique code.
- `fixtures/` is a new root folder; check `tsconfig` includes and the AD-1 scan allow the JSON
  import path (AD-1 already permits it for engine tests).
