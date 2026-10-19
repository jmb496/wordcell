---
id: 5
type: story
title: "Theme art layer: table background and card texture"
parent: epic-themes
covers: [TH-9, TH-5, TH-8]
after: [3]
risk: high
---

# Theme art layer: table background and card texture

## Description

Extends the theme data so a theme can supply a table background and a card-face texture (CSS or small SVG, lazily or inline per the size finding), applied through tokens, never changing layout or card size, behind Card and the page background, with the letter contrast measured over the texture's worst point and with a fallback-free fail-fast path if a theme's art fails to load.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, a unit test fails when a texture token drops the card-ink contrast below DESIGN.md's ratio at its worst point, the default theme's baselines are unchanged, and the build stays under the 600,000-byte budget with the margin recorded.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Brand & Style, Avoid list (gradients on cards)
- constraint — AGENTS.md Conventions (never override dontCacheBustURLsMatching), brief §6.8 size budget

## Notes

- Open question: How the worst-point contrast of a texture is computed in a unit test; whether art is precached or fetched lazily under the AD-8 download-once rule.
