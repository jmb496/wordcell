# Review log — story-theme-greenhouse-dusk.md (ticket 9.8)

State: done

Pre-loop: HEAD 9947662a4632848bbbdaa02e7d7352b43768a32c; pass 0 copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-greenhouse-dusk.review-log.passes/pass0.md (171 words by wc -w incl. frontmatter); budget 1500 words (stub being fleshed out, as 9.7).
Note: no epic-themes SPEC.md exists (no companions); refs are the epic file, spine, AGENTS.md, game-flow-spec, DESIGN/EXPERIENCE, brief, done-ticket plans 9.5-9.7.

## Pass 1 — 2026-10-19
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings (merged, deduplicated): major 11, minor 3, decision-needed 0  |  Dropped in triage: 1 (green accent decision-needed: already answered by the epic's 2026-10-18 owner decision)
Words: 1501 (8.8 x pass 0; budget 1500)  |  Snapshot: story-theme-greenhouse-dusk.review-log.passes/pass1.md
### Applied (all technical, default applied)
- [major] Registry: test-only garden → production gardenTheme (testGarden, garden.css, TOKEN_FILES, contrast/registry tests, label 'Greenhouse Dusk') → item 1
- [major] Radio order default, scifi, garden, paper; theme.spec/dist-smoke order → item 2
- [major] "Default baselines unchanged" false (added radio row) → item 3
- [major] Tokens block (brief §B, color-scheme dark, scrim, internal tokens) → item 4
- [major] Art pinned (64 px/8 %, 6 px/3 %, 9.5 grammar) → item 5
- [major] Pixel/worst-point failure policy (thin margin) → item 6
- [major] Meta #101A14 and first-frame tint → item 7
- [major] Switch and Registry ACs → item 8
- [major] build-output retarget → item 9
- [major] Screenshot spec, fixture, Hue-alone with 2026-10-18 decision → item 10
- [minor] Surfaces, Budget, DESIGN.md deferral, Owner gate, References, entry-8 fields (risk, done_checkpoint, hitl) → item 11
### Dropped
- Green accent as decision-needed: epic Notes record the owner decision of 2026-10-18.
Fixer flagged unverified: attribution of garden's radio position to the 2026-10-19 decision (that decision concerned Deep Space; garden's position follows spec §7.10).

## Pass 2 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings (merged): major 1, minor 8, decision-needed 0  |  Dropped in triage: 2 (minor no-change items: meta hex case, ref-alignment clean)
Words: 1475 (8.6 x pass 0)  |  Snapshot: story-theme-greenhouse-dusk.review-log.passes/pass2.md
### Applied (default applied, technical)
- [major] Default baselines: screenshot suite runs the dev server, which already registers testGarden, so the real change is relabel Garden → Greenhouse Dusk and reorder to third, not an added row → fixer item 1
- [minor] contrast.test.ts garden-sheet read/merge/two-key assertion deleted; art test renamed → 2
- [minor] Art conversion pinned to themes.mjs geometry, widths, opacities → 3
- [minor] Stale test-only-garden comments listed → 4
- [minor] Optional seed test cut; owner-done duplicates cut; Notes radio-position attribution fixed; build-output list note → 5–8
Majors so far: 11, 1.

## Pass 3 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 8 (not applied), decision-needed 0  |  Dropped in triage: 0
Words: 1475 (unchanged; no fix run)

## Result — converged after 3 passes
Majors per pass: 11, 1, 0. No decision-needed items. Technical defaults applied: 20 (pass 1: 11 majors + 3 minors; pass 2: 1 major + 5 minors).
### Unapplied minors (for the build's plan)
- Contrast AC lost the "thin margin 13.25 vs 13.1" clause in pass 2 (the blocked-run rule stands).
- Registry: replace "the plan decides whether start() stays" with "start() is removed; `void boot()` runs directly".
- Art: add "single-quoted attributes" (parseArt rejects double quotes); "only their comments say 6 % and 5 %" → "only the themes.mjs comments".
- Screenshots: name theme-garden-<shot>.png and assert `dataset.theme` 'garden' (plus dictionary ready) before board/tray shots, as theme-scifi.screens.spec.ts; this also covers the otherwise untested prefs-theme-garden fixture.
- Tokens: write `--wc-shadow-drag` as the literal `rgb(0 0 0 / 0.35)` (the default is `#0008`).
- Registry: "unregistered-id examples stay `plum` and `steampunk`" is wrong for steampunk (only `plum` is used, registry.test.ts ~77, theme.spec.ts ~248).
