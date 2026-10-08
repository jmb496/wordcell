---
epic: epic-board-and-gestures
date: 2026-10-07
verdict: accepted-with-open-items
criteria: declared
headless: false
---

# Epic 4 retrospective: board and gestures

## Epic summary

Epic folder `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/`, 13 tickets (4.1–4.13), all `done` (`tickets.py status`, 2026-10-07); none at `built`, `pending_tickets` empty. Branch `epic-4-board` from main a887379; epic range a887379..34b43e8 (165 commits, 0 merges).

Plan ranges (baseline to next baseline; 4.13 to HEAD 34b43e8, inferred):
4.1 c3e49c1..17cfcad (13 commits) · 4.2 17cfcad..b48f466 (9) · 4.3 b48f466..dfa68a1 (10) · 4.4 dfa68a1..b88105e (11) · 4.5 b88105e..33015bf (11) · 4.6 33015bf..7766b23 (12) · 4.7 7766b23..472db52 (10) · 4.8 472db52..996fd04 (13) · 4.9 996fd04..2d503b0 (15) · 4.10 2d503b0..69bf8b2 (11) · 4.11 69bf8b2..fa088cd (13) · 4.12 fa088cd..3014424 (14) · 4.13 3014424..34b43e8 (7). a887379..c3e49c1 (16 commits) is epic inception (spec, tickets, 4.1 ticket review).

Going-in concerns (owner's resume prompt, 2026-10-07): the "banner during a scroll" flake, the 4.9 F32 e2e that may flake, the unit-suite budget, the close-out doc edits.

Evidence inventory (all present): epic file with Done when 1–6 (declared); SPEC.md (F1–F35), rule-coverage.md, build-notes.md in `_bmad-output/specs/spec-epic-4-board/`; 13 ticket files, 13 ticket review logs, 13 plans (each with `baseline_revision`); 14 code review logs `_bmad-output/implementation-artifacts/review-loop/4-*-build.md` plus `4-9-f32.md`; the autopilot digest `_bmad-output/implementation-artifacts/autopilot/epic-board-and-gestures-20261001-1955.md` and handoff; driver logs `.autopilot/driver-epic4.log`, 23 loop-session folders and 170 step logs under `.autopilot/` (git-ignored, local only; the session records most likely to expire); the epic 3 retrospective for follow-through. Missing: interactive transcripts for the owner-steered 4.9 F32 build (2026-10-05); its review log stands in.

## Findings

Five analyses ran as fresh-context subagents on 2026-10-07 (aggregate views; spec reconciliation; `bmad-review` with the adversarial, edge-case and verification-gap lenses over a887379..HEAD `src/` `e2e/`, weighted to ticket boundaries; previous-retro follow-through; a scripted behaviour walk). Findings already recorded as known (the "banner during a scroll" flake, the unit budget, the Result-section leftovers of `review-loop/4-12-build.md` and `4-13-build.md`, the 4.11 deferrals) are not repeated. F1 was re-checked against `src/ui/gestures/controller.ts:556-565` by the orchestrator.

### Diff-scope review (ticket boundaries)

- **F1 — major, fix now.** F34 clipping (4.13) vs Q-34 source rule (4.8): `dragMove` sets `drag.hasLeftSource = true` whenever `raw !== drag.source` (`controller.ts:565`); with the source column clipped to the visible band, a press on a card mostly under the top or action bar gives `raw === null` on the first move, so the tail counts as having left its column without moving, and a release back over the visible part of the same column dispatches a drop onto the source. Untested. Prevention: when a later ticket changes an input to a shared rule (here the rects fed to `pickTarget`), its ticket review must list the rule's other consumers.
- **F2 — major, latent, defer to epic 6 as a blocker.** 4.9 vs 4.11: `overlays.deselect()` throws unless the selection is the top entry (`overlays.svelte.ts:101-105`) and `openDeferred` throws with two entries (`:192-195`), while `openPeek`/`peekToSticky` allow a sticky view over a kept selection (`:118-139`; reachable, `controller.test.ts:1168`). Today only `inert` on `.board` and the scrim keep Undo/Redo/Reload out of reach; epic 6's key commands would hit the throw (AD-15 halt). Owner question (Q-21 scope): see Open questions.
- **F3 — minor, defer to epic 6.** Desktop wheel scroll during a mouse drag: the drag offset is pointer delta only (`controller.ts:551-554`), no scroll listener, so faces and highlight go stale and a release drops on the pre-scroll target.
- **F4 — minor, owner question.** The overlap uses the visible part of a long column, but the highlight sits on its bottom card (`targetElement`, `controller.ts:524-532`), which can be under the action bar: a drop can land with nothing lit on screen. Predates F34; F34's intent is half met.
- **F5 — minor, fix now.** F34 with the real dictionary banner has only a unit test with made-up rects (`controller.test.ts:1960-1976`); the one F34 e2e (`e2e/drag.spec.ts:608-655`) has no banner.
- **F6 — minor, defer to epic 6.** Hover-peek repositioning on a layout change (`HoverPeek.svelte:40-62`) is never asserted after open.
- **F7 — minor, defer and verify.** Hide flush `controller.cancel()` (`main.ts:136`) of a drag that replaced a selection calls `overlays.deselect()` → `nav.pop()` → `history.back()` during pagehide (`nav.ts:37-46`); after a bfcache restore nav may still count a pending back and swallow the next real back. Inferred, not reproduced.
- **F8 — accept.** Selected faces drop 12 px when a drag starts above the selection (`controller.ts:500`): matches F33(b) as written; optionally pin with a test.

### Aggregate views

- **Architecture delta — clean.** No layer violations at HEAD (ui imports engine as `import type` only; shell never imports ui). New hub `src/ui/gestures/controller.ts` (imports shell game/prefs, geometry, motion, overlays, six gesture modules; `:92-109`); `overlays.svelte.ts` fan-in grew from about 4 to 12 ui modules and from ~40 to 256 lines (`:25-30`: stack, selection, endSheet, peek, viewCell, hoverPeek) — accept, watch. The controller and Column.svelte share raw class-name strings (`controller.ts:196-205` vs 28 `:global` selectors in `Column.svelte`) — defer: one shared constants module. Shell cycles game↔history, game↔prefs predate the epic — accept.
- **Size growth — F9, defer to a refactor ticket in epic 5.** `controller.ts` is 984 lines, one `createController` closure (`:297-984`) with about 45 inner functions and 7 responsibilities (press machine, tap actions, drag, fly-back, visible band, hover classes, desktop hover peek), plus a 90-line per-ticket header (`:1-90`). Seams: visible band, hover peek and fly-back as modules behind the existing `deps` pattern.
- **F10 — fix soon (feeds the AD-17 decision).** `controller.test.ts` is 3118 lines, 133 tests in one file; `setup()` calls `vi.resetModules()` (`:405`) 129 times, and Vitest runs one file's tests serially, so it is the 3.5–4.0 s critical path of the unit suite (`story-refactor-sweep-plan.md` §Timings). Split: move the harness (`:1-543`) to a non-test module and the describe groups into about five files.
- **Duplication — F11, fix now (test-only).** e2e helpers copied between specs: `tapAt` byte-identical in 4 files, `path` in 3, `onAndroid`/`onDesktop` in 6; near-duplicates `plus`, `holdThrough`, `faceOf`, `idOf`, `css`, `expectFlownBack`, `targets`, `selection`/`expectSelection`/`select`, `draft`/`storedText`, `game`/`storedGame`, `trayOrder`, `cursorIndex`; a local `box` in three specs although `e2e/helpers/board.ts:43` exports it. Move them into `e2e/helpers/`. Production: the cell/column lookup with its own throw is written 7 times (`controller.ts:229,904,468`, `intent.ts:64,103`, `HoverPeek.svelte:29`, `WordCellView.svelte:22`); `clip` lives in the controller beside `targeting.ts`'s `area`/`intersection` — defer with F9.
- **Pattern divergence — clean except two.** Single-owner rules hold at HEAD (WAAPI durations via `duration('flyBack')`; `console.error` only `main.ts:51`; `localStorage` only `storage.ts`; no History API or `popstate` outside `nav.ts`; `data-testid` only the allowed ids; every App button through `act()`; every new test name starts with an id). Divergences: `aria-label="WordCell {cell.cell}"` hard-coded at `WordCellRow.svelte:47` instead of `text.ts` (defer to epic 6 accessibility); per-ticket "Entry N" comment paragraphs in `controller.ts` and `Column.svelte` read as change history (defer with F9).

### Spec-to-implementation reconciliation

- Sample checks F27, F28, F31, F32/F33, F34 all match code and tests (`text.ts:54,57`; `intent.ts` `dropSelf` + `tap.spec.ts:757`; `geometry.ts:20` `SELECTION_LIFT_PX`; `controller.ts:543`).
- **F12 — fix now (test name).** Done when 1: no test carries `Q-18`; `rule-coverage.md` says "Covered by the R-14 tap rows; no separate test". Add Q-18 to the tap test's name.
- **F13 — record.** F34 vs dev `?bands=` (F22): a bar moved off its edge clips every column and every drag flies back (`visibleBand()`); dev-only. Record in the AD-12 close-out note (`review-loop/4-13-build.md` minor 2).
- **F14 — docs.** Stale wording now contradicting F34: CLAUDE.md rule 4 (AGENTS.md:10, "whole hit rect") and build-notes CAP-7 ("sticky bars do not clip them"); F25/CAP-4 "spans the viewport" vs F30; CAP-6 hover classes are on `[data-column]`, not the cards (`controller.ts:18-19`); CAP-3 insets probe is `position: fixed` (`layout.svelte.ts:70`), not absolute; the epic file says "F1–F29". All in Close-out docs below.
- **F15 — record.** F32 and back: a back during a drag of a selected card lands the faces unlifted (`closedByBack` clears the selection; tested "AD-12 F32 select, drag a selected card, back …"); F32's wording has no such exception. Name it in the AD-12 close-out sentence.
- **F16 — record.** The owner's 2026-10-02 bar-sizing answer (bars 44/60 px plus safe-area padding) has no F-row; it lives in build-notes CAP-1 and the digest; code (`geometry.ts` `baseHeights`) and DESIGN.md (lines 145, 377) agree. Add as F36.
- Paper drift (no action beyond the close-out list): build-notes component tree omits `hover-peek.ts`, `layout/tray.ts`, `gestures/{classify,intent,drop-target,click-swallow}.ts`; the sweep plan has per-file times for the 5.47 s run but not the final 5.62 s.

### Process (digest, review logs, driver log)

- **P1.** Ticket reviews ran long on the late tickets: 4.12 6 passes (majors 7, 6, 6, 3, 1, 0), 4.13 7 passes (15, 9, 8, 6, 6, 2, 0; 2073 words vs a 1500 budget). The sweep ticket carried 20 inventory rows (D1–D20) and two goals (plan `warnings: ['oversized', 'multiple-goals']`). Lesson: split a sweep with more than ~10 inventory rows into a code-change ticket and a paperwork ticket.
- **P2.** The "banner during a scroll" e2e flaked in 4.5, 4.7, 4.8, 4.9, 4.10, 4.12 and once more in 4.13's review after its fix (`review-loop/4-13-build.md` Result). Five greens followed; the ticket's rule makes the next failure an owner stop.
- **P3.** Usage-limit handling worked: 4.12 paused at ticket review pass 3 (driver log 11:15) and resumed cleanly at 15:18; the `LIMIT_CHECK=off` and stale-cache single-ticket paths both behaved as designed.
- **P4.** The screenshot suite was unrunnable from 4.10 to 4.13 because Docker Desktop's WSL integration was off; fixed 2026-10-07, and `test:screens` green (8 passed).

## Behavior verification

A scripted Playwright walk on the dev server (scratch spec reusing `e2e/helpers`, 2026-10-07, all 7 walks passed, no console errors, no page errors, no fatal surface):

1. `android`, `session-idle-fresh`: column 1's bottom card held over column 3 lights only column 3 (3 px outline), storage unchanged while held; release enters Composing with one move, tray = column 3's bottom card as the locked mirror then the dragged tile; `wordcell:session` equals the store. The letters are A (card 0) and W (card 48); the epic's Done when 2 and the comment at `e2e/drag.spec.ts:236` say "D mirror … S tile" — wording only, the test asserts ids (Close-out C41).
2. `android`: held over column 1 alone, and released over the WordCell row: no highlight on any step, still Idle, stored Session byte-identical, no view opened.
3. `android`, `session-idle-empty-column` cell 7: long-press peek after 500 ms (L D X O M I W), no history entry, closes on release; tap opens the sticky view "WordCell 7 · 7 cards" with one history entry; back closes it and pops the entry.
4. `android` 412 × 600, board scrolled 122 px so column 3's top 78 px is under the top bar: a tail dragged under the bar and across lights nothing on 12 moves; release flies back exactly, Session identical (F34).
5. `desktop`: hover peek on cell 7 absent at 200 ms, present by 500 ms above the row; `pointer-events: none`, `aria-hidden`, `elementFromPoint` at its centre is the board; closes when the mouse leaves.
6. 52 `data-card-id` elements in Idle, Composing (with 2 mirrors) and with the sticky view open on `android`; Idle and Composing on `desktop`.

Not exercised: a real phone (owner device checks: F32/F33 lift, the 4.11 peek and view, F34), the deployed site (Done when 6).

## Previous-retro follow-through

Epic 3 retrospective (`epic-app-shell/epic-app-shell-retrospective.md`), every item checked:

- Close-out C1–C10 (owner/technical) — landed before epic 4: `521b5dc`.
- AGENTS.md G1–G5 — landed before epic 4: `1e57edb`. G3's Where-things-are list is stale again after epic 4 (G-items below).
- B9 dispatch replay cost (Dev) — carried to epic 7 (C-E7a, epic 3 retro Later epics; epic 4 SPEC.md:364).
- B10 second half, autopilot logs in `.autopilot/` (Owner) — landed before epic 4: `5e565f7`.
- R1 before-back hook in nav (Dev) — partly: code `9c25a0c` (`nav.ts:125-128,147`, `main.ts:138`; tests `nav.test.ts:408`, `drag-interruptions.spec.ts:251`); the AD-13 spine record is close-out C11.
- R2 / C-E4b / S2 cancel-first everywhere and the hide assertion (Dev) — landed: `9c25a0c`, `8ce0a98` (`src/ui/act.ts`, `act.test.ts:19`, `drag-interruptions.spec.ts:173,419`); spine fold is C13/C14.
- C-E4a board letters asserted in the DOM (Dev) — landed: `55e6beb` (`e2e/smoke.spec.ts:72`).
- R6 store helpers (Dev) — landed: `921c0c5` (`src/shell/stored-key.ts`).
- R7 history tests moved (Dev) — landed: `921c0c5` (`src/shell/history.svelte.test.ts`).
- Item 4, stop and split the spec if review majors rise (Owner/process) — landed: `SPEC.review-log.md:6`; majors 19, 11, 9, 7, 3, 3, 0 never rose.
- P1/P3/B10 logs and close-out lines at mark-done (Owner) — landed before epic 4 (`5e565f7`); every digest entry carries a Close-out docs line.
- C-UI1 (epic 5), C-E56 (epics 5/6), R4 (epic 6), I-68 (epic 6), epic 7 device checks, Q-42 SW proof (epic 7) — carried, not due in epic 4 (SPEC.md:363-365).

## Action items

Proposed; nothing is applied by this run. Owner-decided items are backed by an F-row owner answer; the rest are technical defaults (wording that matches the as-built, no behaviour change).

### Close-out docs

Spine = `_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md`; UX = `_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/`; BN = `_bmad-output/specs/spec-epic-4-board/build-notes.md`.

| # | Action | Kind / source |
|---|---|---|
| C1 | Spine AD-11 bands: `bannerShown` is a gate-latched copy of `dictionary.showBanner` (`failed`, or the Q-42 banner kept during an SW retry); the Validate label reads the live state. | technical (F20, Q-42 wins); BN:22-24 |
| C2 | Spine AD-11: `cardWidth(clientWidth, innerHeight, insets, hoverFine)` with `clientWidth` = `document.documentElement.clientWidth` (stable via `scrollbar-gutter: stable`); `innerWidth` only in the w-recompute predicate. | technical; BN:25-26 |
| C3 | Spine AD-11: replace "has two entry points" with the real exports: `cardWidth`, `bands`, `cardMetrics`, `availableWidth`, `trayGrowth`, `anchorScroll`, `shouldRecomputeWidth`, `SELECTION_LIFT_PX` (single owner of the 8 px selection lift, fed to CSS as Board's `--wc-select-lift`); `bands.ts` `parseBandsParam`; `layout/tray.ts`. | owner (F32/F33); BN:46-48 |
| C4 | Spine AD-12 hit rects: tile drags use the tray band; tile taps, column cards and WordCells hit-test on the full slot pitch (slot wrapper w + 4 carrying `data-card-id`, `pointer-events: none` face), so the selection lift moves only the face. | technical (F26); BN:39-40 |
| C5 | Spine AD-12 drop target: column hit rects are clipped vertically to the visible band (from the lower of the top bar's and a shown banner's bottom to the action bar's top); a column under a bar is never a target and a release there flies back (F34); with a dev `?bands=` order that moves a bar off its edge every drag flies back (dev only, F13). | owner (F34) |
| C6 | Spine AD-11 bars: the top and action bars are content-sized, 44 px and 60 px plus `env(safe-area-inset-top/bottom)`; `bands()` returns those sums, equal to the rendered bars. | owner 2026-10-02 (F36, F16) |
| C7 | Spine AD-12 cancel-first: every App-owned button (Undo, Redo, menu and items, dialogs, notices, dictionary banner, Session-rejected New game) goes through `act()` (`src/ui/act.ts`), which calls `cancel()` first, as do key commands and back (AD-13); Halted's Reload is exempt. | technical (F9); BN:18-21 |
| C8 | Spine AD-12: `pointercancel`/`lostpointercapture` end a drag with no command and fly it back. | owner (F13, F24, F28); BN:33-38 |
| C9 | Spine AD-12 selection-replacing drag: released over nothing or ended by a plain `cancel()` → nothing selected, entry closed; ended by the platform → flies back and restores the earlier selection, classes and entry (F28); as the before-back hook → flies back without deselecting, then `closedByBack` clears it; `cancel()` from `act()` or before-hide settles at once with no fly-back (F13). | owner (F13, F24, F28) |
| C10 | Spine AD-12 lift during drag: a dragged stack inside a tap selection keeps the 8 px lift (`SELECTION_LIFT_PX`) in its transform; a restoring fly-back lands on the lifted slot with lift, outline and `Here` returning at its start under both motion settings; a stack dragged from above the selection is drawn evenly; a back that clears the selection lands the faces unlifted (F15). | owner (F32, F33) |
| C11 | Spine AD-13: the controller registers the before-back hook (`cancel({ byBack: true })`) through `nav.registerBeforeBack(fn)`, called once by `main.ts`; throws before `launch()` resolves or on a second call; runs only for a current-launch `popstate` nav did not start with a numeric `wc`, before the Forward check and the close callback. | technical (F7, R1); BN:10-15 |
| C12 | Spine AD-13 reload cases: epic 4 re-proves the one-overlay case with a tail selection and with the sticky view; the two-plain-overlay case is proven in epic 6 (menu plus confirm). | technical (F16); BN:27-28 |
| C13 | Spine AD-9 Playwright line: `hidePage` mid-`touchHold` drag returns the tail, writes `wordcell:session` once, dispatches nothing (`drag-interruptions.spec.ts` "AD-9 AD-16 AD-17 hidePage mid-touchHold drag cancels it first…"). | technical; BN:16-17 |
| C14 | Spine AD-17 Time and hide: append the gesture-cancel test name as in C13. | technical; BN:16-17 |
| C15 | Spine AD-17 Touch: `touch.ts` also exports `touchHold(page, from)` → `{ moveTo(point), end() }`. | technical (F10); BN:52 |
| C16 | Spine AD-17 Speed: the architecture tests are split (`architecture-tree-scan`, `-ad1`, `-ad2-ad12-ad17` `.test.ts` plus `architecture-scan.ts`) and informational; epic 4 warm median 5.62 s on `/mnt/d` (3.14 s on the Linux filesystem), critical path `controller.test.ts`, accepted for now (F35); plus the owner's budget answer (Open question 1). | owner (F35) |
| C17 | Spine lines 79, 886, 925, 956 (and 968 as history): `src/architecture.test.ts` → the three `architecture-*.test.ts` files and `architecture-scan.ts`. | technical; sweep plan |
| C18 | Spine Structural Seed (lines 882-883): `layout/ (bands.ts, geometry.ts, layout.svelte.ts, tray.ts)`; `gestures/ (controller.ts, classify.ts, intent.ts, targeting.ts, drop-target.ts, gate.ts, click-swallow.ts)`; `act.ts`; `hover-peek.ts`; shell `stored-key.ts`. | technical |
| C19 | Spine Proposed epics row 4 gains "every `GameView` board state, a static tray (live tiles, no gestures) and the Composing column gestures (F1/F2/F17, moved from row 5)"; row 5 becomes "Tray interactions (tiles, destination block, D-block controls);". | owner (F1, F2, F17, F29); BN:29-32 |
| C20 | EXPERIENCE.md message catalogue: hover peek line `+1 older card` / `+n older cards`; new row "WordCell view and peek title (R-65): `WordCell 6 · 7 cards`; one card `WordCell 6 · 1 card`". | owner (F27); BN:59-61 |
| C21 | EXPERIENCE.md Drop targeting step 6: released with no command → nothing selected, entry popped; interrupted by the platform → flies back and restores the earlier selection (lift, outline, foot states, entry). | owner (F24, F28); BN:62-65 |
| C22 | EXPERIENCE.md Pointer thresholds: a column drag that replaced a tap-selection also restores it on `pointercancel`, and a following back clears it by the normal rule; "(the cancel has already ended any selection)" → "(the back closes any tail selection)". | owner (F24, F28); BN:66-68 |
| C23 | EXPERIENCE.md Drop targeting step 2: hit rect clipped to the part visible between the sticky top bar (and a shown banner) and the action bar (F34). | owner (F34) |
| C24 | DESIGN.md drop target: on desktop hover with a whole column tap-selected, hovering its empty space or `Here` pad lights the `Here` pad with the teal 3 px outline and 12 % wash. | owner (F31); BN:72-74 |
| C25 | DESIGN.md card states and line 426: *dragging* keeps a selected stack's 8 px lift, so it neither jumps at pickup nor snaps after a cancelled fly-back. | owner (F32) |
| C26 | DESIGN.md hover peek (lines 517-519): view-sheet surface, content-sized `min(n, 7)·(w + 4) − 4 + 32` px; below the cell only with no room above (dev `?bands=` orders). | technical (4.12); BN:75-80 |
| C27 | AGENTS.md rule 4 (outside the managed block, hand edit): "dragged card vs whole hit rect clipped to the visible band between the sticky bars, AD-12, F34". | owner (F34) |
| C28 | BN CAP-6: hover outlines are classes on the column (`[data-column]`), set by `pointerover` plus `refreshHover()`. | technical |
| C29 | BN CAP-3: the insets probe is "a fixed-position, invisible element". | technical |
| C30 | BN CAP-7: "rendered rects clipped vertically to the visible band between the sticky bars (F34)". | owner (F34) |
| C31 | BN CAP-4 and SPEC F25/CAP-4: the root "spans the viewport except the desktop `scrollbar-gutter` strip (F30)". | owner (F30) |
| C32 | BN CAP-1: "Entry 4 feeds real insets; `bands()` bar heights equal the rendered bars." | technical |
| C33 | BN spine list lines 16-17: name the hide test as in C13. | technical |
| C34 | BN component tree: add `hover-peek.ts`, `layout/tray.ts`, `gestures/{classify,intent,drop-target,click-swallow}.ts`. | technical |
| C35 | SPEC.md Constraints: "whole hit rects clipped to the visible band (F34)". | owner (F34) |
| C36 | Epic file lines 15 and 40: "F1–F29" → "F1–F36". | technical |
| C37 | SPEC.md: add F36, the owner's 2026-10-02 bar-sizing answer (Option A). | owner 2026-10-02 (F16) |
| C38 | Epic file Done when 2 and `e2e/drag.spec.ts:236` comment: the tray shows column 3's bottom card (A) as the locked mirror, then the dragged tile (W) — not "D mirror … S tile". | technical (behaviour walk 1) |

### AGENTS.md managed block (through `bmad-project-context`)

| # | Action |
|---|---|
| G1 | Lines 38, 48, 71, 81, 84: `src/architecture.test.ts` → the three `src/architecture-*.test.ts` files and `src/architecture-scan.ts` (excluded from the tree scan; export check in `architecture-ad2-ad12-ad17.test.ts`). |
| G2 | Where things are: add `src/shell/stored-key.ts` (F18 helpers; imports no store and not `./storage`), `src/ui/layout/`, `src/ui/gestures/`, `src/ui/act.ts`, `e2e/helpers/board.ts`. |
| G3 | Conventions cancel-first sentence: every App-owned button goes through `act()` (`src/ui/act.ts`); Halted's Reload exempt. |
| G4 | Running and verifying, 5 s budget lines: per the owner's answer to Open question 1. |

### Code (normal dev loop; proposed)

| # | Action | Owner / when |
|---|---|---|
| A1 | F1: decide `hasLeftSource` from the unclipped source rect (or only when `raw` is another column); controller Vitest with a bar covering about 80 % of the grabbed face. | Dev, before the epic 4 merge |
| A2 | F5: android e2e for F34 with the dictionary banner shown. | Dev, with A1 |
| A3 | F12: add `Q-18` to the R-14 tap test's name. | Dev, with A1 |
| A4 | F10: split `controller.test.ts` (harness module + about five files); re-measure AD-17. | Dev, with A1 or first ticket of epic 5 (Open question 1) |
| A5 | F11: move the copied e2e helpers into `e2e/helpers/` with `helpers.spec.ts` cases. | Dev, epic 5 refactor sweep |
| A6 | F9: split `controller.ts` along its seams (visible band, hover peek, fly-back); one lookup helper for cells/columns; shared class-name constants; replace the per-ticket header with a behaviour summary. | Dev, epic 5 refactor sweep |
| A7 | F2: resolve a sticky view over a kept selection before epic 6 adds key commands (owner answer, Open question 3). | Dev, epic 6 (blocker) |
| A8 | F3 wheel during a mouse drag; F6 hover-peek re-anchor test; F7 hide-flush back after bfcache (verify first); `WordCellRow.svelte:47` label into `text.ts`. | Dev, epic 6 |
| A9 | The 4.12 and 4.13 Result-section minors (`review-loop/4-12-build.md`, `4-13-build.md`) and the earlier logs' unapplied minors. | Dev, epic 5 refactor sweep |

### Process

| # | Lesson | Owner |
|---|---|---|
| L1 | A ticket that changes an input to a shared rule lists the rule's other consumers in its ticket review (F1). | Process (review-loop reviewers) |
| L2 | Split a refactor sweep with more than ~10 inventory rows into a code ticket and a paperwork ticket (P1). | Owner/process |
| L3 | Keep the screenshot suite in every ticket's `test:all` gate now that Docker works from WSL (P4). | Owner |

## Acceptance verdict

**accepted-with-open-items** (criteria declared in the epic file's Done when).

1. `test:all` green 2026-10-07 21:40-21:45 (digest: unit 2058, e2e 371, pwa 12, dist 14); `test:screens` green 2026-10-07 (8 passed, no baseline change; no rendered-UI change after it). Every P4 row has an `android` test named with its id (desktop where needed; `?bands=` dev in `board.spec.ts`, production in `e2e/pwa/dist-smoke.spec.ts:36`), except Q-18 (A3). **Met, one naming gap.**
2. `e2e/drag.spec.ts:200`, `:243`, `:405`; `e2e/wordcell-view.spec.ts:208`; behaviour walk 1-3. **Met** (letters in the criterion's text are wrong, C38).
3. `board-phases.spec.ts` "AD-14 one live element per card…" on Idle, Composing, Place, Game over; `layout.spec.ts:75` at 412 × 780 (leftover 42 px). **Met.**
4. `drag-interruptions.spec.ts:173` and `:419`; `act.test.ts:19`. **Met.**
5. Medians recorded (5.36 → 5.47 → 5.62 s) and the owner ruled (F35). **Met via the owner-stop branch.**
6. Merge and deploy are owner-gated. **Open.**

All 13 tickets done. Open items: Done when 6; F1 (A1) as a fix before the merge; the deferred findings routed above.

## Open questions

1. AD-17 unit budget (F35 left it to this retro): keep 5 s and split `controller.test.ts` (A4), keep 5 s but measure on the Linux filesystem, or raise it.
2. F1: fix the "drop onto its own column after a press under a bar" bug before the epic 4 merge (A1–A3), or defer to epic 5.
3. F2 (Q-21 scope, epic 6): when a tail is selected and the player long-presses a WordCell, should the peek be refused, close the selection, or stay over it with the bar buttons closing the view first?
4. F4: a drop can land on a long column whose highlight is under the action bar. Require the highlighted card to be visible, raise the highlight above the bars, or accept.

Owner answers 2026-10-08 (all the proposed defaults; recorded in SPEC.md F37–F40):
1. Keep the 5 s budget and split `controller.test.ts` now, with A1 (A4 moves to before the merge; G4 and C16 record "5 s kept, measured warm on the dev checkout"). F38.
2. Fix F1 before the epic 4 merge, with A2 and A3. F37.
3. A sticky view may open over a kept selection; in epic 6, Undo, Redo, the menu and key commands first close the view, then act (A7). F39.
4. F4 accepted for now; revisit with the epic 5 tray work. F40.
5. Follow-up 2026-10-08 (F41): the A4 split made the `/mnt/d` median worse (5.30 → 5.98 s), so it was reverted; the 5 s budget is measured on a Linux-filesystem checkout from now on (G4).
