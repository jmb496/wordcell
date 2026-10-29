---
id: 4
type: story
title: "How to play Place scene preview"
parent: epic-place-preview
covers: [E7]
after: [3]
risk: low
---

# How to play Place scene preview

## Description

Updates the Place scene (`src/ui/scenes/place.ts`, `Scene.svelte`; `fixtures/how-to-play-place.json` is unchanged) so its Place frames draw the preview as the game does, reusing entry 2's `★` pill (the target shows the last `placeOrder` letter with the `★`; cell 6, which holds only `L`, used but not the target in frame 2, shows its empty outline) while the tray frame keeps cell 6 used, superseding epic 8 D5 for the Place frames only.

## Acceptance Criteria

Verify: `src/ui/scenes/scenes.test.ts` and the how-to-play Vitest pass with the new frames (named AD-14 Q-49), the How to play Playwright spec plays the Place scene, and `npm run test:screens` adds one `android` baseline of scene 3 frame 4 (AD-17) with no other baseline changed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- code — src/ui/scenes/place.ts, src/ui/scenes/Scene.svelte, src/ui/scenes/types.ts, src/ui/scenes/scenes.test.ts, fixtures/how-to-play-place.json, e2e/how-to-play.screens.spec.ts
- decision — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md, Notes D5
