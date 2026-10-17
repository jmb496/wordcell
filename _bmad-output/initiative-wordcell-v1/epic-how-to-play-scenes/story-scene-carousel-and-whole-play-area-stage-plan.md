---
title: 'Scene carousel and whole play-area stage'
type: 'feature'
ticket: '6'
created: '2026-10-17'
status: 'built'
baseline_revision: '412f96ec7a5d73de837fa50acb50c50a0462a1cc'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-carousel-and-whole-play-area-stage.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The How to play panel stacks all eight scenes; each is drawn on its own small fixed-pixel stage with few cards, which does not look like the game.

**Approach:** Replace the stack with a carousel (one mounted scene, arrow and dot buttons, Left/Right keys) over one shared stage that draws the whole play area (8 columns of at least 5 cards, tray with word strip, WordCells 3 to 10) at a card width fitted from the panel width by a new pure function in `src/ui/layout/geometry.ts`. The story file `story-scene-carousel-and-whole-play-area-stage.md` (Description, Acceptance Criteria, Notes with the owner's 2026-10-17 confirmation) is the complete behavioural contract and is read-only; do not restate or deviate from it.

## Boundaries & Constraints

**Always:** AGENTS.md rules 1-7 and conventions (controls in `act()`, texts only in `src/ui/text.ts`, no new window/visibility listeners, `data-testid` only from the allowed list, static `Card` with none of the four card attributes, stage `aria-hidden`, no GameView read). Existing scene scripts, fixtures and HP-5 replay tests stay valid; scripted geometry is rescaled from the fitted card width. Test names start with the HP id (Playwright) or AD-n (unit).

**Never:** swipe/drag, wrap-around, a live region, a window key listener, changes to `src/engine/`, the deal, or `data/` fixtures; no new `data-testid`. Do not edit the story's behaviours. Do not push or mark the ticket done.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open panel | howToPlay opens | scene 1 mounted, playing, step 1 | none |
| Next/Previous/dot/Left/Right | any index | moves, restarts at step 1; ends aria-disabled, click no-op, focus kept | none |
| Close then reopen | panel closed | no mounted scene, no animations; reopen on scene 1 | none |
| Narrow content (< 288 px) | width term wins | no horizontal overflow | none |
| Short height | landscape | height cap, card width >= 32 | none |
| Reduced motion | emulated | Next frame/Replay, focus moves per story | none |

</intent-contract>

## Code Map

- `src/ui/HowToPlayPanel.svelte` -- renders `basicScenes` then `trickyScenes` stacked (`.scenes`, `.tricky` with `h.tricky` heading); replace both with the carousel over `scenes` from `src/ui/scenes/index.ts`.
- `src/ui/Panel.svelte` -- `.content` (scroll container) gets `scrollbar-gutter: stable`; `.inner` max 560 px (content width is its box; story says 528 px max, measure it).
- `src/ui/scenes/Scene.svelte` (617 lines) -- one scene as `<figure>` with `.stage` sized by fixed `STAGE_W`/`TRAY_TOP + trayHeight` from `geometry.ts`; Card CSS vars `--wc-w/--wc-slot/--wc-H/--wc-strip`; tap button, reduced-motion Next/Replay `{#if frame < last}`; ScenePlayer effect (WAAPI) with `hiddenStop`/`whenVisible`.
- `src/ui/scenes/geometry.ts` -- fixed px constants (CARD_W 40, COLUMN_PITCH 52, ...), used by drag/compose/destination/place/scoring/destination-rule/source-drop/top-card/tray-scene scripts, `effects.ts`, `player.ts`, `scenes.test.ts`; rescale from the fitted width (derive a scale from `cardMetrics(w)` vs the 40 px base) rather than rewriting every script.
- `src/ui/scenes/player.ts`, `effects.ts` -- WAAPI player and keyframes in stage px.
- `src/ui/layout/geometry.ts` -- `cardWidth`, `cardMetrics(w)`; add the pure scene card-width function (+ stage height) here with unit tests in `geometry.test.ts`; `bands.ts` `BAND_ORDER` gives stage band order; `measure.ts` shared fit-to-width measuring.
- `src/ui/text.ts` -- `howTo.sceneControls` (next = "Next"); add "Previous scene", "Next scene", "Scene n of N" under `howTo`.
- `src/ui/overlays.svelte.ts` -- `isOpen('howToPlay')` open flag (index state stays in the carousel component), `SUSPENDING`.
- `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` (+ snapshots) -- existing coverage to adapt (stacked scenes assumptions) and extend; screenshots only via `npm run test:screens` (Docker).
- New: `src/ui/scenes/Carousel.svelte`, `src/ui/scenes/Stage.svelte` (or equivalent), filler-letter constant in `src/ui/scenes/`, with unit tests (stage structure, filler sequence, `act()` wrapping).

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/layout/geometry.ts` + `geometry.test.ts` -- pure scene card-width/stage-height function per the story's Fit paragraph -- AD-n tests pin the formula
- [ ] `src/ui/scenes/` stage + filler + rescaling -- shared whole-play-area stage, scripted geometry scaled from fitted width -- existing scene tests stay green
- [ ] `src/ui/scenes/Carousel.svelte`, `Scene.svelte`, `HowToPlayPanel.svelte`, `Panel.svelte`, `text.ts` -- carousel, controls, focus, keying, open-flag mounting, placeholder height
- [ ] `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- Playwright android tests per the story's AC; screens baseline regenerated in Docker
- [ ] Run `npm run test:all` and `npm run test:screens`

**Acceptance Criteria:**
- Given the story's Acceptance Criteria section, when the suites run, then every listed Playwright, unit and screens item passes and `npm run test:all` and `npm run test:screens` are green.

## Implementation Notes

Stage authored at the 40 px base and scaled by cardMetrics(w).slot/44 so scripts, player and fixtures are unchanged. sceneFit takes a third input (tallest WordCell stack, 6) beside column cards (9), pinned by a unit test. Files: Carousel.svelte, Stage.svelte, stage.ts (new); Scene, HowToPlayPanel, Panel, text.ts, geometry (both), drag/scoring/tray-scene scripts; e2e and unit tests; eight screens baselines regenerated in Docker.

## Plan Change Log

## Review Triage Log

### 2026-10-17 — Review pass
- verdicts: 31 findings — high 0, medium 4, low 14, false 8, maybe-false 5
- findings:
  - `[medium]` `[patch]` optional-chaining focus calls hide missing elements (rule 6) — fixed: Carousel/Scene throw when the bound element is missing.
  - `[medium]` `[patch]` deleted no-links assertion not replaced — re-added to the HP-1 carousel test.
  - `[medium]` `[patch]` Animation speed re-key only pinned by a source regex — added seeded-speed e2e (speed cannot change while the panel is open, LEGAL_TOPS); live re-key stays pinned by regex only.
  - `[medium]` `[patch]` landscape test did not exercise boxHeight wiring — now asserts card width below the width-only value.
  - `[low]` `[reject]` stage height ignores carousel chrome — the story defines heightTerm against the measured panel box.
  - `[low]` `[reject]` scale(slot/44) differs slightly from fitted width — within 1 px, floor is 32 and tested.
  - `[false]` `[reject]` scrollbar-gutter on all panels — the story states other panels' baselines may shift.
  - `[false]` `[reject]` index reset on close mid-fade — the story resets on the open flag going false.
  - `[false]` `[reject]` drag tray destination x 16 vs strip 6 — lands inside the empty strip.
  - `[maybe-false]` `[reject]` transient clientWidth 0, zero-width guard — rule 6, no defensive code; no demonstrated path.
  - `[low]` `[reject]` cell 3 figure offset, filler wording, source-regex test style, dead constants, key handler at ends (the story requires preventDefault at ends), screenshots of controls, panel-level SSR check, plan bookkeeping — cosmetic or by the story; not worth guards.
  - `[maybe-false]` `[reject]` intent-alignment lens: reading B implemented by hand-built stage; the story prescribes static Card stage, not reuse of game components.

## Design Notes

Prior ticket-hardening (7 passes) is in the story's `.review-log.md`; the story already encodes its outcomes.

## Verification

**Commands:**
- `npm run test:all` -- expected: all green
- `npm run test:screens` -- expected: green with the regenerated baseline (needs Docker)

## Auto Run Result

- Summary: scene carousel (arrows, dots, Left/Right) over one shared whole-play-area stage fitted by the new pure `sceneFit`; the Tricky heading is gone (6 headings).
- Files: see Implementation Notes.
- Review: 4 patches applied (see Review Triage Log), rest rejected with reasons; none deferred.
- Follow-up review recommended: false.
- Verification: `npm run test:all` ran 945 passed, 1 failed (`e2e/nav.spec.ts:162` android, outside this change) and passed 3 of 3 reruns alone plus once on the stashed baseline, so flaky under load; lint, check, unit, build (549,186 of 600,000 bytes), dist and pwa suites passed. `npm run test:screens` 44 passed.
- Residual risks: EXPERIENCE.md How to play section not updated (epic done-when item 5); blank space under short columns and filler in the empty columns of two Tricky scenes until 8.7 to 8.11 prune them; nav.spec flake; a stale dev server on :5173 makes the default `test:e2e` reuse old code.
