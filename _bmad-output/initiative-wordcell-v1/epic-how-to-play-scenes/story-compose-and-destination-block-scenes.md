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

Adds scene 2 (compose) and scene 3 (destination block) in ticket 8.1's scene format, not restated. Captions are the epic Notes' scene 2 and 3 captions verbatim in text.ts howTo (U+2212 where given), with each figure's description (HP-6).

- Scene 2 (§8 start, as scene 1): fixtures/how-to-play-compose.json. Commands: drop column 1 count 4 to column 3 (k 1, B left, M = E D K A, R-23); arrange to A K E D (BAKED, words entry); addFreeLetter cell 6 index 1 (A L K E D, BALKED, Q-31, R-33; words entry); validate. Arrange CardIds are what `startOf` assigns (lowest free per letter, columns then cells; words entries catch a wrong id); the script maps letters to scene-local element ids (the two Ls differ, §8).
- Scene 3: fixtures/how-to-play-destination.json. Start: column 1 P E, column 2 S T A, no cells. Commands: drop column 1 count 2 to column 2 (APE), setDestinationCount 2 (TAPE), 3 (STAPE), flip (PEATS), a words entry after each (R-30 to R-32). Words entries are structural (STAPE is no word, PEATS is never validated); only scene 2's validate is dictionary-checked.
- Frames (reduced motion, frame i = state after step i, as 8.1). Scene 2: 0 start, 1 lifted, 2 dropped (tray open), 3 A K E D, 4 A L K E D, 5 BALKED, Validate pressed (final; stops before Place, scene 4's). Scene 3: 0 start, 1 APE, 2 TAPE, 3 STAPE, 4 PEATS after Flip (final). Drawn Validate: off, lit exactly when `validatable` is true at the frame's command count, pressed after validate.
- New static visuals: a WordCell row (L on cell 6, drawn used after the borrow, R-33), the locked block, Validate, −/+ and Flip, as inert non-button markup in the aria-hidden node, text from text.ts, scene-local ids, no data-testid or data-card-id (as 8.1).

Interface: src/ui/scenes/ (compose and destination scripts; `Frame` gains tray order, k and side, Validate off|lit|pressed, cell 6 top|used; `Step.command` extends to tap steps); fixtures/how-to-play-compose.json, fixtures/how-to-play-destination.json; src/engine/scene-replay.ts `SceneFixture` gains optional `validatable: {after, canValidate}[]` (`after` a count of commands, like `scores`, asserted against `viewFrom` canValidate, R-38): scene 2 false after 0, true after 1 to 3, false after 4; scene 3 false after 0, true after 1 to 4. A rejected validate in `commands` is not thrown (8.1 tests rely on it); the positive replay asserts `rejectedWords` all undefined.
Tests: replay of both fixtures with inline Set {'baked', 'balked'} (FIXTURES, so the named repro case gains both), asserting validatable and `rejectedWords` all undefined; negatives: flipped validatable; setDestinationCount 0 after scene 3's drop throws `r31-destination-count` (cf. TABLE R-31 'k = 0'); compose with Set {'baked'} gives last `rejectedWords` 'balked'; script-vs-fixture and drawn Validate per validatable (U, AD-n); reduced-motion Next step-through to the last frame (P6 android); final-frame screenshots (screens). Names: R-23, R-30 to R-33, R-38 (replay), AD-n (UI unit), HP ids trailing.
Owns: scenes 2 and 3 and their captions.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, with android tests stepping each scene to its last frame, a final-frame baseline of each, and an engine replay that passes for both fixtures and fails on a flipped validatable flag or BALKED missing from the dictionary.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md (HP-3b, HP-3c, HP-5, HP-6, Notes)
- continuity — story-scene-player-first-scene-and-engine-replay-harness.md (8.1) and its plan
- rules — docs/game-flow-spec.md, R-10, R-20, R-23, R-30 to R-38, §8
- code — src/ui/scenes, fixtures/how-to-play-drag.json, src/engine/scene-replay.ts, src/engine/commands.test.ts TABLE
- constraint — ARCHITECTURE-SPINE.md#ad-1
