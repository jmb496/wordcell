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

Adds `src/ui/celebration/` (AD-19, SPEC CAP-2, F6-F8), not yet mounted or triggered.

- `step(state, dtMs)`: pure, no DOM reads. Plain data in state: floor, ceiling, walls, launch origins, `capMs`, `baseMs`, `elapsedMs` (the controller passes `celebrationCapMs()` and `prefs.motion.baseMs`). The origin is the entry's WordCell label point from `entry.cell` (F8); `start` measures it once with floor (action bar's top edge), ceiling and walls (band between the bars, DESIGN), from `src/ui/layout/`. A group drifts toward the side with more room from its origin x (EXPERIENCE). Covers floor bounce, wall exit (sets `exited`), dt clamp to 50 ms, entry-index launch and waves. The cap counts summed clamped dt; groups still moving fade over the last 1 × `baseMs` of the cap. Launch offsets and wave sizes scale so the last group has exited or faded by the cap for any entry count. Wave, stagger and physics constants are cap fractions or in `motion.ts` (AD-19), within F6/F7. `finished` is set when every group has exited or `elapsedMs` ≥ cap; zero groups is finished.
- `Celebration.svelte`: takes the run's groups (card-id-free faces from `view.faces` by entry `cards`), band width and card width as props. Copies use the live theme's normal card state at `{components.card.width}` with box-shadow `0 6px 16px #0008` (DESIGN). It registers its group elements with the controller on mount; the controller writes `transform`/opacity directly per frame (rule 3) only once registered (earlier frames still step state), with no per-frame reactive state. `rowScale(n, cardW, bandW)` = clamp(0.9·bandW / (cardW·(1+0.5(n−1))), 0.4, 1), never enlarging (A-D12); the band clips. Each copy has `data-celebration` and `aria-hidden`.
- `celebration.svelte.ts`: `start(view, done)` throws while a run is active (rule 6); an empty or absent `wordList` marks the run active, then ends it at once, no rAF. `end()` clears the run and cancels any frame, then calls `onEnd`, then `done` (always, so `start` inside `done` is legal); it is idempotent, `done` synchronous here (entry 4's `attachOverlays()` moves it to a microtask, AD-19). `cancel()` never calls `done`. `end()`/`cancel()` with no run, or after each other, do nothing. `onEnd(fn)` is one handler, replaced by a later call, kept across runs. `running()` (entry 5) reports an active run. Both drivers (rAF, `advance`) call `end()` when `finished`.
- Drive loop: real rAF with dt the difference of timestamps (first frame 0, then clamped to [0, 50]). Manual clock: `setManual(on)` is read at `start`, throws while a run is active, and no rAF is scheduled while manual. `advance(ms)` runs floor(ms/16) steps of 16 ms, carries the remainder (cleared at `start`), renders once, and does nothing when idle or not manual (entry 5 delegates to it).
- `motion.ts` gets `celebrationCapMs()` = 6000 × `prefs.motion.baseMs` / `BASE_MS.normal`; `BASE_MS` is exported unchanged from `prefs.svelte.ts` (one constant, no copy).

Ticket fields: interface `step(state, dtMs)`; `start`, `end`, `cancel`, `running`, `setManual`, `advance`, `onEnd` on `celebration.svelte.ts`; `celebrationCapMs()`; exported `BASE_MS`. Tests are named `AD-19 …` (U). Consumers: entries 4-8. `plan_checkpoint: true`; risk in front matter; unknown in Notes.

## Acceptance Criteria

Verify: UI Vitest `AD-19 …` tests pass for floor contact (bounce count increments, vy reverses, y not below floor), exit sets `exited`, determinism, dt clamp (500 ms equals 50 ms), ceiling bounce, entries with different cells starting at different origins, the cap and fade (1 entry and a large list, Fast and Slow), `celebrationCapMs()` of 3000, 6000 and about 10667 at Fast/Normal/Slow, an empty list (`onEnd`, `done` once each; then `start`, also inside `done`, does not throw), origins left and right of centre drifting in opposite directions, `end()` calling `done` once and `cancel()` never, a manual `advance` past the cap ending the run once with `running()` false, a second `start` throwing, the manual clock stepping in fixed 16 ms sub-steps, a stubbed-rAF run ending with no frame pending, `rowScale` with explicit card width 40: 3 letters 1, 23 letters at 360 px 0.675 (floor not binding at DESIGN's minimum card width; a 150 px band gives 0.4), and a render test showing copies with `data-celebration` and `aria-hidden`, the shadow, a 50 % overlap, a `QU` copy with its badge, no `data-card-id`, `data-testid` or `data-mirror-of`, live `[data-card-id]` count unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-19, AD-14, AD-10
- design — DESIGN.md Win celebration, A-D12; EXPERIENCE.md Win celebration, Motion
- code — src/ui/motion.ts, src/shell/prefs.svelte.ts (BASE_MS), src/ui/layout/

## Notes

- Open question: wave, stagger and physics constants are initial values, tuned at entry 6's checkpoint (first visible motion), which also judges DOM-copy cost on a mid-range Android.
