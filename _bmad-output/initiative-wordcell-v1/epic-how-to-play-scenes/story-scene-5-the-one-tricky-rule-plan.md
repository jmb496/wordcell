---
title: 'Scene 5: the one Tricky rule'
type: 'feature'
ticket: '10'
created: '2026-10-17'
status: 'built'
baseline_revision: 'f12c91de42043c661007f9d9f124dce75a044a5b'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The How to play carousel has seven scenes, three of them Tricky rules. The owner's rework (2026-10-17) keeps one: scene 5 `source-drop`, with a new caption.

**Approach:** Change the `sourceDrop` caption to the owner's verbatim wording. Delete the `destination-rule` and `top-card` scenes, fixtures, tests, e2e entries and baselines. Re-point seven-scene counts to five. Regenerate the scene 5 baseline in Docker.

## Boundaries & Constraints

**Always:** Caption is verbatim: "Dropping back on the column you lifted from is allowed. You must use at least 1 letter from the destination column, unless you drag to an empty column." Only `text.howTo.scenes.sourceDrop` holds it (plus one literal `toBe` in the 'AD-14 scene captions come from text.ts' test). Keep the engine test name 'R-21 R-13 Q-11 scene source-drop'. Leave lint and `check` green.

**Never:** No engine source, stage, geometry, script or source-drop fixture change. Do not remove code only the deleted scenes used (`Frame.used`, `.cell.used`, `Step.carry`, `Carry.lifts: 'dest'`, Undo pill, `undone` branch, fixture `rejected` support, `used: []` in the sourceDrop e2e row): that is ticket 8.11. If one becomes an unused local, remove just that. Do not run screenshots on the host.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Last scene | Carousel at scene 5 | Next arrow `aria-disabled`; dots `Scene n of 5`; in-scene Next gives way to Replay on last frame | None |
| Reduced motion | Next walks scene 5 | Four frames; final tray shows FAKED; figcaption equals new caption | None |

</intent-contract>

## Code Map

- `src/ui/text.ts` -- `howTo.scenes.sourceDrop` caption; remove `destinationRule`, `topCard` and the "Tricky rules scenes" comment (~346-351)
- `src/ui/scenes/index.ts` -- drop two imports and `trickyScenes`; `scenes = [...basicScenes, sourceDropScene]`
- `src/ui/scenes/destination-rule.ts`, `top-card.ts`; `fixtures/how-to-play-destination-rule.json`, `how-to-play-top-card.json` -- delete
- `src/engine/how-to-play-scenes.test.ts` -- remove imports, consts, FIXTURES entries, the two scene tests, `rejected` tests, rows in generic tables
- `src/ui/scenes/scenes.test.ts` -- remove imports, Tricky rows, destination-rule/top-card describes, `trickyScenes`; rewrite follow-the-four test; add literal caption `toBe`
- `e2e/how-to-play.spec.ts` -- remove entries/rows; `trickyScenes` becomes `sourceDropRows`; 7 to 5; re-point last/previous scene tests
- `e2e/how-to-play.screens.spec.ts` -- drop scenes 6, 7; `dot(n, 7)` to 5; delete the two baselines in `e2e/how-to-play.screens.spec.ts-snapshots/`; regenerate scene 5 baseline via `npm run test:screens`
- Comments naming removed scenes: `text.ts`, `index.ts`, `scenes.test.ts` ~1000, engine test ~524, e2e ~788, screens ~17-20. Leave `types.ts`/`geometry.ts` comments to 8.11.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts` -- new caption, remove two keys -- HP-6
- [x] scene scripts, fixtures, `index.ts` -- delete and trim -- five scenes
- [x] `src/engine/how-to-play-scenes.test.ts`, `src/ui/scenes/scenes.test.ts` -- trim and rewrite -- no `trickyScenes`
- [x] `e2e/how-to-play.spec.ts`, screens spec, two baselines -- re-point to five, delete -- HP-4/HP-5
- [x] regenerate `how-to-play-scene-5-final-android-linux.png` in Docker and inspect it

**Acceptance Criteria:**
- Given the carousel, when opened, then it has five scenes ending in `source-drop`, and the last Next arrow is `aria-disabled`.
- Given scene 5 under reduced motion, when Next is walked, then the last frame shows FAKED and the figcaption equals `text.howTo.scenes.sourceDrop`.
- Given the repo, when `grep -rnE "destination-rule|destinationRule|trickyScenes|topCardScene|howTo\.scenes\.topCard|top-card-step|how-to-play-top-card|\btopCard:" src e2e fixtures` runs, then it finds nothing.
- `npm run test:all` and `npm run test:screens` are green.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-17 — Review pass
- verdicts: 12 findings — high 0, medium 0, low 10, false 2, maybe-false 0
- findings:
  - `[false]` `[reject]` Blind: plan file unfinished/empty logs — filled in at finalize by this step.
  - `[low]` `[reject]` Blind: caption names no empty-column scene — owner's verbatim wording (ticket Notes, accepted); no scene by design.
  - `[low]` `[reject]` Blind: R-22/R-31/R-33 scene coverage orphaned — engine tests carry them (ticket: commands.test.ts); planned removal.
  - `[low]` `[reject]` Blind: harness `rejected` path untested — inline fixtures at how-to-play-scenes.test.ts:469-504 still cover it; 8.11 removes it.
  - `[low]` `[reject]` Blind: single-row it.each/describe.each — harmless; fix is churn.
  - `[low]` `[reject]` Blind: hardcoded 5 — mirrors ticket-listed edits; not worth added complexity.
  - `[low]` `[reject]` Blind: stale comments — pre-existing or 8.11-owned; no named harm.
  - `[low]` `[reject]` Blind: caption literal/test name — test name predates this change; literal is the plan's requirement.
  - `[false]` `[reject]` Blind: no last-scene test — existing disabled-arrow and Replay tests were re-pointed in place.
  - `[low]` `[reject]` Edge: deleted tests covered lifts:'dest'/Undo pill — dead code is 8.11's to delete.
  - `[low]` `[reject]` Edge: rejected branch untested — see above.
  - `[low]` `[reject]` Edge: `used: []` trivially true — plan keeps it for 8.11.
  - Verification-gap: no findings. Intent-alignment: descriptive; diverges only on the empty-column clause, which is the owner's accepted wording.

## Verification

**Commands:**
- `npm test -- src/engine/how-to-play-scenes.test.ts` -- expected: pass
- `npm run test:all` -- expected: pass
- `npm run test:screens` -- expected: pass (Docker)

## Auto Run Result

- Summary: scene 5 caption replaced with the owner's wording; `destination-rule` and `top-card` scenes, fixtures, tests, e2e entries and baselines removed; carousel is five scenes; scene 5 baseline regenerated in Docker.
- Files: `src/ui/text.ts`, `src/ui/scenes/index.ts`, `src/engine/how-to-play-scenes.test.ts`, `src/ui/scenes/scenes.test.ts`, `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts`, scene 5 baseline updated; deleted two scene scripts, two fixtures, scene 6 and 7 baselines.
- Review: no patches, nothing deferred; all 12 findings rejected (reasons in the triage log).
- Follow-up review recommended: false.
- Verification: `npm run test:all` exit 0 (948 e2e, 13 pwa passed); `npm run test:screens` 42 passed (implementer's run); plan grep empty.
- Residual risks: the implementer saw a transient app-boot failure and one drag-test flake in an earlier run; the final full run was clean.
