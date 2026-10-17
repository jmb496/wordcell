# Review log — story-tricky-rules-section.md

State: pass 3: done

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

## Pass 2 — 2026-10-16 22:10
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4 (merged), minor 9, decision-needed 0  |  Dropped in triage: 0
Words (docs): 940 before fix (over budget)
### Applied (to fixer)
- [major] scene (b) needs two carries but Scene.carry is single: per-step carry override (or carries by drop command) in Interface, script/test pin each grab/drop to its fixture drop command
- [major] stage drawing: positions of cells 3, 4, 5 (top card + number, from frame 0), Undo control and its target/accessible text, reset motion kind, whether a cell dims in the frame its letter is added, scene (a) self-drop landing at the tail's home
- [major] frames vs steps mismatch in (a) and (c): fold or add frames so frames = steps + 1 or name the exception; Next click count
- [major] `n` and the Validate state per frame undefined: define n; frame validate follows `validatable`
- [minor, no added words] scene (b) empty column: use the listed column; DICT claim: state inert (scenes never validate) or drop; R-14/Q-34 out of the Names list
### Default applied (technical)
- Per-step carry override; Undo drawn as a scene control; frame validate follows fixture `validatable`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none. Minors deferred (document over budget, they add words): (b) `validatable` list, id-to-key map in test, `after` wording, baseline names, panel placement clause, scene (c) empty-column rationale.
Words (docs): 935 (3.9 x pass 0, over budget)  |  Snapshot: story-tricky-rules-section.passes/pass2.md. Fixer verified scene (b) by replay; stage positions, Undo control and cell-dim timing unverified (plan time).

## Pass 3 — 2026-10-16 22:40
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (found none)  |  Findings: major 2, minor ~13 (several no-change/cosmetic), decision-needed 0  |  Dropped in triage: 0
Words (docs): 935 before fix (over budget)
### Applied (to fixer)
- [major] positions of cells 3, 4, 5 and the Undo control unspecified (Scene.svelte draws only cell 6): default reuse place.ts `cellPoint(n)`; Undo in the stage header row; exact placement settled at the plan checkpoint, marked `unverified`
- [major] scene (c) has no `validatable` entries and (b)'s is "listed per count": list both, verified by replay
- [minor, no net words] `.cell6.used` reuse via a shared `.cell.used` class; steps without `carry` use `Scene.carry`
### Default applied (technical)
- Cell placement via place.ts `cellPoint`; Undo in stage header row
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none; remaining minors deferred (over budget, or cosmetic): Verify/Tests drift, rejected-`after` negative, Q-31 index clause, loop-restart wording, scene (a) move target id, key-not-position caption lookup, baseline-scope plan check.
Words (docs): 925 (3.9 x pass 0, over budget)  |  Snapshot: story-tricky-rules-section.passes/pass3.md. validatable values replay-verified; cell/Undo placement unverified (plan time).
