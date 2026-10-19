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
- Hooks: optional custom properties `--wc-table-art` and `--wc-card-texture`, declared `none` in the combined `:root, [data-theme="default"]` rule at the top of app.css. Each token is `none` or one `url("data:image/svg+xml,…")` whose SVG, percent-decoded by decodeURIComponent, has integer px `width`, `height` and a `viewBox` (fixing tile and `background-size`), uses only rect, circle and path, one `fill` matching `#rgb` or `#rrggbb` and one `fill-opacity` shared by all shapes (absent means 1), no stroke, opacity or overlap. Art colours follow TH-2; the colour-literals scan (src/ui/theme/colour-literals.ts) lists the test sheet as a token file and accepts a hex art fill; contrast and key-set checks run the sheet's two tokens merged over the default record; the art tokens are optional keys.
- Delivery: hand-authored inline SVG: no fetch, raster, dependency (TH-8) or runtime check (rule 6); a Vitest check over `themeRecords` of app.css plus the test sheet throws outside the grammar (AD-15).
- Texture form: a flat tiled pattern, `fill-opacity` <= 6 %, no gradients (DESIGN.md Avoid list), unit-tested; table art uncapped. It is a `background-image` over the state `background-color`. The `.block`/`.destination` face shorthand becomes `background-color`; `.ghost` carries none; `.used` keeps its R-33 hatch and drops the texture.
- Surfaces: the texture is a background layer in Card.svelte's face on every Card instance (live, mirror, tray). Table art is a `background-image` on the shared `html, body` rule in app.css (same fixed tile, `background-attachment: scroll`); sticky TopBar, Panel and `.banner` stay flat opaque; Board.svelte is not edited. src/ui/scenes/Scene.svelte keeps its flat `--wc-table` fill and no table layer; its Cards carry the texture. No new DOM, border or padding.
- Scope: no shipped theme gains art. A test-only theme sets only both tokens in a `[data-theme]` block of a separate stylesheet, never app.css, under the unshipped `ThemeId` `garden` (AD-7), registered like `testPaper`, loaded by dynamic `import()` inside main.ts's test-hook condition; Greenhouse Dusk's real entry replaces it when that ticket lands (as 9.6 does testPaper). A build check: dist has neither the `[data-theme="garden"]` selector nor the art URI, dist-test both; Playwright awaits the sheet via the test hook before switching. Card backs are out of scope (TH-9); AD-16's pre-paint script is unchanged.
- Budget gate: scripts/size-budget.mjs (in `npm run build`); plan records total and margin.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green; build under the 600,000-byte budget (TH-8).

- Contrast, Vitest (extends src/ui/theme/contrast.test.ts), TH-5: texture over each face fill; card-ink on card-face and on destination-fill (`.block`/`.destination`; add a TABLE row) each meet the TABLE floor column (4.5) at the worst point (a pixel fully inside a shape) in every textured state.
- Table side, same test: table art colour at its alpha over `--wc-table`; card edge >= 3.6:1 and outline >= 3.8:1 on it (DESIGN.md Colors).
- Pixel check, Playwright android, test-only theme: glyph `visibility:hidden`, the worst pixel over the letter-box clip of a live card, the QU card, a tray tile and a block or destination card meets the same TABLE floor.
- Tokens, Vitest: the grammar, texture-form rules and fail-fast check (a bad token throws).
- Layout, Playwright android (P6): rects of columns, WordCells, cards, tray, sticky bars, and document scrollHeight and scrollWidth are equal before and after a theme switch.
- Default: the default theme resolves both tokens to `none`; baselines unchanged (TH-4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Brand & Style, Colors floors, Avoid list (gradients on cards)
- constraint — AGENTS.md Conventions (never override dontCacheBustURLsMatching), brief §6.8 size budget

## Notes

- No open questions.
