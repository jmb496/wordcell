# WordCell – Game flow specification (draft for review)

Status: DRAFT 2026-09-26, written from the rulebook and the BGA implementation. Every rule has
an id (R-xx) so tests, specs and tickets can cite it. Section 9 lists the questions that the
rulebook does not settle, each with a proposed default. Once you confirm or change those, this
document becomes the authoritative input to the BMAD brief, UX design and architecture spine.

## 1. Vocabulary

| Term | Meaning |
|---|---|
| Column | One of 8 tableau stacks, fanned so every letter is readable (all cards are face-up). Stack tails are taken from the **bottom**. |
| Stack tail | The bottom card of a column plus any number of cards directly above it, taken as one contiguous slice. It may be a single card or the whole column. Position only: there is no ordering or pattern requirement (nothing like a poker straight). |
| WordCell | One of 8 scoring stacks numbered 3–10. Starts empty. Only its **top** card is usable; whether the rest can be viewed is Q-21. |
| Free letter | The top card of a WordCell, usable at most once per word. |
| Source tail (S) | The stack tail the player picks up. All of it must be used in the word. |
| Destination column | The column the word is laid under. May equal the source column. |
| Destination tail (D) | A stack tail of zero or more cards from the destination column, in their existing order, used at one end of the word. |
| Tray | The horizontal word-formation area where S, D and free letters are arranged. |
| Move | One complete, committed word placement. The unit of undo. |
| Letter count | Number of letters in the word string. `QU` is one card but two letters. |

## 2. Game state

```
GameState {
  seed: number
  columns: Card[8][]          // index 0 = top, last = bottom
  wordCells: { 3: Card[], 4: Card[], … 10: Card[] }   // index 0 = bottom, last = top
  moves: Move[]               // committed moves, in order
  undoIndex: number           // how many of `moves` are applied (enables redo)
  status: 'playing' | 'won' | 'gaveUp'
}
Move {
  sourceColumn, sourceCount,           // S = bottom `sourceCount` cards of sourceColumn
  destinationColumn, destinationCount, // D = bottom `destinationCount` cards (after S removed if same column)
  destinationSide: 'left' | 'right',   // left = word reads down the column; right = reversed, word reads up
  freeLetters: WordCellNumber[],       // which WordCells contributed their top card (≤ 1 each)
  arrangement: CardId[],               // final left-to-right order of S ∪ free letters (the movable part)
  targetCell: WordCellNumber,
  placementOrder: CardId[]             // bottom → top order of all word cards as placed on targetCell
}
```

Everything derived (the word string, score, legality) is computed from state; nothing is stored
twice. `replay(seed, moves.slice(0, undoIndex))` reconstructs any position (R-70).

## 3. Setup

- **R-01** Deck: 52 cards, English distribution in `requirements-carryover.md` §1. `QU` is one card.
- **R-02** Shuffle with a seeded PRNG; the same seed always produces the same deal on every device.
- **R-03** Deal round-robin, left to right, into 8 columns. Result: columns 1–4 hold 7 cards,
  columns 5–8 hold 6. (Round-robin is assumed; see Q-10.)
- **R-04** All eight WordCells start empty. Moves = [], undoIndex = 0, status = playing.

## 4. The move, phase by phase

The tableau does **not** change until the move is committed (R-40). Everything before that is a
proposal that can be cancelled at no cost.

### Phase A – Pick up a source tail
- **R-10** The player selects a card in a column; the selection is that card and every card
  below it (the tail must reach the bottom of the column).
- **R-11** A stack tail may be the entire column.
- **R-12** Cards in WordCells cannot be selected as a source tail (they enter only as free letters).
- **R-13** At least one card must be picked up; a word made only of destination cards and free
  letters is not a legal move. (Assumed; see Q-11.)

### Phase B – Choose a destination column
- **R-20** Any of the 8 columns, including the source column.
- **R-21** If the destination is the source column, the destination tail is drawn from the cards
  that remain after S is removed.
- **R-22** An empty column is a legal destination (D is necessarily empty).

### Phase C – Compose the word in the tray
- **R-30** The word is `D_left + M + D_right`, where M is a permutation of S ∪ F (F = chosen free
  letters), and exactly one of D_left / D_right is the destination tail (or both are empty).
  - `destinationSide = 'left'`: D appears in top-to-bottom column order, then M. The word reads
    downward from the column into the new cards.
  - `destinationSide = 'right'`: M, then D **reversed**. The word reads upward.
  - Example from the rulebook: a column ending `S,T,A` (top→bottom) forces `STA…` on the left or
    `…ATS` on the right.
- **R-31** The destination tail is always contiguous from the bottom of the destination column;
  the player chooses its length k from 0 to the column's (remaining) size via plus/minus.
- **R-32** Destination cards are never reordered and never interleaved with M.
- **R-33** Each WordCell may contribute at most its current top card, and at most once per word.
  Choosing it marks that WordCell "used" for this word (visual deactivation). Removing it from
  the tray reactivates the WordCell.
- **R-34** Cards in M (source cards and free letters) can be arranged in any order and may
  interleave freely. (Assumed; see Q-03.)
- **R-35** All of S must be in the word. It cannot be partially returned.
- **R-36** Letter count of the word ≥ 3 (`QU` counts as 2 letters). See Q-06.
- **R-37** The word must be in the dictionary (ENABLE, lengths filtered at build). No proper
  nouns or abbreviations by construction of the list.
- **R-38** Validation result is shown to the player; an invalid word cannot proceed to Phase D.
  Preference "auto-confirm valid words" skips the explicit confirm tap.
- **R-39** Cancel at any point in Phases A–E returns everything to the tableau exactly as it was.

### Phase D – Choose the target WordCell
- **R-40** Let L = letter count of the validated word. Legal targets are WordCells numbered ≤ L.
  If L > 10, every WordCell is legal.
- **R-41** A WordCell whose top card was used as a free letter in this word is still a legal
  target. (Assumed; see Q-02.)
- **R-42** UI default highlights the highest legal WordCell, since it scores most.

### Phase E – Order the cards for placement
- **R-50** All word cards (S ∪ F ∪ D) are placed on the target WordCell in any order the player
  chooses. The UI shows which card lands on the bottom and which becomes the new top.
- **R-51** Default order is the word order; the player may reorder before confirming.
- **R-52** The new top card of the target WordCell becomes that cell's free letter for later
  words.

### Commit
- **R-60** On confirm, atomically: remove S from the source column; remove D from the destination
  column; remove each used free letter from its WordCell; push the placement order onto the
  target WordCell; append the Move; undoIndex = moves.length.
- **R-61** Any free letter's WordCell now exposes its next card (if any) as the new free letter.
  It can be used in the **next** word, not this one (already enforced by R-33).
- **R-62** After commit, if every column is empty the game is won (status = won).

## 5. Undo, redo, session

- **R-70** Undo steps back exactly one committed Move; it is available whenever undoIndex > 0,
  all the way to the initial deal. Redo re-applies the next move while undoIndex < moves.length.
- **R-71** Making a new move after undo discards the redo tail (moves after undoIndex).
- **R-72** Undo/redo act on committed moves only. An in-progress composition is discarded by
  Cancel, not Undo. (Assumed; see Q-01.)
- **R-73** The whole session `{version, seed, moves, undoIndex, status}` is saved after every
  commit, undo, redo, give-up and new game, and restored on launch. Undo history therefore
  survives app suspend, reload and device restart.
- **R-74** "New game" starts a fresh seed. "Replay this deal" restarts the same seed with an
  empty move list. Both ask for confirmation if a game is in progress.
- **R-75** Give up is available at any time in Phase A (idle) and ends the game (status = gaveUp).

## 6. Scoring and end of game

- **R-80** Score = Σ over WordCells (number of cards in the cell × the cell's number).
- **R-81** If the game ended by give-up, subtract 10 per card remaining in the columns.
- **R-82** Score is shown live during play (current committed score) and on the end screen.
- **R-83** End screen shows score, a rating band with an encouraging message (bands to be
  defined between the rulebook's low 156 and high 520; see Q-15), longest word, word count.
- **R-84** Statistics from `requirements-carryover.md` §6 are accumulated per finished game.

## 7. Interaction model (proposal for the UX design step)

This section is how the rules above surface on a touch screen. It is a starting point for
`bmad-ux`, not a rule set.

1. **Drag to move.** Touch a card in a column and drag: the whole stack tail below it lifts (Phase A).
   Drop it on a column (including its own) to set the destination (Phase B) and open the tray.
   Alternative for accessibility: tap a card to select the tail, tap a column to choose.
2. **Tray.** Shows D (dimmed, with +/− and a flip button) at one end and M as draggable tiles.
   Reorder by dragging tiles. Tap a WordCell's top card to add it to M (that cell dims); tap it
   again in the tray to return it. The live word string and dictionary result update instantly.
3. **Validate / confirm.** A single primary button. With auto-confirm on, a valid word advances
   automatically when the player taps a target WordCell.
4. **Target.** Legal WordCells light up; the highest is pre-selected. Tap to choose.
5. **Placement order.** A compact strip shows bottom→top with the future top card marked; drag
   to reorder; Confirm commits with an animation of cards flying to the cell.
6. **Persistent controls.** Undo, Redo, New game, Give up, Score. Undo is always one tap away.
7. **Drop targeting** uses card-overlap with the destination column, not the pointer point, so
   fat-finger drops land where the player intends.
8. **Layout.** Portrait phone first: WordCells 3–10 in one row above 8 columns; tray slides in
   above the columns when a tail is dropped. Desktop browser widens the same layout.

## 8. Worked example (from the rulebook)

Columns (top→bottom):
```
col1: F E D K A
col2: X O R I X
col3: L M F B
```
Pick up `E D K A` from col1 (R-10). Destination col3 (R-20). Include k=1 destination card `B`
on the left (R-30/31) and arrange M = `A K E D` → word **BAKED** (5 letters). Legal targets:
WordCells 3, 4, 5 (R-40). If WordCell 6 currently shows `L` as its top card, add it (R-33) and
arrange → **BALKED** (6 letters); targets 3–6, and WordCell 6 remains a legal target (R-41).
Alternative: destination col1 itself. After removing S, col1 is `F`; include it on the left →
**FAKED**, or with `L` → **FLAKED**.

## 9. Open questions (please confirm or change the default)

| # | Question | Proposed default |
|---|---|---|
| Q-01 | Does Undo also step back inside an in-progress composition (e.g. undo adding a free letter), or only committed moves, with Cancel for in-progress work? | Committed moves only; Cancel for in-progress. Keeps undo semantics simple and the history replayable. |
| Q-02 | May the target WordCell be one whose top card was used as a free letter in this word? | Yes. |
| Q-03 | May free letters interleave anywhere among the source cards, or only be appended at the ends? | Anywhere (physical game: you hold them all in hand). |
| Q-04 | Could the destination tail ever sit in the middle of the word? | No. Physically it is the column above the laid cards. |
| Q-05 | Word longer than 10 letters: any WordCell allowed? Word of exactly 10: only WordCell 10 and below (all). | Yes to both, per rulebook. |
| Q-06 | `QU` counts as one card but two letters. Does the WordCell eligibility rule (R-40) use letter count or card count? e.g. QUIT = 3 cards, 4 letters. | Letter count (the rulebook says "number of letters in the word"). Scoring still counts cards (R-80). |
| Q-07 | Validation feedback: live as the player arranges, with an explicit confirm, or only on a Validate tap? | Live indicator + explicit confirm; the "auto-confirm" preference removes the confirm tap. |
| Q-08 | Should the game detect "no legal move exists" and offer to end, or rely on the player pressing Give up? Full detection means searching permutations of S ∪ F against the dictionary for every tail/column pair; feasible with pruning but non-trivial. | v1: Give up button only. Detection and hints become a later epic. |
| Q-09 | Include Redo? | Yes (free with event sourcing). |
| Q-10 | Deal order: round-robin like FreeCell, or fill columns one at a time? Only affects which seed produces which deal. | Round-robin. |
| Q-11 | Must at least one source card be picked up, or may a word be formed from destination cards + free letters alone? | At least one source card. |
| Q-12 | May a word use zero destination cards even when the destination column is non-empty (word simply laid beneath)? | Yes ("may use any number"). |
| Q-13 | Track game duration? | Yes, active time only (pause when app hidden). |
| Q-14 | Languages: English only for v1, with letter distribution and dictionary data-driven? | Yes. |
| Q-15 | Rating bands and messages between 156 and 520 (and above/below)? | Draft 5 bands during UX; you supply the tone. |
| Q-16 | One game in progress at a time, plus a history of finished scores? | Yes. |
| Q-17 | Orientation: lock to portrait on phone? | Portrait on phone; responsive in browser. |
| Q-18 | Should the source tail be selectable by tapping a card (accessibility) in addition to dragging? | Yes, both. |
| Q-19 | Hints (preference existed in BGA version): what would a hint be? | Defer; not in v1. |
| Q-20 | Sound effects and animation speed preferences: keep? | Keep animation speed; sound later. |
| Q-21 | WordCells show only their top card. Should the player be able to view the cards beneath (e.g. long-press to fan the stack)? Viewing only; usability stays top card only (R-33). | Not in v1; noted as a candidate feature. |
