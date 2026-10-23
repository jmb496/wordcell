---
id: 9
type: story
title: "Theme: Brass and Walnut"
parent: epic-themes
covers: [TH-5, TH-6, TH-9, TH-8]
after: [5, 8]
risk: medium
hitl: false
---

# Theme: Brass and Walnut

## Description

Builds the Brass and Walnut theme (id `steampunk`) from the 9.1 brief and DESIGN.md Themes: its token set in src/ui/app.css, using the art layer for the wood-grain table and leather card face, selectable in Preferences, covering all surfaces, states and the How to play scenes, with its contrast test (worst-point and pixel-sampled over the texture) and a screenshot baseline set (board, tray, a sheet, a scene) generated in the Playwright container.

Entry 9 fields: `risk: medium`, `done_checkpoint: true`, `hitl: false` (the build runs unattended).

- Registry: export production `steampunkTheme` (src/ui/theme/registry.ts; id `steampunk`, label `text.themeBrassAndWalnut` = 'Brass and Walnut' in src/ui/text.ts, meta `#1D1510` = its `--wc-table`), registered by main.ts (line ~226-230 block, plus its import list and the registry.ts header comment) in every build in the order `default`, `scifi`, `garden`, `steampunk`, `paper` (spec §7.10). `ThemeId` (prefs.svelte.ts, e2e/globals.d.ts) already holds `steampunk`; no other main.ts or start() change is expected (the plan confirms). contrast.test.ts's meta-equals-table list (line ~156) gains `steampunkTheme`; registry.test.ts gains a `steampunkTheme` shape test beside the `gardenTheme` one (line ~61).
- Tokens: the 18 values are copied exactly from research/brief.md section C (cite, do not restate) into an app.css `[data-theme="steampunk"]` block after garden, before paper, with `color-scheme: dark` and the scrim `#000000b3`. `--wc-scene-pointer-fill`, `-stroke`, `-shadow` keep the default's; `--wc-shadow-drag` is the slash-alpha form as 9.6-9.8. `--wc-accent-teal` (`#5cc8bd`, verdigris) and the orange keep their meanings.
- Art: from brief §C and research/tools/themes.mjs, converted to the 9.5 data-URI grammar (src/ui/theme/art.ts: rect, circle or path only, explicit fill on every shape, `%23` for `#`, `viewBox`, `<g>` attributes moved onto each path, `fill="none"` on paths). `--wc-table-art`: an 80x40 plank tile, one grain path `M0 6H80M0 13H55M0 22H80M0 29H40M0 35H70` (stroke `%23b08d57`, opacity .07) and a seam path `M0 39.5H80` (stroke `%23000`, opacity .25); two colours, parsed OK by `parseArt` (verified). `--wc-card-texture`: an 8 px leather-pebble tile, two dots r .8 at (2,2) and (6,6), `%23b08d57` at .04. The code values win over themes.mjs's stale '6 %' comment and 'rivet rows' pitch; no rivets are built. Two `<circle>` shapes fail: `checkTexture` (TH-9, contrast.test.ts line ~101) sums opacity per colour (.08 > .06) although the dots never overlap, so the dots are one `<path>` of two arc subpaths (`M1.2 2a.8 .8 0 1 0 1.6 0a.8 .8 0 1 0 -1.6 0M5.2 6a.8 .8 0 1 0 1.6 0a.8 .8 0 1 0 -1.6 0`, `fill='%23b08d57'`, `fill-opacity='0.04'`), which parses and passes `checkTexture` (verified; same pixels, opacity unchanged). The brief's 3.93 and 5.31 figures assume .04, so the conversion, not the brief, is what differs.
- Contrast, Vitest (contrast.test.ts, `AD-14` names): `steampunk` is in the themes under test and passes every TABLE row at its floor (9.5 Notes option A; the brief's figures are informational), including both worst-point rows over the art layers; the card edge over the table art (3.93 against the 3.6 floor) is the thin one. e2e/theme-art.spec.ts `ARTS` (line ~12) gains `{ id: 'steampunk', prefs: 'prefs-theme-steampunk', radio: 'Brass and Walnut' }`, so the pixel check (live card, QU card, tray tile, destination card, ink at least 4.5), the P6 layout-equality test and the `.ghost`/`.used` computed-style tests run for it. If a row or the pixel check fails, the builder does not change the art or opacity: the plan is left unbuilt (blocked), nothing is committed, and the run stops with the measured ratio for the owner.
- Switch, Playwright android (e2e/theme.spec.ts, `Q-45`/`AD-10`/`AD-16`, beside the Greenhouse Dusk test at line ~185): pick the 'Brass and Walnut' radio; root `data-theme` is `steampunk`, computed `color-scheme` is `dark`, the meta is `#1D1510`, and both art tokens are not `none`; switching back to Charcoal gives the default values, `#15171B` and `none` for both; a reload keeps it. New fixture fixtures/prefs-theme-steampunk.json, the shape of prefs-theme-garden.json with `"theme":"steampunk"`.
- Radio order: theme.spec.ts (lines ~131-135) and the e2e/pwa/dist-smoke.spec.ts Theme-group test (line ~58, lines ~73-77) go from count 4 to 5: Charcoal, Deep Space, Greenhouse Dusk, Brass and Walnut (`.nth(3)`), Daylight Paper (`.nth(4)`). The dist-smoke test is renamed to match and picks Brass and Walnut hook-free, asserting root `data-theme` `steampunk` and meta `#1D1510`.
- Screenshots, new e2e/theme-steampunk.screens.spec.ts (android only, `AD-17` names, baselines generated in the container via `npm run test:screens`), seeded through `seedStorage` with `prefs-theme-steampunk`: the same four frames as e2e/theme-garden.screens.spec.ts (board, tray, Preferences sheet at 360 px with the radio asserted checked first, How to play scene 2 via `openScene`). The 'Brass and Walnut' label shows intact at 360 px; the scene shows textured cards on a flat table.
- Build output (e2e/pwa/build-output.spec.ts, test at line ~141, "steampunk and plum are absent ... " now false): retargeted and renamed (keeping `AD-14 TH-9`): the garden, scifi and steampunk selectors and arts (`%238fdc9e`, `%2335d0ff`, `%23b08d57`, the last unique to steampunk in src and e2e today) are present in both dist and dist-test; only the `plum` selector is absent (each later theme ticket edits this list).
- Budget (TH-8): scripts/size-budget.mjs green in `npm run build`; the plan records the margin (the brief estimates ~577 B gzip).
- Surfaces: no component or Scene.svelte change is expected (TH-2 scan and key-set check green); `.ghost` and `.used` take no texture and the Scene shows a flat table (9.5).
- Hue alone (TH-5): as 9.7/9.8, the theme adds no state, so the default's non-hue cues carry over, bounded to the states the shots show (destination block and lock in tray and scene 2, pressed Validate in scene 2; no shot shows the R-38 invalid line or the tap-selected state). Per the owner decision of 2026-10-18 (epic Notes), the verdigris act accent relaxes the "no green success" wording as for garden: it marks act and selection only.
- Dark first frame: as 9.8: AD-16 unchanged, the pre-paint script sets `data-theme` before first paint, only the static meta (and manifest `theme_color`, TH-3) stay `#15171B` until main.ts, a `#15171B` bar against a `#1D1510` page; flagged for the owner gate.
- DESIGN.md Themes: untouched here until the 9.11 sweep.

## Acceptance Criteria

Verify at built: npm run test:all and npm run test:screens are green with the theme's baselines committed, the contrast test passes for it, the size budget holds, a Playwright android test switches to it and back, and the baseline diff is confined to the Preferences Theme group (Default baselines). Owner checkpoint after built: he plays it on his Android install before it is marked done.

- Default baselines (TH-4): no board, tray, scene or sheet default shot changes except the existing Preferences baselines, which gain the 'Brass and Walnut' row (fourth, Daylight Paper last) in the Theme group: e2e/preferences.screens.spec.ts `preferences-panel.png`, and `theme-scifi-preferences.png`, `theme-garden-preferences.png`, `theme-paper-preferences.png` (re-grepped e2e/*.screens.spec.ts: no other screens spec opens Preferences; the plan re-greps). The only permitted pixel change is that row and whatever a wrapped label shifts; regenerated in the container; owner approval at review; every other snapshot is unchanged and the only new baselines are the four steampunk shots.
- Scan and budget: the TH-2 colour-literal scan stays green; the TH-8 size budget holds with the margin in the plan.
- Owner gate: the owner plays the theme on his Android install before it is marked done; the dark first-frame tint, the wood-grain and leather look, the card-edge reach over the grain (3.9:1) and the scene pointer's visibility on the walnut table (pointer tokens keep the default's) are his to accept.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — research/brief.md section C (Brass and Walnut) and research/tools/themes.mjs (the entry 1 brief, direction Brass and Walnut)
- design — DESIGN.md Themes
- architecture — ARCHITECTURE-SPINE.md AD-7, AD-10, AD-14, AD-16, AD-17
- rules — docs/game-flow-spec.md Q-45, §7.10
- siblings — story-theme-art-layer-table-background-and-card-texture.md (9.5), story-theme-daylight-paper.md (9.6), story-theme-deep-space.md (9.7), story-theme-greenhouse-dusk.md (9.8)
- code — src/main.ts, src/ui/app.css, src/ui/text.ts, src/ui/theme/registry.ts, art.ts, registry.test.ts, contrast.test.ts, fixtures/prefs-theme-steampunk.json (new), e2e/theme.spec.ts, e2e/theme-art.spec.ts, e2e/theme-garden.screens.spec.ts, e2e/theme-steampunk.screens.spec.ts (new), e2e/pwa/dist-smoke.spec.ts, e2e/pwa/build-output.spec.ts

## Notes

- The wood-grain table and leather texture are in scope per the owner decision of 2026-10-18 (epic Notes: build all five directions with the art as mocked up). Dropping the texture or lowering its opacity is an owner call.
- Brass and Walnut is fourth in the Theme radio order, between Greenhouse Dusk and Daylight Paper, per spec §7.10; the baseline changes are an owner approval at review.
- Post-close (Opus review, owner decisions D1–D6, 2026-10-22, `5210279`, `a88cf67`, `45f6a13`; see the epic Notes): D3 this theme's `--wc-shadow-drag` is DESIGN.md's `#0008` like Charcoal.
