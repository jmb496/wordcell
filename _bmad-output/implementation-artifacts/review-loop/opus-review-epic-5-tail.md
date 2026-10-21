# Review loop — Opus re-review of the Epic 5 tail (code mode)
State: pass 4: done

Target: code at HEAD de864f5 for the 67 files `git diff --name-only e401806..db1ca56` touched (minus `_bmad-output/`, `*.png`; list in `opus-review-epic-5-tail.passes/files.txt`). Staged diff: `opus-review-epic-5-tail.passes/pass0.diff` (`git diff e401806 db1ca56 -- <files>`, 9531 lines). Findings only against code that still exists at HEAD; code replaced by epics 6, 8, 9, 10 (commits after db1ca56) is out of scope.
Mode: code, thorough, max 7. Pre-loop: HEAD de864f5, tree 0 401744790a8068cc3938ece6b9ba0ed2b832fcc0.
Owner rules: only majors fixed (bugs, rule/AD violations, missing tests for stated rules, fragile code likely to cause defects, refactors preventing likely defects); minors listed, never sent to the fixer; UX/gameplay changes are decision-needed; no screenshot baselines; no commits.
Intent: epic-tray-and-place.md, tickets + plans 5.11–5.16, retrospective, spec-epic-5-tray (SPEC.md, rule-coverage.md, build-notes.md).

## Pass 1 — 2026-10-21
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 3 (one raised from minor), minor 8, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] src/ui/tray/TileRows.svelte:75 with src/ui/layout/tray.ts:31-37 — the tile area keeps its fixed max(H, 92) px clipped height while the band grows for 3+ compact rows (CAP-9, DESIGN.md A-D4), so tiles 15+ are clipped and cannot be hit; tray-growth.spec.ts checks only band height → fixer item 1
- [major] src/ui/motion.ts:120, 282-297 — the F8 open-gesture tracker drops a key only on its keyup; macOS sends no keyup for Z while Cmd is held, so a stale `kKeyZ` entry is marked consumed at the next win and every later Z/Cmd+Z keydown is swallowed (Undo of a won game, R-70 / 6.12) until blur or hide → fixer item 2 (default applied: a non-repeat keydown on an already-tracked key is a new gesture; a Meta keyup ends every open key gesture)
- [major] src/ui/flip.test.ts:619 — ticket 5.11 states the flying set has no 0.5 px skip; the test named for it moves no card under 0.5 px, so it passes with the skip applied → fixer item 3
### Minors (listed, not sent to the fixer — owner rule)
- src/ui/flip.ts:252-260 — used-mirror map reads `data-wordcell` / `data-mirror-of` with bare `Number()`; `lookup.ts` `attribute()` would throw on a missing value (rule 6).
- src/ui/gestures/free-letter-drag.ts:74, tile-drag.ts:50 — drag starts recompute `trayLayout(run.tileCount, …)` instead of reading `layout.tray`; agrees today by separate derivation.
- e2e/flip-controller.spec.ts:205-231 — the 5.16 AC "parted face's first keyframe at its parted offset" is no longer asserted in e2e (only the Vitest capture-order test pins it).
- e2e/flip-controller.spec.ts:234-263 — fly-back half asserts only "no wc-glide"; P5 half does not confirm the glide was still running at the press.
- src/ui/flip.test.ts:1231 — name says "ends 300 ms after the last animation settles"; it asserts uninstall at settle (F23 counts 300 ms from install).
- src/ui/layout/layout.svelte.test.ts:535 — two self-identity assertions (`toBe` on the same getter) cannot fail.
- src/ui/gestures/lookup.ts:40 — `faceIn` has no direct hit/miss test.
- e2e/win-guard.spec.ts:65-87 — Fast / reduced-motion double-tap variants do not bound the tap gap, so they pass with the guard removed (module-level 300 ms covered in motion.test.ts).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fix (resumed)
The first pass 1 fixer was killed mid-run (headless background ceiling); a fresh fixer completed and verified its partial edits. Item 1: `trayLayout().area` = max(H, 92) + trayGrowth(rows, H) in compact mode (band height from `bands()` unchanged, no double count); unit test pins area vs trayGrowth; e2e asserts tile 15 inside the tile area and hit (fails with growth removed). Item 2: a non-repeat keydown on a tracked key ends the stale entry and starts a new gesture; Meta keyup ends every other open key; three new motion.test.ts tests (fail on HEAD motion.ts); the existing consumed-in-Undo test now sends repeat and is renamed "a repeat keydown inside Undo …". Item 3: flyToCell test adds a (0.2, 0.3) px card that must animate (fails with the skip added). Fixer ran: npm test 83 files / 3102 tests pass; lint clean (1 pre-existing warning e2e/end-sheet.spec.ts:779); check 0 errors; `npx playwright test e2e/tray-growth.spec.ts` 7 passed, 9 skipped (android-only by design).
Orchestrator verify: npm test 3102 pass, lint pass, check pass. Snapshot: tree 1 8f17cc0db6eab9ee4e78a6d95e3722c1bba56e3b; fix diff `opus-review-epic-5-tail.passes/pass1.fix.diff` (tree 0 → tree 1). Review target for pass 2 stays pass0.diff (the epic's change) read at the working tree, plus pass1.fix.diff.

## Pass 2 — 2026-10-21
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2 (one raised from minor, merging 4 reports), minor 6, decision-needed 0  |  Dropped in triage: 0 (3 duplicates merged)
### Applied
- [major] src/ui/flip.ts:415-424 with src/ui/tray/TileRows.svelte:75 — since pass 1 the tile area shrinks with the rows (A-D4), but a tray-band glide that does not change band never lifts the `.tiles` clip, so a tile gliding up from a removed row (3 → 2 rows; Validate from a 3-row tray to the strip) starts clipped and slides in from the clip edge instead of gliding from its captured rect (CAP-8, F17) → fixer item 1 (default applied: lift the clip with `wc-drag-tiles` for a translating glide whose face is in the tray band whenever the tile-area height changed across the move, removed at the last settle as now)
- [major] src/ui/motion.ts:293-302 — the pass 1 Meta-keyup rule ends every open key, including a consumed triggering key pressed before Meta and still held, so its repeats and keyup pass after uninstall (F8 "the triggering key's repeats and keyup stay consumed after that uninstall"); and when that keyup ends the last consumed key `onEvent` returns without `evaluate(t)`, leaving the guard installed with no timer → fixer item 2 (default applied: record `metaKey` at each key's keydown, Meta keyup ends only keys pressed with Meta; call `evaluate(t)` after the loop)
### Minors (listed, not sent to the fixer — owner rule)
- src/ui/motion.test.ts:583-594 — the lost-keyup rule is tested only via Meta+Z (an Undo alias); no plain-key case.
- src/ui/flip.test.ts:563-570 — ticket 5.11 asks for winning Confirm and Redo; only Confirm is tested.
- src/ui/flip.test.ts:619-648 — name says "no tile lift" but asserts the lift; face 3's `wc-glide` unchecked.
- e2e/tray-growth.spec.ts:214-215 — Redo "flying cards visible" lacks a positive `animating > 0` control.
- src/ui/layout/layout.svelte.test.ts:639-647 — "rows do not change mid-drag" changes no tile count while entered (vacuous).
- e2e/fly-to-cell.spec.ts:235-260 — Undo mid-flight is checked only after `glidesSettled`, so finish-first vs finish-later is not distinguished in e2e (unit test covers it).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (Meta-keyup scope reported by 3 reviewers, merged into item 2)
### Fix
Item 1: flip.ts captures the `.tiles` height; new `lifts()` lifts `wc-drag-tiles` for a band-changing glide or a tray-band glide when that height changed; both play paths (FLIP, flyToCell) pass it; flip.test.ts 3 → 2 row shrink case; tray-growth.spec.ts asserts the lift on `−` from 15 (fails without the fix at 839 and 780). Item 2: motion.ts records per open key whether Meta was down (`begin()`), Meta keyup ends only those and calls `evaluate(t)`; two new motion.test.ts cases (fail on the old code). Fixer ran: npm test 3105 pass, lint clean (1 pre-existing warning), check 0 errors; playwright tray-growth, flip-controller, fly-to-cell, win-guard: 148 passed, 150 skipped (project filters).
Orchestrator verify: npm test 3105 pass, lint pass, check pass. Snapshot: tree 2 613cbab2243e223a48d54c26215f58f30720e7cf; fix diff `opus-review-epic-5-tail.passes/pass2.fix.diff`.

## Pass 3 — 2026-10-21
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2 (one raised from minor; two Meta-rule minors folded into item 1), minor 2, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] src/ui/motion.ts:304-314 — pass 2 narrowed the Meta-keyup rule to keys pressed with Meta, but macOS drops the keyup of any key released while Meta is held; a key pressed before Meta and released under it leaves a stale entry that the next win marks consumed, so the guard never uninstalls and the board takes no input until blur/hide (the pass 1 stuck guard again). The rule also runs on non-mac platforms where real keyups arrive, letting a held triggering key's repeats/keyup pass after uninstall (F8), and the comments cite F8 for rules F8 does not state → fixer item 1 (default applied: on Meta keyup, end nothing; mark every other open key "unconfirmed" — its own later events still follow its consumed flag, but `consumedOpen()` and the backstop ignore it — so stale entries cannot hold the guard and real keyups stay consumed; label both tracker heuristics as review defaults under AD-14/F8)
- [major] src/ui/flip.ts:274-278 `lifts()` — the clip lift still misses a compact → card mode switch with the tile area height unchanged (8 → 7 tiles: a row-2 tile now at card height H starts 17–48 px below the clip), so the patchwork condition (band change or area change) is fragile → fixer item 2 (default applied: lift for a translating glide whose starting rect is not inside the after-move `.tiles` clip rect, plus band changes as now)
### Minors (listed, not sent to the fixer — owner rule)
- e2e/tray-growth.spec.ts:118-148 — "re-lays out at once" asserts only the settled height; no in-task band-height / running-glide check.
- src/ui/motion.ts comments — F8 attribution of the tracker heuristics (folded into item 1's wording).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fix
Item 1: motion.ts replaces `withMeta`/`begin()` with an `unconfirmed` set: Meta keyup marks every other open key unconfirmed (stays open; its own events follow its consumed flag; `consumedOpen()` skips it; `lastEnd` moves only on its real end), then `evaluate(t)`; install leaves it unconfirmed; cleared in `endOpen`/`clearOpen`, kept across uninstall; comments name both heuristics as review defaults under AD-14 (F8 tracker). motion.test.ts: two new cases (backstop uninstall with Enter's keyup lost under Meta; Enter's real keyup consumed after uninstall), one renamed, one rewritten (Meta+A keyup now asserted consumed). Item 2: flip.ts `Measure` keeps the `.tiles` rect; `lifts()` = band change or the glide's start rect not inside the after-move `.tiles` rect (0.5 px tolerance); flip.test.ts fake `.tiles` top moved 526 → 514 (6 px above row 1, as real layout); new 8 → 7 compact → card case. New tests failed before the change. Fixer ran: npm test 3108 pass, lint clean (1 pre-existing warning), check 0 errors; playwright tray-growth, flip-controller, fly-to-cell, win-guard: 148 passed, 150 skipped.
Orchestrator verify: npm test 3108 pass, lint pass, check pass. Snapshot: tree 3 e2347d63c78fab777266fa6dc77061dfe7876f80; fix diff `opus-review-epic-5-tail.passes/pass3.fix.diff`.

## Pass 4 — 2026-10-21
Reviewers: fix diff, edge cases, verification gap, intent alignment (pass 4 severity: shipped behaviour, gating checks, ticket contract)  |  Findings: major 0, minor 6, decision-needed 1 (raised from minor)  |  Dropped in triage: 0
### Applied
- none (converged)
### Minors (listed, not sent to the fixer — owner rule)
- src/ui/flip.test.ts:12-14, 149 — fake `.tiles` rect height is `tileArea`, the real border box is area + 6 (padding-top); no current test lands in that 6 px.
- e2e/win-guard.spec.ts:171-184 — 5.13 hide-wiring smoke passes with `registerBeforeHide(hideClear)` removed (pending path uninstalls at the floor); statically gated by architecture-tree-scan and game.svelte.test.ts.
- e2e/fly-to-cell.spec.ts:251-260 — "nothing is held" check is vacuous on session-place (cells empty after Undo); gated at unit level (flip.test.ts:659).
- src/ui/motion.ts:307-311 — Meta-keyup rule's pointer exclusion and Undo-hold release have no test.
- src/ui/gestures/controller.test.ts:2129-2153, 4272-4297 — capture = play invariant not exercised for a sameId end in a highlighted tail drag or a tile drag.
- spec docs — the two F8 tracker review defaults (Meta keyup → unconfirmed; fresh keydown ends a stale key) are recorded only in motion.ts comments, not in build-notes/SPEC (see decision needed).
### Decision needed (functionality / UX / gameplay)
- src/ui/motion.ts:297-313 (F8 winning-input guard) — to stop a lost macOS keyup (a key released while Cmd is held) from freezing all board input after the next win, a Cmd/Meta key release now stops any other held key from holding the guard open; that key's own repeats and release stay swallowed. Effect against F8: a player who holds a key through the win and taps Cmd can tap the board once the guard's backstop passes, while that key is still down. Proposed default: keep it and record both tracker defaults in build-notes CAP-10 / an F8 follow-up row.
### Dropped
- none

## Result — converged after 4 passes
Majors per pass: 3, 2, 2, 0. No open major. Final state (tree 3 code, unchanged since): npm test 83 files / 3108 tests pass; lint pass (1 pre-existing warning e2e/end-sheet.spec.ts:779); check 0 errors. Dev-server Playwright tray-growth, flip-controller, fly-to-cell, win-guard: 148 passed, 150 skipped (project filters), run by the pass 3 fixer. Screenshots not run (orchestrator). Not committed.
Technical defaults applied: 6 (pass 1 items 1–2, pass 2 items 1–2, pass 3 items 1–2).
Unapplied minors: 8 (pass 1) + 6 (pass 2) + 2 (pass 3) + 6 (pass 4) = 22, listed in each pass above.

## Post-loop fix — test:all regression
Cause: `npm run test:all` failed on android `e2e/tile-drag.spec.ts` R-34 tile 0 → gap 0 (session-composing) and tile 28 → gap 0 (session-place-free-letter-redo-tail + Undo); a third gap 0 release (R-51 tile 28 → gap 0, session-place, strip) failed the same way intermittently. `expectEdit`'s single residue read found `wc-drag-tiles` on `.tiles`. Not a measuring error: instrumenting `lifts()` on the redo-tail test logged the dragged face's captured (released, F7/F17) rect at left −9, top 550, 46 × 61 against the after-move `.tiles` clip at left 14, top 544, 384 × 98 (same top; band rects unchanged). A face held centred on gap 0 sits about half outside the tile area's left edge, so its F17 landing glide genuinely starts outside the `overflow: hidden` clip, and the pass 3 `lifts()` rule correctly keeps `wc-drag-tiles` on until that glide settles (without it the face slides in cut off at the clip edge). Reorders released inside the area still do not lift (the other edit releases pass with the unchanged single read).
Fix: flip.ts unchanged. tile-drag.spec.ts adds a local `expectEditPastClip` (saved first, R-73 (UI); then `glidesSettled`; then the same single zero `dragResidue` read), used only by the three gap 0 releases, with a comment giving the reason; no assertion removed or loosened. flip.test.ts adds "AD-14 a tile reorder released at gap 0, its face starting left of the tile area, lifts wc-drag-tiles until the last settle" (fails with the tray branch of `lifts()` disabled).
Verification: `npx playwright test e2e/tile-drag.spec.ts e2e/tray-growth.spec.ts e2e/flip-controller.spec.ts e2e/fly-to-cell.spec.ts` 45 passed, 47 skipped (project filters); tile-drag android re-run 3× 20/20; npm test 83 files / 3109 pass; lint pass (1 pre-existing warning e2e/end-sheet.spec.ts:779); check 0 errors. Not committed.
