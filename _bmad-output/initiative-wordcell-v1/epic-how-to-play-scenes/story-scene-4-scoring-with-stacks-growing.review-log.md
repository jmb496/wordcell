# Review log — story-scene-4-scoring-with-stacks-growing.md
State: pass 4: done
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

## Pass 4 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 0, minor ~14, decision-needed 1 (already logged, pass 3)  |  Dropped: 0
Words: 1456 (no fix pass)
### Decision needed
- Interleaved vs stacks-first order (re-raised by adversarial; same item as pass 3).

## Result — converged after 4 passes

Unapplied minors (for the build plan): pin of Stage base style vs t=0 keyframes: say it runs on SSR body(scoringScene) with one px-string helper; -0 vs 0 in keyframe assertions (compare strings/parsed); name 'HP-2 …' test with an AD-14 id (AGENTS naming); opacity step keyframes as duplicated offsets at o_m; defineScene: grows.cell vs step target, ungrown fixture cell; restart read window is 4 multiples; filter 'only scoring-rest running' by id prefix `scoring-` and playState; stack-height clause of the layout check is near-trivial (keep cell 6 last-card box); locator for reduced-motion card counts; engine negative overlaps the +1 loop (keep as QU regression); start-frame screenshot needs its own test (no Next clicks) and Docker generation; step-length formula wait + max(phase 0 times) + 0.5; frame-0 look identical in both modes (box heights not compared).

# Review loop 2 (after owner decision 2026-10-17: stacks first, then figures, then total)
State: A2 pass 1: done
Pre-loop 2: HEAD a8ce76e, 1516 words (passes/a2-pass0.md); budget 1500 words is exceeded by the owner-ordered rewrite (1685 words, passes/a2-pass1-rewrite.md); minors that add words are held back.
Rewrite step (fixer, before pass 1 review): Order, stacks first; steps 0-2 grow cells 3, 4, 6, step 2 reveals the three figures (Step.reveal.show may be an array), step 3 the total; timings 23 + rest 6 = 29; reduced motion six frames, new optional Frame.stacks; tests updated; interleaved wording removed.

## A2 Pass 1 — 2026-10-17
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 4 (merged), minor ~9, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; stretch minors 8-10 of adversarial not applied)
Words: 1822 (1.2x loop-2 pass 0; over the 1500 budget after the owner-ordered rewrite)  |  Snapshot: passes/a2-pass1.md
### Applied
- [major] reduced-motion e2e test goes to 6 frames (loop, figure and total conditions) → item 1
- [major] screens spec scoring entry `[4,'scoring',5]` → item 2
- [major] nonexistent "Previous" frame control (Next and Replay only) → item 3
- [major] motion-on final-state read race vs rest reset: sync, pause, one evaluate → items 4, 12
- [minor] ghost wording, test rename to AD-14, k/stacks/numbers definitions and scenes.test pin, arrange keeps string show, step length formula, step 1 start 6 multiples and resize poll timeout, tautological clause dropped → items 5-11
### Default applied (technical)
- pause-then-read for final-state assertions; Frame.stacks per-frame values 0,1,2,3,3,3; arrange step rejects array show
### Decision needed
- none
### Dropped / not applied
- n<2 grows throw, paint-order dependency note, engine negative "regression-only" label (over budget, no practical effect)
