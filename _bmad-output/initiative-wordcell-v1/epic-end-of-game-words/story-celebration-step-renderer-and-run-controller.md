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

- `step.ts` `step(state, dtMs)`: pure, no DOM reads. State (plain data): floor, ceiling, walls, launch origins, per-group box width and height (`rowScale` × row width and card height; centred on origin), `capMs`, `baseMs`, `elapsedMs`. The origin is the `wordcell-<n>` label centre (`entry.cell`, F8) relative to the band; a missing element throws (rule 6). `start` measures once, with floor (action bar's top edge), ceiling, walls (band between the bars, DESIGN) and sizes via `src/ui/layout/`. A group drifts toward the side with more room, right on a tie. Floor contact (box bottom ≥ floor, vy into it) clamps to the floor, reverses vy and counts a bounce (informational, not in `finished`); ceiling contact (box top ≤ ceiling, vy up) clamps and reverses vy; `exited` = whole box beyond its wall, then hidden (opacity 0), no longer written. Also dt clamp 50 ms, entry-index launch, waves. The cap counts summed clamped dt; a group is hidden (opacity 0) until its launch, then shown; moving groups fade over the last `baseMs` of it. Launch offsets and wave sizes scale so every group has exited or faded by the cap. Wave, stagger and physics constants are cap fractions or in `motion.ts` (F6/F7). `finished` when every group has exited or `elapsedMs` ≥ cap; zero groups is finished.
- `Celebration.svelte`: takes groups (card-id-free `view.faces` by entry `cards`), band and card width as props, rendering every group hidden. Copies use the live theme's normal card at `{components.card.width}`, shadow `0 6px 16px #0008` (DESIGN). It registers its group elements on mount; the controller writes `transform`/opacity directly per frame (rule 3; earlier frames still step), no reactive state per frame. `rowScale(n, cardW, bandW)` = clamp(0.9·bandW / (cardW·(1+0.5(n−1))), 0.4, 1), never enlarging (A-D12); the band clips. Each copy has `data-celebration` and `aria-hidden`.
- `celebration.svelte.ts`: `start(view, done)` throws while a run is active (rule 6, checked first); an empty or absent `wordList` ends the run at once (`onEnd`, `done`), no rAF. `end()` clears the run, cancels any frame, calls `onEnd`, then `done`; idempotent, `done` synchronous here (entry 4 moves it to a microtask, AD-19). `cancel()` clears the run (`running()` false, a later `start` legal) and the pending frame, and calls neither `onEnd` nor `done` (the overlay's removal callback already popped the entry, AD-19). `onEnd(fn)` is one handler, replaced by a later call, kept across runs. `running()` (entry 5) reports an active run. Both drivers call `end()` when `finished`.
- Drive loop: real rAF, dt the timestamp difference (first frame 0, then [0, 50]). Manual clock: `setManual(on)` is read at `start`, throws while a run is active, and no rAF is scheduled while manual. `advance(ms)` runs floor(ms/16) steps of 16 ms, carries the remainder (cleared at `start`), renders once, breaking the step loop at the first `finished` step, then `end()`, clearing the remainder, and does nothing when idle, not manual or ms ≤ 0.
- `motion.ts` gets `celebrationCapMs()` = 6000 × `prefs.motion.baseMs` / `BASE_MS.normal`; `BASE_MS` is exported unchanged from `prefs.svelte.ts`.

Tests are named `AD-19 …` (U). Consumers: entries 4-8. `plan_checkpoint: true`; risk in front matter; unknown in Notes.

## Acceptance Criteria

Verify: UI Vitest `AD-19 …` tests pass for floor contact (bounce count, vy reverses, y not below floor), `exited`, determinism, dt clamp (500 = 50 ms), ceiling bounce, per-cell origins, the cap and fade (1 entry, a large list; Fast, Slow), `celebrationCapMs()` 3000, 6000, 10666.67 at Fast/Normal/Slow, an empty list (`onEnd`, `done` once each; `start` after and inside `done` legal), opposite drift left and right of centre, exact centre drifting right, a wide row exiting only when wholly past a wall, `onEnd` replaced and kept across runs, `start` throwing with no `wordcell-<cell>` element, no run active, `start` and `setManual` throwing mid-run, `advance` remainder carried, cleared at `start`, rAF first-frame dt 0, clamp [0, 50], frames before registration stepping without writes, `end()`/`cancel()` with no run or after each other doing nothing, `end()` calling `done` once, `cancel()` mid-run: `running()` false, no frame pending, neither callback called, later `start` working, a manual `advance` past the cap ending the run once, 16 ms sub-steps, ms < 16 one render and zero steps, nothing after `end()`, zero rAF while manual, a pre-launch group hidden then shown after its stagger offset, a group starting in contact one bounce, a stubbed-rAF run ending with no frame pending, `rowScale` at card width 40: 3 letters 1, 23 letters 0.675 at 360 px and 0.4 at 150 px, and a render test: `data-celebration`, `aria-hidden`, shadow, 50 % overlap, a `QU` copy with its badge, no `data-card-id`/`data-testid`/`data-mirror-of`, live `[data-card-id]` count unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-19, AD-14, AD-10
- design — DESIGN.md Win celebration, A-D12; EXPERIENCE.md Win celebration, Motion
- code — src/ui/motion.ts, src/shell/prefs.svelte.ts (BASE_MS), src/ui/layout/

## Notes

- Open question: the constants are initial, tuned at entry 6's checkpoint, which also judges DOM-copy cost on a mid-range Android.
