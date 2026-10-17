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

Ticket fields (`tickets.toml`, entry 7): interface — new scripts, `fixtures/how-to-play-*.json`, `text.ts` captions, removes the old drag, compose and destination-block scenes; owns — Scenes 1 and 2 and their captions; risk medium; hitl false (the owner reads the captions at done; not a build gate).

This ticket refines the toml entry: the rule refs are R-10, R-13, R-20, R-23, R-30 to R-38 (not R-21). The owner or ticketing tool syncs `tickets.toml` at done.

### Content

Both scenes use the existing player and stage (8.6), so HP-1 and HP-2 come unchanged. The owner's 2026-10-17 "fuller board" decision supersedes HP-3's exact columns. Keep column 1's tail E D K A and WordCell 6's L (`docs/game-flow-spec.md` §8); column 3 is redecorated, and extra cards are decoration in the fixture `start`, the single source of truth, which the replay accepts. Only `words` entries that are dictionary words are stated; the builder may change the sequence if the engine rejects it, recording the substitute in the plan; it may change only the `arrange` ids or column 3's decoration. 

Default, verified against the engine and `generated/dictionary/en.txt`: column 3 = M U N B (top to bottom). Scene 1 commands: `drop` 1 to 3 (4 cards), `setDestinationCount` k=2, k=3 (UNBEDKA), `arrange` [0, 22, 8, 6] (CardIds of A K E D, checked against `start`; UNBAKED), `setDestinationCount` k=2, k=1 (BAKED), `flip` (draft AKEDB, not a word). Scene 2's first command after `opens` is `flip` (side back to left, BAKED), then `addFreeLetter` cell 6 index 1 (BALKED), `validate`. Scene 1 ends on a non-word because no flipped word survives the free letter L (checked over the dictionary), so scene 2 flips back before it validates. Dropping that Flip, or changing the tail, is a design change for the owner, not the builder; the owner reads the Flip-ending draft at done.

Invariants for any sequence:

- Every command is legal (R-10, R-13, R-20, R-23); `validatable` and `block` entries exist at every `after`; Validate is lit unless structurally illegal (R-38).
- Column 3 with k above 1 must spell with the lifted cards.
- The D block is never reordered or interleaved with M (R-31, R-32); −/+ and Flip change only k and side (R-30, R-31). Flipped (side right) the word is M then D reversed (R-30).
- The free letter joins M, never D, at an index inside M (R-33, R-34); `arrange` permutes M only.
- Scene 1 includes a drop, at least one + and one −, an arrange and a Flip, and ends on the flipped draft; scene 2 taps WordCell 6 and ends on `validate`.

### Scene 1 to 2 continuity

Scene 1's final frame and scene 2's first frame are the same board. Scene 2's fixture carries scene 1's commands as a prefix (same `start`) and a new optional `opens: n` field marking where its animation begins. `opens` is added to the harness `SceneFixture` (`src/engine/scene-replay.ts`, test support from ticket 1: no rule, command, `SESSION_VERSION` or `index.ts` change) and to the UI's `SceneFixtureData` (`src/ui/scenes/types.ts`). It is the number of prefix commands (the first animated command has index `opens`, so `after: opens` is the pre-animation state; 7 for the default), an integer 1..`commands.length`-1 equal to scene 1's `commands.length`; `words`, `validatable` and `block` indices are absolute over the prefix-extended list. `defineScene` fails fast unless scene 2's steps animate only commands at index >= `opens`. The UI never replays the engine (AD-1): scene 2's first frame is built from the same exported final-frame constants as scene 1's last frame (AC5 tests it), and the engine test proves the fixture equality.

### Reorder animation

The step order is grab, move, drop, taps for + (k=2, k=3), arrange, taps for − (k=2, k=1), Flip. The reorder is a new `StepType` `arrange` in `src/ui/scenes/script.ts` (the `move` type's pointer ghost does not fit; `COMMAND_TYPES.move` drops `arrange`), bound to the fixture `arrange` command in the command-fit table, kind `snap` (what the game's own FLIP glide uses for `arrange`, `src/ui/flip.ts` `motionKind`). The pointer ghost is hidden and the tiles glide from the Frame `order` change, so the Animation speed preference scales it through `duration()` and no `FACTOR` kind is added. No `move` step names an `arrange` command. Under reduced motion the frame shows the arranged order (HP-2).

### Replacement end state

The old drag, compose and destination scripts (`src/ui/scenes/drag.ts`, `compose.ts`, `destination.ts`), fixtures (`how-to-play-drag.json`, `-compose.json`, `-destination.json`), `text.ts` keys `howTo.scenes.drag/compose/destination`, and their cases in `src/engine/how-to-play-scenes.test.ts`, `src/ui/scenes/scenes.test.ts`, `carousel.test.ts`, `e2e/how-to-play.spec.ts` and `e2e/how-to-play.screens.spec.ts` are removed or replaced by two scenes: `move-compose` (`fixtures/how-to-play-move-compose.json`, `src/ui/scenes/move-compose.ts`) and `free-letter` (`fixtures/how-to-play-free-letter.json`, `free-letter.ts`). `scenes/index.ts` `basicScenes` lists the new scenes first; the basic list loses one entry. The test `FIXTURES`/`DICT` lists and imports are updated; a grep for `dragScene`, `composeScene`, `destinationScene`, the three fixture filenames, `howTo.scenes.drag/.compose/.destination` and imports of `drag.ts`/`compose.ts`/`destination.ts` finds nothing in `src/` or `e2e/`. Comments naming the removed scenes in `geometry.ts` and `tray-scene.ts` are updated; those two helpers stay and the new scenes reuse them; `place.ts` is untouched. Screenshot baselines in `e2e/how-to-play.screens.spec.ts-snapshots/` are regenerated only in the Docker image (`npm run test:screens`, AGENTS.md); the old ones are deleted. Missing Docker is a blocker, not a skip. The later scenes (tickets 8.8 on) and their start positions are not changed. The bundle stays within the 600,000-byte budget (HP-7, in `test:all`).

### Captions (DRAFT, for the owner's review)

Set in `src/ui/text.ts` as `howTo.scenes.moveCompose` and `howTo.scenes.freeLetter`; the old keys are removed. Built from owner-approved pieces in the epic Notes; the composite is a draft, not final.

- Scene 1: "Press a card and drag: it takes every card below it. Drop the stack on a column and arrange the cards into a word. The cards you land on stay in order and can't be shuffled. −/+ choose how many; Flip makes the word read upward instead."
- Scene 2: "Tap a WordCell to borrow its top card. The top card of each WordCell can be used as a free letter added to the word. Then Validate."

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay passes for both fixtures and scene 2 provably starts from scene 1's final position; Playwright android plays both.

1. Engine replay (`src/engine/how-to-play-scenes.test.ts`, names start with the R-ids they cover, HP-5 where none fits): both fixtures replay with every move legal, stated words matching the engine, `validatable` flags matching. Scene 2's last command is `validate` and its final frame is the state after the Validate tap (`canValidate` false after it, as in the old compose fixture).
2. Continuity (same file): a helper compares (a) scene 2's `start` deep-equals scene 1's, (b) scene 2's first `opens` commands equal scene 1's commands one by one, (c) replaying scene 1, and scene 2's first `opens` commands, gives deeply equal engine views (columns, WordCells, draft card order, k, side), and scene 2's `block` and `validatable` entries at `after: opens` match; no `words` entry is needed for the join. The positive test calls the helper; the negative test mutates a copy (a start card or a prefix command) and asserts the helper throws.
3. Playwright (`e2e/how-to-play.spec.ts`, `android`; names start with the covered R-ids and AD-14 as their siblings do, `HP-1` only for carousel tests): per scene, open How to play, go to the scene by its dot, under reduced motion step Next to the last frame and assert the caption and the final state (scene 1: tiles A K E D and the right-side B block, not a word; scene 2: the pressed-Validate tray showing BALKED); a tap pauses and a second tap restarts it.
4. Screenshots (`e2e/how-to-play.screens.spec.ts`, `npm run test:screens`): one final-frame baseline per scene.
5. Unit tests (`src/ui/scenes/scenes.test.ts`, names start `AD-14`): the `arrange` step's kind is `snap`, its total ms doubles when the base ms doubles (via `duration()`), and no `move` step names an `arrange` command; the free-letter script's frame 0 (tile order, k, side, block, cells) deep-equals the move-compose script's last frame.
6. Text only in `src/ui/text.ts` (HP-6): a unit test (name starts `AD-14`) asserts each figure's caption equals its `text.ts` string and scene 2's contains the owner sentence verbatim.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-10, R-13, R-20, R-23, R-30 to R-38
- code — src/ui/scenes/
