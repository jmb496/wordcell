---
id: 15
type: story
title: "Refactor sweep: paperwork and budget"
parent: epic-tray-and-place
covers: [CAP-12]
after: [14]
risk: low
---

# Refactor sweep: paperwork and budget

## Description

Closing records (CAP-12, retrospective A9, AD-17, L2) in the plan `story-refactor-sweep-paperwork-and-budget-plan.md`, plus ticket-record edits. Locate every edit by content, not line number. A row already applied, or whose premise is false at HEAD, is mapped to its existing file:line ("already applied", HEAD sha) or "premise false" with evidence; no invented edits. Build-notes Sweep inventory paperwork rows:

- S8 4.13-OM: the 21:25 banner-during-scroll failure and five green runs, taken from `_bmad-output/implementation-artifacts/review-loop/4-13-build.md` (recorded, not re-run), into `epic-board-and-gestures/story-refactor-sweep-plan.md`.
- S9 4.13-m1: that plan's updates (`sameSession`, F34 source-clip Vitest, 'while halted', `{ booted: false }`, the `AD-7 F18` describe location).
- S10 4.9f-m5: `epic-board-and-gestures/story-drag-interruptions-selection-replacement-hide-back-and-cance.md` Notes, "plan `deferred[0]`" becomes "the former".
- S11 4.11-OM: the final tree in the `test:all` line of `epic-board-and-gestures/story-wordcell-peek-and-sticky-view-plan.md`.
- S16 4.12-OM: in `epic-board-and-gestures/story-desktop-hover-peek-plan.md`, check which file owns the hoverFine watcher (the sweep plan's l.154, 219 say the controller's `watchHoverFine`, not App.svelte) and record what HEAD shows in `story-refactor-sweep-plan.md`.
- S21: the Change Log entry for the screenshot command in `story-draft-wordcards-and-the-composing-tray-plan.md` (5.1); the clause naming the AD-17 valid-fixture list in `src/architecture-ad2-ad12-ad17.test.ts` (`deferred` in `story-place-strip-compact-tray-and-session-place-compact-plan.md`, 5.2) added to the epic's `## Boundaries` section unless already present; the stale b94b7b2 body recorded (no history rewrite). S21 and S22 are intentional additions to the epic's "S8–S13, S16" decision (build-notes CAP 12).
- S22: the unit suite's one failure beside 12 Playwright workers. After S12's timed runs, never in its median: reuse an S12 run as "alone", and run once beside `npm run test:e2e` (12 workers) in the Linux checkout. A load-only failure is recorded "load-related" with the test name; one that also fails alone is an owner stop, no source edit.
- S12: AD-17 re-measure, before `test:all` and `test:screens`: sync HEAD to a Linux-filesystem checkout (e.g. `~/wordcell-watch`, never `/mnt/d`), `npm ci`, idle machine, a discarded warm-up, then three timed `npm test` runs; record the median of the summary Duration line and controller.test.ts's timing (F41). A failed run is recorded, excluded from the median, and an owner stop. Watch re-run: append and revert a trailing newline in the slowest engine file by per-file timings, `npx vitest run <file>` (skips `pretest`). Met only strictly under 5 s and 1 s. Unmeasurable: record "unmeasured". Over budget: record per-file timings and "blocked: owner decision on AD-17 budget"; a fix is a separate ticket.
- S13: enumerate the build-notes Spine, Epic file, EXPERIENCE and DESIGN, and AGENTS.md close-out lists plus CAP-12-deferred items of the controller-seams and refactor-sweep-code plans, each with a status. CAP-12-deferred items come from each plan's Design Notes and review `[defer]` lines, not only frontmatter `deferred`. Spine, epic-file (S21's Boundaries clause excepted), EXPERIENCE, DESIGN and AGENTS.md edits are listed, not made (AGENTS.md through bmad-project-context). The Where-things-are additions (flip.ts, tray/, the gestures/ modules) are checked against the tree at HEAD; the AD-17 Speed result goes in the epic-file list entry.
- Epic Done when 1 audit: every rule-coverage.md row whose Kind contains the token P5 (including "P5 supp." and combined kinds) maps to test file, title with id, and project (android; desktop where the row names it), with pass from the green run. Pass comes from the `test:all` or `test:screens` run. Non-P5 rows are skipped; a P5 row without a passing test is an owner stop, no test added.
- Order: S12, S22, `test:all`, `test:screens`, the P5 audit. Any owner stop (S12 over budget or unmeasured, S22 fails alone, a P5 row without a passing test) still finishes and maps every other row, is recorded, and leaves the plan not built.

Interface: No code change; plan and ticket-record edits only.
Tests: AD-17 unit budget re-measure recorded in the plan; no new rule coverage.
Owns: The paperwork rows of the Sweep inventory, the AD-17 re-measure, and the close-out edit list for the retrospective.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (or the plan names the owner stop instead), and the plan records the warm median and watch re-run (or the owner stop) and maps S8–S13, S16, S21 and S22 each to its applied edit and every rule-coverage.md P5 row to a passing test name.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, Spine close-out edits, Epic file close-out edits, EXPERIENCE.md and DESIGN.md close-out edits, Sweep inventory (CAP-12 rows)

## Notes

- Risk: the unit median may exceed 5 s after the epic's new UI Vitest cases (controller.test.ts is the critical path, F41); the over-budget stop in S12 applies.
