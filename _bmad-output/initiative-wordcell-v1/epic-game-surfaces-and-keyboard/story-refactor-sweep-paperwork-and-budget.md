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

Tests: Done when 1 audit (P6 none). The ticket adds no tests and no P6 rows; the audit table in the plan is the proof.

Owns: The paperwork: the plan and the build-notes.md close-out edit lists, plus rule-coverage.md row-text corrections only. Nothing under `src/`, `e2e/`, `fixtures/` or the screenshot baselines changes, and the spine, EXPERIENCE.md, DESIGN.md and SPEC are listed for edit, never edited.

Worklist: the rows of story-refactor-sweep-code-plan.md marked `handed to 6.17` (D35, D38 wording, D40, D45, D46-D48 at the time of writing; the build re-reads the plan for the exact set) are the paperwork worklist. Each ends `applied`, `already satisfied` or `recorded for owner`; zero rows gives a `none` outcome.

Close-out edits: 6.17 lists them (file, old text, new text, reason) in the close-out section of build-notes.md and does not apply them (SPEC CAP-12; AGENTS.md rule 7 and Policy: no AD is reopened). Two are known: AD-13 "menu plus confirm" becomes "a panel plus a confirm"; and the buried WordCell cards `aria-hidden` exception in EXPERIENCE.md Accessibility Floor and SPEC CAP-11 (owner decision 2026-10-15). The build sweeps build-notes, the plans and the review logs for others. Applying the list is the owner's call.

Audit: one plan line per rule-coverage.md row with the spec file, test title and project carrying the id. Rows tagged P6 need a passing Playwright test (android; desktop where the row says so); U-only rows are checked as AD-n-titled Vitest tests (never R-id coverage); a row bundling several ids or none is matched per id or named behaviour. A gap is closed by correcting the row text where the test exists, otherwise `recorded for owner`. The A8 row (wheel, hover-peek re-anchor, bfcache hide flush; U, P6) and 6.16 D35 (CAP-12 gap) are split into wheel, hover-peek and bfcache, each pointed at its test; the bfcache non-reproduction (build-notes F7, SPEC CAP-12 "not a bug") is recorded as the accepted outcome and no test is added.

Measurements: after all edits, `npm run test:all` and `npm run test:screens` run once each, then the measurements. Unit median: a Linux-filesystem checkout of the epic branch HEAD (e.g. `~/wordcell-watch`), one warm-up `npm test` discarded, then the median wall time of 5 `npm test` runs, recorded in the plan; the watch gate is not measured; the build halts if no Linux checkout is available. Size: the gzip total printed by `scripts/size-budget.mjs` (AD-18, run as `postbuild` of `npm run build`) is read from the `test:all` build, not run twice; pass is exit 0 (limit 600,000 bytes); record the number and margin. A miss in either is `recorded for owner`; the budget is not raised and nothing is fixed here. A flaky red suite gets one rerun with both outcomes recorded; a real failure is `recorded for owner`. `test:screens` runs only through its npm script, never with `--update-snapshots`; a screenshot diff is `recorded for owner`, and the build halts if the screenshot container is unavailable.

Retrospective inputs: a list in the plan of the `recorded for owner` rows of the 6.16 inventory, the digest of new catalogue strings (epic decision 2026-10-15), the 2026-10-15 owner decisions, the bfcache non-reproduction, the measurements and any flaky tests. 6.17 runs no retrospective and does not start the merge or deploy (epic entry 7). The plan ends `built`; only the owner marks the ticket done.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with every P6 row of rule-coverage.md covered, the unit median under 5 s on the Linux filesystem and the size script under 600,000 bytes.

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
