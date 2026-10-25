---
id: 7
type: story
title: "Theme: Deep Space"
parent: epic-themes
covers: [TH-5, TH-6, TH-9, TH-8]
after: [5, 6]
risk: medium
hitl: false
---

# Theme: Deep Space

## Description

Builds the Deep Space theme (id `scifi`) from the 9.1 brief and DESIGN.md Themes: its token set in src/ui/app.css, using the art layer of entry 5 for the 48 px grid table and scan-line card face, selectable in Preferences, covering all surfaces, states and the How to play scenes, with its contrast test (worst-point and pixel-sampled over the texture) and a screenshot baseline set (board, tray, a sheet, a scene) generated in the Playwright container.

- Registry: the production export `scifiTheme` (src/ui/theme/registry.ts; id `scifi`, label `text.themeDeepSpace` added to src/ui/text.ts, meta `#0A0F1C` = its `--wc-table`) is registered by main.ts in every build, after `register(paperTheme)` and before `start()`'s hook block. The Theme radio order follows registration order; the order assertions in theme.spec.ts and dist-smoke, and the registration position, follow whatever the review-log decision records (not resolved here; proposed default spec §7.10 order). Follow-ons: registry.test.ts's unregistered-id test (line ~65) uses `applyTheme('scifi')`, so it and its expected message string switch to the unregistered id `plum` (to change when `plum` is registered); e2e/theme.spec.ts radio count 3 becomes 4 (Charcoal, Daylight Paper, Deep Space, the test-only garden; order per that decision), and its AD-7-valid-but-unregistered Halted test (line ~217, `theme: 'scifi'`) switches to `plum` likewise; the e2e/pwa/dist-smoke.spec.ts Theme-group test is renamed to offer Charcoal, Daylight Paper and Deep Space, asserts the count and order, and picks Deep Space hook-free, asserting root `data-theme` `scifi` and meta `#0A0F1C`; contrast.test.ts's meta-equals-table test adds `scifiTheme`; a new `prefs-theme-scifi` fixture (prefs-theme-paper's content with theme `scifi`), needed only by the fixture-registry test (e2e/helpers.spec.ts ~1249) and the screenshot spec while theme.spec.ts keeps using paper; e2e/globals.d.ts `ThemeId` already lists `scifi`, unchanged).
- Tokens: the 18 values are copied exactly from research/brief.md section A (cite, do not restate) into a `[data-theme="scifi"]` block in src/ui/app.css after the default block and the `:root { color-scheme: dark }` rule (as 9.6 Tokens), with `color-scheme: dark` and the scrim `#000000b3` as the brief gives it. The four internal tokens get explicit values: `--wc-scene-pointer-fill`, `-stroke` and `-shadow` keep the default's, and `--wc-shadow-drag` is the slash-alpha form as in 9.6 (`rgb(0 0 0 / 0.35)`, look under the owner gate).
- Art: `--wc-table-art` (48 px grid, 7 %) and `--wc-card-texture` (4 px scan-line, 6 %, the 9.5 cap) are authored to the 9.5 data-URI grammar (rect, circle or path only, explicit fill on every shape, `fill="none"` allowed, `%23` for `#`) from research/tools/themes.mjs and set in the same app.css block; the 9.5 grammar test must pass. Pinned: 7 % for the grid, since brief §A and the themes.mjs `stroke-opacity=".07"` agree and only its comment says 5 %. If the pixel check fails at 6 %, the builder does not change the art: the plan is left unbuilt (blocked), the theme is not committed, and the run stops with the measured ratio for the owner (the brief's analytic worst-point is the expected pass); lowering opacity or dropping the scan-line goes to the owner.
- Meta: contrast.test.ts's meta-equals-table assertion covers `scifiTheme` (`#0A0F1C` vs app.css `--wc-table`). The manifest `theme_color` and index.html's static meta stay `#15171B` (TH-3).
- Surfaces: no component or Scene.svelte change is expected (TH-2 scan and key-set check green); `.ghost` and `.used` take no texture and the Scene shows a flat table (9.5); the plan lists any change that proves needed.
- Budget (TH-8): scripts/size-budget.mjs green in `npm run build`; the plan records the margin (the brief estimates ~524 B gzip).
- Dark first frame: not asserted away; AD-16 is unchanged, index.html's pre-paint script sets `data-theme` before first paint so the page background is already scifi, and only the static `theme-color` meta (`#15171B`) waits for main.ts, a `#15171B` status bar against a `#0A0F1C` page until then. The 9.6 owner decision on this tint covers paper only, so it is flagged for the owner gate.
- DESIGN.md Themes: untouched here until the 9.11 sweep.
- Owner marks done (done checkpoint) only after playing the theme on his Android install; hitl is false (the build runs unattended).

## Acceptance Criteria

Verify at built: npm run test:all and npm run test:screens are green with the theme's baselines committed, the contrast test passes, the size budget holds, a Playwright android test switches to it and back, and the baseline diff is confined to the Preferences-panel Theme group and whatever it displaces (Default baselines). Owner checkpoint after built: he plays it on Android before it is marked done.

- Contrast, Vitest (contrast.test.ts, `AD-14` names): `scifi` is in the themes under test and passes every TABLE row at its floor (9.5 Notes option A; DESIGN.md figures stay default-only, the brief's figures are informational), including card-ink on destination-fill and the worst-point rows over both art layers. The pixel check (e2e/theme-art.spec.ts: live card, QU card, tray tile, block or destination card, ink at least 4.5), the P6 layout-equality test and the `.ghost`/`.used` computed-style tests there are extended to scifi.
- Registry, Vitest (registry.test.ts, `AD-10`/`AD-16`): registry.test.ts covers `scifiTheme` shape (id, label from text.ts, meta `#0A0F1C`) and apply; production-list membership and order are covered by the dist-smoke Theme-group test.
- Switch, Playwright android (e2e/theme.spec.ts, `Q-45`/`AD-10`/`AD-16`): pick the Deep Space radio; root `data-theme` is `scifi`, computed `color-scheme` is `dark`, the meta is `#0A0F1C`, and `--wc-table-art` and `--wc-card-texture` are not `none`; switching back to Charcoal gives root `data-theme` `default` (as theme.spec.ts ~148), meta `#15171B`, the default values, and `none` for both art tokens; a reload keeps scifi.
- Build output (e2e/pwa/build-output.spec.ts, test at line ~141, "the test-only garden stylesheet (selector and art URI) is in dist-test and absent from dist"): retargeted and renamed (keeping `AD-14 TH-9`) so it discriminates: the garden selector and a garden-only art substring (`%233b6b4f`, from src/ui/theme/garden.css) are absent from dist and present in dist-test; the scifi selector and its art (colour `%2335d0ff`, themes.mjs) are present in both.
- Hue alone (TH-5): the theme adds no state, so the default's non-hue cues carry over; the shots show the destination block and lock (tray, scene 2) and the pressed Validate (scene 2), and none shows the R-38 invalid line (`--wc-error`) or the tap-selected state, so the claim stops there; error contrast is the `error`/`surface` TABLE row, the rest the owner gate. The plan changes a shot's fixture or frame if it does not show the claimed state.
- Screenshots, new e2e/theme-scifi.screens.spec.ts (android only, `AD-17` names, baselines generated in the container via `npm run test:screens`), seeded through `seedStorage` with the new `prefs-theme-scifi` fixture: the same four fixtures and frames as e2e/theme-paper.screens.spec.ts (board, tray, Preferences sheet at 360 px, How to play scene 2), each asserting the Deep Space radio is checked before the preferences shot (as theme-paper.screens.spec.ts line 34), reusing its `openScene` helper (e2e/helpers/how-to-play). The shots show textured cards on a flat table in the scene; the plan confirms each fixture shows its state.
- Default baselines (TH-4): no board, tray, scene or sheet default shot changes, except that production `scifi` adds a Theme radio, so the Theme group changes in the Preferences-panel shots: e2e/preferences.screens.spec.ts `preferences-panel.png` and the existing paper baseline e2e/theme-paper.screens.spec.ts `theme-paper-preferences.png` (a paper shot, not a default one); the only permitted pixel change is the added radio row and whatever it pushes down or scrolls; the plan re-greps e2e/*.screens.spec.ts for others. Those are regenerated in the container; every other existing snapshot is unchanged, and the only new baselines are the four scifi shots.
- Scan and budget: the TH-2 colour-literal scan stays green; the TH-8 size budget holds with the margin in the plan.
- Owner gate: the owner plays the theme on his Android install before the ticket is marked done; the dark first-frame tint (Dark first frame), the scan-line look, and the scene pointer's visibility on the navy table (pointer tokens keep the default's, as 9.6 for paper) are his to accept.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — research/brief.md section A (Deep Space) and research/tools/themes.mjs (the entry 1 brief, direction Deep Space)
- design — DESIGN.md Themes
- architecture — ARCHITECTURE-SPINE.md AD-7, AD-10, AD-14, AD-16, AD-17
- rules — docs/game-flow-spec.md Q-45
- siblings — story-theme-art-layer-table-background-and-card-texture.md (9.5), story-theme-daylight-paper.md (9.6)
- code — src/ui/theme/registry.ts, src/ui/theme/registry.test.ts, src/ui/theme/contrast.test.ts, src/ui/app.css, src/ui/text.ts, src/main.ts, e2e/theme.spec.ts, e2e/theme-art.spec.ts, e2e/pwa/dist-smoke.spec.ts, e2e/pwa/build-output.spec.ts

## Notes

- The grid and the scan-line texture are in scope per the owner decision of 2026-10-18 (epic Notes: build all five directions with the art as mocked up). Dropping the scan-line, or lowering its opacity after a failed pixel check, is an owner call, not a builder choice.
- Owner decision (2026-10-19): Deep Space is second in the Theme radio order, right after Charcoal, per spec §7.10 and DESIGN.md. Register it before Daylight Paper; the Daylight Paper Preferences screenshot baseline and the radio-order checks in theme.spec.ts and dist-smoke follow (the baseline change is an owner approval at review).
- Post-close (Opus review, owner decisions D1–D6, 2026-10-22, `5210279`, `a88cf67`, `45f6a13`; see the epic Notes): D3 this theme's `--wc-shadow-drag` is DESIGN.md's `#0008` like Charcoal.
