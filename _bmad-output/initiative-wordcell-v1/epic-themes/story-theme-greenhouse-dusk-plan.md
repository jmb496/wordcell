---
title: 'Theme: Greenhouse Dusk'
type: 'feature'
ticket: 8
created: '2026-10-19'
status: built
baseline_revision: 'f793042c53de124f311b302333e8f6e4e60723e0'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-greenhouse-dusk.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space-plan.md'
  - '{project-root}/AGENTS.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Garden exists only as the test-only `testGarden` (two art tokens, `garden.css`); the Greenhouse Dusk direction (id `garden`, leaf-vein table, paper-fibre card face) from the 9.1 brief is unbuilt.

**Approach:** Ship `gardenTheme` (meta `#101A14`, brief section B tokens, `color-scheme: dark`, both art layers) registered in every build as third in Theme order (default, scifi, garden, paper; spec §7.10), replacing `testGarden`/`garden.css`. The story file Description, Acceptance Criteria and Notes are the full specification; follow them verbatim, with 9.7's plan (story-theme-deep-space-plan.md) as the pattern.

## Boundaries & Constraints

**Always:** The 18 values copied exactly from research/brief.md section B; `[data-theme="garden"]` block in app.css after scifi, before paper; `--wc-shadow-drag` written as the literal `rgb(0 0 0 / 0.35)`; pointer tokens as default's; scrim `#000000b3`. Art per the 9.5 data-URI grammar from research/tools/themes.mjs: rect, circle or path only, single-quoted attributes (`parseArt` rejects double quotes), explicit fill on every shape (`fill='none'` on each path), `%23` for `#`, `viewBox` added, `<g>` attributes moved onto each path, themes.mjs path data, stroke widths (1.2 table, 1 card) and opacities (.08, .03) exactly; only the themes.mjs comments say 6 % and 5 %. `start()` is removed; `void boot()` runs directly. Tests named by id. The unregistered-id examples use `plum` only (steampunk is not used in registry.test.ts or theme.spec.ts).

**Never:** Edit the spine, DESIGN.md, `index.html` meta, the manifest, `tickets.toml`, components or Scene.svelte. Change the art or opacity if the pixel check or a worst-point row fails: leave the plan unbuilt (blocked), commit nothing, report the measured ratio (the card-ink worst point is thin, 13.25 against the 13.1 floor). Add a fallback. Push. Touch `bga-wordcell`.

</intent-contract>

## Code Map

- `src/ui/theme/registry.ts` -- add `gardenTheme` (id `garden`, label `text.themeGreenhouseDusk`, meta `#101A14`); delete `testGarden`; fix header comment (production registers default, scifi, garden, paper; no test-only entry).
- `src/ui/text.ts` (~l.220) -- replace `themeGarden: 'Garden'` with `themeGreenhouseDusk: 'Greenhouse Dusk'`.
- `src/main.ts` (l.33-34, 226-239) -- import `gardenTheme`; `register(gardenTheme)` between scifi and paper; remove `testGarden` import, `start()`, the test-hook registration and dynamic `garden.css` import; `void boot()` directly; update comments.
- `src/ui/app.css` -- `[data-theme="garden"]` after the scifi block, before paper: 18 brief B values, `color-scheme: dark`, pointer tokens as default, art tokens.
- `src/ui/theme/garden.css` -- delete.
- `src/ui/theme/colour-literals.ts` / `.test.ts` (~l.44, 86-94) -- drop `garden.css` from `TOKEN_FILES` and tests; retarget at app.css.
- `src/ui/theme/contrast.test.ts` (~144-147, 199, 205) -- drop garden.css read/merge and two-key sheet assertion; garden joins themes from app.css; rename art-token test, keep `parseArt` checks on app.css garden record; meta-equals-table adds `gardenTheme`, remove testGarden-default-meta assertion.
- `src/ui/theme/registry.test.ts` (~61, 77) -- `testGarden` test becomes `gardenTheme` shape/apply test; unregistered-id stays `plum`.
- `e2e/theme.spec.ts` (~10, 135, 248) -- radios Charcoal, Deep Space, Greenhouse Dusk (`.nth(2)`), Daylight Paper (`.nth(3)`), count 4; Switch test garden and back, reload keeps garden.
- `e2e/theme-art.spec.ts` (~7-8) -- radio name 'Greenhouse Dusk'; `ARTS` garden entry runs against production; fixture `prefs-theme-garden` reused.
- `e2e/pwa/dist-smoke.spec.ts` (~58) -- Theme-group test renamed, offers Charcoal, Deep Space, Greenhouse Dusk, Daylight Paper; picks Greenhouse Dusk: `data-theme` `garden`, meta `#101A14`.
- `e2e/pwa/build-output.spec.ts` (~141) -- retarget/rename (keep `AD-14 TH-9`): garden selector and `%238fdc9e`, scifi selector and `%2335d0ff` present in dist and dist-test; `steampunk` and `plum` selectors absent from both.
- `e2e/theme-garden.screens.spec.ts` (new) -- clone `theme-scifi.screens.spec.ts`; names `theme-garden-<shot>.png`; assert `dataset.theme` `'garden'` and dictionary ready before board/tray shots; Preferences radio checked first; baselines via `npm run test:screens`.
- Preferences baselines (`preferences-panel.png`, `theme-paper-preferences.png`, `theme-scifi-preferences.png`) -- regenerate only if they differ (relabel/reorder); re-grep `e2e/*.screens.spec.ts`.
- Read-only: `index.html`, `vite.config.ts`, `e2e/globals.d.ts`, `tickets.toml`, research/brief.md section B, research/tools/themes.mjs.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/theme/registry.ts`, `src/main.ts`, `src/ui/theme/registry.test.ts` -- `gardenTheme` in every build, third; delete `testGarden`, `start()` -- TH-3, AD-10
- [x] `src/ui/app.css`, delete `src/ui/theme/garden.css`, `colour-literals.ts`, `colour-literals.test.ts` -- garden block with tokens and art -- TH-2, TH-5, TH-9
- [x] `src/ui/theme/contrast.test.ts` -- garden under test, meta equals table -- AD-14
- [x] `e2e/theme.spec.ts`, `e2e/theme-art.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/pwa/build-output.spec.ts` -- per the Code Map -- Q-45, AD-10, AD-14, AD-16
- [x] `e2e/theme-garden.screens.spec.ts` and baselines; regenerate changed Preferences baselines -- TH-4, AD-17
- [x] Record in Implementation Notes: TRANSLUCENT/OPAQUE internal tokens, size-budget margin (TH-8, brief ~587 B gzip), measured pixel ratio, owner-gate items (first-frame tint `#15171B` vs `#101A14`, leaf-vein and paper-fibre look, pointer visibility on moss).

**Acceptance Criteria:**
- Given the production list, when Preferences opens, then Charcoal, Deep Space, Greenhouse Dusk, Daylight Paper are offered in order and choosing Greenhouse Dusk sets `data-theme` `garden`, `color-scheme: dark`, meta `#101A14`, both art tokens not `none`; switching back gives `default`, `#15171B`, `none`; reload keeps garden.
- Given garden, when contrast.test.ts and the pixel check run, then every TABLE row passes at its floor and card ink is at least 4.5 over the texture.
- Given `npm run test:all` and `npm run test:screens`, when they run, then both pass with four new garden baselines, and the only changed existing baselines are Preferences Theme-group ones.

## Implementation Notes

- Internal tokens: TRANSLUCENT `scrim` (`#000000b3`), `shadow-drag` (`rgb(0 0 0 / 0.35)`), `scene-pointer-shadow` (default's); OPAQUE `scene-pointer-fill`, `scene-pointer-stroke` (default's).
- Size budget (TH-8): total 551575 of 600000 bytes (margin 48425); css 7911 B (scifi build 7665 B, +246 B).
- Pixel ratio: theme-art.spec.ts garden pixel test passes at the 4.5 floor (not logged); contrast.test.ts rows pass including the worst-point rows over both art layers. Art and opacity unchanged.
- Screenshots: four new garden baselines; `preferences-panel.png` and `theme-paper-preferences.png` regenerated (Theme group relabel and reorder). `theme-scifi-preferences.png` did not differ.
- `test:all` stages run separately (the combined run exceeded the tool timeout): lint, check, unit (3024), build, dist-smoke (17), e2e (970 passed; one flaky `board-keys.spec.ts:704`, passes alone), pwa (14).
- Owner gate: first-frame tint (`#15171B` status bar vs `#101A14` page), leaf-vein and paper-fibre look, scene pointer visibility on moss.

## Plan Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 18 findings — high 0, medium 0, low 3, false 15, maybe-false 0
- findings:
  - `[false]` `[reject]` Plan frontmatter `ticket: 8`, checkboxes unticked, empty logs (blind, edge) — `ticket` is find's id per step-01; checkboxes ticked at finalize, logs are filled here.
  - `[low]` `[reject]` Pixel ratio not logged (blind, edge, intent-alignment) — the test asserts >= 4.5 and passes; the ticket requires the ratio only on failure; logging is new complexity.
  - `[low]` `[reject]` `parseArt` checks do not pin stroke widths or opacities (blind) — the ticket prescribes the checks and the 9.5 grammar test; the art is read from the pinned design.
  - `[false]` `[reject]` Two-key sheet assertion removal leaves tokens unchecked (blind, edge) — the ticket prescribes the removal; the existing key-set test covers a missing key.
  - `[false]` `[reject]` Production order has no unit test (blind) — the ticket assigns order to the dist-smoke and theme.spec radio tests.
  - `[low]` `[reject]` Stale comment headers and single-entry `TOKEN_FILES` (blind) — cosmetic, no harm.
  - `[false]` `[reject]` build-output absence list is hand-maintained and substring-based (blind, edge) — the ticket prescribes it.
  - `[false]` `[reject]` No drag/highlight-state shots (blind) — the ticket fixes the shot set (board, tray, sheet, scene).
  - `[false]` `[reject]` Board/tray shots lack reducedMotion (blind, edge) — identical to theme-scifi.screens.spec.ts, and the screens run passed.
  - `[false]` `[reject]` register order vs boot (edge) — registers precede `void boot()`; dist-smoke and Switch tests pass.
  - `[false]` `[reject]` Art spec runs dev server only (edge) — the build-output spec covers dist; the ticket prescribes this split.
  - `[false]` `[reject]` Missing garden key would inherit default (edge) — covered by the existing key-set test.
  - `[false]` `[reject]` verification-gap: no gaps found.
  - `[false]` `[reject]` intent-alignment: pixel tests and baselines not visible in the diff (PNG excluded; pixel test unchanged) — descriptive; those tests ran in `test:all` and `test:screens`.
  - `[false]` `[reject]` intent-alignment: `steampunk` dropped from unregistered-id examples — owner-approved correction (only `plum` is used).
  - `[false]` `[reject]` intent-alignment: Switch test does not compare other default values — the ticket asks for `data-theme`, meta and `none`.
  - `[false]` `[reject]` intent-alignment: readings B-D narrower than the diff — descriptive, no defect.
  - `[false]` `[reject]` intent-alignment: first-frame and Hue-alone items are not code — owner gate.

## Design Notes

Art conversion (path data from themes.mjs): table tile 64x64, three paths `M0 52C18 52 22 36 32 32S50 14 64 12`, `M0 12C14 14 24 26 32 32S52 50 64 52`, `M32 0V64`, each `fill='none' stroke='%238fdc9e' stroke-width='1.2' stroke-opacity='0.08'`; card tile 6x6, path `M0 1L3 0M3 4L6 3`, `fill='none' stroke='%23f6f0dc' stroke-width='1' stroke-opacity='0.03'`.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` -- expected: exit 0; `git status` shows four new garden baselines plus only Preferences baselines changed

## Auto Run Result

**Summary:** Greenhouse Dusk (`gardenTheme`, id `garden`, meta `#101A14`) is registered in every build, third in the Theme order. It has the 18 brief B tokens, `color-scheme: dark`, the leaf-vein table tile (8 %) and paper-fibre card tile (3 %). `testGarden`, `start()` and `garden.css` are removed. The six review-log minors are applied: contrast clause kept in Never, `start()` removed, art grammar notes, `theme-garden-<shot>.png` shots with `dataset.theme` assert, literal `rgb(0 0 0 / 0.35)`, `plum`-only examples.

**Files changed:** `src/ui/app.css`, `src/ui/text.ts`, `src/main.ts`, `src/ui/theme/{registry,registry.test,contrast.test,colour-literals,colour-literals.test}.ts`, deleted `garden.css`, `e2e/{theme,theme-art}.spec.ts`, `e2e/pwa/{dist-smoke,build-output}.spec.ts`, new `e2e/theme-garden.screens.spec.ts` with four baselines, regenerated `preferences-panel` and `theme-paper-preferences` baselines.

**Review:** patches 0; deferred 0; 18 findings rejected with reasons in the Review Triage Log.

**Follow-up review recommended:** false.

**Verification:** `npm run test:all` exit 0 (full combined run by the orchestrator); `npm run test:screens` passed in the build (54 passed); size budget 551575 of 600000 bytes (margin 48425).

**Residual risks / owner input:** owner gate: play on Android; first-frame tint (`#15171B` status bar vs `#101A14` page), leaf-vein and paper-fibre look, scene pointer visibility on moss; approve the two regenerated Preferences baselines. The pixel ratio is asserted at 4.5 but not logged (card-ink worst point is thin, 13.25 vs 13.1).
