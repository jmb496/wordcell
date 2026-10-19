---
id: 6
type: story
title: "Theme: Daylight Paper"
parent: epic-themes
covers: [TH-2, TH-3, TH-4, TH-5, TH-6, TH-8]
after: [3, 4, 5]
risk: low
---

# Theme: Daylight Paper

## Description

Builds the Daylight Paper theme (id `paper`, the only light theme, `color-scheme: light`, no art) as the first alternate and the proof of the theme mechanism: a token set selectable in Preferences, covering all surfaces, states and the How to play scenes, with its contrast test and a screenshot baseline set (board, tray, a sheet, a scene) generated in the Playwright container.

- Registry: the test-only `testPaper` (id `paper`, placeholder meta `#F4EFE4`, src/ui/theme/registry.ts) is replaced by a production `paper` entry (label `text.themePaper`, meta `#ECE6D8`) that main.ts registers beside `defaultTheme` in every build. Its test-hook registration (`register(testPaper)` and the import, src/main.ts `start()`) is removed, since `register` throws on a duplicate id; `testGarden` stays. Follow-ons: registry.test.ts imports the production entry instead of `testPaper`; e2e/theme.spec.ts `PAPER` becomes `#ECE6D8` and its radio count stays 3 (Charcoal, Daylight Paper, the test-only garden); e2e/globals.d.ts (`ThemeId` already lists `paper`) and the `prefs-theme-paper` fixture are unchanged; the e2e/pwa/dist-smoke.spec.ts Theme-group test (now "Charcoal only", count 1) lists Charcoal and Daylight Paper with no hook.
- Tokens: the 18 values are copied exactly from research/brief.md section D (cite, do not restate) into a `[data-theme="paper"]` block in src/ui/app.css after the default block, so `themeRecords` and the TH-2 colour-literal scan read it as a theme block. The block also sets `color-scheme: light`; app.css's `:root { color-scheme: dark }` stays, so the default's computed value stays dark and the paper block, equal in specificity and later in source, overrides it. `--wc-scrim` stays dark. The four internal tokens get explicit values (the key-set check requires the full set): `--wc-scene-pointer-fill`, `-stroke` and `-shadow` keep the default's values (the dark pointer stroke reads on light paper), and `--wc-shadow-drag` becomes a lighter translucent black (plan picks the value). The harness checks these four only for resolvability and alpha below 1 (scrim, shadow-drag, pointer-shadow) or opaque (pointer fill, stroke), and the plan confirms that. `--wc-table-art` and `--wc-card-texture` are `none`. No component or Scene.svelte change is expected (TH-2 scan stays green); the plan lists any that proves needed.
- Meta: the registry comment says each entry's meta equals its `--wc-table`; a registry or contrast unit test asserts that for every registered entry (paper `#ECE6D8`). The manifest `theme_color` and index.html's static meta stay `#15171B` (TH-3).
- DESIGN.md Themes: untouched here; brief section D stays the source of the paper values until the 9.11 sweep (DESIGN.md Themes says so; 9.11 is the sweep entry in tickets.toml).
- Budget (TH-8): scripts/size-budget.mjs green in `npm run build`; the plan records the margin (the brief estimates ~254 B gzip).
- Dark first frame: not asserted away; a cold start may paint one Charcoal frame before the light theme applies (AD-16 boot order, unchanged).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the new theme's baselines committed, the contrast test passes for it, and a Playwright android test switches to it and back; no default-theme baseline changes except the Preferences panel one.

- Contrast, Vitest (contrast.test.ts, `AD-14` names as siblings): `paper` is in the themes under test and passes every TABLE row at the TABLE floor columns (owner option A, 9.5 story Notes), including card-ink on destination-fill; the default's pinned DESIGN.md figures stay default-only, none pinned for paper. The key-set check passes with the full set.
- Registry, Vitest (registry.test.ts, `AD-10`/`AD-16`): `paper` registers in the production list, applies `data-theme` and its meta, and every registered entry's meta equals its `--wc-table`.
- Switch, Playwright android (retargeted e2e/theme.spec.ts, `Q-45`/`AD-10`/`AD-16`): pick the Daylight Paper radio; root `data-theme` is `paper`, computed `color-scheme` is `light`, the meta is `#ECE6D8`, and `--wc-scrim` still resolves dark; switching back restores `default`, the `#15171B` meta and the default colours; a reload keeps paper. The test does not assert a dark-free first frame.
- Hue alone (TH-5): the theme adds no state, so the default's non-hue cues carry over; the screenshots show the selected, destination and error states.
- Screenshots, new e2e/theme-paper.screens.spec.ts (android only, `AD-17` names, baselines generated in the container via `npm run test:screens`), seeded through `seedStorage` with the `prefs-theme-paper` fixture and a fixed session fixture: board (`session-place-free-letter-redo-tail`), tray (`session-composing`), the Preferences sheet at 360 px (`session-idle-fresh`), and How to play scene 2, free-letter final frame (the BALKED error state; reached as in e2e/how-to-play.screens.spec.ts). The plan confirms each fixture shows the state it is chosen for.
- Default baselines (TH-4): the Theme group in the Preferences panel is built from `entries()`, so the production radio changes the existing `preferences-panel.png` baseline (e2e/preferences.screens.spec.ts); its diff is the added Daylight Paper radio, regenerated in the container. Every other default baseline file is untouched (`git diff` over the snapshot folders).
- Scan and budget: the TH-2 colour-literal scan stays green; the TH-8 size budget holds with the margin in the plan.
- Owner gate: the owner plays the theme on his Android install before the ticket is marked done.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- design — _bmad-output/initiative-wordcell-v1/epic-themes/research/brief.md section D (Daylight Paper) and research/tools/themes.mjs
- design — DESIGN.md Themes
- architecture — ARCHITECTURE-SPINE.md AD-7, AD-10, AD-16, AD-17
- rules — docs/game-flow-spec.md Q-45
- siblings — story-token-plumbing-and-contrast-harness.md (9.3), story-theme-preference-and-pre-paint-apply.md (9.4), story-theme-art-layer-table-background-and-card-texture.md (9.5, Notes: contrast floors)
- code — src/ui/theme/registry.ts, src/ui/app.css, src/main.ts, src/ui/theme/contrast.test.ts, e2e/theme.spec.ts, e2e/pwa/dist-smoke.spec.ts
