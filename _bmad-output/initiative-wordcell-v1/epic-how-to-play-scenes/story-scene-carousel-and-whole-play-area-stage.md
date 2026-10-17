---
id: 6
type: story
title: "Scene carousel and whole play-area stage"
parent: epic-how-to-play-scenes
covers: [HP-1, HP-2, HP-6]
after: [5]
risk: medium
---

# Scene carousel and whole play-area stage

## Description

Replaces the stacked scene list in the How to play panel with a carousel, amending HP-1 and superseding HP-7's panel layout for the scenes only; the owner decision of 2026-10-17 overrides only HP-1's "no other visible buttons" (arrows, dots). Owns the carousel and the shared play-area stage; interface: `src/ui/scenes/` (carousel, stage), `HowToPlayPanel.svelte`, the `text.ts` howTo control names.

- One scene at a time. Non-current scenes are not mounted: exactly one scene figure (stage, caption, text description) is in the DOM, the playing one, keeping HP-6's `<figure>` with text description and `aria-hidden` animation. The text sections below the carousel are unchanged. No swipe or drag on the carousel (buttons and keys only).
- Controls: previous and next arrow buttons (native, in `act()`, 44 px targets) and dots as buttons that jump to a scene. A disabled end uses `aria-disabled="true"` plus a dimmed style; its click is a no-op (the UI does not act) and focus is not lost. No wrap-around. Left and Right keys act while focus is inside the carousel (arrows, dots), go through `act()`, stop at the ends and stop propagation. Game keys are already suspended while the panel is open (`SUSPENDING` includes `howToPlay`, `attempt()` in `src/ui/keys.ts`), so `focusMove`/`tileMove` never also act.
- Names, all in `text.ts` howTo: "Previous scene", "Next scene"; dots "Scene n of N" (N = scene count) with `aria-current="true"` on the current one. The position is the dots plus that name. Dots have a 44 px hit area by padding around a small dot, and the row fits 360 px for the interim count (wrap or tighten).
- A newly shown scene (arrow, dot, key or panel open) starts at step 1, playing; under reduced motion it shows the resting frame with Next available per HP-2. The panel always opens on scene 1. Leaving a scene stops and releases its animations. A tap on the current dot is a no-op. HP-1's tap-to-pause/restart, small pause/play icon and loop-with-rest carry over on the stage unchanged.
- Reduced motion: the Next-frame control is separate from the scene arrows, starts at frame 1, wraps to frame 1 after the last frame, and a scene change resets it.
- A closed panel animates nothing: `document.getAnimations()` is empty and no scene is mounted while it is closed; the playing scene's animations also stop when the tab is hidden (`document.hidden`), per HP-1 "closed or hidden".
- Stage: one shared stage draws the whole play area like the game: eight columns, the tray with the word strip, and WordCells 3 to 10. Cards are `Card` with `mirror="static"` (`data-mirror-of` only: no `data-card-id`, no `data-testid`, no second set of `column-`/`wordcell-`/`primary-action` test ids); the stage is `aria-hidden`, takes no part in FLIP and reads no GameView (AD-3, AD-14, AGENTS.md pitfalls).
- Stage contract: each scene supplies a position (columns, tray/word strip, WordCell tops) over a shared filler default, so "more cards" is concrete: at least 5 cards visible in every column. The default board is a fuller hand-built position, not the §8 rulebook position; the HP-5 engine replay test is unchanged. Existing scenes keep their scripted cards, ids and fixtures, and the existing scene script/engine-replay tests stay green. The interim carousel holds all existing scenes in their current order (basic then tricky), so the Tricky heading goes; entries 8.7 to 8.11 later prune it to five. The e2e dot count is that interim total.
- Fit: the stage measures its own panel width through the shared pure code in `src/ui/layout/` (`fitSize` in `fit.ts`, `measureWidth` in `measure.ts`), not the live game layout store, and refits on resize and rotation. One fixed stage height for all scenes keeps controls and caption from jumping. Minimum rendered card width is 32 px at the 360 px android viewport (existing scene `CARD_W` is 40), asserted in the stage-structure test. On desktop the stage stays within the panel max width.

## Acceptance Criteria

Verify: `npm run test:all` and `npm run test:screens` are green, with test names starting with an AD-n or HP id (AGENTS.md).

- P6 android Playwright: only one scene figure is mounted and playing; arrows, dots and Left/Right keys move between scenes; ends are aria-disabled with focus kept; control names and `aria-current` are asserted; reopening the panel resets to scene 1; reduced-motion Next-frame control; closed panel has no animations and no mounted scene.
- Unit (U): stage structure (8 columns, WordCells 3 to 10, a word strip, no test ids, minimum card width, at least 5 cards per column); 44 px targets; `act()` wrapping.
- Screens: android, reduced motion, first scene resting frame; this ticket regenerates the baseline in the Docker image (existing how-to-play baseline superseded where it changes).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — EXPERIENCE.md How to play panel, DESIGN.md tray and cards
- rules — docs/game-flow-spec.md §8
- architecture — ARCHITECTURE-SPINE.md AD-3, AD-11, AD-14
- decision — the epic's owner decision of 2026-10-17

## Notes

- Fit question resolved: see the Fit item in the Description.
