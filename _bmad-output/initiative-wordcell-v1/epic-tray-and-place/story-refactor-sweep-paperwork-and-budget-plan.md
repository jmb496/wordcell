---
title: 'Refactor sweep: paperwork and budget'
type: 'chore'
ticket: '15'
created: '2026-10-14'
status: 'built'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'auto'
lenses_ran: [quick]
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
baseline_revision: '780859a7d2c4e8297f5833cbef1fd699366230a2'
---

<intent-contract>

## Intent

**Problem:** Epic 5 closes with paperwork rows of the build-notes Sweep inventory (S8–S13, S16, S21, S22), the AD-17 unit-budget re-measure, the retrospective close-out edit list and the epic Done when 1 audit still open.

**Approach:** Ticket `story-refactor-sweep-paperwork-and-budget.md` is the contract. Record or apply each row by content (premise false or already applied: say so with evidence), measure S12 then S22, run `test:all` then `test:screens`, then audit every rule-coverage.md P5 row. No code change; any owner stop is recorded and leaves the plan not built.

</intent-contract>

## Implementation Notes

Oneshot: plan and ticket-record edits only, no source change (`git diff` touches only `_bmad-output/`). Measurements ran in the order S12, S22, `test:all`, `test:screens`, P5 audit. Owner stops: **none**.

### How the owner's five unapplied minors from the ticket's review log were resolved
1. S22 "12 workers" is the 2026-10-08 observation (build-notes S22), not Playwright config: this plan says "workers as observed". This run's load was `npm run test:e2e` at its own worker count (8 workers, `Running 1062 tests using 8 workers`).
2. S12 a failed timed run is an owner stop and no median is computed (no replacement run): not triggered, all three timed runs passed (2393 tests, 55 files).
3. S12 watch re-run: the slowest engine file comes from the per-file timings of the first timed run and the figure is the summary Duration. Vitest's default reporter prints no per-file times in a non-TTY run, so the per-file timings came from one extra `--reporter=json` run on the same tree (not timed, not in the median); the first timed run's own per-file times were not printed. The figure below is the summary `Duration` line.
4. Order: a red `test:all` or `test:screens` is an owner stop: not triggered, both green.
5. S22: its load run is separate from `test:all`; a pass is recorded "not reproduced".

### S12 — AD-17 re-measure (Linux filesystem, HEAD 780859a)
- Method: working tree rsynced (no `.git`, `node_modules`, `dist*`, `generated/`) to `~/wordcell-watch` (Linux filesystem, not `/mnt/d`), `npm ci`, idle machine (load average 0.83 at start, 16 CPUs, Node v24.1.0), one discarded warm-up (3.83 s), then three timed `npm test`.
- Summary `Duration`: **3.00 s, 2.99 s, 3.06 s → median 3.00 s** (< 5.00 s: **met**). All green: 55 files, 2393 tests.
- controller.test.ts (F41, critical path): 2871 ms wall (2858 ms of test time) in the extra per-file JSON run; next: architecture-tree-scan 1764, deploy-check 1558, game.svelte 1447, engine/view 823.
- Watch re-run: slowest engine file `src/engine/view.test.ts` (823 ms in the per-file timings); appended and reverted a trailing newline (restored byte-identical to the `/mnt/d` copy), `npx vitest run src/engine/view.test.ts` (skips `pretest`): summary `Duration` **584 ms** (< 1.00 s: **met**), 414 tests.
- Result: AD-17 budgets met; no "unmeasured", no "blocked: owner decision on AD-17 budget". The AD-17 Speed result for the epic-file list entry: epic 5 warm median **3.00 s** (HEAD 780859a, Linux filesystem), watch re-run 584 ms. For reference the `/mnt/d` unit run inside `test:all` took 6.08 s (not budgeted; drvfs).

### S22 — unit suite beside Playwright workers
- Alone: the three S12 timed runs (3.00 / 2.99 / 3.06 s) all passed.
- Beside: after S12, `npm run test:e2e` started in `~/wordcell-watch` (8 workers; 552 passed, 510 skipped), and three `npm test` runs started 25 s later while it ran: 6.83 s, 6.99 s, 8.03 s, each 2393 passed, 0 failed.
- Outcome: **not reproduced** (the 2026-10-08 failure is neither load-related nor failing alone here; no test named). Not in the median; no source edit.

### Gates
- `npm run test:all` (HEAD 780859a, `/mnt/d` checkout, exit 0): lint clean (212 files), check clean, unit 55 files / 2393 passed, build within the size budget, `test:e2e:dist` 14 passed, `test:e2e` 552 passed, `test:e2e:pwa` 12 passed. (A first attempt of mine was killed by my own shell before it started; its log was discarded, the run above is the only one.)
- `npm run test:screens` (Docker, exit 0): 10 passed (5 android, 5 desktop), no baseline change.

### Paperwork rows
| Row | Outcome | Where |
| --- | --- | --- |
| S8 4.13-OM | Applied: 21:25 failure (as logged `layout.spec.ts:286`/`:228`; at HEAD the test is `AD-11 banner during a scroll applied after a hide, before the quiet point` at `e2e/layout.spec.ts:306`, rewritten by b94b7b2) (`scrollY changes between steps`) and the five green runs (21:27–21:37, 371 passed each), from `review-loop/4-13-build.md`, recorded not re-run | `epic-board-and-gestures/story-refactor-sweep-plan.md` Implementation Notes "5.15 close-out records" |
| S9 4.13-m1 | Applied: `sameSession` throws `no stashed session` (`e2e/helpers/board.ts:86`); F34 source-clip Vitest (`controller.test.ts:2204`); 'while halted' test (`game.svelte.test.ts:1222`); `{ booted: false }` call sites and helper test (`helpers.spec.ts:389`); the `AD-7 F18 stored-key helpers` describe stays in `architecture-ad1.test.ts:1325` | same plan, same subsection, plus a Plan Change Log entry |
| S10 4.9f-m5 | Applied: "plan `deferred[0]`" → "the former" | `epic-board-and-gestures/story-drag-interruptions-selection-replacement-hide-back-and-cance.md` Notes |
| S11 4.11-OM | Applied: the final tree (commit 041af96; review-loop snapshot tree 2794145, `review-loop/4-11-build.md`) named in the `test:all` line | `epic-board-and-gestures/story-wordcell-peek-and-sticky-view-plan.md` Implementation Notes Verification |
| S16 4.12-OM | Premise false at HEAD: the hover-peek plan already names the controller's `watchHoverFine` (Code Map l.56, 58, 60; l.50, 78, 105, 144, 176), `App.svelte` unchanged; source `controller.ts:1567`, `layout.svelte.ts:351`. Recorded | sweep plan "5.15 close-out records" |
| S21 | Applied: 5.1 plan Change Log entry for `--update-snapshots=all -g composing` (1 % tolerance); epic `## Boundaries` now names the AD-17 valid-fixture list in `src/architecture-ad2-ad12-ad17.test.ts` (it was absent); b94b7b2's body "settling on its single scroll event" is stale: the Fix paragraph of the b94b7b2 commit body is stale against the test's `min` guard (`review-loop/epic5-banner-scroll-e2e.md` l.37: reword only if the WIP commits are ever squashed into it); recorded only, no history rewrite | `story-draft-wordcards-and-the-composing-tray-plan.md`, `epic-tray-and-place.md`, this plan |
| S22 | Not reproduced (above) | this plan |
| S12 | Met (above) | this plan |

### S13 — close-out edit lists for the retrospective (listed, not made, unless stated)
Spine (`ARCHITECTURE-SPINE.md`, owner at the retrospective): AD-12 F4 tray-band clip: **open** (spine l.515–523 has the band rule, not F4's clip); AD-12 F2 tile press resolution and full pitch: **open**; AD-12 F5 tile/free-letter drag ends: **open**; AD-14 F6/F7 FLIP in `src/ui/flip.ts`: **open**; AD-14 F8 winning guard and its six-listener set: **open**; AD-11 F10 `trayLayout` replaces `TRAY_ROWS`: **applied** (`TRAY_ROWS` no longer in the spine); Spine Structure tree gestures/ list lacks the new modules (controller-seams plan): **open**; build-notes line map labels "touch long-press peek" as "hover peek" (controller-seams plan): **open**.
Epic file (`epic-tray-and-place.md`): Structural Seed (`flip.ts`, `gestures/` modules, tile modules, shared class-name module): **open**; Proposed epics row 5 (F8 pending-end-sheet half to epic 6): **open**; AD-17 Speed: **open**, result for the entry is 3.00 s / 584 ms (above); Done when 3 "apart from `activeMs`": **open**; S21's Boundaries clause: **applied here**. The Boundaries/Done when 4 edits "due before ticketing" were applied at inception (epic Notes l.60).
EXPERIENCE.md / DESIGN.md: Arrange M caret (F16): **open**; Movable tile selection clearing (F18): **open**; message catalogue `5 letters` / `1 letter` and Place meta `6 letters → cell 6 · +30` (F11): **open** (only the lone-`QU` give-up line at l.109 and the `5 letters` aria example at l.410 exist).
AGENTS.md (through `bmad-project-context`): Known pitfalls mirrors line: **open** (still reads "never animate, except the tray's drag parting shift (AD-14)"; the FLIP-glide wording is not yet there). Where-things-are additions checked against the tree at HEAD 780859a, all **open** and all present: `src/ui/flip.ts`; `src/ui/tray/` (`ControlRow.svelte`, `TileRows.svelte`, `WordLine.svelte`, `tags.ts`); `src/ui/gestures/` (`controller.ts`, `classify.ts`, `intent.ts`, `targeting.ts`, `drop-target.ts`, `gate.ts`, `click-swallow.ts`, plus `classes.ts`, `fly-back.ts`, `hover-peek-timer.ts`, `lookup.ts`, `tile.ts`, `visible-band.ts`); `src/ui/motion.ts`; `e2e/helpers/`; the sweep plan's list (stored-key, layout/, act.ts, architecture-*.test.ts renames) still stands.
CAP-12-deferred items: controller-seams plan frontmatter `deferred` (miss paths of converted lookup sites untested) and its `[defer]` line: **deferred to a later sweep, no owner decision pending**; its Design Notes CAP-12 list — `main.ts` "(entry 12)" comment (logged as l.119, at HEAD `src/main.ts:122`) and controller.test.ts describe names: **open**. refactor-sweep-code plan: frontmatter `deferred: []`; its Design Notes outcome table marks 5-3 #1, #2, #4, 5-3 #7/#8, 5-4, 5-5 #1, 5-6/5-7/5-8 plan wording and 5-9 #1 not applied (CAP-12 paperwork or owner), **open** for the retrospective; those wording items are plan/rule-coverage prose, not made here.

### Epic Done when 1 audit — rule-coverage.md rows whose Kind contains P5 (42 rows; non-P5 rows skipped)
Pass comes from the green `test:all` run above (Playwright `android`; `desktop` where the row names it: only the winning-guard Enter-twice row). Test names carry the id; one representative per row (file, title prefix), `+n` = other passing tests carrying the same id. Every P5 row has at least one passing test: **no owner stop**.

| Row (sentence) | Test file | Title (with id) | Project |
| --- | --- | --- | --- |
| R-30 word line | tray.spec.ts | `R-30 R-36 R-37 (UI) session-composing: word line TAN with N underlined …` | android |
| R-30 Flip | tray-controls.spec.ts | `R-30 R-31 R-38 R-73 (UI) D-block controls on session-composing: + raises k, Flip flips the side …` | android |
| R-31 bounds | tray-controls.spec.ts | `R-31 R-73 (UI) + pressed until disabled reaches k = column 6 card count …` | android |
| R-31 empty column | column-phases.spec.ts | `R-31 R-39 an empty destination (k = 0): its placeholder and foot are inert` | android |
| R-32 (UI) block | tile-drag.spec.ts | `R-32 (UI) a block-mirror drag on session-composing (tile 42 selected) moves nothing …` | android |
| R-32 never reordered | free-letter.spec.ts | `R-32 block left: a free letter released over the block lands first in M [48, 42, 0]` | android |
| R-33 (UI) used | board-phases.spec.ts | `R-33 (UI) wordcell-3 shows the used face mirror in Place …` | android |
| R-33 used/empty no-op | tile-tap.spec.ts | `R-33 F13 in Composing a used and an empty WordCell keep the tile selection …` | android |
| R-33 removal from its tile | tile-tap.spec.ts | `R-33 R-34 R-35 Q-31 R-73 (UI) Composing on session-place-free-letter-redo-tail + one Undo: select, swap, deselect, then remove the free letter` | android |
| R-33 insertion index | free-letter.spec.ts | `R-33 (UI) R-73 (UI) Q-31 AD-12 drag-insert at the inner gap 1 of M (block left) …` | android |
| R-34 | tile-drag.spec.ts | `R-34 R-73 (UI) AD-12 tile 0 to gap 0 on session-composing stores [0, 42] …` | android |
| R-35 | tile-tap.spec.ts | `R-34 R-35 R-73 (UI) Composing on session-composing: select, swap and deselect source tiles` | android |
| R-36 | game-store.spec.ts | table row in `game-store.spec.ts:155` (id `R-36 R-38`, fixture `session-composing-draft-2-letters.json`, label `Need 3+ letters`; title built from the row) | android |
| R-37 | tray.spec.ts | `R-30 R-36 R-37 (UI) session-composing: word line TAN …` | android |
| R-38 | dictionary.spec.ts | `R-38 a word not in the list shows TAN isn't in the word list., stays Composing and stores nothing new …` (+35) | android |
| R-39 (UI) Place inert | place.spec.ts | `R-40 R-39 (UI) on session-place target 3 ringed, cells 4–10 faded; a tap on not-legal 4 and on current target 3 dispatches nothing …` | android |
| R-40 | place.spec.ts | `R-40 R-42 (UI) on session-place-free-letter-redo-tail target 3 checked and ringed, cells 4–10 faded …` | android |
| R-41 | place.spec.ts | `R-41 R-80 R-73 (UI) on session-place-free-letter-two-cards a retarget to the used cell 4, then Confirm …` | android |
| R-42 (UI) | board-phases.spec.ts | `R-42 (UI) on session-place the selected target 3 shows its ring and check at full opacity …` (+9) | android |
| R-50 (UI) | tray.spec.ts | template `R-50 R-80 (UI) Place on ${row.fixture}: word line ${row.word}, bottom on the first tile …` (`tray.spec.ts:309`), fixtures `session-place` and `session-place-free-letter-redo-tail` | android |
| R-51 | place.spec.ts | `R-51 R-42 R-73 (UI) a strip swap to [46, 3, 38, 37, 5, 41], then a tap on cell 3: placementOrder unchanged …` | android |
| R-52 | place.spec.ts | `R-60 R-52 R-73 (UI) Confirm on session-place-free-letter-redo-tail into cell 3: one session write …` | android |
| R-60 | place.spec.ts | `R-62 R-60 R-51 (won + Undo) a strip swap, a retarget to 3, then Confirm …` | android |
| R-61 | place.spec.ts | `R-61 R-65 R-80 R-73 (UI) on session-place-free-letter-two-cards: badge 2 on cell 4 with the used mirror …` | android |
| R-62 | place.spec.ts | `R-62 R-60 R-51 (won + Undo) …` | android |
| R-80 | success-signal.spec.ts | `R-73 (UI) R-80 Success signal (epic Done when 2): tap-only move … the score change equals …` | android |
| R-70 | board-phases.spec.ts | `R-70/R-71 Undo, Undo, Redo from session-place-free-letter-redo-tail re-renders moves[1] Composing with cell 3 used` | android |
| R-71 | place.spec.ts | `R-71 R-42 R-73 (UI) a retarget is a Place edit on won + Undo: Redo enabled, tap cell 4, Redo disabled …` | android |
| R-72 | tile-tap.spec.ts | `R-72 R-70 R-73 (UI) three tile edits then one Undo on session-composing return to Idle` | android |
| R-73 (UI) saved | tray-controls.spec.ts | `R-31 R-73 (UI) + pressed until disabled … each press saved …` (+43) | android |
| R-73 (UI) exact phase | board-phases.spec.ts | `R-73 (UI) a reload re-renders session-place-free-letter-redo-tail, and its Composing after an Undo` | android |
| R-65 (UI) | free-letter.spec.ts | `R-65 (UI) a long-press peek on available cell 7 with tile 42 selected …` | android |
| AD-4 selection ends | tile-tap.spec.ts | `AD-4 R-31 R-38 an enabled control (+, −, Validate) clears the tile selection before it acts (session-composing)` | android |
| AD-11 tray rows | tray-growth.spec.ts | `AD-11 session-composing-long: + gives three rows, − two, the WordCell row box unchanged …` | android |
| AD-12 tile press | tile-tap.spec.ts | `AD-12 F2 full pitch in card mode: a tap 1 px right of a face selects its tile; the lift moves the face only …` | android |
| AD-12 tray band 25 % / gap | tile-drag.spec.ts | `AD-12 F4 a face over the tray band under the action bar (≥ 25 % of the band, < 25 % of its visible part) parts nothing and flies back …` | android |
| AD-12 drag cancel paths | free-letter.spec.ts | `AD-12 F5 F18 pointercancel mid-drag (tile 42 selected first) flies back: Session byte-identical …` | android |
| AD-13 selection / back | drag-interruptions.spec.ts | `AD-13 R1 select, drag, back: the tail flies back, nothing selected, app open at wc 0` | android |
| AD-14 one live element | fly-to-cell.spec.ts | `AD-14 F28 Confirm on session-place: only the committed faces animate, staggered bottom first … 52 live elements …` | android |
| AD-14 FLIP kinds | flip-controller.spec.ts | `AD-14 F17 a tail drop glides from the released point …` | android |
| AD-14 input during animation | flip-controller.spec.ts | `AD-14 F6 P5 a press mid-glide on a card whose post-edit rect differs … acts on the post-edit view` | android |
| AD-14 winning guard (F8) | win-guard.spec.ts | android `AD-14 F8 F23 a double tap on primary-action leaves the stored session as after the first Confirm, no New game (Fast)`; desktop `AD-14 F8 Enter twice on the focused primary action leaves the seed (Normal)` | android, desktop |

## Plan Change Log

- 2026-10-14: none; plan written after the measurements, so the order S12, S22, `test:all`, `test:screens`, audit held.

## Verification

**Commands:**
- `npm test` x3 in `~/wordcell-watch` -- expected: median of the summary Duration strictly under 5 s (3.00 s)
- `npx vitest run src/engine/view.test.ts` after a newline append -- expected: strictly under 1 s (584 ms)
- `npm run test:all` -- expected: exit 0 (done)
- `npm run test:screens` -- expected: exit 0 (done, 10 passed)

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 6 findings — high 0, medium 0, low 6, false 0, maybe-false 0
- findings:
  - `[low]` `[patch]` S11 tree 2794145 contradicts commit 041af96's git tree — it is the review loop's snapshot tree; both edits now say so.
  - `[low]` `[patch]` S8 cites `layout.spec.ts:286`/`:228` as HEAD facts — now "as logged", with the HEAD location `:306` (rewritten by b94b7b2).
  - `[low]` `[patch]` `main.ts:119` stale — now "logged as l.119, at HEAD `src/main.ts:122`".
  - `[low]` `[patch]` S9 only appended a bullet — one-line "5.15:" notes added to the sweep plan's D7, D8, Review fix and Split lines; the Review Triage Log rows stay as history.
  - `[low]` `[patch]` R-36 and R-50 audit titles were templated and abbreviated — now named as table-row and template titles with file:line.
  - `[low]` `[reject]` the measured figures are unverifiable from the repository — they are run output recorded from this session's logs; nothing to change.

## Auto Run Result

**Summary:** Ticket 5.15 closed with paperwork and measurements only; no source change. AD-17 budget met on the Linux filesystem (median 3.00 s, watch re-run 584 ms), S22 not reproduced, `test:all` and `test:screens` green, all 42 P5 rows of rule-coverage.md map to a passing test. No owner stop.

**Files changed:** the sweep plan (`epic-board-and-gestures/story-refactor-sweep-plan.md`: S8, S9, S16 records), ticket 4.9 Notes (S10), the 4.11 plan (S11), the 5.1 plan Change Log (S21), `epic-tray-and-place.md` Boundaries (S21 clause), this plan (S12, S13, S22, audit).

**Review:** quick lens, 6 findings, 5 patched (all low), 1 rejected. Follow-up review recommended: false (patched counts: high 0, medium 0).

**Verification:** S12 three timed `npm test` runs 3.00 / 2.99 / 3.06 s; watch re-run 584 ms; S22 three runs beside `test:e2e` 6.83 / 6.99 / 8.03 s all green; `npm run test:all` exit 0; `npm run test:screens` exit 0 (10 passed). The five owner-stated minors are resolved above.

**Residual risks:** the S13 spine, epic-file, EXPERIENCE/DESIGN and AGENTS.md edits remain listed-not-made for the owner's retrospective; the unit budget was measured at HEAD 780859a only.

