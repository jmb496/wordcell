---
id: 4
type: story
title: "Theme preference and pre-paint apply"
parent: epic-themes
covers: [TH-3, TH-7]
after: [2, 3]
risk: medium
---

# Theme preference and pre-paint apply

## Description

Adds the optional theme field to the prefs store (version stays 1, absent means default, unknown theme id handled as Q-36 prescribes), a Theme control in the Preferences panel wrapped in act(), applying the theme as a root attribute before first paint in boot order, mirroring it to the theme-color meta, and the AD-17 test-hook and fixture support.

- plan_checkpoint = true
- interface = "src/shell/prefs.svelte.ts, src/ui/PreferencesPanel.svelte, text.ts, main.ts boot, index.html, test-hook.ts and e2e/globals.d.ts together."
- tests = "Prefs parse and defaults (U shell, AD-n names); switch, persist, reload (P6 android); screenshot of Preferences."
- owns = "The theme preference and the apply step."
- consumers = "Preferences panel screenshots; fixtures with prefs."
- Prefs: `theme?` optional in Prefs and in parsePrefs' key check (absent is `default`, version stays 1). A present value that is non-string or not an AD-7 id is contents-unreadable: all prefs take defaults silently (Q-36). `setTheme(id)` uses the existing set() path (assertWritable, same-value no-op, write then mirror); setters leave `theme` absent while it is the default and absent.
- Apply: shell never imports src/ui/. `src/ui/theme/` holds a registry (id, EXPERIENCE label from text.ts, meta colour read from the theme's token) and exports `applyTheme(id)` (`data-theme` on the root, theme-color meta updated in place, never duplicated). main.ts calls it right after prefs.load() and on every change through a callback registered with prefs (same code for boot and setter); prefs.svelte.ts holds only the value and setter. index.html and the manifest theme_color stay #15171B (TH-3); the meta is overwritten at runtime only.
- Registry: Theme control lists registered themes only. This ticket registers only `default` in production; later theme tickets add entries. A stored id valid per AD-7 but unregistered fails fast (rule 6, AD-15), no silent fallback.
- Boot paths: the apply runs in the AD-16 slot on every boot path, so Halted and rejected-Session surfaces wear the stored theme; rejected prefs apply `default`.
- First paint: keep the module script, no inline script (AD-16); the first painted frame must already carry the stored theme. main.ts currently awaits nav.launch() and fontCheck() before prefs.load(); the plan settles whether prefs.load() plus the apply (synchronous, writes nothing) moves ahead of the awaits, and if that departs from AD-16's order it proposes the spine edit for owner approval (rule 7), not assuming it.
- TH-7: this ticket verifies the docs against the built behaviour; any change needs owner approval (rule 7).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with a Playwright android test that switches theme in Preferences, sees the root attribute and theme-color meta change, reloads without a flash of the default and keeps the choice, and a Vitest test that a stored v1 prefs without a theme loads with the default.

- No flash: an addInitScript MutationObserver (or first-rAF probe) records `data-theme` and the theme-color meta content from document start after reload; the first recorded value is already the stored theme and `default` never appears.
- Switch test: the e2e registers a test-only second theme (test build, token block + meta colour, never shipped); only registered ids are offered.
- Vitest AD-n cases: absent, valid, explicit default, unknown, non-string, round trip.
- Q-45: the theme survives New game, Replay and reload, the Session untouched; it never follows prefers-color-scheme (emulated); the apply runs for the rejected-Session path (one test).
- Theme control: single-choice radiogroup below Animation speed, located by role and name, labels in text.ts, wrapped in act().
- test-hook.ts and e2e/globals.d.ts change together: current().prefs and loaded().prefs carry theme, loaded() returns the stored shape.
- Fixtures, seeded via seedStorage: a valid prefs fixture with a non-default theme, and a prefs-invalid-theme fixture (AGENTS.md fixtures pitfall; used only in a rejection test).
- Screenshots: only the Preferences panel baselines are regenerated in the Playwright container (npm run test:screens), the diff limited to the new Theme row; every other baseline unchanged (TH-4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- architecture — ARCHITECTURE-SPINE.md AD-7, AD-10, AD-16, AD-17
- rules — docs/game-flow-spec.md §7.10, Q-36, Q-45
- code — src/main.ts, src/shell/prefs.svelte.ts, src/ui/PreferencesPanel.svelte

## Notes

- No open questions; the first-paint default is under Description.
