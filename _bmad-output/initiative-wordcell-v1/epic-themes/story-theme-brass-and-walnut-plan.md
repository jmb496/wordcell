---
title: 'Theme: Brass and Walnut'
type: 'feature'
ticket: 9
created: '2026-10-19'
status: done
baseline_revision: 'e4176e6f6f2a62a6f03c795f1de3daca8180ad5a'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-brass-and-walnut.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-greenhouse-dusk-plan.md'
  - '{project-root}/AGENTS.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The Brass and Walnut direction (id `steampunk`, wood-grain table, leather card face) from the 9.1 brief is unbuilt; `ThemeId` already holds `steampunk`.

**Approach:** Ship `steampunkTheme` (meta `#1D1510`, brief section C tokens, `color-scheme: dark`, both art layers) registered in every build fourth in Theme order (default, scifi, garden, steampunk, paper; spec §7.10). The story file Description, Acceptance Criteria and Notes are the full specification, followed verbatim; 9.8 (story-theme-greenhouse-dusk-plan.md, commit e16bd92) is the pattern.

## Boundaries & Constraints

**Always:** The 18 values copied exactly from research/brief.md section C; `[data-theme="steampunk"]` block in app.css after garden, before paper; `--wc-shadow-drag: rgb(0 0 0 / 0.35)`; pointer tokens as default's; scrim `#000000b3`. Art per the story's Art bullet (80x40 plank tile; leather dots as one `<path>` of two arc subpaths, not circles, so `checkTexture` passes); single-quoted attributes, explicit fill on every shape, `%23` for `#`, `viewBox`. Tests named by id; unregistered-id examples stay `plum`.

**Never:** Edit the spine, DESIGN.md, `index.html` meta, the manifest, `tickets.toml`, components or Scene.svelte. Change art or opacity if a worst-point row or the pixel check fails: leave the plan unbuilt (blocked), commit nothing, report the measured ratio. Add a fallback. Push. Touch `bga-wordcell`. Build rivets.

</intent-contract>

## Code Map

- `src/ui/theme/registry.ts` -- add `steampunkTheme` (id `steampunk`, label `text.themeBrassAndWalnut`, meta `#1D1510`) between garden and paper; header comment lists five.
- `src/ui/text.ts` (~l.217) -- add `themeBrassAndWalnut: 'Brass and Walnut'`.
- `src/main.ts` (import list, register block ~l.226) -- import and `register(steampunkTheme)` after garden; update comment.
- `src/ui/app.css` -- `[data-theme="steampunk"]` after garden, before paper.
- `src/ui/theme/contrast.test.ts` (~l.156) -- add `steampunkTheme` to the meta-equals-table list and import.
- `src/ui/theme/registry.test.ts` (~l.61) -- `steampunkTheme` shape test beside the garden one.
- `fixtures/prefs-theme-steampunk.json` (new) -- as prefs-theme-garden.json with `"theme":"steampunk"`.
- `e2e/theme.spec.ts` (~l.131, ~l.185) -- radios Charcoal, Deep Space, Greenhouse Dusk, Brass and Walnut (`.nth(3)`), Daylight Paper (`.nth(4)`), count 5; Switch test for steampunk beside garden's.
- `e2e/theme-art.spec.ts` (~l.12) -- `ARTS` gains steampunk.
- `e2e/pwa/dist-smoke.spec.ts` (~l.58) -- count 5, rename, pick Brass and Walnut: `data-theme` `steampunk`, meta `#1D1510`.
- `e2e/pwa/build-output.spec.ts` (~l.141) -- retarget/rename (keep `AD-14 TH-9`): steampunk selector and `%23b08d57` present; only `plum` absent.
- `e2e/theme-steampunk.screens.spec.ts` (new) -- clone of theme-garden.screens.spec.ts (names `theme-steampunk-<shot>.png`, radio 'Brass and Walnut', `dataset.theme` `steampunk`); baselines via `npm run test:screens`.
- Preferences baselines (`preferences-panel`, `theme-scifi-preferences`, `theme-garden-preferences`, `theme-paper-preferences`) -- regenerate only if they differ; re-grep `e2e/*.screens.spec.ts`.
- Read-only: `index.html`, `vite.config.ts`, `e2e/globals.d.ts`, `prefs.svelte.ts`, `tickets.toml`, brief section C.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/theme/registry.ts`, `src/main.ts`, `src/ui/theme/registry.test.ts` -- `steampunkTheme` in every build, fourth -- TH-3, AD-10
- [x] `src/ui/app.css` -- steampunk block with tokens and art -- TH-2, TH-5, TH-9
- [x] `src/ui/theme/contrast.test.ts` -- steampunk under test, meta equals table -- AD-14
- [x] `fixtures/prefs-theme-steampunk.json`, `e2e/theme.spec.ts`, `e2e/theme-art.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/pwa/build-output.spec.ts` -- per the Code Map -- Q-45, AD-10, AD-14, AD-16
- [x] `e2e/theme-steampunk.screens.spec.ts` and baselines; regenerate changed Preferences baselines -- TH-4, AD-17
- [x] Record in Implementation Notes: internal tokens, size-budget margin (TH-8), measured pixel ratio, owner-gate items.

**Acceptance Criteria:**
- Given the production list, when Preferences opens, then Charcoal, Deep Space, Greenhouse Dusk, Brass and Walnut, Daylight Paper are offered in order and choosing Brass and Walnut sets `data-theme` `steampunk`, `color-scheme: dark`, meta `#1D1510`, both art tokens not `none`; back to Charcoal gives `default`, `#15171B`, `none`; reload keeps it.
- Given steampunk, when contrast.test.ts and the pixel check run, then every TABLE row passes at its floor and card ink is at least 4.5 over the texture.
- Given `npm run test:all` and `npm run test:screens`, when they run, then both pass with four new steampunk baselines, and the only changed existing baselines are Preferences Theme-group ones.

## Implementation Notes

- Built as specified; no art or opacity change. contrast.test.ts (all TABLE rows incl. worst-point rows and checkTexture) and the e2e pixel check (theme-art.spec.ts) pass for steampunk. The pixel ratio was asserted against the 4.5 floor, not printed; the measured figure was not recorded.
- Internal tokens: none added; the 18 brief section C values plus default pointer tokens, `--wc-shadow-drag: rgb(0 0 0 / 0.35)`.
- Size budget (TH-8): total 551863 / 600000 bytes gzip (margin 48137).
- Baselines: four new theme-steampunk shots; changed existing only preferences-panel, theme-scifi/garden/paper-preferences.
- Owner-gate items: dark first-frame tint (#15171B bar vs #1D1510 page), wood-grain and leather look, card-edge reach over the grain (3.9:1), scene pointer visibility on walnut.

## Plan Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 18 findings — high 0, medium 0, low 3, false 15, maybe-false 0
- findings:
  - `[low]` `[reject]` Measured pixel ratio not recorded (blind, edge, intent-alignment) — test asserts >= 4.5 and passes; ratio is required only on failure.
  - `[false]` `[reject]` Dark first-frame tint unverified (blind) — owner-gate item; AD-16 unchanged.
  - `[false]` `[reject]` Reload not covered in production (blind, verification-gap) — theme.spec covers reload; dist-smoke scope is prescribed by the ticket.
  - `[false]` `[reject]` No fixture-seeded boot test (blind) — the ticket prescribes the Switch test and the art/screens use of the fixture.
  - `[low]` `[patch]` Stale build-output comment "both blocks" (blind) — reworded to name garden, scifi and steampunk.
  - `[low]` `[reject]` theme.spec header fixtures list, ARTS order (blind, edge) — cosmetic, no harm.
  - `[false]` `[reject]` Plan metadata unticked/logs empty (blind, edge, intent-alignment) — filled at finalize.
  - `[false]` `[reject]` Contrast margin under-documented (blind) — the ticket makes 3.9 an owner-gate item; TABLE rows pass.
  - `[false]` `[reject]` No assertion on the 18 values (blind) — ticket prescribes copying; contrast and key-set tests cover the rest.
  - `[false]` `[reject]` Preferences shot may clip five radios (edge) — baseline is reviewed by the owner; screens run passed.
  - `[false]` `[reject]` Switch test does not check art content (edge) — ticket asks for not `none`.
  - `[false]` `[reject]` verification-gap: no gaps found.
  - `[false]` `[reject]` intent-alignment (readings A-D, divergences) — descriptive; owner-play gate and scene coverage are as the ticket specifies (one scene shot).

## Design Notes

Art: table tile 80x40, `<path d='M0 6H80M0 13H55M0 22H80M0 29H40M0 35H70' fill='none' stroke='%23b08d57' stroke-opacity='0.07'/>` plus `<path d='M0 39.5H80' fill='none' stroke='%23000' stroke-opacity='0.25'/>`. Card tile 8x8: one path `M1.2 2a.8 .8 0 1 0 1.6 0a.8 .8 0 1 0 -1.6 0M5.2 6a.8 .8 0 1 0 1.6 0a.8 .8 0 1 0 -1.6 0`, `fill='%23b08d57' fill-opacity='0.04'`.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` -- expected: exit 0; `git status` shows four new steampunk baselines plus only Preferences baselines changed

## Auto Run Result

**Summary:** Brass and Walnut (`steampunkTheme`, id `steampunk`, meta `#1D1510`) is registered in every build, fourth in the Theme order, with the 18 brief C tokens, `color-scheme: dark`, the wood-plank table tile and leather card tile. Art and opacity unchanged.

**Files changed:** `src/ui/app.css`, `text.ts`, `main.ts`, `src/ui/theme/{registry,registry.test,contrast.test}.ts`, `fixtures/prefs-theme-steampunk.json`, `e2e/{theme,theme-art}.spec.ts`, `e2e/pwa/{dist-smoke,build-output}.spec.ts`, new `e2e/theme-steampunk.screens.spec.ts` with four baselines, regenerated four Preferences baselines.

**Review:** patches 1 (comment); deferred 0; 17 rejected with reasons in the Review Triage Log.

**Follow-up review recommended:** false.

**Verification:** `npm run test:all` and `npm run test:screens` exit 0 (subagent run); lint and unit re-run after review by the orchestrator; size budget 551863 of 600000 bytes.

**Residual risks / owner input:** play on Android; first-frame tint, wood-grain and leather look, card-edge reach 3.9:1, pointer visibility on walnut; approve the four regenerated Preferences baselines.
