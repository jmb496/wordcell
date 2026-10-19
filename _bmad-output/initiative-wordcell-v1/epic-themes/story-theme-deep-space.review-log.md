# Review log — story-theme-deep-space.md (ticket 9.7)

State: pass 3: done

Pre-loop: HEAD 4bc178217cde6842ff7dae148c1a03463a76f96d; pass 0 copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space.review-log.passes/pass0.md (176 words by wc -w incl. frontmatter); budget 1500 words.

## Pass 1 — 2026-10-19
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings (merged, deduplicated): major 10, minor 4, decision-needed 1  |  Dropped in triage: 0 (duplicates merged)
### Majors (all default applied, technical)
- Registry/wiring dropped (scifiTheme export, label text.themeDeepSpace, meta #0A0F1C, main.ts registration, registry.test.ts unregistered-id example `scifi` must change, theme.spec radio count, dist-smoke Theme group, contrast meta-equals-table, prefs-theme-scifi fixture) → model on 9.6 Registry/Meta bullets
- Token set unpinned (18 from brief §A, color-scheme dark, scrim, four internal tokens, block placement after default rules) → copy 9.6 Tokens bullet
- Art tokens unpinned (9.5 grammar, grid 7 %, scan-line ≤ 6 %, brief/themes.mjs opacity comment mismatch) → pin; art lives in app.css
- e2e/pwa/build-output.spec.ts:141 asserts no art URI in dist → retarget (garden selector absent, scifi art present)
- Contrast/pixel acceptance untestable (floors, themes under test, pixel/layout/computed-style checks for scifi)
- Screenshot set unpinned (spec file, fixtures, helper reuse, scene shows textured card on flat table)
- Switch test unspecified; Hue-alone (TH-5) bullet missing; surfaces/no-component-change bullet missing
- "Default baselines unchanged" unprovable: production scifi adds a Theme radio, so Preferences-panel shots legitimately change → state the single permitted diff
### Minor
- size budget margin; owner gate / scan-line removal is owner call; references by path; one-frame meta tint follows AD-16 unchanged
### Decision needed (functionality / UX / gameplay)
- Theme radio order in Preferences — spec §7.10 lists Charcoal, Deep Space, …, Daylight Paper, but build order registers paper first (9.6), so Deep Space would show third — proposed default: spec order (Deep Space second), at the cost of regenerating the paper-theme Preferences shots; the fixer keeps the ticket order-neutral.
Words: 1225 (6.96 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space.review-log.passes/pass1.md
Fixer applied items 1–13 (see _bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space.review-log.passes/pass1.fix.diff). Extra: registry.test.ts and theme.spec.ts:217 unregistered-id examples move from `scifi` to `plum`; frontmatter `hitl: false`.

## Pass 2 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings (merged): major 3, minor 8, decision-needed 0 (radio order already logged)  |  Dropped in triage: 8
### Majors (default applied, technical)
- Art fallback (line 20) lets the builder lower or drop the scan-line, contradicting Notes/Owner gate (owner call) → builder stops and reports a failed pixel check; look changes go to the owner
- Build-output retarget cannot discriminate garden's art from scifi's in dist → specify discriminators (garden selector and garden-only art substring absent from dist; scifi selector and art present in both)
- Registry Vitest bullet claims "registers in the production list", untestable in registry.test.ts → Vitest covers export shape and apply; production list/order lives in dist-smoke
### Minor (applied; zero or near-zero words)
- registry.test.ts:65 changes call and expected message; one fallback id `plum` in both places (note it changes when plum is registered); Switch "back" = data-theme attribute removed, meta #15171B, art tokens `none`; Verify split into build items and owner checkpoint; `prefs-theme-scifi` content = prefs-theme-paper with theme scifi, mirror every `prefs-theme-paper` hit (e.g. e2e/helpers.spec.ts:1249); preferences shot asserts the Deep Space radio checked; Verify diff clause "Theme group and whatever it displaces"; pointer visibility on navy goes to the owner gate
### Dropped
- frontmatter done_checkpoint (9.5/9.6 omit it; tickets.py falls back to toml); contrast themeRecords handling of art keys (existing mechanism reads app.css records, art keys skipped in key-set check); grid-path half-pixel clip (same as the approved mockups); TH-5 unshown states (as accepted in 9.6); tokens case/placement; pre-paint test; budget wording; fixture text beyond above
Words: 1334 (7.58 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space.review-log.passes/pass2.md
Fixer applied items 1–9 (diff: _bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space.review-log.passes/pass2.fix.diff). Item 5 deviation: Charcoal sets data-theme to `default` (theme.spec.ts:148), so the ticket says `default`, not "attribute removed".

## Pass 3 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 9, decision-needed 0  |  Dropped in triage: 5
### Majors (default applied, technical)
- Art bullet: end state after a failed pixel check undefined (hitl false; test:all must pass before built) → plan left blocked, no theme commit, run stops with the measured ratio
### Minor (applied, near-zero words)
- "Default baselines" label vs paper shot; radio-order assertions follow the logged decision; name the dark-first-frame tint; `prefs-theme-scifi` needed only by the fixture-registry test in helpers.spec.ts and the screenshot spec
### Dropped
- brittle line numbers (already hedged with `~` and names); minifier re-encoding (plan checks against a real dist); tokens placement after paper (cosmetic, dropped in pass 2); TH-5 wording (dropped in pass 2); Switch whitespace (obvious handling)
Words: 1413 (8.03 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space.review-log.passes/pass3.md
Fixer applied items 1–5 (diff: _bmad-output/initiative-wordcell-v1/epic-themes/story-theme-deep-space.review-log.passes/pass3.fix.diff).
