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

Tracer bullet: a scene format (steps grab, move, drop, tap with a target and a time) whose game content (moves, words, scores) is JSON under fixtures/, a player that animates it on static Card components with a pointer ghost through WAAPI with motion.ts durations, loops with a rest between runs, pauses and restarts on a tap with a small pause/play icon, stops when the panel is closed or hidden and steps through frames under reduced motion; wires it above the text sections of the How to play panel with scene 1 (press E, lift E D K A, drop on column 3, HP-3a); adds the engine test under src/engine/ that replays every scene fixture through the real engine (legal moves, dictionary words, stated scores, rejected cases against the command TABLE); all scene text in text.ts, each scene a figure with a text description and aria-hidden animation.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with a Playwright android test that plays, pauses and restarts scene 1, a reduced-motion test that steps through its frames, a test that a closed panel runs no animation, and an engine test that fails when the fixture is changed to an illegal move.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-10, R-20, R-23, §8
- code — src/ui/HowToPlayPanel.svelte, src/ui/motion.ts, src/ui/Card.svelte, src/engine/commands.test.ts TABLE
- constraint — ARCHITECTURE-SPINE.md#ad-1 (UI imports engine types only; engine tests may import fixtures/*.json)

## Notes

- Open question: Largest entry: player, fixture format and replay harness in one session; if the plan exceeds one session, split the harness into a following entry. Also whether a scene needs a duration no existing motion kind gives.
