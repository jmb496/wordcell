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

Extends the theme format with a table background and a card-face texture, applied through tokens without changing layout or card size, with letter contrast measured over the texture and a fail-fast token check.

- plan_checkpoint = true
- interface = "theme data fields for background and texture; Card.svelte and app.css consume tokens only."
- tests = "Worst-point contrast (U); no layout shift with art on (P6 android); screenshots per art theme come with entries 6 and 7."
- owns = "The art hooks in the theme format."
- consumers = "Card.svelte, Scene.svelte, Board background."
- Hooks: optional custom properties `--wc-table-art` and `--wc-card-texture`, declared `none` in the `:root, [data-theme="default"]` rule at the top of app.css. Each token is `none` or one `url("data:image/svg+xml,…")` whose SVG, decodeURIComponent-decoded, has integer px `width`, `height` and a `viewBox`, has root `<svg>` with `xmlns="http://www.w3.org/2000/svg"`, `#` written `%23`, single-quoted attributes inside `url("…")`, only rect and circle, `fill` (`#rgb` or `#rrggbb`) and `fill-opacity` (absent means 1) as attributes of each shape, one value each, no stroke or opacity, pairwise-disjoint bounding boxes. Art colours follow TH-2; the colour-literals scan (colour-literals.ts) lists the test sheet as a token file and accepts a hex art fill; contrast and key-set checks merge the sheet's tokens over the default record, the colour-resolve loop skipping the art keys (grammar check covers them); art keys optional.
- Delivery: hand-authored inline SVG; no fetch, raster, dependency (TH-8) or runtime check; a Vitest check over app.css `themeRecords` plus the test sheet throws outside the grammar.
- Texture: flat tile, `fill-opacity` <= 6 %, no gradients (DESIGN.md Avoid list); table art uncapped. It is a `background-image` over the state `background-color`. `.block`/`.destination` face shorthand becomes `background-color`; `.ghost .face` sets `background-image: none` explicitly (computed value asserted under the test theme); `.used` keeps its R-33 hatch and drops the texture.
- Surfaces: the texture is a background layer in Card.svelte's face on every Card instance (live, mirror, tray). Table art is a `background-image` on `html` only, split from the shared `html, body` rule in app.css so `body` paints no second layer (fixed tile, `background-attachment: scroll`); sticky TopBar, Panel and `.banner` stay flat opaque; Board.svelte is not edited. Scene.svelte keeps its flat `--wc-table` fill, no table layer; its Cards carry the texture. No new DOM, border or padding.
- Scope: no shipped theme gains art. A test-only theme sets both tokens in a `[data-theme]` block of a separate stylesheet (not app.css) under unshipped `ThemeId` `garden` (AD-7), registered like `testPaper`, loaded by main.ts awaiting its dynamic `import()` before boot, inside the test-hook condition (test-hook.ts and e2e/globals.d.ts unchanged; label from text.ts); Greenhouse Dusk's entry replaces it later (as 9.6 does testPaper). A build check: dist/assets/*.css and *.js have neither the `[data-theme="garden"]` selector nor the art URI, dist-test both. Card backs out of scope (TH-9); AD-16's pre-paint script unchanged.
- Budget gate: scripts/size-budget.mjs (in `npm run build`); plan records total, margin.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens green; build under the 600,000-byte budget (TH-8).

- Contrast, Vitest (extends contrast.test.ts), TH-5: texture over each face fill; every TABLE row whose background is card-face or destination-fill meets its TABLE floor column at the worst point (a pixel fully inside a shape), every textured state.
- Table side, same test: table art colour at its alpha over `--wc-table` (one layer); card-edge and outline on it meet the TABLE floor column (3). DESIGN.md's 3.6, 3.8, 13.1 are the default theme's pinned figures.
- Pixel check, Playwright android, test theme: glyph `visibility:hidden`, the worst pixel over the letter-box clip of a live card, the QU card, a tray tile and a block or destination card meets the floor.
- Tokens, Vitest: grammar, texture-form rules, fail-fast (a bad token throws).
- Layout, Playwright android (P6): rects of columns, WordCells, cards, tray, sticky bars and document scrollHeight/scrollWidth equal before and after a theme switch.
- Default: both tokens resolve to `none`; baselines unchanged (TH-4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Brand & Style, Colors floors, Avoid list (gradients on cards)
- constraint — AGENTS.md Conventions (never override dontCacheBustURLsMatching), brief §6.8 size budget

## Notes

- No open questions.
