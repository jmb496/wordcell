# WordCell – Game flow specification

Status: v0.3, 2026-09-26. Jared answered Q-01…Q-25 on 2026-09-26; the decisions are recorded in
§9 and applied to the rules below. There are no open questions. Every rule has an id
(R-xx) so tests, specs and tickets can cite it. This document is the authoritative input to the
BMAD brief, UX design and architecture spine.

## 1. Vocabulary

| Term | Meaning |
|---|---|
| Column | One of 8 tableau stacks, fanned so every letter is readable (all cards are face-up). Stack tails are taken from the **bottom**. |
| Stack tail | The bottom card of a column plus any number of cards directly above it, taken as one contiguous slice. It may be a single card or the whole column. Position only: there is no ordering or pattern requirement (nothing like a poker straight). |
| WordCell | One of 8 scoring stacks numbered 3–10. Starts empty. Only its **top** card is usable; all of its cards may be viewed (R-65). |
| Free letter | The top card of a WordCell, usable at most once per word. |
| Source tail (S) | The stack tail the player picks up. All of it must be used in the word. |
| Destination column | The column the word is laid under. May equal the source column. |
| Destination tail (D) | A stack tail of the destination column, in its existing order, used at one end of the word. At least one card unless the column is empty (R-31). |
| Tray | The horizontal word-formation area where S, D and free letters are arranged. |
| Move | One word placement, from the moment a tail is dropped on a column until it is committed. The history is a sequence of moves; Undo steps back through the phases of a move (R-70). |
| Draft | The move currently in progress (not yet committed). |
| Phase | The player-visible state of the draft: **Idle** (no draft), **Composing** (tail dropped, tray open), **Place** (word validated; choosing a WordCell and ordering the cards). See §4 for how rules R-10…R-52 map onto them. |
| Letter count | Sum of the letter values of the cards. Every card is worth 1 except `QU`, which is worth 2. Used for every purpose: minimum length, WordCell eligibility and scoring (R-36, R-40, R-80). Letter values are data per language (R-85). |

## 2. Game state

```
Session {
  version: number
  seed: number
  moves: Move[]                 // every move the player has started, in order (see below)
  cursor: { index: number, phase: 'idle' | 'composing' | 'place' }
  status: 'playing' | 'won' | 'gaveUp'
  activeMs: number              // R-76
}
Move {
  // present from Composing on
  sourceColumn, sourceCount,           // S = bottom `sourceCount` cards of sourceColumn
  destinationColumn, destinationCount, // D = bottom `destinationCount` cards (after S removed if same column)
  destinationSide: 'left' | 'right',   // left = word reads down the column; right = reversed, word reads up
  freeLetters: WordCellNumber[],       // which WordCells contributed their top card (≤ 1 each)
  arrangement: CardId[],               // final left-to-right order of S ∪ free letters (the movable part)
  // present from Place on (defaults: highest legal cell, word order)
  targetCell?: WordCellNumber,
  placementOrder?: CardId[]            // bottom → top order of all word cards as placed on targetCell
}
```

- `moves[0 … cursor.index)` are committed and applied to the tableau.
- If `cursor.phase ≠ 'idle'`, `moves[cursor.index]` is the draft, shown at that phase.
- Any moves after that are the **redo tail** (R-71).
- Columns and WordCells are never stored; they are `replay(seed, moves.slice(0, cursor.index))`
  (R-70). The word string, score and legality are likewise derived. Nothing is stored twice.
- `status` is recomputed on every change: `won` when every column is empty in Idle (R-62),
  `gaveUp` after Give up (R-75), otherwise `playing`.

## 3. Setup

- **R-01** Deck: 52 cards, English distribution in `requirements-carryover.md` §1. `QU` is one card.
- **R-02** Shuffle with a seeded PRNG; the same seed always produces the same deal on every device.
- **R-03** Deal round-robin, left to right, into 8 columns (Q-10). Result: columns 1–4 hold
  7 cards, columns 5–8 hold 6.
- **R-04** All eight WordCells start empty. `moves = []`, `cursor = {0, idle}`, status = playing.

## 4. The move, phase by phase

The tableau does **not** change until the move is committed (R-60). Everything before that is a
draft; Undo steps back through it one phase at a time (R-70). The rule groups A–E below are
finer than the player-visible phases: A + B + C happen inside **Composing** (a drag from a
column to a column opens the tray directly); D + E happen inside **Place**, one screen (Q-22).

### Phase A – Pick up a source tail
- **R-10** The player selects a card in a column; the selection is that card and every card
  below it (the tail must reach the bottom of the column).
- **R-11** A stack tail may be the entire column.
- **R-12** Cards in WordCells cannot be selected as a source tail (they enter only as free letters).
- **R-13** At least one card must be picked up; a word made only of destination cards and free
  letters is not a legal move (Q-11). Nothing is lost by this: any such word can be formed by
  picking those same cards up as the source tail, and source cards are freely arrangeable while
  destination cards are not.
- **R-14** Selecting a tail without dropping it on a column (tap-to-select, Q-18) is transient
  UI state, not a phase: tapping elsewhere deselects, and it is not persisted or undoable.

### Phase B – Choose a destination column
- **R-20** Any of the 8 columns, including the source column.
- **R-21** If the destination is the source column, the destination tail is drawn from the cards
  that remain after S is removed.
- **R-22** An empty column is a legal destination. It is the only case where D is empty (R-31);
  this is the benefit of emptying a column.

### Phase C – Compose the word in the tray
- **R-30** The word is `D_left + M + D_right`, where M is a permutation of S ∪ F (F = chosen free
  letters), and exactly one of D_left / D_right is the destination tail (or both are empty when
  the destination column is empty).
  - `destinationSide = 'left'`: D appears in top-to-bottom column order, then M. The word reads
    downward from the column into the new cards.
  - `destinationSide = 'right'`: M, then D **reversed**. The word reads upward.
  - Example from the rulebook: a column ending `S,T,A` (top→bottom) forces `STA…` on the left or
    `…ATS` on the right.
- **R-31** The destination tail is always contiguous from the bottom of the destination column.
  If the column (after S is removed, R-21) is non-empty, the player chooses its length k from
  **1** to the column's size, by tapping a card in the destination column (that card and every
  card below it join the word) or with plus/minus (Q-23). If the column is empty, k = 0. A word
  may not be laid beneath a non-empty column without joining it (Q-12).
- **R-32** Destination cards are never reordered and never interleaved with M. The tray shows
  them as a fixed block with a visual indication that they cannot be rearranged.
- **R-33** Each WordCell may contribute at most its current top card, and at most once per word.
  Choosing it marks that WordCell "used" for this word (visual deactivation). Removing it from
  the tray reactivates the WordCell.
- **R-34** Cards in M (source cards and free letters) can be arranged in any order and may
  interleave freely (Q-03).
- **R-35** All of S must be in the word. It cannot be partially returned.
- **R-36** Letter count of the word ≥ 3 (`QU` counts as 2 letters, Q-06).
- **R-37** The word must be in the dictionary (ENABLE, lengths filtered at build). No proper
  nouns or abbreviations by construction of the list.
- **R-38** Dictionary validation happens only when the player taps **Validate** (Q-07). The
  Validate control is inactive until the structural checks pass (R-30–R-36); the structural
  state and the live word string are the only feedback before the tap. A valid word advances to
  Place. An invalid word shows a message, stays in Phase C and counts as a validation failure
  (R-84). There is no "auto-confirm" preference.
- **R-39** There is no Cancel. Undo steps back one phase (R-70); from Composing it returns S, D
  and the free letters to where they were.

### Phase D – Choose the target WordCell (Place screen, with Phase E)
- **R-40** Let L = letter count of the validated word. Legal targets are WordCells numbered ≤ L.
  A word of 10 or more letters may therefore go to any WordCell (Q-05).
- **R-41** A WordCell whose top card was used as a free letter in this word is still a legal
  target (Q-02). The free letter travels with the word to the target.
- **R-42** UI default highlights the highest legal WordCell, since it scores most.

### Phase E – Order the cards for placement (same Place screen as Phase D)
- **R-50** All word cards (S ∪ F ∪ D) are placed on the target WordCell in any order the player
  chooses. The UI shows which card lands on the bottom and which becomes the new top.
- **R-51** Default order is the word order; the player may reorder before confirming. Changing the
  target does not reset the order.
- **R-52** The new top card of the target WordCell becomes that cell's free letter for later
  words.

### Commit
- **R-60** On confirm, atomically: remove S from the source column; remove D from the destination
  column; remove each used free letter from its WordCell; push the placement order onto the
  target WordCell; finalise the move; `cursor = {index + 1, idle}`; discard any redo tail.
- **R-61** Any free letter's WordCell now exposes its next card (if any) as the new free letter.
  It can be used in the **next** word, not this one (already enforced by R-33).
- **R-62** After commit, if every column is empty the game is won (status = won).

### Any phase
- **R-65** The player may view every card of any WordCell at any time (Q-21), by long-press on
  the cell (see §7.9). Viewing changes nothing: only the top card is usable (R-33), and the
  view does not enter the history.

## 5. Undo, redo, session

- **R-70** The history is a linear sequence of phase states: for each move, Composing → Place →
  committed (Idle of the next move). **Undo moves the cursor back exactly one phase state**
  (Q-01):
  - Idle with `index > 0` → **Place** of the previous move: the move is un-applied (its cards
    return to their columns and WordCells) and the draft is shown at Place with its target and
    placement order intact. Undo from a won game does the same and sets status back to playing.
  - Place → Composing: the arrangement is intact, the validation result is cleared; target and
    placement order stay in the draft for Redo.
  - Composing → Idle: S returns to its column, D is released, free letters return to their cells.
  - Idle with `index = 0` → nothing; Undo is disabled.
- **R-71** **Redo moves the cursor forward one phase state** while a redo tail exists (Q-09),
  re-applying the draft exactly as it was. Any action that advances a phase (drop, Validate,
  Confirm) or edits the draft (arrange tiles, add/remove a free letter, change k, flip, change
  target, reorder placement) discards the redo tail (Q-25). Redo is disabled otherwise.
- **R-72** Actions within a phase (arranging tiles, changing k, flipping, adding free letters,
  reordering placement) are not undo steps (Q-01). Undo from Composing discards the whole
  arrangement.
- **R-73** The whole `Session` (seed, moves including the draft and the redo tail, cursor, status,
  activeMs) is saved to local storage after **every** change (phase step, draft edit, undo, redo,
  commit, give-up, new game) and restored on launch. The player returns to the exact phase they
  left, including after Android kills the backgrounded app. No account, no server.
- **R-74** "New game" starts a fresh seed. "Replay this deal" restarts the same seed with an
  empty history. Both ask for confirmation if a game is in progress.
- **R-75** Give up is available in Idle and ends the game (status = gaveUp). Undo from a
  given-up game returns to Idle with status playing (Q-25).
- **R-76** Game duration is active time only: the clock runs while the app is visible and the
  game is in progress, and pauses when the app is hidden or the game is over (Q-13). It is always
  recorded for statistics (R-84). A "Show timer" preference, default **off**, controls display.

## 6. Scoring and end of game

- **R-80** Score = Σ over WordCells (letter count of the cards in the cell × the cell's number).
  `QU` counts as 2 letters (Q-06). The maximum for the English deck is 53 × 10 = 530.
- **R-81** If the game ended by give-up, subtract 10 per letter remaining in the columns (a `QU`
  left behind costs 20; Q-25).
- **R-82** Score is shown live during play (current committed score) and on the end screen.
- **R-83** End screen shows score, a rating band with a light-hearted message, longest word and
  word count. Bands are defined as a percentage of the language's maximum score so they survive
  letter-value and language changes. Thresholds carried over from the BGA implementation
  (`material.inc.php`), with a new lowest band: below 30 % (name TBD), 30 % "Getting Started",
  50 % "Good Progress", 71 % "Well Done", 88 % "Excellent", 100 % "Perfect Game". The UX step
  rewrites the names and messages in a light-hearted tone (Q-15).
- **R-84** Statistics from `requirements-carryover.md` §6 are accumulated per finished game,
  plus active duration (R-76). One game is in progress at a time; finished scores are kept as a
  history (Q-16).
- **R-85** Letter distribution, letter values (which cards count as more than one letter) and the
  dictionary are data per language. English only in v1 (Q-14). The engine exposes one
  `letterCount(card)` and never counts cards where letters are meant.

## 7. Interaction model (proposal for the UX design step)

This section is how the rules above surface on a touch screen. It is a starting point for
`bmad-ux`, not a rule set.

1. **Drag to move.** Touch a card in a column and drag: the whole stack tail below it lifts (R-10).
   Drop it on a column (including its own) to set the destination (R-20) and open the tray
   (Composing). Alternative for accessibility: tap a card to select the tail, tap a column.
2. **Tray.** Shows D as a locked block (distinct style, not draggable) at one end with a flip
   button, and M as draggable tiles. Reorder by dragging tiles; no reorder buttons. To change D,
   tap a card in the destination column: it and every card below it join the word and are
   highlighted in the column; tap the current top of D to release it. Plus/minus on the D block
   does the same for accessibility (Q-23).
   Tap a WordCell's top card to add it to M (that cell dims); tap it again in the tray to return
   it. The live word string updates instantly; there is no dictionary feedback before Validate.
3. **Validate.** A single primary button, inactive until the word is structurally legal (R-38).
   Valid advances to Place; invalid shows a short message and stays in the tray.
4. **Place.** One screen (Q-22): legal WordCells light up with the highest pre-selected, tap to
   change; below, a compact strip shows the placement order bottom→top with the future top card
   marked, drag to reorder. A single Confirm commits with an animation of cards flying to the
   cell.
5. (merged into 4.)
6. **Persistent controls.** Undo, Redo, New game, Give up, Score, and the timer when enabled.
   There is no Cancel: Undo is always one tap away and steps back a phase (R-70).
7. **Drop targeting** uses card-overlap with the destination column, not the pointer point, so
   fat-finger drops land where the player intends.
8. **Layout.** Portrait phone first: WordCells 3–10 in one row above 8 columns; tray slides in
   above the columns when a tail is dropped. Desktop browser widens the same layout.
9. **Viewing a WordCell (R-65).** Long-press a WordCell (≈400 ms without movement) to fan its
   cards in an overlay above the board, bottom to top; release to close. The press never starts a
   drag, and a drag never triggers the press. On desktop, hovering the cell for the same delay
   opens the same overlay. In Idle a plain tap on a WordCell may also open it, since tap has no
   other meaning there. UX to confirm.
10. **Preferences** in v1: animation speed (fast/normal/slow) and Show timer. No sound effects
    (Q-20), no hints (Q-19), no auto-confirm (Q-07), no keyboard-shortcuts toggle: shortcuts are
    simply available on desktop (Q-24).

## 8. Worked example (from the rulebook)

Columns (top→bottom):
```
col1: F E D K A
col2: X O R I X
col3: L M F B
```
Pick up `E D K A` from col1 (R-10). Destination col3 (R-20). Col3 is non-empty, so at least one
destination card must join the word (R-31): include k=1, `B`, on the left (R-30) and arrange
M = `A K E D` → word **BAKED** (5 letters). Legal targets: WordCells 3, 4, 5 (R-40). If WordCell 6
currently shows `L` as its top card, add it (R-33) and arrange → **BALKED** (6 letters); targets
3–6, and WordCell 6 remains a legal target (R-41). Alternative: destination col1 itself. After
removing S, col1 is `F`; it must be included → **FAKED**, or with `L` → **FLAKED**. Laying
`DEKA…` under col3 without `B` is not allowed while col3 has cards.

## 9. Decisions (Q-01 … Q-25, answered 2026-09-26)

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
