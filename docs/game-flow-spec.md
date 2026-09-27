# WordCell – Game flow specification

Status: v0.8, 2026-09-27. Jared answered Q-01…Q-33 on 2026-09-26 (Q-26…Q-33 were raised by the
review loop, see `game-flow-spec.review-log.md`); the decisions are recorded in §9 and applied to
the rules below. There are no open questions. v0.6 only refines the test-coverage rule in this
preamble, as the product brief's success criterion 4 requires. v0.7 adds Q-34 (a short drag that never leaves its source column is a cancel,
R-14) and Q-35 (the record stores the longest word's spelling, R-84), both raised by the UX review
loop and answered by Jared. v0.8 adds Q-36…Q-43, raised by the architecture spine's review and
answered by Jared on 2026-09-27; Q-41 amends the §2 replay paragraph and Q-43 refines R-84's
record identity. Every rule has an id (R-xx) so
tests, specs and tickets can cite it. A "(UI)" in a rule's id tags the whole rule; a trailing
"(UI)" tags only the sentence it ends. Tagged rules and sentences are satisfied by a Playwright
test naming the R-id; every untagged sentence that states engine behaviour by an engine unit test
naming the R-id; every untagged sentence that states app-shell behaviour (dictionary load, R-38;
visible-time clock, R-76; storage and version rejection, §2) by a Playwright test naming the R-id
or the section. Sentences that assign ownership, record provenance or describe versioning process
need no test; the ticket plan names them. This document is the authoritative input to the BMAD
brief, UX design and architecture spine.

## 1. Vocabulary

| Term | Meaning |
|---|---|
| Column | One of 8 tableau stacks, fanned so every letter is readable (all cards are face-up). Stack tails are taken from the **bottom**. |
| Stack tail | The bottom card of a column plus any number of cards directly above it, taken as one contiguous slice. It may be a single card or the whole column. Position only: there is no ordering or pattern requirement (nothing like a poker straight). |
| WordCell | One of 8 scoring stacks numbered 3–10. Starts empty. Only its **top** card is usable; all of its cards may be viewed (R-65). |
| Free letter | The top card of a WordCell, usable at most once per word. |
| Free letters (F) | The free letters chosen for the word, at most one per WordCell (R-33). |
| Movable part (M) | S ∪ F, freely arranged in the tray (R-34). |
| Source tail (S) | The stack tail the player picks up. All of it must be used in the word. |
| Destination column | The column whose bottom cards (D) join the word; the column itself receives nothing. May equal the source column. |
| Destination tail (D) | A stack tail of the destination column, in its existing order, used at one end of the word. At least one card unless the column is empty (R-31). |
| Flip | Toggling `destinationSide` between left and right (R-30). |
| Tray | The horizontal word-formation area where S, D and free letters are arranged. |
| Move | The stored record created by a drop (§2), committed or not. A **committed move** is one before `cursor.index`. The **move history** is `moves`; Undo steps back through the phases of a move (R-70). |
| Draft | The move currently in progress (not yet committed). |
| Pending draft | An undone, not yet discarded move at `moves[cursor.index]` while Idle (§2). |
| Phase | The player-visible state of the draft: **Idle** (no active draft), **Composing** (tail dropped, tray open), **Place** (word validated; choosing a WordCell and ordering the cards). See §4 for how rules R-10…R-52 map onto them. |
| Letter count | Sum of the letter values of the cards. Every card is worth 1 except `QU`, which is worth 2. Used for every purpose: minimum length, WordCell eligibility and scoring (R-36, R-40, R-80). Letter values are data per language (R-85). |

## 2. Game state

```
Session {
  version: number
  seed: number
  moves: Move[]                 // every move the player has started, in order (see below)
  cursor: { index: number, phase: 'idle' | 'composing' | 'place' }
  gaveUp: boolean               // R-75; status is derived (see below)
  activeMs: number              // R-76
}
Move {
  // present from Composing on
  sourceColumn, sourceCount,           // S = bottom `sourceCount` cards of sourceColumn
  destinationColumn, destinationCount, // D = bottom `destinationCount` cards (after S removed if same column)
  destinationSide: 'left' | 'right',   // left = word reads down the column; right = reversed, word reads up
  freeLetters: WordCellNumber[],       // which WordCells contributed their top card (≤ 1 each);
                                       // denormalised; validated on replay: the top cards of the
                                       // listed cells must equal, as a set, the cards of
                                       // `arrangement` that are not in S, and no cell may be
                                       // listed twice; otherwise an error (CLAUDE.md rule 6)
  arrangement: CardId[],               // final left-to-right order of S ∪ free letters (the movable part)
  reached: 'composing' | 'place' | 'committed', // furthest phase state valid for the current
                                                 // draft data; lowered by edits and by
                                                 // Validate (R-71)
  // present iff `reached ≥ 'place'` (defaults: highest legal cell, word order)
  targetCell?: WordCellNumber,
  placementOrder?: CardId[]            // bottom → top order of all word cards as placed on targetCell
}
```

- `moves[0 … cursor.index)` are committed and applied to the tableau.
- If `cursor.phase ≠ 'idle'`, `moves[cursor.index]` is the draft, shown at that phase. In Idle,
  `moves[cursor.index]`, if present, is the pending (undone) draft: Redo from Idle enters its
  Composing; a drop in Idle writes the new draft at `moves[cursor.index]` and truncates `moves`
  after it.
- Any moves after that are the **redo tail**. The redo data is (a) the draft's phase states
  beyond `cursor.phase` up to its `reached`, and (b) the redo tail (R-71).
- Invariant: every move before `cursor.index` has `reached = 'committed'`, and only the last
  element of `moves` may have `reached ≠ 'committed'`.
- `cursor.index` is CLAUDE.md's `undoIndex`; `cursor.phase` refines it.
- Session extends CLAUDE.md's `{seed, moves, undoIndex}` with two per-game fields that are not
  derivable from moves (`gaveUp`, `activeMs`) and stores the draft and redo tail inside `moves`;
  positions remain purely replay-derived (confirmed, Q-32; CLAUDE.md rule 2 cites this section).
- `CardId` is the card's index 0–51 in the canonical unshuffled deck (alphabetical by R-01's
  distribution, `QU` in the Q slot); its letter is derived from that.
- `WordCellNumber` is 3 … 10. `sourceColumn` and `destinationColumn` are 1-based, matching §3
  and §8.
- `version` identifies the Session schema; a saved session with an unknown version is rejected
  on launch (no silent migration, CLAUDE.md rule 6): the app shows a message naming the version
  and offers New game, and the stored session is not overwritten until the player starts one.
  The score history (R-84) has its own version: an unreadable or unknown-version history is
  reported with a message naming its version and a Reset history action, the stored score
  history is never overwritten silently, and statistics are unavailable until the player resets
  it. A game that finishes meanwhile still finishes; its record is not written and the end
  screen repeats the message with the Reset action (Q-33).
- Columns and WordCells are never stored; they are `replay(seed, moves.slice(0, cursor.index))`
  (R-70). The word string, score and legality are likewise derived. Nothing is stored twice.
- Replay re-applies the structural rules to every element of `moves` in sequence: each committed
  move, then the draft or pending draft at its `reached` state, then each redo-tail move at its
  own `reached` state (every redo-tail move is committed except, possibly, the last element of
  `moves`: an undone pending draft that a further Undo pushed into the redo tail, Q-41). A move is validated only against the rules of the phase states up to its
  `reached` value: Composing → R-10–R-13, R-20–R-22, R-30–R-35; Place or committed →
  additionally R-36, R-40–R-41 and R-50 (`placementOrder` is a permutation of S ∪ F ∪ D). The
  first violation aborts the load and is surfaced exactly like an unknown `version` (message,
  New game offered, stored session not overwritten). Replay never consults the dictionary:
  membership is checked only at Validate (R-38), committed words are trusted, and dictionary
  changes do not bump `Session.version`.
- `status` (`playing` | `won` | `gaveUp`) is derived: `gaveUp` if the flag is set (R-75), else
  `won` when every column is empty in Idle (R-62), else `playing`.
- A game is **in progress** when status = playing and `moves.length > 0` (R-74).

## 3. Setup

- **R-01** Deck: 52 cards, English distribution in `requirements-carryover.md` §1. `QU` is one card.
- **R-02** Shuffle with a seeded PRNG; the same seed always produces the same deal on every device.
  The PRNG and shuffle algorithm are chosen by the architecture step and frozen once shipped;
  changing them bumps `Session.version`. One golden-deal test pins a seed.
- **R-03** Deal round-robin, left to right, into 8 columns (Q-10): the i-th card of the shuffled
  deck (i from 0) goes to column (i mod 8) + 1; within a column each dealt card is placed below
  the previous one, so the first card dealt is the column's top and the last dealt is its bottom
  (the card that can be picked up alone). Result: columns 1–4 hold 7 cards, columns 5–8 hold 6.
- **R-04** All eight WordCells start empty. `moves = []`, `cursor = {0, idle}`, status = playing.

## 4. The move, phase by phase

The tableau does **not** change until the move is committed (R-60). Everything before that is a
draft; Undo steps back through it one phase at a time (R-70). The rule groups A–E below are
finer than the player-visible phases: A + B + C happen inside **Composing** (a drag from a
column to a column opens the tray directly); D + E happen inside **Place**, one screen (Q-22).
No-ops named below are UI-level (the control is disabled or the gesture is ignored by the
renderer); the engine throws on an illegal command (k out of range, duplicate free letter, Undo
with nothing to undo, Redo without redo data) (CLAUDE.md rule 6).

### Phase A – Pick up a source tail
- **R-10** The player selects a card in a column; the selection is that card and every card
  below it (the tail must reach the bottom of the column).
- **R-11** A stack tail may be the entire column.
- **R-12** Cards in WordCells cannot be selected as a source tail (they enter only as free letters).
- **R-13** At least one card must be picked up; a word made only of destination cards and free
  letters is not a legal move (Q-11). Such a word can still be played by picking those column
  cards up as the source tail and dropping them on an empty column (R-22), including their own
  column when they were the whole column (Q-30); this is an accepted consequence of Q-11 with
  Q-12 (Q-27).
- **R-14 (UI)** Selecting a tail without dropping it on a column (tap-to-select, Q-18) is
  transient UI state, not a phase: a tap on any card or placeholder slot of another column is a
  drop, as is a drop on the source column (the gesture is a UX deliverable, §7.1; the test binds
  to the gesture UX confirms); a tap on another card of the source column re-selects from that
  card (R-10); a tap on the selected card itself is a no-op; a tap on a WordCell deselects and
  does not open the view (R-65); taps outside all columns deselect. A drag released over no
  column returns the tail with no engine command and no move-history change, and so does a drag
  whose drop target never left the source column (Q-34); a drag that leaves the source column
  and returns to it drops on the source column. The selection is not persisted or undoable.

### Phase B – Choose a destination column
- **R-20** Any of the 8 columns, including the source column.
- **R-21** If the destination is the source column, the destination tail is drawn from the cards
  that remain after S is removed.
- **R-22** An empty column is a legal destination, including the source column when S is the
  whole column (R-11, R-21; Q-30). It is the only case where D is empty (R-31); this is the
  benefit of emptying a column.
- **R-23** On drop the draft starts with k = 1, or 0 if the destination column is empty after
  R-21; `destinationSide = 'left'`; no free letters; and `arrangement` = S in its column's
  top-to-bottom order. The drop position never chooses k (Q-26).

### Phase C – Compose the word in the tray
- **R-30** The word is `D_left + M + D_right`, where M is a permutation of S ∪ F (F = chosen free
  letters), and exactly one of D_left / D_right is the destination tail (or both are empty when
  the destination column is empty).
  - `destinationSide = 'left'`: D appears in top-to-bottom column order, then M. The word reads
    downward from the column into the new cards.
  - `destinationSide = 'right'`: M, then D **reversed** (reversal is by card; a `QU` card keeps
    its internal letter order). The word reads upward.
  - Example from the rulebook: with k = 3 (R-31), a column ending `S,T,A` (top→bottom)
    gives `STA…` on the left or `…ATS` on the right.
- **R-31** The destination tail is always contiguous from the bottom of the destination column;
  k = |D| = `destinationCount`. If the column (after S is removed, R-21) is non-empty, the player
  chooses k from **1** to the column's size after R-21, by tapping a card in the destination
  column or with plus/minus (Q-23). Tapping a card sets k so that card is the top of D (it and
  every card below it join the word); tapping the current top of D sets k − 1, clamped at 1
  while the column is non-empty (a no-op at k = 1). Plus/minus change k by one within 1 … the
  column's size after R-21; a press at a bound is a no-op and not an edit (R-71); on an empty
  column both controls are inert. If the column is empty, k = 0; then `destinationSide` is
  stored as `'left'` and ignored, and flip is inert (not an edit, R-71). A word may not be laid
  beneath a non-empty column without joining it (Q-12).
- **R-32** Destination cards are never reordered and never interleaved with M. The tray shows
  them as a fixed block with a visual indication that they cannot be rearranged (UI).
- **R-33** Each WordCell may contribute at most its current top card, and at most once per word.
  Choosing it marks that WordCell "used" for this word, shown as a visual deactivation (UI). A
  tap on a used or empty WordCell in Composing is a no-op (not an edit, R-71). A free letter is
  removed from the word only by the remove-free-letter command, issued from its tile in the tray
  (§7.2); that reactivates the cell and is an edit. The add-free-letter command takes an optional
  insertion index into M and defaults to appending at the right end of M; removing a free letter
  deletes it from `arrangement` without reordering the rest (Q-31).
- **R-34** Cards in M (source cards and free letters) can be arranged in any order and may
  interleave freely (Q-03).
- **R-35** All of S must be in the word. It cannot be partially returned.
- **R-36** Letter count of the word ≥ 3 (`QU` counts as 2 letters, Q-06).
- **R-37** The word must be in the dictionary (ENABLE, filtered at build to words of 3 to 23
  letters: 3 is R-36 and 23 is the longest reachable word, 7 source + 7 destination + 8 free
  letters = 22 cards, plus 1 if one is `QU`; dictionary length equals letter count because `QU`
  is spelled "qu"). The word string is the concatenation of each card's
  letters in tray order, lowercased; `QU` contributes "qu". No proper nouns or abbreviations by
  construction of the list.
- **R-38** Dictionary validation happens only when the player taps **Validate** (Q-07). The
  Validate control is inactive until the structural checks pass (R-30–R-36); the structural
  state and the live word string are the only feedback before the tap. A valid word advances to
  Place. An invalid word shows a message and stays in Phase C: a failed Validate changes no
  draft field, is neither an advance nor an edit, and keeps the redo data (R-71). There is no
  "auto-confirm" preference. The app shell loads the dictionary into a `Set<string>` and passes
  it to the engine's Validate command as data; the engine never loads it (CLAUDE.md rules 1
  and 5).
- **R-39** There is no Cancel. Undo steps back one phase (R-70); from Composing it returns S, D
  and the free letters to where they were. In Composing, cards in columns other than the
  destination column are inert (no drag, no selection; viewing, R-65, is unaffected), and a drag
  started on a destination-column card is treated as a tap on that card (R-31); to change
  source or destination, Undo (UI). In Place all columns and WordCells are inert except target
  selection (R-40) and viewing (R-65) (UI).

### Phase D – Choose the target WordCell (Place screen, with Phase E)
- **R-40** Let L = letter count of the validated word. Legal targets are WordCells numbered ≤ L.
  A word of 10 or more letters may therefore go to any WordCell (Q-05).
- **R-41** A WordCell whose top card was used as a free letter in this word is still a legal
  target (Q-02). The free letter travels with the word to the target.
- **R-42** Validate stores `targetCell` = the highest legal WordCell (R-40), since it scores
  most, and `placementOrder` = word order (R-51). The Place screen pre-selects the stored target
  (UI).

### Phase E – Order the cards for placement (same Place screen as Phase D)
- **R-50** All word cards (S ∪ F ∪ D) are placed on the target WordCell in any order the player
  chooses. The UI shows which card lands on the bottom and which becomes the new top.
- **R-51** Default order is the word order: the word read left-to-right taken as bottom→top, so
  the word's first letter is at the bottom and its last letter becomes the new top card / free
  letter (R-52). The player may reorder before confirming. Changing the target does not reset
  the order.
- **R-52** The new top card of the target WordCell becomes that cell's free letter for later
  words.

### Commit
- **R-60** On confirm, atomically: remove S from the source column; remove D from the destination
  column; remove each used free letter from its WordCell; push the placement order onto the
  target WordCell; `cursor = {index + 1, idle}`. The commit (engine
  operation) never touches later moves. Confirm (player command) first discards the redo data
  per R-71, then commits and sets `reached = 'committed'`; Redo performs the commit without
  discarding.
- **R-61** Any free letter's WordCell now exposes its next card (if any) as the new free letter,
  unless that cell is the target, in which case R-52 applies. It can be used in the **next**
  word, not this one (already enforced by R-33).
- **R-62** After commit, if every column is empty the game is won (status = won).

### Any phase
- **R-65 (UI)** The player may view every card of any WordCell at any time (Q-21), via the view
  gesture chosen by the UX step (§7.9 proposes long-press; the Playwright test binds to the
  gesture UX confirms). Viewing changes nothing: only the top card is usable (R-33), and the
  view does not enter the move history.

## 5. Undo, redo, session

- **R-70** The move history is a linear sequence of phase states: for each move, Composing →
  Place →
  committed (Idle of the next move). **Undo moves the cursor back exactly one phase state**
  (Q-01):
  - Idle with `index > 0`, while status ≠ gaveUp (R-75) → **Place** of the previous move: the
    move is un-applied (its cards return to their columns and WordCells) and the draft is shown
    at Place with its target and placement order intact. Undo from a won game does the same;
    status derives back to playing once the move is un-applied.
  - Place → Composing: the arrangement is intact, the validation result is cleared; target and
    placement order stay in the draft for Redo.
  - Composing → Idle: S returns to its column, D is released, free letters return to their cells.
  - Idle with `index = 0` → nothing; Undo is disabled, unless status = gaveUp (R-75).
- **R-71** **Redo moves the cursor forward one phase state** (Q-09), re-applying the draft
  exactly as it was; only Redo reuses stored later-phase data. Redo is enabled iff
  `moves.length > cursor.index` (Idle) or, in Composing/Place, the cursor is before the draft's
  `reached` state; Redo from Place commits only if `reached = 'committed'`. Redo from Composing
  into Place trusts the stored validation exactly like a committed word and does not consult
  the dictionary (accepted consequence of R-38). Every player action that advances a phase
  (drop, a successful Validate, Confirm) or edits the draft discards all redo data, both (a) the
  draft's later phase states and (b) the redo tail (Q-25): a successful Validate sets
  `reached = 'place'`, deletes any stored `targetCell` and `placementOrder` and computes the
  defaults (R-42, R-51); a draft edit at Composing (arrange tiles, including a reorder that
  swaps two same-letter cards, since `arrangement` is by CardId; add/remove a free letter,
  change k, flip) deletes `targetCell` and `placementOrder` from the draft and sets
  `reached = 'composing'`; an edit at Place (change target, reorder placement) sets
  `reached = 'place'`; in every case the moves after the draft are dropped. An edit is any
  action that changes the draft's stored fields; an action that leaves them unchanged is not an
  edit and keeps the redo data (a failed Validate, R-38). Redo is disabled otherwise, and while
  the game is over (R-75).
- **R-72** Actions within a phase (arranging tiles, changing k, flipping, adding free letters,
  reordering placement) are not undo steps (Q-01). Undo from Composing returns all cards to the
  tableau in one step (there is no per-tile undo); the draft record, including the arrangement,
  stays in `moves` as redo data until a later action discards it (R-71).
- **R-73 (UI)** The whole `Session` (seed, moves including the draft and the redo tail, cursor,
  gaveUp, activeMs) is saved to local storage after **every** change (phase step, draft edit,
  undo, redo, commit, give-up, new game) and whenever the
  app becomes hidden, and restored on launch (every element of `moves` is validated by replay,
  §2). `activeMs` is flushed on those events and when the app becomes hidden, not on timer
  ticks. The player returns to the exact phase they left, including after Android kills the
  backgrounded app. No account, no server.
- **R-74** "New game" starts a fresh seed. "Replay this deal" restarts the same seed. Both ask
  for confirmation if a game is in progress (§2) (UI). Both create a fresh Session
  (`moves = []`, `cursor = {0, idle}`, `gaveUp = false`, `activeMs = 0`); a game abandoned this
  way is not recorded anywhere (Q-29); a replayed seed is a separate game record (R-84). The app
  shell generates the seed (a 32-bit unsigned integer) and passes it to the engine; the engine never
  generates seeds (CLAUDE.md rule 1) (UI). On launch with no stored Session the shell deals a
  fresh seed immediately (UI).
- **R-75** Give up is available only in Idle while status = playing and ends the game (sets the
  `gaveUp` flag, status = gaveUp). It does not touch `moves` or the redo tail. Undo while
  status = gaveUp clears the flag without moving the cursor (so Undo is enabled in gaveUp even
  at index 0, R-70); the game is back in Idle and status derives back to playing (Q-25). Give up
  is not redoable: the player taps Give up again. Redo is disabled while the game is over.
  While status ≠ playing no card can be selected or dropped and no free letter chosen; the only
  available actions are Undo, New game, Replay this deal and viewing a WordCell (R-65).
- **R-76** Game duration is active time only: the clock runs whenever status = playing and the
  app is visible (including a fresh deal), and pauses when the app is hidden or the game is over
  (Q-13). The app shell measures visible time and passes elapsed milliseconds to the engine as
  data; the engine never reads a clock (CLAUDE.md rule 1). It is always recorded for statistics
  (R-84). A "Show timer" preference, default **off**, controls display (UI).

## 6. Scoring and end of game

- **R-80** Score = Σ over WordCells (letter count of the cards in the cell × the cell's number).
  `QU` counts as 2 letters (Q-06). max = (Σ letterCount over the deck) × 10; for the English
  deck 53 × 10 = 530 (cited by R-83).
- **R-81** If the game ended by give-up, subtract 10 per letter remaining in the columns (a `QU`
  left behind costs 20; Q-25). The result is not clamped: a negative final score is recorded as
  is and falls in the lowest band (Q-28).
- **R-82** Score is shown live during play (current committed score) and on the end screen (UI).
- **R-83** End screen shows score, a rating band with a light-hearted message, longest word and
  word count (UI). Bands are defined as a fraction of the language's maximum score so they survive
  letter-value and language changes. Thresholds carried over from the BGA implementation
  (`material.inc.php`) as exact fractions of 520, with a new lowest band: below 156/520 (name
  delivered by the UX step), 156/520 "Getting Started", 260/520 "Good Progress", 370/520 "Well
  Done", 460/520 "Excellent", 520/520 "Perfect Game" (≈ 30 %, 50 %, 71.2 %, 88.5 %, 100 %). A
  band applies when `finalScore × 520 ≥ threshold × max` (integer comparison; finalScore after
  R-81, max from R-80, thresholds 156, 260, 370, 460, 520), so no whole-percent rounding shifts
  a boundary; the highest matching band wins. For English (max 530) this gives ≥ 159, ≥ 265,
  ≥ 378, ≥ 469 and = 530; the BGA absolutes are not hard-coded. The UX step rewrites the names
  and messages in a light-hearted tone (Q-15). Longest word shows "—" when no word was committed.
- **R-84** The score history (Q-16) is the single source for statistics: a game record is
  appended when status becomes won or gaveUp and removed again when that finish is undone
  (R-70, R-75), so a game contributes at most once; a game abandoned via R-74 is never recorded
  (Q-29). A record is self-contained and never replayed: `version`, `seed`, outcome, final score
  (after R-81), longest word (the word as spelled and its letter count, R-36; Q-35; ties to the earliest
  committed word; absent when no word was committed) and active duration (R-76). The undoable finish is always the most
  recent record: starting a new game replaces the Session, so no earlier finish can be undone;
  if the score history is empty or its most recent record is not this game's (matched by seed,
  outcome and active duration, Q-43), Undo removes nothing. The score history is persisted locally beside the Session, with its own version (§2,
  Q-33); the finishing and un-finishing changes write Session and score history synchronously
  in the same task, so no partial state is observable. v1 statistics are only: games played,
  games won, games given up, best score, average score, longest word ever. The remaining
  statistics in `requirements-carryover.md` §6 are dropped from v1 (Q-33). One game is in
  progress at a time.
- **R-85** Letter distribution, letter values (which cards count as more than one letter) and the
  dictionary are data per language. English only in v1 (Q-14). The engine exposes one
  `letterCount(card)` and never counts cards where letters are meant.

## 7. Interaction model (proposal for the UX design step)

This section is how the rules above surface on a touch screen. It is a starting point for
`bmad-ux`, not a rule set.

1. **Drag to move.** Touch a card in a column and drag: the whole stack tail below it lifts (R-10).
   Drop it on a column (including its own) to set the destination (R-20) and open the tray
   (Composing). Alternative for accessibility: tap a card to select the tail, tap a column. With
   a tail selected, a tap on another card of the source column changes the selection; choosing
   the source column as destination needs a distinct affordance (its empty area or a button),
   UX to define.
2. **Tray.** Shows D as a locked block (distinct style, not draggable) at one end with a flip
   button, and M as draggable tiles. Reorder by dragging tiles; no reorder buttons. A non-drag
   alternative for arranging M (tap-to-swap, or keyboard on desktop per Q-24) is for the UX step
   to decide. To change D, tap a card in the destination column (gesture per R-31); D is
   highlighted in the column. Plus/minus on the D block does the same for accessibility (Q-23).
   Tap a WordCell's top card to add it to M (that cell dims); tap it again in the tray to return
   it. The live word string updates instantly; there is no dictionary feedback before Validate.
   The `QU` card carries a visual "×2" indicator (Q-06).
3. **Validate.** A single primary button, inactive until the word is structurally legal (R-38).
   Valid advances to Place; invalid shows a short message and stays in the tray.
4. **Place.** One screen (Q-22): legal WordCells light up with the highest pre-selected, tap to
   change; below, a compact strip shows the placement order bottom→top with the future top card
   marked, drag to reorder. A single Confirm commits with an animation of cards flying to the
   cell.
5. (merged into 4.)
6. **Persistent controls.** Undo, Redo, New game, Replay this deal (may live in a menu), Give
   up, Score, and the timer when enabled. There is no Cancel: Undo is always one tap away and
   steps back a phase (R-70).
7. **Drop targeting** uses card-overlap with the destination column, not the pointer point, so
   fat-finger drops land where the player intends. An empty column keeps a fixed placeholder
   slot of card size that participates in overlap targeting, including the source column's own
   slot when the whole column was lifted.
8. **Layout.** Portrait phone first: WordCells 3–10 in one row above 8 columns; tray slides in
   above the columns when a tail is dropped. Desktop browser widens the same layout. Every touch
   target is at least 44 px (carryover §5).
9. **Viewing a WordCell (R-65).** Long-press a WordCell (≈400 ms without movement) to fan its
   cards in an overlay above the board, bottom to top; release to close. The press never starts a
   drag, and a drag never triggers the press. On desktop, hovering the cell for the same delay
   opens the same overlay. In Idle with no tail selected, a plain tap on a WordCell may also open
   it, since tap has no other meaning there. UX to confirm.
10. **Preferences** in v1: animation speed (fast/normal/slow) and Show timer. No sound effects
    (Q-20), no hints (Q-19), no auto-confirm (Q-07), no keyboard-shortcuts toggle: shortcuts are
    simply available on desktop (Q-24). Preferences are stored separately from the Session, are
    not part of the move history or undo, and survive New game / Replay this deal.
11. **Card art** is decided by the UX step; the BGA sprite sheet (26 cards of 72×96 px,
    alphabetical, `QU` in the Q slot; carryover §1) is a candidate and matches the §2 `CardId`
    order.

## 8. Worked example (from the rulebook)

Columns (top→bottom):
```
col1: F E D K A
col2: X O R I N
col3: L M F B
```
Pick up `E D K A` from col1 (R-10). Destination col3 (R-20). Col3 is non-empty, so at least one
destination card must join the word (R-31): include k=1, `B`, on the left (R-30) and arrange
M = `A K E D` → word **BAKED** (5 letters). Legal targets: WordCells 3, 4, 5 (R-40). If WordCell 6
currently shows `L` as its top card, add it (R-33) and arrange → **BALKED** (6 letters); targets
3–6, and WordCell 6 remains a legal target (R-41). Alternative: destination col1 itself. After
removing S, col1 is `F`; it must be included → **FAKED**, or with `L` → **FLAKED**. Laying
`DEKA…` under col3 without `B` is not allowed while col3 has cards.

## 9. Decisions (Q-01 … Q-43, answered 2026-09-26 and 2026-09-27)

| # | Question | Decision |
|---|---|---|
| Q-01 | Undo inside an in-progress composition? | Undo steps back one **phase** (Idle ← Composing ← Place ← next Idle), never a micro-action within a phase. Undo from Idle returns to the **Place** phase of the previous move, not to the previous Idle. There is no Cancel button. R-70, R-72, R-39. |
| Q-02 | Target may be a WordCell whose top card was used as a free letter? | Yes; the free letter moves with the word to the target. R-41. |
| Q-03 | Free letters interleave among source cards? | Yes, anywhere among S; never among D, which stays a fixed block. R-32, R-34. |
| Q-04 | Destination tail in the middle of the word? | No; beginning or end depending on direction. R-30. |
| Q-05 | Words of 10+ letters? | Any WordCell. R-40. |
| Q-06 | `QU` letter vs card count? | `QU` counts as **2 letters for every purpose**, including scoring. Letter values are data per language so other languages can define similar cards. A visual "×2" style indicator on the card (UX). R-36, R-40, R-80, R-85. |
| Q-07 | Validation feedback? | Only on Validate tap; the button is inactive until structural checks pass. No auto-confirm preference. R-38. |
| Q-08 | Detect "no legal move"? | Not in v1; Give up only. R-75. |
| Q-09 | Redo? | Yes. Any action that advances a phase or edits the draft discards the redo tail. R-71, Q-25. |
| Q-10 | Deal order? | Round-robin. R-03. |
| Q-11 | At least one source card? | Yes. R-13 (with rationale). |
| Q-12 | Zero destination cards on a non-empty column? | **No.** At least one destination card unless the column is empty. New rule vs. the rulebook and the BGA code, chosen as designer. R-22, R-31. |
| Q-13 | Track duration? | Yes, active time; "Show timer" preference, default off. R-76. |
| Q-14 | English only, data-driven? | Yes, with room for other languages. R-85. |
| Q-15 | Rating bands? | BGA thresholds (156/260/370/460/520 of 520) carried over as percentages, plus a band below; light-hearted tone. R-83. |
| Q-16 | One game in progress + score history? | Yes. R-84. |
| Q-17 | Orientation? | Portrait on phone; responsive in browser. |
| Q-18 | Tap-to-select in addition to drag? | Yes. R-14, §7.1. |
| Q-19 | Hints? | None. |
| Q-20 | Sound / animation speed? | No sound in v1; animation speed preference kept. |
| Q-21 | View cards beneath a WordCell's top? | Yes, in v1; long-press preferred, UX to confirm. R-65, §7.9. |
| Q-22 | Merge the BGA-inherited `selectWordCell` and `reorderForWordCell` states (Target, Order) into one screen? | Yes: one **Place** phase with target choice and placement order on one screen, one Confirm. R-40–R-52, R-70, §7.4. |
| Q-23 | Destination-card control: plus/minus (BGA no-drag workaround) or tap in the column? | Tap a card in the destination column as primary (same gesture as source selection), plus/minus kept for accessibility, flip stays a button. R-31, §7.2. |
| Q-24 | Keep the "keyboard shortcuts on/off" preference? | No; shortcuts are simply available on desktop. §7.10. |
| Q-25 | Assumptions from applying Q-01/Q-06/Q-09. | Confirmed: (a) give-up penalty is 10 per **letter** (R-81); (b) editing the draft discards the redo tail (R-71); (c) Give up is undoable back to Idle (R-75). |
| Q-26 | Initial draft state when a tail is dropped (k, side, order of S; does the drop position pick k)? | k = 1 (0 on an empty column), side left, S in column top-to-bottom order; drop position never picks k. R-23. |
| Q-27 | R-13's "nothing is lost" rationale was false under Q-12. Does Q-11 stand? | Yes. A destination-plus-free-letters word needs an empty column; accepted consequence of Q-11 + Q-12. R-13. |
| Q-28 | Give-up penalty can make the score negative. Clamp? | No clamp; negative scores recorded as is, lowest band. R-81. |
| Q-29 | Game abandoned via New game / Replay this deal: recorded in statistics? | No. R-74, R-84. |
| Q-30 | Whole-column self-drop gives k = 0 (R-21). Legal? | Yes; the column is empty once S is lifted. R-22, R-13. |
| Q-31 | Where does an added free letter land in `arrangement`? | Appended at the right end of M; the command accepts an optional insertion index; removal does not reorder the rest. R-33. |
| Q-32 | Session extends CLAUDE.md's `{seed, moves, undoIndex}` with `gaveUp`, `activeMs` and stored drafts. Confirm? | Confirmed; give-up stays a flag, positions stay replay-derived. CLAUDE.md rule 2 updated to cite §2. |
| Q-33 | Statistics scope, and a game finishing while the stored score history is unreadable? | v1 statistics trimmed to games played / won / given up, best score, average score, longest word; the rest of carryover §6 dropped, `validationFailures` removed. Unreadable history: reported with Reset history; a finishing game still finishes, its record is not written. R-84, §2. |
| Q-34 | A drag released over its own source column after a small movement is a self-drop under R-14 and opens Composing. Should a drag whose target never left the source column cancel instead? | Yes (answered 2026-09-27): a drag whose drop target never left the source column returns the tail with no engine command; a self-drop by drag needs the target to leave and return, or tap-select and the source column's `Here` pad. R-14. |
| Q-35 | The end screen and statistics show the longest word itself, but R-84's record names only its letter count. Store the spelling? | Yes (answered 2026-09-27): the record holds the longest word's spelling and its letter count. R-84. |
| Q-36 | Stored preferences with an unreadable or unknown version? | Defaults are used with no message and the stored preferences are overwritten on the next change; the one accepted exception to CLAUDE.md rule 6 (answered 2026-09-27). §7.10. |
| Q-37 | What does an unexpected failure show? | One blocking message: `Something went wrong.`, the error text, and **Reload**; stored data untouched (answered 2026-09-27). §2. |
| Q-38 | Two live instances (installed app plus a tab) writing the same saved data? | The instance that sees another write stops and shows `WordCell is open in another window.` with **Reload** (answered 2026-09-27). R-73, R-84. |
| Q-39 | A save of a finish or un-finish fails halfway? | Score history is written first, then the Session; if the Session write fails, the previous history is written back and the failure message shows; a crash between the two writes is accepted (answered 2026-09-27). R-84. |
| Q-40 | The offline install (service worker, precache) fails? | Nothing is shown to the player and the game works online; the failure is reported in dev and test builds only. A new version activates only once every WordCell window has closed (answered 2026-09-27). |
| Q-41 | §2 replayed every redo-tail move as committed, but Undo past a pending draft leaves it uncommitted in the redo tail. | Each move is validated at its own `reached`; only the last element of `moves` may be below committed (answered 2026-09-27). §2. |
| Q-42 | The dictionary banner's Reload after a deploy removed the old word-list file? | Any 404 on the word list makes the banner's next Reload tap reload the page (never automatically); under the service worker the banner stays until the next launch (answered 2026-09-27). R-38. |
| Q-43 | How does Undo of a finish find its record without tying the score history to scoring rules? | By seed, outcome and active duration; the history's version changes only when the record's shape changes (answered 2026-09-27). R-84. |
