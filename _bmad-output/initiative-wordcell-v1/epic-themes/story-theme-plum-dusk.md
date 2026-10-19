---
id: 10
type: story
title: "Theme: Plum Dusk"
parent: epic-themes
covers: [TH-5, TH-6, TH-9, TH-8]
after: [6, 9]
risk: low
hitl: false
---

# Theme: Plum Dusk

## Description

Builds the Plum Dusk theme (id `plum`) from the 9.1 brief and DESIGN.md Themes: its token set in src/ui/app.css, tokens only, no art, selectable in Preferences, covering all surfaces, states and the How to play scenes, with its contrast test and a screenshot baseline set (board, tray, a sheet, a scene) generated in the Playwright container.

Entry 10 fields: `risk: low`, `done_checkpoint: true`, `hitl: false` (the build runs unattended).

- Registry: export production `plumTheme` (src/ui/theme/registry.ts; id `plum`, label `text.themePlumDusk` = 'Plum Dusk' in src/ui/text.ts, meta `#17121C` = its `--wc-table`), registered by main.ts (line ~226-232 block, plus its import list and the registry.ts header comment) after `paperTheme`, in every build, in the order `default`, `scifi`, `garden`, `steampunk`, `paper`, `plum` (spec §7.10). `ThemeId` (prefs.svelte.ts, e2e/globals.d.ts) already holds `plum`. contrast.test.ts's meta-equals-table list (line ~156) gains `plumTheme`; registry.test.ts gains a `plumTheme` shape test beside the `steampunkTheme` one (line ~78).
- Tokens: the 18 values are copied exactly from research/brief.md section E (cite, do not restate; app.css keeps the brief's lowercase hex, while the registry meta and e2e constants are uppercase `#17121C`, the meta-equals-table test lowercasing both) into an app.css `[data-theme="plum"]` block after the paper block, with `color-scheme: dark` and the scrim `#000000b3`. The block also declares `--wc-shadow-drag: rgb(0 0 0 / 0.35)` (slash-alpha form as 9.6-9.9) and the three `--wc-scene-pointer-*` tokens with the default's values (the contrast.test.ts key-set check reports "missing key" otherwise). Only the two art keys are exempt: left unset, they resolve to `none` from `:root`; there is no art (TH-9 is met as "no art layer"; the TH-2 scan stays green).
- Unregistered example: registering `plum` breaks the two tests that use it as the unregistered id. Default applied: registry.test.ts (line ~99) retargets to `applyTheme('nonesuch' as ThemeId)` (the parameter is typed `ThemeId`) with message "AD-10 theme 'nonesuch' is not registered"; the e2e/theme.spec.ts test 'an AD-7-valid but unregistered theme reaches Halted' (lines ~296-312) is removed, since no AD-7-valid unregistered id remains. The e2e test is retired; the AD-10 throw stays covered by registry.test.ts and the shell-level halted cases in prefs.svelte.test.ts; the plan names them and flags the dropped e2e coverage for the owner at review.
- Contrast, Vitest (contrast.test.ts, `AD-14` names): `plum` is in the themes under test and passes every TABLE row at the enforced floors, 4.5 and 3 (9.5 Notes option A). The thinnest rows by the brief section E table are card ink on destination fill (10.36) and card edge on surface (3.77), informational against DESIGN.md's figures 9.9 and 3.2: a shortfall against a figure is only recorded in the plan. If a floor fails, the builder does not change tokens: the plan is left unbuilt (blocked), nothing is committed, and the run stops with the measured ratio for the owner. Plum is not added to e2e/theme-art.spec.ts `ARTS` (line ~12): there is no art to pixel-check.
- Switch, Playwright android (e2e/theme.spec.ts, `Q-45`/`AD-10`/`AD-16`, beside the Brass and Walnut test): pick the 'Plum Dusk' radio; root `data-theme` is `plum`, computed `color-scheme` is `dark`, the meta is `#17121C`, and both art tokens are `none`; switching back to Charcoal gives `#15171B`; a reload keeps it. New fixture fixtures/prefs-theme-plum.json, the shape of prefs-theme-garden.json with `"theme":"plum"`.
- Radio order: theme.spec.ts (lines ~132-137) and the e2e/pwa/dist-smoke.spec.ts Theme-group test (line ~58, lines ~73-78) go from count 5 to 6, and every title that enumerates the themes (theme.spec.ts ~l.125, dist-smoke ~l.58) is updated: Charcoal, Deep Space, Greenhouse Dusk, Brass and Walnut (`.nth(3)`), Daylight Paper (`.nth(4)`), Plum Dusk (`.nth(5)`). The dist-smoke test is renamed to match and picks Plum Dusk hook-free, asserting root `data-theme` `plum` and meta `#17121C`.
- Screenshots, new e2e/theme-plum.screens.spec.ts (android only, `AD-17` names, baselines generated in the container via `npm run test:screens`), seeded through `seedStorage` with `prefs-theme-plum`: the same four frames, named `theme-plum-board.png`, `theme-plum-tray.png`, `theme-plum-preferences.png`, `theme-plum-scene-2.png`, as e2e/theme-garden.screens.spec.ts (board, tray, Preferences sheet at 360 px with the radio asserted checked first, How to play scene 2 via `openScene`). The 'Plum Dusk' label shows intact at 360 px.
- Build output (e2e/pwa/build-output.spec.ts, test at line ~141, "plum is absent" now false; `plumSelector` flips to true): retargeted and renamed (keeping `AD-14 TH-9`): the garden, scifi, steampunk and plum selectors (and the garden, scifi and steampunk art markers) are present in both dist and dist-test; no absent list remains (this is the last theme edit). Plum has no art marker.
- Budget (TH-8): scripts/size-budget.mjs green in `npm run build`; the plan records the margin (the brief estimates ~258 B gzip).
- Surfaces: no component or Scene.svelte change is expected (TH-2 scan and key-set check green).
- Hue alone (TH-5): as 9.7-9.9, the theme adds no state, so the default's non-hue cues carry over; the accents keep their meanings and no "no green success" relaxation is needed.
- Dark first frame: AD-16 unchanged; the pre-paint script sets `data-theme` before first paint, only the static meta (and manifest `theme_color`, TH-3) stay `#15171B` until main.ts, a `#15171B` bar against a `#17121C` page; flagged for the owner gate.
- DESIGN.md Themes: untouched here until the 9.11 sweep.

## Acceptance Criteria

Verify at built: npm run test:all and npm run test:screens are green with the theme's baselines committed, the contrast test passes for it, the size budget holds, a Playwright android test switches to it and back, and the baseline diff is confined to the Preferences Theme group (Default baselines).

Owner checkpoint after built: he plays it on his Android install before it is marked done.

- Default baselines (TH-4): no board, tray, scene or sheet default shot changes except the existing Preferences baselines, which gain the 'Plum Dusk' row (sixth, last in the Theme group): e2e/preferences.screens.spec.ts `preferences-panel.png`, and `theme-scifi-preferences.png`, `theme-garden-preferences.png`, `theme-steampunk-preferences.png`, `theme-paper-preferences.png` (grepped e2e/*.screens.spec.ts: no other screens spec opens Preferences; the plan re-greps). The only permitted pixel change is that row and whatever a wrapped label shifts; if the sixth row changes the sheet height, the plan reports it as an owner-review item and the builder changes no layout or CSS for it; regenerated in the container; owner approval at review; every other snapshot is unchanged and the only new baselines are the four plum shots.
- Scan and budget: the TH-2 colour-literal scan stays green; the TH-8 size budget holds with the margin in the plan.
- Owner gate: the palette feel (whether "mild" reads at a glance), the dark first-frame tint, and the scene pointer's visibility on the plum table (pointer tokens keep the default's) are his to accept.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — research/brief.md section E (Plum Dusk; the entry 1 brief, direction Plum Dusk)
- design — DESIGN.md Themes
- architecture — ARCHITECTURE-SPINE.md AD-7, AD-10, AD-14, AD-16, AD-17
- rules — docs/game-flow-spec.md Q-45, §7.10
- siblings — story-theme-art-layer-table-background-and-card-texture.md (9.5), story-theme-daylight-paper.md (9.6), story-theme-deep-space.md (9.7), story-theme-greenhouse-dusk.md (9.8), story-theme-brass-and-walnut.md (9.9)
- code — src/main.ts, src/ui/app.css, src/ui/text.ts, src/ui/theme/registry.ts, registry.test.ts, contrast.test.ts, fixtures/prefs-theme-plum.json (new), e2e/theme.spec.ts, e2e/theme-garden.screens.spec.ts, e2e/theme-plum.screens.spec.ts (new), e2e/pwa/dist-smoke.spec.ts, e2e/pwa/build-output.spec.ts

## Notes

- Plum Dusk is in scope per the owner decision of 2026-10-18 (epic Notes: build all five directions). It is last in the Theme radio order, after Daylight Paper, per spec §7.10; the baseline changes are an owner approval at review.
