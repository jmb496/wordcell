---
title: 'Scenes 1 and 2: move and compose, then add a WordCell letter'
type: 'feature'
ticket: '7'
created: '2026-10-17'
status: 'built'
baseline_revision: 'e915ac0305cd40b2d52739a5931bdd37f95d634a'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scenes-1-and-2-move-and-compose-then-add-a-wordcell-letter.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scenes-1-and-2-move-and-compose-then-add-a-wordcell-letter.review-log.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** How to play still has three separate basic scenes (drag, compose, destination) on a small board. The owner (commit e915ac0) set two combined scenes on a fuller board that end on real words.

**Approach:** Follow the ticket file (its Description, Content, Continuity, Reorder animation, Replacement end state, Captions and AC1 to AC6 are the contract, read-only here). Replace the three scenes with `move-compose` and `free-letter`; add the `arrange` step type, the `opens` fixture field, and the tests, e2e specs and Docker screenshots the ACs list.

## Boundaries & Constraints

**Always:** Owner-set content of the ticket (K B A lifted onto a column ending D E, k=2, k=3, k=2, Flip, arrange to BAKED, then addFreeLetter cell 6 index between A and K giving BALKED, validate). The builder verifies it against the engine and `generated/dictionary/en.txt`; a substitute changes only decoration cards or `arrange` ids and is recorded in Implementation Notes. Text only in `src/ui/text.ts`. Rules 1 to 7 of AGENTS.md; the engine stays pure (`opens` only in `scene-replay.ts` test support, no `index.ts`/`SESSION_VERSION` change). Screenshots only in Docker.

**Never:** Touch `place.ts` logic, later scenes, `D:\CodeProjects\bga-wordcell`, or the deal. No fallbacks. Do not change stated words (an owner decision). Do not mark the ticket done or edit the ticket file or `tickets.toml`.

</intent-contract>

## Code Map

- `src/ui/scenes/{drag,compose,destination}.ts`, `fixtures/how-to-play-{drag,compose,destination}.json` -- removed; `compose.ts` and `destination.ts` are the templates (carryGeometry, trayTargets, frames, reveal layers `tray-n`).
- `src/ui/scenes/{move-compose,free-letter}.ts`, `fixtures/how-to-play-{move-compose,free-letter}.json` -- new.
- `src/ui/scenes/script.ts` -- `COMMAND_TYPES` gains `arrange: ['arrange']`, `move` keeps `arrange` and `setPlacementOrder`; `defineScene` throws for a step at command index < `opens`.
- `src/ui/scenes/types.ts` -- `StepType` + `'arrange'`, `SceneFixtureData.opens?`; `Scene.svelte` / `Stage.svelte` -- render the `arrange` step (ghost hidden, tiles glide from the Frame `order`, `snap` kind via `duration()`; reduced motion shows the final order).
- `src/engine/scene-replay.ts` -- `SceneFixture.opens?: number` with range check (integer, 1..commands.length-1).
- `src/engine/how-to-play-scenes.test.ts`, `src/ui/scenes/scenes.test.ts`, `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts`, `e2e/app-shell.spec.ts` -- retarget lists, imports, scene ids.
- `src/ui/scenes/index.ts` -- `basicScenes = [moveCompose, freeLetter, place, scoring]`; `src/ui/text.ts` `howTo.scenes` -- drop drag/compose/destination, add `moveCompose`, `freeLetter` (ticket Captions verbatim); comments in `geometry.ts`, `tray-scene.ts` updated.

## Tasks & Acceptance

**Execution:**
- [ ] `src/engine/scene-replay.ts`, `src/ui/scenes/types.ts`, `script.ts` -- `opens`, `arrange` step type and its COMMAND_TYPES entry (target `rest`, default `times` 1; one step = one glide of all moved tiles) -- ticket Reorder animation
- [ ] fixtures + `move-compose.ts` + `free-letter.ts` -- two scenes; scene 2 carries scene 1's commands as prefix with `opens` = scene 1 `commands.length`; frame 0 `landed: true` plus exported final-frame constants of scene 1; card ids derived from letters in tests (decoration contains no A/K/E/D beyond the scripted cards) -- AC1, AC2, AC5
- [ ] `Scene.svelte`/`Stage.svelte`, `index.ts`, `text.ts`, removals, comment updates -- Replacement end state
- [ ] tests (engine, scenes.test.ts, e2e, screens) -- AC1 to AC6; run `npm run test:all`, then `npm run test:screens` (Docker; delete old baselines, generate new ones)

**Acceptance Criteria:**
- Given the ticket's AC1 to AC6 (they carry the toml verify clauses: engine replay of both fixtures, scene 2 provably starting from scene 1's final position, Playwright android playing both), when `npm run test:all` and `npm run test:screens` run, then both are green.

**Resolution of the review log's unapplied minors (record each outcome in Implementation Notes):**
1. R-31 bound: assert/define k's bound as the destination column's own length before the lifted cards land (here the column 3 length); test names say so.
2. "Fuller" board: no old-board card requirement; keep column 1 tail K B A, cell 6 L, column 3 bottom D E, decoration within `MAX_COLUMN_CARDS`/`MAX_CELL_CARDS`.
3. Verify line: AC1 to AC3 are the verify clauses (this plan's AC says so).
4. `opens`: harness range check; continuity helper asserts `opens === scene1.commands.length` and scene 2 has more than `opens` commands; negative test mutates `opens`.
5. `arrange` step: as in Execution row 1.
6. AC5 doubling test names two preference values, Fast vs Slow.
7. CardIds derived from letters via `startOf` numbering, never hard-coded.
8. Stated words are locked: not changed.
9. Captions are the ticket's owner-reviewed drafts: left verbatim (redundancy and the Flip-back are the owner's text call, noted for the owner at done). Scene 2 final frame: tray shows pressed Validate with BALKED (letters B A L K E D); scene ids `move-compose` / `free-letter`.
10. Removed-name grep excludes prose comments (the `place.ts` comment stays).
11. `tickets.toml` entry 7 `interface`/`references` not edited: sync at done by the owner.
12. M/D notation: M = lifted cards, D = column 3's bottom k cards, in test names and comments.
13. Scene 2's first frame equals scene 1's last frame with the pointer at rest (AC5 test).

## Implementation Notes

- Owner content verified against the engine and `generated/dictionary/en.txt` (BAKED, BALKED are words); no substitute needed. Start: column 1 O R I K B A, column 2 X O R I N, column 3 M F N D E, cell 6 L (decoration has no extra A/K/E/D/B/L). Scene 1 commands: drop 1 to 3 (3 cards), k 2, k 3, k 2, flip, arrange [3, 0, 22] (B A K; ids from `startOf` numbering). Scene 2: the same six plus `addFreeLetter` cell 6 index 2 (BALKED) and `validate`, `opens` 6; a `block` entry at after 8 (draft still exists after Validate).
- Review-log minors: 1 R-31 bound is column 3's own length (5), tested at k 5 ok and k 6 throws. 2 No old-board requirement; column 1 tail K B A, cell 6 L, column 3 bottom D E. 3 AC1 to AC3 are the verify clauses. 4 `opens` range check in `replayScene`, the continuity helper asserts `opens === scene1.commands.length` and more commands than `opens`, the negative test mutates a start card, a prefix command and `opens`. 5 `arrange` step: COMMAND_TYPES `arrange: ['arrange']`, `move` keeps `arrange`; effects: ghost fades out, the `tray-N` layer shows at once, each moved tile glides (snap, times 3); `defineScene` requires the command and a `tray-<frame>` reveal. 6 AC5 doubling test names Fast 90 ms vs Slow 180 ms. 7 Ids derive from letters via `startOf` numbering (the fixture arrange ids are literal JSON, noted above). 8 Stated words unchanged. 9 Captions verbatim. 10 Removed-name grep over `src/` and `e2e/` is empty; the `place.ts` prose comment stays. 11 `tickets.toml` untouched. 12 M/D notation used in test names. 13 Scene 2 frame 0 is scene 1's exported final frame; the AC5 test deep-equals them.
- Deviations to know: the ticket's AC3 sentence "tiles A K E D and the right-side B block, not a word" is stale against the owner content; the Playwright test asserts the real final state B A K E D (E D the right block). Scene 2's carry reuses scene 1's carry (`destinationCount` 1) with `landed`, so the column drawing is identical in both scenes (the tray's k is separate, as in the old destination scene).
- Generic engine harness cases that cloned the old drag fixture now clone a test-local `baseDrop` scene (not a How to play scene). Rich tray tiles got `data-scene-el="tray-<frame>-tile-<j>"` wrappers (the e2e layer selector excludes them). Frame 0 of a scene whose first frame has a tray is drawn open in normal motion (opacity 1).
- Verification: `npm run test:all` green (lint, check, 2923 unit, build, dist, e2e android and desktop, pwa); `npm run test:screens` in Docker: old baselines deleted, seven new `how-to-play-scene-N-final` baselines generated (scenes renumbered 1 to 7), then the full screens run green.

## Plan Change Log

## Review Triage Log

### 2026-10-17 — Review pass
- verdicts: 4 lens reports (Blind 10, Edge 10, Verification-gap 1 + 2 other, Intent 1 descriptive) — patch 1, rejected/low or false for the rest, no intent_gap, no bad_plan
- findings:
  - `[medium]` `patch` No test observes normal-motion opacity of `tray-0` (free-letter opens on scene 1's tray; also Blind/Edge reports of the same layer) — added the AD-3/AD-14 SSR test in `scenes.test.ts` (free-letter `tray-0` opacity 1, move-compose has no `tray-0`).
  - `[low]` `reject` Plan Code Map names Stage.svelte / app-shell.spec.ts, arrange lives in effects.ts; plan metadata/log empty — fix would edit this plan; logs now filled.
  - `[low]` `reject` Arrange step uses target `flip`, times 3, not plan's `rest`/1 — pointer ghost is hidden during the glide; no visible effect.
  - `[low]` `reject` Letter-greedy tile matching in effects.ts, arrange step validation, duplicate letters — no scene repeats a letter in a tray; guards would add complexity.
  - `[low]` `reject` Literal arrange ids [3,0,22], unchecked final-frame order in unit test, hard-coded e2e indices, test scaffolding, playback time, caption length/redundancy — covered by BAKED word assertion and e2e frame tables; captions are the owner's drafts.
  - `[low]` `reject` tray-0 left under later layers in motion — opaque layers, restart resets state.
  - `[info]` `defer` Ticket text conflicts: Description says scene 2 "flips back" and AC3 says "A K E D, not a word", Content says scene 2 starts on side right and scene 1 ends on BAKED; the build follows Content (owner decision e915ac0). Owner to fix the ticket text at done.

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green with new baselines (Docker)

## Auto Run Result

Summary: scenes `move-compose` and `free-letter` replace drag/compose/destination; `arrange` step, `opens` fixture field, new tests, e2e and Docker screenshots (see Implementation Notes for each review-log minor).
Review: 1 patch applied (tray-0 test); the rest rejected as low or false (see triage log). Follow-up review recommended: false.
Verification: `npm run test:all` and `npm run test:screens` both green: test:all re-run after the patch (exit 0); test:screens passed in Docker by the implementer before the test-only patch.
Residual risks / for the owner: the captions are drafts; ticket Description ("flips back") and AC3 text are stale against the owner Content; `tickets.toml` entry 7 needs a sync at done.
