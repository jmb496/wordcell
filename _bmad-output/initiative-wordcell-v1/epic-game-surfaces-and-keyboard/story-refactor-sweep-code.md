---
id: 16
type: story
title: "Refactor sweep: code"
parent: epic-game-surfaces-and-keyboard
after: [15]
risk: low
---

# Refactor sweep: code

## Description

Cleanup only, scope set from the build records and review findings deferred during the epic: duplicated surface code, comment history paragraphs, shared e2e helpers, the AD-1 and AD-2 scans, and any controller or overlays simplification the deferred findings name.

risk: low

Tests: Sweep inventory rows (P6 none) — no new P6 rows; a new unit or helper test only for a moved helper or a widened scan.

Owns: The code sweep.

Consumers: whatever rows the inventory names.

Inventory: the build's first step compiles the sweep inventory as a table in the ticket's plan (build-notes.md has none): one row per deferred item with id, source (log, plan, handoff or build-notes line), file, category (the categories above), action, and outcome (applied, already satisfied, or recorded with a reason). A category with no deferred finding gets a `none` row, never invented work; an empty inventory still passes. Rows are the unit of work and of test; every code row is applied or recorded with a reason (that is the done test).

Deferred set, closed at build start: the unapplied minors in the Result sections of this epic's review-loop logs (`story-*.review-log.md`), the `deferred:` frontmatter of the done ticket plans, the "Worth knowing"-type lines of the autopilot handoff and log, and the build-notes.md Carry-ins. Non-code items become rows handed to ticket 6.17; anything found later goes to the retrospective. A finding that needs behaviour, UX or gameplay intent is not swept; it is recorded for the owner (AGENTS.md rule 7).

Boundary with 6.17: paperwork rows, budget measurements, the P6 audit and the close-out edit lists (spine, EXPERIENCE.md, DESIGN.md, SPEC, rule-coverage.md, build-notes.md edits) belong to 6.17, not here; a doc change a code change makes necessary is recorded as a row for 6.17.

Duplicated surface code and controller or overlays simplification: only rows the deferred findings name. Each merge keeps every cell of the F5 per-surface table and the CAP-5 outcomes in build-notes.md and SPEC, and the existing P6 tests are the proof and stay unchanged. `controller.test.ts` stays one file, overlay open state stays only in `src/ui/overlays.svelte.ts`, and the single-owner rules, `act()` wrapping, AD-3 and AD-4 keep holding. Rendered output of a merged surface is unchanged: as epic 5's sweep did, the plan records computed styles and bounding boxes of the affected surfaces at the android viewport before and after (temporary uncommitted probe, numbers in the plan).

Comment history paragraphs: a comment narrating build or review history (ticket numbers, passes, "previously", "was changed in"). Trim it to the present-tense why and keep every R-, Q-, §, AD- and F-id citation and any invariant. Comment edits must not change code or scan-matched tokens (e.g. `history` outside `src/shell/nav.ts`, AGENTS.md Known pitfalls).

Shared e2e helpers: duplicated spec-local helpers move into `e2e/helpers/` with cases in `e2e/helpers.spec.ts`, one signature each, call sites adapted, no assertion changed, no new `data-testid`, seeding still only through `e2e/helpers/seed.ts`. The plan lists helper -> importing specs.

AD-1 and AD-2 scans: scan edits are limited to rows the deferred findings name, must keep or widen what is detected (same banned tokens and regexes; the AD-2 export list, `src/engine/index.ts` and `index.test.ts` unchanged), and a scan change is shown by a planted violation still failing. If no finding names a scan change the row is `none`.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with no behaviour change and no baseline change.

Checkable form:

- No existing test is weakened, deleted or renamed (names keep their ids; only import paths and moved-helper renames change).
- `git diff` shows no change under the screenshot baseline directories, no message strings, no `src/engine` export and no fixtures.
- `test:screens` runs only through its npm script in the container and never with `--update-snapshots`; a change needing a baseline edit stops the build and goes to the owner.
- The affected suites run after each row and the full gates once at the end; the build size and the unit-suite median do not grow.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (Constraints), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- build notes — _bmad-output/specs/spec-epic-6-surfaces/build-notes.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, the ADs of each touched area
- project — AGENTS.md; docs/development-methodology.md
- records — the epic's `story-*.review-log.md` files and _bmad-output/implementation-artifacts/autopilot/epic-game-surfaces-and-keyboard-handoff.md
