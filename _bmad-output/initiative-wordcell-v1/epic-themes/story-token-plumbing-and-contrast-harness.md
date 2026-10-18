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

Tracer bullet: moves every colour literal in src/** onto --wc-* tokens, gives the default theme one token block `:root, [data-theme="default"]` in app.css (defined once, not duplicated; no attribute is set in this ticket, TH-3 does that), and adds a contrast unit test and a literal scan. No visible change. Delivers the ratio half of TH-5 for the default theme only; "no state relies on hue alone" is left to the per-theme tickets.

- Inventory (settles the epic's unknowns): exactly 7 literals in 5 non-test files beyond the app.css token block: `box-shadow: 0 6px 16px #0008` at Card.svelte, Column.svelte, WordCellRow.svelte and tray/TileRows.svelte; in Scene.svelte `fill="#fff"`, `stroke="#1a1a1a"` and `filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.45))`. `transparent` and color-mix over tokens are not literals.
- Decision: all 7 become tokens whose values are the exact current literal text, so the default theme is pixel identical: `--wc-shadow-drag` #0008 (shared by the 4 files), `--wc-scene-pointer-fill` #fff, `--wc-scene-pointer-stroke` #1a1a1a, `--wc-scene-pointer-shadow` rgb(0 0 0 / 0.45). Never reuse a near-match token or round an alpha to another hex. SVG presentation attributes cannot use var(), so the Scene fill and stroke move to CSS (class or style) reading the token. `npm run test:screens` is the arbiter: any diff means revert; never regenerate baselines.
- Scan: a pure exported function over (path, text) returning violations. Scope: non-test .svelte, .css and .ts under src/**, comments stripped first; only the token block of app.css (or a themes/ token file) is exempt. It flags 3, 4, 6 and 8 digit hex, rgb(a), hsl(a), hwb, lab, lch, oklab, oklch, color(), and CSS named colours in colour properties, fill and stroke; it allows transparent, currentColor, inherit, and color-mix/var() over tokens; `#` in url() fragments and ids is not a colour.
- Contrast test: reads the default token block as CSS text. Theme data format = a record of --wc-* name to value per theme, parsed from CSS; the test iterates a map of theme id to record. It parses #rgb, #rrggbb, #rrggbbaa and var() (with a cycle check), and fails on an unparseable value or a missing token. Alpha tokens (scrim, shadows) are excluded from ratios. Asserted minimums from DESIGN.md Colors, compared at the stated one-decimal figure: text 4.5 (ink on card face 13.1, ink secondary on surface 6.4 and on surface raised 5.6, ink on destination fill 9.9, error on surface 6.7, teal on surface 7.0 and on card 6.6, ink `#15171B` on orange 6.4); non-text 3 (outline on table 3.8 and surface 3.4, card edge on table 3.6 and surface 3.2). Disabled ink is exempt. A negative case feeds an inline low-contrast record that must fail, so later themes inherit a proven harness.
- Out of scope: index.html theme-color and the vite.config.ts manifest `#15171B` (outside src/**) stay unchanged (TH-3), with one optional assertion pinning them to --wc-table; `color-scheme: dark` in app.css stays.

Interface: src/ui/app.css (or a themes/ token file), contrast test and literal scan as src/*.test.ts files; component CSS reads tokens only.
Tests: Contrast ratios for the default token set (U); literal scan (U, outside the layer scans of AD-1); screenshots unchanged (screens). The scan's own test runs the pure function on inline strings (positive per form incl. an SVG attribute and #0008, negatives, a token file exempt) plus a run over the real tree asserting zero violations. Placement: own root-level files, e.g. src/theme-contrast.test.ts and src/colour-literals.test.ts, not `architecture-*.test.ts` and not added to SELF in src/architecture-scan.ts; the tree scan walks every other src file, so these files must contain none of the AD-1 flagged tokens (history, popstate, console, localStorage and the rest). Test names start with AD-14 or AD-17, never R-ids.
Owns: The token files and the theme data format.
Consumers: Every component using colour; epic 8 scene screenshots.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with every existing screenshot baseline unchanged, the contrast test passes for the default theme, and the scan fails when a hex literal is added to a component.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Colors
- code — src/ui/app.css, src/ui/scenes/Scene.svelte
- constraint — ARCHITECTURE-SPINE.md AD-1 (scan), AD-10 (tokens), AD-14 (UI), AD-17 (tests); AGENTS.md: never regenerate baselines, all existing .screens.spec.ts baselines, including the how-to-play ones, stay untouched

## Notes

- The epic's open question (literal count, scene colours as tokens or fixed art) is settled in the Description: 7 literals, all tokens.
