---
id: 14
type: story
title: "Carry-ins: wheel during a mouse drag, hover-peek re-anchor, bfcache hide flush"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-12]
after: [11]
risk: medium
---

# Carry-ins: wheel during a mouse drag, hover-peek re-anchor, bfcache hide flush

## Description

Closes the epic 4 retrospective A8 items (F3, F6, F7); this ticket owns the three A8 items (the `WordCellRow` label move was done in 6.13). Each is a test first; a code fix lands only where its test fails.

**Wheel during a mouse drag (F3).** The page scrolls on `window` (`layout.svelte.ts` listens there; the `[data-view-scroll]` sheet is modal and not a drag case). After a wheel scroll during a mouse drag no `pointermove` fires, so the dragged faces (pointer delta plus scroll delta), the highlight and the drop target are recomputed from the last pointer position against the post-scroll rects and the re-clipped visible band (AD-12, F34). Model: the scroll delta is the live page `scrollY` change from the baseline read at drag start (not at press; a scroll between press and drag start is absorbed into that origin read and triggers no recompute), re-based so a later `pointermove` continues without a jump and is not double-counted; the drop path re-reads the live scroll offset at `pointerup`, so a release before the `scroll` event fires or mid-scroll still drops on the recomputed target; any scroll source during the held drag (including layout's own `scrollTo` writes) takes the same recompute; the stored last transform and origin carry the cumulative delta, so fly-back and parting read the same state; a target now outside the re-clipped band or under a sticky bar clears (fly-back, no dispatch). This holds for tile and free-letter drags. A wheel that does not scroll (page end) changes nothing; touch drags are unchanged. The tray rows (`TileRows.svelte` `.tiles`, `overflow: hidden`) are not wheel-scrollable by the user, so only the page scroll is in scope. The test is written first and is expected to fail (the gap is known: the offset is pointer delta only); the expected fix is a `controller.ts` scroll listener, a passive listener on `window`, attached at press only when the pressing pointer's `pointerType` is mouse (a touch or pen press adds none; a mouse press that never becomes a drag adds no recompute; one Vitest assertion each) and removed after drop, cancel, `pointercancel` and `lostpointercapture`, with no fallback code (rule 6). It neither reads nor changes `gate.ts` state (busy/scroll semantics only defer FLIP work). If the test passes without a listener, record that in build-notes.md and add no code.

**Hover-peek re-anchor (F6).** A desktop Playwright case moves the layout under an open peek by the shifts `HoverPeek.svelte` re-places on: a viewport width change (`page.setViewportSize`, pointer staying on the cell) and the dictionary banner showing, forced by a failed load (`page.route('**/en*.txt', (route) => route.abort())`, as `e2e/drag.spec.ts` does, then `dictionary.showBanner`). Undo/Redo closes the peek (`commands.ts` `closeTransient`, F39), so a card-count change is not a shift. Before each measurement assert the peek is open, and after each shift assert its position changed, so the check is not vacuous. Once layout settles (poll or two frames), assert two things: the peek's bottom edge is within 1 px (subpixel rounding) of the hovered cell's label top edge, and the peek does not overlap the cell rect, per the DESIGN.md Components hover-peek paragraph (anchored directly above the cell, never covering it). The fixture keeps the above branch (`placeHoverPeek` flips below when there is no room above; a flip is not this case's concern). A viewport height change and a page scroll with a peek open are out of scope (no re-anchor or close added for them). A drag start closes the peek and leaving the cell closes it (EXPERIENCE.md). A re-anchor code fix is in scope only if the case fails.

**Bfcache hide flush (F7).** "Swallows a real back" means: the hide flush runs `controller.cancel()` (without `byBack`; it is not a Back) through `registerBeforeHide` (AD-9), then `pageshow` with `persisted` true, and the next real Back must pop the top surface instead of being consumed by a pending nav back (AD-13 `nav.ts` pending-back counter). The case must be able to fail: preconditions are a surface open or a drag live, in three variants, each asserting its own pass after `pageHide` then `pageShow({ persisted: true })`. Idle with the menu open: the next real Back pops the menu, nav depth drops by 1, no pending back is left. Mouse drag in progress (a fresh press on an unselected column tail; a selected-tail drag has nav depth 1): a drag cannot coexist with a modal surface, so this variant has no surface (nav depth 0); assert the drag was live before `pagehide`, the flush cancel left nav depth 0, and the next Back is not swallowed. Stale-owner halt: staleness is produced by writing a `wordcell:` key between `pageHide` and `pageShow` (`game.svelte.ts` `staleOwners()`); the blocking message and Reload show, the first Back is not consumed by a pending nav back, nav depth is unchanged and no pending back is left. For `page.goBack`, state the starting history (the entry count and URL expected after it) in the plan. Attempts in order: (1) the AD-17 `pageHide` / `pageShow({ persisted: true })` helpers (`e2e/helpers/lifecycle.ts`; `pageHide` dispatches `persisted: false`, so this catches only cancel side effects); (2) a real bfcache navigation in Playwright's Chromium, mandatory when (1) does not reproduce. Failing-first applies per variant; a variant that passes first time is dropped and noted in build-notes.md. A test built only on attempt (1) is committed as bfcache coverage only if it failed first. If neither reproduces it, one build-notes.md line records which attempts ran and the outcome (CAP-12 "not a bug", SPEC Assumptions) and no code changes. Any fix stays inside the AD-9/AD-13 contract (no `dispatch`, no UI import in shell).

**Tests.** Per AGENTS.md names start with the id; the failing-first run is recorded in the plan, never a committed red test. Each maps to the `rule-coverage.md` P6 row "A8 wheel, hover-peek re-anchor, bfcache hide flush" (CAP-12, kinds U, P6):

| Test | Kind, project | Name prefix |
| --- | --- | --- |
| Wheel during a mouse drag, tile and free-letter, plus the page-end no-op. Minimum assertions: faces transform = pointer delta + scroll delta; the Vitest fake rects translate with the scroll offset, so the asserted highlight and drop target are the recomputed ones and differ from the pre-scroll target, which is asserted no longer highlighted; a release with no `pointermove` after the wheel drops on the recomputed target, as does a release with the scroll offset changed but no `scroll` event dispatched; a wheel after press then a move crossing the drag threshold leaves no jump; after drop, cancel, `pointercancel` and `lostpointercapture` a later scroll triggers no recompute; one layout-originated scroll takes the same recompute. Vitest fakes the offsets (no layout); Playwright seeds enough height to overflow and uses `page.mouse.wheel` (the page-end case scrolls to the bottom first) | Vitest (`controller.test.ts`) and Playwright `desktop` | `AD-12` |
| Hover-peek re-anchor after the two shifts | Playwright `desktop` | `AD-12` |
| Bfcache hide flush then Back; exists only if reproduced (written failing first). The `android` run uses a real Back (`page.goBack`); an Esc variant runs on `desktop` only | Playwright (`android` first) | `AD-9` / `AD-13` |

A non-reproduction of the bfcache case is a build-notes.md line, not a test.

**Consumers.** The shared press and drop paths in `controller.ts` are touched, so the plan lists every existing drag test they reach (the `controller.test.ts` describe blocks and the e2e drag specs, including F34 band targeting, fly-back and parting) as the regression set kept green.

## Acceptance Criteria

Verify: npm run test:all is green with the wheel Vitest and desktop Playwright cases, the hover-peek re-anchor case passing, and either a failing-then-passing bfcache test or a build-notes line recording that it does not reproduce. No screens spec is added; `npm run test:screens` is a regression gate with baselines unchanged (Docker only, AGENTS.md).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-12), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Open question: whether the bfcache back reproduces at all in Playwright's Chromium. Resolves at build time with no owner input; a non-reproduction is the SPEC Assumption ("the hide-flush bfcache back (A8) may not reproduce"), recorded in build-notes.md.
- Interface: `controller.ts` gains a scroll listener, the expected fix for the failing wheel test (recorded in build-notes.md instead if the test passes without it). Touch drags are unchanged.
