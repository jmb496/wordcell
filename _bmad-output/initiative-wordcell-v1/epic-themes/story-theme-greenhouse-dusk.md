---
id: 8
type: story
title: "Theme: Greenhouse Dusk"
parent: epic-themes
covers: [TH-5, TH-6, TH-9, TH-8]
after: [5, 7]
risk: medium
---

# Theme: Greenhouse Dusk

## Description

Builds the Greenhouse Dusk theme (id `garden`) from the 9.1 brief and DESIGN.md Themes: its token set in src/ui/app.css, using the art layer for the leaf-vein table and paper-fibre card face, selectable in Preferences, covering all surfaces, states and the How to play scenes, with its contrast test (worst-point and pixel-sampled over the texture) and a screenshot baseline set (board, tray, a sheet, a scene) generated in the Playwright container.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the theme's baselines committed, the contrast test passes for it, the size budget holds, a Playwright android test switches to it and back with the default baselines unchanged, and the owner has played it on his Android install.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — the entry 1 brief, direction Greenhouse Dusk
- design — DESIGN.md Themes
