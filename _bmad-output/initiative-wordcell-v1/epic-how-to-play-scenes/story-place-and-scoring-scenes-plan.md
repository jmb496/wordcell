---
title: 'Place and scoring scenes'
type: 'feature'
ticket: '3'
created: '2026-10-16'
status: built
baseline_revision: '76fc0b450254d6032f89f168c08cfdf385a9a208'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-place-and-scoring-scenes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-compose-and-destination-block-scenes-plan.md'
warnings: [oversized]
deferred:
  - summary: >-
      Place scene layers keep earlier layers mounted in animated mode (hide: []); the animated look is untested.
    evidence: |-
      Reduced-motion frames and final baselines are checked; whether earlier layers show through later ones while animating is unverified. Settled by watching the animated scene at android size.
    location: >-
      src/ui/scenes/place.ts:90, src/ui/scenes/Scene.svelte:522
    severity: medium (unverified)
---

<intent-contract>

## Intent

**Problem:** The How to play panel lacks scene 4 (place BALKED, HP-3d) and scene 5 (scoring, HP-3e); their game content must be engine-checked (HP-5) with captions in text.ts (HP-6).

**Approach:** Add scenes `place` and `scoring` in 8.1/8.2's format (scripts in src/ui/scenes/, fixtures, captions), extend the replay harness with optional `cells`, `place`, `cellScores`, and test. The ticket file in `context:` is the full specification (Description, frames, steps, Interface, Tests); implement exactly it.

## Boundaries & Constraints

**Always:** Follow the ticket bullets and the Always list of plans 8.1 and 8.2 (text in text.ts `howTo.scenes`, durations from motion.ts, `act()` controls, `Card mirror="static"`, no `data-card-id`/`data-testid` in scenes, UI imports engine types only (AD-1), no new errors.ts code or engine/index.ts export, test names start with ids). Captions verbatim from the epic Notes.

**Never:** Change the deal, spec, spine or an AD; modify bga-wordcell; add fallbacks; implement scenes 6+; push; run screenshot baselines on the host (Docker `npm run test:screens` only); touch the engine beyond the optional harness fields in `src/engine/scene-replay.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Replay both fixtures | DICT with baked, balked | passes; placement order, cells, per-cell scores and total 61 match | none |
| Stated number changed | scoring 61 to 62, a per-cell score, a `cells` card, `legalTargets`, a target or order entry | harness Error | harness Error |
| `after` out of range | cells/place/cellScores/scores entry beyond command count | harness Error | harness Error |
| BALKED not in dictionary | place fixture, Set without balked | EngineError at command 4 setTarget | EngineError |
| Scenes played | android, reduced motion, Next to last frame | per-frame strip, target, order, numbers, total as the ticket's frame list | none |

</intent-contract>

## Code Map

- `src/engine/scene-replay.ts` -- `SceneFixture` gains optional `cells`, `place`, `cellScores`; checked against `viewFrom`
- `src/engine/how-to-play-scenes.test.ts` -- FIXTURES, replay and negatives; scoring (`commands` []) exempt from `moves.length > 0`
- `fixtures/how-to-play-compose.json` -- format and start to copy; add `how-to-play-place.json`, `how-to-play-scoring.json`
- `src/ui/scenes/` (`types.ts`, `script.ts`, `compose.ts`, `destination.ts`, `tray-scene.ts`, `effects.ts`, `geometry.ts`, `player.ts`, `Scene.svelte`, `index.ts`, `scenes.test.ts`) -- Frame/Step/COMMAND_TYPES widening, optional `Scene.carry`, new scripts
- `src/ui/text.ts` (`howTo.scenes`), `src/ui/HowToPlayPanel.svelte`, `src/ui/how-to-play.test.ts` -- captions, slots, counts
- `src/ui/WordCellRow.svelte`, `src/ui/Tray.svelte` -- visual reference for inert static markup
- `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- android step-through and final-frame baselines

## Tasks & Acceptance

**Execution:**
- [ ] `src/engine/scene-replay.ts` -- optional `cells`, `place`, `cellScores` -- ticket Interface
- [ ] `fixtures/how-to-play-place.json`, `fixtures/how-to-play-scoring.json` -- commands, cells, place, scores, validatable
- [ ] `src/ui/scenes/*` -- types, scripts, steps, optional carry, static visuals (strip, Confirm, per-cell scores, stacks)
- [ ] `src/ui/text.ts`, `src/ui/HowToPlayPanel.svelte` -- captions verbatim, slots after scene 3
- [ ] `src/engine/how-to-play-scenes.test.ts`, `src/ui/scenes/scenes.test.ts` -- ticket Tests
- [ ] `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- step to last frame, baselines via `npm run test:screens` (Docker)

**Acceptance Criteria:**
- Given the ticket's Verify line, when `npm run test:all` and `npm run test:screens` run, then both are green, with android tests playing both scenes to their last frame, a final-frame baseline of each, and a replay that checks the placement order and the 61 total and fails when a stated number is changed.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-16 — Review pass
- verdicts: 27 findings — high 0, medium 1, low 25, false 1, maybe-false 0
- findings:
  - `[low]` `reject` blind: ghost fade-in changes scenes 1–3 — the opacity default only applies when no opacity is passed; existing scene tests and baselines stay green in test:all
  - `[low]` `reject` blind: scene mode guessed from frame fields — scenes are hand-authored, defineScene fails fast on inconsistent landed/carry; an explicit kind adds surface for no reachable fault
  - `[medium]` `defer` blind + gap + edge: place layers use `hide: []`, so earlier layers stay mounted in animated mode and the look is untested — unverified whether the layers' backgrounds cover them (Scene.svelte:522); settled by watching the animated scene on a phone-size viewport
  - `[low]` `reject` blind: total 61 literal in scoring.ts and Scene.svelte — unit test ties frames to the fixture's scores; rule 6 style duplication already used by scenes 1–3
  - `[low]` `reject` blind + edge: empty-cell `cards: []` compares undefined to '' — no fixture states an empty cell; a loud mismatch, not a silent pass
  - `[low]` `reject` blind: `scene !== scoring` branch in the shared replay test — the ticket exempts scoring and gives it its own replay test
  - `[low]` `reject` blind: magic pixel offsets — same pattern as scenes 1–3 geometry, no named drift
  - `[low]` `reject` blind: tap command types accept any of the widened names — specified by the ticket's COMMAND_TYPES; coverage test pins indexes 3 to 7
  - `[low]` `reject` blind: EXPERIENCE.md catalogue / aria — scene text is in text.ts per HP-6; figures sit in aria-hidden animation per 8.1
  - `[low]` `reject` edge: cells with no cellScores at an `after` unchecked — would only matter for a fixture that states cells without scores; none does
  - `[low]` `reject` edge: flies element unknown / flies in a carried scene / total missing / carry-less frames — typos fail the unit tests at once; guards for states no scene reaches
  - `[low]` `reject` edge: scoreCells reads frame 0 cells — scoring fixture start equals its cells; unit test compares them
  - `[low]` `reject` edge: place-i layer without a reveal — unit test pins the steps; e2e plays them
  - `[false]` `reject` gap: no test of flies.by distance — the strip slide is cosmetic; the final frame is baseline-checked
  - `[low]` `reject` intent: visuals check hand-written frames, not the engine — the ticket specifies that split; the e2e pins 9, 16, 36 and 61 and the replay pins the fixture
  - `[low]` `reject` intent: no assertion the animated path ends equal to the reduced-motion frame; fly landing on cell 6 — covered by the ticket's Tests (play to last step plus baselines)
  - remaining lens remarks (stated no-gap items, readings A to D) restate the above or hold no defect — rejected

## Auto Run Result

- Summary: scenes 4 (place BALKED) and 5 (scoring, total 61) with fixtures, captions, scripts, optional `cells`, `place` and `cellScores` in the replay harness, tests and final-frame baselines.
- Files: fixtures/how-to-play-place.json, how-to-play-scoring.json; src/engine/scene-replay.ts (+tests); src/ui/scenes/ (place.ts, scoring.ts, types, script, effects, geometry, Scene.svelte, index, tests); src/ui/text.ts; src/ui/how-to-play.test.ts; e2e/how-to-play specs and two new baselines.
- Review: 0 patches, 1 deferred (medium, unverified), the rest rejected with reasons in the Triage Log.
- Follow-up review recommended: false (nothing patched).
- Verification: the implementing run reported test:all and test:screens green (2837 unit, 922 e2e, build 545,904 of 600,000 bytes); test:all re-run at finalize: all suites passed except one desktop e2e (Q-24 I-68 Flow 6) that hit an AD-15 font-load timeout under load and passed on rerun alone.
- Residual risks: animated-mode layering of place layers unverified; owner has not read the scene 4 and 5 visuals or the new `scoreFigure` ("3 × 3 = 9") and total ("Score 61") wording; Scene.offset/layout made optional and a Step.flies field added beyond the plan.

## Verification

**Commands:**
- `npm run test:all` -- expected: all green
- `npm run test:screens` -- expected: green after baselines generated in the container
