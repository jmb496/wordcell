# Review log — story-refactor-sweep-code (ticket 5.14)

State: pass 2: done

Pre-loop: HEAD 429584a, 282 words (copy: /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-refactor-sweep-code.review-log.passes/pass0.md). Budget 1500 words.

## Pass 1 — 2026-10-14
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 10 (merged), minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied (fixer items 1–15)
- [major] Verify "unedited" contradicts S3/S5/S18/S19/S20 edits
- [major] S6/S7 screenshot baselines: no rendered change; a needed baseline change stops the build (default applied)
- [major] S7 set/pass condition undefined; grep at HEAD finds no non-comment `transition` in src (verified)
- [major] S2 record-only default (default applied)
- [major] S1 helper list, differing copies (faceOf/holdThrough/expectFlownBack), `plus` clash (verified tile-tap.spec.ts:26), box dedupe
- [major] S19 refit fractional width default, path src/ui/tray/WordLine.svelte, regression test
- [major] S3 target moved to src/shell/stored-key.ts:17 (verified)
- [major] Row-vs-HEAD rule; cite by name not line number
- [major] Deferred findings dropped: controller lookup miss-path tests (controller-seams plan), controller.test.ts `dispatched` copies (place-target-order plan)
- [major] S5 flake already fixed (b94b7b2); only open major and minors remain
- [minor] out-of-scope rows; S18 evidence form; References for review-loop logs; add interface/tests/owns/unknown/verify to Description
### Default applied (technical)
- S2, S6/S7, S19, S3, S1 choices above
### Decision needed
- none
Words: 813 (2.9 x pass 0) | Snapshot: _bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-refactor-sweep-code.review-log.passes/pass1.md

## Pass 2 — 2026-10-14
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 5 (merged), minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied (fixer items 1–11)
- [major] Interface "only src change is S19" contradicts S6/S2/S7 src edits
- [major] Consumers (S6 "changes screenshots") contradicts Rules (rendered output unchanged)
- [major] Verify edit allow-list omits mandated work (S1 call-site adaptation, new helpers.spec/controller.test cases, hoist, S6 src, S19 cases)
- [major] S19 regression case layer unspecified: default Playwright e2e/tray.spec.ts (android), forcing a fractional line width; `refit()` swaps `line.clientWidth` (measure() already fractional) (default applied)
- [major] S20 strengthen vs rename: default add the used-cell-mark assert; rename only if plan shows R-33 sentence still covered (default applied)
- [minor] S7 grep scope (.svelte, .css, inline style) and WAAPI out of scope; S4 case asserts return without waiting; S1 stale names recorded satisfied; every line number stale, S5 px values indicative
### Default applied (technical)
- S19 test layer, S20 assert-over-rename
### Decision needed
- none
Words: 988 (3.5 x pass 0) | Snapshot: _bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-refactor-sweep-code.review-log.passes/pass2.md
