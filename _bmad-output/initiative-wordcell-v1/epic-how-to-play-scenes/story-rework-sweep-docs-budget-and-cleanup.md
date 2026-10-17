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

**Removal list** (what 8.10 hands over, see its "Split with 8.11"): `Frame.used` (`Frame.cell6` stays) and the `.cell.used` styles; `Step.carry` and `Carry.lifts: 'dest'`; the Undo pill (`UNDO_BOX`, `undoTarget`, `hasUndo` in `src/ui/scenes/Scene.svelte`) and the `undone` branch in `effects.ts`; fixture `rejected` support in the engine harness; the sourceDrop e2e row's `used: []` with its `.cell.used` assertion; comments in `types.ts` and `geometry.ts` that name any of these. Then a zero-importer check: every export under `src/ui/scenes/`, every how-to-play fixture, every `text.ts` `howTo` key and every e2e helper has a live non-test reference or is deleted, and no snapshot PNG lacks a spec reference. The five scene fixtures stay. Leftovers from 8.1 to 8.10 found by that check go too.

**EXPERIENCE.md** (`_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md`), edited to match the epic's 2026-10-17 rework decision and the built code (`Carousel.svelte`, `Scene.svelte`): the How to play section (~448-475) describes one carousel of five scenes (four basic, then the one Tricky rule), one shown at a time, with previous and next arrow buttons, dots that jump to a scene, and the tap pause, restart and reduced-motion Next behaviour as built; the "Tricky rules" heading and the three-scene outline are removed; "No anchors, links or in-panel navigation (HP-7)" is reworded to allow the carousel controls while still forbidding anchors and links between sections; the stale panel rows (~51, ~166) say a carousel of animated scenes. In the epic file only the Done-when, HP-3, HP-4, HP-5 and HP-7 wording that the rework supersedes gets a one-line "superseded by the 2026-10-17 decision" annotation. `docs/game-flow-spec.md` is not edited.

## Approach

Order: edit, `npm run test:all`, record the margin, `npm run test:screens`. Any source edit after the margin re-runs `test:all` and re-records it. The build ends at plan status `built`.

- Always: remove a test only when its subject is deleted in the same change; every other test stays; every remaining fixture keeps its engine replay test; the unit suite keeps its 5 s budget.
- Never: raise the budget (if over, stop and report), edit the owner-set captions (2026-10-17), or change a pixel of a kept baseline.

## Acceptance Criteria

Verify: `npm run test:all` and `npm run test:screens` are green, the build size is at most 600,000 bytes with the margin recorded, and no unused scene code or fixture remains.

- Build size: the AD-18 gzip-9 total printed by `npm run build` via `scripts/size-budget.mjs`, taken after the final source edit; the script fails only when total exceeds 600,000, so at most 600,000 passes. Margin = 600,000 minus total, recorded in the plan Notes with the HEAD hash of the measured tree.
- text.ts list: a plan Notes table (key, old, new) of every `howTo` string added or changed in `src/ui/text.ts` against 412f96e (the commit before 8.6 began), removed keys listed separately; the owner-set captions are not edited here.
- Baselines: regenerated only through `npm run test:screens` in Docker, never on the host (if Docker is unavailable, stop and report); one final-frame baseline per scene (five), plus `how-to-play-scene-4-start` which a test in `e2e/how-to-play.screens.spec.ts` takes; any PNG without a spec reference is deleted. Unchanged baselines are the expected outcome of dead-code removal; a pixel diff is a defect to investigate, not to accept.
- Coverage: the HP-7 sentences that survive the carousel (panel order, text sections, removed move and worked-example text, budget) still map to named passing tests, with the HP-1 to HP-7 mapping in the plan Notes; no new rule id is claimed. Deletions drop no coverage.
- Done: the plan Notes hold the margin, the text list and the HP mapping; the owner reads and marks it done.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, How to play panel
- constraint — docs/development-methodology.md, Definition of done
- constraint — AGENTS.md (rules 1 to 7, Conventions, Known pitfalls)
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-14 (scenes), AD-17 (tests), AD-18 (budget); scripts/size-budget.mjs
- continuity — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-panel-layout-docs-budget-and-sweep.md (8.5 sweep), story-scene-5-the-one-tricky-rule.md (8.10, "Split with 8.11")
