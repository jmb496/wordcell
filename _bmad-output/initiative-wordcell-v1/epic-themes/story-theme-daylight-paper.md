---
id: 6
type: story
title: "Theme: Daylight Paper"
parent: epic-themes
covers: [TH-5, TH-6, TH-3]
after: [1, 4]
risk: low
---

# Theme: Daylight Paper

## Description

Builds the Daylight Paper theme (id `paper`, the only light theme, `color-scheme: light`, no art) as the first alternate and the proof of the theme mechanism: a token set selectable in Preferences, covering all surfaces, states and the How to play scenes, with its contrast test and a screenshot baseline set (board, tray, a sheet, a scene) generated in the Playwright container.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the new theme's baselines committed, the contrast test passes for it, and a Playwright android test switches to it and back with the default baselines unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — the entry 1 brief, direction Daylight Paper
- design — DESIGN.md Themes
