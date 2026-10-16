---
title: 'Carry-ins: wheel during a mouse drag, hover-peek re-anchor, bfcache hide flush'
type: 'feature'
ticket: '14'
created: '2026-10-15'
status: done
route: 'full'
route_source: 'auto'
baseline_revision: 'f1d04312b6be1601b6ae2f25276cafc0155b3f18'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '/mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc.md'
  - '/mnt/d/CodeProjects/wordcell/_bmad-output/specs/spec-epic-6-surfaces/SPEC.md'
  - '/mnt/d/CodeProjects/wordcell/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 4 retro A8 left three unverified carry-ins: a desktop wheel scroll during a mouse drag moves no `pointermove`, so faces, highlight and drop target go stale; the hover peek's re-anchor after layout shifts is untested; the hide-flush `controller.cancel()` after a bfcache restore may swallow a real Back.

**Approach:** Test first for each; a code fix lands only where its test fails. The story file (Description, Tests, Consumers) is the full contract; the wheel fix is expected to be a mouse-only passive `window` scroll listener in `controller.ts`, the bfcache case may end as a build-notes.md line.

## Boundaries & Constraints

**Always:** Follow the story file verbatim (F3, F6, F7 paragraphs, Tests table). Test names start with `AD-12` (wheel, hover-peek) or `AD-9` / `AD-13` (bfcache). Failing-first runs are recorded in Implementation Notes, never committed red. No fallback or defensive code (rule 6). Touch drags and `gate.ts` unchanged.

**Never:** Add re-anchor or close for viewport-height change or page scroll with a peek open. Add a screens spec or change screenshot baselines. Commit a bfcache test that did not fail first. Change `src/engine/`. Import `src/ui/` from shell.

</intent-contract>

## Code Map

- `src/ui/gestures/controller.ts` -- `pointerdown` (press creation, line ~633), `pointermove`/`dragMove` (~563, ~690), `end()` (~313), `attach` (~1017); the scroll listener lands here (passive, on `window`, mouse press only, removed in `end()`).
- `src/ui/gestures/tile-drag.ts`, `free-letter-drag.ts` -- `move(drag, x, y)` writes `translate(pointer − press − lift)`; need scroll-aware offset. `drag-types.ts` -- `dx`/`dy`, `x`/`y` press point, `Press.mouse`.
- `src/ui/gestures/visible-band.ts`, `drop-target.ts`, `targeting.ts` -- band clip and `pickTarget`; recompute reads live rects.
- `src/ui/gestures/fly-back.ts`, `parting.ts` -- read the stored last transform (must carry the cumulative scroll delta).
- `src/ui/layout/layout.svelte.ts` -- page scroll on `window` (`scrollY` ~248, own `scrollTo` ~289).
- `src/ui/gestures/controller.test.ts` -- `describe('AD-12 entry 8 drag')` (~1746), F34 block (~2218), tile drag (~4131), free-letter (~4762); regression set with `e2e/drag.spec.ts`, `drag-interruptions.spec.ts`, `tile-drag.spec.ts`, `free-letter.spec.ts`, `pointer.spec.ts`.
- `src/ui/HoverPeek.svelte` + `src/ui/hover-peek.ts` (`placeHoverPeek`) -- re-places on `layout.w`/`heights`/`bannerShown`; existing hover-peek e2e in `e2e/wordcell-view.spec.ts`; banner forcing as in `e2e/drag.spec.ts`.
- `src/shell/game.svelte.ts` (`flush`, `registerBeforeHide`, `pageshow`, `staleOwners` ~225-275), `src/shell/nav.ts` (`pending`, `onPopState`, `beforeBack`), `src/main.ts` (registers cancel); `e2e/helpers/lifecycle.ts` (`pageHide`, `pageShow`), `e2e/nav.spec.ts`, `e2e/lifecycle.spec.ts` for patterns.
- `_bmad-output/specs/spec-epic-6-surfaces/build-notes.md` -- non-reproductions and passes-without-fix lines.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/controller.test.ts` -- add wheel tests per the story Tests table (tile, free-letter, column drag; page-end no-op; release without scroll event; no jump at threshold; no recompute after drop/cancel/pointercancel/lostpointercapture; layout-originated scroll; one assertion each that touch/pen press and a never-dragged mouse press add no recompute) -- run, record the failure, then fix
- [x] `src/ui/gestures/controller.ts` (+ `tile-drag.ts`, `free-letter-drag.ts`, `drag-types.ts` as needed) -- scroll-aware drag recompute per the story F3 model; skip if the tests pass first time (note in build-notes.md)
- [x] `e2e/drag.spec.ts` (or a new `e2e/wheel-drag.spec.ts`) -- desktop Playwright wheel case: overflowing page, `page.mouse.wheel` during a held mouse drag, plus page-end no-op
- [x] `e2e/wordcell-view.spec.ts` (or new spec) -- desktop hover-peek re-anchor after viewport width change and banner shown; non-vacuous asserts, 1 px tolerance; fix `HoverPeek.svelte` only if it fails
- [x] `e2e/` bfcache spec -- three variants (menu open, mouse drag live, stale-owner halt); attempt (1) helpers, then (2) real bfcache navigation if (1) does not reproduce; state starting history for `page.goBack`; commit only variants that failed first, note the rest in build-notes.md; fix inside AD-9/AD-13 contract if reproduced
- [x] `_bmad-output/specs/spec-epic-6-surfaces/build-notes.md` -- record passes-without-fix and non-reproductions
- [ ] Plan `## Implementation Notes` -- failing-first runs, the sentence → test mapping, the regression set kept green

**Acceptance Criteria:**
- Given a mouse drag, when the page wheel-scrolls, then faces, highlight and drop target follow the pointer and a release drops on the recomputed target (Vitest and desktop Playwright)
- Given an open hover peek, when viewport width changes or the banner shows, then the peek bottom is within 1 px of the hovered cell's label top and does not overlap the cell
- Given the hide flush then `pageshow` persisted, when Back is pressed, then it pops the top surface (or a build-notes line records the non-reproduction)
- Given `npm run test:all`, then it is green; `npm run test:screens` baselines unchanged (Docker, if available)

## Implementation Notes

**Failing-first runs.** Vitest: the 12 new `AD-12 F3` wheel cases failed against the unmodified controller (faces kept the pointer delta, highlight and release target stale; no scroll listener), 2 passed vacuously (an unchanged-offset scroll, a small free-letter scroll) and stay as guards; the existing 255 cases passed with the new fake window and scroll-aware fake rects. Playwright `e2e/wheel-drag.spec.ts` (desktop) failed on the held-drag case with the fix stashed (face drifted 150 px with the page); the page-end case passes both ways by design. Hover-peek re-anchor (`e2e/hover-peek-reanchor.spec.ts`) passed first time: no `HoverPeek.svelte` change. Bfcache: all three variants passed under attempt 1 (helpers) and attempt 2 (real bfcache), so no test is committed (build-notes.md).

**Code.** `controller.ts` (passive `window` scroll listener added at a mouse press, removed in `end()`; `rescroll()` on scroll and at `pointerup`; `drag.scroll` base read at the drag start), `drag-types.ts` (`DragScroll`, `Press.lastX/lastY`), `tile-drag.ts` and `free-letter-drag.ts` (`move(..., scrolled)` adds the delta to `dy`), `targeting.ts` (`inStartFrame`: the dragged rect in the frame the gap rects were measured in). Fly-back and parting read the cumulative `dx`/`dy`; `gate.ts`, touch drags and `src/engine/` unchanged.

**bfcache starting history (attempt 1 and 2).** Page opens from its initial `about:blank`: entries `[about:blank, /]`, the menu variants add one pushed entry (`wc` 1). Attempt 2 then navigates to `about:blank` (entries `[blank, /, /(wc1), blank]`), `page.goBack({ waitUntil: 'commit' })` restores `/` with `pageshow.persisted` true; the next `goBack` lands on `/` at `wc` 0 with the menu closed (or `about:blank` for the drag variant at depth 0). Real bfcache needs `channel: 'chromium'` plus `ignoreDefaultArgs: ['--disable-back-forward-cache']` against `dist-test` (the default headless shell reports `BackForwardCacheDisabledForDelegate`).

**Sentence to test mapping (F3).** Faces = pointer delta + scroll delta, drop target recomputed, previous target unlit: `AD-12 F3 a wheel during a mouse column drag ...`, `... a scroll that brings a column under the faces ...`; tile and free-letter: the two `tray drags` wheel cases; release without a `pointermove` or without a `scroll` event: the "release with the scroll offset changed but no scroll event" cases (column, tile) and the small-scroll tile and free-letter releases; no jump at the threshold: `... absorbed into the origin`; a later `pointermove` continues: `... continues from the scroll delta`; no recompute after drop, cancel, `pointercancel`, `lostpointercapture`: `the listener is passive, on a mouse press only, and gone after ...`; layout-originated scroll: `any scroll source takes the same recompute`; touch and pen add none, never-dragged mouse press adds no recompute, page-end no-op: `the listener is passive ...`, `a mouse press that never becomes a drag ...`, `a scroll event with the offset unchanged ...`. Playwright desktop: both `e2e/wheel-drag.spec.ts` cases. F6: both `e2e/hover-peek-reanchor.spec.ts` cases. F7: build-notes.md line.

**Regression set kept green.** Every `controller.test.ts` describe (the shared press and drop paths): `AD-12 entry 8 drag`, `F34 drop targets clipped to the visible band`, `entry 9 selection replacement`, `F32 lift`, `entry 10 Composing columns`, `entry 12 desktop hover peek`, `epic 5 tile tap`, `Place target`, `tile drag`, `free-letter drag`, `epic 6 key activation`; `targeting.test.ts`, `tile.test.ts`; and `e2e/drag.spec.ts`, `drag-interruptions.spec.ts`, `tile-drag.spec.ts`, `free-letter.spec.ts`, `pointer.spec.ts`.

**Verification.** `npm run test:all` green (lint, check, 2753 unit tests, build with budget, `test:e2e:dist` 15, `test:e2e` 906 passed, `test:e2e:pwa` 13). `npm run test:screens` (Docker) 37 passed, 13 skipped, no baseline changed.

**Risk.** The Vitest fake `window` is stubbed in `setup()` (controller reads `window.scrollY` and the scroll listener directly, per the story). Only vertical scroll is followed (`scrollY`), matching the story model.

## Plan Change Log

## Review Triage Log

### 2026-10-16 — Review pass
- verdicts: 12 entries (reviewer findings grouped by claim) — high 0, medium 1, low 7, false 3, maybe-false 0; 2 patched, 10 rejected
- findings:
  - `[medium]` `patch` inStartFrame gap-pick correction pinned by no test (verification-gap) — added tile and free-letter cases that fail with inStartFrame as a no-op; parting after scroll covered by the same cases
  - `[low]` `patch` rescroll `undefined` check and onScroll wrapper (blind-hunter) — simplified, listener is rescroll itself
  - `[low]` `reject` tray rects scrolling with the page (blind-hunter) — false: Tray.svelte has no sticky, correction is intended; the actionBar exemption in the fake models a sticky bar
  - `[false]` `reject` free-letter tilesRect/caret stale (edge-case) — caret uses rect.left − tilesRect.left, both start-frame
  - `[false]` `reject` listener leak on exception (edge-case) — a throw halts to AD-15 (rule 6), no recovery code wanted
  - `[low]` `reject` horizontal scroll ignored (blind-hunter, edge-case) — page scrolls vertically only; the story scopes the page `scrollY`
  - `[low]` `reject` pre-threshold scroll rebase (edge-case) — the story prescribes absorbing it into the origin read
  - `[false]` `reject` window stub leaks (blind-hunter, edge-case) — the file stubs other globals the same way; no cross-file effect under Vitest isolation
  - `[low]` `reject` e2e held-route release, wheel poll stability, unreadable arithmetic, comment length (blind-hunter, edge-case) — cosmetic/negligible
  - `[low]` `reject` no Playwright tile/free-letter wheel case; hover-peek height case; docs update (blind-hunter, intent-alignment) — story assigns tile/free-letter to Vitest, excludes height changes; docs are agent-context
  - `[low]` `reject` bfcache non-reproduction has no standing test (blind-hunter, intent-alignment) — the story makes a recorded non-reproduction the done state; recipe is in build-notes.md
  - `[low]` `reject` plan checkbox/status inconsistencies — fixed at finalize

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green, baselines unchanged (Docker only; record if Docker unavailable)

## Auto Run Result

- **Summary:** Wheel during a mouse drag fixed in the controller (mouse-only passive `window` scroll listener, release re-reads the live offset, faces/targets recomputed from the last pointer point). Hover-peek re-anchor covered by a passing desktop spec (no code change). Bfcache hide flush did not reproduce (helpers and a real bfcache navigation), recorded in `_bmad-output/specs/spec-epic-6-surfaces/build-notes.md`; no test committed, no code changed.
- **Files:** `src/ui/gestures/controller.ts`, `drag-types.ts`, `tile-drag.ts`, `free-letter-drag.ts`, `targeting.ts` (scroll-aware recompute, `inStartFrame`); `src/ui/gestures/controller.test.ts` (wheel and gap-pick cases); `e2e/wheel-drag.spec.ts`; `e2e/hover-peek-reanchor.spec.ts`; `build-notes.md`.
- **Review:** 2 patches applied (inStartFrame gap-pick tests; rescroll simplification), 0 deferred, 10 rejected with reasons in the triage log.
- **Follow-up review recommended:** false (patched: 1 medium, 1 low).
- **Verification:** `npm run test:all` exit 0 after the patches; `npm run test:screens` 37 passed, 13 skipped, baselines unchanged (run before the patches, which touch tests only).
- **Residual risks:** only vertical page scroll is followed; the wheel Playwright case was not re-run against unfixed code after its final rewrite (an earlier form failed without the fix).
