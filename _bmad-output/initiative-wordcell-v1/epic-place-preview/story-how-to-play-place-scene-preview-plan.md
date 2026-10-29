---
title: 'How to play Place scene preview'
type: 'feature'
ticket: '4'
created: '2026-10-29'
status: done
baseline_revision: '8cd6b844ad0eb3aaa21f50ee5d31d93b87b8f1db'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context: ['{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/story-how-to-play-place-scene-preview.md', '{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md']
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The How to play Place scene still draws WordCell 6 used (dimmed L) on every Place frame (epic 8 D5), while the game now shows the Q-49 preview: the changed cells as they will be after Confirm, with the `★` (E7).

**Approach:** The place fixture gains an engine-checked `previews` list. Frames 1–4 (the `placeOrder` frames) gain `after` (the fixture command count, `after` 4–7) and drop `cell6`. Scene.svelte draws each changed cell from the `previews` entries at `frame.after`: one `static` card with `previewMark` for a letter, or the empty outline for `null`, with no count badge (owner, 2026-10-29). Frame 0 keeps cell 6 used (D5); frame 5 is unchanged. With motion on, frame 4's `★` (`mark-4`) is held at opacity 0 in phase 0 of the tuck fly step `place-step-6` (the fly step has no `wait`).

## Boundaries & Constraints

**Always:** AD-1/AD-3: every drawn preview fact comes from the fixture `previews`, which `replayScene` checks exactly against `view().cells[].preview` at every after 0..`commands.length`. Rule 6: Scene.svelte throws (as `needed()` does) when a `placeOrder` frame has no `after`, the fixture has no `previews`, or no entry has that after. AD-14: scene cards stay `mirror="static"`, with no `data-mirror-of`, `data-card-id` or `data-testid`. Test names lead with the ids the ticket gives (AD-14 Q-49, Q-49, AD-11, AD-17).

**Never:** No count badge in any scene frame. No change to the fixture's start, commands or existing entries, to frames 0 and 5, to the other scenes (free-letter's Validate-pressed frame included), to WordCellRow, to the engine `view.ts`, or to any existing screenshot baseline. Do not edit the epic 8 Notes, the ticket files, DESIGN.md, EXPERIENCE.md or the spine (entry 5 closes out the docs).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Frame 0 | tray frame | cell 6: L in the used look, no `★` | none |
| Frames 1, 3 | `after` 4, 6, target 6 | cell 6: one card D with `★`; no used card | none |
| Frame 2 | `after` 5, target 5 | cell 5: D with `★`; cell 6: no card, `.stack.empty.lit`, no `★` | none |
| Frame 4 | `after` 7, target 6 | cell 6: E with `★`, the `★` carries `data-scene-el="mark-4"` | none |
| Frame 5 | after Confirm | cell 6: one top card E, no `★` (unchanged) | none |
| Fixture mismatch | wrong top / count, missing entry, extra entry | `replayScene` throws `scene place: after A commands cell C stated preview X, engine Y` | plain `Error` |
| Bad frame | a `placeOrder` frame's `after` is missing, or names an after with no entries (e.g. 3) | render throws `scene place: …` | plain `Error` |

</intent-contract>

## Code Map

- `fixtures/how-to-play-place.json` -- append `"previews"`: `{after 4, cell 6, top "D", count 6}`, `{5, 5, "D", 6}`, `{5, 6, null, 0}`, `{6, 6, "D", 6}`, `{7, 6, "E", 6}`. Afters 0–3 and 8 have no entries.
- `src/engine/scene-replay.ts` -- `SceneFixture.previews?: readonly { after; cell; top: string | null; count }[]` with a doc comment (Q-49). After the `columns` loop, when `previews` is present: `index('previews after', …)` for every entry first; then for each after 0..count, compare the union of the cells listed at that after with the cells whose `viewFrom(...).cells[].preview` is defined. Letter = `faces[top].letter` (`'QU'` stays `'QU'`). One message: `after ${a} commands cell ${c} stated preview ${fmt(listed)}, engine ${fmt(engine)}`, where `fmt` gives `none`, `empty 0` or `<letter> <count>`. A cell listed twice at one after also fails (`listed twice`). Update the `replayScene` doc to name `previews`.
- `src/engine/how-to-play-scenes.test.ts` -- `edit` helper (:277), the place tests (:283–445), the BALKED-missing test (:421, its emptied-field list), the AD-2 out-of-range test on `baseDrop` (:491).
- `src/ui/scenes/types.ts` -- `SceneFixtureData.previews?` (same shape, UI doc). `Frame.after?: number` (the fixture command count a Place frame shows; Q-49).
- `src/ui/scenes/place.ts` -- `placing(after, placeTarget, placeOrder)` sets `after` and no `cell6`. The frames get `after` 4, 5, 6, 7. Add `'mark-4'` to `elements` (after `'strip-4'`). Header (:20–26): D5 stays for frame 0; Q-49 for frames 1–4 (previewed tops with the `★`, no badge).
- `src/ui/Card.svelte` -- add the prop `markEl?: string` (doc: How to play only; Scene.svelte passes `mark-<i>`, WordCellRow never does). Write `data-scene-el={markEl}` on the `.preview-mark` span. Update the `previewMark` doc if needed.
- `src/ui/scenes/Scene.svelte` -- in the place-layer `{#each PLACE_CELLS}` (:395–420): a helper `previewsAt(frame, i)` returns `undefined` for a frame without `placeOrder`, else the entries at `frame.after`. It throws `scene ${id}: frame ${i} has no after` / `needed('previews')` / `scene ${id}: frame ${i} has no previews entry at after ${after}`. A cell with an entry draws `top === null ? [] : [top]`, with `previewMark` on that card, and `markEl={i === lastPlace && target ? \`mark-${i}\` : undefined}`, where `lastPlace` is the index of the last `placeOrder` frame. Other cells use `cellCards`. `used` stays `cell === 6 && frame.cell6 === 'used'`. Rewrite the `cellCards` comment (:151–152, it no longer covers frames 1–4) and keep the frame-0 D5 comment (:456).
- `src/ui/scenes/effects.ts` -- tucks branch (:117–175): `markId = \`mark-${scene.frames.indexOf(placed)}\``; push `hold(markId, 0)` with the strip and Confirm holds (phase 0). Nothing targets `place-4`.
- `src/ui/scenes/script.ts` -- tucks `needs` (:83–89) adds `mark-${scene.frames.indexOf(placed)}`; extend the defineScene doc.
- `src/ui/scenes/Stage.svelte` -- after `.card .mark` (:159): `.stage :global(.card .preview-mark) { width: calc(16px * var(--wc-scene-up)); height: calc(16px * var(--wc-scene-up)); font-size: calc(11px * var(--wc-scene-up)); }`; the D12 comment names the `★` pill (size and font, not the inset).
- `src/ui/scenes/scenes.test.ts` -- `placeLayers` (:1083) gains per-cell `glyphs`, `marks` (`.preview-mark` count), `markEl` and `empty`. Tests at :741 (tuck), :1017 (six layers), :1160 (dim/used), :1431–1474 (cell 6 describe), the APPLIED table (:1435).
- `src/ui/scenes/stage.test.ts` -- AD-11 test (:261–275).
- `e2e/how-to-play.spec.ts` -- reduced-motion place test (:531), motion-on tuck test (:662). The comment at :541 cites D5 for frame 0 only and stays.
- `e2e/how-to-play.screens.spec.ts` -- the new frame-4 test.
- Read-only: `src/ui/WordCellRow.svelte` (count badge class `count`, game `★` use), `e2e/helpers/how-to-play.ts` `openScene` (`last` = Next clicks).

## Tasks & Acceptance

**Execution:**
- [x] `fixtures/how-to-play-place.json`, `src/engine/scene-replay.ts` -- `previews` data and the exact check (Code Map) -- E7 engine-checked (AD-3).
- [x] `src/engine/how-to-play-scenes.test.ts`:
  - New `Q-49 scene place: the previews entries match the engine preview at every after (afters 3 and 8 none)`: replays clean and pins the `[after, cell, top, count]` list.
  - New `it.each` `Q-49 scene place: a %s fails the harness` over wrong top (after 4 `E`), wrong count (after 4 `7`), missing entry (cell 6 `null` at after 5 removed), and extra entry (`{after 4, cell 3, top null, count 0}`). Each throws `/^scene place: after \d commands cell \d stated preview/`.
  - BALKED test: add `previews: []` to the emptied fields.
  - AD-2 out-of-range test: add `previews` afters 2 and -1 on `baseDrop`.
- [x] `src/ui/scenes/types.ts`, `place.ts`, `script.ts`, `effects.ts`, `Card.svelte`, `Scene.svelte`, `Stage.svelte` -- per Code Map.
- [x] `src/ui/scenes/scenes.test.ts`:
  - :1160 renamed `AD-14 R-40 R-33 Q-49 scene place: not-legal cells dim in Place, cell 6 is used in frame 0 only and frames 1 to 4 draw the preview (owner decision D11)`. In both motion modes it asserts the matrix rows Frame 0 to Frame 5 for cells 5 and 6 (glyphs, used, `★` count, empty). The other cells are unchanged from `cellCards`. `data-scene-el="mark-4"` appears only on frame 4's cell 6. No layer contains `class="count`.
  - New `AD-14 Q-49 scene place: frame.after is the applied command count on frames 1 to 4, absent on frames 0 and 5` (from APPLIED).
  - New `AD-14 Q-49 scene place: rendering throws when a Place frame names an after with no previews entries or has no after`: frame 2 `after: 3` and frame 2 without `after`; `rejects.toThrow(/^scene place: frame 2/)`.
  - :741 renamed with `Q-49` added after AD-14. It asserts no fly-step effect has `element === 'place-4'`, and that `mark-4` is `[{opacity:0},{opacity:0}]` with phase 0.
  - :1017 also asserts 4 `class="preview-mark"` and one `data-scene-el="mark-4"`.
  - Cell 6 describe: the comment cites D5 for frame 0 and Q-49 for frames 1–4. Rename the `it.each` to `AD-14 R-33 scene %s: cell 6 is drawn used exactly while the applied fixture commands hold its top card, except on Place frames (Q-49)`; a frame with `placeOrder` expects not `'used'`. Rename the place case to `AD-14 R-33 Q-49 scene place: cell 6 is used in frame 0 only, and Confirm draws its top`, expecting `['used', undefined ×4, 'top']`.
- [x] `src/ui/scenes/stage.test.ts` -- the AD-11 test also asserts that the `.stage :global(.card .preview-mark)` rule has width, height and font-size each reading `var(--wc-scene-up)` (three separate property matches).
- [x] `e2e/how-to-play.spec.ts`:
  - Reduced-motion test renamed with `Q-49` after `R-60`. Per frame, the table gains `cell5` letters, `cell6` letters (`''` for frame 2), `stars` (cells with `.preview-mark`: `[]`, `[6]`, `[5]`, `[6]`, `[6]`, `[]`), `empty6` (frame 2 only) and `used` (frame 0 only). Assert an empty cell with `toHaveCount(0)`.
  - Motion-on test renamed with `Q-49` after `R-52`. One poll `page.evaluate` returns `{ running: <count of running place-step-6 tuck-* animations>, opacity: getComputedStyle(mark-4).opacity, glyph: place-4 cell 6 .glyph text }` and must equal `{ running: 6, opacity: '0', glyph: 'E' }`.
- [x] `e2e/how-to-play.screens.spec.ts` -- new `AD-17 how to play scene 3 frame 4 screenshot at 360 px` (reduced motion, `openScene` `last: 4`, Next visible), snapshot `how-to-play-scene-3-frame-4.png`. Generate it in the container (`npm run test:screens -- --update-snapshots` for that test only), then run the full compare.

**Acceptance Criteria:**
- Given the How to play panel on `android`, when scene 3 is stepped under reduced motion, then each frame draws its matrix row and no frame draws a count badge.
- Given motion on, when the tuck fly step runs, then `mark-4` has computed opacity 0 and place-4's cell 6 still shows E under the fliers, until `place-5` swaps in.
- Given the change, when `npm run test:all` and `npm run test:screens` run, then both pass, and the only new PNG is `how-to-play-scene-3-frame-4.png` (`git status` shows no other change under `e2e/**/*-snapshots/`).

## Implementation Notes

- `previews` check (scene-replay.ts): range-checks every entry first, then per after 0..count compares the union of listed and engine-previewed cells, in cell order; a duplicate at one after fails with `listed twice in previews`.
- e2e reduced-motion test reads the cell letters from `.card .glyph`: a previewed card's text also holds the `★` pill.
- scenes.test.ts `placeLayers` cuts each cell segment at the next `.tiles`, `.ctl` or `.layer` so cell 10 never picks up strip, Confirm or tuck-flier glyphs.
- Verification: `npm run test:all` green (a first run hit one flake in the untouched `e2e/flip-controller.spec.ts:350` reduced-motion fade test, which passed 5/5 alone and in the full rerun); `npm run test:screens -- --update-snapshots -g "scene 3 frame 4"` wrote only `how-to-play-scene-3-frame-4-android-linux.png`, then the full `npm run test:screens` passed 68/68 with no other snapshot change; `grep -n "cell6: 'used'" src/ui/scenes/place.ts` gives frame 0 only (line 58).

## Plan Change Log

## Review Triage Log

### 2026-10-29 — Review pass
- verdicts: 19 findings — high 0, medium 0, low 11, false 8, maybe-false 0
- findings:
  - `[low]` `[patch]` (blind) The harness's `listed twice in previews` failure has no test — added `Q-49 scene place: an after/cell pair listed twice in previews fails the harness` (how-to-play-scenes.test.ts).
  - `[low]` `[reject]` (blind) A `previews` entry naming a cell outside 3–10 reports `stated preview X, engine none`, not "no such cell" — it still fails loudly with the cell and after named; a separate cell range check is a new guard for a fixture typo the message already locates.
  - `[low]` `[patch]` (blind) The render-throw test misses the fixture-without-`previews` path (`needed('previews')`) — added a third case expecting `/^scene place: the fixture has no previews/`; test renamed.
  - `[low]` `[reject]` (blind) `Frame.after` is not validated in `defineScene` (ignored on non-Place frames, no bound, no monotonic check) — the one scene with `after` is pinned by `AD-14 Q-49 scene place: frame.after is the applied command count …` against APPLIED; new defineScene branches guard no reachable state.
  - `[low]` `[reject]` (blind) The "no count badge" checks look only for the game's `.count` class — Scene.svelte has no count element at all, and the unit MATRIX pins each previewed cell's glyphs and `★` count; a badge would be a deliberate new element that the screenshot baseline also catches. Rewriting the assertions to full-text pins is more than a direct correction.
  - `[low]` `[patch]` (blind) Nothing shows the `★` is visible before the commit with motion on — the tuck test now asserts `mark-4` has exactly one effect across all steps, the fly step's phase-0 hold.
  - `[low]` `[reject]` (blind) The pill's visibility and bottom-left position are not asserted, and the target ring overlaps it by about 1 px — the new frame-4 baseline (inspected: E with the `★` bottom-left, no badge) pins the look; the ring geometry is the scene's existing `.stack.target::after`, and the look is Jared's entry-5 device read.
  - `[low]` `[reject]` (blind) Frame 2 (empty lit cell 6) has no screenshot baseline — the ticket asks for exactly one new baseline (scene 3 frame 4) with no other baseline change; frame 2 is covered by the unit MATRIX, the `.stack.empty.lit` regex and the e2e table.
  - `[false]` `[reject]` (blind) Only the target's `★` fades at commit, so a non-target previewed cell would keep its star — no such state exists: at after 7 the fixture (engine-checked exactly) previews only cell 6, the target; the claim needs a different fixture.
  - `[false]` `[reject]` (blind) The scene caption says nothing about the preview (owner question) — the epic Boundaries exclude any message-catalogue string beyond the two screen-reader names, and scene stages are aria-hidden by design (AD-14); not a gap of this ticket.
  - `[false]` `[reject]` (edge-case) A last Place frame whose previews lack a non-null target top renders no `mark-4`, so the player throws `no element mark-4` — that is a loud rule-6 failure for an unreachable fixture state (the harness pins after 7 cell 6 = E 6; the SSR test pins exactly one `mark-4`); loud failure is the specified behaviour.
  - `[low]` `[patch]` (verification-gap) Duplicate-entry guard untested (same root cause as the first blind row) — fixed by the same new test.
  - `[false]` `[reject]` (intent) The scene draws no count while the game's target does (E2) — the owner decision of 2026-10-29 (ticket Description, epic Notes) is exactly that.
  - `[low]` `[reject]` (intent) No test compares the scene's pill with the game's WordCell pixel-for-pixel — both use the one `Card.svelte` `previewMark` rule; the baseline and the entry-5 device read are the look checks the epic prescribes.
  - `[low]` `[reject]` (intent) E6 timing is checked at the effect-data level and at one polled e2e moment, not over the whole interval — the hold is one `fill: forwards` effect lasting the whole step (`times: n`), and the unit test pins it as the only `mark-4` effect; interval sampling adds flakiness for no reachable gap.
  - `[false]` `[reject]` (intent) No new assertion for the unchanged reduced-motion frame 4 → 5 step — the e2e table walk asserts frames 4 and 5 after Next, and `sceneAnimations` is empty; the step code is unchanged.
  - `[false]` `[reject]` (intent) Frame 2's "ringed as legal" is only indirectly checked — the e2e `cellNumbers('.stack.lit')` row for frame 2 is `[3, 4, 6]` and the unit regex pins `stack … empty … lit` on cell 6.
  - `[false]` `[reject]` (intent) "Every scene frame stays badge-free" is asserted only for the place scene — the other scenes are untouched by this diff and Scene.svelte renders no count badge in any mode.
  - `[false]` `[reject]` (intent) tickets.toml entry 4's "unchanged" clause is not edited — build runs never write ticket files; the story supersedes it in its own text, and entry 5 closes out docs.

## Design Notes

- Why `after` on the frame and not the frame index: the frame → command mapping is already the APPLIED table in tests. An explicit `after` lets Scene.svelte read `previews` without the test-only table, and lets a broken copy (frame 2 `after: 3`) fail loudly.
- Containing block: the scene card is `place="column"`, which is not positioned, so the absolute `.preview-mark` is placed against Scene.svelte's `.stack` (`position: relative`). That is correct only while every previewed cell is a one-card stack, which holds by construction: a previewed cell draws `[top]` or `[]` (review minor 6).
- Every non-null `previews` top gets `previewMark` (E4); `markEl` goes only on the last `placeOrder` frame's target. This fixture has no non-target previewed top, but the rule covers one (minor 5).
- Review-log minors, all ten resolved here:
  1. The fly step has no `wait`, so the `★` goes in phase 0 of `place-step-6`.
  2. The BALKED test gets `previews: []`.
  3. `script.ts` is in the Code Map.
  4. The `it.each` name stays scene-neutral.
  5. See the previewMark/markEl note above.
  6. See the containing-block note above.
  7. stage.test checks width, height and font-size separately.
  8. The negative cases anchor on the `stated preview` message.
  9. The e2e :541 comment stays (D5, frame 0); the Scene.svelte `cellCards` comment is rewritten.
  10. "`after` 4–7" wording, used throughout.
- Owner decision (2026-10-29): no count badge. `previews.count` is still engine-checked, as the fixture's truth, but it is not drawn.

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npm run test:screens` -- expected: green; only `how-to-play-scene-3-frame-4.png` is new.
- `grep -n "cell6: 'used'" src/ui/scenes/place.ts` -- expected: frame 0 only.

## Auto Run Result

- **Status:** `built`.
- **Change:** the How to play Place scene's Place frames (1–4) now draw the Q-49 preview, as the game does.
  - The target shows the last placement-order letter with the `★`, and no count badge (owner decision, 2026-10-29).
  - In frame 2, cell 6 (used, not the target) shows its empty outline, ringed as legal.
  - Frame 0 keeps cell 6 used (D5), and frame 5 is unchanged.
  - The preview is engine-checked: the place fixture gains `previews`, and `replayScene` matches them exactly against `view().cells[].preview` at every after.
  - With motion on, frame 4's `★` (`mark-4`) is held at opacity 0 in phase 0 of the tuck fly step, while E stays on cell 6 under the fliers.
- **Files:**
  - `fixtures/how-to-play-place.json`: the `previews` list (afters 4–7).
  - `src/engine/scene-replay.ts`: `SceneFixture.previews` and the exact check.
  - `src/engine/how-to-play-scenes.test.ts`:
    - new: the Q-49 positive case, four negative cases and the duplicate case;
    - changed: `previews: []` in the BALKED test, and the out-of-range cases.
  - `src/ui/scenes/types.ts`: `SceneFixtureData.previews` and `Frame.after`.
  - `src/ui/scenes/place.ts`: frames 1–4 carry `after` 4–7 and no `cell6`; `mark-4` declared; the header cites D5 for frame 0 and Q-49 for frames 1–4.
  - `src/ui/Card.svelte`: the `markEl` prop writes `data-scene-el` on the `★` pill.
  - `src/ui/scenes/Scene.svelte`: `previewsAt` draws the previewed tops, with its rule-6 throws; the `cellCards` comment is rewritten.
  - `src/ui/scenes/effects.ts`: the `mark-<placed>` phase-0 hold in the tuck step.
  - `src/ui/scenes/script.ts`: tucks `needs` includes `mark-<placed>`.
  - `src/ui/scenes/Stage.svelte`: the `★` pill's size and font are counter-scaled (D12).
  - `src/ui/scenes/scenes.test.ts`:
    - changed: the frame matrix in both motion modes, the D5 tests renamed and updated, and the tuck hold checks;
    - new: `frame.after` and the render-throw cases.
  - `src/ui/scenes/stage.test.ts`: checks the `.preview-mark` width, height and font-size.
  - `e2e/how-to-play.spec.ts`: the reduced-motion frame table and the motion-on `mark-4` opacity and E glyph poll.
  - `e2e/how-to-play.screens.spec.ts` and the new baseline `how-to-play-scene-3-frame-4-android-linux.png`.
- **Review (thorough: blind-hunter, edge-case-hunter, verification-gap, intent-alignment):** 19 findings. 4 patched (all low, 3 distinct test additions), 0 deferred, 15 rejected (8 false, 7 low); the reasons are in the Review Triage Log.
- **Follow-up review recommended:** `false`. Patched counts: high 0, medium 0, low 4.
- **Review-log minors:** all ten are resolved in Design Notes.
- **Owner decision applied:** no count badge in the scene.
- **Verification:**
  - `npm run test:all` green after the patches (unit 3637; dist 21; e2e 1120; pwa 17). The pre-patch run was also green after a rerun; its first attempt timed out once in `src/architecture-tree-scan.test.ts` (the 5 s walk over `/mnt/d` drvfs), which this change doesn't touch.
  - `npm run test:screens` green (68 passed); the only new PNG is `how-to-play-scene-3-frame-4-android-linux.png`, inspected: strip D B A L K E, cell 6 E with the `★` bottom-left, no badge.
  - `grep "cell6: 'used'" src/ui/scenes/place.ts` gives frame 0 only.
  - Matrix audit passed: every I/O row is covered by a test that passed.
- **Residual risks:**
  - The `★` pill is positioned against the scene's `.stack`, which is correct only while a previewed cell is one card (true by construction).
  - The target ring overlaps the pill by about 1 px; the look is judged at Jared's entry-5 device read.
  - Close-out for entry 5: EXPERIENCE.md How to play (Place scene) and DESIGN.md should state that the scene's preview has the `★` and no count badge.

