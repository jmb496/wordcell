---
title: 'Controller seams'
type: 'refactor'
ticket: '4'
created: '2026-10-08'
status: 'built'
baseline_revision: '9c3ea732baba320db6b2fc11892d178136d18866'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-controller-seams.md'
warnings: ['oversized']
deferred:
  - summary: >-
      The miss paths of the converted lookup sites (controller.ts, intent.ts, hover-peek-timer.ts, HoverPeek.svelte, WordCellView.svelte) are not exercised by any test except wordcellPress and originCard.
    evidence: |-
      verification-gap lens grep of src/ui/**/*.test.ts for 'not registered', 'outside [data-column]', 'outside [data-wordcell]', 'is not in the GameView', 'unknown cell' found no match; pre-existing gap, the helpers are pinned by lookup.test.ts and the messages by the sorted-literal gate.
    location: >-
      src/ui/gestures/controller.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** `src/ui/gestures/controller.ts` (1004 lines) mixes the press machine with the visible band, the desktop hover-peek timer, the fly-back, ad-hoc lookups and class literals, and src/ui headers are per-ticket "Entry N" paragraphs; tile gestures (CAP-4–6) need focused modules first (epic 5 SPEC CAP-3, F14, retrospective A6).

**Approach:** Behaviour-neutral split exactly as the ticket (story-controller-seams.md, authoritative; read it in full) specifies: five new gestures/ modules (visible-band, hover-peek-timer, fly-back, lookup, classes), lookup sites switched to `found`/`cellIn`/`columnIn`, Entry headers rewritten as behaviour summaries, one new test file `gestures/lookup.test.ts`.

## Boundaries & Constraints

**Always:** every throw string byte-identical (gated by the sorted-literal diff below); every call and statement order kept (ticket Seams); new modules are factories/pure functions built inside `createController` from its existing deps plus getters, no module-level state, no runtime import of controller.ts (`import type` allowed, e.g. `Drag`, `ControllerDeps<H>`); class values byte-identical; `createController(gate, deps)`, `ControllerDeps` (same members and signatures; only its JSDoc tags rewritten) and `{ cancel, attach, refreshHover }` unchanged; controller.test.ts stays one file with `setup()` calling `vi.resetModules()` once; test edits limited to import paths (expected: none).

**Never:** rename/move tests or change assertions; add `vi.mock`; touch main.ts, src/shell, e2e, test files' names or comments, Column.svelte/HoverPeek.svelte CSS class literals (they gain one comment naming classes.ts); change App.svelte wiring; move drag, `overSource`, tap actions, hover classes or the touch long-press peek (onTimer/releasePeek) out of controller.ts.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| found hit | `found(0, m)` / `found(x, m)` | returns value (CardId 0 is not a miss) | none |
| found miss | `null` or `undefined` | throws `new Error(m)` verbatim | rule 6 |
| cellIn | cells `[5, 3]`, n 3 | the `cell === 3` entry (never by index) | miss throws m |
| columnIn | index n−1 missing, or its `column` ≠ n | throws m | — |

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` -- source of all moves. visible band: `clip` 207–212, `barRect`/`visibleBand` 534–548 (→ visible-band.ts with a `root()` getter; `barRect` throws at 535/537 keep their own throw). fly-back: `Flight` 165, `flying` 307, `translate` 214, `flyBack`/`settle`/`finishFlight` 389–451 (→ fly-back.ts; `translate` exported, dragMove imports it). hover-peek timer: `hoverTimer`/`suppressed` 310–313, `stopHoverTimer`/`closeHover`/`hideHoverPeek`/`suppress`/`cellOf`/`outside`/`hoverEnter`/`onHoverTimer`/`cellCards`/`hoverLeave` 857–935 (→ hover-peek-timer.ts). Stays: press machine, `Drag`/`clearDrag`/`unsuppress`, drag 453–595 incl. `overSource` 551–561, `onTimer`/`releasePeek` 597–618, tap actions, `clearHover`/`showHover`/`refreshHover`/`track`, `pointerover`/`pointerout` (call `hover.hoverEnter/hoverLeave`), `cancel`, `attach` (detach's `suppressed = null` → `hover.reset()`, same position). Lookup sites (lines at HEAD): 230, 241, 269, 470, 485, 557, 592, 847, 925; `attribute()` 218 → lookup.ts. Own throws stay: 455, 461, 483, 537 (moves with barRect).
- Construction order in `createController`: `const flight = createFlyBack({ gate, clearDrag, onSettle: () => { hover.suppress(); refreshHover(); } })` (lazy: settle only runs from `end()` after attach, so `hover` exists), then `const hover = createHoverPeekTimer(deps, { root: () => root, lastPoint: () => lastPoint, pressHeld: () => press !== null, flying: flight.running })`, `const band = createVisibleBand(() => root)` (or pure function taking root). settle keeps: clearDrag → `gate.leave` → suppress → refreshHover. `flying !== null` reads become `flight.running()`.
- `src/ui/gestures/intent.ts` -- 66 (`columnOf` → `columnIn`), 104 (`viewTap` → `cellIn`); 74 keeps its throw.
- `src/ui/HoverPeek.svelte:30`, `src/ui/WordCellView.svelte:23` -- `cellOf` → `cellIn`, messages unchanged.
- `src/ui/tray/tags.ts` -- `originCard` → `found(cells.find(...)?.cards.at(-1), msg)` (one message for missing and empty).
- `src/ui/gestures/click-swallow.ts` -- factory pattern to copy.
- `src/ui/gestures/controller.test.ts` -- harness at 1–110, `setup()` 404 (`vi.resetModules()` then dynamic imports). New modules import `../motion`, `../../shell/prefs.svelte`, `../../shell/game.svelte`, `../overlays.svelte` with the same relative specifiers as controller.ts so the mocks apply.
- Headers scope: `grep -rniE 'entry [0-9]' src/ui --exclude='*.test.ts'` (13 files at HEAD: gestures/controller.ts, gestures/intent.ts, App.svelte, Board.svelte, Card.svelte, Column.svelte, HoverPeek.svelte, WordCellView.svelte, hover-peek.ts, layout/layout.svelte.ts, layout/fit.ts, tray/tags.ts, tray/WordLine.svelte).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/classes.ts` -- export `HOVER_TAIL`, `GRAB`, `DROP`, `DROP_SELF`, `DRAG_GHOST`, `DRAG_LAYER`, `DRAG_TARGET`, `SUPPRESSED`, `HOVER_PEEK_HIDDEN`, `HOVER_CLASSES = [HOVER_TAIL, GRAB, DROP, DROP_SELF] as const`, `HOVER_FROM`, `HOVER_LEN` (keep existing identifiers; values byte-identical) -- ticket Classes.
- [x] `src/ui/gestures/lookup.ts` + `lookup.test.ts` -- `found`, `cellIn`, `columnIn`, `attribute` per the I/O matrix; header names `attribute()` as the shared attribute parser; tests named `AD-12 …`, pure, no `vi.mock` -- ticket Lookup/Tests.
- [x] `src/ui/gestures/visible-band.ts`, `fly-back.ts`, `hover-peek-timer.ts` -- moves per Code Map, bodies verbatim apart from getter/class-constant/lookup substitutions; fly-back's two throws verbatim; each with a behaviour-summary header -- ticket Seams.
- [x] `src/ui/gestures/controller.ts` -- wire the factories; replace lookup sites and class literals (`'wc-hover-tail'`, `'wc-grab'`, `'wc-drop'`, `'wc-drop-self'` in showHover → constants); `export type Drag`; header → one behaviour summary of what controller.ts still owns.
- [x] `src/ui/gestures/intent.ts`, `HoverPeek.svelte`, `WordCellView.svelte`, `tray/tags.ts` -- lookup sites; Column.svelte and HoverPeek.svelte `<style>`: one comment naming classes.ts as the source of the class names.
- [x] Headers in all 13 files -- per ticket Headers: Entry paragraphs → behaviour summary; each tag → the covering ids of its entry's paragraph, epic-qualified for SPEC/build-notes CAP/F ids ("epic 4 SPEC F34", "epic 5 CAP-1"), AD/R/Q unqualified; tag with no covering id dropped; tags with no paragraph in their file resolve via controller.ts's header at HEAD (epic 4) or tickets.toml `covers` (epic 5); forward refs (tags.ts "Entry 4 folds…", Card.svelte "set by entry 5") removed or replaced by CAP id. Every id and accepted trade-off of the old paragraphs survives in some module's summary. Record each rewritten tag → ids in Implementation Notes.

**Acceptance Criteria:**
- Given the build, when `/tmp/wc54-throws.sh .` runs, then its output equals `/tmp/wc54-throws-before.txt` (82 sorted literals captured at 9c3ea73; the script greps `'AD-1x …'`/`'origin tag…'` literals in non-test src/ui).
- Given the build, when `grep -rniE 'entry [0-9]' src/ui --exclude='*.test.ts'` runs, then it returns nothing.
- Given the build, when `git diff 9c3ea73 -- '*.test.ts' e2e src/shell src/main.ts` runs, then it is empty except the new `lookup.test.ts`.
- Given the build tree applied onto 9c3ea73 in `~/wc54-median`, when AD-17 Speed's median is taken, then after < 5 s and `setup()` still calls `vi.resetModules()` once; a rise > 10 % surviving one re-measure is recorded with controller.test.ts per-file timing and flagged (non-blocking); at ≥ 5 s record a profile and HALT `blocked` for the owner.
- Sentence → test mapping: none; behaviour-neutral (CAP-3).

## Implementation Notes

Before median (AD-17 Speed: one discarded warm-up, median of three `npm test`, `fsModuleCache` warm) on `~/wc54-median`, an ext4 `git worktree` at `9c3ea732baba320db6b2fc11892d178136d18866` after `npm ci`: Vitest Duration 3.31 (warm-up), 2.17, 2.20, 2.16 s → **median 2.17 s** (wall 2.68 s). controller.test.ts alone: 1.03 s, 159 tests. The 5 s gate applies (before < 5 s).

After median (same method, build tree on 9c3ea732baba320db6b2fc11892d178136d18866 in `~/wc54-median`): Vitest Duration 2.35 (warm-up), 2.28, 2.28, 2.32 s → **median 2.28 s** (+5.1 %, under the 10 % rule; < 5 s gate passes). controller.test.ts alone: 1.05 s, 159 tests (before 1.03 s). `setup()` still calls `vi.resetModules()` once (grep count 1). 2089 unit tests (before + 4 lookup tests).

Gates: `npm run test:all` green; `npm run test:screens` green (10 passed, no baseline change); throws diff empty; `entry [0-9]` grep empty; `git diff 9c3ea73 -- '*.test.ts' e2e src/shell src/main.ts` empty (new `lookup.test.ts` untracked only).

Construction as Code Map: `flight` (onSettle → `hover.suppress(); refreshHover()`), then `hover` (`flying: flight.running`), then `band`. `prefs` and `duration` are now imported only by fly-back.ts (same specifiers, so controller.test.ts mocks apply). `HOVER_PEEK_HIDDEN` is used by hover-peek-timer.ts only.

Tag → ids (epic 4 tags take controller.ts's header paragraph at HEAD; epic 5 tags tickets.toml `covers`):
- controller.ts: ControllerDeps `Entry 12` ×2 → epic 4 SPEC F19; `refreshHover` "(entry 7)" → epic 4 SPEC CAP-6; `Drag` `Entry 8` → epic 4 SPEC CAP-7; `Drag.replacing` `Entry 9` → epic 4 SPEC F24, F28; `Press.mouse` `Entry 12` → epic 4 SPEC F19; `clip` `Entry 13 (F34)` → visible-band.ts header (epic 4 SPEC F34), inline tag dropped; `resolve` "(entry 7)" → epic 4 SPEC CAP-6; scrim/sheet `Entry 11` → R-65; swallower `Entry 11` → R-65; hover timer/suppressed `Entry 12` (+ "(entry 13)") → epic 4 SPEC F19 (entry 13 part dropped, no covering id); `end` mouse-suppress `Entry 12` → epic 4 SPEC F19; `end` peek `Entry 11 (AD-12 peek on end)` → Q-21 (AD-12 peek on end); `end` hover-peek close `Entry 12` → epic 4 SPEC F19; `end` `Entry 9 (F24/F28, F33)` → epic 4 SPEC F24/F28, F33; `end` "entry 10" → epic 4 SPEC CAP-8; `visibleBand` `Entry 13 (F34)` → moved under visible-band.ts header (epic 4 SPEC F34), tag dropped; `onTimer` `Entry 11 (Q-21)` → Q-21; pointerdown `Entry 12` → epic 4 SPEC F19, `Entry 11` → R-65, "(entry 13, CAP-4)" → epic 4 SPEC CAP-4; pointermove "entry 10" → epic 4 SPEC CAP-8, `Entry 12` → epic 4 SPEC F19; pointerup `Entry 11` → R-65, `Entry 10 (R-39)` → R-39; click `Entry 13` → epic 4 SPEC F25; refreshHover `Entry 12` → epic 4 SPEC F19, `Entry 8` → epic 4 SPEC CAP-7, "entry 10" → epic 4 SPEC CAP-8; closeHover/suppress `Entry 12` → epic 4 SPEC F19 (hover-peek-timer.ts); suppress/hoverEnter `Entry 13` → dropped (entry 13's F34, CAP-4, F25 do not cover them); cancel `Entry 12` → epic 4 SPEC F19.
- intent.ts: header Entry 10/11 paragraphs → summary (epic 4 SPEC CAP-8, R-31, R-39; epic 4 SPEC CAP-9, R-65, R-75, F14); `sheet`/`scrim` "(entry 11; …)" → R-65; `Entry 10 k preview` → R-31; `Entry 10 (R-31)` ×2 → R-31.
- App.svelte: `Entry 7 (SPEC CAP-6)` → epic 4 SPEC CAP-6.
- Board.svelte: header Entry 11 (SPEC CAP-9) / Entry 12 (F19) → summary citing epic 4 SPEC CAP-9 and F19; its build-notes ids epic-qualified.
- Card.svelte: header `Entry 11 (DESIGN.md WordCell view, AD-14)` → epic 4 SPEC CAP-9, R-65; `Epic 5 entry 2` → epic 5 SPEC CAP-1; props `Entry 7` (F26) → tag dropped, epic 4 SPEC F26; `Entry 7` (R-21) → tag dropped; `Entry 11` → R-65; `Epic 5 entry 1`/`2` → epic 5 SPEC CAP-1; "set by entry 5" → epic 5 SPEC CAP-4; CSS `Entry 11` → R-65.
- Column.svelte: header Entry 7/8/9 and Epic 5 entry 1 → summary (epic 4 SPEC CAP-6, F26; CAP-7; CAP-4, CAP-7, F12, F24; epic 5 SPEC CAP-1); CSS "(entry 7)" → epic 4 SPEC CAP-6; `Entry 10 k preview (SPEC CAP-8)` → tag dropped, epic 4 SPEC CAP-8; "(entry 8)" → epic 4 SPEC CAP-7; `Entry 9` → epic 4 SPEC F24.
- HoverPeek.svelte, WordCellView.svelte, hover-peek.ts: single-paragraph headers, `Entry 11/12 (…)` → their ids epic-qualified.
- layout/layout.svelte.ts: `Entry 12 (CAP-9)` → epic 4 SPEC CAP-9, F19; `Entry 12` ×2 → epic 4 SPEC F19.
- layout/fit.ts, tray/WordLine.svelte: `Epic 5 entry 1` → epic 5 SPEC CAP-1.
- tray/tags.ts: `Epic 5 entry 1` → epic 5 SPEC CAP-1; "Entry 4 folds this…" → replaced by lookup.ts `found` (epic 5 SPEC CAP-3).

Final-tree re-measure after the review patches (comment-only; build tree on 9c3ea732baba320db6b2fc11892d178136d18866): 2.42 (warm-up), 2.36, 2.32, 2.33 s → **after median 2.33 s** vs before 2.17 s (+7.4 %, under 10 %; < 5 s gate passes); controller.test.ts alone 1.04 s; `vi.resetModules()` count 1. No owner flag needed.

Throw-gate artefacts are also kept (git-ignored) at `.autopilot/20261008-1002/wc54-throws.sh` and `wc54-throws-before.txt`; the script is `grep -rohE "[\`'](AD-1[0-9] [^\`']*|origin tag[^\`']*)[\`']" src/ui --include='*.ts' --include='*.svelte' --exclude='*.test.ts' | sort` (82 literals at 9c3ea73, identical after).

## Plan Change Log

## Review Triage Log

### 2026-10-08 — Review pass
- verdicts: 19 findings — high 0, medium 1, low 6, false 12, maybe-false 0
- findings:
  - `[low]` `[patch]` blind: lookup.ts header says `attribute()` throws unless integer, but a missing/empty attribute reads as 0 — header reworded to state the actual `Number()` behaviour (code unchanged, behaviour-neutral).
  - `[false]` `[reject]` blind: lookup.test.ts lacks `attribute()` and false/NaN cases — the ticket review log settles "lookup.ts header names `attribute()` … (no extra test)"; the 0 and '' cases already exercise the non-nullish falsy branch.
  - `[false]` `[reject]` blind: other own-throw lookups (cardIn, placeholderIn, .face, view-scroll) not converted — the ticket's Lookup site list is authoritative and keeps them ("every throw not in the site list keeps its own throw").
  - `[false]` `[reject]` blind: type-level import cycle fly-back.ts/hover-peek-timer.ts → controller.ts — the ticket allows `import type` from controller.ts; erased at compile time, no runtime cycle.
  - `[false]` `[reject]` blind: lookup.ts belongs outside gestures/ — the ticket and build-notes tree fix its location as gestures/lookup.ts.
  - `[low]` `[reject]` blind: classes.ts header does not list e2e/test consumers — renaming a value would fail those e2e/unit tests loudly, not silently; the plan's Design Notes list the consumers.
  - `[false]` `[reject]` blind: SUPPRESSED/GRAB/DROP names ambiguous — the ticket review log settles "keep existing constant names".
  - `[medium]` `[patch]` blind + intent-alignment: rewritten headers/tags left bare or half-qualified SPEC CAP/F ids (F13, F23, CAP-4, "(SPEC CAP-7); epic 4 SPEC CAP-8", "epic 5 SPEC CAP-3, F14") against the Headers rule — every rewritten CAP/F id now epic-qualified individually (verbatim-moved comments keep theirs per the ticket).
  - `[low]` `[patch]` blind: rewritten comment lines over the 100-column width — rewrapped; `git diff -U0 | awk 'length > 101'` returns nothing.
  - `[false]` `[reject]` blind: plan frontmatter `deferred` empty while Design Notes defer CAP-12 items — fix edits this build's plan; the CAP-12 items are recorded in Design Notes and the run result.
  - `[false]` `[reject]` blind: throw gate lives in /tmp — fix edits this build's plan; the script and baseline are also kept under .autopilot and the grep is quoted in Implementation Notes.
  - `[false]` `[reject]` blind: createVisibleBand is a stateless factory — the ticket specifies "visible-band.ts owns clip, barRect and visibleBand (with a root() getter)".
  - `[low]` `[reject]` blind: three `cellOf` helpers with different meanings — pre-existing names, cosmetic, no named harm.
  - `[low]` `[defer]` verification-gap: converted lookup sites' miss paths (except wordcellPress and originCard) are not run by any test — pre-existing gap; helpers pinned by lookup.test.ts and messages by the sorted-literal gate; deferred to the CAP-11 code sweep.
  - `[false]` `[reject]` intent-alignment: header qualification R3 vs R3' — same root as the medium patch above (row kept, shares the patch route).
  - `[low]` `[patch]` intent-alignment: Column.svelte named classes.ts twice (script header and <style>) against "one comment" — script-header mention removed.
  - `[false]` `[reject]` intent-alignment: `overSource` stays in controller.ts despite the build-notes range — the ticket's Seams bullet keeps it there; noted in Design Notes (b).
  - `[false]` `[reject]` intent-alignment: moved modules tested only via controller.test.ts — the ticket requires exactly this (no new vi.mock, no other new test files).
  - `[false]` `[reject]` intent-alignment: tag → id judgements unchecked by tests — no defect claimed; the mapping is listed in Implementation Notes for code review.

## Design Notes

Ticket review-log items resolved here: (a) the "tests pin every throw" claim is false (2 of 14 pinned) → the sorted-literal diff AC gates it; (b) `overSource` stays in controller.ts although build-notes' visible-band range 534–561 includes it — a deliberate departure (it is drag-targeting, Q-34/epic 4 SPEC F37), noted for review; (c) `found` messages at 557/592 become template literals built eagerly per pointermove — negligible, behaviour identical; (d) classes.ts keeps existing constant names and composes `HOVER_CLASSES`; (e) `onSettle` lazy closure is safe (flyBack reachable only from `end()` after attach); (f) Column.svelte/HoverPeek.svelte CSS keep literals: SPEC CAP-3's "share" is read as classes.ts being the single TS source, with CSS pointing at it by comment. Consumers whose literals stay unchanged: Column.svelte and HoverPeek.svelte CSS; e2e drag/tap/column-phases/wordcell-view/drag-interruptions specs, helpers.spec.ts, helpers/drag.ts; controller.test.ts classList assertions. Deferred to the CAP-12 paperwork sweep: main.ts:119 "(entry 12)" and controller.test.ts describe names; the spine Structure tree's gestures/ list lacking the five modules; build-notes line map labelling 597–618 (touch long-press peek) "hover peek".

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npm run test:screens` -- expected: green, no baseline change.
- `/tmp/wc54-throws.sh . | diff /tmp/wc54-throws-before.txt -` -- expected: no output.
- `grep -rniE 'entry [0-9]' src/ui --exclude='*.test.ts'` -- expected: no output.

## Auto Run Result

**Summary:** Behaviour-neutral split of `src/ui/gestures/controller.ts` (epic 5 SPEC CAP-3): visible band/clip → `visible-band.ts`, fly-back → `fly-back.ts`, desktop hover-peek timer and suppress → `hover-peek-timer.ts`, one `found`/`cellIn`/`columnIn` lookup helper (+ `attribute()`) in `lookup.ts` used at every listed site, class names in `classes.ts`; every "Entry N" header/tag in non-test src/ui rewritten to behaviour summaries with epic-qualified ids.

**Files changed:**
- `src/ui/gestures/classes.ts` (new) — shared class/custom-property names.
- `src/ui/gestures/lookup.ts` (new) + `lookup.test.ts` (new, 4 AD-12 tests) — lookup helper and attribute parser.
- `src/ui/gestures/visible-band.ts`, `fly-back.ts`, `hover-peek-timer.ts` (new) — moved seams as factories.
- `src/ui/gestures/controller.ts` — wires the factories, lookups and classes; header summary; `export type Drag`.
- `src/ui/gestures/intent.ts`, `HoverPeek.svelte`, `WordCellView.svelte`, `tray/tags.ts` — lookup sites; headers.
- `src/ui/App.svelte`, `Board.svelte`, `Card.svelte`, `Column.svelte`, `hover-peek.ts`, `layout/layout.svelte.ts`, `layout/fit.ts`, `tray/WordLine.svelte` — header/tag rewrites (Column/HoverPeek: one comment naming classes.ts).

**Review:** 19 findings; patched 4 (1 medium: id qualification; 3 low: line width, attribute() header, duplicate classes.ts comment); deferred 1 (low: untested lookup miss paths); rejected 14 with reasons in the triage log.

**Follow-up review recommended:** false (patched: high 0, medium 1, low 3).

**Verification:** `npm run test:all` green (unit + 415 dev e2e + dist + pwa); `npm run test:screens` 10 passed, no baseline change; throw-literal diff empty (82 literals); `entry [0-9]` grep empty; no test/e2e/shell/main.ts edits; unit median 2.17 s → 2.33 s (+7.4 %), `vi.resetModules()` once.

**For review / owner (non-blocking):** `overSource` kept in controller.ts (ticket over build-notes range). CAP-12 paperwork sweep: `main.ts:119` "(entry 12)" and controller.test.ts describe names; spine Structure tree gestures/ list lacks the five new modules; build-notes line map labels 597–618 (touch long-press peek) "hover peek".

**Residual risk:** headers' tag → id choices are judgement calls (listed above for code review); no manual browser check beyond the e2e suites.
