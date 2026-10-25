---
id: 8
type: story
title: "Theme: Greenhouse Dusk"
parent: epic-themes
covers: [TH-5, TH-6, TH-9, TH-8]
after: [5, 7]
risk: medium
hitl: false
---

# Theme: Greenhouse Dusk

## Description

Builds the Greenhouse Dusk theme (id `garden`) from the 9.1 brief and DESIGN.md Themes: its token set in src/ui/app.css, using the art layer for the leaf-vein table and paper-fibre card face, selectable in Preferences, covering all surfaces, states and the How to play scenes, with its contrast test (worst-point and pixel-sampled over the texture) and a screenshot baseline set (board, tray, a sheet, a scene) generated in the Playwright container.

Entry 8 fields: `risk: medium`, `done_checkpoint: true`, `hitl: false` (the build runs unattended).

- Registry: export production `gardenTheme` (src/ui/theme/registry.ts; id `garden`, label `text.themeGreenhouseDusk` = 'Greenhouse Dusk', replacing `themeGarden: 'Garden'` in src/ui/text.ts; meta `#101A14` = its `--wc-table`), registered by main.ts in every build in the order `default`, `scifi`, `garden`, `paper` (spec §7.10). Delete `testGarden`, start()'s test-hook registration block and its dynamic `garden.css` import; delete src/ui/theme/garden.css and drop it from `TOKEN_FILES` in colour-literals.ts and from its tests (colour-literals.test.ts lines ~44, ~86-94 retarget app.css). The tokens and art move into an app.css `[data-theme="garden"]` block after the scifi block, before paper. Follow-ons: contrast.test.ts deletes the garden.css read and its merge over the defaults (lines ~144-147) and the two-key sheet assertion (~205); the art-token test (~199, "garden sets both from the test sheet") is renamed and keeps its `parseArt` checks against the app.css garden record; registry.test.ts's `testGarden` test (line ~61) becomes the `gardenTheme` shape test; e2e/theme-art.spec.ts radio name 'Garden' becomes 'Greenhouse Dusk' (fixture `prefs-theme-garden` kept and reused). Comments naming the test-only garden are updated (registry.ts ~4, main.ts ~226-228, e2e/theme-art.spec.ts ~7-8, e2e/theme.spec.ts ~10, contrast.test.ts ~144); the plan decides whether start() stays. The unregistered-id examples stay `plum` and `steampunk`.
- Radio order: theme.spec.ts keeps count 4 but its list becomes Charcoal, Deep Space, Greenhouse Dusk (`.nth(2)`, was `.nth(3)` 'Garden', line ~135), Daylight Paper (`.nth(3)`); the e2e/pwa/dist-smoke.spec.ts Theme-group test (line ~58) is renamed to offer Charcoal, Deep Space, Greenhouse Dusk and Daylight Paper (count 4, order), and picks Greenhouse Dusk hook-free, asserting root `data-theme` `garden` and meta `#101A14`. The screenshot suite runs against `npm run dev`, where main.ts already registers `testGarden`, so the Preferences baselines already show four radios: the relabel and reorder shift them (Default baselines); regenerating them is an owner approval at review.
- Tokens: the 18 values are copied exactly from research/brief.md section B (cite, do not restate) into the `[data-theme="garden"]` block, with `color-scheme: dark` and the scrim `#000000b3` as the brief gives it. Four internal tokens explicit: `--wc-scene-pointer-fill`, `-stroke`, `-shadow` keep the default's; `--wc-shadow-drag` is the slash-alpha form as 9.6/9.7. `--wc-accent-teal` holds the sage green `#8fdc9e` by design (token names are not renamed).
- Art: from brief §B and research/tools/themes.mjs, converted to the 9.5 data-URI grammar (rect, circle or path only, explicit fill on every shape, `%23` for `#`) keeping themes.mjs path data, stroke widths (1.2 table, 1 card) and opacities exactly; the `<g>` attributes move onto each path, `viewBox` is added, every path gets `fill="none"`, so a contrast failure is the brief's, not the conversion's: `--wc-table-art` a 64 px leaf-vein tile (two curves and a stem, stroke `%238fdc9e`) at 8 %, `--wc-card-texture` a 6 px paper-fibre tile (`%23f6f0dc`) at 3 %. Brief and themes.mjs agree (`.08`, `.03`); only their comments say 6 % and 5 %. The 9.5 grammar test must pass.
- Meta: contrast.test.ts's meta-equals-table assertion adds `gardenTheme` (`#101A14` vs app.css `--wc-table`); the testGarden-default-meta assertion is removed. The manifest `theme_color` and index.html's static meta stay `#15171B` (TH-3).
- Surfaces: no component or Scene.svelte change is expected (TH-2 scan and key-set check green); `.ghost` and `.used` take no texture and the Scene shows a flat table (9.5).
- Budget (TH-8): scripts/size-budget.mjs green in `npm run build`; the plan records the margin (the brief estimates ~587 B gzip).
- Dark first frame: as 9.7: AD-16 unchanged, the pre-paint script sets `data-theme` before first paint, only the static meta waits for main.ts, a `#15171B` bar against a `#101A14` page until then; flagged for the owner gate (the 9.6 decision covers paper only).
- DESIGN.md Themes: untouched here until the 9.11 sweep.

## Acceptance Criteria

Verify at built: npm run test:all and npm run test:screens are green with the theme's baselines committed, the contrast test passes, the size budget holds, a Playwright android test switches to it and back, and the baseline diff is confined to the Preferences-panel Theme group (Default baselines). Owner checkpoint after built: he plays it on Android before it is marked done.

- Contrast, Vitest (contrast.test.ts, `AD-14` names): `garden` is in the themes under test (`gardenTheme` replaces `testGarden`) and passes every TABLE row at its floor (9.5 Notes option A; the brief's figures are informational), including card-ink on destination-fill and the worst-point rows over both art layers. The pixel check (e2e/theme-art.spec.ts: live card, QU card, tray tile, block or destination card, ink at least 4.5), the P6 layout-equality test and the `.ghost`/`.used` computed-style tests there already carry a `garden` entry in `ARTS` and run against the production theme. If the pixel check or a worst-point row fails, the builder does not change the art or opacity: the plan is left unbuilt (blocked), nothing is committed, and the run stops with the measured ratio for the owner.
- Registry, Vitest (registry.test.ts, `AD-10`/`AD-16`): covers `gardenTheme` shape (id, label from text.ts, meta `#101A14`) and apply; production membership and order are covered by the dist-smoke Theme-group test.
- Switch, Playwright android (e2e/theme.spec.ts, `Q-45`/`AD-10`/`AD-16`): pick the Greenhouse Dusk radio; root `data-theme` is `garden`, computed `color-scheme` is `dark`, the meta is `#101A14`, and `--wc-table-art` and `--wc-card-texture` are not `none`; switching back to Charcoal gives `data-theme` `default`, meta `#15171B`, the default values and `none` for both art tokens; a reload keeps garden.
- Build output (e2e/pwa/build-output.spec.ts, test at line ~141, "the test-only garden stylesheet ... absent from dist", now false): retargeted and renamed (keeping `AD-14 TH-9`) so it discriminates: the garden selector and a garden-only art substring (`%238fdc9e`, replacing `%233b6b4f`) and the scifi selector and art (`%2335d0ff`) are present in both dist and dist-test; the selectors of the not-yet-registered `steampunk` and `plum` are absent from both (absent today; each later theme ticket edits this list).
- Hue alone (TH-5): as 9.7, the theme adds no state, so the default's non-hue cues carry over; the shots show the destination block and lock (tray, scene 2) and the pressed Validate (scene 2), and none shows the R-38 invalid line or the tap-selected state, so the claim stops there. Per the owner decision of 2026-10-18 (epic Notes), garden's green act accent relaxes the "no green success" wording: nothing turns green on success, the accent marks act and selection only.
- Screenshots, new e2e/theme-garden.screens.spec.ts (android only, `AD-17` names, baselines generated in the container via `npm run test:screens`), seeded through `seedStorage` with the existing `prefs-theme-garden` fixture: the same four fixtures and frames as e2e/theme-scifi.screens.spec.ts (board, tray, Preferences sheet at 360 px with the Greenhouse Dusk radio asserted checked first, How to play scene 2 via `openScene`). The long 'Greenhouse Dusk' label shows intact at 360 px; the scene shows textured cards on a flat table.
- Default baselines (TH-4): no board, tray, scene or sheet default shot changes, except the Preferences ones, which already show four radios under the dev-server `testGarden`: e2e/preferences.screens.spec.ts `preferences-panel.png`, and the existing `theme-paper-preferences.png` and `theme-scifi-preferences.png` (not default shots). The only permitted pixel change is the Theme group's relabel ('Garden' to 'Greenhouse Dusk', last to third, Daylight Paper to last) and whatever a wrapped label shifts; the plan re-greps e2e/*.screens.spec.ts for others. These are regenerated in the container; every other snapshot is unchanged and the only new baselines are the four garden shots.
- Scan and budget: the TH-2 colour-literal scan stays green; the TH-8 size budget holds with the margin in the plan.
- Owner gate: the owner plays the theme on his Android install before it is marked done; the dark first-frame tint, the paper-fibre and leaf-vein look, and the scene pointer's visibility on the moss table (pointer tokens keep the default's) are his to accept.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — research/brief.md section B (Greenhouse Dusk) and research/tools/themes.mjs (the entry 1 brief, direction Greenhouse Dusk)
- design — DESIGN.md Themes
- architecture — ARCHITECTURE-SPINE.md AD-7, AD-10, AD-14, AD-16, AD-17
- rules — docs/game-flow-spec.md Q-45, §7.10
- siblings — story-theme-art-layer-table-background-and-card-texture.md (9.5), story-theme-daylight-paper.md (9.6), story-theme-deep-space.md (9.7)
- code — src/main.ts, src/ui/app.css, src/ui/text.ts, src/ui/theme/registry.ts, registry.test.ts, contrast.test.ts, colour-literals.ts, colour-literals.test.ts, garden.css (deleted), e2e/theme.spec.ts, e2e/theme-art.spec.ts, e2e/theme-scifi.screens.spec.ts, e2e/pwa/dist-smoke.spec.ts, e2e/pwa/build-output.spec.ts

## Notes

- The leaf-vein table and paper-fibre texture are in scope per the owner decision of 2026-10-18 (epic Notes: build all five directions with the art as mocked up). Dropping the texture or lowering its opacity is an owner call.
- Garden is third in the Theme radio order, between Deep Space and Daylight Paper, per spec §7.10; the baseline changes are an owner approval at review.
- Post-close (Opus review, owner decisions D1–D6, 2026-10-22, `5210279`, `a88cf67`, `45f6a13`; see the epic Notes): D3 this theme's `--wc-shadow-drag` is DESIGN.md's `#0008` like Charcoal; D6 its table-art opacity 0.08 → 0.045 (washed drop-target outlines at 3:1).
