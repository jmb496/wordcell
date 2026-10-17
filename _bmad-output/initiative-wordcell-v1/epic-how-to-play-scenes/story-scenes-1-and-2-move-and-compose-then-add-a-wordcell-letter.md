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

Scene 1 combines the old drag and destination-block scenes on a fuller board: lift a stack, drop it, the cards are rearranged in the tray with an animated reorder (the pointer does not drag every card), add destination letters with the plus and minus, Flip. Scene 2 starts from scene 1's final state and adds a WordCell's top card as a free letter (change the word as needed), Validate; its caption includes: The top card of each WordCell can be used as a free letter added to the word. Fixtures replayed by the engine test; captions drafted in text.ts for the owner's review.

Ticket fields (as in `tickets.toml`, entry 7):

- interface — new scripts, `fixtures/how-to-play-*.json`, `text.ts` captions; removes the old drag, compose and destination-block scenes.
- owns — Scenes 1 and 2 and their captions.
- risk — medium. hitl — false (the owner reads the captions at done; not a build gate).

### Content

Both scenes use the existing player and the whole-play-area stage (8.6), so HP-1 and HP-2 (loop, tap pause/restart, reduced-motion Next frames) come from them unchanged. Default board: the rulebook position of `docs/game-flow-spec.md` §8 (the HP-3 lineage): drop E D K A from column 1 on column 3, arrange to BAKED, use −/+ and Flip on the destination block, then in scene 2 borrow L from WordCell 6 as a free letter (BALKED or the nearest legal word) and Validate. Extra cards on the fuller board are decoration in the fixture `start`, the single source of truth, which the replay accepts. The builder picks the command sequence, the engine checks it; it must meet these invariants:

- Every command is legal (R-10, R-13, R-20, R-23) and every intermediate word is in the fixture's `words` list and in the dictionary. A destination column with k above 1 must itself spell with the lifted cards (column 3 as dealt, L M F B, cannot, so the builder may change the decoration of column 3).
- A `validatable` entry exists for every step; Validate is lit unless structurally illegal (R-38).
- The destination block D is never reordered or interleaved with M (R-31, R-32); −/+ and Flip only change k and side (R-31, R-30).
- After Flip (side right) the word is M then D reversed, reading upward (R-30); the `words` entry for the Flip command states that word, which must be in the dictionary.
- The free letter joins M, never D, and is inserted at an index inside M (R-33, R-34).

### Scene 1 to 2 continuity

Scene 1's final frame and scene 2's first frame are the same board. The fixture format has only a static `start`, so scene 2's fixture carries scene 1's commands as a prefix (`commands[0..n-1]` equal scene 1's `commands`, same `start`) and a new optional `opens: n` field in `SceneFixture` (`src/engine/scene-replay.ts`, harness only, no `index.ts` export) marking where scene 2's animation begins; the UI draws the board after n commands as its first frame. Builder may use another form that needs no larger change, and says so in the plan.

### Reorder animation

The reorder is an `arrange` command shown as a glide of the tray tiles to the arranged order, using the `snap` kind (what the game's own FLIP glide uses for `arrange`, `src/ui/flip.ts` `motionKind`), so the Animation speed preference scales it through `duration()` and no `FACTOR` kind is added. The script has no grab or move ghost steps between the drop and the arrangement. Under reduced motion the frame shows the arranged order (HP-2).

### Replacement end state

The old drag, compose and destination scripts (`src/ui/scenes/drag.ts`, `compose.ts`, `destination.ts`), fixtures (`how-to-play-drag.json`, `-compose.json`, `-destination.json`), `text.ts` keys `howTo.scenes.drag/compose/destination`, and their cases in `src/engine/how-to-play-scenes.test.ts`, `src/ui/scenes/scenes.test.ts`, `carousel.test.ts`, `e2e/how-to-play.spec.ts` and `e2e/how-to-play.screens.spec.ts` are removed or replaced by two scenes: `move-compose` (`fixtures/how-to-play-move-compose.json`, `src/ui/scenes/move-compose.ts`) and `free-letter` (`fixtures/how-to-play-free-letter.json`, `free-letter.ts`). `scenes/index.ts` `basicScenes` lists the new scenes first, replacing three entries by two (eight scenes become seven; scene counts, dot counts and the `sceneOrder` list in the specs follow). Screenshot baselines in `e2e/how-to-play.screens.spec.ts-snapshots/` are regenerated only in the Docker image (`npm run test:screens`, AGENTS.md); the old ones are deleted. The place, scoring and Tricky scenes (tickets 8.8 on) are not changed here, nor are their start positions. The bundle stays within the 600,000-byte budget (HP-7, in `test:all`).

### Captions (DRAFT, for the owner's review)

Set in `src/ui/text.ts` as `howTo.scenes.moveCompose` and `howTo.scenes.freeLetter`; the old keys are removed. Built from the owner-approved captions in the epic Notes.

- Scene 1: "Press a card and drag: it takes every card below it. Drop the stack on a column and arrange the cards into a word. The cards you land on stay in order and can't be shuffled. −/+ choose how many; Flip makes the word read upward instead."
- Scene 2: "Tap a WordCell to borrow its top card. The top card of each WordCell can be used as a free letter added to the word. Then Validate."

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; engine replay passes for both fixtures and scene 2 provably starts from scene 1's final position; Playwright android plays both.

1. Engine replay (Vitest, `src/engine/how-to-play-scenes.test.ts`, names start with R-ids): both fixtures replay with every move legal, stated words matching the engine, `validatable` flags matching, and `rejected` cases matching the `TABLE` rows as before. A continuity test replays scene 1's commands and asserts the resulting columns, WordCells, draft cards, k and side equal scene 2's opening state; a negative test changes one card of scene 2's start (or one prefix command) and asserts the replay fails. Scene 2's last command is `validate` and its final frame is the state after the Validate tap (`canValidate` false after it, as in the old compose fixture).
2. Playwright (`e2e/how-to-play.spec.ts`, `android`, test names start `HP-1`): per scene, open How to play, go to the scene by its dot, under reduced motion step Next to the last frame and assert the caption and the final word and cards; a tap pauses and a second tap restarts it.
3. Screenshots (`e2e/how-to-play.screens.spec.ts`, `npm run test:screens`): one final-frame baseline per scene.
4. Unit test (`src/ui/scenes/scenes.test.ts`, name starts `AD-14`): the reorder is a glide with no grab or move steps between the drop and the arrangement, and its duration is `duration('snap')` times the step's multiple, so it scales with Animation speed.
5. Text only in `src/ui/text.ts` (HP-6): a unit test asserts each figure's caption equals its `text.ts` string and scene 2's contains the owner sentence verbatim.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-10, R-13, R-20, R-23, R-30 to R-38
- code — src/ui/scenes/
