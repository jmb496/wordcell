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

Adds `src/ui/celebration/` (AD-19, SPEC CAP-2, F6-F8), not mounted or triggered by the game yet.

- `step(state, dtMs)`: pure, no DOM reads. Takes floor, ceiling, walls and each entry's launch origin as plain data. The origin is the entry's WordCell label point from `entry.cell` (F8), measured once by `start` from `src/ui/layout/` geometry and the band rect. Covers floor bounce, wall exit (sets `exited`), dt clamp to 50 ms, entry-index launch parameters and waves. The cap counts summed clamped dt; groups still moving fade over the last 1 × `baseMs` of the cap. Launch offsets and wave sizes scale so the last group has exited or faded by the cap for any entry count. Wave, stagger and physics constants are fractions of the cap or live in `motion.ts` (AD-19), within F6/F7. Zero groups returns a finished state.
- `Celebration.svelte`: takes the run's groups (card-id-free faces from `view.faces` by each entry's `cards`), band width and card width as props; the controller writes `transform` and opacity directly per frame (rule 3), with no per-frame reactive state. Pure `rowScale`: row width = card width × (1 + 0.5·(n−1)); fit 90 % of the band; floor 0.4 (DESIGN Win celebration, A-D12); when the floor binds the container clips. Each copy has `data-celebration` and `aria-hidden`.
- `celebration.svelte.ts`: `start(view, done)` throws while a run is active (rule 6); an empty or absent `wordList` calls `end()` at once, `done` once, no rAF. `end()` is idempotent and runs `done` synchronously here (entry 4's `attachOverlays()` moves it to a microtask, AD-19). `cancel()` never calls `done`. `end()`/`cancel()` with no run, or either after the other, do nothing. `onEnd(fn)` is one handler, called by `end()` only, before `done`. The run ends when every group has exited or at the cap.
- Drive loop: real rAF with dt the difference of timestamps (first frame 0, then clamped); the loop cancels its pending frame on `end()`/`cancel()`. Manual clock: `setManual(on)` is read at `start`, legal only when idle, and no rAF is scheduled while manual. `advance(ms)` runs floor(ms/16) steps of 16 ms, carries the remainder, renders once, and does nothing when idle or not manual (entry 5 delegates to it).
- `motion.ts` gets `celebrationCapMs()` = 6000 × `prefs.motion.baseMs` / `BASE_MS.normal`; `BASE_MS` is exported unchanged from `prefs.svelte.ts` as the existing Record (one constant, not a second copy).

Ticket fields: interface `step(state, dtMs)`; `start`, `end`, `cancel`, `setManual`, `advance`, `onEnd` on `celebration.svelte.ts`; `celebrationCapMs()`; exported `BASE_MS`. Tests are named `AD-19 …` (U). Owns the step, renderer, run controller, drive loop and cap. Consumers: entries 4-8. `plan_checkpoint: true`; risk in front matter; unknown in Notes.

## Acceptance Criteria

Verify: UI Vitest `AD-19 …` tests pass for floor contact (bounce count increments, vy reverses, y not below floor), exit sets `exited`, determinism (same inputs, equal states after N steps), dt clamp (500 ms equals 50 ms), ceiling bounce, two entries with different cells starting at different origins, the cap and fade (1 entry and a large list, at Fast and Slow), `celebrationCapMs()` of 3000, 6000 and about 10667 at Fast/Normal/Slow, an empty list, `end()` calling `done` once and `cancel()` never, a second `start` throwing, the manual clock stepping in fixed 16 ms sub-steps, a stubbed-rAF run driven to `end()` with no frame pending afterwards, `rowScale` for 23 letters at 360 px and 3 letters, and a render test showing copies with `data-celebration` and `aria-hidden`, a 50 % overlap, a `QU` copy with its badge, no `data-card-id`, `data-testid` or `data-mirror-of`, and the live `[data-card-id]` count unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-19, AD-14, AD-10
- design — DESIGN.md Win celebration, A-D12; EXPERIENCE.md Win celebration, Motion
- code — src/ui/motion.ts, src/shell/prefs.svelte.ts (BASE_MS), src/ui/layout/

## Notes

- Open question: The wave, stagger and physics constants are initial values here and are tuned at entry 6's checkpoint, the first point the motion can be seen; cost of DOM copies on a mid-range Android is judged there too.
