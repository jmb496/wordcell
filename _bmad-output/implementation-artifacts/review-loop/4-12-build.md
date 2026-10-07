# Review loop — ticket 4.12 build (desktop hover peek), code mode

State: pass 2: done

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

## Pass 2 — 2026-10-07
Reviewers: fix diff, correctness, verification gap  |  Findings: major 1, minor 6, decision-needed 0  |  Dropped in triage: 0
Target: `.passes/pass1.diff`  |  Snapshot: tree 8e80500319aa4647b57af16ef41a41be798eb153 (no fix pass)
### Open major (not fixed: stopping rule, passes 1 and 2 each ≤ 1 major)
- [major] story-desktop-hover-peek-plan.md l.50, 56, 60, 78, 142, 169, 183 — the plan still names App.svelte's refreshHover `$effect` (`void layout.hoverFine`) as the hoverFine watcher and says it has no unit-to-UI test; since pass 1 the watcher is `ControllerDeps.watchHoverFine` / `layout.watchHoverFine` (subscribed in attach, unwatched on detach), proved by the new AD-12 controller and AD-11 layout Vitests
### Unapplied minors
- controller.ts hoverEnter/hoverLeave — a pending timer armed on a replaced cell node is not stopped by a pointerout from the new node or by an entry into an empty or suppressed cell; key `hoverTimer` by cell number and stop it before the early returns
- controller.ts suppress() l.826 — closed-rect test matches the left cell on a shared 6/7 edge; use a half-open rect
- e2e "AD-13 hover 400 ms, then hold 400 ms" — assert the hover peek is still open at 399 ms before the long press fires
- e2e cell 6/8 and ?bands= placement — make the vertical zero-gap checks two-sided within 1 px
- plan — add an explicit R-65 sentence → test list (AGENTS.md Conventions)
- e2e "R-65 with the WordCell row under the top bar (?bands=)…" — covers placement only; rename AD-12
### Dropped
- none

## Result — converged after 2 passes
open major: plan drift on the hoverFine watcher (story-desktop-hover-peek-plan.md Code Map App.svelte row, I/O matrix "hoverFine → false", Design Notes, Residual risks); update the plan to the controller-owned `watchHoverFine` and cite its two tests.
Majors per pass: 1, 1. Technical defaults applied: 2. Decision-needed: 0. Final state (tree 8e80500): npm test 2023 passed, lint clean, check 0 errors.
Unapplied minors: the six listed under Pass 2.
