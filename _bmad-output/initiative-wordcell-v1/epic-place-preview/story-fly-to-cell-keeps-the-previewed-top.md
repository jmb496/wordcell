---
id: 3
type: story
title: "Fly-to-cell keeps the previewed top"
parent: epic-place-preview
covers: [E6]
after: [2]
risk: medium
---

# Fly-to-cell keeps the previewed top

## Description

Changes the F28 hold in `src/ui/flip.ts` (`inFlight`) and `WordCellRow.svelte` so that from Confirm, or a Redo that commits, until the last landing the target shows the previewed top (no `★`) and never any card it held before the commit (for a used target, the card beneath its used one) and never a used mirror (the *used this word* look); the previewed top may be the used card itself, at full opacity. Used non-target cells show their card beneath with no flash of the used card, and reduced motion keeps its unstaggered fade.

- Hold (epic 5 SPEC F28, owner 2026-10-14, stays in force: landed cards stay visible until the last landing, then all but the top hide together, never per card): a copy of the previewed top replaces the previous top as the cell's base, drawn beneath the committed cards; the committed cards fly and stay drawn over it as today; at the last landing the copy goes and the non-top committed cards hide together, leaving the live new top. The cell never looks empty and never shows its previous top.
- Copy: the new top's live element is itself the last flying card (fill backwards on its strip rect until its delay), so while `inFlight.committed` is non-empty WordCellRow draws first in the target cell a `preview`-kind mirror (Card `mirror="preview"`, `data-mirror-of`, no card id or testid) of `cell.cards.at(-1)`, with `previewMark` false (the `★` goes at commit, DESIGN.md WordCell, E6), silent (the live top keeps the name), never captured by `flip.ts` and never animated (AD-14 mirrors).
- Reduced motion: the copy replaces the previous top under the unstaggered fade too; the committed faces fade in over it, and at the fade end the hold releases as at the last landing.
- An interrupting move (Undo mid-flight, `finishAll()`) releases the hold with its copy; an Undo back to Place shows the `★` preview again.
- The R-52 used-mirror hold is unreachable since ticket 11.2 (a flight starts in Place, which draws no used mirror; the 11.2 plan hands it here) and the new hold replaces it: remove `inFlight.used`, `Measure.mirrors` and the `:not(.preview)` mirror capture in `flip.ts`, and the `usedId` branch and the `lowest − 1` previous-top reveal in `WordCellRow.svelte`; `inFlight` keeps only `committed`.
- Updates the "ticket 11.2 interim" comments (`flip.ts` header and `inFlight` doc, `WordCellRow.svelte` header, `e2e/fly-to-cell.spec.ts`) and the "(interim hold)" test titles; the AD-14 mirror list and the DESIGN.md hold wording are left to entry 5's close-out, and the plan records the wording needed.
- Plan checkpoint (`plan_checkpoint = true`): an unattended build stops after planning for Jared to approve the plan.

## Acceptance Criteria

Verify:

- `e2e/fly-to-cell.spec.ts`: `expectFlight` and the three "(interim hold)" tests are rewritten for the new hold (named AD-14 F28 Q-49); the other F28 tests (Undo before a card has started, Undo in the same click task) stay, changed only where they pin the previous top, and cover the interrupting Undo and the `★` back in Place.
- Fixtures: a target that is not used on `session-place-onto-committed` (cell 3 already holds a committed word, previous top 28), for Confirm and for a committing Redo (Confirm, settle, Undo, Redo); a used target on `session-place-free-letter-redo-tail` (cell 3, card beneath 0), also under reduced motion; a used non-target on `session-place-free-letter-two-cards` (its F28 test renamed with Q-49): source cell 4 shows only its card beneath (20) at every snapshot.
- At the `fly()` snapshots (at the click, after the first landing, just before the last landing, after the last landing): in the first three the target's visible elements are the held copy of the new top plus the committed cards (no card it held before the commit, no used mirror); no `★` (`.preview-mark`) in any WordCell from the click on; 52 live elements at every snapshot; after the last landing only the live new top is visible and no mirror remains in the target.
- `src/ui/flip.test.ts`: the used-mirror test (~line 600, "AD-14 flyToCell records the target cell used mirror (R-52) …") is replaced by an AD-14 Q-49 test: capture records no mirror (a `preview` mirror in the gaining cell is ignored), and `inFlight.committed` holds exactly the flying ids from the second flushSync until the last landing and is empty after `finishAll()` and after a play that animates nothing.
- `npm run test:all` and `npm run test:screens` (no baseline change expected) are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- rules — docs/game-flow-spec.md Q-49, R-52; epic 5 SPEC F28 (_bmad-output/specs/spec-epic-5-tray/SPEC.md)
- design — DESIGN.md Components → WordCell (*place preview*, fly-to-cell)
- architecture — ARCHITECTURE-SPINE.md AD-14
- code — src/ui/flip.ts, src/ui/flip.test.ts, src/ui/WordCellRow.svelte, src/ui/Card.svelte, e2e/fly-to-cell.spec.ts
- fixtures — session-place-onto-committed, session-place-free-letter-redo-tail, session-place-free-letter-two-cards
