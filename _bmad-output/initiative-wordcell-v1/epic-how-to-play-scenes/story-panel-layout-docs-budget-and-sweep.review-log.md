# Review log — story-panel-layout-docs-budget-and-sweep.md

State: pass 4: done (converged)

Pre-loop: HEAD 0c56071d749d350ed0fdcccd9604addf7a6c5409, 173 words (pass 0 copy: story-panel-layout-docs-budget-and-sweep.passes/pass0.md). Growth budget 2.5x = ~432 words (default). No epic-8 SPEC.md exists; the epic file is the requirement source. Ticket toml fields (entry 5) in .passes/toml-fields.md, passed as intent.

## Pass 1 — 2026-10-16
Words (docs): 488 (2.8 x pass 0; OVER the 2.5x budget: from here minors only if the fix adds no words)  |  Snapshot: story-panel-layout-docs-budget-and-sweep.passes/pass1.md
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from 4 reviewers), minor 4, decision-needed 0  |  Dropped in triage: 0 (all cited lines verified: EXPERIENCE.md 51/166/450-463, size-budget.mjs gzip AD-18, 9 baselines incl. example)
State: pass 4: done (converged)
### Applied (to fixer)
- [major] "anchors, scroll" undefined → default: drop; order = basics, Tricky rules, goal/table/undo/empty/scoring/controls; e2e DOM-order assertion
- [major] removal scope unlisted → default: name headings, howTo keys, example cards/CSS, tests; Controls stays; keep AD-14 invariant re-pointed
- [major] screenshots → delete example baseline, confirm 8 final-frame baselines, container only
- [major] budget measure/where recorded/over-budget → AD-18 gzip total from npm run build after final edits; margin in Notes; trim not raise
- [major] coverage audit format → HP-1..7 sentence→test table (file+title), gaps get tests here, reasons only for untestable
- [major] EXPERIENCE.md other spots (lines 51, 166, 450-463)
- [major] new-string list: baseline/location/format; owner captions untouched; ends at built, owner marks done
- [major] "ticket Notes" does not exist → add Notes section
- [minor] boundaries line; AD-18 + size-budget.mjs reference; methodology DoD in Verify; work order (edit, test:all, record margin, test:screens)
### Default applied (technical)
- 8 items above are technical defaults (panel order and Controls kept per HP-7 "remaining text").

## Pass 2 — 2026-10-16
Words (docs): 541 (3.1 x pass 0, over budget)  |  Snapshot: story-panel-layout-docs-budget-and-sweep.passes/pass2.md
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 6, decision-needed 0  |  Dropped in triage: 0 (merged duplicates of the "with the commit" and "under 600,000" minors)
State: pass 4: done (converged)
### Applied (to fixer)
- [major] screenshot "confirm" → add any missing final-frame baseline (5+3), generated only via test:screens
- [major] gap tests: Playwright android (Vitest if not UI-observable), AD-n names; "closed or hidden" panel (epic Done-when 3)
- [major] re-pointed AD-14 test: keep no data-card-id/testid/mirror in panel, 52 live cards, no overflow at 360px; drop .word/22-card/pan-y example checks
- [major] "full-panel baseline if layout changes" undefined → default none beyond the 8 finals; any source edit after the margin re-runs test:all and re-records
- [major] removal touchpoints: how-to-play.test.ts (9→7 headings), text.test.ts, e2e spec section.example, screens example test, EXAMPLE_WORDS, move/example/exampleIntro/exampleWords/exampleCaption keys
- [minor] "extend the existing e2e order test" (full h3/figcaption sequence); "at most 600,000"; margin recorded with HEAD hash of the measured build (drop "with the commit"); pause/restart tap asserted for all 8 scenes; new-string base = parent of first 8.1 code commit, table lists only remaining strings
### Default applied (technical)
- all items above

## Pass 3 — 2026-10-16
Words (docs): 541 (3.1 x pass 0, over budget)  |  Snapshot: story-panel-layout-docs-budget-and-sweep.passes/pass3.md
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (ref: none)  |  Findings: major 3, minor 6 (3 no-add applied), decision-needed 0  |  Dropped in triage: 0
State: pass 4: done (converged)
### Applied (to fixer)
- [major] text.ts removal list omits the `move` paragraphs array (text.ts ~93-98) → add (+few words)
- [major] gap-test names "starting with the AD-n id" contradicts AGENTS Conventions (R-id first, AD-n where none) → reword per convention
- [major] "no anchors, links or controls" contradicts scenes' Pause/Next/Replay and Close → "no anchors, links or in-panel navigation"
- [minor, no-add reword] coverage audit: map existing tests first, add only real gaps; HEAD hash = base commit of the measured working tree
### Not applied (minor, would add words)
- order-test naming (line 34 vs 466), example-cards unit test how-to-play.test.ts:67, HP-7/EXPERIENCE item 8 citation, new-strings note
### Default applied (technical)
- all items above

## Pass 4 — 2026-10-16
Reviewers: fix diff, adversarial (quick, late-pass bar)  |  Findings: major 0, minor 5, decision-needed 0  |  Dropped in triage: 0
Words (docs): 541 (3.1 x pass 0, over budget)  |  Snapshot: unchanged (passes/pass3.md)
No fix pass; minors not applied (each adds words past the growth budget).

## Result — converged after 4 passes

Majors per pass: 8, 5, 3, 0. Decision-needed: none. Technical defaults applied: all findings (panel order/Controls kept, anchors dropped, budget measure = AD-18 gzip total, baselines via test:screens only, naming per AGENTS Conventions).
### Unapplied minors (for the build or plan)
- HP-7 order/removal sentences map to the extended order test and the absent-headings test; only budget and owner review get a "reason".
- Screenshots: all 8 final-frame baselines already exist; the only change is deleting the example png and its spec.
- EXPERIENCE.md: find rows by grep not line number; renumber the outline after removing items 3 and 7.
- Removal list also covers how-to-play.test.ts:81 (static card count) and text.test.ts:275 (example captions); gate is check and test:all green with no stale references.
- New-strings diff: filter to `howTo` keys, attribute each to its ticket via git log.
- Order test: which existing test to extend (line 34 headings vs line 466); example-cards unit test how-to-play.test.ts:67; cite EXPERIENCE item 8 for Controls.
