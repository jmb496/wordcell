---
id: 3
type: story
title: "Celebration step, renderer and run controller"
parent: epic-end-of-game-words
covers: [CAP-2]
after: [1]
risk: medium
---

# Celebration step, renderer and run controller

## Description

Adds `src/ui/celebration/`: the pure `step` (floor bounce, wall exit, dt clamp, entry-index launch parameters, waves, the cap with a closing fade), `Celebration.svelte` drawing one clipped row of card-face copies per entry with `data-celebration` and no card ids, and the overlay-agnostic run controller `celebration.svelte.ts` with `start(view, done)`, `end()` (calling `done` once, synchronously here), `cancel()`, a drive loop (real `requestAnimationFrame`, or a manual clock driven by `advance(ms)` that entry 5 delegates to) and an `onEnd` hook for entry 4 to attach the overlay pop to; the cap goes in `motion.ts` and `BASE_MS` is exported from `prefs.svelte.ts` (one constant, not a second copy); it is not mounted or triggered by the game yet.

## Acceptance Criteria

Verify: UI Vitest AD-19 tests pass for floor contact, exit, determinism, dt clamp, the cap and fade, an empty list, `end()` calling `done` once and `cancel()` never, the manual clock stepping in fixed 16 ms sub-steps, and a render test shows copies with `data-celebration` and no `data-card-id`, `data-testid` or `data-mirror-of`, a 23-letter row scaled to fit a 360 px band.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-19, AD-14, AD-10
- design — DESIGN.md Win celebration, A-D12; EXPERIENCE.md Win celebration, Motion
- code — src/ui/motion.ts, src/shell/prefs.svelte.ts (BASE_MS), src/ui/layout/

## Notes

- Open question: The wave, stagger and physics constants are initial values here and are tuned at entry 6's checkpoint, the first point the motion can be seen; cost of DOM copies on a mid-range Android is judged there too.
