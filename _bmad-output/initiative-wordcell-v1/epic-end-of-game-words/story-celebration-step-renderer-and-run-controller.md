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

Adds `src/ui/celebration/` (AD-19, SPEC CAP-2, F6-F8), unmounted, untriggered.

- `step.ts` `step(state, dtMs)`: pure, no DOM reads. State (plain data): floor, ceiling, walls, launch origins, per-group width (`rowScale` × row width) and card height, `capMs`, `baseMs`, `elapsedMs`. The origin is the x and y of the `wordcell-<n>` label centre (`entry.cell`, F8) relative to the band; a missing element throws (rule 6). `start` measures it once, with floor (action bar's top edge), ceiling, walls (band between the bars, DESIGN) and sizes via `src/ui/layout/`. A group drifts toward the side with more room; a tie at band centre drifts right. Floor contact (box bottom ≥ floor) reverses vy and increments the bounce count; ceiling contact (box top ≤ ceiling) reverses vy; `exited` = whole box beyond its wall. Also dt clamp to 50 ms, entry-index launch, waves. The cap counts summed clamped dt; moving groups fade over the last `baseMs` of it. Launch offsets and wave sizes scale so every group has exited or faded by the cap for any entry count. Wave, stagger and physics constants are cap fractions or in `motion.ts` (F6/F7). `finished` when every group has exited or `elapsedMs` ≥ cap; zero groups is finished.
- `Celebration.svelte`: takes groups (card-id-free faces from `view.faces` by entry `cards`), band width and card width as props. Copies use the live theme's normal card at `{components.card.width}`, box-shadow `0 6px 16px #0008` (DESIGN). It registers its group elements on mount; once registered the controller writes `transform`/opacity directly per frame (rule 3; earlier frames still step state), no reactive state per frame. `rowScale(n, cardW, bandW)` = clamp(0.9·bandW / (cardW·(1+0.5(n−1))), 0.4, 1), never enlarging (A-D12); the band clips. Each copy has `data-celebration` and `aria-hidden`.
- `celebration.svelte.ts`: `start(view, done)` throws while a run is active (rule 6); an empty or absent `wordList` starts then ends the run at once, calling `onEnd` and `done`, no rAF. `end()` clears the run, cancels any frame, calls `onEnd`, then `done` (so `start` inside `done` is legal); idempotent, `done` synchronous here (entry 4 moves it to a microtask, AD-19). `cancel()` clears the run (`running()` false, a later `start` legal) and the pending frame, and calls neither `onEnd` nor `done` (the overlay's removal callback already popped the entry, AD-19). `onEnd(fn)` is one handler, replaced by a later call, kept across runs. `running()` (entry 5) reports an active run. Both drivers call `end()` when `finished`.
- Drive loop: real rAF, dt the timestamp difference (first frame 0, then clamped to [0, 50]). Manual clock: `setManual(on)` is read at `start`, throws while a run is active, and no rAF is scheduled while manual. `advance(ms)` runs floor(ms/16) steps of 16 ms, carries the remainder (cleared at `start`), renders once (a run finishing inside `advance`: step, render, then `end()`), stops once `end()` has run, and does nothing when idle, not manual or ms ≤ 0.
- `motion.ts` gets `celebrationCapMs()` = 6000 × `prefs.motion.baseMs` / `BASE_MS.normal`; `BASE_MS` is exported unchanged from `prefs.svelte.ts`.

Tests are named `AD-19 …` (U). Consumers: entries 4-8. `plan_checkpoint: true`; risk in front matter; unknown in Notes.

## Acceptance Criteria

Verify: UI Vitest `AD-19 …` tests pass for floor contact (bounce count, vy reverses, y not below floor), `exited`, determinism, dt clamp (500 ms equals 50 ms), ceiling bounce, different cells giving different origins, the cap and fade (1 entry, a large list; Fast, Slow), `celebrationCapMs()` of 3000, 6000 and 10666.67 (tolerance) at Fast/Normal/Slow, an empty list (`onEnd`, `done` once each; `start` after and inside `done` legal), origins left and right of centre drifting oppositely, exact centre drifting right, a wide row near a wall exiting only when wholly past, `onEnd` replaced and kept across runs, `start` throwing with no `wordcell-<cell>` element and leaving no run active, `setManual` throwing while running, `advance` remainder carried and cleared at `start`, rAF first-frame dt 0, clamp [0, 50], frames before registration stepping without writes, `end()`/`cancel()` with no run or after each other doing nothing, `end()` calling `done` once, `cancel()` mid-run leaving `running()` false and no frame pending, calling neither `onEnd` nor `done`, and a later `start` working, a manual `advance` past the cap ending the run once, a second `start` throwing, 16 ms sub-steps, a stubbed-rAF run ending with no frame pending, `rowScale` at card width 40: 3 letters 1, 23 letters at 360 px 0.675 and at 150 px 0.4, and a render test of copies: `data-celebration`, `aria-hidden`, shadow, 50 % overlap, a `QU` copy with its badge, no `data-card-id`/`data-testid`/`data-mirror-of`, live `[data-card-id]` count unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-19, AD-14, AD-10
- design — DESIGN.md Win celebration, A-D12; EXPERIENCE.md Win celebration, Motion
- code — src/ui/motion.ts, src/shell/prefs.svelte.ts (BASE_MS), src/ui/layout/

## Notes

- Open question: wave, stagger and physics constants are initial, tuned at entry 6's checkpoint, which also judges DOM-copy cost on a mid-range Android.
