---
id: 7
type: story
title: "Scenes 1 and 2: move and compose, then add a WordCell letter"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5, HP-6]
after: [6]
risk: medium
hitl: false
---

# Scenes 1 and 2: move and compose, then add a WordCell letter

## Description

Scene 1 combines the old drag and destination-block scenes on a fuller board: lift a stack, drop it, the cards are rearranged in the tray with an animated reorder (the pointer does not drag every card), add destination letters with the plus and minus, Flip. Scene 2 starts from scene 1's final state, flips back and adds a WordCell's top card as a free letter (change the word as needed), Validate; its caption includes: The top card of each WordCell can be used as a free letter added to the word. Captions are drafted in text.ts for the owner's review.

Ticket fields (`tickets.toml`, entry 7): interface — new scripts, fixtures, `text.ts` captions, removes the old drag, compose and destination-block scenes; owns — Scenes 1 and 2 and their captions; hitl false (the owner reads the captions at done; not a build gate). This ticket refines the toml rule refs to R-10, R-13, R-20, R-23, R-30 to R-38 (not R-21); the owner or ticketing tool syncs it at done.

### Content

Both scenes use the existing player and stage (8.6). The owner's 2026-10-17 "fuller board" decision supersedes HP-3's exact columns. Fuller means at least the old board's cards plus decoration cards the 8.6 stage can draw (rich-slot geometry: `RICH_SLOT` in `geometry.ts`). Keep WordCell 6's L (`docs/game-flow-spec.md` §8); columns 1 and 3 are redecorated per the owner-set content below; decoration lives in the fixture `start`, the single source of truth. Only dictionary words are stated in `words`; intermediate non-words are not. The builder may change the sequence if the engine rejects it, recording the substitute in the plan, but only the `arrange` ids or column 3's decoration.

Owner-set content (2026-10-17, replaces the earlier E D K A default; the builder verifies it against the engine and `generated/dictionary/en.txt` and records any substitute in the plan, changing only decoration cards and `arrange` ids): the lifted tail is three cards K B A (top to bottom, from a longer column 1 with decoration above), dropped on column 3 whose bottom two cards are D above E (decoration above them, at least one more card so k can reach 3). Scene 1 commands: `drop` 1 to 3 (3 cards), `setDestinationCount` k=2, k=3 (a non-word draft; the + taps), `setDestinationCount` k=2 (the − tap), `flip` (side right: the word reads M then the block reversed), `arrange` K B A to B A K (animated reorder, the pointer does not drag every card), ending on BAKED, a real word (the block D E reversed is ED). Scene 2 starts from that final state (side right, k=2, BAKED): tap WordCell 6 (`addFreeLetter` cell 6, its top card L between A and K), BALKED, tap Validate; steps bound to `addFreeLetter`, `validate`; frame 0 uses `landed: true` plus the shared final-frame constants. Both scenes end on real words, so the "arrange the cards into a word" caption fits. The step order of scene 1 is grab, move, drop, + (k=2, k=3), − (k=2), Flip, arrange; replace any other order in this ticket with it.

Invariants for any sequence:

- Every command is legal (R-10, R-13, R-20, R-23); `validatable` and `block` entries exist at every `after`; Validate is lit unless structurally illegal (R-38).
- D is column 3's bottom k cards, M the lifted cards. Every k satisfies R-31 (1 <= k <= destination column length after the drop).
- The D block is never reordered or interleaved with M (R-31, R-32); −/+ and Flip change only k and side (R-30, R-31). Flipped (side right) the word is M then D reversed (R-30).
- The free letter joins M, never D, at an index inside M (R-33, R-34); `arrange` permutes M only.
- Scene 1 includes a drop, at least one + and one −, a Flip and an arrange, and ends on BAKED; scene 2 taps WordCell 6 and ends on `validate` with BALKED.

### Scene 1 to 2 continuity

Scene 1's final frame and scene 2's first frame are the same board. Scene 2's fixture carries scene 1's commands as a prefix (same `start`) and a new optional `opens: n` field marking where its animation begins. `opens` is added to the harness `SceneFixture` (`src/engine/scene-replay.ts`, test support: no rule, `SESSION_VERSION` or `index.ts` change) and to the UI's `SceneFixtureData` (`src/ui/scenes/types.ts`). It is the number of prefix commands (the first animated command has index `opens`; 7 for the default), an integer equal to scene 1's `commands.length`; `words`, `validatable` and `block` indices are absolute over the prefix-extended list. `defineScene` throws for a step animating a command at index < `opens` (an AD-14 test). The UI never replays the engine (AD-1): scene 2's first frame uses scene 1's exported final-frame constants (AC5), and the engine test proves the fixture equality.

### Reorder animation

The step order is grab, move, drop, taps for + (k=2, k=3), tap for − (k=2), Flip, arrange. The reorder is a new `StepType` `arrange` in `src/ui/scenes/script.ts` (the `move` pointer ghost does not fit; `move` keeps accepting `arrange` in the command-fit table, for the unchanged `source-drop.ts`), binding the same command, kind `snap` (as `src/ui/flip.ts` `motionKind`). The pointer ghost is hidden and the tiles glide from the Frame `order` change, scaled through `duration()`. Reduced motion shows the arranged order (HP-2).

### Replacement end state

The old drag, compose and destination scripts (`src/ui/scenes/drag.ts`, `compose.ts`, `destination.ts`), fixtures (`how-to-play-drag.json`, `-compose.json`, `-destination.json`), `text.ts` keys `howTo.scenes.drag/compose/destination`, and their test cases are removed or replaced by two scenes: `move-compose` (`fixtures/how-to-play-move-compose.json`, `src/ui/scenes/move-compose.ts`) and `free-letter` (`fixtures/how-to-play-free-letter.json`, `free-letter.ts`). `scenes/index.ts` `basicScenes` lists the new scenes first; the basic list loses one entry. Test lists and imports are updated; a grep for the removed scene names, fixture filenames, text keys and imports finds nothing in `src/` or `e2e/`. Comments naming the removed scenes in `geometry.ts` and `tray-scene.ts` are updated; `place.ts` is untouched. Old screenshot baselines are deleted and new ones regenerated only in Docker (`npm run test:screens`); missing Docker is a blocker. Later scenes are unchanged; the bundle stays within budget (HP-7).

### Captions (DRAFT, for the owner's review)

Set in `src/ui/text.ts` as `howTo.scenes.moveCompose` and `howTo.scenes.freeLetter`. Built from owner-approved pieces in the epic Notes; the composite is a draft.

- Scene 1: "Press a card and drag: it takes every card below it. Drop the stack on a column and arrange the cards into a word. The cards you land on stay in order and can't be shuffled. −/+ choose how many; Flip makes the word read upward instead."
- Scene 2: "Tap a WordCell to borrow its top card. The top card of each WordCell can be used as a free letter added to the word. Then Validate."

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green.

1. Engine replay (`src/engine/how-to-play-scenes.test.ts`, names start with the R-ids they cover, HP-5 where none fits): both fixtures replay with every move legal, stated words matching the engine, `validatable` flags matching. Scene 2's last command is `validate` and its final frame is the state after the Validate tap (`canValidate` false after it, as in the old compose fixture).
2. Continuity (same file): a helper compares (a) scene 2's `start` deep-equals scene 1's, (b) scene 2's first `opens` commands equal scene 1's commands one by one, (c) replaying scene 1, and scene 2's first `opens` commands, gives deeply equal engine views (columns, WordCells, draft card order, k, side), and scene 2's `block` and `validatable` entries at `after: opens` match; no `words` entry is needed for the join. The positive test calls the helper; the negative test mutates a copy (a start card or a prefix command) and asserts the helper throws.
3. Playwright (`e2e/how-to-play.spec.ts`, `android`; names start with the covered R-ids and AD-14 as their siblings do, `HP-1` only for carousel tests): per scene, open How to play, go to the scene by its dot, under reduced motion step Next to the last frame and assert the caption and the final state (scene 1: tiles A K E D and the right-side B block, not a word; scene 2: the pressed-Validate tray showing BALKED, following the old compose frame list; builder confirms); in normal motion a tap pauses and a second tap restarts it.
4. Screenshots (`e2e/how-to-play.screens.spec.ts`, `npm run test:screens`): one final-frame baseline per scene.
5. Unit tests (`src/ui/scenes/scenes.test.ts`, names start `AD-14`): the `arrange` step's kind is `snap`, its total ms doubles when the Animation speed preference doubles (motion on, set as the existing duration tests do), and no `move` step in the two new scripts names an `arrange` command; each new script's frames match its fixture (tile order, k, side, block at `after`, extending the existing frame-vs-fixture assertions to scene 2's `opens` frame); the free-letter script's frame 0 (tile order, k, side, block, cells) deep-equals the move-compose script's last frame.
6. Text only in `src/ui/text.ts` (HP-6): a unit test (name starts `AD-14`) asserts each figure's caption equals its `text.ts` string and scene 2's contains the owner sentence verbatim.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-10, R-13, R-20, R-23, R-30 to R-38
- code — src/ui/scenes/

## Notes

- Decision: 2026-10-17, owner: Flip must end on a real word. Scene 1 shows the + up to 3 destination cards, the − back down to 2, Flip, then the animated rearrangement of the moved cards, ending on BAKED; scene 2 continues from that state and adds the WordCell 6 top card L (BALKED). Scene 1 lifts the three cards K B A onto a column ending D E (the Description's owner-set content). Captions stay drafts for the owner's review at done.
- Post-close follow-up (owner decisions D1–D12, 2026-10-22, `011935c`; see the epic Notes): D4 the tap on WordCell 6 appends L (Q-31), then an arrange gives BALKED; D10 column 3 trimmed by k; D1 filler reordered.
