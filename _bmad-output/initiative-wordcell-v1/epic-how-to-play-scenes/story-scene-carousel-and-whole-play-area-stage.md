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
- Controls: previous and next arrow buttons (native, in `act()`, 44 px targets) and dots as buttons that jump to a scene. A disabled end uses `aria-disabled="true"` plus a dimmed style; its click is a no-op (the UI does not act) and focus is not lost. No wrap-around. The carousel root is the container of arrows, dots and the scene (including its Next-frame/Replay and pause controls). Left and Right act from any control in it via an element-level `onkeydown` on that root (no window listener), go through `act()`, stop at the ends and stop propagation. Game keys are already suspended while the panel is open (`SUSPENDING` is defined in `src/ui/overlays.svelte.ts` and includes `howToPlay`; `attempt()` in `src/ui/keys.ts` checks it), so `focusMove`/`tileMove` never also act.
- Names, all in `text.ts` howTo: "Previous scene", "Next scene"; dots "Scene n of N" (N = scene count) with `aria-current="true"` on the current one. The dots' names plus `aria-current` are the announced position; the caption is not a live region. Dots have a 44 px hit area by padding around a small dot; the row wraps to at most two rows (8 dots at 44 px exceed the 328 px inner width at 360 px).
- A newly shown scene (arrow, dot, key, panel open, preference change while open) starts at step 1, playing; under reduced motion it opens on frame 1 per the existing Scene behaviour. The panel always opens on scene 1. Leaving a scene stops and releases its animations. A tap on the current dot is a no-op. HP-1's tap-to-pause/restart, small pause/play icon and loop-with-rest carry over on the stage unchanged.
- Reduced motion keeps the existing `Scene.svelte` behaviour: a scene opens on frame 1, the Next-frame control steps and clamps at the final frame (the HP-2 resting state), and the existing Replay control resets to frame 1. These controls are separate from the scene arrows, and a scene change resets them. The text.ts names "Next" (`sceneControls.next`) and "Next scene" collide under substring role+name locators, so the e2e locators match the names exactly.
- The carousel mounts a scene only while the howToPlay overlay's open flag (`src/ui/overlays.svelte.ts`) is true, not on `Panel` presence (`Panel.svelte` keeps children mounted while it animates out), so animations are cancelled as soon as open goes false: `document.getAnimations()` is empty for the scene immediately and the panel assertion follows after its exit settles. A playing scene also stops when the tab is hidden (`document.hidden`, the existing hook in `Scene.svelte`; no new `visibilitychange` listener, AGENTS.md); on becoming visible a playing scene re-enters at step 1 and a user-paused scene stays paused.
- Stage: one shared stage draws the whole play area like the game: eight columns, the tray with the word strip, and WordCells 3 to 10. Cards are `Card` with `mirror="static"` (`data-mirror-of` only: no `data-card-id`, no `data-testid`, no second set of `column-`/`wordcell-`/`primary-action` test ids); the stage is `aria-hidden`, takes no part in FLIP and reads no GameView (AD-3, AD-14, AGENTS.md pitfalls).
- Stage contract: each scene supplies a position (columns, tray/word strip, WordCell tops) over a shared filler default, so "more cards" is concrete: at least 5 cards visible in every column. Filler cards use ids no scripted move touches and are in no fixture, so fixtures and the HP-5 engine replay stay unchanged. The default board is a fuller hand-built position, not the §8 rulebook position. Existing scenes keep their scripted cards, ids and fixtures, and the existing scene script/engine-replay tests stay green; their scripted geometry (`geometry.ts` fixed `CARD_W` 40, `COLUMN_PITCH`, `STAGE_W`) is rescaled from the single fitted card width. The interim carousel holds all existing scenes in their current order (basic then tricky), so the Tricky heading goes; entries 8.7 to 8.11 later prune it to five. The e2e dot count is that interim total.
- Fit: the stage reads its panel's content width (ResizeObserver/`clientWidth`, not the live game layout store) and feeds a new pure card-width function (inputs: panel width, column count; output: card width and the stage height derived from it, identical for every scene at a given width), so controls and caption never jump. It refits on resize and rotation. Minimum rendered card width is 32 px at the 360 px android viewport; on desktop the stage stays within the panel's 560 px max width (`.inner` in `Panel.svelte`).

## Acceptance Criteria

Verify: `npm run test:all` and `npm run test:screens` are green. Playwright tests start with the HP id they cover (HP-1, HP-2, HP-6), unit tests with an AD-n (AGENTS.md).

- Playwright android (P6): only one scene figure is mounted and playing; arrows, dots and Left/Right keys move between scenes; ends are aria-disabled, a click on one is a no-op and focus is kept; control names (exact) and `aria-current` are asserted; reopening the panel resets to scene 1; a newly shown scene starts at step 1; a tap on the current dot is a no-op; tap pause/restart works on the new stage; reduced-motion Next frame/Replay, and a scene change resets Next frame; closed panel has no animations and no mounted scene; rapid switching leaves only the current scene's animations (`document.getAnimations()`); hidden tab (via `document.hidden`) re-enters a playing scene at step 1 and keeps a paused one paused; toggling reduced motion or Animation speed while open re-enters the current scene; resize/rotation refits and two scenes have equal stage height. Bounding boxes: card width at least 32 px, arrows and dots at least 44 px, dot row within the panel (at most two rows, no horizontal overflow).
- Unit: stage structure only (8 columns, WordCells 3 to 10 and word strip in the game's layout order per DESIGN.md/AD-11, no test ids, at least 5 cards per column); `act()` wrapping; the pure card-width function.
- Screens: android, reduced motion, the first scene at its final (resting) frame, reached by the test stepping Next frame to the end; this ticket regenerates the baseline in the Docker image (existing how-to-play baseline superseded where it changes).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — EXPERIENCE.md How to play panel, DESIGN.md tray and cards
- rules — docs/game-flow-spec.md §8
- architecture — ARCHITECTURE-SPINE.md AD-3, AD-11, AD-14
- decision — the epic's owner decision of 2026-10-17

## Notes

- Fit question resolved: see the Fit item in the Description.
