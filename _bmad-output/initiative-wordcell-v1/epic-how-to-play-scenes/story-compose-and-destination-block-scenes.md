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

Adds scene 2 (compose) and scene 3 (destination block) in ticket 8.1's format. Captions are the epic Notes' verbatim (U+2212 where given) in text.ts `howTo.scenes` (`compose`, `destination`), each the figure's `Scene.caption` (HP-6).

- Scene 2 (§8 start; `scene` `compose`): fixtures/how-to-play-compose.json. Commands: 0 drop column 1 count 4 to column 3 (k 1, B left, M = E D K A, R-23); 1 arrange to A K E D (BAKED, words entry); 2 addFreeLetter cell 6 index 1 (A L K E D, BALKED, Q-31, R-33; words entry); 3 validate. Arrange CardIds are what `startOf` assigns (lowest free per letter; words entries catch a wrong id); the script maps letters to scene-local element ids (the two Ls differ, §8).
- Scene 3 (`scene` id `destination`): fixtures/how-to-play-destination.json. Start: column 1 P E, column 2 S T A, no cells. Commands: 0 drop column 1 count 2 to column 2 (APE), 1 setDestinationCount 2 (TAPE), 2 setDestinationCount 3 (STAPE), 3 flip (PEATS), a words entry after each (R-30 to R-32). Words entries are structural (STAPE, PEATS are never validated).
- Frames (reduced motion, frame i = state after step i), n = commands applied; Validate `lit` when `validatable` is true after n, else `off`, except the validate frame, `pressed`. Scene 2 (stops before Place): frames 0 start, 1 lifted: n 0, no tray, off, cell 6 top; 2 dropped: n 1, tray BEDKA, k 1 left, lit, top; 3 A K E D: n 2, BAKED, lit, top; 4 A L K E D: n 3, BALKED, lit, used; 5 final: n 4, BALKED, pressed (overrides false after 4), used. Scene 3 (no cell 6): 0 start: n 0, off; 1 APE, 2 TAPE, 3 STAPE: n 1 to 3, k 1 to 3 left, lit; 4 PEATS after Flip (final): n 4, k 3 right, lit. Tray letters are scene-local.
- Steps: scene 2 grab, move, drop animate command 0; an arrange move 1; tap cell 6 2; tap Validate 3. Scene 3: drop 0; −/+ taps 1 and 2; Flip tap 3. `defineScene` also requires a step's `command`, if any, to match its type (grab and drop a drop, move an arrange, tap addFreeLetter, validate, setDestinationCount or flip); a commandless move stays a pointer move, as scene 2's.
- New static visuals: a WordCell row (L on cell 6, used after the borrow, R-33), the locked block, Validate, −/+ and Flip, inert markup in the aria-hidden node, as 8.1.

Interface: src/ui/scenes/ (compose and destination scripts; `Frame` gains tray order, k and side, Validate off|lit|pressed, cell 6 top|used; `Step.command` extends to move and tap steps; `SceneFixtureData` gains optional `validatable`, AD-1); fixtures/how-to-play-compose.json, fixtures/how-to-play-destination.json; src/engine/scene-replay.ts `SceneFixture` gains optional `validatable: {after, canValidate}[]` (`after` a command count, range-checked 0..count like `scores`, asserted against `viewFrom` canValidate, R-38): scene 2 true after 1 to 3 only, scene 3 true after 1 to 4 only, listing every count. A rejected validate in `commands` is not thrown (8.1 tests rely on it).
Tests: in how-to-play-scenes.test.ts `DICT` becomes {'baked', 'balked'} and FIXTURES gains both: positive replay asserting validatable and `rejectedWords` all undefined; negatives: flipped validatable; validatable joins the out-of-range test; setDestinationCount 0 after scene 3's drop throws `r31-destination-count` (cf. replay.test.ts 'k = 0 on a non-empty destination'); compose with its own Set {'baked'} gives last `rejectedWords` 'balked'; script-vs-fixture (indexes of steps carrying a command cover the fixture commands in order) and drawn Validate per validatable (U, AD-n); reduced-motion Next step-through to the last frame (P6 android); final-frame screenshots (screens). Names: R-23, R-30 to R-33, R-38 (replay), AD-n (UI unit), HP ids trailing.
Owns: scenes 2 and 3 and their captions.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, with android tests stepping each scene to its last frame, a final-frame baseline of each, and an engine replay that passes for both fixtures and fails on a flipped validatable flag or BALKED missing from the dictionary.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md (HP-3b, HP-3c, HP-5, HP-6, Notes)
- continuity — story-scene-player-first-scene-and-engine-replay-harness.md (8.1) and its plan
- rules — docs/game-flow-spec.md, R-10, R-20, R-23, R-30 to R-38, §8
- code — src/ui/scenes, fixtures/how-to-play-drag.json, src/engine/scene-replay.ts, src/engine/commands.test.ts TABLE
- constraint — ARCHITECTURE-SPINE.md#ad-1
