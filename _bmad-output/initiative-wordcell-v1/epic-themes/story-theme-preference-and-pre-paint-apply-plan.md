---
title: 'Theme preference and pre-paint apply'
type: 'feature'
ticket: 4
created: '2026-10-18'
status: 'built'
baseline_revision: 'e89feb4d07d15360b0816be6b03d1db723a09b04'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-preference-and-pre-paint-apply.md'
  - '{project-root}/AGENTS.md'
warnings: []
deferred:
  - summary: >-
      A default-looking frame (empty #app on the dark static table, no data-theme) paints before the theme apply, because AD-16 awaits nav.launch and the font check first.
    evidence: |-
      A throwaway rAF probe from document start on the dev server with prefs-theme-paper seeded recorded ["null|app=0","paper|app=2"]: one frame with no data-theme and an empty #app, then paper. The story's No-flash criterion exempts the pre-apply absent attribute and #15171B, so the test passes; whether a dark frame before a future light theme (9.6 Daylight Paper) is acceptable is the owner's call, and moving prefs.load and apply ahead of the awaits needs an approved AD-16 edit (rule 7).
    location: >-
      src/main.ts boot(), e2e/theme.spec.ts
    severity: medium (unverified on a production build)
---

<intent-contract>

## Intent

**Problem:** Spine AD-7/AD-10/AD-16 and spec Q-45 already define an optional `theme` pref, a `data-theme` root attribute and a `theme-color` meta mirror, but no code stores, applies or offers a theme.

**Approach:** Add `theme?` to the prefs store (Q-36 handling, `onThemeChange` hook), a `src/ui/theme/` registry with `applyTheme`, a Theme radiogroup in Preferences, and the boot apply right after `prefs.load()` in the unchanged AD-16 order. The first-frame test decides whether a flash exists; only a shown flash makes this plan propose a spine edit, for owner approval.

## Boundaries & Constraints

**Always:** The story file Description and Acceptance Criteria (`_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-preference-and-pre-paint-apply.md`) are the full specification: prefs shape and resolved/raw split, writers omitting `default`, `setTheme` write-then-callback, registry rules, test-only `paper`, halt behaviours, fixtures, test list. Follow them verbatim. Owner decision 2026-10-18: keep AD-16's order (nav launch, font check, then prefs.load and apply). Shell never imports `src/ui/`. Tests named by AD-n/Q-id (never R-ids for shell/UI tests). Labels only in `src/ui/text.ts` (`Charcoal` for `default`, `Daylight Paper` for `paper`, `Theme` for the group).

**Never:** Edit the spine, spec, UX docs, `index.html` theme-color, the manifest colour or any `[data-theme]` token block (TH-3, TH-4). Add a blocking inline script, a `prefers-color-scheme` listener, a CSS transition or animation for the switch, or a fallback for an unregistered id (rule 6). Regenerate any baseline except Preferences. Bump `version` or `SESSION_VERSION`. Register `paper` in a build without the test hook. Push or touch `bga-wordcell`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Absent / v1 without theme | no key, or `{version:1,animationSpeed,showTimer}` | `current().prefs.theme` `default`; `data-theme="default"`; `loaded().prefs` raw (no `theme`) | none |
| Stored non-default registered | `theme:"paper"` (test build) | `data-theme="paper"` set first-time as paper, meta = paper colour by first rAF | none |
| Explicit `theme:"default"` | stored | valid; dropped on next write | none |
| Unknown / non-string | `theme:"neon"`, `theme:3` | `contents-unreadable`; all prefs default; key untouched until a setter | silent (Q-36) |
| Valid AD-7 id, unregistered | `theme:"scifi"` | `applyTheme` throws after `load()` | AD-15 Halted, default look, stored prefs untouched |
| Switch | choose Daylight Paper / Charcoal | attribute and meta change at once, `getAnimations()` empty; stored `theme` present / removed; Session untouched | setter throws while halted/booting (AD-10) |
| Rejected prefs | unknown version | `default` applied | none |

</intent-contract>

## Code Map

- `src/main.ts` -- `boot()`: `prefs.load()` at line ~104; add `applyTheme(prefs.value.theme)` immediately after it (before `initMotion()`/`game.load()`), and `prefs.onThemeChange(applyTheme)` before `prefs.load()`; at module load, when `import.meta.env.DEV || VITE_TEST_HOOKS === '1'`, register the test-only `paper` entry before `void boot()`.
- `src/shell/prefs.svelte.ts` -- `Prefs`/`DEFAULTS`/`FIELDS`/`parsePrefs`/`set()`/`load()`; add `ThemeId` (AD-7 ids: default, scifi, garden, steampunk, paper, plum), optional `theme` key check, raw parse vs resolved `value`, `setTheme`, `onThemeChange`. `set()` currently takes (animationSpeed, showTimer): extend with theme; writers drop `theme` iff `default`.
- `src/ui/theme/` -- existing `colour-literals*.ts`, `contrast.test.ts`; add `registry.ts` (`register`, `entries()`, `applyTheme`, meta colour per entry) with `registry.test.ts`. Meta colour literals live only here for the test-only entry; the scan scope and tsconfig lists (`tsconfig.app.json`, `tsconfig.arch.json`) need entries only for files importing `node:*`.
- `src/ui/PreferencesPanel.svelte` -- add the Theme radiogroup as last row, beside the Animation speed one, `act()`-wrapped, options from the registry.
- `src/ui/text.ts` -- `theme`, `themeDefault` ('Charcoal'), `themePaper` ('Daylight Paper').
- `src/shell/test-hook.ts` and `e2e/globals.d.ts` -- change together, only so `Prefs` carries `theme`.
- `fixtures/prefs-theme-paper.json`, `fixtures/prefs-invalid-theme-unknown.json` -- new; seed via `seedStorage` only.
- `src/shell/prefs.svelte.test.ts`, `e2e/prefs.spec.ts` (or a new `e2e/theme.spec.ts`), `e2e/preferences.screens.spec.ts` -- existing patterns to extend; `e2e/helpers/seed.ts` unchanged.
- `src/ui/app.css`, `index.html`, `vite.config.ts` -- read-only here (token `--wc-table: #15171b`; meta `#15171B`).

## Tasks & Acceptance

**Execution:**
- [ ] `src/shell/prefs.svelte.ts` -- optional `theme`, raw/resolved split, `setTheme`, `onThemeChange` -- Q-36, AD-7, AD-10
- [ ] `src/shell/prefs.svelte.test.ts` -- AD-n cases: absent, valid, explicit default, unknown, non-string, round trip (explicit default, then speed change), callback only after a successful write -- matrix rows
- [ ] `src/ui/theme/registry.ts` + `registry.test.ts` -- registry, `applyTheme` (always sets `data-theme`, updates the one meta in place, throws on unregistered), default meta equals app.css `--wc-table` read as text -- AD-10, TH-3
- [ ] `src/ui/text.ts`, `src/ui/PreferencesPanel.svelte` -- Theme radiogroup -- ticket Theme control
- [ ] `src/main.ts` -- register callback and test-only `paper`, apply after `prefs.load()` -- AD-16
- [ ] `src/shell/test-hook.ts`, `e2e/globals.d.ts` -- carry `theme` -- AD-17
- [ ] `fixtures/*.json`, Playwright specs -- no-flash recorder, switch/persist/reload, unregistered id, Q-45 (New game, Replay, reload, no prefers-color-scheme, rejected-Session path), invalid-theme boot, production radiogroup offers default only (dist-smoke only if hook-free) -- ticket criteria
- [ ] `e2e/preferences.screens.spec.ts` -- regenerate only Preferences baselines via `npm run test:screens` -- TH-4

**Acceptance Criteria:**
- Given a non-default stored theme, when the page loads from document start, then a recorder sees `data-theme` first set to that theme and the meta equals its colour by the first rAF.
- Given the Preferences panel, when Daylight Paper then Charcoal is chosen, then attribute, meta, `current().prefs.theme` and the stored key follow at once with no animations and the Session text unchanged.
- Given an AD-7-valid unregistered id, when the app boots, then the AD-15 Halted surface shows with the default look and the stored prefs untouched.
- Given the whole repo, when `npm run test:all` and `npm run test:screens` run, then both pass with only Preferences baselines changed.

## Implementation Notes

Deviations: `src/ui/theme/registry.ts` is exempt from the colour-literal tree scan (the meta colours are hex literals that live only there, TH-3) and a `colour-literals.test.ts` case pins the default meta to `--wc-table` in app.css read as text; no tsconfig list changes (registry.test.ts imports no `node:*`); `src/shell/test-hook.ts` needed no edit (types flow from the stores), `e2e/globals.d.ts` carries `theme`. Existing prefs expectations in game/history store tests, `e2e/prefs`, `restore`, `blocking` now expect the resolved `theme: 'default'`. First-frame test (owner decision A, AD-16 kept, spine untouched): after the board mounts every frame carries the stored theme and its meta; one pre-apply frame (no attribute, empty #app) exists, which the story criterion exempts. See the deferred item.

## Plan Change Log

## Review Triage Log

### 2026-10-18 — Review pass 1
- verdicts: high 0, medium 1 (deferred), patches 0
- findings:
  - `[medium]` `[defer]` Pre-apply default frame / no-flash test samples only post-mount frames (blind, edge, intent-alignment) — confirmed by probe: one frame with no data-theme precedes the apply; exempt per the story criterion; owner call, see deferred.
  - `[low]` `[reject]` setTheme not atomic if applyTheme throws (blind, edge) — only unregistered/missing meta throws, unreachable from the registry-driven radiogroup; failing to the AD-15 surface is rule 6.
  - `[low]` `[reject]` `themeChange?.` silent when unregistered; single-slot callback (blind) — main.ts registers it before load; prefs unit tests run without a UI.
  - `[false]` `[reject]` HMR double `register` (edge) — main.ts has no HMR accept, so an edit reloads the page.
  - `[false]` `[reject]` restore.spec spreads a `{rejected}` prefs (edge) — the spread is the pre-existing pattern and no case in that table has rejected prefs; the suite passes.
  - `[low]` `[reject]` registry.ts wholly exempt from the literal scan; regex-based meta check brittle; duplicated constants (blind, edge, verification-gap) — scope is two entries; a direct fix adds scan complexity.
  - `[low]` `[reject]` Stored `paper` halts in a production build; production offers one theme; production cannot switch (blind, intent-alignment) — specified: production registers only `default` (story Registry); later theme tickets add entries.
  - `[false]` `[reject]` Plan status/task boxes/empty logs (blind) — process state at review time; filled at finalize.
  - `[low]` `[reject]` Other coverage nits (keyboard on radios, rejected-version boot, aria-labelledby) — rows covered by the unknown-theme and rejected-Session tests; no named harm.

## Auto Run Result

**Summary:** Optional `theme` pref (Q-36 handling, raw/resolved split, `setTheme` + `onThemeChange`), `src/ui/theme/registry.ts` with `applyTheme`, a Theme radiogroup in Preferences, and the apply right after `prefs.load()` in the unchanged AD-16 order; test-only `paper` in hook builds.

**Files changed:** `src/shell/prefs.svelte.ts`, `src/main.ts`, `src/ui/theme/registry.ts` (+test), `src/ui/PreferencesPanel.svelte`, `src/ui/text.ts`, `e2e/globals.d.ts`, `e2e/theme.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, two fixtures, updated existing prefs expectations, the Preferences baseline.

**Review:** patches 0; deferred 1 (pre-apply frame); the rest rejected with reasons in the Review Triage Log.

**Follow-up review recommended:** false.

**Verification:** `npm run test:all` exit 0 (run by the parent after implementation). `npm run test:screens` passed per the implementing agent; only `preferences-panel-android-linux.png` changed.

**Owner input:** one default-looking frame paints before the apply (deferred item). If the owner counts it as a flash, an AD-16 edit moving prefs.load and apply ahead of nav.launch/font check is needed.

## Design Notes

First-frame test (owner decision A): if the recorder shows the page painting the default dark frame visibly different from the stored theme *after* the first mount (not merely before the apply slot, which the story exempts), record it under Implementation Notes and `blocked` with a proposed AD-16 edit for owner approval; do not edit the spine. Since the spine's AD-16 text already places the apply right after prefs load and before mount, a spine edit is not expected.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` -- expected: exit 0; `git status` shows only Preferences snapshot changes
