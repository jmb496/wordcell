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

Extends the theme format with a table background and card-face texture via tokens, with no layout or card-size change, letter contrast measured over the texture and a fail-fast token check.

- plan_checkpoint = true
- interface = "theme data fields for background and texture; Card.svelte and app.css consume tokens only."
- tests = "Worst-point contrast (U); no layout shift with art on (P6 android); screenshots per art theme come with entries 6 and 7."
- owns = "The art hooks in the theme format."
- consumers = "Card.svelte, Scene.svelte, Board background."
- Hooks: optional custom properties `--wc-table-art` and `--wc-card-texture`, declared `none` in the `:root, [data-theme="default"]` rule at the top of app.css. Each token is `none` or one `url("data:image/svg+xml,…")` whose SVG, decoded, has integer px `width`, `height`, `viewBox`, root `xmlns="http://www.w3.org/2000/svg"`, `#` as `%23`, single-quoted attributes, only rect, circle and path, with `fill` and/or `stroke` (`#rgb` or `#rrggbb`), `fill-opacity`/`stroke-opacity` decimals in [0,1] (absent means 1) and optional `stroke-width`, as attributes of each shape. Worst point: per distinct colour, the sum of its shapes' opacities capped at 1 (bounds overlap), composited over each surface. Art colours follow TH-2; colour-literals.ts lists the test sheet as a token file and accepts hex art colours; contrast and key-set checks merge the sheet's tokens over the default record, skipping the art keys.
- Delivery: hand-authored inline SVG; no fetch, raster, dependency (TH-8) or runtime check; Vitest throws outside the grammar over app.css `themeRecords` plus the test sheet.
- Texture: flat tile, opacity <= 6 %, no gradients (DESIGN.md Avoid list); table art uncapped. Base `.face` becomes `background-color: var(--wc-card-face); background-image: var(--wc-card-texture)`, intrinsic px tile, default repeat, no `background-size`. `.block`/`.destination` face shorthand becomes `background-color`; `.ghost .face` sets `background-image: none`; `.used` keeps its R-33 hatch, no texture.
- Surfaces: the texture is a background layer in Card.svelte's face on every Card instance (live, mirror, tray). Table art: `html` carries `background-color: var(--wc-table)` and `background-image: var(--wc-table-art)` (fixed-size tile, `background-attachment: scroll`), split from the shared `html, body` rule in app.css so `body` has no background; "Board background" in consumers means this `html` rule; sticky TopBar, Panel and `.banner` stay flat opaque; Board.svelte is not edited; Scene.svelte keeps its flat `--wc-table` fill, its Cards carry the texture. No new DOM, border or padding.
- Scope: no shipped theme gains art. A test-only theme sets both tokens in a `[data-theme]` block of a separate stylesheet (src/ui/theme/garden.css, imported after app.css so source order wins) under unshipped `ThemeId` `garden` (AD-7), registered like `testPaper`, loaded by main.ts awaiting its dynamic `import()` before boot inside the test-hook condition (test-hook.ts, e2e/globals.d.ts unchanged; label from text.ts); Greenhouse Dusk replaces it later. Card backs out of scope (TH-9); AD-16's pre-paint script unchanged.
- Budget gate: scripts/size-budget.mjs (in `npm run build`); plan records total, margin.

## Acceptance Criteria

Verify: npm run test:all and test:screens green; build under the 600,000-byte budget (TH-8).

- Contrast, Vitest (extends contrast.test.ts), TH-5: texture over each face fill; every TABLE row whose background is card-face or destination-fill meets its TABLE floor column at the worst point, every textured state; add a TABLE row for card-ink on destination-fill (`.block`/`.destination` faces draw card-ink; only ink-primary exists).
- Table side, same test: table art over `--wc-table` (one layer); card-edge, outline and any TABLE ink row drawn directly on `--wc-table` (none today) meet the TABLE floor column. DESIGN.md's 3.6, 3.8, 13.1 are the default's pinned figures.
- Pixel check, Playwright android, test theme: glyph `visibility:hidden`, the worst pixel over a live card's letter-box clip, the QU card, a tray tile and a block or destination card meets the floor (4.5 for ink).
- Tokens, Vitest: grammar, texture-form rules, fail-fast (a bad token throws).
- Layout, Playwright android (P6): rects of columns, WordCells, cards, tray, sticky bars and document scrollHeight/scrollWidth equal before and after a theme switch.
- Computed style, Playwright android, test theme: `.ghost .face` background-image none; `.used` keeps its hatch, no texture; `html` has the image, `body` none. Build output: dist/assets/*.css and *.js lack, dist-test has, the `[data-theme="garden"]` selector and art URI.
- Default: both tokens resolve to `none`; baselines unchanged (TH-4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Brand & Style, Colors floors, Avoid list (gradients on cards)
- constraint — AGENTS.md Conventions (never override dontCacheBustURLsMatching), brief §6.8 size budget

## Notes

- No open questions.

- Owner decision 2026-10-18 (contrast floors): option A. The contrast check table's figures (card edge 3, outline 3, card text 4.5) are the minimum for every theme; DESIGN.md's higher figures (3.6, 3.8, 13.1) describe the default theme only. Technical defaults recorded with it: the art format requires an explicit fill on every shape (`fill="none"` allowed) so stroke-only shapes are measured correctly; table art is painted on the page background only. Close-out doc: DESIGN.md contrast section ← say its figures describe the default theme only (owner, 2026-10-18).
- Post-close (Opus review, owner decisions D1–D6, 2026-10-22, `5210279`, `a88cf67`, `45f6a13`; see the epic Notes): D4 a drop-target card keeps its texture under the wash; D6 Greenhouse Dusk's table-art opacity 0.08 → 0.045 so washed drop-target outlines reach 3:1; worst-point contrast uses `worstRatio` over every stacking order.
