---
id: 4
type: story
title: "Tricky rules section"
parent: epic-how-to-play-scenes
covers: [HP-4, HP-5, HP-6]
after: [3]
risk: low
---

# Tricky rules section

## Description

Adds the Tricky rules section after the five basic scenes with three animated scenes (HP-4) in 8.2's format, each with an engine-replayed fixture. Captions are the owner's epic Notes 2026-10-17 strings verbatim in text.ts `howTo.scenes` (`sourceDrop`, `destinationRule`, `topCard`), each the figure's `Scene.caption` (HP-6); the heading is a new `howTo.headings` entry, "Tricky rules".

- Scene (a) (§8 start; `scene` `source-drop`): fixtures/how-to-play-source-drop.json. Commands: 0 drop column 1 count 4 to column 1 (R-21, F stays, k 1 left, draft FEDKA), 1 arrange to A K E D (FAKED, `words` entry; Q-11 and R-13 hold, the tail is picked up). Because a drag that never leaves the source column is a cancel (R-14, Q-34), the grab, a `move` out of column 1 and back, then the drop animate command 0. `validatable` after 0 false, after 1 and 2 true.
- Scene (b) (`destination-rule`): fixtures/how-to-play-destination-rule.json, one fixture, two halves played in sequence on one figure, never side by side. Its own start, not the §8 position (HP-4 does not require it): columns O A T / R B / empty, cells 3 N A and 4 S T (bottom to top). Commands: 0 drop column 1 count 2 to column 2 (Q-12: B, k 1 left, locked, draft BAT, `words`); 1 undo (resets the board, so the replay stays one linear list); 2 drop column 2 count 1 to empty column 5 (R-22, R-31: k 0, draft B); 3 addFreeLetter cell 3 (A); 4 addFreeLetter cell 4 (T, draft BAT, `words`). Both halves give BAT from different cards: half 1 B joins from the column and A T are lifted; half 2 B is lifted and A, T are free letters (R-13, Q-27). `validatable` listed per count.
- Scene (c) (`top-card`): fixtures/how-to-play-top-card.json. Start: column 1 N A T, column 2 empty, cell 5 R S (S on top). Commands: 0 drop column 1 count 2 to column 2 (AT), 1 addFreeLetter cell 5 index 0 (SAT, `words`).
- Rejected (`rejected`: outcome, check, `row` {id, precondition} from the commands.test.ts TABLE): (b) after 3: setDestinationCount k 1, `throw`, `r31-set-count-empty-destination`, row R-31 "k = 1 on an empty destination column"; half 1 lists none (the k 0 rows are partial self-drop). (c) after 2: addFreeLetter cell 5, `throw`, `r33-free-letter-duplicate`, row R-33 "on a used cell".
- Frames (reduced motion, frame i = state after step i; Next steps through; the last is the resting frame): (a) 0 start, 1 lifted, 2 dropped (n 1, tray F E D K A, F locked, k 1 left, Validate lit), 3 FAKED (n 2, final). (b) 0 start, 1 lifted A T, 2 dropped (n 1, B locked, BAT, lit), 3 undone (n 2, no tray), 4 lifted B, 5 dropped (n 3, B, no locked block, k 0), 6 A (n 4), 7 BAT (n 5, cells 3 and 4 dimmed, final = half 2). (c) 0 start, 1 lifted, 2 dropped (n 1), 3 SAT (n 2, cell 5 dimmed, final), the second tap leaves the frame unchanged.
- Steps: (a) grab, move out and back, drop 0; move 1. (b) grab, drop 0; tap Undo 1; grab, drop 2; tap cell 3 then cell 4 3 and 4. (c) grab, drop 0; tap cell 5 1; a second commandless `tap` on cell 5 (the UI never dispatches a used cell, R-33; the engine throw lives only in `rejected`).
- Dim: cell 6's existing `used` style (`.cell6.used`) is reused; `Frame.cell6` is cell 6 only, so `Frame` gains `used?: number[]` (cells drawn dimmed, tops from the fixture start).

Interface: text.ts `howTo.headings` (Tricky rules) and `howTo.scenes` (3 keys); src/ui/scenes/ (3 scripts in index.ts; `COMMAND_TYPES` `tap` gains `undo`; `Frame.used`); HowToPlayPanel.svelte renders the heading and the three after the first five; the three fixtures; scene-replay.ts unchanged.
Tests: how-to-play-scenes.test.ts: FIXTURES gains the three, `DICT` gains 'faked' and 'bat'; positive replay with `rejected` (R-21, R-22, R-31, R-33, Q-12, Q-34); negatives: a changed stated word, a changed rejected `check`, a changed `validatable` flag; scenes.test.ts (U, AD-n): script-vs-fixture coverage, the drawn dim per frame, the second-tap step carrying no command; e2e/how-to-play.spec.ts (P6 android): heading and scenes after the five basics in order, play and restart, reduced-motion Next to each last frame, each rendered caption equals the text.ts value (imported, not a literal); e2e/how-to-play.screens.spec.ts: three final-frame baselines generated only in the Playwright image via `npm run test:screens`, committed here, no existing baseline changes. The build stays within the 600,000-byte budget (margin recorded by 8.5). Names: R-14, R-21, R-22, R-31, R-33, Q-12, Q-34, AD-n (UI unit), HP ids trailing.
Owns: The Tricky rules section and its three scenes and captions.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright android tests that the Tricky rules heading and three scenes render in order, play and step to their last frame with the rendered captions equal to the text.ts strings, three new final-frame baselines, and an engine replay of each fixture, including the rejected `r31-set-count-empty-destination` and `r33-free-letter-duplicate` cases, that fails on a changed word or check.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- continuity — story-compose-and-destination-block-scenes.md (8.2), story-place-and-scoring-scenes.md (8.3) and their plans
- rules — docs/game-flow-spec.md, R-13, R-14, R-21, R-22, R-31, R-33, Q-11, Q-12, Q-27, Q-34, §8
- code — src/ui/scenes, src/engine/scene-replay.ts, src/engine/commands.test.ts TABLE (no-op or throw per command)
- constraint — ARCHITECTURE-SPINE.md#ad-1

## Notes

- Default for the owner to confirm at the plan checkpoint (`plan_checkpoint` true): scene (b) plays its two halves in sequence on one figure, reset by `undo`, reduced-motion resting frame = half 2.
