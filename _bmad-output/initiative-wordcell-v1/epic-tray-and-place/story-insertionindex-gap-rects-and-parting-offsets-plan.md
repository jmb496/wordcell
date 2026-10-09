---
title: 'insertionIndex, gap rects and parting offsets'
type: 'feature'
ticket: '6'
created: '2026-10-09'
status: 'built'
baseline_revision: 'c80a4478073d472be3b58db5cbcad3633fb25a86'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-insertionindex-gap-rects-and-parting-offsets.md'
warnings: ['oversized']
deferred:
  - summary: >-
      slotRects/gapRects geometry (4 px gap, column pitch, row pitch tileHeight + 4, + 2 px origin) is checked only against its own constants, never against the rendered TileRows/Card tile rects.
    evidence: |-
      verification-gap and blind lenses: tray.test.ts and targeting.test.ts build rects from trayLayout/slotRects and assert literals from the same constants; TileRows keeps its own `+ 4` pitch and `row-gap: 4px`; no test compares slotRects with getBoundingClientRect. The functions have no caller until entry 7; entry 7's verify in tickets.toml now records the check (Playwright on android: tile faces match slotRects at rest on session-composing and session-place-compact and in a parted position mid-drag).
    location: >-
      src/ui/layout/tray.ts slotRects
    severity: low
---

<intent-contract>

## Intent

**Problem:** Tile drags (entry 7) and free-letter drags (entry 8) need pure, tested geometry: which insertion gap the dragged face is nearest (F3), the reorder result, the resting slot and gap rects, and the parting offsets per tray position; the D-block segment rule lives untestably inside `TileRows.svelte`.

**Approach:** Exactly the ticket (story-insertionindex-gap-rects-and-parting-offsets.md, authoritative; read it in full): `insertionIndex` and `reorder` in `gestures/targeting.ts`; `slotRects`, `gapRects`, `partingOffsets`, `segmentEnds` and `TrayLayout.tileHeight` in `layout/tray.ts`; `TileRows.svelte` uses `segmentEnds` with no visible change. Pure functions and UI Vitest only; no caller wiring (entries 7, 8).

## Boundaries & Constraints

**Always:** pure (no DOM, `window`, Svelte, timers); fail fast with `throw new Error('AD-12 …')` on every inconsistent input (rule 6); test names start `AD-12` (`AD-11` for trayLayout `tileHeight` and segmentEnds at rest); tests beside the file; slot and gap rects from resting geometry only (never parted rects); run indices for `gap`/`from`, tray positions in the result; `pickTarget`, `Rect`, `trayOrder` unchanged.

**Never:** wire anything into the controller, Tray.svelte or any component other than TileRows.svelte's `segment`; change TileRows markup, CSS or Card props; add hysteresis; touch src/engine, src/shell, e2e, fixtures, screenshot baselines.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| nearest gap | dragged centre nearest an index's rect | that `gapRects` element (same reference) | none |
| tie across indices | equal distance to index a < b | a's element | none |
| tie within an index | equal distance to both rects of a row-break index | the earlier element in `gapRects` (end of row r) | none |
| reorder no-op | i = j or i = j + 1 | input reference | none |
| reorder out of range | j ∉ [0, n) or i ∉ [0, n] (non-integer too) | — | throws `AD-12 reorder …` |
| free-letter, gap moves no tile | first + gap = tileCount | every entry `{ slot: p, dx: 0, dy: 0 }` | none |
| free-letter without room | tileCount + 1 > slots.length | — | throws |
| inconsistent run | first < 0, count < 1, first + count > tileCount, tileCount > slots.length, gap ∉ [0, count], from ∉ [0, count) | — | throws (gapRects and partingOffsets) |
| empty / zero-area | `insertionIndex([], …)`, zero-area dragged | — | throws like `pickTarget` |
| slotRects bounds | slotCount < 1 or > perRow × rows | — | throws |

</intent-contract>

## Code Map

- `src/ui/gestures/targeting.ts` -- has `Rect`, `area`, `pickTarget` (zero-area throw at 44 is the pattern to copy). Add `export type GapRect = { readonly index: number; readonly rect: Rect }`, `insertionIndex(dragged: Rect, gapRects: readonly GapRect[]): GapRect`, `reorder(order: readonly CardId[], j: number, i: number): readonly CardId[]` (`import type { CardId } from '../../engine/index'`). Extend the header with one F3 paragraph.
- `src/ui/gestures/targeting.test.ts` -- existing `AD-12` pickTarget tests; add insertionIndex and reorder describes. Block-side cases build rects with `slotRects`/`gapRects` imported from `../layout/tray`.
- `src/ui/layout/tray.ts` -- `trayLayout` (add `tileHeight`: `mode === 'card' ? cardMetrics(w).H : 44`, i.e. `TOUCH_MIN`), `GAP = 4`, `trayOrder` unchanged. Add `import type { Rect } from '../gestures/targeting'` and:
  - `slotRects(sizing: TrayLayout, origin: { x: number; y: number }, slotCount: number): Rect[]` -- slot n: col n % perRow, row ⌊n / perRow⌋; left = origin.x + col·(tileWidth + 4), top = origin.y + row·(tileHeight + 4), tileWidth × tileHeight. Origin is the caller's (tray position 0's wrapper top-left + 2 px x, same viewport frame as the dragged face rect — document in JSDoc).
  - `gapRects(slots: readonly Rect[], perRow: number, tileCount: number, first: number, count: number): GapRect[]` -- index i ∈ 0…count is the boundary between tray positions p − 1 and p, p = first + i. Rect "after p − 1" = `[slot.right, slot.right + 4] × [slot.top, slot.bottom]` when p − 1 ≥ 0; rect "before p" = `[slot.left − 4, slot.left] × slot's top/bottom` when p < tileCount. Same row → one rect (they coincide); different rows → both, after-(p − 1) first; one side missing → the other only. So gap rects are top-aligned with their row's slots, cover only rows the run (or its bordering mirror) occupies, none after the last row, none inside the block (the block-left gap 0 / block-right gap count land on the block's outer edge). Output ascending by index.
  - `export type Parted = { readonly slot: number; readonly dx: number; readonly dy: number }`; `partingOffsets(slots, tileCount, first, count, gap, from?): Parted[]` (length tileCount, entry p for tray position p; offset = parted slot rect − slot p rect, left/top). Reorder (`from` = j defined): i = gap; i > j + 1 → positions first+j+1 … first+i−1 take slot p − 1; i < j → first+i … first+j−1 take p + 1; else (and every other position, origin included) slot p, zero. Free-letter (`from` undefined): throws when tileCount + 1 > slots.length; every position p ≥ first + gap takes p + 1 (mirrors after the run included), others p.
  - `segmentEnds(slot: number, perRow: number, mirrorBySlot: readonly boolean[]): { start: boolean; end: boolean }` -- verbatim rule of `TileRows.svelte` `segment(i)` (`start: slot % perRow === 0 || mirrorBySlot[slot − 1] !== true`, `end: (slot + 1) % perRow === 0 || mirrorBySlot[slot + 1] !== true`). JSDoc: entry 8 builds `mirrorBySlot` by mapping each mirror's `partingOffsets` slot (a mapping, not a re-derivation); in reorder mode the origin's slot can equal a neighbour's parted slot, so only free-letter results (or rest) feed `mirrorBySlot`.
- `src/ui/layout/tray.test.ts` -- six `trayLayout` `toEqual` literals gain `tileHeight` (412 px: card 61, compact 44; 360 px: card 53 (H from w 40, not tileWidth 44), compact 44; w 70: 93). Add slotRects, gapRects, partingOffsets, segmentEnds and the destination-cards describes.
- `src/ui/tray/TileRows.svelte:40-46` -- replace `segment(i)` body with `segmentEnds(i, sizing.perRow, mirrors)` where `const mirrors = $derived(tiles.map((t) => t.mirror))`; keep the call site `segment={tile.mirror ? segment(i) : undefined}` (or inline it); header comment unchanged in meaning.
- Not touched: `controller.ts`, `Tray.svelte`, `Card.svelte`, `visible-band.ts`, engine, shell, e2e.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/layout/tray.ts` -- add `tileHeight`, `slotRects`, `gapRects`, `Parted`, `partingOffsets`, `segmentEnds` per Code Map, each with a one-line JSDoc citing build-notes CAP-5/CAP-6 or F3; header line updated (no longer "Static tray" only).
- [x] `src/ui/gestures/targeting.ts` -- add `GapRect`, `insertionIndex` (Euclidean distance between centres; replace best when `d < best.d || (d === best.d && e.index < best.index)`, so ties within an index keep the earlier element; throws `AD-12 insertionIndex with no gap rects` and `AD-12 insertionIndex with a zero-area dragged rect`), `reorder` (integer range checks then no-op reference at i ∈ {j, j + 1}, else remove j and insert at i ≤ j ? i : i − 1).
- [x] `src/ui/tray/TileRows.svelte` -- `segment` via `segmentEnds`.
- [x] `src/ui/layout/tray.test.ts` -- tests (Acceptance list), including `tileHeight` literals.
- [x] `src/ui/gestures/targeting.test.ts` -- insertionIndex and reorder tests (Acceptance list).

**Acceptance Criteria (UI Vitest; geometry 412 px: w 46, inner 384, perRow 7, tileWidth 46, origin e.g. { x: 2, y: 0 } unless stated):**
- Given `trayLayout`, when the AD-11 sizing tests run, then each literal includes `tileHeight` (card H, compact 44).
- Given `AD-12 slotRects`, then card and compact pitches (x by 50, y by tileHeight + 4 = 48 compact), the + 2 px origin passed through, slot n with room present, and the out-of-range slotCount throws.
- Given `AD-12 gapRects`, then: half-gap row ends (gap 0 at [first.left − 4, first.left], end gap at [last.right, last.right + 4]); a row-break pair (two elements, same index, end-of-row first); none after the last row; M meeting the block at a row break (block left with k = 7: gap 0 has both rects, neither overlapping a mirror slot; block right with the block starting a row: gap |M| has both); block on each side within a row; k = 0; the Place strip (every position movable, a D card in the run); rects top-aligned with their row; inconsistent-run throws.
- Given `AD-12 insertionIndex`, then: single row; two compact rows by distance; block left, block right and k = 0 fed real `slotRects`/`gapRects` output, returned indices in M; ends of M; tie across indices → lower; tie within a row-break index → earlier element; returns the element itself (`toBe`); a row-break index whose start-of-row rect wins (that rect returned); a drag right by one past the neighbour's centre → gap j + 2 and `reorder` moves the tile by one; a drag to the far end → gap |M| (n), `reorder` puts the dragged tile last; the Place strip with a D card dragged; empty `gapRects` and zero-area dragged rect throw.
- Given `AD-12 reorder`, then drag left inserts at i; drag right at i − 1; gaps j and j + 1 return the input reference (`toBe`); a Place `placementOrder` with a D card; out-of-range j/i throw.
- Given `AD-12 parting offsets`, then: drag right by two (from j, gap j + 3: tiles j+1, j+2 one slot back); drag left by two (gap j − 2: tiles j−2, j−1 one slot forward); a drag right crossing a row break (the crossing tile → previous row's last slot, dx/dy literal) and a drag left crossing one (→ next row's first slot); reorder gaps j and j + 1 all zero; origin keeps its slot, zero offset; Place strip with a D card in the run; free-letter with the block on the right across a row break (mirrors shift, parted `mirrorBySlot` → `segmentEnds` literals for segment ends and locks (lock = start)); free-letter with the block on the left (mirrors unmoved, only M tiles from first + gap shift); a free-letter gap that moves no tile (all zero); a free-letter call without room throws; inconsistent run throws.
- Given `AD-12 destination cards never reordered or interleaved`, Composing with the block on either side: gapRects yields only indices 0…|M| and no rect intersects a mirror slot's interior; `reorder` over M and reorder-mode `partingOffsets` leave every D position at its own slot with zero offset.
- Given `AD-11 segmentEnds at rest`, then a 3-tile block within a row and a 3-tile block split by a row break give the literals today's `segment(i)` gives (start/end per mirror).
- Given the build, `npm run test:all` and `npm run test:screens` are green with no baseline change; the unit suite stays < 5 s.
- Sentence → test mapping: none of the R-/(UI) sentences is covered here (UI Vitest is never R-id coverage); the `AD-12 destination cards never reordered or interleaved` test backs rule-coverage's R-32 V row (supplementary).

## Implementation Notes

Implemented by a fresh subagent from this plan; files: `src/ui/layout/tray.ts`, `src/ui/gestures/targeting.ts`, `src/ui/tray/TileRows.svelte`, `src/ui/layout/tray.test.ts`, `src/ui/gestures/targeting.test.ts`. Within-row gaps push the "after p − 1" rect (identical to "before p" at whole-pixel geometry). Non-integer inputs throw everywhere; `gapRects` also throws on perRow < 1. A drag over a block that fills row 0 (block left, k = 7) is nearest gap 0's start-of-row-1 rect only when that centre is nearer than the end-of-row-0 rect — F3's nearest-centre rule, pinned by a test; entries 7/8 may find it odd in hand (no hysteresis per the [ASSUMPTION]).

Verification (orchestrator): focused Vitest 62 passed; `npm run test:all` exit 0 (2172 unit tests, dist, dev e2e, pwa); `npm run test:screens` 10 passed, no baseline change; unit median on an ext4 worktree (`~/wc56-median`, build tree applied on c80a4478073d472be3b58db5cbcad3633fb25a86, removed after): 3.40 (warm-up), 2.48, 2.48, 2.42 s → **median 2.48 s** (< 5 s). Matrix audit: every row covered by a passing test (tray.test.ts, targeting.test.ts).

## Plan Change Log

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 23 findings — high 0, medium 1, low 14, false 8, maybe-false 0
- findings:
  - `[low]` `[patch]` blind: targeting.test.ts block-left case title claims "→ gap 0" while it also asserts gap 4 over mirror slot 0 — retitled to state both outcomes; the gap-4 outcome is F3's nearest-centre rule (owner-confirmed spec) and is surfaced to the owner as a non-blocking UX note in Auto Run Result.
  - `[low]` `[reject]` blind: the R-32 test's `reorder` assertions cannot fail (reorder only ever receives M) — true by construction, harmless; the D-position guarantee is carried by the gapRects index/interior checks and the reorder-mode partingOffsets mirror checks in the same test.
  - `[medium]` `[patch]` blind: no reorder-mode partingOffsets case with first > 0 — a `first` off-by-one would pass every test (only mirrors were checked with the block left); added literal block-left drag-right and drag-left cases.
  - `[low]` `[reject]` blind: no-op boundary just before the neighbour's centre untested — the nearest-centre formula is pinned by the single-row, ties and drag-right-by-one cases; one more boundary point adds no new branch.
  - `[low]` `[reject]` blind: segmentEnds lacks perRow/slot input checks — the rule moved verbatim from TileRows `segment(i)`; perRow comes from `trayLayout` (≥ 1 at every supported width); a guard covers an undemonstrated state.
  - `[low]` `[defer]` blind + verification-gap: the 4 px gap/pitch lives in TileRows literals and `GAP`, and no test compares slotRects with rendered tile rects — the functions have no caller yet; entry 7's Playwright drag spec is where resting/parted positions meet the DOM (deferred).
  - `[low]` `[reject]` blind: insertionIndex always returns a gap and its JSDoc does not say callers gate on tray acceptance — acceptance (≥ 25 % over the tray band) is entry 7's per build-notes CAP-5; not a defect of the pure function.
  - `[false]` `[reject]` blind: layering inverted, layout ↔ gestures cycle — the import is `import type` only (erased, no runtime cycle), both modules are the UI layer, and the ticket keeps `Rect` in targeting.ts unchanged.
  - `[low]` `[patch]` blind: `(best as { e: GapRect }).e` cast in insertionIndex — accumulator seeded from `gapRects[0]`, cast removed, tie rule unchanged.
  - `[low]` `[reject]` blind: gapRects never checks perRow against the slots' layout — slots and perRow come from one `trayLayout` result at the caller; a consistency guard covers an undemonstrated state.
  - `[low]` `[reject]` blind: trayLayout test literals ballooned under the formatter — cosmetic; Biome's formatting, literals stay readable `toEqual` objects.
  - `[low]` `[reject]` edge-case: NaN coordinates make insertionIndex return the first rect silently — rects come from `getBoundingClientRect` and slotRects arithmetic, never NaN; undemonstrated state.
  - `[low]` `[reject]` edge-case: perRow argument differs from the slots' perRow — same root as the blind perRow row; undemonstrated state.
  - `[low]` `[reject]` edge-case: segmentEnds with perRow 0 — same root as the blind segmentEnds row; pre-existing rule, `trayLayout` perRow ≥ 1 in practice.
  - `[low]` `[defer]` verification-gap: slot/gap geometry checked only against its own constants, never the rendered tray — grouped with the blind DOM row; deferred to entry 7's Playwright drag spec.
  - `[false]` `[reject]` intent-alignment: gapRects has five parameters, not the ticket's three — a deliberate technical resolution of the ticket review log's pass 3 minor (Design Notes); entries 7/8 still own no geometry.
  - `[false]` `[reject]` intent-alignment: segmentEnds at-rest tests named AD-11 not AD-12 — the review log's pass 4 minor (layout/tray.ts rule), applied deliberately.
  - `[false]` `[reject]` intent-alignment: the destination-cards `it` names add ", block left/right" — each name starts with the id and contains the AC title verbatim (AGENTS.md naming).
  - `[low]` `[reject]` intent-alignment: reorder's D-safety is by construction — same root as the blind R-32 row.
  - `[false]` `[reject]` intent-alignment: nothing shows test:all/test:screens ran — both ran green (Implementation Notes: test:all exit 0, screens 10 passed, no baseline change).
  - `[false]` `[reject]` intent-alignment: no slotRects case where slot n is absent for lack of room — room is the caller's slotCount (ticket: "slot n only with room"); the over-capacity slotCount throw and the free-letter no-room throw are tested.
  - `[false]` `[reject]` intent-alignment: a same-index tie rule was added beyond the ticket — the ticket review log's pass 5 minor, applied as planned.
  - `[false]` `[reject]` intent-alignment: "lock" read as segment `start` — Card.svelte `lock = destination || (block && segment?.start === true)`, so start is the lock.

## Design Notes

Signature departures from the ticket (technical, review-log minors): `gapRects` takes `perRow` and `tileCount` (row breaks from the index, not slot y; the slot list holds perRow × rows slots, so `tileCount` bounds the "before p" rect and keeps rects out of empty trailing slots). "Same row" for p − 1 and p is `⌊(p − 1) / perRow⌋ === ⌊p / perRow⌋`.

Review-log minors resolved:
- Pass 3: perRow arg (applied); trayLayout tests gain `tileHeight` (applied); types `readonly Rect[]`, `GapRect`, `Parted` (applied); "rendered rows" = `trayLayout(tileCount).rows`, slotRects throws above perRow × rows (applied); parted segment classes mid-drag without Svelte state (entry 8's, not built here; `segmentEnds` JSDoc points at it); reorder out-of-range throws (applied).
- Pass 4: far-end expectation (applied, AC); reorder gaps j/j + 1 all zero (applied); origin slot collision (JSDoc on `segmentEnds`/`partingOffsets`); run/gap/from throws (applied); segmentEnds at rest named AD-11 (applied).
- Pass 5: within-index tie → earlier rect (applied); same reference (applied); block-side cases from real slotRects/gapRects (applied); row-break drag right and left cases (applied); Place D card in gapRects/reorder/partingOffsets (applied); "every rendered row the run occupies" (follows from the gapRects rule, tested by none-after-last-row and k = 7 block-left); top-aligned rects (applied); free-letter shift from first + gap (applied); caller-built `mirrorBySlot` (JSDoc); origin and dragged rect in the same viewport frame (slotRects JSDoc; the caller measures both with `getBoundingClientRect`); clipped third row before CAP-9 (known interim, entry 7's tray-band acceptance; no code here).

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npm run test:screens` -- expected: green, no baseline change.
- `npx vitest run src/ui/layout/tray.test.ts src/ui/gestures/targeting.test.ts` -- expected: green.

## Auto Run Result

**Summary:** Pure tray drag geometry for entries 7 and 8 (F3, build-notes CAP-5, CAP-6): `insertionIndex` and `reorder` in `gestures/targeting.ts`; `TrayLayout.tileHeight`, `slotRects`, `gapRects`, `partingOffsets` and `segmentEnds` in `layout/tray.ts`; `TileRows.svelte` draws D-block segments through `segmentEnds` with no visible change. No caller wiring (entries 7, 8).

**Files changed:**
- `src/ui/gestures/targeting.ts` — `GapRect`, `insertionIndex` (nearest gap-rect centre, ties lower index then earlier rect, returns the element), `reorder` (no-op reference at gaps j, j + 1; range throws).
- `src/ui/layout/tray.ts` — `tileHeight`; `slotRects`, `gapRects` (row-break pairs, none after the last row, none inside the block), `Parted`/`partingOffsets` (reorder and free-letter), `segmentEnds`; AD-12 throws on inconsistent input.
- `src/ui/tray/TileRows.svelte` — `segment(i)` delegates to `segmentEnds`.
- `src/ui/layout/tray.test.ts`, `src/ui/gestures/targeting.test.ts` — AD-11/AD-12 cases per the Acceptance list (2173 unit tests total).

**Ticket review-log minors:** all pass 3, 4 and 5 unapplied minors resolved in Design Notes: applied in code/tests, or documented in JSDoc where they are entries 7/8's (mid-drag segment classes, caller-built `mirrorBySlot`, viewport frame), or recorded as the known pre-CAP-9 interim (clipped third row).

**Review:** 23 findings (medium 1, low 14, false 8). Patched 3: medium — added block-left reorder-mode partingOffsets literals (first > 0); low — accurate block-left insertionIndex test title; low — removed the cast in `insertionIndex`. Deferred 1 (low): DOM-vs-slotRects geometry check, to entry 7's Playwright drag spec. Rejected 19, reasons in the triage log.

**Follow-up review recommended:** false (patched: high 0, medium 1, low 2).

**Verification:** `npm run test:all` exit 0 after patches (2173 unit, dist, dev e2e, pwa); `npm run test:screens` 10 passed, no baseline change; unit median 2.48 s on an ext4 worktree (< 5 s).

**For the owner (non-blocking, UX):** F3's nearest-centre rule means a tile dragged over a D block that crosses a row break can target the M gap nearest on screen rather than the block's own end of M (block left: the start of the next row, not gap 0; block right: gap 0, not gap |M|; both pinned by tests). This follows the confirmed spec; judge it in hand once entry 7 wires the drag.

**Residual risk:** geometry not yet checked against the rendered tray (deferred to entry 7); `gapRects` takes `perRow` and `tileCount` beyond the ticket's three-argument sketch (technical, Design Notes).
