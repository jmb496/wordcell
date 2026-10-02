---
title: 'Composing, Place and static tray rendering'
type: 'feature'
ticket: '3'
created: '2026-10-02'
status: 'built'
baseline_revision: 'b48f46623148b961e14947295ce5079fcd030d51'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-composing-place-and-static-tray-rendering.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md'
warnings: ['oversized']
deferred:
  - summary: 'Count badge 1/2-card boundary (handed over by 4.2): no fixture this ticket scripts reaches 1 or 2 cards on a WordCell; carried to the epic 4 retrospective (ticket Notes).'
    severity: minor
  - summary: 'Compact tray mode (8+ tiles, 44 px tiles, up to two clipped rows) is never rendered in a browser here: every fixture state has ≤ 7 tiles. Covered by the tray helper Vitest and the structural AD-11 (F2) check; the first ticket that can reach 8+ tiles is 4.7 (tap-drop: a 7-card tail onto a non-empty column gives 8 tiles), which should add a Playwright compact/clip check. QU compact tile rendering is unverified for the same reason.'
    severity: minor
  - summary: 'Placeholder negative case: a whole column dropped on another column shows no placeholder under its ghosts. Needs a drop; carried to 4.7/4.8. R-22 P4 supp. (placeholder hit rect, self-drop) stays with the gesture tickets; this ticket''s R-22 test is render support only.'
    severity: minor
  - summary: 'R-22 Idle clause on session-idle-empty-column duplicates 4.2''s placeholder check on session-won; kept as the baseline for the Undo steps.'
    severity: minor
---

<intent-contract>

## Intent

**Problem:** The Board (ticket 4.2) renders Idle and Game over only; Composing and Place draw every card live in its column, no tray tiles, no ghosts, no mirrors, so AD-14 (one live element per card), R-33/R-42 states and R-73 re-render cannot be shown, and no screenshot baselines exist.

**Approach:** Add the static tray (`src/ui/Tray.svelte`) with two pure helpers (tray order, tray sizing), Card mirror/ghost/destination/tile variants, ghost and used-face mirrors in Column and WordCellRow, the scripted fixture `session-idle-empty-column.json`, a Playwright phase spec with engine-computed literals, and `e2e/board.screens.spec.ts` with container-generated baselines, exactly as the ticket Description and ACs specify.

## Boundaries & Constraints

**Always:** The ticket (Description, Interface, Tests, Owns, ACs, Notes) is the contract; this plan only fixes what it leaves open. Components read `GameView` only (AD-3): ghosts, destination style and used faces come from membership in `view.draft.source` / `view.draft.destination` and `CellView.used`, never from slicing column cards by counts. UI imports from `src/engine/index.ts` are `import type` only. Every mirror carries `data-mirror-of=<CardId>` and no `data-card-id`, `data-testid` or `data-place`; every live card keeps all three. Card wrappers, tiles and mirrors keep `touch-action: none; user-select: none`. Expected values are the literals below; a mismatch is rechecked against `view()`, then reported, never edited to pass. Test names start with their id (AGENTS.md Conventions); every P4 test asserts `current().session.cursor` and that the stored `wordcell:session` equals `current().session` (rule-coverage preamble). Screenshot baselines are generated only in the container (`npm run test:screens`).

**Never:** No engine source change (fixtures and engine tests only); R-02 golden deal untouched. No tray interaction, tile tags (origin, position, star), word text, k controls, letter count or meta line (epic 5); no gestures or live layout (4.4+). No `data-testid` beyond the AGENTS.md list. No fallback/defensive code (rule 6). No commits beyond the workflow's own.

## I/O & Edge-Case Matrix

Literals from `view()` over the fixtures (seed 1). Tray order is DOM order (live `[data-card-id]` and `[data-mirror-of]` inside `[data-band="tray"]`), `m` = D-block mirror. "Mirrors" = sorted `data-mirror-of` ids board-wide.

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Idle / Game over | session-idle-fresh `{0,idle}`, session-won `{8,idle}`, session-gave-up `{0,idle}`, session-idle-pending-draft `{0,idle}` | mirrors []; tray empty | — |
| Composing | session-composing `{0,composing}` | mirrors [0,28,42]; tray [42,0,28m]; column-3 ghosts [42,0]; card-28 live in column-6, destination style | — |
| Composing 2 letters | session-composing-draft-2-letters `{0,composing}` | mirrors [0,28]; tray [0,28m] | — |
| Place | session-place, session-below-committed-last `{0,place}` | mirrors [0,28,42]; strip [42,0,28] (`data-place="strip"`); ghosts 42,0 in column-3 and 28 in column-6; wordcell-3 target (ring + check, opacity 1), wordcell-4…10 opacity 0.35 | — |
| Place, used cell | session-place-free-letter-redo-tail `{1,place}` | mirrors [9,28,32]; strip [9,32,28]; ghosts 32 (column-4), 9 (column-6); wordcell-3 holds live 42, 0 (hidden) + used mirror of 28, ring `target` + check at full opacity over the hatch | — |
| Composing, used cell | redo-tail + Undo `{1,composing}`; redo-tail + Undo, Undo, Redo `{1,composing}` | mirrors [9,28,32]; tray [32,28,9m]; card-28 live in tray; wordcell-3 face = used mirror of 28 | — |
| R-30 k = 2 right | redo-tail + Redo, Redo `{2,composing}` | mirrors [1,26,27]; tray [26,1m,27m]; cards 27, 1 live in column-6, destination style | — |
| idle-empty-column | new fixture `{1,idle}` | mirrors []; column-1 placeholder visible; wordcell-7 live [24,6,49,30,25,20,48] bottom→top, 48 visible | — |
| … one Undo | `{0,place}` | 7 ghosts in column-1 (no placeholder visible); strip [24,6,49,30,25,20,48]; wordcell-7 target, 3–6 `legal`, 8–10 opacity 0.35 | — |
| … two Undos | `{0,composing}`, k = 0 | 7 ghosts in column-1, placeholder visible under them; tray [24,6,49,30,25,20,48] all live | — |
| Tray sizing helper | tiles n at (w 46, inner 384) and (w 40, inner 336) | perRow 7; tileWidth 46 / 44; area 92; 0 → card rows 0; 7 → card rows 1; 8, 14 → compact 2; 15 → compact 3; 22 → compact 4; w 70 (inner 576) → tileWidth 70, perRow 7, area 93 | — |
| Tray order helper | arrangement A, destination D (top→bottom), side | left: D (mirror) then A; right: A then reversed D (mirror); k = 0: A only | — |
| AD-11 (F2) | session-composing at 412 × 839 and 360 × 839 (viewport set before seeding/goto) | face width 46 / 40; tray band height 176, its bottom = `[data-band="labels"]` top; tile area `overflow: hidden`, height 92, bottom ≤ labels top; a tray tile and a ghost compute `touch-action: none`, `user-select: none` | — |

</intent-contract>

## Code Map

- `src/engine/view.ts` -- read-only. In Composing/Place the position is before `moves[cursor.index]`: S cards are still at the bottom of the source column, D at the bottom of the destination, a free letter still tops its cell. `DraftView.source`/`destination` top→bottom; `arrangement` = S ∪ free letters; word = `side === 'left' ? [...D, ...A] : [...A, ...D.reverse()]` (`rules.ts:269`). `PlaceView.placementOrder`, `target`, `legalTargets`; `CellView.used`, `isLegalTarget`.
- `src/ui/Board.svelte` -- replace the `tray` snippet branch with `<Tray>` (props: `view`, `w`, tray inner width `metrics.board − 16`, band height `heights.tray`); pass `view.draft` and `view.phase` to `Column`; keep the rest.
- `src/ui/Card.svelte` -- today live only (`place: 'column' | 'cell'`, `full`, `hidden`, `used`). Gains: `place` `'tray' | 'strip'`; a `mirror` kind (`'ghost' | 'used' | 'block'`) that drops `data-card-id`/`data-testid`/`data-place` and sets `data-mirror-of`; `destination` (live D in its column); tile mode (`'card' | 'compact'`) with tile width; block segment start/end for the D-block outline. The live `used` prop goes (the used face is now a mirror). Keep F26 wrapper/face structure and `.glyph` (font.spec, app-shell.spec read it).
- `src/ui/Column.svelte` -- per card: in `draft.source` (Composing or Place), or in `draft.destination` in Place → ghost mirror; in `draft.destination` in Composing → live, destination style. Placeholder shown when empty, or in Composing when this column is both source and destination and every one of its cards is in `draft.source`.
- `src/ui/WordCellRow.svelte` -- the top card of a `used` cell renders as a `used` mirror (non-top cards stay live, hidden); classes `legal`, `target`, `dim` and `.check` unchanged (tests use them as hooks).
- `src/ui/layout/geometry.ts` -- `cardMetrics(w).H`; read-only. New helpers go beside it in `src/ui/layout/tray.ts`.
- `src/engine/serialize.test.ts` -- `ValidName` (`:271`), `VALID` (`:283`, comment "nine" → "ten"), `PROPERTIES` (`:770`), `REBUILDS` (`:1610`), helpers `play`, `drop`, `VALIDATE`, `CONFIRM`; append the new entry at the end of `ValidName`, `VALID` and `REBUILDS` (same index).
- `src/architecture.test.ts:1932` -- title "nine" → "ten"; insert `'session-idle-empty-column.json'` alphabetically (after `session-gave-up.json`).
- `e2e/smoke.spec.ts:45` -- 'AD-17 WordCell cards render bottom → top as live cell cards' moves to cell 7 of session-idle-empty-column.
- `e2e/dictionary.spec.ts:80–103` -- rejected-word flow: the message must sit inside the tray band's word-line slot.
- `e2e/board.spec.ts` -- 4.2's spec; helpers `openFixture`, `box` to copy (tests never import each other).
- `e2e/helpers/seed.ts` (`seedStorage`, `fixture`), `e2e/helpers/style.ts` (`tokenColor`), test hook `window.__wordcell.current()` / `dictionaryState()`; `dictionary.spec.ts:46` `activeSession` pattern for stored vs current.
- `package.json` `test:screens:run` -- drop `--pass-with-no-tests`. `playwright.screens.config.ts` -- `updateSnapshots: 'missing'` locally.
- Deleted placeholder spec (`git show 17cfcad:e2e/placeholder.screens.spec.ts`) -- copy its dictionary-ready wait and font check.

## Tasks & Acceptance

**Execution:**
- [x] `fixtures/session-idle-empty-column.json` -- `{"version":1,"seed":1,"moves":[<session-won.json moves[0] verbatim>],"cursor":{"index":1,"phase":"idle"},"gaveUp":false,"activeMs":0}`, byte-equal to `serializeSession` of the rebuild (no trailing newline unless the other fixtures have one).
- [x] `src/engine/serialize.test.ts` -- `ValidName` `'idle-empty-column'`; `VALID` entry; `PROPERTIES`: phase idle, `cursor.index === moves.length`, `view` column 1 empty and cell 7 holds 7 cards; `REBUILDS` `['session-idle-empty-column', …, () => play(createSession(1), [drop(1, 7, 1), VALIDATE, CONFIRM], ['ldxomiw'])]` (frozen like its neighbours).
- [x] `src/architecture.test.ts` -- list and title per Code Map.
- [x] `src/ui/layout/tray.ts` -- `trayLayout(tileCount, w, innerWidth)` → `{ mode: 'card' | 'compact', rows, perRow, tileWidth, area }`: tileWidth = max(w, 44); perRow = floor((innerWidth + 4) / (tileWidth + 4)); card when count ≤ perRow (rows 0 for 0 tiles, else 1); else compact, rows = ceil(count / perRow), uncapped; area = max(H, 92). `trayOrder({ arrangement, destination, side })` → `{ id, mirror }[]` per the matrix.
- [x] `src/ui/layout/tray.test.ts` -- `AD-11 …` cases for every sizing matrix row; `AD-14 …` order cases left, right, k = 0.
- [x] `src/ui/Card.svelte` -- variants per Code Map and Design Notes.
- [x] `src/ui/Tray.svelte` -- `[data-band="tray"]` at `heights.tray`, padding 8: `.word-line` (24 px; the epic 3 invalid-word markup moved from Board, unchanged), `.tiles` (height `area`, `overflow: hidden`, rows top-aligned, wrap at `perRow`), `.controls` (44 px, empty). Composing: `trayOrder` over `view.draft` → live `place="tray"` tiles and `block` mirrors; Place: `placementOrder` → live `place="strip"` normal tiles; sizing counts those tiles. Idle and Game over: empty tiles and controls.
- [x] `src/ui/Board.svelte`, `Column.svelte`, `WordCellRow.svelte` -- per Code Map.
- [x] `e2e/board-phases.spec.ts` (new, android only via `test.skip`) -- `AD-14 …` loop over every matrix state (seed, optional Undo/Redo clicks via `getByTestId('undo'|'redo')`, then assert): 52 `[data-card-id]`, ids 0–51 once; 52 `[data-place]` and 52 `[data-testid^="card-"]`, each with `data-card-id`; `data-place` per container (columns `column`, wordcells `cell`, tray `tray` in Composing / `strip` in Place); sorted mirrors literal; every mirror lacks `data-card-id`, `data-testid`, `data-place`; tray order literal with x strictly ascending in DOM order; cursor literal; stored = current. `AD-14 (R-30) …` k = 2 right state incl. destination style of 27, 1 in column-6. `R-42 (UI) …`, `R-33 (UI) …` (incl. used + selected target on redo-tail), `R-22 …`, `R-73 (UI) …` (reload of session-composing and redo-tail, plus a reload after Undo on redo-tail), `R-70/R-71 …` (Undo, Undo, Redo), `AD-11 (F2) …` at 412 and 360 (`page.setViewportSize` before `seedStorage`/`goto`). Observables per Design Notes.
- [x] `e2e/smoke.spec.ts` -- the moved test: session-idle-empty-column, cell 7 `data-card-id` order [24, 6, 49, 30, 25, 20, 48], card-48 visible, the six beneath hidden, all `data-place="cell"`, 52 cards, zero mirrors, Idle cursor.
- [x] `e2e/dictionary.spec.ts` -- in the rejected-word test assert the message is inside `[data-band="tray"] .word-line`.
- [x] `e2e/board.screens.spec.ts` -- `AD-17 board screenshot <phase>` for Idle (session-idle-fresh), Composing (session-composing), Place (session-place-free-letter-redo-tail), Game over (session-gave-up): seed, goto, 52 `[data-card-id]` attached (`toHaveCount(52)`; not visible: hidden cell cards), `dictionaryState() === 'ready'`, font loaded (copied check), `toHaveScreenshot('board-<phase>.png')` viewport capture; `package.json` drops `--pass-with-no-tests`; run `npm run test:screens` to create the 8 baselines, then again to compare.
- [x] Fix any existing e2e test broken because Composing/Place fixtures now render tray tiles, ghosts and mirrors, keeping its intent; list each in Implementation Notes.

**Acceptance Criteria:**
- Given the change, when `npm run test:all` runs, then lint, check, unit, build within budget, dist-smoke, e2e and pwa pass.
- Given the container, when `npm run test:screens` runs a second time, then all 8 screenshots match their baselines, and each PNG was viewed and checked against DESIGN.md (ghost dashed slots, destination-fill D with lock, tray tiles, used hatch, target ring + check, 35 % cells) with the result recorded in Implementation Notes.
- Given every matrix row, when its named test runs, then it passes with the literal unchanged.

## Implementation Notes

- Fixture `session-idle-empty-column.json` written from `session-won.json` `moves[0]` (no trailing newline, as the other fixtures); the `REBUILDS` entry proves it byte-equal to `serializeSession` of `play(createSession(1), [drop(1, 7, 1), VALIDATE, CONFIRM], ['ldxomiw'])`.
- Matrix literals re-derived from `view()` before writing the Playwright spec (throwaway script, deleted): all rows matched the plan unchanged. The two `session-idle-empty-column` Undo states have mirrors `[6, 20, 24, 25, 30, 48, 49]` (the seven column-1 ghosts).
- `Card.svelte`: `place` is now the layout position for every element (live or mirror); `mirror` drops `data-card-id`/`data-testid`/`data-place` and sets `data-mirror-of`. Block mirrors join over the gap by widening the face to the pitch; non-end block faces overlap the next tile by 1 px so fractional DPR leaves no seam.
- `Tray.svelte`: tile area is a grid with `perRow` columns of the tile pitch, so wrapping follows `trayLayout` exactly rather than flex arithmetic.
- Existing e2e changes: `smoke.spec.ts` cell test moved to `session-idle-empty-column` cell 7 (the redo tail's cell 3 top is now a used mirror, so the old 3-live-card count broke; R-33 covers it now); `dictionary.spec.ts` rejected-word test asserts the message inside `[data-band="tray"] .word-line`. No other existing test broke.
- Baselines: `npm run test:screens` run twice (first creates the 8 PNGs and reports them as missing/failed, second: 8 passed). Each PNG viewed: Idle and Game over show the empty reserved tray band, no ghosts; Composing shows the column-3 dashed ghosts, N in column 6 in destination fill with blue outline and lock, tray T A + locked blue N block; Place shows ghosts in columns 4 and 6, strip E O N as normal tiles, cell 3 hatched at 40 % with the 3 px teal ring and check chip, cells 4–10 at 35 %. Matches DESIGN.md.
- Look note (not a test): ghosts have no fill per DESIGN.md, so the live card above an S ghost shows its full face (flourish included) through the ghost, and stacked ghosts overlap their dashed outlines. Faithful to "no face fill"; worth an owner glance at the baselines.
- `npm run test:all` exit 0; unit suite 4.36 s (single run, under the 5 s budget); JS 33.96 kB gzip.

## Plan Change Log

## Review Triage Log

### 2026-10-02 — Review pass
- verdicts: 25 findings — high 0, medium 2, low 9, false 14, maybe-false 0
- findings:
  - `[low]` `[patch]` blind: mirrors (ghost, used, block) not aria-hidden, so card 28 is announced twice — `aria-hidden="true"` on mirror wrappers in Card.svelte.
  - `[false]` `[reject]` blind: last tile of a full row clipped up to 2 px — inner = 8w + 16 and pitch = max(w, 44) + 4 leave (inner + 4) − 7 × pitch ≥ 4 for every w ≥ 40, so the last face always ends inside the content box.
  - `[low]` `[patch]` blind: tray `{#each}` keyed by id alone lets one node flip between mirror and live across phases (AD-14 identity) — key is now id plus the mirror flag.
  - `[low]` `[reject]` blind: `segment()` row-wrap and compact mode untested — only reachable with 8+ tiles, which the ticket's review log leaves browser-unverified until the first drop ticket (plan `deferred`, 4.7); a Vitest would add a new export.
  - `[medium]` `[patch]` blind: lock glyph and ghost look untested — grouped with the verification-gap row below; same patch.
  - `[false]` `[reject]` blind: Idle pending-word line missing — the ticket says the word-line slot shows only epic 3's invalid-word line here.
  - `[low]` `[reject]` blind: tray padding 16 and area 92 repeated in Board/Tray/geometry — drift needs a padding change nobody makes in this epic; the fix adds exported constants, not a direct correction.
  - `[low]` `[reject]` blind: font check copied instead of a helper — the ticket prescribes the deleted placeholder spec's waits; one duplicate, no named divergence.
  - `[false]` `[reject]` blind: screenshots skip k = 2, compact, won — the ticket fixes the four captured states.
  - `[low]` `[reject]` blind: F2 test checks one tile and one ghost only — the AC asks for "a tray tile"; every variant shares the `.card` wrapper rule that sets both properties.
  - `[low]` `[patch]` blind: R-42 title claims a legal ring session-place lacks; rings checked by class only — title fixed; `::after` border colour and width now asserted for legal (2 px) and target (3 px) cells.
  - `[false]` `[reject]` blind: the first reload in R-73 proves little — the AC defines exactly a reload of the fixture; the redo-tail test also reloads after an Undo.
  - `[false]` `[reject]` blind: smoke cursor read returns a silent null — a null fails `toEqual({ index: 1, phase: 'idle' })`; the test is AD-17, not a P4 test bound by the stored-session preamble.
  - `[false]` `[reject]` edge: `perRow` 0 when inner < tile width — inner = 8w + 16 ≥ 336 > tile width at every supported w.
  - `[false]` `[reject]` edge: the x-ascending check fails at a row wrap — no STATES entry has more than 7 tiles; the 4.7 compact case will need a row-major check (deferred entry).
  - `[medium]` `[patch]` verification-gap: ghost no-glyph and lock placement only seen by container screenshots — board-phases now asserts no `.glyph` in column-3 ghosts, one `svg.lock` on card-28 in column-6 and on tray mirror 28, none on live tiles, and on the k = 2 state the lock on mirror 1 only.
  - `[low]` `[reject]` intent: compact tiles and clipping exercised only by the helper — deferred to 4.7 per the ticket's review log.
  - `[low]` `[reject]` intent: multi-tile D-block join has no visual baseline — the screenshot set is fixed by the ticket; the k = 2 lock placement is now asserted (patch above).
  - `[false]` `[reject]` intent: desktop not covered by board-phases — the AC scopes these checks to android.
  - `[false]` `[reject]` intent: target ring and check pre-existed from 4.2 — no defect; this ticket adds their tests.
  - `[false]` `[reject]` intent: R-30 left/k = 0 order covered by Vitest over a synthetic draft — matches the ticket's AD-n UI Vitest.
  - `[false]` `[reject]` intent: assertion strengths (stricter F2, placeholder occlusion) — stricter equalities satisfy the AC; ghosts have no fill, so the placeholder is not occluded.
  - `[false]` `[reject]` intent: literal provenance not shown in the diff — the plan matrix records them, re-derived from `view()` in Implementation Notes.
  - `[false]` `[reject]` intent: QU badge on tiles unexercised — already in `deferred` (QU compact) and no fixture puts QU in the tray; not a defect.
  - `[false]` `[reject]` intent: session-won has no screenshot — the ticket names session-gave-up for Game over.

## Design Notes

Look (DESIGN.md Components → Card, Tile, Tray band, WordCell): *ghost* = card-sized w × H 1 px dashed `--wc-outline` outline, no face fill, no glyph, no flourish; *destination* (live D in column) = `--wc-destination-fill` face, 2 px `--wc-destination` border (box-sizing keeps size), lock glyph (aria-hidden svg, 10 × 12 box, inset 2 px top-left; ×2 badge stays top-right); *block* mirror (D in tray) = destination-fill tile, faces joined over the 4 px gap, one `--wc-destination` outline per row segment and one lock at the segment's top-left (segment break at `i % perRow === 0`); *used* mirror = the normal face at 40 % with the 45° hatch (current `.used .face` rule); tiles = normal card faces `tileWidth` wide, wrapper = tile pitch (tileWidth + 4, F26 hit rect), glyph sized from w; compact = 44 px tall, no flourish, glyph 22 px (`Qu` 18 px), ×2 badge kept. A used non-legal cell in Place keeps the 40 % hatch plus the cell's 35 % (CSS stacks).

Test observables: ghost = `[data-mirror-of]` inside `column-<n>`; destination style = live card class `destination` and its `.face` background-color = `tokenColor('--wc-destination-fill')`; used = `wordcell-3 [data-mirror-of="28"]` whose `.face` computes opacity 0.4 and a `repeating-linear-gradient` background-image; target = `wordcell-n` class `target` and its `.check` visible with effective opacity 1 (product of computed opacity up the ancestors); legal = class `legal`; not legal = class `dim`, computed opacity 0.35; placeholder = `column-1 .placeholder` visible/hidden.

Review-log items resolved here: '(P4 parts)' on R-33/R-42/R-73 → these tests are the P4 halves, P5 owns the rest (rule-coverage); placeholder spec copy covers only the dictionary/font waits, cards are `toHaveCount(52)`; compact tray, placeholder negative, R-22 duplicate, count badge → `deferred`; used + target, 360 px viewport-before-seed with w 40, w 70 helper case, AD-11 Vitest naming, dictionary.spec assertion, fixture insertion order, `{ id, mirror }` order helper with left/right/k 0, baseline review, optional AD-14 fixtures (all three added), tray band bottom = labels top and height 176, ghost touch-action → matrix/Tasks above. References parenthetical and 'Resolved (F2)' wording are ticket text (not edited by builds); the F2 clip is browser-unverified until 4.7 (deferred).

## Verification

**Commands:**
- `npm run check && npm test` -- expected: green, unit suite still under budget
- `npx playwright test e2e/board-phases.spec.ts e2e/smoke.spec.ts e2e/dictionary.spec.ts --project android` -- expected: green
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` (twice: create, then compare) -- expected: exit 0, 8 PNGs under `e2e/board.screens.spec.ts-snapshots/`

**Manual checks (if no CLI):**
- View each of the 8 baseline PNGs and confirm the Design Notes look; record it in Implementation Notes.

## Auto Run Result

- **Summary:** Composing and Place now render per AD-14. Composing shows S ghosts, live D cards in destination style (fill, outline, lock) and the static tray (F2): live S and free-letter tiles in R-30 order with D-block mirrors at the side end. Place shows live strip tiles in `placementOrder` with S and D ghosts. A used WordCell face is now a mirror, and the placeholder shows under the ghosts of a whole-column self-drop. Every mirror carries `data-mirror-of` only and is `aria-hidden`. The tray reserves its 176 px band (word line 24, clipped tile area max(H, 92), empty control row 44) and is sized by the pure `trayLayout` and `trayOrder` helpers. Also added: the scripted fixture `session-idle-empty-column.json`, the board phase Playwright spec and 8 container screenshot baselines.
- **Files:**
  - `src/ui/Tray.svelte` (new): the static tray.
  - `src/ui/layout/tray.ts` and `tray.test.ts` (new): the sizing and order helpers, with AD-11/AD-14 Vitest.
  - `src/ui/Card.svelte`: tray/strip places, ghost/used/block mirrors, destination style, card and compact tiles, aria-hidden mirrors.
  - `src/ui/Column.svelte`: ghosts and destination style from draft membership; placeholder under self-drop ghosts.
  - `src/ui/WordCellRow.svelte`: the used face is a mirror.
  - `src/ui/Board.svelte`: renders Tray and passes the draft and phase to Column.
  - `fixtures/session-idle-empty-column.json`, registered in `src/engine/serialize.test.ts` (ValidName, VALID, PROPERTIES, REBUILDS) and `src/architecture.test.ts` ("ten").
  - `e2e/board-phases.spec.ts` (new): AD-14 over 15 states; R-30, R-42, R-33, R-22, R-73, R-70/R-71 and AD-11 (F2) at 412 and 360 px.
  - `e2e/board.screens.spec.ts` (new) and its 8 baselines.
  - `e2e/smoke.spec.ts`: the cell test moved to cell 7 of the new fixture.
  - `e2e/dictionary.spec.ts`: the invalid-word line is checked inside the tray word-line slot.
  - `package.json`: `--pass-with-no-tests` dropped.
- **Review-log carry-ins:** all resolved in the plan (Design Notes, matrix, Tasks) or recorded in `deferred`:
  - compact tray, the first drop ticket being 4.7;
  - the placeholder negative case;
  - the R-22 duplicate;
  - the count badge 1/2 boundary.
- **Review:** 25 findings: high 0, medium 2, low 9, false 14.
  - Patched 4 entries: 1 medium (lock/ghost glyph assertions, grouped across two lenses) and 3 low (aria-hidden mirrors, tray key with the mirror flag, R-42 title plus `::after` ring checks).
  - Deferred 0 new.
  - 18 rejected, each with its reason in the triage log.
- **Follow-up review:** false. One medium and three low entries were patched, all small and verified green; there is no high and no second medium.
- **Verification:**
  - `npm run test:all` exit 0 before and after the patches: 1711 unit tests, build 495 357 / 600 000 B, dist-smoke 13, e2e 239, pwa 12.
  - `npm run test:screens` 8/8 compared, twice.
  - The board-phases spec gives 25 passed on android.
  - The baselines were viewed against DESIGN.md (Implementation Notes; composing and place android re-checked by the orchestrator).
- **Residual risks:**
  - The `deferred` items.
  - Ghosts have no fill (DESIGN.md), so the live card above an S ghost shows its full face and stacked ghost outlines overlap; worth an owner glance at the Composing and Place baselines.
  - The D-block's 1 px seam overlap at a fractional DPR was checked only in the container baselines.
