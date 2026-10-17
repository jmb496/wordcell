# Review log — Rework sweep: docs, budget and cleanup (ticket 8.11)

State: pass 1: done
Pre-loop: HEAD 7ea1ccf, 135 words, copy at story-rework-sweep-docs-budget-and-cleanup.passes/pass0.md. Budget 1500 words.
Toml fields to carry into the Description in pass 1: verify (present as Acceptance Criteria), risk low (present), references (present), hitl = false, done_checkpoint = true.

## Pass 1 — 2026-10-17
Reviewers: builder, edge-case, adversarial, ref alignment  |  Findings: major 9 (merged), minor ~8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 749 (5.5 x pass 0; budget 1500)  |  Snapshot: story-rework-sweep-docs-budget-and-cleanup.passes/pass1.md
### Applied
- [major] Removal inventory: name the leftovers 8.10 handed over (Frame.used, .cell.used, Step.carry/Carry.lifts 'dest', Undo pill, harness rejected support, sourceDrop e2e used row, stale comments) plus a zero-importer check
- [major] EXPERIENCE.md How to play edits listed (stale lines ~51, ~166, 448-475: carousel, arrows, dots, one Tricky rule, no in-panel navigation sentence)
- [major] Size measure = AD-18 gzip total from size-budget.mjs, margin recorded in plan Notes with HEAD
- [major] text.ts list: diff base, location, removed keys separate, owner captions unedited
- [major] Baselines: Docker only, one final frame per scene, orphans (scene-4-start) resolved
- [major] Owner marks done; build stops at built (done_checkpoint)
- [major] HP-7/HP-3/HP-4 superseded: annotate; HP-to-test mapping survives deletions
- [major] Test removal bounded to tests of deleted subjects
- [major] Approach/order and Always/Never (no behaviour/engine change; edit, test:all, margin, test:screens); toml fields hitl/done_checkpoint
### Default applied (technical)
- measure, detection method, diff base, baseline policy → defaults as above
