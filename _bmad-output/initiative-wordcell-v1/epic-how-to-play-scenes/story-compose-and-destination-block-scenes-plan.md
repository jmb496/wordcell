---
title: 'Compose and destination-block scenes'
type: 'feature'
ticket: '2'
created: '2026-10-16'
status: done
baseline_revision: 'be5c73d7655fdfd629aae769b6c7cd5500f07424'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-compose-and-destination-block-scenes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-player-first-scene-and-engine-replay-harness-plan.md'
warnings: [oversized]
deferred: []
---

<intent-contract>

## Intent

**Problem:** The How to play panel has only scene 1 (drag); HP-3b (compose) and HP-3c (destination block, −/+, Flip) are missing, and their game content must be engine-checked (HP-5) with captions in text.ts (HP-6).

**Approach:** Add scenes `compose` and `destination` in 8.1's format (scripts in src/ui/scenes/, fixtures, captions), extend the harness with optional `validatable`, and test. The ticket file in `context:` is the full specification (Description, frames, steps, Interface, Tests); implement exactly it, plus the resolution below.

## Boundaries & Constraints

**Always:** Follow the ticket bullets and 8.1's Always list (text in text.ts `howTo.scenes`, durations from motion.ts, `act()` controls, `Card mirror="static"`, no `data-card-id`/`data-testid` in scenes, UI imports engine types only (AD-1), no new errors.ts code or engine/index.ts export, test names start with ids). A rejected validate in `commands` is not thrown (8.1 tests rely on it).

**Never:** Change the deal, spec, spine or an AD; modify bga-wordcell; add fallbacks; implement scenes 4+; push; run screenshot baselines on the host; touch the engine beyond the optional `validatable` field in `src/engine/scene-replay.ts`.

**Open-major resolution (from the ticket review log, pass 5):** the compose negative "own Set {'baked'} gives last `rejectedWords` 'balked'" cannot pass with `validatable` in the fixture: the rejected validate leaves `canValidate` true after command 4 while the fixture says false, so `replayScene` throws the validatable mismatch first. Tests therefore (a) clone the compose fixture with `validatable` deleted, replay with Set {'baked'}, assert last `rejectedWords` is 'balked'; and (b) assert the unmodified fixture with Set {'baked'} throws a validatable mismatch (this is also the ticket's "fails on BALKED missing from the dictionary").

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Replay both fixtures | DICT {'baked','balked'} | passes; validatable matches; all `rejectedWords` undefined | none |
| BALKED not in dictionary | compose fixture, Set {'baked'} | throws validatable mismatch; with `validatable` removed, last `rejectedWords` is 'balked' | harness Error |
| Flipped validatable | one entry inverted | harness Error | harness Error |
| validatable out of range | `after` > command count | harness Error | harness Error |
| Count 0 on destination | scene 3 after drop, setDestinationCount 0 | `r31-destination-count` EngineError (cf. replay.test.ts 'k = 0 on a non-empty destination') | EngineError |
| Scenes played | android, reduced motion, Next to last frame | per-frame tray, k, Validate, cell 6 state as the ticket's frame list | none |

</intent-contract>

## Code Map

- `src/engine/scene-replay.ts` -- `SceneFixture` gains optional `validatable: {after, canValidate}[]`, range-checked 0..count like `scores`, compared with `viewFrom(...).canValidate`
- `src/engine/how-to-play-scenes.test.ts` -- DICT, FIXTURES, replay and negative tests
- `fixtures/how-to-play-drag.json` -- format to copy; add `how-to-play-compose.json`, `how-to-play-destination.json`
- `src/ui/scenes/` (`types.ts`, `script.ts`, `drag.ts`, `effects.ts`, `player.ts`, `Scene.svelte`, `index.ts`, `scenes.test.ts`) -- Frame/Step/SceneFixtureData widening, new scripts, `defineScene` command-type rule
- `src/ui/text.ts` (`howTo.scenes`), `src/ui/HowToPlayPanel.svelte` -- captions, scene slots
- `src/ui/WordCellRow.svelte`, `src/ui/Tray.svelte` -- visual reference for inert static markup only
- `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- android step-through and final-frame baselines

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/scene-replay.ts` -- optional `validatable` -- ticket Interface
- [x] `fixtures/how-to-play-compose.json`, `fixtures/how-to-play-destination.json` -- commands, words, validatable (scene 2 true after 1 to 3 only; scene 3 true after 1 to 4 only, every count listed)
- [x] `src/ui/scenes/*` -- types, scripts, steps, defineScene rule, static visuals
- [x] `src/ui/text.ts`, `src/ui/HowToPlayPanel.svelte` -- captions verbatim from epic Notes, slots after scene 1
- [x] `src/engine/how-to-play-scenes.test.ts`, `src/ui/scenes/scenes.test.ts` -- ticket Tests plus the open-major resolution
- [x] `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- step to last frame, baselines via `npm run test:screens` (Docker)

**Acceptance Criteria:**
- Given the ticket's Verify line, when `npm run test:all` and `npm run test:screens` run, then both are green, with android tests stepping each scene to its last frame, a final-frame baseline of each, and a replay that fails on a flipped validatable flag or BALKED missing from the dictionary.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-16 — Review pass
- verdicts: 29 findings — high 0, medium 3, low 26, false 0, maybe-false 0
- findings:
  - `[medium]` `patch` traySlot / flown suppression untested for compose and destination (gap lens) — unit test added in scenes.test.ts
  - `[medium]` `patch` frame k and side not tied to fixture commands (gap lens, deferred by lens, patched as cheap) — unit test added
  - `[medium]` `patch` no negative changing a stated word to a non-word on the new fixtures (intent lens, ticket Verify line) — parametrized engine test added
  - `[low]` `reject` blind hunter (12 items: compose BEDKA/frame 5 have no words entry per ticket, e2e comment wording, opacity locator, hard-coded frame counts, shadowed names, shallow defineScene tap rule, caption glyph, fixture magic numbers, test titles, plan checkboxes, hand-copied tray geometry) and edge-case hunter (8 items: missing load-time guards for cell6/tray layers/command coverage, validatable duplicate/length, post-fly move scoping, dest cards SLOT with k>1, reduced-motion toggle while open) — each is plan detail or a guard for a state no scene reaches; covered by existing unit tests or would add complexity; plan boxes ticked now
  - `[low]` `reject` intent lens: green gates not evidenced in diff / animated test does not reach final visual — gates verified in this run (test:all, screens in Docker)

## Design Notes

Scene 3's `setDestinationCount 0` negative is a cloned-fixture test, not a `rejected` entry (TABLE has no non-self row; cite, never copy).

## Verification

**Commands:**
- `npm run test:all` -- expected: all green
- `npm run test:screens` -- expected: green after baselines generated in the container

## Auto Run Result

- Summary: scenes 2 (compose) and 3 (destination block) with fixtures, captions, scripts, optional `validatable` in the replay harness, tests and baselines. The ticket's open major is resolved in the plan: the compose negative clones the fixture without `validatable` and asserts last `rejectedWords` 'balked'; a second negative asserts the unmodified fixture with Set {'baked'} throws a validatable mismatch.
- Files: fixtures/how-to-play-compose.json, how-to-play-destination.json; src/engine/scene-replay.ts (+test); src/ui/scenes/ (compose.ts, destination.ts, tray-scene.ts, types, script, effects, geometry, Scene.svelte, index, tests); src/ui/text.ts; src/ui/how-to-play.test.ts (counts); e2e/how-to-play specs and two new final-frame baselines.
- Review: 3 medium patches applied (tests), 0 deferred, rest rejected as low.
- Follow-up review recommended: false (3 medium patched, no high).
- Verification: unit 2809 passed, lint/check/build green, e2e:dist, e2e (918 passed) and e2e:pwa (13) green; test:screens green in the container before the test-only patches. One earlier full run hit ERR_CONNECTION_REFUSED on the dev server (environment, from concurrent runs) and was rerun green.
- Residual risks: size-budget margin not recorded; reduced-motion frames leave dropped column cards beside the tray as scene 1 does.
