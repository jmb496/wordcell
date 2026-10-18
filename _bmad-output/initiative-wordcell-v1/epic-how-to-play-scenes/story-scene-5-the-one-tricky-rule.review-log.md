# Review log — Scene 5: the one Tricky rule (ticket 8.10)

State: pass 4: done
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

## Pass 2 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 6 (merged), minor ~8, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1443 (9.3 x pass 0; budget 1500)  |  Snapshot: story-scene-5-the-one-tricky-rule.passes/pass2.md
### Applied
- [major] AC grep vs kept e2e `trickyScenes` local → rename to `sourceDropRows`
- [major] false claim about `i < 7` loops (scene-1 frame counts) → rule + checkable grep
- [major] e2e tests on old last/second-last scenes re-pointed in place
- [major] scene-5 baseline will differ (figcaption inside figure) → regenerate in Docker
- [major] false claim about grep matching comments → removed; comment cleanup stated
- [major] engine harness rejected-case tests removed with fixtures; support left to 8.11
- minors: Next arrow vs in-scene Next wording, Q-34 conditional, literal caption assertion, a11y note, 8.11 hand-off
### Default applied (technical)
- e2e local rename → `sourceDropRows`; rejected-path harness left to 8.11
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 1, minor ~12, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1452 (9.4 x pass 0; budget 1500)  |  Snapshot: story-scene-5-the-one-tricky-rule.passes/pass3.md
### Applied
- [major] Removal bullet would delete the engine k/side `it.each` wholesale, losing source-drop's block check → keep with source-drop row only
- minors: false carousel.test count claim, scenes.test k/side rows, R-22/R-23 coverage wording, frameDest form, caption literal test named, replay command run (61 pass), Frame.cell6 stays
### Default applied (technical)
- engine generic tables stay with source-drop row only
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- AC grep widening (dangling identifiers fail check/lint anyway); showScene note (no change needed)

## Pass 4 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 0, minor 10, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1452 (no fix pass; budget 1500)  |  Snapshot: pass3.md (unchanged)
### Applied
- none (no majors; minors not applied, over budget)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 4 passes (majors per pass 8, 6, 1, 0)

Words 155 -> 1452. Unapplied minors for the build plan: "61 tests today" in the AC will fall with the removed cases; grep does not match bare `'top-card-'` prefixes in e2e (rapid-switch test ~1135/1145 re-pointed per Description); name the 3 rejected-specific engine tests rather than line range ~598-631 (fix "whole the" typo); drop 'bat'/'sat' from DICT in the engine test; scene 5 caption literal as a separate `it` or renamed title; screens baseline regeneration is a precondition of test:screens green; text.ts ~346 comment is reworded (heads kept sourceDrop key), not removed; epic file Done-when/HP-4/HP-5 wording still says three Tricky scenes (rework Note reconciles; 8.11 may tidy); tickets.toml entry 11 description to narrow when published; scattered screens-spec edits could be one sentence.
