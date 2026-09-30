# Rule coverage — epic 2

Every rule of `docs/game-flow-spec.md` §2–§6 with the capability that proves its untagged engine
sentences here, and where its other sentences are covered (spec preamble, AD-17 split). A ticket
plan expands its rows into the sentence → test mapping; "exempt" sentences assign ownership,
record provenance or describe versioning process (spec preamble) and need no test.

Test kinds: **V** = engine Vitest in this epic, named with the id; **P3** / **P4–6** = Playwright
in epic 3 / epics 4–6; **—** = none.

R-50 "The UI shows which card lands on the bottom…" and R-83 "Longest word shows "—"…" carry a
trailing `(UI)` tag since spec v0.9 (owner-approved 2026-09-30); both are Playwright, P4–6.

## §2 Game state

| Sentence group | CAP | Kind | Notes |
| --- | --- | --- | --- |
| `Session` / `Move` shape, `CardId`, `WordCellNumber`, 1-based columns | 3 | V | Types plus `§2` tests on `createSession` and replay. |
| `freeLetters` validated on replay (set equality with non-S cards of `arrangement`, no duplicate cell) | 3 | V | Set equality: `§2.freeLetters-set`; the duplicate cell is R-33's check (one owner). |
| `targetCell`/`placementOrder` present iff `reached ≥ place` | 3, 9 | V | Replay check and AD-7 fixture. |
| Committed prefix, draft at `cursor.phase`, pending draft in Idle, drop writes at `cursor.index` and truncates | 3, 4 | V | |
| Redo data (a) and (b); invariant (only the last element below committed) | 3, 5 | V | Q-41 case: pending draft pushed into the redo tail. |
| Columns and WordCells never stored; replay per `reached` (Composing → R-10–R-13, R-20–R-22, R-30–R-35; Place/committed adds R-36, R-40–R-41, R-50) | 3 | V | One rejecting case (fixture + unique check code) per violable replay check (`build-notes.md` CAP-9 list: R-10/R-13, R-31 with R-21 folded in, R-33 (empty or duplicate cell), §2 `freeLetters` set equality, R-35, R-36, R-40, R-50), each test also asserting `parseSession` → `replay-failed` with the fixture's `version`; R-11, R-12, R-20, R-22, R-30, R-32, R-34, R-41 only permit, fail at the schema domain or enum, or cannot be violated, so they are covered by accepting replay cases (whole-column tail, self-drop, empty destination, R-41 target equal to a free letter's source cell); a Composing-reached 2-letter draft (fails R-36) replays and parses ok, proving "only" (§2 test + valid fixture). |
| Replay never consults the dictionary | 3 | V | Replay signature takes no dictionary; a committed word absent from any set replays. |
| `status` derivation; in progress | 3, 7 | V | `inProgress` in CAP-7. |
| `version` rejection, message, New game, stored session not overwritten; history unreadable, Reset, finishing game unrecorded (Q-33) | 9 | P3 + P4–6 | The `§2 …` parse-reason Vitest tests satisfy AD-7's "Vitest case per check" and are supplementary, not coverage of the rejection sentences (P3 covers them); no-overwrite and the unrecorded finish are store/storage behaviour, P3; the rejection message, New game offer and Reset history UI are P4–6 (spine Proposed epics row 6). |
| Replay's first violation aborts the load and is surfaced exactly like an unknown `version` | 3, 9 | V + P3 | V: replay throws on the first violation (CAP-3); the `replay-failed` parse tests satisfy AD-7's "Vitest case per check" and are supplementary; the replay-check rejection tests are named `§2 …` on purpose: they prove this abort sentence, not the R-id, and are supplementary to R-id coverage; the abort and surfacing sentence is P3. |
| Dictionary changes do not bump `Session.version` | — | exempt | Versioning process. |
| `cursor.index` is CLAUDE.md's `undoIndex`; Session extends CLAUDE.md (Q-32) | — | exempt | Provenance. |

## §3 Setup

| Rule | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-01 | 1, 2 | V | 52 cards, carryover §1 distribution, `QU` one card (renamed scaffold test); the golden CardId → letter literal (its only copy) pins order and counts (CAP-1); CAP-2 repoints its letter half to `EN.letters`. |
| R-02 | 1 | V | `R-02 golden deal`; same seed → same deal; "frozen once shipped, bumps version" is versioning process (exempt). |
| R-03 | 1 | V | Round-robin, top = first dealt, 7/7/7/7/6/6/6/6. |
| R-04 | 3 | V | Empty WordCells, `moves = []`, `cursor = {0, idle}`, playing. |

## §4 The move

| Rule | CAP | Kind | Notes |
| --- | --- | --- | --- |
| §4 preamble (tableau unchanged until commit; engine throws on illegal commands) | 3, 4 | V | Command table rows. |
| R-10, R-11 | 4 | V | `drop` takes a bottom tail by count; whole column legal. |
| R-12 | 4 | V | No command picks from a WordCell; `canPickUp` only on columns (CAP-7). |
| R-13 | 4 | V | `sourceCount` 0 throws; destination-only word via empty column (Q-27, Q-30). |
| R-14 (UI) | — | P4–6 | Engine side: a cancelled drag issues no command (nothing to test here). |
| R-20, R-21, R-22 | 4 | V | Any column; self-drop draws D after S; empty destination incl. whole-column self-drop, k = 0. |
| R-23 | 4 | V + P4–6 | k = 1 (0 on empty), side left, no free letters, `arrangement` = S top-to-bottom; `drop` carries no position, so one test drops onto non-empty destinations of varied lengths (k = 1) and an empty one (k = 0). That test covers "the drop position never chooses k"; a P4–6 gesture check is supplementary, not coverage. |
| R-30 | 4, 7 | V | Word = D_left + M + D_right; right side reverses by card, `QU` keeps "qu"; the `STA…`/`…ATS` example. |
| R-31 | 4, 7 | V | k range, tap mapping incl. top of D → k − 1 and the k = 1 no-op, `setDestinationCount` bounds, empty column (k = 0, side stored left, flip no-op), Q-12. UI-level no-ops (a press at a bound is not an edit; both controls inert on an empty column): R-31 tests that `canIncK`/`canDecK` is false at that state, plus the command-table throw row; none is an engine same-reference no-op (AD-2: the UI does not dispatch). |
| R-32 | 4 | V | D never reordered or interleaved; the tray-visual sentence is (UI), P4–6. |
| R-33 | 4, 7 | V | One top card per cell, once per word; add appends or inserts at index; remove keeps the rest's order; a tap on a used or empty cell in Composing (UI-level no-op, not an edit): an R-33 test that `canAddFreeLetter` is false there, plus the command-table throw row; not an engine same-reference no-op (AD-2). Visual deactivation (UI), P4–6. |
| R-34, R-35 | 4 | V | `arrange` accepts any permutation of S ∪ F; a non-permutation throws. |
| R-36 | 4, 7 | V | Letter count ≥ 3 with `QU` = 2; structural reason `too-short`. |
| R-37 | 4 | V | Word string lowercase, `QU` → "qu"; membership in the passed set. List construction is AD-8 (epic 1, done). |
| R-38 | 4 | V | `validate` only via the command; throws while structural fails; failed Validate = same reference + `rejectedWord`, keeps redo data; success → Place. Dictionary loading in the shell is P3. |
| R-39 | 4, 5 | V + P4–6 | V only for "there is no Cancel" (a compile-time `@ts-expect-error` test named R-39: `{ type: 'cancel' }` is not a `Command`) and "Undo from Composing returns S, D and the free letters". The inertness sentences are (UI), P4–6; the flags behind them are tested under AD-3 (CAP-7), not as R-39 coverage. |
| R-40, R-41 | 4 | V | Legal targets ≤ L; a `QU` case (4-card word with `QU`, L = 5, legal targets reach cell 5); 10+ any cell; used free letter's cell stays legal and the letter travels. |
| R-42 | 4 | V | Validate stores highest legal target and word order; pre-selection (UI) P4–6. |
| R-50, R-51 | 4 | V | Any permutation of S ∪ F ∪ D; default bottom→top = word order; target change keeps order. "The UI shows which card lands on the bottom…" (UI) P4–6. |
| R-52 | 3, 4 | V | New top card is the next free letter. |
| R-60 | 3, 4 | V | Atomic commit; `confirm` discards redo then commits; Redo commits without discarding. |
| R-61 | 3 | V | Next card exposed; the target case under R-52; not usable in the same word. |
| R-62 | 3 | V | All columns empty in Idle → won. |
| R-65 (UI) | — | P4–6 | Viewing never reaches the engine. |

## §5 Undo, redo, session

| Rule | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-70 | 5 | V | Each transition; won → playing on undo; index 0 disabled unless gaveUp. |
| R-71 | 5 | V | Enablement, Redo from Place commits only at committed, Redo into Place ignores the dictionary, every discard case, edits vs non-edits (same-letter swap is an edit; non-edit tests are the failed Validate, every move command's equal-value no-op row in the command table, the k = 0 `flip` and the k = 1 top-of-D tap (R-31)). A bound press is covered only by the R-31 `canIncK`/`canDecK`-false test plus the command-table throw row. |
| R-72 | 5 | V | In-phase actions are not undo steps; Composing → Idle in one step keeps the draft as redo data. |
| R-73 (UI) | — | P3 | Save and restore; engine side is CAP-9's round trip. |
| R-74 | 3, 8 | V + P3 + P4–6 | Engine: fresh Session fields, seed passed in, `createSession` throws on a non-uint32. Seed generation, no-overwrite and first-launch deal are store/storage, P3; the confirmation dialog (UI) is P4–6 (spine Proposed epics row 6). "Not recorded" is covered by R-84 (no finish, no record). "A replayed seed is a separate game record": two finished Sessions with the same seed both append; un-finishing the second removes only the last record (CAP-8). |
| R-75 | 5 | V | Give up only in Idle while playing; moves untouched; undo clears the flag at any index; not redoable; every command except `undo` throws while not playing. |
| R-76 | 5, 8 | V + P3 | `accrue` adds only while playing; "always recorded for statistics": an `R-76` test that `gameRecord` carries the Session's `activeMs` for a won and a `gaveUp` finish, 0 included (CAP-8); clock, visibility and display preference are shell/UI, epic 3. |

## §6 Scoring and end of game

| Rule | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-80 | 6 | V | Score formula; max = Σ letterCount × 10 = 530. |
| R-81 | 6 | V | `PENALTY_PER_LETTER × lettersLeft` (Σ letterCount over column cards), tested with a `QU` left; unclamped. |
| R-82 (UI) | — | P4–6 | `liveScore`/`displayScore` values are CAP-7 (V). |
| R-83 | 6, 7 | V + P4–6 | Band thresholds and integer comparison, longest word absent with no word (V); names and messages (UI) P4–6; "Longest word shows "—"…" (UI) P4–6; "names delivered by UX" exempt. |
| R-84 | 8 | V + P3 | Record fields, append/remove, at most once, never replayed, ties, statistics set, Q-44 exclusion of negative gaveUp records from best and average (V); persistence, same-task writes, Q-39 order are shell, epic 3; "one game in progress at a time" is P3 (the store holds one Session, AD-4). |
| R-85 | 2 | V | `LangData`, one `letterCount` (throws for -1, 52 and 1.5); "never counts cards where letters are meant": the `QU` cases of R-36, R-40, R-80, R-81; "English only" exempt. |
