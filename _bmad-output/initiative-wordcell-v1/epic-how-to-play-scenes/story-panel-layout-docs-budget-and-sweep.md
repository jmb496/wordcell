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

Settles the panel order: the five basic scenes, the Tricky rules heading and scenes, then goal, table, undo, empty-column, scoring/rating text, then Controls (HP-7 keeps the remaining text); no anchors, links or new controls; an e2e DOM-order test asserts it.

Removes what the scenes replace: the "A move" and "Worked example" sections in HowToPlayPanel.svelte, their text.ts `howTo` keys, the static example cards and CSS, the example screenshot test and its png, and e2e/unit assertions on them (grep e2e/ and src/). Adds a test that those headings are absent and the kept sections present; re-points the AD-14 one-live-element-per-card test (e2e/how-to-play.spec.ts 'example cards are static…') at the scenes.

Updates EXPERIENCE.md (grep 'static' and 'worked example'): the surface table row (~51), the ~166 row, and the How to play section (~450-463: "One static page", outline items 3 and 7 removed, new order, scenes, loop, tap pause/restart, reduced-motion Next, cited by HP/AD id), plus the HowToPlayPanel.svelte header comment.

Screenshots: confirm one final-frame baseline per scene (5 basic + 3 Tricky) and a full-panel baseline if the layout changes; generate only via `npm run test:screens` (Docker), no orphan snapshots.

Boundary: no engine, shell or rule change; gaps are filled only inside the epic's Boundaries.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the build size is under 600,000 bytes (never raise the budget; if over, trim this epic's additions) with the margin recorded in Notes, every HP id has a passing test or a recorded reason, and the methodology Definition of done is met. Order: edit, `test:all`, record margin, then `test:screens`. The ticket ends at `built`; only the owner marks it done.

- Budget: the AD-18 gzip total printed by `npm run build` (postbuild scripts/size-budget.mjs), taken after the final edits; margin = 600000 minus total, recorded in Notes with the commit.
- Coverage audit: a Notes table HP-1..HP-7 sentence | passing test (file and title; tests carry R-/AD- ids) or reason. Gaps in testable HP-1..HP-6 behaviours (per-scene tap pause/restart, reduced-motion Next, Slow slower than Fast, closed panel animates nothing) get a test here; reasons only for untestable sentences (HP-7 budget: size-budget.mjs, owner reads). Rule or engine defects go to the owner (AGENTS rule 7), not fixed here.
- New strings: every text.ts string added or changed by this epic (git diff of src/ui/text.ts against the commit before ticket 8.1) as a Notes table key | string | ticket, for the owner's review; owner-set captions (2026-10-17) are not edited; unused example/move keys are deleted.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, How to play panel
- constraint — docs/development-methodology.md, Definition of done
- constraint — AD-18 (_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md), scripts/size-budget.mjs

## Notes

Holds the budget margin, the HP-1..HP-7 coverage table and the new-string list (filled by the build).
