# Review loop — ticket 6.5 build (code)
State: pass 1: done
Target: /mnt/d/CodeProjects/wordcell/_bmad-output/implementation-artifacts/review-loop/6-5-build.passes/pass0.diff (a1f53ab..44a6c0d42af7e0ceb0b4f5ded92a54cc27c0d93f); pre-loop HEAD 44a6c0d42af7e0ceb0b4f5ded92a54cc27c0d93f, tree ee8b870af21b367c47603983f9b55f9ed017b0a5
Intent: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-statistics-panel-history-flag-and-menu-dot-plan.md

## Pass 1 — 2026-10-15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 6, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 02cabb9cb41632f30730898e41360d0532efda4a
### Applied
- [major] e2e/statistics.spec.ts — Best vs Average indistinguishable → new inline-seeded test (best 100, average 76)
- [major] src/ui/StatisticsPanel.svelte — silent `?? 0` defaults (rule 6) → readable() throws if stats undefined
- [minor] Esc handlers order → preventDefault / defaultPrevented guard
- [minor] history-notice test loop trimmed
### Default applied (technical)
- Best/average fixture: inline JSON instead of a new fixtures/ file
### Decision needed (functionality / UX / gameplay)
- src/ui/text.ts tile labels and 'Close statistics' are builder-chosen copy outside the EXPERIENCE.md catalogue — owner to confirm wording — proposed default: keep
### Dropped
- none
### Unapplied minors
- one-letter longest word e2e: not seedable (parser rejects letterCount 1); covered by text.test.ts only
- dot element presence asserted only via aria-describedby; panel dismissal by back/scrim untested; focus-return optional-chaining
