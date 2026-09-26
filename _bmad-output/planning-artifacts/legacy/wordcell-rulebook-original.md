Rulebook
WordCell is a solo word game in the likeness of FreeCell, where you form words to clear all cards from the play area with a high score.

Components:
52 card deck of letter cards, including Qu as a single card.
8 WordCell placeholder cards numbered 3-10 to indicate the word length required for each WordCell

Setup is similar to FreeCell.  The entire deck is dealt to 8 columns.  The first 4 columns will have 7 cards, the last 4 will have 6 cards.  WordCell placeholder cards should be placed above the columns in order (3-10) above the columns.

Game flow:
- Select source letters
- Select destination column
- Add WordCell letters (optional)
- Create word
- Move used letter cards to a WordCell

The player may choose any number of cards from the bottom of a single column, pick them up, rearrange them, and place them in any column (including the same one) to form a word.  The resulting word may read upwards or downwards.  The word must use all cards that were initially selected, and may use any number of cards in the destination column, although the destination column cards may NOT be rearranged.  Finally, one card from the top of each WordCell may also be added to the moved cards to help form a word (WordCells are initially blank but will be added to throughout the game).  A second card from a WordCell may NOT be used after the first is used from that stack, but one may be used from each WordCell.

Allowed words:
- Words must have minimum 3 letters
- No proper nouns
- No abbreviations

After forming a word, all letter cards used to form the word are placed on top of the WordCell placeholder card matching the number of letters in the word created. If the player prefers, they can also place all cards in a lesser WordCell slot.  If the word is greater than 10 letters long, it may be placed in any WordCell slot.  Cards may be rearranged in any order before placing them.  The top letter of each WordCell may be used as a free letter in the next word.

Letters should not be moved until you are certain they will successfully form a word.

The game ends when all cards are moved to WordCells.  Your score is the number of letters in each WordCell times the word length of that WordCell (3-10).

If you are ever unable to form a word, the game ends.  Score as usual, but subtract 10 points for each unused letter card remaining.

Todo: Include a scale showing how good you did with encouraging messages for each level (low being 156 and high being 520)

Gameplay examples:

1) Below represents a portion of the game area
[F][X][L]
[E][O][M]
[D][R][F]
[K][I][B]
[A][X]

The letter E is selected.  All letters below E are also selected as they must also be used to form a word.
The letters are rearranged and placed below [B] to form the word BAKED.
Note that they could also be place in the same column they were selected from, below [F], to form the word FAKED.
If the letter [L] were available at the top of a WordCell from a previously formed word, it could be added to form the word BALKED in the first example or FLAKED in the 2nd.

To clarify the word formation rules, if a destination column ends with STA (going down), the word must start with exactly STA or end with ATS, as in the physical game, the destination words are placed below the column to spell a word, upwards or downwards.  We can represent this in the interface by adding or subtracting destination column cards to the word formation section with a plus/minus button, but also including a button to flip the letters from the left side of the word to the right (reversing them also).

The UI should display selected words in a different interface area for easy reordering and better horizontal readability.  The ability to add WordCell letters should also be available, causing that WordCell to be "deactivated" with a visual indicator of so no further cards can be used from it.

Once the user forms the word, they click a button to check it against the dictionary.  If valid, they must choose a WordCell to move the word cards to.  For a 6 letter word, they may use WordCells 3, 4, 5, or 6 (typically the highest value WordCell). The interface must allow the user to reorder the cards before placing in the WordCell with an indicator of which card will go on the bottom and which on the top.