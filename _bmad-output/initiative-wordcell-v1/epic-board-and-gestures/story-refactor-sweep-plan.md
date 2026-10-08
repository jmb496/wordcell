---
title: 'Refactor sweep'
type: 'refactor'
ticket: '13'
created: '2026-10-07'
status: built
baseline_revision: '3014424bc706e31eb5f9249b0c5e52aa49754a2b'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-refactor-sweep.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
warnings: ['oversized', 'multiple-goals']
deferred:
  - summary: >-
      D10 — 4-11 minors 1–3 (long still press on the view scrim, wheel over the scrim scrolls the board, view wider than the screen below ~320 px); 4-4 safe-area change without resize and the <384 px desktop height rule.
    evidence: |-
      Ticket 4.13 row D10 (Out). Sources 4-11-build.md, story-live-layout-gate-and-touch-action-regions-plan.md deferred, digest. Home: epic 7 device pass.
  - summary: >-
      D11 — unkeyed `{#each}` in Column.svelte:82 and WordCellRow.svelte:53 before FLIP; QU tray-tile badge overlap in a D-block.
    evidence: |-
      Ticket row D11 (Out), 4-3-build.md minors 3–4. Home: epic 5 (Tray and Place, FLIP).
  - summary: >-
      D12 — ActionBar 14 px shrink-before-ellipsis (unreachable with today's catalogue).
    evidence: |-
      Ticket row D12 (Out), 4-2-build.md minor 1. Home: epic 5 (Validate states).
  - summary: >-
      D13 — 4.6 F30 desktop scrollbar strip.
    evidence: |-
      Ticket row D13 (Out): owner decision, not reopened. Home: none (closed by the owner).
  - summary: >-
      D14 — WordCell count badge at 1 and 2 cards untested since 4.2 (WordCellRow.svelte:63 shows it at 2+).
    evidence: |-
      Ticket row D14 (Out). No valid fixture reaches 1 or 2 cards in a cell: it needs a Session whose later move takes a cell's cards as free letters into a different cell (R-31/R-33-valid). Home (review-log pass 4: a building home, not the retrospective): epic 5 (Tray and Place), the first epic that builds free-letter takes from cells in the UI and scripts such fixtures.
  - summary: >-
      D17 — a release ≥ 8 px from the press with no pointermove classifies as a tap.
    evidence: |-
      Ticket row D17 (Out), 4-8-build.md pass 2. Fixing it changes an exported classify type and needs a selection outcome. Home: epic 7 device pass.
  - summary: >-
      D19 (part) — compact tray (8+ tiles, two clipped rows, QU compact tile) unchecked in a browser.
    evidence: |-
      Ticket row D19, compact-tray half Out. Source story-composing-place-and-static-tray-rendering-plan.md deferred. Home: epic 5 (Tray and Place).
  - summary: >-
      D20 (part) — stale hover under a still mouse after a layout shift; on-device long-press contextmenu suppression; untested Banner Reload full-reload path (AD-13 launch rewind).
    evidence: |-
      Ticket row D20 Out half. Sources 4-7-build.md Result, story-tap-select-…-plan.md Residual risks, story-pointer-controller-…-plan.md deferred. Home: epic 7 device pass.
  - summary: >-
      D20 (part, pass-7 minor) — main.ts controller-registration order has no test.
    evidence: |-
      Source: story-pointer-controller-core-and-cancel-wiring-plan.md deferred (4.6); 4.9 covers drops only. Home: epic 7 device pass. (Review-log pass 7 noted the ticket's D20 Item/Source cells omit it; recorded here instead.)
  - summary: >-
      D20 (part, pass-7 minor) — key-command Undo/Redo under a view (a deselect under a view above a selection).
    evidence: |-
      No build log names it; it was added by ticket review pass 6 when D20 was widened (story-refactor-sweep.review-log.md, pass 6 minor 7). Unreachable today: no key commands exist (epic 6) and `.board` is inert under a view (Board.svelte:78). Home: epic 6 (keyboard).
  - summary: >-
      D18 (part) — lost end of an uncaptured press (`captured: null`) with a new pointerId keeps today's same-id-only recovery.
    evidence: |-
      Ticket row D18. Home: epic 7 device pass.
  - summary: >-
      Residual (review-log pass 3) — 4.9 Android pointercancel-before-back: unverified whether Android fires pointercancel before back on an edge swipe, or before visibilitychange on an app switch mid-touch; restore proven only with synthetic events.
    evidence: |-
      story-drag-interruptions-selection-replacement-hide-back-and-cance.md:53 and its plan :240. Home: epic 7 device pass.
  - summary: >-
      Residual (review-log pass 3) — 4.3 ghost-fill owner glance: ghosts have no fill (DESIGN), so a live card under an S ghost shows through and stacked ghost outlines overlap.
    evidence: |-
      story-composing-place-and-static-tray-rendering-plan.md:114, :202. Home: owner glance at the Composing/Place baselines at the epic 4 retrospective (a look, not a build item).
  - summary: >-
      Residual (review-log pass 3) — 4.3 D-block seam: non-end D-block tile faces overlap the next by 1 px so fractional DPR leaves no seam; checked only in container baselines.
    evidence: |-
      story-composing-place-and-static-tray-rendering-plan.md:110, :203. Home: epic 7 device pass (real fractional-DPR screens).
  - summary: >-
      Close-out note for the retrospective: build-notes.md:333 (CAP notes) still says "unclipped rendered rects per AD-12", superseded by F34 (D7); the AD-12 F34 close-out bullet already exists at build-notes.md:49.
    evidence: |-
      Close-out doc edits are Out of scope (ticket). Home: epic 4 retrospective.
  - summary: >-
      AGENTS.md (lines 38, 48, 71, 81, 84) and the spine (79, 693-695, 886, 925, 956, 968) still name `src/architecture.test.ts`, deleted by the split.
    evidence: |-
      Review pass 2026-10-07 (blind hunter). The split replaced it with src/architecture-tree-scan.test.ts, src/architecture-ad1.test.ts, src/architecture-ad2-ad12-ad17.test.ts and src/architecture-scan.ts; the build may not edit AGENTS.md or the spine. Home: bmad-project-context refresh and the spine close-out at the epic 4 retrospective.
    location: >-
      AGENTS.md:38
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Epic 4 closes with the epic 3 carry-ins (R6 duplicated store code, R7 history tests in the game test file), the AD-17 unit-suite budget (measured 5.25 s warm median at HEAD 3014424, over 5.00 s), and the deferred inventory D1–D20 of ticket 4.13 still open, including two flaky Playwright tests (D1, D4) and the owner's F34 decision (D7: only the visible band of a column is a drop target).

**Approach:** Implement ticket 4.13 (`story-refactor-sweep.md`, the binding contract: Description bullets, Deferred inventory dispositions, AC) in the order of Tasks below, then re-measure and split `src/architecture.test.ts` if the median is 5.00 s or more. Each review-log leftover is resolved in Design Notes §Leftovers. Any ticket owner stop is recorded in Implementation Notes and the work otherwise finished.

## Boundaries & Constraints

**Always:** R6 changes no behaviour and no error text. Every existing test stays unedited except imports, R7 file location, split moves (imports, `SELF`, the tree-scan name's "this one" wording) and edits mapped to an inventory row. Production edits are D6, D7, D9 4-6 minor 3 and the 4-7 tile click path, and D18 only if reachable; each has a Vitest. Test names carry ids (AGENTS.md Conventions). AGENTS.md rules 1–7 and Known pitfalls apply: no `history` binding in stored-key.ts, no `localStorage` token, stored-key.ts never imports `./storage` or any shell store.

**Never:** Edit ticket files, AGENTS.md, the spine, EXPERIENCE.md, DESIGN.md or build-notes.md (close-out is at the retrospective; plan text edits only for D5, D6, D9). No export change outside `src/shell/`, other than the e2e/helpers module, the split files and `src/architecture-scan.ts`. No `src/engine/` change. No speed-up other than the architecture split. Do not widen the D1 150 ms / 100 ms windows. Do not commit or push (the orchestrator commits).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| D7 drag over top bar | board scrolled so column n lies under the sticky top bar; tail held over the bar | column n not highlighted; release flies back; Session unchanged | none |
| D7 partial visibility | column partly under the bar; face overlaps its visible part ≥ 25 % | column highlights, drop lands | none |
| D7 banner shown | banner visible below the top bar | band top = banner bottom | none |
| D6 replaced cell | hover timer armed on cell 5, its element replaced, pointerout from the new element | timer for cell 5 stops | none |
| D6 shared edge | point exactly on the 6/7 shared edge in suppress() | resolves to cell 7 (half-open rects) | none |
| D9 4-6 m3 | same-id pointerdown with `button !== 0` during a live press | `end({kind:'sameId'})` runs, then the button check returns | none |
| D9 4-7 tile click | keyboard/no-pointer `click` (detail 0) on a tray tile while a selection is held | treated as outside: selection cleared as for `outside` | none |
| D18 dead press | captured press whose element is disconnected or lost capture; pointerdown with a new pointerId | `end({kind:'sameId'})` for the dead press, then the new press resolves and starts | a live captured press: the new pointer stays ignored (CAP-4) |
| R6 guards | history `reset()` / prefs setter while `halted` or `booting`; `loaded()` before `load()`; second `load()` | throws the exact pre-refactor message | fail fast (rule 6) |

</intent-contract>

## Code Map

- `src/shell/game.svelte.ts` -- `RejectReason` :37-41, `rejectReason` :99-103, `sessionText` :89-90 (assigned :111 :128 :133 :175 :197 :255), `isStale` :229-231, `launch` :87, `'AD-4 load() called twice'` :108 (halted branch only), `loaded()` :298 throws `` `AD-17 loaded() while ${state.kind}` ``. Its AD-4/AD-16 kind checks (:120 :146 :203 :210 :220 :265 :267 :290) stay.
- `src/shell/history.svelte.ts` -- `HistoryRejectReason` :24-28, `rejectReason` :58-62, `lastText` :45 (Q-39 rollback `prevText` :93/:104), `isStale` :119-121, `launch` :46, `'AD-6 load() called twice'` :65, `'AD-17 history loaded() before load()'` :124, `reset` guard :110-111 `` `AD-15 reset() while ${kind}` ``.
- `src/shell/prefs.svelte.ts` -- `ParsePrefsResult` :172-179, hand-written `PrefsRejectReason` :182-184, `rejectReason` :241-245, `lastText` :238, `isStale` :305-307, `'AD-10 load() called twice'` :255, `'AD-17 prefs loaded() before load()'` :310, setter guard :285-286 `` `AD-15 ${setter}() while ${kind}` ``.
- `src/engine/serialize.ts` :19-36 -- `ParseSessionResult`, `ParseHistoryResult` (read only). Exported names `RejectReason`, `HistoryRejectReason`, `PrefsRejectReason` are used by `src/ui/App.svelte:2`, `HistoryNotice.svelte:2`, `history-notice.svelte.ts:6`; keep them.
- `src/shell/game.svelte.test.ts` -- blocks: 'game store' 214-444, 'newGame() and replay()' 446-583, 'feedback' 585-647, 'halt' 649-777, 'lifecycle' 779-1195 (stay); 'score history store' 1197-1593 (moves). Shared `afterEach` :210-212. History-only: fixtures `historyNull`, `historyRecordsNotArray`, `historyVersionUnknown`, `threeRecords`; engine `parseHistory`, `serializeHistory`, `statistics`; `const HISTORY` :34. Shared (copy): `KEY`, `EMPTY`, `DEFAULT_PREFS`, `UNDO`, `REDO`, `fakeStorage`, `fakeStyle`, `setup`, `Options`, `FakeStorage`, `active`, `sessionOf`, fixtures `gaveUp`, `invalidNull`, `place`, `won`, `type Command`. Lifecycle :957 uses `env.scoreHistory.isStale()` (stays). The history block uses `fire`, `storageEvent`, `storage.control.fail`; not `seed`, `clock`, `time`, `queries`, `loadPrefs` (copied `setup` may drop the seed branch and `FAIL_SETS`). Precedent: `prefs.svelte.test.ts` keeps its own copy of setup.
- `src/ui/gestures/controller.ts` -- `resolve()` :232 (scrim/sheet before `data-place` :236-241), `hoverTimer {handle, cellEl}` :296, `end()` :~305-335 (peek close for non-`up` :318; `flies` :329-334), `flyBack` :378, AD-12 fly-back throw :412-414, `dragMove` :520-543 (maps `columnTargets()` to rects at :529), pointerdown :~575-590 (other-id return :581, button check :579, same-id recovery :580-588), `lostpointercapture` :728, F25 detail-0 click path :741 (accepts only `hit.kind === 'outside'`), `stopHoverTimer` :801, `suppress()` :820-831 (closed rect :826), `hoverEnter` :843-854 (early returns :849-851 before `stopHoverTimer` :852), `onHoverTimer` :856, `hoverLeave` :874 (`cellEl` compare), `attach` subscribes `watchHoverFine` :926. `Press.captured` :162. Header comment: add an "Entry 13" paragraph.
- `src/ui/gestures/targeting.ts` :28-60 -- `pickTarget`, 25 % minimum, zero-area candidate yields 0 (reuse, no change). `targeting.test.ts` :50-56 `uneven` case.
- Bars: `[data-band="topBar"]` (TopBar.svelte:26, sticky top 0), `[data-band="banner"]` (Board.svelte:58, wrapper always rendered, content only when `layout.bannerShown`), `[data-band="actionBar"]` (ActionBar.svelte:59, sticky bottom 0); all inside the attach root. Grid `.track`/`.spacer` also carry `data-band` for non-bar ids, so select the bar ids exactly.
- `src/ui/gestures/controller.test.ts` -- `FakeEl` :115-239 (`captures`, `hasPointerCapture`, no `isConnected`), `board()` :273-377 (comment :272; top bar has no rect :296; `getBoundingClientRect` throws without one :167), `setup()` :381-519, press-target tests :569-607, slot test :776-785, D16 peek-on-sameId test :789/:798/:818, fly-back durations :1557 :1584 :1597-1615, view-above-selection tests :1034-1101, `:1051` cancel under a view.
- `src/ui/gestures/gate.ts` :54 :93-98 :108 -- `SCROLL_QUIET_MS = 150`; no change planned (D1 is a test fix).
- `src/ui/overlays.svelte.ts` :101-106 (`deselect` throws unless `tailSelection` on top), :118-138. `overlays.svelte.test.ts` :586-615 (D2), :617 (4-5 minor 1 name).
- `e2e/layout.spec.ts` -- recorders :130-158, `panThroughFailure` :179-237 (wall-clock 300 ms loop :225, `waitForTimeout(35)` :211, gap assert :231), "applied after it ends" :250-270, "after a hide" :272-305, local `openFixture` :33 (no `booted`), `rect` :41. Clock precedent: `e2e/blocking.spec.ts:57-69`, `openPaused` `e2e/wordcell-view.spec.ts:527`. `e2e/helpers/lifecycle.ts:18` `hidePage`, `animationFrames`; `e2e/helpers/touch.ts:80+` `touchHold`.
- `e2e/drag-interruptions.spec.ts` :699-731 (D4; `pauseNear` :559-566, `cancelCaptured` :550, loop :715-719).
- D8 copies: board :7/:14, board-phases :16/:24, column-phases :24-44 :122, drag :23-42 :66, drag-interruptions :29-52 :129 (prefs arg; `stashSession` returns void), layout :33/:41, pointer :10 :17 :33, tap :25-42 :114, wordcell-view :24 :37 :527 :537. Existing helper modules listed in `e2e/helpers/`; tests in `e2e/helpers.spec.ts` (one describe per module, names `AD-17 …`, a negative case each).
- `e2e/drag.spec.ts` :364-431 whole-column drag (D19; `placeholder` helper :33, pattern :607), :428 arrangement slice, :534 Q-34 sub-25 % name. `e2e/tap.spec.ts` :506 stacking. `e2e/wordcell-view.spec.ts` :698 R-65 `?bands=` name. `e2e/board.spec.ts` :23-50, :65-73, :119-121, :157-169; `e2e/board-phases.spec.ts` :74-82 `State`, :201 loop, :277-283 `expectTarget`, :302, :314-321 `ring()`; `e2e/smoke.spec.ts` :87-93.
- `src/ui/layout/geometry.test.ts` :27-37 :215-226 :308-316 :343+; `bands.test.ts` :62, :78-86; `src/ui/text.test.ts` :30-40.
- `src/architecture.test.ts` (2182 lines) -- shared machinery :1-651 (types/regex :16-52, scanner :54-524, `check` :525-606, fixture scaffolding `run`/`Case` :607-651); describes: AD-1 fixture blocks 653-1852 (15 blocks), AD-1 tree scan 1869-1883 (`ROOT`, `SELF` :1857, `walk` :1856-1867), AD-1 engine tsconfig 1887-1927, AD-17 fixtures 1931-1952, AD-2 exports 1956-2034, AD-12 helpers 2042-2120 + act() scan 2121-2182. `tsconfig.app.json:21` exclude, `tsconfig.arch.json` `files`; `package.json` `check` runs `tsc -p tsconfig.arch.json`. Vitest config: `vite.config.ts` :52-59 (include `src/**/*.test.ts`).
- Plans to edit: `story-desktop-hover-peek-plan.md` (D5, D6 sharpening 3), `story-pointer-controller-core-and-cancel-wiring-plan.md` (4-6 minor 1), `story-tap-select-foot-pads-and-tap-drop-plan.md` / `story-drag-overlap-targeting-and-drop-into-composing-plan.md` (4-8 R-14 list, Residual-risks line :232), `story-drag-interruptions-…-cance-plan.md` (4-9 mapping, 4-9-f32 superseded note). Confirm each file by grep before editing.

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/stored-key.ts` (new) -- R6 per Design Notes §R6 API; then refactor the three stores to use it with identical messages; `PrefsRejectReason = RejectReasonOf<ParsePrefsResult>`; `RejectReason`/`HistoryRejectReason` become `RejectReasonOf<…>` under the same names -- retro R6.
- [x] `src/shell/history.svelte.test.ts` (new) + `game.svelte.test.ts` -- R7: move the whole 'score history store' block byte-identical except imports; copy shared helpers; move history-only imports; delete leftovers unused in each file (list them in Implementation Notes) -- retro R7.
- [x] `src/ui/gestures/controller.ts` + `controller.test.ts` -- D3, D6, D7, D9 (4-6 minors 2–3, 4-7 tile click, 4-8 fly-back kinds, 4-9-build controller items, 4-9-f32 S case and reduced-motion variant if a controller Vitest; comment reflow), D16 (confirm, record), D18, D20 (confirm unreachable, record) per Design Notes.
- [x] `src/ui/gestures/targeting.test.ts` -- D9 4-8 tie-break case (horizontally nearer, vertically farther).
- [x] `src/ui/overlays.svelte.test.ts` -- D2 per the 4-5 log fix; D9 4-5 minor 1 rename.
- [x] `src/ui/layout/geometry.test.ts`, `bands.test.ts`, `src/ui/text.test.ts` -- D9 4-1 minors 1, 2, 4, 5, 7, 8; 4-2 minor 7.
- [x] `src/architecture.test.ts` -- D9 4-1 minor 6: new `describe('AD-11 layout modules are pure')` scanning `src/ui/layout/bands.ts` and `geometry.ts` for AD-1 forbidden tokens, `import.meta` and `'svelte'`.
- [x] `e2e/helpers/board.ts` (new) + `e2e/helpers.spec.ts` -- D8 per Design Notes §D8.
- [x] `e2e/layout.spec.ts` -- D1 per Design Notes §D1.
- [x] `e2e/drag-interruptions.spec.ts` -- D4 (pause all three faces in one `page.evaluate` right after `cancelCaptured`, then read boxes); D9 4-9/4-9-f32 e2e items.
- [x] `e2e/drag.spec.ts`, `tap.spec.ts`, `board.spec.ts`, `board-phases.spec.ts`, `smoke.spec.ts`, `wordcell-view.spec.ts`, `layout.spec.ts` (4-4 minor 2) -- D9 e2e minors per Design Notes §D9; D19 assertion `expect(await css(placeholder(page, 5), 'visibility')).toBe('hidden')` after `expectDrop` at drag.spec.ts:423; D6 sharpenings 1, 2, 4; D7 android case.
- [x] Done tickets' plans (Code Map list) -- D5 (hover-peek plan names the controller's `watchHoverFine` and its Vitests, not App.svelte, as the hoverFine watcher), D6 sharpening 3 (explicit R-65 sentence → test list), D9 plan items. Never edit ticket files.
- [x] Re-measure, then split if needed -- Design Notes §Re-measure and §Split.
- [x] `npm run test:screens` -- D15; Docker is reachable (29.8.0 at planning). If `npm run test:screens` cannot mount from WSL, use `docker.exe` with the `D:\CodeProjects\wordcell` mount as 4.6 did. Record the outcome.
- [x] This plan -- Implementation Notes: every change mapped to its row; per-row status ("already resolved by 4.x", "unreachable because…", skip reasons); helper leftovers; timings; AGENTS.md Where-things-are additions for a bmad-project-context refresh (`src/shell/stored-key.ts`; `src/ui/layout/`; `src/ui/gestures/`; `src/ui/act.ts`; the split files and `src/architecture-scan.ts` if split, with the AGENTS.md lines 38, 48, 71, 81, 84 and spine lines 79, 693-695, 886, 925, 956, 968 that name `src/architecture.test.ts`); any owner stop.

**Acceptance Criteria:**
- Given the refactored stores, when `npm test` runs, then every pre-existing shell test passes unedited except imports and R7's location, and `game.svelte.test.ts` contains game-store describes only.
- Given a scrolled android board with column n under the top bar, when a held tail is over the bar and released, then column n never lights and the stored Session is byte-identical (Playwright `android`, named `AD-12 F34 …`).
- Given the full suite under load, when `npm run test:e2e` runs five consecutive times after the last src/ or e2e/ edit, then all five are green per the D1 counting rule (Design Notes §D1), recorded with dates.
- Given all in-scope changes, when the unit suite is re-measured, then the plan records the median, the watch re-run and both methods, and the median is under 5.00 s or the owner stop is recorded.
- Given Docker is reachable, when `npm run test:screens` runs in the container, then it is green with no baseline change, or the diff is recorded as an owner stop.
- Given the inventory, when the plan is read, then each row D1–D20 has a status line and every diff hunk maps to a row, R6, R7 or the split.

## Implementation Notes

**Owner answer 2026-10-07 (SPEC F35):** the 5.62 s median is accepted for now; plan moved to `built`; the 5 s budget is for the retrospective.

**Owner stop (AD-17 Speed, CAP-10):** the warm unit median is 5.36 s before the split and 5.47 s after it (≥ 5.00 s both times); the split is done and kept, the plan is not moved to `built`. Every other task is finished. The critical path is `src/ui/gestures/controller.test.ts` (one file, 3.5–4.0 s), which the only permitted speed-up (the architecture split) cannot shorten. Evidence below (§Timings). For comparison only: the same tree on the Linux filesystem (`~/wordcell-watch`) ran the full suite in 3.14 s cold / 2.38 s in watch.

No other owner stop: D1/D4 green in every run, no test failed twice (no test failed at all), D18 and D20 unreachable, screenshots green with no baseline change.

### R6 — `src/shell/stored-key.ts` (new)
- API as Design Notes §R6: `RejectReasonOf<R>` (distributive), `rejectReason(parsed)` (one internal cast, as `F & { version }`, since the generic constraint has no `version`), `trackLastText()` → `{ remember, isStale, text }`, `launchSnapshot<T>()` → `{ assertUnset(twice), set, get(early) }` (unset = `undefined`, `null` a value), `assertWritable(kind, op)`. No imports at all; no `history` binding; no `localStorage` token.
- `game.svelte.ts`: `RejectReason = RejectReasonOf<ParseSessionResult>`; `rejectReason`, `lastText` tracker (`sessionText` call sites), `launch` snapshot; `assertUnset('AD-4 load() called twice')` in the halted branch only, `loaded()` is `launch.get(() => \`AD-17 loaded() while ${state.kind}\`)` (lazy). AD-4/AD-16 kind checks untouched; no AD-15 guard.
- `history.svelte.ts`: `HistoryRejectReason = RejectReasonOf<ParseHistoryResult>`; tracker (`text()` feeds the Q-39 rollback `prevText`), snapshot (`'AD-6 load() called twice'`, `'AD-17 history loaded() before load()'`), `assertWritable(game.state.kind, 'reset')`.
- `prefs.svelte.ts`: `PrefsRejectReason = RejectReasonOf<ParsePrefsResult>` (hand-written type removed), tracker, snapshot (`'AD-10 …'`, `'AD-17 prefs loaded() before load()'`), `assertWritable(kind, setter)`.
- The 16 error texts grep-identical before/after; every shell test unedited (208 shell tests before and after).
- Review fix: three new tests pin the messages now passed through stored-key.ts that no existing test asserted exactly: `AD-4 a second load() after a halt before load throws "AD-4 load() called twice"` and `AD-17 loaded() before load() throws "AD-17 loaded() while booting"` (`game.svelte.test.ts`, describe `game store R6 guard messages`), `AD-17 history loaded() before load() throws "AD-17 history loaded() before load()"` (`history.svelte.test.ts`, describe `score history store R6 guard messages`).

### R7 — `src/shell/history.svelte.test.ts` (new)
- `describe('score history store')` moved byte-identical (checked with `diff`); `game.svelte.test.ts` now holds game-store describes only (89 tests; history file 31).
- Copied (shared) into the history file: `KEY`, `HISTORY`, `PREFS`, `EMPTY`, `DEFAULT_PREFS`, `UNDO`, `REDO`, `Options`, `FakeStorage`, `fakeStorage`, `fakeStyle`, `setup`, `active`, `sessionOf`, the shared `afterEach`; fixtures `gaveUp`, `invalidNull`, `place`, `won`; `type Command`, `type Session`. `setup` copied whole: the block calls `setup({ seed: 7 })`, so the seed branch stays (Code Map said it "may" drop it); its unused return fields (`clock`, `time`, `queries`) and `loadPrefs` stay so the copy matches.
- Moved (history-only): fixtures `historyNull`, `historyRecordsNotArray`, `historyVersionUnknown`, `threeRecords`; engine `parseHistory`, `serializeHistory`, `statistics`.
- Leftovers deleted from the copy: `FAIL_SETS`, `NO_OP`, `VALIDATE`, `freshShape`, `parsed` (and the game-only imports). Nothing left unused in `game.svelte.test.ts` (`HISTORY` stays: `fakeStorage` uses it).

### Controller (`src/ui/gestures/controller.ts`, `controller.test.ts`)
- Header: Entry 9 paragraph reflowed (4-9-f32); new "Entry 13" paragraph.
- **D7 (F34), production:** `dragMove` reads the band once per move (`visibleBand()`: top = max(topBar.bottom, banner.bottom), bottom = actionBar.top, bars by exact `[data-band="…"]` under the root; a missing bar throws, rule 6) and clips every candidate rect (source included) with `clip()`; an empty clip is zero-area (`pickTarget` gives it 0). One refinement, recorded: the always-rendered banner wrapper counts only while it has height (shown); with a hidden banner the top is the top bar's bottom. In the default order this equals the plan's formula; it keeps a hidden banner placed lower by a dev `?bands=` order from clipping the board. Vitest `AD-12 F34 a hidden (zero-height) banner below the top bar clips nothing` (fails with the plan's literal `max(topBar.bottom, banner.bottom)`). Fixture `board()` gains `topBar`/`banner`/`actionBar` rects (defaults clip nothing). Vitests (`AD-12 F34 …` describe): column wholly under the top bar not lit, release flies back, no dispatch; column under the action bar not lit, visible part lit; partly hidden column lit only at ≥ 25 % of its visible part (and dropped there); shown banner moves the band top; missing bar throws. Playwright: `e2e/drag.spec.ts` "android, scrolled board" › `AD-12 F34 a tail held over the top bar never lights the column under it; the release flies back and the stored Session is byte-identical` (412 × 600, scrolled to the end; premise asserts column 3's rect starts above 0 and the face overlaps it ≥ 25 % unclipped). Each Vitest and the Playwright case fail against HEAD's controller (checked by swapping the file back).
- **D6, production:** `hoverTimer` is `{ handle, cell: number }`; `hoverLeave` compares the cell number; `hoverEnter` calls `stopHoverTimer()` right after a real cell entry, before its no-arm returns; `suppress()` uses half-open rects. Vitests: `AD-12 the hover timer is keyed by cell number: a pointerout from a replaced cell node, or an entry into an empty cell, stops it`; `AD-12 the suppression slot uses half-open rects: a last point on the shared 3/4 edge suppresses cell 4, not cell 3` (the fixture's shared edge is 3/4; same rule as 6/7).
- **D9 4-6 m3, production:** a same-id pointerdown ends the lost press (`end({ kind: 'sameId' })`, peek flush kept) before the button check; then `button !== 0` or another pointer's live press returns. Vitest `AD-12 CAP-4 a same-id pointerdown with button !== 0 during a live press ends it (sameId) before the button check returns`.
- **D9 4-7 tile click, production:** the F25 detail-0 `click` accepts `tile` like `outside`; the existing test extended and renamed `AD-12 F25 a click with detail 0 resolving outside or on a tray tile deselects; detail 1 and a column target do nothing`.
- **D3:** at HEAD the press-target tests (:569-607) asserted capture only, never the resolved `PressTarget`. New describe `AD-12 resolved press target`: per-kind outcome test (column tap selects; non-empty WordCell long-press peeks; empty one opens nothing; other tap deselects); `… WordCell emptiness comes from the GameView, not the DOM …`; `… a WordCell press on a cell missing from the GameView, or with no GameView, throws` (existing messages).
- **D9 4-6 m2:** `AD-12 the slot clears on that pointer’s next uncaptured press` asserts contextmenu not prevented right after `t.down(t.b.foot1)`; new pointercancel-ended variant (describe `AD-12 contextmenu slot, pointercancel-ended`).
- **D9 4-8:** `durations.kinds` `['flyBack']` asserted in the three platform-end fly-back cases.
- **D9 4-9-build:** `deselecting` row now `release over a registered column below the overlap minimum` (face 10 / 60 over registered column 2); `replacing()` asserts the selection unchanged and `navCalls` empty mid-drag.
- **D9 4-9-f32:** `AD-12 F33 a dragged stack that is a proper subset of a two-card selection keeps the lift and flies back to its lifted slot` (`liftedDrag('card1b', false, 2)`). The reduced-motion variant of the F33 bigger-stack P4 is a Playwright case (below).
- **D16:** resolved at HEAD (4.11); asserted by `AD-12 peek on end: cancel(), cancel({ byBack: true }), pointercancel, lostpointercapture, a same-id pointerdown and detach close the peek, never sticky, no nav call` (its same-id ender). No change.
- **D18:** repro Vitest `AD-12 CAP-4 a captured press whose capture vanished with no lostpointercapture keeps ignoring a new pointerId until its own end` (documents current behaviour). **Unreachable:** a captured element that loses capture while connected fires `lostpointercapture` at itself (bubbles to the root, ends the press); only a disconnected one fires it at the document. No store change replaces a captured element during a held press: column/cell/tray `{#each}` blocks are keyed (`Column.svelte:82` by CardId, `WordCellRow.svelte:28/53`, `Tray.svelte:60`), the GameView changes only through `dispatch` (controller ends, or `act()` which cancels first), layout changes and the banner wait on the gate the press holds, the history notice opens only at boot/New game (act), the sticky view opens at a press end and a peek only overlays, hide runs `cancel()` first, and a halt (storage event, pageshow) unmounts the Board, whose detach cancels. No production change, `FakeEl` not extended.
- **D20:** all listed paths unreachable since 4.11, no change: a replacing drag's plain `cancel()` under a view — the scrim (`WordCellView.svelte:61`, fixed, inset 0, z 10) resolves before `data-place` (`resolve()` scrim/sheet checks first), so no card press starts under a view, and a view opens only at a press end; WordCell tap — resolves to scrim/sheet, and `pointerup` closes the view without `perform` (`controller.ts` sheet/scrim branch); Undo, Redo and banner Reload — inside `.board`, inert while `viewCell !== null` (`Board.svelte:78`), and a held peek's scrim covers them. Existing tests: `AD-13 entry 11 view above a selection` (:1034-1101 at HEAD), incl. the cancel-under-a-view case (:1051).

### Other unit tests (test-only)
- **D2:** `overlays.svelte.test.ts` "a modal on top of a view" step: `openView(6)`, `open('historyNotice')` (no `closedByBack(0)`), `openDeferred(token)` throws `/^AD-13 /`, view 6, depth 2, top `historyNotice`, end sheet hidden, no new nav calls, token still live (opens after closing notice and view); comment fixed. 4-5 m1: "a hover peek" dropped from the reset test name.
- **D9 4-1:** m1 `after.total` 830, range 0/50; m2 sum check in `layout()` and `three.heights.tray` 224; m4 `AD-11 banner exactly absorbed at the boundary: 412 × 782`; m5 `AD-11 F21 innerHeight-only change with the slack below the anchor`; m7 `bands.test.ts` constructor `=== Error`; m8 `AD-11 cardWidth exact fit with fractional insets: 412 × 734.3 with {0.1, 0.2} is 44` (also 734.29 → 43); m6 `describe('AD-11 layout modules are pure')` (reuses the AD-1 stripper and token regexes, adds `import.meta` and `svelte`/`svelte/…` imports; nine detector cases plus the real files `bands.ts`, `geometry.ts` and, after review, `tray.ts`, whose header declares it pure; it passes). 4-1 m3 resolved by 4.4 (ticket).
- **D9 4-2 m7:** `text.test.ts` score-text describe and tests cite AD-3.
- **D9 4-8 tie-break:** `targeting.test.ts` `AD-12 equal ratios compare horizontal centre distance only, not 2-D distance`.

### Playwright (`e2e/`)
- **D1** (`layout.spec.ts`, both tests): `page.clock.install({ time: 0 })` + `pauseAt(1000)` before load; `waitForTimeout` → `clock.runFor`; each step 35 ms, the move, one 16 ms frame (51 ms); the 300 ms wall-clock loop → six steps; the quiet-point test `runFor(150)` + one frame; each move's scroll event (dispatched in a real frame) is awaited before page time advances. All assertions and both windows (150 ms, 100 ms) unchanged; no gate change, no fallback needed. `--repeat-each 10`: 20/20; under load (layout + drag + tap, `--repeat-each 3 --workers 8`): green.
- **D4** (`drag-interruptions.spec.ts`): local `cancelAndPauseNear` dispatches the pointercancel on the captured element and pauses all three faces in the same page task (one `evaluateAll`; the controller creates the fly-back animations synchronously inside the dispatch), used by both F33 "from above the selection" tests (full and reduced motion). `--repeat-each 10 --project android --retries 0` (2026-10-07): 30/30 passed (the two F33 tests plus one other title matching the filter).
- **D8** `e2e/helpers/board.ts`: `openFixture(page, name, { prefs?, steps?, booted = true })` (waits for the heading, the 52 cards, then the booted store, then clicks `steps`), `column`, `cards`, `foot`, `box`, `centre`, `stashSession` (returns the stored text), `sameSession`; types `Point`, `Box`, `Step`, `OpenOptions`. Replaced copies: board, board-phases (`openFixture`; board-phases passes `{ steps }`), column-phases, drag, drag-interruptions (`{ prefs: 'prefs-non-default' }`; its `stashSession` returned void, callers ignore the value), tap, pointer, wordcell-view, layout (`openFixture` with `{ booted: false }` at every call, as its local copy had no booted wait; the helper's heading wait is the one added wait). Kept local: board/board-phases `box` (page + selector/locator, returns top/left…; renaming would change test bodies), wordcell-view `box` (returns width/height) and `openPaused` (installs the clock), layout `rect` (takes a selector). `globals.d.ts` comment on `__pointerSession` points at the helper. `helpers.spec.ts` "board helpers" describe: four `AD-17` tests, each with a positive and a negative case.
- **D9 e2e:** 4-2 m2/m6 `AD-17 F11 geometry` (column-n spans columns band to footRow bottom; bars 44/60, sticky; bars and tray as wide as the board; h1 1 × 1); m3 `data-*` values equal n; m4 new `AD-17 F11 WordCell slots: 50 × 61 under column n − 2 …`; m5 smoke `R-03` card tops strictly increase; m8 `toBeDisabled` at the end of `R-82 … Redo across a commit`. 4-3 m1 `ring()` at module scope, cells 3–6 at 2 px, `expectTarget` 3 px; m2 per-column `ghosts` per state (four states not in the 4.3 matrix derived from existing literals). 4-4 m2: 1280 × 720 `pan-y` on `[data-band="leftover"]` before the 370 × 750 step. 4-7: no ancestor up to `.board` creates a stacking context. 4-8: whole `arrangement`; `expectDragging` and ≥ 25 % source overlap in leave-and-return and whole-column self-drop; rename `R-14 Q-34 a sub-25 % drag over the source only highlights nothing and flies back`. 4-9-build: F24 pre-drag baseline (shadows, outline display, foot-1 background, the 7 target feet). 4-9-f32: `AD-12 F33 under reduced motion a pointercancel of a drag from above the selection fades each face on its resting slot …`. 4-11 m4: `R-14 R-65 Q-21 a non-empty WordCell long-press peeks while held and keeps the selection; Session, storage and Undo/Redo unchanged` (+ `wc === 1` while held); m5: `elementFromPoint` at the scrim drag start has `data-view-scrim`. 4-6 m1: `pointer.spec.ts` gutter comment now says the gutter is outside the root, so its events do not reach the controller.
- **D19:** whole-column drag (column 5 onto column 2): `expect(await css(placeholder(page, 5), 'visibility')).toBe('hidden')` after `expectDrop`.
- **D6 sharpenings** (`wordcell-view.spec.ts`): 1 the hover peek still open with no sheet at 399 ms; 2 two-sided `|gap| ≤ 1` for cells 6, 8 and `?bands=`; 4 renamed `AD-12 with the WordCell row under the top bar (?bands=), no room above: the hover peek sits below the cell`.

### Plans (text only; no ticket file edited)
- **D5 + D6 sharpening 3:** `story-desktop-hover-peek-plan.md` names `ControllerDeps.watchHoverFine` / `layout.watchHoverFine` (subscribed in `attach`, unwatched on detach) and its Vitests `AD-12 a hoverFine change to false closes an open hover peek with no refreshHover() call; detach unwatches` and `AD-11 watchHoverFine runs its callback after every media change, …`; explicit R-65 sentence → test list. Old Review Triage Log rows left as history (noted in its Change Log).
- **4-6 m1/m5:** `story-pointer-controller-core-and-cancel-wiring-plan.md` one gutter wording, desktop gutter lost end reachable in entry 6 (mouse; next click recovers); deferred entry: root mounted after boot covered by `e2e/blocking.spec.ts` `§2 AD-13 New game from a rejected Session, then a tap selects` (entry 7).
- **4-8:** `story-drag-overlap-targeting-and-drop-into-composing-plan.md` R-14 in the renamed test's list entry; Residual-risks line now says a cancelled fly-back throws `AD-12 fly-back animation cancelled`.
- **4-9-build / 4-9-f32:** `story-drag-interruptions-…-cance-plan.md` mapping with exact titles, row 103 (`AD-12 F24 a drag from the source column of a selection lifts one tail` + the `release on the never-left source` Vitest row) with the over-the-WordCell-row note; first F32 Change Log entry marked wholly superseded by F33.
- Each edited plan has a dated 4.13 Change Log entry.

### Split (AD-17 Speed; median ≥ 5.00 s)
- `src/architecture-scan.ts`: former lines 1–651 (every top-level declaration now `export`ed) plus `ROOT`, `walk`, and `SELF` = the set of the three test files and itself; header comment rewritten for the module.
- `src/architecture-tree-scan.test.ts`: `AD-1 tree scan`; filter `!SELF.has(p)`; name `AD-1 every file under src/ except the architecture tests and their scan module passes the scan` (was "… except this one …").
- `src/architecture-ad1.test.ts`: the 15 AD-1 fixture describes, `AD-1 engine tsconfig`, and `AD-11 layout modules are pure` (an AD-1-style scan: same stripper and token regexes).
- `src/architecture-ad2-ad12-ad17.test.ts`: `AD-17 valid session fixtures`, `AD-2 engine index exports`, `AD-12 act() scan` with its local helpers.
- Bodies unchanged except imports, `SELF` and that one name: 288 tests before and after, identical full names but the tree-scan one (compared from JSON reporter output). `tsconfig.arch.json` `files` and `tsconfig.app.json` `exclude` list all four. `src/architecture.test.ts` deleted.

### Timings
- **Median, before split** (/mnt/d checkout, `npm test`, one discarded warm-up, then three; Vitest `Duration` / wall): 5.36 s / 11.07 s, 5.37 s / 11.27 s, 5.28 s / 11.05 s → **5.36 s**. Per-file (`--reporter=json` to `/tmp/vitest-pre-split.json`): controller.test.ts 3549 ms, architecture.test.ts 2915, game.svelte.test.ts 1332, scripts/deploy-check.test.mjs 1035, engine/view.test.ts 519, history.svelte.test.ts 446, overlays.svelte.test.ts 306.
- **Median, after split** (same method): 5.47 s / 11.44 s, 5.58 s / 11.68 s, 5.45 s / 12.61 s → **5.47 s** (owner stop). Per-file (`/tmp/vitest-post-split.json`): controller.test.ts 4014 ms, architecture-tree-scan 1437, game.svelte.test.ts 1352, deploy-check 1068, architecture-ad2-ad12-ad17 755, architecture-ad1 541, engine/view.test.ts 526, history.svelte.test.ts 405, overlays 289.
- **Watch re-run** (after the split): `rsync -a --delete --exclude .git` of the working tree (with `node_modules`, `generated/`) to `~/wordcell-watch`; `npx vitest watch` there; `touch src/engine/view.test.ts` (slowest engine file in both median runs, so the watch file is the same before and after the split; the split does not touch its import graph) three times: 412 / 413 / 415 ms → **413 ms** (< 1.00 s). Initial watch run of the whole suite there: 2.38 s.
- Unit counts: 2051 tests, 48 files before the split, 50 after.

### D1 counting rule — five consecutive green `npm run test:e2e` (after the last src/ and e2e/ edit other than the split)
1. 2026-10-07 ~19:56 (inside `npm run test:all`): 371 passed, 0 failed.
2. 2026-10-07 20:12: 371 passed, 327 skipped, 0 failed.
3. 2026-10-07 20:14: 371 passed, 0 failed.
4. 2026-10-07 20:16: 371 passed, 0 failed.
5. 2026-10-07 20:18: 371 passed, 0 failed.
(A sixth, inside the final `test:all` at 20:21, also green.) No failure of any kind in any run; local `retries` is 0.

### Verification
- `npm run test:all` on the final tree (2026-10-07 20:21–20:24): exit 0 — lint clean (178 files), check 0 errors, unit 50 files / 2051 passed, build within the size budget, dist 14 passed, e2e 371 passed, pwa 12 passed.
- **D15** `npm run test:screens` (Docker 29.8.0, container `mcr.microsoft.com/playwright:v1.63.0-noble`, 2026-10-07): 8 passed, no baseline change. Run after the controller and store changes; later edits touched only non-screenshot specs, test files and tsconfigs.
- `git diff --stat`: no ticket file, AGENTS.md, spine, EXPERIENCE.md, DESIGN.md, build-notes.md or `src/engine/` change; R-02 golden deal untouched.
- The build-notes.md F35 bullet and the ticket Notes F35 entry record the owner's answer and are not build edits.

### Inventory status
- D1 In, fixed (above). D2 In, fixed. D3 In, not asserted at HEAD; added. D4 In, fixed. D5 In, plan edited. D6 In, fixed + sharpenings 1–4. D7 In, built (production + Vitests + android Playwright). D8 In, helper module. D9 In, every listed item done; 4-1 m3 resolved by 4.4 (ticket); the 4-9-f32 ticket-Notes item Out of scope. D10–D14, D17 Out (frontmatter `deferred`). D15 In, green. D16 In, already resolved by 4.11, asserted (above). D18 In, unreachable (above); uncaptured part Out. D19 negative case In, added; compact tray Out. D20 In part unreachable (above); the rest Out (frontmatter `deferred`).

### AGENTS.md Where-things-are additions (for a `bmad-project-context` refresh; not edited here)
- Shell modules: `stored-key.ts` the stores' shared rejected-reason, last-text, launch-snapshot and AD-15 write-guard helpers (F18; never imports `./storage` or a store).
- UI: `src/ui/layout/` (`bands.ts`, `geometry.ts` pure (AD-11 purity scan), `layout.svelte.ts` live layout); `src/ui/gestures/` (`controller.ts`, `classify.ts`, `intent.ts`, `targeting.ts`, `drop-target.ts`, `gate.ts`, `click-swallow.ts`); `src/ui/act.ts` (F9 cancel-first wrapper).
- E2E helpers: `e2e/helpers/board.ts` (board helpers, D8).
- Architecture tests: `src/architecture-tree-scan.test.ts`, `src/architecture-ad1.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts`, shared `src/architecture-scan.ts`. Lines naming `src/architecture.test.ts` to update: AGENTS.md 38, 48, 71, 81, 84; spine 79, 693–695, 886, 925, 956, 968.

## Plan Change Log

- 2026-10-07 (review fixes): D4 cancel and pauses in one page task; layout.spec.ts `booted: false`; three R6 message tests; `tray.ts` in the AD-11 purity scan; hidden-banner Vitest. Full verification after these is the coordinator's.
- 2026-10-07: D7 hidden-banner refinement (the banner counts only while it has height), recorded under Controller; equal to Design Notes §D7 in the default band order.

## Review Triage Log

### 2026-10-07 — Review pass
- verdicts: 34 findings — high 0, medium 4, low 20, false 10, maybe-false 0 (duplicates keep their own rows with their twin's verdict)
- findings:
  - blind-hunter
    - `[low]` `[patch]` tray.ts (declared pure) missing from the AD-11 purity list — added to `LAYOUT_PURE`; passes.
    - `[medium]` `[patch]` stored-key.ts covered only through the stores (grouped with verification-gap R6 messages) — three message-exact tests added.
    - `[low]` `[reject]` `rejectReason` casts and `assertWritable(kind: string)` — the distributive `RejectReasonOf` matches today's three unions; a hypothetical new version-less failure is unlikely and a typed `kind` needs a store type import the ticket keeps out.
    - `[false]` `[reject]` split kept though slower — the ticket defines split then owner stop; keep/revert is the owner's call, raised in the result.
    - `[false]` `[reject]` architecture-scan.ts exemption — the ticket's Split shape prescribes `SELF` as all split files plus that module.
    - `[medium]` `[defer]` AGENTS.md and spine still name the deleted `src/architecture.test.ts` — fix edits agent-context files; lines recorded for the bmad-project-context refresh.
    - `[low]` `[reject]` older plans still mention the D1 flake — the ticket allows plan edits only where a row names one; history stays history.
    - `[low]` `[reject]` D1 virtual clock cannot show slow-device scroll gaps — the test asserts the gate's own quiet rule, not device scroll cadence; device behaviour is already epic 7.
    - `[medium]` `[patch]` D4 cancel and pause in two page tasks — merged into one `evaluateAll` (`cancelAndPauseNear`); 30/30 with `--repeat-each 10`.
    - `[low]` `[reject]` F34 Playwright covers only the top bar — the ticket asks for one android case plus controller Vitests; met.
    - `[low]` `[patch]` hidden-banner refinement untested — Vitest with a zero-height banner at y 200 added; fails with the plain max().
    - `[low]` `[reject]` `sameSession` returns false without a stash — behaviour copied unchanged from the per-spec copies (D8 "behaving the same"); misuse is unlikely.
    - `[false]` `[reject]` R7 copies scaffolding — the ticket requires copying (tests never import each other).
    - `[false]` `[reject]` 4.6 deferred entry for covered work; inconsistent skip counts — the 4-6 m5 log default was to record it in the deferred list; the count is cosmetic.
  - edge-case-hunter
    - `[low]` `[reject]` rejectReason cast (same as blind 3).
    - `[false]` `[reject]` launchSnapshot with `T` including undefined — no caller's T includes undefined.
    - `[low]` `[reject]` assertWritable string kind (same as blind 3).
    - `[false]` `[reject]` band changes mid-drag with no pointermove — layout and banner wait on the gate the press holds; cards have `touch-action: none`.
    - `[false]` `[reject]` grabbed face not clipped — F34 clips the targets; the ratio over the whole face makes a tail mostly over a bar fly back, as F34 wants.
    - `[false]` `[reject]` empty band makes every drag fly back — with no visible column, flying back is the F34 outcome.
    - `[low]` `[reject]` half-open outer edge leaves no suppressed cell — browser hit-testing is half-open too, so that point is not over the cell either; sub-pixel and rare.
    - `[low]` `[reject]` sameSession without stash (same as blind 12).
    - `[low]` `[reject]` openFixture step on a disabled button — a test-author error surfaces as a timeout; no guard warranted.
    - `[low]` `[reject]` pauseAllNear with several animations — each face runs exactly one fly-back animation (asserted elsewhere); superseded by the D4 patch.
    - `[low]` `[reject]` purity scan misses stateful imports — matches the 4-1 m6 default (AD-1 tokens, import.meta, svelte).
    - `[low]` `[patch]` hard-coded LAYOUT_PURE (same as blind 1).
    - `[low]` `[reject]` bands.test non-Error throw message — cosmetic failure text.
  - verification-gap
    - `[medium]` `[patch]` R6 guard messages AD-4 twice, AD-17 loaded() while, AD-17 history before load unpinned — three new tests added.
    - `[low]` `[reject]` half-open outer edge (same as edge 7).
  - intent-alignment
    - `[low]` `[reject]` R6 proven only through the stores — addressed by the R6 tests above.
    - `[low]` `[reject]` watch re-run measured only after the split — the final state is the gating measurement (413 ms, far under 1.00 s; the split does not touch the engine import graph).
    - `[false]` `[reject]` D1 runs on virtual time — the ticket asks for deterministic, same assertions, same windows; met.
    - `[low]` `[patch]` layout.spec openFixture gained a booted wait — `{ booted: false }` passed at every call.
    - `[false]` `[reject]` D18/D20 settled by code reasoning — the ticket asks to record "unreachable" and why.

## Design Notes

**R6 API** (`src/shell/stored-key.ts`, plain `.ts`, no runes, imports nothing from `./storage` or any store):
```ts
export type RejectReasonOf<R> = R extends { readonly ok: false } ? Omit<R, 'ok'> : never; // distributive: keeps `version`
export function rejectReason<F extends { readonly ok: false; readonly reason: string }>(parsed: F): RejectReasonOf<F>; // body unchanged
export interface LastText { remember(text: string | null): void; isStale(current: string | null): boolean; text(): string | null }
export function trackLastText(): LastText; // each store feeds it from its own read(KEY); text() serves history's Q-39 rollback
export interface LaunchSnapshot<T> { assertUnset(twice: string): void; set(value: T): void; get(early: () => string): T }
export function launchSnapshot<T>(): LaunchSnapshot<T>; // "unset" is undefined; null is a valid value (absent key)
export function assertWritable(kind: string, op: string): void; // halted|booting → throw new Error(`AD-15 ${op}() while ${kind}`)
```
Leftover "R6 loaded()/load() guard messages" resolved: callers pass their messages: `assertUnset('AD-4 load() called twice')` (game, halted branch only, as now), `'AD-6 …'`, `'AD-10 …'`. `get(() => \`AD-17 loaded() while ${state.kind}\`)` for game (lazy, reads kind at throw time), and `get(() => 'AD-17 history loaded() before load()')` / `'AD-17 prefs loaded() before load()'`. Keep each store's guard order and branch structure. Factory name `trackLastText` avoids shadowing the stores' `lastText` locals.

**D3:** no export change. In the press-target tests (:569-607) assert the resolved target through its observable outcome per kind on the board fixture: column card → tap selects; non-empty wordcell → long-press opens a peek; emptyWordcell → long-press opens nothing; other → tap clears. Add the log's two throw tests (press on a cell element whose number is not in `GameView` → AD-12 throw; press with no `GameView` → throw), asserting the existing messages. Record in Implementation Notes that the pre-existing tests did not assert it.

**D6:** `hoverTimer` becomes `{ handle, cell: number }`; `hoverLeave` compares cell numbers; `hoverEnter` calls `stopHoverTimer()` before its early returns. `suppress()` uses half-open rects `x >= left && x < right && y >= top && y < bottom`, so the shared 6/7 edge resolves to 7. One controller Vitest each. Sharpenings 1, 2, 4 in `e2e/wordcell-view.spec.ts` (399 ms still open; two-sided 1 px zero-gap checks; rename the :698 test to AD-12); 3 in the hover-peek plan.

**D7 (F34):** in `dragMove`, before `pickTarget`, read the band once per move: `top = max(topBar.bottom, banner.bottom)`, `bottom = actionBar.top`, from `root.querySelector('[data-band="topBar"]')` etc. Clip every candidate rect (source included) to `[top, bottom]` vertically; an empty clip is a zero-area rect. Release with no highlight uses the existing fly-back. `board()` in controller.test gains bar rects; Vitests: column under the bar not lit; partly visible column lit at ≥ 25 % of its visible part; banner shown moves the band top. Android Playwright case in `e2e/drag.spec.ts`.

**D18:** first add the repro Vitest (hold a press, disconnect its captured element / clear its capture, pointerdown with a new pointerId → controller stuck). App reachability: check whether any store change during a held press can replace the captured element (dictionary load → banner, history notice, layout gate deferral; unkeyed `{#each}` keeps elements). If proven unreachable, keep the Vitest as a documented current-behaviour test named AD-12 and record "unreachable" and why. Otherwise implement: at a different-id pointerdown, when `p.captured !== null && (!p.captured.isConnected || !p.captured.hasPointerCapture(p.pointerId))`, run the same-id path (`end({ kind: 'sameId' })`, peek closes and flushes), keeping the button check after it (after the 4-6 minor 3 change), then resolve and start the new press; `FakeEl` gains `isConnected`. A live captured press keeps ignoring the second pointer (Vitest). If recovery would act on a live press, record the repro: owner stop.

**D20:** record per path: replacing-drag `cancel()` is unreachable because the scrim (`WordCellView.svelte:61`, fixed, inset 0, z 10) resolves before `data-place`, so no card press under a view, and a view opens only at a press end; WordCell tap resolves to scrim/sheet and pointerup closes without `perform` (:688-693); Undo, Redo and banner Reload live in `.board`, inert while `viewCell !== null` (Board.svelte:78), and a held peek's scrim covers them. Cite the existing tests (:1034-1101, :1051).

**D8:** `e2e/helpers/board.ts` exports `openFixture(page, name, { prefs?, steps?, booted = true } = {})`, `column`, `cards`, `foot`, `box(locator) → {x,y,w,h}`, `centre(locator)`, `stashSession(page) → string | null`, `sameSession(page)`. Call sites change only imports and option arguments. Keep local, with the reason in Implementation Notes: board/board-phases `box` (different signature; rename local to `rect` only if no test body changes, else keep), wordcell-view `box` and `openPaused`, layout `rect`. If `booted: true` would change a layout scroll test's timing, layout passes `booted: false`. `helpers.spec.ts` gains a "board helpers" describe with an `AD-17` positive and negative case per export.

**D1:** test-only, no gate change. Use `page.clock`: `install({ time: 0 })` and `pauseAt` before `goto` (precedent blocking.spec.ts:57-69); replace `waitForTimeout(35)` with `page.clock.runFor(35)`; the 300 ms wall-clock loop becomes a fixed step count of the same virtual length; `settle`/frames advance one frame with `runFor(16)`; after the last step `runFor(150)` then one frame. Every assertion and both windows stay. If boot or scroll dispatch does not work under the paused clock, fall back to the next deterministic option and record it; a gate change needs a `gate.test.ts` case. Counting: five consecutive green full `npm run test:e2e` runs after the last src/ or e2e/ edit (the split excepted); a D1/D4 failure resets the count; a first-time other failure is recorded with its output and neither counts nor resets; any test failing twice, or D1/D4 failing twice after its fix → owner stop.

**D9 batch** (log's first-named default; test-only unless noted):
- 4-1: m1 pin `after.total` 830 and range 0/50; m2 sum check in `layout()` and `three.heights.tray` 224; m4 782 absorb boundary; m5 F21 alternate order cases; m6 architecture purity scan; m7 `err.constructor === Error`; m8 `cardWidth(412, 734.3, {top:0.1,bottom:0.2}, false)` is 44.
- 4-2: m2 column-n spans columns top to footRow bottom; m3 `data-*` values equal n; m4 WordCell slot 50 × 61 aligned to column n−2 and the wordcells band; m5 R-03 tops strictly increase; m6 bar heights 44/60, sticky, widths, h1 1 × 1; m7 AD-3 names in text.test.ts; m8 Redo disabled at the end.
- 4-3: m1 `ring()` to module scope, cells 3–6, ring check in `expectTarget`; m2 per-column `ghosts` in `State`.
- 4-4 m2: 1280 × 720 → `pan-y` on `[data-band="leftover"]` before the 370 × 750 step. 4-5 m1: drop "a hover peek" from the :617 name.
- 4-6: m1 plan text; m2 contextmenu not prevented after `t.down(t.b.foot1)` plus a pointercancel-ended variant; m3 **production**: same-id recovery runs before the button check, with a Vitest; m5 record as entry 7/9 coverage in the 4.6 plan's deferred.
- 4-7: tile click path **production** (accept `tile` like `outside`, extend the detail-0 test); stacking: assert no ancestor up to `.board` creates a stacking context.
- 4-8: tie-break case; fly-back `kinds` `['flyBack']` on the three cases; whole `arrangement` array; `expectDragging` and ≥ 25 % source overlap in the two named tests; R-14 into the "Q-34 a sub-25 % drag" name and the plan list; Residual-risks line now says the throw.
- 4-9-build: below-MIN_RATIO overlap row; F24 pre-drag baseline; `replacing()` selection unchanged and navCalls empty; plan mapping row 103 with exact titles; one-lifted-tail note in the mapping. 4-9-f32: widen the superseded note; reflow the Entry 9 comment; reduced-motion variant of the F33 bigger-stack P4; `liftedDrag('card1b', false, 2)`.
- 4-11: m4 R-65/Q-21 in the name plus Session/storage/Undo/Redo unchanged and wc-while-held checks; m5 `elementFromPoint` at drag start has `data-view-scrim`.
A minor already resolved at HEAD is recorded, not re-done.

**Re-measure** (once, after all in-scope changes; record locations, commands, raw numbers). Median: in the /mnt/d checkout, `npm test` once (discarded), then three runs; metric is Vitest's reported `Duration`, wall clock beside it; per-file times from a `--reporter=json` run written to /tmp. Watch: `rsync -a --delete --exclude .git` the working tree (with `node_modules` and `generated/`) to `~/wordcell-watch` (Linux filesystem), start `npx vitest` (watch) there, then save the slowest engine `*.test.ts` of the median run unchanged (`touch`) three times, reading each re-run's Duration; median of three. Leftover "watch file re-chosen after a split" resolved: yes, after a split the watch file is re-chosen as the slowest engine file of the post-split median run (both recorded). Planning baseline (HEAD 3014424): median 5.25 s (5.13/5.25/5.37); slowest files controller.test.ts 3842 ms, architecture.test.ts 2786 ms, game.svelte.test.ts 1605 ms; slowest engine file view.test.ts ~488 ms. A 5.00 s+ result after the split, or a watch median ≥ 1.00 s, records per-file (per-test for watch) timings and is an owner stop.

**Split** (only if the median is ≥ 5.00 s; read spine Scaffold deltas first): `src/architecture-scan.ts` (shared machinery :1-651 plus `ROOT`, `walk`, `SELF` as the set of all split files plus itself), `src/architecture-tree-scan.test.ts` (AD-1 tree scan alone), `src/architecture-ad1.test.ts` (the other AD-1 blocks incl. engine tsconfig and the new AD-11 purity scan if it is an AD-1-style scan; else the third file), `src/architecture-ad2-ad12-ad17.test.ts` (AD-17 fixtures, AD-2 exports, AD-12 act() scan with its local helpers). Names and bodies unchanged except imports, `SELF` and the tree-scan name's "this one" wording (list each in Implementation Notes). `tsconfig.arch.json` `files` and `tsconfig.app.json` `exclude` list all four. The tree scan must still exempt every split file and `architecture-scan.ts`; pitfall exemptions in other AGENTS.md rules that name `src/architecture.test.ts` are honoured by the set. Re-measure both metrics after the split; record per-file times.

**Owner stops** (finish all other work, record in Implementation Notes with evidence, report them): median ≥ 5.00 s after the split; watch median ≥ 1.00 s; D1/D4 still failing twice after the fix or not deterministic; any other test failing twice; D18/D20 recovery acting on a live press or a reachable D20 path; a screenshot baseline diff.

## Verification

**Commands:**
- `npm run test:all` -- expected: green (lint, check, unit, build, dist, e2e, pwa).
- `npm run test:e2e` × 5 consecutive (D1 rule) -- expected: five green, recorded.
- `npm run test:screens` -- expected: green, no baseline change (or recorded per D15).
- `npm test` warm-up + 3 -- expected: median recorded; < 5.00 s or owner stop.
- `git diff --stat` -- expected: no ticket file, AGENTS.md, spine, EXPERIENCE.md, DESIGN.md, build-notes.md or `src/engine/` change; no change to the R-02 golden deal.

## Auto Run Result

**Summary:** Ticket 4.13 is implemented in full: R6 (`src/shell/stored-key.ts`), R7 (`src/shell/history.svelte.test.ts`), inventory D1–D20 (production: D6, D7/F34, 4-6 minor 3, 4-7 tile click; the rest test-only or plan text; D16 already resolved; D18 and D20 unreachable), the architecture-test split, and a green D15 screenshot run. **Owner stop (AD-17, epic Done when 5):** the warm unit median stays at 5.00 s or more after the split, so the plan is not `built`.

**Files changed:**
- `src/shell/stored-key.ts` (new): the shared reject reason, last-text tracker, launch snapshot and AD-15 write guard.
- `src/shell/game.svelte.ts`, `history.svelte.ts`, `prefs.svelte.ts`: use stored-key.ts; messages unchanged.
- `src/shell/history.svelte.test.ts` (new) and `game.svelte.test.ts`: R7 move, plus R6 message tests.
- `src/ui/gestures/controller.ts`: F34 visible-band clip, keyed hover timer, half-open suppress, same-id before the button check, tile click.
- `controller.test.ts`, `targeting.test.ts`, `overlays.svelte.test.ts`, `layout/geometry.test.ts`, `layout/bands.test.ts`, `text.test.ts`: inventory tests.
- `src/architecture.test.ts` is split into `src/architecture-scan.ts`, `architecture-tree-scan.test.ts`, `architecture-ad1.test.ts` (with the new AD-11 purity scan) and `architecture-ad2-ad12-ad17.test.ts`. `tsconfig.app.json` and `tsconfig.arch.json` list them.
- `e2e/helpers/board.ts` (new) and `helpers.spec.ts`: D8.
- E2E specs: `layout`, `drag-interruptions`, `drag`, `tap`, `board`, `board-phases`, `column-phases`, `pointer`, `smoke`, `wordcell-view`; `globals.d.ts` comment.
- Plan text in four done tickets' plans (D5, D6, D9).

**Review:** one thorough pass with 34 findings: 7 patched, 1 deferred, 26 rejected, each with its reason (Review Triage Log).
- Patched:
  - R6 message tests (medium);
  - D4 cancel and pause in one page task (medium);
  - `tray.ts` added to the purity list (low, plus its duplicate);
  - hidden-banner Vitest (low);
  - layout.spec `booted: false` (low).
- Deferred: AGENTS.md and spine references to the deleted `src/architecture.test.ts` (medium).

**Follow-up review:** `false`. Two medium entries were patched, but both are test-only and verified: D4 passed 30 of 30 repeats, and the R6 tests pass. No unverified risk can be named.

**Verification:**
- `npm run test:all` at 20:52 on the final tree: exit 0. Unit 2055 passed, dist 14, e2e 371, pwa 12.
  - An earlier run at 20:40 failed in dist-smoke with "Port 5173 is already in use". That was an environmental clash with a verification loop I had killed. Under the D1 rule it neither counts nor resets, and no e2e ran in it.
- D1 counting after the last e2e edit: `npm run test:e2e` green at 20:42, 20:44, 20:46 and 20:48, then the test:all e2e at 20:52. That makes five consecutive green runs.
- `npm run test:screens` (container, Docker 29.8.0): 8 passed, no baseline change. Later edits touched no rendering code.
- Final warm median (/mnt/d, `npm test`, warm-up discarded): 5.47, 5.72, 5.62 → **5.62 s**. Watch re-run: 413 ms.

**Matrix note:** the I/O matrix row "D18 dead press" states the recovery unconditionally. The ticket and Design Notes make it conditional on reachability. D18 was found unreachable, so the recovery was not built. The repro Vitest pins today's behaviour instead (see Implementation Notes D18).

**Residual risks:**
- The owner stop: `controller.test.ts` (3.5–4.0 s) is the critical path, and the only permitted speed-up, the split, cannot shorten it. The split also raised the median slightly (5.36 → 5.47 s at measurement).
- AGENTS.md and the spine name a deleted file until the refresh.
- D7 is checked in a real browser only for the top-bar case. The action-bar, banner and partial-visibility cases are covered by Vitests.
