# Review log — story-compose-and-destination-block-scenes.md

State: pass 1: done

Pre-loop: HEAD d9895643d34c0c46ca3e99c54160884a86aa4b07, 143 words (pass 0 copy: story-compose-and-destination-block-scenes.passes/pass0.md). Growth budget 2.5x = ~357 words (default). Note: no epic-8 SPEC.md exists under _bmad-output/specs/; the epic file is the requirement source.

## Pass 1 — 2026-10-16
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from 4 reviewers), minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied (to fixer)
- [major] toml fields interface/tests/owns (and consumers-equivalent) absent from Description
- [major] STAPE is not a dictionary word: it is a structural intermediate asserted as the live word string, never dictionary-checked; non-word negative targets a validated word (BALKED)
- [major] "Validate stays enabled for STAPE": no fixture field or assertion; needs an optional fixture field checked against the engine view's canValidate (R-38) plus script-vs-fixture match
- [major] scene 2 start and command list (§8 start, drop, arrange A K E D, add free letter L with insertion so the word is A L K E D, validate)
- [major] scene 3 mini-board start (columns, no cells) and commands (drop, +, +, flip) with words APE, STAPE, PEATS
- [major] frame list and final frame per scene, reduced-motion Next step-through, baselines under reduced motion
- [major] approved captions not in the ticket (epic Notes); quote or cite them verbatim
- [major] new static visuals and tap targets (WordCell row, Validate, −/+, Flip, locked block) undefined
- [minor] references R-10, R-20, R-23, R-31, R-32 + 8.1 continuity; reuse 8.1 negatives; duplicate L note; test-name ids
### Default applied (technical)
- Scene 2 final frame: Validate pressed, tray stays open (no Place; scene 4 covers it) → epic HP-3b ends at "tap Validate"
- Validate-enabled as optional fixture field checked against the view flag → default
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 532 (3.7x pass 0, over the 2.5x budget: from pass 2 minors go to the fixer only when they add no words); snapshot story-compose-and-destination-block-scenes.passes/pass1.md. All 8 majors and the applicable minors applied. Unverified by the fixer: scene 3 word strings (APE, TAPE, STAPE, PEATS) derived from R-30 to R-32, not run through the engine; dictionary membership of balked/peats checked in generated/dictionary/en.txt.
