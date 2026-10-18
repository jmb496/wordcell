---
id: 3
type: story
title: "Token plumbing and contrast harness"
parent: epic-themes
covers: [TH-2, TH-4, TH-5]
risk: medium
---

# Token plumbing and contrast harness

## Description

Tracer bullet: moves every colour literal in src/** (e.g. src/ui/scenes/Scene.svelte) onto --wc-* tokens, gives the default theme an explicit [data-theme] token block with the same values, and adds a unit test that parses each theme's token values and asserts the WCAG ratios DESIGN.md Colors states plus a source scan that fails on a hex, rgb or hsl literal outside the token files. No visible change.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with every existing screenshot baseline unchanged, the contrast test passes for the default theme, and the scan fails when a hex literal is added to a component.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Colors
- code — src/ui/app.css, src/ui/scenes/Scene.svelte
- constraint — ARCHITECTURE-SPINE.md AD-14 (UI), AD-17 (tests)

## Notes

- Open question: How many colour literals exist beyond Scene.svelte, and whether scene-art colours should become tokens or stay fixed art.
