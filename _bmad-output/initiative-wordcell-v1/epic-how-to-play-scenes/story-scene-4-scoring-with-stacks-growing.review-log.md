# Review log — story-scene-4-scoring-with-stacks-growing.md
State: pass 3: done
Pre-loop: HEAD 33be4a6, 101 words (pass0.md); budget 1500 words.

## Pass 1 — 2026-10-17
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 8 (merged), minor 3, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words: 937 (~9x pass 0; within 1500 budget)  |  Snapshot: story-scene-4-scoring-with-stacks-growing.passes/pass1.md
### Applied
- [major] growth choreography, order/taps/ghost, reduced-motion frames, restart/loop, QU cards-vs-letters, tests/Interface/Owns, boundary → fixer items 1-7
- [minor] caption unchanged note, references (R-52, R-65, Q-06), covers comment → item 8
### Default applied (technical)
- growth start look = top cards only (epic: "starts as the game looks"), cell order 3,4,6, ghost taps top card, QU keeps x2 badge with no extra emphasis, no new FACTOR kind, Step.grows with n-1 slices
### Decision needed
- none (epic 2026-10-17 supplies the intent)
### Dropped
- none

## Pass 2 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 6 (merged), minor 7, decision-needed 0  |  Dropped: 0
Words: 1432 (~14x pass 0; budget 1500)  |  Snapshot: story-scene-4-scoring-with-stacks-growing.passes/pass2.md
### Applied
- [major] Stage/Scene grow contract; Playwright assertions via opacity/boxes not card counts; unit vs layout split; defineScene check list; false play-on-open claim; restart test definition
- [minor] timing/loop length, baseline name, test ids, ghost rest, negative regexp, Notes interleave default
### Default applied (technical)
- Stage optional grow prop; wrappers with data-scene-el; SSR body test for order
### Decision needed
- none

## Pass 3 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 6 (merged), minor ~9, decision-needed 1  |  Dropped: 0
Words: 1456 (~14.4x pass 0; budget 1500)  |  Snapshot: story-scene-4-scoring-with-stacks-growing.passes/pass3.md
### Applied
- [major] animation matcher (element vs step id); wrong timing numbers (overlay = 0.5 multiple); Playwright sync points (scoring-rest, single evaluate in wait hold); pause/restart claim reworded; Q-06 badge strip assertion; reduced-motion toggle test and mode-split loop sentence
- [minor] Stage base style source, .mini reference, 0.5 px, edit helper negative, j wording, defineScene length
### Decision needed (functionality / UX / gameplay)
- Order per cell — interleaved (grow cell, then its figure) vs all stacks first, then 9, 16, 36, total — proposed default: interleaved; practical effect: pacing/teaching order the viewer sees; owner may choose at epic-end review. Left in ticket Notes as PROPOSED BY REVIEW.
