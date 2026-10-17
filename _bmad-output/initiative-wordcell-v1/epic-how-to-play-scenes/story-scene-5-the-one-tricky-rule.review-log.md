# Review log — Scene 5: the one Tricky rule (ticket 8.10)

State: pass 1: done
Pre-loop: HEAD cf77609, 155 words, copy at story-scene-5-the-one-tricky-rule.passes/pass0.md. Budget 1500 words.
Toml fields to carry into the Description in pass 1: interface = "scene script and fixture; text.ts; removes the old Tricky rules scenes."; tests = "Engine replay (U); play (P6 android); screenshots."; owns = "Scene 5."; verify and risk (low) are already present; references = rules — docs/game-flow-spec.md, R-21, R-13.

## Pass 1 — 2026-10-17
Reviewers: builder, edge-case, adversarial, ref alignment  |  Findings: major 8 (merged), minor ~6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1190 (7.7 x pass 0; budget 1500)  |  Snapshot: story-scene-5-the-one-tricky-rule.passes/pass1.md
### Applied
- [major] Current state of existing source-drop scene unstated → fixer 1
- [major] Caption key/source, empty-column clause caption-only → 2
- [major] Removal scope not enumerated / no checkable verify → 3
- [major] 8.10 vs 8.11 cleanup split → 4
- [major] Carousel 7 → 5 (dots, tests, screens) → 5
- [major] Test mapping and screenshot baselines → 6
- [major] covers/HP-4 rework, references R-14 R-22 R-23 R-31 Q-11 Q-34 → 7
- [major] toml fields (interface, tests, owns, references) copied → 8
### Default applied (technical)
- 8.10/8.11 cleanup split → 8.10 deletes the removed scenes; 8.11 removes what then becomes unused (Frame.used, Undo pill, rejected)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
