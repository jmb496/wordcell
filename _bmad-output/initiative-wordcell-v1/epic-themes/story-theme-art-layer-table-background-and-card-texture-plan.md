---
title: 'Theme art layer: table background and card texture'
type: 'feature'
ticket: 'story-theme-art-layer-table-background-and-card-texture'
created: '2026-10-18'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-art-layer-table-background-and-card-texture.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md'
warnings: []
deferred: []
baseline_revision: 'f52f80316fd760e1dcdbba118d7e7b042ba0f6f1'
---

<intent-contract>

## Intent

**Problem:** A theme can recolour the game but cannot supply a table background or a card-face texture; the art hooks (TH-5, TH-8, TH-9) do not exist, and nothing guards the letter contrast over art.

**Approach:** Two optional custom properties, `--wc-table-art` and `--wc-card-texture`, each `none` or one inline SVG data URI in a fixed grammar. Card faces and the `html` page background consume them. Vitest parses the grammar and measures contrast at the art's worst point. A test-only theme `garden` (separate stylesheet, test-hook builds only) exercises it end to end.

## Boundaries & Constraints

**Always:**
- Grammar of a non-`none` token (Vitest throws on any deviation, over app.css `themeRecords` plus the test sheet): exactly one `url("data:image/svg+xml,…")`, percent-decoded (`#` written `%23`) to an SVG with integer px `width`, `height`, `viewBox` (the tile size), root `xmlns="http://www.w3.org/2000/svg"`, single-quoted attributes, only `rect`, `circle`, `path`. Attributes sit on each shape, never on a `<g>` (the research mockups in `research/tools/themes.mjs` put them on a group: the garden art is authored per shape).
- Owner decision 2026-10-18 (ticket Notes): every shape carries an explicit `fill` attribute (`#rgb`/`#rrggbb`, or `none`); a shape with no `fill` attribute throws (the SVG default is black, so an omitted fill must never pass). `stroke` (hex) is optional with optional `stroke-width`; `fill-opacity`/`stroke-opacity` are decimals in [0,1], absent means 1. A `fill="none"` shape contributes only its stroke; a shape with `fill="none"` and no `stroke` throws (invisible).
- Worst point: per distinct colour, the sum of the opacities of every fill and stroke using it, capped at 1 (bounds overlap, tile phase irrelevant). Each colour is composited alone over the surface and every ordering of all the art's colours is stacked in turn (at most 4 distinct colours, else throws); sRGB, straight alpha.
- Owner decision 2026-10-18 (contrast floors): the TABLE floor column of `contrast.test.ts` (card edge 3, outline 3, card text 4.5) is the minimum for every theme, art or not. DESIGN.md's 3.6, 3.8, 13.1 are the default theme's pinned figures only (the `figures` flag already limits them to `default`).
- Owner decision 2026-10-18 (table art placement): table art is painted on the page background only, the `html` element. `body` has no background; sticky TopBar, Panel and `.banner` stay flat opaque; `Board.svelte` is not edited; Scene keeps its flat `--wc-table` fill and its Cards carry the texture.
- Texture: flat tile, total opacity at most 6 % (the per-colour capped sum, for every colour), no gradients (DESIGN.md Avoid list); table art is uncapped. Base `.face` becomes `background-color: var(--wc-card-face); background-image: var(--wc-card-texture)`, intrinsic px tile, default repeat, no `background-size`. `.block`/`.destination` face shorthand becomes `background-color` so the texture shows; `.ghost .face` sets `background-image: none`; `.used` keeps its R-33 hatch and no texture.
- Both tokens are declared `none` in the `:root, [data-theme="default"]` rule at the top of `src/ui/app.css`; the default theme is unchanged and its baselines too (TH-4). No layout, card size, DOM, border or padding change.
- Delivery: hand-authored inline SVG in CSS; no fetch, raster, dependency (TH-8) or runtime check; never touch `dontCacheBustURLsMatching` (AD-8).
- Art colours follow TH-2: the colour-literal scan accepts hex inside art tokens; the contrast and key-set checks merge the test sheet's tokens over the default record and skip the two art keys when resolving colours.

**Never:** a shipped theme with art; card backs (TH-9); a change to AD-16's pre-paint script, `test-hook.ts` or `e2e/globals.d.ts`; a new `ThemeId` (`garden` already exists, unshipped); a runtime load-failure path or fallback (rule 6, failures throw in Vitest); editing `Board.svelte`; any change to the dealt layout.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default | both tokens `none` | no image on faces or `html`; baselines unchanged | none |
| Valid art | one data URI in grammar, colours meet floors at the worst point | checks pass | none |
| Stroke-only shape | `<path fill='none' stroke='%23abc'/>` | stroke counted, no fill counted | none |
| Missing fill | `<path stroke='%23abc'/>` | rejected | Vitest throws (grammar) |
| `fill='none'` with no stroke | invisible shape | rejected | Vitest throws |
| Attributes on `<g>`, other element, gradient, `href`, `<script>`, external `url()`, `var()` | outside grammar | rejected | Vitest throws |
| Texture over 6 % | a colour's capped opacity sum > 0.06 | rejected | Vitest throws |
| Low contrast at worst point | texture or table art pushes a TABLE pair below its floor | fails | Vitest names the pair and ratio |
| `fill`-less stroke-only art that would render black | covered by Missing fill | rejected | as above |
| Ghost / used / mirror / tray card | `garden` active | ghost no image; used hatch only; mirror and tray carry texture | none |

</intent-contract>

## Code Map

- `src/ui/app.css` -- add the two `none` tokens to the default block (lines 9-35); split `html, body` (line 41) so `html` has `background-color: var(--wc-table); background-image: var(--wc-table-art); background-attachment: scroll`, `body` none (keeps margin, overscroll, height).
- `src/ui/Card.svelte` -- `.face` (line 208-210) add `background-color`/`background-image`; `.ghost .face` (271) `background-image: none` beside `background: none`; `.destination .face, .block .face` (275-276) shorthand to `background-color`; `.used .face` (351) unchanged.
- `src/ui/theme/garden.css` (new) -- `[data-theme="garden"] { --wc-table-art: …; --wc-card-texture: … }` plus no other tokens; imported after app.css (source order wins); test-hook builds only.
- `src/main.ts` -- inside the existing `import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1'` branch (line ~221): register `testGarden` and `await import('./ui/theme/garden.css')` before `boot()` (top-level await or an async wrapper; `boot` stays unawaited elsewhere).
- `src/ui/theme/registry.ts` -- add `testGarden: ThemeEntry` (`id: 'garden'`, label from `text.ts`, `meta` equal to the garden table colour, exempt from the token check like `testPaper`); `src/ui/text.ts` -- add `themeGarden` beside `themePaper` (line 218); `registry.test.ts` -- cover it.
- `src/ui/theme/colour-literals.ts` -- `TOKEN_FILE` becomes the two paths (`src/ui/app.css`, `src/ui/theme/garden.css`); `scanCss` exemption keeps working on both; hex inside `url(...)` is already blanked. Export the art grammar parser (or place it in a new `src/ui/theme/art.ts` imported by the tests).
- `src/ui/theme/contrast.test.ts` -- extend: new TABLE row `card-ink` on `destination-fill` (4.5, pinned figure computed from the default); worst-point checks; merged-record handling for `garden`; the grammar tests of the matrix. `src/ui/theme/colour-literals.test.ts` (line 146 uses `defaultTokenNames`) -- key-set check treats the art keys as optional.
- `e2e/theme-art.spec.ts` (new, android) -- pixel check, computed style, layout equality; `e2e/pwa/` build-output spec -- dist lacks and dist-test has the `[data-theme="garden"]` selector and art URI (use `helpers/dist-test.ts`, project `dist-smoke` and `pwa`). Seed garden through the test hook's prefs (fixture `prefs-theme-garden.json`, `<key>-…` naming per AGENTS.md).
- Reuse: `themeRecords`, `cssDecls` (colour-literals.ts); `ratio`/`parseColour` in contrast.test.ts. Do not change: `scripts/size-budget.mjs`, `vite.config.ts`, `src/shell/prefs.svelte.ts` (`garden` is already in `THEMES`), the default record's colours.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/theme/art.ts` (new, with `art.test.ts`) -- percent-decode and parse a token into shapes; enforce the grammar, the explicit-`fill` rule and the 6 % texture cap; compute per-colour capped opacities -- Hooks grammar, owner decision on fill
- [x] `src/ui/app.css`, `src/ui/Card.svelte` -- tokens and consumers as in the Code Map -- TH-5 surfaces
- [x] `src/ui/theme/garden.css`, `src/main.ts`, `src/ui/theme/registry.ts`, `src/ui/text.ts`, `src/ui/theme/registry.test.ts` -- test-only theme -- Scope
- [x] `src/ui/theme/colour-literals.ts`, `colour-literals.test.ts` -- token files and optional art keys -- TH-2
- [x] `src/ui/theme/contrast.test.ts` -- TABLE row, worst-point texture-over-face checks for every TABLE row on card-face or destination-fill, table art over `--wc-table` for every row drawn on the table (card-edge, outline), all against the TABLE floor column; negative tests (texture dropping card-ink below 4.5 fails) -- TH-5
- [x] `e2e/theme-art.spec.ts`, `e2e/pwa/…`, fixture -- Playwright checks below
- [x] Run `npm run build`; record total gzip bytes and margin to 600,000 in Implementation Notes; confirm `dist/` carries no garden selector or art URI

**Acceptance Criteria:**
- Given the default theme, when both tokens are read, then they resolve to `none` and `test:screens` baselines are unchanged.
- Given `garden` (Playwright android), when a live card, the QU card, a tray tile and a block or destination card are rendered with the glyph `visibility:hidden`, then the worst pixel over the letter-box clip meets 4.5 against card-ink.
- Given `garden`, when computed styles are read, then `.ghost .face` has `background-image: none`, `.used` keeps its hatch and no texture, `html` has the table image and `body` none.
- Given a theme switch default to `garden` (P6), when rects of columns, WordCells, cards, tray, sticky bars and document scrollHeight/scrollWidth are compared, then they are equal.
- Given the Vitest grammar tests, when a token omits `fill` on a shape, uses `fill='none'` without `stroke`, puts attributes on `<g>`, exceeds the texture cap, or lowers a pair below its TABLE floor (3, 3, 4.5) at the worst point, then the check throws or fails naming the pair.
- Given `npm run build` and `build:test`, then dist lacks and dist-test has the `[data-theme="garden"]` selector and art URI, and the size budget passes with the margin recorded.

## Implementation Notes

- Size budget: `npm run build` total 550,807 of 600,000 gzip bytes, margin 49,193; `dist/` carries no garden selector or art URI (build-output spec).
- Files: `src/ui/theme/art.ts` (+test) grammar/worst-point; `app.css`, `Card.svelte` consumers; `garden.css`, `main.ts`, `registry.ts`, `text.ts` test theme; `colour-literals.ts` token files; `contrast.test.ts` rows and worst-point checks; `e2e/theme-art.spec.ts`, `e2e/pwa/build-output.spec.ts`, `fixtures/prefs-theme-garden.json`; DESIGN.md one sentence (owner close-out).
- Surprises: `garden` registers in dev and test-hook builds, so the Preferences Theme group shows a third segment; `preferences-panel-android-linux.png` regenerated in the screenshot container (only that segment differs); `e2e/theme.spec.ts` radio count 2 to 3; `app-shell.spec.ts` now expects the table colour on `html`, none on `body`. Pixel check insets the letter box 6 px (face corner radius) and hides lock, badge and marks (non-letter marks exempt, TH-9).
- Verification: lint, check, unit (3009) pass; build passes; dist-smoke 17 and pwa 14 pass; `test:e2e` one load-flaky `helpers.spec.ts:156` failure that passes on rerun alone; screens green after the baseline regeneration.

## Plan Change Log

## Review Triage Log

### 2026-10-18 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 5, false 15, maybe-false 0 (4 not counted: audit narrative of intent-alignment, rejected as description only)
- findings:
  - `[low]` `[patch]` Implementation Notes and size margin unrecorded — written by the parent above.
  - `[false]` `[reject]` Board opaque background hides table art — Board.svelte has only the sticky `.banner` background (line 148); no board-wide fill.
  - `[false]` `[reject]` start() rejection swallowed or boot delayed in production — unhandledrejection handler (main.ts:45) calls fatal; no await runs in production so boot() runs synchronously.
  - `[low]` `[reject]` zero-opacity paint counted, malformed path data, stroke-width unbounded, viewBox strictness, shape regex — fail closed or pessimistic; fix adds complexity.
  - `[low]` `[reject]` ink-primary on destination-fill over texture, edge/outline on textured face — the plan fixed the row set; border paints over the texture.
  - `[low]` `[reject]` P6 test switches by dataset, pixel-check inset, DESIGN.md sentence wording, PW_PREVIEW assumption, dist-test cascade order — recorded design choices or covered by passing specs.
  - `[false]` `[reject]` stacking bound looser than rendering — intentional conservative bound (Design Notes).
  - Intent-alignment: reading R-A (infrastructure plus test-only exemplar) implemented; shipped art and runtime load-failure are out of ticket scope (plan Never list, 9.6); owner-listed decisions followed.
  - Verification-gap lens: no gaps.

## Design Notes

Owner resolutions (recorded, not re-opened): (1) the Hooks-grammar open major from the capped review loop: stroke-only shapes with no fill attribute render black and the worst-point check did not model them. Resolved by requiring an explicit `fill` on every shape (`none` allowed) and counting only non-`none` fills plus strokes; the `<g>` mockup divergence is resolved by authoring per shape. (2) Table art on `html` only. (3) TABLE floors (3, 3, 4.5) for every theme; 3.6/3.8/13.1 default only. Close-out doc edit (DESIGN.md contrast section says its figures describe the default theme only) is owner-listed and included as a one-sentence edit to DESIGN.md.

Review-loop minors resolved: the 6 % cap is per colour, on the capped sum; overlapping different colours are covered by stacking every ordering; the build-output check has its own spec and bullet; the `garden` sheet loads after app.css so source order wins; non-letter marks (badges, lock) are exempt per TH-9; the tile origin is the `html` canvas origin.

Golden token shape (decoded): `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M0 12h24' fill='none' stroke='#fff' stroke-opacity='0.04'/></svg>`.

## Auto Run Result

- Summary: art hooks (`--wc-table-art`, `--wc-card-texture`), grammar parser with explicit-fill rule, worst-point contrast checks against the TABLE floors (3, 3, 4.5), `html`-only table art, test-only `garden` theme.
- Owner open major resolved: Hooks grammar fill rule (explicit `fill`, `none` allowed, per-shape attributes) in `art.ts` and its tests; table art on `html` only; TABLE floors for every theme (DESIGN.md sentence added).
- Review: patches 1 (notes), deferred 0, rejected as logged above.
- Follow-up review recommended: false.
- Residual risks: `garden` shows in the Preferences theme list in dev and test-hook builds (baseline regenerated); art checked only through the test theme until Greenhouse Dusk.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: success
- `npm run build` -- expected: size budget passes; record bytes and margin
- `npm run test:all` -- expected: all suites pass
- `npm run test:screens` -- expected: default baselines unchanged (Docker)

**Manual checks (if no CLI):**
- `git diff` shows no `Board.svelte`, `test-hook.ts`, `globals.d.ts`, `vite.config.ts` change.
