---
title: 'Scene 3: place with cards tucking into the WordCell'
type: 'feature'
ticket: '8'
created: '2026-10-17'
status: 'built'
baseline_revision: '85b61219ce73d93b639f652927fc801349b2f05c'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-3-place-with-cards-tucking-into-the-wordcell.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-place-and-scoring-scenes-plan.md'
warnings: [oversized]
deferred: []
---

<intent-contract>

## Intent

**Problem:** The place scene's Confirm step slides the whole placement strip to WordCell 6 and ends with a six-card stack; the game shows one top card (R-52), so the figure misleads (HP-3).

**Approach:** Replace the strip fly with six per-card `tuck-k` fliers (D B A L K E, R-51) that land leftmost first on cell 6's top-card face, then swap to a final frame whose cell 6 draws one Card (E). The ticket file in `context:` is the full specification (Description, tuck geometry, keyframes, effects, tests); implement exactly it.

## Boundaries & Constraints

**Always:** Follow the ticket bullets and the Always list of plans 8.1 to 8.7 (text in text.ts, durations from motion.ts, mirrors without `data-card-id`/`data-testid`, UI imports engine types only (AD-1), test names start with ids, AGENTS rule 6 throws in `defineScene`). Fixture commands, steps up to the Confirm tap, frames 0 to 4 and the caption stay unchanged.

**Never:** Change the engine, the fixture content (`cells` keeps six cards), R-65, the other scenes' stacks, the caption wording; modify bga-wordcell; add fallbacks; push; generate screenshot baselines on the host (Docker `npm run test:screens` only).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Motion on, step 6 | Confirm tapped | six `tuck-k` fliers land one after another, D first; strip and Confirm hidden at the start; swap to `place-5` | none |
| Reduced motion | Next to last frame | cell 6 holds exactly one Card, E | none |
| Bad script | `tucks.cell` or `letters` mismatch the last `placeOrder` frame | `defineScene` throws | throw |
| Tap mid-tuck | `tuck-1` between 1/6 and 2/6, tap, tap | frame-0 look restored | none |

</intent-contract>

## Code Map

- `src/ui/scenes/place.ts` -- step 6 becomes `tucks`; new element ids `tuck`, `tuck-0..5`, `confirm`; last frame `cellTop`
- `src/ui/scenes/types.ts` -- `Step.tucks`, `Frame.cellTop`; `flies` stays for other scenes if used
- `src/ui/scenes/script.ts` -- `defineScene` validation of `tucks`
- `src/ui/scenes/effects.ts` -- `Effect.easing`; `fly` case handles `step.tucks` first (tuck keyframes, hides, ghost fade, phase-1 swap)
- `src/ui/scenes/player.ts` -- `PlayerDeps.animate` gains `easing`; `play()` forwards `e.easing`
- `src/ui/scenes/Scene.svelte` -- `tuck` layer with six fliers, `confirm` span marker, `cellCards` honours `cellTop`, `animate` passes easing (`easing ?? 'ease-in-out'`)
- `src/ui/scenes/geometry.ts` -- `FACE_MARGIN` 2; correct the `MAX_CELL_CARDS` comment
- `src/ui/scenes/scenes.test.ts`, `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- tests per the ticket's Tests paragraph; fakes of `PlayerDeps` follow
- `fixtures/how-to-play-place.json` -- unchanged

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/scenes/types.ts`, `script.ts`, `effects.ts`, `player.ts`, `geometry.ts`, `place.ts`, `Scene.svelte` -- implement the tuck per the ticket
- [ ] `src/ui/scenes/scenes.test.ts` -- AD-n unit tests on `sceneEffects`, `defineScene`, DOM order, reduced motion, `cellCards`
- [ ] `e2e/how-to-play.spec.ts` -- motion-on tuck test (R-51), reduced-motion one card (R-52), mid-tuck restart test; update the existing place assertions
- [ ] `e2e/how-to-play.screens.spec.ts` -- regenerate only the scene-3 final android baseline in Docker

**Acceptance Criteria:**
- Given the place scene with motion on, when step 6 runs, then six `tuck-k` animations run and `tuck-5`'s face rect equals cell 6's Card face rect in `place-5` at rest.
- Given reduced motion, when Next reaches the last frame, then cell 6 holds exactly one Card, E.
- Given a mid-tuck tap and a second tap, then the frame-0 look returns.
- Given the fixture, the engine replay still passes and the other scenes are unchanged.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-17 — Review pass
- verdicts: 31 findings — high 0, medium 2, low 12, false 4, maybe-false 0 (13 duplicates of the above counted as low/false rows below)
- findings:
  - `[medium]` `patch` Blind/Edge: `stripId` falls back to `strip--1` (AGENTS rule 6) — now throws.
  - `[medium]` `patch` Verification-gap: nothing proves the player forwards `easing` — fake records it, new ScenePlayer test asserts `'linear'` on every `tuck-k`.
  - `[low]` `patch` Blind/Edge/Gap: e2e rect check omits height — height added.
  - `[low]` `reject` Blind/Edge: `cellTop` is all-or-nothing, no `defineScene` validation of it — one scene uses it, guard adds complexity, final-frame tests pin E.
  - `[low]` `reject` Edge: `confirm` marker not gated to place mode — only layers with `placeOrder` and a lit Confirm span carry it; scoring has none.
  - `[low]` `reject` Blind: `tuckFrom` wrapper, `tuckEnd` hard-coded geometry (e2e rect check pins it), plan-record gaps, `oversized` unexplained, aria-hidden — cosmetic; the figure is already aria-hidden.
  - `[low]` `reject` Edge: `Step.flies` now unused — pre-existing type, removal out of scope.
  - `[low]` `defer`-not-needed: no e2e opacity poll on hidden strip/Confirm mid-tuck — final screenshot and rect tests cover the visible result.
  - `[false]` `reject` Intent: E2 occlusion untested — fliers paint above earlier cards in DOM order and the ticket specifies exactly this; Blind: mid-tuck window flaky — the ticket mandates that poll; reduced-motion toggle mid-scene — the player is not created under reduced motion.

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green (only the scene-3 final baseline changes)

## Auto Run Result

- Summary: Scene 3's Confirm step now tucks six per-card fliers (D B A L K E) into WordCell 6, leftmost first, and the final frame draws one top card (E). Fixture, engine and caption unchanged.
- Files: `src/ui/scenes/{types,script,effects,player,geometry,place}.ts` and `Scene.svelte` (tuck mechanism, `cellTop`); `scenes.test.ts`, `e2e/how-to-play.spec.ts` (tests); `e2e/how-to-play.screens.spec.ts` and the scene-3 final android baseline (regenerated in Docker).
- Review: patches applied 3 (medium 2: `strip--1` fallback now throws, easing forwarding test; low 1: rect height check); no defers; rejected findings listed with reasons in the Review Triage Log.
- Follow-up review recommended: false (no high, one patched medium pair is test and guard hardening only).
- Verification: lint, check, unit (2933), build, dist smoke, `test:e2e` (946 passed; one unrelated `board-keys` Q-24 desktop teardown timeout, passed 3/3 on rerun), `test:e2e:pwa` (13) green; `test:screens` 43 passed before the three small patches (none visual).
- Residual risks: baseline refresh for this scene needs the file deleted first (tolerance 0.01 hides a six-card to one-card change); the board-keys Q-24 desktop test is flaky under load.
