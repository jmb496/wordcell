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

Adds the Tricky rules section after the five basics: three animated scenes (HP-4) in 8.2's format, each with an engine-replayed fixture. Captions are the owner's epic Notes 2026-10-17 strings verbatim in text.ts `howTo.scenes` (`sourceDrop`, `destinationRule`, `topCard`), each the `Scene.caption` (HP-6); new `howTo.headings` entry "Tricky rules".

- Scene (a) (§8 start; `scene` `source-drop`): fixtures/how-to-play-source-drop.json. Commands: 0 drop column 1 count 4 to column 1 (R-21, F stays, k 1 left, draft FEDKA), 1 arrange to A K E D (FAKED, `words` entry; Q-11 and R-13 hold, the tail is picked up). A drag that never leaves the source column is a cancel (R-14, Q-34), so the grab, a `move` out and back, then the drop animate command 0, landing at the tail's home (`offset` 0). `validatable` after 0 false, 1 and 2 true.
- Scene (b) (`destination-rule`): fixtures/how-to-play-destination-rule.json, one fixture, two halves in sequence on one figure. Its own start, not §8: columns O A T / R B / empty column 3, cells 3 N A and 4 S T (bottom to top). Commands: 0 drop column 1 count 2 to column 2 (Q-12: B, k 1 left, locked, draft BAT, `words`); 1 undo; 2 drop column 2 count 1 to empty column 3 (R-22, R-31: k 0, draft B); 3 addFreeLetter cell 3 (A); 4 addFreeLetter cell 4 (T, draft BAT, `words`). Both halves give BAT (half 2: R-13, Q-27). `validatable` after 0 false, 1 true, 2 false (undone), 3 false, 4 false, 5 true (R-38, letter count only).
- Scene (c) (`top-card`): fixtures/how-to-play-top-card.json. Start: column 1 N A T, column 2 empty, cell 5 R S (S on top). Commands: 0 drop column 1 count 2 to column 2 (AT), 1 addFreeLetter cell 5 index 0 (SAT, `words`); `validatable` after 0 false, 1 false, 2 true.
- Rejected (`rejected` from the commands.test.ts TABLE): (b) after 3: setDestinationCount k 1, `throw`, `r31-set-count-empty-destination`, row R-31 "k = 1 on an empty destination column"; half 1 lists none. (c) after 2: addFreeLetter cell 5, `throw`, `r33-free-letter-duplicate`, row R-33 "on a used cell".
- Frames (reduced motion: frames are Next stops as in 8.2; n = commands applied, `validate` per `validatable` after n): (a) 0 start, 1 lifted, 2 dropped (n 1, tray F E D K A, F locked, k 1 left, lit), 3 FAKED (n 2, final): 3 Next clicks. (b) 0 start, 1 lifted A T, 2 dropped (n 1, B locked, BAT, lit), 3 undone (n 2, no tray), 4 lifted B, 5 dropped (n 3, B, no locked block, k 0), 6 A (n 4, cell 3 dimmed), 7 BAT (n 5, cells 3 and 4 dimmed, lit, final = half 2); the rest off: 7 clicks. (c) 0 start, 1 lifted, 2 dropped (n 1, off), 3 SAT (n 2, cell 5 dimmed, lit, final): 3 clicks.
- Steps: (a) grab, move out and back, drop 0; move 1. (b) grab, drop 0; tap Undo 1; grab, drop 2; tap cell 3 then cell 4 3 and 4. (c) grab, drop 0; tap cell 5 1; a second commandless `tap` on cell 5 (R-33: the throw lives only in `rejected`).
- Stage: Scene.svelte draws every fixture-start cell from frame 0 (top card, number), cells 3 to 5 at `placeCellX(n)` positions (place.ts `cellPoint` is module-local, tray row; unverified, settled at plan time), Undo in the stage header row, sharing `.cell6.used` as `.cell.used`; `Frame` gains `used?: number[]` (cells dimmed once their letter is added). Undo is a control in the `aria-hidden` stage (HP-6) labelled `text.undo`, target `undo`, glide `undoRedo`. Scene (b)'s drops carry differently (destinationCount 1, then 0): `Step.carry?` overrides `Scene.carry` per grab and drop step (absent: `Scene.carry`), `offset`/`layout.destHome` per carry.

Interface: text.ts `howTo.headings` (Tricky rules) and `howTo.scenes` (3 keys); src/ui/scenes/ (3 scripts in index.ts; `COMMAND_TYPES` `tap` gains `undo`; `Frame.used`, `Step.carry`); HowToPlayPanel.svelte renders the heading and the three after the first five; the three fixtures; scene-replay.ts unchanged.
Tests: how-to-play-scenes.test.ts: FIXTURES gains the three; positive replay with `rejected`; negatives: a changed stated word, a changed rejected `check`, a changed `validatable` flag; scenes.test.ts (U, AD-n): script-vs-fixture coverage (each grab and drop step's carry pinned to the drop command it names), the drawn dim per frame, the second-tap step carrying no command; e2e/how-to-play.spec.ts (P6 android): heading and scenes in order after the basics, play and restart, reduced-motion Next to each last frame, captions equal text.ts; e2e/how-to-play.screens.spec.ts: three final-frame baselines generated via `npm run test:screens`, existing unchanged. Names: R-21, R-22, R-31, R-33, Q-12, AD-n (UI), HP trailing.
Owns: The Tricky rules section and its three scenes and captions.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright android tests that the Tricky rules heading and three scenes render in order and step to their last frame with captions equal to the text.ts strings, three new final-frame baselines, and an engine replay of each fixture, including the rejected `r31-set-count-empty-destination` and `r33-free-letter-duplicate` cases, that fails on a changed word or check.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- continuity — story-compose-and-destination-block-scenes.md (8.2), story-place-and-scoring-scenes.md (8.3) and their plans
- rules — docs/game-flow-spec.md, R-13, R-14, R-21, R-22, R-31, R-33, Q-11, Q-12, Q-27, Q-34, §8
- code — src/ui/scenes, src/engine/scene-replay.ts, src/engine/commands.test.ts TABLE (no-op or throw per command)
- constraint — ARCHITECTURE-SPINE.md#ad-1

## Notes

- Default for the owner to confirm at the plan checkpoint (`plan_checkpoint` true): (b) plays two halves in sequence, reset by `undo`, resting frame = half 2.
