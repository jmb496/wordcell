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

Tests: Sweep inventory rows (P6 none) — no new P6 rows; a new unit or helper test only for a moved helper or a widened scan.

Owns: the code sweep of `src/ui` overlays and controller, `e2e/helpers`, and the `src/architecture-*.test.ts` scans.

Consumers: whatever rows the inventory names.

Inventory: the build's first step compiles the sweep inventory as a table in the ticket's plan (build-notes.md has none): one row per deferred item with id, source (log, plan, handoff or build-notes line), file, category (one of the five below: duplicated surface code and controller or overlays simplification, comment history paragraphs, shared e2e helpers, AD-1 and AD-2 scans), action, and outcome: `applied`, `already satisfied`, `handed to 6.17` (non-code or paperwork rows; a mixed row is split into a code row here and a paperwork row for 6.17) or `recorded for owner` (needs behaviour, UX or gameplay intent, or would change a baseline, a rendered cell or a named invariant; no other reason is valid). A category with no deferred finding gets a `none` row, never invented work; an empty inventory still passes. Rows are the unit of work and of test; only code rows count toward done, each `applied`, `already satisfied` or `recorded for owner`. A row that turns out mid-build to change behaviour is reverted and re-marked `recorded for owner`; other rows continue. Affected suites for a row are the Vitest files and e2e specs its changed files import or are imported by, plus `npm run check` and lint.

Deferred set, closed at build start: the unapplied minors in the Result sections of this epic's review-loop logs (`story-*.review-log.md`) and of the code-review logs `_bmad-output/implementation-artifacts/review-loop/6-*-build.md` (Result entries not marked applied; where no Result lists them, the per-pass Minors minus Applied), the `deferred:` frontmatter of the done ticket plans, the "Worth knowing"-type lines of the autopilot handoff and log, and the build-notes.md Carry-ins. A carry-in or `deferred:` entry whose ticket is done is checked against the code and listed as `already satisfied` if so (an empty `deferred: []` yields a `none` row). Non-code items become rows `handed to 6.17`; anything found later goes to the retrospective. Bug fixes among the deferred (e.g. the latent AD-13 throw from `openSurface('resetConfirm')` over the History notice, the flaky drag test in `e2e/success-signal.spec.ts`) are not cleanup: `recorded for owner` (or retrospective), not swept. Owner-decision items (e.g. the scrim over the top bar and menu button) are `recorded for owner`, never handed to 6.17. A finding that needs behaviour, UX or gameplay intent is not swept (AGENTS.md rule 7).

Boundary with 6.17: paperwork rows, budget measurements, the P6 audit and the close-out edit lists (spine, EXPERIENCE.md, DESIGN.md, SPEC, rule-coverage.md, build-notes.md edits) belong to 6.17, not here; a doc change a code change makes necessary is recorded as a row for 6.17.

Duplicated surface code and controller or overlays simplification: only rows the deferred findings name. Each merge keeps every cell of the F5 per-surface table and the CAP-5 outcomes in build-notes.md and SPEC, and the existing P6 tests are the proof and stay unchanged. `controller.test.ts` stays one file, overlay open state stays only in `src/ui/overlays.svelte.ts`, and the single-owner rules, `act()` wrapping, AD-3 and AD-4 keep holding. Rendered output of a merged surface is unchanged: as epic 5's sweep did, the plan records computed styles and bounding boxes of the affected surfaces at the android viewport before and after (temporary uncommitted probe, numbers in the plan). The probe covers every surface whose component or style file a row touches, at the android viewport (plus desktop where the surface differs), in the states the merge touches; equality is exact, and a mismatch reverts that row and records it for owner.

Comment history paragraphs: a comment narrating build or review history (ticket numbers, passes, "previously", "was changed in"). Trim it to the present-tense why and keep every R-, Q-, §, AD- and F-id citation and any invariant; a comment with no surviving why is deleted. Only files and comments named by inventory rows are touched (no repo-wide sweep). Comment edits must not change code or scan-matched tokens (e.g. `history` outside `src/shell/nav.ts`, AGENTS.md Known pitfalls): verify with an empty non-comment token diff, then the architecture tests and lint after the comment rows.

Shared e2e helpers: duplicated spec-local helpers move into `e2e/helpers/` with cases in `e2e/helpers.spec.ts`, one signature each, call sites adapted, no assertion changed, no new `data-testid`, seeding still only through `e2e/helpers/seed.ts`. The plan lists helper -> importing specs.

AD-1 and AD-2 scans: scan edits are limited to rows the deferred findings name, must keep or widen what is detected (same banned tokens and regexes; the AD-2 export list, `src/engine/index.ts` and `index.test.ts` unchanged), and a scan change is shown by a planted violation still failing. A widened scan must pass on the current tree with no source edits outside the sweep's own rows; a newly flagged existing hit becomes a recorded row, not fixed in the same row. After any scan row all `src/architecture-*.test.ts` run, with one planted violation per touched regex or token run before and after, reverted before commit, failing output recorded in the plan. If no finding names a scan change the row is `none`.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with no behaviour change and no baseline change.

Checkable form:

- No existing test is weakened, deleted or renamed (test titles, the `it`/`test` names and their ids, never change; only helper function identifiers and import paths may; the sorted set of test titles is identical before and after, and no moved case replaces an existing assertion).
- `git diff` shows no change under the screenshot baseline directories, no message strings, no `src/engine` export and no fixtures.
- `test:screens` runs only through its npm script in the container and never with `--update-snapshots`; a row needing a baseline edit is reverted and recorded for owner, and the rest continues.
- The affected suites run after each row and the full gates once at the end; build size and unit median stay within the AD-17 budgets (size script; unit median under 5 s warm-cache on a Linux-filesystem checkout per AGENTS.md), with before and after numbers in the plan. Helper cases run in `e2e/helpers.spec.ts`; only scan tests count toward the unit median.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (Constraints), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- build notes — _bmad-output/specs/spec-epic-6-surfaces/build-notes.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, the ADs of each touched area
- project — AGENTS.md; docs/development-methodology.md
- records — the epic's `story-*.review-log.md` files _bmad-output/implementation-artifacts/review-loop/6-*-build.md (Result sections), and _bmad-output/implementation-artifacts/autopilot/epic-game-surfaces-and-keyboard-handoff.md and epic-game-surfaces-and-keyboard-20261014-2230.md
