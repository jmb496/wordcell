---
title: 'Place strip, compact tray and session-place-compact'
type: 'feature'
ticket: '2'
created: '2026-10-08'
status: 'built'
route: 'full'
route_source: 'auto'
baseline_revision: '6e66d95c0f6633d83c5637bb9e55bb0f10f8f54c'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-place-strip-compact-tray-and-session-place-compact.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md'
warnings: ['oversized']
deferred:
  - summary: 'Epic Boundaries name only `serialize.test.ts`''s fixture list, not `src/architecture-ad2-ad12-ad17.test.ts`; its valid-fixture list changes here under the epic Notes fixture-ownership decision. Close-out edit: add "and the AD-17 valid-fixture list in src/architecture-ad2-ad12-ad17.test.ts" to the epic Boundaries.'
    evidence: 'ticket review log Result, unapplied minor 13; epic-tray-and-place.md Boundaries vs Notes (fixture ownership)'
    severity: 'minor'
---

<intent-contract>

## Intent

**Problem:** In Place the tray still shows epic 4's bare strip (no word line, `bottom`/`top` tags, `★`, origin tag or meta), compact tiles carry no corner marks, and no fixture has a compact strip, a `QU` free letter from a cell other than 3 or a D block crossing the row break.

**Approach:** Extend the 5.1 tray parts: Tray.svelte feeds the Place word line (`draft.wordCards`, no underline) and the Place meta; Card.svelte gains the strip position mark, the phase/mode-dependent origin-tag corner and an unset `↩` slot; text.ts gains `placeMeta` and the strip strings; script `session-place-compact` (seed 191, below) as one fixture meeting every condition, so no fallback fixture. The story file (context) is the contract; this plan resolves the review log's 15 unapplied minors (Design Notes).

## Boundaries & Constraints

**Always:** UI reads only `GameView` (+ `game.feedback`); word line from `draft.wordCards`, never strip order (AD-3); origin tags via `tray/tags.ts` `originCard` by the `cell` field; every string/glyph in `text.ts` (U+2212, U+2192, U+00B7); 52 live `[data-card-id]` per phase (AD-14); mirrors carry only `data-mirror-of`; tests named by id; corner assertions by `.face` box quadrant, no px literals (epic 4 F11); fixture built only by `createSession` + `play` and pinned by REBUILDS.

**Never:** engine or shell source change; `TRAY_ROWS`/band height change (CAP-9); setting `↩` from anywhere (entry 5); tile interaction; `session-composing-compact-block.json` (not needed); editing tickets.toml, the story or spec files; pushing.

## I/O & Edge-Case Matrix

Literals from `view()` (seed 1 fixtures; seed 191 for compact). Card mode = tiles fit one row (android 7).

| Scenario | State | Expected |
|---|---|---|
| Place default order | `session-place` | word line `TAN`, no underline; strip `42, 0, 28` (= word order, R-51); `bottom` on 42, `top` + `★` on 28 (bottom band); meta `3 letters → cell 3 · +9` |
| Place reordered | `session-place-free-letter-redo-tail` | word line `ONE`; strip `9, 32, 28` (= `placementOrder` ≠ word order); 28: origin tag `3` top-left, `top` + `★` bottom band; 9 no lock/outline; meta `3 letters → cell 3 · +6` |
| Compact Place | `session-place-compact` | 8 tiles, two rows, `.compact`; word line `QUARTERED` (`QU` one unit); strip `35, 1, 38, 44, 11, 36, 9, 7`; 35: origin `4` bottom-left, ×2 top-right, `▼` top-left; 7: `★` top-left; no `bottom`/`top` words, no lock, no `.block`; meta `9 letters → cell 9 · +73`; 52 live |
| Compact Composing | same + one Undo | ids `35, 1, 38, 44, 11, 36m, 9m, 7m`; word `QUARTERED`, `36 9 7` underlined; `9 letters`; tag `4` top-left on 35 (×2 top-right); block segments `36m–9m` (row 1, tray indices 5–6) and `7m` (row 2, start+end): two outlines, two `.lock`; 52 live |
| Compact scratch | COMPACT_SCRATCH (e2e, seed 1) | tag `3` top-left on compact card 28 (replaces the 5.1 "no tag" test) |
| placeMeta | `(6,6,30)`, `(4,3,0)`, `(4,3,-1)`, `(1,3,1)` | `6 letters → cell 6 · +30`, `4 letters → cell 3 · ±0`, `4 letters → cell 3 · −1` (U+2212), `1 letter → cell 3 · +1` |

</intent-contract>

## Code Map

- `src/ui/Tray.svelte` -- main change. Today `composing` = draft only outside Place; tags only in Composing. Make the word line render in Place too (`view.draft.wordCards`, `destination` `[]`, `rejectedWord` undefined), tags from `view.draft.freeLetters` in both phases, ControlRow gets `meta` in Place. Pass strip position per tile (first/last) to TileRows.
- `src/ui/tray/ControlRow.svelte` -- add the Place variant only: right slot `text.placeMeta(...)` instead of `letters` (left slot empty in Place).
- `src/ui/tray/TileRows.svelte` -- `segment()` and the per-row D segments already exist (5.1); pass `tag` in every mode/phase (drop the `sizing.mode === 'card'` gate), `position` (`'bottom'` index 0, `'top'` last) when `strip`.
- `src/ui/Card.svelte` -- has `tag` (card-mode bottom-left), ×2 `.badge` top-right (5.1), `.tagged .face::after {content:none}`. Add `position?: 'bottom' | 'top'`, `returnSlot?: boolean`; corner placement per Design Notes; flourish off only when the bottom band holds a mark.
- `src/ui/text.ts` -- add `placeMeta(n, cell, delta)` (count part via `letters(n)`), `stripBottom: 'bottom'`, `stripTop: 'top'`, `stripBottomMark: '▼'`, `star: '★'`, `returnGlyph: '↩'`. `viewTop` stays separate.
- `src/ui/text.test.ts` -- AD-3 cases.
- `src/ui/tray/WordLine.svelte` -- unchanged API; Place passes `destination=[]`.
- `src/engine/serialize.test.ts` -- import the fixture; `ValidName` + `'place-compact'`; `VALID` and `REBUILDS` appended at the end; `PROPERTIES` entry; "eleven" → "twelve" in the `VALID` doc comment. `play`, `drop` from `test-helpers.ts`; `FLIP`, `VALIDATE`, `CONFIRM` consts exist in file.
- `src/architecture-ad2-ad12-ad17.test.ts:11-29` -- sorted list + `session-place-compact.json`; test name "eleven" → "twelve".
- `fixtures/session-place-compact.json` -- new, generated as `serializeSession(build())` (single line, matching the other fixtures' format).
- `e2e/tray.spec.ts` -- helpers `tray`, `wordLetters`, `expectComposing` (asserts `.controls .left` empty), `expectEmptyRows`; COMPACT_SCRATCH (:108); interim tests to rewrite at :140 and :203.
- `e2e/board.screens.spec.ts` -- `[phase, name]` table; add `['place-compact', 'session-place-compact']`.
- `e2e/helpers/board.ts` -- `openFixture(page, name, {steps})`, `trayIds`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `text.test.ts` -- strings above; AD-3 tests asserting the four full placeMeta strings of the matrix (argument ASCII `-1`, U+2212 only in the expected string).
- [x] `src/engine/serialize.test.ts`, `fixtures/session-place-compact.json`, `src/architecture-ad2-ad12-ad17.test.ts` -- REBUILDS entry with the seed-191 script (Design Notes); write the JSON from that build; PROPERTIES (Design Notes); fixture lists and counts.
- [x] `src/ui/Card.svelte` -- props and corner CSS (Design Notes).
- [x] `src/ui/tray/TileRows.svelte`, `ControlRow.svelte`, `src/ui/Tray.svelte` -- Place word line, tags in both phases and modes, position marks, meta; header comments updated (no "entry 2 adds").
- [x] `e2e/tray.spec.ts` -- rewrite :140 to `R-33 (UI) compact mode: a free letter's origin tag sits top-left` (COMPACT_SCRATCH, tag `3`, ids kept) and :203 into the Place tests below (tray-order assertions kept); add android tests: `R-50 R-80 (UI)` Place on session-place and redo-tail (matrix rows; A-D10 tag top-left on 28; `top`/`★` below the face's 72 % line; D card 9 no `.lock`, no `.block`; no `.d` letter); `R-51 (UI)` session-place strip equals word order; `R-50 AD-3 (UI)` redo-tail strip equals `placementOrder` while word line reads ONE; `R-50 R-33 R-80 (UI) AD-14` session-place-compact (compact corner map, QU tag text `4` = `freeLetters`, word line `QUARTERED`, meta, no `bottom`/`top` text, 52 live); `R-32 R-33 R-30 R-36 R-37 (UI) AD-14` after one Undo (Composing compact marks, tag `4` top-left, two `.block.start` segments, two `.lock`, `9 letters`, `QU` one span, 52 live). `expectComposing`'s empty-left check stays (Composing).
- [x] `e2e/board.screens.spec.ts` -- `place-compact` row; regenerate baselines in the container (`npm run test:screens -- --update-snapshots`, `=all -g` for renders under the 1 % ratio), name each changed baseline in Implementation Notes.

**Acceptance Criteria:**
- Given each matrix state on android, when the page settles, then the tray shows exactly the listed word line, strip ids, marks in the listed `.face` quadrant, meta and 52 live cards.
- Given `placeMeta` inputs of the matrix, when called, then it returns the listed full strings.
- Given `npm run test`, when run, then `AD-17 session-place-compact.json equals its scripted accrue/apply rebuild`, `§2 place-compact has its defining property` and the AD-17 twelve-fixture list pass.
- Given `npm run test:all` and `npm run test:screens`, when run, then both are green with the `place-compact` baselines on android and desktop.

## Design Notes

**Fixture (resolves the ticket's unknown; a bounded search on seed 1 found no Session meeting even the QU-from-cell≠3 plus 8–14-tile conditions within 3–5 prior moves, so seed 191 is used; one Session meets all conditions, no fallback):**
```ts
() => play(createSession(191), [
  drop(2, 2, 6), { type: 'arrange', arrangement: [20, 28] }, VALIDATE,
  { type: 'setPlacementOrder', order: [20, 28, 35] }, CONFIRM,   // QUIN → cell 4, 35 on top
  drop(4, 4, 3), { type: 'setDestinationCount', k: 3 }, FLIP,
  { type: 'addFreeLetter', cell: 4 },
  { type: 'arrange', arrangement: [35, 1, 38, 44, 11] }, VALIDATE, // QUARTERED, target 9
], ['quin', 'quartered'])
```
Both words are in `generated/dictionary/en.txt`. Record the verified view values in Implementation Notes; if any matrix literal differs from `view()`, the view wins and the plan records it.

**PROPERTIES `place-compact`:** phase `place`, `moves.length === cursor.index + 1`; strip length 8–14; Move `freeLetters` holds a cell c ≠ 3 whose `cells` entry (by `cell` field) has top 35, and 35 ∉ `draft.source`; block condition only on its reachable branch: `destinationSide === 'right'`, |arrangement| ≤ 6, |arrangement| + `destinationCount` ≥ 8 (the `left` branch needs k ≥ 8 > 7 and is unreachable).

**Card corner map** (`.face`-relative; `strip` = place `strip`):

| Mark | card, tray | card, strip | compact, tray | compact, strip |
|---|---|---|---|---|
| origin tag | bottom band left | top-left | top-left | bottom-left |
| position word `bottom`/`top` | — | bottom band left | — | — (glyph instead) |
| `★` (orange, top) | — | bottom band right | — | top-left |
| `▼` (bottom) | — | — | — | top-left |
| ×2 | top-right | top-right | top-right | top-right |
| `↩` (`returnSlot`, unset) | bottom band right | — | top-right (×2 slot); `QU`: bottom-right | — |

All marks `card-badge` 11 px 700 (star colour `--wc-accent-orange`). Flourish omitted only when the bottom band holds a mark (card mode). A free letter that is also an end tile in card strip mode (28) shows tag top-left and `top` + `★` in the band.

**Review-log unapplied minors** (Result list, 15): 1 left branch unreachable → PROPERTIES pins `right` only; 2 Tray.svelte main file, ControlRow Place variant only → Code Map; 3 R-51 → session-place default-order test named R-51, redo-tail named R-50 AD-3; 4 placeMeta ASCII `-1`, `(1, 3, 1)`, full strings; 5 QU tag text `4` = its `freeLetters` cell in Place and Composing; 6 Place word line asserted on session-place-compact; 7 A-D10 top-left only on the last tile: accepted, no fixture has a full-height non-end Place free letter (compact QU covers a first-tile free letter); 8 bottom-band marks checked below the `.face` 72 % line, "no outline" by `.block`/`.lock` absence; 9 PROPERTIES reads the cell from Move `freeLetters`; 10 words only in the rebuild's own list; 11 ×2 exists → new work is tag, map, `↩`; 12 COMPACT_SCRATCH kept as the compact-tag scratch, the fixture came from a seed search instead; 13 Boundaries close-out → frontmatter `deferred`; 14 build-notes/rule-coverage fallback edit not needed (single fixture, no fallback); 15 single fixture tried first (succeeded on seed 191), JSON import + REBUILDS generator, words in en.txt, no `bottom`/`top` words in compact, quadrants on `.face`.

**S14 (epic 4 D19):** discharged by the android compact tests and the `place-compact` screenshot; no manual step.

## Verification

**Commands:**
- `npm run test:all` -- expected: all green.
- `npm run test:screens` (Docker) -- expected: green after one update run.

## Implementation Notes

- **Fixture verified against `view()`:** the seed-191 script rebuilds `fixtures/session-place-compact.json` byte for byte (`AD-17 session-place-compact.json equals its scripted accrue/apply rebuild` green). Every matrix literal matched the view; nothing differed. Place: word `QUARTERED`, strip `35, 1, 38, 44, 11, 36, 9, 7`, 35 (`QU`) top of cell 4 and Move `freeLetters` `[4]`, `place.target` 9, `scoreDelta` +73, `letterCount` 9 → meta `9 letters → cell 9 · +73`. Move: `destinationSide` `right`, |arrangement| 5, `destinationCount` 3 (block on tray indices 5–7, crossing the 7-per-row break). After one Undo: ids `35, 1, 38, 44, 11, 36m, 9m, 7m`, `9 letters`. session-place: `TAN`, strip `42, 0, 28`, `+9`; redo-tail: `ONE`, word order `32, 28, 9`, strip `9, 32, 28`, `+6`.
- **Corner map** as Design Notes: Card.svelte derives one corner class per mark (`band-l`/`band-r`/`tl`/`tr`/`bl`/`br`) from `tile.mode` and `place`; `.band-marked` (replaces 5.1's `.tagged`) drops the flourish only when the card-mode bottom band holds a mark. `↩` (`returnSlot`) renders only off-strip and is set by nothing (entry 5).
- **Test geometry fix:** the band-mark helper first checked the mark's bounding-box centre against the face's vertical midline, but the word `bottom` is nearly face-wide, so its centre sat at 0.55 although it is left-anchored. `expectBand` now checks the anchored edge's outer quarter (left edge < 0.25 / right edge > 0.75), that the mark stays inside the face and below its 72 % line, and that `top` ends before `★` starts. These are face fractions, with no px literals (epic 4 F11). Corner marks (`expectCorner`) still use the centre quadrant.
- **Baselines** (Docker `mcr.microsoft.com/playwright:v1.63.0-noble`): new `board-place-compact-android-linux.png`, `board-place-compact-desktop-linux.png`; regenerated with `--update-snapshots=all -g "screenshot place"` (the diff was under the 1 % ratio) `board-place-android-linux.png`, `board-place-desktop-linux.png`. Idle, composing and game-over baselines unchanged (no pixels differ: session-composing has no free letter and no strip). A plain `npm run test:screens` then passed 10/10.
- **Verification:** `npm run test:all`, run stage by stage in the foreground: lint, check, unit (2082 tests), build (508106 / 600000 B), `test:e2e:dist` 14, `test:e2e` 401 passed / 357 skipped (android-only tray specs skip on desktop), `test:e2e:pwa` 12. All green.
- **S14** (epic 4 D19 compact half) is covered by the android compact tests and the `place-compact` screenshot; both baselines were inspected by eye.

## Plan Change Log

## Review Triage Log

### 2026-10-08 — Review pass
- verdicts: 22 findings — high 0, medium 3, low 12, false 6, maybe-false 1
- findings:
  - `[low]` `[reject]` blind: `returnSlot`/`↩` is unused speculative code and `.mark.tr` sits at `right: 3px` vs the badge's `1px` — the ticket asks for the `↩` slot and the plan's Never leaves setting it to entry 5, which tests it; the 2 px offset of an unset slot is cosmetic
  - `[low]` `[reject]` blind: the meta has no spoken form ("plus 30", "no change", "minus 1", EXPERIENCE.md A-E14) — real, but the epic's Boundaries exclude screen-reader labels (epic 6), so the intent excludes it
  - `[low]` `[reject]` blind: tile marks join the card's accessible text (`Qu×24▼`) — same epic-6 screen-reader exclusion
  - `[false]` `[reject]` blind: corner marks may collide with the glyph — the regenerated `board-place` and `board-place-compact` android baselines show tag `3`, `▼`, ×2, `4` and `★` clear of the glyphs
  - `[medium]` `[patch]` blind: the card-mode Composing tag position (`band-l`) is no longer asserted — grouped with the verification-gap finding; fixed there
  - `[medium]` `[patch]` blind: the flourish (`bandMark`) change is untested — grouped with the verification-gap finding; fixed there
  - `[low]` `[reject]` blind: no test of a card-mode strip free letter as first/middle tile, compact free letter not first, or compact non-QU free letter — no fixture holds these; new fixtures are more than a direct correction (plan minor 7 accepted this)
  - `[false]` `[reject]` blind: desktop covered only by screenshots — AGENTS.md test split puts (UI) flows on android first, desktop only for desktop-only behaviour; nothing here is desktop-only
  - `[low]` `[reject]` blind: `±0`/`−n` placeMeta formats only unit-tested — Tray.svelte passes `place.scoreDelta` straight into `placeMeta`, whose branches `text.test.ts` covers; a zero/negative fixture adds a fixture for no new wiring
  - `[false]` `[reject]` blind: the R-50 AD-3 test's `not.toEqual` is redundant and its name breaks the id convention — the name starts with the R-id as AGENTS.md requires; the extra assertion is harmless
  - `[low]` `[reject]` blind: the `place-compact` defining property does not measure the row crossing — the property pins the engine-side condition (right side, |arrangement| + k ≥ 8); the android after-Undo test measures the actual two segments and two locks
  - `[false]` `[reject]` blind: `stripPosition` gives a one-tile strip no `top` — unreachable: R-40's three-letter minimum (QU = 2) makes every strip ≥ 2 tiles
  - `[low]` `[reject]` blind: `.not.toMatch(/bottom|top/)` on tile text could false-fail on other letters — it runs on one fixed fixture (QUARTERED) and the test also asserts `.position` count 0
  - `[maybe-false]` `[reject]` edge: the card-mode `bottom` word could overflow a 44 px (TOUCH_MIN) face — `bottom` at 11 px 700 is about 37 px + 4 px inset < 44 px; fits at 412 px in the baseline; settling it needs a 360 px render; if true only low
  - `[low]` `[reject]` edge: the band-mark geometry is checked only at 412 px — same estimate; a narrow-viewport project is more than a direct correction
  - `[medium]` `[patch]` verification-gap: the `band-l` tag corner and the flourish hiding were untested — e2e/tray.spec.ts: added `flourish(page, id)`; the card-mode R-33 Composing test now asserts `expectBand(page, 28, '.tag', 'left')` and flourish `none` on 28; the PLACE_ROWS loop asserts flourish `none` on the first and last tiles and present on the middle tile; affected tests and full `test:all` green
  - `[low]` `[reject]` intent: "unchanged by strip reorders" shown on a static fixture, not by a reorder — no reorder UI exists yet (tile interaction out of scope); the word line reads `draft.wordCards`, and the redo-tail fixture's strip already differs from word order
  - `[false]` `[reject]` intent: `↩` is never rendered — the ticket asks for the slot; setting it is entry 5 (plan Never)
  - `[low]` `[reject]` intent: 44 px compact row height not asserted — `trayLayout` is 5.1's, unchanged here; 5.1 covers it
  - `[low]` `[reject]` intent: the D-block crossing is a layout stand-in in the property — as the property row above; the e2e test measures it
  - `[false]` `[reject]` intent: green `test:screens` is only a claim — re-ran `npm run test:screens` in this review: 10 passed
  - `[low]` `[reject]` intent: S14 "checked in a browser" done by automated tests — Playwright drives Chromium and both new baselines were viewed; the plan's Design Notes record this

## Auto Run Result

**Summary:** Place tray now shows the word line (word order, no D underline), origin tags in both phases and modes, the strip position marks (`bottom` on the first tile, `top` + orange `★` on the last; compact `▼`/`★` top-left), the meta `n letters → cell c · ±d` via `text.placeMeta`; compact corner map and Composing compact marks per DESIGN.md; the unset `↩` slot for entry 5. New fixture `session-place-compact.json` (seed 191) meets every condition, so there is no fallback fixture.

**Files changed:**
- `src/ui/Card.svelte` — `position`/`returnSlot` props, corner classes per mode and place, `.band-marked` flourish rule
- `src/ui/Tray.svelte` — word line, tags and meta in Place too
- `src/ui/tray/TileRows.svelte` — tags in every mode, strip position per tile
- `src/ui/tray/ControlRow.svelte` — Place meta variant
- `src/ui/text.ts`, `src/ui/text.test.ts` — `placeMeta` and strip glyphs/strings, four AD-3 cases
- `fixtures/session-place-compact.json` — new valid fixture
- `src/engine/serialize.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts` — VALID, REBUILDS, PROPERTIES, twelve-fixture list
- `e2e/tray.spec.ts` — Place, compact Place and compact Composing tests; interim 5.1 tests rewritten
- `e2e/board.screens.spec.ts` + 4 baselines — `place-compact` row; `board-place-*` regenerated

**Review:** 22 findings; 1 patch entry (3 medium findings grouped: card-mode tag band and flourish assertions added to e2e/tray.spec.ts); 0 deferred; 19 rejected with reasons in the triage log. Patched counts: high 0, medium 1 entry, low 0. Follow-up review recommended: false (first pass, one medium entry, no high).

**Review-log minors:** all 15 of the ticket review log's Result list and Pass 3's "Left for the plan" items are resolved in Design Notes (items 1–15) or carried as the frontmatter `deferred` close-out edit (item 13).

**Verification:** `npm run test:all` green after the patch (unit 2082, e2e:dist 14, e2e 401 passed / 357 desktop skips, pwa 12; build in budget). One run in between hit `e2e/layout.spec.ts:286` (AD-11 banner during a scroll, scrollY step timing under load), which passed 5/5 alone and in the full re-run; this diff doesn't touch that code. `npm run test:screens` (Docker) 10/10 green.

**Residual risks:** the compact `Qu` tile is tight (▼, ×2, tag around the glyph) but readable; the card-mode `bottom` word's fit is estimated, not measured, below 412 px; `layout.spec.ts:286` is flaky under load (pre-existing).
