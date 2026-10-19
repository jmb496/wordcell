# Review log — story-theme-plum-dusk.md

State: done

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

## Pass 2 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3 (after merge), minor 6, decision-needed 0  |  Dropped in triage: 3
### Majors (to apply)
1. Contrast bullet says "at its floor" but cites DESIGN.md figures (9.9, 3.2) as if floors; enforced floors are 4.5 and 3 (contrast.test.ts rows 65/71); stop rule fires on floor failure only.
2. Tokens bullet: plum block must declare all 18 colour tokens plus `--wc-shadow-drag` and the three `--wc-scene-pointer-*` (key-set check "missing key"); art keys exempt.
3. Unregistered example bullet leaves Halted coverage as "or notes none": state a firm default.
### Minor (to apply; word-neutral where possible)
- `'nonesuch' as ThemeId` cast and message literal; case convention (app.css lowercase per brief, meta uppercase); radio-order titles enumerating themes updated in both files; sixth row sheet-height → owner-review item, no layout change; build-output flips `plumSelector` to true; screenshot names.
### Default applied (technical)
- Halted e2e coverage — retire the e2e test; remaining coverage = registry.test.ts throw + shell halted cases; plan names it and flags the dropped e2e for owner review.
### Dropped
- Platform-variant baselines (adversarial): snapshots are android-only (verified).
- Toml verify wording drift, brief-source cite for thin rows, front-matter `after`/TH-9, back-to-Charcoal --wc-table assert, references additions, plum-unique build marker: stretch/non-gating, not applied.
Words: 1202 (7.7 x pass 0, within budget 1500)  |  Snapshot: story-theme-plum-dusk.review-log.passes/pass2.md
Fixer applied items 1-8; applyTheme typing checked (cast needed); theme.spec/dist-smoke title line numbers not re-checked by fixer.

## Pass 3 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1 (merged from 3 reports), minor 6, decision-needed 0  |  Dropped in triage: 2
### Majors (to apply)
1. Unregistered example bullet claims the Halted boot path "stays covered" by registry.test.ts and prefs.svelte.test.ts; neither tests boot-time registry-miss → AD-15 Halted, default look, prefs untouched (only the retired e2e did). Fix: state the loss precisely, make it an owner-gate item, do not claim coverage.
### Minor (to apply)
- Radio order: only dist-smoke ~l.58 title enumerates themes (theme.spec ~l.125 does not); theme.spec.ts l.9 header comment "five" → "six"; dist-smoke replace the steampunk pick and its assertions.
- Build output: new title and rewrite the stale "each later theme ticket edits the absent list" comment; plumSelector true.
- Contrast: "thinnest against the DESIGN.md figures"; plan records smallest margin to enforced floors from the run.
- Tokens: copy the same literal text the steampunk block uses.
- Acceptance: note toml "default baselines unchanged" is read as unchanged except the Preferences Theme-group row.
### Default applied (technical)
- Halted boot-path coverage — retire e2e, record loss as owner-gate item → default applied
### Dropped
- registry.test.ts "only id and message change" (obvious); fix-diff line-number item merged into minor above.
Words: 1302 (8.3 x pass 0, within budget 1500)  |  Snapshot: story-theme-plum-dusk.review-log.passes/pass3.md
Fixer applied items 1-6.

## Pass 4 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 5, decision-needed 0  |  Dropped in triage: 0
Words: 1302 (unchanged, no fix pass)  |  Snapshot: passes/pass3.md
### Minor (not applied)
- Remove orphaned helpers/imports in e2e/theme.spec.ts after retiring the Halted test (reviewers found storedPrefs/CHARCOAL still used elsewhere; lint confirms).
- registry.test.ts retarget: only id literal and message change; title and nothing-changed assertions stay.
- dist-smoke: give the line range of the steampunk pick (~79-90) or say "the pick that follows".
- Dropped-coverage statement is repeated in the Unregistered example and Owner gate bullets; keep one.


## Result — converged after 4 passes
Majors per pass: 9, 3, 1, 0. No decision-needed items. Technical defaults applied: 2 (Halted e2e test retired with the loss recorded for the owner gate; plum not added to theme-art ARTS). Words 157 → 1302 (budget 1500).
