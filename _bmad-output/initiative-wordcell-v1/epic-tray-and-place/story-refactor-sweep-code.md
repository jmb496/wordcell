---
id: 14
type: story
title: "Refactor sweep: code"
parent: epic-tray-and-place
covers: [CAP-11]
after: [13, 17]
risk: low
---

# Refactor sweep: code

## Description

Closing code cleanup (CAP-11, retrospective A5, A9, C-UI1, C-E56, L2) from the build-notes Sweep inventory rows marked code for this CAP and the review findings deferred during the epic: S1 the copied e2e helpers moved into e2e/helpers/ with helpers.spec.ts cases: the build-notes S1 row list is exhaustive (minus `tapAt`, already moved by entry 3), including the local `Point`/`Box`/`Selection` types and the local `box`es vs `helpers/board.ts` `box`; one canonical signature per helper, so differing copies (`faceOf` (card) vs (page, id); `holdThrough` steps vs points; `expectFlownBack` face vs card) are deduplicated with call sites adapted and no assertion changed, and a same-named different local (the `+` button locator `plus` in tile-tap, tray-controls and tray-growth vs the `Point` adder) is renamed or kept spec-local with a recorded reason; the plan maps helper → importing specs; S2 `visibleBand()` with a dev `?bands=` order that moves a bar off its edge: record only (confirm the AD-12 record at HEAD, reason in the plan, `visibleBand()` unchanged), a fix only if trivial, dev-only and needing no test edit; S3 pin `rejectReason`'s `'version' in` check (now in src/shell/stored-key.ts, locate by name) in the shell Vitest file game.svelte.test.ts with `version` absent vs present (AD-n test name); S4 a helpers.spec.ts case for `openFixture` `{ booted: false }`, located by name; S5 the layout.spec banner-during-scroll settle: only the open major and minors of review-loop/epic5-banner-scroll-e2e.md Result remain (the flake itself was fixed by b94b7b2), checked at HEAD first and only what is still open applied; S6 one shared card style for Dialog.svelte and BlockingMessage.svelte (C-UI1), the consumers (History notice, Reset confirm, Halted, rejected-root) rendering unchanged; S7 (C-E56) every CSS transition or animation declaration the epic 5 diff added (found by diff and grep for `transition`/`animation` in src/ui) honouring `--wc-reduced`, meaning its duration is a multiple of `var(--wc-base-ms)` (zero when reduced, AD-10); if the grep still finds no non-comment declaration, S7 is recorded confirmed-none with the grep as evidence, and the plan lists each one found or the grep; S18 4.12-m3 … m6 confirm-only: the plan records evidence (test name and file) that each is applied at HEAD, and any not applied becomes a change; S19 the 5.1 word-line fractional-width fit (src/ui/tray/WordLine.svelte `refit()` measuring the fractional width, default `getBoundingClientRect().width`, with a regression case that fails on a fractional-width line before the fix) and the three 5.1 test minors, which stay test edits (review-loop/5-1-build.md Result, Pass 4); S20 the two 5.2 test-strength minors (review-loop/5-2-build.md Result); each applied or recorded with a reason.

Rules: each row is first checked against HEAD with the outcome applied, already satisfied (file and test name as evidence) or premise gone (reason; escalated if the finding still stands); cite lines and tests by name, since line numbers in S4, S18 and S20 are stale. S6 and S7 must not change rendered output: screenshot baselines stay unedited, and a needed baseline change (S19 included) stops the build and goes to the owner, baselines being regenerated only in the Docker image (AGENTS.md).

Deferred findings carried: controller lookup miss-path tests (the lookup helpers are untested except `wordcellPress` and `originCard`; story-controller-seams-plan.md) and hoisting the controller.test.ts per-describe `dispatched` copies into one shared helper (story-place-target-order-and-confirm-plan.md, "S1 consolidation"); verify both against the plans and HEAD first. The deferred set is the minors in the Result sections of this epic's review-loop logs and done plans; anything found later goes to the retrospective.

Interface: new or extended e2e/helpers/ modules; a shared card style for Dialog/BlockingMessage; the only src change is S19 in WordLine.svelte; no src export change. Tests: existing suites; helpers.spec.ts cases for the moved helpers and `openFixture` `{ booted: false }`; no new rule coverage. Owns: the code rows of the Sweep inventory (S1–S7, S18–S20) and the epic's deferred code minors. Consumers: the moved e2e helpers are imported by every dev-server spec (the plan lists each spec the move touches); S6's shared card style changes the History notice, Reset confirm, Halted and rejected-root surfaces and their screenshots.

Out of scope: rows S8–S17 and S21–S22 belong to other tickets (CAP-12 paperwork or other CAPs).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with every existing test passing, no test weakened or removed, and edits limited to imports, moved helpers and the strengthenings S3, S5, S18, S19 and S20 name (each listed in the plan), and the plan mapping every S1–S7, S18, S19 and S20 row and every deferred finding to a change or a recorded reason.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-11 / CAP-12 Sweep inventory
- review logs — _bmad-output/implementation-artifacts/review-loop/epic5-banner-scroll-e2e.md, 4-12-build.md, 5-1-build.md, 5-2-build.md
- retro — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures-retrospective.md, Action items A5, A9; Process L2

## Notes

- Open question: Ten inventory rows (S1–S7, S18–S20); scope beyond them is unknown until the earlier builds' deferred findings are read.
