---
id: 2
type: story
title: "Compose and destination-block scenes"
parent: epic-how-to-play-scenes
covers: [HP-3, HP-5, HP-6]
after: [1]
risk: low
---

# Compose and destination-block scenes

## Description

Adds scene 2 (compose) and scene 3 (destination block) in the scene format of ticket 8.1 (player, fixture, script, reduced-motion frames, static cards), not restated. Captions are the epic Notes' scene 2 and scene 3 captions verbatim in text.ts howTo (U+2212 where given), with each figure's description (HP-6).

- Scene 2 (§8 start, as scene 1): fixtures/how-to-play-compose.json. Commands: drop column 1 count 4 to column 3 (k 1, B left, M = E D K A, R-23); arrange to A K E D (word BAKED, words entry); addFreeLetter cell 6 index 1 (M = A L K E D, word BALKED, Q-31, R-33; words entry); validate. The L in column 3 and the L on WordCell 6 are different cards (§8), so scene-local element ids differ.
- Scene 3: fixtures/how-to-play-destination.json. Start: column 1 P E, column 2 S T A, no cells. Commands: drop column 1 count 2 to column 2 (APE), setDestinationCount 2 (TAPE), 3 (STAPE), flip (PEATS), a words entry after each (R-30 to R-32). STAPE is no dictionary word: words entries are structural, only scene 2's validate (BALKED) is dictionary-checked, PEATS is not validated, and canValidate stays true at STAPE (R-38).
- Frames (reduced motion, frame i = state after step i, as 8.1): scene 2: start, lifted, dropped (tray open), A K E D, A L K E D, Validate pressed, BALKED laid out, tray still open, no Place (final); scene 3: start, APE (A locked), TAPE, STAPE (Validate lit), PEATS after Flip (final).
- New static visuals: a WordCell row (L on cell 6), the locked block, Validate, −/+ and Flip, drawn as static markup with control text from text.ts, scene-local target ids, no data-testid or data-card-id (as 8.1).

Interface: src/ui/scenes/ (compose and destination scripts, Frame type widened for the new poses); fixtures/how-to-play-compose.json, fixtures/how-to-play-destination.json; src/engine/scene-replay.ts SceneFixture gains an optional `validatable` list (after command n, canValidate equals a boolean, asserted against the engine view, R-38); text.ts howTo.
Tests: engine replay of both fixtures (U), including validatable; negatives: flipped validatable flag, illegal move, wrong stated score where one is stated, BALKED rejected with an inline dictionary lacking it (rejectedWord), optionally one TABLE-cited rejected case for scene 3; script-vs-fixture test, drawn Validate state equals validatable (U, AD-n); play to last frame by the reduced-motion Next step-through, asserting final-frame content (P6 android); final-frame screenshots under reduced motion (screens). Loop, pause and restart stay covered by 8.1's generic tests.
Owns: scenes 2 and 3 and their captions.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright android tests that step each scene to its last frame, a final-frame screenshot baseline of each, and an engine replay that passes for both fixtures and fails when a validatable flag is flipped or BALKED is missing from the dictionary.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md (HP-3b, HP-3c, HP-5, HP-6, Notes)
- continuity — story-scene-player-first-scene-and-engine-replay-harness.md (8.1) and its plan
- rules — docs/game-flow-spec.md, R-10, R-20, R-23, R-30 to R-38, §8
- code — src/ui/scenes, fixtures/how-to-play-drag.json, src/engine/scene-replay.ts, src/engine/commands.test.ts TABLE
- constraint — ARCHITECTURE-SPINE.md#ad-1
