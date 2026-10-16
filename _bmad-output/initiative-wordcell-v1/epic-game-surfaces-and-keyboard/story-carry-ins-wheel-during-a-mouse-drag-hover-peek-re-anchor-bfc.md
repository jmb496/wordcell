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

**Wheel during a mouse drag (F3).** The page scrolls on `window` (`layout.svelte.ts` listens there; the `[data-view-scroll]` sheet is modal and not a drag case). After a wheel scroll during a mouse drag no `pointermove` fires, so the dragged faces (pointer delta plus scroll delta), the highlight and the drop target are recomputed from the last pointer position against the post-scroll rects and the re-clipped visible band (AD-12, F34), and a release straight after the scroll drops on that recomputed target. This holds for tile and free-letter drags. A wheel that does not scroll (page end) changes nothing; touch drags are unchanged (mouse only). The test is written first and must fail (the gap is known: the offset is pointer delta only); the expected fix is a `controller.ts` scroll listener added at press and removed on drop and cancel, with no fallback code (rule 6), kept apart from `gate.ts`'s busy/scroll semantics (which only defer FLIP work). If the test passes without it, record that in build-notes.md instead.

**Hover-peek re-anchor (F6).** A desktop Playwright case moves the layout under an open peek by the shifts `HoverPeek.svelte` re-places on: a viewport width change, the dictionary banner showing, and the hovered cell's card count changing. After each, the peek's bottom stays within 2 px (a ticket choice, fix in the plan if rounding needs more) above the hovered cell's label, anchored directly above the cell per DESIGN.md Components (hover peek, line 530). A drag start closes the peek and leaving the cell closes it (EXPERIENCE.md). A re-anchor code fix is in scope only if the case fails.

**Bfcache hide flush (F7).** "Swallows a real back" means: the hide flush runs `controller.cancel()` through `registerBeforeHide` (AD-9), then `pageshow` with `persisted` true, and the next real Back or Esc must pop the top surface instead of being consumed by a pending nav back (AD-13 `nav.ts` pending-back counter). Attempts in order: (1) the AD-17 `pageHide` / `pageShow({ persisted: true })` helpers (`e2e/helpers/lifecycle.ts`); (2) a real bfcache navigation in Playwright's Chromium. If neither reproduces it, one build-notes.md line records the method and outcome (CAP-12 "not a bug", SPEC Assumptions) and no code changes. Any fix stays inside the AD-9/AD-13 contract (no `dispatch`, no UI import in shell).

**Tests.** Per AGENTS.md names start with the id; the failing-first run is recorded in the plan, never a committed red test. Each maps to the `rule-coverage.md` P6 row "A8 wheel, hover-peek re-anchor, bfcache hide flush" (CAP-12, kinds U, P6):

| Test | Kind, project | Name prefix |
| --- | --- | --- |
| Wheel during a mouse drag, tile and free-letter, plus the page-end no-op | Vitest (`controller.test.ts`) and Playwright `desktop` | `AD-12` |
| Hover-peek re-anchor after the three shifts | Playwright `desktop` | `AD-12` |
| Bfcache hide flush then Back/Esc | Playwright (`android` first) | `AD-9` / `AD-13` |

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
