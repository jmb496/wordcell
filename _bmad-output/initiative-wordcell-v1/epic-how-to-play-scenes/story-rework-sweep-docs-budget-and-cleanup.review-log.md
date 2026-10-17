# Review log — Rework sweep: docs, budget and cleanup (ticket 8.11)

State: pass 3: done
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

## Pass 2 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 5 (merged), minor ~9, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1047 (7.8 x pass 0; budget 1500)  |  Snapshot: story-rework-sweep-docs-budget-and-cleanup.passes/pass2.md
### Applied
- [major] `.cell.used` CSS must stay (cell6 'used' in scene 2 uses it); only the Frame.used markup/type and the e2e assertion go
- [major] Step.carry removal incomplete: script.ts validation, effects.ts dest mover/fly, scenes.test.ts step-carry test trimmed to scene-level carry; Scene.carry stays
- [major] Zero-importer rule undefined for test-only or removed-code-only references (fixed point); symbol locations wrong (UNDO_BOX geometry.ts, undoTarget tray-scene.ts, 'undo' tap in script.ts)
- [major] `rejected` removal unnamed: scene-replay.ts field/type/loop and the how-to-play-scenes.test.ts tests; rejectedWords stays; HP-5 annotated
- [major] Epic annotation list omits HP-1 (no other visible buttons)
- [minor] e2e helper rule, 412f96e wording, margin hash = last src/fixtures/config commit, toml "under" vs "at most" note, text.ts renames, Scenes paragraph and Next scene vs Next control naming, HP superseded mapping
### Default applied (technical)
- all of the above → reviewers' proposed defaults

## Pass 3 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 5 (merged), minor ~8, decision-needed 0 (1 reclassified technical)  |  Dropped in triage: 0
Words (docs): 1308 (9.7 x pass 0; budget 1500)  |  Snapshot: story-rework-sweep-docs-budget-and-cleanup.passes/pass3.md
### Applied
- [major] Frame.used tests in scenes.test.ts (~1056, ~1090, field ~1003) named for deletion
- [major] rejected: delete the 469-488 test whole, in the index-range test drop only the two rejected rows; EngineError import and other orphaned imports/locals (miniCells/MINI_CELLS, flownAt, carries.dest, mover union) go too; add "no unused local, constant, import or comment in touched files"
- [major] "carry differs" throw stays asserted: rewrite the mutation to override scene.carry
- [major] Margin recorded against base HEAD plus working tree (8.5 precedent), not a commit hash that may not exist yet
- [major] howTo key reference counting through local aliases (h., labels., controls.); the test-only scenes[key] read does not keep a key alive; typecheck after each deletion
- [minor] comments in any file naming removed items; text.ts base wording (68b5c41 changes text.ts); array-valued vs boolean `used` in e2e rows; baselines checked via test:screens
### Default applied (technical)
- Epic annotation wording for HP-1/HP-5/Done-when: ref-alignment flagged as decision-needed (owner decision names only HP-3, HP-4, HP-7 layout). Reclassified technical: documentation traceability only, no product change; default wording "no longer exercised by the five-scene carousel (2026-10-17 rework)" instead of "superseded".
