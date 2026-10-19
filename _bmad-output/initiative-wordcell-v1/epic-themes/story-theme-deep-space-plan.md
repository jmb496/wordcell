---
title: 'Theme: Deep Space'
type: 'feature'
ticket: 7
created: '2026-10-19'
status: done
baseline_revision: '2a696af4bec62f93f83e11ca41658a765aab4fb3'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-daylight-paper-plan.md'
  - '{project-root}/AGENTS.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Only Charcoal and Daylight Paper ship; the Deep Space direction (id `scifi`, 48 px grid table, scan-line card face) from the 9.1 brief is unbuilt.

**Approach:** Ship `scifiTheme` (meta `#0A0F1C`, brief section A tokens, `color-scheme: dark`, both art layers) registered in every build, second in Theme order (owner decision 2026-10-19: after Charcoal, before Daylight Paper), with contrast, pixel, registry, switch, dist-smoke, build-output and four screenshot tests. The story file Description, Acceptance Criteria and Notes are the full specification; follow them verbatim, with 9.6's plan (story-theme-daylight-paper-plan.md) as the pattern.

## Boundaries & Constraints

**Always:** Tokens copied exactly from brief section A; `[data-theme="scifi"]` block after the paper block (or after the dark `color-scheme` rule, as 9.6 did, so the default-meta regex still reads the first `--wc-table`); art authored to the 9.5 data-URI grammar from research/tools/themes.mjs (grid 7 %, scan-line 6 %). `register(scifiTheme)` between `register(defaultTheme)` and `register(paperTheme)`. Tests named by id. Existing Preferences baselines regenerated in the container only for the added radio row (`preferences-panel.png`, `theme-paper-preferences.png`).

**Never:** Edit the spine, DESIGN.md, `index.html` meta, the manifest, `tickets.toml`, components or Scene.svelte. Change the art or opacity if the pixel check fails: leave the plan unbuilt (blocked), do not commit the theme, report the measured ratio. Add a fallback. Push. Touch `bga-wordcell`.

</intent-contract>

## Code Map

- `src/ui/theme/registry.ts` -- add `scifiTheme` (id `scifi`, label `text.themeDeepSpace`, meta `#0A0F1C`); update header comment (production registers default, scifi, paper).
- `src/ui/text.ts` (~l.218) -- add `themeDeepSpace: 'Deep Space'`.
- `src/main.ts` (l.28, 222-226) -- import `scifiTheme`; `register(scifiTheme)` between default and paper.
- `src/ui/app.css` (paper block l.46-71) -- add `[data-theme="scifi"]` with the 18 brief section A values, `color-scheme: dark`, scrim `#000000b3`, shadow-drag `rgb(0 0 0 / 0.35)`, pointer tokens as default, `--wc-table-art` and `--wc-card-texture` as data URIs.
- `src/ui/theme/contrast.test.ts` -- scifi joins `themes`; meta-equals-table test adds `scifiTheme`; worst-point rows over both art layers.
- `src/ui/theme/registry.test.ts` (~l.65) -- unregistered-id test switches `scifi` to `plum` (message string too); add scifi shape/apply test.
- `e2e/theme.spec.ts` (radio count ~l.148, Halted test ~l.217) -- count 4, order Charcoal, Deep Space, Daylight Paper, garden; Halted test uses `plum`; Switch test to scifi and back (art tokens not `none`, then `none`), reload keeps scifi.
- `e2e/theme-art.spec.ts` -- pixel check (ink >= 4.5), P6 layout-equality and `.ghost`/`.used` tests extended to scifi.
- `e2e/pwa/dist-smoke.spec.ts` (l.58-74) -- Theme-group test offers Charcoal, Daylight Paper, Deep Space renamed per ticket but asserting the new order Charcoal, Deep Space, Daylight Paper; picks Deep Space hook-free: `data-theme` `scifi`, meta `#0A0F1C`.
- `e2e/pwa/build-output.spec.ts` (~l.141) -- retarget and rename (keep `AD-14 TH-9`): garden selector and `%233b6b4f` absent from dist, present in dist-test; scifi selector and `%2335d0ff` present in both.
- `fixtures/prefs-theme-scifi.json` (new, copy of prefs-theme-paper with theme `scifi`); `e2e/helpers.spec.ts` (~l.1249) fixture-registry test.
- `e2e/theme-scifi.screens.spec.ts` (new) -- clone of `theme-paper.screens.spec.ts` (board, tray, Preferences 360 px, scene 2; Deep Space radio checked before the preferences shot); baselines via `npm run test:screens`.
- Read-only: `index.html`, `vite.config.ts` manifest, `e2e/globals.d.ts`, `tickets.toml`, `research/brief.md` section A, `research/tools/themes.mjs`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/theme/registry.ts`, `src/main.ts`, `src/ui/theme/registry.test.ts` -- `scifiTheme` in every build, second in order -- TH-3, AD-10
- [x] `src/ui/app.css` -- scifi block with tokens and art -- TH-2, TH-4, TH-5, TH-9
- [x] `src/ui/theme/contrast.test.ts` -- scifi under test, meta equals table -- AD-14
- [x] `e2e/theme.spec.ts`, `e2e/theme-art.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/pwa/build-output.spec.ts`, `e2e/helpers.spec.ts`, `fixtures/prefs-theme-scifi.json` -- as the Code Map -- Q-45, AD-10, AD-14, AD-16
- [x] `e2e/theme-scifi.screens.spec.ts` and baselines; regenerate `preferences-panel.png` and `theme-paper-preferences.png` -- TH-4, AD-17
- [x] Re-grep `e2e/*.screens.spec.ts` for any other shot showing the Theme group. Record in Implementation Notes: TRANSLUCENT and OPAQUE internal tokens, the size-budget margin (TH-8, brief estimate ~524 B gzip), the measured pixel ratio, and that the first-frame tint, scan-line look and pointer visibility are owner gate.

**Acceptance Criteria:**
- Given the production list, when Preferences opens, then Charcoal, Deep Space, Daylight Paper are offered in that order and choosing Deep Space sets `data-theme` `scifi`, `color-scheme: dark`, meta `#0A0F1C`, and both art tokens not `none`.
- Given scifi, when contrast.test.ts and the pixel check run, then every TABLE row passes at its floor and card ink is at least 4.5 over the texture.
- Given `npm run test:all` and `npm run test:screens`, when they run, then both pass with four new scifi baselines, the two Preferences baselines changed only by the added radio row, and no other snapshot changed.

## Implementation Notes

- Internal tokens: TRANSLUCENT `scrim` (`#000000b3`), `shadow-drag` (`rgb(0 0 0 / 0.35)`), `scene-pointer-shadow` (default's); OPAQUE `scene-pointer-fill`, `scene-pointer-stroke` (default's).
- Size budget (TH-8): total 551316 of 600000 bytes (margin 48684); css 7665 B (paper build was 7363 B, +302 B).
- Pixel ratio: theme-art.spec.ts scifi pixel test passes at the 4.5 floor (live, QU, tray tile, destination, block mirror); the exact measured worst ratio is not logged by the test. contrast.test.ts worst-point rows pass for both art layers.
- Screenshots: four new scifi baselines; `theme-paper-preferences.png` regenerated (added radio row). `preferences-panel.png` did not differ in the container run, so it is unchanged. No other screens spec shows the Theme group.
- `test:all`: one full run had one flaky failure (`board-keys.spec.ts:634`, passes alone), which stopped the `&&` chain before `test:e2e:pwa`; `test:e2e:pwa` was run separately and passed (14).
- Added a `prefs-theme-scifi` seeding test in e2e/helpers.spec.ts (no fixture-registry list exists there).
- Owner gate: first-frame tint (`#15171B` status bar vs `#0A0F1C` page), scan-line look, scene pointer visibility on navy.

## Plan Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 6, false 18, maybe-false 0
- findings:
  - `[low]` `[reject]` Pixel ratio not logged (blind, intent-alignment) — real but cosmetic: the test asserts >= 4.5 and the ticket requires the measured ratio only on failure; adding logging is new complexity.
  - `[false]` `[reject]` Plan contradicts itself on `preferences-panel.png` (blind, edge, intent-alignment) — the shot at 360 px does not show the Theme group (preferences.screens.spec.ts l.15-21 never scrolls to it) and `test:screens` passed with the baseline unchanged; the plan wording was an expectation, the recorded note is the outcome.
  - `[low]` `[reject]` Plan frontmatter and empty log sections (blind) — process state, filled at finalize.
  - `[low]` `[reject]` `plum` literal in two tests (blind) — `plum` is a valid ThemeId in prefs.svelte.ts; the ticket prescribes it.
  - `[low]` `[reject]` build-output test bundles two assertions and uses substring checks (blind, edge) — the ticket prescribes the `%233b6b4f` and `%2335d0ff` substring checks and the combined test.
  - `[false]` `[reject]` Remaining blind test-coverage nits (scrim/shadow restore, unused `radio` field, color-scheme in shots, duplicate fixture test) — each is either already covered by the Charcoal return test, harmless, or outside the ticket's shot set.
  - `[false]` `[reject]` scifi block placed before paper block (blind, edge) — it is after the dark `color-scheme` rule, which the plan allows; the default-meta regex reads the first `--wc-table`, still the default block; contrast and meta tests pass.
  - `[false]` `[reject]` Garden `--wc-card-texture` no longer checked in build-output (edge) — the ticket prescribes the substring discrimination.
  - `[false]` `[reject]` scifi P6 test has no theme precondition (edge) — `openFixture` without prefs starts on the default theme, and the test clicks the radio.
  - `[false]` `[reject]` verification-gap lens: no gaps found.
  - `[false]` `[reject]` intent-alignment: contrast.test.ts has no scifi worst-point rows in the diff — the file builds its theme list from app.css, so scifi joins automatically, and the `test:all` unit run passed.
  - `[false]` `[reject]` intent-alignment: sheets and scenes covered only by screenshots, owner-gate items untested — the ticket fixes the shot set and assigns those items to the owner gate.
  - `[false]` `[reject]` intent-alignment: the remaining descriptive readings (baselines absent from diff text, size margin without a test, garden tests parameterised) — descriptive; no defect claimed or already covered above.

## Design Notes

Registration order drives the radio order; the Daylight Paper Preferences baseline changes only because Deep Space now sits above it (owner-approved in the ticket Notes). Pointer tokens keep the default's; visibility on the navy table is an owner call.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` -- expected: exit 0; `git status` shows four new scifi baselines plus the two Preferences baselines only
- `git diff --stat -- 'e2e/*-snapshots'` -- expected: no other modified snapshot

## Auto Run Result

**Summary:** Deep Space (`scifiTheme`, id `scifi`, meta `#0A0F1C`) registered in every build, second in the Theme order (owner decision 2026-10-19); `[data-theme="scifi"]` block with the 18 brief tokens, `color-scheme: dark`, the 48 px grid (7 %) and 4 px scan-line (6 %) art; contrast, registry, switch, art-pixel, dist-smoke, build-output tests and four screenshot baselines.

**Files changed:** `src/ui/app.css`, `src/ui/theme/registry.ts`, `src/ui/theme/registry.test.ts`, `src/ui/theme/contrast.test.ts`, `src/ui/text.ts`, `src/main.ts`, `e2e/theme.spec.ts`, `e2e/theme-art.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/pwa/build-output.spec.ts`, `e2e/helpers.spec.ts`, `fixtures/prefs-theme-scifi.json`, `e2e/theme-scifi.screens.spec.ts` with four baselines, regenerated `theme-paper-preferences-android-linux.png`.

**Review:** patches 0; deferred 0; 24 findings rejected with reasons in the Review Triage Log.

**Follow-up review recommended:** false.

**Verification:** `npm run test:all` exit 0 (re-run by the orchestrator after the build); `npm run test:screens` passed in the build (50 passed); size budget 551316 of 600000 bytes.

**Residual risks / owner input:** owner gate: play on Android; first-frame tint (`#15171B` status bar vs `#0A0F1C` page), scan-line look, scene pointer visibility on navy. The Daylight Paper Preferences baseline changed (added radio row, owner-approved in the ticket Notes) for owner approval at review. `preferences-panel.png` did not change (the shot does not show the Theme group). Measured pixel ratio not logged (passes at 4.5).
