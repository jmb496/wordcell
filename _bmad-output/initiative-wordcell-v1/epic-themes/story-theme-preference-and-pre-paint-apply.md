---
id: 4
type: story
title: "Theme preference and pre-paint apply"
parent: epic-themes
covers: [TH-3, TH-7]
after: [2, 3]
risk: medium
---

# Theme preference and pre-paint apply

## Description

Adds the optional theme field to the prefs store (version stays 1, absent means default, unknown theme id handled as Q-36 prescribes), a Theme control in the Preferences panel wrapped in act(), applying the theme as a root attribute before first paint in boot order, mirroring it to the theme-color meta, and the AD-17 test-hook and fixture support.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with a Playwright android test that switches theme in Preferences, sees the root attribute and theme-color meta change, reloads without a flash of the default and keeps the choice, and a Vitest test that a stored v1 prefs without a theme loads with the default.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- architecture — ARCHITECTURE-SPINE.md AD-10, AD-16, AD-17
- rules — docs/game-flow-spec.md §7.10, Q-36
- code — src/shell/prefs.svelte.ts, src/ui/PreferencesPanel.svelte

## Notes

- Open question: How to make the first paint match a non-default theme without a blocking script that AD-16 forbids.
