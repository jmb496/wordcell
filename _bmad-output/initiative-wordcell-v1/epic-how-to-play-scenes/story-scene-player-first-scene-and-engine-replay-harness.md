---
id: 1
type: story
title: "Scene player, first scene and engine replay harness"
parent: epic-how-to-play-scenes
covers: [HP-1, HP-2, HP-5, HP-6]
risk: medium
---

# Scene player, first scene and engine replay harness

## Description

Tracer bullet: scene player, fixture format and engine replay harness, scene 1 wired above the How to play text sections. Scene 1 (§8): press E, lift E D K A, drop on column 3, the tray opens (static), caption "Press a card and drag: it takes every card below it. Drop the stack on a column." All scene text lives in text.ts howTo; each scene is a `<figure>` with a visible description and aria-hidden animation.

- Fixture: fixtures/how-to-play-<scene>.json holds the §8 start position (cards as letters, QU as 'QU': the harness maps it to the engine's QU card, startOf in test-helpers.ts taking 'Q'; the UI renders letters only), the ordered engine commands, and per-scene words, stated scores and rejected cases. Scene 1: moves only.
- Script: src/ui/scenes/ holds the steps (grab, move, drop, tap), each with a scene-local target id, a motion.ts kind (never literal ms) and the pointer paths. Grab and drop steps name the fixture command index they animate; frames derive from fixture start plus commands. The rest between loops is a duration() value (default a baseMs multiple via an existing kind, confirmed in FACTOR). No steps or an unknown target id throws at load (AGENTS rule 6).
- Durations: existing kinds (snap for grab and drop, undoRedo for moves, overlay for the tray); a new kind goes in FACTOR with a motion.test.ts update only if none fits (epic Notes). Slow animation speed runs longer than Fast.
- Cards: scene cards render with Card mirror="static", the player moves scene-local wrappers with WAAPI, the pointer ghost is a scene-only element (not mirror 'ghost'), and no scene element carries data-card-id or data-testid; tests locate by the figure's role and name.
- Run states: a tap pauses or restarts; a small pause/play icon shows the state. Closed = panel unmounted, document.getAnimations() empty. Hidden = page hidden: game.svelte.ts exposes only whenVisible(), no flag, and src/ui takes no visibilitychange or pagehide listener (AD-9), so the plan picks the lowest-impact stop. Reopening or returning to visible restarts at step 1; the plan tests the hidden stop or records an exemption (no hide signal reachable from src/ui).
- Reduced motion: no WAAPI movement; frames show one at a time (frame i = state after step i, frame 0 the start); Next advances; the final frame is the resting state, with no Next and a Replay control returning to frame 0; scene 1: 0 start, 1 stack lifted, 2 over column 3, 3 dropped, tray open (final); no pause/play icon.
- Controls: pause/play, Next and Replay are act()-wrapped real buttons with text.ts names, outside the aria-hidden node.
- Replay harness: the test lives in src/engine/ and builds the §8 start through the engine-internal start seam (never exported). Its replay function is exported from the replay *.test.ts and imported by a second *.test.ts (or a helper importing neither vitest nor fixtures) that feeds it cloned fixtures: an illegal move asserts the check code via expectEngineError, a non-word the command's rejectedWord outcome, a wrong stated score (engine score + 1) a harness-raised assertion failure; no new errors.ts code. Negative tests add a minimal words/scores part to scene 1. Fixture words are checked against the real generated dictionary, loaded once per file in a dictionary repro test; the non-word test injects a word absent from it. Optional fields are checked only when present; a rejected case states its expected outcome and cites the TABLE row's id and precondition (TABLE not imported or copied).
- Baselines: regenerates the How to play panel baseline (e2e/how-to-play.screens.spec.ts, how-to-play-example-android-linux.png) in the Playwright container and adds a scene 1 final-frame baseline under reduced motion; text-removal baselines: ticket 5.

Unknown: largest entry (player, fixture format, replay harness).
Interface: src/ui/scenes/ (player, script types, scripts); fixtures/how-to-play-*.json; src/engine/ scene replay test; HowToPlayPanel.svelte scene slot; text.ts howTo scene strings.
Tests: engine replay of every fixture (U); play, pause, restart (P6 android); reduced-motion step-through (P6); closed panel animates nothing (U or P6); Slow longer than Fast; script matches its fixture commands (source, tail length, destination), bad script throws, rest equals a duration() value (U, AD-n); hidden stop or exemption; structure of figure, description, aria-hidden node and act()-wrapped controls (U). Names: R-10, R-20, R-23 (replay), AD-n (UI unit), HP ids trailing.
Owns: the scene player, the fixture format and the engine replay harness.
Consumers: HowToPlayPanel.svelte and text.ts howTo (shared with 6.9 sections); e2e/how-to-play.spec.ts; e2e/how-to-play.screens.spec.ts.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright android tests that play, pause and restart scene 1, step through its reduced-motion frames, show a closed panel animates nothing, and an engine test fails on a cloned fixture holding an illegal move (EngineError check code), a non-word (rejectedWord) or a wrong stated score (assertion).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-10, R-20, R-23, §8
- code — src/ui/HowToPlayPanel.svelte, src/ui/motion.ts, src/ui/Card.svelte, src/engine/commands.test.ts TABLE
- constraint — ARCHITECTURE-SPINE.md#ad-1 (UI imports engine types only; engine tests may import fixtures/*.json)

## Notes

- Plan checkpoint: the plan decides whether the harness splits into a following entry. Done checkpoint: yes.
