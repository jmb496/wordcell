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

Changes the F28 hold in `src/ui/flip.ts` (`inFlight`) and `WordCellRow.svelte` so that from Confirm, or a Redo that commits, until the last landing the target's base is the previewed top (no `★`), beneath the committed cards as they land, and the target never shows a card beneath the committed run (the cell's cards before its first committed card; for a used target, the card beneath its used one) or a used mirror (the *used this word* look); the previewed top may be the used card itself, at full opacity. Used non-target cells show their card beneath or the empty outline (E3) with no flash of the used card, and reduced motion keeps its unstaggered fade.

- Hold (epic 5 SPEC F28, owner 2026-10-14): its landed-card rule stays (landed cards visible until the last landing, then all but the top hide together, never per card); E6 (DESIGN.md WordCell) replaces its previous-top clause ("previous top … stay visible") with the previewed top: a copy of the previewed top replaces the previous top as the cell's base, drawn beneath the committed cards; the committed cards (a used target's own free letter too, anywhere earlier in the placement order) fly and stay drawn over it as today (F28); at the last landing the copy goes and the non-top committed cards hide together, leaving the live new top. The cell never looks empty and never shows its previous top.
- Owner decision (Jared, 2026-10-28, the review's decision-needed item): stacking, as the Hold bullet states: the landed committed cards stack over the previewed-top copy (without the `★`) until the last landing (F28 kept), not the final top kept in front; the previous top never flashes. Jared may judge it again at the plan checkpoint or entry 5's device read.
- Copy: the new top's live element is itself the last flying card (fill backwards on its strip rect until its delay), so while `inFlight.committed` is non-empty WordCellRow draws first, in the cell holding the `inFlight.committed` ids (`lowest ≥ 0`; an empty target too), a `preview`-kind mirror (Card `mirror="preview"`, `data-mirror-of`, no card id or testid) of `cell.cards.at(-1)`, with `previewMark` false (the `★` goes at commit, DESIGN.md WordCell, E6), silent (the live top keeps the name), never captured by `flip.ts` and never animated (AD-14 mirrors).
- Reduced motion: the copy replaces the previous top under the unstaggered fade too; the committed faces fade in over it, and at the fade end the hold releases as at the last landing.
- An interrupting move (Undo mid-flight, `finishAll()`) releases the hold with its copy (unit-tested, `flip.test.ts` ~:659); an Undo back to Place shows the `★` preview again.
- The R-52 used-mirror hold is unreachable since ticket 11.2 (a flight starts in Place, which draws no used mirror; the 11.2 plan hands it here) and the new hold replaces it: remove `inFlight.used`, `Measure.mirrors` and the `:not(.preview)` mirror capture in `flip.ts`, and the `usedId` branch and the `lowest − 1` previous-top reveal in `WordCellRow.svelte`; `inFlight` keeps only `committed`.
- Updates the "ticket 11.2 interim" comments (`flip.ts` header and `inFlight` doc, `WordCellRow.svelte` header, `e2e/fly-to-cell.spec.ts`), `Card.svelte`'s `preview` doc comment (now also the hold's copy of the cell's new top, no `★`) and the "(interim hold)" test titles; the AD-14 mirror list and the DESIGN.md hold wording are left to entry 5's close-out, and the plan records the wording needed, E6's "used card" read as the used look (used mirror).
- Plan checkpoint (`plan_checkpoint = true`): an unattended build stops after planning for Jared to approve the plan. Checkpoint passed: Jared approved the plan on 2026-10-28; implement it.

## Acceptance Criteria

Verify:

- `e2e/fly-to-cell.spec.ts`: `expectFlight` (its badge checks at the click and after the last landing stay), the `session-place` Confirm test ("the held copy of the new top" for "previous top") and the three "(interim hold)" tests are rewritten for the new hold (named AD-14 F28 Q-49); the other F28 tests (Undo before a card has started, Undo in the same click task) stay, changed only where they pin the previous top; their Undo checks only the `★` back in Place (the restored preview of 28 in `wordcell-3` carries `.preview-mark`).
- Fixtures: a target that is not used on `session-place-onto-committed` (cell 3 already holds a committed word, previous top 28), for Confirm and, as its own flight in the onto-committed test, for a committing Redo (Confirm, settle, Undo, Redo; the `session-place` Redo in the Undo-before-start test stays); a used target on `session-place-free-letter-redo-tail` (cell 3, card beneath 0), also under reduced motion; a used non-target on `session-place-free-letter-two-cards` (its F28 test renamed with Q-49): source cell 4 shows only its card beneath (20) at every snapshot; a Confirm on `session-place-used-cells` (target 5; AD-14 F28 Q-49): used single-card source cell 3 shows no card (`shown` `[]`) and keeps its `empty` class at every snapshot.
- At the `fly()` snapshots (at the click, after the first landing, just before the last landing, after the last landing; "visible" is computed visibility, as `fly()` reads it; the snapshot also records each WordCell's `.preview-mark` count and `empty` class, detail to the plan): in the first three the target's visible elements, in DOM order (`shown()`), are the held copy of the new top first, then the committed cards (no card beneath the committed run (the cell's cards before its first committed card), no used mirror), e.g. `['p28', '9', '32', '28']` on `session-place-free-letter-redo-tail` and `['p26', '2', '19', '26']` on `session-place-onto-committed`; every `expectFlight` caller and the two-cards target cell 5 expect the copy first too (an empty target's base was its empty slot); at the click the copy has no used look (`.used`) and its face computed opacity 1; no `★` (`.preview-mark`) in any WordCell from the click on; 52 live elements at every snapshot; after the last landing only the live new top is visible and no mirror remains in the target.
- `src/ui/flip.test.ts`: the used-mirror test (~line 600, "AD-14 flyToCell records the target cell used mirror (R-52) …") is replaced by an AD-14 Q-49 test: `Object.keys(inFlight)` is `['committed']`, and a `CELL_START` → `CELL_COMMITTED` flight holds exactly the flying ids (`[3, 4]`) in `inFlight.committed`; the FakeRoot loses its `querySelectorAll('[data-wordcell]')` branch and `Scene.mirrors` and throws on any selector but `[data-card-id]`, the bands and the tile area (the evidence capture reads no mirror); FakeWrapper's parent `data-wordcell` (read by `cellOf`) stays. The committed lifecycle stays covered by the tests at ~:581 and ~:659.
- `npm run test:all` and `npm run test:screens` are green, with no baseline changed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- rules — docs/game-flow-spec.md Q-49, R-52; epic 5 SPEC F28 (_bmad-output/specs/spec-epic-5-tray/SPEC.md)
- design — DESIGN.md Components → WordCell (*place preview*, fly-to-cell)
- architecture — ARCHITECTURE-SPINE.md AD-14
- code — src/ui/flip.ts, src/ui/flip.test.ts, src/ui/WordCellRow.svelte, src/ui/Card.svelte, e2e/fly-to-cell.spec.ts
- fixtures — session-place-onto-committed, session-place-free-letter-redo-tail, session-place-free-letter-two-cards, session-place-used-cells
