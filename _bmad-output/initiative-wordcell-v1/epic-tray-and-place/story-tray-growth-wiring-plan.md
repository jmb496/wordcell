---
title: 'Tray growth wiring'
type: 'feature'
ticket: '12'
created: '2026-10-14'
status: 'built'
route: 'full'
route_source: 'auto'
baseline_revision: '59f57b31d29f8242279a618da703d16ffc0123ba'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-tray-growth-wiring.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** `layout.svelte.ts` lays the Tray band with `TRAY_ROWS = 1`, so a Tray of two or three compact rows overflows its reserved band, and the Composing/Place long fixtures do not exist.

**Approach:** The layout takes the tile count from the game view and derives `trayLayout(count, w, trayInnerWidth)` as the one value both `bands()` and the Tray read. Every move (`flip.capture()` … `flip.play()`) clears page-scroll busy first, then re-lays out in the move's update with the anchor `scrollTop` delta; restore, New game and Replay just change the derived rows. Script and add both long-word fixtures. The story file (context) is the contract.

## Boundaries & Constraints

**Always:** `TRAY_ROWS` removed; Tray tile mode and band rows read one `TrayLayout` (AD-3); a move's re-layout with a busy gate throws (rule 6, no catch); rows change only after a dispatch or a state swap, never mid-drag; no capture/FLIP/anchor scroll on restore, New game, Replay; no animation on column faces for a pure band shift; fixtures built only by `createSession` + `play` (REBUILDS) or hand-built and checked by `parseSession` and replay; tests named by id.

**Never:** engine or shell source change; new baselines; editing tickets.toml, the story or spec files; pushing; deciding game-design questions.

## I/O & Edge-Case Matrix

| Scenario | State | Expected | Error Handling |
|---|---|---|---|
| Grow | long Composing, `+` 14 → 15 | rows 2 → 3, band +48 px in the move's update, WordCell row box unchanged, no face animating | No error expected |
| Scroll-busy move | `+` 100 ms after a `scroll` | gate idle after capture, re-layout and glide at once | No error expected |
| No-op move | failed Validate or no-op dispatch within 150 ms of a scroll | gate idle, rows unchanged | No error expected |
| Busy at re-layout | forced gesture count > 0 at a row-changing move | throws to the AD-15 handler | throw |
| Swap | restore / New game / Replay | rows follow the tile count, no scrollTo | No error expected |

</intent-contract>

## Code Map

- `src/ui/layout/layout.svelte.ts` -- remove `TRAY_ROWS`; add dep `tileCount()` (+ `watchTiles(cb)`), getter `tray` (`TrayLayout`, memoised on w, count and band inputs), `heights` from the memoised `bands()` with those rows; `beginMove()` (records `scrollY`, `moving = true`) and `endMove()` (clears it; changed result → throw if `gate.busy`, `anchorScroll`, `ignoreNextScroll` + `scrollTo` if live scrollY differs, update `applied`); `watchTiles` callback re-syncs `applied.result` (no scroll) unless `moving`; relayout's `bands()` uses the current rows.
- `src/ui/layout/tray.ts` -- add pure `trayTiles(view)` (moved from Tray.svelte) and `trayTileCount(view)`.
- `src/ui/flip.ts` -- `capture()` calls `gate.scrollReset()` then `deps.layout.beginMove()` first; `play()` calls `deps.layout.endMove()` right after its `flushSync()` and before measuring; `FlipDeps.layout`.
- `src/main.ts` -- pass `layout` to `createFlip`.
- `src/ui/Board.svelte`, `Tray.svelte`, `tray/TileRows.svelte` -- pass `layout.tray` as `sizing`; TileRows drops its own `trayLayout` call; Tray uses `trayTiles`.
- `src/ui/layout/geometry.ts` (`trayGrowth`, `bands`, `anchorScroll`) -- reuse unchanged; `src/ui/gestures/gate.ts` (`scrollReset`, `busy`) unchanged.
- `src/ui/layout/layout.svelte.test.ts`, `src/ui/flip.test.ts` -- add `tileCount`/layout deps to the fake setups; new AD-11 cases per the ticket.
- `src/engine/serialize.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts`, `fixtures/session-composing-long.json`, `fixtures/session-place-long.json` -- fixtures, VALID, REBUILDS, PROPERTIES, valid-fixture list.
- `e2e/layout.spec.ts` (or new `e2e/tray-growth.spec.ts`), `e2e/helpers/` -- Playwright android at 412 × 839 and 412 × 780.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/layout/tray.ts`, `layout.svelte.ts`, `flip.ts`, `main.ts`, `Board.svelte`, `Tray.svelte`, `tray/TileRows.svelte` -- wiring per Code Map -- one rows value, move-time re-layout
- [x] `src/ui/layout/layout.svelte.test.ts`, `src/ui/flip.test.ts` -- AD-11 cases: `trayLayout` rows 0,1,1,2,2,3 for 0,1,`perRow`,`perRow`+1,14,15 and +48 px only from three rows; rows change only after an edit (call order release → `gate.leave()` → dispatch); every edit kind; swaps without capture/scroll; scroll-busy 14 → 15 (fails without `scrollReset`); no-op within 150 ms of a scroll; busy-gate throw; no face animation
- [x] fixtures + `serialize.test.ts` + architecture list -- `session-composing-long.json`, `session-place-long.json`
- [x] Playwright -- WordCell row box unchanged at both viewports (scrollTop 0 / 6 / 0), Place Confirm/Undo/Redo rows, flying cards visible, no face animating after `+`

**Acceptance Criteria:**
- Given the long Composing fixture at 412 × 839 or 412 × 780, when `+` makes 15 tiles and `−` returns, then the WordCell row's bounding box is unchanged (document scroll 0 / 6 / 0).
- Given the three-row Place fixture, when Confirm, Undo, Redo run, then rows change with the move and the WordCell row is unchanged.
- Given `npm run test:all` and `npm run test:screens`, when run, then both are green.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 28 findings — high 0, medium 3, low 17, false 6, maybe-false 2
- findings:
  - `[low]` `[reject]` blind: tile count read through `game.view` on every getter read, string memo keys — cost is a small string and one array per read; a `$derived` in the layout would add a second source for no named harm
  - `[low]` `[reject]` blind: `heights`/`tray` are getters over non-reactive memos, reactivity unproven in server-compiled Vitest — reads of `w`, `metrics`, `inputs`, `tileCount()` inside the getter are tracked; the Playwright specs pass on the real build
  - `[low]` `[reject]` blind / edge: `moving` stays true if a dispatch throws between capture and play — an engine throw is a bug that halts to the AD-15 surface (rule 6); no recovery path wanted
  - `[maybe-false]` `[reject]` blind: a deferred relayout between beginMove and endMove loses the anchor delta — capture() and play() run in one task with no gate-idle frame between, so a queued relayout cannot run there
  - `[low]` `[reject]` blind: scrollReset may drop queued scroll-idle work — it only clears the scroll-busy flags and calls `settled()`; queued work still runs in the next idle frame
  - `[false]` `[reject]` blind: busy-gate throw test is artificial — the ticket asks for a forced gesture-busy gate
  - `[low]` `[reject]` blind: growth tested only at 412 — the ticket names 412 × 839 and 412 × 780
  - `[low]` `[reject]` blind: brittle `PLUS` selector and exact float equality in e2e — the controls row has no other stable name for the arrow-less `+`; exact boxes are what the ticket specifies
  - `[low]` `[reject]` blind: plan checkboxes and notes empty at review time, fixture newlines, no `-invalid-` fixture, dead `trayInnerWidth` — process or cosmetic; `trayInnerWidth` is still read by the controller deps
  - `[low]` `[reject]` edge: a dispatch not wrapped in capture/play skips the anchor — none exists: every `game.dispatch` in src/ui goes through capture … play (ActionBar, TopBar, ControlRow, controller)
  - `[low]` `[patch]` edge: the `watchTiles` effect tracks everything `syncTiles` reads and re-runs on resize — wrapped the callback in `untrack`
  - `[low]` `[reject]` edge: `scrollReset` clears the own-write ignore flag — at worst one own scroll event makes the gate busy for 150 ms, delaying non-move work only
  - `[low]` `[reject]` edge: `endMove` uses stale `applied.innerHeight` with a relayout pending — the resize and the move would have to land in one task
  - `[medium]` `[patch]` edge / gap: the 150 ms scroll-busy e2e passes vacuously at 412 × 839 — replaced with a Confirm on session-place-long after scrolling to the bottom (asserts `scrollY` 6), skipped at 839
  - `[low]` `[reject]` edge: single-entry tray memo thrashes when relayout computes the next width — equal contents, one extra object; no consumer keys on identity beyond a render
  - `[low]` `[reject]` edge: shrink test relies on fake scroll clamping — the real clamp is covered by the Playwright shrink at 780
  - `[maybe-false]` `[reject]` edge: rows could change mid-drag by an external dispatch — no such dispatch exists; the busy throw guards the move path
  - `[medium]` `[patch]` gap: real `$effect` swap path untested — added a Playwright restore case (session-place-long, 15 → 0 tiles on Confirm); New game and Replay are reachable only at game over with no tiles, so the effect itself is covered only by unit fakes (residual risk)
  - `[medium]` `[patch]` gap: scroll-busy e2e vacuous at 839 — same fix as above, plus a unit case through a real flip over the real layout and gate (busy before capture, idle after, throws without scrollReset)
  - `[low]` `[reject]` gap: the call-order spy release → leave → dispatch is missing — existing controller tests (F17 capture-first, gate count 0 at dispatch) cover it
  - `[low]` `[reject]` intent: rows derived, never "set in an update" — reading A (derived) is the stronger guarantee: no frame can pair new tiles with old rows
  - `[false]` `[reject]` intent: real flip ↔ layout ↔ game.view wiring only in e2e — the new unit case now uses a real flip over the real layout
  - `[false]` `[reject]` intent: no drop, free-letter add or removal e2e — those edits are tile-count changes through the same bracket; the e2e covers `+`, `−`, Confirm, Undo, Redo
  - `[low]` `[reject]` intent: "flying cards visible" is a proxy — checks no animating WordCell face has a hidden parent, which is what the ticket's visibility phrase means
  - `[false]` `[reject]` intent: verify commands unevidenced — `npm run test:all` and `npm run test:screens` ran green
  - `[false]` `[reject]` gap: no-op dispatch gate idle only at the bracket — added a unit case with a real gate
  - `[false]` `[reject]` intent: C reading (w recompute on a move) — excluded by the ticket
  - `[low]` `[reject]` blind: long Place fixture uses a 15-letter non-word with an inline dictionary — no real 15-letter word fits the valid-fixture needs, and the loader does not re-check membership; recorded as a residual risk for the owner


## Design Notes

Why derived: tile count and rows must flip in one render; a swap needs no hook. `endMove` runs after the move's `flushSync` so the DOM holds the new band heights before the anchor write; `scrollY` is read at `capture()` (a shrink clamps the browser's scroll before `endMove`).

## Verification

**Commands:**
- `npm run test:all` -- expected: all green.
- `npm run test:screens` (Docker) -- expected: green, no new baselines.

## Auto Run Result

**Summary:** The layout now derives the Tray sizing (`trayLayout` of the game view's tile count) that both `bands()` and the Tray read; `TRAY_ROWS` is gone. `flip.capture()` clears scroll-busy and opens a move, `flip.play()` closes it after its flush with the anchor `scrollTop` delta (a busy gate throws); restore/New game/Replay only re-sync. Two long-word fixtures and an android Playwright spec were added.

**Files changed:** `src/ui/layout/layout.svelte.ts` (tray, beginMove/endMove, watchTiles), `src/ui/layout/tray.ts` (`trayTiles`, `trayTileCount`), `src/ui/flip.ts`, `src/main.ts`, `src/ui/Board.svelte`, `Tray.svelte`, `tray/TileRows.svelte`; tests `layout.svelte.test.ts`, `flip.test.ts`, `serialize.test.ts`, `architecture-ad2-ad12-ad17.test.ts`; fixtures `session-composing-long.json`, `session-place-long.json`; `e2e/tray-growth.spec.ts`.

**Review:** 28 findings; patches applied: 1 low (untrack) and 3 medium entries (e2e scroll-busy vacuity, swap test, flip+layout unit case); 0 deferred; the rest rejected with reasons in the triage log. Patched counts: high 0, medium 3, low 1. Follow-up review recommended: false (no high, three medium were test-coverage patches).

**Verification:** `npm run test:all` green after the patches (unit 2335, e2e:dist 14, e2e 525 passed, pwa 12; build in budget); `npm run test:screens` 10/10 green with no new baselines.

**Residual risks:** `session-place-long.json` uses a 15-letter non-word with an inline dictionary (no real 15-letter word available); the `$effect` swap path (`watchTiles`) is covered only by unit fakes since New game/Replay appear only at game over; the anchor `scrollTop` write during an Android fling is unverified (epic 7 device checks).
- `fixtures/session-place-long.json` is a 15-letter non-word, valid only under the inline test dictionary and not reachable by real play.
