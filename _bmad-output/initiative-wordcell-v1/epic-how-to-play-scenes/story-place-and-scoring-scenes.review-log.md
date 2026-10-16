# Review log — story-place-and-scoring-scenes.md

State: pass 1: done

Pre-loop: HEAD 3ee207aa10e7b40100164b89d37db81a4648ce24, 158 words (pass 0 copy: story-place-and-scoring-scenes.passes/pass0.md). Growth budget 2.5x = ~395 words (default). Note: no epic-8 SPEC.md exists under _bmad-output/specs/; the epic file is the requirement source. Ticket toml fields interface/tests/owns (entry 3 of tickets.toml) are passed to reviewers and fixer as intent; fixer adds them to the Description in pass 1.

## Pass 1 — 2026-10-16
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from 4 reviewers), minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; R-36 mis-citation confirmed: R-36 is the 3-letter floor, QU = 2 is Q-06/R-80)
### Applied (to fixer)
- [major] toml fields interface/tests/owns absent from Description
- [major] scene 4 start and command list (compose chain, then setTarget 5, setTarget 6, setPlacementOrder, confirm; R-42 pre-selects 6 via validate; words entries; DICT {'baked','balked'})
- [major] placement order as startOf CardIds bottom-to-top D B A L K E ('front' = bottom, R-51; E top, R-52); cell 6 holds exactly BALKED after confirm, L used (R-41, R-60)
- [major] SceneFixture has no field for cell contents/placement/target/per-cell numbers: add optional assertion(s) to scene-replay.ts (Interface), range-checked, with negatives
- [major] scene 5 start (cells-only, commands [], scores after 0 = 61; C A T / QU I T / B A L K E D bottom to top; QU encoded 'QU'; per-cell 9, 16, 36 asserted; order of BALKED consistent with scene 4)
- [major] frame list, Frame field additions, step→command mapping (tap=setTarget, drag=setPlacementOrder, Confirm=confirm), final frames, new static visuals
- [major] captions verbatim from epic Notes in howTo.scenes (place, scoring), fixture filenames
- [major] tests: reduced-motion Next step-through (P6 android), negatives (61→62, order, per-cell number, out-of-range), script-vs-fixture, test-name ids
- [minor] references (8.1/8.2 continuity, code, AD-1, Q-06; R-36 floor only); dictionary note (scene 5 none)
### Default applied (technical)
- Scene 5 animation within approved HP-3e: per-cell numbers reveal one by one then total; reduced motion steps the same frames
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 658 (4.2x pass 0, over the 2.5x budget: from pass 2 minors go to the fixer only when they add no words); snapshot story-place-and-scoring-scenes.passes/pass1.md. All 8 majors and the minors applied. Fixer ran temporary replays of scene 4 commands (incl. confirm) and scene 5 start through the engine: pass (temp test deleted). Deviation: scene 5 needs one undrawn `Z` column card because the engine start throws `start-no-column-card` on an empty board.
