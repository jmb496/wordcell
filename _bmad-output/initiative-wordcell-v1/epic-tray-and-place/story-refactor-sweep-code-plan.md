---
title: 'Refactor sweep: code (ticket 5.14)'
type: 'refactor'
ticket: '14'
created: '2026-10-14'
status: done
review: 'thorough'
review_source: 'auto'
baseline_revision: 'b352e48774d9503a4311b2aca61465157b4fdece'
route: 'full'
route_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md']
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 5 left code cleanup rows S1–S7, S18–S20 and deferred review minors (ticket 5.14 story file, Description and Rules) open: copied e2e helpers, shared dialog card style, one fractional-width fit bug (S19), weak tests.

**Approach:** Check each row against HEAD first (applied / already satisfied with evidence / premise gone), apply what still stands, and record every row and deferred finding in a table in this plan's Implementation Notes. The story file is the full contract; this plan does not restate it.

## Boundaries & Constraints

**Always:** Follow the story file's Description, Rules and Acceptance Criteria exactly. No existing assertion weakened or removed except where S5/S20 name it. S6 must leave computed styles and boxes of the four consumers identical (record before/after with a temporary uncommitted probe; numbers in the plan). Screenshot baselines unedited; a needed baseline change stops the build and goes to the owner (record in the result). Cite rules by id (AGENTS.md).

**Never:** No src export change, no rendered-output change outside S19, no work on rows S8–S17, S21–S22, no new rule coverage, no push, no regeneration of baselines outside Docker. Do not move helpers outside the S1 list (record extras instead).

</intent-contract>

## Code Map

- `_bmad-output/specs/spec-epic-5-tray/build-notes.md` l.380–405 -- Sweep inventory S1–S22
- `e2e/helpers/*.ts`, `e2e/helpers.spec.ts` -- target for S1 helpers and S4 `openFixture` `{ booted: false }` case (`helpers/board.ts` `openFixture` l.23, `box` l.53)
- `e2e/{column-phases,drag-interruptions,drag,free-letter,success-signal,tile-drag,tile-tap,tray-controls,tray-growth,tap,place,layout,win-guard,wordcell-view,dictionary}.spec.ts` -- S1 local copies (`path`, `plus`, `faceOf`, `idOf`, `css`, `targets`, `onAndroid/onDesktop`, `holdThrough`, `expectFlownBack`, `selection`, `select`, `draft`, `storedText`, `game/storedGame`, `trayOrder`, `cursorIndex`, `wcOf`, `isList`, `placeholder`, `footCorner`, `space`, `Point/Box/Selection`, local `box`es)
- `src/shell/stored-key.ts` `rejectReason`, `src/shell/game.svelte.test.ts` -- S3
- `e2e/layout.spec.ts` banner-during-scroll step; `_bmad-output/implementation-artifacts/review-loop/epic5-banner-scroll-e2e.md` -- S5
- `src/ui/Dialog.svelte`, `src/ui/BlockingMessage.svelte` -- S6 shared card style
- `src/ui/**` CSS -- S7 grep via `git diff main...HEAD`
- `src/ui/tray/WordLine.svelte` `refit()`, `e2e/tray.spec.ts`, `src/ui/Column.svelte` `isGhost` -- S19, S20
- `src/ui/gestures/lookup.ts`, `lookup.test.ts`, `controller.test.ts`, `hover-peek-timer.ts`, `Board.svelte` -- deferred (a)(b)(c)
- `_bmad-output/implementation-artifacts/review-loop/{4-12,5-1,5-2,5-4}-build.md`, epic plans `story-*-plan.md` -- Result/Unapplied minors

## Tasks & Acceptance

**Execution:**
- [x] Row table -- for each of S1–S7, S18–S20, deferred (a)(b)(c) and every other unapplied minor in this epic's review-loop Results and done plans, record the HEAD check and outcome -- plan must map each row
- [x] `e2e/helpers/*.ts`, `e2e/helpers.spec.ts`, affected specs -- S1 move/dedupe helpers, helper → importing specs map, helpers.spec.ts cases -- A5
- [x] `e2e/helpers.spec.ts` -- S4 `{ booted: false }` case
- [x] `src/shell/game.svelte.test.ts` -- S3 AD-7 test pinning `'version' in`
- [x] `e2e/layout.spec.ts` -- S5 only what is still open
- [x] `src/ui/Dialog.svelte`, `src/ui/BlockingMessage.svelte` (+ shared style) -- S6 with before/after computed-style record
- [x] S2, S7, S18 -- confirm at HEAD and record; fix only if trivial per story Rules
- [x] `src/ui/tray/WordLine.svelte`, `e2e/tray.spec.ts`, `e2e/tray.spec.ts` -- S19 fractional fit with red-before/green-after case, plus the three minors
- [x] `e2e/tray.spec.ts` -- S20
- [x] `src/ui/gestures/lookup.ts`, `lookup.test.ts`, `controller.test.ts`, `hover-peek-timer.ts`, `Board.svelte` -- deferred (a)(b)(c)

**Acceptance Criteria:**
- Given the finished build, when `npm run test:all` runs, then it passes with every existing test passing unedited except imports, moved or deduplicated helpers, and the edits the story's Verify lists.
- Given `npm run test:screens` (Docker), when it runs, then it passes with baselines unedited (or the build stops for the owner).
- Given the plan, when read, then every S1–S7, S18–S20 row and every deferred finding maps to a change or a recorded reason.

## Implementation Notes

### Row table (checked against HEAD b352e48 first)

| Row | HEAD check | Outcome |
| --- | --- | --- |
| S1 | Copies found by grep over `e2e/*.spec.ts` | Applied: see the helper map below. |
| S2 | `visibleBand()` in `src/ui/gestures/visible-band.ts`; spine AD-12 (Capability map text "with a dev `?bands=` order that moves a bar off its edge every drag flies back (dev only)") | Record only: the AD-12 record stands, `visibleBand()` unchanged, no fix (a fix would change targeting for a dev-only order). |
| S3 | `rejectReason` in `src/shell/stored-key.ts`; only `toEqual` pinned it | Applied: `game.svelte.test.ts` `AD-7 a rejected session's reason has a \`version\` key only when the version was readable (\`'version' in\`)` (absent for `session-invalid-null`, present for version-unknown and replay-failed). |
| S4 | `openFixture` `{ booted: false }` had no case | Applied: `e2e/helpers.spec.ts` `AD-17 openFixture with { booted: false } returns at the 52 cards without waiting …`: `waitForFunction` (the one call `booted` makes) is counted, 0 with `{ booted: false }`, 1 by default. |
| S5 | `e2e/layout.spec.ts` `panThroughFailure` `settle` still had `min` 2, the contradictory comment, the redundant expects, the hash in the header, `from` 0 | Applied all five: `min` 5.5 for the 21 px slop move and 2.5 per 3 px step, the comment reworded ("each move settles once scrollY has reached its position"), the caller's label as the `expect.poll` message with the three redundant expects dropped, header cites "the ticket 5.2 flake fix", `from` read before the move. Stress: android `banner during a scroll` `--repeat-each=20 --workers=4 --retries=0` 40/40. |
| S6 | `Dialog.svelte` and `BlockingMessage.svelte` carried identical `.card`, `h2`, `p` rules | Applied: new `src/ui/MessageCard.svelte` (card, title, body, buttons as a snippet; `modal`/`positioned` props for the Dialog's `aria-modal` and `position: relative`). Wrappers (`.layer` fixed over a scrim, `.table` in flow) stay per component: they differ in role, only four declarations overlap. Before/after record below. |
| S7 | `git diff main...HEAD -U0 -- 'src/**/*.svelte' 'src/**/*.css'` and `grep -rnE "transition\|animation\|@keyframes" src --include=*.svelte --include=*.css`, plus a grep for inline `style…transition/animation` in non-test `.ts`/`.svelte` | Confirmed none: only three comment lines match (`HoverPeek.svelte`, `WordCellView.svelte`: "no transition"; `controller.ts` l.359 "running animation's effect"). No declaration exists, so nothing to change. |
| S18 | 4-12-build.md Pass 2 minors m3 … m6 | Already satisfied: m3 `e2e/wordcell-view.spec.ts` `AD-13 hover 400 ms, then hold 400 ms: only the peek sheet` (still open at 399 ms); m4 `R-65 hover 400 ms on session-won cell 6 …` / `… cell 8 …` / `AD-12 with the WordCell row under the top bar (?bands=) …` (two-sided `Math.abs(…) ≤ 1`); m5 `story-desktop-hover-peek-plan.md` "R-65 sentence → test" list (Design Notes); m6 the `?bands=` test is named AD-12. |
| S19 | `WordLine.svelte` `refit()` read `line.clientWidth`; 5-1 Pass 4 minors | Applied: `refit()` reads `getBoundingClientRect().width`. Regression `e2e/tray.spec.ts` `AD-11 (R-30) a word line of fractional width, whose clientWidth rounds up past the next size, fits at the largest size its true width holds`: the line is set to `natural[s + 1] − 0.01` with a fraction ≥ .55, so `clientWidth` rounds up to at least `natural[s + 1]`. Red before (`WordLine.svelte` unchanged): `expect.poll(fontSize).toBe(14)` received 15; green after. Minors: COMPACT_SCRATCH comment now `D = 9 1 27`; R-32 k = 2 asserts top and bottom border colours of both block faces, the start's left and the end's right (the old `border-top-color` loop kept); AD-14 case `an Undo from Place remounts the D card …` (session-place column 6 ghost of 28 detached, live card-28 on Undo, live handle detached on Redo). |
| S20 | The three compact R-33 tests asserted tags only; compact R-32 used class counts | Applied: each of the three asserts the used mark (`wordcell-3` `[data-mirror-of="28"]` / `wordcell-4` `[data-mirror-of="35"]` has class `used`); R-33 kept in the names. The R-32 wrapped block: the `.block`/`.start`/`.end` class counts and class checks replaced by non-zero computed `border-left-width` (36, 7) and `border-right-width` (9, 7), one visible `.lock` in each segment's start mirror (36, 7) and none in 9; the existing `.lock:visible` total 2 kept. |
| (a) | `lookup.test.ts` at HEAD | `found` (null and undefined), `cellIn` (cell 4 miss), `columnIn` (index miss and `column` mismatch) already had miss cases; `attribute` had none: added with (c). |
| (b) | Four identical `dispatched` consts in `controller.test.ts` describes | Applied: one top-level `dispatched` beside `navCalls`. |
| (c) | `attribute()` read a missing/empty attribute as 0 (standing); no detach-reset test; comment minors | Applied: `attribute()` throws `AD-12 <name> is missing or empty` on null or blank; four AD-12 Vitests (`'0'`, missing, empty/blank, non-integer); `lookup.ts` header reworded. `AD-12 detach clears the hover-peek suppression slot …` (red with `hover.reset()` commented out, green restored). `Board.svelte` "epic 4 SPEC F20"; `hover-peek-timer.ts` header rewrapped to ≤ 100 columns (comment only). |

### Helper map (S1): helper → importing specs

New modules: `e2e/helpers/project.ts` (`onAndroid`, `onDesktop`; the skip reason is the common wording, the per-spec reasons "touch drag flows", "keyboard flows", "AD-11 touch layout" are cosmetic), `gestures.ts`, `session.ts`, `selection.ts`; `isList` joined `restore.ts`; `Point`/`Box` types and `box`, `trayIds` were already in `board.ts`; `tapAt` was moved by entry 3.

- `onAndroid`: column-phases, drag-interruptions, drag, free-letter, layout, place, success-signal, tap, win-guard, wordcell-view. `onDesktop`: column-phases, drag-interruptions, drag, free-letter, place, tap, win-guard, wordcell-view.
- `plus` (Point adder): column-phases, drag-interruptions, drag, success-signal, tile-drag. `path`: column-phases, drag-interruptions, drag, free-letter, success-signal, tile-drag. `holdThrough` (steps and points copies are one signature; drag.spec's `check` callback is the optional fourth parameter): column-phases, drag-interruptions, drag, success-signal, tile-drag. `faceOf(card)`: column-phases, drag-interruptions, drag; the `faceOf(page, id)` copies of success-signal and tile-drag became `faceOf(tile(page, id))` at every call. `idOf`, `targets`: drag-interruptions, drag. `css`: drag-interruptions, drag, tile-drag. `expectFlownBack(face, rest)`: drag-interruptions, drag (drag's `card` copy: call sites pass `faceOf(card)`). `placeholder`: column-phases, drag, tray-controls (success-signal's `placeholder(page)` fixes column 1: kept local, different signature). `space`, `footCorner`: column-phases, tap (`space` takes the column-phases form, which also counts ghosts; tap's idle fixtures have none).
- `draft`: column-phases, tap (tap's `?? 0` fallback dropped: its one caller runs after a drop, a move exists). `draftDetail` (+ `DraftDetail`): drag. `storedText`: column-phases, drag, success-signal, tap, tray-controls. `game`, `storedGame`: column-phases, drag-interruptions, free-letter, tile-drag (tray-controls: `storedGame`/`storedText` with its `SESSION` key are the same text). `cursorIndex`: drag-interruptions, wordcell-view.
- `selection`, `expectSelection`, `select(page, n, i)`, `wcOf`: tap, drag-interruptions (success-signal: `selection`; wordcell-view: `wcOf`). `Selection` type: in `selection.ts`.
- `isList`: dictionary, layout, tap.
- `box`: wordcell-view's `{x, y, width, height}` copy is gone (call sites read `.w`/`.h` of `helpers/board.ts` `box`, values unchanged).
- Local `Point`/`Box`/`Draft` types removed in column-phases, drag-interruptions, drag, tap, wordcell-view (imported).
- Kept spec-local, with reason: column-phases `selection` (returns a count, not a `Selection`); `select(page, id)` tile selects in free-letter, place, success-signal, tile-drag, tile-tap (different semantics and dependent on each spec's `tile`/`expectSelected`; not a copy of the column `select`); `plus(page)` the `+` button locator in tile-tap, tray-controls, tray-growth (a different thing under the same name; none of them imports the Point adder); success-signal `placeholder(page)`; `box` in board-phases and board.spec (return top/bottom/left/right getBoundingClientRect shapes their asserts use).
- Extras found by grep and NOT moved: `tile`, `tray`, `cell`, `primary`, `sheet`, `controls`, `selectedTiles`, `expectSelected`, `tapTile`, `expectSaved`, `storedMove`, `geometry`/`gapCentre`/`moveFace`/`mid`/`holdTile`/`holdTop`, `ratio`, `hasClass`, `recordFlyBack`/`recordFaceAnimations`, `outline`, `here`, `suppressed`, `activeMs`, `runningAnimations`, `points`, `ghosts`, `expectUsedCell3`/`expectUsed` copies, `open` copies.
- helpers.spec.ts new cases: S4; `plus` and `path`; `onAndroid` does not skip (`onDesktop` is exercised by its desktop consumers); `isList`; `faceOf`/`idOf`/`css`; `targets`; `expectFlownBack`; `placeholder`/`space`/`footCorner`; `holdThrough`; `draft`/`draftDetail`; `storedText`/`game`/`storedGame`/`cursorIndex`; `selection`/`wcOf`/`expectSelection`/`select`.

### S6 before/after (temporary uncommitted probe `e2e/zz-probe.spec.ts`, android 412 × 839, deleted)

Every computed property (all 497 of them) plus the bounding box of the wrapper, card, h2, p and first button of each consumer was dumped before and after; 20 parts compared, 0 differences (`class` names differ only by the Svelte scope hash). Three runs before were identical. Consumers: History notice, Reset confirm (Dialog; flows `history-invalid-version-unknown` then Reset history), rejected-root (`session-invalid-null`), Halted (woff2 404). Key numbers, before = after:

| Surface | wrapper box | card box | h2 box | p box |
| --- | --- | --- | --- | --- |
| notice | 0, 0, 412 × 839 | 46, 282, 320 × 276 | 70, 306, 272 × 56 | 70, 370, 272 × 96 |
| confirm | same | 46, 332, 320 × 176 | 70, 356, 272 × 28 | 70, 392, 272 × 24 |
| rejected | same | 46, 292, 320 × 256 | 70, 316, 272 × 56 | 70, 380, 272 × 72 |
| halted | same | 46, 330, 320 × 180 | 70, 354, 272 × 28 | 70, 390, 272 × 24 |

Every card: padding 24 px, border 0, radius 12 px, background rgb(40, 44, 52), margin 0, width 320 px; h2 20 px font, margin 0; p 16 px font, margin-top 8 px; wrapper padding 16 px.

### Deferred minors (every unapplied minor in the epic's review-loop Results and done plans, not owned by S1–S22)

| Source | Finding | Outcome |
| --- | --- | --- |
| 5-1 Pass 4 | COMPACT_SCRATCH order, R-32 outline, isGhost AD-14 | S19. The 5.1 plan Change Log entry is S21 (paperwork). |
| 5-2 | two minors | S20. |
| 5-3 #1 ActionBar ellipsis font | Standing; a src fix changes the rendered label ellipsis | Not applied: rendered-output change outside S19 (contract Never). For the owner. |
| 5-3 #2 `button != null` guards | Standing; they narrow the `bind:this` ref type (the same pattern as `WordLine.svelte`) | Not applied: not behaviour-neutral without a throw, src outside the Interface list. |
| 5-3 #3 `+` pressed with `locator.click()` | Standing | Applied: `tray-controls.spec.ts` (two taps) use `tapAt(page, await centre(plus(page)))`. |
| 5-3 #4, #5 names carrying R-31 | Standing | Not applied: the story's Verify allows renames only per S20. |
| 5-3 #6 `count.scrollWidth ≤ clientWidth` always true | Standing | Applied as an addition: `caption.right ≤ count.left + 0.5` (old assert kept; nothing weakened). |
| 5-3 #7 R-30 Flip on a QU tail, #8 plan wording | Paperwork / coverage note | Not applied: plan and rule-coverage prose is CAP-12 scope. |
| 5-4 | `attribute()`, detach reset, `Board.svelte`, `hover-peek-timer.ts` | (c). Its CAP-12 paperwork item is outside code scope. |
| 5-5 #1 plan/build-notes wording | Paperwork | Not applied (CAP-12). |
| 5-5 #2 `TileRows.svelte` comment | Standing | Not applied: src comment edit outside the 5-4 list the Verify names. |
| 5-5 #3 compact tap above row 2 and above row 1 | Standing | Applied: `tile-tap.spec.ts` `AD-12 F2 full pitch in a compact tray: a tap 1 px above a row-2 block mirror keeps the selected tile; a tap 1 px above row 1 …`. |
| 5-6 majors/minors (insertionIndex distance; plan, tickets.toml wording) | The `insertionIndex` Euclidean case was still missing | Applied: `targeting.test.ts` `AD-12 insertionIndex distance is Euclidean (F3) …` ((30, 0), (20, 20), (22, 13) from (0, 0): Euclidean, Manhattan and Chebyshev all pick differently). The plan and tickets.toml items are paperwork. |
| 5-7 | build-notes, plan rows, test name R-51 | Paperwork not applied; the rename is not allowed by Verify. |
| 5-8 | plan wording | Paperwork. |
| 5-9 #1 `intent.test.ts` impossible `none` | Standing | Not applied: Verify forbids removing an assertion (the throw alternative changes src). |
| 5-9 #2 "opens no view" vacuous | Standing | Applied: `controller.test.ts` gives cell 4 a card before the not-legal tap, so a view could open. |
| 5-9 #3 `expectSaved` polls | Already satisfied: `place.spec.ts` `R-60 R-52 R-73 (UI) Confirm on …redo-tail…` counts one `wordcell:session` write right after Confirm. |
| 5-9 #4 timing races | Standing | Applied: the drag cases assert no sheet; both long-press cases arm the storage spy and assert one `wordcell:session` write, cursor and `placementOrder` unchanged. |
| 5-10 #1, #2, #3, #7 flip tests | Standing | Applied: the 0.5 px case now also covers a columns → tray band changer at exactly (0.5, 0); kind-table row `non-committing redo to Place`; `reduced is read at each play` (both directions); `a non-null kind with no moved face starts nothing`. |
| 5-10 #4 reduced fade easing (`flip.ts`) | Standing | Not applied: src and rendered-output change (fade easing), outside the contract. For the owner. |
| 5-10 #5 plan/tickets.toml, #6 optional F27 pin | Paperwork / optional and "already true by construction" | Not applied. |
| 5-13 minors | `inUndo` `typeof closest` guard: it handles `document`/`window` targets (no `closest`) and the fake targets of `motion.test.ts`, so it is not defensive; the rest (Meta keyup on macOS, e2e fixed waits, lost pointerup, silent `notifySettled`, plan refresh) are behaviour or paperwork | Not applied; no code change stands. |
| 5-16 open major | The capture = play invariant has no test for free-letter drag ends, sameId, tail null-highlight up, longPress, sheet/scrim | Not applied: a major, outside the minors set, and the log's own reading found no pending-capture path. Reported to the owner. Its minors (P5 press timing, no e2e glide = snap, gate-idle e2e) are the same kind: not applied. |
| 5-12 open major | e2e scroll-busy Confirm test is timing-fragile | Not applied: a major outside the set; the test was rewritten to a smooth scroll and proven red without `gate.scrollReset()`. Reported. |
| 5-17 #1 – #3 | e2e `success-signal.spec.ts` | Applied: non-dispatching taps wrapped in `expectNoDispatch` (Session reference and stored text unchanged), `expectDragging` before each drag release, `glidesSettled` before each geometry read. |
| Done plans' `deferred` frontmatter | controller-seams miss paths (a), flip gate-idle and main.ts wiring, free-letter row-break and ≥ 15 tiles clip, `slotRects` vs rendered rects, tile-tap epic 6 key commands and aria | (a) done; the rest are test-gap notes owned by other CAPs or epic 6 (Non-goals) and not behaviour-neutral code scope: recorded, no change. |

### Verification run

- `npm run test:all`: exit 0 (lint, check, unit 55 files / 2393 tests, build with size budget, `test:e2e:dist` 14 passed, `test:e2e` 552 passed / 510 skipped by project, `test:e2e:pwa` 12 passed).
- `npm run test:screens` (Docker): 10 passed, baselines untouched (`git status` shows no PNG change).
- Red before / green after: S19 (received 15, expected 14, then green); the detach-reset Vitest (red with `hover.reset()` commented out).
- Reported, not changed: the open majors of 5-12 and 5-16 and the two rendered-output minors (5-3 #1, 5-10 #4), listed in the table above.

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 29 findings (blind 10 listed groups, edge 8, gap 2, intent summary) — high 0, medium 1, low 5, false/reject rest
- findings:
  - `[low]` `patch` helpers.spec.ts tautological `destinationSide`/`arrangement` asserts — removed; helper tests re-run green
  - `[medium]` `defer` S6 parity has no committed computed-style test — the story prescribes a temporary probe and forbids new baselines
  - `[low]` `reject` onAndroid test assertion vacuous — the call itself skips on desktop; fix is more than a correction
  - `[low]` `reject` helpers.spec `space` branch, `waitForFunction` count coupling, 1 px tolerance, tile-tap y-1 tap — test-only fragility, no demonstrated failure
  - `[false]` `reject` WordLine `getBoundingClientRect` vs transform/border — the story prescribes it and `measure()` already uses it
  - `[false]` `reject` draft()/space() fallbacks dropped — one caller each, run after a move exists (plan helper map); suites green
  - `[false]` `reject` R-32 compact assertions weakened — S20 prescribes exactly this replacement
  - `[low]` `reject` header-comment width, removed commit hash (S5 prescribes), plan frontmatter staleness, `attribute()` throw (prescribed by deferred (c)), S19 .5/.55 comment wording
  - intent-alignment: descriptive only; diff implements reading A with C constraints; no divergence requiring action

## Verification

**Commands:**
- `npm run test:all` -- expected: all suites green
- `npm run test:screens` -- expected: green, baselines unchanged

## Auto Run Result

- Summary: S1–S7, S18–S20 and the deferred set applied or recorded; see Implementation Notes row table.
- Review: 1 patch applied, 1 deferred (S6 committed parity test), rest rejected with reasons above. followup_review_recommended: false.
- Verification: `npm run test:all` exit 0; `npm run test:screens` green, baselines unchanged.
- Owner input: ActionBar ellipsis font size and FLIP reduced-fade easing minors (rendered change, not applied); open majors in 5-12 and 5-16 review logs untouched.
