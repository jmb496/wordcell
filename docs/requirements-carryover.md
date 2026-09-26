# WordCell – Requirements carried over from the BGA implementation

Source: `D:\CodeProjects\bga-wordcell` (rulebook, states.inc.php, gameoptions.json,
gamepreferences.json, stats.json, english.json, fix logs). Extracted 2026-09-26.
This is the raw input for the BMAD product brief / PRD. Items marked **NEW** come from
the 2026-09-26 re-platforming discussion and were not in the BGA version.

## 1. Game components

- 52 letter cards. `QU` is a single card. English distribution (sums to 52):
  A3 B1 C2 D2 E4 F2 G1 H3 I3 J1 K1 L2 M2 N3 O3 P2 QU1 R3 S3 T3 U2 V1 W1 X1 Y1 Z1
- 8 WordCell placeholders numbered 3–10, displayed above the columns in order.
- Card art: sprite sheet `img/wc-letter-cards.png`, 1872×96 px, 26 cards of 72×96 px,
  alphabetical left to right (QU occupies the Q slot).
- Dictionary: `english.txt`, 172,724 lowercase words; 125,447 of them are 3–10 letters.
  Contains inflections (aahed, aahing …). Proper nouns / abbreviations must be excluded
  (source list choice is open – see platform decision doc).
- Multi-language architecture (EN/FR/DE/ES option existed) but English-only for v1.

## 2. Setup

- Deal the whole deck into 8 columns: columns 1–4 get 7 cards, columns 5–8 get 6.
- All WordCells start empty.
- **NEW**: deal must be reproducible from a seed (needed for undo/replay, persistence,
  tests, and "play the same deal again").

## 3. Turn structure (state machine from states.inc.php)

```
playerIdle → selectDestinationColumn → formWord → selectWordCell
          → reorderForWordCell → placingCards → playerIdle | gameEnd
```

1. **Select source cards** – any number of contiguous cards from the *bottom* of one
   column. Selecting a card selects everything below it. All selected cards must be
   used in the word.
2. **Select destination column** – any column, including the source column.
3. **Form word** in a dedicated horizontal word-formation area:
   - Selected cards may be freely reordered (reorder controls / drag).
   - Destination column cards may be included as a stack tail (contiguous slice from the bottom) of
     that column, in their existing order (never rearranged). A plus/minus control
     adjusts how many are included.
   - A **flip** control moves the destination tail from the left end of the word
     (word reads downward: e.g. column ending `STA` → word starts `STA…`) to the right
     end reversed (word reads upward: word ends `…ATS`).
   - At most **one** card per WordCell (its top card) may be added. Using it
     "deactivates" that WordCell for the rest of this word with a visual indicator.
   - Word must be ≥ 3 letters, no proper nouns, no abbreviations.
   - **Validate** button checks the dictionary. Preference existed for auto-confirm.
4. **Select WordCell** – for a word of length L, any WordCell numbered ≤ L; if L > 10,
   any WordCell.
5. **Reorder before placement** – cards may be reordered in any order; the UI must show
   which card lands on the bottom and which becomes the new top (the top card is the
   one that will be usable as a free letter next turn).
6. **Place** – used cards move onto the chosen WordCell. Destination column loses the
   included cards; source column loses the selected cards; used WordCell top cards are
   removed from their cells.
7. Cancel was available from every intermediate state (returns to playerIdle).

## 4. Game end and scoring

- Win: all 52 cards are in WordCells. Score = Σ over cells (cards in cell × cell number).
- Give up / stuck: score as above minus 10 per card still in the columns.
- TODO from rulebook: rating scale with encouraging messages, low ≈ 156, high ≈ 520.

## 5. UI / UX requirements

- Word-formation area separate from the columns for horizontal readability.
- Mobile-friendly touch targets (44 px minimum was the BGA guideline).
- **NEW**: primary platform is Android; also playable in a desktop/mobile browser.
- **NEW**: drag-and-drop of stack tails must be fast and glitch-free on touch
  (the BGA version was button/click driven).
- **NEW**: Undo button with unlimited depth back to the start of the game, for the whole
  session (should survive app suspend/reload).
- Preferences that existed: sound effects on/off, animation speed (fast/normal/slow),
  hints on/off, auto-confirm valid words, keyboard shortcuts on/off.

## 6. Statistics that were defined (stats.json)

Games played, average/highest/total score, words formed, letters used, average word
length, games completed vs failed, completion rate, card moves, longest/shortest word,
per-length word counts (3…10+), validation failures, game duration.

## 7. Lessons from the BGA attempt (why it stalled)

- No local run or test loop: every change was uploaded to BGA Studio and exercised by hand.
- Game rules were split between PHP server and a 3,000-line client controller; most
  logged bugs were client/server state desynchronisation, stale DOM closures and
  initialisation-order errors, not rules bugs.
- The 526 commits contain ~30 "attempted fix" commits for the word-formation reorder
  and flip controls alone.

Design consequences for the rewrite:

1. **One pure, deterministic rules engine** (no UI, no I/O) owning deal, selection
   legality, word assembly, validation, placement, scoring, and undo. 100 % unit-testable.
2. UI is a thin, stateless render of engine state; all user gestures become engine
   commands. Undo = engine concern, never a UI concern.
3. Every rule in sections 2–4 becomes a named test case before UI work starts.
