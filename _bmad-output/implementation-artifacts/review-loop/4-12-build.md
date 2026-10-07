# Review loop — ticket 4.12 build (desktop hover peek), code mode

State: pass 1: done

Target: commit range fa088cd..HEAD (3977969), diff `_bmad-output/implementation-artifacts/review-loop/4-12-build.passes/pass0.diff`
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-desktop-hover-peek-plan.md`
Depth: quick (correctness, verification gap; fix diff from pass 2)  |  Max: 7
Pre-loop: HEAD 3977969aed509ef37d530ea789bb186a8df8cd10, tree snapshot 0 a77674ea8b306a456832366ac0355380b892aea1

## Pass 1 — 2026-10-07
Reviewers: correctness, verification gap  |  Findings: major 1, minor 4, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] src/ui/gestures/controller.ts hoverEnter — entering another cell while a hover peek is still open (missed pointerout, e.g. a remount under a stationary pointer) arms a timer whose openHoverPeek throws (AD-15 halt); ticket Timer "moving straight to another cell closes the old one" not enforced → fixer item 1 (reclassified minor → major: crash in shipped behaviour)
- [minor] controller.test.ts "touch press end leaves the suppression slot" — assertion cannot fail on a wrong implementation → fixer item 2
- [minor] App.svelte refreshHover effect — hoverFine → close link untested → fixer item 3 (default applied: controller- or layout-owned watch testable in Vitest)
- [minor] e2e/wordcell-view.spec.ts cells 6/8 — width, 7-per-row wrap and older-line position unasserted → fixer item 4
- [minor] e2e/wordcell-view.spec.ts "R-65 R-75 … empty cell 3" — R-75 sentence not exercised → fixer item 5
### Default applied (technical)
- controller hoverEnter — close the old hover peek before arming for a different cell → default taken
- hoverFine watcher — move the watch where a Vitest can drive it → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
Fixer outcome: items 1–5 applied (item 3: watch moved into the controller via `ControllerDeps.watchHoverFine` / `layout.watchHoverFine`, App effect removed); npm test 2023 passed, lint clean, check 0 errors; wordcell-view.spec.ts 32 passed.
Snapshot: tree 8e80500319aa4647b57af16ef41a41be798eb153  |  fix diff `.passes/pass1.fix.diff`  |  orchestrator re-ran test/lint/check: pass
