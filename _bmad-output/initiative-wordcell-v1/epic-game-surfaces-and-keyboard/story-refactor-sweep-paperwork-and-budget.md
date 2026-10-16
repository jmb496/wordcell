---
id: 17
type: story
title: "Refactor sweep: paperwork and budget"
parent: epic-game-surfaces-and-keyboard
after: [16]
risk: low
---

# Refactor sweep: paperwork and budget

## Description

Paperwork and measurements only: the P6 audit of rule-coverage.md (every row maps to a passing test), the unit-suite budget, the size budget, the close-out edit lists in build-notes.md and the retrospective inputs.

Tests: Done when 1 audit (P6 none). P6 none means this ticket adds no P6 rows or tests and audits the existing ones; the audit table in the plan is the proof.

Owns: The paperwork: the plan and the build-notes.md close-out edit lists, plus rule-coverage.md row-text corrections only. Nothing under `src/`, `e2e/`, `fixtures/` or the screenshot baselines changes, and the spine, EXPERIENCE.md, DESIGN.md and SPEC are listed for edit, never edited.

Worklist: the rows of story-refactor-sweep-code-plan.md marked `handed to 6.17` (D35, D38 wording, D40, D45, D46-D48 at the time of writing; the build re-reads the plan for the exact set) are the paperwork worklist. Each ends `applied`, `already satisfied` or `recorded for owner`; zero rows gives a `none` outcome. For rows whose fix lies in the spine, SPEC, EXPERIENCE or DESIGN, `applied` means listed in the build-notes close-out section, not made. An id in both this row and the plan's `recorded for owner` row (D38, D40, D45) is worked only for the part the handed row names (paperwork, wording); the rest keeps `recorded for owner` and reaches the retrospective list once.

Close-out edits: 6.17 lists them (file, old text, new text, reason) in the close-out section of build-notes.md and does not apply them (SPEC CAP-12; AGENTS.md rule 7 and Policy: no AD is reopened). The build extends the existing "Close-out edits" section of build-notes.md without duplicating its AD-13 entry (which also covers EXPERIENCE.md and epic 4 F16 references), and converts the loose buried-card note above it (the WordCell cards `aria-hidden` exception in EXPERIENCE.md Accessibility Floor and SPEC CAP-11, owner decision 2026-10-15) into a list entry: old text verbatim from those two files, new text the exception wording the builder proposes. The loose "Close-out note" line is then removed; the owner-decision sentence in the Names paragraph stays. It sweeps the epic 6 build-notes, plans and review logs for others. Applying the list is the owner's call.

Audit: one plan line per rule-coverage.md row with the spec file, test title and project carrying the id. "Passing" means green in this ticket's own `test:all` or `test:screens` run. Rows tagged P6 need a passing Playwright test (android; desktop where the row says so; a row tagged "android + desktop" cites a test in each project), and a row tagged "U, P6" needs both halves cited; U-only rows are checked as AD-n-titled Vitest tests (never R-id coverage); a row bundling several ids is matched per id, and a row with no rule id by named behaviour, the test title carrying a CAP, AD or Q id (otherwise the row text is corrected or the gap recorded). A gap is closed by correcting the row text where the test exists, otherwise `recorded for owner`. The A8 row (wheel, hover-peek re-anchor, bfcache hide flush; U, P6) and 6.16 D35 (CAP-12 gap) are split so the wheel and hover-peek parts each point at their test, while the bfcache part cites build-notes F7 as `accepted non-reproduction` (SPEC CAP-12 "not a bug"), not a gap and counted as covered for Verify; no test is added.

Order: (1) worklist and close-out lists; (2) static audit with row-text corrections; (3) one `npm run test:all` and one `npm run test:screens` run; (4) measurements; (5) fill "passing" in the audit and write the retrospective list. Docs-only edits after step 3 trigger no rerun.

Measurements: Unit median: clone (or rsync) the epic branch HEAD to a Linux-filesystem directory (6.17 changes no code, so uncommitted paperwork does not matter), `npm ci`, one warm-up `npm test` discarded, then 5 timed runs; the basis is the wall time of the full `npm test` (pretest included), strict less than 5 s on the median. This is a stricter superset of AD-17's median of three (pretest included, five runs); record all 5 values, the median in AD-17's form (warm, Linux filesystem, seconds), the commit hash and the directory in the plan. Watch gate: on the same checkout record informationally the watch re-run of the slowest engine test file (found with `npx vitest run src/engine` and its per-file durations; the spine names `src/engine/view.test.ts` at epic 5); a miss is `recorded for owner`. A failing timing run is handled by the rerun rule and not counted in the median. Size: `scripts/size-budget.mjs` (AD-18, `postbuild` of `npm run build`) is read from the last successful `build` of the `test:all` run, not run twice; at most 600,000 bytes with exit 0 is the authority; record its `total N / 600000` line verbatim and the margin 600000 - N. A non-zero exit from another cause (missing font or dictionary, AD-16 per-file limit) is a real failure; record the error line. `test:all` is a `&&` chain (lint, check, test, build, test:e2e:dist, test:e2e, test:e2e:pwa): after a red step, run the remaining scripts individually where their inputs exist and record each outcome; the single rerun (also for `test:screens` and a failing timing run) re-executes only the failing script, and if it goes green the suite counts green with the flake recorded; a `test:all` stopped short is not green; a real failure is `recorded for owner`. A miss in either budget is `recorded for owner`; the budget is not raised and nothing is fixed here. `test:screens` runs only through its npm script, never with `--update-snapshots`; a screenshot diff that reproduces on the rerun is `recorded for owner`. Only an unavailable precondition (no Linux checkout, no screenshot container) halts the build; misses stop the plan at "not built". After the runs, `git status --short` (tracked changes only; git-ignored output ignored) shows only the plan, build-notes.md, rule-coverage.md and this ticket's own file and review logs; any change under `src/`, `e2e/`, `fixtures/` or baselines is reverted and recorded.

Retrospective inputs: a list in the plan of the `recorded for owner` rows of the 6.16 inventory, the digest of new catalogue strings (epic decision 2026-10-15), the 2026-10-15 owner decisions, the bfcache non-reproduction, the measurements and any flaky tests. 6.17 runs no retrospective and does not start the merge or deploy (epic entry 7). The plan ends `built` only when Verify is met. A recorded Verify miss (red suite, uncovered P6 row, over-budget median or size, screenshot diff) leaves the plan short of `built`, with the misses listed first in the plan for the owner, who decides. Only the owner marks the ticket done.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with every P6 row of rule-coverage.md covered, the unit median under 5 s on the Linux filesystem and the size script at most 600,000 bytes with exit 0.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (Constraints), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- build notes — _bmad-output/specs/spec-epic-6-surfaces/build-notes.md
- coverage — _bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md
- sibling — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-refactor-sweep-code.md and story-refactor-sweep-code-plan.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-17, AD-18
- project — AGENTS.md; docs/development-methodology.md, Definition of done
