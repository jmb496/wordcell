# Review log — story-theme-plum-dusk.md

State: pass 1: done

Pre-loop: HEAD d4c2643; pass0.md 157 words (budget 1500).

## Pass 1 — 2026-10-19
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9 (merged from 40 raw), minor 4, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; all verified against repo)
### Majors (to apply)
1. Registry/label/meta/order missing (plumTheme, text.themePlumDusk, meta #17121C, main.ts after paperTheme, contrast.test meta list, registry.test shape test).
2. Tokens: 18 values from brief §E, app.css block after paper, color-scheme dark, scrim, shadow-drag slash-alpha, pointer tokens default, art tokens none.
3. Unregistered-id tests break: registry.test.ts:99 and theme.spec.ts:296-312 use `plum`.
4. Switch test + fixture prefs-theme-plum.json unspecified.
5. Radio order/count 5→6 (theme.spec.ts, dist-smoke) unspecified.
6. Contrast bullet (themes under test, TABLE rows, stop rule) missing; theme-art ARTS decision missing.
7. Screenshots spec (theme-plum.screens.spec.ts) unspecified.
8. "default baselines unchanged" contradicts sixth radio row; list Preferences baselines incl. theme-steampunk-preferences.
9. build-output.spec plum-absent assertion breaks.
### Minor (to apply, within budget)
- hitl/entry fields, References, Notes; Hue alone, dark first frame, budget, owner gate split; Surfaces/TH-9 with no art.
### Default applied (technical)
- Unregistered-id coverage — retarget unit test to 'nonesuch'; drop the e2e Halted test (plan records other coverage) → default applied
- theme-art ARTS — plum not added (no art) → default applied
Words: 1067 (6.8 x pass 0, within budget 1500)  |  Snapshot: story-theme-plum-dusk.review-log.passes/pass1.md
Fixer applied items 1-13 (all majors and minors); no commands touched beyond cited names (read-checked).
