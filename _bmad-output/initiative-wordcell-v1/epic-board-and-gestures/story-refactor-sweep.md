---
id: 13
type: story
title: "Refactor sweep"
parent: epic-board-and-gestures
covers: [CAP-10]
after: [12]
risk: low
---

# Refactor sweep

## Description

Closing cleanup of epic 4 from the build records and deferred review findings, plus the epic 3 carry-ins: move the history.svelte.ts cases into src/shell/history.svelte.test.ts with names unchanged (R7), fold the game, history and prefs stores' repeated rejectReason, launch-text/isStale()/loaded() snapshot and halted/booting write guard into src/shell/stored-key.ts (F18, never importing ./storage; no behaviour or message change; R6), and re-measure the unit suite (median of three warm npm test runs after a discarded warm-up and the slowest engine file's watch re-run, recorded in the plan), splitting src/architecture.test.ts with its exemption first if the median exceeds 5 s and stopping for the owner before built if it still does or a watch re-run exceeds 1 s.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with every existing test passing unedited except imports, game.svelte.test.ts holding only game-store cases, the plan recording the warm median, the watch re-run and every change mapped to a deferred finding, and the median under 5 s or the owner stop recorded.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-10
- retro — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md, Action items R6, R7

## Notes

- Open question: Scope beyond R6, R7 and the re-measure is unknown until the earlier builds finish.
