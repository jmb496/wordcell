---
id: 3
type: story
title: "Token plumbing and contrast harness"
parent: epic-themes
covers: [TH-2, TH-4, TH-5 (ratio half)]
risk: medium
---

# Token plumbing and contrast harness

## Description

Tracer bullet: moves every colour literal in src/** onto --wc-* tokens, gives the default theme one complete token block in the rule `:root, [data-theme="default"]` in app.css (defined once, not duplicated; no attribute is set in this ticket, TH-3 does that), and adds a contrast unit test and a literal scan. No visible change. Delivers the ratio half of TH-5 for the default theme only; "no state relies on hue alone" is left to the per-theme tickets. The token declarations leave the current `:root` rule; `color-scheme`, `font-family` and `color` stay in a separate `:root` rule, and later theme blocks must follow the default block.

- Inventory (settles the epic's unknowns): exactly 7 literals in 5 non-test files beyond the app.css token block: `box-shadow: 0 6px 16px #0008` at Card.svelte (1, `.lifted .face`), Column.svelte (1), WordCellRow.svelte (1) and tray/TileRows.svelte (1), all `.face.wc-drag-layer` except Card; in Scene.svelte (3) `fill="#fff"`, `stroke="#1a1a1a"` and `filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.45))`. `transparent` and color-mix over tokens are not literals.
- Decision: all 7 become tokens whose values are the exact current literal text: `--wc-shadow-drag` #0008 (shared by the 4 files), `--wc-scene-pointer-fill` #fff, `--wc-scene-pointer-stroke` #1a1a1a, `--wc-scene-pointer-shadow` rgb(0 0 0 / 0.45). These 4 are internal, not DESIGN.md colour roles (docs are TH-7). Never reuse a near-match token or round an alpha. Scene: remove the `fill` and `stroke` attributes from the hand `<path>` (keep `stroke-width` and `stroke-linejoin`) and add the scoped rule `.ghost path { fill: var(--wc-scene-pointer-fill); stroke: var(--wc-scene-pointer-stroke); }`; the `.ghost` filter reads the shadow token.
- Proof: `npm run test:screens` is the arbiter where a baseline covers a site (keyboard-focused-selected covers `.lifted`); no baseline drags a card and the `.ghost` is hidden at rest and fades in only while a scene plays (effects.ts); check e2e/*.screens.spec.ts for a baseline capturing it. The scan test also asserts, per site, the default token value equals the old literal text and that the component CSS text reads `var(--wc-…)` of its token. Any screenshot diff means revert.
- Scan: a pure function over (path, text) returning violations, in a non-test module under src/ui/theme/. Scope: .svelte, .css and .ts under src/**, non-test (basename not `*.test.ts` or `*.svelte.test.ts`); the real-tree run exempts src/ui/theme/colour-literals.ts by path. Comments are stripped first per region: .svelte is split into script, `<style>` and markup with the CJS `svelte/compiler` `parse` loaded via `createRequire` as src/architecture-scan.ts does (never a Vitest import of the compiler, AD-17 budget); `//` and `/* */` are string-aware in script and .ts only, `/* */` only in CSS and `<style>`, `<!-- -->` in markup. Flagged in colour context only: hex of exactly 3, 4, 6 or 8 digits followed by a non-word char or end of input, in CSS declaration values (incl. box-shadow and filter arguments and custom properties), SVG presentation attributes (fill, stroke, stop-color, flood-color, color), `style=` / `style:` directives and string or template literals in .ts and .svelte script (a string is flagged only when the whole string, or a CSS-value-shaped segment after whitespace, comma or paren, is a hex or colour function, so `querySelector('#add')` passes); rgb(a), hsl(a), hwb, lab, lch, oklab, oklch, color(); a whole-word, case-insensitive CSS named colour in any CSS declaration value (any property except font-family and content; url() and quoted strings excluded), in an SVG presentation attribute, or inside color-mix args. Allowed, case-insensitive: transparent, currentColor, inherit, none, initial, unset, revert, `url(#id)` paint servers, color-mix and var() over tokens. Never flagged: selectors, property names, function names, href, id, `&#…;` entities, `url()` fragments, .ts strings for named colours. Exemption: only a `--wc-*` custom-property declaration in a top-level rule whose selector is exactly `:root` or `[data-theme="…"]` (alone or comma list), in src/ui/app.css (tokens stay there this ticket); any other selector shape or at-rule wrapper, and every other declaration, is scanned. The scan also asserts every `var(--wc-*)` in a colour-valued declaration or attribute is defined in the default block; non-colour runtime names are out of the check.
- Contrast test: extracts the `--wc-*` declarations of the rule whose selector list includes `[data-theme="default"]` as the default record. Theme data format = every top-level rule with a `[data-theme="<id>"]` selector becomes a record keyed by id; each is a complete record of --wc-* name to value per theme (no inheritance from default), parsed from CSS; the test iterates a map of theme id to record. No `var()` fallbacks in token values; `var()` to a missing token or a cycle fails, as does an unparseable value. The parser accepts #rgb, #rgba, #rrggbb, #rrggbbaa and rgb()/rgba() with slash alpha into {r,g,b,a}; any other rgb form (comma, percentages) is an unparseable-value failure. A token with alpha < 1 is validated but never ratioed. The ratio set is exactly the tokens in this table; the test fails if any is absent, if --wc-scrim, --wc-shadow-drag or --wc-scene-pointer-shadow is absent or has alpha >= 1, if --wc-scene-pointer-fill or --wc-scene-pointer-stroke is absent or invalid, or if a theme record's key set differs from the default's. Ratios are on the unrounded value, computed from app.css and rechecked:

  | Foreground | Background | Floor | DESIGN.md figure |
  | --- | --- | --- | --- |
  | card-ink | card-face | 4.5 | 13.1 |
  | ink-secondary | surface | 4.5 | 6.4 |
  | ink-secondary | surface-raised | 4.5 | 5.6 |
  | ink-primary | destination-fill | 4.5 | 9.9 |
  | error | surface | 4.5 | 6.7 |
  | ink-on-accent | accent-orange | 4.5 | 6.4 |
  | outline | table | 3 | 3.8 |
  | outline | surface | 3 | 3.4 |
  | card-edge | table | 3 | 3.6 |
  | card-edge | surface | 3 | 3.2 |
  | accent-teal | surface | 3 (non-text: outline and ring) | 7.0 |
  | accent-teal | card-face | 3 (non-text) | 6.6 |

  The hard assertion is ratio >= floor for every theme. For the default theme only, additionally `round1(ratio) === figure` (catches drift; never assert unrounded >= figure, which several fail). Disabled ink is exempt. A negative case feeds an inline low-contrast record that must fail, so later themes inherit a proven harness.
- Out of scope: index.html theme-color and the vite.config.ts manifest `#15171B` (outside src/**) stay unchanged (TH-3); `color-scheme: dark` in app.css stays.

Interface: src/ui/app.css; the scan module and the contrast and literal-scan tests under src/ui/theme/; component CSS reads tokens only.
Tests: Contrast ratios for the default token set (U); literal scan (U); screenshots unchanged where covered (screens). The scan's own test runs the pure function on inline strings (positive per form incl. `fill="red"`, `background: red`, `border: 1px solid white`, `var(--wc-typo)` in `color:`, a comma-form rgb token and #0008; negatives `#app {}`, `href="#main"`, `&#8722;`, `white-space: nowrap`, `.red {}`, a quoted font name, `querySelector('#add')`, `var(--wc-select-lift)` in a transform, `url(//x/#fff)`, and `// #fff` in .ts; `--wc-x: #fff` in app.css exempt, the same in Card.svelte or `color: #fff` in app.css failing) plus a run over the real tree asserting zero violations (a .svelte parse error throws and fails, within the AD-17 5 s budget). Placement: src/ui/theme/colour-literals.ts, colour-literals.test.ts and contrast.test.ts. Root-level src files fail AD-1 (`layerOf` gives 'stray'); under src/ui/ the UI layer rules apply (no value imports from src/engine; bare node:fs and node:path are fine) and the tree scan walks them like any other UI file (not added to SELF). Test names start with AD-14 or AD-17, never R-ids.
Owns: The token files and the theme data format.
Consumers: Every component using colour; epic 8 scene screenshots.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens (Docker container only) are green, `git diff --exit-code` over the screenshot baseline directories shows nothing after test:screens, the contrast test passes for the default theme, and the scan fails when a hex literal is added to a component.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — DESIGN.md Colors
- code — src/ui/app.css, src/ui/scenes/Scene.svelte
- constraint — ARCHITECTURE-SPINE.md AD-1 (scan), AD-10 (root custom properties, later TH-3 mirroring), AD-14 (UI), AD-17 (tests); AGENTS.md: never regenerate baselines, all existing .screens.spec.ts baselines, including the how-to-play ones, stay untouched

## Notes

- The epic's open question (literal count, scene colours as tokens or fixed art) is settled in the Description: 7 literals, all tokens.
