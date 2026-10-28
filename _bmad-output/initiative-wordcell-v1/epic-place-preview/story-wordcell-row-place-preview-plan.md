---
title: 'WordCell row place preview'
type: 'feature'
ticket: '2'
created: '2026-10-28'
status: 'ready-for-dev'
route: 'full'
route_source: 'auto'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
followup_review_recommended: false
context: ['{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/story-wordcell-row-place-preview.md', '{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md']
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** In Place the WordCell row still draws the board before the commit (used cells as hatched used mirrors, the target's current top), so the player cannot see the free letters the next word will offer (Q-49, epic E2–E5).

**Approach:** `WordCellRow.svelte` renders `cell.preview` (ticket 11.1, AD-3) in Place: no used mirror; a used non-target cell shows its live card beneath or the empty outline; the target hides its current top under a new `preview` mirror kind (`Card.svelte`) of `preview.top`; the shown top of a non-empty preview carries the `★` pill (a `Card.svelte` prop); badge and group name come from `preview`. Adds fixture `session-place-used-cells`, the two `, after this word` names, and updates every Place-phase used-look pin. **Plan checkpoint (ticket): stop here for the owner.**

## Boundaries & Constraints

**Always:** a changed cell's shown top, empty outline (`preview.top === null`), badge (`preview.count >= 2`) and group name come only from `cell.preview`, never `place.placementOrder` or `cell.cards.length`; `cell.cards` still supplies the live elements (the used card excluded: its live element is the strip tile) and the R-65 view/peek; a used card gets no live element in its cell and no copy in any WordCell unless it is the target's `preview.top`; the `preview` mirror carries `data-mirror-of`, class `preview`, no `data-card-id`/`data-testid`/`data-place`, `aria-hidden`, no name, no tabindex, never animates (AD-14); the preview updates when a reorder or retarget is dispatched, by any route (drop, tap-swap, tap-retarget, keys), never mid-drag (rule 3); Composing, the R-65 view and the not-legal dim unchanged; the fly-to-cell hold code is unchanged except the capture selector (entry 3 owns the hold); every Place-phase pin is updated, not deleted; tokens only (TH-2); strings only in `text.ts`.

**Never:** reading `preview` outside Place-derived data, re-deriving it in the UI, any engine/Session/fixture-version change, a new engine export, moving or resizing a mark to dodge the badge, changing the 360 px badge-above-pill assertion (owner-approved 2026-10-28), touching the How to play scene (entry 4) or other baselines.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Unused target, non-empty | `session-place-onto-committed`, target 3 [42,0,28], preview {26,6} | `.preview[data-mirror-of="26"]` + ★, badge 6, 42/0/28 live and hidden, 52 live | none |
| Used target (R-41) | `session-place-free-letter-redo-tail` cell 3, preview {28,5} | `.preview` mirror of 28 + ★, no `.used`, no live 28 in cell (live in strip), badge 5 | none |
| Used non-target, card beneath | `session-place-compact` cell 4 [20,28,35], preview {28,2} | live 28 visible + ★, badge 2, no element for 35 in `wordcell-4` | none |
| Used non-target, one card | `session-place-used-cells` cell 3 [32], preview {null,0} | empty outline, no ★, no badge, no element for 32 in the cell | none |
| Not-legal changed cell | `session-place-used-cells` cell 6, preview {31,5} | live 31 + ★ + badge 5 under the 35 % dim | none |
| Unchanged cell in Place | `session-place-used-cells` cell 4 | as today: live top 37, one named button, badge 5, no ★ | none |

</intent-contract>

## Code Map

- `src/ui/WordCellRow.svelte` — the `{#each cells}` block: today `usedId`/`lowest` (flight hold, keep as is) and the `cell.cards` each keyed `${id}-used|live` with `mirror="used"` on a used top. Add a Place branch taken when `cell.preview !== undefined` (flight branch only when it is absent): live = `cell.cards` minus the used top (`cell.used`), each hidden unless it is `preview.top`, all `silent`, no `name`; when `preview.top` is not among them (target), one `<Card mirror="preview" place="cell" full previewMark>` keyed `preview-${top}`, after the live cards, before `.count`; `class:empty` = `preview.top === null`; badge from `preview.count`; `aria-label` from the new names with `faces[preview.top].letter`. Header comment updated (R-33 used mirror in Composing only, Q-49 preview).
- `src/ui/Card.svelte` — `mirror` union + `'preview'`; `class:preview={mirror === 'preview'}`; new prop `previewMark?: boolean` rendering `<span class="preview-mark" aria-hidden="true">{text.star}</span>` in the wrapper after `.face` (as `.top-tag`); CSS: absolute, `left: 4px; bottom: 2px` (2 px inside the card rect, the badge's inset), `box-sizing: border-box; width: 16px; height: 16px; border-radius: 9999px; display: grid; place-items: center`, `background: var(--wc-surface-raised); color: var(--wc-accent-orange)`, `font: 700 11px/1 system-ui, "Roboto", sans-serif`, `pointer-events: none`; flourish and `bandMark` untouched; doc comment cites Q-49 and entry 4's `static` reuse.
- `src/ui/text.ts:276-279` — add `nameCellAfter(cell, letter, count)` → `WordCell {c}, top {L}, {n card(s)}, after this word` and `nameCellEmptyAfter(cell)` → `WordCell {c}, empty, after this word` (EXPERIENCE.md catalogue).
- `src/ui/flip.ts:257` — `':scope > [data-mirror-of]:not(.preview)'`; comments at :4, :17-18, :54, :213 note the skip. `src/ui/flip.test.ts:161` fake selector to the same string.
- `src/ui/labels.test.ts:106-160` — `cell()`/`drawCells` gain `preview` and a `place` prop.
- `src/ui/theme/contrast.test.ts:69-81` — `TABLE` row.
- Fixture registrations: `src/architecture-ad2-ad12-ad17.test.ts:17-39` (sorted list), `src/engine/serialize.test.ts` (import ~:226, `ValidName` ~:311, `VALID` ~:335, `PROPERTIES` ~:985, `REBUILDS` ~:1989), `src/engine/view.test.ts` (import ~:11; the two Q-49 lists at ~:745 and ~:805).
- Read-only: `src/engine/view.ts:62,229` (`preview`), `src/ui/gestures/resolve.ts:72-78` (a press on a cell mirror resolves to the cell, so the preview mirror needs no gesture change), `src/ui/layout/geometry.ts:27-31,78-89`.

## Tasks & Acceptance

**Execution:**
- [ ] `fixtures/session-place-used-cells.json` -- `serializeSession` output (no trailing newline, as siblings) of the Design Notes script -- E3/E4 fixture.
- [ ] `src/engine/serialize.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts`, `src/engine/view.test.ts` -- register it (Code Map); `PROPERTIES['place-used-cells']`: phase place, L = 5, target 5 ∉ freeLetters cells, a used cell ≤ L with exactly 1 card (3), a used cell > L with ≥ 3 cards (6), an unused non-empty legal cell ≠ target (4); `REBUILDS` entry with the script and words `['one', 'weapon', 'incur', 'minor']` -- AD-17.
- [ ] `src/ui/text.ts`, `src/ui/Card.svelte`, `src/ui/WordCellRow.svelte`, `src/ui/flip.ts`, `src/ui/flip.test.ts` -- per Code Map.
- [ ] `src/ui/labels.test.ts` -- `AD-3 Q-49` tests: both templates (singular/plural, QU); a changed cell (target preview mirror, used beneath, used empty) exposes zero named buttons and the after-this-word group name; an unchanged non-empty cell in Place one button; Composing used cell keeps `, used`.
- [ ] `src/ui/theme/contrast.test.ts` -- row `['accent-orange', 'surface-raised', 3, 5.0]` (the ★, graphics).
- [ ] `e2e/place-preview.spec.ts` (new, `test.describe('android')` + `onAndroid`) -- the mapping below.
- [ ] `e2e/screen-reader.spec.ts` -- new `A-E9 Q-49 …` tests on `session-place-used-cells` (names below); `A-E9 a used WordCell reads its name with used` → `session-place-free-letter-two-cards` + one Undo, same assertion.
- [ ] Place-phase pins (inventory, Design Notes) -- update each as listed, keep every test.
- [ ] Baselines -- `npm run test:screens -- --update-snapshots` for `board.screens.spec.ts` `place`/`place-compact` and every `theme-*.screens.spec.ts` `board`; diff the changed PNG list: only those names.

**Acceptance Criteria (sentence → test mapping; every new e2e test on `android`):**
- R-50 (UI) "each WordCell the commit changes shows its top and count after the commit … target shows the last card": Given `session-place-onto-committed`, when opened, then `R-50 (UI) Q-49 …` sees `.preview[data-mirror-of="26"]` with ★ in `wordcell-3`, badge 6, live 28 hidden, 52 `[data-card-id]`; given `session-place-long` at 360 × 839, when opened, then target 10 shows a preview mirror and badge `15` (and the rect check below).
- R-50 (UI) "a used cell that is not the target shows the card beneath its used one, or its empty slot": Given `session-place-used-cells`, when opened, then cell 6 shows live 31 + ★ + badge 5 and no element for 27, cell 3 shows the empty outline, no ★, no badge, no element for 32; given `session-place-compact`, when opened, then cell 4 shows live 28 + ★ + badge 2, no element for 35.
- R-50 (UI) "follows every reorder and retarget": Given `session-place-free-letter-two-cards`, when a tap-swap puts 28 last, then `wordcell-5` previews 28 (`.preview`, not `.used`), cell 4 shows live 20 (no copy of 28 in it), no mirror animation; given `session-place-compact`, when retargeting to used cell 4, then a preview mirror of 7, badge 10, 28 hidden, no element for 35; when retargeting back to 9, then live 28 + ★ + badge 2; given `session-place-used-cells`, when retargeting to unused cell 4, its live top 37 is hidden under a preview mirror of 38 (badge 10), and back to 5 shows 37 with one named button; when retargeting to used single-card cell 3, then a preview mirror of 38 with ★ and badge 5, no live element, no empty outline, and back to 5 its empty outline. Each transition: `getAnimations` on `[data-mirror-of]` is 0.
- R-50 (UI) "the current top is not shown, but the R-65 view still lists the current cards" (R-65 (UI) Q-49): Given `session-place-onto-committed`, when target 3 is long-pressed, then the view lists 42, 0, 28 with `top` on 28; given `session-place`, when empty target 3 is long-pressed, then no view opens; given `session-place-used-cells`, when cell 3 is long-pressed, then the view lists 32.
- R-33 (UI) "in Composing a visual deactivation; in Place R-50's preview replaces it": Given `session-place-used-cells`, when opened in Place, then `[data-wordcell] .used` count 0; when Undo to Composing, then cells 3 and 6 show their `.used` mirrors, no `.preview`, no ★; given `session-place-free-letter-redo-tail` + Undo, when Validate, then `wordcell-3` swaps the used mirror for `.preview[data-mirror-of="28"]` with no mirror animation (snap).
- Q-49 / R-71 / R-73 (UI) / R-70: Given redo-tail + Undo, `session-place-used-cells`, and `session-place` after Confirm and settle, when Redo into Place, a reload into Place, and Undo of the commit (Idle → Place) run respectively, then each shows the preview; for the Undo, read in the click task: `.preview[data-mirror-of="28"]` present while the live faces run their glides, mirror animations 0.
- ★ (DESIGN.md place preview): Given the fixtures above, when each is shown, then the ★ is on a non-empty preview only; none on an empty one, an unchanged non-empty cell in Place, or any WordCell after Undo to Composing or after Confirm's last landing (`glidesSettled`); the ★ color is `--wc-accent-orange`, pill bottom-left 2 px inside the card rect; on `session-place-used-cells` cell 6 (not legal) the cell is `.wc-dim` at 0.35 with card, ★ and badge inside.
- ★/badge at 360 px: Given `session-place-long` at 360 × 839, when opened, then the `.preview-mark` and `.count` keep their DESIGN.md corners and `document.elementFromPoint` at a point inside both rects of `wordcell-10` returns the `.count` (badge above the pill; the rects intersect by about 0.35–0.6 px, Design Notes; owner-approved at the checkpoint 2026-10-28).
- AD-14: Given each `e2e/board-phases.spec.ts` state, when opened, then the table records each mirror's kind (its class); Place rows: session-place / below-committed-last `[0 ghost, 28 ghost, 28 preview, 42 ghost]` (28 twice: column-6 D ghost and the target's preview), redo-tail `[9 ghost, 28 preview, 32 ghost]` (ids stay [9, 28, 32]), idle-empty-column + Undo gains `48 preview`; Composing rows keep their ids with `used`/`block` kinds.
- A-E9 Q-49: Given `session-place-used-cells`, when opened, then `wordcell-5` "WordCell 5, top R, 5 cards, after this word", `wordcell-6` "WordCell 6, top O, 5 cards, after this word", `wordcell-3` "WordCell 3, empty, after this word", none with a named button; `wordcell-4` "WordCell 4, top R, 5 cards" with button "R, WordCell 4, top".
- Given the change, when `npm run test:all` and `npm run test:screens` run, then both pass; only the listed baselines changed.

## Implementation Notes

## Plan Change Log

- 2026-10-28, plan checkpoint: Jared approved the plan and the proposed default for the 360 px check (the badge drawn above the ★ pill where they meet, asserted with `elementFromPoint`; no mark moved). Implement.

## Review Triage Log

## Design Notes

**Fixture `session-place-used-cells` (seed 1), REBUILDS script** — verified with the engine on 2026-10-28 (scratch test, deleted); all four words are in `generated/dictionary/en.txt`:
```ts
play(createSession(1), [
  drop(6, 2, 4), { type: 'arrange', arrangement: [28, 9] }, VALIDATE, CONFIRM, // ONE → cell 3 [32, 28, 9]
  drop(6, 4, 1), { type: 'addFreeLetter', cell: 3 }, { type: 'arrange', arrangement: [9, 1, 34, 31, 27] }, VALIDATE, CONFIRM, // WEAPON → cell 6
  drop(8, 3, 1), { type: 'addFreeLetter', cell: 3 }, { type: 'arrange', arrangement: [28, 5, 46, 37] }, VALIDATE, { type: 'setTarget', cell: 4 }, CONFIRM, // INCUR → cell 4
  drop(2, 2, 8), FLIP, { type: 'addFreeLetter', cell: 3 }, { type: 'addFreeLetter', cell: 6 }, { type: 'arrange', arrangement: [26, 19, 27, 32] }, VALIDATE, // MINOR, target 5
], ['one', 'weapon', 'incur', 'minor'])
```
Result: cursor {3, place}, legal 3–5, target 5 (empty), order [26, 19, 27, 32, 38], scoreDelta 16; cell 3 [32] used → {null, 0}; cell 4 [20, 28, 5, 46, 37] unused; cell 5 → {38, 5}; cell 6 [48, 9, 1, 34, 31, 27] used, not legal → {31, 5}. The one-card cell comes from two takes (WEAPON's E, INCUR's N).

**★ / badge at 360 px (for the checkpoint).** `cardWidth`: floor((360 − 2·4)/8 − 4) = 40 → slot 44, H 53; card rect x 2–42 in the cell. Badge: right edge 44 − 4 = 40, width max(16, text + 8); "15" at 700 11 px measured 12.59 px in the host Chromium (fc-match: Noto Sans/Roboto Bold) → x 19.41–40; Roboto (Android system-ui) 0.5615 em/digit → x 19.65–40. Planned ★ pill 16 × 16 at x 4–20, same 16 px row (both `bottom: 2px`). **Overlap 0.35–0.59 px wide, 16 px tall: the rects intersect.** (A badge-style padded pill, 18 px, would overlap 2.6 px.) At 412 px (w 46) the badge starts at x 25.4: no overlap. Per the owner decision the badge paints above the pill (later DOM sibling, both `z-index: auto`), so the look is the decided one; only the AC's non-intersection assertion conflicts. Proposed default for Jared: replace that assertion with "where the rects meet, `document.elementFromPoint` at the overlap returns the `.count`" (badge above), marks unmoved; the alternative is moving or narrowing a mark (a DESIGN.md look change).

**Place-phase pin inventory** (grep of `.used`, `mirror-of`, `.count`, `expectUsedCell*` over `e2e/`; Composing/Idle hits in free-letter, tile-drag, tile-tap, board-keys, surfaces-success, flip.spec :266/:285, tray.spec :145/:201/:422 stay):
- `board-phases.spec.ts:199-235` table → kinds as in AC; `:348` R-33 (UI) → retitle "R-33 (UI) Q-49 wordcell-3 shows the preview mirror of 28 in Place (with the selected target) and the used face mirror after one Undo into Composing", Place half asserts `.preview` mirror 28 at opacity 1, no hatch, 42/0 hidden; `:423` `expectRedoTailPlace` → the Place preview check (`:443`, `:455` Composing, unchanged).
- `board.spec.ts:105-113` F11 → kind suffix (`m` used, `p` preview, …), redo-tail cell 3 `['42', '0', '28p']`, comment "28 on top as the target's preview mirror".
- `tray.spec.ts:416` (Place compact) → `wordcell-4` has no `.used` mirror and no element for 35, live 28 visible; title "… cell 4 previews its card beneath"; `:467` Composing, unchanged.
- `place.spec.ts:493,502,518-519,579` (two-cards) → `:493` cell 4 live 20 visible, no mirror, no badge (count 1); `:502` after retarget to 4 `.preview` mirror of 42, badge 6, 20 hidden; `:518` badge `2` → no badge, `:519` live 20 + ★; `:579` after reload `.preview` mirror of 26, badge 6; titles: `:487` unchanged, `:514` "badge 2 on cell 4 with the used mirror on top" → "cell 4 previews card 20 (no badge)", `:558` "cell 4 used and the target" → "cell 4 the target previewing 26". `:421` (won + Undo, drag on target 6's top card 13): 13 is hidden in Place → press the target's `.preview` mirror rect (same card rect); title "target 6's shown top".
- `fly-to-cell.spec.ts` (interim, entry 3 rewrites): snapshot records `preview` kind; `expectFlight` start check excludes `preview` mirrors and asserts one `preview` mirror of the last committed card in the target (`:167`, `:235` Redo); `:176` start `shown` → `['p26']`; `:189` and `:296` (reduced) start has `p28`, in flight no mirror and `shown` `['0', '9', '32', '28']` (card beneath by `lowest − 1`), after `['28']`, retitled "… the card beneath is the previous top drawn until the last landing (interim hold)"; `:212` start cell 4 `[20]` shown, cell 5 a `p42`, retitled "in Place and at the click the source cell shows its beneath card"; `:249` `[data-wordcell] [data-mirror-of]:not(.preview)` 0 plus one `.preview[data-mirror-of="28"]` in `wordcell-3`.
- `wordcell-view.spec.ts:230,1053` `[data-wordcell]:has(.used)` → `:has(.preview)` (redo-tail's used cell is the target), the peek checks unchanged.
- `screen-reader.spec.ts:294`, `theme-art.spec.ts:113-127` → Composing via one Undo, assertions kept.
- After the render change, run `npx playwright test --project=android` and `--project=desktop`: every other new failure is classified in Implementation Notes (a Place used-look pin → updated here; anything else → investigate, not edit).

**Review-log minors** — resolved: ★ "box" → the 16 × 16 pill above (`border-radius: 9999px`, `text.star`); fixture reason dropped, script given; "(on drop or tap-swap)" → "any route" (Always); "no copy in any WordCell unless" (Always); "the hold code is unchanged" (Always); `.count` pins in the inventory; retarget onto the used single-card cell (AC); ★ absence reading (AC); "Redo into Place" (AC); Validate into Place (R-33 AC); per-sentence test names (AC); empty-target long-press on `session-place` cell 3 (AC). The ticket text itself is not edited (the build never writes ticket files).

## Verification

**Commands:**
- `npm test` -- expected: all pass, incl. labels, contrast, flip, serialize, view and architecture tests.
- `npx playwright test e2e/place-preview.spec.ts e2e/board-phases.spec.ts e2e/fly-to-cell.spec.ts e2e/place.spec.ts e2e/screen-reader.spec.ts --project=android` -- expected: pass.
- `npm run test:all` -- expected: exit 0.
- `npm run test:screens` -- expected: pass after the listed baselines are updated; no other PNG changed.

## Auto Run Result

- **Status:** ready-for-dev — halted after planning at the ticket's plan checkpoint ("an unattended build stops after planning for a person to approve the plan before implementing"); no code, fixture or test written yet.
- **For the owner at the checkpoint:**
  1. Approve the plan (fixture `session-place-used-cells` script, rendering, pin inventory, test mapping).
  2. ★ pill vs two-digit badge at 360 px: computed and measured, the rects **intersect** by about 0.35–0.6 px (Design Notes). The AC's non-intersection assertion would therefore fail after approval. Proposed default: keep both marks at their DESIGN.md corners (your 2026-10-28 decision) and change the assertion to "the badge is drawn above the pill where they meet" (`elementFromPoint` at the overlap returns `.count`); the alternative is moving or narrowing a mark, which changes the DESIGN.md look.
- **Review-log minors:** all twelve resolved in the plan (Design Notes, last paragraph); the ticket text is not edited by the build.
- **Verification:** the fixture's move script was replayed through the engine (scratch test, deleted); the badge width was measured in the host Chromium at 360 px. No suite was run (nothing implemented).
