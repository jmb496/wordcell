---
title: 'Close the 7.11 §6.4 test-name and celebration-colour gaps'
type: 'chore'
ticket: '15'
created: '2026-11-07'
status: 'built'
baseline_revision: '404c5250b88f971a3a49c8346fa93ee37d3b6792'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-close-the-7-11-6-4-test-name-and-celebration-colour-gaps.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-close-the-7-11-6-4-test-name-and-celebration-colour-gaps.review-log.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Ticket 7.11's §6.4 audit found Q-17 (portrait on the phone, responsive in a browser) with no passing test titled with its id, and R-87's "no colour change" clause (Q-48) with no automated assertion (epic 10 `rule-coverage.md:61` lists it as a visual exemption).

**Approach:** Retitle two existing tests to carry `Q-17` (assertions unchanged); add one `android` Playwright test in `e2e/celebration.spec.ts` that samples the run twice on the manual clock and asserts no trail and no colour change on the shown copies against the live faces; move the epic 10 Exempt line to a mapped P6 row. No `src/` change.

## Boundaries & Constraints

**Always:** Test titles start with the id (`Q-17 AD-16 …`, `Q-17 AD-12 …`, `R-87 …`). Live reads are scoped to `[data-card-id]` descendants (mirrors excluded). Copy visibility and group opacity are read in the same `page.evaluate` as the colour reads. Every stepping loop is bounded by `NORMAL_CAP_STEP_MS` and stops when `celebration.running()` is false. A failure of the test's own premise (live faces not uniform, QU copy never shown before the cap) is fixed in the test and recorded under Implementation Notes; only a shown copy whose colours differ from the live face set stops for the owner (HALT `blocked`, a real `src/` defect).

**Never:** Change any `src/` file, the assertions of the two retitled tests, `stepUntilShown` or its callers, any screenshot spec, or any fixture. No second theme loop (see Design Notes).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Premise | `prefs-theme-scifi`, won board right after `winIntoRun` | all 52 live `[data-card-id] .face` share one value set; all live `[data-card-id] .glyph` one `color`; one live `[data-card-id] .badge` | non-uniform → premise fix in the test, recorded |
| First sample | first manual step at which any copy is shown | ≥1 shown copy; 55 copies; root = 10 group children, groups' children = 55 copies; root and shown groups `filter: none`, `mix-blend-mode: normal`; each shown copy's set = live set, glyph colour = live glyph colour | none found before cap → test fails |
| QU sample | first step (checked from the current step on) at which the QU copy (group 1, JDAQUYE) is shown | as first sample, plus the QU copy is shown and its `.badge` `background-color`/`color` = the live QU badge's | QU never shown before cap → premise fix, recorded |

</intent-contract>

## Code Map

- `e2e/pwa/build-output.spec.ts:22` -- retitle to `Q-17 AD-16 the built web manifest is exactly DESIGN.md A-D5 plus the plugin defaults` (portrait half: asserts `orientation: 'portrait'`; runs under `pwa` and `dist-smoke`).
- `e2e/hover-peek-reanchor.spec.ts:83` -- `desktop` describe; retitle to `Q-17 AD-12 an open hover peek re-anchors above its cell after a viewport width change, the pointer staying on the cell` (responsive half: 700 → 600 px, AD-11 width rule).
- `e2e/celebration.spec.ts` -- `readyToWin(page, prefs)` (:44), `winIntoRun` (:52), `GROUP`/`ROOT` consts (:38–39), `stepUntilShown` (:141, the pattern for an in-page loop over `window.__wordcell.celebration.advance(MANUAL_STEP_MS)`; leave it unchanged), `android` describe (:212), "R-87 the copies: 55 face copies…" (:324; insert the new test right after it). Imports `MANUAL_STEP_MS`, `NORMAL_CAP_STEP_MS`, `WON_ROWS` already exist.
- `e2e/helpers/celebration.ts` -- `WON_ROWS` (group 1 = JDAQUYE holds the QU copy), `NORMAL_CAP_STEP_MS`; read only.
- `src/ui/celebration/Celebration.svelte` -- read only. DOM: `[data-celebration-root]` > 10 × `[data-celebration-group]` (opacity written per frame) > `.face[data-celebration]` (`.glyph`, `.badge` only on QU). Copy styles mirror `src/ui/Card.svelte` `.face` (`background-color`, `background-image: var(--wc-card-texture)`, `border` `--wc-card-edge`, `color` `--wc-card-ink`); the copy also has `box-shadow` (DESIGN.md lifted-card shadow, excluded from the compare).
- `src/ui/celebration/celebration.svelte.ts:132–174` -- read only: writes group `style.opacity`, copy `style.transform`, `style.visibility` (`'hidden'` until the copy's turn, SPEC F26), `style.zIndex`.
- `fixtures/prefs-theme-scifi.json` -- Normal speed, theme scifi (`--wc-card-texture` is an SVG URL, `src/ui/app.css:72`; Charcoal's is `none`, :39).
- `_bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md` -- delete Exempt line :61; add `| R-87 no trail of copies and no colour change (Q-48) | CAP-3 | P6 |` after the last R-87 row in the table (:46).

## Tasks & Acceptance

**Execution:**
- [x] `e2e/pwa/build-output.spec.ts` -- prefix the :22 title with `Q-17 ` -- Q-17 portrait half.
- [x] `e2e/hover-peek-reanchor.spec.ts` -- prefix the :83 title with `Q-17 ` -- Q-17 responsive half.
- [x] `e2e/celebration.spec.ts` -- add a module-level `sampleRun(page, cap, wantQu)` in-page loop beside `stepUntilShown` and the new test after :324 (Design Notes) -- R-87/Q-48 no trail, no colour change.
- [x] `_bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md` -- Exempt line → mapped P6 row -- §6.4 audit reads this file.

**Acceptance Criteria:**
- Given the change, when `grep -rn "Q-17" e2e` runs, then it finds both retitled titles, and the final `npm run test:all` log (`CI` unset, list reporter) shows `✓` for the manifest test under both `pwa` and `dist-smoke` and for the hover-peek test under `desktop`.
- Given the change, when `npm run test:all` runs, then the new R-87 test shows `✓` under `android` and the suite is green.
- Given the change, when `git diff --stat <baseline>` runs, then no `src/` file and no `*.screens.spec.ts` changed, and epic 10 `rule-coverage.md` has no Exempt line for "no colour change" and has the new P6 row.

Sentence → test mapping (AGENTS.md Testing): Q-17 "Portrait on phone" → `Q-17 AD-16 the built web manifest is exactly DESIGN.md A-D5 plus the plugin defaults` (`pwa`, `dist-smoke`); Q-17 "responsive in browser" → `Q-17 AD-12 an open hover peek re-anchors above its cell after a viewport width change, the pointer staying on the cell` (`desktop`; the narrowing 700 → 600 px exercises the same AD-11 `cardWidth` width rule as widening); epic 10 row `R-87 no trail of copies and no colour change (Q-48)` (both clauses) → `R-87 no trail of copies and no colour change (Q-48): at a group's first showing, the QU copy's first showing and the last group's first showing, 55 copies only in their groups and each shown copy's colours equal the live cards'` (`android`). "R-87 the copies: 55 face copies…" (:324) is the second "no trail" test at the run start only (it counts the 55 copies before the clock moves); the mid-run "no trail" coverage is the new test.

## Implementation Notes

- Premise held as planned: on the won board under `prefs-theme-scifi` all 52 live `[data-card-id] .face` share one value set, every live `.glyph` one `color`, one live `.badge`; no premise fix needed. The test also asserts the live `background-image` is not `none`, so the texture compare is not vacuous.
- `sampleRun` and `FACE_PROPS`/`RunSample` sit beside `stepUntilShown` (unchanged). Both samples found shown copies before the cap; the QU sample showed the QU copy.
- Mutation check (temporary, reverted; `git status src` clean): `Celebration.svelte` copy `background-image: none` made the new test fail on `background-image`.
- `npm run test:all` (`CI` unset) green, exit 0: unit 3788, dist-smoke 28, e2e 1163, pwa 44 passed; `✓` for the manifest test under `pwa` and `dist-smoke`, the hover-peek test under `desktop`, the new R-87 test under `android`. `git diff --stat 404c525 -- src '*.screens.spec.ts'` empty.

## Plan Change Log

- Code review: `opacity` added to `FACE_PROPS` (the copy's own and the live face's; the group's fade still excluded); root computed `opacity` asserted `'1'` at each sample; a third sample at the last group's (index `WON_ROWS.length - 1`) first showing, `sampleRun`'s predicate generalised to `'any' | 'qu' | 'last'`; test retitled as in the mapping above. Rerun of the new test on `android`: 1 passed.

## Review Triage Log

### 2026-11-07 — Review pass
- verdicts: 21 findings — high 0, medium 4, low 9, false 8, maybe-false 0
- findings:
  - `[low]` `[patch]` (blind) a copy's own `opacity` is not compared; a dimmed copy passes — `opacity` added to `FACE_PROPS` (the copy's own vs the live face's; the group's fade still excluded).
  - `[low]` `[reject]` (blind) copy `box-shadow` not pinned — the shadow is the designed DESIGN.md lifted-card shadow and differs from a resting live face by design; pinning it needs a probe element; a coloured-shadow trail is unlikely.
  - `[low]` `[reject]` (blind) glyph/badge `-webkit-text-fill-color`, `text-shadow`, badge image, `.face::after` flourish not compared — none is set anywhere in `src/ui`; each adds a new read path for an unlikely defect.
  - `[medium]` `[patch]` (blind) both samples fall in the first ~300 ms, before any bounce — third sample added at the last group's first showing (`sampleRun` `'any' | 'qu' | 'last'`), same assertions.
  - `[low]` `[reject]` (blind) a trail of unmarked elements outside the root or on a canvas — the renderer draws only into the root (Celebration.svelte); a whole-body element count would also see unrelated UI changes during the run.
  - `[false]` `[reject]` (blind) the responsive Q-17 half rests on a weak test / portrait only in the manifest — the ticket names exactly these two tests (Description (1)); the intent chose them.
  - `[low]` `[reject]` (blind) 7.11 plan not marked closed; new row has no source tag — the 7.11 plan is updated when entry 11 resumes (epic Notes 2026-11-07); most neighbouring rows carry no tag.
  - `[low]` `[patch]` (blind) the title restates the assertions — shortened to name the three sample points and the two checks; it had to change for the third sample anyway.
  - `[low]` `[patch]` (edge) copy or root own opacity below 1 passes — same root cause as the first row; root computed `opacity` `'1'` asserted at each sample.
  - `[medium]` `[patch]` (edge) a colour change mid-flight or near the exit goes unseen — grouped with the third-sample patch.
  - `[low]` `[reject]` (edge) trail of unmarked clones outside the root — as the blind row above.
  - `[medium]` `[patch]` (edge, claim) the first sample comes before any copy moves, so "no trail" is weaker than the row claims — grouped with the third-sample patch.
  - `[medium]` `[patch]` (verification-gap) groups 2–9 never compared; nothing after the first floor contact — grouped with the third-sample patch.
  - `[false]` `[reject]` (intent) the plan contradicts the ticket's "record :324 as the second test for no trail" — the invocation's review-log minor asked to describe :324 as the run-start count only; the mapping now says both (second "no trail" test at run start only).
  - `[false]` `[reject]` (intent) first sample anchored on a shown copy, not a shown group — the invocation's resolved minor chose the shown-copy test.
  - `[false]` `[reject]` (intent) the cap bounds each loop, not the run — every sample asserts `running` true and the run ends by its cap, so each sampled step is inside the cap.
  - `[false]` `[reject]` (intent) QU copy found by its `.badge`, not by group 1 — only the QU copy renders a badge (Celebration.svelte), the premise pins one live badge, and :324 pins JDAQUYE's spelling in group 1.
  - `[false]` `[reject]` (intent) "visible" read as computed `visibility` only — the invocation's resolved minor defines it so.
  - `[false]` `[reject]` (intent) "no trail" checked structurally only — the ticket's bullet defines it structurally; the "two moments only" part is grouped with the third-sample patch.
  - `[low]` `[reject]` (intent) ancestors, `::after`, `box-shadow` unchecked — ancestors: invocation stretch declined with reason (Design Notes); `::after`, `box-shadow` as the blind rows; opacity grouped with the opacity patch.
  - `[false]` `[reject]` (intent) nine properties instead of five — a superset the invocation's minors asked for (`mix-blend-mode`, four border colours); stricter, and it passes.

## Design Notes

**New test, steps:** `readyToWin(page, 'prefs-theme-scifi')`, `winIntoRun(page)`; read the premise (one `page.evaluate`); `const first = await sampleRun(page, NORMAL_CAP_STEP_MS, false)`; `const qu = await sampleRun(page, NORMAL_CAP_STEP_MS, true)`; assert in Node with `expect` so a failure names the property.

**Property set** `FACE_PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'filter', 'mix-blend-mode']` (`getPropertyValue`). Not compared: `opacity` (the group's fade in and closing fade are designed motion, EXPERIENCE.md Motion, not a colour change; asserted only as > 0 to define "shown"), `box-shadow` (the copy's lifted-card shadow, DESIGN.md), `transform`/`visibility`/`z-index` (the path). Premise: map every `[data-card-id] .face` to its value array, `new Set(json)` size 1; same for `[data-card-id] .glyph` `color`; `[data-card-id] .badge` count 1 with its `background-color` and `color`.

**`sampleRun(page, cap, wantQu)`** (one `page.evaluate`, sent `[cap, MANUAL_STEP_MS, wantQu, FACE_PROPS]`): `for (let t = 0; ; t += step) { read; if (condition) return sample; if (t >= cap || !hook.celebration.running()) return null; hook.celebration.advance(step); }` — the predicate is checked before each advance, so the QU sample may be the first sample's step. A copy is shown when its group's computed `opacity` > 0 and its own computed `visibility` is `visible`; the QU copy is the `[data-celebration]` with a `.badge` child. Condition: `wantQu ? quShown : shownCount > 0`. The sample returns `running`, `copies` (`[data-celebration]` count), `rootChildren` (count and all match `[data-celebration-group]`), `groupChildCount` (sum over groups of element children, all match `[data-celebration]`), `layers` (root plus each shown group: `filter`, `mix-blend-mode`), `shown` (each shown copy's value array, its `.glyph` `color`, and for the QU copy its `.badge` `background-color`/`color`), `quShown`. Element-child level only: the copies' `.glyph`/`.badge` spans are not counted.

**Assertions per sample:** not null; `running` true; `shown.length` ≥ 1 (QU sample: `quShown` true); `copies` 55; root has 10 element children, all groups; groups' element children total 55, all copies; every layer `filter` `none`, `mix-blend-mode` `normal`; every shown value array equals the live array; every shown glyph colour equals the live glyph colour; QU badge colours equal the live badge's.

**Review-log minors resolved:** visibility definition, shown-copy first sample, sibling QU loop with `stepUntilShown` unchanged, element-child counting, `mix-blend-mode` in the set with `opacity`/`box-shadow` out, `[data-card-id]`-scoped live reads, group-opacity clause, :324 as run-start only, exact title in the mapping, Q-17 narrowing clause, all four border colours: applied above. Not taken: a second theme (`prefs-theme-paper`): copies and live faces read the same `--wc-card-*` tokens and Paper's texture is `none`, so it adds no `background-image` coverage and doubles the run; `filter` on the root's ancestors: a page-level filter would recolour the live board equally, outside R-87's copy-versus-face clause (review log pass 2, Dropped).

## Verification

**Commands:**
- `npx playwright test e2e/celebration.spec.ts -g "no colour change" --project=android` -- expected: 1 passed.
- `npm run test:all` (with `CI` unset) -- expected: green; `✓` lines for the three titles above.
- `git diff --stat <baseline> -- src` -- expected: empty.

## Auto Run Result

**Summary:** Q-17 now has a passing title for each half (two retitles, assertions unchanged); a new `android` Playwright test samples the R-87 run on the manual clock at three steps (first shown copy, the QU copy's first showing, the last group's first showing) and asserts no trail (55 copies, only inside the 10 groups) and no colour change (no filter or blend on the root or a shown group, root opacity 1, each shown copy's face, glyph and QU badge computed colours equal the uniform live faces under the textured sci-fi theme); epic 10's Exempt line becomes a mapped P6 row. No `src/` change.

**Files changed:**
- `e2e/pwa/build-output.spec.ts` -- manifest test retitled `Q-17 AD-16 …` (portrait half).
- `e2e/hover-peek-reanchor.spec.ts` -- re-anchor test retitled `Q-17 AD-12 …` (responsive half).
- `e2e/celebration.spec.ts` -- `FACE_PROPS`, `RunSample`, `sampleRun` beside `stepUntilShown` (unchanged), and the new R-87 test after :324.
- `_bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md` -- Exempt line removed; `R-87 no trail of copies and no colour change (Q-48)` P6 row added.

**Review:** 21 findings; patched 3 entries (7 rows): 1 medium (third, later sample; 4 rows grouped), 2 low (copy and root opacity, 2 rows; shorter title, 1 row); deferred 0; rejected 14 rows (reasons in the triage log). Follow-up review recommended: false (patched entries: high 0, medium 1, low 2).

**Review-log minors (invocation):** all applied (Design Notes), except a second theme and ancestor filters, declined with reasons there; tickets.toml entry 15 sync stays with mark-done.

**Verification:** `npx playwright test e2e/celebration.spec.ts -g "no colour change" --project=android` 1 passed; `npm run test:all` with `CI` unset exit 0 before and after the review patches (final: unit 3788, dist-smoke 28, e2e 1163, pwa 44 passed), `✓` for the manifest test under `pwa` and `dist-smoke`, the hover-peek test under `desktop`, the new R-87 test under `android`; `git diff --stat 404c525 -- src` empty; no screenshot spec changed, so `test:screens` not needed. Mutation check (implementer, before the patches): a copy `background-image: none` failed the test.

**Residual risks:** the opacity assertions were not shown failing on a dimmed copy (no mutation run after the patch); only the sci-fi theme is sampled.
