# Review log — story-theme-deep-space.md (ticket 9.7)

State: pass 1: done

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
