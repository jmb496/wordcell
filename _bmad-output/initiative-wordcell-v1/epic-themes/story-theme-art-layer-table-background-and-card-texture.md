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

Extends the theme format so a theme can supply a table background and a card-face texture, applied through tokens, never changing layout or card size, with the letter contrast measured over the texture's worst point and a fail-fast check on the art tokens.

- plan_checkpoint = true
- interface = "theme data fields for background and texture; Card.svelte and app.css consume tokens only."
- tests = "Worst-point contrast (U); no layout shift with art on (P6 android); screenshots per art theme come with entries 6 and 7."
- owns = "The art hooks in the theme format."
- consumers = "Card.svelte, Scene.svelte, Board background."
- Hooks: optional custom properties `--wc-table-art` and `--wc-card-texture` in a theme's `[data-theme]` block in src/ui/app.css; absent or `none` means no art. `ThemeEntry` gains no art fields. Charcoal and Daylight Paper define none. Art colours are literals only inside app.css theme blocks or built from `--wc-*` tokens (TH-2); the colour-literals scan (src/ui/theme/colour-literals.ts) is extended for the art syntax, and the complete-theme test accepts the tokens.
- Delivery: art is hand-authored inline SVG or CSS (data URI) inside the stylesheet, so it ships and precaches with the content-hashed CSS: no lazy fetch, no raster, no new dependency (TH-8); AD-8 and `dontCacheBustURLsMatching` untouched. There is no runtime load-failure path. Fail fast instead (rule 6, AD-15): a theme declaring an art token must resolve it to a data-URI or pattern the check accepts, else the unit test or registration throws.
- Texture form: a flat tiled pattern at opacity <= 6 %, no gradient functions (DESIGN.md Avoid list), asserted in the unit test.
- Surfaces: the texture is a background layer inside Card.svelte's face on every Card instance (live, mirrors, tray; mirrors never animate it, AGENTS.md pitfalls). Table art sits on the page/board background; sticky bars keep their opaque surface. Scene.svelte follows the same tokens and keeps its dark scrim. No new DOM, border or padding.
- Scope: no shipped theme gains art here. A test-only art theme (like `testPaper`, registered only in test-hook builds, absent from dist) sets both tokens and drives the checks below. Card backs are out of scope (TH-9); the AD-16 pre-paint script is unchanged.
- Budget gate: scripts/size-budget.mjs (run by `npm run build`); the plan records its printed byte total and margin. The test-only art is not in dist.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, including the criteria below, and the build stays under the 600,000-byte budget with the margin recorded (TH-8).

- Contrast, Vitest (extends src/ui/theme/contrast.test.ts), TH-5: composite the texture colour at its maximum opacity over card-face and assert card-ink against it >= DESIGN.md's 13.1:1 floor, likewise for every changing state fill/ink role; a negative case proves a too-opaque texture fails.
- Table side, same test: card edge >= 3.6:1 and outline >= 3.8:1 over the worst table-art point (DESIGN.md Colors floors).
- Pixel check, Playwright android on the test-only art theme: the minimum sampled contrast over the glyph box of a rendered face meets the card-ink floor (epic Notes, entry 5).
- Tokens, Vitest: the texture-form rules and the fail-fast check (a bad art token throws).
- Layout, Playwright android (P6): bounding rects of columns, WordCells, cards, tray and document scrollHeight are equal with the art theme and with default.
- Default: the default theme resolves both tokens to `none` and its baselines are unchanged (TH-4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Brand & Style, Colors floors, Avoid list (gradients on cards)
- constraint — AGENTS.md Conventions (never override dontCacheBustURLsMatching), brief §6.8 size budget

## Notes

- No open questions.
