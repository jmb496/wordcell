---
title: 'Tricky rules section'
type: 'feature'
ticket: '4'
created: '2026-10-16'
baseline_revision: 'fe586c0d35cff72d9caf535e4d4b8ea0382aba27'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-tricky-rules-section.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-tricky-rules-section.review-log.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-compose-and-destination-block-scenes-plan.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-place-and-scoring-scenes-plan.md'
warnings: [oversized]
deferred: []
---

<intent-contract>

## Intent

**Problem:** The How to play panel has no Tricky rules section: the source-column drop (R-21), the destination-card rule with empty columns (R-13, R-31, R-22) and the one-top-card-per-WordCell rule (R-33) are unexplained, and their game content is not engine-checked (HP-5) or captioned (HP-6).

**Approach:** Add scenes `source-drop`, `destination-rule`, `top-card` in the format of 8.1 to 8.3, each with a fixture replayed by the engine harness, captions from the epic Notes 2026-10-17 verbatim in `text.howTo.scenes` (`sourceDrop`, `destinationRule`, `topCard`), a new `howTo.headings` entry "Tricky rules", and a panel section after the five basic scenes. The ticket file in `context:` is the full specification (Description: commands, `validatable`, `rejected`, frames, steps, Stage, Interface, Tests); implement exactly it, plus the resolutions below.

## Boundaries & Constraints

**Always:** Follow the ticket and the 8.1 to 8.3 plans' Always lists (text in text.ts, durations from motion.ts, `act()` controls, `Card mirror="static"`, no `data-card-id` or `data-testid` in scenes, UI imports engine types only (AD-1), no new errors.ts code or engine/index.ts export, test names start with ids, scene-replay.ts unchanged). Fixtures must pass `replayScene` (verify by running the test). Frame `n` = commands applied; the frame's Validate follows the fixture `validatable` at that `n`.

**Never:** Change the deal, spec, spine or an AD; modify bga-wordcell; add fallbacks; push; run screenshot baselines on the host (`npm run test:screens` only); invent caption wording (copy the three strings from the epic Notes 2026-10-17 decision).

**Resolutions of the review log's unapplied minors:**
1. Scene Undo control: carries `data-scene-el="undo"` only, no `data-testid` (AGENTS.md reserves `undo` for the app button); it is `aria-hidden` stage markup labelled `text.undo`.
2. Scene (a) frames vs steps: frames are by command state, not one per step: 0 start, 1 lifted (the grab; the out-and-back `move` steps only animate), 2 dropped (n 1), 3 FAKED (n 2). Steps: grab (command 0), move target `out` (a point beside the source column), move target `grab` (back over the tail's home), drop (command 0, landing at `offset` 0), move target `tiles` (command 1, as compose.ts).
3. Placement (settled here): cells 3 to 5 are drawn in the column area below the columns: card left `placeCellX(n)` (30, 86, 142), card top `CELLS_TOP = 118` (new constant in geometry.ts; no column reaches y 118: the tallest is scene (b) column 2 after the drop, bottom at 116), number label under the stack, top card (and card beneath) from frame 0 from `fixture.start.cells`. Undo: a pill `UNDO_BOX = {x: 200, w: 48, y: 6, h: 30}` (top right of the column area; (b) has only three columns, column 3 ends at x 196), pointer target its centre. Cell dim: class shared as `.cell.used` (rename `.cell6.used` styling to the shared class, scene 2 unchanged visually); a cell is dimmed in the frame its letter is added (`Frame.used`). If the drawn result collides, adjust the constants and say so in Implementation Notes; the Docker baselines are the visual check.
4. Loop restart ((b), (c)): on restart the player resets every element to the start state (check player.ts); (b)'s mid-loop `undo` step is part of the loop, the rest/restart returns to frame 0 with cells and columns as `start`. No extra reset code unless player.ts needs it for the new `Frame.used` and Undo layers; a unit test asserts frame 0 equals the start.
5. Move target ids: scene (a) uses `out`, `grab`, `tiles` (above); scene (b) `grab`, `over`, `undo`, `grab2`, `over2` (column 3), `cell3`, `cell4`; scene (c) `grab`, `over`, `cell5`.
6. Rejected: tests add a negative that changes a `rejected` entry's `after` (to a count where the command is legal or different) and expect the harness to fail; plus the changed stated word, changed `check`, changed `validatable` flag from the ticket.
7. Q-31: the SAT free letter is `addFreeLetter cell 5 index 0` (Q-31: the optional insertion index; index 0 puts S before AT); cite Q-31 in the fixture test name and the scene comment.
8. Captions are looked up by key in tests and e2e (`text.howTo.scenes.sourceDrop` etc.), never by position; the e2e checks order separately.
9. Baselines: exactly three new final-frame baselines (`npm run test:screens`, Docker); the existing baselines must be unchanged (`git status` shows no modified `.png`; if scene 2's `.cell6.used` rename changes one, that is a bug).
10. Verify/Tests drift: the Verify line wins where it differs from the Tests line; `npm run test:all` and `npm run test:screens` both green.
11. Scene (c) empty column 2: kept so the drop of AT has a legal empty destination (R-22) with no destination cards, so SAT is built from the lifted AT plus the free letter; a comment says so.
12. Scenes.test.ts maps used-cell ids to keys explicitly: cell number to the `Frame.used` entry (c: `5`; b: `3`, `4`), asserted against the drawn `.cell.used` per frame.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Replay three fixtures | DICT with faked, bat, sat plus existing words | passes; words, `validatable`, `rejected` match | none |
| Empty-destination count | (b) after command 3: setDestinationCount k 1 | throws `r31-set-count-empty-destination` | EngineError |
| Used-cell duplicate | (c) after command 2: addFreeLetter cell 5 | throws `r33-free-letter-duplicate` | EngineError |
| Changed word, check, flag or `rejected.after` | fixture clone altered | harness Error | harness Error |
| Second tap on cell 5 | (c) tap step with no command | dispatches nothing; cell stays dimmed | none |
| Scenes played | android, reduced motion, Next to last frame | heading "Tricky rules" then three scenes in order; per-frame state as the ticket's frame list; captions equal text.ts | none |

</intent-contract>

## Code Map

- `fixtures/how-to-play-source-drop.json`, `how-to-play-destination-rule.json`, `how-to-play-top-card.json` -- new; format of `fixtures/how-to-play-destination.json` and `-place.json` (`start.cells`, `words`, `validatable`, `rejected`)
- `src/engine/how-to-play-scenes.test.ts` -- DICT, FIXTURES, replay and negatives
- `src/engine/scene-replay.ts` -- unchanged (already has `rejected`, `validatable`)
- `src/ui/scenes/` -- `types.ts` (`Frame.used`, `Step.carry`), `script.ts` (`COMMAND_TYPES.tap` + `undo`; per-step carry in the drop/grab check), `geometry.ts` (`CELLS_TOP`, `UNDO_BOX`), `Scene.svelte` (cells 3 to 5, Undo pill, shared `.cell.used`, per-step carry for drop geometry), `effects.ts`/`player.ts`/`tray-scene.ts` (per-carry offset and `destHome`), new `source-drop.ts`, `destination-rule.ts`, `top-card.ts` (model on `compose.ts`, `destination.ts`), `index.ts`, `scenes.test.ts`
- `src/ui/text.ts` (`howTo.headings`, `howTo.scenes`), `src/ui/HowToPlayPanel.svelte` (heading plus three scenes after the first five), `src/ui/how-to-play.test.ts` (counts)
- `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- heading and scenes in order, play and restart, Next to last frame; three baselines
- `src/engine/commands.test.ts` TABLE -- read only; rows R-31 "k = 1 on an empty destination column", R-33 "on a used cell" (cite by id)

## Tasks & Acceptance

**Execution:**
- [x] `fixtures/how-to-play-{source-drop,destination-rule,top-card}.json` -- commands, words, `validatable`, `rejected` per the ticket -- engine truth
- [x] `src/engine/how-to-play-scenes.test.ts` -- FIXTURES, DICT, positive replay, negatives (resolution 6) -- HP-5
- [x] `src/ui/scenes/types.ts`, `script.ts`, `geometry.ts`, `Scene.svelte`, `effects.ts`, `player.ts`, `tray-scene.ts` -- `Frame.used`, `Step.carry`, `undo` tap, cells 3 to 5, Undo pill -- ticket Stage
- [x] `src/ui/scenes/{source-drop,destination-rule,top-card}.ts`, `index.ts` -- scripts and frames per the ticket and resolutions
- [x] `src/ui/text.ts`, `src/ui/HowToPlayPanel.svelte`, `src/ui/how-to-play.test.ts` -- heading, captions verbatim, section
- [x] `src/ui/scenes/scenes.test.ts` -- script-vs-fixture coverage, drawn dim per frame, second-tap step without command, frame 0 = start
- [x] `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- android tests; run `npm run test:screens` to generate three baselines

**Acceptance Criteria:**
- Given the ticket's Verify line, when `npm run test:all` and `npm run test:screens` run, then both are green, with android tests that the Tricky rules heading and three scenes render in order and play, step to their last frames with captions equal to the text.ts strings, an engine replay of each fixture including both rejected cases, and negatives that fail on a changed word, check, flag or `rejected.after`.

## Implementation Notes

- Cell numbers under cells 3 to 5 use 11px/12px (not the cell 6 label's 12px/16px) so the label ends above the tray border at y 208; `CELLS_TOP` 118 and `UNDO_BOX` as resolved. Scene 2's cell 6 label is unchanged (`.cell6 .cell` markup, no baseline moved).
- Cells are dimmed through the tray layer of the frame that adds the letter (a `.cell.used` copy over the base cell, as scene 2 does for cell 6), so `Frame.used` needs an open tray layer.
- Added `Frame.dest` (`lifted`, `gone`) for the D block, `Carry.lifts: 'dest'` (scene b half 2 lifts the same B card, which is the D block of half 1) and an optional `reveal.show` (the Undo step only hides tray-2 and returns the flown cards in phase 1). Fly steps target the pointer's current point so the ghost does not jump.
- `defineScene` pins every grab and drop carry (its own, else the scene's) to the fixture drop command it names; same-column drops (R-21) land at the tail's home and the D block is the bottom of what the lift left.
- Fixtures replay with the real engine unchanged; `scene-replay.ts` untouched. Three new final-frame baselines (scenes 6 to 8); the five existing baselines are unchanged.

## Plan Change Log

## Review Triage Log

### 2026-10-16 — Review pass
- verdicts: 25 findings — high 0, medium 1, low 8, false 4, maybe-false 0 (12 further hunter items are guards for states no scene reaches or restate design, logged as one row each below)
- findings:
  - `[medium]` `patch` `frameDest` (reduced-motion D-block lift/hide) never exercised (gap lens) — unit test added in scenes.test.ts, with the frame `dest` values pinned
  - `[low]` `patch` lifts-dest carry test hit the earlier error, leaving the 'lifts a D block' branch unshown (gap lens other finding) — test replaced with a carry that matches a fixture command
  - `[low]` `patch` mocked reduced motion restored only on the last line (blind hunter) — try/finally
  - `[false]` `reject` executable bits on new files (blind hunter) — `core.fileMode` is false on drvfs; tracked files show the same mode locally and git records 100644
  - `[false]` `reject` caption provenance dated 2026-10-17 in the future (blind hunter) — the epic Notes decision carries that date as the owner's; text.ts cites it verbatim
  - `[false]` `reject` source-drop lacks a rejected k 0 case (blind hunter) — the ticket lists `rejected` only for (b) and (c)
  - `[false]` `reject` plan lists player.ts without a hunk (edge-case claim) — player.ts needed no change; per-carry handling lives in effects.ts and tray-scene.ts
  - `[low]` `reject` owner decision left in a comment (b resting frame) — the ticket Notes record it as a default for the owner; reported in the result JSON
  - `[low]` `reject` brittle regexes / Undo test title / reveal typing / e2e duplication / panel `.tricky` style / geometry comment / card-count sum (blind hunter, 7 items) — cosmetic; fix is more than a direct correction
  - `[low]` `reject` edge-case guards (drop/grab lifts mismatch, destinationCount bound, `Frame.dest` without D block, undo step without reveal, undeclared flown element, cells in place/score mode, `Frame.used` unknown cell, cellTarget count 0, tall columns over CELLS_TOP, scene-level lifts) — each guards a state no scene reaches; adds branches (AGENTS rule 6 favours loud failure, which `defineScene` already gives for reachable mistakes)
  - `[low]` `reject` out-and-back not tested at gesture level (blind hunter) — R-14/Q-34 are controller tests' scope, not scene scripts
  - `[low]` `reject` intent auditor divergences (second tap shows no visible change, captions generic, play checked by animation ids, gates not evidenced in diff) — by ticket design; gates run in this review

## Auto Run Result

- Summary: Tricky rules section: scenes `source-drop`, `destination-rule`, `top-card` with engine-replayed fixtures (both rejected cases), owner caption wording verbatim, "Tricky rules" heading, cells 3 to 5 and a scene Undo pill, per-step carry and `Frame.used`/`Frame.dest`.
- Files: fixtures/how-to-play-{source-drop,destination-rule,top-card}.json; src/engine/how-to-play-scenes.test.ts; src/ui/scenes/ (types, script, geometry, effects, tray-scene, Scene.svelte, three scripts, index, tests); src/ui/text.ts; src/ui/HowToPlayPanel.svelte; src/ui/how-to-play.test.ts; e2e/how-to-play.spec.ts and screens spec with three new baselines.
- Review: 3 patches applied (1 medium, 2 low), 0 deferred, rest rejected with reasons above. Follow-up review recommended: false.
- Verification: unit, lint, check, build, e2e:dist green; e2e 928 passed, one flaky teardown timeout (board-keys focus test, unrelated) passed on rerun; e2e:pwa 13 passed; test:screens green in Docker before the test-only review patches (no baseline-affecting change since).
- Residual risks: the animated Undo return was checked by unit and e2e step tests, not watched; scene (b) resting frame = half 2 is the owner's to confirm.

## Verification

**Commands:**
- `npm run test:all` -- expected: all green
- `npm run test:screens` -- expected: green after the three baselines are generated in the container

