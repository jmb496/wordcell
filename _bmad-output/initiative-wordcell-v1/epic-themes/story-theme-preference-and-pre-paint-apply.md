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

Adds the optional theme pref (Q-36 handling), a Theme control in Preferences, the root-attribute apply with theme-color meta mirror, and AD-17 test-hook and fixture support.

- plan_checkpoint = true
- interface = "src/shell/prefs.svelte.ts, src/ui/PreferencesPanel.svelte, text.ts, main.ts boot, index.html, test-hook.ts and e2e/globals.d.ts together; prefs exposes onThemeChange(fn)."
- tests = "Vitest shell and Playwright android per the criteria below; Preferences screenshot."
- owns = "The theme preference and the apply step."
- consumers = "Preferences panel screenshots; fixtures with prefs."
- Prefs: `theme?` optional in parsePrefs' key check (version stays 1). A present value that is non-string or not an AD-7 id is contents-unreadable: all prefs take defaults silently (Q-36). `parsePrefs` returns the raw stored shape (`theme?: ThemeId`, present only if stored); `load()` builds the resolved in-memory Prefs (`theme: raw.theme ?? 'default'`, `theme: ThemeId`), so `loaded().prefs` is raw and `current().prefs` resolved. Writers omit `theme` iff it is `default` (an explicit stored `default` is dropped on the next write). `setTheme(id)` uses the existing set() path (assertWritable, same-value no-op, write then mirror) and, only after the write succeeds, invokes the `onThemeChange(fn)` callback.
- Apply: shell never imports src/ui/. `src/ui/theme/` holds the registry (id, text.ts label, explicit meta colour per AD-10) and exports `applyTheme(id)` (`data-theme` always set to the id, `default` included, on the root; theme-color meta updated in place, never duplicated). main.ts registers `onThemeChange(applyTheme)`, then calls `applyTheme` once after prefs.load(). index.html and the manifest theme_color stay #15171B (TH-3); the meta is overwritten at runtime only.
- Registry: production registers only `default`; later theme tickets add entries. A stored id valid per AD-7 but unregistered fails fast (rule 6, AD-15). In builds carrying the test hook (dev server, dist-test; never dist), main.ts registers a test-only `paper` entry (an AD-7 id a later ticket replaces, placeholder meta colour) at module load, before boot(), so seeded fixtures work before navigation.
- First paint: the first painted frame carries the stored theme (module script, no inline script, AD-16). The plan settles whether prefs.load() plus apply moves ahead of main.ts's awaits (nav.launch(), fontCheck()); departing from AD-16's order needs a spine edit approved by the owner (rule 7). Halts before the apply slot, or where the apply itself throws, render the static default (no `data-theme`, #15171B; exempt from tests); halts after it wear the stored theme; rejected prefs apply `default`.
- TH-7: this ticket verifies the docs against the built behaviour; any change needs owner approval (rule 7).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, including the criteria below.

- No flash: with a non-default stored theme, a recorder from document start (addInitScript MutationObserver or first-rAF probe) sees `data-theme` first set to the stored (or resolved) theme, and the meta equals that theme's colour by the first rAF; the pre-apply absent attribute and #15171B are not a flash.
- Switch test (android, build with `paper` registered): the Theme radiogroup offers exactly the registered ids (default and paper in test builds, default only in dist); choosing Daylight Paper by role and name sets data-theme="paper" and the meta colour at once with no animation (document.getAnimations() empty right after), `current().prefs.theme` is 'paper' and the stored wordcell:prefs holds `theme`; choosing Charcoal again removes `theme` from the stored key; the Session text is unchanged. After a reload with paper stored the choice is kept.
- Registry: seeding an AD-7-valid but unregistered id reaches the AD-15 Halted surface with the default look and leaves the stored prefs untouched.
- Meta colour: production entries only (`default`: the registry meta colour equals the token read as text from src/ui/app.css, #15171B); the test-only `paper` entry carries an explicit placeholder colour and is exempt.
- Vitest AD-n cases: absent, valid, explicit default, unknown, non-string, round trip (explicit default, then an animation-speed change).
- Q-45: the theme survives New game, Replay and reload, the Session untouched; it never follows prefers-color-scheme (emulated); the apply runs on the rejected-Session path.
- Theme control: single-choice radiogroup below Animation speed (last row of the panel), located by role and name, labels in text.ts, wrapped in act().
- test-hook.ts and e2e/globals.d.ts change together, only to carry `theme` in the prefs types.
- Fixtures, seeded via seedStorage only in specs on test-hook builds (never dist-smoke): a valid prefs fixture with non-default theme `paper`, and a prefs-invalid-theme fixture whose rejection test shows boot with the default theme and the key untouched until a setter runs (Q-36).
- Screenshots: only Preferences baselines change in the commit, regenerated in the Playwright container (npm run test:screens); every other baseline unchanged (TH-4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- architecture — ARCHITECTURE-SPINE.md AD-7, AD-10, AD-16, AD-17
- rules — docs/game-flow-spec.md §7.10, Q-36, Q-45
- code — src/main.ts, src/shell/prefs.svelte.ts, src/ui/PreferencesPanel.svelte

## Notes

- No open questions.
