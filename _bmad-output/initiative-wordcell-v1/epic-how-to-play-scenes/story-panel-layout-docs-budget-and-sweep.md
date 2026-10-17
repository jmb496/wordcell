---
id: 5
type: story
title: "Panel layout, docs, budget and sweep"
parent: epic-how-to-play-scenes
covers: [HP-7]
after: [4]
risk: low
---

# Panel layout, docs, budget and sweep

## Description

Settles the panel order: five basic scenes, Tricky heading and scenes, then goal, table, undo, empty-column, scoring/rating text, then Controls (HP-7); no anchors, links or in-panel navigation; extend the existing e2e order test (e2e/how-to-play.spec.ts) to the full sequence.

Removes what the scenes replace: the "A move" and "Worked example" sections in HowToPlayPanel.svelte, the static example cards, CSS and screenshot test with its png, the text.ts `move` paragraphs, `move`/`example` headings, `exampleIntro`/`exampleWords`/`exampleCaption` keys and `EXAMPLE_WORDS`, and assertions in src/ui/how-to-play.test.ts (heading count 9 to 7), src/ui/text.test.ts, e2e/how-to-play.spec.ts (`section.example`, exampleWords), e2e/how-to-play.screens.spec.ts. Adds a test that those headings are absent, the kept sections present. Re-points and renames the AD-14 test (e2e/how-to-play.spec.ts 'example cards are static…'): it keeps no data-card-id, `data-testid^=card-` or data-mirror-of inside the panel scenes, 52 live cards on the page and no horizontal overflow at 360 px; .word, 22-card and pan-y checks are dropped.

Updates EXPERIENCE.md (grep 'static', 'worked example'): rows ~51 and ~166, and How to play (~450-463: "One static page", outline items 3 and 7 removed, new order, scenes, loop, tap pause/restart, reduced-motion Next, cited by HP/AD id), and the HowToPlayPanel.svelte header comment.

Screenshots: add any missing final-frame baseline (5 basic + 3 Tricky scenes); no full-panel baseline beyond these 8; generate only via `npm run test:screens` (Docker), no orphan snapshots.

Boundary: no engine, shell or rule change.

## Acceptance Criteria

Verify: `test:all` and `test:screens` green, the build size is at most 600,000 bytes (the size-budget.mjs gate; never raise it; if over, trim this epic's additions) with the margin recorded in Notes, every HP id has a passing test or reason, and the Definition of done is met. Order: edit, `test:all`, record margin, `test:screens`; any source edit after the margin re-runs `test:all` and re-records it. Ends at `built`; only the owner marks it done.

- Budget: the AD-18 gzip total from `npm run build` (scripts/size-budget.mjs), taken after final edits; margin = 600000 minus total, recorded in Notes with the base HEAD hash of the measured working tree.
- Coverage audit: a Notes table HP-1..HP-7 sentence | passing test (file and title) or reason. Map existing tests first (reduced-motion Next, Slow vs Fast, closed or hidden panel, scene-1 and Tricky pause/restart exist); only real gaps in testable HP-1..HP-6 behaviours get a test here (tap pause/restart for scenes 2-5 is the known one), Playwright on `android` (Vitest where not UI-observable), names per AGENTS Conventions; reasons only for untestable sentences (HP-7: size-budget.mjs, owner reads). Rule or engine defects go to the owner (AGENTS rule 7).
- New strings: every text.ts string added or changed by this epic (git diff of src/ui/text.ts against bbf44c3~1, the parent of the first 8.1 code commit; name it in Notes) as a Notes table key | string | ticket, for the owner's review; owner-set captions (2026-10-17) stay unedited; list only strings still in text.ts after the deletions.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, How to play panel
- constraint — docs/development-methodology.md, Definition of done
- constraint — AD-18 (_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md), scripts/size-budget.mjs

## Notes

Holds the budget margin, HP-1..HP-7 coverage table and new-string list (filled by the build).
