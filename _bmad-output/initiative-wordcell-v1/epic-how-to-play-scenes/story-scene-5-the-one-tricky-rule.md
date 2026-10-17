---
id: 10
type: story
title: "Scene 5: the one Tricky rule"
parent: epic-how-to-play-scenes
covers: [HP-4, HP-5, HP-6]  # HP-4 read through the epic's rework Note (one scene); HP-1, HP-2 are provided by the player and honoured, not covered here
after: [9]
risk: low
---

# Scene 5: the one Tricky rule

## Description

Replaces the Tricky rules section (three scenes) by a single scene as the last carousel item: lift E D K A, drop back on column 1, F must join, the rearranged word (FAKED) is animated in the tray, on the shared stage and visuals. The empty-column and one-top-card scenes are removed.

- Current state: scene 5 is the existing scene kept, not rebuilt. Id `source-drop`: `src/ui/scenes/source-drop.ts`, `fixtures/how-to-play-source-drop.json` (column 1 F E D K A, `drop` of 4 from column 1 to column 1, then `arrange` to FAKED; `block` k 1 left; Validate lit after both), caption key `text.howTo.scenes.sourceDrop`, engine replay test 'R-21 R-13 Q-11 scene source-drop' in `src/engine/how-to-play-scenes.test.ts`, baseline `how-to-play-scene-5-final-android-linux.png`. Six steps, four frames, three Next stops. The pointer path goes out and back (a drag that never leaves the source column is a cancel, R-14, Q-34); the tray opens with F E D K A, F locked (k 1 left), and the `move` step with command 1 animates the rearrangement to A K E D, so FAKED is already animated. It already uses the shared `carryGeometry` stage and `Scene.svelte` that scenes 1 to 4 use (read from the code, not rendered): no stage, geometry, script or fixture change. Only the caption changes.
- Caption (HP-6): the owner's verbatim wording (epic Notes, owner 2026-10-17, rework, scene 5): "Dropping back on the column you lifted from is allowed. You must use at least 1 letter from the destination column, unless you drag to an empty column." It replaces the string of `text.howTo.scenes.sourceDrop` in `src/ui/text.ts` (today: "... As always, you must use at least 1 letter from the destination column: F must join, giving FAKED."). The empty-column clause is caption only: no animation, no fixture entry; the rules behind it (R-22, R-23, R-31) are covered by the engine `TABLE` rows in `src/engine/commands.test.ts`. The figure's text description is `figcaption` (`aria-labelledby` in `Scene.svelte`), so the new caption no longer names F or FAKED in text; FAKED stays visible in the tray, and rewording is the owner's. Anything that locates the figure by name or compares the caption follows the new string through `text.howTo.scenes.sourceDrop` (e2e `getByRole('figure', { name })` locators and `toHaveText`, `src/ui/text.test.ts` if it pins the string: grep `sourceDrop`); no literal copy of the old string.
- Removal (this ticket): scripts `src/ui/scenes/destination-rule.ts`, `src/ui/scenes/top-card.ts`; fixtures `fixtures/how-to-play-destination-rule.json`, `fixtures/how-to-play-top-card.json`; in `src/ui/scenes/index.ts` the two imports and `trickyScenes`, so that `scenes` ends with exactly five entries, `[...basicScenes, sourceDropScene]`; in `src/ui/text.ts` the keys `destinationRule` and `topCard` of `scenes` (`topCard`'s string is not reused: scene 2 has its own `freeLetter` string) and the "Tricky rules scenes" comment; their cases in `src/engine/how-to-play-scenes.test.ts` (imports, the `it.each` rows, the 'destination-rule' and 'top-card' tests) and `src/ui/scenes/scenes.test.ts` (imports, the Tricky rules table rows, the 'AD-14 scene destination-rule' and 'top-card' describes, `trickyScenes` in the order test and in the frameDest test); in `e2e/how-to-play.spec.ts` the `destinationRule` and `topCard` entries of `sceneOrder`, `stepPrefix` and `sceneIds`, the `destinationRule` and `topCard` rows of the local `trickyScenes` (the `sourceDrop` row stays) and every test line using them; in `e2e/how-to-play.screens.spec.ts` the entries for scenes 6 and 7; delete the baselines `how-to-play-scene-6-final-android-linux.png` and `how-to-play-scene-7-final-android-linux.png` in `e2e/how-to-play.screens.spec.ts-snapshots/`.
- Five scenes: the carousel goes from seven to five. Scene 5 is last: Next is disabled there, and the dots are named `Scene n of 5` through `text.howTo.carousel.dot(n, total)` (the total comes from `scenes.length` in the component). Update every hard-coded seven: `dotOf(page, 7)` and `dots` length 7 in `e2e/how-to-play.spec.ts`, the test names 'seven dots' and 'walk all seven scenes', the `for (let i = 0; i < 7; ...)` loops that click Next past scene 5 to 7, and `text.howTo.carousel.dot(n, 7)` and `dot(4, 7)` in `e2e/how-to-play.screens.spec.ts`; `src/ui/scenes/scenes.test.ts` and `carousel.test.ts` count assertions (grep `7`, `seven`, `trickyScenes`).
- Split with 8.11 (`tickets.toml` entry 11): 8.10 deletes what is listed above. Code that only the two removed scenes used stays for 8.11 to remove: `Frame.used` and `.cell.used` styles, `Step.carry` and `Carry.lifts: 'dest'`, the Undo pill (`UNDO_BOX`, `undoTarget`, `hasUndo` in `Scene.svelte`, the `undone` branch in `effects.ts`), and the fixture `rejected` support (checked: only the two removed fixtures use `undo`, `rejected` and `used`). 8.10 must leave lint and `check` green with them in place (they are exported or used by shared code, so none becomes an unused local; if one does, remove just that). 8.11 also owns EXPERIENCE.md, the bundle budget and the baselines of other scenes.

Interface: scene script and fixture (unchanged); `text.ts` caption; removes the two old Tricky rules scenes and the carousel's seven-scene counts. No engine source change (epic Boundaries).
Tests: Engine replay (U); play (P6 android); screenshots. Engine replay: 'R-21 R-13 Q-11 scene source-drop' and its generic rows (changed stated word, flipped `validatable`, as for every scene) stay; add Q-34 to the name only if the test asserts the cancel path (it asserts the self-drop), otherwise leave the tags. No R-22, R-23 or R-31 tag in scene tests: the `TABLE` carries them. UI unit (AD-n only, never R-id coverage): the source-drop step and frame tests stay (steps, `out` target, frames 0, 0, 1, 2); `scenes` has five ids in order ending `source-drop`; the caption equals `text.howTo.scenes.sourceDrop`. Playwright android (P6): source-drop plays on open through step 5, a tap pauses, a tap restarts (the `trickyScenes` row); under reduced motion Next walks the four frames to FAKED with the caption equal to `text.ts`; Next is absent on the last scene; the dot and arrow tests use five. Screenshots (Docker only, `npm run test:screens`, never on the host): delete the scene 6 and 7 baselines; the scene-5 final baseline stays unless the render changed (it should not: caption only changes the figcaption, so check the diff, and regenerate in the container only if it differs).
Owns: Scene 5.

## Acceptance Criteria

Verify, all of:
- `npm run test:all` is green.
- `npm run test:screens` is green (Docker container only).
- Engine replay passes for the scene fixture (`npm test -- how-to-play-scenes`, unverified).
- `grep -rnE "destination-rule|destinationRule|trickyScenes|topCardScene|howTo\.scenes\.topCard|top-card-step|how-to-play-top-card|\btopCard:" src e2e fixtures` finds nothing. Run today it matches only the files this ticket edits or deletes (listed above), plus comments that say "Tricky rules scenes" in `index.ts`, `types.ts` and `geometry.ts`; the `index.ts` one goes here, the others stay for 8.11.
- No file `src/ui/scenes/destination-rule.ts`, `top-card.ts`, or fixture for them; `scenes` has five entries.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md (rework Note of 2026-10-17 and Boundaries)
- rules — docs/game-flow-spec.md, R-21, R-13, R-14, R-22, R-23, R-31, Q-11, Q-34
- architecture — ARCHITECTURE-SPINE.md AD-1 (fixture replay in an engine test)
- continuity — plans of 8.6 to 8.9 (`story-scene-carousel-and-whole-play-area-stage-plan.md`, scene 3 and scene 4 plans): same stage, player and carousel

## Notes

- Supersedes ticket 8.4 (`story-tricky-rules-section.md`, three scenes and a "Tricky rules" heading); that file is not edited.
- FAKED is in the dictionary (`grep -n '^faked$' generated/dictionary/en.txt` finds line 53432).
- Default taken (technical, 2026-10-17): 8.10 deletes the removed scenes' own files and entries, 8.11 the code they leave unused.
