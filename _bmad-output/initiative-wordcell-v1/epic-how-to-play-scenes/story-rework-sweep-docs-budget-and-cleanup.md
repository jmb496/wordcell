---
id: 11
type: story
title: "Rework sweep: docs, budget and cleanup"
parent: epic-how-to-play-scenes
covers: [HP-7]
after: [10]
hitl: false
risk: low
done_checkpoint: true
---

# Rework sweep: docs, budget and cleanup

## Description

Removes dead scene code, fixtures, text and tests of the replaced scenes, updates the EXPERIENCE.md How to play section (carousel, arrows, dots, five scenes), updates specs and screenshot baselines, measures the bundle against the 600,000-byte budget and records the margin, and lists every new or changed text.ts string for the owner's review. "Specs" means Playwright specs. No behaviour change; no engine, shell, rule or fixture-content change beyond deleting unused items.

**Removal list** (what 8.10 hands over, see its "Split with 8.11"): the `Frame.used` type and the `frame.used` loop in `Scene.svelte` (~350) that renders it, with `MINI_CELLS`/`miniCells` and their comment (~219) if nothing else reads them, and the `scenes.test.ts` tests of that subject ('Frame.used is the addFreeLetter cells so far' ~1056, 'the open tray layer repeats exactly the Frame.used cells as .cell.used' ~1090) and the test-local `used?` field (~1003), keeping every assertion on the kept `cell6: 'used'` rendering and the free-letter frame test (~1242); the `.cell.used` CSS rules stay, because the kept scene-2 `cell6: 'used'` element (`free-letter.ts`) renders with them and e2e asserts `.cell6.used`; `Step.carry`, `Carry.lifts: 'dest'`, the `lifts === 'dest'` throw and `step.carry ??` branches in `script.ts`, the dest-mover and dest-fly branches in `effects.ts`, and `flownAt`, `carries.dest` and the `'tail' | 'dest'` mover union in `effects.ts` once nothing sets them (verify by grep); in the `scenes.test.ts` test 'every grab and drop step carry is pinned' the step-override mutation is rewritten, not deleted: the 'carry differs from fixture drop command' throw in `script.ts` stays reachable through `scene.carry`, so the mutation overrides `scene.carry` (e.g. `defineScene({ ...scene, carry: wrong })`) and the throw stays asserted (`Scene.carry` and `Carry` stay); the Undo pill (`UNDO_BOX` in `geometry.ts`, `undoTarget` in `tray-scene.ts`, `hasUndo`, the `undoBox` use and the undo span in `Scene.svelte`, the `'undo'` tap entry in `script.ts`, the `undone` branch in `effects.ts`); fixture `rejected` support in `src/engine/scene-replay.ts` (the `rejected?` field, the `RejectedOutcome` type and the loop at ~206, and the `EngineError` import if only that loop uses it) with its tests in `src/engine/how-to-play-scenes.test.ts`: the rejected-case test (~469-488) is deleted whole; in the index-range test (~490-510) only the two `rejected` rows go, with locals they leave unused; while `rejectedWords` and the validatable and R-38 tests stay; the array-valued `used` in the sourceDrop e2e rows (~826-829) and its `.cell.used` assertion (~856-857) in `e2e/how-to-play.spec.ts` (the boolean `used` rows ~329-347 and the `.cell6.used` assertion ~371 stay). General rule: imports, locals, constants and comments orphaned by a removal go too, and comments naming a removed item are cleaned in any file under `src/ui/scenes/`, `src/engine/` and `e2e/`. Then a zero-importer check run to a fixed point: every export under `src/ui/scenes/`, every how-to-play fixture, every `text.ts` `howTo` key (references counted through local aliases of `text.howTo.<group>`, e.g. `h.` in `HowToPlayPanel.svelte`, `labels.` in `Carousel.svelte`, `controls.` in `Scene.svelte`; the test-only `text.howTo.scenes[key]` read in `scenes.test.ts` keeps no key alive; run `npm run check` after each batch of deletions) and every e2e helper has a live non-test reference or is deleted, and no snapshot PNG lacks a spec reference. References from deleted code, from tests of deleted subjects or from other deleted items do not count; an export used only by tests goes with the test of that subject unless that test covers a kept behaviour. An e2e helper needs a reference from a spec other than `e2e/helpers.spec.ts`, else it goes with its helper test. Audit by grep per export, results in the plan Notes. The five scene fixtures stay. Leftovers from 8.1 to 8.10 found by that check go too.

**EXPERIENCE.md** (`_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md`), edited to match the epic's 2026-10-17 rework decision and the built code (`Carousel.svelte`, `Scene.svelte`): the How to play section (~448-475) describes one carousel of five scenes (four basic, then the one Tricky rule), one shown at a time, with previous and next arrow buttons, dots that jump to a scene, and the tap pause, restart and reduced-motion Next behaviour as built; the "Tricky rules" heading and the three-scene outline are removed; "No anchors, links or in-panel navigation (HP-7)" is reworded to allow the carousel controls while still forbidding anchors and links between sections; the "Scenes" paragraph (~466) describes the carousel, naming the arrows ("Next scene", `text.ts` `carousel`) and the reduced-motion frame control ("Next", `sceneControls.next`) separately; the stale panel rows (~51, ~166) say a carousel of animated scenes. In the epic file, annotate explicitly: HP-3, HP-4 and the HP-7 panel layout "superseded by the 2026-10-17 decision" (the owner's note names exactly these); the Description and Outcome lines that still say three Tricky scenes, Done-when items 1 and 5, HP-1 ("no other visible buttons") and HP-5's rejected-cases sentence "no longer exercised by the five-scene carousel (2026-10-17 rework)". HP-2 and HP-6 stay unchanged (the Next control and control names still hold). `docs/game-flow-spec.md` is not edited.

## Approach

Order: edit, `npm run test:all`, record the margin, `npm run test:screens`. Any source edit after the margin re-runs `test:all` and re-records it. The build ends at plan status `built`.

- Always: remove a test only when its subject is deleted in the same change; every other test stays; every remaining fixture keeps its engine replay test; the unit suite keeps its 5 s budget.
- Never: raise the budget (if over, stop and report), edit the owner-set captions (2026-10-17), or change a pixel of a kept baseline.

## Acceptance Criteria

Verify: `npm run test:all` and `npm run test:screens` are green, the build size is at most 600,000 bytes with the margin recorded, and no unused scene code or fixture remains.

- Orphans: no unused local, constant, import or comment remains in the touched files.

- Build size: the AD-18 gzip-9 total printed by `npm run build` via `scripts/size-budget.mjs`, taken after the final source edit; the script fails only when `total > BUDGET_BYTES`, so at most 600,000 passes (`tickets.toml` verify says "under 600,000"; the script governs). Margin = 600,000 minus total, recorded in the plan Notes with the base HEAD hash and the line "measured on that HEAD plus the uncommitted working tree" (8.5 precedent, `story-panel-layout-docs-budget-and-sweep.md`).
- text.ts list: a plan Notes table (key, old, new) of every `howTo` string added or changed in `src/ui/text.ts` diffed 412f96e..HEAD (412f96e is the parent of 68b5c41, the first commit to change the `howTo` strings, so the table includes 68b5c41's own edits, e.g. `headings.tricky` removed and `carousel` added), removed keys listed separately, a renamed or moved key shown as removed plus added with a note; the owner-set captions are not edited here.
- Baselines: regenerated only through `npm run test:screens` in Docker, never on the host (if Docker is unavailable, stop and report); the expected set is the six `-android-linux` PNGs present today (five final frames plus `how-to-play-scene-4-start`, names built from the spec template in `e2e/how-to-play.screens.spec.ts`); `npm run test:screens` is the reference check (no orphan PNG, no missing file), and an orphan is deleted. Unchanged baselines are the expected outcome of dead-code removal; a pixel diff is a defect to investigate, not to accept.
- Coverage: the HP-7 sentences that survive the carousel (panel order, text sections, removed move and worked-example text, budget) still map to named passing tests, with the HP-1 to HP-7 mapping in the plan Notes (superseded sentences, such as HP-5's rejected cases, are marked "superseded", not mapped to a test); no new rule id is claimed. Deletions drop no coverage.
- Done: the plan Notes hold the margin, the text list and the HP mapping; the owner reads and marks it done.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, How to play panel
- constraint — docs/development-methodology.md, Definition of done
- constraint — AGENTS.md (rules 1 to 7, Conventions, Known pitfalls)
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-14 (scenes), AD-17 (tests), AD-18 (budget); scripts/size-budget.mjs
- continuity — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-panel-layout-docs-budget-and-sweep.md (8.5 sweep), story-scene-5-the-one-tricky-rule.md (8.10, "Split with 8.11")
