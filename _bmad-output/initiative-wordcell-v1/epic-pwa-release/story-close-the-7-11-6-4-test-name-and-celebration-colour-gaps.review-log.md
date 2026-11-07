# Review log — story-close-the-7-11-6-4-test-name-and-celebration-colour-gaps.md (ticket 7.15)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 243 words, `.passes/pass0.md`, HEAD b8aaf11.

## Pass 1 — 2026-11-07 10:40
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 4, decision-needed 0  |  Dropped in triage: 2 (plus duplicates merged)
Words (docs): 482 (1.98 x pass 0)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 9 applied (also added hover-peek-reanchor.spec.ts to References); no commands touched.
### Applied
- [major] Description (2) "mid-run" — the source proposal's two sample points were dropped; one arbitrary sample can read only hidden copies → fixer item 1 (default applied: manual clock, sample at the first step a group is shown and at a later step before the cap, shown copies only)
- [major] Description (2) "its live card face" — copies carry no card id, letters repeat; pairing unstated → fixer item 2 (default applied: every live `[data-card-id]` face on the won board shares one computed value set; each shown copy is compared with it)
- [major] Description (2) properties — own-element `filter` misses a filter/blend on the group or root (the run writes to groups each frame); edge and texture omitted → fixer item 3 (default applied: group and root `filter` none, `mix-blend-mode` normal; add `border-color`, `background-image`)
- [major] Description (1) responsive half — no test named, the 7.11 example (how-to-play-desktop:50) checks the How to play panel, not the board; no existing desktop board-widening test except `e2e/hover-peek-reanchor.spec.ts:83` → fixer item 4 (default applied: retitle that test)
- [major] Description / AC — epic 10 `rule-coverage.md:61` still lists "no colour change" as a visual exemption, which the §6.4 sentence-level audit reads; "Test-only" forbids fixing it → fixer item 5 (default applied: this ticket moves that line to a mapped row)
- [minor] Description (1) — id position in titles (AGENTS.md: names start with the id) → fixer item 6
- [minor] AC — grep cannot show a pass → fixer item 7
- [minor] Description (2) — project/describe and helpers unnamed → fixer item 8
- [minor] Description (2) — QU badge colours not compared → fixer item 9
### Default applied (technical)
- Description (2) — sample timing → two manual-clock samples of shown copies
- Description (2) — copy-to-face pairing → uniform live-face reference
- Description (1) — responsive-half test → `e2e/hover-peek-reanchor.spec.ts:83` retitled `Q-17 AD-12 …`
- Description — stale epic 10 Exempt line → moved by this ticket (SPEC-dir doc edit; still no `src/` change)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Theme coverage (adversarial, stretch): copies and live faces read the same `--wc-card-*` tokens; one theme suffices.
- tickets.toml entry 15 duplicates the story text (adversarial): out of this loop's one-file scope; the caller syncs tickets.toml at mark-done (listed in Result).

## Pass 2 — 2026-11-07 11:05
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 6, decision-needed 0  |  Dropped in triage: 1 (plus duplicates merged)
Words (docs): 683 (2.81 x pass 0)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 9 applied; no commands touched.
### Applied
- [major] Description (2) samples — the second sample ("a later step before the run's cap") is undefined, may hold no shown copy (groups exit before the closing fade) and may not show the QU copy (JDAQUYE is group 1; the first sample shows only group 0's first copy) → fixer item 1 (all four reviewers)
- [major] Description (2) `background-image` — under the default Charcoal theme `--wc-card-texture` is `none`, so the comparison is vacuous → fixer item 2 (default applied: run with `prefs-theme-scifi`)
- [major] Description (3) "no trail" — `e2e/celebration.spec.ts:324` counts 55 copies only before the clock moves; a trail added mid-run passes → fixer item 3 (default applied: the new test re-counts at each sample and is named for "no trail" too)
- [minor] Description (2) bullet 1 — "computed value set" undefined until bullet 3 → fixer item 4
- [minor] Description (2) — glyph colour not compared → fixer item 5
- [minor] Description (3) — row shape (Capability cell, file's test-name convention) → fixer item 6
- [minor] Description intro — "test-only" in the owner decision vs the coverage-row edit: one clause of reason → fixer item 7
- [minor] Description intro — a failing premise (non-uniform live faces) is not a `src/` defect → fixer item 8
- [minor] AC — `✓` lines need the list reporter (`CI` unset, playwright.base.ts:18) → fixer item 9
### Default applied (technical)
- Description (2) — second sample → first step at which the QU copy is shown; each sample asserts ≥1 shown copy
- Description (2) — theme → `prefs-theme-scifi` (textured, Normal speed)
- Description (3) — "no trail" → new test re-counts 55 copies at each sample
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Ancestors of the celebration root up to `html` (adversarial, self-labelled stretch): a page-wide filter would change the live board too, outside R-87's copy clause.
- Code comment in hover-peek-reanchor.spec.ts marking its Q-17 assertions (adversarial minor): the Q-17 title itself carries that; no ticket words needed.
