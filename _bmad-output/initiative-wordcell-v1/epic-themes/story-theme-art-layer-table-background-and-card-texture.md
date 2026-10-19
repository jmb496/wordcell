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
- Hooks: optional custom properties `--wc-table-art` and `--wc-card-texture`, declared `none` in `:root` (or the default block) so absent means none. Charcoal and Daylight Paper define none; `ThemeEntry` gains no art fields. Each token is `none` or exactly one `url("data:image/svg+xml,…")` whose shapes use a single `fill` and `fill-opacity`. Art colours follow TH-2; the colour-literals scan (src/ui/theme/colour-literals.ts) is extended and the complete-theme test accepts the tokens.
- Delivery: art is hand-authored inline SVG in a stylesheet data URI: no lazy fetch, raster or dependency (TH-8). No runtime check or load-failure path (rule 6). Fail fast (AD-15): a Vitest check over the parsed app.css theme blocks plus the test sheet (reusing `themeRecords`) throws outside the grammar; rejected: gradients, `<image`, `href`, `<script`, external or non-data urls, `var()`, `initial`/`unset`, empty.
- Texture form: a flat tiled pattern at `fill-opacity` <= 6 % and no gradient functions (DESIGN.md Avoid list), unit-tested; table art keeps the grammar and gradient ban, no cap. The texture is a `background-image` over the state `background-color` (never the `background` shorthand), fixed px tile size, independent of card size.
- Surfaces: the texture is a background layer inside Card.svelte's face on every Card instance (live, mirror, tray). Table art sits on the `body` background (scrolls with the page, static); sticky bars stay opaque. Scene.svelte's table backdrop and its Card instances consume the same tokens; it keeps its dark scrim. No new DOM, border or padding.
- Scope: no shipped theme gains art here. A test-only art theme sets both tokens in a `[data-theme]` block of a separate test-only stylesheet imported only from the test-hook branch of src/main.ts, never app.css, under a new test-only id (added to `ThemeId` in src/shell/prefs.svelte.ts). A build check shows it absent from dist. Card backs are out of scope (TH-9); AD-16's pre-paint script is unchanged.
- Budget gate: scripts/size-budget.mjs (run by `npm run build`); the plan records its total and margin.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green and the build stays under the 600,000-byte budget (TH-8).

- Contrast, Vitest (extends src/ui/theme/contrast.test.ts), TH-5: read colour and alpha from the texture token, composite it over card-face and destination-fill, and assert card-ink on each >= the theme's card-ink floor (13.1:1 for Charcoal; DESIGN.md Colors); a negative case proves a too-opaque texture fails.
- Table side, same test: composite the table art's colour at its alpha over `--wc-table`; assert card edge >= 3.6:1 and outline >= 3.8:1 on it (DESIGN.md Colors).
- Pixel check, Playwright android on the test-only art theme: with the letter hidden, sample background pixels inside the letter box of a live card, the QU card and a tray tile, each against the real card-ink colour meets the card-ink floor.
- Tokens, Vitest: the grammar, the texture-form rules and the fail-fast check (a bad art token throws).
- Layout, Playwright android (P6): bounding rects of columns, WordCells, cards, tray and the sticky bars, and document scrollHeight and scrollWidth, are exactly equal with art and default.
- Default: the default theme resolves both tokens to `none` and its baselines are unchanged (TH-4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Brand & Style, Colors floors, Avoid list (gradients on cards)
- constraint — AGENTS.md Conventions (never override dontCacheBustURLsMatching), brief §6.8 size budget

## Notes

- No open questions.
