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

Closing code cleanup (CAP-11, retrospective A5, A9, C-UI1, C-E56, L2) from the build-notes Sweep inventory rows marked code for this CAP and the review findings deferred during the epic: S1 the copied e2e helpers moved (minus `tapAt`, already moved by entry 3) into e2e/helpers/ with helpers.spec.ts cases; S2 `visibleBand()` with a dev `?bands=` order that moves a bar off its edge (recorded, fix optional); S3 pin `rejectReason`'s `'version' in` in game.svelte.test.ts; S4 a helper test for `openFixture` `{ booted: false }`; S5 the layout.spec banner-during-scroll pan step under load; S6 one shared card style for Dialog.svelte and BlockingMessage.svelte (C-UI1); S7 every CSS transition the epic added reading `--wc-base-ms` and honouring `--wc-reduced` (C-E56); S18 4.12-m3 … m6 confirmed at HEAD and recorded; S5 also carries the banner-scroll e2e open major and minors (review-loop/epic5-banner-scroll-e2e.md Result); S19 the 5.1 word-line fractional-width fit and three 5.1 test minors (review-loop/5-1-build.md Result, Pass 4); S20 the two 5.2 test-strength minors (review-loop/5-2-build.md Result); each applied or recorded with a reason.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with every existing test passing unedited except imports and moved helpers, and the plan mapping every S1–S7, S18, S19 and S20 row and every deferred finding to a change or a recorded reason.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-11 / CAP-12 Sweep inventory
- retro — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures-retrospective.md, Action items A5, A9; Process L2

## Notes

- Open question: Ten inventory rows (S1–S7, S18–S20); scope beyond them is unknown until the earlier builds' deferred findings are read.
