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

Tracer bullet: a scene player, the fixture format and the engine replay harness, with scene 1 wired above the text sections of the How to play panel. Scene 1 is the §8 position: press E, lift E D K A, drop on column 3, the tray opens (drawn static), caption "Press a card and drag: it takes every card below it. Drop the stack on a column." All scene text lives in text.ts howTo; each scene is a `<figure>` with a visible text description and aria-hidden animation.

- Fixture: fixtures/how-to-play-<scene>.json holds the §8 start position (cards as letters, QU as 'QU'), the ordered engine commands, and per-scene words, stated scores and rejected cases. Scene 1 has a moves part only.
- Script: src/ui/scenes/ holds the steps (grab, move, drop, tap), each with a scene-local target id and a motion.ts kind, never literal ms, plus the pointer paths. The rest between loops is a motion.ts-derived duration. A script with no steps or an unresolvable target throws at load (AGENTS rule 6).
- Durations: existing kinds (snap for grab and drop, undoRedo for moves, overlay for the tray); a new kind goes in FACTOR with a motion.test.ts update only if none fits, otherwise scale through duration() alone (epic Notes). Animation speed Slow runs a scene longer than Fast.
- Cards: scene cards render with Card mirror="static", the player moves scene-local wrapper elements with WAAPI, the pointer ghost is a separate scene-only element (not mirror 'ghost'), and no scene element carries data-card-id or data-testid; tests locate by the figure's role and name.
- Run states: a tap pauses or restarts; the small pause/play icon shows the state. Closed = the panel is not open (unmounted, document.getAnimations() empty). Hidden = the page hidden: game.svelte.ts exposes only the whenVisible() promise, no hidden-state flag, and src/ui takes no visibilitychange or pagehide listener (AD-9), so the plan picks the lowest-impact stop and reports it. Reopening starts at step 1.
- Reduced motion: no WAAPI movement; frames show one at a time (frame i = state after step i, frame 0 the start); a Next button advances; the final frame is the resting state, Next is absent there and a Replay control returns to frame 1; the pause/play icon is not shown.
- Controls: every scene button (pause/play tap target, Next, Replay) is an act()-wrapped real button with a text.ts name, outside the aria-hidden node.
- Replay harness: the test lives in src/engine/, builds the §8 start through the engine-internal start seam (never exported from index.ts), and exports its replay function from a test-side module so a second test feeds it a cloned fixture with an illegal move, a non-word or a wrong stated score and asserts the check code with expectEngineError. The dictionary is an inline Set built from the fixture's words. Optional fields are checked only when present; a rejected case is {command, expected no-op or errors.ts check code}, referencing a TABLE row by id, never importing or copying the TABLE.
- Baselines: regenerates the How to play panel baseline (e2e/how-to-play.screens.spec.ts, how-to-play-example-android-linux.png; the scene now sits above the text) in the Playwright container and adds a scene 1 final-frame baseline under reduced motion; text-removal baselines stay in ticket 5.

Unknown: largest entry (player, fixture format and replay harness in one session).
Interface: new src/ui/scenes/ (player, script types, one script per scene); fixtures/how-to-play-*.json; src/engine/ scene replay test; HowToPlayPanel.svelte gains a scene slot; text.ts howTo gains scene strings.
Tests: engine replay of every fixture (U); play, pause, restart (P6 android); reduced-motion step-through (P6); closed panel animates nothing (U or P6); Slow longer than Fast; structure of figure, description, aria-hidden node and act()-wrapped controls (U). Names: R-10, R-20, R-23 for the replay, AD-n for UI unit tests, HP ids trailing.
Owns: the scene player, the fixture format and the engine replay harness.
Consumers: HowToPlayPanel.svelte and text.ts howTo (shared with 6.9 sections); e2e/how-to-play.spec.ts; e2e/how-to-play.screens.spec.ts with its baseline.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with a Playwright android test that plays, pauses and restarts scene 1, a reduced-motion test that steps through its frames, a test that a closed panel runs no animation, and an engine test that fails (EngineError check code) when a cloned fixture holds an illegal move, a non-word or a wrong stated score.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-10, R-20, R-23, §8
- code — src/ui/HowToPlayPanel.svelte, src/ui/motion.ts, src/ui/Card.svelte, src/engine/commands.test.ts TABLE
- constraint — ARCHITECTURE-SPINE.md#ad-1 (UI imports engine types only; engine tests may import fixtures/*.json)

## Notes

- Plan checkpoint: the plan decides whether the harness splits into a following entry. Done checkpoint: yes.
