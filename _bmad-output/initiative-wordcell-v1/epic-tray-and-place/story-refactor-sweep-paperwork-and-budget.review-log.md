# Review log — story-refactor-sweep-paperwork-and-budget

State: done
Pre-loop: HEAD 4f7f49f648df9df21e82ea63e603d8f1702a664d, 308 words, copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-refactor-sweep-paperwork-and-budget.review-log.passes/pass0.md
Extra intent (from tickets.toml entry 15, not in the ticket; fixer adds to Description in pass 1):
- interface: No code change; plan and ticket-record edits only.
- tests: AD-17 unit budget re-measure recorded in the plan; no new rule coverage.
- owns: The paperwork rows of the Sweep inventory, the AD-17 re-measure, and the close-out edit list for the retrospective.

## Pass 1 — 2026-10-14
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from 31 raw), minor 5, decision-needed 0  |  Dropped in triage: duplicates folded; "S5/S17/S18 elsewhere" and the screens-vs-docs-only Verify objection (kept, ordered instead)
Words (docs): 644 (2.09x pass 0; budget 770)  |  Snapshot: story-refactor-sweep-paperwork-and-budget.review-log.passes/pass1.md
### Applied
- all 8 majors and 5 minors applied by the fixer (items 1-8 below, minors listed); nothing unverified
### Default applied (technical; all majors)
1. Target paths: `story-refactor-sweep-plan.md` exists in epic-board-and-gestures/ and epic-rules-engine/; S8/S9/S16 use epic-board-and-gestures; ticket 4.9 and 4.11 plan located by search; line numbers are hints, locate by content → full paths named, locate by content.
2. Row outcomes: a row already applied or with a false premise at HEAD → map to existing file:line "already applied (HEAD sha)" or "premise false" with evidence; no invented edits.
3. S8/S21 sources and destination: S8 facts from `review-loop/4-13-build.md` and its 21:25 failure, recorded not re-run; S21 b94b7b2 note and 5.1 Change Log go in the named files; the epic Boundaries clause naming the AD-17 list is applied to the epic file unless already present.
4. S12 protocol: sync HEAD to `~/wordcell-watch`, `npm ci`, discarded warm-up, three timed `npm test` runs, median of Vitest duration, idle machine, measured before test:all/test:screens; watch re-run = touch the slowest engine file by per-file timings, `vitest` re-run; also record controller.test.ts timing (F41); unmeasurable → record unmeasured and stop; never measure on /mnt/d; failing run recorded, not discarded.
5. Over-budget: all other rows still applied and mapped, plan records per-file timings and "blocked: owner decision on AD-17 budget", not marked built, no source change (a fix is a separate ticket).
6. S13: enumerate build-notes Spine / Epic file / EXPERIENCE+DESIGN / AGENTS.md lists plus CAP-12-deferred items from the controller-seams and refactor-sweep-code plans, each with a status; Spine, EXPERIENCE, DESIGN, AGENTS.md edits are listed not made (AGENTS.md through bmad-project-context); Where-things-are additions added to the lists checked against the tree at HEAD; AD-17 Speed result recorded in the epic-file list entry.
7. P5 audit: every rule-coverage.md row whose Kind contains the token P5 (incl. P5 supp., combined kinds) → test file, title with id, project (android; desktop where the row names it), pass from the green run; non-P5 rows skipped; a row without a passing test is a stop for the owner, no test added.
8. S22: S12 runs alone plus one run beside 12 Playwright workers; load-only failure → "load-related" with test name; also fails alone → stop for owner, no source edit.
### Minor (applied if no word cost)
- Quote S10 replacement and S9 items; list S21/S22 as intentional additions to the epic's "S8–S13, S16" decision; drop CAP-11 from references; Notes open question → risk pointing to the stop rule; red/flaky run recorded not retried silently; name the plan path (story-refactor-sweep-paperwork-and-budget-plan.md).
### Decision needed
- none

## Pass 2 — 2026-10-14
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6 (merged from 18 raw), minor 4, decision-needed 0  |  Dropped in triage: duplicates folded
### Default applied (technical; majors)
1. General stop rule: any owner stop (S12 over budget or unmeasured, S22 fails alone, P5 row without a passing test) finishes and maps every other row, records the stop, leaves the plan not built; Verify names it instead of green.
2. Order and S22 load: S12, then S22 (after S12's timed runs, never in the median, load = `npm run test:e2e` with 12 workers in the Linux checkout, an S12 run reused as "alone"), then test:all, test:screens, the P5 audit.
3. S12 detail: a failed timed run is excluded from the median and is a stop; met only strictly under 5 s / 1 s; median of the summary Duration line; watch re-run = append and revert a trailing newline in the slowest engine file, `npx vitest run <file>` (excludes pretest).
4. S16 premise: the sweep plan l.154/219 says the hover-peek plan names the controller's `watchHoverFine`, not App.svelte → reword to check the plan for the hoverFine watcher owner and record what HEAD shows.
5. S21: name the 5.1 and 5.2 plan files by path; check the epic's `## Boundaries` section, not the Decisions list.
6. S13: epic-file close-out edits are listed, not made (S21 Boundaries clause excepted); CAP-12-deferred items are found in each plan's Design Notes and review `[defer]` lines, not only frontmatter `deferred`.
### Minor
- P5 pass is from the test:all or test:screens run; cite S21, S22 to build-notes (CAP 12).
### Applied (pass 2)
- all 6 majors and the minors applied; words 755 (2.45x pass 0, budget 770); Snapshot: story-refactor-sweep-paperwork-and-budget.review-log.passes/pass2.md. Unverified: `npx vitest run <file>` not executed (pretest/test scripts confirmed in package.json).

## Pass 3 — 2026-10-14
Reviewers: fix diff, builder/edge, ref alignment + adversarial  |  Findings: major 0, minor 6 (5 distinct), decision-needed 0  |  Dropped in triage: none
Words (docs): 755 (2.45x pass 0)
### Applied
- none (converged)

## Result — converged after 3 passes
majors per pass: 8, 6, 0. Decision-needed: none. Technical defaults applied: 14 (pass 1: 8, pass 2: 6). Words 308 → 755. Unverified: `npx vitest run <file>` not executed (scripts confirmed in package.json).
Unapplied minors:
- S22 "12 workers" is the 2026-10-08 observation, not Playwright config (reword to "workers as observed").
- S12: a failed timed run → owner stop, median not computed (no replacement run).
- S12: watch re-run "slowest engine file" per-file timings of the first timed run; figure is the summary Duration.
- Order: a red test:all or test:screens is an owner stop.
- S22: its load run is separate from test:all; a pass is "not reproduced".
