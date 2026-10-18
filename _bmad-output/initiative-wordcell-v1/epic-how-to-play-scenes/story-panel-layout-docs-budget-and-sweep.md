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

**Budget (AD-18, `scripts/size-budget.mjs`):** total 547,309 / 600,000 gzip bytes; margin 52,691. Measured on base HEAD ae50f4f19bc8c5e277dd6778f4fedd9ef068b317 plus this ticket's working tree (`npm run test:all`, build step; no source edit after).

**HP coverage (`e2e/how-to-play.spec.ts` on `android` unless noted):**

| Sentence | Passing test or reason |
| --- | --- |
| HP-1 runs a script on `Card` with ghost, loops, tap pauses or restarts, none while closed or hidden | scene 1 tap test ('the scene plays on open, a tap pauses it...'), new tap pause/restart tests for compose, destination, place, scoring, the Tricky pause/restart tests, 'closed, the scene animates nothing', 'a hidden page stops the scene' |
| HP-1 Animation speed applies | 'Animation speed Slow runs a scene step longer than Fast' |
| HP-2 reduced motion: Next steps frames, final frame resting | the reduced-motion Next tests per scene (drag, compose, destination, place, scoring, Tricky) |
| HP-3 five basic scenes in order | 'the Tricky rules heading and its three scenes follow the five basic scenes, in order'; screenshots scene 1-5 |
| HP-4 Tricky section, three scenes | same order test; Tricky scene tests; screenshots scene 6-8 |
| HP-5 content in `fixtures/`, engine replay | the scene replay test under `src/engine/` (epic tickets 1 to 4) |
| HP-6 text in `text.ts`, figure, aria-hidden, `act()` | `src/ui/how-to-play.test.ts` AD-3 tests (paragraphs, figcaptions, no prose node, static cards) |
| HP-7 order, removed sections | 'HP-7 the A move and Worked example headings are absent...' (Vitest), the full-sequence order test, no-links check |
| HP-7 budget | reason: `size-budget.mjs` gate in `npm run build` (margin above) |
| HP-7 owner reads the text | reason: owner review |

**New strings** (diff of `src/ui/text.ts` against `bbf44c3~1` = 6a8ad66f61fa932ffc64b1bf7d75ccc98f7ed493; only strings still present):

| Key | String | Ticket |
| --- | --- | --- |
| `howTo.headings.tricky` | Tricky rules | 8.4 |
| `howTo.scenes.drag` | Press a card and drag: it takes every card below it. Drop the stack on a column. | 8.1 |
| `howTo.scenes.compose` | Arrange your cards into a word. Tap a WordCell to borrow its top card. Then Validate. | 8.2 |
| `howTo.scenes.destination` | The cards you land on stay in order and can't be shuffled. −/+ choose how many; Flip makes the word read upward instead. | 8.2 |
| `howTo.scenes.place` | Pick a WordCell no higher than the word is long. Order the cards: the last one becomes that cell's free letter. Then Confirm. | 8.3 |
| `howTo.scenes.scoring` | Each WordCell scores its letters times its number. QU counts as two letters. Long words on high cells score most. | 8.3 |
| `howTo.scenes.sourceDrop` | Dropping back on the column you lifted from is allowed. As always, you must use at least 1 letter from the destination column: F must join, giving FAKED. | 8.4 |
| `howTo.scenes.destinationRule` | You must use at least 1 letter from the destination column, unless you drag to an empty column. | 8.4 |
| `howTo.scenes.topCard` | The top card of each WordCell can be used as a free letter added to the word. | 8.4 |
| `howTo.scoreFigure(letters, cell, score)` | `${letters} × ${cell} = ${score}` | 8.3 |
| `howTo.sceneControls.pause` / `restart` / `next` / `replay` | Pause animation / Restart animation / Next / Replay | 8.1 |

Removed by this ticket: `howTo.move`, `exampleIntro`, `EXAMPLE_WORDS`, `exampleWords`, `exampleCaption`, headings `move` and `example`. Unchanged existing strings (goal, table, undo, empty, scoring) were not edited.
