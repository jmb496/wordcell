# Review log — story-tricky-rules-section.md

State: pass 1: done

Pre-loop: HEAD 9482609cbbf2f875dbda9facacd20568a2a352bb, 238 words (pass 0 copy: story-tricky-rules-section.passes/pass0.md). Growth budget 2.5x = ~595 words (default). Note: no epic-8 SPEC.md exists under _bmad-output/specs/; the epic file is the requirement source. Ticket toml fields (entry 4: description, verify, covers, interface, tests, owns, unknown, references) are in story-tricky-rules-section.passes/toml-fields.md, passed to reviewers and fixer as intent; fixer adds them to the Description in pass 1.

## Pass 1 — 2026-10-16 21:45
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9 (merged from 4 reviewers), minor 5, decision-needed 0  |  Dropped in triage: 1 (stray "longer than the ticket's?" note in toml-fields.md, not copied)
Words (docs): 940 (3.9 x pass 0; OVER the 2.5x budget, so from here minors only if the fix adds no words)  |  Snapshot: story-tricky-rules-section.passes/pass1.md
Fixer verified scenes (a)(b)(c) through replayScene; Q-30 left out of rules ref (not used).
### Applied (to fixer)
- [major] scene (b) start: §8 has no T/A cell and no empty column; own hand-built start (columns, cells, an empty column), engine-verified, BAT legal
- [major] scene (b) two halves: one fixture, sequential halves, board reset between (undo or disjoint cards), reduced-motion resting frame = half 2
- [major] scene (b) half 1 word/moves/k and the "same word" relation unstated
- [major] rejected cases not tied to TABLE rows: empty-destination = setDestinationCount k 1 on empty column, throw r31-set-count-empty-destination (R-31 row); half 1 partial self-drop k 0 r31-destination-count only if half 1 is a self-drop; r33 duplicate throw after the addFreeLetter, `after` index; row cites
- [major] scene (c) start (cell 5 with S on top, a card beneath), drop, word, addFreeLetter cell 5; second tap = commandless tap step
- [major] scene (a) commands: self-drop 1/4/1, arrange to FAKED; leave-and-return or tap-select so it is not a Q-34 cancel (R-14); words/validatable
- [major] dim and no-dispatch second tap: Frame/script field reusing existing `used` state, UI unit test (AD-n)
- [major] missing 8.1–8.3 detail: fixture names, text.ts heading "Tricky rules" and howTo.scenes keys, frames/steps, Tests line, FIXTURES + DICT (faked, bat), reduced-motion Next to last frame, Docker screens baselines for three final frames, panel order after basics, size budget
- [major] captions check: compare rendered caption to the text.ts value; text.ts strings verbatim from epic Notes 2026-10-17
- [minor] Q-12/Q-27/R-14/Q-34 in rules reference; toml fields into Description; plan checkpoint confirms scene (b) layout
### Default applied (technical)
- Scene (b) layout: halves in sequence on one figure, one fixture, not side by side → owner confirms the look at the plan checkpoint
- Rejected-case rows and fixture/key names as listed above
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- toml-fields stray note
