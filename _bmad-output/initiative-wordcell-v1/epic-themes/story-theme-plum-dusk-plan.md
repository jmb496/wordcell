---
title: 'Theme: Plum Dusk'
type: 'feature'
ticket: 10
created: '2026-10-19'
status: done
baseline_revision: '95dd9d1b8a5dbbd02e6a0c9087be7e8ae8b16903'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-plum-dusk.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-greenhouse-dusk-plan.md'
  - '{project-root}/AGENTS.md'
warnings: []
deferred:
  - summary: >-
      No test covers the boot path where a stored AD-7-valid but unregistered theme makes main.ts applyTheme throw to AD-15 Halted.
    evidence: |-
      The e2e test was retired because no AD-7-valid unregistered id remains (ticket-prescribed); registry.test.ts covers only the applyTheme throw. Closing it needs a test seam outside this ticket (owner decision).
    location: >-
      e2e/theme.spec.ts (removed test), src/main.ts
    severity: medium
---

<intent-contract>

## Intent

**Problem:** The Plum Dusk direction (id `plum`, tokens only, no art) from the 9.1 brief section E is unbuilt; `ThemeId` already holds `plum`.

**Approach:** Ship `plumTheme` (meta `#17121C`) registered in every build last in Theme order (default, scifi, garden, steampunk, paper, plum; spec §7.10), with an app.css `[data-theme="plum"]` block. The story file is the full specification; follow it verbatim, with 9.9's and 9.8's plans as the pattern.

## Boundaries & Constraints

**Always:** The 18 values copied exactly from research/brief.md section E (app.css lowercase hex; registry meta and e2e constants uppercase); block after paper with `color-scheme: dark`, scrim `#000000b3`, `--wc-shadow-drag: rgb(0 0 0 / 0.35)` and the three `--wc-scene-pointer-*` tokens as the steampunk block writes them; art keys left unset. Tests named by id. Do not add plum to theme-art.spec.ts `ARTS`.

**Never:** Edit the spine, DESIGN.md, `index.html` meta, the manifest, `tickets.toml`, components or Scene.svelte. Change tokens if a contrast floor fails: leave the plan blocked, commit nothing, report the ratio. Change layout or CSS for a taller Preferences sheet. Add a fallback. Push. Touch `bga-wordcell`.

</intent-contract>

## Code Map

- `src/ui/theme/registry.ts` -- add `plumTheme` (id `plum`, label `text.themePlumDusk`, meta `#17121C`) after `paperTheme`; header comment lists six themes.
- `src/ui/text.ts` (~l.219-221) -- add `themePlumDusk: 'Plum Dusk'`.
- `src/main.ts` (import list l.29-36; register block ~l.226-233) -- import and `register(plumTheme)` after paper; update comment.
- `src/ui/app.css` -- `[data-theme="plum"]` after the paper block (ends ~l.156).
- `src/ui/theme/contrast.test.ts` (l.6, ~156) -- add `plumTheme` to the meta-equals-table list and import.
- `src/ui/theme/registry.test.ts` (~l.78 steampunk test; unregistered test ~l.99) -- add `plumTheme` shape test beside it; unregistered test becomes `applyTheme('nonesuch' as ThemeId)` with message "AD-10 theme 'nonesuch' is not registered"; only the id literal and that message change, title and the nothing-changed assertions stay.
- `fixtures/prefs-theme-plum.json` (new) -- shape of `prefs-theme-garden.json`, `"theme":"plum"`.
- `e2e/theme.spec.ts` -- l.9 'all five' -> 'all six'; radios count 6, `.nth(5)` Plum Dusk; Switch test for plum and back to Charcoal (`#15171B`), reload keeps it, beside the Brass and Walnut test; delete 'an AD-7-valid but unregistered theme reaches Halted' (~l.296-312) and any helper or import it alone used (lint confirms; reviewers found `storedPrefs` and `CHARCOAL` still used elsewhere).
- `e2e/pwa/dist-smoke.spec.ts` (~l.58, 73-78, steampunk pick ~l.79-90) -- title and count 6, rename; replace the steampunk pick and its assertions (the lines ~79-90) with Plum Dusk: `data-theme` `plum`, meta `#17121C`.
- `e2e/pwa/build-output.spec.ts` (~l.141) -- retarget and rename (keep `AD-14 TH-9`, drop '; plum is absent'), rewrite the stale 'Each later theme ticket edits the absent list' comment; garden, scifi, steampunk and plum selectors (and art markers for the first three) present in dist and dist-test; no absent list.
- `e2e/theme-plum.screens.spec.ts` (new) -- clone `theme-garden.screens.spec.ts` (android only), `seedStorage` with `prefs-theme-plum`; `theme-plum-board|tray|preferences|scene-2.png`; baselines via `npm run test:screens`.
- Preferences baselines (`preferences-panel.png`, `theme-{scifi,garden,steampunk,paper}-preferences.png`) -- regenerate only if they differ; re-grep `e2e/*.screens.spec.ts` for other Preferences shots.
- Read-only: `prefs.svelte.ts`, `e2e/globals.d.ts` (ThemeId holds `plum`), research/brief.md section E, `index.html`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/theme/registry.ts`, `src/main.ts`, `src/ui/theme/registry.test.ts` -- `plumTheme` in every build, last; retarget the unregistered test -- TH-3, AD-10
- [x] `src/ui/app.css`, `fixtures/prefs-theme-plum.json` -- plum block, tokens only -- TH-2, TH-5, TH-9
- [x] `src/ui/theme/contrast.test.ts` -- plum under test, meta equals table -- AD-14
- [x] `e2e/theme.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/pwa/build-output.spec.ts` -- per the Code Map -- Q-45, AD-10, AD-14, AD-16
- [x] `e2e/theme-plum.screens.spec.ts` and baselines; regenerate changed Preferences baselines -- TH-4, AD-17
- [x] Record in Implementation Notes: smallest contrast margin to the enforced floors, size-budget margin (TH-8, brief ~258 B gzip), TRANSLUCENT/OPAQUE tokens, whether the sixth row changed the sheet height, and the owner-gate items.

**Acceptance Criteria:**
- Given the production list, when Preferences opens, then six radios appear in order ending Plum Dusk, choosing it sets `data-theme` `plum`, `color-scheme: dark`, meta `#17121C`, both art tokens `none`; switching back gives `#15171B`; reload keeps plum.
- Given plum, when contrast.test.ts runs, then every TABLE row passes at the floors 4.5 and 3.
- Given `npm run test:all` and `npm run test:screens`, when they run, then both pass with four new plum baselines and the only changed existing baselines are Preferences Theme-group ones.

## Implementation Notes

- Dropped coverage (stated once here): retiring the e2e 'unregistered theme reaches Halted' test removes the only test of the boot path (a stored AD-7-valid but unregistered theme makes main.ts `applyTheme` throw to AD-15 Halted, default look, prefs untouched), because no AD-7-valid unregistered id remains. registry.test.ts still covers the `applyTheme` throw only. Listed in the Owner gate.

- Contrast: contrast.test.ts passes every TABLE row for plum at floors 4.5 and 3; the brief's thinnest rows are card edge on surface 3.77 (floor 3, margin 0.77) and outline on surface 3.91; actual run logs no ratios, only pass.
- Size budget (TH-8): total 551997 of 600000 bytes (margin 48003); css 8249 B.
- Internal tokens: TRANSLUCENT `scrim`, `shadow-drag`, `scene-pointer-shadow`; OPAQUE `scene-pointer-fill`, `scene-pointer-stroke`.
- Screenshots: four new plum baselines; regenerated `theme-{scifi,garden,steampunk,paper}-preferences` baselines (sixth row). `preferences-panel.png` did not differ. Sheet height change not separately measured; no layout or CSS changed.
- Verification: lint, check, unit (3030), build, dist-smoke (17), e2e (976), pwa (14), screens (62) all pass.
- Owner gate: palette feel, first-frame tint (`#15171B` vs `#17121C`), scene pointer visibility on plum, dropped boot-path coverage, approval of the four regenerated Preferences baselines, Android play-test.

## Plan Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 20 findings — high 0, medium 1, low 0, false 19, maybe-false 0
- findings:
  - `[medium]` `[defer]` Dropped boot-path (unregistered theme to Halted) coverage (blind, edge, verification-gap, intent-alignment) — ticket-prescribed, recorded in Implementation Notes and the Owner gate; a new seam is outside this ticket.
  - `[false]` `[reject]` Plan stale: tasks ticked while in-review, empty logs, `baseline_revision` (blind) — the plan is finalized here; the baseline is the pre-build HEAD by design.
  - `[false]` `[reject]` Code Map says clone of theme-garden screens spec not visible (blind) — the new file is in the diff and follows that shape.
  - `[false]` `[reject]` dist-smoke no longer covers the steampunk pick (blind) — ticket prescribes replacing it; theme.spec.ts covers Brass and Walnut.
  - `[false]` `[reject]` Contrast not verified in diff (blind, intent-alignment, verification-gap) — contrast.test.ts iterates every theme parsed from app.css, so plum runs every TABLE row and the key-set check; the meta list is the only edit needed.
  - `[false]` `[reject]` Screenshot set gaps and naming (blind) — the ticket fixes the four frames; names carry AD-17.
  - `[false]` `[reject]` Baselines/fixture mode 100755 (blind) — drvfs artefact; git records 100644 like the siblings.
  - `[false]` `[reject]` First-frame tint (blind) — AD-16 unchanged, ticket flags it for the owner gate.
  - `[false]` `[reject]` registry test omits production order; text.ts key order (blind) — order is covered by the theme.spec and dist-smoke radio tests; key order is not significant.
  - `[false]` `[reject]` TH-3 vs TH-5 comment, no plum art-marker assertion, missing token assertions in the switch test (blind, verification-gap) — matches the sibling tests and the ticket's prescribed assertions.
  - `[false]` `[reject]` Intent-alignment readings 1-5 and divergences (intent-alignment) — descriptive; owner play-test and baseline approval are the owner gate.

## Design Notes

Sketch of the block: `[data-theme="plum"] { color-scheme: dark; --wc-table: #17121c; … brief E values …; --wc-scrim: #000000b3; --wc-shadow-drag: rgb(0 0 0 / 0.35); --wc-scene-pointer-fill: #fff; --wc-scene-pointer-stroke: #1a1a1a; --wc-scene-pointer-shadow: rgb(0 0 0 / 0.45); }` (no art keys).

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` -- expected: exit 0; `git status` shows four new plum baselines plus only Preferences baselines changed

**Owner gate:** palette feel ("mild" at a glance), dark first-frame tint (`#15171B` bar vs `#17121C` page), scene pointer visibility on plum, the dropped boot-path coverage above, approval of regenerated Preferences baselines, and playing it on his Android install.

## Auto Run Result

**Summary:** Plum Dusk (`plumTheme`, id `plum`, meta `#17121C`) is registered in every build, last in the Theme order. It has the 18 brief section E tokens in an app.css `[data-theme="plum"]` block, `color-scheme: dark`, no art. The four review-log minors are resolved: the orphaned-helper check was left to lint (clean), the registry.test.ts retarget changes only the id literal and message, the dist-smoke pick is given as ~l.79-90, and the dropped-coverage statement is kept once (Implementation Notes).

**Files changed:** `src/main.ts`, `src/ui/{app.css,text.ts}`, `src/ui/theme/{registry,registry.test,contrast.test}.ts`, `fixtures/prefs-theme-plum.json`, `e2e/{theme.spec,pwa/dist-smoke.spec,pwa/build-output.spec}.ts`, new `e2e/theme-plum.screens.spec.ts` with four baselines, regenerated four Preferences baselines (scifi, garden, steampunk, paper).

**Review:** patches 0; deferred 1 (boot-path coverage); 19 findings rejected with reasons in the Review Triage Log.

**Follow-up review recommended:** false.

**Verification:** lint, check, unit (3030), build (size 551997 of 600000, margin 48003), dist-smoke (17), e2e (976), pwa (14), `test:screens` (62) all pass; run stage by stage.

**Residual risks / owner input:** palette feel, first-frame tint (`#15171B` bar vs `#17121C` page), scene pointer visibility on plum, the dropped boot-path coverage, approval of the four regenerated Preferences baselines, Android play-test. Exact contrast ratios are not logged by the test (brief's thinnest: card edge on surface 3.77, floor 3); sheet-height change from the sixth row not measured, no layout change made.
