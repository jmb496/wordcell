---
title: 'Scene player, first scene and engine replay harness'
type: 'feature'
ticket: '1'
created: '2026-10-16'
status: 'built'
baseline_revision: '6a8ad66f61fa932ffc64b1bf7d75ccc98f7ed493'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-player-first-scene-and-engine-replay-harness.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md'
warnings: [oversized]
deferred:
  - summary: >-
      Slow/Fast e2e opens two pages in one context.
    evidence: |-
      Prefs could leak between pages; settle by using separate contexts.
    location: >-
      e2e/how-to-play.spec.ts
    severity: low (unverified)
---

<intent-contract>

## Intent

**Problem:** The How to play panel is static text; HP-1, HP-2, HP-5 and HP-6 call for looping animated scenes whose scripts cannot drift from the engine rules.

**Approach:** Build the scene player (src/ui/scenes/), the fixture format (fixtures/how-to-play-*.json) and an engine replay harness, and wire scene 1 (§8: press E, lift E D K A, drop on column 3, tray opens) above the text sections. The ticket file named in `context:` is the full specification of this plan (Description, Acceptance Criteria, Notes incl. the owner decision that a tap while paused restarts from step 1); implement exactly it.

## Boundaries & Constraints

**Always:** Follow the ticket's bullets (Fixture, Script, Durations, Cards, Run states, Reduced motion, Controls, Replay harness, Baselines). All scene text in text.ts `howTo`; durations only from motion.ts `duration()`; controls wrapped in `act()`; scene cards `Card mirror="static"`, no `data-card-id`/`data-testid` in scenes; hidden-page stop without any visibilitychange/pagehide listener in src/ui (AD-9); UI imports engine types only (AD-1); engine replay helper is a non-test engine source importing neither vitest nor fixtures; no new errors.ts code; no new export from src/engine/index.ts; test names start with ids per AGENTS Conventions.

**Never:** Change the deal, spec, spine or any AD; modify bga-wordcell; add a defensive fallback (bad script throws at load); implement scenes 2+; commit or push; run screenshot baselines on the host.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Play | Panel open, motion normal | Scene loops with rest; pointer ghost grabs E D K A, drops on column 3, tray opens | none |
| Tap | Tap button while playing / while paused | Pauses / restarts from step 1; icon shows state | none |
| Closed or hidden | Panel closed / document.hidden | Scene's getAnimations() empty / stops; reopen or visible restarts at step 1 | none |
| Reduced motion | pref reduced | No WAAPI, no tap button; frames 0..3 via Next, final frame has Replay to frame 0 | none |
| Speed | prefs Slow vs Fast | Step WAAPI effect duration Slow > Fast | none |
| Bad script | no steps / unknown target id | Throws at load | AGENTS rule 6 |
| Bad fixture | illegal move / non-word / wrong stated score | EngineError check code / rejectedWord outcome / harness Error | per ticket Replay harness |

</intent-contract>

## Code Map

- `src/ui/HowToPlayPanel.svelte` -- add scene slot above the text sections
- `src/ui/motion.ts` -- `duration(kind)`, FACTOR; reuse snap/undoRedo/overlay; new kind only if none fits (+ motion.test.ts)
- `src/ui/Card.svelte` -- `mirror="static"` (aria-hidden, no ids)
- `src/ui/act.ts` -- `act()` wrapper
- `src/ui/text.ts` -- `howTo` block (line ~85, ~334): add scene strings
- `src/shell/game.svelte.ts` -- `whenVisible()` (AD-9) is shell; UI may read `document.hidden` at step boundaries
- `src/engine/test-helpers.ts` -- `startOf(['QABC'..], {cell: 'LM'})` start seam; `src/engine/commands.test.ts` TABLE (cite, never copy)
- `docs/game-flow-spec.md` §8; `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` (+ snapshots); `fixtures/`, `e2e/helpers/`

## Tasks & Acceptance

**Execution:**
- [ ] `fixtures/how-to-play-<scene>.json` -- scene 1 start, commands, no words/scores
- [ ] `src/engine/<replay helper>.ts` + `src/engine/how-to-play-scenes.test.ts` -- replay every fixture via the engine; negative cases per ticket
- [ ] `src/ui/scenes/` -- script types, scene 1 script, player component, load-time validation
- [ ] `src/ui/text.ts`, `src/ui/HowToPlayPanel.svelte` -- strings; figure with description, aria-hidden animation, act() controls
- [ ] unit tests (script vs fixture, bad script, rest = duration(), structure, hidden stop) and `e2e/how-to-play.spec.ts` (play/pause/restart, reduced-motion steps, closed no animation, Slow>Fast)
- [ ] `e2e/how-to-play.screens.spec.ts` -- baselines via `npm run test:screens` in Docker

**Acceptance Criteria:**
- Given the ticket's Verify line, when `npm run test:all` and `npm run test:screens` run, then both are green with the listed android tests and the three engine negative cases failing as specified.

## Implementation Notes

Plan checkpoint (ticket Notes): the harness stays in this ticket unless the implementer finds it cannot fit one session; record any split need here rather than splitting.

## Plan Change Log

## Review Triage Log

### 2026-10-16 — Review pass
- verdicts: 33 findings (blind 8 areas, edge-case 17, gap 3, intent 6 divergences) — summarised by root cause below
- findings:
  - `[medium]` `patch` paused scene restarts after hidden→visible; toggle during hidden wait — fixed in player.ts, unit test added
  - `[medium]` `patch` fixture indices unchecked in scene-replay.ts — range check with harness Error, test added
  - `[medium]` `patch` no e2e for Scene.svelte hidden wiring — e2e test added
  - `[low]` `reject` dictionary repro vacuous for scene 1, carry duplicated by hand, narrow-width clipping, reduced-motion flip live, aria description per frame, fixed sleeps, closed-panel filter, baseline of worked example unchanged, test-helpers import (ticket names startOf in test-helpers.ts) — scene 1 is moves-only per ticket; pinned by test; not worth added complexity
  - `[maybe-false]` `defer` two pages sharing one context in the Slow/Fast e2e — test passes; settle by running with separate contexts

## Verification

**Commands:**
- `npm run test:all` -- expected: all green
- `npm run test:screens` -- expected: green after baselines regenerated in the container

## Auto Run Result

- Summary: scene player (src/ui/scenes/), fixture fixtures/how-to-play-drag.json, engine replay harness (src/engine/scene-replay.ts + test), scene 1 wired above the How to play text sections.
- Files: see git diff since baseline; panel, text.ts, unit/engine/e2e tests, new final-frame screenshot baseline.
- Review: 3 patches applied, 1 deferred, rest rejected as low.
- Follow-up review recommended: false (patched mediums: 3, no high).
- Verification: `npm run test:all` green after patches (914 e2e passed, pwa 13 passed). `npm run test:screens` ran green in the container before the patches (patches do not touch screens).
- Residual risks: hidden stop only at step boundaries; stage is fixed 252px wide (clips on very narrow containers).
