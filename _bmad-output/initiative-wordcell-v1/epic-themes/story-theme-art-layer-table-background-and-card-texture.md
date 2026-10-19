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

Extends the theme format with a table background and a card-face texture, applied through tokens without changing layout or card size, letter contrast measured over the texture, and a fail-fast check on the art tokens.

- plan_checkpoint = true
- interface = "theme data fields for background and texture; Card.svelte and app.css consume tokens only."
- tests = "Worst-point contrast (U); no layout shift with art on (P6 android); screenshots per art theme come with entries 6 and 7."
- owns = "The art hooks in the theme format."
- consumers = "Card.svelte, Scene.svelte, Board background."
- Hooks: optional custom properties `--wc-table-art` and `--wc-card-texture`, declared `none` in the combined `:root, [data-theme="default"]` rule at the top of app.css so absent means none. Each token is `none` or exactly one `url("data:image/svg+xml,…")` whose decoded SVG uses only rect, circle, path and line, one hex `fill` and one `fill-opacity` shared by all shapes (absent means 1), no stroke, opacity or overlap. Art colours follow TH-2; the colour-literals scan (src/ui/theme/colour-literals.ts) treats the test sheet as a token file and accepts a hex art fill; the complete-theme test accepts the tokens.
- Delivery: hand-authored inline SVG data URI: no fetch, raster or dependency (TH-8), no runtime check (rule 6). Fail fast (AD-15): a Vitest check over `themeRecords` of app.css plus the test sheet throws outside the allowlist.
- Texture form: a flat tiled pattern at `fill-opacity` <= 6 % and no gradient functions (DESIGN.md Avoid list), unit-tested; table art has no cap. It is a `background-image` over the state `background-color`, fixed px tile. The `.block`/`.destination` face shorthand becomes `background-color`; `.ghost` (no face fill, DESIGN.md) carries none; `.used` keeps its R-33 hatch and drops the texture.
- Surfaces: the texture is a background layer in Card.svelte's face on every Card instance (live, mirror, tray). Table art is `background-image` on `html` and on Board.svelte's opaque `--wc-table` background, same fixed px tile, `background-attachment: scroll`. Scene.svelte draws no table layer; its Card instances carry the texture. No new DOM, border or padding.
- Scope: no shipped theme gains art here. A test-only art theme sets only both tokens in a `[data-theme]` block of a separate stylesheet, never app.css, under the unshipped `ThemeId` `garden` (AD-7), registered like `testPaper`, its sheet loaded by dynamic `import()` inside main.ts's test-hook condition. A build check scans dist for its selector and art data URI. Card backs are out of scope (TH-9); AD-16's pre-paint script is unchanged.
- Budget gate: scripts/size-budget.mjs (run by `npm run build`); the plan records total and margin.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green and the build stays under the 600,000-byte budget (TH-8).

- Contrast, Vitest (extends src/ui/theme/contrast.test.ts), TH-5: composite the texture token over each face fill and hold each ink pair to its own TABLE floor (not below its pinned figure) at the worst point, a pixel fully covered by a shape, on every state carrying the texture; a too-opaque texture fails.
- Table side, same test: composite the table art's colour at its alpha over `--wc-table`; assert card edge >= 3.6:1 and outline >= 3.8:1 on it (DESIGN.md Colors).
- Pixel check, Playwright android on the test-only art theme: with the glyph `visibility:hidden`, the worst-contrast pixel over the whole letter-box clip of a live card, the QU card and a tray tile meets the card-ink pair's TABLE floor.
- Tokens, Vitest: the grammar, the texture-form rules and the fail-fast check (a bad art token throws).
- Layout, Playwright android (P6): bounding rects of columns, WordCells, cards, tray and the sticky bars, and document scrollHeight and scrollWidth, are exactly equal before and after switching theme in one page.
- Default: the default theme resolves both tokens to `none` and its baselines are unchanged (TH-4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Brand & Style, Colors floors, Avoid list (gradients on cards)
- constraint — AGENTS.md Conventions (never override dontCacheBustURLsMatching), brief §6.8 size budget

## Notes

- No open questions.
