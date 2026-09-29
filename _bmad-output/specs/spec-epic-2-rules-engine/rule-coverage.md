# Rule coverage — epic 2

Every rule of `docs/game-flow-spec.md` §2–§6 with the capability that proves its untagged engine
sentences here, and where its other sentences are covered (spec preamble, AD-17 split). A ticket
plan expands its rows into the sentence → test mapping; "exempt" sentences assign ownership,
record provenance or describe versioning process (spec preamble) and need no test.

Test kinds: **V** = engine Vitest in this epic, named with the id; **P3** / **P4–6** = Playwright
in epic 3 / epics 4–6; **—** = none.

## §2 Game state

| Sentence group | CAP | Kind | Notes |
| --- | --- | --- | --- |
| `Session` / `Move` shape, `CardId`, `WordCellNumber`, 1-based columns | 3 | V | Types plus `§2` tests on `createSession` and replay. |
| `freeLetters` validated on replay (set equality with non-S cards of `arrangement`, no duplicate cell) | 3 | V | Each failure its own case. |
| `targetCell`/`placementOrder` present iff `reached ≥ place` | 3, 9 | V | Replay check and AD-7 fixture. |
| Committed prefix, draft at `cursor.phase`, pending draft in Idle, drop writes at `cursor.index` and truncates | 3, 4 | V | |
| Redo data (a) and (b); invariant (only the last element below committed) | 3, 5 | V | Q-41 case: pending draft pushed into the redo tail. |
| Columns and WordCells never stored; replay per `reached` (Composing → R-10–R-13, R-20–R-22, R-30–R-35; Place/committed adds R-36, R-40–R-41, R-50) | 3 | V | One failing case per rule group. |
| Replay never consults the dictionary | 3 | V | Replay signature takes no dictionary; a committed word absent from any set replays. |
| `status` derivation; in progress | 3, 7 | V | `inProgress` in CAP-7. |
| `version` rejection, message, New game, stored session not overwritten; history unreadable, Reset, finishing game unrecorded (Q-33) | 9 | V (parse results) + P3 | Parse reasons are V; message, no-overwrite and Reset behaviour are app-shell, epic 3. |
| `cursor.index` is CLAUDE.md's `undoIndex`; Session extends CLAUDE.md (Q-32) | — | exempt | Provenance. |

## §3 Setup

| Rule | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-01 | 1, 2 | V | 52 cards, carryover §1 distribution, `QU` one card (renamed scaffold test). |
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
| R-23 | 4 | V | k = 1 (0 on empty), side left, no free letters, `arrangement` = S top-to-bottom; one test per drop position that it does not choose k. |
| R-30 | 4, 7 | V | Word = D_left + M + D_right; right side reverses by card, `QU` keeps "qu"; the `STA…`/`…ATS` example. |
| R-31 | 4 | V | k range, tap mapping incl. top of D → k − 1 and the k = 1 no-op, `setDestinationCount` bounds, empty column (k = 0, side stored left, flip no-op), Q-12. |
| R-32 | 4 | V | D never reordered or interleaved; the tray-visual sentence is (UI), P4–6. |
| R-33 | 4 | V | One top card per cell, once per word; add appends or inserts at index; remove keeps the rest's order; used/empty cell throws in the engine (UI no-op is not dispatching). Visual deactivation (UI), P4–6. |
| R-34, R-35 | 4 | V | `arrange` accepts any permutation of S ∪ F; a non-permutation throws. |
| R-36 | 4, 7 | V | Letter count ≥ 3 with `QU` = 2; structural reason `too-short`. |
| R-37 | 4 | V | Word string lowercase, `QU` → "qu"; membership in the passed set. List construction is AD-8 (epic 1, done). |
| R-38 | 4 | V | `validate` only via the command; throws while structural fails; failed Validate = same reference + `rejectedWord`, keeps redo data; success → Place. Dictionary loading in the shell is P3. |
| R-39 | 4, 7 | V + P4–6 | No cancel command; inert columns and cells as `GameView` flags (V); gestures (UI) P4–6. |
| R-40, R-41 | 4 | V | Legal targets ≤ L; 10+ any cell; used free letter's cell stays legal and the letter travels. |
| R-42 | 4 | V | Validate stores highest legal target and word order; pre-selection (UI) P4–6. |
| R-50, R-51 | 4 | V | Any permutation of S ∪ F ∪ D; default bottom→top = word order; target change keeps order. "UI shows bottom and top" is (UI) P4–6. |
| R-52 | 3, 4 | V | New top card is the next free letter. |
| R-60 | 3, 4 | V | Atomic commit; `confirm` discards redo then commits; Redo commits without discarding. |
| R-61 | 3 | V | Next card exposed; the target case under R-52; not usable in the same word. |
| R-62 | 3 | V | All columns empty in Idle → won. |
| R-65 (UI) | — | P4–6 | Viewing never reaches the engine. |

## §5 Undo, redo, session

| Rule | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-70 | 5 | V | Each transition; won → playing on undo; index 0 disabled unless gaveUp. |
| R-71 | 5 | V | Enablement, Redo from Place commits only at committed, Redo into Place ignores the dictionary, every discard case, edits vs non-edits (incl. same-letter swap is an edit; bound press and failed Validate are not). |
| R-72 | 5 | V | In-phase actions are not undo steps; Composing → Idle in one step keeps the draft as redo data. |
| R-73 (UI) | — | P3 | Save and restore; engine side is CAP-9's round trip. |
| R-74 | 3 | V + P3 | Engine: fresh Session fields, seed passed in, `createSession` throws on a non-uint32. Confirmation (UI), seed generation and first-launch deal are shell, epic 3. "Not recorded" is covered by R-84 (no finish, no record). |
| R-75 | 5 | V | Give up only in Idle while playing; moves untouched; undo clears the flag at any index; not redoable; every command except `undo` throws while not playing. |
| R-76 | 5 | V + P3 | `accrue` adds only while playing; clock, visibility and display preference are shell/UI, epic 3. |

## §6 Scoring and end of game

| Rule | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-80 | 6 | V | Score formula; max = Σ letterCount × 10 = 530. |
| R-81 | 6 | V | 10 per letter in the columns, `QU` 20, unclamped. |
| R-82 (UI) | — | P4–6 | `liveScore`/`displayScore` values are CAP-7 (V). |
| R-83 | 6, 7 | V + P4–6 | Band thresholds and integer comparison, longest word absent with no word (V); names, messages and the "—" display (UI) P4–6; "names delivered by UX" exempt. |
| R-84 | 8 | V + P3 | Record fields, append/remove, at most once, never replayed, ties, statistics set (V); persistence, same-task writes, Q-39 order are shell, epic 3. |
| R-85 | 2 | V | `LangData`, one `letterCount`; "English only" exempt. |
